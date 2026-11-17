// Uji acuan rasio terpasang terhadap potensi (F65-112) dan kartu skor target vs realisasi (F65-113).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { potensiTotal, rasioPersen, selisihTarget, ringkasJanji } from "../public/inti/rasio_rumus.js";
import { metrikProvinsi } from "../public/banding_hitung.js";

const baca = (f) => JSON.parse(readFileSync(new URL("../public/data/" + f, import.meta.url), "utf8"));
const dekat = (a, b) => assert.ok(Math.abs(a - b) <= Math.abs(b) * 1e-9 + 1e-9, `${a} bukan ${b}`);

test("rasio = terpasang / potensi x 100; tidak dipotong di 100", () => {
  dekat(rasioPersen(50, 1000), 5);
  dekat(rasioPersen(1500, 1000), 150);
  assert.equal(rasioPersen(0, 1000), 0);
});

test("potensi kosong, nol, atau terpasang kosong = null, bukan nol", () => {
  assert.equal(potensiTotal(undefined), null);
  assert.equal(potensiTotal({}), null);
  assert.equal(potensiTotal({ surya: { mw: null, induk_mw: 500 }, bayu: {} }), null);
  assert.equal(potensiTotal({ surya: { mw: 0 } }), null);
  assert.equal(potensiTotal({ surya: { mw: 100 }, bayu: { mw: null }, hidro: { mw: 50.5 } }), 150.5);
  for (const v of [null, undefined, NaN, "5", -1]) assert.equal(rasioPersen(v, 100), null);
  for (const v of [null, undefined, NaN, 0, -3]) assert.equal(rasioPersen(10, v), null);
});

test("data nyata: rasio tiap provinsi dihitung dari wilayah.json dan peluang.json, potensi sama dengan /banding", () => {
  const w = baca("wilayah.json"), pl = baca("peluang.json"), P = new Map(pl.baris.map((b) => [b.kode, b]));
  const D = { wilayah: w, peluang: pl, indeks: { provinsi: [] }, rued: { baris: [] }, radar: { baris: [] }, berita: { baris: [] } };
  let berasio = 0, kosong = 0;
  for (const p of w.baris) {
    const pot = potensiTotal(P.get(p.kode)?.potensi), r = rasioPersen(p.terpasang_mw?.nilai ?? null, pot);
    const banding = metrikProvinsi(p.kode, D).m.potensi;
    assert.equal(pot === null ? null : Math.round(pot), banding, `potensi ${p.nama} beda dengan /banding`);
    if (r === null) { kosong++; assert.ok(pot === null || p.terpasang_mw == null, `${p.nama} kosong tanpa alasan`); continue; }
    berasio++;
    dekat(r, (p.terpasang_mw.nilai / pot) * 100);
    assert.ok(r >= 0);
  }
  assert.ok(berasio >= 30, "terlalu sedikit provinsi berasio: " + berasio);
  assert.equal(berasio + kosong, w.baris.length);
});

test("selisih target dan ringkasan kartu skor dari target_realisasi.json", () => {
  dekat(selisihTarget(23, 10.954), 12.046);
  assert.equal(selisihTarget(50, 50), 0);
  assert.equal(selisihTarget(23, null), null); assert.equal(selisihTarget(undefined, 5), null);
  const o = baca("target_realisasi.json"), r = ringkasJanji(o.target);
  assert.equal(r.total, o.target.length);
  assert.equal(r.baik + r.tertinggal + r.tanpaData, r.total);
  assert.equal(r.berdata, r.total - r.tanpaData);
  for (const d of o.target) {
    assert.ok(d.nama?.id && d.dokumen && d.tahun, d.id + " tanpa nama, dokumen, atau tenggat");
    assert.ok(/^https:\/\//.test(d.url || ""), d.id + " tanpa tautan dokumen");
    if (d.status !== "tidak-ada-data") { assert.ok(Number.isFinite(d.terbaru?.v), d.id + " berstatus tanpa realisasi"); assert.ok(d.sumberRealisasi?.judul, d.id + " tanpa sumber realisasi"); }
  }
});

test("modul rumus tidak menyimpan angka data", () => {
  const src = readFileSync(new URL("../public/inti/rasio_rumus.js", import.meta.url), "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/"[^"]*"/g, "");
  assert.deepEqual(src.match(/\b\d+(\.\d+)?\b/g).filter((x) => !["0", "100"].includes(x)), []);
});

test("selisih ke target membaca arah: target turun (batas emisi) tercapai bila realisasi di bawah target", async () => {
  const { selisihTarget } = await import("../public/inti/rasio_rumus.js");
  assert.equal(selisihTarget(23, 10), 13);
  assert.equal(selisihTarget(290, 350, "turun"), 60, "emisi 350 terhadap batas 290: masih kurang 60");
  assert.equal(selisihTarget(290, 250, "turun"), -40, "emisi 250 di bawah batas 290: terlampaui ke arah yang diinginkan");
  assert.equal(selisihTarget(290, null, "turun"), null);
});
