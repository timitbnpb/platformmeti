/* /bioenergi: pembantu bersama semua tab. Data baru ada di bioenergi.json; data yang sudah ada DIRUJUK saat runtime
   (riset/biomassa, global/pemasok_lain, energi_baru, organisasi), tidak disalin. Berkas yang tidak ada = null, tab tetap tampil rapi. */
import { t, ada, tanggal } from "/i18n.js";
import { D as R, ex, bukti, luar, bendera, namaNegara, chip, warnaIdx, kosongTab, catatan, daftarCelah, urlGet, urlSet, num, esc, ikon, cariSumber } from "/rg3_umum.js";
import { tautOrg, tautProvinsi, tautRegulasi, siapTautan, naikkan } from "/inti/tautan.js";
import { tipHtml, tabel, batangSvg, kolomSvg, legendaHtml } from "/info_hijau.js";

export { t, ada, tanggal, ex, bukti, luar, bendera, namaNegara, chip, warnaIdx, kosongTab, catatan, daftarCelah, urlGet, urlSet, num, esc, ikon, cariSumber, tautOrg, tautProvinsi, tautRegulasi, siapTautan, naikkan, tipHtml, tabel, batangSvg, kolomSvg, legendaHtml };

export const B = {};
const BERKAS = { bio: "bioenergi.json", biomassa: "riset/biomassa.json", lain: "global/pemasok_lain.json", enb: "energi_baru.json", org: "organisasi.json" };
export async function muat() {
  await Promise.all(Object.entries(BERKAS).map(async ([k, f]) => { try { const r = await fetch("/data/" + f, { credentials: "same-origin" }); B[k] = r.ok ? await r.json() : null; } catch { B[k] = null; } }));
  R.orgAda = new Set((B.org?.baris || []).map((b) => b.id));
  return B;
}
export const bahasa = () => (document.documentElement.lang !== "id" ? "en" : "id");
export const tx = (o) => (o && typeof o === "object" ? o[bahasa()] || o.id || "" : o ?? "");
export const src = (id) => (B.bio?.sumber || []).find((s) => s.id === id) || null;
/** Lencana bukti untuk satu sumber (tingkat bukti = tingkat butir, bukan sumber). */
export const buktiS = (id, tingkat) => { const s = src(id); return bukti(tingkat || s?.tingkat_bukti, { sumber: s?.penerbit || "", tanggal: s?.tanggal_periksa || "" }); };
export const sumberLink = (id) => { const s = src(id); return s ? luar(s.url, `${s.penerbit}, ${s.tahun}`) : ""; };
/** Daftar sumber (id) sebagai butir "i" di kepala exhibit. */
export const kakiSumber = (ids) => `<div class="bn-kaki">${[...new Set(ids.filter(Boolean))].map((i) => `<span class="bn-sumber">${sumberLink(i)}</span>`).join("")}</div>`;
export const orgBaris = (id) => (B.org?.baris || []).find((b) => b.id === id) || null;
export const orgNama = (id) => orgBaris(id)?.nama || id;
export const orgLogo = (id) => { const l = orgBaris(id)?.logo; return typeof l === "string" && l.startsWith("/img/") ? l : ""; };
export const orgSel = (id) => tautOrg(id, orgNama(id));
export const butir = (f) => (B.lain?.butir || []).filter(f);
/** Angka "juta kl" dari teks nilai butir ("1.600.000 kl", "459.770 kl (Medan); 896.522 kl (Batam)"). semua=true menjumlah. */
export function klDari(teks, semua = true) {
  const a = [...String(teks || "").matchAll(/([\d.]+)\s*kl/g)].map((m) => Number(m[1].replace(/\./g, ""))).filter((n) => n > 0);
  return a.length ? (semua ? a.reduce((x, y) => x + y, 0) : a[0]) : null;
}
export const juta = (n, d = 1) => (n == null ? "-" : num(n / 1e6, d));
export const ubinKh = (arr) => arr.filter(Boolean);
export const bulanLabel = (ym) => { const [y, m] = ym.split("-"); return `${t("bn.bln." + Number(m))} ${y.slice(2)}`; };
export const panelKosong = (kunci) => kosongTab(kunci);
export const nol = (v) => (v == null || !isFinite(v) ? "-" : v);
/** Sel pil jenis berwarna stabil per nilai + ikon. */
export const pilJenis = (awalan, k, ik) => chip("rg3-w" + warnaIdx(k), ik ? ikon(ik, 14) : "", ada(awalan + k) ? t(awalan + k) : String(k).replace(/[-_]/g, " "));
