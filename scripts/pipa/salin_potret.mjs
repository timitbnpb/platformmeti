// Salin potret lapis publik (data-panen/potret/publik) ke public/data untuk layar. Tanpa jaringan.
//   node scripts/pipa/salin_potret.mjs organisasi proyek
// Menolak bila berkas sumber rusak, tanpa baris, atau jumlah baris susut dari berkas tujuan (gagal tidak menimpa data baik).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export function salin(nama) {
  const dari = path.join(ROOT, 'data-panen/potret/publik', nama + '.json'), ke = path.join(ROOT, 'public/data', nama + '.json');
  const baru = JSON.parse(fs.readFileSync(dari, 'utf-8')), lama = fs.existsSync(ke) ? JSON.parse(fs.readFileSync(ke, 'utf-8')) : { baris: [] };
  if (!Array.isArray(baru.baris) || !baru.baris.length) throw new Error(nama + ': potret kosong');
  if (baru.baris.length < lama.baris.length) throw new Error(`${nama}: potret ${baru.baris.length} < publik ${lama.baris.length}, ditolak`);
  fs.copyFileSync(dari, ke);
  return `${nama}: ${lama.baris.length} -> ${baru.baris.length}`;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const nama = process.argv.slice(2); if (!nama.length) { console.error('pakai: salin_potret.mjs <organisasi|proyek> ...'); process.exit(1); }
  for (const n of nama) console.log(salin(n));
}
