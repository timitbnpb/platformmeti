// Fitur admin 0010 (koreksi_usul, statistik_harian, konten_beranda, jejak) di D1 lokal nyata.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { buatEnv, minta } from "./_bantu.mjs";
import worker from "../src/worker.js";
import { sha, acak } from "../src/util.js";
import { normalisasiCari, normalisasiHalaman } from "../src/admin.js";

let E, tutup;
const sesi = {};
async function masuk(peran) {
  const r = await E.DB.prepare("INSERT INTO akun (surel, nama, peran, status, garam, sandi, iterasi) VALUES (?,?,?, 'aktif', ?, ?, 100000)").bind(`${peran}@uji.test`, peran, peran, "a".repeat(32), "a".repeat(64)).run();
  const token = acak(32);
  await E.DB.prepare("INSERT INTO sesi (id_hash, akun_id, sampai) VALUES (?,?,?)").bind(await sha(token), r.meta.last_row_id, Math.floor(Date.now() / 1000) + 3600).run();
  sesi[peran] = "sesi=" + token;
}
const panggil = async (jalur, metode, peran, badan, opsi = {}) => {
  const res = await worker.fetch(minta(jalur, { metode, badan, cookie: peran ? sesi[peran] : undefined, ...opsi }), E, { waitUntil() {} });
  const t = await res.text();
  return { status: res.status, ...(t ? JSON.parse(t) : {}) };
};
const K = { entitas: "organisasi", entitas_id: "meti", kolom: "situs", nilai_usulan: "https://baru.id", alasan: "situs pindah", sumber_url: "https://baru.id/info" };

before(async () => {
  ({ env: E, tutup } = await buatEnv());
  for (const p of ["anggota", "pengurus", "kurator", "admin"]) await masuk(p);
});
after(async () => { await tutup?.(); });

test("hak: rute admin tamu 401, non-admin 403", async () => {
  for (const [m, j, b] of [["GET", "/api/admin/koreksi"], ["POST", "/api/admin/koreksi/1", { aksi: "tolak" }], ["GET", "/api/admin/jejak"], ["GET", "/api/admin/statistik"], ["PUT", "/api/admin/konten-beranda", { kunci: "agenda", isi: [] }]]) {
    assert.equal((await panggil(j, m, null, b)).status, 401, "tamu " + m + j);
    for (const p of ["anggota", "pengurus", "kurator"]) assert.equal((await panggil(j, m, p, b)).status, 403, p + " " + m + j);
  }
});

test("koreksi publik: validasi, 201, laju 5/jam, tanpa data pribadi", async () => {
  for (const salah of [{ ...K, entitas: "hantu" }, { ...K, kolom: "nik" }, { ...K, nilai_usulan: "" }, { ...K, sumber_url: "http://x.id" }, { ...K, alasan: "x".repeat(1001) }, { ...K, entitas_id: "a b" }])
    assert.equal((await panggil("/api/koreksi", "POST", "anggota", salah, { ip: "198.51.100.1" })).status, 422);
  const r = await panggil("/api/koreksi", "POST", "anggota", K, { ip: "198.51.100.2" });
  assert.equal(r.status, 201); assert.ok(r.id);
  const kolom = (await E.DB.prepare("PRAGMA table_info(koreksi_usul)").all()).results.map((c) => c.name);
  assert.ok(!kolom.some((c) => /^ip|surel|agent|kontak/.test(c)));
  for (let i = 0; i < 4; i++) await panggil("/api/koreksi", "POST", "anggota", K, { ip: "198.51.100.2" });
  assert.equal((await panggil("/api/koreksi", "POST", "anggota", K, { ip: "198.51.100.2" })).status, 429);
});

test("koreksi admin: daftar, putus sekali + jejak, kedua kali 409", async () => {
  const l = await panggil("/api/admin/koreksi?status=baru", "GET", "admin");
  assert.equal(l.status, 200); assert.ok(l.total >= 1); const id = l.baris[0].id;
  assert.equal((await panggil("/api/admin/koreksi?status=x", "GET", "admin")).status, 422);
  assert.equal((await panggil("/api/admin/koreksi/" + id, "POST", "admin", { aksi: "ngawur" })).status, 422);
  assert.equal((await panggil("/api/admin/koreksi/" + id, "POST", "admin", { aksi: "setuju", catatan: "ok" })).status, 200);
  assert.equal((await panggil("/api/admin/koreksi/" + id, "POST", "admin", { aksi: "tolak" })).status, 409);
  assert.equal((await panggil("/api/admin/koreksi?status=setuju", "GET", "admin")).baris[0].diputus_oleh > 0, true);
  const j = await panggil("/api/admin/jejak?jenis=koreksi_usul", "GET", "admin");
  assert.equal(j.baris.length, 1); assert.equal(j.baris[0].aksi, "tinjau"); assert.equal(j.baris[0].entitas_id, String(id)); assert.ok(j.baris[0].akun_id);
});

test("statistik: normalisasi, agregat tanpa data pribadi, asal wajib, rekap admin", async () => {
  assert.equal(normalisasiCari("  Surya   PLTS  "), "surya plts");
  assert.equal(normalisasiCari("a@b.id"), null);
  assert.equal(normalisasiCari("0812 3456 7890"), null);
  assert.equal(normalisasiCari("x".repeat(100)).length, 60);
  assert.equal(normalisasiHalaman("/Direktori?q=1#a"), "/direktori");
  assert.equal(normalisasiHalaman("//evil.com"), null);
  const kirim = (b, o = {}) => worker.fetch(new Request("https://uji.test/api/statistik", { method: "POST", body: JSON.stringify(b), headers: { origin: "https://uji.test", "content-type": "text/plain", "cf-connecting-ip": "203.0.113.50", cookie: sesi.anggota, ...o } }), E, {});
  assert.equal((await kirim({ jenis: "halaman", kunci: "/direktori?x=1" })).status, 204);
  assert.equal((await kirim({ jenis: "halaman", kunci: "/direktori" })).status, 204);
  assert.equal((await kirim({ jenis: "cari", kunci: "Budi@Mail.com" })).status, 204);
  assert.equal((await kirim({ jenis: "cari", kunci: "Tenaga Surya" })).status, 204);
  assert.equal((await kirim({ jenis: "halaman", kunci: "/x" }, { origin: "https://jahat.test" })).status, 403);
  assert.equal((await kirim({ jenis: "lain", kunci: "x" })).status, 422);
  const baris = (await E.DB.prepare("SELECT jenis, kunci, jumlah FROM statistik_harian ORDER BY kunci").all()).results;
  assert.deepEqual(baris.map((b) => ({ ...b })), [{ jenis: "halaman", kunci: "/direktori", jumlah: 2 }, { jenis: "cari", kunci: "tenaga surya", jumlah: 1 }]);
  assert.ok(!(await E.DB.prepare("PRAGMA table_info(statistik_harian)").all()).results.some((c) => /^ip|agent|akun/.test(c.name)));
  const s = await panggil("/api/admin/statistik?hari=7", "GET", "admin");
  assert.equal(s.halaman[0].kunci, "/direktori"); assert.equal(s.halaman[0].jumlah, 2); assert.equal(s.harian[0].cari, 0); assert.deepEqual(s.cari, []);
});

test("konten beranda: publik kosong, PUT admin + jejak, validasi", async () => {
  const k0 = await panggil("/api/konten-beranda", "GET", "anggota");
  assert.deepEqual(Object.keys(k0).filter((k) => k !== "status").sort(), ["agenda", "berita_pilihan", "program", "sorotan"]);
  assert.equal((await panggil("/api/admin/konten-beranda", "PUT", "admin", { kunci: "x", isi: [] })).status, 422);
  assert.equal((await panggil("/api/admin/konten-beranda", "PUT", "admin", { kunci: "agenda", isi: "teks" })).status, 422);
  assert.equal((await panggil("/api/admin/konten-beranda", "PUT", "admin", { kunci: "agenda", isi: [{ judul: "Rapat" }] })).status, 200);
  assert.equal((await panggil("/api/admin/konten-beranda", "PUT", "admin", { kunci: "agenda", isi: [{ judul: "Rapat 2" }] })).status, 200);
  assert.equal((await E.DB.prepare("SELECT isi FROM konten_beranda WHERE kunci='agenda'").first()).isi, '[{"judul":"Rapat 2"}]');
  const j = await panggil("/api/admin/jejak?jenis=konten_beranda", "GET", "admin");
  assert.equal(j.total, 2); assert.equal(j.baris[0].entitas_id, "agenda");
});

test("toleransi tabel hilang: 503 fitur_belum_aktif, konten publik tetap 200", async () => {
  const { env: E2, tutup: t2 } = await buatEnv();
  const E0 = E;
  try {
    for (const t of ["koreksi_usul", "statistik_harian", "konten_beranda"]) await E2.DB.prepare("DROP TABLE " + t).run();
    E = E2;
    await masuk("admin");
    assert.equal((await panggil("/api/koreksi", "POST", "admin", K, { ip: "198.51.100.9" })).status, 503);
    assert.equal((await panggil("/api/admin/koreksi", "GET", "admin")).kode, "fitur_belum_aktif");
    assert.equal((await panggil("/api/admin/statistik", "GET", "admin")).status, 503);
    assert.equal((await panggil("/api/admin/konten-beranda", "PUT", "admin", { kunci: "agenda", isi: [] })).status, 503);
    assert.equal((await panggil("/api/konten-beranda", "GET", "admin")).sorotan, null);
  } finally { E = E0; await t2(); }
});
