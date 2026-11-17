# CATATAN G2 KIRIMAN: F65-205 sampai F65-208

Dikerjakan 15 Nov 2026. Belum di-commit. Migrasi baru hanya diterapkan ke D1 lokal; produksi dan pratinjau tidak disentuh.

## 1. Tabel (migrasi `0039_kiriman.sql`, idempoten)

| Tabel | Isi | Penjaga di D1 |
| --- | --- | --- |
| `akademi_nilai` | nilai kuis terbaik per akun per modul; `modul` = id modul akademi atau `rekaman:<id video>` | PRIMARY KEY (`akun_id`, `modul`); CHECK persen 0 sampai 100 |
| `kuis_rekaman` | bank soal satu rekaman sebagai JSON, diisi admin | PRIMARY KEY `rekaman_id`; `json_valid`; panjang maksimal 12.000 |
| `proyek_foto` | foto tonggak: organisasi klaim, proyek, kunci R2, tipe, ukuran, keterangan, status | CHECK status dan tipe; putusan wajib punya pemutus; tolak wajib beralasan |
| `permintaan_hijau` | minat listrik hijau: perusahaan, provinsi, MWh per tahun, tahun mulai | indeks unik parsial: satu kiriman aktif per akun |
| `proyek_dana` | kebutuhan dana: organisasi klaim, proyek, jumlah, mata uang, jenis, uraian | indeks unik parsial: satu kiriman aktif per akun per proyek |

Status tiga tabel kiriman: `menunggu`, `disetujui`, `ditolak`, `ditarik`.

## 2. Baris MATRIKS baru (`src/hak.js`, dicerminkan di `tests/hak.test.mjs` dan KEAMANAN-PRIVASI induk §1)

`akademi_nilai`, `proyek_foto`, `permintaan_hijau`, `proyek_dana`: publik `-`; anggota, pengurus, kurator, wilayah `T daftar`; admin dan super `T`. Pola baris `keyakinan` dan `surel_minta`. Tinjau dan bank soal dijaga `gerbangAdm` (admin, super).

## 3. Rute

| Rute | Peran | Isi |
| --- | --- | --- |
| `GET /api/akademi/nilai` | akun masuk | nilai miliknya, jumlah lulus, tautan sertifikat bila semua modul lulus |
| `POST /api/akademi/kuis` | akun masuk | `{modul, jawaban}`; server menilai terhadap `akademi.json`, menyimpan yang terbaik |
| `GET /api/akademi/sertifikat/:token` | publik, batas laju per IP | hanya `nama`, `modul`, `tanggal` |
| `GET /api/kuis/:rekaman` | akun masuk | soal tanpa kunci jawaban; kosong bila rekaman tanpa bank soal |
| `POST /api/kuis/:rekaman` | akun masuk | `{jawaban}`; balasan memuat nilai dan kunci |
| `GET`, `PUT /api/admin/kuis/:rekaman` | admin, super | baca dan simpan bank soal; daftar kosong menghapus |
| `GET /api/kiriman/saya` | akun masuk | kiriman miliknya di tiga jenis, dan organisasi yang klaimnya disetujui |
| `DELETE /api/kiriman/:jenis/:id` | akun masuk, hanya miliknya | tarik; foto ikut dihapus dari R2 |
| `GET /api/proyek/:id/foto` | akun masuk | foto yang disetujui untuk proyek itu |
| `POST /api/proyek/:id/foto` | akun berklaim organisasi yang disetujui | badan mentah gambar, `?organisasi=&keterangan=` |
| `GET /api/proyek-foto/:fid` | akun masuk | berkas; menunggu dan ditolak hanya pengirim dan admin |
| `GET`, `POST /api/permintaan-hijau` | akun masuk | agregat per provinsi; kirim minat |
| `GET /api/proyek-dana` | akun masuk | kebutuhan dana yang disetujui |
| `POST /api/proyek/:id/dana` | akun berklaim organisasi yang disetujui | kirim kebutuhan dana |
| `GET /api/admin/kiriman` | admin, super | antrean per jenis dan status, berpaginasi |
| `POST /api/admin/kiriman/:jenis/:id` | admin, super | `{aksi: setuju atau tolak, alasan}`; hanya dari menunggu |

Halaman baru: `/sertifikat/a/<token>` memakai `sertifikat_v.html` dan `sertifikat_v.js` yang sama dengan sertifikat acara.

## 4. Keputusan

- **Nilai dihitung server.** Rute menerima jawaban, bukan angka. Badan yang memuat `persen` ditolak 422. Bank soal akademi diimpor Worker dari `public/data/akademi.json` (27 KB), dinilai dengan `nilaiKuis` yang sama dengan layar.
- **Sertifikat akademi.** Token `<id akun>.<32 hex>`, HMAC berawalan `akad|`, rantai rahasia sama dengan sertifikat acara. Sah hanya bila enam modul lulus di akun; kuis rekaman tidak ikut dihitung. Salah bentuk, akun tak aktif, dan belum lulus semua membalas 404 seragam.
- **Kuis rekaman.** Tanpa bank soal, layar tidak menampilkan apa pun ke anggota. Kunci jawaban tidak pernah keluar lewat `GET`; baru dikirim sebagai balasan sesudah menjawab.
- **Pemilik proyek.** Siapa pun yang punya klaim organisasi berstatus `setuju` di portal boleh mengirim foto dan kebutuhan dana, atas nama organisasi itu, untuk proyek mana pun. Server tidak memeriksa apakah organisasi itu tercatat sebagai pihak proyek: daftar pihak ada di `public/data/proyek.json` (565 KB) dan tidak dimuat Worker. Admin melihat organisasi dan proyeknya di antrean dan memutus.
- **Foto.** Layar menggambar ulang gambar ke kanvas (paling panjang 1.600 px, WebP) sehingga EXIF dan GPS hilang; server tetap menolak gambar bermetadata, tipe palsu (magic byte), dan ukuran di atas 5 MB. Kunci R2 `proyek-foto/<32 hex>.<ext>` dibuat server. Klaim diperiksa sebelum badan dibaca, jadi akun tanpa klaim tidak bisa menulis ke R2. Berkas disajikan dengan `nosniff` dan CSP `sandbox`.
- **Minat listrik hijau.** Ambang agregat `N_MIN_HIJAU = 3`. Provinsi di bawah ambang tidak keluar sama sekali. Nama perusahaan dan catatan hanya terlihat pengirim dan admin.
- **Kebutuhan dana.** Layar menulis "klaim pengirim, bukan data Direktori METI dan bukan penawaran efek" di kartu proyek dan di daftar `/investasi`; penafian halaman investasi yang lama tetap ada. Tanpa surel atau telepon: `teks()` portal menolak keduanya di uraian. Tombol minat membuka kotak pesan ke sekretariat yang sudah ada; pesan antar-pengguna tidak ada di platform ini.
- **Satu alur untuk tiga tabel.** `kirimanBuat`, `kirimanSaya`, `kirimanTarik`, `kirimanAntrean`, `kirimanPutus` di `hak.js` memakai peta tetap nama tabel dan kolom; tidak ada nama tabel dari masukan.
- **Batas laju.** `koreksi:ak<akun>` (akademi dan kuis, 120 per jam), `koreksi:kr<akun>` (kiriman, 20 per jam; tarik 60), `koreksi:sa|<ipHash>` (verifikasi publik, 120 per jam). CHECK tabel `laju` tidak diubah.

## 5. Yang dipersempit, dan alasannya

| Diminta | Yang dibuat | Alasan |
| --- | --- | --- |
| Progres lama di peramban ditawarkan dipindah sekali | tidak dipindah; layar menjelaskan bahwa kuis perlu dikerjakan ulang | peramban hanya menyimpan angka nilai, bukan jawaban. Menerima angka itu berarti siapa pun bisa menulis nilai 100 dan mengambil sertifikat |
| Unggah hanya oleh pemilik proyek | oleh akun berklaim organisasi yang disetujui, untuk proyek mana pun, wajib tinjau admin | lihat "Pemilik proyek" di atas |
| Kontak lewat pesan | tombol membuka pesan ke sekretariat | `src/pesan.js` hanya melayani akun ke admin |
| Kuis per rekaman | mesin, rute, dan penyunting soal untuk admin; belum ada satu soal pun | bank soal per rekaman tidak ada di repo dan tidak dikarang; isinya menunggu redaksi |
| Centang langkah akademi ke D1 | tetap di peramban | tidak menentukan sertifikat; hanya nilai kuis yang perlu dipercaya |

## 6. Bukti

- `tests/kiriman.test.mjs`: 18 uji di D1 lokal nyata lewat `worker.fetch`; hanya R2 yang ditiru. Mencakup migrasi dua kali, sel matriks, tamu 401 dan bukan admin 403, nilai dari klien ditolak, nilai terbaik tidak turun, sertifikat sebelum dan sesudah semua lulus, token rusak, kunci jawaban tidak bocor, klaim belum disetujui dan klaim milik orang lain, tipe palsu, EXIF, ukuran lebih, data pribadi di keterangan, berkas tertolak tidak tertinggal di R2, IDOR foto menunggu, tolak tanpa alasan, putusan ganda, IDOR tarik, kiriman ganda, id pemilik dari badan ditolak, agregat di bawah dan di atas ambang, nama perusahaan tidak bocor, antrean tanpa surel, CHECK di D1.
- `tests/e2e/cakupan.json`: 18 rute terdaftar dengan peran benar dan salah; rute publik beralasan.
- `npm run uji`: 2.318 uji, 2.310 lulus, 0 gagal.
- Layar di server lokal (1440 terang dan 390 gelap, akun uji): foto dan kebutuhan dana dikirim lewat formulir di `/p/pj_0002`; admin menyetujui lewat tab Kiriman; foto dan dana tampil di profil proyek dan `/investasi`; minat listrik hijau dikirim di `/pasar-listrik-hijau`; nilai akademi tercatat dan sertifikat terbuka di `/sertifikat/a/<token>`; admin mengisi dua soal di `/video/<id>` lalu kuis dikerjakan. Tanpa galat konsol, tanpa gulir horizontal, tanpa kunci i18n mentah.

## 7. Belum

- Migrasi 0039 belum diterapkan ke produksi dan pratinjau (dijalankan pemilik).
- Klaim organisasi akun uji disetujui langsung di D1 lokal, karena admin tidak bisa menyetujui klaimnya sendiri dan hanya ada satu akun uji yang bisa masuk. Alur setuju klaim lewat layar tidak diulang di sini.
- Penolakan dan penarikan hanya terbukti lewat uji integrasi, tidak diklik di layar.
- Tampilan bahasa Inggris tidak dilihat di layar; kuncinya ada dan gerbang kesetaraan lulus.
- Halaman sertifikat akademi untuk tamu hanya dicek status HTTP (halaman 200, API 200, token rusak 404), bukan tampilannya.
- Agregat listrik hijau di atas ambang hanya terbukti lewat uji; di layar lokal baru satu kiriman.
- D1 lokal kini memuat data uji: satu klaim organisasi, satu foto dan satu kebutuhan dana berstatus disetujui di `pj_0002`, satu minat listrik hijau menunggu, enam nilai akademi dan satu nilai kuis rekaman milik akun uji. Soal kuis uji sudah dihapus.
- Lencana hitungan antrean Kiriman di sisi admin belum ada (`/api/admin/ringkas` tidak disentuh).
