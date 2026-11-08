/* /jaringan: pembantu bersama semua tab. Memakai ulang pembantu /rantai-global (rg3_umum.js: bendera, logo, bukti, kerangka exhibit)
   dan memuat berkas data saat runtime; berkas yang belum ada menjadi null dan tab menampilkan keadaan kosong. */
import * as R from "/rg3_umum.js";
import { t } from "/i18n.js";

export const { ex, esc, ikon, num, bukti, luar, kosongTab, urlGet, urlSet, sumberBerkas, catatan, daftarCelah, bendera, namaNegara, logoHtml, namaOrg, orgHref, chip, warnaIdx, lbl, cariSumber, amanUrl } = R;
export { t };

export const D = {};
const BERKAS = {
  m: "/data/jaringan_modul.json", riset: "/data/riset/jaringan.json", curt: "/data/riset/curtailment.json", ps: "/data/riset/pumped_storage_offshore.json",
  ke: "/data/keandalan.json", pi: "/data/pendanaan_internasional.json", org: "/data/organisasi.json", lain: "/data/global/pemasok_lain.json",
};
export async function muatSemua() {
  await Promise.all(Object.entries(BERKAS).map(async ([k, f]) => {
    try { const r = await fetch(f, { credentials: "same-origin" }); D[k] = r.ok ? await r.json() : null; } catch { D[k] = null; }
  }));
  R.D.orgAda = new Set((D.org?.baris || []).map((b) => b.id)); // namaOrg/orgHref (rg3_umum) membaca himpunan ini
  return D;
}
export const berisi = (k, f = "baris") => Array.isArray(D[k]?.[f]) && D[k][f].length > 0;
/** Teks dua bahasa {id,en} milik data -> bahasa halaman. */
export const L = (o) => (o == null ? "" : typeof o === "string" ? o : o[document.documentElement.lang === "en" ? "en" : "id"] || o.id || "");
export const sumberId = (id) => (D.m?.sumber || []).find((s) => s.id === id) || null;
/** Lencana bukti dari sumber kurasi: tingkat dari butir, sumber/tanggal dari daftar sumber modul. */
export function buktiSumber(raw, sid, o = {}) {
  const s = sumberId(sid);
  return bukti(raw, { sumber: s?.penerbit || "", tanggal: o.tanggal || (s?.tahun ? String(s.tahun) : ""), cara: o.cara || "" });
}
export const sumberLink = (sid) => { const s = sumberId(sid); return s ? luar(s.url, `${s.penerbit}, ${s.tahun}`) : ""; };
/** Warna dari token CSS (untuk MapLibre yang tidak membaca var()). */
export const token = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
export const gelap = () => (document.documentElement.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")) === "dark";
export const chipStatus = (s) => chip("jr-st-" + s, "", lbl("jr.st.", s));
