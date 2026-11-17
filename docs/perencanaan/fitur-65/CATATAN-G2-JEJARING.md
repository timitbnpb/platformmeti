# CATATAN G2 JEJARING: F65-209 sampai F65-212

Dikerjakan 15 Nov 2026. Belum di-commit. Migrasi baru hanya diterapkan ke D1 lokal (dua kali, tanpa galat); produksi dan pratinjau tidak disentuh.

## 1. Tabel (migrasi `0040_jejaring.sql`, idempoten)

| Tabel | Isi | Penjaga di D1 |
| --- | --- | --- |
| `kerja_minat` | minat lowongan: lowongan, akun, pesan opsional (maks 500) | UNIQUE (`lowongan_id`, `akun_id`); trigger `kerja_minat_sah` menolak lowongan yang tidak terbit, lewat batas, atau milik sendiri |
| `mentor` | pendaftaran mentor: bidang (sembilan bidang METI), uraian 20 sampai 600 | indeks unik parsial: satu pendaftaran aktif per akun; putusan wajib punya pemutus; tolak wajib beralasan |
| `mentor_minta` | permintaan mentor: mentor yang dituju, pesan 20 sampai 600 | indeks unik parsial per (akun, mentor); trigger `mentor_minta_sah` menolak mentor yang belum disetujui dan diri sendiri |
| `forum_utas`, `forum_balasan` | utas dan balasan teks polos per bidang | CHECK bidang dan panjang; sembunyi wajib beralasan; trigger `forum_balasan_sah` menolak balasan ke utas yang disembunyikan |
| `forum_lapor` | laporan: jenis, sasaran, akun, alasan | PRIMARY KEY (`jenis`, `sasaran_id`, `akun_id`): satu laporan per akun per sasaran |

Pencocokan bisnis (F65-209) tidak punya tabel dan tidak punya rute: dihitung di peramban dari potret yang sudah dimuat `/saya`.

## 2. Baris MATRIKS baru (`src/hak.js`, dicerminkan di `tests/hak.test.mjs` dan KEAMANAN-PRIVASI induk §1)

`kerja_minat`, `mentor`, `mentor_minta`, `forum`: publik `-`; anggota, pengurus, kurator, wilayah `T daftar`; admin dan super `T`. Tinjau mentor, antrean laporan, dan sembunyi dijaga `gerbangAdm` (admin, super).

## 3. Rute (15)

| Rute | Peran | Isi |
| --- | --- | --- |
| `GET /api/kerja/minat` | akun masuk | lowongan yang saya minati; jumlah peminat lowongan yang saya pasang |
| `POST /api/kerja/:id/minat` | akun masuk | `{pesan?}`; lowongan tutup, belum terbit, atau milik sendiri = 404; ganda = 409 |
| `DELETE /api/kerja/:id/minat` | akun masuk, hanya miliknya | menarik minat (baris dihapus) |
| `GET /api/kerja/:id/peminat` | pemasang lowongan itu, admin, super | nama, pesan, waktu saja; selain itu 404 seragam |
| `GET /api/mentor` | akun masuk | mentor yang disetujui: nama, bidang, uraian |
| `POST /api/mentor` | akun masuk | `{bidang, uraian}` ke antrean admin |
| `POST /api/mentor/:id/minta` | akun masuk | `{pesan}` ke antrean admin |
| `GET /api/mentor/permintaan` | akun masuk | permintaan untuk saya sebagai mentor, hanya yang sudah disetujui admin |
| `GET /api/forum?bidang=&hal=` | akun masuk | utas satu bidang, berpaginasi 20 |
| `GET /api/forum/utas/:id` | akun masuk | utas dan balasannya |
| `POST /api/forum` | akun masuk | `{bidang, judul, isi}` |
| `POST /api/forum/utas/:id/balasan` | akun masuk | `{isi}` |
| `POST /api/forum/lapor` | akun masuk | `{jenis, id, alasan}` |
| `GET /api/admin/forum/laporan` | admin, super | sasaran yang masih tampil dan dilaporkan |
| `POST /api/admin/forum/sembunyi` | admin, super | `{jenis, id, sembunyi, alasan}`; alasan wajib saat menyembunyikan, tercatat di jejak |

Tinjau dan tarik mentor memakai rute kiriman yang sudah ada: `GET`, `POST /api/admin/kiriman` dengan jenis `mentor` dan `minta`, dan `DELETE /api/kiriman/:jenis/:id`.

## 4. Keputusan

- **Minat lowongan (C-03).** Tanpa CV dan tanpa dokumen. Akun selalu dari sesi; badan yang memuat `akun_id` ditolak 422. Pesan lewat `teks()` portal, yang menolak surel dan nomor telepon. Menarik minat menghapus barisnya. Saat lowongan tutup, minat tidak lagi keluar di rute mana pun (baris tetap ada sampai lowongan dihapus).
- **Mentor (C-04).** Pendaftaran dan permintaan memakai mesin kiriman yang sudah ada (`KIRIMAN.mentor`, `KIRIMAN.minta`), jadi antrean, putusan, tarik, dan jejaknya satu jalur dengan foto, listrik hijau, dan dana. Mentor baru melihat sebuah permintaan sesudah admin menyetujuinya. Tidak ada pencocokan otomatis atau penjadwalan.
- **Forum (C-04).** Tabel sendiri, bukan `kons_utas`: tabel konsultasi terikat `dokumen_id` naskah, dan menumpang di sana akan memunculkan naskah palsu di daftar konsultasi. Tulisan langsung tampil. Yang disembunyikan tidak keluar ke non-admin sama sekali, termasuk ke penulisnya. Layar menulis bahwa moderasi dilakukan admin METI.
- **Teks polos.** Server menyimpan teks apa adanya; layar meng-escape tiap keluaran. Uji memeriksa keduanya.
- **Batas laju** (CHECK tabel `laju` tidak diubah): `koreksi:km<akun>` minat 30 per jam; `koreksi:kr<akun>` mentor 20 per jam (sama dengan kiriman lain); `koreksi:fu<akun>` utas 10 per jam; `koreksi:fb<akun>` balasan 30 per jam; `koreksi:fl<akun>` laporan 20 per jam.
- **Pencocokan bisnis.** `public/inti/cocok_rumus.js`. Peran diambil dari `peran_rantai`, `kategori.kode`, dan pabrikan bersertifikat TKDN. Empat komponen berbobot sama; komponen tanpa data di salah satu pihak dikeluarkan, bukan dinolkan; tanpa teknologi yang sama, pasangan tidak tampil. Urutan seri: skor, jumlah komponen terhitung, nama. Berlabel Hipotesis, dengan rumus tertulis di kartu dan di `/metode#pencocokan-bisnis`.

## 5. Yang dipersempit, dan alasannya

| Diminta | Yang dibuat | Alasan |
| --- | --- | --- |
| Forum memakai ulang utas konsultasi | tabel dan fungsi forum sendiri | lihat "Forum" di atas |
| Perkenalan lewat pesan | tombol membuka pesan ke sekretariat | pesan antar-pengguna tidak ada di platform |
| Urutan seri kedua: kelengkapan profil | jumlah komponen skor yang terhitung | itu ukuran kelengkapan data yang benar-benar dipakai skor; tidak ada skor kelengkapan profil organisasi di potret |
| Skor ukuran dan tahap | hanya terhitung bila kedua pihak punya proyek tertaut | 50 dari 902 organisasi punya proyek tertaut; sisanya hanya dinilai dari teknologi dan provinsi |
| Minat dihapus saat lowongan tutup | disembunyikan, tidak dihapus | tidak ada cron untuk itu; baris ikut terhapus bila lowongan dihapus (ON DELETE CASCADE) |
| Antrean permintaan mentor menampilkan nama mentor | menampilkan nomor mentor | mesin antrean kiriman tidak melakukan join per jenis |

## 6. Bukti

- `tests/jejaring.test.mjs`: 15 uji lewat `worker.fetch` di D1 lokal nyata. Mencakup migrasi dua kali, sel matriks, tamu 401 dan bukan admin 403, minat ganda, minat ke lowongan tutup dan milik sendiri, IDOR peminat, menarik milik orang lain, mentor belum disetujui tidak tampil dan tidak bisa diminta, tinjau oleh bukan admin, permintaan baru terlihat mentor sesudah disetujui, HTML tersimpan sebagai teks, lapor sekali per akun, sembunyi tanpa alasan, utas tersembunyi tidak keluar ke non-admin, batas laju forum, dan trigger D1.
- `tests/cocok_rumus.test.mjs`: 6 uji acuan, termasuk contoh hitung tangan dan data nyata.
- `tests/e2e/cakupan.json`: 15 rute terdaftar dengan peran benar dan salah.
- `npm run uji`: 2.382 uji, 2.374 lulus, 0 gagal.
- Layar di server lokal (1440 terang dan 390 gelap, akun uji): utas dan balasan ditulis lewat formulir di `/bidang/advokasi`, tag HTML tampil sebagai teks; minat dikirim dan daftar peminat dibuka di `/kerja`; pendaftaran mentor dikirim di `/portal`, disetujui lewat tab admin Kiriman, lalu tampil di daftar mentor; kartu pencocokan di `/saya` dengan tab EPC dan paginasi. Tanpa galat konsol, tanpa gulir horizontal, tanpa kunci i18n mentah baru.

## 7. Belum

- Migrasi 0040 belum diterapkan ke produksi dan pratinjau (dijalankan pemilik).
- Tidak diklik di layar, hanya terbukti lewat uji integrasi: menarik minat, meminta mentor (akun uji tidak bisa meminta dirinya sendiri), permintaan untuk mentor, laporkan, sembunyikan, dan pulihkan.
- Tampilan bahasa Inggris tidak dilihat di layar; kuncinya ada dan gerbang kesetaraan lulus.
- Pemeriksa terpisah (keamanan, INP, i18n) belum dijalankan atas rumpun ini.
- D1 lokal kini memuat data uji: dua lowongan berjudul "data uji lokal F65-212" dan satu minat (disisipkan langsung ke D1 lokal, karena hanya ada satu akun uji yang bisa masuk), satu minat yang dikirim lewat layar, satu utas dan satu balasan di bidang advokasi, satu pendaftaran mentor berstatus disetujui, dan organisasi profil akun uji diisi `p_10e0dde689` lewat rute profil.
- Temuan lama yang terlihat: `/bidang/advokasi` menampilkan empat kunci mentah (`bid.a.target`, `bid.a.izin-kontrak`, `bid.a.kebijakan`, `bid.a.pemda`); bukan dari rumpun ini.
