#!/usr/bin/env node
// Seed D1 untuk dokumen "Masukan METI atas RUU EBET": butir 1-22 dari data/konsultasi/posisi_meti_publik.json -> data/konsultasi/seed_masukan_meti.sql.
//   node scripts/pipa/seed_konsultasi.mjs              tulis SQL
//   node scripts/pipa/seed_konsultasi.mjs --selftest
// Butir 23+ (MPR, tim hukum, usulan asosiasi) internal: tidak pernah dimuat. Butir hidup HANYA di D1 (bukan public/data), terbaca anggota yang masuk.
// Pemilik menjalankan SQL-nya (idempoten): npx wrangler d1 execute jaringan-meti --remote --file=data/konsultasi/seed_masukan_meti.sql
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const MAKS = 22, DOK = 'masukan-meti-ruu-ebet';
const q = (v) => (v == null || v === '' ? 'NULL' : `'${String(v).replace(/'/g, "''").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').replace(/[<>]/g, '')}'`);

export function bangunSql(butir) {
  const b = butir.filter((x) => Number.isInteger(x.no) && x.no >= 1 && x.no <= MAKS);
  const baris = b.map((x, i) => `INSERT OR IGNORE INTO kons_bagian (dokumen_id, urutan, tingkat, nomor, judul, teks, rujukan, status_asal, sumber_asal) VALUES (${q(DOK)}, ${i}, 'butir', ${q(String(x.no))}, ${q(x.topik)}, ${q(x.posisi)}, ${q(x.pasal)}, ${q(x.status)}, ${q('Audiensi/RDPU Komisi XII DPR RI, 8 Sep 2026')});`);
  return `-- seed_masukan_meti.sql: dibangkitkan scripts/pipa/seed_konsultasi.mjs (jangan sunting tangan). Idempoten. ${b.length} butir.\n${baris.join('\n')}\nUPDATE kons_dokumen SET status = 'terbit', diubah = unixepoch() WHERE id = ${q(DOK)} AND status = 'draf';\n`;
}
export function selftest() {
  const s = bangunSql([{ no: 1, topik: "O'Brien <b>", posisi: 'p', pasal: 'Ps 1', status: 'Prioritas' }, { no: 23, topik: 'internal', posisi: 'x' }]);
  assert.ok(!s.includes('internal') && !s.includes('<b>') && s.includes("O''Brien b"));
  assert.equal((s.match(/INSERT OR IGNORE/g) || []).length, 1);
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  selftest();
  if (process.argv.includes('--selftest')) console.log('selftest ok');
  else {
    const butir = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/konsultasi/posisi_meti_publik.json'), 'utf8'));
    fs.writeFileSync(path.join(ROOT, 'data/konsultasi/seed_masukan_meti.sql'), bangunSql(butir), 'utf8');
    console.log('seed_masukan_meti.sql:', Math.min(butir.length, MAKS), 'butir');
  }
}
