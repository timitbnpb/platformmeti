/* Koroplet provinsi 3D (MapLibre fill-extrusion), modul bersama: /wilayah, /indeks, /meti-wilayah.
   pasangPeta3d(el, { nilai: Map(kode->angka), kelas?: Map(kode->0..4), satuan, judulLegenda, warna: { dasar:"--accent-isi", latar:"--card" },
     nama: Map(kode->nama), nilaiTeks?(kode), tip?(kode)->html, href?(kode), warnaVar?(kode)->nama token | null, tinggi=true, label=5, padding })
   Hasil: Promise<{ perbarui(opsi), sorot(kode), hancurkan() } | null>; null = tanpa WebGL/pustaka, pemanggil memakai SVG 2D.
   Warna dibaca dari token CSS (tema.css) lalu diteruskan ke MapLibre. */
import { t } from "/i18n.js";
import { esc } from "/inti/umum.js";
import { muatMapLibre } from "/inti/maplibre.js";
import { geoProvinsi, BATAS_ID } from "/inti/peta_indonesia.js";

const PCT = [16, 34, 54, 76, 100], HMAKS = 520000, HMIN = 50000;
const IK = {
  masuk: '<path d="M12 5v14M5 12h14"/>', keluar: '<path d="M5 12h14"/>', reset: '<path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5"/>',
  d3: '<path d="M12 3 3 8v8l9 5 9-5V8z"/><path d="M3 8l9 5 9-5M12 13v8"/>', d2: '<rect x="4" y="4" width="16" height="16" rx="2"/>',
};
const ik = (k) => `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${IK[k]}</svg>`;
const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
const rgb = (h) => { const m = /^#([0-9a-f]{6})$/i.exec(h); return m ? [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16)) : null; };
/** campur token a sebesar p% ke token b; bukan hex = warna a apa adanya */
const campur = (a, b, p) => { const x = rgb(a), y = rgb(b); return x && y ? "rgb(" + x.map((c, i) => Math.round(c * p / 100 + y[i] * (1 - p / 100))).join(",") + ")" : a; };
const gl = () => { try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch (e) { return false; } };
const kerucut = (g) => { // titik label: pusat kotak poligon terbesar
  let b = null, la = -1;
  for (const poli of g.type === "Polygon" ? [g.coordinates] : g.coordinates) {
    const r = poli[0], xs = r.map((p) => p[0]), ys = r.map((p) => p[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    if ((x1 - x0) * (y1 - y0) > la) { la = (x1 - x0) * (y1 - y0); b = [(x0 + x1) / 2, (y0 + y1) / 2]; }
  }
  return b;
};

export async function pasangPeta3d(el, opsi) {
  if (!gl()) return null;
  let geo;
  try { [geo] = await Promise.all([geoProvinsi(), muatMapLibre()]); } catch (e) { return null; }
  if (!geo) return null;
  if (!document.querySelector("link[data-p3d]")) { const c = document.createElement("link"); c.rel = "stylesheet"; c.href = "/inti/peta3d.css"; c.dataset.p3d = ""; document.head.append(c); await new Promise((ok) => { c.onload = c.onerror = ok; }); }
  let o = opsi, peta, pitch3 = true;
  const gerak = matchMedia("(prefers-reduced-motion:reduce)").matches ? 0 : 1;
  el.classList.add("jm-p3d"); el.replaceChildren();
  const kanvas = document.createElement("div"); kanvas.className = "jm-p3d-k"; el.append(kanvas);
  const tip = document.createElement("div"); tip.className = "jm-p3d-tip"; tip.hidden = true; tip.setAttribute("role", "status"); el.append(tip);
  const kon = document.createElement("div"); kon.className = "jm-p3d-kon"; kon.setAttribute("role", "group"); kon.setAttribute("aria-label", t("p3d.kontrol"));
  const tb = (k, ikon, fn, pressed) => { const b = document.createElement("button"); b.type = "button"; b.className = "jm-p3d-b"; b.innerHTML = ik(ikon); b.title = b.ariaLabel = t(k); if (pressed !== undefined) b.setAttribute("aria-pressed", pressed); b.addEventListener("click", fn); kon.append(b); return b; };
  const bMode = tb("p3d.mode", "d3", () => { pitch3 = !pitch3; bMode.setAttribute("aria-pressed", String(pitch3)); bMode.innerHTML = ik(pitch3 ? "d3" : "d2"); kamera(); }, "true");
  tb("p3d.masuk", "masuk", () => peta.zoomIn({ duration: gerak * 250 })); tb("p3d.keluar", "keluar", () => peta.zoomOut({ duration: gerak * 250 })); tb("p3d.reset", "reset", () => kamera());
  el.append(kon);

  const kamera = () => peta.fitBounds(BATAS_ID, { padding: o.padding || { top: 70, bottom: 30, left: 20, right: 20 }, pitch: pitch3 ? 45 : 0, bearing: pitch3 ? -8 : 0, duration: gerak * 700, maxZoom: 6 });
  const warna = () => {
    const w = o.warna || {}, dasar = css(w.dasar || "--accent-isi"), latar = css(w.latar || "--card");
    return { dasar, latar, kos: campur(css("--ink2"), latar, 18), sorot: css("--sorot"), laut: campur(css("--soft-biru"), css("--paper"), 70), teks: css("--head"), halo: css("--card") };
  };
  const kelasDari = () => { // tanpa kelas dari pemanggil: kuantil 5
    if (o.kelas) return o.kelas;
    const v = [...o.nilai.values()].filter((x) => x !== null && x !== undefined).sort((a, b) => a - b), q = (f) => v[Math.min(v.length - 1, Math.floor(f * v.length))], pem = [.2, .4, .6, .8].map(q);
    return new Map([...o.nilai].map(([k, x]) => [k, x === null || x === undefined ? -1 : pem.filter((b) => x >= b).length]));
  };
  const ranking = () => [...o.nilai].filter(([, v]) => v !== null && v !== undefined).sort((a, b) => b[1] - a[1]);
  const fitur = () => {
    const c = warna(), kel = kelasDari(), mx = Math.max(1, ...o.nilai.values()), tinggi = o.tinggi !== false;
    return geo.features.filter((f) => o.nama.has(f.properties.kode)).map((f) => {
      const k = f.properties.kode, v = o.nilai.get(k), kl = kel.get(k) ?? -1, tv = o.warnaVar?.(k);
      const wr = tv ? css(tv) : kl < 0 ? c.kos : campur(c.dasar, c.latar, PCT[kl]);
      const h = !tinggi ? HMIN * 2 : v === null || v === undefined || v <= 0 ? HMIN / 2 : HMIN + Math.sqrt(v / mx) * (HMAKS - HMIN); // akar: provinsi kecil tetap terlihat
      return { type: "Feature", properties: { kode: k, h, c: wr, hv: campur(c.sorot, wr, 55) }, geometry: f.geometry };
    });
  };
  const titik = () => {
    const n = o.label === undefined ? 5 : o.label, nt = o.nilaiTeks || ((k) => String(o.nilai.get(k)));
    return ranking().slice(0, n).map(([k], i) => {
      const f = geo.features.find((x) => x.properties.kode === k);
      return { type: "Feature", properties: { kode: k, u: i, tk: `${o.nama.get(k)}\n${nt(k)}` }, geometry: { type: "Point", coordinates: kerucut(f.geometry) } };
    });
  };
  const isiTip = (k) => {
    if (o.tip) return o.tip(k);
    const v = o.nilai.get(k), r = ranking().findIndex(([x]) => x === k) + 1, nt = o.nilaiTeks || String;
    return `<header><img class="jm-p3d-lb" src="/img/provinsi/${esc(k)}.png" width="32" height="32" alt=""><div><strong>${esc(o.nama.get(k))}</strong><small>${esc(r ? t("p3d.peringkat", { r, n: ranking().length }) : t("p3d.tanpa"))}</small></div></header><p><span>${esc(o.judulLegenda || "")}</span><b>${esc(v === null || v === undefined ? "-" : nt(k))}</b></p>`;
  };
  const tinggiExpr = (f) => ["+", ["*", f, ["get", "h"]], ["case", ["boolean", ["feature-state", "hover"], false], HMAKS * 0.07 * f, 0]];
  let anim = 0;
  const tumbuh = () => {
    cancelAnimationFrame(anim);
    if (!gerak) return peta.setPaintProperty("p3d-kolom", "fill-extrusion-height", tinggiExpr(1));
    const t0 = performance.now(), langkah = (now) => {
      const p = Math.min(1, (now - t0) / 900), e = 1 - Math.pow(1 - p, 3);
      peta.setPaintProperty("p3d-kolom", "fill-extrusion-height", tinggiExpr(e));
      if (p < 1) anim = requestAnimationFrame(langkah);
    };
    anim = requestAnimationFrame(langkah);
  };
  const gaya = () => ({ version: 8, glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf", sources: {}, layers: [{ id: "laut", type: "background", paint: { "background-color": warna().laut } }] });
  peta = new maplibregl.Map({ container: kanvas, style: gaya(), bounds: BATAS_ID, fitBoundsOptions: { padding: o.padding || { top: 70, bottom: 30, left: 20, right: 20 } }, pitch: 45, bearing: -8, maxPitch: 70, scrollZoom: false, attributionControl: false, dragRotate: true });
  let hov = null;
  const sorot = (k) => {
    if (hov === k) return;
    if (hov) peta.setFeatureState({ source: "p3d", id: hov }, { hover: false });
    hov = k; if (k) peta.setFeatureState({ source: "p3d", id: k }, { hover: true });
    el.dispatchEvent(new CustomEvent("jm:p3d-sorot", { detail: k }));
  };
  const pasangData = () => {
    peta.getSource("p3d").setData({ type: "FeatureCollection", features: fitur() });
    peta.getSource("p3d-lbl").setData({ type: "FeatureCollection", features: titik() });
  };
  const terapkanWarna = () => {
    const c = warna();
    peta.setPaintProperty("laut", "background-color", c.laut);
    peta.setPaintProperty("p3d-lbl", "text-color", c.teks); peta.setPaintProperty("p3d-lbl", "text-halo-color", c.halo);
    pasangData();
  };
  peta.on("load", () => {
    peta.resize(); peta.fitBounds(BATAS_ID, { padding: o.padding || { top: 70, bottom: 30, left: 20, right: 20 }, pitch: 45, bearing: -8, duration: 0, maxZoom: 6 });
    const c = warna();
    peta.addSource("p3d", { type: "geojson", data: { type: "FeatureCollection", features: fitur() }, promoteId: "kode" });
    peta.addLayer({ id: "p3d-kolom", type: "fill-extrusion", source: "p3d", paint: {
      "fill-extrusion-color": ["case", ["boolean", ["feature-state", "hover"], false], ["get", "hv"], ["get", "c"]],
      "fill-extrusion-height": tinggiExpr(gerak ? 0 : 1), "fill-extrusion-opacity": 0.94, "fill-extrusion-vertical-gradient": true } });
    peta.addSource("p3d-lbl", { type: "geojson", data: { type: "FeatureCollection", features: titik() } });
    peta.addLayer({ id: "p3d-lbl", type: "symbol", source: "p3d-lbl", layout: {
      "text-field": ["get", "tk"], "text-font": ["Noto Sans Bold"], "text-size": 11, "text-anchor": "bottom", "text-offset": [0, -2.2],
      "text-justify": "center", "symbol-sort-key": ["get", "u"], "text-padding": 6, "text-allow-overlap": false, "text-optional": true },
      paint: { "text-color": c.teks, "text-halo-color": c.halo, "text-halo-width": 1.6, "text-halo-blur": 0.5 } });
    peta.on("mousemove", "p3d-kolom", (e) => {
      const k = e.features[0]?.properties.kode; if (!k) return;
      sorot(k); peta.getCanvas().style.cursor = "pointer"; tip.innerHTML = isiTip(k); tip.hidden = false;
      tip.style.left = Math.max(8, Math.min(el.clientWidth - tip.offsetWidth - 8, e.point.x + 16)) + "px";
      tip.style.top = Math.max(8, Math.min(el.clientHeight - tip.offsetHeight - 8, e.point.y + 16)) + "px";
    });
    peta.on("mouseleave", "p3d-kolom", () => { sorot(null); tip.hidden = true; peta.getCanvas().style.cursor = ""; });
    peta.on("click", "p3d-kolom", (e) => { const k = e.features[0]?.properties.kode; if (k) location.assign(o.href ? o.href(k) : `/wilayah?prov=${encodeURIComponent(k)}`); });
    tumbuh();
  });
  const amat = new MutationObserver(() => peta.isStyleLoaded() && terapkanWarna()); // ganti tema = baca ulang token
  amat.observe(document.documentElement, { attributes: true });
  return {
    perbarui(baru) { o = { ...o, ...baru }; if (peta.getSource("p3d")) { pasangData(); tumbuh(); } },
    sorot(k) { sorot(k); if (!k) tip.hidden = true; },
    hancurkan() { cancelAnimationFrame(anim); amat.disconnect(); peta.remove(); el.classList.remove("jm-p3d"); el.replaceChildren(); },
  };
}
