// Konsesi lahan: HTI/kayu serat (gfw_wood_fiber), HPH/IUPHHK (gfw_logging, hanya IDN, termasuk restorasi ekosistem bila berlabel), sawit (gfw_oil_palm, hanya IDN).
// Sumber: KLHK via Global Forest Watch. Tambang (gfw_mining_concessions) tidak punya ubin vektor publik: dicatat blokir di klaim_lahan.json.
import { panenVektor, tulisGeo, jalankan } from './lahan_lib.mjs';
const ha = (v) => Math.round(Number(v) || 0);
const LAPIS = [
  { jenis: 'hti', nama: 'gfw_wood_fiber', ver: 'v202106', filter: (s) => (s.country === 'IDN' ? { id: 'hti-' + (s.gfw_fid ?? s.gfw_geostore_id), sifat: { n: s.name, j: 'hti', ha: ha(s.gfw_area__ha) } } : null) },
  { jenis: 'hph', nama: 'gfw_logging', ver: 'v202106', filter: (s) => (s.country === 'IDN' ? { id: 'hph-' + (s.gfw_fid ?? s.gfw_geostore_id), sifat: { n: s.name, j: /restorasi|rehabilitasi|\bRE\b/i.test(s.name || '') ? 're' : 'hph', ha: ha(s.gfw_area__ha) } } : null) },
  { jenis: 'sawit', nama: 'gfw_oil_palm', ver: 'v20191031', filter: (s) => (s.country === 'IDN' ? { id: 'sw-' + (s.gfw_geostore_id || s.name), sifat: { n: s.company || s.name, j: 'sawit', ha: ha(s.area_ha) } } : null) },
];
jalankan(import.meta.url, async () => {
  const semua = new Map();
  for (const l of LAPIS) for (const [id, e] of await panenVektor({ ...l, z: 6, tol: 3, minLuas: 4 })) semua.set(id, e);
  tulisGeo('lahan_konsesi.geojson', semua, { sumber: 'KLHK via Global Forest Watch (gfw_wood_fiber v202106, gfw_logging v202106, gfw_oil_palm v20191031)', tanggal: new Date().toISOString().slice(0, 10) });
});
