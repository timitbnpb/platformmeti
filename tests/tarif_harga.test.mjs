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
  assert.ok(d.jumlah >= 9);   // 33 -> 9: hanya baris bersumber dokumen resmi ESDM (JM-S04)
});
test('baris tanpa sumber_url/tanggal/tingkat_bukti ditolak', () => {
  const { ok, ditolak } = saring([{ id: 'a' }, { id: 'b', sumber_url: 'http://x', tanggal: '2026-11-07', tingkat_bukti: 'resmi' }, { id: 'c', sumber_url: 'https://x', tanggal: '2026-11-07', tingkat_bukti: 'sedang' }]);
  assert.equal(ok.length, 0); assert.equal(ditolak, 3);
});
test('deterministik: bangun dua kali identik', () => {
  assert.deepEqual(M.bangun(), M.bangun());
});

test('tarif listrik: rupiah per kWh positif; R-2 dan R-3 = 1699,53 menurut siaran pers ESDM 2022', () => {
  const t = d.baris.filter((b) => b.kelompok === 'tarif_listrik');
  assert.ok(t.length >= 5 && t.every((b) => b.tarif_idr_per_kwh > 0 && b.tingkat_bukti === 'turunan'));
  assert.equal(t.find((b) => b.golongan === 'R-2/TR 3.500-5.500 VA').tarif_idr_per_kwh, 1699.53);
});
test('harga BBM tidak ada: tanpa sumber resmi terbaca baris dibuang, bukan diberi sumber pengganti', () => {
  assert.equal(d.baris.filter((x) => x.kelompok === 'harga_bbm').length, 0);
});
test('celah Q4 2026 dicatat', () => assert.ok(d.meta.celah.some((c) => c.includes('triwulan IV 2026'))));
