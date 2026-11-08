// Modul /angin: data benih lolos periksa(), berkas terbit = keluaran skrip, sumber https, sembilan tab ada modulnya, tautan dua arah terpasang, CSS tanpa hex, kamus id+en lengkap.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { bangun, periksa, lcoe } from "../scripts/panen/angin_modul.mjs";

const baca = (f) => readFileSync(new URL("../" + f, import.meta.url), "utf8");
const json = (f) => JSON.parse(baca(f));
const TAB = ["potensi", "proyek", "rantai", "biaya", "lelang", "logistik", "kebijakan", "isu", "pemain"];

test("benih lolos periksa (id rujukan hidup di berkas asli)", () => assert.ok(periksa(bangun()).sumber > 30));
test("berkas terbit sama dengan keluaran skrip", () => assert.deepEqual(json("public/data/angin.json"), JSON.parse(JSON.stringify(bangun()))));
test("tiap sumber https atau berkas lokal, bukti dikenal, tanpa Antara", () => {
  for (const s of json("public/data/angin.json").sumber) {
    assert.match(s.url, /^https:\/\/|^\/data\//);
    assert.ok(["resmi", "media", "kajian", "via-pihak-ketiga", "editorial"].includes(s.tingkat_bukti), s.id);
    assert.doesNotMatch(s.url, /antaranews/, s.id);
  }
});
test("LCOE: rumus CRF cocok dengan hitungan tangan dan skenario tersimpan konsisten", () => {
  assert.equal(lcoe({ capex_usd_kw: 1000, opex_persen: 0, wacc: 0.0001, umur: 25, fk: 0.5 }), Math.round(((1000 / 25) / 87.6 / 0.5) * 100) / 100);
  for (const s of json("public/data/angin.json").biaya.skenario) assert.equal(s.lcoe_sen, lcoe(s), s.k);
  const k = Object.fromEntries(json("public/data/angin.json").biaya.skenario.map((s) => [s.k, s.lcoe_sen]));
  assert.ok(k.lepas_global > k.darat_global && k.darat_id_sidrap > k.darat_id_murah);
});
test("potensi lebih besar dari semua versi angka terpasang, 38 provinsi", () => {
  const P = json("public/data/angin.json").potensi;
  for (const x of P.terpasang_mw) assert.ok(x.nilai < P.darat_gw.nilai * 1000);
  assert.equal(P.provinsi.length, 38);
});
test("sembilan tab punya modul dengan mulai(), halaman, CSS, ikon, dan kunci tab di kerangka", () => {
  for (const k of TAB) { assert.match(baca(`public/ang_${k}.js`), /export (async )?function mulai\(/, k); assert.match(baca("public/angin.js"), new RegExp(`k: "${k}"`)); }
  for (const f of ["angin.html", "angin.css", "angin.js", "ang_umum.js"]) assert.ok(existsSync(new URL("../public/" + f, import.meta.url)), f);
  assert.match(baca("public/img/ikon.svg"), /id="i-angin"/);
});
test("CSS dan modul angin: tanpa hex, tanpa px pada font, tanpa style=, tanpa em dash", () => {
  const c = baca("public/angin.css");
  assert.doesNotMatch(c, /#[0-9a-f]{3,8}\b/i);
  assert.doesNotMatch(c, /font[^;{}]*\d+px/);
  for (const f of ["public/angin.html", ...TAB.map((k) => `public/ang_${k}.js`), "public/ang_umum.js", "public/angin.js", "public/angin.css", "scripts/panen/angin_modul.mjs"]) {
    assert.doesNotMatch(baca(f), /\sstyle=/, f);
    assert.doesNotMatch(baca(f), /[—·]/, f);
    assert.doesNotMatch(baca(f), /toLocaleString/, f);
  }
});
test("tautan dua arah: menu, metode, cari, profil org, teknologi, topik, isu, rantai global", () => {
  assert.match(baca("public/inti/rumah_tek.js"), /"\/angin"/); /* menu: modul tak lagi di menu, rumahnya hub /teknologi (rute-gabung.test.mjs) */
  assert.match(baca("public/metode_halaman.js"), /id: "angin"/);
  assert.match(baca("scripts/pipa/indeks_cari.mjs"), /\["\/angin", "ang\.nav"\]/);
  assert.match(baca("public/tertaut.js"), /\/angin/);
  assert.match(baca("public/inti/rumah_tek.js"), /"\/angin"/);
  assert.match(baca("public/topik_tampil.js"), /href="\/angin"/);
  assert.match(baca("public/isu_detail.js"), /\/angin\?tab=isu/);
  assert.match(baca("public/rantai-global.js"), /href="\/angin"/);
});
test("kamus id dan en memuat semua kunci t('ang.*') statis", () => {
  const id = json("public/i18n/id.json"), en = json("public/i18n/en.json"), hilang = [];
  for (const k of TAB.map((x) => `public/ang_${x}.js`).concat(["public/ang_umum.js", "public/angin.js", "public/angin.html"])) {
    for (const m of baca(k).matchAll(/["`(](ang\.[a-z0-9_.\-]+)["`)]/g)) if (!m[1].endsWith(".") && !(m[1] in id && m[1] in en)) hilang.push(m[1]);
  }
  assert.deepEqual(hilang, []);
});
test("kunci dinamis ang.* (status, komponen, peran, kasus, skenario) ada di kedua kamus", () => {
  const id = json("public/i18n/id.json"), en = json("public/i18n/en.json"), d = json("public/data/angin.json"), hilang = [];
  const pakai = [...d.rujukan.pembangkit_status_urut.map((s) => "ang.st." + s), ...d.rantai.komponen.map((c) => "ang.r.k." + c.k), ...d.rantai.komponen.flatMap((c) => c.subsegmen.map((s) => "ang.sub." + s)),
    ...d.pemain.flatMap((p) => p.peran.map((r) => "ang.peran." + r)), ...d.biaya.skenario.map((s) => "ang.b.s." + s.k), ...d.biaya.tarif_kasus.flatMap((x) => ["ang.b.tarif.", "ang.l.tarif.", "ang.l.skema."].map((p) => p + x.k)),
    ...d.lelang.tkdn.map((x) => "ang.l.tk." + x.k), ...d.logistik.kasus.map((x) => "ang.g.k." + x.k), ...d.kebijakan.poin.map((x) => "ang.k.p." + x.k), ...d.isu_baru.flatMap((x) => ["ang.i.b." + x.k, "ang.ist." + x.status]),
    ...d.potensi.target.map((x) => "ang.p.tg." + x.k), ...TAB.map((x) => "ang.tab." + x)];
  for (const k of pakai) if (!(k in id && k in en)) hilang.push(k);
  assert.deepEqual(hilang, []);
});
