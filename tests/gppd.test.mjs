import test from 'node:test';
import assert from 'node:assert/strict';
import { D, BYTES, cekKepala } from './_umum.mjs';
import { parseCsv } from '../scripts/pipa/gppd.mjs';

test('parseCsv: kutip, koma, baris baru dalam kutip', () => {
  const r = parseCsv('a,b\n"x,1","y ""q""\nz"\n2,3\n');
  assert.deepEqual(r, [{ a: 'x,1', b: 'y "q"\nz' }, { a: '2', b: '3' }]);
});
test('gppd.json: skema', () => {
  const d = D('gppd.json'); cekKepala(d, { lisensi: /CC BY 4\.0/ });
  assert.ok(d.baris.length > 100 && d.baris.length < 400); assert.ok(BYTES('gppd.json') < 3e6);
  const proyek = new Set(D('proyek.json').baris.map((p) => p.id)); const ids = new Set();
  for (const b of d.baris) {
    assert.ok(b.id && !ids.has(b.id)); ids.add(b.id);
    assert.ok(b.kapasitas_mw > 0, b.id); assert.ok(b.lat > -12 && b.lat < 7 && b.lng > 94 && b.lng < 142, b.id);
    if (b.proyek_id) assert.ok(proyek.has(b.proyek_id), b.id);
  }
  assert.equal(d.meta.tertaut_proyek, d.baris.filter((b) => b.proyek_id).length);
});
