#!/usr/bin/env node
// Buka artefak hasil-panen.tgz dengan aman: tolak symlink/hardlink/perangkat, jalur absolut atau '..', jalur di luar putih-daftar.
// Ekstrak ke direktori sementara terpisah, lalu salin hanya berkas biasa lolos daftar ke checkout (kode di scripts/, tests/, .github/ tidak bisa ditimpa).
//   node scripts/pipa/arsip_aman.mjs <arsip.tgz> [tujuan=.]
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const AWALAN = ['public/data/', 'data/direktori/', 'data/bot/', 'hukum/'];
export function periksaDaftar(nama, panjang) { // nama: keluaran tar -t; panjang: keluaran tar -tv (urutan sama)
  const n = nama.split('\n').filter(Boolean), v = panjang.split('\n').filter(Boolean), g = [];
  if (n.length !== v.length) return ['daftar arsip tidak konsisten (nama berisi baris baru?)'];
  n.forEach((p, i) => {
    const tipe = v[i][0], d = tipe === 'd';
    if (!['-', 'd'].includes(tipe)) g.push(`anggota bukan berkas biasa (${tipe}): ${p}`);
    else if (path.isAbsolute(p) || p.split('/').includes('..') || /[\x00-\x1f]/.test(p)) g.push('jalur berbahaya: ' + p);
    else if (!d && !AWALAN.some((a) => p.startsWith(a))) g.push('di luar putih-daftar: ' + p);
  });
  return g;
}
export function bukaAman(arsip, tujuan = '.') {
  const tar = (...a) => execFileSync('tar', a, { encoding: 'utf-8', maxBuffer: 1 << 28 });
  const g = periksaDaftar(tar('-tzf', arsip), tar('-tvzf', arsip));
  if (g.length) throw new Error('arsip ditolak:\n' + g.slice(0, 20).join('\n'));
  const sem = fs.mkdtempSync(path.join(os.tmpdir(), 'arsip-'));
  tar('-xzf', arsip, '-C', sem, '--no-same-owner', '--no-same-permissions');
  let n = 0;
  const jalan = (d) => { for (const e of fs.readdirSync(path.join(sem, d), { withFileTypes: true })) {
    const rel = d ? d + '/' + e.name : e.name, st = fs.lstatSync(path.join(sem, rel));
    if (st.isDirectory()) jalan(rel); else if (st.isFile() && AWALAN.some((a) => rel.startsWith(a))) { fs.mkdirSync(path.dirname(path.join(tujuan, rel)), { recursive: true }); fs.copyFileSync(path.join(sem, rel), path.join(tujuan, rel)); n++; }
    else throw new Error('anggota tak lolos setelah ekstrak: ' + rel);
  } };
  jalan('');
  fs.rmSync(sem, { recursive: true, force: true });
  return n;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try { console.log('arsip dibuka:', bukaAman(process.argv[2], process.argv[3] || '.'), 'berkas'); } catch (e) { console.error(e.message); process.exit(1); }
}
