// Pendalaman naskah Sampah jadi energi (8 Nov 2026). Dipanggil dari susun() di topik_sampah_energi.mjs.
import { T, S, G, FQ, P, sm, ke, TGL, baca, tambahSumber, pemainTabel, liniReg, regTabel, petaProv } from './topik_dalam_lib.mjs';

const SUMBER_BARU = {
  eu_wfd: S('Uni Eropa, Waste Framework Directive 2008/98/EC (hirarki pengelolaan sampah: cegah, guna ulang, daur ulang, pulih energi, buang)', 'Uni Eropa', 'https://eur-lex.europa.eu/eli/dir/2008/98/oj', '2008-11-19', 'resmi'),
  uu18: S('UU 18/2008 tentang Pengelolaan Sampah (dasar hukum pengelolaan sampah nasional)', 'BPK JDIH', 'https://peraturan.bpk.go.id/', '2008-05-07', 'resmi'),
  iea_wte: S('IEA Bioenergy Task 36, Integrating Energy Recovery into Solid Waste Management (kisaran umum efisiensi dan teknologi WtE)', 'IEA Bioenergy', 'https://www.ieabioenergy.com/', TGL, 'resmi'),
};

export function perdalam(bab, SUMBER) {
  tambahSumber(SUMBER, SUMBER_BARU);
  const rf = (n, d = 1) => Math.round(n * 10 ** d) / 10 ** d;
  // EST: PSEL contoh 1.000 ton per hari, 9 MW (Benowo) dan skenario netto 20 MW
  const kwhPerTonBenowo = 9 * 24 * 1000 / 1000;
  const MWH_TON = 0.5, TPD = 1000, MW_NETTO = TPD * MWH_TON / 24;
  const GWH_THN = MW_NETTO * 8760 * 0.85 / 1000, REV_USD = GWH_THN * 1e6 * 0.20;

  ke(bab, '2', 'faq', 'butir', FQ([
    ['Apa beda PSEL, PLTSa, dan RDF?', 'What is the difference between PSEL, PLTSa and RDF?', 'PSEL adalah istilah Perpres 109/2025 untuk pengolahan sampah menjadi energi terbarukan; PLTSa adalah istilah lama pembangkit listrik tenaga sampah; RDF (refuse-derived fuel) adalah bahan bakar padat dari sampah terpilah yang dipakai di pabrik semen atau PLTU.', 'PSEL is the Perpres 109/2025 term for converting waste into renewable energy; PLTSa is the older term for waste power plants; RDF (refuse-derived fuel) is a solid fuel from sorted waste used in cement kilns or coal plants.'],
    ['Berapa listrik dari satu ton sampah?', 'How much power does a tonne of waste make?', `Fasilitas pembakar massal modern umumnya 400 sampai 600 kWh per ton (kisaran umum, IEA Bioenergy). Benowo 9 MW dari 1.000 ton per hari setara ${rf(kwhPerTonBenowo, 0)} kWh per ton (EST); angkanya lebih rendah karena sampah basah dan teknologi gas TPA.`, `Modern mass-burn plants generally make 400 to 600 kWh per tonne (general range, IEA Bioenergy). Benowo's 9 MW from 1,000 tonnes a day equals ${rf(kwhPerTonBenowo, 0)} kWh per tonne (EST); lower because of wet waste and landfill gas technology.`],
    ['Apakah PSEL menggantikan daur ulang?', 'Does PSEL replace recycling?', 'Tidak menurut hirarki pengelolaan sampah (Waste Framework Directive Uni Eropa dan UU 18/2008): cegah dan daur ulang didahulukan, pulih energi untuk residu. Kritik menyebut pasokan minimum 1.000 ton per hari dapat mengurangi insentif memilah; lihat bab 29.', 'No under the waste hierarchy (EU Waste Framework Directive and Law 18/2008): prevention and recycling come first and energy recovery is for residue. Critics say a 1,000 tonne a day minimum can weaken sorting incentives; see chapter 29.'],
    ['Siapa pengembang PSEL tahap I dan II?', 'Who are the stage I and II PSEL developers?', 'Tahap I: Denpasar Raya, Bekasi, Bogor Raya (mitra operator Zhejiang Weiming), dan Yogyakarta, diumumkan Maret 2026; tahap II: delapan konsorsium ditetapkan 21 Juli 2026. Pelaksana: Danantara (BPI Daya Anagata Nusantara).', 'Stage I: Denpasar Raya, Bekasi, Bogor Raya (operator partner Zhejiang Weiming) and Yogyakarta, announced March 2026; stage II: eight consortia named 21 July 2026. Implementer: Danantara (BPI Daya Anagata Nusantara).'],
    ['Apakah sampah Indonesia cocok untuk dibakar?', 'Is Indonesian waste suitable for burning?', 'Sampah perkotaan Indonesia banyak organik dan basah sehingga nilai kalornya rendah; kasus Timarpur (Delhi) menunjukkan desain gagal bila nilai kalor nyata hanya 600 sampai 700 kcal per kg dibanding desain 1.460. Pemilahan dan pengeringan menentukan.', 'Indonesian municipal waste is largely organic and wet so its calorific value is low; the Timarpur (Delhi) case shows design failure when real value is only 600 to 700 kcal per kg against a design of 1,460. Sorting and drying decide the outcome.'],
    ['Apa yang terjadi pada abu dan emisi?', 'What happens to ash and emissions?', 'Abu dasar dan abu terbang termasuk limbah yang harus dikelola (abu terbang sering B3); fasilitas butuh sistem pengendali gas buang. Singapura mengirim abu ke Pulau Semakau yang diproyeksikan penuh 2035, menandakan insinerasi tidak menghapus kebutuhan lahan.', 'Bottom and fly ash must be managed (fly ash is often hazardous waste); plants need flue gas controls. Singapore ships ash to Semakau Island, projected full by 2035, showing incineration does not remove land needs.'],
    ['Bagaimana PSEL berhubungan dengan kredit karbon?', 'How does PSEL relate to carbon credits?', 'Bila sampah organik dihindarkan dari TPA, metana berkurang. Proyek gas TPA seperti Bantargebang tercatat di basis pendanaan METI sebagai proyek kredit karbon; skema kredit PSEL perlu metodologi khusus.', 'Diverting organic waste from landfill cuts methane. Landfill gas projects such as Bantargebang are listed in the METI funding base as carbon credit projects; a PSEL credit scheme needs a specific methodology.'],
  ]), sm('ed', 'iea_wte', 'eu_wfd', 'uu18', 'timar', 'bogor', 'tahap2', 'sgnea', 'pendanaan'));

  ke(bab, '3', 'glosarium', 'butir', G([
    ['SIPSN', 'Sistem Informasi Pengelolaan Sampah Nasional milik KLH yang memuat timbulan dan komposisi sampah daerah.', 'The national waste management information system of the Environment Ministry with generation and composition data.'],
    ['TPS3R', 'Tempat pengolahan sampah reduce, reuse, recycle di tingkat kawasan.', 'Neighbourhood reduce, reuse, recycle waste facility.'],
    ['TPST', 'Tempat pengolahan sampah terpadu skala kota.', 'City-scale integrated waste processing site.'],
    ['Timbulan sampah', 'Jumlah sampah yang dihasilkan per hari atau per tahun.', 'The amount of waste generated per day or year.'],
    ['Komposisi sampah', 'Porsi organik, plastik, kertas, kaca, dan logam dalam sampah.', 'Shares of organic, plastic, paper, glass and metal in waste.'],
    ['Landfill gas (LFG)', 'Gas metana dari penguraian sampah di TPA yang dapat ditangkap untuk listrik.', 'Methane from decomposing landfill waste that can be captured for power.'],
    ['Sanitary landfill', 'TPA berlapis kedap dengan pengumpulan lindi dan gas.', 'A lined landfill with leachate and gas collection.'],
    ['Lindi', 'Air resapan sampah yang mencemari tanah dan air tanah bila tidak diolah.', 'Waste seepage water that pollutes soil and groundwater if untreated.'],
    ['Pirolisis', 'Penguraian termal tanpa oksigen menghasilkan minyak, gas, dan arang.', 'Thermal decomposition without oxygen giving oil, gas and char.'],
    ['Kompos dan maggot (BSF)', 'Pengolahan organik hayati yang mengurangi beban PSEL dan TPA.', 'Biological organic treatment that reduces PSEL and landfill load.'],
    ['EPR', 'Extended producer responsibility, tanggung jawab produsen atas sampah kemasan.', 'Extended producer responsibility for packaging waste.'],
    ['Co-processing', 'Pemakaian RDF sebagai bahan bakar alternatif di tungku semen.', 'Using RDF as an alternative fuel in cement kilns.'],
    ['Jakstranas', 'Kebijakan dan strategi nasional pengelolaan sampah rumah tangga (Perpres 97/2017).', 'The national household waste management policy and strategy (Presidential Reg. 97/2017).'],
    ['Kompensasi negara', 'Mekanisme Perpres 109/2025 mengganti tipping fee daerah dengan pembayaran pemerintah ke PLN.', 'The Perpres 109/2025 mechanism replacing local tipping fees with government payments to PLN.'],
    ['Zero waste to landfill', 'Sasaran tidak ada sampah yang masuk TPA, biasanya lewat daur ulang dan pulih energi.', 'A target of no waste to landfill, usually via recycling and energy recovery.'],
  ]), sm('ed', 'metro109'));

  ke(bab, '4', 'teks', 'paragraf', P(
    ['Hirarki sampah menempatkan pulih energi di bawah cegah dan daur ulang. PSEL dibenarkan terutama untuk residu yang tidak bisa didaur ulang dan sampah kota besar yang lahan TPA-nya habis; bukan sebagai pengganti pemilahan.', 'The waste hierarchy places energy recovery below prevention and recycling. PSEL is justified mainly for residue that cannot be recycled and for large cities running out of landfill space, not as a substitute for sorting.'],
    ['Keunikan sektor ini: pendapatan utama bukan listrik tetapi jasa pengelolaan sampah. Itu sebabnya skema tipping fee dan kompensasi negara menentukan layak tidaknya proyek lebih daripada teknologi.', 'What is distinctive: the main revenue is waste service, not electricity. That is why tipping fee and state compensation schemes decide viability more than technology.'],
  ), sm('eu_wfd', 'uu18', 'ed'));

  ke(bab, '5', 'rumus', 'rumus', P(
    ['Energi sampah (MWh per hari) = ton per hari x nilai kalor (MJ per kg) x 1000 / 3600; listrik = energi x efisiensi netto (umumnya 20 sampai 27 persen)', 'Waste energy (MWh per day) = tonnes per day x calorific value (MJ per kg) x 1000 / 3600; electricity = energy x net efficiency (generally 20 to 27 percent)'],
    ['Pendapatan listrik (USD per tahun) = MW netto x 8.760 jam x faktor beban x 1000 x harga (USD per kWh)', 'Electricity revenue (USD per year) = net MW x 8,760 hours x load factor x 1000 x price (USD per kWh)'],
    ['Emisi metana TPA terhindar (tCO2e) = fraksi organik x sampah (ton) x potensi metana (kg CH4 per ton) x GWP / 1000', 'Avoided landfill methane (tCO2e) = organic fraction x waste (t) x methane potential (kg CH4 per t) x GWP / 1000'],
    ['Umur TPA (tahun) = volume tersisa (m3) / (timbulan masuk per tahun x kepadatan terkompaksi)', 'Landfill life (years) = remaining volume (m3) / (annual inflow x compacted density)'],
  ), sm('iea_wte', 'ed'));
  ke(bab, '5', 'rumus', 'contoh', [
    T(`Skenario hipotesis 1.000 ton per hari dengan ${MWH_TON} MWh per ton memberi ${rf(MW_NETTO, 1)} MW netto; pada faktor beban 85 persen menghasilkan ${rf(GWH_THN, 0)} GWh per tahun. Pada USD 0,20 per kWh (Perpres 109/2025) pendapatan listrik sekitar USD ${rf(REV_USD / 1e6, 1)} juta per tahun (EST; ${MWH_TON} MWh per ton adalah asumsi hipotesis).`, `Hypothetical 1,000 tonnes a day at ${MWH_TON} MWh per tonne gives ${rf(MW_NETTO, 1)} MW net; at an 85 percent load factor that is ${rf(GWH_THN, 0)} GWh a year. At USD 0.20 per kWh (Perpres 109/2025) power revenue is about USD ${rf(REV_USD / 1e6, 1)} million a year (EST; ${MWH_TON} MWh per tonne is a hypothetical assumption).`),
    T(`Benowo mencatat 9 MW dari 1.000 ton per hari, atau ${rf(kwhPerTonBenowo, 0)} kWh per ton, kurang dari separuh skenario di atas; perbedaan menunjukkan pentingnya teknologi dan kualitas sampah (EST).`, `Benowo records 9 MW from 1,000 tonnes a day, or ${rf(kwhPerTonBenowo, 0)} kWh per tonne, under half the scenario above; the gap shows the importance of technology and waste quality (EST).`),
    T('Sampah 1.000 ton per hari dengan 55 persen organik dan potensi metana hipotesis 50 kg per ton organik: 27,5 ton metana per hari; pada GWP 27 setara sekitar 742 tCO2e per hari bila dibiarkan di TPA tanpa penangkapan (EST, semua faktor hipotesis).', '1,000 tonnes a day with 55 percent organic and a hypothetical methane potential of 50 kg per tonne of organic gives 27.5 tonnes of methane a day; at GWP 27 about 742 tCO2e a day if left in a landfill without capture (EST, all factors hypothetical).'),
  ], sm('metro109', 'kap', 'ed'));

  ke(bab, '6', 'langkah', 'butir', [
    { judul: T('Pengelolaan abu dan emisi', 'Ash and emissions management'), isi: T('Abu dasar dimanfaatkan atau ditimbun; abu terbang sebagai B3 dikelola; gas buang dipantau terus-menerus.', 'Bottom ash is reused or landfilled; fly ash as hazardous waste is managed; flue gas is monitored continuously.'), pelaku: T('Operator, KLH, laboratorium pemantau', 'Operator, Environment Ministry, monitoring laboratories') },
    { judul: T('Pembayaran dan kompensasi', 'Payment and compensation'), isi: T('PLN membeli listrik USD 0,20 per kWh; negara memberi kompensasi ke PLN; pemda menyediakan pasokan minimum.', 'PLN buys power at USD 0.20 per kWh; the state compensates PLN; local governments provide minimum supply.'), pelaku: T('PLN, Kemenkeu, Danantara, pemda', 'PLN, Finance Ministry, Danantara, local governments') },
  ], sm('metro109', 'ashurst'));

  const tr = baca('public/data/kapasitas_tren.json').baris.filter((r) => r.taksonomi === 'biomassa-sampah' && r.tahun >= 2010).sort((a, z) => a.tahun - z.tahun);
  if (bab['7']) bab['7'].catatan = T('Kapasitas listrik sampah terbarukan menurut IRENA kecil (18 MW pada 2025) dan belum memuat PSEL baru Danantara yang masih konstruksi.', 'Renewable waste power capacity per IRENA is small (18 MW in 2025) and excludes the new Danantara PSEL still under construction.');
  petaProv(bab);
  bab['9'] = pemainTabel('sampah-energi', [
    ['Badan Pengelola Investasi Daya', 'Pelaksana program PSEL nasional', 'National PSEL programme implementer'],
    ['Kementerian Energi dan Sumber Daya', 'Regulator listrik dan tarif', 'Power and tariff regulator'],
    ['^PLN$', 'Pembeli listrik PSEL', 'PSEL power buyer'],
    ['PLN Indonesia Power', 'Calon pembeli dan mitra', 'Prospective buyer and partner'],
    ['Veolia', 'Operator internasional', 'International operator'], ['China Everbright', 'Pengembang PSEL internasional', 'International PSEL developer'], ['CITIC Construction', 'Kontraktor EPC', 'EPC contractor'], ['Beijing GeoEnviron', 'Pengembang teknologi', 'Technology developer'],
    ['Denera', 'Pengembang gasifikasi lokal', 'Local gasification developer'], ['Indo Green Power', 'Pengembang energi sampah', 'Waste energy developer'], ['Rebricks', 'Pengolah plastik', 'Plastic processor'],
  ], sm('ed', 'proyek'));

  ke(bab, '11', 'teks', 'paragraf', P(
    ['Harga beli: USD 0,20 per kWh tetap 30 tahun, dibanding USD 0,1335 pada aturan lama (selisih sekitar 50 persen, EST dari FAQ). Harga tinggi ini dibayar sebagian lewat kompensasi negara ke PLN.', 'Purchase price: USD 0.20 per kWh fixed for 30 years, against USD 0.1335 under the old rule (about 50 percent higher, EST from the FAQ). The premium is partly paid through state compensation to PLN.'],
    ['Skala program: perkiraan investasi Rp91 triliun untuk 33 kota (Danantara); pasokan minimum 1.000 ton per hari per fasilitas; groundbreaking Bali Rp3 triliun dan Bekasi Rp3 triliun dengan 1.500 ton per hari.', 'Programme scale: estimated investment of IDR 91 trillion for 33 cities (Danantara); minimum supply of 1,000 tonnes a day per facility; Bali groundbreaking IDR 3 trillion and Bekasi IDR 3 trillion at 1,500 tonnes a day.'],
    ['Rekam jejak: dari 15 proyek di 12 kota hanya dua mencapai COD (Benowo 9 MW dan Putri Cempo 5 MW), total 14 MW dari 1.545 ton per hari kapasitas olah (EST, dijumlahkan dari FAQ).', 'Track record: of 15 projects in 12 cities only two reached COD (Benowo 9 MW and Putri Cempo 5 MW), a total of 14 MW from 1,545 tonnes a day (EST, summed from the FAQ).'],
  ), sm('metro109', 'empat', 'bali', 'bekasi', 'katmang', 'kisi'));

  ke(bab, '12', 'tabel', 'baris', regTabel([
    ['perpres-18-2016', 'Percepatan pembangkit listrik berbasis sampah di tujuh kota (dicabut)', 'Accelerating waste power in seven cities (revoked)'],
    ['perpres-35-2018', 'Instalasi pengolah sampah menjadi energi listrik di 12 kota (dicabut oleh Perpres 109/2025)', 'Waste-to-power installations in 12 cities (revoked by Perpres 109/2025)'],
    ['perpres-109-2025', 'Penanganan sampah perkotaan melalui PSEL berbasis teknologi ramah lingkungan', 'Urban waste handling through PSEL with environmentally friendly technology'],
  ]), sm('regul'));
  ke(bab, '13', 'linimasa', 'butir', liniReg([
    ['perpres-18-2016', 'Perpres 18/2016: pembangkit sampah untuk tujuh kota', 'Perpres 18/2016: waste power for seven cities'],
    ['perpres-35-2018', 'Perpres 35/2018: 12 kota prioritas', 'Perpres 35/2018: 12 priority cities'],
    ['perpres-109-2025', 'Perpres 109/2025 menetapkan tarif USD 0,20 per kWh dan peran Danantara', 'Perpres 109/2025 sets the USD 0.20 per kWh tariff and the Danantara role'],
  ]).concat([
    { tanggal: '2008-05-07', judul: T('UU 18/2008 tentang Pengelolaan Sampah disahkan', 'Law 18/2008 on Waste Management enacted'), url: SUMBER.uu18.url },
    { tanggal: '2026-03-01', judul: T('Pemenang tahap I diumumkan (bulan saja)', 'Stage I winners announced (month only)'), url: SUMBER.bogor.url },
    { tanggal: '2026-07-21', judul: T('Delapan konsorsium tahap II ditetapkan', 'Eight stage II consortia named'), url: SUMBER.tahap2.url },
  ]), sm('regul', 'bogor', 'tahap2'));

  ke(bab, '14', 'teks', 'paragraf', P(
    ['Sanksi dan celah: Perpres 109/2025 belum menjelaskan take-or-pay dan tidak ada penalti PPA bila pasokan sampah kurang (catatan Ashurst). Bagi investor, ini risiko volume; bagi kota, ini ruang untuk memperjanjikan pemilahan yang lebih baik.', 'Penalties and gaps: Perpres 109/2025 does not clarify take-or-pay and has no PPA penalty for waste shortfall (Ashurst note). For investors this is volume risk; for cities it is room to contract better sorting.'],
    ['Insentif nonfiskal: AMDAL otomatis disetujui dalam dua bulan dan PPA wajib dalam 10 hari kerja setelah izin prakonstruksi. Insentif fiskal rinci (pajak, bea masuk mesin) belum dikumpulkan di basis ini.', 'Non-fiscal incentives: AMDAL is automatically approved within two months and the PPA must follow within 10 working days of pre-construction permits. Detailed fiscal incentives (tax, machinery duty) are not collected in this base yet.'],
  ), sm('ashurst', 'metro109'));

  ke(bab, '15', 'langkah', 'butir', [
    { judul: T('Penetapan kota dan verifikasi kesiapan', 'City designation and readiness verification'), isi: T('Danantara menilai pasokan, lahan, dan kesiapan kota; empat dari tujuh kota siap pada November 2025.', 'Danantara assesses supply, land and readiness; four of seven cities were ready in November 2025.'), pelaku: T('Danantara, pemda', 'Danantara, local governments') },
    { judul: T('Tender pengembang dan penunjukan konsorsium', 'Developer tender and consortium selection'), isi: T('Tahap I pemenang Maret 2026, tahap II delapan konsorsium Juli 2026.', 'Stage I winners March 2026, stage II eight consortia July 2026.'), pelaku: T('Danantara, konsorsium', 'Danantara, consortia') },
    { judul: T('AMDAL dan izin prakonstruksi', 'AMDAL and pre-construction permits'), isi: T('AMDAL dipercepat menjadi dua bulan; PPA ditandatangani PLN dalam 10 hari kerja kemudian.', 'AMDAL is accelerated to two months; PLN signs the PPA within 10 working days afterwards.'), pelaku: T('Pengembang, KLH, PLN', 'Developer, Environment Ministry, PLN') },
  ], sm('empat', 'tahap2', 'metro109'));
  if (bab['15']) bab['15'].catatan = T('Alur menurut Perpres 109/2025 dan pemberitaan Danantara; lama setiap langkah di luar yang tertulis belum bersumber.', 'Flow per Perpres 109/2025 and Danantara reporting; the duration of each step beyond what is stated is not yet sourced.');

  ke(bab, '17', 'teks', 'paragraf', P(
    ['1. Pembakar grate bergerak (mass burn) dengan pemulihan panas: teknologi mapan di Jepang dan Singapura; efisiensi listrik netto sekitar 20 sampai 27 persen. Danantara memastikan proyek PSEL memakai teknologi ramah lingkungan.', '1. Moving-grate mass burn with heat recovery: mature in Japan and Singapore; net electrical efficiency about 20 to 27 percent. Danantara states PSEL projects use environmentally friendly technology.'],
    ['2. Fluidized bed: lebih toleran terhadap variasi sampah dan sering dipakai bersama RDF; biaya perawatan lebih tinggi.', '2. Fluidised bed: more tolerant of waste variation and often used with RDF; higher maintenance cost.'],
    ['3. Gasifikasi dan pirolisis: skala menengah, pasar masih menunggu bukti operasi jangka panjang; kasus gagal global banyak.', '3. Gasification and pyrolysis: mid-scale, the market still waits for long-term operating proof; global failures are common.'],
    ['4. Pengering biologis (biodrying) untuk sampah basah: menurunkan kadar air sebelum dibakar atau diolah menjadi RDF; relevan untuk sampah organik Indonesia.', '4. Biodrying for wet waste: lowers moisture before burning or RDF production; relevant to Indonesian organic waste.'],
    ['5. Penangkapan karbon pada PSEL: proyek percontohan Eropa dan Asia Timur; di Indonesia belum ada.', '5. Carbon capture at WtE: pilots in Europe and East Asia; none in Indonesia yet.'],
    ['6. Pencerna anaerob organik terpisah: mengubah sampah organik pasar dan rumah tangga menjadi biogas dan pupuk, mengurangi beban PSEL.', '6. Separate organic anaerobic digestion: turns market and household organics into biogas and fertiliser, easing PSEL load.'],
    ['7. Pengolahan gas TPA: menangkap metana TPA untuk listrik (kasus Bantargebang di basis pendanaan METI).', '7. Landfill gas recovery: capturing landfill methane for power (the Bantargebang case in the METI funding base).'],
    ['8. Sensor pemantauan emisi daring dan pelaporan publik: jawaban atas kritik transparansi (bab 29).', '8. Online emission monitoring sensors and public reporting: an answer to transparency critique (chapter 29).'],
  ), sm('iea_wte', 'teknologi', 'ed', 'pendanaan'));

  ke(bab, '29', 'teks', 'paragraf', P(
    ['Kesehatan dan keadilan lingkungan: kritik seperti APSN dan GAIA menyebut insinerasi mahal, kotor, dan membebani komunitas sekitar; pendukung menyebut standar emisi modern di Jepang dan Singapura. Data emisi terbuka per fasilitas adalah kunci kepercayaan.', 'Health and environmental justice: critics such as APSN and GAIA call incineration costly, dirty and a burden on neighbouring communities; supporters cite modern emission standards in Japan and Singapore. Open emission data per facility is the key to trust.'],
    ['Pemulung dan ekonomi informal: pasokan 1.000 ton per hari dapat menyaingi sektor daur ulang informal; skema transisi pemulung belum ada di naskah kebijakan.', 'Waste pickers and the informal economy: a 1,000 tonne a day supply could compete with informal recycling; no waste picker transition scheme exists in the policy text.'],
  ), sm('apsn', 'ashurst', 'tgr'));
  ke(bab, '31', 'teks', 'paragraf', P(
    ['Per peran: pengembang menyiapkan konsorsium dengan operator berpengalaman dan kontrak pasokan; pemasok mesin dan pengolah gas buang membidik 33 kota; pemda memastikan pemilahan dan lahan; investor menilai risiko volume dan nilai kalor; akademisi mengisi data komposisi sampah per kota.', 'By role: developers prepare consortia with experienced operators and supply contracts; machinery and flue gas suppliers target 33 cities; local governments ensure sorting and land; investors assess volume and calorific risk; academics fill city-level composition data.'],
  ), sm('ed', 'kisi'));
  ke(bab, '32', 'teks', 'paragraf', P(
    ['Daftar pantau: (1) COD Bali akhir 2027 dan Bekasi pertengahan 2028; (2) penetapan tahap II dan III; (3) tahap kompensasi negara di APBN; (4) aturan take-or-pay; (5) hasil uji nilai kalor sampah per kota; (6) data emisi terbuka; (7) kasus Sunter dan Gedebage; (8) status Tangerang dan Tangsel; (9) perkembangan RUU EBET; (10) pendampingan pemulung.', 'Watch list: (1) Bali COD end 2027 and Bekasi mid 2028; (2) stage II and III designation; (3) state compensation stage in the budget; (4) take-or-pay rules; (5) per-city waste calorific tests; (6) open emission data; (7) the Sunter and Gedebage cases; (8) status of Tangerang and South Tangerang; (9) RUU EBET progress; (10) waste picker support.'],
  ), sm('bali', 'bekasi', 'tgr', 'ruuebet'));
}
