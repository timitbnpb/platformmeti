# ALUR: 65 fitur pilihan pemilik

Hanya alur yang baru. Alur yang sudah ada (masuk, daftar, klaim, konsultasi) mengikuti ALUR induk.

## 1. Kalkulator (39, 40, 42, 43, 44, 45)

1. Pengguna membuka kartu kalkulator di halaman rumahnya.
2. Isian awal kosong atau diisi dari data bersumber; tiap isian bawaan menampilkan sumbernya.
3. Hasil dihitung saat isian berubah, tanpa tombol kirim dan tanpa panggilan server.
4. Hasil berlabel Hipotesis, dengan "Cara menghitung" yang bisa dibuka dan tautan ke `/metode`.
5. Isian tak sah: pesan di bawah kolomnya, hasil sebelumnya tetap tampil.
6. Tautan bagikan membawa isian lewat fragmen URL, bukan query (tidak sampai ke server).

## 2. Pembanding proyek (18)

1. `/banding`, pilih segmen Proyek.
2. Cari dan pilih 2 sampai 4 proyek; pilihan kelima ditolak dengan kalimat penyebab.
3. Tabel berdampingan; baris yang datanya tidak ada ditulis "tidak ada angka", bukan nol.
4. Tautan bagikan memuat id proyek.

## 3. Event: tiket, hadir, sertifikat, survei (86, 89, 90)

1. Pengguna mendaftar event (alur yang ada). Tiket ber-QR muncul di `/saya` dan detail event.
2. Hari acara: admin membuka pemindai di admin event, memindai QR, sistem menandai hadir sekali.
3. QR dipindai dua kali: ditolak dengan jam pindai pertama.
4. Sesudah acara ditutup admin: peserta hadir melihat tombol Sertifikat dan Survei.
5. Sertifikat memuat nama, acara, tanggal, dan QR verifikasi publik seperti KTA.
6. Survei sekali isi per peserta; hasil hanya tampil sebagai agregat ke admin.

Keadaan kosong: belum ada peserta hadir, belum ada jawaban. Keadaan galat: QR bukan milik event ini, tiket dibatalkan.

## 4. Kiriman pengguna yang ditinjau (56, 60, 64, 65, M1, M6, C)

Satu pola untuk semua:

1. Pengguna masuk mengisi formulir di halaman rumah.
2. Kiriman masuk antrean admin dengan status menunggu; pengirim melihat statusnya di `/saya`.
3. Admin menyetujui, menolak dengan alasan, atau meminta perbaikan.
4. Hanya yang disetujui tampil ke pengguna lain.
5. Pengirim bisa menarik kirimannya kapan saja.

## 5. Forum per bidang (M2)

1. `/bidang`, buka satu bidang, tab Diskusi.
2. Buat utas atau balas; batas laju per akun.
3. Laporkan utas; admin menyembunyikan dengan alasan yang tercatat di jejak.

## 6. Pengingat dan buletin (49, 61, 70)

1. Pengguna mengikuti regulasi, sektor, atau putaran lelang, dan mencentang "kirimi saya surel".
2. Cron harian menghitung yang baru sejak kiriman terakhir.
3. 49 dan 61: surel ringkas terkirim, paling banyak satu per hari per akun.
4. 70: rakitan mingguan masuk admin surel sebagai draf; terkirim hanya setelah admin menyetujui.
5. Tiap surel memuat tautan berhenti satu klik.

## 7. Perpanjangan iuran (M3)

1. KTA mendekati habis: pita di `/kta` dan `/saya`.
2. Pengguna memilih perpanjang, membayar lewat penyedia.
3. Notifikasi penyedia terverifikasi tanda tangannya; masa berlaku KTA bertambah.
4. Faktur PDF bisa diunduh di `/kta`.
5. Pembayaran gagal atau kedaluwarsa: status jelas, bisa diulang.
