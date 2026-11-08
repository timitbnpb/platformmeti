/* /akademi: fungsi murni (tanpa DOM) untuk jalur belajar, nilai kuis, status modul, dan lencana. Dipakai layar dan uji.
   Progres = { langkah: { "<modul>/<indeks>": 1 }, kuis: { "<modul>": { terbaik: 0-100, waktu: ms } } }, disimpan di peramban (localStorage), BUKAN di server.
   Lencana = lencana partisipasi platform, bukan sertifikat resmi. */
import { rumahTopik } from "./inti/rumah_tek.js";
export const KUNCI = "meti-akademi-v1";

/** Tautan sebuah langkah/sumber: topik, istilah, metode, izin (tanya jawab perizinan), halaman (jalur situs). */
export function hrefSumber({ jenis, ref }) {
  if (jenis === "topik") return rumahTopik(ref);
  if (jenis === "istilah") return "/panduan#istilah-" + encodeURIComponent(ref);
  if (jenis === "metode") return "/metode#" + encodeURIComponent(ref);
  if (jenis === "izin") return "/perizinan";
  if (jenis === "halaman" && /^\/(?!\/)[\w\-/?=&#.]*$/.test(ref)) return ref;
  return "/";
}

/** jawaban = { <id soal>: indeks opsi }. Soal tanpa jawaban dihitung salah. */
export function nilaiKuis(modul, jawaban, lulusPersen) {
  const total = modul.kuis.length;
  const benar = modul.kuis.filter((s) => jawaban?.[s.id] === s.a).length;
  const persen = total ? Math.round((benar / total) * 100) : 0;
  return { benar, total, persen, lulus: persen >= lulusPersen };
}

/** Status satu modul: langkah selesai, nilai terbaik, dan tahap: baru -> jalan -> siap (semua langkah dibaca) -> lulus. */
export function statusModul(modul, progres, lulusPersen) {
  const selesai = modul.langkah.filter((_, i) => progres.langkah[modul.id + "/" + i]).length;
  const terbaik = progres.kuis[modul.id]?.terbaik ?? null;
  const lulus = terbaik != null && terbaik >= lulusPersen;
  const tahap = lulus ? "lulus" : selesai === modul.langkah.length ? "siap" : selesai > 0 ? "jalan" : "baru";
  return { selesai, total: modul.langkah.length, terbaik, tahap };
}

/** Modul yang disarankan berikutnya: yang pertama belum lulus; null bila semua lulus. */
export function berikutnya(d, progres) {
  return d.modul.find((m) => statusModul(m, progres, d.lulus_persen).tahap !== "lulus")?.id ?? null;
}

/** Lencana yang diraih: satu per modul lulus, ditambah "semua" bila seluruh modul lulus. */
export function lencana(d, progres) {
  const modul = d.modul.filter((m) => statusModul(m, progres, d.lulus_persen).tahap === "lulus").map((m) => m.id);
  return { modul, semua: modul.length === d.modul.length };
}

/** Bersihkan isi localStorage tak tepercaya: hanya kunci yang dikenal, nilai 0-100 bilangan, selebihnya dibuang. */
export function bersihkanProgres(mentah, d) {
  const hasil = { langkah: {}, kuis: {} };
  if (!mentah || typeof mentah !== "object") return hasil;
  for (const m of d.modul) {
    m.langkah.forEach((_, i) => { if (mentah.langkah?.[m.id + "/" + i] === 1) hasil.langkah[m.id + "/" + i] = 1; });
    const k = mentah.kuis?.[m.id];
    if (k && Number.isFinite(k.terbaik) && k.terbaik >= 0 && k.terbaik <= 100) hasil.kuis[m.id] = { terbaik: Math.round(k.terbaik), waktu: Number.isFinite(k.waktu) ? k.waktu : 0 };
  }
  return hasil;
}
