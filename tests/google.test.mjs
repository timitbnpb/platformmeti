// Masuk dengan Google: D1 lokal nyata; Google ditiru (fetch global) dengan kunci RSA uji.
import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import worker from "../src/worker.js";
import { buatEnv, minta, ambilCookie } from "./_bantu.mjs";

let env, tutup, n = 0;
const ctx = { waitUntil() {} };
const CID = "klien-uji.apps.googleusercontent.com";
const b64u = (b) => Buffer.from(b).toString("base64url");
const kirim = (req) => worker.fetch(req, env, ctx);
let pasangan, jwk, idTokenBerikut;

const buatToken = async (klaim, kid = "k1", kunci = pasangan.privateKey) => {
  const sekarang = Math.floor(Date.now() / 1000);
  const isi = { iss: "https://accounts.google.com", aud: CID, exp: sekarang + 300, email_verified: true, ...klaim };
  const ttd = `${b64u(JSON.stringify({ alg: "RS256", kid }))}.${b64u(JSON.stringify(isi))}`;
  return `${ttd}.${b64u(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", kunci, new TextEncoder().encode(ttd)))}`;
};
const akun = async (surel, status = "aktif") => {
  await env.DB.prepare("INSERT INTO akun (surel, nama, peran, status, garam, sandi, iterasi) VALUES (?,?,?,?,?,?,?)")
    .bind(surel, "Uji", "anggota", status, "a".repeat(32), "b".repeat(64), 100000).run();
};
// Jalankan alur penuh; ubah(klaim, parameter) menyesuaikan id_token / state.
async function alur({ surel, sub = "sub-" + ++n, klaim = {}, state, ke, kid, kunci, tanpaKuki } = {}) {
  const ip = `198.51.100.${++n}`;
  const m = await kirim(minta("/api/masuk/google" + (ke ? "?ke=" + encodeURIComponent(ke) : ""), { ip }));
  assert.equal(m.status, 302);
  const tujuan = new URL(m.headers.get("location"));
  const kuki = ambilCookie(m, "google_oidc");
  const sc = m.headers.get("set-cookie");
  for (const b of ["HttpOnly", "Secure", "SameSite=Lax", "Max-Age=600"]) assert.ok(sc.includes(b), b);
  assert.equal(tujuan.origin + tujuan.pathname, "https://accounts.google.com/o/oauth2/v2/auth");
  assert.equal(tujuan.searchParams.get("code_challenge_method"), "S256");
  const nonce = tujuan.searchParams.get("nonce");
  idTokenBerikut = await buatToken({ sub, email: surel, nonce, ...klaim }, kid, kunci);
  const k = await kirim(minta(`/api/masuk/google/kembali?code=abc&state=${state ?? tujuan.searchParams.get("state")}`, { ip, cookie: tanpaKuki ? undefined : kuki }));
  return k;
}

before(async () => {
  ({ env, tutup } = await buatEnv({ tambahan: { GOOGLE_CLIENT_ID: CID, GOOGLE_CLIENT_SECRET: "rahasia-uji" } }));
  pasangan = await crypto.subtle.generateKey({ name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" }, true, ["sign", "verify"]);
  jwk = { ...(await crypto.subtle.exportKey("jwk", pasangan.publicKey)), kid: "k1" };
  globalThis.fetch = async (u, o) => {
    const url = String(u?.url ?? u);
    if (url === "https://www.googleapis.com/oauth2/v3/certs") return Response.json({ keys: [jwk] });
    if (url === "https://oauth2.googleapis.com/token") {
      assert.equal(new URLSearchParams(o.body).get("client_secret"), "rahasia-uji");
      assert.ok(new URLSearchParams(o.body).get("code_verifier"));
      return Response.json({ id_token: idTokenBerikut });
    }
    throw new Error("fetch tak terduga " + url);
  };
});
after(async () => { await tutup(); });

const galatDi = (r, kode) => { assert.equal(r.status, 302); assert.ok(r.headers.get("location").startsWith("/masuk?galat=" + kode), r.headers.get("location")); assert.equal(ambilCookie(r), null); };

test("G1 tanpa secret: rute 503 dan status google=false", async () => {
  const e2 = { ...env, GOOGLE_CLIENT_ID: undefined };
  const r = await worker.fetch(minta("/api/masuk/google"), e2, ctx);
  assert.equal(r.status, 503);
  assert.equal((await (await worker.fetch(minta("/api/status"), e2, ctx)).json()).google, false);
  assert.equal((await (await kirim(minta("/api/status"))).json()).google, true);
});

test("G2 akun aktif berhasil: sesi dibuat, jejak masuk lewat sesi_google, sub tertaut", async () => {
  await akun("ada@contoh.id");
  const r = await alur({ surel: "Ada@Contoh.id", sub: "sub-ada", ke: "/peta" });
  assert.equal(r.status, 302);
  assert.equal(r.headers.get("location"), "/peta");
  assert.match(ambilCookie(r), /^sesi=[0-9a-f]{64}$/);
  assert.ok(await env.DB.prepare("SELECT 1 FROM jejak WHERE aksi='masuk' AND tabel='sesi_google'").first());
  assert.equal((await env.DB.prepare("SELECT sub FROM akun_google").first()).sub, "sub-ada");
});

test("G3 sub sudah tertaut: surel Google lain tidak membajak; surel akun lain ditolak", async () => {
  await akun("korban@contoh.id");
  // sub-ada tertaut ke ada@; dipakai sub baru untuk ada@ -> ditolak (sudah tertaut sub lain)
  galatDi(await alur({ surel: "ada@contoh.id", sub: "sub-penyerang" }), "google_tidak_terdaftar");
  // sub-ada dengan surel korban -> tetap akun ada@ (bukan korban)
  const r = await alur({ surel: "korban@contoh.id", sub: "sub-ada" });
  assert.equal(r.status, 302);
  const s = await env.DB.prepare("SELECT akun_id FROM sesi ORDER BY dibuat DESC, rowid DESC LIMIT 1").first();
  assert.equal((await env.DB.prepare("SELECT surel FROM akun WHERE id=?").bind(s.akun_id).first()).surel, "ada@contoh.id");
});

test("G4 akun tidak ada / menunggu / nonaktif", async () => {
  galatDi(await alur({ surel: "tidak-ada@contoh.id" }), "google_tidak_terdaftar");
  await akun("tunggu@contoh.id", "menunggu"); await akun("non@contoh.id", "nonaktif");
  galatDi(await alur({ surel: "tunggu@contoh.id" }), "google_menunggu");
  galatDi(await alur({ surel: "non@contoh.id" }), "google_nonaktif");
  assert.equal(await env.DB.prepare("SELECT 1 FROM akun WHERE surel='tidak-ada@contoh.id'").first(), null);
});

test("G5 state salah, tanpa kuki, nonce salah, aud salah, kedaluwarsa, email belum terverifikasi, tanda tangan salah", async () => {
  await akun("v@contoh.id");
  galatDi(await alur({ surel: "v@contoh.id", state: "salah" }), "google_gagal");
  galatDi(await alur({ surel: "v@contoh.id", tanpaKuki: true }), "google_gagal");
  galatDi(await alur({ surel: "v@contoh.id", klaim: { nonce: "lain" } }), "google_gagal");
  galatDi(await alur({ surel: "v@contoh.id", klaim: { aud: "klien-lain" } }), "google_gagal");
  galatDi(await alur({ surel: "v@contoh.id", klaim: { exp: Math.floor(Date.now() / 1000) - 10 } }), "google_gagal");
  galatDi(await alur({ surel: "v@contoh.id", klaim: { email_verified: false } }), "google_gagal");
  galatDi(await alur({ surel: "v@contoh.id", klaim: { iss: "https://jahat.example" } }), "google_gagal");
  const lain = await crypto.subtle.generateKey({ name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" }, true, ["sign", "verify"]);
  galatDi(await alur({ surel: "v@contoh.id", kunci: lain.privateKey }), "google_gagal");
});

test("G6 kuki dirusak ditolak; ke= eksternal jatuh ke /", async () => {
  await akun("e@contoh.id");
  const m = await kirim(minta("/api/masuk/google?ke=" + encodeURIComponent("//jahat.example/x"), { ip: "198.51.100.200" }));
  const kuki = ambilCookie(m, "google_oidc");
  const tujuan = new URL(m.headers.get("location"));
  idTokenBerikut = await buatToken({ sub: "sub-e", email: "e@contoh.id", nonce: tujuan.searchParams.get("nonce") });
  const rusak = kuki.slice(0, -2) + "xx";
  galatDi(await kirim(minta(`/api/masuk/google/kembali?code=a&state=${tujuan.searchParams.get("state")}`, { ip: "198.51.100.200", cookie: rusak })), "google_gagal");
  const ok = await kirim(minta(`/api/masuk/google/kembali?code=a&state=${tujuan.searchParams.get("state")}`, { ip: "198.51.100.200", cookie: kuki }));
  assert.equal(ok.headers.get("location"), "/");
});
