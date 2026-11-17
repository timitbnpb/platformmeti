/* izin_alur.js (F65-108, F65-109): fungsi murni /izin-kontrak. Tanpa DOM, tanpa fetch, dipakai halaman dan uji.
   Tidak ada angka luas lahan di sini: luas per MW belum ada sebagai data bersumber di repo, jadi rentangnya isian pengguna.
   Urutan langkah = urutan di sumber data (izin_kontrak.json), bukan urutan wajib menurut aturan. */

export const JENIS_ALUR = ["umum", "surya", "hidro", "panas-bumi", "bioenergi"];
const ada = (v) => typeof v === "number" && Number.isFinite(v) && v >= 0;

/** Langkah untuk satu jenis pembangkit: butir umum ditambah butir jenis itu, urutan sumber dipertahankan, dinomori 1..n. Jenis tak dikenal = []. */
export function langkahIzin(tanya, jenis) {
  if (!JENIS_ALUR.includes(jenis)) return [];
  return (tanya || []).filter((x) => x.jenis === "umum" || x.jenis === jenis).map((x, i) => ({ no: i + 1, ...x }));
}

/** Rentang luas lahan (ha) = MW x luas per MW (ha per MW, bawah dan atas). Masukan kosong, negatif, atau atas < bawah = null. */
export function luasLahan(mw, haMin, haMaks) {
  if (!ada(mw) || !ada(haMin) || !ada(haMaks) || haMaks < haMin) return null;
  return { min: mw * haMin, maks: mw * haMaks };
}
