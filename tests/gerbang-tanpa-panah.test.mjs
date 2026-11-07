/* Pemilik 8 Nov 2026: tautan "Lihat semua" memakai pil lembut (lihatSemuaHtml), tanpa panah teks. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
/* asean.js: "a &rarr; b" pada lintasan nilai tahunan (arti matematis, bukan tautan) */
const PENGECUALIAN = new Set(["public/asean.js"]);
const dir = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? (e.name === "data" || e.name === "geo" ? [] : dir(`${d}/${e.name}`)) : [`${d}/${e.name}`]));
test("tanpa panah teks (U+2192, \\u2192, &rarr;) di public/*.js dan i18n", () => {
  const salah = dir("public").filter((f) => !PENGECUALIAN.has(f) && /\.(js|json)$/.test(f) && /→|\\u2192|&rarr;|&#8594;/.test(readFileSync(f, "utf8")));
  assert.deepEqual(salah, []);
});
