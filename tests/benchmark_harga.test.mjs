import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { bangun } from '../scripts/panen/benchmark_harga_lib.mjs';
const B = JSON.parse(fs.readFileSync(new URL('../public/data/global/benchmark_harga.json', import.meta.url), 'utf8'));
const H = JSON.parse(fs.readFileSync(new URL('../public/data/harga_komponen.json', import.meta.url), 'utf8'));
test('berkas sama dengan bangun()', () => assert.deepEqual(JSON.parse(JSON.stringify(bangun())), B));
test('tiap angka bersumber, bertanggal, bertingkat; indonesia kosong punya alasan', () => {
  const ids = new Set(B.sumber.map((s) => s.id));
  for (const p of B.produk) {
    for (const d of p.dunia) { assert.ok(ids.has(d.sumber_id)); assert.match(d.tanggal, /^\d{4}-\d{2}-\d{2}$/); assert.ok(['Data', 'EST', 'Hipotesis'].includes(d.tingkat_bukti)); assert.ok(d.usd > 0); }
    if (!p.indonesia.length) assert.ok(p.alasan_indonesia_kosong);
    if (!p.indonesia.length || !p.dunia.length) assert.equal(p.selisih_persen, null, 'selisih tak dihitung tanpa dua sisi');
    else if (p.pasangan) assert.equal(p.selisih_persen, Math.round((p.indonesia[p.pasangan[1]].usd / p.dunia[p.pasangan[0]].usd - 1) * 1000) / 10);
    for (const d of p.indonesia) { assert.ok(ids.has(d.sumber_id)); assert.match(d.tanggal, /^\d{4}-\d{2}-\d{2}$/); assert.ok(['Data', 'EST', 'Hipotesis'].includes(d.tingkat_bukti)); assert.ok(d.usd > 0); }
    for (const d of [...p.dunia, ...p.indonesia]) if (d.mata_uang !== 'USD') assert.ok(d.kurs || /kurs/.test(d.basis), 'konversi mata uang wajib mencatat kurs');
  }
});
test('rujukan deret ada di harga_komponen.json', () => {
  const deret = new Set(H.deret.map((s) => s.id));
  for (const id of ['modul', 'modul-eropa-2024', 'turnkey-2024', 'turbin-tiongkok']) assert.ok(deret.has(id));
});
test('komponen selisih: BM per HS bersumber resmi, PPN efektif 11', () => {
  const bm = B.komponen_selisih.find((k) => k.k === 'bea_masuk');
  assert.equal(bm.sumber_id, 's-btki-2022');
  assert.equal(bm.per_hs.find((h) => h.hs === '8541.43.00').bm_persen, 5);
  assert.equal(B.komponen_selisih.find((k) => k.k === 'ppn').nilai_persen, 11);
});
