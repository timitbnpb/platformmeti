import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { periksaBentuk, sahBaris, saring } from '../scripts/pipa/dataset_lib.mjs';
import * as M from '../scripts/pipa/dataset_insentif.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const d = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/insentif.json'), 'utf8'));

test('insentif: bentuk, sumber tiap baris, id unik, celah ada', () => {
  assert.deepEqual(periksaBentuk(d, { kunciWajib: ['instrumen','nomor_aturan','status_berlaku','basis_syarat','syarat_ringkas'] }), []);
  assert.ok(d.jumlah >= 10);
});
test('baris tanpa sumber_url/tanggal/tingkat_bukti ditolak', () => {
  const { ok, ditolak } = saring([{ id: 'a' }, { id: 'b', sumber_url: 'http://x', tanggal: '2026-11-07', tingkat_bukti: 'resmi' }, { id: 'c', sumber_url: 'https://x', tanggal: '2026-11-07', tingkat_bukti: 'sedang' }]);
  assert.equal(ok.length, 0); assert.equal(ditolak, 3);
});
test('deterministik: bangun dua kali identik', () => {
  assert.deepEqual(M.bangun(), M.bangun());
});

test('basis_syarat jujur dan berlaku_sampai tak diada-adakan', () => {
  assert.ok(d.baris.every((b) => ['teks', 'judul'].includes(b.basis_syarat)));
  assert.ok(d.baris.every((b) => b.berlaku_sampai === null));
  assert.ok(d.baris.every((b) => b.sumber_url.startsWith('https://peraturan.bpk.go.id/Details/')));
});
test('regulasi_id hanya bila ada di daftar', () => {
  assert.equal(M.bangun(new Set()).filter((b) => b.regulasi_id).length, 0);
  assert.equal(M.bangun(new Set(['perpres-112-2022'])).filter((b) => b.regulasi_id).length, 1);
});
