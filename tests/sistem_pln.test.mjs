// Sistem PLN, kawasan industri/KEK, dan peta politik energi DPR: bentuk data, rentang angka, celah jujur, dan rakitan deterministik.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { SISTEM } from "../scripts/panen/sistem_pln.mjs";
import { rakit as rakitKawasan } from "../scripts/panen/kawasan_profil.mjs";
import { rakit as rakitDpr, FRAKSI } from "../scripts/panen/dpr_energi.mjs";

const j = (f) => JSON.parse(readFileSync(new URL("../public/data/" + f, import.meta.url), "utf8"));
const teks = (f) => readFileSync(new URL("../public/" + f, import.meta.url), "utf8");

test("sistem_pln: 10 sistem, provinsi tidak tumpang tindih, deret 10 tahun, susut tidak dikarang", () => {
  const d = j("sistem_pln.json");
  assert.equal(d.baris.length, 10);
  assert.deepEqual(d.baris.map((s) => s.id), SISTEM.map((s) => s.id));
  const semua = d.baris.flatMap((s) => s.provinsi.map((p) => p.kode));
  assert.equal(new Set(semua).size, semua.length, "provinsi ganda antar sistem");
  for (const s of d.baris) {
    assert.ok(s.provinsi.every((p) => p.nama), s.id);
    assert.equal(s.susut_persen, null, "susut per sistem tidak terbit");
    if (s.rm_persen) assert.equal(s.rm_persen.length, 10);
    if (s.beban_puncak_mw) assert.equal(s.beban_puncak_mw.length, 10);
    const jenis = ["batubara", "gas", "diesel", "hidro", "bayu", "bioenergi", "panas-bumi", "surya", "lain"].reduce((a, k) => a + s.kapasitas_mw[k], 0);
    assert.ok(Math.abs(jenis - s.kapasitas_mw.total) <= 12, `${s.id}: jumlah jenis ${jenis} vs total ${s.kapasitas_mw.total}`);
    assert.ok(s.bauran_ebt_persen >= 0 && s.bauran_ebt_persen <= 100, s.id);
    for (const y of Object.keys(s.ruptl.per_tahun)) assert.ok(+y >= 2025 && +y <= 2034);
    assert.ok(s.bpp.length > 0, s.id);
  }
  assert.ok(d.meta.celah.some((c) => /Susut/.test(c)) && d.meta.celah.some((c) => /BPP/.test(c)));
  assert.ok(d.interkoneksi.every((x) => x.cod === null && /^https:/.test(x.url)));
});
test("kawasan_industri: 141 baris tertaut ke kawasan.json, yang diriset punya sumber, pengelola org_id valid", () => {
  const d = j("kawasan_industri.json"), kw = j("kawasan.json"), org = new Set(j("organisasi.json").baris.map((o) => o.id));
  assert.equal(d.baris.length, kw.baris.length);
  assert.deepEqual(d.baris.map((r) => r.id), kw.baris.map((r) => r.id));
  assert.equal(d.meta.jumlah_kek, 25);
  for (const r of d.baris) {
    if (r.pengelola_org_id) assert.ok(org.has(r.pengelola_org_id), r.id);
    if (r.diriset) assert.ok(r.sumber.length > 0, r.id);
    else { assert.equal(r.listrik_kini, null); assert.deepEqual(r.tenant, []); }
    if (r.captive) assert.ok(r.captive.mw_operasi >= 0);
  }
  const gresik = d.baris.find((r) => r.id === "kek_gresik");
  assert.equal(gresik.kebutuhan_mva, 239.5);
  assert.equal(rakitKawasan().baris.length, d.baris.length);
});
test("dpr_energi: 45 anggota, tanpa kontak, Mukhtarudin dikeluarkan, semua sikap bersumber dan bertanggal", () => {
  const d = j("dpr_energi.json");
  assert.equal(d.anggota.length, 45);
  assert.equal(new Set(d.anggota.map((a) => a.id)).size, 45);
  assert.ok(!d.anggota.some((a) => /Mukhtarudin/.test(a.nama)));
  assert.equal(d.anggota.filter((a) => a.jabatan === "ketua").length, 1);
  assert.equal(d.anggota.filter((a) => a.jabatan === "wakil").length, 4);
  assert.deepEqual(d.fraksi.map((f) => f.id), FRAKSI.map((f) => f.id));
  assert.equal(d.fraksi.reduce((a, f) => a + f.jumlah, 0), 45);
  assert.ok(d.anggota.every((a) => a.kode_provinsi && FRAKSI.some((f) => f.id === a.fraksi)));
  const kunci = JSON.stringify(d);
  assert.ok(!/@[a-z0-9-]+\.[a-z]{2,}|\b0\d{9,12}\b|whatsapp|foto/i.test(kunci.replace(/foto resmi[^"]*/gi, "")), "data kontak atau foto bocor");
  for (const s of d.sikap) {
    assert.ok(d.anggota.some((a) => a.id === s.anggota), s.id);
    assert.match(s.tanggal, /^\d{4}-\d{2}(-\d{2})?$/);
    assert.ok(d.sumber[s.sumber_id]?.url?.startsWith("https://"), s.id);
    assert.ok(!/antaranews/.test(d.sumber[s.sumber_id].url), "Antara tidak dipakai");
    assert.ok(s.parafrase.id && s.parafrase.en);
    assert.ok(s.topik.length > 0);
  }
  assert.deepEqual(rakitDpr().anggota, d.anggota);
});
test("halaman: berkas ada, tanpa style= dan tanpa hex di CSS/JS, rute worker terdaftar", () => {
  for (const f of ["sistem", "kawasan", "dpr-energi"]) {
    assert.ok(existsSync(new URL(`../public/${f}.html`, import.meta.url)) && existsSync(new URL(`../public/${f}.js`, import.meta.url)) && existsSync(new URL(`../public/${f}.css`, import.meta.url)), f);
    assert.ok(!/\sstyle=/.test(teks(f + ".html")), f + ".html style=");
    assert.ok(!/#[0-9a-fA-F]{3,8}\b/.test(teks(f + ".css") + teks(f + ".js")), f + " hex");
  }
  assert.ok(!/#[0-9a-fA-F]{3,8}\b/.test(teks("sistem.css") + teks("sistem_umum.js")));
  const w = readFileSync(new URL("../src/worker.js", import.meta.url), "utf8");
  assert.match(w, /\(sistem\|kawasan\)/);
  const kepala = teks("inti/kepala.js");
  for (const h of ["/sistem", "/kawasan", "/dpr-energi"]) assert.ok(kepala.includes(`href: "${h}"`), h);
});
