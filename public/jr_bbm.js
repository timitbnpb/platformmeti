/* Kembaran jaringan (KJ-12/13): warna bahan bakar SATU tempat + pembantu peta/legenda yang dipakai tab Bauran, Aliran, dan tab lain.
   Warna hanya token tema.css (terang+gelap otomatis). Kontrak: docs/perencanaan/KEMBARAN-JARINGAN.md §6 butir 4 dan 5. */
import { t, esc, num, token, gelap } from "/jr_umum.js";
import { muatMapLibre } from "/inti/maplibre.js";

/** jenis bahan bakar -> token CSS. Urutan = urutan batang dan legenda (paling kotor ke paling bersih). */
export const BBM = {
  batubara: "--tp-karbon", diesel: "--tp-sampah", gas: "--tp-hidrogen", bioenergi: "--tp-bio",
  "panas-bumi": "--tp-panas", hidro: "--tp-hidro", bayu: "--tp-bayu", surya: "--tp-surya",
};
export const URUT_BBM = Object.keys(BBM);
export const namaBbm = (j) => t("kj.ba.bbm." + j);

/** Skala intensitas g/kWh (bersih ke kotor), dipakai peta Bauran dan mode Karbon di Aliran. */
export const SKALA = { min: 400, tengah: 775, maks: 1150 };
export const rampIntensitas = (nilai) => ["interpolate", ["linear"], nilai, SKALA.min, token("--ok"), SKALA.tengah, token("--warn"), SKALA.maks, token("--bad")];

/** Batang bersegmen per jenis dari persen {jenis: %}. Lebar dan warna dipasang oleh pasangGaya (CSP tanpa style=). */
export function batangBbm(persen, kls = "") {
  const seg = URUT_BBM.filter((j) => persen?.[j] > 0).map((j) => `<i data-bbm="${j}" data-w="${persen[j]}" title="${esc(namaBbm(j))} ${num(persen[j], 1)}%"></i>`).join("");
  return `<span class="kje-bar ${kls}" role="img" aria-label="${esc(URUT_BBM.filter((j) => persen?.[j] > 0).map((j) => namaBbm(j) + " " + num(persen[j], 1) + "%").join(", "))}">${seg}</span>`;
}
/** Legenda warna bahan bakar (sama di semua tab). */
export const legendaBbm = (jenis = URUT_BBM) => `<ul class="kje-leg" aria-label="${esc(t("kj.ba.legenda_bbm"))}">${jenis.map((j) => `<li><i class="kje-sw" data-bbm="${j}"></i>${esc(namaBbm(j))}</li>`).join("")}</ul>`;

/** Pasang warna dan lebar dari atribut data-* ke gaya (CSSOM, bukan atribut style). */
export function pasangGaya(akar) {
  for (const el of akar.querySelectorAll("[data-bbm]")) { const c = `var(${BBM[el.dataset.bbm] || "--line"})`; if (el instanceof SVGElement) el.style.fill = c; else el.style.background = c; }
  for (const el of akar.querySelectorAll("[data-w]")) el.style.width = el.dataset.w + "%";
  for (const el of akar.querySelectorAll("[data-c]")) { const c = `var(${el.dataset.c})`; if (el instanceof SVGElement) el.style.fill = c; else el.style.background = c; }
}

/** Peta dasar OpenFreeMap + tema. `pasang(peta)` memasang sumber dan lapis; dipanggil ulang saat tema berganti. Mengembalikan peta atau null. */
export async function bukaPeta(el, pasang, { pusat = [118, -2.4], zoom = 3.9, bounds = null, padding = 20, maksZoom = 9, kontrol = "bottom-left" } = {}) {
  try { await muatMapLibre(); } catch { return null; }
  const gaya = () => "https://tiles.openfreemap.org/styles/" + (gelap() ? "dark" : "positron");
  const polos = () => ({ version: 8, sources: {}, glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf", layers: [{ id: "latar", type: "background", paint: { "background-color": token("--soft-hijau") } }] });
  const ada = await fetch(gaya()).then((r) => r.ok).catch(() => false);
  const peta = new maplibregl.Map({ container: el, style: ada ? gaya() : polos(), ...(bounds ? { bounds, fitBoundsOptions: { padding } } : { center: pusat, zoom }), minZoom: 3, maxZoom: maksZoom, dragRotate: false, pitchWithRotate: false, attributionControl: false });
  peta.addControl(new maplibregl.AttributionControl({ compact: true, customAttribution: "© OpenStreetMap (ODbL)" }), "bottom-right");
  peta.addControl(new maplibregl.NavigationControl({ showCompass: false }), kontrol);
  peta.on("style.load", () => pasang(peta));
  let g0 = gelap();
  new MutationObserver(() => { const g = gelap(); if (g !== g0) { g0 = g; peta.setStyle(ada ? gaya() : polos(), { diff: false }); } }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return peta;
}
