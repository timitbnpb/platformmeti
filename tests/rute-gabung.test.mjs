// Halaman yang digabung: tautan lama dialihkan 301 ke tab barunya (query dipertahankan, hash = tab aktif).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const src = readFileSync("src/worker.js", "utf8");
const peta = JSON.parse(src.match(/const ALIH_GABUNG = (\{[^}]*\});/)[1]);

test("ALIH_GABUNG memetakan halaman lama ke tab baru", () => {
  assert.deepEqual(peta, { "/kelayakan": "/peluang#hitung", "/event": "/kalender#daftar", "/video": "/galeri#video", "/podcast": "/galeri#podcast" });
});
test("alihan berstatus 301 dan mempertahankan query", () => {
  assert.match(src, /status: 301, headers: \{ location: ke \+ url\.search \+ "#" \+ hash \}/);
});
test("halaman lama tidak lagi berkas statis; halaman gabungan memuat tabnya", () => {
  for (const f of ["kelayakan", "event", "video", "podcast"]) assert.throws(() => readFileSync(`public/${f}.html`), /ENOENT/);
  assert.match(readFileSync("public/peluang_halaman.js", "utf8"), /"hitung"/);
  assert.match(readFileSync("public/kalender_halaman.js", "utf8"), /"daftar"[\s\S]*"arsip"/);
  assert.match(readFileSync("public/galeri_halaman.js", "utf8"), /"video"[\s\S]*"podcast"/);
});
