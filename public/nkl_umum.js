/* /nuklir: pembantu bersama semua tab. Data baru ada di nuklir.json (rujukan id + butir bersumber); data yang sudah ada
   (energi_baru, topik/nuklir, proyek_terpadu, isu, regulasi, organisasi) DIRUJUK saat runtime, tidak disalin. Berkas tak ada = null, tab tetap rapi. */
import { t, ada, tanggal } from "/i18n.js";
import { D as R, ex, bukti, luar, bendera, namaNegara, negaraSel, chip, warnaIdx, kosongTab, catatan, daftarCelah, urlGet, urlSet, num, esc, ikon, logoHtml } from "/rg3_umum.js";
import { tautOrg, tautProvinsi, tautRegulasi, tautProyek, tautProgram, siapTautan, naikkan, namaProvinsiKode } from "/inti/tautan.js";
import { tabel, batangSvg, kolomSvg, tipHtml, legendaHtml } from "/info_hijau.js";

export { t, ada, tanggal, ex, bukti, luar, bendera, namaNegara, negaraSel, chip, warnaIdx, kosongTab, catatan, daftarCelah, urlGet, urlSet, num, esc, ikon, logoHtml, tautOrg, tautProvinsi, tautRegulasi, tautProyek, tautProgram, siapTautan, naikkan, namaProvinsiKode, tabel, batangSvg, kolomSvg, tipHtml, legendaHtml };

export const B = {};
const BERKAS = { nk: "nuklir.json", enb: "energi_baru.json", tp: "topik/nuklir.json", pt: "proyek_terpadu.json", isu: "isu.json", reg: "regulasi.json", org: "organisasi.json" };
export async function muat() {
  await Promise.all(Object.entries(BERKAS).map(async ([k, f]) => { try { const r = await fetch("/data/" + f, { credentials: "same-origin" }); B[k] = r.ok ? await r.json() : null; } catch { B[k] = null; } }));
  R.orgAda = new Set((B.org?.baris || []).map((b) => b.id));
  return B;
}
export const bahasa = () => (document.documentElement.lang === "en" ? "en" : "id");
export const tx = (o) => (o && typeof o === "object" ? o[bahasa()] || o.id || "" : o ?? "");
export const src = (id) => (B.nk?.sumber || []).find((s) => s.id === id) || null;
/** Lencana bukti satu butir: tingkat dari butir, penerbit + tanggal dari sumbernya. */
export const buktiS = (id, tingkat) => { const s = src(id), k = tingkat || s?.tingkat_bukti; return bukti(k === "editorial" ? "kajian" : k, { sumber: s?.penerbit || "", tanggal: s?.tanggal_periksa || "", cara: s?.judul || "" }); };
export const sumberLink = (id) => { const s = src(id); return s ? luar(s.url, `${s.penerbit}, ${s.tahun}`) : ""; };
export const kakiSumber = (ids) => `<div class="nkl-kaki">${[...new Set(ids.flat().filter(Boolean))].map((i) => `<span class="nkl-sumber">${sumberLink(i)}</span>`).join("")}</div>`;
export const idSumber = (x) => [x.sumber_id, ...(x.sumber_tambahan || [])];
export const orgBaris = (id) => (B.org?.baris || []).find((b) => b.id === id) || null;
export const orgNama = (id) => orgBaris(id)?.nama || id;
export const orgLogo = (id) => { const l = orgBaris(id)?.logo; return typeof l === "string" && l.startsWith("/img/") ? l : ""; };
/** Sel organisasi berlogo (inisial bila logo tak ada); tanpa id = nama polos. */
export const orgLogoSel = (id, nama) => `<span class="rg3-org">${logoHtml(id, nama || orgNama(id), id ? orgLogo(id) : "")}<span class="rg3-idk"><b>${id && R.orgAda?.has(id) ? tautOrg(id, nama || orgNama(id)) : esc(nama || id || "-")}</b></span></span>`;
export const enbBaris = (id) => (B.enb?.baris || []).find((b) => b.id === id) || null;
export const bab = (kunci) => B.tp?.bab?.[B.nk?.rujukan?.topik_bab?.[kunci]] || null;
export const regBaris = (ids) => ids.map((id) => (B.reg?.baris || []).find((r) => r.id === id)).filter(Boolean);
/** Sel pil: warna semantik untuk status dikenal (ok/info/warn/bad), selain itu warna stabil per nilai. */
const SEM = { beroperasi: "ok", kontrak: "info", "evaluasi-tapak": "info", persiapan: "info", "kerja-sama": "info", studi: "warn", kandidat: "warn", rencana: "warn", dikaji: "warn", berlaku: "ok", diubah: "warn", dicabut: "bad", aktif: "bad", mereda: "info" };
export const pil = (awalan, k, ik) => chip(SEM[k] ? "nkl-sem-" + SEM[k] : "rg3-w" + warnaIdx(k), ik ? ikon(ik, 14) : "", ada(awalan + k) ? t(awalan + k) : String(k).replace(/[-_]/g, " "));
export const gelap = () => (document.documentElement.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")) === "dark";
/** Daftar butir bersumber (ikon + teks + lencana bukti). */
export const butir = (arr, ik = "info") => `<ul class="nkl-daftar">${arr.map((x) => `<li>${ikon(ik, 18)}<div><p>${esc(tx(x.teks))}</p>${buktiS(x.sumber_id, x.tingkat_bukti)}</div></li>`).join("")}</ul>`;
/** Kartu angka: ikon, judul, angka besar + satuan, keterangan, lencana bukti. */
export const kartu = (ik, judul, nilai, satuan, ket, sid, tb) => `<div class="rg3-kartu"><div class="rg3-k-kep">${ikon(ik, 22)}<b>${esc(judul)}</b></div><p class="nkl-angka">${esc(nilai)} <small>${esc(satuan)}</small></p><p class="jm-bantu">${esc(ket)}</p>${buktiS(sid, tb)}</div>`;
/** Tabel rujukan dari berkas topik: kolom ditentukan pemanggil, sel dua bahasa lewat tx(). */
export const barisBab = (kunci) => bab(kunci)?.baris || [];
/** Tanggal butir: tahun saja, tahun-bulan, atau tanggal penuh. */
export const tglTeks = (v) => { const s = String(v ?? ""); return /^\d{4}$/.test(s) ? s : /^\d{4}-\d{2}$/.test(s) ? new Intl.DateTimeFormat(bahasa(), { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(s + "-01T00:00:00Z")) : s ? tanggal(s) : "-"; };
/** Kaki sumber untuk bab topik (sumber topik/nuklir.json, bukan nuklir.json). */
export const kakiTopik = (ids) => `<div class="nkl-kaki">${(ids || []).map((i) => B.tp?.sumber?.[i]).filter(Boolean).map((s) => `<span class="nkl-sumber">${luar(s.url, `${s.penerbit}, ${s.tahun}`)}</span>`).join("")}</div>`;
/** Kartu butir energi baru (dirujuk lewat id): nama, status, ringkas, linimasa, lencana bukti, tautan ke /energi-baru. */
export const enbKartu = (b) => {
  if (!b) return "";
  const sm = (B.enb?.sumber || []).find((x) => x.id === b.sumber_ids?.[0]);
  const lin = b.linimasa?.length ? `<ol class="nkl-lin">${b.linimasa.map((l) => `<li><time>${esc(tglTeks(l.tgl))}</time><span>${esc(tx(l.teks))}</span></li>`).join("")}</ol>` : "";
  return `<article class="nkl-enb"><header><b>${esc(tx(b.nama))}</b>${pil("nkl.st.", b.status)}</header><p>${esc(tx(b.ringkas))}</p>${lin}<div class="nkl-enb-k">${bukti(b.tingkat_bukti, { sumber: sm?.penerbit || "", tanggal: b.tanggal_periksa })}<a class="rg3-tautan" href="/energi-baru">${esc(t("nkl.enb.lihat"))}</a></div></article>`;
};
