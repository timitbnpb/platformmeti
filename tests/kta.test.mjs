// KTA virtual (migrasi 0017): D1 lokal nyata lewat worker.fetch utuh; R2 dan ASSETS tiruan sederhana.
// Akun hanya melihat KTA sendiri, verifikasi publik tanpa surel/telepon, token salah 404, admin terbitkan, laju.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { buatEnv, minta } from "./_bantu.mjs";
import worker from "../src/worker.js";
import { sha, acak } from "../src/util.js";

const DASAR = { lapis: "pengurus", baris: [
  { id: "m_aaaaaaaa", nama: "Budi Santoso", jenis: "individu", status: "aktif", instansi: "PT Contoh", surel: "budi@rahasia.test", telepon: "0812-3456-7890" },
  { id: "m_bbbbbbbb", nama: "PT Surya Lestari", jenis: "perusahaan", status: "aktif", surel: "kantor@surya.test" },
  { id: "m_cccccccc", nama: "Citra Dewi", jenis: "utama", status: "aktif" },
] };
const BERKAS = new Map();
const R2 = {
  get: async (k) => (k === "potret/pengurus/anggota_meti.json" ? { json: async () => DASAR } : BERKAS.has(k) ? { body: BERKAS.get(k).b, httpMetadata: { contentType: BERKAS.get(k).t } } : null),
  put: async (k, v, o) => { BERKAS.set(k, { b: new Uint8Array(await new Response(v).arrayBuffer()), t: o?.httpMetadata?.contentType }); },
  delete: async (k) => { BERKAS.delete(k); },
};
const WEBP = new Uint8Array([0x52, 0x49, 0x46, 0x46, 4, 0, 0, 0, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38, 0x20]);

let E, tutup;
const sesi = {}, akunId = {};
const q = (s, ...b) => E.DB.prepare(s).bind(...b);
async function masuk(nama, peran) {
  const r = await q("INSERT INTO akun (surel, nama, peran, status, garam, sandi, iterasi) VALUES (?,?,?, 'aktif', ?, ?, 100000)", `${nama}@uji.test`, nama, peran, "a".repeat(32), "a".repeat(64)).run();
  const token = acak(32);
  await q("INSERT INTO sesi (id_hash, akun_id, sampai) VALUES (?,?,?)", await sha(token), r.meta.last_row_id, Math.floor(Date.now() / 1000) + 3600).run();
  sesi[nama] = "sesi=" + token; akunId[nama] = r.meta.last_row_id;
}
async function panggil(jalur, { metode = "GET", orang = null, badan, ip } = {}) {
  const biner = badan instanceof Uint8Array;
  const req = minta(jalur, { metode, cookie: orang ? sesi[orang] : undefined, badan: biner ? undefined : badan, ip });
  const r = biner ? new Request(req.url, { method: metode, headers: req.headers, body: badan }) : req;
  const res = await worker.fetch(r, E, { waitUntil() {} });
  const tipe = res.headers.get("content-type") || "";
  return { status: res.status, h: res.headers, j: tipe.includes("json") ? await res.json() : null, teks: tipe.includes("json") ? null : await res.text() };
}
const depan = () => new Date().getUTCFullYear() + 1 + "-12-31";

before(async () => {
  ({ env: E, tutup } = await buatEnv());
  E.BERKAS = R2;
  for (const [n, p] of [["budi", "anggota"], ["citra", "anggota"], ["adm", "admin"]]) await masuk(n, p);
});
after(async () => { await tutup?.(); });

test("migrasi 0017: CHECK nomor, jenis, status; satu KTA per anggota dan per akun", async () => {
  await assert.rejects(q("INSERT INTO kta (anggota_id, jenis, nama_cetak, nonce, nomor_kta) VALUES ('x','individu','X','aaaaaaaaaaaaaaaa','salah')").run());
  await assert.rejects(q("INSERT INTO kta (anggota_id, jenis, nama_cetak, nonce) VALUES ('x','hantu','X','aaaaaaaaaaaaaaaa')").run());
  await assert.rejects(q("INSERT INTO kta (anggota_id, jenis, nama_cetak, nonce, status) VALUES ('x','individu','X','aaaaaaaaaaaaaaaa','bebas')").run());
});

test("tamu: semua rute KTA bertuan 401 kecuali verifikasi (404 untuk token salah)", async () => {
  for (const [m, j] of [["GET", "/api/kta/saya"], ["GET", "/api/kta/anggota?cari=budi"], ["POST", "/api/kta/klaim"], ["PUT", "/api/kta/foto"], ["GET", "/api/admin/kta"], ["POST", "/api/admin/kta"]])
    assert.equal((await panggil(j, { metode: m, badan: m === "GET" ? undefined : {} })).status, 401, j);
  assert.equal((await panggil("/api/kta/verifikasi/1.00000000000000000000000000000000")).status, 404);
  assert.equal((await panggil("/api/kta/verifikasi/ngawur")).status, 404);
});

test("klaim: cari nama (tanpa kontak), ajukan, tertunda belum punya tautan verifikasi", async () => {
  assert.deepEqual((await panggil("/api/kta/anggota?cari=bu", { orang: "budi" })).j.baris, []); // kurang dari 3 huruf
  const c = await panggil("/api/kta/anggota?cari=budi", { orang: "budi" });
  assert.deepEqual(c.j.baris, [{ id: "m_aaaaaaaa", nama: "Budi Santoso", instansi: "PT Contoh", jenis: "individu" }]);
  assert.doesNotMatch(JSON.stringify(c.j), /rahasia|0812/);
  assert.equal((await panggil("/api/kta/saya", { orang: "budi" })).j.kta, null);
  assert.equal((await panggil("/api/kta/klaim", { metode: "POST", orang: "budi", badan: { anggota_id: "tidak-ada" } })).status, 404);
  assert.equal((await panggil("/api/kta/klaim", { metode: "POST", orang: "budi", badan: { anggota_id: "m_aaaaaaaa" } })).status, 201);
  const s = (await panggil("/api/kta/saya", { orang: "budi" })).j.kta;
  assert.equal(s.status, "tertunda"); assert.equal(s.url_verifikasi, null); assert.equal(s.nomor_kta, null); assert.equal(s.nama_cetak, "Budi Santoso");
  // anggota yang sama tidak bisa diklaim akun lain; akun yang sama tidak bisa klaim dua kali
  assert.equal((await panggil("/api/kta/klaim", { metode: "POST", orang: "citra", badan: { anggota_id: "m_aaaaaaaa" } })).status, 409);
  assert.equal((await panggil("/api/kta/klaim", { metode: "POST", orang: "budi", badan: { anggota_id: "m_cccccccc" } })).status, 409);
});

test("bukti klaim: hanya gambar/PDF, admin bisa membaca, akun lain tidak", async () => {
  assert.equal((await panggil("/api/kta/bukti", { metode: "PUT", orang: "budi", badan: new Uint8Array([1, 2, 3, 4]) })).status, 422);
  assert.equal((await panggil("/api/kta/bukti", { metode: "PUT", orang: "budi", badan: WEBP })).status, 200);
  const id = (await q("SELECT id FROM kta WHERE anggota_id = 'm_aaaaaaaa'").first()).id;
  assert.equal((await panggil(`/api/admin/kta/${id}/bukti`, { orang: "adm" })).status, 200);
  assert.equal((await panggil(`/api/admin/kta/${id}/bukti`, { orang: "citra" })).status, 403);
});

test("admin menyetujui klaim: nomor METI-<tahun>-<jenis>-<urut>, jejak tercatat; anggota biasa tidak boleh", async () => {
  const id = (await q("SELECT id FROM kta WHERE anggota_id = 'm_aaaaaaaa'").first()).id;
  assert.equal((await panggil(`/api/admin/kta/${id}`, { metode: "PATCH", orang: "budi", badan: { aksi: "setujui", jenis: "individu", berlaku_sampai: depan() } })).status, 403);
  assert.equal((await panggil(`/api/admin/kta/${id}`, { metode: "PATCH", orang: "adm", badan: { aksi: "setujui", jenis: "individu", berlaku_sampai: "2026-02-30" } })).status, 422);
  assert.equal((await panggil(`/api/admin/kta/${id}`, { metode: "PATCH", orang: "adm", badan: { aksi: "setujui", jenis: "individu", berlaku_sampai: depan() } })).status, 200);
  const th = new Date().getUTCFullYear();
  const s = (await panggil("/api/kta/saya", { orang: "budi" })).j.kta;
  assert.equal(s.nomor_kta, `METI-${th}-IND-00001`); assert.equal(s.status, "aktif");
  assert.match(s.url_verifikasi, /\/kta\/v\/\d+\.[0-9a-f]{32}$/);
  assert.ok((await q("SELECT count(*) AS n FROM jejak WHERE tabel = 'kta'").first()).n >= 2);
  // setujui kedua kali: tidak ada baris tertunda lagi
  assert.equal((await panggil(`/api/admin/kta/${id}`, { metode: "PATCH", orang: "adm", badan: { aksi: "setujui", jenis: "individu", berlaku_sampai: depan() } })).status, 404);
});

test("akun hanya melihat KTA sendiri (foto dan saya)", async () => {
  const id = (await q("SELECT id FROM kta WHERE anggota_id = 'm_aaaaaaaa'").first()).id;
  assert.equal((await panggil("/api/kta/foto", { metode: "PUT", orang: "budi", badan: WEBP })).status, 200);
  assert.equal((await panggil(`/api/kta/foto/${id}`, { orang: "budi" })).status, 200);
  assert.equal((await panggil(`/api/kta/foto/${id}`, { orang: "adm" })).status, 200);
  assert.equal((await panggil(`/api/kta/foto/${id}`, { orang: "citra" })).status, 404);
  assert.equal((await panggil("/api/kta/saya", { orang: "citra" })).j.kta, null);
  assert.equal((await panggil("/api/kta/foto", { metode: "PUT", orang: "citra", badan: WEBP })).status, 404); // citra belum punya KTA
  assert.equal((await panggil("/api/kta/foto", { metode: "PUT", orang: "budi", badan: new Uint8Array(500 * 1024).fill(0xff) })).status, 413);
});

test("verifikasi publik: tanpa sesi, hanya nama/jenis/status/berlaku; tanpa surel, telepon, nomor, instansi", async () => {
  const url = (await panggil("/api/kta/saya", { orang: "budi" })).j.kta.url_verifikasi;
  const token = url.split("/kta/v/")[1];
  const r = await panggil("/api/kta/verifikasi/" + token);
  assert.equal(r.status, 200);
  assert.deepEqual(Object.keys(r.j).sort(), ["aktif", "berlaku_sampai", "jenis", "nama", "status"]);
  assert.equal(r.j.nama, "Budi Santoso"); assert.equal(r.j.aktif, true);
  assert.doesNotMatch(JSON.stringify(r.j), /rahasia|0812|@|METI-|PT Contoh/);
  // halaman publik terbuka tanpa login, dan token dengan HMAC diubah satu karakter = 404
  assert.equal((await panggil("/kta/v/" + token)).status, 200);
  const salah = token.slice(0, -1) + (token.endsWith("0") ? "1" : "0");
  assert.equal((await panggil("/api/kta/verifikasi/" + salah)).status, 404);
  assert.equal((await panggil("/api/kta/verifikasi/" + token.replace(/^\d+/, "999"))).status, 404);
  // halaman KTA pribadi tetap di balik login
  assert.equal((await panggil("/kta")).status, 302);
  // dicabut = tampil tidak aktif, bukan 404
  const id = Number(token.split(".")[0]);
  assert.equal((await panggil(`/api/admin/kta/${id}`, { metode: "PATCH", orang: "adm", badan: { aksi: "cabut" } })).status, 200);
  const c = await panggil("/api/kta/verifikasi/" + token);
  assert.equal(c.j.aktif, false); assert.equal(c.j.status, "dicabut");
});

test("kedaluwarsa dihitung dari tanggal; perpanjang dan masa berlaku massal", async () => {
  const r = await panggil("/api/admin/kta", { metode: "POST", orang: "adm", badan: { anggota_id: "m_bbbbbbbb", jenis: "biasa", berlaku_sampai: "2020-12-31", akun_surel: "citra@uji.test" } });
  assert.equal(r.status, 201); assert.match(r.j.nomor_kta, /^METI-\d{4}-BSA-00002$/);
  const saya = (await panggil("/api/kta/saya", { orang: "citra" })).j.kta;
  assert.equal(saya.status, "kedaluwarsa");
  const token = saya.url_verifikasi.split("/kta/v/")[1];
  assert.equal((await panggil("/api/kta/verifikasi/" + token)).j.status, "kedaluwarsa");
  assert.equal((await panggil(`/api/admin/kta/${saya.id}`, { metode: "PATCH", orang: "adm", badan: { aksi: "perpanjang", berlaku_sampai: depan() } })).status, 200);
  assert.equal((await panggil("/api/kta/saya", { orang: "citra" })).j.kta.status, "aktif");
  const m = await panggil("/api/admin/kta/masa", { metode: "POST", orang: "adm", badan: { berlaku_sampai: "2031-12-31" } });
  assert.equal(m.status, 200); assert.equal(m.j.diubah, 1); // Budi dicabut, jadi hanya Citra
  assert.equal((await panggil("/api/admin/kta/masa", { metode: "POST", orang: "citra", badan: { berlaku_sampai: "2031-12-31" } })).status, 403);
  assert.equal((await panggil("/api/admin/kta/masa", { metode: "POST", orang: "adm", badan: { berlaku_sampai: "bukan" } })).status, 422);
  assert.ok((await q("SELECT 1 FROM jejak WHERE tabel = 'kta' AND baris_id = 'massal'").first()));
});

test("terbitkan ulang yang dicabut mempertahankan nomor; daftar admin dan CSV aman rumus", async () => {
  const sebelum = await q("SELECT nomor_kta FROM kta WHERE anggota_id = 'm_aaaaaaaa'").first();
  const r = await panggil("/api/admin/kta", { metode: "POST", orang: "adm", badan: { anggota_id: "m_aaaaaaaa", jenis: "individu", berlaku_sampai: depan() } });
  assert.equal(r.status, 201); assert.equal(r.j.nomor_kta, sebelum.nomor_kta);
  const d = await panggil("/api/admin/kta", { orang: "adm" });
  assert.equal(d.j.baris.length, 2);
  assert.equal((await panggil("/api/admin/kta", { orang: "budi" })).status, 403);
  await q("UPDATE kta SET nama_cetak = '=HYPERLINK(1)' WHERE anggota_id = 'm_bbbbbbbb'").run();
  const csv = await panggil("/api/admin/kta?format=csv", { orang: "adm" });
  assert.equal(csv.status, 200); assert.match(csv.teks, /"'=HYPERLINK\(1\)"/); assert.match(csv.teks, /nomor_kta/);
  assert.ok((await q("SELECT 1 FROM jejak WHERE tabel = 'kta' AND baris_id = 'csv'").first()));
});

test("tolak klaim menghapus baris dan bukti; laju verifikasi publik membatasi", async () => {
  assert.equal((await panggil("/api/kta/klaim", { metode: "POST", orang: "citra", badan: { anggota_id: "m_cccccccc" } })).status, 409); // citra sudah punya KTA
  await masuk("dedi", "anggota");
  assert.equal((await panggil("/api/kta/klaim", { metode: "POST", orang: "dedi", badan: { anggota_id: "m_cccccccc" } })).status, 201);
  await panggil("/api/kta/bukti", { metode: "PUT", orang: "dedi", badan: WEBP });
  const id = (await q("SELECT id FROM kta WHERE akun_id = ?", akunId.dedi).first()).id;
  assert.ok([...BERKAS.keys()].includes(`kta/bukti/${id}.webp`));
  assert.equal((await panggil(`/api/admin/kta/${id}`, { metode: "PATCH", orang: "adm", badan: { aksi: "tolak" } })).status, 200);
  assert.equal(await q("SELECT 1 FROM kta WHERE id = ?", id).first(), null);
  assert.ok(![...BERKAS.keys()].includes(`kta/bukti/${id}.webp`));
  let tertolak = 0;
  for (let i = 0; i < 125; i++) if ((await panggil("/api/kta/verifikasi/1.00000000000000000000000000000000", { ip: "198.51.100.9" })).status === 429) tertolak++;
  assert.ok(tertolak >= 1, "laju verifikasi publik tidak membatasi");
});
