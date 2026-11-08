// Pembangun public/data/global/esg_rantai.json (offline; angka ditranskripsi dari bacaan 2026-11-08, tanpa menyalin hilirisasi.json).
// Tautan dua arah: org_id dari pemasok_surya/pemasok_lain/organisasi; rantai mineral merujuk id hilirisasi.json.
// Aturan: bila sumber tidak terbaca, nilai null + masuk CELAH. Tidak ada angka yang dikarang.
export const TANGGAL = '2026-11-08';
const S = (id, judul, penerbit, url, tingkat_bukti, catatan) => ({ id, judul, penerbit, url, tingkat_bukti, tanggal_akses: TANGGAL, ...(catatan ? { catatan } : {}) });
export const SUMBER = [
  S('s-fraunhofer-2021', 'Frameless glass-glass solar modules made in Europe have the best CO2 footprint, Fraunhofer ISE says (pv magazine, 24 Sep 2021): modul mono-Si buatan Tiongkok, Jerman, UE; satuan kg CO2-eq per kW', 'Fraunhofer ISE via pv magazine', 'https://www.pv-magazine.com/2021/09/24/frameless-glass-glass-solar-modules-made-in-europe-have-the-best-co2-footprint-fraunhofer-ise-says', 'media', 'Nilai Tiongkok glass-glass 750 terbaca tersirat (teks sumber rusak); nilai glass-backsheet Tiongkok 810 hanya dari ringkasan pencarian dan Mercom, tidak terbaca langsung.'),
  S('s-mercom-fraunhofer', 'Modules Manufactured in Europe Emit 40% Less CO2 than the Chinese: Fraunhofer ISE', 'Mercom India', 'https://mercomindia.com/modules-manufactured-europe-emit-40-percent-less-co2', 'media', 'Hanya muncul di hasil pencarian; isi tidak dibuka.'),
  S('s-willis-topcon', 'Willis dkk. (Nature Communications; dilaporkan 2026): TOPCon cradle-to-gate India 0,95 dan Eropa 0,40 kg CO2e per Wp', 'ScienceBlog meringkas makalah', 'https://scienceblog.com/next-generation-solar-panels-could-slash-billions-of-tonnes-of-co%E2%82%82-from-their-own-manufacturing/', 'media', 'Makalah primer tidak dibaca; hanya dari ringkasan pencarian. Model listrik India memakai data berusia lebih dari lima tahun.'),
  S('s-iea-pvps-t12', 'IEA PVPS Task 12, Life Cycle Assessment Fact Sheet (pembaruan 2023): PLTS atap rumah 3 kWp Eropa, 976 kWh/kWp; sistem mono-Si 35,8 dan modul mono-Si 20,2 g CO2-eq per kWh', 'IEA PVPS Task 12', 'https://iea-pvps.org/wp-content/uploads/2024/05/Slides_IEA-PVPS-T12_Fact-Sheet-update-2023_v2.0.pdf', 'resmi', 'PDF tidak terbaca mesin; angka dari ringkasan pencarian atas dek slide ini. Tidak ada rincian per negara produksi di bacaan kami.'),
  S('s-peiseler-2024', 'Peiseler dkk. (Nature Communications, 2024) via ringkasan batterydesign.net: jejak produksi sel rata-rata Eropa 57, AS dan Korea Selatan 67, Tiongkok 90-96 kg CO2e/kWh; LFP 31-71, NMC811 59-115', 'batterydesign.net meringkas Peiseler dkk.', 'https://www.batterydesign.net/carbon-footprint-vs-cell-chemistry/', 'media', 'Makalah primer tidak dibaca.'),
  S('s-greenpeace-2025', 'Greenpeace East Asia, Charging Toward Zero Emissions (Jul 2025), dimuat Eco-Business 16 Jul 2025: sel NMC Prancis 52, Jerman 126,5, Tiongkok 99-136 kg CO2e/kWh', 'Greenpeace via Eco-Business', 'https://www.eco-business.com/news/worlds-largest-ev-battery-makers-need-cleaner-grids-to-decarbonise-report', 'media', 'Tidak ada angka per produsen (CATL, BYD, LGES) di teks.'),
  S('s-dhs-uflpa', 'UFLPA Entity List', 'U.S. Department of Homeland Security', 'https://www.dhs.gov/uflpa-entity-list', 'resmi', 'Dibaca lewat ringkasan WebFetch (bukan tabel mentah); tanggal penambahan 3 Agu 2026 dan keanggotaan perlu diverifikasi langsung di laman DHS sebelum dipakai.'),
  S('s-spw-uflpa-2025', '5 solar entities included in latest batch of banned products under UFLPA (Solar Power World, 15 Jan 2025)', 'Solar Power World', 'https://www.solarpowerworldonline.com/2025/01/5-solar-entities-included-in-latest-batch-of-banned-products-under-uflpa/', 'media', 'Menyebut Hoshine, Daqo, East Hope, dan GCL New Energy sebagai pencantum sebelumnya.'),
  S('s-ssi-jasolar-suspend', 'SSI suspends JA Solar membership following UFLPA listing (PV Tech, 16 Jan 2025)', 'PV Tech', 'https://www.pv-tech.org/ssi-suspends-ja-solar-membership-following-uflpa-listing', 'media'),
  S('s-ssi-trina', 'Trinasolar module factories awarded silver supply chain traceability certificates by SSI (PV Tech, 11 Mei 2026): Yiwu dan Yancheng, TUV SUD', 'PV Tech', 'https://www.pv-tech.org/trinasolar-module-factories-awarded-silver-supply-chain-traceability-certificates-by-ssi/', 'media'),
  S('s-ssi-jasolar-silver', 'JA Solar awarded SSI silver medal certification (PV Tech): basis Shanghai (Fengxian) dan Yangzhou', 'PV Tech', 'https://www.pv-tech.org/industry-updates/ja-solar-awarded-ssi-silver-medal-certification-marking-major-sustainability-milestone', 'media', 'Tanggal terbit tidak terbaca; hanya dari ringkasan pencarian, isi tidak dibuka.'),
  S('s-ssi-astronergy', 'SSI awards first Supply Traceability certificates to Astronergy module factories (PV Tech)', 'PV Tech', 'https://www.pv-tech.org/ssi-awards-first-supply-traceability-certificates-to-astronergy-module-factories/', 'media', 'Hanya judul dan ringkasan pencarian; tanggal dan lokasi pabrik tidak dibaca.'),
  S('s-sbti-jinko', 'JinkoSolar first PV manufacturer to have net-zero targets approved by SBTi (PV Tech; target dekat dan panjang disetujui akhir 2023)', 'PV Tech', 'https://www.pv-tech.org/industry-updates/jinkosolar-first-pv-manufacturer-to-have-net-zero-targets-approved-by-sbti/', 'media'),
  S('s-sbti-longi', 'LONGi Receives SBTi Approval for Emission Reduction Targets (11 Agu 2023): target dekat selaras 1,5 derajat C', 'LONGi', 'https://www.longi.com/en/news/sbti-approval/', 'resmi', 'Siaran perusahaan; isi laman tidak dibuka, dari ringkasan pencarian.'),
  S('s-cngr-pcam', 'CNGR Indonesia pCAM Plant Begins Operation in South Kalimantan (SMM, 13 Jan 2026)', 'Shanghai Metals Market', 'https://news.metal.com/en/newscontent/103718155-cngr-indonesia-pcam-plant-begins-operation-in-south-kalimantan', 'media', 'Kapasitas tidak terbaca.'),
  S('s-cngr-petromindo', 'CNGR plans major nickel-based pCAM and nickel production expansion in Indonesia: pCAM ternary 20.000 ton logam, operasi akhir 2026 (lokasi tidak disebut)', 'Petromindo', 'https://ftp.petromindo.com/news/article/cngr-plans-major-nickel-based-pcam-and-nickel-production-expansion-in-indonesia', 'media', 'Belum pasti sama dengan pabrik Kalimantan Selatan.'),
  S('s-hli-10gwh', 'EV Battery Manufacturing Investment in Indonesia: 2026 Guide: Kemenko Perekonomian (Nov 2025) menyebut HLI Green Power 10 GWh/tahun', 'Invest in Asia', 'https://investinasia.id/blog/ev-battery-manufacturing-investment-in-indonesia/', 'media'),
  S('s-catib-jabar', 'Karawang EV battery plant set to begin operations (kapasitas 15 GWh sel/tahun)', 'Pemprov Jawa Barat (investasi.jabarprov.go.id)', 'https://investasi.jabarprov.go.id/news/karawang-ev-battery-plant-set-to-begin-operations', 'resmi', 'Bertentangan dengan 6,9 GWh awal pada sumber media; kedua angka ditampilkan.'),
  S('s-catib-investortrust', 'Giant CATL-IBC Battery Plant Begins Trial Runs in West Java (Investortrust)', 'Investortrust', 'https://investortrust.id/market/113741/indonesia-charges-its-ev-ambitions-as-giant-catl-ibc-battery-plant-begins-trial-runs-in-west-java', 'media', 'Kapasitas awal 6,9 GWh dan operasi bertahap Agu 2026 dari ringkasan pencarian.'),
];
// Satuan seragam: kg CO2-eq per kWp (modul) | kg CO2e per kWh kapasitas (baterai). 'EU' bukan kode ISO negara: iso2 null.
export const JEJAK_MODUL = [
  { id: 'jm-cn-gg', negara_iso2: 'CN', wilayah: 'Tiongkok', nilai: 750, satuan: 'kg CO2-eq/kWp', teknologi: 'mono-Si, kaca-kaca tanpa rangka', batas: 'pembuatan, angkut, operasi (kata sumber)', tahun_data: 2021, sumber_id: 's-fraunhofer-2021', tingkat_bukti: 'EST', catatan: 'Terbaca tersirat dari teks rusak; selisih utama dari bauran listrik lokasi produksi.' },
  { id: 'jm-cn-gb', negara_iso2: 'CN', wilayah: 'Tiongkok', nilai: 810, satuan: 'kg CO2-eq/kWp', teknologi: 'mono-Si, kaca-backsheet', tahun_data: 2021, sumber_id: 's-mercom-fraunhofer', tingkat_bukti: 'EST', catatan: 'Hanya dari ringkasan pencarian; belum dikonfirmasi bacaan langsung.' },
  { id: 'jm-de-gg', negara_iso2: 'DE', wilayah: 'Jerman', nilai: 520, satuan: 'kg CO2-eq/kWp', teknologi: 'mono-Si, kaca-kaca tanpa rangka', tahun_data: 2021, sumber_id: 's-fraunhofer-2021', tingkat_bukti: 'media' },
  { id: 'jm-de-gb', negara_iso2: 'DE', wilayah: 'Jerman', nilai: 580, satuan: 'kg CO2-eq/kWp', teknologi: 'mono-Si, kaca-backsheet', tahun_data: 2021, sumber_id: 's-fraunhofer-2021', tingkat_bukti: 'media' },
  { id: 'jm-eu-gg', negara_iso2: null, wilayah: 'Uni Eropa', nilai: 420, satuan: 'kg CO2-eq/kWp', teknologi: 'mono-Si, kaca-kaca tanpa rangka', tahun_data: 2021, sumber_id: 's-fraunhofer-2021', tingkat_bukti: 'media' },
  { id: 'jm-eu-gb', negara_iso2: null, wilayah: 'Uni Eropa', nilai: 480, satuan: 'kg CO2-eq/kWp', teknologi: 'mono-Si, kaca-backsheet', tahun_data: 2021, sumber_id: 's-fraunhofer-2021', tingkat_bukti: 'media' },
  { id: 'jm-in-topcon', negara_iso2: 'IN', wilayah: 'India', nilai: 950, satuan: 'kg CO2-eq/kWp', teknologi: 'TOPCon, cradle-to-gate', tahun_data: 2026, sumber_id: 's-willis-topcon', tingkat_bukti: 'EST', catatan: '0,95 kg/Wp x 1000. Data listrik India lebih dari lima tahun.' },
  { id: 'jm-eropa-topcon', negara_iso2: null, wilayah: 'Eropa', nilai: 400, satuan: 'kg CO2-eq/kWp', teknologi: 'TOPCon, cradle-to-gate', tahun_data: 2026, sumber_id: 's-willis-topcon', tingkat_bukti: 'EST', catatan: '0,40 kg/Wp x 1000.' },
];
export const JEJAK_LISTRIK_PLTS = { nilai: 35.8, satuan: 'g CO2-eq/kWh', rincian: 'sistem mono-Si atap 3 kWp Eropa; modul saja 20,2; 976 kWh/kWp', sumber_id: 's-iea-pvps-t12', tingkat_bukti: 'resmi', catatan: 'Pembanding seumur hidup (per kWh), bukan produksi per kWp; tidak dapat dibandingkan langsung dengan baris modul.' };
export const JEJAK_BATERAI = [
  { id: 'jb-eropa', negara_iso2: null, wilayah: 'Eropa (rata-rata)', nilai: 57, satuan: 'kg CO2e/kWh', kimia: 'campuran', sumber_id: 's-peiseler-2024', tingkat_bukti: 'media' },
  { id: 'jb-as-kr', negara_iso2: null, wilayah: 'AS dan Korea Selatan (rata-rata)', nilai: 67, satuan: 'kg CO2e/kWh', kimia: 'campuran', sumber_id: 's-peiseler-2024', tingkat_bukti: 'media' },
  { id: 'jb-cn', negara_iso2: 'CN', wilayah: 'Tiongkok', rentang: { min: 90, max: 96 }, satuan: 'kg CO2e/kWh', kimia: 'campuran', sumber_id: 's-peiseler-2024', tingkat_bukti: 'media' },
  { id: 'jb-lfp', negara_iso2: null, wilayah: 'Semua wilayah', rentang: { min: 31, max: 71 }, satuan: 'kg CO2e/kWh', kimia: 'LFP', sumber_id: 's-peiseler-2024', tingkat_bukti: 'media' },
  { id: 'jb-nmc811', negara_iso2: null, wilayah: 'Semua wilayah', rentang: { min: 59, max: 115 }, satuan: 'kg CO2e/kWh', kimia: 'NMC811', sumber_id: 's-peiseler-2024', tingkat_bukti: 'media' },
  { id: 'jb-fr-nmc', negara_iso2: 'FR', wilayah: 'Prancis', nilai: 52, satuan: 'kg CO2e/kWh', kimia: 'NMC', sumber_id: 's-greenpeace-2025', tingkat_bukti: 'media', catatan: 'Batas bawah' },
  { id: 'jb-de-nmc', negara_iso2: 'DE', wilayah: 'Jerman', nilai: 126.5, satuan: 'kg CO2e/kWh', kimia: 'NMC', sumber_id: 's-greenpeace-2025', tingkat_bukti: 'media', catatan: 'Batas atas' },
  { id: 'jb-cn-nmc', negara_iso2: 'CN', wilayah: 'Tiongkok', rentang: { min: 99, max: 136 }, satuan: 'kg CO2e/kWh', kimia: 'NMC', sumber_id: 's-greenpeace-2025', tingkat_bukti: 'media' },
];
// Daftar DHS (ringkasan); org_id hanya bila entitas induk/anak jelas ada di organisasi/pemasok. Bukan tuduhan: status daftar pemerintah AS.
const U = (id, entitas, ditambahkan, bagian, sektor, org_id = null, ket = null) => ({ id, entitas, ditambahkan, bagian, sektor, org_id, sumber_id: 's-dhs-uflpa', tingkat_bukti: 'resmi', ...(ket ? { catatan: ket } : {}) });
export const KERJA_PAKSA = {
  basis: 'UFLPA Entity List (DHS AS). Dampak hanya ke impor ke AS; tidak ada larangan di Indonesia.',
  entitas: [
    U('uf-hoshine', 'Hoshine Silicon Industry (Shanshan) Co., Ltd (dan anak usaha)', '2022-06-21', '2(d)(2)(B)(i)', 'silikon'),
    U('uf-daqo', 'Xinjiang Daqo New Energy Co., Ltd.', '2022-06-21', '2(d)(2)(B)(i)', 'polisilikon', 'en_8dc29e8ca8', 'Ringkasan juga memuat baris Daqo pada 2024-11-25 (bagian v); dianggap satu entitas.'),
    U('uf-easthope', 'Xinjiang East Hope Nonferrous Metals Co., Ltd.', '2024-11-25', '2(d)(2)(B)(i)', 'aluminium', 'en_fdafea5dce', 'Induk: East Hope Group.'),
    U('uf-goens', 'Xinjiang Goens Energy Technology Co., Ltd.', '2026-08-03', '2(d)(2)(B)(i)', 'polisilikon', null, 'Sektor disimpulkan dari nama; verifikasi.'),
    U('uf-camel', 'Camel Group Co., Ltd.', '2023-08-02', '2(d)(2)(B)(ii)', 'baterai (aki asam-timbal)', null, 'Sektor disimpulkan dari nama.'),
    U('uf-meike-baotou', 'Baotou Meike Silicon Energy Co., Ltd.', '2025-01-15', '2(d)(2)(B)(v)', 'silikon'),
    U('uf-meike-jiangsu', 'Jiangsu Meike Solar Technology Co., Ltd.', '2025-01-15', '2(d)(2)(B)(v)', 'surya'),
    U('uf-hongyuan-green', 'Hongyuan Green Energy Co., Ltd.', '2025-01-15', '2(d)(2)(B)(v)', 'surya'),
    U('uf-hongyuan-mat', 'Hongyuan New Materials (Baotou) Co., Ltd.', '2025-01-15', '2(d)(2)(B)(v)', 'material'),
    U('uf-shuangliang', 'Shuangliang Silicon Materials (Baotou) Co., Ltd.', '2025-01-15', '2(d)(2)(B)(v)', 'silikon'),
    U('uf-donghai-ja', 'Donghai JA Solar Technology Co., Ltd.', '2025-01-15', '2(d)(2)(B)(v)', 'surya (sel/modul)', 'en_8ce6cc9a41', 'Anak usaha JA Solar; DHS menduga polisilikon dari Xinjiang. Pihak JA Solar menyatakan bukan; belum ada putusan yang dibaca.'),
    U('uf-xinren-1', 'Jiangyin Xinren Aluminum Foil Technology Co., Ltd.', '2026-08-03', '2(d)(2)(B)(v)', 'aluminium (foil)'),
    U('uf-xinren-2', 'Jiangyin Xinren Aluminum Technology Co., Ltd.', '2026-08-03', '2(d)(2)(B)(v)', 'aluminium'),
    U('uf-xinren-shihezi', 'Shihezi Xinren Battery Aluminum Foil Technology Co., Ltd.', '2026-08-03', '2(d)(2)(B)(v)', 'foil aluminium baterai'),
    U('uf-tianshan-xpcc', 'Xinjiang Production and Construction Corps Eighth Division Tianshan Aluminum Co., Ltd.', '2026-08-03', '2(d)(2)(B)(v)', 'aluminium'),
    U('uf-tianshan', 'Tianshan Aluminum Group Co., Ltd.', '2026-08-03', '2(d)(2)(B)(v)', 'aluminium'),
    U('uf-sdic-lithium', 'SDIC Xinjiang Lithium Industry Co., Ltd.', '2026-08-03', '2(d)(2)(B)(v)', 'litium'),
    U('uf-tianhongji', 'Xinjiang Tianhongji Technology Co., Ltd.', '2026-08-03', '2(d)(2)(B)(v)', 'silikon'),
    U('uf-weiqiao', 'Shandong Weiqiao Pioneering Group Co., Ltd.', '2026-08-03', '2(d)(2)(B)(v)', 'aluminium', null, 'Sektor disimpulkan dari nama.'),
  ],
  dilaporkan_tidak_terbaca_di_daftar: [{ entitas: 'Xinjiang GCL New Energy Material Technology Co.', induk_org_id: null, sumber_id: 's-spw-uflpa-2025', catatan: 'Solar Power World menyebut GCL New Energy sebagai pencantum sebelumnya; tidak terbaca pada ringkasan laman DHS. Verifikasi di DHS sebelum dicatat.' }],
  catatan: 'Hanya entitas terdaftar; ini bukan daftar pemasok yang bebas kerja paksa. Entitas yang tidak terdaftar tetap bisa berisiko lewat rantai hulu.',
};
// Sertifikasi ESG pemasok. status: berlaku | ditangguhkan | anggota | target | tidak-terbaca. org_id dari pemasok_surya.json.
const C = (id, org_id, nama, skema, status, tanggal, detail, sumber_id, tingkat_bukti = 'media') => ({ id, org_id, nama, skema, status, tanggal, detail, sumber_id, tingkat_bukti });
export const SERTIFIKASI = [
  C('sr-trina-ssi', 'en_2684d348da', 'Trina Solar', 'Solar Stewardship Initiative (traceability)', 'berlaku', '2026-05-11', 'Sertifikat Supply Chain Traceability tingkat perak untuk pabrik modul Yiwu dan Yancheng (TUV SUD); sudah lulus Standar ESG SSI. Sertifikasi awal; berlaku untuk produk yang dipesan sebagai SSI-traceable.', 's-ssi-trina'),
  C('sr-ja-ssi-suspend', 'en_8ce6cc9a41', 'JA Solar', 'Solar Stewardship Initiative (keanggotaan)', 'ditangguhkan', '2025-01-16', 'Keanggotaan ditangguhkan setelah anak usaha masuk UFLPA; SSI tidak mensertifikasi lokasi di wilayah seperti Xinjiang. Penangguhan kemudian dicabut menurut ringkasan pencarian.', 's-ssi-jasolar-suspend'),
  C('sr-ja-ssi-silver', 'en_8ce6cc9a41', 'JA Solar', 'Solar Stewardship Initiative (sertifikasi)', 'berlaku', null, 'Sertifikasi perak untuk basis Shanghai (Fengxian) dan Yangzhou; tanggal tidak terbaca.', 's-ssi-jasolar-silver'),
  C('sr-astronergy-ssi', 'en_df52dd9f61', 'Astronergy (Chint)', 'Solar Stewardship Initiative (traceability)', 'berlaku', null, 'Sertifikat Supply Traceability pertama SSI untuk pabrik modul Astronergy; detail tidak dibaca.', 's-ssi-astronergy'),
  C('sr-jinko-sbti', 'en_15a69db346', 'JinkoSolar', 'SBTi (target)', 'berlaku', '2023-12', 'Target dekat dan panjang (net-zero) disetujui SBTi; klaim pertama di industri PV.', 's-sbti-jinko'),
  C('sr-longi-sbti', 'en_5812c37694', 'LONGi', 'SBTi (target)', 'berlaku', '2023-08-11', 'Target pengurangan emisi dekat selaras 1,5 derajat C disetujui; target internal -60 persen emisi operasi 2030 terhadap 2020.', 's-sbti-longi', 'resmi'),
];
export const CELAH_SERTIFIKASI = [
  'RE100 pabrik modul/sel: tidak ada daftar publik per pabrik yang terbaca; kolom kosong, bukan tidak ada.',
  'Skor CDP perusahaan (A-D-) tidak diambil: skor publik ada di situs CDP yang tak terbaca tanpa login.',
  'SBTi untuk Trina, JA Solar, Canadian Solar, First Solar, Hanwha Qcells: tidak ditemukan; belum berarti tidak ada. Cek dasbor SBTi.',
  'Anggota SSI lain (Canadian Solar, Risen, Aiko, JinkoSolar, LONGi) tercatat anggota menurut pers dagang tanpa sertifikat terbaca; keanggotaan bukan sertifikasi.',
];
// Rantai mineral kritis ke sel baterai. Tahap prekursor dan sel DIRUJUK ke hilirisasi.json (id), tidak disalin angkanya; pCAM/katoda ditambah di sini.
export const RANTAI_MINERAL = {
  tahap: [
    { urut: 1, id: 'tambang', nama: 'Tambang bijih nikel/kobalt', catatan: 'Lihat hilirisasi.json dan lapisan tambang; tidak diulang.' },
    { urut: 2, id: 'smelter', nama: 'Smelter (RKEF, matte)', hilirisasi_ids_rantai: 'smelter' },
    { urut: 3, id: 'prekursor', nama: 'Prekursor antara (MHP, HPAL)', hilirisasi_ids: ['vale-pomalaa', 'harita-hpal', 'nic-enc', 'hnc-hpal'] },
    { urut: 4, id: 'pcam', nama: 'Prekursor katoda (pCAM) dan katoda', pemain: ['cngr-pcam-kalsel'] },
    { urut: 5, id: 'sel', nama: 'Sel baterai', hilirisasi_ids: ['hli-karawang', 'catl-ibc'] },
  ],
  tambahan: [
    {
      id: 'cngr-pcam-kalsel', tahap: 'pcam', nama: 'CNGR Indonesia pCAM, Kalimantan Selatan', pemilik: [{ nama: 'CNGR Advanced Material', negara: 'cn', org_id: null }],
      kapasitas: { nilai: null, satuan: 'ton logam/tahun', jenis: 'tidak-terbaca', alternatif: [{ nilai: 20000, satuan: 'ton logam pCAM ternary', ket: 'Rencana ekspansi CNGR, operasi akhir 2026; lokasi tidak disebut sumber, belum pasti sama dengan pabrik ini', sumber_id: 's-cngr-petromindo' }] },
      status: 'operasi', tanggal_status: '2026-01-13', sumber_id: 's-cngr-pcam', tingkat_bukti: 'media', catatan: 'Mulai beroperasi 13 Jan 2026 menurut SMM; kapasitas terpasang tidak terbaca.',
    },
  ],
  sel_catatan: [
    { hilirisasi_id: 'hli-karawang', kapasitas_gwh: 10, sumber_id: 's-hli-10gwh', ket: 'Konsisten antar sumber.' },
    { hilirisasi_id: 'catl-ibc', kapasitas_gwh_alternatif: [{ nilai: 6.9, ket: 'awal, operasi bertahap Agu 2026 (media)', sumber_id: 's-catib-investortrust' }, { nilai: 15, ket: 'Pemprov Jawa Barat', sumber_id: 's-catib-jabar' }], ket: 'hilirisasi.json belum memuat angka; dua sumber bertentangan, kedua ditampilkan, tidak dipilih.' },
  ],
  celah: [
    'Kapasitas pCAM CNGR terpasang, status pabrik pCAM/katoda Huayou dan pemain katoda lain di Indonesia: tidak terbaca.',
    'Jejak karbon per tahap (smelter berbasis PLTU captive) ada di hilirisasi.json (intensitas_tco2e_per_ton); tidak digabung ke jejak per kWh sel karena perlu faktor alokasi yang tidak bersumber.',
  ],
};
export function bangun() {
  return {
    lapis: 'publik', dibangun_pada: TANGGAL,
    _catatan: 'ESG rantai pasok EBT: jejak karbon modul dan baterai per wilayah produksi, daftar kerja paksa (UFLPA), sertifikasi ESG pemasok, rantai mineral ke sel. Satuan jejak berbeda per baris; bandingkan hanya dalam kelompok yang sama. Nilai dari sumber sekunder bertanda EST/media.',
    sumber: SUMBER, jejak_modul: JEJAK_MODUL, jejak_listrik_plts: JEJAK_LISTRIK_PLTS, jejak_baterai: JEJAK_BATERAI, kerja_paksa: KERJA_PAKSA,
    sertifikasi: SERTIFIKASI, celah_sertifikasi: CELAH_SERTIFIKASI, rantai_mineral: RANTAI_MINERAL,
    meta: { diperbarui: TANGGAL, entitas_uflpa: KERJA_PAKSA.entitas.length, sertifikasi: SERTIFIKASI.length },
    celah: ['Jejak modul per negara produksi dari IEA PVPS Task 12 (per kWp) tidak terbaca (PDF tak dapat diurai); dipakai Fraunhofer ISE 2021 dan satu studi 2026 lewat ringkasan.', 'Tidak ada jejak modul Vietnam, Malaysia, Thailand, Indonesia, atau kategori sel/wafer terpisah.', 'Tidak ada jejak baterai per produsen (CATL, LGES, HLI): tidak terbuka dalam bacaan.'],
  };
}
