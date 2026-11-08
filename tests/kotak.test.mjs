// Kotak masuk kurasi terpadu (GET /api/admin/kotak, PUT/DELETE /api/admin/kotak/tugas) di D1 lokal nyata.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { buatEnv, minta } from "./_bantu.mjs";
import worker from "../src/worker.js";
import { sha, acak } from "../src/util.js";

let E, tutup;
const sesi = {}, id = {};
async function masuk(peran) {
  const r = await E.DB.prepare("INSERT INTO akun (surel, nama, peran, status, garam, sandi, iterasi) VALUES (?,?,?, 'aktif', ?, ?, 100000)").bind(`${peran}@uji.test`, peran, peran, "a".repeat(32), "b".repeat(64)).run();
  const token = acak(32);
  await E.DB.prepare("INSERT INTO sesi (id_hash, akun_id, sampai) VALUES (?,?,?)").bind(await sha(token), r.meta.last_row_id, Math.floor(Date.now() / 1000) + 3600).run();
  id[peran] = r.meta.last_row_id; sesi[peran] = "sesi=" + token;
}
const panggil = async (jalur, metode, peran, badan) => {
  const res = await worker.fetch(minta(jalur, { metode, badan, cookie: peran ? sesi[peran] : undefined }), E, { waitUntil() {} });
  const t = await res.text();
  return { status: res.status, ...(t ? JSON.parse(t) : {}) };
};
before(async () => { ({ env: E, tutup } = await buatEnv()); for (const p of ["anggota", "pengurus", "kurator", "admin", "super"]) await masuk(p); });
after(async () => { await tutup?.(); });

test("hak: tamu 401, anggota/pengurus/kurator 403 di tiga rute kotak", async () => {
  for (const [m, j] of [["GET", "/api/admin/kotak"], ["PUT", "/api/admin/kotak/tugas"], ["DELETE", "/api/admin/kotak/tugas?jenis=koreksi&butir=k1"]]) {
    assert.equal((await panggil(j, m, null, m === "PUT" ? {} : undefined)).status, 401, "tamu " + j);
    for (const p of ["anggota", "pengurus", "kurator"]) assert.equal((await panggil(j, m, p, m === "PUT" ? {} : undefined)).status, 403, p + " " + j);
  }
});

test("kotak: kosong, lalu butir nyata dari semua tabel antrean dengan hitungan tepat", async () => {
  const nol = await panggil("/api/admin/kotak", "GET", "admin");
  assert.equal(nol.status, 200);
  assert.deepEqual(nol.hitung, { koreksi: 0, portal: 0, surel: 0, pendaftaran: 0, lowongan: 0 });
  await E.DB.prepare("INSERT INTO koreksi_usul (entitas, entitas_id, kolom, nilai_usulan, alasan) VALUES ('organisasi', 'meti', 'situs', 'https://a.id', 'pindah')").run();
  await E.DB.prepare("INSERT INTO koreksi_usul (entitas, entitas_id, kolom, nilai_usulan, alasan, status, diputus_pada, diputus_oleh) VALUES ('proyek', 'x1', 'nama', 'B', 'a', 'tolak', 1, ?)").bind(id.admin).run();
  await E.DB.prepare("INSERT INTO org_klaim (akun_id, organisasi_id) VALUES (?, 'meti')").bind(id.anggota).run();
  await E.DB.prepare("INSERT INTO surel_minta (akun_id, nama_lokal, alasan, organisasi) VALUES (?, 'budi.s', 'perlu', 'METI')").bind(id.anggota).run();
  await E.DB.prepare("INSERT INTO pendaftaran (token_hash, jenis, nama, surel, hp, setuju_pdp) VALUES (?, 'individu', 'Calon Satu', 'c1@uji.test', '0811111111', 1)").bind("9".repeat(64)).run();
  await E.DB.prepare("INSERT INTO lowongan (akun_id, organisasi_id, organisasi_nama, judul, teknologi, jenjang, tautan) VALUES (?, 'meti', 'METI', 'Teknisi surya', 'surya', 'pemula', 'https://k.example/1')").bind(id.anggota).run();
  const r = await panggil("/api/admin/kotak", "GET", "super");
  assert.deepEqual(r.hitung, { koreksi: 1, portal: 1, surel: 1, pendaftaran: 1, lowongan: 1 }, "koreksi yang sudah diputus tidak ikut");
  assert.equal(r.butir.length, 5); assert.equal(r.saya, id.super);
  const k = r.butir.find((b) => b.jenis === "koreksi");
  assert.equal(k.ref, "organisasi:meti"); assert.equal(k.judul, "situs"); assert.ok(k.dibuat > 0);
  assert.equal(r.butir.find((b) => b.jenis === "portal").sub, "klaim");
  assert.ok(!JSON.stringify(r).includes("c1@uji.test"), "surel pendaftar tidak keluar");
});

test("tugas: ambil, tolak ambil alih (409), lepas oleh pemilik; jenis/butir tak sah 422; jejak tercatat", async () => {
  const badan = { jenis: "koreksi", butir: "k1" };
  assert.equal((await panggil("/api/admin/kotak/tugas", "PUT", "admin", badan)).status, 200);
  assert.equal((await panggil("/api/admin/kotak/tugas", "PUT", "admin", badan)).status, 200, "ambil ulang milik sendiri");
  assert.equal((await panggil("/api/admin/kotak/tugas", "PUT", "super", badan)).status, 409, "milik orang lain");
  assert.equal((await panggil("/api/admin/kotak/tugas", "PUT", "admin", { jenis: "ngawur", butir: "k1" })).status, 422);
  assert.equal((await panggil("/api/admin/kotak/tugas", "PUT", "admin", { jenis: "koreksi", butir: "a b;" })).status, 422);
  const r = await panggil("/api/admin/kotak", "GET", "super");
  assert.deepEqual(r.tugas.map((x) => [x.jenis, x.butir, x.nama]), [["koreksi", "k1", "admin"]]);
  assert.equal((await E.DB.prepare("SELECT count(*) AS n FROM jejak WHERE tabel = 'kotak_tugas'").first()).n, 2, "ambil + ambil ulang; penolakan tanpa jejak");
  assert.equal((await panggil("/api/admin/kotak/tugas?jenis=koreksi&butir=k1", "DELETE", "admin2x")).status, 401);
  await panggil("/api/admin/kotak/tugas", "PUT", "admin", { jenis: "statis", butir: "org:en_1" });
  assert.equal((await panggil("/api/admin/kotak/tugas?jenis=koreksi&butir=k1", "DELETE", "super")).status, 200, "super boleh melepas");
  assert.equal((await panggil("/api/admin/kotak/tugas?jenis=koreksi&butir=k1", "DELETE", "admin")).status, 404, "sudah lepas");
  assert.deepEqual((await panggil("/api/admin/kotak", "GET", "admin")).tugas.map((x) => x.butir), ["org:en_1"]);
});
