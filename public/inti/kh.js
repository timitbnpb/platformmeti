/* Ubin angka kunci untuk kepala halaman standar (.jm-kh). items: [{ikon, nilai, satuan?, label}] */
import { esc, ikon } from "/inti/umum.js";

export function khUbin(id, items) {
  const el = document.getElementById(id);
  if (el) el.style.gridTemplateColumns = `repeat(${items.length}, minmax(0, 1fr))`;
  if (el) el.innerHTML = items.map((u) => `<div class="jm-kh-ub"><span class="jm-kpi-ik">${ikon(u.ikon, 18)}</span><p class="jm-kh-angka"><b>${esc(u.nilai)}</b>${u.satuan ? `<span>${esc(u.satuan)}</span>` : ""}</p><p class="jm-kh-lbl">${esc(u.label)}</p></div>`).join("");
}
