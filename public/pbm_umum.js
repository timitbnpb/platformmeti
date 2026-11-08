/* /panas-bumi: pembantu bersama semua tab. Data baru ada di panas_bumi.json (rujukan id + butir bersumber); data yang sudah ada
   (wkp, proyek_terpadu, pemasok_lain, isu, regulasi, organisasi, biaya_bangun) DIRUJUK saat runtime, tidak disalin. Berkas tak ada = null, tab tetap rapi. */
import { t, ada, tanggal } from "/i18n.js";
import { D as R, ex, bukti, luar, bendera, namaNegara, chip, warnaIdx, kosongTab, catatan, daftarCelah, urlGet, urlSet, num, esc, ikon, logoHtml } from "/rg3_umum.js";
import { tautOrg, tautProvinsi, tautRegulasi, siapTautan, naikkan } from "/inti/tautan.js";
import { tabel } from "/info_hijau.js";

export { t, ada, tanggal, ex, bukti, luar, bendera, namaNegara, chip, warnaIdx, kosongTab, catatan, daftarCelah, urlGet, urlSet, num, esc, ikon, logoHtml, tautOrg, tautProvinsi, tautRegulasi, siapTautan, naikkan, tabel };

export const B = {};
const BERKAS = { pb: "panas_bumi.json", wkp: "wkp.json", pt: "proyek_terpadu.json", lain: "global/pemasok_lain.json", isu: "isu.json", reg: "regulasi.json", org: "organisasi.json", bb: "biaya_bangun.json" };
export async function muat() {
  await Promise.all(Object.entries(BERKAS).map(async ([k, f]) => { try { const r = await fetch("/data/" + f, { credentials: "same-origin" }); B[k] = r.ok ? await r.json() : null; } catch { B[k] = null; } }));
  R.orgAda = new Set((B.org?.baris || []).map((b) => b.id));
  return B;
}
export const bahasa = () => (document.documentElement.lang === "en" ? "en" : "id");
export const tx = (o) => (o && typeof o === "object" ? o[bahasa()] || o.id || "" : o ?? "");
export const src = (id) => (B.pb?.sumber || []).find((s) => s.id === id) || null;
/** Lencana bukti satu butir: tingkat dari butir, penerbit + tanggal dari sumbernya. */
export const buktiS = (id, tingkat) => { const s = src(id); return bukti(tingkat || s?.tingkat_bukti, { sumber: s?.penerbit || "", tanggal: s?.tanggal_periksa || "", cara: s?.judul || "" }); };
export const sumberLink = (id) => { const s = src(id); return s ? luar(s.url, `${s.penerbit}, ${s.tahun}`) : ""; };
export const kakiSumber = (ids) => `<div class="pbm-kaki">${[...new Set(ids.filter(Boolean))].map((i) => `<span class="pbm-sumber">${sumberLink(i)}</span>`).join("")}</div>`;
export const orgBaris = (id) => (B.org?.baris || []).find((b) => b.id === id) || null;
export const orgNama = (id) => orgBaris(id)?.nama || id;
export const orgLogo = (id) => { const l = orgBaris(id)?.logo; return typeof l === "string" && l.startsWith("/img/") ? l : ""; };
export const orgSel = (id) => tautOrg(id, orgNama(id));
/** Sel organisasi berlogo (inisial bila logo tak ada). */
export const orgLogoSel = (id, nama) => `<span class="rg3-org">${logoHtml(id, nama || orgNama(id), orgLogo(id))}<span class="rg3-idk"><b>${id && R.orgAda?.has(id) ? tautOrg(id, nama || orgNama(id)) : esc(nama || id || "-")}</b></span></span>`;
export const proyekPB = () => (B.pt?.baris || []).filter((b) => b.tek === "panas-bumi");
export const proyekById = (id) => (B.pt?.baris || []).find((b) => b.id === id) || null;
export const nol = (v) => (v == null || !isFinite(v) ? "-" : v);
/** Sel pil berwarna stabil per nilai (status, jenis). */
export const pil = (awalan, k, ik) => chip("rg3-w" + warnaIdx(k), ik ? ikon(ik, 14) : "", ada(awalan + k) ? t(awalan + k) : String(k).replace(/[-_]/g, " "));
export const jumlahMw = (arr) => arr.reduce((s, x) => s + (x.mw || 0), 0);
export const gelap = () => (document.documentElement.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")) === "dark";
