// Kawasan hutan: KLHK (idn_forest_area v201709) lewat ubin GFW, dikelompokkan per fungsi (konservasi, lindung, produksi, konversi).
import { panenVektor, tulisGeo, jalankan } from './lahan_lib.mjs';
const kelas = (s) => {
  const t = `${s.desc_in || ''} ${s.kelas || ''}`.toLowerCase();
  if (/konservasi|suaka|taman nasional|cagar|taman (wisata|hutan raya|buru)/.test(t)) return 'konservasi';
  if (/lindung/.test(t)) return 'lindung';
  if (/konversi/.test(t)) return 'konversi';
  if (/produksi/.test(t)) return 'produksi';
  return null;
};
jalankan(import.meta.url, async () => {
  const m = await panenVektor({ nama: 'idn_forest_area', ver: 'v201709', z: 5, tol: 4, minLuas: 8, filter: (s) => { const k = kelas(s); return k ? { id: 'hutan-' + k, sifat: { j: k } } : null; } });
  tulisGeo('lahan_hutan.geojson', m, { sumber: 'KLHK, Kawasan Hutan (versi 2017) via Global Forest Watch', tanggal: new Date().toISOString().slice(0, 10) });
});
