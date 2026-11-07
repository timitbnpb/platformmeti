import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { selftest, susun, validasi } from '../scripts/pipa/topik_penyimpanan.mjs';

test('selftest topik penyimpanan lolos', () => { selftest(); });
test('naskah valid menurut TOPIK-SKEMA, kasus K terisi, hak jawab di bab 40', () => {
  const d = susun();
  assert.deepEqual(validasi(d), []);
  assert.ok(Object.keys(d.bab).length >= 30);
  assert.ok(d.bab['39'].butir.length >= 4 && d.bab["40"].butir.length >= 4);
  for (const k of d.bab['40'].butir) assert.equal(k.hak_jawab, true);
});
test('public/data/topik/penyimpanan.json sinkron dengan skrip', () => {
  const f = new URL('../public/data/topik/penyimpanan.json', import.meta.url);
  assert.deepEqual(JSON.parse(fs.readFileSync(f, 'utf8')), JSON.parse(JSON.stringify(susun())));
});
