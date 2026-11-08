// sesi.js + router (JM-A05, JM-B03) di D1 lokal NYATA (workerd/miniflare via wrangler), bukan mock.
import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import worker from "../src/worker.js";
import * as hak from "../src/hak.js";
import { hashSandi } from "../src/sandi.js";
import { sha, acak } from "../src/util.js";
import { buatEnv, minta, ambilCookie } from "./_bantu.mjs";

let env, tutup;
const SANDI = "sandi-uji-panjang-1";
let n = 0;
const ctx = { waitUntil() {} };
const kirim = (req) => worker.fetch(req, env, ctx);
// IP unik per tes agar batas laju antar tes tidak saling mengganggu.
const ipBaru = () => `198.51.100.${++n}`;

async function buatAkun({ surel, peran = "anggota", status = "aktif", wajib_ganti = 0, sandi = SANDI, aktivasi } = {}) {
  surel ??= `u${++n}@contoh.id`;
  const h = status === "menunggu" ? {} : await hashSandi(sandi);
  const cakupan = peran === "wilayah" ? "32" : null;
  await env.DB.prepare(
    "INSERT INTO akun (surel, nama, peran, cakupan_prov, status, garam, sandi, iterasi, wajib_ganti, aktivasi_hash, aktivasi_sampai) VALUES (?,?,?,?,?,?,?,?,?,?,?)")
    .bind(surel, "Nama Uji", peran, cakupan, status, h.garam ?? null, h.hash ?? null, h.iterasi ?? null, wajib_ganti, aktivasi?.hash ?? null, aktivasi?.sampai ?? null).run();
  return surel;
}
const masuk = (surel, sandi = SANDI, o = {}) => kirim(minta("/api/masuk", { metode: "POST", badan: { surel, sandi }, ip: ipBaru(), ...o }));
async function login(surel, o) {
  const r = await masuk(surel, SANDI, o);
  assert.equal(r.status, 200);
  return ambilCookie(r);
}

before(async () => { ({ env, tutup } = await buatEnv()); });
after(async () => { await tutup(); });

test("R1 masuk benar: cookie HttpOnly/Secure/SameSite=Lax/Path=/14 hari; D1 hanya simpan hash token", async () => {
  const surel = await buatAkun({ peran: "kurator" });
  const r = await masuk(surel);
  assert.equal(r.status, 200);
  const j = await r.json();
  assert.deepEqual(Object.keys(j).sort(), ["bahasa", "nama", "peran", "wajib_ganti"]);
  assert.equal(j.peran, "kurator");
  const sc = r.headers.get("set-cookie");
  assert.match(sc, /^sesi=[0-9a-f]{64}; /);
  for (const bagian of ["HttpOnly", "Secure", "SameSite=Lax", "Path=/", "Max-Age=1209600"]) assert.ok(sc.includes(bagian), bagian);
});

test("R1b token mentah tidak ada di D1, hash SHA-256-nya ada", async () => {
  const surel = await buatAkun();
  const c = await login(surel);
  const token = c.split("=")[1];
  const baris = await env.DB.prepare("SELECT id_hash FROM sesi WHERE id_hash = ?").bind(await sha(token)).first();
  assert.ok(baris);
  assert.equal(await env.DB.prepare("SELECT 1 FROM sesi WHERE id_hash = ?").bind(token).first(), null);
});

test("R2 pesan seragam: sandi salah, surel tak dikenal, akun menunggu, nonaktif", async () => {
  const ada = await buatAkun(), menunggu = await buatAkun({ status: "menunggu" });
  const non = await buatAkun({ status: "nonaktif" });
  const hasil = [];
  for (const [s, p] of [[ada, "salah-salah-salah"], ["tidak.ada@contoh.id", SANDI], [menunggu, SANDI], [non, SANDI]]) {
    const r = await masuk(s, p);
    hasil.push([r.status, await r.text()]);
  }
  for (const h of hasil) assert.deepEqual(h, hasil[0]);
  assert.equal(hasil[0][0], 401);
  assert.deepEqual(JSON.parse(hasil[0][1]), { galat: "Surel atau sandi salah.", kode: "masuk_gagal" });
});

test("R3a laju per IP: percobaan ke-11 dari satu IP = 429", async () => {
  const ip = ipBaru();
  const kode = [];
  for (let i = 0; i < 11; i++) kode.push((await kirim(minta("/api/masuk", { metode: "POST", badan: { surel: `acak${i}@contoh.id`, sandi: "x" }, ip }))).status);
  assert.deepEqual(kode.slice(0, 10), Array(10).fill(401));
  assert.equal(kode[10], 429);
});

test("R3b laju per surel: 11 percobaan dari IP berbeda = 429; sandi benar pun ditahan", async () => {
  const surel = await buatAkun();
  const kode = [];
  for (let i = 0; i < 11; i++) kode.push((await masuk(surel, "salah-salah-salah")).status);
  assert.equal(kode[10], 429);
  assert.equal((await masuk(surel)).status, 429);
});

test("R3c gagal masuk dijejak paling banyak sekali per menit per IP, tanpa id akun", async () => {
  const ip = ipBaru();
  const sebelum = (await env.DB.prepare("SELECT count(*) n FROM jejak WHERE aksi='masuk-gagal'").first()).n;
  for (let i = 0; i < 5; i++) await kirim(minta("/api/masuk", { metode: "POST", badan: { surel: "x@contoh.id", sandi: "y" }, ip }));
  const sesudah = await env.DB.prepare("SELECT count(*) n, count(siapa) s FROM jejak WHERE aksi='masuk-gagal'").first();
  assert.equal(sesudah.n - sebelum, 1);
  assert.equal(sesudah.s, 0);
});

test("R4 CSRF: Origin asing, tanpa x-pb, Sec-Fetch-Site lintas situs, tanpa Origin = ditolak", async () => {
  const surel = await buatAkun();
  const coba = (o) => kirim(minta("/api/masuk", { metode: "POST", badan: { surel, sandi: SANDI }, ip: ipBaru(), ...o }));
  assert.equal((await coba({ origin: "https://jahat.example" })).status, 403);
  assert.equal((await coba({ origin: "null" })).status, 403);
  assert.equal((await coba({ origin: null })).status, 403);
  assert.equal((await coba({ header: { "x-pb": "0" } })).status, 403);
  assert.equal((await coba({ header: { "sec-fetch-site": "cross-site" } })).status, 403);
  assert.equal((await coba({ header: { "sec-fetch-site": "same-site" } })).status, 403);
  assert.equal((await coba({ origin: null, header: { "sec-fetch-site": "same-origin" } })).status, 200);
  assert.equal((await coba({})).status, 200);
  const dilarang = await (await coba({ origin: "https://jahat.example" })).json();
  assert.equal(dilarang.kode, "dilarang");
});

test("R4b CSRF juga di keluar dan ganti-sandi; GET tidak menulis apa pun", async () => {
  const c = await login(await buatAkun());
  assert.equal((await kirim(minta("/api/keluar", { metode: "POST", cookie: c, origin: "https://jahat.example" }))).status, 403);
  assert.equal((await kirim(minta("/api/saya", { cookie: c, origin: "https://jahat.example" }))).status, 200);
  assert.equal((await kirim(minta("/api/keluar", { cookie: c }))).status, 405);
});

test("R5 batas laju atomik: 20 catatLaju paralel tepat 1..20", async () => {
  const hasil = await Promise.all(Array.from({ length: 20 }, () => hak.catatLaju(env, "masuk-ip:uji-paralel", 900)));
  assert.deepEqual(hasil.sort((a, b) => a - b), Array.from({ length: 20 }, (_, i) => i + 1));
});

test("R6 GET /api/saya: tamu, masuk, tanpa surel, no-store + Vary Cookie", async () => {
  const t = await kirim(minta("/api/saya"));
  assert.deepEqual(await t.json(), { masuk: false });
  assert.match(t.headers.get("cache-control"), /no-store/);
  const surel = await buatAkun({ peran: "wilayah" });
  const c = await login(surel);
  const r = await kirim(minta("/api/saya", { cookie: c }));
  const j = await r.json();
  assert.deepEqual(j, { masuk: true, peran: "wilayah", nama: "Nama Uji", bahasa: "id", cakupan_prov: "32", super: false, wajib_ganti: false, wilayah_kode: null });
  assert.equal(r.headers.get("cache-control"), "private, no-store");
  assert.equal(r.headers.get("vary"), "Cookie");
  assert.ok(!JSON.stringify(j).includes("@"));
  assert.equal(r.headers.get("x-content-type-options"), "nosniff");
});

test("R7 keluar: hapus baris sesi, cookie dihapus, saya jadi tamu; tamu keluar = 401", async () => {
  const c = await login(await buatAkun());
  const r = await kirim(minta("/api/keluar", { metode: "POST", cookie: c }));
  assert.equal(r.status, 200);
  assert.match(r.headers.get("set-cookie"), /Max-Age=0/);
  assert.equal(await env.DB.prepare("SELECT 1 FROM sesi WHERE id_hash = ?").bind(await sha(c.split("=")[1])).first(), null);
  assert.deepEqual(await (await kirim(minta("/api/saya", { cookie: c }))).json(), { masuk: false });
  assert.equal((await kirim(minta("/api/keluar", { metode: "POST" }))).status, 401);
});

test("R8 sesi kedaluwarsa dan akun dinonaktifkan = tamu (tidak fail-open)", async () => {
  const s1 = await buatAkun(), s2 = await buatAkun({ peran: "pengurus" });
  const c1 = await login(s1), c2 = await login(s2);
  await env.DB.prepare("UPDATE sesi SET dibuat = 1, sampai = 2 WHERE id_hash = ?").bind(await sha(c1.split("=")[1])).run();
  await env.DB.prepare("UPDATE akun SET status = 'nonaktif' WHERE surel = ?").bind(s2).run();
  assert.deepEqual(await (await kirim(minta("/api/saya", { cookie: c1 }))).json(), { masuk: false });
  assert.deepEqual(await (await kirim(minta("/api/saya", { cookie: c2 }))).json(), { masuk: false });
  assert.deepEqual(await (await kirim(minta("/api/saya", { cookie: "sesi=bukan-token" }))).json(), { masuk: false });
});

test("R9 aktivasi: sekali pakai; kedaluwarsa dan sandi pendek ditolak; akun lalu bisa masuk", async () => {
  const token = acak(32), sekarang = Math.floor(Date.now() / 1000);
  const surel = await buatAkun({ status: "menunggu", aktivasi: { hash: await sha(token), sampai: sekarang + 72 * 3600 } });
  const aktif = (b, ip = ipBaru()) => kirim(minta("/api/aktivasi", { metode: "POST", badan: b, ip }));
  assert.equal((await aktif({ token, sandi: "pendek" })).status, 422);              // tidak menghabiskan tautan
  assert.equal((await aktif({ token: "zz", sandi: SANDI })).status, 422);
  assert.equal((await aktif({ token, sandi: SANDI })).status, 200);
  assert.equal((await aktif({ token, sandi: SANDI })).status, 422);                  // sekali pakai
  const a = await env.DB.prepare("SELECT status, aktivasi_hash, iterasi FROM akun WHERE surel = ?").bind(surel).first();
  assert.equal(a.status, "aktif");
  assert.equal(a.aktivasi_hash, null);
  assert.ok(a.iterasi >= 100000);
  assert.equal((await masuk(surel)).status, 200);

  const t2 = acak(32);
  await buatAkun({ status: "menunggu", aktivasi: { hash: await sha(t2), sampai: sekarang - 1 } });
  assert.equal((await aktif({ token: t2, sandi: SANDI })).status, 422);              // kedaluwarsa
});

test("R9b aktivasi dibatasi 10 per jam per IP", async () => {
  const ip = ipBaru(), kode = [];
  for (let i = 0; i < 11; i++) kode.push((await kirim(minta("/api/aktivasi", { metode: "POST", badan: { token: acak(32), sandi: SANDI }, ip }))).status);
  assert.equal(kode[10], 429);
});

test("R10 ganti-sandi: lama salah 401; benar mengganti dan mencabut sesi lain, sesi ini tetap", async () => {
  const surel = await buatAkun();
  const c1 = await login(surel), c2 = await login(surel);
  const baru = "sandi-baru-panjang-2";
  const g = (b) => kirim(minta("/api/ganti-sandi", { metode: "POST", cookie: c1, badan: b }));
  assert.equal((await g({ lama: "salah-salah-salah", baru })).status, 401);
  assert.equal((await g({ lama: SANDI, baru: "pendek" })).status, 422);
  assert.equal((await g({ lama: SANDI, baru: surel })).status, 422);
  assert.equal((await g({ lama: SANDI, baru })).status, 200);
  assert.equal((await (await kirim(minta("/api/saya", { cookie: c1 }))).json()).masuk, true);
  assert.equal((await (await kirim(minta("/api/saya", { cookie: c2 }))).json()).masuk, false);
  assert.equal((await masuk(surel, SANDI)).status, 401);
  assert.equal((await masuk(surel, baru)).status, 200);
  assert.equal((await kirim(minta("/api/ganti-sandi", { metode: "POST", badan: { lama: SANDI, baru } }))).status, 401);
});

test("R11 wajib_ganti: hanya ganti-sandi, keluar, saya, status yang jalan", async () => {
  const surel = await buatAkun({ wajib_ganti: 1, peran: "admin" });
  const c = await login(surel);
  assert.equal((await kirim(minta("/api/saya", { cookie: c }))).status, 200);
  assert.equal((await kirim(minta("/api/admin/akun", { cookie: c }))).status, 403);
  assert.equal((await kirim(minta("/api/ganti-sandi", { metode: "POST", cookie: c, badan: { lama: SANDI, baru: "sandi-baru-panjang-3" } }))).status, 200);
  assert.equal((await kirim(minta("/api/admin/akun", { cookie: c }))).status === 403, false);
});

test("R12 halaman terkunci: tamu 302 ke /masuk?ke=, peran salah 403, peran benar lolos, .html langsung 404, no-store", async () => {
  const t = await kirim(minta("/direktori"));
  assert.equal(t.status, 302);
  assert.equal(t.headers.get("location"), "/masuk?ke=%2Fdirektori");
  const ta = await kirim(minta("/admin/akun"));
  assert.equal(ta.status, 302);
  assert.equal(ta.headers.get("location"), "/masuk?ke=%2Fadmin%2Fakun");
  const ang = await login(await buatAkun({ peran: "anggota" }));
  assert.equal((await kirim(minta("/direktori", { cookie: ang }))).status, 200);
  const adm = await kirim(minta("/admin", { cookie: ang }));
  assert.equal(adm.status, 403);
  assert.match(adm.headers.get("cache-control"), /no-store/);
  const kur = await login(await buatAkun({ peran: "admin" })); // /admin hanya admin/super: Keputusan pemilik 7 Nov 2026
  assert.equal((await kirim(minta("/admin", { cookie: await login(await buatAkun({ peran: "pengurus" })) }))).status, 403);
  const ok = await kirim(minta("/admin", { cookie: kur }));
  assert.equal(ok.status, 200);
  assert.equal(ok.headers.get("cache-control"), "private, no-store");
  assert.equal(ok.headers.get("vary"), "Cookie");
  assert.equal((await kirim(minta("/direktori.html", { cookie: ang }))).status, 404);
  assert.equal((await kirim(minta("/admin.html", { cookie: kur }))).status, 404);
});

test("R13 halaman dinamis: slug dan kode provinsi divalidasi, halaman publik lewat aset", async () => {
  const c = await login(await buatAkun({ peran: "anggota" }));
  assert.equal((await kirim(minta("/p/Bukan Slug!", { cookie: c }))).status, 404);
  assert.equal((await kirim(minta("/wilayah/3", { cookie: c }))).status, 404);
  assert.equal((await kirim(minta("/wilayah/32", { cookie: c }))).status, 200);
  assert.equal((await kirim(minta("/bidang/bukan", { cookie: c }))).status, 404);
  assert.equal((await kirim(minta("/bidang/advokasi", { cookie: c }))).status, 200);
  assert.equal((await kirim(minta("/", { cookie: c }))).status, 200);
});

test("R15 seluruh situs di balik login: tamu 302/401, alur masuk dan aset login 200, token ICS", async () => {
  for (const j of ["/", "/data/proyek.json", "/o/x", "/geo/x.json", "/sitemap.xml", "/kalender", "/teknologi/surya"]) {
    const r = await kirim(minta(j));
    assert.equal(r.status, 302, j);
    assert.equal(r.headers.get("location"), "/masuk?ke=" + encodeURIComponent(j));
    assert.match(r.headers.get("cache-control"), /no-store/);
    assert.equal(r.headers.get("vary"), "Cookie");
  }
  assert.equal((await kirim(minta("/kalender.ics"))).status, 401);
  assert.equal((await kirim(minta("/kalender.ics?t=1." + "0".repeat(64)))).status, 401);
  for (const j of ["/masuk", "/aktivasi", "/ganti-sandi", "/inti/kepala.css", "/i18n/id.json", "/img/logo-meti.png", "/fonts/inter-400.woff2", "/masuk.js", "/robots.txt", "/api/status"]) {
    assert.equal((await kirim(minta(j))).status, 200, j);
  }
  for (const [m, j] of [["POST", "/api/koreksi"], ["POST", "/api/statistik"], ["GET", "/api/konten-beranda"], ["GET", "/api/foto-berita/abcdef"], ["GET", "/api/kelayakan/power"], ["GET", "/api/kalender/tautan"]]) {
    assert.equal((await kirim(minta(j, { metode: m, badan: m === "POST" ? {} : undefined }))).status, 401, j);
  }
  const c = await login(await buatAkun({ peran: "anggota" }));
  assert.equal((await kirim(minta("/data/proyek.json", { cookie: c }))).status, 200);
  const tl = await (await kirim(minta("/api/kalender/tautan", { cookie: c }))).json();
  const u = new URL(tl.url);
  const ics = await kirim(minta("/kalender.ics" + u.search));
  assert.equal(ics.status, 200);
  assert.match(ics.headers.get("cache-control"), /no-store/);
  assert.equal((await kirim(minta("/kalender.ics?t=" + u.searchParams.get("t").slice(0, -1) + "0"))).status, 401);
});

test("R14 galat: JSON rusak 422, bukan JSON 415, terlalu besar 413, metode 405, jalur 404; tanpa jejak tumpukan", async () => {
  const ip = ipBaru();
  const mentah = (badan, tipe = "application/json") => kirim(new Request("https://uji.test/api/masuk", { method: "POST", body: badan,
    headers: { "content-type": tipe, origin: "https://uji.test", "x-pb": "1", "cf-connecting-ip": ip } }));
  const a = await mentah("{rusak");
  assert.equal(a.status, 422);
  assert.deepEqual(Object.keys(await a.json()).sort(), ["galat", "kode"]);
  assert.equal((await mentah("{}", "text/plain")).status, 415);
  assert.equal((await mentah(JSON.stringify({ surel: "a@b.id", sandi: "x".repeat(70000) }))).status, 413);
  assert.equal((await mentah("[]")).status, 422);
  assert.equal((await kirim(minta("/api/masuk"))).status, 405);
  const nf = await kirim(minta("/api/tidak-ada"));
  assert.equal(nf.status, 404);
  assert.equal((await nf.json()).kode, "tidak_ditemukan");
});

test("R15 GET /api/status: db ok, tanpa cache", async () => {
  const r = await kirim(minta("/api/status"));
  assert.equal(r.status, 200);
  const j = await r.json();
  assert.equal(j.db, "ok");
  assert.match(r.headers.get("cache-control"), /no-store/);
});

test("R16 surel tidak sensitif huruf besar-kecil dan dipangkas", async () => {
  const surel = await buatAkun({ surel: "campur.Huruf@contoh.id" });
  assert.equal((await masuk("  CAMPUR.huruf@Contoh.ID ")).status, 200);
  assert.ok(surel);
});
