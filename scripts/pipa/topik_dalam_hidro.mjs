// Pendalaman naskah Hidro (8 Nov 2026): menggabungkan JSON repo dan menambah bab tulisan tangan. Dipanggil dari susun() di topik_hidro.mjs.
import { pakaiDalam, G, FQ, LN, P, H, ke, pub, ringkasRuptl, proyeksi, proyeksiTeks, namaiLangkah, penjualanPln, fmt, fmtE, T } from './topik_dalam.mjs';

export function perdalam(d, SUMBER) {
  return pakaiDalam(d, 'hidro', SUMBER, {
    lcoe: [['Dunia', 'air', T('LCOE hidro dunia (indeks 2010 = 100)', 'Global hydro LCOE (index 2010 = 100)'), true], ['Dunia', 'surya', T('LCOE surya dunia (indeks 2010 = 100)', 'Global solar LCOE (index 2010 = 100)')], ['Dunia', 'bayu-darat', T('LCOE bayu darat dunia (indeks 2010 = 100)', 'Global onshore wind LCOE (index 2010 = 100)')]],
    owid: { jenis: 'hydro', lama: (r) => (r.n && r.v != null ? { neg: T(({ 'Lao PDR': 'Laos', 'Viet Nam': 'Vietnam', Cambodia: 'Kamboja', Philippines: 'Filipina', Singapore: 'Singapura', 'Brunei Darussalam': 'Brunei', Thailand: 'Thailand', Malaysia: 'Malaysia', Myanmar: 'Myanmar' })[r.n] || r.n, ({ 'Lao PDR': 'Laos', 'Viet Nam': 'Vietnam', Cambodia: 'Cambodia', Philippines: 'Philippines', Singapore: 'Singapore', 'Brunei Darussalam': 'Brunei', Thailand: 'Thailand', Malaysia: 'Malaysia', Myanmar: 'Myanmar' })[r.n] || r.n), iso2: ({ 'Lao PDR': 'LA', 'Viet Nam': 'VN', Cambodia: 'KH', Philippines: 'PH', Singapore: 'SG', 'Brunei Darussalam': 'BN', Thailand: 'TH', Malaysia: 'MY', Myanmar: 'MM' })[r.n] || null, tahun: '2024', porsi: r.v, twh: null, ebt: r.ebt, total_twh: null } : null) },
    isi: (d, { ambilSumber }) => isi(d, SUMBER, ambilSumber),
  });
}

function isi(d, SUMBER, ambilSumber) {
  ambilSumber('ed', 'kap', 'owid', 'lcoe', 'ruptl', 'perpres112', 'ruuebet', 'cirata', 'masdar', 'saguling', 'petro', 'btboc', 'kybn', 'posopeak', 'iea74', 'katadata20', 'detikbpk', 'mongntb', 'cmundip', 'itaipu', 'dak');
  const rr = ringkasRuptl('hidro'), pl = penjualanPln();
  const pot = pub('peluang').baris, hid = pot.reduce((s, r) => s + (r.potensi?.hidro?.mw || 0), 0), mik = pot.reduce((s, r) => s + (r.potensi?.mikrohidro?.mw || 0), 0);
  const k = pub('kapasitas_tren').baris.filter((x) => x.taksonomi === 'hidro'), k25 = k.find((x) => x.tahun === 2025), k24 = k.find((x) => x.tahun === 2024);
  const stat = pub('statistik_pln').baris.reduce((s, r) => s + (r.kapasitas_terpasang_mw?.['PLTA/M'] || 0), 0);

  ke(d, '2', 'faq', 'butir', FQ([
    ['Apakah PLTA perlu izin khusus?', 'Does hydropower need a special permit?', 'Penjualan listrik untuk umum butuh IUPTLU (maksimal 30 tahun); pembangkit sendiri di atas 500 kW butuh IUPTLS. Bendungan dan sungai juga memerlukan persetujuan lingkungan dan izin sumber daya air, yang di luar cakupan jawaban singkat ini.', 'Selling power to the public needs an IUPTLU (up to 30 years); own-use plants above 500 kW need an IUPTLS. Dams and rivers also need environmental approval and water resources permits, which are outside this short answer.'],
    ['Bagaimana PLN membeli listrik dari PLTA?', 'How does PLN buy power from hydropower?', 'PLTA dibeli lewat pemilihan langsung; PLTA pada waduk atau saluran irigasi multiguna milik negara lewat penunjukan langsung. PLTA aliran sungai sampai 5 MW harus mampu beroperasi dengan faktor kapasitas minimal 60 persen (Perpres 112/2022 Pasal 14, 18, 19).', 'Hydropower is bought by direct selection; hydropower on state-owned multipurpose reservoirs or irrigation canals by direct appointment. Run-of-river plants up to 5 MW must be able to run at a capacity factor of at least 60 percent (Presidential Reg. 112/2022 Articles 14, 18, 19).'],
    ['Berapa potensi hidro Indonesia?', 'How large is the hydro potential?', `Basis peluang METI mencatat ${fmt(hid)} MW hidro dan ${fmt(mik)} MW mikrohidro per provinsi (RUEN 2015 dan sumber lain; sebagian provinsi hanya berupa total kelompok), sedangkan terpasang ${fmt(k25.kapasitas_mw)} MW (IRENA 2025).`, `The METI opportunity base records ${fmtE(hid)} MW of hydro and ${fmtE(mik)} MW of micro-hydro by province (RUEN 2015 and others; some provinces appear only as group totals) against ${fmtE(k25.kapasitas_mw)} MW installed (IRENA 2025).`],
    ['Mengapa PLTA sering terlambat?', 'Why is hydropower often late?', 'Karena pekerjaan sipil besar, risiko geologi dan hidrologi, pembebasan lahan dan relokasi, serta pendanaan multipihak. Jatigede butuh sembilan tahun dari pengisian waduk ke sinkronisasi dan Upper Cisokan bergeser dari 2025 ke 2030.', 'Because of large civil works, geological and hydrological risk, land acquisition and relocation, and multi-party financing. Jatigede took nine years from impoundment to synchronisation and Upper Cisokan slipped from 2025 to 2030.'],
    ['Apakah PLTA bisa menjadi baterai?', 'Can hydropower act as a battery?', 'PLTA pompa memompa air ke atas saat listrik murah dan melepasnya saat beban puncak. RUPTL 2025-2034 memuat penyimpanan termasuk PLTA pompa; Upper Cisokan adalah proyek pompa utama.', 'Pumped hydro pumps water uphill when power is cheap and releases it at peak load. The RUPTL 2025-2034 includes storage with pumped hydro; Upper Cisokan is the main pumped project.'],
    ['Siapa yang boleh membangun PLTMH desa?', 'Who may build village micro-hydro?', 'Koperasi atau badan usaha desa; izin kelistrikan mengikuti ambang yang sama (laporan sampai 500 kW, IUPTLS di atasnya). Kasus PLTMH mati menunjukkan pengelola dan dana pemeliharaan harus ditetapkan sebelum aset diserahkan.', 'Cooperatives or village enterprises; electricity permits follow the same thresholds (report up to 500 kW, IUPTLS above). Dead micro-hydro cases show the manager and maintenance fund must be set before the asset is handed over.'],
    ['Apa dampak PLTA pada ikan dan sungai?', 'What does hydropower do to fish and rivers?', 'Bendungan mengubah aliran, sedimen, dan jalur ikan; studi lingkungan harus menilai air limpas, tangga ikan, dan aliran lingkungan minimum. Kasus Batang Toru menunjukkan sengketa habitat satwa langka.', 'Dams change flow, sediment and fish passage; environmental studies must assess spill, fish ladders and minimum environmental flow. The Batang Toru case shows disputes over rare wildlife habitat.'],
  ]), ['d_izin', 'perpres112', 'd_pot', 'kap', 'ruptl', 'cmwwf']);
  ambilSumber('cmwwf');

  ke(d, '3', 'glosarium', 'butir', G([
    ['Turbin Francis, Pelton, Kaplan', 'Francis, Pelton, Kaplan turbines', 'Tiga jenis turbin air: Pelton untuk head tinggi, Francis menengah, Kaplan untuk head rendah dan debit besar.', 'Three kinds of water turbine: Pelton for high head, Francis for medium, Kaplan for low head and large flow.'],
    ['Pipa pesat (penstock)', 'Penstock', 'Pipa bertekanan yang mengalirkan air dari waduk atau bak penenang ke turbin.', 'The pressurised pipe carrying water from the reservoir or forebay to the turbine.'],
    ['Bendung dan bendungan', 'Weir and dam', 'Bendung menaikkan muka air sungai; bendungan menahan volume besar untuk waduk.', 'A weir raises the river level; a dam holds a large volume as a reservoir.'],
    ['Aliran sungai (run-of-river)', 'Run-of-river', 'PLTA tanpa waduk besar; keluaran mengikuti debit sungai.', 'Hydropower without a large reservoir; output follows river flow.'],
    ['Aliran lingkungan minimum', 'Minimum environmental flow', 'Debit minimum yang wajib dilepas ke hilir untuk menjaga ekosistem sungai.', 'The minimum flow that must be released downstream to sustain the river ecosystem.'],
    ['Kurva durasi aliran', 'Flow duration curve', 'Grafik berapa persen waktu debit melampaui nilai tertentu; dasar menentukan kapasitas.', 'A graph of the percentage of time flow exceeds a value; the basis for sizing capacity.'],
    ['Sedimentasi', 'Sedimentation', 'Pengendapan lumpur di waduk yang mengurangi volume dan umur PLTA.', 'Silt settling in the reservoir that reduces volume and plant life.'],
    ['Daerah tangkapan air', 'Catchment area', 'Wilayah yang menyalurkan hujan ke sungai di titik bendung.', 'The area that drains rain to the river at the weir point.'],
    ['Beban puncak', 'Peak load', 'Jam permintaan listrik tertinggi, saat PLTA berwaduk paling bernilai.', 'The hours of highest power demand, when reservoir hydro is most valuable.'],
    ['Black start', 'Black start', 'Kemampuan menyalakan pembangkit tanpa pasokan jaringan; PLTA lazim memilikinya.', 'The ability to start a plant without grid supply; hydropower commonly has it.'],
    ['Tarif PLTMH berbasis komunitas', 'Community micro-hydro tariff', 'Iuran warga untuk menutup biaya operasi dan pemeliharaan PLTMH desa.', 'Resident fees covering operation and maintenance of village micro-hydro.'],
    ['Kaskade', 'Cascade', 'Beberapa PLTA berurutan di satu sungai yang memakai air yang sama berulang.', 'Several hydro plants in sequence on one river reusing the same water.'],
    ['Pumped storage dan ESS', 'Pumped storage and ESS', 'Penyimpanan energi berbasis pompa air; bersaing dengan baterai (BESS).', 'Pump-based energy storage; competes with batteries (BESS).'],
    ['LCOE hidro', 'Hydro LCOE', 'Biaya listrik rata-rata sepanjang umur PLTA; sangat bergantung pada lokasi dan biaya sipil.', 'Average lifetime electricity cost of hydropower; highly dependent on site and civil costs.'],
  ]), ['ed']);

  ke(d, '4', 'teks', 'paragraf', P([
    [`Terpasang ${fmt(k25.kapasitas_mw)} MW pada 2025 (IRENA), naik dari ${fmt(k24.kapasitas_mw)} MW pada 2024; Statistik Ketenagalistrikan 2024 mencatat ${fmt(stat)} MW PLTA/M semua pengusaha, selisih angka karena cakupan sumber berbeda.`, `Installed ${fmtE(k25.kapasitas_mw)} MW in 2025 (IRENA), up from ${fmtE(k24.kapasitas_mw)} MW in 2024; the 2024 Electricity Statistics records ${fmtE(stat)} MW of PLTA/M for all operators, the gap arising from differing source coverage.`],
    ['Tiga skala berjalan berbeda: PLTA besar berwaduk (megaproyek, sering bergeser), PLTM aliran sungai (proyek IPP menengah) dan PLTMH komunitas (kecil, rawan mati tanpa pengelola). Kebijakan yang cocok untuk satu skala jarang cocok untuk yang lain.', 'Three scales behave differently: large reservoir hydro (megaprojects that often slip), run-of-river PLTM (mid-size IPP projects) and community PLTMH (small, prone to die without a manager). A policy fitting one scale seldom fits another.'],
  ]), ['kap', 'd_stat', 'ed']);

  ke(d, '5', 'rumus', 'rumus', P([
    ['Head bersih = head kotor - rugi gesekan pipa; daya memakai head bersih, bukan head kotor.', 'Net head = gross head - pipe friction losses; power uses net head, not gross head.'],
    ['Energi PLTA aliran sungai = jumlah (daya pada debit jam ke-i) dari kurva durasi aliran; faktor kapasitas mengikuti musim.', 'Run-of-river energy = sum of (power at flow in hour i) from the flow duration curve; capacity factor follows the season.'],
    ['Biaya per kW = (biaya sipil + elektromekanik + jaringan) / kapasitas; biaya sipil mendominasi PLTA berwaduk.', 'Cost per kW = (civil + electromechanical + grid cost) / capacity; civil cost dominates reservoir hydro.'],
    ['Pumped storage: energi keluar = energi pompa x efisiensi siklus; efisiensi siklus hidro pompa umumnya di kisaran 70 sampai 80 persen (penjelasan umum, cek lembar data proyek).', 'Pumped storage: energy out = pumping energy x round-trip efficiency; pumped hydro round-trip efficiency is generally in the 70 to 80 percent range (general explanation, check project datasheets).'],
  ]), ['ed']);
  ke(d, '5', 'rumus', 'contoh', P([
    ['Contoh head bersih (asumsi Hipotesis): head kotor 100 m dengan rugi pipa 5 m memberi head bersih 95 m; daya turun 5 persen dari contoh bab ini (EST).', 'Net head example (Hypothesis assumption): gross head of 100 m with 5 m pipe loss gives 95 m net head; power falls 5 percent from this chapter example (EST).'],
    ['Contoh pumped storage (asumsi Hipotesis 75 persen): memompa 1.000 MWh mengembalikan 750 MWh (EST).', 'Pumped storage example (Hypothesis 75 percent assumption): pumping 1,000 MWh returns 750 MWh (EST).'],
  ]));

  namaiLangkah(d, '6', 'hidro', [[/PJBL dan pembiayaan/, /pendana|pembiaya|pengembang/], [/Konstruksi/, /EPC|pengembang/], [/Operasi/, /operator|pengembang|IPP/]]);
  ke(d, '6', 'langkah', 'butir', LN([
    ['Pembebasan lahan dan relokasi', 'Land acquisition and resettlement', 'Pembebasan area genangan dan jalur; relokasi warga menjadi risiko jadwal terbesar, dengan standar safeguard internasional (ESMP) bila didanai multilateral.', 'Acquiring inundation and corridor land; resettlement is the largest schedule risk, with international safeguard standards (ESMP) if multilaterally financed.', 'Pengembang, pemda, warga', 'Developer, local government, residents'],
    ['Pembeli dan penyerapan jaringan', 'Offtake and grid absorption', 'PLN sebagai pembeli tunggal; PLTA berwaduk dinilai sebagai peaker, PLTA pompa sebagai penyimpan.', 'PLN as sole buyer; reservoir hydro valued as a peaker and pumped hydro as storage.', 'PLN', 'PLN'],
  ]), ['ed', 'posopeak']);

  ke(d, '11', 'teks', 'paragraf', P([
    [`Kebutuhan pasar RUPTL 2025-2034: ${fmt(rr.mw)} MW hidro dalam ${rr.proyek} proyek, puncak ${rr.tahunPuncak} sebesar ${fmt(rr.mwPuncak)} MW (basis proyek RUPTL, EST).`, `RUPTL 2025-2034 market demand: ${fmtE(rr.mw)} MW of hydro in ${rr.proyek} projects, peaking in ${rr.tahunPuncak} at ${fmtE(rr.mwPuncak)} MW (RUPTL project base, EST).`],
    [`Listrik terjual PLN 2024: ${fmt(pl.gwh)} GWh kepada ${fmt(pl.pelanggan)} pelanggan; hidro menghasilkan ${fmt(k24.pembangkitan_gwh)} GWh, sekitar ${(k24.pembangkitan_gwh / pl.gwh * 100).toFixed(1).replace('.', ',')} persen dari penjualan (EST, perbandingan kasar karena cakupan berbeda).`, `Electricity sold by PLN in 2024: ${fmtE(pl.gwh)} GWh to ${fmtE(pl.pelanggan)} customers; hydro generated ${fmtE(k24.pembangkitan_gwh)} GWh, about ${(k24.pembangkitan_gwh / pl.gwh * 100).toFixed(1)} percent of sales (EST, a rough comparison because coverage differs).`],
    [`Pertumbuhan: kapasitas hidro naik dari ${fmt(k24.kapasitas_mw)} MW (2024) ke ${fmt(k25.kapasitas_mw)} MW (2025), tambahan ${fmt(k25.kapasitas_mw - k24.kapasitas_mw)} MW dalam setahun (IRENA, EST selisih).`, `Growth: hydro capacity rose from ${fmtE(k24.kapasitas_mw)} MW (2024) to ${fmtE(k25.kapasitas_mw)} MW (2025), an addition of ${fmtE(k25.kapasitas_mw - k24.kapasitas_mw)} MW in a year (IRENA, EST difference).`],
    ['Harga: PLTA dibeli dengan harga patokan tertinggi Perpres 112/2022 atau harga kesepakatan; basis tarif lengkap per kapasitas ada di basis keuangan METI dan perlu dibaca dari naskah.', 'Price: hydropower is bought at the Presidential Reg. 112/2022 ceiling price or an agreed price; the full tariff table by capacity is in the METI finance base and should be read from the text.'],
  ]), ['d_rpasok', 'd_stat', 'kap', 'perpres112']);

  ke(d, '17', 'teks', 'paragraf', P([
    ['Turbin ramah ikan dan tangga ikan mengurangi dampak bendungan pada migrasi ikan (penjelasan umum); penerapannya di Indonesia belum terdokumentasi terbuka.', 'Fish-friendly turbines and fish ladders reduce dam impact on fish migration (general explanation); their use in Indonesia is not openly documented.'],
    ['Modernisasi PLTA tua (penggantian runner, generator, dan sistem kontrol) menambah keluaran tanpa bendungan baru; PLTA Saguling dan Cirata menjadi kandidat jenis ini di jaringan Jawa.', 'Modernisation of old plants (replacing runners, generators and controls) adds output without a new dam; the Saguling and Cirata plants are candidates of this kind on the Java grid.'],
    ['Penggerak kecepatan variabel pada PLTA pompa meningkatkan fleksibilitas menyerap surya dan bayu (penjelasan umum).', 'Variable-speed drives in pumped hydro raise the flexibility to absorb solar and wind (general explanation).'],
    ['PLTA di saluran irigasi dan infrastruktur air minum memakai head yang sudah ada tanpa waduk baru; Perpres 112/2022 mengatur penunjukan langsung untuk PLTA pada waduk atau saluran irigasi multiguna milik negara.', 'Hydropower on irrigation canals and water supply infrastructure uses existing head without a new reservoir; Presidential Reg. 112/2022 provides direct appointment for hydropower on state-owned multipurpose reservoirs or canals.'],
    ['Pemantauan sedimentasi dengan survei batimetri dan satelit membantu menjaga umur waduk (penjelasan umum).', 'Sedimentation monitoring with bathymetric and satellite surveys helps keep reservoir life (general explanation).'],
  ]), ['ed', 'perpres112', 'cirata']);

  ke(d, '28', 'teks', 'paragraf', P([
    ['Kompetensi inti PLTA: teknik sipil bendungan, hidrologi, elektromekanik, dan operasi sistem; konstruksi besar mempekerjakan ribuan pekerja sementara dan puluhan orang tetap, sehingga manfaat lapangan kerja jangka panjang kecil dibanding saat konstruksi (hipotesis METI dari pola proyek, belum diukur).', 'Core hydropower skills: dam civil engineering, hydrology, electromechanical work and system operation; large construction employs thousands temporarily and dozens permanently, so long-term job benefits are small relative to construction (METI hypothesis from project patterns, not measured).'],
  ]), ['ed']);

  ke(d, '29', 'teks', 'paragraf', P([
    ['Kontroversi biaya lawan nilai: pendukung menekankan PLTA berumur puluhan tahun dan beban puncak; kritikus menyoroti biaya sipil dan relokasi yang membuat proyek bergeser (Jatigede, Upper Cisokan).', 'Cost versus value controversy: supporters stress decades-long life and peak load; critics highlight civil and resettlement costs that make projects slip (Jatigede, Upper Cisokan).'],
    H('PLTA pompa melawan baterai: baterai makin murah dan cepat dibangun, PLTA pompa lebih tahan lama; pilihan tergantung durasi penyimpanan yang dibutuhkan jaringan, dan datanya belum terbuka.', 'pumped hydro versus batteries: batteries are cheaper and faster to build, pumped hydro lasts longer; the choice depends on the storage duration the grid needs, and the data are not yet open.'),
  ]), ['iea74', 'ed']);

  const p = proyeksi('hidro');
  ke(d, '30', 'tabel', 'baris', [
    { d: T('Hitungan METI 2030 (EST): 2024 + proyek RUPTL ber-COD sampai 2030', 'METI calculation 2030 (EST): 2024 + RUPTL projects reaching COD by 2030'), v: p.mw30, sat: 'MW' },
    { d: T('Hitungan METI 2045 (EST): interpolasi lurus 2034 ke 2060', 'METI calculation 2045 (EST): straight-line 2034 to 2060'), v: p.mw45, sat: 'MW' },
    { d: T('RUKN 2025: PLTA 2060 (hlm 134)', 'RUKN 2025: hydro 2060 (p. 134)'), v: p.mw60, sat: 'MW' },
  ], ['d_target', 'd_rpasok']);

  ke(d, '31', 'teks', 'paragraf', P([
    H('Pemasok dan kontraktor sipil: pekerjaan bendungan dan terowongan berkualifikasi tinggi; peluang ada pada elektromekanik dan modernisasi PLTA tua.', 'suppliers and civil contractors: dam and tunnel work is highly qualified; opportunities lie in electromechanical work and modernising old plants.'),
    H('Pemda dan desa: PLTMH komunitas layak bila ada koperasi pengelola, iuran pemeliharaan, dan suku cadang sebelum serah terima.', 'local governments and villages: community micro-hydro is viable with a managing cooperative, maintenance fees and spare parts before handover.'),
    H('Akademisi: data debit multitahun, model sedimentasi, dan dampak ekologi sungai adalah celah data terbesar.', 'academics: multi-year flow data, sedimentation models and river ecology impacts are the largest data gaps.'),
    H('Pendana: syarat safeguard multilateral menambah waktu tetapi membuka pinjaman jangka panjang bagi megaproyek.', 'financiers: multilateral safeguard requirements add time but open long-term loans for megaprojects.'),
  ]), ['ed']);

  ke(d, '32', 'teks', 'paragraf', P([
    [`Jadwal COD RUPTL 2025-2034: ${rr.per[0]?.proyek ?? 0} proyek hidro (${fmt(rr.per[0]?.mw ?? 0)} MW) pada 2025 dan ${rr.per[1]?.proyek ?? 0} proyek (${fmt(rr.per[1]?.mw ?? 0)} MW) pada 2026; selisih ke realisasi adalah indikator kesehatan pasar.`, `RUPTL 2025-2034 COD schedule: ${rr.per[0]?.proyek ?? 0} hydro projects (${fmtE(rr.per[0]?.mw ?? 0)} MW) in 2025 and ${rr.per[1]?.proyek ?? 0} projects (${fmtE(rr.per[1]?.mw ?? 0)} MW) in 2026; the gap to delivery is a market health indicator.`],
    ['Revisi Perpres 112/2022 dan harga patokan PLTA.', 'The revision of Presidential Reg. 112/2022 and hydropower ceiling prices.'],
    ['RUU Energi Baru dan Energi Terbarukan di Komisi XII DPR RI.', 'The New and Renewable Energy bill in DPR Commission XII.'],
    ['Keputusan lokasi PLTA pompa air laut 1 GW (Puger) dan apakah masuk RUPTL berikutnya.', 'The siting decision on the 1 GW seawater pumped hydro (Puger) and whether it enters the next RUPTL.'],
    ['Evaluasi lingkungan Batang Toru dan perkembangan kasus orangutan Tapanuli.', 'Environmental review of Batang Toru and developments in the Tapanuli orangutan case.'],
    ['Mitra baru dan izin Kayan Cascade (rencana 9.000 MW).', 'New partners and permits for the Kayan Cascade (9,000 MW plan).'],
    ['Daftar PLTMH desa yang diserahterimakan dan statusnya, termasuk hak jawab pihak yang disebut.', 'List of handed-over village micro-hydro plants and their status, including right of reply for named parties.'],
    ['Pembaruan kuota penawaran PLTA oleh Menteri (Perpres 112/2022 Pasal 19).', 'Updates to hydropower offer quotas set by the Minister (Presidential Reg. 112/2022 Article 19).'],
    ['Kemajuan pencairan pinjaman AIIB dan Bank Dunia untuk proyek PLTA.', 'Progress on AIIB and World Bank loan disbursements for hydropower projects.'],
  ]), ['perpres112', 'ruuebet', 'aiib', 'btboc', 'kybn', 'd_rpasok']);
  ambilSumber('aiib');
}
