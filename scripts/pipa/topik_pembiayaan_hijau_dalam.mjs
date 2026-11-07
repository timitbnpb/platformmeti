// Pendalaman naskah Pembiayaan hijau (8 Nov 2026): id pendanaan, organisasi, regulasi dari repo; penjelasan baku instrumen.
import { T, S, hp, faq, glos, langkah, teks, tabel, kol, baca, tambah, pasang, pemain, regulasi, skema, linReg, cekId, sumberBaru, pakaiSumber, pangkas, regS, SDIREKTORI } from './topik_enam_lib.mjs';

export function dalam(d) {
  sumberBaru(d, {
    direktori: SDIREKTORI,
    jetpid: S('JETP Indonesia (laman resmi Sekretariat JETP): peluncuran 15 Nov 2022, komitmen awal USD 20 miliar (USD 10 miliar IPG dan USD 10 miliar swasta GFANZ), anggota IPG, CIPP', 'Sekretariat JETP Indonesia', 'https://jetp-id.org/', '2026-11-08', 2025, 'resmi'),
    pr110: regS('perpres-110-2025'), pk5: regS('permen-kemenkeu-5-2025'), uu16: regS('uu-16-2016'), ojk10: regS('ojk-10-2026'), pr112: regS('perpres-112-2022'), pm10: regS('permen-esdm-10-2025'),
  });

  tambah(d, '2', 'butir', faq(['ed', 'pendanaan', 'pk5', 'jetpid'], [
    ['Siapa yang menerbitkan green sukuk Indonesia?', 'Who issues Indonesia\'s green sukuk?', 'Kementerian Keuangan lewat DJPPR; seri global, ritel (ST), dan wholesale (PBSG) tercatat di tabel Penerbitan.', 'The Finance Ministry through DJPPR; global, retail (ST) and wholesale (PBSG) series are in the Issuance table.'],
    ['Bagaimana perusahaan swasta menerbitkan obligasi hijau?', 'How do private companies issue green bonds?', 'Lewat OJK dan Bursa Efek Indonesia; contohnya Arkora Hydro dan IIF dalam tabel Penerbitan. Skema Efek Hijau korporasi tercatat di direktori pendanaan (sk_efek_hijau).', 'Through OJK and the Indonesia Stock Exchange; examples are Arkora Hydro and IIF in the Issuance table. The corporate green securities scheme is in the funding directory (sk_efek_hijau).'],
    ['Apa itu penjaminan pemerintah untuk proyek ketenagalistrikan?', 'What is a government guarantee for power projects?', 'Permen Kemenkeu 5/2025 mengatur tata cara pemberian penjaminan pemerintah dan penanggungan risiko untuk proyek ketenagalistrikan dan energi baru (judul regulasi).', 'Finance Ministry Reg. 5/2025 governs government guarantees and risk coverage for electricity and new-energy projects (regulation title).'],
    ['Apa itu pembiayaan campuran?', 'What is blended finance?', 'Dana publik atau filantropi dipakai untuk menurunkan risiko sehingga dana swasta masuk; contoh SDG Indonesia One yang mengamankan USD 3,29 miliar (Jun 2025).', 'Public or philanthropic money lowers risk so private money comes in; an example is SDG Indonesia One, which secured USD 3.29 billion (Jun 2025).'],
    ['Apa beda hibah, pinjaman lunak, dan ekuitas?', 'What is the difference between a grant, a soft loan and equity?', 'Hibah tidak dikembalikan; pinjaman lunak dikembalikan dengan syarat ringan; ekuitas membeli kepemilikan dan menuntut imbal hasil (penjelasan editorial METI).', 'A grant is not repaid; a soft loan is repaid on easy terms; equity buys ownership and expects returns (METI editorial explanation).'],
    ['Apa itu greenwashing dan bagaimana taksonomi mencegahnya?', 'What is greenwashing and how does a taxonomy prevent it?', 'Klaim hijau tanpa dasar. TKBI memberi kriteria aktivitas yang dapat diklasifikasi; kritik atas TKBI dan penghapusan kategori kuning dan merah dibahas di bab Isu.', 'Green claims without basis. The TKBI gives criteria for classifiable activities; criticism of the TKBI and removal of the yellow and red categories are in the Issues chapter.'],
    ['Siapa saja pendana JETP?', 'Who funds JETP?', 'Kelompok mitra IPG (Jepang dan AS sebagai ketua bersama, Kanada, Denmark, Uni Eropa, Jerman, Prancis, Norwegia, Italia, Inggris) dan GFANZ (laman Sekretariat JETP).', 'The IPG partner group (Japan and the US as co-leaders, Canada, Denmark, the European Union, Germany, France, Norway, Italy, the UK) and GFANZ (JETP Secretariat site).'],
    ['Di mana saya mencari skema pendanaan yang bisa dilamar?', 'Where do I find funding schemes I can apply for?', 'Di tab Pendanaan METI (public/data/pendanaan.json): 24 skema dan 314 entri proyek berpendana; tabel bab Pembiayaan memuat 15 skema dengan id.', 'In the METI Funding tab (public/data/pendanaan.json): 24 schemes and 314 funded project entries; the Financing chapter table lists 15 schemes with ids.'],
  ]).butir);

  tambah(d, '3', 'butir', glos(['ed'], [
    ['Obligasi berkelanjutan', 'Sustainability bond', 'Obligasi yang hasilnya membiayai proyek hijau dan sosial.', 'A bond whose proceeds finance green and social projects.'],
    ['Sukuk ijarah', 'Ijarah sukuk', 'Sukuk berbasis sewa aset; bentuk sukuk hijau korporasi Arkora Hydro 2026.', 'A lease-based sukuk; the form of Arkora Hydro\'s 2026 corporate green sukuk.'],
    ['Green perpetual notes', 'Green perpetual notes', 'Surat utang tanpa jatuh tempo, dicatatkan di BEI oleh IIF pada 2023.', 'Debt with no maturity, listed on the IDX by IIF in 2023.'],
    ['PUB', 'PUB', 'Penawaran umum berkelanjutan, program penerbitan bertahap; IIF menerbitkan PUB 2023 pada Nov 2025.', 'A shelf offering programme in tranches; IIF issued its 2023 PUB in Nov 2025.'],
    ['Use of proceeds', 'Use of proceeds', 'Syarat hasil penerbitan hanya untuk proyek hijau yang memenuhi kerangka.', 'The condition that proceeds go only to green projects meeting the framework.'],
    ['Pelaporan alokasi dan dampak', 'Allocation and impact reporting', 'Laporan penggunaan dana dan dampak; DJPPR menerbitkan Green Sukuk Allocation and Impact Report.', 'A report on use of funds and impact; DJPPR publishes the Green Sukuk Allocation and Impact Report.'],
    ['Opini pihak kedua', 'Second-party opinion', 'Penilaian independen atas kerangka hijau penerbit.', 'Independent assessment of an issuer\'s green framework.'],
    ['Pinjaman konsesional', 'Concessional loan', 'Pinjaman dengan bunga atau tenor lebih ringan dari pasar.', 'A loan with softer interest or tenor than the market.'],
    ['Pembiayaan proyek', 'Project finance', 'Pinjaman tanpa jaminan induk, dibayar dari arus kas proyek; umum untuk PLTS dan PLTB.', 'Non-recourse loans repaid from project cash flow; common for solar and wind.'],
    ['Penjamin (guarantee)', 'Guarantee', 'Pihak yang menanggung pembayaran bila penerbit gagal, seperti IIF untuk sukuk Arkora hingga Rp645 miliar.', 'A party that covers payment if the issuer defaults, such as IIF for the Arkora sukuk up to IDR 645 billion.'],
    ['Biaya modal (WACC)', 'Cost of capital (WACC)', 'Rata-rata biaya dana ekuitas dan utang; penentu tarif proyek.', 'The average cost of equity and debt funds; a driver of project tariffs.'],
    ['Struktur menara pembiayaan', 'Capital stack', 'Susunan modal sponsor, utang senior, dan dana lunak dalam satu proyek.', 'The layering of sponsor equity, senior debt and soft funds in one project.'],
    ['Financial close', 'Financial close', 'Saat semua perjanjian pendanaan efektif dan dana dapat ditarik.', 'The point at which all financing agreements are effective and funds can be drawn.'],
    ['Risiko politik', 'Political risk', 'Risiko perubahan kebijakan atau pengambilalihan yang dapat ditanggung penjamin.', 'The risk of policy change or expropriation that a guarantor can cover.'],
    ['Risiko kurs', 'Currency risk', 'Risiko nilai tukar antara pendapatan rupiah dan utang dolar.', 'Exchange-rate risk between rupiah revenue and dollar debt.'],
    ['Pembiayaan iklim', 'Climate finance', 'Dana untuk mitigasi dan adaptasi iklim, dari sumber publik, swasta, dan campuran.', 'Funds for climate mitigation and adaptation from public, private and blended sources.'],
    ['Dana kekayaan negara (SWF)', 'Sovereign wealth fund (SWF)', 'Dana investasi negara; Danantara tercatat di direktori METI.', 'A state investment fund; Danantara is listed in the METI directory.'],
    ['Urun dana', 'Crowdfunding', 'Penghimpunan dana dari banyak investor kecil; contoh urun dana PLTS Asmat lewat Danamart.', 'Raising funds from many small investors; for example the Asmat solar crowdfunding via Danamart.'],
    ['Pajak karbon dan perdagangan karbon', 'Carbon tax and trading', 'Instrumen harga karbon yang menambah arus kas proyek; diatur Perpres 110/2025 dan POJK.', 'Carbon pricing instruments that add project cash flow; governed by Perpres 110/2025 and OJK rules.'],
    ['Kerangka keuangan hijau', 'Green finance framework', 'Dokumen penerbit yang menetapkan kriteria proyek, pengelolaan dana, dan pelaporan.', 'An issuer document setting project criteria, fund management and reporting.'],
    ['Dampak per rupiah', 'Impact per rupiah', 'Ukuran hasil lingkungan (ton CO2, MW) per dana yang dipakai.', 'A measure of environmental result (tCO2, MW) per fund used.'],
  ]).butir);

  tambah(d, '4', 'paragraf', [
    T('Pembiayaan hijau bukan satu produk melainkan susunan: hibah dan pinjaman lunak menurunkan risiko, penjamin menanggung gagal bayar, obligasi dan sukuk hijau menghimpun dana pasar, dan ekuitas sponsor menanggung risiko pertama. Proyek terbarukan padat modal di awal sehingga biaya modal menentukan tarif.', 'Green finance is not one product but a stack: grants and soft loans lower risk, guarantors cover default, green bonds and sukuk raise market funds, and sponsor equity takes the first loss. Renewable projects are capital-heavy upfront so the cost of capital sets the tariff.'),
    T('Di Indonesia, kerangka berlapis: taksonomi TKBI (OJK), pasar sukuk negara (DJPPR), platform campuran SDG Indonesia One (PT SMI), penjaminan (IIF dan Permen Kemenkeu 5/2025), serta kemitraan JETP yang diluncurkan 15 November 2022 dengan komitmen awal USD 20 miliar.', 'In Indonesia the framework is layered: the TKBI taxonomy (OJK), the sovereign sukuk market (DJPPR), the SDG Indonesia One blended platform (PT SMI), guarantees (IIF and Finance Ministry Reg. 5/2025) and the JETP partnership launched on 15 November 2022 with an initial USD 20 billion pledge.'),
    T('Pembeda utama dengan pembiayaan konvensional adalah pelaporan: pendana meminta bukti alokasi dan dampak, sehingga data proyek yang terukur menjadi syarat akses.', 'The main difference from conventional finance is reporting: funders ask for allocation and impact proof, so measured project data becomes an access condition.'),
  ]);
  pakaiSumber(d, '4', 'jetpid', 'pk5', 'sio', 'smi');

  d.bab['5'].rumus.push(
    T('Biaya modal rata-rata tertimbang (WACC) = Porsi ekuitas x Biaya ekuitas + Porsi utang x Biaya utang x (1 - tarif pajak)', 'Weighted average cost of capital (WACC) = Equity share x Cost of equity + Debt share x Cost of debt x (1 - tax rate)'),
    T('Greenium (basis poin) = Imbal hasil obligasi biasa - Imbal hasil obligasi hijau setara', 'Greenium (basis points) = Yield of a conventional bond - Yield of an equivalent green bond'),
    T('Rasio mobilisasi swasta = Dana swasta yang terhimpun / Dana publik yang dipakai', 'Private mobilisation ratio = Private funds raised / Public funds used'),
  );
  d.bab['5'].contoh.push(
    T('WACC (angka ilustrasi): 40 persen ekuitas berbiaya 12 persen, 60 persen utang berbiaya 8 persen, pajak 22 persen = 0,4 x 12 + 0,6 x 8 x 0,78 = sekitar 8,5 persen (EST).', 'WACC (illustrative figures): 40 percent equity at 12 percent, 60 percent debt at 8 percent, tax 22 percent = 0.4 x 12 + 0.6 x 8 x 0.78 = about 8.5 percent (EST).'),
    T('Rasio mobilisasi (angka sumber): JETP menargetkan USD 10 miliar swasta dari USD 10 miliar publik IPG, rasio 1,0 (laman Sekretariat JETP).', 'Mobilisation ratio (sourced figures): JETP targets USD 10 billion of private money against USD 10 billion of IPG public money, a ratio of 1.0 (JETP Secretariat site).'),
  );
  pakaiSumber(d, '5', 'ed', 'jetpid');

  pasang(d, '6', langkah(['ed', 'pendanaan', 'jetpid'], [
    ['Pembuat aturan dan taksonomi', 'Rule and taxonomy makers', 'OJK menyusun TKBI dan aturan efek hijau; Kemenkeu menetapkan penjaminan dan menerbitkan sukuk negara.', 'OJK drafts the TKBI and green securities rules; the Finance Ministry sets guarantees and issues sovereign sukuk.', 'OJK, Kementerian Keuangan, Bank Indonesia', 'OJK, Finance Ministry, Bank Indonesia'],
    ['Pendana publik dan donor', 'Public funders and donors', 'Hibah dan pinjaman lunak dari IPG, ADB, JICA, KfW, AIIB, GEF.', 'Grants and soft loans from the IPG, ADB, JICA, KfW, AIIB, GEF.', 'IPG, ADB, JICA, KfW, GEF', 'IPG, ADB, JICA, KfW, GEF'],
    ['Platform campuran dan penjamin', 'Blended platforms and guarantors', 'Menurunkan risiko agar dana swasta masuk.', 'Lower risk so private funds come in.', 'PT SMI, PT IIF', 'PT SMI, PT IIF'],
    ['Penerbit', 'Issuers', 'Pemerintah dan perusahaan menerbitkan obligasi dan sukuk hijau.', 'Government and companies issue green bonds and sukuk.', 'DJPPR, Arkora Hydro, IIF', 'DJPPR, Arkora Hydro, IIF'],
    ['Bank dan investor institusi', 'Banks and institutional investors', 'Membeli efek dan memberi pinjaman proyek.', 'Buy securities and lend to projects.', 'Bank, dana pensiun, asuransi', 'Banks, pension funds, insurers'],
    ['Pengembang proyek', 'Project developers', 'Memakai dana untuk membangun pembangkit terbarukan.', 'Use funds to build renewable plants.', 'Pengembang IPP', 'IPP developers'],
    ['Pemverifikasi', 'Verifiers', 'Opini pihak kedua dan audit alokasi.', 'Second-party opinion and allocation audits.', 'Lembaga verifikasi', 'Verification bodies'],
    ['Pelaporan dan pengawasan', 'Reporting and oversight', 'Laporan alokasi dan dampak; OJK mengawasi emisi efek.', 'Allocation and impact reports; OJK supervises securities issuance.', 'DJPPR, OJK, Sekretariat JETP', 'DJPPR, OJK, JETP Secretariat'],
  ]));

  pemain(d, [
    ['Otoritas Jasa Keuangan', ['Penyusun TKBI dan regulator efek hijau', 'Author of the TKBI and regulator of green securities'], 'OJK'],
    ['Kementerian Keuangan', ['Penerbit sukuk negara, pemberi penjaminan pemerintah (Permen 5/2025)', 'Issuer of sovereign sukuk and giver of government guarantees (Reg. 5/2025)'], 'DJPPR; regulasi repo'],
    ['PT Sarana Multi Infrastruktur (Persero)', ['Operator SDG Indonesia One dan pembiaya proyek', 'Operator of SDG Indonesia One and project financier'], 'PT SMI'],
    ['PT Indonesia Infrastructure Finance', ['Penerbit obligasi dan penjamin sukuk Arkora', 'Bond issuer and guarantor of the Arkora sukuk'], 'IIF'],
    ['Sekretariat JETP Indonesia', ['Penyusun CIPP dan portofolio JETP', 'Drafter of the CIPP and JETP portfolio'], 'jetp-id.org', 'l_c455b2f724'],
    ['Badan Pengelola Investasi Daya Anagata Nusantara', ['Dana kekayaan negara', 'Sovereign wealth fund'], 'Direktori METI'],
    ['Asian Development Bank', ['Pengelola ETM dan ACGF', 'Manager of the ETM and ACGF'], 'Direktori METI'],
    ['World Bank', ['Pemberi pinjaman dan penerbit data proyek (GREFI pipeline)', 'Lender and source of project data (GREFI pipeline)'], 'Direktori METI'],
    ['Japan International Cooperation Agency', ['Pinjaman ODA Jepang', 'Japanese ODA loans'], 'Direktori METI'],
    ['International Finance Corporation', ['Pembiaya sektor swasta Bank Dunia', 'World Bank private-sector financier'], 'Direktori METI'],
    ['Global Environment Facility', ['Pemberi hibah lingkungan', 'Environmental grant giver'], 'Direktori METI'],
    ['US International Development Finance Corporation (DFC)', ['Lembaga pembiayaan pembangunan AS', 'US development finance institution'], 'Direktori METI'],
    ['Japan Bank for International Cooperation', ['Bank kerja sama internasional Jepang', 'Japan\'s international cooperation bank'], 'Direktori METI'],
    ['Islamic Development Bank', ['Bank pembangunan Islam; calon pendana sukuk dan proyek', 'Islamic development bank; potential funder of sukuk and projects'], 'Direktori METI'],
    ['PT PLN (Persero)', ['Offtaker utama dan penerima pinjaman transmisi', 'Main offtaker and borrower for transmission'], 'Direktori METI'],
    ['PT Pertamina Geothermal Energy Tbk', ['Penerbit terbuka berkepakaran panas bumi', 'Listed issuer with geothermal expertise'], 'Direktori METI'],
    ['Kamar Dagang dan Industri Indonesia (Komite Tetap Energi Baru Terbarukan)', ['Wadah pengusaha; advokasi pembiayaan', 'Business forum; financing advocacy'], 'Direktori METI'],
    ['Badan Riset dan Inovasi Nasional', ['Pendana riset energi', 'Energy research funder'], 'Direktori METI'],
    ['Arkora Hydro', ['Penerbit obligasi dan sukuk hijau korporasi', 'Issuer of corporate green bonds and sukuk'], 'Tabel Penerbitan'],
    ['Bursa Efek Indonesia', ['Tempat pencatatan efek hijau dan IDXCarbon', 'Listing venue for green securities and IDXCarbon'], 'Direktori METI (skema IDXCarbon)'],
  ], 'pembiayaan-hijau', 45);
  d.bab['9'].sumber.push('pk5', 'jetpid', 'direktori');

  /* bab 10: beri id pendanaan pada baris penerbitan (cocok nama + tahun) */
  const PD = baca('public/data/pendanaan.json').pendanaan.filter((x) => /^pd_ob_/.test(x.id));
  d.bab['10'].baris.forEach((r) => { const p = PD.find((x) => x.nama === r.instrumen && String(x.tahun) === String(r.tahun)); if (p) { r.id = cekId('pend', p.id); } });
  /* bab 24: id pendanaan pada skema */
  const SK = baca('public/data/pendanaan.json').pendanaan; d.bab['24'].baris.forEach((r) => { const p = SK.find((x) => x.nama === r.nama && x.jenis_entri === 'skema'); if (p) { r.id = p.id; } });
  d.bab['24'].kolom[0] = { ...d.bab['24'].kolom[0], url: 'url' };

  regulasi(d, {
    'perpres-110-2025': ['Nilai ekonomi karbon: sumber pendapatan tambahan proyek hijau.', 'Carbon economic value: an extra revenue source for green projects.'],
    'permen-kemenkeu-5-2025': ['Penjaminan pemerintah dan penanggungan risiko proyek ketenagalistrikan.', 'Government guarantees and risk coverage for power projects.'],
    'ojk-10-2026': ['Perubahan POJK 14/2023 tentang perdagangan karbon lewat bursa karbon.', 'Amendment of OJK Reg. 14/2023 on carbon trading through the carbon exchange.'],
    'permen-esdm-10-2025': ['Peta jalan transisi energi ketenagalistrikan; dasar kebutuhan investasi.', 'Electricity transition road map; basis of investment needs.'],
    'permen-esdm-5-2025': ['Pedoman PJBL yang memengaruhi bankability proyek terbarukan.', 'PPA guideline affecting the bankability of renewable projects.'],
    'pp-60-1992': ['Obligasi Perum Listrik Negara (rujukan sejarah penerbitan obligasi sektor listrik).', 'Perum Listrik Negara bonds (historical reference for power sector bond issuance).'],
    'perpres-9-2011': ['Penugasan Pusat Investasi Pemerintah untuk memberi pinjaman dengan persyaratan lunak.', 'Assignment of the Government Investment Unit to give loans on soft terms.'],
    'permen-kemenkeu-20-2025': ['Subsidi listrik: konteks fiskal tarif.', 'Electricity subsidy: the fiscal context of tariffs.'],
  });
  pakaiSumber(d, '12', 'pr110', 'pk5', 'ojk10', 'pm10');

  tambah(d, '13', 'butir', [
    { tanggal: '2022-11-15', judul: T('JETP Indonesia diluncurkan: komitmen awal USD 20 miliar', 'JETP Indonesia launched: initial pledge of USD 20 billion'), url: 'https://jetp-id.org/' },
    linReg('uu-16-2016', 'UU 16/2016 mengesahkan Persetujuan Paris', 'Law 16/2016 ratifies the Paris Agreement'),
    linReg('perpres-110-2025', 'Perpres 110/2025 tentang nilai ekonomi karbon', 'Perpres 110/2025 on carbon economic value'),
    linReg('permen-kemenkeu-5-2025', 'Permen Kemenkeu 5/2025 tentang penjaminan pemerintah', 'Finance Ministry Reg. 5/2025 on government guarantees'),
    linReg('permen-esdm-10-2025', 'Permen ESDM 10/2025 peta jalan transisi', 'Energy Ministry Reg. 10/2025 transition road map'),
    linReg('ojk-10-2026', 'POJK 10/2026 mengubah POJK 14/2023 perdagangan karbon', 'OJK Reg. 10/2026 amends OJK Reg. 14/2023 on carbon trading'),
  ].map((x) => (Array.isArray(x) ? { tanggal: x[0], judul: T(x[1], x[2]), url: x[3] } : x)));
  d.bab['13'].butir.sort((a, b) => a.tanggal.localeCompare(b.tanggal));
  pakaiSumber(d, '13', 'jetpid', 'uu16', 'pr110', 'pk5', 'pm10', 'ojk10');

  pasang(d, '14', teks(['pk5', 'ojk10', 'pr110', 'ed', 'pendanaan'], [
    ['Kewajiban penerbit: efek hijau mengikuti ketentuan OJK dan kerangka hijau penerbit; pelaporan alokasi dan dampak dipraktikkan DJPPR untuk green sukuk.', 'Issuer duty: green securities follow OJK rules and the issuer\'s green framework; allocation and impact reporting is practised by DJPPR for green sukuk.'],
    ['Kewajiban peminjam: pinjaman luar negeri pemerintah memakai daftar Green Book Bappenas (sk_greenbook di direktori).', 'Borrower duty: government foreign loans use the Bappenas Green Book list (sk_greenbook in the directory).'],
    ['Penjaminan: Permen Kemenkeu 5/2025 mengatur tata cara penjaminan pemerintah dan penanggungan risiko (judul regulasi).', 'Guarantees: Finance Ministry Reg. 5/2025 governs government guarantees and risk coverage (regulation title).'],
    ['Karbon: Perpres 110/2025 dan POJK 10/2026 mengatur nilai ekonomi karbon dan perdagangan karbon yang dapat menambah arus kas proyek (judul regulasi).', 'Carbon: Perpres 110/2025 and OJK Reg. 10/2026 govern carbon economic value and carbon trading that can add project cash flow (regulation titles).'],
    ['Insentif fiskal: pembebasan bea masuk mesin dan barang modal pembangkitan, serta tax holiday tercatat di direktori pendanaan (sk_ins_bea_masuk_mesin, sk_ins_bea_masuk_pembangkit, sk_ins_tax_holiday).', 'Fiscal incentives: duty exemption for machinery and power generation capital goods, and tax holiday, are in the funding directory (sk_ins_bea_masuk_mesin, sk_ins_bea_masuk_pembangkit, sk_ins_tax_holiday).'],
    ['Insentif nonfiskal: akses ke platform campuran seperti SDG Indonesia One dan penjaminan IIF.', 'Non-fiscal incentives: access to blended platforms such as SDG Indonesia One and IIF guarantees.'],
    ['Sanksi: pelanggaran pelaporan efek mengikuti kewenangan OJK; rincian tidak dibaca di naskah ini.', 'Sanctions: securities reporting breaches fall under OJK authority; detail is not read in this text.'],
    ['Kewajiban kepatuhan taksonomi: TKBI bersifat panduan klasifikasi; apakah wajib dibahas di bab Isu (TKBI wajib atau tidak ada di FAQ).', 'Taxonomy compliance: the TKBI is a classification guide; whether it is mandatory is covered in the Issues chapter (FAQ).'],
  ]));

  pasang(d, '15', langkah(['ed', 'pendanaan'], [
    ['1. Siapkan kerangka hijau', '1. Prepare the green framework', 'Tentukan kriteria proyek, pengelolaan dana, dan pelaporan.', 'Set project criteria, fund management and reporting.', 'Penerbit', 'Issuer'],
    ['2. Klasifikasi menurut TKBI', '2. Classify under the TKBI', 'Cocokkan aktivitas dengan kategori taksonomi.', 'Match activities to taxonomy categories.', 'Penerbit, konsultan', 'Issuer, consultants'],
    ['3. Opini pihak kedua', '3. Second-party opinion', 'Minta penilaian independen atas kerangka.', 'Obtain an independent assessment of the framework.', 'Lembaga verifikasi', 'Verification body'],
    ['4. Pernyataan pendaftaran dan penawaran', '4. Registration statement and offering', 'Ajukan ke OJK dan catat di BEI.', 'File with OJK and list on the IDX.', 'OJK, BEI', 'OJK, IDX'],
    ['5. Penjaminan atau peningkatan kredit', '5. Guarantee or credit enhancement', 'Opsional: penjamin seperti IIF menambah peringkat.', 'Optional: a guarantor such as IIF lifts the rating.', 'IIF, SMI', 'IIF, SMI'],
    ['6. Penerbitan dan penjualan', '6. Issuance and sale', 'Tawarkan ke investor; sukuk negara lewat lelang atau ritel.', 'Offer to investors; sovereign sukuk via auction or retail.', 'Penerbit, penjamin emisi', 'Issuer, underwriters'],
    ['7. Alokasi dana', '7. Allocate proceeds', 'Dana hanya untuk proyek memenuhi kriteria.', 'Funds only for projects meeting the criteria.', 'Penerbit', 'Issuer'],
    ['8. Laporan alokasi dan dampak', '8. Allocation and impact report', 'Terbitkan tahunan; DJPPR contohnya.', 'Publish annually; DJPPR is an example.', 'Penerbit', 'Issuer'],
  ]));
  d.bab['15'].catatan = T('Lama dan biaya tiap langkah tidak ditemukan di sumber; urutan adalah ringkasan editorial METI dan harus dicek pada ketentuan OJK terbaru.', 'The duration and cost of each step were not found in sources; the order is a METI editorial summary to be checked against the latest OJK rules.');

  tambah(d, '17', 'paragraf', [
    T('Obligasi dan sukuk bertema hijau, sosial, dan berkelanjutan, dengan variasi terbaru: sukuk ijarah berkelanjutan berwawasan lingkungan (Arkora Hydro 2026) dan green perpetual notes (IIF 2023).', 'Green, social and sustainability-themed bonds and sukuk, with recent variants: sustainable environmental ijarah sukuk (Arkora Hydro 2026) and green perpetual notes (IIF 2023).'),
    T('Obligasi terkait keberlanjutan (sustainability-linked) mengikat kupon pada target kinerja; belum ada contoh dalam tabel Penerbitan.', 'Sustainability-linked bonds tie the coupon to performance targets; there is no example in the Issuance table yet.'),
    T('Urun dana proyek energi: Danamart mengumpulkan dana PLTS Asmat (direktori pendanaan pd_media_yekpltsdiasmat).', 'Energy project crowdfunding: Danamart raised funds for the Asmat solar plant (funding directory pd_media_yekpltsdiasmat).'),
    T('Pembiayaan platform campuran (SDG Indonesia One), penjaminan risiko politik, dan hasil perdagangan karbon sebagai arus kas tambahan.', 'Blended platform finance (SDG Indonesia One), political risk guarantees and carbon trading proceeds as extra cash flow.'),
    T('Teknologi data: pelaporan dampak digital dan registri karbon (SRN) memudahkan verifikasi; TRL tidak relevan untuk instrumen keuangan.', 'Data technology: digital impact reporting and the carbon registry (SRN) ease verification; TRL is not relevant to financial instruments.'),
    T('Biaya penerbitan dan greenium tidak dikutip kecuali yang ada di sumber bab Isu (Vietnam).', 'Issuance cost and greenium are not quoted except those in the Issues chapter sources (Vietnam).'),
  ]);
  pakaiSumber(d, '17', 'arkora', 'ed', 'pendanaan');

  d.bab['8'].kolom.splice(1, 0, kol('iso2', 'ISO2', 'ISO2'));
  const ISO = { Indonesia: 'ID', 'Viet Nam': 'VN', Philippines: 'PH', Thailand: 'TH', Malaysia: 'MY', Singapore: 'SG', 'Lao PDR': 'LA', Cambodia: 'KH', Myanmar: 'MM', 'Brunei Darussalam': 'BN' };
  d.bab['8'].baris.forEach((r) => { r.iso2 = ISO[r.negara] || '-'; });
  d.bab['20'].kolom.splice(1, 0, kol('iso2', 'ISO2', 'ISO2'));
  const I2 = { India: 'IN', Vietnam: 'VN', Indonesia: 'ID' };
  d.bab['20'].baris.forEach((r) => { const k = typeof r.negara === 'string' ? r.negara : r.negara.id; r.iso2 = Object.entries(I2).find(([n]) => k.startsWith(n))?.[1] || '-'; });

  tambah(d, '29', 'paragraf', [
    T('Kontroversi 3, JETP: komitmen atau uang tersalur. Pemerintah dan mitra menekankan paket yang disetujui; IEEFA dan The Conversation menilai pencairan jauh di bawah komitmen USD 21,4 miliar. Angka resmi pencairan belum terbaca dari laman Sekretariat JETP (laporan 2025 tersedia di sana tetapi berkasnya tidak terbaca otomatis).', 'Controversy 3, JETP: pledge or money disbursed. Government and partners stress approved packages; IEEFA and The Conversation judge disbursement far below the USD 21.4 billion pledge. The official disbursement figure could not be read from the JETP Secretariat site (the 2025 report is listed there but the file could not be read automatically).'),
    T('Kontroversi 4, pinjaman atau hibah. Pendukung pinjaman: cepat dan skala besar. Penolak: menambah utang proyek yang manfaatnya publik. Hipotesis METI: porsi hibah teknis untuk persiapan proyek menentukan jumlah proyek yang layak bank.', 'Controversy 4, loans or grants. Supporters of loans: fast and large scale. Opponents: they add debt to projects with public benefit. METI hypothesis: the grant share for project preparation determines how many projects become bankable.'),
  ]);
  pakaiSumber(d, '29', 'ieefa', 'jp_rusak', 'jetpid');
  d.bab['30'].baris.push({ item: T('Tonggak 2045 dan 2060: tidak ada proyeksi pembiayaan hijau resmi di sumber yang dibaca selain TKBI nol bersih', 'Milestones 2045 and 2060: no official green finance projection in the sources read beyond the TKBI net zero item'), nilai: '-', tahun: '2045' });
  tambah(d, '31', 'paragraf', [T(...hp('pengembang: siapkan data proyek terukur dan pilih skema dari tabel Pembiayaan; hibah teknis mempercepat financial close.', 'developers: prepare measured project data and choose a scheme from the Financing table; technical grants speed financial close.')), T(...hp('pemda dan akademisi: akses platform campuran dan dana riset; BRIN dan Kedaireka tercatat di direktori pendanaan.', 'local governments and academics: access blended platforms and research funds; BRIN and Kedaireka are in the funding directory.'))]);
  tambah(d, '32', 'paragraf', [
    T('JETP Progress Report 2025 dan angka pencairan resmi.', 'The JETP Progress Report 2025 and official disbursement figures.'), T('Revisi TKBI berikutnya dan status kategori kuning dan merah.', 'The next TKBI revision and the status of the yellow and red categories.'), T('Penerbitan green sukuk berikutnya (PBSG002 dan seri global).', 'The next green sukuk issues (PBSG002 and global series).'),
    T('Implementasi Permen Kemenkeu 5/2025 pada proyek pertama.', 'Implementation of Finance Ministry Reg. 5/2025 on the first project.'), T('Pipeline Bank Dunia GREFI dan skema CIF ACT.', 'The World Bank GREFI pipeline and the CIF ACT scheme.'), T('Implementasi Perpres 110/2025 dan POJK 10/2026 pada arus kas proyek.', 'Implementation of Perpres 110/2025 and OJK Reg. 10/2026 on project cash flows.'), T('Tren greenium sukuk negara.', 'Trend of the sovereign sukuk greenium.'),
  ]);
  const pus = baca('public/data/pustaka.json').baris;
  for (const pid of ['pk-indonesia-energy-transition-outlook-2025', 'pk-strategi-transisi-energi-berbasis-kewilayahan-menuju-ind', 'pk-reg-permen-kemenkeu-12-2025']) { const p = pus.find((x) => x.id === cekId('pus', pid)); d.bab['36'].baris.push({ judul: p.judul, id: pid, url: '/pustaka?id=' + encodeURIComponent(pid), penerbit: p.penerbit || '-', mengapa: T('Dokumen di Pustaka METI', 'Document in the METI Library') }); }
  d.bab['36'].sumber.push('direktori');
  return pangkas(d);
}
