// public/data/libur.json: transkripsi SKB 3 Menteri 2026 dan 2027 (scripts/pipa/libur.mjs). Hari yang tertulis di SKB harus cocok dengan kalender.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { bangun, urai, SKB } from "../scripts/pipa/libur.mjs";

const j = JSON.parse(readFileSync("public/data/libur.json", "utf8"));

test("libur.json = hasil bangun() dari tabel SKB", () => {
  assert.deepEqual(j, bangun(j.meta.tanggal_periksa));
});
test("jumlah sesuai lampiran SKB: 2026 (16 baris nasional, 6 baris cuti) dan 2027 (17 dan 6), rentang diurai per hari", () => {
  const n = (th, jn) => j.baris.filter((b) => b.tanggal.startsWith(th) && b.jenis === jn).length;
  assert.equal(n("2026", "libur_nasional"), 17); // Idul Fitri 21-22 Maret = 2 hari
  assert.equal(n("2026", "cuti_bersama"), 8);    // 6 baris; Idul Fitri 20, 23, 24 Maret = 3 hari
  assert.equal(n("2027", "libur_nasional"), 18); // Idul Fitri 10-11 Maret = 2 hari
  assert.equal(n("2027", "cuti_bersama"), 8);    // Idul Fitri 9, 12, 15 Maret = 3 hari
});
test("tiap baris punya tanggal, nama, jenis, sumber https dan tanggal_periksa", () => {
  for (const b of j.baris) {
    assert.match(b.tanggal, /^20(26|27)-\d{2}-\d{2}$/);
    assert.ok(b.nama && b.singkat);
    assert.ok(["libur_nasional", "cuti_bersama"].includes(b.jenis));
    assert.match(b.sumber_url, /^https:\/\/www\.kemenkopmk\.go\.id\//);
    assert.match(b.tanggal_periksa, /^\d{4}-\d{2}-\d{2}$/);
  }
  assert.equal(new Set(j.baris.map((b) => b.tanggal + b.jenis)).size, j.baris.length);
});
test("salah hari di tabel ketahuan", () => {
  assert.throws(() => urai(2026, ["N", "25", "Desember", "Sabtu", "x", "x"]), /kalender Jumat/);
  assert.equal(SKB[2026].url.includes("2026"), true);
});
