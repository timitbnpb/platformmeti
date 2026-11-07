# PRD: Platform Jaringan METI (`/`, `/direktori`, `/admin`)

Dokumen keempat dalam urutan otoritas (`KEPUTUSAN-METI` > `GRAND-DESIGN` > `RISET` > `PRD` > `ALUR` > `ALGORITMA` > `DESIGN-SYSTEM` > `DESAIN-TEKNIS` > `KEAMANAN-PRIVASI` > `RENCANA-UJI` > `TIKET`). Kalah dari `KEPUTUSAN-METI`, `GRAND-DESIGN`, dan `riset/`; menang atas `ALUR` dan dokumen di bawahnya. Versi 1, 7 Nov 2026.

**Konvensi berkas ini.** Fitur berkode `F-<pilar><n>`: `A` fondasi, `S` P1 Sensus, `J` P2 Jaringan, `R` P3 Rantai dan modal, `W` P4 Wilayah dan proyek, `K` P5 Kebijakan dan pengetahuan, `M` P6 Rumah METI. Ukuran keberhasilan `U1..U8`. Pertanyaan terbuka berkode `C-01..C-20` (ada di `KEPUTUSAN-METI` bagian C, tiap satu punya bawaan). Keputusan pemilik `K1..K14`, keputusan perancang `D1..D18`. Tiket `JM-*` ada di `TIKET.md`; tiap fitur menyebut tiket yang mengerjakannya. Kode hak peran 2 huruf (bagian 2). Fase `F0..F3` mengikuti `GRAND-DESIGN` §7. Rujukan silang berbentuk `<singkatan> §x`: GD = GRAND-DESIGN, KP = KEPUTUSAN-METI, R1..R9 = `riset/`, ALG = ALGORITMA, DS = DESIGN-SYSTEM, DT = DESAIN-TEKNIS, KPV = KEAMANAN-PRIVASI, RU = RENCANA-UJI.

Aturan berhenti: fitur, layar, atau tabel yang tidak tertulis di paket ini tidak dibuat. Bila dua dokumen bertentangan atau ada yang kurang, pengerja berhenti dan bertanya ke pemilik.

Catatan keterlacakan: `TIKET` menulis "JM-F01 sampai JM-F10 mengikuti PRD §6". Di PRD ini tiket F-fase (F2) tersebar per pilar di bagian 5 sampai 10; petanya ada di bagian 11.

## Daftar isi

1. Ringkasan (masalah, tujuan, ukuran, non-tujuan, larangan)
2. Pengguna dan peran
3. Peta layar
4. Fondasi (F-A)
5. P1 Sensus EBT (F-S)
6. P2 Jaringan (F-J)
7. P3 Rantai dan modal (F-R)
8. P4 Wilayah dan proyek (F-W)
9. P5 Kebijakan dan pengetahuan (F-K)
10. P6 Rumah METI (F-M)
11. Keterlacakan fitur ke tiket dan keputusan

## 1. Ringkasan

### 1.1 Masalah

1. METI mengklaim 1.800+ anggota dan 20+ mitra, tetapi situs metiires.or.id hanya menampilkan 12 logo anggota dan 12 logo mitra. Tidak ada direktori, peta, pencarian, atau relasi (R4 §8).
2. Ekosistem EBT Indonesia tersebar: ESDM One Map hanya peta, IESR hanya riset, Satu Data hanya dataset. Tidak ada satu tempat gratis yang menghubungkan orang, lembaga, perusahaan, kampus, riset, proyek, pembiaya, dan regulasi (R6 §2).
3. Materi GIZ Yogyakarta (6 Nov 2026) sudah menyebut METI akan menginisiasi "direktori kontributor" dan "repositori pembelajaran DRE" (R3). Mandatnya ada, alatnya belum.
4. Angka EBT berbeda antar dokumen (potensi panas bumi 23,2, 23,9, dan 24 GW; dua versi SK pengurus). Tanpa atribut "per tanggal" dan "sumber", angka METI mudah dipatahkan (R3).

### 1.2 Tujuan

Satu platform tempat siapa pun bisa menjawab dalam satu menit, dengan sumber bertanggal:

- Siapa saja pemain EBT di Indonesia, per sektor, per provinsi, per rantai nilai?
- Siapa memasok siapa, siapa mendanai siapa, siapa mengatur apa?
- Proyek apa yang sudah jalan, di mana, berapa MW, siapa pengembangnya?
- Siapa pakar yang bisa diundang untuk isu X di provinsi Y?
- Apa posisi METI terhadap RUU EBET, Perpres 112/2022, RUEN, dan apa jejaknya?

Cara dibangun: seluruh kode Direktori Jaringan Kebencanaan di repo poskokarhutla diporting (K1, K2, D3), diberi isi energi, dan dilapisi penyajian informasi ala 1001startup.id (K7, D6) di atas model data `entitas`/`fakta`/`ikatan` dari neraca-papua (D5). Jalan di Cloudflare (K3), bergaya METI (K4), dwibahasa (K8), berakun dan berhak baris (K9).

### 1.3 Ukuran keberhasilan

| Kode | Ukuran | Sasaran | Sumber hitung |
| --- | --- | --- | --- |
| U1 | Entitas bersumber | 300+ pada akhir F1 | potret publik |
| U2 | Fakta atau ikatan tanpa sumber | 0 | `jaga_unggah.mjs` |
| U3 | Ikatan antar entitas | 1.000+ pada akhir F1 | `graf.json` |
| U4 | Halaman publik dengan Jawaban singkat, Cara menghitung, Cara mengutip, tanggal beku | semua halaman publik | gerbang teks |
| U5 | Sel matriks hak yang punya uji "izinkan" dan uji "DITOLAK" | 100% hijau | `npm run uji` |
| U6 | Kunci teks antarmuka EN terisi | 100% sama dengan kunci ID | gerbang i18n |
| U7 | Entitas di `daftar-tolak.json` yang muncul di potret mana pun | 0 | uji JM-D11 |
| U8 | INP klik tab, chip, dan paginasi pada 1440 dan 390 px | di bawah 200 ms | uji layar JM-H02 |

### 1.4 Non-tujuan

- Bukan situs keanggotaan: iuran, uang pangkal, perpanjangan, e-card, dan kelompok kerja tidak dibuat (tarif ada di R4 §3 hanya sebagai latar).
- Bukan pengganti situs metiires.or.id: berita dan acara hanya dibaca dari API publiknya (C-03, JM-F10); tidak ada SSO ke situs itu.
- Tidak ada daftar mandiri di F0 sampai F2 (C-09); akun hanya dibuat Admin.
- Tidak ada kiriman surel, WhatsApp, atau pesan otomatis ke luar; semua kiriman keluar adalah tombol yang ditekan manusia (salin tautan, salin surel, ekspor).
- Tidak ada graf jaringan force-directed global; "graf" di layar berarti daftar "Terhubung", grafik SVG buatan sendiri, dan peta (R1 §3).
- Tidak ada aplikasi bawaan (native), forum, paywall pada data dasar, pembayaran, atau notifikasi.
- Nuklir dan CCS/CCUS hanya sektor "terkait" tanpa chip utama (C-12 bawaan).
- Tidak ada panen otomatis dari 1001startup.id kecuali izin tertulis pengelolanya (D15, C-13); polanya ditiru, faktanya diambil dari sumber primer.
- Tidak ada panen situs yang melarang robot (ESDM One Map, SINTA, IEA) tanpa izin.

### 1.5 Larangan

Tanpa data pribadi (surel, telepon, alamat rumah) di lapis Publik atau di repo. Tanpa angka tanpa sumber dan tanggal; angka turunan berlabel `EST`; tanda "tidak ada" (garis datar) berarti belum ada angka kredibel dan tidak pernah diisi tebakan. Tanpa menyalin teks, estimasi, atau logo pihak lain secara massal. Tanpa menyebut METI "netral" di teks antarmuka. Tanpa titik tengah (U+00B7) sebagai pemisah teks dan tanpa em dash. Tanpa indeks atau skor buatan sendiri yang tampil tanpa pil "Hipotesis" dan "Cara menghitung" terbuka (C-16). Tanpa bintang "mitra strategis" untuk METI Pusat, METI Wilayah, METI Institute, dan METI Energi Muda (D13). Tanpa tabel kembar dan tanpa akses D1 di luar `src/hak.js` (D7). Tanpa cron baru di luar batas 5 jadwal akun Free. Tanpa pustaka luar di luar CDN ber-SRI yang terdaftar di CSP (D4). Tampilan dalam gaya METI "Midnight Energy" (D11); nama kelas `.ak-*` dipertahankan untuk kode yang diporting dan `.jm-*` untuk yang baru (D3).

## 2. Pengguna dan peran

| Peran | Kode hak | Masuk lewat | Boleh |
| --- | --- | --- | --- |
| Publik | PB | tanpa login | Membaca lapis Publik: sensus, profil, rantai, pembiaya, BUMN, data center, desa, peta, wilayah, kebijakan, cerita, metode. Orang dan pakar hanya nama, jabatan publik, afiliasi (C-04). Mengirim koreksi atas satu entitas (formulir tanpa akun, dibatasi laju). Berganti bahasa. |
| Anggota | AN | `/masuk`, akun dibuat Admin | Semua milik PB, ditambah `/direktori` delapan tab (lapis Anggota), daftar pendek, ekspor Excel/Word/PDF, melihat kontak yang pemiliknya setujui tampil untuk anggota. |
| Pengurus/Sekretariat | PG | `/masuk` | Semua milik AN, ditambah kontak lapis Pengurus, riwayat dengan METI (C-17), agenda dan pelantikan METI Wilayah, melihat antrean koreksi (baca saja). |
| Kurator | KR | `/masuk` | Semua milik AN, ditambah menambah dan mengubah entitas, fakta, ikatan, sumber; memutus koreksi; menandai entitas "di luar sensus"; tidak mengelola akun. Bawaan C-20: Bidang Informasi dan Multimedia sebagai kurator, METI Institute sebagai peninjau angka. |
| Ketua METI Wilayah | WL | `/masuk` | Semua milik AN, ditambah mengurus entitas, agenda, dan riwayat hanya di provinsinya (`cakupan_prov`, C-07 bawaan). Tidak melihat provinsi lain di sisi tulis. |
| Admin | AD | `/masuk` | Membuat, mengubah peran, menonaktifkan akun; salin tautan aktivasi; melihat jejak; semua milik KR. Tidak bisa menaikkan diri jadi SA. |
| Super Admin | SA | `/masuk` | Semua milik AD, ditambah mengelola akun SA dan tombol isi data dummy (D18). Super terakhir tidak bisa dinonaktifkan. |

Aturan peran: satu akun satu peran (kolom `akun.peran`: `anggota`, `pengurus`, `kurator`, `wilayah`, `admin`, `super`; PB tidak punya akun). Pelaku mesin (pipeline GitHub Actions) bukan akun; ia hanya menulis potret R2 lewat kunci pipeline. Matriks lengkap per tabel dan kolom ada di KPV §1.

## 3. Peta layar

Rute dan fase mengikuti `GRAND-DESIGN` §5. Kolom terakhir menunjuk fitur di PRD ini.

| Rute | Layar | Pertanyaan yang dijawab | Lapis | Fase | Fitur |
| --- | --- | --- | --- | --- | --- |
| `/` | Beranda sensus | Berapa pemain EBT tercatat, apa yang baru | PB | F1 | F-S1 |
| `/perusahaan` | Sensus perusahaan dan lembaga | Siapa saja, per sektor dan provinsi | PB | F1 | F-S2, F-S6 |
| `/p/<slug>` | Profil entitas | Siapa dia, apa buktinya, terhubung ke siapa | PB (+kontak PG) | F1 | F-S3, F-S4, F-J5 |
| `/rantai` | Rantai pasok | Siapa memasok siapa | PB | F2 | F-R1 |
| `/pembiaya` | Pembiaya dan investor | Siapa mendanai EBT, berapa | PB | F2 | F-R2 |
| `/bumn` | Kuadran BUMN energi | Di mana posisi tiap BUMN energi | PB | F2 | F-R4 |
| `/data-center` | Listrik data center | Dari mana listrik data center | PB | F2 | F-R5 |
| `/desa` | Energi desa dan koperasi | PLTS desa, KDMP, DRE | PB | F2 | F-R6 |
| `/peta` | Peta proyek dan entitas | Di mana semuanya | PB | F1 | F-J4 |
| `/wilayah/<prov>` | Rapor provinsi | Kondisi EBT provinsi ini | PB | F2 | F-W1 |
| `/kebijakan` | Regulasi dan jejak isu | Aturan apa, posisi METI apa | PB | F2 | F-K1, F-K2 |
| `/cerita` | Cerita data | Satu pertanyaan, satu jawaban bersumber | PB | F2 | F-K4 |
| `/metode` | Metode, sumber, skor | Bagaimana angka dihitung | PB | F1 | F-S7 |
| `/direktori` | Direktori anggota, delapan tab (lihat F-J) | Pakar, lembaga, riset, pendanaan, pustaka | AN | F0 | F-J1 sampai F-J10, F-R3, F-W2, F-K3 |
| `/masuk` | Login (plus `/aktivasi`, `/ganti-sandi`) | | semua | F0 | F-M1 |
| `/admin` | Akun, peran, kurasi, antrean koreksi, jejak | | AD (KR untuk kurasi dan koreksi) | F0 | F-M2, F-M4, F-M5, F-M8 |

Delapan tab `/direktori` setelah porting: Pakar (dengan segmen Tokoh), Lembaga, Wilayah, Inovasi, Riset (empat sub-tab), Sistem data, Pendanaan, Pustaka. Tab Donasi dibuang dan Kejadian besar diganti sub-tab Jejak isu di bawah Riset (TIKET JM-C03). `GRAND-DESIGN` menyebut "9 tab" karena menghitung asalnya; pengerja memakai daftar TIKET JM-C03.

## 4. Fondasi

### F-A1 Kerangka, router, dan kepala situs
- **Tujuan:** satu Worker Cloudflare dengan static assets, router objek `"METODE /path/:id"`, tabel halaman, dan kepala situs navy bersama di semua halaman.
- **Isi:** kepala navy (logo METI putih, menu publik, tab, tombol tema, tombol bahasa, tombol masuk atau keluar), token METI di `public/inti/tema.css`, `_headers` dengan CSP tanpa skrip inline, `noindex` di `/direktori` dan `/admin`.
- **Aturan:** halaman tanpa izin dialihkan ke `/masuk?ke=`; palet Midnight Energy (Navy `#122B4A`, Petrol `#155B79`, Teal `#0A896A`, Cyan `#65C7EC`, Lime `#B9D75A`, Cloud `#F3F7FB`), Teal untuk teks `#07705A`; judul Poppins, isi Inter; tanpa build step (D4, D11).
- **Tiket:** JM-A01, A02, A04, A05, C01.

### F-A2 Dwibahasa Indonesia dan Inggris
- **Tujuan:** setiap halaman bisa dibaca dalam ID atau EN lewat satu tombol (K8).
- **Isi:** kamus `public/i18n/id.json` dan `en.json`, `public/i18n.js` dengan `t(kunci)`, `angka(n)`, `tanggal(d)`; pilihan disimpan di `localStorage` (dibungkus try/catch) dan parameter `?lang=`; kolom data `_en` (`nama_en`, `ringkas_en`).
- **Aturan:** bawaan Indonesia. Kolom `_en` kosong tampil versi Indonesia dengan pil "ID". Terjemahan Inggris ditandai "perlu tinjau" sampai ada peninjau (C-14). Angka lewat satu formatter: `toLocaleString("id-ID")` di ID, format Inggris di EN (D17). Gerbang: kunci `id.json` sama dengan kunci `en.json`; tidak ada teks Indonesia tertanam di JS layar baru.
- **Tiket:** JM-C06 (dan syarat di semua tiket layar).

### F-A3 Tombol isi data dummy
- **Tujuan:** layar tidak pernah kosong saat didemokan, tanpa data asli tercampur (D18).
- **Isi:** dua tombol ikon (isi dan hapus) plus baris status; hanya SA (cek `GET /api/saya`); isi ditentukan halaman yang sedang dibuka lewat `dataContoh()`: entitas energi fiktif berakhiran "(contoh)", domain `example.org`.
- **Aturan:** baris dummy berkolom `dummy=1` dan tersaring dari potret publik; "hapus" hanya menghapus baris `dummy=1`; tiap halaman baru wajib punya cabang `dataContoh()`; gerbang dummy dari asal ikut diporting.
- **Tiket:** JM-C05, C07.

### F-A4 Daftar tolak terpusat
- **Tujuan:** orang atau lembaga yang tidak boleh tampil tidak tampil di mana pun (D14).
- **Isi:** `daftar-tolak.json` privat di R2 (bukan repo): orang atau lembaga terkait kasus hukum korupsi, orang yang sudah meninggal, nama yang diminta keluar.
- **Aturan:** pipeline menyaring sebelum membangun potret mana pun; uji memastikan id di daftar tidak muncul di potret manapun (U7); pengecualian "diminta keluar" mengalahkan semua sumber.
- **Tiket:** JM-D11.

### F-A5 Potret per lapis
- **Tujuan:** hak akses ditegakkan di sumber data, bukan disaring di klien (D7).
- **Isi:** pipeline menulis `potret/publik/*.json`, `potret/anggota/*.json`, `potret/pengurus/*.json` ke R2; layar membaca potret lewat Worker berpenjaga sesi; D1 hanya untuk tulis dan hak.
- **Aturan:** kolom pribadi (surel, telepon, alamat) hanya di lapis Pengurus; gerbang memindai potret publik dan anggota mencari pola surel dan telepon; berkas yang susut lebih dari 20% ditolak `jaga_unggah`.
- **Tiket:** JM-D02, D12.

### F-A6 Pipeline panen sampai potret
- **Tujuan:** data publik masuk sebagai fakta bersumber tanpa kerja manual berulang.
- **Isi:** panen OpenAlex pakar EBT (topik energi, `country_code:ID`, karya minimal 3), OSM pembangkit per provinsi (Overpass, `power=plant`, atribusi ODbL), Ember, OWID, IRENASTAT, World Bank (Indicators dan Projects), regulasi BPK dan JDIH ESDM, AESI anggota, GEM manual, WRI GPPD; lalu `jaga_unggah`, saring daftar tolak, `hubung.mjs` (graf, dedup, `strategis()` dengan `DIRI` = METI), skor keyakinan, potret per lapis ke R2. Alurnya ada di ALUR §2.
- **Aturan:** baris tanpa `sumber_url`, `tanggal_periksa`, dan tingkat bukti ditolak (D5); GEM dan WRI ditandai lemah dan dicek lisensinya; tanpa panen situs terlarang; panen 1001startup.id tertahan sampai C-13.
- **Tiket:** JM-D01 sampai D06, D08, D09, D10, D13.

## 5. P1 Sensus EBT

Padanan: 1001startup.id `/startups` dan `/company/<slug>`, tab Lembaga direktori. Semua halaman publik P1 menaati pola penyajian R9: kalimat fakta berstempel tanggal, kartu angka dengan penyebut ("N dari M baris"), tabel atau grafik, "Cara menghitung", "Cara mengutip", tanggal beku.

### F-S1 Beranda sensus
- **Tujuan:** gerbang ke seluruh dataset dengan satu janji: setiap angka tertaut ke dokumen yang memuatnya.
- **Isi:** judul dan Jawaban singkat bertanggal ("Per <tanggal>, sensus mencatat N entitas EBT di M provinsi ..."), kotak cari global, 4 sampai 5 kartu angka (entitas, ikatan, proyek, provinsi, sumber), cuplikan hidup tiap dataset (sampel sepuluh baris sensus, kuadran mini, matriks mini), tanggal pembaruan sendiri per dataset, cerita data terbaru, pita "Draf kerja, sumber publik saja, angka turunan berlabel estimasi".
- **Aturan:** tiap kartu menyebut penyebutnya; kalimat fakta disusun dari field yang ada dan field kosong dibuang dari kalimat; tanpa angka tanpa sumber (U4).
- **Tiket:** JM-E01.

### F-S2 Sensus perusahaan dan lembaga
- **Tujuan:** menjawab "siapa saja pemain EBT, per sektor dan provinsi".
- **Isi:** paragraf cakupan, kalimat fakta, tombol "Jelajahi" dan "Lihat di peta"; kartu angka; bilah alat: kolom cari (nama, sektor, kota), chip sektor berhitungan (satu aktif), baris chip kedua sebagai penyaring boolean berhitungan (dengan pendanaan terungkap saja, dengan kapasitas tercatat saja, sembunyikan anak grup, anggota METI saja), pilih provinsi, penghitung "N tampil"; tabel `Entitas | Sektor | Provinsi | Pemasok | Pelanggan | Proyek | MW`, bisa diurut, paginasi; sel angka membawa penanda (`EST`, batas bawah, "di induk").
- **Aturan:** sektor mengikuti `SEKTOR` di ALG §2; klik baris membuka `/p/<slug>`; chip, urut, dan paginasi tidak boleh membekukan layar (D3, F-J10 memakai pola yang sama); entitas tanpa profil lengkap tampil dengan penanda "di luar sensus" (F-S6).
- **Tiket:** JM-E02.

### F-S3 Profil entitas bersumber
- **Tujuan:** satu halaman yang memuat siapa entitas itu, apa buktinya, dan terhubung ke siapa.
- **Isi:** urutan bagian (TIKET JM-E03), tiap bagian satu kartu:
  1. Jejak halaman dan kepala: logo, nama, nama badan hukum, pil sektor, nomor sensus ("#n dari N").
  2. Ringkas bertanggal (dan versi EN bila ada), baris "Cara mengutip" dengan tanggal beku, tombol situs dan "Lihat di peta".
  3. Baris fakta berlabel (nilai, domain sumber, catatan satu kalimat): Pendiri atau Pimpinan, Berdiri, Kapasitas, Proyek, Pendanaan, Lokasi; perbedaan antar sumber ditulis, tidak dilicinkan; angka turunan berlabel `EST` dengan rumus tertulis di bawahnya.
  4. Investor atau Pembiaya (chip tertaut ke profil).
  5. Pemasok dan Pelanggan: dua kolom dikelompokkan per jenis berhitungan; tiap baris memuat nama (atau "di luar sensus"), kalimat hubungan, jenis bukti, domain sumber, tanggal dokumen; tooltip memuat kutipan beku.
  6. Proyek.
  7. Terhubung (semua tetangga dikelompokkan per relasi, F-J5).
  8. Keyakinan: skor 0 sampai 1, label Tinggi, Sedang, atau Rendah, dan paragraf alasan (F-S4).
  9. Sumber: daftar `domain + URL penuh` bertanggal periksa.
  10. Sejenis di sektor yang sama (enam nama dengan nomor sensus).
  Kaki: "Hanya sumber publik. Angka berlabel EST adalah hitungan kami, bukan angka yang diumumkan. Cara estimasi dibuat" dan tombol kembali ke sensus.
- **Aturan:** kontak lapis Pengurus tidak tampil untuk PB dan AN; kontak publik hanya surel peran dan tautan resmi entitas, dengan baris etika "tidak ada surel pribadi yang ditebak dan tidak ada nomor ponsel"; status situs punya tiga nilai (hidup, tidak bisa dicek, mati) dengan tanggal cek karena situs BUMN dan koperasi sering menolak robot (R9 §2.3); lencana "Anggota METI" hanya bila dikonfirmasi Sekretariat (D13); tombol "Koreksi halaman ini" menuju F-M5.
- **Tiket:** JM-E03, D01, D13.

### F-S4 Skor keyakinan dan tingkat bukti
- **Tujuan:** pembaca tahu seberapa jauh sebuah profil bisa dipercaya.
- **Isi:** skor 0 sampai 1 per profil, label Tinggi/Sedang/Rendah, kalimat alasan (jumlah sumber, jenis sumber, umur periksa, kecocokan antar sumber; rumus di ALG §4); tiap fakta dan ikatan membawa `tingkat_bukti` dan `jenis` sumber (`dokumen-resmi`, `filing`, `situs-sendiri`, `media`, `data-terbuka`, `via-pihak-ketiga`).
- **Aturan:** skor dihitung pipeline, bukan diketik kurator; tanpa fakta bersumber skor tidak dihitung dan profil tampil "di luar sensus"; skor tampil dengan pil "Hipotesis" sampai uji ALG §4 selesai (C-16); sumber lemah dinyatakan terang-terangan.
- **Tiket:** JM-D13, E03, E05.

### F-S5 Label EST, tanda "tidak ada angka", dan penanda
- **Tujuan:** angka turunan dan angka kosong tidak disalahbaca.
- **Isi:** `EST` di samping angka turunan dengan rumus di bawahnya; `min` untuk batas bawah; `di induk` untuk angka yang sudah masuk grup; garis datar berarti tidak ada angka kredibel; tiap total menyebut berapa baris yang menyumbang ("249 dari 558 baris"); tooltip penanda menjelaskan artinya.
- **Aturan:** tidak ada angka yang diisi tebakan; tiap baris tanpa angka menyebut satu alasan; penanda didaftarkan di `/metode`.
- **Tiket:** JM-E05, E02, D01.

### F-S6 Di luar sensus
- **Tujuan:** entitas tidak harus punya profil lengkap untuk punya halaman, cukup ada hubungan bersumber yang melewatinya (R9 §2.4).
- **Isi:** entitas dengan ikatan bersumber tetapi tanpa profil lengkap (misalnya PLN, Pertamina NRE, lembaga pembiaya asing) tampil sejajar di tabel dan rantai dengan penanda "di luar sensus" dan nama hukum; halamannya diawali kalimat "Bukan perusahaan sensus. Halaman ini ada karena rantai perusahaan sensus melewatinya" plus satu kalimat peran bersumber.
- **Aturan:** kurator menandai status; ikatan wajib bersumber; entitas "di luar sensus" tidak dihitung di U1.
- **Tiket:** JM-D01, E02, E03.

### F-S7 Metode, sumber, dan skor
- **Tujuan:** menjawab "bagaimana angka dihitung" untuk seluruh platform.
- **Isi:** `/metode` memuat tingkat bukti dan jenis sumber, skor keyakinan, label EST dan penanda, aturan tanggal beku, aturan menghitung (apa yang dihitung dan tidak dihitung, penyebut tiap total), cara mengutip, kebijakan koreksi, daftar sumber data dengan tanggal ambil dan lisensi, kebijakan privasi ringkas (rujukan KPV), kontak pelapor.
- **Aturan:** halaman ini sendiri punya Jawaban singkat dan tanggal; tabel "tidak dihitung, ada di mana, alasannya" wajib ada.
- **Tiket:** JM-E05.

## 6. P2 Jaringan

Padanan: tab Pakar, Lembaga, Inovasi, Riset, Sistem data di direktori asal. Semua fitur P2 adalah porting [A] dari `akademisi.html/js/css` ke `direktori.*` dengan konstanta domain energi (R1 §9). Lapis akses: AN ke atas, kecuali profil dan peta yang juga ada di P1 untuk PB.

### F-J1 Pencarian global
- **Tujuan:** satu kotak cari untuk semua jenis entitas.
- **Isi:** kotak cari besar di kepala `/direktori` (juga di `/`), pintasan tombol `/` untuk fokus, placeholder "Cari orang, lembaga, kampus, inovasi, dokumen, wilayah", panel hasil berkelompok per jenis dengan "Semua", normalisasi nama (`nrmCari`), hasil membuka profil atau tab terkait.
- **Aturan:** pencarian berjalan di klien atas potret yang sudah dimuat; panel hasil tidak membekukan layar; versi publik di `/` hanya mencari entitas lapis Publik; saran memakai sinonim energi (FTS D1 hanya bila terbukti perlu, R6 §4.2).
- **Tiket:** JM-C02, C03, E01.

### F-J2 Pakar dan Tokoh
- **Tujuan:** menemukan pakar yang bisa diundang untuk isu X di provinsi Y.
- **Isi:** tab Pakar: kartu per orang, paginasi 24, cari (nama, kampus, topik), pilih provinsi multi, pilih kampus atau lembaga multi, program studi, segmen sumber, urut (h-index, Karya, Sitasi), "Pakar baru bulan ini", daftar pendek per kartu, keadaan kosong dengan tombol "Hapus semua saringan"; segmen Tokoh untuk pengurus METI, Dewan Penasihat, Dewan Pengawas, Dewan Pakar, dan Pengurus Harian (SK 0008).
- **Aturan:** pakar dari OpenAlex dengan topik energi (bukan subbidang yang terlalu longgar) dan karya minimal 3 (JM-D03); tokoh hanya nama dan jabatan publik (C-11); orang di daftar tolak tidak tampil; lapis PB hanya nama, jabatan, afiliasi (C-04); tombol koreksi dan hapus di tiap profil.
- **Tiket:** JM-C02, C03, C04, D03, D07.

### F-J3 Lembaga: peta, daftar, analisa
- **Tujuan:** melihat semua lembaga jaringan dalam tiga cara.
- **Isi:** segmen Peta (MapLibre, sidebar tarik, legenda lapisan, "Terbang ke" provinsi), Daftar, Analisa (grafik per kategori, skala, provinsi, sektor); chip kategori (10 kategori lembaga energi, JM-C03), skala, sektor; lembar rinci (drawer) per lembaga; cari di peta; sub-tampilan Proyek dialihkan ke F-J4.
- **Aturan:** METI Pusat, METI Wilayah, METI Institute, dan METI Energi Muda tidak diberi bintang (D13); lencana "Anggota METI" bila dikonfirmasi; peta dan klik chip lolos uji INP (D3, U8).
- **Tiket:** JM-C02, C03, E04.

### F-J4 Peta proyek dan entitas
- **Tujuan:** menjawab "di mana semuanya".
- **Isi:** `/peta` publik dan tab Lembaga/Peta anggota memakai satu kode peta: MapLibre, panel samping yang bisa ditarik, lapisan (proyek, entitas, METI Wilayah, pembangkit), legenda hanya yang digambar, "Terbang ke", penanda logo bundar seperti peta 1001startup.id dengan inisial bila logo tidak ada, panel hitungan per provinsi, keterangan jujur "N dari M entitas bertitik", cadangan tabel bila tanpa JS atau WebGL.
- **Aturan:** titik ditempel ke jalan, bukan gedung, dan dinyatakan di profil; logo hanya dari situs resmi entitas, disimpan di R2, dihapus atas permintaan (C-15); lapisan peta tidak membekukan layar; panel dan legenda meniru peta utama direktori asal (K10, D12).
- **Tiket:** JM-E04, D04, D12.

### F-J5 Terhubung dan Sejenis
- **Tujuan:** tiap profil membuka jaringannya.
- **Isi:** bagian "Terhubung" di tiap profil menampilkan semua tetangga di graf dikelompokkan per relasi (anggota, pengurus, memasok, mendanai, dimiliki, mengembangkan, mengatur, bekerja di, dan seterusnya; jenis di ALG §3), baris ringkas (avatar, nama, satu baris meta, maksimal dua pil), klik membuka profil tetangga; "Sejenis" untuk entitas serupa; graf = `graf.json` berisi `simpul` dan `sisi` bertanggal dan bersumber.
- **Aturan:** kunci ambigu tidak ditautkan; `DIRI` = METI tidak pernah diberi bintang; kalimat jujur di bawah daftar: tidak adanya tautan bukan tidak adanya hubungan, hanya belum ada sumber publik yang menyebutnya.
- **Tiket:** JM-D10, E03, C02.

### F-J6 Inovasi
- **Tujuan:** katalog teknologi dan inovasi energi.
- **Isi:** tab Inovasi: peta, klik batang per sektor, per status, per jenis teknologi, per kesiapan (TKT 1 sampai 9), lembar rinci, kelas kesiapan "siap dipakai".
- **Aturan:** TKT diisi pembuat atau kurator dengan sumber; tanpa kesiapan tanpa sumber.
- **Tiket:** JM-C02, C03.

### F-J7 Riset (empat sub-tab)
- **Tujuan:** riset energi yang bisa dicari dan dipakai.
- **Isi:** empat sub-tab di tab Riset: Riset (indeks, saringan, ringkasan mesin, peta wilayah riset, lembar rinci), Jejak isu (pengganti Kejadian besar; lihat F-K2), Pusat studi, Aset riset (laboratorium, fasilitas uji, perangkat, `bisa_disewa`).
- **Aturan:** ringkasan abstrak riset dibuat Workers AI secara ekstraktif dan berlabel "Ringkasan mesin" (C-18); rute `/api/riset/:id` memakai penjaga laju; sumber OpenAlex dan Crossref.
- **Tiket:** JM-C02, C03, C04, D03.

### F-J8 Sistem data
- **Tujuan:** menunjukkan sumber data energi milik lembaga lain dan cara mengambilnya.
- **Isi:** tab Sistem data: chip akses (terbuka, API terbuka, API berkunci, login, permohonan, tertutup, berwarna per jenis), saringan sektor, pemilik, jenis, "Bisa langsung diambil, belum dipakai", grafik per sektor, akses, pemilik (sepuluh terbanyak), paginasi 18. Isi awal dari R8 (HEESI, JDIH, BPK, Ember, OWID, IRENASTAT, ESDM One Map, EBTKE, RUPTL, dan lainnya).
- **Aturan:** status akses ditulis jujur (sumber yang memblokir robot ditandai, tidak dipanen); tiap sistem menyebut lisensi atau "belum diketahui".
- **Tiket:** JM-C02, C03.

### F-J9 Daftar pendek dan ekspor
- **Tujuan:** menyusun daftar orang atau lembaga untuk undangan atau kerja sama.
- **Isi:** bilah tetap di bawah (jumlah, Lihat, Kosongkan, Unduh), input "Keperluan" (opsional, maksimal 120 karakter), unduh Excel, Word, atau PDF (pemuat CDN ber-SRI), salin surel (hanya yang boleh dilihat peran itu), versi untuk lembaga; cetak lewat iframe dengan band navy bergaya METI, kepala kolom navy rata tengah berulang, zebra, "Hal n dari m".
- **Aturan:** daftar disimpan di `localStorage` (dibungkus try/catch); semua kiriman ke luar adalah tombol yang ditekan manusia; tidak ada surel dikirim otomatis; semua kepala kolom tabel ekspor rata tengah.
- **Tiket:** JM-C02, C03.

### F-J10 Panel chip sektor
- **Tujuan:** menyaring tampilan menurut sektor energi, menggantikan chip bencana asal.
- **Isi:** chip multi-pilih (atau, kosong = semua) berdasarkan `SEKTOR` (EBT, penyimpanan, jaringan, efisiensi, kendaraan listrik, sampah jadi energi, hidrogen; nuklir dan CCS sebagai "terkait"), URL `?sektor=a,b`, "Semua sektor" mengosongkan; hanya tampil di tab yang relevan (`SEKTOR_VIEW`).
- **Aturan:** panel tersembunyi berarti saringan dilepas; klik chip lolos INP (urgent untuk chrome kontrol, deferred untuk subtree berat).
- **Tiket:** JM-C03, C02.

## 7. P3 Rantai dan modal

Padanan: 1001startup.id `/chain`, `/investors`, `/bumn`, `/data-center`, `/umkm`. Seluruh halaman publik (PB), fase F2.

### F-R1 Rantai pasok
- **Tujuan:** menjawab "siapa memasok siapa" untuk modul, inverter, baterai, EPC, IPP, offtaker.
- **Isi:** `/rantai`: Jawaban singkat ("N ikatan pasok dan M ikatan kepemilikan, tiap satu klaim yang masih dibuat dokumen bernama; diperiksa ulang <tanggal>"), chip jenis hubungan berhitungan (bahan, komponen, kontrak manufaktur, barang, perangkat keras, energi, perangkat lunak, jasa EPC, lisensi teknologi), tabel `Entitas | Sektor | Pemasok | Pelanggan | Korporasi` urut dari yang paling terhubung, entitas "di luar sensus" sejajar. Halaman satu entitas: diagram dua sisi (pemasok kiri, pelanggan kanan, kotak tengah "N masuk, M keluar"), daftar "Setiap hubungan" dengan kalimat hubungan, jenis bukti, domain, tanggal, angka konsentrasi bila ada, tooltip kutipan beku; peta rantai dua tingkat; daftar dokumen sumber.
- **Aturan:** hanya dua jenis bukti untuk ikatan pasok: `filing` dan `situs-sendiri` (tanpa "berita"); rantai tidak diikuti melalui rel bersama yang menghubungkan hampir semua pihak; "tidak ada tautan" tidak sama dengan "tidak ada hubungan".
- **Tiket:** JM-F01, D01, D10.

### F-R2 Pembiaya dan investor
- **Tujuan:** menjawab "siapa mendanai EBT, berapa".
- **Isi:** `/pembiaya`: tabel `Pembiaya | Entitas didanai | Total terungkap | Sektor utama | Contoh`; profil pembiaya dengan kalimat jujur ("semua di halaman ini berasal dari sensus"), empat angka, tabel portofolio; peringatan bahwa total adalah semua investor digabung, bukan cek satu dana; sumber World Bank Projects, IATI, JETP, AIIB, GCF.
- **Aturan:** angka tanpa sumber tidak tampil; dana iklim, hibah, pinjaman, dan ekuitas dipisah jenisnya.
- **Tiket:** JM-F02, D05.

### F-R3 Pendanaan (tab direktori)
- **Tujuan:** skema pendanaan yang bisa diajukan pakar, kampus, atau pengembang.
- **Isi:** tab Pendanaan di `/direktori`: segmen Skema, Proyek, Negara donor; jenis (pinjaman, hibah G2G, hibah multilateral, dana iklim, dana riset, instrumen domestik, asuransi risiko); "Cocok mengajukan" (pencocokan skema ke pakar atau lembaga); lembar skema; tumpukan pemberi.
- **Aturan:** pencocokan tampil dengan alasan; tab Donasi dibuang.
- **Tiket:** JM-C02, C03, F02.

### F-R4 Kuadran BUMN energi
- **Tujuan:** menempatkan tiap BUMN energi pada dua sumbu.
- **Isi:** `/bumn`: label tanggal, judul, paragraf, kalimat fakta, lima angka besar, kuadran dua sumbu dengan titik logo bundar (BUMN besar berlogo, sisanya inisial), garis silang di median, skala sama 0 sampai 5, pemilih X dan Y dan "Lensa" bernama, empat kuadran bernama manusiawi, klik titik membuka kartu skor dengan alasan dan sumber, tabel "Semua skor dan peringkat" (angka kecil = peringkat, `=` untuk seri), blok "Cara skor bekerja" dengan rumus teks dan pita 0 sampai 5, bagian "Batas". Halaman grup (PLN, Pertamina NRE, PGE): pita pendapatan per wilayah, "Apa yang diminta negara", "Perusahaan dan anak usahanya per cabang" dengan persentase kepemilikan dan status aktif atau belum beroperasi.
- **Aturan:** skor 0 sampai 5 bersumber dan berpil "Hipotesis" sampai C-16 dijawab; garis datar bila tidak ada angka publik; METI tidak menilai BUMN dengan kata "netral".
- **Tiket:** JM-F03, D01, D10.

### F-R5 Listrik data center
- **Tujuan:** menjawab "dari mana listrik data center".
- **Isi:** `/data-center`: label, judul, kalimat fakta, matriks daya (baris tapak greenfield dan brownfield, kolom jaringan PLN, di sisi pelanggan, di luar jaringan, hibrida terbarukan; tiap sel punya judul manusiawi, anotasi risiko, operator, "listrik dari", pemasok, jumlah proyek dan MW; sel kosong tetap ditulis dengan alasan), empat angka, "Apa yang ditunjukkan peta", matriks "Siapa menanggung risiko" (peralatan, bangun, lahan, daya, modal, pelanggan; tingkat Utama/Bersama/Terbatas, bisa diklik membuka kutipan bersumber dengan label kepercayaan), kartu proyek dengan saringan, aturan (misalnya wheeling), metode, legenda singkatan.
- **Aturan:** sel `Terbatas` berarti tidak ada sumber yang menyebut peran, bukan "tidak ada peran"; ilustrasi gambar ditandai bukan tapak asli.
- **Tiket:** JM-F04.

### F-R6 Energi desa, KDMP, dan DRE
- **Tujuan:** menjawab "PLTS desa, koperasi, dan energi terbarukan terdistribusi ada di mana dan dikelola siapa".
- **Isi:** `/desa`: lima angka dengan penyebut, chip jenis (PLTS desa, PLTMH, PLTBm, KDMP, DRE lainnya), **chip tingkat bukti berhitungan** (terverifikasi di lapangan, dikonfirmasi pihak kedua, dokumen resmi, terdaftar saja), pilih provinsi, tabel `Entitas | Jenis | Lokasi | Kapasitas | Pengelola | Kontak publik`, tautan ke repositori pembelajaran DRE bila ada.
- **Aturan:** kontak hanya saluran publik resmi tanpa data pribadi; hover pada tingkat bukti menjelaskan artinya; satu baris satu klaim berderajat verifikasi.
- **Tiket:** JM-F05, D09, D07.

## 8. P4 Wilayah dan proyek

### F-W1 Rapor provinsi
- **Tujuan:** menjawab "kondisi EBT provinsi ini".
- **Isi:** `/wilayah/<prov>`: Jawaban singkat bertanggal; kartu: potensi, kapasitas terpasang, bauran, rasio elektrifikasi (BPS, HEESI, RUPTL per wilayah), entitas dan proyek di provinsi, pakar dan kampus, METI Wilayah (status Established, Coming soon, Planned) dan agenda terakhir, RUED dan dokumen daerah, regulasi daerah; tombol PDF.
- **Aturan:** tiap angka bersumber dan bertanggal; angka potensi menyebut sumber dan versinya karena berbeda antar dokumen (R3); skor kesiapan bila ada berpil "Hipotesis"; provinsi tanpa data menampilkan alasan, bukan kolom kosong.
- **Tiket:** JM-F06, D05, D06.

### F-W2 Tab Wilayah di direktori
- **Tujuan:** perbandingan dan peringkat antar wilayah untuk anggota.
- **Isi:** tab Wilayah di `/direktori`: pilih kab/kota atau provinsi (`?wilayah=<kode>`); tanpa pilihan: peta kuadran kesenjangan dan peringkat; dengan pilihan: kartu lembaga, fiskal, fasilitas, potensi, skor, PDF wilayah.
- **Aturan:** panel chip sektor boleh disembunyikan di tab ini; skor berpil "Hipotesis".
- **Tiket:** JM-C02, C03, F06.

### F-W3 Pembangkit dan proyek
- **Tujuan:** daftar pembangkit dan proyek EBT yang bisa dicari dan dipetakan.
- **Isi:** jenis entitas `proyek` dengan jenis pembangkit (PLTS, PLTB, PLTA, PLTM, PLTP, PLTBm, PLTSa), kapasitas MW, status (beroperasi, konstruksi, direncanakan, diumumkan), pengembang, offtaker, lokasi; sumber OSM (`power=plant`), RUPTL, GEM, WRI (ditandai lemah); tampil di `/peta`, profil, dan rapor provinsi.
- **Aturan:** OSM wajib atribusi ODbL; WRI hanya 178 pembangkit Indonesia tanpa surya dan angin; status "diumumkan" berbeda dari "direncanakan" dan tidak dihitung ke MW terpasang.
- **Tiket:** JM-D04, D09, E04.

## 9. P5 Kebijakan dan pengetahuan

### F-K1 Regulasi dan kebijakan
- **Tujuan:** aturan apa yang berlaku dan bagaimana relasinya.
- **Isi:** `/kebijakan`: daftar regulasi EBT (UU, PP, Perpres, Permen, SK) dengan status berlaku, relasi mengubah dan mencabut, tanggal, penerbit, tautan sumber (peraturan.bpk.go.id, JDIH ESDM); dokumen perencanaan (KEN, RUEN, RUED, RUPTL); saringan jenis, sektor, status; Jawaban singkat.
- **Aturan:** status berlaku tidak diketik tangan bila sumber punya status; tiap regulasi punya tombol sumber primer; relasi antar peraturan dari sumber, bukan kesimpulan kami.
- **Tiket:** JM-F07, D06.

### F-K2 Jejak isu
- **Tujuan:** menelusuri satu isu kebijakan dari awal sampai kini, dengan posisi METI.
- **Isi:** daftar isu (RUU EBET, Perpres 112/2022, RUEN, RUPTL 2025 sampai 2034, JETP, dan lainnya); tiap isu punya garis waktu bertanggal (peristiwa, dokumen, posisi METI, pihak yang terlibat), "pelajaran" dan tautan ke regulasi, entitas, dan pakar; tampil di `/kebijakan` dan sebagai sub-tab Riset di `/direktori`.
- **Aturan:** setiap butir garis waktu bersumber; posisi METI hanya dikutip dari dokumen METI yang diterbitkan; tidak ada penilaian ketua atau pengurus; tanpa kata "netral".
- **Tiket:** JM-F07.

### F-K3 Pustaka
- **Tujuan:** buku, dokumen, relasi peraturan, dan berita dalam satu rak.
- **Isi:** tab Pustaka di `/direktori`, empat sub-tab: Buku dan kajian METI (sampul dari R2), Dokumen (RUED, RUPTL, kajian, position paper, regulasi), Relasi peraturan, Berita (kategori, filter jenis entitas, media, tanggal; paginasi 15).
- **Aturan:** sampul dan berkas disimpan di R2; hak cipta dokumen pihak lain: hanya metadata dan tautan; berita dari API metiires.or.id dengan atribusi (F-K5).
- **Tiket:** JM-C02, C03, D06, F10.

### F-K4 Cerita data
- **Tujuan:** satu pertanyaan, satu jawaban bersumber, bisa dikutip.
- **Isi:** `/cerita`: indeks kartu berlabel topik, tanggal, judul berupa pertanyaan, dan kalimat "Per <tanggal>" yang sudah memuat jawabannya. Artikel mengikuti urutan baku: (1) label topik, tanggal, judul pertanyaan, subjudul; (2) **Jawaban singkat**; (3) empat angka besar; (4) satu grafik batang berurutan; (5) tabel lengkap dengan kolom sumber (domain dan tautan) dan garis datar untuk baris tanpa angka; (6) dua atau tiga bagian "bukan semua ini X" yang membuka penyebut; (7) **Cara menghitung** (aturan hitung dan batas); (8) **Cara mengutip** (kredit, tautan, tanggal beku); (9) "Lebih banyak cerita".
- **Aturan:** angka cerita dibekukan pada tanggalnya dan diberi tanda "beku <tanggal>"; profil terus diperbarui; dua lapis: arsip beku yang bisa dikutip dan data hidup; setiap cerita punya tombol koreksi.
- **Tiket:** JM-F08, E05.

### F-K5 Berita dan acara METI
- **Tujuan:** berita dan acara METI tampil tanpa menyalin situs metiires.or.id.
- **Isi:** sinkron berkala dari API publik metiires.or.id (berita, acara) ke potret; daftar di Pustaka/Berita dan kartu "Acara berikutnya" di beranda.
- **Aturan:** judul, tanggal, tautan, dan atribusi saja; tidak ada teks penuh; tanpa cron baru di luar batas (digabung ke jadwal harian).
- **Tiket:** JM-F10.

## 10. P6 Rumah METI

### F-M1 Masuk, keluar, dan lupa sandi
- **Tujuan:** pengguna berakun masuk dengan aman, tanpa ketergantungan penyedia surel (D8).
- **Isi:** `/masuk` (surel dan sandi), `/aktivasi` (tautan sekali pakai untuk menetapkan sandi), `/ganti-sandi`; `POST /api/masuk`, `POST /api/keluar`, `GET /api/saya`; sesi cookie `HttpOnly; Secure; SameSite=Lax`, 14 hari, hanya hash tersimpan di D1; sandi PBKDF2-SHA256 lewat WebCrypto (210.000 iterasi, perbandingan waktu tetap); batas 10 gagal per 15 menit per IP dan per surel. Lupa sandi: pengguna meminta ke Admin, Admin menyalin tautan reset.
- **Aturan:** pesan galat tidak membedakan "surel tidak ada" dan "sandi salah"; tidak ada daftar mandiri di F0 sampai F2 (C-09); surel otomatis menunggu pilihan penyedia (C-08); tautan aktivasi berlaku 72 jam dan sekali pakai.
- **Tiket:** JM-B02, B03, B06.

### F-M2 Admin akun
- **Tujuan:** Admin membuat dan mengelola akun (K9).
- **Isi:** `/admin` tab Akun: tabel akun (cari, peran, status, cakupan provinsi), buat akun (nama, surel, peran, cakupan), ubah peran, nonaktifkan, aktifkan, salin tautan aktivasi atau reset; `GET/POST /api/admin/akun`, `PATCH /api/admin/akun/:id`, `POST /api/admin/akun/:id/aktivasi`.
- **Aturan:** Admin tidak bisa menaikkan diri atau orang lain menjadi SA; SA terakhir tidak bisa dinonaktifkan; tiap tulis menulis baris jejak; akun dummy berkolom `dummy=1`.
- **Tiket:** JM-B01, B05, B07.

### F-M3 Hak baris (RLS) di Worker
- **Tujuan:** setiap baca dan tulis D1 melewati satu penjaga hak (D7, K9).
- **Isi:** modul `src/hak.js`: `boleh(peran, aksi, tabel, baris, akun)`, `baca()` menambah klausa cakupan (`dummy`, `cakupan_prov`, `pemilik`), `tulis()` menolak kolom di luar daftar putih; matriks kebijakan di KPV §1; gerbang memindai `env.DB.prepare` di luar `hak.js`.
- **Aturan:** tiap sel matriks punya uji "izinkan" dan uji "peran salah DITOLAK" (U5); potret R2 dibuat per lapis (F-A5), bukan disaring di klien; D1 bukan RLS bawaan: janji "RLS" dipenuhi oleh `hak.js` dan tidak dinyatakan lebih dari itu di teks antarmuka.
- **Tiket:** JM-B04, A05.

### F-M4 Kurasi entitas, fakta, ikatan, sumber
- **Tujuan:** kurator menambah dan memperbaiki data bersumber.
- **Isi:** `/admin` tab Kurasi (KR, AD, SA; WL hanya provinsinya): tambah dan ubah entitas (jenis, nama, nama EN, ringkas, sektor, provinsi, lintang bujur, situs, lapis, status), fakta (kunci, nilai, satuan, per tanggal, EST, sumber), ikatan (dari, ke, jenis, per tanggal, sumber), sumber (URL, jenis, tanggal periksa); hapus lunak; impor seed METI (12 anggota, 12 mitra, pengurus SK 0008, METI Wilayah).
- **Aturan:** `fakta.sumber_id` dan `ikatan.sumber_id` wajib (NOT NULL; U2); entitas tanpa fakta bersumber otomatis "di luar sensus"; kurator tidak melihat kontak lapis Pengurus kecuali berperan PG; nama di daftar tolak ditolak masuk.
- **Tiket:** JM-D01, D07, E06, B05. **Celah:** layar kurasi tidak punya tiket tersendiri di `TIKET.md` (hanya skema D01, antrean E06, dan seed D07 oleh manusia); sesi induk memutus apakah ditambah tiket `JM-E07`.

### F-M5 Hak koreksi dan antrean kurator
- **Tujuan:** siapa pun bisa meminta koreksi atau penghapusan, dan kurator memutuskannya (R6 §5).
- **Isi:** tombol "Koreksi halaman ini" di profil dan cerita (PB tanpa akun, dibatasi laju; AN dengan akun); formulir: halaman, bagian, isi yang diusulkan, sumber, kontak balasan (opsional); antrean di `/admin` untuk KR: status `baru`, `diproses`, `diterima`, `ditolak`, catatan keputusan; permintaan hapus data pribadi diprioritaskan.
- **Aturan:** kontak balasan hanya di lapis Pengurus dan tidak masuk potret publik; koreksi yang diterima menjadi fakta bersumber lewat F-M4, tidak mengubah data langsung; tiap keputusan menulis jejak; tidak ada balasan otomatis ke luar.
- **Tiket:** JM-E06.

### F-M6 Riwayat dengan METI
- **Tujuan:** mencatat hubungan tiap entitas atau tokoh dengan METI (narasumber, audiensi, MoU, sponsor, anggota).
- **Isi:** bagian "Riwayat dengan METI" di profil (lapis PG dan AD saja, C-17), baris bertanggal (jenis, uraian, pihak METI, sumber atau dokumen), tombol tambah; D1 lewat `hak.js`; lencana "Anggota METI" bergantung pada riwayat berjenis keanggotaan yang dikonfirmasi.
- **Aturan:** lapis PB dan AN tidak melihat riwayat; tiap baris menulis jejak; MoU hanya mencatat fakta dan tanggal, bukan alur paraf.
- **Tiket:** JM-F09.

### F-M7 METI Wilayah dan agenda
- **Tujuan:** ketua METI Wilayah mengurus provinsinya dan agenda pelantikan terlihat.
- **Isi:** daftar METI Wilayah (status Established, Coming soon, Planned; 33 rencana, tanggal peresmian, ketua, bukti kegiatan), agenda dan pelantikan (rundown baku, narasumber, tautan), kegiatan per wilayah; peran WL menulis hanya baris `cakupan_prov` miliknya; tampil di rapor provinsi (F-W1) dan beranda.
- **Aturan:** status dan tanggal bersumber dokumen METI (SK, undangan); ketidakcocokan antar dokumen ditulis, tidak dilicinkan (contoh Sumut "diresmikan" vs "rencana"); uji RLS per provinsi.
- **Tiket:** JM-F09, B04.

### F-M8 Jejak admin
- **Tujuan:** tiap perubahan data bisa ditelusuri.
- **Isi:** tabel `jejak(siapa, kapan, aksi, tabel, id, dari, ke)`; tab Jejak di `/admin` dengan saringan siapa, tabel, rentang waktu.
- **Aturan:** tiap tulis D1 menulis baris jejak dalam transaksi yang sama; jejak tidak bisa diubah atau dihapus lewat UI; dibaca AD dan SA.
- **Tiket:** JM-B07.

### F-M9 Klaim profil dan daftar mandiri (F3)
- **Tujuan:** entitas menegaskan profilnya sendiri dan anggota mendaftar tanpa perantara Admin.
- **Isi:** tombol "Klaim profil" (entitas membuktikan kendali domain atau surel resmi, kurator menyetujui), daftar mandiri dengan verifikasi Sekretariat, Turnstile, persetujuan tampil (consent) tercatat.
- **Aturan:** menunggu persetujuan Pengurus Harian (C-01) dan C-09; hanya fase F3; persetujuan dan penarikan persetujuan tercatat di jejak.
- **Tiket:** JM-G01, G02.

### F-M10 API terbuka baca potret publik (F3)
- **Tujuan:** pihak luar memakai data publik dengan atribusi.
- **Isi:** `GET /api/terbuka/*` membaca potret publik berstempel tanggal; dokumentasi singkat di `/metode`.
- **Aturan:** hanya lapis Publik; batas laju; atribusi dan tanggal beku di tiap respons; tanpa kunci pribadi.
- **Tiket:** JM-G03.

### F-M11 Pencocokan kebutuhan proyek (F3)
- **Tujuan:** mencocokkan kebutuhan proyek dengan pakar atau penyedia.
- **Isi:** formulir kebutuhan (sektor, provinsi, jenis jasa), daftar kecocokan dengan alasan tertulis dari fakta bersumber.
- **Aturan:** hanya fase F3 dan setelah C-01 dijawab; hasil tampil dengan alasan dan tanpa kirim otomatis; kontak hanya lewat tombol yang ditekan manusia.
- **Tiket:** JM-G04.

## 11. Keterlacakan fitur ke tiket dan keputusan

### 11.1 Fitur ke tiket

| Fitur | Tiket | Fase |
| --- | --- | --- |
| F-A1 | A01, A02, A04, A05, C01 | F0 |
| F-A2 | C06 | F0 |
| F-A3 | C05, C07 | F0 |
| F-A4 | D11 | F1 |
| F-A5 | D02, D12 | F1 |
| F-A6 | D01 sampai D06, D08, D09, D10, D13 | F1 |
| F-S1 | E01 | F1 |
| F-S2, F-S5, F-S6 | E02, D01, E03 | F1 |
| F-S3, F-S4 | E03, D01, D13 | F1 |
| F-S7 | E05 | F1 |
| F-J1 sampai F-J3, F-J6 sampai F-J10 | C02, C03, C04, D03, D07, E04 | F0 |
| F-J4 | E04, D04, D12 | F1 |
| F-J5 | D10, E03 | F1 |
| F-R1 | F01 | F2 |
| F-R2, F-R3 | F02, C02, C03 | F2 |
| F-R4 | F03 | F2 |
| F-R5 | F04 | F2 |
| F-R6 | F05 | F2 |
| F-W1, F-W2 | F06, C02, C03 | F2 |
| F-W3 | D04, D09, E04 | F1 |
| F-K1, F-K2 | F07, D06 | F2 |
| F-K3 | C02, C03, D06, F10 | F0 sampai F2 |
| F-K4 | F08, E05 | F2 |
| F-K5 | F10 | F2 |
| F-M1 | B02, B03, B06 | F0 |
| F-M2 | B01, B05 | F0 |
| F-M3 | B04 | F0 |
| F-M4 | D01, D07, E06 | F1 |
| F-M5 | E06 | F1 |
| F-M6, F-M7 | F09 | F2 |
| F-M8 | B07 | F0 |
| F-M9 sampai F-M11 | G01 sampai G04 | F3 |

Tiket lintas yang tidak membawa fitur sendiri: JM-A03 (sumber daya Cloudflare, manusia), JM-H01 (uji ujung ke ujung), JM-H02 (uji layar 1440 dan 390 px, terang dan gelap, ID dan EN), JM-H03 (penyelarasan), JM-H04 (rilis).

### 11.2 Keputusan terkunci ke bagian PRD

| No | Keputusan | Bagian PRD |
| --- | --- | --- |
| K1, K2 | Tiru dan porting direktori | 1.2, 6 |
| K3 | Cloudflare | F-A1 |
| K4, D11 | Gaya METI, palet Midnight Energy | F-A1 |
| K5 | Paket perencanaan lengkap | 1.4 |
| K6 | Riset sumber dan situs METI | F-A6, F-S7 |
| K7, D6 | Penyajian ala 1001startup.id | 5 sampai 9 |
| K8, D10, D17 | Dwibahasa dan formatter angka | F-A2 |
| K9, D7, D8, D9 | Admin, RLS, login, empat lapis | 2, F-M1 sampai F-M3 |
| K10, D12 | Peta meniru direktori | F-J4 |
| K11, D15, C-13 | Data 1001startup.id lewat sumber primer | 1.4, F-A6 |
| K12, D5 | Model entitas/fakta/ikatan | F-A6, F-S3, F-M4 |
| K13 | Artifact dan rencana ke GitHub | di luar PRD (TIKET) |
| K14 | 20 pertanyaan | KP bagian C |
| D13 | Kita = METI | 1.5, F-J3 |
| D14 | Daftar tolak | F-A4 |
| D16 | Fase F0 sampai F3 | 3, 11.1 |
| D18 | Tombol dummy | F-A3 |

### 11.3 Pertanyaan terbuka yang mengubah PRD

| Kode | Bagian PRD yang berubah bila jawabannya lain |
| --- | --- |
| C-01 | pita "Draf kerja", F-M9 sampai F-M11 |
| C-02, C-06 | tidak mengubah PRD (hanya `wrangler.jsonc`, CSP, TIKET A03) |
| C-03 | 1.4, F-K5 |
| C-04 | 2, F-J2, F-S3 |
| C-07 | 2, F-M7 |
| C-08, C-09 | F-M1, F-M9 |
| C-10, C-11 | F-J2, F-M4 |
| C-12 | F-J10 |
| C-13 | F-A6 |
| C-14 | F-A2 |
| C-15 | F-J4 |
| C-16 | F-S4, F-R4, F-R5, F-W2 |
| C-17 | F-M6 |
| C-18 | F-J7 |
| C-19 | urutan F0 dan F1 di TIKET |
| C-20 | 2 (peran KR) |
