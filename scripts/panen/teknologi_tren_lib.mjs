// public/data/global/teknologi_tren.json dan bahan_baku.json (offline). Angka ditranskripsi dari sumber publik (URL di SUMBER);
// rekor NREL dan seri Pink Sheet diolah dari berkas Excel resmi yang diunduh ke folder sementara (bukan ke repo).
export const TANGGAL = '2026-11-08';
const S = (id, judul, penerbit, tahun, url, tingkat_bukti, lisensi) => ({ id, judul, penerbit, tahun, url, lisensi, tingkat_bukti });
export const SUMBER = [
  S('s-itrpv17', 'ITRPV 17th Edition (VDMA), diberitakan TaiyangNews 7 Sep 2026', 'VDMA ITRPV via TaiyangNews', 2026, 'https://taiyangnews.info/technology/itrpv-expects-topcon-to-lead-as-bc-and-tandem-technologies-expand', 'via-pihak-ketiga', 'Ringkasan publik, dikutip dengan atribusi'),
  S('s-itrpv17-ship', 'ITRPV Sees PV Shipments Stabilize At 706 GW In 2025 (ITRPV 17, 24 Jun 2026)', 'VDMA ITRPV via TaiyangNews', 2026, 'https://taiyangnews.info/technology/itrpv-sees-pv-shipments-stabilize-at-706-gw-in-2025', 'via-pihak-ketiga', 'Ringkasan publik, dikutip dengan atribusi'),
  S('s-itrpv16', 'ITRPV 16th Edition (15 Apr 2025), diberitakan TaiyangNews', 'VDMA ITRPV via TaiyangNews', 2025, 'https://taiyangnews.info/technology/vdma-releases-itrpv-16-edition', 'via-pihak-ketiga', 'Ringkasan publik, dikutip dengan atribusi'),
  S('s-nrel', 'Best Research-Cell Efficiency Chart, tabel data (NREL/NLR; diperbarui 14 Agt 2026)', 'NREL (kini NLR)', 2026, 'https://www.nlr.gov/pv/cell-efficiency', 'resmi', 'Domain publik (karya pemerintah AS)'),
  S('s-gwec-2024', 'GWEC: wind turbine suppliers deliver new record volume (data 2024)', 'GWEC', 2025, 'https://www.gwec.net/news/wind-turbine-suppliers-deliver-new-record-volume-despite-difficult-year-full-of-diverse-challenges', 'media', 'Siaran publik, dikutip dengan atribusi'),
  S('s-windletter', 'Windletter: rating turbin darat Eropa 2023-2024 (kutip WindEurope)', 'Windletter', 2025, 'https://windletteren.substack.com/p/wind-power-data-europe-2024', 'media', 'Kutipan angka dari media'),
  S('s-usgs-li', 'USGS Mineral Commodity Summaries 2026: Lithium (harga rata-rata tahunan karbonat litium kelas baterai, dolar riil, sumber Benchmark Mineral Intelligence)', 'USGS', 2026, 'https://pubs.usgs.gov/periodicals/mcs2026/mcs2026-lithium.pdf', 'resmi', 'Domain publik (karya pemerintah AS)'),
  S('s-poli-smm', 'SMM/metal.com: 2024 polysilicon annual review (P-type dense 35,5 yuan/kg akhir 2024)', 'SMM via metal.com', 2025, 'https://news.metal.com/newscontent/103136256/2024-Polysilicon-Companies-Face-Losses-and-Frequent-Shutdowns-and-Production-Cuts-Will-Prices-Rebound-in-2025-[Annual-Review]', 'media', 'Kutipan angka dari media'),
  S('s-poli-bernreuter', 'Bernreuter Research: polysilicon price trend (spot global US$6,88/kg awal Des 2025; n-type China CNY51/kg termasuk PPN 13 persen)', 'Bernreuter Research', 2025, 'https://www.bernreuter.com/polysilicon/price-trend/', 'media', 'Kutipan angka dari media'),
  S('s-pinksheet-bln', 'World Bank Pink Sheet, CMO-Historical-Data-Monthly.xlsx (rata-rata Jan-Okt 2026 dihitung dari 10 bulan)', 'World Bank', 2026, 'https://www.worldbank.org/en/research/commodity-markets', 'resmi', 'CC BY 4.0 (World Bank Open Data)'),
  S('s-pinksheet', 'World Bank Commodity Price Data (Pink Sheet), CMO-Historical-Data-Annual.xlsx, harga tahunan nominal', 'World Bank', 2026, 'https://www.worldbank.org/en/research/commodity-markets', 'resmi', 'CC BY 4.0 (World Bank Open Data)'),
];
const R = (m) => m.map(([tanggal, persen, lembaga]) => ({ tanggal, persen, lembaga }));
export const REKOR_NREL = { si_tunggal_nonkonsentrator: R([["2006-08-01", 25.3, "Fraunhofer ISE"], ["2017-03-01", 25.7, "Fraunhofer ISE"], ["2017-07-01", 25.8, "FhG-ISE"], ["2018-02-01", 26.1, "ISFH"], ["2025-10-27", 26.55, "Runergy"], ["2025-12-17", 26.68, "Trina Solar"]]), si_heterostruktur_bc: R([["2014-02-01", 25.6, "Panasonic"], ["2016-07-01", 26.3, "Kaneka"], ["2016-11-01", 26.6, "Kaneka"], ["2017-03-01", 26.700000000000003, "Kaneka"], ["2022-10-01", 26.81, "LONGi"], ["2023-11-30", 27.1, "LONGi"], ["2023-12-01", 27.3, "LONGi"], ["2025-01-20", 27.8, "LONGi"], ["2025-10-16", 27.9, "LONGi"], ["2026-03-30", 28.1, "LONGi"]]), perovskit_di_atas_si_tandem: R([["2016-08-01", 23.599999999999998, "Stanford/ASU"], ["2018-02-01", 25.2, "EPFL"], ["2018-06-01", 27.3, "Oxford PV"], ["2018-12-01", 28.0, "Oxford PV"], ["2020-01-01", 29.15, "HZB"], ["2020-12-14", 29.5, "Oxford PV"], ["2021-11-16", 29.8, "HZB"], ["2022-06-17", 31.3, "EPFL/CSEM"], ["2022-11-23", 32.5, "HZB"], ["2023-03-14", 33.2, "KAUST"], ["2023-05-01", 33.7, "KAUST"], ["2023-09-26", 33.9, "Longi"], ["2024-04-30", 34.6, "LONGi"], ["2024-05-06", 34.85, "LONGi"], ["2025-07-01", 35.0, "LONGi"], ["2026-02-01", 35.2, "LONGi"]]), perovskit_tunggal: R([["2014-11-01", 20.1, "KRICT"], ["2016-03-01", 22.1, "KRICT/UNIST"], ["2017-07-01", 22.7, "KRICT"], ["2018-05-18", 23.3, "ISCAS, Beijing"], ["2018-09-01", 23.7, "ISCAS, Beijing"], ["2019-01-01", 24.2, "KRICT/MIT"], ["2019-07-01", 25.2, "KRICT/MIT (tied w/ Korea U)"], ["2020-07-28", 25.5, "UNIST"], ["2021-12-03", 25.7, "UNIST"], ["2022-11-16", 25.8, "UNIST"], ["2023-03-01", 26.0, "ISCAS"], ["2023-05-10", 26.1, "U. of Science and Technology of China"], ["2024-04-24", 26.7, "University of Science and Technology of China"], ["2025-01-21", 26.95, "Soochow University / UNSW"], ["2025-07-01", 27.3, "Soochow University / UNSW / Baima Lake"], ["2026-02-01", 28.0, "Hainan U"]]), cdte: R([["2014-12-01", 21.5, "First Solar"], ["2015-11-01", 22.1, "First Solar"], ["2023-02-01", 22.3, "First Solar"], ["2023-08-31", 22.4, "First Solar"], ["2024-01-18", 22.6, "First Solar"], ["2024-05-17", 23.08, "First Solar"]]), cigs: R([["2014-02-01", 23.3, "NREL"], ["2018-11-01", 23.35, "Solar Frontier"], ["2023-01-05", 23.6, "Evolar/UU"]]) };
const PS = { aluminium: [[2018, 2108.0], [2019, 1794.0], [2020, 1704.0], [2021, 2473.0], [2022, 2705.0], [2023, 2256.0], [2024, 2419.0], [2025, 2632.0]], tembaga: [[2018, 6530.0], [2019, 6010.0], [2020, 6174.0], [2021, 9317.0], [2022, 8822.0], [2023, 8490.0], [2024, 9142.0], [2025, 9947.0]], nikel: [[2018, 13114.0], [2019, 13914.0], [2020, 13787.0], [2021, 18465.0], [2022, 25834.0], [2023, 21521.0], [2024, 16814.0], [2025, 15162.0]], perak: [[2018, 15.7], [2019, 16.2], [2020, 20.5], [2021, 25.2], [2022, 21.8], [2023, 23.4], [2024, 28.3], [2025, 39.8]], bijih_besi: [[2018, 69.8], [2019, 93.8], [2020, 108.9], [2021, 161.7], [2022, 121.3], [2023, 120.6], [2024, 109.4], [2025, 100.2]] };
const YTD26 = { aluminium: 3304.1, tembaga: 13538.9, nikel: 17153.6, perak: 71.83, bijih_besi: 100.73 }; // rata-rata Jan-Okt 2026, bulanan Pink Sheet
const SATUAN = { aluminium: 'USD/ton', tembaga: 'USD/ton', nikel: 'USD/ton', perak: 'USD/troy oz', bijih_besi: 'USD/dmt (berkas Pink Sheet menulis dmtu)' };
const T = (sumber_id, tingkat_bukti) => ({ sumber_id, tingkat_bukti, tanggal: TANGGAL });
export const GRAM_PER_TROY_OZ = 31.1034768;
const K = 'via-pihak-ketiga';
export function bangunTren() {
  const rekor = Object.fromEntries(Object.entries(REKOR_NREL).map(([k, v]) => [k, v.map((r) => ({ ...r, ...T('s-nrel', 'resmi') }))]));
  const pt = (tahun, teknologi, persen, s, extra = {}) => ({ tahun, teknologi, persen, ...extra, ...T(s, K) });
  return {
    lapis: 'publik', dibangun_pada: TANGGAL, sumber: SUMBER.filter((s) => s.id !== 's-pinksheet'),
    pangsa_teknologi_sel: {
      satuan: 'persen produksi sel c-Si', catatan: 'Dua edisi ITRPV tak dapat disambung mulus: edisi 16 menaruh SHJ 8 persen pada 2024, edisi 17 menaruh HJT sekitar 5 persen pada 2025 (definisi/cakupan berbeda). Tahun tanpa angka tidak diisi.',
      titik: [
        pt(2024, 'hjt', 8, 's-itrpv16', { edisi: 'ITRPV 16' }),
        pt(2025, 'perc', 14, 's-itrpv17', { edisi: 'ITRPV 17' }), pt(2025, 'topcon', 75, 's-itrpv17', { edisi: 'ITRPV 17' }), pt(2025, 'hjt', 5, 's-itrpv17', { edisi: 'ITRPV 17' }),
        pt(2025, 'bc-topcon', 5, 's-itrpv17', { edisi: 'ITRPV 17' }), pt(2025, 'bc-hjt', 0.1, 's-itrpv17', { edisi: 'ITRPV 17' }),
        pt(2036, 'topcon', 50, 's-itrpv17-ship', { edisi: 'ITRPV 17', jenis: 'proyeksi' }), pt(2036, 'bc-topcon', 23, 's-itrpv17', { edisi: 'ITRPV 17', jenis: 'proyeksi' }),
        pt(2036, 'bc-semua', 28, 's-itrpv17-ship', { edisi: 'ITRPV 17', jenis: 'proyeksi (batas atas)' }), pt(2036, 'tandem-si', 17, 's-itrpv17-ship', { edisi: 'ITRPV 17', jenis: 'proyeksi (lebih dari)' }),
      ],
      kosong: ['Pangsa PERC/TOPCon 2020-2023 dan TOPCon 2024: tidak ada angka di ringkasan publik yang dibaca (edisi 16 hanya menyebut TOPCon melampaui PERC pada 2024). Thin-film, IEA, dan InfoLink belum diambil.'],
    },
    rekor_efisiensi_sel_nrel: { satuan: '%', catatan: 'Rekor beruntun (hanya titik yang memecahkan rekor sebelumnya) dari tabel data NREL; satu rekor sebelum 2015 disertakan sebagai awal deret. Kelas "heterostruktur Si" di tabel NREL memuat juga sel back-contact heterostruktur.', ...rekor },
    efisiensi_modul_produksi_massal: {
      satuan: '%', titik: [
        pt(2024, 'topcon', 23.2, 's-itrpv16', { edisi: 'ITRPV 16' }), pt(2024, 'shj', 23.6, 's-itrpv16', { edisi: 'ITRPV 16' }), pt(2024, 'ibc', 23.8, 's-itrpv16', { edisi: 'ITRPV 16' }),
        pt(2025, 'topcon-dan-shj', 23.5, 's-itrpv17-ship', { edisi: 'ITRPV 17' }), pt(2025, 'bc-topcon', 24.1, 's-itrpv17-ship', { edisi: 'ITRPV 17' }),
        pt(2026, 'topcon', 23.9, 's-itrpv17', { edisi: 'ITRPV 17' }), pt(2026, 'hjt', 23.9, 's-itrpv17', { edisi: 'ITRPV 17' }), pt(2026, 'bc', 24.3, 's-itrpv17', { edisi: 'ITRPV 17' }),
        pt(2036, 'topcon', 25.2, 's-itrpv17', { edisi: 'ITRPV 17', jenis: 'proyeksi' }), pt(2036, 'hjt', 25.3, 's-itrpv17', { edisi: 'ITRPV 17', jenis: 'proyeksi' }), pt(2036, 'bc', 25.6, 's-itrpv17', { edisi: 'ITRPV 17', jenis: 'proyeksi' }),
      ],
    },
    daya_modul: {
      satuan: 'W', catatan: 'Yang tersedia publik adalah kelas daya MAKSIMUM produksi massal, bukan rata-rata. Daya rata-rata tahunan tidak ditemukan di sumber terbuka.',
      titik: [{ tahun: 2024, jenis: 'maks', nilai: 720, ket: 'wafer G12', edisi: 'ITRPV 16', ...T('s-itrpv16', K) }, { tahun: 2025, jenis: 'maks', nilai: 730, ket: 'naik dari 720 W di edisi sebelumnya', edisi: 'ITRPV 17', ...T('s-itrpv17-ship', K) }],
    },
    perak_per_watt: {
      satuan: 'mg/W', titik: [
        { tahun: 2025, teknologi: 'topcon', nilai: 10, ...T('s-itrpv17-ship', K) }, { tahun: 2036, teknologi: 'topcon', nilai: 6.3, jenis: 'proyeksi', ...T('s-itrpv17-ship', K) },
        { tahun: 2025, teknologi: 'shj', nilai: 12, ...T('s-itrpv17-ship', K) }, { tahun: 2036, teknologi: 'shj', nilai: 4.3, jenis: 'proyeksi', ...T('s-itrpv17-ship', K) },
      ], total_2025: { ton: 7244, persen_pasokan_perak_dunia: 21.4, ...T('s-itrpv17-ship', K) },
    },
    pasar_modul: { kiriman_gw: [{ tahun: 2024, nilai: 703, ...T('s-itrpv17-ship', K) }, { tahun: 2025, nilai: 706, ...T('s-itrpv17-ship', K) }], harga_spot_rata2_usd_per_w_2025: { nilai: 0.09, ket: 'rata-rata berbobot modul c-Si, naik sekitar 9 persen dari 2024', ...T('s-itrpv17-ship', K) } },
    baterai: { rujukan: { berkas: 'public/data/harga_komponen.json', deret_id: 'pack', ket: 'Harga paket Li-ion BNEF 2018-2025 sudah ada di berkas itu; tidak diduplikasi di sini.' }, densitas_pack: null },
    turbin_angin: {
      satuan: 'kW', catatan: 'Hanya angka terbaru yang terbaca; deret 2020-2023 global tidak ditemukan utuh.',
      titik: [
        { tahun: 2024, cakupan: 'dunia, semua turbin baru terpasang', nilai: 5500, ket: 'naik sekitar 9 persen dari 2023', ...T('s-gwec-2024', 'media') },
        { tahun: 2024, cakupan: 'dunia, darat', nilai: 5000, jenis: 'lebih dari', ket: 'rata-rata darat melampaui 5.000 kW untuk pertama kali', ...T('s-gwec-2024', 'media') },
        { tahun: 2024, cakupan: 'dunia, lepas pantai', nilai: 9815, ...T('s-gwec-2024', 'media') },
        { tahun: 2023, cakupan: 'Eropa, darat', nilai: 4500, ...T('s-windletter', 'media') },
        { tahun: 2024, cakupan: 'Eropa, darat', nilai: 4600, ...T('s-windletter', 'media') },
      ],
    },
    meta: {
      diperbarui: TANGGAL, celah: [
        'Daya modul rata-rata per tahun, densitas pack baterai (Wh/kg, Wh/L) dan seri ukuran turbin global 2020-2023 tidak ditemukan di sumber yang boleh dikutip; kolom dikosongkan.',
        'Pangsa teknologi sel memakai ringkasan media atas ITRPV (laporan lengkap diterbitkan VDMA); edisi 16 dan 17 tidak sepenuhnya sebanding. IEA dan InfoLink belum diambil.',
        'Rekor NREL = hasil terbaik laboratorium (ukuran sel kecil), bukan efisiensi produk massal.',
      ],
    },
  };
}
export function bangunBahan() {
  const deret = Object.entries(PS).map(([id, titik]) => ({ id, satuan: SATUAN[id], basis: 'rata-rata tahunan, USD nominal', ytd_2026: { y: YTD26[id], periode: 'Jan-Okt 2026 (10 bulan), bukan tahun penuh', ...T('s-pinksheet-bln', 'resmi') }, titik: titik.map(([x, y]) => ({ x, y, ...T('s-pinksheet', 'resmi') })) }));
  const perak = Object.fromEntries(PS.perak);
  const hargaModul = 0.09; // USD/W, ITRPV 17 (2025)
  const per = (th) => (perak[th] / GRAM_PER_TROY_OZ) * 0.010; // USD/W pada 10 mg/W
  const sens = [2020, 2021, 2022, 2023, 2024, 2025].map((th) => ({ tahun: th, perak_usd_per_g: Math.round((perak[th] / GRAM_PER_TROY_OZ) * 10000) / 10000, topcon_10mg_w_usd_per_w: Math.round(per(th) * 100000) / 100000 }));
  return {
    lapis: 'publik', dibangun_pada: TANGGAL, sumber: ['s-pinksheet', 's-pinksheet-bln', 's-itrpv17-ship', 's-usgs-li', 's-poli-smm', 's-poli-bernreuter'].map((i) => SUMBER.find((s) => s.id === i)), deret,
    litium_karbonat: { id: 'litium-karbonat', satuan: 'USD/ton', basis: 'rata-rata tahunan karbonat litium kelas baterai, dolar riil (USGS)', titik: [[2021, 11700], [2022, 63700], [2023, 39000], [2024, 11800], [2025, 9000]].map(([x, y]) => ({ x, y, ...(x === 2025 ? { catatan: 'estimasi USGS (2025e)' } : {}), ...T('s-usgs-li', 'resmi') })) },
    polisilikon: { satuan: 'bervariasi per titik', catatan: 'Hanya titik waktu (bukan rata-rata tahunan); definisi berbeda (P-type vs n-type, dengan/tanpa PPN). Tidak boleh disambung jadi satu garis.', titik: [
      { tanggal_harga: '2023-12-31', y: 59, satuan: 'CNY/kg', jenis: 'P-type dense, akhir 2023', ...T('s-poli-smm', 'media') },
      { tanggal_harga: '2024-12-31', y: 35.5, satuan: 'CNY/kg', jenis: 'P-type dense, rata-rata akhir 2024', ...T('s-poli-smm', 'media') },
      { tanggal_harga: '2025-12-01', y: 6.88, satuan: 'USD/kg', jenis: 'spot global, awal Des 2025', ...T('s-poli-bernreuter', 'media') },
      { tanggal_harga: '2025-12-01', y: 51, satuan: 'CNY/kg', jenis: 'indeks n-type China termasuk PPN 13 persen, awal Des 2025', ...T('s-poli-bernreuter', 'media') },
    ] },
    sensitivitas: {
      perak_ke_modul: {
        tingkat_bukti: 'EST', tanggal: TANGGAL, rumus: 'biaya perak per W = harga perak (USD/g) x mg/W / 1000; harga perak dari Pink Sheet (USD/troy oz / 31,1035); 10 mg/W = konsumsi sel TOPCon 2025 menurut ITRPV 17',
        konsumsi_mg_per_w: 10, harga_modul_acuan_usd_per_w: hargaModul, porsi_dari_harga_modul_2025_persen: Math.round((per(2025) / hargaModul) * 1000) / 10,
        per_tahun: sens, catatan: 'Konsumsi 10 mg/W dipakai konstan untuk semua tahun sebagai penyederhanaan; konsumsi tahun lebih awal lebih tinggi sehingga biaya riil lebih besar (EST, bukan terukur).',
      },
    },
    meta: {
      diperbarui: TANGGAL, celah: [
        'Baja tidak ada di Pink Sheet tahunan dan belum diambil. Polisilikon hanya titik waktu (SMM, Bernreuter), bukan deret tahunan 2020-2026; deret mingguan InfoLink ada di benchmark_harga.json. Laporan IEA (supply chain) belum dibaca. Karbonat litium USGS: 2020 dan 2026 tidak tersedia pada MCS 2026.',
      'Tahun 2026 belum memiliki rata-rata tahunan resmi; deret tahunan berhenti di 2025 dan rata-rata Jan-Okt 2026 dicatat terpisah (ytd_2026).',
        'Sensitivitas hanya untuk perak ke modul (konsumsi per W bersumber ITRPV). Kandungan tembaga, aluminium, nikel, litium per W atau per kWh belum bersumber, jadi sensitivitasnya tidak dihitung agar tidak mengarang.',
        'Berkas Pink Sheet diunduh ulang dari thedocs.worldbank.org dan identik byte demi byte (SHA-1 sama) dengan unduhan pertama. Lembar "Cover" yang berisi teks perbandingan janggal adalah lembar TERSEMBUNYI di berkas resmi itu sendiri; angka diambil dari lembar "Annual Prices (Nominal)" dan "Monthly Prices" saja.',
      ],
    },
  };
}
