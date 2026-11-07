#!/usr/bin/env node
// Naskah topik Efisiensi energi -> public/data/topik/efisiensi.json (TOPIK-SKEMA.md). Pakai: node scripts/pipa/topik_efisiensi.mjs [--selftest]
// Teks dari sumber publik yang dibaca 8 Nov 2026; tabel regulasi dari public/data/regulasi.json. Sintesis berlabel "Analisis METI (Hipotesis)".
import { dalam } from './topik_efisiensi_dalam.mjs';
import { T, hp, S, ED, baca, regS, nf, nfe, teks, faq, glos, rumus, langkah, tabel, grafik, linimasa, kol, L, kunci, kas, rakit, selftest as st, jalankan, tabelRegulasi, kolRegulasi, validasi as val } from './topik_enam_lib.mjs';

const ase = baca('public/data/asean_energi.json');
export const SUMBER = {
  ed: ED,
  pp33: regS('pp-33-2023'), ken: regS('pp-40-2025'), ruen: regS('perpres-22-2017'),
  mgmt: S('Implementasi Manajemen Energi Tahun 2023 Mampu Hemat 10,42 Juta SBM (siaran pers 100.Pers/04/SJI/2024, 9 Feb 2024)', 'Kementerian ESDM', 'https://www.esdm.go.id/id/media-center/arsip-berita/implementasi-manajemen-energi-tahun-2023-mampu-hemat-1042-juta-sbm-', '2026-11-08', 2024, 'resmi'),
  metro331: S('331 Perusahaan Hemat Listrik 16.529 GWh (15 Mei 2024; pernyataan Kepala Balai Besar Survei dan Pengujian Ketenagalistrikan, EBTKE)', 'Metro TV (Media Indonesia)', 'https://www.metrotvnews.com/read/K5nCLggn-331-perusahaan-hemat-listrik-16-529-gwh', '2026-11-08', 2024, 'media'),
  ac: S('Indonesia Hemat Rp 3,76 Triliun Tagihan Listrik Berkat Kebijakan Efisiensi AC (20 Nov 2023; pernyataan Dirjen EBTKE 14 Nov 2023)', 'Listrik Indonesia', 'https://listrikindonesia.com/detail/11935/indonesia-hemat-rp-376-triliun-tagihan-listrik-berkat-kebijakan-efisiensi-ac', '2026-11-08', 2023, 'media'),
  detikx: S('Jalan Terjal Menuju Pasar AC Efisien (1 Jul 2024)', 'detikX', 'https://news.detik.com/x/detail/spotlight/20240701/Jalan-Terjal-Menuju-Pasar-AC-Efisien/', '2026-11-08', 2024, 'media'),
  mongabay: S('Produk Elektronik Berstandar Hemat Energi Minim Sosialisasi (30 Jun 2024)', 'Mongabay Indonesia', 'https://mongabay.co.id/2024/06/30/produk-elektronik-berstandar-hemat-energi-minim-sosialisasi/', '2026-11-08', 2024, 'media'),
  kompas60: S('Hanya 60 Gedung di Indonesia yang Bersertifikat Green Building (8 Mar 2023)', 'Kompas.com', 'https://lestari.kompas.com/read/2023/03/08/070000386/hanya-60-gedung-di-indonesia-yang-bersertifikat-green-building', '2026-11-08', 2023, 'media'),
  kabar30: S('Efisiensi Energi Tekan Emisi 30 Juta Ton, Jadi Andalan Capai NZE 2060 (24 Apr 2026)', 'KabarBursa', 'https://www.kabarbursa.com/carbon-trading/efisiensi-energi-tekan-emisi-30-juta-ton-jadi-andalan-capai-nze-2060.md', '2026-11-08', 2026, 'media'),
  esco: S('Policy Brief: Enabling ESCO Market in ASEAN for Low Carbon Buildings (3 Mar 2026)', 'International Climate Initiative (IKI)', 'https://www.international-climate-initiative.com/fileadmin/iki/Dokumente/Publikationen/Projekte/23_I_494/20260303_Policy_Brief-Enabling-ESCO-Market-in-ASEAN-for-Low-Carbon-Buildings.pdf', '2026-11-08', 2026, 'kajian'),
  iea_tr: S('Top Runner Programme', 'Badan Energi Internasional (IEA), basis data kebijakan', 'https://www.iea.org/policies/1945-top-runner-programme', '2026-11-08', 2024, 'resmi'),
  meti_jp: S('Top Runner Program briefing sheet (AC non-saluran: perbaikan 32,3 persen FY1997-FY2007; angka dari ringkasan hasil pencarian)', 'METI Jepang via ECCJ', 'https://www.asiaeec-col.eccj.or.jp/wpdata/wp-content/uploads/stk_jap_1_2_1_d.pdf', '2026-11-08', 2008, 'resmi'),
  un_compact: S('Indonesia Energy Compact (target intensitas energi 1 persen per tahun menurut RUEN; angka dari ringkasan hasil pencarian)', 'PBB / Pemerintah RI', 'https://www.un.org/sites/un2.un.org/files/indonesia-energy-compact-11-january-2023.pdf', '2026-11-08', 2023, 'resmi'),
  dqs: S('Permen ESDM No 8 Tahun 2025 (ringkasan: pembiayaan, sertifikasi kompetensi, insentif dan disinsentif, pengawasan)', 'DQS Indonesia', 'https://www.dqsglobal.com/id/wawasan/blog/permen-esdm-no-8-tahun-2025', '2026-11-08', 2025, 'via-pihak-ketiga'),
  tuv: S('Whitepaper Audit Energi dan Sistem Manajemen Energi (sanksi administratif menurut penerbit)', 'TUV NORD Indonesia', 'https://www.tuv-nord.com/fileadmin/Sites/TUEV_NORD_Worldwide/Indonesia/Forms_Indonesia_ID/ENERGY___SUSTAINBILITY_SERVICES/ISO_50001/Whitepaper_Audit_Energ_dan_Sistem_Manajemen_Energi.pdf', '2026-11-08', 2024, 'via-pihak-ketiga'),
  dumping: S('Dugaan Praktik Dumping AC Mencuat saat Suhu Makin Panas (hanya judul dibaca)', 'Kontan', 'https://industri.kontan.co.id/news/dugaan-praktik-dumping-ac-mencuat-saat-suhu-makin-panas', '2026-11-08', 2024, 'media'),
  skem_esdm: S('Tingkatkan Efisiensi Energi, Pemerintah Terus Perbarui Nilai SKEM (hanya judul dibaca)', 'Kementerian ESDM', 'https://www.esdm.go.id/id/media-center/arsip-berita/tingkatkan-efisiensi-energi-pemerintah-terus-perbarui-nilai-skem', '2026-11-08', 2023, 'resmi'),
  kompas7: S('Alat Elektronik Rumahan Punya Peran Besar dalam Transisi Energi (7 produk wajib SKEM dan LTHE pada 2024: AC, penanak nasi, kipas angin, kulkas, lampu LED, televisi, showcase; dari ringkasan hasil pencarian)', 'Kompas.com', 'https://lestari.kompas.com/read/2024/06/11/070000586/alat-elektronik-rumahan-punya-peran-besar-dalam-transisi-energi', '2026-11-08', 2024, 'media'),
  owid: S('Our World in Data energy-data (Ember Yearly Electricity Data), baris ASEAN (public/data/asean_energi.json)', 'Ember via Our World in Data', 'https://raw.githubusercontent.com/owid/energy-data/master/owid-energy-data.csv', '2026-11-08', 2025, 'via-pihak-ketiga', 'CC BY 4.0'),
};

const star = { 3: 896700, 2: 367500, 5: 147000, 4: 58800 };
const totDaikin = Object.values(star).reduce((a, b) => a + b, 0);
const persen45 = Math.round(((star[4] + star[5]) / totDaikin) * 1000) / 10;

function susunAsal() {
  const bab = {};
  bab['2'] = faq(['mgmt', 'pp33', 'ac'], [
    ['Apa itu konservasi energi?', 'What is energy conservation?', 'Upaya menggunakan energi secara efisien tanpa menurunkan manfaat; dasar hukumnya PP 33/2023 tentang Konservasi Energi.', 'Using energy efficiently without losing the benefit; its legal basis is Government Regulation 33/2023 on Energy Conservation.'],
    ['Siapa wajib menerapkan manajemen energi?', 'Who must apply energy management?', 'Pengguna energi sektor industri dan transportasi di atas 4.000 TOE per tahun, penyedia energi di atas 6.000 TOE, dan bangunan di atas 500 TOE (siaran pers ESDM, 9 Feb 2024).', 'Industry and transport users above 4,000 TOE per year, energy providers above 6,000 TOE and buildings above 500 TOE (Energy Ministry release, 9 Feb 2024).'],
    ['Apa yang dilakukan pengguna energi besar?', 'What do large energy users do?', 'Menunjuk manajer energi bersertifikat, menyusun program konservasi, mengaudit energi, menjalankan rekomendasi audit, dan melapor (ringkasan TUV NORD, ESDM).', 'Appoint a certified energy manager, draw up a conservation programme, audit energy, implement audit recommendations and report (TUV NORD, Energy Ministry summaries).'],
    ['Berapa hasil manajemen energi 2023?', 'What did energy management deliver in 2023?', '410 entitas melapor dan menghemat 10,42 juta SBM, sekitar 1,73 persen dari konsumsi 602 juta SBM, dengan emisi 8,42 juta tCO2e terhindar.', '410 entities reported and saved 10.42 million BOE, about 1.73 percent of the 602 million BOE consumption, avoiding 8.42 million tCO2e.'],
    ['Apa itu SKEM dan LTHE?', 'What are SKEM and LTHE?', 'SKEM adalah standar kinerja energi minimum yang melarang produk boros; LTHE adalah label tanda hemat energi berbintang 1 sampai 5.', 'SKEM is the minimum energy performance standard that bars inefficient products; LTHE is the energy-saving label rated 1 to 5 stars.'],
    ['Produk apa yang wajib berlabel?', 'Which products need the label?', 'Menurut Kompas (2024) tujuh produk: AC, penanak nasi, kipas angin, kulkas, lampu LED, televisi, dan showcase.', 'Per Kompas (2024) seven products: air conditioners, rice cookers, fans, refrigerators, LED lamps, televisions and display coolers.'],
    ['Apakah ada sanksi?', 'Are there sanctions?', 'Sumber berbeda: TUV NORD menyebut sanksi administratif; pejabat Balai Besar ESDM pada Mei 2024 menyatakan belum ada sanksi dan prioritas masih penyadaran. Periksa teks PP 33/2023 dan aturan turunan.', 'Sources differ: TUV NORD cites administrative sanctions; an Energy Ministry institute head said in May 2024 there were none yet, with awareness the priority. Check the text of PP 33/2023 and its derived rules.'],
    ['Apa itu ESCO?', 'What is an ESCO?', 'Perusahaan jasa energi yang membiayai atau menjalankan proyek efisiensi dan dibayar dari penghematan; Permen ESDM 1/2026 menyebut standardisasi usaha ESCO (KabarBursa).', 'An energy service company that finances or runs efficiency projects and is paid from savings; Energy Ministry Reg. 1/2026 covers ESCO business standardisation (KabarBursa).'],
  ]);
  bab['3'] = glos(['ed', 'mgmt', 'pp33'], [
    ['SBM', 'BOE', 'Setara barel minyak, satuan energi nasional; 1 TOE sekitar 7,2 SBM.', 'Barrel of oil equivalent; 1 TOE is roughly 7.2 BOE.'],
    ['TOE', 'TOE', 'Tonne of oil equivalent; ambang kewajiban manajemen energi dinyatakan dalam TOE per tahun.', 'Tonne of oil equivalent; the management duty thresholds are in TOE per year.'],
    ['Manajemen energi', 'Energy management', 'Rangkaian kegiatan terencana (manajer, program, audit, pelaporan) untuk menghemat energi.', 'A planned set of activities (manager, programme, audit, reporting) to save energy.'],
    ['Audit energi', 'Energy audit', 'Pemeriksaan pola pemakaian energi untuk menemukan peluang hemat; dilakukan auditor bersertifikat.', 'Examination of energy-use patterns to find savings; done by certified auditors.'],
    ['SKEM', 'MEPS', 'Standar kinerja energi minimum; produk di bawah nilai tidak boleh diedarkan.', 'Minimum energy performance standard; products below the value may not be sold.'],
    ['LTHE', 'Energy label', 'Label tanda hemat energi berbintang 1 sampai 5.', 'Energy-saving label with 1 to 5 stars.'],
    ['CSPF', 'CSPF', 'Cooling seasonal performance factor, ukuran efisiensi AC dalam W per W; makin tinggi makin hemat.', 'Cooling seasonal performance factor, AC efficiency in W per W; higher is better.'],
    ['ESCO', 'ESCO', 'Energy service company; dibayar dari penghematan.', 'Energy service company; paid from savings.'],
    ['Top Runner', 'Top Runner', 'Program Jepang yang menetapkan target efisiensi dari produk terbaik di pasar.', 'Japan\'s programme setting efficiency targets from the best product on the market.'],
    ['Intensitas energi', 'Energy intensity', 'Energi yang dipakai per satuan PDB; sasaran RUEN menurunkannya 1 persen per tahun.', 'Energy used per unit of GDP; RUEN aims to cut it 1 percent a year.'],
  ]);
  bab['4'] = teks(['kabar30', 'ed'], [
    ['Efisiensi energi disebut pejabat Direktorat Konservasi Energi ESDM sebagai bahan bakar dekarbonisasi pertama: cara menurunkan emisi yang paling mudah dan murah (KabarBursa, 24 Apr 2026).', 'An Energy Ministry conservation official calls efficiency the first decarbonisation fuel: the easiest and cheapest way to cut emissions (KabarBursa, 24 Apr 2026).'],
    ['Kebijakan efisiensi disebut telah menekan sekitar 30 juta ton CO2 hingga awal 2026 atau 22,7 persen dari target penurunan emisi 2030, dan diproyeksikan menyumbang 37 persen penurunan emisi.', 'Efficiency policies are said to have cut about 30 million tonnes of CO2 by early 2026, or 22.7 percent of the 2030 reduction target, and are projected to supply 37 percent of reductions.'],
    ['Bagi anggota METI: tiap kWh yang dihemat mengurangi kebutuhan pembangkit dan jaringan baru, dan membuka pasar jasa audit, ESCO, serta peralatan efisien.', 'For METI members: every kWh saved reduces the need for new generation and grid, and opens a market for audits, ESCOs and efficient equipment.'],
  ]);
  bab['5'] = rumus(['ed', 'mgmt', 'mongabay'], [
    ['Pangsa hemat (persen) = Energi dihemat / Konsumsi dasar x 100', 'Saving share (percent) = Energy saved / Baseline consumption x 100'],
    ['Hemat biaya (persen) = 1 - (Lama pakai anggaran lama / Lama pakai anggaran baru)', 'Cost saving (percent) = 1 - (Old budget duration / New budget duration)'],
    ['Pangsa AC bintang 4 dan 5 (persen) = (Unit bintang 4 + bintang 5) / Total unit x 100', 'Share of 4- and 5-star ACs (percent) = (4-star + 5-star units) / Total units x 100'],
  ], [
    ['Manajemen energi 2023: 10,42 juta SBM / 602 juta SBM = 1,73 persen (angka pemerintah).', 'Energy management 2023: 10.42 million BOE / 602 million BOE = 1.73 percent (government figure).'],
    ['Kafe di Padang: anggaran listrik Rp1 juta yang dulu cukup 4 hari kini cukup 7 hari setelah mengganti AC berlabel: 1 - 4/7 = sekitar 42,9 persen (EST; satu pengakuan pengusaha, bukan hasil audit).', 'A Padang cafe: an electricity budget of IDR 1 million that used to last 4 days now lasts 7 days after switching to a labelled AC: 1 - 4/7 = about 42.9 percent (EST; one owner\'s account, not an audit).'],
    [`Penjualan Daikin 2023: (58.800 + 147.000) / ${String(totDaikin).replace(/\B(?=(\d{3})+(?!\d))/g, '.')} unit = ${nf(persen45)} persen (EST; satu produsen saja, bukan pasar nasional).`, `Daikin 2023 sales: (58,800 + 147,000) / ${totDaikin.toLocaleString('en-US')} units = ${persen45} percent (EST; one manufacturer only, not the national market).`],
  ]);
  bab['6'] = langkah(['ed', 'pp33', 'detikx', 'esco'], [
    ['Pembuat aturan', 'Rule makers', 'Pemerintah menetapkan PP 33/2023, Permen ESDM 8/2025 (manajemen energi), 3/2025 (instansi pemerintah), dan 1/2026 (ESCO).', 'The government sets PP 33/2023 and Energy Ministry Regs 8/2025 (energy management), 3/2025 (government agencies) and 1/2026 (ESCO).', 'Kementerian ESDM', 'Energy Ministry'],
    ['Pengujian dan sertifikasi produk', 'Product testing and certification', 'Hanya tujuh laboratorium uji tersedia untuk SKEM AC (ESDM, detikX 2024).', 'Only seven test laboratories are available for AC SKEM (Energy Ministry, detikX 2024).', 'Laboratorium uji, ESDM', 'Test laboratories, Energy Ministry'],
    ['Produsen dan penjual', 'Manufacturers and sellers', 'Mengedarkan produk berstiker; komponen kunci seperti kompresor masih diimpor.', 'Sell labelled products; key components such as compressors are still imported.', 'Produsen, toko', 'Manufacturers, shops'],
    ['Pengguna energi besar', 'Large energy users', 'Manajer energi, audit, rekomendasi, pelaporan.', 'Energy manager, audit, recommendations, reporting.', 'Industri, bangunan, penyedia energi', 'Industry, buildings, energy providers'],
    ['Penyedia jasa', 'Service providers', 'Auditor bersertifikat dan ESCO; Indonesia hanya mencatat 12 ESCO di situs pemerintah (IKI, 2026).', 'Certified auditors and ESCOs; Indonesia lists only 12 ESCOs on the government website (IKI, 2026).', 'Auditor, ESCO', 'Auditors, ESCOs'],
  ]);
  bab['7'] = grafik(['detikx', 'skem_esdm'], 'batang', ['Nilai minimum efisiensi AC (W per W)', 'Minimum AC efficiency (W per W)'], 'W/W', 2, [[['Standar atau capaian', 'Standard or level'], true, [['Indonesia sebelum 2023', 3.1], ['Indonesia (Kepmen 134/2023)', 3.4], ['ASEAN SKEM 2023', 3.7], ['Singapura', 5.93], ['ASEAN SKEM 2025 (target)', 6.09], ['Tiongkok', 6.1]]]],
    ['Angka dari detikX (1 Jul 2024). Nilai bukan seluruhnya sebanding (metode uji dan kategori dapat berbeda).', 'Figures from detikX (1 Jul 2024). Values are not fully comparable (test methods and categories may differ).']);
  bab['8'] = tabel(['mgmt'], 6, [kol('sektor', 'Sektor', 'Sector'), kol('ambang', 'Ambang kewajiban (TOE per tahun)', 'Duty threshold (TOE per year)', { num: true, d: 0 }), kol('lapor', 'Entitas melapor 2023', 'Entities reporting 2023', { num: true, d: 0 })], [
    { sektor: T('Penyedia energi', 'Energy providers'), ambang: 6000, lapor: 114 }, { sektor: T('Industri', 'Industry'), ambang: 4000, lapor: 217 }, { sektor: T('Bangunan', 'Buildings'), ambang: 500, lapor: 79 }, { sektor: T('Transportasi', 'Transport'), ambang: 4000, lapor: 0 },
  ], ['Sebaran per provinsi tidak ditemukan di sumber; tabel ini menunjukkan sebaran per sektor. Transportasi tidak tercatat melapor pada rincian 410 entitas (114 penyedia energi, 217 industri, 79 bangunan).', 'No provincial breakdown was found; this table shows the sector split. Transport does not appear in the 410-entity breakdown (114 providers, 217 industries, 79 buildings).']);
  bab['9'] = tabel(['kabar30', 'mongabay', 'detikx', 'kompas60', 'esco'], 8, [kol('nama', 'Pelaku', 'Actor'), kol('peran', 'Peran', 'Role'), kol('rujuk', 'Dasar', 'Basis')], [
    { nama: 'Direktorat Konservasi Energi, Ditjen EBTKE, Kementerian ESDM', peran: T('Penyusun SKEM, LTHE, dan aturan manajemen energi', 'Drafts SKEM, LTHE and energy management rules'), rujuk: 'Mongabay, 30 Jun 2024; KabarBursa, 24 Apr 2026' },
    { nama: 'Balai Besar Survei dan Pengujian Ketenagalistrikan, EBTKE dan Konservasi Energi', peran: T('Pengujian dan pelaporan hasil hemat', 'Testing and savings reporting'), rujuk: 'Metro TV, 15 Mei 2024' },
    { nama: 'CLASP Asia Tenggara', peran: T('Lembaga riset efisiensi produk; survei kesadaran label', 'Product efficiency research; label awareness surveys'), rujuk: 'detikX; Mongabay' },
    { nama: 'Green Building Council Indonesia (GBCI)', peran: T('Sertifikasi Greenship bangunan hijau', 'Greenship green building certification'), rujuk: 'Kompas, 8 Mar 2023' },
    { nama: 'YLKI', peran: T('Perlindungan konsumen; menekankan sosialisasi label', 'Consumer protection; stresses label outreach'), rujuk: 'Mongabay' },
    { nama: 'GAPEL (asosiasi produsen elektronik)', peran: T('Mewakili produsen AC; menyebut biaya produksi lokal sekitar 20 persen lebih tinggi daripada impor', 'Represents AC makers; cites local production cost about 20 percent above imports'), rujuk: 'detikX' },
  ]);
  bab['10'] = tabel(['ac', 'kompas7', 'mgmt', 'esco', 'kompas60'], 8, [kol('nama', 'Program', 'Programme'), kol('rinci', 'Rincian menurut sumber', 'Detail per source'), kol('status', 'Status', 'Status')], [
    { nama: 'SKEM dan LTHE untuk AC', rinci: T('Sejak Permen ESDM 7/2015; nilai diperbarui; hemat Rp3,76 triliun, 2,6 TWh, dan 2,4 juta ton CO2 pada 2021 sampai semester I 2023 (klaim ESDM)', 'Since Energy Ministry Reg. 7/2015; values updated; saved IDR 3.76 trillion, 2.6 TWh and 2.4 million tonnes of CO2 in 2021 to H1 2023 (ministry claim)'), status: T('Berjalan', 'Running') },
    { nama: 'SKEM dan LTHE tujuh produk', rinci: T('AC, penanak nasi, kipas angin, kulkas, lampu LED, televisi, showcase', 'Air conditioners, rice cookers, fans, refrigerators, LED lamps, televisions, display coolers'), status: T('Wajib sejak 2024 menurut Kompas', 'Mandatory in 2024 per Kompas') },
    { nama: 'Manajemen energi PP 33/2023', rinci: T('410 entitas melapor 2023, hemat 10,42 juta SBM', '410 entities reported in 2023, saving 10.42 million BOE'), status: T('Berjalan', 'Running') },
    { nama: 'Studi dasar energi gedung Surabaya (SETI)', rinci: T('Studi dasar pada 295 bangunan bersama Pemkot Surabaya (ringkasan hasil pencarian atas laporan ASEAN ESCO)', 'Baseline study on 295 buildings with the Surabaya City Government (search summary of an ASEAN ESCO report)'), status: T('Studi', 'Study') },
    { nama: 'Sertifikasi bangunan hijau Greenship', rinci: T('60 bangunan bersertifikat hingga 2022: 22 platinum, 35 gold, 3 silver', '60 certified buildings to 2022: 22 platinum, 35 gold, 3 silver'), status: T('Sukarela', 'Voluntary') },
  ]);
  bab['11'] = teks(['detikx', 'esco'], [
    ['Penjualan AC Daikin 2023 menurut manajernya: 896.700 unit bintang 3, 367.500 bintang 2, 147.000 bintang 5, dan 58.800 bintang 4; bintang 4 dan 5 sekitar 14 persen (hitung sendiri, satu produsen).', 'Daikin AC sales in 2023 per its manager: 896,700 three-star, 367,500 two-star, 147,000 five-star and 58,800 four-star units; four- and five-star about 14 percent (self-calculated, one manufacturer).'],
    ['Pasar ESCO kecil: 12 ESCO terdaftar di situs pemerintah, tiga proyek ESCO baru menurut jaringan ESCO global, dan sebagian terdaftar tidak aktif (IKI, Mar 2026).', 'The ESCO market is small: 12 ESCOs listed on the government site, three new ESCO projects per the global ESCO network, and some listed firms inactive (IKI, Mar 2026).'],
  ]);
  bab['12'] = tabel(['ed'], 8, kolRegulasi, tabelRegulasi({
    'pp-33-2023': ['Konservasi energi: manajemen energi, standar dan label, sanksi (basis regulasi METI).', 'Energy conservation: energy management, standards and labels, sanctions (METI regulation base).'],
    'pp-40-2025': ['Kebijakan Energi Nasional 2025; kerangka target efisiensi dan bauran.', 'National Energy Policy 2025; framework for efficiency and mix targets.'],
    'perpres-22-2017': ['RUEN; target intensitas energi dalam rencana umum.', 'RUEN; energy intensity target within the general plan.'],
    'keppres-43-1991': ['Konservasi energi (dasar historis).', 'Energy conservation (historical basis).'],
    'inpres-9-1982': ['Konservasi energi (dasar historis).', 'Energy conservation (historical basis).'],
  }), ['Permen ESDM 14/2021 (SKEM), 8/2025, 3/2025, dan 1/2026 serta Kepmen 134/2023 disebut sumber tetapi tidak ada di basis regulasi repo, jadi tidak ditautkan.', 'Energy Ministry Regs 14/2021 (SKEM), 8/2025, 3/2025 and 1/2026 and Decree 134/2023 are cited by sources but are not in the repo regulation base, so are not linked.']);
  bab['13'] = linimasa(['mgmt', 'ac', 'detikx', 'kabar30', 'kompas60', 'metro331', 'ed'], [
    ['1982-01-01', 'Inpres 9/1982 tentang konservasi energi (tanggal tepat tidak dalam basis; tahun 1982)', 'Presidential Instruction 9/1982 on energy conservation (exact date not in the base; year 1982)', 'https://peraturan.bpk.go.id/Details/287087'],
    ['2023-06-16', 'PP 33/2023 tentang Konservasi Energi ditetapkan', 'PP 33/2023 on Energy Conservation enacted', 'https://peraturan.bpk.go.id/Details/252083'],
    ['2023-10-23', 'Keputusan Menteri ESDM menaikkan SKEM AC ke CSPF minimum 3,4 (Listrik Indonesia)', 'Energy Minister decree raises AC SKEM to a minimum CSPF of 3.4 (Listrik Indonesia)', 'https://listrikindonesia.com/detail/11935/indonesia-hemat-rp-376-triliun-tagihan-listrik-berkat-kebijakan-efisiensi-ac'],
    ['2024-02-09', 'ESDM umumkan hasil manajemen energi 2023: 10,42 juta SBM', 'Energy Ministry announces 2023 energy management results: 10.42 million BOE', 'https://www.esdm.go.id/id/media-center/arsip-berita/implementasi-manajemen-energi-tahun-2023-mampu-hemat-1042-juta-sbm-'],
    ['2024-05-15', 'Pejabat ESDM: belum ada sanksi bagi perusahaan yang gagal berhemat', 'Energy Ministry official: no sanctions yet for companies failing to save', 'https://www.metrotvnews.com/read/K5nCLggn-331-perusahaan-hemat-listrik-16-529-gwh'],
    ['2024-07-01', 'detikX: pasar AC efisien menghadapi harga, impor komponen, dan penegakan', 'detikX: the efficient AC market faces price, component imports and enforcement', 'https://news.detik.com/x/detail/spotlight/20240701/Jalan-Terjal-Menuju-Pasar-AC-Efisien/'],
    ['2026-04-24', 'Efisiensi disebut telah menekan 30 juta ton CO2 hingga awal 2026', 'Efficiency said to have cut 30 million tonnes of CO2 by early 2026', 'https://www.kabarbursa.com/carbon-trading/efisiensi-energi-tekan-emisi-30-juta-ton-jadi-andalan-capai-nze-2060.md'],
  ]);
  bab['14'] = teks(['mgmt', 'tuv', 'metro331', 'dqs', 'kabar30'], [
    ['Kewajiban: ambang 4.000 TOE (industri dan transportasi), 6.000 TOE (penyedia energi), 500 TOE (bangunan) per tahun; manajer energi, program, audit, rekomendasi, dan laporan.', 'Duties: thresholds of 4,000 TOE (industry and transport), 6,000 TOE (energy providers), 500 TOE (buildings) per year; energy manager, programme, audit, recommendations and reports.'],
    ['Insentif dan disinsentif: Permen ESDM 8/2025 disebut memuat bab pembiayaan, sertifikasi kompetensi, insentif dan disinsentif, serta pengawasan (DQS); Permen 3/2025 mewajibkan konservasi di instansi pusat dan daerah (KabarBursa).', 'Incentives and disincentives: Energy Ministry Reg. 8/2025 is said to contain chapters on financing, competence certification, incentives and disincentives and supervision (DQS); Reg. 3/2025 makes conservation mandatory in central and regional agencies (KabarBursa).'],
    ['Sanksi: TUV NORD menyebut sanksi administratif, sedangkan pejabat ESDM pada 15 Mei 2024 menyatakan belum ada sanksi. Pertentangan ini belum terselesaikan di sumber.', 'Sanctions: TUV NORD cites administrative sanctions, while an Energy Ministry official said on 15 May 2024 there were none yet. The sources leave this unresolved.'],
  ]);
  bab['15'] = langkah(['mgmt', 'tuv'], [
    ['Hitung konsumsi', 'Measure consumption', 'Bandingkan konsumsi tahunan dengan ambang TOE sektor Anda.', 'Compare annual consumption with your sector\'s TOE threshold.', 'Pengguna energi', 'Energy user'],
    ['Tunjuk manajer energi', 'Appoint an energy manager', 'Manajer energi harus bersertifikat.', 'The energy manager must be certified.', 'Pengguna energi', 'Energy user'],
    ['Susun program konservasi', 'Draw up a conservation programme', 'Program memuat sasaran dan tindakan.', 'The programme sets targets and actions.', 'Manajer energi', 'Energy manager'],
    ['Audit energi', 'Energy audit', 'Dilakukan auditor energi bersertifikat.', 'Done by a certified energy auditor.', 'Auditor', 'Auditor'],
    ['Jalankan rekomendasi dan lapor', 'Implement recommendations and report', 'Laporan pelaksanaan manajemen energi disampaikan ke pemerintah; 410 entitas melapor untuk 2023.', 'The energy management report goes to government; 410 entities reported for 2023.', 'Pengguna energi', 'Energy user'],
  ]);
  bab['17'] = teks(['iea_tr', 'meti_jp'], [
    ['Top Runner Jepang (mulai 1998 dengan 9 produk, kini sekitar dua puluhan produk menurut IEA) menetapkan target dari produk paling efisien di pasar dan mewajibkan rata-rata tertimbang tiap pabrikan melampauinya pada tahun target, termasuk importir.', 'Japan\'s Top Runner (launched 1998 with 9 products, now about two dozen per IEA) sets targets from the most efficient product on the market and requires each maker\'s weighted average to exceed it by the target year, importers included.'],
    ['Produk yang tercakup menyumbang lebih dari 70 persen listrik rumah tangga Jepang (IEA). Perbaikan AC non-saluran 32,3 persen pada FY1997 sampai FY2007 menurut lembar METI Jepang.', 'Covered products account for more than 70 percent of Japanese household electricity (IEA). Non-ducted AC improved 32.3 percent from FY1997 to FY2007 per a Japanese METI sheet.'],
  ], ['Tingkat kematangan teknologi (TRL) tidak relevan untuk kebijakan standar; bab ini memakai desain program sebagai pembanding.', 'Technology readiness (TRL) is not relevant for standards policy; this chapter uses programme design as the comparison.']);
  bab['19'] = tabel(['detikx', 'mongabay'], 6, [kol('item', 'Ukuran biaya', 'Cost measure'), kol('nilai', 'Nilai', 'Value'), kol('sumber', 'Sumber', 'Source')], [
    { item: T('Harga AC inverter bintang 4 dibanding AC biasa', '4-star inverter AC price versus standard AC'), nilai: T('35 sampai 60 persen lebih mahal (Polytron)', '35 to 60 percent higher (Polytron)'), sumber: 'detikX, 1 Jul 2024' },
    { item: T('Biaya produksi lokal dibanding impor (estimasi GAPEL)', 'Local production cost versus imports (GAPEL estimate)'), nilai: T('sekitar 20 persen lebih tinggi', 'about 20 percent higher'), sumber: 'detikX, 1 Jul 2024' },
    { item: T('Harga dan bintang (pandangan Daikin)', 'Price and stars (Daikin view)'), nilai: T('bintang lebih tinggi tidak mungkin lebih murah', 'higher stars cannot be cheaper'), sumber: 'Mongabay, 30 Jun 2024' },
    { item: T('Pandangan CLASP', 'CLASP view'), nilai: T('di luar Papua, efisiensi lebih penting daripada harga dalam pembelian AC', 'outside Papua, efficiency outranks price in AC purchases'), sumber: 'detikX, 1 Jul 2024' },
  ], ['Kurva belajar biaya produk efisien tidak ditemukan di sumber yang dibaca.', 'No learning curve for efficient product costs was found in the sources read.']);
  bab['20'] = tabel(['detikx', 'iea_tr', 'meti_jp', 'kabar30'], 6, [kol('negara', 'Negara atau kawasan', 'Country or region'), kol('instrumen', 'Instrumen', 'Instrument'), kol('nilai', 'Nilai atau capaian', 'Value or result'), kol('catatan', 'Catatan', 'Note')], [
    { negara: 'Indonesia', instrumen: 'SKEM + LTHE (AC)', nilai: T('Minimum 3,4 W per W (2023)', 'Minimum 3.4 W per W (2023)'), catatan: T('Di bawah ASEAN SKEM 2023 (3,7)', 'Below ASEAN SKEM 2023 (3.7)') },
    { negara: 'Jepang', instrumen: 'Top Runner (sejak 1998)', nilai: T('AC non-saluran +32,3 persen FY1997 sampai FY2007', 'Non-ducted AC +32.3 percent FY1997 to FY2007'), catatan: T('Tanpa larangan jual produk tak patuh', 'No ban on non-compliant products') },
    { negara: 'Singapura', instrumen: 'Standar AC', nilai: T('5,93 W per W', '5.93 W per W'), catatan: T('Menurut detikX', 'Per detikX') },
    { negara: 'Tiongkok', instrumen: 'Standar AC', nilai: T('6,1 W per W', '6.1 W per W'), catatan: T('Menurut detikX', 'Per detikX') },
    { negara: 'ASEAN', instrumen: 'SKEM regional', nilai: T('3,7 (2023); target 6,09 (2025)', '3.7 (2023); target 6.09 (2025)'), catatan: T('Target 2025 jauh di atas nilai Indonesia', 'The 2025 target is far above Indonesia\'s value') },
  ]);
  bab['21'] = teks(['ed', 'iea_tr', 'detikx', 'mongabay'], [
    hp('program standar yang berhasil menggabungkan target yang naik berkala, uji yang kredibel, dan pengawasan penjual; Jepang menetapkan target dari produk terbaik, sedangkan Indonesia menaikkan SKEM bertahap sekitar empat tahun per bintang dan hanya punya tujuh laboratorium uji.', 'successful standards programmes combine periodically rising targets, credible testing and retailer oversight; Japan sets targets from the best product, whereas Indonesia raises SKEM gradually about four years per star and has only seven test laboratories.'),
    hp('kesenjangan terbesar bukan di regulasi tetapi di sosialisasi dan penegakan: toko belum disosialisasi stiker, dan produk lama tetap boleh dijual.', 'the biggest gap is not regulation but outreach and enforcement: shops have not been briefed on stickers and old stock may still be sold.'),
  ]);
  const ii = ase.baris.find((b) => b.iso3 === 'IDN');
  bab['22'] = teks(['un_compact', 'kabar30', 'owid'], [
    ['Sasaran RUEN: intensitas energi turun 1 persen per tahun (Energy Compact RI, 2023). Pemerintah mencatat rata-rata penurunan 1,5 persen per tahun pada 2015 sampai 2021, atau 9,7 persen dari dasar 2015 (ringkasan hasil pencarian atas materi KESDM).', 'RUEN target: energy intensity down 1 percent a year (Indonesia Energy Compact, 2023). The government records an average fall of 1.5 percent a year in 2015 to 2021, or 9.7 percent from the 2015 base (search summary of Energy Ministry material).'],
    [`Target jangka panjang: intensitas energi turun 68 sampai 69 persen pada 2060 (KabarBursa). Pembanding data: intensitas karbon listrik Indonesia ${nf(ii.intensitas_karbon_gco2_kwh?.nilai ?? 0, 0)} gCO2 per kWh (${ii.intensitas_karbon_gco2_kwh?.tahun ?? '-'}, Ember lewat OWID).`, `Long-term target: energy intensity down 68 to 69 percent by 2060 (KabarBursa). Data comparison: Indonesia's electricity carbon intensity ${nfe(ii.intensitas_karbon_gco2_kwh?.nilai ?? 0, 0)} gCO2 per kWh (${ii.intensitas_karbon_gco2_kwh?.tahun ?? '-'}, Ember via OWID).`],
  ]);
  bab['23'] = teks(['esco', 'kabar30'], [
    ['Kerja sama: GIZ bersama Kementerian ESDM menargetkan efisiensi menyumbang 37 persen penurunan emisi sektor energi (judul GIZ). Kebijakan ESCO ASEAN dikaji dalam policy brief IKI (Mar 2026), yang menyarankan pembukaan gedung pemerintah bagi ESCO.', 'Cooperation: GIZ with the Energy Ministry targets efficiency supplying 37 percent of energy-sector emission cuts (GIZ headline). ASEAN ESCO policy is reviewed in an IKI policy brief (Mar 2026), which recommends opening government buildings to ESCOs.'],
  ]);
  bab['24'] = teks(['esco', 'dqs'], [
    ['Hambatan pembiayaan ESCO: ESCO kesulitan pembiayaan berbasis proyek, dan pembatasan kontrak berbasis kinerja di sektor publik menghambat pasar (IKI, Mar 2026; paparan ADB 2016).', 'ESCO financing barriers: ESCOs struggle with project-based financing, and limits on performance contracting in the public sector hold back the market (IKI, Mar 2026; ADB presentation 2016).'],
    ['Permen ESDM 8/2025 disebut memuat ketentuan pembiayaan (DQS). Nilai dana atau skema hibah efisiensi tidak ditemukan di sumber yang dibaca.', 'Energy Ministry Reg. 8/2025 is said to contain financing provisions (DQS). Fund sizes or efficiency grant schemes were not found in the sources read.'],
  ]);
  bab['25'] = rumus(['ed', 'ac'], [
    ['Hemat tahunan (Rp) = Energi dihemat (kWh) x Tarif (Rp per kWh)', 'Annual saving (IDR) = Energy saved (kWh) x Tariff (IDR per kWh)'],
    ['Tarif tersirat (Rp per kWh) = Hemat tagihan / Energi dihemat', 'Implied tariff (IDR per kWh) = Bill saving / Energy saved'],
  ], [['Klaim ESDM: hemat Rp3,76 triliun untuk 2,6 TWh (2.600 GWh) = Rp1.446 per kWh tersirat (EST; angka gabungan 2021 sampai semester I 2023, bukan tarif resmi).', 'Ministry claim: IDR 3.76 trillion saved for 2.6 TWh (2,600 GWh) = implied IDR 1,446 per kWh (EST; combined 2021 to H1 2023 figure, not an official tariff).']]);
  bab['27'] = teks(['mongabay', 'kabar30'], [
    ['CLASP menyatakan penggunaan alat hemat energi bisa mengurangi hampir 40 persen emisi karbon, dan beralih ke bintang 3 sampai 5 bisa memangkas 63 persen (Mongabay, 30 Jun 2024). KESDM menargetkan 358 juta ton CO2 hingga 2030 dengan 132,25 juta ton dari efisiensi.', 'CLASP says efficient appliances can cut almost 40 percent of carbon emissions, and moving to 3 to 5 stars can cut 63 percent (Mongabay, 30 Jun 2024). The ministry targets 358 million tonnes of CO2 by 2030, 132.25 million tonnes of it from efficiency.'],
  ]);
  bab['28'] = teks(['mgmt', 'detikx'], [
    ['PP 33/2023 menuntut manajer energi dan auditor energi bersertifikat; jumlah tenaga bersertifikat dan lembaga sertifikasinya tidak ditemukan di sumber yang dibaca. Hanya tujuh laboratorium uji tersedia untuk SKEM AC.', 'PP 33/2023 requires certified energy managers and auditors; the number of certified people and certifying bodies was not found in the sources read. Only seven test laboratories are available for AC SKEM.'],
  ]);
  bab['29'] = teks(['detikx', 'dumping', 'metro331', 'tuv'], [
    ['Penegakan: pemerintah menyatakan tidak dapat menarik produk yang sudah beredar dan pengawasan memakai kode produksi (detikX; Mongabay). Pejabat ESDM menyatakan belum ada sanksi pada 15 Mei 2024, sementara TUV NORD menyebut ada sanksi administratif.', 'Enforcement: the government says it cannot recall products already in circulation and checks production codes (detikX; Mongabay). An Energy Ministry official said there were no sanctions on 15 May 2024, while TUV NORD cites administrative sanctions.'],
    ['Harga: produsen menyebut AC bintang tinggi lebih mahal, sedangkan CLASP berpendapat daya beli bukan hambatan utama karena produsen menawarkan sebagian besar produk berefisiensi rendah. Kontan memuat dugaan praktik dumping AC (hanya judul dibaca).', 'Price: manufacturers say high-star ACs cost more, while CLASP argues purchasing power is not the main barrier since makers offer mostly low-efficiency products. Kontan carried an alleged AC dumping story (headline only).'],
  ]);
  bab['30'] = tabel(['kabar30', 'un_compact'], 8, [kol('item', 'Sasaran', 'Target'), kol('nilai', 'Nilai', 'Value'), kol('tahun', 'Tahun', 'Year')], [
    { item: T('Penurunan emisi total (NDC)', 'Total emission reduction (NDC)'), nilai: '358 juta ton CO2e', tahun: '2030' },
    { item: T('Emisi sektor energi ditahan pada', 'Energy sector emissions held to'), nilai: '129 juta ton CO2e', tahun: '2030' },
    { item: T('Puncak emisi sektor energi', 'Energy sector emission peak'), nilai: '-', tahun: '2035' },
    { item: T('Penurunan intensitas energi', 'Energy intensity reduction'), nilai: T('68 sampai 69 persen', '68 to 69 percent'), tahun: '2060' },
    { item: T('Porsi EBT dalam bauran', 'Renewables share of the mix'), nilai: T('70 sampai 72 persen', '70 to 72 percent'), tahun: '2060' },
    { item: T('Laju RUEN', 'RUEN rate'), nilai: T('1 persen per tahun', '1 percent a year'), tahun: '-' },
  ]);
  bab['31'] = teks(['ed'], [
    hp('pengembang dan pemasok: AC, motor, dan pencahayaan berefisiensi tinggi menghadapi permintaan yang tumbuh seiring naiknya SKEM; produsen lokal perlu menurunkan biaya sekitar 20 persen yang disebut GAPEL.', 'developers and suppliers: high-efficiency AC, motors and lighting face demand that grows as SKEM rises; local makers need to close the roughly 20 percent cost gap GAPEL cites.'),
    hp('ESCO dan investor: buka gedung pemerintah dengan kontrak berbasis kinerja; pemda dan akademisi: data dasar gedung seperti studi 295 bangunan Surabaya.', 'ESCOs and investors: open government buildings with performance contracts; local governments and academics: baseline building data like the 295-building Surabaya study.'),
  ]);
  bab['32'] = teks(['kabar30', 'metro331', 'esco'], [
    ['Penegakan sanksi manajemen energi, jumlah entitas pelapor untuk 2024 dan 2025, dan angka penghematan terbaru dari ESDM.', 'Enforcement of energy management sanctions, the number of reporting entities for 2024 and 2025 and new savings figures from the ministry.'],
    ['Pelaksanaan Permen ESDM 8/2025, 3/2025, dan 1/2026 (standardisasi ESCO), serta jumlah ESCO aktif.', 'Implementation of Energy Ministry Regs 8/2025, 3/2025 and 1/2026 (ESCO standardisation) and the number of active ESCOs.'],
    ['Revisi SKEM AC berikutnya (pemerintah berencana meninjau tiap tiga tahun dengan masa adaptasi industri satu tahun).', 'The next AC SKEM revision (the government plans reviews every three years with a one-year industry adaptation period).'],
  ]);
  bab['36'] = tabel(['mgmt', 'esco', 'iea_tr'], 6, [kol('judul', 'Dokumen', 'Document', { url: 'url' }), kol('penerbit', 'Penerbit', 'Publisher'), kol('mengapa', 'Mengapa dibaca', 'Why read it')], [
    { judul: 'Implementasi Manajemen Energi 2023', penerbit: 'Kementerian ESDM', url: SUMBER.mgmt.url, mengapa: T('Angka hemat resmi per sektor', 'Official savings per sector') },
    { judul: 'Enabling ESCO Market in ASEAN for Low Carbon Buildings', penerbit: 'IKI', url: SUMBER.esco.url, mengapa: T('Hambatan pasar ESCO dan rekomendasi', 'ESCO market barriers and recommendations') },
    { judul: 'Top Runner Programme', penerbit: 'IEA', url: SUMBER.iea_tr.url, mengapa: T('Desain program standar Jepang', 'Design of the Japanese standards programme') },
  ]);
  bab['38'] = teks(['ed', 'mgmt', 'detikx'], [
    ['Sumber: siaran pers ESDM, media nasional (detikX, Mongabay, Kompas, Metro TV, KabarBursa), basis data kebijakan IEA, dan kajian IKI, dibaca 8 Nov 2026. Beberapa halaman menolak baca penuh; angka dari ringkasan hasil pencarian diberi catatan.', 'Sources: Energy Ministry release, national media (detikX, Mongabay, Kompas, Metro TV, KabarBursa), the IEA policy database and an IKI study, read on 8 Nov 2026. Some pages refused full reads; figures from search summaries are noted.'],
    ['Batas: tidak ada data intensitas energi tahunan terbaru, jumlah auditor bersertifikat, atau pasar nasional AC berbintang; tabel Daikin hanya satu produsen. EST berarti hitung sendiri; Hipotesis berarti sintesis METI.', 'Limits: no recent annual energy intensity data, number of certified auditors or national star-rated AC market; the Daikin table covers one maker only. EST means self-derived; Hypothesis means METI synthesis.'],
  ]);

  bab['39'] = { tipe: 'kasus', sumber: ['ac', 'iea_tr', 'meti_jp', 'mgmt', 'detikx'], catatan: T('Kasus luar negeri hanya Top Runner Jepang. Kasus ESCO berhasil di Indonesia tidak ditemukan di sumber.', 'The only foreign case is Japan\'s Top Runner. No successful ESCO case in Indonesia was found in the sources.'), butir: [
    kas({ id: 'skem-ac', nama: 'SKEM dan LTHE AC di Indonesia', jenis: 'berhasil', negara: 'ID', lokasi: ['Nasional', 'National'],
      profil: [['Dasar', 'Basis', 'Permen ESDM 7/2015, diperbarui', null], ['Nilai minimum terbaru', 'Latest minimum', '3,4 W per W (CSPF), keputusan 23 Okt 2023', null]],
      tindakan: [['Menetapkan nilai minimum dan label bintang, lalu menaikkan nilai secara bertahap.', 'Set a minimum value and star label, then raised the value in steps.']],
      sebab: [['Standar wajib yang naik berkala menggeser pasar ke produk lebih hemat (klaim ESDM; belum diaudit pihak independen).', 'A mandatory standard that rises periodically shifts the market toward more efficient products (ministry claim; not independently audited).']],
      angka: [['Hemat tagihan listrik 2021 sampai semester I 2023', 'Electricity bill saving 2021 to H1 2023', 3.76, 2, 'triliun Rp', 'ac', false], ['Energi dihemat', 'Energy saved', 2.6, 1, 'TWh', 'ac', false], ['Emisi terhindar', 'Emissions avoided', 2.4, 1, 'juta ton CO2', 'ac', false]],
      pelajaran: [['Standar minimum membawa hasil terukur walau nilainya masih di bawah ASEAN.', 'A minimum standard brings measurable results even though its value is still below ASEAN.']],
      kronologi: [['2015-01-01', 'Penerapan MEPS AC lewat Permen ESDM 7/2015 (tahun 2015).', 'AC MEPS introduced via Energy Ministry Reg. 7/2015 (year 2015).'], ['2023-10-23', 'Nilai SKEM naik ke CSPF 3,4.', 'SKEM value raised to CSPF 3.4.']],
      faktor: { standar_wajib: true, pengujian: true, sosialisasi: false }, sumber: ['ac', 'detikx'] }),
    kas({ id: 'manajemen-energi', nama: 'Manajemen energi wajib PP 33/2023 (hasil 2023)', jenis: 'berhasil', negara: 'ID', lokasi: ['Nasional', 'National'],
      profil: [['Entitas melapor', 'Reporting entities', 410, null], ['Rincian', 'Breakdown', ['114 penyedia energi, 217 industri, 79 bangunan', '114 energy providers, 217 industries, 79 buildings'], null]],
      tindakan: [['Pengguna energi besar menunjuk manajer, mengaudit, dan melapor.', 'Large energy users appointed managers, audited and reported.']],
      sebab: [['Kewajiban berbasis ambang TOE dan pelaporan tahunan ke ESDM.', 'A duty based on TOE thresholds and annual reporting to the ministry.']],
      angka: [['Energi dihemat', 'Energy saved', 10.42, 2, 'juta SBM', 'mgmt', false], ['Pangsa dari konsumsi', 'Share of consumption', 1.73, 2, 'persen', 'mgmt', false], ['Emisi terhindar', 'Emissions avoided', 8.42, 2, 'juta tCO2e', 'mgmt', false]],
      pelajaran: [['Pelaporan terbukti berjalan, tetapi tanpa penegakan, cakupan tetap bergantung pada kemauan perusahaan.', 'Reporting works, but without enforcement coverage still depends on company willingness.']],
      kronologi: [['2023-06-16', 'PP 33/2023 ditetapkan.', 'PP 33/2023 enacted.'], ['2024-02-09', 'ESDM umumkan hasil 2023.', 'Ministry announces 2023 results.']],
      faktor: { standar_wajib: true, pengujian: false, sosialisasi: true }, sumber: ['mgmt', 'pp33'] }),
    kas({ id: 'top-runner', nama: 'Top Runner Jepang', jenis: 'berhasil', negara: 'JP', lokasi: ['Jepang', 'Japan'],
      profil: [['Mulai', 'Start', 1998, null], ['Produk awal', 'Initial products', 9, null], ['Pangsa listrik rumah tangga yang tercakup', 'Share of household electricity covered', 'lebih dari 70 persen', null]],
      tindakan: [['Menetapkan target dari produk terbaik di pasar dan menuntut rata-rata tertimbang pabrikan melampauinya pada tahun target.', 'Set targets from the best product on the market and required each maker\'s weighted average to beat it by the target year.']],
      sebab: [['Target dinamis berbasis produk terbaik, berlaku juga bagi importir, dan didukung Energy Efficiency Act (IEA).', 'Dynamic targets based on the best product, applied to importers too, backed by the Energy Efficiency Act (IEA).']],
      angka: [['Perbaikan AC non-saluran FY1997 sampai FY2007', 'Non-ducted AC improvement FY1997 to FY2007', 32.3, 1, 'persen', 'meti_jp', false]],
      pelajaran: [['Target yang digerakkan pasar mendorong inovasi tanpa melarang produk lama.', 'Market-driven targets spur innovation without banning old products.']],
      kronologi: [['1998-01-01', 'Program dimulai dengan 9 produk (tahun 1998; sumber metadata menyebut 1999).', 'Programme starts with 9 products (year 1998; source metadata says 1999).']],
      faktor: { standar_wajib: true, pengujian: true, sosialisasi: true }, sumber: ['iea_tr', 'meti_jp'] }),
  ] };
  bab['40'] = { tipe: 'kasus', sumber: ['mongabay', 'detikx', 'metro331', 'esco'], catatan: T('Hak jawab: pihak yang disebut dapat mengirim koreksi lewat formulir koreksi platform. Tidak ditemukan kasus efisiensi gagal di luar negeri yang bersumber.', 'Right of reply: named parties can send corrections through the platform correction form. No sourced failed efficiency case abroad was found.'), butir: [
    kas({ id: 'label-sosialisasi', nama: 'Label SKEM dan LTHE yang minim sosialisasi', jenis: 'gagal', negara: 'ID', lokasi: ['Nasional (liputan Kota Padang)', 'National (Padang city coverage)'],
      sebab: [['Toko belum disosialisasi aturan stiker; pembeli memilih menurut merek atau barang bekas; hanya 6,5 persen orang mengenal SKEM dan LTHE (survei CLASP 2020 via detikX); produk lama yang beredar tetap boleh dijual.', 'Shops were not briefed on sticker rules; buyers choose by brand or second-hand; only 6.5 percent of people know SKEM and LTHE (CLASP 2020 survey via detikX); older stock may still be sold.']],
      angka: [['Pengenal label (survei CLASP 2020)', 'Label awareness (CLASP 2020 survey)', 6.5, 1, 'persen', 'detikx', false], ['Rumah tangga memiliki AC (CLASP 2020)', 'Households owning an AC (CLASP 2020)', 5, 0, 'persen', 'detikx', false]],
      kronologi: [['2024-06-30', 'Mongabay melaporkan sosialisasi minim di Padang.', 'Mongabay reports minimal outreach in Padang.'], ['2024-07-01', 'detikX memuat kendala pasar AC efisien.', 'detikX carries the efficient AC market obstacles.']],
      terdampak: ['Konsumen yang tidak dapat membandingkan efisiensi dan produsen produk efisien.', 'Consumers unable to compare efficiency and makers of efficient products.'],
      seharusnya: ['sosialisasi stiker kepada toko dan konsumen dengan Kementerian UMKM dan YLKI, ditambah pemeriksaan di titik jual.', 'outreach on stickers to shops and consumers with the SME ministry and YLKI, plus checks at the point of sale.'],
      tanda: [['Penjual belum pernah menerima penjelasan aturan', 'Sellers have never received the rules'], ['Konsumen memilih terutama menurut merek', 'Consumers choose mainly by brand']],
      faktor: { sosialisasi: false, standar_wajib: true, pengujian: false }, sumber: ['mongabay', 'detikx'] }),
    kas({ id: 'esco-publik', nama: 'Pasar ESCO dan kontrak kinerja gedung pemerintah', jenis: 'mangkrak', negara: 'ID', lokasi: ['Nasional', 'National'],
      sebab: [['Pembatasan kontrak berbasis kinerja di sektor publik dan pembiayaan berbasis proyek yang terbatas menghambat pasar; sebagian ESCO terdaftar tidak aktif (IKI, Mar 2026).', 'Limits on performance contracting in the public sector and scarce project-based financing hold back the market; some listed ESCOs are inactive (IKI, Mar 2026).']],
      angka: [['ESCO terdaftar', 'Listed ESCOs', 12, 0, 'perusahaan', 'esco', false], ['Proyek ESCO baru (jaringan ESCO global)', 'New ESCO projects (global ESCO network)', 3, 0, 'proyek', 'esco', false]],
      kronologi: [['2016-04-01', 'Paparan ADB mencatat batas kontrak multitahun, prosedur pengadaan, dan disinsentif anggaran (April 2016).', 'An ADB presentation notes multi-year contract limits, procurement procedures and budget disincentives (April 2016).'], ['2026-03-03', 'Policy brief IKI: pasar ESCO ASEAN, termasuk Indonesia, masih kecil.', 'IKI policy brief: the ASEAN ESCO market, Indonesia included, is still small.']],
      terdampak: ['Pemilik gedung pemerintah yang tidak menikmati penghematan tanpa anggaran muka, dan ESCO.', 'Government building owners who cannot capture savings without upfront budget, and ESCOs.'],
      seharusnya: ['ubah aturan agar ESCO dapat menjalankan proyek di gedung pemerintah dan sediakan pembiayaan berbasis proyek.', 'amend rules so ESCOs can deliver projects in government facilities and provide project-based financing.'],
      tanda: [['Kontrak kinerja multitahun dilarang oleh aturan anggaran', 'Multi-year performance contracts barred by budget rules'], ['Banyak ESCO terdaftar, sedikit proyek', 'Many listed ESCOs, few projects']],
      faktor: { pendanaan: false, regulasi_kontrak: false }, sumber: ['esco'] }),
    kas({ id: 'sanksi-manajemen', nama: 'Manajemen energi tanpa sanksi tegas', jenis: 'mundur', negara: 'ID', lokasi: ['Nasional', 'National'],
      sebab: [['Pada Mei 2024 pejabat ESDM menyatakan belum ada sanksi bagi perusahaan yang gagal menghemat dan prioritas masih penyadaran; sumber lain menyebut sanksi administratif ada dalam aturan.', 'In May 2024 an Energy Ministry official said no sanctions existed for companies failing to save and awareness was the priority; another source says administrative sanctions exist in the rules.']],
      angka: [['Perusahaan melapor hemat listrik 2023', 'Companies reporting electricity savings 2023', 331, 0, 'perusahaan', 'metro331', false], ['Listrik dihemat', 'Electricity saved', 16529, 0, 'GWh', 'metro331', false]],
      kronologi: [['2023-06-16', 'PP 33/2023 ditetapkan.', 'PP 33/2023 enacted.'], ['2024-05-15', 'Pejabat ESDM: belum ada sanksinya.', 'Ministry official: no sanctions yet.']],
      terdampak: ['Perusahaan yang patuh menanggung biaya yang tidak ditanggung pesaing yang tidak patuh.', 'Compliant firms bear costs that non-compliant competitors avoid.'],
      seharusnya: ['umumkan jadwal penegakan dan daftar entitas yang belum melapor agar kewajiban berlaku nyata.', 'announce an enforcement schedule and a list of entities that have not reported so the duty has real force.'],
      tanda: [['Pejabat menyatakan prioritas penyadaran, bukan penegakan', 'Officials state awareness rather than enforcement as the priority'], ['Cakupan pelapor jauh di bawah potensi pengguna besar', 'Reporter coverage far below the large-user potential']],
      faktor: { standar_wajib: false, sosialisasi: true }, sumber: ['metro331', 'tuv', 'pp33'] }),
  ] };
  bab['41'] = { tipe: 'pola', sumber: ['ed'], catatan: T('Sel dibangun dari bendera faktor tiap kasus; pemetaan adalah analisis METI (Hipotesis) atas fakta di bab 39 dan 40.', 'Cells are built from case factor flags; the mapping is METI analysis (Hypothesis) of facts in chapters 39 and 40.'),
    faktor: [L('standar_wajib', 'Standar atau kewajiban yang ditegakkan', 'Enforced standard or duty'), L('pengujian', 'Pengujian dan laboratorium memadai', 'Adequate testing and labs'), L('sosialisasi', 'Sosialisasi ke penjual dan pengguna', 'Outreach to sellers and users'), L('pendanaan', 'Pembiayaan proyek efisiensi', 'Efficiency project financing'), L('regulasi_kontrak', 'Aturan kontrak yang mendukung ESCO', 'Contract rules that support ESCOs')] };
  const d = (peran, tahap, id, en, s) => ({ peran, tahap, teks: T(id, en), dasar: s });
  bab['42'] = { tipe: 'periksa', sumber: ['ed'],
    peran: [L('pengembang', 'Pengguna energi dan pengembang', 'Energy users and developers'), L('investor', 'Investor dan ESCO', 'Investors and ESCOs'), L('pemda', 'Pemerintah daerah', 'Local government'), L('pusat', 'Pemerintah pusat', 'Central government'), L('pln', 'PLN', 'PLN'), L('meti', 'METI', 'METI')],
    tahap: [L('lokasi', 'Penilaian awal', 'Initial assessment'), L('izin', 'Kepatuhan', 'Compliance'), L('ppa', 'Kontrak', 'Contracting'), L('dana', 'Pendanaan', 'Financing'), L('bangun', 'Pelaksanaan', 'Implementation'), L('operasi', 'Pemantauan', 'Monitoring')],
    butir: [
      d('pengembang', 'lokasi', 'Hitung konsumsi tahunan terhadap ambang 500, 4.000, atau 6.000 TOE sesuai sektor.', 'Compare annual consumption with the 500, 4,000 or 6,000 TOE threshold for your sector.', 'mgmt'),
      d('pengembang', 'izin', 'Tunjuk manajer energi bersertifikat, jalankan audit, dan lapor tiap tahun.', 'Appoint a certified energy manager, run the audit and report each year.', 'tuv'),
      d('pengembang', 'bangun', 'Pilih peralatan yang jauh di atas SKEM minimum, bukan hanya yang lolos.', 'Choose equipment well above the SKEM minimum, not merely compliant.', 'detikx'),
      d('investor', 'ppa', 'Pastikan kontrak kinerja dapat dijalankan pada gedung pemerintah sebelum menawar.', 'Confirm performance contracts can be run at government buildings before bidding.', 'esco'),
      d('investor', 'dana', 'Siapkan skema pembiayaan berbasis proyek untuk ESCO yang dibayar dari penghematan.', 'Prepare project-based financing for ESCOs paid from savings.', 'esco'),
      d('pemda', 'izin', 'Terapkan konservasi energi di kantor daerah menurut Permen ESDM 3/2025.', 'Apply energy conservation in regional offices under Energy Ministry Reg. 3/2025.', 'kabar30'),
      d('pusat', 'operasi', 'Umumkan jadwal penegakan sanksi dan daftar entitas pelapor.', 'Announce an enforcement schedule and the list of reporting entities.', 'metro331'),
      d('pusat', 'lokasi', 'Sosialisasikan stiker SKEM dan LTHE kepada toko dan konsumen.', 'Brief shops and consumers on SKEM and LTHE stickers.', 'mongabay'),
      d('pln', 'operasi', 'Bagikan data konsumsi pelanggan besar kepada auditor dengan persetujuan pelanggan.', 'Share large customer consumption data with auditors with customer consent.', 'ed'),
      d('meti', 'operasi', 'Pantau jumlah ESCO aktif dan hasil hemat, dan beri hak jawab bagi pihak yang disebut.', 'Track active ESCOs and savings results, and give named parties a right of reply.', 'esco'),
    ] };

  return rakit({ id: 'efisiensi', judul: ['Efisiensi energi', 'Energy efficiency'],
    lead: ['Manajemen energi wajib (PP 33/2023), SKEM dan label hemat energi, ESCO, bangunan hijau, dan Top Runner Jepang: angka resmi, hambatan penegakan, dan pelajaran dari kasus berhasil dan gagal.', 'Mandatory energy management (PP 33/2023), minimum standards and energy labels, ESCOs, green buildings and Japan\'s Top Runner: official figures, enforcement obstacles and lessons from successes and failures.'],
    kunci: [
      kunci('Energi dihemat manajemen energi 2023', 'Energy saved by energy management 2023', 10.42, 2, 'juta SBM', 'million BOE', 'mgmt'),
      kunci('Pangsa hemat dari konsumsi dasar 602 juta SBM', 'Saving as share of the 602 million BOE base', 1.73, 2, 'persen', 'percent', 'mgmt'),
      kunci('Entitas yang melapor manajemen energi 2023', 'Entities reporting energy management 2023', 410, 0, 'entitas', 'entities', 'mgmt'),
      kunci('Hemat tagihan listrik berkat SKEM AC, 2021 sampai semester I 2023', 'Electricity bills saved by AC SKEM, 2021 to H1 2023', 3.76, 2, 'triliun Rp', 'IDR trillion', 'ac'),
      kunci('Emisi ditekan kebijakan efisiensi sampai awal 2026', 'Emissions cut by efficiency policy to early 2026', 30, 0, 'juta ton CO2', 'million tonnes CO2', 'kabar30'),
    ],
    penting: [
      ['Manajemen energi 2023 menghemat 10,42 juta SBM (1,73 persen) dari 410 entitas; sanksi belum ditegakkan menurut pejabat ESDM (Mei 2024).', 'Energy management in 2023 saved 10.42 million BOE (1.73 percent) from 410 entities; sanctions were not yet enforced per a ministry official (May 2024).'],
      ['SKEM AC Indonesia (CSPF 3,4) masih di bawah ASEAN 2023 (3,7) dan jauh dari target 2025 (6,09); label dikenal hanya 6,5 persen orang.', 'Indonesia\'s AC SKEM (CSPF 3.4) is still below ASEAN 2023 (3.7) and far from the 2025 target (6.09); only 6.5 percent of people know the label.'],
      ['Pasar ESCO kecil (12 terdaftar, 3 proyek baru) karena kontrak kinerja sektor publik terhambat.', 'The ESCO market is small (12 listed, 3 new projects) because public-sector performance contracting is constrained.'],
    ],
    posisi: ['Standar AC Indonesia (3,4 W per W) berada di bawah Singapura (5,93) dan Tiongkok (6,1), sehingga ruang efisiensi masih besar.', 'Indonesia\'s AC standard (3.4 W per W) is below Singapore (5.93) and China (6.1), so the efficiency headroom is large.'],
    sumber: SUMBER, bab });
}

export function susun() { return dalam(susunAsal()); }
export const validasi = val;
export const selftest = () => st(susun);
jalankan(import.meta.url, 'efisiensi', susun);
