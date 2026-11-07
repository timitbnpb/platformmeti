/* Gerbang: kepala halaman seragam. Tiap public/*.html ber-<h1> membungkusnya dalam kelas kepala standar (.jm-kh),
   bukan teks telanjang di latar. Juga: tidak ada .jm-judul / .brt-angka telanjang (judul+lead+deret angka tanpa wadah). */
import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";

const AKAR = new URL("../public/", import.meta.url).pathname;
// Pengecualian eksplisit: kartu form sendiri, dan kepala khusus yang sudah berwadah (hero beranda/insight, band direktori, kartu 404).
const KECUALI = new Map([
  ["masuk.html", "kartu form"], ["aktivasi.html", "kartu form"], ["ganti-sandi.html", "kartu form"],
  ["index.html", "jm-hero2 (beranda)"], ["insight.html", "jm-hero (insight)"], ["direktori.html", "ak-kepala (band brand + pencarian)"], ["404.html", "jm-404 (kartu)"],
]);

for (const f of readdirSync(AKAR).filter((n) => n.endsWith(".html") && !n.startsWith("_"))) {
  const h = readFileSync(AKAR + f, "utf8");
  if (!/<h1[\s>]/.test(h) || KECUALI.has(f)) continue;
  test(`kepala halaman standar: ${f}`, () => {
    const m = h.match(/<(section|div|header)[^>]*class="[^"]*\bjm-kh\b[^"]*"[\s\S]*?<h1[\s>]/);
    assert.ok(m, `${f}: <h1> harus di dalam .jm-kh`);
    // rantai.html dipegang agent lain; eyebrow menyusul (hapus entri ini begitu ditambahkan).
    if (f !== "rantai.html") assert.ok(/class="jm-kh-ey"[^>]*><svg/.test(h), `${f}: eyebrow wajib berikon`);
    assert.ok(!/class="[^"]*\bjm-judul\b/.test(h), `${f}: .jm-judul telanjang dilarang`);
    assert.ok(!/class="[^"]*\bbrt-angka\b/.test(h), `${f}: deret angka telanjang dilarang, pakai ubin .jm-kh-ubin`);
  });
}

// Kepala bagian (.jm-sh): berkartu (publik.css) dan wajib bereyebrow berikon, di halaman mana pun.
for (const f of readdirSync(AKAR).filter((n) => n.endsWith(".html") && !n.startsWith("_"))) {
  const h = readFileSync(AKAR + f, "utf8");
  const kepala = h.match(/<header class="jm-sh[^"]*"[\s\S]*?<\/header>/g) || [];
  if (!kepala.length) continue;
  test(`kepala bagian .jm-sh bereyebrow: ${f}`, () => {
    for (const k of kepala) assert.ok(/class="jm-kh-ey"[^>]*><svg/.test(k), `${f}: .jm-sh tanpa eyebrow berikon`);
    assert.ok(/<link[^>]*\/inti\/kh\.css/.test(h), `${f}: muat /inti/kh.css`);
  });
}

// Sisi kanan kepala tidak boleh kosong (aturan pemilik, 8 Nov 2026): tiap .jm-kh membawa ubin angka, gambar, atau kartu fakta
// (statis di HTML, atau dipasang skrip halaman lewat inti/kh.js). Pengecualian wajib beralasan.
const ISI_SISI = /jm-kh-(ubin|gambar|fakta|sisi)|data-kh-tautan|kta-kh-kanan|khSisi|khUbin|khGambarHtml|khFaktaHtml/;
const KECUALI_SISI = new Map([
  ["metode.html", "halaman teks panjang, lead selebar 68% kepala; belum ada data angka (ditinjau ulang bila ditambah)"],
]);
const JS_AWAL = (h) => [...h.matchAll(/<script[^>]*src="(\/[^"?]+\.js)/g)].map((m) => m[1]);
function jsHalaman(h, dalam = 0, lihat = new Set()) {
  let gabung = "";
  for (const s of JS_AWAL(h)) {
    if (lihat.has(s)) continue;
    lihat.add(s);
    let j; try { j = readFileSync(AKAR + s.slice(1), "utf8"); } catch { continue; }
    gabung += j;
    if (dalam < 1) for (const m of j.matchAll(/from "(\/[^"]+\.js)"/g)) gabung += jsHalaman(`<script src="${m[1]}">`, dalam + 1, lihat);
  }
  return gabung;
}
for (const f of readdirSync(AKAR).filter((n) => n.endsWith(".html") && !n.startsWith("_"))) {
  const h = readFileSync(AKAR + f, "utf8");
  if (!/class="[^"]*\bjm-kh\b[^"]*"/.test(h) || KECUALI_SISI.has(f)) continue;
  test(`sisi kanan kepala terisi: ${f}`, () => {
    assert.ok(ISI_SISI.test(h) || ISI_SISI.test(jsHalaman(h)), `${f}: .jm-kh tanpa ubin/gambar/fakta di kanan (pakai khSisi/khUbin di inti/kh.js atau data-kh-tautan)`);
  });
}
test("kepala profil /o dan /p memasang sisi kanan", () => {
  for (const f of ["o.js", "p.js"]) assert.ok(/kepalaHtml\(.*\bsisi\b/.test(readFileSync(AKAR + f, "utf8")), `${f}: kepalaHtml tanpa sisi`);
});
// JS yang membangun .jm-kh sendiri wajib menyertakan salah satu penanda sisi di berkas yang sama.
for (const f of readdirSync(AKAR).filter((n) => n.endsWith(".js"))) {
  const j = readFileSync(AKAR + f, "utf8");
  if (!/class="jm-kh[ "]/.test(j)) continue;
  test(`JS pembuat .jm-kh bersisi: ${f}`, () => assert.ok(ISI_SISI.test(j), `${f}: membuat .jm-kh tanpa .jm-kh-ubin/-gambar/-fakta`));
}
