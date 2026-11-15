// GET /api/admin/ringkas?dari&sampai: periode.angka {n,banding}, harian, papan_wilayah, validasi 400, hak peran; D1 lokal nyata.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { buatEnv, minta } from "./_bantu.mjs";
import worker from "../src/worker.js";
import { sha, acak } from "../src/util.js";

let E, tutup;
const sesi = {}, id = {};
async function masuk(peran) {
  const r = await E.DB.prepare("INSERT INTO akun (surel, nama, peran, status, garam, sandi, iterasi) VALUES (?,?,?, 'aktif', ?, ?, 100000)").bind(`${peran}@uji.test`, peran, peran, "a".repeat(32), "a".repeat(64)).run();
  const token = acak(32);
  await E.DB.prepare("INSERT INTO sesi (id_hash, akun_id, sampai) VALUES (?,?,?)").bind(await sha(token), r.meta.last_row_id, Math.floor(Date.now() / 1000) + 3600).run();
  id[peran] = r.meta.last_row_id; sesi[peran] = "sesi=" + token;
}
const panggil = async (q, peran) => {
  const res = await worker.fetch(minta("/api/admin/ringkas" + q, { metode: "GET", cookie: peran ? sesi[peran] : undefined }), E, { waitUntil() {} });
  const t = await res.text();
  return { status: res.status, ...(t ? JSON.parse(t) : {}) };
};
before(async () => {
  ({ env: E, tutup } = await buatEnv());
  for (const p of ["anggota", "admin", "super"]) await masuk(p);
});
after(async () => { await tutup?.(); });

// Epoch detik tengah hari WIB (05:00 UTC) pada tanggal t.
const siang = (t) => Date.parse(t + "T05:00:00Z") / 1000;

test("ringkas periode: n di jendela, banding di jendela sebelumnya (sama panjang), harian, papan", async () => {
  const H = (c) => c.repeat(64);
  const daftar = (c, nama, t, prov, status) => E.DB.prepare("INSERT INTO pendaftaran (token_hash, jenis, nama, surel, hp, setuju_pdp, prov, status, dibuat, diputus_pada) VALUES (?, 'individu', ?, ?, '0811111111', 1, ?, ?, ?, ?)").bind(H(c), nama, `${c}@uji.test`, prov, status, siang(t), status === "menunggu" ? null : siang(t)).run();
  // periode 2026-03-10..2026-03-12 (3 hari); banding 2026-03-07..2026-03-09
  await daftar("1", "Satu", "2026-03-10", "32", "disetujui");
  await daftar("2", "Dua", "2026-03-12", "32", "menunggu");
  await daftar("3", "Tiga", "2026-03-08", "12", "menunggu");
  await daftar("4", "Empat", "2026-03-01", "12", "menunggu"); // di luar kedua jendela
  await E.DB.prepare("INSERT INTO koreksi_usul (entitas, entitas_id, kolom, nilai_usulan, alasan, dibuat_pada) VALUES ('organisasi','meti','situs','https://a.id','x', ?)").bind(siang("2026-03-11")).run();
  await E.DB.prepare("INSERT INTO org_klaim (akun_id, organisasi_id, dibuat) VALUES (?, 'meti', ?)").bind(id.anggota, siang("2026-03-09")).run();
  await E.DB.prepare("INSERT INTO lalin (tgl, dim, kunci, n) VALUES ('2026-03-10','jenis','orang',7), ('2026-03-08','jenis','orang',4), ('2026-03-10','jenis','ai_jawab',99)").run();
  await E.DB.prepare("INSERT INTO wilayah_akun (akun_id, kode_prov) VALUES (?, '32')").bind(id.anggota).run();

  const r = await panggil("?dari=2026-03-10&sampai=2026-03-12", "admin");
  assert.equal(r.status, 200);
  assert.ok(r.antrean && r.pengunjung24 && r.waktu, "bentuk lama tetap");
  assert.deepEqual([r.periode.dari, r.periode.sampai, r.periode.banding_dari, r.periode.banding_sampai], ["2026-03-10", "2026-03-12", "2026-03-07", "2026-03-09"]);
  const a = r.periode.angka;
  assert.deepEqual(a.pendaftar_baru, { n: 2, banding: 1 });
  assert.deepEqual(a.koreksi_masuk, { n: 1, banding: 0 });
  assert.deepEqual(a.portal_masuk, { n: 0, banding: 1 });
  assert.deepEqual(a.pengunjung, { n: 7, banding: 4 });
  assert.equal(a.anggota_aktif.banding, null);
  assert.ok(a.anggota_aktif.n >= 3);
  assert.deepEqual(r.harian.map((x) => x.tgl), ["2026-03-10", "2026-03-11", "2026-03-12"]);
  assert.deepEqual(r.harian.map((x) => x.pendaftar_baru), [1, 0, 1]);
  assert.deepEqual(r.harian.map((x) => x.koreksi_masuk), [0, 1, 0]);
  assert.equal(r.harian[0].pengunjung, 7);
  const jabar = r.papan_wilayah.find((x) => x.kode_prov === "32");
  assert.equal(r.papan_wilayah.length, 38);
  assert.deepEqual([jabar.pulau, jabar.anggota, jabar.menunggu, jabar.admin_ada], ["Jawa", 1, 1, true]);
  assert.equal(r.papan_wilayah.find((x) => x.kode_prov === "12").admin_ada, false);
  assert.equal(r.papan_wilayah.find((x) => x.kode_prov === "21").pulau, "Sumatera");
  assert.ok("segar" in r);
});

test("ringkas periode: tanpa parameter = hari ini; satu parameter dari saja = satu hari", async () => {
  const r = await panggil("", "super");
  assert.equal(r.status, 200);
  assert.equal(r.periode.dari, r.periode.sampai);
  assert.equal(r.harian.length, 1);
});

test("ringkas periode: validasi ketat 400", async () => {
  for (const q of ["?dari=2026-3-1&sampai=2026-03-02", "?dari=2026-02-30&sampai=2026-03-02", "?dari=2026-03-05&sampai=2026-03-01", "?dari=2025-01-01&sampai=2026-03-01", "?dari=abc", "?sampai=%27%3B--"]) {
    assert.equal((await panggil(q, "admin")).status, 400, q);
  }
});

test("ringkas periode: batas 400 hari lolos, 401 hari ditolak", async () => {
  assert.equal((await panggil("?dari=2025-01-01&sampai=2026-02-04", "admin")).status, 200); // 400 hari
  assert.equal((await panggil("?dari=2025-01-01&sampai=2026-02-05", "admin")).status, 400); // 401 hari
});

test("ringkas periode: tamu 401, anggota 403, 400 tidak mendahului gerbang peran", async () => {
  assert.equal((await panggil("?dari=2026-03-01", null)).status, 401);
  assert.equal((await panggil("?dari=2026-03-01", "anggota")).status, 403);
  assert.equal((await panggil("?dari=salah", "anggota")).status, 403);
});
