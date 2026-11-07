/* Peta berita: peta penuh lebar khusus Indonesia (luar negeri diredam), panel mengambang yang bisa digeser:
   kiri = wilayah paling sering disebut (tab Provinsi/Kabupaten, lambang), kanan = berita wilayah terpilih (berthumbnail).
   Data: tiap baris berita bisa membawa wilayah:[{prov,kab?,lat,lng}] (scripts/panen/berita_wilayah.mjs). Warna dari token. */
import { t, angka } from "/i18n.js";
import { esc } from "/inti/umum.js";
import { muatMapLibre } from "/inti/maplibre.js";
import { rapikanPeta, pasangBatas, geoProvinsi, BATAS_ID } from "/inti/peta_indonesia.js";
import { geserPanel } from "/inti/panel_geser.js";
import { PROV } from "/penerbit.js";

const gelap = () => (document.documentElement.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")) === "dark";
const gaya = () => "https://tiles.openfreemap.org/styles/" + (gelap() ? "dark" : "positron");
const token = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
const kP = (p) => "P|" + p, kK = (p, k) => "K|" + p + "|" + k;
const kode = (p) => PROV[String(p || "").trim().toLowerCase()];

/** Hitung sebutan: provinsi (artikel unik per provinsi), kabupaten, dan titik peta. */
export function agregat(rows) {
  const prov = new Map(), kab = new Map(), titik = new Map(); let berlokasi = 0;
  for (const r of rows) {
    const w = r.wilayah || []; if (!w.length) continue; berlokasi++;
    for (const p of new Set(w.map((x) => x.prov))) { const o = prov.get(p) || { kunci: kP(p), nama: p, n: 0 }; o.n++; prov.set(p, o); }
    for (const x of w) {
      const kunci = x.kab ? kK(x.prov, x.kab) : kP(x.prov), o = titik.get(kunci) || { kunci, nama: x.kab || x.prov, prov: x.prov, lat: x.lat, lng: x.lng, n: 0 };
      o.n++; titik.set(kunci, o);
      if (x.kab) { const ok = kab.get(kunci) || { kunci, nama: x.kab, prov: x.prov, n: 0 }; ok.n++; kab.set(kunci, ok); }
    }
  }
  return { prov: [...prov.values()].sort((a, b) => b.n - a.n), kab: [...kab.values()].sort((a, b) => b.n - a.n), titik: [...titik.values()], berlokasi };
}
const cocokKunci = (r, kunci) => (r.wilayah || []).some((x) => (kunci.startsWith("K|") ? kK(x.prov, x.kab) === kunci : x.prov === kunci.slice(2)));
const lambang = (p) => (kode(p) ? `<img class="brt-lb" src="/img/provinsi/${kode(p)}.png" width="28" height="28" alt="" loading="lazy" decoding="async">` : `<span class="brt-lb"></span>`);

const barisList = (xs, pilih) => xs.map((x) => `<li><button type="button" class="brt-pb${x.kunci === pilih ? " on" : ""}" data-wk="${esc(x.kunci)}">${lambang(x.prov || x.nama)}<span class="brt-pnm"><b>${esc(x.nama)}</b>${x.prov && x.prov !== x.nama ? `<small>${esc(x.prov)}</small>` : ""}</span><em>${angka(x.n)}</em></button></li>`).join("");

export function petaHtml() {
  return `<div class="brt-peta"><div class="brt-pm" id="brPeta" role="region" aria-label="${esc(t("brt.peta.aria"))}"></div>
    <details class="brt-fl" id="brPl"${innerWidth >= 1000 ? " open" : ""}><summary>${esc(t("brt.peta.judul"))}</summary>
      <div class="brt-tab" role="tablist"><button type="button" role="tab" aria-selected="true" data-tab="prov">${esc(t("brt.peta.t.prov"))}</button><button type="button" role="tab" aria-selected="false" data-tab="kab">${esc(t("brt.peta.t.kab"))}</button></div>
      <ol class="brt-pls" id="brPls"></ol></details>
    <details class="brt-fl brt-fr" id="brPn"><summary id="brPnJ"></summary><div class="brt-pn-isi" id="brPnIsi"></div></details></div>`;
}

let peta = null, tema = null, MARK = new Map();
/** Pasang peta + panel. opsi.baris(r) = <li> berita bergambar (dari berita.js). Mengembalikan fungsi pilih(kunci). */
export async function pasangPeta(rows, { onCari, baris } = {}) {
  const A = agregat(rows), el = document.getElementById("brPeta");
  if (!A.titik.length || !el) return null;
  const pl = document.getElementById("brPl"), pn = document.getElementById("brPn"), isi = document.getElementById("brPnIsi"), daftar = document.getElementById("brPls");
  let pilih = A.prov[0].kunci, tab = "prov";
  const wide = innerWidth >= 1000;
  const gambarKiri = () => { daftar.innerHTML = barisList((tab === "prov" ? A.prov : A.kab).slice(0, 12), pilih); };
  const gambarPanel = () => {
    const xs = rows.filter((r) => cocokKunci(r, pilih)).sort((a, b) => b.terbit.localeCompare(a.terbit)), nama = pilih.startsWith("K|") ? pilih.split("|")[2] : pilih.slice(2);
    document.getElementById("brPnJ").innerHTML = `<span>${esc(nama)}</span><em>${esc(t("brt.peta.jml", { n: angka(xs.length) }))}</em>`;
    isi.innerHTML = `<ul class="brt-pp">${xs.slice(0, 8).map(baris).join("")}</ul><button type="button" class="jm-tbl jm-tbl-kecil" data-cari="${esc(nama)}">${esc(t("brt.peta.daftar"))}</button>`;
  };
  const padding = () => {
    const p = { top: 24, bottom: 24, left: 12, right: 12 };
    if (innerWidth >= 1000) { p.left = pl.open ? 300 : 12; p.right = 12; }
    return p;
  };
  const pilihArea = (k, terbang = true, buka = true) => {
    pilih = k; tab = k.startsWith("K|") ? "kab" : tab;
    for (const b of pl.querySelectorAll("[data-tab]")) b.setAttribute("aria-selected", String(b.dataset.tab === tab));
    gambarKiri(); gambarPanel(); if (buka) pn.open = true;
    peta?.getLayer("brt-sel") && peta.setFilter("brt-sel", ["==", ["get", "k"], k]);
    peta?.getLayer("brt-pilih") && peta.setFilter("brt-pilih", ["==", ["get", "kode"], String(kode(k.startsWith("K|") ? k.split("|")[1] : k.slice(2)) ?? "")]);
    const o = A.titik.find((x) => x.kunci === k) || A.titik.find((x) => x.prov === k.slice(2));
    if (terbang && peta && o) peta.easeTo({ center: [o.lng, o.lat], zoom: Math.max(peta.getZoom(), k.startsWith("K|") ? 6.5 : 5), duration: 600 });
  };
  gambarKiri(); gambarPanel(); pn.open = wide;
  pl.addEventListener("click", (e) => {
    const tb = e.target.closest("[data-tab]"); if (tb) { tab = tb.dataset.tab; for (const b of pl.querySelectorAll("[data-tab]")) b.setAttribute("aria-selected", String(b === tb)); gambarKiri(); return; }
    const b = e.target.closest("[data-wk]"); if (b) pilihArea(b.dataset.wk);
  });
  pn.addEventListener("click", (e) => { const b = e.target.closest("[data-cari]"); if (b && onCari) onCari(b.dataset.cari); });
  if (wide) { geserPanel(pl, { kunci: "wilayah" }); geserPanel(pn, { kunci: "berita" }); }
  try { await muatMapLibre(); } catch { el.innerHTML = `<p class="brt-lead">${esc(t("brt.peta.galat"))}</p>`; return pilihArea; }

  const namaDariKode = new Map(A.prov.map((p) => [String(kode(p.nama)), p.nama]));
  const data = () => ({ type: "FeatureCollection", features: A.titik.map((o) => ({ type: "Feature", geometry: { type: "Point", coordinates: [o.lng, o.lat] }, properties: { k: o.kunci, nama: o.nama, n: o.n } })) });
  const lapis = () => {
    for (const m of MARK.values()) m.remove();
    MARK.clear();
    const idLabel = rapikanPeta(peta);
    for (const ly of peta.getStyle().layers || []) if (ly["source-layer"] === "water_name") peta.setLayoutProperty(ly.id, "visibility", "none");
    peta.addSource("brt", { type: "geojson", data: data(), cluster: true, clusterRadius: 48, clusterMaxZoom: 7, clusterProperties: { tot: ["+", ["get", "n"]] } });
    peta.addLayer({ id: "brt-sel", type: "circle", source: "brt", filter: ["==", ["get", "k"], pilih], paint: { "circle-radius": 22, "circle-color": token("--accent"), "circle-opacity": 0.25, "circle-stroke-color": token("--accent"), "circle-stroke-width": 2 } });
    peta.addLayer({ id: "brt-t", type: "circle", source: "brt", filter: ["!", ["has", "point_count"]], paint: { "circle-radius": ["interpolate", ["linear"], ["sqrt", ["get", "n"]], 1, 6, 5, 12, 12, 18], "circle-color": token("--accent"), "circle-opacity": 0.9, "circle-stroke-color": token("--card"), "circle-stroke-width": 1.5 } });
    peta.addLayer({ id: "brt-n", type: "symbol", source: "brt", filter: ["all", ["!", ["has", "point_count"]], [">=", ["get", "n"], 2]], layout: { "text-field": ["to-string", ["get", "n"]], "text-size": 11, "text-font": ["Noto Sans Bold"], "text-allow-overlap": true }, paint: { "text-color": token("--on-brand") } });
    pasangBatas(peta, token, idLabel, "brt-sel");
    geoProvinsi().then((g) => {
      if (!g || !peta.getStyle() || peta.getSource("provb")) return;
      peta.addSource("provb", { type: "geojson", data: g });
      const ada = [...namaDariKode.keys()];
      peta.addLayer({ id: "brt-ada", type: "fill", source: "provb", filter: ["in", ["get", "kode"], ["literal", ada]], paint: { "fill-color": token("--accent-isi"), "fill-opacity": gelap() ? 0.16 : 0.1 } }, "brt-sel");
      peta.addLayer({ id: "brt-pilih", type: "fill", source: "provb", filter: ["==", ["get", "kode"], ""], paint: { "fill-color": token("--accent-isi"), "fill-opacity": gelap() ? 0.32 : 0.22 } }, "brt-sel");
      pilihArea(pilih, false, false);
    });
  };
  const donat = (f) => {
    const tot = f.properties.tot, uk = Math.round(Math.min(56, 34 + Math.sqrt(tot) * 2.4)), r = uk / 2, tb = 4, rr = r - tb / 2 - 1;
    const b = document.createElement("button");
    b.type = "button"; b.className = "brt-donat"; b.setAttribute("aria-label", t("brt.peta.klaster", { n: angka(tot) }));
    b.innerHTML = `<svg width="${uk}" height="${uk}" viewBox="0 0 ${uk} ${uk}" aria-hidden="true" focusable="false"><circle cx="${r}" cy="${r}" r="${r - 0.75}" fill="${token("--card")}"/><circle cx="${r}" cy="${r}" r="${rr}" fill="none" stroke="${token("--accent")}" stroke-width="${tb}"/></svg><b>${esc(angka(tot))}</b>`;
    b.addEventListener("click", (e) => { e.stopPropagation(); peta.getSource("brt").getClusterExpansionZoom(f.properties.cluster_id).then((z) => peta.easeTo({ center: f.geometry.coordinates, zoom: z + 0.5 })).catch(() => {}); });
    return b;
  };
  const donatBaru = () => {
    if (!peta.getSource("brt") || !peta.isSourceLoaded("brt")) return;
    const baru = new Map();
    for (const f of peta.querySourceFeatures("brt", { filter: ["has", "point_count"] })) { const p = f.properties; if (!baru.has(p.cluster_id)) baru.set(p.cluster_id, [p.cluster_id + ":" + p.tot, f]); }
    for (const [id, m] of MARK) if (!baru.has(id) || baru.get(id)[0] !== m.kunci) { m.remove(); MARK.delete(id); }
    for (const [id, [kunci, f]] of baru) if (!MARK.has(id)) { const m = new maplibregl.Marker({ element: donat(f) }).setLngLat(f.geometry.coordinates).addTo(peta); m.kunci = kunci; MARK.set(id, m); }
  };
  peta?.remove();
  peta = new maplibregl.Map({ container: el, style: gaya(), bounds: BATAS_ID, fitBoundsOptions: { padding: padding() }, minZoom: 3, maxZoom: 10, dragRotate: false, pitchWithRotate: false, attributionControl: { compact: true } });
  peta.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
  peta.on("style.load", lapis);
  for (const ev of ["sourcedata", "moveend", "idle"]) peta.on(ev, donatBaru);
  let disentuh = false;
  peta.on("dragstart", () => { disentuh = true; }); peta.on("wheel", () => { disentuh = true; });
  new ResizeObserver(() => { if (!peta) return; peta.resize(); if (!disentuh) peta.fitBounds(BATAS_ID, { padding: padding(), duration: 0 }); }).observe(el);
  const pop = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 12 });
  peta.on("mousemove", "brt-t", (e) => { const p = e.features[0].properties; peta.getCanvas().style.cursor = "pointer"; pop.setLngLat(e.features[0].geometry.coordinates).setText(`${p.nama}: ${angka(p.n)}`).addTo(peta); });
  peta.on("mouseleave", "brt-t", () => { peta.getCanvas().style.cursor = ""; pop.remove(); });
  peta.on("click", "brt-t", (e) => pilihArea(e.features[0].properties.k, false));
  peta.on("click", "brt-ada", (e) => {
    if (peta.queryRenderedFeatures(e.point, { layers: ["brt-t"] }).length) return;
    const nm = namaDariKode.get(String(e.features[0].properties.kode)); if (nm) pilihArea(kP(nm), true);
  });
  peta.on("mouseenter", "brt-ada", () => { peta.getCanvas().style.cursor = "pointer"; });
  peta.on("mouseleave", "brt-ada", () => { peta.getCanvas().style.cursor = ""; });
  tema?.disconnect();
  tema = new MutationObserver(() => peta?.setStyle(gaya())); tema.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return pilihArea;
}
