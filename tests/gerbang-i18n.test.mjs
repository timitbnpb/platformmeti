// gerbang-i18n (DT §8.4 butir 6): kunci id == en, tiap t('...') ada di kamus, tiap data-i18n ada,
// teks HTML awal = kamus ID, tidak ada teks Indonesia tertanam di JS layar BARU.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const PUB = join(fileURLToPath(new URL("..", import.meta.url)), "public");
const jalan = (d) => readdirSync(d).flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? jalan(p) : [p]; });
const semua = jalan(PUB).map((p) => relative(PUB, p));
const id = JSON.parse(readFileSync(join(PUB, "i18n/id.json"), "utf8"));
const en = JSON.parse(readFileSync(join(PUB, "i18n/en.json"), "utf8"));

// Berkas warisan port direktori (milik agent direktori): boleh berisi teks tertanam sampai diporting ke kamus.
const WARISAN = (f) => f.startsWith("vendor/") || f === "inti/maplibre.js" || /^(fungsi_)?direktori[._]/.test(f);
const jsBaru = semua.filter((f) => f.endsWith(".js") && !WARISAN(f));

test("kunci id.json sama dengan en.json, tanpa nilai kosong", () => {
  assert.deepEqual(Object.keys(id).sort(), Object.keys(en).sort());
  for (const [k, v] of Object.entries(id)) assert.ok(v && en[k], `nilai kosong: ${k}`);
});

test("parameter {x} sama di id dan en", () => {
  const p = (s) => (s.match(/\{\w+\}/g) || []).sort().join();
  for (const k of Object.keys(id)) assert.equal(p(en[k]), p(id[k]), k);
});

test("tiap t('kunci') di public/**/*.js ada di kamus", () => {
  const re = /\bt\(\s*(["'`])([\w.\-]+)\1\s*[,)]/g;
  let n = 0;
  for (const f of semua.filter((x) => x.endsWith(".js") && !WARISAN(x))) {
    for (const m of readFileSync(join(PUB, f), "utf8").matchAll(re)) { n++; assert.ok(m[2] in id, `${f}: t('${m[2]}') tak ada di kamus`); }
  }
  assert.ok(n > 20, "pemindai tidak menemukan pemanggilan t()");
});

test("tiap data-i18n dan data-i18n-attr di HTML ada di kamus; teks awal HTML = ID", () => {
  for (const f of semua.filter((x) => x.endsWith(".html") && !WARISAN(x))) {
    const h = readFileSync(join(PUB, f), "utf8");
    for (const m of h.matchAll(/data-i18n-attr="([^"]+)"/g))
      for (const p of m[1].split(";")) assert.ok(p.split(":")[1] in id, `${f}: ${p}`);
    for (const m of h.matchAll(/<(\w+)\b[^>]*\bdata-i18n="([^"]+)"[^>]*>([^<]*)<\/\1>/g)) {
      assert.ok(m[2] in id, `${f}: data-i18n="${m[2]}" tak ada di kamus`);
      assert.equal(m[3].trim(), id[m[2]], `${f}: teks awal ${m[2]} beda dari id.json`);
    }
  }
});

test("tidak ada teks Indonesia tertanam di JS layar baru", () => {
  const KATA = /\b(yang|dan|atau|tidak|untuk|dengan|dari|kamu|belum|sudah|akan|bisa|harus|silakan|halaman|sandi|surel|gagal|salah|tersimpan|coba)\b/i;
  const lit = /(["'`])((?:\\.|(?!\1)[^\\\n])*)\1/g;
  for (const f of jsBaru) {
    const src = readFileSync(join(PUB, f), "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
    for (const m of src.matchAll(lit)) {
      const teks = m[2].replace(/\$\{(?:[^{}]|\{[^{}]*\})*\}/g, " ").replace(/<[^>]*>/g, " ");
      if (/\S\s+\S/.test(teks.trim()) && KATA.test(teks)) assert.fail(`${f}: teks tertanam "${m[2]}"`);
    }
  }
});

test("toLocaleString hanya di i18n.js", () => {
  for (const f of jsBaru.filter((x) => x !== "i18n.js")) assert.doesNotMatch(readFileSync(join(PUB, f), "utf8"), /toLocale(String|DateString)/, f);
});

test("formatter: angka, bulat, tanggal (ALG §10)", async () => {
  const m = await import(new URL("../public/i18n.js", import.meta.url));
  assert.equal(m.bulat(1.005, 2), 1.01);
  assert.equal(m.bulat(-2.5, 0), -3);
  assert.equal(m.angka(1234567.891, { desimal: 2, bahasa: "id" }), "1.234.567,89");
  assert.equal(m.angka(1234567.891, { desimal: 2, bahasa: "en" }), "1,234,567.89");
  assert.equal(m.angka(0.84, { desimal: 2, bahasa: "id" }), "0,84");
  assert.equal(m.angka(null), "-");
  assert.equal(m.angka(NaN), "-");
  assert.equal(m.tanggal("2026-11-07", { bahasa: "id" }), "7 Nov 2026");
  assert.equal(m.tanggal("2026-08-17", { bahasa: "id" }), "17 Agu 2026");
  assert.equal(m.tanggal("2026-08-17", { bahasa: "en", gaya: "panjang" }), "17 August 2026");
  assert.equal(m.tanggal("2026-02-29"), "-");
  assert.equal(m.tanggal("2028-02-29", { bahasa: "id" }), "29 Feb 2028");
  assert.equal(m.jam(0), "07:00 WIB");
});
