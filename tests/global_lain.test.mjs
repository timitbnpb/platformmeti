import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { validasiPerusahaan } from '../scripts/pipa/global_pemasok.mjs';
import { idEntitas } from '../scripts/pipa/entitas_tambah.mjs';
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
test('tiap pemasok ada di entitas_tambah (milik sendiri bernama _asal, atau sudah ada sebelumnya), kategori internasional', () => {
  const semua = JSON.parse(fs.readFileSync('data/direktori/entitas_tambah.json', 'utf8')).baris;
  const id = new Map(semua.map((b) => [idEntitas(b.nama), b]));
  for (const p of d.baris) assert.ok(id.has(p.id), p.nama);
  assert.ok(semua.filter((b) => b._asal === 'global_lain').every((b) => b.kategori === 'internasional'));
});
test('rantai per sub-segmen memuat semua segmen', () => {
  for (const s of ['bayu', 'panas-bumi', 'hidro', 'hidrogen', 'jaringan', 'biomassa', 'biogas', 'biofuel']) assert.ok(d.rantai[s], s);
});
test('semua 74 pemasok lengkap, tanpa tunda; negara dan sumbernya tercatat', () => {
  assert.deepEqual(d.belum_lengkap, []);
  for (const p of d.baris) assert.ok(p.negara_iso2 && p.fakta.some((f) => f.medan === 'negara_iso2' && /^https:\/\//.test(f.sumber_url)), p.nama);
});
test('hulu lokal dan pasar dunia: sumber https + tingkat, organisasi_id terisi bila org_nama, pangsa dihitung', () => {
  const ok = new Set(['resmi', 'situs-sendiri', 'kata-pihak', 'cuplikan', 'via-pihak-ketiga', 'kajian']);
  assert.ok(d.butir.length > 20);
  for (const b of [...d.butir, ...d.pasar_dunia]) assert.ok(/^https:\/\//.test(b.sumber_url) && ok.has(b.tingkat_bukti), b.uraian.slice(0, 40));
  for (const b of d.butir.filter((x) => x.org_nama)) assert.ok(b.organisasi_id, b.org_nama);
  const bayu = d.pasar_dunia.find((x) => x.jenis === 'bayu-pasang-2025');
  assert.equal(bayu.per_pemasok.find((q) => q.nama === 'Windey').pangsa_persen, 11.1);
});
test('pelaku lokal hulu ada di entitas_tambah', () => {
  const semua = JSON.parse(fs.readFileSync('data/direktori/entitas_tambah.json', 'utf8')).baris;
  assert.ok(semua.filter((b) => b._asal === 'global_lain_hulu').length >= 6);
});
