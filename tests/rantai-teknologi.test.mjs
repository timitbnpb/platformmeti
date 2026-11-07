import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { klasifikasi, bangun, idTk } from '../scripts/pipa/rantai_teknologi.mjs';
import { kebutuhan } from '../scripts/pipa/rantai_pasok.mjs';
import { inti, cocok } from '../scripts/pipa/rantai_situs.mjs';

test('selftest skrip rantai', () => {
  for (const f of ['rantai_teknologi', 'rantai_situs', 'rantai_teknologi_panen']) execFileSync('node', [`scripts/pipa/${f}.mjs`, '--selftest'], { stdio: 'pipe' });
});
test('klasifikasi memakai nama produk, bukan kata kunci; bahan kimia boiler dan ambulans ditolak', () => {
  assert.deepEqual(klasifikasi({ produk: 'Boiler Scale Inhibitor' }), []);
  assert.deepEqual(klasifikasi({ produk: 'Hot Rolled Plate', tipe: 'pressure vessel' }), []);
  assert.deepEqual(klasifikasi({ produk: null, spesifikasi: ['Digester Biogas Kapasitas 17m3'] }).map((x) => x[1]), ['digester']);
  assert.equal(klasifikasi({ produk: 'Pressure Vessel' })[0][2], 'umum');
});
test('seed tanpa sumber berurl ditolak; kapasitas tidak dikarang', () => {
  const b = bangun({ baris: [], seed: [{ nama: 'PT A', komponen: [{ teknologi: 'bayu', komponen: 'menara' }], sumber: [{ url: 'http://x', tanggal: '2026-01-01', tingkat_bukti: 'media' }] }] });
  assert.equal(b.length, 0);
});
test('pemasok.json: tiap baris punya sumber https, tanggal, tingkat bukti; id deterministik', () => {
  const d = JSON.parse(fs.readFileSync('data/rantai/pemasok.json', 'utf8'));
  assert.ok(d.pemasok.length > 50);
  for (const p of d.pemasok) {
    assert.ok(p.sumber.length && p.sumber.every((s) => /^https:\/\//.test(s.url) && s.tingkat_bukti && s.tanggal), p.nama);
    assert.ok(p.tanggal_periksa && p.provinsi, p.nama);
    for (const c of p.komponen) assert.ok(c.kapasitas == null || (c.satuan && p.sumber.some((s) => s.jenis !== 'sertifikat-tkdn')), p.nama + ': kapasitas tanpa sumber non-TKDN');
  }
  assert.equal(idTk('PT Indo Energi Elektrik'), 'tk_ac531297');
});
test('kebutuhan per tahun dijumlah dari RUPTL, bukan dikarang', () => {
  const k = kebutuhan({ baris: [{ teknologi: 'penyimpanan', cod_tahun: [2030], kapasitas_mw: 50 }, { teknologi: 'penyimpanan', cod_tahun: [2030], kapasitas_mw: 25 }, { teknologi: 'nuklir', cod_tahun: [2030], kapasitas_mw: 9 }] });
  assert.deepEqual(k.baterai.per_tahun, [{ tahun: 2030, mw: 75, proyek: 2 }]); assert.equal(k.nuklir, undefined);
});
test('situs: nama inti dan pencocokan beranda', () => {
  assert.deepEqual(inti('PT Voksel Electric Tbk'), ['voksel', 'electric']);
  assert.ok(!cocok('<title>domain dijual</title>', 'PT Voksel Electric Tbk'));
});
