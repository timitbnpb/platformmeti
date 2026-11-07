// sematan.js: GET /sematan/<jenis>/<id> = kartu ringkas publik untuk <iframe> di situs lain (tanpa JS, tanpa navbar).
// Data = pembangun kartu OG (og.js): hanya angka ringkas publik. Satu-satunya rute yang boleh dibingkai pihak luar; sisanya tetap DENY.
import { HEADER_KEAMANAN } from "./util.js";
import { PEMBANGUN } from "./og.js";

const RE = /^\/sematan\/(organisasi|proyek|orang|provinsi|topik|program|beranda)\/([A-Za-z0-9_-]{1,80})$/;
const BALIK = { organisasi: (i) => "/o/" + i, proyek: (i) => "/p/" + i, provinsi: (i) => "/wilayah/" + i, topik: (i) => "/teknologi/" + i, program: (i) => "/program/" + i, orang: () => "/direktori", beranda: () => "/" };
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/** Header keamanan global dengan SATU kelonggaran: boleh dibingkai. */
export const headerSematan = () => {
  const h = { ...HEADER_KEAMANAN };
  delete h["x-frame-options"];
  h["content-security-policy"] = h["content-security-policy"].replace("frame-ancestors 'none'", "frame-ancestors *");
  return h;
};

export async function halamanSematan(req, env, url) {
  const m = url.pathname.match(RE);
  const k = m && (req.method === "GET" || req.method === "HEAD") ? await PEMBANGUN[m[1]](env, url, m[2]) : null;
  if (!k) return new Response("Tidak ditemukan", { status: 404, headers: { ...HEADER_KEAMANAN, "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } });
  const tgl = k.tanggal ? "Data per " + esc(String(k.tanggal).slice(0, 10)) : "";
  const html = `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${esc(k.judul)} | Direktori METI</title><link rel="stylesheet" href="/inti/tema.css"><link rel="stylesheet" href="/inti/sematan.css"></head><body><article class="sm"><header class="sm-kop"><img src="/img/logo-meti-tanda.png" width="32" height="32" alt=""><b>Direktori METI</b></header><h1>${esc(k.judul)}</h1>${k.sub ? `<p class="sm-sub">${esc(k.sub)}</p>` : ""}<ul class="sm-angka">${k.angka.slice(0, 3).map((a) => `<li><b>${esc(a[1])}</b><span>${esc(a[2])}</span></li>`).join("")}</ul><footer class="sm-kaki"><span>${tgl}</span><a href="${esc(url.origin + BALIK[m[1]](m[2]))}" target="_blank" rel="noopener">Lihat selengkapnya di Direktori METI</a></footer></article></body></html>`;
  return new Response(req.method === "HEAD" ? null : html, { headers: { ...headerSematan(), "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=3600", "x-robots-tag": "noindex" } });
}
