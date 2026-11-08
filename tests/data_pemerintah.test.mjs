import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { parseCsv, bangunBulanan, bulanRentang, pembatasIndonesia, luarNegeri, HS_BULANAN } from '../scripts/panen/data_pemerintah_lib.mjs';
import { gabung, ubinBaru } from '../scripts/panen/data_pemerintah_osm.mjs';

const baca = (f) => JSON.parse(fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8'));
const luar = baca('public/geo/luar-indonesia.json');
const P = 'public/data/pemerintah/';

test('parseCsv: koma berkutip dan titik koma berdesimal koma', () => {
  const a = parseCsv('periode,investasi_rp_juta,investasi_us_ribu,tki,nama_sektor\n2025 - Triwulan 3,"1.5",2,3,"Industri  Mesin, Elektronik"\n');
  assert.equal(a[0].rp, 1.5); assert.equal(a[0].nama_sektor, 'Industri  Mesin, Elektronik');
  const b = parseCsv('﻿periode;investasi_rp_juta;investasi_us_ribu;tki\n2026 - Triwulan 2;16706,39831;1012,5;30\n');
  assert.equal(b[0].rp, 16706.39831); assert.equal(b[0].tki, 30);
});
test('bulanRentang dan bangunBulanan: dunia (p=0) jadi total, mitra urut nilai, lainnya = sisa', () => {
  assert.deepEqual(bulanRentang('2022-11', '2023-02'), ['202211', '202212', '202301', '202302']);
  const peta = new Map([[156, { iso2: 'cn' }], [392, { iso2: 'jp' }]]);
  const r = bangunBulanan([{ hs: '854143', alir: 'M', bulan: '202401', ambil: '2026-11-08', data: [{ p: 0, v: 100, w: 9 }, { p: 392, v: 10, w: 1 }, { p: 156, v: 80, w: 8 }, { p: 999, v: 5, w: 1 }] }], peta, 1);
  assert.equal(r[0].usd, 100); assert.equal(r[0].bulan, '2024-01'); assert.equal(r[0].mitra[0].iso2, 'cn'); assert.equal(r[0].lainnya_usd, 20); assert.equal(r[0].alir, 'impor');
});
test('batas negara: Jakarta, Medan, Jayapura dalam; Kuala Lumpur, Kuching, Bandar Seri Begawan, Dili-timur, Port Moresby luar', () => {
  const b = pembatasIndonesia(luar);
  for (const [x, y] of [[106.83, -6.2], [98.67, 3.59], [140.7, -2.53]]) assert.ok(b.dalam(x, y), `${x},${y}`);
  for (const [x, y] of [[101.69, 3.14], [110.35, 1.55], [114.94, 4.89], [147.18, -9.44]]) assert.ok(!b.dalam(x, y) && luarNegeri([[x, y]], b), `${x},${y}`);
});
test('gabung: objek Malaysia disaring, id lama menang, cakupan bertambah', () => {
  const tr = { meta: { cakupan_bbox: [[-5, 95, 1, 103]], celah: ['Cakupan panen: 1 ubin'], jumlah: 1 }, garis: [{ id: 1, teg_kv: 150, nama: 'lama', operator: null, koordinat: [[106.8, -6.2], [106.9, -6.3]] }] };
  const gd = { meta: { cakupan_bbox: [[-5, 95, 1, 103]], celah: ['Cakupan panen: 1 ubin'], jumlah: 0 }, gardu: [] };
  const geom = (pts) => pts.map(([lon, lat]) => ({ lat, lon }));
  const el = [
    { type: 'way', id: 1, tags: { power: 'line', voltage: '500000', name: 'baru' }, geometry: geom([[106.8, -6.2], [106.9, -6.3]]) },
    { type: 'way', id: 2, tags: { power: 'line', voltage: '275000', name: 'KL' }, geometry: geom([[101.6, 3.1], [101.7, 3.2]]) },
    { type: 'way', id: 3, tags: { power: 'line', voltage: '150000', name: 'Sulut' }, geometry: geom([[124.8, 1.4], [124.9, 1.5]]) },
    { type: 'node', id: 4, lat: 3.14, lon: 101.69, tags: { power: 'substation', voltage: '275000', name: 'KL GIS', operator: 'TNB' } },
    { type: 'node', id: 5, lat: -6.9, lon: 107.6, tags: { power: 'substation', voltage: '150000', name: 'GI Bandung', operator: 'PLN' } },
  ];
  const o = gabung(tr, gd, el, '2026-11-08', [[-5, 119, 1, 127]], luar);
  assert.deepEqual(o.transmisi.garis.map((l) => l.id), [1, 3]);
  assert.equal(o.transmisi.garis[0].nama, 'lama');
  assert.deepEqual(o.gardu.gardu.map((g) => g.id), ['n5']);
  assert.equal(o.gardu.gardu[0].operator, 'PLN');
  assert.equal(o.transmisi.meta.cakupan_bbox.length, 2); assert.equal(o.transmisi.meta.jumlah, 2);
  assert.ok(ubinBaru([]).length > 10);
});
test('transmisi.json dan gardu.json terbit: tak ada objek di luar Indonesia, id unik', () => {
  const b = pembatasIndonesia(luar), t = baca('public/geo/transmisi.json'), g = baca('public/geo/gardu.json');
  assert.deepEqual(t.garis.filter((l) => luarNegeri(l.koordinat, b)).map((l) => l.id), []);
  assert.deepEqual(g.gardu.filter((s) => luarNegeri([[s.lng, s.lat]], b)).map((s) => s.id), []);
  assert.equal(new Set(t.garis.map((l) => l.id)).size, t.garis.length);
  assert.equal(t.meta.jumlah, t.garis.length); assert.equal(g.meta.jumlah, g.gardu.length);
});
test('comtrade_bulanan: HS dikenal, iso2 dua huruf, bulan format, sumber terdaftar', () => {
  const j = baca(P + 'comtrade_bulanan.json');
  assert.ok(j.sumber.some((s) => s.id === 's-comtrade-bulanan' && /^https:/.test(s.url) && s.tingkat_bukti));
  assert.ok(j.baris.length > 50);
  for (const r of j.baris) {
    assert.ok(HS_BULANAN[r.hs], r.hs); assert.match(r.bulan, /^20\d\d-\d\d$/); assert.ok(['impor', 'ekspor'].includes(r.alir));
    assert.ok(r.usd >= 0); for (const m of r.mitra) assert.match(m.iso2, /^[a-z]{2}$/);
    assert.ok(r.mitra.reduce((a, m) => a + m.usd, 0) + r.lainnya_usd <= r.usd + r.mitra.length + 1, r.hs + r.bulan);
  }
  assert.equal(new Set(j.baris.map((r) => `${r.hs}|${r.alir}|${r.bulan}`)).size, j.baris.length);
  assert.ok(j.meta.celah.some((c) => /kuota|belum dilaporkan/i.test(c)));
});
test('bkpm_listrik: total Q3 2025 cocok siaran resmi, provinsi bertaut kode BPS, negara beriso2', () => {
  const j = baca(P + 'bkpm_listrik.json');
  const q3 = j.sektor.filter((s) => s.tahun === 2025 && s.triwulan === 3);
  const total = q3.reduce((a, s) => a + s.total_semua_sektor.rp_juta, 0) / 1e6;
  assert.ok(Math.abs(total - 491.4) < 0.1, String(total));
  assert.ok(q3.every((s) => s.listrik_gas_air.rp_juta > 0 && s.listrik_gas_air.rp_juta < s.total_semua_sektor.rp_juta));
  assert.ok(j.provinsi.length > 100 && j.provinsi.every((p) => /^\d\d$/.test(p.kode)), 'provinsi tanpa kode BPS');
  for (const p of j.provinsi) assert.ok(fs.existsSync(new URL(`../public/data/wilayah/${p.kode}.json`, import.meta.url)), p.kode);
  const tanpaIso = j.negara_asal_pma.filter((n) => !n.iso2).map((n) => n.negara);
  assert.deepEqual([...new Set(tanpaIso)], []);
  assert.ok(j.sumber[0].url.startsWith('https://data.bkpm.go.id'));
});
test('iea_indonesia dan pengadaan_industri: tiap butir bersumber terdaftar, celah jujur, tanpa paket karangan', () => {
  const iea = baca(P + 'iea_indonesia.json'), ids = new Set(iea.sumber.map((s) => s.id));
  assert.ok(iea.angka.length >= 15);
  for (const a of iea.angka) { assert.ok(ids.has(a.sumber_id)); assert.ok(typeof a.nilai === 'number'); assert.ok(['indonesia', 'asia_tenggara'].includes(a.cakupan)); }
  for (const s of iea.sumber) assert.ok(s.url.startsWith('https://www.iea.org/') && s.tingkat_bukti && s.tanggal_baca);
  const p = baca(P + 'pengadaan_industri.json'), pid = new Set(p.sumber.map((s) => s.id));
  assert.deepEqual(p.paket_tender, []);
  assert.ok(p.meta.celah.some((c) => /LPSE/.test(c)) && p.meta.celah.some((c) => /SIPP/.test(c)));
  for (const x of [...p.rekap_pabrik, ...p.pabrik]) { assert.ok(pid.has(x.sumber_id), x.id); assert.ok(x.tingkat_bukti); }
});
