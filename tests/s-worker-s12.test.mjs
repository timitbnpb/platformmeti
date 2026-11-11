// JM-S12: rute yang MATRIKS izinkan tetapi dulu ditutup: koreksi admin untuk kurator, kontak direktori untuk wilayah (filter prov). D1 lokal NYATA.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { buatEnv } from "./_bantu.mjs";
import worker from "../src/worker.js";
import * as hak from "../src/hak.js";
import { sha } from "../src/util.js";

const PERAN = ["anggota", "pengurus", "kurator", "wilayah", "wilayah32", "admin", "super"];
const KONTAK = { A1: { prov: "31", email: ["a@x.id"] }, A2: { prov: "32", email: ["b@x.id"] }, A3: { email: ["c@x.id"] } };
let E, tutup;
const COOKIE = {};
const q = (s, ...b) => E.DB.prepare(s).bind(...b);

before(async () => {
  ({ env: E, tutup } = await buatEnv());
  E.BERKAS = { get: async (k) => (k === "potret/pengurus/kontak.json" ? { json: async () => KONTAK, uploaded: new Date() } : null) };
  for (const [i, k] of PERAN.entries()) {
    const peran = k.replace(/32$/, "");
    const prov = k === "wilayah" ? "31" : k === "wilayah32" ? "32" : null;
    const r = await q("INSERT INTO akun (surel, nama, peran, cakupan_prov, status, garam, sandi, iterasi) VALUES (?,?,?,?, 'aktif', ?, ?, 100000)",
      `${k}@uji.test`, k, peran, prov, "a".repeat(32), "a".repeat(64)).run();
    const token = (i + 32).toString(16).repeat(32);
    await hak.catatSesi(E, { idHash: await sha(token), akunId: r.meta.last_row_id, peran, sampai: Math.floor(Date.now() / 1000) + 3600, ipHash: "h" });
    COOKIE[k] = `sesi=${token}`;
  }
});
after(async () => { await tutup?.(); });

const panggil = (metode, jalur, peran, badan) => {
  const h = { origin: "https://uji.test", "cf-connecting-ip": "203.0.113.9" };
  if (peran) h.cookie = COOKIE[peran];
  if (metode !== "GET") { h["x-pb"] = "1"; h["content-type"] = "application/json"; }
  return worker.fetch(new Request("https://uji.test" + jalur, { method: metode, headers: h, body: badan === undefined ? undefined : JSON.stringify(badan) }), E, { waitUntil() {} });
};

test("koreksi admin: kurator BOLEH baca dan putus; anggota/pengurus/wilayah/tamu DITOLAK", async () => {
  await q("INSERT INTO koreksi_usul (entitas, entitas_id, kolom, nilai_usulan, alasan, sumber_url) VALUES ('organisasi','meti','situs','https://b.id','alasan','https://b.id/i')").run();
  const id = (await q("SELECT id FROM koreksi_usul").first()).id;
  assert.equal((await panggil("GET", "/api/admin/koreksi", null)).status, 401);
  for (const p of ["anggota", "pengurus", "wilayah"]) {
    assert.equal((await panggil("GET", "/api/admin/koreksi", p)).status, 403, p);
    assert.equal((await panggil("POST", `/api/admin/koreksi/${id}`, p, { aksi: "tolak" })).status, 403, p);
  }
  assert.equal((await q("SELECT status FROM koreksi_usul WHERE id = ?", id).first()).status, "baru", "ditolak: tanpa efek");
  for (const p of ["kurator", "admin", "super"]) assert.equal((await panggil("GET", "/api/admin/koreksi", p)).status, 200, p);
  assert.equal((await panggil("POST", `/api/admin/koreksi/${id}`, "kurator", { aksi: "tolak", catatan: "tidak sah" })).status, 200);
  const row = await q("SELECT status, diputus_oleh FROM koreksi_usul WHERE id = ?", id).first();
  assert.equal(row.status, "tolak"); assert.ok(row.diputus_oleh);
  assert.ok(await q("SELECT 1 AS x FROM jejak WHERE tabel = 'koreksi_usul' AND aksi = 'tinjau'").first());
});

test("kontak direktori: WL hanya entri provinsinya, tanpa prov atau tanpa cakupan = kosong; AN/tamu ditolak; PG/KR/AD/SA penuh", async () => {
  assert.equal((await panggil("GET", "/api/direktori/kontak", null)).status, 401);
  assert.equal((await panggil("GET", "/api/direktori/kontak", "anggota")).status, 403);
  const ambil = async (p) => Object.keys(await (await panggil("GET", "/api/direktori/kontak", p)).json()).sort();
  assert.deepEqual(await ambil("wilayah"), ["A1"]);
  assert.deepEqual(await ambil("wilayah32"), ["A2"]);
  for (const p of ["pengurus", "kurator", "admin", "super"]) assert.deepEqual(await ambil(p), ["A1", "A2", "A3"], p);
});
