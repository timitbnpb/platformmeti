// public/data/harga_komponen.json dan dagang_komponen.json: hasil bangun() dari data mentah, tiap titik bersumber + bertanggal,
// bendera ada untuk tiap negara mitra, angka masuk akal.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { bangun as bangunHarga } from '../scripts/panen/harga_komponen_lib.mjs';
import { bangun as bangunDagang, KOMPONEN, TAHUN, kodeUntuk } from '../scripts/panen/dagang_komponen_lib.mjs';

const baca = (f) => JSON.parse(fs.readFileSync(new URL('../public/data/' + f, import.meta.url), 'utf8'));
const H = baca('harga_komponen.json'), D = baca('dagang_komponen.json');
const TINGKAT = new Set(['resmi', 'via-pihak-ketiga', 'kata-pihak', 'media']);

test('berkas sama dengan hasil bangun() (tak ada suntingan tangan)', () => {
  assert.deepEqual(JSON.parse(JSON.stringify(bangunHarga())), H);
  assert.deepEqual(JSON.parse(JSON.stringify(bangunDagang())), D);
});
test('harga: tiap titik punya sumber terdaftar, tanggal, tingkat bukti sah; sumber https', () => {
  const ids = new Set(H.sumber.map((s) => s.id));
  for (const s of H.deret) for (const p of s.titik) { assert.ok(ids.has(p.sumber_id), `${s.id}: ${p.sumber_id}`); assert.match(p.tanggal, /^\d{4}-\d{2}-\d{2}$/); assert.ok(TINGKAT.has(p.tingkat_bukti)); assert.ok(p.y > 0); }
  for (const s of H.sumber) assert.match(s.url, /^https:\/\//);
});
test('harga: angka masuk akal dan turun menurut sumber', () => {
  const v = (id, x) => H.deret.find((s) => s.id === id).titik.find((p) => p.x === x).y;
  assert.ok(v('modul', 2025) < v('modul', 2010));
  assert.equal(v('tic-surya', 2010), 5283); assert.equal(v('tic-surya', 2024), 691);
  assert.equal(v('tic-bayu', 2010), 2324); assert.equal(v('tic-bayu', 2024), 1041);
  assert.ok(v('pack', 2025) < v('pack', 2018));
  assert.equal(H.deret.find((s) => s.id === 'tic-bayu').titik.length, 15);
  assert.ok(!H.deret.find((s) => s.id === 'pack').titik.some((p) => p.x === 2022), 'pack 2022 sengaja tidak dimuat (sumber berbeda)');
});
test('dampak LCOE: komponen menjumlah ke penurunan biaya terpasang', () => {
  const d = H.dampak, jml = d.komponen.reduce((a, c) => a + c.usd_kw, 0);
  assert.ok(Math.abs(jml - (d.tic_a - d.tic_b)) <= 2);
  assert.ok(Math.abs(d.komponen.reduce((a, c) => a + c.bagian, 0) - 100) < 0.5);
});
test('dagang: kode HS benar per tahun, seri surya putus di 2022', () => {
  assert.equal(kodeUntuk('surya', 2021), '854140'); assert.equal(kodeUntuk('surya', 2022), '854143');
  assert.equal(kodeUntuk('baterai', 2020), '850760'); assert.equal(kodeUntuk('angin', 2020), '850231'); assert.equal(kodeUntuk('inverter', 2020), '850440');
  for (const k of KOMPONEN) for (const th of TAHUN) for (const a of ['impor', 'ekspor']) assert.ok(D.tahunan.some((r) => r.komponen === k && r.tahun === th && r.alir === a), `${k} ${th} ${a}`);
});
test('dagang: mitra terurut, jumlah tidak melebihi total, sumber dan tanggal ada', () => {
  for (const r of D.tahunan) {
    assert.ok(r.sumber_id === 's-comtrade' && TINGKAT.has(r.tingkat_bukti)); assert.match(r.tanggal, /^\d{4}-\d{2}-\d{2}$/);
    const jml = r.mitra.reduce((a, m) => a + m.usd, 0) + r.lainnya_usd;
    assert.ok(jml <= r.usd * 1.02 + 10, `${r.komponen} ${r.tahun} ${r.alir}: mitra ${jml} > total ${r.usd}`);
    for (let i = 1; i < r.mitra.length; i++) assert.ok(r.mitra[i - 1].usd >= r.mitra[i].usd);
  }
});
test('dagang: tiap negara mitra punya bendera SVG lokal', () => {
  assert.ok(D.mitra.length > 30);
  for (const m of D.mitra) assert.ok(fs.existsSync(new URL(`../public/img/bendera/${m.iso2}.svg`, import.meta.url)), `bendera ${m.iso2}`);
});
test('tanpa em dash atau titik tengah; celah tercatat', () => {
  assert.doesNotMatch(JSON.stringify([H, D]), /[—·]/);
  assert.ok(H.meta.celah.length >= 5 && D.meta.celah.length >= 5);
  const id = JSON.parse(fs.readFileSync(new URL('../public/i18n/id.json', import.meta.url), 'utf8'));
  for (let i = 1; i <= H.meta.celah.length; i++) assert.ok(id['hk2.celah.' + i], 'hk2.celah.' + i);
  for (let i = 1; i <= D.meta.celah.length; i++) assert.ok(id['hk2.dcelah.' + i], 'hk2.dcelah.' + i);
});
