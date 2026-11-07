// public/data/biaya_listrik.json: tiap angka bersumber + tanggal + tingkat bukti; berkas = hasil bangun() dari data mentah.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { bangun } from '../scripts/pipa/biaya_listrik.mjs';

const D = JSON.parse(fs.readFileSync(new URL('../public/data/biaya_listrik.json', import.meta.url), 'utf8'));
const TINGKAT = new Set(['resmi', 'via-pihak-ketiga', 'kata-pihak', 'media']);

test('berkas sama dengan hasil bangun() (tak ada suntingan tangan)', () => assert.deepEqual(JSON.parse(JSON.stringify(bangun())), D));
test('tiap baris punya sumber terdaftar, tanggal, dan tingkat bukti sah', () => {
  const ids = new Set(D.sumber.map((s) => s.id));
  for (const g of ['lcoe', 'modul', 'bpp_nasional', 'bpp_sistem']) for (const r of D[g]) {
    assert.ok(ids.has(r.sumber_id), `${g}: ${r.sumber_id}`); assert.match(r.tanggal, /^\d{4}-\d{2}-\d{2}$/); assert.ok(TINGKAT.has(r.tingkat_bukti));
  }
  for (const s of D.sumber) assert.match(s.url, /^https:\/\//);
});
test('angka masuk akal: LCOE 1-100 sen/kWh, modul turun, BPP sama dengan Rp / kurs', () => {
  for (const r of D.lcoe) assert.ok(r.sen_usd_kwh > 1 && r.sen_usd_kwh < 100, `${r.negara} ${r.teknologi} ${r.tahun}`);
  const s = (y) => D.modul.find((m) => m.tahun === y).usd_per_w;
  assert.ok(s(2025) < s(2010) && s(2010) < s(1975));
  for (const b of D.bpp_nasional) assert.ok(Math.abs((b.rp_kwh / b.kurs_rp_usd) * 100 - b.sen_usd_kwh) < 0.05, String(b.tahun));
  assert.deepEqual(D.bpp_nasional.map((b) => b.tahun), [2016, 2017, 2018, 2020]);
});
test('Indonesia hanya bayu darat 2017-2020 (jangan mengarang surya)', () => {
  const i = D.lcoe.filter((r) => r.iso3 === 'IDN');
  assert.ok(i.length > 0 && i.every((r) => r.teknologi === 'bayu-darat' && r.tahun >= 2017 && r.tahun <= 2020));
});
test('celah tercatat dan tanpa em dash atau titik tengah', () => { assert.ok(D.meta.celah.length >= 5); assert.doesNotMatch(JSON.stringify(D), /[—·]/); });
