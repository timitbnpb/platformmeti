// og.js: kartu bagikan otomatis GET /og/<jenis>/<id>.svg (1200x630) dari JSON ringkas publik di aset + penyisip meta og:*.
// Hanya angka ringkas publik; tanpa foto wajah, tanpa kolom pribadi. PNG: berkas statis pra-render (scripts/pipa/og_render.mjs), bila ada.
import { HEADER_KEAMANAN, sha } from "./util.js";
import { namaProyek } from "../public/inti/nama_proyek.js";

const SITUS = "Direktori METI";
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const RE_ID = /^[A-Za-z0-9_-]{1,80}$/;
const L = (v) => (v && typeof v === "object" ? v.id ?? "" : v ?? "");
const angka = (n) => (Number.isFinite(+n) ? (+n).toLocaleString("id-ID", { maximumFractionDigits: 1 }) : String(n ?? "-"));
const TEK = { surya: "PLTS", bayu: "PLTB", hidro: "PLTA", "panas-bumi": "PLTP", bioenergi: "Bioenergi", "biomassa-sampah": "Biomassa", nuklir: "Nuklir", penyimpanan: "Penyimpanan", hidrogen: "Hidrogen" };
export const TOPIK_BERKAS = { surya: "surya", bayu: "bayu", hidro: "hidro", "panas-bumi": "panas_bumi", bioenergi: "bioenergi", "biomassa-sampah": "sampah_energi", sampah: "sampah_energi", penyimpanan: "penyimpanan", hidrogen: "hidrogen", nuklir: "nuklir" };

const cache = new Map(); // berkas JSON terurai, hidup selama isolate
async function data(env, url, jalur) {
  if (cache.has(jalur)) return cache.get(jalur);
  const r = await env.ASSETS.fetch(new Request(new URL("/data/" + jalur, url)));
  if (!r.ok) return null;
  const j = await r.json();
  cache.set(jalur, j);
  return j;
}
const cari = async (env, url, berkas, id) => (await data(env, url, berkas + ".json"))?.baris?.find((x) => x.id === id) ?? null;

// Tiap pembangun mengembalikan { judul, sub, angka:[[ikon,nilai,label]x3], tanggal, logo? } atau null.
export const PEMBANGUN = {
  async organisasi(env, url, id) {
    const x = await cari(env, url, "organisasi", id), j = await data(env, url, "organisasi.json");
    if (!x) return null;
    return { judul: x.nama, sub: x.kategori?.label, angka: [["tag", (x.kepakaran || []).length, "Bidang"], ["rantai", (x.peran_rantai || []).length, "Peran rantai"], ["doc", (x.sumber || []).length, "Sumber"]], tanggal: x.diperiksa || j.dibangun_pada, logo: `/img/logo/org/${id}.png` };
  },
  async proyek(env, url, id) {
    const x = await cari(env, url, "proyek", id), j = await data(env, url, "proyek.json");
    if (!x) return null;
    const k = (x.kapasitas || [])[0];
    return { judul: namaProyek(x), sub: x.lokasi?.provinsi, angka: [["bolt", k && Number.isFinite(k.nilai) ? `${angka(k.nilai)} ${k.satuan || "MW"}` : "-", "Kapasitas"], ["tag", TEK[x.teknologi] || "-", "Teknologi"], ["doc", (x.sumber || []).length, "Sumber"]], tanggal: j.dibangun_pada };
  },
  async orang(env, url, id) { // nama + jabatan + organisasi saja, tanpa foto
    const x = await cari(env, url, "orang", id), j = await data(env, url, "orang.json");
    if (!x) return null;
    return { judul: x.nama, sub: [x.jabatan_terkini, x.organisasi_terkini].filter(Boolean).join(", "), angka: [["tag", (x.jabatan || []).length, "Jabatan"], ["rantai", x.kelompok?.label || "-", "Kelompok"], ["doc", 1, "Sumber"]], tanggal: x.tanggal || j.dibangun_pada, logo: x.organisasi_id ? `/img/logo/org/${x.organisasi_id}.png` : null };
  },
  async provinsi(env, url, id) {
    if (!/^\d{2}$/.test(id)) return null;
    const x = await data(env, url, `wilayah/${id}.json`);
    if (!x) return null;
    const e = x.emisi;
    return { judul: x.nama, sub: "Profil provinsi", angka: [["bolt", e ? angka(e.jumlah) : "-", "Pembangkit terlacak"], ["awan", e ? angka(e.total_tco2e / 1e6) + " Mt" : "-", "Emisi CO2e"], ["doc", (x.berita || []).length, "Berita"]], tanggal: x.dibangun_pada };
  },
  async topik(env, url, id) {
    const b = TOPIK_BERKAS[id];
    const x = b && (await data(env, url, `topik/${b}.json`));
    if (!x) return null;
    return { judul: L(x.judul), sub: "Topik energi", angka: (x.kunci || []).slice(0, 3).map((k) => ["bolt", `${angka(k.nilai)} ${L(k.satuan)}`.trim(), L(k.label)]), tanggal: x.diperbarui };
  },
  async program(env, url, id) {
    const j = await data(env, url, "program_analisis.json"), x = j?.baris?.find((g) => g.kode === id);
    if (!x) return null;
    return { judul: L(x.nama), sub: "Program energi", angka: (x.target || []).slice(0, 3).map((t) => ["bolt", `${angka(t.angka)} ${L(t.satuan)}`.trim(), L(t.label)]), tanggal: j.dibangun_pada };
  },
  async beranda(env, url) {
    const [o, p, g] = await Promise.all(["organisasi", "proyek", "orang"].map((n) => data(env, url, n + ".json")));
    return { judul: SITUS, sub: "Jaringan energi terbarukan Indonesia", angka: [["rantai", angka(o?.jumlah), "Organisasi"], ["bolt", angka(p?.jumlah), "Proyek"], ["tag", angka(g?.jumlah), "Tokoh"]], tanggal: o?.dibangun_pada };
  },
};

const IKON = { // jalur 24x24
  bolt: "M13 2 4 14h6l-1 8 9-12h-6z", doc: "M6 2h9l5 5v15H6zM14 2v6h6", tag: "M3 3h8l10 10-8 8L3 11zM7.5 7.5h.01",
  rantai: "M10 14a4 4 0 0 0 6 0l3-3a4 4 0 0 0-6-6l-1 1M14 10a4 4 0 0 0-6 0l-3 3a4 4 0 0 0 6 6l1-1", awan: "M7 18a4 4 0 0 1 0-8 6 6 0 0 1 11 2 3 3 0 0 1-1 6z",
};

function bungkus(teks, maks, baris) {
  const out = [];
  let cur = "";
  for (const w of String(teks).split(/\s+/)) {
    if ((cur + " " + w).trim().length > maks && cur) { out.push(cur); cur = w; } else cur = (cur + " " + w).trim();
  }
  if (cur) out.push(cur);
  if (out.length > baris) { out.length = baris; out[baris - 1] = out[baris - 1].slice(0, maks - 1).replace(/\s+\S*$/, "") + "…"; }
  return out;
}

async function logoUri(env, url, jalur) {
  if (!jalur) return null;
  try {
    const r = await env.ASSETS.fetch(new Request(new URL(jalur, url)));
    if (!r.ok || !/^image\/(png|webp|jpeg)/.test(r.headers.get("content-type") || "image/png")) return null;
    const b = new Uint8Array(await r.arrayBuffer());
    if (!b.length || b.length > 60000) return null;
    let s = "";
    for (let i = 0; i < b.length; i += 8192) s += String.fromCharCode(...b.subarray(i, i + 8192));
    return `data:${(r.headers.get("content-type") || "image/png").split(";")[0]};base64,${btoa(s)}`;
  } catch { return null; }
}

export function svgKartu(k, logo) {
  const jd = bungkus(k.judul, 28, 2), sub = bungkus(k.sub || "", 60, 1)[0] || "";
  const tgl = k.tanggal ? "Data per " + esc(String(k.tanggal).slice(0, 10)) : "";
  const kartu = k.angka.slice(0, 3).map((a, i) => {
    const x = 60 + i * 380, nilai = bungkus(a[1], 14, 1)[0] || "-";
    return `<g transform="translate(${x} 400)"><rect width="360" height="150" rx="20" fill="#fff" fill-opacity=".14" stroke="#fff" stroke-opacity=".35"/>
<g transform="translate(24 24) scale(1.6)" fill="none" stroke="#F2C14E" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"><path d="${IKON[a[0]] || IKON.doc}"/></g>
<text x="24" y="112" font-size="44" font-weight="700" fill="#fff">${esc(nilai)}</text>
<text x="24" y="138" font-size="20" fill="#fff" fill-opacity=".85">${esc(bungkus(a[2] || "", 28, 1)[0])}</text></g>`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" font-family="Helvetica, Arial, sans-serif" role="img" aria-label="${esc(k.judul)}">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0A5C47"/><stop offset="1" stop-color="#122B4A"/></linearGradient>
<pattern id="b" width="80" height="80" patternUnits="userSpaceOnUse"><path d="M40 6 74 40 40 74 6 40z" fill="none" stroke="#fff" stroke-opacity=".07" stroke-width="2"/><circle cx="40" cy="40" r="9" fill="#fff" fill-opacity=".06"/><circle cx="0" cy="0" r="6" fill="#fff" fill-opacity=".05"/><circle cx="80" cy="80" r="6" fill="#fff" fill-opacity=".05"/></pattern></defs>
<rect width="1200" height="630" fill="url(#g)"/><rect width="1200" height="630" fill="url(#b)"/>
<g transform="translate(60 48)"><rect width="104" height="48" rx="12" fill="#F2C14E"/><text x="52" y="34" font-size="28" font-weight="800" fill="#122B4A" text-anchor="middle">METI</text></g>
<text x="184" y="82" font-size="24" fill="#fff" fill-opacity=".9">${SITUS}</text>
${logo ? `<g><rect x="1020" y="40" width="120" height="120" rx="20" fill="#fff"/><image href="${logo}" x="1028" y="48" width="104" height="104" preserveAspectRatio="xMidYMid meet"/></g>` : ""}
${jd.map((t, i) => `<text x="60" y="${196 + i * 66}" font-size="56" font-weight="800" fill="#fff">${esc(t)}</text>`).join("")}
<text x="60" y="${196 + jd.length * 66 - 12 + 40}" font-size="30" fill="#F2C14E">${esc(sub)}</text>
${kartu}
<text x="1140" y="598" font-size="20" fill="#fff" fill-opacity=".8" text-anchor="end">${tgl}</text>
</svg>`;
}

const RE_RUTE = /^\/og\/(organisasi|proyek|orang|provinsi|topik|program|beranda)\/([^/]+)\.(svg|png)$/;
const CC = "public, max-age=86400, stale-while-revalidate=604800";

/** Tangani GET/HEAD /og/<jenis>/<id>.(svg|png). Kembalikan Response (404 seragam bila tak sah). */
export async function halamanOg(req, env, url) {
  const tidak = () => new Response("Tidak ditemukan", { status: 404, headers: { ...HEADER_KEAMANAN, "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } });
  const m = url.pathname.match(RE_RUTE);
  if (!m || (req.method !== "GET" && req.method !== "HEAD") || !RE_ID.test(m[2])) return tidak();
  const [, jenis, id, ext] = m;
  if (ext === "png") { // pra-render statis; tak ada = 404
    const r = await env.ASSETS.fetch(new Request(new URL(url.pathname, url)));
    if (!r.ok || !/^image\/png/.test(r.headers.get("content-type") || "image/png")) return tidak();
    return new Response(req.method === "HEAD" ? null : r.body, { headers: { ...HEADER_KEAMANAN, "content-type": "image/png", "cache-control": CC } });
  }
  const k = await PEMBANGUN[jenis](env, url, id);
  if (!k) return tidak();
  const svg = svgKartu(k, await logoUri(env, url, k.logo));
  const etag = `"${(await sha(svg)).slice(0, 32)}"`;
  const h = { ...HEADER_KEAMANAN, "content-type": "image/svg+xml; charset=utf-8", "cache-control": CC, etag, "access-control-allow-origin": "*", "x-robots-tag": "noindex" };
  if (req.headers.get("if-none-match") === etag) return new Response(null, { status: 304, headers: h });
  return new Response(req.method === "HEAD" ? null : svg, { headers: h });
}

const NAMA_KARTU = [[/^\/o\/([^/]+)$/, "organisasi"], [/^\/p\/([^/]+)$/, "proyek"], [/^\/(?:wilayah|meti-wilayah)\/(\d{2})$/, "provinsi"], [/^\/teknologi\/([^/]+)$/, "topik"], [/^\/program\/([^/]+)$/, "program"]];

/** Sisipkan og:image, twitter:card summary_large_image (dan og:title/description bila belum ada) ke HTML 200. */
export async function sisipOg(res, req, url) {
  if (res.status !== 200 || req.method !== "GET" || !/^text\/html/.test(res.headers.get("content-type") || "")) return res;
  let html = await res.text();
  if (html.includes('property="og:image"')) return new Response(html, res);
  let jenis = "beranda", id = "utama";
  for (const [re, j] of NAMA_KARTU) { const m = url.pathname.match(re); if (m) { jenis = j; id = m[1]; break; } }
  const img = `${url.origin}/og/${jenis}/${id}.svg`;
  const judul = (html.match(/<title[^>]*>([^<]*)<\/title>/) || [])[1] || SITUS;
  const desk = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1];
  const tag = [
    html.includes('property="og:title"') ? "" : `<meta property="og:title" content="${judul}">`,
    desk && !html.includes('property="og:description"') ? `<meta property="og:description" content="${desk}">` : "",
    `<meta property="og:image" content="${esc(img)}">`, `<meta property="og:image:type" content="image/svg+xml">`, `<meta property="og:image:width" content="1200">`, `<meta property="og:image:height" content="630">`,
    `<meta name="twitter:image" content="${esc(img)}">`,
    /name="twitter:card"/.test(html) ? "" : `<meta name="twitter:card" content="summary_large_image">`,
  ].join("\n");
  html = html.replace(/<meta name="twitter:card" content="summary">/, '<meta name="twitter:card" content="summary_large_image">').replace("</head>", () => tag + "\n</head>");
  const h = new Headers(res.headers);
  h.delete("content-length"); h.delete("etag");
  return new Response(html, { status: 200, headers: h });
}
