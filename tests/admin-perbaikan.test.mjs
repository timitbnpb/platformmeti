// Perbaikan temuan keamanan: foto berita, statistik, jejak ringkas, cache konten beranda, proksi POWER.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { buatEnv, minta } from "./_bantu.mjs";
import worker from "../src/worker.js";
import { sha, acak } from "../src/util.js";
import { normalisasiHalaman } from "../src/admin.js";

let E, tutup, cookie;
const asliFetch = globalThis.fetch;
const simpan = new Map();
globalThis.caches = { default: { match: async (r) => simpan.get(r.url)?.clone(), put: async (r, res) => { simpan.set(r.url, res); } } };
const ctx = { waitUntil: (p) => p };
const get = (jalur, ip = "203.0.113.9") => worker.fetch(minta(jalur, { ip, cookie }), E, ctx);

before(async () => {
  ({ env: E, tutup } = await buatEnv());
  const foto = {};
  for (let i = 0; i < 40; i++) foto["foto" + String(i).padStart(3, "0") + "x"] = `https://img.test/${i}.jpg`;
  E.ASSETS = { fetch: async () => new Response(JSON.stringify(foto), { headers: { "content-type": "application/json" } }) };
  const r = await E.DB.prepare("INSERT INTO akun (surel, nama, peran, status, garam, sandi, iterasi) VALUES ('a@uji.test','a','admin','aktif',?,?,100000)").bind("a".repeat(32), "a".repeat(64)).run();
  const t = acak(32);
  await E.DB.prepare("INSERT INTO sesi (id_hash, akun_id, sampai) VALUES (?,?,?)").bind(await sha(t), r.meta.last_row_id, Math.floor(Date.now() / 1000) + 3600).run();
  cookie = "sesi=" + t;
});
after(async () => { globalThis.fetch = asliFetch; await tutup?.(); });

test("foto: badan >2MB tanpa content-length dibatalkan dan dicache negatif; laju 30/menit pada cache-miss", async () => {
  let dibatalkan = false, dibaca = 0;
  globalThis.fetch = async () => new Response(new ReadableStream({
    pull(c) { dibaca++; c.enqueue(new Uint8Array(1024 * 1024)); },
    cancel() { dibatalkan = true; },
  }), { status: 200, headers: { "content-type": "image/jpeg" } });
  const a = await get("/api/foto-berita/foto000x");
  assert.equal(a.status, 404); assert.equal(a.headers.get("cache-control"), "private, max-age=3600");
  assert.ok(dibatalkan && dibaca <= 4);
  globalThis.fetch = async () => { throw new Error("tidak boleh dipanggil: cache negatif"); };
  assert.equal((await get("/api/foto-berita/foto000x")).status, 404);
  globalThis.fetch = async () => new Response(new Uint8Array([1, 2, 3]), { status: 200, headers: { "content-type": "image/png" } });
  assert.equal((await get("/api/foto-berita/foto001x", "198.51.100.77")).status, 200);
  let kode = 0;
  for (let i = 2; i < 36; i++) kode = (await get("/api/foto-berita/foto" + String(i).padStart(3, "0") + "x", "198.51.100.77")).status;
  assert.equal(kode, 429);
});

test("statistik: halaman hanya jalur dikenal; cari hanya tampil dari >= 3 koneksi; kata baru dibatasi 500/hari", async () => {
  assert.equal(normalisasiHalaman("/o/abc-1"), "/o/abc-1");
  assert.equal(normalisasiHalaman("/wilayah/32"), "/wilayah/32");
  assert.equal(normalisasiHalaman("/Berita/"), "/berita");
  assert.equal(normalisasiHalaman("/sembarang"), null);
  assert.equal(normalisasiHalaman("/wilayah/abc"), null);
  const kirim = (b, ip) => worker.fetch(new Request("https://uji.test/api/statistik", { method: "POST", body: JSON.stringify(b), headers: { origin: "https://uji.test", "cf-connecting-ip": ip, cookie } }), E, ctx);
  await kirim({ jenis: "halaman", kunci: "/sembarang" }, "10.0.0.1");
  assert.equal((await E.DB.prepare("SELECT COUNT(*) n FROM statistik_harian WHERE jenis='halaman'").first()).n, 0);
  for (const ip of ["10.0.0.1", "10.0.0.1", "10.0.0.2"]) await kirim({ jenis: "cari", kunci: "kata langka" }, ip);
  const baca = () => worker.fetch(minta("/api/admin/statistik?hari=1", { cookie }), E, ctx).then((r) => r.json());
  assert.deepEqual((await baca()).cari, []);
  assert.equal((await baca()).harian[0]?.cari ?? 0, 0);
  await kirim({ jenis: "cari", kunci: "kata langka" }, "10.0.0.3");
  const s = await baca();
  assert.equal(s.cari[0].kunci, "kata langka"); assert.equal(s.cari[0].jumlah, 4);
  const tgl = new Date().toISOString().slice(0, 10);
  for (let i = 0; i < 500; i++) await E.DB.prepare("INSERT OR IGNORE INTO statistik_harian (tanggal, jenis, kunci) VALUES (?, 'cari', ?)").bind(tgl, "k" + i).run();
  await kirim({ jenis: "cari", kunci: "kata baru sekali" }, "10.0.0.4");
  assert.equal(await E.DB.prepare("SELECT 1 x FROM statistik_harian WHERE kunci='kata baru sekali'").first(), null);
  await kirim({ jenis: "cari", kunci: "kata langka" }, "10.0.0.5"); // kunci lama tetap dihitung
  assert.equal((await E.DB.prepare("SELECT jumlah FROM statistik_harian WHERE kunci='kata langka'").first()).jumlah, 5);
});

test("jejak: ringkas cadangan tidak membocorkan isi ke mentah", async () => {
  await E.DB.prepare("INSERT INTO jejak (siapa, peran, aksi, tabel, baris_id, ke) VALUES (1,'admin','ubah','entitas','9', ?)").bind(JSON.stringify({ nama: "RAHASIA-XYZ" })).run();
  const t = await (await worker.fetch(minta("/api/admin/jejak?jenis=entitas", { cookie }), E, ctx)).text();
  assert.ok(!t.includes("RAHASIA-XYZ")); assert.ok(t.includes("(rincian disembunyikan)"));
});

test("konten-beranda: query acak tidak membuat kunci cache baru", async () => {
  simpan.clear();
  await get("/api/konten-beranda?a=1"); await get("/api/konten-beranda?b=2");
  assert.equal(simpan.size, 1); assert.ok([...simpan.keys()][0].endsWith("/api/konten-beranda"));
});

test("POWER: bbox 422, pembulatan 0,5, cache, batas laju, hanya dua parameter", async () => {
  simpan.clear();
  let panggilan = [];
  globalThis.fetch = async (u) => { panggilan.push(String(u)); return new Response(JSON.stringify({ properties: { parameter: { ALLSKY_SFC_SW_DWN: { JAN: 4 }, WS50M: { JAN: 3 }, LAIN: { x: 1 } } }, header: { range: "2001-2020" } })); };
  assert.equal((await get("/api/kelayakan/power?lat=60&lon=100")).status, 422);
  assert.equal((await get("/api/kelayakan/power?lat=abc&lon=100")).status, 422);
  assert.equal((await get("/api/kelayakan/power")).status, 422);
  const r = await get("/api/kelayakan/power?lat=-6.26&lon=106.81", "192.0.2.50");
  assert.equal(r.status, 200);
  const b = await r.json();
  assert.deepEqual(Object.keys(b.properties.parameter).sort(), ["ALLSKY_SFC_SW_DWN", "WS50M"]);
  assert.match(panggilan[0], /latitude=-6\.50&.*|longitude=107\.00/);
  assert.match(panggilan[0], /latitude=-6\.50/); assert.match(panggilan[0], /longitude=107\.00/);
  assert.match(r.headers.get("cache-control"), /max-age=2592000/);
  await get("/api/kelayakan/power?lat=-6.4&lon=106.9", "192.0.2.50"); // sel sama setelah pembulatan: dari cache
  assert.equal(panggilan.length, 1);
  let kode = 0;
  for (let i = 0; i < 25; i++) kode = (await get(`/api/kelayakan/power?lat=${-10 + i * 0.5}&lon=100`, "192.0.2.51")).status;
  assert.equal(kode, 429);
});
