import { test } from "node:test";
import assert from "node:assert/strict";
import { lokasiTeks, petaUrl, sumberTeks, namaPenyelenggara, gambarAcara } from "../public/kalender_fmt.js";

const kamus = { "arsip-meti": "Arsip kegiatan METI" };
const o = { nama: (l) => kamus[l] || "", diambil: (t) => `diambil ${t}` };

test("lokasi objek jadi teks, bukan [object Object]", () => {
  assert.equal(lokasiTeks({ tempat: "Auditorium PT PLN", kota: "Jakarta", negara: "Indonesia", lat: null }), "Auditorium PT PLN, Jakarta, Indonesia");
  assert.equal(lokasiTeks({ kota: "Jakarta", tempat: "" }), "Jakarta");
  assert.equal(lokasiTeks("Bali"), "Bali");
  assert.equal(lokasiTeks(null), "");
  assert.match(petaUrl({ kota: "Jakarta", lat: null, lon: null }), /google\.com\/maps.*Jakarta/);
  assert.match(petaUrl({ kota: "X", lat: -6.2, lon: 106.8 }), /openstreetmap.*mlat=-6.2&mlon=106.8/);
  assert.equal(petaUrl(undefined), "");
});
test("sumber: objek/larik, tanpa undefined", () => {
  assert.equal(sumberTeks({ label: "arsip-meti", tanggal: "2026-11-07" }, o), "Arsip kegiatan METI, diambil 2026-11-07");
  assert.equal(sumberTeks([{ label: "tak-dikenal", url: "https://www.contoh.id/a", tanggal_periksa: "2026-11-08" }], o), "contoh.id, diambil 2026-11-08");
  assert.equal(sumberTeks([], o), "");
  assert.equal(sumberTeks(undefined, o), "");
  assert.equal(sumberTeks({ label: "x" }, o), "");
});
test("penyelenggara dan gambar", () => {
  assert.deepEqual(namaPenyelenggara({ penyelenggara: ["METI", "METI", "IA ITB"], mitra: "PLN" }), ["METI", "IA ITB"]);
  assert.deepEqual(namaPenyelenggara({ mitra: "PLN" }), ["PLN"]);
  assert.deepEqual(namaPenyelenggara({ mitra: [] }), []);
  assert.equal(gambarAcara({ poster: { file: "/img/acara/a.webp" }, judul: "x" }), "/img/acara/a.webp");
  assert.equal(gambarAcara({ judul: "Forum PLTA hidro" }), "/img/beranda/hidro-saguling.webp");
  assert.equal(gambarAcara({ judul: "Rapat", poster: { file: "https://luar/x.jpg" } }), "");
});
