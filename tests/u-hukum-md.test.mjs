// u-hukum-md.test.mjs (JM-U01/U06): berkas hukum/**/*.md valid, id unik, relasi dua arah konsisten, tanpa data pribadi.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, relative, sep } from "node:path";
import { bacaBerkas, adaDataPribadi, KUNCI } from "../scripts/hukum/md.mjs";

const AKAR = new URL("../hukum/", import.meta.url).pathname;
const jalan = (d) => readdirSync(d).flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? jalan(p) : p.endsWith(".md") && n !== "README.md" ? [p] : []; });
const berkas = jalan(AKAR).map((p) => ({ p, ...bacaBerkas(readFileSync(p, "utf-8")) }));
const STATUS = ["berlaku", "diubah", "dicabut", "dicabut_sebagian", "rancangan", "tidak_diketahui"];
const TGL = /^\d{4}-\d{2}-\d{2}$/;

test("ada berkas dan ukuran total <= 60 MB", () => {
  assert.ok(berkas.length >= 50);
  const tot = berkas.reduce((a, b) => a + statSync(b.p).size, 0);
  assert.ok(tot <= 60 * 1024 * 1024, `ukuran ${tot}`);
});

test("frontmatter valid: kunci lengkap berurutan, tipe, jalur = jenis/tahun/id", () => {
  for (const { p, fm } of berkas) {
    assert.deepEqual(Object.keys(fm), KUNCI, p);
    assert.match(fm.id, /^[a-z0-9]+(-[a-z0-9]+)+$/, p);
    assert.equal(relative(AKAR, p).split(sep).join("/"), `${fm.id.split("-")[0]}/${fm.tahun}/${fm.id}.md`);
    assert.equal(typeof fm.nomor, "string");
    assert.ok(Number.isInteger(fm.tahun));
    assert.ok(STATUS.includes(fm.status), p);
    for (const k of ["tgl_tetap", "tgl_undang", "mulai", "selesai"]) assert.ok(fm[k] === null || TGL.test(fm[k]), `${p} ${k}`);
    assert.match(fm.status_per, TGL);
    for (const k of ["mencabut", "mengubah", "mengganti", "mengingat", "merujuk", "diubah_oleh", "topik"]) assert.ok(Array.isArray(fm[k]), `${p} ${k}`);
    assert.match(fm.sumber.pdf_sha256 ?? "0".repeat(64), /^[0-9a-f]{64}$/);
    assert.equal(fm.resmi, false);
    assert.equal(fm.lisensi.dasar, "UU 28/2014 Pasal 42");
    assert.equal(fm.md_sha256, createHash("sha256").update(berkas.find((b) => b.p === p).badan).digest("hex"), p);
  }
});

test("id unik", () => {
  assert.equal(new Set(berkas.map((b) => b.fm.id)).size, berkas.length);
});

test("relasi dua arah: A.mencabut memuat B <=> B.dicabut_oleh memuat A (juga mengubah/diubah_oleh)", () => {
  const per = new Map(berkas.map((b) => [b.fm.id, b.fm]));
  for (const [id, fm] of per) {
    for (const [maju, balik] of [["mencabut", "dicabut_oleh"], ["mengubah", "diubah_oleh"]]) {
      for (const k of fm[maju]) if (per.has(k)) assert.ok((per.get(k)[balik] || []).includes(id), `${id} ${maju} ${k}`);
      for (const k of fm[balik] || []) assert.ok(per.has(k) && per.get(k)[maju].includes(id), `${id} ${balik} ${k}`);
    }
  }
});

test("tanpa pola surel/telepon/NIK", () => {
  for (const { p, badan } of berkas) assert.ok(!adaDataPribadi(badan), p);
});

test("adaDataPribadi mengenali contoh", () => {
  for (const s of ["budi@gmail.com", "hubungi 0812-3456-7890", "3201234567890001"]) assert.ok(adaDataPribadi(s), s);
  for (const s of ["Pasal 5 ayat (2) Nomor 30 Tahun 2009", "Telepon (0541) 733333 humas@kaltimprov.go.id", "NIP 196 0905 199101 1 004", "1,085 27125000 MIKROBUS"]) assert.ok(!adaDataPribadi(s), s);
});
