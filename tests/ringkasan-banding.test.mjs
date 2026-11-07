// Uji ringkasan eksekutif nasional, pembanding /banding, dan kertas posisi Konsultasi (fungsi murni + gerbang hak tombol).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { bangun } from "../scripts/pipa/ringkasan_eksekutif.mjs";
import { pemenang, indeksPemimpin, bacaUrl, tulisUrl, csv, metrikProvinsi, MAKS } from "../public/banding_hitung.js";
import { susunKertas, cocokRegulasi } from "../public/konsultasi_kertas.js";

const baca = (f) => JSON.parse(readFileSync(new URL("../public/data/" + f, import.meta.url), "utf8"));

test("ringkasan: 8 angka bersumber, temuan 3-5, tanpa angka tanpa sumber", () => {
  const D = { target: baca("target.json"), proyek: baca("proyek.json").baris, regulasi: baca("regulasi.json").baris, kerja: baca("kerja.json"), harga: baca("harga_komponen.json"), ember: baca("ember_bulanan.json"), pendanaan: baca("pendanaan.json"), wilayah: baca("wilayah.json"), riwayat: { hari: 30, jumlah_total: 0, per: {} }, rapor: null };
  const r = bangun(D, "2026-11-08");
  assert.equal(r.angka.length, 8);
  for (const a of r.angka) { assert.ok(Number.isFinite(a.nilai), a.kode); assert.ok(a.sumber.judul && a.tingkat, a.kode + " tanpa sumber"); }
  assert.ok(r.temuan.length >= 3 && r.temuan.length <= 5);
  assert.equal(r.angka.find((a) => a.kode === "kerja").est, true);
});

test("pemenang: tertinggi, seri semua, butuh dua nilai", () => {
  assert.deepEqual(pemenang([1, 5, 3]), [1]);
  assert.deepEqual(pemenang([5, 5, 3]), [0, 1]);
  assert.deepEqual(pemenang([4, 4]), []);
  assert.deepEqual(pemenang([null, 7]), []);
  assert.deepEqual(indeksPemimpin([50, 100, null]), [50, 100, null]);
});

test("url berbagi bolak-balik dan dibatasi", () => {
  const u = bacaUrl("?m=prov&p=11,32,12,13,14,<x>");
  assert.equal(u.ids.length, MAKS); assert.ok(!u.ids.includes("<x>"));
  assert.equal(tulisUrl({ mode: "org", ids: ["a", "b"] }), "?m=org&o=a,b");
  assert.deepEqual(bacaUrl("?m=org&o=a,b"), { mode: "org", ids: ["a", "b"] });
  assert.match(csv([["a", 'b"c']]), /^﻿"a";"b""c"/);
});

test("metrikProvinsi dari data nyata: Jawa Barat berisi, nilai kosong null", () => {
  const D = { wilayah: baca("wilayah.json"), indeks: baca("indeks.json"), radar: baca("radar_kabupaten.json"), rued: baca("rued_capaian.json"), peluang: baca("peluang.json"), berita: { baris: [{ judul: "PLTS di Jawa Barat" }] } };
  const e = metrikProvinsi("32", D);
  assert.ok(e.m.terpasang > 0 && e.m.proyek > 0 && e.m.kesiapan > 0);
  assert.equal(e.m.berita, 1);
  assert.equal(metrikProvinsi("99", D), null);
});

test("kertas posisi: tanggapan tersembunyi dan butir internal tidak ikut, nama tidak dicetak", () => {
  const d = { dokumen: { bentuk: "butir", judul: "X" }, bagian: [
    { id: 1, tingkat: "butir", nomor: "1", judul: "Satu", teks: "usulan", rujukan: "UU 30/2007", status_asal: "Prioritas" },
    { id: 2, tingkat: "butir", nomor: "2", judul: "Dua", teks: "rahasia", status_asal: "Internal" }],
  utas: [
    { id: 1, bagian_id: 1, jenis: "umum", isi: "[setuju] dukungan penuh dari anggota", dukung: 2, nama: "Budi" },
    { id: 2, bagian_id: 1, jenis: "ubah", isi: "alasan perubahan yang panjang sekali", dukung: 3, tersembunyi: true },
    { id: 3, bagian_id: 2, jenis: "umum", isi: "komentar butir internal yang panjang", dukung: 0 }] };
  const k = susunKertas(d, [{ id: "uu-30-2007", jenis: "uu", nomor: "30", tahun: 2007, judul: "UU Energi", url_sumber: "https://x.id" }]);
  assert.equal(k.length, 1);
  assert.equal(k[0].setuju, 1); assert.equal(k[0].usul, 0); assert.equal(k[0].dukungan, 3);
  assert.ok(!JSON.stringify(k).includes("Budi"));
  assert.equal(k[0].regs[0].id, "uu-30-2007");
  assert.deepEqual(cocokRegulasi("tanpa rujukan", []), []);
});

test("tombol kertas posisi hanya untuk staf (hak) dan tanpa rute baru", () => {
  const s = readFileSync(new URL("../public/konsultasi_naskah.js", import.meta.url), "utf8");
  assert.match(s, /\$\{staf\(\) \? `<button[^`]*data-m="kertas"/);
  assert.match(s, /if \(m === "kertas"\) \{ if \(!staf\(\)\) return;/);
});
