# KEAMANAN-PRIVASI: 65 fitur pilihan pemilik

KEAMANAN-PRIVASI induk menang. Dokumen ini mendaftar data pribadi dan permukaan serangan yang baru (F6). Fitur yang tidak ada di tabel §1 tidak menyimpan data pribadi baru.

## 1. Data pribadi baru

| Butir | Data | Siapa yang melihat | Masa simpan (usulan, perlu pemilik) | Hak pengguna |
| --- | --- | --- | --- | --- |
| 86, 89 | status hadir, jam hadir | pemilik data, admin | selama akun aktif | lihat di `/saya` |
| 90 | jawaban survei | hanya agregat ke admin | agregat permanen; baris mentah tanpa nama | tidak bisa ditautkan balik ke orang |
| 66 | progres kursus | pemilik data | selama akun aktif | hapus progres |
| C | minat lowongan (nama, surel akun) | pemasang lowongan, admin | sampai lowongan tutup | tarik kapan saja |
| M1 | permintaan mentor | mentor yang dituju, admin | sampai selesai | tarik |
| 60 | minat listrik hijau perusahaan | admin; publik hanya agregat | selama relevan | tarik |
| 65 | laporan warga | admin | sesuai tindak lanjut | tarik sebelum ditinjau |
| M3 | riwayat pembayaran | pemilik data, admin | sesuai kewajiban pembukuan | unduh faktur |

Tidak ada CV, KTP, atau dokumen identitas yang disimpan (C-03). Data kartu pembayaran tidak pernah menyentuh Worker; hanya penyedia yang memegangnya.

## 2. Ancaman baru dan penangkalnya

| Ancaman | Penangkal |
| --- | --- |
| Tiket atau sertifikat dipalsukan | token HMAC dengan kunci server, verifikasi waktu tetap; salah = 404 seragam |
| Tiket dipakai dua kali | hadir dicatat sekali secara atomik |
| Unggahan berbahaya (foto tonggak) | magic byte, batas ukuran, kunci R2 dibuat server, disajikan dengan CSP sandbox; pola unggah agenda |
| Spam forum, laporan, minat | batas laju per akun, antrean tinjau, sembunyi oleh admin |
| HTML tersimpan dari kiriman pengguna | semua keluaran lewat `esc`; tidak ada `innerHTML` dari data mentah |
| IDOR pada kiriman | id pemilik dari sesi; tinjau hanya `perlu("admin")` |
| Surel pengingat disalahgunakan | hanya ke akun yang mencentang; plafon harian; tautan berhenti |
| Notifikasi pembayaran palsu | tanda tangan penyedia diverifikasi, seperti alur daftar |
| Keluaran AI menyesatkan (48, 74) | label "ringkasan mesin", kutipan pasal atau judul wajib, tanpa kutipan tidak tampil |
| Kebocoran lewat repo publik | tidak ada kiriman pengguna di `public/data`; semua di D1 |

## 3. Temuan audit 15 Nov 2026 yang masih terbuka dan mengenai modul ini

- Batas laju masuk per surel bisa dipakai mengunci akun orang lain (`src/sesi.js`). Mengubahnya menyentuh KPV induk §4, jadi menunggu keputusan pemilik.
- `/og/orang/<id>.svg` dan `/sematan/orang/<id>` melayani nama, jabatan, organisasi tanpa masuk. Sertifikat (89) tidak boleh mengulang pola ini: verifikasi publik hanya menampilkan sah atau tidak, nama acara, dan nama peserta.
- Token ICS dan token aktivasi berada di query string. Token tiket dan sertifikat ditaruh di jalur atau fragmen, bukan query.
