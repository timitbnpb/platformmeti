/* interkoneksi_rumus.js (F65-308): fungsi murni penaksir biaya interkoneksi di /cek-lokasi. Tanpa DOM, tanpa fetch.
   Tidak ada biaya satuan di sini: Direktori belum punya biaya saluran per km atau biaya gardu yang bersumber, jadi keduanya isian pengguna.
   Jarak datang dari hitungan /cek-lokasi (garis lurus ke gardu atau saluran terdekat) dan boleh diganti pengguna.
   Masukan tak sah (kosong, negatif, bukan angka) menghasilkan null, tidak pernah 0 karangan. */

const ada = (v) => typeof v === "number" && Number.isFinite(v) && v >= 0;

/** Biaya saluran (Rp) = jarak (km) x biaya saluran per km (Rp per km). */
export const biayaSaluran = (km, perKm) => (ada(km) && ada(perKm) ? km * perKm : null);

/** Keluaran untuk layar. gardu (Rp) opsional: kosong dianggap tidak dihitung (0), tetapi nilai tak sah membuat total null. */
export function hitungInterkoneksi({ km, perKm, gardu = 0 }) {
  const saluran = biayaSaluran(km, perKm);
  return { saluran, total: saluran != null && ada(gardu) ? saluran + gardu : null };
}
