// Pendalaman naskah Nuklir dan SMR (8 Nov 2026). Angka RUPTL 2025-2034 dibaca langsung dari PDF resmi (bagian II.2.6, III.1.3, tabel penambahan pembangkit EBT).
import { T, S, hp, faq, glos, rumus, langkah, teks, tabel, kol, kas, baca, tambah, pasang, pemain, proyek, regulasi, skema, risetTabel, linReg, cekId, sumberBaru, pakaiSumber, pangkas, regS, SDIREKTORI, denganKode, nf } from './topik_enam_lib.mjs';

const RUPTL_PDF = 'https://gatrik.esdm.go.id/gatrik/gatrik-api//storage/migrasi/download_index/files/b967d-ruptl-pln-2025-2034-pub-.pdf';
const WIKI = (j, t) => S(j, 'Wikipedia (ringkasan artikel; bukan sumber primer)', 'https://en.wikipedia.org/wiki/' + t, '2026-11-08', 2026, 'via-pihak-ketiga', 'CC BY-SA 4.0');

export function dalam(d) {
  sumberBaru(d, {
    direktori: SDIREKTORI,
    ruptlp: S('RUPTL PT PLN (Persero) 2025-2034: bagian II.2.6 dan III.1.3 (program PLTN: 19 elemen infrastruktur IAEA, penilaian INIR 2009 16 dari 19, 28 wilayah potensial hingga 70 GW), tabel penambahan pembangkit EBT (PLTN 250 MW 2032 dan 250 MW 2033; jumlah 500 MW), proyek 28 Sumatera-Bangka dan 23 Kalimantan; dibaca penuh dari PDF 8 Nov 2026', 'PT PLN (Persero); disahkan Kementerian ESDM', RUPTL_PDF, '2026-11-08', 2025, 'resmi'),
    rooppur: WIKI('Rooppur Nuclear Power Plant (Bangladesh: 2 x VVER-1200, 2,4 GWe; unit 1 mencapai kritikalitas Oktober 2026 menurut artikel)', 'Rooppur_Nuclear_Power_Plant'),
    akkuyu: WIKI('Akkuyu Nuclear Power Plant (Turki: dalam konstruksi, peluncuran resmi Apr 2015, reaktor pertama diharapkan 2026 setelah tertunda tiga tahun)', 'Akkuyu_Nuclear_Power_Plant'),
    vnnuk: WIKI('Nuclear power in Vietnam (rencana ditangguhkan November 2016; 2022 menteri menyebut nuklir tren tak terelakkan)', 'Nuclear_power_in_Vietnam'),
    idnuk: WIKI('Nuclear power in Indonesia (Indonesia menandatangani NPT 2 Mar 1970, diratifikasi UU 8/1978 pada 18 Des 1978)', 'Nuclear_power_in_Indonesia'),
    iaea: S('IAEA, Milestones in the Development of a National Infrastructure for Nuclear Power (19 isu infrastruktur; dirujuk RUPTL 2025-2034)', 'International Atomic Energy Agency', 'https://www.iaea.org/publications/8009/milestones-in-the-development-of-a-national-infrastructure-for-nuclear-power', '2026-11-08', 2026, 'resmi'),
    uu10: regS('uu-10-1997'), pp46: regS('pp-46-2009'), pp54: regS('pp-54-2012'), pp2: regS('pp-2-2014'), uu8: regS('uu-8-1978'), pbp: regS('lainnya-b344440-1-2026'),
  });

  tambah(d, '2', 'butir', faq(['ruptlp', 'ed', 'pp46', 'uu8', 'pp54'], [
    ['Berapa PLTN yang tercantum di RUPTL 2025-2034?', 'How many nuclear plants are in RUPTL 2025-2034?', 'Dua kuota PLTN 250 MW: Sumatera-Bangka (COD 2032) dan Kalimantan (COD 2033), jumlah 500 MW sampai 2034 (RUPTL, tabel penambahan pembangkit EBT). Angka 250 MW (ESDM, 2025) dan 500 MW (DEN, 2026) sama-sama benar: yang pertama satu kuota, yang kedua jumlah dua kuota.', 'Two 250 MW nuclear quotas: Sumatra-Bangka (COD 2032) and Kalimantan (COD 2033), 500 MW in total to 2034 (RUPTL, renewable addition table). The 250 MW (Energy Ministry, 2025) and 500 MW (DEN, 2026) figures are both right: the first is one quota, the second is both quotas together.'],
    ['Apa 19 elemen infrastruktur IAEA?', 'What are the 19 IAEA infrastructure elements?', 'Keselamatan nuklir, pendanaan, kerangka hukum, safeguards, proteksi radiasi, kerangka regulasi, jaringan listrik, SDM, tapak, perlindungan lingkungan, perencanaan darurat, keamanan nuklir, daur bahan bakar, pengelolaan limbah, keterlibatan industri, pengadaan, posisi nasional, manajemen, dan keterlibatan pemangku kepentingan (daftar dalam RUPTL).', 'Nuclear safety, funding, legal framework, safeguards, radiation protection, regulatory framework, electrical grid, human resources, sites, environmental protection, emergency planning, nuclear security, fuel cycle, waste management, industrial involvement, procurement, national position, management and stakeholder involvement (list in RUPTL).'],
    ['Seberapa siap Indonesia menurut penilaian IAEA?', 'How ready is Indonesia per the IAEA review?', 'Misi INIR IAEA tahun 2009 menilai Indonesia telah memenuhi 16 dari 19 elemen (nomor 1 sampai 16); RUPTL menyatakan Indonesia masih di fase pertimbangan menuju keputusan pelaksanaan proyek.', 'The 2009 IAEA INIR mission found Indonesia had prepared 16 of the 19 elements (numbers 1 to 16); RUPTL states Indonesia is still at the consideration phase toward a project implementation decision.'],
    ['Berapa lokasi potensial dan di mana PLTN awal?', 'How many potential sites and where are the first plants?', 'RUPTL menyebut 28 wilayah potensial yang dapat menampung PLTN hingga 70 GW, dan tahap awal direncanakan di sistem Sumatera dan Kalimantan. Dirjen EBTKE (Feb 2025) menyebut 29 lokasi di 13 wilayah; selisih satu lokasi tidak dijelaskan sumber.', 'RUPTL cites 28 potential regions able to host up to 70 GW of nuclear, with the first phase planned in the Sumatra and Kalimantan systems. The EBTKE director general (Feb 2025) cited 29 sites in 13 regions; the one-site difference is not explained by sources.'],
    ['Apakah Indonesia boleh membuat senjata nuklir?', 'May Indonesia make nuclear weapons?', 'Tidak. Indonesia menandatangani Traktat Nonproliferasi pada 1970 dan meratifikasinya lewat UU 8/1978; PLTN hanya untuk tujuan damai.', 'No. Indonesia signed the Non-Proliferation Treaty in 1970 and ratified it through Law 8/1978; nuclear plants are for peaceful use only.'],
    ['Siapa menanggung kerugian bila terjadi kecelakaan nuklir?', 'Who bears the loss in a nuclear accident?', 'PP 46/2009 mengatur batas pertanggungjawaban kerugian nuklir (judul regulasi di repo); besarnya dan skema asuransi dibaca pada naskah peraturan itu.', 'Gov. Reg. 46/2009 sets the limit of liability for nuclear damage (regulation title in the repo); read the amount and insurance scheme in that text.'],
    ['Bagaimana limbah radioaktif ditangani?', 'How is radioactive waste handled?', 'RUPTL mensyaratkan jaminan pasokan bahan bakar, pengelolaan limbah radioaktif, keselamatan, dan keamanan sebelum PLTN dibangun dan dioperasikan. Skema penyimpanan akhir belum ada di sumber yang dibaca.', 'RUPTL requires assured fuel supply, radioactive waste management, safety and security before a plant is built and operated. A final disposal scheme is not in the sources read.'],
    ['Siapa yang mengawasi keselamatan instalasi nuklir?', 'Who supervises the safety of nuclear installations?', 'Bapeten; keselamatan dan keamanan instalasi nuklir diatur PP 54/2012, dan sistem proteksi fisik diatur peraturan Bapeten 1/2026 (judul regulasi di repo).', 'Bapeten; safety and security of nuclear installations are governed by Gov. Reg. 54/2012, and physical protection by Bapeten regulation 1/2026 (regulation titles in the repo).'],
  ]).butir);

  tambah(d, '3', 'butir', glos(['ed', 'ruptlp', 'iaea'], [
    ['Fisi nuklir', 'Nuclear fission', 'Pemecahan inti berat (uranium-235) menjadi inti lebih ringan yang melepas panas; sumber panas PLTN.', 'Splitting of a heavy nucleus (uranium-235) into lighter ones releasing heat; the heat source of a nuclear plant.'],
    ['Moderator dan pendingin', 'Moderator and coolant', 'Moderator memperlambat neutron agar fisi berlanjut; pendingin membawa panas keluar teras.', 'A moderator slows neutrons so fission continues; a coolant carries heat out of the core.'],
    ['PWR dan BWR', 'PWR and BWR', 'Reaktor air bertekanan dan reaktor air didih, dua desain air ringan paling umum.', 'Pressurised and boiling water reactors, the two most common light-water designs.'],
    ['Reaktor garam cair (MSR)', 'Molten salt reactor (MSR)', 'Reaktor yang bahan bakarnya larut dalam garam cair; TMSR500 Thorcon adalah usulan jenis ini.', 'A reactor whose fuel is dissolved in molten salt; Thorcon\'s TMSR500 is a proposal of this type.'],
    ['HTGR', 'HTGR', 'Reaktor berpendingin gas suhu tinggi dengan bahan bakar partikel; dibahas sebagai opsi SMR.', 'High-temperature gas-cooled reactor with particle fuel; discussed as an SMR option.'],
    ['Kritikalitas', 'Criticality', 'Keadaan reaksi berantai swa-lanjut; RSG-GAS pertama kritis 29 Jul 1987.', 'The state of a self-sustaining chain reaction; RSG-GAS first went critical on 29 Jul 1987.'],
    ['Pengayaan uranium', 'Uranium enrichment', 'Menaikkan porsi uranium-235 agar menjadi bahan bakar reaktor; bagian rantai bahan bakar.', 'Raising the share of uranium-235 so it can fuel a reactor; part of the fuel chain.'],
    ['Bahan bakar bekas', 'Spent fuel', 'Bahan bakar yang telah dipakai di reaktor, masih panas dan radioaktif, disimpan lalu dikelola.', 'Fuel already used in a reactor, still hot and radioactive, stored then managed.'],
    ['Limbah radioaktif', 'Radioactive waste', 'Bahan sisa yang mengandung radionuklida; digolongkan menurut aktivitas dan umur paruh.', 'Residual material containing radionuclides; classified by activity and half-life.'],
    ['Safeguards (garda aman)', 'Safeguards', 'Sistem verifikasi IAEA bahwa bahan nuklir tidak dialihkan ke senjata.', 'IAEA verification that nuclear material is not diverted to weapons.'],
    ['Pendekatan Milestones IAEA', 'IAEA Milestones approach', 'Tiga fase pembangunan infrastruktur: pertimbangan, persiapan, dan konstruksi, dengan 19 isu yang dinilai.', 'Three phases of infrastructure build-up (consideration, preparation, construction) with 19 issues assessed.'],
    ['INIR', 'INIR', 'Integrated Nuclear Infrastructure Review: misi IAEA menilai kesiapan negara; Indonesia dinilai pada 2009.', 'Integrated Nuclear Infrastructure Review: an IAEA mission assessing national readiness; Indonesia was assessed in 2009.'],
    ['Pertahanan berlapis', 'Defence in depth', 'Prinsip keselamatan dengan beberapa lapis pencegahan dan mitigasi yang saling bebas.', 'A safety principle of several independent layers of prevention and mitigation.'],
    ['Zona perencanaan darurat', 'Emergency planning zone', 'Wilayah sekitar PLTN yang disiapkan untuk tindakan darurat; ukurannya bergantung desain.', 'The area around a plant prepared for emergency action; its size depends on the design.'],
    ['Faktor kapasitas', 'Capacity factor', 'Produksi tahunan dibanding produksi bila beroperasi penuh sepanjang tahun; PLTN biasanya tinggi karena beban dasar.', 'Annual output compared with running at full power all year; nuclear plants are usually high as baseload.'],
    ['Beban dasar', 'Baseload', 'Beban minimum yang terus ada; dilayani pembangkit yang menyala hampir terus.', 'The minimum load that is always present; served by plants running almost continuously.'],
    ['Penghentian operasi (decommissioning)', 'Decommissioning', 'Pembongkaran dan dekontaminasi instalasi di akhir umur; biayanya dicadangkan sejak awal.', 'Dismantling and decontaminating an installation at end of life; its cost is reserved from the start.'],
    ['Kerugian nuklir', 'Nuclear damage', 'Kerugian akibat kecelakaan nuklir yang pertanggungjawabannya dibatasi PP 46/2009.', 'Loss from a nuclear accident whose liability is limited by Gov. Reg. 46/2009.'],
    ['Proteksi fisik', 'Physical protection', 'Pengamanan instalasi dan bahan nuklir dari pencurian dan sabotase; diatur peraturan Bapeten 1/2026.', 'Securing installations and nuclear material against theft and sabotage; governed by Bapeten regulation 1/2026.'],
    ['Kuota PLTN tersebar', 'Dispersed nuclear quota', 'Cara RUPTL mencantumkan PLTN: kapasitas 250 MW per sistem yang lokasinya belum ditetapkan.', 'How RUPTL lists nuclear plants: 250 MW per system with the site not yet fixed.'],
  ]).butir);

  tambah(d, '4', 'paragraf', [
    T('Menurut RUPTL 2025-2034, arah kebijakan energi nasional memakai nuklir untuk menyeimbangkan dan mencapai target dekarbonisasi, dan RPJPN 2025-2045 (UU 59/2024) sudah memuat rencana nuklir dalam pasokan listrik. Pengembangannya mengikuti dokumen RUKN yang ditetapkan Keputusan Menteri ESDM 85.K/TL.01/MEM.L/2025.', 'Per RUPTL 2025-2034, national energy policy direction uses nuclear to balance and reach decarbonisation targets, and the 2025-2045 long-term plan (Law 59/2024) already includes nuclear in electricity supply. Development follows the RUKN set by Energy Minister Decree 85.K/TL.01/MEM.L/2025.'),
    T('Teknologinya tidak dibatasi pada SMR: RUPTL menyebut skala besar, menengah, PWR, BWR, terapung, dan di darat. Pemilihan lokasi mempertimbangkan keseimbangan pasokan dan permintaan, keekonomian, dan kajian lanjutan, bukan semata kesiapan teknologi.', 'The technology is not limited to SMRs: RUPTL cites large, medium, PWR, BWR, floating and land-based. Site selection weighs supply-demand balance, economics and further study, not technology readiness alone.'),
    T('Hal yang membedakan nuklir dari pembangkit lain adalah kerangka tanggung jawab: keselamatan, safeguards, bahan bakar, limbah, dan liabilitas harus siap sebelum konstruksi, itu sebabnya IAEA menilai 19 elemen infrastruktur, bukan pembangkitnya saja.', 'What sets nuclear apart is the responsibility framework: safety, safeguards, fuel, waste and liability must be ready before construction, which is why the IAEA assesses 19 infrastructure elements, not the plant alone.'),
  ]);
  pakaiSumber(d, '4', 'ruptlp', 'iaea');

  d.bab['5'].rumus.push(
    T('Daya listrik (MWe) = Daya termal (MWt) x Efisiensi termal', 'Electric power (MWe) = Thermal power (MWt) x Thermal efficiency'),
    T('Energi tahunan (GWh) = Daya (MW) x 8,76 x Faktor kapasitas', 'Annual energy (GWh) = Power (MW) x 8.76 x Capacity factor'),
    T('Biaya modal per kW = Nilai kontrak atau investasi / Kapasitas (kW)', 'Capital cost per kW = Contract or investment value / Capacity (kW)'),
  );
  d.bab['5'].contoh.push(
    T('Biaya modal Barakah (EST): kontrak sekitar USD 20,4 miliar untuk 5.600 MW = 20.400.000.000 / 5.600.000 kW = sekitar USD 3.643 per kW (belum termasuk biaya pembiayaan; World Nuclear Association).', 'Barakah capital cost (EST): a contract of about USD 20.4 billion for 5,600 MW = 20,400,000,000 / 5,600,000 kW = about USD 3,643 per kW (before financing cost; World Nuclear Association).'),
    T('Energi tahunan (angka ilustrasi, faktor kapasitas 90 persen sebagai asumsi): 500 MW x 8,76 x 0,9 = sekitar 3.942 GWh per tahun (EST) bagi dua kuota PLTN RUPTL.', 'Annual energy (illustrative figures, 90 percent capacity factor as an assumption): 500 MW x 8.76 x 0.9 = about 3,942 GWh a year (EST) for the two RUPTL nuclear quotas.'),
  );
  pakaiSumber(d, '5', 'wna_uae', 'ruptlp', 'ed');

  pasang(d, '6', langkah(['ed', 'ruptlp', 'korea', 'brin_sdm', 'pp54'], [
    ['Kebijakan dan kelembagaan', 'Policy and institutions', 'PP 40/2025, RUKN, RUPTL, dan pembentukan NEPIO menurut pedoman IAEA.', 'Gov. Reg. 40/2025, RUKN, RUPTL and a NEPIO per IAEA guidance.', 'Dewan Energi Nasional, Kementerian ESDM, PLN', 'National Energy Council, Energy Ministry, PLN'],
    ['Kesiapan 19 elemen infrastruktur', 'Readiness of 19 infrastructure elements', 'Penilaian diri dan misi INIR; hukum, regulator, SDM, jaringan, dan pemangku kepentingan.', 'Self-assessment and INIR missions; law, regulator, human resources, grid and stakeholders.', 'Pemerintah, Bapeten, BRIN', 'Government, Bapeten, BRIN'],
    ['Evaluasi tapak', 'Site evaluation', 'Survei kegempaan, gunung api, sesar, dan hidrologi oleh BATAN (kini BRIN) di beberapa lokasi, lalu evaluasi tapak oleh Bapeten.', 'Surveys of seismicity, volcanoes, faults and hydrology by BATAN (now BRIN) at several sites, then site evaluation by Bapeten.', 'BRIN, Bapeten, pemohon', 'BRIN, Bapeten, applicant'],
    ['Pemilihan teknologi dan mitra', 'Technology and partner choice', 'Pemasok teknologi dan pembiayaan: pada Barakah, KEPCO sebagai kontraktor utama; di Indonesia pengusul Thorcon dan kerja sama dengan Korea (Perpres 42/2011).', 'Technology and financing suppliers: at Barakah, KEPCO as main contractor; in Indonesia, the proponent Thorcon and cooperation with Korea (Perpres 42/2011).', 'KEPCO, Thorcon, NuScale, mitra pemerintah', 'KEPCO, Thorcon, NuScale, government partners'],
    ['Perizinan', 'Licensing', 'Persetujuan evaluasi tapak, izin tapak, konstruksi, komisioning, operasi (Peraturan Bapeten 1/2022).', 'Site evaluation approval, site, construction, commissioning and operating permits (Bapeten Regulation 1/2022).', 'Bapeten', 'Bapeten'],
    ['Bahan bakar dan rantai pasok', 'Fuel and supply chain', 'Jaminan pasokan bahan bakar; BRIN merevitalisasi fasilitas bahan bakar untuk reaktor riset RSG-GAS.', 'Assured fuel supply; BRIN is revitalising fuel facilities for the RSG-GAS research reactor.', 'BRIN, pemasok bahan bakar', 'BRIN, fuel suppliers'],
    ['Konstruksi dan komisioning', 'Construction and commissioning', 'Pembangunan, uji, dan pemuatan bahan bakar pertama.', 'Construction, testing and first fuel load.', 'Kontraktor utama, operator', 'Main contractor, operator'],
    ['Operasi, limbah, dan penghentian', 'Operation, waste and decommissioning', 'Operator berizin dengan pengawasan terus-menerus, pengelolaan bahan bakar bekas dan limbah, dan dana penghentian.', 'A licensed operator under continuous oversight, spent fuel and waste management and a decommissioning fund.', 'Operator, Bapeten, BRIN', 'Operator, Bapeten, BRIN'],
  ]));

  pemain(d, [
    ['PT PLN (Persero)', ['Calon pembeli tunggal listrik PLTN; pemilik RUPTL yang memuat kuota 2 x 250 MW', 'Prospective sole buyer of nuclear power; owner of the RUPTL that lists the 2 x 250 MW quotas'], 'RUPTL 2025-2034'],
    ['Badan Riset dan Inovasi Nasional', ['Pelaksana survei dan studi tapak (bekas BATAN), operator reaktor riset', 'Runs site surveys and studies (former BATAN) and the research reactors'], 'RUPTL 2025-2034; Katadata'],
    ['Kementerian Energi dan Sumber Daya Mineral', ['Menetapkan RUKN (Kepmen 85.K/2025) dan keputusan akhir proyek', 'Sets the RUKN (Decree 85.K/2025) and final project decisions'], 'RUPTL 2025-2034'],
    ['Badan Pengawas Tenaga Nuklir (Bapeten)', ['Regulator ketenaganukliran; belum ada di direktori METI', 'Nuclear regulator; not yet in the METI directory'], 'detikFinance, 12 Agu 2025'],
    ['International Atomic Energy Agency', ['Penyusun pedoman 19 elemen dan penyelenggara misi INIR 2009', 'Author of the 19-element guidance and organiser of the 2009 INIR mission'], 'RUPTL 2025-2034; IAEA'],
    ['Korea Electric Power Corporation (KEPCO)', ['Kontraktor utama Barakah (APR1400); Indonesia-Korea punya persetujuan kerja sama (Perpres 42/2011)', 'Main contractor of Barakah (APR1400); Indonesia and Korea have a cooperation agreement (Perpres 42/2011)'], 'World Nuclear Association'],
    ['Emirates Nuclear Energy Corporation', ['Pemilik dan operator Barakah (pembanding)', 'Owner and operator of Barakah (comparison)'], 'World Nuclear Association'],
    ['NuScale Power', ['Pengembang SMR 77 MW per modul; proyek UAMPS dibatalkan 2023', 'Developer of the 77 MW-per-module SMR; the UAMPS project was cancelled in 2023'], 'POWER Engineering, 9 Nov 2023'],
    ['Utah Associated Municipal Power Systems (UAMPS)', ['Pemilik proyek NuScale yang dibatalkan', 'Owner of the cancelled NuScale project'], 'POWER Engineering'],
    ['Rosatom', ['Pemasok reaktor VVER di Rooppur dan Akkuyu; rencana reaktor terapung dicatat berita direktori', 'Supplier of VVER reactors at Rooppur and Akkuyu; a floating reactor plan is noted by directory news'], 'Wikipedia; berita direktori'],
    ['Pemerintah Provinsi Kepulauan Bangka Belitung', ['Wilayah tapak Gelasa (Kelasa) dan kuota PLTN RUPTL Sumatera-Bangka', 'Host of the Gelasa (Kelasa) site and the Sumatra-Bangka RUPTL nuclear quota'], 'RUPTL; Mongabay'],
    ['Aliansi Kalimantan Barat Tolak PLTN', ['Kelompok warga penolak', 'Resident group opposing'], 'Naskah bab Sebaran'],
    ['Universitas Gadjah Mada', ['Kampus dengan program studi teknik nuklir; mitra SDM', 'Campus with a nuclear engineering programme; human-resources partner'], 'Direktori METI'],
    ['Institut Teknologi Bandung', ['Kampus dengan riset energi dan reaktor Bandung (2 MWt) di sekitarnya', 'Campus with energy research; the 2 MWt Bandung reactor is nearby'], 'Direktori METI'],
    ['World Nuclear Association', ['Penerbit profil tenaga nuklir per negara yang dikutip naskah', 'Publisher of the country nuclear profiles cited in this text'], 'WNA'],
    ['Badan Pengelola Investasi Daya Anagata Nusantara', ['Calon pendana infrastruktur energi strategis', 'Prospective funder of strategic energy infrastructure'], 'Direktori METI'],
    ['Institute for Essential Services Reform', ['Pengkritik biaya dan risiko nuklir', 'Critic of nuclear cost and risk'], 'Mongabay, 23 Feb 2025'],
    ['Dewan Energi Nasional', ['Sumber target 44 GW 2060 dan PLTN pertama 500 MW', 'Source of the 44 GW 2060 target and the 500 MW first plant'], 'CNBC, 3 Mar 2026'],
  ], 'nuklir', 40);
  d.bab['9'].sumber.push('ruptlp', 'wna_uae', 'nuscale');
  d.bab['20'].kolom.splice(1, 0, kol('iso2', 'ISO2', 'ISO2'));
  const iso = { 'UEA: Barakah': 'AE', 'Filipina: Bataan': 'PH', 'AS: NuScale UAMPS': 'US', Indonesia: 'ID' };
  d.bab['20'].baris.forEach((r) => { const k = typeof r.negara === 'string' ? r.negara : r.negara.id; r.iso2 = iso[k] || '-'; });
  d.bab['20'].baris.push(
    { negara: 'Bangladesh: Rooppur', iso2: 'BD', ukuran: T('2 x VVER-1200, 2,4 GWe', '2 x VVER-1200, 2.4 GWe'), status: T('Unit 1 kritis Okt 2026 menurut artikel', 'Unit 1 critical Oct 2026 per the article'), catatan: T('Pembangkit nuklir pertama Bangladesh', 'Bangladesh\'s first nuclear plant') },
    { negara: 'Turki: Akkuyu', iso2: 'TR', ukuran: T('sekitar 10 persen listrik bila rampung', 'about 10 percent of electricity when complete'), status: T('Konstruksi; tertunda tiga tahun', 'Under construction; delayed three years'), catatan: T('Peluncuran resmi Apr 2015', 'Official launch Apr 2015') },
    { negara: 'Vietnam', iso2: 'VN', ukuran: T('-', '-'), status: T('Rencana ditangguhkan Nov 2016; 2022 menteri menyebut nuklir tren tak terelakkan', 'Plans suspended Nov 2016; in 2022 a minister called nuclear an inevitable trend'), catatan: T('Pembanding ASEAN', 'ASEAN comparison') },
  );
  d.bab['20'].per = 10; pakaiSumber(d, '20', 'rooppur', 'akkuyu', 'vnnuk');
  const rpt = d.bab['8'].baris.length; void rpt;
  denganKode(d.bab['8'], 'wilayah');
  d.bab['8'].catatan = T('Kode BPS dari public/data/kelistrikan.json. RUPTL menyebut 28 wilayah potensial dan sistem Sumatera dan Kalimantan untuk PLTN awal; daftar 13 wilayah ini berasal dari sumber ESDM di naskah.', 'BPS codes from public/data/kelistrikan.json. RUPTL cites 28 potential regions and the Sumatra and Kalimantan systems for the first plants; this list of 13 regions comes from the Energy Ministry sources in the text.');
  pakaiSumber(d, '8', 'ruptlp');

  pasang(d, '11', teks(['ruptlp', 'ruptl'], [
    ['Pasar PLTN dalam negeri belum terbentuk. RUPTL 2025-2034 mencantumkan PLTN sebagai kuota 250 MW Sumatera-Bangka (COD 2032) dan 250 MW Kalimantan (COD 2033), jumlah 500 MW, dalam kategori pembangkit baru dengan opsi PLTN sesuai potensi EBT dan selaras RUKN.', 'The domestic nuclear market has not formed. RUPTL 2025-2034 lists nuclear as a 250 MW Sumatra-Bangka quota (COD 2032) and a 250 MW Kalimantan quota (COD 2033), 500 MW in total, as new generation with a nuclear option in line with renewable potential and RUKN.'],
    [`Dari total tambahan pembangkit EBT 42.569 MW sampai 2034, PLTN 500 MW setara ${nf((500 / 42569) * 100, 1)} persen (EST dari tabel RUPTL).`, `Of the 42,569 MW total renewable generation addition to 2034, the 500 MW of nuclear equals ${nf((500 / 42569) * 100, 1)} percent (EST from the RUPTL table).`],
    ['Pembeli tunggal listrik PLTN adalah PLN; harga dan skema jual beli tidak ditemukan di sumber yang dibaca.', 'The sole buyer of nuclear power would be PLN; the price and offtake scheme were not found in the sources read.'],
  ]));

  const bar = d.bab['10'].baris; bar[0].id = cekId('pj', 'pj_0220');
  proyek(d, { nama: 'nama', wilayah: 'lokasi', ukuran: 'ukuran', status: 'status' }, [
    ['PLTN Sumatera-Bangka (kuota, RUPTL proyek 28)', T('Sumatera-Bangka', 'Sumatra-Bangka'), T('250 MW', '250 MW'), T('Rencana; COD 2032; kuota PLTN tersebar New EBT (RUPTL hlm V-17)', 'Planned; COD 2032; dispersed New EBT nuclear quota (RUPTL p. V-17)'), 'RUPTL 2025-2034'],
    ['PLTN Kalimantan (kuota, RUPTL proyek 23)', T('Kalimantan', 'Kalimantan'), T('250 MW', '250 MW'), T('Rencana; COD 2033; kuota PLTN tersebar New EBT', 'Planned; COD 2033; dispersed New EBT nuclear quota'), 'RUPTL 2025-2034'],
    ['Barakah (APR1400, 4 unit)', T('Uni Emirat Arab', 'United Arab Emirates'), T('5,6 GW', '5.6 GW'), T('Unit 4 komersial Sep 2024', 'Unit 4 commercial Sep 2024'), 'World Nuclear Association'],
    ['Rooppur (2 x VVER-1200)', T('Bangladesh', 'Bangladesh'), T('2,4 GWe', '2.4 GWe'), T('Unit 1 kritis Okt 2026 menurut artikel', 'Unit 1 critical Oct 2026 per the article'), 'Wikipedia'],
    ['Akkuyu', T('Turki', 'Turkey'), T('sekitar 10 persen listrik Turki bila rampung', 'about 10 percent of Turkish electricity when complete'), T('Dalam konstruksi; reaktor pertama diharapkan 2026 setelah tertunda tiga tahun', 'Under construction; first reactor expected 2026 after a three-year delay'), 'Wikipedia'],
  ]);
  d.bab['10'].sumber.push('ruptlp', 'rooppur', 'akkuyu', 'wna_uae', 'direktori');

  regulasi(d, {
    'pp-46-2009': ['Batas pertanggungjawaban kerugian nuklir.', 'Limit of liability for nuclear damage.'],
    'pp-43-2006': ['Perizinan reaktor nuklir (peraturan lama).', 'Nuclear reactor licensing (former regulation).'],
    'uu-8-1978': ['Pengesahan Traktat Nonproliferasi Senjata Nuklir.', 'Ratification of the Non-Proliferation Treaty.'],
    'uu-9-1997': ['Pengesahan Traktat Kawasan Bebas Senjata Nuklir Asia Tenggara.', 'Ratification of the Southeast Asia Nuclear Weapon Free Zone Treaty.'],
    'uu-1-2012': ['Pengesahan Traktat Pelarangan Menyeluruh Uji Coba Nuklir.', 'Ratification of the Comprehensive Nuclear-Test-Ban Treaty.'],
    'perpres-83-2014': ['Majelis Pertimbangan Tenaga Nuklir.', 'The Nuclear Energy Advisory Council.'],
    'perpres-84-2010': ['Pengesahan Joint Convention keselamatan pengelolaan bahan bakar bekas dan limbah radioaktif.', 'Ratification of the Joint Convention on safety of spent fuel and radioactive waste management.'],
    'perpres-46-2009': ['Pengesahan amandemen Konvensi Proteksi Fisik Bahan Nuklir.', 'Ratification of the amendment to the Convention on the Physical Protection of Nuclear Material.'],
    'lainnya-b344440-1-2026': ['Sistem proteksi fisik instalasi nuklir dan bahan nuklir.', 'Physical protection system for nuclear installations and material.'],
    'uu-22-2023': ['Pengesahan Traktat Pelarangan Senjata Nuklir.', 'Ratification of the Treaty on the Prohibition of Nuclear Weapons.'],
  });

  tambah(d, '13', 'butir', [
    linReg('uu-8-1978', 'UU 8/1978 mengesahkan Traktat Nonproliferasi Senjata Nuklir', 'Law 8/1978 ratifies the Non-Proliferation Treaty'),
    linReg('uu-9-1997', 'UU 9/1997 mengesahkan Traktat Kawasan Bebas Senjata Nuklir Asia Tenggara', 'Law 9/1997 ratifies the Southeast Asia Nuclear Weapon Free Zone Treaty'),
    linReg('pp-43-2006', 'PP 43/2006 tentang perizinan reaktor nuklir', 'Gov. Reg. 43/2006 on nuclear reactor licensing'),
    linReg('pp-46-2009', 'PP 46/2009 tentang batas pertanggungjawaban kerugian nuklir', 'Gov. Reg. 46/2009 on the limit of nuclear damage liability'),
    linReg('perpres-84-2010', 'Perpres 84/2010 mengesahkan Joint Convention bahan bakar bekas dan limbah', 'Perpres 84/2010 ratifies the Joint Convention on spent fuel and waste'),
    linReg('pp-54-2012', 'PP 54/2012 tentang keselamatan dan keamanan instalasi nuklir', 'Gov. Reg. 54/2012 on safety and security of nuclear installations'),
    linReg('pp-2-2014', 'PP 2/2014 tentang perizinan instalasi nuklir dan pemanfaatan bahan nuklir', 'Gov. Reg. 2/2014 on licensing of nuclear installations and use of nuclear material'),
    linReg('uu-22-2023', 'UU 22/2023 mengesahkan Traktat Pelarangan Senjata Nuklir', 'Law 22/2023 ratifies the Treaty on the Prohibition of Nuclear Weapons'),
  ].map(([tg, a, b, url]) => ({ tanggal: tg, judul: T(a, b), ...(url ? { url } : {}) })).concat([
    { tanggal: '1970-03-02', judul: T('Indonesia menandatangani Traktat Nonproliferasi Senjata Nuklir', 'Indonesia signs the Non-Proliferation Treaty'), url: 'https://en.wikipedia.org/wiki/Nuclear_power_in_Indonesia' },
    { tanggal: '2016-11-01', judul: T('Vietnam menangguhkan rencana nuklirnya (November 2016; pembanding)', 'Vietnam suspends its nuclear plans (November 2016; comparison)'), url: 'https://en.wikipedia.org/wiki/Nuclear_power_in_Vietnam' },
    { tanggal: '2025-05-26', judul: T('RUPTL 2025-2034 disahkan memuat dua kuota PLTN 250 MW (2032 dan 2033)', 'RUPTL 2025-2034 approved with two 250 MW nuclear quotas (2032 and 2033)'), url: RUPTL_PDF },
  ]));
  d.bab['13'].butir.sort((a, b) => a.tanggal.localeCompare(b.tanggal));
  pakaiSumber(d, '13', 'uu8', 'pp46', 'pp54', 'pp2', 'idnuk', 'vnnuk', 'ruptlp');

  pasang(d, '14', teks(['uu10', 'pp2', 'pp54', 'pp46', 'pbp', 'ruptlp'], [
    ['Kewajiban 1, izin: pemanfaatan tenaga nuklir wajib berizin; tahapan izin instalasi nuklir diatur PP 2/2014 dan Peraturan Bapeten 1/2022 (judul regulasi).', 'Duty 1, licence: use of nuclear energy requires a licence; the licensing stages of nuclear installations are in Gov. Reg. 2/2014 and Bapeten Regulation 1/2022 (regulation titles).'],
    ['Kewajiban 2, keselamatan dan keamanan: PP 54/2012 mengatur keselamatan dan keamanan instalasi nuklir (judul regulasi).', 'Duty 2, safety and security: Gov. Reg. 54/2012 governs safety and security of nuclear installations (regulation title).'],
    ['Kewajiban 3, proteksi fisik: Peraturan Bapeten 1/2026 mengatur sistem proteksi fisik instalasi dan bahan nuklir (judul regulasi).', 'Duty 3, physical protection: Bapeten Regulation 1/2026 governs the physical protection of installations and nuclear material (regulation title).'],
    ['Kewajiban 4, pertanggungjawaban: PP 46/2009 menetapkan batas pertanggungjawaban kerugian nuklir (judul regulasi); asuransi atau jaminan keuangan dibaca pada naskahnya.', 'Duty 4, liability: Gov. Reg. 46/2009 sets the limit of nuclear damage liability (regulation title); read insurance or financial security in the text.'],
    ['Kewajiban 5, kesiapan sebelum konstruksi: RUPTL mensyaratkan jaminan bahan bakar, pengelolaan limbah, keselamatan, keamanan, dan rekomendasi IAEA sebelum PLTN dibangun dan dioperasikan.', 'Duty 5, readiness before construction: RUPTL requires assured fuel, waste management, safety, security and IAEA recommendations before a plant is built and operated.'],
    ['Kewajiban 6, nonproliferasi: Indonesia terikat NPT (UU 8/1978), zona bebas senjata nuklir Asia Tenggara (UU 9/1997), dan Traktat Pelarangan Uji Coba (UU 1/2012).', 'Duty 6, non-proliferation: Indonesia is bound by the NPT (Law 8/1978), the Southeast Asia nuclear weapon free zone (Law 9/1997) and the Test-Ban Treaty (Law 1/2012).'],
    ['Biaya perizinan: PP tarif penerimaan negara bukan pajak untuk Bapeten ada di basis regulasi (mis. PP 42/2022 dan PP 8/2019); besaran dibaca pada naskahnya.', 'Licensing fees: non-tax state revenue tariff regulations for Bapeten are in the regulation base (e.g. Gov. Reg. 42/2022 and 8/2019); read amounts in the text.'],
    ['Insentif: tidak ada insentif fiskal khusus nuklir di sumber yang dibaca; skema pendanaan umum ada di bab Pembiayaan.', 'Incentives: no nuclear-specific fiscal incentive in the sources read; general funding schemes are in the Financing chapter.'],
  ]));

  tambah(d, '15', 'butir', langkah(['ed', 'ruptlp'], [
    ['Siapkan 19 elemen infrastruktur', 'Prepare the 19 infrastructure elements', 'Sebelum konstruksi, negara perlu memenuhi 19 elemen IAEA; Indonesia memenuhi 16 menurut INIR 2009.', 'Before construction a country must meet the 19 IAEA elements; Indonesia met 16 per the 2009 INIR.', 'Pemerintah', 'Government'],
    ['Pilih teknologi dan skema pembiayaan', 'Choose technology and financing', 'Putuskan jenis reaktor, mitra, dan struktur pendanaan; RUPTL tidak membatasi pada SMR.', 'Decide reactor type, partner and funding structure; RUPTL is not limited to SMRs.', 'ESDM, PLN, Danantara', 'Energy Ministry, PLN, Danantara'],
    ['Komisioning dan izin operasi', 'Commissioning and operating permit', 'Uji komisioning dan izin operasi dari Bapeten sebelum pemuatan bahan bakar komersial.', 'Commissioning tests and the operating permit from Bapeten before commercial fuel loading.', 'Bapeten, operator', 'Bapeten, operator'],
  ]).butir);
  d.bab['15'].butir.forEach((x, i) => { x.judul = T(`${i + 1}. ${x.judul.id.replace(/^\d+\.\s*/, '')}`, `${i + 1}. ${x.judul.en.replace(/^\d+\.\s*/, '')}`); });

  tambah(d, '17', 'paragraf', [
    T('Tiga kelompok teknologi dibahas untuk Indonesia: reaktor air ringan skala besar (APR1400 Korea di Barakah), SMR (NuScale 77 MW per modul), dan reaktor generasi baru seperti garam cair (TMSR500 usulan Thorcon). Tingkat kematangan berbeda: yang pertama beroperasi komersial, SMR Barat belum ada unit komersial pertama, dan garam cair belum teruji komersial menurut sumber yang dibaca.', 'Three technology groups are discussed for Indonesia: large light-water reactors (Korea\'s APR1400 at Barakah), SMRs (NuScale at 77 MW per module) and new-generation reactors such as molten salt (Thorcon\'s proposed TMSR500). Maturity differs: the first is in commercial operation, Western SMRs have no first commercial unit, and molten salt is not commercially proven per the sources read.'),
    T('Reaktor skala besar baru yang dibangun dengan mitra negara: Rooppur Bangladesh (2 x VVER-1200, unit 1 kritis Oktober 2026 menurut Wikipedia) dan Akkuyu Turki (tertunda tiga tahun, reaktor pertama diharapkan 2026).', 'New large reactors built with state partners: Rooppur in Bangladesh (2 x VVER-1200, unit 1 critical in October 2026 per Wikipedia) and Akkuyu in Turkey (delayed three years, first reactor expected 2026).'),
    T('Reaktor terapung dan modul pabrikan: berita direktori mencatat rencana Rosatom menempatkan reaktor kelas pemecah es pada platform terapung; belum ada rencana komersial di Indonesia di sumber yang dibaca.', 'Floating reactors and factory modules: the directory\'s news records a Rosatom plan to place icebreaker-class reactors on floating platforms; no commercial plan in Indonesia is in the sources read.'),
    T('Bahan bakar maju (HALEU, TRISO) dan daur bahan bakar tertutup masih riset; tidak ada angka biaya yang bersumber di naskah ini.', 'Advanced fuels (HALEU, TRISO) and closed fuel cycles remain research; no sourced cost figure is in this text.'),
    T('Reaktor riset Indonesia: RSG-GAS 30 MWt di Serpong, reaktor Bandung 2 MWt, dan reaktor Yogyakarta 100 kWt (bab Proyek).', 'Indonesia\'s research reactors: the 30 MWt RSG-GAS at Serpong, the 2 MWt Bandung reactor and the 100 kWt Yogyakarta reactor (Projects chapter).'),
  ]);
  pakaiSumber(d, '17', 'rooppur', 'akkuyu', 'rsg');

  const riset = risetTabel('nuklir', /nuclear|reactor|radiat|thorium|uranium|energy|power/i, 8, ['Riset dari irisan OpenAlex di repo. Inovasi tercatat di direktori METI untuk nuklir belum ada.', 'Research from the OpenAlex slice in the repo. No nuclear innovation is yet recorded in the METI directory.']);
  pasang(d, '18', riset);

  pasang(d, '26', tabel(['wna_uae', 'wna_ph', 'nuscale2', 'direktori'], 8, [kol('pos', 'Kasus', 'Case'), kol('nilai', 'Nilai', 'Value'), kol('catatan', 'Catatan', 'Note')], [
    { pos: T('Kontrak Barakah (4 unit)', 'Barakah contract (4 units)'), nilai: 'USD 20,4 miliar', catatan: T('World Nuclear Association', 'World Nuclear Association') },
    { pos: T('Pembiayaan total Barakah', 'Barakah total financing'), nilai: 'USD 24,4 miliar', catatan: T('World Nuclear Association', 'World Nuclear Association') },
    { pos: T('Bataan (biaya bangun 1984)', 'Bataan (1984 construction cost)'), nilai: 'USD 1,9 miliar', catatan: T('Tidak pernah beroperasi', 'Never operated') },
    { pos: T('Bataan (taksiran rehabilitasi Nov 2022)', 'Bataan (Nov 2022 rehabilitation estimate)'), nilai: 'USD 2,3 miliar', catatan: T('World Nuclear Association', 'World Nuclear Association') },
    { pos: T('Proyek NuScale UAMPS (dibatalkan 9 Nov 2023)', 'NuScale UAMPS project (cancelled 9 Nov 2023)'), nilai: 'USD 89 per MWh', catatan: T('Harga target naik dari USD 58', 'Target price rose from USD 58') },
    { pos: T('Pendanaan publik internasional untuk nuklir Indonesia 2006 sampai 2023', 'International public finance for Indonesian nuclear 2006 to 2023'), nilai: 'USD 13,2 juta', catatan: T('IRENA dan OECD, kumulatif (bab Pembiayaan)', 'IRENA and OECD, cumulative (Financing chapter)') },
    { pos: T('Investasi PLTN di Indonesia', 'Nuclear investment in Indonesia'), nilai: '-', catatan: T('Belum ada keputusan investasi atau struktur pendanaan di sumber', 'No investment decision or funding structure in the sources') },
  ], ['Merger, akuisisi, dan IPO nuklir tidak ditemukan di sumber yang dibaca; baris ini merangkum angka biaya dan pembiayaan pembanding.', 'No nuclear mergers, acquisitions or IPOs were found in the sources read; these rows summarise comparison cost and financing figures.']));

  tambah(d, '27', 'paragraf', [T('Manfaat: listrik beban dasar tanpa emisi operasi (DEN, 2026). Risiko dan safeguard: kecelakaan, bahan bakar bekas, dan limbah; RUPTL mensyaratkan jaminan pengelolaan limbah dan rekomendasi IAEA. Hak masyarakat: pelibatan pemangku kepentingan adalah elemen ke-19 IAEA, dan penolakan warga tercatat di Pulau Gelasa dan Kalimantan Barat (bab Sebaran).', 'Benefits: baseload power with no operating emissions (DEN, 2026). Risks and safeguards: accidents, spent fuel and waste; RUPTL requires waste management assurance and IAEA recommendations. Community rights: stakeholder involvement is the 19th IAEA element, and resident opposition is recorded on Gelasa Island and in West Kalimantan (Distribution chapter).')]);
  pakaiSumber(d, '27', 'ruptlp', 'den26', 'mongabay_gelasa');
  tambah(d, '29', 'paragraf', [
    T('Kontroversi 3, nuklir dan energi terbarukan. Pendukung: nuklir melengkapi surya dan angin dengan listrik beban dasar dan menekan emisi. Penolak (IESR): biaya tinggi dan pembengkakan dua sampai tiga kali pada proyek berjalan, serta risiko menggeser prioritas dari energi terbarukan yang lebih cepat dibangun. Kedua pandangan bersumber di naskah ini (DEN; Mongabay).', 'Controversy 3, nuclear and renewables. Supporters: nuclear complements solar and wind with baseload and cuts emissions. Opponents (IESR): high cost and two- to three-fold overruns on projects under way, and a risk of shifting priority from faster-built renewables. Both views are sourced in this text (DEN; Mongabay).'),
    T('Kontroversi 4, 250 atau 500 MW dan jumlah lokasi. Angka berbeda antarpejabat berasal dari satuan yang berbeda (satu kuota versus jumlah dua kuota; 28 wilayah menurut RUPTL versus 29 lokasi di 13 wilayah menurut Dirjen EBTKE). Hipotesis METI: pernyataan publik perlu menyebut satuan dan sumber dokumennya agar perdebatan tidak berputar pada selisih hitung.', 'Controversy 4, 250 or 500 MW and the number of sites. Figures differ between officials because of different units (one quota versus the total of two; 28 regions per RUPTL versus 29 sites in 13 regions per the EBTKE director general). METI hypothesis: public statements should name the unit and source document so debate does not circle around counting differences.'),
  ]);
  pakaiSumber(d, '29', 'den26', 'ruptlp', 'ibp25');
  d.bab['30'].baris.push(
    { item: T('PLTN RUPTL (kuota Sumatera-Bangka dan Kalimantan)', 'RUPTL nuclear (Sumatra-Bangka and Kalimantan quotas)'), nilai: '500', tahun: '2034', sumber: 'RUPTL 2025-2034' },
    { item: T('Potensi PLTN pada 28 wilayah (RUPTL)', 'Nuclear potential in 28 regions (RUPTL)'), nilai: '70 GW', tahun: '-', sumber: 'RUPTL 2025-2034' },
  );
  pakaiSumber(d, '30', 'ruptlp');
  tambah(d, '31', 'paragraf', [T(...hp('pemasok dan industri lokal: rantai nilai nuklir menuntut mutu tinggi (komponen berkelas nuklir, pekerjaan sipil, dan jasa inspeksi); kandungan lokal perlu dirundingkan sejak pemilihan teknologi.', 'suppliers and local industry: the nuclear value chain demands high quality (nuclear-grade components, civil works and inspection services); local content must be negotiated from technology selection.')), T(...hp('akademisi dan BRIN: SDM, uji tapak, bahan bakar, dan limbah; pejabat BRIN menilai SDM Indonesia sudah mumpuni (Katadata, 2024) tetapi pengalaman operasi komersial belum ada.', 'academics and BRIN: human resources, site tests, fuel and waste; BRIN officials judge Indonesian human resources capable (Katadata, 2024) but there is no commercial operating experience.')), T(...hp('pemda dan masyarakat: libatkan warga sejak penetapan tapak; kasus Gelasa dan Kalimantan Barat menunjukkan penolakan muncul di tahap evaluasi tapak.', 'local governments and communities: involve residents from site selection; the Gelasa and West Kalimantan cases show opposition arises at the site evaluation stage.'))]);
  tambah(d, '32', 'paragraf', [
    T('Keputusan penetapan tapak PLTN Sumatera-Bangka dan Kalimantan (kuota RUPTL 2032 dan 2033).', 'Decisions fixing the Sumatra-Bangka and Kalimantan nuclear sites (RUPTL quotas of 2032 and 2033).'), T('Penerbitan izin tapak pertama oleh Bapeten dan status permohonan Thorcon.', 'Issue of the first site permit by Bapeten and the status of Thorcon\'s application.'), T('Pembahasan RUU Energi Baru dan Energi Terbarukan dan ketentuan nuklirnya.', 'Discussion of the New and Renewable Energy Bill and its nuclear provisions.'),
    T('Penilaian IAEA berikutnya terhadap 19 elemen infrastruktur (terakhir INIR 2009).', 'The next IAEA assessment of the 19 infrastructure elements (last INIR in 2009).'), T('Perkembangan Rooppur dan Akkuyu sebagai pembanding waktu dan biaya.', 'Progress of Rooppur and Akkuyu as time and cost comparisons.'), T('Revitalisasi fasilitas bahan bakar BRIN untuk RSG-GAS.', 'BRIN\'s revitalisation of fuel facilities for RSG-GAS.'), T('Skema pendanaan dan harga listrik PLTN pertama.', 'The funding scheme and electricity price of the first plant.'),
  ]);
  pakaiSumber(d, '32', 'brin_bbn', 'rooppur', 'akkuyu');

  const pus = baca('public/data/pustaka.json').baris;
  for (const pid of ['pk-reg-uu-10-1997', 'pk-reg-pp-2-2014', 'pk-reg-pp-54-2012', 'pk-reg-pp-46-2009', 'pk-reg-pp-43-2006']) { const p = pus.find((x) => x.id === cekId('pus', pid)); d.bab['36'].baris.push({ judul: p.judul, id: pid, url: '/pustaka?id=' + encodeURIComponent(pid), penerbit: p.penerbit || '-', mengapa: T('Peraturan di Pustaka METI', 'Regulation in the METI Library') }); }
  d.bab['36'].baris.push({ judul: 'Milestones in the Development of a National Infrastructure for Nuclear Power', url: 'https://www.iaea.org/publications/8009/milestones-in-the-development-of-a-national-infrastructure-for-nuclear-power', penerbit: 'IAEA', mengapa: T('Dasar 19 elemen infrastruktur yang dirujuk RUPTL', 'Basis of the 19 infrastructure elements cited by RUPTL') });
  d.bab['36'].sumber.push('direktori', 'iaea');

  /* kasus: tambah catatan primer RUPTL pada kasus yang ada */
  return pangkas(d);
}
