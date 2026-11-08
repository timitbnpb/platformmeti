/* Pembantu bersama layar: esc, nanti, debounce, api, keadaan komponen (DS §6.0). */
import { t, ada } from "/i18n.js";

/* en/em dash dari data JSON dinormalkan jadi "-" di satu tempat (pemilik 8 Nov 2026) */
export const esc = (s) => String(s ?? "").replace(/[\u2013\u2014]/g, "-").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/** Foto berita lewat Worker (tanpa host luar di CSP): peta = berita_foto.json, kosong bila id tak punya foto. */
export const fotoBerita = (peta, id) => (peta && peta[id] ? "/api/foto-berita/" + encodeURIComponent(id) : "");

/** Serahkan kerja berat SESUDAH satu bingkai tercat (dua rAF; setTimeout jaring untuk tab tersembunyi). INP.md kelas kelima. */
export function nanti(fn) {
  let sudah = false;
  const jalan = () => { if (!sudah) { sudah = true; fn(); } };
  requestAnimationFrame(() => requestAnimationFrame(jalan));
  setTimeout(jalan, 120);
}

/** Debounce ketik 120 ms (DS §6.0). */
export function debounce(fn, ms = 120) {
  let h;
  return (...a) => { clearTimeout(h); h = setTimeout(() => fn(...a), ms); };
}

export const ikon = (nama, ukuran = 20) => `<svg class="jm-ik" width="${ukuran}" height="${ukuran}" aria-hidden="true" focusable="false"><use href="/img/ikon.svg?v=2#i-${nama}"/></svg>`;

/** Hanya jalur relatif di situs sendiri (cegah pengalihan terbuka, KPV §4). */
export function amanKe(ke) {
  return typeof ke === "string" && /^\/(?![/\\])/.test(ke) && !/[\u0000-\u001f]/.test(ke) ? ke : "/";
}

/* ---------- API (DT §4.3) ---------- */

export class GalatApi extends Error {
  constructor(kode, status) { super(kode); this.kode = kode; this.status = status; }
}
const KODE_STATUS = { 401: "belum-masuk", 403: "dilarang", 404: "tidak-ada", 405: "metode", 409: "konflik", 413: "terlalu-besar", 422: "salah-masukan", 429: "terlalu-sering", 502: "layanan", 503: "fitur_belum_aktif" };

export async function api(jalur, { metode = "GET", badan, signal } = {}) {
  const opsi = { method: metode, credentials: "same-origin", headers: { "x-pb": "1" }, signal };
  if (badan !== undefined) { opsi.headers["content-type"] = "application/json"; opsi.body = JSON.stringify(badan); }
  let r;
  try { r = await fetch(jalur, opsi); } catch (e) {
    if (e.name === "AbortError") throw e;
    throw new GalatApi("jaringan", 0);
  }
  let d = null;
  try { d = await r.json(); } catch (e) {}
  if (!r.ok) {
    const mentah = d && (typeof d.kode === "string" ? d.kode : typeof d.galat === "string" ? d.galat : "");
    throw new GalatApi(/^[a-z][a-z0-9_-]{1,40}$/.test(mentah) ? mentah : KODE_STATUS[r.status] || "umum", r.status);
  }
  return d;
}

/** Kode galat string -> kalimat dari kamus; tidak pernah pesan mentah server. */
export function galatTeks(kode) {
  const k = "galat." + kode;
  return ada(k) ? t(k) : t("galat.umum");
}

/* ---------- keadaan komponen ---------- */

export const hantuHtml = (baris = 4) => `<div class="jm-hantu" role="status" aria-label="${esc(t("jm.memuat"))}">${"<i></i>".repeat(baris)}</div>`;

export function kosongHtml(kunciPesan, aksi) {
  const tombol = aksi ? `<button type="button" class="jm-tbl" data-aksi="${esc(aksi.data)}">${esc(t(aksi.kunci))}</button>` : "";
  return `<div class="jm-kosong">${ikon("info", 32)}<p>${esc(t(kunciPesan))}</p>${tombol}</div>`;
}

export const galatHtml = (kode) => `<div class="jm-galat" role="alert">${ikon("peringatan", 32)}<p>${esc(galatTeks(kode))}</p><button type="button" class="jm-tbl" data-aksi="ulang">${esc(t("jm.galat.ulang"))}</button></div>`;

/** Pesan dalam formulir: jenis "galat" atau "ok". */
export function pesanHtml(jenis, teks) {
  const role = jenis === "galat" ? "alert" : "status";
  return `<div class="jm-pesan jm-pesan-${jenis}" role="${role}">${ikon(jenis === "galat" ? "peringatan" : "centang")}<span>${esc(teks)}</span></div>`;
}

/** Judul berhuruf Kapital Tiap Kata -> huruf kalimat (singkatan <=5 huruf kapital, "Indonesia", dan kata pertama dijaga). Judul yang sudah wajar tidak diubah. */
export function judulHuruf(v) {
  const s = String(v ?? "");
  const kata = s.split(/\s+/).filter((w) => /^[A-Z][a-z]/.test(w));
  if (kata.length < 3 || kata.length < s.split(/\s+/).length * 0.6) return s;
  return s.split(/(\s+)/).map((w, i) => (i === 0 || /^[A-Z0-9]{2,5}\W*$/.test(w) || /^(Indonesia|Republik|Papua|Jawa|Sumatera|Kalimantan|Sulawesi)/.test(w) || !/^[A-Z][a-z]/.test(w) ? w : w[0].toLowerCase() + w.slice(1))).join("");
}
