# ALUR: penyempurnaan November 2026

Dokumen keempat dalam urutan otoritas paket ini (`KEPUTUSAN-METI` > `GRAND-DESIGN` > `RISET` > `PRD` > `ALUR` > `ALGORITMA` > `DESIGN-SYSTEM` > `DESAIN-TEKNIS` > `KEAMANAN-PRIVASI` > `RENCANA-UJI` > `TIKET`). Kalah dari `KEPUTUSAN-METI`, `RISET`, `PRD`; menang atas dokumen di bawahnya. Melengkapi `docs/perencanaan/ALUR.md` (alur fondasi; aturan globalnya tetap berlaku). Versi 1, 11 Nov 2026.

**Notasi.** `[peran]` pelaku (TM tamu, AN anggota, PG pengurus, KR kurator, WL Ketua METI Wilayah, AD admin, SA super; `[sistem]` Worker; `[bot]` GitHub Actions; `[pemilik]`). `→` langkah berikutnya atau hasil sistem. `⟂` titik tolak: kondisi gagal atau penolakan, lalu pesan baku dalam tanda kutip atau tindakan. `◆` jejak D1 tercatat dalam transaksi yang sama. `↺` pengembalian (jalan balik). `■` akhir alur. Fitur dirujuk `FN-xnn` (PRD), tiket `JM-xnn` (TIKET). Pesan baku ditulis dalam bahasa Indonesia dengan sapaan "kamu"; versi Inggris di `en.json`.

**Aturan tanpa celah.** Tiap alur di berkas ini punya (1) akhir `■` yang jelas, (2) penolakan `⟂` untuk tiap kegagalan yang bisa diperkirakan, dan (3) pengembalian `↺` bila langkah bisa salah. Bagian 8 mengecek ketiganya per alur.

**Aturan global (tambahan atas ALUR dasar).**
1. Semua tulis D1 lewat `src/hak.js` dan menulis jejak `◆` dalam transaksi yang sama. Penolakan hak: 403 "Kamu tidak punya hak untuk ini." (`galat.hak`); sesi kedaluwarsa: 401 dan pengalihan ke `/masuk?ke=<alamat>` (D19).
2. Tidak ada surel, WhatsApp, atau pesan otomatis (C-21, C-08). Pemberitahuan memakai lonceng dalam aplikasi; apa pun yang keluar dari sistem adalah tombol salin yang ditekan manusia.
3. Penolakan tier: 403 "Fitur ini untuk anggota {tier} ke atas." (`galat.tier`) dan **tidak satu byte pun data terkunci dikirim** (C-23, potret berlapis). Kunci i18n baru ditetapkan DESAIN-TEKNIS.
4. Sumber dan tanggal: baris tanpa `sumber_url`, `tanggal_periksa`, `tingkat_bukti` ditolak pipeline.
5. Subagent tidak commit, push, atau deploy. Migrasi D1 produksi dan unggah R2 produksi dijalankan `[pemilik]`.
6. Peran fungsi seri M (penyunting, peninjau skema, asesor, penyelenggara, fasilitator wilayah, verifikator, hubungan internasional) adalah sel matriks pada peran yang ada (PRD 2.1); alur menulis nama fungsi dan peran akun yang memegangnya.

Status yang dipakai:

| Objek | Status |
| --- | --- |
| Akun (tambahan D22) | `tamu`, `menunggu`, `aktif`, `nonaktif` |
| Sumber panen | `ok`, `basi`, `gagal`, `blokir`, `perlu_kunci` |
| PR data-bot | `terbuka`, `diperbaiki`, `digabung`, `ditutup` |
| Regulasi (status berlaku) | `berlaku`, `dicabut`, `diubah`, `dicabut_sebagian`, `rancangan`, `tidak_diketahui` |
| Teks regulasi | `diekspor`, `perlu_ocr`, `ocr_perlu_tinjau`, `terverifikasi`, `bernomor_berbeda` |
| Tautan data | `usul`, `terbit`, `ragu`, `ditolak`, `dicabut` |
| Kegiatan Wilayah | `draf`, `terbit`, `dibatalkan`, `disembunyikan` |
| Wilayah (status berdiri) | `berdiri`, `segera`, `rencana` |
| Ajuan program (generik) | `draf`, `diajukan`, `ditinjau`, `perlu_perbaikan`, `disetujui`, `ditolak`, `ditarik` |
| Edisi terbit (M01) | `draf`, `ditinjau_pakar`, `beku`, `terbit`, `ditarik` |

Nama status ajuan dan kegiatan adalah usulan alur; bentuk akhir ada di `DESAIN-TEKNIS`.

---

## 1. Bot panen sampai tayang (FN-T01 sampai T08)

### 1.1 Putaran terjadwal satu sumber (JM-T01 sampai T05)

1. `[bot]` pemicu jadwal (harian, mingguan, bulanan, kuartalan) atau `workflow_dispatch` → baca `data/sumber_jadwal.json`, pilih sumber yang jatuh tempo. ⟂ registri tidak valid → putaran berhenti sebelum mengambil apa pun dan membuka isu "Registri sumber rusak". ■
2. `[bot]` untuk tiap sumber, baca ulang `robots.txt` → ⟂ robots melarang jalur (atau berubah menjadi larangan) → sumber `blokir` dengan alasan "robots", tidak diambil, lanjut ke sumber berikutnya. ⟂ sumber ada di daftar tolak (Antara, ESDM One Map, SINTA, SIRUP berlogin) → tidak pernah diambil; gerbang menagihnya.
3. `[bot]` periksa sinyal perubahan (ETag, Last-Modified, HEAD, hash). Tidak berubah → status `ok`, `diambil` tidak berubah, tidak ada PR untuk sumber ini. ■ (akhir tanpa perubahan).
4. `[bot]` berubah → ambil dengan UA jujur METI, tanpa login, jeda minimal 2 detik per host (10 detik untuk satudata.kemendesa). ⟂ 403 atau 429 → berhenti di host itu, `blokir`, tidak dicoba lagi sampai ditinjau orang. ⟂ timeout atau 5xx → `gagal`, hitung kegagalan berturut-turut. ⟂ sumber butuh kunci dan secret kosong → `perlu_kunci`, dilewati dengan catatan (C-25), bukan galat.
5. `[bot]` normalisasi → baris tanpa sumber, tanggal, tingkat bukti dibuang dan dihitung. ⟂ keluaran susut lebih dari 20%, JSON rusak, atau pola surel atau telepon muncul di lapis publik atau anggota → keluaran sumber itu tidak ditulis, status `gagal`, keluaran lama dipertahankan dengan `diambil` tidak berubah.
6. Lanjut ke 1.3. ↺ Sumber `blokir` atau `perlu_kunci` kembali `ok` hanya lewat tinjauan `[pemilik]` (1.4).

### 1.2 Denyut Worker dan panel kesegaran (JM-T07, T08)

1. `[sistem]` cron Worker harian → ambil sebatch sumber (dibagi agar tidak melewati batas subrequest) → HEAD atau ETag → tulis ke tabel status sumber di D1 (hasil, ETag terakhir, waktu). ⟂ batas subrequest hampir tercapai → berhenti di batch ini, sisanya putaran berikutnya (hari lain). ⟂ sumber tidak menjawab → catat `gagal`, tanpa mengulang dalam putaran yang sama. ◆
2. `[sistem]` hitung kesegaran tiap dataset terhadap tanggal sumber dan ambang basi menurut frekuensi sumber (bukan tanggal bangun) → dataset melewati ambang diberi `basi`.
3. `[AD/SA]` buka tab Kesegaran → tabel 178 dataset dengan umur, ambang, status. ⟂ peran lain → 403. ⟂ data denyut belum ada (belum pernah jalan) → strip "Denyut belum berjalan" dengan keterangan kapan cron berikutnya; panel tidak menampilkan "segar" tanpa data.
4. `[AD/SA]` memilih dataset `basi`, `blokir`, atau `perlu_kunci` → melihat alasan terakhir dan tautan ke PR atau isu terkait. ■
5. Pengguna biasa `[TM/AN/…]` melihat di tiap kartu data "diperiksa {tanggal}" menurut sumber; dataset `basi` menampilkan pil "Data lama", bukan disembunyikan. ■

### 1.3 Dari keluaran ke PR ke tayang (JM-T06)

1. `[bot]` rantai panen, sambung, hubung, skor, potret per lapis berjalan sebagai satu perintah. ⟂ satu sumber gagal → sumber itu dilewati, putaran lanjut (satu sumber gagal tidak menggagalkan putaran).
2. `[bot]` jalankan `npm run uji` dan gerbang unggah. ⟂ gagal → tidak ada PR; buka isu "Uji gagal" berisi log ringkas; keluaran tidak masuk `data-bot`. ■ (akhir tanpa PR).
3. `[bot]` lulus → tulis ke cabang `data-bot` dan buka PR berisi selisih (per dataset: baris ditambah, diubah, dihapus; sumber ber-status gagal atau blokir). Tidak ada tulis langsung ke `main`.
4. `[pemilik/PG]` tinjau PR. **Setujui dan gabung** → data masuk `main` dan tayang (push ke `main` = tayang publik). **Minta perbaikan** → komentar; `[bot]` atau pengerja memperbaiki dan mengulang langkah 2 (`diperbaiki`). **Tolak dan tutup** → PR `ditutup`, data tidak tayang, sumber tetap memakai keluaran lama.
5. `[pemilik]` potret yang disimpan di R2 diunggah lewat gerbang unggah (semua atau tidak sama sekali). ⟂ potret baru ditolak gerbang → potret lama tetap tayang. ■
6. ↺ Pengembalian: PR yang sudah digabung dibalik dengan revert PR, lalu redeploy; potret sebelumnya diunggah ulang.
7. Tiga kegagalan berturut-turut satu sumber → isu otomatis "Sumber {kode} gagal 3 kali". Setelah pulih (`ok`), isu ditutup oleh `[bot]` dan komentar penutup mencatat waktunya.
8. Workflow terjadwal dinonaktifkan GitHub setelah 60 hari tanpa aktivitas repo publik. Tanda: panel kesegaran menunjukkan seluruh dataset melewati ambang tanpa PR baru. `[pemilik]` membuka kembali workflow lewat tombol "Enable"; tidak ada penutup otomatis.

### 1.4 Sumber berkunci dan sumber terblokir (C-25, C-24)

1. `[bot]` menemukan sumber BPS, EIA, Ember (API), atau Comtrade penuh tanpa secret → `perlu_kunci`.
2. `[pemilik]` mendaftar sendiri di sumber lalu mengisi GitHub Secrets (tidak lewat chat, tidak masuk repo). ⟂ kunci salah → putaran berikut mendapat 401 atau 403 → `gagal`, bukan `blokir`, dan tidak mengulang tanpa batas.
3. Sumber `blokir` (403, 429, robots): `[pemilik]` memeriksa; bila akses resmi diizinkan (izin tertulis, kunci), ubah statusnya; bila tidak, sumber pindah ke RUJUK SAJA atau TOLAK di registri. ■ (tidak ada upaya mengakali blokir).
4. Sumber bersyarat nonkomersial (GEM, IRENA, 1001startup, Comtrade): dapat dibaca layar, tetapi **ditolak** sebagai bahan produk data berbayar (M01, M09) sampai C-24 diputus. Gerbang produk menolak dataset bertanda syarat.

---

## 2. Regulasi (FN-U01 sampai U07)

### 2.1 Dari katalog ke teks di GitHub (JM-U01, U02, U03, U05)

1. `[bot/pipa]` ambil teks dari JDIH (S62 BPK, S06 ESDM, S63, S64, S65) → ekstrak dengan `pdftotext` → tulis `hukum/<jenis>/<tahun>/<id>.md` dengan frontmatter dan segmen; PDF mentah tidak masuk repo (hanya hash).
2. `[sistem]` periksa nomor dan judul dari halaman pertama PDF. Cocok dengan katalog → `terverifikasi`. ⟂ berbeda → `bernomor_berbeda`, masuk antrean kurator.
3. `[KR]` buka antrean "nomor berbeda" → pasangan (katalog, halaman pertama) → **Setujui** (pakai nomor halaman pertama) atau **Tolak** (pertahankan katalog, wajib alasan). ◆ ⟂ peran lain → 403. ↺ KR dapat mengubah keputusan lewat entri koreksi baru; yang lama tetap di jejak.
4. Target yang tidak tersedia di sumber resmi (dari 50 target nasional dan 38 Perda RUED): `[pipa]` mencatat "tidak tersedia" dengan alasan; tidak ada berkas dikarang. Layar menampilkan "Belum ada" atau "Belum kami cari". ■
5. Gerbang higiene menolak berkas yang memuat data pribadi atau pola surel dan telepon sebelum PR. ■ (PR mengikuti 1.3.)

### 2.2 OCR pindaian (JM-U04)

1. `[pipa]` menandai dokumen dengan halaman kurang dari 40 huruf `perlu_ocr` (51 dokumen).
2. `[pemilik]` menjalankan `scripts/pipa/ocr_pdf.swift` di mesin lokal → teks dan mutu masuk frontmatter (`ekstraksi.metode: ocr-vision`, `mutu`) → status `ocr_perlu_tinjau`. Dokumen ini ditampilkan dengan pil "Hasil OCR, perlu tinjau"; kutipan angka dari dokumen ini ditahan.
3. `[KR]` membaca dan menandai `terverifikasi`. ⟂ mutu rendah → kembali `perlu_ocr` dengan catatan; ulangi langkah 2. ■
4. 125 dokumen gagal diurai: `[pipa]` mengulang ekstraksi sekali; yang tetap gagal dicatat `gagal` dengan alasan dan masuk antrean tinjau. ■

### 2.3 Relasi, status berlaku, dan cek mingguan (JM-U06)

1. `[pipa]` turunkan relasi dari halaman detail BPK dan konsiderans: mencabut, dicabut oleh, mengubah, diubah oleh, mengingat, merujuk → tiap relasi ditulis dua arah (bila A mencabut B, B.dicabut_oleh = A).
2. `[bot]` mingguan bandingkan ETag halaman detail 622 dokumen. Tidak berubah → selesai. Berubah → ambil ulang status dan relasi. Bila relasi berubah → isu otomatis "Relasi berubah: {id}" dan PR sesuai 1.3. ⟂ status "dicabut sebagian" atau UU diubah putusan MK → ditandai `dicabut_sebagian` dan masuk antrean KR (tidak disimpulkan otomatis).
3. Pengguna `[TM/AN/…]` pilih tanggal di PN "Berlaku per tanggal" → `[sistem]` menyaring regulasi yang berlaku pada tanggal itu. ⟂ tanggal sebelum data tersedia → strip "Belum kami cari". ■
4. ↺ KR dapat menarik status keliru dengan koreksi; status lama tersimpan di jejak.

### 2.4 Peta dampak (JM-U07, bergantung L02)

1. `[pipa]` hitung tautan regulasi ke proyek, organisasi, teknologi, wilayah memakai metode ALGORITMA bagian dampak; tiap tautan membawa pasal dasar dan tingkat bukti. Yakin tinggi → `terbit`. Ragu → `ragu`, antrean KR.
2. `[KR]` memutus antrean `ragu`: **Setujui** (`terbit`), **Tolak** (`ditolak`, alasan wajib). ◆ ⟂ peran lain → 403.
3. Pengguna membuka regulasi → PN "Terdampak"; membuka proyek, organisasi, teknologi, atau wilayah → PN "Aturan yang mengikat". Tiap baris menampilkan pasal dasar, pil tingkat bukti, dan EST bila turunan. ⟂ tak ada tautan → strip "Belum ada" (bukan angka 0 yang menyesatkan).
4. Pengguna melihat tautan keliru → tombol "Ajukan koreksi" → formulir singkat → entri koreksi `baru` → KR memutus (diterima atau ditolak dengan alasan). ◆ ↺ tautan `dicabut` hilang dari layar tetapi tetap di jejak. ■

---

## 3. Tautan data (FN-L01 sampai L08)

### 3.1 Membangun tautan (JM-L01 sampai L06)

1. `[pipa]` jalankan metode ALGORITMA untuk pasangan (proyek ke organisasi, proyek ke regulasi dan berita, pendanaan ke proyek dan organisasi, riset ke pakar, pakar ke orang, kampus, inovasi, berita ke entitas dan wilayah, proyek ke kabupaten). Kunci kuat (NPWP, NIB, ORCID, DOI, ROR) dahulu, lalu skor lunak.
2. Yakin tinggi dengan sumber → `terbit` dua arah (sisi balik ditulis dalam langkah yang sama). Kunci ambigu atau skor sedang → `ragu`, antrean KR; tidak ditautkan. Tanpa sumber → ditolak.
3. `[KR]` memutus antrean: **Setujui** → `terbit` dua arah; **Tolak** → `ditolak` dengan alasan; **Minta data** → kembali `usul` dengan catatan untuk pipa. ◆ ⟂ peran lain → 403.
4. `[pipa]` menulis laporan cakupan sebelum-sesudah per pasangan. ⟂ cakupan turun dari garis dasar → laporan ditandai merah dan tiket tidak boleh ditutup. ■
5. ↺ Tautan salah ditarik KR → `dicabut` dan sisi balik ikut dicabut dalam langkah yang sama.

### 3.2 Gerbang tautan dua arah (JM-L08)

1. `[bot/CI]` `npm run uji` menjalankan gerbang: tiap rujukan harus punya sisi balik; cakupan tidak boleh di bawah garis dasar; rujukan mati (misalnya organisasi tidak ada) gagal.
2. ⟂ gerbang gagal → PR tidak boleh digabung; pengerja memperbaiki tautan atau garis dasar disetujui `[pemilik]` secara tertulis (ambang tidak dilemahkan untuk meloloskan kerja sendiri). ■

### 3.3 Pengguna membaca tautan dan kembali

1. `[TM/AN/…]` buka profil → PN tautan (organisasi, proyek, regulasi, berita, pendanaan, riset, wilayah) → klik → profil tujuan memuat tautan balik. ⟂ tujuan tidak ada (rujukan mati lolos) → bagian disembunyikan (D21), gerbang berikutnya menangkap. ■
2. Kosong → strip dengan satu dari empat alasan baku. ■

---

## 4. METI Wilayah (FN-W01 sampai W03)

### 4.1 Akun Ketua Wilayah

`[AD]` membuat akun peran `wilayah` dengan `cakupan_prov` wajib sesuai alur dasar (ALUR dasar 1.1): ⟂ tanpa provinsi → "Pilih provinsi untuk ketua METI Wilayah." Akun aktif lewat tautan aktivasi yang disalin manual. ■

### 4.2 Mengelola kegiatan (JM-W01, W02)

1. `[WL]` masuk → menu menampilkan `/wilayah-admin`; AD dan SA melihat pemilih provinsi, WL hanya provinsinya. ⟂ `[AN/TM/PG]` membuka `/wilayah-admin` → 403 "Kamu tidak punya hak untuk ini." ⟂ WL tanpa `cakupan_prov` → tidak melihat baris apa pun ("0 = 1" di hak.js) dan layar menampilkan "Akunmu belum diberi provinsi. Hubungi admin."
2. `[WL]` tab Kegiatan → tombol "Tambah kegiatan" → isi judul, tanggal, tempat, deskripsi, peserta agregat → Simpan. ⟂ judul kosong → "Judul wajib diisi." ⟂ tanggal tidak valid → "Tanggal tidak valid." ⟂ provinsi pada isian berbeda dari `cakupan_prov` (diedit lewat alat pengembang) → server menolak 403, bukan hanya disembunyikan. Hasil: kegiatan `terbit` (bawaan, PRD 13 butir 8). ◆
3. `[WL]` ubah kegiatan → perubahan tersimpan; ◆ `dari` dan `ke`. ⟂ kegiatan milik provinsi lain → 403.
4. `[WL]` batalkan kegiatan → status `dibatalkan` dengan alasan wajib; tampil di papan dengan pil "Dibatalkan". ↺ `[WL]` dapat membuka kembali ke `terbit` bila belum lewat tanggal. ◆
5. ■ Akhir: kegiatan tampil di papan FN-W03.

### 4.3 Agenda, notulen, dan foto

1. `[WL]` tab Agenda → tambah agenda terjadwal; tab Notulen → unggah atau tulis notulen untuk agenda yang sudah lewat. ⟂ notulen untuk agenda yang belum lewat → "Notulen bisa ditambahkan setelah agenda berlangsung."
2. `[WL]` tab Foto → unggah foto dokumentasi agenda (privat di R2, K20). ⟂ file bukan gambar atau terlalu besar → "Foto harus berupa gambar di bawah {batas} MB." ⟂ foto berisi orang tanpa kredit atau izin → wajib mengisi kredit; tanpa kredit disimpan sebagai `perlu_kredit` dan tidak tampil. ■
3. ↺ Penghapusan foto: `[WL]` hapus foto sendiri → hilang dari tampilan; berkas R2 dibersihkan oleh `[sistem]`. ◆

### 4.4 Berita dan anggota provinsi

1. `[WL]` tab Berita → tambah berita wilayah (judul, ringkasan, tautan sumber). ⟂ tanpa sumber → "Tautan sumber wajib diisi." → `terbit`, tampil di linimasa wilayah. ◆
2. `[WL]` tab Anggota → melihat daftar anggota provinsinya (nama, jabatan publik, afiliasi) dan mencatat keaktifan. Mengubah peran, iuran, atau status akun tetap lewat `[AD]`. ⟂ `[WL]` mencoba mengubah peran → 403. ⟂ kontak orang di luar provinsinya → tidak tampil (hak.js). ■

### 4.5 Pusat meninjau, menyembunyikan, dan mengganti

1. `[AD/SA]` memilih provinsi → melihat semua tab. Kegiatan bermasalah → "Sembunyikan" dengan alasan wajib → status `disembunyikan`, hilang dari papan, WL melihat alasan. ◆ ↺ `[AD/SA]` "Pulihkan" mengembalikan ke `terbit`. ⟂ `[PG]` mencoba menyembunyikan → 403 (PG membaca saja; bawaan).
2. Pergantian Ketua Wilayah: `[AD]` ubah akun lama (nonaktifkan atau ubah `cakupan_prov`) dan buat akun baru. Kegiatan tetap milik provinsi, bukan akun. ◆ ⟂ akun lama masih aktif memuat sesi → semua sesi dihapus saat dinonaktifkan. ■

### 4.6 Membaca papan Wilayah

1. `[TM/AN/…]` buka papan provinsi → JS, KA, PN kegiatan, rapor, orang, organisasi, proyek. Wilayah `berdiri` menampilkan data lengkap; `segera` atau `rencana` menampilkan strip "Belum berdiri" dengan status dan tanpa kegiatan buatan. ⟂ data wilayah gagal dimuat → bagian disembunyikan; kartu utama gagal → galat `role="alert"` dengan "Coba lagi". ■
2. Anggota daerah membuka laporan provinsi lengkap (tier menurut peta). ⟂ tier tidak cukup → kartu terkunci (5.2).

---

## 5. Tier anggota (FN-N01 sampai N03)

### 5.1 Masuk sebagai tamu (D22)

1. Akun `tamu` dibuat `[AD]` (akun gratis tanpa keanggotaan), atau terjadi ketika anggota yang disetujui `/daftar` tanpa lunas melewati tenggang 30 hari dan turun ke `tamu` (C-28; 5.4). Tautan aktivasi disalin manual. ◆
2. `[TM]` buka tautan aktivasi → sandi baru dua kolom (alur dasar 1.1 langkah 5 sampai 6) → sesi → halaman awal. ⟂ tautan kedaluwarsa → "Tautan ini sudah tidak berlaku. Minta tautan baru ke Admin."
3. `[TM]` melihat data dasar (C-23). Tab dan fitur terkunci tampil dengan ikon gembok (5.2). ■

### 5.2 Fitur terkunci dan penolakan di server

1. `[TM/tier rendah]` membuka fitur terkunci → kartu terkunci: satu kalimat manfaat, tier yang dibutuhkan, tombol "Lihat cara naik tier". Tidak ada data terkunci di respons.
2. Peramban meminta data terkunci langsung (alamat diketik, alat pengembang) → `[sistem]` 403 "Fitur ini untuk anggota {tier} ke atas." dan potret lapis atas tidak diberikan. ◆ (percobaan ditolak dicatat bila berulang). ⟂ sesi kedaluwarsa → 401 dan pengalihan ke masuk.
3. "Lihat cara naik tier" → halaman manfaat (tabel per tier, tarif dari `keanggotaan.json` bertanggal 1 Jul 2026) → tombol menuju `/daftar` atau kontak Sekretariat. ■

### 5.3 Naik tier lewat pendaftaran dan iuran (D20)

1. `[TM]` atau calon baru buka `/daftar` (boleh tanpa login) → formulir bertahap, persetujuan UU PDP wajib. ⟂ honeypot terisi atau batas laju → ditolak tanpa pesan terperinci. Pendaftar mendapat tautan lacak bertoken.
2. `[PG/AD]` tab Persetujuan anggota → **Setujui** (akun `anggota` berstatus `menunggu` dengan tautan aktivasi; boleh tanpa lunas dengan tanda) atau **Tolak** (alasan wajib). ◆ ↺ Pendaftar yang ditolak boleh mendaftar ulang dengan data baru; alasan penolakan terlihat di tautan lacak.
3. Pendaftar mengunggah bukti transfer lewat tautan lacak (atau Midtrans bila aktif). `[AD]` mencocokkan → **Terima bukti** (iuran lunas, tier naik sesuai tangga; ◆) atau **Tolak bukti** (alasan wajib; tier tetap; pendaftar mengunggah ulang). ⟂ nominal tidak cocok tangga → tolak dengan alasan "Nominal tidak sesuai".
4. `[AN]` login berikutnya melihat tier baru dan fitur terbuka. Lonceng "Tier kamu naik" muncul. ■ Tidak ada surel terkirim; `[AD]` menyampaikan kabar secara manual bila perlu.
5. ↺ Salah catat: `[AD]` mengoreksi tier dengan alasan; perubahan tercatat dan lonceng memberi tahu akun. ◆

### 5.4 Turun tier atau nonaktif

1. `[AD]` menandai keanggotaan tidak aktif (iuran tidak dibayar atau permintaan sendiri) → akun kembali `tamu` (bukan `nonaktif`) atau `nonaktif` bila diminta; sesi lama dihapus bila `nonaktif`. ◆ ⟂ akun adalah `super` terakhir → "Harus tersisa satu Super Admin."
   Anggota yang disetujui tanpa lunas (D20) memakai tier terendah berbayar untuk kategorinya (`pelajar` bagi mahasiswa, `individu` bagi lainnya termasuk organisasi) selama tenggang 30 hari dan naik ke tier pilihan sesudah lunas; lewat tenggang akun turun ke `tamu` tanpa menghapus data (C-28).
2. Fitur terkunci kembali tertutup pada permintaan berikutnya; data yang dimiliki akun (profil, ikuti) tidak dihapus. ↺ `[AD]` memulihkan tier setelah iuran dibayar. ■
3. Turun karena tenggang C-28 dihitung saat dibaca (ALGORITMA `§tier` R.2), tanpa kerja terjadwal dan tanpa surel (C-21): hari ke-30 sesudah persetujuan tanpa lunas masih tier dasar, hari ke-31 `tamu`. Iuran yang lewat masa berlaku ditambah tenggang 30 hari [U] juga dihitung saat dibaca; `[AD]` tetap dapat menurunkan atau memulihkan manual (butir 1 dan 2).

---

## 6. Ajuan dan keputusan di tiap program (FN-M01 sampai M12)

### 6.0 Bentuk ajuan generik

1. `[AN]` membuka formulir → isi → **Simpan draf** (`draf`) atau **Ajukan** (`diajukan`). ⟂ isian wajib kosong → pesan per kolom; draf boleh tersimpan tidak lengkap, ajuan tidak. ⟂ tier tidak cukup → 403 tier (5.2). ◆
2. `[sistem]` memberi lonceng ke pemutus yang berwenang → `ditinjau` saat dibuka pemutus.
3. Pemutus: **Setujui** → `disetujui`; **Minta perbaikan** → `perlu_perbaikan` dengan catatan; **Tolak** → `ditolak` dengan alasan wajib. ◆ ⟂ pemutus mengajukan atau mengubah ajuannya sendiri → ditolak ("Kamu tidak bisa memutus ajuanmu sendiri."; penulis kode bukan pengulasnya, berlaku pula untuk keputusan).
4. Pengaju melihat status dan alasan di halaman ajuannya; lonceng memberi tahu. `perlu_perbaikan` → pengaju mengedit → **Ajukan ulang** (kembali `diajukan`). `ditolak` → pengaju boleh membuat ajuan baru. ↺ `[AN]` **Tarik** ajuan selama belum `disetujui` → `ditarik`. ◆
5. ■ Akhir selalu `disetujui`, `ditolak`, atau `ditarik`; ajuan `diajukan` tanpa tindakan pemutus lebih dari batas layanan (ditetapkan DESAIN-TEKNIS) ditandai di antrean pemutus sebagai "Menunggu lama", tidak otomatis disetujui atau ditolak.

Program yang mengikat organisasi (M03, M06, produk berbayar M01) menyala hanya setelah `pra-peluncuran` dimatikan oleh Pengurus Harian (C-01). Sebelum itu formulir menampilkan strip "Belum dibuka" dan tidak menerima ajuan.

### 6.1 M01 Pusat Data (JM-M01)

1. Penerbitan edisi: penyunting (PG atau KR) membuat `draf` dengan angka yang mengunci tanggal beku → **Kirim ke Dewan Pakar** (`ditinjau_pakar`) → peninjau memberi catatan → **Beku** (`beku`) → **Terbit** (`terbit`). ⟂ angka tanpa sumber atau tanpa tanggal → tidak bisa dibekukan. ⟂ peninjau menolak → kembali `draf` dengan catatan (↺).
2. `[AN]` unduh lembar data atau CSV bersitasi → `[sistem]` memeriksa tier. ⟂ tier tidak cukup → kartu terkunci. Unduhan ditandai tanggal beku dan kutipan baku. ⟂ dataset bertanda syarat nonkomersial (C-24) → tidak masuk paket unduhan produk.
3. Koreksi publik: edisi `terbit` yang salah → penyunting **Tarik** (`ditarik`) dan menerbitkan edisi koreksi; edisi lama tetap terlihat dengan pil "Ditarik: {alasan}". ↺ ■

### 6.2 M02 Advokasi (JM-M02)

1. `[PG/KR]` mengelola papan 22 butir: ubah status, PIC, tenggat, pasal. Tiap perubahan `◆`. Posisi diberi `pemilik_posisi` (resmi, usulan asosiasi, bahan pihak lain). ⟂ dokumen internal belum disetujui `[pemilik]` → tidak bisa ditayangkan.
2. `[AN]` memberi komentar atau usul posisi (menurut tier). Usul masuk antrean `diajukan` (6.0): PG memutus **Setujui** (jadi butir), **Tolak** (alasan), atau **Minta perbaikan**.
3. Polling isu: PG membuka polling (waktu berakhir) → `[AN]` menjawab sekali per akun. ⟂ menjawab dua kali → "Kamu sudah menjawab." ⟂ polling berakhir → ditutup, hasil tampil. ↺ PG dapat membatalkan polling yang keliru (jawaban disimpan, tidak ditampilkan).
4. Ruang kelompok kerja: anggota kelompok menulis notulen dan tenggat; non-anggota tidak melihat. ⟂ non-anggota → 403. ■

### 6.3 M03 Pemasang Terpercaya (JM-M03)

1. `[AN]` badan usaha mendaftar (dokumen, kapasitas terpasang) → ajuan generik. Peninjau skema memeriksa dokumen; komite memutus. **Setujui** → tanda METI Terpercaya dan QR di KTA badan usaha; **Minta perbaikan**; **Tolak** (alasan).
2. Konsumen (akun tamu gratis, PRD 13 butir 2) mengisi pengaduan terhadap pemasang → `diajukan` → peninjau memeriksa dan menghubungi pemasang → hasil: **Selesai**, **Pelanggaran terbukti** (tindakan: peringatan, penangguhan, pencabutan tanda), atau **Tidak terbukti**. ⟂ pemasang tidak menanggapi dalam batas layanan (30 hari menurut KPI [U]) → ditandai "Tanpa tanggapan". ↺ Pemasang dapat mengajukan keberatan sekali (ajuan baru ke komite berbeda). Aduan yang sudah diputus dihapus 24 bulan sesudah putusan (C-26).
3. Pencabutan tanda → QR menampilkan "Dicabut" saat dipindai oleh akun yang login; pemindai tanpa login diarahkan ke masuk (C-27). ↺ Dipulihkan bila keberatan diterima. ■
4. Sampai C-01 disetujui: strip "Belum dibuka".

### 6.4 M04 Radar Proyek dan Desk Siap Bank (JM-M04)

1. `[AN]` organisasi mengajukan proyek (lahan, izin, jaringan, tarif atau offtake, EPC) → `diajukan` → `[sistem]` menghitung skor kesiapan (label EST, rumus di CH) → pengurus bidang pendanaan meninjau: **Lolos** (`disetujui`, masuk daftar pipeline), **Minta perbaikan** (kekurangan per syarat), **Tolak** (alasan).
2. Proyek `disetujui` mendapat ruang data privat; anggota lain hanya melihat ringkasan sesuai tier. ⟂ akses ruang data oleh akun di luar yang diundang → 403.
3. Pendana atau mitra yang tertarik mengirim permintaan lewat lonceng; pengaju menerima atau menolak. ■
4. ↺ Pengaju menarik proyek: ruang data ditutup, jejak tetap.

### 6.5 M05 Koperasi Desa (JM-M05)

1. Semua yang login memakai kalkulator PLTS komunal tanpa menyimpan data pribadi; hasil berlabel EST dan kosong bila isian tidak masuk akal ("Isi nilai yang masuk akal.").
2. `[AN]` fasilitator wilayah (WL atau anggota daerah) mencatat kinerja pilot (tanpa data pribadi) → ajuan generik dan KR meninjau. **Setujui** → masuk repositori pembelajaran; **Tolak** (alasan). ■
3. Direktori kontributor: pendaftaran masuk antrean KR.

### 6.6 M06 Sertifikasi dan Akademi (JM-M06)

1. `[AN]` pilih jalur kompetensi → ikuti modul → **Daftar ujian** (ajuan generik, tier menentukan diskon biaya uji). Biaya uji menunggu C-01.
2. Asesor (LSP mitra, sel KR) menilai → **Lulus** (sertifikat dan lencana QR) atau **Tidak lulus** (jadwal ulang). ⟂ ujian ulang dibatasi sesuai aturan LSP. ◆
3. Verifikasi lencana lewat QR menampilkan nama, tingkat, masa berlaku, tanpa data pribadi lain. ⟂ sertifikat kedaluwarsa atau dicabut → "Tidak berlaku". ↺ Dicabut hanya oleh asesor dengan alasan; peserta boleh mengajukan banding ke PG.
4. Hasil tertaut ke `kerja` (lowongan) bila peserta mengizinkan. ■

### 6.7 M07 Forum Bisnis dan Misi Dagang (JM-M07)

1. `[AN]` perusahaan mengisi profil penawaran dan kebutuhan → ajuan generik; penyelenggara menyetujui agar tampil.
2. `[AN]` meminta temu dengan perusahaan lain → penerima **Terima** (penjadwal menawarkan slot), **Tolak** (alasan singkat), atau **Jadwal ulang**. ⟂ kuota temu tier habis → "Kuota temu untuk tier kamu sudah habis." ⟂ slot bentrok → penjadwal menawarkan slot lain.
3. Setelah temu: kedua pihak mengisi tindak lanjut (MoU atau lanjut). ■ ↺ Permintaan dapat ditarik sebelum diterima; temu dapat dibatalkan dengan kuota dikembalikan.

### 6.8 M08 METI Wilayah 38 Provinsi (JM-M08)

Memakai alur 4. Tambahan: `[AD/SA]` mengubah status wilayah (`rencana`, `segera`, `berdiri`) dengan nomor SK dan tanggal. ⟂ `berdiri` tanpa SK → ditolak ("Nomor SK wajib untuk status berdiri."). ↺ Status dapat diturunkan bila SK dicabut (alasan wajib). ■

### 6.9 M09 Hub Rantai Pasok (JM-M09)

1. `[AN]` pemasang mendaftarkan produk (spesifikasi, TKDN, uji) → ajuan generik; verifikator (sel KR) memeriksa dokumen. **Terverifikasi** (tampil dengan pil), **Minta perbaikan**, atau **Ditolak** (alasan).
2. Produk gagal setelah terdaftar → aduan dari anggota → verifikator mencabut verifikasi (`ditarik`, alasan) → produk tampil dengan "Verifikasi dicabut". ↺ Dipulihkan setelah perbaikan.
3. Bergantung pada FN-M03 untuk kerangka verifikasi. ■

### 6.10 M10 Diplomasi Energi (JM-M10)

1. Semua yang login membaca pembanding kebijakan ASEAN dan papan kerja sama.
2. `[AN]` mendaftar sebagai kontributor → antrean KR; **Setujui** → direktori kontributor; **Tolak** (alasan). Kontak hanya menurut tier (C-23). ■ ↺ Kontributor menarik profil sendiri kapan saja.

### 6.11 M11 METI Institute (JM-M11)

1. Kajian: penulis (pakar) → `draf` → Dewan Pakar → `terbit`; alurnya sama dengan edisi M01. 
2. Hibah dan aset riset: lembaga mengajukan tautan (ajuan generik), KR meninjau.
3. Magang: mahasiswa melamar lewat `kerja`; organisasi pemasang menerima atau menolak. ⟂ lowongan kedaluwarsa → "Lowongan sudah ditutup." ■

### 6.12 M12 Klub Pembeli Hijau (JM-M12)

1. `[AN]` pembeli mengisi profil kebutuhan beban per kawasan; kotak "Tampil anonim" mengaburkan nama di server (bukan hanya di layar). → ajuan generik; PG menyetujui.
2. Cocokkan ke pipeline M04: pembeli melihat proyek yang cocok; pengembang melihat pembeli tanpa identitas bila anonim; pengungkapan identitas butuh persetujuan pembeli. ⟂ pengembang meminta identitas → permintaan masuk lonceng pembeli; **Izinkan** atau **Tolak**.
3. Menunggu C-01 untuk tier pembeli berbayar. ■ ↺ Pembeli menarik profil: pencocokan dihapus.

---

## 7. Keadaan kosong dan gagal (katalog baku)

| Keadaan | Tampilan | Aksi | Berlaku di |
| --- | --- | --- | --- |
| Memuat | kerangka `.jm-hantu` setinggi isi akhir; tanpa spinner penuh layar | tidak ada | semua |
| Kosong karena belum ada data | strip dengan satu alasan: Tidak dipublikasikan, Belum ada, Menunggu data K/L, Belum kami cari | satu aksi bila relevan | peta dampak, wilayah, regulasi, tautan |
| Kosong karena filter | "Tidak ada yang cocok" | "Hapus saringan" | tabel, pencarian |
| Kosong karena belum ada kegiatan | "Belum ada kegiatan" | "Tambah kegiatan" (WL) | `/wilayah-admin` |
| Galat kartu utama | `role="alert"`, kalimat dari katalog | "Coba lagi" | kartu utama tiap halaman |
| Galat bagian opsional | bagian disembunyikan (D21) | tidak ada | PN tautan, berita, dll |
| Luring | pita kecil | tidak ada | semua |
| 401 | pengalihan ke `/masuk?ke=` | masuk | semua |
| 403 hak | "Kamu tidak punya hak untuk ini." | kembali | peran salah |
| 403 tier | kartu terkunci, "Fitur ini untuk anggota {tier} ke atas." | "Lihat cara naik tier" | fitur terkunci |
| 404 | halaman 404 dalam gaya situs | kembali ke beranda | semua |
| 429 batas laju | "Terlalu banyak percobaan. Coba lagi nanti." | tunggu | masuk, daftar, formulir |
| Data lama | pil "Data lama" dan tanggal periksa | tidak ada | dataset `basi` |
| Sumber terblokir | strip "Sumber tidak bisa diambil" di panel admin; di layar pengguna tampil data lama | admin meninjau | panel kesegaran |
| Dataset tanpa baris (paten, emisi provinsi, podcast, sosmed) | blok tidak dirender | tidak ada | JM-S06 |
| Denyut belum berjalan | "Denyut belum berjalan" | tidak ada | panel kesegaran |
| Ajuan lama tanpa tindakan | pil "Menunggu lama" di antrean pemutus | pemutus bertindak | seri M |
| Belum dibuka (C-01) | strip "Belum dibuka" | tidak ada | M03, M06, produk berbayar M01 |
| Kuota habis | "Kuota ... sudah habis." | naik tier | M07 |

---

## 8. Matriks tanpa celah

Setiap alur punya akhir, penolakan, dan pengembalian. Sel kosong tidak ada.

| Alur | Akhir | Penolakan | Pengembalian |
| --- | --- | --- | --- |
| 1.1 Putaran satu sumber | `ok` tanpa PR, atau lanjut 1.3 | robots, 403 atau 429, kunci kosong, susut, JSON rusak | status kembali `ok` lewat tinjauan pemilik |
| 1.2 Denyut dan panel | panel terisi, pil Data lama | peran bukan AD atau SA, denyut belum berjalan | batch berikut menyelesaikan |
| 1.3 Keluaran sampai tayang | PR digabung dan tayang, ditutup, atau tanpa PR | uji gagal, gerbang unggah, PR ditolak | revert PR, unggah ulang potret lama |
| 1.4 Sumber berkunci dan terblokir | sumber `ok`, dipindah ke RUJUK, atau TOLAK | kunci salah, blokir, bersyarat C-24 | pemilik mengubah status |
| 2.1 Teks ke GitHub | berkas `terverifikasi` atau "tidak tersedia" | nomor berbeda, data pribadi | KR mengubah keputusan dengan koreksi |
| 2.2 OCR | `terverifikasi` atau `gagal` dengan alasan | mutu rendah | kembali `perlu_ocr` |
| 2.3 Relasi dan status | status per tanggal tampil | dicabut sebagian, tanggal terlalu awal | koreksi KR |
| 2.4 Peta dampak | tautan `terbit` atau `ditolak` | peran bukan KR, tak ada tautan | `dicabut` dengan sisi balik |
| 3.1 Membangun tautan | `terbit`, `ditolak`, atau minta data | tanpa sumber, kunci ambigu | `dicabut` |
| 3.2 Gerbang dua arah | PR bisa digabung | satu arah, cakupan turun | perbaiki atau garis dasar disetujui tertulis |
| 3.3 Membaca tautan | profil tujuan | tujuan tidak ada, kosong | bagian disembunyikan |
| 4.1 Akun WL | akun aktif | tanpa provinsi | nonaktifkan dan buat ulang |
| 4.2 Kegiatan | `terbit` di papan | judul kosong, tanggal salah, provinsi lain 403 | buka kembali dari `dibatalkan` |
| 4.3 Agenda, notulen, foto | notulen dan foto tersimpan | sebelum agenda, bukan gambar, tanpa kredit | hapus foto sendiri |
| 4.4 Berita dan anggota | berita `terbit`, daftar terbaca | tanpa sumber, ubah peran 403 | edit atau hapus berita |
| 4.5 Pusat meninjau | `disembunyikan` atau akun diganti | PG 403 | Pulihkan |
| 4.6 Papan | papan tampil | gagal dimuat, belum berdiri | Coba lagi |
| 5.1 Tamu | sesi sebagai tamu | tautan kedaluwarsa | tautan baru oleh AD |
| 5.2 Fitur terkunci | kartu terkunci | 403 tier, 401 | naik tier |
| 5.3 Naik tier | tier baru aktif | tolak pendaftaran, tolak bukti, honeypot | daftar ulang, unggah ulang, koreksi tier |
| 5.4 Turun tier | kembali `tamu` atau `nonaktif` | super terakhir | pulihkan tier |
| 6.0 Ajuan generik | `disetujui`, `ditolak`, `ditarik` | kolom kosong, tier kurang, memutus sendiri | tarik, ajukan ulang |
| 6.1 M01 | edisi `terbit` atau `ditarik` | tanpa sumber, peninjau menolak | kembali `draf`, edisi koreksi |
| 6.2 M02 | butir diperbarui, polling ditutup | dokumen belum disetujui, jawab dua kali, non-anggota | batalkan polling |
| 6.3 M03 | tanda terbit, aduan selesai | belum dibuka, ditolak, tanpa tanggapan | keberatan sekali, dipulihkan |
| 6.4 M04 | proyek di pipeline atau ditolak | tolak, akses ruang data | tarik proyek |
| 6.5 M05 | repositori diperbarui | isian tak masuk akal, ditolak | kontributor menarik |
| 6.6 M06 | sertifikat dan lencana | tidak lulus, belum dibuka | banding, jadwal ulang |
| 6.7 M07 | temu terlaksana | tolak, kuota habis, bentrok | tarik, jadwal ulang, kuota kembali |
| 6.8 M08 | status wilayah diperbarui | berdiri tanpa SK | turun status |
| 6.9 M09 | produk terverifikasi | ditolak | cabut dan pulihkan |
| 6.10 M10 | kontributor terdaftar | ditolak | tarik profil |
| 6.11 M11 | kajian terbit | lowongan tutup | kembali `draf` |
| 6.12 M12 | pencocokan berjalan | tolak pengungkapan, belum dibuka | tarik profil |
