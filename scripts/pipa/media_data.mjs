#!/usr/bin/env node
// data/{galeri,video_kanal,podcast,event_mitra}.json -> public/data/*.json setelah validasi.
//   node scripts/pipa/media_data.mjs            salin
//   node scripts/pipa/media_data.mjs --selftest
// Foto tayang hanya bila `hak` tercatat milik METI dan bukan Antara; berkas gambar harus ada di public/. Kontak pribadi tidak diterima.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const NAMA = ['galeri', 'video_kanal', 'podcast', 'event_mitra'];

export function periksaGaleri(g, ada = () => true) {
  const baris = (g.baris || []).filter((f) => f.hak && /\bMETI\b/.test(f.hak) && !/antara/i.test(f.hak + f.file + (f.liputan || '')) && ada(f.file));
  return { ...g, jumlah: baris.length, baris: baris.sort((a, b) => b.tanggal.localeCompare(a.tanggal)) };
}
// Judul YouTube memuat tanda baca panjang (em dash, titik tengah): diganti ", " (aturan tanpa em dash).
export const rapikan = (x) => String(x ?? '').replace(/\s*[\u2014\u2013\u00b7]\s*/g, ', ').replace(/\s+/g, ' ').trim();
export function periksaVideo(v) {
  const baris = (v.baris || []).map((x) => ({ ...x, judul: rapikan(x.judul), ...(x.ringkas ? { ringkas: rapikan(x.ringkas) } : {}) })).filter((x) => /^[\w-]{11}$/.test(x.id) && x.kanal in v.kanal);
  return { ...v, jumlah: baris.length, baris: baris.sort((a, b) => b.terbit.localeCompare(a.terbit)) };
}
const sebar = (o) => JSON.stringify(o);
export function selftest() {
  const g = periksaGaleri({ baris: [{ id: 'a', file: '/x.webp', hak: 'Foto METI', tanggal: '2026-01-01' }, { id: 'b', file: '/y.webp', hak: 'Foto ANTARA; hak METI', tanggal: '2026-01-02' }, { id: 'c', file: '/z.webp', tanggal: '2026-01-03' }] });
  assert.deepEqual(g.baris.map((x) => x.id), ['a']);
  assert.equal(periksaVideo({ kanal: { meti: {} }, baris: [{ id: 'SF5mGWT_Lx0', kanal: 'meti', terbit: '2023-11-29' }, { id: 'pendek', kanal: 'meti', terbit: '2023-01-01' }] }).jumlah, 1);
  assert.equal(rapikan('A \u2014 B \u00b7 C'), 'A, B, C');
  assert.ok(!/@gmail|\b08\d{8,}/.test(sebar({ ok: 1 })));
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  selftest();
  if (process.argv.includes('--selftest')) console.log('selftest ok'); else {
    for (const n of NAMA) {
      let d = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', n + '.json'), 'utf8'));
      if (n === 'galeri') d = periksaGaleri(d, (f) => fs.existsSync(path.join(ROOT, 'public', f)));
      if (n === 'video_kanal') d = periksaVideo(d);
      fs.writeFileSync(path.join(ROOT, 'public/data', n + '.json'), JSON.stringify(d));
      console.log(n, d.jumlah ?? '');
    }
  }
}
