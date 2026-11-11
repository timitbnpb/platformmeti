// JM-S07: rute /api/riwayat lewat worker.fetch utuh, D1 lokal NYATA (hak, CHECK, trigger, jejak berjalan sungguhan).
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { buatEnv } from "./_bantu.mjs";
import worker from "../src/worker.js";
import * as hak from "../src/hak.js";
import { sha } from "../src/util.js";

const PERAN = ["anggota", "pengurus", "pengurus2", "kurator", "wilayah", "admin", "super"];
let E, tutup, ORANG, LEMBAGA, PROYEK;
const COOKIE = {}, ID = {};
const q = (s, ...b) => E.DB.prepare(s).bind(...b);
const satu = (s, ...b) => q(s, ...b).first();
const cacah = async (t) => (await satu(`SELECT count(*) AS n FROM ${t}`)).n;

before(async () => {
  ({ env: E, tutup } = await buatEnv());
  for (const [i, k] of PERAN.entries()) {
    const peran = k.replace(/2$/, "");
    const r = await q("INSERT INTO akun (surel, nama, peran, cakupan_prov, status, garam, sandi, iterasi) VALUES (?,?,?,?, 'aktif', ?, ?, 100000)",
      `${k}@uji.test`, k, peran, peran === "wilayah" ? "31" : null, "a".repeat(32), "a".repeat(64)).run();
    ID[k] = r.meta.last_row_id;
    const token = (i + 16).toString(16).repeat(32);
    await hak.catatSesi(E, { idHash: await sha(token), akunId: r.meta.last_row_id, peran, sampai: Math.floor(Date.now() / 1000) + 3600, ipHash: "h" });
    COOKIE[k] = `sesi=${token}`;
  }
  const S = (await q("INSERT INTO sumber (url, domain, jenis, diperiksa) VALUES ('https://s.example/a','s.example','dokumen-resmi','2026-11-01')").run()).meta.last_row_id;
  const ent = async (jenis, nama) => (await q("INSERT INTO entitas (kunci, slug, jenis, nama, lapis, tampil, sumber_id) VALUES (?,?,?,?, 'publik', 1, ?)", jenis + ":" + nama, nama, jenis, nama, S).run()).meta.last_row_id;
  ORANG = await ent("orang", "budi"); LEMBAGA = await ent("lembaga", "lemb"); PROYEK = await ent("proyek", "pltx");
});
after(async () => { await tutup?.(); });

async function panggil(metode, jalur, peran, badan) {
  const h = { origin: "https://uji.test", "cf-connecting-ip": "203.0.113.7" };
  if (peran) h.cookie = COOKIE[peran];
  if (metode !== "GET") h["x-pb"] = "1";
  let body;
  if (badan !== undefined) { body = JSON.stringify(badan); h["content-type"] = "application/json"; }
  return worker.fetch(new Request("https://uji.test" + jalur, { method: metode, headers: h, body }), E, { waitUntil() {} });
}
const ok = { jenis: "audiensi", tanggal: "2026-10-01", judul: "Audiensi contoh" };

test("PB 401, AN/KR/WL 403 di semua rute riwayat; tanpa efek", async () => {
  const n0 = await cacah("riwayat"), j0 = await cacah("jejak");
  for (const [m, j, b] of [["GET", `/api/riwayat?target=${ORANG}`], ["POST", "/api/riwayat", { ...ok, target_id: ORANG }], ["PATCH", "/api/riwayat/1", { judul: "x" }], ["DELETE", "/api/riwayat/1"]]) {
    assert.equal((await panggil(m, j, null, b)).status, 401, `PB ${m} ${j}`);
    for (const p of ["anggota", "kurator", "wilayah"]) assert.equal((await panggil(m, j, p, b)).status, 403, `${p} ${m} ${j}`);
  }
  assert.equal(await cacah("riwayat"), n0); assert.equal(await cacah("jejak"), j0);
});

test("PG/AD/SA boleh tambah dan baca; oleh dari sesi, tidak bocor, milik benar", async () => {
  const r = await panggil("POST", "/api/riwayat", "pengurus", { ...ok, target_id: ORANG, catatan: "c", penilaian: 4 });
  assert.equal(r.status, 201);
  const { id } = await r.json();
  assert.equal((await satu("SELECT oleh FROM riwayat WHERE id = ?", id)).oleh, ID.pengurus);
  assert.ok((await satu("SELECT 1 AS x FROM jejak WHERE tabel='riwayat' AND aksi='tambah' AND baris_id = ?", String(id))));
  for (const p of ["admin", "super"]) assert.equal((await panggil("POST", "/api/riwayat", p, { ...ok, target_id: LEMBAGA })).status, 201);
  const g = await (await panggil("GET", `/api/riwayat?target=${ORANG}`, "pengurus")).json();
  assert.equal(g.riwayat.length, 1); assert.equal(g.riwayat[0].milik, true); assert.ok(!("oleh" in g.riwayat[0]));
  assert.equal((await (await panggil("GET", `/api/riwayat?target=${ORANG}`, "pengurus2")).json()).riwayat[0].milik, false);
  assert.equal((await (await panggil("GET", `/api/riwayat?target=${LEMBAGA}`, "admin")).json()).riwayat.length, 2);
});

test("masukan salah DITOLAK 422 tanpa efek: oleh dari klien, target proyek, tanggal, jenis, penilaian, target tak ada", async () => {
  const n0 = await cacah("riwayat");
  for (const b of [{ ...ok, target_id: ORANG, oleh: ID.admin }, { ...ok, target_id: PROYEK }, { ...ok, target_id: 99999 }, { ...ok, target_id: ORANG, tanggal: "2026-13-40" },
    { ...ok, target_id: ORANG, jenis: "rahasia" }, { ...ok, target_id: ORANG, penilaian: 9 }, { ...ok, target_id: ORANG, tanggal_selesai: "2026-09-01" }, { ...ok, target_id: ORANG, judul: "" }, { ok: 1 }]) {
    assert.equal((await panggil("POST", "/api/riwayat", "pengurus", b)).status, 422, JSON.stringify(b));
  }
  assert.equal((await panggil("GET", "/api/riwayat?target=abc", "pengurus")).status, 422);
  assert.equal(await cacah("riwayat"), n0);
});

test("PATCH/DELETE: PG hanya miliknya (404 untuk milik orang), AD/SA semua; jejak ubah dan hapus", async () => {
  const id = (await satu("SELECT id FROM riwayat WHERE oleh = ? LIMIT 1", ID.pengurus)).id;
  assert.equal((await panggil("PATCH", `/api/riwayat/${id}`, "pengurus2", { judul: "bajak" })).status, 404);
  assert.equal((await panggil("DELETE", `/api/riwayat/${id}`, "pengurus2")).status, 404);
  assert.equal((await satu("SELECT judul FROM riwayat WHERE id = ?", id)).judul, "Audiensi contoh");
  assert.equal((await panggil("PATCH", `/api/riwayat/${id}`, "pengurus", { oleh: 1 })).status, 422);
  assert.equal((await panggil("PATCH", `/api/riwayat/${id}`, "pengurus", { judul: "Baru" })).status, 200);
  assert.equal((await satu("SELECT judul FROM riwayat WHERE id = ?", id)).judul, "Baru");
  assert.ok(await satu("SELECT 1 AS x FROM jejak WHERE tabel='riwayat' AND aksi='ubah' AND baris_id = ?", String(id)));
  assert.equal((await panggil("DELETE", `/api/riwayat/${id}`, "admin")).status, 200);
  assert.equal(await satu("SELECT 1 AS x FROM riwayat WHERE id = ?", id), null);
  assert.ok(await satu("SELECT 1 AS x FROM jejak WHERE tabel='riwayat' AND aksi='hapus' AND baris_id = ?", String(id)));
  const l = (await satu("SELECT id FROM riwayat WHERE oleh = ?", ID.super)).id;
  assert.equal((await panggil("DELETE", `/api/riwayat/${l}`, "pengurus")).status, 404);
  assert.equal((await panggil("DELETE", `/api/riwayat/${l}`, "super")).status, 200);
});
