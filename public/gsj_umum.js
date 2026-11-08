/* /gas: pembantu bersama semua tab. Data baru ada di gas.json (rujukan id + butir bersumber); organisasi, regulasi, isu, dan energi baru DIRUJUK saat runtime,
   tidak disalin. Berkas tak ada = null, tab tetap rapi. */
import { t, ada, tanggal } from "/i18n.js";
import { D as R, ex, bukti, luar, chip, warnaIdx, kosongTab, catatan, daftarCelah, urlGet, urlSet, num, esc, ikon, logoHtml } from "/rg3_umum.js";
import { tautOrg, tautRegulasi, siapTautan, naikkan } from "/inti/tautan.js";
import { tabel, batangSvg, tipHtml } from "/info_hijau.js";

export { t, ada, tanggal, ex, bukti, luar, chip, warnaIdx, kosongTab, catatan, daftarCelah, urlGet, urlSet, num, esc, ikon, logoHtml, tautOrg, tautRegulasi, siapTautan, naikkan, tabel, batangSvg, tipHtml };

export const B = {};
const BERKAS = { gs: "gas.json", isu: "isu.json", reg: "regulasi.json", org: "organisasi.json", enb: "energi_baru.json", pi: "pendanaan_internasional.json" };
export async function muat() {
  await Promise.all(Object.entries(BERKAS).map(async ([k, f]) => { try { const r = await fetch("/data/" + f, { credentials: "same-origin" }); B[k] = r.ok ? await r.json() : null; } catch { B[k] = null; } }));
  R.orgAda = new Set((B.org?.baris || []).map((b) => b.id));
  return B;
}
export const bahasa = () => (document.documentElement.lang === "en" ? "en" : "id");
export const tx = (o) => (o && typeof o === "object" ? o[bahasa()] || o.id || "" : o ?? "");
export const src = (id) => (B.gs?.sumber || []).find((s) => s.id === id) || null;
/** Lencana bukti satu butir: tingkat dari butir, penerbit + tanggal dari sumbernya. */
export const buktiS = (id, tingkat) => { const s = src(id), k = tingkat || s?.tingkat_bukti; return bukti(k === "editorial" ? "kajian" : k, { sumber: s?.penerbit || "", tanggal: s?.tanggal_periksa || "", cara: s?.judul || "" }); };
export const sumberLink = (id) => { const s = src(id); return s ? luar(s.url, s.tahun ? `${s.penerbit}, ${s.tahun}` : s.penerbit) : ""; };
export const kakiSumber = (ids) => `<div class="gsj-kaki">${[...new Set(ids.filter(Boolean))].map((i) => `<span class="gsj-sumber">${sumberLink(i)}</span>`).join("")}</div>`;
export const orgBaris = (id) => (B.org?.baris || []).find((b) => b.id === id) || null;
export const orgNama = (id, nama) => orgBaris(id)?.nama || nama || id || "";
export const orgLogo = (id) => { const l = orgBaris(id)?.logo; return typeof l === "string" && l.startsWith("/img/") ? l : ""; };
/** Sel organisasi berlogo; id kosong = nama polos berinisial. */
export const orgLogoSel = (id, nama) => `<span class="rg3-org">${logoHtml(id, nama || orgNama(id), id ? orgLogo(id) : "")}<span class="rg3-idk"><b>${id && R.orgAda?.has(id) ? tautOrg(id, nama || orgNama(id)) : esc(nama || id || "-")}</b></span></span>`;
export const nol = (v) => (v == null || !isFinite(v) ? "-" : v);
/** Pil: warna semantik untuk status dikenal, selain itu warna stabil per nilai. */
const SEM = { beroperasi: "ok", berlaku: "ok", ditetapkan: "ok", konstruksi: "info", mereda: "info", rencana: "warn", tender: "warn", belum: "warn", aktif: "bad", "tidak-diketahui": "x", x: "x" };
export const pil = (awalan, k, ik) => chip(SEM[k] ? "gsj-sem-" + SEM[k] : "rg3-w" + warnaIdx(k), ik ? ikon(ik, 14) : "", ada(awalan + k) ? t(awalan + k) : String(k).replace(/[-_]/g, " "));
export const daftarButir = (arr, ik = "info") => `<ul class="gsj-daftar">${arr.map((x) => `<li>${ikon(ik, 18)}<div><p>${esc(tx(x.teks))}</p>${buktiS(x.sumber_id, x.tingkat_bukti)}</div></li>`).join("")}</ul>`;
/** Kartu angka: judul, angka besar + satuan, keterangan, lencana bukti. */
export const kartuAngka = (ik, judul, nilai, satuan, ket, sid, tb) => `<div class="rg3-kartu"><div class="rg3-k-kep">${ikon(ik, 22)}<b>${esc(judul)}</b></div><p class="gsj-angka">${esc(nilai)} <small>${esc(satuan)}</small></p>${ket ? `<p class="jm-bantu">${esc(ket)}</p>` : ""}${buktiS(sid, tb)}</div>`;
