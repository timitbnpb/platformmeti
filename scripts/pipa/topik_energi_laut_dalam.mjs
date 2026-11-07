// Pendalaman naskah Energi laut (8 Nov 2026). RUPTL 2025-2034 bagian III.2.7 (Energi Laut) dibaca penuh dari PDF resmi.
import { T, S, hp, faq, glos, langkah, teks, tabel, kol, baca, tambah, pasang, pemain, proyek, regulasi, skema, risetTabel, linReg, cekId, sumberBaru, pakaiSumber, pangkas, regS, SDIREKTORI } from './topik_enam_lib.mjs';

const RUPTL_PDF = 'https://gatrik.esdm.go.id/gatrik/gatrik-api//storage/migrasi/download_index/files/b967d-ruptl-pln-2025-2034-pub-.pdf';
const WIKI = (j, t) => S(j, 'Wikipedia (ringkasan artikel; bukan sumber primer)', 'https://en.wikipedia.org/wiki/' + t, '2026-11-08', 2026, 'via-pihak-ketiga', 'CC BY-SA 4.0');

export function dalam(d) {
  sumberBaru(d, {
    direktori: SDIREKTORI,
    ruptlp: S('RUPTL PT PLN (Persero) 2025-2034, bagian III.2.7 Energi Laut: lima jenis energi kelautan, tiga tahap strategi, studi PLTEL di Selat Larantuka, Selat Sape, dan Maluku, empat syarat pengembangan; dibaca penuh dari PDF 8 Nov 2026', 'PT PLN (Persero); disahkan Kementerian ESDM', RUPTL_PDF, '2026-11-08', 2025, 'resmi'),
    annap: WIKI('Annapolis Royal Generating Station (bendung pasang surut Kanada; puncak 20 MW; sekitar 30 juta kWh per tahun; sudah tidak beroperasi)', 'Annapolis_Royal_Generating_Station'),
    jiangxia: WIKI('Jiangxia Tidal Power Station (Tiongkok: 3,2 MW pada 1985, 4,1 MW sejak 2014; hingga 6,5 GWh per tahun)', 'Jiangxia_Tidal_Power_Station'),
    emec: WIKI('European Marine Energy Centre (pusat uji gelombang dan arus, Kepulauan Orkney)', 'European_Marine_Energy_Centre'),
    pnep: regS('permen-esdm-10-2025'), pkkp: regS('permen-kkp-1-2025'), pr110: regS('perpres-110-2025'),
  });

  tambah(d, '2', 'butir', faq(['ruptlp', 'ed', 'pot63'], [
    ['Apa pandangan PLN terhadap energi laut dalam RUPTL 2025-2034?', 'What does PLN say about ocean energy in RUPTL 2025-2034?', 'RUPTL menyebut pengembangan energi laut di beberapa tempat masih tahap penelitian; kelayakan teknis dan komersial menjadi pertimbangan pokok, disesuaikan dengan kebutuhan sistem setempat.', 'RUPTL says ocean energy is still at the research stage in several places; technical and commercial feasibility will be the main consideration, matched to local system needs.'],
    ['Studi PLTEL mana yang disebut RUPTL?', 'Which ocean energy studies does RUPTL cite?', 'Studi PLTEL di beberapa lokasi Selat Larantuka, studi di Selat Sape, dan studi di Maluku.', 'Studies at several sites in the Larantuka Strait, a study in the Sape Strait and a study in Maluku.'],
    ['Apa syarat PLTEL masuk sistem setempat menurut RUPTL?', 'What conditions must an ocean plant meet to enter the local system per RUPTL?', 'Empat syarat: keseimbangan pasokan-permintaan setempat, kajian kelayakan dan penyambungan (grid study) yang sesuai, kemampuan pendanaan, dan harga yang layak menurut ketentuan.', 'Four conditions: local supply-demand balance, a suitable feasibility and grid study, funding capability and a price that is viable under the rules.'],
    ['Apa strategi energi laut dalam RUPTL?', 'What is the ocean energy strategy in RUPTL?', 'Tiga tahap: meletakkan landasan, membuat prototipe industri untuk membangun kapasitas nasional, lalu ekspansi untuk ketahanan dan kemandirian energi.', 'Three stages: lay the foundation, build industrial prototypes to develop national capacity, then expand for energy security and self-reliance.'],
    ['Kenapa energi laut cocok untuk pulau kecil?', 'Why is ocean energy suited to small islands?', 'RUPTL menyebut teknologi energi laut skala kecil dapat menggantikan pembangkit fosil di daerah kepulauan.', 'RUPTL says small-scale ocean technology can replace fossil plants in island areas.'],
    ['Apa itu pusat uji energi laut?', 'What is a marine energy test centre?', 'Fasilitas dengan tapak berizin dan sambungan jaringan untuk menguji perangkat skala penuh; contoh European Marine Energy Centre di Orkney, Skotlandia (Wikipedia).', 'A facility with consented sites and grid connection to test full-scale devices; an example is the European Marine Energy Centre in Orkney, Scotland (Wikipedia).'],
    ['Apakah ada bendung pasang surut yang sudah ditutup?', 'Has any tidal barrage been closed?', 'Ya. Annapolis Royal di Kanada (puncak 20 MW, sekitar 30 juta kWh per tahun) disebut pernah menjadi satu-satunya pembangkit pasang surut di Amerika Utara dan kini tidak beroperasi (Wikipedia).', 'Yes. Annapolis Royal in Canada (20 MW peak, about 30 million kWh a year) was the only tidal station in North America and no longer operates (Wikipedia).'],
    ['Apa itu energi gradien salinitas?', 'What is salinity gradient energy?', 'Energi dari perbedaan kadar garam antara air tawar dan air laut, salah satu dari lima jenis energi kelautan yang disebut RUPTL.', 'Energy from the salt difference between fresh and sea water, one of the five ocean energy types named in RUPTL.'],
  ]).butir);

  tambah(d, '3', 'butir', glos(['ed', 'ruptlp'], [
    ['PLTEL', 'Ocean energy plant', 'Pusat listrik tenaga energi laut, istilah RUPTL untuk pembangkit energi kelautan.', 'Ocean power plant, the RUPTL term for marine energy generation.'],
    ['Tidal rise and fall', 'Tidal rise and fall', 'Memanfaatkan naik turun muka laut (pasang surut), seperti bendung pasang surut.', 'Using the rise and fall of sea level, as in a tidal barrage.'],
    ['Arus laut', 'Tidal and ocean current', 'Memanfaatkan aliran air laut lewat turbin bawah air.', 'Using the flow of sea water through underwater turbines.'],
    ['Gelombang laut', 'Waves', 'Memanfaatkan gerak gelombang permukaan lewat konverter gelombang.', 'Using surface wave motion through wave energy converters.'],
    ['Gradien salinitas', 'Salinity gradient', 'Energi dari beda kadar garam, misalnya di muara.', 'Energy from salt difference, for instance at estuaries.'],
    ['Gradien termal', 'Thermal gradient', 'Energi dari beda suhu permukaan dan dasar laut, dasar OTEC.', 'Energy from the temperature difference between surface and deep sea, the basis of OTEC.'],
    ['Konverter gelombang (WEC)', 'Wave energy converter (WEC)', 'Perangkat yang mengubah gerak gelombang menjadi listrik.', 'A device that converts wave motion into electricity.'],
    ['Turbin sumbu horizontal', 'Horizontal-axis turbine', 'Turbin arus mirip kincir angin bawah air; desain paling umum untuk arus pasang.', 'A tidal turbine like an underwater wind turbine; the most common tidal stream design.'],
    ['Kecepatan potong', 'Cut-in speed', 'Kecepatan arus minimum agar turbin mulai menghasilkan daya; arus di atas 2 m/s dianggap menarik oleh ESDM.', 'The minimum current speed at which a turbine starts producing power; currents above 2 m/s are seen as attractive by the Energy Ministry.'],
    ['Biofouling', 'Biofouling', 'Penempelan organisme laut pada struktur yang menambah beban dan biaya perawatan.', 'Attachment of marine organisms to structures that adds load and maintenance cost.'],
    ['Korosi air laut', 'Seawater corrosion', 'Kerusakan material oleh air asin; pendorong biaya material dan O&M di laut.', 'Material damage by salt water; a driver of material and O&M cost at sea.'],
    ['Kabel ekspor bawah laut', 'Subsea export cable', 'Kabel yang menyalurkan daya dari perangkat laut ke jaringan darat.', 'The cable that carries power from marine devices to the shore grid.'],
    ['Kajian penyambungan (grid study)', 'Grid study', 'Kajian teknis dampak sambungan pembangkit baru pada jaringan; salah satu syarat RUPTL.', 'Technical study of a new plant\'s connection impact on the grid; one of the RUPTL conditions.'],
    ['Kontrak selisih (CfD)', 'Contract for difference (CfD)', 'Harga tetap berjangka; mekanisme yang mendukung MeyGen di Inggris.', 'A fixed term price; the mechanism that supported MeyGen in the UK.'],
    ['Kesesuaian pemanfaatan ruang laut (KKPRL)', 'Marine space use conformity (KKPRL)', 'Persetujuan tata ruang laut dari KKP yang lazim dibutuhkan kegiatan di perairan; periksa peraturan terbaru.', 'Marine spatial approval from the Fisheries Ministry usually needed for activities at sea; check the latest rules.'],
    ['Zona ekonomi eksklusif (ZEE)', 'Exclusive economic zone (EEZ)', 'Perairan sampai 200 mil laut; salah satu studi menaksir potensi 289,73 GW di seluruh ZEE (ringkasan hasil pencarian).', 'Waters to 200 nautical miles; one study estimates 289.73 GW across the whole EEZ (search summary).'],
    ['TKDN', 'Local content (TKDN)', 'Tingkat komponen dalam negeri; peluang kandungan lokal pada struktur laut dan kabel.', 'Domestic component level; a local content opportunity in marine structures and cables.'],
    ['Prototipe industri', 'Industrial prototype', 'Tahap kedua strategi RUPTL untuk membangun kapasitas industri nasional.', 'The second stage of the RUPTL strategy to build national industrial capacity.'],
    ['Kapasitas terpasang nol', 'Zero installed capacity', 'Kondisi Indonesia saat ini: belum ada PLTAL beroperasi komersial.', 'Indonesia\'s current condition: no commercial ocean power plant operating.'],
  ]).butir);

  tambah(d, '4', 'paragraf', [
    T('RUPTL 2025-2034 membagi energi kelautan menjadi lima jenis: pasang surut, arus laut, gelombang, gradien salinitas, dan gradien termal. Tiap jenis punya fisika, biaya, dan kematangan berbeda; arus laut dan pasang surut paling dekat ke operasi, sedangkan salinitas masih jauh.', 'RUPTL 2025-2034 divides marine energy into five types: tidal rise and fall, ocean current, waves, salinity gradient and thermal gradient. Each has its own physics, cost and maturity; current and tidal are closest to operation while salinity is far off.'),
    T('Peran dalam sistem: arus pasang dapat diprakirakan jauh hari sehingga lebih mudah dijadwalkan daripada surya dan angin, dan cocok untuk pulau berarus kuat. Hambatannya adalah biaya struktur laut, perawatan, dan skema harga yang belum ada.', 'Role in the system: tidal streams can be forecast far ahead, so they are easier to schedule than solar and wind, and suit islands with strong currents. The barriers are marine structure cost, maintenance and a missing pricing scheme.'),
    T('Dalam bauran, RUPTL memperlakukannya sebagai opsi yang menunggu studi dan syarat kelayakan, bukan target kapasitas; karena itu angka potensi besar (63 GW praktis) tidak sama dengan rencana pembangunan.', 'In the mix, RUPTL treats it as an option awaiting studies and feasibility conditions, not a capacity target; so the large potential figure (63 GW practical) is not a build plan.'),
  ]);
  pakaiSumber(d, '4', 'ruptlp');

  d.bab['5'].rumus.push(
    T('Energi bendung per pasang (J) = 0,5 x kerapatan air x percepatan gravitasi x luas kolam x tinggi pasang kuadrat', 'Barrage energy per tide (J) = 0.5 x water density x gravity x basin area x tidal range squared'),
    T('Daya gelombang laut dalam (kW per meter muka gelombang), perkiraan = 0,5 x tinggi gelombang signifikan (m) kuadrat x periode (s)', 'Deep-water wave power (kW per metre of wave front), approximation = 0.5 x significant wave height (m) squared x period (s)'),
    T('Faktor kapasitas bersih = Produksi bersih (GWh) / (Daya terpasang MW x 8,76)', 'Net capacity factor = Net output (GWh) / (Installed MW x 8.76)'),
  );
  d.bab['5'].contoh.push(
    T('Gelombang (angka ilustrasi): tinggi 2 m dan periode 8 s memberi 0,5 x 4 x 8 = sekitar 16 kW per meter muka gelombang (EST).', 'Waves (illustrative figures): height 2 m and period 8 s give 0.5 x 4 x 8 = about 16 kW per metre of wave front (EST).'),
    T('MeyGen fase 1A (EST): 10,2 GWh pada 2023 dari 6 MW = 10,2 / (6 x 8,76) = sekitar 19,4 persen faktor kapasitas bersih, lebih rendah dari Sihwa 24,8 persen.', 'MeyGen phase 1A (EST): 10.2 GWh in 2023 from 6 MW = 10.2 / (6 x 8.76) = about 19.4 percent net capacity factor, lower than Sihwa at 24.8 percent.'),
  );
  pakaiSumber(d, '5', 'ed', 'mey_wiki', 'kwater');

  pasang(d, '6', langkah(['ed', 'ruptlp', 'lar18', 'mey_ops', 'jp28'], [
    ['Survei sumber daya', 'Resource survey', 'Pengukuran kecepatan arus, kedalaman, dan suhu di selat atau perairan calon; riset kampus menyediakan peta gelombang.', 'Measuring current speed, depth and temperature in candidate straits or waters; campus research provides wave maps.', 'BRIN, ESDM, kampus', 'BRIN, Energy Ministry, campuses'],
    ['Studi kelayakan dan jaringan', 'Feasibility and grid studies', 'RUPTL menyebut studi di Selat Larantuka, Selat Sape, dan Maluku; Larantuka punya pra-FS PUPR 2017 dan MoU studi PLN 22 Feb 2018.', 'RUPTL cites studies at the Larantuka Strait, the Sape Strait and Maluku; Larantuka had a PUPR pre-FS in 2017 and a PLN study MoU on 22 Feb 2018.', 'PLN, pengembang, PUPR', 'PLN, developers, Public Works Ministry'],
    ['Perizinan ruang laut dan lingkungan', 'Marine space and environmental permits', 'Persetujuan pemanfaatan ruang laut, lingkungan, dan alur pelayaran sebelum pemasangan.', 'Marine space, environmental and shipping-lane approvals before installation.', 'KKP, pemda, kementerian terkait', 'Fisheries Ministry, local governments, relevant ministries'],
    ['Kesepakatan harga dan pembelian listrik', 'Pricing and offtake agreement', 'Syarat RUPTL: harga yang layak; skema tarif arus laut belum ditemukan di sumber.', 'RUPTL condition: a viable price; a tidal tariff scheme was not found in sources.', 'PLN, ESDM', 'PLN, Energy Ministry'],
    ['Pengadaan turbin dan struktur laut', 'Turbine and marine structure procurement', 'Mitra teknologi luar (Belanda, Skotlandia) dan kontraktor lokal.', 'Foreign technology partners (Netherlands, Scotland) and local contractors.', 'Tidal Bridge, Nova Innovation, SBS Indonesia', 'Tidal Bridge, Nova Innovation, SBS Indonesia'],
    ['Instalasi dan kabel bawah laut', 'Installation and subsea cable', 'Pemasangan di dasar laut dengan kapal khusus dan sambungan ke jaringan.', 'Seabed installation with specialist vessels and grid connection.', 'Kontraktor laut, PLN', 'Marine contractors, PLN'],
    ['Operasi dan pemeliharaan laut', 'Marine operation and maintenance', 'MeyGen fase 1A memasuki fase operasi 25 tahun; perawatan bergantung jendela cuaca.', 'MeyGen phase 1A entered a 25-year operations phase; maintenance depends on weather windows.', 'Operator, kapal servis', 'Operator, service vessels'],
    ['Pengujian dan pembelajaran', 'Testing and learning', 'Pusat uji seperti EMEC membuktikan perangkat sebelum skala komersial.', 'Test centres such as EMEC prove devices before commercial scale.', 'EMEC, kampus, BRIN', 'EMEC, campuses, BRIN'],
  ]));

  tambah(d, '11', 'paragraf', [T('Menurut RUPTL 2025-2034, PLTEL hanya dikembangkan bila memenuhi empat syarat sistem setempat (pasokan-permintaan, kajian kelayakan dan penyambungan, pendanaan, harga); karena itu pasar belum ada dan tidak ada target MW di tabel RUPTL.', 'Per RUPTL 2025-2034, ocean plants are developed only if they meet four local-system conditions (supply-demand, feasibility and grid study, funding, price); so there is no market yet and no MW target in the RUPTL tables.')]);
  pakaiSumber(d, '11', 'ruptlp');

  pemain(d, [
    ['Kementerian Energi dan Sumber Daya Mineral', ['Penerbit kajian potensi 63 GW dan penyetuju RUPTL', 'Publisher of the 63 GW potential study and approver of RUPTL'], 'ESDM; RUPTL'],
    ['Direktorat Jenderal Energi Baru, Terbarukan dan Konservasi Energi', ['Ditjen penyusun kebijakan energi laut', 'The directorate general drafting ocean energy policy'], 'Direktori METI'],
    ['Badan Riset dan Inovasi Nasional', ['Pelaksana riset energi laut dan pengelola pendanaan riset', 'Runs ocean energy research and research funding'], 'Direktori METI'],
    ['PT PLN (Persero)', ['Pembeli listrik dan penyusun RUPTL yang memuat studi PLTEL Larantuka, Sape, Maluku', 'Power buyer and drafter of the RUPTL that lists ocean studies at Larantuka, Sape and Maluku'], 'RUPTL 2025-2034'],
    ['PT PLN Nusantara Power', ['Anak usaha PLN pembangkit; calon operator (PJB sebelum berganti nama, belum dikonfirmasi sumber)', 'PLN generation subsidiary; possible operator (formerly PJB, not confirmed by sources)'], 'Direktori METI'],
    ['PT Pertamina New & Renewable Energy', ['Entitas energi baru Pertamina; mitra serupa Pertamina Power Indonesia di proyek 2025 belum dipastikan sama', 'Pertamina\'s new energy entity; whether it is the same as the Pertamina Power Indonesia partner in the 2025 project is not confirmed'], 'Direktori METI'],
    ['Pusat Studi Energi Universitas Gadjah Mada', ['Kampus tempat pakar energi laut (F. Danang Wijaya)', 'Campus of an ocean energy expert (F. Danang Wijaya)'], 'Direktori METI; OpenAlex'],
    ['Institut Teknologi Sepuluh Nopember - Pusat Studi Energi', ['Kampus dengan riset rekayasa kelautan dan energi', 'Campus with ocean engineering and energy research'], 'Direktori METI'],
    ['Pusat Penelitian Energi Universitas Indonesia (Pusat Kajian Energi / Fakultas Teknik)', ['Pusat kajian energi nasional', 'National energy study centre'], 'Direktori METI'],
    ['Institut Pertanian Bogor', ['Pengembang baterai air laut Sagara dan pakar kelautan (Bono Pranoto)', 'Developer of the Sagara seawater battery and home of an ocean expert (Bono Pranoto)'], 'Direktori METI; inovasi'],
    ['Badan Pengelola Investasi Daya Anagata Nusantara', ['Calon pendana infrastruktur energi', 'Prospective energy infrastructure funder'], 'Direktori METI'],
    ['Atlantis Resources', ['Pemasok turbin MeyGen (pembanding)', 'MeyGen turbine supplier (comparison)'], 'Wikipedia via naskah'],
    ['K-water', ['Pemilik Sihwa (pembanding)', 'Owner of Sihwa (comparison)'], 'K-water'],
    ['European Marine Energy Centre', ['Pusat uji gelombang dan arus Orkney (pembanding)', 'Orkney wave and tidal test centre (comparison)'], 'Wikipedia'],
    ['International Renewable Energy Agency', ['Penyedia basis data pendanaan publik (IRENA/OECD)', 'Provider of the public finance database (IRENA/OECD)'], 'IRENA'],
    ['TU Delft', ['Penulis skenario OTEC Indonesia hingga 45 GW', 'Author of the Indonesian OTEC scenario up to 45 GW'], 'Renewable Energy (jurnal)'],
  ], 'energi-laut', 40);
  d.bab['9'].sumber.push('ruptlp', 'emec', 'tud');

  proyek(d, { nama: 'nama', wilayah: 'negara', ukuran: 'ukuran', status: 'status' }, [
    ['Studi PLTEL Selat Larantuka (RUPTL)', T('NTT', 'NTT'), T('10 MW pada daftar potensi 2022', '10 MW on the 2022 potential list'), T('Studi disebut RUPTL 2025-2034', 'Study cited by RUPTL 2025-2034'), 'RUPTL; ESDM 2022'],
    ['Studi PLTEL Selat Sape (RUPTL)', T('NTB', 'NTB'), T('tidak disebut', 'not stated'), T('Studi disebut RUPTL 2025-2034', 'Study cited by RUPTL 2025-2034'), 'RUPTL'],
    ['Studi PLTEL Maluku (RUPTL)', T('Maluku', 'Maluku'), T('tidak disebut', 'not stated'), T('Studi disebut RUPTL 2025-2034', 'Study cited by RUPTL 2025-2034'), 'RUPTL'],
    ['PLTAL Selat Alas dan Selat Lombok', T('NTB', 'NTB'), T('10 MW dan 10 MW', '10 MW and 10 MW'), T('Daftar potensi RUPTL (pemutakhiran ESDM 2022)', 'RUPTL potential list (2022 ministry update)'), 'Listrik Indonesia'],
    ['Annapolis Royal', T('Kanada', 'Canada'), T('puncak 20 MW; sekitar 30 juta kWh per tahun', '20 MW peak; about 30 million kWh a year'), T('Tidak lagi beroperasi', 'No longer operating'), 'Wikipedia'],
    ['Jiangxia', T('Tiongkok', 'China'), T('4,1 MW; hingga 6,5 GWh per tahun', '4.1 MW; up to 6.5 GWh a year'), T('Beroperasi sejak 1985 (3,2 MW)', 'Operating since 1985 (3.2 MW)'), 'Wikipedia'],
    ['EMEC Orkney', T('Skotlandia', 'Scotland'), T('pusat uji', 'test centre'), T('Beroperasi', 'Operating'), 'Wikipedia'],
  ]);
  d.bab['10'].sumber.push('ruptlp', 'annap', 'jiangxia', 'emec');

  regulasi(d, {
    'permen-esdm-10-2025': ['Peta jalan transisi energi sektor ketenagalistrikan; kerangka rencana pembangkit baru.', 'Road map of the electricity-sector transition; framework for new plant planning.'],
    'permen-esdm-5-2025': ['Pedoman perjanjian jual beli listrik dari pembangkit energi terbarukan; acuan skema harga.', 'Guideline for power purchase agreements from renewable plants; pricing scheme reference.'],
    'permen-kkp-1-2025': ['Nilai ekonomi karbon sektor kelautan (Kementerian Kelautan dan Perikanan), relevan bagi aktivitas di ruang laut.', 'Carbon economic value in the marine sector (Fisheries Ministry), relevant to activity in marine space.'],
    'perpres-62-2014': ['Pengesahan Statuta IRENA (rujukan kerja sama energi terbarukan).', 'Ratification of the IRENA statute (renewable energy cooperation reference).'],
    'lokal-431': ['Rancangan UU Energi Baru dan Energi Terbarukan; belum ada ketentuan khusus energi laut yang dibaca.', 'Draft New and Renewable Energy Bill; no ocean-specific provision was read.'],
  });
  pakaiSumber(d, '12', 'pkkp', 'pnep');

  tambah(d, '13', 'butir', [
    { tanggal: '1985-01-01', judul: T('Jiangxia (Tiongkok) beroperasi dengan 3,2 MW terpasang (tahun 1985)', 'Jiangxia (China) operates with 3.2 MW installed (year 1985)'), url: 'https://en.wikipedia.org/wiki/Jiangxia_Tidal_Power_Station' },
    { tanggal: '2014-01-01', judul: T('Jiangxia ditingkatkan menjadi 4,1 MW (tahun 2014)', 'Jiangxia upgraded to 4.1 MW (year 2014)'), url: 'https://en.wikipedia.org/wiki/Jiangxia_Tidal_Power_Station' },
    { tanggal: '2017-09-26', judul: T('PPPGL meneliti OTEC di 17 lokasi dengan total 41 GW (Good News from Indonesia)', 'PPPGL studies OTEC at 17 sites totalling 41 GW (Good News from Indonesia)') },
    { tanggal: '2025-05-26', judul: T('RUPTL 2025-2034 disahkan; memuat studi PLTEL Larantuka, Sape, dan Maluku', 'RUPTL 2025-2034 approved; lists ocean energy studies at Larantuka, Sape and Maluku'), url: RUPTL_PDF },
    linReg('permen-esdm-10-2025', 'x', 'x').slice(0, 1).map((tg) => ({ tanggal: tg, judul: T('Permen ESDM 10/2025 peta jalan transisi energi sektor ketenagalistrikan', 'Energy Ministry Reg. 10/2025 road map of the electricity-sector transition') }))[0],
    { tanggal: '2026-05-26', judul: T('Satu tahun RUPTL 2025-2034: belum ada target MW energi laut di tabelnya', 'One year of RUPTL 2025-2034: still no ocean energy MW target in its tables') },
  ]);
  d.bab['13'].butir.sort((a, b) => a.tanggal.localeCompare(b.tanggal));
  pakaiSumber(d, '13', 'jiangxia', 'otec17', 'ruptlp', 'pnep');

  pasang(d, '14', teks(['ruptlp', 'ed', 'pnep', 'pkkp'], [
    ['Syarat RUPTL: PLTEL masuk sistem setempat bila memenuhi keseimbangan pasokan-permintaan, kajian kelayakan dan penyambungan, kemampuan pendanaan, dan harga yang layak.', 'RUPTL condition: an ocean plant enters the local system if it meets supply-demand balance, a feasibility and grid study, funding capability and a viable price.'],
    ['Izin usaha ketenagalistrikan: pembangkit untuk dijual ke PLN tunduk pada UU 30/2009 dan turunannya (bab Kerangka hukum).', 'Electricity business licence: a plant selling to PLN is subject to Law 30/2009 and its implementing rules (Legal framework chapter).'],
    ['Persetujuan ruang laut dan lingkungan: kegiatan di perairan membutuhkan persetujuan pemanfaatan ruang laut dan lingkungan; peraturan rinci perlu diperiksa karena tidak dibaca di naskah ini (ringkasan editorial METI).', 'Marine space and environmental approval: activity at sea needs marine space and environmental approval; check detailed rules as they were not read in this text (METI editorial summary).'],
    ['Karbon sektor kelautan: Permen KKP 1/2025 mengatur tata cara nilai ekonomi karbon sektor kelautan (judul regulasi).', 'Marine-sector carbon: Fisheries Ministry Reg. 1/2025 governs carbon economic value in the marine sector (regulation title).'],
    ['Pedoman jual beli listrik: Permen ESDM 5/2025 menjadi acuan perjanjian jual beli listrik energi terbarukan (judul regulasi); tarif khusus arus laut belum ada.', 'Power purchase guideline: Energy Ministry Reg. 5/2025 is the reference for renewable PPAs (regulation title); there is no tidal-specific tariff.'],
    ['Insentif: skema hibah riset dan dana iklim di bab Pembiayaan; tidak ada insentif fiskal khusus energi laut di sumber yang dibaca.', 'Incentives: research grants and climate funds are in the Financing chapter; there is no ocean-specific fiscal incentive in the sources read.'],
    ['Kewajiban pelaporan: pengembang melaporkan data arus dan hasil ke pemerintah sesuai izin; rincian tidak ada di sumber.', 'Reporting duty: developers report current data and output to government under their permit; detail is not in the sources.'],
    ['Sanksi: tidak ditemukan di sumber yang dibaca.', 'Sanctions: not found in the sources read.'],
  ]));
  pasang(d, '15', langkah(['ruptlp', 'ed'], [
    ['1. Studi sumber daya dan lokasi', '1. Resource and site study', 'Ukur arus atau gelombang sepanjang musim.', 'Measure current or waves across seasons.', 'Pengembang, BRIN', 'Developer, BRIN'],
    ['2. Kajian kelayakan dan penyambungan', '2. Feasibility and grid study', 'Syarat RUPTL; hasilnya menentukan kapasitas yang bisa diserap.', 'A RUPTL condition; the result sets the absorbable capacity.', 'Pengembang, PLN', 'Developer, PLN'],
    ['3. Persetujuan ruang laut dan lingkungan', '3. Marine space and environment approvals', 'Ajukan persetujuan pemanfaatan ruang laut dan dokumen lingkungan.', 'Apply for marine space approval and environmental documents.', 'KKP, pemda', 'Fisheries Ministry, local governments'],
    ['4. Masuk rencana PLN', '4. Enter PLN planning', 'Usulkan melalui RUPTL; syarat harga yang layak harus dipenuhi.', 'Propose through RUPTL; the viable-price condition must be met.', 'PLN, ESDM', 'PLN, Energy Ministry'],
    ['5. Perjanjian jual beli listrik', '5. Power purchase agreement', 'Negosiasi tarif dan skema pembelian.', 'Negotiate the tariff and purchase scheme.', 'PLN, pengembang', 'PLN, developer'],
    ['6. Pendanaan', '6. Financing', 'Ekuitas, pinjaman, atau hibah (bab Pembiayaan).', 'Equity, loans or grants (Financing chapter).', 'Pengembang, pendana', 'Developer, funders'],
    ['7. Pemasangan dan komisioning', '7. Installation and commissioning', 'Kapal khusus, kabel, dan uji sambungan.', 'Specialist vessels, cable and connection tests.', 'Kontraktor laut', 'Marine contractors'],
    ['8. Operasi', '8. Operation', 'Sertifikat laik operasi dan pelaporan.', 'Operation certificate and reporting.', 'Operator', 'Operator'],
  ]));
  d.bab['15'].catatan = T('Lama dan biaya tiap langkah tidak ditemukan di sumber; urutan adalah ringkasan editorial METI dan syarat RUPTL.', 'The duration and cost of each step were not found in sources; the order is a METI editorial summary plus the RUPTL conditions.');

  tambah(d, '17', 'paragraf', [
    T('Turbin arus sumbu horizontal (MeyGen: empat unit 1,5 MW) adalah desain paling matang; turbin sumbu vertikal dan sayap hidrofoil masih pada tahap uji.', 'Horizontal-axis tidal turbines (MeyGen: four 1.5 MW units) are the most mature design; vertical-axis turbines and hydrofoil kites are still in testing.'),
    T('Konverter gelombang (titik penyerap, kolom air berosilasi, terapung) belum konvergen ke satu desain; pusat uji seperti EMEC dipakai untuk menguji perangkat skala penuh.', 'Wave energy converters (point absorbers, oscillating water columns, floating) have not converged on one design; test centres such as EMEC test full-scale devices.'),
    T('OTEC memerlukan beda suhu sekitar 20 derajat Celsius antara permukaan dan kedalaman; estimasi potensi Indonesia 41 GW (PPPGL) dan hingga 45 GW (TU Delft), tetapi belum ada pembangkit komersial di sumber yang dibaca.', 'OTEC needs a temperature difference of about 20 degrees Celsius between surface and depth; Indonesian potential is estimated at 41 GW (PPPGL) and up to 45 GW (TU Delft), but no commercial plant is in the sources read.'),
    T('Baterai air laut: IPB University mengembangkan Sagara (baterai tenaga air laut untuk lampu bagan nelayan, uji lapangan 2023), contoh teknologi laut skala kecil sesuai arah RUPTL.', 'Seawater battery: IPB University developed Sagara (a seawater-powered battery for fishermen\'s lights, field test 2023), an example of small-scale marine technology in line with the RUPTL direction.'),
    T('Tingkat kematangan (TRL) dan biaya tiap teknologi tidak dikutip karena tidak ada sumber tunggal yang dibaca.', 'The TRL and cost of each technology are not quoted as no single source was read.'),
  ]);
  pakaiSumber(d, '17', 'emec', 'otec17', 'tud');

  const ivs = baca('public/data/inovasi.json').inovasi; const sg = ivs.find((q) => q.id === cekId('inov', 'in_sagara_baterai_air_laut'));
  const riset = risetTabel('energi-laut', /wave|tidal|ocean|marine|current|sea|coast|energy/i, 10, ['Baris pertama adalah inovasi tercatat di direktori METI (IPB University); sisanya karya riset kampus dan peneliti dari irisan OpenAlex di repo. Penulis berafiliasi kampus tertera di tabel Pakar.', 'The first row is an innovation listed in the METI directory (IPB University); the rest are campus and researcher works from the OpenAlex slice in the repo. Campus-affiliated authors appear in the Experts table.']);
  riset.baris.unshift({ judul: sg.nama, id: sg.id, url: sg.sumber?.[0]?.url, penulis: (sg.pembuat || []).map((p) => p.nama).join(', '), jurnal: `${sg.status} (${sg.tahun})`, sitasi: 0 });
  pasang(d, '18', riset);

  d.bab['20'].kolom.splice(1, 0, kol('iso2', 'ISO2', 'ISO2'));
  const k = (n) => (typeof n === 'string' ? n : n.id); const iso = { 'Korea Selatan: Sihwa': 'KR', 'Skotlandia: MeyGen': 'GB', Indonesia: 'ID' };
  d.bab['20'].baris.forEach((r) => { r.iso2 = iso[k(r.negara)] || '-'; });
  d.bab['20'].baris.push(
    { negara: 'Kanada: Annapolis Royal', iso2: 'CA', tipe: 'Barrage', kapasitas: '20 MW (puncak)', hasil: T('sekitar 30 juta kWh per tahun; tidak lagi beroperasi', 'about 30 million kWh a year; no longer operating') },
    { negara: 'Tiongkok: Jiangxia', iso2: 'CN', tipe: 'Barrage', kapasitas: '4,1 MW', hasil: T('hingga 6,5 GWh per tahun; beroperasi sejak 1985', 'up to 6.5 GWh a year; operating since 1985') },
  );
  d.bab['20'].per = 10; pakaiSumber(d, '20', 'annap', 'jiangxia');

  pasang(d, '24', skema([
    ['sk_brin_riset', ['Pendanaan riset dan inovasi BRIN untuk survei sumber daya dan prototipe.', 'BRIN research and innovation funding for resource surveys and prototypes.']],
    ['sk_kedaireka', ['Dana padanan kampus-industri untuk prototipe teknologi laut.', 'University-industry matching fund for marine technology prototypes.']],
    ['sk_bima', ['Penelitian dan pengabdian kampus lewat BIMA.', 'Campus research and community service through BIMA.']],
    ['sk_lpdp_riset', ['Pendanaan riset LPDP.', 'LPDP research funding.']],
    ['sk_gef', ['Hibah Global Environment Facility untuk proyek percontohan lingkungan.', 'Global Environment Facility grant for environmental pilot projects.']],
    ['sk_gcf', ['Dana iklim multilateral yang dapat membiayai proyek percontohan energi bersih.', 'Multilateral climate fund that can finance clean energy pilots.']],
    ['sk_adb_etm', ['Mekanisme transisi energi ADB (sektor surya dan jaringan tercatat; relevansi laut perlu dipastikan).', 'ADB energy transition mechanism (solar and grid sectors listed; marine relevance to be confirmed).']],
    ['sk_greenbook', ['Pinjaman luar negeri pemerintah lewat Green Book Bappenas untuk infrastruktur.', 'Government foreign loans through the Bappenas Green Book for infrastructure.']],
  ], ['Proyek 40 MW senilai sekitar USD 220 juta tidak menyebut sumber dana; satu-satunya aliran publik asing tercatat USD 0,74 juta (2019, IRENA/OECD).', 'The 40 MW project worth about USD 220 million names no funding source; the only recorded foreign public flow is USD 0.74 million (2019, IRENA/OECD).']));
  pakaiSumber(d, '24', 'pubfin');

  pasang(d, '26', tabel(['jp28', 'kwater', 'mey_ops', 'direktori'], 8, [kol('pos', 'Kasus', 'Case'), kol('nilai', 'Nilai', 'Value'), kol('catatan', 'Catatan', 'Note')], [
    { pos: T('PLTAL NTT dan NTB 40 MW', 'NTT and NTB tidal plants 40 MW'), nilai: 'USD 220 juta', catatan: T('Rencana operasi 2028 (Jakarta Post, 16 Jun 2025)', 'Operation planned 2028 (Jakarta Post, 16 Jun 2025)') },
    { pos: T('Sihwa 254 MW (K-water)', 'Sihwa 254 MW (K-water)'), nilai: 'USD 355,1 juta', catatan: T('Beroperasi', 'Operating') },
    { pos: T('Aliran publik asing ke energi laut Indonesia (2019)', 'Foreign public flow to Indonesian ocean energy (2019)'), nilai: 'USD 0,74 juta', catatan: T('IRENA dan OECD', 'IRENA and OECD') },
    { pos: T('Transaksi merger, akuisisi, IPO', 'Merger, acquisition, IPO transactions'), nilai: '-', catatan: T('Tidak ditemukan di sumber yang dibaca', 'Not found in the sources read') },
  ]));
  pasang(d, '27', teks(['ed'], [['Manfaat: listrik rendah emisi untuk pulau berarus kuat. Risiko: dampak pada biota laut, alur pelayaran, dan nelayan setempat; studi lingkungan khusus Indonesia tidak ditemukan di sumber. Hak masyarakat: nelayan di selat calon perlu dilibatkan sejak survei.', 'Benefits: low-emission power for islands with strong currents. Risks: effects on marine life, shipping lanes and local fishers; no Indonesia-specific environmental study was found in the sources. Community rights: fishers in candidate straits need involving from the survey stage.']]));
  pasang(d, '28', teks(['ed', 'ruptlp'], [['Keterampilan: penyelam dan teknisi kapal, insinyur kelautan, pengelas struktur baja, dan operator jaringan. RUPTL menetapkan tahap kedua berupa prototipe industri untuk membangun kapasitas nasional, jadi pelatihan dan sertifikasi perlu menyertai prototipe. Daftar lembaga sertifikasi tidak ditemukan di sumber.', 'Skills: vessel divers and technicians, marine engineers, steel structure welders and grid operators. RUPTL sets a second stage of industrial prototypes to build national capacity, so training and certification must accompany prototypes. A list of certification bodies was not found in sources.']]));
  tambah(d, '29', 'paragraf', [
    T('Kontroversi 3, arus laut atau surya terapung. Pendukung energi laut: dapat diprakirakan dan cocok untuk pulau berarus kuat. Pendukung surya: biaya jauh lebih rendah dan teknologi matang. Hipotesis METI: keduanya melengkapi; energi laut layak dikejar sebagai prototipe industri sesuai tahap RUPTL, bukan sebagai pengganti surya.', 'Controversy 3, tidal or floating solar. Ocean energy supporters: predictable and suited to islands with strong currents. Solar supporters: far lower cost and mature technology. METI hypothesis: they complement each other; ocean energy is worth pursuing as an industrial prototype per the RUPTL stage, not as a solar substitute.'),
    T('Kontroversi 4, potensi teoretis atau praktis. Taksiran 63 GW praktis dan 289,73 GW seluruh ZEE berbeda jauh karena definisi dan batasan (kedalaman, jarak ke pantai, kebutuhan sistem) berbeda; RUPTL sendiri tidak memberi target MW.', 'Controversy 4, theoretical or practical potential. The 63 GW practical and 289.73 GW whole-EEZ estimates differ widely because definitions and limits (depth, distance to shore, system demand) differ; RUPTL itself sets no MW target.'),
  ]);
  pakaiSumber(d, '29', 'pot63', 'ruptlp', 'ed');
  tambah(d, '31', 'paragraf', [T(...hp('akademisi: data gelombang dan arus terbuka serta prototipe skala kecil; peneliti UGM, Universitas Hasanuddin, dan IPB tercatat di tabel Pakar.', 'academics: open wave and current data and small-scale prototypes; researchers at UGM, Hasanuddin University and IPB are listed in the Experts table.')), T(...hp('pemasok: struktur baja laut, kabel bawah laut, dan kapal servis adalah peluang awal bila tahap prototipe industri RUPTL berjalan.', 'suppliers: marine steel structures, subsea cable and service vessels are early opportunities if the RUPTL industrial prototype stage proceeds.'))]);
  tambah(d, '32', 'paragraf', [
    T('Hasil studi PLTEL Larantuka, Sape, dan Maluku yang disebut RUPTL.', 'The results of the Larantuka, Sape and Maluku ocean studies cited by RUPTL.'), T('Revisi RUPTL berikutnya: apakah muncul target MW energi laut.', 'The next RUPTL revision: whether an ocean energy MW target appears.'),
    T('Keputusan investasi akhir proyek 40 MW dan jadwal konstruksi 2028.', 'The final investment decision and 2028 construction schedule of the 40 MW project.'), T('Skema tarif arus laut dari ESDM atau PLN.', 'A tidal tariff scheme from the Energy Ministry or PLN.'),
    T('Rekonsiliasi angka potensi 63 GW, 41 GW OTEC, dan 289,73 GW ZEE.', 'Reconciling the 63 GW, 41 GW OTEC and 289.73 GW EEZ potential figures.'), T('Hasil prototipe kampus (Sagara, turbin arus kecil).', 'Results of campus prototypes (Sagara, small tidal turbines).'), T('Pendanaan riset BRIN, Kedaireka, dan LPDP untuk energi laut.', 'BRIN, Kedaireka and LPDP research funding for ocean energy.'),
  ]);
  const pus = baca('public/data/pustaka.json').baris;
  const pid = 'pk-ruptl-pt-pln-persero-2025-2034'; const pp = pus.find((x) => x.id === cekId('pus', pid));
  d.bab['36'].baris.push({ judul: pp.judul + ' (bagian III.2.7 Energi Laut)', id: pid, url: '/pustaka?id=' + pid, penerbit: pp.penerbit || '-', mengapa: T('Satu-satunya dokumen perencanaan PLN yang memuat strategi energi laut', 'The PLN planning document that carries the ocean energy strategy') });
  d.bab['36'].sumber.push('direktori');

  /* kasus: klarifikasi status Larantuka dari RUPTL 2025-2034 */
  const lr = d.bab['40'].butir.find((x) => x.id === 'larantuka');
  lr.kronologi.push({ tanggal: '2025-05-26', teks: T('RUPTL 2025-2034 masih mencantumkan studi PLTEL di Selat Larantuka; status studi, bukan pembatalan.', 'RUPTL 2025-2034 still lists ocean energy studies at the Larantuka Strait; study status, not cancellation.') });
  lr.sumber.push('ruptlp'); lr.pelajaran.push(T('Larantuka kini berstatus studi dalam RUPTL; tanda "mundur" berarti jadwal 2018 tidak terpenuhi, bukan bahwa gagasan dihentikan.', 'Larantuka is now a study in RUPTL; "delayed" means the 2018 schedule was missed, not that the idea was dropped.'));
  d.bab['40'].sumber.push('ruptlp');
  return pangkas(d);
}
