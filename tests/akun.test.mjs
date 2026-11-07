// Uji rute admin akun + jejak di D1 lokal nyata. Handler dipanggil langsung dengan p = { params, sesi, akun }.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { buatEnv, minta } from "./_bantu.mjs";
import { rute } from "../src/akun.js";
import * as hak from "../src/hak.js";
import { sha } from "../src/util.js";

let E, tutup;
const A = {};
const q = (s, ...b) => E.DB.prepare(s).bind(...b);
const satu = (s, ...b) => q(s, ...b).first();
const semua = async (s, ...b) => (await q(s, ...b).all()).results;
const H = (n, c) => c.repeat(n);

async function akun(k, peran, cakupan = null) {
  const r = await q("INSERT INTO akun (surel, nama, peran, cakupan_prov, status, garam, sandi, iterasi) VALUES (?,?,?,?, 'aktif', ?, ?, 100000)", `${k}@uji.test`, k, peran, cakupan, H(32, "a"), H(64, "a")).run();
  A[k] = { id: r.meta.last_row_id, peran, nama: k, cakupan_prov: cakupan, status: "aktif" };
}
// panggil rute; galat Galat diubah jadi { status, kode } seperti router
async function panggil(kunci, akunPelaku, { id, badan, jalur = "/api/admin/akun" } = {}) {
  const metode = kunci.split(" ")[0];
  const req = minta(jalur, { metode, badan: metode === "GET" ? undefined : badan });
  try {
    const res = await rute[kunci](req, E, {}, { params: { id: id != null ? String(id) : undefined }, sesi: null, akun: akunPelaku });
    return { status: res.status, ...(await res.json()) };
  } catch (e) { if (e.kode) return { status: e.status, kode: e.kode }; throw e; }
}

before(async () => {
  ({ env: E, tutup } = await buatEnv());
  await akun("anggota", "anggota"); await akun("anggota2", "anggota"); await akun("kurator", "kurator");
  await akun("wilayah", "wilayah", "31"); await akun("admin", "admin"); await akun("admin2", "admin"); await akun("super", "super");
});
after(async () => { await tutup?.(); });

test("gerbang peran di rute admin: PB 401, AN/KR/WL/PG 403", async () => {
  for (const k of ["GET /api/admin/akun", "POST /api/admin/akun", "PATCH /api/admin/akun/:id", "POST /api/admin/akun/:id/aktivasi", "DELETE /api/admin/akun/:id/sesi", "GET /api/admin/jejak"]) {
    assert.equal((await panggil(k, null, { id: 1, badan: {} })).status, 401, k);
    for (const p of ["anggota", "kurator", "wilayah"]) assert.equal((await panggil(k, A[p], { id: 1, badan: {} })).status, 403, `${k} ${p}`);
  }
});

test("buat akun: tautan sekali tampil, hash disimpan, 72 jam, jejak 'tambah' tanpa rahasia", async () => {
  const r = await panggil("POST /api/admin/akun", A.admin, { badan: { surel: "Baru@Uji.test", nama: "Baru", peran: "kurator" } });
  assert.equal(r.status, 201);
  const token = new URL(r.tautan_aktivasi).searchParams.get("token");
  const row = await satu("SELECT status, aktivasi_hash, aktivasi_sampai, surel FROM akun WHERE id = ?", r.id);
  assert.equal(row.surel, "baru@uji.test"); assert.equal(row.status, "menunggu");
  assert.equal(row.aktivasi_hash, await sha(token)); assert.notEqual(row.aktivasi_hash, token);
  assert.ok(Math.abs(row.aktivasi_sampai - (Date.now() / 1000 + 72 * 3600)) < 60);
  const j = await satu("SELECT aksi, siapa, ke FROM jejak WHERE tabel='akun' AND baris_id = ?", String(r.id));
  assert.equal(j.aksi, "tambah"); assert.equal(j.siapa, A.admin.id);
  assert.ok(!j.ke.includes(token) && !j.ke.includes("aktivasi_hash"));
  assert.equal((await hak.periksaTautanAktivasi(E, await sha(token))).id, r.id);
  // surel ganda -> konflik; wilayah wajib cakupan; peran liar
  assert.equal((await panggil("POST /api/admin/akun", A.admin, { badan: { surel: "baru@uji.test", nama: "X", peran: "anggota" } })).kode, "konflik");
  assert.equal((await panggil("POST /api/admin/akun", A.admin, { badan: { surel: "w@uji.test", nama: "W", peran: "wilayah" } })).status, 422);
  assert.equal((await panggil("POST /api/admin/akun", A.admin, { badan: { surel: "w@uji.test", nama: "W", peran: "wilayah", cakupan_prov: "32" } })).status, 201);
  assert.equal((await panggil("POST /api/admin/akun", A.admin, { badan: { surel: "x@uji.test", nama: "X", peran: "dewa" } })).status, 422);
});

test("Admin tidak naik ke super, tidak ubah super, tidak ubah peran sendiri; SA boleh", async () => {
  assert.equal((await panggil("POST /api/admin/akun", A.admin, { badan: { surel: "s@uji.test", nama: "S", peran: "super" } })).kode, "dilarang");
  assert.equal((await panggil("PATCH /api/admin/akun/:id", A.admin, { id: A.anggota.id, badan: { peran: "super" } })).kode, "dilarang");
  assert.equal((await panggil("PATCH /api/admin/akun/:id", A.admin, { id: A.admin.id, badan: { peran: "super" } })).kode, "dilarang");
  assert.equal((await panggil("PATCH /api/admin/akun/:id", A.admin, { id: A.admin.id, badan: { peran: "anggota" } })).kode, "dilarang");
  assert.equal((await panggil("PATCH /api/admin/akun/:id", A.admin, { id: A.super.id, badan: { nama: "x" } })).kode, "dilarang");
  assert.equal((await panggil("PATCH /api/admin/akun/:id", A.admin, { id: A.super.id, badan: { status: "nonaktif" } })).kode, "dilarang");
  assert.equal((await panggil("POST /api/admin/akun/:id/aktivasi", A.admin, { id: A.super.id })).kode, "dilarang");
  assert.equal((await panggil("DELETE /api/admin/akun/:id/sesi", A.admin, { id: A.super.id })).status, 200); // sel AD sesi = T cabut (tanpa bukan-super)
  assert.equal((await satu("SELECT peran FROM akun WHERE id = ?", A.super.id)).peran, "super");
  assert.equal((await satu("SELECT peran FROM akun WHERE id = ?", A.anggota.id)).peran, "anggota");
  assert.equal((await panggil("PATCH /api/admin/akun/:id", A.admin, { id: A.anggota.id, badan: { peran: "pengurus" } })).status, 200);
  assert.equal((await panggil("PATCH /api/admin/akun/:id", A.super, { id: A.admin2.id, badan: { peran: "super" } })).status, 200);
  assert.equal((await satu("SELECT peran FROM akun WHERE id = ?", A.admin2.id)).peran, "super");
  // kolom di luar daftar putih
  assert.equal((await panggil("PATCH /api/admin/akun/:id", A.admin, { id: A.anggota.id, badan: { sandi: "x" } })).status, 422);
  assert.equal((await panggil("PATCH /api/admin/akun/:id", A.admin, { id: A.anggota.id, badan: { aktivasi_hash: H(64, "a") } })).status, 422);
  assert.equal((await panggil("PATCH /api/admin/akun/:id", A.admin, { id: 999999, badan: { nama: "z" } })).status, 404);
});

test("super terakhir tidak bisa diturunkan/dinonaktifkan (trigger -> konflik); dengan dua super boleh", async () => {
  await q("UPDATE akun SET peran = 'admin' WHERE id = ?", A.admin2.id).run(); // kembali admin (super lain masih ada)
  assert.equal((await panggil("PATCH /api/admin/akun/:id", A.super, { id: A.super.id, badan: { status: "nonaktif" } })).kode, "konflik");
  assert.equal((await panggil("PATCH /api/admin/akun/:id", A.super, { id: A.super.id, badan: { peran: "admin" } })).kode, "konflik");
  assert.equal((await satu("SELECT status, peran FROM akun WHERE id = ?", A.super.id)).status, "aktif");
  const j0 = (await satu("SELECT count(*) n FROM jejak")).n;
  assert.equal((await panggil("PATCH /api/admin/akun/:id", A.super, { id: A.super.id, badan: { status: "nonaktif" } })).kode, "konflik");
  assert.equal((await satu("SELECT count(*) n FROM jejak")).n, j0, "batch gagal tidak menulis jejak");
  await akun("super2", "super");
  assert.equal((await panggil("PATCH /api/admin/akun/:id", A.super2, { id: A.super.id, badan: { status: "nonaktif" } })).status, 200);
  await q("UPDATE akun SET status='aktif' WHERE id = ?", A.super.id).run();
});

test("nonaktifkan mencabut semua sesi seketika; sesi tak lagi valid; cabut sesi lewat rute", async () => {
  const sesi = async (a, c) => { await hak.catatSesi(E, { idHash: H(64, c), akunId: a.id }); };
  await sesi(A.anggota2, "1"); await sesi(A.anggota2, "2");
  assert.ok(await hak.bacaSesi(E, H(64, "1")));
  assert.equal((await panggil("DELETE /api/admin/akun/:id/sesi", A.admin, { id: A.anggota2.id })).status, 200);
  assert.equal((await satu("SELECT count(*) n FROM sesi WHERE akun_id = ?", A.anggota2.id)).n, 0);
  assert.equal((await satu("SELECT aksi FROM jejak ORDER BY id DESC LIMIT 1")).aksi, "cabut");
  await sesi(A.anggota2, "3");
  assert.equal((await panggil("PATCH /api/admin/akun/:id", A.admin, { id: A.anggota2.id, badan: { status: "nonaktif" } })).status, 200);
  assert.equal((await satu("SELECT count(*) n FROM sesi WHERE akun_id = ?", A.anggota2.id)).n, 0);
  assert.equal(await hak.bacaSesi(E, H(64, "3")), null);
});

test("aktivasi ulang: tautan baru menggantikan, hash lama tak berlaku", async () => {
  const r1 = await panggil("POST /api/admin/akun/:id/aktivasi", A.admin, { id: A.wilayah.id });
  const r2 = await panggil("POST /api/admin/akun/:id/aktivasi", A.admin, { id: A.wilayah.id });
  assert.equal(r2.status, 200);
  const h1 = await sha(new URL(r1.tautan_aktivasi).searchParams.get("token"));
  assert.equal(await hak.periksaTautanAktivasi(E, h1), null);
  assert.ok(await hak.periksaTautanAktivasi(E, await sha(new URL(r2.tautan_aktivasi).searchParams.get("token"))));
});

test("daftar akun: tanpa kolom rahasia, Admin tak melihat super, filter, paginasi", async () => {
  const r = await panggil("GET /api/admin/akun", A.admin);
  assert.equal(r.status, 200);
  assert.ok(r.akun.length > 3);
  for (const a of r.akun) { assert.ok(!("sandi" in a) && !("garam" in a) && !("aktivasi_hash" in a)); assert.notEqual(a.peran, "super"); }
  const s = await panggil("GET /api/admin/akun", A.super);
  assert.ok(s.akun.some((a) => a.peran === "super"));
  const req = minta("/api/admin/akun?peran=kurator&cari=KURA");
  const res = await rute["GET /api/admin/akun"](req, E, {}, { params: {}, akun: A.admin });
  const b = await res.json();
  assert.ok(b.akun.length >= 1 && b.akun.every((a) => a.peran === "kurator"));
  assert.match(res.headers.get("cache-control"), /no-store/);
});

test("jejak: admin membaca terfilter; anggota tak bisa; jejak tak bisa diubah/dihapus", async () => {
  const tulisId = A.anggota.id;
  const req = minta(`/api/admin/jejak?tabel=akun&baris=${tulisId}`);
  const res = await rute["GET /api/admin/jejak"](req, E, {}, { params: {}, akun: A.admin });
  const b = await res.json();
  assert.ok(b.jejak.length >= 1 && b.jejak.every((j) => j.tabel === "akun" && j.baris_id === String(tulisId)));
  assert.equal((await panggil("GET /api/admin/jejak", A.anggota)).status, 403);
  const bad = await rute["GET /api/admin/jejak"](minta("/api/admin/jejak?tabel=a;b"), E, {}, { params: {}, akun: A.admin });
  assert.equal(bad.status, 422);
  await assert.rejects(q("UPDATE jejak SET peran='super'").run(), /tidak boleh diubah/);
  await assert.rejects(q("DELETE FROM jejak").run(), /tidak boleh dihapus/);
});

test("anggota A tidak melihat baris B (akun, sesi, koreksi) dan tak bisa menulisnya", async () => {
  await hak.catatSesi(E, { idHash: H(64, "7"), akunId: A.anggota.id });
  await hak.catatSesi(E, { idHash: H(64, "8"), akunId: A.anggota2.id });
  const lihat = await hak.baca(E, A.anggota, "akun", {});
  assert.deepEqual(lihat.map((r) => r.id), [A.anggota.id]);
  assert.ok((await hak.baca(E, A.anggota, "sesi", {})).every((r) => r.akun_id === A.anggota.id));
  await assert.rejects(hak.tulis(E, A.anggota, "akun", "ubah", { nama: "x" }, A.anggota2.id), (e) => e.kode === "dilarang");
  await assert.rejects(hak.tulis(E, A.anggota, "akun", "ubah", { peran: "super" }, A.anggota.id), (e) => e.kode === "masukan_salah", "diri hanya nama/bahasa");
  await hak.tulis(E, A.anggota, "akun", "ubah", { nama: "Nama Baru", bahasa: "en" }, A.anggota.id);
  assert.equal((await satu("SELECT nama, bahasa FROM akun WHERE id = ?", A.anggota.id)).bahasa, "en");
  await assert.rejects(hak.tulis(E, A.anggota, "sesi", "cabut", {}, A.anggota2.id), (e) => e.kode === "dilarang");
});
