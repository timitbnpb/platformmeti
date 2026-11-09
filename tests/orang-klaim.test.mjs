// Klaim orang direktori (0037, K19b) di D1 lokal nyata: matriks peran, klaim ganda, setuju sendiri, cabut, revisi per privasi, nama anti-peniruan.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { buatEnv, minta } from "./_bantu.mjs";
import worker from "../src/worker.js";
import { sha, acak } from "../src/util.js";
import * as hak from "../src/hak.js";

let E, tutup;
const sesi = {}, id = {};
async function masuk(k, peran, status = "aktif") {
  const r = await E.DB.prepare("INSERT INTO akun (surel, nama, peran, status, garam, sandi, iterasi) VALUES (?,?,?,?,?,?,100000)").bind(`${k}@uji.test`, `Budi Santoso ${k}`, peran, status, "a".repeat(32), "a".repeat(64)).run();
  const token = acak(32);
  await E.DB.prepare("INSERT INTO sesi (id_hash, akun_id, sampai) VALUES (?,?,?)").bind(await sha(token), r.meta.last_row_id, Math.floor(Date.now() / 1000) + 3600).run();
  id[k] = r.meta.last_row_id; sesi[k] = "sesi=" + token;
}
const panggil = async (jalur, metode, k, badan) => {
  const res = await worker.fetch(minta(jalur, { metode, badan, cookie: k ? sesi[k] : undefined }), E, { waitUntil() {} });
  const t = await res.text();
  return { status: res.status, ...(t ? JSON.parse(t) : {}) };
};
const akunObj = (k, peran) => ({ id: id[k], peran });

before(async () => {
  ({ env: E, tutup } = await buatEnv());
  for (const [k, p] of [["a", "anggota"], ["b", "anggota"], ["c", "anggota"], ["adm", "admin"], ["sup", "super"], ["off", "anggota"]]) await masuk(k, p);
});
after(async () => { await tutup?.(); });

test("publik ditolak, anggota klaim, klaim ganda 409", async () => {
  assert.equal((await panggil("/api/portal/orang-saya", "GET", null)).status, 401);
  assert.equal((await panggil("/api/portal/orang-klaim", "POST", null, { orang_id: "o_00c8421ae3" })).status, 401);
  assert.equal((await panggil("/api/orang/revisi", "GET", null)).status, 401);
  assert.equal((await panggil("/api/portal/orang-klaim", "POST", "a", { orang_id: "bukan valid!" })).status, 422);
  const r = await panggil("/api/portal/orang-klaim", "POST", "a", { orang_id: "o_00c8421ae3", bukti_url: "https://x.test/b" });
  assert.equal(r.status, 201);
  assert.equal((await panggil("/api/portal/orang-klaim", "POST", "a", { orang_id: "o_lain000001" })).status, 409);
  const s = await panggil("/api/portal/orang-saya", "GET", "a");
  assert.equal(s.klaim.status, "baru"); assert.equal(s.klaim.orang_id, "o_00c8421ae3");
  assert.equal((await panggil("/api/portal/orang-saya", "GET", "b")).klaim, null);
});

test("antrean admin: anggota ditolak, admin lihat surel pengaju", async () => {
  assert.equal((await panggil("/api/admin/portal?tipe=orang", "GET", "a")).status, 403);
  const q = await panggil("/api/admin/portal?tipe=orang", "GET", "adm");
  assert.equal(q.baris.length, 1);
  assert.equal(q.baris[0].orang_id, "o_00c8421ae3"); assert.equal(q.baris[0].pengaju_surel, "a@uji.test"); assert.ok(q.baris[0].pengaju);
  assert.equal((await panggil("/api/admin/portal/orang/" + q.baris[0].id, "POST", "a", { aksi: "setuju" })).status, 403);
  const rin = await hak.ringkasAdmin(E, akunObj("adm", "admin"));
  assert.equal(rin.antrean.portal_rinci.orang, 1);
});

test("tolak wajib catatan; setuju; cabut; setuju sendiri ditolak termasuk super", async () => {
  const kid = (await panggil("/api/portal/orang-saya", "GET", "a")).klaim.id;
  assert.equal((await panggil("/api/admin/portal/orang/" + kid, "POST", "adm", { aksi: "tolak" })).status, 422);
  assert.equal((await panggil("/api/admin/portal/orang/" + kid, "POST", "adm", { aksi: "cabut", catatan: "x" })).status, 409, "cabut klaim yang belum setuju = konflik");
  assert.equal((await panggil("/api/admin/portal/ajuan/" + kid, "POST", "adm", { aksi: "cabut", catatan: "x" })).status, 422, "cabut hanya tipe orang");
  assert.equal((await panggil("/api/admin/portal/orang/" + kid, "POST", "adm", { aksi: "setuju" })).status, 200);
  // super mengklaim lalu menyetujui sendiri: 403
  assert.equal((await panggil("/api/portal/orang-klaim", "POST", "sup", { orang_id: "o_super00001" })).status, 201);
  const ks = (await panggil("/api/portal/orang-saya", "GET", "sup")).klaim.id;
  assert.equal((await panggil("/api/admin/portal/orang/" + ks, "POST", "sup", { aksi: "setuju" })).status, 403);
  assert.equal((await panggil("/api/admin/portal/orang/" + ks, "POST", "adm", { aksi: "tolak", catatan: "uji" })).status, 200);
  // akun lain mengklaim orang yang sama: klaim boleh, setuju kedua = konflik
  assert.equal((await panggil("/api/portal/orang-klaim", "POST", "b", { orang_id: "o_00c8421ae3" })).status, 201);
  const kb = (await panggil("/api/portal/orang-saya", "GET", "b")).klaim.id;
  assert.equal((await panggil("/api/admin/portal/orang/" + kb, "POST", "adm", { aksi: "setuju" })).status, 409);
  // cabut klaim a: jadi tolak, lalu klaim b bisa disetujui
  assert.equal((await panggil("/api/admin/portal/orang/" + kid, "POST", "adm", { aksi: "cabut" })).status, 422, "cabut wajib catatan");
  assert.equal((await panggil("/api/admin/portal/orang/" + kid, "POST", "a", { aksi: "cabut", catatan: "x" })).status, 403);
  assert.equal((await panggil("/api/admin/portal/orang/" + kid, "POST", "adm", { aksi: "cabut", catatan: "salah orang" })).status, 200);
  assert.equal((await panggil("/api/portal/orang-saya", "GET", "a")).klaim.status, "tolak");
  const j = await E.DB.prepare("SELECT COUNT(*) n FROM jejak WHERE aksi = 'cabut' AND tabel = 'orang_klaim'").first();
  assert.equal(j.n, 1);
  assert.equal((await panggil("/api/admin/portal/orang/" + kb, "POST", "adm", { aksi: "setuju" })).status, 200);
});

test("orangRevisi: privasi per bagian, kontak tak pernah ikut, nonaktif hilang", async () => {
  await E.DB.prepare("UPDATE akun SET status = 'aktif' WHERE id = ?").bind(id.b).run();
  await E.DB.prepare("INSERT INTO profil (akun_id, gelar, jabatan, instansi, kota, kode_prov, bio, telepon, keahlian, tautan, privasi, foto_kunci) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)")
    .bind(id.b, "Ir.", "Direktur", "PT Uji", "Bandung", "32", "Bio uji", "08123456789", '["surya"]', '{"linkedin":"https://linkedin.com/in/x"}',
      JSON.stringify({ lokasi: "admin", bio: "admin", riwayat: "semua", foto: "semua" }), "profil/1.webp").run();
  await E.DB.prepare("INSERT INTO profil_riwayat (akun_id, jenis, urut, isi) VALUES (?, 'pendidikan', 1, ?)").bind(id.b, JSON.stringify({ institusi: "ITB" })).run();
  for (const peminta of [["b", "anggota"], ["adm", "admin"]]) {
    const { baris } = await hak.orangRevisi(E, akunObj(...peminta));
    assert.equal(baris.length, 1);
    const o = baris[0];
    assert.equal(o.orang_id, "o_00c8421ae3"); assert.equal(o.gelar, "Ir."); assert.equal(o.jabatan, "Direktur"); assert.deepEqual(o.keahlian, ["surya"]);
    assert.ok(!("kota" in o) && !("kode_prov" in o) && !("bio" in o), "bagian admin-saja tak ikut, juga untuk admin");
    assert.equal(typeof o.foto, "number"); assert.equal(o.riwayat.pendidikan[0].institusi, "ITB");
    assert.ok(!("telepon" in o) && !("surel" in o) && !JSON.stringify(o).includes("08123456789") && !JSON.stringify(o).includes("@uji.test"));
    assert.equal(o.akun_id, id.b); assert.ok(o.nama);
  }
  await E.DB.prepare("UPDATE akun SET status = 'nonaktif' WHERE id = ?").bind(id.b).run();
  assert.deepEqual((await panggil("/api/orang/revisi", "GET", "a")).baris, [], "akun nonaktif hilang dari revisi");
});

test("nama: wajib berbagi satu kata; jejak tercatat", async () => {
  // catatan: tes sebelumnya menonaktifkan b; a masih aktif
  const pakai = async (nama) => { try { return await hak.profilSimpan(E, akunObj("a", "anggota"), { nama }); } catch (e) { return e; } };
  const e = await pakai("Rina Wijaya");
  assert.equal(e.status, 422);
  assert.equal((await pakai("Santoso, S.T.")).ok, true);
  assert.equal((await E.DB.prepare("SELECT nama FROM akun WHERE id = ?").bind(id.a).first()).nama, "Santoso, S.T.");
  const j = await E.DB.prepare("SELECT COUNT(*) n FROM jejak WHERE tabel = 'akun' AND aksi = 'ubah' AND siapa = ?").bind(id.a).first();
  assert.ok(j.n >= 1);
});
