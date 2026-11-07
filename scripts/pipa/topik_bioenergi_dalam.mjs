// Pendalaman naskah Bioenergi (8 Nov 2026): menambah bab yang sudah ada dan menautkan id data. Dipanggil dari susun() di topik_bioenergi.mjs.
import { T, S, G, FQ, P, HIP, HIPE, sm, ke, TGL, baca, tambahSumber, pemainTabel, liniReg, regTabel, petaProv, oid, iid, did, pid } from './topik_dalam_lib.mjs';

const SUMBER_BARU = {
  iea_bio: S('IEA, Bioenergy (ringkasan teknologi, kebijakan, dan data bioenergi dunia)', 'IEA', 'https://www.iea.org/energy-system/renewables/bioenergy', TGL, 'resmi'),
  wto593: S('WTO, DS593 Indonesia lawan Uni Eropa: tindakan atas minyak sawit dan biofuel berbasis sawit (halaman sengketa)', 'WTO', 'https://www.wto.org/english/tratop_e/dispu_e/cases_e/ds593_e.htm', TGL, 'resmi'),
  ipcc6: S('IPCC AR6 WG1 bab 7: potensi pemanasan global (GWP) metana dan gas lain', 'IPCC', 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-7/', TGL, 'resmi'),
  ipcc_ef: S('IPCC Guidelines 2006 vol. 2 bab 2: faktor emisi bawaan bahan bakar (batubara bituminus lain 94,6 kg CO2 per GJ)', 'IPCC', 'https://www.ipcc-nggip.iges.or.jp/public/2006gl/vol2.html', TGL, 'resmi'),
  redIII: S('Uni Eropa, Directive (EU) 2023/2413 (RED III): target energi terbarukan 42,5 persen pada 2030', 'Uni Eropa', 'https://eur-lex.europa.eu/eli/dir/2023/2413/oj', '2023-10-31', 'resmi'),
};

export function perdalam(bab, SUMBER, ctx) {
  tambahSumber(SUMBER, SUMBER_BARU);
  const rf = (n, d = 1) => Math.round(n * 10 ** d) / 10 ** d;

  /* ---- angka turunan (EST) ---- */
  const TJ_TOTAL = 600 * 8760 * 0.8 / 1000 / 0.36 * 3.6; // TJ kalor masuk PLTU contoh
  const TJ_BIO = TJ_TOTAL * 0.05;
  const CO2_BATUBARA = TJ_BIO * 94.6; // tCO2 per TJ = 94,6
  const HARI = 330, TBS_JAM = 60, JAM = 20, POME_PER_TON = 0.6, CH4_PER_POME = 20, KWH_CH4 = 9.94, EFF = 0.38;
  const pomeM3 = TBS_JAM * JAM * POME_PER_TON, ch4 = pomeM3 * CH4_PER_POME, kwhHari = ch4 * KWH_CH4 * EFF, mwRata = kwhHari / 24 / 1000;
  const tco2eTahun = ch4 * 0.668 / 1000 * 27 * HARI;
  const fame = 15.646372 * 0.88, pangsaPso = 7454600 / 15646372 * 100;
  const t25 = (tek) => baca('public/data/kapasitas_tren.json').baris.find((r) => r.taksonomi === 'bioenergi' && r.teknologi === tek && r.tahun === 2025)?.kapasitas_mw ?? 0;
  const pad25 = rf(t25('bioenergi_padat'), 0), bg25 = rf(t25('biogas'), 0), tot25 = rf(t25('bioenergi_padat') + t25('biogas'), 0);
  const etanolLahan = 1.4e9 / 5000;

  /* ---- bab 2 FAQ: 8 menjadi 15 ---- */
  ke(bab, '2', 'faq', 'butir', FQ([
    ['Berapa harga cangkang sawit untuk co-firing?', 'What does palm kernel shell cost for co-firing?', 'Sekitar Rp1,7 juta per ton menurut pemberitaan Republika; lebih mahal daripada batubara yang harganya dibatasi kebijakan, dan ini salah satu sebab realisasi di bawah target.', 'About IDR 1.7 million per tonne per Republika; above policy-capped coal, which is one reason actuals trail targets.'],
    ['Apa itu ISPO dan apakah wajib bagi usaha bioenergi sawit?', 'What is ISPO and is it required for palm bioenergy?', 'ISPO (Indonesian Sustainable Palm Oil) adalah sertifikasi keberlanjutan sawit nasional. Permen ESDM 3/2026 mengatur sertifikasi tersebut untuk usaha bioenergi kelapa sawit; cek pasal dan masa transisinya di basis regulasi.', 'ISPO (Indonesian Sustainable Palm Oil) is the national palm sustainability certification. Energy Ministry Reg. 3/2026 governs it for palm bioenergy businesses; check the articles and transition period in the regulation base.'],
    ['Siapa yang menanggung selisih harga biodiesel dan solar?', 'Who covers the gap between biodiesel and diesel prices?', 'Dana perkebunan sawit (BPDP, dahulu BPDPKS) yang dipungut dari ekspor sawit dan turunannya; pungutan ekspor CPO naik dari 10 menjadi 12,5 persen mulai Maret 2026.', 'The palm plantation fund (BPDP, formerly BPDPKS) collected from palm exports; the CPO export levy rose from 10 to 12.5 percent from March 2026.'],
    ['Berapa listrik yang bisa dihasilkan satu pabrik sawit dari POME?', 'How much power can one palm mill make from POME?', `Kajian Undip menaksir sekitar 1 MW per pabrik berkapasitas 30 ton TBS per jam. Contoh hitung bab 5 untuk pabrik 60 ton per jam menghasilkan sekitar ${rf(mwRata, 1)} MW rata-rata (EST, asumsi hipotesis).`, `A Diponegoro University study estimates about 1 MW per mill of 30 tonnes FFB per hour. The chapter 5 example for a 60 tonne per hour mill gives about ${rf(mwRata, 1)} MW average (EST, hypothetical assumptions).`],
    ['Apakah co-firing benar-benar mengurangi emisi?', 'Does co-firing really cut emissions?', 'Tergantung asal bahan baku. Bila biomassa dari limbah, pengurangan nyata; bila dari tanaman energi yang menggantikan hutan, emisi bersih bisa naik. Perhitungan batas atas ada di bab 5 dan perdebatannya di bab 29.', 'It depends on feedstock origin. From residues the cut is real; from energy crops replacing forest net emissions can rise. The upper-bound calculation is in chapter 5 and the debate in chapter 29.'],
    ['Apa beda biodiesel (FAME) dengan diesel hijau (HVO)?', 'What is the difference between biodiesel (FAME) and green diesel (HVO)?', 'FAME adalah ester minyak nabati yang dicampur terbatas ke solar (B40). HVO diolah dengan hidrogen sehingga sifatnya mirip solar dan bisa dipakai tanpa batas campuran mesin, tetapi biaya produksinya lebih tinggi. Pesawat memakai varian serupa yang disebut SAF.', 'FAME is a vegetable-oil ester blended in limited share into diesel (B40). HVO is treated with hydrogen so it behaves like diesel and needs no engine blend limit, but costs more. Aviation uses a similar product called SAF.'],
    ['Bisakah proyek bioenergi menjual kredit karbon?', 'Can bioenergy projects sell carbon credits?', 'Bisa, terutama penangkapan metana POME dan biogas rumah tangga. Di basis pendanaan METI tercatat proyek Verra dan Gold Standard seperti Indonesia Domestic Biogas Programme dan penangkapan metana PT Musim Mas di Pangkalan Lesung; lihat bab 24.', 'Yes, mainly POME methane capture and household biogas. The METI funding base lists Verra and Gold Standard projects such as the Indonesia Domestic Biogas Programme and PT Musim Mas methane recovery at Pangkalan Lesung; see chapter 24.'],
  ]), sm('cof24', 'b50', 'pomeundip', 'regul', 'pendanaan'));

  /* ---- bab 3 glosarium: 15 menjadi 30+ ---- */
  ke(bab, '3', 'glosarium', 'butir', G([
    ['BBN', 'Bahan bakar nabati: biodiesel, bioetanol, dan minyak nabati murni.', 'Biofuel: biodiesel, bioethanol and straight vegetable oil.'],
    ['TBS', 'Tandan buah segar, bahan baku pabrik kelapa sawit.', 'Fresh fruit bunches, the raw material of a palm oil mill.'],
    ['CPO / PKO', 'Crude palm oil dan palm kernel oil, hasil olahan TBS.', 'Crude palm oil and palm kernel oil, products of processing FFB.'],
    ['Tankos (EFB)', 'Tandan kosong sawit, biomassa limbah pabrik yang potensial untuk pelet dan pembangkit.', 'Empty fruit bunches, mill waste biomass suited to pellets and power.'],
    ['Biogas', 'Campuran metana dan CO2 dari penguraian anaerob limbah organik.', 'A methane and CO2 mixture from anaerobic digestion of organic waste.'],
    ['Biometana (bio-CNG)', 'Biogas yang dimurnikan hingga kadar metana tinggi sehingga setara gas alam.', 'Biogas purified to high methane content, equivalent to natural gas.'],
    ['Digestat', 'Sisa padat dan cair dari pencerna biogas yang dapat dipakai sebagai pupuk.', 'Solid and liquid residue of a digester that can be used as fertiliser.'],
    ['HVO / diesel hijau', 'Hydrotreated vegetable oil, minyak nabati yang diolah dengan hidrogen menjadi bahan bakar mirip solar.', 'Hydrotreated vegetable oil, processed with hydrogen into a diesel-like fuel.'],
    ['SAF', 'Sustainable aviation fuel, bahan bakar pesawat nabati atau sintetis berkelanjutan.', 'Sustainable aviation fuel, a sustainable bio-based or synthetic jet fuel.'],
    ['Gasifikasi', 'Proses termal memecah biomassa menjadi gas sintesis (syngas) untuk mesin atau turbin.', 'A thermal process turning biomass into syngas for engines or turbines.'],
    ['Torefaksi', 'Pemanasan biomassa tanpa oksigen pada sekitar 200 sampai 300 derajat Celsius agar lebih padat energi dan tahan air.', 'Heating biomass without oxygen at about 200 to 300 degrees Celsius to make it denser in energy and water resistant.'],
    ['Biochar', 'Arang hayati dari pirolisis biomassa, dipakai untuk tanah dan penyimpan karbon.', 'Biomass pyrolysis char used for soil and carbon storage.'],
    ['Nilai kalor (LHV/HHV)', 'Energi per massa bahan bakar; LHV tidak menghitung uap air, HHV menghitungnya.', 'Energy per unit mass of fuel; LHV excludes water vapour, HHV includes it.'],
    ['Faktor emisi', 'Emisi CO2 per satuan energi bahan bakar; bawaan IPCC batubara sekitar 94,6 kg per GJ.', 'CO2 emitted per unit of fuel energy; the IPCC default for coal is about 94.6 kg per GJ.'],
    ['ILUC', 'Indirect land-use change, perubahan penggunaan lahan tidak langsung akibat tanaman energi yang menggeser lahan pangan.', 'Indirect land-use change caused by energy crops displacing food land.'],
    ['RED III', 'Renewable Energy Directive III Uni Eropa, target 42,5 persen terbarukan pada 2030 dengan kriteria keberlanjutan bahan baku.', 'EU Renewable Energy Directive III, 42.5 percent renewables by 2030 with feedstock sustainability criteria.'],
    ['RSPO', 'Roundtable on Sustainable Palm Oil, standar sukarela internasional untuk sawit.', 'Roundtable on Sustainable Palm Oil, an international voluntary palm standard.'],
    ['HIP BBN', 'Harga indeks pasar bahan bakar nabati yang ditetapkan pemerintah sebagai patokan pembayaran.', 'The market index price of biofuel set by government as a payment benchmark.'],
    ['Pencerna anaerob', 'Tangki tertutup tempat bakteri menguraikan limbah tanpa oksigen menjadi biogas.', 'A sealed tank where bacteria break down waste without oxygen into biogas.'],
    ['Peat dan HTI', 'Gambut dan hutan tanaman industri; sumber risiko emisi bila lahannya dibuka untuk bahan baku.', 'Peatland and industrial plantation forest; sources of emission risk when cleared for feedstock.'],
  ]), sm('ed'));

  /* ---- bab 4 apa dan kenapa: 3 menjadi 5 paragraf ---- */
  ke(bab, '4', 'teks', 'paragraf', P(
    ['Secara fisika, bioenergi adalah energi surya yang disimpan fotosintesis. Karena bentuknya bahan bakar (padat, cair, gas), bioenergi dapat disimpan dan dipakai sesuai kebutuhan; ini membedakannya dari surya dan bayu yang bergantung cuaca.', 'Physically, bioenergy is solar energy stored by photosynthesis. Because it is a fuel (solid, liquid, gas) it can be stored and dispatched on demand, unlike solar and wind that depend on weather.'],
    ['Bagi Indonesia ada tiga alasan penting: (1) negara produsen sawit terbesar sehingga limbah dan minyaknya melimpah, (2) mengurangi impor solar dan bensin, dan (3) memakai PLTU yang sudah ada lewat co-firing tanpa membangun pembangkit baru.', 'For Indonesia three reasons matter: (1) it is the largest palm producer so residues and oil are abundant, (2) it reduces diesel and gasoline imports, and (3) co-firing uses existing coal plants without new build.'],
  ), sm('ed'));

  /* ---- bab 5 sains: rumus 6, contoh 5 ---- */
  ke(bab, '5', 'rumus', 'rumus', P(
    ['Emisi terhindar co-firing, batas atas (tCO2) = biomassa (ton) x nilai kalor (GJ per ton) x faktor emisi batubara (0,0946 tCO2 per GJ) x faktor netralitas (0 sampai 1)', 'Co-firing avoided emissions, upper bound (tCO2) = biomass (t) x calorific value (GJ per t) x coal emission factor (0.0946 tCO2 per GJ) x neutrality factor (0 to 1)'],
    ['Listrik dari POME (kWh per hari) = POME (m3) x metana per m3 POME x 9,94 kWh per m3 metana x efisiensi mesin', 'Power from POME (kWh per day) = POME (m3) x methane per m3 POME x 9.94 kWh per m3 methane x engine efficiency'],
    ['Metana terhindar (tCO2e) = metana tertangkap (m3) x 0,668 kg per m3 / 1000 x GWP metana (sekitar 27 menurut IPCC AR6 untuk metana nonfosil)', 'Avoided methane (tCO2e) = captured methane (m3) x 0.668 kg per m3 / 1000 x methane GWP (about 27 per IPCC AR6 for non-fossil methane)'],
    ['Lahan etanol (ha) = etanol (liter) / hasil (liter per ha); kebutuhan CPO biodiesel (ton) = FAME (kL) x 0,88 / rasio konversi', 'Ethanol land (ha) = ethanol (litres) / yield (litres per ha); biodiesel CPO need (t) = FAME (kL) x 0.88 / conversion ratio'],
  ), sm('ipcc_ef', 'ipcc6', 'pomeundip'));
  ke(bab, '5', 'rumus', 'contoh', [
    T(`Co-firing 5 persen pada PLTU contoh 600 MW: biomassa ${rf(TJ_BIO, 0)} TJ menggantikan batubara; dengan faktor 94,6 ton CO2 per TJ batas atas emisi terhindar sekitar ${rf(CO2_BATUBARA / 1000, 0)} ribu tCO2 per tahun bila biomassa dianggap netral penuh. Bila tanaman energi menggantikan hutan, angkanya bisa nol atau negatif (EST, hipotesis).`, `Co-firing 5 percent at the 600 MW example plant: ${rf(TJ_BIO, 0)} TJ of biomass replaces coal; at 94.6 t CO2 per TJ the upper bound of avoided emissions is about ${rf(CO2_BATUBARA / 1000, 0)} thousand tCO2 per year if biomass is fully neutral. If energy crops replace forest the figure can be zero or negative (EST, hypothesis).`),
    T(`Pabrik sawit ${TBS_JAM} ton TBS per jam, ${JAM} jam per hari, ${POME_PER_TON} m3 POME per ton TBS: ${rf(pomeM3, 0)} m3 POME per hari. Dengan ${CH4_PER_POME} m3 metana per m3 POME dihasilkan ${rf(ch4, 0)} m3 metana, setara sekitar ${rf(kwhHari / 1000, 0)} MWh listrik per hari pada efisiensi ${EFF * 100} persen, rata-rata ${rf(mwRata, 1)} MW (EST, semua asumsi hipotesis).`, `A palm mill of ${TBS_JAM} t FFB per hour, ${JAM} hours a day, ${POME_PER_TON} m3 POME per t FFB: ${rf(pomeM3, 0)} m3 POME a day. At ${CH4_PER_POME} m3 methane per m3 POME that is ${rf(ch4, 0)} m3 methane, equal to about ${rf(kwhHari / 1000, 0)} MWh of power a day at ${EFF * 100} percent efficiency, an average ${rf(mwRata, 1)} MW (EST, all assumptions hypothetical).`),
    T(`Bila metana yang sama dibiarkan lepas dari kolam terbuka, ${HARI} hari operasi per tahun setara sekitar ${rf(tco2eTahun / 1000, 0)} ribu tCO2e (EST, GWP 27); inilah dasar kredit karbon penangkapan metana.`, `If the same methane escaped from an open pond, ${HARI} operating days a year equal about ${rf(tco2eTahun / 1000, 0)} thousand tCO2e (EST, GWP 27); this is the basis of methane-capture carbon credits.`),
    T(`Alokasi biodiesel 2026 (15,65 juta kL) kira-kira ${rf(fame, 1)} juta ton FAME pada massa jenis 0,88; dengan rasio konversi 1:1 butuh sekitar ${rf(fame, 0)} juta ton CPO. Pangsa PSO ${rf(pangsaPso, 1)} persen dan non-PSO ${rf(100 - pangsaPso, 1)} persen (EST, rasio konversi hipotesis).`, `The 2026 biodiesel allocation (15.65 million kL) is roughly ${rf(fame, 1)} million tonnes of FAME at density 0.88; at a 1:1 conversion ratio it needs about ${rf(fame, 0)} million tonnes of CPO. The PSO share is ${rf(pangsaPso, 1)} percent and non-PSO ${rf(100 - pangsaPso, 1)} percent (EST, conversion ratio hypothetical).`),
    T(`Etanol E10 1,4 juta kL = 1,4 miliar liter; pada hasil tebu 5.000 liter per ha dibutuhkan sekitar ${rf(etanolLahan / 1000, 0)} ribu ha (EST; hasil 5.000 liter per ha adalah asumsi hipotesis, Brasil jauh lebih tinggi).`, `E10 ethanol of 1.4 million kL = 1.4 billion litres; at a cane yield of 5,000 litres per ha about ${rf(etanolLahan / 1000, 0)} thousand ha are needed (EST; 5,000 litres per ha is a hypothetical assumption, Brazil is far higher).`),
  ], sm('ipcc_ef', 'ipcc6', 'e10', 'bd26'));

  /* ---- bab 6 rantai nilai: 6 menjadi 8 tahap, pemain bernama ---- */
  ke(bab, '6', 'langkah', 'butir', [
    { judul: T('Perdagangan, harga indeks, dan ekspor', 'Trading, index price and exports'), isi: T('Pemerintah menetapkan HIP BBN; pelaku sawit menjual CPO ke pasar domestik atau ekspor dengan pungutan yang membiayai dana BPDP.', 'Government sets the biofuel index price; palm firms sell CPO domestically or export with levies that fund BPDP.'), pelaku: T('Wilmar, Musim Mas, APROBI, BPDP', 'Wilmar, Musim Mas, APROBI, BPDP') },
    { judul: T('Pengguna akhir dan pemantauan', 'End users and monitoring'), isi: T('SPBU Pertamina menjual solar campur; PLTU PLN memakai biomassa; ESDM memantau realisasi dan sanksi.', 'Pertamina stations sell blended diesel; PLN coal plants burn biomass; the Energy Ministry monitors actuals and penalties.'), pelaku: T('Pertamina Patra Niaga, PLN, ESDM', 'Pertamina Patra Niaga, PLN, Energy Ministry') },
  ], sm('ed', 'bd26'));

  /* ---- bab 7: tiga deret kapasitas (MW) ---- */
  const tr = baca('public/data/kapasitas_tren.json').baris;
  const deret = (tek) => tr.filter((r) => r.taksonomi === 'bioenergi' && r.teknologi === tek && r.tahun >= 2010).sort((a, z) => a.tahun - z.tahun).map((r) => [String(r.tahun), r.kapasitas_mw]);
  const total = tr.filter((r) => r.taksonomi === 'bioenergi' && r.tahun >= 2010).reduce((m, r) => ((m[r.tahun] = (m[r.tahun] || 0) + r.kapasitas_mw), m), {});
  bab['7'] = { tipe: 'grafik', jenis: 'garis', sumber: sm('kap'), label: T('Kapasitas bioenergi terpasang Indonesia menurut jenis', 'Indonesia installed bioenergy capacity by type'), satuan: 'MW', d: 0, catatan: T('Tiga deret MW dari IRENA: total, biomassa padat, dan biogas. Biodiesel dan etanol bukan kapasitas listrik sehingga tidak masuk.', 'Three MW series from IRENA: total, solid biomass and biogas. Biodiesel and ethanol are not power capacity so they are excluded.'), seri: [
    { nama: T('Total bioenergi', 'Total bioenergy'), sorot: true, titik: Object.entries(total).map(([y, v]) => [y, rf(v, 2)]) },
    { nama: T('Biomassa padat', 'Solid biomass'), titik: deret('bioenergi_padat') },
    { nama: T('Biogas', 'Biogas'), titik: deret('biogas') },
  ] };

  /* ---- bab 8 peta provinsi: kode BPS dan tautan ---- */
  petaProv(bab);

  /* ---- bab 9 pemain: tabel ber-id ---- */
  bab['9'] = pemainTabel('bioenergi', [
    ['Kementerian Energi dan Sumber Daya', 'Regulator: alokasi BBN dan co-firing', 'Regulator: biofuel allocation and co-firing'],
    ['Kementerian Kehutanan', 'Regulator: hutan tanaman energi dan lahan', 'Regulator: energy plantations and land'],
    ['Badan Pengelola Dana Perkebunan', 'Pendana selisih harga biodiesel', 'Biodiesel price-gap funder'],
    ['Asosiasi Produsen Biofuel', 'Asosiasi produsen biodiesel', 'Biodiesel producers association'],
    ['PT Pertamina \\(Persero\\)', 'Pencampur dan distributor BBN', 'Biofuel blender and distributor'],
    ['Pertamina Patra Niaga', 'Pencampuran dan niaga BBN', 'Biofuel blending and trading'],
    ['Wilmar Nabati', 'Produsen biodiesel', 'Biodiesel producer'], ['Wilmar Bioenergi', 'Produsen bioetanol dan biodiesel', 'Bioethanol and biodiesel producer'], ['Musim Mas', 'Produsen sawit dan biodiesel; penangkapan metana', 'Palm and biodiesel producer; methane capture'],
    ['PLN Indonesia Power', 'Pembangkit PLTU co-firing', 'Co-firing plant operator'], ['PLN Nusantara Power', 'Pembangkit PLTU co-firing', 'Co-firing plant operator'],
    ['^PLN$', 'Offtaker listrik dan pembeli biomassa', 'Power offtaker and biomass buyer'],
    ['Badan Pengelola Investasi Daya', 'Pendana transisi', 'Transition investor'],
  ], sm('ed', 'proyek'));

  /* ---- bab 11 pasar: delapan butir berangka ---- */
  ke(bab, '11', 'teks', 'paragraf', P(
    [`Struktur biodiesel: PSO bersubsidi ${rf(pangsaPso, 1)} persen dan non-PSO ${rf(100 - pangsaPso, 1)} persen dari alokasi 2026 (EST, hitung dari bd26). Konsumsi domestik 2025 sekitar 14,2 juta kL berarti alokasi 2026 sekitar ${rf(15.646372 / 14.2 * 100 - 100, 1)} persen di atasnya.`, `Biodiesel structure: subsidised PSO is ${rf(pangsaPso, 1)} percent and non-PSO ${rf(100 - pangsaPso, 1)} percent of the 2026 allocation (EST, from bd26). 2025 domestic consumption of about 14.2 million kL puts the 2026 allocation about ${rf(15.646372 / 14.2 * 100 - 100, 1)} percent above it.`],
    [`Co-firing: realisasi 2024 1,62 juta ton atau ${rf(1.62 / 2.83 * 100, 0)} persen dari target 2,83 juta ton; 2025 sekitar 2,35 juta ton; 2026 sampai 26 Agustus sekitar 1,4 juta ton atau ${rf(1.4 / 3.65 * 100, 0)} persen dari target 3,65 juta ton (EST, hitung dari cof24 dan cof26).`, `Co-firing: 2024 actual 1.62 million tonnes or ${rf(1.62 / 2.83 * 100, 0)} percent of the 2.83 million target; 2025 about 2.35 million tonnes; 2026 to 26 August about 1.4 million tonnes or ${rf(1.4 / 3.65 * 100, 0)} percent of the 3.65 million target (EST, from cof24 and cof26).`],
    ['Harga bahan baku: cangkang sawit sekitar Rp1,7 juta per ton (cof24). Dengan 2,35 juta ton per tahun, nilai pasokan sekitar Rp4 triliun per tahun (EST, kali harga rata-rata).', 'Feedstock price: palm shells about IDR 1.7 million per tonne (cof24). At 2.35 million tonnes a year the supply is worth about IDR 4 trillion a year (EST, times the average price).'],
    ['Dana: pungutan ekspor CPO naik dari 10 menjadi 12,5 persen mulai Maret 2026 (b50) untuk menjaga dana BPDP menutup selisih harga; klaim pemerintah, hemat devisa Rp139 triliun dari B40 (bdhemat).', 'Funding: the CPO export levy rose from 10 to 12.5 percent from March 2026 (b50) to keep BPDP able to cover the price gap; government claims forex savings of IDR 139 trillion from B40 (bdhemat).'],
    ['Etanol: E10 membutuhkan 1,4 juta kL per tahun (e10) dan pasokan dalam negeri masih terbatas (e10gap); Perpres 40/2023 mendorong tebu dan bioetanol di Merauke sebagai sumber baru.', 'Ethanol: E10 needs 1.4 million kL a year (e10) and domestic supply is limited (e10gap); Presidential Reg. 40/2023 pushes sugarcane and bioethanol in Merauke as a new source.'],
    [`Listrik: bioenergi 5,74 persen listrik 2024 menurut Ember; kapasitas total ${tot25} MW pada 2025 terdiri dari biomassa padat ${pad25} MW dan biogas ${bg25} MW (kap).`, `Power: bioenergy was 5.74 percent of 2024 electricity per Ember; total capacity of ${tot25} MW in 2025 consists of ${pad25} MW solid biomass and ${bg25} MW biogas (kap).`],
  ), sm('cof24', 'cof26', 'b50', 'bdhemat', 'e10', 'e10gap', 'kap', 'owid'));

  /* ---- bab 12 hukum: tambah baris ber-id ---- */
  ke(bab, '12', 'tabel', 'baris', regTabel([
    ['permen-esdm-4-2025', 'Pengusahaan dan pemanfaatan bahan bakar nabati', 'Business and use of biofuels'],
    ['permen-esdm-41-2018', 'Biodiesel dalam kerangka pembiayaan dana perkebunan (perluasan ke non-PSO)', 'Biodiesel under plantation fund financing (expansion to non-PSO)'],
    ['permen-esdm-32-2008', 'Penyediaan, pemanfaatan, dan tata niaga BBN (tonggak mandatori; dicabut)', 'Biofuel supply, use and trading (mandate milestone; revoked)'],
    ['keppres-10-2006', 'Tim Nasional Pengembangan BBN', 'National Biofuel Development Team'],
    ['perpres-109-2025', 'Pengolahan sampah menjadi energi terbarukan', 'Waste to renewable energy'],
    ['pp-150-2000', 'Pengendalian kerusakan tanah untuk produksi biomassa', 'Control of soil damage for biomass production'],
  ]), sm('regul'));

  /* ---- bab 13 linimasa: koreksi tanggal dan tambah tonggak ber-id regulasi ---- */
  const lini = bab['13'];
  lini.butir = lini.butir.filter((x) => !/Permen ESDM 12\/2023/.test(x.judul.id));
  ke(bab, '13', 'linimasa', 'butir', liniReg([
    ['keppres-10-2006', 'Keppres 10/2006 membentuk Tim Nasional Pengembangan BBN', 'Presidential Decree 10/2006 forms the National Biofuel Development Team'],
    ['permen-esdm-32-2008', 'Permen ESDM 32/2008: mandatori BBN bertahap', 'Energy Ministry Reg. 32/2008: staged biofuel mandate'],
    ['permen-esdm-20-2014', 'Permen ESDM 20/2014 menaikkan kewajiban BBN', 'Energy Ministry Reg. 20/2014 raises biofuel obligations'],
    ['permen-esdm-41-2018', 'Permen ESDM 41/2018: biodiesel dibiayai dana perkebunan, perluasan ke non-PSO', 'Energy Ministry Reg. 41/2018: biodiesel financed by the plantation fund, expansion to non-PSO'],
    ['permen-esdm-24-2021', 'Permen ESDM 24/2021 tentang biodiesel dan pembiayaan BPDPKS', 'Energy Ministry Reg. 24/2021 on biodiesel and BPDPKS financing'],
    ['perpres-40-2023', 'Perpres 40/2023: swasembada gula dan bioetanol', 'Presidential Reg. 40/2023: sugar self-sufficiency and bioethanol'],
    ['permen-esdm-12-2023', 'Permen ESDM 12/2023: co-firing biomassa di PLTU', 'Energy Ministry Reg. 12/2023: biomass co-firing in coal plants'],
    ['keppres-15-2024', 'Keppres 15/2024: Satgas Swasembada Gula dan Bioetanol Merauke', 'Presidential Decree 15/2024: Merauke Sugar and Bioethanol Task Force'],
    ['permen-esdm-4-2025', 'Permen ESDM 4/2025: pengusahaan dan pemanfaatan BBN', 'Energy Ministry Reg. 4/2025: biofuel business and use'],
    ['permen-esdm-3-2026', 'Permen ESDM 3/2026: ISPO untuk usaha bioenergi sawit', 'Energy Ministry Reg. 3/2026: ISPO for palm bioenergy businesses'],
  ]).concat([
    { tanggal: '2020-01-01', judul: T('B30 berlaku nasional (bulan saja)', 'B30 takes effect nationally (month only)'), url: SUMBER.regul.url },
    { tanggal: '2023-02-01', judul: T('B35 berlaku (bulan saja)', 'B35 takes effect (month only)'), url: SUMBER.regul.url },
    { tanggal: '2025-01-01', judul: T('B40 berlaku (bulan saja)', 'B40 takes effect (month only)'), url: SUMBER.bd26.url },
  ]), sm('regul'));

  /* ---- bab 14 kewajiban dan insentif ---- */
  ke(bab, '14', 'teks', 'paragraf', P(
    ['Kewajiban: badan usaha niaga BBM wajib mencampur biodiesel sesuai alokasi menteri; PLTU yang ditetapkan wajib menyerap biomassa sesuai Permen ESDM 12/2023; usaha bioenergi sawit wajib sertifikat ISPO sesuai Permen ESDM 3/2026. Sanksi dan masa transisi: baca pasal di basis regulasi.', 'Obligations: fuel trading businesses must blend biodiesel per ministerial allocation; designated coal plants must take biomass under Reg. 12/2023; palm bioenergy businesses must hold ISPO per Reg. 3/2026. Penalties and transition: read the articles in the regulation base.'],
    ['Insentif: selisih harga biodiesel dibayar dana BPDP; listrik biomassa dan biogas dibeli PLN dengan patokan Perpres 112/2022; proyek penangkapan metana dapat menjual kredit karbon (bab 24); DAK Infrastruktur Energi Terbarukan membuka dana daerah. Besaran insentif fiskal rinci belum dikumpulkan dalam basis ini.', 'Incentives: the biodiesel price gap is paid by the BPDP fund; biomass and biogas power is bought by PLN at Presidential Reg. 112/2022 benchmarks; methane capture projects can sell carbon credits (chapter 24); the Renewable Energy Infrastructure special allocation (DAK) opens regional funds. Detailed fiscal incentive amounts are not yet collected in this base.'],
  ), sm('regul', 'perpres112', 'dak'));

  /* ---- bab 15 perizinan: delapan langkah, tanpa durasi karangan ---- */
  ke(bab, '15', 'langkah', 'butir', [
    { judul: T('Nomor Induk Berusaha (NIB) lewat OSS', 'Business ID (NIB) through OSS'), isi: T('Daftar usaha di sistem OSS; klasifikasi KBLI menentukan izin berikutnya.', 'Register the business in the OSS system; the KBLI classification decides the next permits.'), pelaku: T('Pengembang', 'Developer') },
    { judul: T('Persetujuan lingkungan', 'Environmental approval'), isi: T('Dokumen AMDAL atau UKL-UPL menurut skala; pabrik pelet dan PLTBm perlu pengelolaan emisi dan limbah.', 'AMDAL or UKL-UPL by scale; pellet mills and biomass plants need emission and waste management.'), pelaku: T('Pengembang, KLH, pemda', 'Developer, Environment Ministry, local government') },
    { judul: T('Izin usaha penyediaan tenaga listrik (IUPTL)', 'Electricity supply business licence (IUPTL)'), isi: T('Untuk dijual ke PLN; untuk BBN, izin usaha niaga atau pengolahan dari Ditjen EBTKE dan Migas.', 'To sell to PLN; for biofuels, trading or processing licences from the relevant ESDM directorates.'), pelaku: T('Pengembang, ESDM', 'Developer, Energy Ministry') },
    { judul: T('Sertifikasi ISPO', 'ISPO certification'), isi: T('Wajib untuk bioenergi sawit (Permen ESDM 3/2026).', 'Required for palm bioenergy (Energy Ministry Reg. 3/2026).'), pelaku: T('Pengembang, lembaga sertifikasi', 'Developer, certification body') },
    { judul: T('Uji laik operasi (SLO)', 'Operation worthiness certificate (SLO)'), isi: T('Pembangkit baru wajib memiliki SLO sebelum operasi komersial.', 'New plants must hold an SLO before commercial operation.'), pelaku: T('Pengembang, lembaga inspeksi', 'Developer, inspection body') },
  ], sm('regul', 'ed'));
  bab['15'].catatan = T('Ringkasan alur umum. Lama dan biaya per langkah belum bersumber di basis ini sehingga sengaja tidak dicantumkan; jangan mengandalkan alur ini sebagai nasihat hukum.', 'General flow summary. Duration and cost per step are not yet sourced in this base so are deliberately omitted; do not rely on this as legal advice.');

  /* ---- bab 17 teknologi terbaru: delapan butir ---- */
  ke(bab, '17', 'teks', 'paragraf', P(
    ['1. Diesel hijau (HVO) dan SAF: pengolahan minyak nabati dan minyak jelantah dengan hidrogen menghasilkan bahan bakar siap pakai (drop-in). Mandat penerbangan Uni Eropa mulai 2025 mendorong permintaan; di repo tercatat inovasi bioavtur dari jelantah (Undip). Kematangan komersial, biaya masih jauh di atas bahan bakar fosil.', '1. Green diesel (HVO) and SAF: processing vegetable and used cooking oil with hydrogen gives drop-in fuel. EU aviation mandates from 2025 drive demand; the repo lists a bio-jet fuel from used cooking oil innovation (Undip). Commercially mature; cost remains well above fossil fuels.'],
    ['2. Biometana: pemurnian biogas dengan membran (kasus ITS) menghasilkan gas setara alam yang dapat disuntik ke jaringan atau dikompresi; TRL menengah di Indonesia.', '2. Biomethane: membrane upgrading of biogas (the ITS case) produces natural-gas-grade gas that can be injected into grids or compressed; mid TRL in Indonesia.'],
    ['3. Torefaksi dan pelet hitam: biomassa dipanaskan tanpa oksigen sehingga mirip batubara dan bisa dicampur lebih tinggi di PLTU; mengurangi masalah kadar air dan penyimpanan.', '3. Torrefaction and black pellets: biomass heated without oxygen resembles coal and can be blended at higher shares in coal plants; eases moisture and storage problems.'],
    ['4. Gasifikasi skala kecil: biomassa menjadi syngas untuk genset desa; cocok pulau dan hutan tanaman, tetapi perawatan tar menjadi tantangan.', '4. Small-scale gasification: biomass becomes syngas for village gensets; suits islands and plantation forests, but tar handling is the challenge.'],
    ['5. Etanol generasi kedua: bahan selulosa (tandan kosong, bagas) menghindari persaingan pangan; masih mahal dan pada tahap demonstrasi.', '5. Second-generation ethanol: cellulosic feedstock (empty fruit bunches, bagasse) avoids food competition; still costly and at demonstration stage.'],
    ['6. Biochar dan BECCS: pirolisis menghasilkan arang penyimpan karbon dan bioenergi dengan penangkapan karbon dapat menghasilkan emisi negatif; metodologi kredit karbon masih berkembang.', '6. Biochar and BECCS: pyrolysis gives carbon-storing char and bioenergy with carbon capture can give negative emissions; carbon credit methodologies are still developing.'],
    ['7. Pengolah anaerob termodifikasi: pencerna tertutup dan pemanfaatan digestat untuk pupuk menaikkan nilai ekonomi POME dan kotoran ternak (kasus biodigester kulit kopi di repo).', '7. Improved anaerobic digesters: closed digesters and digestate used as fertiliser raise the value of POME and manure (the coffee husk biodigester case in the repo).'],
    ['8. Pelacakan bahan baku digital: sertifikat asal dan data satelit untuk membuktikan bahan baku bebas deforestasi, jawaban atas kritik RED III dan kasus Drax.', '8. Digital feedstock tracing: origin certificates and satellite data prove deforestation-free feedstock, an answer to RED III critique and the Drax case.'],
  ), sm('iea_bio', 'redIII', 'pomeits', 'ed'));

  /* ---- bab 21-23 benchmark: tambah negara bersumber ---- */
  ke(bab, '21', 'teks', 'paragraf', P(
    ['Uni Eropa memakai RED III (target 42,5 persen terbarukan pada 2030) dengan kriteria keberlanjutan yang membatasi biofuel berisiko ILUC tinggi; Indonesia menggugatnya di WTO (DS593). Pelajaran bagi Indonesia: akses pasar ekspor bioenergi bergantung pada bukti bahan baku bebas deforestasi.', 'The EU uses RED III (42.5 percent renewables by 2030) with sustainability criteria that restrict high-ILUC-risk biofuels; Indonesia challenged it at the WTO (DS593). Lesson for Indonesia: export market access for bioenergy depends on proof of deforestation-free feedstock.'],
  ), sm('redIII', 'wto593'));

  /* ---- bab 24 pembiayaan: id pendanaan ---- */
  const pb = bab['24'];
  for (const r of pb.baris) { const a = baca('public/data/pendanaan.json').pendanaan.find((x) => x.nama === r.nama); if (a) { r.id = a.id; } }

  /* ---- bab 29 kontroversi: empat sisi ---- */
  ke(bab, '29', 'teks', 'paragraf', P(
    ['Sengketa dagang sawit: Uni Eropa membatasi biofuel sawit berisiko ILUC tinggi pada 2030 dalam RED; Indonesia menilai kebijakan itu diskriminatif dan menggugat ke WTO (DS593). Uni Eropa menyatakan kriteria berlaku untuk semua bahan baku. Dua sisi ini belum selesai di semua tingkatan.', 'Palm trade dispute: the EU phases out high-ILUC-risk palm biofuels by 2030 under RED; Indonesia considers this discriminatory and sued at the WTO (DS593). The EU says criteria apply to all feedstocks. The two sides are unresolved at every level.'],
    ['Pangan lawan bahan bakar: pendukung B40 menyebut devisa dan nilai tambah; pengkritik memperingatkan ekspansi kebun dan harga minyak goreng. Kuota 2026 hampir sama dengan 2025 sehingga tekanan lahan untuk B50 belum jadi nyata.', 'Food versus fuel: B40 supporters cite forex and added value; critics warn of plantation expansion and cooking oil prices. The 2026 quota is almost flat on 2025 so the land pressure for B50 has not materialised.'],
  ), sm('wto593', 'redIII', 'bd26', 'b50s'));

  /* ---- bab 31 peluang per peran, bab 32 dipantau 10 ---- */
  ke(bab, '31', 'teks', 'paragraf', P(
    ['Per peran: pengembang menangkap peluang PLTBg POME dan pelet biomassa dengan kontrak pasok jangka panjang; investor memeriksa sensitivitas harga bahan baku; pemda membentuk koperasi pasokan dan menyiapkan lahan non-hutan; akademisi mengisi celah data pabrik sawit dan metode MRV; pemasok mesin biogas dan boiler melayani 52 PLTU.', 'By role: developers can seize POME biogas and biomass pellet opportunities with long-term supply contracts; investors test feedstock price sensitivity; local governments organise supply cooperatives and prepare non-forest land; academics fill the mill data gap and MRV methods; biogas engine and boiler suppliers serve 52 plants.'],
  ), sm('ed', 'cofjob', 'pomeundip'));
  ke(bab, '32', 'teks', 'paragraf', P(
    ['Daftar pantau 2026 sampai 2027: (1) keputusan B50 dan jadwal; (2) realisasi co-firing dibanding 3,65 juta ton; (3) tarif pungutan ekspor CPO; (4) mandatori E10 2027 dan pasokan etanol 1,4 juta kL; (5) kemajuan Perpres 40/2023 dan Merauke; (6) pelaksanaan ISPO untuk bioenergi (Permen ESDM 3/2026); (7) RUU EBET; (8) harga cangkang; (9) hasil sengketa WTO DS593 dan RED; (10) pasar kredit karbon untuk metana POME.', 'Watch list 2026 to 2027: (1) B50 decision and schedule; (2) co-firing actuals against 3.65 million tonnes; (3) CPO export levy rate; (4) the 2027 E10 mandate and 1.4 million kL ethanol supply; (5) progress of Presidential Reg. 40/2023 and Merauke; (6) ISPO implementation for bioenergy (Reg. 3/2026); (7) the RUU EBET; (8) shell prices; (9) outcome of WTO DS593 and RED; (10) the carbon credit market for POME methane.'],
  ), sm('b50', 'cof26', 'e10', 'wto593', 'ruuebet'));
}
