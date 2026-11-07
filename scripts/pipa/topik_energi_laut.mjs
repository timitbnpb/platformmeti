#!/usr/bin/env node
// Naskah topik Energi laut (arus, gelombang, panas laut/OTEC) -> public/data/topik/energi_laut.json (TOPIK-SKEMA.md).
// Catatan: id topik "energi-laut" belum terdaftar di ui.json/indeks.json/topik_bangun.mjs (berkas cetakan, bukan milik pengerja ini).
// Pakai: node scripts/pipa/topik_energi_laut.mjs [--selftest]
import { dalam } from './topik_energi_laut_dalam.mjs';
import { T, hp, S, ED, baca, regS, nf, nfe, SPUBFIN, teks, faq, glos, rumus, langkah, tabel, grafik, linimasa, kol, L, kunci, kas, rakit, selftest as st, jalankan, tabelRegulasi, kolRegulasi, validasi as val } from './topik_enam_lib.mjs';
import { tambahJalanModel } from './topik_jalan_lib.mjs';

const kh = baca('public/data/keuangan_hijau.json');
const marine = kh.investasi_publik.filter((r) => r.teknologi === 'Marine energy');
if (marine.length !== 1) throw new Error('data Marine energy berubah, tinjau ulang naskah');
const dana = marine[0];
export const SUMBER = {
  ed: ED, pubfin: SPUBFIN, uu30: regS('uu-30-2009'), p112: regS('perpres-112-2022'), ken: regS('pp-40-2025'),
  pot63: S('Kementerian ESDM Paparkan Peluang Implementasi Energi Laut, Simak Rinciannya (potensi praktis 63 GW: arus 20,01 GW, gelombang 1,99 GW, panas laut 41 GW; studi 2022; angka dari ringkasan hasil pencarian)', 'Investortrust', 'https://investortrust.id/esg/11088/kementerian-esdm-paparkan-peluang-implementasi-energi-laut-simak-rinciannya', '2026-11-08', 2022, 'media'),
  esdm_arus: S('Energi Arus Laut Sangat Potensial Dikembangkan di Indonesia (kecepatan arus 0,6 sampai 3,5 m/s; di atas 2 m/s di Selat Pantar, Lombok, Toyapakeh, Larantuka, Alas, Molo, Sunda, Boleng; dari ringkasan hasil pencarian)', 'Kementerian ESDM', 'https://www.esdm.go.id/en/media-center/news-archives/energi-arus-laut-sangat-potensial-dikembangkan-di-indonesia', '2026-11-08', 2018, 'resmi'),
  pantar: S('ESDM Lirik Selat Pantar NTT untuk Pengembangan Pembangkit Listrik Tenaga Arus Laut (20 Okt 2020; hanya judul dibaca)', 'Kementerian ESDM', 'https://www.esdm.go.id/id/berita-unit/direktorat-jenderal-ebtke/esdm-lirik-selat-pantar-ntt-untuk-pengembangan-pembangkit-listrik-tenaga-arus-laut-1', '2026-11-08', 2020, 'resmi'),
  lar18: S('Tinjau Lokasi Pembangunan Pembangkit Arus Laut di Selat Larantuka (1 Apr 2018; kunjungan Menteri ESDM 31 Mar 2018)', 'Kementerian ESDM', 'https://www.esdm.go.id/en/media-center/news-archives/tinjau-lokasi-pembangunan-pembangkit-arus-laut-di-selat-larantuka-menteri-esdm-pertama-di-indonesia-terbesar-di-dunia', '2026-11-08', 2018, 'resmi'),
  bis18: S('Proyek Pembangkit Arus Laut di Larantuka, Flores Segera Direalisasikan (1 Apr 2018; hanya judul dibaca)', 'Bisnis.com', 'https://ekonomi.bisnis.com/read/20180401/44/778722/proyek-pembangkit-arus-laut-di-larantuka-flores-segera-direalisasikan', '2026-11-08', 2018, 'media'),
  rup22: S('Kementerian ESDM Ungkap Rencana Pembangkit Listrik Energi Laut (PLTAL Selat Alas 10 MW dan Selat Lombok 10 MW dalam daftar potensi RUPTL, bersama Selat Bali dan Larantuka; dari ringkasan hasil pencarian)', 'Listrik Indonesia', 'https://listrikindonesia.com/detail/14190/kementerian-esdm-ungkap-rencana-pembangkit-listrik-energi-laut', '2026-11-08', 2022, 'media'),
  jp28: S('RI to start operating first ocean power plant in 2028 (16 Jun 2025; siaran Kementerian ESDM 16 Jun 2025)', 'The Jakarta Post', 'https://www.thejakartapost.com/business/2025/06/16/ri-to-start-operating-first-ocean-power-plant-in-2028.html', '2026-11-08', 2025, 'media'),
  otec17: S('Menakjubkan, Potensi Energi Panas Laut Indonesia Terbesar di Dunia (26 Sep 2017; PPPGL meneliti 17 lokasi, total 41 GW; dari ringkasan hasil pencarian)', 'Good News from Indonesia', 'https://www.goodnewsfromindonesia.id/2017/09/26/menakjubkan-potensi-energi-panas-laut-indonesia-terbesar-di-dunia', '2026-11-08', 2017, 'media'),
  tud: S('Upscaling scenarios for ocean thermal energy conversion with technological learning in Indonesia (hingga 45 GW; 22 persen kebutuhan nasional pada 2050; dari ringkasan hasil pencarian)', 'TU Delft (jurnal Renewable and Sustainable Energy Reviews, 2022)', 'https://research.tudelft.nl/en/publications/upscaling-scenarios-for-ocean-thermal-energy-conversion-with-tech', '2026-11-08', 2022, 'kajian'),
  mey_wiki: S('MeyGen (Phase 1A: 4 x 1,5 MW; keluaran bersih 10,2 GWh pada 2023; kumulatif 51 GWh Mar 2023; tapak berizin hingga 398 MW; tambahan 9 MW CfD AR6 Sep 2024; dari ringkasan hasil pencarian)', 'Wikipedia', 'https://en.wikipedia.org/wiki/MeyGen', '2026-11-08', 2025, 'via-pihak-ketiga', 'CC BY-SA 4.0'),
  mey_ops: S('Record-breaking MeyGen enters 25-year operations phase', 'Offshore Energy', 'https://offshore-energy.biz/?p=42434', '2026-11-08', 2022, 'media'),
  kwater: S('Sihwa Tidal Power Plant (254 MW: 10 turbin x 25,4 MW, 8 pintu air; 552,7 GWh per tahun; biaya USD 355,1 juta menurut K-water)', 'K-water (Korea Water Resources Corporation)', 'https://www.kwater.or.kr/eng/busi/project03Page.do?s_mid=1192', '2026-11-08', 2024, 'resmi'),
  sihwa_wiki: S('Sihwa Lake Tidal Power Station (biaya USD 560 juta dan operasi 2012 menurut Wikipedia; berbeda dengan K-water)', 'Wikipedia', 'https://en.wikipedia.org/wiki/Sihwa_Lake_Tidal_Power_Station', '2026-11-08', 2025, 'via-pihak-ketiga', 'CC BY-SA 4.0'),
  tethys: S('Sihwa Tidal Power Plant (konstruksi selesai 2011, operasi mulai Agustus 2011 menurut entri ini)', 'Tethys, Pacific Northwest National Laboratory', 'https://tethys.pnnl.gov/project-sites/sihwa-tidal-power-plant', '2026-11-08', 2024, 'kajian'),
};
const cfMey = Math.round((10.2 / (6 * 8.76)) * 1000) / 10;
const cfSihwa = Math.round((552.7 / (254 * 8.76)) * 1000) / 10;
const pArus = Math.round(0.5 * 1025 * Math.PI * 8 * 8 * 27 * 0.4) / 1e6;

function susunAsal() {
  const bab = {};
  bab['2'] = faq(['pot63', 'jp28', 'esdm_arus'], [
    ['Apa saja jenis energi laut?', 'What types of ocean energy are there?', 'Arus pasang surut (tidal stream), gelombang, dan panas laut (OTEC). Studi 2022 yang dikutip ESDM menaksir potensi praktis 63 GW: arus 20,01 GW, gelombang 1,99 GW, panas laut 41 GW.', 'Tidal stream, waves and ocean thermal energy (OTEC). A 2022 study cited by the ministry puts practical potential at 63 GW: currents 20.01 GW, waves 1.99 GW, thermal 41 GW.'],
    ['Apakah sudah ada pembangkit laut komersial di Indonesia?', 'Is there a commercial ocean plant in Indonesia?', 'Belum. Kementerian ESDM menyatakan pembangkit arus laut pertama (40 MW, dua fase 20 MW di NTT dan NTB) ditargetkan beroperasi 2028 dan masih tahap pra-konstruksi (16 Jun 2025).', 'Not yet. The Energy Ministry says the first tidal plant (40 MW, two 20 MW phases in NTT and NTB) is targeted for 2028 and is still pre-construction (16 Jun 2025).'],
    ['Di mana arusnya cukup kuat?', 'Where are currents strong enough?', 'ESDM menyebut kecepatan 0,6 sampai 3,5 m/s dan lebih dari 2 m/s di Selat Pantar, Lombok, Toyapakeh, Larantuka, Alas, Molo, Sunda, dan Boleng.', 'The ministry cites speeds of 0.6 to 3.5 m/s and above 2 m/s in the Pantar, Lombok, Toyapakeh, Larantuka, Alas, Molo, Sunda and Boleng straits.'],
    ['Berapa nilai proyek 40 MW itu?', 'What is the 40 MW project worth?', 'Sekitar USD 220 juta menurut siaran ESDM (via Jakarta Post).', 'About USD 220 million per the ministry statement (via the Jakarta Post).'],
    ['Siapa mitranya?', 'Who are the partners?', 'SBS Indonesia (kontraktor lokal), Tidal Bridge (Belanda), Nova Innovation (Skotlandia), dan Pertamina Power Indonesia.', 'SBS Indonesia (local contractor), Tidal Bridge (Netherlands), Nova Innovation (Scotland) and Pertamina Power Indonesia.'],
    ['Apa itu OTEC?', 'What is OTEC?', 'Pembangkit yang memanfaatkan selisih suhu air laut permukaan dan dalam; PPPGL menyebut 41 GW di 17 lokasi (2017).', 'Plants that use the temperature gap between surface and deep seawater; PPPGL cites 41 GW at 17 sites (2017).'],
    ['Seberapa besar PLTAL terbesar di dunia?', 'How large are the largest ocean plants?', 'Sihwa Korea 254 MW (bendung pasang surut) dan MeyGen Skotlandia fase 1A 6 MW (aliran arus).', 'Sihwa in Korea at 254 MW (tidal barrage) and MeyGen in Scotland phase 1A at 6 MW (stream).'],
  ]);
  bab['3'] = glos(['ed', 'pot63'], [
    ['PLTAL', 'Tidal/ocean current plant', 'Pembangkit listrik tenaga arus laut.', 'Ocean current power plant.'],
    ['Tidal stream', 'Tidal stream', 'Turbin bawah air yang memanfaatkan aliran pasang surut, mirip kincir angin bawah laut.', 'Underwater turbines using tidal flow, like underwater wind turbines.'],
    ['Tidal barrage', 'Tidal barrage', 'Bendung yang menahan air pasang dan mengalirkannya lewat turbin (contoh Sihwa).', 'A dam that holds tidal water and passes it through turbines (e.g. Sihwa).'],
    ['OTEC', 'OTEC', 'Ocean thermal energy conversion; memanfaatkan beda suhu laut permukaan dan dalam.', 'Ocean thermal energy conversion; uses the temperature difference between surface and deep water.'],
    ['Delta T', 'Delta T', 'Selisih suhu air permukaan dan dalam; makin besar makin efisien OTEC.', 'Temperature difference between surface and deep water; larger means more efficient OTEC.'],
    ['Potensi teoretis, teknis, praktis', 'Theoretical, technical, practical potential', 'Tiga tingkat potensi; angka praktis paling kecil karena memperhitungkan kendala.', 'Three potential levels; the practical figure is smallest because it counts constraints.'],
    ['CfD', 'CfD', 'Contract for Difference, skema harga tetap Inggris; MeyGen mendapat 9 MW pada AR6 (Sep 2024).', 'Contract for Difference, the UK fixed-price scheme; MeyGen won 9 MW in AR6 (Sep 2024).'],
    ['Faktor kapasitas', 'Capacity factor', 'Produksi tahunan dibagi produksi maksimum teoretis.', 'Annual output divided by theoretical maximum output.'],
  ]);
  bab['4'] = teks(['pot63', 'jp28', 'ed'], [
    ['Indonesia kepulauan dengan banyak selat berarus deras; ESDM sudah lama menyebut potensi arus laut besar. Kelebihan arus pasang surut: dapat diprediksi berbulan-bulan sebelumnya, berbeda dengan angin dan surya.', 'Indonesia is an archipelago with many fast straits; the ministry has long cited large tidal potential. A merit of tidal flow: it is predictable months ahead, unlike wind and solar.'],
    ['Namun potensi besar belum menjadi kapasitas: kapasitas terpasang nol, proyek 40 MW masih pra-konstruksi, dan basis IRENA/OECD hanya mencatat satu aliran dana publik asing ke energi laut Indonesia, USD 0,74 juta pada 2019.', 'But large potential has not become capacity: installed capacity is zero, the 40 MW project is pre-construction, and the IRENA/OECD database records only one foreign public finance flow to Indonesian marine energy, USD 0.74 million in 2019.'],
  ]);
  bab['5'] = rumus(['ed', 'lar18', 'mey_wiki', 'kwater'], [
    ['Daya turbin arus (W) = 0,5 x kerapatan air x luas sapuan rotor x kecepatan pangkat tiga x koefisien daya', 'Tidal turbine power (W) = 0.5 x water density x rotor swept area x speed cubed x power coefficient'],
    ['Efisiensi Carnot OTEC = 1 - suhu air dalam / suhu air permukaan (dalam kelvin)', 'OTEC Carnot efficiency = 1 - deep-water temperature / surface temperature (in kelvin)'],
    ['Faktor kapasitas = Produksi tahunan (GWh) / (Daya MW x 8,76)', 'Capacity factor = Annual output (GWh) / (Power MW x 8.76)'],
  ], [
    [`Contoh: rotor berdiameter 16 m (turbin Open-Centre yang disebut sumber) pada arus 3 m/s, kerapatan 1.025 kg per m3, Cp 0,4: sekitar ${String(pArus).replace('.', ',')} MW per turbin (EST; nilai Cp adalah asumsi METI untuk ilustrasi).`, `Example: a 16 m diameter rotor (the Open-Centre turbine named in sources) in a 3 m/s current, density 1,025 kg per m3, Cp 0.4: about ${pArus} MW per turbine (EST; the Cp value is a METI assumption for illustration).`],
    ['OTEC 26 C (299,15 K) dengan air dalam 5 C (278,15 K): 1 - 278,15 / 299,15 = sekitar 7 persen batas teoretis (EST; nilai suhu adalah contoh umum, bukan data lokasi).', 'OTEC with 26 C (299.15 K) surface and 5 C (278.15 K) deep water: 1 - 278.15 / 299.15 = about 7 percent theoretical limit (EST; temperatures are a generic example, not site data).'],
    [`MeyGen fase 1A: 10,2 GWh / (6 MW x 8,76) = sekitar ${String(cfMey).replace('.', ',')} persen (EST, tahun 2023). Sihwa: 552,7 GWh / (254 MW x 8,76) = sekitar ${String(cfSihwa).replace('.', ',')} persen (EST).`, `MeyGen phase 1A: 10.2 GWh / (6 MW x 8.76) = about ${cfMey} percent (EST, 2023). Sihwa: 552.7 GWh / (254 MW x 8.76) = about ${cfSihwa} percent (EST).`],
  ]);
  bab['6'] = langkah(['ed', 'jp28', 'lar18'], [
    ['Survei sumber daya', 'Resource survey', 'Pengukuran kecepatan arus, kedalaman, dan suhu di selat atau perairan calon.', 'Measuring current speed, depth and temperature in candidate straits or waters.', 'Lembaga riset, pengembang', 'Research bodies, developers'],
    ['Studi kelayakan dan jaringan', 'Feasibility and grid studies', 'Contoh Larantuka: pra-FS PUPR 2017 dan MoU studi dengan PLN 22 Feb 2018.', 'Larantuka example: PUPR pre-FS in 2017 and a study MoU with PLN on 22 Feb 2018.', 'Pengembang, PLN', 'Developer, PLN'],
    ['Pengadaan turbin dan struktur laut', 'Turbine and marine structure procurement', 'Mitra teknologi luar (Belanda, Skotlandia) dan kontraktor lokal.', 'Foreign technology partners (Netherlands, Scotland) and a local contractor.', 'Pengembang, kontraktor', 'Developer, contractor'],
    ['Instalasi dan interkoneksi', 'Installation and interconnection', 'Pemasangan di dasar laut, kabel bawah laut, dan sambungan ke jaringan.', 'Seabed installation, subsea cable and grid connection.', 'Kontraktor, PLN', 'Contractor, PLN'],
    ['Operasi 25 tahun', '25-year operation', 'MeyGen fase 1A memasuki fase operasi 25 tahun.', 'MeyGen phase 1A entered a 25-year operations phase.', 'Operator', 'Operator'],
  ]);
  bab['7'] = grafik(['pot63'], 'kolom', ['Potensi praktis energi laut Indonesia (studi 2022)', 'Practical ocean energy potential in Indonesia (2022 study)'], 'GW', 2, [[['Potensi praktis', 'Practical potential'], true, [['Arus laut', 20.01], ['Gelombang', 1.99], ['Panas laut', 41]]]],
    ['Total 63 GW menurut ringkasan hasil pencarian atas sumber ESDM; angka lain untuk panas laut jauh berbeda (lihat bab 29).', '63 GW in total per a search summary of an Energy Ministry source; other thermal estimates differ widely (see chapter 29).']);
  bab['8'] = tabel(['esdm_arus', 'rup22', 'pantar', 'lar18'], 10, [kol('selat', 'Selat', 'Strait'), kol('catatan', 'Catatan menurut sumber', 'Note per source')], [
    { selat: 'Larantuka', catatan: T('Daftar potensi RUPTL 10 MW; proyek jembatan arus 20 sampai 30 MW (2018); dasar proyek 20 MW NTT (2025); rata-rata arus diasumsikan 3,5 m/s', 'RUPTL potential list 10 MW; tidal bridge project 20 to 30 MW (2018); basis of the 20 MW NTT phase (2025); mean current assumed 3.5 m/s') },
    { selat: 'Alas', catatan: T('Daftar potensi RUPTL 10 MW (pemutakhiran ESDM 2022); arus di atas 2 m/s', 'RUPTL potential list 10 MW (2022 ministry update); currents above 2 m/s') },
    { selat: 'Lombok', catatan: T('Daftar potensi RUPTL 10 MW; arus di atas 2 m/s', 'RUPTL potential list 10 MW; currents above 2 m/s') },
    { selat: 'Bali', catatan: T('Termasuk daftar potensi RUPTL (ukuran tidak disebut tegas)', 'In the RUPTL potential list (size not clearly stated)') },
    { selat: 'Pantar', catatan: T('Dilirik ESDM untuk PLTAL (Okt 2020); arus di atas 2 m/s', 'Eyed by the ministry for tidal plants (Oct 2020); currents above 2 m/s') },
    { selat: T('Toyapakeh, Molo, Sunda, Boleng', 'Toyapakeh, Molo, Sunda, Boleng'), catatan: T('Arus di atas 2 m/s menurut ESDM', 'Currents above 2 m/s per the ministry') },
  ], ['Pembagian per provinsi tidak ditemukan di sumber yang dibaca sehingga tidak ditampilkan; nilai 40 MW proyek 2025 terbagi 20 MW NTT dan 20 MW NTB.', 'A per-province split was not found in the sources read so is not shown; the 2025 40 MW project is split 20 MW NTT and 20 MW NTB.']);
  bab['9'] = tabel(['jp28', 'lar18', 'mey_ops'], 8, [kol('nama', 'Pelaku', 'Actor'), kol('peran', 'Peran', 'Role'), kol('rujuk', 'Dasar', 'Basis')], [
    { nama: 'Kementerian ESDM (Ditjen EBTKE)', peran: T('Penyusun kebijakan dan juru bicara proyek 40 MW', 'Policy maker and spokesperson of the 40 MW project'), rujuk: 'Jakarta Post, 16 Jun 2025' },
    { nama: 'Tidal Bridge (Belanda)', peran: T('Mitra teknologi; membentuk Tidal Bridge Indonesia bersama PJB (2018)', 'Technology partner; formed Tidal Bridge Indonesia with PJB (2018)'), rujuk: 'ESDM, 1 Apr 2018' },
    { nama: 'PT PJB', peran: T('Mitra usaha patungan Larantuka (2018)', 'Joint venture partner in Larantuka (2018)'), rujuk: 'ESDM, 1 Apr 2018' },
    { nama: 'Nova Innovation (Skotlandia)', peran: T('Mitra teknologi proyek 2025', 'Technology partner of the 2025 project'), rujuk: 'Jakarta Post, 16 Jun 2025' },
    { nama: 'SBS Indonesia', peran: T('Kontraktor lokal', 'Local contractor'), rujuk: 'Jakarta Post, 16 Jun 2025' },
    { nama: 'Pertamina Power Indonesia', peran: T('Mitra, lengan listrik Pertamina', 'Partner, Pertamina\'s electricity arm'), rujuk: 'Jakarta Post, 16 Jun 2025' },
    { nama: 'PUPR dan PLN', peran: T('Pra-FS jembatan (2017) dan MoU studi jaringan (2018) di Larantuka', 'Bridge pre-FS (2017) and a grid study MoU (2018) at Larantuka'), rujuk: 'ESDM, 1 Apr 2018' },
  ]);
  bab['10'] = tabel(['jp28', 'lar18', 'mey_wiki', 'kwater', 'mey_ops'], 8, [kol('nama', 'Proyek', 'Project'), kol('negara', 'Negara', 'Country'), kol('ukuran', 'Ukuran', 'Size'), kol('status', 'Status', 'Status')], [
    { nama: 'PLTAL NTT dan NTB (Tidal Bridge, Nova Innovation, SBS, Pertamina Power)', negara: 'Indonesia', ukuran: T('40 MW (2 x 20 MW); sekitar USD 220 juta', '40 MW (2 x 20 MW); about USD 220 million'), status: T('Pra-konstruksi; operasi ditargetkan 2028; ada di RUPTL 2025-2034', 'Pre-construction; operation targeted for 2028; in RUPTL 2025-2034') },
    { nama: 'Jembatan Pancasila-Palmerah dan PLTAL Larantuka (rencana 2018)', negara: 'Indonesia', ukuran: T('20 MW disebut Menteri; jembatan sekitar 810 m', '20 MW cited by the Minister; bridge about 810 m'), status: T('Studi kelayakan 2018; kelanjutan menjadi proyek 2025 tidak dijelaskan sumber', 'Feasibility studies in 2018; how it continues into the 2025 project is not explained by sources') },
    { nama: 'MeyGen fase 1A', negara: T('Skotlandia', 'Scotland'), ukuran: T('4 x 1,5 MW = 6 MW', '4 x 1.5 MW = 6 MW'), status: T('Operasi 25 tahun; 10,2 GWh pada 2023', '25-year operations; 10.2 GWh in 2023') },
    { nama: 'Sihwa Lake', negara: T('Korea Selatan', 'South Korea'), ukuran: T('254 MW (10 x 25,4 MW)', '254 MW (10 x 25.4 MW)'), status: T('Beroperasi sejak 2011 atau 2012 (sumber berbeda); 552,7 GWh per tahun', 'Operating since 2011 or 2012 (sources differ); 552.7 GWh a year') },
  ]);
  bab['11'] = teks(['rup22', 'jp28'], [
    ['Pasar dalam negeri belum terbentuk. PLTAL Selat Alas 10 MW, Selat Lombok 10 MW, Selat Bali, dan Selat Larantuka masuk daftar potensi RUPTL menurut pemutakhiran ESDM 2022; RUPTL 2025-2034 mencantumkan proyek 40 MW (Jakarta Post, 16 Jun 2025).', 'The domestic market has not formed. Alas 10 MW, Lombok 10 MW, Bali and Larantuka tidal plants were on the RUPTL potential list per a 2022 ministry update; RUPTL 2025-2034 lists the 40 MW project (Jakarta Post, 16 Jun 2025).'],
    ['Tarif dan skema pembelian listrik arus laut tidak ditemukan di sumber yang dibaca.', 'The tariff and power purchase scheme for tidal power were not found in the sources read.'],
  ]);
  bab['12'] = tabel(['ed'], 6, kolRegulasi, tabelRegulasi({
    'uu-30-2009': ['Dasar usaha ketenagalistrikan termasuk sumber energi primer terbarukan.', 'Basis of the electricity business including renewable primary energy.'],
    'perpres-112-2022': ['Percepatan energi terbarukan untuk tenaga listrik; mengatur harga patokan dan penugasan PLN.', 'Acceleration of renewable power; sets benchmark prices and PLN assignments.'],
    'pp-40-2025': ['Kebijakan Energi Nasional 2025.', 'National Energy Policy 2025.'],
  }), ['Basis regulasi METI tidak memuat aturan khusus energi laut; izin ruang laut dan lingkungan tidak dibahas sumber yang dibaca.', 'The METI regulation base has no ocean-energy-specific rule; marine spatial and environmental permits were not covered in the sources read.']);
  bab['13'] = linimasa(['lar18', 'pantar', 'jp28', 'mey_wiki', 'kwater', 'tethys', 'ed'], [
    ['2011-08-01', 'Sihwa mulai beroperasi (Agu 2011 menurut Tethys; Wikipedia menyebut 2012)', 'Sihwa starts operating (Aug 2011 per Tethys; Wikipedia says 2012)', 'https://tethys.pnnl.gov/project-sites/sihwa-tidal-power-plant'],
    ['2016-04-01', 'Head of Agreement Larantuka ditandatangani di Belanda (Apr 2016)', 'Larantuka Head of Agreement signed in the Netherlands (Apr 2016)', 'https://www.esdm.go.id/en/media-center/news-archives/tinjau-lokasi-pembangunan-pembangkit-arus-laut-di-selat-larantuka-menteri-esdm-pertama-di-indonesia-terbesar-di-dunia'],
    ['2018-02-22', 'MoU PLN dan Tidal Bridge BV untuk studi kelayakan dan jaringan', 'MoU between PLN and Tidal Bridge BV for feasibility and grid studies', 'https://www.esdm.go.id/en/media-center/news-archives/tinjau-lokasi-pembangunan-pembangkit-arus-laut-di-selat-larantuka-menteri-esdm-pertama-di-indonesia-terbesar-di-dunia'],
    ['2018-03-31', 'Menteri ESDM meninjau lokasi Larantuka', 'Energy Minister visits the Larantuka site', 'https://www.esdm.go.id/en/media-center/news-archives/tinjau-lokasi-pembangunan-pembangkit-arus-laut-di-selat-larantuka-menteri-esdm-pertama-di-indonesia-terbesar-di-dunia'],
    ['2020-10-20', 'ESDM melirik Selat Pantar untuk PLTAL (judul)', 'Energy Ministry eyes the Pantar strait for tidal power (headline)', 'https://www.esdm.go.id/id/berita-unit/direktorat-jenderal-ebtke/esdm-lirik-selat-pantar-ntt-untuk-pengembangan-pembangkit-listrik-tenaga-arus-laut-1'],
    ['2024-09-30', 'MeyGen mendapat tambahan 9 MW pada CfD AR6 (Sep 2024)', 'MeyGen wins an extra 9 MW in CfD AR6 (Sep 2024)', 'https://en.wikipedia.org/wiki/MeyGen'],
    ['2025-06-16', 'ESDM: PLTAL pertama 40 MW ditargetkan beroperasi 2028', 'Energy Ministry: first 40 MW tidal plant targeted for 2028', 'https://www.thejakartapost.com/business/2025/06/16/ri-to-start-operating-first-ocean-power-plant-in-2028.html'],
    ['2028-01-01', 'Tahun target operasi PLTAL pertama (tahun 2028; tanggal tepat tidak ada)', 'Year of the first tidal plant operation target (year 2028; exact date not given)', null],
  ]);
  bab['17'] = teks(['mey_wiki', 'mey_ops', 'kwater', 'esdm_arus'], [
    ['Aliran pasang surut: MeyGen fase 1A di Skotlandia memakai empat turbin 1,5 MW dari Atlantis dan ANDRITZ Hammerfest, kini fase operasi 25 tahun; tapaknya berizin hingga 398 MW. Turbin Open-Centre berdiameter 16 m disebut mampu 2 MW pada arus 2 sampai 5 m/s (ESDM).', 'Tidal stream: MeyGen phase 1A in Scotland uses four 1.5 MW turbines from Atlantis and ANDRITZ Hammerfest and is now in a 25-year operations phase; its site is consented up to 398 MW. A 16 m diameter Open-Centre turbine is said to reach 2 MW in 2 to 5 m/s currents (ministry).'],
    ['Bendung pasang surut: Sihwa memakai 10 turbin 25,4 MW pada bendung yang sudah ada (K-water). Tingkat kematangan (TRL) tidak ditemukan di sumber; sengaja tidak diisi.', 'Tidal barrage: Sihwa uses ten 25.4 MW turbines in an existing dam (K-water). TRL was not found in the sources and is deliberately left blank.'],
  ]);
  bab['18'] = teks(['otec17', 'tud'], [
    ['Riset: PPPGL meneliti OTEC di 17 lokasi dengan total 41 GW (2017), dan studi TU Delft menaksir hingga 45 GW dengan 22 persen kebutuhan nasional pada 2050. Paten, startup, dan prototipe Indonesia tidak ditemukan di sumber yang dibaca.', 'Research: PPPGL studied OTEC at 17 sites totalling 41 GW (2017), and a TU Delft study estimates up to 45 GW covering 22 percent of national demand in 2050. Indonesian patents, start-ups and prototypes were not found in the sources read.'],
  ]);
  bab['19'] = tabel(['jp28', 'kwater', 'sihwa_wiki'], 6, [kol('item', 'Ukuran biaya', 'Cost measure'), kol('nilai', 'Nilai', 'Value'), kol('catatan', 'Catatan', 'Note')], [
    { item: T('PLTAL NTT dan NTB, 40 MW', 'NTT and NTB tidal plants, 40 MW'), nilai: 'USD 220 juta', catatan: T(`Sekitar USD ${nf(220 / 40, 1)} juta per MW (EST; belum termasuk biaya pembiayaan)`, `About USD ${nfe(220 / 40, 1)} million per MW (EST; excludes financing cost)`) },
    { item: T('Sihwa 254 MW menurut K-water', 'Sihwa 254 MW per K-water'), nilai: 'USD 355,1 juta', catatan: T(`Sekitar USD ${nf(355.1 / 254, 2)} juta per MW (EST)`, `About USD ${nfe(355.1 / 254, 2)} million per MW (EST)`) },
    { item: T('Sihwa 254 MW menurut Wikipedia', 'Sihwa 254 MW per Wikipedia'), nilai: 'USD 560 juta', catatan: T('Tidak sama dengan K-water; sumber tidak merekonsiliasi', 'Differs from K-water; the sources do not reconcile it') },
  ], ['Bendung yang memakai struktur eksisting (Sihwa) jauh lebih murah per MW daripada proyek arus pertama; ini perbandingan EST bukan kurva belajar. Kurva belajar biaya energi laut tidak ada di sumber.', 'A barrage using existing structures (Sihwa) is far cheaper per MW than the first stream project; this is an EST comparison, not a learning curve. No ocean energy cost learning curve is in the sources.']);
  bab['20'] = tabel(['mey_wiki', 'kwater', 'jp28', 'tud'], 6, [kol('negara', 'Negara dan proyek', 'Country and project'), kol('tipe', 'Tipe', 'Type'), kol('kapasitas', 'Kapasitas', 'Capacity'), kol('hasil', 'Hasil atau status', 'Result or status')], [
    { negara: T('Korea Selatan: Sihwa', 'South Korea: Sihwa'), tipe: 'Barrage', kapasitas: '254 MW', hasil: T('552,7 GWh per tahun; faktor kapasitas EST ' + String(cfSihwa).replace('.', ',') + ' persen', '552.7 GWh a year; EST capacity factor ' + cfSihwa + ' percent') },
    { negara: T('Skotlandia: MeyGen', 'Scotland: MeyGen'), tipe: 'Tidal stream', kapasitas: '6 MW', hasil: T('10,2 GWh pada 2023; tapak berizin 398 MW; CfD 9 MW', '10.2 GWh in 2023; site consented to 398 MW; 9 MW CfD') },
    { negara: 'Indonesia', tipe: 'Tidal stream', kapasitas: '0 MW', hasil: T('40 MW ditargetkan 2028; praktis 20 GW arus', '40 MW targeted for 2028; practical potential 20 GW of current') },
  ], ['Negara lain (Prancis, Kanada, Tiongkok, India, ASEAN) tidak dibaca dan tidak ditampilkan.', 'Other countries (France, Canada, China, India, ASEAN) were not read and are not shown.']);
  bab['21'] = teks(['ed', 'mey_wiki', 'kwater', 'lar18', 'jp28'], [
    hp('keberhasilan di luar negeri bertumpu pada struktur yang sudah ada (bendung Sihwa) atau pendanaan harga tetap berjangka (CfD Inggris untuk MeyGen); Indonesia belum memiliki keduanya untuk energi laut.', 'success abroad rests on existing structures (the Sihwa dam) or long-term fixed-price support (UK CfD for MeyGen); Indonesia has neither for ocean energy yet.'),
    hp('rencana Larantuka 2018 dan proyek 2025 berbagi mitra (Tidal Bridge) tetapi tujuh tahun pemisah tanpa pembangkit menunjukkan jalur studi ke investasi masih panjang.', 'the 2018 Larantuka plan and the 2025 project share a partner (Tidal Bridge), but seven years without a plant show the path from study to investment is long.'),
  ]);
  bab['22'] = teks(['pot63', 'pubfin'], [
    [`Potensi praktis 63 GW dibanding kapasitas terpasang nol dan pendanaan publik asing yang tercatat hanya USD ${nf(dana.usd_juta_2023, 2)} juta (${dana.tahun}). Pembanding peringkat dunia tidak ditemukan di sumber.`, `A practical potential of 63 GW against zero installed capacity and recorded foreign public finance of only USD ${nfe(dana.usd_juta_2023, 2)} million (${dana.tahun}). A global ranking comparison was not found in the sources.`],
  ]);
  bab['23'] = teks(['jp28', 'lar18', 'mey_wiki'], [
    ['Kerja sama teknologi dengan Belanda (Tidal Bridge, Head of Agreement April 2016) dan Skotlandia (Nova Innovation, 2025). Pengalaman Skotlandia (MeyGen) dan Korea (Sihwa) adalah rujukan operasi.', 'Technology cooperation with the Netherlands (Tidal Bridge, Head of Agreement April 2016) and Scotland (Nova Innovation, 2025). Scottish (MeyGen) and Korean (Sihwa) experience are operating references.'],
  ]);
  bab['24'] = teks(['jp28', 'pubfin', 'mey_wiki'], [
    ['Proyek 40 MW senilai sekitar USD 220 juta; sumber dana (ekuitas, pinjaman, hibah) tidak disebut. Satu-satunya aliran publik asing tercatat: USD 0,74 juta (2019, IRENA/OECD). Pembanding: CfD Inggris AR6 memberi MeyGen 9 MW tambahan untuk penyerahan 2028 sampai 2029.', 'The 40 MW project is worth about USD 220 million; the funding sources (equity, debt, grants) are not stated. The only recorded foreign public flow: USD 0.74 million (2019, IRENA/OECD). Comparison: the UK AR6 CfD gave MeyGen an extra 9 MW for delivery in 2028 to 2029.'],
  ]);
  bab['25'] = rumus(['jp28', 'ed'], [
    ['Biaya per MW = Nilai proyek / Kapasitas', 'Cost per MW = Project value / Capacity'],
    ['Produksi tahunan (GWh) = Daya (MW) x 8,76 x Faktor kapasitas', 'Annual output (GWh) = Power (MW) x 8.76 x Capacity factor'],
  ], [[`USD 220 juta / 40 MW = USD ${nf(220 / 40, 1)} juta per MW (EST). Dengan faktor kapasitas 20 persen (asumsi METI memakai MeyGen EST ${String(cfMey).replace('.', ',')} persen sebagai acuan): 40 x 8,76 x 0,2 = sekitar 70 GWh per tahun (EST; belum ada tarif untuk menghitung pendapatan).`, `USD 220 million / 40 MW = USD ${nfe(220 / 40, 1)} million per MW (EST). With a 20 percent capacity factor (METI assumption, MeyGen EST ${cfMey} percent as reference): 40 x 8.76 x 0.2 = about 70 GWh a year (EST; no tariff is available to compute revenue).`]]);
  bab['29'] = teks(['otec17', 'tud', 'pot63', 'kwater', 'sihwa_wiki'], [
    ['Taksiran potensi sangat berbeda: panas laut 41 GW (PPPGL 2017, ESDM 2022), hingga 45 GW dengan 22 persen kebutuhan 2050 (TU Delft), dan studi lain 103,2 GW praktis atau 289,73 GW untuk seluruh ZEE (ringkasan hasil pencarian atas kajian lain). Perbedaan metode, bukan fakta tunggal.', 'Potential estimates differ widely: ocean thermal 41 GW (PPPGL 2017, ministry 2022), up to 45 GW covering 22 percent of 2050 demand (TU Delft), and other studies 103.2 GW practical or 289.73 GW for the whole EEZ (search summary of other studies). These are method differences, not one fact.'],
    ['Biaya Sihwa berbeda: USD 355,1 juta (K-water) versus USD 560 juta (Wikipedia). Tahun mulai operasi berbeda: 2011 (Tethys) versus 2012 (Wikipedia). Sumber tidak merekonsiliasi.', 'Sihwa cost differs: USD 355.1 million (K-water) versus USD 560 million (Wikipedia). Start year differs: 2011 (Tethys) versus 2012 (Wikipedia). The sources do not reconcile.'],
  ]);
  bab['30'] = tabel(['jp28', 'pot63', 'tud'], 6, [kol('item', 'Sasaran atau proyeksi', 'Target or projection'), kol('nilai', 'Nilai', 'Value'), kol('tahun', 'Tahun', 'Year')], [
    { item: T('PLTAL pertama (dua fase)', 'First tidal plant (two phases)'), nilai: '40 MW', tahun: '2028' },
    { item: T('OTEC hingga 45 GW (22 persen kebutuhan nasional)', 'OTEC up to 45 GW (22 percent of national demand)'), nilai: T('skenario TU Delft', 'TU Delft scenario'), tahun: '2050' },
    { item: T('Potensi praktis total', 'Total practical potential'), nilai: '63 GW', tahun: T('studi 2022', '2022 study') },
  ], ['Proyeksi resmi energi laut untuk 2045 dan 2060 tidak ditemukan.', 'No official ocean energy projection for 2045 and 2060 was found.']);
  bab['31'] = teks(['ed'], [
    hp('pengembang dan pemasok: peluang awal pada survei arus, struktur laut, kabel bawah laut, dan O&M kapal; kandungan lokal (TKDN) dapat menjadi pembeda.', 'developers and suppliers: early opportunities are in current surveys, marine structures, subsea cable and vessel O&M; local content can be a differentiator.'),
    hp('akademisi dan pemda NTT/NTB: data arus terbuka dan lokasi pelabuhan pendukung; investor: tunggu kepastian tarif dan skema jual-beli sebelum modal besar.', 'academics and NTT/NTB local governments: open current data and supporting port sites; investors: wait for tariff and offtake certainty before large capital.'),
  ]);
  bab['32'] = teks(['jp28', 'lar18'], [
    ['Keputusan investasi akhir dan awal konstruksi proyek 40 MW (siaran ESDM menyebut konstruksi segera dimulai).', 'The final investment decision and construction start of the 40 MW project (the ministry says construction will begin soon).'],
    ['Skema tarif atau pembelian khusus arus laut, dan kejelasan hubungan proyek Larantuka 2018 dengan proyek 2025.', 'A tariff or offtake scheme specific to tidal power, and clarity on how the 2018 Larantuka project relates to the 2025 project.'],
  ]);
  bab['36'] = tabel(['jp28', 'kwater', 'tud'], 6, [kol('judul', 'Dokumen', 'Document', { url: 'url' }), kol('penerbit', 'Penerbit', 'Publisher'), kol('mengapa', 'Mengapa dibaca', 'Why read it')], [
    { judul: 'RI to start operating first ocean power plant in 2028', penerbit: 'The Jakarta Post', url: SUMBER.jp28.url, mengapa: T('Status proyek 40 MW', 'Status of the 40 MW project') },
    { judul: 'Sihwa Tidal Power Plant', penerbit: 'K-water', url: SUMBER.kwater.url, mengapa: T('Spesifikasi bendung pasang surut terbesar', 'Specifications of the largest tidal barrage') },
    { judul: 'Upscaling scenarios for OTEC in Indonesia', penerbit: 'TU Delft', url: SUMBER.tud.url, mengapa: T('Skenario OTEC Indonesia', 'OTEC scenarios for Indonesia') },
  ]);
  bab['38'] = teks(['ed', 'pot63', 'jp28'], [
    ['Sumber: siaran ESDM (Larantuka 2018), Jakarta Post (2025), K-water, Tethys, dan ringkasan hasil pencarian atas laporan lain, dibaca 8 Nov 2026. Banyak angka dari ringkasan hasil pencarian karena halaman tidak dibaca penuh; ditandai di daftar sumber.', 'Sources: Energy Ministry releases (Larantuka 2018), the Jakarta Post (2025), K-water, Tethys and search summaries of other reports, read on 8 Nov 2026. Many figures come from search summaries because pages were not read in full; they are flagged in the source list.'],
    ['Batas: tidak ada data lokasi terukur per provinsi, tarif, atau izin laut. Naskah ini belum terdaftar di cetakan topik (id energi-laut belum ada di ui.json). EST berarti hitung sendiri; Hipotesis berarti sintesis METI.', 'Limits: no measured location data per province, tariff or marine permit. This text is not yet registered in the topic printer (the energi-laut id is not in ui.json). EST means self-derived; Hypothesis means METI synthesis.'],
  ]);

  bab['39'] = { tipe: 'kasus', sumber: ['mey_wiki', 'mey_ops', 'kwater', 'tethys', 'sihwa_wiki'], catatan: T('Tidak ada pembangkit energi laut berhasil di Indonesia; dua kasus luar negeri dari sumber yang dibaca.', 'There is no successful ocean energy plant in Indonesia; two foreign cases from the sources read.'), butir: [
    kas({ id: 'meygen', nama: 'MeyGen fase 1A, Pentland Firth', jenis: 'berhasil', negara: 'GB', lokasi: ['Skotlandia', 'Scotland'],
      profil: [['Kapasitas', 'Capacity', 6, 'MW'], ['Turbin', 'Turbines', '4 x 1,5 MW (Atlantis dan ANDRITZ Hammerfest)', null], ['Tapak berizin', 'Consented site', 398, 'MW']],
      tindakan: [['Membangun array aliran pasang surut komersial pertama dan masuk fase operasi 25 tahun; memenangkan 9 MW pada CfD AR6 (Sep 2024).', 'Built the first commercial tidal stream array, entered a 25-year operations phase and won 9 MW in CfD AR6 (Sep 2024).']],
      sebab: [['Tapak dengan izin besar dan dukungan harga tetap berjangka (CfD); detail teknis tidak ada di sumber yang dibaca.', 'A site with large consent and long-term fixed-price support (CfD); technical detail is not in the sources read.']],
      angka: [['Keluaran bersih 2023', 'Net output 2023', 10.2, 1, 'GWh', 'mey_wiki', false], ['Faktor kapasitas 2023', 'Capacity factor 2023', cfMey, 1, 'persen (EST)', 'mey_wiki', true]],
      pelajaran: [['Skala kecil dapat bertahan bertahun-tahun bila ada pembeli harga tetap; skala komersial masih jauh dari 398 MW.', 'A small scale can survive for years with a fixed-price buyer; commercial scale is still far from 398 MW.']],
      kronologi: [['2022-01-01', 'Fase 1A memasuki fase operasi 25 tahun (judul Offshore Energy).', 'Phase 1A enters its 25-year operations phase (Offshore Energy headline).'], ['2024-09-30', 'Menang 9 MW pada CfD AR6 (Sep 2024).', 'Wins 9 MW in CfD AR6 (Sep 2024).']],
      faktor: { dukungan_harga: true, struktur_eksisting: false, sumber_daya_terukur: true, mitra_teknologi: true }, sumber: ['mey_wiki', 'mey_ops'] }),
    kas({ id: 'sihwa', nama: 'Sihwa Lake Tidal Power Station', jenis: 'berhasil', negara: 'KR', lokasi: ['Korea Selatan', 'South Korea'],
      profil: [['Kapasitas', 'Capacity', 254, 'MW'], ['Turbin', 'Turbines', '10 x 25,4 MW, 8 pintu air', null], ['Operator', 'Operator', 'K-water', null]],
      tindakan: [['Memasang turbin pada bendung yang sudah ada sehingga tidak perlu membangun bendung baru.', 'Installed turbines in an existing dam so no new dam was needed.']],
      sebab: [['Memakai struktur eksisting; ringkasan sumber tidak memuat latar penyebab lain. Sumber menyebut biaya berbeda (USD 355,1 juta K-water; USD 560 juta Wikipedia).', 'Used existing structure; the sources give no other cause. Sources cite differing costs (USD 355.1 million K-water; USD 560 million Wikipedia).']],
      angka: [['Produksi tahunan', 'Annual output', 552.7, 1, 'GWh', 'kwater', false], ['Faktor kapasitas', 'Capacity factor', cfSihwa, 1, 'persen (EST)', 'kwater', true]],
      pelajaran: [['Pemanfaatan struktur eksisting menurunkan biaya per MW secara tajam dibanding proyek arus baru.', 'Reusing existing structures cuts cost per MW sharply compared with a new stream project.']],
      kronologi: [['2011-08-01', 'Mulai operasi Agu 2011 menurut Tethys (Wikipedia: 2012).', 'Starts operating Aug 2011 per Tethys (Wikipedia: 2012).']],
      faktor: { dukungan_harga: false, struktur_eksisting: true, sumber_daya_terukur: true, mitra_teknologi: true }, sumber: ['kwater', 'tethys', 'sihwa_wiki'] }),
  ] };
  bab['40'] = { tipe: 'kasus', sumber: ['lar18', 'bis18', 'jp28'], catatan: T('Hak jawab: pihak yang disebut dapat mengirim koreksi lewat formulir koreksi platform. Satu kasus; kegagalan energi laut luar negeri tidak dibaca. Larantuka tidak dinyatakan batal oleh sumber, hanya belum terbangun.', 'Right of reply: named parties can send corrections through the platform correction form. One case; foreign ocean energy failures were not read. Larantuka is not declared cancelled by any source, only not built.'), butir: [
    kas({ id: 'larantuka', nama: 'PLTAL Selat Larantuka (rencana 2018)', jenis: 'mundur', negara: 'ID', lokasi: ['Flores Timur, NTT', 'East Flores, NTT'],
      sebab: [['Sumber tidak menyebut penyebab tertunda. Fakta: 2018 masih tahap studi kelayakan; 2025 ESDM menyatakan proyek 40 MW di NTT dan NTB pra-konstruksi dengan operasi 2028.', 'Sources do not give the reason for the delay. Facts: in 2018 it was still at the feasibility stage; in 2025 the ministry says a 40 MW project in NTT and NTB is pre-construction with operation in 2028.']],
      angka: [['Kapasitas yang disebut Menteri (2018)', 'Capacity cited by the Minister (2018)', 20, 0, 'MW', 'lar18', false], ['Kapasitas proyek 2025', 'Capacity of the 2025 project', 40, 0, 'MW', 'jp28', false]],
      kronologi: [['2016-04-01', 'Head of Agreement di Belanda (Apr 2016).', 'Head of Agreement in the Netherlands (Apr 2016).'], ['2018-02-22', 'MoU PLN dan Tidal Bridge BV.', 'PLN and Tidal Bridge BV MoU.'], ['2018-03-31', 'Menteri ESDM meninjau lokasi.', 'Energy Minister visits the site.'], ['2025-06-16', 'ESDM: operasi PLTAL pertama ditargetkan 2028.', 'Ministry: first tidal plant operation targeted for 2028.']],
      terdampak: ['Masyarakat Flores Timur yang menunggu listrik dan jembatan terpadu, serta pengembang.', 'East Flores residents awaiting power and an integrated bridge, and developers.'],
      seharusnya: ['umumkan tonggak dan penyebab tertunda secara terbuka, serta tetapkan skema tarif sebelum fase konstruksi.', 'publish milestones and reasons for delay openly, and set a tariff scheme before the construction phase.'],
      tanda: [['Target "segera direalisasikan" (2018) tanpa jadwal konstruksi', 'A "soon to be realised" claim (2018) without a construction schedule'], ['Tidak ada tarif atau skema pembelian', 'No tariff or offtake scheme']],
      faktor: { dukungan_harga: false, struktur_eksisting: false, sumber_daya_terukur: false, mitra_teknologi: true }, sumber: ['lar18', 'bis18', 'jp28'] }),
  ] };
  bab['41'] = { tipe: 'pola', sumber: ['ed'], catatan: T('Sel dibangun dari bendera faktor tiap kasus; pemetaan adalah analisis METI (Hipotesis) atas fakta di bab 39 dan 40.', 'Cells are built from case factor flags; the mapping is METI analysis (Hypothesis) of facts in chapters 39 and 40.'),
    faktor: [L('dukungan_harga', 'Dukungan harga tetap berjangka', 'Long-term fixed-price support'), L('struktur_eksisting', 'Memakai struktur yang sudah ada', 'Uses existing structure'), L('sumber_daya_terukur', 'Sumber daya terukur di lokasi', 'Measured resource at site'), L('mitra_teknologi', 'Mitra teknologi berpengalaman', 'Experienced technology partner')] };
  const d = (peran, tahap, id, en, s) => ({ peran, tahap, teks: T(id, en), dasar: s });
  bab['42'] = { tipe: 'periksa', sumber: ['ed'],
    peran: [L('pengembang', 'Pengembang', 'Developer'), L('investor', 'Investor', 'Investor'), L('pemda', 'Pemerintah daerah', 'Local government'), L('pusat', 'Pemerintah pusat', 'Central government'), L('pln', 'PLN', 'PLN'), L('meti', 'METI', 'METI')],
    tahap: [L('lokasi', 'Penyaringan lokasi', 'Site screening'), L('izin', 'Perizinan', 'Permitting'), L('ppa', 'PPA', 'PPA'), L('dana', 'Pendanaan', 'Financing'), L('bangun', 'Konstruksi', 'Construction'), L('operasi', 'Operasi', 'Operation')],
    butir: [
      d('pengembang', 'lokasi', 'Ukur kecepatan arus di lokasi sendiri; angka rata-rata 3,5 m/s Larantuka adalah asumsi studi, bukan jaminan.', 'Measure current speed at your own site; the 3.5 m/s Larantuka mean is a study assumption, not a guarantee.', 'lar18'),
      d('pengembang', 'bangun', 'Pertimbangkan struktur eksisting (jembatan, bendung) untuk menekan biaya (Sihwa, Larantuka).', 'Consider existing structures (bridges, dams) to cut cost (Sihwa, Larantuka).', 'kwater'),
      d('investor', 'dana', 'Minta kejelasan tarif atau CfD sebelum komit; proyek pembanding bergantung pada dukungan harga tetap.', 'Ask for tariff or CfD clarity before committing; comparable projects depend on fixed-price support.', 'mey_wiki'),
      d('pemda', 'lokasi', 'Siapkan data pelabuhan, kabel, dan koordinasi ruang laut di NTT dan NTB.', 'Prepare port, cable and marine spatial coordination in NTT and NTB.', 'jp28'),
      d('pusat', 'ppa', 'Tetapkan skema tarif khusus energi laut dan jelaskan statusnya di RUPTL.', 'Set a tariff scheme for ocean energy and clarify its status in RUPTL.', 'rup22'),
      d('pln', 'ppa', 'Jelaskan kewajiban beli dan titik sambung untuk proyek 40 MW.', 'Clarify the purchase obligation and connection point for the 40 MW project.', 'jp28'),
      d('meti', 'operasi', 'Pantau tonggak proyek 2028 dan beri ruang hak jawab bagi pihak yang disebut.', 'Track milestones of the 2028 project and give named parties a right of reply.', 'jp28'),
    ] };

  return rakit({ id: 'energi-laut', judul: ['Energi laut', 'Ocean energy'],
    lead: ['Arus laut, gelombang, dan panas laut (OTEC): potensi praktis 63 GW, belum ada kapasitas terpasang, proyek pertama 40 MW ditargetkan 2028, dan pelajaran dari MeyGen dan Sihwa.', 'Tidal, wave and ocean thermal energy (OTEC): 63 GW practical potential, no installed capacity yet, a first 40 MW project targeted for 2028, and lessons from MeyGen and Sihwa.'],
    kunci: [
      kunci('Potensi praktis energi laut', 'Practical ocean energy potential', 63, 0, 'GW', 'GW', 'pot63'),
      kunci('Potensi praktis arus laut', 'Practical tidal current potential', 20.01, 2, 'GW', 'GW', 'pot63'),
      kunci('Potensi panas laut (OTEC, PPPGL)', 'Ocean thermal potential (OTEC, PPPGL)', 41, 0, 'GW', 'GW', 'otec17'),
      kunci('PLTAL pertama, target operasi 2028', 'First tidal plant, operation target 2028', 40, 0, 'MW', 'MW', 'jp28'),
      kunci('Pendanaan publik asing tercatat (2019)', 'Recorded foreign public finance (2019)', dana.usd_juta_2023, 2, 'juta USD', 'USD million', 'pubfin'),
    ],
    penting: [
      ['Potensi praktis energi laut 63 GW (arus 20,01 GW, panas laut 41 GW), tetapi kapasitas terpasang masih nol.', 'Practical ocean energy potential is 63 GW (currents 20.01 GW, thermal 41 GW), yet installed capacity is still zero.'],
      ['PLTAL pertama 40 MW di NTT dan NTB senilai sekitar USD 220 juta ditargetkan beroperasi 2028 dan masih pra-konstruksi.', 'The first 40 MW tidal plant in NTT and NTB, worth about USD 220 million, is targeted for 2028 and still pre-construction.'],
      ['Pembanding: Sihwa 254 MW memakai bendung yang ada, sedangkan MeyGen 6 MW bertahan dengan dukungan harga tetap.', 'Comparisons: Sihwa at 254 MW reuses an existing dam, while MeyGen at 6 MW survives on fixed-price support.'],
    ],
    posisi: ['Indonesia punya potensi arus laut yang besar tetapi belum memiliki satu pun pembangkit energi laut, sementara Korea sudah mengoperasikan 254 MW sejak 2011 atau 2012.', 'Indonesia has large tidal potential but not a single ocean energy plant, while Korea has operated 254 MW since 2011 or 2012.'],
    sumber: SUMBER, bab });
}

export function susun() { return tambahJalanModel(dalam(susunAsal()), 'energi-laut'); }
export const validasi = val;
export const selftest = () => st(susun);
jalankan(import.meta.url, 'energi_laut', susun);
