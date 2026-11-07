/* Gerbang: grafik SVG yang dibangun di public/**.js wajib bertooltip. Modul grafik bersama (grafik.js/analisis.js) memuat inti/tip_grafik.js
   dan tiap bar/kolom membawa <title> atau title=. Berkas yang membuat <svg ... role="img"> sendiri tanpa <title>/data-tip ditandai. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
test("modul grafik bersama memuat tip_grafik.js", () => {
  for (const f of ["public/grafik.js", "public/analisis.js"]) assert.match(readFileSync(f, "utf8"), /import "\/inti\/tip_grafik\.js"/, f);
});
const PENGECUALIAN = new Set(["public/grafik.js", "public/inti/tip_grafik.js", "public/inti/ikon_tek.js", "public/inti/peta_indonesia.js", "public/peta_batas.js"]);
// BISU, belum tercakup komponen bersama (hapus entri begitu diberi tooltip): beranda_data.js
const BISU = new Set(["public/beranda_data.js"]);
test("tiap svg role=img buatan halaman membawa <title>/data-tip atau lewat grafik.js", () => {
  const bisu = [];
  for (const f of readdirSync("public").filter((n) => n.endsWith(".js")).map((n) => "public/" + n)) {
    if (PENGECUALIAN.has(f) || BISU.has(f)) continue;
    const s = readFileSync(f, "utf8");
    if (/<svg[^>]*class="[^"]*(?:chart|grafik|gr-|bar)[^"]*"/i.test(s) && !/<title>|data-tip|tip_grafik|\/grafik\.js|\/analisis\.js/.test(s)) bisu.push(f);
  }
  assert.deepEqual(bisu, []);
});
