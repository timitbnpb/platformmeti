/* Kolom HTML kecil untuk /pelacak: tinggi tetap 180px, warna teknologi (--tk), tooltip lewat title, label sumbu satu baris.
   Pakai: kolomHtml(items, { label, d }) lalu pasangKolom(akar) sesudah innerHTML (tinggi lewat CSSOM, tanpa atribut style). */
import { esc } from "/inti/umum.js";
import { num } from "/analisis.js";

export function kolomHtml(items, { label = "", d = 0 } = {}) {
  const a = items.findIndex((x) => x.v > 0);
  const it = a > 0 ? items.slice(a) : items; /* tahun awal bernilai nol dibuang */
  if (!it.length) return "";
  const mx = Math.max(1, ...it.map((x) => x.v)), ip = it.findIndex((x) => x.v === mx), langkah = Math.ceil(it.length / 12), banyak = it.length > 14;
  const k = it.map((x, i) => `<div class="pl-kol-k" title="${esc(x.tip ?? `${x.label}: ${num(x.v, d)}`)}">${!banyak || i === ip ? `<span class="pl-kol-v">${esc(num(x.v, d))}</span>` : ""}<i${i === ip ? ' class="on"' : ""} data-h="${((x.v / mx) * 100).toFixed(1)}"></i></div>`).join("");
  const x = it.map((y, i) => `<span>${i % langkah === 0 ? esc(y.label) : ""}</span>`).join("");
  return `<div class="pl-kol" role="img" aria-label="${esc(label)}"><div class="pl-kol-b">${k}</div><div class="pl-kol-x">${x}</div></div>`;
}
export const pasangKolom = (akar) => { for (const e of akar.querySelectorAll(".pl-kol i[data-h]")) e.style.height = e.dataset.h * 0.82 + "%"; };
