// Pembangun public/data/harga_komponen.json (offline). Angka IRENA/BNEF ditranskripsi dari terbitan publik (halaman dan URL di SUMBER);
// seri modul dipakai ulang dari public/data/biaya_listrik.json (IRENA via OWID). Tiap titik: sumber_id, tingkat bukti, tanggal.
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const AKAR = fileURLToPath(new URL('../../', import.meta.url));
export const TANGGAL = '2026-11-08';
export const SUMBER = [
  { id: 's-irena-modul', judul: 'IRENA, Renewable Power Generation Costs in 2025 (harga modul surya dunia), diolah Our World in Data', penerbit: 'IRENA via Our World in Data', tahun: 2026, url: 'https://ourworldindata.org/grapher/solar-pv-prices', lisensi: 'CC BY 4.0 (OWID); data asal IRENA', tingkat_bukti: 'via-pihak-ketiga' },
  { id: 's-irena-2024', judul: 'IRENA, Renewable Power Generation Costs in 2024 (Juli 2025): biaya terpasang surya (Gambar 3.x), bayu darat (Gambar 2.5), sistem baterai (Gambar 9.2, 9.3), harga turbin (Gambar 2.9), harga modul Eropa pvXchange (Kotak 3.1, hlm. 90)', penerbit: 'IRENA', tahun: 2025, url: 'https://www.irena.org/-/media/Files/IRENA/Agency/Publication/2025/Jul/IRENA_TEC_RPGC_in_2024_2025.pdf', lisensi: 'Terbitan publik IRENA, dikutip dengan atribusi', tingkat_bukti: 'resmi' },
  { id: 's-bnef-2025', judul: 'BloombergNEF, Lithium-Ion Battery Pack Prices Fall to $108 Per Kilowatt-Hour (9 Des 2025)', penerbit: 'BloombergNEF', tahun: 2025, url: 'https://about.bnef.com/insights/clean-transport/lithium-ion-battery-pack-prices-fall-to-108-per-kilowatt-hour', lisensi: 'Siaran pers publik, dikutip dengan atribusi', tingkat_bukti: 'resmi' },
  { id: 's-bnef-2021', judul: 'BloombergNEF, Battery Pack Prices Fall to an Average of $132/kWh (30 Nov 2021; 2020 = $140/kWh, USD riil 2021)', penerbit: 'BloombergNEF', tahun: 2021, url: 'https://about.bnef.com/insights/clean-energy/battery-pack-prices-fall-to-an-average-of-132-kwh-but-rising-commodity-prices-start-to-bite/', lisensi: 'Siaran pers publik, dikutip dengan atribusi', tingkat_bukti: 'resmi' },
  { id: 's-bnef-2019', judul: 'CleanTechnica memuat survei BNEF (4 Des 2019): 2019 = $156/kWh, 2018 = $180/kWh (disesuaikan inflasi)', penerbit: 'CleanTechnica (kutip BloombergNEF)', tahun: 2019, url: 'https://cleantechnica.com/2019/12/04/powering-the-ev-revolution-battery-packs-now-at-156-kwh-13-lower-than-2018-finds-bnef/', lisensi: 'Kutipan angka dari media', tingkat_bukti: 'media' },
  { id: 's-bnef-2023', judul: 'pv magazine: Battery prices down 14% this year, says BloombergNEF (1 Des 2023; $139/kWh)', penerbit: 'pv magazine (kutip BloombergNEF)', tahun: 2023, url: 'https://www.pv-magazine.com/2023/12/01/battery-prices-down-14-this-year-says-bloombergnef/', lisensi: 'Kutipan angka dari media', tingkat_bukti: 'media' },
  { id: 's-bnef-2024', judul: 'Bloomberg: Electric vehicle battery packs see biggest price drop since 2017 (10 Des 2024; $115/kWh)', penerbit: 'Bloomberg (kutip BloombergNEF)', tahun: 2024, url: 'https://www.bloomberg.com/news/articles/2024-12-10/electric-vehicle-battery-packs-see-biggest-price-drop-since-2017', lisensi: 'Kutipan angka dari media', tingkat_bukti: 'media' },
];
export const CELAH = [
  'Harga inverter dari waktu ke waktu tidak ada seri terbuka. Yang tersedia hanya sumbangan inverter pada penurunan biaya terpasang surya 2010-2024 (IRENA); seri harga pvXchange/InfoLink inverter dan survei BNEF lengkap berbayar atau tidak boleh disebarkan ulang.',
  'Harga paket baterai BNEF tahun 2022 tidak dimuat: sumber sekunder menyebut $151 dan $161 per kWh (dasar dolar berbeda). Tiap titik BNEF memakai dolar riil tahun survei masing-masing, sehingga perubahan tahunan hanya dihitung bila tahun sebelumnya ada.',
  'Harga turbin angin dari waktu ke waktu hanya tersedia sebagai gambar di laporan IRENA; yang bisa dikutip adalah biaya terpasang bayu darat per tahun (turbin ditambah sisa proyek) dan harga turbin 2024 luar dan dalam Tiongkok.',
  'Harga modul mulai 2010 adalah tolok pasar Eropa (pvXchange), bukan harga impor Indonesia; nilai impor Indonesia ada di bagian ekspor-impor.',
  'Dampak ke LCOE adalah estimasi sederhana (EST): porsi penurunan biaya terpasang dikalikan penurunan LCOE dunia, dengan anggapan LCOE berubah searah dengan biaya modal; tidak memperhitungkan faktor kapasitas dan biaya modal keuangan.',
];
const T = (seri, id, tingkat = 'resmi', tgl = TANGGAL) => seri.map(([x, y, catatan]) => ({ x, y, sumber_id: id, tingkat_bukti: tingkat, tanggal: tgl, ...(catatan ? { catatan } : {}) }));
const lari = (a, b, v) => v.map((y, i) => [a + i, y]);

export function bangun() {
  const B = JSON.parse(fs.readFileSync(AKAR + 'public/data/biaya_listrik.json', 'utf8'));
  const modul = B.modul.map((r) => ({ x: r.tahun, y: r.usd_per_w, sumber_id: 's-irena-modul', tingkat_bukti: r.tingkat_bukti, tanggal: r.tanggal }));
  const deret = [
    { id: 'modul', komponen: 'surya', satuan: 'USD/W', basis: 'USD nominal tahun berjalan (tolok Eropa pvXchange sejak 2010)', titik: modul },
    { id: 'tic-surya', komponen: 'surya', satuan: 'USD/kW', basis: 'USD 2024 riil, biaya terpasang PLTS skala utilitas (per kW DC)', titik: T(lari(2010, 2024, [5283, 4659, 3537, 3107, 2849, 2140, 1958, 1683, 1438, 1188, 1044, 973, 930, 776, 691]), 's-irena-2024') },
    { id: 'modul-eropa-2024', komponen: 'surya', satuan: 'USD/W', basis: 'USD 2024, modul mainstream dijual di Eropa, Desember 2024 (pvXchange via IRENA)', titik: T([[2024, 0.11]], 's-irena-2024') },
    { id: 'pack', komponen: 'baterai', satuan: 'USD/kWh', basis: 'Rata-rata berbobot volume paket Li-ion semua segmen, dolar riil tahun survei masing-masing (BNEF)', titik: [...T([[2018, 180, 'disesuaikan inflasi']], 's-bnef-2019', 'media'), ...T([[2019, 156]], 's-bnef-2019', 'media'), ...T([[2020, 140], [2021, 132]], 's-bnef-2021'), ...T([[2023, 139]], 's-bnef-2023', 'media'), ...T([[2024, 115]], 's-bnef-2024', 'media'), ...T([[2025, 108]], 's-bnef-2025')] },
    { id: 'sistem-baterai', komponen: 'baterai', satuan: 'USD/kWh', basis: 'USD 2024 riil, proyek penyimpanan baterai terpasang dan beroperasi (IRENA dari BNEF)', titik: T([[2010, 2571], [2024, 192]], 's-irena-2024') },
    { id: 'turnkey-2024', komponen: 'baterai', satuan: 'USD/kWh', basis: 'USD 2024, sistem baterai turnkey rata-rata dunia (tanpa EPC dan sambungan jaringan)', titik: T([[2024, 165]], 's-irena-2024') },
    { id: 'tic-bayu', komponen: 'angin', satuan: 'USD/kW', basis: 'USD 2024 riil, biaya terpasang rata-rata berbobot PLTB darat dunia (turbin dan sisa proyek)', titik: T(lari(2010, 2024, [2324, 2278, 2234, 2165, 2147, 1956, 1960, 1963, 1865, 1766, 1589, 1506, 1353, 1187, 1041]), 's-irena-2024') },
    { id: 'turbin-luar-tiongkok', komponen: 'angin', satuan: 'USD/kW', basis: 'USD 2024, harga rata-rata turbin di luar Tiongkok', titik: T([[2024, 998]], 's-irena-2024') },
    { id: 'turbin-tiongkok', komponen: 'angin', satuan: 'USD/kW', basis: 'USD 2024, harga rata-rata turbin di Tiongkok (kontrak sering tanpa pengiriman, pemasangan, menara)', titik: T([[2024, 195]], 's-irena-2024') },
  ];
  const lc = (th) => B.lcoe.find((r) => r.iso3 === 'WLD' && r.teknologi === 'surya' && r.tahun === th).sen_usd_kwh;
  const turun = [['modul', 2318], ['soft', 689], ['pasang', 702], ['inverter', 440], ['rak', 317], ['bos', 125]];
  const tot = turun.reduce((a, [, v]) => a + v, 0), l0 = lc(2010), l1 = lc(2024);
  const dampak = {
    tek: 'surya', tahun_a: 2010, tahun_b: 2024, tic_a: 5283, tic_b: 691, lcoe_a: l0, lcoe_b: l1, sumber_id: 's-irena-2024', tingkat_bukti: 'resmi', tanggal: TANGGAL,
    komponen: turun.map(([k, usd]) => ({ k, usd_kw: usd, bagian: Math.round((usd / tot) * 1000) / 10, lcoe_sen: Math.round(((usd / tot) * (l0 - l1)) * 100) / 100 })),
  };
  return { lapis: 'publik', dibangun_pada: TANGGAL, sumber: SUMBER, deret, dampak, meta: { diperbarui: TANGGAL, celah: CELAH } };
}
