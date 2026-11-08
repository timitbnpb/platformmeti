// Gerbang bertaut (aturan pemilik 8 Nov 2026): semua halaman bertaut. Modul inti/tautan.js dipakai halaman utama dan
// nama pemilik/penerbit/provinsi tidak dicetak dengan esc() langsung di daftar berkas yang disapu.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const baca = (f) => readFileSync(new URL("../public/" + f, import.meta.url), "utf8");

test("modul tautan mengekspor sembilan fungsi taut", () => {
  const s = baca("inti/tautan.js");
  for (const n of ["Proyek", "Org", "Orang", "Regulasi", "Provinsi", "Teknologi", "Program", "Event", "Dokumen"]) assert.match(s, new RegExp(`export const taut${n}\\b`), `taut${n}`);
});

// Halaman yang sudah memakai modul tautan (langsung atau lewat profil.js / terkaitHtml).
const PAKAI = ["profil.js", "p.js", "tek_ringkasan.js", "jejaring.js", "inti/komponen.js"];
for (const f of PAKAI) test(`memakai modul tautan: ${f}`, () => assert.match(baca(f), /\/inti\/tautan\.js"/));

// Profil dan detail wajib memasang panel Terkait.
const PANEL = ["o.js", "p.js", "wilayah_profil.js", "tek_ringkasan.js", "regulasi.js", "event_detail.js", "pustaka.js", "siaran-pers-rinci.js"];
for (const f of PANEL) test(`panel Terkait terpasang: ${f}`, () => assert.match(baca(f), /terkaitHtml\(/));

// Pola terlarang: nama pemilik/penerbit/provinsi dicetak dengan esc() tanpa taut. Pengecualian eksplisit (alasan wajib).
const POLA = /esc\([A-Za-z_.?]*(pemilik|instansi_penerbit|penerbit|provinsi|prov)\b[^)]*\)/g;
const SAPU = ["p.js", "o.js", "profil.js", "teknologi.js", "proyek.js", "regulasi.js", "pustaka.js", "kalender.js", "wilayah_profil.js"];
// Sisa nama polos yang sengaja dibiarkan: kartu/butir yang dirinya sudah <a>/<button> (tautan bersarang dilarang) atau label bukan entitas.
const KECUALI = new Map([
  ["proyek.js:esc(r.prov || \"-\")", "kartu proyek berupa tombol/tautan; tautan bersarang dilarang"],["profil.js:esc(prov)", "cadangan provHtml untuk nama provinsi tak dikenal (tak punya halaman)"]]);
for (const f of SAPU) {
  test(`tanpa nama pemilik/penerbit/provinsi polos: ${f}`, () => {
    const salah = (baca(f).match(POLA) || []).filter((m) => !KECUALI.has(`${f}:${m}`));
    assert.deepEqual(salah, []);
  });
}
