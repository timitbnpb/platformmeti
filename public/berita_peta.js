/* Peta berita: gelembung per provinsi/kabupaten yang disebut di judul (diport dari poskokarhutla banjir/berita.js, tanpa klaster).
   Data: tiap baris berita bisa membawa wilayah:[{prov,kab?,lat,lng}] (scripts/panen/berita_wilayah.mjs). Warna dari token lewat getComputedStyle. */
import { t, angka, tanggal } from "/i18n.js";
import { esc } from "/inti/umum.js";
import { muatMapLibre } from "/inti/maplibre.js";
import { urlAman } from "/publik.js";

const gelap = () => (document.documentElement.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")) === "dark";
const gaya = () => "https://tiles.openfreemap.org/styles/" + (gelap() ? "dark" : "positron");
const token = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
const kP = (p) => "P|" + p, kK = (p, k) => "K|" + p + "|" + k;

/** Hitung sebutan: provinsi (artikel unik per provinsi), kabupaten, dan titik peta. */
export function agregat(rows) {
  const prov = new Map(), kab = new Map(), titik = new Map(); let berlokasi = 0;
  for (const r of rows) {
    const w = r.wilayah || []; if (!w.length) continue; berlokasi++;
    for (const p of new Set(w.map((x) => x.prov))) { const o = prov.get(p) || { nama: p, n: 0 }; o.n++; prov.set(p, o); }
    for (const x of w) {
      const kunci = x.kab ? kK(x.prov, x.kab) : kP(x.prov), o = titik.get(kunci) || { kunci, nama: x.kab || x.prov, prov: x.prov, lat: x.lat, lng: x.lng, n: 0 };
      o.n++; titik.set(kunci, o);
      if (x.kab) { const ok = kab.get(kunci) || { kunci, nama: x.kab, prov: x.prov, n: 0 }; ok.n++; kab.set(kunci, ok); }
    }
  }
  return { prov: [...prov.values()].sort((a, b) => b.n - a.n), kab: [...kab.values()].sort((a, b) => b.n - a.n), titik: [...titik.values()], berlokasi };
}
const cocokKunci = (r, kunci) => (r.wilayah || []).some((x) => (kunci.startsWith("K|") ? kK(x.prov, x.kab) === kunci : x.prov === kunci.slice(2)));

const barisList = (xs, pilih) => xs.map((x, i) => `<li><button type="button" class="brt-pb${x.kunci === pilih ? " on" : ""}" data-wk="${esc(x.kunci)}"><span class="brt-pno">${i + 1}</span><span class="brt-pnm"><b>${esc(x.nama)}</b>${x.prov !== x.nama ? `<small>${esc(x.prov)}</small>` : ""}</span><em>${angka(x.n)}</em></button></li>`).join("");

export function petaHtml() {
  return `<div class="brt-peta"><div class="brt-pl" id="brPl"></div><div class="brt-pm" id="brPeta" role="region" aria-label="${esc(t("brt.peta.aria"))}"></div><div class="brt-pn" id="brPn"></div></div>`;
}

let peta = null, tema = null;
/** Pasang daftar kiri, panel kanan, dan peta. `kunciAwal` = area terpilih. Mengembalikan fungsi pilih(kunci). */
export async function pasangPeta(rows, { onCari } = {}) {
  const A = agregat(rows), el = document.getElementById("brPeta");
  if (!A.titik.length) return null;
  const pl = document.getElementById("brPl"), pn = document.getElementById("brPn");
  let pilih = A.kab[0]?.kunci || A.prov[0].kunci;
  const gambarKiri = () => { pl.innerHTML = `<h4>${esc(t("brt.peta.prov"))}</h4><ol class="brt-pls">${barisList(A.prov.slice(0, 6).map((x) => ({ ...x, kunci: kP(x.nama) })), pilih)}</ol>${A.kab.length ? `<h4>${esc(t("brt.peta.kab"))}</h4><ol class="brt-pls">${barisList(A.kab.slice(0, 6), pilih)}</ol>` : ""}`; };
  const gambarPanel = () => {
    const xs = rows.filter((r) => cocokKunci(r, pilih)).sort((a, b) => b.terbit.localeCompare(a.terbit)), nama = pilih.startsWith("K|") ? pilih.split("|")[2] : pilih.slice(2);
    pn.innerHTML = `<h4>${esc(nama)}</h4><p class="brt-pj">${esc(t("brt.peta.jml", { n: angka(xs.length) }))}</p><ul class="brt-pp">${xs.slice(0, 8).map((r) => `<li><a href="${esc(urlAman(r.url))}" target="_blank" rel="noopener noreferrer"><b>${esc(r.judul)}</b><small>${esc(r.media)}, ${esc(tanggal(r.terbit.slice(0, 10)))}</small></a></li>`).join("")}</ul><button type="button" class="jm-tbl jm-tbl-kecil" data-cari="${esc(nama)}">${esc(t("brt.peta.daftar"))}</button>`;
  };
  const pilihArea = (k, terbang = true) => {
    pilih = k; gambarKiri(); gambarPanel();
    const o = A.titik.find((x) => x.kunci === k) || A.titik.find((x) => x.prov === k.slice(2));
    if (terbang && peta && o) peta.easeTo({ center: [o.lng, o.lat], zoom: Math.max(peta.getZoom(), k.startsWith("K|") ? 6 : 4.6), duration: 600 });
  };
  gambarKiri(); gambarPanel();
  document.getElementById("brPl").addEventListener("click", (e) => { const b = e.target.closest("[data-wk]"); if (b) pilihArea(b.dataset.wk); });
  pn.addEventListener("click", (e) => { const b = e.target.closest("[data-cari]"); if (b && onCari) onCari(b.dataset.cari); });
  try { await muatMapLibre(); } catch { el.innerHTML = `<p class="brt-lead">${esc(t("brt.peta.galat"))}</p>`; return pilihArea; }
  const data = () => ({ type: "FeatureCollection", features: A.titik.map((o) => ({ type: "Feature", geometry: { type: "Point", coordinates: [o.lng, o.lat] }, properties: { k: o.kunci, nama: o.nama, n: o.n } })) });
  const lapis = () => {
    if (peta.getSource("brt")) return;
    peta.addSource("brt", { type: "geojson", data: data() });
    peta.addLayer({ id: "brt-b", type: "circle", source: "brt", paint: { "circle-radius": ["interpolate", ["linear"], ["sqrt", ["get", "n"]], 1, 8, 5, 18, 12, 30], "circle-color": token("--accent"), "circle-opacity": 0.85, "circle-stroke-color": token("--card"), "circle-stroke-width": 2 } });
    peta.addLayer({ id: "brt-n", type: "symbol", source: "brt", filter: [">=", ["get", "n"], 2], layout: { "text-field": ["to-string", ["get", "n"]], "text-size": 12, "text-font": ["Noto Sans Bold"], "text-allow-overlap": true }, paint: { "text-color": token("--on-brand") } });
  };
  peta?.remove();
  peta = new maplibregl.Map({ container: el, style: gaya(), bounds: [[95, -11], [141, 6]], fitBoundsOptions: { padding: 12 }, minZoom: 3, maxZoom: 9, dragRotate: false, pitchWithRotate: false, attributionControl: { compact: true } });
  peta.on("style.load", lapis);
  const pop = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 12 });
  peta.on("mousemove", "brt-b", (e) => { const p = e.features[0].properties; peta.getCanvas().style.cursor = "pointer"; pop.setLngLat(e.features[0].geometry.coordinates).setText(`${p.nama}: ${angka(p.n)}`).addTo(peta); });
  peta.on("mouseleave", "brt-b", () => { peta.getCanvas().style.cursor = ""; pop.remove(); });
  peta.on("click", "brt-b", (e) => pilihArea(e.features[0].properties.k, false));
  tema?.disconnect();
  tema = new MutationObserver(() => peta?.setStyle(gaya())); tema.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return pilihArea;
}
