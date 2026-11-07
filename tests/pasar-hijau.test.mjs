// public/data/pasar_hijau.json: pemilik pembangkit (GPPD) dan proyek per wilayah; REC dan RE100 hanya celah.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { bangun } from '../scripts/pipa/pasar_hijau.mjs';

const D = JSON.parse(fs.readFileSync(new URL('../public/data/pasar_hijau.json', import.meta.url), 'utf8'));
const G = JSON.parse(fs.readFileSync(new URL('../public/data/gppd.json', import.meta.url), 'utf8'));

test('berkas sama dengan hasil bangun()', () => assert.deepEqual(JSON.parse(JSON.stringify(bangun())), D));
test('kapasitas pemilik berjumlah sama dengan GPPD', () => {
  const a = D.pemilik_pembangkit.reduce((s, p) => s + p.kapasitas_mw, 0), b = G.baris.reduce((s, x) => s + x.kapasitas_mw, 0);
  assert.ok(Math.abs(a - b) < 5, `${a} vs ${b}`);
  assert.equal(D.pemilik_pembangkit.reduce((s, p) => s + p.unit, 0), G.baris.length);
});
test('grup hanya pln atau swasta-atau-lain; urut menurun; sumber terdaftar', () => {
  const ids = new Set(D.sumber.map((s) => s.id));
  for (const p of D.pemilik_pembangkit) { assert.ok(['pln', 'swasta-atau-lain'].includes(p.grup)); assert.ok(ids.has(p.sumber_id)); }
  for (let i = 1; i < D.pemilik_pembangkit.length; i++) assert.ok(D.pemilik_pembangkit[i - 1].kapasitas_mw >= D.pemilik_pembangkit[i].kapasitas_mw);
  assert.ok(D.pemilik_pembangkit.some((p) => p.grup === 'pln') && D.pemilik_pembangkit.some((p) => p.grup === 'swasta-atau-lain'));
});
test('wilayah: MW per status tidak melebihi total; empat celah pembeli hijau tercatat', () => {
  for (const r of D.proyek_wilayah) assert.ok(r.beroperasi_mw + r.konstruksi_mw + r.rencana_mw <= r.mw + 3, r.provinsi);
  assert.deepEqual(D.celah.map((c) => c.kunci), ['rec', 'tarif_hijau', 're100', 'komitmen']);
  assert.doesNotMatch(JSON.stringify(D), /[—·]/);
});
