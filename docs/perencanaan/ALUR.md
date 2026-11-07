# ALUR: Platform Jaringan METI

Dokumen kelima dalam urutan otoritas (`KEPUTUSAN-METI` > `GRAND-DESIGN` > `RISET` > `PRD` > `ALUR` > `ALGORITMA` > `DESIGN-SYSTEM` > `DESAIN-TEKNIS` > `KEAMANAN-PRIVASI` > `RENCANA-UJI` > `TIKET`). Kalah dari `KEPUTUSAN-METI`, `GRAND-DESIGN`, dan `PRD`; menang atas dokumen di bawahnya. Versi 1, 7 Nov 2026.

**Notasi.** `[peran]` pelaku (kode hak PRD §2: PB, AN, PG, KR, WL, AD, SA; `[sistem]` untuk Worker; `[pipa]` untuk pipeline GitHub Actions). `→` langkah berikutnya atau hasil sistem. `⟂` titik tolak: kondisi gagal, lalu pesan baku dalam tanda kutip. `◆` jejak tercatat (satu baris `jejak(siapa, kapan, aksi, tabel, id, dari, ke)`). Status ditulis `monospace`. Fitur dirujuk `F-xx` (PRD), tiket `JM-xx` (TIKET).

**Aturan global.**

1. Tiap tulis D1 sekaligus menulis baris jejak dalam transaksi yang sama (`◆`), dan semua tulis D1 lewat `src/hak.js`; tidak ada jalur lain.
2. Setiap penolakan hak mengembalikan 403 dengan pesan baku "Kamu tidak punya hak untuk ini." (kunci i18n `galat.hak`); sesi kedaluwarsa mengembalikan 401 dan pengalihan ke `/masuk?ke=<alamat>`.
3. Semua kiriman ke luar adalah tombol yang ditekan manusia (salin tautan, salin surel, unduh ekspor). Tidak ada surel, WhatsApp, atau pesan otomatis (C-08 bawaan).
4. Pesan baku ditulis dengan sapaan "kamu", tersedia di `id.json` dan `en.json` (F-A2); alur ini menulis versi Indonesia.
5. Aksi di `/admin` dan kurasi tidak bisa dilakukan oleh peran yang salah walau alamat diketik langsung: `hak.js` menolak di sisi Worker, bukan hanya menyembunyikan tombol.
6. Data dummy (`dummy=1`) hanya dibuat dan dihapus SA lewat tombol dummy; tidak pernah masuk potret publik.

Status yang dipakai:

| Objek | Status |
| --- | --- |
| Akun | `menunggu` (dibuat, belum diaktifkan), `aktif`, `nonaktif` |
| Tautan aktivasi atau reset | `berlaku`, `terpakai`, `kedaluwarsa` (72 jam) |
| Entitas | `draf`, `terbit`, `di-luar-sensus`, `ditarik` |
| Koreksi | `baru`, `diproses`, `diterima`, `ditolak` |
| Potret | `dibangun`, `lolos-jaga`, `ditolak-jaga`, `tayang` |

## 1. Fondasi

### 1.1 Admin membuat akun dan aktivasi (F-M2, JM-B05)

1. `[AD]` buka `/admin` tab Akun → tabel akun, tombol "Buat akun". ⟂ peran bukan AD atau SA → 403 "Kamu tidak punya hak untuk ini."
2. `[AD]` isi nama, surel, peran (`anggota`, `pengurus`, `kurator`, `wilayah`, `admin`; `super` hanya bila `[SA]`), cakupan provinsi (wajib untuk `wilayah`) → kirim. ⟂ surel tidak berbentuk surel → "Surel tidak valid." ⟂ surel sudah dipakai akun lain → "Surel ini sudah punya akun." ⟂ peran `wilayah` tanpa provinsi → "Pilih provinsi untuk ketua METI Wilayah." ⟂ `[AD]` memilih peran `super` → "Hanya Super Admin yang bisa membuat Super Admin."
3. `[sistem]` simpan akun berstatus `menunggu`, tanpa sandi → buat token acak, simpan hanya hash dan masa berlaku 72 jam → tampilkan tautan aktivasi sekali di layar. ◆
4. `[AD]` tekan "Salin tautan" → tautan di papan klip; Admin menyampaikannya sendiri lewat saluran pilihan (WhatsApp pribadi, surel pribadi, tatap muka). ⟂ halaman ditutup sebelum menyalin → tautan tidak bisa ditampilkan lagi; `[AD]` tekan "Buat tautan baru" (token lama `kedaluwarsa`). ◆
5. `[AN/PG/KR/WL/AD]` buka tautan `/aktivasi?t=<token>` → formulir sandi baru dua kolom. ⟂ token tidak ditemukan, `terpakai`, atau lewat 72 jam → "Tautan ini sudah tidak berlaku. Minta tautan baru ke Admin." ⟂ sandi kurang dari 12 karakter → "Sandi minimal 12 karakter." ⟂ dua kolom tidak sama → "Kedua sandi harus sama."
6. `[sistem]` hash sandi (PBKDF2-SHA256, 210.000 iterasi, garam acak) → akun `aktif`, token `terpakai` → buat sesi dan alihkan ke halaman awal peran (`/direktori` untuk AN ke atas, `/admin` untuk AD). ◆
7. `[AD]` ubah peran atau cakupan akun lain → daftar menunjukkan peran baru. ⟂ mengubah peran diri sendiri menjadi `super` → "Kamu tidak bisa menaikkan perananmu sendiri." ⟂ mengubah peran `super` terakhir menjadi peran lain → "Harus tersisa satu Super Admin." ◆
8. `[AD]` nonaktifkan akun → status `nonaktif`, semua sesi akun itu dihapus saat itu juga. ⟂ akun adalah `super` terakhir → "Harus tersisa satu Super Admin." ⟂ akun adalah diri sendiri → "Kamu tidak bisa menonaktifkan akunmu sendiri." ◆
9. `[AD]` aktifkan kembali akun `nonaktif` → status `aktif`; sandi lama tetap berlaku (bukan reset). ◆

### 1.2 Masuk, keluar, dan lupa sandi (F-M1, JM-B03, JM-B06)

**Masuk**

1. `[PB]` buka halaman yang butuh login (`/direktori`, `/admin`) → `[sistem]` alihkan ke `/masuk?ke=<alamat>`. Atau `[PB]` tekan "Masuk" di kepala situs.
2. `[PB]` isi surel dan sandi → kirim `POST /api/masuk`. ⟂ batas 10 gagal per 15 menit per IP atau per surel terlampaui → 429 "Terlalu banyak percobaan. Coba lagi 15 menit lagi." ⟂ surel tidak ada, sandi salah, status `menunggu`, atau `nonaktif` → pesan sama untuk semuanya: "Surel atau sandi salah." (tidak membedakan; percobaan gagal dihitung ke batas laju).
3. `[sistem]` cocokkan sandi dengan perbandingan waktu tetap → buat sesi: token acak ke cookie `sesi` (`HttpOnly; Secure; SameSite=Lax`, 14 hari), hanya hash token dan `ip_hash` disimpan di tabel `sesi` → alihkan ke `ke` bila alamatnya milik situs ini, jika tidak ke halaman awal peran. ⟂ `ke` mengarah ke luar situs → diabaikan. ◆ (waktu masuk)
4. `[AN..SA]` kepala situs menampilkan nama dan tombol "Keluar"; tab dan menu yang tak berhak disembunyikan, dan tetap ditolak di Worker (aturan global 5).

**Keluar**

5. `[AN..SA]` tekan "Keluar" → `POST /api/keluar` → hapus baris `sesi`, kosongkan cookie → `/` dengan pesan "Kamu sudah keluar." ◆

**Sesi berakhir**

6. `[AN..SA]` mengirim permintaan dengan sesi kedaluwarsa atau dihapus → 401 → alihkan ke `/masuk?ke=<alamat>` dengan pesan "Sesimu sudah berakhir. Masuk lagi." Isi daftar pendek di peramban tidak hilang (tersimpan di `localStorage`).

**Lupa sandi (tanpa surel otomatis)**

7. `[PB/AN]` di `/masuk` tekan "Lupa sandi?" → halaman petunjuk: "Minta Admin METI membuat tautan reset untukmu. Sebut surel akunmu." Tidak ada formulir yang mengirim apa pun ke luar.
8. `[AD]` terima permintaan lewat saluran di luar platform → di `/admin` tab Akun, baris akun → "Buat tautan reset" → `[sistem]` token baru 72 jam sekali pakai, token aktivasi atau reset sebelumnya `kedaluwarsa`, semua sesi akun itu dihapus → Admin menyalin tautan (langkah 1.1.4). ◆
9. `[pengguna]` buka tautan → formulir sandi baru (langkah 1.1.5 dan 1.1.6); akun tetap `aktif`. ⟂ akun `nonaktif` → "Akun ini dinonaktifkan. Hubungi Admin."

**Ganti sandi**

10. `[AN..SA]` buka `/ganti-sandi` → isi sandi lama, sandi baru dua kali. ⟂ sandi lama salah → "Sandi lama tidak cocok." ⟂ sandi baru kurang dari 12 karakter → "Sandi minimal 12 karakter." → simpan hash baru, hapus semua sesi lain akun itu, pertahankan sesi ini. ◆

Bila penyedia surel dipilih (C-08, JM-B05 lanjutan), langkah 1.1.4 dan 1.2.8 menambah tombol "Kirim lewat surel" yang ditekan Admin; alur selebihnya tidak berubah.

### 1.3 Ganti bahasa (F-A2, JM-C06)

1. `[PB..SA]` di kepala situs tekan tombol ID/EN → `[sistem]` (klien) muat kamus bahasa yang dipilih → semua teks antarmuka dan format angka serta tanggal berganti tanpa memuat ulang halaman.
2. `[klien]` simpan pilihan di `localStorage` (try/catch) dan tulis `?lang=en|id` di URL → membuka tautan dengan `?lang=` memakai bahasa itu lebih dulu dari penyimpanan. ⟂ `localStorage` tidak bisa dipakai → pilihan hanya berlaku untuk halaman ini dan URL; tidak ada galat.
3. `[klien]` untuk isi data: pakai kolom `_en` bila terisi → ⟂ `_en` kosong → tampil teks Indonesia dengan pil "ID" di sampingnya (bukan terjemahan mesin diam-diam).
4. `[PB]` buka halaman pertama kali tanpa pilihan tersimpan dan tanpa `?lang=` → Indonesia (bawaan).
5. `[klien]` kunci teks hilang di EN → tampil teks Indonesia kuncinya dan gerbang i18n merah di CI (U6), bukan layar kosong.

## 2. Data

### 2.1 Kurator menambah entitas, fakta, dan sumber (F-M4, JM-D01, JM-E06)

1. `[KR]` buka `/admin` tab Kurasi → daftar entitas dengan cari, saringan jenis, sektor, provinsi, status; tombol "Entitas baru". ⟂ peran bukan KR, AD, atau SA (atau WL untuk provinsinya) → 403.
2. `[KR]` isi entitas: jenis (`perusahaan`, `lembaga`, `kampus`, `orang`, `proyek`, `wilayah`, `regulasi`, dan seterusnya sesuai DT), nama, nama EN (opsional), ringkas, sektor, provinsi, koordinat, situs, lapis awal → simpan sebagai `draf`. ⟂ nama sama dengan entitas lain setelah normalisasi → "Entitas ini mungkin sudah ada: <nama>. Buka yang ada atau tandai sebagai berbeda." ⟂ nama atau id ada di `daftar-tolak.json` → "Nama ini ada di daftar tolak dan tidak bisa dimasukkan." ⟂ `[WL]` memilih provinsi bukan cakupannya → "Provinsi di luar cakupanmu." ◆
3. `[KR]` pada entitas, tekan "Tambah sumber" → isi URL, jenis (`dokumen-resmi`, `filing`, `situs-sendiri`, `media`, `data-terbuka`, `via-pihak-ketiga`), tanggal periksa → simpan. ⟂ URL tidak berskema http atau https → "URL sumber tidak valid." ⟂ jenis di luar enam pilihan → ditolak CHECK, "Pilih jenis sumber yang tersedia." ◆
4. `[KR]` tekan "Tambah fakta" → pilih kunci (Pendiri, Berdiri, Kapasitas, Pendanaan, Lokasi, dan lainnya), nilai, satuan, per tanggal, tandai `EST` bila turunan, pilih sumber → simpan. ⟂ sumber kosong → "Setiap fakta harus punya sumber." ⟂ nilai turunan tanpa tanda `EST` yang kuncinya terdaftar turunan → "Angka turunan harus berlabel EST dan menyebut rumusnya." ⟂ pola surel atau telepon pribadi di nilai pada lapis Publik → "Data pribadi tidak boleh di lapis Publik." ◆
5. `[KR]` tekan "Tambah ikatan" → pilih entitas asal, jenis ikatan (ALG §3), entitas tujuan, per tanggal, sumber → simpan. ⟂ sumber kosong → "Setiap ikatan harus punya sumber." ⟂ asal sama dengan tujuan → "Entitas tidak bisa terhubung ke dirinya sendiri." ⟂ tujuan belum ada → "Buat entitas tujuan dulu, atau tandai sebagai di luar sensus." ◆
6. `[KR]` tandai entitas "di luar sensus" bila hanya punya ikatan bersumber tanpa profil lengkap → status `di-luar-sensus`. ◆
7. `[KR]` tekan "Terbitkan" → `[sistem]` periksa: minimal satu fakta bersumber → status `terbit`. ⟂ tanpa fakta bersumber → "Belum ada fakta bersumber. Tambah satu, atau tandai di luar sensus." ◆
8. `[sistem]` entitas `terbit` masuk potret pada panen berikutnya (alur 2.2). Perubahan tidak terlihat publik sampai potret `tayang`.
9. `[KR]` tarik entitas → status `ditarik`, hilang dari potret berikutnya, baris tetap di D1 untuk jejak. ◆
10. `[manusia]` seed awal METI (12 anggota, 12 mitra, pengurus SK 0008, METI Wilayah, agenda) dimasukkan kurator lewat jalur di atas (JM-D07, menunggu C-10 dan C-11).

### 2.2 Panen sampai potret R2 (F-A4, F-A5, F-A6, F-S4)

Pelaku `[pipa]` jalan di GitHub Actions menurut jadwal yang masuk batas 5 cron; potret tidak dikomit ke repo, ditulis ke R2.

1. `[pipa]` tiap sumber panen berjalan dalam langkah sendiri: OpenAlex (pakar, karya), OSM Overpass (pembangkit per provinsi), Ember/OWID/IRENASTAT/World Bank (statistik), BPK dan JDIH ESDM (regulasi), AESI, GEM, WRI, berita metiires.or.id. ⟂ sumber membalas 403/429 atau HTML kosong → langkah itu ditandai gagal, data lama dipakai, alasan dicatat di status; sumber yang melarang robot tidak dipanen. ⟂ `OPENALEX_KEY` tidak ada → langkah OpenAlex berhenti dengan pesan "OPENALEX_KEY belum diisi."
2. `[pipa]` setiap keluaran panen dinormalkan menjadi baris `fakta` atau `ikatan` dengan `sumber_url`, `tanggal_periksa`, tingkat bukti. ⟂ baris tanpa sumber → dibuang dan dihitung ke laporan "ditolak tanpa sumber" (U2 harus nol di potret).
3. `[pipa]` gabungkan dengan kurasi D1 (entitas `terbit`) → `hubung.mjs`: indeks nama, dedup kunci kuat dulu (NPWP, NIB, ORCID, DOI, ROR bila ada) lalu skor lunak, kunci ambigu tidak ditautkan, `ALIAS` energi (PLN, ESDM, EBTKE, DEN, PGE, Pertamina NRE, IESR, dan lainnya), `DIRI` = METI tidak diberi bintang → `graf.json` (`simpul`, `sisi`).
4. `[pipa]` saring daftar tolak: id apa pun di `daftar-tolak.json` (diunduh dari R2 privat) dibuang dari entitas, ikatan, dan graf. ⟂ id di daftar masih ada di keluaran setelah penyaringan → langkah gagal merah (U7).
5. `[pipa]` hitung skor keyakinan 0 sampai 1 per profil (ALG §4) → label Tinggi, Sedang, atau Rendah dan kalimat alasan.
6. `[pipa]` bangun potret per lapis: `potret/publik/*.json`, `potret/anggota/*.json`, `potret/pengurus/*.json`; kolom pribadi hanya di lapis pengurus; entitas `di-luar-sensus` masuk dengan penanda tetapi tidak dihitung di total sensus; angka cerita data dibekukan pada tanggal terbit.
7. `[pipa]` `jaga_unggah`: tolak bila berkas susut lebih dari 20% dari potret `tayang` sebelumnya, JSON rusak, ada baris tanpa sumber, atau ada pola surel atau telepon di potret publik atau anggota. ⟂ salah satunya → status `ditolak-jaga`, potret lama tetap `tayang`, alasan di status; tidak ada unggahan sebagian.
8. `[pipa]` lolos jaga → unggah ke R2 dengan kunci bertanggal dan penunjuk "terbaru" → status `tayang`, stempel tanggal pembaruan per dataset.
9. `[sistem]` Worker melayani potret sesuai peran (PB hanya `publik`, AN `publik` dan `anggota`, PG ke atas termasuk `pengurus`); cache tepi dipakai agar D1 tidak dibaca per kunjungan (kuota baca D1 Free). ⟂ potret yang diminta di atas hak peran → 403. ◆ (bukan per baca; hanya tulis dan penolakan tercatat di jejak keamanan)
10. `[manusia]` pemilik atau Admin melihat status panen terakhir di `/admin` (tab Jejak) dan di `/api/status`.

## 3. Publik dan anggota

### 3.1 Publik menjelajah sensus dan profil (F-S1 sampai F-S7, F-J1, F-J4, F-J5)

1. `[PB]` buka `/` → Jawaban singkat bertanggal, kartu angka, cuplikan dataset, cerita terbaru, pita "Draf kerja, sumber publik saja, angka turunan berlabel estimasi". ⟂ potret publik belum ada (belum pernah panen) → "Data belum tersedia. Coba lagi nanti." plus tautan `/metode`.
2. `[PB]` tekan `/` di papan ketik atau klik kotak cari → ketik nama → panel hasil berkelompok per jenis (hanya entitas lapis Publik). ⟂ hasil kosong → "Tidak ada hasil untuk <kata>. Coba nama lain atau lihat sensus lengkap." Klik hasil → `/p/<slug>`.
3. `[PB]` buka `/perusahaan` → pilih chip sektor (satu aktif), chip penyaring boolean (dengan pendanaan terungkap saja, dan seterusnya), provinsi, urut kolom, halaman → tabel berubah. Chip, urut, dan paginasi tidak membekukan layar (kontrol berchrome urgent, isi tabel ditunda). ⟂ kombinasi saringan tanpa baris → "Tidak ada entitas yang cocok. Hapus saringan." dengan tombol "Hapus semua saringan".
4. `[PB]` klik baris → `/p/<slug>`: kepala, ringkas bertanggal, baris fakta bersumber, pemasok dan pelanggan, proyek, Terhubung, Keyakinan, Sumber, Sejenis. ⟂ slug tidak ada atau entitas `ditarik` → 404 "Halaman ini tidak ada. Cari di sensus." ⟂ entitas di `daftar-tolak` → 404 yang sama (tidak ada petunjuk bahwa ada).
5. `[PB]` klik tombol sumber pada satu fakta → tooltip kutipan beku dan tautan ke dokumen sumber (`rel="noopener"`, buka tab baru).
6. `[PB]` klik "Cara mengutip" → baris sitasi dengan tanggal beku dan URL halaman; tombol salin menyalin ke papan klip. ⟂ papan klip ditolak peramban → teks terpilih otomatis agar bisa disalin manual.
7. `[PB]` buka profil entitas "di luar sensus" → kalimat pembuka "Bukan perusahaan sensus. Halaman ini ada karena rantai perusahaan sensus melewatinya" dan satu kalimat peran bersumber.
8. `[PB]` buka `/peta` → peta MapLibre dengan panel tarik, lapisan, legenda, "Terbang ke" provinsi; klik logo bundar → kartu ringkas dan tautan ke profil. ⟂ WebGL tidak tersedia → tabel yang sama ditampilkan dan kalimat "Peta tidak bisa dimuat di peramban ini; entitas yang sama ada di tabel."
9. `[PB]` buka `/rantai`, `/pembiaya`, `/bumn`, `/data-center`, `/desa`, `/wilayah/<prov>`, `/kebijakan`, `/cerita`, `/metode` → tiap halaman membuka dengan Jawaban singkat bertanggal, lalu isi, "Cara menghitung", "Cara mengutip". ⟂ `/wilayah/<prov>` dengan kode tak dikenal → 404 "Provinsi tidak dikenal. Pilih dari daftar." ⟂ bagian tanpa data → alasan tertulis ("Belum ada sumber publik yang menyebut peran di sini"), bukan kolom kosong.
10. `[PB]` pada kuadran `/bumn` pilih sumbu X dan Y → titik berpindah dan garis silang tetap di median; klik titik → kartu skor, angka, dan sumber; pil "Hipotesis" tampil selama C-16 belum dijawab.
11. `[PB]` coba membuka `/direktori` atau `/admin` → alihkan ke `/masuk?ke=...` (3.2 langkah 1). Coba `GET` potret `anggota` atau `pengurus` langsung → 401 atau 403 sesuai sesi.

### 3.2 Anggota menyusun daftar pendek dan mengekspor (F-J9, JM-C02)

1. `[AN]` tanpa sesi membuka `/direktori` → `[sistem]` alihkan ke `/masuk?ke=/direktori`. Setelah masuk (alur 1.2) kembali ke `/direktori`.
2. `[AN]` pilih tab (Pakar, Lembaga, Wilayah, Inovasi, Riset, Sistem data, Pendanaan, Pustaka) → isi tab dimuat lambat dari potret; alamat berubah menjadi `?tampil=<tab>&sub=<sub>` sehingga tautan bisa dibagikan. ⟂ potret tab gagal dimuat → kartu "Tab ini belum bisa dimuat. Coba lagi." dengan tombol "Muat ulang" (tab lain tetap jalan).
3. `[AN]` di tab Pakar atau Lembaga pilih saringan (provinsi multi, kampus, sektor lewat panel chip, urut) → daftar berubah. ⟂ tidak ada hasil → "Tidak ada yang cocok." dan tombol "Hapus semua saringan".
4. `[AN]` tekan ikon "Tambah ke daftar pendek" di kartu → bilah bawah menampilkan jumlah; disimpan di `localStorage` (`ak-dp`). ⟂ `localStorage` tidak tersedia → daftar bertahan selama halaman terbuka dan pesan "Daftar tidak bisa disimpan di peramban ini."
5. `[AN]` tekan "Lihat" pada bilah → daftar pendek terbuka; "Kosongkan" mengosongkan setelah konfirmasi "Kosongkan daftar pendek?".
6. `[AN]` tekan "Unduh" → menu Excel, Word, PDF, input "Keperluan (opsional)" maksimal 120 karakter → klik format → pustaka ekspor dimuat dari CDN ber-SRI → berkas terunduh dengan band navy bergaya METI dan kepala kolom rata tengah. ⟂ pustaka gagal dimuat (jaringan atau SRI tidak cocok) → "Ekspor tidak bisa dimuat. Coba lagi." dan tidak ada berkas rusak. ⟂ daftar kosong → tombol Unduh nonaktif.
7. `[AN]` tekan "Salin surel" → hanya surel yang lapis perannya boleh melihat (AN: yang disetujui tampil untuk anggota; PG ke atas: lapis Pengurus) → papan klip berisi daftar dipisah titik koma. ⟂ tidak ada surel yang boleh dilihat → "Tidak ada surel yang bisa kamu lihat untuk daftar ini." ⟂ papan klip ditolak → teks terpilih untuk disalin manual. Tidak ada surel dikirim dari platform.
8. `[AN]` buka profil dari daftar → lembar profil dengan bagian-bagian berkartu; Esc menutup; tombol "Koreksi" membuka alur 3.3.

### 3.3 Koreksi dari pengguna ke antrean kurator (F-M5, JM-E06)

1. `[PB/AN]` di profil, cerita, atau baris data tekan "Koreksi halaman ini" → formulir: bagian yang salah (pilihan dari bagian halaman), isi yang benar, tautan sumber, kontak balasan (opsional), kotak setuju "Aku mengerti koreksi ini ditinjau kurator dan belum mengubah halaman." ⟂ isi kosong → "Tulis apa yang perlu diperbaiki." ⟂ tautan sumber bukan http atau https → "Tautan sumber tidak valid." ⟂ pengiriman lebih dari batas laju per IP (tanpa akun) → 429 "Terlalu banyak kiriman. Coba lagi nanti." ⟂ isi mengandung pola surel atau telepon pribadi orang lain → "Jangan menaruh data pribadi orang lain di sini."
2. `[sistem]` simpan koreksi berstatus `baru` dengan halaman, bagian, isi, sumber, kontak balasan (lapis Pengurus), asal (PB atau akun) → tampilkan "Terima kasih. Koreksimu masuk antrean kurator." Tidak ada surel atau balasan otomatis. ◆
3. `[KR]` buka `/admin` tab Koreksi → antrean urut tanggal dengan saringan status dan halaman → pilih satu → status `diproses`. ◆ ⟂ peran bukan KR, AD, atau SA → 403.
4. `[KR]` periksa sumber → pilih "Terima" (membuka alur 2.1 langkah 3 sampai 5 untuk menambah atau mengubah fakta bersumber) atau "Tolak" (wajib catatan alasan). ⟂ "Tolak" tanpa catatan → "Tulis alasan penolakan." ⟂ "Terima" tanpa fakta atau sumber baru yang disimpan → "Koreksi diterima hanya bila fakta atau sumbernya sudah diperbarui." ◆
5. `[KR]` untuk permintaan hapus data pribadi: tandai prioritas → tindak dalam batas waktu yang ditetapkan KPV; entitas orang dapat `ditarik` dan nama masuk `daftar-tolak.json` bila pemintanya subjek data. ◆
6. `[sistem]` perubahan baru tampil publik pada potret berikutnya (alur 2.2). Pengirim yang memberi kontak balasan diberi tahu oleh `[KR]` lewat saluran di luar platform; platform tidak mengirim apa pun.

## 4. Rumah METI

### 4.1 Riwayat dengan METI (F-M6, JM-F09)

1. `[PG]` buka profil entitas atau tokoh → bagian "Riwayat dengan METI" tampil (hanya PG, AD, SA; AN dan PB tidak melihat bagian ini, C-17). ⟂ `[AN]` memanggil rute riwayat langsung → 403.
2. `[PG]` tekan "Tambah riwayat" → isi jenis (`narasumber`, `audiensi`, `mou`, `sponsor`, `anggota`, `lainnya`), tanggal, uraian, pihak METI yang terlibat, tautan dokumen atau sumber (opsional) → simpan. ⟂ tanggal di masa depan untuk jenis selain `audiensi` yang dijadwalkan → "Tanggal belum terjadi; pilih jenis Audiensi (dijadwalkan)." ⟂ uraian kosong → "Tulis uraian singkat." ⟂ jenis `mou` tanpa dokumen → peringatan "MoU sebaiknya punya tautan dokumen" (boleh lanjut). ◆
3. `[PG]` ubah atau hapus baris riwayat milik sendiri → perubahan tersimpan; penghapusan lunak. ⟂ mengubah baris orang lain bila bukan AD → "Hanya penulis atau Admin yang bisa mengubah baris ini." ◆
4. `[PG]` riwayat berjenis `anggota` yang dikonfirmasi Sekretariat → profil menampilkan lencana "Anggota METI" bagi semua lapis (lencana bukan riwayat; hanya statusnya yang publik). ◆
5. `[sistem]` riwayat tidak pernah masuk potret `publik` atau `anggota`; hanya potret `pengurus`.

### 4.2 Ketua METI Wilayah mengurus provinsinya (F-M7, F-W1, JM-F09, JM-B04)

1. `[AD]` buat akun peran `wilayah` dengan cakupan provinsi (alur 1.1) → `[WL]` aktivasi dan masuk.
2. `[WL]` buka `/admin` (menu Wilayah) → hanya melihat dan menulis baris yang `cakupan_prov` sama dengan provinsinya: profil METI Wilayah, agenda, kegiatan, entitas lokal. ⟂ mencoba membuka atau menulis baris provinsi lain → 403 "Provinsi di luar cakupanmu."
3. `[WL]` tekan "Agenda baru" → isi judul, jenis (`pelantikan`, `forum`, `audiensi`, `rapat`, `lainnya`), tanggal, tempat, narasumber, tautan dokumen (SK, undangan) → simpan sebagai `draf`. ⟂ tanggal kosong → "Isi tanggal." ⟂ jenis `pelantikan` tanpa tautan SK atau undangan → "Pelantikan harus punya tautan SK atau undangan." ◆
4. `[PG]` atau `[KR]` tinjau agenda `draf` → "Terbitkan" → status `terbit`, tampil di rapor provinsi (F-W1) dan beranda. ⟂ `[WL]` mencoba menerbitkan sendiri → 403 (penerbitan di tangan PG atau KR agar status tidak sepihak).
5. `[WL]` perbarui status METI Wilayah (Established, Coming soon, Planned) dan ketua → perubahan masuk antrean tinjau PG; tidak langsung publik. ⟂ status tidak punya dokumen pendukung → "Lampirkan tautan SK atau undangan." ◆
6. `[WL]` tambah entitas atau fakta di provinsinya lewat alur 2.1 dengan cakupan provinsi otomatis; entitas di luar provinsinya tidak bisa dipilih.
7. `[PB]` buka `/wilayah/<prov>` → melihat METI Wilayah dengan status dan agenda terakhir yang `terbit`. Ketidakcocokan antar dokumen ditulis apa adanya (misalnya "diresmikan" menurut deck, "rencana" menurut surat), bukan dilicinkan.

## 5. Lintas

### 5.1 Tombol isi data dummy (F-A3, JM-C05)

1. `[SA]` buka halaman mana pun yang punya `#dummy` → dua ikon (isi, hapus) dan baris status; akun selain SA tidak menerima tombolnya (dicek lewat `GET /api/saya`, diulang di Worker). ⟂ peran bukan SA memanggil `POST /api/dummy` → 403.
2. `[SA]` tekan "isi" → `[sistem]` jalankan `dataContoh()` untuk halaman itu: entitas energi fiktif berakhiran "(contoh)", domain `example.org`, `dummy=1`, lengkap dengan fakta, ikatan, dan sumber `example.org` → halaman memuat ulang datanya dan menampilkan "Data contoh terisi: N baris." ⟂ halaman tidak punya isi dummy → "Halaman ini belum punya data contoh." (gerbang dummy menandainya merah di CI). ◆
3. `[SA]` tekan "hapus" → hanya baris `dummy=1` dihapus → "Data contoh dihapus: N baris." Data asli tidak tersentuh. ◆
4. `[pipa]` data `dummy=1` tidak pernah dimasukkan ke potret `publik`; ia hanya terlihat oleh SA di lingkungan uji. ⟂ baris `dummy=1` ditemukan di potret publik → langkah jaga gagal merah.

### 5.2 Gerbang uji ujung ke ujung (JM-H01)

Satu skenario harus hijau di CI dan di setiap rilis: `[AD]` buat akun (1.1) → `[AN]` aktivasi dan masuk (1.2) → `[KR]` tambah entitas, sumber, dan fakta (2.1) → `[pipa]` bangun potret (2.2) → `[PB]` melihat profil tanpa kontak (3.1) → `[AN]` melihat lebih banyak dan mengekspor (3.2) → `[PB]` mengirim koreksi dan `[KR]` memutusnya (3.3) → peran yang salah DITOLAK di tiap langkah tulis.

## 6. Ringkasan pesan baku (untuk kunci i18n)

| Kunci | Pesan Indonesia |
| --- | --- |
| `galat.hak` | Kamu tidak punya hak untuk ini. |
| `masuk.salah` | Surel atau sandi salah. |
| `masuk.laju` | Terlalu banyak percobaan. Coba lagi 15 menit lagi. |
| `masuk.sesi_habis` | Sesimu sudah berakhir. Masuk lagi. |
| `aktivasi.tautan_mati` | Tautan ini sudah tidak berlaku. Minta tautan baru ke Admin. |
| `akun.super_terakhir` | Harus tersisa satu Super Admin. |
| `akun.naik_sendiri` | Kamu tidak bisa menaikkan perananmu sendiri. |
| `kurasi.tanpa_sumber` | Setiap fakta harus punya sumber. |
| `kurasi.daftar_tolak` | Nama ini ada di daftar tolak dan tidak bisa dimasukkan. |
| `koreksi.diterima` | Terima kasih. Koreksimu masuk antrean kurator. |
| `koreksi.tolak_tanpa_alasan` | Tulis alasan penolakan. |
| `dummy.terisi` | Data contoh terisi: N baris. |
| `wilayah.luar_cakupan` | Provinsi di luar cakupanmu. |
| `peta.tanpa_webgl` | Peta tidak bisa dimuat di peramban ini; entitas yang sama ada di tabel. |
