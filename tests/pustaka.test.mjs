// pustaka.test.mjs: rute Pustaka lewat worker.fetch utuh, D1 lokal NYATA (migrasi 0012), R2 tiruan sederhana.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { buatEnv } from "./_bantu.mjs";
import worker from "../src/worker.js";
import * as hak from "../src/hak.js";
import { sha } from "../src/util.js";

const DASAR = { baris: [
  { id: "pk-r2", judul: "Kajian di R2", jenis: "kajian", penerbit: "Penerbit A", tanggal: "2025", format: "pdf", ukuran: 10, halaman: 5, lapis: "publik", rahasia: false },
  { id: "pk-sumber", judul: "Regulasi bersumber", jenis: "regulasi", penerbit: "Pemerintah", tanggal: "2020", format: "pdf", url: "https://peraturan.bpk.go.id/Details/1", lapis: "publik", rahasia: false },
  { id: "pk-kosong", judul: "Belum ada berkas", jenis: "kajian", penerbit: "B", tanggal: "2024", format: "pdf", lapis: "publik", rahasia: false },
  { id: "pk-pengurus", judul: "Internal", jenis: "kajian", penerbit: "C", tanggal: "2024", format: "pdf", lapis: "pengurus", rahasia: false },
  { id: "pk-rahasia", judul: "Berlabel", jenis: "kajian", penerbit: "C", tanggal: "2024", format: "pdf", lapis: "publik", rahasia: true },
] };
const ULASAN = { dokumen: [], ulasan: { "pk-r2": { berkas: [
  { id: "utama", nama: "Naskah", format: "pdf", ukuran: 10, halaman: 5, r2: true },
  { id: "lampiran", nama: "Lampiran", format: "pdf", ukuran: 4, halaman: 2, r2: true },
] } } };
const OBJEK = new Map([["pustaka/pk-r2.pdf", new Uint8Array([37, 80, 68, 70, 1])], ["pustaka/pk-r2--lampiran.pdf", new Uint8Array([37, 80, 68, 70, 2])]]);
const R2 = { head: async (k) => (OBJEK.has(k) ? { key: k } : null), get: async (k) => (OBJEK.has(k) ? { body: OBJEK.get(k) } : null) };

let E, tutup;
const COOKIE = {}, ID = {};
const PERAN = ["anggota", "pengurus", "admin", "super"];
const q = (s, ...b) => E.DB.prepare(s).bind(...b);
const satu = (s, ...b) => q(s, ...b).first();
const cacah = async (w = "") => (await satu(`SELECT count(*) AS n FROM dokumen_unduh ${w}`)).n;

before(async () => {
  ({ env: E, tutup } = await buatEnv());
  E.BERKAS = R2;
  E.ASSETS = { fetch: async (req) => {
    const p = new URL(req.url).pathname;
    return p === "/data/pustaka.json" ? new Response(JSON.stringify(DASAR)) : p === "/data/pustaka_ulasan.json" ? new Response(JSON.stringify(ULASAN)) : new Response("x");
  } };
  for (const peran of PERAN) {
    const r = await q("INSERT INTO akun (surel, nama, peran, status, garam, sandi, iterasi) VALUES (?,?,?, 'aktif', ?, ?, 100000)", `${peran}@uji.test`, `Nama ${peran}`, peran, "a".repeat(32), "a".repeat(64)).run();
    const token = (PERAN.indexOf(peran) + 16).toString(16).repeat(32);
    ID[peran] = r.meta.last_row_id;
    await hak.catatSesi(E, { idHash: await sha(token), akunId: ID[peran], peran, sampai: Math.floor(Date.now() / 1000) + 3600, ipHash: "h" });
    COOKIE[peran] = `sesi=${token}`;
  }
});
after(async () => { await tutup?.(); });

async function panggil(metode, jalur, { peran = null, badan, pb = true } = {}) {
  const h = { origin: "https://uji.test", "cf-connecting-ip": "203.0.113.7" };
  if (peran) h.cookie = COOKIE[peran];
  if (pb && metode !== "GET") h["x-pb"] = "1";
  let body;
  if (badan !== undefined) { body = JSON.stringify(badan); h["content-type"] = "application/json"; }
  return worker.fetch(new Request("https://uji.test" + jalur, { method: metode, headers: h, body }), E, { waitUntil() {} });
}
const SETUJU = { tujuan: "riset", setuju: true, instansi: "Universitas Uji", telepon: "+62 812 3456 789" };

test("tamu 401 di semua rute Pustaka", async () => {
  for (const [m, j, b] of [["GET", "/api/pustaka"], ["POST", "/api/pustaka/pk-r2/unduh", {}], ["GET", "/api/pustaka/pk-r2/berkas/utama?t=1"], ["GET", "/api/admin/pustaka/unduhan"]]) {
    const r = await panggil(m, j, { badan: b });
    assert.equal(r.status, 401, `${m} ${j}`);
  }
  assert.equal(await cacah(), 0);
});

test("akun masuk 200 di daftar; metadata tanpa kunci R2, tautan, atau token; ada data akun untuk dialog", async () => {
  const r = await panggil("GET", "/api/pustaka", { peran: "anggota" });
  assert.equal(r.status, 200);
  const teks = await r.clone().text();
  assert.ok(!/pustaka\/pk-|[?&]t=|token|https:\/\/peraturan/.test(teks), "tak boleh membocorkan kunci R2, token, atau url sumber");
  const d = await r.json();
  assert.deepEqual(d.dokumen.map((x) => x.id).sort(), ["pk-kosong", "pk-r2", "pk-sumber"]); // lapis pengurus dan berlabel rahasia tidak muncul
  assert.equal(d.dokumen.find((x) => x.id === "pk-r2").berkas.length, 2);
  assert.equal(d.dokumen.find((x) => x.id === "pk-r2").bisa_unduh, true);
  assert.equal(d.dokumen.find((x) => x.id === "pk-kosong").bisa_unduh, false);
  assert.equal(d.saya.surel, "anggota@uji.test");
  assert.equal(d.saya.pernah, false);
});

test("unduhan pertama wajib tujuan dan persetujuan; tidak tercatat bila ditolak", async () => {
  for (const badan of [{}, { tujuan: "riset" }, { setuju: true }, { tujuan: "riset", setuju: "ya" }]) {
    const r = await panggil("POST", "/api/pustaka/pk-r2/unduh", { peran: "anggota", badan });
    assert.equal(r.status, 422);
    assert.equal((await r.json()).kode, "persetujuan_wajib");
  }
  assert.equal(await cacah(), 0);
  for (const badan of [{ ...SETUJU, tujuan: "iseng" }, { ...SETUJU, telepon: "abc" }, { ...SETUJU, berkas: "../x" }]) {
    assert.equal((await panggil("POST", "/api/pustaka/pk-r2/unduh", { peran: "anggota", badan })).status, 422);
  }
  assert.equal(await cacah(), 0);
});

test("CSRF: POST tanpa x-pb ditolak", async () => {
  assert.equal((await panggil("POST", "/api/pustaka/pk-r2/unduh", { peran: "anggota", badan: SETUJU, pb: false })).status, 403);
});

test("unduhan pertama tercatat, profil tersimpan, tautan R2 sementara jalan; unduhan berikutnya satu klik", async () => {
  const r = await panggil("POST", "/api/pustaka/pk-r2/unduh", { peran: "anggota", badan: SETUJU });
  assert.equal(r.status, 200);
  const d = await r.json();
  assert.equal(d.via, "r2");
  assert.match(d.url, /^\/api\/pustaka\/pk-r2\/berkas\/utama\?t=\d{10}\.[0-9a-f]{64}$/);
  const log = await satu("SELECT * FROM dokumen_unduh WHERE akun_id = ?", ID.anggota);
  assert.deepEqual([log.dokumen_id, log.berkas_id, log.tujuan, log.via], ["pk-r2", "utama", "riset", "r2"]);
  const prof = await satu("SELECT instansi, telepon FROM akun_profil WHERE akun_id = ?", ID.anggota);
  assert.deepEqual([prof.instansi, prof.telepon], ["Universitas Uji", "+62 812 3456 789"]);

  const f = await panggil("GET", d.url, { peran: "anggota" });
  assert.equal(f.status, 200);
  assert.equal(f.headers.get("content-type"), "application/pdf");
  assert.match(f.headers.get("content-disposition"), /attachment; filename="pk-r2\.pdf"/);
  assert.match(f.headers.get("cache-control"), /no-store/);
  assert.deepEqual([...new Uint8Array(await f.arrayBuffer())], [37, 80, 68, 70, 1]);

  // satu klik: tanpa tujuan, tanpa persetujuan; tujuan terakhir dipakai; profil tidak ditimpa
  const r2 = await panggil("POST", "/api/pustaka/pk-r2/unduh", { peran: "anggota", badan: { berkas: "lampiran", instansi: "Lain" } });
  assert.equal(r2.status, 200);
  assert.match((await r2.json()).url, /\/berkas\/lampiran\?t=/);
  const baris = (await q("SELECT berkas_id, tujuan FROM dokumen_unduh WHERE akun_id = ? ORDER BY id", ID.anggota).all()).results;
  assert.deepEqual(baris.map((x) => x.berkas_id), ["utama", "lampiran"]);
  assert.equal(baris[1].tujuan, "riset");
  assert.equal((await satu("SELECT instansi FROM akun_profil WHERE akun_id = ?", ID.anggota)).instansi, "Universitas Uji");
  const s = await (await panggil("GET", "/api/pustaka", { peran: "anggota" })).json();
  assert.equal(s.saya.pernah, true);
  assert.equal(s.saya.instansi, "Universitas Uji");
});

test("tautan berkas terikat akun, dokumen, dan masa berlaku", async () => {
  const d = await (await panggil("POST", "/api/pustaka/pk-r2/unduh", { peran: "pengurus", badan: SETUJU })).json();
  assert.equal((await panggil("GET", d.url, { peran: "pengurus" })).status, 200);
  assert.equal((await panggil("GET", d.url, { peran: "anggota" })).status, 403, "akun lain tak boleh memakai tautan");
  assert.equal((await panggil("GET", d.url.replace("/utama?", "/lampiran?"), { peran: "pengurus" })).status, 403, "berkas lain tak boleh");
  assert.equal((await panggil("GET", d.url.slice(0, -1) + (d.url.endsWith("0") ? "1" : "0"), { peran: "pengurus" })).status, 403, "tanda tangan rusak");
  const lama = d.url.replace(/t=\d{10}/, "t=1000000000");
  assert.equal((await panggil("GET", lama, { peran: "pengurus" })).status, 403, "kedaluwarsa");
  assert.equal((await panggil("GET", "/api/pustaka/pk-r2/berkas/utama", { peran: "pengurus" })).status, 403, "tanpa token");
  assert.equal((await panggil("GET", "/api/pustaka/pk-r2/berkas/utama?t=1", { peran: "pengurus" })).status, 403);
});

test("berkas publik bersumber dialihkan ke sumber resmi dan tercatat via=sumber", async () => {
  const r = await panggil("POST", "/api/pustaka/pk-sumber/unduh", { peran: "admin", badan: SETUJU });
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), { via: "sumber", url: "https://peraturan.bpk.go.id/Details/1" });
  assert.equal((await satu("SELECT via FROM dokumen_unduh WHERE dokumen_id = 'pk-sumber'")).via, "sumber");
});

test("dokumen tanpa berkas, tak dikenal, lapis pengurus, atau berlabel rahasia: 404 dan tidak tercatat", async () => {
  const sebelum = await cacah();
  for (const id of ["pk-kosong", "pk-tidak-ada", "pk-pengurus", "pk-rahasia"]) {
    const r = await panggil("POST", `/api/pustaka/${id}/unduh`, { peran: "super", badan: SETUJU });
    assert.equal(r.status, 404, id);
  }
  assert.equal((await panggil("POST", "/api/pustaka/pk-r2/unduh", { peran: "super", badan: { ...SETUJU, berkas: "tidak-ada" } })).status, 404);
  assert.equal(await cacah(), sebelum);
});

test("jumlah_unduh agregat tampil untuk semua akun, tanpa identitas", async () => {
  const r = await panggil("GET", "/api/pustaka", { peran: "pengurus" });
  const teks = await r.clone().text();
  const d = await r.json();
  assert.equal(d.dokumen.find((x) => x.id === "pk-r2").jumlah_unduh, 3);
  assert.equal(d.dokumen.find((x) => x.id === "pk-sumber").jumlah_unduh, 1);
  assert.ok(!/anggota@uji\.test|Nama anggota/.test(teks), "identitas akun lain tak boleh bocor");
});

test("admin: rekap dan daftar unduhan; anggota dan pengurus 403", async () => {
  for (const peran of ["anggota", "pengurus"]) assert.equal((await panggil("GET", "/api/admin/pustaka/unduhan", { peran })).status, 403);
  for (const peran of ["admin", "super"]) {
    const r = await panggil("GET", "/api/admin/pustaka/unduhan", { peran });
    assert.equal(r.status, 200);
    const d = await r.json();
    assert.equal(d.total, 4);
    assert.equal(d.rekap[0].dokumen_id, "pk-r2");
    assert.equal(d.rekap[0].n, 3);
    const baris = d.daftar.find((x) => x.akun_id === ID.anggota);
    assert.deepEqual([baris.nama, baris.surel, baris.instansi, baris.tujuan], ["Nama anggota", "anggota@uji.test", "Universitas Uji", "riset"]);
  }
});

test("log append-only: tidak bisa diubah atau dihapus", async () => {
  await assert.rejects(() => q("DELETE FROM dokumen_unduh").run());
  await assert.rejects(() => q("UPDATE dokumen_unduh SET tujuan = 'media'").run());
  await assert.rejects(() => q("INSERT INTO dokumen_unduh (dokumen_id, tujuan, via) VALUES ('x', 'iseng', 'r2')").run());
  await assert.rejects(() => q("INSERT INTO akun_profil (akun_id, telepon) VALUES (?, 'abc')", ID.admin).run());
});
