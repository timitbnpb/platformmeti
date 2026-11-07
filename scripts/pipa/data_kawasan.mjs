// public/data/kawasan.json: KEK (kek.go.id, Dewan Nasional KEK) + kawasan industri bila ada sumber terbaca.
//   node scripts/pipa/data_kawasan.mjs ambil <dirKek> <dirHki>            (jaringan; kek.go.id robots Allow /, hki-industrialestate.com tanpa robots; jeda >= 2 dtk)
//   node scripts/pipa/data_kawasan.mjs bangun <dirKek> <dirHki> <tgl>     (tanpa jaringan; tanggal dari masukan)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const UA = 'METI-Network-research/0.1 (+https://platformmeti.timitbnpb.workers.dev)';
const SUMBER = {
  'hki-anggota': { id: 'hki-anggota', judul: 'Member Directory dan halaman anggota HKI', penerbit: 'Himpunan Kawasan Industri Indonesia (HKI)', tahun: 2026, url: 'https://hki-industrialestate.com/hki-member/' },
  'geoboundaries': { id: 'geoboundaries', judul: 'geoBoundaries ADM1/ADM2 Indonesia, pusat wilayah (data/geo/pusat-wilayah.json)', penerbit: 'geoBoundaries (William and Mary geoLab)', tahun: 2026, url: 'https://www.geoboundaries.org/' },
  'kek-go-id': { id: 'kek-go-id', judul: 'Peta Distribusi KEK (halaman tiap KEK)', penerbit: 'Sekretariat Jenderal Dewan Nasional KEK, Kemenko Perekonomian', tahun: 2026, url: 'https://kek.go.id/investment/distribution' } };
// Provinsi menurut alamat di halaman KEK (alamat resmi tiap KEK); nama sesuai public/data/wilayah.json.
export const PROVINSI = {
  'batam-tourism-and-international-healthcare': 'Kepulauan Riau', 'bumi-serpong-damai': 'Banten', 'industropolis-batang': 'Jawa Tengah',
  'kek-arun-lhokseumawe': 'Aceh', 'kek-batam-aero-technic': 'Kepulauan Riau', 'kek-bitung': 'Sulawesi Utara', 'kek-galang-batang': 'Kepulauan Riau',
  'kek-gresik': 'Jawa Timur', 'kek-kendal': 'Jawa Tengah', 'kek-kura-kura': 'Bali', 'kek-lido': 'Jawa Barat', 'kek-likupang': 'Sulawesi Utara',
  'kek-maloy-batuta': 'Kalimantan Timur', 'kek-mandalika': 'Nusa Tenggara Barat', 'kek-morotai': 'Maluku Utara', 'kek-nongsa': 'Kepulauan Riau',
  'kek-palu': 'Sulawesi Tengah', 'kek-sanur': 'Bali', 'kek-sei-mangkei': 'Sumatera Utara', 'kek-singhasari': 'Jawa Timur', 'kek-sorong': 'Papua Barat Daya',
  'kek-tanjung-kelayang': 'Kepulauan Bangka Belitung', 'kek-tanjung-lesung': 'Banten', setangga: 'Kalimantan Selatan', 'tanjung-sauh': 'Kepulauan Riau',
};
const SEKTOR = { Manufacturing: 'industri manufaktur', Service: 'jasa (pariwisata, kesehatan, pendidikan, digital)', Processing: 'pengolahan' };

export function luasHa(s) { // "2.886,7 ha" | "120.3 Ha" | "1.040 ha" | "2333,6 ha" | "1000"
  if (!/ha\s*$/i.test(String(s ?? '')) && !/^[\d.,]+$/.test(String(s ?? '').trim())) return null; // satuan lain (m2) tidak ditebak
  const t = String(s ?? '').replace(/ha/i, '').replace(/\s/g, ''); if (!t) return null;
  const n = t.includes(',') ? t.replace(/\./g, '').replace(',', '.') : /^\d{1,3}(\.\d{3})+$/.test(t) ? t.replace(/\./g, '') : t;
  const v = Number(n); return Number.isFinite(v) ? v : null;
}
export function urai(html) {
  const m = html.match(/<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/s); if (!m) return null;
  const q = JSON.parse(m[1]).props?.pageProps?.initialState?.['sez-regions']?.queries || {};
  const k = Object.keys(q).find((x) => x.startsWith('getDetailSezRegions')); const d = q[k]?.data?.data; if (!d?.slug) return null;
  return { slug: d.slug, nama: d.title, alamat: String(d.address || '').split(/\r?\n/)[0], lat: d.latitude, lng: d.longitude, kategori: d.category, dasar_hukum: d.legalBasis, pengelola: d.developer, luas: d.area, kegiatan: (d.investments || []).map((i) => i.title).slice(0, 6) };
}
const PROV_EN = { Aceh: 'Aceh', 'North Sumatera': 'Sumatera Utara', 'North Sumatra': 'Sumatera Utara', Riau: 'Riau', 'Riau Islands': 'Kepulauan Riau', 'Bangka Belitung': 'Kepulauan Bangka Belitung', 'West Sumatera': 'Sumatera Barat', Jambi: 'Jambi', 'South Sumatera': 'Sumatera Selatan', Lampung: 'Lampung', Banten: 'Banten', 'DKI Jakarta': 'DKI Jakarta', 'West Java': 'Jawa Barat', 'Central Java': 'Jawa Tengah', 'East Java': 'Jawa Timur', 'South Kalimantan': 'Kalimantan Selatan', 'Central Kalimantan': 'Kalimantan Tengah', 'West Kalimantan': 'Kalimantan Barat', 'East Kalimantan': 'Kalimantan Timur', 'North Kalimantan': 'Kalimantan Utara', 'North Sulawesi': 'Sulawesi Utara', 'Central Sulawesi': 'Sulawesi Tengah', 'South-East Sulawesi': 'Sulawesi Tenggara', 'South Sulawesi': 'Sulawesi Selatan', 'North Maluku': 'Maluku Utara' };
const teks = (h) => h.replace(/<script.*?<\/script>|<style.*?<\/style>/gs, '').replace(/<[^>]+>/g, '\n').split('\n').map((x) => x.replace(/&amp;/g, '&').replace(/&#0?39;|&#8217;/g, "'").trim()).filter(Boolean);
const provHki = (x) => PROV_EN[x.replace(/\s*\(.*\)$/, '')] ?? null;
export function uraiAnggota(html) {
  const t = teks(html); const i = t.indexOf('Back to Index'); if (i < 0) return null;
  const [, , prov, perusahaan, nama, kab, luas] = t.slice(i, i + 7);
  if (!provHki(prov) || !/^Regency\/City:/.test(kab || '')) return null;
  const l = (luas || '').match(/Total Land Area:\s*(.+)$/);
  return { provinsi: provHki(prov), perusahaan, nama, kab: kab.replace(/^Regency\/City:\s*/, ''), luas_ha: l ? luasHa(l[1]) : null };
}
export function uraiDirektori(html) { // judul provinsi muncul dua kali berurutan, lalu nama kawasan
  const t = teks(html); const a = t.indexOf("Join Indonesia's premier industrial estate network shaping the nation's industrial future."); const b = t.indexOf('HKI Members');
  if (a < 0 || b < 0) return []; const seg = t.slice(a + 1, b); const out = []; let prov = null;
  for (let k = 0; k < seg.length; k++) {
    if (provHki(seg[k]) && seg[k + 1] === seg[k]) { prov = provHki(seg[k]); k++; continue; }
    if (prov && !(provHki(seg[k]) && seg[k + 1] === seg[k])) out.push({ provinsi: prov, nama: seg[k] });
  }
  return out;
}
const norm = (x) => String(x).toLowerCase().replace(/kawasan industri|industrial estate|industrial park|industrial town|\bkawasan\b/g, '').replace(/[^a-z0-9]+/g, '');
export function pusatKab(kab, prov, adm2) { // nama kabupaten/kota -> pusat geoBoundaries (lebih dulu yang provinsinya cocok)
  const n = kab.toLowerCase().replace(/^kota /, '');
  const c = adm2.filter((a) => a.provinsi === prov && (a.nama === n || a.nama === 'kota ' + n || a.nama === 'kabupaten ' + n || a.nama.replace(/^(kota|kabupaten) /, '') === n));
  return c.length ? c.sort((x, y) => (x.tipe === 'kabupaten' ? -1 : 1))[0] : null;
}
export function bangunHki(anggota, direktori, adm2) {
  const baris = []; const ada = new Set();
  for (const a of anggota) {
    const k = norm(a.nama) + '|' + a.perusahaan; if (ada.has(k)) continue; ada.add(k);
    const pk = pusatKab(a.kab, a.provinsi, adm2);
    baris.push({
      id: 'ki_' + norm(a.nama).slice(0, 24) + '_' + norm(a.perusahaan).slice(0, 8), jenis: 'kawasan-industri', nama: a.nama, provinsi: a.provinsi, kabupaten_kota: a.kab,
      lat: pk ? +pk.lat.toFixed(4) : null, lng: pk ? +pk.lng.toFixed(4) : null, presisi: pk ? 'pusat kabupaten/kota (geoBoundaries), bukan lokasi kawasan' : null,
      sektor: 'kawasan industri (serbaguna)', status: 'anggota HKI', pengelola: a.perusahaan, luas_ha: a.luas_ha, luas_perlu_tinjau: a.luas_ha > 20000 ? true : undefined,
      sumber_id: 'hki-anggota', tahun: 2026, url: 'https://hki-industrialestate.com/hki-member/', tingkat_bukti: 'resmi',
    });
  }
  const dikenal = new Set(anggota.map((a) => norm(a.nama)));
  for (const d of direktori) {
    const k = norm(d.nama); if (!k || dikenal.has(k) || [...dikenal].some((x) => x.length > 5 && (x.includes(k) || k.includes(x)))) continue; dikenal.add(k);
    baris.push({ id: 'ki_' + k.slice(0, 24) + '_dir', jenis: 'kawasan-industri', nama: d.nama, provinsi: d.provinsi, kabupaten_kota: null, lat: null, lng: null, presisi: null, sektor: 'kawasan industri (serbaguna)', status: 'tercantum di direktori HKI', pengelola: null, luas_ha: null, sumber_id: 'hki-anggota', tahun: 2026, url: 'https://hki-industrialestate.com/hki-member/', tingkat_bukti: 'resmi' });
  }
  return baris.sort((a, b) => a.id.localeCompare(b.id));
}
export function bangun(mentah, tanggal, ki = []) {
  const baris = mentah.map((r) => ({
    id: 'kek_' + r.slug.replace(/^kek-/, ''), jenis: 'kek', nama: 'KEK ' + r.nama, provinsi: PROVINSI[r.slug] ?? null, alamat: r.alamat,
    lat: +Number(r.lat).toFixed(5), lng: +Number(r.lng).toFixed(5), sektor: SEKTOR[r.kategori] ?? r.kategori, kegiatan: r.kegiatan,
    status: 'ditetapkan', dasar_hukum: r.dasar_hukum, pengelola: r.pengelola, luas_ha: luasHa(r.luas),
    sumber_id: 'kek-go-id', tahun: 2026, url: 'https://kek.go.id/investment/distribution/' + r.slug, tingkat_bukti: 'resmi',
  })).sort((a, b) => a.id.localeCompare(b.id));
  baris.push(...ki);
  const per = {}; for (const b of baris) per[b.provinsi] = (per[b.provinsi] || 0) + 1;
  return {
    meta: {
      diperbarui: tanggal, jumlah: baris.length, jumlah_kek: baris.length - ki.length, jumlah_kawasan_industri: ki.length, jumlah_ki_bertitik: ki.filter((x) => x.lat != null).length, per_provinsi: Object.fromEntries(Object.entries(per).sort(([a], [b]) => a.localeCompare(b))),
      celah: [
        'Status operasi tiap KEK (beroperasi atau belum) tidak ada di halaman kek.go.id; "ditetapkan" berarti sudah berdasar Peraturan Pemerintah.',
        'Kawasan industri: sumber Kemenperin (kemenperin.go.id) 502 Bad Gateway saat panen 7 Nov 2026, jadi daftar memakai Member Directory HKI (anggota, bukan seluruh ~180 kawasan nasional); koordinat hanya pusat kabupaten/kota, bukan lokasi kawasan. Baris tanpa halaman anggota hanya nama dan provinsi (lat/lng kosong). Status operasi dan sektor khusus tidak tersedia.',
        'Luas KEK Arun Lhokseumawe di halaman resmi tertulis "66.400 m2" (janggal untuk kawasan industri); dikosongkan, tidak ditebak.',
        'Koordinat = titik kantor/pengelola dari halaman KEK, bukan batas poligon; provinsi dipetakan dari alamat halaman KEK.',
      ],
    },
    sumber: Object.values(SUMBER).filter((x) => x.id !== 'geoboundaries' || ki.some((k) => k.lat != null)), baris,
  };
}
async function unduh(url, f) {
  const r = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(30000) });
  if (!r.ok) { console.log('gagal', url, r.status); if (r.status === 403 || r.status === 429) process.exit(2); return false; }
  fs.writeFileSync(f, await r.text()); console.log('ok', url); await new Promise((x) => setTimeout(x, 2200)); return true;
}
async function ambil(dirKek, dirHki) {
  fs.mkdirSync(dirKek, { recursive: true }); fs.mkdirSync(dirHki, { recursive: true });
  const robots = await (await fetch('https://kek.go.id/robots.txt', { headers: { 'User-Agent': UA } })).text();
  if (/Disallow:\s*\/\s*$/m.test(robots)) throw new Error('robots melarang');
  for (const s of Object.keys(PROVINSI)) await unduh('https://kek.go.id/investment/distribution/' + s, path.join(dirKek, s + '.html'));
  await unduh('https://hki-industrialestate.com/hki-member/', path.join(dirHki, '_direktori.html'));
  const slugs = [...new Set([...fs.readFileSync(path.join(dirHki, '_direktori.html'), 'utf8').matchAll(/hki-industrialestate\.com\/member\/([^"\/]+)\//g)].map((m) => m[1]))].sort();
  for (const sl of slugs) await unduh(`https://hki-industrialestate.com/member/${sl}/`, path.join(dirHki, sl + '.html'));
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [cmd, dirKek, dirHki, tgl] = process.argv.slice(2);
  if (cmd === 'ambil') await ambil(dirKek, dirHki);
  else if (cmd === 'bangun') {
    const m = fs.readdirSync(dirKek).filter((f) => f.endsWith('.html')).sort().map((f) => urai(fs.readFileSync(path.join(dirKek, f), 'utf8'))).filter(Boolean);
    const ang = fs.readdirSync(dirHki).filter((f) => f.endsWith('.html') && !f.startsWith('_')).sort().map((f) => uraiAnggota(fs.readFileSync(path.join(dirHki, f), 'utf8'))).filter(Boolean);
    const dir = uraiDirektori(fs.readFileSync(path.join(dirHki, '_direktori.html'), 'utf8'));
    const adm2 = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/geo/pusat-wilayah.json'), 'utf8')).adm2;
    const ki = bangunHki(ang, dir, adm2);
    fs.writeFileSync(path.join(ROOT, 'public/data/kawasan.json'), JSON.stringify(bangun(m, tgl, ki)) + '\n'); console.log(m.length, 'KEK', ki.length, 'KI');
  } else console.log('pakai: ambil <dirKek> <dirHki> | bangun <dirKek> <dirHki> <tgl>');
}
