// Pendalaman naskah Penyimpanan energi (8 Nov 2026). Dipanggil dari susun() di topik_penyimpanan.mjs.
import { T, S, G, FQ, P, sm, ke, TGL, baca, tambahSumber, pemainTabel, liniReg, regTabel, petaProv } from './topik_dalam_lib.mjs';

const SUMBER_BARU = {
  iea_bat: S('IEA, Batteries and Secure Energy Transitions (2024): nilai pasar baterai USD 120 miliar kini menjadi hampir USD 500 miliar pada 2030 dalam skenario NZE; 500 GW surya terancam bila baterai kurang', 'IEA', 'https://www.iea.org/reports/batteries-and-secure-energy-transitions', '2024-04-25', 'resmi', 'CC BY 4.0'),
  bnef115: S('BloombergNEF, harga paket baterai lithium-ion turun ke USD 115 per kWh pada survei 2024 (ringkasan publik)', 'BloombergNEF', 'https://about.bnef.com/blog/lithium-ion-battery-pack-prices-see-largest-drop-since-2017-falling-to-115-per-kilowatt-hour-bloombergnef/', '2024-12-10', 'kajian'),
  iea_grid: S('IEA, Grid-scale storage (tracker teknologi penyimpanan skala jaringan)', 'IEA', 'https://www.iea.org/energy-system/electricity/grid-scale-storage', TGL, 'resmi'),
};

export function perdalam(bab, SUMBER) {
  tambahSumber(SUMBER, SUMBER_BARU);
  const rf = (n, d = 1) => Math.round(n * 10 ** d) / 10 ** d;
  const bess = 3658, psh = 2983, tot = bess + psh;
  // contoh BESS 100 MW / 200 MWh, hipotesis
  const MWH = 200, EFF = 0.88, SIKLUS = 330, DEG = 0.02, CAPEX = 250, CRF = 0.1168, OM = 0.02;
  const keluar = MWH * EFF, keluarTahun = keluar * SIKLUS, sisaTh10 = MWH * (1 - DEG) ** 10;
  const capexTot = MWH * 1000 * CAPEX, lcosEx = (capexTot * CRF + capexTot * OM) / keluarTahun;

  ke(bab, '2', 'faq', 'butir', FQ([
    ['Berapa harga baterai sekarang?', 'How much do batteries cost now?', 'BloombergNEF mencatat harga paket baterai lithium-ion rata-rata dunia USD 115 per kWh pada survei akhir 2024, turun 20 persen dalam setahun. Harga sistem BESS utuh (termasuk inverter dan konstruksi) jauh lebih tinggi dan belum dikumpulkan di basis ini.', 'BloombergNEF recorded a global average lithium-ion pack price of USD 115 per kWh in its late 2024 survey, down 20 percent in a year. The full BESS system price (including inverters and construction) is much higher and not collected in this base.'],
    ['Apa beda LFP dan NMC?', 'What is the difference between LFP and NMC?', 'LFP (lithium besi fosfat) lebih aman dan tahan siklus panjang sehingga umum untuk penyimpanan jaringan; NMC (nikel mangan kobal) lebih padat energi sehingga umum untuk kendaraan. Indonesia memiliki nikel sehingga mendorong NMC untuk hilirisasi.', 'LFP (lithium iron phosphate) is safer and longer lived, so common for grid storage; NMC (nickel manganese cobalt) is more energy dense so common in vehicles. Indonesia has nickel, which pushes NMC for downstream industry.'],
    ['Berapa lama baterai bertahan?', 'How long do batteries last?', 'Sel LFP modern umumnya dirancang ribuan siklus; umur praktis 10 sampai 15 tahun dengan penurunan kapasitas bertahap. Contoh bab 5 memakai degradasi 2 persen per tahun sebagai asumsi hipotesis.', 'Modern LFP cells are typically designed for thousands of cycles; practical life is 10 to 15 years with gradual capacity fade. The chapter 5 example uses 2 percent a year degradation as a hypothetical assumption.'],
    ['Apa itu BESS co-located dengan PLTS?', 'What is a BESS co-located with solar?', 'Baterai dipasang di lokasi PLTS agar surplus siang dapat digeser ke malam dan jaringan stabil; contoh di Indonesia adalah 14,2 MWh di PLTS IKN 50 MW.', 'A battery installed at the solar site shifts midday surplus to night and stabilises the grid; the Indonesian example is 14.2 MWh at the 50 MW IKN solar plant.'],
    ['Apa risiko bila penyimpanan tidak cukup?', 'What is the risk if storage is short?', 'IEA menghitung kasus baterai rendah dapat menunda hampir 500 GW surya yang dibutuhkan untuk melipattigakan terbarukan 2030, memperpanjang pemakaian batubara dan gas.', 'The IEA calculates that a low battery case could delay close to 500 GW of solar needed to triple renewables by 2030, prolonging coal and gas use.'],
    ['Apakah baterai bekas kendaraan bisa dipakai lagi?', 'Can used EV batteries be reused?', 'Bisa untuk penyimpanan stasioner (second life) setelah kapasitas turun sekitar 70 sampai 80 persen, tetapi uji kondisi dan standar keselamatan wajib; daur ulang diatur baku mutu emisi Permen LHK 12/2021.', 'Yes, for stationary storage (second life) after capacity falls to about 70 to 80 percent, but condition testing and safety standards are required; recycling is governed by Environment Ministry Reg. 12/2021 emission standards.'],
    ['Siapa pengembang penyimpanan di Indonesia?', 'Who develops storage in Indonesia?', 'PLN (pembeli utama dan pengembang), IBC dan mitra asing untuk rantai sel, pengembang PLTS yang menambah baterai, dan integrator seperti Wartsila, Sungrow, dan Envision; daftar lengkap ber-id di bab 9.', 'PLN (main buyer and developer), IBC and foreign partners for the cell chain, solar developers adding batteries and integrators such as Wartsila, Sungrow and Envision; the full list with ids is in chapter 9.'],
  ]), sm('bnef115', 'iea_bat', 'ikn', 'ed'));

  ke(bab, '3', 'glosarium', 'butir', G([
    ['LFP', 'Lithium besi fosfat, kimia sel aman dan berumur panjang untuk penyimpanan jaringan.', 'Lithium iron phosphate, a safe and long-lived cell chemistry for grid storage.'],
    ['NMC', 'Nikel mangan kobal, kimia sel padat energi.', 'Nickel manganese cobalt, an energy-dense cell chemistry.'],
    ['DoD', 'Depth of discharge, kedalaman pengosongan baterai yang diizinkan.', 'Depth of discharge, the allowed emptying depth of a battery.'],
    ['SoC', 'State of charge, tingkat isi baterai dalam persen.', 'State of charge, battery fill level in percent.'],
    ['SoH', 'State of health, kesehatan baterai terhadap kapasitas awal.', 'State of health, battery condition relative to initial capacity.'],
    ['PCS', 'Power conversion system, inverter dua arah pada BESS.', 'Power conversion system, the bidirectional inverter of a BESS.'],
    ['EMS', 'Energy management system, perangkat lunak pengatur siklus BESS.', 'Energy management system, software that dispatches a BESS.'],
    ['Siklus', 'Satu kali pengisian dan pengosongan penuh.', 'One full charge and discharge.'],
    ['Degradasi', 'Penurunan kapasitas baterai seiring pemakaian dan waktu.', 'Capacity fade of a battery with use and time.'],
    ['LCOS', 'Levelized cost of storage, biaya rata-rata per MWh energi yang dilepas.', 'Levelized cost of storage, average cost per MWh discharged.'],
    ['C-rate', 'Laju pengisian atau pengosongan relatif terhadap kapasitas (1C = penuh dalam satu jam).', 'Charge or discharge rate relative to capacity (1C = full in one hour).'],
    ['Black start', 'Kemampuan memulai kembali jaringan setelah padam total, dapat diberikan BESS.', 'The ability to restart a grid after a blackout, which a BESS can provide.'],
    ['Peak shaving', 'Mengurangi beban puncak dengan melepas energi tersimpan.', 'Cutting peak load by discharging stored energy.'],
    ['Second life', 'Pemakaian ulang baterai kendaraan untuk penyimpanan stasioner.', 'Reuse of vehicle batteries for stationary storage.'],
    ['Pembangkit pompa', 'Lihat PLTA pompa: air dipompa ke atas saat listrik murah dan dialirkan turun saat dibutuhkan.', 'See pumped hydro: water is pumped uphill when power is cheap and released when needed.'],
  ]), sm('ed'));

  ke(bab, '4', 'teks', 'paragraf', P(
    ['Penyimpanan menggeser waktu: listrik surya dan bayu yang melimpah di satu jam dipindah ke jam lain. Itu sebabnya penyimpanan diukur dua angka sekaligus, daya (MW) dan energi (MWh), dan durasi adalah rasio keduanya.', 'Storage shifts time: abundant solar and wind power in one hour is moved to another. That is why storage is measured by two numbers at once, power (MW) and energy (MWh), and duration is their ratio.'],
    ['Penyimpanan juga memberi layanan jaringan yang tidak terlihat di tagihan: respons frekuensi dalam milidetik, cadangan, dan penundaan investasi jaringan. Nilai ekonomi proyek bergantung pada layanan yang dibayar, bukan hanya arbitrase harga.', 'Storage also gives grid services invisible on bills: millisecond frequency response, reserves and deferral of grid investment. Project value depends on which services are paid for, not only price arbitrage.'],
  ), sm('iea_bat', 'iea_grid', 'ed'));

  ke(bab, '5', 'rumus', 'rumus', P(
    ['Energi tersedia (MWh) = kapasitas nominal (MWh) x DoD x (1 - degradasi tahunan) pangkat umur (tahun)', 'Available energy (MWh) = nominal capacity (MWh) x DoD x (1 - annual degradation) to the power of age (years)'],
    ['LCOS (USD per MWh) = (CAPEX x faktor anuitas + biaya O&M tahunan) / energi dilepas per tahun + biaya pengisian / efisiensi', 'LCOS (USD per MWh) = (CAPEX x annuity factor + annual O&M) / energy discharged per year + charging cost / efficiency'],
    ['Faktor anuitas = r x (1 + r) pangkat n / ((1 + r) pangkat n - 1), dengan r suku bunga dan n umur proyek', 'Annuity factor = r x (1 + r)^n / ((1 + r)^n - 1), with r the discount rate and n project life'],
  ), sm('ed'));
  ke(bab, '5', 'rumus', 'contoh', [
    T(`BESS contoh 100 MW / ${MWH} MWh (durasi 2 jam), efisiensi ${EFF * 100} persen: tiap siklus melepas ${rf(keluar, 0)} MWh. Pada ${SIKLUS} siklus per tahun energi dilepas ${rf(keluarTahun / 1000, 1)} GWh (EST, semua asumsi hipotesis).`, `Example BESS 100 MW / ${MWH} MWh (2 hour duration), ${EFF * 100} percent efficiency: each cycle discharges ${rf(keluar, 0)} MWh. At ${SIKLUS} cycles a year the energy discharged is ${rf(keluarTahun / 1000, 1)} GWh (EST, all assumptions hypothetical).`),
    T(`Dengan degradasi ${DEG * 100} persen per tahun, kapasitas ${MWH} MWh turun menjadi sekitar ${rf(sisaTh10, 0)} MWh pada tahun ke-10 (EST).`, `With ${DEG * 100} percent annual degradation the ${MWH} MWh capacity falls to about ${rf(sisaTh10, 0)} MWh in year 10 (EST).`),
    T(`LCOS contoh tanpa biaya pengisian: CAPEX hipotesis USD ${CAPEX} per kWh = USD ${rf(capexTot / 1e6, 0)} juta, faktor anuitas ${CRF} (8 persen, 15 tahun), O&M ${OM * 100} persen CAPEX per tahun menghasilkan sekitar USD ${rf(lcosEx, 0)} per MWh dilepas (EST; angka CAPEX hanya ilustrasi, bukan harga pasar).`, `Example LCOS without charging cost: hypothetical CAPEX USD ${CAPEX} per kWh = USD ${rf(capexTot / 1e6, 0)} million, annuity factor ${CRF} (8 percent, 15 years), O&M ${OM * 100} percent of CAPEX a year gives about USD ${rf(lcosEx, 0)} per MWh discharged (EST; the CAPEX figure is illustrative, not a market price).`),
  ], sm('ed'));

  ke(bab, '6', 'langkah', 'butir', [
    { judul: T('Pemasok sel dan integrasi sistem', 'Cell supply and system integration'), isi: T('Sel dari pabrik (CATL, HLI Green Power) dirakit menjadi kontainer BESS oleh integrator seperti Wartsila, Sungrow, dan Envision.', 'Cells from plants (CATL, HLI Green Power) are assembled into BESS containers by integrators such as Wartsila, Sungrow and Envision.'), pelaku: T('CATL, HLI Green Power, Wartsila, Sungrow, Envision', 'CATL, HLI Green Power, Wartsila, Sungrow, Envision') },
    { judul: T('Pembeli dan pembayar layanan', 'Buyers and service payers'), isi: T('PLN membeli layanan penyimpanan menurut RUPTL; pengembang PLTS membeli untuk firming.', 'PLN buys storage services per the RUPTL; solar developers buy for firming.'), pelaku: T('PLN, pengembang PLTS', 'PLN, solar developers') },
  ], sm('ed', 'ruptl'));

  petaProv(bab);
  bab['9'] = pemainTabel('penyimpanan', [
    ['^PLN$', 'Pembeli utama dan pengembang BESS', 'Main BESS buyer and developer'],
    ['PLN Indonesia Power', 'Pengembang pembangkit dan BESS', 'Generator and BESS developer'],
    ['Indonesia Battery Corporation', 'Konsorsium BUMN rantai baterai', 'State consortium for the battery chain'],
    ['MIND ID', 'Induk BUMN pertambangan', 'State mining holding'], ['Indonesia Asahan Aluminium', 'Anggota konsorsium baterai', 'Battery consortium member'],
    ['PT Pertamina \\(Persero\\)', 'Anggota konsorsium baterai', 'Battery consortium member'],
    ['Hyundai Motor Group', 'Mitra pabrik sel (HLI Green Power)', 'Cell plant partner (HLI Green Power)'], ['Contemporary Amperex', 'Mitra proyek Dragon', 'Dragon project partner'],
    ['Wartsila', 'Integrator BESS', 'BESS integrator'], ['Sungrow', 'Pemasok inverter dan BESS', 'Inverter and BESS supplier'], ['Envision', 'Pemasok sistem energi', 'Energy system supplier'],
    ['Kementerian Investasi dan Hilirisasi', 'Fasilitator investasi dan hilirisasi', 'Investment and downstream facilitator'], ['Kementerian Energi dan Sumber Daya', 'Regulator', 'Regulator'], ['Badan Pengelola Investasi Daya', 'Investor negara', 'Sovereign investor'], ['Vale Indonesia', 'Pemasok nikel', 'Nickel supplier'],
  ], sm('ed', 'proyek'));

  ke(bab, '11', 'teks', 'paragraf', P(
    [`Struktur pesanan PLN: BESS ${bess} MW (${rf(bess / tot * 100, 0)} persen) dan PLTA pompa ${psh} MW (${rf(psh / tot * 100, 0)} persen) dari ${tot} MW penyimpanan bernama dalam RUPTL 2025-2034 (EST, hitung dari faq).`, `PLN order structure: BESS ${bess} MW (${rf(bess / tot * 100, 0)} percent) and pumped hydro ${psh} MW (${rf(psh / tot * 100, 0)} percent) of ${tot} MW named storage in the 2025-2034 RUPTL (EST, from the FAQ).`],
    ['Pasar global: nilai paket baterai kendaraan dan penyimpanan sekitar USD 120 miliar saat ini dan hampir USD 500 miliar pada 2030 dalam skenario NZE (IEA). Harga paket USD 115 per kWh pada akhir 2024 (BloombergNEF).', 'Global market: battery pack value for vehicles and storage is about USD 120 billion today and nearly USD 500 billion in 2030 in the NZE scenario (IEA). Pack price was USD 115 per kWh in late 2024 (BloombergNEF).'],
    ['Pasokan sel domestik: HLI Green Power Karawang 10 GWh per tahun dan tahap I proyek Dragon 6,9 GWh; jumlah 16,9 GWh pasokan terencana, jauh melampaui kebutuhan BESS domestik sehingga pasar ekspor dan kendaraan menjadi penentu.', 'Domestic cell supply: HLI Green Power Karawang 10 GWh a year and Dragon stage I 6.9 GWh; a planned 16.9 GWh total, far above domestic BESS need, so export and vehicle markets decide viability.'],
    ['Investasi: proyek Dragon CATL dinilai USD 5,9 miliar (pemberitaan); keluarnya LG Energy Solution dari paket sekitar USD 8,45 miliar menunjukkan risiko mitra asing.', 'Investment: the CATL Dragon project is valued at USD 5.9 billion (reporting); the exit of LG Energy Solution from a package of about USD 8.45 billion shows partner risk.'],
  ), sm('ruptl', 'iea_bat', 'bnef115', 'dragon2', 'lgpet', 'hliauto'));

  ke(bab, '12', 'tabel', 'baris', regTabel([
    ['permen-klhk-12-2021', 'Baku mutu emisi daur ulang baterai lithium', 'Emission standards for lithium battery recycling'],
    ['permen-kemenperin-6-2022', 'Spesifikasi, peta jalan, dan penghitungan TKDN kendaraan listrik berbasis baterai', 'Specifications, roadmap and local content calculation for battery EVs'],
    ['permen-b160462-100-2020', 'Impor baterai lithium tidak baru sebagai bahan baku industri (dicabut)', 'Import of non-new lithium batteries as industrial raw material (revoked)'],
    ['perpres-79-2023', 'Perubahan Perpres 55/2019 tentang percepatan KBL berbasis baterai', 'Amendment of Perpres 55/2019 on battery EV acceleration'],
  ]), sm('regul'));
  ke(bab, '13', 'linimasa', 'butir', liniReg([
    ['perpres-55-2019', 'Perpres 55/2019: percepatan program KBL berbasis baterai dan dasar industri baterai', 'Perpres 55/2019: battery EV acceleration and the basis of a battery industry'],
    ['permen-klhk-12-2021', 'Permen LHK 12/2021: baku mutu emisi daur ulang baterai lithium', 'Environment Reg. 12/2021: emission standards for lithium battery recycling'],
    ['perpres-79-2023', 'Perpres 79/2023 memperbarui program KBL berbasis baterai', 'Perpres 79/2023 updates the battery EV programme'],
  ]).concat([
    { tanggal: '2024-12-10', judul: T('BloombergNEF: harga paket baterai dunia USD 115 per kWh', 'BloombergNEF: global battery pack price USD 115 per kWh'), url: SUMBER.bnef115.url },
    { tanggal: '2024-04-25', judul: T('IEA menerbitkan Batteries and Secure Energy Transitions', 'IEA publishes Batteries and Secure Energy Transitions'), url: SUMBER.iea_bat.url },
    { tanggal: '2025-01-20', judul: T('PLTS IKN 50 MW beroperasi dengan BESS 14,2 MWh', 'IKN 50 MW solar plant operates with 14.2 MWh BESS'), url: SUMBER.ikn.url },
  ]), sm('regul'));

  ke(bab, '14', 'teks', 'paragraf', P(
    ['Kewajiban: TKDN untuk kendaraan listrik berbasis baterai (Permen Perindustrian 6/2022) dan baku mutu emisi daur ulang (Permen LHK 12/2021). Untuk BESS jaringan belum ada standar keselamatan kebakaran nasional yang ditemukan di basis ini; kasus Moss Landing dan Victorian Big Battery menjadi pelajaran.', 'Obligations: local content rules for battery EVs (Industry Reg. 6/2022) and recycling emission standards (Environment Reg. 12/2021). No national fire safety standard for grid BESS was found in this base; the Moss Landing and Victorian Big Battery cases are lessons.'],
    ['Insentif: pembelian PLN lewat RUPTL; kendaraan listrik memperoleh insentif PPN (Permen Keuangan 38/2023, 8/2024, 12/2025) yang menciptakan pasar hilir sel. Insentif fiskal khusus penyimpanan stasioner belum ditemukan.', 'Incentives: PLN procurement through the RUPTL; EVs receive VAT incentives (Finance Reg. 38/2023, 8/2024, 12/2025) that create a downstream cell market. No fiscal incentive specific to stationary storage was found.'],
  ), sm('regul', 'ruptl'));

  ke(bab, '15', 'langkah', 'butir', [
    { judul: T('Sertifikasi keselamatan sel dan sistem', 'Cell and system safety certification'), isi: T('Minta uji UL 9540A atau setara dan sertifikat IEC 62619; pemasok perlu memberi laporan uji propagasi.', 'Request UL 9540A or equivalent tests and IEC 62619 certificates; suppliers should provide propagation test reports.'), pelaku: T('Pengembang, pemasok', 'Developer, supplier') },
    { judul: T('Rencana tanggap darurat dengan pemadam kebakaran setempat', 'Emergency response plan with local fire services'), isi: T('Selaraskan jarak aman dan sistem pemadam sebelum SLO.', 'Align safe distances and suppression systems before the SLO.'), pelaku: T('Pengembang, pemda', 'Developer, local government') },
    { judul: T('Rencana akhir masa pakai dan daur ulang', 'End-of-life and recycling plan'), isi: T('Kontrakkan pengambilan kembali baterai; patuhi Permen LHK 12/2021.', 'Contract battery take-back; comply with Environment Reg. 12/2021.'), pelaku: T('Pengembang, pendaur ulang', 'Developer, recycler') },
  ], sm('ed', 'regul'));
  bab['15'].catatan = T('Alur umum; lama dan biaya per langkah belum bersumber sehingga tidak dicantumkan. Standar UL dan IEC disebut sebagai praktik industri, bukan kewajiban hukum Indonesia yang terverifikasi di basis ini.', 'General flow; duration and cost per step are not sourced so not stated. UL and IEC standards are cited as industry practice, not verified Indonesian legal obligations in this base.');

  ke(bab, '17', 'teks', 'paragraf', P(
    ['1. Baterai natrium-ion: tanpa lithium, lebih murah dan tahan suhu rendah; tahap awal komersial, kepadatan energi lebih rendah daripada LFP.', '1. Sodium-ion batteries: lithium-free, cheaper and cold tolerant; early commercial stage with lower energy density than LFP.'],
    ['2. Baterai aliran (flow battery, vanadium): durasi panjang 4 sampai 12 jam, umur panjang, biaya awal tinggi.', '2. Flow batteries (vanadium): long duration of 4 to 12 hours and long life, high upfront cost.'],
    ['3. Sel LFP berkapasitas besar (di atas 500 Ah) menurunkan biaya per kWh dan jumlah sambungan sehingga mengurangi titik gagal.', '3. Large-format LFP cells (above 500 Ah) cut cost per kWh and the number of connections, reducing failure points.'],
    ['4. Penyimpanan udara terkompresi dan termal: durasi panjang tanpa mineral kritis; masih demonstrasi.', '4. Compressed air and thermal storage: long duration without critical minerals; still demonstration stage.'],
    ['5. PLTA pompa air laut: kajian PLN 1 GW (Puger); menghindari kebutuhan waduk atas.', '5. Seawater pumped hydro: the PLN 1 GW study (Puger); avoids the need for an upper reservoir.'],
    ['6. Grid-forming inverter: BESS yang membentuk tegangan jaringan sehingga cocok untuk sistem lemah dan pulau.', '6. Grid-forming inverters: a BESS that forms grid voltage, suitable for weak and island systems.'],
    ['7. Sistem pemadam khusus dan deteksi gas dini: tanggapan atas kasus Moss Landing dan ESS Korea.', '7. Dedicated suppression and early gas detection: a response to the Moss Landing and Korean ESS cases.'],
    ['8. Daur ulang hidrometalurgi: memulihkan nikel, kobal, dan lithium dari sel bekas; peluang rantai nilai di Indonesia (baku mutu Permen LHK 12/2021).', '8. Hydrometallurgical recycling: recovering nickel, cobalt and lithium from used cells; a value chain opportunity in Indonesia (standards in Environment Reg. 12/2021).'],
  ), sm('seawater', 'iea_grid', 'ed', 'mlnews', 'korea'));

  ke(bab, '29', 'teks', 'paragraf', P(
    ['Pertambangan nikel: pendukung hilirisasi menyebut nilai tambah; pengkritik menyorot deforestasi, limbah tailing, dan emisi smelter berbasis batubara. Kepentingan lingkungan dan industri belum terselesaikan dalam kebijakan.', 'Nickel mining: downstream supporters cite added value; critics point to deforestation, tailings and coal-powered smelter emissions. Environmental and industrial interests are not yet reconciled in policy.'],
  ), sm('dragon', 'lgpet'));
  ke(bab, '31', 'teks', 'paragraf', P(
    ['Per peran: pengembang PLTS menambah BESS pada tender; integrator dan kontraktor siap melayani 3.658 MW BESS RUPTL; investor menilai risiko pasar tunggal (PLN); akademisi memverifikasi daur ulang dan baku mutu; pemda menyiapkan lahan dan rencana darurat.', 'By role: solar developers add BESS to tenders; integrators and contractors can serve the 3,658 MW RUPTL BESS; investors assess single-buyer (PLN) risk; academics verify recycling and standards; local governments prepare land and emergency plans.'],
  ), sm('ed', 'ruptl'));
  ke(bab, '32', 'teks', 'paragraf', P(
    ['Daftar pantau: (1) COD Upper Cisokan 2030; (2) status BESS RUPTL yang pertama beroperasi; (3) kemajuan proyek Dragon dan pengganti LG; (4) harga paket baterai BloombergNEF berikutnya; (5) standar keselamatan BESS nasional; (6) penyelidikan Moss Landing; (7) kajian PLTA pompa air laut Puger; (8) peta jalan hilirisasi baterai; (9) kebijakan daur ulang; (10) RUU EBET.', 'Watch list: (1) Upper Cisokan COD 2030; (2) the first RUPTL BESS reaching operation; (3) progress of Dragon and the LG replacement; (4) the next BloombergNEF pack price; (5) a national BESS safety standard; (6) the Moss Landing investigation; (7) the Puger seawater pumped hydro study; (8) the battery downstream roadmap; (9) recycling policy; (10) the RUU EBET.'],
  ), sm('lgpet', 'dragon2', 'bnef115', 'ruuebet'));
}
