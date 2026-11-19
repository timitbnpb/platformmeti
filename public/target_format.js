/* target_format.js: format nilai dan pil status target, dipakai bersama /target (target.js) dan kartu skor di rapor (rapor_janji.js)
   supaya angka yang sama tampil sama di dua tempat. */
import { t } from "/i18n.js";
import { esc, ikon } from "/inti/umum.js";
import { num } from "/analisis.js";

const IK_ST = { tercapai: "piala", "di-jalur": "centang", tertinggal: "peringatan", "jauh-tertinggal": "silang", "tidak-ada-data": "tanya" };
export const des = (v) => { const r2 = +v.toFixed(2); return Number.isInteger(r2) ? 0 : +v.toFixed(1) === r2 ? 1 : 2; };
export function nt(sat, v) {
  if (v == null) return "-";
  switch (sat) {
    case "persen": return num(v, des(v)) + "%";
    case "mw": return v >= 1000 ? num(v / 1000, v >= 100000 ? 0 : 1) + " GW" : num(v) + " MW";
    case "unit": return v >= 1e6 ? num(v / 1e6, 1) + " " + t("tg2.sat.juta") : num(v);
    case "juta_ton": return num(v, v < 10 ? 2 : 1) + " " + t("tg2.sat.juta_ton");
    case "usd_miliar": return "US$" + num(v, 1) + " " + t("tg2.sat.miliar");
    case "pltu": return num(v) + " " + t("tg2.sat.pltu");
    default: return num(v);
  }
}
export const pilSt = (s) => `<span class="tg-pil tg-st-${s}">${ikon(IK_ST[s], 14)}<span>${esc(t("tg2.st." + s))}</span></span>`;
