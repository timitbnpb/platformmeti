import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { selftest, susun, validasi } from '../scripts/pipa/topik_surya.mjs';

test('selftest topik surya lolos', () => { selftest(); });
test('42 bab, K terisi, tanpa em dash, id+en', () => {
  const d = susun();
  assert.deepEqual(validasi(d), []);
  assert.equal(d.bab.length, 42);
  for (const n of [39, 40, 41, 42]) assert.equal(d.bab[n - 1].status, 'isi');
});
test('berkas data/topik/surya.json sinkron dengan skrip', () => {
  const f = new URL('../data/topik/surya.json', import.meta.url);
  assert.deepEqual(JSON.parse(fs.readFileSync(f, 'utf8')), JSON.parse(JSON.stringify(susun())));
});
