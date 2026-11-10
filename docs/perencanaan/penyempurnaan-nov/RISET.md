# RISET: penyempurnaan November 2026

Dokumen kedua dalam urutan otoritas paket ini (`KEPUTUSAN-METI` > `GRAND-DESIGN` > `RISET` > `PRD` > `ALUR` > `ALGORITMA` > `DESIGN-SYSTEM` > `DESAIN-TEKNIS` > `KEAMANAN-PRIVASI` > `RENCANA-UJI` > `TIKET`). Kalah dari `KEPUTUSAN-METI` (K21 sampai K26, D19 sampai D22, C-21 sampai C-25), menang atas `PRD` dan dokumen di bawahnya. Versi 1, 11 Nov 2026.

**Tanda kepastian** dipakai di seluruh berkas ini dan di `PRD`, `ALUR`:

| Tanda | Arti |
| --- | --- |
| [F] | Fakta bersumber: dihitung dari repo pada 11 Nov 2026 atau dibaca dari sumber yang disebut |
| [EST] | Hitungan platform dari fakta di atasnya; rumus ditulis |
| [U] | Usulan penyusun; belum diputus pemilik |
| [?] | Belum pasti, tidak terverifikasi, atau sumber bertentangan; tidak diisi tebakan |

**Batas bahan.** Angka repo berasal dari pemindaian `public/data/*.json` (178 berkas), `src/*.js`, `public/*.html`. Layar belum dibuka di peramban untuk riset ini, jadi temuan tentang tampilan berdasar kode dan data [?]. Basis data D1 produksi (anggota, KTA, iuran, pesan) tidak terbaca dari repo, jadi jumlah anggota nyata tidak diketahui dari bahan ini. Isi web yang dibaca diperlakukan sebagai data. Lisensi tertulis tiap situs belum dibaca ulang; yang tercatat hanya robots, status HTTP, dan pengetahuan umum [?].

Isi: 1 Temuan audit integrasi, 2 Katalog 83 sumber dan jadwal bot, 3 Regulasi EBT, 4 Benchmark 28 organisasi, 5 Fakta dan target resmi, 6 Inventaris: punya, olah sendiri, ambil, 7 Hal yang belum pasti.

---

## 1. Temuan audit integrasi (11 Nov 2026)

### 1.1 Peta halaman dan rute

- [F] 95 berkas `public/*.html`; 44 jalur di menu `public/inti/kepala.js` (7 menu: Beranda, Tentang METI, EBT Indonesia, Bidang, Kewilayahan, Pustaka, Media); 447 berkas JS; sekitar 200 string rute `/api/` di `src/*.js`.
- [F] Tidak ada halaman yatim sungguhan. Halaman yang tampak yatim punya jalur masuk lewat kaki situs, menu akun, atau regex di `src/worker.js`.
- [F] Enam halaman hanya punya satu tautan masuk dan tidak ada di menu: `dpr-energi`, `izin-kontrak`, `kinerja`, `kuadran`, `produk-meti`, `diikuti`. Anggota baru sulit menemukannya.
- [F] 28 alias lama dialihkan 301 ke tab baru (`ALIH_GABUNG`); tautan lama di PDF atau WA bergantung pada Worker.
- [F] Layar tanpa rute server: `public/direktori.js` memanggil `GET /api/riwayat` ("Riwayat dengan METI", lapis pengurus) dan tidak ada handler; bagian disembunyikan diam-diam. Tiket: JM-S07.
- [?] Tiga rute tanpa pemanggil literal (`/api/pembaruan/:jenis/:id`, `/api/wilayah/terbit/:kode`, `/api/gambar/logo/:id`) kemungkinan dipanggil lewat string dinamis; perlu cek.
- [F] Akibat D19: `robots.txt` Disallow semua, situs tidak ditemukan mesin cari. Ini bertentangan dengan bunyi "rujukan utama yang bisa ditautkan dan ditemukan" di `FITUR-STRATEGIS.md` (lihat Catatan untuk induk di `PRD`).

### 1.2 Integrasi antar domain

Rujukan id valid: dari 140 lebih medan rujukan, hampir semua 100% valid; gerbang `konsistensi.json` melaporkan `tautan_mati: 0` [F]. Masalah bukan tautan mati, melainkan tautan yang tidak ada atau satu arah.

Tautan mati di luar jangkauan gerbang [F]:
- `penyedia_teknologi.json`: 6 dari 146 `organisasi_id` mati (96% valid).
- `kelistrikan.json`: 29 dari 38 `wilayah_pln_id` tidak cocok ke `sistem_pln`.
- `istilah.json`: 4.582 dari 6.062 `ref` bukan id data (slug), tidak terverifikasi gerbang.
- `pendanaan.json` dan `pendanaan_internasional.json`: 232 dari 232 `pemberi_ref` (kode IATI) tidak menunjuk `organisasi.json`; pemberi dana asing bukan simpul organisasi.

Cakupan tautan per pasangan (n dari jumlah entitas) [F]:

| Pasangan | Arah A ke B | Arah B ke A | Dua arah | Catatan |
| --- | --- | --- | --- | --- |
| organisasi dan proyek | org.proyek_ids 314 (88 dari 902 org, 10%) | proyek.organisasi_id 200 (191 dari 548 proyek, 35%) | 200 | 114 klaim org ke proyek tidak dibalas; 357 proyek tanpa organisasi; `pihak.pemilik` hanya teks |
| organisasi dan orang | 432 (50 org, 6%) | 555 (95% orang) | 432 | orang kuat ke org, org lemah ke orang |
| organisasi dan berita | 91 | 245 | 87 | org berberita 3%; berita berorg 28% |
| proyek dan berita | 43 (3% proyek) | 62 | 43 | 69% tautan berita ke proyek tak dibalas |
| proyek dan regulasi | 23 (4%) | 23 | 23 | simetris tetapi hanya 4% proyek dan 5% regulasi; K17 butir 4 menuntut tiap proyek menunjukkan aturannya |
| regulasi dan berita | 6 | 6 | 6 | 0% regulasi berberita |
| orang dan berita | 12 | 20 | 12 | 1% orang |
| proyek dan pendanaan | 0 | pendanaan.proyek_id 48 (14% dari 338) | 0 | proyek.json tanpa medan pendanaan |
| pendanaan dan organisasi | lembaga_id 35 (10%), penerima_org_id 9 (3%) | 0 | 0 | |
| inovasi dan organisasi (kampus) | 65 dari 66 valid | 0 | 0 | profil kampus tidak menampilkan inovasinya |
| riset dan orang atau pakar | riset.pakar 1% dari 2.987 | pakar_riset.orang_id 0% dari 250 | 0 | 2.987 makalah dan 250 pakar tak terhubung ke 550 orang |
| riset dan kampus | cocok nama persis ke org 121 dari 2.581 (5%) | riset_kampus.organisasi_id 6 dari 25 | 0 | org kategori perguruan tinggi hanya 12 dari 902 |
| kalender dan organisasi | 9 dari 41 acara | 0 | 0 | kalender.proyek_ids 0 |
| isu dan entitas | isu ke org 34 dari 91; isu ke proyek 46 dari 91 | | | |
| berita ke semua entitas | 567 dari 866 berita (65%) tak tertaut ke org, proyek, orang, regulasi | | | `wilayah` terisi 24%, `kepakaran` 38% |
| provinsi | proyek 443 dari 548 (81%); riset 47%; org 34%; berita 24% | | | 0 proyek punya kabupaten atau kota |
| METI Wilayah dan entitas | `orang.meti_wilayah` 0% | | 0 | `meti-wilayah.json` hanya hitungan per provinsi |
| anggota atau KTA dan direktori | `gabungAnggota` menggabung anggota D1 ke potret R2 | | | anggota tidak tertaut ke `organisasi.json` atau `orang.json` lewat id |
| rantai pasok dan organisasi | rantai_org.org_id 41 valid; tkdn_produk.pabrikan_org_id 352 valid 100% | | | baik |

Entitas yang punya tautan masuk dari dataset lain [F]: organisasi 51%, orang 78%, proyek 95%, regulasi 90%, berita 19%, pendanaan 4%, inovasi 0%, riset 0%, pakar_riset 0%, kalender 0%, isu 5%, pustaka (457) 0%. Yatim data: 796 dari 902 organisasi tanpa proyek, orang, atau berita tertaut; 456 organisasi tanpa logo; 381 dari 550 orang tanpa foto.

**Kesimpulan.** Tulang punggung proyek, regulasi, program, organisasi, orang kuat. Domain riset, pakar, inovasi, kampus, pendanaan, berita, kalender, dan METI Wilayah atau anggota hampir terputus dari graf utama. Prinsip "tiap data baru tertaut dua arah" dilanggar terutama di sana. Tiket penutup: JM-L01 sampai L08.

### 1.3 Data basi dan pipa tak berjalan

- [F] Semua dataset berumur 2 sampai 4 hari terhadap 11 Nov: 51 dibangun 7 Nov, 100 pada 8 Nov, 2 pada 9 Nov, 25 tanpa tanggal. Tidak ada berkas yang diperbarui otomatis sesudah 9 Nov.
- [F] `kesegaran.json` memantau 16 dari 178 dataset dan menandai semuanya segar (umur terhadap tanggal bangun, bukan tanggal sumber). Dalam seminggu tanpa panen manual semua akan basi.
- [F] Berita terbaru 7 Nov 16:31 UTC; regulasi terbaru ditetapkan 14 Agu 2026 (88 hari), sehingga "regulasi baru 90 hari" hampir kosong. Kalender hanya 4 acara mendatang.
- [F] Hanya `.github/workflows/uji.yml`; tidak ada `potret.yml` meski DESAIN-TEKNIS 7.4 menyebutnya. Cron Worker `0 18 * * *` menjalankan `perbaruiRentang` dan `perbaruiSosmed` saja.
- [F] 65 skrip di `scripts/panen` dan `scripts/pipa` tidak dirujuk skrip, uji, dokumen, atau workflow mana pun (dijalankan satu-satu atau mati). Daftarnya dibangkitkan ulang saat JM-T06.
- [F] `proyek_peristiwa.json` hanya 3 baris untuk 1 proyek; `orang.wikidata_id` hanya 6% (31) dari 185 kandidat tinjau.
- [F] Dataset yang tampaknya hanya dibaca skrip pipa dan bukan layar (pencocokan string, sebagian dimuat dinamis [?]): `pembangkit_osm.json`, `riset_ebt.json`, `gem_pembangkit.json`, `gppd.json`, `rued.json`, `tarif_harga.json`, `emisi_provinsi.json`, `paten.json` (kosong), `proyek_peristiwa.json`.
- [F] Uji integrasi D1: `tests/e2e/cakupan.json` mendaftarkan 23 rute `diuji` dari sekitar 200. Tiket: JM-S08.
- [F] Gerbang tautan hanya mencakup 9 hitungan (proyek, org, orang, regulasi, program, berita, video, keuangan, karbon).

### 1.4 Pertanyaan pengguna yang muncul

1. Dua angka proyek: `proyek.json` 548 dan `proyek_terpadu.json` 607 (ditambah 16 diragukan, 60 dikeluarkan tanpa teknologi). Beranda memakai 548, pelacak 607 [F]. Tiket: JM-S05.
2. Kapasitas terlacak di bawah angka nasional: surya 855 MW dari 1.494 MW (57%), hidro 5.469 dari 7.587 (72%), panas bumi 1.332 dari 2.744 (49%) [F, hanya peringatan admin di `konsistensi.json`, belum di layar pengguna].
3. 65 proyek (12%) tanpa status; 56% tanpa COD target; 88% tanpa nilai investasi [F].
4. Label internal bocor: "Butuh unduhan pemilik" (kunci `butuh.judul` di `teks_pemda.json`, `teks_izin.json`, `teks_kebijakan.json`, `teks_desa.json`) [F]. Tiket: JM-S06.
5. Blok kosong: `paten.json` 0 baris, `emisi_provinsi.json` 0 baris, `podcast.json` kosong, `sosmed_pilihan.json` 0 baris, `foto_pakar.json` 1 pakar, `kebijakan_proses.json` 1 baris, `konsultasi.json` 1 dokumen [F].
6. Panel kesegaran dan angka ringkas tidak sinkron: organisasi 869 lawan 902, regulasi 496 lawan 499 [F].
7. 456 dari 902 organisasi tanpa logo, 381 dari 550 orang tanpa foto, sehingga banyak kartu bergambar jatuh ke huruf awal [F].
8. Pencarian global tidak mengindeks riset (2.987), kalender (41), pusat studi, lowongan. Tiket: JM-L07.
9. Skor `perizinan_provinsi.json` ("hipotesis": true; bobot rued 30, perda 25, wkp 20, berita 15, oss 10) dan indeks `paket_pemda.json` tampil sebagai angka 0 sampai 100; label Hipotesis ada di metode tetapi mudah terlewat [F].

### 1.5 Keanggotaan: anggota dan non-anggota

- [F] Peran di `src/hak.js`: publik, anggota, pengurus, kurator, wilayah, admin, super. Seluruh situs di balik login (D19), sehingga non-anggota praktis tidak ada kecuali pendaftar yang belum disetujui. Lapis `potret_publik` dan `potret_anggota` sama bagi anggota; tidak ada dataset khusus anggota; lapis `potret_anggota`, `potret_pengurus`, `kontak` ada di matriks tetapi satu-satunya konsumennya `src/direktori.js`. Kontak organisasi publik hanya 14% dan tidak dipagari peran.
- [F] Setelah D19 semua yang masuk melihat data sama. Nilai tambah anggota sekarang hanya alat kerja: ikuti, konsultasi RUU (1 dokumen), KTA virtual, portal klaim lembaga, RSVP, survei keyakinan, pesan ke admin, permintaan surel resmi, tautan kalender ICS. Itu alasan K24, D22, C-23, dan tiket JM-N01 sampai N03.
- [F] Tidak ada pengiriman surel sama sekali (aktivasi akun, ringkasan mingguan, pengingat iuran, balasan pesan); semua manual admin. C-21 menetapkan: tidak dikerjakan di gelombang ini, program memakai lonceng dalam aplikasi (lonceng ada di kode: `src/ikuti.js`, `public/inti/akun_menu.js`).
- [F] KTA: verifikasi publik `/kta/v/<token>` adalah satu-satunya data terbuka; perpanjangan dan pengingat jatuh tempo tidak ada; iuran dicatat admin (peta iuran per tahun di `direktori.js`).
- [F] Pesan: obrolan akun ke admin tanpa notifikasi; admin harus membuka tab Pesan. Langganan newsletter hanya menyimpan surel.

### 1.6 Lima belas celah terbesar dan tiket yang menutupnya

| # | Celah | Tiket |
| --- | --- | --- |
| 1 | Tidak ada pengiriman surel | C-21 (tidak dikerjakan); lonceng dalam aplikasi |
| 2 | Pembeda anggota dan publik kosong | JM-N01 sampai N03 |
| 3 | Panen dan potret tidak terjadwal, 65 skrip yatim | JM-T01 sampai T08 |
| 4 | Domain riset, pakar, inovasi, kampus terputus | JM-L04 |
| 5 | Proyek lemah tautan keluar (65% tanpa organisasi, 96% tanpa regulasi, 97% tanpa berita, 86% tanpa pendanaan) | JM-L01 sampai L03, U07 |
| 6 | Dua daftar proyek dan selisih kapasitas tak dijelaskan | JM-S05 |
| 7 | METI Wilayah sebatas hitungan | JM-W01 sampai W03, M08 |
| 8 | Berita 65% tak tertaut entitas, hanya 24% punya wilayah | JM-L05, T02 |
| 9 | Pendanaan terputus dari organisasi dan proyek | JM-L03 |
| 10 | Iuran dan KTA tanpa pengingat atau perpanjangan | di luar gelombang ini (C-21) |
| 11 | Pencarian global sempit | JM-L07 |
| 12 | Kalender nyaris kosong, 9 dari 41 acara punya organisasi | JM-T02 (harian), JM-L01 |
| 13 | Label internal bocor dan blok kosong | JM-S06 |
| 14 | Input komunitas hampir tidak ada (pemda, warga, kampus, lembaga, voting posisi, harga PPA) | seri M (sebagian), W02 |
| 15 | Riwayat tanpa rute; tautan mati; tanpa kabupaten; uji 23 dari 200 rute | JM-S07, S02, L06, S08 |

### 1.7 Status rencana lama (RENCANA-AKHIR) yang masih terbuka

[F, dari pencocokan kata kunci; fitur bertanda "tidak ditemukan" dicek ke pengerja sebelum dinyatakan belum ada.]
- Selesai sebagian: kamus id dan gerbang tautan (G1.1), dedup proyek (G1.2, masih dua daftar), pecah JSON besar (G1.4), data publik (G2: perda RUED 30 dari 38 provinsi, 24 bertarget), Green jobs (G3.1), beranda "berubah" (G3.2), rapor provinsi dan radar kabupaten (G3.3), METI Wilayah (G3.4, hanya 6 sampai 8 berdiri), org (G3.5), orang dan pakar (G3.6), pendanaan (G3.7, `proyek_kecocokan` terisi 2%), dampak regulasi (G3.11, 23 dari 499), berita (G3.12), inputan (G4), admin (G5).
- Selesai: keterlambatan COD dan risiko (G3.8, 46 terlambat; COD target hanya 44% proyek), dedieselisasi dan PLTS atap (G3.9), biaya listrik (G3.10).
- Belum: G1.3 langkah ke rantai potret; G6 review; PDF satu klik per provinsi, organisasi, topik; simulator bauran 2030 (hanya `sy_kebijakan.js`); notifikasi pelacak kebijakan.

---

## 2. Katalog 83 sumber dan jadwal bot

### 2.1 Ringkasan

[F] Keputusan: **AMBIL OTOMATIS 32, AMBIL SEMI-MANUAL 28, OLAH SENDIRI 5, RUJUK SAJA 15, TOLAK 3** (jumlah 83). Status di repo: SUDAH 33, SEBAGIAN 23, BELUM 27. Yang berjadwal bot (otomatis dan semi-manual) = **60 sumber**, sesuai JM-T01.

Legenda: AMBIL OTOMATIS = bot terjadwal tanpa orang. AMBIL SEMI-MANUAL = bot menyiapkan usulan, orang meninjau. OLAH SENDIRI = dihitung ulang dari data terbuka, tidak diambil verbatim. RUJUK SAJA = tautan dan metadata. TOLAK = tidak diambil.

Pemeriksaan 11 Nov 2026 (GET sekali per URL, ditambah robots.txt, UA `METI-Network-research/0.1`, jeda 2,2 detik per host, tanpa memanen isi). Tidak terselesaikan atau timeout (bisa sementara, bukan bukti mati) [?]: heesi.esdm.go.id, web.pln.co.id, srn.menlhk.go.id, lpse.lkpp.go.id, SINTA, case.or.id, djpk.kemenkeu.go.id, djppr.kemenkeu.go.id, bappenas (TLS lama), jdih.kemenkeu.go.id, opentender.net, overpass-api.de (502).

**Hambatan akses nyata** [F]:
- Menolak UA kita (403), berhenti sesuai aturan: idx.co.id, www.irena.org, www.adb.org, iesr.or.id, ieefa.org, bappenas.go.id, SINTA.
- robots melarang: den.go.id (Disallow /), siinas.kemenperin.go.id, geoportal.esdm.go.id (ESDM One Map, juga 503), host NASA POWER (API publiknya tetap boleh).
- Butuh kunci yang didaftarkan pemilik (C-25): BPS, EIA, Ember (API), Comtrade (penuh). Sumbernya berstatus `perlu_kunci` dan dilewati sampai ada.

**Pelanggaran aturan sendiri** [F]: `scripts/panen/berita.mjs` baris 80 masih memuat RSS Antara; pemanen `tarif_harga` dan `obligasi_hijau` memakai judul Antara. Aturan K21: tanpa Antara. Tiket: JM-S04.

### 2.2 Katalog per sumber

Frekuensi adalah frekuensi nyata sumber (dari kebiasaan, bukan diamati dua kali [?]). Kolom Izin merangkum robots dan lisensi yang terbaca.

| Kode | Sumber | Keputusan | Frekuensi | Status | Izin dan catatan |
| --- | --- | --- | --- | --- | --- |
| S01 | ESDM Ditjen EBTKE | OTOMATIS (siaran pers, indeks PDF) | mingguan | sebagian | robots boleh kecuali /simantaps/ /lintas/ /konversi/; metadata dan fakta |
| S02 | ESDM Ditjen Gatrik | OTOMATIS (hash PDF tahunan) | tahunan (statistik), insidentil (RUPTL) | sudah | robots boleh kecuali /perpus/; PDF disimpan lokal saja |
| S03 | ESDM Ditjen Minerba (HBA) | OTOMATIS | bulanan | sebagian | robots boleh |
| S04 | ESDM Pusdatin: Statistik, Handbook, HEESI | SEMI-MANUAL (ekstrak tabel PDF) | tahunan | sebagian | angka boleh tayang dengan atribusi |
| S05 | ESDM Migas (ICP, harga BBM, HIP biodiesel) | OTOMATIS | bulanan | belum | fakta |
| S06 | ESDM JDIH | OTOMATIS | mingguan | sudah (137 dok) | robots Allow; peraturan bebas hak cipta |
| S07 | ESDM One Map atau Geoportal | TOLAK | insidentil | belum | robots dilarang, 503; minta izin tertulis ke Pusdatin dahulu |
| S08 | data.esdm.go.id | RUJUK SAJA | tidak ada | belum | DNS tidak terselesaikan; periksa ulang |
| S09 | PLN RUPTL 2025-2034 | SEMI-MANUAL (tinjau tabel) | insidentil (5 tahunan) | sudah (271 baris) | PDF publik; robots tak terbaca |
| S10 | PLN Statistik, Laporan Tahunan, Keberlanjutan | SEMI-MANUAL | tahunan | sebagian | hanya fakta |
| S11 | PLN e-procurement | OTOMATIS (pengumuman publik tanpa login, sekali per hari) | harian | belum | robots tak ada |
| S12 | BPS Web API | OTOMATIS setelah pemilik daftar kunci | bulanan, tahunan | sebagian | `perlu_kunci`; kunci tidak masuk repo |
| S13 | Satu Data Indonesia (data.go.id) | OTOMATIS (metadata dahulu) | mingguan | belum | jalur API perlu dipastikan; lisensi per dataset |
| S14 | Satu Data Kemendes | SEMI-MANUAL | tahunan | sudah (37) | Disallow /api/, jeda 10 detik; ODC-BY |
| S15 | Dewan Energi Nasional | RUJUK SAJA | tahunan | sebagian | robots Disallow /; angka dari ESDM dan Perpres 22/2017 |
| S16 | Bappenas | RUJUK SAJA (ambil dari JDIH BPK) | insidentil | belum | 403 |
| S17 | Kemenkeu DJPPR (SBN hijau, sukuk) | OTOMATIS | kuartalan | sudah (28) | fakta |
| S18 | Kemenkeu DJPK | SEMI-MANUAL | tahunan | sebagian | timeout |
| S19 | Kemenperin TKDN | OTOMATIS (tkdn); SIINAS TOLAK | mingguan | sudah | robots boleh; SIINAS robots dilarang |
| S20 | BKPM atau OSS | SEMI-MANUAL (PDF realisasi) | triwulan | sebagian (146) | robots boleh; sulit diurai |
| S21 | OJK Taksonomi Hijau | SEMI-MANUAL | insidentil | sudah | publik |
| S22 | IDX dan IDXCarbon | OTOMATIS (idxcarbon sekali per hari); idx.co.id RUJUK | harian (karbon), kuartalan (laporan) | sebagian | idx.co.id 403 |
| S23 | KLHK SRN-PPI | SEMI-MANUAL | insidentil | sebagian | DNS gagal dari mesin riset [?] |
| S24 | KLH Amdalnet | OTOMATIS | mingguan | sudah (160) | robots boleh |
| S25 | KPPIP atau PSN | SEMI-MANUAL | kuartalan | sudah | robots boleh |
| S26 | JETP Sekretariat | SEMI-MANUAL | kuartalan | sudah (8) | robots boleh |
| S27 | LKPP INAPROC atau SIRUP | RUJUK SAJA | harian | belum | SIRUP mengalihkan ke login, jadi TOLAK; opentender.net sudah dipakai |
| S28 | Open Tender | SEMI-MANUAL | mingguan | sudah (10) | timeout saat dicek |
| S29 | BMKG | OLAH SENDIRI (NASA POWER dan GSA dahulu) | harian | sebagian | lisensi per kanal belum dibaca |
| S30 | Ember Data Explorer dan API | OTOMATIS (CSV) | bulanan | sebagian (110) | CC BY 4.0; API butuh kunci |
| S31 | IRENA (PxWeb, Costs) | OTOMATIS (pxweb); situs utama RUJUK | tahunan | sudah | situs 403; atribusi IRENA |
| S32 | IEA | RUJUK SAJA | tahunan | sebagian | data utama berlisensi, tanpa unduh |
| S33 | Global Energy Monitor | OTOMATIS (rilis tracker) | semesteran | sudah (478) | dicatat CC BY 4.0, tetapi lihat 2.4 butir 2 |
| S34 | World Bank API dan WDI | OTOMATIS | bulanan | sudah | CC BY 4.0, tanpa kunci |
| S35 | World Bank Projects | OTOMATIS | bulanan | sudah | CC BY 4.0 |
| S36 | ADB (lewat IATI) | SEMI-MANUAL | bulanan | sebagian | www.adb.org 403; IATI saja |
| S37 | AIIB | SEMI-MANUAL | kuartalan | belum | robots boleh |
| S38 | Green Climate Fund | SEMI-MANUAL | kuartalan | belum | robots boleh |
| S39 | IFC Project Disclosures | SEMI-MANUAL | bulanan | belum | robots boleh |
| S40 | JICA | SEMI-MANUAL | tahunan | sebagian | robots tak ada |
| S41 | KfW atau DEG | RUJUK SAJA | tahunan | sebagian | |
| S42 | Climate Policy Initiative | RUJUK SAJA | tahunan | sebagian | |
| S43 | Our World in Data | OTOMATIS (ETag berkas mentah) | tahunan | sudah | CC BY 4.0 |
| S44 | NASA POWER | OLAH SENDIRI (per provinsi, sekali) | tahunan | sebagian | host melarang crawl, API publik resmi; sedikit titik saja |
| S45 | Global Solar Atlas dan Global Wind Atlas | OLAH SENDIRI | insidentil | sudah (514) | CC BY 4.0 |
| S46 | US EIA Open Data | SEMI-MANUAL (butuh kunci) | bulanan | belum | `perlu_kunci`; domain publik AS |
| S47 | OpenAlex | OTOMATIS | mingguan | sudah | CC0; surel di UA |
| S48 | Crossref REST | OTOMATIS (hanya metadata) | mingguan | belum | polite pool |
| S49 | DOAJ | OTOMATIS | mingguan | belum | metadata CC0 |
| S50 | UN Comtrade | OTOMATIS | bulanan | sudah | pratinjau tanpa kunci terbatas; penuh butuh kunci |
| S51 | Harga modul (PVInsights, EnergyTrend) | RUJUK SAJA (tanpa salin tabel) | mingguan | belum | syarat situs menahan penyalinan |
| S52 | World Bank Pink Sheet | OTOMATIS (ETag) | bulanan | belum | CC BY 4.0 |
| S53 | IMF Commodity prices | SEMI-MANUAL | bulanan | belum | syarat belum dibaca penuh [?] |
| S54 | Harga litium (Trading Economics dan sejenisnya) | TOLAK | harian | belum | berbayar atau berhak cipta |
| S55 | IESR | RUJUK SAJA | mingguan | sebagian | 403 |
| S56 | CASE | RUJUK SAJA (identifikasi dahulu) | tidak ada | belum | identitas lembaga belum dipastikan [?] |
| S57 | RMI | SEMI-MANUAL (judul RSS) | bulanan | belum | robots boleh |
| S58 | IEEFA | RUJUK SAJA | mingguan | sebagian | 403 |
| S59 | Purnomo Yusgiantoro Center | SEMI-MANUAL | bulanan | belum | robots boleh |
| S60 | RSS berita energi | OTOMATIS | harian | sudah (866) | hanya metadata; feed Katadata lama 404 |
| S61 | Antara (RSS) | TOLAK (cabut dari daftar) | tidak ada | sudah, melanggar aturan | aturan K21 |
| S62 | peraturan.bpk.go.id (JDIH BPK) | OTOMATIS | mingguan | sudah (485 dok) | Disallow hanya /Admin/ dan sejenisnya |
| S63 | peraturan.go.id (Kemenkum) | OTOMATIS (silang uji) | mingguan | belum | Disallow kosong |
| S64 | JDIH Setneg | OTOMATIS (sumber utama UU, PP, Perpres) | mingguan | belum | Disallow kosong |
| S65 | JDIHN | SEMI-MANUAL (tanpa /search-api/) | mingguan | belum | Disallow /search-api/ |
| S66 | DPR (Prolegnas, RUU) | SEMI-MANUAL | bulanan | sudah | robots boleh |
| S67 | DJP atau pajak (insentif) | RUJUK SAJA | insidentil | sebagian | |
| S68 | Climate TRACE | OTOMATIS | tahunan | sudah | CC BY 4.0 |
| S69 | Global Forest Watch | OLAH SENDIRI | tahunan | sudah | CC BY 4.0 |
| S70 | OpenStreetMap Overpass | SEMI-MANUAL | bulanan | sebagian (515) | ODbL; 502 saat dicek, pakai cermin |
| S71 | IATI Registry atau d-portal | OTOMATIS | bulanan | sudah | lisensi per pelapor |
| S72 | Verra dan Gold Standard | OLAH SENDIRI lewat VROD Berkeley | mingguan | sudah | CC BY 4.0 (VROD) |
| S73 | SBTi | OTOMATIS | bulanan | sudah | robots boleh |
| S74 | KEK atau kawasan industri | SEMI-MANUAL | tahunan | sudah (141) | robots boleh |
| S75 | BNSP LSP | SEMI-MANUAL | tahunan | sudah (34 LSP) | robots tak ada |
| S76 | SINTA dan Garuda | SEMI-MANUAL (Garuda); SINTA TOLAK | tidak ada | sebagian | SINTA 403 |
| S77 | PDDikti | SEMI-MANUAL | tahunan | belum | robots boleh |
| S78 | REN21 GSR | RUJUK SAJA | tahunan | belum | |
| S79 | SEforALL | RUJUK SAJA | tahunan | belum | |
| S80 | PPI World Bank | OTOMATIS | tahunan | sudah | robots 404 |
| S81 | AidData | SEMI-MANUAL | insidentil | sudah | robots boleh |
| S82 | Wikidata SPARQL | OTOMATIS | mingguan | sudah | CC0 |
| S83 | EJAtlas | RUJUK SAJA | insidentil | belum | CC BY-SA |

### 2.3 Rancangan jadwal bot (dasar JM-T01 sampai T08)

Prinsip [F dari rancangan riset]: bot memeriksa sinyal perubahan murah (ETag, Last-Modified, HEAD, ukuran, hash isi), mengunduh penuh hanya bila berubah, menulis keluaran ke cabang `data-bot`, dan membuka PR setelah gerbang uji; tidak langsung ke `main` karena push ke `main` tayang (K21).

| Frekuensi | Sumber (kode) | Sinyal perubahan | Perkiraan unduh | Waktu (UTC) |
| --- | --- | --- | --- | --- |
| Harian | S60, S22 (IDXCarbon), S11; S27 hanya bila diizinkan; S29 opsional | GUID atau tautan baru, hash daftar | 1 sampai 5 MB | 17:30 |
| Mingguan | S06, S62, S63, S64, S65, S24, S01, S47, S48, S49, S82, S66, S03 | ETag atau Last-Modified halaman daftar, jumlah baris, lastmod sitemap | 20 sampai 200 MB | Senin 18:00 |
| Bulanan | S30, S34, S35, S43, S52, S50, S33, S02, S05, S12, S73 | ETag berkas CSV atau XLSX, Content-Length, tanggal rilis | 50 sampai 500 MB | tanggal 3 |
| Kuartalan | S17, S20, S25, S26, S37, S38, S39, S21 | hash halaman, jumlah baris | 10 sampai 100 MB | tanggal 5 Jan, Apr, Jul, Okt; hasil ditinjau orang |
| Tahunan atau insidentil | S04, S09, S10, S31, S44, S45 | cek mingguan ringan atas halaman indeks | 10 sampai 80 PDF | `workflow_dispatch` ditambah pengingat |

Catatan: daftar di atas mengikuti rancangan riset dan `TIKET` T02 sampai T05. Beberapa sumber di sana berfrekuensi nyata berbeda dari kolom jadwal (S02 tahunan, S03 bulanan, S33 semesteran, S43 tahunan, S66 bulanan, S21 insidentil). Karena bot memakai sinyal perubahan, jadwal yang lebih rapat dari frekuensi sumber hanya membuang menit, tidak membuat data salah. Penempatan akhir tiap sumber ke workflow ditetapkan di `data/sumber_jadwal.json` (JM-T01).

**Aturan wajib bot** (K21 dan riset): UA jujur METI; baca ulang robots tiap putaran dan berhenti bila berubah jadi larangan; jeda minimal 2 detik per host (10 detik untuk satudata.kemendesa); berhenti di 403 atau 429 dan tandai host `blokir` sampai ditinjau orang; tanpa login; tanpa media sosial; tanpa Antara; tanpa ESDM One Map dan SINTA; tanpa mengakali blokir.

**Status sumber** [F, rancangan]: `ok | basi | gagal | blokir | perlu_kunci`. Satu sumber gagal tidak menggagalkan putaran; tiga kali gagal berturut-turut membuka isu otomatis; keluaran lama dipertahankan dengan `diambil` tidak berubah, dan layar menampilkan umur data, bukan menyembunyikannya. Tiap keluaran melewati `npm run uji` sebelum PR.

**Pembagian Worker cron dan GitHub Actions** [F dari rancangan; batas Cloudflare dari pengetahuan umum, perlu verifikasi di dokumen Cloudflare [?]]:
- Worker cron (sekarang satu pemicu `0 18 * * *`): "denyut" untuk sekitar 80 sumber, yaitu HEAD atau ETag, tulis ke D1 tabel status sumber, hitung kesegaran, kirim peringatan. Batas subrequest per invokasi (50 paket gratis, 1000 berbayar) dan CPU kecil, tanpa `pdftotext`, Python, atau OCR; maka dibagi per putaran (JM-T07).
- GitHub Actions: panen sesungguhnya (unduh PDF, `pdftotext`, parser, OpenAlex berhalaman, Comtrade).
- OCR tetap lokal di mesin pemilik (`scripts/pipa/ocr_pdf.swift`).

**Biaya dan risiko Actions** [EST dari riset]: harian 15 menit x 30 = 450 menit, mingguan 60 x 4 = 240, bulanan 120, kuartalan 60 per kuartal; sekitar 900 menit per bulan, di bawah 2.000 menit paket Free bila repo privat. Dua risiko: workflow terjadwal dinonaktifkan GitHub setelah 60 hari tanpa aktivitas repo publik, dan jadwal bisa terlambat beberapa menit. Kebijakan menit gratis repo publik dari pengetahuan umum, belum dicek ulang [?].

### 2.4 Inventaris pemanen yang ada

[F] Hampir semua keluaran `public/data` (178 berkas, 169 bertanggal 8 sampai 9 Nov 2026) berasal dari satu putaran panen. Pemindaian `scripts/panen`, `scripts/pipa`, `scripts/hukum` menemukan 216 skrip berkeluaran `public/data`; rincian per skrip ada di scratchpad riset dan dibangkitkan ulang saat JM-T06. Data mentah `data-panen/` 3,8 GB tidak ikut repo (hukum 1,8 GB, pustaka 376 MB, pdf 349 MB, wilayah 342 MB, regulasi 281 MB, orang 172 MB, air_energi 170 MB, proyek 82 MB).

Tiga catatan izin yang bertemu K-D-C:
1. 1001startup.id: LISENSI-DATA menilai situs menyatakan data tidak untuk unduhan publik dan menyarankan menghentikan panen otomatis tanpa izin tertulis; data masih tampil di `organisasi.json`. Tidak masuk jadwal bot.
2. Global Energy Monitor, IRENA, 1001startup, Comtrade: C-24 menahan produk data berbayar dari sumber ini. Katalog menulis GEM "CC BY 4.0" sedangkan LISENSI-DATA menyebut bersyarat nonkomersial [?]; tidak dijadikan produk berbayar sampai pemilik memutus.
3. Kolom lisensi `sumber_katalog.json` kosong pada 49 dari 81 baris [F]; `sumber_katalog.json` sendiri berisi 81 baris, katalog riset ini 83.

---

## 3. Regulasi EBT

### 3.1 Cakupan sekarang [F]

- Katalog 622 dokumen (peraturan.bpk.go.id 485, jdih.esdm.go.id 137). Status: 314 berlaku, 160 dicabut, 39 diubah, 109 kosong. Jenis: Permen 279, Perda 105 (ditambah sekitar 60 Pergub, Perbup, Perwal), PP 59, Perpres 55, Keppres 30, UU 19, Inpres 5, OJK 1.
- Teks: 622 dokumen punya teks terurai, 27.901 segmen (judul, menimbang, mengingat, menetapkan, pasal, penjelasan, lampiran), tetapi hanya di `data/hukum/seed*.sql` (sekitar 64 MB, di-`.gitignore`) dan `data-panen/hukum`. Di GitHub hanya `public/data/hukum/katalog.json` (metadata). **Teks di GitHub saat ini = 0** (K22 menuntut sebaliknya; JM-U01).
- 571 teks mulus; 51 punya halaman pindaian (butuh OCR, OCR terlaksana 0); 125 gagal diurai; 141 tanpa tanggal ditetapkan.
- Relasi 5.828: 4.852 mengingat, 697 merujuk, 148 mencabut, 93 mengubah, 38 mengganti. `public/data/regulasi.json` (499 baris) adalah lapis tampilan; `hukum/katalog.json` lapis hukum.
- Perda RUED: 28 baris bertema RUED di katalog (27 perda di `rued.json`); 38 provinsi ditargetkan, sekitar 10 provinsi belum ada [EST]; judul sering tidak menyebut provinsi sehingga pemetaan perlu diperbaiki. Pemekaran Papua perlu dicek.
- Peringatan mutu: pencocokan (jenis, nomor, tahun) rentan salah karena `judul` sering salah isi (contoh: PP 5/2021 berjudul "Permen ESDM No. 5 Tahun 2021"; UU 32/2009 berjudul "UU No. 32 Tahun 2009 tentang Perlindungan"). Verifikasi nomor harus lewat PDF halaman 1 (JM-U05).

### 3.2 Dasar mengumumkan ulang

UU 28/2014 tentang Hak Cipta Pasal 42: tidak ada hak cipta atas peraturan perundang-undangan, sehingga teks boleh diumumkan ulang dengan atribusi [F dari pencarian web; belum dibaca langsung dari lembaran negara; K22 menugaskan pemeriksaan naskah saat JM-U01]. Tidak otomatis bebas: anotasi, ringkasan, dan terjemahan pihak ketiga (misalnya basis data berbayar); ringkasan buatan kita boleh. Hanya naskah resmi di Lembaran Negara atau Berita Negara yang otentik; salinan JDIH adalah rujukan dan layar menampilkan peringatan "bukan naskah otentik".

### 3.3 Cara ambil

| Sumber | Cara | Format | robots (11 Nov) | Catatan |
| --- | --- | --- | --- | --- |
| peraturan.bpk.go.id | `/Details/<id>`, `/Download/<id>/<berkas>.pdf`, `sitemap.xml` | HTML metadata dan PDF | Disallow hanya /Admin/ /Identity/ /Account/ /Manage/ | sumber utama; kolom status dan relasi di halaman detail |
| jdih.esdm.go.id | halaman daftar per jenis | HTML dan PDF | Allow / | 137 dok terambil |
| jdih.setneg.go.id | per jenis (UU, PP, Perpres) | PDF | Disallow kosong | salinan asli; belum dipakai; prioritas UU, PP, Perpres |
| peraturan.go.id | `sitemap.xml`, `/files/*.pdf` | PDF dan HTML | Disallow kosong | silang uji |
| jdihn.go.id | agregat JDIH daerah | HTML | Disallow /search-api/ | jalur ke Perda dan Pergub, jangan /search-api/ |
| putusan Mahkamah Konstitusi | untuk Cipta Kerja | PDF | belum dicek [?] | status UU 11/2020 |

Status berlaku diambil dari halaman detail BPK (Mencabut, Dicabut oleh, Mengubah, Diubah oleh); tidak disimpulkan sendiri dari teks kecuali relasi dalam konsiderans (sudah dilakukan `hukum.py urai`). Kelemahan: status "dicabut sebagian" dan UU yang diubah putusan MK harus ditandai manual.

### 3.4 Skema teks di GitHub (usulan riset, bentuk final di DESAIN-TEKNIS)

Jalur riset: `hukum/<jenis>/<tahun>/<jenis>-<nomor>-<tahun>.md`, jenis huruf kecil (uu, pp, perpres, inpres, permen-esdm, perda-<provinsi>, pojk, pmk); TIKET JM-U01 menulis `hukum/<jenis>/<tahun>/<id>.md` (id = jenis-nomor-tahun, selaras). Satu berkas per peraturan; PDF mentah tidak di repo (hanya hash). Frontmatter memuat id, jenis, nomor, tahun, judul, tgl_tetap (dari PDF halaman 1), status (`berlaku | dicabut | diubah | dicabut_sebagian | rancangan | tidak_diketahui`), status_per, mencabut, mengubah, dicabut_oleh, diubah_oleh, mengingat, topik, sumber (url, pdf_sha256, diambil), ekstraksi (metode, halaman, halaman_ocr, mutu), resmi (false untuk salinan JDIH), lisensi. Isi: Menimbang, Mengingat, Memutuskan, `### Pasal N` (jangkar `#pasal-12`), Penjelasan, Lampiran. Indeks `hukum/_indeks.json` dibangun dari frontmatter. Ukuran 622 dokumen dalam Markdown sekitar 60 sampai 100 MB [EST], wajar.

OCR: halaman dengan kurang dari 40 huruf ditandai butuh OCR; jalan lokal di Mac pemilik (`ekstraksi.metode: ocr-vision`); kutipan angka dari hasil OCR berstatus `perlu_tinjau` sampai dibaca orang (pelajaran Perda RUED Kaltara 8/2025 yang OCR-nya kacau). Cek keberlakuan mingguan memakai ETag untuk 622 dokumen; bila relasi berubah, buka isu otomatis; relasi diturunkan dua arah.

### 3.5 Target yang kosong

[F] Dari 94 target nasional terstruktur: 44 sudah ada teks, **50 kosong**; 11 entri tambahan semuanya belum ada. Rancangan 143 entri (105 nasional ditambah 38 Perda RUED) bukan daftar akhir; sisanya lewat enumerasi otomatis JDIH ESDM menurut kategori Permen dan Kepmen tahun 2005 sampai 2026 dengan saringan kata kunci.

Yang penting dan kosong: UU 30/2007 (Energi), UU 11/2020, Perpres 22/2017 (RUEN), Perpres 55/2019, PP 23/2010, PP 7/2021, PP 55/2022, PP 96/2021, PP 22/2021, PP 26/2021 (relevansi belum jelas), POJK 14/2023, Permen LHK 21/2022 dan 7/2023, PMK 130/2020 dan 21/2010, SEOJK 12/2023, Permenperin 16/2011, Kepmen ESDM RUPTL 2021-2030 dan 2025-2034 (PDF mentah ada, teks hukum kosong). Nomor yang riset tandai "perlu verifikasi" ditulis dari ingatan, bukan dari sumber; jangan dipakai sebelum diverifikasi [?]. Hanya metadata (tanpa teks): RPerpres PLTS 100 GWp, RUU EBET, dan 17 baris `dari_lokal`. Pantau: revisi Perpres 110/2025, revisi Perpres 112/2022.

Perda RUED provinsi (38, tiap provinsi satu target): Aceh, Sumatera Utara, Sumatera Barat, Riau, Kepulauan Riau, Jambi, Sumatera Selatan, Bangka Belitung, Bengkulu, Lampung, Banten, DKI Jakarta, Jawa Barat, Jawa Tengah, DI Yogyakarta, Jawa Timur, Bali, NTB, NTT, Kalimantan Barat, Tengah, Selatan, Timur, Utara, Sulawesi Utara, Gorontalo, Sulawesi Tengah, Barat, Selatan, Tenggara, Maluku, Maluku Utara, Papua, Papua Barat, Papua Barat Daya, Papua Tengah, Papua Selatan, Papua Pegunungan.

---

## 4. Benchmark 28 organisasi

Legenda: "tidak terbaca" berarti iuran tidak ditemukan di sumber yang terbaca, bukan berarti tidak ada. Baris 16 sampai 19 tidak sepenuhnya memenuhi daftar yang diminta (REAP, PIA, VIRE, VECEA, TSPA, SEDA tidak ditemukan atau dinamai lain); jangan dipakai sebagai bukti ketiadaan program [?]. Tidak ada asosiasi di sampel yang menyalurkan kredit sendiri; kolom pembiayaan mencatat forum investasi saja. URL tiap baris ada di lampiran riset benchmark (scratchpad).

| # | Organisasi (negara) | Yang bisa ditiru [F] | Tier dan iuran publik |
| --- | --- | --- | --- |
| 1 | SEIA (AS) | Solar Market Insight kuartalan dengan Wood Mackenzie: ringkasan gratis, lengkap gratis untuk Gigawatt dan Terawatt, dijual US$5.500 (anggota) atau 7.500 (bukan anggota) per edisi, US$14.500 atau 18.500 per 4 edisi; standar; RE+ diskon anggota | Basic US$900, Watt, Kilowatt, Megawatt, Gigawatt, Terawatt (US$190.000 pada materi 2024-2025, kursi dewan) |
| 2 | ACP American Clean Power (AS) | Laporan pasar; CleanPowerIQ gratis di tier Business ke atas | Pembeli (offtaker) US$25.000 / 50.000 / 100.000 menurut total PPA; usaha kecil US$5.000; pengembang mulai US$27.500 |
| 3 | ACORE (AS) | Finance Forum (tiket dan sponsor, bukan pembiayaan langsung); jaringan eksekutif | Leadership, Advisory, Executive Council; harga tidak terbaca |
| 4 | SolarPower Europe (UE) | Pernyataan posisi, pembaruan kebijakan mingguan, task force; Market and Policy Navigator, Market Outlook, webinar intelijen kuartalan; Solar Best Practices Mark (gratis anggota); direktori kontak anggota privat | 300+ anggota di 40+ negara; iuran tidak dipublikasikan |
| 5 | WindEurope (UE) | Advokasi ke Parlemen dan Komisi; statistik; business introductions | Market Leaders (kursi Board), Corporations, Non-profit; iuran tidak terbaca; tidak menerima individu |
| 6 | EUREC (UE, riset) | European Master in Renewable Energy (9 universitas); jaringan pusat riset | Anggota penuh = pusat riset (min. 10 FTE peneliti), asosiasi, industri; iuran tidak konsisten |
| 7 | BEE (Jerman) | Posisi ke Bundestag; komite ahli | Iuran menurut omzet dan karyawan dengan minimum; angka tidak terbaca |
| 8 | Solar Energy UK (Inggris) | Solar Stewardship Initiative bersama SPE | Tier menurut omzet; 2021: GBP450 sampai GBP5.500; angka 2026 tidak terbaca |
| 9 | RenewableUK (Inggris) | Forum gratis, working groups | Small Basic GBP450 per tahun sampai Grow GBP78.750 (sepuluh suara dewan) |
| 10 | Clean Energy Council (Australia) | **Akreditasi pemasang dan desainer lewat Solar Accreditation Australia; daftar produk terverifikasi; Approved Solar Retailer; Solar Retailer Code of Conduct** dipantau dan pelanggaran diselidiki; LearnLAB | AUD Sponsoring 99.000; Corporate 27.530; Professional services 13.200; Associate 4.550; Network 825 (per tahun, di luar GST) |
| 11 | CanREA (Kanada) | Program afinitas (asuransi kelompok, diskon); kategori Installer terpisah | Terawatt, Gigawatt, Industry Leader, Installer; iuran tidak terbaca |
| 12 | JPEA (Jepang) | PV OUTLOOK 2050 (125 GWAC atau 154 GWDC pada 2030) | iuran tidak terbaca |
| 13 | JWPA (Jepang) | Divisi Kebijakan; divisi internasional; kategori pemerintah daerah | 448 anggota (239 biasa, 190 asosiasi, 19 pemda) per 15 Mei 2026; buletin mingguan |
| 14 | REI (Jepang, think tank) | Riset dan rekomendasi; Asia Super Grid | Bukan keanggotaan; dana hibah dan donasi |
| 15 | NSEFI (India) | Laporan bersama SPE dan Invest India; CEO roundtable; 4 tiket gratis per tier | iuran tidak terbaca; klaim mewakili hampir 95% pasar surya India (klaim sendiri) |
| 16 | PSSEA (Filipina) | Konsultasi IRR dan lelang; panduan instalasi atap; kampanye "Sayang Ang Araw" | sekitar 75 anggota; iuran tidak terbaca [?] |
| 17 | TPVA (Thailand) | tidak ada data publik [?] | tidak ada data publik |
| 18 | VEA (Vietnam) | Usulan ke lembaga pemerintah; seminar | 330 organisasi dan individu (laporan 2019) [?] |
| 19 | MPIA (Malaysia) | Penghubung pemerintah; rantai pasok lokal | iuran tidak terbaca [?] |
| 20 | Global Solar Council (global) | Standar teknisi PV bersama Global Wind Organisation (2024) | anggota 97%+ kapasitas PV dunia (klaim sendiri); iuran tidak terbaca |
| 21 | GWEC (global) | Global Wind Report; Market Intelligence gratis untuk anggota korporat dan asosiasi, langganan untuk lain | Empat tier korporat (Global Leaders maks. 10, kursi Executive Council; Influencers; Players; Supporters) |
| 22 | IGA (global) | World Geothermal Congress | Lima kategori: individu, corporate club, institusional, mahasiswa, afiliasi |
| 23 | IHA (global) | **Hydropower Sustainability Standard** (sertifikasi proyek); Training Academy | 100+ anggota; sejak 2021 tidak berjenjang |
| 24 | REN21 (global) | Global Status Report (ko-autor, kumpul data, tinjau sejawat) | 130 anggota institusional, 4.000+ kontributor (2025) |
| 25 | IRENA Coalition for Action (global) | 3 working group (Community Energy; Decarbonising End-Use; Towards 100% RE); dialog publik-swasta | 120+ anggota; formulir tanpa iuran terbaca |
| 26 | ARE Alliance for Rural Electrification | Investment Academy dan Masterclass (khusus anggota); Energy Access Investment Forum | sekitar 200 anggota; Leading 2026 EUR32.864,75 (termasuk sponsor emas forum EUR20.000; nilai paket EUR113.094,50) |
| 27 | ACE ASEAN Centre for Energy | ASEAN Energy Outlook (AEO8, 30 Sep 2024); ASEAN Energy Business Forum (1.500+ delegasi) | Antarpemerintah; bukan keanggotaan berbayar |
| 28 | NABCEP (AS, pemberi sertifikat) | **PV Installer Specialist: aplikasi US$125, ujian US$375, ulang US$275, pembaruan US$390 per 3 tahun, CE 18 jam**; kode etik | Dibayar peserta; bukan dari iuran |

### 4.1 Alasan membayar (urut kekuatan bukti)

1. [F] Akses lebih awal atau lebih lengkap ke data pasar. Selisih harga anggota dan bukan anggota membuat iuran terasa murah bagi pembeli data.
2. [F] Status "disetujui" yang dipakai pasar atau regulator (CEC Approved Solar Retailer; Victoria mewajibkan peritel Solar Homes terdaftar menurut pemerintah Victoria; keterangan "wajib sejak Maret 2019" hanya dari situs pemasang [?]). Iuran peritel AUD800 sampai 6.000 per tahun menurut situs konsumen, mungkin usang [?].
3. [F] Kursi pengaruh dan visibilitas untuk tier atas (SEIA Terawatt, WindEurope Market Leaders, GWEC Global Leaders, CEC Sponsoring, RenewableUK Grow, ARE Leading).
4. [F] Pintu masuk bisnis: perkenalan, direktori kontak, forum investasi.
5. [F, tidak terukur] Pengaruh nyata pada regulasi: semua menulisnya sebagai manfaat pertama tetapi tidak ada yang mempublikasikan metrik "kebijakan yang dimenangkan". Kekosongan yang bisa diisi METI dengan pelacak terbuka (M02).
6. [F] Biaya hemat: diskon acara dan program afinitas. Pelengkap, bukan alasan utama.
7. [F] Tidak berjenjang bisa berhasil bila misi kuat (IHA sejak 2021).

### 4.2 Sumber pendapatan (proporsi tidak diaudit [?])

Iuran korporat bertingkat (rentang tier atas dibanding bawah 100 sampai 200 kali: CEC 99.000 lawan 825 = 120 kali; RenewableUK 78.750 lawan 450 = 175 kali [EST]); acara dan sponsor; penjualan data dan laporan; skema akreditasi dan sertifikasi; hibah dan donor untuk organisasi kebijakan.

### 4.3 Tiga pola terkuat untuk METI [U]

1. Data pasar berlisensi dengan ringkasan gratis (bahan baku sudah terluas; yang belum ada adalah produk yang terbit tepat tanggal, berbrand, berlisensi).
2. Skema "terpercaya" yang dipakai pasar (penyaring pemasang untuk PLTS atap dan koperasi desa; syarat masuk program PLTS 100 GW lewat koperasi).
3. Tier atas membeli kursi dan visibilitas, tier bawah membeli akses (isi yang bisa dihitung: kursi kelompok kerja, slot bicara ConEx, pemantauan permintaan).

### 4.4 Celah METI terhadap benchmark

| Dimensi | Status | Bukti repo | Celah |
| --- | --- | --- | --- |
| Advokasi dan posisi | Sebagian | 22 substansi RDPU 8 Sep 2026; `posisi_meti.jsonl` 27 butir; pelacak kebijakan; roadmap P4 | belum ada papan 22 butir x status x pemilik x tenggat untuk anggota; belum ada laporan posisi yang masuk; kelompok kerja tanpa ruang di platform |
| Data dan intelijen pasar | Sebagian kuat | ratusan dataset; `target_realisasi.json`, `peluang.json`, `ruptl*.json`; P1 Rapor "Baru" | belum ada produk terbit berkala berbrand; tak ada pembeda anggota; "data terbuka /data" untuk publik dibatalkan pemilik 7 Nov |
| Standar dan sertifikasi | Belum | B4 "Sertifikasi lewat LSP Mitra" Bersyarat; akademi hanya kuis 75% | tak ada skema akreditasi atau daftar produk terverifikasi |
| Kode etik konsumen | Belum | tidak ada modul | tak ada kode, pemantauan, jalur pengaduan |
| Pelatihan dan tenaga kerja | Sebagian | `akademi.js` 6 modul; `kerja.html` dan migrasi 0028; `kerja_vokasi.json` | tak ada pelatihan bersertifikat |
| Tender dan peluang | Sebagian kuat | `radar.html`, `lelang.html`, `peluang.html` | belum ada notifikasi anggota |
| Pertemuan bisnis B2B | Belum | klaim organisasi migrasi 0019 | tak ada perkenalan terarah atau RFQ |
| Misi dagang dan forum | Sebagian | ConEx 944 delegasi, 21 MoU | belum ada papan pipeline siap investasi |
| Pembiayaan | Sebagian | `jetp_cipp.json`, `keuangan_hijau.json`; B1, B2 | belum ada alur pengajuan proyek ke pendana |
| Event | Punya | `kalender`, RSVP, ConEx | tiket anggota belum terhubung iuran |
| Kelompok kerja | Sebagian | `bidang.html`; 6 Komite ET, 11 PMO, 8 Bidang di SK | tak ada notulen atau tenggat di platform |
| Tier dan iuran | Punya tarif | `keanggotaan.json`, `admin_anggota.js`, `kta`, `/daftar` | manfaat digital per tier tidak ditegakkan hak akses |
| Metrik dampak | Sebagian | `admin_statistik.js`, `admin_kesehatan.js` | basis 1.111 individu dan 41 organisasi belum direkonsiliasi dengan klaim 1.000+ atau 1.800 |
| Jangkauan wilayah | Sebagian | `meti-wilayah*.html`, migrasi 0015 | individu luar Jawa nyaris tidak terwakili |

---

## 5. Fakta dan target resmi

### 5.1 Fakta METI

| Fakta | Nilai | Sumber dan kepastian |
| --- | --- | --- |
| Pendirian | 1999 | arsip internal [F] |
| Basis anggota | 1.111 individu terbaca dan 41 organisasi (Utama 16, Perusahaan 20, Organisasi 4, Koperasi 1); klaim "+1.800" tidak terbukti; keputusan pemilik 7 Nov: ikuti database, bukan deck | arsip internal [F] |
| Sebaran | 27 dari 41 organisasi di DKI; individu DKI 473; afiliasi terbanyak PLN 174, PJB 75, BRIN 63 | arsip internal [F] |
| Situs publik | metiires.or.id menulis "1000+ Anggota dan Institusi", "20+ Kolaborator dan Mitra"; besaran iuran tidak tampil di halaman yang terbaca | dibaca 11 Nov 2026 [F] |
| Struktur kerja | 6 Komite ET (Bioenergi kosong), 11 PMO strategis (3 kosong), 8 Bidang Kerja | arsip internal [F] |
| METI Wilayah | 6 berdiri, 5 segera, 25 rencana; tiga versi angka berbeda antar deck | [F], konflik dicatat |
| Tangga iuran | Pelajar Rp100.000 (awal); Individu Rp450.000 awal + Rp350.000 per tahun; NGO Rp1.600.000 + Rp600.000; Usaha kecil Rp25.000.000 + Rp2.000.000; Usaha besar Rp50.000.000 + Rp2.500.000; Utama (Charter) Rp175.000.000 + Rp5.000.000; ditetapkan 1 Jul 2026 | `public/data/keanggotaan.json`, diambil 8 Nov 2026 [F] |
| Hak wakil | 1 (pelajar, individu), 2 (NGO), hingga 4 (usaha), hingga 8 (Utama) | `keanggotaan.json` [F] |
| Acara | EBTKE ConEx ke-12 (2 sampai 4 Sep 2026): 944 delegasi, 4.953 pengunjung, 110 pembicara, 21 MoU, 20 pameran, 15 sponsor; METI mitra acara KESDM, bukan tuan rumah penuh | arsip internal [F] |
| Advokasi 2026 | RDPU Komisi XII 8 Sep 2026 (22 substansi, 5 pilar); rekomendasi RUU EBET dan RUU Ketenagalistrikan Des 2025; 27 butir posisi | arsip internal [F] |
| Roadmap | 7 program Pasti (P1 sampai P7, Rp600 juta) dan 6 Bersyarat (B1 sampai B6, Rp2,63 miliar), 14 arah (A1 sampai A14), iuran maksimal Rp281 juta | `public/data/roadmap.json` [F] |
| Pengurus 2026-2028 | SK 0008/SK/METI/VIII/2026 | arsip internal [F] |

### 5.2 Target resmi Indonesia

| Target | Isi | Kepastian |
| --- | --- | --- |
| KEN, PP 40/2025 (mencabut PP 79/2014) | Bauran EBT energi primer 19 sampai 23% (2030), 36 sampai 40% (2040), 53 sampai 55% (2050), 70 sampai 72% (2060) | [F]; angka 2030 terbaca dari pindaian ("1,9olo = 19%") |
| RUKN 2025-2060 (Kepmen ESDM 85.K/TL.01/MEM.L/2025) | Bauran pembangkitan EBT 15,9% (2025), 16,4% (2026), 17,3% (2027), 19,1% (2028), 19,7% (2029), 21% (2030), 23,9% (2031), 29,4% (2034); kapasitas terbarukan 2060 sekitar 281,3 GW | [F], terverifikasi dari repo (Tabel 8 hlm 177) |
| RUPTL PLN 2025-2034 | Tambahan 69.512 MW: EBT 42.569 MW, storage 10.256 MW, fosil 16.687 MW; bauran EBT 2034 34,3% (RUKN 29,4%); kebutuhan 4,26 GW per tahun lawan laju historis 0,59 GW per tahun (7,2 kali) | [F] |
| Realisasi | Kapasitas EBT 13,86 GW (Statistik 2024) atau 14,44 GW (Laporan Kinerja DJK 2025); bauran pembangkitan 18,09% (Ember dan OWID 2024); bauran 2025 15,75% lawan target awal 23% | [F], definisi berbeda dicatat repo |
| PLTS 100 GW | Raperpres masih disusun; skema 80 GW lewat Koperasi Desa Merah Putih (80.000 desa, 320 GWh baterai) ditambah sekitar 20 GW terpusat; tahap pertama 13 atau 17 GW (sumber berbeda); horizon 2028 atau 2029 | [?] konflik angka dan tahun; Perpres belum terbit per sumber terakhir |
| Biodiesel | B50 dimulai 1 Jul 2026 menurut Kepmen ESDM 257.K/EK.01/MEM.E/2026 dengan transisi 3 bulan; sempat ditunda Jan 2026 lalu dihidupkan lagi; kelengkapan lapangan belum diverifikasi | [?] jadwal berubah-ubah |
| JETP | Komitmen awal US$20 miliar, disebut US$21,4 miliar (Des 2025); termobilisasi US$3,1 miliar (Des 2025); AS keluar Mar 2025; arsip METI menulis terserap sekitar 14% | [F/?] metrik berbeda |
| NDC | Second NDC disampaikan 27 Okt 2025; target 2035 berbasis level absolut (dua skenario 1,258 dan 1,489 miliar tCO2e); net zero 2060 atau lebih cepat; E-NDC 2022 (31,89% atau 43,2% pada 2030) tetap dikutip RUKN | [F] lewat berita; teks UNFCCC belum dibaca |
| Lain | Perpres 110/2025 (karbon), POJK 10/2026, SRUK beroperasi Juli 2026; Perpres 109/2025 (WtE); revisi Perpres 112/2022 belum terbit per Okt 2026; RUU EBET belum disahkan | [F menurut arsip internal], tidak dibaca ulang di sumber resmi |

[EST] Menuju 21% pembangkitan pada 2030 butuh sekitar 3,2 sampai 5,7 GW tambahan per tahun tergantung bauran teknologi, dibanding laju historis 0,59 GW per tahun. Kesenjangan ini adalah alasan "kenapa sekarang" untuk hampir semua program seri M.

### 5.3 Pemetaan dua belas program: urutan tiket dan urutan benchmark

Urutan di `TIKET` dan K25 berbeda dari penomoran M1 sampai M12 di riset benchmark. **Seluruh paket ini memakai urutan TIKET (JM-M01 sampai M12).** Padanannya:

| Tiket | Program | Nomor di riset benchmark | Skor dampak x kelayakan [U] | Roadmap lama |
| --- | --- | --- | --- | --- |
| JM-M01 | Pusat Data dan Intelijen Pasar | M1 | 25 | P1; A9 |
| JM-M02 | Pelacak Kebijakan dan Advokasi | M2 | 20 | P4; A11 |
| JM-M03 | Skema Pemasang Terpercaya | M3 | 16 | baru, terkait B4 |
| JM-M04 | Radar Proyek dan Desk Siap Bank | M5 | 15 | B1, B2; A12 |
| JM-M05 | Koperasi Desa | M7 | 15 | B3, B5; A4, A5, A6 |
| JM-M06 | Sertifikasi dan Akademi | M4 | 12 | P6; B4 |
| JM-M07 | Forum Bisnis dan Misi Dagang | M6 | 12 | P7 |
| JM-M08 | METI Wilayah 38 Provinsi | M9 | 12 | P5; A13 |
| JM-M09 | Hub Rantai Pasok | M10 | 9 | A8, A9; B6 sebagian |
| JM-M10 | Diplomasi Energi | M11 | 9 | baru (Bidang 8) |
| JM-M11 | METI Institute | M12 | 9 | P6; B6; A7 |
| JM-M12 | Klub Pembeli Hijau | M8 | 8 | A10 |

Skor adalah penilaian penyusun riset [U] dan tidak mengikat urutan K25.

---

## 6. Inventaris: yang sudah ada, bisa diolah sendiri, bisa diambil

### 6.1 Sudah ada [F]

- Data: 178 berkas `public/data`; 902 organisasi, 550 orang, 548 proyek (607 di `proyek_terpadu`), 866 berita, 622 regulasi berteks (di D1 lokal) dan 499 baris tampilan, 457 pustaka, 2.987 makalah dan 250 pakar OpenAlex, 338 baris pendanaan dan 235 pendanaan internasional, 41 acara kalender, 25 kampus di `riset_kampus.json`, `rapor/` (tahunan 2016-2025 dan beberapa edisi 2026), `paket_pemda.json` 38 provinsi, `radar_kabupaten.json`, `keanggotaan.json` (tangga iuran), `roadmap.json`, `target_realisasi.json`, `peluang.json`, `ruptl*.json`, `harga_komponen.json`, `tkdn*.json`, `rantai_plts.json`.
- Modul: pendaftaran mandiri `/daftar` (D20), KTA virtual dan verifikasi publik, portal klaim lembaga (migrasi 0019), klaim pakar (0037), konsultasi RUU, kerja dan lowongan (0028), pustaka hukum (0029), akademi 6 modul, roadmap dengan suka dan komentar, ikuti dan lonceng, RSVP, langganan newsletter, pesan ke admin, kotak tugas (0034), `meti-wilayah` (0015) dan halaman kelola, panel admin (kesegaran 16 dataset, kesehatan, KTA, daftar, langganan, pesan, kotak).
- Pengaman: migrasi 0001 sampai 0037; 217 berkas `*.test.mjs`; gerbang konsistensi dan bertaut; 18 agent proyek.
- Konten: 22 substansi RDPU, 27 butir `posisi_meti`; ConEx 2026 sebagai acara.

### 6.2 Bisa diolah sendiri (tanpa mengambil verbatim)

- Dari data yang sudah ada: tautan proyek ke organisasi, regulasi, berita, pendanaan, kabupaten (JM-L01 sampai L06) dengan metode ALGORITMA; graf relasi regulasi dua arah dari konsiderans (5.828 relasi); status berlaku per tanggal; peta dampak regulasi ke proyek, organisasi, teknologi, wilayah (JM-U06, U07); selisih kapasitas terlacak lawan nasional; rapor berkala dan lembar data (M01); skor kesiapan proyek (M04); indeks kapasitas pabrik yang direkonsiliasi (M09); rekonsiliasi angka METI lawan angka resmi (M01).
- Dari data terbuka lewat keputusan OLAH SENDIRI: potensi surya dan angin per provinsi (S29, S44, S45), risiko lahan (S69), integritas kredit karbon lewat VROD (S72).

### 6.3 Bisa diambil (60 sumber berjadwal)

- Otomatis (32): S01, S02, S03, S05, S06, S11, S12 (setelah kunci), S13, S17, S19, S22, S24, S30, S31, S33, S34, S35, S43, S47, S48, S49, S50, S52, S60, S62, S63, S64, S68, S71, S73, S80, S82.
- Semi-manual (28): S04, S09, S10, S14, S18, S20, S21, S23, S25, S26, S28, S36, S37, S38, S39, S40, S46 (setelah kunci), S53, S57, S59, S65, S66, S70, S74, S75, S76 (hanya Garuda), S77, S81.
- Tahan sampai pemilik: sumber berkunci (S12, S46, S30 untuk API, S50 penuh; C-25); data bersyarat nonkomersial (C-24).

---

## 7. Hal yang belum pasti

1. Nomor peraturan yang riset tulis dari ingatan dan bertanda "perlu verifikasi" (3.5).
2. Lisensi tertulis tiap situs belum dibaca ulang (2.1). Wajib dibaca sebelum tayang ulang tiap sumber baru.
3. Batas subrequest dan CPU Cloudflare, kebijakan menit gratis GitHub (2.3).
4. Frekuensi nyata sumber berasal dari kebiasaan, bukan pengamatan dua kali (2.2).
5. Keanggotaan nyata (D1 produksi) tidak terbaca (batas bahan). Basis 1.111 dan 41 berasal dari arsip internal, bukan dari D1.
6. Layar belum dibuka di peramban; temuan tampilan berdasar kode dan data.
7. Konflik angka PLTS 100 GW, B50, JETP (5.2).
8. Fitur RENCANA-AKHIR yang ditandai "tidak ditemukan" (1.7) mungkin ada di jalur kode yang dimuat dinamis.
9. Identitas "CASE" (S56) dan alamat data.esdm.go.id (S08).
