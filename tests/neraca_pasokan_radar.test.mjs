import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { JENIS, PERISTIWA, sahkan } from '../scripts/panen/radar_rantai_lib.mjs';

const rd = (f) => JSON.parse(fs.readFileSync(new URL('../public/data/' + f, import.meta.url), 'utf8'));
const j = rd('global/radar_rantai.json');
const org = new Set([...rd('organisasi.json').baris, ...rd('global/pelaku_global.json').baris].map((o) => o.id));
const kd = new Set(rd('global/kebijakan_dagang.json').baris.map((b) => b.id));

test('tiap peristiwa lolos sahkan, id unik, tanpa ditolak', () => {
  for (const e of PERISTIWA) assert.equal(sahkan(e, org), null, e.id);
  assert.equal(new Set(j.baris.map((b) => b.id)).size, j.baris.length);
  assert.deepEqual(j.ditolak, []);
});
test('sahkan menolak jenis/tanggal/url/foto Antara/org_id palsu', () => {
  const e = PERISTIWA[0];
  assert.equal(sahkan({ ...e, jenis: 'x' }), 'jenis');
  assert.equal(sahkan({ ...e, tanggal: '2023-01-01' }), 'tanggal');
  assert.equal(sahkan({ ...e, url: 'http://a.b' }), 'url');
  assert.equal(sahkan({ ...e, url: 'https://www.antaranews.com/x' }), 'sumber_foto_antara');
  assert.equal(sahkan({ ...e, org_ids: ['nope'] }, org), 'org_id');
});
test('keluaran: terurut menurun, berikon, tanpa foto, tertaut ke kebijakan_dagang', () => {
  for (let i = 1; i < j.baris.length; i++) assert.ok(j.baris[i - 1].tanggal >= j.baris[i].tanggal);
  for (const b of j.baris) { assert.ok(JENIS[b.jenis].ikon === b.ikon && !('gambar' in b)); if (b.ikat) assert.ok(kd.has(b.ikat.split('.')[1]), b.id); }
});
