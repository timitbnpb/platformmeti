// google.js: Masuk dengan Google (OpenID Connect, Authorization Code + PKCE + state + nonce). WebCrypto saja.
// Hanya akun yang SUDAH ADA dan aktif; tidak pernah membuat akun. Tanpa GOOGLE_CLIENT_ID/SECRET: 503.
import * as hak from "./hak.js";
import { acak, gagal, ipHash, jalurAman, sha, samaTetap } from "./util.js";
import { infoSesi } from "./ua.js";

const UMUR = 14 * 86400, TTL = 600, BATAS = 10, JENDELA = 900;
const KUKI = "google_oidc", JALUR_KUKI = "/api/masuk/google";
const AUTH = "https://accounts.google.com/o/oauth2/v2/auth", TOKEN = "https://oauth2.googleapis.com/token", JWKS = "https://www.googleapis.com/oauth2/v3/certs";
const enc = new TextEncoder();
const b64u = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const dari64u = (s) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
const aktif = (env) => !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.IP_SALT);
export const googleAktif = aktif;

const kunciHmac = (env) => crypto.subtle.importKey("raw", enc.encode("google-oidc|" + env.IP_SALT + "|" + env.GOOGLE_CLIENT_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
const tandai = async (env, isi) => b64u(await crypto.subtle.sign("HMAC", await kunciHmac(env), enc.encode(isi)));
const kukiSet = (nilai, umur) => `${KUKI}=${nilai}; HttpOnly; Secure; SameSite=Lax; Path=${JALUR_KUKI}; Max-Age=${umur}`;
const alih = (ke, ...kuki) => {
  const h = new Headers({ location: ke, "cache-control": "private, no-store" });
  for (const k of kuki) h.append("set-cookie", k);
  return new Response(null, { status: 302, headers: h });
};
const galat = (kode, ke) => alih(`/masuk?galat=${kode}` + (ke && ke !== "/" ? "&ke=" + encodeURIComponent(ke) : ""), kukiSet("", 0));
const redirectUri = (url) => `https://${url.host}${JALUR_KUKI}/kembali`;

async function mulai(req, env) {
  if (!aktif(env)) return gagal("layanan");
  const url = new URL(req.url);
  const ip = await ipHash(env, req);
  if ((await hak.catatLaju(env, `masuk-ip:g${ip}`, JENDELA)) > BATAS) return gagal("laju_terlampaui", 429, { "retry-after": String(JENDELA) });
  const state = acak(16), nonce = acak(16), verifier = acak(32);
  const keParam = url.searchParams.get("ke"), ke = keParam === null ? "/saya" : jalurAman(keParam); // tanpa tujuan: METI untuk saya (sejalan masuk.js)
  const isi = b64u(enc.encode(JSON.stringify({ s: state, n: nonce, v: verifier, k: ke, e: Math.floor(Date.now() / 1000) + TTL })));
  const challenge = b64u(await crypto.subtle.digest("SHA-256", enc.encode(verifier)));
  const q = new URLSearchParams({ client_id: env.GOOGLE_CLIENT_ID, redirect_uri: redirectUri(url), response_type: "code", scope: "openid email profile",
    state, nonce, code_challenge: challenge, code_challenge_method: "S256", prompt: "select_account" });
  return alih(`${AUTH}?${q}`, kukiSet(`${isi}.${await tandai(env, isi)}`, TTL));
}

// JWKS dari Cache API (1 jam); gagal baca cache = ambil langsung.
async function ambilJwks(ulang = false) {
  const kunci = new Request(JWKS);
  const cache = globalThis.caches?.default;
  if (cache && !ulang) { const c = await cache.match(kunci).catch(() => null); if (c) return c.json(); }
  const r = await fetch(JWKS);
  if (!r.ok) throw new Error("jwks");
  if (cache) await cache.put(kunci, new Response(r.clone().body, { headers: { "cache-control": "public, max-age=3600" } })).catch(() => {});
  return r.json();
}

// Verifikasi id_token; mengembalikan klaim atau melempar.
export async function verifikasiIdToken(env, idToken, nonce, kini = Math.floor(Date.now() / 1000)) {
  const bag = String(idToken).split(".");
  if (bag.length !== 3) throw new Error("format");
  const kepala = JSON.parse(new TextDecoder().decode(dari64u(bag[0])));
  if (kepala.alg !== "RS256") throw new Error("alg");
  let jwk = (await ambilJwks()).keys?.find((k) => k.kid === kepala.kid);
  if (!jwk) jwk = (await ambilJwks(true)).keys?.find((k) => k.kid === kepala.kid);
  if (!jwk) throw new Error("kid");
  const kunci = await crypto.subtle.importKey("jwk", { ...jwk, alg: "RS256" }, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
  if (!(await crypto.subtle.verify("RSASSA-PKCS1-v1_5", kunci, dari64u(bag[2]), enc.encode(bag[0] + "." + bag[1])))) throw new Error("tanda-tangan");
  const k = JSON.parse(new TextDecoder().decode(dari64u(bag[1])));
  if (k.iss !== "https://accounts.google.com" && k.iss !== "accounts.google.com") throw new Error("iss");
  const aud = Array.isArray(k.aud) ? k.aud : [k.aud];
  if (!aud.includes(env.GOOGLE_CLIENT_ID)) throw new Error("aud");
  if (!Number.isFinite(k.exp) || k.exp <= kini) throw new Error("exp");
  if (!k.nonce || !samaTetap(k.nonce, nonce)) throw new Error("nonce");
  if (k.email_verified !== true && k.email_verified !== "true") throw new Error("email_verified");
  if (typeof k.sub !== "string" || !k.sub || typeof k.email !== "string") throw new Error("klaim");
  return k;
}

async function kembali(req, env) {
  if (!aktif(env)) return gagal("layanan");
  const url = new URL(req.url);
  const ip = await ipHash(env, req);
  if ((await hak.catatLaju(env, `masuk-ip:g${ip}`, JENDELA)) > BATAS) return gagal("laju_terlampaui", 429, { "retry-after": String(JENDELA) });
  // Kuki sementara: tanda tangan HMAC, belum kedaluwarsa, state cocok.
  const mentah = (req.headers.get("cookie") || "").split(/;\s*/).find((c) => c.startsWith(KUKI + "="))?.slice(KUKI.length + 1) || "";
  const [isi, tt] = mentah.split(".");
  let c = null;
  try { if (isi && tt && samaTetap(tt, await tandai(env, isi))) c = JSON.parse(new TextDecoder().decode(dari64u(isi))); } catch { c = null; }
  if (!c || c.e < Math.floor(Date.now() / 1000)) return galat("google_gagal");
  const ke = jalurAman(c.k);
  if (url.searchParams.get("error") || !url.searchParams.get("code") || !samaTetap(url.searchParams.get("state") || "", c.s)) return galat("google_gagal", ke);

  let k;
  try {
    const r = await fetch(TOKEN, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ code: url.searchParams.get("code"), client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri(url), grant_type: "authorization_code", code_verifier: c.v }) });
    if (!r.ok) throw new Error("token");
    k = await verifikasiIdToken(env, (await r.json()).id_token, c.n);
  } catch (e) { console.error("google-oidc", e?.message); return galat("google_gagal", ke); }

  const akun = await hak.cariAkunGoogle(env, k.sub, k.email.trim().toLowerCase());
  if (!akun) return galat("google_tidak_terdaftar", ke);
  if (akun.status !== "aktif") return galat(akun.status === "menunggu" ? "google_menunggu" : "google_nonaktif", ke);

  const token = acak(32);
  await hak.catatSesi(env, { idHash: await sha(token), akunId: akun.id, peran: akun.peran, sampai: Math.floor(Date.now() / 1000) + UMUR, ipHash: ip, info: infoSesi(req), lewat: "google" });
  return alih(akun.wajib_ganti ? "/ganti-sandi?ke=" + encodeURIComponent(ke) : ke,
    `sesi=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${UMUR}`, kukiSet("", 0));
}

export const rute = { "GET /api/masuk/google": mulai, "GET /api/masuk/google/kembali": kembali };
