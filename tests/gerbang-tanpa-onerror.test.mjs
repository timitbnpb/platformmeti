// CSP script-src 'self' memblokir penangan inline: onerror/onload di markup tidak pernah jalan.
// Pakai data-galat="hapus" (inti/galat_gambar.js) atau listener di modul.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const jalan = (d) => readdirSync(d).flatMap((n) => {
  const p = join(d, n);
  if (n === "vendor" || n === "data") return [];
  return statSync(p).isDirectory() ? jalan(p) : /\.(js|html)$/.test(n) ? [p] : [];
});

test("tanpa penangan peristiwa inline (on*=) di public", () => {
  const salah = jalan("public").filter((p) => /\son(error|load|click)="/.test(readFileSync(p, "utf8")));
  assert.deepEqual(salah, []);
});
