// Modul /panas-bumi: data benih lolos periksa(), berkas terbit = keluaran skrip, sumber https, sembilan tab ada modulnya, tautan dua arah terpasang, CSS tanpa hex, kamus id+en lengkap.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { bangun, periksa } from "../scripts/panen/panas_bumi_modul.mjs";

const baca = (f) => readFileSync(new URL("../" + f, import.meta.url), "utf8");
const json = (f) => JSON.parse(baca(f));
const TAB = ["sumber", "eksplorasi", "pembangkit", "teknologi", "ppa", "langsung", "pemain", "kebijakan", "isu"];

test("benih lolos periksa (id rujukan hidup di berkas asli)", () => assert.ok(periksa(bangun()).sumber > 30));
test("berkas terbit sama dengan keluaran skrip", () => assert.deepEqual(json("public/data/panas_bumi.json"), JSON.parse(JSON.stringify(bangun()))));
test("tiap sumber https atau berkas lokal, bukti dikenal, tanpa Antara", () => {
  for (const s of json("public/data/panas_bumi.json").sumber) {
    assert.match(s.url, /^https:\/\/|^\/data\//);
    assert.ok(["resmi", "media", "kajian", "via-pihak-ketiga", "editorial"].includes(s.tingkat_bukti), s.id);
    assert.doesNotMatch(s.url, /antaranews/, s.id);
  }
});
test("harga patokan: 8 kelas, makin besar kapasitas makin murah, tahun 11-30 tidak lebih mahal", () => {
  const h = json("public/data/panas_bumi.json").ppa.harga_patokan;
  assert.equal(h.length, 8);
  for (const v of ["listrik", "uap"]) { const k = h.filter((r) => r.varian === v); for (let i = 1; i < k.length; i++) assert.ok(k[i].tahun1_10 < k[i - 1].tahun1_10, v); for (const r of k) assert.ok(r.tahun11_30 <= r.tahun1_10); }
});
test("potensi lebih besar dari semua versi angka terpasang", () => {
  const S = json("public/data/panas_bumi.json").sumber_daya;
  for (const x of S.terpasang_mw) assert.ok(x.nilai < S.potensi_mw[0].nilai);
});
test("sembilan tab punya modul dengan mulai(), halaman, CSS, ikon, dan kunci tab di kerangka", () => {
  for (const k of TAB) { assert.match(baca(`public/pbm_${k}.js`), /export (async )?function mulai\(/, k); assert.match(baca("public/panas-bumi.js"), new RegExp(`k: "${k}"`)); }
  for (const f of ["panas-bumi.html", "panas-bumi.css", "panas-bumi.js", "pbm_umum.js"]) assert.ok(existsSync(new URL("../public/" + f, import.meta.url)), f);
  assert.match(baca("public/img/ikon.svg"), /id="i-panas-bumi"/);
});
test("CSS dan modul panas bumi: tanpa hex, tanpa px pada font, tanpa style=", () => {
  const c = baca("public/panas-bumi.css");
  assert.doesNotMatch(c, /#[0-9a-f]{3,8}\b/i);
  assert.doesNotMatch(c, /font[^;{}]*\d+px/);
  for (const f of ["public/panas-bumi.html", ...TAB.map((k) => `public/pbm_${k}.js`), "public/pbm_umum.js", "public/panas-bumi.js"]) assert.doesNotMatch(baca(f), /\sstyle=/, f);
});
test("tautan dua arah: menu, metode, cari, profil org, teknologi, topik, isu", () => {
  assert.match(baca("public/inti/kepala.js"), /href: "\/panas-bumi"/);
  assert.match(baca("public/metode_halaman.js"), /id: "panas-bumi"/);
  assert.match(baca("scripts/pipa/indeks_cari.mjs"), /\["\/panas-bumi", "pbm\.nav"\]/);
  assert.match(baca("public/tertaut.js"), /\/panas-bumi/);
  assert.match(baca("public/teknologi.js"), /"\/panas-bumi"/);
  assert.match(baca("public/topik_tampil.js"), /href="\/panas-bumi"/);
  assert.match(baca("public/isu_detail.js"), /\/panas-bumi\?tab=isu/);
});
test("kamus id dan en memuat semua kunci t('pbm.*') statis", () => {
  const id = json("public/i18n/id.json"), en = json("public/i18n/en.json"), hilang = [];
  for (const k of TAB.map((x) => `public/pbm_${x}.js`).concat(["public/pbm_umum.js", "public/panas-bumi.js", "public/panas-bumi.html"])) {
    for (const m of baca(k).matchAll(/["`(](pbm\.[a-z0-9_.\-]+)["`)]/g)) if (!m[1].endsWith(".") && !(m[1] in id && m[1] in en)) hilang.push(m[1]);
  }
  assert.deepEqual(hilang, []);
});
test("kunci dinamis pbm.* (status, jasa, peran, varian) ada di kedua kamus", () => {
  const id = json("public/i18n/id.json"), en = json("public/i18n/en.json"), d = json("public/data/panas_bumi.json"), hilang = [];
  const pakai = [...["beroperasi", "konstruksi", "izin", "rencana", "ditunda", "tidak-diketahui", "dibatalkan"].map((s) => "pbm.st." + s), ...d.eksplorasi.risiko.map((r) => "pbm.e.r." + r.k).filter((k) => !/pengembangan|operasi$/.test(k) && !/sukses_(pengembangan|operasi)/.test(k)),
    ...d.teknologi.jenis.map((x) => "pbm.t.k." + x.k), ...d.langsung.butir.map((x) => "pbm.l.k." + x.k), ...d.pemain.flatMap((p) => p.peran.map((r) => "pbm.peran." + r)), ...d.eksplorasi.pemasok_subsegmen.concat(d.teknologi.pemasok_subsegmen).map((s) => "pbm.sub." + s), ...["listrik", "uap"].map((v) => "pbm.h.v." + v), ...TAB.map((x) => "pbm.tab." + x)];
  for (const k of pakai) if (!(k in id && k in en)) hilang.push(k);
  assert.deepEqual(hilang, []);
});
