// Uji acuan alur izin dan penaksir lahan /izin-kontrak (F65-108, F65-109).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { langkahIzin, luasLahan, JENIS_ALUR } from "../public/inti/izin_alur.js";

const D = JSON.parse(readFileSync(new URL("../public/data/izin_kontrak.json", import.meta.url), "utf8"));
const dekat = (a, b) => assert.ok(Math.abs(a - b) <= Math.abs(b) * 1e-9 + 1e-9, `${a} bukan ${b}`);

test("langkah: butir umum + butir jenis, urutan sumber, bernomor 1..n", () => {
  const t = [{ id: "a", jenis: "umum" }, { id: "b", jenis: "surya" }, { id: "c", jenis: "hidro" }, { id: "d", jenis: "umum" }];
  assert.deepEqual(langkahIzin(t, "surya").map((x) => [x.no, x.id]), [[1, "a"], [2, "b"], [3, "d"]]);
  assert.deepEqual(langkahIzin(t, "umum").map((x) => x.id), ["a", "d"]);
  assert.deepEqual(langkahIzin(t, "semua"), []);
  assert.deepEqual(langkahIzin(undefined, "surya"), []);
});

test("data nyata: tiap jenis punya langkah, tiap langkah punya pasal dan dokumen yang dikenal", () => {
  for (const j of JENIS_ALUR) {
    const l = langkahIzin(D.tanya, j);
    assert.ok(l.length >= D.tanya.filter((x) => x.jenis === "umum").length, j);
    assert.deepEqual(l.map((x) => x.no), l.map((_, i) => i + 1));
    for (const x of l) { assert.ok(x.pasal.length, x.id + " tanpa pasal"); for (const p of x.pasal) assert.ok(D.dok[p.dok] && p.pasal, x.id); }
  }
  assert.ok(new Set(D.tanya.map((x) => x.jenis)).size <= JENIS_ALUR.length);
  for (const x of D.tanya) assert.ok(JENIS_ALUR.includes(x.jenis), "jenis baru tak terdaftar: " + x.jenis);
});

test("batas waktu yang ditampilkan di langkah 'waktu' ada di data dan berpasal; durasi lain tidak dikarang", () => {
  assert.ok(D.tanya.some((x) => x.id === "waktu"));
  for (const b of D.batas_waktu) assert.ok(b.hari > 0 && D.dok[b.pasal.dok] && b.pasal.pasal, b.id);
  assert.ok(D.tanya.every((x) => !("hari" in x) && !("urutan" in x)), "bila data urutan/durasi per langkah muncul, perbarui layar dan catatannya");
});

test("luas lahan: rentang = MW x ha per MW; tak sah = null, bukan nol", () => {
  const r = luasLahan(10, 1.2, 2);
  dekat(r.min, 12); dekat(r.maks, 20);
  assert.deepEqual(luasLahan(0, 1, 2), { min: 0, maks: 0 });
  assert.deepEqual(luasLahan(5, 2, 2), { min: 10, maks: 10 });
  assert.equal(luasLahan(10, 2, 1), null);
  for (const v of [NaN, -1, undefined, null, "3", Infinity]) { assert.equal(luasLahan(v, 1, 2), null); assert.equal(luasLahan(1, v, 2), null); assert.equal(luasLahan(1, 1, v), null); }
});

test("modul tidak menyimpan angka luas per MW", () => {
  const src = readFileSync(new URL("../public/inti/izin_alur.js", import.meta.url), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
  assert.deepEqual((src.match(/\b\d+(\.\d+)?\b/g) || []).filter((x) => !["0", "1"].includes(x)), []);
});
