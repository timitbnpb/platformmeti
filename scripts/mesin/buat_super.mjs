#!/usr/bin/env node
// Buat akun Super pertama (JM-B05): tanpa ini tidak ada pintu masuk pertama.
// Sandi TIDAK lewat skrip: akun lahir berstatus `menunggu` dengan tautan
// aktivasi sekali pakai 72 jam (bentuk sama dengan src/akun.js), dan pemilik
// menyetel sandinya sendiri di /aktivasi. Tautan dicetak sekali ke terminal
// yang menjalankan skrip ini dan tidak disimpan di mana pun.
//
//   node scripts/mesin/buat_super.mjs --surel=nama@contoh.id --nama="Nama" [--db=jaringan-meti] [--asal=https://platformmeti.timitbnpb.workers.dev] [--lokal]
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { webcrypto as crypto } from 'node:crypto';

const arg = (n, b) => (process.argv.find((a) => a.startsWith(`--${n}=`)) ?? '').slice(n.length + 3) || b;
const surel = arg('surel'), nama = arg('nama');
const db = arg('db', 'jaringan-meti');
const asal = arg('asal', 'https://platformmeti.timitbnpb.workers.dev');
const lokal = process.argv.includes('--lokal');
if (!surel || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(surel) || !nama) {
  console.error('wajib: --surel=<surel sah> --nama="<nama>"');
  process.exit(1);
}
const hex = (b) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('');
const token = hex(crypto.getRandomValues(new Uint8Array(32)));
const hash = hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token)));
const sampai = Math.floor(Date.now() / 1000) + 72 * 3600;
const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
// Gagal bila surel sudah ada (UNIQUE): super kedua dibuat lewat /admin, bukan skrip ini.
const sql = `INSERT INTO akun (surel, nama, peran, status, aktivasi_hash, aktivasi_sampai) VALUES (${q(surel)}, ${q(nama)}, 'super', 'menunggu', ${q(hash)}, ${sampai});
INSERT INTO jejak (siapa, peran, aksi, tabel, baris_id) SELECT id, 'super', 'tambah', 'akun', CAST(id AS TEXT) FROM akun WHERE surel = ${q(surel)};`;
const dir = mkdtempSync(join(tmpdir(), 'super-'));
const f = join(dir, 'super.sql');
writeFileSync(f, sql);
try {
  execFileSync('npx', ['--no-install', 'wrangler', 'd1', 'execute', db, lokal ? '--local' : '--remote', '--file', f], { stdio: ['ignore', 'ignore', 'inherit'] });
} finally {
  rmSync(dir, { recursive: true, force: true });
}
console.log(`Akun super ${surel} dibuat (status menunggu). Buka tautan ini dalam 72 jam untuk menyetel sandi:\n${asal}/aktivasi?token=${token}`);
