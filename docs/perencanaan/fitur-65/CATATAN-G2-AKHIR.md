# CATATAN G2 AKHIR: delapan perbaikan tinjauan, F65-213 sampai F65-216

Dikerjakan 15 Nov 2026. Belum di-commit. Migrasi baru hanya diterapkan ke D1 lokal (dua kali, tanpa galat); produksi dan pratinjau tidak disentuh.

## 1. Perbaikan dari tinjauan keamanan

| No | Temuan | Status | Yang diubah |
| --- | --- | --- | --- |
| 1 | Kunci jawaban akademi di `public/data/akademi.json` terbaca semua akun | diperbaiki | `a` dan `cek` dipindah ke `src/akademi_kunci.js` (tidak disajikan). Layar tidak lagi menilai sendiri: `POST /api/akademi/kuis` membalas benar atau salah per soal, dan kunci jawaban hanya bila lulus |
| 2 | Foto menunggu tanpa batas; foto ditolak tidak dihapus dari R2 | diperbaiki | paling banyak 5 foto menunggu per akun, dijaga dalam satu `INSERT ... SELECT ... WHERE` (yang keenam 409, berkasnya tidak tersimpan); foto yang ditolak dihapus dari R2 dan tidak dilayani lagi |
| 3 | Agregat listrik hijau mengeluarkan jumlah MWh tepat | diperbaiki | server hanya mengirim rentang per orde besaran (`mwh_min`, `mwh_maks`); layar menulis alasannya |
| 4 | Antrean admin tidak menampilkan organisasi pengirim | sebagian keliru | antrean sudah menampilkan id organisasi sebagai tautan, bukan namanya. Sekarang tampil nama organisasi, nama proyek, dan pil "tercatat" atau "tidak tercatat sebagai pihak proyek ini" (dari potret proyek dan organisasi) |
| 5 | Kuis rekaman membuka seluruh kunci pada percobaan pertama | diperbaiki | kunci hanya bila lulus; sebelum itu benar atau salah per soal |
| 6 | Antrean laporan forum `LIMIT 200` tanpa paginasi | diperbaiki | urut jumlah laporan lalu yang terbaru, berpaginasi (20 per halaman) di server dan layar; alasan yang tampil kini yang terbaru, bukan terbesar menurut abjad |
| 7 | Kunci laju mentor berbagi jatah dengan kiriman lain | diperbaiki | daftar dan permintaan mentor memakai `koreksi:mt<akun>` |
| 8 | Mentor berakun nonaktif masih tampil | diperbaiki | `mentorDaftar` menyaring `akun.status = 'aktif'`, dengan uji integrasi. `forumDaftar` hanya mengeluarkan nama penulis; tidak diubah |

Batas yang tersisa: kuis tetap bisa ditebak dengan mengulang (empat pilihan, balasan benar atau salah per soal, 120 kiriman per jam). Sertifikat akademi adalah tanda selesai, bukan bukti kompetensi.

## 2. Tabel (migrasi `0041_lencana_laporan_surel.sql`, idempoten)

| Tabel | Isi | Penjaga di D1 |
| --- | --- | --- |
| `lencana` | lencana verifikasi organisasi: jenis (legalitas, sertifikat, proyek), tautan bukti https, uraian, status | satu aktif per organisasi per jenis; putusan wajib punya pemutus; tolak wajib beralasan |
| `laporan_warga` | laporan warga atas proyek: isi teks 20 sampai 1.000, status | satu aktif per akun per proyek |
| `ikuti_surel` | pilihan "kirimi saya surel" per hal yang diikuti | tidak ada baris = mati |
| `surel_penanda` | waktu pengingat terakhir per akun | |
| `surel_draf` | draf buletin per minggu ISO: draf, disetujui, batal | satu per minggu; putusan wajib punya pemutus |
| `surel_antre` | daftar surel yang akan dikirim; tanpa alamat surel | `kunci` unik; trigger menolak buletin dari draf yang belum disetujui atau ke pelanggan tidak aktif, dan pengingat untuk akun yang tidak memilih |

## 3. Baris MATRIKS baru

`lencana`, `laporan_warga`: publik `-`; akun masuk `T daftar`; admin dan super `T`. `surel_keluar`: hanya admin dan super. Dicerminkan di `tests/hak.test.mjs` dan matriks KEAMANAN-PRIVASI induk. Pilihan surel per hal mengikuti sel `ikuti` yang sudah ada.

## 4. Rute baru

| Rute | Peran | Isi |
| --- | --- | --- |
| `GET /api/organisasi/:id/lencana` | akun masuk | lencana yang disetujui: jenis, uraian, bukti, tanggal, nama peninjau |
| `POST /api/organisasi/:id/lencana` | akun berklaim organisasi itu | ajukan lencana; organisasi hanya dari jalur |
| `GET /api/proyek/:id/laporan` | akun masuk | laporan yang disetujui: isi dan tanggal, tanpa nama pelapor |
| `POST /api/proyek/:id/laporan` | akun masuk | kirim laporan |
| `PUT /api/ikuti/surel` | akun masuk | nyalakan atau matikan pengingat untuk satu hal yang diikuti |
| `GET /api/admin/surel-keluar` | admin, super | hitungan antrean, draf buletin, jumlah pelanggan aktif |
| `POST /api/admin/buletin/rakit` | admin, super | rakit draf minggu ini sekarang |
| `POST /api/admin/buletin/:id` | admin, super | `setuju` (draf disetujui dan diantrekan) atau `batal` |

Tinjau lencana dan laporan lewat rute kiriman yang sudah ada (jenis `lencana` dan `laporan`); tarik lewat `DELETE /api/kiriman/:jenis/:id`. Tautan berhenti pengingat memakai halaman `/berhenti` dan rute `POST /api/langganan/berhenti` yang sudah ada, dengan token berbentuk `p<id akun>.<32 hex>`.

## 5. Surel: apa yang ada dan apa yang tidak

- **Platform ini tidak mengirim surel.** Tidak ada penyedia yang dipilih (K19), tidak ada pengirim di kode, tidak ada kunci penyedia. `.dev.vars` hanya berisi `OPENALEX_KEY`, `YOUTUBE_API_KEY`, `IP_SALT`.
- Yang dibangun adalah daftar yang akan dikirim (`surel_antre`) dan draf buletin. Saat penyedia dipilih, pengirim cukup membaca baris berstatus `antre`.
- **Pengingat (cron harian):** hanya akun yang mencentang per hal; bawaan mati untuk semua yang sudah mengikuti. Paling banyak satu per akun per hari (kunci unik `p:<akun>:<tanggal>`). Butir yang tidak lebih baru dari penanda tidak diantrekan lagi. Akun yang surelnya berhenti langganan newsletter dilewati. Plafon 200 akun per jalan cron, yang paling lama tidak diantrekan lebih dulu. Tiap isi memuat tautan berhenti satu klik.
- **Buletin:** cron hanya merakit draf pada hari Senin WIB, sekali per minggu, dari berita 7 hari terakhir, regulasi baru, dan acara 14 hari ke depan. Antrean terisi hanya saat admin menekan "Setujui dan antrekan", sesudah melihat pratinjau dan jumlah penerima. Trigger D1 menolak antrean buletin dari draf yang belum disetujui.

## 6. Yang dipersempit, dan alasannya

| Diminta | Yang dibuat | Alasan |
| --- | --- | --- |
| Pengingat surel terkirim | hanya diantrekan | belum ada layanan surel; mengirim butuh keputusan pemilik soal penyedia, domain pengirim, dan SPF, DKIM, DMARC |
| Pengingat tenggat lelang | butir "pembaruan tender" bila tanggal peristiwa atau tanggal sumber jatuh dalam 7 hari | `tender.json` tidak punya kolom tenggat; tidak dikarang |
| Pengingat untuk sektor yang diikuti | memakai jenis ikuti yang ada (proyek, organisasi, provinsi, regulasi, tender, topik) | tidak ada jenis ikuti "sektor" |
| Bukti lencana berupa tautan atau unggahan gambar | tautan https saja | menghindari penyimpanan dokumen; tidak ada dokumen identitas |
| Laporan warga di `/proyek#henti` | dipasang di profil proyek `/p/<id>` | laporan melekat pada satu proyek; daftar proyek berhenti menaut ke profilnya |
| Progres pengiriman buletin | status `antre` saja | tidak ada pengirim |

## 7. Bukti

- `tests/keluar.test.mjs`: 15 uji di D1 lokal nyata lewat `worker.fetch`. Fetch global dipasangi perangkap; daftar panggilan keluar tetap kosong. Mencakup migrasi dua kali, sel matriks, tamu 401 dan bukan admin 403, IDOR tarik, kiriman ganda, organisasi dari badan ditolak, nama pelapor tidak keluar, HTML tersimpan sebagai teks, pilihan bawaan mati, hal yang tidak diikuti 404, yang tidak mencentang dan yang berhenti langganan tidak masuk daftar, satu per hari, tidak dua kali untuk perubahan yang sama, plafon, tautan berhenti, draf tanpa antrean, D1 menolak antrean dari draf belum disetujui, setuju hanya ke pelanggan aktif, tidak ada baris berstatus terkirim.
- `tests/kiriman.test.mjs`, `tests/jejaring.test.mjs`, `tests/akademi.test.mjs` diperbarui untuk delapan perbaikan; uji lama tidak dihapus atau dilonggarkan.
- `tests/e2e/cakupan.json`: 10 rute terdaftar.
- `npm run uji`: 2.429 uji, 2.421 lulus, 0 gagal (sebelum perubahan layar terakhir); sesudahnya gerbang, e2e, dan uji rumpun diulang: 912 lulus, 0 gagal.
- Layar di server lokal, 1440 terang dan 390 gelap, akun uji: lencana diajukan lewat formulir di `/o/su_ed074ff5`, disetujui lewat tab admin Kiriman, lalu tampil dengan tanggal dan peninjau; laporan dikirim di `/p/pj_0002` (tag HTML tampil sebagai teks), disetujui, lalu tampil tanpa nama; centang pengingat di `/diikuti` tersimpan; draf buletin dirakit dan dipratinjau di tab admin Surel; kuis akademi yang gagal tidak menampilkan jawaban benar; antrean foto menampilkan nama organisasi dan pil pihak proyek. Tanpa galat konsol, gulir horizontal, atau kunci mentah.

## 8. Belum

- Migrasi 0041 belum diterapkan ke produksi dan pratinjau (dijalankan pemilik).
- Tombol "Setujui dan antrekan" tidak diklik di layar (D1 lokal tidak punya pelanggan newsletter); alurnya terbukti lewat uji integrasi.
- Tolak dan tarik lencana serta laporan hanya terbukti lewat uji integrasi.
- Rentang MWh listrik hijau dan paginasi laporan forum hanya terbukti lewat uji; data lokal tidak cukup untuk menampilkannya.
- Halaman `/berhenti?t=p...` tidak dibuka di layar; rutenya terbukti lewat uji.
- Tampilan bahasa Inggris tidak dilihat; kuncinya ada dan gerbang kesetaraan lulus.
- Token berhenti pengingat berada di query string, mengikuti pola `/berhenti?t=` yang sudah ada.
- Nama peninjau lencana tampil ke semua akun masuk; bila pemilik tidak mau nama admin tampil, ganti dengan "admin METI".
- D1 lokal kini memuat data uji tambahan: satu lencana disetujui untuk `su_ed074ff5`, satu laporan disetujui di `pj_0002`, satu ikuti berpengingat, satu draf buletin `2026-W46`, dan nilai kuis akademi modul pertama 25 persen untuk akun uji.
