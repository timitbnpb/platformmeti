// saya.test.mjs: dasbor "METI untuk saya" (G3). Logika cocok murni diuji terhadap potret data NYATA di public/data;
// rute lewat worker.fetch utuh dengan D1 lokal nyata (ikuti + profil -> kelengkapan, lonceng turun setelah /lihat).
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buatEnv } from "./_bantu.mjs";
import worker from "../src/worker.js";
import { sha, acak } from "../src/util.js";
import * as C from "../public/saya_cocok.js";

const data = (n) => JSON.parse(readFileSync(new URL(`../public/data/${n}.json`, import.meta.url), "utf8"));
const ORG = data("organisasi").baris, SKEMA = data("pendanaan").pendanaan, PROYEK = data("proyek").baris, KAL = data("kalender").baris;
const TOPIK = data("topik/indeks").topik.map((x) => x.id);
const swasta = ORG.find((o) => o.kategori.kode === "swasta" && o.kepakaran?.includes("surya"));

test("data nyata: tiap topik di KEPAKARAN_TOPIK ada di indeks topik; tiap kategori organisasi punya sasaran", () => {
  for (const [k, v] of Object.entries(C.KEPAKARAN_TOPIK)) assert.ok(TOPIK.includes(v), `${k} -> ${v}`);
  for (const k of new Set(ORG.map((o) => o.kategori.kode))) assert.ok(k in C.SASARAN_KATEGORI, "kategori tanpa pemetaan sasaran: " + k);
});

test("cocokSkema: sasaran (3) + sektor (1 per sama), alasan ikut, urut skor; tanpa organisasi dan sektor kosong", () => {
  const r = C.cocokSkema(SKEMA, { org: swasta, profil: {} });
  assert.ok(r.length > 0);
  for (let i = 1; i < r.length; i++) assert.ok(r[i - 1].skor >= r[i].skor);
  for (const x of r) assert.ok(x.skor === (x.sasaran.length ? 3 : 0) + x.sektor.length && x.skor > 0);
  assert.ok(r.some((x) => x.sasaran.length && x.sektor.includes("surya")), "ada skema cocok sasaran dan sektor surya");
  assert.deepEqual(C.cocokSkema(SKEMA, { org: undefined, profil: {} }), []);
  const hanyaSektor = C.cocokSkema(SKEMA, { org: undefined, profil: { keahlian: ["Surya", "bebas teks"] } });
  assert.ok(hanyaSektor.length && hanyaSektor.every((x) => x.sasaran.length === 0 && x.sektor.includes("surya")), "keahlian slug dikenal memberi sektor, teks bebas diabaikan");
  assert.ok(!C.cocokSkema([{ jenis_entri: "skema", nama: "x", status: "selesai", sasaran: ["swasta"], sektor: ["surya"] }], { org: swasta, profil: {} }).length, "skema selesai tidak ikut");
});

test("cocokKerja: teknologi (2) di atas provinsi (1); tak cocok dibuang", () => {
  const b = [{ id: 1, teknologi: "bayu", kode_prov: "11" }, { id: 2, teknologi: "surya", kode_prov: "12" }, { id: 3, teknologi: "hidro", kode_prov: "99" }, { id: 4, teknologi: "surya", kode_prov: "11" }];
  assert.deepEqual(C.cocokKerja(b, { kodeProv: "11", sektor: ["surya"] }).map((r) => r.x.id), [4, 2, 1]);
  assert.deepEqual(C.cocokKerja(b, { kodeProv: null, sektor: [] }), []);
});

test("acaraTerdekat: hanya hari ini ke depan, terdekat dulu; diskusiTerbuka: diikuti dulu, lewat tenggat dibuang", () => {
  const a = C.acaraTerdekat(KAL, "2026-11-08", ["l_41bf1f0b41"]);
  assert.ok(a.every((r) => r.x.tanggal >= "2026-11-08"));
  for (let i = 1; i < a.length; i++) assert.ok(a[i - 1].x.tanggal <= a[i].x.tanggal);
  assert.equal(C.acaraTerdekat(KAL, "2999-01-01").length, 0);
  const k = [
    { id: "a", status: "terbit", tenggat: "2026-12-01", n_komentar: 1, n_usulan: 0 }, { id: "b", status: "terbit", tenggat: "2026-11-01", n_komentar: 9, n_usulan: 0 },
    { id: "c", status: "terbit", tenggat: null, n_komentar: 0, n_usulan: 0, diikuti: true }, { id: "d", status: "draf", tenggat: "2027-01-01", n_komentar: 0, n_usulan: 0 },
    { id: "e", status: "terbit", tenggat: "2026-11-20", n_komentar: 0, n_usulan: 0 }];
  assert.deepEqual(C.diskusiTerbuka(k, "2026-11-08").map((d) => d.id), ["c", "e", "a"]);
});

test("proyekBaru: hanya provinsi/teknologi yang diikuti, id terbaru dulu", () => {
  const prov = PROYEK.find((p) => p.lokasi?.provinsi)?.lokasi.provinsi;
  const r = C.proyekBaru(PROYEK, { provNama: [prov.toUpperCase()], teknologi: [] });
  assert.ok(r.length && r.every((x) => x.prov && x.x.lokasi.provinsi === prov));
  const no = (x) => Number(x.x.id.replace(/\D/g, ""));
  for (let i = 1; i < r.length; i++) assert.ok(no(r[i - 1]) >= no(r[i]));
  assert.deepEqual(C.proyekBaru(PROYEK, {}), []);
});

test("saranOrganisasi tidak memuat diri sendiri atau yang diikuti; saranTopik hanya topik ada dan belum diikuti", () => {
  const ikut = new Set(["organisasi|" + ORG.find((o) => o.id !== swasta.id && o.kategori.kode === "swasta").id]);
  const s = C.saranOrganisasi(ORG, swasta, ikut);
  assert.ok(s.length && s.length <= 6);
  assert.ok(s.every((r) => r.x.id !== swasta.id && !ikut.has("organisasi|" + r.x.id) && r.skor >= 2));
  assert.deepEqual(C.saranOrganisasi(ORG, undefined, new Set()), []);
  assert.deepEqual(C.saranTopik(["surya", "bayu", "tak-dikenal"], TOPIK, new Set(["topik|surya"])), ["bayu"]);
});

test("kelengkapan: delapan butir, riwayat dihitung dari pengalaman atau pendidikan", () => {
  assert.equal(C.kelengkapan({}).length, 8);
  assert.ok(C.kelengkapan({}).every((c) => c[1] === false));
  const lengkap = C.kelengkapan({ foto: 1, jabatan: "x", instansi: "y", organisasi_id: "o", kota: "Bandung", bio: "b", keahlian: ["surya"], tautan: { situs: "https://x.id" }, riwayat: { pengalaman: [{}] } });
  assert.ok(lengkap.every((c) => c[1]));
});

test("terbaruPerEntitas: satu item terbaru per entitas", () => {
  const m = C.terbaruPerEntitas([{ jenis: "organisasi", ref: "a", waktu: 5 }, { jenis: "organisasi", ref: "a", waktu: 9 }, { jenis: "proyek", ref: "a", waktu: 1 }]);
  assert.equal(m.size, 2);
  assert.equal(m.get("organisasi|a").waktu, 9);
});

/* ---------- rute: worker utuh + D1 lokal ---------- */
let E, tutup;
const sesi = {};
const ASSETS = { fetch: async (req) => {
  const n = new URL(req.url).pathname;
  if (n === "/saya" || n === "/saya.html") return new Response("<!doctype html><title>saya</title>", { headers: { "content-type": "text/html" } });
  return new Response("x", { status: 404 });
} };
async function masuk(nama) {
  const r = await E.DB.prepare("INSERT INTO akun (surel, nama, peran, status, garam, sandi, iterasi) VALUES (?,?, 'anggota', 'aktif', ?, ?, 100000)").bind(`${nama}@uji.test`, nama, "a".repeat(32), "a".repeat(64)).run();
  const token = acak(32);
  await E.DB.prepare("INSERT INTO sesi (id_hash, akun_id, sampai) VALUES (?,?,?)").bind(await sha(token), r.meta.last_row_id, Math.floor(Date.now() / 1000) + 3600).run();
  sesi[nama] = "sesi=" + token;
}
const minta = async (jalur, { metode = "GET", json, nama, manual } = {}) => {
  const h = { origin: "https://uji.test", "cf-connecting-ip": "203.0.113.9" };
  if (nama) h.cookie = sesi[nama];
  if (metode !== "GET") h["x-pb"] = "1";
  if (json) h["content-type"] = "application/json";
  const r = await worker.fetch(new Request("https://uji.test" + jalur, { method: metode, headers: h, body: json ? JSON.stringify(json) : undefined, redirect: manual ? "manual" : "follow" }), E, { waitUntil() {} });
  return { status: r.status, lokasi: r.headers.get("location"), j: await r.clone().json().catch(() => ({})) };
};
before(async () => { ({ env: E, tutup } = await buatEnv({ tambahan: { ASSETS } })); await masuk("sari"); });
after(async () => { await tutup?.(); });

test("/saya: tamu dialihkan ke masuk dengan tujuan /saya; anggota mendapat halaman", async () => {
  const g = await minta("/saya", { manual: true });
  assert.equal(g.status, 302);
  assert.equal(g.lokasi, "/masuk?ke=" + encodeURIComponent("/saya"));
  assert.equal((await minta("/saya", { nama: "sari" })).status, 200);
});

test("sumber data dasbor: profil + ikuti + ringkasan + kerja + konsultasi terbaca anggota; lonceng turun sesudah /lihat", async () => {
  assert.equal((await minta("/api/profil/saya", { metode: "PUT", json: { organisasi_id: swasta.id, keahlian: ["surya"], kode_prov: "32", jabatan: "Direktur", instansi: "PT Uji" }, nama: "sari" })).status, 200);
  const p = (await minta("/api/profil/saya", { nama: "sari" })).j;
  const k = C.kelengkapan(p);
  assert.equal(p.organisasi_id, swasta.id);
  assert.deepEqual(k.filter((c) => c[1]).map((c) => c[0]).sort(), ["jabatan", "keahlian", "lokasi", "organisasi"]);
  for (const [jenis, ref] of [["organisasi", swasta.id], ["provinsi", "32"], ["topik", "surya"]]) assert.equal((await minta("/api/ikuti", { metode: "POST", json: { jenis, ref }, nama: "sari" })).status, 201);
  const d = (await minta("/api/ikuti", { nama: "sari" })).j;
  assert.deepEqual(d.baris.map((x) => x.jenis).sort(), ["organisasi", "provinsi", "topik"]);
  for (const j of ["/api/ikuti/ringkasan", "/api/kerja", "/api/konsultasi"]) assert.equal((await minta(j, { nama: "sari" })).status, 200, j);
  assert.equal((await minta("/api/ikuti/lihat", { metode: "POST", json: {}, nama: "sari" })).status, 200);
  assert.equal((await minta("/api/ikuti", { nama: "sari" })).j.baru, 0);
  for (const j of ["/api/ikuti", "/api/ikuti/ringkasan", "/api/kerja", "/api/konsultasi"]) assert.equal((await minta(j)).status, 401, "tamu " + j);
});
