// Pembantu bersama: cocokkan titik pembangkit eksternal ke public/data/proyek.json (nama + jarak).
// Aturan jujur: jarak < 5 km hanya dipercaya bila proyek bertitik_persis; proyek berpresisi provinsi/kabupaten
// adalah titik pusat wilayah, jadi hanya bisa cocok lewat nama (kecocokan "nama-saja", lemah).
export const TEK_PROYEK = { solar: 'surya', wind: 'bayu', hydro: 'hidro', geothermal: 'panas-bumi', biomass: 'bioenergi', biogas: 'bioenergi', waste: 'biomassa-sampah', battery: 'penyimpanan' };
const UMUM = new Set(['pltu', 'pltd', 'pltg', 'pltgu', 'pltmg', 'plts', 'pltb', 'pltp', 'pltm', 'pltmh', 'pltbm', 'pltsa', 'pltbg', 'plta', 'pltn', 'pt', 'power', 'plant', 'station', 'solar', 'wind', 'hydro', 'geothermal', 'biomass', 'pembangkit', 'listrik', 'tenaga', 'surya', 'angin', 'air', 'uap', 'panas', 'bumi', 'gas', 'diesel', 'unit', 'ii', 'iii', 'iv', 'i', 'farm', 'project', 'ltd', 'persero', 'pln', 'tbk', 'dan', 'of', 'the', 'pv', 'dam', 'bendungan', 'waduk']);
export const norm = (s) => String(s || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, ' ').trim();
export const token = (s) => new Set(norm(s).split(' ').filter((t) => t.length > 1 && !UMUM.has(t)));
export function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let i = 0; for (const t of a) if (b.has(t)) i++;
  return i / (a.size + b.size - i);
}
export function jarakKm(lat1, lng1, lat2, lng2) {
  const r = Math.PI / 180, dLa = (lat2 - lat1) * r, dLo = (lng2 - lng1) * r;
  const h = Math.sin(dLa / 2) ** 2 + Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(dLo / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
}
export function siapkanProyek(proyek) {
  return proyek.filter((p) => p.lokasi && p.lokasi.lat != null).map((p) => ({ id: p.id, tek: p.teknologi, lat: p.lokasi.lat, lng: p.lokasi.lng, persis: p.lokasi.presisi === 'titik_persis', tok: token(p.nama) }));
}
// titik: {nama, lat, lng, tek (kunci TEK_PROYEK atau teknologi proyek)}. Kembalikan {proyek_id, kecocokan, jarak_km} atau null.
export function cocokkan(titik, daftar, maxKm = 5) {
  const tek = TEK_PROYEK[titik.tek] || titik.tek;
  const tok = token(titik.nama);
  let terbaik = null;
  for (const p of daftar) {
    if (p.tek && tek && p.tek !== tek) continue;
    const d = jarakKm(titik.lat, titik.lng, p.lat, p.lng), j = jaccard(tok, p.tok);
    let skor = 0, jenis = null;
    if (p.persis && d < maxKm && (j >= 0.5 || d < 1)) { skor = 2 + j; jenis = 'nama+jarak'; }
    else if (j >= 0.6 && !(p.persis && d > 25)) { skor = j; jenis = 'nama-saja'; }
    if (jenis && (!terbaik || skor > terbaik.skor)) terbaik = { skor, proyek_id: p.id, kecocokan: jenis, jarak_km: p.persis ? +d.toFixed(2) : null };
  }
  if (!terbaik) return null;
  const { skor, ...h } = terbaik; return h;
}
