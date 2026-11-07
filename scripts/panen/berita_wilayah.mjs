// Wilayah yang disebut di judul berita: cocokkan nama provinsi (adm1) dan kabupaten/kota (adm2) dari data/geo/pusat-wilayah.json.
// Pakai: node scripts/panen/berita_wilayah.mjs. Menulis `wilayah:[{prov, kab?, lat, lng}]` ke tiap baris public/data/berita.json (idempoten).
// Hanya judul (tanpa isi berita). Nama pendek (<= 5 huruf) atau ambigu butuh awalan "Kab./Kabupaten/Kota". Tanpa data pribadi.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const AKAR = fileURLToPath(new URL('../..', import.meta.url));
const J = AKAR + 'public/data/berita.json';
const pusat = JSON.parse(readFileSync(AKAR + 'data/geo/pusat-wilayah.json', 'utf8'));
const norm = (s) => ' ' + String(s).normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^0-9a-z]+/g, ' ').trim() + ' ';
const SINGKAT = { kaltim: 'Kalimantan Timur', kalsel: 'Kalimantan Selatan', kalbar: 'Kalimantan Barat', kalteng: 'Kalimantan Tengah', kaltara: 'Kalimantan Utara', sumut: 'Sumatera Utara', sumbar: 'Sumatera Barat', sumsel: 'Sumatera Selatan', sultra: 'Sulawesi Tenggara', sulsel: 'Sulawesi Selatan', sulteng: 'Sulawesi Tengah', sulut: 'Sulawesi Utara', sulbar: 'Sulawesi Barat', jabar: 'Jawa Barat', jateng: 'Jawa Tengah', jatim: 'Jawa Timur', ntt: 'Nusa Tenggara Timur', ntb: 'Nusa Tenggara Barat', diy: 'Daerah Istimewa Yogyakarta', jogja: 'Daerah Istimewa Yogyakarta', yogyakarta: 'Daerah Istimewa Yogyakarta' };

const prov = Object.entries(pusat.adm1).map(([nama, v]) => ({ nama, n: norm(nama), lat: v.lat, lng: v.lng }));
const provNama = new Map(prov.map((p) => [norm(p.nama), p.nama]));
const cacahNama = {}; for (const k of pusat.adm2) cacahNama[k.nama] = (cacahNama[k.nama] || 0) + 1;
const kab = pusat.adm2.map((k) => ({ ...k, n: norm(k.asli), kuat: k.nama.length >= 6 && cacahNama[k.nama] === 1, awalan: new RegExp(` (kab|kabupaten|kota) ${k.nama} `) }));

export function cocok(judul) {
  const n = norm(judul), hasil = new Map();
  for (const k of kab) {
    if (n.includes(k.n) && (k.kuat || k.awalan.test(n))) hasil.set(k.provinsi + '|' + k.asli, { prov: k.provinsi, kab: k.asli, lat: k.lat, lng: k.lng });
  }
  const adaProv = new Set([...hasil.values()].map((x) => x.prov));
  for (const p of prov) if (n.includes(p.n) && !adaProv.has(p.nama)) hasil.set(p.nama, { prov: p.nama, lat: p.lat, lng: p.lng });
  for (const [s, nama] of Object.entries(SINGKAT)) {
    const p = prov.find((x) => x.nama === nama); if (p && new RegExp(` ${s} `).test(n) && !hasil.has(p.nama) && ![...hasil.values()].some((x) => x.prov === p.nama)) hasil.set(p.nama, { prov: p.nama, lat: p.lat, lng: p.lng });
  }
  return [...hasil.values()].slice(0, 4);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const d = JSON.parse(readFileSync(J, 'utf8')); let n = 0;
  for (const r of d.baris) { const w = cocok(r.judul); if (w.length) { r.wilayah = w; n++; } else delete r.wilayah; }
  writeFileSync(J, JSON.stringify(d));
  console.log(`wilayah: ${n} dari ${d.baris.length} berita menyebut provinsi/kabupaten`);
}
