/* /rantai-global: pembantu bersama semua tab (data tahan-kosong, bendera, logo, label bukti, URL berbagi, sel umum).
   Semua berkas data dibaca saat runtime; berkas yang belum ada/kosong menjadi null dan tab menampilkan keadaan kosong rapi. */
import { t, ada, tanggal } from "/i18n.js";
import { esc, ikon } from "/inti/umum.js";
import { buktiHtml } from "/inti/bukti.js";
import { logoOrg } from "/inti/logo_org.js";
import { ikonTek } from "/inti/ikon_tek.js";
import { exHtml, sumberHtml } from "/inti/komponen.js";
import { aksiHtml } from "/inti/aksi_ex.js";
import { num } from "/analisis.js";

export const D = {};
const BERKAS = {
  surya: "global/pemasok_surya.json", wte: "global/pemasok_wte.json", lain: "global/pemasok_lain.json", pelaku: "global/pelaku_global.json",
  produk: "global/produk.json", harga: "global/benchmark_harga.json", logistik: "global/logistik.json", kebijakan: "global/kebijakan_dagang.json",
  pabrik: "global/pabrik_dunia.json", tren: "global/teknologi_tren.json", bahan: "global/bahan_baku.json", neraca: "global/neraca_pasokan.json",
  perjanjian: "global/perjanjian_dagang.json", radar: "global/radar_rantai.json", esg: "global/esg_rantai.json", purnajual: "global/purnajual.json",
  simulasi: "global/simulasi_tkdn.json", psel: "psel.json", tkdnProduk: "tkdn_produk.json", dagang: "dagang_komponen.json", rantai: "rantai_pasok.json",
  hargaKomp: "harga_komponen.json", org: "organisasi.json",
};
/** Muat semua berkas paralel; gagal/tidak ada/bukan JSON = null (tidak melempar). */
export async function muatSemua() {
  await Promise.all(Object.entries(BERKAS).map(async ([k, f]) => {
    try { const r = await fetch("/data/" + f, { credentials: "same-origin" }); D[k] = r.ok ? await r.json() : null; } catch { D[k] = null; }
  }));
  D.orgAda = new Set((D.org?.baris || []).map((b) => b.id));
  return D;
}
/** Berkas ada dan membawa baris. */
export const berisi = (k, f = "baris") => Array.isArray(D[k]?.[f]) && D[k][f].length > 0;
export const cariSumber = (berkas, id) => (berkas?.sumber || []).find((s) => s.id === id) || null;

/* ---------- negara ---------- */
export const namaNegara = (iso) => { try { return new Intl.DisplayNames([document.documentElement.lang || "id"], { type: "region" }).of(String(iso).toUpperCase()) || String(iso).toUpperCase(); } catch { return String(iso || "").toUpperCase(); } };
export const bendera = (iso, w = 18) => (iso ? `<img class="rg3-fl" src="/img/bendera/${esc(String(iso).toLowerCase())}.svg" alt="" width="${w}" height="${Math.round(w * 0.75)}" loading="lazy" data-galat="hapus">` : ikon("globe", w));
export const negaraSel = (iso, w = 18) => `<span class="rg3-neg">${bendera(iso, w)}<span>${esc(namaNegara(iso))}</span></span>`;
/* titik tengah negara [lon, lat] untuk peta agregat */
export const PUSAT = { cn: [104, 35], id: [118, -2], vn: [106, 16], my: [102, 4], th: [101, 15], kh: [105, 12.5], sg: [103.8, 1.35], kr: [127.8, 36], jp: [138, 36], in: [78, 22], us: [-98, 39], de: [10.4, 51], eu: [10, 50], ch: [8.2, 46.8], dk: [10, 56], fr: [2, 46.5], gb: [-2, 54], es: [-3.7, 40], at: [14.5, 47.5], no: [9, 61], fi: [26, 64], ca: [-106, 56], au: [134, -25], tw: [121, 23.7], il: [35, 31.5], sa: [45, 24] };

/* ---------- organisasi: logo dan tautan ---------- */
export const inisial = (n) => String(n || "?").replace(/^PT\s+/i, "").trim().charAt(0).toUpperCase();
export function logoHtml(id, nama, logo, kelas = "rg3-lg") {
  const u = logoOrg(id, nama, typeof logo === "string" ? logo : logo?.url || "")[0]; /* logo bisa berupa objek {url, sumber_url, ...} */
  return `<span class="${kelas}">${u ? `<img src="${esc(u)}" alt="" loading="lazy" decoding="async" data-galat="hapus">` : ""}<b aria-hidden="true">${esc(inisial(nama))}</b></span>`;
}
export const orgHref = (id) => (id && D.orgAda?.has(id) ? "/o/" + encodeURIComponent(id) : "");
export const amanUrl = (u) => (/^https?:\/\//i.test(u || "") ? u : "");
/** Nama organisasi sebagai tautan /o/ (bila halamannya ada), kalau tidak teks biasa. */
export const namaOrg = (id, nama) => { const h = orgHref(id); return h ? `<a class="rg3-tautan" href="${h}">${esc(nama)}</a>` : `<span>${esc(nama)}</span>`; };
export const luar = (url, teks) => (amanUrl(url) ? `<a class="rg3-tautan" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(teks)}</a>` : esc(teks));

/* ---------- teknologi ---------- */
export const WARNA_TEK = { surya: "surya", penyimpanan: "simpan", bayu: "bayu", hidro: "hidro", "panas-bumi": "panas", hidrogen: "hidrogen", jaringan: "jaringan", bioenergi: "bio", "biomassa-sampah": "sampah" };
export const chip = (kelas, ik, teks) => `<span class="rg3-chip ${kelas}">${ik}<span>${esc(teks)}</span></span>`;
/* warna stabil per nilai (hash teks -> salah satu delapan token), dipakai chip segmen/jenis agar tiap nilai berbeda warna */
export const warnaIdx = (k) => { let h = 0; for (const c of String(k)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h % 8; };
/** Label dari kamus (awalan + kunci) dengan jatuhan ke teks kunci bila belum ada. */
export const lbl = (awalan, k) => (ada(awalan + k) ? t(awalan + k) : String(k).replace(/[-_]/g, " "));
export const labelSeg = (k) => lbl("rg3.seg.", k);
export const chipSeg = (k) => chip("rg3-w" + warnaIdx(k), "", labelSeg(k));
export const chipTek = (k) => chip("rg3-tek-" + (WARNA_TEK[k] || "jaringan"), ikonTek(k).replace('class="jm-ikt"', 'class="jm-ikt jm-ikt-s"'), t("rg3.tek." + k));

/* ---------- label bukti ---------- */
const PETA = { resmi: "resmi", media: "media", est: "est", estimasi: "est", hipotesis: "hipotesis", hip: "hipotesis", "kata-pihak": "kata-pihak", kajian: "kajian", "via-pihak-ketiga": "via-pihak-ketiga", agregator: "via-pihak-ketiga", "situs-sendiri": "via-pihak-ketiga", cuplikan: "via-pihak-ketiga", "perlu-tinjau": "tinjau" };
/** raw -> kode buktiHtml; "Data" memakai tingkat sumbernya; belum-bersumber/kosong -> "". */
export const kodeBukti = (raw, tingkatSumber) => { const k = String(raw ?? "").toLowerCase(); return k === "data" ? PETA[String(tingkatSumber || "").toLowerCase()] || "media" : PETA[k] || ""; };
export function bukti(raw, { sumber = "", tanggal: tg = "", cara = "", tingkatSumber = "" } = {}) {
  const k = kodeBukti(raw, tingkatSumber);
  return k ? buktiHtml(k, { sumber, tanggal: tg, cara }) : `<span class="jm-pil rg3-belum">${ikon("tanya", 14)}<span>${esc(t("rg3.belum"))}</span></span>`;
}
/** Angka berlabel bukti: nilai tebal + pil bukti di sebelahnya. */
export const angkaBukti = (teks, raw, o = {}) => `<span class="rg3-ab"><b>${esc(teks)}</b>${bukti(raw, o)}</span>`;
export const sumberTeks = (s) => (s ? `${s.penerbit || s.judul}${s.tahun ? ", " + s.tahun : ""}` : "");

/* ---------- kerangka ---------- */
export const ex = (o) => exHtml({ tingkat: "h2", ...o, aksiHtml: o.aksi === false ? "" : aksiHtml({ csv: false, ...(o.aksi || {}) }) });
/** Daftar sumber berkas data sebagai butir "i" (sumberHtml) di kepala exhibit. */
export function sumberBerkas(berkas, ids) {
  const l = (berkas?.sumber || []).filter((s) => !ids || ids.includes(s.id)).slice(0, 8);
  return l.length ? sumberHtml(l.map((s) => `<span>${luar(s.url, sumberTeks(s))}</span>`).join(" ")) : "";
}
export const kosongTab = (kunci) => `<div class="jm-kosong rg3-kosong">${ikon("info", 32)}<p>${esc(t(kunci))}</p></div>`;
export const catatan = (kunci, par) => `<p class="jm-bantu ih-catatan">${esc(t(kunci, par))}</p>`;
export const daftarCelah = (arr) => (arr?.length ? `<ul class="rg3-celah">${arr.map((c) => `<li>${ikon("tanya", 16)}<span>${esc(c)}</span></li>`).join("")}</ul>` : "");

/* ---------- URL berbagi (?tab=&...) ---------- */
export const urlGet = (k) => new URLSearchParams(location.search).get(k) || "";
export function urlSet(o) {
  const p = new URLSearchParams(location.search);
  for (const [k, v] of Object.entries(o)) { if (v === "" || v == null) p.delete(k); else p.set(k, String(v)); }
  const s = p.toString();
  history.replaceState(null, "", location.pathname + (s ? "?" + s : "") + location.hash);
}
export { num, t, esc, ikon, tanggal };
