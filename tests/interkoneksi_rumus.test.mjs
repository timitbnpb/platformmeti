// Uji acuan penaksir biaya interkoneksi (F65-308).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { biayaSaluran, hitungInterkoneksi } from "../public/inti/interkoneksi_rumus.js";

test("biaya saluran = jarak x biaya per km; total menambah biaya gardu", () => {
  assert.equal(biayaSaluran(12, 5e9), 6e10);
  assert.deepEqual(hitungInterkoneksi({ km: 12, perKm: 5e9, gardu: 2e10 }), { saluran: 6e10, total: 8e10 });
  assert.deepEqual(hitungInterkoneksi({ km: 12, perKm: 5e9 }), { saluran: 6e10, total: 6e10 });
  assert.deepEqual(hitungInterkoneksi({ km: 0, perKm: 5e9, gardu: 0 }), { saluran: 0, total: 0 });
});

test("masukan belum lengkap atau tak sah = null, bukan nol", () => {
  for (const v of [NaN, -1, Infinity, "5", null, undefined]) {
    assert.equal(biayaSaluran(v, 5e9), null);
    assert.equal(biayaSaluran(12, v), null);
  }
  assert.deepEqual(hitungInterkoneksi({ km: NaN, perKm: 5e9, gardu: 1 }), { saluran: null, total: null });
  assert.deepEqual(hitungInterkoneksi({ km: 12, perKm: 5e9, gardu: -1 }), { saluran: 6e10, total: null });
});

test("modul rumus tidak menyimpan biaya satuan", () => {
  const src = readFileSync(new URL("../public/inti/interkoneksi_rumus.js", import.meta.url), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
  assert.deepEqual((src.match(/\b\d+(\.\d+)?\b/g) || []).filter((x) => x !== "0"), []);
});

test("repo memang belum punya biaya satuan transmisi bersumber (bila kelak ada, layar wajib menawarkannya dengan sumbernya)", () => {
  const kom = readFileSync(new URL("../public/data/katalog_data.json", import.meta.url), "utf8");
  assert.ok(!/biaya[_ ]transmisi|biaya[_ ]per[_ ]km|biaya[_ ]saluran/i.test(kom));
});
