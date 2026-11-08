// konten_meti.test.mjs: Berita METI + Pustaka unggahan (migrasi 0033) lewat worker.fetch utuh, D1 lokal NYATA, R2 tiruan.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { buatEnv } from "./_bantu.mjs";
import worker from "../src/worker.js";
import * as hak from "../src/hak.js";
import { sha } from "../src/util.js";

const BERKAS = new Map();
const R2 = {
  put: async (k, v) => { BERKAS.set(k, new Uint8Array(await new Response(v).arrayBuffer())); },
  get: async (k) => (BERKAS.has(k) ? { body: BERKAS.get(k) } : null),
  delete: async (k) => { BERKAS.delete(k); },
};
const PDF = new TextEncoder().encode("%PDF-1.4\n1 0 obj<<>>endobj\n%%EOF");
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 16, 0x4a, 0x46, 0x49, 0x46, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0, 0xff, 0xd9]);
const JPEG_EXIF = new Uint8Array([0xff, 0xd8, 0xff, 0xe1, 0, 8, 0x45, 0x78, 0x69, 0x66, 0, 0, 0xff, 0xd9]);
const PERAN_SEMUA = ["anggota", "pengurus", "wilayah", "kurator", "admin", "super"];
const PERAN_TOLAK = ["anggota", "pengurus", "wilayah", "kurator"];

let E, tutup;
const COOKIE = {};
const q = (s, ...b) => E.DB.prepare(s).bind(...b);
const cacah = async (t) => (await q(`SELECT count(*) AS n FROM ${t}`).first()).n;

before(async () => {
  ({ env: E, tutup } = await buatEnv());
  E.BERKAS = R2;
  for (const peran of PERAN_SEMUA) {
    const r = await q("INSERT INTO akun (surel, nama, peran, cakupan_prov, status, garam, sandi, iterasi) VALUES (?,?,?,?, 'aktif', ?, ?, 100000)",
      `${peran}@uji.test`, peran, peran, peran === "wilayah" ? "31" : null, "a".repeat(32), "a".repeat(64)).run();
    const token = (PERAN_SEMUA.indexOf(peran) + 16).toString(16).repeat(32);
    await hak.catatSesi(E, { idHash: await sha(token), akunId: r.meta.last_row_id, peran, sampai: Math.floor(Date.now() / 1000) + 3600, ipHash: "h" });
    COOKIE[peran] = `sesi=${token}`;
  }
});
after(async () => { await tutup?.(); });

async function panggil(metode, jalur, { peran = null, badan, header = {} } = {}) {
  const h = { origin: "https://uji.test", "cf-connecting-ip": "203.0.113.7", ...header };
  if (peran) h.cookie = COOKIE[peran];
  if (metode !== "GET") h["x-pb"] = "1";
  let body = badan;
  if (badan !== undefined && !(badan instanceof Uint8Array)) { body = JSON.stringify(badan); h["content-type"] = "application/json"; }
  return worker.fetch(new Request("https://uji.test" + jalur, { method: metode, headers: h, body }), E, { waitUntil() {} });
}
const BM = { jenis: "siaran_pers", judul: "Siaran pers contoh", tanggal: "2026-11-01" };
const bikinBm = async (extra = {}) => (await (await panggil("POST", "/api/berita-meti", { peran: "admin", badan: { ...BM, ...extra } })).json()).ref;
const PU = "judul=Kajian%20contoh&penerbit=METI&jenis=kajian&nama=kajian.pdf";
const bikinPu = async (akses) => (await (await panggil("POST", `/api/pustaka-unggah?${PU}&akses=${akses}`, { peran: "admin", badan: PDF })).json()).ref;

test("publik 401; kurator/anggota/pengurus/wilayah 403 untuk semua rute tulis, tanpa efek", async () => {
  const tulis = [["POST", "/api/berita-meti", BM], ["PATCH", "/api/berita-meti/bm-1", {}], ["DELETE", "/api/berita-meti/bm-1"], ["PUT", "/api/berita-meti/bm-1/foto", JPEG],
    ["DELETE", "/api/berita-meti/bm-1/foto"], ["POST", `/api/pustaka-unggah?${PU}&akses=anggota`, PDF], ["PATCH", "/api/pustaka-unggah/pu-1", {}], ["DELETE", "/api/pustaka-unggah/pu-1"]];
  for (const [m, j, b] of [...tulis, ["GET", "/api/berita-meti"], ["GET", "/api/pustaka-unggah"], ["GET", "/api/pustaka-unggah/pu-1/unduh"]]) assert.equal((await panggil(m, j, { badan: b })).status, 401, j);
  const j0 = await cacah("jejak");
  for (const peran of PERAN_TOLAK) for (const [m, j, b] of tulis) assert.equal((await panggil(m, j, { peran, badan: b })).status, 403, `${peran} ${m} ${j}`);
  assert.equal(await cacah("jejak"), j0);
  assert.equal(await cacah("berita_meti"), 0);
  assert.equal(BERKAS.size, 0);
});

test("validasi: liputan_media wajib media + url https; judul pendek, tanggal salah, kolom asing ditolak", async () => {
  const salah = [
    { jenis: "liputan_media", judul: "Liputan contoh", tanggal: "2026-11-01" },
    { jenis: "liputan_media", judul: "Liputan contoh", tanggal: "2026-11-01", media: "Kompas" },
    { jenis: "liputan_media", judul: "Liputan contoh", tanggal: "2026-11-01", media: "Kompas", url: "http://k.id/a" },
    { jenis: "liputan_media", judul: "Liputan contoh", tanggal: "2026-11-01", url: "https://k.id/a" },
    { ...BM, judul: "abc" }, { ...BM, tanggal: "2026-13-40" }, { ...BM, jenis: "lain" }, { ...BM, foto_r2: "x" }, { ...BM, url: "javascript:alert(1)" },
  ];
  for (const b of salah) assert.equal((await panggil("POST", "/api/berita-meti", { peran: "admin", badan: b })).status, 422, JSON.stringify(b));
  assert.equal(await cacah("berita_meti"), 0);
  const ok = await panggil("POST", "/api/berita-meti", { peran: "super", badan: { jenis: "liputan_media", judul: "Liputan contoh", tanggal: "2026-11-01", media: "Kompas", url: "https://k.id/a" } });
  assert.equal(ok.status, 201);
  assert.match((await ok.json()).ref, /^bm-\d+$/);
});

test("draf (terbit=0) tak terlihat anggota (daftar dan butir 404), terlihat admin; daftar urut tanggal terbaru tanpa isi", async () => {
  const draf = await bikinBm({ terbit: 0, judul: "Draf rahasia", tanggal: "2026-12-01", isi: "isi draf" });
  const lama = await bikinBm({ judul: "Berita lama contoh", tanggal: "2026-01-05", isi: "isi" });
  for (const peran of PERAN_TOLAK) {
    const l = await (await panggil("GET", "/api/berita-meti", { peran })).json();
    assert.ok(!l.baris.some((b) => b.ref === draf), peran);
    assert.equal((await panggil("GET", `/api/berita-meti/${draf}`, { peran })).status, 404, peran);
  }
  const a = await (await panggil("GET", "/api/berita-meti", { peran: "admin" })).json();
  assert.equal(a.baris[0].ref, draf);
  assert.ok(a.baris.every((b, i, s) => i === 0 || s[i - 1].tanggal >= b.tanggal));
  assert.ok(a.baris.every((b) => !("isi" in b)) && "foto" in a.baris[0] && "terbit" in a.baris[0]);
  const butir = await panggil("GET", `/api/berita-meti/${lama}`, { peran: "anggota" });
  assert.equal(butir.status, 200);
  assert.equal((await butir.json()).isi, "isi");
  assert.equal((await panggil("GET", `/api/berita-meti/${draf}`, { peran: "admin" })).status, 200);
  const p = await panggil("PATCH", `/api/berita-meti/${draf}`, { peran: "admin", badan: { terbit: 1 } });
  assert.equal(p.status, 200);
  assert.equal((await panggil("GET", `/api/berita-meti/${draf}`, { peran: "anggota" })).status, 200);
  // PATCH yang melanggar aturan liputan_media ditolak
  assert.equal((await panggil("PATCH", `/api/berita-meti/${lama}`, { peran: "admin", badan: { jenis: "liputan_media" } })).status, 422);
  // jejak isi hanya panjang
  const j = await q("SELECT ke FROM jejak WHERE tabel = 'berita_meti' AND aksi = 'tambah' AND ke LIKE '%isi%' LIMIT 1").first();
  assert.ok(j.ke.includes("isi_panjang") && !j.ke.includes("isi draf"));
});

test("foto berita: magic bytes, EXIF ditolak, > 5 MB 413, ganti/lepas, hapus berita ikut hapus R2", async () => {
  const ref = await bikinBm({ judul: "Berita berfoto" });
  const f = `/api/berita-meti/${ref}/foto`;
  assert.equal((await panggil("PUT", f, { peran: "admin", badan: PDF })).status, 422);
  assert.equal((await panggil("PUT", f, { peran: "admin", badan: JPEG_EXIF })).status, 422);
  assert.equal((await panggil("PUT", f, { peran: "admin", badan: new Uint8Array(5 * 1024 * 1024 + 1).fill(1) })).status, 413);
  assert.equal(BERKAS.size, 0);
  assert.equal((await panggil("PUT", f, { peran: "admin", badan: JPEG })).status, 200);
  assert.equal(BERKAS.size, 1);
  const butir = await (await panggil("GET", `/api/berita-meti/${ref}`, { peran: "anggota" })).json();
  assert.equal(butir.foto, `/api/berita-meti/foto/${ref}`);
  const g = await panggil("GET", butir.foto, { peran: "anggota" });
  assert.equal(g.status, 200);
  assert.equal(g.headers.get("content-type"), "image/jpeg");
  assert.equal(g.headers.get("cache-control"), "private, no-store");
  assert.equal((await panggil("PUT", f, { peran: "admin", badan: JPEG })).status, 200);
  assert.equal(BERKAS.size, 1, "foto lama terhapus");
  assert.equal((await panggil("DELETE", f, { peran: "admin" })).status, 200);
  assert.equal(BERKAS.size, 0);
  assert.equal((await (await panggil("GET", `/api/berita-meti/${ref}`, { peran: "admin" })).json()).foto, null);
  assert.equal((await panggil("GET", `/api/berita-meti/foto/${ref}`, { peran: "admin" })).status, 404);
  await panggil("PUT", f, { peran: "admin", badan: JPEG });
  assert.equal((await panggil("DELETE", `/api/berita-meti/${ref}`, { peran: "admin" })).status, 200);
  assert.equal(BERKAS.size, 0);
  assert.equal((await panggil("GET", `/api/berita-meti/${ref}`, { peran: "admin" })).status, 404);
});

test("pustaka: akses pengurus tak terlihat anggota (daftar, unduh 404); pengurus/kurator/wilayah terlihat; header unduh aman", async () => {
  const a = await bikinPu("anggota"), p = await bikinPu("pengurus");
  assert.ok(a && p);
  const ld = await (await panggil("GET", "/api/pustaka-unggah", { peran: "anggota" })).json();
  assert.ok(ld.baris.some((b) => b.ref === a) && !ld.baris.some((b) => b.ref === p));
  assert.ok(ld.baris.every((b) => !("kunci_r2" in b) && !("id" in b)));
  assert.equal((await panggil("GET", `/api/pustaka-unggah/${p}/unduh`, { peran: "anggota" })).status, 404);
  for (const peran of ["pengurus", "kurator", "wilayah", "admin", "super"]) {
    assert.ok((await (await panggil("GET", "/api/pustaka-unggah", { peran })).json()).baris.some((b) => b.ref === p), peran);
    assert.equal((await panggil("GET", `/api/pustaka-unggah/${p}/unduh`, { peran })).status, 200, peran);
  }
  const r = await panggil("GET", `/api/pustaka-unggah/${a}/unduh`, { peran: "anggota" });
  assert.equal(r.status, 200);
  assert.match(r.headers.get("content-disposition"), /^attachment; filename="kajian\.pdf"/);
  assert.equal(r.headers.get("x-content-type-options"), "nosniff");
  assert.equal(r.headers.get("cache-control"), "private, no-store");
  assert.equal(r.headers.get("content-type"), "application/pdf");
  // PATCH akses menutup dokumen dari anggota
  assert.equal((await panggil("PATCH", `/api/pustaka-unggah/${a}`, { peran: "admin", badan: { akses: "pengurus", judul: "Judul baru" } })).status, 200);
  assert.equal((await panggil("GET", `/api/pustaka-unggah/${a}/unduh`, { peran: "anggota" })).status, 404);
});

test("pustaka: PDF berekstensi .exe, isi bukan dokumen, metadata kurang ditolak; > 50 MB 413; hapus ikut hapus R2", async () => {
  const n0 = await cacah("pustaka_unggah"), r0 = BERKAS.size;
  const dasar = "judul=Kajian%20contoh&penerbit=METI&jenis=kajian&akses=anggota";
  assert.equal((await panggil("POST", `/api/pustaka-unggah?${dasar}&nama=virus.exe`, { peran: "admin", badan: PDF })).status, 415);
  assert.equal((await panggil("POST", `/api/pustaka-unggah?${dasar}&nama=a.pdf`, { peran: "admin", badan: new TextEncoder().encode("MZ bukan dokumen") })).status, 415);
  assert.equal((await panggil("POST", `/api/pustaka-unggah?${dasar}&nama=a.pdf&bahasa=fr`, { peran: "admin", badan: PDF })).status, 422);
  assert.equal((await panggil("POST", `/api/pustaka-unggah?judul=x&nama=a.pdf`, { peran: "admin", badan: PDF })).status, 422);
  const besar = new Uint8Array(50 * 1024 * 1024 + 1); besar.set(PDF);
  assert.equal((await panggil("POST", `/api/pustaka-unggah?${dasar}&nama=a.pdf`, { peran: "admin", badan: besar })).status, 413);
  assert.equal(await cacah("pustaka_unggah"), n0);
  assert.equal(BERKAS.size, r0);
  const ref = await bikinPu("anggota");
  assert.equal(BERKAS.size, r0 + 1);
  assert.equal((await panggil("DELETE", `/api/pustaka-unggah/${ref}`, { peran: "super" })).status, 200);
  assert.equal(BERKAS.size, r0);
  assert.equal((await panggil("GET", `/api/pustaka-unggah/${ref}/unduh`, { peran: "admin" })).status, 404);
});
