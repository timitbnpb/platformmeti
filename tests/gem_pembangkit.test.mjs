import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const d = JSON.parse(fs.readFileSync(new URL('../public/data/gem_pembangkit.json', import.meta.url), 'utf8'));
test('gem_pembangkit.mjs --selftest', () => { assert.match(execFileSync('node', ['scripts/pipa/gem_pembangkit.mjs', '--selftest'], { cwd: new URL('..', import.meta.url), encoding: 'utf8' }), /selftest ok/); });
test('gem_pembangkit.json: lisensi, atribusi, id unik, ragu di bawah ambang', () => {
  assert.match(d.lisensi, /CC BY 4\.0/); assert.equal(d.sumber.length, 5);
  assert.equal(new Set(d.baris.map((b) => b.id)).size, d.baris.length); assert.equal(d.meta.jumlah, d.baris.length);
  for (const b of d.baris) {
    assert.match(b.url_wiki || 'https://x', /^https:\/\//);
    const p = b.pencocokan; assert.ok(['cocok', 'ragu', 'baru', 'dicatat', 'tidak-berlaku'].includes(p.status));
    if (p.status === 'cocok') assert.ok(p.skor >= d.ambang_cocok); if (p.status === 'ragu') assert.ok(p.skor < d.ambang_cocok);
  }
  assert.ok(JSON.stringify(d).length < 2e6);
});
