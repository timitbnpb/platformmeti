#!/usr/bin/env node
// GeoNames (CC BY 4.0, https://www.geonames.org) ID.zip -> data/kembaran/geonames_kota.json: tempat berpenduduk >= 1000 jiwa
// atau ibu kota (PPLC/PPLA/PPLA2), untuk menamai sistem kecil "Sistem <kota>". Hanya nama, koordinat, penduduk (tanpa kolom lain).
// Pakai: node scripts/panen/geonames_kota.mjs <ID.txt hasil unzip ID.zip> [tanggalAmbil]
// Unduh sekali: curl -o ID.zip https://download.geonames.org/export/dump/ID.zip (satu berkas; tak ada otomasi berulang).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const [txt, tgl = '2026-11-25'] = process.argv.slice(2);
if (!txt) { console.log('pakai: geonames_kota.mjs <ID.txt> [YYYY-MM-DD]'); process.exit(1); }
const IBU = new Set(['PPLC', 'PPLA', 'PPLA2']), kota = [];
for (const l of fs.readFileSync(txt, 'utf8').split('\n')) {
  const c = l.split('\t'); if (c.length < 15 || c[6] !== 'P') continue;
  const pop = +c[14] || 0; if (pop < 1000 && !IBU.has(c[7])) continue;
  kota.push([c[1], Math.round(+c[4] * 1e4) / 1e4, Math.round(+c[5] * 1e4) / 1e4, pop, c[7]]);
}
kota.sort((a, b) => a[1] - b[1] || a[2] - b[2] || (a[0] < b[0] ? -1 : 1));
const out = { meta: { sumber: 'geonames-id', judul: 'GeoNames, dump negara Indonesia (ID.zip)', url: 'https://download.geonames.org/export/dump/ID.zip', lisensi: 'CC BY 4.0', tanggal_ambil: tgl, kolom: ['nama', 'lat', 'lon', 'penduduk', 'kode_fitur'], aturan: 'kelas P dengan penduduk >= 1000, atau PPLC/PPLA/PPLA2 (ibu kota negara, provinsi, kabupaten/kota)', jumlah: kota.length }, kota };
fs.writeFileSync(path.join(ROOT, 'data/kembaran/geonames_kota.json'), JSON.stringify(out) + '\n');
console.log('data/kembaran/geonames_kota.json', kota.length, 'tempat');
