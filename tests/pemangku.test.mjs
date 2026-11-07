// Peta pemangku kepentingan: selftest pipa + skema keluaran + larangan menebak (pemasok/pakar selalu hipotesis).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { PERAN } from '../scripts/pipa/pemangku.mjs';

const J = (p) => JSON.parse(fs.readFileSync(new URL('../' + p, import.meta.url), 'utf8'));
test('pemangku.mjs --selftest', () => { assert.match(execFileSync('node', ['scripts/pipa/pemangku.mjs', '--selftest'], { cwd: new URL('..', import.meta.url), encoding: 'utf8' }), /selftest ok/); });
test('pemangku.json: indeks cocok dengan berkas per proyek', () => {
  const ix = J('public/data/pemangku.json'), proyek = new Set(J('public/data/proyek.json').baris.map((p) => p.id));
  assert.equal(Object.keys(ix.ada).length, ix.proyek_berpeta);
  assert.ok(ix.proyek_berpeta > 300);
  for (const [id, n] of Object.entries(ix.ada)) {
    assert.ok(proyek.has(id), id);
    const h = J(`public/data/pemangku/${id}.json`);
    assert.equal(h.id, id); assert.equal(h.jumlah, n); assert.equal(h.simpul.length, n + 1);
    const ks = new Set(h.simpul.map((s) => s.k)); assert.equal(ks.size, h.simpul.length);
    for (const e of h.sisi) {
      assert.ok(PERAN.includes(e.p), e.p); assert.ok(['resmi', 'kajian', 'media', 'hipotesis'].includes(e.t));
      assert.ok(ks.has(e.a) && ks.has(e.b));
      if (e.p === 'pakar' || /^kandidat/.test(e.c || '')) assert.equal(e.t, 'hipotesis', `${id} ${e.p} kandidat harus hipotesis`);
      for (const s of e.s || []) assert.match(s.u, /^https?:\/\//);
    }
  }
});
test('pemangku: berkas per proyek ringan', () => {
  for (const f of fs.readdirSync(new URL('../public/data/pemangku/', import.meta.url))) assert.ok(fs.statSync(new URL('../public/data/pemangku/' + f, import.meta.url)).size < 30000, f);
});
