import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { periksa, dariTkdn } from '../scripts/pipa/inovasi.mjs';

const d = JSON.parse(fs.readFileSync(new URL('../public/data/inovasi.json', import.meta.url), 'utf8'));
const org = new Set(JSON.parse(fs.readFileSync(new URL('../public/data/organisasi.json', import.meta.url), 'utf8')).baris.map((o) => o.id));

test('inovasi.json: >= 60 butir, skema dan sumber wajib', () => {
  assert.ok(d.inovasi.length >= 60 && d.jumlah === d.inovasi.length);
  assert.deepEqual(d.inovasi.flatMap(periksa), []);
  assert.equal(new Set(d.inovasi.map((b) => b.id)).size, d.inovasi.length);
});
test('tanpa 1001startup, tanpa data pribadi, lembaga_id valid', () => {
  const s = JSON.stringify(d);
  assert.ok(!/1001startup/i.test(s));
  assert.ok(!/@[\w-]+\.\w+/.test(s));
  for (const b of d.inovasi) for (const p of b.pembuat) assert.ok(!p.lembaga_id || org.has(p.lembaga_id), b.id);
});
test('periksa menolak: tanpa sumber, em dash, KAPITAL, sektor asing', () => {
  const ok = { id: 'x', nama: 'Alat', jenis: 'alat', sektor: ['surya'], ringkasan: 'r', sumber: [{ url: 'https://a.id', tanggal: '2026-11-08' }] };
  assert.deepEqual(periksa(ok), []);
  assert.equal(periksa({ ...ok, sumber: [] }).length, 1);
  assert.ok(periksa({ ...ok, ringkasan: 'a — b' }).length);
  assert.ok(periksa({ ...ok, nama: 'SUPERBATERAI' }).length);
  assert.ok(periksa({ ...ok, sektor: ['xx'] }).length);
});
test('dariTkdn: satu butir per produsen+merk, bersumber sertifikat', () => {
  const tk = { baris: [1, 2].map((i) => ({ id: 'tkdn_00' + i, kategori: 'baterai', produsen: 'PT A', merk: 'Z', tipe: 'T', tkdn_persen: 40 + i, diterbitkan: '01 Jul 2026', sumber_url: 'https://t.id/' + i, tanggal: '2026-11-07' })) };
  const r = dariTkdn(tk, []);
  assert.equal(r.length, 1);
  assert.equal(r[0].sumber[0].url, 'https://t.id/1');
});
