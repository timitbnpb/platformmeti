/* Grafik rapat profil provinsi: batang horizontal (satu seri atau dua seri), warna per teknologi dari token --tk (kelas .jm-tek-*),
   label berikon IKON_TEK, nilai di ujung batang, sumbu tipis. Bukan batang progres: skala bersama dan garis kisi. */
import { esc } from "/inti/umum.js";
import { IKON_TEK } from "/inti/ikon_tek.js";
import { num } from "/analisis.js";

/** label teknologi berikon berwarna; k = kode kelas warna (surya, hidro, panas-bumi, laut, fosil, ...) */
export const labelTek = (k, nama, ik = k) => `<span class="jm-wp-tl jm-tek-${esc(k)}">${IKON_TEK[ik] || IKON_TEK.jaringan}<span>${esc(nama)}</span></span>`;

/** maksimum sumbu "bulat" (1, 2, 2.5, 5, 10 x 10^n) sehingga nilai terbesar masih muat dengan ruang untuk angka di ujung */
function sumbuMaks(v) {
  const m = Math.max(1e-9, v) * 1.18, e = 10 ** Math.floor(Math.log10(m)), f = m / e;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * e;
}
const fmt = (v, d) => num(v, d);

/** rows: [{ k, label, a?, aTeks?, b?, bTeks? }] ; a = seri utama (solid), b = seri kedua (tint, dibawah a). satuan: "MW" | "%" */
export function grafikRapat(rows, { satuan = "MW", label = "", dua = null, maks = null, d = 0 } = {}) {
  const ada = rows.filter((r) => r.a != null || r.b != null);
  if (!ada.length) return "";
  const mx = maks ?? sumbuMaks(Math.max(...ada.map((r) => Math.max(r.a ?? 0, r.b ?? 0))));
  const w = (v) => (v == null ? 0 : Math.max(v > 0 ? 0.8 : 0, (v / mx) * 100));
  const unit = satuan === "%" ? "%" : " " + satuan;
  const bar = (v, teks, kls) => (v == null ? "" : `<span class="jm-wp-gb-t ${kls}"><i data-w="${w(v).toFixed(2)}"></i><b>${esc(teks ?? fmt(v, d) + unit)}</b></span>`);
  const baris = ada.map((r) => `<div class="jm-wp-gb-r jm-tek-${esc(r.k)}"><span class="jm-wp-gb-l">${r.labelHtml || labelTek(r.k, r.label, r.ik)}</span><span class="jm-wp-gb-p">${bar(r.b, r.bTeks, "jm-wp-gb-b")}${bar(r.a, r.aTeks, "jm-wp-gb-a")}</span></div>`).join("");
  const ticks = [0, mx / 2, mx].map((v) => `<span>${esc(fmt(v, mx < 10 ? 1 : 0))}</span>`).join("");
  const leg = dua ? `<p class="jm-wp-gb-lg"><span><i class="jm-wp-gb-sa"></i>${esc(dua[0])}</span><span><i class="jm-wp-gb-sb"></i>${esc(dua[1])}</span></p>` : "";
  return `<div class="jm-wp-gb" role="img" aria-label="${esc(label)}">${leg}<div class="jm-wp-gb-plot">${baris}</div><div class="jm-wp-gb-ax" aria-hidden="true"><span></span><span class="jm-wp-gb-tk">${ticks}</span></div></div>`;
}
