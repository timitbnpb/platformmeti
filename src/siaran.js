// siaran.js: /siaran-pers/<id>. Cangkang statis (public/siaran-pers-rinci.html) + judul, deskripsi, og:* per artikel disuntik di server
// supaya pratinjau tautan terbaca. Bacaan atas JSON statis, tanpa D1. Semua nilai di-escape. Id tak dikenal = null (404).
const RE_ID = /^[A-Za-z0-9_-]{2,60}$/;
const SITUS = "Direktori METI";
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
let indeks = null; // ponytail: cache per isolat; data baru terbaca setelah isolat daur ulang.

async function muatIndeks(env, url) {
  if (indeks) return indeks;
  const r = await env.ASSETS.fetch(new Request(new URL("/data/siaran_pers.json", url)));
  if (!r.ok) throw new Error("data-siaran_pers");
  return (indeks = new Map((await r.json()).baris.map((x) => [x.id, x])));
}

export const judulSiaran = (x) => (x.jenis === "liputan_media" ? `${x.media} | ${x.judul}` : x.judul);

export async function halamanSiaran(req, env, url, id) {
  if (!RE_ID.test(id)) return null;
  const x = (await muatIndeks(env, url)).get(id);
  if (!x) return null;
  const cangkang = await env.ASSETS.fetch(new Request(new URL("/siaran-pers-rinci", url)));
  if (!cangkang.ok) return cangkang;
  const j = judulSiaran(x), judul = `${j} | ${SITUS}`, kanon = `${url.origin}/siaran-pers/${id}`;
  const deskripsi = (x.ringkasan || (x.isi || []).find((p) => p.p)?.p || j).slice(0, 300);
  const foto = x.foto ? `${url.origin}${x.foto}` : "";
  const tag = [
    `<meta name="description" content="${esc(deskripsi)}">`,
    `<link rel="canonical" href="${esc(kanon)}">`,
    `<meta property="og:type" content="article">`, `<meta property="og:site_name" content="${SITUS}">`,
    `<meta property="og:title" content="${esc(judul)}">`, `<meta property="og:description" content="${esc(deskripsi)}">`,
    `<meta property="og:url" content="${esc(kanon)}">`,
    foto ? `<meta property="og:image" content="${esc(foto)}">` : "",
    `<meta name="twitter:card" content="${foto ? "summary_large_image" : "summary"}">`,
  ].filter(Boolean).join("\n");
  // fungsi pengganti: tanda $ dalam judul tidak ditafsirkan sebagai pola
  const html = (await cangkang.text()).replace(/<title>[^<]*<\/title>/, () => `<title>${esc(judul)}</title>`).replace(/<meta name="description"[^>]*>/, () => "").replace("<!--meta-->", () => tag);
  return new Response(html, { status: 200, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=300" } });
}
