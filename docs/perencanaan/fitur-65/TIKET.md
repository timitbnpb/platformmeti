# TIKET: 65 fitur pilihan pemilik

Dikerjakan urut dari atas. Satu tiket = satu commit. Selesai = `npm run uji` hijau, pemeriksa di AGENTS §6 tanpa temuan tinggi, tangkapan 1440 dan 375 terang dan gelap, dan tautan `http://localhost:8833/<halaman>` di laporan.

Kolom Pemilik = agent pengerja menurut AGENTS §1. Kolom Tahan = pertanyaan di KEPUTUSAN bagian C yang harus dijawab dulu; kosong berarti bisa langsung jalan.

## Gelombang 0: prasyarat

| Tiket | Isi | Pemilik | Tahan |
| --- | --- | --- | --- |
| F65-000 | Perbarui PRD induk §1.4: cabut non-tujuan forum, iuran, pembayaran, notifikasi, kiriman otomatis untuk butir M2, M3, 49, 59, 61, 70, 87 | induk | pemilik menyetujui teksnya |
| F65-001 | Verifikasi 15 butir ADA di browser (PRD §1); catat celah sebagai tiket F65-0xx | layar | |

## Gelombang 1: layar dan rumus (tanpa tabel baru)

| Tiket | Butir | Isi | Pemilik |
| --- | --- | --- | --- |
| F65-101 | 18 | `/banding` segmen Proyek: pilih 2 sampai 4 proyek dari potret proyek | layar |
| F65-102 | 63 | `/banding` saringan komponen untuk organisasi pemasok | layar |
| F65-103 | 39 | `/karbon` kalkulator emisi dihindari dan nilai REC; modul `public/inti/karbon_rumus.js` + uji acuan | layar, validasi-model |
| F65-104 | 42 | `/desa-energi` kalkulator hemat vs diesel; modul `public/inti/diesel_rumus.js` + uji acuan | layar, validasi-model |
| F65-105 | 45 | model keuangan: baterai geser beban | layar, validasi-model |
| F65-106 | 40 | model keuangan: pembiayaan campuran | layar, validasi-model |
| F65-107 | 43 | `/investasi#pembiayaan` pemeriksa insentif dari `insentif_fiskal.json` | layar |
| F65-108 | 44 | `/izin-kontrak` penaksir lahan dan izin | layar, pipa (data luas per MW) |
| F65-109 | 52 | `/izin-kontrak` alur izin bertahap | layar |
| F65-110 | 51 | `/regulasi` peta kewenangan | layar, pipa |
| F65-111 | 47 | `/regulasi` beda teks dua versi pasal | layar |
| F65-112 | 24 | `/wilayah` lapisan rasio terpasang dibagi potensi | layar |
| F65-113 | 55 | `/target#rapor` kartu skor janji vs realisasi | layar, pipa |
| F65-114 | semua G1 | entri `/metode` dan kunci `id.json` + `en.json` untuk tiap kalkulator | layar, i18n-guard |

## Gelombang 2: tabel D1 dan rute Worker

Tiap tiket di sini diawali migrasi idempoten, fungsi di `src/hak.js`, entri `tests/e2e/cakupan.json`, dan uji integrasi D1 lokal (TEST.md).

| Tiket | Butir | Isi | Pemilik | Tahan |
| --- | --- | --- | --- | --- |
| F65-201 | 86 | tiket event dan QR hadir | migrasi, worker, layar | |
| F65-202 | 89 | sertifikat kehadiran | worker, layar | sesudah 201 |
| F65-203 | 90 | survei pasca event | migrasi, worker, layar | sesudah 201 |
| F65-204 | 88 | laporan jangkauan sponsor | worker, layar | |
| F65-205 | 66, 67 | progres akademi di D1, sertifikat, kuis webinar | migrasi, worker, layar | |
| F65-206 | 64 | foto tonggak proyek | migrasi, worker, layar | |
| F65-207 | 60 | agregasi permintaan listrik hijau | migrasi, worker, layar | |
| F65-208 | 56 | pasang kebutuhan dana proyek | migrasi, worker, layar | |
| F65-209 | A | pencocokan bisnis | worker, layar, validasi-model | |
| F65-210 | M2 | forum per bidang | migrasi, worker, layar | C-04 |
| F65-211 | M1 | program mentor | migrasi, worker, layar | C-04 |
| F65-212 | C | minat lowongan lewat platform | migrasi, worker, layar | C-03 |
| F65-213 | M6 | lencana verifikasi | migrasi, worker, layar | C-04 |
| F65-214 | 65 | laporan warga | migrasi, worker, layar | C-04, C-08 |
| F65-215 | 49, 61 | pengingat regulasi dan tender lewat surel | worker, layar | F65-000 |
| F65-216 | 70 | buletin mingguan dirakit otomatis, kirim setelah disetujui admin | worker, layar | F65-000 |

## Gelombang 3: menunggu hal di luar kode

| Tiket | Butir | Isi yang bisa jalan sekarang | Tahan |
| --- | --- | --- | --- |
| F65-301 | M3 | perpanjangan mandiri mode sandbox + faktur PDF | C-01 |
| F65-302 | 87 | denah stan dan pemesanan tanpa bayar | C-01 |
| F65-303 | 59 | papan minat REC dan karbon | C-02 |
| F65-304 | 48 | ringkasan AI per peraturan berkutipan pasal | C-06 |
| F65-305 | 74 | ringkasan berita harian dari judul | C-07 |
| F65-306 | 75 | antrean cek fakta | C-04 |
| F65-307 | B, 62 | kolom sertifikasi isian sendiri berlabel belum diverifikasi | C-05 |
| F65-308 | 41 | biaya interkoneksi dengan biaya satuan isian pengguna | C-05 |
| F65-309 | 22, 27, 53 | kerangka tampil untuk data yang menyusul | C-05 |
| F65-310 | 26, 54, 58, 72 | tidak dikerjakan sampai data ada | C-05 |
| F65-311 | 57 | tidak dikerjakan sampai C-09 dijawab | C-09 |
| F65-312 | 69, 71 | pekerjaan isi redaksi; 71 = tiket induk JM-P07 | redaksi |

## Status (diperbarui 15 Nov 2026, Gelombang 1 selesai)

Semua belum di-commit. Uji penuh: 2.237 uji, 2.229 lulus, 0 gagal. Sapu sebelas rute di 1440 terang dan 390 gelap: nol galat konsol, nol gulir horizontal, nol kunci mentah baru.

| Tiket | Butir | Status | Rute | Batas yang perlu diketahui |
| --- | --- | --- | --- | --- |
| F65-101 | 18 | selesai | `/banding?m=pro` | investasi hanya bila sumber menyebut USD |
| F65-102 | 63 | selesai | `/banding?m=org&k=modul` | hanya 53 pabrikan yang tertaut ke organisasi direktori |
| F65-103 | 39 | selesai | `/karbon#saing` | intensitas emisi turunan RUPTL (EST), bukan faktor resmi |
| F65-104 | 42 | selesai | `/desa-energi#diesel` | balik modal sengaja tidak dihitung |
| F65-105 | 45 | selesai | `/investasi#model` | tanpa pajak dan biaya operasi; isian hilang saat ganti bahasa |
| F65-106 | 40 | selesai | `/investasi#model` | WACC tidak dihitung (imbal hasil ekuitas bukan masukan) |
| F65-107 | 43 | selesai, lebih sempit | `/investasi#pembiayaan` | hanya empat pertanyaan jenis kegiatan; ambang investasi, lokasi, badan usaha tidak ada di data |
| F65-108 | 44 | selesai sebagian | `/izin-kontrak#lahan` | luas per MW isian pengguna; angka bersumber dan izin per kelas kapasitas tertahan C-05 |
| F65-109 | 52 | selesai sebagian | `/izin-kontrak#alur` | urutan mengikuti sumber, bukan urutan wajib; lama langkah tidak ada di data |
| F65-110 | 51 | selesai sebagian | `/regulasi#kewenangan` | 2 dari 4 urusan berdasar pasal; UU Energi dan UU Pemda tidak ada di korpus |
| F65-111 | 47 | selesai, belum diuji terhadap D1 berisi | Pustaka hukum `#hd=<id>` | 31 pasangan punya pasal sebanding; D1 lokal kosong, layar diuji dengan API tiruan |
| F65-112 | 24 | selesai | `/wilayah` segmen rasio | tiga provinsi pemekaran Papua tanpa data |
| F65-113 | 55 | selesai | `/target#rapor` | hanya 19 target dokumen resmi; janji lisan pejabat tidak ada di data |
| F65-114 | semua | selesai untuk empat kalkulator | `/metode` | penaksir lahan dan pemeriksa insentif belum punya entri |

Belum dikerjakan dari daftar selesai TIKET: tampilan EN tidak dilihat di layar untuk satu pun tiket; tangkapan belum dipindah ke `tests/layar/tangkapan/`; pemeriksa di AGENTS §6 (`inp-reviewer`, `selera-angka`, `i18n-guard`, `peninjau-bersih`) belum dijalankan.

Temuan lama yang terlihat saat kerja: `/metode` menampilkan kunci mentah `met.h.lelang.s` (teks sumber entri Lelang tidak pernah ditulis).

Catatan kerja: label hasil kalkulator memakai pil EST (label repo untuk angka turunan hitung sendiri), bukan Hipotesis seperti tertulis di PRD §2; PRD mengikuti kenyataan ini.

## Status Gelombang 2 (15 Nov 2026)

Semua belum di-commit. Migrasi 0038 sampai 0041 hanya diterapkan ke D1 LOKAL; produksi dan pratinjau tidak disentuh. Uji penuh sesudah semua perbaikan tinjauan tercatat di laporan sesi. Rincian per rumpun: `CATATAN-G2-EVENT.md`, `CATATAN-G2-KIRIMAN.md`, `CATATAN-G2-JEJARING.md`, `CATATAN-G2-AKHIR.md`.

| Tiket | Butir | Status | Batas yang perlu diketahui |
| --- | --- | --- | --- |
| F65-201 | 86 | selesai | tanpa pemindai kamera (header situs memblokir kamera); kode diketik atau pemindai genggam |
| F65-202 | 89 | selesai | nama dibaca dari profil saat verifikasi, tidak dibekukan |
| F65-203 | 90 | selesai | agregat saja, tampil bila n >= 5 |
| F65-204 | 88 | jauh lebih sempit | hanya kunjungan halaman acara gabungan; klik sponsor dan kunjungan per acara tidak pernah dicatat |
| F65-205 | 66, 67 | selesai | sertifikat akademi hanya tanda selesai (kuis bisa ditebak dengan mengulang; kunci ada di repo publik); belum ada satu soal pun untuk kuis rekaman |
| F65-206 | 64 | selesai | pengunggah = akun berklaim organisasi apa pun; admin yang memutus |
| F65-207 | 60 | selesai | publik hanya rentang per wilayah, n >= 3 |
| F65-208 | 56 | selesai | kontak lewat sekretariat |
| F65-209 | A | selesai | ukuran dan tahap hanya terhitung untuk 50 dari 902 organisasi |
| F65-210 | M2 | selesai | moderasi oleh admin METI (C-04 belum dijawab) |
| F65-211 | M1 | selesai sampai antrean | tanpa pencocokan dan janji temu |
| F65-212 | C | selesai | minat tanpa CV (C-03 bawaan) |
| F65-213 | M6 | selesai | bukti hanya tautan https |
| F65-214 | 65 | selesai | dipasang di halaman proyek, bukan `/proyek#henti`; hanya akun masuk (C-08 bawaan) |
| F65-215 | 49, 61 | hanya sampai antrean | platform belum punya pengirim surel (K19); pengingat tenggat lelang tidak dibangun karena data tender tanpa tenggat |
| F65-216 | 70 | hanya sampai draf dan antrean | sama: belum ada pengirim surel |

Tinjauan keamanan independen dijalankan atas keempat rumpun: tidak ada temuan kritis atau tinggi. Diterapkan: kunci laju hadir sendiri, rata-rata survei satu desimal, kunci jawaban akademi keluar dari `public/`, batas foto dan laporan menunggu, penghapusan R2 saat tolak, rentang agregat listrik hijau, paginasi laporan forum, filter mentor nonaktif, giliran cron pengingat.

Tidak diterapkan, menunggu pemilik:
- Secret `EVENT_RAHASIA` belum ada; token tiket dan sertifikat jatuh ke rahasia KTA atau `IP_SALT`. Memutar rahasia itu kelak mematikan sertifikat yang sudah beredar.
- Nama di sertifikat dibekukan saat hadir atau tetap dari profil.
- Kuis akademi: batasi percobaan per hari, atau terima bahwa sertifikat hanya tanda selesai.
- CHECK `diputus_oleh` berlawanan dengan `ON DELETE SET NULL` di 0041: akun admin yang pernah memutus tidak bisa dihapus, hanya dinonaktifkan.
- Migrasi 0038 sampai 0041 ke D1 produksi, dan pemilihan layanan surel.

Belum diverifikasi: tampilan EN seluruh Gelombang 2; alur tolak, tarik, laporkan, sembunyikan, setujui buletin hanya terbukti lewat uji integrasi, belum diklik di layar; `inp-reviewer`, `i18n-guard`, `selera-angka`, `peninjau-bersih` belum dijalankan. D1 lokal memuat data uji para pengerja.

## Status Gelombang 3 (15 Nov 2026)

Semua belum di-commit. Migrasi 0042 dan 0043 hanya diterapkan ke D1 LOKAL. Rincian: `CATATAN-G3-MINAT.md`, `CATATAN-G3-AI-IURAN.md`.

| Tiket | Butir | Status | Batas yang perlu diketahui |
| --- | --- | --- | --- |
| F65-301 | M3 | terpasang, belum pernah dijalankan sungguhan | Midtrans tidak pernah dipanggil (tanpa kunci); jalur bukti transfer + tinjau admin jalan; hanya KTA `individu` dan `utama`; "bukti pembayaran", bukan faktur pajak |
| F65-302 | 87 | selesai sebagai minat stan | tanpa bayar, tanpa denah |
| F65-303 | 59 | selesai sebagai papan minat | tanpa uang, tanpa harga mengikat (C-02 bawaan) |
| F65-304 | 48 | terpasang, belum pernah dijalankan sungguhan | binding AI tidak pernah dipanggil; hanya admin yang memicu; 20 per admin per jam, 60 per hari untuk seluruh situs; mutu keluaran model belum diketahui |
| F65-305 | 74 | dipersempit tanpa AI | pengelompokan judul menurut kamus 15 isu; pada hari terbaru 8 dari 10 judul jatuh ke "Lainnya" |
| F65-306 | 75 | selesai sampai antrean dan putusan redaksi | putusan ditulis admin dengan minimal satu sumber; daftar kosong sampai ada putusan |
| F65-307 | B | selesai di profil akun | isian sendiri berlabel belum diverifikasi; tidak tampil di halaman orang direktori (keputusan privasi) |
| F65-307 | 62 | selesai | `/rantai-global?tab=tkdn` tampilan per produk (765 sertifikat); 3 sertifikat sudah lewat padahal data menandai aktif |
| F65-308 | 41 | selesai | biaya satuan isian pengguna; tidak ada biaya satuan bersumber di repo |
| F65-309 | 22, 27, 53 | TIDAK dibangun | kerangka kosong menunggu data; fitur yang belum jalan disembunyikan, bukan dipajang (C-05) |
| F65-310 | 26, 54, 58, 72 | TIDAK dibangun | data tidak ada (C-05) |
| F65-311 | 57 | TIDAK dibangun | menunggu C-09 |
| F65-312 | 69, 71 | TIDAK dibangun | pekerjaan isi redaksi |

Tinjauan keamanan independen atas dua rumpun server: tidak ada temuan kritis atau tinggi; peninjau menyatakan tidak menemukan jalur memperpanjang KTA tanpa membayar. Diterapkan: minat stan ke acara tertutup ditolak (rute dan trigger), batas riwayat profil atomik, nama organisasi hilang saat klaim dicabut, admin tidak bisa menyetujui bukti iuran miliknya sendiri, pembayaran lunas tanpa perpanjangan dicatat di jejak.

Menunggu pemilik: kunci Midtrans dan uji pembayaran sandbox sungguhan; uji ringkasan AI sungguhan dan penilaian mutunya; bentuk faktur pajak; apakah status transaksi Midtrans perlu dikonfirmasi ulang lewat API status sebelum ditandai lunas.

## Perubahan di luar tiket (audit 15 Nov 2026 dan pemeriksa wajib)

Dicatat karena peninjau bersih menemukan perubahan yang tidak tertulis di tiket mana pun.

| Berkas | Perubahan | Asal |
| --- | --- | --- |
| `public/_headers` | `/data/*` dari `public` ke `private, max-age=300`: potret berada di balik login | audit keamanan |
| `src/worker.js`, `tests/rute-gabung.test.mjs` | alih 301 tanpa hash tidak lagi menghasilkan `#undefined`; uji diperketat | audit keamanan |
| `public/inti/tema.css` | `--info` terang digelapkan supaya lolos 4,5 di atas `--info-bg` | audit kontras |
| 30-an berkas CSS halaman | teks `--brand` jadi `--accent`; teks di atas `--accent` jadi `--on-accent`; pil topik `color-mix(warna 45%, tinta)`; latar avatar inisial digelapkan dengan `--kaki-bg` | audit kontras |
| `public/inti/jm.css` | subjudul kartu jadi paragraf mengalir; area sentuh lencana bukti; angka ubin tidak patah; tabel 7 kolom ke atas punya lebar minimum di 768 sampai 1279; `.jm-gulir` jadi blok penampung | audit layar dan sapu tablet |
| `public/inti/gaya.css` | tombol newsletter dan ikon sosial di kaki boleh turun baris sampai 1100 | sapu tablet |
| `public/rantai-global.css` | sel tabel `break-word`, bukan `anywhere` | audit layar |
| `public/inti/kepala.js` | nama aksesibel logo kepala | audit layar |
| `public/metode_halaman.js`, `public/bidang.js`, i18n | 13 judul metode, sumber Lelang, tiga kunci bidang yang tampil mentah | audit layar, i18n-guard |
| `public/kuadran.css` | monogram tanpa logo putih di atas putih | audit kontras |
| `public/banding.js` | pencarian diredam dan kunci cari disimpan per entri | inp-reviewer |

Pemeriksa wajib AGENTS §6 yang dijalankan atas seluruh perubahan: `inp-reviewer`, `i18n-guard`, `selera-angka`, `peninjau-bersih`, `security-reviewer` (enam kali, per rumpun). Temuan lama yang dilaporkan `selera-angka` dan TIDAK diubah (halaman lama, keputusan pemilik): isian bawaan Rp 150/kWh di kalkulator daya saing karbon tanpa keterangan sumber; harga IDXCarbon "terakhir" tampil dua angka (dibulatkan dan asli); teks sumber menyebut September 2025 padahal data mulai Agustus 2025; dua "median TKDN" berdasar berbeda di satu layar. Delapan uji yang selalu dilewati adalah bawaan repo (data pihak ketiga dan uji asap live).
