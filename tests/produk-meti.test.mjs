// Gerbang Produk METI: satu sumber data (public/data/produk_meti.json), tiap butir bertanggal dan bertautan sumber, tanpa butir posisi METI 23 ke atas,
// semua id topik hidup, komponen terpasang di halaman sasaran, masuk indeks cari.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { bangun, MAKS_BUTIR_PUBLIK, TEK_MASUKAN } from "../scripts/pipa/produk_meti.mjs";
import { bangunIndeks } from "../scripts/pipa/indeks_cari.mjs";

const baca = (f) => readFileSync(new URL("../" + f, import.meta.url), "utf8");
const json = (f) => JSON.parse(baca(f));
const D = json("public/data/produk_meti.json");
const JENIS = ["masukan", "roadmap", "siaran", "sikap", "profil"];
const HALAMAN = new Set(["beranda", "isu", "regulasi", "program", "teknologi", "bidang"]);

test("berkas terbit sama dengan keluaran pembangun (tanpa tangan)", () => assert.deepEqual(D, bangun()));

test("tiap butir: jenis sah, judul dua bahasa, tanggal, tautan sumber, tanpa em dash", () => {
  assert.ok(D.baris.length >= 5, "penjaga hijau-kosong");
  for (const p of D.baris) {
    assert.ok(JENIS.includes(p.jenis), p.id);
    assert.ok(p.judul.id && p.judul.en && p.ringkas.id && p.ringkas.en, p.id);
    assert.match(p.tanggal, /^\d{4}-\d{2}(-\d{2})?$/, p.id);
    assert.ok(p.tanggal <= "2026-11-09", `tanggal di masa depan: ${p.id}`);
    assert.ok(/^https:\/\//.test(p.sumber.url) || /^\/[a-z]/.test(p.sumber.url), `sumber: ${p.id}`);
    assert.ok(p.sumber.label, p.id);
    for (const h of p.halaman) assert.ok(HALAMAN.has(h), `${p.id}: halaman ${h}`);
  }
  assert.ok(new Set(D.baris.map((p) => p.id)).size === D.baris.length, "id ganda");
  assert.doesNotMatch(JSON.stringify(D), /[—·]/);
});

test("BATAS KERAS: posisi METI butir 23 ke atas tidak ada di data publik", () => {
  assert.equal(MAKS_BUTIR_PUBLIK, 22);
  const pub = json("data/konsultasi/posisi_meti_publik.json");
  assert.ok(Math.max(...pub.map((x) => x.no)) <= 22);
  const m = D.baris.find((p) => p.id === "masukan-ruu-ebet");
  assert.equal(m.butir, pub.length);
  assert.ok(m.butir <= 22);
  assert.ok(D.baris.every((p) => !("butir_teks" in p) && !Array.isArray(p.butir)), "butir tidak disalin, hanya jumlahnya");
  const s = JSON.stringify(D);
  // bila arsip lokal ada: tak satu pun teks butir 23+ boleh muncul
  const lokal = "data-panen/arsip-meti/posisi_meti.jsonl";
  if (existsSync(new URL("../" + lokal, import.meta.url)))
    for (const l of baca(lokal).trim().split("\n").map((x) => JSON.parse(x)).filter((x) => x.no >= 23)) {
      assert.ok(!s.includes(String(l.posisi_meti).slice(0, 40)), `butir ${l.no} bocor`);
      assert.ok(!s.includes(String(l.topik)), `topik butir ${l.no} bocor`);
    }
});

test("id topik hidup: isu, program, regulasi, teknologi, bidang", () => {
  const isu = new Set(json("public/data/isu.json").baris.map((x) => x.id));
  const prog = new Set(json("public/data/program_analisis.json").baris.map((x) => x.kode));
  const reg = new Set(json("public/data/regulasi.json").baris.map((x) => x.id));
  const tek = new Set(Object.keys(json("public/data/topik/ui.json").topik || {}).concat(["surya", "bayu", "hidro", "panas-bumi", "bioenergi", "biomassa-sampah", "penyimpanan", "hidrogen", "nuklir"]));
  const bidang = new Set([...baca("public/bidang.js").matchAll(/^\s{2}([a-z]+): \{ ikon:/gm)].map((m) => m[1]));
  assert.ok(bidang.has("advokasi") && bidang.has("komunikasi"), "pemindai bidang");
  const ada = { isu, program: prog, reg, tek, bidang };
  for (const p of D.baris) for (const x of p.terkait) assert.ok(ada[x.j]?.has(x.k), `${p.id}: ${x.j}:${x.k} tak ada`);
});

test("teknologi pada masukan RUU EBET beralasan: kata kuncinya ada di butir 1-22", () => {
  const pub = json("data/konsultasi/posisi_meti_publik.json");
  const m = D.baris.find((p) => p.id === "masukan-ruu-ebet");
  for (const x of m.terkait.filter((t) => t.j === "tek")) assert.ok(pub.some((b) => TEK_MASUKAN[x.k].test(b.topik + " " + b.posisi)), x.k);
});

test("sasaran komponen: RUU EBET di isu, regulasi, program, advokasi, beranda, dan modul teknologi", () => {
  const ada = (cek) => D.baris.some(cek);
  assert.ok(ada((p) => p.terkait.some((x) => x.j === "isu" && x.k === "ruu-ebet")));
  for (const h of ["regulasi", "program", "beranda"]) assert.ok(ada((p) => p.halaman.includes(h)), h);
  assert.ok(ada((p) => p.terkait.some((x) => x.j === "bidang" && x.k === "advokasi")));
  for (const k of ["hidrogen", "panas-bumi", "bayu", "bioenergi", "penyimpanan"]) assert.ok(ada((p) => p.terkait.some((x) => x.j === "tek" && x.k === k)), k);
});

test("komponen terpasang di halaman sasaran, dan /produk-meti ada di menu Tentang METI", () => {
  for (const f of ["isu_detail.js", "regulasi.js", "program.js", "tek_ringkasan.js", "bidang.js", "beranda.js"]) assert.match(baca("public/" + f), /pasangProdukTerkait\(/, f);
  assert.match(baca("public/inti/kepala.js"), /href: "\/produk-meti", kunci: "n7\.produk", ikon: "lencana"/);
  assert.match(baca("public/produk-meti.html"), /src="\/produk-meti\.js"/);
});

test("indeks cari memuat semua butir; metode halaman terdaftar", () => {
  const ix = bangunIndeks();
  assert.equal(ix.produk.length, D.baris.length);
  assert.ok(ix.produk.every((e) => e.u.startsWith("/produk-meti#pm-")));
  assert.match(baca("public/metode_halaman.js"), /id: "produk-meti"/);
  assert.match(baca("public/inti/cari_indeks.js"), /\["produk", "cari\.g\.produk"/);
});

test("hub /teknologi: satu daftar kartu foto + empat angka; kasus kosong tidak menampilkan tanda strip", () => {
  const s = baca("public/teknologi.js");
  for (const k of ["surya", "bayu", "hidro", "panas-bumi", "bioenergi", "biomassa-sampah", "penyimpanan", "hidrogen", "nuklir", "gas", "pltu"]) assert.match(s, new RegExp(`kode: "${k}"`), k);
  assert.match(s, /tk\.kt\.kosong/);
  assert.doesNotMatch(s, /: "-"/);
});
