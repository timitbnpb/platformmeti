// profil.js: /o/<id> dan /p/<id>, cangkang statis (public/o.html, p.html) + judul, deskripsi, og:* per entitas disuntik di server
// supaya pratinjau tautan terbaca. Bacaan publik atas JSON statis (lapis publik), tanpa D1. Semua nilai di-escape.
import { halamanHtml } from "./util.js";
import { namaProyek } from "../public/inti/nama_proyek.js";

const RE_ID = /^[A-Za-z0-9_-]{2,60}$/;
const SITUS = "Direktori METI";
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const indeks = {}; // { o: Map, p: Map }, hidup selama isolate

async function muatIndeks(env, url, jenis) {
  if (indeks[jenis]) return indeks[jenis];
  const berkas = jenis === "o" ? "organisasi" : "proyek";
  const r = await env.ASSETS.fetch(new Request(new URL(`/data/${berkas}.json`, url)));
  if (!r.ok) throw new Error("data-" + berkas);
  return (indeks[jenis] = new Map((await r.json()).baris.map((x) => [x.id, x])));
}

const TEK = { surya: "PLTS", bayu: "PLTB", hidro: "PLTA", "panas-bumi": "PLTP", bioenergi: "Bioenergi", "biomassa-sampah": "Biomassa dan sampah", nuklir: "Nuklir", penyimpanan: "Penyimpanan energi" };

export function meta(jenis, x) {
  if (jenis === "o") {
    const lok = x.lokasi || {}, tempat = [lok.kota, lok.provinsi].filter(Boolean).join(", ");
    return { judul: x.nama, deskripsi: `${x.nama}${x.kategori?.label ? ", " + x.kategori.label : ""}${tempat ? " di " + tempat : ""}. Profil organisasi di jaringan METI: proyek, program, regulasi, dan berita terkait, dengan sumber dan tanggal.` };
  }
  const nama = namaProyek(x), k = (x.kapasitas || [])[0], st = (x.status || [])[0]?.nilai;
  const bagian = [TEK[x.teknologi], k && Number.isFinite(k.nilai) ? `${k.nilai} ${k.satuan || "MW"}` : "", st, x.lokasi?.provinsi].filter(Boolean).join(", ");
  return { judul: nama, deskripsi: `${nama}${bagian ? ": " + bagian : ""}. Profil proyek energi terbarukan di jaringan METI: lokasi, pihak, program, linimasa, regulasi, dan berita, dengan sumber dan tanggal.` };
}

/** Kembalikan Response HTML, atau null bila id tak sah/tak dikenal (pemanggil memberi 404). */
export async function halamanProfil(req, env, url, jenis, id) {
  if (!RE_ID.test(id)) return null;
  const x = (await muatIndeks(env, url, jenis)).get(id);
  if (!x) return null;
  const cangkang = await env.ASSETS.fetch(new Request(new URL("/" + jenis, url)));
  if (!cangkang.ok) return cangkang;
  const m = meta(jenis, x), judul = `${m.judul} | ${SITUS}`, kanon = `${url.origin}/${jenis}/${id}`;
  const tag = [
    `<meta name="description" content="${esc(m.deskripsi)}">`,
    `<link rel="canonical" href="${esc(kanon)}">`,
    `<meta property="og:type" content="website">`, `<meta property="og:site_name" content="${SITUS}">`,
    `<meta property="og:title" content="${esc(judul)}">`, `<meta property="og:description" content="${esc(m.deskripsi)}">`,
    `<meta property="og:url" content="${esc(kanon)}">`, `<meta name="twitter:card" content="summary">`,
  ].join("\n");
  // fungsi pengganti: tanda $ dalam nama tidak ditafsirkan sebagai pola
  const html = (await cangkang.text()).replace(/<title>[^<]*<\/title>/, () => `<title>${esc(judul)}</title>`).replace("<!--meta-->", () => tag);
  return halamanHtml(html, cangkang);
}
