// Kamus istilah: penggabungan duplikat, definisi resmi didahulukan, indeks hover tanpa alias ambigu, kunci i18n id == en.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gabung, aliasDari, hover } from "../scripts/pipa/istilah.mjs";

const src = (jenis, ref) => ({ jenis, ref, href: "" });
test("aliasDari: kurung, garis miring, koma, 'dan' antar-kata-tunggal", () => {
  assert.deepEqual(aliasDari("Tankos (EFB)").sort(), ["EFB", "Tankos", "Tankos (EFB)"].sort());
  assert.ok(aliasDari("B40 / B50").includes("B50"));
  assert.ok(aliasDari("P50 dan P90").includes("P90"));
  assert.ok(!aliasDari("Kontrak selisih dan biaya").includes("biaya"));
});
test("gabung: duplikat beda ejaan jadi satu, definisi resmi menang dan berlabel", () => {
  const g = gabung([
    { nama: "PPA", id: "Perjanjian jual beli listrik.", en: "x", kat: "uang", sumber: src("topik", "surya") },
    { nama: "Perjanjian Jual Beli Tenaga Listrik / PPA", id: "Resmi pasal.", en: "y", kat: "aturan", resmi: true, sumber: src("pasal", "r1") },
    { nama: "ppa", id: "Lebih panjang dari yang lain tapi bukan resmi.", en: "z", kat: "uang", sumber: src("topik", "bayu") },
  ]);
  assert.equal(g.length, 1);
  assert.equal(g[0].resmi, true);
  assert.equal(g[0].arti.id, "Resmi pasal.");
  assert.equal(g[0].sumber.length, 3);
});
test("gabung: singkatan dalam kurung tidak menggabung arti berbeda (CPO)", () => {
  const g = gabung([
    { nama: "CPO / PKO", id: "Minyak sawit mentah.", en: "a", kat: "teknis", sumber: src("topik", "bioenergi") },
    { nama: "Charge point operator (CPO)", id: "Operator titik pengisian.", en: "b", kat: "teknis", sumber: src("topik", "kendaraan-listrik") },
  ]);
  assert.equal(g.length, 2);
});
test("hover: alias ambigu dibuang, singkatan peka huruf, kata biasa pendek dilewati", () => {
  const h = hover([
    { id: "a", nama: "CPO", alias: ["CPO"], arti: { id: "A.", en: "A." }, resmi: false },
    { id: "b", nama: "Opr", alias: ["CPO"], arti: { id: "B.", en: "B." }, resmi: false },
    { id: "c", nama: "PLTS", alias: ["PLTS"], arti: { id: "C.", en: "C." }, resmi: false },
    { id: "d", nama: "Head", alias: ["Head"], arti: { id: "D.", en: "D." }, resmi: false },
  ]);
  assert.deepEqual(h.m.map((x) => x[1]), ["c"]);
  assert.equal(h.m[0][2], 1);
});
test("data: id unik, tiap istilah punya arti + sumber + kategori sah", () => {
  const d = JSON.parse(readFileSync(new URL("../public/data/istilah.json", import.meta.url)));
  assert.ok(d.jumlah >= 400 && d.jumlah === d.istilah.length);
  assert.equal(new Set(d.istilah.map((x) => x.id)).size, d.jumlah);
  for (const x of d.istilah) {
    assert.ok(x.arti.id && x.arti.en && x.sumber.length && d.kat.includes(x.kat), x.id);
    for (const r of x.terkait) assert.ok(d.istilah.some((o) => o.id === r), `${x.id} -> ${r}`);
  }
  for (const s of ["PLTS", "RUPTL", "LCOE", "TKDN", "JETP", "SPE-GRK"]) assert.ok(d.istilah.some((x) => x.nama === s), s);
});
test("kunci is2.* ada di id dan en", () => {
  const baca = (l) => JSON.parse(readFileSync(new URL(`../public/i18n/${l}.json`, import.meta.url)));
  const id = baca("id"), en = baca("en"), k = Object.keys(id).filter((x) => x.startsWith("is2."));
  assert.ok(k.length > 30);
  for (const x of k) assert.ok(en[x], x);
});
