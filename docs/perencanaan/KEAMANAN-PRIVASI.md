# KEAMANAN-PRIVASI: Platform Jaringan METI

Dokumen kesembilan dalam urutan otoritas (`KEPUTUSAN-METI` > `GRAND-DESIGN` > `RISET` > `PRD` > `ALUR` > `ALGORITMA` > `DESIGN-SYSTEM` > `DESAIN-TEKNIS` > `KEAMANAN-PRIVASI` > `RENCANA-UJI` > `TIKET`). Menang atas RENCANA-UJI dan TIKET; kalah dari dokumen di atasnya. Versi 1, 7 Nov 2026.

> **Untuk pekerja agen:** tiap baris matriks §1 adalah kontrak: satu uji "peran salah DITOLAK". Tidak menambah peran, kolom pribadi, atau rute tanpa baris di sini. Yang tidak tertulis: berhenti dan tanya pemilik. **Pengulas wajib:** `security-reviewer`, `guard-api` (dan `migrasi-idempoten` untuk migrasi akun).

**Kalimat yang tidak boleh dilanggar:** data pribadi (surel, telepon, alamat rumah) tidak pernah tampil di lapis Publik, tidak pernah masuk repo atau `public/`, dan tidak pernah dikirim ke layanan luar (KP D9, GD §9).

Singkatan: KP = KEPUTUSAN-METI, GD = GRAND-DESIGN, R1..R7 = `riset/`, DS = DESIGN-SYSTEM, RU = RENCANA-UJI, DT = DESAIN-TEKNIS.

## 1. Matriks hak

Baca `B`, tulis `T` (termasuk baca), tidak ada akses `-`. Peran (kolom), sesuai KP D9 dan C-07:

| Kode | Peran | Catatan |
| --- | --- | --- |
| PB | Publik | tanpa login |
| AN | Anggota | akun dibuat Admin |
| PG | Pengurus dan Sekretariat | peran `pengurus` |
| KR | Kurator | Bidang Informasi dan Multimedia (KP C-20) |
| WL | Wilayah | Ketua METI Wilayah, dibatasi `cakupan_prov` (KP C-07) |
| AD | Admin | akun, kurasi, jejak; tidak bisa menjadi Super |
| SA | Super Admin | akun super, tombol dummy |

Sel berkualifikasi: `B prov` atau `T prov` = hanya baris yang `cakupan_prov` akunnya cocok; `T diri` = hanya akun sendiri, terbatas pada kolom nama, bahasa, dan sandi; `T kirim` = boleh mengirim usulan, tidak mengubah data tujuan.

| Jenis data | PB | AN | PG | KR | WL | AD | SA |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Entitas publik (perusahaan, lembaga, proyek, regulasi, wilayah) | B | B | B | T | B | T | T |
| Fakta bersumber (nilai, `sumber_url`, `tanggal_periksa`, `tingkat_bukti`) | B | B | B | T | B | T | T |
| Ikatan antar entitas (pemasok, pelanggan, pembiaya, kepemilikan) | B | B | B | T | B | T | T |
| Orang: nama, jabatan, afiliasi (dari sumber publik, KP C-04, C-11) | B | B | B | T | B | T | T |
| Orang: kontak (surel, telepon kantor) | - | - | T | B | B prov | T | T |
| Data terlarang (alamat rumah, NIK, tanggal lahir, agama, status kawin, biometrik) | - | - | - | - | - | - | - |
| Potret R2 lapis publik (`potret/publik/*`) | B | B | B | B | B | B | B |
| Potret R2 lapis anggota (`potret/anggota/*`) | - | B | B | B | B | B | B |
| Potret R2 lapis pengurus (`potret/pengurus/*`) | - | - | B | B | - | B | B |
| Akun (peran, status, cakupan, surel akun) | - | T diri | T diri | T diri | T diri | T (bukan super) | T |
| Sesi (cookie, daftar sesi aktif) | - | T diri | T diri | T diri | T diri | T (cabut) | T |
| Koreksi (usulan perbaikan data) | - | T kirim | T kirim | T | T kirim prov | T | T |
| Riwayat dengan METI (narasumber, audiensi, MoU, sponsor; KP C-17) | - | - | T | - | - | T | T |
| Jejak admin (siapa, kapan, aksi, dari, ke) | - | - | - | - | - | B | B |
| Daftar tolak (`daftar-tolak.json`, privat di R2; KP D14) | - | - | - | - | - | - | B |
| Baris dummy (`dummy=1`) dan tombol dummy (KP D18) | - | - | - | - | - | - | T |

Penjelasan dan aturan sel:

1. **Fakta tanpa sumber DITOLAK untuk semua peran, termasuk SA**: `sumber_url`, `tanggal_periksa`, dan `tingkat_bukti` wajib (KP D5); `tingkat_bukti` memakai CHECK enum sesuai ALGORITMA.
2. **Orang dan kontak.** Lapis Publik menampilkan nama, jabatan publik, dan afiliasi saja (bawaan KP C-04, C-11). Kontak hanya di lapis pengurus; WL melihat kontak orang di provinsinya lewat rute berpenjaga yang menyaring `cakupan_prov` (potret statis tidak bisa disaring per provinsi, jadi WL tidak membaca potret pengurus). Orang tampil di lapis Publik hanya bila kolom `tampil` bernilai benar, yang diisi saat dasar pemrosesan tercatat (§3.2); nama kolom final ditetapkan di DT.
3. **Data terlarang** tidak punya kolom, tidak diterima rute mana pun, dan ditolak validasi skema untuk semua peran. Tabel baris ini ada agar uji menegaskannya.
4. **Potret R2** dibuat per lapis oleh pipeline (JM-D12), bukan disaring di klien. Berkas lapis lebih tinggi tidak pernah dirujuk dari halaman lapis lebih rendah. Tidak ada peran manusia yang menulis potret; hanya pipeline dengan token layanan.
5. **Akun.** Admin tidak bisa mengubah akun SA, tidak bisa menaikkan siapa pun (termasuk dirinya) menjadi `super`, dan tidak bisa mengubah perannya sendiri. SA terakhir tidak bisa dinonaktifkan atau diturunkan. Kolom `sandi`, `garam`, `aktivasi_hash` tidak pernah keluar dari Worker ke peran mana pun.
6. **Koreksi.** Antrean diproses KR, AD, SA. Permintaan hak akses, koreksi, dan hapus dari orang tanpa akun masuk lewat surel privasi di halaman Privasi dan dimasukkan ke antrean oleh KR atau AD (§3.3); formulir publik menunggu JM-G01 (F3).
7. **Riwayat dengan METI** sebelum F2 belum ada; baris matriks tetap berlaku sejak tabel dibuat. WL tidak melihat riwayat (bawaan KP C-17).
8. **Jejak.** Tidak ada peran yang menulis jejak lewat rute; hanya `hak.js` yang menulisnya otomatis pada tiap tulis D1 (JM-B07). Jejak tidak bisa diubah atau dihapus oleh siapa pun dari aplikasi.
9. **Daftar tolak** memuat nama sensitif (§3.5), jadi hanya SA yang bisa membaca; perubahan lewat unggah R2 oleh pemilik dan diuji pipeline.
10. **Dummy.** `hak.js` menambah `dummy=0` pada setiap baca kecuali peran SA. Baris dummy tidak pernah masuk potret dan tidak pernah tampil pada layar peran lain. Tombol dummy hanya mengisi klien dan tidak menulis ke server (pola asal).
11. **Peran tanpa akun terdaftar** (peran tak dikenal, akun nonaktif, sesi kedaluwarsa) diperlakukan sebagai PB.

**Tiap baris = satu uji "peran salah DITOLAK" di RU.** Uji dibangkitkan dari satu objek `MATRIKS` di `src/hak.js` yang sama dengan tabel ini: untuk tiap (jenis data, peran, aksi) yang bernilai `-` atau di luar kualifikasi, uji membuktikan ditolak (HTTP 401 untuk PB di rute terkunci, 403 untuk peran lain); untuk yang bernilai B atau T, uji membuktikan diizinkan dan, untuk WL, bahwa baris provinsi lain ditolak. Perubahan `MATRIKS` tanpa perubahan tabel ini membuat `tests/hak.test.mjs` merah (gerbang `gerbang-matriks-sinkron` membandingkan keduanya).

## 2. RLS tiruan di Worker

D1 (SQLite) tidak punya RLS bawaan, jadi hak ditegakkan di Worker lewat satu pintu (KP D7).

1. **Satu pintu.** Seluruh `env.DB.prepare(...)` hanya ada di `src/hak.js`. Modul lain (`sesi.js`, `sandi.js`, `direktori.js`, `admin.js`) memanggil fungsi `hak.js`; saat login (peran belum ada) mereka memakai pintu khusus `hak.sistem.*` berisi pernyataan tetap, bukan kueri rakitan.
2. **Antarmuka (JM-B04):** `boleh(peran, aksi, tabel, baris, akun)` mengembalikan benar atau salah dari `MATRIKS`; `baca(env, akun, tabel, kueri)` menambah klausa cakupan secara paksa (`dummy=0` kecuali SA; `cakupan_prov = akun.cakupan_prov` untuk WL; `pemilik = akun.id` untuk sel `T diri`); `tulis(env, akun, tabel, data)` menolak kolom di luar daftar putih per (tabel, peran) dan menulis jejak pada transaksi yang sama.
3. **Daftar putih, bukan daftar hitam.** Nama tabel dan kolom berasal dari objek tetap di `hak.js`, tidak pernah dari input klien. Nilai selalu lewat `.bind()`; tidak ada penyambungan string ke SQL (`security-reviewer` memeriksa).
4. **Gerbang.** `tests/gerbang-d1.test.mjs` memindai `src/**` dan menjadi merah bila `env.DB` atau `.prepare(` muncul di luar `hak.js`. `tests/hak.test.mjs` menjalankan tiap sel matriks terhadap D1 lokal (Miniflare atau `wrangler`, bukan mock; TEST.md).
5. **Rute.** Tiap rute `/api/*` menyatakan peran minimal di tabel rute (satu objek `"METODE /path/:id"`); rute tanpa pernyataan peran ditolak router saat start. Autentikasi diperiksa di SETIAP rute di server, bukan hanya disembunyikan di UI. `guard-api` memeriksa metode, peran, validasi input, dan batas laju per rute.
6. **Potret per lapis di R2.** Tiga prefiks `potret/publik/`, `potret/anggota/`, `potret/pengurus/`. Rute `GET /api/potret/:lapis/:nama` memeriksa peran terhadap lapis sebelum membaca R2; lapis publik boleh di-cache tepi, lapis lain `private, no-store`. Potret tidak memuat kolom di luar lapisnya: pipeline membangun tiap lapis dari daftar kolom per lapis (JM-D12) dan gerbang memindai potret publik dan anggota untuk pola surel, telepon, dan kolom terlarang.
7. **Cache tepi tidak boleh menyajikan respons berautentikasi.** `cacheTepi` hanya dipakai untuk respons lapis publik; kunci cache tidak memuat cookie; respons berautentikasi selalu `Cache-Control: private, no-store` dengan `Vary: Cookie`. Ada uji: respons peran AN tidak pernah keluar untuk permintaan PB.
8. **Kuota D1 Free (5 juta baca per hari) dijaga.** Layar membaca potret JSON dari R2; D1 hanya untuk sesi, akun, kurasi, koreksi, riwayat, jejak. Setiap kueri berindeks; tanpa `COUNT(*)` tak terbatas; agregat dari pipeline (pelajaran Asal, R1 §8 butir 11).
9. **Pipeline menulis D1** (impor kurasi) hanya lewat jalur yang menyatakan perannya sendiri `pipa`: hanya tabel `entitas`, `fakta`, `ikatan`, menolak baris tanpa sumber, bukan peran manusia, dan dicatat di jejak. Bentuk jalurnya (rute Worker bertoken layanan atau `wrangler d1 execute` dengan token CI) ditetapkan di DT; apa pun pilihannya, token layanan tidak masuk repo (§9) dan hanya bisa menulis tiga tabel itu.

## 3. Data pribadi (UU 27 Tahun 2022 tentang Pelindungan Data Pribadi)

Dokumen ini bukan nasihat hukum. Tinjauan penasihat hukum METI wajib sebelum rilis publik (R6 §5; terkait KP C-01).

### 3.1 Data yang diproses

| Kelompok | Isi | Lapis |
| --- | --- | --- |
| Data umum profesional | nama, jabatan, afiliasi, bidang keahlian, tautan sumber publik | Publik |
| Kontak | surel dan telepon kantor atau peran | Pengurus (WL per provinsi) |
| Data akun | surel akun, nama, peran, cakupan, status, hash sandi | Admin dan pemilik akun |
| Data operasional | hash IP, jejak, riwayat dengan METI | Admin, Pengurus |

Dilarang diproses sama sekali: agama, status perkawinan, tanggal lahir dan usia, alamat rumah, NIK, data biometrik (termasuk foto wajah sebagai biometrik), data kesehatan atau keuangan pribadi, data anak (UU 27/2022 Pasal 4 dan 27). Foto orang tidak disimpan (avatar inisial, bawaan); logo hanya milik entitas (KP C-15).

### 3.2 Dasar pemrosesan dan persetujuan tampil

| Jenis rekaman | Dasar | Aturan |
| --- | --- | --- |
| Pengurus METI (Dewan Penasihat, Pengawas, Pakar, Pengurus Harian dari SK) | Data sudah publik di metiires.or.id; bawaan KP C-11: nama dan jabatan saja | `tampil` benar; tautan sumber wajib; tombol "Ajukan koreksi" selalu terlihat |
| Pakar dan tokoh publik dari sumber resmi (OpenAlex, JDIH, situs lembaga) | Kepentingan sah dan informasi publik, TERBATAS pada nama, jabatan, afiliasi, publikasi | Tanpa kontak pribadi; sumber wajib; ditinjau penasihat hukum (risiko Pasal 20) |
| Anggota METI (impor Sekretariat, KP C-10) | Persetujuan eksplisit | Belum diimpor sampai ada formulir persetujuan dan jawaban C-10 |
| Pengguna akun (Anggota dan seterusnya) | Pelaksanaan keanggotaan atau tugas | Hanya data akun |

Aturan persetujuan (Pasal 21 dan 22): kotak tidak tercentang bawaan; memuat tujuan, jenis data, dan masa simpan; yang disimpan adalah versi teks, waktu, dan surel; persetujuan tidak disembunyikan sebagai syarat keanggotaan (Pasal 23); menarik persetujuan membuat profil privat atau dihapus (Pasal 9).

### 3.3 Hak subjek data

| Hak | Cara | Batas waktu (bawaan, dikonfirmasi penasihat hukum) |
| --- | --- | --- |
| Tahu pengendali, dasar, tujuan (Pasal 5) | Halaman Kebijakan Privasi, tautan di tiap formulir | sejak rilis |
| Akses dan salinan (Pasal 6, 7) | Surel privasi di halaman Privasi, atau tombol di profil (akun) | 14 hari kerja |
| Koreksi (Pasal 6) | Tombol "Ajukan koreksi" di tiap profil; antrean KR | 14 hari kerja |
| Hapus dan hentikan pemrosesan (Pasal 8, 43, 44) | Surel privasi atau tombol; verifikasi lewat surel yang tercantum | 14 hari kerja |
| Tarik persetujuan (Pasal 9) | sama; profil menjadi privat | seketika setelah verifikasi |
| Batasi pemrosesan (Pasal 11) | Opsi "sembunyikan dari publik" | 14 hari kerja |
| Portabilitas (Pasal 13) | Ekspor JSON data sendiri | F3 |

Penghapusan bersifat keras: baris D1, kolom turunan, berkas R2 (logo atau dokumen), indeks pencarian, potret yang dibangun ulang, dan cache tepi (purge). Satu-satunya yang disimpan: hash identitas dan tanggal penghapusan di daftar tolak, supaya impor berikutnya tidak menghidupkan lagi (R6 §5.2 butir 5).

### 3.4 Retensi (bawaan, perlu konfirmasi penasihat hukum)

| Data | Masa simpan |
| --- | --- |
| Profil anggota | selama keanggotaan, ditambah 2 tahun |
| Catatan persetujuan | selama diperlukan hukum |
| Sesi | 14 hari sejak dibuat; baris kedaluwarsa dibersihkan oleh satu cron (bukan jadwal baru; batas 5 jadwal akun Free) |
| Penghitung batas laju | jendela 15 menit, dibersihkan cron yang sama |
| Tautan aktivasi | 72 jam atau sekali pakai |
| Jejak admin | 2 tahun (bawaan), hash IP tidak lebih lama dari sesinya |
| Riwayat dengan METI | selama relasi, ditambah 2 tahun |

### 3.5 Daftar tolak (KP D14)

Satu berkas `data/daftar-tolak.json`, PRIVAT di R2 (bukan repo): orang atau lembaga terkait kasus hukum korupsi, orang yang sudah meninggal, dan nama yang diminta keluar. Uji pipeline (JM-D11): tidak ada id di daftar yang muncul di potret mana pun, dan impor menolak id itu. Nama yang sudah dikeluarkan tidak dipulihkan tanpa perintah pemilik. Daftar tidak di repo karena memuat nama sensitif.

### 3.6 Larangan lain

1. Tanpa scraping profil pribadi (LinkedIn, media sosial, PDDikti, situs yang meminta CAPTCHA); data orang hanya dari sumber resmi, pustaka publikasi terbuka (OpenAlex), atau diberikan sendiri (UU 27/2022 Pasal 65 sampai 67).
2. Tanpa data pribadi di repo publik, `public/`, potret publik, log, atau pesan galat. Data contoh memakai `example.org` dan akhiran "(contoh)", tanpa surel atau telepon nyata.
3. Tanpa kiriman otomatis ke luar (surel, WhatsApp, webhook) sebelum C-08 dijawab.
4. Tanpa analitik pihak ketiga atau piksel iklan; bila analitik dipasang, first-party dan dengan persetujuan.
5. Ringkasan mesin (Workers AI, KP C-18) hanya menerima teks abstrak publik, tidak pernah data pribadi atau kontak.

### 3.7 Insiden dan petugas

Kegagalan pelindungan data diberitahukan kepada subjek dan lembaga paling lambat 3 x 24 jam (Pasal 46). Prosedur tertulis: kontak insiden METI, langkah isolasi (nonaktifkan sesi massal, putar rahasia, bekukan potret), dan catatan. METI sebaiknya menunjuk petugas pelindungan data (Pasal 53; cek kewajiban, termasuk Putusan MK 151/PUU-XXII/2024). Pantau peraturan pelaksana UU PDP.

## 4. Autentikasi

Akun hanya dibuat Admin (tanpa daftar mandiri di F0 sampai F2; KP D8, C-09).

| Aspek | Aturan |
| --- | --- |
| Hash sandi | PBKDF2-SHA256 lewat WebCrypto, 210.000 iterasi, garam acak 16 byte per akun, perbandingan waktu tetap (JM-B02); bukan SHA-256 tunggal |
| Kebijakan sandi | minimal 12 karakter, maksimal 128, tampilkan sandi tersedia, tolak sandi sama dengan surel |
| Sesi | token acak 32 byte; D1 menyimpan hash SHA-256 token, bukan token; cookie `sesi` `HttpOnly; Secure; SameSite=Lax; Path=/`, 14 hari (JM-B03); keluar menghapus baris |
| CSRF | `SameSite=Lax` ditambah pemeriksaan `Origin` atau `Sec-Fetch-Site` pada setiap POST, PATCH, DELETE; hanya `application/json`; tanpa tulis lewat GET |
| Aktivasi | Admin membuat akun, sistem menghasilkan tautan sekali pakai berlaku 72 jam; D1 menyimpan hash tautan; tautan ditampilkan SEKALI kepada Admin untuk disalin (surel otomatis menunggu C-08); dipakai sekali lalu hangus |
| Reset sandi | tautan sekali pakai 72 jam yang dibuat Admin; ganti sandi mencabut semua sesi lain akun itu |
| Batas laju | 10 percobaan gagal per 15 menit per IP dan per surel (JM-B03); IP disimpan sebagai hash bergaram harian (`ipHash`), bukan mentah |
| Respons seragam | pesan gagal masuk sama untuk surel tak dikenal dan sandi salah; waktu respons disamakan dengan menghitung hash pada surel tak dikenal |
| Admin tidak naik ke super | Admin tidak bisa menetapkan peran `super`, tidak bisa mengubah akun `super`, tidak bisa mengubah perannya sendiri |
| Super terakhir dilindungi | akun `super` terakhir tidak bisa dinonaktifkan, diturunkan, atau dihapus (uji, JM-B05) |
| Nonaktifkan | mencabut semua sesi akun seketika |
| Cakupan WL | `cakupan_prov` hanya diubah Admin dan SA; WL tanpa cakupan tidak membaca apa pun di sel `prov` |
| TOTP opsional | F3, untuk Admin dan SA; kode pemulihan sekali pakai; bukan prasyarat F0 sampai F2 |
| Lupa kontrol | semua rute `/api/admin/*` dan halaman `/admin` memeriksa peran di server, tidak hanya di UI |

Rute dan halaman terkunci dialihkan ke `/masuk?ke=<jalur>`; parameter `ke` hanya diterima bila berupa jalur relatif di situs sendiri (tolak URL absolut dan `//`, pencegahan pengalihan terbuka).

## 5. Masukan dan berkas

1. **Validasi di server pada setiap input**: tipe, panjang, rentang, dan enum; kolom tak dikenal ditolak (daftar putih); badan permintaan maks 64 KB (JSON); galat ke klien memakai katalog kode galat, tanpa jejak tumpukan atau pesan internal.
2. **Sumber dan tautan**: `sumber_url` hanya skema `https:` atau `http:`; tolak `javascript:`, `data:`, `blob:`. Tautan luar dirender dengan `target="_blank" rel="noopener noreferrer"`.
3. **XSS**: semua teks dari data (nama, kalimat hubungan, catatan) melewati `esc()` sebelum masuk HTML; `innerHTML` hanya dengan hasil `esc()`; tanpa skrip dan gaya inline, jadi CSP menjadi lapis kedua (§8). Galat gambar lewat listener `capture`, bukan atribut `onerror`.
4. **Logo dan gambar** (KP C-15): hanya logo dari situs resmi entitas, diunduh Admin atau pipeline, disimpan di R2 dan disajikan lewat `/gambar/:id`, tidak hotlink. Tipe yang diterima PNG, JPEG, WebP (SVG ditolak karena bisa memuat skrip); cek magic bytes, maks 512 KB; nama berkas dibangkitkan server (hash), bukan dari klien; respons membawa `Content-Type` tetap dan `X-Content-Type-Options: nosniff`. Penghapusan atas permintaan entitas.
5. **Foto orang tidak disimpan** (bawaan; §3.1).
6. **Ekspor** (daftar pendek Excel, Word, PDF) dibuat di klien dari data yang sudah diizinkan untuk peran itu; kolom kontak ikut hanya untuk PG, AD, SA; tidak ada rute ekspor massal di server.
7. **Pencarian**: kueri dibatasi panjang (maks 100 karakter), dinormalkan, dibatasi laju; hasil hanya dari potret lapis peran.
8. **Koreksi dan teks bebas**: panjang dibatasi, tautan tidak diikuti otomatis, dirender sebagai teks.
9. **Unggahan impor** (CSV atau JSON kurasi) tervalidasi per baris; baris tanpa sumber ditolak dan dilaporkan jumlahnya (`jaga_unggah.mjs`, JM-D02).

## 6. Panen dan pihak ketiga

| Sumber | Aturan |
| --- | --- |
| Semua situs yang dipanen | Skrip `panen_*.py` membaca `robots.txt` per host (`urllib.robotparser`) sebelum meminta; host atau jalur yang melarang tidak dipanen (uji: host dengan `Disallow` ditolak). `User-Agent` jelas dengan kontak METI; jeda minimal 2 detik; tanpa melewati CAPTCHA, WAF, atau pembatas bot |
| 1001startup.id | TIDAK ada panen otomatis: robots.txt mereka memblokir crawler AI (ClaudeBot, `ai-train=no`) dan tidak ada lisensi data (KP D15). Pola penyajiannya ditiru, fakta diambil dari sumber primer yang mereka kutip. Atribusi "via 1001startup.id" dengan tanggal ambil, TANPA teks deskripsi, estimasi, atau logo mereka. Data langsung hanya dengan izin tertulis pengelolanya (KP C-13); tiket JM-D08 tertahan sampai itu |
| ESDM One Map, SINTA | Melarang robot; tidak dipanen tanpa izin (GD §9). Tautan saja |
| PDDikti dan situs ber-CAPTCHA | Tidak dipanen massal; gunakan ORCID atau surat resmi |
| OpenAlex | API resmi dengan kunci `OPENALEX_KEY` (secret), `mailto` surel resmi METI; hanya metadata publikasi publik |
| Sumber berlisensi | Hormati lisensi: GEM (CC BY-NC-SA) hanya tautan, bukan salinan; OpenCorporates (ODbL) berbagi-serupa; peringkas dan tautkan, bukan reproduksi (R6 §5.3) |
| Runtime peramban | Hanya `'self'`, MapLibre GL dari cdnjs (SRI), tile dan gaya `tiles.openfreemap.org`. Huruf dihosting sendiri (tanpa `fonts.googleapis.com`), jadi IP pengunjung tidak ke pihak lain. Tanpa analitik atau piksel iklan |
| Workers AI | Hanya teks abstrak publik (KP C-18); berlabel "Ringkasan mesin"; tanpa data pribadi |

Pengaturan `robots.txt` METI sendiri: `Disallow: /api/`, `/direktori`, `/admin`, `/masuk`, `/aktivasi`; halaman publik boleh diindeks.

## 7. Penyalahgunaan

| Ancaman | Penangkal |
| --- | --- |
| Tebak sandi, isi ulang kredensial | Batas laju 10 per 15 menit per IP dan per surel, respons seragam (§4) |
| Pemanenan kontak dan daftar anggota | Kontak tidak ada di lapis Publik; tanpa halaman daftar semua surel; tanpa ekspor massal sisi server; paginasi maks 50 baris per halaman; `robots.txt` dan `X-Robots-Tag: noindex` di rute terkunci |
| Pemanenan massal API publik | Batas laju per IP (hash) pada `/api/*`; potret publik di-cache tepi dan dilayani dari R2, bukan D1; aturan WAF laju Cloudflare bila tersedia |
| Penghabisan kuota D1 atau Worker | Layar membaca potret R2; kueri berindeks dan berbatas; batas laju; cron tunggal |
| Spam koreksi dan teks bebas | Batas laju per akun dan IP, panjang dibatasi, antrean ditinjau KR |
| Penyalahgunaan tautan aktivasi | Sekali pakai, 72 jam, hash di D1, tidak pernah dicatat di log |
| Kenaikan hak (eskalasi) | Admin tidak naik ke super; super terakhir dilindungi; uji peran salah DITOLAK (§1) |
| Penyalahgunaan orang dalam | Tiap tulis D1 menulis jejak (JM-B07); jejak tidak bisa diubah dari aplikasi; Admin tidak bisa membaca daftar tolak |
| Peniruan entitas (klaim profil palsu) | Klaim F3 hanya lewat surel domain entitas dan persetujuan kurator; sebelum itu tidak ada klaim |
| Pengalihan terbuka | Parameter `ke` hanya jalur relatif (§4) |
| Kebocoran lewat cache | Respons berautentikasi `private, no-store`, tidak masuk cache tepi (§2.7) |
| Enumerasi akun | Identitas akun memakai id acak; pesan masuk seragam |
| Bot di formulir publik | Turnstile di formulir publik F3 (daftar mandiri, klaim); tidak diperlukan sebelum itu |

## 8. Header dan CSP

`public/_headers` (JM-A05). CSP ditegakkan sejak hari pertama; menambah sumber luar berarti mengubah berkas ini dan gerbangnya.

```
/*
  Strict-Transport-Security: max-age=31536000; includeSubDomains
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()
  Cross-Origin-Opener-Policy: same-origin
  Content-Security-Policy: default-src 'self'; script-src 'self' https://cdnjs.cloudflare.com; style-src 'self' https://cdnjs.cloudflare.com; img-src 'self' data: blob: https://tiles.openfreemap.org; font-src 'self'; connect-src 'self' https://tiles.openfreemap.org; worker-src blob:; child-src blob:; frame-ancestors 'none'; base-uri 'none'; form-action 'self'; object-src 'none'; upgrade-insecure-requests

/direktori
  X-Robots-Tag: noindex, nofollow
  Referrer-Policy: no-referrer
  Cache-Control: private, no-store
/admin
  X-Robots-Tag: noindex, nofollow
  Referrer-Policy: no-referrer
  Cache-Control: private, no-store
/masuk
  X-Robots-Tag: noindex, nofollow
  Referrer-Policy: no-referrer
/aktivasi
  X-Robots-Tag: noindex, nofollow
  Referrer-Policy: no-referrer
/api/*
  Cache-Control: private, no-store
/fonts/*
  Cache-Control: public, max-age=31536000, immutable
```

Aturan:
1. Tanpa skrip inline dan tanpa atribut `style=`; posisi dinamis lewat atribut SVG atau CSSOM (`el.style.setProperty`). Bila MapLibre memerlukan `style-src-attr 'unsafe-inline'`, tambahkan hanya itu dan catat alasannya di sini; jangan melonggarkan `script-src`.
2. Pustaka CDN (MapLibre GL 4.7.1) memakai `integrity` sha384 dan `crossorigin="anonymous"`, dimuat dari satu domain terdaftar (cdnjs). Menambah CDN atau API baru mengubah `_headers` dan gerbangnya.
3. Halaman HTML `Cache-Control: no-cache`; aset statis memakai `?v=<hash>` dan `public, max-age=31536000, immutable`; potret publik `public, max-age=300` (boleh di-cache tepi); respons berautentikasi `private, no-store` dengan `Vary: Cookie`.
4. `noindex` juga di `<meta name="robots">` halaman terkunci; `<meta name="referrer" content="no-referrer">` di halaman terkunci.
5. Bila pemilik memilih Google Fonts alih-alih huruf hosting sendiri (DS §1), tambah `https://fonts.googleapis.com` ke `style-src` dan `https://fonts.gstatic.com` ke `font-src`, dan catat perubahan privasi di Kebijakan Privasi.
6. Domain publik belum diputuskan (KP C-02): bawaan `*.workers.dev`; HSTS dan CSP tidak bergantung pada nama host.
7. Gerbang `gerbang-headers.test.mjs` (port gerbang asal) membaca `_headers`, memastikan CSP tanpa `'unsafe-inline'` pada `script-src`, tanpa `*`, dan tiap sumber luar terdaftar; juga memindai HTML dan JS terhadap `style=`, `onclick=`, dan `<script>` tanpa `src`.

## 9. Rahasia

| Hal | Aturan |
| --- | --- |
| Repo publik | Tidak ada rahasia, data pribadi, daftar tolak, atau berkas data mentah di repo. `.gitignore` memuat `.dev.vars`, `.wrangler/`, `*.sqlite`, `data/pribadi/`, `daftar-tolak.json`, `*.env` |
| Id Cloudflare | `wrangler.jsonc` di repo berisi id kosong (JM-A02); id nyata D1, R2, dan Worker diisi pemilik di salinan lokal atau di secret CI (JM-A03); tidak pernah di-commit |
| Rahasia Worker | Diatur lewat `wrangler secret put`: `OPENALEX_KEY`, kunci penyedia surel bila C-08 dijawab, dan token layanan impor bila dipakai (§2.9). Tidak di frontend, tidak di git |
| Lokal | `.dev.vars` tidak dilacak git; `.dev.vars.example` hanya berisi nama kunci tanpa nilai |
| CI | Rahasia Actions: `CLOUDFLARE_API_TOKEN` (cakupan minimal: D1, R2, Workers di satu akun), `CLOUDFLARE_ACCOUNT_ID`, `OPENALEX_KEY`; tidak dicetak ke log |
| Kunci bocor | Kunci apa pun yang pernah ter-commit diputar ulang (bukan sekadar dihapus dari pohon) |
| Pemindaian | Gerbang sebelum commit memindai pola kunci (`-----BEGIN`, `Bearer `, token `sk-`, `AKIA`) dan berkas terlarang (`.dev.vars`, `daftar-tolak.json`, `*.sqlite`); `higiene-repo` memeriksa sebelum commit besar |
| Batas biaya | Batas pengeluaran (hard cap) di dasbor Cloudflare (Workers AI) dan penyedia berbayar mana pun |
| Cadangan | Ekspor D1 berkala ke R2 privat, dan UJI PEMULIHAN dijalankan sebelum pengguna pertama (WEBSITE.md) |
| Produksi | Migrasi D1 produksi dan unggahan R2 produksi dijalankan pemilik; subagent tidak deploy, tidak push, tidak commit |
| Data contoh | `example.org`, akhiran "(contoh)", tanpa surel atau telepon nyata; dummy dihitung konsisten |

## 10. Pengulas dan bukti

| Permukaan berubah | Pengulas wajib |
| --- | --- |
| `src/hak.js`, `src/sesi.js`, `src/sandi.js`, rute `/api/*` | `security-reviewer`, `guard-api` |
| `_headers`, CSP, penyisipan HTML dari data luar | `security-reviewer` |
| `migrations/**` (akun, sesi, entitas) | `migrasi-idempoten` |
| Potret per lapis, daftar tolak, kolom pribadi | `security-reviewer`, `validasi-model` untuk skor |
| Angka yang tampil | `selera-angka` |

| Bukti | Perintah (tiket) |
| --- | --- |
| Tiap sel matriks, izin dan DITOLAK | `node --test tests/hak.test.mjs` (JM-B04) |
| Tak ada akses D1 di luar `hak.js` | `node --test tests/gerbang-d1.test.mjs` (JM-B04) |
| Sandi PBKDF2 | `node --test tests/sandi.test.mjs` (JM-B02) |
| Sesi, batas laju, CSRF | `node --test tests/sesi.test.mjs` (JM-B03) |
| Admin tidak naik ke super, super terakhir dilindungi | `node --test tests/akun.test.mjs` (JM-B05) |
| Potret dan daftar tolak bersih | `node --test tests/potret.test.mjs tests/daftar-tolak.test.mjs` (JM-D11, JM-D12) |
| Header dan CSP | `node --test tests/gerbang-headers.test.mjs` (JM-A05) |
| Pemindai rahasia | gerbang sebelum commit (`higiene-repo`) |

Nama berkas uji di atas mengikuti TIKET; berkas yang belum ada dibuat lewat `penulis-gerbang` dan didaftarkan di `tests/cakupan.json` (aturan TIKET §1 butir 5).

## 11. Hal yang menunggu keputusan pemilik

Punya bawaan; kerja jalan memakai bawaan sampai dijawab.

| Kode | Pertanyaan | Bawaan | Dampak |
| --- | --- | --- | --- |
| KP-1 | Masa simpan profil anggota, jejak, dan batas 14 hari kerja hak subjek | Seperti §3.3 dan §3.4 | Jadwal retensi dan cron |
| KP-2 | Petugas pelindungan data dan kontak insiden METI | Belum ada; surel privasi dikelola Sekretariat | Halaman Privasi dan prosedur §3.7 |
| KP-3 | Bentuk jalur impor pipeline ke D1 (Worker bertoken layanan atau `wrangler` dengan token CI) | Dipilih di DT; peran `pipa` terbatas tiga tabel | §2.9 dan §9 |
| KP-4 | Google Fonts atau huruf hosting sendiri | Hosting sendiri | CSP §8 butir 5 |
| KP-5 | Foto orang di profil | Tidak disimpan | §3.1 dan §5 |
| KP-6 | Kontak orang untuk WL di provinsinya | Boleh baca per provinsi lewat rute berpenjaga | Baris matriks "Orang: kontak" |
