import test from 'node:test';
import assert from 'node:assert/strict';
import { provinsi, token, jaccard, mwDariNama, indeksProyek, cocokProyek, indeksOrg, cocokOrg } from '../scripts/pipa/_cocok.mjs';
import { bolehRobots } from '../scripts/pipa/_panen_sopan.mjs';

test('provinsi: Inggris, Indonesia, huruf besar, ada imbuhan', () => {
  assert.equal(provinsi('West Java Province'), 'Jawa Barat'); assert.equal(provinsi('JAWA BARAT'), 'Jawa Barat');
  assert.equal(provinsi('Ujung Batu district. Rokan Hulu Region, Prov. Riau'), 'Riau'); assert.equal(provinsi('na'), null); assert.equal(provinsi(null), null);
  assert.equal(provinsi('North Sumatra'), 'Sumatera Utara');
});
test('cocokProyek: provinsi bertentangan dibuang; ambigu tidak ditautkan; unik ditautkan', () => {
  const idx = indeksProyek([{ id: 'a', nama: 'Musi hydro', teknologi: 'hidro', lokasi: { provinsi: 'Bengkulu' }, kapasitas: [{ nilai: 210, satuan: 'MW' }] }, { id: 'b', nama: 'Wayang Windu', teknologi: 'panas-bumi', lokasi: { provinsi: 'Jawa Barat' }, kapasitas: [] }, { id: 'c', nama: 'PLTP Wayang Windu', teknologi: 'panas-bumi', lokasi: { provinsi: 'Jawa Barat' }, kapasitas: [] }]);
  assert.equal(cocokProyek('210 MW Musi Hydro Power Plant', 'Bengkulu', 210, idx, 'hidro').proyek_id, 'a');
  assert.equal(cocokProyek('210 MW Musi Hydro Power Plant', 'Riau', 210, idx, 'hidro').kandidat.length, 0);
  assert.equal(cocokProyek('Wayang Windu Phase 2 Geothermal', 'Jawa Barat', null, idx, 'panas-bumi').proyek_id, null);
  assert.equal(cocokProyek('Wayang Windu Phase 2 Geothermal', 'Jawa Barat', null, idx, 'panas-bumi').kandidat.length, 2);
});
test('cocokOrg: eksak pada nama bersih; ambigu null', () => {
  const o = indeksOrg([{ id: '1', nama: 'PLN' }, { id: '2', nama: 'PT Star Energy Geothermal' }, { id: '3', nama: 'PT Dua' }, { id: '4', nama: 'Dua Ltd' }]);
  assert.equal(cocokOrg('PT. PLN (Persero)', o)?.id, '1'); assert.equal(cocokOrg('Star Energy Geothermal Ltd', o)?.id, '2'); assert.equal(cocokOrg('Dua', o), null);
});
test('util', () => { assert.equal(mwDariNama('50 MW Sipansihaporas'), 50); assert.equal(jaccard(token('abc def'), token('abc def')), 1); assert.equal(mwDariNama('tanpa'), null); });
test('robots: Disallow terpanjang menang, hanya agen *', () => {
  const r = 'User-agent: Bot\nDisallow: /\n\nUser-agent: *\nDisallow: /login\nAllow: /login/ok';
  assert.equal(bolehRobots(r, '/data'), true); assert.equal(bolehRobots(r, '/login'), false); assert.equal(bolehRobots(r, '/login/ok'), true); assert.equal(bolehRobots('User-agent: *\nDisallow: /', '/x'), false);
});
