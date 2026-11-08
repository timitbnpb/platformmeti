// Modul /transisi-pltu: kurasi lolos periksa, berkas terbit = keluaran skrip, rujukan id hidup, sepuluh tab ada modulnya, tautan dua arah, CSS tanpa hex, kamus id dan en setara, hitungan pengganti.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { bangun } from "../scripts/panen/transisi_pltu.mjs";

const baca = (f) => readFileSync(new URL("../" + f, import.meta.url), "utf8");
const json = (f) => JSON.parse(baca(f));
const TAB = ["tambang", "armada", "emisi", "pensiun", "ganti", "cofiring", "pekerja", "dana", "kebijakan", "isu"];

test("kurasi lolos periksa (sumber, pltu, isu, regulasi hidup)", () => { const { galat } = bangun(); assert.deepEqual(galat, []); });
test("berkas terbit sama dengan keluaran skrip", () => assert.deepEqual(json("public/data/transisi_pltu.json"), JSON.parse(JSON.stringify(bangun().data))));
test("tiap sumber https dengan tingkat bukti dikenal; tiap angka menunjuk sumber", () => {
  const d = json("public/data/transisi_pltu.json"), ids = new Set(d.sumber.map((s) => s.id));
  for (const s of d.sumber) { assert.match(s.url, /^https:\/\//); assert.ok(["resmi", "media", "kajian", "kata-pihak", "via-pihak-ketiga"].includes(s.tingkat_bukti), s.id); }
  for (const x of [...d.tambang.produksi, ...d.pensiun.biaya, ...d.pekerja.faktor, ...d.pendanaan.angka]) assert.ok(ids.has(x.sumber_id), x.id || x.tahun);
});
test("pengganti: MW setara = MW x FK x bauran / FK EBT, label hipotesis, tiap pltu ada di pltu.json", () => {
  const d = json("public/data/transisi_pltu.json"), p = d.pengganti, pltu = new Set(json("public/data/pltu.json").baris.map((b) => b.id));
  assert.equal(p.param.tingkat_bukti, "hipotesis");
  for (const r of p.baris) {
    assert.ok(pltu.has(r.pid));
    const s = r.mw * p.param.fk_batubara * p.param.bauran.surya / p.param.fk_ebt.surya;
    assert.ok(Math.abs(r.sepadan_mw.surya - s) < 0.51, r.pid);
  }
  assert.equal(p.provinsi.reduce((a, x) => a + x.mw, 0), p.baris.reduce((a, x) => a + x.mw, 0));
});
test("biaya per MW dihitung dari total dan MW sumber", () => {
  for (const b of json("public/data/transisi_pltu.json").pensiun.biaya) {
    const k = b.usd_juta ? b.usd_juta / b.mw : (b.idr_triliun * 1000) / b.mw;
    assert.ok(Math.abs(b.per_mw_est.nilai - k) < 0.01, b.id);
  }
});
test("sepuluh tab punya modul dengan mulai(), halaman, CSS, dan terdaftar di kerangka", () => {
  for (const k of TAB) { assert.match(baca(`public/tpl_${k}.js`), /export (async )?function mulai\(/, k); assert.match(baca("public/transisi-pltu.js"), new RegExp(`k: "${k}"`)); }
  assert.ok(existsSync(new URL("../public/transisi-pltu.html", import.meta.url)) && existsSync(new URL("../public/transisi-pltu.css", import.meta.url)));
});
test("CSS transisi-pltu: tanpa hex dan tanpa px pada font; HTML tanpa style=", () => {
  const c = baca("public/transisi-pltu.css");
  assert.doesNotMatch(c, /#[0-9a-f]{3,8}\b/i);
  assert.doesNotMatch(c, /font[^;{}]*\d+px/);
  assert.doesNotMatch(baca("public/transisi-pltu.html").replace(/<meta name="theme-color"[^>]*>/, ""), /style=/);
});
test("tautan dua arah: menu, metode, cari, profil org, topik, energi-baru, industri, isu, ikon", () => {
  assert.match(baca("public/inti/kepala.js"), /href: "\/transisi-pltu"/);
  assert.match(baca("public/metode_halaman.js"), /id: "transisi-pltu"/);
  assert.match(baca("scripts/pipa/indeks_cari.mjs"), /\["\/transisi-pltu", "tpl\.nav"\]/);
  assert.match(baca("public/tertaut.js"), /\/transisi-pltu/);
  assert.match(baca("public/topik_tampil.js"), /\/transisi-pltu/);
  for (const h of ["energi-baru", "industri", "isu"]) assert.match(baca(`public/${h}.html`), /\/transisi-pltu/);
  assert.match(baca("public/img/ikon.svg"), /id="i-pltu"/);
});
test("kamus id dan en memuat semua kunci tpl.* statis", () => {
  const id = json("public/i18n/id.json"), en = json("public/i18n/en.json"), hilang = [];
  for (const k of TAB.map((x) => `public/tpl_${x}.js`).concat(["public/tpl_umum.js", "public/transisi-pltu.js", "public/transisi-pltu.html", "public/metode_halaman.js"])) {
    for (const m of baca(k).matchAll(/["`(](tpl\.[a-z0-9_.\-]+)["`)]/g)) if (!m[1].endsWith(".") && !(m[1] in id && m[1] in en) && !Object.keys(id).some((x) => x !== m[1] && x.startsWith(m[1]))) hilang.push(m[1]); // awalan dinamis (tpl.gn.k + n) dilewati
  }
  assert.deepEqual(hilang, []);
  for (const k of Object.keys(id)) if (k.startsWith("tpl.")) assert.ok(k in en, k);
});
