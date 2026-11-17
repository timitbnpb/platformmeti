// Uji ringkasan eksekutif nasional, pembanding /banding, dan kertas posisi Konsultasi (fungsi murni + gerbang hak tombol).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { bangun } from "../scripts/pipa/ringkasan_eksekutif.mjs";
import { pemenang, indeksPemimpin, bacaUrl, tulisUrl, csv, metrikProvinsi, metrikProyek, metrikOrganisasi, METRIK_PRO, KOMPONEN, MAKS } from "../public/banding_hitung.js";
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

test("pembanding proyek: angka dari sumber, tanpa konversi mata uang, tahun COD tidak dinilai", () => {
  const p = { id: "pj_x", nama: "PLTS Uji", teknologi: "surya", lokasi: { provinsi: "Bali" }, kapasitas: [{ nilai: 9, satuan: "ton/hari" }, { nilai: 50, satuan: "MWp" }],
    status: [{ nilai: "konstruksi" }], cod_target: [{ nilai: 2026 }, { nilai: 2028 }], nilai_investasi: [{ nilai: 5e9, satuan: "IDR" }, { nilai: 42500000, satuan: "USD" }],
    pihak: { pemilik: [{ nilai: "A" }, { nilai: "B" }, { nilai: "C" }] }, tingkat_bukti: "resmi", sumber: [{}, {}], program_ids: ["ruptl"] };
  const e = metrikProyek(p);
  assert.deepEqual(e.m, { mw: 50, investasi: 42.5, cod: 2028, program: 1, regulasi: 0, berita: 0, sumber: 2 });
  assert.deepEqual(e.teks, { teknologi: "surya", status: "konstruksi", provinsi: "Bali", pemilik: "A, B +1", bukti: "resmi" });
  assert.equal(metrikProyek({ ...p, cod_aktual: [{ nilai: 2025 }] }).m.cod, 2025);
  const kosong = metrikProyek({ id: "pj_y", nama: "Tanpa angka" });
  assert.equal(kosong.m.mw, null); assert.equal(kosong.m.investasi, null); assert.equal(kosong.m.cod, null); assert.equal(kosong.teks.pemilik, null);
  assert.equal(metrikProyek({ ...p, nilai_investasi: [{ nilai: 5e9, satuan: "IDR" }] }).m.investasi, null);
  assert.equal(metrikProyek(undefined), null);
  assert.ok(METRIK_PRO.find((m) => m.k === "cod").tahun);
  const u = bacaUrl("?m=pro&j=pj_0001,pj_0002");
  assert.deepEqual(u, { mode: "pro", ids: ["pj_0001", "pj_0002"] });
  assert.equal(tulisUrl(u), "?m=pro&j=pj_0001,pj_0002");
  assert.equal(bacaUrl("?m=aneh&p=11").mode, "prov");
  const nyata = baca("proyek.json").baris.map(metrikProyek);
  assert.ok(nyata.every((x) => x && x.id && x.nama));
});

test("pembanding pemasok per komponen (F65-102): hitungan dan TKDN tertinggi dari sertifikat, tanpa sertifikat = null bukan 0", () => {
  const o = { id: "p_x", nama: "Pabrik Uji" }, kosong = { proyek: [], orang: [], berita: [] };
  const tkdn = [{ pabrikan_org_id: "p_x", kategori: "modul", tkdn_persen: 41.2 }, { pabrikan_org_id: "p_x", kategori: "modul", tkdn_persen: 47.5 }, { pabrikan_org_id: "p_x", kategori: "baterai", tkdn_persen: 60 }, { pabrikan_org_id: "p_y", kategori: "modul", tkdn_persen: 99 }];
  const semua = metrikOrganisasi(o, { ...kosong, tkdn, komponen: "" }).m;
  assert.equal(semua.produk_tkdn, 3); assert.equal(semua.tkdn_maks, 60);
  const modul = metrikOrganisasi(o, { ...kosong, tkdn, komponen: "modul" }).m;
  assert.equal(modul.produk_tkdn, 2); assert.equal(modul.tkdn_maks, 47.5);
  const kabel = metrikOrganisasi(o, { ...kosong, tkdn, komponen: "kabel" }).m;
  assert.equal(kabel.produk_tkdn, 0); assert.equal(kabel.tkdn_maks, null);
  const tanpa = metrikOrganisasi(o, kosong).m;
  assert.equal(tanpa.produk_tkdn, null); assert.equal(tanpa.tkdn_maks, null);
  const u = bacaUrl("?m=org&o=p_x,p_y&k=modul");
  assert.equal(u.komponen, "modul"); assert.equal(tulisUrl(u), "?m=org&o=p_x,p_y&k=modul");
  assert.equal(bacaUrl("?m=org&o=p_x&k=<x>").komponen, undefined);
  assert.equal(bacaUrl("?m=prov&p=11&k=modul").komponen, undefined);
  const nyata = baca("tkdn_produk.json").baris;
  assert.deepEqual([...new Set(nyata.map((x) => x.kategori))].sort(), [...KOMPONEN].sort());
});
