// public/data/radar_kabupaten.json: 514 kabupaten/kota, skor dihitung ulang dari norma + bobot (radar_rumus.js), komponen kosong dikeluarkan, kamus i18n lengkap.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { bangun, daftarKabkota } from '../scripts/pipa/radar_kabupaten.mjs';
import { skorTek, komponen, skor, minmaks, BOBOT_SEMUA, BOBOT_TEK, TEK, MIN_SEMUA } from '../public/radar_rumus.js';

const D = JSON.parse(fs.readFileSync(new URL('../public/data/radar_kabupaten.json', import.meta.url), 'utf8'));
const ID = JSON.parse(fs.readFileSync(new URL('../public/i18n/id.json', import.meta.url), 'utf8'));
const EN = JSON.parse(fs.readFileSync(new URL('../public/i18n/en.json', import.meta.url), 'utf8'));

test('berkas sama dengan hasil bangun() (tak ada suntingan tangan)', () => assert.deepEqual(JSON.parse(JSON.stringify(bangun())), D));
test('514 kabupaten/kota unik, tiap provinsi dikenal peluang.json (38 provinsi)', () => {
  assert.equal(D.baris.length, 514);
  assert.equal(new Set(D.baris.map((b) => b.kode)).size, 514);
  assert.equal(Object.keys(D.provinsi).length, 38);
  for (const b of D.baris) assert.ok(D.provinsi[b.prov], `${b.nama}: provinsi ${b.prov}`);
  assert.equal(D.baris.filter((b) => b.nama === 'Kota Batam').length, 1);
  assert.deepEqual(daftarKabkota().map((k) => k.kode), D.baris.map((b) => b.kode));
});
test('Papua dipetakan ke provinsi berlaku (jumlah per provinsi sesuai pemekaran 2022)', () => {
  const n = (p) => D.baris.filter((b) => b.prov === p).length;
  assert.deepEqual(['91', '92', '93', '94', '95', '96'].map(n), [9, 7, 4, 8, 8, 6]);
});
test('skor 0-100 dan sama dengan perhitungan ulang dari norma', () => {
  for (const b of D.baris) {
    const ulang = skorTek('semua', D.provinsi[b.prov].norma, b.kab_norma).skor;
    assert.equal(b.skor, ulang, b.nama);
    assert.ok(b.skor >= 0 && b.skor <= 100, b.nama);
    for (const k of TEK) assert.equal(b.skor_tek[k], skorTek(k, D.provinsi[b.prov].norma, b.kab_norma).skor);
  }
});
test('bobot dihitung ulang saat komponen kosong: jumlah bobot efektif = 1, minimal 3 komponen', () => {
  const pn = { pvout: 1, bpp: 0.5, harga: null, akses: null, celah: { semua: 0 } };
  const h = skor(komponen('semua', pn, null), BOBOT_SEMUA);
  assert.equal(Object.keys(h.bobot).length, 3);
  assert.ok(Math.abs(Object.values(h.bobot).reduce((a, b) => a + b, 0) - 1) < 1e-9);
  assert.equal(skor(komponen('semua', { pvout: 1, bpp: 1 }, null), BOBOT_SEMUA).skor, null); /* 2 komponen: tak dinilai */
  assert.equal(Math.round(Object.values(BOBOT_SEMUA).reduce((a, b) => a + b, 0) * 100), 100);
  assert.equal(Math.round(Object.values(BOBOT_TEK).reduce((a, b) => a + b, 0) * 100), 100);
});
test('minmaks: semua sama jadi 0,5; null tetap null', () => { assert.deepEqual(minmaks([2, 2]), [0.5, 0.5]); assert.deepEqual(minmaks([0, null, 10]), [0, null, 1]); });
test('provinsi dengan potensi RUEN belum dipisah tak dinilai (tanpa melambung dari data separuh)', () => {
  const tanpa = D.baris.filter((b) => b.skor === null);
  assert.ok(tanpa.length > 0 && tanpa.every((b) => D.provinsi[b.prov].mentah.celah.semua === null));
  assert.equal(MIN_SEMUA, 5);
  assert.ok(D.baris.every((b) => b.skor === null || b.skor <= 100));
});
test('kabupaten dengan bukti tingkat kabupaten membawa angka mentah dan norma', () => {
  const pk = D.baris.filter((b) => b.dasar === 'provinsi+kabupaten');
  assert.ok(pk.length > 50);
  for (const b of pk) { assert.ok(b.kab && b.kab_norma, b.nama); assert.ok(b.kab.proyek_mw >= 0); }
  for (const b of D.baris.filter((x) => x.dasar === 'provinsi')) assert.ok(!b.kab);
});
test('data jujur: celah tercatat, tingkat bukti hipotesis, tanpa em dash', () => {
  assert.ok(D.celah.length >= 4); assert.equal(D.tingkat_bukti, 'hipotesis'); assert.doesNotMatch(JSON.stringify(D), /[—–·]/);
  for (const s of D.sumber) assert.ok(s.judul && s.tanggal);
});
test('kamus rd2.* id dan en setara, tanpa nilai kosong, tanpa panah teks', () => {
  const a = Object.keys(ID).filter((k) => k.startsWith('rd2.')), b = Object.keys(EN).filter((k) => k.startsWith('rd2.'));
  assert.deepEqual(a, b); assert.ok(a.length > 100);
  for (const k of a) { assert.ok(ID[k] && EN[k], k); assert.doesNotMatch(ID[k] + EN[k], /[—–→←]|->/, k); }
});
test('kunci i18n dinamis radar ada semua', () => {
  const ada = (k) => assert.ok(ID[k] && EN[k], k);
  for (const k of ['pvout', 'celah', 'sumber', 'bpp', 'harga', 'akses', 'pasar', 'amdal', 'perda']) ada('rd2.k.' + k);
  for (const k of ['t', 's', 'r', 'kab', 'prov']) ada('rd2.tingkat.' + k);
  for (const k of ['p', 'pk', 'p.i', 'pk.i']) ada('rd2.dasar.' + k);
  for (const i of [1, 2, 3, 4]) { ada('rd2.celah.' + i); ada('rd2.d.celah.' + i); }
  for (const i of [1, 2, 3, 4, 5, 6]) ada('rd2.d.r' + i);
  for (const k of ['t', 's', 'r']) ada('rd2.d.prio.' + k);
  for (const k of ['rendah', 'dasar', 'tinggi']) ada('rd2.d.sk.' + k);
  for (const k of ['pangsa', 'liter', 'bpp', 'pvout']) ada('rd2.d.b.' + k);
  ada('nav.radar');
});
