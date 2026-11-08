/* /hidrogen: pembantu bersama semua tab. Data baru ada di hidrogen.json; data yang sudah ada DIRUJUK saat runtime (energi_baru, global/pemasok_lain,
   proyek, global/potensi_atlas, biaya_bangun, pendanaan_internasional, organisasi, regulasi), tidak disalin. Berkas yang tidak ada = null, tab tetap tampil rapi. */
import { t, ada, tanggal } from "/i18n.js";
import { D as R, ex, bukti, luar, bendera, namaNegara, negaraSel, logoHtml, chip, warnaIdx, kosongTab, catatan, daftarCelah, urlGet, urlSet, num, esc, ikon, cariSumber } from "/rg3_umum.js";
import { tautOrg, tautProvinsi, tautRegulasi, siapTautan, naikkan } from "/inti/tautan.js";
import { tipHtml, tabel, batangSvg, kolomSvg, legendaHtml } from "/info_hijau.js";

export { t, ada, tanggal, ex, bukti, luar, bendera, namaNegara, negaraSel, logoHtml, chip, warnaIdx, kosongTab, catatan, daftarCelah, urlGet, urlSet, num, esc, ikon, cariSumber, tautOrg, tautProvinsi, tautRegulasi, siapTautan, naikkan, tipHtml, tabel, batangSvg, kolomSvg, legendaHtml };

export const H = {};
const BERKAS = { h2: "hidrogen.json", enb: "energi_baru.json", lain: "global/pemasok_lain.json", proyek: "proyek.json", atlas: "global/potensi_atlas.json", bb: "biaya_bangun.json", pi: "pendanaan_internasional.json", org: "organisasi.json" };
export async function muat() {
  await Promise.all(Object.entries(BERKAS).map(async ([k, f]) => { try { const r = await fetch("/data/" + f, { credentials: "same-origin" }); H[k] = r.ok ? await r.json() : null; } catch { H[k] = null; } }));
  R.orgAda = new Set((H.org?.baris || []).map((b) => b.id));
  return H;
}
export const bahasa = () => (document.documentElement.lang !== "id" ? "en" : "id");
export const tx = (o) => (o && typeof o === "object" ? o[bahasa()] || o.id || "" : o ?? "");
export const src = (id) => (H.h2?.sumber || []).find((s) => s.id === id) || null;
/** Lencana bukti satu butir: tingkat = tingkat butir, sumber = penerbit. */
export const buktiS = (id, tingkat) => { const s = src(id); return bukti(tingkat || s?.tingkat_bukti, { sumber: s?.penerbit || "", tanggal: s?.tanggal_periksa || "" }); };
export const sumberLink = (id) => { const s = src(id); return s ? luar(s.url, `${s.penerbit}, ${s.tahun}`) : ""; };
export const kakiSumber = (ids) => `<div class="h2-kaki">${[...new Set(ids.filter(Boolean))].map((i) => `<span class="h2-sumber">${sumberLink(i)}</span>`).join("")}</div>`;
export const orgBaris = (id) => (H.org?.baris || []).find((b) => b.id === id) || null;
export const orgNama = (id) => orgBaris(id)?.nama || id;
export const orgSel = (id) => `<span class="h2-org">${logoHtml(id, orgNama(id), orgBaris(id)?.logo, "rg3-lg rg3-lg-k")}${tautOrg(id, orgNama(id))}</span>`;
export const orgDaftar = (ids) => (ids?.length ? `<span class="h2-orgs">${ids.map(orgSel).join("")}</span>` : "-");
export const enbBaris = (id) => (H.enb?.baris || []).find((b) => b.id === id) || null;
export const panel = (kunci) => kosongTab(kunci);
export const nol = (v) => (v == null || !isFinite(v) ? "-" : v);
export const rentang = (a, d = 0) => (a ? (a[0] === a[1] ? num(a[0], d) : `${num(a[0], d)} - ${num(a[1], d)}`) : "-");
/** Chip berwarna stabil per nilai + ikon. */
export const pilJenis = (awalan, k, ik) => chip("rg3-w" + warnaIdx(k), ik ? ikon(ik, 14) : "", ada(awalan + k) ? t(awalan + k) : String(k).replace(/[-_]/g, " "));
const STATUS_IK = { beroperasi: "centang", konstruksi: "pabrik", rencana: "kalender", studi: "labu", "kerja-sama": "tautan", tertunda: "jam", dibatalkan: "silang", "tak-jelas": "tanya" };
export const chipStatus = (k) => pilJenis("h2.st.", k, STATUS_IK[k] || "info");
export const IK_TEK = { surya: "tek-surya", "panas-bumi": "tek-panas", hidro: "air-energi", bayu: "tek-listrik" };
export const chipTek = (k) => pilJenis("h2.tek.", k, IK_TEK[k] || "petir");
export const bagianLink = (tab) => `<a class="rg3-tautan" href="/hidrogen?tab=${esc(tab)}">${esc(t("h2.tab." + tab))}</a>`;
