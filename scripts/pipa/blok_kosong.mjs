#!/usr/bin/env node
// JM-S06: catat blok data yang kosong supaya layar menyembunyikannya (D21), bukan merender tabel kosong atau label internal.
// Keluaran public/data/blok_kosong.json. Alasan baku (PRD FN-S06): "Tidak dipublikasikan", "Belum ada", "Menunggu data K/L", "Belum kami cari".
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

export const ALASAN = ['Tidak dipublikasikan', 'Belum ada', 'Menunggu data K/L', 'Belum kami cari'];
// [berkas, bagian kosong (fungsi pada isi berkas), alasan]
const CEK = [
  ['paten', (d) => (d.baris?.length ?? d.jumlah ?? 0) === 0 && 'seluruhnya', 'Belum ada'],
  ['emisi_provinsi', (d) => (d.provinsi?.length ?? 0) === 0 && 'provinsi', 'Menunggu data K/L'],
  ['podcast', (d) => (d.meti?.length ?? 0) === 0 && 'meti', 'Belum ada'],
  ['sosmed_pilihan', (d) => (d.baris?.length ?? 0) === 0 && 'seluruhnya', 'Belum ada'],
];
export function bangun(baca) {
  const blok = [];
  for (const [berkas, kosong, alasan] of CEK) {
    const bagian = kosong(baca(berkas));
    if (bagian) blok.push({ berkas, bagian, sembunyikan: true, alasan });
  }
  return { lapis: 'publik', alasan_baku: ALASAN, blok };
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const d = bangun((f) => JSON.parse(fs.readFileSync(new URL(`../../public/data/${f}.json`, import.meta.url), 'utf8')));
  fs.writeFileSync(new URL('../../public/data/blok_kosong.json', import.meta.url), JSON.stringify(d) + '\n');
  console.log(d.blok.map((b) => b.berkas + ':' + b.bagian).join(' '));
}
