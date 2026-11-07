import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { D } from './_umum.mjs';

test('esdm_peristiwa.mjs --selftest', () => {
  assert.match(execFileSync('node', ['scripts/pipa/esdm_peristiwa.mjs', '--selftest'], { encoding: 'utf8' }), /selftest ok/);
});

test('peristiwa_ebt.json: bersumber, perlu_tinjau, tautan ke proyek ada', () => {
  const d = D('peristiwa_ebt.json'); const p = new Set(D('proyek.json').baris.map((x) => x.id));
  assert.equal(d.jumlah, d.baris.length);
  for (const b of d.baris) {
    assert.match(b.sumber_url, /^https:\/\/www\.esdm\.go\.id\//); assert.ok(b.tanggal_periksa && b.tingkat_bukti && b.perlu_tinjau === true);
    assert.ok(!b.proyek_id || p.has(b.proyek_id), b.id); assert.doesNotMatch(b.judul, /[–—]/);
  }
});
