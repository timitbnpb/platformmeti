// Uji acuan kalkulator baterai geser beban (F65-105): contoh dihitung tangan, termasuk tepi.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { energiGeserHari, sisaKapasitas, hitungBaterai } from "../public/inti/baterai_rumus.js";

const dekat = (a, b) => assert.ok(Math.abs(a - b) <= Math.abs(b) * 1e-9 + 1e-6, `${a} bukan ${b}`);
// 100 kWh, DoD 80% -> 80 kWh; 20 kW x 5 jam -> 100 kWh; yang kecil 80; efisiensi 90% -> 72 kWh per hari.
const acuan = { kwh: 100, dod: 80, kw: 20, jam: 5, eff: 90, selisih: 500, hari: 300, degr: 2, umur: 10, capex: 54e6, diskonto: 0 };

test("energi tergeser per hari = min(kapasitas x DoD, daya x jam) x efisiensi", () => {
  dekat(energiGeserHari(acuan), 72);
  dekat(energiGeserHari({ ...acuan, kw: 10 }), 45); // dibatasi daya: 10 x 5 = 50, x 0,9
  assert.equal(energiGeserHari({ ...acuan, kwh: 0 }), 0);
});

test("contoh acuan: 21.600 kWh dan Rp 10,8 juta di tahun 1, NPV Rp 44,28 juta pada 0%, balik modal 5,22 tahun", () => {
  const h = hitungBaterai(acuan);
  dekat(h.energiHari, 72); dekat(h.energiTahun1, 21600); dekat(h.pendapatanTahun1, 10.8e6);
  assert.equal(h.arus.length, 11); dekat(h.arus[0], -54e6); dekat(h.arus[2], 10.584e6); dekat(h.arus[10], 10.8e6 * 0.82);
  dekat(h.npv, 44.28e6);
  dekat(h.balik, 5 + (54 - 51.84) / 9.72);
  dekat(hitungBaterai({ ...acuan, diskonto: 10 }).npv, h.arus.reduce((s, c, i) => s + c / 1.1 ** i, 0));
});

test("degradasi linear tidak pernah di bawah nol", () => {
  dekat(sisaKapasitas(2, 1), 1); dekat(sisaKapasitas(2, 6), 0.9); assert.equal(sisaKapasitas(20, 10), 0);
});

test("selisih nol atau negatif dihitung apa adanya, tidak dipotong", () => {
  const nol = hitungBaterai({ ...acuan, selisih: 0 }), rugi = hitungBaterai({ ...acuan, selisih: -100 });
  assert.equal(nol.pendapatanTahun1, 0); assert.equal(nol.balik, null); dekat(nol.npv, -54e6);
  dekat(rugi.pendapatanTahun1, -2.16e6); assert.equal(rugi.balik, null); assert.ok(rugi.npv < -54e6);
});

test("masukan belum lengkap atau tak sah = null, bukan nol", () => {
  const k = hitungBaterai({});
  assert.deepEqual(k, { energiHari: null, energiTahun1: null, pendapatanTahun1: null, arus: null, npv: null, balik: null });
  for (const salah of [{ dod: 101 }, { eff: -1 }, { jam: 25 }, { kwh: NaN }, { kw: "20" }, { hari: 367 }]) assert.equal(hitungBaterai({ ...acuan, ...salah }).pendapatanTahun1, null);
  const tanpaCapex = hitungBaterai({ ...acuan, capex: NaN });
  dekat(tanpaCapex.pendapatanTahun1, 10.8e6); assert.equal(tanpaCapex.arus, null); assert.equal(tanpaCapex.balik, null);
  assert.equal(hitungBaterai({ ...acuan, umur: 2.5 }).arus, null);
  assert.equal(hitungBaterai({ ...acuan, diskonto: NaN }).npv, null); assert.ok(hitungBaterai({ ...acuan, diskonto: NaN }).balik > 5);
  dekat(hitungBaterai({ ...acuan, degr: undefined }).arus[10], 10.8e6); // degradasi kosong = 0
});

test("modul rumus tidak menyimpan tarif, harga, atau efisiensi bawaan", () => {
  const src = readFileSync(new URL("../public/inti/baterai_rumus.js", import.meta.url), "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
  assert.deepEqual(src.match(/\b\d+(\.\d+)?\b/g).filter((x) => !["0", "1", "24", "60", "100", "366"].includes(x)), []);
});
