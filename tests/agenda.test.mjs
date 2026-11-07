// agenda.test.mjs (JM-F11, KP K20, DT 4.4): rute bukti agenda lewat worker.fetch utuh, D1 lokal NYATA, R2 tiruan sederhana.
// Tiruan hanya untuk R2 (env.BERKAS) dan ASSETS (kalender.json kecil); hak, CHECK, trigger, jejak berjalan di D1 nyata.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buatEnv, pecahSql } from "./_bantu.mjs";
import worker from "../src/worker.js";
import { rute } from "../src/agenda.js";
import * as hak from "../src/hak.js";
import { sha } from "../src/util.js";

const KALENDER = { baris: [
  { id: "ac_029", judul: "Rapat contoh (contoh)", sumber: { label: "arsip-meti" } },
  { id: "reg_001", judul: "Regulasi contoh (contoh)", sumber: { label: "regulasi" } },
] };
const BERKAS = new Map();
const R2 = {
  put: async (k, v) => { BERKAS.set(k, new Uint8Array(await new Response(v).arrayBuffer())); },
  get: async (k) => (BERKAS.has(k) ? { body: BERKAS.get(k) } : null),
  delete: async (k) => { BERKAS.delete(k); },
};
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 16, 0x4a, 0x46, 0x49, 0x46, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0, 0xff, 0xd9]);
const PERAN_SEMUA = ["anggota", "pengurus", "wilayah", "kurator", "admin", "super"];
const PERAN_TULIS = ["kurator", "admin", "super"];
const PERAN_TOLAK_TULIS = ["anggota", "pengurus", "wilayah"];

let E, tutup;
const COOKIE = {};
const q = (s, ...b) => E.DB.prepare(s).bind(...b);
const satu = (s, ...b) => q(s, ...b).first();
const cacah = async (t, w = "") => (await satu(`SELECT count(*) AS n FROM ${t} ${w}`)).n;

before(async () => {
  ({ env: E, tutup } = await buatEnv());
  E.BERKAS = R2;
  E.ASSETS = { fetch: async (req) => (new URL(req.url).pathname === "/data/kalender.json" ? new Response(JSON.stringify(KALENDER)) : new Response("x")) };
  for (const peran of PERAN_SEMUA) {
    const r = await q("INSERT INTO akun (surel, nama, peran, cakupan_prov, status, garam, sandi, iterasi) VALUES (?,?,?,?, 'aktif', ?, ?, 100000)",
      `${peran}@uji.test`, peran, peran, peran === "wilayah" ? "31" : null, "a".repeat(32), "a".repeat(64)).run();
    const token = (PERAN_SEMUA.indexOf(peran) + 16).toString(16).repeat(32);
    await hak.catatSesi(E, { idHash: await sha(token), akunId: r.meta.last_row_id, peran, sampai: Math.floor(Date.now() / 1000) + 3600, ipHash: "h" });
    COOKIE[peran] = `sesi=${token}`;
  }
});
after(async () => { await tutup?.(); });

async function panggil(metode, jalur, { peran = null, badan, pb = true, header = {} } = {}) {
  const h = { origin: "https://uji.test", "cf-connecting-ip": "203.0.113.7", ...header };
  if (peran) h.cookie = COOKIE[peran];
  if (pb && metode !== "GET") h["x-pb"] = "1";
  let body = badan;
  if (badan !== undefined && !(badan instanceof Uint8Array)) { body = JSON.stringify(badan); h["content-type"] = "application/json"; }
  return worker.fetch(new Request("https://uji.test" + jalur, { method: metode, headers: h, body }), E, { waitUntil() {} });
}
const json = async (res) => res.json();

const SEMUA_RUTE = [
  ["GET", "/api/agenda"], ["GET", "/api/agenda/ac_029"], ["PUT", "/api/agenda/ac_029", {}],
  ["POST", "/api/agenda/ac_029/foto", JPEG], ["PATCH", "/api/agenda/foto/1", {}], ["DELETE", "/api/agenda/foto/1"], ["GET", "/api/agenda/foto/1"],
];

test("modul mengekspor tepat 7 rute agenda", () => {
  assert.equal(Object.keys(rute).length, 7);
});

test("publik DITOLAK 401 di semua 7 rute (kode belum_masuk)", async () => {
  for (const [m, j, b] of SEMUA_RUTE) {
    const res = await panggil(m, j, { badan: b });
    assert.equal(res.status, 401, `${m} ${j}`);
  }
});

test("pengurus/anggota/wilayah DITOLAK 403 untuk PUT, POST foto, PATCH, DELETE", async () => {
  const tulis = SEMUA_RUTE.filter(([m]) => m !== "GET");
  assert.equal(tulis.length, 4);
  const jejak0 = await cacah("jejak"), bukti0 = await cacah("agenda_bukti");
  for (const peran of PERAN_TOLAK_TULIS) for (const [m, j, b] of tulis) {
    assert.equal((await panggil(m, j, { peran, badan: b })).status, 403, `${peran} ${m} ${j}`);
  }
  assert.equal(await cacah("jejak"), jejak0, "ditolak: jejak tak bertambah");
  assert.equal(await cacah("agenda_bukti"), bukti0, "ditolak: tak ada bukti dibuat");
  assert.equal(BERKAS.size, 0, "ditolak: R2 tak tersentuh");
});

test("semua peran login boleh GET (200): daftar, ref sah, ref belum berbukti", async () => {
  for (const peran of PERAN_SEMUA) {
    const a = await panggil("GET", "/api/agenda", { peran });
    assert.equal(a.status, 200, peran);
    assert.ok(Array.isArray((await json(a)).bukti));
    const b = await panggil("GET", "/api/agenda/ac_029", { peran });
    assert.equal(b.status, 200, peran);
    assert.equal(b.headers.get("cache-control"), "private, no-store");
  }
});

test("ref tak dikenal, ref regulasi, dan ref berpola salah: 404 (baca dan tulis)", async () => {
  for (const ref of ["tidak_ada", "reg_001", "ADA", "a".repeat(41)]) {
    assert.equal((await panggil("GET", `/api/agenda/${ref}`, { peran: "anggota" })).status, 404, `GET ${ref}`);
    assert.equal((await panggil("PUT", `/api/agenda/${ref}`, { peran: "kurator", badan: { tempat: "x" } })).status, 404, `PUT ${ref}`);
    assert.equal((await panggil("POST", `/api/agenda/${ref}/foto`, { peran: "kurator", badan: JPEG })).status, 404, `POST ${ref}`);
  }
  assert.equal(await cacah("agenda_bukti"), 0);
  assert.equal(BERKAS.size, 0);
});

test("tulis tanpa x-pb: 403 walau peran berhak, tanpa efek", async () => {
  const jejak0 = await cacah("jejak");
  assert.equal((await panggil("PUT", "/api/agenda/ac_029", { peran: "admin", badan: { tempat: "x" }, pb: false })).status, 403);
  assert.equal((await panggil("POST", "/api/agenda/ac_029/foto", { peran: "admin", badan: JPEG, pb: false })).status, 403);
  assert.equal((await panggil("DELETE", "/api/agenda/foto/1", { peran: "admin", pb: false })).status, 403);
  assert.equal(await cacah("jejak"), jejak0);
  assert.equal(await cacah("agenda_bukti"), 0);
});

test("PUT: kurator/admin/super tambah lalu ubah; tiap tulis = satu jejak agenda_bukti; null mengosongkan", async () => {
  for (const peran of PERAN_TULIS) {
    const j0 = await cacah("jejak", "WHERE tabel = 'agenda_bukti'");
    const res = await panggil("PUT", "/api/agenda/ac_029", { peran, badan: { tempat: `Jakarta ${peran}`, notulensi: `Catatan ${peran}` } });
    assert.equal(res.status, 200, peran);
    const { id } = await json(res);
    assert.ok(id > 0);
    assert.equal(await cacah("jejak", "WHERE tabel = 'agenda_bukti'"), j0 + 1, `${peran}: tepat satu jejak`);
    const b = await satu("SELECT tempat, notulensi, oleh FROM agenda_bukti WHERE id = ?", id);
    assert.equal(b.tempat, `Jakarta ${peran}`); assert.ok(b.oleh > 0);
    const g = await json(await panggil("GET", "/api/agenda/ac_029", { peran: "anggota" }));
    assert.equal(g.bukti.notulensi, `Catatan ${peran}`);
  }
  assert.equal(await cacah("agenda_bukti"), 1, "satu baris per kegiatan_ref");
  await panggil("PUT", "/api/agenda/ac_029", { peran: "admin", badan: { tempat: null } });
  assert.equal((await satu("SELECT tempat FROM agenda_bukti")).tempat, null);
  const daftar = await json(await panggil("GET", "/api/agenda", { peran: "anggota" }));
  assert.deepEqual(daftar.bukti, [{ kegiatan_ref: "ac_029", ada_notulensi: true, jumlah_foto: 0 }]);
});

test("PUT masukan salah (tipe, panjang) 422 tanpa efek", async () => {
  const j0 = await cacah("jejak");
  assert.equal((await panggil("PUT", "/api/agenda/ac_029", { peran: "admin", badan: { tempat: 5 } })).status, 422);
  assert.equal((await panggil("PUT", "/api/agenda/ac_029", { peran: "admin", badan: { tempat: "x".repeat(201) } })).status, 422);
  assert.equal((await panggil("PUT", "/api/agenda/ac_029", { peran: "admin", badan: { notulensi: "x".repeat(30001) } })).status, 422);
  assert.equal(await cacah("jejak"), j0);
});

let FOTO_ID, KUNCI;
test("unggah: bukan gambar (magic byte salah) 422 walau content-type image/jpeg; kosong 422", async () => {
  const j0 = await cacah("jejak"), f0 = await cacah("agenda_foto");
  const palsu = new TextEncoder().encode("<html>bukan gambar</html>");
  let res = await panggil("POST", "/api/agenda/ac_029/foto", { peran: "kurator", badan: palsu, header: { "content-type": "image/jpeg" } });
  assert.equal(res.status, 422);
  res = await panggil("POST", "/api/agenda/ac_029/foto", { peran: "kurator", badan: new Uint8Array(0) });
  assert.equal(res.status, 422);
  assert.equal(await cacah("agenda_foto"), f0); assert.equal(await cacah("jejak"), j0); assert.equal(BERKAS.size, 0);
});

test("unggah: lebih dari 5 MB 413 tanpa objek R2 dan tanpa baris", async () => {
  const besar = new Uint8Array(5 * 1024 * 1024 + 1); besar.set(JPEG);
  const res = await panggil("POST", "/api/agenda/ac_029/foto", { peran: "kurator", badan: besar });
  assert.equal(res.status, 413);
  assert.equal(await cacah("agenda_foto"), 0); assert.equal(BERKAS.size, 0);
});

test("unggah JPEG sah: tersimpan, jejak agenda_foto, GET foto = byte sama, image/jpeg, private no-store", async () => {
  const j0 = await cacah("jejak", "WHERE tabel = 'agenda_foto'");
  const res = await panggil("POST", "/api/agenda/ac_029/foto?keterangan=Peserta%20rapat", { peran: "kurator", badan: JPEG });
  assert.ok([200, 201].includes(res.status), "status " + res.status);
  FOTO_ID = (await json(res)).id;
  const baris = await satu("SELECT kunci_r2, tipe, ukuran, keterangan, oleh FROM agenda_foto WHERE id = ?", FOTO_ID);
  KUNCI = baris.kunci_r2;
  assert.match(KUNCI, /^agenda\/[0-9a-f]{32}\.jpg$/);
  assert.equal(baris.tipe, "image/jpeg"); assert.equal(baris.ukuran, JPEG.length); assert.equal(baris.keterangan, "Peserta rapat"); assert.ok(baris.oleh > 0);
  assert.ok(BERKAS.has(KUNCI));
  assert.equal(await cacah("jejak", "WHERE tabel = 'agenda_foto'"), j0 + 1);
  for (const peran of PERAN_SEMUA) {
    const g = await panggil("GET", `/api/agenda/foto/${FOTO_ID}`, { peran });
    assert.equal(g.status, 200, peran);
    assert.equal(g.headers.get("content-type"), "image/jpeg");
    assert.match(g.headers.get("cache-control"), /private/); assert.match(g.headers.get("cache-control"), /no-store/);
    assert.equal(g.headers.get("x-content-type-options"), "nosniff");
    assert.deepEqual(new Uint8Array(await g.arrayBuffer()), JPEG, peran);
  }
  const det = await json(await panggil("GET", "/api/agenda/ac_029", { peran: "pengurus" }));
  assert.deepEqual(det.foto.map((f) => f.id), [FOTO_ID]);
  assert.ok(!("kunci_r2" in det.foto[0]), "kunci R2 tak bocor ke klien");
});

test("PATCH foto: kurator ubah keterangan/urutan + jejak; masukan salah 422; id tak ada 404", async () => {
  const j0 = await cacah("jejak", "WHERE tabel = 'agenda_foto'");
  assert.equal((await panggil("PATCH", `/api/agenda/foto/${FOTO_ID}`, { peran: "kurator", badan: { keterangan: "Baru", urutan: 3 } })).status, 200);
  const b = await satu("SELECT keterangan, urutan FROM agenda_foto WHERE id = ?", FOTO_ID);
  assert.deepEqual([b.keterangan, b.urutan], ["Baru", 3]);
  assert.equal(await cacah("jejak", "WHERE tabel = 'agenda_foto'"), j0 + 1);
  assert.equal((await panggil("PATCH", `/api/agenda/foto/${FOTO_ID}`, { peran: "kurator", badan: { urutan: 1000 } })).status, 422);
  assert.equal((await panggil("PATCH", `/api/agenda/foto/${FOTO_ID}`, { peran: "kurator", badan: { kunci_r2: "agenda/x.jpg" } })).status, 422);
  assert.equal((await panggil("PATCH", "/api/agenda/foto/99999", { peran: "kurator", badan: { urutan: 1 } })).status, 404);
});

test("DELETE foto: baris D1 dan objek R2 hilang, jejak hapus; GET sesudahnya 404", async () => {
  const j0 = await cacah("jejak", "WHERE tabel = 'agenda_foto' AND aksi = 'hapus'");
  const res = await panggil("DELETE", `/api/agenda/foto/${FOTO_ID}`, { peran: "admin" });
  assert.equal(res.status, 200); assert.deepEqual(await json(res), { ok: true });
  assert.equal(await satu("SELECT id FROM agenda_foto WHERE id = ?", FOTO_ID), null);
  assert.ok(!BERKAS.has(KUNCI), "objek R2 dihapus");
  assert.equal(await cacah("jejak", "WHERE tabel = 'agenda_foto' AND aksi = 'hapus'"), j0 + 1);
  assert.equal((await panggil("GET", `/api/agenda/foto/${FOTO_ID}`, { peran: "anggota" })).status, 404);
  assert.equal((await panggil("DELETE", `/api/agenda/foto/${FOTO_ID}`, { peran: "admin" })).status, 404);
});

test("PNG dan WEBP sah diterima dengan ekstensi sesuai; GIF ditolak 422", async () => {
  const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]);
  const webp = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50]);
  const gif = new TextEncoder().encode("GIF89a\0\0\0\0");
  for (const [b, ext, tipe] of [[png, "png", "image/png"], [webp, "webp", "image/webp"]]) {
    const res = await panggil("POST", "/api/agenda/ac_029/foto", { peran: "super", badan: b });
    assert.ok([200, 201].includes(res.status));
    const r = await satu("SELECT kunci_r2, tipe FROM agenda_foto WHERE id = ?", (await json(res)).id);
    assert.match(r.kunci_r2, new RegExp(`\\.${ext}$`)); assert.equal(r.tipe, tipe);
  }
  assert.equal((await panggil("POST", "/api/agenda/ac_029/foto", { peran: "super", badan: gif })).status, 422);
});

test("bila D1 gagal setelah R2 ditulis, objek R2 dibersihkan (batas 40 foto lewat rute)", async () => {
  const bukti = await satu("SELECT id FROM agenda_bukti WHERE kegiatan_ref = 'ac_029'");
  let n = await cacah("agenda_foto", `WHERE bukti_id = ${bukti.id}`);
  for (; n < 40; n++) await q("INSERT INTO agenda_foto (bukti_id, kunci_r2, tipe, ukuran) VALUES (?,?,?,1)", bukti.id, `agenda/${n.toString(16).padStart(32, "0")}.jpg`, "image/jpeg").run();
  const r2Sebelum = BERKAS.size;
  const res = await panggil("POST", "/api/agenda/ac_029/foto", { peran: "kurator", badan: JPEG });
  assert.ok(res.status >= 400, "status " + res.status);
  assert.equal(BERKAS.size, r2Sebelum, "tidak ada objek R2 yatim");
  assert.equal(await cacah("agenda_foto", `WHERE bukti_id = ${bukti.id}`), 40);
});

/* ---------- migrasi 0010: idempoten, CHECK, trigger ---------- */
const SQL_0010 = readFileSync(new URL("../migrations/0010_agenda_bukti.sql", import.meta.url), "utf8");
const KUNCI_OK = (i) => `agenda/${i.toString(16).padStart(32, "0")}.jpg`;

test("migrasi 0010 dijalankan dua kali tanpa galat dan tanpa mengubah isi", async () => {
  const sebelum = await cacah("agenda_bukti");
  for (let i = 0; i < 2; i++) for (const s of pecahSql(SQL_0010)) await E.DB.prepare(s).run();
  assert.equal(await cacah("agenda_bukti"), sebelum);
});

async function tolak(sql, ...b) {
  await assert.rejects(() => q(sql, ...b).run(), /constraint|CHECK|abort/i, sql);
}
test("CHECK agenda_bukti.kegiatan_ref menolak kosong, huruf besar, spasi, > 40, dan duplikat", async () => {
  const sql = "INSERT INTO agenda_bukti (kegiatan_ref) VALUES (?)";
  for (const v of ["", "ABC", "a b", "a/b", "a".repeat(41), "ac_029"]) await tolak(sql, v);
  await q(sql, "ok_1-x").run();
  await q(sql, "a".repeat(40)).run();
});
test("CHECK agenda_bukti.tempat > 200 dan notulensi > 30000 ditolak", async () => {
  await tolak("INSERT INTO agenda_bukti (kegiatan_ref, tempat) VALUES ('t1', ?)", "x".repeat(201));
  await tolak("INSERT INTO agenda_bukti (kegiatan_ref, notulensi) VALUES ('t2', ?)", "x".repeat(30001));
});
test("CHECK agenda_foto: kunci_r2, tipe, ukuran, keterangan, urutan salah DITOLAK; yang sah diterima", async () => {
  const b = (await satu("SELECT id FROM agenda_bukti WHERE kegiatan_ref = 'ok_1-x'")).id;
  const sql = "INSERT INTO agenda_foto (bukti_id, kunci_r2, tipe, ukuran, keterangan, urutan) VALUES (?,?,?,?,?,?)";
  const sah = [b, KUNCI_OK(900), "image/png", 10, null, 0];
  for (const [i, v] of [
    [1, "foto/" + "a".repeat(32) + ".jpg"], [1, "agenda/" + "a".repeat(32) + ".gif"], [1, "agenda/" + "a".repeat(32) + ".jpeg"],
    [1, "agenda/" + "a".repeat(40) + ".jpg"], [1, "agenda/" + "g".repeat(32) + ".jpg"],
    [2, "image/gif"], [2, "text/html"], [3, 0], [3, 5242881], [3, -1], [4, "x".repeat(301)], [5, -1], [5, 1000],
  ]) { const a = [...sah]; a[i] = v; await tolak(sql, ...a); }
  await tolak(sql, null, ...sah.slice(1));
  await tolak(sql, 424242, ...sah.slice(1)); // FK bukti tak ada
  await q(sql, ...sah).run();
  await q(sql, b, KUNCI_OK(901), "image/webp", 5242880, "x".repeat(300), 999).run();
  await tolak(sql, ...sah); // kunci_r2 UNIQUE
});
test("trigger agenda_foto_batas: foto ke-41 per bukti ditolak, bukti lain tak terpengaruh, hapus membuka slot", async () => {
  const ib = (await q("INSERT INTO agenda_bukti (kegiatan_ref) VALUES ('batas_a')").run()).meta.last_row_id;
  const ib2 = (await q("INSERT INTO agenda_bukti (kegiatan_ref) VALUES ('batas_b')").run()).meta.last_row_id;
  const sql = "INSERT INTO agenda_foto (bukti_id, kunci_r2, tipe, ukuran) VALUES (?,?,'image/jpeg',1)";
  for (let i = 0; i < 40; i++) await q(sql, ib, KUNCI_OK(2000 + i)).run();
  await assert.rejects(() => q(sql, ib, KUNCI_OK(2040)).run(), /maksimal 40/);
  assert.equal(await cacah("agenda_foto", `WHERE bukti_id = ${ib}`), 40);
  await q(sql, ib2, KUNCI_OK(2041)).run();
  await q("DELETE FROM agenda_foto WHERE kunci_r2 = ?", KUNCI_OK(2000)).run();
  await q(sql, ib, KUNCI_OK(2042)).run();
  // ON DELETE CASCADE
  await q("DELETE FROM agenda_bukti WHERE id = ?", ib).run();
  assert.equal(await cacah("agenda_foto", `WHERE bukti_id = ${ib}`), 0);
});

/* ---------- metadata ditolak, polos lolos; jejak tanpa teks notulensi; %E0 = 404 ---------- */
const enc = (s) => new TextEncoder().encode(s);
const cat = (...a) => { const o = new Uint8Array(a.reduce((n, x) => n + x.length, 0)); let p = 0; for (const x of a) { o.set(x, p); p += x.length; } return o; };
const jpgSeg = (m, isi) => cat(new Uint8Array([0xff, m, (isi.length + 2) >> 8, (isi.length + 2) & 255]), isi);
const jpg = (...seg) => cat(new Uint8Array([0xff, 0xd8]), ...seg, new Uint8Array([0xff, 0xd9]));
const JFIF = jpgSeg(0xe0, enc("JFIF\0\x01\x01\0\0\x01\0\x01\0\0"));
const pngCh = (t, isi) => cat(new Uint8Array([(isi.length >>> 24) & 255, (isi.length >> 16) & 255, (isi.length >> 8) & 255, isi.length & 255]), enc(t), isi, new Uint8Array(4));
const png = (...ch) => cat(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), pngCh("IHDR", new Uint8Array(13)), ...ch, pngCh("IEND", new Uint8Array(0)));
const wpCh = (t, isi) => cat(enc(t), new Uint8Array([isi.length & 255, isi.length >> 8, 0, 0]), isi, new Uint8Array(isi.length & 1));
const webp = (...ch) => { const isi = cat(enc("WEBP"), ...ch); return cat(enc("RIFF"), new Uint8Array([isi.length & 255, isi.length >> 8, 0, 0]), isi); };
const vp8x = (flag) => wpCh("VP8X", cat(new Uint8Array([flag, 0, 0, 0]), new Uint8Array(6)));
const VP8 = wpCh("VP8 ", new Uint8Array(10));

const BERMETADATA = {
  "JPEG APP1 Exif": jpg(JFIF, jpgSeg(0xe1, enc("Exif\0\0II*\0"))),
  "JPEG APP1 XMP": jpg(JFIF, jpgSeg(0xe1, enc("http://ns.adobe.com/xap/1.0/\0<x/>"))),
  "JPEG APP13": jpg(JFIF, jpgSeg(0xed, enc("Photoshop 3.0\0"))),
  "PNG eXIf": png(pngCh("eXIf", enc("MM\0*"))),
  "PNG tEXt XMP": png(pngCh("tEXt", enc("XML:com.adobe.xmp\0<x/>"))),
  "PNG iTXt XMP": png(pngCh("iTXt", enc("XML:com.adobe.xmp\0\0\0\0\0<x/>"))),
  "WebP chunk EXIF": webp(VP8, wpCh("EXIF", enc("II*\0"))),
  "WebP chunk XMP": webp(VP8, wpCh("XMP ", enc("<x/>"))),
  "WebP VP8X flag EXIF 0x08": webp(vp8x(0x08), VP8),
  "WebP VP8X flag XMP 0x04": webp(vp8x(0x04), VP8),
};
const POLOS = {
  "JPEG polos": jpg(JFIF),
  "PNG polos": png(pngCh("tEXt", enc("Comment\0halo"))),
  "WebP polos": webp(VP8),
  "WebP VP8X tanpa flag metadata": webp(vp8x(0x10), VP8),
};

test("unggah bermetadata (EXIF/XMP/APP13, per format) DITOLAK 422 tanpa baris, jejak, atau objek R2", async () => {
  const f0 = await cacah("agenda_foto"), j0 = await cacah("jejak"), r0 = BERKAS.size;
  for (const [nama, b] of Object.entries(BERMETADATA)) {
    assert.equal((await panggil("POST", "/api/agenda/ac_029/foto", { peran: "kurator", badan: b })).status, 422, nama);
  }
  assert.equal(await cacah("agenda_foto"), f0); assert.equal(await cacah("jejak"), j0); assert.equal(BERKAS.size, r0);
});

test("unggah polos (JPEG/PNG/WebP tanpa metadata) tetap lolos", async () => {
  const bukti = await satu("SELECT id FROM agenda_bukti WHERE kegiatan_ref = 'ac_029'");
  await q("DELETE FROM agenda_foto WHERE bukti_id = ?", bukti.id).run(); // kosongkan slot dari uji batas 40
  for (const [nama, b] of Object.entries(POLOS)) {
    const res = await panggil("POST", "/api/agenda/ac_029/foto", { peran: "kurator", badan: b });
    assert.ok([200, 201].includes(res.status), `${nama}: ${res.status}`);
  }
});

test("PUT notulensi: kolom ke di jejak hanya memuat notulensi_panjang, bukan teksnya", async () => {
  const rahasia = "RAHASIA-NOTULENSI-UNIK-123";
  assert.equal((await panggil("PUT", "/api/agenda/ac_029", { peran: "admin", badan: { notulensi: rahasia, tempat: "Aula" } })).status, 200);
  const baris = (await q("SELECT ke FROM jejak WHERE tabel = 'agenda_bukti' ORDER BY id DESC LIMIT 1").all()).results[0];
  assert.ok(!baris.ke.includes(rahasia), "teks notulensi bocor ke jejak: " + baris.ke);
  const ke = JSON.parse(baris.ke);
  assert.equal(ke.notulensi_panjang, rahasia.length);
  assert.ok(!("notulensi" in ke));
  const semua = (await q("SELECT ke, dari FROM jejak").all()).results;
  assert.ok(semua.every((r) => !(r.ke ?? "").includes(rahasia) && !(r.dari ?? "").includes(rahasia)), "tak ada jejak memuat teks");
});

test("path dengan %E0 (UTF-8 rusak) di rute agenda: 404, bukan 500", async () => {
  for (const [m, j] of [["GET", "/api/agenda/%E0"], ["GET", "/api/agenda/foto/%E0"], ["PUT", "/api/agenda/%E0"], ["POST", "/api/agenda/%E0/foto"], ["DELETE", "/api/agenda/foto/%E0"]]) {
    const res = await panggil(m, j, { peran: "admin", badan: m === "PUT" ? {} : m === "POST" ? JPEG : undefined });
    assert.equal(res.status, 404, `${m} ${j}`);
  }
});
