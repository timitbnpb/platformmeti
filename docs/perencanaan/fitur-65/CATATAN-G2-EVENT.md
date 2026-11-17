# CATATAN G2 EVENT: F65-201 sampai F65-204

Dikerjakan 15 Nov 2026. Belum di-commit. Migrasi baru hanya diterapkan ke D1 lokal; produksi dan pratinjau tidak disentuh.

## 1. Tabel (migrasi `0038_event_hadir.sql`, idempoten)

| Tabel | Isi | Penjaga di D1 |
| --- | --- | --- |
| `event_hadir` | satu baris per pendaftaran yang hadir: `daftar_id` (PRIMARY KEY), `event_id`, `hadir_pada`, `oleh` | trigger `event_hadir_sah`: pendaftaran harus aktif dan milik acara itu |
| `event_tutup` | acara yang sudah ditutup admin: `event_id` (PRIMARY KEY), `ditutup`, `oleh` | baris dihapus = acara dibuka lagi |
| `event_survei` | empat butir skala 1 sampai 5, PRIMARY KEY (`event_id`, `akun_id`) | trigger `event_survei_sah` (hadir dan acara ditutup), `event_survei_tetap` (tidak bisa diubah) |

Tiket dan sertifikat tidak disimpan: keduanya token HMAC yang dihitung server dari baris `event_daftar`.

## 2. Rute (semua di `src/event.js`)

| Rute | Peran | Isi |
| --- | --- | --- |
| `GET /api/event/:id/tiket` | akun masuk, hanya miliknya | kode tiket, jam hadir, status tutup, tautan sertifikat bila sudah berhak, status survei |
| `POST /api/event/:id/hadir` | admin, super | `{kode}`; dicatat sekali; pindai kedua mengembalikan jam pertama dengan `baru: false` |
| `PUT /api/event/:id/tutup` | admin, super | `{tutup: true atau false}` |
| `GET /api/event/sertifikat/:token` | publik, batas laju per IP | hanya `acara`, `tanggal`, `nama` |
| `POST /api/event/:id/survei` | akun masuk, hadir, acara ditutup, sekali | empat butir bulat 1 sampai 5 |
| `GET /api/event/:id/laporan` | admin, super | agregat pendaftaran, hadir, survei, kunjungan; tanpa baris per orang |

Halaman baru: `/sertifikat/v/<token>` (`public/sertifikat_v.html`, `sertifikat_v.js`), terbuka tanpa sesi hanya pada bentuk token yang sah.

## 3. Keputusan

- **Token.** `<id pendaftaran>.<32 hex>`, HMAC atas `id|acara|waktu daftar`, kunci server berawalan `tiket|` atau `sert|` sehingga kode tiket tidak bisa dipakai sebagai tautan sertifikat. Rahasia: `EVENT_RAHASIA`, lalu jatuh ke `KTA_RAHASIA`, `ICS_RAHASIA`, `IP_SALT` seperti KTA. Token selalu di jalur URL. Banding waktu tetap; bentuk salah, id tak ada, HMAC salah, acara lain, dan pendaftaran batal semuanya 404 seragam.
- **Hadir sekali.** `INSERT OR IGNORE` pada PRIMARY KEY, satu pernyataan. Uji menjalankan dua pindai bersamaan dan memeriksa tepat satu yang `baru`.
- **Sertifikat sah** bila token cocok, pendaftaran aktif, tercatat hadir, dan acara ditutup. Acara dibuka lagi = sertifikat mati sampai ditutup kembali.
- **Survei.** Ambang agregat memakai `N_MIN_KEYAKINAN` (5), sama dengan survei keyakinan. Jejak hanya mencatat bahwa akun menjawab, bukan nilainya.
- **Galat.** Memakai kode katalog yang ada: 404 `tidak_ditemukan`, 403 `dilarang`, 409 `konflik`, 422 `masukan_salah`, 429 `laju_terlampaui`, 503 `fitur_belum_aktif` bila migrasi belum diterapkan.
- **Batas laju.** Rute bersesi memakai `kurasi:ev<akun>` yang sudah dipakai modul event; rute publik memakai `koreksi:sv|<ipHash>` 120 per jam, pola KTA. CHECK tabel `laju` tidak diubah.
- **Daftar peserta admin** kini memuat `hadir_pada`. Bila migrasi 0038 belum diterapkan, kueri jatuh ke bentuk lama, jadi daftar peserta produksi tidak putus sebelum pemilik menjalankan migrasi.

## 4. Yang dipersempit, dan alasannya

| Diminta | Yang dibuat | Alasan |
| --- | --- | --- |
| Baris MATRIKS baru per sumber daya | tidak ada baris baru; tiket, hadir, dan survei peserta mengikuti sel `event_daftar`, pencatatan hadir, tutup, dan laporan mengikuti sel `event_atur` | tabel baru tidak menambah jenis data; baris baru berarti mengubah salinan tangan KPV §1 di `tests/hak.test.mjs` dan dokumen keamanan induk, yang butuh persetujuan pemilik |
| Kolom `hadir_pada` di `event_daftar` dengan `UPDATE` bersyarat | tabel `event_hadir` dengan `INSERT OR IGNORE` | `ALTER TABLE ADD COLUMN` tidak bisa idempoten di SQLite (catatan migrasi 0012); atomisitasnya sama |
| Pemindai QR `BarcodeDetector` | tidak dibuat; kode diketik atau dibaca pemindai genggam | `public/_headers` memasang `Permissions-Policy: camera=()` untuk seluruh situs; membuka kamera berarti melonggarkan header keamanan |
| Sertifikat memakai perender kartu KTA | halaman verifikasi dengan tata letak verifikasi KTA (`kta.css`) dan tombol cetak peramban | kartu KTA berbentuk kartu anggota; sertifikat cukup pernyataan hadir yang bisa dicetak. QR tiket memakai `qrSvg` yang sudah ada di `event_umum.js` |
| Laporan jangkauan sponsor | kunjungan halaman acara 30 hari terakhir untuk SEMUA acara bersama, dengan kalimat batasnya di layar | `lalin.jalurBersih` menyimpan semua `/event/<slug>` sebagai `/event/*`, jadi kunjungan per acara tidak pernah dicatat; klik ke sponsor juga tidak pernah dicatat |

## 5. Perbaikan di luar tiket

- `public/admin.js`: penangan submit dialog akun memproses SEMUA formulir di dialog bersama, sehingga formulir modul lain (termasuk pengaturan event yang lama) ikut mengirim `PATCH /api/admin/akun/undefined` dan membalas 422. Sekarang hanya `dForm` dan `nForm` yang diproses.
- `public/kta.css`: kepala situs tampil tanpa gaya di halaman verifikasi (KTA dan sertifikat) karena `kepala.css` tidak dimuat di sana; kepala disembunyikan di halaman itu.

## 6. Bukti

- `tests/event-hadir.test.mjs`: 11 uji integrasi di D1 lokal nyata lewat `worker.fetch` (token salah, token acara lain, pindai ganda dan bersamaan, pendaftaran batal, sertifikat sebelum dan sesudah tutup, kode tiket dipakai sebagai token sertifikat, survei ganda, survei oleh yang tidak hadir, agregat di bawah dan di atas ambang, laporan tanpa data per orang, migrasi dijalankan dua kali).
- `tests/e2e/cakupan.json`: enam rute terdaftar dengan peran benar dan salah; rute publik beralasan.
- Layar (server lokal, akun uji, acara golf): daftar, tiket ber-QR, admin mencatat hadir (kode salah, benar, ulang), tutup acara, sertifikat lewat API dan halaman tanpa sesi, survei diisi lewat formulir.

## 7. Belum

- Migrasi 0038 belum diterapkan ke produksi dan pratinjau (dijalankan pemilik).
- `EVENT_RAHASIA` belum dipasang sebagai secret; sebelum itu token memakai rahasia KTA atau `IP_SALT`.
- Halaman sertifikat hanya dilihat dengan sesi aktif; untuk tamu yang terbukti adalah status HTTP 200 halaman, aset, dan API, bukan tampilannya.
- Kunjungan per acara dan klik sponsor butuh perubahan pencatatan statistik (`src/lalin.js`), di luar tiket ini.
- Tampilan bahasa Inggris tidak dilihat di layar.
- D1 lokal sekarang memuat data uji saya di acara golf: satu pendaftaran akun uji, satu hadir, acara berstatus ditutup, satu jawaban survei.
