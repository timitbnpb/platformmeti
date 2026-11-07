// /program: skema potret program_analisis (sumber tulisan tangan -> pipeline -> publik), 15 program minimal, rute /program/<kode>.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { bangun, KELOMPOK, TAHAP, JENIS_ISU, TINGKAT } from "../scripts/pipa/program_analisis.mjs";
import worker, { halamanProgram } from "../src/worker.js";

const P = new URL("../public/", import.meta.url), R = new URL("../", import.meta.url);
const baca = (u, f) => readFileSync(new URL(f, u), "utf8");
const pub = JSON.parse(baca(P, "data/program_analisis.json"));
const sumber = JSON.parse(baca(R, "data/program_analisis.json"));
const MINIMAL = ["plts-100gw", "wte", "dedieselisasi", "b50", "e20", "ruptl", "psn", "jetp", "pensiun-dini-pltu", "panas-bumi", "plts-atap", "kendaraan-listrik", "hidrogen-hijau", "nuklir", "co-firing", "super-grid"];
const pasang = (x) => x && typeof x.id === "string" && typeof x.en === "string" && x.id && x.en;

test("semua program minimal ada, kode unik", () => {
  const kode = pub.baris.map((g) => g.kode);
  assert.equal(new Set(kode).size, kode.length);
  for (const k of MINIMAL) assert.ok(kode.includes(k), k);
  assert.equal(pub.jumlah, pub.baris.length);
});

test("skema per program: bidang wajib, tahap, kelompok, isu berlabel, tiap butir bersumber https", () => {
  for (const g of pub.baris) {
    assert.ok(pasang(g.nama) && pasang(g.ringkasan) && pasang(g.tahap_ket), g.kode);
    assert.ok(TAHAP.includes(g.tahap), g.kode);
    assert.ok(g.isu.length >= 3, `${g.kode}: isu kurang`);
    assert.ok(g.tonggak.length >= 3, `${g.kode}: tonggak kurang`);
    assert.ok(g.pelaksana.length >= 4, `${g.kode}: pemangku kurang`);
    assert.ok(g.indikator.length >= 3 && g.indikator.every(pasang), g.kode);
    assert.ok(g.dasar_hukum.length >= 1, g.kode);
    assert.ok(g.posisi_meti.length >= 1 && g.posisi_meti.every((x) => pasang(x.teks) && x.sumber), g.kode);
    for (const x of g.pelaksana) assert.ok(KELOMPOK.includes(x.kel) && pasang(x.peran) && x.nama, `${g.kode}: ${x.nama}`);
    for (const x of g.isu) assert.ok(JENIS_ISU.includes(x.jenis) && TINGKAT.includes(x.tingkat) && pasang(x.judul) && pasang(x.uraian), `${g.kode}: isu`);
    for (const lst of [g.target, g.tonggak, g.realisasi, g.isu, g.pendanaan, g.berita]) for (const x of lst) assert.match(x.url, /^https:\/\//, `${g.kode}: url`);
    for (const x of g.target) assert.ok(pasang(x.label) && pasang(x.satuan) && x.angka, g.kode);
    assert.ok(g.pendanaan.length || g.pendanaan_catatan, `${g.kode}: pendanaan kosong tanpa catatan`);
  }
});

test("regulasi yang disebut dan tak ada di basis dicatat, bukan dikarang; organisasi dan orang valid", () => {
  const reg = new Set(JSON.parse(baca(P, "data/regulasi.json")).baris.map((r) => r.id));
  for (const g of pub.baris) for (const h of g.dasar_hukum) assert.equal(!!h.reg_id, h.reg_id ? reg.has(h.reg_id) : false, `${g.kode}: ${h.nama}`);
  const diminta = sumber.program.flatMap((g) => g.dasar_hukum.filter((h) => h.reg && !reg.has(h.reg)).map((h) => ({ program: g.kode, reg: h.reg })));
  assert.deepEqual(pub.meta.catatan_regulasi, diminta);
  const org = new Set(JSON.parse(baca(P, "data/organisasi.json")).baris.map((o) => o.id));
  for (const g of pub.baris) for (const x of g.pelaksana) if (x.org_id) assert.ok(org.has(x.org_id), x.org_id);
});

test("data publik tanpa em dash, titik tengah, atau teks kapital penuh panjang", () => {
  const s = baca(P, "data/program_analisis.json");
  assert.doesNotMatch(s, /[—·]/);
  for (const g of pub.baris) for (const n of [g.nama.id, g.nama.en]) assert.ok(!((n.match(/[A-Za-z]+/g) || []).length >= 3 && n === n.toUpperCase()), n);
});

test("bangun() deterministik dan menolak kode ganda, tahap atau kelompok salah", () => {
  const d = { proyek: [], regulasi: [], organisasi: [], orang: [], berita: [], berita_foto: {}, siaran: [] };
  const mini = { meta: { diperbarui: "2026-11-08" }, program: [{ kode: "x", nama: ["N", "N"], ikon: "surya", tahap: "rencana", tahap_ket: ["a", "a"], ringkasan: ["r", "r"], pelaksana: [] }] };
  assert.deepEqual(bangun(mini, d), bangun(mini, d));
  assert.throws(() => bangun({ ...mini, program: [mini.program[0], mini.program[0]] }, d), /ganda/);
  assert.throws(() => bangun({ ...mini, program: [{ ...mini.program[0], tahap: "salah" }] }, d), /tahap/);
  assert.throws(() => bangun({ ...mini, program: [{ ...mini.program[0], pelaksana: [{ kel: "aneh", nama: "z", peran: ["a", "a"] }] }] }, d), /kelompok/);
});

test("kunci i18n pg.* setara id dan en; program.html memuat aset yang ada", () => {
  const id = JSON.parse(baca(P, "i18n/id.json")), en = JSON.parse(baca(P, "i18n/en.json"));
  const ks = Object.keys(id).filter((k) => k.startsWith("pg."));
  assert.ok(ks.length > 80);
  for (const k of ks) assert.ok(en[k], k);
  for (const m of baca(P, "program.html").matchAll(/(?:src|href)="(\/[^"#]+)"/g)) assert.ok(existsSync(new URL("." + m[1], P)), m[1]);
});

/* ---------- rute ---------- */

const ASSETS = { fetch: async (req) => {
  const { pathname } = new URL(req.url);
  const berkas = pathname.startsWith("/data/") ? pathname.slice(1) : pathname === "/program" ? "program.html" : null;
  if (!berkas || !existsSync(new URL(berkas, P))) return new Response("x", { status: 404 });
  return new Response(baca(P, berkas), { status: 200, headers: { "content-type": berkas.endsWith(".json") ? "application/json" : "text/html; charset=utf-8" } });
} };
const env = { ASSETS };
const url = (p) => new URL("https://x.test" + p);

test("/program/<kode> memberi cangkang dengan <title> program; kode tak dikenal 404", async () => {
  const ok = await halamanProgram(new Request(url("/program/plts-100gw")), env, url("/program/plts-100gw"), "plts-100gw");
  assert.equal(ok.status, 200);
  const h = await ok.text();
  assert.match(h, /<title>PLTS 100 GW \(desa dan koperasi\) \| Program energi METI<\/title>/);
  assert.doesNotMatch(h, /<title[^>]*data-i18n/);
  assert.equal((await halamanProgram(new Request(url("/program/tidak-ada")), env, url("/program/tidak-ada"), "tidak-ada")).status, 404);
  assert.equal((await halamanProgram(new Request(url("/program/plts-100gw")), { ASSETS: { fetch: async () => new Response("x", { status: 500 }) } }, url("/program/plts-100gw"), "plts-100gw")).status, 404);
});

test("tamu diarahkan masuk dari /program dan /program/<kode> (seluruh situs di balik login)", async () => {
  for (const p of ["/program", "/program/b50"]) {
    const r = await worker.fetch(new Request(url(p)), env, {});
    assert.equal(r.status, 302, p);
    assert.match(r.headers.get("location"), /^\/masuk\?ke=/);
  }
});
