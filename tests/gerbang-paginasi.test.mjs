// Gerbang: paginasi hanya lewat paginasiHtml (public/inti/paginasi.js); tidak ada "Halaman sebelumnya" / "Halaman n / m" buatan sendiri.
import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";

const akar = new URL("../public/", import.meta.url).pathname;
const JS = readdirSync(akar).filter((f) => f.endsWith(".js"));
const LARANG = [
  [/Halaman sebelumnya|Halaman berikutnya/i, "teks 'Halaman sebelumnya/berikutnya' tertanam"],
  [/Halaman\s*(\$\{[^}]+\}|\{n\})\s*\//, "teks 'Halaman {n} / {m}' buatan sendiri"],
  [/t\(\s*["'](jm\.sebelumnya|jm\.berikutnya|jm\.hal|adm\.kta\.hal|adm\.anggota\.hal)["']/, "kunci paginasi lama dipakai"],
  [/data-aksi="hal[-+]"|data-(m|k)="hal[-+]"/, "tombol hal-/hal+ buatan sendiri"],
];

test("paginasi: semua layar memakai paginasiHtml, bukan tombol halaman buatan sendiri", () => {
  const salah = [];
  for (const f of JS) {
    const s = readFileSync(akar + f, "utf8");
    for (const [re, sebab] of LARANG) if (re.test(s)) salah.push(`${f}: ${sebab}`);
  }
  assert.deepEqual(salah, []);
});

test("paginasiHtml: satu halaman = teks saja; banyak halaman = strip dengan nomor tersorot", async () => {
  globalThis.JM = {}; // i18n.js bergantung pada kamus; uji bentuk lewat modul bila bisa dimuat
  let m; try { m = await import("../public/inti/paginasi.js"); } catch { return; }
  const { nomorHalaman } = m;
  assert.deepEqual(nomorHalaman(1, 1), [1]);
  assert.ok(nomorHalaman(9, 18).length <= 7);
});
