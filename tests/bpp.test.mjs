// BPP pembangkitan PLN: transkripsi Kepmen ESDM (data/peluang/bpp.json) dan hasilnya di peluang.json
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { bppDari } from '../public/inti/kelayakan_rumus.js';

const baca = (p) => JSON.parse(fs.readFileSync(new URL('../' + p, import.meta.url), 'utf8'));
const B = baca('data/peluang/bpp.json');
const P = baca('public/data/peluang.json');
const BARIS = { 2016: 93, 2017: 82, 2018: 82, 2020: 82 };

test('jumlah baris per tahun sesuai Kepmen', () => {
  assert.deepEqual(Object.keys(B.tahun).map(Number), Object.keys(BARIS).map(Number));
  for (const [th, n] of Object.entries(BARIS)) assert.equal(B.tahun[th].baris.length, n, th);
});

test('tiap baris: kunci terdaftar tanpa ganda, Rp 500-5000/kWh, Rp = sen USD x kurs (tolok salah OCR)', () => {
  for (const [th, t] of Object.entries(B.tahun)) {
    assert.ok(t.kepmen && t.tanggal_penetapan && t.halaman && t.kurs_rp_usd > 10000, th);
    const lihat = new Set();
    for (const r of t.baris) {
      assert.ok(B.sistem[r.kunci], `${th} kunci ${r.kunci}`);
      assert.ok(!lihat.has(r.kunci), `${th} ganda ${r.kunci}`); lihat.add(r.kunci);
      assert.ok(r.rp_kwh >= 500 && r.rp_kwh <= 5000, `${th} ${r.kunci} ${r.rp_kwh}`);
      const dariUsd = (r.rp_kwh / t.kurs_rp_usd) * 100;
      assert.ok(Math.abs(dariUsd - r.sen_usd_kwh) <= Math.max(0.03, r.sen_usd_kwh * 0.003), `${th} ${r.kunci}: ${r.rp_kwh}/${t.kurs_rp_usd} = ${dariUsd.toFixed(2)} sen, tertulis ${r.sen_usd_kwh}`);
    }
    assert.ok(t.nasional.rp_kwh >= 500 && t.nasional.rp_kwh <= 5000);
  }
});

test('peluang.json: tiap provinsi berisi bpp bernilai atau alasan null; nilai = sistem utama tahun 2020', () => {
  assert.equal(P.baris.length, 38);
  const nasional2020 = B.tahun[2020].nasional.rp_kwh;
  for (const b of P.baris) {
    if (b.bpp.nilai_rp_kwh == null) { assert.ok(b.bpp.alasan_null, `${b.kode} null tanpa alasan`); continue; }
    assert.equal(b.bpp.tahun_bpp, 2020);
    assert.ok(b.bpp.kepmen && b.bpp.sistem.length >= 1 && b.bpp.riwayat.length >= 1, b.kode);
    assert.equal(b.bpp.riwayat[0].nilai_rp_kwh, b.bpp.nilai_rp_kwh);
    assert.ok(b.bpp.nilai_rp_kwh >= 500 && b.bpp.nilai_rp_kwh <= 5000);
    assert.ok(b.bpp.sistem.some((s) => s.kunci === b.bpp.sistem_utama.kunci), `${b.kode} sistem utama tak terdaftar`);
    assert.equal(bppDari(b), b.bpp.nilai_rp_kwh); // pembaca kelayakan memakai bentuk ini
  }
  assert.equal(P.baris.filter((b) => b.bpp.nilai_rp_kwh != null).length, 38);
  assert.equal(B.tahun[2020].nasional.rp_kwh, nasional2020);
});
