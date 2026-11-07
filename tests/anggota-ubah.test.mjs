// Penyunting Anggota METI: migrasi 0009 + rute POST/PATCH/DELETE + gabungan GET, di D1 lokal nyata; R2 dasar ditiru sederhana.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { buatEnv, minta } from "./_bantu.mjs";
import worker from "../src/worker.js";
import { sha, acak } from "../src/util.js";

let E, tutup;
const DASAR = { lapis: "pengurus", baris: [
  { no_anggota: "1", nama: "Satu", jenis: "individu", status: "aktif", iuran: { 2024: "1" }, surel: "a@x.id" },
  { no_anggota: "2", nama: "Dua", jenis: "utama", status: "aktif" },
] };
const sesi = {};
async function masuk(peran) {
  const r = await E.DB.prepare("INSERT INTO akun (surel, nama, peran, status, garam, sandi, iterasi) VALUES (?,?,?, 'aktif', ?, ?, 100000)").bind(`${peran}@uji.test`, peran, peran, "a".repeat(32), "a".repeat(64)).run();
  const token = acak(32);
  await E.DB.prepare("INSERT INTO sesi (id_hash, akun_id, sampai) VALUES (?,?,?)").bind(await sha(token), r.meta.last_row_id, Math.floor(Date.now() / 1000) + 3600).run();
  sesi[peran] = "sesi=" + token;
}
const panggil = async (jalur, metode, peran, badan, opsi = {}) => {
  const res = await worker.fetch(minta(jalur, { metode, badan, cookie: peran ? sesi[peran] : undefined, ...opsi }), E, { waitUntil() {} });
  return { status: res.status, cache: res.headers.get("cache-control"), ...(await res.json()) };
};
const U = "/api/admin/anggota-meti";

before(async () => {
  ({ env: E, tutup } = await buatEnv());
  E.BERKAS = { get: async (k) => (k === "potret/pengurus/anggota_meti.json" ? { body: JSON.stringify(DASAR), json: async () => DASAR } : null) };
  for (const p of ["anggota", "pengurus"]) await masuk(p);
});
after(async () => { await tutup?.(); });

test("migrasi 0009: tabel anggota_ubah + indeks, CHECK aksi menolak nilai liar", async () => {
  const idx = await E.DB.prepare("SELECT name FROM sqlite_master WHERE name = 'anggota_ubah_anggota'").first();
  assert.ok(idx);
  await assert.rejects(E.DB.prepare("INSERT INTO anggota_ubah (anggota_id, aksi) VALUES ('x','racun')").run());
});

test("gerbang: tamu 401, anggota 403, CSRF (tanpa x-pb / origin asing) 403", async () => {
  assert.equal((await panggil(U, "POST", null, { nama: "X", jenis: "individu" })).status, 401);
  assert.equal((await panggil(U, "POST", "anggota", { nama: "X", jenis: "individu" })).status, 403);
  assert.equal((await panggil(U + "/b0", "DELETE", "anggota")).status, 403);
  assert.equal((await panggil(U, "POST", "pengurus", { nama: "X", jenis: "individu" }, { header: { "x-pb": "0" } })).status, 403);
  assert.equal((await panggil(U, "POST", "pengurus", { nama: "X", jenis: "individu" }, { origin: "https://jahat.test" })).status, 403);
});

test("validasi: nama wajib, jenis/status/surel/telepon/situs/iuran salah ditolak 422 per kolom", async () => {
  const r = await panggil(U, "POST", "pengurus", { nama: " ", jenis: "hantu", surel: "bukan", telepon: "abc", situs: "http://x.id", iuran: { 1999: true } });
  assert.equal(r.status, 422);
  for (const k of ["nama", "jenis", "surel", "telepon", "situs", "iuran"]) assert.ok(r.kolom[k], k);
  assert.equal((await panggil(U, "POST", "pengurus", { nama: "x".repeat(201), jenis: "individu" })).kolom.nama.includes("200"), true);
  assert.equal((await panggil(U, "POST", "pengurus", "{" )).status, 422 );
});

test("badan terlalu besar ditolak 413", async () => {
  assert.equal((await panggil(U, "POST", "pengurus", { nama: "x", jenis: "individu", catatan: "y".repeat(20000) })).status, 413);
});

test("tambah, ubah, hapus: GET menggabung dasar R2 + log, no-store, jejak tertulis", async () => {
  const t = await panggil(U, "POST", "pengurus", { nama: "Baru PT", jenis: "Baru registrasi", status: "aktif", surel: "Info@Baru.id", situs: "https://baru.id", iuran: { 2025: true }, catatan: "uji" });
  assert.equal(t.status, 201); assert.match(t.id, /^am_[0-9a-f]{12}$/);
  assert.equal((await panggil(U + "/b0", "PATCH", "pengurus", { jabatan: "Ketua", iuran: { 2025: true } })).status, 200);
  assert.equal((await panggil(U + "/b1", "DELETE", "pengurus")).status, 200);
  const g = await panggil(U, "GET", "pengurus");
  assert.equal(g.status, 200); assert.match(g.cache, /no-store/);
  assert.deepEqual(g.baris.map((r) => r.nama), ["Satu", "Baru PT"]);
  const satu = g.baris[0], baru = g.baris[1];
  assert.equal(satu.jabatan, "Ketua"); assert.equal(satu.iuran["2024"], "1"); assert.equal(satu.iuran["2025"], "1"); assert.equal(satu.diubah, true);
  assert.equal(baru.jenis, "baru-registrasi"); assert.equal(baru.surel, "info@baru.id"); assert.equal(baru.id, t.id); assert.equal(baru.diubah, true);
  const j = await E.DB.prepare("SELECT aksi FROM jejak WHERE tabel = 'anggota_ubah' ORDER BY id").all();
  assert.deepEqual(j.results.map((x) => x.aksi), ["tambah", "ubah", "hapus"]);
  assert.equal((await E.DB.prepare("SELECT catatan FROM anggota_ubah WHERE aksi = 'tambah'").first()).catatan, "uji");
});

test("ubah/hapus id tak dikenal atau sudah dihapus = 404; id berbentuk liar = 404", async () => {
  assert.equal((await panggil(U + "/b1", "PATCH", "pengurus", { nama: "Z" })).status, 404);
  assert.equal((await panggil(U + "/am_tidakada1234", "DELETE", "pengurus")).status, 404);
  assert.equal((await panggil(U + "/x'; DROP", "DELETE", "pengurus")).status, 404);
});

test("tabel anggota_ubah belum ada (tanpa 0009): GET = dasar R2 penyunting:false, tulis = 503 fitur_belum_aktif", async () => {
  const { env: E0, tutup: t0 } = await buatEnv({ migrasi: false });
  try {
    const { terapkanMigrasi } = await import("./_bantu.mjs");
    const fs = await import("node:fs"), { pecahSql } = await import("./_bantu.mjs");
    for (const f of fs.readdirSync(new URL("../migrations/", import.meta.url)).filter((x) => x.endsWith(".sql") && !x.startsWith("0009")).sort())
      for (const q of pecahSql(fs.readFileSync(new URL("../migrations/" + f, import.meta.url), "utf8"))) await E0.DB.prepare(q).run();
    E0.BERKAS = E.BERKAS;
    const keep = E; E = E0;
    try {
      await masuk("pengurus");
      const g = await panggil(U, "GET", "pengurus");
      assert.equal(g.status, 200); assert.equal(g.penyunting, false); assert.equal(g.baris.length, 2);
      for (const [j, m, b] of [[U, "POST", { nama: "X", jenis: "individu" }], [U + "/b0", "PATCH", { nama: "Y" }], [U + "/b0", "DELETE", undefined]]) {
        const r = await panggil(j, m, "pengurus", b);
        assert.equal(r.status, 503, m); assert.equal(r.galat, "fitur_belum_aktif");
      }
    } finally { E = keep; }
  } finally { await t0(); }
});
