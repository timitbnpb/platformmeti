// Pendalaman naskah Efisiensi energi (8 Nov 2026): id organisasi, proyek, regulasi, pendanaan, inovasi dari repo plus penjelasan baku.
import { T, S, hp, faq, glos, rumus, langkah, kol, baca, tambah, pasang, pemain, proyek, regulasi, skema, risetTabel, linReg, cekId, sumberBaru, pakaiSumber, pangkas, SWB, nilaiProyek, juta, regS, SDIREKTORI, pasarListrik, SSTATPLN } from './topik_enam_lib.mjs';

const pj = (id) => nilaiProyek(id);
const wb = (id, status) => { const p = pj(id); const v = p.nilai_investasi?.[0]?.nilai; return [p.nama, T('Indonesia', 'Indonesia'), T(v ? `USD ${juta(v)} juta (komitmen Bank Dunia)` : 'tanpa komitmen tercatat', v ? `USD ${juta(v)} million (World Bank commitment)` : 'no commitment recorded'), T(...status), 'Bank Dunia, via direktori METI', id]; };

export function dalam(d) {
  sumberBaru(d, {
    direktori: SDIREKTORI, wbp: SWB, statpln: SSTATPLN,
    pp70: regS('pp-70-2009'), pm3: regS('permen-esdm-3-2025'), pm1: regS('permen-esdm-1-2026'), pda5: regS('perda-b345755-5-2026'), pm14: regS('permen-esdm-14-2016'), pm9: regS('permen-esdm-9-2018'),
    iea_conv: S('IEA, unit converter dan definisi tonne of oil equivalent (1 TOE = 41,868 GJ, sekitar 11.630 kWh)', 'Badan Energi Internasional (IEA)', 'https://www.iea.org/data-and-statistics/data-tools/unit-converter-and-glossary', '2026-11-08', 2026, 'resmi'),
  });

  tambah(d, '2', 'butir', faq(['ed', 'iea_conv', 'pda5', 'pm1'], [
    ['Apa beda efisiensi energi dan konservasi energi?', 'What is the difference between energy efficiency and energy conservation?', 'Efisiensi energi berarti memakai energi lebih sedikit untuk hasil yang sama (mis. AC inverter). Konservasi energi lebih luas: mencakup efisiensi, pengurangan pemakaian, dan pengelolaan, seperti istilah yang dipakai PP 33/2023.', 'Energy efficiency means using less energy for the same result (e.g. an inverter air conditioner). Conservation is broader: efficiency, reduced use and management, as the term is used in Gov. Reg. 33/2023.'],
    ['Berapa kWh dalam satu TOE?', 'How many kWh are in one TOE?', 'Satu tonne of oil equivalent (TOE) adalah 41,868 GJ atau sekitar 11.630 kWh menurut IEA. Ambang kewajiban 500 TOE (bangunan) berarti sekitar 5,8 juta kWh per tahun (EST).', 'One tonne of oil equivalent (TOE) is 41.868 GJ or about 11,630 kWh per the IEA. The 500 TOE obligation threshold for buildings means about 5.8 million kWh a year (EST).'],
    ['Apakah rumah tangga wajib melakukan manajemen energi?', 'Must households apply energy management?', 'Tidak. Kewajiban manajemen energi berlaku bagi pengguna energi di atas ambang TOE per tahun (lihat bab Sebaran); rumah tangga terkena lewat standar dan label produk.', 'No. The energy management duty applies to users above the annual TOE thresholds (see the Distribution chapter); households are reached through product standards and labels.'],
    ['Apa itu kontrak kinerja energi?', 'What is an energy performance contract?', 'Perjanjian ESCO dengan pemilik bangunan: ESCO membiayai atau memasang perbaikan efisiensi dan dibayar dari penghematan yang terukur. Dua bentuk umum: shared savings dan guaranteed savings.', 'An agreement between an ESCO and a building owner: the ESCO finances or installs efficiency upgrades and is paid from measured savings. Two common forms: shared savings and guaranteed savings.'],
    ['Bagaimana penghematan dihitung dan dibuktikan?', 'How is saving calculated and proven?', 'Penghematan = konsumsi dasar (baseline) dikurangi konsumsi sesudah perbaikan, disesuaikan untuk cuaca dan produksi. Protokol pengukuran dan verifikasi (M&V) seperti IPMVP dipakai di kontrak kinerja.', 'Saving = baseline consumption minus post-upgrade consumption, adjusted for weather and output. Measurement and verification (M&V) protocols such as IPMVP are used in performance contracts.'],
    ['Apakah ada aturan efisiensi untuk bangunan gedung?', 'Are there efficiency rules for buildings?', 'Ada. Peraturan daerah 5/2026 mengatur efisiensi energi dan air pada bangunan gedung (basis regulasi repo, ditetapkan 5 Feb 2026); Permen ESDM 3/2025 mewajibkan konservasi energi di instansi pemerintah pusat dan daerah.', 'Yes. Regional Regulation 5/2026 governs energy and water efficiency in buildings (repo regulation base, enacted 5 Feb 2026); Energy Ministry Reg. 3/2025 requires energy conservation in central and regional government bodies.'],
    ['Siapa yang boleh membuka usaha jasa ESCO?', 'Who may open an ESCO business?', 'Usaha jasa konservasi energi diatur Permen ESDM 1/2026 (menggantikan Permen ESDM 14/2016 yang dicabut); persyaratan rinci dibaca pada naskahnya.', 'The energy conservation services business is governed by Energy Ministry Reg. 1/2026 (replacing the revoked Energy Ministry Reg. 14/2016); read the detailed requirements in the text.'],
  ]).butir);

  tambah(d, '3', 'butir', glos(['ed', 'iea_conv'], [
    ['Efisiensi energi', 'Energy efficiency', 'Rasio keluaran berguna terhadap energi masuk; naik bila layanan sama dilayani energi lebih sedikit.', 'Ratio of useful output to energy input; it rises when the same service is delivered with less energy.'],
    ['Konservasi energi', 'Energy conservation', 'Upaya sistematis hemat energi: efisiensi, perubahan perilaku, dan manajemen (istilah PP 33/2023).', 'Systematic effort to save energy: efficiency, behaviour change and management (term of Gov. Reg. 33/2023).'],
    ['ISO 50001', 'ISO 50001', 'Standar internasional sistem manajemen energi untuk perbaikan kinerja energi berkelanjutan.', 'The international energy management system standard for continual energy performance improvement.'],
    ['Audit awal dan audit rinci', 'Preliminary and detailed audit', 'Audit awal menyaring peluang dari data dan tinjauan singkat; audit rinci mengukur beban per peralatan dan menghitung ekonomi tiap rekomendasi.', 'A preliminary audit screens opportunities from data and a short walk-through; a detailed audit measures load per equipment and costs each recommendation.'],
    ['Retrofit', 'Retrofit', 'Memasang perbaikan efisiensi pada bangunan atau pabrik yang sudah ada.', 'Installing efficiency upgrades in an existing building or plant.'],
    ['Kontrak kinerja energi', 'Energy performance contract', 'Kontrak ESCO yang dibayar dari penghematan terukur.', 'An ESCO contract paid from measured savings.'],
    ['Shared savings', 'Shared savings', 'Penghematan dibagi antara ESCO dan pemilik menurut persentase yang disepakati; ESCO menanggung biaya awal.', 'Savings are split between ESCO and owner at an agreed percentage; the ESCO bears the upfront cost.'],
    ['Guaranteed savings', 'Guaranteed savings', 'ESCO menjamin tingkat penghematan minimum; kekurangan ditanggung ESCO.', 'The ESCO guarantees a minimum saving; any shortfall falls on the ESCO.'],
    ['Pengukuran dan verifikasi (M&V)', 'Measurement and verification (M&V)', 'Cara membuktikan penghematan dengan baseline dan penyesuaian; acuan umum IPMVP.', 'How to prove savings with a baseline and adjustments; the common reference is IPMVP.'],
    ['Baseline', 'Baseline', 'Konsumsi energi sebelum perbaikan yang dipakai sebagai pembanding.', 'Energy consumption before the upgrade, used as the comparison.'],
    ['COP', 'COP', 'Coefficient of performance: panas atau dingin yang dihasilkan per satuan listrik; makin besar makin efisien.', 'Coefficient of performance: heat or cooling delivered per unit of electricity; higher is more efficient.'],
    ['EER dan SEER', 'EER and SEER', 'Rasio pendinginan terhadap daya listrik (sesaat dan musiman); CSPF dipakai SKEM AC di Indonesia.', 'Cooling-to-electric-power ratios (instant and seasonal); CSPF is used by the Indonesian AC MEPS.'],
    ['Variable speed drive (VSD)', 'Variable speed drive (VSD)', 'Pengatur kecepatan motor yang menurunkan daya pompa atau kipas bila beban rendah.', 'A motor speed controller that cuts pump or fan power at low load.'],
    ['Sistem manajemen bangunan (BMS)', 'Building management system (BMS)', 'Sistem kendali terpusat untuk AC, pencahayaan, dan peralatan gedung.', 'A central control system for a building\'s air conditioning, lighting and equipment.'],
    ['OTTV dan SNI 6389', 'OTTV and SNI 6389', 'Nilai perpindahan termal selubung bangunan; SNI 6389 adalah standar konservasi energi selubung bangunan gedung.', 'Overall thermal transfer value of the building envelope; SNI 6389 is the envelope energy conservation standard.'],
    ['Greenship', 'Greenship', 'Sistem penilaian bangunan hijau Indonesia; 60 bangunan bersertifikat hingga 2022 menurut sumber di naskah ini.', 'The Indonesian green building rating system; 60 buildings were certified by 2022 per sources in this text.'],
    ['Kogenerasi (CHP)', 'Cogeneration (CHP)', 'Produksi listrik dan panas berguna sekaligus dari satu bahan bakar; efisiensi total lebih tinggi.', 'Producing electricity and useful heat together from one fuel; higher overall efficiency.'],
    ['Efek rebound', 'Rebound effect', 'Sebagian penghematan hilang karena pengguna memakai lebih banyak layanan setelah biaya turun.', 'Part of the saving is lost because users consume more service once costs fall.'],
    ['Pergeseran beban puncak', 'Peak shifting', 'Memindahkan pemakaian dari jam puncak ke jam sepi, misalnya lewat penyimpanan dingin.', 'Moving use from peak to off-peak hours, for example with cold storage.'],
    ['Motor kelas IE', 'IE motor class', 'Kelas efisiensi motor listrik (IE1 sampai IE4) menurut standar IEC; kelas lebih tinggi lebih hemat.', 'Electric motor efficiency classes (IE1 to IE4) under IEC; higher classes save more.'],
  ]).butir);

  tambah(d, '4', 'paragraf', [
    T('Efisiensi energi adalah satu-satunya sumber energi yang tidak perlu dibangun, dibebaskan lahannya, atau disambungkan ke jaringan. Satu kWh yang tidak dipakai di jam puncak menghindarkan kapasitas pembangkit dan saluran yang paling mahal.', 'Energy efficiency is the one energy source that needs no building, land acquisition or grid connection. A kWh not used at the peak hour avoids the most expensive generation and line capacity.'),
    T('Cara kerjanya ada tiga: peralatan yang lebih baik (AC inverter, motor efisien, LED), sistem yang lebih baik (pengendali, isolasi, pemulihan panas), dan perilaku yang lebih baik (manajer energi, target, pemantauan). Peralatan dan sistem membutuhkan modal; perilaku membutuhkan data.', 'It works in three ways: better equipment (inverter air conditioners, efficient motors, LED), better systems (controls, insulation, heat recovery) and better behaviour (energy managers, targets, monitoring). Equipment and systems need capital; behaviour needs data.'),
  ]);

  d.bab['5'].rumus.push(
    T('Konversi ke TOE = Energi (kWh) / 11.630', 'Conversion to TOE = Energy (kWh) / 11,630'),
    T('Emisi dihindari (tCO2) = Energi dihemat (kWh) x Faktor emisi listrik (gCO2 per kWh) / 1.000.000', 'Avoided emissions (tCO2) = Energy saved (kWh) x Grid emission factor (gCO2 per kWh) / 1,000,000'),
    T('Payback sederhana (tahun) = Investasi / Penghematan biaya tahunan', 'Simple payback (years) = Investment / Annual cost saving'),
  );
  d.bab['5'].contoh.push(
    T('Konversi (angka ilustrasi): 1 GWh = 1.000.000 kWh / 11.630 = sekitar 86 TOE (EST); sebuah gedung 6.000 MWh per tahun setara sekitar 516 TOE, di atas ambang 500 TOE.', 'Conversion (illustrative figures): 1 GWh = 1,000,000 kWh / 11,630 = about 86 TOE (EST); a building using 6,000 MWh a year equals about 516 TOE, above the 500 TOE threshold.'),
    T('Emisi (angka ilustrasi dengan faktor 680 gCO2 per kWh, intensitas listrik Indonesia 2024 menurut Ember lewat OWID di bab Proyeksi): menghemat 1 juta kWh menghindarkan 1.000.000 x 680 / 1.000.000 = 680 tCO2 (EST).', 'Emissions (illustrative figures with 680 gCO2 per kWh, the 2024 Indonesian electricity intensity per Ember via OWID in the Projections chapter): saving 1 million kWh avoids 1,000,000 x 680 / 1,000,000 = 680 tCO2 (EST).'),
    T('Payback (angka ilustrasi): investasi Rp900 juta dengan hemat tagihan Rp300 juta per tahun = 3 tahun (EST).', 'Payback (illustrative figures): an investment of IDR 900 million with an annual bill saving of IDR 300 million = 3 years (EST).'),
  );
  pakaiSumber(d, '5', 'ed', 'iea_conv', 'owid');

  pasang(d, '6', langkah(['ed', 'pp33', 'pm1', 'detikx', 'esco'], [
    ['Pembuat aturan', 'Rule makers', 'Pemerintah menetapkan PP 33/2023, Permen ESDM 8/2025 (manajemen energi), 3/2025 (instansi pemerintah), dan 1/2026 (ESCO).', 'The government sets Gov. Reg. 33/2023 and Energy Ministry Regs 8/2025 (energy management), 3/2025 (government bodies) and 1/2026 (ESCOs).', 'Direktorat Konservasi Energi, Badan Standardisasi Nasional, Kementerian Perindustrian', 'Directorate of Energy Conservation, National Standardisation Agency, Ministry of Industry'],
    ['Pengujian dan sertifikasi produk', 'Product testing and certification', 'Hanya tujuh laboratorium uji tersedia untuk SKEM AC (ESDM, detikX 2024).', 'Only seven test laboratories are available for AC MEPS (Energy Ministry, detikX 2024).', 'Laboratorium uji, balai pengujian ketenagalistrikan', 'Test laboratories, electricity testing institute'],
    ['Produsen dan importir', 'Manufacturers and importers', 'Merancang dan mengedarkan produk berstiker; komponen kunci seperti kompresor masih diimpor.', 'Design and sell labelled products; key components such as compressors are still imported.', 'Daikin, Polytron, dan produsen AC lain', 'Daikin, Polytron and other AC makers'],
    ['Distribusi dan ritel', 'Distribution and retail', 'Menampilkan stiker label dan menjelaskannya ke pembeli; sosialisasi toko dinilai minim.', 'Display the label sticker and explain it to buyers; shop outreach is rated minimal.', 'Toko elektronik, ritel daring', 'Electronics shops, online retail'],
    ['Pengguna energi besar', 'Large energy users', 'Manajer energi, program, audit, rekomendasi, pelaporan.', 'Energy manager, programme, audit, recommendations, reporting.', 'Industri, bangunan, penyedia energi', 'Industry, buildings, energy providers'],
    ['Auditor dan lembaga sertifikasi', 'Auditors and certifiers', 'Auditor energi bersertifikat, lembaga sertifikasi sistem manajemen, dan pemeriksa mutu.', 'Certified energy auditors, management system certifiers and inspection bodies.', 'PT Surveyor Indonesia, TUV NORD, DQS', 'PT Surveyor Indonesia, TUV NORD, DQS'],
    ['ESCO dan pembiaya', 'ESCOs and financiers', 'Indonesia hanya mencatat 12 ESCO di situs pemerintah (IKI, 2026); pembiayaan proyek efisiensi sulit dari bank.', 'Indonesia lists only 12 ESCOs on the government site (IKI, 2026); banks find efficiency projects hard to finance.', 'ESCO, IFC, lembaga keuangan', 'ESCOs, IFC, financial institutions'],
    ['Pemantauan dan pelaporan', 'Monitoring and reporting', 'Entitas melapor ke pemerintah; pemerintah menghitung hemat nasional (10,42 juta SBM pada 2023).', 'Entities report to government; government totals national savings (10.42 million BOE in 2023).', 'Direktorat Konservasi Energi', 'Directorate of Energy Conservation'],
  ]));

  tambah(d, '11', 'paragraf', pasarListrik()); pakaiSumber(d, '11', 'statpln');

  pemain(d, [
    ['Direktorat Konservasi Energi', ['Pembuat kebijakan konservasi energi; pelapor hasil manajemen energi 2023', 'Energy conservation policy maker; reporter of 2023 energy management results'], 'Siaran pers ESDM 9 Feb 2024'],
    ['Direktorat Jenderal Energi Baru, Terbarukan dan Konservasi Energi', ['Ditjen induk Direktorat Konservasi Energi', 'Parent directorate general of the Directorate of Energy Conservation'], 'Direktori METI'],
    ['Badan Standardisasi Nasional', ['Menetapkan SNI untuk peralatan dan bangunan, dasar standar kinerja energi', 'Sets SNI standards for equipment and buildings, the base of energy performance standards'], 'Direktori METI'],
    ['PT Surveyor Indonesia (ID Survey)', ['BUMN pengujian dan inspeksi; tercatat berkepakaran efisiensi', 'State-owned testing and inspection company; listed with efficiency expertise'], 'Direktori METI'],
    ['PT PLN Icon Plus', ['Anak usaha PLN berkepakaran jaringan dan efisiensi', 'PLN subsidiary with grid and efficiency expertise'], 'Direktori METI'],
    ['International Finance Corporation', ['Lembaga pembiayaan swasta Bank Dunia; calon pembiaya proyek efisiensi', 'World Bank private-sector arm; possible financier of efficiency projects'], 'Direktori METI'],
    ['Giz', ['Mitra teknis Kementerian ESDM yang menargetkan efisiensi menyumbang 37 persen penurunan emisi sektor energi', 'Technical partner of the Energy Ministry targeting efficiency to deliver 37 percent of energy-sector emission cuts'], 'Judul GIZ via naskah'],
    ['Kamar Dagang dan Industri Indonesia (Komite Tetap Energi Baru Terbarukan)', ['Wadah pengusaha untuk advokasi kebijakan energi, termasuk pembiayaan', 'Business forum for energy policy advocacy, including financing'], 'Direktori METI'],
    ['Asosiasi Produsen Listrik Swasta Indonesia', ['Asosiasi pembangkit swasta; pihak yang merasakan permintaan listrik turun lewat efisiensi', 'Private power association; affected by lower demand through efficiency'], 'Direktori METI'],
    ['Daikin', ['Produsen AC; disebut berpandangan bintang lebih tinggi tidak mungkin lebih murah', 'Air conditioner maker; said to hold that higher stars cannot be cheaper'], 'Mongabay, 30 Jun 2024'],
    ['Polytron', ['Produsen elektronik lokal; menyebut AC inverter bintang 4 lebih mahal 35 sampai 60 persen', 'Local electronics maker; says 4-star inverter ACs cost 35 to 60 percent more'], 'detikX, 1 Jul 2024'],
    ['CLASP', ['Lembaga advokasi standar dan label peralatan; berpandangan efisiensi lebih penting daripada harga bagi pembeli AC di luar Papua', 'Advocacy body for appliance standards and labels; holds that efficiency outranks price for AC buyers outside Papua'], 'detikX, 1 Jul 2024'],
    ['Internationale Klimaschutzinitiative (IKI)', ['Penerbit policy brief pasar ESCO ASEAN (Mar 2026)', 'Publisher of the ASEAN ESCO market policy brief (Mar 2026)'], 'IKI, Mar 2026'],
    ['TUV NORD Indonesia', ['Penerbit whitepaper audit energi dan sistem manajemen energi', 'Publisher of the energy audit and management system whitepaper'], 'TUV NORD'],
    ['DQS Indonesia', ['Penerbit ringkasan Permen ESDM 8/2025', 'Publisher of the Energy Ministry Reg. 8/2025 summary'], 'DQS Indonesia'],
    ['Green Building Council Indonesia', ['Penyelenggara sertifikasi Greenship; 60 bangunan bersertifikat hingga 2022', 'Operator of Greenship certification; 60 certified buildings by 2022'], 'Kompas, 8 Mar 2023'],
    ['Pemerintah Kota Surabaya', ['Mitra studi dasar energi 295 bangunan (SETI)', 'Partner of the baseline energy study of 295 buildings (SETI)'], 'Laporan ASEAN ESCO'],
    ['Energy Conservation Center Japan (ECCJ)', ['Pelaksana Top Runner Jepang; pembanding luar negeri', 'Implementer of Japan\'s Top Runner; foreign comparison'], 'ECCJ'],
    ['Badan Energi Internasional (IEA)', ['Penerbit deskripsi Top Runner dan definisi TOE', 'Publisher of the Top Runner description and the TOE definition'], 'IEA'],
  ], 'efisiensi', 40);
  d.bab['9'].sumber.push('iea_tr', 'iea_conv', 'esco', 'dqs', 'tuv', 'kompas60', 'detikx', 'mongabay');

  proyek(d, { nama: 'nama', wilayah: 'wilayah', ukuran: 'rinci', status: 'status' }, [
    wb('wb_P003920', ['Ditutup 1995 (disetujui 1989)', 'Closed 1995 (approved 1989)']),
    wb('wb_P121003', ['Dibatalkan (status Bank Dunia: Dropped)', 'Dropped (World Bank status)']),
    wb('wb_P178788', ['Dalam pipeline; fasilitas pembiayaan jaringan dan energi terbarukan', 'In the pipeline; grid and renewable energy financing facility']),
  ]);
  d.bab['10'].sumber.push('wbp');

  regulasi(d, {
    'permen-esdm-3-2025': ['Konservasi energi oleh pemerintah dan pemerintah daerah.', 'Energy conservation by central and regional government.'],
    'permen-esdm-1-2026': ['Usaha jasa konservasi energi (ESCO).', 'The energy conservation services (ESCO) business.'],
    'perda-b345755-5-2026': ['Peraturan daerah efisiensi energi dan air pada bangunan gedung (ditetapkan 5 Feb 2026).', 'Regional regulation on energy and water efficiency in buildings (enacted 5 Feb 2026).'],
    'pp-70-2009': ['Peraturan konservasi energi lama; dicabut oleh PP 33/2023.', 'The former energy conservation regulation; revoked by Gov. Reg. 33/2023.'],
    'permen-esdm-14-2016': ['Penyelenggaraan usaha jasa konservasi energi; dicabut.', 'Conduct of the energy conservation services business; revoked.'],
    'permen-esdm-9-2018': ['Pencabutan sejumlah Permen ESDM sektor efisiensi dan energi baru.', 'Revocation of several Energy Ministry regulations in efficiency and new energy.'],
  });
  pakaiSumber(d, '12', 'pp70', 'pm3', 'pm1', 'pda5', 'pm14', 'pm9');

  tambah(d, '13', 'butir', [
    linReg('permen-esdm-14-2016', 'Permen ESDM 14/2016 tentang usaha jasa konservasi energi', 'Energy Ministry Reg. 14/2016 on the energy conservation services business'),
    linReg('pp-70-2009', 'PP 70/2009 tentang konservasi energi', 'Gov. Reg. 70/2009 on energy conservation'),
    linReg('permen-esdm-9-2018', 'Permen ESDM 9/2018 mencabut sejumlah aturan', 'Energy Ministry Reg. 9/2018 revokes several rules'),
    linReg('permen-esdm-3-2025', 'Permen ESDM 3/2025 konservasi energi instansi pemerintah', 'Energy Ministry Reg. 3/2025 on energy conservation in government bodies'),
    linReg('permen-esdm-1-2026', 'Permen ESDM 1/2026 usaha jasa konservasi energi', 'Energy Ministry Reg. 1/2026 on the energy conservation services business'),
    linReg('perda-b345755-5-2026', 'Perda 5/2026 efisiensi energi dan air pada bangunan gedung', 'Regional Regulation 5/2026 on energy and water efficiency in buildings'),
  ].map(([tg, a, b, url]) => ({ tanggal: tg, judul: T(a, b), ...(url ? { url } : {}) })).concat([
    { tanggal: '2022-12-31', judul: T('Batas tahun jumlah bangunan bersertifikat Greenship: 60 bangunan (22 platinum, 35 gold, 3 silver)', 'Cut-off year for certified Greenship buildings: 60 (22 platinum, 35 gold, 3 silver)') },
    { tanggal: '2023-11-20', judul: T('ESDM melaporkan hemat Rp3,76 triliun tagihan listrik berkat kebijakan efisiensi AC', 'The Energy Ministry reports IDR 3.76 trillion of electricity bills saved through AC efficiency policy') },
  ]));
  d.bab['13'].butir.sort((a, b) => a.tanggal.localeCompare(b.tanggal));
  pakaiSumber(d, '13', 'pm3', 'pm1', 'pda5', 'pp70', 'pm14', 'pm9', 'ac', 'kompas60');

  tambah(d, '14', 'paragraf', [
    T('Kewajiban instansi pemerintah: Permen ESDM 3/2025 mengatur konservasi energi oleh pemerintah dan pemerintah daerah (judul regulasi); mulai dari penetapan penanggung jawab hingga pelaporan dibaca pada naskahnya.', 'Duty of government bodies: Energy Ministry Reg. 3/2025 governs energy conservation by central and regional government (regulation title); from naming a responsible officer to reporting, read the text.'),
    T('Kewajiban bangunan gedung: Perda 5/2026 menetapkan efisiensi energi dan air pada bangunan gedung di wilayah penetapnya (judul regulasi di repo).', 'Duty for buildings: Regional Regulation 5/2026 sets energy and water efficiency in buildings in its jurisdiction (regulation title in the repo).'),
    T('Kewajiban penyedia jasa: usaha jasa konservasi energi tunduk pada Permen ESDM 1/2026 (judul regulasi).', 'Duty of service providers: the energy conservation services business is subject to Energy Ministry Reg. 1/2026 (regulation title).'),
    T('Insentif: skema hibah dan pinjaman lunak yang tercatat di direktori pendanaan (GEF, KfW, GCF, JICA) ada di bab Pembiayaan; insentif fiskal umum seperti bea masuk mesin dan tax holiday juga tercatat di sana.', 'Incentives: grant and soft-loan schemes in the funding directory (GEF, KfW, GCF, JICA) are in the Financing chapter; general fiscal incentives such as machinery duty exemption and tax holiday are also listed there.'),
    T('Insentif nonfiskal: label dan sertifikasi (SKEM, LTHE, Greenship) sebagai sinyal pasar; Greenship bersifat sukarela.', 'Non-fiscal incentive: labels and certification (MEPS, energy label, Greenship) as market signals; Greenship is voluntary.'),
  ]);
  pakaiSumber(d, '14', 'pm3', 'pm1', 'pda5', 'direktori');

  pasang(d, '15', langkah(['ed', 'pp33', 'pm1', 'detikx'], [
    ['1. Hitung konsumsi tahunan', '1. Measure annual consumption', 'Bandingkan konsumsi tahunan dengan ambang TOE sektor Anda (500 bangunan, 4.000 industri dan transportasi, 6.000 penyedia energi).', 'Compare annual consumption with your sector\'s TOE threshold (500 buildings, 4,000 industry and transport, 6,000 energy providers).', 'Pengguna energi', 'Energy user'],
    ['2. Tunjuk manajer energi', '2. Appoint an energy manager', 'Manajer energi harus bersertifikat.', 'The energy manager must be certified.', 'Pengguna energi', 'Energy user'],
    ['3. Susun program konservasi', '3. Draw up a conservation programme', 'Program memuat sasaran dan tindakan.', 'The programme sets targets and actions.', 'Manajer energi', 'Energy manager'],
    ['4. Audit energi', '4. Energy audit', 'Dilakukan auditor energi bersertifikat; audit awal lalu rinci.', 'Done by a certified energy auditor; preliminary then detailed.', 'Auditor', 'Auditor'],
    ['5. Jalankan rekomendasi', '5. Implement recommendations', 'Prioritaskan yang payback pendek; libatkan ESCO bila modal terbatas.', 'Prioritise short-payback measures; involve an ESCO when capital is limited.', 'Pengguna energi, ESCO', 'Energy user, ESCO'],
    ['6. Lapor', '6. Report', 'Laporan pelaksanaan manajemen energi disampaikan ke pemerintah; 410 entitas melapor untuk 2023.', 'The energy management implementation report goes to government; 410 entities reported for 2023.', 'Pengguna energi', 'Energy user'],
    ['7. Jalur produk: uji dan daftar', '7. Product path: test and register', 'Produsen menguji produk di laboratorium uji (tujuh laboratorium untuk AC) lalu mendaftarkan nilai SKEM.', 'Makers test products in a laboratory (seven for ACs) then register the MEPS value.', 'Produsen, laboratorium', 'Manufacturers, laboratories'],
    ['8. Jalur produk: label dan edar', '8. Product path: label and sell', 'Memasang stiker LTHE pada produk wajib (tujuh produk pada 2024) dan memajangnya di toko.', 'Affix the energy label sticker on mandatory products (seven in 2024) and display it in shops.', 'Produsen, ritel', 'Manufacturers, retailers'],
  ]));
  d.bab['15'].catatan = T('Lama dan biaya tiap langkah tidak ditemukan di sumber yang dibaca; sengaja tidak diisi.', 'The duration and cost of each step were not found in the sources read; deliberately left blank.');

  tambah(d, '17', 'paragraf', [
    T('Pompa kalor (heat pump) memberi COP di atas satu untuk pemanasan dan pendinginan; di iklim tropis dipakai untuk air panas dan pengering industri (ringkasan editorial METI, tanpa angka).', 'Heat pumps deliver a COP above one for heating and cooling; in tropical climates they serve hot water and industrial drying (METI editorial summary, no figures).'),
    T('AC inverter dan sistem VRF mengatur kecepatan kompresor sesuai beban sehingga lebih hemat daripada AC on-off; ini menjadi dasar SKEM AC memakai CSPF.', 'Inverter air conditioners and VRF systems adjust compressor speed to load, saving more than on-off units; this is why the AC MEPS uses CSPF.'),
    T('LED, motor kelas IE3 ke atas, dan pengatur kecepatan (VSD) pada pompa dan kipas adalah peralatan efisiensi dengan payback terpendek di industri dan gedung.', 'LEDs, motors of IE3 class or higher and variable speed drives on pumps and fans are the shortest-payback efficiency equipment in industry and buildings.'),
    T('Penyimpanan termal berbasis bahan perubah fase (PCM) menggeser beban pendingin dari jam puncak; Universitas Diponegoro mengembangkan cold storage PCM bersama PT Dewa Salju Nusantara (purwarupa 2025).', 'Thermal storage with phase-change material (PCM) shifts cooling load from peak hours; Diponegoro University is developing PCM cold storage with PT Dewa Salju Nusantara (prototype 2025).'),
    T('Kogenerasi dan pemanfaatan panas sisa: IPB University memperkenalkan konsep CHPP yang mengubah panas sisa industri menjadi listrik dan biochar (2026).', 'Cogeneration and waste-heat use: IPB University introduced the CHPP concept turning industrial waste heat into electricity and biochar (2026).'),
    T('Pemantauan beban digital (meter pintar, IoT, sistem manajemen bangunan) menjadi dasar M&V dan manajemen energi berbasis data. Tingkat kematangan (TRL) dan biaya tidak dikutip karena tidak ada sumber tunggal yang dibaca.', 'Digital load monitoring (smart meters, IoT, building management systems) underpins M&V and data-driven energy management. TRL and cost are not quoted as no single source was read.'),
  ]);
  pakaiSumber(d, '17', 'ed');

  const ivs = baca('public/data/inovasi.json').inovasi;
  const inov = ['in_cold_storage_pcm_undip', 'in_chpp_ipb'].map((id) => { const x = ivs.find((q) => q.id === cekId('inov', id)); return { judul: x.nama, id, url: x.sumber?.[0]?.url, penulis: (x.pembuat || []).map((p) => p.nama).join(', '), jurnal: `${x.status || 'konsep'} (${x.tahun || '-'})`, sitasi: 0 }; });
  const riset = risetTabel('efisiensi', /energy|efficien|cooling|building|thermal|heat|lighting|motor|air condition|HVAC/i, 8, ['Dua baris pertama adalah inovasi tercatat di direktori METI (kampus); sisanya karya ilmiah dari irisan OpenAlex di repo.', 'The first two rows are innovations listed in the METI directory (campuses); the rest are scholarly works from the OpenAlex slice in the repo.']);
  riset.baris.unshift(...inov); pasang(d, '18', riset);

  d.bab['20'].kolom.splice(1, 0, kol('iso2', 'ISO2', 'ISO2'));
  const iso = { Indonesia: 'ID', Jepang: 'JP', Singapura: 'SG', Tiongkok: 'CN', ASEAN: '-' };
  d.bab['20'].baris.forEach((r) => { r.iso2 = iso[r.negara] || '-'; });
  const ref = (n, i2, ins) => ({ negara: n, iso2: i2, instrumen: ins, nilai: T('Nama program; angka tidak dikutip', 'Programme name; figures not quoted'), catatan: T('Ringkasan editorial METI; periksa sumber resmi negara tersebut sebelum mengutip angka.', 'METI editorial summary; check that country\'s official source before quoting figures.') });
  d.bab['20'].baris.push(
    ref('India', 'IN', 'Bureau of Energy Efficiency: label bintang dan skema Perform, Achieve and Trade'),
    ref('Uni Eropa', 'EU', 'Ecodesign dan label energi'), ref('Australia', 'AU', 'Greenhouse and Energy Minimum Standards (GEMS)'),
    ref('Amerika Serikat', 'US', 'ENERGY STAR dan standar efisiensi Departemen Energi'), ref('Korea Selatan', 'KR', 'Standar kinerja energi minimum dan label efisiensi'),
    ref('Brasil', 'BR', 'Program Procel dan label PBE'), ref('Thailand', 'TH', 'Label efisiensi nomor 5 EGAT'),
  );
  d.bab['20'].per = 12; pakaiSumber(d, '20', 'ed');

  const oldB24 = d.bab['24'].paragraf.map((p) => p.id).join(' ');
  pasang(d, '24', skema([
    ['sk_gef', ['Hibah Global Environment Facility; sektor efisiensi tercatat.', 'Global Environment Facility grant; the efficiency sector is listed.']],
    ['sk_kfw', ['Kerja sama keuangan Jerman; efisiensi tercatat.', 'German financial cooperation; efficiency is listed.']],
    ['sk_gcf', ['Dana iklim multilateral; efisiensi tercatat di sektornya.', 'Multilateral climate fund; efficiency is listed in its sectors.']],
    ['sk_jica', ['Pinjaman ODA Jepang; berpotensi untuk efisiensi industri dan jaringan.', 'Japanese ODA loans; potential for industrial efficiency and grids.']],
    ['sk_efek_hijau', ['Obligasi dan sukuk hijau korporasi untuk kegiatan usaha berwawasan lingkungan, termasuk efisiensi.', 'Corporate green bonds and sukuk for environmentally sound activities, including efficiency.']],
    ['sk_sdg_one', ['Platform pembiayaan campuran SMI untuk proyek hijau.', 'SMI blended-finance platform for green projects.']],
    ['sk_ins_bea_masuk_mesin', ['Pembebasan bea masuk mesin dan bahan investasi (insentif fiskal umum).', 'Duty exemption on machinery and investment materials (general fiscal incentive).']],
    ['sk_ins_tax_holiday', ['Pengurangan PPh badan bagi pelaku usaha pionir (insentif fiskal umum).', 'Corporate income tax reduction for pioneer businesses (general fiscal incentive).']],
  ], ['Hambatan: ESCO kesulitan pembiayaan berbasis proyek dan pembatasan kontrak kinerja sektor publik menghambat pasar (IKI, Mar 2026; ADB 2016). Permen ESDM 8/2025 disebut memuat ketentuan pembiayaan (DQS); nilai hibah efisiensi tidak ditemukan.', 'Barriers: ESCOs struggle with project-based financing and limits on public-sector performance contracts hold back the market (IKI, Mar 2026; ADB 2016). Energy Ministry Reg. 8/2025 is said to contain financing provisions (DQS); no efficiency grant value was found.']));
  pakaiSumber(d, '24', 'esco', 'dqs');

  pasang(d, '26', { tipe: 'tabel', per: 8, sumber: ['wbp', 'direktori'], kolom: [kol('pos', 'Proyek', 'Project', { url: 'url' }), kol('nilai', 'Komitmen', 'Commitment', { num: true, d: 0 }), kol('sat', 'Satuan', 'Unit'), kol('sumber', 'Dasar', 'Basis')],
    baris: [{ pos: T('Power Sector Efficiency Project (1989 sampai 1995)', 'Power Sector Efficiency Project (1989 to 1995)'), nilai: pj('wb_P003920').nilai_investasi[0].nilai / 1e6, sat: T('USD juta', 'USD million'), sumber: 'Bank Dunia, via direktori METI', id: 'wb_P003920', url: '/p/wb_P003920' }, { pos: T('ID - Chiller Energy Efficiency Project (dibatalkan)', 'ID - Chiller Energy Efficiency Project (dropped)'), nilai: 0, sat: T('USD juta', 'USD million'), sumber: 'Bank Dunia, via direktori METI', id: 'wb_P121003', url: '/p/wb_P121003' }],
    catatan: T('Hanya dua baris investasi efisiensi yang tercatat di direktori METI. Nilai transaksi ESCO, merger, atau IPO terkait efisiensi tidak ditemukan di sumber yang dibaca.', 'Only two efficiency investment rows are recorded in the METI directory. No ESCO transaction, merger or IPO value linked to efficiency was found in the sources read.') });

  tambah(d, '27', 'paragraf', [T('Manfaat lingkungan: tiap kWh hemat menghindarkan emisi pembangkitan sebesar faktor emisi listrik (680 gCO2 per kWh pada 2024 menurut Ember lewat OWID, EST). Efek rebound dapat mengurangi manfaat ini; pemantauan hasil nyata penting.', 'Environmental benefit: every kWh saved avoids generation emissions equal to the grid emission factor (680 gCO2 per kWh in 2024 per Ember via OWID, EST). The rebound effect can reduce this; monitoring real results matters.'), T('Manfaat sosial: tagihan rumah tangga turun; ESDM mengklaim hemat Rp3,76 triliun tagihan listrik dari kebijakan AC pada 2021 sampai semester I 2023. Risiko: produk murah tak berlabel tetap beredar sehingga konsumen berpenghasilan rendah tertinggal.', 'Social benefit: household bills fall; the Energy Ministry claims IDR 3.76 trillion of bills saved from the AC policy over 2021 to the first half of 2023. Risk: cheap unlabelled products still circulate, leaving low-income consumers behind.')]);
  pakaiSumber(d, '27', 'owid', 'ac', 'mongabay');
  tambah(d, '28', 'paragraf', [T('Pekerjaan: auditor energi, manajer energi, teknisi HVAC dan kontrol, pemasang insulasi, dan staf ESCO. Manajer energi dan auditor wajib bersertifikat (PP 33/2023); lembaga sertifikasi profesi per bidang belum dirinci di sumber yang dibaca.', 'Jobs: energy auditors, energy managers, HVAC and controls technicians, insulation installers and ESCO staff. Energy managers and auditors must be certified (Gov. Reg. 33/2023); professional certification bodies per field are not detailed in the sources read.')]);
  pakaiSumber(d, '28', 'pp33');
  tambah(d, '29', 'paragraf', [
    T('Kontroversi 3, dumping dan harga. Satu pihak: AC murah impor diduga dijual di bawah harga wajar sehingga produsen lokal tertekan (judul Kontan); GAPEL memperkirakan biaya produksi lokal sekitar 20 persen lebih tinggi daripada impor (detikX). Pihak lain: konsumen mendapat produk murah, sedangkan SKEM yang lebih ketat dapat menaikkan harga. Dugaan dumping belum terbukti di sumber yang dibaca.', 'Controversy 3, dumping and price. One side: cheap imported ACs are alleged to be sold below fair price, pressing local makers (Kontan headline); GAPEL estimates local production cost is about 20 percent above imports (detikX). Other side: consumers get cheap products while a stricter MEPS can raise prices. Dumping is not proven in the sources read.'),
    T('Kontroversi 4, wajib atau sukarela. Pendukung kewajiban: manajemen energi yang tidak ditegakkan tidak menghasilkan hemat; pejabat ESDM pada 15 Mei 2024 menyatakan belum ada sanksi. Penolak: beban biaya pada industri kecil dan risiko formalitas tanpa hasil. Hipotesis METI: kewajiban perlu disertai bantuan audit dan akses pembiayaan.', 'Controversy 4, mandatory or voluntary. For mandates: energy management that is not enforced yields no saving; an Energy Ministry official said on 15 May 2024 there were no sanctions yet. Against: cost burden on small industry and the risk of box-ticking. METI hypothesis: mandates need audit assistance and financing access.'),
  ]);
  pakaiSumber(d, '29', 'dumping', 'detikx', 'metro331');
  d.bab['30'].baris.push({ item: T('Proyeksi 2045: tidak ada angka resmi khusus efisiensi di sumber yang dibaca', 'Projection 2045: no efficiency-specific official figure in the sources read'), nilai: '-', tahun: '2045' });
  tambah(d, '31', 'paragraf', [T(...hp('pengembang dan pemasok: efisiensi memperkecil kebutuhan pembangkit baru sehingga pengembang perlu memadukan tawaran pembangkit dengan paket efisiensi bagi pelanggan industri.', 'developers and suppliers: efficiency shrinks the need for new generation, so developers should pair generation offers with efficiency packages for industrial customers.')), T(...hp('investor dan pemberi pinjaman: pembiayaan berbasis penghematan butuh protokol M&V yang kredibel; lembaga seperti IFC dan skema hijau dapat menjadi mitra.', 'investors and lenders: savings-based financing needs credible M&V protocols; bodies such as IFC and green schemes can be partners.')), T(...hp('pemda dan akademisi: Perda 5/2026 dan Permen ESDM 3/2025 membuka pasar audit gedung pemerintah; kampus dapat menyediakan auditor dan studi dasar.', 'local governments and academics: Regional Regulation 5/2026 and Energy Ministry Reg. 3/2025 open a market for government building audits; campuses can supply auditors and baseline studies.'))]);
  tambah(d, '32', 'paragraf', [
    T('Angka entitas pelapor dan hemat energi untuk 2024 dan 2025.', 'Reporting entities and energy saved for 2024 and 2025.'), T('Jumlah ESCO terdaftar setelah Permen ESDM 1/2026.', 'Number of registered ESCOs after Energy Ministry Reg. 1/2026.'), T('Penegakan sanksi manajemen energi (sumber saling bertentangan pada 2024).', 'Enforcement of energy management sanctions (sources conflicted in 2024).'),
    T('Penerapan Perda 5/2026 dan peraturan serupa di kota lain.', 'Implementation of Regional Regulation 5/2026 and similar rules in other cities.'), T('Revisi SKEM AC berikutnya dan ketersediaan laboratorium uji (tujuh pada 2024).', 'The next AC MEPS revision and test laboratory availability (seven in 2024).'),
    T('Ada tidaknya dukungan hibah GEF, KfW, atau GCF untuk proyek efisiensi baru.', 'Whether GEF, KfW or GCF grants appear for new efficiency projects.'), T('Perkembangan dugaan dumping AC dan tanggapan pemerintah.', 'Developments in the alleged AC dumping and the government response.'),
  ]);
  const pus = baca('public/data/pustaka.json').baris;
  for (const pid of ['pk-reg-pp-33-2023', 'pk-reg-pp-70-2009', 'pk-reg-permen-esdm-14-2016', 'pk-reg-keppres-43-1991', 'pk-reg-inpres-9-1982']) { const p = pus.find((x) => x.id === cekId('pus', pid)); d.bab['36'].baris.push({ judul: p.judul, id: pid, url: '/pustaka?id=' + encodeURIComponent(pid), penerbit: p.penerbit || '-', mengapa: T('Dokumen peraturan di Pustaka METI', 'Regulation document in the METI Library') }); }
  d.bab['36'].sumber.push('direktori');
  void oldB24;
  return pangkas(d);
}
