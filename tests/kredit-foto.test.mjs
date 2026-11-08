// Kredit foto: logika gabung murni + berkas tayang tidak usang + halaman terpasang dan di balik login.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { lisensiUrl, barisMd, dariTokoh, gabung, bangun } from "../scripts/pipa/kredit_foto.mjs";

test("lisensiUrl: CC ke halaman resmi, izin sumber tanpa tautan", () => {
  assert.equal(lisensiUrl("CC BY-SA 4.0"), "https://creativecommons.org/licenses/by-sa/4.0/");
  assert.equal(lisensiUrl("CC BY 2.0"), "https://creativecommons.org/licenses/by/2.0/");
  assert.equal(lisensiUrl("CC0"), "https://creativecommons.org/publicdomain/zero/1.0/");
  assert.match(lisensiUrl("Public domain (PD-IDGov)"), /PD-IDGov/);
  assert.equal(lisensiUrl("milik perusahaan, tampil dengan atribusi"), "");
});
test("barisMd: baris menempel pada pembatas header terbaca", () => {
  const r = barisMd("| a | b |\n| --- | --- || x | y |\n| p | q |");
  assert.deepEqual(r, [["a", "b"], ["x", "y"], ["p", "q"]]);
});
test("gabung: foto ganda sekali, urut subjek, kelompok kosong dibuang", () => {
  const g = gabung([["a", [{ foto: "/1", subjek: "Budi", lisensi: "CC0" }, { foto: "/2", subjek: "Ani", lisensi: "" }]], ["b", [{ foto: "/1", subjek: "Dobel" }]], ["c", []]]);
  assert.deepEqual(g.map((k) => k.kunci), ["a"]);
  assert.deepEqual(g[0].baris.map((b) => b.subjek), ["Ani", "Budi"]);
});
test("dariTokoh: tanpa berkas foto dilewati", () => {
  const r = dariTokoh([{ orang_id: "o_1", nama: "A" }, { orang_id: "o_2", nama: "B" }], { o_1: "/img/orang/o_1.webp" }, () => false);
  assert.equal(r.length, 1);
});
test("public/data/kredit_foto.json sama dengan hasil bangun ulang", () => {
  assert.equal(readFileSync(new URL("../public/data/kredit_foto.json", import.meta.url), "utf8"), JSON.stringify(bangun(), null, 1) + "\n");
});
test("/kredit-foto: tiap baris punya sumber https dan lisensi; halaman tidak di daftar terbuka worker", () => {
  const d = JSON.parse(readFileSync(new URL("../public/data/kredit_foto.json", import.meta.url), "utf8"));
  for (const g of d.kelompok) for (const b of g.baris) { assert.match(b.sumber, /^https:\/\//, b.subjek); assert.ok(b.lisensi, b.subjek); }
  assert.ok(!/kredit-foto/.test(readFileSync(new URL("../src/worker.js", import.meta.url), "utf8").match(/const PUBLIK = .*/)[0]));
});
