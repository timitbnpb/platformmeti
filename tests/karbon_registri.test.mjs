import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { sektorDari, tglSerial, bulananIdx, satukan } from '../scripts/pipa/karbon_registri.mjs';

const j = (n) => JSON.parse(fs.readFileSync(new URL('../public/data/' + n, import.meta.url), 'utf8'));
test('sektor dan tanggal serial', () => {
  assert.equal(sektorDari({ nama: 'Katingan Peatland', metode: 'VM0007' }), 'gambut');
  assert.equal(sektorDari({ nama: 'Biogas POME', metode: 'AMS-III.H.', scope: 'Waste handling and disposal' }), 'limbah');
  assert.equal(sektorDari({ nama: 'Musi Hydro', metode: 'ACM0002', scope: 'Energy industries (renewable/non-renewable sources)' }), 'energi-terbarukan');
  assert.equal(tglSerial(43927), '2020-04-06');
});
test('laporan bulanan IDXCarbon: dua kolom, titik ribuan keliru', () => {
  const r = bulananIdx('CARBON MARKET – TRADING SUMMARY\n  Oct 2026   Sep 2026\n Total Volume   ton CO2e   2,928   1.021\n Total Value   IDR   232,544,000   66,950,000\n');
  assert.equal(r[0].periode, '2026-10'); assert.equal(r[0].volume, 2928); assert.equal(r[1].volume, 1021);
});
test('satukan: nama mirip dan pengembang sama digabung, kredit tidak dijumlah', () => {
  const b = (reg, id, k) => ({ sumber_registri: reg, registri: [{ nama: reg, id }], nama: 'Sipansihaporas Hydro Power', pengembang: 'PT PLN', lokasi: { provinsi: 'Sumatera Utara' }, kredit: { diterbitkan: k, dipensiunkan: 0 } });
  const { hasil } = satukan([b('verra', 'V1', 100), b('gs', 'G1', 80)]);
  assert.equal(hasil.length, 1); assert.equal(hasil[0].kredit.diterbitkan, 100); assert.equal(hasil[0].registri.length, 2);
});
test('data terbit: bersumber, bertanggal, id unik', () => {
  const r = j('karbon_registri.json'), p = j('karbon_pasar.json');
  assert.ok(r.jumlah === r.baris.length && r.jumlah > 100);
  assert.ok(r.baris.every((x) => x.sumber_url.startsWith('https://') && x.tanggal && x.tingkat_bukti && x.registri.length));
  assert.equal(new Set(r.baris.map((x) => x.id)).size, r.baris.length);
  assert.ok(p.idxcarbon.bulanan.length >= 14 && p.pajak_karbon.tarif_minimum_rp_per_ton === 30000);
});
