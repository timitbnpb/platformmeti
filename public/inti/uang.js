/* Format mata uang ala akuntansi (selera pemilik 8 Nov 2026): simbol rata KIRI, angka rata KANAN dalam satu sel.
   uangHtml("US$", "6.486 juta") -> <span class="jm-uang"><span class="jm-uang-s">US$</span><span class="jm-uang-n">6.486 juta</span></span> */
import { esc } from "/inti/umum.js";
export const uangHtml = (simbol, nilai, judul = "") =>
  `<span class="jm-uang"${judul ? ` title="${esc(judul)}"` : ""}><span class="jm-uang-s">${esc(simbol)}</span><span class="jm-uang-n">${esc(nilai)}</span></span>`;
