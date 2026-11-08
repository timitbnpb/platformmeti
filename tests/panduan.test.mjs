// Gerbang /panduan: data segar, tautan hidup, biaya hanya lewat kunci skala, penafian, teks id=en, CSS tanpa hex, menu terpasang.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { bangun } from "../scripts/pipa/panduan_bangun.mjs";

const baca = (f) => readFileSync(new URL("../public/" + f, import.meta.url), "utf8");
const tersimpan = JSON.parse(baca("data/panduan.json"));
const baru = bangun(tersimpan.dibangun_pada);
const teks = JSON.parse(baca("data/teks_panduan.json"));

test("panduan.json sama dengan hasil builder (tidak basi)", () => assert.deepEqual(tersimpan, baru));
test("panduan wajib ada dan lengkap", () => {
  const id = baru.panduan.map((g) => g.id);
  for (const k of ["plts-rumah", "plts-usaha", "plts-sekolah", "plts-ibadah", "izin-ipp", "pendanaan", "desa-komunal"]) assert.ok(id.includes(k), k);
  for (const g of baru.panduan) {
    assert.ok(g.langkah.length >= 4 && g.dokumen.length && g.faq.length, g.id);
    assert.ok(g.taut.regulasi.length + g.taut.org.length > 0, g.id);
  }
  assert.deepEqual(baru.templat.map((t) => t.id), ["studi-kelayakan", "term-sheet-ppa"]);
  assert.ok(baru.mitos.length >= 6 && baru.mitos.some((m) => m.id === "mendung" && m.vonis));
  assert.ok(L(baru.penafian).match(/nasihat hukum/i) && baru.penafian.en.match(/legal/i));
});
const L = (o) => o.id;
test("tidak ada angka rupiah/USD tertanam di data panduan (biaya hanya dari kunci skala)", () => {
  const s = JSON.stringify([baru.panduan.map((g) => [g.langkah, g.faq, g.ringkas]), baru.templat]);
  assert.ok(!/Rp\s?\d|USD\s?\d|juta|miliar/i.test(s));
});
test("kunci skala biaya ada dan punya capex", async () => {
  const b = JSON.parse(baca("data/biaya_bangun.json"));
  for (const g of baru.panduan.filter((x) => x.skala)) { const s = b.skala.find((x) => x.id === g.skala.id); assert.ok(s?.capex_rp_juta_kw?.rendah != null, g.id); }
});
test("teks id dan en setara; semua kunci tt() ada", () => {
  assert.deepEqual(Object.keys(teks.id).sort(), Object.keys(teks.en).sort());
  for (const m of baca("panduan.js").matchAll(/\btt\(\s*"([\w.\-]+)"/g)) if (!m[1].endsWith(".")) assert.ok(m[1] in teks.id, m[1]);
  for (const k of ["status.dicabut", "status.diubah", ...["salah", "sebagian", "kedaluwarsa"].map((v) => "vonis." + v), ...["komponen", "sdm", "biaya", "tak_diketahui", "bencana", "jaringan_pln", "beban", "kelembagaan"].map((v) => "sebab." + v), ...baru.celah.map((_, i) => "celah." + i)]) assert.ok(k in teks.id, k);
});
test("berkas halaman: tanpa style=, tanpa hex di CSS, tanpa em dash", () => {
  for (const f of ["panduan.html", "panduan.js"]) assert.ok(!/\sstyle=/.test(baca(f)), f);
  assert.ok(!/#[0-9a-fA-F]{3,8}\b/.test(baca("panduan.css")));
  for (const f of ["panduan.html", "panduan.js", "panduan.css", "data/teks_panduan.json", "data/panduan.json"]) assert.ok(!/[–—]/.test(baca(f)), f);
});
test("menu Pustaka memuat /panduan", () => assert.match(baca("inti/kepala.js"), /href: "\/panduan", kunci: "pdu\.nav"/));
