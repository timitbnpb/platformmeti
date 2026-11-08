// tanya_spek.js: fungsi MURNI "Tanya data" (tanpa D1/AI): kata kunci, pemeriksa angka, pemeriksa jawaban. Dipakai src/tanya.js dan uji.
import { STOP, verifikasiKutipan } from "./hukum_spek.js";

export const kataKunci = (q) => [...new Set((String(q ?? "").normalize("NFKC").toLowerCase().match(/[\p{L}\p{N}]+/gu) || []).filter((x) => !STOP.has(x) && (x.length > 1 || /\d/.test(x))))].slice(0, 8);

/* Angka kanonik: "1.500" / "1,500" / "1500" -> "1500" (pemisah ribuan), "60,6" / "60.6" -> "60.6" (desimal). */
const kanon = (t) => (/^\d{1,3}([.,]\d{3})+$/.test(t) ? t.replace(/[.,]/g, "") : t.replace(",", "."));
export const angkaDi = (s) => (String(s ?? "").match(/\d+(?:[.,]\d+)*/g) || []).map(kanon);

/* klaim = [{pernyataan, kutipan:{segmen, teks}}] (segmen = nomor potongan); kirim = Map(nomor -> teks yang DIKIRIM ke model).
   Sah hanya bila lolos verifikasiKutipan (kutipan substring potongan, kata kunci klaim ada di potongan) DAN tiap angka di pernyataan
   muncul di potongan yang dikutip. Yang lain dibuang dan dihitung. ponytail: angka dalam kata ("enam ribu") tak diperiksa; klaim itu
   tetap harus lolos kecocokan kata kunci + kutipan. */
export function verifikasiJawaban(klaim, kirim) {
  const { sah, dibuang } = verifikasiKutipan(klaim, kirim);
  const baik = [], ada = new Map();
  let buang = dibuang;
  for (const k of sah) {
    if (!ada.has(k.segmen)) ada.set(k.segmen, new Set(angkaDi(kirim.get(k.segmen))));
    if (angkaDi(k.pernyataan).every((a) => ada.get(k.segmen).has(a))) baik.push({ pernyataan: k.pernyataan, n: k.segmen, teks: k.teks }); else buang++;
  }
  return { sah: baik, dibuang: buang };
}
