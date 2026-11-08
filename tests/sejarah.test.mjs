// Gerbang /sejarah: data bangunan segar, tautan hidup, sumber https tanpa Antara, teks id=en, CSS tanpa hex, menu terpasang.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { bangun, KATEGORI } from "../scripts/pipa/sejarah_bangun.mjs";

const baca = (f) => readFileSync(new URL("../public/" + f, import.meta.url), "utf8");
const tersimpan = JSON.parse(baca("data/sejarah.json"));
const baru = bangun(tersimpan.dibangun_pada);
const teks = JSON.parse(baca("data/teks_sejarah.json"));

test("sejarah.json sama dengan hasil builder (tidak basi)", () => assert.deepEqual(tersimpan, baru));
test("tiap kategori punya peristiwa, tiap peristiwa bersumber https dan dua bahasa", () => {
  for (const k of KATEGORI) assert.ok(baru.peristiwa.some((e) => e.kat === k), k);
  assert.ok(baru.peristiwa.length >= 30);
  for (const e of baru.peristiwa) {
    for (const l of ["id", "en"]) assert.ok(e.judul[l] && e.ringkas[l], e.id);
    assert.ok(e.sumber.length && e.sumber.every((s) => /^https:\/\//.test(s.url)), e.id);
    assert.ok(!e.sumber.some((s) => /antaranews/.test(s.url)), "tanpa Antara: " + e.id);
    assert.ok(!/[–—]/.test(JSON.stringify([e.judul, e.ringkas])), "tanpa em dash: " + e.id);
  }
});
test("peristiwa wajib mencakup tonggak yang diminta", () => {
  const id = new Set(baru.peristiwa.map((e) => e.id));
  for (const k of ["bengkok-plengan-1922", "ubrug-1925", "jatiluhur-1965", "kamojang-1983", "perpres-5-2006", "uu-30-2007", "ken-2014", "ruen-2017", "sidrap-2018", "cirata-2023", "perpres-112-2022", "jetp-2022"]) assert.ok(id.has(k), k);
});
test("kapasitas: jumlah seri = total IRENA tiap tahun", () => {
  const k = baru.kapasitas;
  k.tahun.forEach((y, i) => { const s = Object.values(k.seri).reduce((a, v) => a + v[i], 0), t = k.total_irena.find((x) => x.tahun === y)?.mw; assert.ok(Math.abs(s - t) < 0.5, `${y}: ${s} vs ${t}`); });
});
test("teks id dan en setara; semua kunci tt() ada", () => {
  assert.deepEqual(Object.keys(teks.id).sort(), Object.keys(teks.en).sort());
  const js = baca("sejarah.js"), dinamis = [...baru.kategori.map((k) => "kat." + k), ...Object.keys(baru.kapasitas.seri).map((s) => "seri." + s), "bukti.resmi", "bukti.media", "bukti.ensiklopedia", "status.dicabut", "status.diubah", ...baru.celah.map((_, i) => "celah." + i)];
  for (const m of js.matchAll(/\btt\(\s*"([\w.\-]+)"/g)) if (!m[1].endsWith(".")) assert.ok(m[1] in teks.id, m[1]);
  for (const k of dinamis) assert.ok(k in teks.id, k);
  for (const e of baru.peristiwa) if (e.tek) assert.ok("seri." + e.tek in teks.id, e.tek);
});
test("berkas halaman: tanpa style=, tanpa hex di CSS, tanpa em dash", () => {
  for (const f of ["sejarah.html", "sejarah.js"]) assert.ok(!/\sstyle=/.test(baca(f)), f);
  assert.ok(!/#[0-9a-fA-F]{3,8}\b/.test(baca("sejarah.css")));
  for (const f of ["sejarah.html", "sejarah.js", "sejarah.css", "data/teks_sejarah.json"]) assert.ok(!/[–—]/.test(baca(f)), f);
});
test("menu Pustaka memuat /sejarah", () => assert.match(baca("inti/kepala.js"), /href: "\/sejarah", kunci: "sjr\.nav"/));
