/* /lelang: data, label, dan sel bersama semua tab. Data statis /data/lelang.json (scripts/panen/lelang.mjs). */
import { t, ada, tanggal as tglId } from "/i18n.js";
import { esc, ikon } from "/inti/umum.js";
import { buktiHtml } from "/inti/bukti.js";
import { logoOrg } from "/inti/logo_org.js";
import { pilTek } from "/inti/ikon_tek.js";

export const D = {};
export const TAHAP = ["rencana", "pengumuman", "prakualifikasi", "penawaran", "pemenang", "ppa", "cod", "batal"];
export const SKEMA = ["lelang_terbuka", "pemilihan_langsung", "penunjukan_langsung", "kerja_sama_anak_usaha", "lelang_pemerintah", "tidak_dinyatakan"];
export const TEK = ["surya", "bayu", "hidro", "panas-bumi", "bioenergi", "penyimpanan", "campuran"];
const IK_TAHAP = { rencana: "kalender", pengumuman: "siaran", prakualifikasi: "daftar2", penawaran: "kartu", pemenang: "piala", ppa: "tag", cod: "petir", batal: "silang" };
const IK_SKEMA = { lelang_terbuka: "globe", pemilihan_langsung: "sasaran", penunjukan_langsung: "orang", kerja_sama_anak_usaha: "rantai", lelang_pemerintah: "gedung", tidak_dinyatakan: "tanya" };
export const IK_KAT = { pln: "petir", anak_usaha: "rantai", pemerintah: "gedung" };
export const ikTahap = (k) => IK_TAHAP[k] || "tanya";
export const ikSkema = (k) => IK_SKEMA[k] || "tanya";

export async function muat() {
  const ambil = async (f) => { try { const r = await fetch("/data/" + f, { credentials: "same-origin" }); return r.ok ? await r.json() : null; } catch { return null; } };
  const [lel, pel, dun] = await Promise.all([ambil("lelang.json"), ambil("peluang.json"), ambil("global/lelang_dunia.json")]);
  Object.assign(D, { lel, pel, dun });
  return D;
}
export const baris = () => D.lel?.putaran || [];
export const cariSumber = (id) => (D.lel?.sumber || []).find((s) => s.id === id) || null;

export const num = (n, d = 0) => (n == null ? "-" : new Intl.NumberFormat(document.documentElement.lang === "en" ? "en-US" : "id-ID", { maximumFractionDigits: d, minimumFractionDigits: 0 }).format(n));
export const kosong = '<span class="ih-kosong" title="-">-</span>';
export const bahasa = () => (document.documentElement.lang === "en" ? "en" : "id");
export const tglTeks = (tgl, presisi) => {
  if (!tgl) return "-";
  const [y, m, h] = String(tgl).split("-").map(Number), p = presisi || (h ? "hari" : m ? "bulan" : "tahun");
  if (p === "tahun" || !m) return String(y);
  return new Intl.DateTimeFormat(bahasa(), p === "hari" ? { day: "numeric", month: "short", year: "numeric" } : { month: "short", year: "numeric" }).format(new Date(Date.UTC(y, m - 1, h || 1)));
};
export const kapTeks = (p) => (p.kapasitas_mw != null ? `${num(p.kapasitas_mw, p.kapasitas_mw % 1 ? 1 : 0)} ${p.kapasitas_satuan || "MW"}` : "");
export const namaNegara = (iso) => { try { return new Intl.DisplayNames([bahasa()], { type: "region" }).of(String(iso).toUpperCase()); } catch { return String(iso || "").toUpperCase(); } };
export const bendera = (iso, w = 16) => (iso ? `<img class="lel-fl" src="/img/bendera/${esc(String(iso).toLowerCase())}.svg" alt="" width="${w}" height="${Math.round(w * 0.75)}" loading="lazy" data-galat="hapus">` : "");

/* ---------- pil ---------- */
const pil = (kelas, ik, teks) => `<span class="jm-pil-st lel-pil ${kelas}">${ikon(ik, 14).replace('class="jm-ik"', 'class="jm-ik jm-ikt-s"')}<span>${esc(teks)}</span></span>`;
export const pilTahap = (k) => pil("lel-th-" + k, ikTahap(k), t("lel.tahap." + k));
export const pilSkema = (k) => pil("lel-sk-" + k, ikSkema(k), t("lel.skema." + k));
export const pilKat = (k) => pil("lel-kt-" + k, IK_KAT[k] || "tanya", t("lel.kat." + k));
export const pilTeknologi = (k) => (k === "campuran" ? `<span class="jm-pil-tek jm-tek-lain">${esc(t("lel.tek.campuran"))}</span>` : pilTek(k));
export const labelTek = (k) => (k === "campuran" ? t("lel.tek.campuran") : ada("pj.tek." + k) ? t("pj.tek." + k) : k);

/* ---------- organisasi ---------- */
const inisial = (n) => String(n || "?").replace(/^PT\.?\s+/i, "").trim().charAt(0).toUpperCase();
export function logoSel(o, kelas = "lel-lg") {
  const u = logoOrg(o.org_id, o.nama, "")[0];
  return `<span class="${kelas}">${u ? `<img src="${esc(u)}" alt="" loading="lazy" decoding="async" data-galat="hapus">` : ""}<b aria-hidden="true">${esc(inisial(o.nama))}</b></span>`;
}
export function orgHtml(o) {
  const isi = `<span class="lel-org">${logoSel(o)}${bendera(o.negara, 14)}<span>${esc(o.nama)}</span></span>`;
  return o.org_id ? `<a class="lel-tt" href="/o/${esc(encodeURIComponent(o.org_id))}">${isi}</a>` : isi;
}
export const orgDaftar = (a, maks = 3) => (a?.length ? a.slice(0, maks).map(orgHtml).join("") + (a.length > maks ? `<small>+${a.length - maks}</small>` : "") : kosong);

/* ---------- tautan keluar ---------- */
export const proyekTaut = (ids) => (ids || []).map((id) => `<a class="ih-tautan" href="/p/${esc(encodeURIComponent(id))}">${esc(D.lel?.tautan?.proyek?.[id] || id)}</a>`).join(" ");
export const programTaut = (ids) => (ids || []).map((id) => `<a class="ih-tautan" href="/program/${esc(encodeURIComponent(id))}">${esc(D.lel?.tautan?.program?.[id] || id)}</a>`).join(" ");
export const regTaut = (ids) => (ids || []).map((id) => `<a class="ih-tautan" href="/regulasi?id=${esc(encodeURIComponent(id))}">${esc(D.lel?.tautan?.regulasi?.[id] || id)}</a>`).join(" ");
export const luar = (url, teks) => (/^https:\/\//.test(url || "") ? `<a class="ih-tautan lel-src" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(teks)}</a>` : esc(teks));
export function sumberSel(id, tingkat, tgl) {
  const s = cariSumber(id);
  return s ? `<span class="lel-sm">${luar(s.url, s.penerbit)}${buktiHtml(tingkat, { sumber: s.penerbit, tanggal: tgl || s.tanggal_ambil })}</span>` : kosong;
}
export const tglTanggal = (s) => (s ? tglId(String(s).slice(0, 10)) : "-");
