// Pembangkit Indonesia dari OpenStreetMap (ODbL) -> public/data/pembangkit_osm.json, dicocokkan ke proyek.json.
// Pakai: node scripts/pipa/pembangkit_osm.mjs --ambil   (kueri Overpass per sumber, jeda >= 5 dtk, simpan data-panen/osm-pembangkit.json)
//        node scripts/pipa/pembangkit_osm.mjs           (bangun dari cache lokal tanpa jaringan)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cocokkan, siapkanProyek } from './cocok_proyek.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CACHE = path.join(ROOT, 'data-panen/osm-pembangkit.json');
const UA = 'METI-Network-research/0.1 (+https://platformmeti.timitbnpb.workers.dev)';
const HOSTS = ['https://overpass-api.de/api/interpreter', 'https://overpass.private.coffee/api/interpreter'];
export const TERBARUKAN = ['solar', 'wind', 'hydro', 'geothermal', 'biomass', 'biogas', 'waste', 'battery'];
export const KONTEKS = ['coal', 'gas', 'diesel'];
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

export function kapasitasMw(v) { // "10 MW", "500 kW", "1.5 GW", "2000000" (W); null bila tak terbaca
  if (v == null) return null;
  const m = String(v).replace(',', '.').match(/^\s*([\d.]+)\s*(gw|mw|kw|w)?\s*$/i);
  if (!m) return null;
  const n = parseFloat(m[1]); if (!isFinite(n)) return null;
  const f = { gw: 1000, mw: 1, kw: 1e-3, w: 1e-6 }[(m[2] || 'w').toLowerCase()];
  return +(n * f).toFixed(4);
}
export function ubahElemen(e) {
  const t = e.tags || {}; const lat = e.lat ?? e.center?.lat, lng = e.lon ?? e.center?.lon;
  if (lat == null || lng == null) return null;
  const jenis = t.power; const sumber = t['plant:source'] || t['generator:source'];
  const tek = String(sumber || '').split(';')[0].trim();
  if (!TERBARUKAN.includes(tek) && !KONTEKS.includes(tek)) return null;
  const mw = kapasitasMw(t['plant:output:electricity'] ?? t['generator:output:electricity']);
  return { osm_id: e.type + '/' + e.id, jenis, sumber: tek, nama: t.name || t['name:id'] || t['name:en'] || null, kapasitas_mw: mw, operator: t.operator || null, lat: +lat.toFixed(5), lng: +lng.toFixed(5) };
}

async function overpass(q) {
  for (let i = 0; i < 5; i++) {
    for (const h of HOSTS) {
      try {
        const r = await fetch(h, { method: 'POST', headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'data=' + encodeURIComponent(q), signal: AbortSignal.timeout(200000) });
        if (r.ok) return await r.json();
        console.error(h, r.status);
      } catch (err) { console.error(h, String(err).slice(0, 80)); }
      await dormir(10000);
    }
    await dormir(20000 * (i + 1));
  }
  throw new Error('Overpass gagal');
}
async function ambil() {
  const lama = fs.existsSync(CACHE) ? JSON.parse(fs.readFileSync(CACHE, 'utf8')) : { hasil: {} }; // lanjutkan bila terputus
  const hasil = lama.hasil; let ts = lama.osm_timestamp || null;
  for (const s of [...TERBARUKAN, ...KONTEKS]) {
    if (hasil[s]) continue;
    const q = `[out:json][timeout:180];area["ISO3166-1"="ID"][admin_level=2]->.a;(nwr["power"="plant"]["plant:source"="${s}"](area.a);nwr["power"="generator"]["generator:source"="${s}"][~"^(name|generator:output:electricity)$"~"."](area.a););out center tags;`;
    const j = await overpass(q); ts = j.osm3s?.timestamp_osm_base || ts;
    hasil[s] = j.elements; console.error(s, j.elements.length);
    fs.mkdirSync(path.dirname(CACHE), { recursive: true });
    fs.writeFileSync(CACHE, JSON.stringify({ osm_timestamp: ts, hasil }));
    await dormir(8000);
  }
}

export function bangun(cache, proyek) {
  const daftar = siapkanProyek(proyek); const lihat = new Map();
  for (const els of Object.values(cache.hasil)) for (const e of els) {
    const b = ubahElemen(e); if (!b || lihat.has(b.osm_id)) continue;
    // generator tunggal (turbin/panel) tanpa nama dan tanpa kapasitas tidak informatif: dihitung, tidak disimpan
    if (b.jenis === 'generator' && !b.nama && b.kapasitas_mw == null) continue;
    lihat.set(b.osm_id, b);
  }
  const baris = [...lihat.values()].sort((a, b) => a.osm_id.localeCompare(b.osm_id, 'en', { numeric: true })).map((b) => {
    const terbarukan = TERBARUKAN.includes(b.sumber);
    const c = terbarukan ? cocokkan({ nama: b.nama, lat: b.lat, lng: b.lng, tek: b.sumber }, daftar) : null;
    return { ...b, konteks: !terbarukan, proyek_id: c?.proyek_id ?? null, kecocokan: c?.kecocokan ?? null, jarak_km: c?.jarak_km ?? null, kandidat_proyek_baru: terbarukan && !c && b.jenis === 'plant' && (b.kapasitas_mw ?? 0) >= 1 };
  });
  const miss = [...TERBARUKAN, ...KONTEKS].filter((k) => !cache.hasil[k]);
  const tanggal = (cache.osm_timestamp || '').slice(0, 10);
  return {
    lapis: 'publik',
    sumber: [{ id: 'osm', judul: 'OpenStreetMap, objek power=plant/generator Indonesia (Overpass API)', penerbit: 'Kontributor OpenStreetMap', tahun: +tanggal.slice(0, 4), url: 'https://www.openstreetmap.org/copyright', lisensi: 'ODbL 1.0 (c) OpenStreetMap contributors; data turunan wajib atribusi dan berbagi-serupa' }],
    meta: {
      diperbarui: tanggal, jumlah: baris.length, osm_timestamp: cache.osm_timestamp,
      tertaut_proyek: baris.filter((b) => b.proyek_id).length, kandidat_proyek_baru: baris.filter((b) => b.kandidat_proyek_baru).length,
      sumber_belum_terambil: [...TERBARUKAN, ...KONTEKS].filter((k) => !cache.hasil[k]),
      celah: [...(miss.length ? ['Belum terambil (Overpass tak merespons): ' + miss.join(', ') + '. Jalankan ulang dengan --ambil untuk melengkapi (lanjut otomatis).'] : []), 'Kapasitas hanya ada bila pemeta mengisi tag output; banyak objek tanpa kapasitas (null).', 'Cakupan OSM tidak lengkap dan tidak resmi; bukan pengganti data PLN/ESDM.', 'Proyek METI berpresisi provinsi/kabupaten adalah titik pusat wilayah: tautannya hanya lewat nama (kecocokan "nama-saja", lemah).', 'Generator tunggal tanpa tag name dan tanpa tag kapasitas tidak diambil (disaring di kueri Overpass).', 'Hanya nilai tag sumber persis (mis. solar), bukan kombinasi "solar;wind".'],
    },
    baris,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--ambil')) await ambil();
  const cache = JSON.parse(fs.readFileSync(CACHE, 'utf8'));
  const proyek = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/proyek.json'), 'utf8')).baris;
  const out = bangun(cache, proyek);
  fs.writeFileSync(path.join(ROOT, 'public/data/pembangkit_osm.json'), JSON.stringify(out) + '\n');
  console.error('baris', out.meta.jumlah, 'tertaut', out.meta.tertaut_proyek, 'kandidat', out.meta.kandidat_proyek_baru);
}
