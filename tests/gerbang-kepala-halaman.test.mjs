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
