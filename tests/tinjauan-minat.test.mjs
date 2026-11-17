// tinjauan-minat.test.mjs: tiga perbaikan dari tinjauan keamanan rumpun minat (15 Nov 2026). Lewat worker.fetch dan hak.js di D1 lokal NYATA.
// 1. minat stan ditolak untuk acara yang sudah ditutup admin (rute 404 seragam + trigger 0043);
// 2. batas riwayat profil ditegakkan dalam satu pernyataan (permintaan bersamaan tidak bisa melewatinya);
// 3. nama organisasi pada minat REC/karbon yang disetujui hilang begitu klaim organisasi pengirim tidak lagi disetujui.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { buatEnv } from "./_bantu.mjs";
import worker from "../src/worker.js";
import * as hak from "../src/hak.js";
import { sha } from "../src/util.js";

let E, tutup;
const COOKIE = {}, AKUN = {};
const q = (s, ...b) => E.DB.prepare(s).bind(...b);
async function tambahAkun(kunci, peran = "anggota") {
  const r = await q("INSERT INTO akun (surel, nama, peran, status, garam, sandi, iterasi) VALUES (?,?,?, 'aktif', ?, ?, 100000)", `${kunci}@tinjau.test`, "Nama " + kunci, peran, "a".repeat(32), "a".repeat(64)).run();
  const token = (Object.keys(COOKIE).length + 90).toString(16).padStart(2, "0").repeat(32);
  await hak.catatSesi(E, { idHash: await sha(token), akunId: r.meta.last_row_id, sampai: Math.floor(Date.now() / 1000) + 3600, ipHash: "h" });
  COOKIE[kunci] = `sesi=${token}`; AKUN[kunci] = { id: r.meta.last_row_id, peran };
}
const panggil = (metode, jalur, peran, badan) => worker.fetch(new Request("https://uji.test" + jalur, { method: metode, body: badan ? JSON.stringify(badan) : undefined,
  headers: { origin: "https://uji.test", "cf-connecting-ip": "203.0.113.77", cookie: COOKIE[peran], ...(metode !== "GET" ? { "x-pb": "1" } : {}), ...(badan ? { "content-type": "application/json" } : {}) } }), E, { waitUntil() {} });
const STAN = { organisasi: "PT Uji Stan", kebutuhan: "Satu stan ukuran standar dengan sambungan listrik." };

before(async () => {
  ({ env: E, tutup } = await buatEnv());
  await tambahAkun("admin", "admin"); await tambahAkun("a"); await tambahAkun("b");
  await q("INSERT INTO event_atur (event_id, terbuka) VALUES ('acara-buka', 1), ('acara-tutup', 1)").run();
  await q("INSERT INTO event_tutup (event_id, oleh) VALUES ('acara-tutup', ?)", AKUN.admin.id).run();
});
after(async () => { await tutup?.(); });

test("minat stan: acara yang sudah ditutup admin = 404 seragam di rute, dan trigger D1 menolak sisipan langsung", async () => {
  assert.equal((await panggil("POST", "/api/event/acara-tutup/stan", "a", STAN)).status, 404);
  assert.equal((await q("SELECT count(*) AS n FROM event_stan").first()).n, 0);
  await assert.rejects(q("INSERT INTO event_stan (akun_id, event_id, organisasi, kebutuhan) VALUES (?, 'acara-tutup', 'PT Langsung', 'Sisip langsung ke tabel tanpa lewat rute.')", AKUN.a.id).run(), /sudah ditutup/);
  assert.equal((await panggil("POST", "/api/event/acara-buka/stan", "a", STAN)).status, 201, "acara yang masih berjalan tetap menerima minat");
  assert.equal((await panggil("POST", "/api/event/acara-tak-ada/stan", "a", STAN)).status, 404);
});

test("riwayat profil: batas per jenis ditegakkan atomik; 20 permintaan bersamaan tidak pernah melewati MAKS_RIWAYAT", async () => {
  const isi = (i) => ({ nama: "Sertifikasi uji " + i, penerbit: "Lembaga Uji", tahun: 2020 });
  const hasil = await Promise.allSettled(Array.from({ length: 20 }, (_, i) => hak.profilRiwayatTambah(E, AKUN.b, "sertifikasi", isi(i))));
  const n = (await q("SELECT count(*) AS n FROM profil_riwayat WHERE akun_id = ? AND jenis = 'sertifikasi'", AKUN.b.id).first()).n;
  assert.equal(n, hak.MAKS_RIWAYAT);
  assert.equal(hasil.filter((h) => h.status === "fulfilled").length, hak.MAKS_RIWAYAT);
  assert.ok(hasil.filter((h) => h.status === "rejected").every((h) => h.reason?.status === 409), "kelebihan ditolak 409, bukan galat lain");
  assert.equal((await q("SELECT count(*) AS n FROM jejak WHERE tabel = 'profil_riwayat' AND siapa = ?", AKUN.b.id).first()).n, hak.MAKS_RIWAYAT, "jejak hanya untuk yang benar-benar tersimpan");
  await assert.rejects(hak.profilRiwayatTambah(E, AKUN.b, "sertifikasi", isi(99)), (e) => e.status === 409);
  const urut = (await q("SELECT urut FROM profil_riwayat WHERE akun_id = ? AND jenis = 'sertifikasi' ORDER BY urut", AKUN.b.id).all()).results.map((r) => r.urut);
  assert.equal(new Set(urut).size, urut.length, "nomor urut tidak kembar");
});

test("papan minat: nama organisasi hanya keluar selama klaim organisasi pengirim masih disetujui", async () => {
  await q("INSERT INTO org_klaim (akun_id, organisasi_id, status, diputus_pada, diputus_oleh) VALUES (?, 'org_a', 'setuju', unixepoch(), ?)", AKUN.a.id, AKUN.admin.id).run();
  await q("INSERT INTO minat_unit (akun_id, jenis, arah, volume, prov, uraian, organisasi_id, status, diputus_pada, diputus_oleh) VALUES (?, 'rec', 'beli', 1000, '31', 'Minat beli REC untuk kebutuhan tahunan.', 'org_a', 'disetujui', unixepoch(), ?)", AKUN.a.id, AKUN.admin.id).run();
  const baca = async () => (await hak.unitDaftar(E, AKUN.b))[0];
  assert.equal((await baca()).organisasi_id, "org_a");
  await q("UPDATE org_klaim SET status = 'tolak' WHERE akun_id = ? AND organisasi_id = 'org_a'", AKUN.a.id).run().catch(async () => { await q("DELETE FROM org_klaim WHERE akun_id = ? AND organisasi_id = 'org_a'", AKUN.a.id).run(); });
  const sesudah = await baca();
  assert.equal(sesudah.organisasi_id, null, "klaim dicabut: nama organisasi tidak lagi tampil");
  assert.equal(sesudah.volume, 1000, "minatnya sendiri tetap tampil");
  assert.ok(!("akun_id" in sesudah));
});
