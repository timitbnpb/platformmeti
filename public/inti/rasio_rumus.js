/* rasio_rumus.js (F65-112, F65-113): fungsi murni, tanpa DOM dan tanpa fetch, dipakai /wilayah, rapor, dan uji.
   Tidak ada angka di sini: potensi dari peluang.json, terpasang dari wilayah.json, target dan realisasi dari target_realisasi.json.
   Data kosong menghasilkan null ("tidak ada angka"), tidak pernah 0 karangan. */

const ada = (v) => typeof v === "number" && Number.isFinite(v);

/** Jumlah potensi EBT satu provinsi (MW) dari peluang.json `potensi`: sama dengan cara /banding (semua teknologi berangka dijumlah). Tanpa angka atau nol = null. */
export function potensiTotal(potensi) {
  const jumlah = Object.values(potensi || {}).map((x) => x?.mw).filter(ada).reduce((a, b) => a + b, 0);
  return jumlah > 0 ? jumlah : null;
}

/** Rasio terpasang terhadap potensi, dalam persen. Tidak dipotong di 100: di atas 100 berarti definisi potensi sumbernya lebih sempit. */
export const rasioPersen = (terpasang, potensi) => (ada(terpasang) && terpasang >= 0 && ada(potensi) && potensi > 0 ? (terpasang / potensi) * 100 : null);

/** Selisih ke target (satuan sama). Target naik (bawaan): target dikurangi realisasi. Target turun (arah "turun", mis. batas emisi): realisasi dikurangi target.
 *  Dua-duanya: nol atau negatif berarti target sudah tercapai atau terlampaui ke arah yang diinginkan. */
export const selisihTarget = (target, realisasi, arah) => (ada(target) && ada(realisasi) ? (arah === "turun" ? realisasi - target : target - realisasi) : null);

/** Hitungan kartu skor dari daftar target_realisasi.json: status dipakai apa adanya dari pipa, tidak dihitung ulang di layar. */
export function ringkasJanji(daftar) {
  const n = (s) => daftar.filter((d) => s.includes(d.status)).length;
  return { total: daftar.length, berdata: daftar.filter((d) => d.status !== "tidak-ada-data").length, baik: n(["tercapai", "di-jalur"]), tertinggal: n(["tertinggal", "jauh-tertinggal"]), tanpaData: n(["tidak-ada-data"]) };
}
