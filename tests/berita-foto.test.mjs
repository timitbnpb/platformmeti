// Foto berita: tiap id ada di berita.json, url https bernama, host terdaftar di img-src CSP.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const baca = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");
const foto = JSON.parse(baca("public/data/berita_foto.json"));
// foto dipakai berita dan liputan media di siaran_pers.json (id sama dengan berita asal)
const sp = JSON.parse(baca("public/data/siaran_pers.json"));
const ids = new Set([...JSON.parse(baca("public/data/berita.json")).baris.map((b) => b.id), ...JSON.stringify(sp).match(/[0-9a-f]{10}/g)]);
const csp = baca("public/_headers").match(/img-src ([^;]*)/)[1].split(/\s+/);

test("F1 tiap id foto ada di berita.json atau siaran_pers.json", () => {
  for (const id of Object.keys(foto)) assert.ok(ids.has(id), id);
});
test("F2 url foto https bernama; CSP tanpa host berita (dilayani Worker)", () => {
  for (const [id, u] of Object.entries(foto)) {
    const x = new URL(u);
    assert.equal(x.protocol, "https:", id);
    assert.match(x.hostname, /^[a-z0-9-]+(\.[a-z0-9-]+)+$/, id);
    assert.ok(!csp.includes("https://" + x.host) || ["i.ytimg.com"].includes(x.host), x.host);
  }
});
test("F3 baris CSP muat batas 2000 karakter _headers", () => {
  assert.ok(baca("public/_headers").split("\n").every((l) => l.length <= 2000));
});
