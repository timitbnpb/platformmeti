// Modul /hidro: data benih lolos periksa(), berkas terbit = keluaran skrip, sumber https, sembilan tab ada modulnya, LCOE benar, tautan dua arah, CSS tanpa hex, kamus id+en lengkap.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { bangun, periksa } from "../scripts/panen/hidro_modul.mjs";
import { crf, lcoe, kelasMw } from "../public/hdr_hitung.js";

const baca = (f) => readFileSync(new URL("../" + f, import.meta.url), "utf8");
const json = (f) => JSON.parse(baca(f));
const TAB = ["potensi", "pembangkit", "pumped", "bendungan", "ruptl", "biaya", "pemasok", "pendanaan", "isu"];
const JS = TAB.map((k) => `public/hdr_${k}.js`).concat(["public/hdr_umum.js", "public/hdr_hitung.js", "public/hidro.js"]);

test("benih lolos periksa (id rujukan hidup di berkas asli)", () => assert.ok(periksa(bangun()).sumber > 30));
test("berkas terbit sama dengan keluaran skrip", () => assert.deepEqual(json("public/data/hidro.json"), JSON.parse(JSON.stringify(bangun()))));
test("tiap sumber https, bukti dikenal, tanpa Antara, id unik", () => {
  const S = json("public/data/hidro.json").sumber, ids = new Set(S.map((s) => s.id));
  assert.equal(ids.size, S.length);
  for (const s of S) {
    assert.match(s.url, /^https:\/\//);
    assert.ok(["resmi", "media", "kajian", "via-pihak-ketiga", "editorial"].includes(s.tingkat_bukti), s.id);
    assert.doesNotMatch(s.url, /antaranews/, s.id);
  }
});
test("potensi lebih besar dari semua versi angka terpasang; celah ditulis", () => {
  const d = json("public/data/hidro.json");
  for (const x of d.sumber_daya.terpasang_mw) assert.ok(x.nilai < d.sumber_daya.potensi_mw[0].nilai);
  assert.ok(d.celah.length >= 5);
});
test("LCOE: CRF dan kasus tengah IRENA (capex 2.267, CF 48%, WACC 8%, 40 th) mendekati 57 US$/MWh", () => {
  assert.ok(Math.abs(crf(8, 40) - 0.0839) < 0.0005);
  assert.ok(Math.abs(crf(0, 40) - 0.025) < 1e-9);
  const v = lcoe({ capex: 2267, cf: 48, opexPct: 2, wacc: 8, umur: 40 });
  assert.ok(v > 52 && v < 62, String(v));
  assert.ok(lcoe({ capex: 2267, cf: 48, opexPct: 2, wacc: 12, umur: 40 }) > v);
  assert.equal(kelasMw(10), "besar"); assert.equal(kelasMw(9.9), "mini"); assert.equal(kelasMw(null), "x");
});
test("sembilan tab punya modul dengan mulai(), halaman, CSS, ikon, dan kunci tab di kerangka", () => {
  for (const k of TAB) { assert.match(baca(`public/hdr_${k}.js`), /export (async )?function mulai\(/, k); assert.match(baca("public/hidro.js"), new RegExp(`k: "${k}"`)); }
  for (const f of ["hidro.html", "hidro.css", "hidro.js", "hdr_umum.js"]) assert.ok(existsSync(new URL("../public/" + f, import.meta.url)), f);
  assert.match(baca("public/img/ikon.svg"), /id="i-hidro"/);
  assert.match(baca("public/hidro.html"), /rg3-tab/);
});
test("CSS dan modul hidro: tanpa hex, tanpa px pada font, tanpa style=, tanpa em dash, tanpa toLocaleString", () => {
  const c = baca("public/hidro.css");
  assert.doesNotMatch(c, /#[0-9a-f]{3,8}\b/i);
  assert.doesNotMatch(c, /font[^;{}]*\d+px/);
  for (const f of ["public/hidro.html", ...JS, "scripts/panen/hidro_modul.mjs"]) { const s = baca(f); assert.doesNotMatch(s, /\sstyle=/, f); assert.doesNotMatch(s, /—/, f); assert.doesNotMatch(s, /toLocaleString/, f); }
});
test("tautan dua arah: menu, metode, cari, profil org, teknologi, topik, isu, air-energi", () => {
  assert.match(baca("public/inti/rumah_tek.js"), /"\/hidro"/); /* menu: modul tak lagi di menu, rumahnya hub /teknologi (rute-gabung.test.mjs) */
  assert.match(baca("public/metode_halaman.js"), /id: "hidro"/);
  assert.match(baca("scripts/pipa/indeks_cari.mjs"), /\["\/hidro", "hdr\.nav"\]/);
  assert.match(baca("public/tertaut.js"), /\/hidro/);
  assert.match(baca("public/inti/rumah_tek.js"), /"\/hidro"/);
  assert.match(baca("public/topik_tampil.js"), /href="\/hidro"/);
  assert.match(baca("public/isu_detail.js"), /\/hidro\?tab=isu/);
  assert.match(baca("public/air-energi.js"), /href="\/hidro"/);
});
test("kamus id dan en memuat semua kunci t('hdr.*') statis", () => {
  const id = json("public/i18n/id.json"), en = json("public/i18n/en.json"), hilang = [];
  for (const f of JS.concat(["public/hidro.html"])) for (const m of baca(f).matchAll(/["`(](hdr\.[a-z0-9_.\-]+)["`)]/g)) if (!m[1].endsWith(".") && !(m[1] in id && m[1] in en)) hilang.push(m[1]);
  assert.deepEqual([...new Set(hilang)], []);
});
test("kunci dinamis hdr.* (status, kelas, sub, jenis, bendungan) ada di kedua kamus", () => {
  const id = json("public/i18n/id.json"), en = json("public/i18n/en.json"), d = json("public/data/hidro.json"), hilang = [];
  const pl = json("public/data/global/pemasok_lain.json").baris.filter((b) => (b.segmen || []).includes("hidro")).flatMap((b) => b.subsegmen);
  const pakai = [...d.rujukan.status_urut.map((s) => "hdr.st." + s), ...["besar", "mini", "x"].map((k) => "hdr.kelas." + k), ...pl.map((s) => "hdr.sub." + s), ...d.bendungan.angka.map((x) => "hdr.b.k." + x.k),
    ...d.isu.baru.map((x) => "hdr.jn." + x.jenis), ...["gem", "ruptl", "x"].map((k) => "hdr.sj." + k), ...["berlaku", "diubah", "dicabut"].map((k) => "hdr.rst." + k), ...TAB.map((k) => "hdr.tab." + k), "td.ey.hdr", "td.hdr.p.pemilik", "td.hdr.p.pemasok", "td.hdr.p.kontraktor", "td.hdr.p.pendana", "hdr.nav", "hdr.met.l4", "hdr.met.r2", "hdr.met.s1", "hdr.met.b3"];
  for (const k of pakai) if (!(k in id && k in en)) hilang.push(k);
  assert.deepEqual([...new Set(hilang)], []);
});
