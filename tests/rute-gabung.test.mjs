// Halaman yang digabung: tautan lama dialihkan 301 ke tab barunya (query dipertahankan, hash = tab aktif).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const src = readFileSync("src/worker.js", "utf8");
const peta = JSON.parse(src.match(/const ALIH_GABUNG = (\{[^}]*\});/)[1]);

test("ALIH_GABUNG memetakan halaman lama ke tab baru", () => {
  assert.deepEqual(peta, { "/kelayakan": "/investasi#hitung", "/event": "/kalender#daftar", "/video": "/galeri#video", "/podcast": "/galeri#sosmed", "/tender": "/proyek#tender", "/psn": "/program#psn", "/hukum": "/regulasi#hukum", "/pelacak-proyek": "/proyek#terpadu", "/proyek-besar": "/proyek#besar", "/proyek-berhenti": "/proyek#henti", "/energi-baru": "/transisi-pltu?tab=enb", "/transisi": "/target#transisi", "/strategi": "/target#strategi", "/rapor": "/target#rapor", "/ringkasan": "/insight#ringkasan", "/rantai": "/rantai-global?tab=tkdn", "/akademi": "/panduan#akademi", "/istilah": "/panduan#istilah", "/peluang": "/investasi#peluang", "/model-keuangan": "/investasi#model", "/keuangan-hijau": "/investasi#pembiayaan", "/harga-komponen": "/investasi#harga-komponen", "/biaya-listrik": "/investasi#biaya", "/lokasi-hijau": "/cek-lokasi#kawasan-hijau" });
});
test("alihan berstatus 301 dan mempertahankan query", () => {
  assert.match(src, /status: 301, headers: \{ location: ke \+ \(q\.size \? "\?" \+ q : ""\) \+ "#" \+ hash \}/);
  assert.match(src, /path === "\/sektor" && url\.searchParams\.has\("id"\)/);
});
test("halaman lama tidak lagi berkas statis; halaman gabungan memuat tabnya", () => {
  for (const f of ["kelayakan", "event", "video", "podcast", "tender", "psn", "hukum", "pelacak-proyek", "proyek-besar", "proyek-berhenti", "energi-baru", "transisi", "strategi", "rapor", "ringkasan", "rantai", "akademi", "istilah", "peluang", "model-keuangan", "keuangan-hijau", "harga-komponen", "biaya-listrik", "lokasi-hijau"]) assert.throws(() => readFileSync(`public/${f}.html`), /ENOENT/);
  assert.match(readFileSync("public/peluang_halaman.js", "utf8"), /"hitung"[\s\S]*"plts-atap"/);
  assert.match(readFileSync("public/kalender_halaman.js", "utf8"), /"daftar"[\s\S]*"arsip"/);
  assert.match(readFileSync("public/galeri_halaman.js", "utf8"), /"video"[\s\S]*"sosmed"/);
});

// Satu teknologi, satu rumah: /teknologi/<kode>, /topik?id=<x>, /pelacak?tek=<x> dialihkan 301 ke modul ujung ke ujung (src/alih_tek.js).
import { tujuanAlihTek, MODUL_TEK, MODUL_TOPIK, MODUL_PELACAK } from "../src/alih_tek.js";
import * as cermin from "../public/inti/rumah_tek.js";

test("alih teknologi: tiga pintu lama menuju modul", () => {
  const u = (s) => tujuanAlihTek(new URL("https://x" + s));
  assert.equal(u("/teknologi/surya"), "/surya?tab=ringkasan");
  assert.equal(u("/teknologi/bayu"), "/angin?tab=ringkasan");
  assert.equal(u("/teknologi/biomassa-sampah"), "/sampah-energi?tab=ringkasan");
  assert.equal(u("/teknologi/nuklir"), "/nuklir?tab=ringkasan");
  assert.equal(u("/topik?id=hidro"), "/hidro?tab=dasar");
  assert.equal(u("/topik?id=kendaraan-listrik"), "/baterai-ev?tab=dasar&topik=kendaraan-listrik");
  assert.equal(u("/pelacak?tek=plta"), "/hidro");
  assert.equal(u("/pelacak?tek=plts-terapung"), "/surya");
});
test("alih teknologi: yang tanpa modul tetap di tempatnya", () => {
  const u = (s) => tujuanAlihTek(new URL("https://x" + s));
  for (const s of ["/topik", "/topik?id=karbon", "/topik?id=efisiensi", "/pelacak", "/pelacak?tek=hibrida", "/pelacak?tek=efisiensi", "/teknologi", "/teknologi/tidak-ada", "/teknologi/constructor", "/topik?id=toString"]) assert.equal(u(s), null, s);
});
test("peta alih sisi Worker dan sisi layar sama", () => {
  assert.deepEqual(cermin.MODUL_TEK, MODUL_TEK);
  assert.deepEqual(cermin.MODUL_TOPIK, MODUL_TOPIK);
  assert.deepEqual(cermin.MODUL_PELACAK, MODUL_PELACAK);
  assert.equal(cermin.rumahTek("surya"), "/surya?tab=ringkasan");
  assert.equal(cermin.rumahTek("efisiensi"), "/teknologi/efisiensi");
  assert.equal(cermin.rumahTopik("bayu", 39), "/angin?tab=dasar#bab-39");
  assert.equal(cermin.rumahTopik("karbon"), "/topik?id=karbon");
});
test("menu tidak lagi memuat modul per teknologi; Teknologi tetap", () => {
  const kepala = readFileSync("public/inti/kepala.js", "utf8");
  const tab = kepala.slice(kepala.indexOf("const TAB = ["));
  for (const h of Object.values(MODUL_TEK)) assert.ok(!tab.includes(`href: "${h}"`), h);
  assert.ok(tab.includes('href: "/teknologi"'));
});
test("tiap modul bertab Ringkasan dan Dasar memuat tek_ringkasan / tek_dasar", () => {
  for (const [f, ada] of [["surya", 1], ["angin", 1], ["hidro", 1], ["panas-bumi", 1], ["bioenergi", 1], ["sampah-energi", 1], ["hidrogen", 1], ["baterai-ev", 1], ["transisi-pltu", 0]]) {
    const js = readFileSync(`public/${f}.js`, "utf8");
    assert.match(js, /k: "dasar"/, f);
    assert.equal(/k: "ringkasan"/.test(js), !!ada, f);
  }
});
test("tab gabungan baru terpasang di halaman induknya", () => {
  assert.match(readFileSync("public/proyek_tender.js", "utf8"), /"terpadu"[\s\S]*"besar"[\s\S]*"henti"/);
  assert.match(readFileSync("public/target_halaman.js", "utf8"), /"realisasi"[\s\S]*"transisi"[\s\S]*"strategi"[\s\S]*"rapor"/);
  assert.match(readFileSync("public/insight.js", "utf8"), /"ringkasan"/);
  assert.match(readFileSync("public/panduan.js", "utf8"), /"akademi"[\s\S]*"istilah"/);
  assert.match(readFileSync("public/rantai-global.js", "utf8"), /k: "tkdn"/);
  assert.match(readFileSync("public/transisi-pltu.js", "utf8"), /k: "enb"/);
});
