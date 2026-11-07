/* Peta dasar khusus Indonesia: label tempat di luar wilayah disembunyikan, negara lain diredam, garis provinsi.
   Dipakai peta beranda (beranda_bawah.js); logika sama dengan peta di proyek.js. */
const INDONESIA = { type: "MultiPolygon", coordinates: [
  [[[94.8, 6.2], [97.8, 5.9], [100.8, 2.6], [102.6, 1.9], [104.5, 0.5], [106, -3], [106, -5], [124.9, -8], [124.9, -11.5], [105, -11.5], [94.5, -6.5], [94.8, 6.2]]],
  [[[108.8, 2.1], [111, 1.2], [114.5, 1.7], [115.8, 3.9], [117.8, 4.3], [119, 1], [119, -4.5], [108, -4.5], [108, 0], [108.8, 2.1]]],
  [[[118.5, 2.5], [125, 5], [128, 4.5], [135, 1], [141, 0], [141, -9.5], [128.5, -9.5], [128.5, -7.3], [125, -7.5], [119, -6], [118.5, 2.5]]],
] };
export const BATAS_ID = [[94, -11.5], [141.5, 6.5]];
const SEMBUNYI = /^(poi|housenumber|aerodrome_label|transportation_name)$/;
let geoProv = null;
export const geoProvinsi = () => (geoProv ??= fetch("/geo/provinsi.json").then((r) => r.json()).catch(() => { geoProv = null; return null; }));

/** Sembunyikan label non-tempat dan semua label tempat di luar Indonesia; kembalikan id lapisan label pertama. */
export function rapikanPeta(peta) {
  let idLabel = null;
  for (const ly of peta.getStyle().layers || []) {
    if (ly.type !== "symbol") continue;
    if (!idLabel) idLabel = ly.id;
    const sl = ly["source-layer"];
    if (SEMBUNYI.test(sl) || /shield|road_number/i.test(ly.id)) { peta.setLayoutProperty(ly.id, "visibility", "none"); continue; }
    if (sl === "place" || sl === "water_name") peta.setLayoutProperty(ly.id, "text-field", ["coalesce", ["get", "name:id"], ["get", "name:latin"], ["get", "name"]]);
    if (sl === "place") peta.setFilter(ly.id, ly.filter ? ["all", ly.filter, ["within", INDONESIA]] : ["within", INDONESIA]);
  }
  return idLabel;
}

/** Peredam di luar provinsi + garis provinsi. `warna(v)` memberi nilai token CSS; `sebelum` = id lapisan data pertama. */
export function pasangBatas(peta, warna, idLabel, sebelum) {
  geoProvinsi().then((g) => {
    if (!g || !peta.getStyle() || peta.getSource("prov")) return;
    const luar = [[[-180, -85], [180, -85], [180, 85], [-180, 85], [-180, -85]]];
    for (const f of g.features) for (const poli of f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates) luar.push(poli[0]);
    peta.addSource("prov", { type: "geojson", data: g });
    peta.addSource("luar", { type: "geojson", data: { type: "Feature", geometry: { type: "Polygon", coordinates: luar } } });
    peta.addLayer({ id: "luar-redam", type: "fill", source: "luar", paint: { "fill-color": warna("--paper"), "fill-opacity": 0.72 } }, idLabel || sebelum);
    peta.addLayer({ id: "prov-garis", type: "line", source: "prov", paint: { "line-color": warna("--accent-isi"), "line-opacity": 0.55, "line-width": ["interpolate", ["linear"], ["zoom"], 4, 0.6, 9, 1.6] } }, sebelum);
  });
}

/** Jalur SVG sederhana dari provinsi.json: proyeksi equirectangular ke kotak w x h, titik dirapatkan (jarak < eps dibuang). */
export function jalurProvinsi(g, w, h, [[x0, y0], [x1, y1]] = BATAS_ID, eps = 0.7) {
  const X = (lng) => ((lng - x0) / (x1 - x0)) * w, Y = (lat) => ((y1 - lat) / (y1 - y0)) * h;
  let d = "";
  for (const f of g.features) for (const poli of f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates) {
    const ring = poli[0]; let px = Infinity, py = Infinity, s = "", n = 0;
    for (const [lng, lat] of ring) { const x = X(lng), y = Y(lat); if (Math.hypot(x - px, y - py) < eps) continue; s += (n++ ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1); px = x; py = y; }
    if (n > 3) d += s + "Z";
  }
  return d;
}
