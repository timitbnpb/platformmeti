// Waduk/bendungan Indonesia dari OSM (ODbL) + potensi PLTS terapung EST -> public/data/waduk.json.
// Pakai: node scripts/pipa/waduk.mjs --ambil  (Overpass per wilayah + batas provinsi geoBoundaries ke data-panen/, jeda >= 8 dtk)
//        node scripts/pipa/waduk.mjs          (bangun dari cache lokal)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { jarakKm } from './cocok_proyek.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CACHE = path.join(ROOT, 'data-panen/osm-waduk.json');
const ADM1 = path.join(ROOT, 'data-panen/adm1.geojson');
const UA = 'METI-Network-research/0.1 (+https://platformmeti.timitbnpb.workers.dev)';
const HOSTS = ['https://overpass-api.de/api/interpreter', 'https://overpass.private.coffee/api/interpreter'];
const URL_ADM1 = 'https://github.com/wmgeolab/geoBoundaries/raw/9469f09/releaseData/gbOpen/IDN/ADM1/geoBoundaries-IDN-ADM1_simplified.geojson';
// Asumsi potensi EST (dicatat di meta): 5 persen luas genangan tertutup panel, 1 MWp per hektare tertutup.
export const ASUMSI = { persen_genangan: 5, mwp_per_ha: 1 };
export const potensiMwp = (ha) => +(ha * (ASUMSI.persen_genangan / 100) * ASUMSI.mwp_per_ha).toFixed(2);
// Wilayah (S,W,N,E) agar tiap kueri kecil; tumpang-tindih dibuang lewat osm_id.
export const WILAYAH = { sumatera: [-6.5, 94.5, 6.2, 106.2], jawa_bali: [-9.0, 105.0, -5.8, 116.0], kalimantan: [-4.3, 108.5, 4.5, 119.5], sulawesi: [-6.5, 118.5, 2.0, 125.5], nusa_tenggara: [-11.2, 114.5, -8.0, 127.0], maluku_papua: [-9.5, 124.5, 3.0, 141.5] };
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

// Luas poligon tertutup (ha) dengan proyeksi ekuirektangular lokal + sepatu tali.
export function luasHa(geom) {
  if (!geom || geom.length < 4) return 0;
  const lat0 = geom.reduce((s, p) => s + p.lat, 0) / geom.length, kx = 111.32 * Math.cos(lat0 * Math.PI / 180), ky = 110.574;
  let a = 0; for (let i = 0; i < geom.length - 1; i++) a += (geom[i].lon * kx) * (geom[i + 1].lat * ky) - (geom[i + 1].lon * kx) * (geom[i].lat * ky);
  return Math.abs(a) / 2 * 100; // km2 -> ha
}
const tutup = (g) => g && g.length > 3 && g[0].lat === g[g.length - 1].lat && g[0].lon === g[g.length - 1].lon;
function cincin(e) { // daftar cincin tertutup luar
  if (e.type === 'way') return tutup(e.geometry) ? [e.geometry] : [];
  return (e.members || []).filter((m) => m.type === 'way' && m.role === 'outer' && tutup(m.geometry)).map((m) => m.geometry);
}
export function titikDalam(lat, lng, geom) { // geom: GeoJSON Polygon|MultiPolygon
  const polys = geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates; let di = false;
  for (const poly of polys) {
    let d = false; for (const ring of poly) { for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const [xi, yi] = ring[i], [xj, yj] = ring[j]; if ((yi > lat) !== (yj > lat) && lng < (xj - xi) * (lat - yi) / (yj - yi) + xi) d = !d; } }
    if (d) di = !di;
  }
  return di;
}
export function provinsiDari(lat, lng, adm1, peta) {
  const f = adm1.features.find((x) => titikDalam(lat, lng, x.geometry));
  return f ? (peta[f.properties.shapeName] || f.properties.shapeName) : null;
}

async function overpass(q) {
  for (let i = 0; i < 5; i++) {
    for (const h of HOSTS) {
      try {
        const r = await fetch(h, { method: 'POST', headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'data=' + encodeURIComponent(q), signal: AbortSignal.timeout(240000) });
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
  const lama = fs.existsSync(CACHE) ? JSON.parse(fs.readFileSync(CACHE, 'utf8')) : { hasil: {} };
  const hasil = lama.hasil; let ts = lama.osm_timestamp || null;
  for (const [k, bb] of Object.entries(WILAYAH)) {
    if (hasil[k]) continue;
    const b = bb.join(',');
    const q = `[out:json][timeout:200][maxsize:1073741824];(way["water"="reservoir"](${b});relation["water"="reservoir"](${b});way["landuse"="reservoir"](${b});relation["landuse"="reservoir"](${b}););out geom tags;` +
      `(nwr["waterway"="dam"]["name"](${b});nwr["man_made"="dam"]["name"](${b}););out center tags;`;
    const j = await overpass(q); ts = j.osm3s?.timestamp_osm_base || ts; hasil[k] = j.elements; console.error(k, j.elements.length);
    fs.mkdirSync(path.dirname(CACHE), { recursive: true }); fs.writeFileSync(CACHE, JSON.stringify({ osm_timestamp: ts, hasil }));
    await dormir(10000);
  }
  const r = await fetch(URL_ADM1, { headers: { 'User-Agent': UA }, redirect: 'follow' }); if (!r.ok) throw new Error('adm1 ' + r.status);
  fs.writeFileSync(ADM1, await r.text());
}

export function bangun(cache, adm1, peta, { minHa = 20 } = {}) {
  const waduk = new Map(), bendungan = new Map();
  for (const els of Object.values(cache.hasil)) for (const e of els) {
    const id = e.type + '/' + e.id, t = e.tags || {};
    if (t.waterway === 'dam' || t.man_made === 'dam') {
      const lat = e.lat ?? e.center?.lat ?? e.geometry?.[0]?.lat, lng = e.lon ?? e.center?.lon ?? e.geometry?.[0]?.lon;
      if (t.name && lat != null) bendungan.set(id, { nama: t.name, lat, lng });
      continue;
    }
    if (waduk.has(id)) continue;
    const ringkas = cincin(e); const ha = ringkas.reduce((s, g) => s + luasHa(g), 0);
    const g0 = ringkas[0] || e.geometry; if (!g0 || !g0.length) continue;
    const lat = g0.reduce((s, p) => s + p.lat, 0) / g0.length, lng = g0.reduce((s, p) => s + p.lon, 0) / g0.length;
    if (!(ha >= minHa) && !t.name) continue;
    if (ha < 1) continue;
    waduk.set(id, { osm_id: id, nama: t.name || null, luas_ha: +ha.toFixed(1), lat: +lat.toFixed(5), lng: +lng.toFixed(5), tags_air: t.water || t.landuse });
  }
  const dams = [...bendungan.values()];
  const baris = [...waduk.values()].filter((w) => w.luas_ha >= minHa).sort((a, b) => b.luas_ha - a.luas_ha).map((w) => {
    let dekat = null, dm = 3; for (const d of dams) { const k = jarakKm(w.lat, w.lng, d.lat, d.lng); if (k < dm) { dm = k; dekat = d; } }
    return { ...w, nama_bendungan: dekat?.nama ?? null, provinsi: provinsiDari(w.lat, w.lng, adm1, peta), potensi_plts_terapung_mwp_est: potensiMwp(w.luas_ha), sumber_id: 'osm' };
  });
  const tanggal = (cache.osm_timestamp || '').slice(0, 10);
  return {
    lapis: 'publik',
    sumber: [
      { id: 'osm', judul: 'OpenStreetMap, water=reservoir / landuse=reservoir + waterway=dam (Overpass API)', penerbit: 'Kontributor OpenStreetMap', tahun: +tanggal.slice(0, 4), url: 'https://www.openstreetmap.org/copyright', lisensi: 'ODbL 1.0 (c) OpenStreetMap contributors' },
      { id: 'geoboundaries-adm1', judul: 'geoBoundaries gbOpen IDN ADM1 (disederhanakan), untuk penentuan provinsi', penerbit: 'geoBoundaries / William & Mary geoLab', tahun: 2023, url: 'https://www.geoboundaries.org/api/current/gbOpen/IDN/ADM1/', lisensi: 'ODbL 1.0' },
    ],
    meta: {
      diperbarui: tanggal, jumlah: baris.length, luas_total_ha: +baris.reduce((s, w) => s + w.luas_ha, 0).toFixed(0), potensi_total_mwp_est: +baris.reduce((s, w) => s + w.potensi_plts_terapung_mwp_est, 0).toFixed(0),
      asumsi_est: `Potensi PLTS terapung = luas genangan x ${ASUMSI.persen_genangan}% tertutup panel x ${ASUMSI.mwp_per_ha} MWp/ha (ESTIMASI kasar, bukan studi kelayakan; tanpa kedalaman, fluktuasi muka air, atau jarak ke gardu).`,
      ambang_luas_ha: minHa,
      celah: ['Data bendungan PUPR/SDA tidak diambil: situs sda.pu.go.id tidak menyediakan daftar/berkas data terbuka yang bisa dibaca mesin; nama bendungan hanya dari tag OSM dalam radius 3 km.', `Hanya poligon >= ${minHa} ha; reservoir bermultipoligon dengan cincin luar terputus tidak dihitung luasnya; lubang/pulau tidak dikurangkan.`, 'Provinsi dari batas geoBoundaries 2017 (34 provinsi): provinsi pemekaran Papua belum ada; titik pesisir bisa null.', 'Luas poligon OSM = muka air pada saat pemetaan, bukan luas genangan normal resmi.'],
    },
    baris,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--ambil')) await ambil();
  const pw = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/geo/pusat-wilayah.json'), 'utf8')).adm1;
  const peta = Object.fromEntries(Object.entries(pw).map(([k, v]) => [v.asli, k]));
  const out = bangun(JSON.parse(fs.readFileSync(CACHE, 'utf8')), JSON.parse(fs.readFileSync(ADM1, 'utf8')), peta);
  fs.writeFileSync(path.join(ROOT, 'public/data/waduk.json'), JSON.stringify(out) + '\n');
  console.error('waduk', out.meta.jumlah, 'ha', out.meta.luas_total_ha, 'mwp', out.meta.potensi_total_mwp_est);
}
