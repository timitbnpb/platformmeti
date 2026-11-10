# TIKET penyempurnaan November 2026

Otoritas: `KEPUTUSAN-METI` K21 sampai K26, D19, D21 sampai D23, C-21 sampai C-28. Dokumen isi ada di folder ini. Tiket hanya mengatur siapa dan kapan; aturan umum sama dengan `docs/perencanaan/TIKET.md` §0 dan §1, kecuali tiket berjalan di `main` tanpa worktree (ATURAN X4).

**Untuk pekerja agen.** Satu sesi satu tiket. Baca tiket dan Rujukan. Sentuh hanya Berkas. Yang tidak tertulis: berhenti dan tanya. Subagent tidak commit, push, atau deploy. Migrasi D1 produksi dan unggah R2 produksi dijalankan pemilik.

Singkatan: PRD, ALUR, ALG, DS, DT, KPV, RU = dokumen bernama sama di folder ini. KP = KEPUTUSAN-METI. Ukuran: S kurang dari setengah hari, M sekitar satu hari, L lebih dari satu hari. Semua tiket layar wajib AGENTS.md §5.

## 1. Papan status

| ID | Judul | Pengerja | Tahap | Ukuran | Status |
| --- | --- | --- | --- | --- | --- |
| JM-S01 | Empat perbaikan bug sedang | worker | 1 | M | berjalan |
| JM-S02 | Perbaikan bug rendah terbukti | worker+layar+pipa | 1 | M | belum |
| JM-S03 | Periksa bug rendah yang masih dugaan | peninjau | 1 | S | belum |
| JM-S04 | Buang Antara dari panen | pipa | 1 | S | belum |
| JM-S05 | Satu daftar proyek dan penjelasan selisih | pipa+layar | 1 | M | belum |
| JM-S06 | Bersihkan label internal dan blok kosong | pipa+layar | 1 | S | belum |
| JM-S07 | Rute riwayat dengan METI | worker+layar | 1 | S | belum |
| JM-S08 | Uji integrasi semua rute API | gerbang | 1 | L | belum |
| JM-S09 | Selaraskan DESIGN-SYSTEM dengan K15 dan D21 | induk | 1 | S | belum |
| JM-S10 | Pengerasan masukan Tanya sesuai KPV | worker | 1 | S | belum |
| JM-S11 | 12 jenis MATRIKS tanpa baris KPV §1 dan gerbang sinkronnya | worker+gerbang | 1 | S | belum |
| JM-S12 | Rute yang lebih sempit dari MATRIKS (koreksi untuk kurator, kontak untuk wilayah per provinsi, catatan naskah untuk admin) | worker | 1 | S | belum |
| JM-T01 | Registri sumber dan pustaka panen | pipa | 2 | M | belum |
| JM-T02 | Workflow harian | mekanik+pipa | 2 | M | belum |
| JM-T03 | Workflow mingguan | mekanik+pipa | 2 | M | belum |
| JM-T04 | Workflow bulanan | mekanik+pipa | 2 | M | belum |
| JM-T05 | Workflow kuartalan dan manual | mekanik+pipa | 2 | S | belum |
| JM-T06 | Rangkai potret dan PR ke data-bot | mekanik+pipa | 2 | M | belum |
| JM-T07 | Denyut perubahan di Worker cron | worker+migrasi | 2 | M | belum |
| JM-T08 | Panel kesegaran semua dataset | worker+layar | 2 | M | belum |
| JM-U01 | Ekspor 622 teks regulasi ke GitHub | pipa | 3 | M | belum |
| JM-U02 | Panen 50 target nasional kosong | pipa | 3 | M | belum |
| JM-U03 | Panen 38 Perda RUED | pipa | 3 | M | belum |
| JM-U04 | OCR 51 pindaian dan ulang 125 gagal | pipa | 3 | L | belum |
| JM-U05 | Verifikasi nomor dari halaman pertama | pipa+kurator | 3 | M | belum |
| JM-U06 | Graf relasi dan status berlaku | pipa+worker | 3 | M | belum |
| JM-U07 | Peta dampak regulasi ke entitas | pipa+layar | 3 | L | belum |
| JM-L01 | Tautan proyek ke organisasi | pipa | 4 | M | belum |
| JM-L02 | Tautan proyek ke regulasi dan berita | pipa | 4 | L | belum |
| JM-L03 | Tautan pendanaan ke proyek dan organisasi | pipa | 4 | M | belum |
| JM-L04 | Sambung riset, pakar, kampus, inovasi | pipa+layar | 4 | L | belum |
| JM-L05 | Tautan berita ke entitas dan wilayah | pipa | 4 | M | belum |
| JM-L06 | Tingkat kabupaten pada proyek | pipa+layar | 4 | M | belum |
| JM-L07 | Perluas indeks pencarian global | pipa+layar | 4 | S | belum |
| JM-L08 | Gerbang tautan dua arah | gerbang | 4 | S | belum |
| JM-W01 | Skema kegiatan Wilayah | migrasi+worker | 4 | M | belum |
| JM-W02 | Admin Wilayah | worker+layar | 4 | L | belum |
| JM-W03 | Papan publik per Wilayah | layar | 4 | M | belum |
| JM-N01 | Status tamu dan tier di akun | migrasi+worker | 5 | M | belum |
| JM-N02 | Potret berlapis dan gerbang tier | pipa+worker | 5 | L | belum |
| JM-N03 | Layar manfaat dan ajakan naik tier | layar | 5 | M | belum |
| JM-M01 | Pusat Data dan Intelijen Pasar | worker+layar+pipa | 6 | L | belum |
| JM-M02 | Pelacak Kebijakan dan Advokasi | worker+layar | 6 | L | belum |
| JM-M03 | Skema Pemasang Terpercaya | worker+layar | 6 | L | belum |
| JM-M04 | Radar Proyek dan Desk Siap Bank | worker+layar+pipa | 6 | L | belum |
| JM-M05 | Koperasi Desa | layar+pipa | 6 | M | belum |
| JM-M06 | Sertifikasi dan Akademi | worker+layar | 6 | L | belum |
| JM-M07 | Forum Bisnis dan Misi Dagang | worker+layar | 6 | L | belum |
| JM-M08 | METI Wilayah 38 Provinsi | layar | 6 | M | belum |
| JM-M09 | Hub Rantai Pasok | worker+layar+pipa | 6 | L | belum |
| JM-M10 | Diplomasi Energi | layar | 6 | M | belum |
| JM-M11 | METI Institute | layar+pipa | 6 | M | belum |
| JM-M12 | Klub Pembeli Hijau | worker+layar | 6 | M | belum |
| JM-Z01 | Perbarui Buku Pegangan dan papan tiket | induk | 7 | S | belum |
| JM-Z02 | Review menyeluruh dan uji penuh | peninjau | 7 | M | belum |

## 2. Rincian

### Seri S, stabilkan

#### JM-S01 Empat perbaikan bug sedang
**Tujuan** tutup temuan B-01 sampai B-04 audit 11 Nov (rincian di luar repo). **Berkas** `src/**`, `tests/**`. **Selesai bila** tiap perbaikan punya uji gagal-sebelum, B-03 dan B-04 lewat D1 lokal sungguhan. **Bukti** `npm run uji`. **Pemeriksa** security-reviewer, guard-api, hak-auditor.

#### JM-S02 Perbaikan bug rendah terbukti
**Tujuan** tutup B-05 sampai B-09 dan B-11, termasuk `data/cari/hukum.json` yang hilang dan `siapTautan("provinsi")`. **Berkas** per temuan. **Bukti** `npm run uji`, penelusuran lokal 0 galat konsol dan 0 aset 404. **Pemeriksa** peninjau-bersih.

#### JM-S03 Periksa bug rendah yang masih dugaan
**Tujuan** B-10, B-12 sampai B-15 dibuktikan atau ditutup; yang terbukti masuk S02. **Ukuran** S.

#### JM-S04 Buang Antara dari panen
**Berkas** `scripts/panen/berita.mjs`, pemanen `tarif_harga`, `obligasi_hijau`, data turunannya. **Selesai bila** tidak ada URL atau judul Antara di keluaran; gerbang menagihnya. **Bukti** `npm run uji`.

#### JM-S05 Satu daftar proyek dan penjelasan selisih
**Tujuan** `proyek.json` (548) dan `proyek_terpadu.json` (607) jadi satu sumber; layar menerangkan kenapa kapasitas terlacak 49 sampai 72% dari angka nasional. **Rujukan** ALG §proyek. **Bukti** uji potret, tangkapan layar.

#### JM-S06 Bersihkan label internal dan blok kosong
**Tujuan** label "Butuh unduhan pemilik" hilang; blok paten, emisi provinsi, podcast, sosmed disembunyikan bila kosong. **Selesai bila** gerbang menolak label internal di `public/data/teks_*.json`.

#### JM-S07 Rute riwayat dengan METI
**Tujuan** pemanggil `/api/riwayat` (`public/direktori.js`) punya rute lewat `hak.js`, sesuai C-17. **Pemeriksa** guard-api, hak-auditor.

#### JM-S08 Uji integrasi semua rute API
**Tujuan** `tests/e2e/cakupan.json` dari 23 ke seluruh rute `/api/` (sekitar 200), peran benar dan peran salah. **Selesai bila** gerbang gagal bila ada rute tak terdaftar. **Bukti** `npm run uji`. **Rujukan** RU.

#### JM-S09 Selaraskan DESIGN-SYSTEM
**Tujuan** hapus `.ak-dummy` dan kunci `jm.dummy.*` dari `DESIGN-SYSTEM.md`, tulis nilai D21.

### Seri T, bot panen

#### JM-T01 Registri sumber dan pustaka panen
**Berkas** `data/sumber_jadwal.json`, `scripts/panen/_bot.mjs`. **Tujuan** 60 sumber AMBIL OTOMATIS dan SEMI-MANUAL, frekuensi, sinyal perubahan, status `ok|basi|gagal|blokir|perlu_kunci`; satu pustaka UA, robots tiap putaran, jeda per host, berhenti 403/429. **Selesai bila** swauji pustaka menolak jalur yang dilarang robots.

#### JM-T02 sampai JM-T05 Workflow berjadwal
**Berkas** `.github/workflows/panen-{harian,mingguan,bulanan,kuartalan}.yml`. **Harian** berita, IDXCarbon, pengadaan publik. **Mingguan** JDIH ESDM, BPK, Amdalnet, siaran pers, OpenAlex, Crossref, DOAJ, Wikidata, DPR, HBA. **Bulanan** Ember, Bank Dunia, OWID, Pink Sheet, Comtrade, GEM, Gatrik, ICP, BPS, SBTi. **Kuartalan** DJPPR, BKPM, PSN, JETP, AIIB, GCF, IFC, OJK. Sumber dengan blokir atau tanpa izin tidak dipaksa, jadi antrean semi-manual. **Selesai bila** `workflow_dispatch` lulus untuk tiap jadwal. **Penghambat** C-25.

#### JM-T06 Rangkai potret dan PR ke data-bot
**Tujuan** rantai panen, sambung, hubung, skor, potret jadi satu perintah; 65 skrip yatim dipasang atau dicatat sebagai pensiun; hasil ke cabang `data-bot` dan PR berisi selisih. Satu sumber gagal tidak menggagalkan putaran; 3 gagal berturut membuka isu. **Pemeriksa** higiene-repo.

#### JM-T07 Denyut perubahan di Worker cron
**Berkas** migrasi baru, `src/worker.js`, `src/denyut.js`. **Tujuan** HEAD/ETag sekitar 80 sumber ke D1, dalam batas subrequest Worker (dibagi per putaran). **Pemeriksa** perf-reviewer.

#### JM-T08 Panel kesegaran semua dataset
**Berkas** `public/admin_kesegaran.js`, `src/**`. **Tujuan** 178 dataset dipantau dari 16, batas basi mengikuti frekuensi sumber. **Bukti** uji ambang, tangkapan.

### Seri U, regulasi

#### JM-U01 Ekspor 622 teks regulasi ke GitHub
**Berkas** `hukum/<jenis>/<tahun>/<id>.md`, `scripts/hukum/ekspor_md.mjs`. **Tujuan** frontmatter dan segmen sesuai DT §regulasi; dasar Pasal 42 UU 28/2014 diperiksa dari naskah resmi. **Selesai bila** 622 berkas valid dan tanpa data pribadi. **Pemeriksa** higiene-repo.

#### JM-U02 dan JM-U03 Panen target kosong
**Tujuan** 50 target nasional dan 38 Perda RUED dari JDIH resmi. Yang tidak tersedia dicatat alasannya, tidak dikarang. **Bukti** laporan cakupan per target.

#### JM-U04 OCR dan ulang gagal
**Tujuan** 51 pindaian lewat `scripts/pipa/ocr_pdf.swift` di mesin lokal; 125 gagal diurai diulang; mutu tercatat di frontmatter.

#### JM-U05 Verifikasi nomor
**Tujuan** nomor dan judul dari halaman pertama PDF; beda dengan katalog masuk antrean kurator.

#### JM-U06 Graf relasi dan status
**Tujuan** relasi mencabut, mengubah, mengingat dua arah; status berlaku per tanggal; cek ETag mingguan.

#### JM-U07 Peta dampak regulasi
**Tujuan** tiap regulasi menunjukkan proyek, organisasi, teknologi, wilayah terdampak beserta dasar pasal dan tingkat bukti; tiap entitas menunjukkan aturan yang mengikat. **Rujukan** ALG §dampak, K17 butir 4, K22. **Bukti** uji acuan, target cakupan proyek ber-regulasi di ALG.

### Seri L, data tersambung

#### JM-L01 sampai JM-L06 Tautan
**L01** proyek ke organisasi (65% kosong). **L02** ke regulasi (96%) dan berita (97%). **L03** pendanaan ke proyek (14%) dan pemberi ke organisasi. **L04** `riset.pakar`, `pakar_riset.orang_id`, kampus, inovasi, tautan masuk profil. **L05** berita ke entitas (65% kosong) dan wilayah. **L06** `kode_kab` proyek. Semua memakai metode ALG, tiap tautan bersumber dan bertingkat bukti, yang ragu masuk antrean kurator. **Bukti** laporan cakupan sebelum-sesudah.

#### JM-L07 Perluas indeks pencarian
**Tujuan** tambah riset, kalender, pusat studi, lowongan, hukum di `scripts/pipa/indeks_cari.mjs`.

#### JM-L08 Gerbang tautan dua arah
**Tujuan** uji gagal bila rujukan satu arah atau cakupan turun dari garis dasar. **Pemeriksa** penulis-gerbang.

### Seri W, METI Wilayah

#### JM-W01 Skema kegiatan Wilayah
**Tujuan** memperluas `src/meti_wilayah.js` dan `src/wilayah_kelola.js` yang sudah ada, bukan membuat jalur baru: kegiatan, berita, agenda, dokumen, pengurus per provinsi; semua lewat `hak.js` dengan `cakupan_prov`. **Bukti** uji D1: wilayah lain DITOLAK. **Pemeriksa** migrasi-idempoten, hak-auditor.

#### JM-W02 Admin Wilayah
**Rute** `/wilayah-admin`. **Tujuan** Ketua Wilayah mengelola kegiatan, agenda, notulen, foto, berita, dan anggota provinsinya, setara admin Pusat tetapi terbatas provinsi; Pusat melihat semua. **Pemeriksa** security-reviewer, guard-api, inp-reviewer.

#### JM-W03 Papan publik per Wilayah
**Tujuan** halaman tiap Wilayah menampilkan kegiatan, rapor, orang, organisasi, dan proyek provinsi; `orang.meti_wilayah` terisi dari sumber.

### Seri N, anggota

#### JM-N01 Status tamu dan tier
**Tujuan** D22; tier mengikuti tangga iuran. **Pemeriksa** migrasi-idempoten, hak-auditor, security-reviewer.

#### JM-N02 Potret berlapis dan gerbang tier
**Tujuan** data dikunci di sisi server sesuai C-23; bukan disaring di klien. **Bukti** uji peran salah DITOLAK per dataset.

#### JM-N03 Layar manfaat
**Tujuan** tiap fitur terkunci menjelaskan manfaat dan cara naik tier. **Pemeriksa** i18n-guard, selera-angka.

### Seri M, 12 program

Tiap tiket mengikuti modul di PRD; peluncuran yang mengikat organisasi menunggu C-01.

- **JM-M01** `/rapor` berkala, lembar data, `/data` unduh bersitasi untuk anggota, alur penerbitan beku.
- **JM-M02** `/advokasi`: pelacak status aturan, `posisi_meti`, polling isu, ruang kelompok kerja.
- **JM-M03** `/pemasang`: direktori, pendaftaran, keputusan komite, pengaduan konsumen, QR di KTA.
- **JM-M04** `/pipeline`: gabungan radar, lelang, tender, peluang; skor kesiapan; ajuan proyek; ruang data privat.
- **JM-M05** `/desa` diperluas: tipologi KDKMP, kalkulator komunal, repositori pembelajaran.
- **JM-M06** `/akademi` diperluas: jalur kompetensi, ujian, riwayat sertifikat, lencana QR, tautan lowongan.
- **JM-M07** `/temu`: penawaran dan kebutuhan, permintaan temu, kuota tier, tindak lanjut.
- **JM-M08** papan 38 provinsi menggabungkan `meti-wilayah` dan `wilayah`, memakai seri W.
- **JM-M09** `/produk` terverifikasi dari data rantai pasok dan TKDN; pendaftaran dan verifikasi.
- **JM-M10** `asean` diperluas: pembanding kebijakan, papan kerja sama selatan-selatan, direktori kontributor.
- **JM-M11** `/riset`: kajian, aset, hibah, profil pakar, magang ke `kerja`.
- **JM-M12** `/pembeli`: profil kebutuhan beban, anonim bila diminta, cocok ke pipeline.

### Seri Z, penutup

#### JM-Z01 Perbarui Buku Pegangan dan papan tiket
Buku, `docs/perencanaan/TIKET.md`, dan rencana lama selaras dengan hasil akhir.

#### JM-Z02 Review menyeluruh
`peninjau-bersih` atas tiket selesai, `security-reviewer`, `perf-reviewer`, `inp-reviewer`, `i18n-guard`, `selera-angka`, `higiene-repo`; `npm run uji` hijau; penelusuran 1440 dan 390.

## 3. Ketergantungan

S01 sampai S09 dulu. T01 ke T02 sampai T05 ke T06. U01 ke U06 ke U07. L01 sampai L06 ke L08. U07 butuh L02. W01 ke W02 ke W03 ke M08. N01 ke N02 ke N03 ke seluruh seri M. M04 butuh L01 dan L03. M02 butuh U07.

Jalur kerja agar tidak ada dua penulis di satu berkas: W `src/**` dan `migrations/**`; L `public/**`; P `scripts/**` dan `data/**`; G `tests/**`.

## 4. Penghambat pemilik

| Kode | Menahan |
| --- | --- |
| C-01 | peluncuran M01 berbayar, M03, M06 |
| C-23 | isi kunci N02 (ada bawaan) |
| C-24 | produk data dari GEM, IRENA, 1001startup, Comtrade |
| C-25 | sumber BPS, EIA, Ember, Comtrade penuh di T04 |
| C-27 | verifikasi QR tanpa login di M03 dan M06 (ada bawaan) |
| Pemilik | migrasi D1 produksi, unggah R2 produksi, push ke `main` (tayang), branch protection `main` dan GitHub Secrets sebelum T02 aktif |
