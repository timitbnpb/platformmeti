/* Pembantu bersama tab admin baru (koreksi, audit, kesehatan, statistik, konten beranda). */
import { t, angka } from "/i18n.js";
import { esc, ikon, galatHtml } from "/inti/umum.js";

const simpan = {};
/** Muat /data/<nama>.json sekali. */
export const data = (nama) => (simpan[nama] ||= fetch(`/data/${nama}.json`).then((r) => { if (!r.ok) throw new Error(nama); return r.json(); }).catch((e) => { delete simpan[nama]; throw e; }));

/** Kepala tab standar (.jm-kh) dengan ikon; kunci i18n awalan + .ey/.j/.d. */
export const kepalaTab = (ik, ey, j, d) => `<section class="jm-kh jm-kh-satu jm-kh-tab"><div class="jm-kh-teks"><p class="jm-kh-ey">${ikon(ik, 16)}<span>${esc(t(ey))}</span></p><h2>${esc(t(j))}</h2><p class="jm-kh-lead">${esc(t(d))}</p></div></section>`;

/** Galat 503 fitur_belum_aktif tampil sebagai keadaan rapi, bukan alarm. */
export const keadaan = (kode) => (kode === "fitur_belum_aktif"
  ? `<div class="jm-kosong" role="status">${ikon("kunci", 32)}<p><strong>${esc(t("adm.belum_aktif"))}</strong></p><p class="jm-bantu">${esc(t("adm.belum_aktif.d"))}</p></div>`
  : galatHtml(kode));

export const aman = (u) => (/^https?:\/\//i.test(u || "") ? u : "");
/** waktu dari server: detik unix, angka teks, atau ISO. */
export const detik = (w) => (typeof w === "number" ? w : /^\d+$/.test(String(w)) ? Number(w) : Math.floor(Date.parse(w) / 1000));
