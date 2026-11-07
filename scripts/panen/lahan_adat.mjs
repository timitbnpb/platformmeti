// Wilayah adat/komunitas: LandMark (CC BY-SA 4.0) lewat ubin GFW. BRWA (brwa.id) TIDAK dipanen: robots.txt-nya menolak crawler AI dan unduhan poligon butuh akun.
import { panenVektor, tulisGeo, jalankan } from './lahan_lib.mjs';
jalankan(import.meta.url, async () => {
  const m = await panenVektor({ nama: 'landmark_ip_lc_and_indicative_poly', ver: 'v20260612', z: 5, tol: 3, minLuas: 3, filter: (s) => (s.country === 'Indonesia' || s.country === 'IDN' || s.country == null ? { id: 'adat-' + (s.gfw_fid ?? s.id ?? s.name), sifat: { n: s.name, kat: s.category, st: s.doc_status } } : null) });
  tulisGeo('lahan_adat.geojson', m, { sumber: 'LandMark, CC BY-SA 4.0 (https://www.landmarkmap.org/)', tanggal: new Date().toISOString().slice(0, 10) });
});
