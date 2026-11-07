// Pendalaman naskah Kendaraan listrik dan SPKLU (8 Nov 2026). Dipanggil dari susun() di topik_kendaraan_listrik.mjs.
import { T, S, G, FQ, P, sm, ke, TGL, baca, tambahSumber, pemainTabel, liniReg, regTabel, petaProv, kasus } from './topik_dalam_lib.mjs';

const SUMBER_BARU = {
  gevo25: S('IEA, Global EV Outlook 2025, ringkasan eksekutif (penjualan mobil listrik dunia di atas 17 juta pada 2024, pangsa di atas 20 persen; Tiongkok 11 juta; Asia Tenggara naik hampir 50 persen dengan pangsa 9 persen; 2025 di atas 20 juta; 2030 pangsa di atas 40 persen, Asia Tenggara satu dari empat)', 'IEA', 'https://www.iea.org/reports/global-ev-outlook-2025/executive-summary', '2025-05-14', 'resmi', 'CC BY 4.0'),
  gaikindo: S('Gaikindo, data penjualan kendaraan bermotor Indonesia (beranda asosiasi; angka rinci via pemberitaan di sumber lain)', 'Gaikindo', 'https://www.gaikindo.or.id/', TGL, 'resmi'),
  bnef_pack: S('BloombergNEF, harga paket baterai lithium-ion turun ke USD 115 per kWh pada survei 2024 (ringkasan publik)', 'BloombergNEF', 'https://about.bnef.com/blog/lithium-ion-battery-pack-prices-see-largest-drop-since-2017-falling-to-115-per-kilowatt-hour-bloombergnef/', '2024-12-10', 'kajian'),
  iea_bat2: S('IEA, Batteries and Secure Energy Transitions (2024): permintaan mineral kritis untuk baterai naik enam kali pada 2030 dalam skenario NZE', 'IEA', 'https://www.iea.org/reports/batteries-and-secure-energy-transitions', '2024-04-25', 'resmi', 'CC BY 4.0'),
};

const ISO = { Norwegia: 'NO', Tiongkok: 'CN', Thailand: 'TH', Indonesia: 'ID', Australia: 'AU', Jepang: 'JP', Singapura: 'SG', Brasil: 'BR', India: 'IN', 'Uni Eropa': 'EU', 'Amerika Serikat': 'US', Vietnam: 'VN', 'Viet Nam': 'VN' };

export function perdalam(bab, SUMBER) {
  tambahSumber(SUMBER, SUMBER_BARU);
  const rf = (n, d = 1) => Math.round(n * 10 ** d) / 10 ** d;
  const TARIF = 1445, KWH100 = 15, BENSIN = 10000, KMPL = 12;
  const evKm = KWH100 / 100 * TARIF, icKm = BENSIN / KMPL, hemat15k = (icKm - evKm) * 15000;
  const BAT = 60, SOC = 0.7;
  const jamAC = BAT * SOC / (7 * 0.9), jamDC = BAT * SOC / (100 * 0.9);

  ke(bab, '2', 'faq', 'butir', FQ([
    ['Berapa penjualan mobil listrik dunia?', 'How many electric cars are sold worldwide?', 'Di atas 17 juta pada 2024 dengan pangsa lebih dari 20 persen; lebih dari 11 juta di Tiongkok. IEA memperkirakan di atas 20 juta pada 2025 atau lebih dari seperempat penjualan (IEA Global EV Outlook 2025).', 'Over 17 million in 2024 with a share above 20 percent, over 11 million in China. The IEA expects over 20 million in 2025 or more than a quarter of sales (IEA Global EV Outlook 2025).'],
    ['Bagaimana posisi Asia Tenggara?', 'Where does Southeast Asia stand?', 'Penjualan naik hampir 50 persen pada 2024 dengan pangsa 9 persen kawasan, lebih tinggi di Thailand dan Vietnam; pada 2030 satu dari empat mobil terjual diperkirakan listrik dan hampir satu dari tiga roda dua/tiga (IEA).', 'Sales rose nearly 50 percent in 2024 with a 9 percent regional share, higher in Thailand and Viet Nam; by 2030 one in four cars sold is expected electric and almost one in three two/three-wheelers (IEA).'],
    ['Berapa biaya energi per km, mobil listrik dibanding bensin?', 'What is the energy cost per km, EV versus petrol?', `Dengan asumsi hipotesis 15 kWh per 100 km dan tarif Rp${TARIF} per kWh biaya listrik sekitar Rp${rf(evKm, 0)} per km; mobil bensin 12 km per liter pada Rp10.000 per liter sekitar Rp${rf(icKm, 0)} per km (EST). Hemat sekitar Rp${rf(hemat15k / 1e6, 1)} juta per 15.000 km.`, `With hypothetical 15 kWh per 100 km and a tariff of IDR ${TARIF} per kWh the electricity cost is about IDR ${rf(evKm, 0)} per km; a petrol car at 12 km per litre and IDR 10,000 per litre is about IDR ${rf(icKm, 0)} per km (EST). Savings are about IDR ${rf(hemat15k / 1e6, 1)} million per 15,000 km.`],
    ['Berapa lama mengisi mobil listrik?', 'How long does charging take?', `Contoh baterai 60 kWh dari 10 ke 80 persen: sekitar ${rf(jamAC, 1)} jam pada pengisi AC 7 kW dan sekitar ${rf(jamDC * 60, 0)} menit pada pengisi DC 100 kW tanpa memperhitungkan penurunan daya (EST).`, `For a 60 kWh battery from 10 to 80 percent: about ${rf(jamAC, 1)} hours on a 7 kW AC charger and about ${rf(jamDC * 60, 0)} minutes on a 100 kW DC charger ignoring taper (EST).`],
    ['Apa beda BEV, PHEV, dan HEV?', 'What is the difference between BEV, PHEV and HEV?', 'BEV sepenuhnya listrik; PHEV hibrida yang bisa dicolok dan menempuh puluhan km dengan listrik; HEV hibrida konvensional tanpa colokan. Insentif PPN DTP berlaku untuk BEV roda empat; PPnBM DTP untuk hibrida tertentu.', 'BEV is fully electric; PHEV is a plug-in hybrid driving tens of km on electricity; HEV is a conventional hybrid without a plug. The VAT-borne incentive applies to four-wheel BEV; luxury-tax-borne to certain hybrids.'],
    ['Apakah baterai mobil listrik bisa didaur ulang?', 'Can EV batteries be recycled?', 'Bisa, dengan pemulihan nikel, kobal, dan lithium; Indonesia memiliki baku mutu emisi daur ulang baterai lithium (Permen LHK 12/2021). IEA mencatat daur ulang dan efisiensi desain dapat mengurangi kebutuhan mineral kritis sekitar 25 persen pada 2030.', 'Yes, recovering nickel, cobalt and lithium; Indonesia has emission standards for lithium battery recycling (Environment Reg. 12/2021). The IEA notes recycling and design efficiency can cut critical mineral demand by about 25 percent by 2030.'],
    ['Apa itu konversi motor listrik?', 'What is electric motorcycle conversion?', 'Mengganti mesin bakar sepeda motor bekas dengan penggerak listrik; diatur Permen Perhubungan 65/2020 (dicabut) lalu Permen 39/2023, dengan bantuan pemerintah menurut Permen ESDM 3/2023 dan 13/2023.', 'Replacing a used motorcycle combustion engine with an electric drive; governed by Transport Reg. 65/2020 (revoked) then 39/2023, with government aid under Energy Ministry Reg. 3/2023 and 13/2023.'],
  ]), sm('gevo25', 'iea', 'pmk', 'ed', 'iea_bat2'));

  ke(bab, '3', 'glosarium', 'butir', G([
    ['ICE', 'Internal combustion engine, mesin bakar dalam konvensional.', 'Internal combustion engine, the conventional engine.'],
    ['EREV / REEV', 'Kendaraan listrik berjangkauan diperpanjang: motor listrik menggerakkan roda dan mesin bensin mengisi baterai.', 'Range-extended EV: an electric motor drives the wheels and a petrol engine charges the battery.'],
    ['CCS / NACS / CHAdeMO', 'Standar konektor pengisian cepat; Indonesia umumnya memakai CCS2 untuk mobil.', 'Fast charging connector standards; Indonesia generally uses CCS2 for cars.'],
    ['Pengisian V2G', 'Vehicle to grid, kendaraan mengembalikan listrik ke jaringan.', 'Vehicle to grid, the vehicle returns power to the grid.'],
    ['Kapasitas baterai (kWh)', 'Energi tersimpan; menentukan jangkauan bersama konsumsi.', 'Stored energy; with consumption it sets range.'],
    ['Jangkauan (WLTP)', 'Jarak tempuh siklus uji standar internasional.', 'Range on the international standard test cycle.'],
    ['TCO', 'Total cost of ownership, biaya kepemilikan total selama pemakaian.', 'Total cost of ownership over the use period.'],
    ['Battery swap', 'Penukaran baterai habis dengan yang terisi; dipakai motor listrik.', 'Swapping an empty battery for a full one; used by e-motorcycles.'],
    ['Ultra fast charging', 'Pengisian di atas 150 kW untuk waktu isi puluhan menit.', 'Charging above 150 kW for tens of minutes.'],
    ['TKDN baterai', 'Tingkat komponen dalam negeri pada baterai, bagian dari syarat insentif.', 'Local content level on batteries, part of the incentive requirement.'],
    ['Home charging', 'Pengisian di rumah, umumnya AC 2,2 sampai 7 kW.', 'Home charging, generally AC 2.2 to 7 kW.'],
    ['Charge point operator (CPO)', 'Pengelola jaringan pengisian.', 'The operator of a charging network.'],
    ['Roaming pengisian', 'Pembayaran lintas operator dengan satu aplikasi.', 'Cross-operator payment with a single app.'],
    ['Pajak kendaraan (PKB, BBNKB)', 'Pajak daerah; sebagian provinsi membebaskan untuk kendaraan listrik.', 'Regional taxes; some provinces exempt electric vehicles.'],
    ['Inpres 7/2022', 'Instruksi Presiden penggunaan kendaraan listrik berbasis baterai untuk kendaraan dinas.', 'Presidential Instruction on using battery EVs as official vehicles.'],
  ]), sm('ed'));

  ke(bab, '4', 'teks', 'paragraf', P(
    ['Kendaraan listrik memindahkan energi transportasi dari minyak ke listrik, dan motor listrik 3 sampai 4 kali lebih efisien daripada mesin bakar. Bagi Indonesia, manfaat ganda: mengurangi impor BBM dan menciptakan permintaan listrik yang menyerap kapasitas terbarukan.', 'Electric vehicles move transport energy from oil to electricity, and electric drivetrains are three to four times more efficient than combustion engines. For Indonesia the benefits are double: less fuel import and new electricity demand that absorbs renewable capacity.'],
    ['Industri kendaraan listrik juga merupakan strategi industri: cadangan nikel diubah menjadi baterai dan kendaraan. Itu menjelaskan mengapa insentif dikaitkan dengan TKDN dan kewajiban produksi lokal, bukan hanya penjualan.', 'The EV industry is also an industrial strategy: nickel reserves are turned into batteries and vehicles. This explains why incentives are tied to local content and local production obligations, not just sales.'],
  ), sm('ed', 'gevo25'));

  ke(bab, '5', 'rumus', 'rumus', P(
    ['Waktu pengisian (jam) = kapasitas baterai (kWh) x (SoC akhir - SoC awal) / (daya pengisi (kW) x efisiensi)', 'Charging time (h) = battery capacity (kWh) x (final SoC - initial SoC) / (charger power (kW) x efficiency)'],
    ['Titik impas (km) = selisih harga beli / (biaya per km mobil bensin - biaya per km mobil listrik)', 'Break-even (km) = purchase price gap / (petrol car cost per km - EV cost per km)'],
    ['Jangkauan (km) = kapasitas bersih baterai (kWh) / konsumsi (kWh per km)', 'Range (km) = usable battery capacity (kWh) / consumption (kWh per km)'],
  ), sm('ed'));
  ke(bab, '5', 'rumus', 'contoh', [
    T(`Biaya energi per km: mobil listrik 15 kWh per 100 km pada tarif Rp${TARIF} sekitar Rp${rf(evKm, 0)}; mobil bensin 12 km per liter pada Rp10.000 sekitar Rp${rf(icKm, 0)} (EST, semua hipotesis).`, `Energy cost per km: an EV at 15 kWh per 100 km at IDR ${TARIF} is about IDR ${rf(evKm, 0)}; a petrol car at 12 km per litre and IDR 10,000 is about IDR ${rf(icKm, 0)} (EST, all hypothetical).`),
    T(`Titik impas bila mobil listrik lebih mahal Rp100 juta: Rp100.000.000 / (${rf(icKm, 0)} - ${rf(evKm, 0)}) sekitar ${rf(1e8 / (icKm - evKm) / 1000, 0)} ribu km, atau ${rf(1e8 / (icKm - evKm) / 15000, 1)} tahun pada 15.000 km per tahun (EST); inilah alasan insentif harga masih berperan.`, `Break-even if the EV costs IDR 100 million more: IDR 100,000,000 / (${rf(icKm, 0)} - ${rf(evKm, 0)}) is about ${rf(1e8 / (icKm - evKm) / 1000, 0)} thousand km, or ${rf(1e8 / (icKm - evKm) / 15000, 1)} years at 15,000 km a year (EST); this is why price incentives still matter.`),
    T(`Pengisian baterai 60 kWh dari 10 ke 80 persen: ${rf(jamAC, 1)} jam pada AC 7 kW, ${rf(jamDC * 60, 0)} menit pada DC 100 kW (EST, tanpa penurunan daya pengisian).`, `Charging a 60 kWh battery from 10 to 80 percent: ${rf(jamAC, 1)} hours on 7 kW AC, ${rf(jamDC * 60, 0)} minutes on 100 kW DC (EST, ignoring charge taper).`),
  ], sm('ed'));

  ke(bab, '6', 'langkah', 'butir', [
    { judul: T('Kebijakan, insentif, dan sertifikasi', 'Policy, incentives and certification'), isi: T('Kemenperin menetapkan TKDN; Kemenkeu memberi PPN DTP; Kemenhub menguji tipe; ESDM mengatur infrastruktur pengisian.', 'The Industry Ministry sets local content; Finance gives VAT-borne incentives; Transport type-tests; Energy regulates charging infrastructure.'), pelaku: T('Kemenperin, Kemenkeu, Kemenhub, ESDM', 'Industry, Finance, Transport and Energy ministries') },
    { judul: T('Layanan purnajual dan pembiayaan', 'Aftersales and financing'), isi: T('Dealer, bengkel bersertifikat, dan pembiayaan leasing; sertifikasi teknisi LSP untuk perawatan tegangan tinggi.', 'Dealers, certified workshops and leasing finance; LSP technician certification for high voltage maintenance.'), pelaku: T('Gaikindo, dealer, lembaga pembiayaan', 'Gaikindo, dealers, financiers') },
  ], sm('ed', 'regul'));

  petaProv(bab);
  bab['9'] = pemainTabel('kendaraan-listrik', [
    ['^PLN$', 'Operator SPKLU terbesar', 'Largest charger operator'], ['PLN Icon Plus', 'Layanan pengisian dan digital PLN', 'PLN charging and digital services'],
    ['Indonesia Battery Corporation', 'Konsorsium BUMN baterai', 'State battery consortium'], ['Hyundai Motor Group', 'Produsen BEV dan mitra sel (Kona Electric)', 'BEV maker and cell partner (Kona Electric)'],
    ['Contemporary Amperex', 'Pemasok sel baterai', 'Battery cell supplier'], ['Indika Energy', 'Induk grup kendaraan listrik dan energi', 'Parent of an EV and energy group'],
    ['Kementerian Energi dan Sumber Daya', 'Regulator infrastruktur pengisian', 'Charging infrastructure regulator'], ['Kementerian Keuangan', 'Pemberi insentif PPN dan PPnBM', 'VAT and luxury tax incentive issuer'], ['Kementerian Investasi dan Hilirisasi', 'Fasilitator investasi', 'Investment facilitator'],
    ['Badan Pengelola Investasi Daya', 'Investor negara', 'Sovereign investor'], ['PT Pertamina \\(Persero\\)', 'Mitra konsorsium baterai dan SPKLU', 'Battery consortium and charger partner'],
  ], sm('ed', 'proyek'));

  ke(bab, '11', 'teks', 'paragraf', P(
    ['Skala dunia (IEA): 17 juta+ mobil listrik terjual pada 2024; Tiongkok 11 juta+ atau hampir separuh penjualan mobil negara itu; Eropa pangsa sekitar 20 persen; Amerika Serikat tumbuh sekitar 10 persen dengan pangsa di atas 10 persen; pasar berkembang non-Tiongkok naik di atas 60 persen menjadi hampir 600.000.', 'World scale (IEA): 17 million+ electric cars sold in 2024; China 11 million+ or nearly half of that country\'s car sales; Europe around 20 percent share; the United States grew about 10 percent with a share above 10 percent; non-China emerging markets rose over 60 percent to almost 600,000.'],
    ['Posisi Indonesia: 43.000 unit grosir pada 2024 berbanding 17 juta dunia sekitar 0,25 persen (EST); pertumbuhan 2023 ke 2024 sekitar 153 persen (17.000 ke 43.000, EST).', 'Indonesia\'s position: 43,000 wholesale units in 2024 against 17 million worldwide, about 0.25 percent (EST); 2023 to 2024 growth of about 153 percent (17,000 to 43,000, EST).'],
    ['Motor listrik: bantuan Rp7 juta per unit; serapan 2023 hanya 11.532 dari kuota 200.000 unit atau 5,8 persen, dan 2024 sebesar 30.083 unit (60,1 persen target). Kuota 2023 menunjukkan syarat penyaluran yang rumit.', 'Electric motorcycles: aid of IDR 7 million per unit; 2023 uptake only 11,532 of a 200,000 quota or 5.8 percent, and 2024 was 30,083 units (60.1 percent of target). The 2023 quota shows complex distribution conditions.'],
    ['Infrastruktur: 3.772 SPKLU mobil, 9.956 SPKLU motor, 2.240 swap station, dan 33.086 home charging integrasi PLN (Maret 2025); Jawa memegang 2.667 dari 3.772 SPKLU mobil atau 71 persen (EST), Papua 27 dan Maluku 25.', 'Infrastructure: 3,772 car chargers, 9,956 motorcycle chargers, 2,240 swap stations and 33,086 PLN-integrated home chargers (March 2025); Java holds 2,667 of 3,772 car chargers or 71 percent (EST), Papua 27 and Maluku 25.'],
    ['Insentif impor CBU berakhir 31 Desember 2025; enam perusahaan wajib produksi lokal 1:1 pada 2026-2027 dengan kapasitas rencana gabungan 305.000 unit.', 'The CBU import incentive ended on 31 December 2025; six companies must produce locally 1:1 in 2026-2027 with combined planned capacity of 305,000 units.'],
  ), sm('gevo25', 'kontanev', 'motor23', 'motor24', 'mesin', 'cbu', 'oto'));

  ke(bab, '12', 'tabel', 'baris', regTabel([
    ['perpres-55-2019', 'Percepatan program KBL berbasis baterai untuk transportasi jalan', 'Acceleration of the battery EV programme for road transport'],
    ['perpres-79-2023', 'Perubahan atas Perpres 55/2019', 'Amendment of Perpres 55/2019'],
    ['inpres-7-2022', 'Penggunaan KBL berbasis baterai sebagai kendaraan dinas', 'Battery EVs as official vehicles'],
    ['permen-esdm-13-2020', 'Penyediaan infrastruktur pengisian listrik (awal)', 'Charging infrastructure supply (original)'],
    ['permen-esdm-1-2023', 'Penyediaan infrastruktur pengisian listrik untuk KBL berbasis baterai', 'Charging infrastructure supply for battery EVs'],
    ['permen-kemenperin-6-2022', 'Spesifikasi, peta jalan, dan penghitungan TKDN KBL', 'Specifications, roadmap and local content calculation for EVs'],
    ['permen-kemenkeu-38-2023', 'PPN atas penyerahan KBL roda empat (2023)', 'VAT on four-wheel EV supply (2023)'],
    ['permen-kemenkeu-8-2024', 'PPN atas penyerahan KBL roda empat (2024)', 'VAT on four-wheel EV supply (2024)'],
    ['permen-kemenkeu-12-2025', 'PPN ditanggung pemerintah atas KBL roda empat tertentu (2025)', 'Government-borne VAT on certain four-wheel EVs (2025)'],
    ['permen-b283703-39-2023', 'Konversi sepeda motor menjadi sepeda motor listrik', 'Motorcycle conversion to electric'],
    ['permen-esdm-13-2023', 'Pedoman bantuan konversi motor listrik (perubahan)', 'Electric motorcycle conversion aid guidelines (amendment)'],
    ['permen-b169220-87-2020', 'Pengujian tipe fisik KBL berbasis baterai', 'Physical type testing of battery EVs'],
  ]), sm('regul'));

  const lini = bab['13'];
  lini.butir = lini.butir.filter((x) => !/Perpres 55\/2019/.test(x.judul.id));
  ke(bab, '13', 'linimasa', 'butir', liniReg([
    ['perpres-55-2019', 'Perpres 55/2019: percepatan program KBL berbasis baterai', 'Perpres 55/2019: battery EV acceleration'],
    ['permen-esdm-13-2020', 'Permen ESDM 13/2020: infrastruktur pengisian', 'Energy Ministry Reg. 13/2020: charging infrastructure'],
    ['permen-klhk-12-2021', 'Permen LHK 12/2021: emisi daur ulang baterai lithium', 'Environment Reg. 12/2021: lithium battery recycling emissions'],
    ['permen-kemenperin-6-2022', 'Permen Perindustrian 6/2022: TKDN KBL', 'Industry Reg. 6/2022: EV local content'],
    ['inpres-7-2022', 'Inpres 7/2022: kendaraan dinas listrik', 'Presidential Instruction 7/2022: electric official vehicles'],
    ['permen-esdm-1-2023', 'Permen ESDM 1/2023: infrastruktur pengisian (pembaruan)', 'Energy Ministry Reg. 1/2023: charging infrastructure (update)'],
    ['permen-kemenkeu-38-2023', 'Permen Keuangan 38/2023: PPN KBL roda empat', 'Finance Reg. 38/2023: four-wheel EV VAT'],
    ['perpres-79-2023', 'Perpres 79/2023 memperbarui program KBL', 'Perpres 79/2023 updates the EV programme'],
    ['permen-kemenkeu-8-2024', 'Permen Keuangan 8/2024: PPN KBL roda empat', 'Finance Reg. 8/2024: four-wheel EV VAT'],
  ]).concat([
    { tanggal: '2025-05-14', judul: T('IEA menerbitkan Global EV Outlook 2025', 'IEA publishes Global EV Outlook 2025'), url: SUMBER.gevo25.url },
  ]), sm('regul', 'gevo25'));

  ke(bab, '14', 'teks', 'paragraf', P(
    ['Kewajiban penerima insentif: TKDN minimal 40 persen untuk PPN DTP 10 persen; produksi lokal 1:1 untuk penerima insentif CBU. Standar: uji tipe fisik KBL (Permen Perhubungan 87/2020) dan infrastruktur pengisian menurut Permen ESDM 1/2023.', 'Recipient obligations: at least 40 percent local content for the 10 percent VAT-borne incentive; 1:1 local production for CBU incentive recipients. Standards: physical type testing of EVs (Transport Reg. 87/2020) and charging infrastructure under Energy Ministry Reg. 1/2023.'],
  ), sm('pmk', 'cbu', 'regul'));
  ke(bab, '15', 'langkah', 'butir', [
    { judul: T('Pendaftaran tipe dan uji', 'Type registration and testing'), isi: T('Kendaraan baru lulus uji tipe fisik dan memperoleh Sertifikat Registrasi Uji Tipe.', 'New vehicles pass physical type tests and obtain a type test registration certificate.'), pelaku: T('Produsen, Kemenhub', 'Manufacturer, Transport Ministry') },
    { judul: T('Verifikasi TKDN untuk insentif', 'Local content verification for incentives'), isi: T('Kemenperin memverifikasi TKDN; syarat PPN DTP minimal 40 persen.', 'The Industry Ministry verifies local content; VAT incentive requires at least 40 percent.'), pelaku: T('Produsen, Kemenperin', 'Manufacturer, Industry Ministry') },
  ], sm('pmk', 'regul'));
  bab['15'].catatan = T('Alur dasar SPKLU dan kendaraan; lama dan biaya per langkah belum bersumber sehingga tidak dicantumkan.', 'Basic charger and vehicle flow; duration and cost per step are not sourced so not stated.');

  ke(bab, '17', 'teks', 'paragraf', P(
    ['1. Harga baterai: paket rata-rata dunia USD 115 per kWh pada 2024 (BloombergNEF), turun 20 persen dalam setahun; mendorong paritas harga dengan mobil bensin di Tiongkok.', '1. Battery price: global average pack USD 115 per kWh in 2024 (BloombergNEF), down 20 percent in a year; pushing price parity with petrol cars in China.'],
    ['2. LFP dan natrium-ion: LFP menjadi kimia dominan untuk mobil terjangkau; natrium-ion dalam tahap awal untuk kota dan roda dua.', '2. LFP and sodium-ion: LFP is the dominant chemistry for affordable cars; sodium-ion is at an early stage for cities and two-wheelers.'],
    ['3. Pengisian ultra cepat: SPKLU di Tol Jagorawi memakai pengisi ultra cepat; waktu isi puluhan menit.', '3. Ultra fast charging: the Jagorawi toll road charger uses ultra fast charging; fill time in tens of minutes.'],
    ['4. Penukaran baterai: 2.240 swap station di Indonesia, utama untuk motor listrik.', '4. Battery swapping: 2,240 swap stations in Indonesia, mainly for e-motorcycles.'],
    ['5. Kendaraan berat listrik: bus dan truk listrik meningkat; biaya total kepemilikan truk menjadi kompetitif di beberapa pasar (IEA).', '5. Electric heavy vehicles: electric buses and trucks are rising; truck total cost of ownership is competitive in some markets (IEA).'],
    ['6. Produksi sel lokal: HLI Green Power 10 GWh per tahun memungkinkan Kona Electric dirakit dengan sel Indonesia.', '6. Local cell production: HLI Green Power 10 GWh a year lets the Kona Electric be built with Indonesian cells.'],
    ['7. V2G dan pengisian cerdas: kendaraan menyerap surplus surya dan mengembalikan ke jaringan; tahap demonstrasi.', '7. V2G and smart charging: vehicles absorb solar surplus and return it to the grid; demonstration stage.'],
    ['8. Konversi motor: mengubah motor bekas jadi listrik (Permen 39/2023); inovasi kampus di basis Inovasi METI.', '8. Motorcycle conversion: turning used motorcycles electric (Reg. 39/2023); campus innovations in the METI Innovation base.'],
  ), sm('bnef_pack', 'gevo25', 'jagorawi', 'mesin', 'hlitempo', 'regul'));

  /* ---- bab 20: tambah baris pembanding + iso2 ---- */
  const b20 = bab['20'];
  ke(bab, '20', 'tabel', 'baris', [
    { n: T('Uni Eropa', 'European Union'), f: T('Pangsa sekitar 20 persen pada 2024, penjualan stagnan; diperkirakan 25 persen pada 2025', 'Share around 20 percent in 2024, sales stagnant; 25 percent expected in 2025'), h: T('Standar CO2 UE; subsidi menyusut di beberapa negara', 'EU CO2 standards; subsidies waned in some countries') },
    { n: T('Amerika Serikat', 'United States'), f: T('Penjualan naik sekitar 10 persen pada 2024, pangsa di atas 10 persen; 2030 sekitar 20 persen', 'Sales up about 10 percent in 2024, share above 10 percent; about 20 percent by 2030'), h: T('Kredit pajak federal yang berpotensi dicabut', 'Federal tax credits that may be repealed') },
    { n: T('Brasil', 'Brazil'), f: T('125.000 mobil listrik pada 2024 dan pangsa di atas 6 persen; 85 persen impor Tiongkok', '125,000 electric cars in 2024 and share above 6 percent; 85 percent Chinese imports'), h: T('Kebijakan impor dan harga terjangkau', 'Import policy and affordable prices') },
    { n: T('Vietnam', 'Viet Nam'), f: T('Pangsa jauh di atas rata-rata Asia Tenggara 9 persen (IEA)', 'Share well above the Southeast Asian average of 9 percent (IEA)'), h: T('Produsen domestik dan kebijakan pendukung', 'Domestic manufacturer and supportive policy') },
    { n: T('Pasar berkembang non-Tiongkok', 'Emerging markets outside China'), f: T('Hampir 600.000 pada 2024 (naik di atas 60 persen); 1 juta pada 2025', 'Almost 600,000 in 2024 (up over 60 percent); 1 million in 2025'), h: T('Impor Tiongkok menyumbang 75 persen kenaikan', 'Chinese imports account for 75 percent of the rise') },
  ], sm('gevo25'));
  for (const r of b20.baris) { const nama = typeof r.n === 'string' ? r.n : r.n.id; r.iso2 = ISO[nama] || (nama === 'Asia Tenggara' ? null : r.iso2 ?? null); }
  if (!b20.kolom.some((c) => c.k === 'iso2')) b20.kolom.splice(1, 0, { k: 'iso2', l: T('ISO2', 'ISO2') });

  /* ---- kasus gagal tambahan (bab 40) ---- */
  ke(bab, '40', 'kasus', 'butir', [
    kasus({ id: 'eropa2024', nama: 'Eropa: penjualan stagnan 2024 saat subsidi menyusut', jenis: 'mundur', negara: 'EU', lokasi: T('Uni Eropa', 'European Union'),
      profil: [{ label: T('Pangsa 2024', '2024 share'), nilai: 20, satuan: T('persen', 'percent') }, { label: T('Produksi EU 2024', 'EU production 2024'), nilai: 2.4, satuan: T('juta mobil listrik', 'million electric cars') }],
      kronologi: [{ tanggal: '2024-12-31', teks: T('Penjualan stagnan saat skema subsidi dan kebijakan pendukung berkurang; pangsa bertahan sekitar 20 persen.', 'Sales stagnated as subsidy schemes and supportive policies waned; share held around 20 percent.') }],
      sebab: P(['Subsidi menyusut di beberapa negara sementara perbedaan harga dengan mobil konvensional masih besar.', 'Subsidies fell in some countries while the price gap with conventional cars remained large.']),
      terdampak: T('Produsen mobil Eropa dan pembeli yang bergantung subsidi; IEA mencatat target CO2 UE dan Inggris mendorong pemulihan 2025.', 'European carmakers and subsidy-dependent buyers; the IEA notes EU and UK CO2 targets drive a 2025 recovery.'),
      seharusnya: T('Menyelaraskan jadwal pencabutan subsidi dengan penurunan harga dan memberi isyarat jangka panjang.', 'Align subsidy withdrawal with price declines and give long-term signals.'),
      tanda_bahaya: P(['Pertumbuhan penjualan nol ketika subsidi turun.', 'Zero sales growth when subsidies fall.']),
      angka: [{ label: T('Produksi mobil listrik UE 2024', 'EU electric car production 2024'), nilai: 2.4, d: 1, satuan: T('juta unit', 'million units'), sumber: 'gevo25', est: false }],
      faktor: { kepastian_kebijakan: true, pendanaan: true }, sumber: ['gevo25'], hak_jawab: true }),
  ], sm('gevo25'));
  for (const k of bab['40'].butir) if (k.negara === 'EU' && !k.faktor) k.faktor = {};

  ke(bab, '29', 'teks', 'paragraf', P(
    ['Perdagangan dan industri lokal: pendukung insentif CBU menyebut percepatan pasar; kritik menyebut risiko ketergantungan impor, sedangkan kewajiban produksi lokal 1:1 dimaksudkan memindahkan manufaktur. IEA mencatat 85 persen penjualan di Brasil dan Thailand adalah impor Tiongkok pada 2024.', 'Trade and local industry: supporters of the CBU incentive cite faster market growth; critics cite import dependence, while the 1:1 local production obligation aims to move manufacturing onshore. The IEA notes 85 percent of sales in Brazil and Thailand were Chinese imports in 2024.'],
  ), sm('gevo25', 'cbu'));
  ke(bab, '31', 'teks', 'paragraf', P(
    ['Per peran: operator SPKLU menyasar koridor tol dan tujuan; produsen komponen memenuhi TKDN 40 sampai 60 persen; pembiayaan leasing mengembangkan produk nilai sisa baterai; pemda menyediakan lahan dan kendaraan dinas listrik (Inpres 7/2022); akademisi menguji baterai second life dan konversi motor.', 'By role: charger operators target toll corridors and destinations; component makers meet 40 to 60 percent local content; leasing finance develops battery residual value products; local governments provide land and electric official vehicles (Inpres 7/2022); academics test second-life batteries and motorcycle conversion.'],
  ), sm('ed', 'pmk', 'cbu'));
  ke(bab, '32', 'teks', 'paragraf', P(
    ['Daftar pantau: (1) status insentif PPN 2026; (2) pelaksanaan kewajiban 1:1 mulai 1 Januari 2026; (3) penjualan EV 2025 dan 2026 menurut Gaikindo; (4) harga paket baterai BloombergNEF akhir 2025; (5) serapan bantuan motor listrik; (6) proyek Dragon dan pengganti LG; (7) ketersediaan SPKLU pada arus mudik; (8) tarif pengisian PLN; (9) Global EV Outlook 2026; (10) daur ulang baterai.', 'Watch list: (1) the 2026 VAT incentive status; (2) implementation of the 1:1 obligation from 1 January 2026; (3) 2025 and 2026 EV sales per Gaikindo; (4) the late 2025 BloombergNEF pack price; (5) e-motorcycle aid uptake; (6) Dragon and the LG replacement; (7) charger availability in holiday peaks; (8) PLN charging tariffs; (9) the Global EV Outlook 2026; (10) battery recycling.'],
  ), sm('gaikindo', 'bnef_pack', 'lgjp', 'cbu'));
  return { 2: [[2022, 10000], [2023, 17000], [2024, 43000]] };
}
