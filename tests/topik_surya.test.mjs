import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { selftest, susun, validasi } from '../scripts/pipa/topik_surya.mjs';

test('selftest topik surya lolos', () => { selftest(); });
test('naskah valid menurut TOPIK-SKEMA, kasus K terisi, hak jawab di bab 40', () => {
  const d = susun();
  assert.deepEqual(validasi(d), []);
  assert.ok(Object.keys(d.bab).length >= 30);
  assert.ok(d.bab['39'].butir.length >= 5 && d.bab['40'].butir.length >= 5);
});
test('public/data/topik/surya.json sinkron dengan skrip', () => {
  const f = new URL('../public/data/topik/surya.json', import.meta.url);
  assert.deepEqual(JSON.parse(fs.readFileSync(f, 'utf8')), JSON.parse(JSON.stringify(susun())));
});
