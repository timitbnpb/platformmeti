/* Paginasi bernomor bersama: sebelumnya/berikutnya berikon, nomor dengan elipsis, "a-b dari c".
   Pakai: paginasiHtml({ hal, total, per }) lalu dengarkan klik pada [data-hal] (nilai = nomor halaman tujuan). */
import { t, angka } from "/i18n.js";
import { esc, ikon } from "/inti/umum.js";

/** Daftar nomor + elipsis (null): 1 ... 4 5 [6] 7 8 ... 20 */
export function nomorHalaman(hal, jumlah) {
  const s = new Set([1, jumlah, hal - 1, hal, hal + 1]);
  if (hal <= 3) [2, 3, 4].forEach((n) => s.add(n));
  if (hal >= jumlah - 2) [jumlah - 1, jumlah - 2, jumlah - 3].forEach((n) => s.add(n));
  const a = [...s].filter((n) => n >= 1 && n <= jumlah).sort((x, y) => x - y), out = [];
  for (const n of a) { if (out.length && n - out.at(-1) > 1) out.push(null); out.push(n); }
  return out;
}
export function paginasiHtml({ hal, total, per }) {
  const jumlah = Math.max(1, Math.ceil(total / per));
  if (total <= per) return "";
  const dari = (hal - 1) * per + 1, ke = Math.min(total, hal * per);
  const panah = (n, ik, kunci, mati) => `<button type="button" class="jm-pag-b jm-pag-panah" data-hal="${n}" aria-label="${esc(t(kunci))}" title="${esc(t(kunci))}"${mati ? " disabled" : ""}>${ikon(ik, 18)}</button>`;
  const no = nomorHalaman(hal, jumlah).map((n) => n === null ? `<span class="jm-pag-elips" aria-hidden="true">...</span>`
    : `<button type="button" class="jm-pag-b" data-hal="${n}" aria-label="${esc(t("jm.pag.ke", { n }))}"${n === hal ? ' aria-current="page"' : ""}>${esc(angka(n))}</button>`).join("");
  return `<nav class="jm-pag" aria-label="${esc(t("jm.pag.label"))}"><span class="jm-pag-teks">${esc(t("jm.pag.rentang", { a: angka(dari), b: angka(ke), c: angka(total) }))}</span><span class="jm-pag-nomor">${panah(hal - 1, "panah-kiri", "jm.sebelumnya", hal <= 1)}${no}${panah(hal + 1, "panah-kanan", "jm.pag.berikut", hal >= jumlah)}</span></nav>`;
}
