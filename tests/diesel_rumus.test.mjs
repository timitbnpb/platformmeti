// Uji acuan kalkulator hemat dibanding diesel (F65-104).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { biayaDiesel, hitungDiesel, HARI_TAHUN } from "../public/inti/diesel_rumus.js";

// Perkalian desimal (20000 x 0.28) tidak tepat di titik mengambang: banding dengan toleransi relatif.
const dekat = (a, b) => assert.ok(Math.abs(a - b) <= Math.abs(b) * 1e-9 + 1e-9, `${a} bukan ${b}`);

test("biaya diesel per kWh = harga x konsumsi spesifik + O&M", () => {
  dekat(biayaDiesel(20000, 0.28), 5600);
  dekat(biayaDiesel(20000, 0.28, 400), 6000);
  assert.equal(biayaDiesel(0, 0.28), 0);
});

test("contoh: 200 kWh per hari, Rp 20.000 per liter, 0,28 liter per kWh, EBT Rp 2.880 per kWh", () => {
  const h = hitungDiesel({ kwhHari: 200, harga: 20000, sfc: 0.28, om: 0, ebt: 2880 });
  assert.equal(HARI_TAHUN, 365);
  assert.equal(h.kwhTahun, 73000);
  dekat(h.dieselKwh, 5600);
  dekat(h.dieselTahun, 408800000);
  assert.equal(h.ebtTahun, 210240000);
  dekat(h.hemat, 198560000);
  assert.ok(Math.abs(h.liter - 20440) < 1e-6);
});

test("EBT lebih mahal: hemat negatif ditampilkan apa adanya, tidak dipotong ke nol", () => {
  assert.equal(hitungDiesel({ kwhHari: 100, harga: 10000, sfc: 0.25, ebt: 3000 }).hemat, (2500 - 3000) * 36500);
});

test("masukan belum lengkap atau tak sah = null, bukan nol", () => {
  const k = hitungDiesel({ kwhHari: NaN, harga: NaN, sfc: NaN, ebt: NaN });
  assert.deepEqual(k, { dieselKwh: null, kwhTahun: null, dieselTahun: null, ebtTahun: null, hemat: null, liter: null });
  const sebagian = hitungDiesel({ kwhHari: 200, harga: 20000, sfc: 0.28, ebt: NaN });
  dekat(sebagian.dieselTahun, 408800000); assert.equal(sebagian.hemat, null);
  for (const v of [-1, Infinity, "5", null, undefined]) assert.equal(biayaDiesel(v, 0.28), null);
});

test("asumsi yang ditawarkan layar ada di dedieselisasi.json dan berlabel Hipotesis", () => {
  const D = JSON.parse(readFileSync(new URL("../public/data/dedieselisasi.json", import.meta.url), "utf8"));
  assert.equal(D.harga_solar.label, "Hipotesis");
  assert.ok(D.harga_solar.rp_per_liter > 0 && D.asumsi.sfc_l_kwh > 0 && D.asumsi.kurs > 0 && D.asumsi.biaya_sen_usd_kwh.dasar > 0);
});

test("modul rumus tidak menyimpan harga atau konsumsi spesifik", () => {
  const src = readFileSync(new URL("../public/inti/diesel_rumus.js", import.meta.url), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
  assert.deepEqual(src.match(/\b\d+(\.\d+)?\b/g).filter((x) => !["365", "0"].includes(x)), []);
});
