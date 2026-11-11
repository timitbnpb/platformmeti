// public/data/dedieselisasi.json dan rumus hemat() (radar_rumus.js): hitungan terbuka, dapat diperiksa dengan tangan.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { bangun } from '../scripts/pipa/dedieselisasi.mjs';
import { hemat, ASUMSI, tingkatPrioritas, tingkatSkor } from '../public/radar_rumus.js';

const D = JSON.parse(fs.readFileSync(new URL('../public/data/dedieselisasi.json', import.meta.url), 'utf8'));
const ST = JSON.parse(fs.readFileSync(new URL('../public/data/statistik_pln.json', import.meta.url), 'utf8'));

test('berkas sama dengan hasil bangun() (tak ada suntingan tangan)', () => assert.deepEqual(JSON.parse(JSON.stringify(bangun())), D));
test('hemat(): hitungan tangan 100 GWh, pangsa 50%, solar Rp20.000, skenario dasar, PVOUT 1.400', () => {
  const h = hemat({ pltdGwh: 100, s: 0.5, hargaL: 20000, skenario: 'dasar', pvout: 1400 });
  assert.equal(h.kwh, 50e6);
  const dekat = (a, b) => assert.ok(Math.abs(a - b) < 1e-6, `${a} vs ${b}`);
  dekat(h.liter, 14e6); /* 14 juta liter */
  dekat(h.bbm_miliar, 280);
  dekat(h.biaya_miliar, 144);
  dekat(h.bersih_miliar, 136);
  assert.equal(Math.round(h.mwp), Math.round(50e6 / (1400 * 0.8) / 1000)); /* 45 MWp */
});
test('hemat(): skenario biaya naik, hemat bersih turun; pangsa naik, hemat BBM naik linear', () => {
  const a = hemat({ pltdGwh: 10, s: 0.5, hargaL: 23700, skenario: 'rendah' }), b = hemat({ pltdGwh: 10, s: 0.5, hargaL: 23700, skenario: 'tinggi' });
  assert.ok(a.bersih_miliar > b.bersih_miliar);
  const x = hemat({ pltdGwh: 10, s: 0.25, hargaL: 23700 }), y = hemat({ pltdGwh: 10, s: 0.75, hargaL: 23700 });
  assert.ok(Math.abs(y.bbm_miliar - 3 * x.bbm_miliar) < 1e-9);
  assert.equal(hemat({ pltdGwh: 10, s: 0.5, hargaL: 1 }).mwp, null);
});
test('data PLTD sama dengan Statistik Ketenagalistrikan 2024 (tak mengarang)', () => {
  for (const b of D.baris) {
    const s = ST.baris.find((x) => x.kode === b.kode);
    assert.equal(b.pltd_mw, s.kapasitas_terpasang_mw.PLTD); assert.equal(b.pltd_gwh, s.produksi_pln_gwh.PLTD);
  }
  assert.equal(D.jumlah, 38);
});
test('45 sistem terisolasi berurut BPP turun; proyek dedieselisasi RUPTL terhubung provinsi', () => {
  assert.equal(D.sistem_terisolasi.length, 45);
  for (let i = 1; i < D.sistem_terisolasi.length; i++) assert.ok(D.sistem_terisolasi[i - 1].bpp_rp_kwh >= D.sistem_terisolasi[i].bpp_rp_kwh);
  assert.equal(D.baris.reduce((a, b) => a + b.proyek.length, 0), 7);
  const kepri = D.baris.find((b) => b.kode === '21'); assert.equal(kepri.proyek_mw, 15.6);
});
test('prioritas 0-100, dan tingkat tetap (tinggi/sedang/rendah)', () => {
  for (const b of D.baris) if (b.prioritas !== null) assert.ok(b.prioritas >= 0 && b.prioritas <= 100, b.provinsi);
  assert.equal(tingkatPrioritas(70), 't'); assert.equal(tingkatPrioritas(50), 's'); assert.equal(tingkatPrioritas(10), 'r'); assert.equal(tingkatPrioritas(null), null);
  assert.equal(tingkatSkor(55), 't'); assert.equal(tingkatSkor(35), 's'); assert.equal(tingkatSkor(34.9), 'r');
});
test('harga solar: tanpa sumber resmi terbaca (K21) jadi asumsi berlabel Hipotesis, dan celah tercatat', () => {
  assert.ok(D.harga_solar.rp_per_liter > 0 && D.harga_solar.alasan); assert.equal(D.harga_solar.label, 'Hipotesis'); assert.equal(D.harga_solar.sumber_url, null);
  assert.ok(D.celah.length >= 4); assert.equal(D.tingkat_bukti, 'hipotesis'); assert.doesNotMatch(JSON.stringify(D), /[—–·]/);
});
