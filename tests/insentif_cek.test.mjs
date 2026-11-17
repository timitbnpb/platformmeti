// Uji pemeriksa insentif fiskal (F65-107): syarat hanya dari kolom data, tiga kelompok, tidak pernah "berhak".
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { TANYA, syaratDari, nilaiInsentif, kelompokkan } from "../public/inti/insentif_cek.js";

const baca = (f) => readFileSync(new URL("../public/" + f, import.meta.url), "utf8");
const D = JSON.parse(baca("data/insentif_fiskal.json"));
const cari = (id) => D.baris.find((r) => r.id === id);

test("tiap insentif di data terpetakan ke minimal satu pertanyaan, tanpa nilai teknologi asing", () => {
  for (const r of D.baris) {
    const s = syaratDari(r);
    assert.ok(s.kunci.length, r.id + " tanpa pertanyaan");
    assert.deepEqual(s.asing, [], r.id);
    for (const k of s.kunci) assert.ok(TANYA.includes(k));
  }
});

test("dasar syarat memang hanya judul: bila data mulai membaca teks, pemeriksa wajib ditinjau ulang", () => {
  assert.ok(D.baris.every((r) => r.basis_syarat === "judul"));
});

test("keterangan dalam kurung jadi catatan belum dinilai, bukan syarat", () => {
  const s = syaratDari(cari("if_tax_holiday"));
  assert.deepEqual(s.kunci, ["pembangkit", "industri"]);
  assert.deepEqual(s.catatan, ["bila termasuk sektor pionir"]);
});

test("nilai teknologi yang tak dikenal = perlu dicek, tidak ditebak", () => {
  const r = { status_berlaku: "berlaku", teknologi: ["reaktor fusi"] };
  assert.deepEqual(syaratDari(r).asing, ["reaktor fusi"]);
  assert.equal(nilaiInsentif(r, { pembangkit: true }).kelompok, "cek");
  assert.equal(nilaiInsentif({ status_berlaku: "berlaku", teknologi: [] }, {}).alasan, "tak_terpetakan");
});

test("tiga kelompok: cocok, beda, belum dijawab; aturan tidak berlaku selalu tidak memenuhi", () => {
  const pp78 = cari("if_tax_allowance_pp78");
  assert.equal(nilaiInsentif(pp78, {}).kelompok, "cek");
  assert.equal(nilaiInsentif(pp78, { pembangkit: false }).alasan, "belum_dijawab");
  assert.deepEqual(nilaiInsentif(pp78, { pembangkit: false, industri: true }), { kelompok: "ya", alasan: "kegiatan_cocok", cocok: ["industri"] });
  assert.equal(nilaiInsentif(pp78, { pembangkit: false, panas_bumi: false, industri: false }).alasan, "kegiatan_beda");
  assert.deepEqual(nilaiInsentif(cari("if_bea_masuk_154_2008"), { pembangkit: true }), { kelompok: "tidak", alasan: "tidak_berlaku", cocok: [] });
});

test("kelompokkan: jumlah tetap 14; jawaban kendaraan listrik saja", () => {
  const kosong = kelompokkan(D.baris, {});
  assert.equal(kosong.ya.length, 0);
  assert.equal(kosong.tidak.length, D.baris.filter((r) => r.status_berlaku !== "berlaku").length);
  assert.equal(kosong.ya.length + kosong.tidak.length + kosong.cek.length, D.baris.length);
  const kbl = kelompokkan(D.baris, { pembangkit: false, panas_bumi: false, industri: false, kbl: true });
  assert.equal(kbl.cek.length, 0);
  assert.deepEqual(kbl.ya.map((x) => x.r.id).sort(), D.baris.filter((r) => r.status_berlaku === "berlaku" && r.teknologi.includes("kendaraan listrik")).map((r) => r.id).sort());
});

test("teks layar tidak pernah menjanjikan hak", () => {
  for (const b of ["id", "en"]) {
    const j = JSON.parse(baca(`i18n/${b}.json`));
    const teks = Object.entries(j).filter(([k]) => k.startsWith("ic.")).map(([, v]) => v).join(" ");
    assert.ok(teks.length > 200, b + ": kunci ic. belum ada");
    assert.doesNotMatch(teks, /\bberhak\b|\beligible\b|\bentitled\b/i);
  }
});
