// Akses energi: keluaran skrip lolos pemeriksaan, tiap angka beralamat sumber, berkas terbit = keluaran skrip, tanpa data pribadi.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { bangun, periksa } from '../scripts/panen/akses_energi.mjs';

test('keluaran lolos periksa', () => assert.deepEqual(periksa(bangun()), []));
test('38 provinsi, tiap provinsi punya rasio elektrifikasi resmi dan sumber', () => {
  const d = bangun();
  assert.equal(d.provinsi.length, 38);
  for (const r of d.provinsi) { assert.ok(r.re_persen > 0 && r.re_persen <= 100, r.kode); assert.equal(r.tingkat_bukti.re, 'resmi'); assert.ok(d.sumber[r.sumber_id.re]); }
});
test('tiap sumber: https, judul, tingkat bukti sah, tanggal ambil', () => {
  for (const [id, s] of Object.entries(bangun().sumber)) { assert.match(s.url, /^https:\/\//, id); assert.ok(s.judul && s.penerbit, id); assert.ok(['resmi', 'media'].includes(s.tingkat_bukti), id); assert.match(s.tanggal_ambil, /^\d{4}-\d\d-\d\d$/, id); }
});
test('RD PLN Papua Pegunungan terendah dan nol SPKLU di empat provinsi Papua baru', () => {
  const d = bangun(), rd = d.provinsi.filter((r) => r.rd_pln_2026q1 != null);
  assert.equal(rd.sort((a, z) => a.rd_pln_2026q1 - z.rd_pln_2026q1)[0].kode, '95');
  for (const k of ['93', '94', '95', '96']) assert.equal(d.provinsi.find((r) => r.kode === k).spklu_2025, 0);
});
test('lokasi per wilayah menjumlah ke nasional; pangsa perempuan dihitung dari angka sumber', () => {
  const d = bangun();
  assert.equal(d.lokasi_belum_berlistrik.wilayah.reduce((s, w) => s + w.nilai, 0), 10068);
  assert.equal(d.efisiensi.tenaga.persen_manajer_perempuan, 3.4);
});
test('berkas terbit sama dengan keluaran skrip', { skip: !fs.existsSync('public/data/akses_energi.json') }, () => {
  assert.deepEqual(JSON.parse(fs.readFileSync('public/data/akses_energi.json', 'utf8')), JSON.parse(JSON.stringify(bangun())));
});
test('tanpa em dash dan tanpa kontak', () => {
  const s = fs.readFileSync('public/data/akses_energi.json', 'utf8');
  assert.ok(!s.includes('—')); assert.ok(!/@[a-z0-9-]+\.[a-z]{2,}/i.test(s));
});
