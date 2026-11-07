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

/* Batang horizontal SVG. baris: [{label, bagian:[{nilai, kelas}], teks, sorot}]; lebar tetap viewBox, ukuran dari CSS. */
export function batangSvg(baris, { maks, label } = {}) {
  const M = maks || Math.max(1, ...baris.map((b) => b.bagian.reduce((s, x) => s + (x.nilai || 0), 0)));
  const H = 30, L = 150, W = 360;
  const isi = baris.map((b, i) => {
    let x = L;
    const rect = b.bagian.map((p) => {
      const w = Math.max(0, ((p.nilai || 0) / M) * W);
      const r = `<rect class="${p.kelas}" x="${x.toFixed(1)}" y="${i * H + 6}" width="${w.toFixed(1)}" height="18" rx="3"/>`;
      x += w;
      return r;
    }).join("");
    return `<g class="${b.sorot ? "jm-an-sorot" : ""}"><text class="jm-an-lbl" x="${L - 8}" y="${i * H + 19}" text-anchor="end">${esc(b.label)}</text>${rect}<text class="jm-an-val" x="${(x + 6).toFixed(1)}" y="${i * H + 19}">${esc(b.teks)}</text></g>`;
  }).join("");
  return `<svg class="jm-an-batang" viewBox="0 0 ${L + W + 90} ${baris.length * H + 6}" role="img" aria-label="${esc(label || "")}" focusable="false">${isi}</svg>`;
}

export const teksTek = (k) => t("an.tek." + k);
export const teksStatus = (k) => t("an.status." + (k || "tidak-diketahui"));
export const num = (n, d = 0) => angka(n, { desimal: d });

/* Pasang ulang render saat bahasa berganti. */
export function saatBahasa(fn) { document.addEventListener("jm:bahasa", fn); }
