/* Banner sopan untuk fitur yang belum aktif di server (503 fitur_belum_aktif). Kartu halaman tetap dirender di bawahnya. */
import { t } from "/i18n.js";
import { esc, ikon } from "/inti/umum.js";
export const siapHtml = (kunci) => `<div class="jm-siap" role="status">${ikon("info", 20)}<div><b>${esc(t("siap.judul"))}</b><p>${esc(t(kunci))}</p></div></div>`;
/** Matikan semua kontrol formulir di dalam akar (tombol tetap terlihat, tidak bisa dikirim). */
export const matikan = (akar) => { for (const e of akar.querySelectorAll("form input,form select,form textarea,form button")) e.disabled = true; };
