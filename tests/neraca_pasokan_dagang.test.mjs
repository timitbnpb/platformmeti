import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { BARIS, PERJANJIAN, asalDari, tarifEfektif, termurah } from '../scripts/panen/perjanjian_dagang_lib.mjs';

const rd = (f) => JSON.parse(fs.readFileSync(new URL('../public/data/global/' + f, import.meta.url), 'utf8'));
const j = rd('perjanjian_dagang.json');

test('asal pasar: "Non-Tiongkok" bukan Tiongkok', () => {
  assert.equal(asalDari('Non-Tiongkok (kutipan pra-pajak)'), null);
  assert.equal(asalDari('Tiongkok domestik'), 'cn');
  assert.equal(asalDari('AS rakitan, DDP'), null);
});
test('tarif efektif: preferensi terendah untuk asal yang tercakup, selain itu MFN', () => {
  const m = BARIS.find((b) => b.hs8 === '85414300');
  assert.equal(tarifEfektif(m, 'cn'), 0);
  assert.equal(tarifEfektif(m, 'in'), 5);
});
test('termurah modul TOPCon memakai bea: India dikenai MFN 5%', () => {
  const t = termurah(rd('benchmark_harga.json')).find((x) => x.produk_id === 'modul-topcon');
  const india = t.opsi.find((o) => o.negara === 'in');
  assert.equal(india.usd_setelah_bea, Math.round(india.usd * 1.05 * 10000) / 10000);
  assert.ok(t.opsi.every((o) => o.negara === 'cn' || o.negara === 'in'));
});
test('IEU-CEPA berstatus belum berlaku; semua baris bersumber dan bertingkat bukti', () => {
  assert.match(PERJANJIAN.find((p) => p.id === 'ieucepa').status, /^belum berlaku/);
  const ids = new Set(PERJANJIAN.map((p) => p.id));
  for (const b of j.baris) {
    assert.ok(/^https:\/\//.test(b.sumber_url) && b.tanggal && b.tingkat_bukti && typeof b.mfn === 'number', b.hs8);
    for (const p of b.pref) assert.ok(ids.has(p.perjanjian) && p.pct >= 0 && p.tingkat_bukti, b.hs8);
  }
  assert.ok(j.baris.some((b) => b.repr === false) && j.celah.length >= 3);
});
