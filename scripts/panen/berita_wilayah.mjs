// Pengayaan berita: wilayah (provinsi/kabupaten), proyek, dan regulasi yang disebut.
// Teks pencocokan = judul + ringkasan (og:description/RSS, disimpan di data-panen/berita/ringkas.json, TIDAK pernah ke public; lihat berita_foto.mjs).
// Dipanggil dari scripts/pipa/potret.mjs tiap bangun (perkaya) dan bisa dijalankan sendiri: node scripts/panen/berita_wilayah.mjs
// Nama pendek (<= 5 huruf) atau ambigu butuh awalan "Kab./Kabupaten/Kota". Proyek bernama dikenali dari nama (>= 16 huruf) dan memberi provinsinya.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const AKAR = fileURLToPath(new URL('../..', import.meta.url));
const pusat = JSON.parse(readFileSync(AKAR + 'data/geo/pusat-wilayah.json', 'utf8'));
const norm = (s) => ' ' + String(s).normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^0-9a-z]+/g, ' ').trim() + ' ';
const SINGKAT = { kaltim: 'Kalimantan Timur', kalsel: 'Kalimantan Selatan', kalbar: 'Kalimantan Barat', kalteng: 'Kalimantan Tengah', kaltara: 'Kalimantan Utara', sumut: 'Sumatera Utara', sumbar: 'Sumatera Barat', sumsel: 'Sumatera Selatan', sultra: 'Sulawesi Tenggara', sulsel: 'Sulawesi Selatan', sulteng: 'Sulawesi Tengah', sulut: 'Sulawesi Utara', sulbar: 'Sulawesi Barat', jabar: 'Jawa Barat', jateng: 'Jawa Tengah', jatim: 'Jawa Timur', ntt: 'Nusa Tenggara Timur', ntb: 'Nusa Tenggara Barat' };

const prov = Object.entries(pusat.adm1).map(([nama, v]) => ({ nama, n: norm(nama), lat: v.lat, lng: v.lng }));
const provByNama = new Map(prov.map((p) => [p.nama, p]));
const cacahNama = {}; for (const k of pusat.adm2) cacahNama[k.nama] = (cacahNama[k.nama] || 0) + 1;
const kab = pusat.adm2.map((k) => ({ ...k, n: norm(k.asli), kuat: k.nama.length >= 6 && cacahNama[k.nama] === 1, awalan: new RegExp(` (kab|kabupaten|kota) ${k.nama} `) }));

/** Wilayah yang disebut di satu teks (kabupaten dahulu, lalu provinsi yang belum terwakili). */
export function wilayahDari(teks) {
  const n = norm(teks), hasil = new Map();
  for (const k of kab) if (n.includes(k.n) && (k.kuat || k.awalan.test(n))) hasil.set(k.provinsi + '|' + k.asli, { prov: k.provinsi, kab: k.asli, lat: k.lat, lng: k.lng });
  const ada = () => new Set([...hasil.values()].map((x) => x.prov));
  for (const p of prov) if (n.includes(p.n) && !ada().has(p.nama)) hasil.set(p.nama, { prov: p.nama, lat: p.lat, lng: p.lng });
  for (const [s, nama] of Object.entries(SINGKAT)) { const p = provByNama.get(nama); if (p && n.includes(' ' + s + ' ') && !ada().has(nama)) hasil.set(nama, { prov: nama, lat: p.lat, lng: p.lng }); }
  return [...hasil.values()];
}

const ALIAS = [ // [pola, id regulasi]
  [/\bRUU\s*(EBET|EBT|Energi Baru)/i, 'lokal-431'], [/\bPerpres\s*EBT\b/i, 'perpres-112-2022'], [/\bUU\s*Cipta Kerja\b|\bomnibus law\b/i, 'uu-6-2023'],
  [/\bKebijakan Energi Nasional\b/i, 'pp-40-2025'], [/\bnilai ekonomi karbon\b|\bNEK\b/i, 'perpres-110-2025'], [/\bPSEL\b|sampah (menjadi|jadi) (energi|listrik)/i, 'perpres-109-2025'],
  [/\bUU\s*Panas Bumi\b/i, 'uu-21-2014'], [/\bUU\s*Ketenagalistrikan\b/i, 'uu-30-2009'], [/\bPLTS atap\b|\bPermen ESDM 2\/2024\b/i, 'permen-esdm-2-2024'],
];
const RX_REG = /\b(UU|Perpres|PP|Permen|Perppu|Keppres|Inpres|Kepmen)\s*(ESDM\s*)?(?:No\.?|Nomor)?\s*(\d{1,3})\s*(?:\/|\s*Tahun\s*)\s*(\d{4})/gi;

/** Konteks pencocokan dari baris publik proyek.json dan regulasi.json. */
export function bangunKonteks({ proyek, regulasi }) {
  const regById = new Set(regulasi.map((r) => r.id));
  const namaProyek = proyek.filter((p) => p.lokasi?.provinsi && provByNama.has(p.lokasi.provinsi)).map((p) => ({ id: p.id, prov: p.lokasi.provinsi, n: norm(p.nama) })).filter((x) => x.n.trim().length >= 16);
  return { regById, namaProyek };
}

/** Hasil pengayaan satu berita: { wilayah, proyek_ids, regulasi_ids } (judul diutamakan; ringkasan hanya menambah). */
export function perkaya(judul, ringkas, ctx) {
  const teks = judul + ' . ' + (ringkas || ''), n = norm(teks);
  const w = new Map();
  for (const x of [...wilayahDari(judul), ...wilayahDari(ringkas || '')]) { const k = x.prov + '|' + (x.kab || ''); if (!w.has(k)) w.set(k, x); }
  const proyek_ids = [];
  for (const p of ctx.namaProyek) if (n.includes(p.n)) { proyek_ids.push(p.id); const pv = provByNama.get(p.prov); if (![...w.values()].some((x) => x.prov === p.prov)) w.set(p.prov + '|', { prov: p.prov, lat: pv.lat, lng: pv.lng }); }
  const reg = new Set();
  for (const m of teks.matchAll(RX_REG)) { const j = m[1].toLowerCase(), id = [`${j}-${m[3]}-${m[4]}`, `${j}-esdm-${m[3]}-${m[4]}`, `${j === 'kepmen' ? 'kepmen-esdm' : j}-${m[3]}-${m[4]}`].find((i) => ctx.regById.has(i)); if (id) reg.add(id); }
  for (const [pola, id] of ALIAS) if (pola.test(teks) && ctx.regById.has(id)) reg.add(id);
  return { wilayah: [...w.values()].slice(0, 4), proyek_ids, regulasi_ids: [...reg] };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const pub = (f) => JSON.parse(readFileSync(AKAR + 'public/data/' + f, 'utf8'));
  const d = pub('berita.json'), ctx = bangunKonteks({ proyek: pub('proyek.json').baris, regulasi: pub('regulasi.json').baris });
  const jr = AKAR + 'data-panen/berita/ringkas.json', ringkas = existsSync(jr) ? JSON.parse(readFileSync(jr, 'utf8')) : {};
  let nw = 0, nr = 0, np = 0, nrk = 0;
  for (const r of d.baris) {
    const o = perkaya(r.judul, ringkas[r.id], ctx); if (ringkas[r.id]) nrk++;
    o.wilayah.length ? (r.wilayah = o.wilayah, nw++) : delete r.wilayah;
    o.regulasi_ids.length ? (r.regulasi_ids = o.regulasi_ids, nr++) : delete r.regulasi_ids;
    if (o.proyek_ids.length) { r.proyek_ids = [...new Set([...(r.proyek_ids || []), ...o.proyek_ids])]; np++; }
  }
  writeFileSync(AKAR + 'public/data/berita.json', JSON.stringify(d));
  console.log(`ringkasan ${nrk}/${d.baris.length}; wilayah ${nw} (${Math.round(nw / d.baris.length * 100)}%), proyek ${np}, regulasi ${nr}`);
}
