#!/usr/bin/env node
// Pipeline Siaran Pers METI -> public/data/siaran_pers.json (+ public/img/siaran, public/img/kegiatan, public/data/berita_foto.json).
//   node scripts/pipa/siaran_pers.mjs [--meti] [--media] [--gdelt=<folder g*.json>] [--maks=N]
//   node scripts/pipa/siaran_pers.mjs --uji     uji murni tanpa jaringan
// Tiga jenis: siaran_pers (kategori "Siaran Pers" di situs METI), liputan_kegiatan (artikel METI lain),
// liputan_media (media lain yang menyebut METI: hanya ringkasan, kutipan <= 25 kata, tautan sumber).
// Foto METI disalin (milik METI, maks 1200px webp). Foto media TIDAK disalin: hanya URL og:image ke berita_foto.json,
// tampil lewat /api/foto-berita/<id>. Sopan: robots dihormati, UA METI, jeda >= 2 detik per host, berhenti di 403/429.
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { UA, robotsBolehkan, urlKanon, ATURAN } from "../panen/berita.mjs";

const AKAR = fileURLToPath(new URL("../..", import.meta.url));
const KELUAR = AKAR + "public/data/siaran_pers.json", FOTO = AKAR + "public/data/berita_foto.json";
const API = "https://api.metiires.or.id/api", SITUS = "https://metiires.or.id";
const TGL = new Date().toISOString().slice(0, 10);
const JENIS = ["siaran_pers", "liputan_media", "liputan_kegiatan"];
const RE_METI = /\bMETI\b|Masyarakat Energi Terbarukan Indonesia|Indonesia Renewable Energy Society/;
const BULAN = { januari: 1, februari: 2, maret: 3, april: 4, mei: 5, juni: 6, juli: 7, agustus: 8, september: 9, oktober: 10, november: 11, desember: 12 };

const tidur = (ms) => new Promise((r) => setTimeout(r, ms));
export const idMedia = (url) => createHash("sha1").update(urlKanon(url)).digest("hex").slice(0, 10);
export const slugId = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60).replace(/-$/, "");

const ENT = { "&amp;": "&", "&quot;": '"', "&#39;": "'", "&#x27;": "'", "&lt;": "<", "&gt;": ">", "&nbsp;": " ", "&#8217;": "’", "&#8220;": "“", "&#8221;": "”", "&#8211;": "-", "&#8212;": "-" };
export const lepas = (s) => String(s ?? "").replace(/&(?:amp|quot|lt|gt|nbsp|#39|#x27|#8217|#8220|#8221|#8211|#8212);/g, (m) => ENT[m]).replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/\s+/g, " ").trim();
// Tanpa em dash dan en dash di keluaran (aturan pemilik L1).
export const bersih = (s) => lepas(s).replace(/[–—]/g, "-");
const kataN = (s) => s.split(/\s+/).filter(Boolean).length;

/** "Jakarta, 21 Oktober 2026 - isi ..." -> { kota, tanggal, sisa } */
export function barisTanggal(teks) {
  const m = /^\s*([A-Z][A-Za-z .]{2,30}),\s*(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})\s*[-–—]\s*/.exec(teks);
  if (!m || !BULAN[m[3].toLowerCase()]) return { kota: "", tanggal: "", sisa: teks };
  return { kota: m[1].trim(), tanggal: `${m[4]}-${String(BULAN[m[3].toLowerCase()]).padStart(2, "0")}-${m[2].padStart(2, "0")}`, sisa: teks.slice(m[0].length) };
}
/** Paragraf bertanda: kutipan (diawali tanda petik kiri) dan subjudul (pendek, tanpa titik akhir). */
export function paragraf(teks) {
  return teks.split(/\n\s*\n|\n/).map((p) => bersih(p)).filter(Boolean).map((p) => {
    if (/^“|^"/.test(p) && /[”"]/.test(p) && p.length > 60) return { k: p };
    if (p.length <= 100 && !/[.:;,!?”"]$/.test(p)) return { h: p };
    return { p };
  });
}
const TOPIK_SAH = new Set(["bayu", "bioenergi", "biomassa-sampah", "efisiensi", "elektrifikasi", "hidro", "industri", "jaringan", "karbon", "kebijakan", "nuklir", "panas-bumi", "pembiayaan", "penyimpanan", "surya", "transisi-adil"]); // sama dengan kamus brt.tek.*
export const topikDari = (teks) => Object.entries(ATURAN).filter(([k, re]) => TOPIK_SAH.has(k) && re.test(teks.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " "))).map(([k]) => k).slice(0, 5);

/** Kutipan pendek (<= 25 kata) dari teks halaman media: kalimat berpetik dalam paragraf yang menyebut METI/ketua. */
export function kutipanPendek(teks) {
  for (const m of teks.matchAll(/[“"]([^”"]{40,260})[”"]/g)) {
    const q = bersih(m[1]), i = m.index;
    const konteks = teks.slice(Math.max(0, i - 400), i + 400);
    if (kataN(q) <= 25 && kataN(q) >= 7 && RE_METI.test(konteks)) return q;
  }
  return "";
}
/** Ringkasan 2 kalimat pertama deskripsi halaman, maks 280 huruf (deskripsi meta, bukan isi artikel). */
export function ringkasan(desk) {
  const s = bersih(desk).split(/(?<=[.!?])\s+/).slice(0, 2).join(" ");
  return s.length > 280 ? s.slice(0, 277).replace(/\s+\S*$/, "") + "..." : s;
}

const terakhir = new Map(), robots = new Map(), blok = new Set();
async function ambil(url, { json = false, batas = 600000, biner = false } = {}) {
  const h = new URL(url).host;
  if (blok.has(h)) return null;
  const tunggu = (terakhir.get(h) || 0) + 2100 - Date.now();
  terakhir.set(h, Math.max(Date.now(), terakhir.get(h) || 0) + 2100);
  if (tunggu > 0) await tidur(tunggu);
  try {
    const r = await fetch(url, { headers: { "User-Agent": UA, Accept: json ? "application/json" : biner ? "image/*" : "text/html" }, redirect: "follow", signal: AbortSignal.timeout(15000) });
    if (r.status === 403 || r.status === 429) { blok.add(h); return null; }
    if (!r.ok) return null;
    if (biner) return Buffer.from(await r.arrayBuffer());
    return json ? await r.json() : (await r.text()).slice(0, batas);
  } catch { return null; }
}
async function boleh(url) {
  const u = new URL(url);
  if (!robots.has(u.host)) robots.set(u.host, ambil(u.origin + "/robots.txt", { batas: 100000 }));
  const r = await robots.get(u.host);
  return r === null ? true : robotsBolehkan(r, u.pathname + u.search);
}

/** Unduh gambar METI, simpan webp maks 1200px lebar. Mengembalikan jalur publik atau "". */
async function salinFoto(url, tujuan) {
  const buf = await ambil(url, { biner: true });
  if (!buf) return "";
  const tmp = tmpdir() + "/sp-" + process.pid + "-" + Math.random().toString(36).slice(2) + ".img";
  writeFileSync(tmp, buf);
  try {
    const lebar = +/pixelWidth: (\d+)/.exec(execFileSync("sips", ["-g", "pixelWidth", tmp], { encoding: "utf8" }))?.[1] || 0;
    mkdirSync(AKAR + "public" + tujuan.replace(/\/[^/]+$/, ""), { recursive: true });
    execFileSync("cwebp", ["-quiet", "-q", "80", ...(lebar > 1200 ? ["-resize", "1200", "0"] : []), tmp, "-o", AKAR + "public" + tujuan]);
    return tujuan;
  } catch { return ""; } finally { rmSync(tmp, { force: true }); }
}

async function panenMeti() {
  const daftar = await ambil(API + "/news", { json: true });
  const slugs = new Set([daftar?.featured?.slug, ...(daftar?.list || []).map((a) => a.slug)].filter(Boolean));
  const hasil = [];
  for (const slug of slugs) {
    const a = await ambil(`${API}/news/${slug}`, { json: true });
    if (!a?.title) continue;
    const { kota, tanggal, sisa } = barisTanggal(String(a.content || ""));
    const id = slugId(a.title);
    const jenis = /siaran pers/i.test(a.category) ? "siaran_pers" : "liputan_kegiatan";
    const dir = jenis === "siaran_pers" ? "siaran" : "kegiatan";
    const foto = a.image ? await salinFoto(a.image, `/img/${dir}/${id}.webp`) : "";
    const galeri = [];
    for (const [i, g] of (a.gallery || []).entries()) {
      const u = typeof g === "string" ? g : g?.url || g?.image;
      const f = u ? await salinFoto(u, `/img/kegiatan/${id}-${i + 1}.webp`) : "";
      if (f) galeri.push(f);
    }
    const isi = paragraf(sisa);
    hasil.push({
      id, jenis, judul: bersih(a.title), tanggal: tanggal || a.date, kota: kota || bersih(a.location || ""), foto, galeri,
      media: "METI", url_sumber: `${SITUS}/news/${a.slug}`, penulis: bersih(a.author || ""), kategori: bersih(a.category || ""),
      ringkasan: bersih(a.excerpt || "").slice(0, 300), kutipan: "", isi,
      topik: topikDari(a.title + " " + sisa), tag: (a.tags || []).map((t) => bersih(t.name)),
      org_ids: [], proyek_ids: [], regulasi_ids: [], tanggal_ambil: TGL,
    });
  }
  return hasil;
}

const metaIsi = (h, ...nama) => {
  for (const n of nama) {
    const re = new RegExp(`<meta[^>]+(?:property|name)=["']${n}["'][^>]*content=["']([^"']*)`, "i"), re2 = new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${n}["']`, "i");
    const m = re.exec(h) || re2.exec(h);
    if (m) return lepas(m[1]);
  }
  return "";
};
const NAMA_MEDIA = { "antaranews.com": "Antara", "kompas.com": "Kompas", "bisnis.com": "Bisnis", "kontan.co.id": "Kontan", "cnbcindonesia.com": "CNBC Indonesia", "katadata.co.id": "Katadata", "kumparan.com": "Kumparan", "detik.com": "Detik", "tempo.co": "Tempo", "thejakartapost.com": "The Jakarta Post", "suara.com": "Suara", "cnnindonesia.com": "CNN Indonesia", "republika.co.id": "Republika", "liputan6.com": "Liputan6", "mediaindonesia.com": "Media Indonesia", "validnews.id": "Validnews", "investor.id": "Investor Daily", "esdm.go.id": "ESDM", "idxchannel.com": "IDX Channel", "tribunnews.com": "Tribunnews", "okezone.com": "Okezone", "merdeka.com": "Merdeka", "jawapos.com": "Jawa Pos", "beritasatu.com": "Berita Satu", "emitennews.com": "Emiten News", "mongabay.co.id": "Mongabay" };
export const namaMedia = (host) => {
  const h = host.replace(/^www\./, "");
  const k = Object.keys(NAMA_MEDIA).find((d) => h === d || h.endsWith("." + d));
  return k ? NAMA_MEDIA[k] : h.replace(/\.(co\.id|com|id|net|org|co)$/, "").split(".").pop().replace(/^./, (c) => c.toUpperCase());
};

async function panenMedia(kandidat, maks) {
  const hasil = [], foto = existsSync(FOTO) ? JSON.parse(readFileSync(FOTO, "utf8")) : {};
  for (const k of kandidat.slice(0, maks)) {
    if (!/^https:\/\//.test(k.url) || !(await boleh(k.url))) continue;
    const h = await ambil(k.url);
    if (!h) continue;
    const teks = lepas(h.replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ").replace(/<[^>]+>/g, " "));
    if (!RE_METI.test(teks)) continue; // halaman harus benar-benar menyebut METI
    const id = idMedia(k.url);
    const gambar = metaIsi(h, "og:image", "twitter:image");
    if (/^https:\/\//.test(gambar) && !/\.(svg|mp4)(\?|$)/i.test(gambar) && gambar.length < 600) foto[id] = gambar;
    const terbit = (metaIsi(h, "article:published_time", "og:article:published_time", "pubdate", "date", "publishdate", "content_PublishedDate", "dtk:publishdate") || /"datePublished"\s*:\s*"(\d{4}-\d\d-\d\d)/.exec(h)?.[1] || /<time[^>]+datetime=["'](\d{4}-\d\d-\d\d)/i.exec(h)?.[1] || /\/(20\d\d)[/-](\d\d)[/-](\d\d)\//.exec(k.url)?.slice(1).join("-") || k.terbit || "").slice(0, 10);
    const host = new URL(k.url).host;
    const judul = bersih(metaIsi(h, "og:title") || k.judul).replace(/\s*[|]\s*[^|]{2,40}$/, "");
    if (!/^\d{4}-\d\d-\d\d$/.test(terbit) && !/^\d{4}-\d\d-\d\d/.test(k.terbit || "")) continue; // tanpa tanggal tidak ditampilkan
    hasil.push({
      id, jenis: "liputan_media", judul, tanggal: /^\d{4}-\d\d-\d\d$/.test(terbit) ? terbit : (k.terbit || "").slice(0, 10), kota: "", foto: "", galeri: [],
      media: namaMedia(host), url_sumber: k.url, penulis: bersih(metaIsi(h, "author", "article:author")).slice(0, 80), kategori: "",
      ringkasan: ringkasan(metaIsi(h, "og:description", "description")), kutipan: kutipanPendek(teks), isi: [],
      topik: topikDari(judul + " " + metaIsi(h, "og:description")), tag: [], org_ids: [], proyek_ids: [], regulasi_ids: [], tanggal_ambil: TGL,
    });
  }
  writeFileSync(FOTO, JSON.stringify(foto));
  return hasil;
}

export function kandidatMedia(folderGdelt) {
  const peta = new Map();
  const pasang = (url, judul, terbit) => { if (url && /^https:\/\//.test(url)) peta.set(urlKanon(url), { url, judul: judul || "", terbit: terbit || "" }); };
  for (const b of JSON.parse(readFileSync(AKAR + "public/data/berita.json", "utf8")).baris) if (RE_METI.test(b.judul)) pasang(b.url, b.judul, b.terbit);
  if (folderGdelt && existsSync(folderGdelt)) {
    for (const f of readdirSync(folderGdelt).filter((x) => /^g\d+\.json$/.test(x))) {
      try {
        for (const a of JSON.parse(readFileSync(folderGdelt + "/" + f, "utf8")).articles || []) {
          const t = a.seendate ? `${a.seendate.slice(0, 4)}-${a.seendate.slice(4, 6)}-${a.seendate.slice(6, 8)}` : "";
          pasang(a.url, a.title, t);
        }
      } catch { /* berkas parsial */ }
    }
  }
  return [...peta.values()];
}

/** Tautkan organisasi bernama persis (>= 4 huruf) yang disebut di judul/isi; METI sendiri dilewati. */
function tautkan(rows) {
  const org = JSON.parse(readFileSync(AKAR + "public/data/organisasi.json", "utf8")).baris.filter((o) => o.nama && o.nama.length >= 4 && !/^METI$|Masyarakat Energi Terbarukan/i.test(o.nama));
  for (const r of rows) {
    const t = r.judul + " " + r.ringkasan + " " + r.isi.map((x) => x.p || x.k || x.h || "").join(" ");
    r.org_ids = org.filter((o) => new RegExp(`(^|[^\\p{L}\\p{N}])${o.nama.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^\\p{L}\\p{N}]|$)`, "u").test(t)).map((o) => o.id).slice(0, 6);
  }
}

async function utama() {
  const arg = (n) => process.argv.find((a) => a.startsWith("--" + n + "="))?.split("=")[1];
  const lama = existsSync(KELUAR) ? JSON.parse(readFileSync(KELUAR, "utf8")).baris : [];
  const baru = new Map(lama.map((x) => [x.id, x]));
  if (process.argv.includes("--meti")) for (const x of await panenMeti()) baru.set(x.id, x);
  if (process.argv.includes("--perbaiki")) { // ambil ulang liputan media yang tanggalnya kosong
    const kosong = [...baru.values()].filter((x) => x.jenis === "liputan_media" && !x.tanggal).map((x) => ({ url: x.url_sumber, judul: x.judul, terbit: "" }));
    for (const x of kosong) baru.delete(idMedia(x.url));
    for (const x of await panenMedia(kosong, 400)) baru.set(x.id, x);
  }
  if (process.argv.includes("--media")) for (const x of await panenMedia(kandidatMedia(arg("gdelt")), +arg("maks") || 400)) baru.set(x.id, x);
  const baris = [...baru.values()].sort((a, b) => b.tanggal.localeCompare(a.tanggal) || a.id.localeCompare(b.id));
  tautkan(baris);
  writeFileSync(KELUAR, JSON.stringify({ lapis: "publik", dibangun_pada: TGL, sumber: "metiires.or.id; liputan media (tautan, ringkasan singkat)", jumlah: baris.length, baris }, null, 1) + "\n");
  console.log(JENIS.map((j) => `${j}: ${baris.filter((x) => x.jenis === j).length}`).join(", "));
}

if (process.argv[1] === fileURLToPath(import.meta.url) && !process.argv.includes("--uji")) await utama();
