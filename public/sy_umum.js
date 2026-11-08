/* /surya: pembantu bersama semua tab. Data baru ada di surya_modul.json; berkas lain DIRUJUK saat runtime (pemasok_surya, pabrik_dunia, neraca_pasokan, produk,
   benchmark_harga, kebijakan_dagang, rantai_plts, plts_atap, potensi_atlas, plts_terapung, daur_ulang, biaya_bangun, program_analisis, proyek, korporat, radar_kabupaten),
   tidak disalin. Tiap berkas dimuat malas oleh tab yang memerlukannya; yang tidak ada menjadi null dan tab menampilkan keadaan kosong. */
import { D as R, ex, bukti, luar, bendera, namaNegara, chip, chipSeg, warnaIdx, kosongTab, catatan, daftarCelah, urlGet, urlSet, num, esc, ikon, t, logoHtml, namaOrg, negaraSel, lbl, sumberBerkas } from "/rg3_umum.js";
import { bahasa, tanggal } from "/i18n.js";
import { tipHtml, tabel, batangSvg, kolomSvg, garisSvg, legendaHtml } from "/info_hijau.js";

export { R, ex, bukti, luar, bendera, namaNegara, chip, chipSeg, warnaIdx, kosongTab, catatan, daftarCelah, urlGet, urlSet, num, esc, ikon, t, logoHtml, namaOrg, negaraSel, lbl, sumberBerkas, tipHtml, tabel, batangSvg, kolomSvg, garisSvg, legendaHtml };

export const X = {};
const BERKAS = {
  sy: "surya_modul.json", rantaiPlts: "rantai_plts.json", pemasok: "global/pemasok_surya.json", pabrik: "global/pabrik_dunia.json", neraca: "global/neraca_pasokan.json", produk: "global/produk.json",
  harga: "global/benchmark_harga.json", kebijakan: "global/kebijakan_dagang.json", simulasi: "global/simulasi_tkdn.json", atap: "plts_atap.json", atapHitung: "plts_atap_hitung.json",
  atlas: "potensi_atlas.json", terapung: "riset/plts_terapung.json", daur: "riset/daur_ulang.json", biaya: "biaya_bangun.json", program: "program_analisis.json", proyek: "proyek.json",
  korporat: "korporat.json", topikSurya: "topik/surya.json", radar: "radar_kabupaten.json", org: "organisasi.json", regulasi: "regulasi.json", dagang: "dagang_komponen.json",
};
const janji = {};
/** Muat berkas bernama (kunci BERKAS) sekali; gagal atau bukan JSON = null. Mengisi X dan R.orgAda. */
export function muat(kunci) {
  return Promise.all(kunci.map((k) => (janji[k] ||= fetch("/data/" + BERKAS[k], { credentials: "same-origin" }).then((r) => (r.ok ? r.json() : null)).catch(() => null).then((v) => { X[k] = v; if (k === "org") R.orgAda = new Set((v?.baris || []).map((b) => b.id)); return v; }))));
}
export const bahasaAktif = () => (document.documentElement.lang === "en" ? "en" : "id");
/** Teks dwibahasa {id,en}; string biasa dikembalikan apa adanya. */
export const L = (o) => (o && typeof o === "object" ? o[bahasa()] ?? o.id ?? "" : o ?? "");
export const sumberSy = (id) => (X.sy?.sumber || []).find((s) => s.id === id) || null;
/** Lencana bukti baris kurasi: tingkat dari baris, penerbit dan tanggal dari sumbernya. */
export function buktiSy(r, sumberId = r?.sumber_id) {
  const s = sumberSy(sumberId);
  return bukti(r?.tingkat_bukti || s?.tingkat_bukti, { sumber: s?.penerbit || "", tanggal: r?.tanggal || s?.terbit || s?.tanggal_ambil || "", cara: s?.judul || "" });
}
export const tautSy = (id) => { const s = sumberSy(id); return s ? luar(s.url, s.penerbit) : ""; };
/** Kaki exhibit: daftar tautan sumber (id surya_modul) tanpa ganda. */
export const kakiSy = (ids) => { const l = [...new Set(ids.filter(Boolean))].map(sumberSy).filter(Boolean); return l.length ? `<div class="sur-sumber">${l.map((s) => luar(s.url, s.penerbit)).join("")}</div>` : ""; };
export const bukaTab = (k, tambah = "") => `/surya?tab=${encodeURIComponent(k)}${tambah}`;
export const ton = (v) => (v == null ? "-" : v >= 1e9 ? `${num(v / 1e9, 2)} ${t("sur.u.miliar_t")}` : v >= 1e6 ? `${num(v / 1e6, v % 1e6 ? 1 : 0)} ${t("sur.u.juta_t")}` : `${num(v, 0)} t`);
export const mwTeks = (v) => (v == null ? "-" : v >= 1000 ? `${num(v / 1000, 2)} GW` : `${num(v, v < 10 && v % 1 ? 2 : 0)} MW`);
export const ULANG = { aman: (u) => (/^https?:\/\//i.test(u || "") ? u : "") };
/** Bulan "2025-07" -> "Jul 2025" sesuai bahasa. */
export const bulanTeks = (ym) => tanggal(`${ym}-01`).replace(/^1 /, "");
export const panelKosong = (k) => kosongTab(k);
