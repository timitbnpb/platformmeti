// public/data/keuangan_hijau.json: investasi publik IRENA, instrumen hijau, JETP, skema, pembanding ASEAN.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { bangun } from '../scripts/pipa/keuangan_hijau.mjs';

const D = JSON.parse(fs.readFileSync(new URL('../public/data/keuangan_hijau.json', import.meta.url), 'utf8'));
const TINGKAT = new Set(['resmi', 'via-pihak-ketiga', 'kata-pihak', 'media', 'situs-sendiri']);

test('berkas sama dengan hasil bangun()', () => assert.deepEqual(JSON.parse(JSON.stringify(bangun())), D));
test('tiap baris bersumber terdaftar, bertanggal, bertingkat bukti', () => {
  const ids = new Set(D.sumber.map((s) => s.id));
  const baris = [...D.investasi_publik, ...D.instrumen_hijau, ...D.alokasi_sukuk, ...D.jetp.proyek, ...D.skema, ...D.pemberi, ...D.tetangga];
  assert.ok(baris.length > 200);
  for (const r of baris) { assert.ok(ids.has(r.sumber_id), r.sumber_id); assert.match(r.tanggal, /^\d{4}-\d{2}-\d{2}/); assert.ok(TINGKAT.has(r.tingkat_bukti), String(r.tingkat_bukti)); }
});
test('investasi publik: tiga kelompok, EBT dan fosil sama-sama ada, nilai tak negatif', () => {
  assert.deepEqual([...new Set(D.investasi_publik.map((r) => r.kelompok))].sort(), ['ebt', 'fosil', 'lain']);
  for (const r of D.investasi_publik) assert.ok(r.usd_juta_2023 >= 0 && r.tahun >= 2000 && r.tahun <= 2024);
  assert.ok(D.investasi_publik.some((r) => r.teknologi === 'Coal' && r.kelompok === 'fosil'));
  assert.ok(D.investasi_publik.some((r) => r.teknologi === 'Geothermal energy' && r.kelompok === 'ebt'));
});
test('JETP: komitmen USD 20 miliar dan delapan entri; MRT bukan EBT', () => {
  assert.equal(D.jetp.komitmen_usd_miliar, 20); assert.equal(D.jetp.proyek.length, 8);
  assert.ok(D.jetp.proyek.filter((r) => /MRT/.test(r.nama)).every((r) => r.ebt === false));
});
test('tetangga ASEAN: persen 0-100, Indonesia ada', () => {
  assert.ok(D.tetangga.some((r) => r.iso3 === 'IDN'));
  for (const r of D.tetangga) assert.ok(r.ebt_persen >= 0 && r.ebt_persen <= 100 && r.fosil_persen <= 100.5, r.iso3);
});
test('celah: delapan sumber butuh unduhan, tautan https, tanpa em dash', () => {
  assert.equal(D.celah.length, 8); for (const c of D.celah) assert.match(c.url, /^https:\/\//);
  assert.doesNotMatch(JSON.stringify(D), /[—·]/);
});
