// Pendalaman naskah Hidrogen (8 Nov 2026). Dipanggil dari susun() di topik_hidrogen.mjs.
import { T, S, G, FQ, P, sm, ke, TGL, baca, tambahSumber, pemainTabel, liniReg, regTabel, petaProv } from './topik_dalam_lib.mjs';

const SUMBER_BARU = {
  ghr25: S('IEA, Global Hydrogen Review 2025, ringkasan eksekutif (permintaan hampir 100 Mt pada 2024; produksi rendah emisi kurang dari 1 persen; potensi 2030 turun ke 37 Mtpa; elektroliser 2 GW pada 2024; biaya pasang di luar Tiongkok USD 2.000 sampai 2.600 per kW)', 'IEA', 'https://www.iea.org/reports/global-hydrogen-review-2025/executive-summary', '2025-09-01', 'resmi', 'CC BY 4.0'),
  ghr25sea: S('IEA, Global Hydrogen Review 2025, bab Asia Tenggara (permintaan kawasan 4 Mt pada 2024; Indonesia lebih dari sepertiga; hampir separuh adalah amonia; jalur proyek rendah emisi sekitar 480 ktpa)', 'IEA', 'https://www.iea.org/reports/global-hydrogen-review-2025/southeast-asia', '2025-09-01', 'resmi', 'CC BY 4.0'),
  ghr24: S('IEA, Global Hydrogen Review 2024 (edisi sebelumnya; potensi produksi 2030 49 Mtpa)', 'IEA', 'https://www.iea.org/reports/global-hydrogen-review-2024', '2024-10-01', 'resmi', 'CC BY 4.0'),
};

export function perdalam(bab, SUMBER) {
  tambahSumber(SUMBER, SUMBER_BARU);
  const rf = (n, d = 1) => Math.round(n * 10 ** d) / 10 ** d;
  const idn = baca('public/data/asean_energi.json').baris.find((x) => x.iso3 === 'IDN');
  const twhIDN = idn.pembangkitan_twh.nilai;
  const sea = 4, idnPangsa = 1 / 3, idnMt = sea * idnPangsa, twhPerMt = 55 * 1e6 * 1000 / 1e9; // 55 kWh/kg -> TWh per Mt
  const twhH2IDN = idnMt * twhPerMt / 1000; // TWh
  const PLN_TON = 203;

  ke(bab, '2', 'faq', 'butir', FQ([
    ['Berapa permintaan hidrogen Indonesia menurut IEA?', 'What is Indonesian hydrogen demand per the IEA?', `IEA Global Hydrogen Review 2025 mencatat permintaan Asia Tenggara 4 Mt pada 2024 dan Indonesia lebih dari sepertiganya, kira-kira ${rf(idnMt, 1)} Mt (EST). Angka ini lebih kecil daripada 4 juta ton yang dikutip DPR untuk Indonesia; selisihnya belum direkonsiliasi dan perlu dicek ke sumber DPR.`, `The IEA Global Hydrogen Review 2025 records Southeast Asian demand of 4 Mt in 2024 with Indonesia over a third, roughly ${rf(idnMt, 1)} Mt (EST). That is lower than the 4 million tonnes cited by the DPR for Indonesia; the gap has not been reconciled and the DPR source should be checked.`],
    ['Untuk apa hidrogen dipakai sekarang?', 'What is hydrogen used for today?', 'Hampir seluruhnya di kilang minyak dan industri (amonia, metanol). Di Asia Tenggara hampir separuh permintaan adalah amonia, dan dua pertiga amonia itu dari Indonesia; seluruh kebutuhan baru kurang dari 1 persen dunia (IEA).', 'Almost entirely in refining and industry (ammonia, methanol). In Southeast Asia nearly half of demand is ammonia and two-thirds of that is from Indonesia; all new uses are under 1 percent of the world total (IEA).'],
    ['Berapa kebutuhan listrik untuk hidrogen hijau?', 'How much electricity does green hydrogen need?', `Sekitar 50 sampai 55 kWh per kg di sistem elektroliser. Bila seluruh ${rf(idnMt, 1)} Mt permintaan Indonesia dihijaukan, dibutuhkan sekitar ${rf(twhH2IDN, 0)} TWh per tahun, ${rf(twhH2IDN / twhIDN * 100, 0)} persen dari seluruh listrik Indonesia 2024 (${twhIDN} TWh) (EST).`, `About 50 to 55 kWh per kg at system level. Greening all ${rf(idnMt, 1)} Mt of Indonesian demand would need about ${rf(twhH2IDN, 0)} TWh a year, ${rf(twhH2IDN / twhIDN * 100, 0)} percent of all Indonesian electricity in 2024 (${twhIDN} TWh) (EST).`],
    ['Berapa global produksi hidrogen rendah emisi?', 'How large is global low-emissions hydrogen production?', 'Kurang dari 1 persen produksi dunia; tumbuh 10 persen pada 2024 dan menuju 1 Mt pada 2025. Proyek yang beroperasi atau FID mencapai 4,2 Mtpa pada 2030 atau sekitar 4 persen (IEA).', 'Under 1 percent of world output; it grew 10 percent in 2024 and is heading to 1 Mt in 2025. Operating or FID projects reach 4.2 Mtpa by 2030 or about 4 percent (IEA).'],
    ['Apa itu hidrogen biru dan apakah relevan?', 'What is blue hydrogen and is it relevant?', 'Hidrogen dari gas alam dengan penangkapan CO2 (CCS). Perpres 14/2024 mengatur penangkapan dan penyimpanan karbon di Indonesia sehingga jalur biru terbuka secara hukum; IEA menilai CCUS lebih bersaing di wilayah bergas murah.', 'Hydrogen from natural gas with CO2 capture (CCS). Presidential Reg. 14/2024 governs carbon capture and storage in Indonesia so the blue path is legally open; the IEA finds CCUS more competitive where gas is cheap.'],
    ['Apa beda hidrogen dan amonia hijau sebagai pembawa energi?', 'How do hydrogen and green ammonia differ as carriers?', 'Amonia lebih mudah diangkut dan dipakai untuk pupuk atau kapal, tetapi konversi bolak-balik menghilangkan energi. Hidrogen langsung cocok untuk industri di lokasi yang sama.', 'Ammonia is easier to ship and use for fertiliser or ships but round-trip conversion loses energy. Direct hydrogen suits industry on the same site.'],
    ['Apakah hidrogen aman?', 'Is hydrogen safe?', 'Mudah menyala dan bocor karena molekulnya kecil, sehingga perlu sensor, ventilasi, dan standar tangki; stasiun pengisian dan elektroliser mengikuti kode keselamatan khusus.', 'It ignites easily and leaks because the molecule is small, so sensors, ventilation and tank standards are needed; refuelling stations and electrolysers follow specific safety codes.'],
    ['Bisakah hidrogen dipakai di PLTU dan PLTG?', 'Can hydrogen be burned in coal and gas plants?', 'RHAN menargetkan co-firing hidrogen 60 persen di PLTG pada 2045 dan pembangkit hidrogen murni 25,3 GW pada 2060 (bab 30); amonia dapat dicampur di PLTU. Keduanya masih tahap uji.', 'The RHAN targets 60 percent hydrogen co-firing in gas turbines by 2045 and 25.3 GW of pure hydrogen power by 2060 (chapter 30); ammonia can be blended in coal plants. Both are still at trial stage.'],
  ]), sm('ghr25', 'ghr25sea', 'ed'));

  ke(bab, '3', 'glosarium', 'butir', G([
    ['Hidrogen pink / kuning / turkois', 'Hidrogen dari nuklir / surya jaringan campuran / pirolisis metana; warna hanyalah label, yang dihitung adalah intensitas karbonnya.', 'Hydrogen from nuclear / mixed grid solar / methane pyrolysis; colour is only a label, what counts is carbon intensity.'],
    ['Hidrogen putih', 'Hidrogen alami yang ditemukan di perut bumi; belum terbukti komersial.', 'Natural hydrogen found underground; not yet proven commercial.'],
    ['SMR / ATR', 'Steam methane reforming / autothermal reforming, pembuatan hidrogen dari gas alam.', 'Steam methane reforming / autothermal reforming, making hydrogen from natural gas.'],
    ['Alkalin / PEM / AEM / SOEC', 'Jenis elektroliser: alkalin murah dan matang; PEM cepat merespons; AEM berkembang; SOEC bersuhu tinggi dan sangat efisien.', 'Electrolyser types: alkaline cheap and mature; PEM fast responding; AEM emerging; SOEC high temperature and very efficient.'],
    ['Faktor kapasitas elektroliser', 'Persen jam setahun elektroliser beroperasi; menentukan sebaran biaya modal per kg.', 'Share of hours a year the electrolyser runs; sets the capital cost per kg.'],
    ['Haber-Bosch', 'Proses pembuatan amonia dari nitrogen dan hidrogen pada suhu dan tekanan tinggi.', 'The process making ammonia from nitrogen and hydrogen at high temperature and pressure.'],
    ['Metanol hijau / e-fuel', 'Bahan bakar sintetis dari hidrogen hijau dan CO2 untuk kapal dan pesawat.', 'Synthetic fuels from green hydrogen and CO2 for ships and aircraft.'],
    ['Sel bahan bakar (fuel cell)', 'Perangkat yang mengubah hidrogen dan oksigen menjadi listrik dan air.', 'A device converting hydrogen and oxygen into electricity and water.'],
    ['FCEV', 'Kendaraan listrik sel bahan bakar, pengisian hidrogen dalam menit.', 'Fuel cell electric vehicle, refuelled with hydrogen in minutes.'],
    ['Pengikatan (offtake agreement)', 'Kontrak pembelian jangka panjang yang menentukan kelayakan pendanaan proyek.', 'A long-term purchase contract deciding the bankability of a project.'],
    ['CfD hidrogen', 'Contract for difference yang membayar selisih harga hidrogen hijau dengan acuan fosil.', 'A contract for difference paying the gap between green hydrogen and a fossil reference price.'],
    ['Skema sertifikasi (Guarantee of Origin)', 'Sertifikat yang membuktikan jejak karbon hidrogen; belum ada standar nasional Indonesia.', 'A certificate proving hydrogen carbon footprint; no Indonesian national standard exists yet.'],
    ['Embrittlement', 'Pengerapuhan baja oleh hidrogen yang membatasi pipa dan tangki.', 'Hydrogen-caused steel embrittlement that limits pipes and tanks.'],
    ['Mtpa / ktpa', 'Juta ton per tahun / ribu ton per tahun.', 'Million tonnes per year / thousand tonnes per year.'],
    ['Kg per hari', 'Satuan produksi pilot kecil; 100 kg per hari di Ulubelu.', 'Unit of small pilot output; 100 kg a day at Ulubelu.'],
  ]), sm('ed'));

  ke(bab, '4', 'teks', 'paragraf', P(
    ['Hidrogen bukan sumber energi tetapi pembawa: ia harus dibuat dari energi lain. Nilainya ada pada tempat listrik langsung tidak bisa masuk, seperti pupuk, kilang, baja, kapal, dan penerbangan.', 'Hydrogen is not a source but a carrier: it must be made from other energy. Its value lies where direct electricity cannot reach, such as fertiliser, refining, steel, shipping and aviation.'],
    ['Bagi Indonesia daya tariknya tiga: sudah menjadi konsumen hidrogen abu-abu dalam jumlah besar (pupuk, kilang), punya panas bumi dan hidro untuk listrik hijau stabil, dan berpeluang mengekspor amonia hijau. Kelemahannya: biaya tinggi dan permintaan hijau belum ada.', 'For Indonesia the attractions are three: it is already a large consumer of grey hydrogen (fertiliser, refining), has geothermal and hydro for stable green power and could export green ammonia. The weaknesses: high cost and no green demand yet.'],
  ), sm('ghr25sea', 'ed'));

  const tw = (mw, cf, kwh) => mw * 8760 * cf * 1000 / kwh; // kg per tahun
  const h2Mw = tw(100, 0.5, 55) / 1000; // ton per tahun untuk 100 MW pada 50 persen
  ke(bab, '5', 'rumus', 'rumus', P(
    ['Produksi (kg per tahun) = MW elektroliser x 8.760 x faktor kapasitas x 1000 / konsumsi sistem (kWh per kg)', 'Output (kg per year) = electrolyser MW x 8,760 x capacity factor x 1000 / system consumption (kWh per kg)'],
    ['Amonia (ton) = hidrogen (ton) / 0,18; kebutuhan hidrogen stoikiometri 0,176 ton per ton amonia', 'Ammonia (t) = hydrogen (t) / 0.18; stoichiometric hydrogen need 0.176 t per t ammonia'],
    ['Air (kg) = hidrogen (kg) x 9 stoikiometri, praktis 10 sampai 15 kali', 'Water (kg) = hydrogen (kg) x 9 stoichiometric, practically 10 to 15 times'],
    ['Porsi biaya modal per kg = CAPEX x faktor anuitas / (kg per tahun); bila faktor kapasitas turun separuh, porsi ini naik dua kali', 'Capital cost per kg = CAPEX x annuity factor / (kg per year); if capacity factor halves this share doubles'],
  ), sm('ghr25', 'ed'));
  ke(bab, '5', 'rumus', 'contoh', [
    T(`Elektroliser hipotesis 100 MW pada faktor kapasitas 50 persen (PLTS) dan 55 kWh per kg menghasilkan ${rf(h2Mw, 0)} ton hidrogen per tahun (EST). Bandingkan produksi PLN sekitar ${PLN_TON} ton per tahun dari 22 pabrik.`, `A hypothetical 100 MW electrolyser at a 50 percent capacity factor (solar) and 55 kWh per kg gives ${rf(h2Mw, 0)} tonnes of hydrogen a year (EST). Compare PLN's roughly ${PLN_TON} tonnes a year from 22 plants.`),
    T(`Untuk 1 juta ton amonia per tahun dibutuhkan sekitar ${rf(1e6 * 0.176 / 1000, 0)} ribu ton hidrogen; pada 55 kWh per kg itu ${rf(1e6 * 0.176 * 55 / 1e6, 1)} TWh listrik (EST).`, `One million tonnes of ammonia a year needs about ${rf(1e6 * 0.176 / 1000, 0)} thousand tonnes of hydrogen; at 55 kWh per kg that is ${rf(1e6 * 0.176 * 55 / 1e6, 1)} TWh of electricity (EST).`),
    T(`Biaya instal elektroliser di luar Tiongkok USD 2.000 sampai 2.600 per kW (IEA 2024). Pada 100 MW itu USD ${rf(100 * 1000 * 2000 / 1e6, 0)} sampai ${rf(100 * 1000 * 2600 / 1e6, 0)} juta, setara USD ${rf(100 * 1000 * 2000 * 0.1168 / (h2Mw * 1000), 1)} sampai ${rf(100 * 1000 * 2600 * 0.1168 / (h2Mw * 1000), 1)} per kg hanya dari biaya modal (EST, anuitas 0,1168 hipotesis, di luar listrik).`, `Electrolyser installed cost outside China is USD 2,000 to 2,600 per kW (IEA 2024). At 100 MW that is USD ${rf(100 * 1000 * 2000 / 1e6, 0)} to ${rf(100 * 1000 * 2600 / 1e6, 0)} million, or USD ${rf(100 * 1000 * 2000 * 0.1168 / (h2Mw * 1000), 1)} to ${rf(100 * 1000 * 2600 * 0.1168 / (h2Mw * 1000), 1)} per kg from capital alone (EST, hypothetical annuity 0.1168, excluding power).`),
  ], sm('ghr25', 'ed'));

  ke(bab, '6', 'langkah', 'butir', [
    { judul: T('Sertifikasi dan perdagangan', 'Certification and trading'), isi: T('Sertifikat asal (GoO atau REC) membuktikan listrik hijau; di Indonesia standar sertifikasi hidrogen belum ada.', 'Certificates of origin (GoO or REC) prove green power; no hydrogen certification standard exists in Indonesia yet.'), pelaku: T('PLN, ESDM, lembaga sertifikasi', 'PLN, Energy Ministry, certifiers') },
    { judul: T('Pendanaan dan pengikatan pembeli', 'Financing and offtake'), isi: T('Pembeli jangka panjang (pupuk, kilang) menentukan pendanaan proyek; tanpa pembeli proyek Townsville dihentikan.', 'Long-term buyers (fertiliser, refining) decide project finance; without buyers the Townsville project was stopped.'), pelaku: T('Pertamina, produsen pupuk, bank pembangunan', 'Pertamina, fertiliser makers, development banks') },
    { judul: T('Pelayanan akhir: transportasi, industri, ekspor', 'End uses: transport, industry, export'), isi: T('Stasiun pengisian PLN Senayan, pupuk, kilang, dan amonia ekspor.', 'The PLN Senayan station, fertiliser, refining and export ammonia.'), pelaku: T('PLN, Pertamina', 'PLN, Pertamina') },
  ], sm('hrs', 'ghr25sea', 'ed'));

  petaProv(bab);
  bab['9'] = pemainTabel('hidrogen', [
    ['PT Pertamina New', 'Pengembang hidrogen dan energi baru', 'Hydrogen and new energy developer'], ['PT Pertamina \\(Persero\\)', 'Pengolah dan konsumen hidrogen abu-abu', 'Processor and consumer of grey hydrogen'],
    ['Pertamina Geothermal', 'Pilot hidrogen hijau Ulubelu', 'Ulubelu green hydrogen pilot'],
    ['^PLN$', 'Produsen 22 GHP dan stasiun pengisian', 'Producer of 22 GHPs and a refuelling station'], ['PLN Indonesia Power', 'Pengembang pembangkit', 'Power developer'],
    ['ACWA Power', 'Pengembang hidrogen hijau internasional', 'International green hydrogen developer'], ['Masdar', 'Pengembang energi bersih internasional', 'International clean energy developer'], ['Shell', 'Energi internasional', 'International energy company'], ['Hyundai Motor Group', 'Produsen FCEV dan sel bahan bakar', 'FCEV and fuel cell maker'], ['Siemens Energy', 'Pemasok elektroliser dan turbin', 'Electrolyser and turbine supplier'],
    ['Badan Riset dan Inovasi Nasional', 'Riset teknologi hidrogen', 'Hydrogen technology research'], ['Pusat Studi Energi Universitas Gadjah Mada', 'Pusat studi', 'Study centre'], ['Institut Teknologi Bandung - Pusat Studi Energi', 'Pusat studi', 'Study centre'],
    ['Kementerian Energi dan Sumber Daya', 'Regulator Strategi Hidrogen Nasional', 'Regulator of the National Hydrogen Strategy'], ['Medco Energi', 'Pengembang energi', 'Energy developer'],
  ], sm('ed', 'proyek'));

  ke(bab, '11', 'teks', 'paragraf', P(
    [`Skala global: permintaan hampir 100 Mt pada 2024; hidrogen rendah emisi kurang dari 1 persen, tumbuh 10 persen setahun, menuju 1 Mt pada 2025 (IEA). Indonesia: produksi PLN 203 ton setara sekitar ${rf(PLN_TON / (idnMt * 1e6) * 100, 4)} persen dari perkiraan permintaan ${rf(idnMt, 1)} Mt (EST).`, `Global scale: demand nearly 100 Mt in 2024; low-emissions hydrogen under 1 percent, growing 10 percent a year toward 1 Mt in 2025 (IEA). Indonesia: PLN output of 203 tonnes is about ${rf(PLN_TON / (idnMt * 1e6) * 100, 4)} percent of the estimated ${rf(idnMt, 1)} Mt demand (EST).`],
    ['Jalur proyek: Asia Tenggara memiliki sekitar 480 ktpa proyek rendah emisi sampai 2030, lebih dari 90 persen di Indonesia dan Malaysia, dan hanya 6 persen telah FID (IEA). Dua proyek menyumbang hampir separuhnya.', 'Pipeline: Southeast Asia has about 480 ktpa of low-emissions projects to 2030, over 90 percent in Indonesia and Malaysia, and only 6 percent has reached FID (IEA). Two projects account for nearly half.'],
    ['Biaya: DPR mencatat USD 4,3 sampai 8,3 per kg dari PLTS, menuju sekitar USD 2 per kg sebelum 2040; IEA mencatat kesenjangan dengan hidrogen fosil melebar di 2023-2025 karena gas murah dan elektroliser mahal, tetapi menyempit menuju 2030.', 'Cost: the DPR records USD 4.3 to 8.3 per kg from solar, heading to about USD 2 per kg before 2040; the IEA records the gap with fossil hydrogen widened in 2023-2025 because of cheap gas and costly electrolysers but narrows toward 2030.'],
    ['Peta jalan: RHAN 2025 membagi inisiasi 2025-2030, integrasi 2031-2044, akselerasi 2045-2060 dengan target permintaan 2060 antara 9,9 dan 11,7 juta ton per tahun (dua sumber berbeda).', 'Roadmap: the 2025 RHAN splits initiation 2025-2030, integration 2031-2044 and acceleration 2045-2060 with 2060 demand targets between 9.9 and 11.7 million tonnes a year (two differing sources).'],
  ), sm('ghr25', 'ghr25sea', 'dpr', 'ibp'));

  ke(bab, '12', 'tabel', 'baris', regTabel([
    ['perpres-14-2024', 'Penangkapan dan penyimpanan karbon (CCS), relevan untuk hidrogen biru', 'Carbon capture and storage (CCS), relevant to blue hydrogen'],
    ['perpres-110-2025', 'Instrumen nilai ekonomi karbon dan pengendalian emisi gas rumah kaca', 'Carbon economic value instruments and greenhouse gas control'],
  ]), sm('regul'));
  ke(bab, '13', 'linimasa', 'butir', liniReg([
    ['perpres-14-2024', 'Perpres 14/2024: penangkapan dan penyimpanan karbon', 'Presidential Reg. 14/2024: carbon capture and storage'],
    ['perpres-110-2025', 'Perpres 110/2025: instrumen nilai ekonomi karbon', 'Presidential Reg. 110/2025: carbon economic value instruments'],
  ]).concat([
    { tanggal: '2024-10-01', judul: T('IEA menerbitkan Global Hydrogen Review 2024 (49 Mtpa potensi 2030; bulan saja)', 'IEA publishes Global Hydrogen Review 2024 (49 Mtpa 2030 potential; month only)'), url: SUMBER.ghr24.url },
    { tanggal: '2025-09-01', judul: T('IEA menerbitkan Global Hydrogen Review 2025 (potensi 2030 turun ke 37 Mtpa; bulan saja)', 'IEA publishes Global Hydrogen Review 2025 (2030 potential falls to 37 Mtpa; month only)'), url: SUMBER.ghr25.url },
  ]), sm('regul'));

  ke(bab, '14', 'teks', 'paragraf', P(
    ['IEA Asia Tenggara: Indonesia, Laos, Malaysia, Singapura, dan Vietnam memiliki strategi hidrogen; peluang kebijakan ada pada pergeseran bahan bakar di pemakaian yang ada dan pada sertifikasi. Indonesia belum memiliki kewajiban pemanfaatan, insentif fiskal, atau sertifikasi (DPR, Oktober 2025).', 'IEA Southeast Asia: Indonesia, Laos, Malaysia, Singapore and Viet Nam have hydrogen strategies; the policy opportunity lies in fuel switching in existing uses and certification. Indonesia has no utilisation mandate, fiscal incentive or certification yet (DPR, October 2025).'],
  ), sm('ghr25sea', 'dpr'));
  ke(bab, '15', 'langkah', 'butir', [
    { judul: T('Pilih pembeli dan pasar akhir sebelum elektroliser', 'Pick the buyer and end market before the electrolyser'), isi: T('Tanda tangani pengikatan jangka panjang dengan pabrik pupuk, kilang, atau pengguna transportasi.', 'Sign a long-term offtake with a fertiliser plant, refinery or transport user.'), pelaku: T('Pengembang, pembeli', 'Developer, buyer') },
    { judul: T('Pastikan listrik hijau dan sertifikat', 'Secure green power and certificates'), isi: T('Kontrak listrik terbarukan atau REC dari PLN; standar sertifikasi hidrogen belum ada.', 'Renewable power contract or PLN REC; no hydrogen certification standard yet.'), pelaku: T('Pengembang, PLN', 'Developer, PLN') },
    { judul: T('Izin lingkungan, keselamatan, dan tata ruang', 'Environmental, safety and zoning permits'), isi: T('Izin usaha, persetujuan lingkungan, dan kajian keselamatan tangki bertekanan.', 'Business licence, environmental approval and pressurised tank safety review.'), pelaku: T('Pengembang, ESDM, KLH', 'Developer, Energy Ministry, Environment Ministry') },
  ], sm('dpr', 'ed'));
  ke(bab, '17', 'teks', 'paragraf', P(
    ['1. Elektroliser: kapasitas dunia 2 GW pada 2024 dan menambah lebih dari 1 GW sampai Juli 2025; Tiongkok memegang 65 persen kapasitas terpasang dan FID, dan hampir 60 persen kapasitas pabrikan (IEA).', '1. Electrolysers: world capacity 2 GW in 2024, adding over 1 GW through July 2025; China holds 65 percent of installed and FID capacity and nearly 60 percent of manufacturing capacity (IEA).'],
    ['2. Kelebihan pasokan elektroliser: kapasitas pabrik Tiongkok 20 GW per tahun jauh di atas permintaan 2 GW pada 2024, menandakan konsolidasi.', '2. Electrolyser oversupply: Chinese factory capacity of 20 GW a year far exceeds 2024 demand of 2 GW, signalling consolidation.'],
    ['3. AEM dan elektroliser tanpa logam mulia: pilot Ulubelu memakai AEM.', '3. AEM and platinum-group-free electrolysers: the Ulubelu pilot uses AEM.'],
    ['4. Amonia hijau sebagai bahan bakar kapal dan pembangkit: uji bunkering di Singapura dan co-firing amonia di PLTU Jepang.', '4. Green ammonia as ship and power fuel: bunkering trials in Singapore and ammonia co-firing in Japanese coal plants.'],
    ['5. Baja berbasis hidrogen: peluang Indonesia dan Vietnam sebagai produsen baja dengan bijih besi, tetapi bersaing dengan Tiongkok (IEA).', '5. Hydrogen-based steel: an opportunity for Indonesia and Viet Nam as steel producers with iron ore, but competing with China (IEA).'],
    ['6. Penyimpanan hidrogen: kavern garam, tangki bertekanan, dan LOHC; pipa khusus hidrogen di Eropa.', '6. Hydrogen storage: salt caverns, pressurised tanks and LOHC; dedicated hydrogen pipelines in Europe.'],
    ['7. Sel bahan bakar untuk truk dan kereta: Hyundai dan lainnya; penggunaan di Indonesia masih terbatas pada stasiun percontohan.', '7. Fuel cells for trucks and trains: Hyundai and others; Indonesian use is limited to pilot stations.'],
    ['8. Pirolisis metana dan hidrogen alami: jalur alternatif tanpa elektroliser; masih tahap awal.', '8. Methane pyrolysis and natural hydrogen: alternative routes without electrolysers; still early stage.'],
  ), sm('ghr25', 'ghr25sea', 'ulu'));

  ke(bab, '29', 'teks', 'paragraf', P(
    ['Efisiensi dan prioritas: pengkritik menyebut hidrogen boros energi untuk pemakaian yang dapat dilistriki langsung; pendukung menegaskan hidrogen hanya untuk sektor sulit diistrikkan. Konsensus IEA: prioritas pada pemakaian yang ada (kilang, amonia).', 'Efficiency and priority: critics say hydrogen wastes energy where direct electrification works; supporters stress it is only for hard-to-electrify sectors. The IEA consensus: prioritise existing uses (refining, ammonia).'],
  ), sm('ghr25sea', 'ghr25'));
  ke(bab, '31', 'teks', 'paragraf', P(
    ['Per peran: pengembang mengamankan pembeli lebih dulu; pemasok elektroliser menghadapi konsolidasi dan harus bersaing dengan Tiongkok; pemda menyiapkan kawasan industri dekat sumber terbarukan; akademisi mengembangkan standar sertifikasi dan data biaya lokal; investor menunggu kebijakan permintaan.', 'By role: developers secure buyers first; electrolyser suppliers face consolidation and competition from China; local governments prepare industrial areas near renewable sources; academics develop certification standards and local cost data; investors wait for demand policy.'],
  ), sm('ghr25', 'dpr'));
  ke(bab, '32', 'teks', 'paragraf', P(
    ['Tambahan daftar pantau: (6) keputusan FID proyek hidrogen Asia Tenggara dari jalur 480 ktpa; (7) pembaruan IEA Global Hydrogen Review 2026; (8) rekonsiliasi angka permintaan Indonesia; (9) skema sertifikasi nasional; (10) harga elektroliser dan konsolidasi pabrikan.', 'Added watch list: (6) FID decisions on Southeast Asian hydrogen projects from the 480 ktpa pipeline; (7) the IEA Global Hydrogen Review 2026 update; (8) reconciliation of Indonesian demand figures; (9) a national certification scheme; (10) electrolyser prices and manufacturer consolidation.'],
  ), sm('ghr25sea', 'ghr25'));
  return {};
}
