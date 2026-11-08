// /lelang: perakit data (tiap baris bersumber, rujukan silang sah) dan hitungan harga vs patokan Perpres 112/2022.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { periksa, bangun } from "../scripts/panen/lelang_lib.mjs";
import * as seed from "../scripts/panen/lelang_seed.mjs";
import { faktorF, patokanSen, selisihPersen, usdPerMwh } from "../public/lelang_hitung.js";

const baca = (f) => JSON.parse(readFileSync(new URL("../public/data/" + f, import.meta.url), "utf8"));
const set = (a) => new Set(a.map((x) => x.id));
const d = baca("lelang.json");

test("lelang.json lolos pemeriksa (sumber, tahap, rujukan proyek/org/regulasi/program)", () => {
  assert.deepEqual(periksa(d, { proyekAda: set(baca("proyek.json").baris), orgAda: set(baca("organisasi.json").baris), regAda: set(baca("regulasi.json").baris), programAda: set(baca("program.json").baris) }), []);
  assert.ok(d.putaran.length >= 25 && d.jumlah === d.putaran.length);
});
test("lelang.json sama dengan hasil perakit dari seed", () => {
  const b = bangun({ seed, tender: baca("tender.json"), regulasi: baca("regulasi.json"), proyek: baca("proyek.json"), program: baca("program.json"), tanggal: d.dibangun_pada });
  assert.deepEqual(JSON.parse(JSON.stringify(b)), d);
});
test("pemeriksa menolak baris tanpa sumber dan harga tanpa angka", () => {
  const x = structuredClone(d); x.putaran[0].sumber_id = "tidak-ada"; x.putaran[1].harga = { usd_sen_kwh: 0, sumber_id: x.sumber[0].id };
  const g = periksa(x);
  assert.ok(g.some((s) => s.includes("sumber_id tidak-ada")) && g.some((s) => s.includes("harga tanpa angka")));
});
test("harga hanya ada bila bersumber; Cirata 5,8179 sen", () => {
  const h = d.putaran.filter((p) => p.harga);
  assert.ok(h.length >= 1 && h.every((p) => p.harga.sumber_id));
  assert.equal(d.putaran.find((p) => p.id === "lel_cirata_2019").harga.usd_sen_kwh, 5.8179);
});
test("patokan surya >20 MW Jawa Barat: 6,95 x F 1 = 6,95; Cirata -16,3 persen", () => {
  const pel = baca("peluang.json"), p = patokanSen(pel, "surya", 145, "32");
  assert.equal(p.sen, 6.95);
  assert.ok(Math.abs(selisihPersen(5.8179, p.sen) - -16.29) < 0.05);
  assert.equal(faktorF(pel, "82"), 1.25);
  assert.equal(patokanSen(pel, "campuran", 100, "32"), null);
  assert.equal(selisihPersen(null, 5), null);
  assert.equal(usdPerMwh(5.8179), 58.18);
});
