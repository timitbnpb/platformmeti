// Fixture kecil untuk kembaran_pelengkap.mjs (KJ-05). Semua nama "(contoh)"/fiktif; tanpa data nyata.
export const BIAYA = () => ({
  dibangun_pada: '2026-11-01',
  bpp_nasional: [{ tahun: 2020, rp_kwh: 1300, tanggal_penetapan: '2021-09-08' }],
  bpp_sistem: [
    { kunci: 'k1', nama: 'Sistem Satu', provinsi: ['32'], rp_kwh: { 2019: 900, 2020: 1000 } },
    { kunci: 'k2', nama: 'Sistem Dua', provinsi: ['32', '33'], rp_kwh: { 2020: 1500 } },
    { kunci: 'k3', nama: 'Pulau Lain', provinsi: ['33'], rp_kwh: { 2020: 2000 } },
    { kunci: 'k4', nama: 'Tanpa Tahun', provinsi: ['34'], rp_kwh: { 2019: 800 } }, // tak punya 2020
  ],
});
export const SISTEM = () => [
  { id: 'a', nama: 'Sistem Satu', prov: ['32'] }, // nama persis k1
  { id: 'b', nama: 'Sistem Bebas', prov: ['32', '33'] }, // cocok lewat provinsi: k1,k2,k3
  { id: 'c', nama: 'Pulau X', prov: ['99'] }, // tak cocok apa pun
];

export const RUPTL = () => ({
  meta: { periode: '2025-2034', tahun_dokumen: 2025 },
  baris: [
    { provinsi: 'Jawa Barat', kapasitas_mw: 100, teknologi: 'PLTS', status: 'rencana', cod_tahun: [2029] },
    { provinsi: 'Jawa Barat', kapasitas_mw: 50, teknologi: 'PLTB', status: 'rencana', cod_tahun: [2030, 2029] },
    { provinsi: 'Jawa Timur (contoh)', kapasitas_mw: 20, teknologi: 'PLTS', status: 'konstruksi', cod_tahun: [] },
    { provinsi: null, kapasitas_mw: 30, teknologi: 'PLTA', status: 'rencana', cod_tahun: [2031] },
    { provinsi: 'Negeri Fiktif', kapasitas_mw: 10, teknologi: 'PLTS', status: 'rencana', cod_tahun: [2031] },
  ],
});
export const KODE_PROV = () => new Map([['jawa barat', '32'], ['jawa timur', '35']]);

const seri = (...a) => [...a, a.reduce((t, x) => t + x, 0)]; // 10 angka + total
const sepuluh = (n) => Array.from({ length: 10 }, (_, i) => (i === 0 ? n : 0));
export const RUPTL_JARINGAN = () => ({
  provinsi: [
    { kode: '32', nama: ['Provinsi Barat'], kms: { 150: seri(...sepuluh(100)), 500: seri(...sepuluh(40)), total: seri(...sepuluh(140)) }, mva: { '150/20': seri(...sepuluh(60)), total: seri(...sepuluh(60)) }, sumber_tabel: { kms: 'Tabel X.1', mva: 'Tabel X.2' } },
    { kode: '33', nama: ['Provinsi Timur'], kms: { 150: seri(...sepuluh(10)), total: seri(...sepuluh(10)) }, mva: null, sumber_tabel: { kms: 'Tabel Y.1' } },
    { kode: null, nama: ['Papua', 'Papua Barat'], kms: { total: seri(...sepuluh(5)) }, mva: { total: seri(...sepuluh(5)) } },
  ],
});

export const PEL = () => ({
  penduduk: [
    { kode: '32', tahun: 2024, jiwa: 1000000, src: 'pop' },
    { kode: '33', tahun: 2023, jiwa: 500000, src: 'pop', bukti: 'via-pihak-ketiga' },
    { kode: '91', tahun: 2024, jiwa: 1000000, src: 'pop' }, { kode: '93', tahun: 2024, jiwa: 500000, src: 'pop' },
    { kode: '94', tahun: 2024, jiwa: 250000, src: 'pop' }, { kode: '95', tahun: 2024, jiwa: 250000, src: 'pop' },
  ],
});
export const PENJUALAN = () => [
  { prov_kode: '32', gwh: 2000, src: 'BPS' }, { prov_kode: '33', gwh: 500, src: 'BPS' },
  { prov_kode: '91', gwh: 2500, src: 'BPS' }, { prov_kode: '77', gwh: 10, src: 'BPS' }, // 77 tak punya penduduk
];

export const AKSES = () => ({ provinsi: [
  { kode: '32', re_persen: 99.5, re_tahun: 2024, rumah_tangga_berlistrik: 1000 },
  { kode: '33', re_persen: null, re_tahun: 2024 },
  { kode: '34', re_persen: 90, re_tahun: 2023 },
] });
export const DESA = () => ({ baris: [{ kode: '32', tahun: 2024, jumlah_desa: 100, desa_pln: 90, desa_non_pln: 5, belum_berlistrik: 5, persen_berlistrik: 95 }] });

export const ATLAS = () => ({
  meta: { tanggal_ambil: '2026-11-25', grid_derajat: 0.05 },
  provinsi: { 32: { pvout: { n: 3, rata: 1400, p10: 1300, p50: 1400, p90: 1500 }, angin: null }, 33: { pvout: null, angin: { n: 3, rata: 4, p10: 3, p50: 4, p90: 5 } } },
  gardu: { g1: [1500, 3], g2: [1600, null], g3: [null, 5], g4: [1700, 4], g5: [1700, 4] },
});
export const GARDU = () => ['g1', 'g2', 'g3', 'g4', 'g5', 'g9'].map((id) => ({ id, nama: 'GI ' + id, kv: 150, prov: '32', sis: 'a' })); // g9 tak ada di atlas

// [nama, lat, lon, penduduk, kode_fitur]; pusat uji (107, -7); 0,1 derajat bujur ~ 11 km
export const KOTA = () => ({ meta: { sumber: 'geonames-id', judul: 'GeoNames uji (contoh)', url: 'https://example.org/gn', lisensi: 'CC BY 4.0', tanggal_ambil: '2026-11-25' }, kota: [
  ['Padat', -7.0, 107.1, 5000, 'PPLA2'], ['Dekat', -7.0, 107.01, 100, 'PPLA2'], ['Tanpa Pop', -7.0, 107.005, 0, 'PPLA2'], ['Jauh', -7.0, 107.4, 9000000, 'PPLC'],
] });
