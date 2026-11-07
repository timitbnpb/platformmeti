import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { periksaBentuk, sahBaris, saring } from '../scripts/pipa/dataset_lib.mjs';
import * as M from '../scripts/pipa/dataset_tarif_harga.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const d = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/tarif_harga.json'), 'utf8'));

test('tarif_harga: bentuk, sumber tiap baris, id unik, celah ada', () => {
  assert.deepEqual(periksaBentuk(d, { kunciWajib: ['kelompok','berlaku_sejak','tanggal_sumber'] }), []);
  assert.ok(d.jumlah >= 30);
});
test('baris tanpa sumber_url/tanggal/tingkat_bukti ditolak', () => {
  const { ok, ditolak } = saring([{ id: 'a' }, { id: 'b', sumber_url: 'http://x', tanggal: '2026-11-07', tingkat_bukti: 'resmi' }, { id: 'c', sumber_url: 'https://x', tanggal: '2026-11-07', tingkat_bukti: 'sedang' }]);
  assert.equal(ok.length, 0); assert.equal(ditolak, 3);
});
test('deterministik: bangun dua kali identik', () => {
  assert.deepEqual(M.bangun(), M.bangun());
});

test('tarif listrik: rupiah per kWh positif, golongan R-1 1300 VA = 1444,70', () => {
  const t = d.baris.filter((b) => b.kelompok === 'tarif_listrik');
  assert.ok(t.length >= 15 && t.every((b) => b.tarif_idr_per_kwh > 0));
  assert.equal(t.find((b) => b.golongan === 'R-1/TR 1.300 VA').tarif_idr_per_kwh, 1444.7);
});
test('BBM: rantai harga konsisten (harga_sebelumnya sama dengan baris sebelumnya produk itu)', () => {
  const per = {};
  for (const b of d.baris.filter((x) => x.kelompok === 'harga_bbm')) (per[b.produk] ||= []).push(b);
  for (const [p, l] of Object.entries(per)) {
    l.sort((a, b) => String(a.berlaku_sejak ?? '').localeCompare(String(b.berlaku_sejak ?? '')));
    l.forEach((b, i) => { if (b.harga_sebelumnya !== null) assert.equal(b.harga_sebelumnya, l[i - 1].harga_idr_per_liter, p); });
  }
});
test('celah Q4 2026 dicatat', () => assert.ok(d.meta.celah.some((c) => c.includes('triwulan IV 2026'))));
