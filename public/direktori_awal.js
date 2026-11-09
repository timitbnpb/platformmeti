/* Pemuat halaman /direktori: kepala bersama + i18n (ES module), lalu skrip klasik hasil port berurutan.
   Skrip klasik memakai window.JM = {t, ada, angka, tanggal, saya}. CSP: semua skrip dari 'self'.
   Kunci dir.* baru belum ada di kamus (milik JM-C06) sampai digabung: teks HTML awal dipulihkan bila kunci tak ada. */
import { mulaiHalaman } from "/inti/kepala.js";
import { t, ada, angka, tanggal, bahasa } from "/i18n.js";
import { namaBaku } from "/inti/nama_baku.js";
import { logoOrg } from "/inti/logo_org.js";
import { PROV } from "/inti/prov_singkat.js";
import { paginasiHtml, sorotHalaman } from "/inti/paginasi.js";
import { sumberHtml } from "/inti/komponen.js";
import { terapkanRevisi } from "/inti/revisi_orang.js";

const awal = [...document.querySelectorAll("[data-i18n], [data-i18n-attr]")].map((el) => [el, el.textContent, el.getAttribute("aria-label")]);
const saya = await mulaiHalaman();
for (const [el, teks, label] of awal) {
  if (el.dataset.i18n && !ada(el.dataset.i18n)) el.textContent = teks;
  if (el.dataset.i18nAttr && label !== null && el.dataset.i18nAttr.split(";").some((p) => !ada(p.split(":")[1]))) el.setAttribute("aria-label", label);
}
if (document.title === "dir.title") document.title = "Direktori METI";
window.JM = { ...(window.JM || {}), t, ada, angka, tanggal, bahasa, saya, logoOrg, namaBaku, PROV, paginasiHtml, sorotHalaman, sumberHtml, terapkanRevisi };
const muat = (src) => new Promise((ok, gagal) => {
  const s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = () => gagal(new Error(src)); document.body.append(s);
});
await muat("/fungsi_direktori.js");
await muat("/direktori.js");
