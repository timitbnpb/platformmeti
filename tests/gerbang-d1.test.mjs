// Gerbang: akses D1 HANYA di src/hak.js (KP D7, KPV 2.1, DT 5.7). Pemindai punya fixture jahat yang harus memerahkannya.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const POLA = [/\benv\s*\.\s*DB\b/, /\bDB\s*\.\s*(prepare|batch|exec|dump)\b/, /\.\s*prepare\s*\(/, /\.\s*batch\s*\(/, /\.\s*exec\s*\(/, /\[\s*["'`](DB|prepare|batch|exec)["'`]\s*\]/];

// Buang komentar dan isi string agar teks penjelasan tak memicu; kode nyata tetap diperiksa.
export function bersihkan(kode) {
  return kode.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
}
export function temuan(kode) {
  const b = bersihkan(kode);
  return POLA.filter((p) => p.test(b)).map(String);
}
function berkas(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => d.isDirectory() ? berkas(path.join(dir, d.name)) : /\.(js|mjs)$/.test(d.name) ? [path.join(dir, d.name)] : []);
}

test("src/** selain hak.js tidak menyentuh D1", () => {
  const liar = berkas("src").filter((f) => path.basename(f) !== "hak.js" || path.dirname(f) !== "src")
    .map((f) => [f, temuan(fs.readFileSync(f, "utf8"))]).filter(([, t]) => t.length);
  assert.deepEqual(liar, [], "akses D1 liar di luar src/hak.js");
});

test("hak.js sendiri memang memegang D1 (pemindai tidak buta)", () => {
  assert.ok(temuan(fs.readFileSync("src/hak.js", "utf8")).length > 0);
});

test("fixture jahat memerahkan pemindai", () => {
  const jahat = [
    "const r = await env.DB.prepare('SELECT 1').first();",
    "const { DB } = env; await DB.prepare('x').run();",
    "const s = db.prepare(`DELETE FROM akun`);",
    "await env['DB'].batch([a, b]);",
    "await x.exec('DROP TABLE akun');",
    "env\n  .DB\n  .prepare('x')",
    "/* aman */ const d = env.DB; // bukan komentar penuh",
  ];
  for (const k of jahat) assert.ok(temuan(k).length > 0, `lolos tanpa terdeteksi: ${k}`);
  for (const aman of ["// env.DB.prepare ada di hak.js", "/* .batch( */ const x = 1;", "await hak.baca(env, akun, 'akun', {});"]) {
    assert.deepEqual(temuan(aman), [], aman);
  }
});
