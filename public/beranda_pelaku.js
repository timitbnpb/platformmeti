/* Exhibit "Pelaku" di beranda: satu kartu per jenis organisasi (ikon unik, angka, 3 logo teratas), bertaut ke direktori tersaring. */
import { t, angka } from "/i18n.js";
import { esc } from "/inti/umum.js";
import { sumberHtml, exHtml, lihatSemuaHtml } from "/inti/komponen.js";
import { logoOrg, LOGO_ORG, LOGO_NAMA } from "/inti/logo_org.js";

const S = (d) => `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${d}</svg>`;
/* [kode, warna token, ikon] satu ikon per jenis, tidak ada yang kembar */
const JENIS = [
  ["bumn", "--data1", S('<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6zM9 12l2 2 4-4"/>')],
  ["swasta", "--data5", S('<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>')],
  ["internasional", "--info", S('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>')],
  ["asosiasi", "--data2", S('<circle cx="12" cy="5" r="2.5"/><circle cx="5" cy="19" r="2.5"/><circle cx="19" cy="19" r="2.5"/><path d="M11 7.3 6 16.8M13 7.3l5 9.5M7.5 19h9"/>')],
  ["kementerian-lembaga", "--warn", S('<path d="m14 4 6 6-3 3-6-6zM10 8l-6 6 3 3 6-6zM3 21h9"/>')],
  ["koperasi", "--ok", S('<path d="M8 13V5a1.5 1.5 0 0 1 3 0v6M11 10V4a1.5 1.5 0 0 1 3 0v7M14 10V6a1.5 1.5 0 0 1 3 0v8c0 4-2 7-6 7s-6-2-7-5l-2-4a1.5 1.5 0 0 1 2.5-1.5L8 14"/>')],
  ["ormawa", "--data3", S('<path d="M2 9l10-5 10 5-10 5zM6 11v5c3 3 9 3 12 0v-5"/>')],
  ["perguruan-tinggi", "--data4", S('<path d="M3 10l9-6 9 6zM5 10v8M9 10v8M15 10v8M19 10v8M3 20h18"/>')],
  ["think-tank", "--bad", S('<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6M8 10h4"/>')],
];
const inisial = (n) => { const w = String(n).replace(/^PT\.?\s+/i, "").split(/\s+/).filter((x) => /^[A-Za-z]/.test(x)); return (w.length > 1 ? w.slice(0, 2).map((x) => x[0]).join("") : (w[0] || "?").slice(0, 2)).toUpperCase(); };
const ADA_SLUG = (o) => LOGO_ORG[o.id] || LOGO_NAMA[o.nama];

/** org: baris organisasi; pro: katalog proyek (untuk mengurutkan logo menurut kapasitas). */
export function pelakuHtml(org, pro) {
  const mw = new Map(pro.baris.map((p) => [p.id, p.kapasitas?.[0]?.nilai || 0]));
  const skor = (o) => (o.proyek_ids || []).reduce((s, i) => s + (mw.get(i) || 0), 0);
  const kartu = JENIS.map(([k, warna, ik]) => {
    const isi = org.filter((o) => o.kategori?.kode === k);
    const lihat = new Set(), logo = isi.sort((a, b) => (!!ADA_SLUG(b) - !!ADA_SLUG(a)) || skor(b) - skor(a)).filter((o) => { const u = logoOrg(o.id, o.nama, o.logo)[0] || o.id; return !lihat.has(u) && lihat.add(u); }).slice(0, 3);
    return { k, warna, ik, n: isi.length, logo };
  }).filter((x) => x.n);
  const total = kartu.reduce((s, x) => s + x.n, 0);
  const isiHtml = `<ul class="jm-pel">${kartu.map((x) => `<li><a class="jm-pel-k jm-pel-${x.k}" href="/direktori?tampil=lembaga&amp;kat=${encodeURIComponent(x.k)}"><span class="jm-pel-ik">${x.ik}</span><b class="jm-pel-n">${esc(angka(x.n))}</b><span class="jm-pel-l">${esc(t("beranda.pel." + x.k))}</span><span class="jm-pel-lg" aria-hidden="true">${x.logo.map((o) => { const u = logoOrg(o.id, o.nama, o.logo)[0]; return `<span class="jm-pel-lo">${esc(inisial(o.nama))}${u ? `<img src="${esc(u)}" width="32" height="32" alt="" loading="lazy" decoding="async" data-galat="hapus">` : ""}</span>`; }).join("")}</span></a></li>`).join("")}</ul>`;
  return exHtml({ kelas: "jm-pel-ex", tingkat: "h2", ikon: "orang", topik: t("beranda.s02.ey"), judulHtml: esc(t("beranda.pel.j", { n: angka(total), k: angka(kartu.length) })), subHtml: esc(t("beranda.s02.p")), aksiHtml: sumberHtml(esc(t("beranda.eko_sumber"))), isiHtml, kakiHtml: lihatSemuaHtml("/direktori?tampil=lembaga", t("beranda.eko.semua", { n: angka(org.length) })) });
}
