/* Gerbang: pemilik melarang gaya progress bar (batang isi di atas lintasan abu-abu). Gagal bila public/**\/*.{js,css}
   memuat kelas lintasan. Grafik batang sungguhan (kisi + sumbu, tanpa lintasan) lewat batangHtml di /analisis.js. */
import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const AKAR = new URL("../public", import.meta.url).pathname;
// Pengecualian SEMENTARA: berkas milik agent lain yang sedang dipegang; hapus entrinya begitu dibersihkan.
const KECUALI = new Set([
  "beranda_bawah.css",
  "beranda_bawah.js",
  "rantai.css",
  "rantai.js",
  "direktori.css",
  "direktori.js",
  "insight.css",
  "kelayakan.css",
  "kelayakan.js",
]);
const POLA =
  /bar-latar|<progress|progress-bar|class="[^"]*\bjm-wl-mb\b|pbar-t\b|jm-bar-trek[^"]*\{[^}]*background(?!-)/;

function* berkas(d) {
  for (const n of readdirSync(d)) {
    const p = join(d, n);
    if (n === "vendor" || n === "data") continue;
    if (statSync(p).isDirectory()) yield* berkas(p);
    else if (/\.(js|css)$/.test(n)) yield p;
  }
}

test("tidak ada kelas lintasan progress di public/", () => {
  const temuan = [];
  for (const p of berkas(AKAR)) {
    const r = relative(AKAR, p);
    if (KECUALI.has(r)) continue;
    readFileSync(p, "utf8")
      .split("\n")
      .forEach((l, i) => {
        if (POLA.test(l)) temuan.push(`${r}:${i + 1}`);
      });
  }
  assert.deepEqual(temuan, [], "lintasan progress terlarang");
});
