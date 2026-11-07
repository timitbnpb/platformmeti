// Desa energi mandiri: tiap kasus bersumber https (bukan Antara), status dan penyebab dari kosakata tertutup, titik dalam batas Indonesia.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { bangun, periksa, PENYEBAB } from '../scripts/panen/desa_energi_kasus.mjs';

test('kasus lolos pemeriksaan skrip', () => assert.deepEqual(periksa(bangun()), []));
test('kasus rusak/mati wajib punya penyebab; hidup boleh kosong', () => {
  for (const r of bangun().baris) { if (r.status !== 'hidup') assert.ok(r.penyebab.length, r.id); r.penyebab.forEach((p) => assert.ok(PENYEBAB.includes(p))); }
});
test('id unik dan tanpa em dash', () => {
  const d = bangun(), id = d.baris.map((r) => r.id); assert.equal(new Set(id).size, id.length);
  assert.ok(!JSON.stringify(d).includes('—'));
});
test('berkas terbit sama dengan keluaran skrip', { skip: !fs.existsSync('public/data/desa_energi_mandiri.json') }, () => {
  assert.deepEqual(JSON.parse(fs.readFileSync('public/data/desa_energi_mandiri.json', 'utf8')), JSON.parse(JSON.stringify(bangun())));
});
