// Modul /bioenergi: data benih lolos periksa(), berkas terbit = keluaran skrip, rujukan tidak mati, sepuluh tab ada modulnya, tautan dua arah terpasang, CSS tanpa hex.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { bangun, periksa } from "../scripts/panen/bioenergi.mjs";

const baca = (f) => readFileSync(new URL("../" + f, import.meta.url), "utf8");
const json = (f) => JSON.parse(baca(f));
const TAB = ["bahan", "biodiesel", "bioetanol", "saf", "listrik", "biogas", "pelet", "dana", "neraca", "isu"];

test("benih lolos periksa (sumber, org_id, energi_baru, butir pemasok)", () => assert.ok(periksa(bangun()).sumber > 40));
test("berkas terbit sama dengan keluaran skrip", () => assert.deepEqual(json("public/data/bioenergi.json"), JSON.parse(JSON.stringify(bangun()))));
test("tiap tingkat bukti sumber dikenal dan tiap URL https", () => {
  for (const s of json("public/data/bioenergi.json").sumber) { assert.match(s.url, /^https:\/\//); assert.ok(["resmi", "media", "cuplikan", "via-pihak-ketiga", "kata-pihak"].includes(s.tingkat_bukti), s.id); }
});
test("neraca: faktor turunan dan jumlah konsisten", () => {
  const n = json("public/data/bioenergi.json").neraca;
  assert.ok(Math.abs(n.faktor_cpo_per_kl - n.energi_b50_cpo_ton / n.energi_b50_kl) < 0.001);
  assert.ok(n.cpo_ton_2023 > n.pangan_ton + n.energi_b50_cpo_ton);
});
test("sepuluh tab punya modul dengan mulai(), halaman, CSS, dan sandi tab di kerangka", () => {
  for (const k of TAB) { assert.match(baca(`public/bio_${k}.js`), /export (async )?function mulai\(/, k); assert.match(baca("public/bioenergi.js"), new RegExp(`k: "${k}"`)); }
  assert.ok(existsSync(new URL("../public/bioenergi.html", import.meta.url)) && existsSync(new URL("../public/bioenergi.css", import.meta.url)));
});
test("CSS bioenergi: tanpa hex dan tanpa px pada font", () => {
  const c = baca("public/bioenergi.css");
  assert.doesNotMatch(c, /#[0-9a-f]{3,8}\b/i);
  assert.doesNotMatch(c, /font[^;{}]*\d+px/);
});
test("tautan dua arah: menu, metode, cari, profil org, wilayah, teknologi, topik, rantai global", () => {
  assert.match(baca("public/inti/rumah_tek.js"), /"\/bioenergi"/); /* menu: modul tak lagi di menu, rumahnya hub /teknologi (rute-gabung.test.mjs) */
  assert.match(baca("public/metode_halaman.js"), /id: "bioenergi"/);
  assert.match(baca("scripts/pipa/indeks_cari.mjs"), /\["\/bioenergi", "bn\.nav"\]/);
  assert.match(baca("public/tertaut.js"), /\/bioenergi/);
  assert.match(baca("public/inti/rumah_tek.js"), /"\/bioenergi"/);
  assert.match(baca("public/topik_tampil.js"), /href="\/bioenergi"/);
  assert.match(baca("public/rantai-global.js"), /\/bioenergi/);
  assert.match(baca("public/img/ikon.svg"), /id="i-bioenergi"/);
});
test("kamus id dan en memuat semua kunci t('bn.*') statis", () => {
  const id = json("public/i18n/id.json"), en = json("public/i18n/en.json"), hilang = [];
  for (const k of TAB.map((x) => `public/bio_${x}.js`).concat(["public/bio_umum.js", "public/bioenergi.js", "public/bioenergi.html"])) {
    for (const m of baca(k).matchAll(/["`(](bn\.[a-z0-9_.\-]+)["`)]/g)) if (!m[1].endsWith(".") && !(m[1] in id && m[1] in en)) hilang.push(m[1]);
  }
  assert.deepEqual(hilang, []);
});
