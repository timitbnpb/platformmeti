// Modul /surya: berkas terbit = keluaran pembangun (lolos periksa: sumber, rujukan id, jumlah kuota), angka kunci sesuai sumber, delapan tab ada modulnya,
// tautan dua arah terpasang, CSS tanpa hex dan tanpa px pada font, kamus id/en memuat semua kunci sur.*, tanpa em dash.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { bangun } from "../scripts/panen/surya_modul.mjs";
import { ringkas, HS } from "../scripts/panen/surya_modul_comtrade.mjs";

const baca = (f) => readFileSync(new URL("../" + f, import.meta.url), "utf8");
const json = (f) => JSON.parse(baca(f));
const TAB = { bahan: "bahan", rantai: "rantai", proyek: "proyek", potensi: "potensi", biaya: "biaya", kebijakan: "kebijakan", daur: "daur", isu: "isu" };
const lengkap = () => ({ org: json("public/data/organisasi.json"), regulasi: json("public/data/regulasi.json"), proyek: json("public/data/proyek.json"), pabrikDunia: json("public/data/global/pabrik_dunia.json"), neraca: json("public/data/global/neraca_pasokan.json"), benchmark: json("public/data/global/benchmark_harga.json"), kebijakan: json("public/data/global/kebijakan_dagang.json"), biaya: json("public/data/biaya_bangun.json"), program: json("public/data/program_analisis.json") });

test("pembangun tanpa galat: semua id rujukan ada di berkas sumbernya", () => assert.deepEqual(bangun(lengkap()).galat, []));
test("berkas terbit sama dengan keluaran pembangun", () => assert.deepEqual(json("public/data/surya_modul.json"), JSON.parse(JSON.stringify(bangun(lengkap()).data))));
test("tiap sumber https, bertingkat bukti dikenal, bertanggal ambil", () => {
  for (const s of json("public/data/surya_modul.json").sumber) { assert.match(s.url, /^https:\/\//); assert.ok(["resmi", "kajian", "media", "est", "hipotesis"].includes(s.tingkat_bukti), s.id); assert.match(s.tanggal_ambil, /^\d{4}-\d{2}-\d{2}$/); }
});
test("kuota PLTS atap per klaster: 11 klaster, lima tahun, jumlah sesuai Tabel 1 (901, 1.004, 1.065, 1.183, 1.593 MW)", () => {
  const a = json("public/data/surya_modul.json").atap;
  assert.equal(a.klaster.length, 11);
  assert.deepEqual(a.jumlah, [901, 1004, 1065, 1183, 1593]);
  a.tahun.forEach((_, i) => assert.ok(Math.abs(a.klaster.reduce((x, k) => x + k.mw[i], 0) - a.jumlah[i]) <= 1.5));
  assert.equal(a.klaster.find((k) => k.k === "jamali").mw[0], 825);
});
test("realisasi atap naik menurut tanggal, tiap titik bersumber; kuota Januari 2026 = tunggu + sisa (selisih sumber maks 2 MW)", () => {
  const a = json("public/data/surya_modul.json").atap, k = a.kuota_2026_januari;
  assert.ok(a.realisasi.length >= 5 && a.realisasi.every((r, i, l) => !i || (r.tanggal > l[i - 1].tanggal && r.mw >= l[i - 1].mw)));
  assert.ok(Math.abs(k.daftar_tunggu_mw + k.sisa_mw - k.dibuka_mw) <= 2); // sumber sendiri berselisih 2 MW, dicatat di kurasi
});
test("program 100 GW: 20 + 80 = 100, tender PLN berjumlah 1.225 MW, tanpa target tahunan resmi", () => {
  const p = json("public/data/surya_modul.json").program;
  assert.equal(p.struktur.reduce((a, s) => a + s.gw, 0), p.target.gw);
  assert.equal(p.tender_pln.wilayah.reduce((a, w) => a + w.mw, 0), p.tender_pln.mw_total);
  assert.equal(p.target.target_tahunan_resmi, null);
});
test("bahan baku: ekspor tidak ditaksir, Comtrade HS 250510 terdaftar", () => {
  const b = json("public/data/surya_modul.json").bahan;
  assert.equal(b.ekspor.status, "tidak-ditemukan");
  assert.ok("250510" in HS && Array.isArray(ringkas("/tidak/ada/")));
});
test("tanpa em dash atau en dash di data dan kamus sur.*", () => {
  assert.ok(!/[–—]/.test(baca("public/data/surya_modul.json")));
  for (const b of ["id", "en"]) for (const [k, v] of Object.entries(json(`public/i18n/${b}.json`))) if (k.startsWith("sur.")) assert.ok(!/[–—]/.test(v), k);
});
test("delapan tab punya modul dengan mulai(), halaman dan CSS ada", () => {
  for (const k of Object.keys(TAB)) { assert.match(baca(`public/sy_${k}.js`), /export (async )?function mulai\(/, k); assert.match(baca("public/surya.js"), new RegExp(`k: "${k}"`)); assert.match(baca("public/sy_tab.js"), new RegExp(`${k}: "/sy_${k}.js"`)); }
  assert.ok(existsSync(new URL("../public/surya.html", import.meta.url)) && existsSync(new URL("../public/surya.css", import.meta.url)));
});
test("CSS surya dan HTML: tanpa hex, tanpa px pada font, tanpa style=", () => {
  const c = baca("public/surya.css");
  assert.doesNotMatch(c, /#[0-9a-f]{3,8}\b/i);
  assert.doesNotMatch(c, /font[^;{}]*\d+px/);
  assert.doesNotMatch(baca("public/surya.html"), /\sstyle=/);
  for (const f of ["surya", "sy_umum", "sy_tab", ...Object.keys(TAB).map((k) => "sy_" + k), "sy_program"]) assert.doesNotMatch(baca(`public/${f}.js`), /\sstyle="|\.style\./, f);
});
test("tautan dua arah: menu, metode, cari, profil org, program, teknologi, topik, rantai global, ikon unik", () => {
  assert.match(baca("public/inti/rumah_tek.js"), /"\/surya"/); /* menu: modul tak lagi di menu, rumahnya hub /teknologi (rute-gabung.test.mjs) */
  assert.match(baca("public/metode_halaman.js"), /id: "surya"/);
  assert.match(baca("scripts/pipa/indeks_cari.mjs"), /\["\/surya", "sur\.nav"\]/);
  assert.match(baca("public/tertaut.js"), /\/surya/);
  assert.match(baca("public/program.js"), /\/surya/);
  assert.match(baca("public/inti/rumah_tek.js"), /"\/surya"/);
  assert.match(baca("public/topik_tampil.js"), /href="\/surya"/);
  assert.match(baca("public/rantai-global.js"), /\/surya/);
  assert.match(baca("public/img/ikon.svg"), /id="i-panel-surya"/);
  assert.equal((baca("public/img/ikon.svg").match(/id="i-panel-surya"/g) || []).length, 1);
});
test("kamus id dan en memuat semua kunci t('sur.*') statis dan tab dinamis", () => {
  const id = json("public/i18n/id.json"), en = json("public/i18n/en.json"), hilang = [];
  const berkas = Object.keys(TAB).map((k) => `public/sy_${k}.js`).concat(["public/sy_umum.js", "public/sy_program.js", "public/surya.js", "public/surya.html", "public/tertaut.js"]);
  for (const f of berkas) for (const m of baca(f).matchAll(/["`(](sur\.[a-z0-9_.\-]+)["`)]/g)) if (!m[1].endsWith(".") && !(m[1] in id && m[1] in en)) hilang.push(m[1]);
  for (const k of Object.keys(TAB)) for (const kk of ["sur.tab." + k]) if (!(kk in id && kk in en)) hilang.push(kk);
  assert.deepEqual(hilang, []);
});
