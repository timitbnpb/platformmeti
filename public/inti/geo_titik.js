/* Geometri titik kecil, murni (tanpa DOM dan tanpa pustaka): jarak, titik-dalam-poligon, jarak ke garis. Dipakai /cek-lokasi dan uji.
   Koordinat selalu [lng, lat] derajat. Jarak pendek memakai proyeksi datar lokal (galat < 0,5 persen sampai 100 km); jarak jauh memakai haversine. */
const R_BUMI_KM = 6371.0088;
const RAD = Math.PI / 180;

/** Jarak lingkaran besar (km) antara dua titik { lat, lng }. */
export function jarakKm(a, b) {
  const dLat = (b.lat - a.lat) * RAD, dLng = (b.lng - a.lng) * RAD;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * RAD) * Math.cos(b.lat * RAD) * Math.sin(dLng / 2) ** 2;
  return 2 * R_BUMI_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Jarak (km) titik p ke segmen a-b ({lat,lng} semua), proyeksi datar di sekitar p. */
export function jarakSegmenKm(p, a, b) {
  const k = Math.cos(p.lat * RAD), km = R_BUMI_KM * RAD;
  const ax = (a.lng - p.lng) * k * km, ay = (a.lat - p.lat) * km, bx = (b.lng - p.lng) * k * km, by = (b.lat - p.lat) * km;
  const dx = bx - ax, dy = by - ay, d2 = dx * dx + dy * dy;
  const u = d2 ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / d2)) : 0;
  return Math.hypot(ax + u * dx, ay + u * dy);
}

/** Jarak (km) titik ke garis berkoordinat [[lng,lat],...]; Infinity bila kurang dari dua titik. */
export function jarakGarisKm(p, koor) {
  let min = Infinity;
  for (let i = 1; i < koor.length; i++) {
    const d = jarakSegmenKm(p, { lng: koor[i - 1][0], lat: koor[i - 1][1] }, { lng: koor[i][0], lat: koor[i][1] });
    if (d < min) min = d;
  }
  return min;
}

/** Ray casting: titik (x=lng, y=lat) di dalam satu cincin [[lng,lat],...]. */
export function dalamCincin(x, y, cincin) {
  let dalam = false;
  for (let i = 0, j = cincin.length - 1; i < cincin.length; j = i++) {
    const [xi, yi] = cincin[i], [xj, yj] = cincin[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) dalam = !dalam;
  }
  return dalam;
}

/** Poligon GeoJSON (cincin luar + lubang): di dalam luar dan bukan di lubang. */
export function dalamPoligon(x, y, cincinCincin) {
  if (!cincinCincin.length || !dalamCincin(x, y, cincinCincin[0])) return false;
  for (let i = 1; i < cincinCincin.length; i++) if (dalamCincin(x, y, cincinCincin[i])) return false;
  return true;
}

/** Geometri GeoJSON Polygon/MultiPolygon memuat titik? */
export function dalamGeometri(x, y, g) {
  if (!g) return false;
  if (g.type === "Polygon") return dalamPoligon(x, y, g.coordinates);
  if (g.type === "MultiPolygon") return g.coordinates.some((p) => dalamPoligon(x, y, p));
  return false;
}

/** Fitur GeoJSON dari koleksi yang memuat titik. */
export const fiturMemuat = (koleksi, lng, lat) => (koleksi?.features ?? []).filter((f) => dalamGeometri(lng, lat, f.geometry));

/** Terdekat dari daftar dengan jarak(item) -> km; mengembalikan { item, km } atau null. */
export function terdekat(daftar, jarak) {
  let m = null;
  for (const it of daftar) { const km = jarak(it); if (km != null && Number.isFinite(km) && (!m || km < m.km)) m = { item: it, km }; }
  return m;
}

/** n terdekat, urut naik menurut jarak. */
export function terdekatN(daftar, jarak, n) {
  return daftar.map((item) => ({ item, km: jarak(item) })).filter((x) => x.km != null && Number.isFinite(x.km)).sort((a, b) => a.km - b.km).slice(0, n);
}

/** Titik di dalam kotak [S, W, N, E]? */
export const dalamKotak = (lat, lng, [s, w, n, e]) => lat >= s && lat <= n && lng >= w && lng <= e;

/** Koordinat sah di wilayah Indonesia (kotak kasar) dan dibulatkan 5 desimal; null bila tidak sah. */
export function titikSah(lat, lng) {
  const a = Number(lat), b = Number(lng);
  if (!Number.isFinite(a) || !Number.isFinite(b) || a < -11.5 || a > 6.5 || b < 94.5 || b > 141.5) return null;
  return { lat: Math.round(a * 1e5) / 1e5, lng: Math.round(b * 1e5) / 1e5 };
}
