/* /peta: indeks lapisan konsisten dengan berkas, adapter, dan kamus. Lapisan bertanda menanti boleh belum berkas (tampil "segera"). */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

const baca = (p) => JSON.parse(readFileSync(new URL("../public/" + p, import.meta.url), "utf8"));
const IDX = baca("data/peta_lapisan.json"), ID = baca("i18n/id.json"), EN = baca("i18n/en.json");
const ada = (u) => existsSync(new URL("../public" + u, import.meta.url));

test("id lapisan unik, kelompok dikenal, jenis sah", () => {
  const ids = IDX.lapisan.map((l) => l.id);
  assert.equal(new Set(ids).size, ids.length);
  const kel = new Set(IDX.kelompok.map((k) => k.id));
  for (const l of IDX.lapisan) { assert.ok(kel.has(l.kelompok), l.id); assert.ok(["titik", "garis", "poligon", "koroplet"].includes(l.jenis), l.id); }
});
test("berkas lapisan ada, kecuali yang bertanda menanti", () => {
  for (const l of IDX.lapisan) if (!l.menanti) assert.ok(l.berkas && ada(l.berkas), `${l.id}: ${l.berkas}`);
  assert.ok(IDX.lapisan.filter((l) => l.nyala).length >= 1);
});
test("tiap lapisan dan kelompok punya label, deskripsi, ikon di kamus id dan en", () => {
  const svg = readFileSync(new URL("../public/img/ikon.svg", import.meta.url), "utf8");
  for (const l of IDX.lapisan) {
    for (const k of [`pn2.l.${l.id}`, `pn2.l.${l.id}.d`]) assert.ok(ID[k] && EN[k], k);
    assert.ok(svg.includes(`id="i-${l.ikon}"`), `${l.id}: ikon ${l.ikon}`);
  }
  for (const g of IDX.kelompok) assert.ok(ID[`pn2.k.${g.id}`] && EN[`pn2.k.${g.id}`], g.id);
});
test("adapter terdaftar untuk tiap lapisan", async () => {
  const s = readFileSync(new URL("../public/peta_lapis.js", import.meta.url), "utf8");
  for (const l of IDX.lapisan) assert.ok(new RegExp(`\\b${l.adapter}: \\{`).test(s), `${l.id}: adapter ${l.adapter}`);
});
test("menu inti memuat /peta dengan ikon unik", () => {
  assert.match(readFileSync(new URL("../public/inti/kepala.js", import.meta.url), "utf8"), /href: "\/peta", kunci: "nav\.peta", ikon: "globe"/);
  assert.ok(ID["nav.peta"] && EN["nav.peta"]);
});
test("peta.js memakai panel geser dan tanpa teks tertanam", () => {
  const j = readFileSync(new URL("../public/peta.js", import.meta.url), "utf8");
  assert.match(j, /geserPanel\(/);
  assert.doesNotMatch(readFileSync(new URL("../public/peta.html", import.meta.url), "utf8"), /\sstyle=/);
});
