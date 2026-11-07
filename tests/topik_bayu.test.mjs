// public/data/topik/bayu.json: naskah topik Bayu = hasil bangun() (tanpa suntingan tangan), bentuk sesuai docs/perencanaan/TOPIK-SKEMA.md.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { bangun, periksa } from '../scripts/pipa/topik_bayu.mjs';

const D = JSON.parse(fs.readFileSync(new URL('../public/data/topik/bayu.json', import.meta.url), 'utf8'));

test('berkas sama dengan hasil bangun()', () => assert.deepEqual(D, JSON.parse(JSON.stringify(bangun()))));
test('bentuk, dua bahasa, rujukan sumber, karakter terlarang, label hipotesis', () => assert.deepEqual(periksa(D), []));
test('bab inti ada: 2-33, 36, 38-42 (bab 34, 35, 37 diisi otomatis dari dasar)', () => {
  const ada = new Set(Object.keys(D.bab).map(Number));
  for (let n = 2; n <= 33; n++) assert.ok(ada.has(n), 'bab ' + n);
  for (const n of [36, 38, 39, 40, 41, 42]) assert.ok(ada.has(n), 'bab ' + n);
});
test('angka turunan masuk akal: faktor kapasitas 20-45 persen, potensi RUEN 60,6 GW', () => {
  const fk = D.kunci.find((k) => k.est);
  assert.ok(fk.nilai > 20 && fk.nilai < 45);
  assert.equal(D.kunci[0].nilai, 60.6);
  for (const r of D.bab['11'].baris) assert.ok(r.fk > 20 && r.fk < 45, r.tahun);
});
test('atlas: potensi RUEN per provinsi cocok dengan peluang.json, terpasang hanya Bali/Sulsel/Sulut', () => {
  const P = JSON.parse(fs.readFileSync(new URL('../public/data/peluang.json', import.meta.url), 'utf8')).baris;
  for (const r of D.bab['8'].baris) assert.equal(r.potensi_mw, P.find((p) => p.nama === r.provinsi).potensi.bayu.mw);
  assert.deepEqual(D.bab['8'].baris.filter((r) => r.terpasang_mw > 0).map((r) => r.provinsi).sort(), ['Bali', 'Sulawesi Selatan', 'Sulawesi Utara']);
});
test('kasus gagal: Indonesia dan luar negeri, kronologi bertanggal, hak jawab, tanda bahaya', () => {
  const g = D.bab['40'].butir;
  assert.ok(g.some((k) => k.negara === 'ID') && g.some((k) => k.negara !== 'ID'));
  for (const k of g) { assert.equal(k.hak_jawab, true); assert.ok(k.kronologi.length >= 1 && k.tanda_bahaya.length >= 1 && k.sumber.length >= 1, k.id); }
  for (const id of ['tanah-laut', 'sukabumi', 'nusa-penida', 'turkana-jaringan', 'vietnam-kurtailmen']) assert.ok(g.some((k) => k.id === id), id);
});
test('daftar periksa: tiap peran dan tahap punya butir, sumber terdaftar', () => {
  const b = D.bab['42'];
  for (const p of b.peran) assert.ok(b.butir.some((x) => x.peran === p.k), p.k);
  for (const t of ['pengukuran', 'izin', 'jaringan', 'ppa', 'logistik']) assert.ok(b.butir.some((x) => x.tahap === t), t);
});
