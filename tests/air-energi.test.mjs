// /air-energi: skor kerentanan air (komponen tanpa data dikeluarkan), regresi, koefisien air, dan invarian data/ukuran geometri.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { skor, BOBOT, kelasSkor, vEnso, vSpi, vHth, vTanah, vTekanan, vTampungan, jenisPlt, cocokWaduk, regresi, airTahun, duplikat, bersihNama, dalamPoligon, sederhana } from '../scripts/pipa/air_energi.mjs';

test('bobot menjumlah 1 dan kelas mengikuti ambang', () => {
  assert.ok(Math.abs(Object.values(BOBOT).reduce((a, b) => a + b, 0) - 1) < 1e-9);
  assert.deepEqual([10, 30, 50, 80].map(kelasSkor), ['rendah', 'sedang', 'tinggi', 'sangat-tinggi']);
});
test('skor: komponen kosong dikeluarkan dan bobot dinormalkan ulang', () => {
  const penuh = skor({ enso: 100, spi: 100, hth: 100, tanah: 100, tampungan: 100, tekanan: 100 });
  assert.equal(penuh.skor, 100);
  const sebagian = skor({ enso: 100, spi: null, hth: null, tanah: null, tampungan: 0, tekanan: null });
  assert.equal(sebagian.skor, 50); // (100*.25 + 0*.25) / .5
  assert.deepEqual(sebagian.dikeluarkan.sort(), ['hth', 'spi', 'tanah', 'tekanan']);
  assert.equal(skor({ enso: null }).skor, null);
});
test('pemetaan komponen ke 0-100 dan menjepit di ujung', () => {
  assert.equal(vEnso(-40), 50); assert.equal(vEnso(10), 0); assert.equal(vEnso(-200), 100); assert.equal(vEnso(null), null);
  assert.equal(vSpi(0.5, 0.5), 0); assert.equal(vSpi(-2, -2), 100); assert.equal(vSpi(null, null), null);
  assert.equal(vHth(30), 50); assert.equal(vHth(200), 100); assert.equal(vTanah(20), 80);
  assert.equal(vTekanan(1, false), 0); assert.equal(vTekanan(3, true), 70); assert.equal(vTekanan(20, true), 100);
});
test('tampungan: run-of-river paling rentan, waduk besar paling aman', () => {
  assert.ok(vTampungan('PLTMH', null) > vTampungan('PLTA', null));
  assert.ok(vTampungan('PLTA', null) > vTampungan('PLTA', { tj: 50 }));
  assert.ok(vTampungan('PLTA', { tj: 50 }) > vTampungan('PLTA', { tj: 1900 }));
});
test('jenis pembangkit dari nama dan kapasitas; waduk dikenali dari nama', () => {
  assert.equal(jenisPlt('PLTMH Sungai Kecil', 0.5), 'PLTMH'); assert.equal(jenisPlt('PLTM Batang Toru 3', 10), 'PLTM'); assert.equal(jenisPlt('Cirata hydro', 1008), 'PLTA'); assert.equal(jenisPlt('Tanpa nama jenis', 4), 'PLTM');
  assert.equal(cocokWaduk('Cirata hydro').n, 'Cirata'); assert.equal(cocokWaduk('Karangkates Hydroelectric Power Plant').n, 'Sutami (Karangkates)'); assert.equal(cocokWaduk('PLTM Entah'), null);
});
test('duplikat: nama dasar sama atau berdekatan, MW harus mirip', () => {
  assert.equal(duplikat({ nama: 'Saguling hydro', lat: -6.9, lng: 107.3, mw: 701 }, { nama: 'Saguling hydroelectric plant', lat: -6.7, lng: 107.5, mw: 701 }), true);
  assert.equal(duplikat({ nama: 'A', lat: 1, lng: 1, mw: 100 }, { nama: 'B', lat: 1.01, lng: 1.01, mw: 300 }), false);
  assert.equal(duplikat({ nama: 'A', lat: 1, lng: 1, mw: 100 }, { nama: 'B', lat: 5, lng: 5, mw: 100 }), false);
  assert.equal(bersihNama('Cirata hydro'), 'Cirata');
});
test('regresi linear dan volume air tahunan', () => {
  const g = regresi([1, 2, 3, 4], [3, 5, 7, 9]);
  assert.ok(Math.abs(g.lereng - 2) < 1e-9 && Math.abs(g.titik - 1) < 1e-9 && Math.abs(g.r - 1) < 1e-9);
  assert.ok(Math.abs(airTahun(1000, 0.65, 2.6) - 14.8044) < 1e-3); // 1000 MW * 8760 * .65 * 2,6 m3 = 14,8 juta m3
});
test('geometri: titik dalam poligon (lubang dihitung) dan penyederhanaan menjaga ujung', () => {
  const luar = [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]], lubang = [[4, 4], [6, 4], [6, 6], [4, 6], [4, 4]];
  assert.equal(dalamPoligon(1, 1, [luar, lubang]), true); assert.equal(dalamPoligon(5, 5, [luar, lubang]), false); assert.equal(dalamPoligon(11, 5, [luar]), false);
  const sisi = (x0, y0, x1, y1) => Array.from({ length: 20 }, (_, i) => [x0 + ((x1 - x0) * i) / 20 + (i % 2) * 0.001, y0 + ((y1 - y0) * i) / 20]);
  const cincin = [...sisi(0, 0, 10, 0), ...sisi(10, 0, 10, 10), ...sisi(10, 10, 0, 10), ...sisi(0, 10, 0, 0)]; cincin.push(cincin[0]);
  const s = sederhana(cincin, 0.01);
  assert.ok(s.length < cincin.length / 2 && s[0] === cincin[0] && s.at(-1) === cincin.at(-1));
});
test('data/air_energi.json: bobot Hipotesis, DAS terpetakan konsisten, geometri <= 4 MB, sumber lengkap', { skip: !fs.existsSync('public/data/air_energi.json') }, () => {
  const d = JSON.parse(fs.readFileSync('public/data/air_energi.json', 'utf8'));
  assert.equal(d.meta.label, 'hipotesis');
  assert.ok(d.meta.sumber.every((s) => s.judul && s.penerbit && s.lisensi && s.url));
  assert.ok(d.pembangkit.length > 100 && d.das.length > 10);
  const dasId = new Set(d.das.map((x) => x.id));
  for (const p of d.pembangkit) { if (p.das) assert.ok(dasId.has(p.das), p.id); if (p.skor != null) assert.ok(p.skor >= 0 && p.skor <= 100, p.id); assert.ok(p.presisi !== 'provinsi' || !p.das, 'presisi provinsi tidak dipetakan ke DAS: ' + p.id); }
  assert.equal(d.ringkas.das_terpetakan, d.das.length);
  assert.equal(d.ringkas.mw_rawan, Math.round(d.das.filter((x) => x.skor >= d.meta.rawan).reduce((a, x) => a + x.mw, 0)));
  const g = fs.statSync('public/data/geo/das_hidro.geojson').size; assert.ok(g <= 4 * 1024 * 1024, 'geojson ' + g);
  const geo = JSON.parse(fs.readFileSync('public/data/geo/das_hidro.geojson', 'utf8'));
  assert.equal(geo.features.length, d.das.length);
  assert.ok(d.tren.tahun.length === d.tren.cf_persen.length && d.tren.regresi.lereng < 0, 'El Nino menurunkan faktor kapasitas');
});
