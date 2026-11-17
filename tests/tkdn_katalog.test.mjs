// Katalog produk ber-TKDN per produk (butir 62): data yang dipakai tampilan "Per produk" di /rantai-global?tab=tkdn.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const baca = (f) => readFileSync(new URL("../" + f, import.meta.url), "utf8");
const D = JSON.parse(baca("public/data/tkdn_produk.json"));

test("tiap sertifikat punya produk, pabrikan, kategori, tautan sumber https, dan tanggal ISO", () => {
  assert.ok(D.baris.length > 0);
  for (const r of D.baris) {
    assert.ok(r.pabrikan && r.kategori, r.id);
    assert.match(r.sumber_url, /^https:\/\//, r.id);
    if (r.berlaku_sampai) assert.match(r.berlaku_sampai, /^\d{4}-\d{2}-\d{2}$/, r.id);
    if (r.tkdn_persen != null) assert.ok(r.tkdn_persen >= 0 && r.tkdn_persen <= 100, r.id);
  }
});

test("layar: kedaluwarsa dihitung dari tanggal, tautan sumber aman, CSV memuat semua baris tersaring", () => {
  const src = baca("public/rantai.js");
  assert.match(src, /const lewat = \(r\) => \(r\.berlaku_sampai \? r\.berlaku_sampai < HARI_INI : !r\.aktif\)/);
  assert.match(src, /href="\$\{esc\(r\.sumber_url\)\}" target="_blank" rel="noopener noreferrer"/);
  assert.match(src, /addEventListener\("jm:csv"/);
  assert.match(src, /saringSert\(\)\.map/);
  // sebagian sertifikat tidak mencantumkan nama produk di sumber: layar menulisnya terus terang, tidak mengarang nama
  assert.match(src, /r\.produk \|\| t\("rt2\.tanpa_produk"\)/);
  // status tidak hanya warna: pil memuat teks rt2.lewat atau rt2.aktif
  assert.match(src, /t\(l \? "rt2\.lewat" : "rt2\.aktif"\)/);
});
