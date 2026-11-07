// Pendalaman naskah Transisi berkeadilan (8 Nov 2026). Fakta peluncuran JETP dibaca dari laman resmi Sekretariat JETP (jetp-id.org, 8 Nov 2026).
import { T, S, hp, faq, glos, langkah, teks, tabel, kol, baca, tambah, pasang, pemain, regulasi, skema, risetTabel, linReg, cekId, sumberBaru, pakaiSumber, pangkas, regS, SDIREKTORI, pasarListrik, SSTATPLN } from './topik_enam_lib.mjs';

export function dalam(d) {
  sumberBaru(d, {
    direktori: SDIREKTORI, statpln: SSTATPLN,
    owid: S('Our World in Data energy-data (Ember Yearly Electricity Data), baris ASEAN (public/data/asean_energi.json)', 'Ember via Our World in Data', 'https://raw.githubusercontent.com/owid/energy-data/master/owid-energy-data.csv', '2026-11-08', 2025, 'via-pihak-ketiga', 'CC BY 4.0'),
    jetpid: S('JETP Indonesia (laman resmi Sekretariat JETP): peluncuran 15 Nov 2022 di sela KTT G20 Bali, komitmen awal USD 20 miliar (USD 10 miliar dana IPG untuk memicu USD 10 miliar swasta GFANZ), anggota IPG, CIPP sebagai dokumen hidup; berita Desember 2025 tentang Just Transition Thematic Report dan studi captive power', 'Sekretariat JETP Indonesia', 'https://jetp-id.org/', '2026-11-08', 2025, 'resmi'),
    gppd: S('Global Power Plant Database v1.3.0 (WRI), baris batu bara Indonesia diolah repo (public/data/gppd.json); berhenti 2021, tanpa pembangkit baru sesudahnya', 'World Resources Institute', 'https://datasets.wri.org/dataset/globalpowerplantdatabase', '2026-11-07', 2021, 'kajian', 'CC BY 4.0'),
    pr110: regS('perpres-110-2025'), pr112: regS('perpres-112-2022'), uu16: regS('uu-16-2016'), pm10: regS('permen-esdm-10-2025'), pk5: regS('permen-kemenkeu-5-2025'), pp40: regS('pp-40-2025'),
  });
  const gp = baca('public/data/gppd.json').baris.filter((x) => x.bahan_bakar === 'Coal'); const gmw = gp.reduce((a, x) => a + x.kapasitas_mw, 0);

  tambah(d, '2', 'butir', faq(['jetpid', 'gppd', 'ed'], [
    ['Kapan JETP Indonesia diluncurkan dan berapa komitmen awalnya?', 'When was JETP Indonesia launched and what was the initial pledge?', 'Diluncurkan 15 November 2022 di sela KTT G20 Bali dengan komitmen awal USD 20 miliar: USD 10 miliar dana publik IPG untuk memicu USD 10 miliar pembiayaan swasta dari GFANZ (laman Sekretariat JETP).', 'Launched on 15 November 2022 on the sidelines of the G20 Bali summit with an initial pledge of USD 20 billion: USD 10 billion of IPG public funds to catalyse USD 10 billion of private finance from GFANZ (JETP Secretariat site).'],
    ['Siapa saja anggota IPG?', 'Who are the IPG members?', 'Jepang dan Amerika Serikat sebagai ketua bersama, ditambah Kanada, Denmark, Uni Eropa, Jerman, Prancis, Norwegia, Italia, dan Inggris (laman Sekretariat JETP; peran AS setelah 2025 dibahas di bab Kasus).', 'Japan and the United States as co-leaders, plus Canada, Denmark, the European Union, Germany, France, Norway, Italy and the United Kingdom (JETP Secretariat site; the US role after 2025 is in the Cases chapter).'],
    ['Apa itu CIPP dan siapa menyusunnya?', 'What is the CIPP and who drafts it?', 'Comprehensive Investment and Policy Plan, dokumen hidup yang diperbarui berkala dan disusun Sekretariat JETP; Just Transition Thematic Report dirilis 18 Desember 2025 sebagai bagian pembaruan CIPP 2023.', 'The Comprehensive Investment and Policy Plan, a living document updated regularly and drafted by the JETP Secretariat; the Just Transition Thematic Report was released on 18 December 2025 as part of the CIPP 2023 update.'],
    ['Berapa kapasitas PLTU batu bara menurut data terbuka?', 'How much coal capacity is there per open data?', `GPPD v1.3.0 (2021) mencatat ${gp.length} PLTU batu bara dengan total ${Math.round(gmw).toLocaleString('id-ID')} MW di Indonesia (EST, tanpa pembangkit sesudah 2021).`, `GPPD v1.3.0 (2021) records ${gp.length} coal plants totalling ${Math.round(gmw).toLocaleString('en-US')} MW in Indonesia (EST, without plants after 2021).`],
    ['Apa beda pensiun dini, co-firing, dan retrofit?', 'What is the difference between early retirement, co-firing and retrofit?', 'Pensiun dini menghentikan PLTU sebelum umur ekonomisnya; co-firing mengganti sebagian batu bara dengan biomassa; retrofit mengubah pembangkit agar memakai bahan bakar atau teknologi lain.', 'Early retirement stops a plant before its economic life; co-firing replaces part of the coal with biomass; retrofit changes a plant to another fuel or technology.'],
    ['Apa itu kesepakatan sosial dalam transisi?', 'What is a social agreement in a transition?', 'Kesepakatan tertulis antara pemerintah, pengusaha, pekerja, dan masyarakat tentang dampak, kompensasi, dan alih keterampilan sebelum pembangkit atau tambang dihentikan (penjelasan editorial METI).', 'A written agreement among government, employers, workers and communities on impacts, compensation and reskilling before a plant or mine closes (METI editorial explanation).'],
    ['Apa itu pembangkit captive?', 'What are captive power plants?', 'Pembangkit milik industri untuk kebutuhan sendiri, sering PLTU kecil di kawasan smelter; Sekretariat JETP meluncurkan studi captive power pada Desember 2025 (judul berita laman resmi).', 'Industry-owned plants for own use, often small coal plants at smelter estates; the JETP Secretariat launched a captive power study in December 2025 (official site headline).'],
    ['Di mana angka pencairan JETP yang resmi?', 'Where is the official JETP disbursement figure?', 'Laman Sekretariat JETP menyebut JETP Progress Report 2025 dan laporan tematik; berkas laporannya tidak terbaca otomatis dari laman, sehingga naskah ini memakai IEEFA dan media dengan catatan beda angka. IEEFA memblokir akses otomatis (403).', 'The JETP Secretariat site cites a JETP Progress Report 2025 and thematic reports; the report file could not be read automatically from the site, so this text uses IEEFA and media with a note on differing figures. IEEFA blocks automated access (403).'],
  ]).butir);

  tambah(d, '3', 'butir', glos(['ed', 'jetpid'], [
    ['GFANZ', 'GFANZ', 'Glasgow Financial Alliance for Net Zero, aliansi lembaga keuangan swasta yang menjanjikan USD 10 miliar dalam JETP Indonesia.', 'Glasgow Financial Alliance for Net Zero, the private financial alliance that pledged USD 10 billion in JETP Indonesia.'],
    ['Pinjaman konsesional', 'Concessional loan', 'Pinjaman dengan bunga atau tenor lebih ringan dari pasar; contoh pinjaman JICA untuk MRT Jakarta East-West Line sebesar USD 1.027 juta yang dicatat sebagai JETP.', 'A loan with softer interest or tenor than the market; for example the JICA loan of USD 1,027 million for the MRT Jakarta East-West Line counted as JETP.'],
    ['Aset terdampar', 'Stranded asset', 'Aset yang nilainya turun atau hilang sebelum akhir umur karena perubahan kebijakan atau pasar, seperti PLTU yang pensiun dini.', 'An asset losing value before end of life due to policy or market change, such as an early-retired coal plant.'],
    ['Co-firing', 'Co-firing', 'Pembakaran biomassa bersama batu bara di PLTU yang ada.', 'Burning biomass together with coal in an existing coal plant.'],
    ['Retrofit', 'Retrofit', 'Mengubah pembangkit yang ada agar memakai bahan bakar atau teknologi lain.', 'Converting an existing plant to another fuel or technology.'],
    ['PLTU captive', 'Captive coal plant', 'PLTU untuk kebutuhan industri sendiri, di luar RUPTL PLN.', 'A coal plant for an industry\'s own use, outside the PLN RUPTL.'],
    ['Offtaker', 'Offtaker', 'Pembeli listrik; di Indonesia umumnya PLN.', 'The power buyer; generally PLN in Indonesia.'],
    ['Kesepakatan sosial', 'Social agreement', 'Kesepakatan pihak terdampak tentang kompensasi dan alih keterampilan.', 'An agreement of affected parties on compensation and reskilling.'],
    ['Alih keterampilan (reskilling)', 'Reskilling', 'Pelatihan pekerja agar pindah ke pekerjaan baru, misalnya energi terbarukan.', 'Training workers to move to new jobs, for instance in renewables.'],
    ['Hibah teknis', 'Technical assistance grant', 'Dana hibah untuk studi dan persiapan proyek, seperti hibah Patuha Unit-2.', 'Grant money for studies and project preparation, such as the Patuha Unit-2 grant.'],
    ['Pembiayaan campuran', 'Blended finance', 'Dana publik atau filantropi dipakai untuk menurunkan risiko dan menarik dana swasta.', 'Public or philanthropic money used to lower risk and attract private funds.'],
    ['Dana bagi hasil', 'Revenue-sharing fund', 'Dana pusat ke daerah penghasil, relevan bagi daerah tambang yang pendapatannya turun.', 'Central funds to producing regions, relevant to mining regions whose revenue falls.'],
    ['Diversifikasi ekonomi daerah', 'Regional economic diversification', 'Membangun sumber pendapatan baru di daerah yang bergantung batu bara.', 'Building new income sources in coal-dependent regions.'],
    ['Reklamasi pascatambang', 'Post-mining reclamation', 'Pemulihan lahan tambang, bagian biaya transisi tambang.', 'Restoring mined land, part of mine transition cost.'],
    ['Jaminan sosial pekerja', 'Worker social security', 'Perlindungan kehilangan pekerjaan dan pensiun; Koaksi mendorong Kemenaker melindungi pekerja terdampak.', 'Protection for job loss and pensions; Koaksi urges the Manpower Ministry to protect affected workers.'],
    ['Intensitas emisi listrik', 'Electricity emission intensity', 'Gram CO2 per kWh listrik; 680 gCO2/kWh pada 2024 menurut Ember lewat OWID.', 'Grams of CO2 per kWh of electricity; 680 gCO2/kWh in 2024 per Ember via OWID.'],
    ['Standar kinerja transisi adil', 'Just transition standard', 'Rujukan CIPP yang diperbarui; Just Transition Thematic Report menjelaskan kerangkanya (Des 2025).', 'The updated CIPP reference; the Just Transition Thematic Report explains the framework (Dec 2025).'],
    ['Pensiun alami', 'Natural retirement', 'PLTU dihentikan di akhir umur teknis tanpa percepatan.', 'A coal plant retired at end of technical life without acceleration.'],
    ['Kapasitas cadangan', 'Reserve capacity', 'Kapasitas di atas beban puncak; pensiun PLTU harus menjaga reserve margin.', 'Capacity above peak load; coal retirement must preserve the reserve margin.'],
    ['Kontrak PPA take-or-pay', 'Take-or-pay PPA', 'PPA yang mewajibkan pembeli membayar kapasitas walau tidak memakai; memperumit pensiun dini.', 'A PPA obliging the buyer to pay for capacity even if unused; it complicates early retirement.'],
    ['Kerangka JETP', 'JETP framework', 'Kemitraan antara pemerintah dan mitra internasional untuk transisi dari batu bara.', 'A partnership between government and international partners for a transition from coal.'],
  ]).butir);

  tambah(d, '4', 'paragraf', [
    T('Transisi berkeadilan berarti mengurangi batu bara tanpa membiarkan pekerja, tambang, dan daerah penghasil menanggung biayanya sendirian. Indonesia mencatat sedikitnya 70 PLTU batu bara di GPPD (29.333 MW) dan ribuan pekerja langsung di tiap klaster PLTU.', 'A just transition means reducing coal without leaving workers, mines and producing regions to bear the cost alone. GPPD records at least 70 Indonesian coal plants (29,333 MW) and thousands of direct workers at each plant cluster.'),
    T('Tiga lapis pekerjaan: pembangkit (pensiun dini, co-firing, retrofit), tambang (reklamasi dan diversifikasi), dan daerah (pendapatan dan layanan). JETP hanya satu alat; ia bekerja dengan kebijakan nasional seperti Permen ESDM 10/2025 tentang peta jalan transisi ketenagalistrikan.', 'Three layers of work: plants (early retirement, co-firing, retrofit), mines (reclamation and diversification) and regions (revenue and services). JETP is only one tool; it works with national policy such as Energy Ministry Reg. 10/2025 on the electricity transition road map.'),
  ]);

  pasang(d, '11', teks(['statpln', 'gppd'], pasarListrik().map((t) => [t.id, t.en]).concat([[`Dari ${gp.length} PLTU batu bara di GPPD (2021), ${gp.filter((x) => x.kapasitas_mw >= 600).length} berkapasitas 600 MW atau lebih (EST).`, `Of the ${gp.length} coal plants in GPPD (2021), ${gp.filter((x) => x.kapasitas_mw >= 600).length} have 600 MW or more (EST).`]])));

  pemain(d, [
    ['Sekretariat JETP Indonesia', ['Penyusun CIPP dan laporan kemajuan; lembaga donor dan koordinasi', 'Drafter of the CIPP and progress reports; donor and coordination body'], 'jetp-id.org', 'l_c455b2f724'],
    ['Kementerian Energi dan Sumber Daya Mineral', ['Penerbit peta jalan transisi (Permen 10/2025) dan RUPTL', 'Publisher of the transition road map (Reg. 10/2025) and approver of RUPTL'], 'Regulasi repo'],
    ['Kementerian Keuangan', ['Penjaminan pemerintah (Permen 5/2025) dan APBN', 'Government guarantees (Reg. 5/2025) and the state budget'], 'Regulasi repo'],
    ['Japan International Cooperation Agency', ['Pemberi pinjaman konsesional MRT East-West Line yang dicatat sebagai JETP', 'Concessional lender for the MRT East-West Line counted as JETP'], 'jetp-id.org'],
    ['Badan Pengelola Investasi Daya Anagata Nusantara', ['Pengelola investasi negara; calon pendana transisi', 'State investment manager; potential transition funder'], 'Direktori METI'],
    ['PT Sarana Multi Infrastruktur (Persero)', ['Platform pembiayaan campuran SDG Indonesia One', 'Blended-finance platform SDG Indonesia One'], 'Direktori METI'],
    ['PT PLN Indonesia Power', ['Pemilik/operator PLTU Suralaya dan lainnya', 'Owner/operator of the Suralaya coal plant and others'], 'GPPD'],
    ['PT PLN Nusantara Power', ['Operator PLTU PLN', 'Operator of PLN coal plants'], 'Direktori METI'],
    ['China Shenhua Energy', ['Perusahaan internasional berkepakaran batu bara di direktori', 'International company with coal expertise in the directory'], 'Direktori METI'],
    ['China Datang', ['Perusahaan internasional berkepakaran batu bara di direktori', 'International company with coal expertise in the directory'], 'Direktori METI'],
    ['China Guodian', ['Perusahaan internasional berkepakaran batu bara dan surya di direktori', 'International company with coal and solar expertise in the directory'], 'Direktori METI'],
    ['Korea South-East Power (KOEN)', ['Perusahaan pembangkit Korea berkepakaran batu bara dan surya di direktori', 'Korean generator with coal and solar expertise in the directory'], 'Direktori METI'],
    ['Global Environment Facility', ['Pendana hibah lingkungan', 'Environmental grant funder'], 'Direktori METI'],
    ['US International Development Finance Corporation (DFC)', ['Lembaga pembiayaan pembangunan AS tercatat di direktori; peran AS dalam JETP dibahas di bab Kasus', 'US development finance body listed in the directory; the US role in JETP is in the Cases chapter'], 'Direktori METI'],
    ['Dinas ESDM Provinsi Kalimantan Timur', ['Pemda provinsi batu bara terbesar; tuan rumah pekerja tambang', 'Government of a major coal province; host of mine workers'], 'Direktori METI'],
    ['Dinas ESDM Provinsi Sumatera Selatan', ['Pemda provinsi batu bara', 'Government of a coal province'], 'Direktori METI'],
    ['Dinas ESDM Provinsi Banten', ['Pemda lokasi PLTU Suralaya dan Labuhan', 'Government of the province of Suralaya and Labuhan'], 'Direktori METI'],
    ['Dinas ESDM Provinsi Jawa Tengah', ['Pemda lokasi PLTU Rembang, Cilacap, dan Pacitan sekitarnya', 'Government of the province of the Rembang and Cilacap plants'], 'Direktori METI'],
    ['Dinas ESDM Provinsi Jawa Timur', ['Pemda lokasi PLTU Paiton dan Pacitan', 'Government of the province of the Paiton and Pacitan plants'], 'Direktori METI'],
    ['Dinas ESDM Provinsi Bengkulu', ['Pemda provinsi batu bara dan panas bumi', 'Government of a coal and geothermal province'], 'Direktori METI'],
    ['Dinas ESDM Provinsi Kalimantan Tengah', ['Pemda provinsi batu bara', 'Government of a coal province'], 'Direktori METI'],
    ['Dinas ESDM Provinsi Bali', ['Pemda lokasi PLTU Celukan Bawang', 'Government of the province of the Celukan Bawang plant'], 'Direktori METI'],
    ['PT Pertamina (Persero)', ['BUMN energi; mitra transisi bahan bakar dan panas bumi', 'State energy company; partner in fuel transition and geothermal'], 'Direktori METI'],
  ], 'transisi-berkeadilan', 40);
  d.bab['9'].sumber.push('jetpid', 'gppd', 'pm10', 'pk5');

  /* bab 10: tambah PLTU dari GPPD (id WRI) dan beri id JETP pada baris lama */
  const jc = baca('public/data/jetp_cipp.json').baris; const jid = (nm) => jc.find((j) => j.nama === nm || j.nama_id === nm)?.id;
  d.bab['10'].baris.forEach((r) => { const i = jid(r.nama); if (i) r.id = i; });
  const pl = ['WRI1000921', 'WRI1000938', 'WRI1000982', 'WRI1000939', 'WRI1000990', 'WRI1075804', 'WRI1000916', 'WRI1000940', 'WRI1075812', 'WRI1075802', 'WRI1000915', 'WRI1000941'];
  for (const id of pl) { const g = gp.find((x) => x.id === cekId('gppd', id)); d.bab['10'].baris.push({ nama: g.nama, id, tek: 'batubara', mw: g.kapasitas_mw, status: T(`Beroperasi menurut GPPD 2021; pemilik: ${g.pemilik}`, `Operating per GPPD 2021; owner: ${g.pemilik}`) }); }
  d.bab['10'].per = 12; d.bab['10'].sumber.push('gppd');

  regulasi(d, {
    'permen-esdm-10-2025': ['Peta jalan transisi energi sektor ketenagalistrikan.', 'Road map of the electricity-sector transition.'],
    'permen-kemenkeu-5-2025': ['Penjaminan pemerintah dan penanggungan risiko untuk proyek ketenagalistrikan dan energi baru.', 'Government guarantees and risk coverage for electricity and new-energy projects.'],
    'uu-16-2016': ['Pengesahan Persetujuan Paris; dasar target iklim.', 'Ratification of the Paris Agreement; basis of climate targets.'],
    'permen-esdm-5-2025': ['Pedoman PJBL pembangkit energi terbarukan.', 'PPA guideline for renewable plants.'],
    'perpres-22-2017': ['RUEN: target bauran 2050.', 'RUEN: mix target to 2050.'],
    'lokal-431': ['RUU EBET, termasuk ketentuan transisi.', 'The New and Renewable Energy Bill, including transition provisions.'],
    'pp-40-2025': ['Kebijakan Energi Nasional 2025.', 'National Energy Policy 2025.'],
    'perpres-5-2006': ['Kebijakan Energi Nasional terdahulu.', 'The former National Energy Policy.'],
    'permen-esdm-19-2025': ['Pembangkit listrik tenaga hibrida.', 'Hybrid power plants.'],
    'inpres-14-2025': ['Percepatan kawasan swasembada pangan, energi, dan air nasional.', 'Acceleration of national food, energy and water self-sufficiency areas.'],
  });

  tambah(d, '13', 'butir', [
    { tanggal: '2022-11-15', judul: T('JETP Indonesia diluncurkan di sela KTT G20 Bali: komitmen awal USD 20 miliar', 'JETP Indonesia launched on the sidelines of the G20 Bali summit: initial pledge USD 20 billion'), url: 'https://jetp-id.org/' },
    { tanggal: '2025-12-18', judul: T('Just Transition Thematic Report dirilis sebagai bagian pembaruan CIPP', 'Just Transition Thematic Report released as part of the CIPP update'), url: 'https://jetp-id.org/' },
    { tanggal: '2025-12-17', judul: T('Sekretariat JETP meluncurkan studi captive power (judul berita laman resmi)', 'JETP Secretariat launches a captive power study (official site news headline)'), url: 'https://jetp-id.org/' },
    linReg('permen-esdm-10-2025', 'Permen ESDM 10/2025 peta jalan transisi sektor ketenagalistrikan', 'Energy Ministry Reg. 10/2025 electricity transition road map'),
    linReg('permen-kemenkeu-5-2025', 'Permen Kemenkeu 5/2025 penjaminan pemerintah', 'Finance Ministry Reg. 5/2025 on government guarantees'),
    linReg('uu-16-2016', 'UU 16/2016 mengesahkan Persetujuan Paris', 'Law 16/2016 ratifies the Paris Agreement'),
  ].map((x) => (Array.isArray(x) ? { tanggal: x[0], judul: T(x[1], x[2]), url: x[3] } : x)));
  d.bab['13'].butir.sort((a, b) => a.tanggal.localeCompare(b.tanggal));

  tambah(d, '14', 'paragraf', [
    T('Kewajiban 1, pensiun PLTU: berjalan lewat kesepakatan komersial PLN dan pemilik PLTU; kerangka Cirebon-1 lewat ADB menunjukkan perlunya persetujuan pembeli, pemilik, dan pendana (bab Kasus).', 'Duty 1, coal plant retirement: runs through commercial agreement between PLN and the plant owner; the ADB Cirebon-1 framework shows the need for buyer, owner and funder approval (Cases chapter).'),
    T('Kewajiban 2, penjaminan: Permen Kemenkeu 5/2025 mengatur penjaminan pemerintah dan penanggungan risiko untuk proyek ketenagalistrikan (judul regulasi).', 'Duty 2, guarantees: Finance Ministry Reg. 5/2025 governs government guarantees and risk coverage for power projects (regulation title).'),
    T('Kewajiban 3, peta jalan: Permen ESDM 10/2025 menjadi peta jalan transisi sektor ketenagalistrikan (judul regulasi).', 'Duty 3, road map: Energy Ministry Reg. 10/2025 is the electricity-sector transition road map (regulation title).'),
    T('Kewajiban 4, pekerja: perlindungan pekerja terdampak masuk tuntutan Koaksi kepada Kemenaker; aturan khusus transisi pekerja tidak ditemukan di basis regulasi repo.', 'Duty 4, workers: protection of affected workers is a Koaksi demand to the Manpower Ministry; no transition-specific worker rule was found in the repo regulation base.'),
    T('Insentif: pendanaan hibah, pinjaman konsesional, dan penjaminan dari JETP, ADB ETM, dan CIF ACT tercatat di bab Pembiayaan.', 'Incentives: grants, concessional loans and guarantees from JETP, the ADB ETM and CIF ACT are in the Financing chapter.'),
    T('Sanksi: tidak ada sanksi khusus transisi di sumber yang dibaca.', 'Sanctions: no transition-specific sanction in the sources read.'),
  ]);
  pakaiSumber(d, '14', 'pk5', 'pm10', 'direktori');

  tambah(d, '15', 'butir', langkah(['ed', 'jetpid'], [
    ['Petakan pembangkit dan pekerja', 'Map plants and workers', 'Daftar PLTU, umur, pemilik, kontrak PPA, dan jumlah pekerja langsung dan tidak langsung.', 'List plants, age, owner, PPA contract and the number of direct and indirect workers.', 'PLN, pemda, serikat pekerja', 'PLN, local governments, unions'],
    ['Rundingkan kesepakatan sosial', 'Negotiate a social agreement', 'Kompensasi, alih keterampilan, dan layanan daerah disepakati sebelum penghentian.', 'Compensation, reskilling and regional services agreed before shutdown.', 'Pemerintah, pengusaha, pekerja', 'Government, employers, workers'],
    ['Susun paket pendanaan', 'Assemble the funding package', 'Gabungkan hibah, pinjaman konsesional, dan jaminan; CIPP dan Sekretariat JETP menjadi rujukan.', 'Combine grants, concessional loans and guarantees; the CIPP and JETP Secretariat are the references.', 'Sekretariat JETP, IPG, ADB', 'JETP Secretariat, IPG, ADB'],
    ['Setujui dan laksanakan', 'Approve and execute', 'Persetujuan pemilik, PLN, dan pendana lalu pelaksanaan; Cirebon-1 menunjukkan risiko batal.', 'Approval by owner, PLN and funders then execution; Cirebon-1 shows the cancellation risk.', 'PLN, pemilik, pendana', 'PLN, owner, funders'],
  ]).butir);
  d.bab['15'].butir.forEach((x, i) => { x.judul = T(`${i + 1}. ${x.judul.id.replace(/^\d+\.\s*/, '')}`, `${i + 1}. ${x.judul.en.replace(/^\d+\.\s*/, '')}`); });

  tambah(d, '17', 'paragraf', [
    T('Opsi teknologi untuk PLTU: co-firing biomassa (kritik: memperpanjang masa batu bara, lihat pustaka CREA di Pustaka), retrofit ke bahan bakar lain, pengganti surya dan baterai di lokasi yang sama, dan penutupan penuh.', 'Technology options for coal plants: biomass co-firing (critique: prolongs coal, see the CREA paper in the Library), retrofit to other fuels, solar and battery replacement on the same site, and full closure.'),
    T('Lokasi PLTU yang sudah punya sambungan jaringan dan lahan dapat diisi surya dan baterai, sehingga aset jaringan tetap terpakai; tingkat kematangan dan biaya tidak dikutip karena tidak ada sumber tunggal yang dibaca.', 'Coal sites already with grid connection and land can host solar and batteries so grid assets stay in use; maturity and cost are not quoted as no single source was read.'),
  ]);

  d.bab['5'].rumus.push(
    T('Emisi tahunan PLTU (tCO2) = Energi dibangkitkan (MWh) x Faktor emisi (tCO2 per MWh)', 'Annual coal plant emissions (tCO2) = Energy generated (MWh) x Emission factor (tCO2 per MWh)'),
    T('Energi dibangkitkan (MWh) = Kapasitas (MW) x 8.760 x Faktor kapasitas', 'Energy generated (MWh) = Capacity (MW) x 8,760 x Capacity factor'),
    T('Komitmen terhadap persetujuan (persen) = Dana disetujui / Dana dijanjikan x 100', 'Approval ratio (percent) = Funds approved / Funds pledged x 100'),
  );
  d.bab['5'].contoh.push(T('Angka ilustrasi: PLTU 660 MW (seukuran Cirebon-1) dengan faktor kapasitas 70 persen membangkitkan 660 x 8.760 x 0,7 = sekitar 4,05 juta MWh per tahun (EST); dengan faktor emisi 0,9 tCO2 per MWh (asumsi) emisinya sekitar 3,6 juta tCO2.', 'Illustrative figures: a 660 MW coal plant (the size of Cirebon-1) at 70 percent capacity factor generates 660 x 8,760 x 0.7 = about 4.05 million MWh a year (EST); at an emission factor of 0.9 tCO2 per MWh (assumed) it emits about 3.6 million tCO2.'), T('Rasio persetujuan (angka sumber naskah): USD 3,1 miliar disetujui dari USD 21,4 miliar komitmen = sekitar 14,5 persen (IEEFA).', 'Approval ratio (figures from this text\'s sources): USD 3.1 billion approved of a USD 21.4 billion pledge = about 14.5 percent (IEEFA).'));
  pakaiSumber(d, '5', 'ed', 'ieefa');
  d.bab['6'].butir.push(...langkah(['ed', 'jetpid'], [
    ['Pendanaan transisi', 'Transition finance', 'Mitra IPG, GFANZ, ADB, dan CIF menyediakan hibah dan pinjaman.', 'IPG partners, GFANZ, ADB and CIF supply grants and loans.', 'Sekretariat JETP, ADB, IPG', 'JETP Secretariat, ADB, IPG'],
    ['Pemilik dan operator PLTU', 'Coal plant owners and operators', 'Menyetujui penghentian atau alih fungsi dan mengelola karyawan.', 'Agree to closure or conversion and manage staff.', 'PLN Indonesia Power, PLN Nusantara Power, IPP', 'PLN Indonesia Power, PLN Nusantara Power, IPPs'],
    ['Pekerja dan serikat', 'Workers and unions', 'Berunding kompensasi dan alih keterampilan.', 'Negotiate compensation and reskilling.', 'Serikat pekerja, Koaksi, Kemenaker', 'Unions, Koaksi, Manpower Ministry'],
    ['Pemda dan daerah penghasil', 'Local governments and producing regions', 'Menyusun diversifikasi ekonomi dan menutup celah pendapatan.', 'Draw up economic diversification and cover the revenue gap.', 'Dinas ESDM provinsi, Bappenas', 'Provincial energy offices, Bappenas'],
  ]).butir);
  tambah(d, '17', 'paragraf', [T('Baterai dan surya di lokasi PLTU memakai ulang sambungan jaringan; tracker batu bara dan GPPD membantu memetakan unit dan pemilik.', 'Batteries and solar at coal sites reuse grid connections; coal trackers and GPPD help map units and owners.'), T('Pemantauan emisi kontinu (CEMS) dan sistem pelacakan pekerja membantu mengukur kemajuan transisi; angka biaya tidak dikutip.', 'Continuous emission monitoring (CEMS) and worker tracking systems help measure transition progress; cost figures are not quoted.'), T('Pembangkit hibrida (Permen ESDM 19/2025) memadukan surya, baterai, dan sumber lain sehingga dapat menggantikan peran PLTU di sistem kecil.', 'Hybrid plants (Energy Ministry Reg. 19/2025) combine solar, batteries and other sources so they can replace a coal plant in small systems.'), T('Teknologi lain yang dibahas: CCS dan amonia co-firing (belum ada sumber biaya yang dibaca).', 'Other technologies discussed: CCS and ammonia co-firing (no cost source read).'), T('Tingkat kematangan tiap opsi tidak dikutip karena tidak ada sumber tunggal.', 'The maturity of each option is not quoted as there is no single source.')]);
  tambah(d, '4', 'paragraf', [T('Bagi anggota METI, transisi berkeadilan menentukan lokasi dan pendanaan proyek terbarukan di daerah batu bara, serta syarat sosial yang dibawa pemberi dana.', 'For METI members, a just transition determines the sites and funding of renewable projects in coal regions and the social conditions funders attach.')]);
  d.bab['20'].kolom.splice(1, 0, kol('iso2', 'ISO2', 'ISO2'));
  const iso = { 'Jerman: Ruhr': 'DE', 'Afrika Selatan': 'ZA', 'Indonesia': 'ID' };
  d.bab['20'].baris.forEach((r) => { const k = typeof r.negara === 'string' ? r.negara : r.negara.id; r.iso2 = Object.entries(iso).find(([n]) => k.startsWith(n))?.[1] || '-'; });
  const lama24 = d.bab['24'];
  pasang(d, '24', skema([
    ['sk_jetp', ['Kemitraan USD 20 miliar dari IPG dan GFANZ; pencairan dibahas di bab Kasus.', 'USD 20 billion partnership of the IPG and GFANZ; disbursement is discussed in the Cases chapter.']],
    ['sk_adb_etm', ['Mekanisme ADB untuk pensiun dini PLTU; kerangka Cirebon-1.', 'ADB mechanism for early retirement of coal plants; the Cirebon-1 framework.']],
    ['sk_cif_act', ['Dana CIF untuk percepatan transisi batu bara.', 'CIF fund for accelerating the coal transition.']],
    ['sk_gcf', ['Dana iklim multilateral untuk mitigasi dan adaptasi.', 'Multilateral climate fund for mitigation and adaptation.']],
    ['sk_sdg_one', ['Platform pembiayaan campuran SMI.', 'SMI blended-finance platform.']],
    ['sk_jica', ['Pinjaman ODA Jepang; pinjaman MRT East-West Line dicatat sebagai JETP.', 'Japanese ODA loans; the MRT East-West Line loan is counted as JETP.']],
    ['sk_acgf', ['Fasilitas ADB untuk pembiayaan hijau campuran.', 'ADB facility for blended green finance.']],
    ['sk_greenbook', ['Pinjaman luar negeri pemerintah lewat Green Book.', 'Government foreign loans via the Green Book.']],
  ], ['Angka komitmen, persetujuan, dan kebutuhan dana ada di bab Investasi; tabel ini memuat skema yang dapat dilamar.', 'Pledge, approval and funding-need figures are in the Investment chapter; this table lists schemes that can be applied for.']));
  pasang(d, '26', { ...lama24, catatan: T('Angka pembiayaan transisi dari bab Pembiayaan sebelumnya; nilai tersalur berbeda antarsumber.', 'Transition finance figures from the former Financing chapter; disbursed values differ among sources.') });
  tambah(d, '27', 'paragraf', [T('Dampak sosial: sekitar 4.666 pekerja langsung di tiga PLTU Langkat, Cilacap, dan Probolinggo (Green Network Asia); IESR menghitung kebutuhan Rp38,4 triliun untuk pekerja. Dampak lingkungan: intensitas emisi listrik 680 gCO2 per kWh (Ember, 2024).', 'Social impact: about 4,666 direct workers at three plants in Langkat, Cilacap and Probolinggo (Green Network Asia); IESR calculates a need of IDR 38.4 trillion for workers. Environmental impact: electricity emission intensity of 680 gCO2 per kWh (Ember, 2024).')]);
  pakaiSumber(d, '27', 'iesr_pekerja', 'green_net', 'owid');
  tambah(d, '29', 'paragraf', [
    T('Kontroversi 3, co-firing. Pendukung: menurunkan emisi PLTU tanpa membangun pembangkit baru. Penolak (CREA, Pustaka METI): memperpanjang usia batu bara dan memicu tekanan lahan biomassa. Dua sisi bersumber di pustaka.', 'Controversy 3, co-firing. Supporters: cuts coal plant emissions without building new plants. Opponents (CREA, METI Library): prolongs coal and pressures biomass land. Both sides are sourced in the library.'),
    T('Kontroversi 4, siapa membayar. Pemerintah dan mitra IPG berbeda dalam menilai hibah versus pinjaman; IEEFA dan The Conversation menilai pencairan jauh di bawah komitmen, sedangkan pemerintah menekankan paket yang disetujui. Angka resmi pencairan belum terbaca dari laman Sekretariat.', 'Controversy 4, who pays. Government and IPG partners differ on grants versus loans; IEEFA and The Conversation judge disbursement far below the pledge while government stresses approved packages. The official disbursement figure could not be read from the Secretariat site.'),
  ]);
  pakaiSumber(d, '29', 'ieefa', 'jp_rusak', 'jetpid');
  d.bab['30'].baris.push({ item: T('Tonggak 2045 dan 2060: tidak ada angka pensiun PLTU resmi di sumber yang dibaca selain target 2060 yang sudah tercantum', 'Milestones 2045 and 2060: no official coal retirement figure beyond the 2060 target already listed'), nilai: '-', tahun: '2045' });
  tambah(d, '31', 'paragraf', [T(...hp('pemda dan akademisi: provinsi batu bara (Kalimantan Timur, Sumatera Selatan, Banten) dapat menyusun peta pekerja dan rencana diversifikasi sebelum paket pendanaan datang.', 'local governments and academics: coal provinces (East Kalimantan, South Sumatra, Banten) can draw up worker maps and diversification plans before a funding package arrives.')), T(...hp('pengembang dan pemasok: lokasi PLTU berjaringan menarik untuk surya dan baterai; pemasok pelatihan dan alih keterampilan juga punya pasar.', 'developers and suppliers: grid-connected coal sites are attractive for solar and batteries; training and reskilling suppliers also have a market.'))]);
  tambah(d, '32', 'paragraf', [
    T('JETP Progress Report 2025 dan pembaruan CIPP berikutnya.', 'The JETP Progress Report 2025 and the next CIPP update.'), T('Hasil studi captive power Sekretariat JETP.', 'Results of the JETP Secretariat captive power study.'), T('Keputusan akhir Cirebon-1 dan PLTU berikutnya.', 'The final decision on Cirebon-1 and the next coal plant.'),
    T('Kebijakan pekerja terdampak di Kemenaker.', 'Affected-worker policy at the Manpower Ministry.'), T('Peran AS dan mitra IPG lain setelah 2025.', 'The role of the US and other IPG partners after 2025.'), T('Revisi data GPPD atau tracker batu bara pasca-2021.', 'Revisions of GPPD or coal tracker data after 2021.'), T('Implementasi Permen ESDM 10/2025.', 'Implementation of Energy Ministry Reg. 10/2025.'),
  ]);
  const pus = baca('public/data/pustaka.json').baris;
  for (const pid of ['pk-cirebon-1-indonesia-s-first-coal-to-renewables-milestone', 'pk-biomass-co-firing-in-indonesia-prolonging-not-solving-co', 'pk-indonesia-energy-transition-outlook-2025', 'pk-strategi-transisi-energi-berbasis-kewilayahan-menuju-ind']) { const p = pus.find((x) => x.id === cekId('pus', pid)); d.bab['36'].baris.push({ judul: p.judul, id: pid, url: '/pustaka?id=' + encodeURIComponent(pid), penerbit: p.penerbit || '-', mengapa: T('Dokumen di Pustaka METI', 'Document in the METI Library') }); }
  d.bab['36'].sumber.push('direktori');
  return pangkas(d);
}
