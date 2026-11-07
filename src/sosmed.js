// sosmed.js: feed terbaru akun resmi METI di /galeri#sosmed. HANYA jalur resmi, tanpa scraping atau login otomatis:
//  - YouTube: RSS publik kanal; - Instagram/Facebook: Meta Graph API dengan token milik METI (secret META_TOKEN, IG_USER_ID, FB_PAGE_ID);
//  - LinkedIn: dikurasi admin (tempel URL kiriman). Tanpa secret Meta, bagiannya menampilkan "belum tersambung", bukan galat.
// Gambar Meta disalin ke R2 (URL CDN-nya kedaluwarsa dan CSP tidak boleh bertanda bintang), disajikan dari asal sendiri.
import * as hak from "./hak.js";
import { bacaBody, Galat, gagal, json, perlu, PRIVAT, sha } from "./util.js";

const YT_KANAL = "UCis1FDmFNOOa7gt2Fu45P3A"; // METI, sama dengan public/data/video_kanal.json
const GRAF = "https://graph.facebook.com/v21.0";
const BATAS = 12, MAKS_GAMBAR = 3 * 1024 * 1024;
const ADMIN = ["admin", "super"];
const RE_KUNCI = /^sosmed\/[a-z]+-[0-9a-f]{16}\.(jpg|png|webp)$/;
const RE_LINKEDIN = /^https:\/\/([a-z]{2,3}\.)?linkedin\.com\/(posts|feed\/update|embed\/feed\/update)\//;

const xml = (s) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&amp;/g, "&");
const potong = (s, n = 280) => { s = String(s || "").replace(/\s+/g, " ").trim(); return s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s; };

export function uraiYoutube(teks) {
  return [...teks.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(([, e]) => {
    const g = (k) => (e.match(new RegExp(`<${k}>([^<]*)</${k}>`)) || [])[1];
    const id = g("yt:videoId");
    return id && /^[\w-]{11}$/.test(id) ? { uid: id, judul: potong(xml(g("title") || id), 200), tanggal: (g("published") || "").slice(0, 10), url: "https://www.youtube.com/watch?v=" + id } : null;
  }).filter((b) => b && /^\d{4}-\d\d-\d\d$/.test(b.tanggal)).slice(0, BATAS);
}

async function salinGambar(env, platform, uid, sumber) {
  try {
    const r = await fetch(sumber);
    const tipe = (r.headers.get("content-type") || "").split(";")[0];
    const ext = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[tipe];
    const buf = r.ok && ext ? await r.arrayBuffer() : null;
    if (!buf || buf.byteLength > MAKS_GAMBAR) return null;
    const kunci = `sosmed/${platform}-${(await sha(uid)).slice(0, 16)}.${ext}`;
    await env.BERKAS.put(kunci, buf, { httpMetadata: { contentType: tipe } });
    return kunci;
  } catch { return null; }
}

async function graf(jalur, token) {
  const r = await fetch(`${GRAF}/${jalur}${jalur.includes("?") ? "&" : "?"}limit=${BATAS}&access_token=${encodeURIComponent(token)}`);
  if (!r.ok) throw new Error("graf " + r.status); // pesan tanpa URL: token ada di query
  return (await r.json()).data || [];
}

const tahan = {
  instagram: async (env) => (await graf(`${env.IG_USER_ID}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp`, env.META_TOKEN))
    .map((m) => ({ uid: m.id, judul: potong(m.caption) || "Instagram", tanggal: (m.timestamp || "").slice(0, 10), url: m.permalink, sumber: m.media_type === "VIDEO" ? m.thumbnail_url : m.media_url })),
  facebook: async (env) => (await graf(`${env.FB_PAGE_ID}/posts?fields=id,message,full_picture,permalink_url,created_time`, env.META_TOKEN))
    .map((m) => ({ uid: m.id, judul: potong(m.message) || "Facebook", tanggal: (m.created_time || "").slice(0, 10), url: m.permalink_url, sumber: m.full_picture })),
};

export async function perbaruiSosmed(env) {
  const hasil = {}, lama = new Map((await hak.sosmedDaftar(env)).map((b) => [b.platform + "|" + b.uid, b.gambar]));
  const simpan = async (platform, baris) => {
    const buang = await hak.sosmedSimpan(env, platform, baris.filter((b) => /^https:\/\//.test(b.url || "") && /^\d{4}-\d\d-\d\d$/.test(b.tanggal)));
    if (env.BERKAS) await Promise.all(buang.map((k) => env.BERKAS.delete(k).catch(() => {})));
    hasil[platform] = baris.length;
  };
  try {
    const r = await fetch("https://www.youtube.com/feeds/videos.xml?channel_id=" + YT_KANAL);
    if (!r.ok) throw new Error(r.status);
    await simpan("youtube", uraiYoutube(await r.text()));
  } catch (e) { hasil.youtube = "gagal: " + e.message; }
  for (const p of ["instagram", "facebook"]) {
    if (!env.META_TOKEN || !env[p === "instagram" ? "IG_USER_ID" : "FB_PAGE_ID"] || !env.BERKAS) { hasil[p] = "belum tersambung"; continue; }
    try {
      const baris = await tahan[p](env);
      for (const b of baris) b.gambar = lama.get(p + "|" + b.uid) || (b.sumber ? await salinGambar(env, p, b.uid, b.sumber) : null);
      await simpan(p, baris);
    } catch (e) { hasil[p] = "gagal: " + e.message; }
  }
  return hasil;
}

// LinkedIn: uid = id angka kiriman (activity/share/ugcPost), dari URL yang ditempel atau URN.
export function uraiLinkedin(url) {
  const u = String(url || "").trim().split("?")[0];
  const m = u.match(/(?:activity|share|ugcPost)[:-](\d{10,25})/);
  return m && RE_LINKEDIN.test(u) && u.length <= 400 ? { uid: m[1], url: u } : null;
}

export const rute = {
  "GET /api/sosmed/feed": async (req, env, ctx, p) => {
    perlu(p);
    return json({ baris: await hak.sosmedDaftar(env), meta: !!(env.META_TOKEN && env.IG_USER_ID && env.FB_PAGE_ID) }, 200, PRIVAT);
  },
  "GET /api/sosmed/gambar": async (req, env, ctx, p) => {
    perlu(p);
    const k = new URL(req.url).searchParams.get("k") || "";
    if (!RE_KUNCI.test(k) || !env.BERKAS) return gagal("tidak_ditemukan");
    const o = await env.BERKAS.get(k);
    if (!o) return gagal("tidak_ditemukan");
    return new Response(o.body, { headers: { "content-type": o.httpMetadata?.contentType || "image/jpeg", "x-content-type-options": "nosniff", "cache-control": "private, max-age=86400" } });
  },
  "POST /api/admin/sosmed-linkedin": async (req, env, ctx, p) => {
    const akun = perlu(p, ADMIN), b = await bacaBody(req), l = uraiLinkedin(b?.url), judul = potong(b?.judul, 200), tgl = String(b?.tanggal || "");
    if (!l || !judul || !/^\d{4}-\d\d-\d\d$/.test(tgl)) throw new Galat("masukan_salah");
    await hak.sosmedLinkedin(env, akun, "simpan", { ...l, judul, tanggal: tgl });
    return json({ uid: l.uid }, 201, PRIVAT);
  },
  "POST /api/admin/sosmed-linkedin-hapus": async (req, env, ctx, p) => {
    const akun = perlu(p, ADMIN), b = await bacaBody(req);
    if (!/^\d{10,25}$/.test(String(b?.uid))) throw new Galat("masukan_salah");
    await hak.sosmedLinkedin(env, akun, "hapus", { uid: String(b.uid) });
    return json({ ok: true }, 200, PRIVAT);
  },
};
