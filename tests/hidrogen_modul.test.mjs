// Modul /hidrogen: data benih lolos periksa(), berkas terbit = keluaran skrip, rujukan tidak mati, sepuluh tab ada modulnya, tautan dua arah terpasang, CSS tanpa hex, tanpa style=.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { bangun, periksa } from "../scripts/panen/hidrogen.mjs";

const baca = (f) => readFileSync(new URL("../" + f, import.meta.url), "utf8");
const json = (f) => JSON.parse(baca(f));
const TAB = ["sumber", "elektroliser", "produksi", "turunan", "pemakaian", "ekspor", "biaya", "kebijakan", "dunia", "isu"];
const JS = TAB.map((x) => `public/h2_${x}.js`).concat(["public/h2_umum.js", "public/hidrogen.js"]);

test("benih lolos periksa (sumber, org_id, energi_baru, proyek, atlas, regulasi, pendanaan, pemasok)", () => assert.ok(periksa(bangun()).sumber > 40));
test("berkas terbit sama dengan keluaran skrip", () => assert.deepEqual(json("public/data/hidrogen.json"), JSON.parse(JSON.stringify(bangun()))));
test("tiap sumber https dan bertingkat bukti dikenal; tiap butir bertingkat bukti", () => {
  const d = json("public/data/hidrogen.json");
  for (const s of d.sumber) { assert.match(s.url, /^https:\/\//); assert.ok(["resmi", "media", "cuplikan", "via-pihak-ketiga", "kata-pihak"].includes(s.tingkat_bukti), s.id); }
  for (const l of d.lokasi) assert.ok(l.tingkat_bukti && l.sumber_id, l.id);
  for (const p of d.produksi) assert.ok(p.tingkat_bukti && p.sumber_id, p.id);
});
test("angka hitungan konsisten: Ulubelu 100 kg x 365 hari, sisa PLN, rentang efisiensi", () => {
  const d = json("public/data/hidrogen.json");
  assert.equal(d.produksi.find((p) => p.id === "ulubelu-pge").ton_tahun, 36.5);
  assert.ok(d.kunci.pln_ton_tahun > 128);
  for (const x of d.elektroliser.teknologi) assert.ok(x.kwh[0] <= x.kwh[1]);
  assert.ok(Math.abs(d.biaya.listrik.kwh_per_kg * 0.04 - 2.184) < 0.001);
});
test("sepuluh tab punya modul dengan mulai(), halaman, CSS, dan kunci tab di kerangka", () => {
  for (const k of TAB) { assert.match(baca(`public/h2_${k}.js`), /export (async )?function mulai\(/, k); assert.match(baca("public/hidrogen.js"), new RegExp(`k: "${k}"`)); }
  assert.ok(existsSync(new URL("../public/hidrogen.html", import.meta.url)) && existsSync(new URL("../public/hidrogen.css", import.meta.url)));
});
test("CSS dan JS hidrogen: tanpa hex, tanpa px pada font, tanpa style= tertanam", () => {
  const c = baca("public/hidrogen.css");
  assert.doesNotMatch(c, /#[0-9a-f]{3,8}\b/i);
  assert.doesNotMatch(c, /font[^;{}]*\d+px/);
  for (const f of JS.concat(["public/hidrogen.html"])) assert.doesNotMatch(baca(f), /\sstyle=/, f);
});
test("tautan dua arah: menu, metode, cari, profil org, teknologi, topik, energi baru, rantai global, ikon", () => {
  assert.match(baca("public/inti/rumah_tek.js"), /"\/hidrogen"/); /* menu: modul tak lagi di menu, rumahnya hub /teknologi (rute-gabung.test.mjs) */
  assert.match(baca("public/metode_halaman.js"), /id: "hidrogen"/);
  assert.match(baca("scripts/pipa/indeks_cari.mjs"), /\["\/hidrogen", "h2\.nav"\]/);
  assert.match(baca("public/tertaut.js"), /\/hidrogen/);
  assert.match(baca("public/inti/rumah_tek.js"), /"\/hidrogen"/);
  assert.match(baca("public/topik_tampil.js"), /href="\/hidrogen"/);
  assert.match(baca("public/tpl_enb.js"), /href="\/hidrogen"/);
  assert.match(baca("public/rantai-global.js"), /\/hidrogen/);
  assert.match(baca("public/img/ikon.svg"), /id="i-hidrogen"/);
});
test("kamus id dan en memuat semua kunci t('h2.*') statis", () => {
  const id = json("public/i18n/id.json"), en = json("public/i18n/en.json"), hilang = [];
  for (const k of JS.concat(["public/hidrogen.html"])) {
    for (const m of baca(k).matchAll(/["`(](h2\.[a-z0-9_.\-]+)["`)]/g)) if (!m[1].endsWith(".") && !(m[1] in id && m[1] in en)) hilang.push(m[1]);
  }
  assert.deepEqual(hilang, []);
});
test("kamus: kunci dinamis (tab, status, teknologi, jenis, kategori) lengkap di id dan en", () => {
  const id = json("public/i18n/id.json"), en = json("public/i18n/en.json"), d = json("public/data/hidrogen.json"), hilang = [];
  const perlu = [
    ...TAB.map((k) => "h2.tab." + k), ...d.elektroliser.teknologi.flatMap((x) => ["h2.el.k." + x.k, "h2.mat." + x.kematangan]), ...d.elektroliser.harga_iea.map((x) => "h2.el.h." + x.k),
    ...[...d.lokasi, ...d.produksi, ...d.dunia.proyek, ...d.turunan.rencana].map((x) => "h2.st." + x.status), ...d.lokasi.flatMap((l) => l.sumber_listrik.map((s) => "h2.tek." + s).concat(l.peran.map((p) => "h2.peran." + p))),
    ...d.turunan.rencana.map((r) => "h2.jenis." + r.jenis), ...d.isu.map((x) => "h2.kat." + x.kat), ...d.pemakaian.map((x) => "h2.m.k." + x.k), ...d.biaya.lcoh.map((x) => "h2.b.l." + x.k),
    ...d.biaya.lcoh.map((x) => "h2.bukti." + x.tingkat_bukti), ...d.kebijakan.fase.flatMap((f) => ["h2.k.f." + f.k, "h2.k.f." + f.k + ".ket"]), ...d.kebijakan.insentif.flatMap((x) => ["h2.k.ins." + x.k, "h2.k.s." + x.status]),
    ...d.kebijakan.linimasa.filter((x) => x.regulasi).map((x) => "h2.k.reg." + x.regulasi), ...["stack-elektroliser", "sistem-lengkap", "kompresor", "tangki", "transformator", "hvdc"].map((s) => "h2.el.sub." + s),
    ...Array.from({ length: 3 }, (_, i) => "h2.met.l" + (i + 1)), "h2.met.r1", "h2.met.r2", "h2.met.s1", "h2.met.b1", "h2.met.b2", ...["sumber", "elektroliser", "produksi", "turunan", "pemakaian", "ekspor", "dunia"].map((k) => "td.h2.p." + k),
  ];
  for (const k of perlu) if (!(k in id && k in en)) hilang.push(k);
  assert.deepEqual(hilang, []);
});
test("teks hidrogen tanpa em dash dan tiap pasangan id/en terisi", () => {
  const d = json("public/data/hidrogen.json");
  assert.doesNotMatch(JSON.stringify(d), /—|–/);
  const cek = (o, w) => { if (o && typeof o === "object") { if ("id" in o && "en" in o && Object.keys(o).length === 2) assert.ok(o.id && o.en, w); else for (const [k, v] of Object.entries(o)) cek(v, w + "." + k); } };
  cek(d, "d");
});
