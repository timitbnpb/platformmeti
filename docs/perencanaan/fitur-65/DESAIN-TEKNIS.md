# DESAIN-TEKNIS: 65 fitur pilihan pemilik

Arsitektur tidak berubah: Cloudflare Worker, aset statis, D1, R2, vanilla JS tanpa build step. DESAIN-TEKNIS induk menang. Nama tabel dan rute di bawah adalah usulan yang dikunci saat tiketnya dibuka; nomor migrasi mengikuti urutan nyata saat itu (terakhir sekarang 0037).

## 1. Gelombang 1: tanpa server

| Tiket | Berkas baru | Berkas disentuh |
| --- | --- | --- |
| F65-101, 102 | tidak ada | `public/banding*.js`, `banding.css`, `i18n/*.json` |
| F65-103 | `public/inti/karbon_rumus.js`, `tests/karbon_rumus.test.mjs` | `public/karbon.js` |
| F65-104 | `public/inti/diesel_rumus.js`, uji | `public/desa-energi.js` |
| F65-105, 106 | fungsi baru di `public/inti/model_keuangan_rumus.js`, uji | `public/model_keuangan.js` |
| F65-107 | tidak ada | `public/keuangan_hijau.js` atau rumah insentif yang berlaku |
| F65-108, 109 | data `public/data/lahan_per_mw.json` (hanya bila bersumber) | `public/izin-kontrak*.js` |
| F65-110 | data `public/data/kewenangan.json` dari pipa hukum | `public/regulasi.js` |
| F65-111 | `public/inti/beda_teks.js`, uji | `public/regulasi.js` |
| F65-112 | tidak ada | `public/wilayah.js`, `peta_lapis.js` |
| F65-113 | data `public/data/janji_kebijakan.json` | `public/rapor.js` |

Tiap berkas data baru didaftarkan di katalog data (`tests/katalog_data.test.mjs`) dengan sumber, tanggal, dan lisensi.

## 2. Gelombang 2: tabel dan rute (usulan)

| Tiket | Tabel D1 | Rute |
| --- | --- | --- |
| F65-201 | kolom `hadir_pada`, `tiket_batal` pada `event_daftar` | `GET /api/event/:id/tiket`, `POST /api/event/:id/hadir` (admin) |
| F65-202 | tidak ada | `GET /api/event/:id/sertifikat`, verifikasi publik bertoken seperti KTA |
| F65-203 | `event_survei_jawab` (pola `keyakinan_jawab`) | `POST /api/event/:id/survei`, `GET /api/admin/event/:id/survei` |
| F65-204 | tidak ada (baca statistik yang ada) | `GET /api/admin/event/:id/jangkauan` |
| F65-205 | `akademi_progres` | `GET, POST /api/akademi/progres`, `GET /api/akademi/sertifikat` |
| F65-206 | `proyek_foto` (status tinjau) | `POST /api/proyek/:id/foto`, tinjau admin |
| F65-207 | `permintaan_hijau` | `POST /api/permintaan-hijau`, agregat publik |
| F65-208 | `proyek_dana` | `POST /api/proyek/:id/dana`, tinjau admin |
| F65-209 | tidak ada (hitung dari profil dan potret) | `GET /api/cocok` |
| F65-210 | perluasan tabel utas konsultasi dengan `bidang` | perluasan rute konsultasi |
| F65-211 | `mentor`, `mentor_minta` | `GET, POST /api/mentor` |
| F65-212 | `kerja_minat` | `POST, DELETE /api/kerja/:id/minat` |
| F65-213 | `lencana` | tinjau admin |
| F65-214 | `laporan_warga` | `POST /api/proyek/:id/laporan`, tinjau admin |
| F65-215, 216 | kolom `kirim_surel` pada tabel ikuti, `surel_draf` | cron harian yang ada (`0 18 * * *`) |

Aturan tetap untuk tiap rute: lewat `src/hak.js` (jalur D1 tunggal), `perlu(...)` untuk peran, id pemilik dari sesi, CSRF `x-pb`, batas laju untuk rute tulis, masukan divalidasi tipe dan panjang, galat dari katalog. Migrasi idempoten (`IF NOT EXISTS`), tidak menyunting migrasi yang sudah jalan.

## 3. Kinerja dan kuota

- Kalkulator dan pembanding berjalan di peramban; nol baca D1.
- Rute agregat (jangkauan, permintaan hijau) dihitung dengan satu query berindeks dan di-cache privat lima menit.
- Cron pengingat membaca hanya yang berubah sejak kiriman terakhir; plafon surel per jalan ditetapkan di tiket.
- Beda pasal dan pencocokan dipecah supaya tidak ada tugas panjang di utas utama (INP).

## 4. Yang sengaja tidak dibuat

Tidak ada mesin antrean baru, tidak ada kerangka formulir baru, tidak ada lapisan abstraksi untuk "kiriman yang ditinjau": tiap tabel memakai kolom `status` yang sama dan fungsi tinjau di `hak.js` yang sudah ada polanya.
