# GLOSARIUM: penyempurnaan November 2026

Lampiran rujukan; tidak menetapkan apa pun (kalah dari semua dokumen lain). Bila istilah di sini bertentangan dengan `KEPUTUSAN-METI`, `RISET`, `PRD`, atau `ALUR`, dokumen itulah yang benar. Melengkapi `docs/perencanaan/GLOSARIUM.md`; istilah yang sudah ada di sana (entitas, fakta, ikatan, potret, lapis, EST, tingkat bukti, skor keyakinan) tidak diulang. Versi 1, 11 Nov 2026.

Isi: 1 Bot panen dan sumber, 2 Regulasi, 3 Tautan data, 4 METI Wilayah, 5 Anggota dan tier, 6 Dua belas program, 7 Penomoran program, 8 Singkatan.

## 1. Bot panen dan sumber

| Istilah | Arti di paket ini |
| --- | --- |
| Bot panen | Rangkaian workflow GitHub Actions terjadwal yang mengambil data dari sumber, menjalankan rantai pipa, dan membuka PR (K21) |
| Denyut | Pemeriksaan ringan di Worker cron: HEAD atau ETag untuk sekitar 80 sumber, hasilnya ke D1; hanya memberi tahu sumber berubah atau tidak, tidak mengambil isi |
| Putaran | Satu kali jalan sebuah workflow terjadwal atau satu batch denyut |
| Registri sumber | Berkas `data/sumber_jadwal.json`: 60 sumber berjadwal dengan kode, frekuensi, sinyal perubahan, izin, status |
| Pustaka panen | `scripts/panen/_bot.mjs`: satu UA, baca robots tiap putaran, jeda per host, berhenti di 403 atau 429 |
| Sinyal perubahan | Penanda murah bahwa sumber berubah: ETag, Last-Modified, HEAD, Content-Length, hash isi, jumlah baris, lastmod sitemap |
| Keputusan sumber | Lima nilai di katalog: AMBIL OTOMATIS, AMBIL SEMI-MANUAL, OLAH SENDIRI, RUJUK SAJA, TOLAK |
| AMBIL OTOMATIS | Bot terjadwal tanpa orang (32 sumber) |
| AMBIL SEMI-MANUAL | Bot menyiapkan usulan, orang meninjau (28 sumber) |
| OLAH SENDIRI | Dihitung ulang dari data terbuka, tidak diambil verbatim (5 sumber) |
| RUJUK SAJA | Hanya tautan dan metadata (15 sumber) |
| TOLAK | Tidak diambil sama sekali (3 sumber: ESDM One Map, harga litium berbayar, Antara) |
| Status sumber | `ok` (segar), `basi` (lewat ambang), `gagal` (galat; tiga kali berturut-turut membuka isu), `blokir` (403, 429, atau robots; tidak dicoba lagi sampai ditinjau), `perlu_kunci` (butuh kunci API yang belum diisi) |
| Kunci API | Kredensial yang didaftarkan pemilik (C-25) dan diisi ke GitHub Secrets; tidak pernah masuk repo atau chat |
| Cabang `data-bot` | Cabang tempat bot menulis keluaran; PR dari cabang ini ditinjau sebelum digabung ke `main` |
| PR data | Pull request berisi selisih data (baris ditambah, diubah, dihapus per dataset) |
| Skrip yatim | Skrip di `scripts/panen` atau `scripts/pipa` yang tidak dirujuk skrip, uji, dokumen, atau workflow mana pun (65 pada 11 Nov); dipasang ke rantai atau dicatat pensiun |
| Gerbang unggah | Pemeriksa sebelum potret naik ke R2: tolak bila susut lebih dari 20%, JSON rusak, baris tanpa sumber, atau pola surel dan telepon di lapis publik dan anggota; semua atau tidak sama sekali |
| Panel kesegaran | Tab admin yang menampilkan umur tiap dataset menurut sumber (178 dataset) dengan ambang basi mengikuti frekuensi sumber |
| Ambang basi | Umur maksimum sebuah dataset sebelum berstatus `basi`; mengikuti frekuensi sumber, bukan tanggal bangun |
| Data lama | Pil di layar pengguna pada dataset `basi`; data tidak disembunyikan |
| Diperiksa | Tanggal terakhir bot mengecek sumber; berbeda dari tanggal bangun dan tanggal terbit sumber |
| Penonaktifan 60 hari | Kebijakan GitHub: workflow terjadwal dimatikan setelah 60 hari tanpa aktivitas repo publik |
| Antara | Kantor berita yang dilarang sebagai sumber panen (K21); tidak boleh ada URL atau judul Antara di keluaran |

## 2. Regulasi

| Istilah | Arti di paket ini |
| --- | --- |
| Teks regulasi | Isi peraturan terurai menjadi segmen (judul, menimbang, mengingat, menetapkan, pasal, penjelasan, lampiran); 622 dokumen dan 27.901 segmen pada 11 Nov |
| Berkas regulasi | Satu berkas Markdown `hukum/<jenis>/<tahun>/<id>.md` per peraturan dengan frontmatter |
| Frontmatter | Blok YAML di kepala berkas: id, jenis, nomor, tahun, judul, tgl_tetap, status, status_per, relasi, sumber, ekstraksi, resmi, lisensi |
| Indeks hukum | `hukum/_indeks.json`, dibangun dari frontmatter: id, status, relasi |
| Segmen | Potongan teks bernama dari satu peraturan (satu pasal, satu bagian) |
| Jangkar pasal | Tautan dalam dokumen yang stabil, `#pasal-N` |
| Pasal 42 UU 28/2014 | Dasar hukum bahwa peraturan perundang-undangan tidak berhak cipta sehingga boleh diumumkan ulang dengan atribusi; naskah diperiksa saat JM-U01 |
| Naskah otentik | Naskah di Lembaran Negara atau Berita Negara; salinan JDIH adalah rujukan dan ditandai "bukan naskah otentik" |
| Status berlaku | `berlaku`, `dicabut`, `diubah`, `dicabut_sebagian`, `rancangan`, `tidak_diketahui`, per tanggal pemeriksaan (`status_per`) |
| Berlaku per tanggal | Penyaringan regulasi yang berlaku pada tanggal yang dipilih pengguna |
| Relasi | Hubungan antar peraturan: mengingat, merujuk, mencabut, mengubah, mengganti, dan kebalikannya (dicabut oleh, diubah oleh) |
| Relasi dua arah | Bila A mencabut B, B tercatat dicabut oleh A; kedua sisi ditulis dalam langkah yang sama |
| Dicabut sebagian | Status khusus yang tidak disimpulkan otomatis; ditandai manual oleh kurator |
| Target nasional | Daftar peraturan nasional yang dicari bot (94 terstruktur, 50 di antaranya kosong pada 11 Nov) |
| Perda RUED | Peraturan daerah rencana umum energi daerah; 38 provinsi ditargetkan |
| JDIH, JDIHN | Jaringan dokumentasi dan informasi hukum, dan agregat nasionalnya; sumber utama teks |
| OCR | Pengenalan teks pada halaman pindaian; dijalankan lokal di mesin pemilik (`ocr_pdf.swift`) |
| Hasil OCR, perlu tinjau | Pil pada dokumen berhasil OCR yang belum dibaca orang; kutipan angka ditahan |
| Mutu ekstraksi | Angka 0 sampai 1 di frontmatter yang menunjukkan kualitas pengurai teks |
| Nomor berbeda | Keadaan ketika nomor atau judul dari halaman pertama PDF tidak sama dengan katalog; masuk antrean kurator |
| Peta dampak | Tautan bersumber dari regulasi ke proyek, organisasi, teknologi, wilayah terdampak, dan sebaliknya (aturan yang mengikat), lengkap dengan pasal dasar dan tingkat bukti (K22) |
| Pasal dasar | Pasal yang menjadi alasan sebuah tautan dampak |
| Aturan yang mengikat | Panel di profil entitas yang menunjukkan regulasi berpengaruh padanya |

## 3. Tautan data

| Istilah | Arti di paket ini |
| --- | --- |
| Tautan dua arah | Rujukan A ke B yang punya sisi balik B ke A; prinsip "tiap data baru tertaut dua arah" |
| Tautan satu arah | Rujukan tanpa sisi balik; gagal di gerbang |
| Garis dasar | Cakupan tautan per pasangan pada 11 Nov; cakupan tidak boleh turun dari angka ini |
| Cakupan | Persentase entitas yang punya tautan ke jenis tertentu (misalnya proyek berorganisasi) |
| Laporan cakupan sebelum-sesudah | Keluaran tiap tiket L yang membandingkan cakupan sebelum dan sesudah pekerjaan |
| Antrean kurator | Daftar tautan atau nomor yang ragu menunggu keputusan kurator (Setujui, Tolak, Minta data) |
| Tautan ragu | Hasil metode dengan skor sedang atau kunci ambigu; tidak ditautkan sampai diputus |
| Kunci kuat | Pengenal yang cukup untuk menautkan otomatis: NPWP, NIB, ORCID, DOI, ROR |
| `kode_kab` | Kode kabupaten atau kota pada proyek; baru ada tingkat provinsi sebelum JM-L06 |
| Pemberi dana | Lembaga yang mendanai (kode IATI di `pemberi_ref`); menjadi simpul organisasi setelah JM-L03 |
| Yatim data | Entitas tanpa tautan masuk dari dataset lain |
| Indeks pencarian global | Berkas `public/data/cari/` yang dibangun `indeks_cari.mjs`; diperluas ke riset, kalender, pusat studi, lowongan, hukum |

## 4. METI Wilayah

| Istilah | Arti di paket ini |
| --- | --- |
| METI Wilayah | Cabang METI per provinsi |
| Ketua Wilayah | Pemegang akun peran `wilayah` dengan `cakupan_prov` satu provinsi (K23) |
| `cakupan_prov` | Kolom akun yang membatasi peran `wilayah` pada satu provinsi; akun tanpa nilai ini tidak melihat baris apa pun |
| Admin Wilayah | Halaman `/wilayah-admin`: kegiatan, agenda, notulen, foto, berita, anggota provinsi |
| Papan Wilayah | Halaman per provinsi yang menampilkan kegiatan, rapor, orang, organisasi, proyek; "publik" berarti terbuka bagi yang login (D19) |
| Kegiatan | Satu acara atau aktivitas Wilayah dengan tanggal, tempat, status |
| Status Wilayah | `berdiri` (ada SK dan pelantikan), `segera`, `rencana` |
| Papan 38 provinsi | Gabungan `meti-wilayah` dan `wilayah` di JM-M08 |
| Pusat | METI tingkat nasional; admin Pusat melihat semua provinsi |
| Disembunyikan | Status kegiatan yang ditarik Pusat dari papan dengan alasan tercatat; bisa dipulihkan |

## 5. Anggota dan tier

| Istilah | Arti di paket ini |
| --- | --- |
| Tamu | Akun gratis berstatus `tamu` (D22): bisa masuk, melihat data dasar, tidak membuka isi terkunci |
| Tier | Tingkat keanggotaan yang menentukan isi terbuka; mengikuti tangga iuran (D22) |
| Tangga iuran | Enam tingkat di `keanggotaan.json`: Pelajar, Individu, NGO, Usaha kecil, Usaha besar, Utama (Charter); ditetapkan 1 Jul 2026 |
| Tier K24 | Penyebutan pemilik: individu, mahasiswa, perusahaan. Pemetaan ke kode tier DT ada di tabel bawah; dokumen lain merujuk ke sini dan memakai kode DT |
| Kode tier DT | `tamu`, `pelajar`, `individu`, `ngo`, `usaha_kecil`, `usaha_besar`, `utama` (`akun_tier.tier`, DESAIN-TEKNIS M.6); peringkat 0 sampai 6 (ALGORITMA `§tier` R.1) |
| Tier dasar anggota | Fungsi `tierDasar(kategori)` (C-28): tier terendah berbayar untuk kategorinya (`pelajar` bagi mahasiswa, `individu` bagi lainnya termasuk organisasi); dipakai anggota yang disetujui tanpa lunas selama tenggang 30 hari |
| Hak wakil | Jumlah wakil per keanggotaan: 1, 2, hingga 4, hingga 8 |
| Isi terkunci | Kontak pakar dan kontributor, data pasar rinci, unduhan CSV atau JSON, laporan lengkap, alat analisis; hanya anggota menurut tier (C-23). Kontak korporat organisasi tidak dikunci dan kontak orang tetap hanya Pengurus |
| Tenggang belum lunas | 30 hari sesudah persetujuan tanpa lunas (D20): `tierDasar(kategori)`, naik ke tier pilihan sesudah lunas, lalu `tamu` tanpa menghapus data bila belum lunas (C-28) |
| Data dasar | Data yang terbuka bagi semua yang login |
| Gerbang tier | Pemeriksaan tier di Worker; data terkunci tidak dikirim ke klien |
| Kartu terkunci | Kartu dengan ikon gembok, satu kalimat manfaat, dan aksi "Lihat cara naik tier" |
| Naik tier | Peralihan ke tier lebih tinggi lewat pendaftaran, persetujuan, dan iuran lunas |
| Lonceng | Pemberitahuan dalam aplikasi; satu-satunya pemberitahuan otomatis di gelombang ini karena surel tidak dikerjakan (C-21) |
| Pengurus Harian | Pihak yang menyetujui peluncuran program yang mengikat organisasi (C-01) |
| Pra-peluncuran | Kunci yang menahan program yang mengikat organisasi (sertifikasi, kode etik, produk data berbayar) sampai C-01 disetujui |

**Pemetaan K24 ke kode tier DT (ditulis sekali di sini; dokumen lain merujuk ke sini).**

| Penyebutan K24 | Kode tier DT | Dasar |
| --- | --- | --- |
| (bukan anggota) | `tamu` | D22: akun gratis |
| mahasiswa | `pelajar` | tangga iuran Pelajar |
| individu | `individu` | tangga iuran Individu |
| perusahaan | `ngo`, `usaha_kecil`, `usaha_besar`, `utama` | tangga iuran NGO sampai Utama; `ngo` dimasukkan ke "perusahaan atau organisasi" (bawaan [U], menunggu konfirmasi pemilik) |

## 6. Dua belas program

| Istilah | Arti di paket ini |
| --- | --- |
| Rapor | Terbitan berkala data pasar EBT METI (M01) dengan tanggal beku |
| Lembar data | Ringkasan satu teknologi dengan angka bersitasi |
| Edisi beku | Versi rapor yang angkanya dikunci pada tanggal tertentu dan tidak berubah |
| Dewan Pakar | Peninjau edisi dan kajian |
| Penyunting | Fungsi yang menyusun edisi; sel matriks pada PG atau KR |
| Posisi METI | Sikap resmi METI atas isu kebijakan; berkolom `pemilik_posisi` (posisi resmi, usulan asosiasi, bahan pihak lain) |
| Papan 22 butir | Matriks 22 substansi RDPU x status x pasal x PIC x tenggat (M02) |
| RDPU | Rapat dengar pendapat umum di DPR |
| Kelompok kerja | Wadah kerja topik tertentu (Komite ET, PMO); punya ruang notulen dan tenggat di platform |
| Polling isu | Jajak singkat anggota atas sebuah isu kebijakan, sekali per akun |
| Pemasang Terpercaya | Skema pendaftaran pemasang dan peritel PLTS dengan kode etik, uji, dan keputusan komite (M03); bersifat mengikat organisasi sehingga menunggu C-01 |
| Tanda METI Terpercaya | Tanda digital (QR) di KTA badan usaha yang lolos skema |
| Peninjau skema | Fungsi yang memeriksa dokumen pemasang; sel matriks pada PG |
| Pengaduan konsumen | Laporan konsumen terhadap pemasang terdaftar |
| Radar | Pantauan proyek, lelang, tender, peluang |
| Pipeline | Gabungan radar, lelang, tender, peluang menjadi satu daftar proyek (`/pipeline`) |
| Desk Siap Bank | Layanan menyiapkan proyek agar layak dibiayai (M04) |
| Skor kesiapan | Nilai kesiapan proyek menurut lahan, izin, jaringan, tarif atau offtake, EPC; turunan berlabel EST |
| Ruang data privat | Penyimpanan dokumen per proyek yang hanya bisa dibuka akun yang diundang |
| KDKMP | Koperasi Desa Merah Putih; jalur PLTS komunal dalam program PLTS 100 GW |
| Tipologi desa | Penggolongan desa untuk kalkulator dan peta KDKMP (definisi di ALGORITMA) |
| Kalkulator komunal | Alat hitung PLTS komunal; hasilnya berlabel EST |
| Pilot | Proyek percontohan koperasi desa yang kinerjanya dicatat tanpa data pribadi |
| Jalur kompetensi | Urutan modul dan ujian per keahlian (M06) |
| Asesor | Penilai ujian di LSP mitra; sel matriks pada KR |
| Lencana QR | Bukti kelulusan yang dapat diverifikasi dengan memindai QR |
| LSP | Lembaga sertifikasi profesi (mitra, BNSP) |
| Temu bisnis | Pertemuan terjadwal antar perusahaan lewat `/temu` (M07) |
| Kuota temu | Jumlah permintaan temu per tier |
| Penyelenggara | Fungsi yang mengatur acara dan jadwal temu; sel matriks pada PG |
| Fasilitator wilayah | Fungsi pendamping lokal untuk koperasi desa; sel matriks pada WL |
| Produk terverifikasi | Produk dengan status TKDN dan uji yang diperiksa verifikator (M09) |
| Verifikator | Fungsi yang memeriksa produk; sel matriks pada KR |
| TKDN | Tingkat komponen dalam negeri |
| Kerja sama selatan-selatan (SSTC) | Kerja sama pembangunan antar negara berkembang; papan di M10 |
| Kontributor | Pihak yang menyumbang konten atau data ke direktori program (M05, M10) |
| Kajian | Terbitan riset METI Institute yang melewati Dewan Pakar (M11) |
| Magang | Penempatan mahasiswa lewat `kerja` (M11) |
| Klub Pembeli Hijau | Wadah pembeli listrik hijau (industri, data center, KEK) yang dicocokkan ke pasokan (M12) |
| Profil kebutuhan beban | Data kebutuhan listrik pembeli per kawasan; boleh tampil anonim |
| Anonim | Pengaburan nama di server (bukan di layar saja) atas permintaan pembeli |
| Ajuan | Pengajuan anggota yang diputus pemutus berwenang; status `draf`, `diajukan`, `ditinjau`, `perlu_perbaikan`, `disetujui`, `ditolak`, `ditarik` |
| Pemutus | Peran atau fungsi yang berwenang memutus ajuan |
| Menunggu lama | Pil pada ajuan yang melewati batas layanan tanpa tindakan pemutus; tidak otomatis disetujui atau ditolak |

## 7. Penomoran program: tiket lawan riset benchmark

Seluruh paket ini memakai urutan `TIKET` dan K25. Riset benchmark memakai penomoran sendiri (M1 sampai M12).

| Tiket | Program | Nomor di riset benchmark |
| --- | --- | --- |
| JM-M01 | Pusat Data dan Intelijen Pasar | M1 |
| JM-M02 | Pelacak Kebijakan dan Advokasi | M2 |
| JM-M03 | Skema Pemasang Terpercaya | M3 |
| JM-M04 | Radar Proyek dan Desk Siap Bank | M5 |
| JM-M05 | Koperasi Desa | M7 |
| JM-M06 | Sertifikasi dan Akademi | M4 |
| JM-M07 | Forum Bisnis dan Misi Dagang | M6 |
| JM-M08 | METI Wilayah 38 Provinsi | M9 |
| JM-M09 | Hub Rantai Pasok | M10 |
| JM-M10 | Diplomasi Energi | M11 |
| JM-M11 | METI Institute | M12 |
| JM-M12 | Klub Pembeli Hijau | M8 |

## 8. Singkatan

| Singkatan | Arti |
| --- | --- |
| FN | Kode fitur paket ini (`FN-S05`); satu fitur per tiket |
| TM, AN, PG, KR, WL, AD, SA | Tamu, anggota, pengurus, kurator, Ketua Wilayah, admin, super |
| JS, KA, PN, CH, CK | Blok pola halaman: Jawaban singkat, Kartu angka, Panel, Cara menghitung, Cara mengutip |
| [F], [EST], [U], [?] | Fakta bersumber, hitungan platform, usulan, belum pasti |
| KP | `KEPUTUSAN-METI` |
| C-01 | Persetujuan Pengurus Harian atas program yang mengikat organisasi |
| ESDM, EBTKE, KESDM | Kementerian Energi dan Sumber Daya Mineral dan direktoratnya |
| RUPTL, RUKN, RUEN, KEN | Rencana usaha penyediaan tenaga listrik; rencana umum ketenagalistrikan nasional; rencana umum energi nasional; kebijakan energi nasional |
| PLTS | Pembangkit listrik tenaga surya |
| JETP | Kemitraan transisi energi berkeadilan |
| ConEx | EBTKE ConEx, acara tahunan |
