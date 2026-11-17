/* karbon_rumus.js (F65-103): fungsi murni kalkulator emisi dihindari dan REC di /karbon. Tanpa DOM, tanpa fetch, dipakai halaman dan uji.
   Tidak ada konstanta harga atau faktor emisi di sini: faktor emisi datang dari data bersumber (karbon_pasar.json), harga dari isian pengguna.
   Masukan tak sah (kosong, negatif, bukan angka) menghasilkan null, tidak pernah 0 karangan. */

export const JAM_TAHUN = 8760;
const ada = (v) => typeof v === "number" && Number.isFinite(v) && v >= 0;

/** Energi tahunan (MWh) dari kapasitas (MW) dan faktor kapasitas (persen, 0 sampai 100). */
export const energiTahun = (mw, fkPersen) => (ada(mw) && ada(fkPersen) && fkPersen <= 100 ? mw * JAM_TAHUN * (fkPersen / 100) : null);

/** Emisi dihindari (tCO2e per tahun) = energi (MWh) x faktor emisi sistem (tCO2e per MWh). */
export const emisiDihindari = (mwh, fe) => (ada(mwh) && ada(fe) ? mwh * fe : null);

/** Nilai (Rp) = volume x harga satuan. */
export const nilai = (volume, harga) => (ada(volume) && ada(harga) ? volume * harga : null);

/** Satu panggilan untuk layar. 1 REC = 1 MWh. Tiap keluaran null bila masukannya belum lengkap. */
export function hitungHindar({ mw, fk, fe, hargaKarbon, hargaRec }) {
  const mwh = energiTahun(mw, fk), tco2 = emisiDihindari(mwh, fe);
  return { mwh, tco2, nilaiKarbon: nilai(tco2, hargaKarbon), rec: mwh, nilaiRec: nilai(mwh, hargaRec) };
}
