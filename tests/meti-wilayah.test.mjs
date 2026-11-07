// METI Wilayah (0015): tamu 302/401, akun 200, ajuan, admin setuju tiap tahap, 403 non-admin, tanpa kontak pribadi di respons umum. D1 lokal nyata.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buatEnv, minta } from "./_bantu.mjs";
import worker from "../src/worker.js";
import { sha, acak } from "../src/util.js";

let E, tutup;
const sesi = {}, ID = {};
const OBJ = new Map();
const R2 = { put: async (k, v) => { OBJ.set(k, v); }, get: async (k) => (OBJ.has(k) ? { body: OBJ.get(k) } : null), delete: async (k) => { OBJ.delete(k); } };
async function masuk(peran) {
  const r = await E.DB.prepare("INSERT INTO akun (surel, nama, peran, status, garam, sandi, iterasi) VALUES (?,?,?, 'aktif', ?, ?, 100000)").bind(`${peran}@uji.test`, "Nama " + peran, peran, "a".repeat(32), "a".repeat(64)).run();
  const token = acak(32);
  await E.DB.prepare("INSERT INTO sesi (id_hash, akun_id, sampai) VALUES (?,?,?)").bind(await sha(token), r.meta.last_row_id, Math.floor(Date.now() / 1000) + 3600).run();
  sesi[peran] = "sesi=" + token; ID[peran] = r.meta.last_row_id;
}
const res = (jalur, metode, peran, badan, header = {}) => {
  const raw = badan instanceof Uint8Array;
  const q = minta(jalur, { metode, badan: raw ? undefined : badan, cookie: peran ? sesi[peran] : undefined, header });
  return worker.fetch(raw ? new Request(q, { body: badan, headers: { ...Object.fromEntries(q.headers), "content-type": "application/pdf" } }) : q, E, { waitUntil() {} });
};
const panggil = async (...a) => { const r = await res(...a), t = await r.text(); let j = {}; try { j = t ? JSON.parse(t) : {}; } catch { /* bukan json */ } return { status: r.status, ...j, teks: t }; };
const AJUAN = { kode: "14", ketua: "Calon Ketua", sekretaris: "Calon Sekretaris", bendahara: "Calon Bendahara", sekretariat: "Kampus Uji, Pekanbaru", formatur: ["Formatur Satu"], bidang: ["kebijakan", "riset-sdm"], kontak: "0812-0000-1111" };
const PDF = new Uint8Array([0x25, 0x50, 0x44, 0x46, 1, 2, 3]);

before(async () => {
  ({ env: E, tutup } = await buatEnv());
  E.BERKAS = R2;
  E.ASSETS = { fetch: async (req) => {
    const p = new URL(req.url).pathname;
    if (p === "/meti-wilayah") return new Response("<html><head><title>x</title></head></html>", { headers: { "content-type": "text/html" } });
    return new Response("aset:" + p);
  } };
  for (const p of ["anggota", "admin"]) await masuk(p);
});
after(async () => { await tutup?.(); });

test("tamu: halaman 302 ke masuk, API 401", async () => {
  for (const j of ["/meti-wilayah", "/meti-wilayah/21"]) { const r = await res(j, "GET", null); assert.equal(r.status, 302, j); assert.match(r.headers.get("location"), /^\/masuk\?ke=/); }
  for (const [m, j] of [["GET", "/api/meti-wilayah"], ["GET", "/api/meti-wilayah/21"], ["POST", "/api/meti-wilayah/ajuan"], ["GET", "/api/admin/meti-wilayah"]]) assert.equal((await res(j, m, null, m === "POST" ? {} : undefined)).status, 401, j);
});

test("akun: halaman 200, judul SSR dari katalog, kode asing 404", async () => {
  assert.equal((await res("/meti-wilayah", "GET", "anggota")).status, 200);
  const r = await res("/meti-wilayah/21", "GET", "anggota");
  assert.equal(r.status, 200); assert.match(await r.text(), /<title>METI Wilayah Kepulauan Riau \| Direktori METI<\/title>/);
  assert.equal((await res("/meti-wilayah/99", "GET", "anggota")).status, 404);
  assert.equal((await res("/meti-wilayah/<x>", "GET", "anggota")).status, 404);
});

test("daftar: nilai awal 6 berdiri 5 segera, sumber dan tanggal, tanpa kolom pribadi", async () => {
  const r = await panggil("/api/meti-wilayah", "GET", "anggota");
  assert.equal(r.status, 200);
  assert.deepEqual(r.hitung, { berdiri: 6, segera: 5, rencana: 0, belum: 27 });
  assert.equal(r.sumber, "Aspirasi RDPU hlm 4"); assert.equal(r.status_per, "2026-09-08");
  assert.ok(r.versi_angka.length === 3);
  assert.ok(!/diubah_oleh|akun_id|surel_pribadi/.test(r.teks));
});

test("profil Kepri dari draft SK; provinsi tanpa baris = wilayah null", async () => {
  const k = await panggil("/api/meti-wilayah/21", "GET", "anggota");
  assert.equal(k.nama, "Kepulauan Riau"); assert.match(k.wilayah.sekretariat, /Polibatam/); assert.equal(k.wilayah.masa_bakti, "2026-2028"); assert.equal(k.wilayah.bidang.length, 4); assert.equal(k.wilayah.sk_nomor, null);
  assert.equal((await panggil("/api/meti-wilayah/14", "GET", "anggota")).wilayah, null);
  assert.equal((await panggil("/api/meti-wilayah/99", "GET", "anggota")).status, 404);
});

test("ajuan: validasi, provinsi berdiri ditolak, satu terbuka per provinsi", async () => {
  for (const salah of [{ ...AJUAN, kode: "99" }, { ...AJUAN, ketua: "" }, { ...AJUAN, bidang: [] }, { ...AJUAN, formatur: "x" }, { ...AJUAN, sekretariat: "a\u0000b" }])
    assert.equal((await panggil("/api/meti-wilayah/ajuan", "POST", "anggota", salah)).status, 422);
  assert.equal((await panggil("/api/meti-wilayah/ajuan", "POST", "anggota", { ...AJUAN, kode: "21" })).status, 409);
  const a = await panggil("/api/meti-wilayah/ajuan", "POST", "anggota", AJUAN);
  assert.equal(a.status, 201); ID.ajuan = a.id;
  assert.equal((await panggil("/api/meti-wilayah/ajuan", "POST", "anggota", AJUAN)).status, 409);
  const j = await E.DB.prepare("SELECT aksi, peran, ke FROM jejak WHERE tabel = 'meti_wilayah_ajuan' AND baris_id = ?").bind(String(a.id)).first();
  assert.equal(j.aksi, "tambah"); assert.ok(!/0812/.test(j.ke));
});

test("kontak pribadi pengaju tidak muncul di respons umum; pemilik dan admin boleh", async () => {
  for (const j of ["/api/meti-wilayah", "/api/meti-wilayah/14", "/api/meti-wilayah/ajuan/saya"]) {
    const r = await panggil(j, "GET", "anggota");
    assert.ok(!/0812|Calon Ketua|anggota@uji/.test(r.teks), j);
  }
  assert.equal((await panggil("/api/meti-wilayah/14", "GET", "anggota")).ajuan_saya[0].status, "diajukan");
  assert.match((await panggil("/api/admin/meti-wilayah", "GET", "admin")).teks, /0812/);
});

test("unggah berkas: tipe lewat magic byte, dibaca pemilik dan admin, bukan akun lain", async () => {
  assert.equal((await panggil(`/api/meti-wilayah/ajuan/${ID.ajuan}/berkas?nama=draft%20sk.pdf`, "POST", "anggota", new Uint8Array([1, 2, 3, 4]))).status, 422);
  assert.equal((await panggil(`/api/meti-wilayah/ajuan/${ID.ajuan}/berkas?nama=draft%20sk.pdf`, "POST", "admin", PDF)).status, 404);
  assert.equal((await panggil(`/api/meti-wilayah/ajuan/${ID.ajuan}/berkas?nama=draft%20sk.pdf`, "POST", "anggota", PDF)).status, 201);
  assert.ok([...OBJ.keys()].some((k) => k.startsWith(`meti-wilayah/${ID.ajuan}/`) && k.endsWith(".pdf")));
  assert.equal((await res(`/api/meti-wilayah/ajuan/${ID.ajuan}/berkas/0`, "GET", "anggota")).status, 200);
  assert.equal((await res(`/api/meti-wilayah/ajuan/${ID.ajuan}/berkas/0`, "GET", "admin")).status, 200);
  assert.equal((await res(`/api/meti-wilayah/ajuan/${ID.ajuan}/berkas/1`, "GET", "anggota")).status, 404);
});

test("non-admin 403 di rute admin", async () => {
  assert.equal((await res("/api/admin/meti-wilayah", "GET", "anggota")).status, 403);
  assert.equal((await res("/api/admin/meti-wilayah/14", "PATCH", "anggota", { status: "rencana" })).status, 403);
  assert.equal((await res(`/api/admin/meti-wilayah/ajuan/${ID.ajuan}/tahap`, "POST", "anggota", { ke: "ditinjau" })).status, 403);
});

test("admin menyetujui tiap tahap berurutan; lompat tahap ditolak; jejak tercatat", async () => {
  const tahap = (ke, x = {}) => panggil(`/api/admin/meti-wilayah/ajuan/${ID.ajuan}/tahap`, "POST", "admin", { ke, ...x });
  assert.equal((await tahap("sk_terbit")).status, 409);
  assert.equal((await tahap("ditinjau")).status, 200);
  assert.equal((await E.DB.prepare("SELECT status FROM meti_wilayah WHERE kode_prov = '14'").first()).status, "rencana");
  assert.equal((await tahap("ditinjau")).status, 409);
  assert.equal((await tahap("sk_terbit", { sk_nomor: "0099/SK/METI/XI/2026", sk_tanggal: "2026-11-20", masa_bakti: "2026-2028" })).status, 200);
  assert.equal((await tahap("pelantikan", { tgl_pelantikan: "2026-12-15" })).status, 200);
  assert.equal((await E.DB.prepare("SELECT status FROM meti_wilayah WHERE kode_prov = '14'").first()).status, "segera");
  assert.equal((await tahap("berdiri")).status, 200);
  const w = (await panggil("/api/meti-wilayah/14", "GET", "anggota")).wilayah;
  assert.equal(w.status, "berdiri"); assert.equal(w.ketua, "Calon Ketua"); assert.equal(w.sk_nomor, "0099/SK/METI/XI/2026"); assert.equal(w.tgl_pelantikan, "2026-12-15"); assert.deepEqual(w.bidang, ["kebijakan", "riset-sdm"]);
  assert.ok(!/0812/.test(JSON.stringify(w)));
  const n = (await E.DB.prepare("SELECT COUNT(*) n FROM jejak WHERE tabel IN ('meti_wilayah','meti_wilayah_ajuan') AND baris_id IN (?, '14')").bind(String(ID.ajuan)).first()).n;
  assert.ok(n >= 8, "jejak " + n);
  assert.equal((await panggil("/api/meti-wilayah", "GET", "anggota")).hitung.berdiri, 7);
});

test("tolak wajib catatan; PATCH admin memvalidasi; kontak resmi tersimpan", async () => {
  const b = await panggil("/api/meti-wilayah/ajuan", "POST", "anggota", { ...AJUAN, kode: "15" });
  assert.equal((await panggil(`/api/admin/meti-wilayah/ajuan/${b.id}/tahap`, "POST", "admin", { ke: "ditolak" })).status, 422);
  assert.equal((await panggil(`/api/admin/meti-wilayah/ajuan/${b.id}/tahap`, "POST", "admin", { ke: "ditolak", catatan: "Berkas kurang" })).status, 200);
  assert.equal((await panggil("/api/admin/meti-wilayah/15", "PATCH", "admin", { status: "gaib" })).status, 422);
  assert.equal((await panggil("/api/admin/meti-wilayah/15", "PATCH", "admin", { kontak_telp: "abc" })).status, 422);
  assert.equal((await panggil("/api/admin/meti-wilayah/15", "PATCH", "admin", { status: "rencana", kontak_surel: "sekretariat@contoh.id", kontak_telp: "+62 21 555 0100", sumber: "Keputusan admin", status_per: "2026-11-08" })).status, 200);
  const w = (await panggil("/api/meti-wilayah/15", "GET", "anggota")).wilayah;
  assert.equal(w.status, "rencana"); assert.equal(w.kontak_surel, "sekretariat@contoh.id");
});

test("kit: nama asing 404, belum diunggah 404, ada 200", async () => {
  assert.equal((await res("/api/meti-wilayah/kit/rahasia", "GET", "anggota")).status, 404);
  assert.equal((await res("/api/meti-wilayah/kit/templat-sk", "GET", "anggota")).status, 404);
  OBJ.set("meti-wilayah/kit/templat-sk.docx", new Uint8Array([80, 75, 3, 4]));
  assert.equal((await res("/api/meti-wilayah/kit/templat-sk", "GET", "anggota")).status, 200);
});

test("migrasi 0015 beku: isi tidak berubah", () => {
  assert.match(readFileSync("migrations/0015_meti_wilayah.sql", "utf8"), /CREATE TABLE IF NOT EXISTS meti_wilayah_ajuan/);
});
