// Mangrove: Global Mangrove Watch peta sebaran 2016 (gmw_global_mangrove_extent_2016, CC BY 4.0) lewat ubin vektor GFW. Tingkat bukti: citra satelit, bukan survei lapangan.
import { panenVektor, tulisGeo, jalankan } from './lahan_lib.mjs';
jalankan(import.meta.url, async () => {
  const m = await panenVektor({ nama: 'gmw_global_mangrove_extent_2016', ver: 'v20201210', z: 6, tol: 3, minLuas: 5, filter: () => ({ id: 'mangrove', sifat: { j: 'mangrove' } }) });
  tulisGeo('lahan_mangrove.geojson', m, { sumber: 'Global Mangrove Watch 2016, CC BY 4.0 (https://www.globalmangrovewatch.org/)', tanggal: new Date().toISOString().slice(0, 10) });
});
