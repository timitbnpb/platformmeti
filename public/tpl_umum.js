/* /transisi-pltu: pembantu bersama semua tab. Data baru: transisi_pltu.json; pltu.json, captive_power.json, pasar_listrik.json, energi_baru.json,
   isu.json, jetp_cipp.json, pembiayaan_luar.json, organisasi.json DIRUJUK saat runtime (tidak disalin). Berkas hilang = null, tab tetap rapi. */
import { t, ada, tanggal } from "/i18n.js";
import { D as R, ex, bukti, luar, chip, warnaIdx, kosongTab, catatan, daftarCelah, urlGet, urlSet, num, esc, ikon, cariSumber } from "/rg3_umum.js";
import { tautOrg, tautProvinsi, tautRegulasi, siapTautan, naikkan } from "/inti/tautan.js";
import { tipHtml, tabel, batangSvg, kolomSvg, legendaHtml } from "/info_hijau.js";

export { t, ada, tanggal, ex, bukti, luar, chip, warnaIdx, kosongTab, catatan, daftarCelah, urlGet, urlSet, num, esc, ikon, cariSumber, tautOrg, tautProvinsi, tautRegulasi, siapTautan, naikkan, tipHtml, tabel, batangSvg, kolomSvg, legendaHtml };

export const B = {};
const BERKAS = { tp: "transisi_pltu.json", pltu: "pltu.json", cap: "captive_power.json", pasar: "pasar_listrik.json", enb: "energi_baru.json", isu: "isu.json", jetp: "jetp_cipp.json", biaya: "global/pembiayaan_luar.json", bio: "bioenergi.json", reg: "regulasi.json", tk: "riset/tenaga_kerja.json", ruptl: "ruptl.json", org: "organisasi.json" };
export async function muat() {
  await Promise.all(Object.entries(BERKAS).map(async ([k, f]) => { try { const r = await fetch("/data/" + f, { credentials: "same-origin" }); B[k] = r.ok ? await r.json() : null; } catch { B[k] = null; } }));
  R.orgAda = new Set((B.org?.baris || []).map((b) => b.id));
  return B;
}
export const bahasa = () => (document.documentElement.lang !== "id" ? "en" : "id");
export const tx = (o) => (o && typeof o === "object" ? o[bahasa()] || o.id || "" : o ?? "");
export const src = (id) => (B.tp?.sumber || []).find((s) => s.id === id) || (B.pltu?.sumber || []).find((s) => s.id === id) || (B.pasar?.sumber || []).find((s) => s.id === id) || (B.enb?.sumber || []).find((s) => s.id === id) || null;
export const buktiS = (id, tingkat) => { const s = src(id); return bukti(tingkat || s?.tingkat_bukti, { sumber: s?.penerbit || "", tanggal: s?.tanggal_periksa || s?.tanggal || "" }); };
export const sumberLink = (id) => { const s = src(id); return s ? luar(s.url, `${s.penerbit}${s.tahun ? ", " + s.tahun : ""}`) : ""; };
export const kakiSumber = (ids) => `<div class="tpl-kaki">${[...new Set(ids.filter(Boolean))].map((i) => `<span class="tpl-sumber">${sumberLink(i)}</span>`).join("")}</div>`;
export const orgBaris = (id) => (B.org?.baris || []).find((b) => b.id === id) || null;
export const orgSel = (id, nama) => (id ? tautOrg(id, orgBaris(id)?.nama || nama || id) : esc(nama || "-"));
export const orgLogo = (id) => { const l = orgBaris(id)?.logo; return typeof l === "string" && l.startsWith("/img/") ? l : ""; };
export const pltuById = (id) => (B.pltu?.baris || []).find((b) => b.id === id) || null;
export const nolStrip = (v) => (v == null || !isFinite(v) ? "-" : v);
export const hipotesis = () => bukti("hipotesis", { sumber: "METI", cara: t("tpl.hip.cara") });
export const reg = (id) => (B.reg?.baris || []).find((r) => r.id === id) || null;
/** Pil berwarna stabil per nilai. */
export const pilJenis = (awalan, k, ik) => chip("rg3-w" + warnaIdx(k), ik ? ikon(ik, 14) : "", ada(awalan + k) ? t(awalan + k) : String(k).replace(/[-_]/g, " "));
export const juta = (n, d = 1) => (n == null ? "-" : num(n / 1e6, d));
