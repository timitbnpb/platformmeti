# KEPUTUSAN: 65 fitur pilihan pemilik

Modul perencanaan `docs/perencanaan/fitur-65/`. Dibuat 15 Nov 2026 atas perintah pemilik ("ini semua lu lakukan") terhadap 65 butir yang dipilih dari daftar 100 ide. Dokumen ini kalah dari `KEPUTUSAN-METI.md` dan menang atas sepuluh dokumen lain di folder ini.

Penomoran: nomor asli daftar 100 dipertahankan. A, B, C = tiga butir tanpa nomor (pencocokan bisnis, tenaga ahli, bursa kerja). M1 sampai M6 = enam butir bernomor 1 sampai 6 di pesan pemilik (mentor, forum, iuran, tingkat manfaat, klaim profil, lencana).

## A. Yang diputuskan

| No | Keputusan | Alasan |
| --- | --- | --- |
| F1 | 65 butir dikerjakan dalam tiga gelombang, bukan sekaligus. Gelombang 1 = hanya layar dan rumus di atas data yang sudah ada. Gelombang 2 = butuh tabel D1 dan rute Worker baru. Gelombang 3 = bergantung pada hal di luar kode. | Tiap gelombang bisa diuji dan dirilis sendiri; yang paling murah dan paling aman lebih dulu. |
| F2 | 15 butir yang sudah ADA (M4, M5, 20, 25, 30, 31, 34, 35, 36, 37, 38, 46, 50, 68, 73) tidak dibangun ulang. Tiap butir hanya diverifikasi di browser, lalu celahnya (bila ada) dicatat sebagai tiket kecil. | Pemetaan 15 Nov 2026 baru berbasis grep, belum diuji ujung ke ujung. |
| F3 | 38 butir SEBAGIAN diperluas di halaman yang sudah ada, tidak diberi halaman baru, kecuali tertulis lain di PRD. | Aturan pemilik: satu rumah per topik, halaman redundan digabung. |
| F4 | Tidak ada angka bawaan yang dikarang. Tiap konstanta kalkulator diambil dari berkas `public/data/*.json` yang sudah bersumber, atau diisi pengguna. Konstanta tanpa sumber = tiket berhenti dan bertanya. | Aturan pemilik "angka harus benar dan bisa dicek"; K15 tanpa data dummy. |
| F5 | Semua hasil kalkulator baru berlabel Hipotesis atau EST sesuai ALGORITMA induk, dengan Cara menghitung terbuka dan entri di `/metode`. | Konsisten dengan `/indeks`, `/investasi`. |
| F6 | Fitur yang menyimpan data pribadi baru (lamaran kerja, mentor, laporan warga, peserta event) wajib punya baris di KEAMANAN-PRIVASI modul ini sebelum tiketnya dibuka. | KPV induk §1; repo publik. |
| F7 | Fitur yang mengirim pesan ke luar (49, 61, 70) memakai jalur surel yang sudah ada (`src/surel.js`, `/langganan`), dengan persetujuan eksplisit dan tautan berhenti. Tidak ada kanal baru. | Satu jalur keluar, satu daftar berhenti. |
| F8 | Urutan kerja dalam tiap gelombang mengikuti `TIKET.md`. Satu tiket = satu commit, uji hijau, tangkapan 1440 dan 375 terang dan gelap. | AGENTS §5, TIKET induk §1. |

## B. Bertentangan dengan dokumen induk (perlu pemilik)

PRD induk §1.4 masih menulis forum, iuran, pembayaran, notifikasi, dan kiriman otomatis sebagai non-tujuan, sedangkan D20 dan kode Midtrans sudah berjalan. Perintah pemilik 15 Nov 2026 atas butir M2, M3, 49, 59, 61, 70, 87 dibaca sebagai pencabutan non-tujuan itu untuk butir-butir tersebut. Pembaruan teks PRD induk §1.4 dicatat sebagai tiket F65-000 dan dikerjakan pertama.

Butir C (lamaran lewat platform) berlawanan dengan rancangan `/kerja` sekarang, yang sengaja mengalihkan pelamar ke situs organisasi supaya platform tidak menyimpan CV. Lihat C-03.

## C. Pertanyaan terbuka (bawaan dipakai sampai pemilik menjawab)

| No | Pertanyaan | Bawaan | Menahan butir |
| --- | --- | --- | --- |
| C-01 | Payment gateway untuk perpanjangan iuran, stan, dan pasar REC: tetap Midtrans yang sudah terpasang, dan siapa pemegang akunnya? | Midtrans yang ada; mode sandbox sampai pemilik memberi kunci produksi | M3, 59, 87 |
| C-02 | Butir 59 "pasar REC dan karbon sukarela": apakah METI boleh memperantarai transaksi, atau cukup papan minat tanpa uang lewat platform? | Papan minat saja, tanpa pembayaran | 59 |
| C-03 | Lamaran kerja: platform menyimpan CV (data pribadi, butuh masa simpan dan hak hapus), atau cukup formulir minat yang diteruskan ke organisasi? | Formulir minat tanpa unggah CV, diteruskan lewat surel ke pemasang lowongan | C |
| C-04 | Siapa pengelola manusia untuk mentor, forum, lencana verifikasi, laporan warga, dan cek fakta? | Admin METI yang ada; tanpa pengelola yang ditunjuk, butir ini hanya dibangun sampai antrean moderasi | M1, M2, M6, 65, 75 |
| C-05 | Data yang tidak ada di repo: sertifikat tenaga ahli, deret kapasitas per provinsi, RTRW, raster iradiasi dan angin, biaya satuan interkoneksi, tenggat kepatuhan, putusan sengketa, lahan siap proyek, sertifikat TKDN per produk, transkrip podcast. Siapa yang menyediakan, dan lisensinya apa? | Tidak dibangun sampai datanya ada; halaman menulis "data belum tersedia" dengan jujur | B, 22, 26, 27, 41, 53, 54, 58, 62, 72 |
| C-06 | Ringkasan AI per peraturan (48) sudah ditandai "butuh keputusan pemilik" di antarmuka. Diizinkan, dengan label "ringkasan mesin" dan kutipan pasal? | Diizinkan dengan label dan kutipan pasal; tanpa kutipan tidak tampil | 48 |
| C-07 | Ringkasan berita harian (74): isi berita tidak disimpan karena hak cipta. Cukup ringkasan dari judul dan metadata? | Ya, dari judul saja, berlabel jelas | 74 |
| C-08 | Laporan warga (65) butuh pelapor yang belum punya akun, sedangkan seluruh situs wajib masuk (D19). Dibuka formulir publik khusus, atau hanya untuk yang sudah masuk? | Hanya untuk yang sudah masuk | 65 |
| C-09 | Ruang data aman uji tuntas (57): menyimpan dokumen rahasia pihak ketiga di R2 METI. Risiko hukum dan keamanannya diterima? | Ditunda; tidak dibangun sampai dijawab | 57 |
