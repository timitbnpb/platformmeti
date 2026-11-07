// Pencocok lokasi industri hijau: data public/data/lokasi_hijau.json (scripts/pipa/lokasi_hijau.mjs) dan skor (public/lokasi_hijau_hitung.js)
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { bangun, jarakKm, jarakSegmenKm, lokasiPpa, pulauDari, dalamBbox } from '../scripts/pipa/lokasi_hijau.mjs';
import { BOBOT, persentil, perProvinsi, skorKawasan, peringkat, alasan, sektorDariGrup } from '../public/lokasi_hijau_hitung.js';

const D = JSON.parse(fs.readFileSync(new URL('../public/data/lokasi_hijau.json', import.meta.url), 'utf8'));
const KB = { mw: 50, tek: ['surya', 'bayu'], sektor: 'semua', pulau: [], hanyaTitik: false };

test('bobot berjumlah 100', () => assert.equal(Object.values(BOBOT).reduce((a, b) => a + b, 0), 100));

test('data selaras kawasan.json dan 38 provinsi', () => {
  const kw = JSON.parse(fs.readFileSync(new URL('../public/data/kawasan.json', import.meta.url), 'utf8')).baris;
  assert.equal(D.kawasan.length, kw.length);
  assert.equal(D.provinsi.length, 38);
  assert.ok(D.hipotesis && D.meta.celah.length && D.sumber.length);
  const kode = new Set(D.provinsi.map((p) => p.kode));
  for (const k of D.kawasan) assert.ok(kode.has(k.kode) && k.pulau, k.id);
});

test('pembangun deterministik terhadap berkas terbit', () => {
  assert.deepEqual(JSON.parse(JSON.stringify(bangun(D.dibangun_pada))), D);
});

test('jaringan hanya untuk titik tepat di dalam cakupan OSM', () => {
  for (const k of D.kawasan) {
    if (k.jaringan) { assert.ok(k.titik_tepat); assert.ok(k.jaringan.gardu_km >= 0 && k.jaringan.saluran_km >= 0); }
    if (!k.titik_tepat) assert.equal(k.proyek_dekat, null, k.id);
  }
  assert.ok(D.kawasan.filter((k) => k.jaringan).length >= 5);
});

test('geometri: haversine, ruas, bbox, pulau, lokasi PPA', () => {
  assert.ok(Math.abs(jarakKm([0, 100], [0, 101]) - 111.19) < 0.5);
  assert.ok(Math.abs(jarakSegmenKm([0.1, 0.5], [0, 0], [0, 1]) - 11.06) < 0.3);
  assert.equal(jarakSegmenKm([0, 2], [0, 0], [0, 1]) > 100, true);
  assert.ok(dalamBbox([-7, 110], [[-11, 103, -5, 111]]) && !dalamBbox([3, 110], [[-11, 103, -5, 111]]));
  assert.equal(pulauDari('21'), 'sumatera'); assert.equal(pulauDari('51'), 'bali-nusra'); assert.equal(pulauDari('96'), 'maluku-papua');
  const W = [{ nama: 'Sulawesi Tengah', kode: '72' }, { nama: 'Jawa Barat', kode: '32' }];
  assert.deepEqual(lokasiPpa('Morowali, Sulawesi Tengah', W), { kode: ['72'], pulau: [] });
  assert.deepEqual(lokasiPpa('Bali dan Pulau Jawa', W), { kode: ['51'], pulau: ['jawa'] });
  assert.deepEqual(lokasiPpa('Cikarang, Bekasi', W).kode, ['32']);
});

test('persentil dan komponen tanpa data dikeluarkan', () => {
  assert.equal(persentil(5, [1, 5, 9]), 50); assert.equal(persentil(null, [1]), null); assert.equal(persentil(9, [1, 5, 9]) > persentil(1, [1, 5, 9]), true);
  const pp = perProvinsi(D.provinsi, KB);
  const k = D.kawasan.find((x) => !x.titik_tepat);
  const r = skorKawasan(k, KB, D, pp);
  assert.ok(!r.kom.gardu && !r.kom.proyek_radius, 'kawasan tanpa titik tepat tidak punya komponen jarak');
  assert.equal(r.dasar, Object.values(r.kom).reduce((a, x) => a + x.bobot, 0));
  assert.ok(r.skor >= 0 && r.skor <= 100);
});

test('skor adalah rata-rata berbobot komponen yang ada', () => {
  const pp = perProvinsi(D.provinsi, KB), k = D.kawasan.find((x) => x.jaringan);
  const r = skorKawasan(k, KB, D, pp);
  const manual = Object.values(r.kom).reduce((a, x) => a + x.skor * x.bobot, 0) / r.dasar;
  assert.ok(Math.abs(r.skor - manual) < 1e-9);
  assert.ok(r.kom.gardu, 'KEK berjaringan mendapat komponen gardu');
});

test('gardu dekat mengalahkan gardu jauh, hal lain sama', () => {
  const pp = perProvinsi(D.provinsi, KB), k = D.kawasan.find((x) => x.jaringan);
  const dekat = skorKawasan({ ...k, jaringan: { ...k.jaringan, gardu_km: 1, saluran_km: 1 } }, KB, D, pp);
  const jauh = skorKawasan({ ...k, jaringan: { ...k.jaringan, gardu_km: 80, saluran_km: 90 } }, KB, D, pp);
  assert.equal(dekat.kom.gardu.skor, 100); assert.equal(jauh.kom.gardu.skor, 0); assert.ok(dekat.skor > jauh.skor);
});

test('kebutuhan MW: potensi lebih besar dari kebutuhan menaikkan kecukupan', () => {
  const kecil = perProvinsi(D.provinsi, { ...KB, mw: 10 }).get('32'), besar = perProvinsi(D.provinsi, { ...KB, mw: 100000 }).get('32');
  assert.ok(kecil.cukup.skor > besar.cukup.skor);
  assert.equal(perProvinsi(D.provinsi, { ...KB, mw: 0 }).get('32').cukup, null);
});

test('saringan pulau dan titik, urutan menurun, nomor berurutan', () => {
  const a = peringkat(D, KB), b = peringkat(D, { ...KB, pulau: ['jawa'] }), c = peringkat(D, { ...KB, hanyaTitik: true });
  assert.ok(a.length > b.length && b.length > 0 && b.every((r) => r.k.pulau === 'jawa'));
  assert.ok(c.length > 0 && c.every((r) => r.k.titik_tepat));
  for (const l of [a, b, c]) l.forEach((r, i) => { assert.equal(r.no, i + 1); if (i) assert.ok(l[i - 1].skor >= r.skor); });
});

test('sektor: cocok 100, tidak cocok 0, tanpa kegiatan dikeluarkan, "semua" dikeluarkan', () => {
  const pp = perProvinsi(D.provinsi, KB), kek = D.kawasan.find((x) => x.kegiatan?.some((g) => /Palm Oil/.test(g)));
  assert.equal(skorKawasan(kek, { ...KB, sektor: 'pangan' }, D, pp).kom.sektor.skor, 100);
  assert.equal(skorKawasan(kek, { ...KB, sektor: 'tekstil' }, D, pp).kom.sektor.skor, 0);
  assert.equal(skorKawasan(kek, KB, D, pp).kom.sektor, undefined);
  assert.equal(skorKawasan(D.kawasan.find((x) => !x.kegiatan), { ...KB, sektor: 'pangan' }, D, pp).kom.sektor, undefined);
  assert.equal(sektorDariGrup('Textiles, Apparel, Footwear and Luxury Goods'), 'tekstil'); assert.equal(sektorDariGrup('Banks'), 'semua');
});

test('alasan: kuat >= 70, lemah <= 30, maksimal empat', () => {
  for (const r of peringkat(D, KB).slice(0, 30)) {
    const a = alasan(r); assert.ok(a.length <= 4);
    for (const x of a) assert.ok(x.arah === 'kuat' ? x.skor >= 70 : x.skor <= 30);
  }
});
