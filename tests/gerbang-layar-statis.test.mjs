// gerbang-layar-statis (KPV §8 butir 7, DS §4): CSP tanpa inline, tiap halaman berlang, viewport, dan kepala situs.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const PUB = join(fileURLToPath(new URL("..", import.meta.url)), "public");
const jalan = (d) => readdirSync(d).flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? jalan(p) : [p]; });
const semua = jalan(PUB).map((p) => relative(PUB, p));
const html = semua.filter((f) => f.endsWith(".html"));
const baca = (f) => readFileSync(join(PUB, f), "utf8");

test("ada halaman yang dipindai", () => assert.ok(html.length >= 6));

test("tanpa style=, onclick= (atribut on*), dan <script> tanpa src di HTML", () => {
  for (const f of html) {
    const h = baca(f).replace(/<!--[\s\S]*?-->/g, "");
    assert.doesNotMatch(h, /\sstyle\s*=/i, `${f}: style=`);
    assert.doesNotMatch(h, /\son[a-z]+\s*=/i, `${f}: atribut on*=`);
    for (const m of h.matchAll(/<script\b([^>]*)>/gi)) assert.match(m[1], /\ssrc\s*=/i, `${f}: <script> tanpa src`);
  }
});

test("JS layar baru tanpa style= dan onclick= dalam string HTML", () => {
  const warisan = (f) => f.startsWith("vendor/") || f === "inti/maplibre.js" || /^(fungsi_)?direktori[._]/.test(f);
  for (const f of semua.filter((x) => x.endsWith(".js") && !warisan(x))) {
    const s = baca(f);
    assert.doesNotMatch(s, /\sstyle\s*=\s*["'\\]/, `${f}: style=`);
    assert.doesNotMatch(s, /\sonclick\s*=/i, `${f}: onclick=`);
  }
});

test("tiap halaman: <html lang>, viewport, kepala situs", () => {
  for (const f of html) {
    const h = baca(f);
    assert.match(h, /<html[^>]*\slang="(id|en)"/, `${f}: html lang`);
    assert.match(h, /<meta[^>]*name="viewport"[^>]*width=device-width/, `${f}: viewport`);
    assert.match(h, /<header class="top"/, `${f}: kepala situs`);
  }
});

test("halaman terkunci noindex + referrer; robots.txt menutup rute terkunci", () => {
  for (const f of ["masuk.html", "aktivasi.html", "ganti-sandi.html", "admin.html"]) {
    const h = baca(f);
    assert.match(h, /name="robots" content="noindex,nofollow"/, f);
    assert.match(h, /name="referrer" content="no-referrer"/, f);
  }
  const r = baca("robots.txt");
  for (const p of ["/api/", "/direktori", "/admin", "/masuk", "/aktivasi"]) assert.match(r, new RegExp("Disallow: " + p));
});

test("tanpa hex di CSS selain tema.css, tanpa :focus polos, tanpa em dash dan titik tengah", () => {
  for (const f of semua.filter((x) => x.endsWith(".css") && x !== "inti/tema.css" && !/^(fungsi_)?direktori[._]/.test(x) && !x.startsWith("vendor/"))) {
    const s = baca(f);
    assert.doesNotMatch(s.replace(/url\([^)]*\)/g, ""), /#[0-9a-fA-F]{3,8}\b/, `${f}: hex`);
    assert.doesNotMatch(s, /:focus(?!-)/, `${f}: :focus`);
  }
  for (const f of semua.filter((x) => /\.(html|js|json|css)$/.test(x) && !/^(fungsi_)?direktori[._]/.test(x) && !x.startsWith("vendor/") && x !== "inti/maplibre.js")) {
    assert.doesNotMatch(baca(f), /[\u2014\u00b7]/, `${f}: em dash atau titik tengah`);
  }
});

test("tiap var(--x) di CSS layar baru terdefinisi di tema.css atau lokal", () => {
  const tema = baca("inti/tema.css");
  for (const f of semua.filter((x) => x.endsWith(".css") && x !== "inti/tema.css" && !/^(fungsi_)?direktori[._]/.test(x) && !x.startsWith("vendor/"))) {
    for (const m of baca(f).matchAll(/var\((--[\w-]+)/g)) assert.match(tema, new RegExp(m[1] + ":"), `${f}: ${m[1]} tak terdefinisi`);
  }
});
