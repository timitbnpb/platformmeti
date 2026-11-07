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
    assert.equal(p.selisih_persen, null, 'selisih tak dihitung tanpa sisi Indonesia');
  }
});
test('rujukan deret ada di harga_komponen.json', () => {
  const deret = new Set(H.deret.map((s) => s.id));
  for (const id of ['modul', 'modul-eropa-2024', 'turnkey-2024', 'turbin-tiongkok']) assert.ok(deret.has(id));
});
