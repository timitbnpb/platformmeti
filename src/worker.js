// worker.js (JM-A05): router objek "METODE /path/:id" + penjaga halaman terkunci. Satu try/catch untuk semua galat.
import { rute as ruteSesi } from "./sesi.js";
import { rute as ruteGoogle, googleAktif } from "./google.js";
import { rute as ruteAkun } from "./akun.js";
import { rute as ruteAgenda } from "./agenda.js";
import { rute as ruteSosmed, perbaruiSosmed } from "./sosmed.js";
import { rute as ruteEvent } from "./event.js";
import { rute as ruteDirektori } from "./direktori.js";
import { rute as ruteFoto } from "./foto_berita.js";
import { rute as ruteAdmin } from "./admin.js";
import { rute as ruteLangganan } from "./langganan.js";
import { rute as ruteKelayakan } from "./kelayakan.js";
import { rute as rutePustaka } from "./pustaka.js";
import { rute as ruteMetiWilayah, namaProvinsi } from "./meti_wilayah.js";
import { rute as rutePesan } from "./pesan.js";
import { rute as ruteProfilAkun } from "./profil_akun.js";
import { rute as ruteKta } from "./kta.js";
import { rute as ruteIkuti } from "./ikuti.js";
import { rute as rutePortal } from "./portal.js";
import { rute as ruteWilayahKelola } from "./wilayah_kelola.js";
import { rute as ruteDaftar } from "./daftar.js";
import { rute as ruteKonsultasi } from "./konsultasi.js";
import { rute as ruteKerja } from "./kerja.js";
import { catatHit, perbaruiRentang } from "./lalin.js";
import * as hak from "./hak.js";
import { halamanProfil } from "./profil.js";
import { halamanSiaran } from "./siaran.js";
import { gagal, halamanHtml, json, PRIVAT, sha } from "./util.js";

const rutePemilik = {
  // Publik; satu SELECT 1 lewat hak.js.
  // Tautan langganan kalender bertoken per akun (Google Calendar tak membawa cookie).
  "GET /api/kalender/tautan": async (req, env, ctx, { akun }) => {
    if (!akun) return gagal("belum_masuk");
    const t = await tokenIcs(env, akun.id);
    if (!t) return gagal("layanan");
    return json({ url: new URL("/kalender.ics?t=" + t, req.url).href }, 200, { "cache-control": "private, no-store" });
  },
  "GET /api/status": async (req, env) => {
    const db = await hak.ping(env).then(() => "ok", () => "galat");
    return json({ versi: env.VERSI || "dev", db, google: googleAktif(env) }, db === "ok" ? 200 : 503, { "cache-control": "no-store" });
  },
};

// Tabel rute dikompilasi sekali: { metode, bagian[], fn }.
const DAFTAR = Object.entries({ ...ruteSesi, ...ruteGoogle, ...ruteAkun, ...ruteAgenda, ...ruteSosmed, ...ruteEvent, ...ruteDirektori, ...ruteFoto, ...ruteAdmin, ...ruteLangganan, ...ruteKelayakan, ...rutePustaka, ...ruteKta, ...ruteMetiWilayah, ...rutePesan, ...ruteProfilAkun, ...ruteIkuti, ...rutePortal, ...ruteWilayahKelola, ...ruteKonsultasi, ...ruteKerja, ...ruteDaftar, ...rutePemilik }).map(([k, fn]) => {
  const [metode, jalur] = k.split(" ");
  return { metode, bagian: jalur.split("/").slice(1), fn };
});

function cocok(r, bagian) {
  if (r.bagian.length !== bagian.length) return null;
  const params = {};
  for (let i = 0; i < bagian.length; i++) {
    if (r.bagian[i][0] === ":") {
      try { params[r.bagian[i].slice(1)] = decodeURIComponent(bagian[i]); } catch { return null; }
    }
    else if (r.bagian[i] !== bagian[i]) return null;
  }
  return params;
}

const heksa = (b) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
const kunciIcs = (env) => {
  const r = env.ICS_RAHASIA || env.IP_SALT;
  return r ? crypto.subtle.importKey("raw", new TextEncoder().encode("ics|" + r), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]) : null;
};
async function tokenIcs(env, id) {
  const k = kunciIcs(env);
  return k ? `${id}.${heksa(await crypto.subtle.sign("HMAC", await k, new TextEncoder().encode("ics:" + id)))}` : null;
}
// Token sah = HMAC cocok DAN akun masih aktif (nonaktifkan akun = tautan mati).
async function icsSah(env, t) {
  const m = (t || "").match(/^(\d{1,12})\.[0-9a-f]{64}$/);
  if (!m) return false;
  try {
    const benar = await tokenIcs(env, m[1]);
    if (!benar || benar.length !== t.length) return false;
    let d = 0;
    for (let i = 0; i < t.length; i++) d |= benar.charCodeAt(i) ^ t.charCodeAt(i);
    return d === 0 && (await hak.sistem.akunAktif(env, Number(m[1])));
  } catch { return false; }
}

// Seluruh situs di balik login (KEPUTUSAN 7 Nov 2026): hanya alur masuk, aset yang dibutuhkannya, dan API masuk yang terbuka.
const PUBLIK = /^\/((masuk|aktivasi|ganti-sandi|404)(\.html)?|masuk\.js|kta_v\.js|kta\.css|tema\.js|i18n\.js|404\.js|langganan(\.html|\.js|\.css)?|daftar(\.html|\.js|\.css)?|daftar\/lacak(\/[0-9a-f]{64})?|berhenti|favicon[^/]*|robots\.txt)$|^\/inti\/[^/]+\.(css|js)$|^\/i18n\/|^\/img\/(logo|ikon)[^/]*$|^\/img\/logo\/meti(-vertikal-611)?\.png$|^\/img\/logo\/(org|mitra)\/[a-z0-9._-]+\.(png|webp|svg|jpg)$|^\/img\/mitra\/[a-z0-9._-]+\.(png|webp|svg|jpg)$|^\/img\/bendera\/(id|gb|us)\.svg$|^\/img\/beranda\/[^/]+\.webp$|^\/fonts\/|^\/kta\/v\/\d{1,9}\.[0-9a-f]{32}$|^\/data\/keanggotaan\.json$/;
// /api/langganan(/berhenti): ajakan publik newsletter (K19 turunan); rute lain di langganan.js tetap menagih sesi lewat perlu().
const API_PUBLIK = new Set(["/api/masuk", "/api/masuk/google", "/api/masuk/google/kembali", "/api/keluar", "/api/status", "/api/aktivasi", "/api/saya", "/api/langganan", "/api/langganan/berhenti",
  // Pendaftaran anggota mandiri (8 Nov 2026): tamu boleh mendaftar, melacak lewat token (di badan), dan mengunggah bukti iuran.
  "/api/daftar", "/api/daftar/foto", "/api/daftar/lacak", "/api/daftar/bukti", "/api/daftar/bayar-online", "/api/daftar/midtrans/notifikasi"]);

// Verifikasi KTA publik (token HMAC di jalur; salah = 404 seragam): satu-satunya rute data terbuka selain alur masuk.
const API_KTA_PUBLIK = /^\/api\/kta\/verifikasi\/[^/]+$/;
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

// sendBeacon tak bisa memasang x-pb: rute statistik publik cukup dengan asal sama-situs.
const asalSama = (req, url) => req.headers.get("origin") === url.origin || req.headers.get("sec-fetch-site") === "same-origin";

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
const NAMA_TEKNOLOGI = { surya: "Energi surya", bayu: "Energi bayu", hidro: "Hidro", "panas-bumi": "Panas bumi", bioenergi: "Bioenergi", "biomassa-sampah": "Sampah menjadi energi", sampah: "Sampah menjadi energi", penyimpanan: "Penyimpanan energi", hidrogen: "Hidrogen", nuklir: "Nuklir" };
const TIDAK_ADA = () => new Response("Tidak ditemukan", { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } });
const LANGSUNG_404 = /^\/(direktori|admin)\.html$/;
// Halaman yang digabung (Peluang+Kelayakan, Kalender+Event, Galeri+Video+Podcast): tautan lama dialihkan 301 ke tab barunya, query dipertahankan.
const ALIH_GABUNG = { "/kelayakan": "/peluang#hitung", "/event": "/kalender#daftar", "/video": "/galeri#video", "/podcast": "/galeri#sosmed", "/tender": "/proyek#tender" };

function halamanPrivat(res) {
  const r = new Response(res.body, res);
  r.headers.set("cache-control", "private, no-store");
  r.headers.set("vary", "Cookie");
  r.headers.set("x-robots-tag", "noindex, nofollow");
  return r;
}

// /video/<id>: halaman yang sama, judul <title> diisi dari data (SSR judul); id tak dikenal tetap 200 agar klien menampilkan keadaan kosong.
async function halamanVideo(req, env, url, id) {
  const res = await env.ASSETS.fetch(new Request(new URL("/video_detail", url), req));
  if (!res.ok || req.method === "HEAD") return res;
  let judul = null;
  for (const n of ["video_kanal", "video"]) {
    try {
      const r = await env.ASSETS.fetch(new Request(new URL(`/data/${n}.json`, url)));
      judul = r.ok ? ((await r.json()).baris || []).find((v) => v.id === id)?.judul : null;
    } catch { judul = null; }
    if (judul) break;
  }
  const aman = (judul || "").replace(/[<>&"]/g, "").slice(0, 140);
  const html = (await res.text()).replace(/<title>[^<]*<\/title>/, () => `<title>${aman ? aman + " | Video METI" : "Video | Direktori METI"}</title>`);
  return halamanHtml(html, res);
}

async function halaman(req, env, url, akun) {
  const path = url.pathname;
  if (LANGSUNG_404.test(path)) return TIDAK_ADA();
  if (!akun && !PUBLIK.test(path)) {
    if (path === "/kalender.ics" && (await icsSah(env, url.searchParams.get("t")))) {
      return halamanPrivat(await env.ASSETS.fetch(new Request(new URL("/kalender.ics", url), { method: req.method })));
    }
    if (path === "/kalender.ics") return gagal("belum_masuk", 401, PRIVAT);
    return new Response(null, { status: 302, headers: { location: "/masuk?ke=" + encodeURIComponent(path + url.search), ...PRIVAT } });
  }
  if (ALIH_GABUNG[path] && (req.method === "GET" || req.method === "HEAD")) {
    const [ke, hash] = ALIH_GABUNG[path].split("#");
    return new Response(null, { status: 301, headers: { location: ke + url.search + "#" + hash } });
  }
  for (const k of TERKUNCI) {
    if (!k.re.test(path)) continue;
    if (k.peran && !k.peran.includes(akun.peran)) return halamanPrivat(new Response("Dilarang", { status: 403, headers: { "content-type": "text/plain; charset=utf-8" } }));
    return halamanPrivat(await env.ASSETS.fetch(new Request(new URL(k.aset, url), req)));
  }
  let m;
  if ((m = path.match(/^\/([op])\/([^/]+)$/)) && (req.method === "GET" || req.method === "HEAD")) {
    return (await halamanProfil(req, env, url, m[1], m[2])) ?? TIDAK_ADA();
  }
  // Tautan berhenti newsletter (terbuka, bertoken di query): halaman yang sama dengan /langganan, mode dipilih skrip dari jalurnya.
  // Token lacak hidup di fragmen (/daftar/lacak#<token>), tidak pernah dikirim ke server. Rute lama bertoken di jalur dialihkan ke versi fragmen.
  if (path === "/daftar/lacak") return halamanPrivat(await env.ASSETS.fetch(new Request(new URL("/daftar", url), { method: req.method })));
  if ((m = path.match(/^\/daftar\/lacak\/([0-9a-f]{64})$/))) return new Response(null, { status: 302, headers: { location: "/daftar/lacak#" + m[1], "referrer-policy": "no-referrer", ...PRIVAT } });
  if (path === "/berhenti") return halamanPrivat(await env.ASSETS.fetch(new Request(new URL("/langganan", url), { method: req.method })));
  if (/^\/kta\/v\/\d{1,9}\.[0-9a-f]{32}$/.test(path) && (req.method === "GET" || req.method === "HEAD")) return halamanPrivat(await env.ASSETS.fetch(new Request(new URL("/kta_v", url), { method: req.method })));
  if ((m = path.match(/^\/siaran-pers\/([^/]+)$/)) && (req.method === "GET" || req.method === "HEAD")) {
    return (await halamanSiaran(req, env, url, m[1])) ?? TIDAK_ADA();
  }
  // /meti-wilayah/<kode BPS>: halaman yang sama dengan /meti-wilayah, judul diisi dari katalog (SSR judul); kode tak dikenal = 404.
  if ((m = path.match(/^\/meti-wilayah\/(\d{2})\/kelola$/)) && namaProvinsi(m[1])) return halamanPrivat(await env.ASSETS.fetch(new Request(new URL("/meti-wilayah-kelola", url), req)));
  if ((m = path.match(/^\/meti-wilayah\/([^/]+)$/))) {
    const nama = namaProvinsi(m[1]);
    if (!nama) return TIDAK_ADA();
    const res = await env.ASSETS.fetch(new Request(new URL("/meti-wilayah", url), req));
    if (!res.ok || req.method === "HEAD") return res;
    const esc = nama.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
    const html = (await res.text()).replace(/<title[^>]*>[^<]*<\/title>/, () => `<title>METI Wilayah ${esc} | Direktori METI</title>`);
    return halamanPrivat(halamanHtml(html, res));
  }
  if ((m = path.match(/^\/wilayah\/([^/]+)$/))) {
    if (!/^\d{2}$/.test(m[1])) return TIDAK_ADA();
    return env.ASSETS.fetch(new Request(new URL("/wilayah", url), req));
  }
  if ((m = path.match(/^\/event\/([a-z0-9][a-z0-9-]{0,78})$/))) return env.ASSETS.fetch(new Request(new URL("/event_detail", url), req));
  if ((m = path.match(/^\/video\/([\w-]{11})$/))) return halamanVideo(req, env, url, m[1]);
  // Profil anggota lain: cangkang statis /anggota (public/anggota.html); data dari /api/profil/<id> menurut privasi.
  if ((m = path.match(/^\/anggota\/\d{1,12}$/))) return halamanPrivat(await env.ASSETS.fetch(new Request(new URL("/anggota", url), req)));
  if ((m = path.match(/^\/(event|video)\/.+$/))) return TIDAK_ADA();
  if ((m = path.match(/^\/teknologi\/([^/]+)$/))) {
    const nama = NAMA_TEKNOLOGI[m[1]];
    if (!nama) return TIDAK_ADA();
    const res = await env.ASSETS.fetch(new Request(new URL("/teknologi", url), req));
    if (!res.ok || req.method === "HEAD") return res;
    const html = (await res.text()).replace(/<title>[^<]*<\/title>/, () => `<title>${nama} | Direktori METI</title>`);
    return halamanHtml(html, res);
  }
  if ((m = path.match(/^\/program\/([a-z0-9-]{1,40})$/)) && (req.method === "GET" || req.method === "HEAD")) return halamanProgram(req, env, url, m[1]);
  return env.ASSETS.fetch(req);
}

// /program/<kode>: cangkang /program, <title> diisi dari potret program_analisis (SSR judul); kode tak dikenal = 404.
export async function halamanProgram(req, env, url, kode) {
  let nama = null;
  try {
    const r = await env.ASSETS.fetch(new Request(new URL("/data/program_analisis.json", url)));
    nama = r.ok ? ((await r.json()).baris || []).find((g) => g.kode === kode)?.nama?.id : null;
  } catch { nama = null; }
  if (!nama) return TIDAK_ADA();
  const res = await env.ASSETS.fetch(new Request(new URL("/program", url), req));
  if (!res.ok || req.method === "HEAD") return res;
  const aman = nama.replace(/[<>&"]/g, "").slice(0, 140);
  const html = (await res.text()).replace(/<title[^>]*>[^<]*<\/title>/, () => `<title>${aman} | Program energi METI</title>`);
  return halamanHtml(html, res);
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
  if (TULIS.has(req.method) && !(url.pathname === "/api/statistik" ? asalSama(req, url) : url.pathname === "/api/daftar/midtrans/notifikasi" || csrfSah(req, url))) return gagal("dilarang");
  const { sesi, akun } = await muatSesi(req, env);
  if (!akun && !API_PUBLIK.has(url.pathname) && !API_KTA_PUBLIK.test(url.pathname)) return gagal("belum_masuk", 401, PRIVAT);
  if (akun?.wajib_ganti && !BOLEH_WAJIB_GANTI.has(url.pathname)) return gagal("dilarang");
  const res = await ada.fn(req, env, ctx, { params, sesi, akun });
  const r = new Response(res.body, res);
  // Semua respons API kini berautentikasi. "public, max-age=N" milik handler (dipakai Cache API Worker) keluar sebagai "private, max-age=N".
  const cc = (r.headers.get("cache-control") || "").match(/^(?:public|private), (max-age=\d+(?:, immutable)?)$/);
  r.headers.set("cache-control", cc ? "private, " + cc[1] : "private, no-store");
  r.headers.set("vary", "Cookie");
  return r;
}

export default {
  async fetch(req, env, ctx) {
    let res;
    try {
      const url = new URL(req.url);
      res = url.pathname.startsWith("/api/") ? await api(req, env, ctx, url) : await halaman(req, env, url, (await muatSesi(req, env)).akun);
    } catch (e) {
      if (e?.kode && Number.isInteger(e.status)) res = gagal(e.kode, e.status);
      else { console.error("galat-tak-terduga", e?.name, e?.message); res = gagal("server"); }
    }
    if (!res.headers.has("x-content-type-options")) {
      res = new Response(res.body, res);
      res.headers.set("x-content-type-options", "nosniff");
    }
    // Lalu lintas orang vs AI: dihitung sebelum gerbang masuk berlaku (bot yang menabrak /masuk tetap tercatat); galat tak pernah mengganggu respons.
    ctx?.waitUntil?.(catatHit(env, req, res.status).catch((e) => console.error("lalin", e?.message)));
    return res;
  },
  async scheduled(ev, env, ctx) {
    ctx?.waitUntil?.(perbaruiRentang(env).catch((e) => console.error("rentang-ip", e?.message)));
    ctx?.waitUntil?.(perbaruiSosmed(env).then((h) => console.log("sosmed", JSON.stringify(h))).catch((e) => console.error("sosmed", e?.message)));
  },
};
