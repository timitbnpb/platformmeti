// Modul /industri: captive_power.json dan hilirisasi.json (skema, konsistensi, bisa dibangun ulang), parameter terbuka, ekspor Comtrade.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { PARAMETER, ZONA, ebtSepadan, zonaDari } from '../scripts/pipa/captive_power.mjs';
import { SMELTER } from '../scripts/panen/smelter_kurasi.mjs';
import { ringkas } from '../scripts/panen/smelter_comtrade.mjs';

const j = (p) => JSON.parse(fs.readFileSync(new URL('../' + p, import.meta.url), 'utf8'));
const CP = j('public/data/captive_power.json'), HI = j('public/data/hilirisasi.json'), PL = j('data/strategis/pltu.json');

test('captive_power: MW operasi = jumlah unit batubara captive berstatus operating di GEM', () => {
  const dariGem = PL.unit.filter((u) => u.captive && u.status === 'operating').reduce((s, u) => s + u.kapasitas_mw, 0);
  assert.ok(Math.abs(CP.meta.mw_operasi - dariGem) < 1, `${CP.meta.mw_operasi} vs ${dariGem}`);
  assert.equal(CP.meta.jumlah_pembangkit, CP.pembangkit.length);
  assert.ok(CP.meta.pct_batubara > 90 && CP.meta.pct_batubara <= 100);
});
test('captive_power: tiap pembangkit bertitik, berstatus sah, zona dikenal', () => {
  const zona = new Set(ZONA.map((z) => z.id));
  for (const p of CP.pembangkit) {
    assert.ok(Number.isFinite(p.lat) && Number.isFinite(p.lng), p.nama);
    assert.ok(['operasi', 'konstruksi', 'rencana'].includes(p.status));
    assert.ok(p.zona === null || zona.has(p.zona), p.nama);
    assert.ok(p.pemilik_org.length === p.pemilik.length);
  }
});
test('captive_power: kawasan terurut menurut emisi dan MW EBT = rumus terbuka', () => {
  for (let i = 1; i < CP.kawasan.length; i++) assert.ok(CP.kawasan[i - 1].emisi_tco2e >= CP.kawasan[i].emisi_tco2e);
  for (const k of CP.kawasan) {
    const e = ebtSepadan(k.mwh_tahun, PARAMETER);
    assert.ok(Math.abs(e.total - k.ebt_sepadan_mw.total) <= 1.5, k.id);
    assert.equal(k.peringkat, CP.kawasan.indexOf(k) + 1);
  }
});
test('ebtSepadan: surya berfaktor kapasitas rendah butuh MW lebih banyak dari energi yang sama; zonaDari', () => {
  const e = ebtSepadan(8760 * 100);
  assert.ok(e.surya / PARAMETER.bauran.surya > e.firm / PARAMETER.bauran.firm);
  assert.equal(zonaDari(ZONA[0].lat, ZONA[0].lng), ZONA[0].id);
  assert.equal(zonaDari(-6.2, 106.8), null);
});
test('hilirisasi: tiap baris bersumber https, id unik, tautan pembangkit valid, intensitas = MWh/ton x faktor emisi', () => {
  assert.equal(HI.baris.length, SMELTER.length);
  assert.equal(new Set(HI.baris.map((b) => b.id)).size, HI.baris.length);
  const pl = new Set(CP.pembangkit.map((p) => p.id));
  for (const b of HI.baris) {
    assert.ok(b.sumber.length && b.sumber.every((s) => /^https:\/\//.test(s.url)), b.id);
    assert.ok(b.pembangkit_ids.every((id) => pl.has(id)), b.id);
    assert.ok(b.pemilik.length >= 1 && b.pemilik.every((p) => /^[a-z]{2}$/.test(p.negara)), b.id);
    if (b.intensitas_tco2e_per_ton !== null) assert.ok(Math.abs(b.intensitas_tco2e_per_ton - b.mwh_per_ton * b.faktor_emisi) < 0.06, b.id);
    for (const p of b.pemilik) if (p.negara) assert.ok(fs.existsSync(new URL(`../public/img/bendera/${p.negara}.svg`, import.meta.url)), p.negara);
  }
});
test('hilirisasi: PLTA sendiri berintensitas nol, aluminium memakai 14,5 MWh/ton', () => {
  assert.equal(HI.baris.find((b) => b.id === 'vale-sorowako').intensitas_tco2e_per_ton, 0);
  assert.equal(HI.baris.find((b) => b.id === 'alamtri-kipi').mwh_per_ton, 14.5);
});
test('ekspor Comtrade: tujuh kode HS, mitra berbendera hanya bila berkas bendera ada', () => {
  assert.deepEqual(Object.keys(HI.ekspor.nilai).sort(), ['2604', '2606', '7202', '7501', '7502', '7601', '8507']);
  for (const th of Object.values(HI.ekspor.nilai)) for (const y of Object.values(th)) for (const m of y.mitra) if (m.iso) assert.ok(fs.existsSync(new URL(`../public/img/bendera/${m.iso}.svg`, import.meta.url)));
  const r = ringkas({ data: [{ cmdCode: '7202', partnerCode: 0, primaryValue: 10, netWgt: 5000 }, { cmdCode: '7202', partnerCode: 156, primaryValue: 9 }] }, 2024);
  assert.equal(r['7202'].mitra[0].iso, 'cn'); assert.equal(r['7202'].ton, 5);
});
test('kamus: semua kunci in3 ada di id dan en dengan parameter sama', () => {
  const id = j('public/i18n/id.json'), en = j('public/i18n/en.json');
  const ks = Object.keys(id).filter((k) => k.startsWith('in3.'));
  assert.ok(ks.length > 150);
  for (const k of ks) { assert.ok(en[k], k); assert.equal((en[k].match(/\{\w+\}/g) || []).sort().join(), (id[k].match(/\{\w+\}/g) || []).sort().join(), k); }
});
test('hilirisasi: baris berselisih sumber menampilkan rentang/alternatif bersumber, tanpa angka tunggal tak bersumber', () => {
  const ba = (id) => HI.baris.find((b) => b.id === id).kapasitas;
  assert.equal(ba('vale-bahodopi').alternatif.length, 2); assert.equal(ba('harita-hpal').alternatif.length, 2); assert.deepEqual(ba('catl-ibc').rentang, [6.9, 15]);
  for (const id of ['vale-bahodopi', 'harita-hpal']) for (const a of ba(id).alternatif) assert.match(a.url, /^https:\/\//);
  for (const b of HI.baris) assert.notEqual(b.tingkat_bukti, 'perlu-verifikasi', b.id);
});
