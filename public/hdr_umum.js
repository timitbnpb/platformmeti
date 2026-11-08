/* /hidro: pembantu bersama semua tab. Data baru ada di hidro.json (rujukan id + butir bersumber); data yang sudah ada (proyek_terpadu, air_energi, riset pumped storage,
   ruptl, biaya_bangun, pendanaan, regulasi, isu, organisasi, pemasok_lain, topik/hidro) DIRUJUK saat runtime, tidak disalin. Berkas tak ada = null, tab tetap rapi. */
import { t, ada, tanggal } from "/i18n.js";
import { D as R, ex, bukti, luar, bendera, namaNegara, chip, warnaIdx, kosongTab, catatan, daftarCelah, urlGet, urlSet, num, esc, ikon, logoHtml } from "/rg3_umum.js";
import { tautOrg, tautProvinsi, tautRegulasi, siapTautan, naikkan } from "/inti/tautan.js";
import { tabel, batangSvg, kolomSvg, tipHtml, legendaHtml } from "/info_hijau.js";
import { crf, lcoe, kelasMw } from "/hdr_hitung.js";

export { t, ada, tanggal, ex, bukti, luar, bendera, namaNegara, chip, warnaIdx, kosongTab, catatan, daftarCelah, urlGet, urlSet, num, esc, ikon, logoHtml, tautOrg, tautProvinsi, tautRegulasi, siapTautan, naikkan, tabel, batangSvg, kolomSvg, tipHtml, legendaHtml, crf, lcoe, kelasMw };

export const B = {};
const BERKAS = { hd: "hidro.json", pt: "proyek_terpadu.json", ae: "air_energi.json", ps: "riset/pumped_storage_offshore.json", rup: "ruptl.json", bb: "biaya_bangun.json", pend: "pendanaan.json", lain: "global/pemasok_lain.json", isu: "isu.json", reg: "regulasi.json", org: "organisasi.json", tp: "topik/hidro.json" };
export async function muat() {
  await Promise.all(Object.entries(BERKAS).map(async ([k, f]) => { try { const r = await fetch("/data/" + f, { credentials: "same-origin" }); B[k] = r.ok ? await r.json() : null; } catch { B[k] = null; } }));
  R.orgAda = new Set((B.org?.baris || []).map((b) => b.id));
  return B;
}
export const bahasa = () => (document.documentElement.lang === "en" ? "en" : "id");
export const tx = (o) => (o && typeof o === "object" ? o[bahasa()] || o.id || "" : o ?? "");
export const src = (id) => (B.hd?.sumber || []).find((s) => s.id === id) || null;
/** Lencana bukti satu butir: tingkat dari butir, penerbit + tanggal dari sumbernya. */
export const buktiS = (id, tingkat) => { const s = src(id), k = tingkat || s?.tingkat_bukti; return bukti(k === "editorial" ? "kajian" : k, { sumber: s?.penerbit || "", tanggal: s?.tanggal_periksa || "", cara: s?.judul || "" }); };
export const sumberLink = (id) => { const s = src(id); return s ? luar(s.url, `${s.penerbit}, ${s.tahun}`) : ""; };
export const kakiSumber = (ids) => `<div class="hdr-kaki">${[...new Set(ids.filter(Boolean))].map((i) => `<span class="hdr-sumber">${sumberLink(i)}</span>`).join("")}</div>`;
export const orgBaris = (id) => (B.org?.baris || []).find((b) => b.id === id) || null;
export const orgNama = (id) => orgBaris(id)?.nama || id;
export const orgLogo = (id) => { const l = orgBaris(id)?.logo; return typeof l === "string" && l.startsWith("/img/") ? l : ""; };
/** Sel organisasi berlogo (inisial bila logo tak ada). */
export const orgLogoSel = (id, nama) => `<span class="rg3-org">${logoHtml(id, nama || orgNama(id), orgLogo(id))}<span class="rg3-idk"><b>${id && R.orgAda?.has(id) ? tautOrg(id, nama || orgNama(id)) : esc(nama || id || "-")}</b></span></span>`;
export const proyekHidro = () => { const batas = B.hd?.rujukan?.kelas_batas_mw ?? 10; return (B.pt?.baris || []).filter((b) => b.tek === "hidro").map((b) => ({ ...b, kelas: kelasMw(b.mw, batas) })); };
export const proyekById = (id) => (B.pt?.baris || []).find((b) => b.id === id) || null;
export const jumlahMw = (arr) => arr.reduce((s, x) => s + (x.mw || 0), 0);
/** Nama provinsi dari kode BPS, dibaca dari tabel provinsi topik hidro. */
export const namaProv = (kode) => (B.tp?.bab?.["8"]?.baris || []).find((r) => r.kode === String(kode))?.prov || String(kode || "-");
const SEM = { beroperasi: "ok", berlaku: "ok", berhasil: "ok", selesai: "ok", konstruksi: "info", izin: "info", berjalan: "info", diubah: "warn", rencana: "warn", ditunda: "warn", mereda: "info", aktif: "bad", mundur: "warn", mati: "bad", mangkrak: "bad", dibatalkan: "bad", batal: "bad", dicabut: "bad", "tidak-diketahui": "x", x: "x" };
/** Sel pil: warna semantik untuk status dikenal (ok/info/warn/bad), selain itu warna stabil per nilai. */
export const pil = (awalan, k, ik) => chip(SEM[k] ? "hdr-sem-" + SEM[k] : "rg3-w" + warnaIdx(k), ik ? ikon(ik, 14) : "", ada(awalan + k) ? t(awalan + k) : String(k).replace(/[-_]/g, " "));
export const gelap = () => (document.documentElement.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")) === "dark";
