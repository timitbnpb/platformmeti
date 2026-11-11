// Gerbang S08 (statis, tanpa DB): tiap rute /api/ di kode terdaftar di tests/e2e/cakupan.json, punya berkas uji nyata, dan peran benar/salah.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { ekstrakRute, TULIS } from "./_rute.mjs";

const c = JSON.parse(readFileSync(new URL("./e2e/cakupan.json", import.meta.url), "utf8")).rute;
const { rute, modul } = await ekstrakRute();
const kode = [...rute.keys()];
const diuji = Object.keys(c.diuji), belum = Object.keys(c.belum), kecuali = Object.keys(c.dikecualikan);
const f = (k) => new URL("../" + k, import.meta.url);

test("penjaga ekstraktor: masih menemukan modul dan rute (bukan hijau-kosong)", () => {
  assert.ok(modul >= 25, `modul ber-rute terbaca ${modul}, minimal 25`);
  assert.ok(kode.length >= 200, `rute terekstrak ${kode.length}, minimal 200`);
  assert.ok(kode.length >= c.jumlah_minimal, `rute di kode ${kode.length} < garis dasar ${c.jumlah_minimal}: rute dihapus tanpa menurunkan garis dasar`);
});

test("tiap rute di kode terdaftar di TEPAT SATU daftar (diuji, belum, dikecualikan)", () => {
  const tak = kode.filter((k) => ![diuji, belum, kecuali].filter((d) => d.includes(k)).length);
  assert.deepEqual(tak, [], `rute tak terdaftar di tests/e2e/cakupan.json: jalankan node tests/e2e/rute-daftarkan.mjs lalu tinjau hasilnya`);
  const ganda = kode.filter((k) => [diuji, belum, kecuali].filter((d) => d.includes(k)).length > 1);
  assert.deepEqual(ganda, [], "rute di lebih dari satu daftar");
});

test("tiap entri cakupan.json masih ada rutenya di kode", () => {
  const basi = [...diuji, ...belum, ...kecuali, ...Object.keys(c.peran), ...Object.keys(c.publik)].filter((k) => !rute.has(k));
  assert.deepEqual(basi, []);
});

test("berkas uji yang ditunjuk ada dan menyebut jalurnya (atau berbasis cakupan.json)", () => {
  for (const [k, b] of Object.entries(c.diuji)) {
    assert.ok(existsSync(f(b)), `${k}: berkas uji hantu ${b}`);
    const t = readFileSync(f(b), "utf8"), jalur = k.split(" ")[1].split("/:")[0];
    assert.ok(t.includes(jalur) || t.includes("cakupan.json"), `${k}: ${b} tidak menyebut ${jalur}`);
  }
});

test("dikecualikan dan belum beralasan >= 20 karakter; belum hanya boleh menyusut", () => {
  for (const d of [c.dikecualikan, c.belum]) for (const [k, a] of Object.entries(d)) assert.ok(String(a).length >= 20, `${k}: alasan kurang`);
  assert.ok(belum.length <= c.belum_batas, `rute belum ${belum.length} > batas ${c.belum_batas}: belum tidak boleh bertambah`);
});

test("tiap rute diuji punya peran benar (tak kosong) dan peran salah; rute tulis salah-nya memuat tamu; publik beralasan", () => {
  for (const k of diuji) {
    const p = c.peran[k];
    assert.ok(p, `${k}: tanpa entri rute.peran`);
    assert.ok(p.benar.length > 0, `${k}: peran benar kosong`);
    const publik = p.benar.includes("tamu");
    if (publik) assert.ok(String(c.publik[k] ?? "").length >= 20, `${k}: publik tanpa catatan alasan`);
    else assert.ok(p.salah.includes("tamu"), `${k}: peran salah tanpa tamu`);
    if (TULIS.has(k.split(" ")[0]) && !publik) assert.ok(p.salah.length > 0, `${k}: rute tulis tanpa peran salah`);
  }
  for (const k of Object.keys(c.publik)) assert.ok(c.peran[k]?.benar.includes("tamu"), `${k}: tercatat publik tapi tamu tidak lolos`);
});

test("fixture jahat: pencari rute tak terdaftar benar-benar merah untuk rute sintetis", () => {
  const terdaftar = new Set([...diuji, ...belum, ...kecuali]);
  const tak = [...kode, "POST /api/rute-sintetis-jahat"].filter((k) => !terdaftar.has(k));
  assert.deepEqual(tak, ["POST /api/rute-sintetis-jahat"]);
});
