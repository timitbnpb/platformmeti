#!/usr/bin/env node
// Setelah berita_harian.mjs: bangun ulang HANYA turunan berita agar uji lulus dan berita baru bisa dicari:
// cari/berita.json (indeks_cari), ringkas.json, isu.json, kuadran.json. Indeks cari jenis lain (proyek, topik, ...) dikembalikan
// seperti semula supaya tidak ikut berubah oleh drift data lain (diff otomatis tetap terbatas pada daftar BERITA_BOLEH di bot_pr.mjs).
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CARI = path.join(ROOT, 'public/data/cari');
const semua = () => (fs.existsSync(CARI) ? fs.readdirSync(CARI) : []);
const foto = Object.fromEntries(semua().map((f) => [f, fs.readFileSync(path.join(CARI, f))]));
for (const s of ['indeks_cari', 'ringkas_hitung', 'isu_bangun', 'kuadran']) execFileSync(process.execPath, [path.join(ROOT, 'scripts/pipa', s + '.mjs')], { cwd: ROOT, stdio: ['ignore', 'inherit', 'inherit'], timeout: 10 * 6e4 });
for (const f of semua()) if (f !== 'berita.json') { if (f in foto) fs.writeFileSync(path.join(CARI, f), foto[f]); else fs.rmSync(path.join(CARI, f)); } // berkas baru/ubah selain berita dibuang
for (const f of Object.keys(foto)) if (f !== 'berita.json' && !fs.existsSync(path.join(CARI, f))) fs.writeFileSync(path.join(CARI, f), foto[f]);
console.log('berita_turunan: cari/berita.json, ringkas, isu, kuadran dibangun ulang');
