import test from "node:test";
import assert from "node:assert/strict";
import { norm, jerami, cari, sorot } from "../public/inti/cari_rumus.js";

const item = (g, j, ...x) => ({ g, j: norm(j), h: jerami(j, ...x) });
test("norm: tanpa aksen dan huruf besar", () => assert.equal(norm("  Pertámina—GEO! "), "pertamina geo"));
test("awalan kata dan singkatan dua arah", () => {
  const ix = [item("proyek", "PLTS Cirata", "Jawa Barat"), item("org", "Kementerian ESDM"), item("org", "Pertamina Geothermal")];
  assert.equal(cari(ix, "cir").get("proyek")[0].j, "plts cirata");
  assert.equal(cari(ix, "surya").get("proyek").length, 1);
  assert.equal(cari(ix, "energi sumber").get("org")[0].j, "kementerian esdm");
  assert.equal(cari(ix, "pert").get("org").length, 1);
  assert.equal(cari(ix, "zzz").size, 0);
});
test("maks per grup dan peringkat judul pendek", () => {
  const ix = Array.from({ length: 10 }, (_, i) => item("p", "Cirata " + "x".repeat(i)));
  const r = cari(ix, "cirata").get("p");
  assert.equal(r.length, 6); assert.equal(r[0].j, "cirata");
});
test("sorot meng-escape", () => assert.equal(sorot("<b>Cirata</b>", "cir"), "&lt;b&gt;<mark>Cirata</mark>&lt;/b&gt;"));
