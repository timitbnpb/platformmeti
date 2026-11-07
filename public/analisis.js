/* Pembantu bersama halaman analisis statis (/wilayah, /rantai, /asean): data JSON statis, sumber bertanggal, batang SVG, kartu angka. */
import { t, angka, tanggal } from "/i18n.js";
import { esc, galatHtml } from "/inti/umum.js";

export const amanUrl = (u) => (/^https?:\/\//.test(u || "") ? u : null);

export async function muatData(nama) {
  const r = await fetch(`/data/${nama}`, { credentials: "same-origin" });
  if (!r.ok) throw new Error("data");
  return r.json();
}

export const tampilGalat = (el, ulang) => {
  el.innerHTML = galatHtml("umum");
  el.querySelector("[data-aksi=ulang]")?.addEventListener("click", ulang);
};

/* Baris sumber: "Sumber: X, halaman, data 2025, diperiksa 7 Nov 2026" (tiap angka tampil membawa ini, DS §1). */
export function sumberHtml(s) {
  if (!s) return "";
  const isi = [s.sumber, s.halaman, s.tahun ? t("an.data_tahun", { tahun: s.tahun }) : null].filter(Boolean).join(", ");
  const u = amanUrl(s.url);
  const teks = esc(t("an.sumber", { isi }));
  const tgl = esc(t("an.diperiksa", { tanggal: tanggal(s.tanggal) }));
  return `<small class="jm-an-sumber">${u ? `<a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${teks}</a>` : teks}, ${tgl}</small>`;
}

export const pil = (kunci, jenis = "warn") => `<span class="jm-pil jm-pil-${jenis}">${esc(t(kunci))}</span>`;

/* Kartu angka: nilai, satuan, penyebut "n dari N", sumber, pil EST bila turunan. */
export function kartuHtml({ judul, nilai, satuan, penyebut, sumber, turunan }) {
  return `<article class="jm-kartu jm-an-kartu"><h3>${esc(judul)}${turunan ? " " + pil("an.est") : ""}</h3>
    <p class="jm-an-angka">${esc(nilai)}${satuan ? ` <span>${esc(satuan)}</span>` : ""}</p>
    ${penyebut ? `<p class="jm-bantu">${esc(penyebut)}</p>` : ""}${sumber || ""}</article>`;
}

/* Batang horizontal: teks HTML (rapi di layar sempit), batang SVG berskala viewBox. baris: [{label, bagian:[{nilai, kelas}], teks, sorot}]. */
export function batangSvg(baris, { maks, label } = {}) {
  const M = maks || Math.max(1, ...baris.map((b) => b.bagian.reduce((s, x) => s + (x.nilai || 0), 0)));
  const isi = baris.map((b) => {
    let x = 0;
    const rect = b.bagian.map((p) => {
      const w = Math.max(0, ((p.nilai || 0) / M) * 100);
      const r = `<rect class="${p.kelas}" x="${x.toFixed(2)}" y="0" width="${w.toFixed(2)}" height="10"/>`;
      x += w;
      return r;
    }).join("");
    return `<li class="jm-an-br${b.sorot ? " jm-an-sorot" : ""}"><div class="jm-an-bt"><span>${esc(b.label)}</span><b>${esc(b.teks)}</b></div><svg viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true" focusable="false"><rect class="jm-an-trek" x="0" y="0" width="100" height="10"/>${rect}</svg></li>`;
  }).join("");
  return `<ul class="jm-an-batang" aria-label="${esc(label || "")}">${isi}</ul>`;
}

export const teksTek = (k) => t("an.tek." + k);
export const teksStatus = (k) => t("an.status." + (k || "tidak-diketahui"));
export const num = (n, d = 0) => angka(n, { desimal: d });

/* Pasang ulang render saat bahasa berganti. */
export function saatBahasa(fn) { document.addEventListener("jm:bahasa", fn); }
