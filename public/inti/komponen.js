/* Komponen bersama (CSS di inti/jm.css): baris filter, tab, subnav. Teks selalu dari pemanggil lewat t().
   Contoh filter: `<div class="jm-saring">${cariHtml({id:"q",label:t("reg.cari")})}${pilihHtml({id:"jenis",ikon:"jenis",label:t("reg.jenis"),opsi:[["","Semua"],["uu","UU"]]})}${hapusHtml({id:"hapus",label:t("jm.hapus_filter")})}${hitungHtml({id:"hitung",teks:"430 dari 430"})}</div>` */
import { t } from "/i18n.js";
import { esc, ikon } from "/inti/umum.js";

export const cariHtml = ({ id, label, placeholder }) =>
  `<label class="jm-cari">${ikon("cari2", 18)}<span class="sr">${esc(label)}</span><input id="${esc(id)}" type="search" autocomplete="off" placeholder="${esc(placeholder ?? label)}"></label>`;

/** opsi: [[nilai, teks], ...]; teks panjang dipotong elipsis, title = teks penuh. */
export const pilihHtml = ({ id, ikon: ik, label, opsi, nilai = "" }) =>
  `<label class="jm-pil-pilih">${ikon(ik, 18)}<span class="sr">${esc(label)}</span><select id="${esc(id)}" title="${esc(label)}">${opsi.map(([v, l]) => `<option value="${esc(v)}"${String(v) === String(nilai) ? " selected" : ""} title="${esc(l)}">${esc(l)}</option>`).join("")}</select></label>`;

/** Tautan teks kecil berikon X; atribut hidden sampai ada filter aktif (atur `el.hidden`). */
export const hapusHtml = ({ id, label }) => `<button type="button" class="jm-hapus" id="${esc(id)}" hidden>${ikon("silang", 16)}${esc(label)}</button>`;
export const hitungHtml = ({ id, teks }) => `<span class="jm-hitung" id="${esc(id)}" role="status" aria-live="polite">${esc(teks)}</span>`;

/** Tab antarhalaman (a) dengan ikon: items [{href, ikon, label, aktif}] */
export const tabTautan = (items) => `<div class="jm-tab">${items.map((x) => `<a href="${esc(x.href)}"${x.aktif ? ' aria-current="page"' : ""}>${ikon(x.ikon, 18)}<span>${esc(x.label)}</span></a>`).join("")}</div>`;

/** Subnav bagian Insight; dipasang otomatis oleh mulaiHalaman() di halaman bagian ini. */
export const BAGIAN_INSIGHT = [
  { href: "/insight", ikon: "insight", kunci: "nav.sub.ringkasan" },
  { href: "/insight#tren", ikon: "analisis", kunci: "nav.sub.tren" },
  { href: "/rantai", ikon: "rantai", kunci: "nav.rantai" },
  { href: "/asean", ikon: "asean", kunci: "nav.asean" },
  { href: "/metode", ikon: "metode", kunci: "nav.sub.metode" },
];
export function subnavHtml(jalur, hash = "") {
  const aktif = (x) => (x.href === "/insight" ? jalur === "/insight" && hash !== "#tren" : x.href === "/insight#tren" ? jalur === "/insight" && hash === "#tren" : jalur === x.href || jalur.startsWith(x.href + "/"));
  return `<nav class="jm-subnav" id="subnav" aria-label="${esc(t("nav.insight"))}">${tabTautan(BAGIAN_INSIGHT.map((x) => ({ href: x.href, ikon: x.ikon, label: t(x.kunci), aktif: aktif(x) })))}</nav>`;
}
export const diBagianInsight = (jalur) => BAGIAN_INSIGHT.some((x) => !x.href.includes("#") && (jalur === x.href || jalur.startsWith(x.href + "/")));
