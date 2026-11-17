// jejaring.test.mjs (F65-210..212): minat lowongan, program mentor, forum per bidang. Lewat worker.fetch utuh di D1 lokal NYATA (trigger, indeks unik, jejak).
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buatEnv, pecahSql } from "./_bantu.mjs";
import worker from "../src/worker.js";
import * as hak from "../src/hak.js";
import { sha } from "../src/util.js";
import { periksaMentor, periksaUtas } from "../src/jejaring.js";

let E, tutup;
const COOKIE = {}, AKUN = {}, L = {};
const q = (s, ...b) => E.DB.prepare(s).bind(...b);
const satu = (s, ...b) => q(s, ...b).first();
const cacah = async (t, w = "", ...b) => (await satu(`SELECT count(*) AS n FROM ${t} ${w}`, ...b)).n;

async function tambahAkun(kunci, peran = "anggota") {
  const r = await q("INSERT INTO akun (surel, nama, peran, status, garam, sandi, iterasi) VALUES (?,?,?, 'aktif', ?, ?, 100000)", `${kunci}@jejaring.test`, "Nama " + kunci, peran, "a".repeat(32), "a".repeat(64)).run();
  const token = (Object.keys(COOKIE).length + 80).toString(16).padStart(2, "0").repeat(32);
  await hak.catatSesi(E, { idHash: await sha(token), akunId: r.meta.last_row_id, sampai: Math.floor(Date.now() / 1000) + 3600, ipHash: "h" });
  COOKIE[kunci] = `sesi=${token}`; AKUN[kunci] = r.meta.last_row_id;
}
async function panggil(metode, jalur, { peran = null, badan } = {}) {
  const h = { origin: "https://uji.test", "cf-connecting-ip": "203.0.113.19" };
  if (peran) h.cookie = COOKIE[peran];
  if (metode !== "GET") h["x-pb"] = "1";
  let body;
  if (badan !== undefined) { body = JSON.stringify(badan); h["content-type"] = "application/json"; }
  return worker.fetch(new Request("https://uji.test" + jalur, { method: metode, headers: h, body }), E, { waitUntil() {} });
}
const st = async (...a) => (await panggil(...a)).status;
const isi = async (...a) => (await panggil(...a)).json();
// Lowongan langsung di D1 (pemasangan dan penerbitan sudah diuji di modul kerja): status dan batas diatur per kasus.
async function lowongan(kunci, pemilik, { status = "terbit", batas = null } = {}) {
  const putus = status !== "menunggu";
  const r = await q(`INSERT INTO lowongan (akun_id, organisasi_id, organisasi_nama, judul, teknologi, jenjang, tautan, batas, status${putus ? ", diputus_pada, diputus_oleh" : ""})
    VALUES (?, 'org_x', 'PT Uji', ?, 'surya', 'pemula', 'https://contoh.test/karir', ?, ?${putus ? ", unixepoch(), ?" : ""})`, ...[AKUN[pemilik], "Lowongan " + kunci, batas, status, ...(putus ? [AKUN.admin] : [])]).run();
  L[kunci] = r.meta.last_row_id;
}
const putus = (jenis, id, aksi, alasan, peran = "admin") => panggil("POST", `/api/admin/kiriman/${jenis}/${id}`, { peran, badan: alasan ? { aksi, alasan } : { aksi } });
const URAIAN = "Dua puluh tahun mengembangkan PLTS skala utilitas dan pendanaannya.";
const PESAN = "Mohon bimbingan menyusun model keuangan PLTS atap industri.";

before(async () => {
  ({ env: E, tutup } = await buatEnv());
  await tambahAkun("admin", "admin"); await tambahAkun("pengurus", "pengurus");
  for (const k of ["a", "b", "c", "d", "e"]) await tambahAkun(k);
  await lowongan("A", "a"); await lowongan("B", "b");
  await lowongan("lewat", "a", { batas: "2020-01-01" }); await lowongan("tunggu", "a", { status: "menunggu" });
});
after(async () => { await tutup?.(); });

test("migrasi 0040 dijalankan dua kali tanpa galat", async () => {
  for (const s of pecahSql(readFileSync(new URL("../migrations/0040_jejaring.sql", import.meta.url), "utf8"))) await E.DB.prepare(s).run();
  assert.equal(await cacah("forum_utas"), 0);
});

test("hak: empat sel baru per peran", () => {
  for (const jenis of ["kerja_minat", "mentor", "mentor_minta", "forum"]) {
    const sel = (p) => ["baca", "tambah", "ubah", "hapus"].filter((a) => hak.boleh(p, a, jenis, undefined, { peran: p, status: "aktif" }).ok);
    assert.deepEqual(sel("publik"), [], jenis);
    for (const p of ["anggota", "pengurus", "kurator", "wilayah", "admin", "super"]) assert.deepEqual(sel(p), ["baca", "tambah", "ubah"], jenis + " " + p);
  }
});

test("tamu 401 di semua rute; bukan admin 403 di antrean laporan dan sembunyi", async () => {
  for (const [m, j, b] of [["GET", "/api/kerja/minat"], ["POST", "/api/kerja/1/minat", {}], ["DELETE", "/api/kerja/1/minat"], ["GET", "/api/kerja/1/peminat"],
    ["GET", "/api/mentor"], ["POST", "/api/mentor", { bidang: "sdm", uraian: URAIAN }], ["POST", "/api/mentor/1/minta", { pesan: PESAN }], ["GET", "/api/mentor/permintaan"],
    ["GET", "/api/forum?bidang=sdm"], ["GET", "/api/forum/utas/1"], ["POST", "/api/forum", {}], ["POST", "/api/forum/utas/1/balasan", { isi: "ya" }], ["POST", "/api/forum/lapor", {}],
    ["GET", "/api/admin/forum/laporan"], ["POST", "/api/admin/forum/sembunyi", {}]]) assert.equal(await st(m, j, { badan: b }), 401, `${m} ${j}`);
  for (const p of ["a", "pengurus"]) {
    assert.equal(await st("GET", "/api/admin/forum/laporan", { peran: p }), 403);
    assert.equal(await st("POST", "/api/admin/forum/sembunyi", { peran: p, badan: { jenis: "utas", id: 1, sembunyi: true, alasan: "spam iklan" } }), 403);
  }
});

/* ---------------- F65-212 minat lowongan ---------------- */
test("minat: sekali per akun, akun dari sesi, tanpa surel atau telepon di pesan", async () => {
  assert.equal(await st("POST", `/api/kerja/${L.A}/minat`, { peran: "c", badan: { pesan: "Saya insinyur listrik, tertarik." } }), 201);
  assert.equal((await satu("SELECT akun_id FROM kerja_minat WHERE lowongan_id = ?", L.A)).akun_id, AKUN.c);
  assert.equal(await st("POST", `/api/kerja/${L.A}/minat`, { peran: "c", badan: {} }), 409, "minat ganda");
  assert.equal(await st("POST", `/api/kerja/${L.A}/minat`, { peran: "d", badan: { akun_id: AKUN.c } }), 422, "id pemilik dari badan ditolak");
  assert.equal(await st("POST", `/api/kerja/${L.A}/minat`, { peran: "d", badan: { pesan: "hubungi saya di d@contoh.id" } }), 422, "surel di pesan");
  assert.equal(await st("POST", `/api/kerja/${L.A}/minat`, { peran: "d", badan: { pesan: "x".repeat(501) } }), 422);
  assert.equal(await st("POST", `/api/kerja/${L.A}/minat`, { peran: "d", badan: {} }), 201, "pesan opsional");
  assert.equal(await cacah("jejak", "WHERE tabel = 'kerja_minat' AND aksi = 'kirim'"), 2);
});

test("minat: lowongan lewat batas, belum terbit, tidak ada, dan milik sendiri = 404", async () => {
  assert.equal(await st("POST", `/api/kerja/${L.lewat}/minat`, { peran: "c", badan: {} }), 404);
  assert.equal(await st("POST", `/api/kerja/${L.tunggu}/minat`, { peran: "c", badan: {} }), 404);
  assert.equal(await st("POST", "/api/kerja/999999/minat", { peran: "c", badan: {} }), 404);
  assert.equal(await st("POST", `/api/kerja/${L.A}/minat`, { peran: "a", badan: {} }), 404, "pemasang tidak meminati lowongannya sendiri");
  assert.equal(await st("POST", "/api/kerja/abc/minat", { peran: "c", badan: {} }), 404);
});

test("peminat: hanya pemasang lowongan itu dan admin; hanya nama, pesan, waktu", async () => {
  assert.equal(await st("GET", `/api/kerja/${L.A}/peminat`, { peran: "b" }), 404, "pemasang lowongan lain");
  assert.equal(await st("GET", `/api/kerja/${L.A}/peminat`, { peran: "c" }), 404, "peminat sendiri bukan pemasang");
  const r = await isi("GET", `/api/kerja/${L.A}/peminat`, { peran: "a" });
  assert.equal(r.baris.length, 2);
  for (const x of r.baris) assert.deepEqual(Object.keys(x).sort(), ["dibuat", "nama", "pesan"]);
  assert.ok(!JSON.stringify(r).includes("@"));
  assert.equal((await isi("GET", `/api/kerja/${L.A}/peminat`, { peran: "admin" })).baris.length, 2);
  assert.equal(await st("GET", `/api/kerja/${L.lewat}/peminat`, { peran: "a" }), 404, "lowongan tutup: peminat tidak lagi keluar");
});

test("minat saya dan jumlah peminat; menarik hanya milik sendiri", async () => {
  assert.deepEqual((await isi("GET", "/api/kerja/minat", { peran: "c" })).minat, [L.A]);
  assert.equal((await isi("GET", "/api/kerja/minat", { peran: "a" })).peminat[L.A], 2);
  assert.equal(await st("DELETE", `/api/kerja/${L.A}/minat`, { peran: "e" }), 404, "tidak punya minat: tidak menghapus milik orang lain");
  assert.equal(await cacah("kerja_minat", "WHERE lowongan_id = ?", L.A), 2);
  assert.equal(await st("DELETE", `/api/kerja/${L.A}/minat`, { peran: "c" }), 200);
  assert.equal(await cacah("kerja_minat", "WHERE lowongan_id = ? AND akun_id = ?", L.A, AKUN.c), 0);
  assert.equal(await cacah("kerja_minat", "WHERE lowongan_id = ? AND akun_id = ?", L.A, AKUN.d), 1);
  // lowongan ditutup sesudah diminati: minat tidak lagi keluar di daftar saya
  await q("UPDATE lowongan SET batas = '2020-01-01' WHERE id = ?", L.A).run();
  assert.deepEqual((await isi("GET", "/api/kerja/minat", { peran: "d" })).minat, []);
  await q("UPDATE lowongan SET batas = NULL WHERE id = ?", L.A).run();
});

/* ---------------- F65-211 mentor ---------------- */
test("mentor: belum disetujui tidak tampil dan tidak bisa diminta; tinjau hanya admin", async () => {
  assert.throws(() => periksaMentor({ bidang: "sihir", uraian: URAIAN }));
  assert.throws(() => periksaMentor({ bidang: "sdm", uraian: "pendek" }));
  assert.equal(await st("POST", "/api/mentor", { peran: "a", badan: { bidang: "pendanaan", uraian: URAIAN + " WA 0812-3456-7890" } }), 422, "telepon di uraian");
  const id = (await isi("POST", "/api/mentor", { peran: "a", badan: { bidang: "pendanaan", uraian: URAIAN } })).id;
  assert.ok(id);
  assert.equal(await st("POST", "/api/mentor", { peran: "a", badan: { bidang: "sdm", uraian: URAIAN } }), 409, "satu pendaftaran aktif");
  assert.deepEqual((await isi("GET", "/api/mentor", { peran: "b" })).baris, []);
  assert.equal(await st("POST", `/api/mentor/${id}/minta`, { peran: "b", badan: { pesan: PESAN } }), 409, "mentor belum disetujui");
  assert.equal((await putus("mentor", id, "setuju", null, "pengurus")).status, 403);
  assert.equal((await putus("mentor", id, "setuju", null, "b")).status, 403);
  assert.equal((await putus("mentor", id, "setuju")).status, 200);
  const d = (await isi("GET", "/api/mentor", { peran: "b" })).baris;
  assert.equal(d.length, 1);
  assert.deepEqual(Object.keys(d[0]).sort(), ["bidang", "id", "nama", "saya", "uraian"]);
  assert.equal(d[0].saya, 0); assert.equal((await isi("GET", "/api/mentor", { peran: "a" })).baris[0].saya, 1);
  L.mentor = id;
});

test("mentor yang akunnya dinonaktifkan tidak tampil sebagai mentor", async () => {
  await q("UPDATE akun SET status = 'nonaktif' WHERE id = ?", AKUN.a).run();
  try { assert.deepEqual((await isi("GET", "/api/mentor", { peran: "b" })).baris, []); }
  finally { await q("UPDATE akun SET status = 'aktif' WHERE id = ?", AKUN.a).run(); }
  assert.equal((await isi("GET", "/api/mentor", { peran: "b" })).baris.length, 1);
});

test("permintaan mentor: lewat admin dulu, lalu hanya mentor yang dituju yang melihat", async () => {
  assert.equal(await st("POST", `/api/mentor/${L.mentor}/minta`, { peran: "a", badan: { pesan: PESAN } }), 409, "diri sendiri");
  assert.equal(await st("POST", `/api/mentor/${L.mentor}/minta`, { peran: "b", badan: { pesan: "pendek" } }), 422);
  assert.equal(await st("POST", `/api/mentor/${L.mentor}/minta`, { peran: "b", badan: { pesan: PESAN, mentor_id: 1 } }), 422);
  const id = (await isi("POST", `/api/mentor/${L.mentor}/minta`, { peran: "b", badan: { pesan: PESAN } })).id;
  assert.equal((await satu("SELECT akun_id FROM mentor_minta WHERE id = ?", id)).akun_id, AKUN.b);
  assert.equal(await st("POST", `/api/mentor/${L.mentor}/minta`, { peran: "b", badan: { pesan: PESAN } }), 409, "permintaan ganda");
  assert.deepEqual((await isi("GET", "/api/mentor/permintaan", { peran: "a" })).baris, [], "belum disetujui admin");
  assert.equal((await putus("minta", id, "setuju")).status, 200);
  const r = (await isi("GET", "/api/mentor/permintaan", { peran: "a" })).baris;
  assert.equal(r.length, 1); assert.equal(r[0].nama, "Nama b"); assert.equal(r[0].pesan, PESAN);
  assert.deepEqual(Object.keys(r[0]).sort(), ["diputus_pada", "id", "nama", "pesan"]);
  assert.deepEqual((await isi("GET", "/api/mentor/permintaan", { peran: "c" })).baris, [], "bukan mentor");
  assert.equal(await st("DELETE", `/api/kiriman/minta/${id}`, { peran: "c" }), 404, "tarik milik orang lain");
  assert.equal(await st("DELETE", `/api/kiriman/minta/${id}`, { peran: "b" }), 200);
  assert.deepEqual((await isi("GET", "/api/mentor/permintaan", { peran: "a" })).baris, []);
  // mentor menarik pendaftarannya: hilang dari daftar
  assert.equal(await st("DELETE", `/api/kiriman/mentor/${L.mentor}`, { peran: "a" }), 200);
  assert.deepEqual((await isi("GET", "/api/mentor", { peran: "b" })).baris, []);
});

/* ---------------- F65-210 forum ---------------- */
const HTML = "<script>alert(1)</script><img src=x onerror=alert(2)> diskusi tarif PLTS atap";
test("forum: utas dan balasan teks polos; HTML tersimpan apa adanya sebagai teks", async () => {
  assert.throws(() => periksaUtas({ bidang: "sdm", judul: "abc", isi: "cukup panjang isinya" }));
  assert.equal(await st("POST", "/api/forum", { peran: "a", badan: { bidang: "sihir", judul: "Judul sah", isi: "isi yang cukup panjang" } }), 422);
  assert.equal(await st("GET", "/api/forum?bidang=sihir", { peran: "a" }), 422);
  const id = (await isi("POST", "/api/forum", { peran: "a", badan: { bidang: "advokasi", judul: "Tarif <b>PLTS</b> atap", isi: HTML } })).id;
  L.utas = id;
  const u = await isi("GET", `/api/forum/utas/${id}`, { peran: "b" });
  assert.equal(u.isi, HTML); assert.equal(u.judul, "Tarif <b>PLTS</b> atap"); assert.equal(u.nama, "Nama a");
  assert.equal((await satu("SELECT akun_id FROM forum_utas WHERE id = ?", id)).akun_id, AKUN.a);
  const b = await isi("POST", `/api/forum/utas/${id}/balasan`, { peran: "b", badan: { isi: "Setuju, <i>perlu</i> kajian." } });
  L.balasan = b.id;
  const d = await isi("GET", "/api/forum?bidang=advokasi", { peran: "c" });
  assert.equal(d.total, 1); assert.equal(d.baris[0].balasan, 1);
  assert.equal((await isi("GET", "/api/forum?bidang=sdm", { peran: "c" })).total, 0, "bidang lain kosong");
  assert.equal(await st("POST", "/api/forum/utas/999999/balasan", { peran: "b", badan: { isi: "halo juga" } }), 404);
  assert.equal(await st("POST", `/api/forum/utas/${id}/balasan`, { peran: "b", badan: { isi: "surel saya b@contoh.id" } }), 422, "surel di balasan");
});

test("layar forum, mentor, dan minat meng-escape semua teks pengguna", () => {
  for (const f of ["forum.js", "mentor.js", "kerja_minat.js"]) {
    const src = readFileSync(new URL("../public/" + f, import.meta.url), "utf8");
    assert.deepEqual(src.match(/\$\{(?!esc\()[^{}]*\b[a-z]\.(isi|judul|nama|pesan|uraian|alasan|cuplikan)\b[^{}]*\}/g) ?? [], [], f + ": teks pengguna tanpa esc()");
  }
});

test("lapor sekali per akun; sembunyi hanya admin, alasan wajib dan tercatat di jejak", async () => {
  const lapor = (peran, badan) => st("POST", "/api/forum/lapor", { peran, badan });
  assert.equal(await lapor("c", { jenis: "utas", id: L.utas, alasan: "ab" }), 422);
  assert.equal(await lapor("c", { jenis: "utas", id: L.utas, alasan: "iklan tidak relevan" }), 200);
  assert.equal(await lapor("c", { jenis: "utas", id: L.utas, alasan: "iklan tidak relevan lagi" }), 200);
  assert.equal(await lapor("d", { jenis: "balasan", id: L.balasan, alasan: "kasar kepada anggota" }), 200);
  assert.equal(await cacah("forum_lapor"), 2);
  assert.equal(await lapor("d", { jenis: "utas", id: 999999, alasan: "tidak ada sasaran" }), 404);
  const lap = await isi("GET", "/api/admin/forum/laporan", { peran: "admin" }), antre = lap.baris;
  assert.equal(antre.length, 2); assert.equal(antre.find((x) => x.jenis === "utas").n, 1);
  assert.equal(lap.total, 2); assert.ok(lap.per >= 2);
  assert.deepEqual((await isi("GET", "/api/admin/forum/laporan?hal=2", { peran: "admin" })).baris, [], "antrean berpaginasi");
  // sasaran yang paling banyak dilaporkan di atas, apa pun urutan waktunya; alasan yang tampil = yang terbaru, bukan terbesar menurut abjad
  assert.equal(await lapor("e", { jenis: "utas", id: L.utas, alasan: "aaa promosi berulang" }), 200);
  const urut = (await isi("GET", "/api/admin/forum/laporan", { peran: "admin" })).baris;
  assert.equal(urut[0].jenis, "utas"); assert.equal(urut[0].n, 2); assert.equal(urut[0].alasan, "aaa promosi berulang");
  await q("DELETE FROM forum_lapor WHERE akun_id = ? AND jenis = 'utas'", AKUN.e).run();
  const sembunyi = (peran, badan) => st("POST", "/api/admin/forum/sembunyi", { peran, badan });
  assert.equal(await sembunyi("admin", { jenis: "utas", id: L.utas, sembunyi: true }), 422, "tanpa alasan");
  assert.equal(await sembunyi("admin", { jenis: "utas", id: L.utas, sembunyi: true, alasan: "melanggar tata tertib forum" }), 200);
  assert.equal(await sembunyi("admin", { jenis: "utas", id: L.utas, sembunyi: true, alasan: "melanggar tata tertib forum" }), 409, "sudah tersembunyi");
  const j = await satu("SELECT siapa, ke FROM jejak WHERE tabel = 'forum_utas' AND aksi = 'tinjau' ORDER BY id DESC LIMIT 1");
  assert.equal(j.siapa, AKUN.admin); assert.match(j.ke, /melanggar tata tertib forum/);
});

test("utas tersembunyi: tidak keluar ke non-admin, tidak bisa dibalas atau dilaporkan; admin masih melihat dan bisa menampilkan lagi", async () => {
  assert.equal(await st("GET", `/api/forum/utas/${L.utas}`, { peran: "b" }), 404);
  assert.equal(await st("GET", `/api/forum/utas/${L.utas}`, { peran: "a" }), 404, "penulisnya pun tidak");
  assert.equal((await isi("GET", "/api/forum?bidang=advokasi", { peran: "b" })).total, 0);
  assert.equal(await st("POST", `/api/forum/utas/${L.utas}/balasan`, { peran: "b", badan: { isi: "masih bisa?" } }), 404);
  assert.equal(await st("POST", "/api/forum/lapor", { peran: "b", badan: { jenis: "utas", id: L.utas, alasan: "sudah tersembunyi" } }), 404);
  const adm = await isi("GET", `/api/forum/utas/${L.utas}`, { peran: "admin" });
  assert.equal(adm.tersembunyi, 1); assert.equal(adm.alasan, "melanggar tata tertib forum");
  assert.equal((await isi("GET", "/api/forum?bidang=advokasi", { peran: "admin" })).total, 1);
  assert.equal((await isi("GET", "/api/admin/forum/laporan", { peran: "admin" })).baris.filter((x) => x.jenis === "utas").length, 0, "antrean hanya sasaran yang masih tampil");
  assert.equal(await st("POST", "/api/admin/forum/sembunyi", { peran: "admin", badan: { jenis: "utas", id: L.utas, sembunyi: false } }), 200);
  assert.equal(await st("GET", `/api/forum/utas/${L.utas}`, { peran: "b" }), 200);
  // balasan disembunyikan sendiri: hilang dari utas bagi non-admin, hitungan ikut turun
  assert.equal(await st("POST", "/api/admin/forum/sembunyi", { peran: "admin", badan: { jenis: "balasan", id: L.balasan, sembunyi: true, alasan: "kasar kepada anggota" } }), 200);
  assert.deepEqual((await isi("GET", `/api/forum/utas/${L.utas}`, { peran: "c" })).balasan, []);
  assert.equal((await isi("GET", "/api/forum?bidang=advokasi", { peran: "c" })).baris[0].balasan, 0);
  assert.equal((await isi("GET", `/api/forum/utas/${L.utas}`, { peran: "admin" })).balasan.length, 1);
});

test("batas laju forum: utas kesebelas dalam satu jam ditolak 429", async () => {
  const kirim = (i) => st("POST", "/api/forum", { peran: "e", badan: { bidang: "data", judul: "Utas uji laju " + i, isi: "isi utas yang cukup panjang " + i } });
  for (let i = 1; i <= 10; i++) assert.equal(await kirim(i), 201, "utas " + i);
  assert.equal(await kirim(11), 429);
  assert.equal(await cacah("forum_utas", "WHERE akun_id = ?", AKUN.e), 10);
});

test("jaring pengaman D1: trigger dan CHECK menolak jalur yang melewati rute", async () => {
  await assert.rejects(q("INSERT INTO kerja_minat (lowongan_id, akun_id) VALUES (?, ?)", L.lewat, AKUN.e).run());
  await assert.rejects(q("INSERT INTO kerja_minat (lowongan_id, akun_id) VALUES (?, ?)", L.B, AKUN.b).run(), "milik sendiri");
  await assert.rejects(q("INSERT INTO mentor_minta (akun_id, mentor_id, pesan) VALUES (?, ?, ?)", AKUN.e, L.mentor, PESAN).run(), "mentor sudah ditarik");
  await assert.rejects(q("UPDATE forum_utas SET tersembunyi = 1 WHERE id = ?", L.utas).run(), "sembunyi tanpa alasan");
  await assert.rejects(q("INSERT INTO forum_utas (bidang, akun_id, judul, isi) VALUES ('sihir', ?, 'Judul sah', 'isi yang cukup panjang')", AKUN.e).run());
});
