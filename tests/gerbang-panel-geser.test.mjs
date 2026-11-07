/* Gerbang: panel mengambang di atas peta WAJIB bisa digeser (aturan pemilik, berkali-kali diulang).
   Berkas public/*.js yang membuat peta MapLibre dan menaruh panel overlay (kelas ...-panel/-lapis/-peringkat/-legenda atau data-panel)
   harus memanggil geserPanel (public/inti/panel_geser.js). Pengecualian hanya lewat daftar di bawah, dengan alasan. */
import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";

const PENGECUALIAN = {
  "rantai.js": "dipegang agent lain sementara; pasang geserPanel lalu hapus baris ini",
};
const PETA = /new\s+maplibregl\.Map\b/;
const PANEL = /class="[^"]*[\w]-(?:panel|lapis|peringkat|legenda)\b|data-panel\b/;

test("panel di atas peta MapLibre memakai geserPanel", () => {
  const salah = [];
  for (const f of readdirSync("public").filter((n) => n.endsWith(".js"))) {
    const s = readFileSync(`public/${f}`, "utf8");
    if (!PETA.test(s) || !PANEL.test(s) || /geserPanel\(/.test(s) || PENGECUALIAN[f]) continue;
    salah.push(f);
  }
  assert.deepEqual(salah, [], `panel peta tanpa geserPanel: ${salah.join(", ")}`);
});

test("pengecualian tidak basi", () => {
  for (const f of Object.keys(PENGECUALIAN)) {
    const s = readFileSync(`public/${f}`, "utf8");
    assert.ok(!/geserPanel\(/.test(s), `${f} sudah memakai geserPanel: hapus dari PENGECUALIAN`);
  }
});
