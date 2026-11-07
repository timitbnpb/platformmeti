// Menambah kampus pembuat inovasi (IPB, Undip, ITS, PENS) ke public/data/organisasi.json. Tanpa jaringan, idempoten.
//   node scripts/pipa/kampus_org.mjs <tgl>      (logo: public/img/logo/org/<id>.png, sumber di public/img/logo/SUMBER.md)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const tgl = process.argv[2] || new Date().toISOString().slice(0, 10);
const f = path.join(ROOT, 'public/data/organisasi.json');
const o = JSON.parse(fs.readFileSync(f, 'utf8'));
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/inovasi/kampus_org.json'), 'utf8'));
for (const k of seed) {
  if (o.baris.some((b) => b.id === k.id)) continue;
  o.baris.push({ id: k.id, nama: k.nama, singkatan: k.singkatan, kategori: { kode: 'perguruan-tinggi', label: 'Perguruan Tinggi' },
    lokasi: { kota: k.kota, provinsi: k.provinsi, lat: k.lat, lng: k.lng, presisi: 'kota' }, situs: k.situs,
    sumber: [{ id: 'situs-resmi', jenis: 'situs-resmi', url: k.situs + '/', keterangan: 'situs resmi kampus (nama, lokasi, logo)', tingkat_bukti: 'situs-sendiri', tanggal: tgl }],
    diperiksa: tgl, logo: `/img/logo/org/${k.id}.png` });
}
o.jumlah = o.baris.length;
fs.writeFileSync(f, JSON.stringify(o) + '\n');
console.log('organisasi', o.jumlah);
