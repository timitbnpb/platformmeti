/* Pemilik 8 Nov 2026: tautan tanpa garis bawah. Garis bawah hanya boleh pada :hover/aria-sort (isyarat, bukan tampilan diam). */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
const dir = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? (e.name === "data" || e.name === "geo" ? [] : dir(`${d}/${e.name}`)) : [`${d}/${e.name}`]));
test("CSS: text-decoration:underline hanya di aturan :hover / aria-sort", () => {
  const salah = [];
  for (const f of dir("public").filter((n) => n.endsWith(".css"))) {
    const css = readFileSync(f, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
    for (const m of css.matchAll(/([^{}]+)\{([^{}]*text-decoration(?:-line)?:\s*underline[^{}]*)\}/g)) {
      if (!/:hover|aria-sort/.test(m[1])) salah.push(`${f}: ${m[1].trim().slice(-60)}`);
    }
  }
  assert.deepEqual(salah, []);
});
