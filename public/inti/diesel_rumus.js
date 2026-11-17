/* diesel_rumus.js (F65-104): fungsi murni kalkulator hemat dibanding diesel di /desa-energi. Tanpa DOM, tanpa fetch.
   Tidak ada harga BBM, konsumsi spesifik, atau biaya EBT di sini: semuanya isian pengguna (atau asumsi berlabel Hipotesis dari dedieselisasi.json yang dipilih pengguna).
   Biaya EBT yang diisi adalah biaya terlevelisasi per kWh (sudah memuat investasi), jadi balik modal tidak dihitung di sini agar investasi tidak terhitung dua kali. */

export const HARI_TAHUN = 365;
const ada = (v) => typeof v === "number" && Number.isFinite(v) && v >= 0;

/** Biaya listrik diesel (Rp per kWh) = harga BBM (Rp per liter) x konsumsi spesifik (liter per kWh) + operasi dan pemeliharaan (Rp per kWh). */
export const biayaDiesel = (harga, sfc, om = 0) => (ada(harga) && ada(sfc) && ada(om) ? harga * sfc + om : null);

/** Semua keluaran untuk layar; null bila masukannya belum lengkap. hemat boleh negatif (EBT lebih mahal) dan ditampilkan apa adanya. */
export function hitungDiesel({ kwhHari, harga, sfc, om = 0, ebt }) {
  const dieselKwh = biayaDiesel(harga, sfc, om);
  const kwhTahun = ada(kwhHari) ? kwhHari * HARI_TAHUN : null;
  const dieselTahun = dieselKwh != null && kwhTahun != null ? dieselKwh * kwhTahun : null;
  const ebtTahun = ada(ebt) && kwhTahun != null ? ebt * kwhTahun : null;
  return {
    dieselKwh, kwhTahun, dieselTahun, ebtTahun,
    hemat: dieselTahun != null && ebtTahun != null ? dieselTahun - ebtTahun : null,
    liter: kwhTahun != null && ada(sfc) ? kwhTahun * sfc : null,
  };
}
