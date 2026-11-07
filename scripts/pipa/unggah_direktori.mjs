#!/usr/bin/env node
// Unggah data-panen/direktori/<n>.json ke R2 jaringan-meti/potret/anggota/<n>.json (kunci yang dibaca Worker: src/direktori.js potret()).
// DIJALANKAN KOORDINATOR untuk produksi, bukan subagent. Semua-atau-tidak-sama-sekali: pindai data pribadi dulu, baru put.
//   node scripts/pipa/unggah_direktori.mjs --kering    cetak perintah saja
//   node scripts/pipa/unggah_direktori.mjs --local     put ke R2 lokal (wrangler dev di http://localhost:8822)
//   node scripts/pipa/unggah_direktori.mjs             put ke R2 PRODUKSI (--remote)
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { pindai } from './potret.mjs';
import { NAMA } from './data_direktori.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SUMBER = path.join(ROOT, 'data-panen/direktori');
const BUCKET = 'jaringan-meti';

export const daftarUnggah = () => NAMA.map((n) => ({ kunci: `potret/anggota/${n}.json`, berkas: path.join(SUMBER, n + '.json') }));

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const kering = process.argv.includes('--kering'), lokal = process.argv.includes('--local');
  const daftar = daftarUnggah(), galat = [];
  for (const { berkas, kunci } of daftar) {
    if (!fs.existsSync(berkas)) { galat.push('belum dibangun: ' + berkas); continue; }
    const s = fs.readFileSync(berkas, 'utf8');
    try { JSON.parse(s); } catch { galat.push('JSON rusak: ' + kunci); }
    pindai(s).forEach((t) => galat.push(`${kunci}: ${t}`));
  }
  if (galat.length) { console.error('GAGAL, TIDAK ada yang diunggah:\n' + galat.slice(0, 30).join('\n')); process.exit(1); }
  let n = 0;
  for (const { kunci, berkas } of daftar) {
    const args = ['--no-install', 'wrangler', 'r2', 'object', 'put', `${BUCKET}/${kunci}`, `--file=${berkas}`, '--content-type=application/json', lokal ? '--local' : '--remote'];
    if (kering) { console.log('npx', args.join(' ')); continue; }
    const r = spawnSync('npx', args, { stdio: 'inherit', cwd: ROOT });
    if (r.status !== 0) { console.error(`GAGAL put ${kunci} (setelah ${n} berhasil); jalankan ulang, put idempoten`); process.exit(1); }
    n++;
  }
  console.log(kering ? `${daftar.length} perintah (kering)` : `${n} objek diunggah ke ${BUCKET} (${lokal ? 'lokal' : 'PRODUKSI'})`);
}
