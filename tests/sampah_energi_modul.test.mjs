// Modul /sampah-energi: data lolos periksa() (id rujukan hidup di berkas asli), berkas terbit = keluaran skrip, sumber https tanpa foto Antara,
// delapan tab ada modulnya, tautan dua arah terpasang, CSS tanpa hex, kamus id+en lengkap.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { bangun, periksa } from "../scripts/panen/sampah_energi_modul.mjs";
import { KAMUS } from "../scripts/panen/sampah_energi_kamus.mjs";

const baca = (f) => readFileSync(new URL("../" + f, import.meta.url), "utf8");
const json = (f) => JSON.parse(baca(f));
const TAB = ["sumber", "jalur", "kota", "konsorsium", "aturan", "tarif", "pemasok", "isu"];

test("benih lolos periksa (id rujukan hidup di berkas asli)", () => { const r = periksa(bangun()); assert.ok(r.sumber > 40); assert.equal(r.konsorsium, 8); });
test("berkas terbit sama dengan keluaran skrip", () => assert.deepEqual(json("public/data/sampah_energi.json"), JSON.parse(JSON.stringify(bangun()))));
test("tiap sumber https, bukti dikenal, tanpa foto Antara; tiap celah berupa kalimat", () => {
  const d = json("public/data/sampah_energi.json");
  for (const s of d.sumber) { assert.match(s.url, /^https:\/\//); assert.ok(["resmi", "media", "kajian", "via-pihak-ketiga", "editorial"].includes(s.tingkat_bukti), s.id); assert.doesNotMatch(s.url, /antaranews\.com\/(foto|photo)/, s.id); }
  assert.ok(d.celah.length >= 5);
});
test("terkelola lebih kecil dari timbulan; open dumping lebih kecil dari total TPA", () => {
  const T = json("public/data/sampah_energi.json").timbulan;
  assert.ok(T.terkelola.nilai < T.timbulan.nilai); assert.ok(T.tpa.open_dumping < T.tpa.total);
  assert.ok(Math.abs((T.terkelola.nilai / T.timbulan.nilai) * 100 - T.terkelola.persen) < 0.05);
});
test("delapan tab punya modul dengan mulai(), halaman, CSS, ikon, dan kunci tab di kerangka", () => {
  for (const k of TAB) { assert.match(baca(`public/swe_${k}.js`), /export (async )?function mulai\(/, k); assert.match(baca("public/sampah-energi.js"), new RegExp(`k: "${k}"`)); }
  for (const f of ["sampah-energi.html", "sampah-energi.css", "sampah-energi.js", "swe_umum.js"]) assert.ok(existsSync(new URL("../public/" + f, import.meta.url)), f);
  assert.match(baca("public/img/ikon.svg"), /id="i-sampah-energi"/);
});
test("CSS dan modul: tanpa hex, tanpa px pada font, tanpa style=, tanpa toLocaleString", () => {
  const c = baca("public/sampah-energi.css");
  assert.doesNotMatch(c, /#[0-9a-f]{3,8}\b/i); assert.doesNotMatch(c, /font[^;{}]*\d+px/);
  for (const f of ["public/sampah-energi.html", ...TAB.map((k) => `public/swe_${k}.js`), "public/swe_umum.js", "public/sampah-energi.js"]) { const s = baca(f); assert.doesNotMatch(s, /\sstyle=/, f); assert.doesNotMatch(s, /toLocaleString/, f); }
});
test("tautan dua arah: menu, metode, cari, profil org, teknologi, topik, isu, program, energi baru", () => {
  assert.match(baca("public/inti/kepala.js"), /href: "\/sampah-energi"/);
  assert.match(baca("public/metode_halaman.js"), /id: "sampah-energi"/);
  assert.match(baca("scripts/pipa/indeks_cari.mjs"), /\["\/sampah-energi", "swe\.nav"\]/);
  assert.match(baca("public/tertaut.js"), /\/sampah-energi/);
  assert.match(baca("public/teknologi.js"), /"\/sampah-energi"/);
  assert.match(baca("public/topik_tampil.js"), /href="\/sampah-energi"/);
  assert.match(baca("public/isu_detail.js"), /\/sampah-energi\?tab=isu/);
  assert.match(baca("public/program.js"), /\/sampah-energi\?tab=kota/);
  assert.match(baca("public/energi-baru.js"), /\/sampah-energi\?tab=jalur/);
});
test("kamus id dan en memuat semua kunci swe.* (statis dan dinamis)", () => {
  const id = json("public/i18n/id.json"), en = json("public/i18n/en.json"), d = json("public/data/sampah_energi.json"), w = json("public/data/global/pemasok_wte.json"), hilang = [];
  const pakai = new Set(Object.keys(KAMUS));
  for (const f of [...TAB.map((x) => `public/swe_${x}.js`), "public/swe_umum.js", "public/sampah-energi.js", "public/sampah-energi.html"]) for (const m of baca(f).matchAll(/["`(](swe\.[a-z0-9_.\-]+)["`)]/g)) if (!m[1].endsWith(".")) pakai.add(m[1]);
  for (const x of d.jalur.jenis) pakai.add("swe.j.k." + x.k);
  for (const x of d.aturan.butir) pakai.add("swe.a.k." + x.k);
  for (const x of d.penolakan.butir) pakai.add("swe.i.k." + x.k);
  for (const x of d.program.tahap) pakai.add("swe.c.tahap." + x.k);
  for (const x of d.jalur.fasilitas) pakai.add("swe.st." + x.status);
  for (const h of w.hulu) pakai.add("swe.hulu." + h.segmen);
  for (const b of w.baris) { for (const x of b.teknologi || []) pakai.add("swe.tek." + x); for (const x of b.komponen || []) pakai.add("swe.komp." + x); }
  for (const k of pakai) if (!(k in id && k in en)) hilang.push(k);
  assert.deepEqual(hilang, []);
  for (const k of Object.keys(KAMUS)) { assert.doesNotMatch(id[k], /—|·/, k); assert.doesNotMatch(en[k], /—|·/, k); }
});
