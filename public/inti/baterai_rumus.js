/* baterai_rumus.js (F65-105): fungsi murni kalkulator baterai geser beban di /investasi#model. Tanpa DOM, tanpa fetch.
   Geser beban = mengisi baterai saat tarif rendah, memakainya saat tarif tinggi. Tidak ada tarif, harga baterai, atau efisiensi bawaan:
   semua isian pengguna. Masukan tak sah (kosong, negatif, di luar rentang) menghasilkan null, tidak pernah 0 karangan.
   Selisih tarif boleh nol atau negatif dan dihitung apa adanya (pendapatan nol atau rugi). */
import { npv, balikModal } from "./model_keuangan_rumus.js";

const ada = (v) => typeof v === "number" && Number.isFinite(v) && v >= 0;
const persen = (v) => ada(v) && v <= 100;

/** Energi tergeser per hari (kWh) = min(kapasitas x DoD, daya x jam geser) x efisiensi pulang-pergi. DoD dan efisiensi dalam persen. */
export const energiGeserHari = ({ kwh, dod, kw, jam, eff }) =>
  (ada(kwh) && persen(dod) && ada(kw) && ada(jam) && jam <= 24 && persen(eff) ? Math.min(kwh * (dod / 100), kw * jam) * (eff / 100) : null);

/** Sisa kapasitas tahun ke-y (1 = tahun pertama) dengan degradasi linear (persen per tahun); tidak pernah di bawah nol. */
export const sisaKapasitas = (degr, y) => Math.max(0, 1 - (degr / 100) * (y - 1));

/**
 * hitungBaterai -> { energiHari, energiTahun1, pendapatanTahun1, arus[0..umur], npv, balik }.
 * selisih = tarif puncak dikurangi tarif luar puncak (Rp per kWh, boleh negatif); hari = hari operasi setahun; degr = persen per tahun (kosong = 0);
 * umur = tahun; capex = Rp; diskonto = persen. npv null bila diskonto kosong; balik null bila kumulatif tak pernah kembali dalam umur.
 */
export function hitungBaterai({ kwh, dod, kw, jam, eff, selisih, hari, degr = 0, umur, capex, diskonto }) {
  const kosong = { energiHari: null, energiTahun1: null, pendapatanTahun1: null, arus: null, npv: null, balik: null };
  const energiHari = energiGeserHari({ kwh, dod, kw, jam, eff });
  if (energiHari == null || !ada(hari) || hari > 366) return kosong;
  const energiTahun1 = energiHari * hari;
  if (typeof selisih !== "number" || !Number.isFinite(selisih)) return { ...kosong, energiHari, energiTahun1 };
  const pendapatanTahun1 = energiTahun1 * selisih;
  if (!persen(degr) || !ada(capex) || !(Number.isInteger(umur) && umur >= 1 && umur <= 60)) return { ...kosong, energiHari, energiTahun1, pendapatanTahun1 };
  const arus = [-capex, ...Array.from({ length: umur }, (_, i) => pendapatanTahun1 * sisaKapasitas(degr, i + 1))];
  return { energiHari, energiTahun1, pendapatanTahun1, arus, npv: persen(diskonto) ? npv(diskonto / 100, arus) : null, balik: balikModal(arus) };
}
