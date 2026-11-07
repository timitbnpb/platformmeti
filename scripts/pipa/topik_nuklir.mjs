#!/usr/bin/env node
// Naskah topik Nuklir dan SMR -> public/data/topik/nuklir.json (TOPIK-SKEMA.md). Pakai: node scripts/pipa/topik_nuklir.mjs [--selftest]
// Teks dari sumber publik yang dibaca 8 Nov 2026; tabel dari berkas repo (proyek, keuangan_hijau, asean_energi, regulasi).
import { dalam } from './topik_nuklir_dalam.mjs';
import { T, hp, S, ED, baca, regS, nf, nfe, SPUBFIN, teks, faq, glos, rumus, langkah, tabel, grafik, linimasa, kol, L, kunci, kas, rakit, selftest as st, jalankan, tabelRegulasi, kolRegulasi, validasi as val } from './topik_enam_lib.mjs';

const ase = baca('public/data/asean_energi.json'), kh = baca('public/data/keuangan_hijau.json');
const pj = baca('public/data/proyek.json').baris.find((p) => p.id === 'pj_0220');
if (!pj) throw new Error('proyek pj_0220 tidak ada');
const nukDana = kh.investasi_publik.filter((r) => r.teknologi === 'Nuclear energy');
const nukTot = Math.round(nukDana.reduce((a, r) => a + r.usd_juta_2023, 0) * 100) / 100;
const adaNuk = ase.baris.filter((b) => (b.bauran_listrik_persen.nuklir?.nilai || 0) > 0).map((b) => b.nama);
export const SUMBER = {
  ed: ED, ken: regS('pp-40-2025'), uu10: regS('uu-10-1997'), pubfin: SPUBFIN,
  ruptl: S('RUPTL PT PLN (Persero) 2025-2034, baris PLTN Tersebar (public/data/proyek.json, pj_0220)', 'PT PLN (Persero); disahkan Kementerian ESDM', pj.sumber[0].url.replace(/#.*$/, ''), '2026-11-07', 2025, 'resmi'),
  cnbc_rup: S('Jangan Kaget, Bangun Transmisi Listrik 1 Km Butuh Duit Rp 30 Miliar (rincian RUPTL 2025-2034: nuklir 0,5 GW dari 69,5 GW tambahan; 4 Jun 2025)', 'CNBC Indonesia', 'https://www.cnbcindonesia.com/news/20250604210559-4-638669/jangan-kaget-bangun-transmisi-listrik-1-km-butuh-duit-rp-30-miliar', '2026-11-08', 2025, 'media'),
  den26: S('Ambisi RI 2060 Bisa Punya 44 GW Pembangkit Nuklir (3 Mar 2026; pernyataan Sekjen Dewan Energi Nasional)', 'CNBC Indonesia', 'https://www.cnbcindonesia.com/news/20260303145941-4-715590/ambisi-ri-2060-bisa-punya-44-gw-pembangkit-nuklir', '2026-11-08', 2026, 'media'),
  ibp25: S('Indonesia targets first nuclear power plant by 2032 (24 Feb 2025; pernyataan Dirjen EBTKE 22 Feb 2025)', 'Indonesia Business Post', 'https://indonesiabusinesspost.com/3648/energy-and-resources/profiles', '2026-11-08', 2025, 'media'),
  detik_tapak: S('ESDM Tegaskan Belum Terbitkan Izin Tapak PLTN Thorcon di Bangka Belitung (12 Agu 2025)', 'detikFinance', 'https://finance.detik.com/energi/d-8056649/esdm-tegaskan-belum-terbitkan-izin-tapak-pltn-thorcon-di-bangka-belitung', '2026-11-08', 2025, 'media'),
  mongabay_gelasa: S('Tuai Kritik, Bagaimana Perkembangan PLTN di Pulau Gelasa? (23 Feb 2025)', 'Mongabay Indonesia', 'https://mongabay.co.id/2025/02/23/tuai-kritik-bagaimana-perkembangan-pltn-di-pulau-gelasa/', '2026-11-08', 2025, 'media'),
  tapak_kontan: S('Thorcon Persiapkan Izin Tapak untuk PLTN di Pulau Kelasa, Bangka Belitung (hanya judul dibaca)', 'Kontan', 'https://industri.kontan.co.id/news/thorcon-persiapkan-izin-tapak-untuk-pltn-di-pulau-kelasa-bangka-belitung', '2026-11-08', 2025, 'media'),
  bahlil: S('Bahlil Belum Teken Izin Tapak untuk Pembangkit Listrik Nuklir Thorcon (11 Agu 2025; hanya judul dibaca)', 'Bisnis.com', 'https://ekonomi.bisnis.com/read/20250811/44/1901293/bahlil-belum-teken-izin-tapak-untuk-pembangkit-listrik-nuklir-thorcon', '2026-11-08', 2025, 'media'),
  brin_sdm: S('Peneliti Sebut SDM Indonesia Sudah Mumpuni Bangun Pembangkit Nuklir (jul 2024; kutipan pejabat BRIN: tiga reaktor, Serpong 30 MWt, Bandung 2 MWt, Yogyakarta 100 kWt, dari ringkasan hasil pencarian)', 'Katadata', 'https://katadata.co.id/ekonomi-hijau/energi-baru/66a736d696b88/peneliti-sebut-sdm-indonesia-sudah-mumpuni-bangun-pembangkit-nuklir', '2026-11-08', 2024, 'media'),
  rsg: S('Reaktor Serba Guna G.A. Siwabessy (kritikalitas pertama 29 Jul 1987; daya 30 MW tercapai 23 Mar 1992; operasi rutin 15 MW; dari ringkasan hasil pencarian)', 'Wikipedia (merujuk laporan BATAN)', 'https://en.wikipedia.org/wiki/Reaktor_Serba_Guna_G.A._Siwabessy', '2026-11-08', 2025, 'via-pihak-ketiga', 'CC BY-SA 4.0'),
  brin_bbn: S('BRIN Revitalisasi Fasilitas Bahan Bakar Nuklir untuk Menjamin Operasi Reaktor RSG-GAS (Mar 2026; hanya judul dibaca)', 'RRI', 'https://rri.co.id/makassar/berita-lain/2297760/brin-revitalisasi-fasilitas-bahan-bakar-nuklir-untuk-menjamin-operasi-reaktor-rs', '2026-11-08', 2026, 'media'),
  wna_ph: S('Nuclear Power in the Philippines', 'World Nuclear Association', 'https://world-nuclear.org/information-library/country-profiles/countries-o-s/philippines', '2026-11-08', 2026, 'kajian'),
  wna_uae: S('Nuclear Power in the United Arab Emirates', 'World Nuclear Association', 'https://world-nuclear.org/information-library/country-profiles/countries-t-z/united-arab-emirates', '2026-11-08', 2026, 'kajian'),
  nuscale: S('Facing mounting costs, NuScale cancels small modular reactor project in Utah (9 Nov 2023)', 'POWER Engineering', 'https://www.power-eng.com/nuclear/smrs/facing-mounting-costs-nuscale-cancels-small-modular-reactor-project-in-utah/', '2026-11-08', 2023, 'media'),
  nuscale2: S('NuScale cancels first-of-a-kind nuclear project as costs surge (angka DOE USD 1,4 miliar dari ringkasan hasil pencarian)', 'E&E News', 'https://www.eenews.net/articles/nuscale-cancels-first-of-a-kind-nuclear-project-as-costs-surge/', '2026-11-08', 2023, 'media'),
  korea: regS('perpres-42-2011', 'Perpres 42/2011 pengesahan persetujuan Indonesia dan Korea tentang kerja sama (teks dalam basis regulasi METI)'),
  owid: S('Our World in Data energy-data (Ember Yearly Electricity Data), baris ASEAN (public/data/asean_energi.json)', 'Ember via Our World in Data', 'https://raw.githubusercontent.com/owid/energy-data/master/owid-energy-data.csv', '2026-11-08', 2025, 'via-pihak-ketiga', 'CC BY 4.0'),
};
const UU10_URL = SUMBER.uu10.url;
const barakahPerKw = Math.round(20.4e9 / 5.6e6);

function susunAsal() {
  const bab = {};
  bab['2'] = faq(['den26', 'ibp25', 'detik_tapak'], [
    ['Kapan PLTN pertama Indonesia?', 'When is Indonesia\'s first nuclear plant?', 'Target pemerintah 2032 sampai 2034 dengan kapasitas awal 500 MW (Dewan Energi Nasional, 3 Mar 2026). Pada Februari 2025 Dirjen EBTKE menyebut 250 MW pada 2032; angka awal berbeda antarpernyataan.', 'The government target is 2032 to 2034 with an initial 500 MW (National Energy Council, 3 Mar 2026). In February 2025 the EBTKE director general cited 250 MW in 2032; initial figures differ between statements.'],
    ['Apakah sudah ada izin tapak?', 'Is there a site permit yet?', 'Belum per 12 Agu 2025: Bapeten baru menerbitkan persetujuan evaluasi tapak untuk Thorcon 500 di Pulau Kelasa, dan Direktur Jenderal EBTKE menyatakan belum ada yang menerima izin tapak.', 'Not as of 12 Aug 2025: Bapeten has only issued a site evaluation approval for Thorcon 500 on Kelasa Island, and the EBTKE director general said no one has received a site permit.'],
    ['Siapa pengawas nuklir?', 'Who regulates nuclear?', 'Bapeten (Badan Pengawas Tenaga Nuklir) menerbitkan persetujuan evaluasi tapak dan izin tahapan lain; keputusan akhir proyek di tangan Menteri ESDM menurut Dirjen EBTKE.', 'Bapeten (Nuclear Energy Regulatory Agency) issues the site evaluation approval and later-stage permits; per the EBTKE director general the project\'s final decision rests with the Energy Minister.'],
    ['Apa dasar hukumnya?', 'What is the legal basis?', 'UU 10/1997 tentang Ketenaganukliran, PP 54/2012 (keselamatan instalasi), PP 2/2014 (perizinan), dan PP 40/2025 tentang Kebijakan Energi Nasional yang menempatkan nuklir bukan opsi terakhir.', 'Law 10/1997 on nuclear energy, PP 54/2012 (installation safety), PP 2/2014 (licensing) and PP 40/2025 on National Energy Policy, which no longer treats nuclear as a last resort.'],
    ['Berapa target jangka panjang?', 'What is the long-term target?', 'DEN menyebut 44 GW pada 2060 (35 GW listrik dan 9 GW untuk hidrogen mulai 2045); Februari 2025 ESDM menyebut 42 GW pada 2060.', 'DEN cites 44 GW by 2060 (35 GW for electricity and 9 GW for hydrogen from 2045); in February 2025 the ministry cited 42 GW by 2060.'],
    ['Apakah Indonesia punya reaktor?', 'Does Indonesia have reactors?', 'Ya, tiga reaktor riset BRIN: Serpong 30 MWt, Bandung 2 MWt, Yogyakarta 100 kWt (kutipan pejabat BRIN via Katadata).', 'Yes, three BRIN research reactors: Serpong 30 MWt, Bandung 2 MWt, Yogyakarta 100 kWt (BRIN official quoted via Katadata).'],
    ['Apa itu SMR?', 'What is an SMR?', 'Small modular reactor: reaktor modul kecil, misalnya modul 77 MW pada proyek NuScale yang dibatalkan di AS.', 'Small modular reactor: a small modular reactor, e.g. the 77 MW modules in the cancelled NuScale project in the US.'],
    ['Apakah ada penolakan?', 'Is there opposition?', 'Ya. Warga Bangka Belitung dan aliansi di Kalimantan Barat menolak; IESR menilai Indonesia tidak membutuhkan nuklir (Mongabay, 23 Feb 2025). Pemerintah dan pengembang berpendapat sebaliknya.', 'Yes. Residents of Bangka Belitung and an alliance in West Kalimantan object; IESR says Indonesia does not need nuclear (Mongabay, 23 Feb 2025). The government and developer argue otherwise.'],
  ]);
  bab['3'] = glos(['ed', 'ibp25', 'detik_tapak'], [
    ['PLTN', 'NPP', 'Pembangkit listrik tenaga nuklir.', 'Nuclear power plant.'],
    ['SMR', 'SMR', 'Reaktor modular kecil, umumnya di bawah 300 MWe per unit.', 'Small modular reactor, generally under 300 MWe per unit.'],
    ['Bapeten', 'Bapeten', 'Badan Pengawas Tenaga Nuklir, regulator keselamatan.', 'Nuclear Energy Regulatory Agency, the safety regulator.'],
    ['NEPIO', 'NEPIO', 'Nuclear Energy Program Implementing Organization; badan pelaksana program sesuai pedoman IAEA.', 'Nuclear Energy Program Implementing Organization; the implementing body under IAEA guidance.'],
    ['IAEA', 'IAEA', 'Badan Tenaga Atom Internasional; pedomannya dipakai peta jalan PLTN Indonesia.', 'International Atomic Energy Agency; its guidance underpins Indonesia\'s roadmap.'],
    ['Persetujuan evaluasi tapak', 'Site evaluation approval', 'Tahap awal perizinan tapak; mengizinkan pemohon mengevaluasi lokasi.', 'The first licensing step for a site; lets the applicant evaluate the location.'],
    ['Izin tapak', 'Site permit', 'Izin atas lokasi setelah evaluasi tuntas; belum terbit untuk siapa pun per Agu 2025.', 'Permit for the location after evaluation; not issued to anyone as of Aug 2025.'],
    ['MWt dan MWe', 'MWt and MWe', 'Daya termal dan daya listrik; reaktor riset biasanya dinyatakan dalam MWt.', 'Thermal and electrical power; research reactors are usually quoted in MWt.'],
    ['TMSR', 'TMSR', 'Thorium molten salt reactor; nama dalam proyek Thorcon (TMSR500). Detail teknis tidak ditemukan di sumber.', 'Thorium molten salt reactor; the name in the Thorcon project (TMSR500). Technical detail was not found in the sources.'],
    ['FOAK', 'FOAK', 'First of a kind; unit pertama suatu desain, biasanya paling mahal.', 'First of a kind; the first unit of a design, usually the costliest.'],
  ]);
  bab['4'] = teks(['den26', 'ken', 'ed'], [
    ['Nuklir menghasilkan listrik beban dasar tanpa emisi operasi, dan PP 40/2025 menempatkannya sebagai unsur penting rencana jangka panjang, bukan opsi terakhir (DEN, 3 Mar 2026). Dewan Energi Nasional memproyeksikan porsi nuklir naik dari sekitar 0,5 persen menjadi lebih dari 11 persen energi primer pada akhir 2060.', 'Nuclear gives baseload power without operating emissions, and PP 40/2025 places it as an important element of long-term plans rather than a last resort (DEN, 3 Mar 2026). The National Energy Council projects nuclear rising from about 0.5 percent to over 11 percent of primary energy by end-2060.'],
    ['Risikonya: biaya modal tinggi, waktu bangun panjang, keselamatan, dan penerimaan masyarakat. Bab Kasus menunjukkan proyek yang mangkrak (Bataan) dan dibatalkan (NuScale) di samping yang berhasil (Barakah).', 'The risks: high capital cost, long build time, safety and public acceptance. The cases chapters show stalled (Bataan) and cancelled (NuScale) projects beside a success (Barakah).'],
  ]);
  bab['5'] = rumus(['wna_uae', 'nuscale', 'ed'], [
    ['Biaya modal per kW = Nilai kontrak / Kapasitas (kW)', 'Capital cost per kW = Contract value / Capacity (kW)'],
    ['Pangsa listrik (persen) = Produksi tahunan / Konsumsi listrik x 100', 'Electricity share (percent) = Annual output / Electricity consumption x 100'],
    ['Faktor kapasitas (persen) = Produksi tahunan (MWh) / (Daya MW x 8.760 jam) x 100', 'Capacity factor (percent) = Annual output (MWh) / (Power MW x 8,760 hours) x 100'],
  ], [
    [`Barakah: USD 20,4 miliar / 5,6 juta kW = sekitar USD ${barakahPerKw.toLocaleString('id-ID')} per kW (EST; kontrak sebagian besar harga tetap untuk empat unit APR1400, belum termasuk bunga dan biaya pemilik).`, `Barakah: USD 20.4 billion / 5.6 million kW = about USD ${barakahPerKw.toLocaleString('en-US')} per kW (EST; a largely fixed-price contract for four APR1400 units, excluding interest and owner costs).`],
    ['Pembanding SMR: Wood Mackenzie memperkirakan USD 6.000 sampai 8.000 per kW untuk unit pertama sejenis (via POWER Engineering).', 'SMR comparison: Wood Mackenzie estimates USD 6,000 to 8,000 per kW for first-of-a-kind units (via POWER Engineering).'],
  ]);
  bab['6'] = langkah(['ed', 'ibp25', 'detik_tapak'], [
    ['Kebijakan dan kelembagaan', 'Policy and institutions', 'PP 40/2025, RUPTL, dan pembentukan NEPIO menurut pedoman IAEA; tiga satuan tugas memilih tapak setelah NEPIO diformalkan (Feb 2025).', 'PP 40/2025, RUPTL and an NEPIO per IAEA guidance; three task forces select the site once NEPIO is formalised (Feb 2025).', 'Kementerian ESDM, DEN', 'Energy Ministry, DEN'],
    ['Evaluasi tapak', 'Site evaluation', 'Enam aspek bahaya eksternal: seismisitas, geoteknik, vulkanisme, meteorologi dan hidrologi, peristiwa akibat manusia, dispersi radioaktif.', 'Six external hazard aspects: seismicity, geotechnics, volcanism, meteorology and hydrology, human-induced events, radioactive dispersion.', 'Pemohon, Bapeten', 'Applicant, Bapeten'],
    ['Izin tapak, konstruksi, komisioning, operasi', 'Site, construction, commissioning, operating permits', 'Urutan izin menurut Peraturan Bapeten 1/2022 (ringkasan Kontan); izin tapak juga memerlukan persetujuan desain dan izin lingkungan.', 'Permit sequence under Bapeten Regulation 1/2022 (Kontan summary); the site permit also needs design approval and an environmental permit.', 'Bapeten, KLH, ESDM', 'Bapeten, Environment Ministry, Energy Ministry'],
    ['Konstruksi dan bahan bakar', 'Construction and fuel', 'Pemasok teknologi, kontraktor, dan rantai bahan bakar; pada Barakah kontraktor utama KEPCO dan bahan bakar dibeli dari beberapa pemasok.', 'Technology vendor, contractors and fuel chain; at Barakah the main contractor was KEPCO and fuel was bought from several suppliers.', 'Vendor, operator', 'Vendor, operator'],
    ['Operasi dan penghentian', 'Operation and decommissioning', 'Operator berizin dan pengawasan berkelanjutan.', 'Licensed operator and continuous oversight.', 'Operator, Bapeten', 'Operator, Bapeten'],
  ]);
  bab['7'] = grafik(['ibp25'], 'kolom', ['Target kapasitas nuklir Indonesia menurut ESDM (Feb 2025)', 'Indonesia nuclear capacity target per Energy Ministry (Feb 2025)'], 'GW', 2, [[['Target kapasitas', 'Capacity target'], true, [['2032', 0.25], ['2035', 3], ['2040', 9], ['2060', 42]]]],
    ['Pada 3 Mar 2026 DEN menyebut 44 GW untuk 2060 dan unit pertama 500 MW pada 2032 sampai 2034; angka antar-pernyataan berbeda dan belum diselaraskan di sumber.', 'On 3 Mar 2026 DEN cited 44 GW for 2060 and a 500 MW first unit in 2032 to 2034; figures differ between statements and are not reconciled in the sources.']);
  bab['8'] = tabel(['ibp25', 'mongabay_gelasa'], 13, [kol('wilayah', 'Calon wilayah tapak (29 lokasi di 13 wilayah)', 'Candidate site region (29 sites in 13 regions)'), kol('catatan', 'Catatan', 'Note')],
    [['Sumatera Utara', 'North Sumatra'], ['Kepulauan Riau', 'Riau Islands'], ['Kepulauan Bangka Belitung', 'Bangka Belitung Islands'], ['Banten', 'Banten'], ['Jawa Tengah', 'Central Java'], ['Bali', 'Bali'], ['Kalimantan Barat', 'West Kalimantan'], ['Kalimantan Timur', 'East Kalimantan'], ['Sulawesi Tengah', 'Central Sulawesi'], ['Maluku', 'Maluku'], ['Papua Barat', 'West Papua'], ['Papua Tengah', 'Central Papua'], ['Papua Selatan', 'South Papua']].map(([a, b]) => ({ wilayah: T(a, b),
      catatan: a === 'Kepulauan Bangka Belitung' ? T('Pulau Kelasa (Gelasa): persetujuan evaluasi tapak Thorcon; warga menolak', 'Kelasa (Gelasa) Island: Thorcon site evaluation approval; residents object') : a === 'Kalimantan Barat' ? T('Aliansi Kalimantan Barat Tolak PLTN menentang', 'The West Kalimantan Anti-Nuclear Alliance objects') : T('Perlu diverifikasi satuan tugas', 'To be verified by the task forces') })),
    ['Daftar 13 wilayah dari laporan ESDM yang dikutip Dirjen EBTKE (Feb 2025); daftar sumber menyebut wilayah tanpa memisahkan Kalimantan Barat dan Timur secara eksplisit; keduanya dimasukkan. Tapak belum diverifikasi.', 'The 13-region list comes from the ministry report cited by the EBTKE director general (Feb 2025); both West and East Kalimantan are listed. Sites are not yet verified.']);
  bab['9'] = tabel(['ibp25', 'detik_tapak', 'den26', 'brin_sdm', 'mongabay_gelasa'], 8, [kol('nama', 'Pelaku', 'Actor'), kol('peran', 'Peran', 'Role'), kol('rujuk', 'Dasar', 'Basis')], [
    { nama: 'Kementerian ESDM (Ditjen EBTKE)', peran: T('Penetapan program dan keputusan akhir proyek nuklir', 'Programme setting and final project decisions'), rujuk: 'detikFinance, 12 Agu 2025' },
    { nama: 'Dewan Energi Nasional (DEN)', peran: T('Kebijakan dan target 44 GW 2060', 'Policy and the 44 GW 2060 target'), rujuk: 'CNBC, 3 Mar 2026' },
    { nama: 'Bapeten', peran: T('Regulator; menerbitkan persetujuan evaluasi tapak', 'Regulator; issued the site evaluation approval'), rujuk: 'detikFinance, 12 Agu 2025' },
    { nama: 'BRIN', peran: T('Mengoperasikan tiga reaktor riset; revitalisasi fasilitas bahan bakar', 'Operates three research reactors; revitalising fuel facilities'), rujuk: 'Katadata; RRI 2026' },
    { nama: 'PT Thorcon Power Indonesia', peran: T('Pemohon evaluasi tapak PLTN TMSR500 di Pulau Gelasa (didirikan 2021)', 'Applicant for the TMSR500 site evaluation on Gelasa Island (founded 2021)'), rujuk: 'Mongabay, 23 Feb 2025' },
    { nama: 'IESR', peran: T('Pengkritik rencana nuklir (Fabby Tumiwa)', 'Critic of the nuclear plan (Fabby Tumiwa)'), rujuk: 'Mongabay, 23 Feb 2025' },
  ]);
  const tgl = pj.cod_target?.[0]?.nilai;
  bab['10'] = tabel(['ruptl', 'detik_tapak', 'brin_sdm', 'rsg'], 8, [kol('nama', 'Proyek atau fasilitas', 'Project or facility'), kol('lokasi', 'Lokasi', 'Location'), kol('ukuran', 'Ukuran', 'Size'), kol('status', 'Status menurut sumber', 'Status per source')], [
    { nama: 'PLTN Tersebar (RUPTL 2025-2034, skenario RE Base)', lokasi: 'Kepulauan Bangka Belitung', ukuran: T(`${pj.kapasitas[0].nilai} MW`, `${pj.kapasitas[0].nilai} MW`), status: T(`Rencana; COD ${tgl} (RE Base); titik peta adalah pusat provinsi, bukan lokasi proyek`, `Plan; COD ${tgl} (RE Base); the map point is the province centroid, not the project site`) },
    { nama: 'Thorcon TMSR500', lokasi: 'Pulau Gelasa (Kelasa), Bangka Tengah', ukuran: T('500 MW menurut keterangan pengembang dan media', '500 MW per developer and media statements'), status: T('Persetujuan evaluasi tapak Bapeten (keputusan 30 Jul 2025); belum ada izin tapak', 'Bapeten site evaluation approval (decision 30 Jul 2025); no site permit yet') },
    { nama: 'Reaktor Serba Guna G.A. Siwabessy', lokasi: 'Serpong', ukuran: T('30 MWt; operasi rutin 15 MW', '30 MWt; routine operation at 15 MW'), status: T('Beroperasi sejak kritis 1987; BRIN merevitalisasi fasilitas bahan bakar (Mar 2026)', 'Operating since criticality in 1987; BRIN is revitalising fuel facilities (Mar 2026)') },
    { nama: 'Reaktor riset Bandung', lokasi: 'Bandung', ukuran: T('2 MWt', '2 MWt'), status: T('Hanya untuk edukasi menurut sumber', 'Education use only per source') },
    { nama: 'Reaktor riset Yogyakarta', lokasi: 'Yogyakarta', ukuran: T('100 kWt', '100 kWt'), status: T('Pendidikan dan penelitian', 'Education and research') },
  ]);
  bab['12'] = tabel(['ed'], 10, kolRegulasi, tabelRegulasi({
    'uu-10-1997': ['Dasar ketenaganukliran: pemanfaatan, pengawasan, dan perizinan.', 'Basis of nuclear law: utilisation, oversight and licensing.'],
    'pp-2-2014': ['Perizinan instalasi nuklir dan pemanfaatan bahan nuklir.', 'Licensing of nuclear installations and use of nuclear material.'],
    'pp-54-2012': ['Keselamatan dan keamanan instalasi nuklir.', 'Safety and security of nuclear installations.'],
    'pp-52-2022': ['Keselamatan dan keamanan pertambangan bahan galian nuklir.', 'Safety and security of nuclear mineral mining.'],
    'lainnya-b204020-1-2022': ['Perizinan berusaha berbasis risiko sektor ketenaganukliran (rujukan Thorcon pada Peraturan Bapeten 1/2022 menurut media).', 'Risk-based business licensing in the nuclear sector (Thorcon referred to Bapeten Regulation 1/2022 per media).'],
    'lainnya-b204016-3-2021': ['Standar kegiatan usaha dan produk perizinan berbasis risiko ketenaganukliran.', 'Business-activity and product standards for risk-based nuclear licensing.'],
    'perpres-46-2013': ['Badan Tenaga Nuklir Nasional (kelembagaan lama; BRIN kini memegang riset).', 'National Nuclear Energy Agency (former body; BRIN now holds research).'],
    'pp-40-2025': ['Kebijakan Energi Nasional: nuklir dalam rencana jangka panjang.', 'National Energy Policy: nuclear in long-term plans.'],
  }), ['Peraturan Bapeten 1/2022 sendiri tidak ada di basis repo; yang tertaut adalah peraturan perizinan berbasis risiko yang tercatat.', 'Bapeten Regulation 1/2022 itself is not in the repo base; the linked items are the recorded risk-based licensing rules.']);
  bab['13'] = linimasa(['rsg', 'ken', 'ibp25', 'mongabay_gelasa', 'detik_tapak', 'den26', 'wna_ph'], [
    ['1987-07-29', 'Reaktor RSG-GAS Serpong mencapai kritikalitas pertama', 'The Serpong RSG-GAS reactor reaches first criticality', 'https://en.wikipedia.org/wiki/Reaktor_Serba_Guna_G.A._Siwabessy'],
    ['1992-03-23', 'RSG-GAS mencapai daya nominal 30 MW termal', 'RSG-GAS reaches nominal 30 MW thermal power', 'https://en.wikipedia.org/wiki/Reaktor_Serba_Guna_G.A._Siwabessy'],
    ['1997-04-10', 'UU 10/1997 tentang Ketenaganukliran ditetapkan', 'Law 10/1997 on nuclear energy enacted', UU10_URL],
    ['2025-01-21', 'PT Thorcon Power Indonesia mengajukan evaluasi tapak', 'PT Thorcon Power Indonesia applies for site evaluation', 'https://mongabay.co.id/2025/02/23/tuai-kritik-bagaimana-perkembangan-pltn-di-pulau-gelasa/'],
    ['2025-02-22', 'Dirjen EBTKE: PLTN pertama 2032, 29 lokasi potensial di 13 wilayah', 'EBTKE director general: first plant in 2032, 29 potential sites in 13 regions', 'https://indonesiabusinesspost.com/3648/energy-and-resources/profiles'],
    ['2025-07-30', 'Keputusan Bapeten persetujuan evaluasi tapak Thorcon 500', 'Bapeten decision on Thorcon 500 site evaluation approval', 'https://finance.detik.com/energi/d-8056649/esdm-tegaskan-belum-terbitkan-izin-tapak-pltn-thorcon-di-bangka-belitung'],
    ['2025-08-11', 'ESDM: belum ada yang menerima izin tapak', 'Energy Ministry: no one has received a site permit', 'https://finance.detik.com/energi/d-8056649/esdm-tegaskan-belum-terbitkan-izin-tapak-pltn-thorcon-di-bangka-belitung'],
    ['2025-09-15', 'PP 40/2025 tentang Kebijakan Energi Nasional ditetapkan', 'PP 40/2025 on National Energy Policy enacted', null],
    ['2026-03-03', 'DEN: target 44 GW pada 2060; PLTN pertama 2032 sampai 2034', 'DEN: 44 GW target for 2060; first plant 2032 to 2034', 'https://www.cnbcindonesia.com/news/20260303145941-4-715590/ambisi-ri-2060-bisa-punya-44-gw-pembangkit-nuklir'],
    ['2032-01-01', 'Tahun awal target operasi PLTN pertama (tahun 2032; tanggal tepat tidak ada)', 'Start year of the first plant operation target (year 2032; exact date not given)', null],
  ]);
  bab['16'] = teks(['ibp25'], [['Pemerintah menunggu RUU Energi Baru dan Energi Terbarukan (RUU EBET) dan revisi UU Ketenagalistrikan (Dirjen EBTKE, Feb 2025). Forum konsultasi METI dan posisi METI tidak ditemukan di sumber yang dibaca.', 'The government awaits the New and Renewable Energy bill (RUU EBET) and a revision of the Electricity Law (EBTKE director general, Feb 2025). METI consultation forums and the METI position were not found in the sources read.']]);
  bab['15'] = langkah(['detik_tapak', 'mongabay_gelasa'], [
    ['Ajukan evaluasi tapak', 'Apply for site evaluation', 'Pemohon mengajukan program dan sistem manajemen evaluasi tapak; Thorcon mengajukan pada 21 Jan 2025 dan Bapeten menyerahkan persetujuan pada 13 Feb 2025.', 'The applicant submits a site evaluation programme and management system; Thorcon applied on 21 Jan 2025 and Bapeten handed over the approval on 13 Feb 2025.', 'Pemohon, Bapeten', 'Applicant, Bapeten'],
    ['Lakukan evaluasi enam aspek', 'Carry out the six-aspect evaluation', 'Bapeten menyebut evaluasi tapak sekitar satu tahun dan menolak tapak yang patahannya dalam jarak 5 km.', 'Bapeten says site evaluation takes about a year and will reject a site with a fault within 5 km.', 'Pemohon', 'Applicant'],
    ['Peroleh izin tapak', 'Obtain the site permit', 'Perlu persetujuan desain dan izin lingkungan; keputusan akhir proyek ada pada Menteri ESDM.', 'Needs design approval and an environmental permit; the final project decision rests with the Energy Minister.', 'Bapeten, KLH, ESDM', 'Bapeten, Environment Ministry, Energy Ministry'],
    ['Izin konstruksi, komisioning, operasi', 'Construction, commissioning, operating permits', 'Tahap izin berikutnya menurut Peraturan Bapeten 1/2022.', 'Subsequent permit stages under Bapeten Regulation 1/2022.', 'Bapeten', 'Bapeten'],
  ]);
  bab['17'] = teks(['nuscale', 'wna_uae', 'mongabay_gelasa'], [
    ['Desain SMR terdepan di dunia Barat, NuScale, memakai modul 77 MW; proyek enam modul (462 MW) di Idaho dibatalkan pada 9 Nov 2023 (POWER Engineering).', 'NuScale, the leading Western SMR design, uses 77 MW modules; the six-module (462 MW) project in Idaho was cancelled on 9 Nov 2023 (POWER Engineering).'],
    ['Desain besar yang terbukti: APR1400 Korea di Barakah, empat unit total 5,6 GW (World Nuclear Association). Thorcon mengusulkan reaktor garam cair thorium (TMSR500) di Indonesia, tetapi detail kapasitas dan biaya tidak ada di artikel yang dibaca, dan IESR menyebut belum ada proyek percontohan sejenis (Mongabay).', 'A proven large design: Korea\'s APR1400 at Barakah, four units totalling 5.6 GW (World Nuclear Association). Thorcon proposes a thorium molten salt reactor (TMSR500) in Indonesia, but the article read has no capacity or cost detail, and IESR says no comparable pilot exists (Mongabay).'],
  ]);
  bab['18'] = teks(['brin_sdm', 'brin_bbn', 'rsg'], [
    ['BRIN mengoperasikan reaktor riset Serpong 30 MWt (kritis 1987) dan sedang merevitalisasi fasilitas bahan bakar nuklir (Mar 2026). Seorang pejabat BRIN menyebut tiga reaktor riset dan SDM yang mumpuni (Katadata).', 'BRIN operates the 30 MWt Serpong research reactor (critical in 1987) and is revitalising nuclear fuel facilities (Mar 2026). A BRIN official cites three research reactors and capable personnel (Katadata).'],
    ['Paten dan startup nuklir Indonesia tidak ditemukan di sumber yang dibaca.', 'Indonesian nuclear patents and start-ups were not found in the sources read.'],
  ]);
  bab['19'] = tabel(['nuscale', 'wna_uae', 'wna_ph', 'mongabay_gelasa'], 8, [kol('item', 'Ukuran biaya', 'Cost measure'), kol('nilai', 'Nilai', 'Value'), kol('sumber', 'Sumber', 'Source')], [
    { item: T('SMR unit pertama (perkiraan industri)', 'SMR first of a kind (industry estimate)'), nilai: 'USD 6.000 sampai 8.000 per kW', sumber: 'Wood Mackenzie via POWER Engineering, 9 Nov 2023' },
    { item: T('Harga target listrik NuScale UAMPS', 'NuScale UAMPS target power price'), nilai: T('USD 89 per MWh (naik dari 58)', 'USD 89 per MWh (up from 58)'), sumber: 'POWER Engineering' },
    { item: T('Kontrak Barakah (4 unit)', 'Barakah contract (4 units)'), nilai: T('sekitar USD 20,4 miliar', 'about USD 20.4 billion'), sumber: 'World Nuclear Association' },
    { item: T('Pembiayaan total Barakah', 'Barakah total financing'), nilai: T('sekitar USD 24,4 miliar', 'about USD 24.4 billion'), sumber: 'World Nuclear Association' },
    { item: T('Bataan: biaya bangun (1984)', 'Bataan: construction cost (1984)'), nilai: 'USD 1,9 miliar', sumber: 'World Nuclear Association' },
    { item: T('Bataan: taksiran rehabilitasi (Nov 2022)', 'Bataan: rehabilitation estimate (Nov 2022)'), nilai: 'USD 2,3 miliar', sumber: 'World Nuclear Association' },
    { item: T('Pembengkakan proyek berjalan (kritik IESR)', 'Overrun in projects under construction (IESR criticism)'), nilai: T('2 sampai 3 kali rencana', '2 to 3 times plan'), sumber: 'Mongabay, 23 Feb 2025' },
  ], ['Biaya PLTN untuk Indonesia belum ada di sumber yang dibaca; Thorcon tidak mencantumkan biaya di artikel Mongabay.', 'No nuclear plant cost for Indonesia is in the sources read; Thorcon gives no cost in the Mongabay article.']);
  bab['20'] = tabel(['wna_uae', 'wna_ph', 'nuscale', 'den26', 'owid'], 6, [kol('negara', 'Negara dan proyek', 'Country and project'), kol('ukuran', 'Ukuran', 'Size'), kol('status', 'Status', 'Status'), kol('catatan', 'Catatan', 'Note')], [
    { negara: 'UEA: Barakah', ukuran: T('4 x APR1400, 5,6 GW', '4 x APR1400, 5.6 GW'), status: T('Unit 4 komersial Sep 2024; sekitar 25 persen listrik UEA', 'Unit 4 commercial Sep 2024; about 25 percent of UAE electricity'), catatan: T('Kontrak sebagian besar harga tetap', 'Largely fixed-price contract') },
    { negara: 'Filipina: Bataan', ukuran: T('621 MWe', '621 MWe'), status: T('Rampung 1984, tidak pernah beroperasi', 'Completed 1984, never operated'), catatan: T('Studi rehabilitasi KHNP sejak 2025', 'KHNP rehabilitation study since 2025') },
    { negara: 'AS: NuScale UAMPS', ukuran: T('6 x 77 MW', '6 x 77 MW'), status: T('Dibatalkan 9 Nov 2023', 'Cancelled 9 Nov 2023'), catatan: T('Harga naik dan langganan kurang', 'Price up, subscription short') },
    { negara: 'Indonesia', ukuran: T('0,5 GW awal; 44 GW 2060 (target)', '0.5 GW initial; 44 GW 2060 (target)'), status: T('Belum ada izin tapak (Agu 2025)', 'No site permit (Aug 2025)'), catatan: T('Reaktor riset saja yang beroperasi', 'Only research reactors operate') },
  ]);
  bab['21'] = teks(['ed', 'wna_uae', 'wna_ph', 'nuscale'], [
    hp('proyek besar yang selesai (Barakah) memiliki regulator mapan, kontrak harga tetap, dan pembiayaan sovereign; proyek yang gagal (Bataan, NuScale) bergantung pada keputusan politik berganti atau kecukupan pelanggan.', 'projects that finished (Barakah) had an established regulator, a fixed-price contract and sovereign financing; projects that failed (Bataan, NuScale) depended on shifting politics or enough subscribers.'),
    hp('urutan yang masih terbuka di Indonesia: regulator, pembiayaan, dan penerimaan masyarakat belum terjawab sebelum teknologi dipilih.', 'the open sequence in Indonesia: regulator, financing and public acceptance remain unanswered before technology is chosen.'),
  ]);
  bab['22'] = teks(['owid'], [[adaNuk.length ? `Pembangkit nuklir beroperasi di: ${adaNuk.join(', ')} (data OWID/Ember, baris ASEAN repo).` : 'Menurut data OWID/Ember yang dimuat repo, tidak ada negara ASEAN dalam daftar dengan porsi listrik nuklir di atas nol; porsi nuklir Indonesia 0 persen (2024).', adaNuk.length ? `Nuclear generation operates in: ${adaNuk.join(', ')} (OWID/Ember data, repo ASEAN rows).` : 'Per the OWID/Ember data held in the repo, no ASEAN country in the list has a nuclear electricity share above zero; Indonesia\'s nuclear share is 0 percent (2024).']], ['Filipina memiliki PLTN rampung yang tidak beroperasi (Bataan).', 'The Philippines has a completed plant that never operated (Bataan).']);
  bab['23'] = teks(['korea', 'ibp25', 'wna_ph'], [
    ['Perpres 42/2011 mengesahkan persetujuan kerja sama Indonesia dan Korea (dasar kerja sama tertaut di basis regulasi METI; isi persetujuan tidak dibaca). Peta jalan PLTN mengikuti pedoman IAEA (Feb 2025).', 'Perpres 42/2011 ratifies an Indonesia-Korea cooperation agreement (linked in the METI regulation base; the agreement text was not read). The nuclear roadmap follows IAEA guidance (Feb 2025).'],
    ['Pembanding kawasan: KHNP Korea mendanai studi rehabilitasi Bataan (Okt 2024).', 'Regional comparison: Korea\'s KHNP funded the Bataan rehabilitation study (Oct 2024).'],
  ]);
  bab['24'] = teks(['wna_uae', 'ibp25'], [
    ['Barakah dibiayai sekitar USD 24,4 miliar: pinjaman langsung sekitar USD 19,6 miliar (KEXIM 2,5 miliar; empat bank komersial 250 juta; hingga 16,2 miliar dari Departemen Keuangan Abu Dhabi) dan ekuitas USD 4,7 miliar dari ENEC dan KEPCO (World Nuclear Association).', 'Barakah was financed with about USD 24.4 billion: direct loans of about USD 19.6 billion (KEXIM 2.5 billion; four commercial banks 250 million; up to 16.2 billion from Abu Dhabi\'s Department of Finance) and USD 4.7 billion equity from ENEC and KEPCO (World Nuclear Association).'],
    [`Struktur pembiayaan PLTN Indonesia belum ada di sumber. Pendanaan publik internasional untuk nuklir Indonesia dalam basis IRENA/OECD hanya USD ${nf(nukTot, 1)} juta kumulatif 2006 sampai 2023 (nilai USD 2023, berbagai proyek kecil).`, `The financing structure of an Indonesian plant is not in the sources. International public finance for Indonesian nuclear in the IRENA/OECD database totals only USD ${nfe(nukTot, 1)} million cumulative from 2006 to 2023 (2023 USD, small projects).`],
  ]);
  bab['25'] = rumus(['wna_uae', 'ed'], [
    ['Biaya modal per kW = Nilai kontrak / Kapasitas (kW)', 'Capital cost per kW = Contract value / Capacity (kW)'],
    ['Lama bangun (tahun) = Tahun operasi komersial - Tahun mulai konstruksi', 'Build time (years) = Commercial operation year - Construction start year'],
  ], [[`Barakah unit 1: konstruksi Jul 2012, komersial Apr 2021 = sekitar 8,8 tahun (EST); keempat unit komersial pada Sep 2024. Biaya modal sekitar USD ${barakahPerKw.toLocaleString('id-ID')} per kW (EST).`, `Barakah unit 1: construction Jul 2012, commercial Apr 2021 = about 8.8 years (EST); all four units commercial by Sep 2024. Capital cost about USD ${barakahPerKw.toLocaleString('en-US')} per kW (EST).`]]);
  bab['27'] = teks(['mongabay_gelasa', 'wna_ph', 'detik_tapak'], [
    ['Warga Bangka Belitung menolak rencana PLTN karena khawatir bahaya bagi manusia dan lingkungan; TUK Indonesia menilai rencana ini tidak sesuai visi pemerintah dan mengurangi partisipasi masyarakat (Mongabay).', 'Residents of Bangka Belitung reject the plan fearing harm to people and the environment; TUK Indonesia says the plan does not fit the government vision and reduces public participation (Mongabay).'],
    ['Bapeten menyatakan akan menolak tapak bila ada patahan dalam jarak 5 km, dan evaluasi mencakup seismisitas dan dispersi radioaktif. Di Filipina, dewan Morong yang menaungi Bataan menetapkan wilayahnya zona bebas nuklir (Jun 2026).', 'Bapeten says it will reject a site with a fault within 5 km, and the evaluation covers seismicity and radioactive dispersion. In the Philippines, the Morong council hosting Bataan declared its municipality a non-nuclear zone (Jun 2026).'],
  ]);
  bab['28'] = teks(['brin_sdm', 'ibp25'], [['Seorang peneliti menyebut SDM Indonesia mumpuni membangun PLTN (judul Katadata, Jul 2024); jumlah ahli bersertifikat dan program pendidikan tidak ada dalam sumber yang dibaca.', 'A researcher says Indonesian personnel are capable of building a plant (Katadata headline, Jul 2024); the number of certified experts and education programmes is not in the sources read.']]);
  bab['29'] = teks(['mongabay_gelasa', 'den26', 'detik_tapak'], [
    ['Pendukung: pemerintah menilai nuklir bukan lagi opsi terakhir dan perlu untuk NZE 2060 (DEN, Mar 2026). Pengkritik: Fabby Tumiwa (IESR) menyatakan Indonesia tidak membutuhkan nuklir karena energi terbarukan dapat mewujudkan kemandirian, dan menyoroti pembengkakan biaya 2 sampai 3 kali pada proyek berjalan; ia juga menyebut Thorcon belum punya rekam jejak (Mongabay, 23 Feb 2025).', 'Supporters: the government says nuclear is no longer a last resort and is needed for NZE 2060 (DEN, Mar 2026). Critics: Fabby Tumiwa (IESR) says Indonesia does not need nuclear because renewables can deliver self-sufficiency, and cites 2 to 3 times cost overruns on projects under construction; he also says Thorcon lacks a track record (Mongabay, 23 Feb 2025).'],
    ['Bapeten menyatakan netral soal perlu tidaknya nuklir dan hanya memastikan standar terpenuhi; pengembang menyatakan sedang menjalani proses perizinan (Listrik Indonesia, judul).', 'Bapeten says it is neutral on whether nuclear is needed and only ensures standards are met; the developer says licensing is under way (Listrik Indonesia, headline).'],
  ]);
  bab['30'] = tabel(['ibp25', 'den26', 'cnbc_rup'], 8, [kol('item', 'Sasaran', 'Target'), kol('nilai', 'Nilai', 'Value'), kol('tahun', 'Tahun', 'Year'), kol('sumber', 'Sumber', 'Source')], [
    { item: T('PLTN pertama (ESDM)', 'First plant (Energy Ministry)'), nilai: '250 MW', tahun: '2032', sumber: 'Feb 2025' },
    { item: T('PLTN pertama (DEN)', 'First plant (DEN)'), nilai: '500 MW', tahun: T('2032 sampai 2034', '2032 to 2034'), sumber: 'Mar 2026' },
    { item: T('Nuklir dalam RUPTL 2025-2034', 'Nuclear in RUPTL 2025-2034'), nilai: '0,5 GW', tahun: '2034', sumber: 'CNBC, 4 Jun 2025' },
    { item: T('Kapasitas nuklir kumulatif', 'Cumulative nuclear capacity'), nilai: '3 GW', tahun: '2035', sumber: 'Feb 2025' },
    { item: T('Kapasitas nuklir kumulatif', 'Cumulative nuclear capacity'), nilai: '9 GW', tahun: '2040', sumber: 'Feb 2025' },
    { item: T('Kapasitas nuklir total (DEN: 35 GW listrik, 9 GW hidrogen)', 'Total nuclear capacity (DEN: 35 GW power, 9 GW hydrogen)'), nilai: '44 GW', tahun: '2060', sumber: 'Mar 2026' },
    { item: T('Porsi energi primer', 'Share of primary energy'), nilai: T('lebih dari 11 persen', 'over 11 percent'), tahun: '2060', sumber: 'Mar 2026' },
  ]);
  bab['31'] = teks(['ed'], [
    hp('pengembang dan pemasok: peluang awal ada pada rantai pasok non-nuklir (sipil, kelistrikan, logistik) dan jasa keselamatan, bukan reaktor.', 'developers and suppliers: early opportunities lie in the non-nuclear supply chain (civil, electrical, logistics) and safety services, not the reactor.'),
    hp('investor: nilai kepastian izin dan pembeli listrik sebelum modal masuk; pemda: siapkan diskusi publik sejak sebelum evaluasi tapak; akademisi: kapasitas BRIN sebagai mitra uji.', 'investors: value permit and offtaker certainty before capital enters; local governments: prepare public discussion before site evaluation; academics: BRIN capacity as a test partner.'),
  ]);
  bab['32'] = teks(['detik_tapak', 'ibp25', 'den26'], [
    ['Penerbitan izin tapak pertama dan pembentukan NEPIO beserta tiga satuan tugas pemilih tapak.', 'Issuance of the first site permit and creation of NEPIO and the three site-selection task forces.'],
    ['Penyelarasan angka kapasitas awal (250 atau 500 MW) dan target 2060 (42 atau 44 GW).', 'Reconciliation of the initial capacity (250 or 500 MW) and the 2060 target (42 or 44 GW).'],
    ['Hasil studi rehabilitasi Bataan oleh KHNP dan pembentukan regulator PhilATOM di Filipina sebagai pembanding kawasan.', 'Results of KHNP\'s Bataan rehabilitation study and the creation of the PhilATOM regulator in the Philippines as a regional comparison.'],
  ]);
  bab['36'] = tabel(['wna_uae', 'wna_ph', 'nuscale', 'ibp25'], 6, [kol('judul', 'Dokumen', 'Document', { url: 'url' }), kol('penerbit', 'Penerbit', 'Publisher'), kol('mengapa', 'Mengapa dibaca', 'Why read it')], [
    { judul: 'Nuclear Power in the United Arab Emirates', penerbit: 'World Nuclear Association', url: SUMBER.wna_uae.url, mengapa: T('Tabel waktu, kontrak, dan pembiayaan Barakah', 'Barakah timeline, contract and financing') },
    { judul: 'Nuclear Power in the Philippines', penerbit: 'World Nuclear Association', url: SUMBER.wna_ph.url, mengapa: T('Riwayat Bataan', 'History of Bataan') },
    { judul: 'NuScale cancels SMR project in Utah', penerbit: 'POWER Engineering', url: SUMBER.nuscale.url, mengapa: T('Mengapa proyek SMR dibatalkan', 'Why the SMR project was cancelled') },
  ]);
  bab['38'] = teks(['ed', 'wna_uae', 'detik_tapak'], [
    ['Sumber: media nasional dan internasional, profil negara World Nuclear Association, dan basis regulasi serta data proyek repo, dibaca 8 Nov 2026. Beberapa halaman menolak baca penuh; angka dari ringkasan hasil pencarian diberi catatan.', 'Sources: national and international media, World Nuclear Association country profiles, and the repo regulation and project data, read on 8 Nov 2026. Some pages refused full reads; figures from search summaries are noted.'],
    ['Batas: tidak ada dokumen resmi KEN/RUKN yang dibaca langsung; status Bapeten setelah Agu 2025 tidak ditemukan; angka kapasitas awal berbeda antarpernyataan. EST berarti hitung sendiri; Hipotesis berarti sintesis METI.', 'Limits: no official KEN/RUKN document was read directly; Bapeten status after Aug 2025 was not found; initial capacity figures differ between statements. EST means self-derived; Hypothesis means METI synthesis.'],
  ]);

  bab['39'] = { tipe: 'kasus', sumber: ['wna_uae', 'rsg', 'brin_sdm', 'brin_bbn'], catatan: T('Hanya satu kasus berhasil Indonesia (reaktor riset) dan satu luar negeri (Barakah) yang bersumber; kasus Korea dan Prancis tidak dibaca.', 'Only one Indonesian success (a research reactor) and one foreign success (Barakah) are sourced; Korea and France cases were not read.'), butir: [
    kas({ id: 'barakah', nama: 'Barakah, Uni Emirat Arab', jenis: 'berhasil', negara: 'AE', lokasi: ['Abu Dhabi, UEA', 'Abu Dhabi, UAE'],
      profil: [['Kapasitas', 'Capacity', 5.6, 'GW'], ['Unit', 'Units', '4 x APR1400', null], ['Kontraktor utama', 'Main contractor', 'Konsorsium KEPCO', null], ['Regulator', 'Regulator', 'FANR', null]],
      tindakan: [['Memilih desain Korea, kontrak sebagian besar harga tetap, dan membiayai lewat pinjaman sovereign plus ekuitas operator.', 'Chose a Korean design, a largely fixed-price contract, and financed it with sovereign loans plus operator equity.']],
      sebab: [['Regulator tersendiri (FANR), kontrak harga tetap, dan pembiayaan pemerintah Abu Dhabi menurut World Nuclear Association.', 'A dedicated regulator (FANR), a fixed-price contract and Abu Dhabi government financing per the World Nuclear Association.']],
      angka: [['Kontrak', 'Contract', 20.4, 1, 'miliar USD', 'wna_uae', false], ['Pembiayaan total', 'Total financing', 24.4, 1, 'miliar USD', 'wna_uae', false], ['Pangsa listrik UEA', 'Share of UAE electricity', 25, 0, 'persen', 'wna_uae', false]],
      pelajaran: [['Unit berurutan (1 sampai 4) selesai dalam rentang 4 tahun setelah unit pertama sambung jaringan (Agu 2020 sampai Mar 2024).', 'Sequential units (1 to 4) were completed within about 4 years after the first grid connection (Aug 2020 to Mar 2024).']],
      kronologi: [['2009-12-31', 'ENEC memilih konsorsium KEPCO (Des 2009).', 'ENEC selects the KEPCO consortium (Dec 2009).'], ['2012-07-01', 'Konstruksi unit 1 dimulai (Jul 2012).', 'Construction of unit 1 begins (Jul 2012).'], ['2020-08-19', 'Unit 1 tersambung jaringan.', 'Unit 1 connects to the grid.'], ['2024-09-30', 'Unit 4 komersial (Sep 2024).', 'Unit 4 commercial (Sep 2024).']],
      faktor: { regulator: true, pembiayaan: true, penerimaan: true, kontrak_harga_tetap: true }, sumber: ['wna_uae'] }),
    kas({ id: 'rsg-gas', nama: 'Reaktor Serba Guna G.A. Siwabessy, Serpong', jenis: 'berhasil', negara: 'ID', lokasi: ['Serpong, Banten', 'Serpong, Banten'],
      profil: [['Daya', 'Power', 30, 'MWt'], ['Kritis pertama', 'First criticality', '29 Jul 1987', null], ['Operasi rutin', 'Routine operation', '15 MW', null]],
      tindakan: [['Mengoperasikan reaktor riset multiguna di bawah pengawasan Bapeten selama puluhan tahun dan merevitalisasi bahan bakar.', 'Operated a multipurpose research reactor under Bapeten oversight for decades and revitalised fuel.']],
      sebab: [['Operator negara berkesinambungan (BATAN lalu BRIN) dan daya tertentu dengan persetujuan Bapeten (ringkasan Wikipedia).', 'Continuous state operation (BATAN then BRIN) and power levels set with Bapeten approval (Wikipedia summary).']],
      pelajaran: [['Indonesia sudah memiliki kompetensi operasi dan pengawasan reaktor riset, namun itu belum sama dengan membangun PLTN daya.', 'Indonesia has research reactor operating and oversight competence, which is not the same as building a power plant.']],
      kronologi: [['1987-07-29', 'Kritikalitas pertama.', 'First criticality.'], ['1992-03-23', 'Daya nominal 30 MW tercapai.', 'Nominal 30 MW reached.'], ['2026-03-01', 'BRIN mempercepat revitalisasi fasilitas bahan bakar (Mar 2026).', 'BRIN speeds up fuel facility revitalisation (Mar 2026).']],
      faktor: { regulator: true, pembiayaan: true, penerimaan: true }, sumber: ['rsg', 'brin_bbn', 'brin_sdm'] }),
  ] };
  bab['40'] = { tipe: 'kasus', sumber: ['wna_ph', 'nuscale', 'nuscale2', 'mongabay_gelasa', 'detik_tapak'], catatan: T('Hak jawab: pihak yang disebut dapat mengirim koreksi lewat formulir koreksi platform. Tidak ada proyek PLTN Indonesia yang mangkrak di sumber yang dibaca; kasus Thorcon dimasukkan sebagai proyek berjalan dalam bab 29.', 'Right of reply: named parties can send corrections through the platform correction form. No stalled Indonesian nuclear project appears in the sources read; the Thorcon case is covered as an ongoing project in chapter 29.'), butir: [
    kas({ id: 'bataan', nama: 'PLTN Bataan, Filipina', jenis: 'mangkrak', negara: 'PH', lokasi: ['Napot Point, Bataan', 'Napot Point, Bataan'],
      sebab: [['Masalah keuangan dan kekhawatiran keselamatan terkait gempa; pada April 1986, setelah Chernobyl, Presiden Aquino memutuskan memberhentikan (mothball) pabrik (World Nuclear Association).', 'Financial problems and earthquake safety concerns; in April 1986, after Chernobyl, President Aquino decided to mothball the plant (World Nuclear Association).']],
      angka: [['Biaya bangun (1984)', 'Construction cost (1984)', 1.9, 1, 'miliar USD', 'wna_ph', false], ['Taksiran rehabilitasi (Nov 2022)', 'Rehabilitation estimate (Nov 2022)', 2.3, 1, 'miliar USD', 'wna_ph', false], ['Kapasitas', 'Capacity', 621, 0, 'MWe', 'wna_ph', false]],
      kronologi: [['1976-02-01', 'Kontrak unit Westinghouse 621 MWe (Feb 1976).', 'Contract for the 621 MWe Westinghouse unit (Feb 1976).'], ['1984-12-31', 'Konstruksi rampung, tidak pernah diisi bahan bakar (1984).', 'Construction completed, never fuelled (1984).'], ['1986-04-30', 'Dihentikan setelah Chernobyl (Apr 1986).', 'Mothballed after Chernobyl (Apr 1986).'], ['2007-04-30', 'Pembayaran utang terakhir (Apr 2007).', 'Final debt payment (Apr 2007).'], ['2025-01-01', 'Studi rehabilitasi KHNP dimulai (Jan 2025).', 'KHNP rehabilitation study begins (Jan 2025).'], ['2026-06-01', 'Dewan Morong menetapkan zona bebas nuklir (Jun 2026).', 'Morong council declares a non-nuclear zone (Jun 2026).']],
      terdampak: ['Pembayar pajak Filipina yang melunasi proyek hingga 2007 tanpa listrik, dan masyarakat sekitar.', 'Filipino taxpayers who paid off the project until 2007 without electricity, and nearby communities.'],
      seharusnya: ['pisahkan evaluasi tapak (risiko gempa) dari keputusan konstruksi dan sediakan regulator independen sebelum kontrak.', 'separate site evaluation (seismic risk) from the construction decision and have an independent regulator in place before the contract.'],
      tanda: [['Tapak di zona gempa tanpa evaluasi independen', 'Site in a seismic zone without independent evaluation'], ['Keputusan dibuat tanpa regulator mandiri', 'Decision made without an independent regulator']],
      faktor: { regulator: false, pembiayaan: false, penerimaan: false, kontrak_harga_tetap: false }, sumber: ['wna_ph'] }),
    kas({ id: 'nuscale-cfpp', nama: 'Carbon Free Power Project NuScale-UAMPS, AS', jenis: 'dibatalkan', negara: 'US', lokasi: ['Idaho, AS', 'Idaho, USA'],
      sebab: [['Harga target listrik naik dari USD 58 ke USD 89 per MWh dan langganan tidak cukup; kedua pihak sepakat mengakhiri proyek (POWER Engineering, 9 Nov 2023).', 'The target power price rose from USD 58 to USD 89 per MWh and subscription was insufficient; both parties agreed to end the project (POWER Engineering, 9 Nov 2023).']],
      angka: [['Kapasitas rencana', 'Planned capacity', 462, 0, 'MW (6 x 77)', 'nuscale', false], ['Harga target', 'Target price', 89, 0, 'USD per MWh', 'nuscale', false], ['Dukungan biaya DOE (ringkasan)', 'DOE cost share (summary)', 1.4, 1, 'miliar USD', 'nuscale2', false]],
      kronologi: [['2023-01-01', 'Harga target naik ke USD 89 per MWh (awal 2023).', 'Target price rises to USD 89 per MWh (early 2023).'], ['2023-10-08', 'NuScale menyatakan langganan kemungkinan tidak cukup.', 'NuScale says subscription is unlikely to suffice.'], ['2023-11-09', 'Proyek dibatalkan secara bersama.', 'Project mutually cancelled.']],
      terdampak: ['Anggota UAMPS (utilitas kota) dan pengembang SMR yang kehilangan pelanggan pertama.', 'UAMPS members (municipal utilities) and the SMR developer who lost its first customer.'],
      seharusnya: ['tetapkan batas harga yang mengikat sebelum utilitas berkomitmen dan sediakan pembeli jangkar untuk unit pertama.', 'set a binding price ceiling before utilities commit and provide an anchor buyer for the first unit.'],
      tanda: [['Harga target naik sekitar 53 persen dalam setahun', 'Target price rising about 53 percent in a year'], ['Langganan di bawah batas yang dibutuhkan', 'Subscription below the required level']],
      faktor: { regulator: true, pembiayaan: false, penerimaan: false, kontrak_harga_tetap: false }, sumber: ['nuscale', 'nuscale2'] }),
  ] };
  bab['41'] = { tipe: 'pola', sumber: ['ed'], catatan: T('Sel dibangun dari bendera faktor tiap kasus; pemetaan adalah analisis METI (Hipotesis) atas fakta di bab 39 dan 40.', 'Cells are built from case factor flags; the mapping is METI analysis (Hypothesis) of facts in chapters 39 and 40.'),
    faktor: [L('regulator', 'Regulator mapan dan independen', 'Established, independent regulator'), L('pembiayaan', 'Pembiayaan sovereign atau jangkar', 'Sovereign or anchor financing'), L('penerimaan', 'Penerimaan politik dan masyarakat', 'Political and public acceptance'), L('kontrak_harga_tetap', 'Kontrak dengan harga terkunci', 'Price-locked contract')] };
  const d = (peran, tahap, id, en, s) => ({ peran, tahap, teks: T(id, en), dasar: s });
  bab['42'] = { tipe: 'periksa', sumber: ['ed'],
    peran: [L('pengembang', 'Pengembang', 'Developer'), L('investor', 'Investor', 'Investor'), L('pemda', 'Pemerintah daerah', 'Local government'), L('pusat', 'Pemerintah pusat', 'Central government'), L('pln', 'PLN', 'PLN'), L('meti', 'METI', 'METI')],
    tahap: [L('lokasi', 'Penyaringan lokasi', 'Site screening'), L('izin', 'Perizinan', 'Permitting'), L('ppa', 'PPA', 'PPA'), L('dana', 'Pendanaan', 'Financing'), L('bangun', 'Konstruksi', 'Construction'), L('operasi', 'Operasi', 'Operation')],
    butir: [
      d('pengembang', 'lokasi', 'Evaluasi enam aspek bahaya eksternal dan hindari tapak dengan patahan dalam 5 km.', 'Evaluate the six external hazard aspects and avoid sites with a fault within 5 km.', 'detik_tapak'),
      d('pengembang', 'izin', 'Urus persetujuan evaluasi tapak, lalu persetujuan desain dan izin lingkungan sebelum izin tapak.', 'Obtain the site evaluation approval, then design approval and the environmental permit before the site permit.', 'tapak_kontan'),
      d('pengembang', 'ppa', 'Minta harga kontrak terkunci dan pembeli jangkar (pelajaran NuScale).', 'Seek a locked contract price and an anchor buyer (NuScale lesson).', 'nuscale'),
      d('investor', 'dana', 'Tanyakan struktur pembiayaan sovereign atau jaminan sebelum masuk (pelajaran Barakah).', 'Ask about sovereign financing or guarantee structure before entering (Barakah lesson).', 'wna_uae'),
      d('pemda', 'lokasi', 'Buka konsultasi publik sejak evaluasi tapak karena penolakan lokal mengubah jadwal.', 'Open public consultation from site evaluation because local opposition changes schedules.', 'mongabay_gelasa'),
      d('pusat', 'izin', 'Bentuk NEPIO dan tetapkan regulator mandiri sebelum memilih teknologi.', 'Create NEPIO and settle an independent regulator before choosing technology.', 'ibp25'),
      d('pusat', 'ppa', 'Selaraskan angka kapasitas awal dan target 2060 antar lembaga.', 'Align the initial capacity and 2060 target across agencies.', 'den26'),
      d('pln', 'ppa', 'Jelaskan peran PLN sebagai pembeli dan alokasi risiko biaya sebelum kontrak.', 'Clarify PLN\'s role as buyer and cost risk allocation before contracts.', 'ed'),
      d('meti', 'operasi', 'Pantau izin tapak dan beri ruang hak jawab bagi pihak yang disebut.', 'Track the site permit and give named parties a right of reply.', 'detik_tapak'),
    ] };

  return rakit({ id: 'nuklir', judul: ['Nuklir dan SMR', 'Nuclear and SMR'],
    lead: ['Rencana PLTN di RUPTL dan KEN baru, Thorcon, BRIN, Bapeten, dan pelajaran Barakah, Bataan, dan NuScale: apa yang sudah dan belum ada di Indonesia.', 'Nuclear plans in RUPTL and the new national energy policy, Thorcon, BRIN, Bapeten, and lessons from Barakah, Bataan and NuScale: what exists and what does not yet in Indonesia.'],
    kunci: [
      kunci('Target operasi PLTN pertama', 'Target operation of the first plant', '2032 sampai 2034', 0, 'tahun', 'years', 'den26'),
      kunci('Kapasitas awal PLTN menurut DEN', 'Initial plant capacity per DEN', 500, 0, 'MW', 'MW', 'den26'),
      kunci('Target nuklir 2060 menurut DEN', 'Nuclear target for 2060 per DEN', 44, 0, 'GW', 'GW', 'den26'),
      kunci('Calon lokasi tapak (13 wilayah)', 'Candidate sites (13 regions)', 29, 0, 'lokasi', 'sites', 'ibp25'),
      kunci('Daya reaktor riset Serpong', 'Serpong research reactor power', 30, 0, 'MWt', 'MWt', 'rsg'),
    ],
    penting: [
      ['PP 40/2025 menempatkan nuklir bukan opsi terakhir; target PLTN pertama 2032 sampai 2034, tetapi belum ada izin tapak per Agustus 2025.', 'PP 40/2025 places nuclear as no longer a last resort; the first plant is targeted for 2032 to 2034, but no site permit existed as of August 2025.'],
      ['Satu-satunya pemohon yang diketahui, Thorcon di Pulau Gelasa, baru memegang persetujuan evaluasi tapak Bapeten dan menghadapi penolakan lokal.', 'The only known applicant, Thorcon on Gelasa Island, holds only a Bapeten site evaluation approval and faces local opposition.'],
      ['Dunia menunjukkan dua jalan: Barakah selesai tepat dengan kontrak harga tetap, sedangkan Bataan mangkrak dan proyek SMR NuScale dibatalkan.', 'The world shows two paths: Barakah finished with a fixed-price contract, while Bataan stalled and NuScale\'s SMR project was cancelled.'],
    ],
    posisi: ['Indonesia belum memiliki PLTN dan porsi nuklirnya 0 persen (2024), sementara tiga reaktor riset BRIN menjadi satu-satunya fasilitas nuklir beroperasi.', 'Indonesia has no nuclear plant and a 0 percent nuclear share (2024); three BRIN research reactors are its only operating nuclear facilities.'],
    sumber: SUMBER, bab });
}

export function susun() { return dalam(susunAsal()); }
export const validasi = val;
export const selftest = () => st(susun);
jalankan(import.meta.url, 'nuklir', susun);
