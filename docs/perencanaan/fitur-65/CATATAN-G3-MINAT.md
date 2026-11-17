# CATATAN G3: papan minat, minat stan, cek fakta, sertifikasi isian sendiri

Dikerjakan 15 Nov 2026. Belum di-commit. Migrasi 0042 hanya diterapkan ke D1 lokal (dua kali, tanpa galat); produksi dan pratinjau tidak disentuh. Tidak ada deploy.

Tiket: F65-303 (butir 59), F65-302 (butir 87), F65-306 (butir 75), F65-307 bagian B. Bawaan yang dipakai: C-01, C-02, C-04 di `KEPUTUSAN.md`.

## 1. Yang dibangun

| Tiket | Rumah | Isi |
| --- | --- | --- |
| F65-303 | `/karbon#minat` (tab ketujuh) | Papan minat beli atau jual REC dan kredit karbon. Ditinjau admin; yang disetujui tampil tanpa akun pengirim. Nama organisasi tampil hanya bila pengirim mencentang DAN organisasi itu klaimnya yang disetujui. Kontak lewat tombol sekretariat dengan nomor minat. Penafian di atas papan. |
| F65-302 | detail acara (`/event/<slug>`), di bawah bagian terkait | Formulir minat stan untuk acara yang punya baris `event_atur`. Tanpa denah, kuota, atau harga. |
| F65-306 | `/isu#fakta` (tab keempat) | Akun mengajukan klaim (kutipan, penutur, tautan sumber https, tanggal). Admin menulis putusan dari empat pilihan dengan penjelasan dan minimal satu tautan sumber https. Hanya klaim yang sudah diputus tampil, berpaginasi 10. |
| F65-307 B | `/profil-saya`, profil anggota (`profil_tampil.js`) | Riwayat "sertifikasi" yang SUDAH ada diperluas: nomor (opsional) dan tautan bukti https (opsional). Label teks "Isian sendiri, belum diverifikasi" selalu tampil di samping tiap sertifikasi. |

Antrean admin: tab Kiriman mendapat tiga jenis baru (Minat REC dan karbon, Minat stan, Cek fakta). Untuk cek fakta tombol "Setujui" diganti "Tulis putusan" yang membuka dialog putusan.

## 2. Tabel dan migrasi

`migrations/0042_minat_fakta.sql`: `minat_unit`, `event_stan`, `cek_fakta`, trigger `event_stan_sah`.

- `minat_unit`: satuan tidak disimpan (REC = MWh, karbon = tCO2e); satu minat aktif per akun per jenis per arah (indeks unik parsial).
- `event_stan`: satu minat aktif per akun per acara; trigger menolak acara tanpa `event_atur`.
- `cek_fakta`: status `disetujui` berarti SUDAH DIPUTUS; CHECK menolak `disetujui` tanpa putusan, penjelasan, dan sumber (larik JSON 1 sampai 5).
- CHECK `diputus_oleh IS NOT NULL` sengaja TIDAK dipakai (berbeda dari 0039 sampai 0041) karena berlawanan dengan `ON DELETE SET NULL`; itu temuan tinjauan keamanan rumpun terakhir G2.

Tidak ada tabel baru untuk sertifikasi: `profil_riwayat` (0018) sudah menyimpan sertifikasi sebagai JSON dengan batas 15 per jenis dan privasi per bagian.

## 3. Rute baru (6) dan perannya

| Rute | Peran |
| --- | --- |
| `GET /api/minat-unit` | akun masuk; hanya yang disetujui |
| `POST /api/minat-unit` | akun masuk; `organisasi_id` (opsional) wajib klaim yang disetujui, selain itu 403 |
| `POST /api/event/:id/stan` | akun masuk; acara tanpa pengaturan = 404 |
| `GET /api/cek-fakta?hal=` | akun masuk; hanya yang sudah diputus |
| `POST /api/cek-fakta` | akun masuk |
| `POST /api/admin/cek-fakta/:id` | admin, super; hanya dari status menunggu (409) |

Tarik, antrean, dan tolak memakai rute kiriman yang ada (`DELETE /api/kiriman/:jenis/:id`, `GET /api/admin/kiriman`, `POST /api/admin/kiriman/:jenis/:id`) dengan jenis `unit`, `stan`, `fakta`. `setuju` biasa atas `fakta` ditolak 422 di rute dan di `hak.kirimanPutus`.

Sertifikasi: tidak ada rute baru; `POST` dan `PUT /api/profil/saya/riwayat` menerima `nomor` dan `bukti_url`.

## 4. hak.js

- Baris MATRIKS baru: `minat_unit`, `event_stan`, `cek_fakta` (publik `-`, akun masuk `T daftar`, admin dan super `T`), dicerminkan di `tests/hak.test.mjs` dan matriks KEAMANAN-PRIVASI induk.
- Peta `KIRIMAN` mendapat `unit`, `stan`, `fakta`. Sifat baru per jenis: `batas: true` (paling banyak 5 menunggu per akun, atomik dalam satu pernyataan; foto dan laporan pindah ke sifat yang sama), `klaim: "opsional"` (klaim diperiksa hanya bila `organisasi_id` diisi), `tarik` (klaim cek fakta hanya bisa ditarik selama menunggu).
- Fungsi baru: `unitDaftar`, `faktaDaftar`, `faktaPutus` (memvalidasi ulang putusan; jejak `tinjau`).
- Batas laju: kunci `koreksi:kr<akun>` yang sudah ada (20 per jam), tidak ada nilai `aksi` baru.

## 5. Enum

`public/inti/minat_enum.js` dipakai layar dan Worker: `REC_TEK` (kode teknologi di `proyek.json` tanpa nuklir dan penyimpanan), `REG_KARBON` (kelas registri di `karbon_registri.json`), `PUTUSAN`. Uji menagih kecocokannya dengan data.

## 6. Uji

`tests/minat.test.mjs`, 9 uji lewat `worker.fetch` di D1 lokal nyata:

- migrasi dua kali; enum cocok dengan data; sel matriks; tamu 401; putusan oleh bukan admin 403
- validasi murni (enum, rentang, tautan https tanpa userinfo, tanggal nyata dan tidak di masa depan, tanpa surel atau telepon, kunci asing ditolak)
- papan minat: menunggu tidak tampil; ganda 409; kolom yang keluar persis sembilan dan tanpa nama pengirim; organisasi bukan klaimnya 403; tarik milik orang lain 404; jejak
- stan: acara tanpa pengaturan 404; trigger; ganda 409; batas 5 menunggu; antrean oleh bukan admin 403; HTML tersimpan sebagai teks
- cek fakta: menunggu tidak tampil; setuju biasa 422; putusan tanpa sumber atau sumber http 422; CHECK D1 menolak; putusan ulang 409; kolom yang keluar tanpa pengaju; yang diputus tidak bisa ditarik
- layar: kolom teks pengguna tidak pernah disisipkan tanpa `esc`
- sertifikasi: nomor dan bukti tersimpan dan terbaca akun lain; tautan tak aman dan isian terlalu panjang 422; label ada di dua layar dan dua bahasa

`npm run uji` penuh: 2.472 uji, 2.464 lulus, 0 gagal.

## 7. Dilihat di layar (1440 terang, 390 gelap)

- `/karbon#minat`: minat dikirim lewat formulir, disetujui, tampil di papan sebagai "No. 1 Beli REC 15.000 MWh, klaim pengirim, Tidak ditampilkan". Versi EN dilihat.
- `/isu#fakta`: klaim dikirim lewat formulir; menunggu tidak tampil; setuju biasa 422; putusan tanpa sumber 422; sesudah diputus tampil dengan pil putusan, penjelasan, dan sumber; tag `<b>` di kutipan tampil sebagai teks. Versi EN dilihat.
- detail acara golf lokal: minat stan dikirim lewat formulir; tag `<i>` tampil sebagai teks; formulir hilang selama ada minat aktif.
- `/admin` tab Kiriman: sepuluh segmen jenis; antrean stan dan cek fakta; dialog "Putusan cek fakta" dibuka dan menolak simpan tanpa penjelasan dan sumber.
- `/profil-saya`: sertifikasi menampilkan "No. UJI-001", label "Isian sendiri, belum diverifikasi", dan tautan bukti.

Semua tanpa galat konsol baru, gulir horizontal, atau kunci mentah. Data uji yang saya buat di D1 lokal (satu minat, dua klaim, satu minat stan, satu sertifikasi) sudah dihapus lagi.

## 8. Dipersempit, dan alasannya

- Papan minat tanpa harga sama sekali dan tanpa agregat volume: bawaan C-02 (bukan bursa).
- Stan tanpa denah dan tanpa daftar stan yang disetujui untuk umum: tidak ada data denah; minat hanya terlihat pengirim dan admin.
- Antrean stan satu daftar untuk semua acara (slug acara tampil per baris), bukan saringan per acara.
- Cek fakta tanpa penyuntingan putusan sesudah disimpan: putusan keliru harus dibetulkan lewat D1. Tidak ada AI dan tidak ada contoh klaim.
- Sertifikasi tampil di `/profil-saya` dan profil anggota (`GET /api/profil/:id`, sesuai privasi bagian riwayat). TIDAK tampil di halaman orang direktori atau di daftar direktori: klaim orang (`orang_klaim`, 0037) ada, tetapi halaman orang direktori dirakit dari potret statis dan tidak membaca profil akun. Menyambungkannya butuh keputusan soal privasi (sertifikasi isian sendiri muncul di data publik direktori).
- Tidak ada unggahan dokumen sertifikat (sesuai arahan).

## 9. Belum jadi atau belum diverifikasi

- Tolak dan tarik untuk tiga jenis baru hanya terbukti lewat uji integrasi, tidak diklik di layar; menyimpan putusan lewat dialog admin juga tidak diklik (putusan disimpan lewat API dari halaman; dialognya dibuka dan validasinya dilihat).
- Centang "Tampilkan nama organisasi saya" tidak dicoba di layar (hanya lewat uji integrasi).
- Tampilan EN untuk stan, admin, dan profil tidak dilihat.
- Pemeriksa keamanan terpisah belum dijalankan atas rumpun ini.
- `EVENT_RAHASIA` tidak tersentuh rumpun ini (tidak ada token baru).
