import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { uraiJsonStat, bangunData } from '../scripts/pipa/kapasitas_tren.mjs';

test('json-stat diurai berurutan baris-utama', () => {
  const d = { id: ['A', 'B'], size: [1, 2], dimension: { A: { category: { index: { x: 0 }, label: { x: 'AA' } } }, B: { category: { index: { 0: 0, 1: 1 }, label: { 0: 'b0', 1: 'b1' } } } }, value: [5, null] };
  assert.deepEqual(uraiJsonStat(d).map((r) => [r.B, r.nilai]), [['b0', 5], ['b1', null]]);
  assert.throws(() => uraiJsonStat({ ...d, value: [1] }));
});
test('data nyata: 2000-terbaru, tiap baris bersumber, tanpa tahun < 2000', { skip: !fs.existsSync(new URL('../mentah/irena.json', import.meta.url)) && 'mentah/ tidak ada' }, () => {
  const r = (n) => JSON.parse(fs.readFileSync(new URL('../mentah/' + n, import.meta.url), 'utf8'));
  const o = bangunData(r('irena.json'), r('irena_pangsa.json'), r('wb_rnew.json'), '2026-11-08');
  assert.ok(o.jumlah > 100); assert.equal(o.jumlah, o.baris.length);
  assert.ok(o.baris.every((b) => b.tahun >= 2000 && b.sumber_id && b.tanggal && b.tingkat_bukti));
  const s = o.baris.find((b) => b.teknologi === 'surya' && b.tahun === 2024); assert.ok(s.kapasitas_mw > 500);
  assert.ok(o.meta.celah.length >= 2);
  assert.deepEqual(bangunData(r('irena.json'), r('irena_pangsa.json'), r('wb_rnew.json'), '2026-11-08'), o);
});
