/* /angin: pembantu bersama semua tab. Data baru ada di angin.json (rujukan id + butir bersumber); data yang sudah ada (proyek_terpadu, ruptl, lelang, regulasi, isu,
   organisasi, global/pemasok_lain, global/logistik, global/potensi_atlas, peluang, dagang_komponen, topik/bayu) DIRUJUK saat runtime, tidak disalin.
   Tiap berkas dimuat malas oleh tab yang memerlukannya; yang tidak ada menjadi null dan tab menampilkan keadaan kosong. */
import { t, ada, tanggal } from "/i18n.js";
import { D as R, ex, bukti, luar, bendera, namaNegara, chip, warnaIdx, kosongTab, catatan, daftarCelah, urlGet, urlSet, num, esc, ikon, logoHtml } from "/rg3_umum.js";
import { tautOrg, tautProvinsi, tautRegulasi, siapTautan, naikkan } from "/inti/tautan.js";
import { tabel, batangSvg, kolomSvg, tipHtml } from "/info_hijau.js";

export { t, ada, tanggal, ex, bukti, luar, bendera, namaNegara, chip, warnaIdx, kosongTab, catatan, daftarCelah, urlGet, urlSet, num, esc, ikon, logoHtml, tautOrg, tautProvinsi, tautRegulasi, siapTautan, naikkan, tabel, batangSvg, kolomSvg, tipHtml };

export const B = {};
const BERKAS = { ang: "angin.json", pt: "proyek_terpadu.json", ruptl: "ruptl.json", lain: "global/pemasok_lain.json", isu: "isu.json", reg: "regulasi.json", org: "organisasi.json", lel: "lelang.json", log: "global/logistik.json", atlas: "global/potensi_atlas.json", pel: "peluang.json", dk: "dagang_komponen.json", tb: "topik/bayu.json" };
const janji = {};
/** Muat berkas bernama (kunci BERKAS) sekali; gagal = null. Mengisi B dan R.orgAda. */
export function muat(kunci) {
  return Promise.all(kunci.map((k) => (janji[k] ||= fetch("/data/" + BERKAS[k], { credentials: "same-origin" }).then((r) => (r.ok ? r.json() : null)).catch(() => null).then((v) => { B[k] = v; if (k === "org") R.orgAda = new Set((v?.baris || []).map((b) => b.id)); return v; }))));
}
export const bahasa = () => (document.documentElement.lang !== "id" ? "en" : "id");
export const tx = (o) => (o && typeof o === "object" ? o[bahasa()] || o.id || "" : o ?? "");
export const src = (id) => (B.ang?.sumber || []).find((s) => s.id === id) || null;
/** Lencana bukti satu butir: tingkat dari butir, penerbit + tanggal dari sumbernya. */
export const buktiS = (id, tingkat) => { const s = src(id), k = tingkat || s?.tingkat_bukti; return bukti(k === "editorial" ? "kajian" : k, { sumber: s?.penerbit || "", tanggal: s?.tanggal_periksa || "", cara: s?.judul || "" }); };
export const sumberLink = (id) => { const s = src(id); return s ? luar(s.url, `${s.penerbit}, ${s.tahun}`) : ""; };
export const kakiSumber = (ids) => `<div class="ang-kaki">${[...new Set(ids.filter(Boolean))].map((i) => `<span class="ang-sumber">${sumberLink(i)}</span>`).join("")}</div>`;
export const orgBaris = (id) => (B.org?.baris || []).find((b) => b.id === id) || null;
export const orgNama = (id) => orgBaris(id)?.nama || id;
export const orgLogo = (id) => { const l = orgBaris(id)?.logo; return typeof l === "string" && l.startsWith("/img/") ? l : ""; };
/** Sel organisasi berlogo (inisial bila logo tak ada). */
export const orgLogoSel = (id, nama) => `<span class="rg3-org">${logoHtml(id, nama || orgNama(id), orgLogo(id))}<span class="rg3-idk"><b>${id && R.orgAda?.has(id) ? tautOrg(id, nama || orgNama(id)) : esc(nama || id || "-")}</b></span></span>`;
export const proyekBayu = () => (B.pt?.baris || []).filter((b) => b.tek === "bayu");
export const proyekById = (id) => (B.pt?.baris || []).find((b) => b.id === id) || null;
export const kasusTopik = (id) => [...(B.tb?.bab?.["39"]?.butir || []), ...(B.tb?.bab?.["40"]?.butir || [])].find((k) => k.id === id) || null;
/** Sel pil: warna semantik untuk status dikenal (ok/info/warn/bad), selain itu warna stabil per nilai. */
const SEM = { beroperasi: "ok", berlaku: "ok", konstruksi: "info", izin: "info", pemenang: "ok", cod: "ok", diubah: "warn", rencana: "warn", ditunda: "warn", mundur: "warn", aktif: "bad", mati: "bad", mereda: "info", dibatalkan: "bad", dicabut: "bad", berhasil: "ok", info: "info", "tidak-diketahui": "x", x: "x" };
export const pil = (awalan, k, ik) => chip(SEM[k] ? "ang-sem-" + SEM[k] : "rg3-w" + warnaIdx(k), ik ? ikon(ik, 14) : "", ada(awalan + k) ? t(awalan + k) : String(k).replace(/[-_]/g, " "));
export const jumlahMw = (arr) => arr.reduce((s, x) => s + (x.mw || 0), 0);
export const gelap = () => (document.documentElement.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")) === "dark";
