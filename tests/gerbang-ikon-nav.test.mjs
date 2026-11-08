// Pemilik 8 Nov 2026: tiap item navigasi (grup dan anaknya) wajib ikon berbeda, dan ikonnya ada di ikon.svg.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const kepala = readFileSync("public/inti/kepala.js", "utf8");
const svg = readFileSync("public/img/ikon.svg", "utf8");
const tab = kepala.slice(kepala.indexOf("const TAB = ["), kepala.indexOf("];", kepala.indexOf("const TAB = [")));
const ikon = [...tab.matchAll(/ikon: "([a-z0-9-]+)"/g)].map((m) => m[1]);

test("ikon navigasi unik", () => {
  const ganda = ikon.filter((k, i) => ikon.indexOf(k) !== i);
  assert.deepEqual(ganda, []);
});
test("ikon navigasi ada di ikon.svg", () => {
  assert.deepEqual(ikon.filter((k) => !svg.includes(`id="i-${k}"`)), []);
});
test("sprite ikon: id tidak ganda, tidak dicache panjang (ikon baru harus langsung tampil di peramban lama)", () => {
  const id = [...svg.matchAll(/<symbol id="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(id.filter((k, i) => id.indexOf(k) !== i), []);
  assert.match(readFileSync("public/_headers", "utf8"), /\/img\/ikon\.svg\n\s+! Cache-Control\n\s+Cache-Control: public, max-age=0, must-revalidate/);
});
