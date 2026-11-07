import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { D } from './_umum.mjs';

test('komitmen_iklim.mjs --selftest', () => {
  assert.match(execFileSync('node', ['scripts/pipa/komitmen_iklim.mjs', '--selftest'], { encoding: 'utf8' }), /selftest ok/);
});

test('komitmen_iklim.json: tiap baris bersumber, id unik, hanya Indonesia', () => {
  const d = D('komitmen_iklim.json');
  assert.equal(d.jumlah, d.baris.length); assert.ok(d.meta.sbti > 0 && d.meta.re100 >= 1);
  const k = new Set();
  for (const b of d.baris) {
    assert.ok(b.sumber_url && b.tanggal_periksa && b.tingkat_bukti, b.id); assert.ok(!k.has(b.id), b.id); k.add(b.id);
    assert.match(b.id, /^(sbti_\d+|re100_[a-z0-9-]+)$/);
  }
});
