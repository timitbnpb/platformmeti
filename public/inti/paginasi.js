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
/* satuan = kunci i18n opsional (mis. "jm.pag.u.regulasi"); tanpa satuan teks jumlah memakai "data". Satu halaman: hanya teks jumlah. */
export function paginasiHtml({ hal, total, per, satuan = "jm.pag.u.data", n = 0, ada = false }) {
  if (total == null) return paginasiTakTahu({ hal, per, n, ada, satuan });
  const jumlah = Math.max(1, Math.ceil(total / per)), u = t(satuan);
  if (total <= 0) return "";
  if (jumlah <= 1) return `<nav class="jm-pag" aria-label="${esc(t("jm.pag.label"))}"><span class="jm-pag-teks">${esc(angka(total))} ${esc(u)}</span></nav>`;
  hal = Math.min(Math.max(1, hal), jumlah);
  const dari = (hal - 1) * per + 1, ke = Math.min(total, hal * per);
  const arah = (n, teks, mati) => `<button type="button" class="jm-pag-b" data-hal="${n}"${mati ? " disabled" : ""}>${teks}</button>`;
  const no = nomorHalaman(hal, jumlah).map((n) => n === null ? `<span class="jm-pag-elips" aria-hidden="true">…</span>`
    : `<button type="button" class="jm-pag-b${n === hal ? " on" : ""}" data-hal="${n}" aria-label="${esc(t("jm.pag.ke", { n }))}"${n === hal ? ' aria-current="page"' : ""}>${esc(angka(n))}</button>`).join("");
  return `<nav class="jm-pag" aria-label="${esc(t("jm.pag.label"))}"><span class="jm-pag-teks">${esc(t("jm.pag.rentang", { a: angka(dari), b: angka(ke), c: angka(total), u }))}</span><span class="jm-pag-nomor">${arah(hal - 1, "‹ " + esc(t("jm.pag.sebelum")), hal <= 1)}${no}${arah(hal + 1, esc(t("jm.pag.berikut")) + " ›", hal >= jumlah)}</span></nav>`;
}
/* Server tanpa total (admin akun/jejak): hanya rentang halaman ini + Sebelumnya/Berikutnya; n = baris di halaman ini, ada = masih ada halaman berikut. */
function paginasiTakTahu({ hal, per, n, ada, satuan }) {
  if (hal <= 1 && !ada) return n ? `<nav class="jm-pag" aria-label="${esc(t("jm.pag.label"))}"><span class="jm-pag-teks">${esc(angka(n))} ${esc(t(satuan))}</span></nav>` : "";
  const arah = (k, teks, mati) => `<button type="button" class="jm-pag-b" data-hal="${k}"${mati ? " disabled" : ""}>${teks}</button>`;
  return `<nav class="jm-pag" aria-label="${esc(t("jm.pag.label"))}"><span class="jm-pag-teks">${esc(t("jm.pag.rentang_tk", { a: angka((hal - 1) * per + 1), b: angka((hal - 1) * per + n), u: t(satuan) }))}</span><span class="jm-pag-nomor">${arah(hal - 1, "‹ " + esc(t("jm.pag.sebelum")), hal <= 1)}<button type="button" class="jm-pag-b on" data-hal="${hal}" aria-current="page">${esc(angka(hal))}</button>${arah(hal + 1, esc(t("jm.pag.berikut")) + " ›", !ada)}</span></nav>`;
}
/** Chrome urgent: sorot nomor tujuan SEKARANG (sinkron); isi berat dirender sesudahnya lewat nanti(). */
export function sorotHalaman(tombol, n) {
  const nav = tombol.closest(".jm-pag"); if (!nav) return;
  for (const b of nav.querySelectorAll(".jm-pag-b")) { const mati = b.dataset.hal === String(n); b.classList.toggle("on", mati && !b.textContent.includes("‹") && !b.textContent.includes("›")); if (b.classList.contains("on")) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current"); }
}

/* Paginasi di sisi layar untuk baris yang sudah ada di DOM (tabel/daftar statis): baris di luar halaman diberi hidden.
   navLokal() menaruh strip di bawah daftar; pasangLokal(akar, ambilBaris) memasang satu pendengar klik. Tidak ada tombol "tampilkan lagi". */
export function navLokal({ total, per, satuan, hal = 1 }) {
  return total > per ? `<div class="jm-pag-lokal" data-total="${total}" data-per="${per}"${satuan ? ` data-satuan="${satuan}"` : ""}>${paginasiHtml({ hal, total, per, satuan })}</div>` : "";
}
export function pasangLokal(akar, ambilBaris) {
  akar.addEventListener("click", (e) => {
    const b = e.target.closest(".jm-pag-lokal [data-hal]"); if (!b || b.disabled) return;
    const w = b.closest(".jm-pag-lokal"), hal = +b.dataset.hal, per = +w.dataset.per, total = +w.dataset.total;
    sorotHalaman(b, hal);
    setTimeout(() => {
      ambilBaris(w).forEach((r, i) => { r.hidden = i < (hal - 1) * per || i >= hal * per; });
      w.innerHTML = paginasiHtml({ hal, total, per, satuan: w.dataset.satuan || undefined });
    }, 0);
  });
}
