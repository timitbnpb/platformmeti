// worker.js (JM-A05): router objek "METODE /path/:id" + penjaga halaman terkunci. Satu try/catch untuk semua galat.
import { rute as ruteSesi } from "./sesi.js";
import { rute as ruteAkun } from "./akun.js";
import { rute as ruteDirektori } from "./direktori.js";
import * as hak from "./hak.js";
import { halamanProfil } from "./profil.js";
import { gagal, json, sha } from "./util.js";

const rutePemilik = {
  // Publik; satu SELECT 1 lewat hak.js.
  "GET /api/status": async (req, env) => {
    const db = await hak.ping(env).then(() => "ok", () => "galat");
    return json({ versi: env.VERSI || "dev", db }, db === "ok" ? 200 : 503, { "cache-control": "no-store" });
  },
};

// Tabel rute dikompilasi sekali: { metode, bagian[], fn }.
const DAFTAR = Object.entries({ ...ruteSesi, ...ruteAkun, ...ruteDirektori, ...rutePemilik }).map(([k, fn]) => {
  const [metode, jalur] = k.split(" ");
  return { metode, bagian: jalur.split("/").slice(1), fn };
});

function cocok(r, bagian) {
  if (r.bagian.length !== bagian.length) return null;
  const params = {};
  for (let i = 0; i < bagian.length; i++) {
    if (r.bagian[i][0] === ":") params[r.bagian[i].slice(1)] = decodeURIComponent(bagian[i]);
    else if (r.bagian[i] !== bagian[i]) return null;
  }
  return params;
}

const TULIS = new Set(["POST", "PATCH", "PUT", "DELETE"]);
const RE_TOKEN = /^[0-9a-f]{64}$/;
const BOLEH_WAJIB_GANTI = new Set(["/api/ganti-sandi", "/api/keluar", "/api/saya", "/api/status"]);

// CSRF (R10 §2.2): header x-pb wajib; Sec-Fetch-Site harus same-origin bila ada; Origin harus sama bila ada;
// tanpa keduanya = tolak.
export function csrfSah(req, url) {
  if (req.headers.get("x-pb") !== "1") return false;
  const sfs = req.headers.get("sec-fetch-site"), origin = req.headers.get("origin");
  if (sfs && sfs !== "same-origin") return false;
  if (origin) return origin === url.origin;
  return sfs === "same-origin";
}

export function bacaCookie(req, nama = "sesi") {
  for (const c of (req.headers.get("cookie") || "").split(";")) {
    const [k, ...v] = c.trim().split("=");
    if (k === nama) return v.join("=");
  }
  return null;
}

// Sesi tak sah, akun nonaktif, peran tak dikenal, atau galat baca = tamu (tidak pernah fail-open ke hak lebih).
export async function muatSesi(req, env) {
  const token = bacaCookie(req);
  if (!token || !RE_TOKEN.test(token)) return { sesi: null, akun: null };
  try {
    const idHash = await sha(token);
    const s = await hak.bacaSesi(env, idHash);
    if (!s || s.status !== "aktif" || s.sampai <= Date.now() / 1000) return { sesi: null, akun: null };
    return { sesi: { idHash, sampai: s.sampai }, akun: {
      id: s.akun_id ?? s.id, peran: s.peran, nama: s.nama, bahasa: s.bahasa, cakupan_prov: s.cakupan_prov ?? null,
      wajib_ganti: !!s.wajib_ganti, surel: s.surel,
    } };
  } catch {
    return { sesi: null, akun: null };
  }
}

const TERKUNCI = [
  { re: /^\/direktori\/?$/, aset: "/direktori", peran: null, ke: "/direktori" },
  { re: /^\/admin(\/.*)?$/, aset: "/admin", peran: ["admin", "super"], ke: "/admin" },
];
const TIDAK_ADA = () => new Response("Tidak ditemukan", { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } });
const LANGSUNG_404 = /^\/(direktori|admin)\.html$/;

function halamanPrivat(res) {
  const r = new Response(res.body, res);
  r.headers.set("cache-control", "private, no-store");
  r.headers.set("vary", "Cookie");
  r.headers.set("x-robots-tag", "noindex, nofollow");
  return r;
}

async function halaman(req, env, url) {
  const path = url.pathname;
  if (LANGSUNG_404.test(path)) return TIDAK_ADA();
  for (const k of TERKUNCI) {
    if (!k.re.test(path)) continue;
    const { akun } = await muatSesi(req, env);
    if (!akun) return new Response(null, { status: 302, headers: { location: "/masuk?ke=" + k.ke, "cache-control": "private, no-store", vary: "Cookie" } });
    if (k.peran && !k.peran.includes(akun.peran)) return halamanPrivat(new Response("Dilarang", { status: 403, headers: { "content-type": "text/plain; charset=utf-8" } }));
    return halamanPrivat(await env.ASSETS.fetch(new Request(new URL(k.aset, url), req)));
  }
  let m;
  if ((m = path.match(/^\/([op])\/([^/]+)$/)) && (req.method === "GET" || req.method === "HEAD")) {
    return (await halamanProfil(req, env, url, m[1], m[2])) ?? TIDAK_ADA();
  }
  if ((m = path.match(/^\/wilayah\/([^/]+)$/))) {
    if (!/^\d{2}$/.test(m[1])) return TIDAK_ADA();
    return env.ASSETS.fetch(new Request(new URL("/wilayah", url), req));
  }
  return env.ASSETS.fetch(req);
}

async function api(req, env, ctx, url) {
  const bagian = url.pathname.split("/").slice(1);
  let params = null, ada = null, metodeLain = false;
  for (const r of DAFTAR) {
    const p = cocok(r, bagian);
    if (!p) continue;
    if (r.metode === req.method) { ada = r; params = p; break; }
    metodeLain = true;
  }
  if (!ada) return metodeLain ? gagal("metode") : gagal("tidak_ditemukan");
  if (TULIS.has(req.method) && !csrfSah(req, url)) return gagal("dilarang");
  const { sesi, akun } = await muatSesi(req, env);
  if (akun?.wajib_ganti && !BOLEH_WAJIB_GANTI.has(url.pathname)) return gagal("dilarang");
  const res = await ada.fn(req, env, ctx, { params, sesi, akun });
  const r = new Response(res.body, res);
  if (akun) { r.headers.set("cache-control", "private, no-store"); r.headers.set("vary", "Cookie"); }
  else if (!r.headers.has("cache-control")) r.headers.set("cache-control", "private, no-store");
  return r;
}

export default {
  async fetch(req, env, ctx) {
    let res;
    try {
      const url = new URL(req.url);
      res = url.pathname.startsWith("/api/") ? await api(req, env, ctx, url) : await halaman(req, env, url);
    } catch (e) {
      if (e?.kode && Number.isInteger(e.status)) res = gagal(e.kode, e.status);
      else { console.error("galat-tak-terduga", e?.name, e?.message); res = gagal("server"); }
    }
    if (!res.headers.has("x-content-type-options")) {
      res = new Response(res.body, res);
      res.headers.set("x-content-type-options", "nosniff");
    }
    return res;
  },
  async scheduled() {},
};
