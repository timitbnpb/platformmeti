/* /baterai-ev: pembantu bersama semua tab. Memakai ulang rg3_umum.js (logo, bendera, label bukti, kerangka exhibit) dan memuat berkas data
   tambahan saat runtime. Semua berkas tahan kosong: yang tidak ada menjadi null dan tab menampilkan keadaan kosong. */
import { D, muatSemua, berisi, ex, t, esc, ikon, num, bukti, luar, logoHtml, namaOrg, negaraSel, bendera, chip, lbl, daftarCelah, catatan, sumberBerkas, urlGet, urlSet, kosongTab, amanUrl, namaNegara, warnaIdx } from "/rg3_umum.js";
import { bahasa, bahasaData } from "/i18n.js";

export { D, berisi, ex, t, esc, ikon, num, bukti, luar, logoHtml, namaOrg, negaraSel, bendera, chip, lbl, daftarCelah, catatan, sumberBerkas, urlGet, urlSet, kosongTab, namaNegara, warnaIdx };
export const X = {};
const EXTRA = { be: "baterai_ev.json", hili: "hilirisasi.json", captive: "captive_power.json", akses: "akses_energi.json", insentif: "insentif_fiskal.json", tkdn: "tkdn_produk.json", regulasi: "regulasi.json" };
export async function muat() {
  await muatSemua();
  await Promise.all(Object.entries(EXTRA).map(async ([k, f]) => {
    try { const r = await fetch("/data/" + f, { credentials: "same-origin" }); X[k] = r.ok ? await r.json() : null; } catch { X[k] = null; }
  }));
  X.sumber = new Map((X.be?.sumber || []).map((s) => [s.id, s]));
  X.regId = new Set((X.regulasi?.baris || []).map((r) => r.id));
  return X;
}
/** Teks dwibahasa {id,en}; string biasa dikembalikan apa adanya. */
export const L = (o) => (o && typeof o === "object" ? o[bahasaData()] ?? o.id ?? "" : o ?? "");
export const sumberBe = (id) => X.sumber?.get(id) || null;
/** Label bukti sebuah baris kurasi: tingkat dari baris, penerbit dan tanggal dari sumbernya. */
export function buktiBe(r, sumberId = r.sumber_id) {
  const s = sumberBe(sumberId);
  return bukti(r.tingkat_bukti || s?.tingkat_bukti, { sumber: s?.penerbit || "", tanggal: r.tanggal || s?.tanggal_ambil || "", cara: s?.judul || "" });
}
export const tautSumber = (id) => { const s = sumberBe(id); return s ? luar(s.url, s.penerbit) : ""; };
export const sumberHtmlBe = (ids) => { const l = [...new Set(ids)].map(sumberBe).filter(Boolean); return l.length ? `<span class="bev-sumber">${l.map((s) => luar(s.url, s.penerbit)).join(", ")}</span>` : ""; };
export const tahapData = (id) => (X.be?.tahap || []).find((x) => x.id === id) || null;
export const juta = (usd, d = 1) => num(usd / 1e6, d);
/** Deret nilai GWh, ton, dan sebagainya dengan satuan; rentang {min,max} ditulis dengan kata sambung dari kamus. */
export const kapTeks = (k) => {
  if (!k) return "-";
  if (k.nilai != null) return `${num(k.nilai, k.nilai < 10 && k.nilai % 1 ? 1 : 0)} ${k.satuan}`;
  if (k.rentang) return `${num(k.rentang[0], 1)} - ${num(k.rentang[1], 0)} ${k.satuan}`;
  return "-";
};
export const STATUS = { operasi: "ok", komisioning: "info", konstruksi: "info", rencana: "warn", batal: "bad", "belum-pasti": "x", "tidak-diketahui": "x" };
export const chipStatus = (s) => chip("bev-st-" + (STATUS[s] || "x"), "", lbl("bev.st.", s));
export const chipKelompok = (k) => chip(k === "global" ? "rg3-g-dunia" : "rg3-g-id", ikon(k === "global" ? "globe" : "lokasi", 14), t("bev.kel." + k));
export const peta = {}; // peta aktif per tahap
export const gelap = () => (document.documentElement.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")) === "dark";
export const aman = amanUrl;
