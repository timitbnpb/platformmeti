# GLOSARIUM: Platform Jaringan METI

Lampiran rujukan; tidak menetapkan apa pun (kalah dari semua dokumen lain). Bila istilah di sini bertentangan dengan `KEPUTUSAN-METI`, `GRAND-DESIGN`, `PRD`, atau `ALUR`, dokumen itulah yang benar. Versi 1, 7 Nov 2026.

Isi: 1 Istilah baku, 2 Peta fitur 1001startup.id ke fitur METI, 3 Peta tab direktori asal ke tab METI.

## 1. Istilah baku

### 1.1 Data dan penyajian

| Istilah | Arti di platform ini |
| --- | --- |
| Sensus | Daftar entitas EBT berhitungan yang dicatat platform, dengan nomor urut ("#n dari N"); entitas "di luar sensus" tidak dihitung. Padanan "census" di 1001startup.id |
| Entitas | Satu objek yang punya halaman: perusahaan, lembaga, kampus, orang, proyek, wilayah, regulasi, dan seterusnya (tabel `entitas`) |
| Fakta | Satu pernyataan bernilai tentang entitas (kapasitas, tahun berdiri, pendanaan, lokasi), dengan satuan, tanggal "per", dan sumber (tabel `fakta`) |
| Ikatan | Hubungan antara dua entitas (memasok, mendanai, memiliki, mengembangkan, bekerja di, anggota, dan seterusnya), bertanggal dan bersumber (tabel `ikatan`; jenisnya di ALGORITMA §3). Disebut juga sisi di graf |
| Sumber | Dokumen atau halaman tempat fakta atau ikatan dibaca: URL, jenis, tanggal periksa (tabel `sumber`). Tanpa sumber, baris ditolak pipeline |
| Jenis sumber | Enam nilai: `dokumen-resmi`, `filing`, `situs-sendiri`, `media`, `data-terbuka`, `via-pihak-ketiga` |
| Tingkat bukti | Derajat kepercayaan sebuah klaim menurut jenis sumbernya; dipakai untuk label dan skor (rumus di ALGORITMA §4) |
| Skor keyakinan | Angka 0 sampai 1 per profil, dengan label Tinggi, Sedang, atau Rendah dan kalimat alasan; dihitung pipeline dari jumlah sumber, jenis sumber, umur periksa, dan kecocokan antar sumber. Berpil "Hipotesis" sampai diuji (C-16) |
| EST | Label di samping angka turunan, yaitu hitungan platform, bukan angka yang diumumkan; rumusnya ditulis di bawah angka |
| Garis datar (penanda kosong) | Tanda bahwa tidak ada angka publik yang kredibel; tidak pernah diisi tebakan |
| Potret | Berkas JSON hasil pipeline di R2 yang dibaca layar; dibuat per lapis akses. Layar tidak membaca D1 untuk data bacaan |
| Lapis | Tingkat akses data: Publik, Anggota, Pengurus. Potret dibuat terpisah per lapis |
| Di luar sensus | Entitas yang punya ikatan bersumber tetapi tidak punya profil lengkap; tetap punya halaman karena rantai lain melewatinya |
| Tanggal beku | Tanggal angka sebuah cerita data dikunci; profil terus diperbarui, cerita tidak |
| Jawaban singkat | Kalimat berangka berstempel tanggal di awal tiap halaman publik, bisa disalin ke tempat lain |
| Cara menghitung | Bagian yang menjelaskan apa yang dihitung dan tidak, penyebut, dan batas |
| Cara mengutip | Bagian yang memberi baris sitasi dengan kredit, tautan, dan tanggal beku |
| Cerita data | Halaman `/cerita` yang menjawab satu pertanyaan dengan angka sensus, dengan tabel dan sumber tiap baris |
| Pita draf kerja | Pita di beranda: "Draf kerja, sumber publik saja, angka turunan berlabel estimasi" |
| Hipotesis | Pil untuk skor, kuadran, atau indeks buatan platform yang belum diuji (C-16) |
| Konsentrasi | Porsi satu pihak dalam pendapatan atau pasokan pihak lain, bila disebut laporan |
| Kutipan beku | Cuplikan dokumen sumber yang disimpan di tooltip bukti agar tetap terbaca bila sumber berubah |
| Terhubung | Bagian profil yang memuat semua tetangga di graf dikelompokkan per relasi |
| Sejenis | Bagian profil yang menunjuk entitas serupa di sektor yang sama |
| Kita = METI | METI Pusat, METI Wilayah, METI Institute, dan METI Energi Muda adalah "kita": tidak diberi bintang "mitra strategis" (D13) |
| Daftar tolak | `daftar-tolak.json` privat di R2: nama yang tidak boleh tampil di mana pun (D14) |
| Dummy | Baris contoh berkolom `dummy=1`, dibuat tombol Super Admin, tidak pernah masuk potret publik |
| Graf | `graf.json` berisi `simpul` dan `sisi`; bukan visualisasi force-directed |
| Dedup | Penggabungan entitas yang sama dari sumber berbeda; kunci kuat dulu (NPWP, NIB, ORCID, DOI, ROR), skor lunak sesudahnya |
| Jejak | Baris `jejak` yang dicatat tiap tulis D1: siapa, kapan, aksi, tabel, id, dari, ke |
| Jejak isu | Garis waktu satu isu kebijakan dengan peristiwa, dokumen, dan posisi METI; pengganti Kejadian besar |

### 1.2 Peran dan hak

| Istilah | Arti |
| --- | --- |
| PB | Publik, tanpa login |
| AN | Anggota, akun dibuat Admin |
| PG | Pengurus atau Sekretariat |
| KR | Kurator data |
| WL | Ketua METI Wilayah, hak dibatasi `cakupan_prov` |
| AD | Admin akun |
| SA | Super Admin, pemegang tombol dummy |
| RLS | Pembatasan baris. Di platform ini ditegakkan modul `src/hak.js` di Worker karena D1 tidak punya RLS bawaan |
| `hak.js` | Satu-satunya pintu akses D1: `boleh()`, `baca()`, `tulis()` |
| Tautan aktivasi | Token acak sekali pakai, berlaku 72 jam, dibuat Admin dan disalin manual |
| PDP | Pelindungan Data Pribadi (UU 27/2022) |

### 1.3 Organisasi METI

| Istilah | Arti |
| --- | --- |
| METI | Masyarakat Energi Terbarukan Indonesia; Inggris Indonesian Renewable Energy Society (IRES); perkumpulan didirikan 1999 |
| METI Wilayah | Cabang provinsi METI (AD Pasal 23); rencana 33; status Established, Coming soon, Planned |
| METI Institute | Unit kajian METI; peninjau angka bawaan (C-20) |
| METI Energi Muda | Sayap anak muda METI |
| Pengurus Harian | Badan eksekutif METI yang mengesahkan anggota dan menetapkan iuran |
| Dewan Penasihat, Dewan Pengawas, Dewan Pakar | Organ METI; dewan pakar ditetapkan Pengurus Harian atas pertimbangan Dewan Pengawas |
| Sekretariat | Pelaksana administrasi METI; pengonfirmasi lencana "Anggota METI" |
| Munas | Musyawarah Nasional, tiap 3 tahun |
| SK 0008 | Surat keputusan susunan pengurus 2026 sampai 2028 yang jadi sumber seed pengurus (R3 §1.4) |
| Anggota METI | Anggota perorangan, organisasi (utama, perusahaan, organisasi, koperasi), atau kehormatan menurut AD Pasal 8; lencana hanya bila dikonfirmasi |
| IndoEBTKE ConEx | Konferensi dan pameran EBT mitra Kementerian ESDM, METI penyelenggara bersama |

### 1.4 Energi dan sektor

| Istilah | Arti |
| --- | --- |
| EBT | Energi baru terbarukan |
| EBET | Energi baru dan energi terbarukan (sebutan dalam RUU EBET) |
| DRE | Distributed Renewable Energy: energi terbarukan terdistribusi, skala kecil dan dekat pengguna |
| KDMP | Koperasi Desa atau Kelurahan Merah Putih |
| IPP | Independent Power Producer: pengembang pembangkit swasta yang menjual listrik, umumnya ke PLN |
| EPC | Engineering, Procurement, Construction: kontraktor rancang-bangun |
| Offtaker | Pembeli listrik dalam kontrak jangka panjang |
| PPA | Power Purchase Agreement: perjanjian jual-beli listrik |
| Wheeling | Penyaluran listrik lewat jaringan pihak lain; belum diizinkan untuk pusat data (R9 §2.8) |
| BTM | Behind-the-meter: pembangkit di sisi pelanggan dari meter |
| PLTS | Pembangkit Listrik Tenaga Surya |
| PLTB | Pembangkit Listrik Tenaga Bayu (angin) |
| PLTA | Pembangkit Listrik Tenaga Air |
| PLTM | Pembangkit Listrik Tenaga Minihidro atau mikrohidro (PLTMH untuk skala desa) |
| PLTP | Pembangkit Listrik Tenaga Panas Bumi |
| PLTBm | Pembangkit Listrik Tenaga Biomassa |
| PLTSa | Pembangkit Listrik Tenaga Sampah |
| MW, GW | Megawatt, gigawatt; kapasitas terpasang |
| TKT | Tingkat Kesiapan Teknologi, skala 1 sampai 9 |
| WKP | Wilayah Kerja Panas bumi |
| IUPTL | Izin Usaha Penyediaan Tenaga Listrik |
| BUMN, BUMD | Badan usaha milik negara, badan usaha milik daerah |
| Danantara | Badan pengelola investasi yang memegang banyak BUMN |
| Rasio elektrifikasi | Persentase rumah tangga berlistrik; sumber BPS atau ESDM, bertanggal |

### 1.5 Kebijakan dan perencanaan

| Istilah | Arti |
| --- | --- |
| RUPTL | Rencana Usaha Penyediaan Tenaga Listrik (PLN); edisi 2025 sampai 2034 |
| RUEN | Rencana Umum Energi Nasional |
| KEN | Kebijakan Energi Nasional |
| RUED | Rencana Umum Energi Daerah (tingkat provinsi) |
| RUU EBET | Rancangan Undang-Undang Energi Baru dan Energi Terbarukan |
| Perpres 112/2022 | Perpres percepatan pengembangan energi terbarukan untuk penyediaan tenaga listrik |
| JETP | Just Energy Transition Partnership: kemitraan pendanaan transisi energi; dokumen CIPP |
| DEN | Dewan Energi Nasional |
| ESDM, EBTKE, DJEBTKE | Kementerian Energi dan Sumber Daya Mineral; Direktorat Jenderal Energi Baru, Terbarukan, dan Konservasi Energi |
| JDIH | Jaringan Dokumentasi dan Informasi Hukum |
| HEESI | Handbook of Energy and Economic Statistics of Indonesia (ESDM) |
| AESI | Asosiasi Energi Surya Indonesia; sumber daftar anggota |
| IESR | Institute for Essential Services Reform |
| PGE | PT Pertamina Geothermal Energy |

### 1.6 Sumber data dan teknis

| Istilah | Arti |
| --- | --- |
| OpenAlex, ORCID, ROR, Crossref | Sumber pakar, publikasi, dan afiliasi |
| Ember, OWID, IRENASTAT, World Bank | Sumber statistik energi terbuka |
| OSM, Overpass, ODbL | OpenStreetMap, antarmuka kuerinya, dan lisensi datanya (wajib atribusi) |
| GEM, WRI GPPD | Global Energy Monitor dan WRI Global Power Plant Database; sumber pembangkit (WRI ditandai lemah) |
| SINTA, ESDM One Map, IEA | Sumber yang memblokir atau tidak boleh dipanen otomatis tanpa izin |
| Worker, D1, R2 | Cloudflare Worker, basis data SQLite, dan penyimpanan objek |
| CSP, SRI | Content Security Policy; Subresource Integrity (hash pustaka CDN) |
| INP | Interaction to Next Paint; target di bawah 200 ms |
| Tema Midnight Energy | Palet METI: Navy `#122B4A`, Petrol `#155B79`, Teal `#0A896A` (teks `#07705A`), Cyan `#65C7EC`, Lime `#B9D75A`, Cloud `#F3F7FB` |
| `.ak-*`, `.jm-*` | Awalan kelas CSS: kode yang diporting (`ak`) dan kode baru (`jm`) |

## 2. Peta fitur 1001startup.id ke fitur METI

Isi riset ada di `riset/R9-1001STARTUP.md`; "Padanan METI" adalah keputusan PRD.

| Halaman atau pola 1001startup.id | Padanan METI | Fitur PRD | Tiket |
| --- | --- | --- | --- |
| `/` Beranda, enam kartu dataset dengan tanggal sendiri | `/` Beranda sensus, cuplikan hidup tiap dataset | F-S1 | JM-E01 |
| `/startups` tabel sensus, chip sektor berhitungan, chip boolean | `/perusahaan` sensus perusahaan dan lembaga | F-S2 | JM-E02 |
| `/company/<slug>` profil bersumber, 13 bagian berurut | `/p/<slug>` profil entitas | F-S3 | JM-E03 |
| Skor "How well we know this" (0 sampai 1 plus label) | Skor keyakinan dan tingkat bukti | F-S4 | JM-D13, E05 |
| Penanda `est`, `min`, `in parent`, tanda "tidak ada angka" | Label EST dan penanda | F-S5 | JM-E05 |
| Halaman `/chain/x/<slug>` (di luar sensus) | Entitas di luar sensus | F-S6 | JM-D01, E02 |
| `/coverage` dan `/model` (Method) | `/metode` | F-S7 | JM-E05 |
| `/chain` dan `/chain/<slug>` rantai pasok dua sisi | `/rantai` | F-R1 | JM-F01 |
| `/investors` dan `/investor/<slug>` | `/pembiaya` | F-R2 | JM-F02 |
| `/bumn` kuadran dua sumbu, halaman grup `/bumn/pln` | `/bumn` kuadran BUMN energi, halaman grup PLN, Pertamina NRE, PGE | F-R4 | JM-F03 |
| `/bumd` perusahaan daerah | Tidak dibuat sendiri; BUMD energi masuk sensus sebagai jenis entitas | F-S2 | JM-E02 |
| `/data-center` matriks daya dan matriks risiko | `/data-center` listrik data center | F-R5 | JM-F04 |
| `/umkm` chip tingkat bukti berhitungan | `/desa` energi desa, KDMP, DRE | F-R6 | JM-F05 |
| `/map` logo bundar, panel hitungan, cadangan tabel | `/peta` | F-J4 | JM-E04 |
| `/sector/<slug>` | Halaman sektor lewat chip sektor di sensus dan Jawaban singkat per sektor | F-S2, F-J10 | JM-E02, C03 |
| `/news` cerita data (Short answer, How this was counted, Using these numbers) | `/cerita` | F-K4 | JM-F08 |
| `/report/<bulan>` dan `/research/*` | Cerita data bertanggal beku (laporan bulanan belum dibuat) | F-K4 | JM-F08 |
| `/closed` (yang berhenti) | Status `ditarik` dan garis waktu di profil (halaman sendiri belum dibuat) | F-M4 | JM-D01 |
| `/unicorn` | Tidak dibuat | tidak ada | tidak ada |
| `/stats` lalu-lintas hidup | Tidak dibuat | tidak ada | tidak ada |
| Kalimat fakta "According to ..." | Jawaban singkat "Per <tanggal> ..." | F-S1, semua halaman publik | JM-E01 dan tiap tiket layar |
| Baris "Cite as" dan "Free to cite with credit" | Cara mengutip | semua halaman publik | JM-E05, F08 |
| Kontak publik hanya surel peran, tanpa nomor ponsel | Kontak lapis Pengurus, di profil hanya tautan resmi | F-S3 | JM-E03, D12 |
| Status situs "Website live, checked <tanggal>" | Tiga status situs (hidup, tidak bisa dicek, mati) dengan tanggal cek | F-S3 | JM-E03 |
| Teks "Public sources only" di kaki profil | Kaki profil "Hanya sumber publik" | F-S3 | JM-E03 |
| Tidak ada syarat, privasi, dan lisensi data | Dibuat di `/metode` dan KEAMANAN-PRIVASI | F-S7 | JM-E05 |
| Data tidak boleh dipanen otomatis (robots melarang) | Pola ditiru, data dari sumber primer; panen langsung hanya dengan izin (C-13) | F-A6 | JM-D08 (tertahan) |

## 3. Peta tab direktori asal ke tab METI

Asal: `public/akademisi.*` di repo poskokarhutla (R1 §1.2). Tujuan: `public/direktori.*` di repo ini (JM-C02, C03).

| Tab atau sub-tab asal | Tab METI | Perubahan utama | Fitur PRD |
| --- | --- | --- | --- |
| Pakar (akademisi) | Pakar | `RUMPUN` jadi `SEKTOR`; sumber OpenAlex topik energi | F-J2 |
| Pakar, segmen Tokoh publik | Pakar, segmen Tokoh | Isi: pengurus dan dewan METI (SK 0008), nama dan jabatan publik | F-J2 |
| Lembaga, Peta | Lembaga, Peta | `KAT` 15 kategori jadi 10 kategori lembaga energi; penanda logo bundar | F-J3, F-J4 |
| Lembaga, Daftar | Lembaga, Daftar | Lencana "Anggota METI" ganti bintang strategis; `DIRI` = METI | F-J3 |
| Lembaga, Analisa | Lembaga, Analisa | Grafik per kategori, skala, provinsi, sektor | F-J3 |
| Lembaga, Proyek | Dialihkan ke `/peta` lapisan proyek | Sub-tab asal diarahkan ke F-J4 | F-J4, F-W3 |
| Wilayah | Wilayah | Rapor provinsi dan kab/kota; skor kesiapan berpil Hipotesis; sumber BPS, HEESI, RUPTL | F-W2 |
| Inovasi | Inovasi | Katalog teknologi energi dan TKT | F-J6 |
| Riset, Riset daerah | Riset, Riset | Ringkasan mesin ekstraktif berlabel (C-18) | F-J7 |
| Riset, Kejadian besar | Riset, Jejak isu | Isi baru: RUU EBET, Perpres 112/2022, RUEN, RUPTL, JETP | F-J7, F-K2 |
| Riset, Pusat studi | Riset, Pusat studi | Pusat studi energi | F-J7 |
| Riset, Aset riset | Riset, Aset riset | Laboratorium, fasilitas uji, perangkat | F-J7 |
| Sistem data | Sistem data | Isi dari R8 (HEESI, JDIH, BPK, Ember, OWID, dan lain-lain) | F-J8 |
| Pendanaan, Skema | Pendanaan, Skema | Dana iklim, hibah, JETP, World Bank, AIIB, GCF | F-R3 |
| Pendanaan, Proyek | Pendanaan, Proyek | Proyek berdana (World Bank Projects, IATI) | F-R3 |
| Pendanaan, Negara donor | Pendanaan, Negara donor | Donor energi | F-R3 |
| Donasi | Dibuang | Tidak relevan untuk METI (K2, JM-C03) | tidak ada |
| Pustaka, Buku | Pustaka, Buku dan kajian METI | Sampul di R2; kajian METI | F-K3 |
| Pustaka, Dokumen | Pustaka, Dokumen | RUED, RUPTL, position paper, regulasi | F-K3 |
| Pustaka, Relasi peraturan | Pustaka, Relasi peraturan | Katalog regulasi BPK dan JDIH ESDM | F-K1, F-K3 |
| Pustaka, Berita | Pustaka, Berita | API publik metiires.or.id, kategori berita energi | F-K3, F-K5 |
| Pencarian global (`/`) | Pencarian global (`/`) | Jenis hasil disesuaikan: pakar, lembaga, perusahaan, proyek, regulasi, wilayah | F-J1 |
| Panel chip bencana (`BENCANA_VIEW`) | Panel chip sektor (`SEKTOR_VIEW`) | Titik ganti: `RUMPUN`, `BENCANA_VIEW`, `ALIAS` | F-J10 |
| Daftar pendek pakar dan ekspor | Daftar pendek dan ekspor | Band navy METI; kepala kolom rata tengah | F-J9 |
| Hak koreksi | Hak koreksi | Dipindah dari tabel asal ke D1 lewat `hak.js` | F-M5 |
| Riwayat dengan BNPB | Riwayat dengan METI | Jenis: narasumber, audiensi, MoU, sponsor, anggota | F-M6 |
| `dataContoh()` dan tombol dummy | `dataContoh()` energi dan tombol dummy | Isi fiktif "(contoh)", `example.org` | F-A3 |
| Partner strategis (bintang) | Dibuang untuk METI sendiri; `strategis()` hanya menandai pihak luar | `DIRI` = METI | F-J5, F-J3 |
| `hubung.mjs` dan `graf.json` | `hubung.mjs` dan `graf.json` | `ALIAS` energi, jenis ikatan ALGORITMA §3 | F-J5, F-A6 |
| Pengadaan kajian, Jurnal (disembunyikan di asal) | Tidak dibawa | Tetap tersembunyi di asal, tidak diporting | tidak ada |
