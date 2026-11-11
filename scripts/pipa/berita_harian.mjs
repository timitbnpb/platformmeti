#!/usr/bin/env node
// Berita harian untuk runner CI tanpa data-panen/ (D25): jalankan berita.mjs (feed sah, tanpa Antara), lalu tambahkan baris BARU
// ke public/data/berita.json yang terlacak git. Arsip lama tidak pernah dibuang atau ditimpa; jumlah tidak boleh menyusut.
//   node scripts/pipa/berita_harian.mjs [--sumber=gdelt,rss]     (argumen diteruskan ke berita.mjs)
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { bukanAntara } from '../panen/berita.mjs';
import { wilayahDari } from '../panen/berita_wilayah.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const BERKAS = path.join(ROOT, 'public/data/berita.json'), JSONL = path.join(ROOT, 'data-panen/berita/berita.jsonl');

export function gabung(lama, baruMentah, kini) {
  const ada = new Set(lama.baris.map((b) => b.id)), tambah = [];
  for (const a of baruMentah.filter(bukanAntara)) {
    if (ada.has(a.id) || !/^https:\/\//.test(a.url || '') || !a.judul || !a.terbit) continue;
    ada.add(a.id);
    const w = wilayahDari(a.judul);
    tambah.push({ id: a.id, judul: a.judul, url: a.url, media: a.media, terbit: a.terbit, bahasa: a.bahasa, ...(w.length ? { wilayah: w } : {}), sumber_panen: a.sumber_panen, tanggal_ambil: a.tanggal_ambil });
  }
  const baris = [...lama.baris, ...tambah];
  if (baris.length < lama.baris.length) throw new Error('arsip menyusut, ditolak');
  return { hasil: { ...lama, dibangun_pada: tambah.length ? kini : lama.dibangun_pada, jumlah: baris.length, baris }, ditambah: tambah.length };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const kini = process.env.TANGGAL_BANGUN || new Date().toISOString().slice(0, 10);
  const lama = JSON.parse(fs.readFileSync(BERKAS, 'utf-8'));
  try { execFileSync(process.execPath, [path.join(ROOT, 'scripts/panen/berita.mjs'), ...process.argv.slice(2)], { cwd: ROOT, stdio: ['ignore', 'inherit', 'inherit'], timeout: 25 * 6e4 }); }
  catch (e) { console.error('berita.mjs gagal (exit ' + e.status + '); arsip tidak diubah'); process.exit(e.status === 2 ? 2 : 1); }
  const baru = fs.readFileSync(JSONL, 'utf-8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
  const { hasil, ditambah } = gabung(lama, baru, kini);
  fs.writeFileSync(BERKAS + '.tmp', JSON.stringify(hasil) + '\n', 'utf-8'); fs.renameSync(BERKAS + '.tmp', BERKAS);
  const terbaru = hasil.baris.reduce((m, b) => (b.terbit > m ? b.terbit : m), '');
  console.log(`berita_harian: +${ditambah}, jumlah ${hasil.jumlah}, terbaru ${terbaru}`);
}
