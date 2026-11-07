#!/usr/bin/env node
// Unggah data-panen/potret/<lapis>/*.json (+ foto lapis anggota) ke R2 jaringan-meti/potret/<lapis>/ lewat wrangler --remote.
// DIJALANKAN KOORDINATOR, bukan subagent. Semua-atau-tidak-sama-sekali: pindai ulang dulu (potret.mjs --periksa), baru put.
//   node scripts/pipa/unggah_potret.mjs --kering   cetak perintah saja
//   node scripts/pipa/unggah_potret.mjs            unggah (ringkas.json TERAKHIR per lapis, manifest di akhir)
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = path.join(ROOT, 'data-panen/potret');
const BUCKET = 'jaringan-meti';
const KERING = process.argv.includes('--kering');
const TIPE = { '.json': 'application/json', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };

export function daftarUnggah() {
  const daftar = [];
  for (const lapis of ['publik', 'anggota', 'pengurus']) {
    const d = path.join(OUT, lapis);
    const fs_ = fs.readdirSync(d).filter((f) => f.endsWith('.json')).sort((a, b) => (a === 'ringkas.json') - (b === 'ringkas.json') || a.localeCompare(b));
    for (const f of fs_) daftar.push({ kunci: `potret/${lapis}/${f}`, berkas: path.join(d, f) });
  }
  const petaFoto = path.join(OUT, 'foto_peta.json');
  if (fs.existsSync(petaFoto)) for (const [k, lokal] of Object.entries(JSON.parse(fs.readFileSync(petaFoto, 'utf8')))) { const b = path.join(ROOT, 'data-panen', lokal); if (fs.existsSync(b)) daftar.push({ kunci: `potret/anggota/${k}`, berkas: b }); }
  return daftar;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const p = spawnSync(process.execPath, [path.join(ROOT, 'scripts/pipa/potret.mjs'), '--periksa'], { stdio: 'inherit' });
  if (p.status !== 0) { console.error('pindai gagal: TIDAK ada yang diunggah'); process.exit(1); }
  const daftar = daftarUnggah(); let n = 0;
  for (const { kunci, berkas } of daftar) {
    const args = ['wrangler', 'r2', 'object', 'put', `${BUCKET}/${kunci}`, `--file=${berkas}`, `--content-type=${TIPE[path.extname(berkas)] || 'application/octet-stream'}`, '--remote'];
    if (KERING) { console.log('npx', args.join(' ')); continue; }
    const r = spawnSync('npx', args, { stdio: 'inherit', cwd: ROOT });
    if (r.status !== 0) { console.error(`GAGAL put ${kunci} (setelah ${n} berhasil); jalankan ulang, put idempoten`); process.exit(1); }
    n++;
  }
  console.log(KERING ? `${daftar.length} perintah (kering)` : `${n} objek diunggah ke ${BUCKET}`);
}
