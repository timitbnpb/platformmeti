// event-hadir.test.mjs (F65-201..204): tiket, hadir, tutup, sertifikat publik, survei, laporan lewat worker.fetch utuh di D1 lokal NYATA
// (trigger event_hadir_sah, event_survei_sah, PRIMARY KEY, jejak). Hanya ASSETS (kalender.json kecil) yang ditiru.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buatEnv, pecahSql } from "./_bantu.mjs";
import worker from "../src/worker.js";
import * as hak from "../src/hak.js";
import { sha } from "../src/util.js";

const DEPAN = new Date(Date.now() + 40 * 864e5).toISOString().slice(0, 10);
const KALENDER = { baris: [
  { id: "ac_1", slug: "acara-satu", judul: "Acara satu", jenis: "seminar", tanggal: DEPAN },
  { id: "ac_2", slug: "acara-dua", judul: "Acara dua", jenis: "seminar", tanggal: DEPAN },
] };
let E, tutup;
const COOKIE = {}, AKUN = {};
const q = (s, ...b) => E.DB.prepare(s).bind(...b);
const satu = (s, ...b) => q(s, ...b).first();
const cacah = async (t, w = "") => (await satu(`SELECT count(*) AS n FROM ${t} ${w}`)).n;

async function tambahAkun(kunci, peran) {
  const r = await q("INSERT INTO akun (surel, nama, peran, status, garam, sandi, iterasi) VALUES (?,?,?, 'aktif', ?, ?, 100000)", `${kunci}@uji.test`, "Nama " + kunci, peran, "a".repeat(32), "a".repeat(64)).run();
  const token = (Object.keys(COOKIE).length + 20).toString(16).padStart(2, "0").repeat(32);
  await hak.catatSesi(E, { idHash: await sha(token), akunId: r.meta.last_row_id, sampai: Math.floor(Date.now() / 1000) + 3600, ipHash: "h" });
  COOKIE[kunci] = `sesi=${token}`; AKUN[kunci] = r.meta.last_row_id;
}
async function panggil(metode, jalur, { peran = null, badan } = {}) {
  const h = { origin: "https://uji.test", "cf-connecting-ip": "203.0.113.9" };
  if (peran) h.cookie = COOKIE[peran];
  if (metode !== "GET") h["x-pb"] = "1";
  let body;
  if (badan !== undefined) { body = JSON.stringify(badan); h["content-type"] = "application/json"; }
  return worker.fetch(new Request("https://uji.test" + jalur, { method: metode, headers: h, body }), E, { waitUntil() {} });
}
const tiket = async (peran, id) => (await panggil("GET", `/api/event/${id}/tiket`, { peran })).json();
const hadir = (kode, id = "acara-satu", peran = "admin") => panggil("POST", `/api/event/${id}/hadir`, { peran, badan: { kode } });
const JAWAB = { puas: 5, relevan: 4, selenggara: 4, minat: 5 };
const PESERTA = ["a", "b", "c", "d", "e", "f"];

before(async () => {
  ({ env: E, tutup } = await buatEnv());
  E.ASSETS = { fetch: async (req) => (new URL(req.url).pathname === "/data/kalender.json" ? new Response(JSON.stringify(KALENDER)) : new Response("x")) };
  await tambahAkun("admin", "admin"); await tambahAkun("pengurus", "pengurus");
  for (const p of PESERTA) await tambahAkun(p, "anggota");
  for (const id of ["acara-satu", "acara-dua"]) assert.equal((await panggil("PUT", `/api/event/${id}/atur`, { peran: "admin", badan: { terbuka: true } })).status, 201);
  for (const p of PESERTA) assert.equal((await panggil("POST", "/api/event/acara-satu/daftar", { peran: p, badan: { jumlah: 1 } })).status, 201);
  assert.equal((await panggil("POST", "/api/event/acara-dua/daftar", { peran: "a", badan: { jumlah: 2 } })).status, 201);
});
after(async () => { await tutup?.(); });

test("migrasi 0038 dijalankan dua kali tanpa galat", async () => {
  for (const s of pecahSql(readFileSync(new URL("../migrations/0038_event_hadir.sql", import.meta.url), "utf8"))) await E.DB.prepare(s).run();
  assert.equal(await cacah("event_hadir"), 0);
});

test("tamu 401 di rute bersesi; bukan admin 403 di hadir, tutup, laporan", async () => {
  for (const [m, j, b] of [["GET", "/api/event/acara-satu/tiket"], ["POST", "/api/event/acara-satu/hadir", { kode: "1." + "0".repeat(32) }], ["PUT", "/api/event/acara-satu/tutup", { tutup: true }],
    ["POST", "/api/event/acara-satu/survei", JAWAB], ["GET", "/api/event/acara-satu/laporan"]]) assert.equal((await panggil(m, j, { badan: b })).status, 401, `${m} ${j}`);
  for (const p of ["a", "pengurus"]) {
    assert.equal((await hadir("1." + "0".repeat(32), "acara-satu", p)).status, 403);
    assert.equal((await panggil("PUT", "/api/event/acara-satu/tutup", { peran: p, badan: { tutup: true } })).status, 403);
    assert.equal((await panggil("GET", "/api/event/acara-satu/laporan", { peran: p })).status, 403);
  }
  assert.equal(await cacah("event_tutup"), 0);
});

test("tiket: hanya milik sendiri, kode beda per peserta dan per acara, tidak terdaftar = tanpa kode", async () => {
  const a = await tiket("a", "acara-satu"), b = await tiket("b", "acara-satu"), a2 = await tiket("a", "acara-dua");
  assert.match(a.kode, /^\d{1,9}\.[0-9a-f]{32}$/);
  assert.equal(new Set([a.kode, b.kode, a2.kode]).size, 3);
  assert.equal(a.kode, (await tiket("a", "acara-satu")).kode, "kode stabil");
  assert.deepEqual([a.hadir_pada, a.ditutup, a.sertifikat, a.survei.boleh], [null, false, null, false]);
  assert.deepEqual(await tiket("b", "acara-dua"), { terdaftar: false });
  assert.deepEqual(await tiket("pengurus", "acara-satu"), { terdaftar: false });
  // id pendaftaran orang lain dengan HMAC karangan tidak pernah lolos
  const idB = b.kode.split(".")[0];
  assert.equal((await hadir(`${idB}.${a.kode.split(".")[1]}`)).status, 404);
});

test("hadir: kode salah, bentuk salah, dan kode acara lain = 404 seragam; benar dicatat sekali; pindai kedua mengembalikan jam pertama", async () => {
  const a = await tiket("a", "acara-satu"), a2 = await tiket("a", "acara-dua");
  for (const k of ["", "abc", "1.zz", a.kode.slice(0, -1) + (a.kode.endsWith("0") ? "1" : "0"), a2.kode, "999999." + "a".repeat(32)]) {
    const r = await hadir(k);
    assert.equal(r.status, 404, k); assert.equal((await r.json()).kode, "tidak_ditemukan");
  }
  assert.equal((await hadir(123)).status, 422);
  assert.equal(await cacah("event_hadir"), 0);
  const r1 = await hadir(a.kode); assert.equal(r1.status, 200);
  const d1 = await r1.json();
  assert.equal(d1.baru, true); assert.equal(d1.nama, "Nama a"); assert.deepEqual(Object.keys(d1).sort(), ["baru", "hadir_pada", "jumlah", "nama"]);
  const d2 = await (await hadir(a.kode)).json();
  assert.equal(d2.baru, false); assert.equal(d2.hadir_pada, d1.hadir_pada);
  const [x, y] = await Promise.all([hadir((await tiket("b", "acara-satu")).kode), hadir((await tiket("b", "acara-satu")).kode)]);
  assert.equal([(await x.json()).baru, (await y.json()).baru].filter(Boolean).length, 1, "dua pindai bersamaan: tepat satu yang baru");
  assert.equal(await cacah("event_hadir"), 2);
  assert.equal(await cacah("jejak", "WHERE tabel = 'event_hadir' AND aksi = 'tinjau'"), 2);
  assert.equal((await tiket("a", "acara-satu")).hadir_pada, d1.hadir_pada);
});

test("hadir: pendaftaran yang dibatalkan ditolak 404, juga oleh trigger bila rute dilewati", async () => {
  const f = await tiket("f", "acara-satu");
  assert.equal((await panggil("DELETE", "/api/event/acara-satu/daftar", { peran: "f" })).status, 200);
  assert.equal((await hadir(f.kode)).status, 404);
  await assert.rejects(() => q("INSERT INTO event_hadir (daftar_id, event_id) VALUES (?, 'acara-satu')", Number(f.kode.split(".")[0])).run(), /tidak boleh/);
  const idC = Number((await tiket("c", "acara-satu")).kode.split(".")[0]);
  await assert.rejects(() => q("INSERT INTO event_hadir (daftar_id, event_id) VALUES (?, 'acara-dua')", idC).run(), /tidak boleh/);
  assert.equal((await tiket("f", "acara-satu")).terdaftar, false);
});

test("sebelum ditutup: tanpa sertifikat, survei 403 (rute) dan ditolak trigger", async () => {
  assert.equal((await tiket("a", "acara-satu")).sertifikat, null);
  assert.equal((await panggil("POST", "/api/event/acara-satu/survei", { peran: "a", badan: JAWAB })).status, 403);
  await assert.rejects(() => q("INSERT INTO event_survei (event_id, akun_id, k_puas, k_relevan, k_selenggara, k_minat) VALUES ('acara-satu', ?, 3, 3, 3, 3)", AKUN.a).run(), /tidak boleh/);
  assert.equal(await cacah("event_survei"), 0);
});

test("tutup acara: 404 untuk acara tak dikenal, 422 untuk badan salah; sesudah ditutup sertifikat terbuka", async () => {
  assert.equal((await panggil("PUT", "/api/event/tidak-ada/tutup", { peran: "admin", badan: { tutup: true } })).status, 404);
  assert.equal((await panggil("PUT", "/api/event/acara-satu/tutup", { peran: "admin", badan: { tutup: "ya" } })).status, 422);
  const r = await panggil("PUT", "/api/event/acara-satu/tutup", { peran: "admin", badan: { tutup: true } });
  assert.equal(r.status, 200); assert.ok((await r.json()).ditutup > 0);
  assert.equal((await panggil("PUT", "/api/event/acara-satu/tutup", { peran: "admin", badan: { tutup: true } })).status, 200, "idempoten");
  assert.equal(await cacah("event_tutup"), 1);
  const a = await tiket("a", "acara-satu");
  assert.match(a.sertifikat, /^https:\/\/uji\.test\/sertifikat\/v\/\d{1,9}\.[0-9a-f]{32}$/);
  assert.ok(!a.sertifikat.includes("?"), "token di jalur, bukan query string");
  assert.notEqual(a.sertifikat.split("/").pop(), a.kode, "token sertifikat beda dari kode tiket");
  assert.equal((await tiket("c", "acara-satu")).sertifikat, null, "terdaftar tetapi tidak hadir: tanpa sertifikat");
});

test("sertifikat publik: tanpa sesi, hanya acara, tanggal, nama; kode tiket, token rusak, dan peserta tak hadir = 404", async () => {
  const a = await tiket("a", "acara-satu"), token = a.sertifikat.split("/").pop();
  const r = await panggil("GET", "/api/event/sertifikat/" + token);
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), { acara: "Acara satu", tanggal: DEPAN, nama: "Nama a" });
  assert.match(r.headers.get("cache-control"), /no-store/);
  for (const t of [a.kode, token.slice(0, -1) + (token.endsWith("0") ? "1" : "0"), "abc", "1.2", "999999." + "b".repeat(32)]) assert.equal((await panggil("GET", "/api/event/sertifikat/" + t)).status, 404, t);
  // halaman verifikasi terbuka untuk tamu hanya pada bentuk token yang sah
  assert.equal((await panggil("GET", "/sertifikat/v/" + token)).status, 200);
  assert.equal((await panggil("GET", "/sertifikat/v/abc")).status, 302);
  // acara dibuka lagi: sertifikat mati, lalu ditutup kembali
  await panggil("PUT", "/api/event/acara-satu/tutup", { peran: "admin", badan: { tutup: false } });
  assert.equal((await panggil("GET", "/api/event/sertifikat/" + token)).status, 404);
  await panggil("PUT", "/api/event/acara-satu/tutup", { peran: "admin", badan: { tutup: true } });
  assert.equal((await panggil("GET", "/api/event/sertifikat/" + token)).status, 200);
});

test("survei: tidak hadir 403, badan salah 422, hadir 201 sekali lalu 409; akun dari sesi", async () => {
  assert.equal((await panggil("POST", "/api/event/acara-satu/survei", { peran: "c", badan: JAWAB })).status, 403, "terdaftar, tidak hadir");
  assert.equal((await panggil("POST", "/api/event/acara-satu/survei", { peran: "pengurus", badan: JAWAB })).status, 403, "tidak terdaftar");
  for (const b of [{}, { ...JAWAB, puas: 6 }, { ...JAWAB, puas: 1.5 }, { ...JAWAB, akun_id: AKUN.b }, { puas: 5 }]) assert.equal((await panggil("POST", "/api/event/acara-satu/survei", { peran: "a", badan: b })).status, 422);
  assert.equal((await panggil("POST", "/api/event/acara-satu/survei", { peran: "a", badan: JAWAB })).status, 201);
  assert.equal((await panggil("POST", "/api/event/acara-satu/survei", { peran: "a", badan: JAWAB })).status, 409);
  assert.equal(await cacah("event_survei"), 1);
  assert.equal((await satu("SELECT akun_id FROM event_survei")).akun_id, AKUN.a);
  await assert.rejects(() => q("UPDATE event_survei SET k_puas = 1 WHERE akun_id = ?", AKUN.a).run(), /tidak boleh/);
  const t = await tiket("a", "acara-satu");
  assert.deepEqual([t.survei.boleh, t.survei.sudah], [false, true]);
  assert.equal(await cacah("jejak", "WHERE tabel = 'event_survei'"), 1);
  assert.ok(!JSON.stringify(await satu("SELECT ke FROM jejak WHERE tabel = 'event_survei'")).includes("puas"), "jejak tidak memuat nilai jawaban");
});

test("laporan admin: agregat saja; n di bawah ambang tanpa nilai; tidak ada nama, surel, atau baris per orang", async () => {
  const l1 = await (await panggil("GET", "/api/event/acara-satu/laporan", { peran: "admin" })).json();
  assert.deepEqual([l1.pendaftaran, l1.orang, l1.hadir], [5, 5, 2]);
  assert.deepEqual(l1.survei, { n: 1, tersembunyi: true });
  assert.equal(l1.n_min, hak.N_MIN_KEYAKINAN);
  // tiga peserta lagi hadir dan menjawab: n = 4 masih tersembunyi; yang kelima membuka rata-rata
  await panggil("PUT", "/api/event/acara-satu/tutup", { peran: "admin", badan: { tutup: false } });
  for (const p of ["c", "d", "e"]) assert.equal((await hadir((await tiket(p, "acara-satu")).kode)).status, 200);
  await panggil("PUT", "/api/event/acara-satu/tutup", { peran: "admin", badan: { tutup: true } });
  for (const p of ["b", "c", "d"]) assert.equal((await panggil("POST", "/api/event/acara-satu/survei", { peran: p, badan: { puas: 3, relevan: 3, selenggara: 3, minat: 3 } })).status, 201);
  assert.equal((await (await panggil("GET", "/api/event/acara-satu/laporan", { peran: "admin" })).json()).survei.tersembunyi, true);
  assert.equal((await panggil("POST", "/api/event/acara-satu/survei", { peran: "e", badan: { puas: 2, relevan: 3, selenggara: 3, minat: 2 } })).status, 201);
  const r = await panggil("GET", "/api/event/acara-satu/laporan", { peran: "admin" }), teks = await r.clone().text(), l2 = await r.json();
  assert.deepEqual([l2.hadir, l2.survei.n, l2.survei.tersembunyi], [5, 5, false]);
  assert.deepEqual(l2.survei.rata, { puas: 3.2, relevan: 3.2, selenggara: 3.2, minat: 3.2 });
  assert.ok(!/Nama |uji\.test|akun_id/.test(teks), "laporan tidak memuat data per orang");
  assert.ok(l2.kunjungan_semua_acara === null || Number.isInteger(l2.kunjungan_semua_acara.n));
  // acara lain tidak tercampur
  const lain = await (await panggil("GET", "/api/event/acara-dua/laporan", { peran: "admin" })).json();
  assert.deepEqual([lain.pendaftaran, lain.orang, lain.hadir, lain.survei.n, lain.ditutup], [1, 2, 0, 0, null]);
});

test("daftar peserta admin memuat jam hadir", async () => {
  const d = await (await panggil("GET", "/api/event/acara-satu/peserta", { peran: "admin" })).json();
  assert.equal(d.peserta.filter((x) => x.hadir_pada).length, 5);
  assert.equal(d.peserta.find((x) => x.status === "batal").hadir_pada, null);
});
