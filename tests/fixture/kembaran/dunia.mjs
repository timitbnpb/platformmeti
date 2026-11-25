// Dunia kecil buatan untuk uji graf kembaran (KJ-04). Dua provinsi (32 barat, 33 timur, batas bujur 108), tujuh gardu di lintang -7:
//   cincin A-B-C (tanpa jembatan) -> B-D, D-E (2 sirkit, tetap satu jalur), E-F: rantai jembatan -> F-G dua way paralel (bukan jembatan).
// Pembangkit: PLTU 1000 MW di A (akar), surya 100 MW di E, hidro 50 MW di G.
const gardu = (id, lng, lat, nama, mva) => ({ type: 'node', id, lat, lon: lng, tags: { power: 'substation', voltage: '150000', name: nama, ...(mva ? { 'transformer:rating': String(mva) } : {}) } });
const way = (id, a, b, cir) => ({ type: 'way', id, tags: { power: 'line', voltage: '150000', ...(cir ? { circuits: String(cir) } : {}) }, geometry: [{ lat: a[1], lon: a[0] }, { lat: b[1], lon: b[0] }] });
export const P = { A: [106.5, -7], B: [106.9, -7], C: [106.7, -6.65], D: [107.4, -7], E: [108.4, -7], F: [108.9, -7], G: [109.3, -7] };
export const GI = { A: 'gi_n101', B: 'gi_n102', C: 'gi_n103', D: 'gi_n104', E: 'gi_n105', F: 'gi_n106', G: 'gi_n107' };
export const elemen = () => [
  gardu(101, ...P.A, 'GI Alfa'), gardu(102, ...P.B, 'GI Bravo'), gardu(103, ...P.C, 'GI Charlie'), gardu(104, ...P.D, 'GI Delta', 60),
  gardu(105, ...P.E, 'GI Echo'), gardu(106, ...P.F, 'GI Foxtrot', 100), gardu(107, ...P.G, 'GI Golf'),
  way(201, P.A, P.B, 1), way(202, P.B, P.C, 1), way(203, P.C, P.A, 1), way(204, P.B, P.D, 1), way(205, P.D, P.E, 2), way(206, P.E, P.F, 1), way(207, P.F, P.G, 1), way(208, P.F, P.G, 1),
  // potongan kecil terpisah (< 50 km)
  way(209, [106.0, -8.2], [106.1, -8.2], 1),
];
const kotak = (w, e) => ({ type: 'Feature', properties: { kode: w[0] }, geometry: { type: 'Polygon', coordinates: [[[w[1], -8.5], [e, -8.5], [e, -6], [w[1], -6], [w[1], -8.5]]] } });
const baris = (kode, nama, wil, total, kap) => ({ kode, provinsi: nama, wilayah_pln: [wil], produksi_pln_gwh: { total, PLTU: total * 0.8, PLTS: total * 0.2 }, kapasitas_terpasang_mw: { total: kap } });
export const ctx = () => ({
  organisasi: { baris: [] },
  provinsi: { features: [kotak(['32', 106], 108), kotak(['33', 108], 110)] },
  pltu: { baris: [{ id: 'g1', st: 'operasi', lat: P.A[1], lng: P.A[0], mw_operasi: 1000, nama: 'PLTU Uji (contoh)', th_awal: 2000, pemilik: { nama: 'PT Contoh', org_id: null } }], unit: [] },
  gem: { baris: [
    { id: 'gem1', status: 'operating', tracker: 'solar', lat: P.E[1], lon: P.E[0], kapasitas_mw: 100, nama: 'Surya Uji (contoh)', tahun_mulai: 2022, pemilik: ['PT Contoh'] },
    { id: 'gem2', status: 'operating', tracker: 'hydropower', lat: P.G[1], lon: P.G[0], kapasitas_mw: 50, nama: 'Hidro Uji (contoh)', tahun_mulai: 2015, pemilik: ['PT Contoh'] },
  ] },
  osm: { baris: [] },
  statistik: { tahun: 2024, sumber: 'Statistik uji (contoh)', url: 'https://example.org/s', tanggal_ambil: '2026-11-01',
    baris: [baris('32', 'Provinsi Barat (contoh)', 'w1', 10000, 20000), baris('33', 'Provinsi Timur (contoh)', 'w2', 500, 5000)],
    wilayah_pln: [{ id: 'w1', nama: 'Wilayah 1', penjualan_gwh: 4000 }, { id: 'w2', nama: 'Wilayah 2', penjualan_gwh: 3000 }] },
  sistem_pln: { baris: [{ id: 'jb', singkat: 'JB', provinsi: [{ kode: '32' }, { kode: '33' }], bauran_ebt_persen: 10 }], susut_nasional: [{ tahun: 2024, jumlah: 8 }] },
});
// celah yang menyatakan ubin Sumatera belum terpanen, supaya gerbang tidak menuntut sistem Sumatera.
export const CELAH_SUMATERA = ['Ubin belum terpanen [S,W,N,E]: -5,95,1,103; -5,103,1,111.'];
