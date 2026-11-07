/* Pemuat halaman /direktori: kepala bersama + i18n (ES module), lalu skrip klasik hasil port berurutan.
   Skrip klasik memakai window.JM = {t, angka, tanggal, saya}. CSP: semua skrip dari 'self'. */
import { mulaiHalaman } from "/inti/kepala.js";
import { t, angka, tanggal, bahasa } from "/i18n.js";

const saya = await mulaiHalaman();
window.JM = { ...(window.JM || {}), t, angka, tanggal, bahasa, saya };
const muat = (src) => new Promise((ok, gagal) => {
  const s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = () => gagal(new Error(src)); document.body.append(s);
});
await muat("/fungsi_direktori.js");
await muat("/direktori.js");
