import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { barisDariLens } from '../scripts/panen/paten.mjs';
import { ringkas } from '../scripts/panen/openalex_kampus.mjs';

test('barisDariLens memetakan pemohon ke organisasi dan teknologi', () => {
  const h = { lens_id: '001-002', year_published: 2022, jurisdiction: 'ID', biblio: { invention_title: [{ text: 'Sel surya' }], parties: { applicants: [{ extracted_name: { value: 'Institut Teknologi Bandung' } }] }, classifications_cpc: { classifications: [{ symbol: 'H01L31/04' }] } } };
  const b = barisDariLens(h, [{ id: 'l_itb', nama: 'Institut Teknologi Bandung' }]);
  assert.deepEqual(b.organisasi_id, ['l_itb']);
  assert.equal(b.tahun, 2022);
  assert.ok(b.tautan.endsWith('001-002'));
});

test('ringkas riset kampus: tren terurut, ID dibuang, sitasi batas bawah', () => {
  const r = ringkas([{ key: '2021', count: 5 }, { key: '2020', count: 3 }], [{ key: 'https://openalex.org/countries/ID', count: 9 }, { key: 'https://openalex.org/countries/JP', count: 2 }], [{ key: '10', count: 2 }, { key: '0', count: 4 }]);
  assert.deepEqual(Object.keys(r.tren_tahunan), ['2020', '2021']);
  assert.deepEqual(r.kolaborator_negara, [{ iso2: 'JP', karya: 2 }]);
  assert.equal(r.sitasi_min, 20);
});

test('paten.json valid dan setiap baris ber-sumber, atau kosong dengan celah', () => {
  const d = JSON.parse(fs.readFileSync(new URL('../public/data/paten.json', import.meta.url)));
  assert.equal(d.jumlah, d.baris.length);
  if (!d.baris.length) assert.ok(d.meta.celah.length >= 3);
  for (const b of d.baris) assert.ok(b.tautan && b.tanggal_periksa);
});
