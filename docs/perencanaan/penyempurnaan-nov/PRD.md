# PRD: penyempurnaan November 2026

Dokumen ketiga dalam urutan otoritas paket ini (`KEPUTUSAN-METI` > `GRAND-DESIGN` > `RISET` > `PRD` > `ALUR` > `ALGORITMA` > `DESIGN-SYSTEM` > `DESAIN-TEKNIS` > `KEAMANAN-PRIVASI` > `RENCANA-UJI` > `TIKET`). Kalah dari `KEPUTUSAN-METI` (K21 sampai K26, D19 sampai D23, C-21 sampai C-28) dan `RISET`; menang atas `ALUR` dan dokumen di bawahnya. Versi 1, 11 Nov 2026.

**Konvensi.** Fitur berkode `FN-<seri><nn>`; `nn` sama dengan nomor tiket (`FN-S05` dipetakan ke `JM-S05`). Awalan `FN` membedakannya dari `F-A`, `F-S`, `F-W`, `F-M` di `docs/perencanaan/PRD.md`. Seri: S stabilkan, T bot panen, U regulasi, L data tersambung, W METI Wilayah, N anggota, M dua belas program. Seri Z (penutup) tidak punya fitur. Tanda kepastian [F] [EST] [U] [?] sama dengan `RISET`. Peran: TM tamu (akun gratis, D22), AN anggota, PG pengurus (Pengurus dan Sekretariat), KR kurator, WL Ketua METI Wilayah, AD admin, SA super; `[bot]` GitHub Actions; `[pemilik]` pemilik produk. Tanpa sesi hanya `/masuk`, `/aktivasi`, `/ganti-sandi`, `/daftar` dan pengecualian D19 yang sudah ada.

**Aturan berhenti.** Fitur, layar, tabel, atau rute yang tidak tertulis di paket ini tidak dibuat. Dokumen bertentangan atau kurang: pengerja berhenti dan bertanya (lihat Catatan untuk induk, bagian 13). Tiap pertanyaan terbuka punya bawaan.

**Tanpa tombol dummy.** Tidak satu pun layar di paket ini memakai tombol isi data dummy (K15 mengalahkan aturan global). Keadaan kosong ditangani dengan strip alasan, bukan data contoh.

Isi: 1 Pola wajib dan aturan lintas fitur, 2 Peran dan tier, 3 Seri S, 4 Seri T, 5 Seri U, 6 Seri L, 7 Seri W, 8 Seri N, 9 Seri M, 10 Fungsi akhir tiap integrasi, 11 Peta tiket ke fitur, 12 Ukuran keberhasilan paket, 13 Catatan untuk induk.

---

## 1. Pola wajib dan aturan lintas fitur

### 1.1 Pola halaman (P0)

Tiap halaman baru atau yang diubah paket ini mengikuti urutan dalam `.jm-wadah`: Jawaban singkat (`.jm-jawab`), kartu angka (`.jm-angka`), bagian per kartu (`.ak-panel`), Cara menghitung (`.jm-hitung`), Cara mengutip (`.jm-kutip`). Di fitur di bawah, baris **Isi layar** menyebut isi tiap blok dengan singkatan:

| Singkatan | Blok | Aturan |
| --- | --- | --- |
| JS | Jawaban singkat | satu kalimat berstempel `<time>`, memuat sumber, tanggal, 3 sampai 4 angka kunci; pola "Menurut sensus Jaringan METI (diperbarui {tanggal}), ..."; sama dengan `<meta name="description">`; kolom kosong dibuang dari kalimat |
| KA | Kartu angka | 4 sampai 5 kartu, label satu baris, angka tabular, satuan kecil, pil EST bila turunan, penyebut "n dari N", sumber satu baris, seluruh kartu tautan, tinggi sama; kosong ditulis "-" dengan title "Tidak ada angka kredibel, kami tidak menebak" |
| PN | Panel | satu kartu berjudul kecil per bagian, di `.jm-wadah`; data penting berupa grafik sungguhan yang bisa diklik dengan tooltip dan padanan tabel |
| CH | Cara menghitung | `dl` rumus dan batas; `details` tertutup di 390px; dibuang bila kosong |
| CK | Cara mengutip | "Kutip sebagai {nama}, Jaringan METI, ..., diperbarui {tanggal}. {url}"; tanggal beku = tanggal potret; tombol "Salin kutipan" |

### 1.2 Aturan lintas fitur

1. **Angka.** Tiap angka bersumber dan bertanggal; turunan berlabel EST dengan rumus di bawahnya; format id-ID di mode ID dan format Inggris di mode EN. Tanpa angka tanpa asal.
2. **Keadaan.** Memuat: kerangka `.jm-hantu` setinggi isi akhir. Kosong: ikon, satu kalimat, satu aksi. Galat kartu utama: `role="alert"`, kalimat dari katalog, tombol "Coba lagi". Bagian opsional yang gagal dimuat: disembunyikan (D21). Luring: pita kecil.
3. **Gaya.** Header tabel tengah dengan gradien, tanpa kapital penuh; kolom label kiri; angka rata kanan `tabular-nums` (D21). Tanpa em dash, tanpa titik tengah pemisah, tanpa emoji, tanpa kata hype.
4. **Dwibahasa.** Teks lewat `t(kunci)` ada di `id.json` dan `en.json` bersamaan; kolom data `_en` kosong jatuh ke versi Indonesia dengan pil "ID".
5. **Klik tidak membekukan layar.** Chrome kontrol urgent, subtree berat deferred; tab, urut, paginasi, dan saring melewati `inp-reviewer`.
6. **Hak.** Semua baca dan tulis D1 lewat `src/hak.js`; peran salah ditolak di Worker, bukan hanya disembunyikan. Data yang terkunci tidak dikirim ke klien (potret berlapis, C-23).
7. **Kirim keluar.** Tidak ada surel atau pesan otomatis (C-21). Pemberitahuan memakai lonceng dalam aplikasi; kirim manual lewat tombol salin.
8. **Data pribadi.** Tanpa surel, telepon, alamat, NIK di repo, potret publik, atau log. Repo publik: tanpa rahasia dan tanpa id akun penyedia hosting.
9. **Peluncuran yang mengikat organisasi** (sertifikasi, kode etik, produk data berbayar) menunggu C-01. Alat dibangun dan diuji; kunci peluncuran (`pra-peluncuran`) tetap mati sampai Pengurus Harian menyetujui (K25).
10. **Sumber yang ditahan** (C-24: GEM, IRENA, 1001startup, Comtrade) tidak dijadikan produk data berbayar.

---

## 2. Peran dan tier

### 2.1 Peran (tambahan atas tujuh peran `hak.js`)

`TM` tamu adalah akun gratis berstatus `tamu` (D22): bisa masuk, melihat data dasar, tidak membuka isi kunci. Peran fungsi di seri M (Penyunting, Peninjau Skema, Asesor, Penyelenggara, Fasilitator Wilayah, Pembeli, Verifikator, Hubungan Internasional) **bukan peran akun baru**; di paket ini mereka diwujudkan sebagai sel matriks `hak.js` pada peran yang ada (PG, KR, WL, AN). Pembentukan peran akun baru perlu keputusan (bagian 13, butir 5).

### 2.2 Tier

Kode tier di seluruh paket mengikuti DESAIN-TEKNIS (`akun_tier.tier`): `tamu` (bukan anggota), `pelajar`, `individu`, `ngo`, `usaha_kecil`, `usaha_besar`, `utama`. Pemetaan penyebutan K24 (individu, mahasiswa, perusahaan) ke kode itu ditulis sekali di GLOSARIUM §5 dan dirujuk dari dokumen lain; iuran tiap tingkat ada di `keanggotaan.json` dan ALGORITMA `§tier` R.1.

Aturan isi kunci (C-23, bawaan): data dasar untuk semua yang login; kontak, data pasar rinci, unduhan CSV atau JSON, laporan lengkap, dan alat analisis hanya anggota menurut tier. Baris **Manfaat per tier** tiap fitur menyebut kode tier DT, boleh dikelompokkan (mis. `ngo` ke atas). Peta lengkap 15 manfaat digital ada di FN-N03.

---

## 3. Seri S: stabilkan

### FN-S01 Empat perbaikan bug sedang (JM-S01)
- **Masalah.** Audit 11 Nov menemukan empat bug sedang (B-01 sampai B-04). Rincian tidak diulang di sini karena repo publik; ada di luar repo.
- **Pengguna dan peran.** Semua peran; pemeriksa: security-reviewer, guard-api, hak-auditor.
- **Isi layar.** Tidak ada layar baru. Perilaku yang salah menjadi benar; tidak ada teks baru kecuali pesan galat dari katalog.
- **Data.** Tidak ada tabel baru; migrasi hanya bila perbaikan memerlukannya (DESAIN-TEKNIS).
- **Manfaat per tier.** Semua tier sama.
- **Ukuran berhasil.** Tiap perbaikan punya uji yang gagal sebelum dan lulus sesudah; B-03 dan B-04 lulus lewat D1 lokal sungguhan; `npm run uji` hijau.

### FN-S02 Perbaikan bug rendah terbukti (JM-S02)
- **Masalah.** Bug B-05 sampai B-09 dan B-11 terbukti, termasuk `data/cari/hukum.json` yang hilang dan `siapTautan("provinsi")`.
- **Pengguna dan peran.** Semua yang login.
- **Isi layar.** Berkas dan tautan yang rusak kembali bekerja (rincian per temuan di luar repo); tidak ada aset 404.
- **Data.** `data/cari/hukum.json` dibangun ulang oleh pipa.
- **Manfaat per tier.** Semua tier sama.
- **Ukuran berhasil.** Penelusuran lokal 0 galat konsol dan 0 aset 404; `npm run uji` hijau.

### FN-S03 Periksa bug rendah yang masih dugaan (JM-S03)
- **Masalah.** B-10 dan B-12 sampai B-15 baru dugaan.
- **Pengguna dan peran.** Pemeriksa `peninjau-bersih`.
- **Isi layar.** Tidak ada.
- **Data.** Laporan bukti per butir; yang terbukti pindah ke FN-S02, yang tidak terbukti ditutup dengan alasan.
- **Manfaat per tier.** Tidak berlaku.
- **Ukuran berhasil.** Lima butir semuanya berstatus terbukti atau ditutup.

### FN-S04 Buang Antara dari panen (JM-S04)
- **Masalah.** K21 melarang Antara, tetapi `scripts/panen/berita.mjs` baris 80, pemanen `tarif_harga`, dan `obligasi_hijau` masih memakai RSS atau judul Antara [F].
- **Pengguna dan peran.** Semua yang membaca berita, tarif, obligasi hijau.
- **Isi layar.** Berita, `tarif_harga`, dan obligasi hijau tampil tanpa judul atau URL Antara; kartu yang kehilangan sumbernya menampilkan sumber pengganti atau disembunyikan (D21).
- **Data.** `berita.json`, `tarif_harga.json`, `obligasi_hijau.json` dibangun ulang; sumber pengganti dari katalog (S60, S17) bila ada.
- **Manfaat per tier.** Semua tier sama.
- **Ukuran berhasil.** 0 URL atau judul Antara di keluaran; gerbang menolak bila muncul lagi.

### FN-S05 Satu daftar proyek dan penjelasan selisih (JM-S05)
- **Masalah.** `proyek.json` (548) dan `proyek_terpadu.json` (607, ditambah 16 diragukan dan 60 dikeluarkan) memberi dua angka; beranda memakai 548 dan pelacak 607. Kapasitas terlacak hanya 49 sampai 72% dari angka nasional dan tidak dijelaskan di layar [F].
- **Pengguna dan peran.** Semua yang login; pembaca beranda dan pelacak proyek.
- **Isi layar.** JS: satu angka proyek terlacak, sumber, tanggal. KA: proyek terlacak (dengan penyebut), kapasitas terlacak lawan nasional per teknologi. PN "Kenapa angka kami lebih kecil dari angka nasional": batang terlacak lawan nasional (surya 855 dari 1.494 MW, 57%; hidro 5.469 dari 7.587, 72%; panas bumi 1.332 dari 2.744, 49% [F]) dengan pil EST, dan daftar sebab (proyek tanpa status, tanpa COD, tanpa teknologi). CH: rumus persen terlacak dan batas. CK baku.
- **Data.** Satu sumber daftar proyek; `konsistensi.json` menjadi sumber selisih; aturan angka tunggal ada di ALGORITMA bagian proyek.
- **Manfaat per tier.** Semua tier sama.
- **Ukuran berhasil.** Satu angka proyek di semua layar; tiap selisih terhadap angka nasional punya penjelasan di layar; uji potret dan tangkapan layar lulus.

### FN-S06 Bersihkan label internal dan blok kosong (JM-S06)
- **Masalah.** Label "Butuh unduhan pemilik" (kunci `butuh.judul` di `teks_pemda.json`, `teks_izin.json`, `teks_kebijakan.json`, `teks_desa.json`) bocor ke pengguna; blok paten (0 baris), emisi provinsi (0), podcast, dan sosmed (0) tampil kosong [F].
- **Pengguna dan peran.** Semua yang login.
- **Isi layar.** Label internal diganti kalimat yang menyebut keadaan data ("Belum tersedia" dengan satu dari empat alasan baku: Tidak dipublikasikan, Belum ada, Menunggu data K/L, Belum kami cari) atau bagian disembunyikan; blok kosong tidak dirender (D21).
- **Data.** `teks_*.json` dibersihkan; gerbang statis menolak label internal.
- **Manfaat per tier.** Semua tier sama.
- **Ukuran berhasil.** 0 label internal di `public/data/teks_*.json` (gerbang menagihnya); 0 blok kosong di tangkapan layar 1440 dan 390.

### FN-S07 Rute riwayat dengan METI (JM-S07)
- **Masalah.** `public/direktori.js` memanggil `GET /api/riwayat`, tetapi rute tidak ada; bagian "Riwayat dengan METI" hilang diam-diam [F].
- **Pengguna dan peran.** PG, AD, SA membaca; lapis Pengurus (C-17 menurut TIKET). AN, TM, KR, WL ditolak.
- **Isi layar.** Bagian "Riwayat dengan METI" di profil organisasi: daftar interaksi bertanggal dan bersumber. Kosong: strip "Belum ada".
- **Data.** Riwayat lewat `hak.js` dengan sel matriks; tidak ada kontak pribadi.
- **Manfaat per tier.** Tidak dijual; hanya pengurus.
- **Ukuran berhasil.** Rute terdaftar di `cakupan.json` dengan uji peran benar dan peran salah; bagian tampil bagi pengurus.

### FN-S08 Uji integrasi semua rute API (JM-S08)
- **Masalah.** `tests/e2e/cakupan.json` hanya mendaftarkan 23 dari sekitar 200 rute `/api/` [F]; sisanya diuji dengan mock atau belum, padahal mock meloloskan kelas bug paling mahal.
- **Pengguna dan peran.** Pengembang dan gerbang; pemeriksa penulis-gerbang.
- **Isi layar.** Tidak ada.
- **Data.** `tests/e2e/cakupan.json` memuat seluruh rute dengan peran benar dan peran salah.
- **Manfaat per tier.** Tidak berlaku.
- **Ukuran berhasil.** Gerbang gagal bila ada rute `/api/` tak terdaftar; 23 naik ke seluruh rute; `npm run uji` hijau.

### FN-S09 Selaraskan DESIGN-SYSTEM dengan K15 dan D21 (JM-S09)
- **Masalah.** `DESIGN-SYSTEM.md` masih memuat `.ak-dummy` dan kunci `jm.dummy.*` padahal K15 membatalkan tombol dummy; nilai konflik gaya belum ditulis [F].
- **Pengguna dan peran.** Pengerja layar dan induk.
- **Isi layar.** Tidak ada.
- **Data.** Hapus `.ak-dummy` dan `jm.dummy.*`; tulis nilai D21 (header tabel tengah gradien tanpa kapital penuh, kolom label kiri, angka rata kanan tabular, nilai lain mengikuti `jm.css` dan `tema.css`, kartu utama galat `role="alert"` dengan "Coba lagi", bagian opsional disembunyikan).
- **Manfaat per tier.** Tidak berlaku.
- **Ukuran berhasil.** Tidak ada `ak-dummy` atau `jm.dummy` di `DESIGN-SYSTEM.md`; nilai D21 tertulis; catatan: `public/direktori.css` masih memuat kelas `ak-dummy` dari porting, dibersihkan di luar tiket ini bila perlu [?].

### FN-S10 Pengerasan masukan Tanya sesuai KPV (JM-S10)
- **Masalah.** Tanya AI (C-22, dipertahankan tanpa pengembangan) menerima potongan teks hasil panen dan regulasi yang bisa memuat instruksi tersembunyi. KEAMANAN-PRIVASI §5.6 menuntut pengerasan kecil pada `src/tanya.js` [F].
- **Pengguna dan peran.** Semua yang login memakai Tanya; pengerjaan oleh `worker`, pemeriksa security-reviewer.
- **Isi layar.** Tidak ada layar baru. Jawaban tampil sebagai teks (bukan HTML), tiap jawaban bersitasi; jawaban tanpa sitasi tidak tampil dan pengguna melihat kalimat katalog "Belum ditemukan dasar yang bisa dikutip".
- **Data.** Tidak ada tabel baru. Potongan masuk model sebagai data berbatas jelas dengan instruksi sistem bahwa isinya tidak boleh dipatuhi; model tanpa alat dan tanpa sesi pengguna; hanya potongan yang boleh dibaca peran penanya; keluaran tanpa sitasi dibuang.
- **Manfaat per tier.** Semua tier sama.
- **Ukuran berhasil.** Uji fixture berisi instruksi jahat gagal memengaruhi jawaban (prompt yang dikirim diperiksa: batas data jelas, instruksi sistem ada, tanpa alat); `npm run uji` hijau.

### FN-S11 Dua belas jenis MATRIKS tanpa baris KPV §1 dan gerbang sinkron (JM-S11)
- **Masalah.** Dua belas jenis di `MATRIKS` `src/hak.js` (`agenda`, `konten_meti`, `konten_otorisasi`, `naskah`, `naskah_catatan`, `event_atur`, `event_daftar`, `konsultasi`, `sesi_admin`, `surel_minta`, `konsultasi_putus`, `keyakinan`) tidak punya baris di KPV §1, padahal tiap baris matriks adalah kontrak uji "peran salah DITOLAK" [F].
- **Pengguna dan peran.** Pengembang dan gerbang; pemeriksa hak-auditor dan penulis-gerbang.
- **Isi layar.** Tidak ada.
- **Data.** Baris untuk 12 jenis ditulis di KPV (docs/perencanaan) dengan sel yang sama dengan `MATRIKS`; gerbang statis membandingkan jenis `MATRIKS` dengan baris dokumen hak dan menggagalkan uji bila ada jenis tanpa baris atau baris tanpa jenis.
- **Manfaat per tier.** Tidak berlaku.
- **Ukuran berhasil.** Tiap jenis `MATRIKS` punya baris dokumen dan satu uji peran salah; gerbang sinkron hijau dan merah pada fixture jenis yatim; `npm run uji` hijau.

**Fungsi akhir seri S.** Pengguna melihat satu angka proyek yang bisa dipercaya dengan penjelasan selisihnya, tanpa label internal dan blok kosong; pengurus membuka riwayat dengan METI; pengembang punya jaring uji atas seluruh rute.

---

## 4. Seri T: bot panen

### FN-T01 Registri sumber dan pustaka panen (JM-T01)
- **Masalah.** Tidak ada daftar sumber berjadwal; 65 skrip tak dirujuk; tiap skrip memilih UA dan jeda sendiri [F].
- **Pengguna dan peran.** Pemilik, AD, SA (membaca di panel FN-T08); pengerja pipa.
- **Isi layar.** Tidak ada layar baru; data registri tampil di panel FN-T08.
- **Data.** `data/sumber_jadwal.json`: 60 sumber AMBIL OTOMATIS dan SEMI-MANUAL dengan kode, frekuensi, sinyal perubahan, izin, status `ok | basi | gagal | blokir | perlu_kunci`. Pustaka `scripts/panen/_bot.mjs`: satu UA jujur METI, baca robots tiap putaran, jeda per host (minimal 2 detik; 10 detik untuk satudata.kemendesa), berhenti di 403 atau 429, tanpa login, tanpa medsos, tanpa Antara.
- **Manfaat per tier.** Tidak dijual.
- **Ukuran berhasil.** 60 sumber terdaftar; swauji pustaka menolak jalur yang dilarang robots.

### FN-T02 Workflow harian (JM-T02)
- **Masalah.** Berita, karbon, dan pengadaan membusuk dalam hitungan hari tanpa panen ulang (berita terbaru 7 Nov, kalender 4 acara mendatang) [F].
- **Pengguna dan peran.** `[bot]`; peninjau PR: pemilik atau PG.
- **Isi layar.** Berita dan linimasa terisi tanpa tindakan manual; tiap kartu menampilkan "diperiksa {tanggal}" bukan hanya tanggal bangun.
- **Data.** `.github/workflows/panen-harian.yml`: RSS berita (S60), IDXCarbon (S22), pengadaan publik tanpa login (S11); S27 hanya bila diizinkan. Keluaran ke cabang `data-bot` dan PR.
- **Manfaat per tier.** Semua yang login.
- **Ukuran berhasil.** `workflow_dispatch` lulus; satu putaran menghasilkan PR berisi selisih; umur berita terbaru kurang dari satu hari bila PR digabung.

### FN-T03 Workflow mingguan (JM-T03)
- **Masalah.** Regulasi, riset, dan pustaka tidak memperbarui diri (regulasi terbaru ditetapkan 14 Agu 2026) [F].
- **Pengguna dan peran.** `[bot]`; peninjau PR.
- **Isi layar.** Regulasi baru, makalah baru, dan acara DPR muncul; tidak ada tampilan baru.
- **Data.** `panen-mingguan.yml`: JDIH ESDM (S06), BPK (S62), Amdalnet (S24), siaran pers EBTKE (S01), OpenAlex (S47), Crossref (S48), DOAJ (S49), Wikidata (S82), DPR (S66), HBA (S03).
- **Manfaat per tier.** Semua yang login.
- **Ukuran berhasil.** `workflow_dispatch` lulus; sumber yang gagal tidak menggagalkan putaran.

### FN-T04 Workflow bulanan (JM-T04)
- **Masalah.** Data pasar dan harga bergantung pada kunci dan rilis bulanan yang belum tertangkap.
- **Pengguna dan peran.** `[bot]`; peninjau PR.
- **Isi layar.** Tidak ada tampilan baru; kartu harga dan tren memakai data terbaru.
- **Data.** `panen-bulanan.yml`: Ember, Bank Dunia, OWID, Pink Sheet, Comtrade, GEM, Gatrik, ICP, BPS, SBTi. Sumber berkunci (BPS, EIA, Ember API, Comtrade penuh) berstatus `perlu_kunci` dan dilewati sampai pemilik mengisi GitHub Secrets (C-25). GEM dan Comtrade tidak dijadikan produk berbayar (C-24).
- **Manfaat per tier.** Semua yang login.
- **Ukuran berhasil.** `workflow_dispatch` lulus; sumber `perlu_kunci` tercatat, bukan galat.

### FN-T05 Workflow kuartalan dan manual (JM-T05)
- **Masalah.** Pendanaan, investasi, dan PSN berubah per kuartal; sumber tahunan perlu pengingat [F].
- **Pengguna dan peran.** `[bot]`; peninjau manusia wajib (semi-manual).
- **Isi layar.** Tidak ada baru.
- **Data.** `panen-kuartalan.yml`: DJPPR, BKPM, PSN, JETP, AIIB, GCF, IFC, OJK. Sumber tahunan atau insidentil (statistik, HEESI, RUPTL, IRENA, atlas) lewat `workflow_dispatch` ditambah pengingat. Sumber yang terblokir atau tanpa izin tidak dipaksa; masuk antrean semi-manual.
- **Manfaat per tier.** Semua yang login.
- **Ukuran berhasil.** `workflow_dispatch` lulus untuk tiap jadwal.

### FN-T06 Rangkai potret dan PR ke data-bot (JM-T06)
- **Masalah.** Rantai panen, sambung, hubung, skor, potret dijalankan tangan; 65 skrip yatim; tidak ada `potret.yml` [F].
- **Pengguna dan peran.** `[bot]`, pemilik (tinjau dan gabung PR; unggah R2 produksi tetap oleh pemilik).
- **Isi layar.** Tidak ada baru; data tayang mengikuti PR yang digabung.
- **Data.** Satu perintah rantai; 65 skrip dipasang ke rantai atau dicatat pensiun; hasil ke `data-bot` dan PR berisi selisih; 3 kegagalan berturut-turut membuka isu; keluaran ditolak bila susut lebih dari 20%, JSON rusak, baris tanpa sumber, atau pola surel atau telepon di lapis publik dan anggota.
- **Manfaat per tier.** Semua yang login.
- **Ukuran berhasil.** Tiap skrip dirujuk atau dicatat pensiun (baseline 65 yatim); satu sumber gagal tidak menggagalkan putaran; higiene-repo bersih.

### FN-T07 Denyut perubahan di Worker cron (JM-T07)
- **Masalah.** Tidak ada yang tahu sebuah sumber berubah sebelum bot jalan; Worker punya satu cron yang tidak memeriksa sumber [F].
- **Pengguna dan peran.** Sistem; AD dan SA membaca hasil.
- **Isi layar.** Hasil tampil di panel FN-T08.
- **Data.** Migrasi baru (tabel status sumber), `src/denyut.js`, penjadwal di `src/worker.js`: HEAD atau ETag sekitar 80 sumber ke D1 dalam batas subrequest Worker, dibagi per putaran [?, batas perlu diverifikasi di dokumen Cloudflare]. Cron maksimal 5 pemicu (batasan global).
- **Manfaat per tier.** Tidak dijual.
- **Ukuran berhasil.** Satu putaran selesai dalam batas subrequest; uji D1 lokal; perf-reviewer tanpa temuan tinggi.

### FN-T08 Panel kesegaran semua dataset (JM-T08)
- **Masalah.** `kesegaran.json` hanya memantau 16 dari 178 dataset dan menilai semuanya segar karena baru dibangun [F].
- **Pengguna dan peran.** AD, SA; PG membaca.
- **Isi layar.** Tab admin `public/admin_kesegaran.js`. JS: berapa dataset segar, basi, gagal, blokir. KA: 178 dataset terpantau (n dari N), segar, basi, `perlu_kunci`, `blokir`. PN: tabel dataset dengan kolom label kiri, umur dan ambang basi rata kanan, status berupa pil bergambar; urut dan saring tanpa membekukan layar. CH: ambang basi mengikuti frekuensi sumber (bukan tanggal bangun). Di layar pengguna, kartu data menampilkan umur menurut sumber.
- **Data.** Registri FN-T01 dan status FN-T07.
- **Manfaat per tier.** Admin saja.
- **Ukuran berhasil.** 178 dari 178 dataset terpantau (dari 16); uji ambang; tangkapan layar.

**Fungsi akhir seri T.** Data berhenti membusuk diam-diam: tiap sumber punya jadwal, status, dan umur yang terlihat; perubahan sampai ke pemilik sebagai satu PR berisi selisih; sumber yang diblokir atau butuh kunci terlihat, bukan hilang.

---

## 5. Seri U: regulasi

### FN-U01 Ekspor 622 teks regulasi ke GitHub (JM-U01)
- **Masalah.** Teks regulasi hanya di D1 lokal dan `data-panen`; di GitHub 0 berkas (K22 menuntut sebaliknya) [F].
- **Pengguna dan peran.** Pengerja pipa; semua yang login membaca lewat layar regulasi.
- **Isi layar.** Halaman regulasi menautkan "Teks lengkap" per pasal (`#pasal-N`) dan menampilkan peringatan "salinan JDIH, bukan naskah otentik". JS: jumlah regulasi berteks, tanggal. KA: regulasi berteks (n dari N), berlaku, dicabut, diubah.
- **Data.** `hukum/<jenis>/<tahun>/<id>.md` dengan frontmatter (id, jenis, nomor, tahun, judul, tgl_tetap, status, status_per, relasi, sumber, ekstraksi, resmi, lisensi) dan segmen sesuai DESAIN-TEKNIS bagian regulasi; `hukum/_indeks.json`; PDF mentah tidak di repo (hanya hash). Dasar Pasal 42 UU 28/2014 diperiksa dari naskah resmi (K22).
- **Manfaat per tier.** Semua yang login (regulasi bukan data terkunci).
- **Ukuran berhasil.** 622 berkas valid dan tanpa data pribadi; higiene-repo bersih.

### FN-U02 Panen 50 target nasional kosong (JM-U02)
- **Masalah.** Dari 94 target nasional terstruktur, 50 kosong, termasuk UU 30/2007, UU 11/2020, Perpres 22/2017, Perpres 55/2019, PP 23/2010, PP 7/2021, PP 55/2022, PP 96/2021, PP 22/2021 [F].
- **Pengguna dan peran.** Pengerja pipa; KR menerima antrean verifikasi.
- **Isi layar.** Regulasi baru muncul di katalog; target yang tidak tersedia ditandai dengan alasan, tidak dikarang.
- **Data.** Panen dari JDIH resmi (S62, S63, S64); nomor yang tidak terverifikasi tidak dipakai.
- **Manfaat per tier.** Semua yang login.
- **Ukuran berhasil.** Laporan cakupan per target (ada, tidak tersedia disertai alasan).

### FN-U03 Panen 38 Perda RUED (JM-U03)
- **Masalah.** Sekitar 10 dari 38 provinsi belum punya Perda RUED di repo; judul sering tidak menyebut provinsi [F, EST].
- **Pengguna dan peran.** Pengerja pipa; semua yang login membaca di halaman wilayah.
- **Isi layar.** Halaman provinsi menampilkan Perda RUED dengan tautan teks; provinsi tanpa perda menampilkan strip "Belum ada" atau "Belum kami cari".
- **Data.** Pemetaan provinsi diperbaiki; sumber JDIH BPK, JDIHN (tanpa `/search-api/`); pemekaran Papua dicek [?].
- **Manfaat per tier.** Semua yang login.
- **Ukuran berhasil.** Laporan cakupan 38 provinsi (ada, belum ada, alasan).

### FN-U04 OCR 51 pindaian dan ulang 125 gagal (JM-U04)
- **Masalah.** 51 dokumen perlu OCR dan OCR terlaksana 0; 125 gagal diurai [F].
- **Pengguna dan peran.** Pemilik menjalankan OCR lokal; pengerja pipa.
- **Isi layar.** Dokumen hasil OCR menampilkan pil "Hasil OCR, perlu tinjau"; kutipan angka dari dokumen itu ditahan sampai dibaca orang.
- **Data.** `scripts/pipa/ocr_pdf.swift` di mesin lokal; `ekstraksi.metode: ocr-vision` dan `mutu` di frontmatter.
- **Manfaat per tier.** Semua yang login.
- **Ukuran berhasil.** 51 pindaian ber-OCR dan 125 gagal diulang, tiap hasil punya mutu tercatat.

### FN-U05 Verifikasi nomor dari halaman pertama (JM-U05)
- **Masalah.** Judul di katalog sering salah isi (PP 5/2021 berjudul "Permen ESDM No. 5 Tahun 2021") sehingga pencocokan rentan salah [F].
- **Pengguna dan peran.** KR memutus antrean; pengerja pipa.
- **Isi layar.** Tab kurasi: antrean "nomor berbeda" berisi pasangan (katalog, halaman pertama PDF) dengan Setujui atau Tolak.
- **Data.** Nomor dan judul dari halaman 1 PDF; beda dengan katalog masuk antrean.
- **Manfaat per tier.** Kurator.
- **Ukuran berhasil.** Tiap dokumen punya nomor terverifikasi atau berada di antrean dengan alasan.

### FN-U06 Graf relasi dan status berlaku (JM-U06)
- **Masalah.** 109 regulasi berstatus kosong; relasi mencabut, mengubah, mengingat belum dua arah [F].
- **Pengguna dan peran.** Semua yang login; pengerja pipa dan worker.
- **Isi layar.** Halaman regulasi: PN "Berlaku per tanggal" (pilih tanggal), PN "Relasi" (mencabut, dicabut oleh, mengubah, diubah oleh, mengingat) dua arah; pil status. CH: cara status ditentukan (halaman detail BPK, bukan simpulan sendiri).
- **Data.** Relasi 5.828 (4.852 mengingat, 697 merujuk, 148 mencabut, 93 mengubah, 38 mengganti) dibalik dua arah; status per tanggal; cek ETag mingguan; relasi berubah membuka isu; "dicabut sebagian" ditandai manual.
- **Manfaat per tier.** Semua yang login.
- **Ukuran berhasil.** Tiap relasi punya sisi balik; 109 status kosong diperiksa; uji acuan lulus.

### FN-U07 Peta dampak regulasi ke entitas (JM-U07)
- **Masalah.** Hanya 23 proyek (4%) punya regulasi tertaut; K17 butir 4 dan K22 menuntut tiap regulasi menunjukkan proyek, organisasi, teknologi, wilayah terdampak dan tiap entitas menunjukkan aturan yang mengikat [F].
- **Pengguna dan peran.** Semua yang login membaca; KR memutus tautan ragu.
- **Isi layar.** Di regulasi: PN "Terdampak" (proyek, organisasi, teknologi, wilayah) dengan dasar pasal dan tingkat bukti. Di proyek, organisasi, teknologi, wilayah: PN "Aturan yang mengikat". Tiap baris menampilkan pil tingkat bukti dan EST bila turunan. CH: metode ALGORITMA bagian dampak. KA: proyek ber-regulasi (n dari N).
- **Data.** Tautan bersumber (pasal) dan bertingkat bukti; yang ragu masuk antrean kurator. Bergantung pada FN-L02.
- **Manfaat per tier.** Daftar aturan dan dampak ringkas untuk semua yang login; alat analisis dampak lintas portofolio hanya anggota menurut C-23 [U].
- **Ukuran berhasil.** Cakupan proyek ber-regulasi naik dari 4% menuju target di ALGORITMA bagian dampak; uji acuan lulus.

**Fungsi akhir seri U.** Anggota membuka satu regulasi dan langsung tahu apakah masih berlaku pada tanggal tertentu, apa yang dicabutnya, dan proyek, organisasi, serta wilayah mana yang terkena; membuka satu proyek dan melihat aturan yang mengikatnya.

---

## 6. Seri L: data tersambung

Semua fitur L memakai metode ALGORITMA: tiap tautan bersumber dan bertingkat bukti; yang ragu masuk antrean kurator. Tiap fitur ditutup dengan laporan cakupan sebelum-sesudah.

### FN-L01 Tautan proyek ke organisasi (JM-L01)
- **Masalah.** 65% proyek (357 dari 548) tanpa organisasi tertaut; `pihak.pemilik` hanya teks; 114 klaim org ke proyek tidak dibalas [F].
- **Pengguna dan peran.** Semua yang login; KR memutus antrean.
- **Isi layar.** Profil proyek: PN "Pihak" dengan organisasi tertaut; profil organisasi: PN "Proyek" dua arah. KA: proyek berorganisasi (n dari N).
- **Data.** `proyek.organisasi_id`, `organisasi.proyek_ids` dibalik dua arah.
- **Manfaat per tier.** Semua yang login.
- **Ukuran berhasil.** Cakupan proyek berorganisasi naik dari 35% (baseline); 0 klaim satu arah.

### FN-L02 Tautan proyek ke regulasi dan berita (JM-L02)
- **Masalah.** 96% proyek tanpa regulasi dan 97% tanpa berita [F].
- **Pengguna dan peran.** Semua yang login; KR.
- **Isi layar.** Profil proyek: PN "Aturan yang mengikat" dan "Berita terkait"; berita menunjukkan proyek yang disebut.
- **Data.** `proyek.regulasi_ids`, `proyek.berita_ids` dan sisi baliknya.
- **Manfaat per tier.** Semua yang login.
- **Ukuran berhasil.** Cakupan naik dari 4% (regulasi) dan 3% (berita); 0 tautan satu arah. Prasyarat FN-U07.

### FN-L03 Tautan pendanaan ke proyek dan organisasi (JM-L03)
- **Masalah.** Hanya 14% baris pendanaan menunjuk proyek; 232 dari 232 `pemberi_ref` (kode IATI) tidak menunjuk organisasi; `proyek_kecocokan` terisi 2% [F].
- **Pengguna dan peran.** Semua yang login; KR.
- **Isi layar.** Profil proyek: PN "Pendanaan"; profil organisasi: PN "Mendanai" untuk pemberi. Pemberi asing menjadi simpul organisasi.
- **Data.** `pendanaan.proyek_id`, `proyek.pendanaan_ids`, `pemberi_ref` diselesaikan ke `organisasi.json`.
- **Manfaat per tier.** Daftar pendanaan dasar untuk semua yang login; kecocokan skema-proyek sebagai alat analisis menurut C-23 [U].
- **Ukuran berhasil.** Cakupan naik dari 14% (proyek) dan 0 dari 232 (pemberi). Prasyarat FN-M04.

### FN-L04 Sambung riset, pakar, kampus, inovasi (JM-L04)
- **Masalah.** `riset.pakar` 1% dari 2.987; `pakar_riset.orang_id` 0% dari 250; inovasi tidak tampil di profil kampus; hanya 12 organisasi berkategori perguruan tinggi [F].
- **Pengguna dan peran.** Semua yang login; KR.
- **Isi layar.** Profil orang: PN "Riset"; profil kampus: PN "Riset" dan "Inovasi"; pakar tertaut ke orang; tautan masuk dari profil.
- **Data.** `riset.pakar`, `pakar_riset.orang_id`, `riset_kampus.organisasi_id`, `inovasi.lembaga_id` dan sisi balik.
- **Manfaat per tier.** Semua yang login; kontak pakar hanya anggota menurut C-23.
- **Ukuran berhasil.** Tautan masuk riset, pakar_riset, inovasi naik dari 0%.

### FN-L05 Tautan berita ke entitas dan wilayah (JM-L05)
- **Masalah.** 65% berita (567 dari 866) tak tertaut entitas; wilayah terisi 24% [F].
- **Pengguna dan peran.** Semua yang login; KR.
- **Isi layar.** Linimasa berita di profil organisasi, proyek, orang, wilayah.
- **Data.** `berita.*_ids` dan `berita.wilayah` dengan sisi balik.
- **Manfaat per tier.** Semua yang login.
- **Ukuran berhasil.** Cakupan naik dari 35% (berentitas) dan 24% (berwilayah).

### FN-L06 Tingkat kabupaten pada proyek (JM-L06)
- **Masalah.** 0 proyek punya kabupaten atau kota; rencana menuntut profil 514 kabupaten dan kota [F].
- **Pengguna dan peran.** Semua yang login.
- **Isi layar.** Profil proyek menampilkan kabupaten; halaman provinsi menampilkan daftar kabupaten; radar kabupaten tersambung.
- **Data.** `kode_kab` proyek.
- **Manfaat per tier.** Semua yang login.
- **Ukuran berhasil.** Cakupan `kode_kab` naik dari 0%.

### FN-L07 Perluas indeks pencarian global (JM-L07)
- **Masalah.** Pencarian tidak mengindeks riset (2.987), kalender (41), pusat studi, lowongan, hukum [F].
- **Pengguna dan peran.** Semua yang login.
- **Isi layar.** Hasil pencarian global mengelompok per jenis dengan ikon; kosong: "Tidak ditemukan" dengan satu aksi.
- **Data.** `scripts/pipa/indeks_cari.mjs` menambah riset, kalender, pusat studi, lowongan, hukum.
- **Manfaat per tier.** Semua yang login.
- **Ukuran berhasil.** Pencarian "ITB surya" menemukan makalah; lima jenis baru terindeks.

### FN-L08 Gerbang tautan dua arah (JM-L08)
- **Masalah.** Gerbang tautan hanya mencakup 9 hitungan; 6 `organisasi_id` mati di `penyedia_teknologi`, 29 `wilayah_pln_id` tak cocok [F].
- **Pengguna dan peran.** Gerbang; pemeriksa penulis-gerbang.
- **Isi layar.** Tidak ada.
- **Data.** Uji gagal bila rujukan satu arah atau cakupan turun dari garis dasar.
- **Manfaat per tier.** Tidak berlaku.
- **Ukuran berhasil.** Gerbang meliputi pasangan di FN-L01 sampai L06; mutu tidak boleh melemah untuk meloloskan kerja.

**Fungsi akhir seri L.** Dari satu profil pengguna bisa melompat ke profil terkait dan kembali (proyek, organisasi, orang, regulasi, berita, pendanaan, riset, wilayah); pencarian menemukan semuanya; setiap data baru tertaut dua arah atau ditolak gerbang.

---

## 7. Seri W: METI Wilayah

### FN-W01 Skema kegiatan Wilayah (JM-W01)
- **Masalah.** `meti-wilayah.json` hanya hitungan per provinsi; `orang.meti_wilayah` 0%; Wilayah tidak bisa mengelola datanya (K23) [F].
- **Pengguna dan peran.** WL menulis dalam provinsinya; AD dan SA semua provinsi; PG membaca.
- **Isi layar.** Tidak ada layar sendiri; menjadi dasar FN-W02 dan FN-W03.
- **Data.** Kegiatan, berita, agenda, dokumen, pengurus per provinsi; semua lewat `hak.js` dengan `cakupan_prov`; migrasi idempoten.
- **Manfaat per tier.** Tidak dijual; hak peran.
- **Ukuran berhasil.** Uji D1: akun `wilayah` provinsi lain DITOLAK untuk tiap tabel; migrasi jalan dua kali; migrasi-idempoten dan hak-auditor tanpa temuan tinggi.

### FN-W02 Admin Wilayah (JM-W02)
- **Masalah.** Ketua Wilayah belum punya halaman kerja; admin hanya di Pusat [F].
- **Pengguna dan peran.** WL (provinsinya saja); AD dan SA (semua).
- **Isi layar.** Rute `/wilayah-admin`. JS: provinsi, jumlah kegiatan, agenda mendatang. KA: kegiatan, agenda mendatang, anggota provinsi (agregat), berita, dokumen. PN: tab Kegiatan, Agenda, Notulen, Foto, Berita, Anggota; tiap tab tabel `.jm-tabel` dengan Tambah, Ubah, Batalkan. Pusat melihat semua provinsi lewat pemilih provinsi. Kosong: strip "Belum ada kegiatan" dengan satu aksi "Tambah kegiatan".
- **Data.** Tabel FN-W01; foto dokumentasi agenda privat di R2 (K20).
- **Manfaat per tier.** Hak peran WL, bukan tier.
- **Ukuran berhasil.** Ketua Wilayah mengelola kegiatan, agenda, notulen, foto, berita, anggota provinsinya sendiri, setara admin Pusat tetapi terbatas provinsi; security-reviewer, guard-api, inp-reviewer tanpa temuan tinggi; uji peran salah lulus.

### FN-W03 Papan publik per Wilayah (JM-W03)
- **Masalah.** Halaman Wilayah hanya hitungan; tak ada kegiatan, rapor, orang, organisasi, proyek provinsi [F].
- **Pengguna dan peran.** Semua yang login (di balik login, D19).
- **Isi layar.** JS: status wilayah (berdiri, segera, rencana), jumlah kegiatan, proyek. KA: kegiatan, anggota agregat, organisasi, proyek, kapasitas terpasang. PN: Kegiatan dan agenda, Rapor provinsi, Orang, Organisasi, Proyek. CH dan CK baku. Provinsi tanpa Wilayah berdiri: strip "Belum berdiri" dengan status (segera atau rencana).
- **Data.** `orang.meti_wilayah` terisi dari sumber; kegiatan FN-W01; rapor provinsi yang ada.
- **Manfaat per tier.** Papan dasar untuk semua yang login; laporan provinsi lengkap untuk anggota daerah [U].
- **Ukuran berhasil.** 38 provinsi punya papan; `orang.meti_wilayah` naik dari 0%; tangkapan layar 1440 dan 390 lulus.

**Fungsi akhir seri W.** Ketua Wilayah memperbarui kegiatan provinsinya sendiri tanpa lewat admin Pusat; anggota daerah dan pengunjung melihat papan hidup per provinsi; Pusat melihat seluruhnya.

---

## 8. Seri N: anggota

### FN-N01 Status tamu dan tier di akun (JM-N01)
- **Masalah.** Setelah D19 semua yang masuk melihat data sama; non-anggota praktis tidak ada [F].
- **Pengguna dan peran.** AD dan SA mengatur status dan tier; semua akun memilikinya.
- **Isi layar.** Tab Akun admin: kolom status akun (`menunggu | aktif | nonaktif`) dan kolom keanggotaan atau tier dari `akun_tier` (`tamu` atau kode tier DT); menu akun pengguna menampilkan tier sendiri dengan pil.
- **Data.** Migrasi 0042: tabel pendamping `akun_tier` (status `tamu` dan tier mengikuti tangga iuran, D22; CHECK `akun.status` tidak diubah); matriks `hak.js` diperluas; tiap sel punya uji tolak.
- **Manfaat per tier.** Dasar semua fitur terkunci.
- **Ukuran berhasil.** Akun tamu dan tiap tier bisa dibuat dan diubah; migrasi-idempoten, hak-auditor, security-reviewer tanpa temuan tinggi.

### FN-N02 Potret berlapis dan gerbang tier (JM-N02)
- **Masalah.** Lapis `potret_anggota`, kontak, dan lain-lain ada di matriks tetapi tidak membedakan isi; tidak ada dataset khusus anggota [F].
- **Pengguna dan peran.** Semua yang login; server menentukan isi menurut tier.
- **Isi layar.** Tidak ada layar baru; kartu yang terkunci memakai FN-N03.
- **Data.** Potret dibangun per lapis (data dasar semua login; kontak, data pasar rinci, unduhan CSV atau JSON, laporan lengkap, alat analisis hanya anggota menurut tier, C-23); gerbang tier di Worker; data tidak dikirim ke klien bila terkunci.
- **Manfaat per tier.** Menurut peta di FN-N03.
- **Ukuran berhasil.** Uji peran salah DITOLAK per dataset terkunci; potret lapis publik dan anggota lolos pemindai pola surel dan telepon; ukuran potret dalam batas 2 MB.

### FN-N03 Layar manfaat dan ajakan naik tier (JM-N03)
- **Masalah.** Anggota tidak melihat nilai tambah; fitur terkunci tidak menjelaskan manfaat [F].
- **Pengguna dan peran.** TM, tier rendah; AN.
- **Isi layar.** Halaman "Manfaat keanggotaan". JS: tier kamu sekarang dan satu kalimat nilainya. KA: manfaat terbuka, manfaat tier berikutnya. PN: tabel manfaat per tier (di bawah); kartu terkunci di fitur lain menampilkan ikon gembok, satu kalimat manfaat, dan satu aksi "Lihat cara naik tier" yang menuju `/daftar` atau Sekretariat. Tanpa pembayaran online baru (D20 tetap). CH: cara tier ditentukan. Teks wajib melewati i18n-guard dan selera-angka.
- **Data.** `keanggotaan.json` (tarif tampil bersumber, tanggal 1 Jul 2026).
- **Manfaat per tier.** Peta [U] (tangga iuran tidak diubah tanpa keputusan pengurus; tier bawah tidak boleh kosong nilai):

| Manfaat digital | `tamu` | `pelajar` | `individu` | `ngo` | `usaha_kecil` | `usaha_besar` | `utama` |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Ringkasan rapor atau insight (M01) | ya | ya | ya | ya | ya | ya | ya |
| Rapor lengkap dan lembar data | - | - | ya | ya | ya | ya | ya, plus pesanan analisis |
| Unduh CSV atau JSON bersitasi | - | terbatas | ya | ya | ya | ya | ya, API terbatas |
| Papan advokasi dan komentar (M02) | baca | baca | baca dan komentar | komentar | komentar | komentar dan usul posisi | kursi kelompok kerja kebijakan |
| Webinar intelijen kuartalan | - | rekaman | ya | ya | ya | ya | ya, pertanyaan prioritas |
| Radar proyek dan tender (M04) | ringkasan | ringkasan | ringkasan | ya | ya | ya, notifikasi awal | ya, ruang data dan pendukung |
| Ajuan proyek ke Desk Siap Bank | - | - | - | ya | ya | ya | ya, prioritas |
| Temu bisnis dan penjadwal (M07) | - | - | ya | ya | ya | ya | ya, kuota lebih besar |
| Diskon tiket seminar dan ConEx | - | ya | ya | ya | ya | ya | ya, slot bicara |
| Kelompok kerja | - | - | peninjau | anggota | anggota | anggota | anggota, calon ketua |
| Akademi dan ujian (M06) | modul dasar | modul penuh, diskon uji | diskon uji | diskon uji | diskon uji staf | diskon uji staf | diskon uji dan kelas khusus |
| Tanda METI Terpercaya (M03) | - | - | - | - | ya (prioritas) | ya | ya |
| Klaim profil dan portofolio | - | - | profil pakar | profil organisasi | profil dan proyek | profil dan proyek | profil, proyek, halaman khusus |
| Lowongan dan magang | baca | magang | pasang | pasang | pasang | pasang | pasang unggulan |
| Logo dan branding di situs | - | - | - | logo | logo, berita | logo, berita | logo, berita, branding acara |
| Lencana dan KTA digital | - | KTA | KTA | KTA | KTA badan usaha | KTA badan usaha | KTA, QR verifikasi |
| Pemberitahuan (lonceng, langganan) | newsletter | ya | ya | ya | ya | ya | ya, ringkasan khusus |

- **Ukuran berhasil.** Tiap fitur terkunci menjelaskan manfaat dan cara naik tier; tidak ada kartu terkunci tanpa kalimat manfaat; i18n-guard dan selera-angka tanpa temuan.

**Fungsi akhir seri N.** Orang yang baru masuk melihat apa yang ia dapat sekarang dan apa yang terbuka bila naik tier; data yang terkunci benar-benar tidak sampai ke peramban; admin mengatur status dan tier dari satu tempat.

---

## 9. Seri M: dua belas program

Isi tiap program diambil dari bagian "Modul platform" riset benchmark; penomoran mengikuti `TIKET` (lihat `RISET` 5.3). Semua KPI adalah usulan [U]; baseline diukur dulu (basis 11 Nov 2026) dan disetujui Pengurus Harian. Tiap program bergantung pada seri N (FN-N01 sampai N03). Peluncuran yang mengikat organisasi menunggu C-01 (bagian 1.2 butir 9).

### FN-M01 Pusat Data dan Intelijen Pasar (JM-M01)
- **Masalah.** METI punya bahan baku terluas tetapi tidak ada produk terbit berkala berbrand; angka bentrok (kapasitas EBT 13,86 lawan 14,44 GW; bauran 2025 15,75% lawan 15,9%); RUPTL butuh 4,26 GW per tahun lawan laju historis 0,59 GW [F].
- **Pengguna dan peran.** AN, tier menurut peta; penyunting (sel PG atau KR); Dewan Pakar meninjau.
- **Isi layar.** `/rapor` berkala: JS (satu kalimat temuan, tanggal beku), KA (bauran, kapasitas, kebutuhan tambahan per tahun, selisih angka METI lawan angka resmi), PN (grafik tren dari `target_realisasi.json` dan `ruptl.json`, kolom per teknologi), CH (tiap grafik), CK (tiap grafik). Lembar data per teknologi. `/data`: unduh CSV atau JSON bersitasi untuk anggota. Alur penerbitan beku: kurasi, tinjauan Dewan Pakar, beku, terbit.
- **Data.** `target_realisasi.json`, `ruptl*.json`, `peluang.json`, `harga_komponen.json`; catatan rekonsiliasi angka; tanggal beku. Sumber C-24 tidak dijadikan produk berbayar.
- **Manfaat per tier.** `tamu` dan `pelajar`: ringkasan (`pelajar` unduh terbatas). `individu`: rapor lengkap, lembar data, unduhan bersitasi, webinar. `ngo` ke atas: sama, `utama` ditambah pesanan analisis dan API terbatas. Lisensi berbayar menunggu C-01.
- **Ukuran berhasil [U].** Edisi terbit tepat tanggal (target 4 dari 4 pada 2028; 2 edisi pada 2027); unduhan atau pembaca per edisi; jumlah lisensi berbayar; jumlah kutipan oleh ESDM atau media; selisih angka METI lawan resmi yang terdokumentasi.

### FN-M02 Pelacak Kebijakan dan Advokasi (JM-M02)
- **Masalah.** 22 substansi RDPU dan 27 butir posisi belum menjadi papan status untuk anggota; kelompok kerja tanpa ruang; tidak ada metrik "posisi yang masuk" [F].
- **Pengguna dan peran.** AN (baca dan komentar menurut tier); PG dan KR mengelola; WL membaca.
- **Isi layar.** `/advokasi`: JS (status posisi, tanggal), KA (butir total, masuk naskah, menunggu, tenggat terdekat), PN (papan 22 butir x status x pasal x PIC x tenggat; pelacak status Raperpres; polling isu; ruang kelompok kerja dengan notulen dan tenggat), CH, CK. Kolom `posisi_meti` di regulasi dengan `pemilik_posisi` (posisi resmi, usulan asosiasi, bahan pihak lain). Lembar keputusan cetak untuk RDPU.
- **Data.** `posisi_meti.jsonl`, regulasi dan peta dampak (bergantung FN-U07); dokumen internal baru tayang setelah pemilik menyetujui (bagian 13, butir 7).
- **Manfaat per tier.** `tamu` dan `pelajar`: baca. `individu`: baca dan komentar. `ngo` dan `usaha_kecil`: komentar; `usaha_besar` usul posisi; `utama` kursi kelompok kerja kebijakan.
- **Ukuran berhasil [U].** Persentase butir yang masuk naskah akhir; jumlah audiensi atau RDPU tercatat; jumlah masukan tertulis; waktu respons konsultasi publik (hari); jumlah anggota memberi masukan per posisi.

### FN-M03 Skema Pemasang Terpercaya (JM-M03)
- **Masalah.** Tidak ada skema akreditasi atau kode etik konsumen; PLTS 100 GW butuh puluhan ribu pemasang; kegagalan awal merusak reputasi [F, U].
- **Pengguna dan peran.** AN badan usaha mendaftar; peninjau skema (sel PG) dan komite memutus; konsumen mengadu.
- **Isi layar.** `/pemasang`: direktori bersertifikat dengan skor keyakinan; JS, KA (terdaftar, aduan diselesaikan dalam 30 hari %, pelanggaran ditindak), PN (daftar, alur pendaftaran: dokumen, uji, keputusan komite; formulir pengaduan konsumen), CH, CK. Tanda digital QR di KTA badan usaha.
- **Data.** Pendaftaran, keputusan, aduan (disimpan 24 bulan sesudah putusan, C-26), tanda; mengikuti pola KTA. Menunggu nasihat hukum dan persetujuan Pengurus Harian untuk "tanda METI" (C-01).
- **Manfaat per tier.** `usaha_kecil`: tanda METI Terpercaya prioritas; `usaha_besar` dan `utama`: ya. Tier lain: daftar dibaca semua yang login. Biaya pendaftaran bertahap menurut kapasitas terpasang [U, perlu nasihat hukum].
- **Ukuran berhasil [U].** Terdaftar; aduan diselesaikan dalam 30 hari (%); pelanggaran ditindak; proyek PLTS koperasi desa yang memakai pemasang terdaftar. Rencana tahun: 2027 draf kode etik, 2028 pilot 30 pemasang, 2029 daftar publik dan jalur aduan, 2030 pengakuan ESDM atau PLN [U].

### FN-M04 Radar Proyek dan Desk Siap Bank (JM-M04)
- **Masalah.** RUPTL memuat 42.569 MW EBT; JETP termobilisasi US$3,1 miliar dari komitmen US$20 miliar; radar, lelang, tender, peluang terpisah dan tanpa alur pengajuan [F].
- **Pengguna dan peran.** AN organisasi mengajukan; pengurus bidang pendanaan memutus; PG.
- **Isi layar.** `/pipeline`: gabungan radar, lelang, tender, peluang. JS, KA (proyek lolos uji kesiapan, MW, nilai), PN (tabel pipeline; skor kesiapan lahan, izin, jaringan, tarif atau offtake, EPC; alur ajuan proyek; ruang data privat per proyek), CH (skor), CK. Lonceng pemberitahuan.
- **Data.** `radar`, `lelang`, `proyek_tender.js`, `peluang`, `ruptl_pengembang.json`; ajuan `org_ajuan`; bergantung FN-L01 dan FN-L03.
- **Manfaat per tier.** `tamu` dan tier rendah: ringkasan. `ngo` ke atas: penuh; `usaha_besar`: notifikasi awal; `utama`: ruang data dan pendukung; ajuan ke Desk Siap Bank untuk `ngo` ke atas, `utama` prioritas.
- **Ukuran berhasil [U].** Proyek lolos uji kesiapan; MW dan nilai yang bertemu pendana; proyek mencapai financial close; waktu rata-rata dari terdaftar ke close.

### FN-M05 Koperasi Desa (JM-M05)
- **Masalah.** Skema 80 GW lewat Koperasi Desa Merah Putih belum punya pusat belajar; Perpres belum terbit [?].
- **Pengguna dan peran.** Fasilitator wilayah (sel WL), AN, KR.
- **Isi layar.** `/desa` diperluas: peta KDKMP dengan tipologi desa; kalkulator PLTS komunal; repositori pembelajaran dan direktori kontributor; pencatatan kinerja pilot tanpa data pribadi. JS, KA (koperasi dilatih, MWp terpasang di pilot, pilot beroperasi 24 bulan %), PN, CH (kalkulator), CK.
- **Data.** `desa_energi`, `desa_akses`, `desa_listrik`; tipologi dari ALGORITMA; hasil kalkulator berlabel EST.
- **Manfaat per tier.** Peta dan kalkulator dasar untuk semua yang login; repositori lengkap dan direktori kontributor menurut C-23 [U].
- **Ukuran berhasil [U].** Koperasi dilatih; MWp di bawah pilot; pilot beroperasi 24 bulan; biaya operasi per kWh; desa listrik baru.

### FN-M06 Sertifikasi dan Akademi (JM-M06)
- **Masalah.** Akademi hanya 6 modul dan kuis 75%; tidak ada pelatihan bersertifikat [F].
- **Pengguna dan peran.** AN peserta; asesor (sel KR, LSP mitra); PG.
- **Isi layar.** `/akademi` diperluas: jalur kompetensi, pendaftaran ujian, riwayat sertifikat, lencana yang dapat diverifikasi QR, tautan ke lowongan (`kerja`). JS, KA (lulus, penempatan kerja 6 bulan %), PN, CH, CK.
- **Data.** `akademi.json`, `kerja`, lencana; biaya uji menunggu persetujuan BNSP dan C-01.
- **Manfaat per tier.** `tamu`: modul dasar. `pelajar`: modul penuh dan diskon uji. `individu` dan seterusnya: diskon uji; `utama` kelas khusus.
- **Ukuran berhasil [U].** Peserta lulus ujian; penempatan kerja dalam 6 bulan (%); perusahaan anggota memakai lulusan; pendapatan biaya uji.

### FN-M07 Forum Bisnis dan Misi Dagang (JM-M07)
- **Masalah.** ConEx 2026 menarik 944 delegasi dan 21 MoU tetapi temu B2B tidak dilacak [F].
- **Pengguna dan peran.** AN perusahaan; penyelenggara (sel PG).
- **Isi layar.** `/temu`: profil penawaran dan kebutuhan (teknologi, provinsi, kapasitas), permintaan temu, penjadwal, tindak lanjut MoU; tiket dan RSVP lewat `event`. JS, KA (temu terjadwal, MoU berlanjut %), PN, CH, CK.
- **Data.** Profil, permintaan, jadwal; kuota menurut tier.
- **Manfaat per tier.** `individu` ke atas: temu; `utama` kuota lebih besar dan slot bicara.
- **Ukuran berhasil [U].** Temu terjadwal per delegasi; MoU berlanjut ke kontrak dalam 12 bulan (%); pendapatan sponsor; skor kepuasan.

### FN-M08 METI Wilayah 38 Provinsi (JM-M08)
- **Masalah.** Hanya 6 METI Wilayah berdiri; individu luar Jawa nyaris tidak terwakili [F].
- **Pengguna dan peran.** WL, AN daerah.
- **Isi layar.** Papan 38 provinsi menggabungkan `meti-wilayah` dan `wilayah` dengan status berdiri, segera, rencana; memakai seri W. JS, KA, PN (peta dan tabel), CH, CK.
- **Data.** Seri W; SK dan pelantikan dicatat.
- **Manfaat per tier.** Papan dasar semua yang login; laporan provinsi dan kuota perkenalan lokal untuk anggota daerah.
- **Ukuran berhasil [U].** METI Wilayah aktif (punya agenda dan laporan); proporsi anggota di luar Jawa; kegiatan per wilayah; kontribusi iuran daerah.

### FN-M09 Hub Rantai Pasok (JM-M09)
- **Masalah.** Data komponen ada tetapi kapasitas pabrik belum tunggal; tak ada produk terverifikasi [F].
- **Pengguna dan peran.** AN pemasok mendaftar; verifikator (sel KR); semua yang login membaca.
- **Isi layar.** `/produk` terverifikasi dari data rantai pasok dan TKDN; formulir pendaftar produk. JS, KA (terdaftar, terverifikasi, bersertifikat uji, pangsa TKDN), PN, CH, CK.
- **Data.** `rantai-global`, `dagang_komponen.json`, `harga_komponen.json`, TKDN; sumber C-24 (GEM, IRENA, Comtrade) tidak dijadikan produk berbayar.
- **Manfaat per tier.** Daftar dibaca semua yang login; pemasok `usaha_kecil` ke atas mendapat tempat prioritas.
- **Ukuran berhasil [U].** Produk terdaftar dan terverifikasi; persentase bersertifikat uji; pangsa TKDN proyek yang dipantau. Bergantung pada FN-M03 dan FN-M01.

### FN-M10 Diplomasi Energi (JM-M10)
- **Masalah.** Peran METI di forum internasional dan kerja sama selatan-selatan tidak terdokumentasi [F].
- **Pengguna dan peran.** Hubungan internasional (sel PG), AN.
- **Isi layar.** `asean` diperluas: pembanding kebijakan ASEAN, papan kerja sama selatan-selatan, direktori kontributor. JS, KA, PN, CH, CK.
- **Data.** `asean.json`, `asean_energi.json`; kontributor mendaftar lewat antrean kurator.
- **Manfaat per tier.** Semua yang login membaca; direktori kontributor lengkap menurut C-23.
- **Ukuran berhasil [U].** Forum internasional dengan peran METI; dana donor dimobilisasi; produk atau jasa Indonesia di daftar kerja sama selatan-selatan.

### FN-M11 METI Institute (JM-M11)
- **Masalah.** Kajian, aset riset, hibah, dan magang tersebar [F].
- **Pengguna dan peran.** Mahasiswa, AN, pakar, Dewan Pakar.
- **Isi layar.** `/riset`: kajian, aset riset, hibah, profil pakar, magang ke `kerja`. JS, KA (kajian terbit, magang, proyek riset bersama), PN, CH, CK.
- **Data.** `pustaka`, `aset_riset`, `hibah_riset`, `foto_pakar`; tautan riset dari FN-L04.
- **Manfaat per tier.** `pelajar`: akademi dan magang; semua yang login membaca kajian; kajian lengkap menurut C-23.
- **Ukuran berhasil [U].** Kajian terbit dan dikutip; mahasiswa anggota; magang; proyek riset bersama industri; konversi mahasiswa ke profesional.

### FN-M12 Klub Pembeli Hijau (JM-M12)
- **Masalah.** Permintaan listrik hijau (industri, data center, KEK) belum bertemu pasokan; Roadmap A10 menunggu minimal 10 pembeli [F, ?].
- **Pengguna dan peran.** AN pembeli; PG.
- **Isi layar.** `/pembeli`: profil kebutuhan beban per kawasan, anonim bila diminta, cocok ke pipeline FN-M04. JS, KA, PN, CH, CK.
- **Data.** Profil kebutuhan; `pasar-listrik-hijau`; anonimisasi di server.
- **Manfaat per tier.** Tier pembeli (usulan meniru ACP) dengan iuran tambahan, menunggu C-01 [U].
- **Ukuran berhasil [U].** Pembeli anggota; MW kontrak hijau yang difasilitasi; kontrak captive hijau; volume kredit atau REC.

---

## 10. Fungsi akhir tiap integrasi

Satu baris per integrasi: apa yang bisa dilakukan pengguna di akhir yang sebelumnya tidak bisa, dan bukti yang menutupnya.

| Integrasi | Fungsi akhir | Bukti |
| --- | --- | --- |
| Bot panen ke PR ke tayang (T01 sampai T06) | Pemilik menerima satu PR berisi selisih tiap putaran; tidak ada data yang tayang tanpa gerbang | `workflow_dispatch` lulus; uji gerbang unggah |
| Denyut ke panel kesegaran (T07, T08) | Admin melihat 178 dataset dengan umur menurut sumber dan sumber yang `blokir` atau `perlu_kunci` | uji ambang; tangkapan layar |
| Teks regulasi ke GitHub (U01 sampai U05) | Tiap regulasi punya teks berpasal yang bisa dikutip, nomor terverifikasi, dan peringatan non-otentik | 622 berkas valid |
| Relasi dan status berlaku (U06) | Pengguna menanyakan status aturan pada tanggal tertentu dan melihat rantai cabut dan ubah dua arah | uji acuan |
| Peta dampak (U07, L02) | Dari satu aturan terlihat proyek, organisasi, teknologi, wilayah terdampak; dari satu proyek terlihat aturannya | cakupan proyek ber-regulasi |
| Tautan data (L01 sampai L06, L08) | Lompat dua arah antar profil; gerbang menolak tautan satu arah | laporan sebelum-sesudah; gerbang |
| Pencarian global (L07) | Satu kotak menemukan riset, kalender, pusat studi, lowongan, hukum | uji indeks |
| Wilayah (W01 sampai W03, M08) | Ketua Wilayah mengelola provinsinya sendiri; papan 38 provinsi hidup | uji D1: wilayah lain DITOLAK |
| Tier (N01 sampai N03) | Tamu melihat apa yang terbuka bila naik tier; data terkunci tidak sampai klien | uji peran salah per dataset |
| M01 | Anggota mengunduh lembar data bersitasi dari edisi beku | alur penerbitan; uji tier |
| M02 | Anggota melihat status tiap butir posisi METI dan memberi masukan | uji peran |
| M03 | Konsumen memeriksa pemasang terdaftar dan mengadu; badan usaha melamar tanda | uji alur ajuan (setelah C-01) |
| M04 | Pengembang mengajukan proyek dan mendapat skor kesiapan serta ruang data privat | uji alur ajuan |
| M05 | Koperasi menghitung PLTS komunal dan membaca pelajaran pilot | uji kalkulator |
| M06 | Peserta mendaftar ujian, lulus, dan menerima lencana yang dapat diverifikasi | uji alur (setelah C-01) |
| M07 | Perusahaan mengajukan temu dan mendapat jadwal sesuai kuota tier | uji kuota |
| M09 | Pembeli mencari produk terverifikasi; pemasang mendaftarkan produk | uji alur ajuan |
| M10 | Anggota membandingkan kebijakan ASEAN dan mendaftar sebagai kontributor | uji antrean kurator |
| M11 | Mahasiswa menemukan kajian, hibah, dan magang di satu tempat | uji tautan kerja |
| M12 | Pembeli mendaftarkan kebutuhan beban (anonim bila diminta) dan dicocokkan ke pipeline | uji anonimisasi |

---

## 11. Peta tiket ke fitur

Setiap tiket seri S, T, U, L, W, N, M punya tepat satu fitur dengan nomor sama (52 pasang). Seri Z tidak punya fitur.

| Seri | Tiket | Fitur | Bagian PRD |
| --- | --- | --- | --- |
| S | JM-S01 sampai JM-S11 | FN-S01 sampai FN-S11 | 3 |
| T | JM-T01 sampai JM-T08 | FN-T01 sampai FN-T08 | 4 |
| U | JM-U01 sampai JM-U07 | FN-U01 sampai FN-U07 | 5 |
| L | JM-L01 sampai JM-L08 | FN-L01 sampai FN-L08 | 6 |
| W | JM-W01 sampai JM-W03 | FN-W01 sampai FN-W03 | 7 |
| N | JM-N01 sampai JM-N03 | FN-N01 sampai FN-N03 | 8 |
| M | JM-M01 sampai JM-M12 | FN-M01 sampai FN-M12 | 9 |
| Z | JM-Z01, JM-Z02 | tidak ada (penutup) | |

Ketergantungan fitur mengikuti `TIKET` bagian 3: S dahulu; T01 ke T02 sampai T05 ke T06; U01 ke U06 ke U07; L01 sampai L06 ke L08; U07 butuh L02; W01 ke W02 ke W03 ke M08; N01 ke N02 ke N03 ke seluruh seri M; M04 butuh L01 dan L03; M02 butuh U07.

## 12. Ukuran keberhasilan paket

Dari baseline [F] 11 Nov 2026; angka sasaran yang bergantung metode ditetapkan di `ALGORITMA`.

| Ukuran | Baseline | Sasaran |
| --- | --- | --- |
| Antara di keluaran panen | masih ada (3 pemanen) | 0 |
| Dataset terpantau kesegarannya | 16 dari 178 | 178 dari 178 |
| Sumber berjadwal | 0 | 60 |
| Teks regulasi di GitHub | 0 | 622 |
| Target nasional regulasi kosong | 50 dari 94 | laporan cakupan per target |
| Proyek ber-regulasi | 4% | di ALGORITMA bagian dampak |
| Proyek berorganisasi | 35% | naik; 0 klaim satu arah |
| Proyek berpendanaan | 14% | naik |
| Proyek berkabupaten | 0% | naik |
| Berita tertaut entitas | 35% | naik |
| Rute API dengan uji integrasi | 23 dari sekitar 200 | semua |
| Layar yang membedakan isi anggota | 0 | tiap fitur terkunci menjelaskan manfaat |

## 13. Catatan untuk induk

Hal yang bertentangan dengan `KEPUTUSAN-METI` atau belum diputus. Tidak diputuskan di sini; kerja jalan dengan bawaan.

1. **K24 lawan D22: jumlah tier.** K24 menyebut tiga tier (individu, mahasiswa, perusahaan); D22 menetapkan tier mengikuti tangga iuran yang enam tingkat. Dokumen memakai kode tier DT (`pelajar`, `individu`, `ngo`, `usaha_kecil`, `usaha_besar`, `utama`) dan tabel enam kolom di FN-N03; pemetaan penyebutan K24 ke kode DT ditulis sekali di GLOSARIUM §5. Yang masih perlu konfirmasi pemilik: apakah `ngo` masuk "perusahaan" (bawaan: ya).
2. **D19 lawan pengaduan dan verifikasi di M03 dan M06 (diputuskan, C-27).** D19 hanya mengecualikan `/daftar`, verifikasi KTA, langganan. Pengadu memakai akun tamu gratis; verifikasi lencana QR (pemasang, sertifikat) wajib login dengan peran LOGIN eksplisit dan BUKAN pengecualian D19 (`GET /api/sertifikat/v/:token`, tanpa sesi 401).
3. **D19 lawan `FITUR-STRATEGIS`.** Prinsip "halaman publik bisa ditemukan mesin pencari" berbenturan dengan `robots.txt` Disallow semua (D19). Paket ini tidak membuat halaman publik baru.
4. **Asal akun tamu (D22) dan tenggang (C-28, diputuskan).** Akun `tamu` dibuat admin, atau terjadi ketika anggota yang disetujui `/daftar` tanpa lunas melewati tenggang 30 hari (tier terendah berbayar untuk kategorinya (`pelajar` bagi mahasiswa, `individu` bagi lainnya termasuk organisasi) selama tenggang, naik ke tier pilihan sesudah lunas, lewat tenggang turun ke `tamu` tanpa menghapus data). Masih usulan [U]: tenggang 30 hari bagi iuran yang lewat masa berlaku (`pelajar` tidak punya iuran tahunan di data).
5. **Peran fungsi seri M.** Penyunting, peninjau skema, asesor, penyelenggara, fasilitator wilayah, pembeli, verifikator, hubungan internasional ada di riset benchmark; `hak.js` hanya tujuh peran. Bawaan: sel matriks pada peran yang ada. Perlu keputusan bila diinginkan peran akun baru.
6. **Persetujuan PR data-bot (K21).** PR yang digabung ke `main` tayang; unggah potret ke R2 produksi oleh pemilik (TIKET). Belum diputus siapa yang menggabung PR harian dan berapa sering. Bawaan: tinjau manual oleh pemilik, PR harian boleh ditumpuk.
7. **Dokumen internal METI di M02.** Riset arsip internal menahan penayangan dokumen internal sampai pemilik menyetujui; tidak ada kode C untuk itu. Bawaan: tidak ditayangkan.
8. **Persetujuan kegiatan Wilayah (K23).** K23 menyebut Wilayah setara Pusat tetapi tidak menyebut persetujuan. Bawaan: kegiatan terbit langsung; Pusat (AD, SA) dapat menyembunyikan dengan alasan tercatat. Cakupan "anggota provinsinya" di TIKET W02 diartikan melihat dan mencatat keaktifan, bukan mengubah peran atau iuran [?].
9. **Frekuensi jadwal lawan frekuensi sumber.** Daftar jadwal di `TIKET` T02 sampai T05 sebagian berbeda dari frekuensi nyata di katalog (`RISET` 2.3). Tidak merusak apa pun karena bot memakai sinyal perubahan; ditetapkan akhir di `data/sumber_jadwal.json`.
10. **Lisensi GEM.** Katalog menulis CC BY 4.0, LISENSI-DATA menyebut bersyarat nonkomersial; C-24 menahan produk berbayar. Perlu pembacaan lisensi sebelum S33 dipakai di produk apa pun.
11. **Kelas `ak-dummy` di `public/direktori.css`.** Masih ada dari porting walau K15 membatalkan tombol dummy; FN-S09 hanya membersihkan DESIGN-SYSTEM. Perlu tiket kecil bila ingin dibersihkan.
12. **C-21 dan lonceng.** Surel otomatis, pengingat iuran, perpanjangan KTA tidak dikerjakan; program memakai lonceng yang sudah ada di kode. Pemicu lonceng baru (notifikasi awal pipeline, tenggat posisi) tidak punya tiket sendiri; dikerjakan di tiket program masing-masing.
