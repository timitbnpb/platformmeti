/* Gerbang tipografi: satu skala di inti/tema.css. CSS lain tanpa px literal pada font-size/font, dan font-family hanya
   var(--display)/var(--font) (inherit boleh); font-weight hanya 400/600/700. @font-face dan tema.css dikecualikan. */
import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const AKAR = new URL("../public", import.meta.url).pathname;
const KECUALI = new Set(["inti/tema.css", "vendor/maplibre/maplibre-gl.css"]); // tema = sumber skala; maplibre = pihak ketiga
function* berkas(d) {
  for (const n of readdirSync(d)) {
    const p = join(d, n);
    if (statSync(p).isDirectory()) yield* berkas(p);
    else if (n.endsWith(".css")) yield p;
  }
}
test("CSS memakai skala tipografi token, bukan nilai acak", () => {
  const salah = [];
  for (const f of berkas(AKAR)) {
    const r = relative(AKAR, f);
    if (KECUALI.has(r)) continue;
    const css = readFileSync(f, "utf8").replace(/@font-face\{[^}]*\}/g, "");
    const cek = (re, ket, ok) => {
      for (const m of css.matchAll(re)) if (!ok(m)) salah.push(`${r}: ${ket} ${m[0]}`);
    };
    cek(/font-size:\s*[^;}]*/g, "font-size", m => !/\d(px|em|rem)/.test(m[0].replace(/var\([^)]*\)/g, "")) );
    cek(/(?<![-\w])font:\s*[^;}]*/g, "font", m => !/\d(px|rem)\b/.test(m[0].replace(/var\([^)]*\)/g, "")));
    cek(/font-family:\s*[^;}]*/g, "font-family", m => /^font-family:\s*(var\(--(display|font)\)|inherit)\s*$/.test(m[0]));
    cek(/font-weight:\s*[^;}]*/g, "font-weight", m => /^font-weight:\s*(400|600|700|inherit)(\s*!important)?$/.test(m[0]));
  }
  assert.deepEqual(salah, []);
});
