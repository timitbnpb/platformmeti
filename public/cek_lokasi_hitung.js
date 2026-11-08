/* /cek-lokasi: skor kelayakan ringkas satu titik. Fungsi murni (tanpa DOM), dipakai layar dan uji.
   SEMUA bobot dan ambang adalah HIPOTESIS (EST): penyaring awal, bukan studi kelayakan. Komponen tanpa data dikeluarkan dan bobot dibagi ulang;
   skor hanya keluar bila minimal tiga komponen ada. Rumus tampil di /metode#cek-lokasi (kunci kamus cl.m.*). */
import { AMBANG, persentil } from "./lokasi_hijau_hitung.js";

/* bobot (jumlah 100), Hipotesis */
export const BOBOT = { sumber: 25, jaringan: 25, lahan: 25, bahaya: 15, bpp: 10 };
export const MIN_KOMPONEN = 3;
/* PVOUT (kWh/kWp/tahun): 0 di batas bawah, 100 di batas atas; rentang atlas provinsi 1252 sampai 1688 */
export const PVOUT = { bawah: 1200, atas: 1650 };
/* pengurang skor lahan per kelas; lindung dan konservasi menutup lokasi (skor 0) */
export const LAHAN = { lindung: 100, konservasi: 100, mangrove: 100, gambut: 50, adat: 50, hti: 35, hph: 35, sawit: 30, produksi: 25, konversi: 10 };
/* kelas bahaya dari warna InaRISK: hue 75 (hijau) = 0, hue 5 (merah) = 1 */
export const HUE_BAHAYA = { hijau: 75, merah: 5 };

const klem = (x, a = 0, b = 100) => Math.max(a, Math.min(b, x));

/** Hue 0-360 dari RGB 0-255. */
export function hue(r, g, b) {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  if (!d) return 0;
  const h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return (h * 60 + 360) % 360;
}

/** Indeks bahaya 0-1 dari satu piksel RGBA lapisan InaRISK; null bila piksel transparan (tanpa data). */
export function indeksBahaya(r, g, b, a) {
  if (!(a >= 128)) return null;
  return klem((HUE_BAHAYA.hijau - hue(r, g, b)) / (HUE_BAHAYA.hijau - HUE_BAHAYA.merah), 0, 1);
}
export const kelasBahaya = (i) => (i == null ? null : i < 0.33 ? "rendah" : i < 0.66 ? "sedang" : "tinggi");

/** Skor sumber daya surya dari PVOUT. */
export const skorSumber = (pvout) => (pvout == null ? null : klem(((pvout - PVOUT.bawah) / (PVOUT.atas - PVOUT.bawah)) * 100));
/** Skor jarak ke jaringan (km): dekat = 100, jauh = 0, linear di antara ambang lokasi_hijau_hitung.js. */
export const skorJaringan = (km) => (km == null || !Number.isFinite(km) ? null : klem(((AMBANG.gardu_jauh_km - km) / (AMBANG.gardu_jauh_km - AMBANG.gardu_dekat_km)) * 100));
/** Skor lahan dari kelas yang menutupi titik (daftar string). Tanpa kelas = 100. */
export const skorLahan = (kelas) => klem(100 - kelas.reduce((a, k) => a + (LAHAN[k] ?? 0), 0));
export const skorBahaya = (i) => (i == null ? null : klem(100 - i * 100));

/** in = { pvout, jaringanKm, lahan: string[] | null, bahaya: 0..1 | null, bpp: Rp/kWh | null, bppSemua: number[] }.
 *  Mengembalikan { skor|null, dasar (jumlah bobot terpakai), kom: {id: {skor, bobot}} }. */
export function skorLokasi(i) {
  const mentah = {
    sumber: skorSumber(i.pvout),
    jaringan: skorJaringan(i.jaringanKm),
    lahan: i.lahan ? skorLahan(i.lahan) : null,
    bahaya: skorBahaya(i.bahaya),
    bpp: i.bpp != null ? persentil(i.bpp, i.bppSemua ?? []) : null,
  };
  const kom = {};
  let b = 0, s = 0;
  for (const [id, v] of Object.entries(mentah)) if (v != null) { kom[id] = { skor: v, bobot: BOBOT[id] }; b += BOBOT[id]; s += BOBOT[id] * v; }
  return { skor: Object.keys(kom).length >= MIN_KOMPONEN ? s / b : null, dasar: b, kom };
}

export const kelasSkor = (s) => (s == null ? null : s >= 70 ? "tinggi" : s >= 45 ? "sedang" : "rendah");
