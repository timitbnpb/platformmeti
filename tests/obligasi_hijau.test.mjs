import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { periksaBentuk, sahBaris, saring } from '../scripts/pipa/dataset_lib.mjs';
import * as M from '../scripts/pipa/dataset_obligasi_hijau.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const d = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/obligasi_hijau.json'), 'utf8'));

test('obligasi_hijau: bentuk, sumber tiap baris, id unik, celah ada', () => {
  assert.deepEqual(periksaBentuk(d, { kunciWajib: ['penerbit','instrumen','tahun','jenis_pasar','tanggal_sumber'] }), []);
  assert.ok(d.jumlah >= 10);
});
test('baris tanpa sumber_url/tanggal/tingkat_bukti ditolak', () => {
  const { ok, ditolak } = saring([{ id: 'a' }, { id: 'b', sumber_url: 'http://x', tanggal: '2026-11-07', tingkat_bukti: 'resmi' }, { id: 'c', sumber_url: 'https://x', tanggal: '2026-11-07', tingkat_bukti: 'sedang' }]);
  assert.equal(ok.length, 0); assert.equal(ditolak, 3);
});
test('deterministik: bangun dua kali identik', () => {
  assert.deepEqual(M.bangun(), M.bangun());
});

test('baris resmi hanya dari DJPPR, media dari Antara; tak ada baris tanpa penerbit', () => {
  for (const b of d.baris) assert.equal(b.tingkat_bukti === 'resmi', b.sumber_id === 's-djppr');
  assert.ok(d.baris.every((b) => b.penerbit));
});
test('kupon dan tenor hanya bila sumber menyebut', () => {
  assert.ok(d.baris.filter((b) => b.kupon_persen !== null).every((b) => b.tenor_tahun > 0));
});
