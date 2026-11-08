/* /sampah-energi: pembantu bersama semua tab. Data baru ada di sampah_energi.json (rujukan id + butir bersumber); psel.json, global/pemasok_wte.json,
   proyek_terpadu.json, isu.json, regulasi.json, organisasi.json DIRUJUK saat runtime, tidak disalin. Berkas tak ada = null, tab tetap rapi. */
import { t, ada, tanggal } from "/i18n.js";
import { D as R, ex, bukti, luar, bendera, namaNegara, chip, warnaIdx, kosongTab, catatan, daftarCelah, urlGet, urlSet, num, esc, ikon, logoHtml } from "/rg3_umum.js";
import { tautOrg, tautProvinsi, tautRegulasi, tautProyek, siapTautan, naikkan } from "/inti/tautan.js";
import { tabel, batangSvg, tipHtml, legendaHtml } from "/info_hijau.js";

export { t, ada, tanggal, ex, bukti, luar, bendera, namaNegara, chip, warnaIdx, kosongTab, catatan, daftarCelah, urlGet, urlSet, num, esc, ikon, logoHtml, tautOrg, tautProvinsi, tautRegulasi, tautProyek, siapTautan, naikkan, tabel, batangSvg, tipHtml, legendaHtml };

export const B = {};
const BERKAS = { sw: "sampah_energi.json", psel: "psel.json", wte: "global/pemasok_wte.json", pt: "proyek_terpadu.json", isu: "isu.json", reg: "regulasi.json", org: "organisasi.json" };
export async function muat() {
  await Promise.all(Object.entries(BERKAS).map(async ([k, f]) => { try { const r = await fetch("/data/" + f, { credentials: "same-origin" }); B[k] = r.ok ? await r.json() : null; } catch { B[k] = null; } }));
  R.orgAda = new Set((B.org?.baris || []).map((b) => b.id));
  return B;
}
export const bahasa = () => (document.documentElement.lang !== "id" ? "en" : "id");
export const tx = (o) => (o && typeof o === "object" ? o[bahasa()] || o.id || "" : o ?? "");
export const src = (id) => (B.sw?.sumber || []).find((s) => s.id === id) || null;
/** Lencana bukti satu butir: tingkat dari butir, penerbit + tanggal dari sumbernya. */
export const buktiS = (id, tingkat) => { const s = src(id), k = tingkat || s?.tingkat_bukti; return bukti(k === "editorial" ? "kajian" : k, { sumber: s?.penerbit || "", tanggal: s?.tanggal_periksa || "", cara: s?.judul || "" }); };
export const sumberLink = (id) => { const s = src(id); return s ? luar(s.url, `${s.penerbit}, ${s.tahun}`) : ""; };
export const kakiSumber = (ids) => `<div class="swe-kaki">${[...new Set(ids.filter(Boolean))].map((i) => `<span class="swe-sumber">${sumberLink(i)}</span>`).join("")}</div>`;
export const orgBaris = (id) => (B.org?.baris || []).find((b) => b.id === id) || null;
export const orgNama = (id) => orgBaris(id)?.nama || id;
export const orgLogo = (id) => { const l = orgBaris(id)?.logo; return typeof l === "string" && l.startsWith("/img/") ? l : ""; };
/** Sel organisasi berlogo (inisial bila logo tak ada). */
export const orgLogoSel = (id, nama) => `<span class="rg3-org">${logoHtml(id, nama || orgNama(id), orgLogo(id))}<span class="rg3-idk"><b>${id && R.orgAda?.has(id) ? tautOrg(id, nama || orgNama(id)) : esc(nama || id || "-")}</b></span></span>`;
export const pselRows = () => B.psel?.baris || [];
export const pselById = (id) => pselRows().find((b) => b.id === id) || null;
export const proyekById = (id) => (B.pt?.baris || []).find((b) => b.id === id) || null;
export const statusDari = (r) => r.status || "tidak-diketahui";
export const pertama = (a) => (Array.isArray(a) && a.length ? a[0] : null);
export const wteById = (id) => (B.wte?.baris || []).find((b) => b.id === id) || null;
export const negaraIso = (r) => String(r || "").toLowerCase();
export const gelap = () => (document.documentElement.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")) === "dark";
/** Pil: warna semantik untuk status dikenal (ok/info/warn/bad), selain itu warna stabil per nilai. */
const SEM = { beroperasi: "ok", konstruksi: "info", rencana: "warn", aktif: "bad", berlaku: "ok", dicabut: "x", "tidak-diketahui": "x", "perlu-sumber": "x", x: "x", resmi: "ok", media: "info" };
export const pil = (awalan, k, ik) => chip(SEM[k] ? "swe-sem-" + SEM[k] : "rg3-w" + warnaIdx(k), ik ? ikon(ik, 14) : "", ada(awalan + k) ? t(awalan + k) : String(k).replace(/[-_]/g, " "));
/** Kunci wilayah dua digit dari kode BPS kota/kabupaten. */
export const kodeProv = (r) => String(r.kode_bps || "").slice(0, 2);
