// /baterai-ev: berkas terbit = keluaran pembangun (kecuali tanggal), tiap baris bersumber terdaftar, org dan regulasi rujukan ada, tanpa em dash, kamus bev lengkap.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { bangun, TAHAP } from '../scripts/panen/baterai_ev.mjs';

const baca = (f) => JSON.parse(fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8'));
const B = baca('public/data/baterai_ev.json'), org = baca('public/data/organisasi.json'), hili = baca('public/data/hilirisasi.json'), reg = baca('public/data/regulasi.json');

test('pembangun tanpa galat dan konsisten dengan berkas terbit', () => {
  const { data, galat } = bangun({ org, hilirisasi: hili, dagang: B.dagang.baris.map(({ sumber_id, tingkat_bukti, ...r }) => r), mitraRef: [] });
  assert.deepEqual(galat, []);
  assert.deepEqual(data.tahap.map((t) => t.id), TAHAP.map((t) => t.id));
  assert.deepEqual(data.tahap, B.tahap);
});
test('delapan tahap; tiap pemain, kapasitas, isu, kebijakan bersumber terdaftar', () => {
  assert.equal(B.tahap.length, 8);
  const ids = new Set(B.sumber.map((s) => s.id));
  for (const s of B.sumber) assert.ok(/^https:\/\//.test(s.url) && s.judul && s.penerbit && s.tingkat_bukti && s.tanggal_ambil, s.id);
  for (const t of B.tahap) for (const r of [...t.pemain, ...t.kapasitas, ...t.isu]) { assert.ok(ids.has(r.sumber_id), `${t.id}:${r.id}`); assert.ok(r.tingkat_bukti && r.tanggal); }
  for (const k of B.kebijakan) { assert.ok(ids.has(k.sumber_id), k.id); for (const x of k.sumber_lain || []) assert.ok(ids.has(x), x); }
});
test('org_id dan regulasi_id merujuk berkas yang ada', () => {
  const o = new Set(org.baris.map((b) => b.id)), r = new Set(reg.baris.map((b) => b.id)), h = new Set(hili.baris.map((b) => b.id));
  for (const t of B.tahap) for (const p of t.pemain) { for (const x of [p.org_id, ...(p.org_lain || [])].filter(Boolean)) assert.ok(o.has(x), x); if (p.hilirisasi_id) assert.ok(h.has(p.hilirisasi_id)); }
  for (const k of B.kebijakan) if (k.regulasi_id) assert.ok(r.has(k.regulasi_id), k.regulasi_id);
});
test('angka dasar sesuai sumber dan deret Comtrade utuh', () => {
  assert.deepEqual(B.penjualan.bev.map((x) => x.unit), [10327, 17062, 43188, 103931]);
  const ev = B.dagang.baris.filter((r) => r.hs === '870380' && r.alir === 'impor');
  assert.equal(ev.length, 7);
  assert.ok(ev.every((r) => r.usd >= 0 && r.mitra.length <= 5));
});
test('teks tanpa em dash dan kamus id/en memuat semua kunci bev', () => {
  assert.ok(!/[–—]/.test(JSON.stringify(B)));
  const id = baca('public/i18n/id.json'), en = baca('public/i18n/en.json');
  for (const k of ['bev.nav', 'bev.c.pemain', 'bev.nr.hip', 'bev.met.l1', 'bev.tab.daur']) assert.ok(id[k] && en[k], k);
});
