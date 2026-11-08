// Modul /nuklir: data benih lolos periksa(), berkas terbit = keluaran skrip, sumber https tanpa Antara, sepuluh tab punya modulnya, tautan dua arah, CSS tanpa hex, kamus id+en lengkap.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { bangun, periksa } from "../scripts/panen/nuklir_modul.mjs";

const baca = (f) => readFileSync(new URL("../" + f, import.meta.url), "utf8");
const json = (f) => JSON.parse(baca(f));
const TAB = ["rencana", "lembaga", "riset", "teknologi", "tapak", "bahan", "opini", "asean", "biaya", "selamat", "ringkasan", "dasar"];

test("benih lolos periksa (id rujukan hidup di berkas asli)", () => assert.ok(periksa(bangun()).sumber > 50));
test("berkas terbit sama dengan keluaran skrip", () => assert.deepEqual(json("public/data/nuklir.json"), JSON.parse(JSON.stringify(bangun()))));
test("tiap sumber https, bukti dikenal, tanpa Antara, tanpa em dash", () => {
  const d = json("public/data/nuklir.json");
  for (const s of d.sumber) {
    assert.match(s.url, /^https:\/\//);
    assert.ok(["resmi", "media", "kajian", "via-pihak-ketiga", "editorial"].includes(s.tingkat_bukti), s.id);
    assert.doesNotMatch(s.url, /antaranews/, s.id);
  }
  assert.doesNotMatch(JSON.stringify(d), /—|·/);
});
test("uranium nasional = Babel + Kalbar; persen survei 0-100; Barakah per kW masuk akal", () => {
  const d = json("public/data/nuklir.json"), u = Object.fromEntries(d.bahan.uranium.map((x) => [x.k, x.nilai]));
  assert.equal(u.nasional, u.babel + u.kalbar);
  for (const s of d.opini.survei) assert.ok(s.nilai > 0 && s.nilai <= 100, s.k);
  const kw = (d.biaya.barakah.kontrak_usd_miliar * 1e9) / (d.biaya.barakah.kapasitas_gw * 1e6);
  assert.ok(kw > 2000 && kw < d.biaya.smr_foak_usd_per_kw.min);
});
test("sepuluh tab punya modul dengan mulai(), halaman, CSS, ikon, dan kunci tab di kerangka", () => {
  for (const k of TAB.filter((x) => !["ringkasan", "dasar"].includes(x))) { assert.match(baca(`public/nkl_${k}.js`), /export (async )?function mulai\(/, k); assert.match(baca("public/nuklir.js"), new RegExp(`k: "${k}"`)); }
  for (const f of ["nuklir.html", "nuklir.css", "nuklir.js", "nkl_umum.js"]) assert.ok(existsSync(new URL("../public/" + f, import.meta.url)), f);
  assert.match(baca("public/img/ikon.svg"), /id="i-nuklir"/);
});
test("CSS dan modul nuklir: tanpa hex, tanpa px pada font, tanpa style=, tanpa toLocaleString", () => {
  const c = baca("public/nuklir.css");
  assert.doesNotMatch(c, /#[0-9a-f]{3,8}\b/i);
  assert.doesNotMatch(c, /font[^;{}]*\d+px/);
  for (const f of ["public/nuklir.html", ...TAB.filter((x) => !["ringkasan", "dasar"].includes(x)).map((k) => `public/nkl_${k}.js`), "public/nkl_umum.js", "public/nuklir.js"]) { const s = baca(f); assert.doesNotMatch(s, /\sstyle=/, f); assert.doesNotMatch(s, /toLocaleString/, f); assert.doesNotMatch(s, /—|·/, f); }
});
test("tautan dua arah: menu, metode, cari, profil org, teknologi, topik, energi baru, program, isu", () => {
  assert.match(baca("public/inti/rumah_tek.js"), /nuklir: "\/nuklir"/); // menu EBT -> /teknologi -> modul (rumah tunggal)
  assert.match(baca("public/metode_halaman.js"), /id: "nuklir"/);
  assert.match(baca("scripts/pipa/indeks_cari.mjs"), /\["\/nuklir", "nkl\.nav"\]/);
  assert.match(baca("public/tertaut.js"), /\/nuklir/);
  assert.match(baca("public/topik_tampil.js"), /href="\/nuklir"/);
  assert.match(baca("public/tpl_enb.js"), /href="\/nuklir"/);
  assert.match(baca("public/program.js"), /\/nuklir\?tab=rencana/);
  assert.match(baca("public/isu_detail.js"), /\/nuklir\?tab=opini/);
});
test("kamus id dan en memuat semua kunci t('nkl.*') statis dan dinamis", () => {
  const id = json("public/i18n/id.json"), en = json("public/i18n/en.json"), d = json("public/data/nuklir.json"), hilang = [];
  for (const k of TAB.filter((x) => !["ringkasan", "dasar"].includes(x)).map((x) => `public/nkl_${x}.js`).concat(["public/nkl_umum.js", "public/nuklir.js", "public/nuklir.html"])) {
    for (const m of baca(k).matchAll(/["`(:](nkl\.[a-z0-9_.\-]+)["`)]/g)) if (!m[1].endsWith(".") && !(m[1] in id && m[1] in en)) hilang.push(m[1]);
  }
  const dyn = [...TAB.map((x) => "nkl.tab." + x), ...d.rencana.angka.map((a) => "nkl.r.a." + a.k), ...d.lembaga.peta.flatMap((p) => p.peran.map((r) => "nkl.peran." + r)), ...d.lembaga.tahap_izin.map((x) => "nkl.l.th." + x.k),
    ...d.riset.reaktor.flatMap((r) => r.fungsi.map((f) => "nkl.fn." + f)), ...d.teknologi.vendor.flatMap((v) => ["nkl.st." + v.status, "nkl.jn." + v.jenis]), ...d.tapak.sorotan.map((x) => "nkl.st." + x.status), ...d.asean.negara.map((n) => "nkl.st." + n.status),
    ...d.bahan.uranium.map((x) => "nkl.b.k.u." + x.k), ...d.bahan.thorium.map((x) => "nkl.b.k.th." + x.k), ...d.opini.survei.map((s) => "nkl.o.s." + ({ batan2015: "nasional", den2024: "nasional", babel2023: "lokal", babel2025: "pengembang" })[s.k]), ...d.opini.persepsi.map((p) => "nkl.o.p." + p.k), ...d.opini.survei.map((s) => "nkl.o.k." + s.k)];
  for (const k of dyn) if (!(k in id && k in en)) hilang.push(k);
  assert.deepEqual([...new Set(hilang)], []);
});
