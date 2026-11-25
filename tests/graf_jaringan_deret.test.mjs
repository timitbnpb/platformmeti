// KJ-05: deret 2014-2024 di statResmi (kartu provinsi), siapProv/provDi, dan penamaan sistem lewat GeoNames.
// Yang salah DITOLAK: baris tingkat unit/induk, nilai null, dan kota di luar radius tak boleh ikut.
import test from 'node:test';
import assert from 'node:assert/strict';
import { statResmi, siapProv, provDi, bangun } from '../scripts/pipa/graf_jaringan.mjs';
import { elemen, ctx, CELAH_SUMATERA } from './fixture/kembaran/dunia.mjs';
import { SR } from './fixture/kembaran/sumber.mjs';
import { KOTA } from './fixture/kembaran/pelengkap.mjs';

const mva = (tahun, kv, m, o = {}) => ({ tahun, tingkat: 'provinsi', prov_kode: '32', unit: 'UIW Barat', kv, unit_trafo: 1, mva: m, src: `PLN-STAT-${tahun}`, ...o });
const saidi = (tahun, v, o = {}) => ({ tahun, tingkat: 'provinsi', unit: 'UIW Barat', prov_kode: '32', saidi_jam: v, saifi_kali: 1, src: `PLN-STAT-${tahun}`, st: 'sumber', ...o });
const deret = () => {
  const s = SR();
  s.mva_provinsi_tegangan = [mva(2022, '150', 100), mva(2022, '70', 20), mva(2024, '150', 200), mva(2024, '70', 50),
    mva(2024, '150', 9999, { tingkat: 'unit', unit: 'Wilayah Gabungan' }), mva(2024, '500', 7777, { tingkat: 'induk' }), mva(2023, '150', null)]; // unit/induk dan mva null tak boleh dijumlah
  s.saidi_saifi = [saidi(2024, 4), saidi(2022, 8), saidi(2023, 99, { tingkat: 'unit' }), saidi(2021, null), saidi(2020, 5, { prov_kode: null })];
  s.penjualan_provinsi = [{ tahun: 2022, tingkat: 'provinsi', prov_kode: '32', unit: 'Satu', baris: 'Satu', gwh: 100, src: 'PLN-STAT-2022', st: 'sumber' }, { tahun: 2022, tingkat: 'provinsi', prov_kode: '32', unit: 'Dua', baris: 'Dua', gwh: 50, src: 'PLN-STAT-2022', st: 'sumber' },
    { tahun: 2022, tingkat: 'unit', prov_kode: '32', unit: 'Induk', baris: 'Induk', gwh: 5000, src: 'PLN-STAT-2022', st: 'sumber' }, { tahun: 2023, tingkat: 'induk', prov_kode: '32', unit: 'Induk', baris: 'Induk', gwh: 6000, src: 'PLN-STAT-2023', st: 'sumber' },
    { tahun: 2024, tingkat: 'provinsi', prov_kode: '32', unit: 'BPS', baris: 'BPS', gwh: 4000, src: 'BPS-859-2024', st: 'sumber' }, { tahun: 2024, tingkat: 'provinsi', prov_kode: '32', unit: 'X', baris: 'X', gwh: null, src: 'BPS-859-2024', st: 'sumber' }];
  return s;
};
const prov32 = (s = deret()) => statResmi(s, { sistem: [], namaProv: new Map([['32', 'Provinsi Barat']]), kodeProv: new Map() }).kartuProvinsi.find((k) => k.kode === '32');

test('penjaga: fixture deret terbaca (bukan hijau-kosong)', () => {
  const s = deret(); assert.ok(s.mva_provinsi_tegangan.length >= 7 && s.saidi_saifi.length >= 5 && s.penjualan_provinsi.length >= 6, 'fixture deret terlalu sedikit');
  assert.ok(prov32(), 'kartu provinsi 32 tak terbentuk');
});

test('deret_total_mva: per tahun dari baris tingkat provinsi saja; unit/induk dan mva null DITOLAK', () => {
  const d = prov32().deret_total_mva;
  assert.deepEqual(d.map((x) => [x.tahun, x.total_mva]), [[2022, 120], [2024, 250]], `deret ${JSON.stringify(d.map((x) => [x.tahun, x.total_mva]))}: unit 9999, induk 7777, mva null tak boleh ikut`);
  assert.ok(d.every((x) => x.st === 'hitung' && /^PLN-STAT-\d{4}$/.test(x.src) && x.tgl === String(x.tahun)), 'tiap titik deret hitung + src + tgl');
  assert.equal(prov32().mva_per_kv.tahun, 2024, 'kartu per kV memakai tahun terakhir'); assert.equal(prov32().mva_per_kv.total_mva, 250);
  const s = deret(); s.mva_provinsi_tegangan = [mva(2024, '150', 1, { tingkat: 'unit' })];
  assert.equal(prov32(s)?.deret_total_mva, undefined, 'hanya baris unit: tak ada deret provinsi'); assert.equal(prov32(s)?.mva_per_kv, undefined);
});

test('keandalan_deret: terurut tahun naik; unit/induk, saidi null, tanpa kode provinsi DITOLAK', () => {
  const k = prov32().keandalan_deret;
  assert.deepEqual(k.map((x) => [x.tahun, x.saidi]), [[2022, 8], [2024, 4]], `keandalan ${JSON.stringify(k.map((x) => [x.tahun, x.saidi]))}`);
  assert.deepEqual(Object.keys(k[0]).sort(), ['saidi', 'saifi', 'src', 'st', 'tahun', 'tgl', 'unit']); assert.equal(k[0].tgl, '2022'); assert.equal(k[0].st, 'sumber');
  const s = deret(); s.saidi_saifi = [saidi(2023, 1, { tingkat: 'unit' })];
  assert.equal(prov32(s).keandalan_deret, undefined, 'tanpa baris provinsi: tak ada deret'); // kartu tetap ada karena mva/penjualan
});

test('penjualan_gwh: deret per tahun; beberapa baris sama tahun dijumlah (hitung) dan berlabel unit; unit/induk dan gwh null DITOLAK', () => {
  const p = prov32().penjualan_gwh, t = (y) => p.find((x) => x.tahun === y);
  assert.deepEqual(p.map((x) => x.tahun), [2022, 2024], `tahun penjualan ${p.map((x) => x.tahun)}: 2023 hanya baris induk, harus hilang`);
  assert.equal(t(2022).gwh, 150, 'unit 5000 tak boleh dijumlah'); assert.equal(t(2022).st, 'hitung'); assert.deepEqual(t(2022).unit, ['Dua', 'Satu']);
  assert.equal(t(2024).gwh, 4000, 'gwh null tak ikut'); assert.equal(t(2024).st, 'sumber'); assert.equal(t(2024).unit, undefined);
});

test('kartu provinsi: tanpa mva, penjualan, dan keandalan tidak dibuat; hanya mva cukup, tanpa deret keandalan', () => {
  const s = deret(); s.penjualan_provinsi = []; s.saidi_saifi = [];
  const k = prov32(s); assert.ok(k.mva_per_kv && !k.penjualan_gwh && !k.keandalan_deret, 'hanya mva');
  const kosong = deret(); kosong.mva_provinsi_tegangan = []; kosong.penjualan_provinsi = []; kosong.saidi_saifi = [];
  assert.equal(prov32(kosong), undefined, 'tanpa data apa pun: kartu tak boleh ada');
  // ponytail: kartu keandalan-saja tak dibuat karena kode provinsi hanya dari mva+penjualan (graf_jaringan.mjs:446); tidak dikunci di sini
});

// ---- siapProv / provDi
const kotakGeo = (kode, x0, x1, bolong) => ({ type: 'Feature', properties: { kode }, geometry: { type: 'Polygon', coordinates: [[[x0, 0], [x1, 0], [x1, 4], [x0, 4], [x0, 0]], ...(bolong ? [[[x0 + 1, 1], [x1 - 1, 1], [x1 - 1, 3], [x0 + 1, 3], [x0 + 1, 1]]] : [])] } });
test('siapProv: terurut menurut kode, kotak pembatas benar, MultiPolygon diterima; provDi menolak lubang dan titik di luar', () => {
  const multi = { type: 'Feature', properties: { kode: '05' }, geometry: { type: 'MultiPolygon', coordinates: [[[[20, 0], [21, 0], [21, 1], [20, 1], [20, 0]]], [[[30, 5], [32, 5], [32, 7], [30, 7], [30, 5]]]] } };
  const idx = siapProv({ features: [kotakGeo('20', 10, 14, true), multi, kotakGeo('10', 0, 4)] });
  assert.deepEqual(idx.map((p) => p.kode), ['05', '10', '20']); assert.deepEqual(idx[0].bb, [20, 0, 32, 7], 'bb MultiPolygon mencakup semua bagian'); assert.equal(idx[0].polys.length, 2);
  assert.equal(provDi(idx, 2, 2).kode, '10'); assert.equal(provDi(idx, 11, 0.5).kode, '20', 'di dalam polygon luar, di luar lubang');
  assert.equal(provDi(idx, 12, 2), null, 'titik di lubang DITOLAK'); assert.equal(provDi(idx, 50, 50), null, 'di luar semua provinsi DITOLAK'); assert.equal(provDi(idx, 31, 6).kode, '05', 'bagian kedua MultiPolygon');
  assert.equal(provDi(idx, 2, 2, idx[2]).kode, '10', 'petunjuk salah tak boleh menang atas poligon yang benar');
  assert.equal(provDi(idx, 2, 2, idx[1]).kode, '10');
  assert.ok(idx.length >= 3, 'penjaga: provinsi terbaca');
});

// ---- penamaan sistem lewat GeoNames: kota terpadat dalam 25 km, lalu 60 km, lalu nama gardu terdekat
const g = (id, x, y, n) => ({ type: 'node', id, lat: y, lon: x, tags: { power: 'substation', voltage: '150000', name: n } });
const w = (id, a, b) => ({ type: 'way', id, tags: { power: 'line', voltage: '150000' }, geometry: [{ lat: a[1], lon: a[0] }, { lat: b[1], lon: b[0] }] });
const PULAU = [g(301, 109.6, -6.2, 'GI Pulau Satu'), g(302, 109.9, -6.2, 'GI Pulau Dua'), g(303, 109.75, -6.4, 'GI Pulau Tiga'), w(311, [109.6, -6.2], [109.9, -6.2]), w(312, [109.9, -6.2], [109.75, -6.4]), w(313, [109.75, -6.4], [109.6, -6.2])];
const meta = { sumber: 'geonames-id', judul: 'GeoNames uji (contoh)', url: 'https://example.org/gn', lisensi: 'CC BY 4.0', tanggal_ambil: '2026-11-25' };
const namaPulau = (kota) => { const c = ctx(); if (kota) c.geonames = { meta, kota }; const o = bangun([...elemen(), ...PULAU], c, '2026-11-25', CELAH_SUMATERA); return o.objek.sis.find((s) => s.id !== 'sis_jawa-bali'); };

test('penamaan GeoNames: kota terpadat dalam 25 km menang; fixture memuat sistem kedua (penjaga)', () => {
  const s = namaPulau([['Kota Padat', -6.3, 109.75, 900, 'PPLA2'], ['Kota Kecil', -6.3, 109.76, 10, 'PPLA2']]);
  assert.ok(s, 'sistem kedua (kepulauan uji) tak terbentuk: fixture PULAU rusak'); assert.equal(s.nama, 'Potongan Kota Padat', `nama ${s.nama}`); assert.equal(s.nama_sumber, 'hitung');
  assert.equal(namaPulau([['Kota Besar Jauh', -6.3, 109.75, 5000000, 'PPLC'], ['Kota Dekat', -6.3, 109.75, 5, 'PPLA2']]).nama, 'Potongan Kota Besar Jauh', 'keduanya dalam 25 km: terpadat');
});

test('penamaan GeoNames: kota di 25-60 km dipakai bila tak ada yang lebih dekat; di luar 60 km DITOLAK -> nama gardu; tanpa GeoNames -> gardu', () => {
  assert.equal(namaPulau([['Kota Jauh', -6.3, 110.2, 900, 'PPLA2']]).nama, 'Potongan Kota Jauh', 'sekitar 50 km: lewat 25, dalam 60 km');
  assert.equal(namaPulau([['Kota Sangat Jauh', -5.0, 109.75, 900, 'PPLA2']]).nama, 'Potongan Pulau Tiga', 'sekitar 144 km: tak boleh dipakai, nama gardu terdekat dari pusat');
  assert.equal(namaPulau().nama, 'Potongan Pulau Tiga', 'tanpa GeoNames');
  assert.equal(namaPulau([['Kota Dekat Kecil', -6.3, 109.75, 5, 'PPLA2'], ['Kota Jauh Besar', -6.3, 110.2, 9000000, 'PPLC']]).nama, 'Potongan Kota Dekat Kecil', 'radius 25 km didahulukan atas 60 km walau yang jauh lebih padat');
  const gn = KOTA(); assert.ok(gn.kota.length >= 4, 'penjaga fixture GeoNames');
});
