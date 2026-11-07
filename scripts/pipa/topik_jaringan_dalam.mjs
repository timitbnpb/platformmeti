// Pendalaman naskah Jaringan dan transmisi (8 Nov 2026): menambah bab dari data repo (id organisasi, proyek, regulasi, pendanaan, riset) dan penjelasan baku.
// Dipanggil dari topik_jaringan.mjs; tidak ada angka karangan, tiap angka berasal dari JSON repo atau sumber di SUMBER.
import { T, S, H, hp, pasarListrik, SSTATPLN, faq, glos, rumus, langkah, tabel, kol, kas, baca, tambah, pasang, pemain, proyek, regulasi, skema, risetTabel, linReg, cekId, sumberBaru, pakaiSumber, pangkas, SWB, nilaiProyek, juta, regS, SDIREKTORI } from './topik_enam_lib.mjs';

const WIKI = (j, t) => S(j, 'Wikipedia (ringkasan artikel; bukan sumber primer)', 'https://en.wikipedia.org/wiki/' + t, '2026-11-08', 2026, 'via-pihak-ketiga', 'CC BY-SA 4.0');
const pj = (id) => nilaiProyek(id);
const wb = (id, status) => { const p = pj(id); const v = p.nilai_investasi?.[0]?.nilai; return [p.nama, T('Indonesia', 'Indonesia'), T(v ? `USD ${juta(v)} juta (komitmen Bank Dunia)` : 'komitmen belum tercatat', v ? `USD ${juta(v)} million (World Bank commitment)` : 'commitment not recorded'), T(...status), 'Bank Dunia, via direktori METI', id]; };
const ISO2 = { BRN: 'BN', KHM: 'KH', IDN: 'ID', LAO: 'LA', MYS: 'MY', MMR: 'MM', PHL: 'PH', SGP: 'SG', THA: 'TH', VNM: 'VN' };

export function dalam(d) {
  sumberBaru(d, {
    direktori: SDIREKTORI,
    wbp: SWB,
    statpln: SSTATPLN,
    viking: WIKI('Viking Link: HVDC Inggris-Denmark 1.400 MW, selesai 2023', 'Viking_Link'),
    nordlink: WIKI('NordLink: HVDC Norwegia-Jerman 1.400 MW, 625 km, 500 kV, dibuka Mei 2021', 'NordLink'),
    marinus: WIKI('Marinus Link: HVDC Tasmania-Victoria, diperkecil dari 1.500 MW menjadi 750 MW karena inflasi', 'Marinus_Link'),
    aapl: WIKI('Australia-Asia Power Link (Sun Cable): proyek kabel laut terpanjang yang diusulkan', 'Australia-Asia_Power_Link'),
    pp14: regS('pp-14-2012'), pm13: regS('permen-esdm-13-2025'), pk5: regS('permen-kemenkeu-5-2025'), pm10: regS('permen-esdm-10-2025'), pr77: regS('perpres-77-2008'), pr89: regS('perpres-89-2025'), pr4: regS('perpres-4-2016'), uu30: regS('uu-30-2009'), pr112: regS('perpres-112-2022'),
  });

  /* ---- A. FAQ 8 -> 15 ---- */
  tambah(d, '2', 'butir', faq(['ed', 'pp14', 'pm13'], [
    ['Apa beda SUTT, SUTET, dan SKTT?', 'What is the difference between SUTT, SUTET and SKTT?', 'SUTT adalah saluran udara tegangan tinggi (70 dan 150 kV); SUTET saluran udara tegangan ekstra tinggi (275 dan 500 kV); SKTT saluran kabel tanah tegangan tinggi yang dipakai di kota padat atau lintas laut.', 'SUTT is a high-voltage overhead line (70 and 150 kV); SUTET an extra-high-voltage overhead line (275 and 500 kV); SKTT a high-voltage underground cable used in dense cities or across water.'],
    ['Apa beda RUKN dan RUPTL?', 'What is the difference between RUKN and RUPTL?', 'RUKN adalah rencana umum ketenagalistrikan nasional yang disusun pemerintah; RUPTL adalah rencana usaha penyediaan tenaga listrik milik PLN yang dirinci per sistem dan disahkan Kementerian ESDM.', 'RUKN is the national general electricity plan drawn up by government; RUPTL is PLN\'s electricity supply business plan, itemised per system and approved by the Energy Ministry.'],
    ['Apa itu power wheeling?', 'What is power wheeling?', 'Pemakaian jaringan transmisi milik pihak lain untuk mengantar listrik dari pembangkit ke konsumen tertentu dengan imbalan biaya sewa jaringan. Isu ini diperdebatkan dalam RUU Energi Baru dan Energi Terbarukan (tercatat di basis regulasi repo sebagai rancangan).', 'Using a third party\'s transmission network to deliver power from a plant to a specific consumer for a network fee. The issue is debated in the New and Renewable Energy Bill (recorded in the repo regulation base as a draft).'],
    ['Siapa yang boleh membangun transmisi?', 'Who may build transmission?', 'Usaha penyediaan tenaga listrik diatur UU 30/2009 dan PP 14/2012; dalam praktik transmisi nasional dibangun dan dioperasikan PLN, sedangkan pengembang pembangkit membangun saluran sambung ke gardu terdekat menurut perjanjian jual beli listrik.', 'Electricity supply business is governed by Law 30/2009 and Gov. Reg. 14/2012; in practice national transmission is built and operated by PLN, while plant developers build the connection line to the nearest substation under their power purchase agreement.'],
    ['Siapa yang membiayai transmisi?', 'Who finances transmission?', 'Bank Dunia mencatat pinjaman untuk dua proyek pengembangan transmisi PLN: USD 225 juta (disetujui 2010, ditutup 2019) dan USD 325 juta (disetujui 2013, ditutup 2019). Sumber lain di naskah ini: RUPTL, mitra pembangunan, dan dukungan pemerintah.', 'The World Bank recorded loans for two PLN transmission development projects: USD 225 million (approved 2010, closed 2019) and USD 325 million (approved 2013, closed 2019). Other sources in this text: RUPTL, development partners and government support.'],
    ['Bagaimana pemilik tanah dikompensasi untuk jalur transmisi?', 'How are landowners compensated for transmission corridors?', 'Permen ESDM 13/2025 mengatur ruang bebas jaringan transmisi tenaga listrik dan kompensasi atas tanah, bangunan, dan tanaman di bawahnya (judul regulasi di repo; pasal rinci dibaca langsung dari naskah).', 'Energy Ministry Reg. 13/2025 governs the free space of transmission lines and compensation for land, buildings and plants beneath them (regulation title in the repo; read article detail in the text itself).'],
    ['Apakah Indonesia akan tersambung ke jaringan ASEAN?', 'Will Indonesia connect to the ASEAN grid?', 'Indonesia telah mengesahkan nota kesepahaman ASEAN Power Grid lewat Perpres 77/2008. Proyek Australia-Asia Power Link (Sun Cable) juga diusulkan sebagai kabel laut ekspor listrik, tetapi masih berstatus usulan.', 'Indonesia ratified the ASEAN Power Grid memorandum through Perpres 77/2008. The Australia-Asia Power Link (Sun Cable) is also proposed as a subsea export cable but remains a proposal.'],
  ]).butir);

  /* ---- A. Glosarium 12 -> 30 ---- */
  tambah(d, '3', 'butir', glos(['ed'], [
    ['SUTT', 'SUTT', 'Saluran udara tegangan tinggi 70 kV dan 150 kV.', 'High-voltage overhead line, 70 and 150 kV.'],
    ['SUTET', 'SUTET', 'Saluran udara tegangan ekstra tinggi 275 kV dan 500 kV.', 'Extra-high-voltage overhead line, 275 and 500 kV.'],
    ['SKTT dan SKLT', 'SKTT and SKLT', 'Saluran kabel tanah dan kabel laut tegangan tinggi; dipakai bila saluran udara tidak mungkin.', 'High-voltage underground and subsea cable; used where overhead lines are not possible.'],
    ['Gardu induk', 'Substation', 'Simpul jaringan tempat tegangan diubah dan arus dibagi; kapasitasnya dalam MVA.', 'A grid node where voltage is transformed and flows are split; its capacity is in MVA.'],
    ['GITET', 'GITET', 'Gardu induk tegangan ekstra tinggi (275 dan 500 kV).', 'Extra-high-voltage substation (275 and 500 kV).'],
    ['Ruang bebas', 'Right of way / free space', 'Ruang di bawah dan sekitar saluran yang bebas bangunan dan tanaman tinggi demi keselamatan; dasar kompensasi pemilik lahan.', 'Space below and around a line kept free of buildings and tall plants for safety; basis of landowner compensation.'],
    ['Kriteria N-1', 'N-1 criterion', 'Sistem tetap melayani beban bila satu unsur terbesar (saluran, trafo, pembangkit) lepas; dasar perencanaan keandalan.', 'The system keeps serving load if its largest single element (line, transformer, plant) trips; the basis of reliability planning.'],
    ['Pusat pengatur beban', 'Load dispatch centre', 'Pusat kendali yang menjadwalkan pembangkit dan mengatur aliran daya waktu nyata, memakai SCADA.', 'A control centre that schedules plants and manages real-time flows using SCADA.'],
    ['SCADA', 'SCADA', 'Sistem pemantauan dan kendali jarak jauh atas gardu dan pembangkit.', 'Supervisory control and data acquisition for remote monitoring and control of substations and plants.'],
    ['Aturan jaringan', 'Grid code', 'Aturan teknis sambungan dan operasi pembangkit serta beban ke jaringan, termasuk syarat frekuensi dan tegangan.', 'Technical rules for connecting and operating plants and loads on the grid, including frequency and voltage requirements.'],
    ['Interkoneksi', 'Interconnection', 'Penyambungan dua sistem terpisah agar dapat saling mengirim daya, misalnya Sumatera-Jawa.', 'Joining two separate systems so they can exchange power, for example Sumatra-Java.'],
    ['Power wheeling', 'Power wheeling', 'Penyaluran listrik pihak ketiga lewat jaringan pemilik lain dengan membayar sewa jaringan.', 'Delivery of a third party\'s power over another owner\'s network for a network fee.'],
    ['Frekuensi sistem', 'System frequency', 'Denyut arus bolak-balik, 50 Hz di Indonesia; menyimpang bila pasokan dan beban tidak seimbang.', 'The beat of alternating current, 50 Hz in Indonesia; drifts when supply and load are unbalanced.'],
    ['Inersia sistem', 'System inertia', 'Kemampuan massa putar generator menahan perubahan frekuensi; surya dan angin berbasis inverter tidak menyumbangnya secara bawaan.', 'The ability of rotating generator mass to resist frequency change; inverter-based solar and wind do not provide it by default.'],
    ['Susut jaringan', 'Network losses', 'Selisih energi yang dikirim dan yang terjual akibat panas saluran, trafo, dan pencurian.', 'The gap between energy sent and sold due to line and transformer heat and theft.'],
    ['Microgrid', 'Microgrid', 'Jaringan kecil yang dapat berdiri sendiri, biasanya pembangkit surya, baterai, dan diesel untuk pulau atau kawasan.', 'A small grid that can stand alone, usually solar, battery and diesel for an island or estate.'],
    ['Sistem terisolasi', 'Isolated system', 'Jaringan kecil tak tersambung ke sistem besar, umum di pulau kecil; biaya pokoknya tinggi.', 'A small grid not connected to a large system, common on small islands; its cost of supply is high.'],
    ['Black start', 'Black start', 'Menghidupkan kembali sistem dari padam total memakai pembangkit yang bisa start tanpa pasokan luar.', 'Restarting a system from total blackout using plants that can start without external supply.'],
  ]).butir);

  /* ---- B. Apa-kenapa 3 -> 5 paragraf ---- */
  tambah(d, '4', 'paragraf', [
    T('Jaringan listrik terdiri atas tiga lapis: transmisi (tegangan tinggi, memindahkan daya besar antarwilayah), distribusi (tegangan menengah dan rendah, menuju pelanggan), dan sistem pengendali yang menjaga pasokan dan beban seimbang tiap detik. Karena listrik tidak bisa disimpan murah dalam skala besar, kapasitas jaringan menentukan seberapa banyak pembangkit bisa dipakai.', 'An electricity grid has three layers: transmission (high voltage, moving large power between regions), distribution (medium and low voltage, to customers) and the control system that balances supply and load every second. Because electricity cannot be stored cheaply at scale, grid capacity determines how much generation can be used.'),
    T('Surya dan angin berbeda dari PLTU: keluarannya berubah menurut cuaca dan memakai inverter, sehingga jaringan perlu cadangan, baterai, prakiraan cuaca, dan aturan jaringan yang menuntut inverter ikut menjaga frekuensi dan tegangan. Itu sebabnya dokumen perencanaan menyandingkan pembangkit terbarukan dengan transmisi, gardu, dan penyimpanan, bukan pembangkit saja.', 'Solar and wind differ from coal plants: their output varies with weather and uses inverters, so the grid needs reserves, batteries, weather forecasts and grid-code rules that make inverters help hold frequency and voltage. That is why planning documents pair renewable plants with transmission, substations and storage, not generation alone.'),
  ]);

  /* ---- B. Rumus 3 -> 6 ---- */
  d.bab['5'].rumus.push(
    T('Susut jaringan (persen) = (Energi dikirim - Energi terjual) / Energi dikirim x 100', 'Network loss (percent) = (Energy sent - Energy sold) / Energy sent x 100'),
    T('Daya tiga fasa (MW) = akar 3 x Tegangan (kV) x Arus (kA) x Faktor daya', 'Three-phase power (MW) = square root of 3 x Voltage (kV) x Current (kA) x Power factor'),
    T('Faktor pemanfaatan saluran (persen) = Aliran daya puncak / Kapasitas termal saluran x 100', 'Line utilisation factor (percent) = Peak power flow / Thermal capacity of the line x 100'),
  );
  d.bab['5'].contoh.push(
    T('Contoh daya (angka ilustrasi, bukan data PLN): saluran 500 kV dengan arus 1 kA dan faktor daya 0,95 menyalurkan 1,732 x 500 x 1 x 0,95 = sekitar 823 MW (EST).', 'Power example (illustrative figures, not PLN data): a 500 kV line carrying 1 kA at a power factor of 0.95 delivers 1.732 x 500 x 1 x 0.95 = about 823 MW (EST).'),
    T('Contoh susut (angka ilustrasi): bila 100 GWh dikirim dan 92 GWh terjual, susut = (100 - 92) / 100 x 100 = 8 persen (EST). Selisih ini mencakup rugi teknis dan nonteknis; data susut resmi per sistem ada di statistik PLN.', 'Loss example (illustrative figures): if 100 GWh is sent and 92 GWh sold, loss = (100 - 92) / 100 x 100 = 8 percent (EST). The gap covers technical and non-technical losses; official loss data per system is in the PLN statistics.'),
  );
  pakaiSumber(d, '5', 'ed');

  /* ---- B. Rantai nilai 5 -> 8 tahap dengan pemain bernama ---- */
  pasang(d, '6', langkah(['ed', 'esdm47', 'bungo17', 'wbp'], [
    ['Perencanaan', 'Planning', 'RUKN (pemerintah) dan RUPTL (PLN) menetapkan kebutuhan saluran dan gardu per sistem; Kementerian ESDM mengesahkan RUPTL (Kepmen 188.K/2025).', 'RUKN (government) and RUPTL (PLN) set line and substation needs per system; the Energy Ministry approves RUPTL (Decree 188.K/2025).', 'PLN, Kementerian ESDM, Dewan Energi Nasional', 'PLN, Energy Ministry, National Energy Council'],
    ['Pendanaan', 'Financing', 'Anggaran PLN, penugasan pemerintah, dan pinjaman pembangunan; Bank Dunia mencatat dua pinjaman transmisi PLN (2010 dan 2013).', 'PLN budget, government assignment and development loans; the World Bank recorded two PLN transmission loans (2010 and 2013).', 'PLN, Kementerian Keuangan, Bank Dunia, ADB, JICA, KfW', 'PLN, Finance Ministry, World Bank, ADB, JICA, KfW'],
    ['Rekayasa dan studi', 'Engineering and studies', 'Studi aliran daya, desain jalur, dan dokumen lelang.', 'Load-flow studies, route design and tender documents.', 'PLN Enjiniring, konsultan', 'PLN Enjiniring, consultants'],
    ['Pengadaan', 'Procurement', 'Lelang transmisi dan gardu per paket; peta jalan lelang 2025-2031 ada di bab Pasar dalam negeri.', 'Tendering of lines and substations by package; the 2025-2031 tender roadmap is in the domestic market chapter.', 'PLN, kontraktor EPC', 'PLN, EPC contractors'],
    ['Pemasok peralatan', 'Equipment supply', 'Trafo daya, konduktor, menara, kabel, relai proteksi, dan konverter HVDC.', 'Power transformers, conductors, towers, cables, protection relays and HVDC converters.', 'Hitachi Energy, Siemens Energy, ABB, Siemens, pabrikan menara dan kabel lokal', 'Hitachi Energy, Siemens Energy, ABB, Siemens, local tower and cable makers'],
    ['Lahan dan jalur', 'Land and right of way', 'Pembebasan tapak menara dan koridor; kendala ini tercatat pada proyek Lahat-Muara Bungo dan menjadi risiko utama proyek 275 kV Aceh-Sumatera Utara.', 'Tower site and corridor acquisition; this obstacle was recorded on the Lahat-Muara Bungo project and is a main risk for the Aceh-North Sumatra 275 kV project.', 'PLN, pemda, pemilik lahan', 'PLN, local governments, landowners'],
    ['Konstruksi dan energize', 'Construction and energisation', 'Menara, kawat, gardu induk, lalu pemberian tegangan dan uji.', 'Towers, conductors, substations, then energisation and testing.', 'Kontraktor, PLN Unit Induk Pembangunan', 'Contractors, PLN construction units'],
    ['Operasi dan pemeliharaan', 'Operation and maintenance', 'Penyaluran beban, penjadwalan pembangkit sesuai kapasitas saluran (termasuk keputusan kurtailmen), pemeliharaan, dan digitalisasi (komunikasi serat optik, SCADA).', 'Load dispatch, plant scheduling within line capacity (including curtailment decisions), maintenance and digitalisation (fibre communications, SCADA).', 'Pusat pengatur beban PLN, PLN Icon Plus', 'PLN load dispatch centres, PLN Icon Plus'],
  ]));

  /* ---- C. Sebaran: seluruh 16 sistem RUPTL ---- */
  const tr = baca('public/data/transisi.json'); const sis = Object.fromEntries(tr.sistem.map((s) => [s.id, s]));
  const NMX = { ambon: 'Ambon', halmahera: 'Halmahera', merauke: 'Merauke', nabire: 'Nabire', wamena: 'Wamena', manokwari: 'Manokwari' };
  for (const [id, nm] of Object.entries(NMX)) { const s = sis[id]; if (!s) throw new Error('sistem ' + id); d.bab['8'].baris.push({ sistem: T(nm, nm), b25: s.beban_puncak_neto_mw[0], b34: s.beban_puncak_neto_mw.at(-1), rm: s.reserve_margin_persen[0], e25: s.bauran_ebt_persen[0], e34: s.bauran_ebt_persen.at(-1) }); }
  d.bab['8'].catatan = T('Seluruh 16 sistem dalam RUPTL 2025-2034 (skenario RE Base), diolah dari public/data/transisi.json.', 'All 16 systems in RUPTL 2025-2034 (RE Base scenario), processed from public/data/transisi.json.');

  tambah(d, '11', 'paragraf', pasarListrik()); pakaiSumber(d, '11', 'statpln');

  /* ---- C. Pemain (id organisasi) ---- */
  pemain(d, [
    ['Hitachi Energy', ['Pemasok trafo dan konverter HVDC; tercatat di direktori METI berkepakaran jaringan', 'Supplier of transformers and HVDC converters; listed in the METI directory with grid expertise'], 'Direktori METI'],
    ['Siemens Energy', ['Pemasok peralatan transmisi dan gardu; tercatat berkepakaran jaringan dan gas', 'Supplier of transmission and substation equipment; listed with grid and gas expertise'], 'Direktori METI'],
    ['ABB', ['Pemasok otomasi dan peralatan jaringan; tercatat berkepakaran jaringan', 'Supplier of automation and grid equipment; listed with grid expertise'], 'Direktori METI'],
    ['PT PLN Icon Plus', ['Anak usaha PLN berkepakaran jaringan dan efisiensi; menyediakan komunikasi dan layanan digital', 'PLN subsidiary with grid and efficiency expertise; provides communications and digital services'], 'Direktori METI'],
    ['PT PLN Indonesia Power', ['Anak usaha PLN; pembangkit yang menyambung ke transmisi dan penerima kurtailmen', 'PLN subsidiary; plants that connect to transmission and bear curtailment'], 'Direktori METI'],
    ['PT PLN Nusantara Power', ['Anak usaha PLN; operator pembangkit yang menyambung ke transmisi', 'PLN subsidiary; operator of plants that connect to transmission'], 'Direktori METI'],
    ['Kementerian Keuangan', ['Mitra penjaminan pemerintah dan penyedia dukungan fiskal proyek ketenagalistrikan (Permen Kemenkeu 5/2025)', 'Partner for government guarantees and fiscal support to power projects (Finance Ministry Reg. 5/2025)'], 'Regulasi repo'],
    ['Badan Pengelola Investasi Daya Anagata Nusantara', ['Pengelola investasi negara; calon pendana infrastruktur energi', 'State investment manager; potential funder of energy infrastructure'], 'Direktori METI'],
    ['Asian Development Bank', ['Pemberi pinjaman pembangunan untuk energi; skema ada di bab Pembiayaan', 'Development lender for energy; scheme in the Financing chapter'], 'Direktori METI'],
    ['World Bank', ['Pemberi pinjaman dua proyek transmisi PLN (USD 225 juta dan USD 325 juta)', 'Lender for two PLN transmission projects (USD 225 million and USD 325 million)'], 'Bank Dunia, via direktori METI'],
    ['Japan International Cooperation Agency', ['Pemberi pinjaman ODA; skema JICA ada di bab Pembiayaan', 'ODA lender; the JICA scheme is in the Financing chapter'], 'Direktori METI'],
    ['Dewan Energi Nasional', ['Menetapkan kebijakan dan rencana energi nasional (RUEN, KEN); anggota menurut Perpres 26/2008', 'Sets national energy policy and plans (RUEN, KEN); members per Perpres 26/2008'], 'Regulasi repo'],
    ['Direktorat Jenderal Ketenagalistrikan, Kementerian ESDM', ['Pembina teknis ketenagalistrikan dan penerbit Statistik Ketenagalistrikan', 'Technical regulator of electricity and publisher of the Electricity Statistics'], 'Statistik Ketenagalistrikan 2024'],
    ['KfW Development Bank', ['Pemberi pinjaman jaringan dan efisiensi; skema ada di bab Pembiayaan', 'Lender for grids and efficiency; scheme in the Financing chapter'], 'Direktori METI (skema)'],
    ['Asian Infrastructure Investment Bank', ['Pemberi pinjaman infrastruktur energi termasuk distribusi PLN', 'Infrastructure lender including PLN distribution'], 'Direktori METI (skema)'],
    ['ASEAN Centre for Energy', ['Sekretariat teknis ASEAN Power Grid (memorandum disahkan Perpres 77/2008)', 'Technical secretariat of the ASEAN Power Grid (memorandum ratified by Perpres 77/2008)'], 'Regulasi repo'],
    ['Vietnam Electricity (EVN)', ['Pembanding luar negeri: operator utama jaringan Vietnam', 'Foreign comparison: main grid operator of Vietnam'], 'Sumber bab Pembanding'],
    ['Institute for Essential Services Reform', ['Lembaga kajian; Indonesia Energy Transition Outlook memuat kajian jaringan dan EBT variabel', 'Think tank; the Indonesia Energy Transition Outlook covers grids and variable renewables'], 'IESR, IETO 2025'],
  ], 'jaringan', 50);
  d.bab['9'].sumber.push('ieto', 'statpln', 'wbp', 'pk5', 'pr77');

  /* ---- C. Proyek: Bank Dunia + RUPTL yang tercatat ---- */
  proyek(d, { nama: 'nama', wilayah: 'wilayah', ukuran: 'ukuran', status: 'status' }, [
    wb('wb_P117323', ['Ditutup 2019 (disetujui 2010)', 'Closed 2019 (approved 2010)']),
    wb('wb_P123994', ['Ditutup 2019 (disetujui 2013)', 'Closed 2019 (approved 2013)']),
    wb('wb_P004021', ['Ditutup 2003 (disetujui 1996)', 'Closed 2003 (approved 1996)']),
    wb('wb_P003975', ['Ditutup 1997 (disetujui 1991)', 'Closed 1997 (approved 1991)']),
    wb('wb_P003920', ['Ditutup 1995 (disetujui 1989)', 'Closed 1995 (approved 1989)']),
    wb('wb_P178788', ['Dalam pipeline Bank Dunia', 'In the World Bank pipeline']),
    wb('wb_P149389', ['Dalam pipeline; peningkatan kapasitas investasi smart grid transmisi dan distribusi', 'In the pipeline; capacity building for transmission and distribution smart grid investment']),
    wb('wb_P063913', ['Ditutup; restrukturisasi sektor listrik Jawa-Bali', 'Closed; Java-Bali power sector restructuring']),
    wb('wb_P040524', ['Ditutup; distribusi listrik Jawa', 'Closed; Java power distribution']),
    wb('wb_P501217', ['Dalam pipeline; elektrifikasi biaya terendah (nilai pada JSON repo tidak dikutip karena tampak keliru)', 'In the pipeline; least-cost electrification (the repo JSON value is not quoted as it looks wrong)']),
  ].map((r) => (r[2].id.includes('USD 90000') ? [r[0], r[1], T('nilai tidak dikutip', 'value not quoted'), r[3], r[4], r[5]] : r)));
  d.bab['10'].sumber.push('wbp', 'direktori');

  /* ---- D. Regulasi: tambah dengan id ---- */
  regulasi(d, {
    'permen-esdm-13-2025': ['Ruang bebas jaringan transmisi dan kompensasi atas tanah, bangunan, dan tanaman.', 'Free space of transmission lines and compensation for land, buildings and plants.'],
    'permen-esdm-10-2025': ['Peta jalan transisi energi sektor ketenagalistrikan.', 'Road map of the energy transition in the electricity sector.'],
    'permen-kemenkeu-5-2025': ['Penjaminan pemerintah dan penanggungan risiko untuk proyek ketenagalistrikan dan energi baru.', 'Government guarantees and risk coverage for electricity and new-energy projects.'],
    'permen-esdm-11-2021': ['Pelaksanaan usaha ketenagalistrikan: izin dan tata cara.', 'Conduct of the electricity business: licences and procedures.'],
    'permen-esdm-5-2025': ['Pedoman perjanjian jual beli listrik dari pembangkit yang memanfaatkan energi terbarukan (acuan syarat sambungan).', 'Guideline for power purchase agreements from renewable plants (reference for connection terms).'],
    'permen-esdm-2-2025': ['Perubahan kedua atas Permen ESDM 27/2017 (tingkat mutu pelayanan dan biaya terkait).', 'Second amendment of Energy Ministry Reg. 27/2017 (service quality and related costs).'],
    'perpres-77-2008': ['Pengesahan MoU ASEAN Power Grid.', 'Ratification of the ASEAN Power Grid memorandum.'],
    'perpres-5-2006': ['Kebijakan Energi Nasional terdahulu (kini digantikan PP 40/2025).', 'The former National Energy Policy (now replaced by PP 40/2025).'],
  });
  pakaiSumber(d, '12', 'pm13', 'pm10', 'pk5');

  /* ---- D. Linimasa 9 -> 15+ (tanggal dan url dari JSON regulasi repo) ---- */
  tambah(d, '13', 'butir', [
    linReg('uu-30-2009', 'UU 30/2009 tentang Ketenagalistrikan ditetapkan', 'Law 30/2009 on Electricity enacted'),
    linReg('pp-14-2012', 'PP 14/2012 tentang kegiatan usaha penyediaan tenaga listrik', 'Gov. Reg. 14/2012 on electricity supply business activities'),
    linReg('perpres-77-2008', 'Perpres 77/2008 mengesahkan MoU ASEAN Power Grid', 'Perpres 77/2008 ratifies the ASEAN Power Grid memorandum'),
    linReg('perpres-112-2022', 'Perpres 112/2022 mempercepat energi terbarukan untuk tenaga listrik', 'Perpres 112/2022 accelerates renewable power'),
    linReg('permen-esdm-10-2025', 'Permen ESDM 10/2025 peta jalan transisi energi sektor ketenagalistrikan', 'Energy Ministry Reg. 10/2025 road map of the electricity-sector transition'),
    linReg('permen-esdm-13-2025', 'Permen ESDM 13/2025 ruang bebas transmisi dan kompensasi', 'Energy Ministry Reg. 13/2025 on transmission free space and compensation'),
    linReg('permen-kemenkeu-5-2025', 'Permen Kemenkeu 5/2025 penjaminan pemerintah dan penanggungan risiko', 'Finance Ministry Reg. 5/2025 on government guarantees and risk coverage'),
  ].map(([tg, a, b, url]) => ({ tanggal: tg, judul: T(a, b), ...(url ? { url } : {}) })).concat([
    { tanggal: '2010-07-08', judul: T('Bank Dunia menyetujui pinjaman USD 225 juta untuk pengembangan transmisi PLN', 'World Bank approves a USD 225 million loan for PLN transmission development') },
    { tanggal: '2013-07-08', judul: T('Bank Dunia menyetujui pinjaman USD 325 juta untuk proyek transmisi kedua', 'World Bank approves a USD 325 million loan for the second transmission project') },
  ]).sort((a, b) => a.tanggal.localeCompare(b.tanggal)).map((x) => x));
  d.bab['13'].butir.sort((a, b) => a.tanggal.localeCompare(b.tanggal));
  d.bab['13'].sumber.push('wbp', 'pm13', 'pm10', 'pk5', 'pr77', 'pr112', 'pp14', 'uu30');

  /* ---- D. Kewajiban dan insentif: 2 -> 8 butir ---- */
  tambah(d, '14', 'paragraf', [
    T('Kewajiban 1, perencanaan: PLN menyusun RUPTL yang disahkan Menteri ESDM; proyek transmisi yang tidak tercantum sulit dilelang atau ditugaskan (Kepmen 188.K/2025).', 'Duty 1, planning: PLN drafts RUPTL, approved by the Energy Minister; transmission projects not listed are hard to tender or assign (Decree 188.K/2025).'),
    T('Kewajiban 2, ruang bebas: pemilik jaringan menjaga ruang bebas dan mengompensasi tanah, bangunan, dan tanaman yang terdampak menurut Permen ESDM 13/2025 (judul regulasi; baca pasalnya pada tautan di bab Kerangka hukum).', 'Duty 2, free space: the network owner keeps the free space clear and compensates affected land, buildings and plants under Energy Ministry Reg. 13/2025 (regulation title; read the articles via the link in the Legal framework chapter).'),
    T('Kewajiban 3, perizinan usaha: kegiatan usaha penyediaan tenaga listrik mensyaratkan izin sesuai PP 14/2012 dan Permen ESDM 11/2021 (judul regulasi).', 'Duty 3, business licence: electricity supply activity requires a licence under Gov. Reg. 14/2012 and Energy Ministry Reg. 11/2021 (regulation titles).'),
    T('Insentif 1, penjaminan pemerintah: Permen Kemenkeu 5/2025 mengatur pemberian penjaminan pemerintah dan penanggungan risiko untuk proyek ketenagalistrikan dan energi baru (judul regulasi).', 'Incentive 1, government guarantee: Finance Ministry Reg. 5/2025 governs government guarantees and risk coverage for electricity and new-energy projects (regulation title).'),
    T('Insentif 2, fiskal umum: skema bea masuk barang modal pembangkitan dan tax holiday ada di direktori pendanaan (lihat bab Pembiayaan); tidak ada insentif fiskal khusus transmisi di sumber yang dibaca.', 'Incentive 2, general fiscal: the capital goods duty exemption for power generation and the tax holiday are in the funding directory (see the Financing chapter); no transmission-specific fiscal incentive was found in the sources read.'),
    T('Sanksi dan pengawasan: Kementerian ESDM membina dan mengawasi usaha ketenagalistrikan (UU 30/2009); rincian sanksi administratif dibaca langsung pada peraturan turunan.', 'Sanctions and supervision: the Energy Ministry guides and supervises the electricity business (Law 30/2009); read the administrative sanctions detail in the implementing rules.'),
  ]);
  pakaiSumber(d, '14', 'pm13', 'pk5', 'pp14', 'uu30');

  /* ---- D. Perizinan: langkah bernomor ---- */
  pasang(d, '15', langkah(['ed', 'jp26', 'pp14', 'pm13'], [
    ['1. Masuk RUPTL', '1. Be in RUPTL', 'Proyek saluran atau gardu harus tercantum di RUPTL yang berlaku agar bisa dilelang atau ditugaskan.', 'A line or substation must be listed in the applicable RUPTL to be tendered or assigned.', 'PLN, Kementerian ESDM', 'PLN, Energy Ministry'],
    ['2. Studi kelayakan dan penetapan jalur', '2. Feasibility study and route fixing', 'Studi aliran daya dan survei rute; penetapan lokasi tapak dan gardu.', 'Load-flow studies and route survey; fixing tower and substation sites.', 'PLN Enjiniring, PLN', 'PLN Enjiniring, PLN'],
    ['3. Persetujuan lingkungan dan tapak', '3. Environmental approval and site', 'Mengurus persetujuan lingkungan dan lokasi tapak menara; PLN mengurus izin tapak menara di Sumatera Utara untuk jalur 275 kV (Jakarta Post, 2026).', 'Secure environmental approval and tower site permits; PLN is seeking tower site approvals in North Sumatra for the 275 kV line (Jakarta Post, 2026).', 'PLN, pemda', 'PLN, local governments'],
    ['4. Pembebasan lahan dan kompensasi', '4. Land acquisition and compensation', 'Pembebasan tapak dan kompensasi ruang bebas (Permen ESDM 13/2025); sekitar 26 persen koridor Aceh-Sumut melewati kawasan permukiman dan perkotaan.', 'Site acquisition and right-of-way compensation (Energy Ministry Reg. 13/2025); about 26 percent of the Aceh-North Sumatra corridor passes residential and urban areas.', 'PLN, pemilik lahan, pemda', 'PLN, landowners, local governments'],
    ['5. Pengadaan dan kontrak', '5. Procurement and contract', 'Lelang paket transmisi atau penugasan; penandatanganan kontrak EPC.', 'Tender of transmission packages or assignment; signing the EPC contract.', 'PLN, kontraktor', 'PLN, contractors'],
    ['6. Konstruksi', '6. Construction', 'Pondasi dan menara, penarikan kawat, gardu; keterlambatan lahan paling sering menggeser jadwal.', 'Foundations and towers, conductor stringing, substations; land delays most often shift the schedule.', 'Kontraktor, PLN', 'Contractors, PLN'],
    ['7. Uji, energize, dan sertifikat laik operasi', '7. Testing, energisation and operation certificate', 'Uji komisioning, pemberian tegangan, dan sertifikat laik operasi sebelum instalasi dioperasikan (PP 14/2012; rincian pada peraturan turunan).', 'Commissioning tests, energisation and an operation-worthiness certificate before the installation operates (Gov. Reg. 14/2012; detail in implementing rules).', 'PLN, Kementerian ESDM', 'PLN, Energy Ministry'],
    ['8. Serah terima ke operasi', '8. Handover to operations', 'Aset diserahkan ke unit operasi dan pusat pengatur beban; mulai masuk perhitungan kapasitas serap.', 'The asset is handed to the operating unit and the dispatch centre; it begins to count in absorption capacity.', 'PLN', 'PLN'],
  ]));
  d.bab['15'].catatan = T('Lama dan biaya tiap langkah tidak ditemukan di sumber yang dibaca; sengaja tidak diisi. Urutan adalah ringkasan editorial METI yang harus dicek pada peraturan turunan.', 'The duration and cost of each step were not found in the sources read and are deliberately blank. The order is a METI editorial summary to be checked against implementing rules.');

  /* ---- E. Teknologi terbaru: 3 -> 8 butir ---- */
  tambah(d, '17', 'paragraf', [
    T('Inverter pembentuk jaringan (grid-forming) pada baterai dan pembangkit surya dapat menyumbang pengaturan tegangan dan frekuensi yang selama ini hanya dari generator putar; teknologi ini dipakai untuk sistem dengan porsi surya dan angin tinggi (ringkasan editorial METI, tanpa angka biaya).', 'Grid-forming inverters on batteries and solar plants can contribute the voltage and frequency control that only rotating generators gave; the technology is used in systems with high solar and wind shares (METI editorial summary, no cost figure).'),
    T('Pemeringkatan saluran dinamis (dynamic line rating) memakai sensor suhu dan angin untuk memakai kapasitas termal saluran sesuai cuaca, sehingga menambah daya angkut tanpa menara baru.', 'Dynamic line rating uses temperature and wind sensors to apply a line\'s thermal capacity according to weather, adding carrying capacity without new towers.'),
    T('Konduktor lanjutan (HTLS) membawa arus lebih besar pada menara yang sama; peralatan FACTS (STATCOM, kompensator seri) mengatur aliran dan tegangan; gardu digital (IEC 61850) menggantikan kabel tembaga dengan serat optik.', 'Advanced conductors (HTLS) carry more current on the same towers; FACTS devices (STATCOM, series compensators) control flows and voltage; digital substations (IEC 61850) replace copper wiring with optical fibre.'),
    T('HVDC dengan konverter sumber tegangan (VSC) memungkinkan sambungan kabel laut dan pengendalian daya aktif dan reaktif mandiri; Viking Link (1.400 MW, selesai 2023) dan NordLink (1.400 MW, 625 km, 500 kV, dibuka Mei 2021) adalah contoh kabel laut HVDC yang beroperasi.', 'Voltage-source converter (VSC) HVDC enables subsea links and independent control of active and reactive power; Viking Link (1,400 MW, completed 2023) and NordLink (1,400 MW, 625 km, 500 kV, opened May 2021) are operating subsea HVDC examples.'),
    T('Prakiraan produksi surya dan angin berbasis data cuaca dan kecerdasan buatan membantu pusat pengatur beban menjadwalkan cadangan; tingkat kematangan (TRL) tiap teknologi tidak dikutip karena tidak ada sumber tunggal yang dibaca.', 'Solar and wind forecasting from weather data and artificial intelligence helps dispatch centres schedule reserves; the TRL of each technology is not quoted as no single source was read.'),
  ]);
  pakaiSumber(d, '17', 'ed', 'viking', 'nordlink');

  /* ---- E. Inovasi dan riset: tabel dengan id riset ---- */
  const riset = risetTabel('jaringan', /grid|transmi|microgrid|power system|inverter|battery energy|lightning|distribut/i, 8, ['Daftar riset diambil dari irisan OpenAlex di repo (sitasi terbanyak yang berkaitan dengan jaringan). Paten dan startup jaringan tidak ditemukan di sumber yang dibaca.', 'Research list taken from the OpenAlex slice in the repo (most-cited grid-related works). Grid patents and start-ups were not found in the sources read.']);
  riset.baris.unshift(
    { judul: 'Smart microgrid Nusa Penida (PLTS dan baterai terintegrasi)', penulis: 'PLN', jurnal: 'JPNN Bali, 21 Sep 2026', sitasi: 0 },
    { judul: 'Smart grid Jawa-Bali dan desain Sumatera', penulis: 'PLN Enjiniring', jurnal: 'Katadata, 30 Okt 2026', sitasi: 0 },
  );
  riset.sumber = ['npenida', 'katadata100', 'direktori'];
  pasang(d, '18', riset);

  /* ---- F. Pembanding: bab 20 tambah 2 baris luar negeri; bab 22 jadi 10 negara ASEAN ber-iso2 ---- */
  d.bab['20'].baris.push(
    { negara: 'Inggris-Denmark: Viking Link', tipe: 'HVDC kabel laut', ukuran: T('1.400 MW', '1,400 MW'), status: T('Selesai 2023', 'Completed 2023'), isu: T('Interkonektor terpanjang daratan dan laut di dunia per 2024 (Wikipedia)', 'The longest land and subsea interconnector in the world as of 2024 (Wikipedia)') },
    { negara: 'Norwegia-Jerman: NordLink', tipe: 'HVDC 500 kV', ukuran: T('1.400 MW; 625 km', '1,400 MW; 625 km'), status: T('Dibuka Mei 2021', 'Opened May 2021'), isu: T('Menukar PLTA Norwegia dengan angin dan surya Jerman (EST dari deskripsi)', 'Swaps Norwegian hydro for German wind and solar (EST from the description)') },
  );
  pakaiSumber(d, '20', 'viking', 'nordlink');
  const ase = baca('public/data/asean_energi.json'); const vr = (b) => Math.round(((b.bauran_listrik_persen.surya?.nilai || 0) + (b.bauran_listrik_persen.angin?.nilai || 0)) * 100) / 100;
  d.bab['22'].kolom.splice(1, 0, kol('iso2', 'ISO2', 'ISO2'));
  d.bab['22'].baris = ase.baris.map((b) => ({ negara: b.nama, iso2: ISO2[b.iso3] || b.iso3, vre: vr(b), ebt: b.bauran_listrik_persen.ebt_total.nilai, tahun: String(b.bauran_listrik_persen.surya.tahun) }));
  d.bab['22'].per = 10;

  /* ---- G. Pembiayaan: 8 skema (id pendanaan); tabel investasi RUPTL lama pindah ke bab 26 ---- */
  const investasiLama = d.bab['24'];
  pasang(d, '24', skema([
    ['sk_greenbook', ['Pinjaman luar negeri pemerintah untuk jaringan, hidro, dan panas bumi lewat daftar Green Book Bappenas.', 'Government foreign loans for grids, hydro and geothermal via the Bappenas Green Book list.']],
    ['sk_jica', ['Pinjaman ODA Jepang; berkepakaran panas bumi, jaringan, dan hidro.', 'Japanese ODA loans; geothermal, grid and hydro expertise.']],
    ['sk_aiib', ['Bank pembangunan multilateral untuk infrastruktur energi; AIIB sudah membiayai penguatan distribusi PLN Jawa Timur-Bali dan Sumatera.', 'Multilateral development bank for energy infrastructure; AIIB has financed PLN distribution strengthening in East Java-Bali and Sumatra.']],
    ['sk_kfw', ['Kerja sama keuangan Jerman untuk jaringan, efisiensi, dan bayu.', 'German financial cooperation for grids, efficiency and wind.']],
    ['sk_acgf', ['Fasilitas ADB untuk surya, hidro, dan jaringan lewat pembiayaan campuran.', 'ADB facility for solar, hydro and grids through blended finance.']],
    ['sk_adb_etm', ['Mekanisme transisi energi ADB untuk surya dan jaringan.', 'ADB energy transition mechanism for solar and grids.']],
    ['sk_jetp', ['Kemitraan transisi energi berkeadilan; fokus jaringan masuk dalam prioritas investasi CIPP.', 'Just energy transition partnership; the grid is part of the CIPP investment priorities.']],
    ['sk_ins_bea_masuk_pembangkit', ['Pembebasan bea masuk barang modal pembangkitan listrik (insentif fiskal, tidak khusus transmisi).', 'Import duty exemption on capital goods for power generation (a fiscal incentive, not transmission-specific).']],
  ], ['Skema diambil dari public/data/pendanaan.json; tingkat bukti tiap skema tertera di kolomnya. Persyaratan harus dibaca langsung pada laman pemberi.', 'Schemes are taken from public/data/pendanaan.json; each scheme\'s evidence level is in its column. Read the conditions directly on the provider\'s page.']));

  /* ---- G. Investasi dan transaksi: 10 butir ---- */
  const lamaBaris = investasiLama.baris.map((r) => ({ pos: r.pos, nilai: r.rp, sat: T('Rp triliun', 'IDR trillion'), sumber: 'RUPTL via ESDM dan CNBC' }));
  const pinj = ['wb_P117323', 'wb_P123994', 'wb_P004021', 'wb_P003975', 'wb_P178788'].map((id) => { const p = pj(id); return { pos: T(p.nama, p.nama), nilai: p.nilai_investasi[0].nilai / 1e6, sat: T('USD juta (komitmen)', 'USD million (commitment)'), sumber: 'Bank Dunia, via direktori METI', id, url: '/p/' + id }; });
  pasang(d, '26', { tipe: 'tabel', per: 10, sumber: ['cnbc30', 'esdm47', 'wbp', 'sl_bt', 'direktori'], kolom: [kol('pos', 'Investasi atau pinjaman', 'Investment or loan', { url: 'url' }), kol('nilai', 'Nilai', 'Value', { num: true, d: 1 }), kol('sat', 'Satuan', 'Unit'), kol('sumber', 'Dasar', 'Basis')],
    baris: [...lamaBaris, ...pinj, { pos: T('Taksiran Menteri untuk transmisi dan gardu saja', 'Minister\'s estimate for transmission and substations only'), nilai: '400 sampai 500', sat: T('Rp triliun', 'IDR trillion'), sumber: 'ESDM, 30 Mei 2025' }, { pos: T('SuedLink, Jerman (pembanding)', 'SuedLink, Germany (comparison)'), nilai: '10.000', sat: T('EUR juta (menurut pengembang)', 'EUR million (per developers)'), sumber: 'Drucksache 21/2519' }],
    catatan: T('Komitmen Bank Dunia adalah angka komitmen, bukan pencairan. Transaksi merger, akuisisi, atau IPO khusus transmisi tidak ditemukan di sumber yang dibaca.', 'World Bank figures are commitments, not disbursements. No merger, acquisition or IPO specific to transmission was found in the sources read.') });

  /* ---- H. Dampak, tenaga kerja, kontroversi ---- */
  tambah(d, '27', 'paragraf', [
    T('Manfaat: jaringan yang kuat menurunkan risiko padam luas dan memungkinkan pembangkit murah di satu wilayah melayani beban di wilayah lain; Tol Listrik Sumatera dilaporkan menghemat Rp163 miliar per bulan (Bisnis, 2020).', 'Benefits: a strong grid lowers the risk of wide outages and lets cheap plants in one region serve load in another; the Sumatra Electricity Toll Road reportedly saves IDR 163 billion per month (Bisnis, 2020).'),
    T('Risiko dan hak masyarakat: pemilik tanah di bawah jalur berhak atas kompensasi menurut Permen ESDM 13/2025; keselamatan ruang bebas dan keterlibatan warga sejak penetapan jalur menjadi kunci. Studi dampak lingkungan dan sosial per proyek dibaca di dokumen lingkungan proyek masing-masing.', 'Risks and community rights: landowners beneath lines are entitled to compensation under Energy Ministry Reg. 13/2025; free-space safety and resident involvement from route fixing are key. Environmental and social impact studies are read in each project\'s environmental document.'),
  ]);
  pakaiSumber(d, '27', 'tol20', 'pm13');
  tambah(d, '28', 'paragraf', [
    T('Keterampilan yang dibutuhkan: pekerja tower, pemasang kabel, teknisi gardu induk dan proteksi, operator pengatur beban, dan insinyur sistem tenaga. Sertifikasi kompetensi teknis ketenagalistrikan diatur Permen ESDM 9/2010 (judul regulasi di repo); daftar lembaga sertifikasi profesi (LSP) per bidang belum ada di sumber yang dibaca.', 'Skills needed: tower workers, cable installers, substation and protection technicians, dispatch operators and power-system engineers. Technical competence certification in electricity is governed by Energy Ministry Reg. 9/2010 (regulation title in the repo); a list of professional certification bodies per field is not in the sources read.'),
  ]);
  pakaiSumber(d, '28', 'ed');
  tambah(d, '29', 'paragraf', [
    T('Kontroversi 3, power wheeling. Pendukung: membuka akses bagi pembangkit swasta terbarukan menjual langsung ke industri dan mempercepat bauran bersih. Penolak: dapat menggerus peran PLN, memindahkan biaya jaringan ke pelanggan lain, dan melemahkan kendali negara atas sistem. Perdebatan ini hidup di pembahasan RUU Energi Baru dan Energi Terbarukan; posisi METI belum ada di basis data (Hipotesis: kedua pihak menuntut skema sewa jaringan yang transparan).', 'Controversy 3, power wheeling. Supporters: opens access for private renewable plants to sell directly to industry and speeds a cleaner mix. Opponents: may erode PLN\'s role, shift network costs to other customers and weaken state control of the system. The debate lives in the New and Renewable Energy Bill discussions; METI\'s position is not in the database (Hypothesis: both sides need a transparent network-fee scheme).'),
    T('Kontroversi 4, ekspor listrik lewat kabel laut. Pendukung: proyek seperti Australia-Asia Power Link menawarkan investasi dan pasokan listrik bersih; penolak: kedaulatan energi dan risiko ketergantungan, serta manfaat nasional yang belum jelas. Proyek itu masih berstatus usulan (Wikipedia).', 'Controversy 4, power export via subsea cable. Supporters: projects like the Australia-Asia Power Link offer investment and clean supply; opponents: energy sovereignty, dependency risk and unclear national benefit. The project is still a proposal (Wikipedia).'),
  ]);
  pakaiSumber(d, '29', 'ed', 'aapl');

  /* ---- I. Proyeksi: tambah tonggak 2030, 2045, 2060 ---- */
  d.bab['30'].baris.push(
    { item: T('Tonggak 2030: HVDC Sumatera-Jawa belum beroperasi (target komersial 2031)', 'Milestone 2030: Sumatra-Java HVDC not yet operating (commercial target 2031)'), nilai: '2031', sat: T('tahun target', 'target year') },
    { item: T('Tonggak 2045: tidak ada proyeksi jaringan resmi di sumber yang dibaca', 'Milestone 2045: no official grid projection in the sources read'), nilai: '-', sat: '-' },
    { item: T('Tonggak 2060: draf RUKN memuat kapasitas EBT 281 GW (kutipan IESR)', 'Milestone 2060: the draft RUKN lists 281 GW of renewable capacity (IESR citation)'), nilai: '281', sat: 'GW' },
  );
  pakaiSumber(d, '30', 'ieto', 'hvdc');

  /* ---- I. Peluang per peran, dipantau 10 ---- */
  tambah(d, '31', 'paragraf', [
    T(...hp('pemasok dan manufaktur: permintaan menara, kabel, trafo, dan relai dalam program 47.758 kms dan 107.950 MVA membuka ruang kandungan lokal bila spesifikasi dan jadwal lelang dapat diprediksi.', 'suppliers and manufacturers: demand for towers, cables, transformers and relays in the 47,758 kms and 107,950 MVA programme opens room for local content if specifications and tender schedules are predictable.')),
    T(...hp('akademisi dan lembaga riset: studi aliran daya, prakiraan VRE, dan inverter pembentuk jaringan; riset kampus di bab Inovasi dapat menjadi dasar kolaborasi.', 'academics and research bodies: load-flow studies, VRE forecasting and grid-forming inverters; the campus research in the Innovation chapter can ground collaboration.')),
    T(...hp('METI: menghimpun data kurtailmen dan kapasitas serap per sistem dari anggota pengembang sebagai bahan advokasi ke PLN dan Kementerian ESDM.', 'METI: collect curtailment and absorption-capacity data per system from developer members as advocacy material for PLN and the Energy Ministry.')),
  ]);
  tambah(d, '32', 'paragraf', [
    T('Tenggat pembahasan RUU Energi Baru dan Energi Terbarukan, khususnya ketentuan power wheeling (tercatat sebagai rancangan di basis regulasi repo).', 'The timetable of the New and Renewable Energy Bill, especially power wheeling provisions (recorded as a draft in the repo regulation base).'),
    T('Penerapan Permen ESDM 13/2025 tentang ruang bebas dan kompensasi: apakah mempercepat pembebasan lahan.', 'Implementation of Energy Ministry Reg. 13/2025 on free space and compensation: whether it speeds land acquisition.'),
    T('Pembaruan angka kurtailmen dan kapasitas serap per sistem bila PLN menerbitkannya, serta penerbitan statistik ketenagalistrikan 2025.', 'Updates of curtailment and absorption-capacity figures per system if PLN publishes them, and the 2025 electricity statistics.'),
    T('Status pipeline Bank Dunia: fasilitas jaringan dan energi terbarukan USD 750 juta (GREFI) dan operasi elektrifikasi ISLE-2.', 'Status of the World Bank pipeline: the USD 750 million grid and renewable energy facility (GREFI) and the ISLE-2 electrification operation.'),
    T('Perkembangan usulan kabel laut ekspor listrik (Australia-Asia Power Link) dan sikap pemerintah.', 'Developments in the proposed power export subsea cable (Australia-Asia Power Link) and the government stance.'),
    T('Progres proyek 275 kV Aceh-Sumut: izin tapak, pembebasan lahan, dan jadwal energize.', 'Progress of the Aceh-North Sumatra 275 kV project: site permits, land acquisition and energisation schedule.'),
    T('Realisasi lelang transmisi 2026 terhadap target 9.219 kms dan 17.790 MVA.', 'Realisation of 2026 transmission tenders against the 9,219 kms and 17,790 MVA targets.'),
  ]);
  pakaiSumber(d, '32', 'wbp', 'aapl', 'pm13');

  /* ---- J. Bacaan lanjut: id pustaka ---- */
  const pus = baca('public/data/pustaka.json').baris;
  for (const pid of ['pk-ruptl-pt-pln-persero-2025-2034', 'pk-strategi-penguatan-sistem-ketenagalistrikan-di-daerah-da', 'pk-peraturan-menteri-esdm-nomor-11-tahun-2021-tentang-pelak', 'pk-transisi-energi-di-daerah-terpencil-studi-kasus-hybrid-p']) {
    const p = pus.find((x) => x.id === cekId('pus', pid));
    if (!d.bab['36'].baris.some((r) => r.id === pid)) d.bab['36'].baris.push({ judul: p.judul, id: pid, url: '/pustaka?id=' + encodeURIComponent(pid), penerbit: p.penerbit || '-', mengapa: T('Dokumen di Pustaka METI', 'Document in the METI Library') });
  }
  d.bab['36'].sumber.push('direktori');

  /* ---- K. Studi kasus berhasil: tambah 2 (total 5) ---- */
  d.bab['39'].butir.push(
    kas({ id: 'viking-link', nama: 'Viking Link, Inggris-Denmark', jenis: 'berhasil', negara: 'GB', lokasi: ['Laut Utara', 'North Sea'], profil: [['Kapasitas', 'Capacity', 1400, 'MW'], ['Mitra', 'Partners', ['National Grid (Inggris) dan Energinet (Denmark)', 'National Grid (UK) and Energinet (Denmark)']], ['Selesai', 'Completed', '2023']],
      sebab: [['Dua operator jaringan nasional berkolaborasi sebagai pemilik bersama.', 'Two national grid operators collaborated as co-owners.']], pelajaran: [['Interkonektor antarnegara dapat berjalan bila operator jaringan sendiri yang memimpin.', 'Cross-border interconnectors can proceed when grid operators themselves lead.']],
      kronologi: [['2023', 'Interkonektor selesai dan beroperasi', 'The interconnector was completed and operating']], angka: [['Kapasitas', 'Capacity', 1400, 0, 'MW', 'viking', false]], faktor: { koordinasi: true, pendanaan: true, teknologi: true }, sumber: ['viking'] }),
    kas({ id: 'nordlink', nama: 'NordLink, Norwegia-Jerman', jenis: 'berhasil', negara: 'NO', lokasi: ['Laut Utara', 'North Sea'], profil: [['Kapasitas', 'Capacity', 1400, 'MW'], ['Panjang', 'Length', 625, 'km'], ['Tegangan', 'Voltage', 500, 'kV DC']],
      sebab: [['Kabel campuran darat (54 km), laut (516 km), dan saluran udara (53 km) memberi fleksibilitas rute.', 'A mix of land cable (54 km), subsea (516 km) and overhead line (53 km) gave route flexibility.']], pelajaran: [['Campuran kabel dan saluran udara dapat meredam penolakan rute.', 'A mix of cable and overhead line can ease route opposition.']],
      kronologi: [['2021', 'NordLink dibuka (Mei 2021)', 'NordLink opened (May 2021)']], angka: [['Kapasitas', 'Capacity', 1400, 0, 'MW', 'nordlink', false], ['Panjang', 'Length', 625, 0, 'km', 'nordlink', false]], faktor: { koordinasi: true, sosial: true, teknologi: true }, sumber: ['nordlink'] }),
  );
  d.bab['39'].sumber.push('viking', 'nordlink');

  return pangkas(d);
}
