# Riset pembanding: Platform Jaringan METI

Tanggal riset: 7 Nov 2026. Tujuan: merancang "Platform Jaringan METI" (Masyarakat Energi Terbarukan Indonesia) dengan memporting direktori jaringan kebencanaan (orang/pakar, lembaga, kampus, riset, wilayah, graf tautan silang) ke domain energi terbarukan, di Cloudflare Worker + D1 + R2, layar vanilla JS.

## 0. Catatan kejujuran sumber

Tiap klaim diberi status. Aturannya: hanya yang dibuka langsung hari ini yang disebut "terverifikasi". Sisanya dilabeli.

| Label | Arti |
| --- | --- |
| V | Dibuka langsung hari ini (halaman situs/dokumen resmi), isi cocok |
| P | Dari hasil pencarian web (cuplikan), belum dibuka halamannya; cek ulang sebelum dijadikan dasar keputusan |
| T | Tidak bisa diverifikasi: situs menolak akses otomatis (403/503/DNS), jadi deskripsi memakai pengetahuan umum dan WAJIB dicek manual |

Situs yang menolak akses otomatis hari ini: ENF Solar (403), IRENA Coalition for Action dan Project Navigator (403), SEIA (403), WindEurope (503), Crunchbase (403), IESR (403), LittleSis (halaman penjaga bot Anubis), RE-Source (domain tidak ditemukan; alamat salah atau berubah). ESDM One Map: gis.esdm.go.id tidak ada, alamat resminya harus dicari ulang (geoportal.esdm.go.id disebut berita 2017, belum dicek hidup). Dokumen UU PDP: ringkasan pasal dari pasal.id (V untuk yang tampil, tetapi pasal 15 dan 57 terpotong, jadi sengaja TIDAK dikutip detailnya; baca teks resmi di peraturan.bpk.go.id).

Angka batas Cloudflare di bagian 4 diambil dari dokumen developers.cloudflare.com hari ini (V), kecuali yang diberi label.

---

## 1. Tabel pembanding (28 pembanding)

Kolom: nama; URL; untuk siapa; entitas utama; fitur unggulan; model akses; layak ditiru; jangan ditiru. Label sumber di akhir sel nama.

### 1A. Direktori industri energi terbarukan

| # | Nama | URL | Untuk siapa | Entitas utama | Fitur unggulan | Akses | Layak ditiru | Jangan ditiru |
|---|---|---|---|---|---|---|---|---|
| 1 | ENF Solar (T/P) | enfsolar.com | Pembeli/installer/investor surya global | Perusahaan (kisaran 59.000-66.000, angka beda tiap halaman), produk (datasheet panel/inverter) | Direktori perusahaan + direktori produk saling tertaut; filter negara dan subkategori; profil gratis untuk semua yang terdaftar | Listing dasar gratis; paket iklan Gold/Platinum berbayar (template video, banner di profil pesaing, sponsor subkategori) (P: halaman enfsolar.com/advertising) | Profil perusahaan sebagai pusat; produk menempel pada perusahaan; paket gratis cukup lengkap supaya data terisi | Banner di profil pesaing dan sponsor kategori: merusak netralitas, METI adalah asosiasi, bukan media iklan |
| 2 | Solarplaza (V) | solarplaza.com | Industri surya dan penyimpanan, Eropa dan global | Perusahaan, acara, tender/permintaan proyek | "BizzBoard": pasar tempat organisasi memasang tender dan permintaan proyek; matchmaking C-level; Knowledge Hub; leads proyek berbasis AI | Akun dan registrasi perusahaan gratis; keanggotaan penuh membuka konten khusus anggota dan akses acara | Papan "dicari/ditawarkan" sebagai bentuk matchmaking paling sederhana; konten terkunci untuk anggota | Menggantungkan nilai pada acara berbayar; leads AI tanpa verifikasi bisa menyesatkan |
| 3 | SolarPower Europe (P) | solarpowereurope.org | Asosiasi industri surya Eropa, ~310 anggota | Anggota (perusahaan), forum kerja | Direktori anggota privat (kontak hanya untuk anggota) plus profil publik; forum: Battery Storage Europe Platform, European Inverters Forum, Skills Taskforce | Membership berbayar (skema tarif bertingkat); direktori kontak khusus anggota | Pemisahan profil publik vs kontak privat; kelompok kerja sebagai entitas kelas satu | Tarif tertinggi berat bagi UMKM; METI perlu tier ringan |
| 4 | WindEurope (P) | windeurope.org | Asosiasi angin Eropa, 600+ anggota organisasi | Anggota organisasi (bukan individu), working groups dan task forces | Direktori anggota; kelompok kerja menentukan posisi kebijakan; non-anggota tidak bisa ikut kelompok kerja | Berbayar; tarif per kategori dan status hukum | Keanggotaan organisasi (bukan individu) sebagai unit; tarif beda per kategori hukum (nirlaba lebih murah) | Dunia individu diabaikan; METI justru punya banyak anggota individu/pakar |
| 5 | SEIA (P) | seia.org | Asosiasi industri surya AS | Anggota perusahaan, komite negara bagian/federal | Tingkatan keanggotaan Basic ($900) sampai Terawatt ($190.000); pilihan "opt in" masuk direktori anggota di formulir pendaftaran; komite per wilayah | Berbayar bertingkat; direktori dengan persetujuan | Opt-in direktori di formulir (cocok UU PDP); nama tingkat memudahkan pemasaran | Rentang tarif sangat lebar; hindari tiering yang mengunci akses data publik |
| 6 | ACORE (P) | acore.org | Pasar keuangan energi bersih AS | Anggota (investor, developer, manufaktur, utilitas, pembeli korporat) | Finance Forum tahunan, member directory (halaman tidak dibuka), tingkat Leadership Council | Berbayar, ada sponsor | Pertemuan investor-developer sebagai produk inti; pembagian anggota per peran dalam transaksi | Nilai bergantung pada acara tatap muka; tanpa acara platformnya hampa |
| 7 | International Geothermal Association (P) | lovegeothermal.org | Komunitas panas bumi global | Anggota individu, korporat, institusi, organisasi afiliasi | Lima kategori keanggotaan; organisasi afiliasi (sekitar 30) membawa anggota individu tanpa iuran sendiri | Berbayar bertingkat | Model "afiliasi" cocok untuk METI (asosiasi daerah, himpunan kampus, forum teknologi) | Angka anggota tidak konsisten antar sumber; jangan menampilkan angka tak terverifikasi |

### 1B. Platform kolaborasi global dan lembaga multilateral

| # | Nama | URL | Untuk siapa | Entitas utama | Fitur unggulan | Akses | Layak ditiru | Jangan ditiru |
|---|---|---|---|---|---|---|---|---|
| 8 | IRENA Coalition for Action (T) | irena.org | Koalisi sektor swasta dan masyarakat sipil di bawah IRENA | Anggota, kelompok kerja, laporan | Kelompok kerja tematik, posisi kebijakan bersama (deskripsi dari pengetahuan umum, halaman 403) | Keanggotaan lewat pengajuan | Kelompok kerja tematik sebagai pengikat jaringan | Tidak bisa dinilai mendalam; cek manual |
| 9 | IRENA Project Navigator / Sustainable Energy Marketplace (T) | irena.org | Pengembang proyek dan pemodal | Proyek, pengembang, pemodal | Pencocokan proyek dan pendanaan; penyusunan proyek bankable (deskripsi dari pengetahuan umum, halaman 403) | Pendaftaran akun | Pola "proyek memenuhi pemodal" sebagai fase 2 | Tanpa pemeriksa kualitas proyek, marketplace mudah diisi proyek khayalan |
| 10 | Clean Energy Ministerial (V) | cleanenergyministerial.org | Pemerintah anggota (28) dan peserta (30) | Inisiatif, kampanye, negara | Enam sektor; tiap inisiatif punya halaman Berita, Acara, Sumber daya; ekstranet untuk anggota | Publik plus ekstranet | Sektor sebagai poros organisasi; satu inisiatif boleh muncul di banyak sektor (relasi banyak-ke-banyak) | Kriteria keanggotaan dan tata kelola tidak dijelaskan di halaman publik; METI harus terang |
| 11 | ASEAN Centre for Energy (V) | aseanenergy.org | Pemangku energi ASEAN; kantor di Jakarta | Publikasi, dasbor data, profil negara, inisiatif | ASEAN Energy Database System (AEDS), MAESTRO Dashboard, ASEAN Regional Industry Energy Database; 12 topik; Knowledge Hub | Sebagian publik, ada sign-in | Profil negara dan basis data per topik; relevan sebagai sumber data pendukung (bukan pesaing) | Tidak ada direktori orang/perusahaan; jangan menganggap sumber data sama dengan jaringan |
| 12 | REN21 (V) | ren21.net | Pemerintah, industri, masyarakat sipil, riset | Laporan (GSR), data, anggota | Global Status Report, tracker (RBE Tracker), "Data on-the-go", kalender acara; komunitas dengan pilihan kelompok pemangku kepentingan | Laporan publik; syarat keanggotaan tidak dijelaskan di halaman | Pemilihan kelompok pemangku kepentingan (pemerintah/industri/akademisi/LSM/media) sebagai taksonomi anggota | Keanggotaan tidak transparan; METI wajib menulis syaratnya |
| 13 | SEforALL (V) | seforall.org | Akses energi di negara berkembang | Program, kemitraan (450+), negara | Lima fokus; Mission 300; Energy Compacts; alat intelijen data | Publik | Laporan kemajuan komitmen (Energy Compacts) sebagai pola "janji terlacak" untuk anggota METI | Tidak ada matchmaking jelas di halaman utama |
| 14 | RE100 / The Climate Group (V sebagian) | theclimategroup.org/re100 | Perusahaan berkomitmen 100% listrik terbarukan | Perusahaan anggota, laporan tahunan | Pengungkapan wajib; kriteria teknis; (halaman utama dialihkan; detail tidak dibuka) | Keanggotaan berkomitmen | Komitmen publik terukur sebagai syarat lencana anggota | Pengungkapan wajib berat; METI jangan terlalu menuntut |
| 15 | RE-Source (T) | re-source.events (domain tidak ditemukan) | Pembeli korporat dan pemasok energi terbarukan Eropa | Pembeli, pemasok | Matchmaking pembeli-pemasok PPA; platform dan acara | Gratis/berbayar tidak diverifikasi | Gagasan pencocokan kebutuhan-penyedia | Alamat tidak terverifikasi; jangan mengutip fitur |
| 16 | Power Africa (P) | usaid.gov/powerafrica | Pengembang, pemodal, pemerintah Afrika | Transaksi, penasihat transaksi (40+), mitra swasta | Transaction advisors menyiapkan proyek; jaringan mitra publik-swasta; peta jalan 2016-2030 | Program donor; status 2025-2026 tidak terverifikasi | Dukungan transaksi (pendampingan proyek) sebagai layanan jaringan | Ketergantungan pada donor tunggal; model kerja berhenti saat dana berhenti |

### 1C. Data kebijakan, proyek, dan pengetahuan

| # | Nama | URL | Untuk siapa | Entitas utama | Fitur unggulan | Akses | Layak ditiru | Jangan ditiru |
|---|---|---|---|---|---|---|---|---|
| 17 | IEA Policies Database (V) | iea.org/policies | Analis kebijakan | 13.203 kebijakan dan ukuran | Filter: negara, wilayah, topik, teknologi, jenis kebijakan, rumpun kebijakan (ekonomi/legal/preskriptif/dst), status (berlaku/berakhir/diumumkan/tercapai), yurisdiksi; unduh CSV lewat API | Telusur tanpa login; unduhan memakai API | Taksonomi kebijakan dan status siklus hidup; sumber ganda (IEA dan JOIN IEA/IRENA) | Kartu hasil hanya nama-negara-tahun; tambah ringkasan dan tautan sumber |
| 18 | Climate Policy Radar (V) | climatepolicyradar.org | Peneliti, pembuat kebijakan | Hukum, kebijakan, NDC, perkara iklim, proyek dana multilateral | Pencarian berbasis konsep (bukan sekadar kata), API dan MCP terbuka, "semua terbuka" | Terbuka; akses awal lewat kontak | Pencarian konseptual untuk dokumen peraturan; API terbuka sejak awal | Tim ML besar; METI cukup FTS5 dulu |
| 19 | Global Energy Monitor wiki (V) | gem.wiki | Peneliti, jurnalis, LSM | Fasilitas/proyek (faktasheet), 25 dataset terbuka | Wiki MediaWiki: tiap fasilitas satu halaman, riwayat revisi, ambang cakupan per tracker (MW minimum) | Terbuka, lisensi CC BY-NC-SA 4.0; siapa saja boleh sunting | Riwayat revisi dan ambang cakupan yang tertulis; faktasheet per proyek | Sunting terbuka tanpa tinjauan terdokumentasi; lisensi NC membatasi pakai ulang komersial |
| 20 | IESR (P) | iesr.or.id | Pembuat kebijakan, publik Indonesia | Publikasi (IETO, Solar Energy Outlook), alat | Menu Data & Tools: kalkulator surya, LCOE, Indonesia Energy Policy Simulator, IESR-ESMI | Publik | Alat hitung kecil yang berguna bagi anggota (kalkulator) menarik trafik; IETO sebagai rujukan tahunan | Pustaka publikasi tanpa graf relasi; tidak ada direktori |
| 21 | ESDM One Map Indonesia (P) | geoportal ESDM (alamat tidak terverifikasi) | Pemerintah, investor | Lapisan spasial (~110 lapisan): potensi geologi, WIUP, wilayah kerja panas bumi, pembangkit, transmisi | Terintegrasi MOMI dan Migas Data Repository dan WebGIS BIG, BMKG, KLHK; mode publik dan internal | Publik terbatas, internal | Lapisan pembangkit dan transmisi sebagai latar peta METI (tautkan, jangan salin) | Atribut data tertutup; kualitas data tidak konsisten antar lapisan |
| 22 | Portal Satu Data Indonesia (V) | data.go.id | Publik | ~744.000 dataset (kementerian, provinsi, kab/kota) | Format XLSX/CSV/JSON; "Data Insight" per topik; tombol laporkan data tidak akurat; UU Satu Data Indonesia disahkan DPR 6 Okt 2026 (per portal) | Terbuka | Metadata standar dan jalur lapor ketidakakuratan; kewajiban kepatuhan format SDI untuk dataset yang METI terbitkan | Kurasi masih berjalan dan kualitas bervariasi; jangan jadi satu-satunya sumber |
| 23 | Katadata Insight Center (T) | katadata.co.id/insight | Korporat, pemerintah | Laporan, survei, databoks | Produk riset berbayar dan databoks gratis (URL halaman 404; deskripsi pengetahuan umum) | Campuran gratis/berbayar | Pola databoks: grafik ringkas gratis, laporan penuh berbayar | Tidak dapat dinilai; cek manual |

### 1D. Profil entitas, graf, dan pemetaan relasi

| # | Nama | URL | Untuk siapa | Entitas utama | Fitur unggulan | Akses | Layak ditiru | Jangan ditiru |
|---|---|---|---|---|---|---|---|---|
| 24 | Crunchbase (P) | crunchbase.com | Investor, sales, analis | Organisasi, orang, putaran pendanaan, investor | Profil perusahaan dengan firmografi; relasi investor-putaran-perusahaan; klaim profil | Akun gratis dengan kuota lihat profil; ekspor dan pencarian lanjut berbayar (angka kuota dan harga dari blog pihak ketiga, tidak pasti) | Pola profil: ringkasan, orang kunci, pendanaan, berita; tombol klaim | Paywall pada hampir semua yang berguna; METI tidak boleh meniru |
| 25 | Dealroom (V) | dealroom.co | Investor, korporat, pemerintah | Startup, pendiri, investor, ekosistem kota/wilayah | Dasbor ekosistem per kota; skor kecocokan investor; sinyal "baru berdiri"; API dan MCP | Demo dan login, berbayar | Dasbor ekosistem wilayah (jumlah perusahaan, tren) mirip "profil wilayah" di direktori kebencanaan; umpan sinyal | Skor kecocokan tertutup; METI harus menjelaskan rumus pencocokan |
| 26 | LinkedIn (pola; P) | linkedin.com | Profesional | Orang, perusahaan, grup, acara | Profil orang (pengalaman, keahlian, endorsement); halaman perusahaan; verifikasi | Gratis dengan batas, berbayar | Struktur profil orang (jabatan bertanggal, keahlian, afiliasi); endorsement sebagai sinyal kurasi | Menyalin data profil LinkedIn (melanggar ketentuan dan UU PDP); jangan scraping |
| 27 | LittleSis (P) | littlesis.org | Jurnalis, peneliti | Orang dan organisasi; 1,86 juta relasi | 12 kategori relasi (di antaranya Position, Social, Professional, Donation); tiap relasi wajib bersumber; API publik dan data unduhan; perangkat lunak sumber terbuka | Gratis, kontribusi relawan terkurasi | Model relasi dengan sumber wajib dan kategori terbatas; pengendalian kualitas oleh kurator | Metode "peta orang berkuasa" untuk orang yang tidak mengajukan diri; METI tidak boleh membangun profil tanpa persetujuan |
| 28 | Open Ownership BODS (V sebagian) | openownership.org | Regulator, jurnalis, kepatuhan | Pernyataan entitas, orang, relasi | Beneficial Ownership Data Standard (v0.4, Juni 2024); pengembangan dijeda sejak Nov 2025 | Standar terbuka | Bentuk "pernyataan" bertanggal (entitas, orang, relasi) sebagai pola data dengan jejak; vokabuler RDF | Struktur BODS terlalu berat untuk METI; ambil idenya, bukan seluruh skemanya |
| 29 | OpenCorporates (P) | opencorporates.com | Jurnalis, kepatuhan | Perusahaan (kunci gabungan jurisdiction_code + company_number) | API rekonsiliasi (OpenRefine); lisensi ODbL share-alike; token wajib; kuota gratis kecil | Terbuka untuk proyek terbuka, berbayar komersial | Kunci gabungan yurisdiksi+nomor untuk identitas perusahaan; rekonsiliasi nama ke entitas | Ketergantungan API pihak ketiga dengan kuota kecil |
| 30 | Graph Commons (V) | graphcommons.com | Peneliti jaringan, LSM | Simpul dan tepi bebas | Impor CSV/JSON/Excel/Sheets; ekspor CSV/JSON/GraphML/Cypher; sematkan graf interaktif; AI bantu bangun graf | Gratis (grafik publik), berbayar untuk privat | Impor/ekspor tabel sederhana; graf bisa disematkan di situs lain | Skema bebas membuat data tidak konsisten; METI perlu skema tetap |
| 31 | Kumu (V sebagian) | kumu.io | Pemetaan pemangku kepentingan dan sistem | Elemen dan koneksi | Peta pemangku kepentingan; pembuat presentasi; gratis daftar (detail harga di halaman lain) | Gratis dan berbayar | Tampilan "peta pemangku kepentingan" dengan filter dan penyorotan | Peta statis buatan tangan cepat basi |

### 1E. Platform asosiasi (keanggotaan, iuran, acara)

| # | Nama | URL | Untuk siapa | Fitur unggulan | Akses/harga | Layak ditiru | Jangan ditiru |
|---|---|---|---|---|---|---|---|
| 32 | Wild Apricot (P) | wildapricot.com | Organisasi kecil-menengah | Basis anggota cloud, formulir pendaftaran, direktori anggota terkunci portal, tagihan dan pengingat perpanjangan, acara dan registrasi | Trial 60 hari; harga naik tajam menurut jumlah kontak (keluhan pengguna) | Direktori di belakang portal anggota; pengingat perpanjangan otomatis | Harga per kontak yang melonjak; aplikasi seluler tertinggal dari web |
| 33 | MemberClicks (P) | memberclicks.com | Asosiasi menengah | Direktori anggota, penagihan iuran, komite, komunitas | Mulai kisaran $3.500-$4.500 per tahun (blog pihak ketiga) | Modul komite/kelompok kerja | Sulit disesuaikan alur nonstandar; pelaporan terbatas; mahal bagi METI |
| 34 | Glue Up (P) | glueup.com | Asosiasi dan kamar dagang | Iuran, perpanjangan, acara (hybrid), jaringan, CRM, email, bab/komite, lowongan | Harga tidak dipublikasi | Satu sistem untuk iuran+acara+jaringan; bab/chapter sebagai entitas | Komunitas anggota kosong jika anggota tak aktif; invoice dasar dikeluhkan kurang |

Kesimpulan tabel: 34 baris (31 platform jaringan/data/profil/graf, 3 sistem asosiasi), melampaui minimal 15. Yang benar-benar dibuka isinya hari ini (V): Solarplaza, CEM, ASEAN Centre for Energy, REN21, SEforALL, IEA Policies, Climate Policy Radar, GEM wiki, Satu Data Indonesia, Dealroom, Graph Commons, Kumu dan Open Ownership (sebagian). Sisanya P atau T sesuai label.

### 1F. Pelajaran dari tabel

1. Tidak ada direktori jaringan energi terbarukan Indonesia yang gratis, bergraf, dan terhubung silang antara orang, lembaga, kampus, riset, proyek, dan regulasi. IESR menerbitkan riset dan alat; ESDM One Map menerbitkan lapisan spasial; Satu Data menerbitkan dataset. Tidak satu pun menjawab "siapa mengenal siapa dan siapa bisa mengerjakan apa". Celah ini nyata dan sah sebagai nilai METI (kesimpulan dari pengamatan hari ini, bukan survei lengkap).
2. Pola paling umum: profil perusahaan sebagai pusat + direktori produk/proyek terkait (ENF) + keanggotaan bertingkat (SEIA, SolarPower Europe, WindEurope) + acara sebagai mesin uang (Solarplaza, ACORE).
3. Pola paling jarang dan paling bernilai: relasi bersumber (LittleSis) dan taksonomi kebijakan dengan siklus hidup (IEA).
4. Jebakan umum: paywall pada data dasar (Crunchbase, Dealroom), iklan yang mengganggu netralitas (ENF), keanggotaan tanpa syarat tertulis (REN21, CEM), data tak bersumber (GEM sunting terbuka).

---

## 2. Katalog fitur platform jaringan

Prioritas: **Wajib** = harus ada pada rilis pertama (fase 1); **Fase 2** = 3-6 bulan sesudah rilis; **Nanti** = setelah ada pengguna nyata. Kolom contoh memakai nomor tabel bagian 1.

### 2.1 Profil entitas

| Fitur | Deskripsi | Contoh | Prioritas |
|---|---|---|---|
| Profil orang/pakar | Nama, jabatan bertanggal, afiliasi, bidang (surya, angin, panas bumi, bioenergi, hidro, penyimpanan, hidrogen, dst), publikasi, kontak (opsional, atas persetujuan) | LinkedIn (26), direktori kebencanaan | Wajib |
| Profil lembaga (perusahaan, BUMN, asosiasi, LSM, pemerintah, mitra pembangunan) | Jenis, sektor, wilayah kerja, proyek, orang kunci, status anggota METI | ENF (1), Crunchbase (24) | Wajib |
| Profil kampus dan pusat studi | Fakultas/pusat, pakar, lab, riset, kemampuan uji | Direktori kampus kebencanaan | Wajib |
| Profil proyek/aset | Nama, teknologi, kapasitas MW, tahap (rencana/konstruksi/COD), lokasi, pengembang, pemodal, offtaker | GEM (19), Project Navigator (9) | Wajib (versi ringkas); rinci di fase 2 |
| Profil wilayah (provinsi/kab-kota) | Potensi, kapasitas terpasang, proyek, regulasi daerah, pelaku lokal | Dealroom (25), profil daerah kebencanaan | Wajib |
| Profil teknologi dan produk | Jenis teknologi; (produk bermerek: nanti) | ENF produk (1) | Teknologi wajib; produk nanti |
| Profil riset/publikasi | Judul, penulis, tahun, DOI, tautan, topik | Direktori riset kebencanaan | Wajib |
| Halaman kelompok kerja/komite METI | Tujuan, ketua, anggota, keluaran | WindEurope (4), SolarPower Europe (3) | Wajib |
| Lencana status (anggota, terverifikasi, komitmen) | Penanda terlihat di kartu | RE100 (14), LinkedIn (26) | Wajib |

### 2.2 Relasi dan graf

| Fitur | Deskripsi | Contoh | Prioritas |
|---|---|---|---|
| Tautan silang otomatis | Orang ke lembaga ke proyek ke publikasi ke wilayah | Direktori kebencanaan (hubung.mjs) | Wajib |
| Halaman "terhubung dengan" | Daftar relasi dikelompokkan per jenis | LittleSis (27) | Wajib |
| Graf interaktif ego (satu simpul + tetangga 1-2 langkah) | Telusur siapa terkait siapa | Kumu (31), Graph Commons (30) | Wajib |
| Graf global filter | Seluruh jaringan dengan filter jenis simpul/tepi/teknologi | Graph Commons | Fase 2 |
| Jalur terpendek ("bagaimana A mengenal B") | Pencarian rantai antar dua entitas | LittleSis | Nanti |
| Ukuran sentralitas dan komunitas | Menunjukkan penghubung kunci | Graph Commons (30) | Nanti |
| Sematkan graf di situs lain | Iframe/skrip | Graph Commons | Nanti |

### 2.3 Pencarian dan filter

| Fitur | Deskripsi | Contoh | Prioritas |
|---|---|---|---|
| Pencarian teks penuh lintas entitas | Satu kotak, hasil dikelompokkan per jenis; FTS5 | Climate Policy Radar (18) | Wajib |
| Filter facet | Teknologi, wilayah, jenis lembaga, status anggota, tahun | IEA (17), ENF (1) | Wajib |
| Pencarian semantik | Makna, bukan hanya kata (Vectorize) | Climate Policy Radar (18) | Fase 2 |
| Pencarian tersimpan dan peringatan | Notifikasi kriteria baru | Dealroom (25) | Nanti |
| Sinonim dan padanan Indonesia-Inggris | PLTS=solar PV, PLTB, PLTP, PLTA/PLTMH, biomassa | Kebutuhan lokal | Wajib (daftar sinonim kecil) |

### 2.4 Peta

| Fitur | Deskripsi | Contoh | Prioritas |
|---|---|---|---|
| Peta pelaku dan proyek | Titik per proyek/lembaga, klaster, filter | ESDM One Map (21), GEM (19) | Wajib (titik sederhana) |
| Peta koroplet wilayah | Kapasitas atau jumlah pelaku per provinsi/kab-kota | Dealroom (25) | Fase 2 |
| Tautan keluar ke lapisan ESDM (potensi, transmisi) | Tidak menyalin data | ESDM One Map (21) | Fase 2 |
| Lapisan transmisi dan WKP | Salin data publik bila lisensi jelas | ESDM One Map | Nanti |

### 2.5 Proyek dan pipeline

| Fitur | Deskripsi | Contoh | Prioritas |
|---|---|---|---|
| Daftar proyek dengan tahap | Rencana, pengadaan, konstruksi, operasi, ditunda | GEM (19) | Wajib |
| Pipeline per teknologi dan wilayah | Agregat MW per tahap | GEM, RE-Source (15) | Fase 2 |
| Proyek mencari mitra (EPC, pemodal, offtaker) | Profil proyek membuka "kebutuhan" | Power Africa (16) | Fase 2 |
| Pelacak janji/komitmen anggota | Target dan realisasi | SEforALL Energy Compacts (13) | Nanti |

### 2.6 Regulasi dan kebijakan

| Fitur | Deskripsi | Contoh | Prioritas |
|---|---|---|---|
| Basis peraturan | UU, PP, Perpres, Permen ESDM, Perda, SK; status (berlaku, dicabut, diubah) | IEA (17) | Wajib |
| Tautan regulasi ke proyek/teknologi/wilayah | "Aturan yang berlaku pada PLTS atap di wilayah X" | IEA, Climate Policy Radar (18) | Fase 2 |
| Riwayat perubahan dan peta keterkaitan antar peraturan | Mengubah/mencabut/melaksanakan | JDIH | Fase 2 |
| Pemantau rancangan peraturan dan konsultasi publik | Notifikasi | CPR (18) | Nanti |

### 2.7 Acara

| Fitur | Deskripsi | Contoh | Prioritas |
|---|---|---|---|
| Kalender acara METI dan mitra | Tanggal, tempat, pembicara, tautan daftar | REN21 (12), Solarplaza (2) | Wajib |
| Registrasi dan tiket | Formulir, kuota, pembayaran | Glue Up (34), Wild Apricot (32) | Fase 2 |
| Pembicara dan peserta terhubung ke profil | Tautan silang acara-orang | Direktori kebencanaan | Fase 2 |
| Rekaman dan materi pasca-acara | Slide, video | ACORE (6) | Nanti |

### 2.8 Keanggotaan dan iuran

| Fitur | Deskripsi | Contoh | Prioritas |
|---|---|---|---|
| Pendaftaran anggota online dan persetujuan pengurus | Formulir, dokumen, status | Wild Apricot (32) | Wajib |
| Kategori keanggotaan | Korporat, individu, mitra kampus, afiliasi (asosiasi daerah/himpunan) | IGA (7), SEIA (5), WindEurope (4) | Wajib (aturan tertulis; tarif oleh METI) |
| Penagihan iuran dan pengingat perpanjangan | Faktur, status bayar, pengingat | Wild Apricot, Glue Up | Fase 2 (awal: catat manual, unggah bukti) |
| Gerbang kontak privat anggota | Kontak hanya untuk anggota | SolarPower Europe (3) | Wajib |
| Kelompok kerja dan komite | Keanggotaan, agenda, notulen | WindEurope, SolarPower Europe | Fase 2 |
| Sertifikat dan kartu anggota | Kode QR verifikasi | Glue Up | Nanti |

### 2.9 Matchmaking (kebutuhan dan penyedia)

| Fitur | Deskripsi | Contoh | Prioritas |
|---|---|---|---|
| Papan "dicari/ditawarkan" | Pos terstruktur: jenis, teknologi, wilayah, tenggat | Solarplaza BizzBoard (2) | Fase 2 |
| Pencocokan otomatis yang dijelaskan | Skor dengan alasan (teknologi, wilayah, kapasitas) | Dealroom (25), Project Navigator (9) | Fase 2 (aturan jelas dulu) |
| Permintaan perkenalan lewat METI | Sekretariat memfasilitasi | SolarPower Europe (3) | Wajib (alur manual, formulir) |

### 2.10 Peluang investasi dan tender

| Fitur | Deskripsi | Contoh | Prioritas |
|---|---|---|---|
| Daftar peluang (proyek siap investasi, lelang) | Dari sumber publik (PLN, ESDM, pemda) | RE-Source (15), Project Navigator (9) | Fase 2 |
| Data room ringan | Dokumen disaring | Power Africa (16) | Nanti |

### 2.11 Publikasi dan pengetahuan

| Fitur | Deskripsi | Contoh | Prioritas |
|---|---|---|---|
| Pustaka laporan/studi METI dan mitra | Metadata, topik, tautan atau R2 | REN21 (12), IESR (20) | Wajib |
| Alat hitung kecil | Kalkulator PLTS atap/LCOE | IESR (20) | Nanti |
| Rujukan data terbuka | Tautan ke Satu Data, ASEAN AEDS | (11), (22) | Fase 2 |

### 2.12 Berita

| Fitur | Deskripsi | Contoh | Prioritas |
|---|---|---|---|
| Berita METI dan kutipan media dengan tautan sumber | Hanya judul+ringkasan pendek+tautan (hak cipta) | Solarplaza (2) | Fase 2 |
| Penandaan entitas pada berita | Berita tertaut ke lembaga/proyek | Dealroom (25) | Nanti |

### 2.13 Notifikasi

| Fitur | Deskripsi | Contoh | Prioritas |
|---|---|---|---|
| Surel ringkasan berkala (mingguan) | Anggota baru, acara, regulasi | REN21 (12) | Fase 2 |
| Peringatan untuk entitas yang diikuti | Perubahan profil/proyek | Crunchbase (24) | Nanti |
| Notifikasi WA lewat bot | Pola bot WA repo kebencanaan | repo ini | Nanti |

### 2.14 Analitik dan dasbor

| Fitur | Deskripsi | Contoh | Prioritas |
|---|---|---|---|
| Dasbor jaringan publik | Jumlah anggota, pakar, proyek, kapasitas per teknologi dan wilayah | Dealroom (25), ASEAN (11) | Wajib (angka sederhana, bersumber dan bertanggal) |
| Dasbor pengurus | Pendaftar menunggu, iuran jatuh tempo, profil kedaluwarsa, kualitas data | Glue Up (34) | Fase 2 |
| Analitik kepadatan (celah): wilayah/teknologi tanpa pakar | Menunjukkan kekosongan | Direktori kebencanaan | Fase 2 |

### 2.15 Ekspor

| Fitur | Deskripsi | Contoh | Prioritas |
|---|---|---|---|
| Ekspor CSV/JSON hasil filter | Untuk entitas yang berstatus publik | IEA (17), Graph Commons (30) | Wajib |
| Ekspor PDF profil/dasbor | Untuk paparan | repo kebencanaan (PDF kit) | Fase 2 |
| Ekspor tepi graf (GraphML) | Untuk analis | Graph Commons | Nanti |

### 2.16 API terbuka

| Fitur | Deskripsi | Contoh | Prioritas |
|---|---|---|---|
| API baca JSON untuk data publik | Pencarian, entitas, relasi | Climate Policy Radar (18), LittleSis (27) | Fase 2 (rute /api/publik/* tanpa kunci, batas laju) |
| Kunci API dan kuota | Untuk mitra | OpenCorporates (29) | Nanti |
| Dokumentasi skema (OpenAPI) | | | Fase 2 |

### 2.17 Kurasi dan verifikasi data

| Fitur | Deskripsi | Contoh | Prioritas |
|---|---|---|---|
| Status verifikasi per rekaman | belum/dikurasi/diverifikasi-sumber/diverifikasi-pemilik | LittleSis (27), GEM (19) | Wajib |
| Sumber dan tanggal tiap fakta | Tautan sumber, tanggal ambil | LittleSis (27) | Wajib |
| Antrean kurasi pengurus | Persetujuan perubahan | | Wajib |
| Riwayat revisi | Siapa mengubah apa | GEM (19) | Wajib |
| Deteksi duplikat dan penggabungan | Lihat bagian 3 | OpenCorporates (29) | Wajib |
| Jadwal kedaluwarsa profil | Penanda "terakhir diperbarui" dan pengingat | | Fase 2 |

### 2.18 Klaim profil

| Fitur | Deskripsi | Contoh | Prioritas |
|---|---|---|---|
| Klaim profil orang | Verifikasi surel (magic link) ke surel yang tercantum atau domain institusi | LinkedIn (26), Crunchbase (24) | Wajib |
| Klaim profil lembaga | Surel domain lembaga + persetujuan pengurus METI | Crunchbase | Wajib |
| Permintaan koreksi/penghapusan tanpa akun | Formulir publik | UU PDP | Wajib |

### 2.19 Moderasi

| Fitur | Deskripsi | Contoh | Prioritas |
|---|---|---|---|
| Antrean laporan (konten salah/menyinggung) | Tombol lapor di tiap profil | Satu Data (22) tombol lapor | Wajib |
| Peran: pengunjung, anggota, kurator, admin | Hak tegas | | Wajib |
| Log audit | Semua suntingan admin | | Wajib |

### 2.20 Privasi

| Fitur | Deskripsi | Contoh | Prioritas |
|---|---|---|---|
| Tingkat tampilan per bidang (publik/anggota/privat) | Kontak, telepon, surel default tidak publik | SolarPower Europe (3), SEIA opt-in (5) | Wajib |
| Persetujuan eksplisit dan catatan persetujuan | Waktu, versi teks, tujuan | UU PDP pasal 20-22 | Wajib |
| Hak subjek data (akses, koreksi, hapus, tarik persetujuan, portabilitas) | Formulir dan alur | UU PDP pasal 5-13 | Wajib |
| Ekspor data pribadi sendiri | JSON | UU PDP pasal 13 | Fase 2 |
| Pemberitahuan insiden 3x24 jam | Prosedur | UU PDP pasal 46 | Wajib (prosedur tertulis) |

---

## 3. Model data relasi dan dedup

### 3.1 Jenis simpul (entitas)

`orang`, `lembaga` (dengan `jenis`: perusahaan, bumn, asosiasi, lsm, pemerintah, kampus, mitra_pembangunan, lembaga_keuangan), `proyek`, `wilayah`, `teknologi`, `publikasi`, `regulasi`, `acara`, `kelompok_kerja`.

Aturan dari pola LittleSis dan OpenCorporates: satu tabel entitas umum bersama tabel detail per jenis; kunci bisnis dari identitas luar sebagai kolom terpisah (NPWP/NIB/AHU untuk lembaga, ORCID/Scopus/Google Scholar untuk peneliti, kode wilayah Kemendagri/BPS untuk wilayah, DOI untuk publikasi, nomor peraturan untuk regulasi, kode LEI jika ada).

### 3.2 Jenis tepi (relasi)

Rancangan jenis tepi untuk METI. Tiap tepi: `dari`, `ke`, `jenis`, `mulai`, `selesai` (nullable), `sumber_url`, `sumber_tanggal`, `status_verifikasi`, `dibuat_oleh`.

| Jenis tepi | Dari ke | Pola pembanding |
|---|---|---|
| `bekerja_di` (jabatan, mulai, selesai) | orang ke lembaga | LittleSis "Position" (27), LinkedIn (26) |
| `anggota_dari` (kategori, sejak) | lembaga/orang ke METI atau kelompok kerja | IGA afiliasi (7), SEIA (5) |
| `afiliasi_dengan` | orang ke kampus (dosen, peneliti tamu) | |
| `mendanai` (nilai, tahun) | lembaga ke proyek/lembaga/riset | Crunchbase investor-putaran (24), CPR proyek dana (18) |
| `mengembangkan_proyek` | lembaga ke proyek | GEM (19) |
| `memiliki` (persentase) | lembaga ke lembaga/proyek | Open Ownership (28), GEM Energy Ownership Tracker |
| `membeli_listrik_dari` (offtaker) | lembaga ke proyek | PPA, RE-Source (15) |
| `menulis` | orang ke publikasi | direktori riset |
| `meneliti` | lembaga/orang ke teknologi/topik | |
| `mengatur` | regulasi ke teknologi/wilayah/jenis lembaga | IEA (17), CPR (18) |
| `mengubah/mencabut/melaksanakan` | regulasi ke regulasi | JDIH |
| `berlokasi_di` | proyek/lembaga ke wilayah | |
| `bermitra_dengan` (jenis kemitraan) | lembaga ke lembaga | CEM (10) |
| `berbicara_di`, `menghadiri` | orang ke acara | |
| `memimpin`, `anggota_kelompok` | orang ke kelompok kerja | WindEurope (4) |
| `membimbing` | orang ke orang | LittleSis "Professional" |

Prinsip: batasi pada ~15 jenis (LittleSis memakai 12 kategori); jenis baru butuh persetujuan kurator. Tepi bertanggal supaya riwayat jabatan tidak hilang. Tepi tanpa sumber hanya boleh berstatus "belum".

### 3.3 Pola dedup entitas

1. **Kunci kuat dulu.** Lembaga: NPWP/NIB/nomor AHU; peneliti: ORCID/Scopus/Sinta; publikasi: DOI; regulasi: jenis+nomor+tahun. Kecocokan kunci kuat = otomatis satu entitas (pola OpenCorporates: kunci gabungan yurisdiksi+nomor).
2. **Normalisasi nama.** Huruf kecil, hapus gelar (Dr., Ir., S.T., M.Sc., Prof.) dan badan hukum (PT, CV, Tbk, Persero), hapus tanda baca, urutkan token; singkatan dipetakan ("PLN" = "Perusahaan Listrik Negara"). Simpan alias di tabel `alias`.
3. **Kecocokan lunak** dengan skor: kemiripan nama (trigram atau Jaro-Winkler di sisi JS), kesamaan afiliasi, wilayah, tahun. Skor tinggi = usul gabung; skor sedang = antrean kurator; rendah = pisah. Jangan gabung otomatis untuk orang tanpa kunci kuat (risiko menyatukan dua orang berbeda lebih mahal daripada duplikat).
4. **Penggabungan tidak merusak.** Entitas yang kalah menjadi alias dan `digabung_ke`; tepi dialihkan; riwayat disimpan; ada tombol pisah ulang. Pola graf direktori kebencanaan ("satu orang = satu profil") dipakai sama.
5. **Rekonsiliasi massal pada impor** (pola OpenRefine/OpenCorporates, 29): impor CSV masuk tabel `staging`, dicocokkan, kurator menyetujui.
6. **Anotasi sumber** tiap atribut yang berasal dari sumber berbeda; konflik antar-sumber ditandai, bukan ditimpa.

---

## 4. Pola teknis untuk Cloudflare

### 4.1 Batas free tier (verifikasi dokumen Cloudflare, 7 Nov 2026)

| Layanan | Batas Free | Berbayar | Sumber |
|---|---|---|---|
| Workers | 100.000 permintaan/hari (reset 00:00 UTC), CPU 10 ms/invokasi, 50 subrequest, 5 Cron Trigger/akun, bundel 64 MiB, memori 128 MB | tanpa batas harian, CPU sampai 5 menit, 10.000 subrequest, 250 cron | developers.cloudflare.com/workers/platform/limits (V) |
| D1 | 5 juta baris dibaca/hari, 100.000 baris ditulis/hari, 5 GB total, 10 database, 500 MB per database, 50 query per invokasi | 10 GB per database, 1.000 query/invokasi, 1 TB total | .../d1/platform/pricing dan .../d1/platform/limits (V) |
| R2 | 10 GB-bulan, 1 juta operasi Class A/bulan, 10 juta operasi Class B/bulan, tanpa biaya egress | berbayar menurut pemakaian | .../r2/pricing (V) |
| Vectorize | 30 juta dimensi vektor terkueri/bulan, 5 juta dimensi vektor tersimpan, 100 indeks; maks 1.536 dimensi, 20 juta vektor/indeks, metadata 10 KiB | | .../vectorize/platform/pricing dan limits (V) |
| Access (Zero Trust) | Paket Free untuk tim kurang dari 50 pengguna; One-time PIN tersedia; kebijakan grup tidak jalan dengan OTP, pakai aturan email (P: blog dan agregator; halaman resmi tidak menyebut angka) | berbayar per pengguna | P |
| Zero Trust batas akun | 500 aplikasi Access, 50 penyedia identitas, 50 token layanan | | .../cloudflare-one/account-limits (V) |

Implikasi untuk METI:

- Catatan kuota baca D1 dari repo kebencanaan (memori internal) menunjukkan 5 juta baris dibaca/hari habis dengan satu pindaian tabel besar. Direktori METI jauh lebih kecil (kira-kira ribuan hingga puluhan ribu rekaman), tetapi FTS5 dan graf menambah pembacaan. Setiap kueri harus berindeks; hindari `COUNT(*)` tanpa batas pada tabel besar; simpan agregat dasbor di tabel ringkasan atau JSON statis di R2.
- CPU 10 ms/permintaan pada paket Free sempit: bangun graf dan pembobotan DI SISI KLIEN atau pada langkah pembuatan (build/cron) dan simpan hasil JSON. Untuk produksi METI yang serius, paket Workers Paid (kisaran lima dolar AS per bulan; harga tidak diverifikasi hari ini) memberi napas CPU dan batas D1 jauh lebih longgar. Rekomendasi: mulai Free untuk purwarupa, pindah Paid sebelum rilis publik.
- Satu cron jadwal mengambil satu dari 5 slot Free. Gabungkan tugas dalam satu cron.

### 4.2 Pencarian

| Opsi | Cocok untuk | Catatan |
|---|---|---|
| **D1 FTS5** | Pencarian teks penuh nama, bidang, ringkasan, judul riset | Dokumen D1 (V) menyebut modul FTS5 didukung (himpunan bagian ekstensi SQLite; cek fitur yang dipakai terhadap batasan). Pakai tabel FTS5 `content=` eksternal atau tabel mandiri, tokenizer `unicode61 remove_diacritics 2`. Ranking `bm25()`. Awalan (`prefix='2 3'`) untuk autocomplete. Sinkron lewat pemicu atau saat unggah. Uji integrasi nyata terhadap D1 lokal (Miniflare/wrangler), jangan mock. |
| **Vectorize + Workers AI embedding** | Pencarian semantik ("pakar PLTS terapung") | Fase 2. Dimensi 384-768 hemat kuota (Free: 30 juta dimensi terkueri/bulan dan 5 juta dimensi tersimpan; dengan vektor 768 dimensi, 5 juta dimensi tersimpan hanya cukup sekitar 6.500 vektor, jadi Free hanya muat untuk purwarupa; tabel ini hitung kasar, uji sebelum dipercaya). Embedding bahasa Indonesia: pilih model multibahasa; kualitas harus diuji dengan 30 pertanyaan nyata sebelum diterima. |
| BM25 buatan sendiri (seperti modul kampus repo kebencanaan) | Fallback tanpa FTS5 | Sudah terbukti di repo; tetapi FTS5 lebih murah dan sederhana. |

Saran: fase 1 FTS5 + daftar sinonim; fase 2 Vectorize hanya untuk pencocokan pakar-kebutuhan dan pencarian publikasi.

### 4.3 Graf (pustaka JS ringan)

| Pustaka | Lisensi | Ukuran | Render | Skala | Catatan |
|---|---|---|---|---|---|
| **Cytoscape.js** 3.34.x | MIT (V, situs resmi) | ~364 KB min, ~112 KB gzip menurut snapshot proyek; depscope melaporkan ~420 KB min / ~131 KB gzip untuk 3.34.0 (P) | Canvas | ribuan simpul nyaman | Algoritma bawaan (BFS, PageRank, jalur terpendek), simpul majemuk, serialisasi JSON, ~70 ekstensi (V) |
| **sigma.js** 3.x | MIT (V) | ~94 KB min / ~25 KB gzip (depscope, P) BELUM termasuk graphology | WebGL | puluhan ribu simpul | Perlu graphology; algoritma di graphology; kustomisasi kartu simpul lebih sulit |
| **vis-network** | Lisensi tidak tercantum di halaman yang dibuka (jangan diasumsikan; periksa repo: setahu saya Apache-2.0/MIT ganda, TIDAK terverifikasi hari ini) | tidak diukur | Canvas | "hingga beberapa ribu simpul dan tepi" (V) | Gaya cepat jadi, pengelompokan (clustering) bawaan |
| **d3-force** | ISC (pengetahuan umum, tidak dibuka) | kecil (~15 KB modul) | Anda yang menggambar (SVG/Canvas) | terbatas | Paling fleksibel, paling banyak kode sendiri |

Rekomendasi: **Cytoscape.js** untuk graf ego (satu simpul + 1-2 lompatan, di bawah 500 simpul) karena algoritma, gaya selektor, dan ekspor JSON sudah ada. Tampung lewat satu berkas statik dari R2/aset (tanpa build step, selaras layar vanilla JS). Beri kendali "muat lebih banyak". Jika graf global puluhan ribu simpul di fase 2, tambah sigma.js + graphology. Hindari memuat pustaka graf pada halaman profil sebelum pengguna membuka tab "Jaringan" (muat malas), karena ukuran 112 KB gzip membebani INP/LCP. Seluruh handler klik pada graf harus ringan (aturan INP di repo).

### 4.4 Peta

- **MapLibre GL JS** (v6 hanya ES modules per situs resmi, V; lisensi diketahui BSD-3 dari pengetahuan umum, TIDAK dibuka hari ini) + **PMTiles** (pemuat protokol).
- Taruh berkas `.pmtiles` di **R2**; sajikan lewat domain kustom (rekomendasi dokumen R2, V: r2.dev dibatasi laju dan untuk pengembangan) atau lewat Worker. Kebutuhan teknis dari pencarian (P): host harus mengizinkan header `Range` dan `Access-Control-Allow-Origin`; CDN men-cache respons Range. Dokumen R2 yang dibuka tidak membahas Range/CORS, jadi UJI nyata sebelum percaya.
- Alternatif lebih ringan: peta dasar vektor publik atau raster tile dari penyedia; untuk MVP cukup poligon batas provinsi/kab-kota dari GeoJSON di R2 (dimuat per provinsi) dan titik proyek dari D1. PMTiles baru perlu jika ingin peta dasar sendiri atau puluhan ribu titik.
- Kuota R2 Free: 10 juta operasi baca per bulan; satu tampilan peta bisa puluhan permintaan Range, jadi pantau.

### 4.5 Autentikasi

| Opsi | Kelebihan | Kekurangan | Rekomendasi |
|---|---|---|---|
| **Cloudflare Access** (OTP surel, atau IdP Google/Microsoft) | Nol kode login; aman; log; gratis hingga 50 pengguna (P) | Batas 50 pengguna pada Free; kebijakan grup tidak jalan dengan OTP; mengunci berdasarkan jalur, bukan fitur per orang; pengalaman anggota kurang halus | **Pakai untuk /admin (pengurus dan kurator)**: puluhan orang, cocok |
| **Sesi sendiri** (kata sandi) | Kendali penuh | Harus menyimpan hash, reset, rate limit; risiko tinggi | Hindari |
| **Magic link** (surel berisi tautan sekali pakai) | Tanpa kata sandi; cocok untuk ratusan-ribuan anggota; klaim profil sekaligus verifikasi surel | Perlu layanan kirim surel (Resend/Mailchannels dll.; biaya dan batas tidak diverifikasi hari ini); token sekali pakai di KV/D1 dengan kedaluwarsa pendek | **Pakai untuk anggota dan klaim profil**; sesi cookie HttpOnly bertanda tangan |
| Masuk dengan Google | Mudah | Tidak semua pakar punya akun Google institusi; tautan identitas | Opsional fase 2 |

Rekomendasi: dua jalur. `/admin/*` di belakang Access (OTP + daftar surel pengurus). `/anggota/*` dan klaim lewat magic link buatan sendiri. Pisahkan peran di tabel `akun` dengan `peran` (anggota, kurator, admin). Hash tidak diperlukan karena tanpa kata sandi; simpan hash token. Batasi laju kirim tautan per surel dan per IP.

### 4.6 Arsitektur ringkas yang cocok

- D1: entitas (tabel umum + tabel detail), `tepi`, `alias`, `akun`, `persetujuan`, `klaim`, `antrean_kurasi`, `riwayat`, FTS5.
- R2: foto/logo, dokumen (laporan, CV opsional), JSON publik hasil build (`graf/*.json`, `peta/*.geojson`), `.pmtiles`, ekspor.
- Worker: rute `/api/publik/*` (baca, cache `Cache-Control`), `/api/anggota/*`, `/api/admin/*`; aset statik layar vanilla JS.
- Cron tunggal: bangun ulang agregat dan graf JSON; kedaluwarsa token; pengingat perpanjangan.
- Cache agresif untuk baca publik (CDN) agar kuota D1 aman.

---

## 5. Privasi dan hukum Indonesia

Dasar: UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (diundangkan 17 Okt 2022; masa transisi berakhir 17 Okt 2024, per sumber pencarian P). Ringkasan pasal di bawah dari pasal.id (V); pasal 15 (pengecualian hak) dan pasal 57 (sanksi administratif) terpotong di sumber, jadi tidak diulas rinci. Dokumen ini bukan nasihat hukum; minta tinjauan penasihat hukum METI sebelum rilis.

### 5.1 Implikasi untuk direktori orang

| Pasal | Isi (ringkas) | Konsekuensi desain |
|---|---|---|
| 4 | Data umum (nama, jenis kelamin, agama, status perkawinan) vs data spesifik (kesehatan, biometrik, anak, keuangan pribadi, dll.) | Direktori hanya memuat data umum profesional; DILARANG agama, status kawin, usia/tanggal lahir, alamat rumah, NIK, foto wajah untuk biometrik |
| 5 | Hak tahu identitas pengendali, dasar hukum, tujuan, penanggung jawab | Halaman "Kebijakan Privasi" ringkas, tautan di tiap formulir |
| 6, 7 | Hak koreksi dan akses/salinan | Formulir "Lihat dan koreksi data saya" |
| 8 | Hak penghentian pemrosesan, penghapusan, pemusnahan | Tombol "Hapus profil saya" di tiap profil orang; tenggat internal 14 hari kerja (pilihan METI; UU tidak menetapkan angka yang saya verifikasi) |
| 9 | Hak menarik persetujuan | Tarik persetujuan = profil menjadi privat/dihapus |
| 11 | Hak membatasi pemrosesan | Opsi "sembunyikan dari publik" |
| 13 | Hak portabilitas | Ekspor JSON data sendiri (fase 2) |
| 16, 27 | Pemrosesan terbatas, spesifik, sah, transparan | Jangan menambah data di luar tujuan direktori |
| 20 | Enam dasar pemrosesan; persetujuan eksplisit salah satunya | Profil orang untuk yang tak mendaftar sendiri hanya sah jika ada dasar lain yang kuat ("kepentingan sah" atau publik); risiko tinggi |
| 21, 22 | Informasi saat meminta persetujuan (tujuan, jenis data, retensi); persetujuan tertulis atau terekam, elektronik sah | Kotak persetujuan tidak tercentang bawaan; simpan teks versi, waktu, surel |
| 23 | Klausul perjanjian yang memaksa pemrosesan tanpa persetujuan eksplisit batal demi hukum | Jangan menjadikan persetujuan syarat tersembunyi dalam keanggotaan |
| 43, 44 | Wajib menghapus/memusnahkan data bila tidak diperlukan, persetujuan ditarik, diminta, atau diperoleh melawan hukum | Jadwal retensi; hapus keras untuk orang yang keluar |
| 46 | Pemberitahuan kegagalan pelindungan paling lambat 3 x 24 jam kepada subjek dan lembaga | Prosedur insiden tertulis dan kontak |
| 53 | Penunjukan pejabat/petugas PDP pada kondisi tertentu (pelayanan publik, pemantauan skala besar, data spesifik skala besar); ada Putusan MK 151/PUU-XXII/2024 terkait kata "dan" pada huruf b | METI sebaiknya menunjuk petugas PDP (praktik baik), cek apakah wajib |
| 65-67 | Larangan memperoleh/mengungkap/menggunakan data pribadi melawan hukum; pidana penjara 4-5 tahun dan/atau denda Rp4-5 miliar | Tidak ada scraping profil pribadi; tidak mengimpor data dari sumber tak jelas |

### 5.2 Pola praktis

1. **Dua jenis rekaman orang.** (a) *Terdaftar sendiri/anggota*: persetujuan eksplisit dicatat; (b) *Tokoh publik/pejabat* dari sumber resmi (JDIH, situs lembaga, publikasi): batasi pada nama, jabatan, lembaga, tautan sumber; tanpa kontak pribadi; sumber wajib; tombol "ajukan koreksi/hapus" selalu terlihat. Rekaman (b) tetap memiliki risiko hukum (dasar pemrosesan dan "kepentingan sah" harus ditinjau penasihat hukum); mulai dengan (a) dan (b) terbatas.
2. **Bidang bertingkat tampilan:** nama, jabatan, lembaga, bidang keahlian = publik; surel/telepon = anggota saja atau hanya via "ajukan perkenalan lewat METI"; privat = tidak ditampilkan (pola SolarPower Europe dan SEIA opt-in).
3. **Opt-in direktori di formulir pendaftaran** (pola SEIA): kotak tidak tercentang bawaan, teks tujuan, hak tarik.
4. **Klaim profil:** orang membuktikan kendali atas surel yang tercantum atau surel institusi lewat magic link; lembaga lewat surel domain lembaga dan persetujuan kurator; hasil klaim membuka kemampuan menyunting, menyembunyikan, dan menghapus. Profil yang sudah diklaim tidak boleh disunting kurator selain koreksi faktual atas permintaan pemilik.
5. **Hak hapus:** formulir publik tanpa akun (verifikasi lewat surel yang tercantum) + tombol di profil; hapus keras dari D1, R2 (foto/dokumen), indeks FTS5, JSON graf statik yang dibangun ulang pada cron berikutnya, dan cache CDN (purge). Catat hanya hash identitas + tanggal penghapusan di "daftar tidak boleh dimasukkan lagi" supaya impor berikutnya tidak menghidupkan lagi.
6. **Retensi:** profil anggota selama keanggotaan + 2 tahun (pilihan METI, dikonfirmasi penasihat hukum); log persetujuan sesuai kebutuhan hukum.
7. **Pencegahan penyalahgunaan:** batas laju pada API publik, tanpa ekspor massal kontak, tanpa halaman daftar seluruh surel; robots dan header untuk melarang pemanenan kontak.
8. **Keamanan:** TLS, kontrol akses berbasis peran, log audit, secret hanya di Worker secrets, hash token sekali pakai, penghapusan terjadwal. Catatan: repo ini publik; jangan menyimpan data orang di repo.
9. **Pengecualian wajib dipertimbangkan:** peraturan pelaksana UU PDP (disebut PP 33/2026 pada sumber agregator, belum diverifikasi ke JDIH) dan badan pengawas perlu dipantau; sesuaikan bila sudah terbit.

### 5.3 Hak cipta data

Data dari sumber lain (ESDM, IEA, GEM CC BY-NC-SA, OpenCorporates ODbL share-alike) tunduk pada lisensinya. GEM berlisensi NC: tidak boleh dipakai pada produk METI yang berbayar tanpa izin; hanya tautan, bukan salinan. Ringkas dan tautkan, bukan reproduksi.

---

## 6. Rekomendasi 12 poin untuk METI

1. **Profil sebagai pusat, graf sebagai nilai.** Bangun lima kelas profil (orang, lembaga, kampus/pusat studi, proyek, wilayah) plus publikasi dan regulasi; tiap profil punya blok "Terhubung dengan" otomatis dari tepi. Ini celah pasar di Indonesia.
2. **Skema tepi tetap ~15 jenis**, bertanggal, bersumber, berstatus verifikasi (pola LittleSis); jenis baru lewat kurator.
3. **Tiga lapis akses sejak awal:** publik (nama, jabatan, lembaga, bidang, proyek, regulasi); anggota (kontak, kelompok kerja, matchmaking); pengurus (kurasi, iuran). Jangan pasang paywall pada data dasar; METI asosiasi, nilai anggota ada pada kontak, kelompok kerja, matchmaking, dan acara, bukan pada menyembunyikan direktori.
4. **Mulai dari pendaftaran sendiri dan unggahan CSV lembaga anggota**, bukan scraping profil orang. Rekaman tokoh publik hanya data jabatan dari sumber resmi, dengan tombol koreksi/hapus.
5. **Persetujuan eksplisit dan hak subjek data masuk gerbang uji.** Tulis uji integrasi: hapus profil membersihkan D1, FTS5, JSON graf, R2; persetujuan tercatat; kontak privat tidak bocor lewat API publik.
6. **Kurasi di tengah:** antrean kurasi, riwayat revisi, status verifikasi pada tiap rekaman, deteksi duplikat dengan kunci kuat (NPWP/NIB/ORCID/DOI) lalu skor lunak; gabung tidak merusak.
7. **Fase 1 (wajib):** profil dan relasi, pencarian FTS5 + filter facet + sinonim, graf ego Cytoscape (muat malas), peta titik sederhana, basis regulasi dasar, kalender acara, pendaftaran anggota dengan persetujuan pengurus, klaim profil, formulir koreksi/hapus, dasbor publik, ekspor CSV/JSON, admin di belakang Cloudflare Access.
8. **Fase 2:** iuran dan perpanjangan (awal manual+unggah bukti), kelompok kerja, papan "dicari/ditawarkan" dan pencocokan dengan alasan, pipeline proyek, Vectorize untuk pencarian semantik dan pencocokan pakar, API baca publik, ringkasan surel mingguan, koroplet wilayah, ekspor PDF.
9. **Nanti:** graf global WebGL (sigma.js), notifikasi WA, data room, kartu anggota QR, pelacak komitmen anggota, kalkulator.
10. **Teknis:** Cloudflare Worker + D1 + R2; FTS5; graf Cytoscape dimuat malas; PMTiles hanya bila perlu peta dasar sendiri; agregat dan graf dibangun oleh cron lalu disajikan sebagai JSON statis berstempel (hemat kuota D1: 5 juta baca/hari dan CPU 10 ms Free); rencanakan Workers Paid sebelum rilis publik.
11. **Auth dua jalur:** Cloudflare Access (OTP) untuk /admin, magic link buatan sendiri untuk anggota dan klaim. Tanpa kata sandi.
12. **Transparansi tata kelola:** terbitkan syarat keanggotaan, kategori, tarif atau mekanisme tarif, sumber dan tanggal data, kebijakan privasi, kontak pelapor insiden. (Kelemahan REN21 dan CEM: syarat keanggotaan tidak jelas di halaman publik.) Tunjuk petugas PDP; minta tinjauan hukum atas bagian 5 sebelum rilis. Jangan meniru iklan berbayar di profil pesaing (ENF) yang mengikis netralitas.

### Catatan terakhir: yang masih perlu dicek manual

- Isi ENF, IRENA, SEIA, WindEurope, Crunchbase, IESR, Katadata, LittleSis, RE-Source, ESDM One Map (alamat hidup).
- Lisensi vis-network, d3-force, MapLibre, PMTiles (tidak dibuka hari ini).
- Harga Workers Paid dan Vectorize berbayar, layanan surel untuk magic link.
- Pasal 15 dan 57 UU PDP serta peraturan pelaksana.
- Dukungan R2 untuk permintaan Range dan CORS pada PMTiles (uji nyata).
- Skema keanggotaan METI saat ini (iuran, kategori, daftar anggota): pencarian hari ini tidak menemukan informasi publik; ambil dari sekretariat METI.
