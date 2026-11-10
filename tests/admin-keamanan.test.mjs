// Beranda admin (GET /api/admin/ringkas) dan keamanan akun (sesi semua akun, cabut, gagal masuk 30 hari, matriks hak) di D1 lokal nyata.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { buatEnv, minta } from "./_bantu.mjs";
import worker from "../src/worker.js";
import { sha, acak, samarSurel } from "../src/util.js";
import * as hak from "../src/hak.js";

let E, tutup;
const sesi = {}, id = {}, hash = {};
async function masuk(peran, surel = `${peran}@uji.test`) {
  const r = await E.DB.prepare("INSERT INTO akun (surel, nama, peran, status, garam, sandi, iterasi) VALUES (?,?,?, 'aktif', ?, ?, 100000)").bind(surel, peran, peran, "a".repeat(32), "a".repeat(64)).run();
  const token = acak(32);
  hash[peran] = await sha(token);
  await E.DB.prepare("INSERT INTO sesi (id_hash, akun_id, sampai) VALUES (?,?,?)").bind(hash[peran], r.meta.last_row_id, Math.floor(Date.now() / 1000) + 3600).run();
  id[peran] = r.meta.last_row_id;
  sesi[peran] = "sesi=" + token;
}
const panggil = async (jalur, metode, peran, badan, opsi = {}) => {
  const res = await worker.fetch(minta(jalur, { metode, badan, cookie: peran ? sesi[peran] : undefined, ...opsi }), E, { waitUntil() {} });
  const t = await res.text();
  return { status: res.status, ...(t ? JSON.parse(t) : {}) };
};

before(async () => {
  ({ env: E, tutup } = await buatEnv());
  for (const p of ["anggota", "pengurus", "kurator", "admin", "super"]) await masuk(p);
});
after(async () => { await tutup?.(); });

const RUTE = [["GET", "/api/admin/ringkas"], ["GET", "/api/admin/keamanan/sesi"], ["GET", "/api/admin/keamanan/gagal"], ["GET", "/api/admin/keamanan/matriks"], ["DELETE", "/api/admin/keamanan/sesi/" + "a".repeat(16)]];

test("hak: tamu 401, anggota/pengurus/kurator 403 di semua rute baru", async () => {
  for (const [m, j] of RUTE) {
    assert.equal((await panggil(j, m, null)).status, 401, "tamu " + j);
    for (const p of ["anggota", "pengurus", "kurator"]) assert.equal((await panggil(j, m, p)).status, 403, p + " " + j);
  }
});

test("ringkas: hitungan antrean dari tabel nyata, satu panggilan", async () => {
  const nol = await panggil("/api/admin/ringkas", "GET", "admin");
  assert.equal(nol.status, 200);
  assert.deepEqual(nol.antrean, { pendaftar: 0, bukti: 0, koreksi: 0, portal: 0, portal_rinci: { klaim: 0, ajuan: 0, wilayah: 0, orang: 0 }, pesan: 0, konsultasi: 0, langganan: 0 });
  assert.deepEqual(Object.keys(nol.pengunjung24).sort(), ["ai", "orang"]);

  const H = "9".repeat(64);
  await E.DB.prepare("INSERT INTO pendaftaran (token_hash, jenis, nama, surel, hp, setuju_pdp) VALUES (?, 'individu', 'Calon Satu', 'calon1@uji.test', '0811111111', 1)").bind(H).run();
  await E.DB.prepare("INSERT INTO pendaftaran (token_hash, jenis, nama, surel, hp, setuju_pdp) VALUES (?, 'individu', 'Calon Dua', 'calon2@uji.test', '0822222222', 1)").bind("8".repeat(64)).run();
  await E.DB.prepare("INSERT INTO pendaftaran_bukti (pendaftaran_id, kunci_r2, tipe, ukuran) VALUES (1, 'bukti/satu.jpg', 'image/jpeg', 100)").run();
  await E.DB.prepare("INSERT INTO koreksi_usul (entitas, entitas_id, kolom, nilai_usulan, alasan) VALUES ('organisasi', 'meti', 'situs', 'https://a.id', 'pindah')").run();
  await E.DB.prepare("INSERT INTO org_klaim (akun_id, organisasi_id) VALUES (?, 'meti')").bind(id.anggota).run();
  await E.DB.prepare("INSERT INTO pesan_utas (id, akun_id, topik) VALUES (?, ?, 'umum')").bind("a".repeat(16), id.anggota).run();
  await E.DB.prepare("INSERT INTO langganan (surel, nama, token_berhenti) VALUES ('l@uji.test', 'L', ?)").bind("7".repeat(64)).run();
  await E.DB.prepare("INSERT INTO langganan (surel, nama, token_berhenti, dibuat) VALUES ('lama@uji.test', 'Lama', ?, unixepoch() - 30 * 86400)").bind("6".repeat(64)).run();
  const a = (await panggil("/api/admin/ringkas", "GET", "super")).antrean;
  assert.equal(a.pendaftar, 2); assert.equal(a.bukti, 1); assert.equal(a.koreksi, 1); assert.equal(a.portal, 1); assert.equal(a.pesan, 1); assert.equal(a.langganan, 1, "hanya 7 hari terakhir");
});

test("ringkas: pengunjung 24 jam dijumlah dari penghitung per jam", async () => {
  const wib = new Date(Date.now() + 7 * 3600e3).toISOString();
  const tgl = wib.slice(0, 10), HH = wib.slice(11, 13);
  await E.DB.prepare("INSERT INTO lalin (tgl, dim, kunci, n) VALUES (?, 'jam', ?, 5), (?, 'jam', ?, 3), (?, 'jam', ?, 2)").bind(tgl, `orang|${HH}`, tgl, `ai_jawab|${HH}`, tgl, `ai_crawl|${HH}`).run();
  const p = (await panggil("/api/admin/ringkas", "GET", "admin")).pengunjung24;
  assert.deepEqual(p, { orang: 5, ai: 5 });
});

test("sesi: admin melihat semua akun tanpa hash penuh; cabut satu sesi + jejak; sesi sendiri dan super terlindung", async () => {
  const l = await panggil("/api/admin/keamanan/sesi", "GET", "admin");
  assert.equal(l.status, 200);
  assert.ok(l.baris.length >= 5);
  const teks = JSON.stringify(l);
  for (const h of Object.values(hash)) assert.ok(!teks.includes(h), "hash penuh tidak keluar");
  assert.ok(l.baris.every((s) => /^[0-9a-f]{16}$/.test(s.sid)));
  assert.equal(l.baris.filter((s) => s.ini).length, 1);
  assert.ok(l.baris.find((s) => s.ini).akun_id === id.admin);

  assert.equal((await panggil("/api/admin/keamanan/sesi/xyz", "DELETE", "admin")).status, 422, "sid tidak sah");
  assert.equal((await panggil("/api/admin/keamanan/sesi/" + hash.admin.slice(0, 16), "DELETE", "admin")).status, 422, "sesi sendiri lewat keluar");
  assert.equal((await panggil("/api/admin/keamanan/sesi/" + hash.super.slice(0, 16), "DELETE", "admin")).status, 403, "admin tak mencabut super");
  assert.equal((await panggil("/api/admin/keamanan/sesi/" + "f".repeat(16), "DELETE", "admin")).status, 404);

  const j0 = (await E.DB.prepare("SELECT count(*) AS n FROM jejak WHERE aksi = 'cabut'").first()).n;
  assert.equal((await panggil("/api/admin/keamanan/sesi/" + hash.pengurus.slice(0, 16), "DELETE", "admin")).status, 200);
  assert.equal((await E.DB.prepare("SELECT count(*) AS n FROM sesi WHERE id_hash = ?").bind(hash.pengurus).first()).n, 0);
  const j = await E.DB.prepare("SELECT siapa, peran, tabel, baris_id FROM jejak WHERE aksi = 'cabut' ORDER BY id DESC LIMIT 1").first();
  assert.equal((await E.DB.prepare("SELECT count(*) AS n FROM jejak WHERE aksi = 'cabut'").first()).n, j0 + 1);
  assert.deepEqual([j.siapa, j.peran, j.tabel, j.baris_id], [id.admin, "admin", "sesi", String(id.pengurus)]);
  assert.equal((await panggil("/api/saya", "GET", "pengurus")).masuk, false, "sesi tercabut = tamu");
  assert.equal((await panggil("/api/admin/keamanan/sesi/" + hash.super.slice(0, 16), "DELETE", "super")).status, 422, "super pun tak mencabut sesi sendiri");
});

test("terakhir aktif: bacaSesi menyentuh sesi_aktif; daftar memuatnya", async () => {
  await panggil("/api/saya", "GET", "kurator");
  const r = await E.DB.prepare("SELECT terakhir FROM sesi_aktif WHERE id_hash = ?").bind(hash.kurator).first();
  assert.ok(r && Math.abs(r.terakhir - Date.now() / 1000) < 60);
  const s = (await panggil("/api/admin/keamanan/sesi", "GET", "admin")).baris.find((x) => x.akun_id === id.kurator);
  assert.ok(s.aktif >= s.dibuat);
  await hak.hapusSesi(E, hash.kurator);
  await hak.sapu(E);
  assert.equal(await E.DB.prepare("SELECT 1 FROM sesi_aktif WHERE id_hash = ?").bind(hash.kurator).first(), null, "yatim disapu");
});

test("gagal masuk: surel disamarkan, IP hanya sidik 8 hex, 30 hari, tanpa id akun", async () => {
  assert.equal(samarSurel("Budi.Santoso@Meti.or.id"), "bu***@m***.id");
  for (let i = 0; i < 2; i++) {
    const r = await panggil("/api/masuk", "POST", null, { surel: "Rahasia.Pengguna@Kantor.co.id", sandi: "salah-sekali" }, { ip: "198.51.100." + (20 + i) });
    assert.equal(r.status, 401);
  }
  await E.DB.prepare("INSERT INTO jejak (siapa, peran, aksi, tabel, kapan) VALUES (NULL, 'publik', 'masuk-gagal', 'sesi', unixepoch() - 40 * 86400)").run();
  const g = await panggil("/api/admin/keamanan/gagal", "GET", "admin");
  assert.equal(g.status, 200);
  assert.equal(g.total, 2, "yang 40 hari lalu tidak dihitung");
  assert.equal(g.ip_unik, 2);
  assert.equal(g.baris.length, 2);
  const teks = JSON.stringify(g);
  assert.ok(!/rahasia|pengguna|kantor/i.test(teks), "surel penuh tidak tersimpan/keluar");
  assert.ok(g.baris.every((b) => b.surel === "ra***@k***.id" && /^[0-9a-f]{8}$/.test(b.ip)));
});

test("matriks: dibaca dari MATRIKS, tiap sel selaras dengan boleh(); sesi_admin hanya admin dan super", async () => {
  const m = await panggil("/api/admin/keamanan/matriks", "GET", "super");
  assert.equal(m.status, 200);
  assert.deepEqual(m.peran, hak.PERAN);
  assert.deepEqual(m.jenis.map((x) => x.jenis), Object.keys(hak.MATRIKS));
  for (const { jenis, sel } of m.jenis) hak.PERAN.forEach((p, i) => {
    assert.equal(sel[i].kode, hak.MATRIKS[jenis][i]);
    assert.deepEqual(sel[i].aksi, hak.AKSI.filter((a) => hak.boleh(p, a, jenis).ok));
  });
  assert.deepEqual(hak.MATRIKS.sesi_admin, ["-", "-", "-", "-", "-", "T cabut bukan-super", "T cabut"]);
});
