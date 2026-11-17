# CATATAN G3: ringkasan mesin per peraturan, rekap judul harian, perpanjangan iuran

Dikerjakan 15 Nov 2026. Belum di-commit. Migrasi 0043 hanya diterapkan ke D1 lokal (dua kali, tanpa galat); produksi dan pratinjau tidak disentuh. Tidak ada deploy.

Tiket: F65-304 (butir 48), F65-305 (butir 74), F65-301 (butir M3), ditambah tiga perbaikan tinjauan keamanan rumpun minat. Bawaan yang dipakai: C-01, C-06, C-07 di `KEPUTUSAN.md`.

**Binding AI dan Midtrans tidak pernah dipanggil**, tidak dari uji, tidak dari server lokal, tidak dari alat verifikasi layar. Ringkasan AI sungguhan dan pembayaran sungguhan belum pernah dijalankan sekali pun.

## 1. Yang dibangun

| Tiket | Rumah | Isi |
| --- | --- | --- |
| F65-304 | Pustaka hukum, tampilan dokumen (`/regulasi#hd=<id>`) | Kartu "Ringkasan mesin": butir pendek, tiap butir dengan tombol pasal sumbernya (melompat ke teks pasal), pil dan penafian bukan nasihat hukum, nama model, tanggal dibuat, dan "dirangkum dari n dari N pasal". Tanpa ringkasan: akun biasa tidak melihat apa pun; admin dan super melihat tombol "Buat ringkasan mesin" hanya bila binding AI tersedia. |
| F65-305 | `/berita`, kartu "Rekap judul harian" di atas bagian analisis | Judul hari terbaru di data (tanggal WIB, minimal 3 judul), dikelompokkan menurut kamus isu yang sudah ada. Tiap judul menaut ke sumbernya. Tanpa hari yang cukup judul, kartu tidak tampil. |
| F65-301 | `/kta` (bagian "Perpanjang keanggotaan") dan `/admin?tab=kta` (antrean bukti) | Perpanjangan mandiri lewat bukti transfer yang ditinjau admin, dan lewat Midtrans bila kuncinya terpasang. Bukti pembayaran yang bisa dicetak untuk pembayaran lunas. |

## 2. F65-304: cara kerja dan batas

- Sumber hanya segmen berjenis `pasal` dari `hukum_segmen` (menimbang, mengingat, lampiran tidak dikirim). Tiap pasal dipotong 1.200 huruf; total dikirim paling banyak 14.000 huruf; pasal berikutnya tidak dikirim dan layar menulis berapa dari berapa pasal yang dirangkum.
- Teks pasal diperlakukan sebagai data: penanda `[PASAL n]` dibuat server, penanda serupa di dalam teks pasal atau judul dinetralkan, dan pesan sistem melarang mengikuti instruksi di dalam pasal.
- Keluaran model tidak dipercaya (`src/ringkas_pasal.js`, `saringButir`). Sebuah butir hanya lolos bila: panjang 20 sampai 400 huruf; mengutip 1 sampai 4 pasal; SEMUA pasal yang dikutip benar-benar dikirim; tiap angka di kalimat (selain nomor pasal) tertulis di teks pasal yang dikutip. Yang lain dibuang dan dihitung. Paling banyak 8 butir.
- Tanpa butir yang lolos: tidak ada yang disimpan, tidak ada teks model yang keluar, layar menulis penyebabnya.
- Tembolok: tabel `hukum_ringkas`, satu baris per dokumen, dengan `versi` = "jumlah pasal:jumlah huruf pasal". Bila teks pasal berubah, ringkasan lama tidak tampil lagi. Panggilan buat untuk dokumen yang temboloknya masih cocok tidak memanggil AI.
- Yang boleh membuat: hanya admin dan super (`perlu(p, ADM)` di rute, `gerbangAdm` di hak.js). Plafon: 20 per admin per jam (`ringkasan-ai:hk<akun>`) dan **60 per 24 jam untuk seluruh situs** (`ringkasan-ai:rp-semua`). Keduanya diperiksa SEBELUM AI dipanggil; tidak ada nilai `aksi` laju baru.
- Model: `@cf/meta/llama-3.3-70b-instruct-fp8-fast`, sama dengan "Tanya data" dan tanya hukum.
- Teks `dir.riset.ringkas_tunda` ("Butuh keputusan pemilik") di direktori adalah fitur lain (ringkasan riset) dan tidak diubah.

## 3. F65-305: penyempitan yang disengaja

Ringkasan berita dari judul saja tidak bisa ditulis model tanpa mengarang isi berita, dan isi berita memang tidak disimpan (hak cipta). Jadi yang dibangun adalah **pengelompokan judul yang deterministik, tanpa AI dan tanpa kalimat buatan** (`rekapHarian` di `public/berita_kamus.js`): dihitung di peramban dari data yang sudah dimuat, tanpa rute, tanpa tabel, tanpa cron. Label di layar: "Dikelompokkan mesin dari judul" dan "Bukan ringkasan isi berita".

Batas yang terlihat di data sekarang: kamus isu hanya 15 kata kunci, sehingga pada hari terbaru (7 Nov 2026) 8 dari 10 judul masuk kelompok "Lainnya". Memperbaikinya berarti memperluas kamus isu, dan itu pekerjaan redaksi.

## 4. F65-301: cara kerja dan batas

- **Siapa yang bisa memperpanjang sendiri:** hanya KTA berjenis `individu` dan `utama`, karena hanya dua itu yang punya padanan tunggal ke kategori tarif tahunan di `public/data/keanggotaan.json` (Rp 350.000 untuk individu). KTA `biasa` (perusahaan, organisasi, koperasi) terbagi tiga kategori tarif dan jenisnya tidak tercatat di KTA; `luar biasa` dan `kehormatan` tidak punya tarif. Untuk ketiganya bagian perpanjangan tidak tampil; jalur admin (`adm.kta.a.perpanjang`) tetap jalan.
- **Jumlah** selalu dihitung server: `hak.iuranBuat` membaca jenis KTA dari D1 lalu memanggil fungsi tarif. Badan permintaan `bayar-online` diabaikan seluruhnya.
- **Lunas** (`batchLunas` di hak.js): satu batch D1. Tandai lunas hanya dari status menunggu; KTA diperpanjang setahun dari tanggal habis lama, atau dari hari ini bila sudah lewat; masa berlaku baru dicatat di pembayaran; jejak. Tiap langkah hanya jalan bila langkah sebelumnya mengubah baris, jadi notifikasi berulang atau persetujuan ganda tidak memperpanjang dua kali.
- **Midtrans:** tanpa `MIDTRANS_SERVER_KEY` rute `POST /api/iuran/bayar-online` membalas 503 `fitur_belum_aktif` dan `GET /api/iuran` mengembalikan `online: false`, sehingga tombol "Bayar online" tidak dirender. Notifikasi masuk lewat rute yang SUDAH ada (`/api/daftar/midtrans/notifikasi`, satu URL per akun Midtrans): sesudah tanda tangan diverifikasi, pesanan berawalan `IU-` dicabangkan ke `notifikasiIuran`. Jumlah di notifikasi dicocokkan dengan jumlah di D1.
- **Bukti transfer:** berkas mentah (JPEG, PNG, WEBP, PDF; tipe dari magic byte; 5 MB), kunci R2 dibuat server, satu bukti menunggu per akun (indeks unik parsial), disajikan dengan CSP sandbox hanya untuk pemilik dan admin. Jalur ini baru tampil bila admin sudah mengisi rekening di pengaturan pendaftaran.
- **Bukti pembayaran:** dialog di `/kta` dengan tombol cetak (gaya cetak CSS, tanpa pustaka PDF). Nomor `IUR-<tahun>-<id 6 digit>`. Ditulis sebagai "bukti pembayaran iuran, bukan faktur pajak": data pajak METI (NPWP, status PKP) tidak ada di repo, jadi bentuk faktur pajak menunggu pemilik.

## 5. Tabel, rute, matriks

`migrations/0043_ringkas_iuran.sql`: `hukum_ringkas`, `iuran_bayar` (dua indeks dan satu indeks unik parsial), trigger `event_stan_belum_tutup`.

| Rute | Peran |
| --- | --- |
| `GET /api/hukum/ringkasan?id=` | akun masuk |
| `POST /api/hukum/ringkasan` | admin, super |
| `GET /api/iuran` | akun masuk; hanya miliknya |
| `POST /api/iuran/bayar-online` | akun masuk; 503 tanpa kunci Midtrans |
| `POST /api/iuran/bukti` | akun masuk |
| `GET /api/iuran/:id/bukti` | pemilik atau admin, super; selain itu 404 |
| `GET /api/iuran/:id/bukti-bayar` | pemilik, hanya yang lunas; selain itu 404 |
| `GET /api/admin/iuran` | admin, super |
| `POST /api/admin/iuran/:id` | admin, super; hanya dari menunggu (409) |

Tidak ada rute publik baru dan `API_PUBLIK` tidak diubah.

Baris MATRIKS baru: `hukum_ringkas` (`- B B B B T T`) dan `iuran_bayar` (`- T daftar ... T T`), dicerminkan di `tests/hak.test.mjs` dan matriks KEAMANAN-PRIVASI induk.

## 6. Tiga perbaikan tinjauan keamanan rumpun minat

| No | Temuan | Status |
| --- | --- | --- |
| 1 | Minat stan bisa dikirim ke acara yang sudah ditutup | Benar. Rute menolak 404 seragam (`hak.eventSudahTutup`) dan trigger baru `event_stan_belum_tutup` di 0043. "Ditutup" diartikan acara sudah ditutup admin (`event_tutup`), bukan pendaftaran belum dibuka, karena minat stan wajar dikirim sebelum pendaftaran peserta dibuka. |
| 2 | Batas riwayat profil tidak atomik | Benar. `profilRiwayatTambah` kini satu pernyataan `INSERT ... SELECT ... WHERE (SELECT COUNT(*)) < MAKS_RIWAYAT`; jejak hanya bila tersimpan. |
| 3 | Nama organisasi tetap tampil sesudah klaim dicabut | Benar. `unitDaftar` mengeluarkan `organisasi_id` hanya bila klaim pengirim atas organisasi itu masih berstatus setuju. |

## 7. Uji

- `tests/ringkas_pasal.test.mjs` (9): migrasi dua kali; pemilihan pasal dan netralisasi penanda; penyaring butir; peran; keluaran tanpa kutipan sah; tembolok; teks berubah; plafon dan laju sebelum AI; penjaga statis (berkas yang memanggil `AI.run` harus terdaftar, urutan laju lalu plafon lalu AI). `env.AI` ditiru dan mencatat tiap panggilan.
- `tests/iuran.test.mjs` (7): tarif; peran dan keadaan tanpa kunci; bukti transfer; tinjau admin; KTA lewat; Midtrans tiruan (jumlah dari server, tanda tangan salah, jumlah beda, pending, lunas sekali, pesanan gagal); penjaga statis. `fetch` global ditiru dan hanya menjawab URL Snap sandbox.
- `tests/tinjauan-minat.test.mjs` (3): tiga perbaikan di atas.
- `tests/berita-analisis.test.mjs` (+1): rekap judul harian.

## 8. Yang belum jadi atau belum diverifikasi

- Ringkasan AI sungguhan belum pernah dibuat: mutu, panjang, dan apakah model mematuhi skema belum diketahui. Server lokal punya binding AI (tombol "Buat ringkasan mesin" tampil bagi admin); tombol itu tidak ditekan.
- Pembayaran Midtrans sungguhan, termasuk bentuk notifikasi nyata dan halaman bayar, belum pernah dijalankan. `.dev.vars` tidak punya kunci Midtrans.
- Unggah bukti lewat layar tidak diklik (R2 lokal tidak dicoba); alurnya terbukti lewat uji integrasi dengan R2 tiruan. Tombol cetak tidak ditekan.
- Bukti transfer yang ditolak tidak dihapus dari R2 (bukti pembayaran mungkin perlu disimpan; keputusan pemilik).
- Pengguna tidak bisa menarik bukti yang masih menunggu.
- Tidak ada pengingat bahwa KTA mendekati habis (ALUR §7 langkah 1): surel belum punya pengirim.
