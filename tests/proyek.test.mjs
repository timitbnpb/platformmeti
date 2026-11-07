// /proyek: halaman statis memuat aset yang ada dan data potret konsisten (render peramban diperiksa lewat tangkapan layar).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
const P = new URL("../public/", import.meta.url);
const baca = (f) => readFileSync(new URL(f, P), "utf8");

test("proyek.html: aset ada, kunci i18n id=en", () => {
  const h = baca("proyek.html");
  for (const m of h.matchAll(/(?:src|href)="(\/[^"#]+)"/g)) assert.ok(existsSync(new URL("." + m[1], P)), m[1]);
  const id = JSON.parse(baca("i18n/id.json")), en = JSON.parse(baca("i18n/en.json"));
  for (const k of Object.keys(id).filter((x) => x.startsWith("pj."))) assert.ok(en[k], k);
});

test("data proyek: id unik, program_ids ada di program.json", () => {
  const p = JSON.parse(baca("data/proyek.json")).baris, g = new Set(JSON.parse(baca("data/program.json")).baris.map((x) => x.id));
  assert.equal(new Set(p.map((x) => x.id)).size, p.length);
  for (const x of p) for (const i of x.program_ids || []) assert.ok(g.has(i), `${x.id}: ${i}`);
});
