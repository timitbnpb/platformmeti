// Pembangun public/data/global/benchmark_harga.json (offline; angka ditranskripsi dari unduhan 2026-11-08).
// Memperluas harga_komponen.json (rujuk id deret, tidak menyalin) dan tkdn_produk.json (rujuk kategori). Sisi Indonesia sengaja kosong bila tak ada sumber terbuka terbaca.
export const TANGGAL = '2026-11-08';
export const SUMBER = [
  { id: 's-infolink-spot', judul: 'InfoLink Spot Price (pekan 29 Okt-4 Nov 2026, terbit 4 Nov 2026)', penerbit: 'InfoLink Consulting', url: 'https://www.infolink-group.com/spot-price/', lisensi: 'Halaman publik, hanya baris tak terkunci, dikutip dengan atribusi', tingkat_bukti: 'media' },
  { id: 's-kurs', judul: 'Kurs acuan ECB via Frankfurter API (USD ke IDR dan CNY)', penerbit: 'European Central Bank via frankfurter.dev', url: 'https://api.frankfurter.dev/v1/2026-11-04?base=USD&symbols=IDR,CNY', lisensi: 'Data publik ECB', tingkat_bukti: 'resmi' },
  { id: 's-kurs-eur', judul: 'Kurs acuan ECB via Frankfurter API (EUR ke USD dan IDR, 2026-11-04)', penerbit: 'European Central Bank via frankfurter.dev', url: 'https://api.frankfurter.dev/v1/2026-11-04?base=EUR&symbols=USD,IDR', lisensi: 'Data publik ECB', tingkat_bukti: 'resmi' },
  { id: 's-sunstore-pvtech', judul: 'European solar module and inverter prices rose in October (pv.index sun.store; terbit 5 Nov 2026): string inverter EUR/kW', penerbit: 'PV Tech memuat indeks sun.store', url: 'https://www.pv-tech.org/european-solar-module-and-inverter-prices-rose-in-october/', lisensi: 'Berita publik, angka dikutip dengan atribusi', tingkat_bukti: 'media' },
  { id: 's-nrel-2025q1', judul: 'Q1-2025 Solar Photovoltaic System Cost Benchmarks (berkas UPV 2025Q1; USD 2024, rentang MSP-MMP; transaksi kuartal 1 2025)', penerbit: 'National Laboratory of the Rockies (ex NREL) / DOE SETO, 22 Des 2025', url: 'https://data.nlr.gov/submissions/304', lisensi: 'CC BY 4.0', tingkat_bukti: 'resmi' },
  { id: 's-irena-2025', judul: 'IRENA, Renewable Power Generation Costs in 2025 (Jul 2026): ringkasan eksekutif Gambar S1 (TIC USD 2025), Bab 2 harga turbin, Bab 9 BESS turnkey', penerbit: 'IRENA', url: 'https://www.irena.org/-/media/Files/IRENA/Agency/Publication/2026/Jul/IRENA_TEC_RPGC_in_2025_2026.pdf', lisensi: 'Terbitan publik IRENA, dikutip dengan atribusi', tingkat_bukti: 'resmi' },
  { id: 's-bnef-2025', judul: 'BloombergNEF, Lithium-Ion Battery Pack Prices Fall to $108 Per Kilowatt-Hour (9 Des 2025)', penerbit: 'BloombergNEF', url: 'https://about.bnef.com/insights/clean-transport/lithium-ion-battery-pack-prices-fall-to-108-per-kilowatt-hour', lisensi: 'Siaran pers publik, dikutip dengan atribusi', tingkat_bukti: 'resmi' },
  { id: 's-iea-elektroliser', judul: 'IEA, What explains the cost advantage of Chinese electrolysers (15 Okt 2026): CAPEX alkali 2025', penerbit: 'International Energy Agency', url: 'https://www.iea.org/commentaries/what-explains-the-cost-advantage-of-chinese-electrolysers', lisensi: 'Komentar terbuka IEA, dikutip dengan atribusi', tingkat_bukti: 'resmi' },
  { id: 's-dea-2024', judul: 'Technology Data for the Indonesian Power Sector, Catalogue for Generation and Storage of Electricity (Maret 2024): tabel Investment costs MUSD2022/MW, bagian Solar PV (hlm. 59), Onshore Wind, Hydro Power Plant', penerbit: 'Ditjen Ketenagalistrikan ESDM dan Danish Energy Agency (INDODEPP), disusun Ea Energy Analyses', url: 'https://www.ea-energianalyse.dk/wp-content/uploads/2025/05/technology-data-for-the-indonesian-power-sector-2024.pdf', lisensi: 'Terbitan publik pemerintah, dikutip dengan atribusi', tingkat_bukti: 'resmi' },
  { id: 's-cirata-media', judul: 'PLTS Terapung Cirata Telan Investasi US$ 143 Juta (8 Nov 2023); 145 MWac / 192 MWp', penerbit: 'Listrik Indonesia', url: 'https://listrikindonesia.com/detail/11829/plts-terapung-cirata-telan-investasi-us-143-juta', lisensi: 'Berita publik, angka dikutip dengan atribusi', tingkat_bukti: 'media' },
  { id: 's-btki-2022', judul: 'PMK 26/PMK.010/2022 Penetapan Sistem Klasifikasi Barang dan Pembebanan Tarif Bea Masuk atas Barang Impor (BTKI 2022), Lampiran III; tarif MFN. Diubah PMK 10/2024, 62/2025, 50/2026 (perubahan tidak dibaca)', penerbit: 'Kementerian Keuangan RI', url: 'https://peraturan.bpk.go.id/Download/209374/26_PMK.010_2022.pdf', lisensi: 'Peraturan publik', tingkat_bukti: 'resmi' },
  { id: 's-pmk131', judul: 'PMK 131/PMK.010/2024: tarif PPN 12 persen dengan DPP nilai lain 11/12 untuk barang non-mewah (laman DJP; fetch langsung diblokir, isi dibaca dari ringkasan pencarian)', penerbit: 'Direktorat Jenderal Pajak', url: 'https://www.pajak.go.id/id/artikel/pmk-1312024-tarif-ppn-sebelas-dua-belas', lisensi: 'Laman publik', tingkat_bukti: 'media' },
  { id: 's-pph22-ortax', judul: 'Ketentuan PPh Pasal 22 Impor (PMK 34/PMK.010/2017 s.t.d.t.d. PMK 41/PMK.010/2022), 9 Des 2023', penerbit: 'Ortax', url: 'https://ortax.org/ketentuan-pph-pasal-22-impor', lisensi: 'Artikel publik', tingkat_bukti: 'media' },
];
// Kurs per tanggal diambil (bukan jam): USD ke mata uang.
export const KURS = [
  { tanggal: '2026-11-04', idr: 18129, cny: 6.6723, sumber_id: 's-kurs' },
  { tanggal: '2026-11-04', eur_usd: 1.1267, eur_idr: 20425.83, sumber_id: 's-kurs-eur' },
  { tanggal: '2025-01-02', idr: 16207, cny: 7.2995, sumber_id: 's-kurs' },
];
const D = (pasar, harga, mu, basis, tgl = '2026-11-04') => ({ pasar, harga, mata_uang: mu, usd: mu === 'USD' ? harga : Math.round((harga / KURS[0].cny) * 10000) / 10000, basis, sumber_id: 's-infolink-spot', tanggal: tgl, tingkat_bukti: mu === 'USD' ? 'Data' : 'EST' });
const r4 = (x) => Math.round(x * 1e4) / 1e4;
const EURUSD = 1.1267;
// Entri generik: usd sudah dalam satuan produk. kurs = catatan konversi (null bila USD asli).
const E = (pasar, usd, basis, sumber_id, tanggal, tingkat_bukti, ekstra = {}) => ({ pasar, harga: usd, mata_uang: 'USD', usd, basis, sumber_id, tanggal, tingkat_bukti, ...ekstra });
const R = (pasar, min, max, basis, sumber_id, tanggal, tingkat_bukti, ekstra = {}) => E(pasar, (min + max) / 2, basis + ' [usd = titik tengah rentang]', sumber_id, tanggal, tingkat_bukti, { rentang: { min, max }, ...ekstra });
const PVT = (pasar, eurKw, basis) => ({ pasar, harga: eurKw, mata_uang: 'EUR/kW', usd: r4((eurKw * EURUSD) / 1000), basis: basis + '; usd/W = EUR/kW x ' + EURUSD + ' / 1000 (kurs ECB 2026-11-04)', kurs: { eur_usd: EURUSD, sumber_id: 's-kurs-eur' }, sumber_id: 's-sunstore-pvtech', tanggal: '2026-10-31', tingkat_bukti: 'EST' });
const ALASAN_ID = 'Tidak ada harga komponen Indonesia dari sumber terbuka non-marketplace yang terbaca: e-katalog LKPP tak terjangkau, HPS/nilai kontrak LPSE-INAPROC tak ditemukan, iesr.or.id 403 (panen dihentikan), laporan emiten hanya lewat berita, harga distributor resmi tak ada; tkdn_produk.json hanya memuat TKDN tanpa harga.';
const P = (id, nama, satuan, dunia, ekstra = {}) => {
  const p = { id, nama, satuan, dunia, indonesia: [], alasan_indonesia_kosong: ALASAN_ID, selisih_persen: null, ...ekstra };
  if (p.indonesia.length) delete p.alasan_indonesia_kosong;
  if (p.pasangan) { // selisih = indonesia/dunia - 1 pada pasangan yang ditunjuk (indeks), dalam persen, 1 desimal
    const [d, i] = p.pasangan;
    p.selisih_persen = Math.round((p.indonesia[i].usd / p.dunia[d].usd - 1) * 1000) / 10;
  }
  return p;
};
export const KOMPONEN_SELISIH = [
  { k: 'ppn', nilai_persen: 11, nominal_persen: 12, tingkat_bukti: 'EST', sumber_id: 's-pmk131', tanggal: '2026-11-08', catatan: 'PPN 12 persen dikali DPP nilai lain 11/12 untuk barang non-mewah = efektif 11 persen (PMK 131/2024 Pasal 3). Barang mewah 12 persen penuh tidak berlaku bagi komponen EBT ini. PPN masukan umumnya dapat dikreditkan: bukan biaya akhir bagi pembeli PKP.' },
  { k: 'pph22_impor', nilai_persen: 2.5, alternatif_persen: [{ nilai_persen: 7.5, syarat: 'tanpa API' }], tingkat_bukti: 'EST', sumber_id: 's-pph22-ortax', tanggal: '2026-11-08', catatan: '2,5 persen dari nilai impor (nilai pabean + BM) untuk importir ber-API, 7,5 persen tanpa API. Dapat dikreditkan terhadap PPh badan. Sumber sekunder (Ortax), basis PMK 34/2017 s.t.d.t.d. PMK 41/2022; belum dicek terhadap perubahan terbaru.' },
  { k: 'bea_masuk', nilai_persen: null, tingkat_bukti: 'Data', sumber_id: 's-btki-2022', tanggal: '2026-11-08', catatan: 'Tarif MFN BTKI 2022 (PMK 26/2022 Lampiran III), dibaca langsung dari PDF resmi. Tarif preferensi (ACFTA/RCEP/ATIGA, butuh SKA) bisa 0 persen dan tidak dibaca. Perubahan PMK 10/2024, 62/2025, 50/2026 tidak dibaca: verifikasi sebelum dipakai.', per_hs: [
    { hs: '8541.43.00', uraian: 'Sel fotovoltaik dirakit dalam modul', bm_persen: 5 },
    { hs: '8541.42.00', uraian: 'Sel fotovoltaik tidak dirakit dalam modul', bm_persen: 0 },
    { hs: '8504.40.40', uraian: 'Inverter (static converter)', bm_persen: 10 },
    { hs: '8504.40.90', uraian: 'Konverter statik lain-lain', bm_persen: 10 },
    { hs: '8507.60.xx', uraian: 'Akumulator litium-ion (8507.60.31/.32/.33/.39/.90)', bm_persen: 10 },
    { hs: '8504.21-8504.23', uraian: 'Trafo (baris 8504.21-8504.23 yang dibaca: 5,00 persen semua)', bm_persen: 5 },
    { hs: '8544.49.2x-.4x', uraian: 'Kabel listrik berisolasi, tegangan <= 1000 V (pos dibaca)', bm_persen: 12.5 },
    { hs: '8544.60', uraian: 'Konduktor listrik lain untuk tegangan > 1000 V', bm_persen: 10 },
    { hs: '8502.31.10/.20', uraian: 'Pembangkit tenaga angin', bm_persen: 5 },
    { hs: '8410.11.00', uraian: 'Turbin hidrolik <= 1.000 kW', bm_persen: 10 },
    { hs: '8410.12.00/.13.00', uraian: 'Turbin hidrolik > 1.000 kW', bm_persen: 5 },
  ] },
  { k: 'tkdn_premium', nilai_persen: null, catatan: 'Premi produk ber-TKDN belum ada pasangan harga terbuka; lihat tkdn_produk.json untuk persen TKDN. Celah.' },
  { k: 'logistik', nilai_persen: null, catatan: 'Ongkos angkut ke Indonesia per produk belum bersumber. Indeks kontainer ada di logistik.json (WCI 2026-11-05: USD 4.389 per 40ft komposit); konversi ke USD/W butuh bobot dan volume kemasan yang tak terbuka. Celah.' },
];

export function bangun() {
  const produk = [
    P('modul-topcon', 'Modul PV mono TOPCon bifasial', 'USD/Wp', [
      D('Tiongkok domestik (rata-rata penyerahan, tanpa angkut)', 0.715, 'CNY', 'RMB/W; usd = rmb / kurs 2026-11-04 (EST)'),
      D('Non-Tiongkok (kutipan pra-pajak)', 0.114, 'USD', 'Rata-rata kutipan pasar non-Tiongkok'),
      D('Eropa, buatan Tiongkok, FOB', 0.115, 'USD', 'Proyek Eropa'),
      D('India rakitan, FOB', 0.135, 'USD', 'TOPCon rakitan India'),
      D('AS rakitan, DDP', 0.310, 'USD', 'Termasuk bea dan angkut sampai pembeli'),
      D('AS, buatan Asia Tenggara, FOB', 0.270, 'USD', 'Proyek AS'),
      R('AS, rakitan dari komponen impor 600 Wdc bifasial (tolok skala utilitas)', 0.149, 0.273, 'NREL Q1-2025 Module.MMP USD 149-273 per kWdc (USD 2024); MSP 191-283', 's-nrel-2025q1', '2025-12-22', 'Data'),
    ], { rujukan_tren: 'harga_komponen.json deret modul, modul-eropa-2024', tkdn_kategori: 'modul', bm_hs: '8541.43.00' }),
    P('modul-hjt', 'Modul PV mono HJT 210mm', 'USD/Wp', [D('Non-Tiongkok (kutipan pra-pajak)', 0.110, 'USD', 'HJT 210mm'), D('Tiongkok domestik', 0.750, 'CNY', 'RMB/W; usd = rmb / kurs (EST)')], { tkdn_kategori: 'modul' }),
    P('modul-perc', 'Modul PV mono PERC', 'USD/Wp', [], { catatan: 'InfoLink tidak lagi memuat modul PERC pada halaman terbuka; kosong.', tkdn_kategori: 'modul' }),
    P('sel-topcon', 'Sel surya TOPCon 182-183,75mm 25,4%+', 'USD/Wp', [D('Ekspor Tiongkok', 0.045, 'USD', 'Rata-rata pekan'), D('Tiongkok domestik', 0.295, 'CNY', 'RMB/W; usd = rmb / kurs (EST)')]),
    P('sel-perc', 'Sel surya mono PERC 182-183,75mm 23,1%+', 'USD/Wp', [D('Tiongkok (USD)', 0.047, 'USD', 'Rata-rata pekan')]),
    P('inverter-string', 'Inverter string', 'USD/W', [PVT('Eropa, string 1-15 kW (pasar grosir)', 54.05, 'pv.index Okt 2026, bulan ke bulan +0,2 persen; pita ukuran tak dirinci artikel'), PVT('Eropa, string besar', 23.76, 'pv.index Okt 2026, bulan ke bulan +7,9 persen; pita ukuran tak dirinci artikel')], { rujukan_tren: 'harga_komponen.json CELAH: tak ada seri terbuka', tkdn_kategori: 'inverter', bm_hs: '8504.40.40' }),
    P('inverter-sentral', 'Inverter sentral', 'USD/W', [R('AS, sentral 4 MWac impor dari Eropa', 0.042, 0.055, 'NREL Q1-2025 Inverter.MMP USD 42-55 per kWac (USD 2024); MSP 34-55', 's-nrel-2025q1', '2025-12-22', 'Data', { mata_uang_asli: 'USD 2024 per kWac' })], { tkdn_kategori: 'inverter', bm_hs: '8504.40.40' }),
    P('mikroinverter', 'Mikroinverter', 'USD/W', [], { catatan: 'Berkas residensial NREL Q1-2025 (RES) tidak ditemukan pada URL yang dapat ditebak; sisi dunia kosong.', bm_hs: '8504.40.40' }),
    P('baterai-lfp-sel', 'Sel baterai LFP', 'USD/kWh', [], { catatan: 'Harga sel LFP tidak terbuka (BNEF hanya memuat pack; InfoLink penyimpanan 404). Lihat baterai-pack.', tkdn_kategori: 'baterai', bm_hs: '8507.60' }),
    P('baterai-pack', 'Pack baterai litium-ion (survei tahunan BNEF 2025)', 'USD/kWh', [
      E('Rata-rata semua segmen', 108, 'Survei harga pack BNEF 2025, USD riil 2025', 's-bnef-2025', '2025-12-09', 'Data'),
      E('Penyimpanan stasioner', 70, 'Segmen termurah; turun 45 persen dari 2024', 's-bnef-2025', '2025-12-09', 'Data'),
      E('LFP, rata-rata semua segmen', 81, 'Pack LFP', 's-bnef-2025', '2025-12-09', 'Data'),
      E('Tiongkok, rata-rata', 84, 'Wilayah termurah', 's-bnef-2025', '2025-12-09', 'Data'),
      E('Amerika Utara (turunan)', 121, 'China x 1,44 (rilis: 44 persen lebih tinggi); 84 x 1,44 = 120,96', 's-bnef-2025', '2025-12-09', 'EST'),
      E('Eropa (turunan)', 131, 'China x 1,56 (rilis: 56 persen lebih tinggi); 84 x 1,56 = 131,04', 's-bnef-2025', '2025-12-09', 'EST'),
    ], { rujukan_tren: 'harga_komponen.json deret pack (BNEF 2018-2025)', tkdn_kategori: 'baterai', bm_hs: '8507.60' }),
    P('bess-sistem', 'Sistem BESS turnkey', 'USD/kWh', [
      E('Global, turnkey rata-rata tertimbang (2 jam dan 4 jam)', 117, 'Harga pemasok baterai + integrator, TANPA EPC, sambungan jaringan, pengembangan', 's-irena-2025', '2026-07-01', 'Data'),
      E('Global, turnkey proyek 4 jam', 111, 'IRENA Bab 9', 's-irena-2025', '2026-07-01', 'Data'),
      E('Global, turnkey proyek 2 jam', 125, 'IRENA Bab 9', 's-irena-2025', '2026-07-01', 'Data'),
      E('Tiongkok, turnkey (turunan)', 69, '117 x (1 - 0,41); IRENA: harga Tiongkok rata-rata 41 persen di bawah patokan global, di bawah USD 100', 's-irena-2025', '2026-07-01', 'EST'),
      E('Global, biaya terpasang total (TIC) BESS', 140, 'Termasuk EPC dan sambungan; turun hampir 30 persen setahun', 's-irena-2025', '2026-07-01', 'Data'),
      R('AS, ESS kabinet pad-mounted 4 MWh', 184, 218, 'NREL Q1-2025 ESS.MMP (USD 2024 per kWh-kapasitas)', 's-nrel-2025q1', '2025-12-22', 'Data'),
    ], { rujukan_tren: 'harga_komponen.json deret turnkey-2024 (165), sistem-baterai (192), pack (BNEF 2018-2025)', tkdn_kategori: 'baterai', bm_hs: '8507.60' }),
    P('trafo', 'Trafo daya', 'USD/MVA', [], { catatan: 'Tidak ada seri harga trafo terbuka yang terbaca (tak ada di NREL/IRENA/BNEF).', tkdn_kategori: 'trafo', bm_hs: '8504.21-8504.23' }),
    P('kabel', 'Kabel', 'USD/m', [], { catatan: 'Tidak ada seri harga kabel terbuka yang terbaca.', tkdn_kategori: 'kabel', bm_hs: '8544' }),
    P('struktur-mounting', 'Struktur/mounting', 'USD/Wp', [], { catatan: 'NREL Q1-2025 melapor SBOS pelacak tunggal USD 28-37 per m2 modul (PV-saja, USD 2024), satuan m2 bukan Wp; tidak dikonversi tanpa asumsi kerapatan daya modul.', tkdn_kategori: 'struktur' }),
    P('tracker', 'Tracker surya', 'USD/Wp', [], { catatan: 'Lihat struktur-mounting: NREL melapor USD 28-37 per m2 (SBOS tracker), bukan per Wp.' }),
    P('turbin-angin', 'Turbin angin', 'USD/kW', [
      E('Siemens Gamesa, harga rata-rata turbin', 889, 'IRENA mengutip Wiser dkk. 2025; turun 4 persen', 's-irena-2025', '2026-07-01', 'Data'),
      E('Nordex, harga rata-rata turbin', 993, 'IRENA mengutip Wiser dkk. 2025; naik 4 persen', 's-irena-2025', '2026-07-01', 'Data'),
      E('Tiongkok domestik, K4 2025', 199, 'Kontrak sering TANPA pengiriman, pemasangan, menara (catatan kaki IRENA)', 's-irena-2025', '2026-07-01', 'Data'),
      E('Tiongkok ekspor (turunan kasar)', 398, '199 x 2; IRENA: harga ekspor "roughly double" domestik. Kasar.', 's-irena-2025', '2026-07-01', 'EST'),
    ], { rujukan_tren: 'harga_komponen.json deret turbin-tiongkok (195), turbin-luar-tiongkok (998), tic-bayu', tkdn_kategori: 'turbin', bm_hs: '8502.31' }),
    P('turbin-hidro', 'Turbin hidro/PLTMH', 'USD/kW', [], { catatan: 'Harga peralatan turbin hidro tidak terbuka; yang ada hanya biaya terpasang (lihat plta-terpasang).', bm_hs: '8410' }),
    P('elektroliser', 'Elektroliser (alkali)', 'USD/kW', [
      R('Tiongkok, CAPEX alkali 2025', 500, 1100, 'IEA: USD 500-1.100 per kW; lingkup (peralatan atau proyek) tak dirinci IEA', 's-iea-elektroliser', '2026-10-15', 'EST'),
      R('Luar Tiongkok, CAPEX alkali 2025', 1900, 2500, 'IEA: USD 1.900-2.500 per kW; lingkup tak dirinci IEA', 's-iea-elektroliser', '2026-10-15', 'EST'),
    ], { catatan: 'PEM tidak dimuat IEA pada komentar ini.', bm_hs: '8543' }),
    P('plts-terpasang', 'PLTS skala utilitas, biaya terpasang total', 'USD/kW', [
      E('Global, rata-rata tertimbang (TIC) 2025', 667, 'USD 2025 per kW; IRENA Gambar S1', 's-irena-2025', '2026-07-01', 'Data'),
    ], { indonesia: [
      E('Indonesia, katalog teknologi ESDM, rekomendasi 2023', 960, 'MUSD2022/MW = 0,96; USD 2022 (bukan 2025); per MW tanpa penegasan AC atau DC (catatan kaki katalog: data IRENA per MWp)', 's-dea-2024', '2024-03-01', 'Data', { tahun_data: 2023 }),
      E('PLTS Terapung Cirata (145 MWac/192 MWp), investasi US$ 143 juta', 745, '143e6 / 192e3 kWp = 744,8 USD/kWp; angka media tanpa sumber tersebut, PLTS apung (lebih mahal dari darat)', 's-cirata-media', '2023-11-08', 'EST', { tahun_data: 2023 }),
    ], pasangan: [0, 0], catatan: 'Selisih +43,9 persen = 960/667 - 1: DEA (USD 2022, 2023, per MW) vs IRENA (USD 2025, rata-rata tertimbang dunia, didorong Tiongkok/India). Beda tahun dan basis harga: indikatif, bukan murni apel dengan apel.' }),
    P('pltb-darat-terpasang', 'PLTB darat, biaya terpasang total', 'USD/kW', [
      E('Global, rata-rata tertimbang (TIC) 2025', 976, 'USD 2025 per kW; IRENA Gambar S1', 's-irena-2025', '2026-07-01', 'Data'),
    ], { indonesia: [
      E('Indonesia, katalog teknologi ESDM, rekomendasi 2023', 1650, 'MUSD2022/MW = 1,65; USD 2022. Rentang FGD ESDM 2023: 1,60-2,21', 's-dea-2024', '2024-03-01', 'Data', { tahun_data: 2023 }),
    ], pasangan: [0, 0], catatan: 'Selisih +69,1 persen = 1650/976 - 1; beda tahun dan basis USD (2022 vs 2025). Indikatif.' }),
    P('plta-terpasang', 'PLTA, biaya terpasang total', 'USD/kW', [
      E('Global, rata-rata tertimbang (TIC) 2025', 2079, 'USD 2025 per kW; IRENA Gambar S1', 's-irena-2025', '2026-07-01', 'Data'),
    ], { indonesia: [
      E('Indonesia, katalog ESDM, PLTA besar, rekomendasi 2023', 2200, 'MUSD2022/MW = 2,20 (large hydro)', 's-dea-2024', '2024-03-01', 'Data', { tahun_data: 2023 }),
      E('Indonesia, katalog ESDM, PLTA kecil, rekomendasi 2023', 2500, 'MUSD2022/MW = 2,50 (small hydro)', 's-dea-2024', '2024-03-01', 'Data', { tahun_data: 2023 }),
      E('Indonesia, katalog ESDM, PLTMH mikro, rekomendasi 2023', 2700, 'MUSD2022/MW = 2,70 (micro hydro)', 's-dea-2024', '2024-03-01', 'Data', { tahun_data: 2023 }),
      E('PLTM Bakal Semarak 5 MW (Sumut), investasi US$ 8,66 juta', 1732, '8,66e6 / 5e3 kW = 1.732; dikutip katalog ESDM dari proyek', 's-dea-2024', '2024-03-01', 'EST'),
    ], pasangan: [0, 0], catatan: 'Selisih +5,8 persen = 2200/2079 - 1 (PLTA besar). Beda tahun dan basis USD; tapak PLTA sangat spesifik.' }),
    P('panel-listrik', 'Panel listrik', 'USD/unit', []),
  ];
  return { lapis: 'publik', dibangun_pada: TANGGAL, sumber: SUMBER, kurs: KURS, komponen_selisih: KOMPONEN_SELISIH, pemasok_rujukan: 'public/data/global/pemasok_*.json (belum ada saat dibangun; hubungkan lewat id pemasok bila terbit)', produk, meta: { diperbarui: TANGGAL, tren_2020_2026: 'Dipakai dari harga_komponen.json (modul, pack, tic-*); tren sisi Indonesia kosong. Sisi Indonesia hanya biaya terpasang (katalog ESDM, satu proyek media); harga komponen Indonesia (modul, inverter, baterai) belum ada sumber terbuka non-marketplace terbaca.', celah: ['E-katalog LKPP tak terjangkau; HPS/nilai kontrak LPSE-INAPROC tak ditemukan lewat pencarian dan portal tak dijelajahi (robots/login)', 'Laporan tahunan SKRN, ARKO, KEEN, BREN, PGEO: biaya per MW terbaca hanya dari berita (bisnis.com ARKO 403, KEEN Pakkat 2 sekitar US$ 116 juta/45 MW = 2,58 juta/MW belum diverifikasi), tidak dimasukkan', 'Harga distributor resmi di situs sendiri: tidak ditemukan; hanya marketplace (dikecualikan)', 'NREL data residensial/komersial tidak terbaca; Lazard LCOE+ tidak dibaca', 'Premi TKDN dan ongkos logistik per produk tak bersumber'] } };
}
