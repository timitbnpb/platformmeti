// sosmed.test.mjs: feed media sosial METI. D1 lokal NYATA lewat worker.fetch; hanya fetch keluar (YouTube RSS, Meta Graph) dan R2 yang ditiru.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { buatEnv } from "./_bantu.mjs";
import worker from "../src/worker.js";
import { perbaruiSosmed, uraiYoutube, uraiLinkedin } from "../src/sosmed.js";
import * as hak from "../src/hak.js";
import { sha } from "../src/util.js";

const RSS = `<feed><entry><yt:videoId>abcdefghijk</yt:videoId><title>Munas &amp; Diskusi</title><published>2026-11-01T03:00:00+00:00</published></entry>
<entry><yt:videoId>bukan-valid!</yt:videoId><title>x</title><published>2026-11-02T03:00:00+00:00</published></entry></feed>`;
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);
const BERKAS = new Map();
const R2 = { put: async (k, v) => { BERKAS.set(k, v); }, get: async (k) => (BERKAS.has(k) ? { body: "x", httpMetadata: { contentType: "image/jpeg" } } : null), delete: async (k) => { BERKAS.delete(k); } };
let E, tutup, fetchAsli, urlDipanggil;
const COOKIE = {};

before(async () => {
  ({ env: E, tutup } = await buatEnv());
  E.BERKAS = R2;
  for (const [i, peran] of ["anggota", "admin"].entries()) {
    const r = await E.DB.prepare("INSERT INTO akun (surel, nama, peran, status, garam, sandi, iterasi) VALUES (?,?,?, 'aktif', ?, ?, 100000)").bind(`${peran}@uji.test`, peran, peran, "a".repeat(32), "a".repeat(64)).run();
    const token = (i + 3).toString(16).repeat(64);
    await hak.catatSesi(E, { idHash: await sha(token), akunId: r.meta.last_row_id, peran, sampai: Math.floor(Date.now() / 1000) + 3600, ipHash: "h" });
    COOKIE[peran] = `sesi=${token}`;
  }
  fetchAsli = globalThis.fetch;
  globalThis.fetch = async (u) => {
    u = String(u); urlDipanggil.push(u);
    if (u.includes("youtube.com/feeds")) return new Response(RSS);
    if (u.includes("graph.facebook.com") && u.includes("/media?")) return Response.json({ data: [{ id: "17", caption: "Halo  IG", media_type: "IMAGE", media_url: "https://cdn.test/a.jpg", permalink: "https://www.instagram.com/p/AAA/", timestamp: "2026-11-05T01:00:00+0000" }] });
    if (u.includes("graph.facebook.com") && u.includes("/posts?")) return Response.json({ data: [{ id: "9_9", message: "Halo FB", full_picture: "https://cdn.test/b.jpg", permalink_url: "https://www.facebook.com/9/posts/9", created_time: "2026-11-04T01:00:00+0000" }] });
    if (u.startsWith("https://cdn.test/")) return new Response(JPEG, { headers: { "content-type": "image/jpeg" } });
    return new Response("", { status: 404 });
  };
});
after(async () => { globalThis.fetch = fetchAsli; await tutup?.(); });
const panggil = (metode, jalur, peran, badan) => worker.fetch(new Request("https://uji.test" + jalur, { method: metode, headers: { origin: "https://uji.test", "cf-connecting-ip": "203.0.113.7", ...(peran ? { cookie: COOKIE[peran] } : {}), ...(metode !== "GET" ? { "x-pb": "1", "content-type": "application/json" } : {}) }, body: badan ? JSON.stringify(badan) : undefined }), E, { waitUntil() {} });

test("RSS YouTube: judul didekode, id tak sah dibuang", () => {
  const b = uraiYoutube(RSS);
  assert.deepEqual(b.map((x) => [x.uid, x.judul, x.tanggal]), [["abcdefghijk", "Munas & Diskusi", "2026-11-01"]]);
});

test("cron tanpa secret Meta: YouTube tersimpan, Instagram/Facebook 'belum tersambung', tanpa galat dan tanpa panggilan Graph", async () => {
  urlDipanggil = [];
  const h = await perbaruiSosmed(E);
  assert.equal(h.youtube, 1);
  assert.equal(h.instagram, "belum tersambung");
  assert.ok(!urlDipanggil.some((u) => u.includes("graph.facebook.com")));
  const d = await (await panggil("GET", "/api/sosmed/feed", "anggota")).json();
  assert.equal(d.meta, false, JSON.stringify(d));
  assert.deepEqual(d.baris.map((x) => x.platform), ["youtube"]);
});

test("cron dengan secret Meta: kiriman + gambar tersalin ke R2, berulang tidak menggandakan", async () => {
  Object.assign(E, { META_TOKEN: "TOKEN-UJI", IG_USER_ID: "111", FB_PAGE_ID: "222" });
  await perbaruiSosmed(E);
  const h = await perbaruiSosmed(E);
  assert.equal(h.instagram, 1); assert.equal(h.facebook, 1);
  assert.equal(BERKAS.size, 2);
  const d = await (await panggil("GET", "/api/sosmed/feed", "anggota")).json();
  assert.equal(d.baris.length, 3);
  assert.ok(!JSON.stringify(d).includes("TOKEN-UJI"));
  const ig = d.baris.find((x) => x.platform === "instagram");
  assert.equal(ig.judul, "Halo IG");
  assert.match(ig.gambar, /^sosmed\/instagram-[0-9a-f]{16}\.jpg$/);
  assert.equal((await panggil("GET", "/api/sosmed/gambar?k=" + encodeURIComponent(ig.gambar), "anggota")).status, 200);
  assert.equal((await panggil("GET", "/api/sosmed/gambar?k=../x", "anggota")).status, 404);
});

test("tamu 401; LinkedIn: anggota 403, admin tambah/hapus, URL asing 422", async () => {
  assert.equal((await panggil("GET", "/api/sosmed/feed")).status, 401);
  const url = "https://www.linkedin.com/posts/meti_ires-contoh-activity-7123456789012345678-AbCd?utm_source=x";
  const b = { url, judul: "Kiriman LinkedIn", tanggal: "2026-11-06" };
  assert.equal((await panggil("POST", "/api/admin/sosmed-linkedin", "anggota", b)).status, 403);
  assert.equal((await panggil("POST", "/api/admin/sosmed-linkedin", "admin", { ...b, url: "https://evil.test/activity-7123456789012345678" })).status, 422);
  assert.equal((await panggil("POST", "/api/admin/sosmed-linkedin", "admin", b)).status, 201);
  let d = await (await panggil("GET", "/api/sosmed/feed", "anggota")).json();
  assert.equal(d.baris.find((x) => x.platform === "linkedin").uid, "7123456789012345678");
  await perbaruiSosmed(E); // cron tidak menyentuh linkedin
  assert.equal((await panggil("POST", "/api/admin/sosmed-linkedin-hapus", "admin", { uid: "7123456789012345678" })).status, 200);
  d = await (await panggil("GET", "/api/sosmed/feed", "anggota")).json();
  assert.ok(!d.baris.some((x) => x.platform === "linkedin"));
});

test("uraiLinkedin menolak host lain dan URN tanpa id", () => {
  assert.equal(uraiLinkedin("https://www.linkedin.com/feed/update/urn:li:activity:7123456789012345678/").uid, "7123456789012345678");
  assert.equal(uraiLinkedin("https://linkedin.com.evil.test/posts/x-activity-7123456789012345678"), null);
  assert.equal(uraiLinkedin("https://www.linkedin.com/posts/tanpa-id"), null);
});
