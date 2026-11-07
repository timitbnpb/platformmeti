// GET /api/foto-berita/:id (publik): thumbnail berita dari host asal. Hanya url yang tercatat di berita_foto.json (bukan open proxy).
import { gagal } from "./util.js";

const MAKS = 2 * 1024 * 1024, TTL = 30 * 86400;
let PETA = null; // ponytail: cache per isolat; data baru terbaca setelah isolat daur ulang.

async function peta(env, url) {
  if (PETA) return PETA;
  const r = await env.ASSETS.fetch(new Request(new URL("/data/berita_foto.json", url)));
  PETA = r.ok ? await r.json() : {};
  return PETA;
}

const tak = () => gagal("tidak_ditemukan");
const HDR = { "cache-control": `public, max-age=${TTL}, immutable`, "x-content-type-options": "nosniff" };

async function foto(req, env, ctx, { params }) {
  if (!/^[a-z0-9]{6,20}$/.test(params.id) || new URL(req.url).search) return tak();
  const u = (await peta(env, req.url))[params.id];
  if (typeof u !== "string" || !/^https:\/\//.test(u)) return tak();
  const kunci = new Request(new URL(req.url).origin + "/api/foto-berita/" + params.id);
  const c = globalThis.caches?.default, kena = c && (await c.match(kunci));
  if (kena) return kena;
  try {
    const o = await fetch(u, { redirect: "manual", headers: { accept: "image/*" }, signal: AbortSignal.timeout(8000) });
    const tipe = (o.headers.get("content-type") || "").toLowerCase();
    if (o.status !== 200 || !/^image\/(?!svg)/.test(tipe) || Number(o.headers.get("content-length") || 0) > MAKS) return tak();
    const buf = await o.arrayBuffer();
    if (buf.byteLength > MAKS || !buf.byteLength) return tak();
    const res = new Response(buf, { status: 200, headers: { ...HDR, "content-type": tipe.split(";")[0] } });
    if (c) ctx?.waitUntil?.(c.put(kunci, res.clone()));
    return res;
  } catch { return tak(); }
}

export const rute = { "GET /api/foto-berita/:id": foto };
