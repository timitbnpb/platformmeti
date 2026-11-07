// Unggah berkas Pustaka lapis anggota/pengurus ke R2 (daftar dari scripts/pipa/pustaka.mjs). Entri zip dilewati.
// node scripts/pipa/unggah_pustaka.mjs [--kering]
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
const kering = process.argv.includes('--kering');
const raw = JSON.parse(readFileSync('data-panen/potret/pustaka_unggah.json', 'utf8'));
const daftar = Array.isArray(raw) ? raw : Object.values(raw)[0];
const ct = { pdf: 'application/pdf', pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', doc: 'application/msword', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg' };
let ok = 0, lewat = 0;
for (const d of daftar) {
  if (d.zip || !d.berkas || !existsSync(d.berkas) || !/^potret\/(anggota|pengurus)\/pustaka\/[a-z0-9._-]+$/.test(d.kunci)) { lewat++; continue; }
  const ext = d.kunci.split('.').pop();
  const arg = ['--no-install', 'wrangler', 'r2', 'object', 'put', `jaringan-meti/${d.kunci}`, `--file=${d.berkas}`, `--content-type=${ct[ext] || 'application/octet-stream'}`, '--remote'];
  if (kering) { console.log(arg.slice(4, 6).join(' ')); ok++; continue; }
  execFileSync('npx', arg, { stdio: 'ignore' });
  ok++;
}
console.log(`${ok} diunggah, ${lewat} dilewati`);
