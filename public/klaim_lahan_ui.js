/* Pembantu bersama klaim karbon dan lahan (Fase 2): muat data, pil berwarna per lapis, CSS. Dipakai wilayah_klaim.js dan karbon_integritas.js. */
import { esc, ikon } from "/inti/umum.js";
import { t } from "/i18n.js";

export const WARNA = { hti: "--tp-bio", hph: "--tp-efisiensi", re: "--tp-hidrogen", sawit: "--tp-panas", mangrove: "--tp-bayu", lindung: "--tp-simpan", produksi: "--tp-sampah", adat: "--tp-nuklir" };
export const IKON = { hti: "tek-bio", hph: "tek-bio", re: "tek-bio", sawit: "pabrik", mangrove: "wilayah", lindung: "perisai", produksi: "kajian", adat: "orang" };
export const TINGKAT = { tinggi: ["--bad", "--bad-bg", "peringatan"], perhatian: ["--warn", "--warn-bg", "peringatan"], info: ["--info", "--info-bg", "info"] };
const cache = {};
export const muatJson = (u) => (cache[u] ||= fetch(u).then((r) => (r.ok ? r.json() : Promise.reject(new Error(u + " " + r.status)))));
export const fmt = (n) => new Intl.NumberFormat(document.documentElement.lang === "en" ? "en-US" : "id-ID").format(Math.round(n));
export const warna = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
export const pilLapis = (id) => `<span class="kl2-pil" data-l="${esc(id)}">${ikon(IKON[id] || "info", 14)}${esc(t("kl2.l." + id))}</span>`;
export const pilTingkat = (tk, teks) => `<span class="kl2-pil kl2-t-${TINGKAT[tk] ? tk : "info"}">${ikon((TINGKAT[tk] || TINGKAT.info)[2], 14)}${esc(teks)}</span>`;
export function pasangCss() {
  if (document.getElementById("kl2-css")) return;
  const l = document.createElement("link"); l.id = "kl2-css"; l.rel = "stylesheet"; l.href = "/klaim_lahan.css"; document.head.append(l);
}
