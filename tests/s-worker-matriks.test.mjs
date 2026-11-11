// JM-S11: tabel §1 KEAMANAN-PRIVASI.md harus memuat SETIAP jenis MATRIKS dan sel-selnya identik (selisih satu sel = merah).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { MATRIKS } from "../src/hak.js";

const MD = readFileSync(new URL("../docs/perencanaan/KEAMANAN-PRIVASI.md", import.meta.url), "utf8");
const AWAL = ["entitas", "fakta", "ikatan", "orang", "kontak", "terlarang", "potret_publik", "potret_anggota", "potret_pengurus", "akun", "sesi", "koreksi", "riwayat", "agenda", "jejak", "daftar_tolak"];
const norm = (s) => s.toLowerCase().replace(/[(),]/g, "").replace(/[\s-]+/g, "");

test("tiap jenis MATRIKS punya baris di KPV §1 dengan 7 sel identik", () => {
  const bagian = MD.slice(MD.indexOf("| Jenis data |"), MD.indexOf("Penjelasan dan aturan sel"));
  const baris = bagian.split("\n").filter((l) => l.startsWith("|")).slice(2).map((l) => l.split("|").slice(1, -1).map((c) => c.trim()));
  const peta = {};
  let i = 0;
  for (const c of baris) {
    const tag = /\{([a-z_]+)\}$/.exec(c[0])?.[1];
    const kunci = tag ?? AWAL[i++];
    assert.ok(kunci, "baris tanpa kunci: " + c[0]);
    assert.equal(c.length, 8, kunci);
    peta[kunci] = c.slice(1);
  }
  assert.deepEqual(Object.keys(peta).sort(), Object.keys(MATRIKS).sort(), "jenis MATRIKS tanpa baris KPV (atau sebaliknya)");
  for (const j of Object.keys(MATRIKS)) assert.deepEqual(peta[j].map(norm), MATRIKS[j].map(norm), `baris ${j} beda dari MATRIKS`);
});
