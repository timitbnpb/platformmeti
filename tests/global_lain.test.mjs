import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { validasiPerusahaan } from '../scripts/pipa/global_pemasok.mjs';
import { SEGMEN } from '../scripts/panen/global_lain_bangun.mjs';

const d = JSON.parse(fs.readFileSync('public/data/global/pemasok_lain.json', 'utf8'));

test('selftest panen dan bangun', () => {
  for (const f of ['global_lain', 'global_lain_bangun']) execFileSync('node', [`scripts/panen/${f}.mjs`, '--selftest'], { stdio: 'pipe' });
});
test('tiap pemasok lolos validasi bersama dan id unik', () => {
  assert.equal(d.jumlah, d.baris.length);
  assert.deepEqual(d.baris.flatMap((p) => validasiPerusahaan(p, SEGMEN)), []);
  assert.equal(new Set(d.baris.map((p) => p.id)).size, d.baris.length);
});
test('kolom tanpa sumber tetap kosong, bukan tebakan', () => {
  for (const p of d.baris) for (const k of ['kapasitas_produksi', 'pangsa_dunia', 'kantor_pabrik_asean', 'mitra_lokal']) assert.equal(p[k], null, `${p.nama}.${k}`);
});
test('proyek referensi punya sumber_url dan tingkat bukti', () => {
  for (const p of d.baris) for (const x of p.proyek_indonesia) assert.ok(/^https:\/\//.test(x.sumber_url) && x.tingkat_bukti && x.peran, p.nama);
});
test('logo menunjuk berkas yang ada dan tercatat di SUMBER.md', () => {
  const sumber = fs.readFileSync('public/img/logo/org/SUMBER.md', 'utf8');
  for (const p of d.baris.filter((x) => x.logo)) { assert.ok(fs.existsSync('public' + p.logo), p.nama); assert.ok(sumber.includes(p.logo.split('/').pop()), p.nama); }
});
test('entitas_tambah memuat pemasok ini sekali saja, kategori internasional', () => {
  const e = JSON.parse(fs.readFileSync('data/direktori/entitas_tambah.json', 'utf8')).baris.filter((b) => b._asal === 'global_lain');
  assert.equal(e.length, d.baris.length);
  assert.ok(e.every((b) => b.kategori === 'internasional'));
});
