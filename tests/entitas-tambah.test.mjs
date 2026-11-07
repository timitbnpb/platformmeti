import test from 'node:test';
import assert from 'node:assert/strict';
import { baris, validasi, idEntitas } from '../scripts/pipa/entitas_tambah.mjs';

test('entitas_tambah: berkas kurasi lolos validasi, id unik, sumber berurl', () => {
  const b = baris();
  assert.ok(b.length >= 15);
  assert.equal(new Set(b.map((x) => x.id)).size, b.length);
  for (const x of b) { assert.match(x.id, /^en_/); assert.ok(x.sumber.every((s) => /^https:\/\//.test(s.url))); }
});
test('entitas_tambah: tanpa sumber ditolak, id deterministik', () => {
  assert.equal(validasi({ baris: [{ nama: 'A', kategori: 'swasta', sumber: [] }] }).length, 1);
  assert.equal(idEntitas('PT A'), idEntitas('pt a'));
});
