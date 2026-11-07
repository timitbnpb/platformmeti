# R15: Direktori Regulasi EBET (tiket JM-D06)

Tanggal panen: 7 November 2026. Keluaran ada di `data-panen/regulasi/` (diabaikan git). Dokumen ini hanya laporan; belum ada yang di-commit.

## 1. Ringkasan

| Hal | Nilai |
| --- | --- |
| Baris `regulasi.jsonl` | 437 (435 dari peraturan.bpk.go.id, 2 rancangan dari masukan lokal) |
| Baris `ikatan_regulasi.jsonl` | 451 (126 mencabut, 325 mengubah); jenis `melaksanakan` dan `merujuk` belum diisi |
| Masukan lokal (17 baris) | 17 dari 17 digabung (cocok BPK atau ditambahkan); posisi METI menempel pada 10 baris, sumbernya tetap dicatat |
| Sumber panen | satu situs: peraturan.bpk.go.id (JDIH BPK), 569 halaman pencarian dan 470 halaman detail disimpan di `raw/` |
| Status | berlaku 300, dicabut 107, diubah 28, rancangan 2, tidak-diketahui 0 |

## 2. Cakupan per jenis

| Jenis | Jumlah | Catatan |
| --- | --- | --- |
| perda (termasuk perbup, pergub, perwali) | 181 | didominasi perda ketenagalistrikan daerah; 27 baris RUED |
| permen (termasuk PMK) | 82 | 57 terbit dari Kementerian ESDM |
| perpres | 55 | |
| pp | 54 | |
| keppres | 28 | |
| uu | 20 | |
| lainnya (Bapeten, BMKG, BIG, BKPM) | 9 | |
| inpres | 5 | |
| kepmen | 2 | BPK hampir tidak memuat Kepmen; lihat celah |
| perppu | 1 | Perppu 2/2022 |

## 3. Cakupan per topik

Satu peraturan bisa punya beberapa topik, jadi jumlah melebihi total baris.

| Topik | Jumlah | Topik | Jumlah |
| --- | --- | --- | --- |
| jaringan (ketenagalistrikan) | 201 | surya | 23 |
| perizinan | 45 | panas_bumi | 16 |
| perencanaan | 39 | energi_baru_umum | 12 |
| harga | 36 | hidro | 12 |
| penyimpanan (baterai, KBLBB) | 36 | efisiensi | 6 |
| bioenergi | 32 | tkdn | 3 |
| nuklir | 31 | hidrogen | 2 |
| energi_umum | 30 | angin | 1 |
| insentif | 27 | laut | 0 |
| karbon | 26 | | |

Topik diberi otomatis dengan pola kata pada judul, bukan dibaca per pasal. Topik `laut`, `hidrogen`, `angin`, dan `tkdn` tipis karena memang jarang ada di judul peraturan, bukan karena pasti tidak ada aturannya.

## 4. Peraturan inti (30 teratas)

Semua ditemukan di BPK. Status dihitung dari rantai pencabutan dan perubahan yang tertulis di halaman BPK.

| No | Id | Judul singkat | Status | Topik |
| --- | --- | --- | --- | --- |
| 1 | uu-30-2007 | Energi | berlaku | energi_umum |
| 2 | uu-30-2009 | Ketenagalistrikan | diubah (UU 11/2020, Perppu 2/2022, UU 6/2023) | jaringan |
| 3 | uu-21-2014 | Panas Bumi | diubah (rantai yang sama) | panas_bumi |
| 4 | uu-6-2023 | Penetapan Perppu Cipta Kerja | diubah | perizinan |
| 5 | uu-16-2016 | Pengesahan Persetujuan Paris | berlaku | karbon |
| 6 | uu-10-1997 | Ketenaganukliran | diubah | nuklir |
| 7 | uu-32-2009 | Perlindungan dan Pengelolaan Lingkungan Hidup | diubah | perizinan |
| 8 | pp-40-2025 | Kebijakan Energi Nasional | berlaku | perencanaan |
| 9 | pp-79-2014 | Kebijakan Energi Nasional | dicabut oleh PP 40/2025 | perencanaan |
| 10 | pp-33-2023 | Konservasi Energi | berlaku | efisiensi |
| 11 | pp-14-2012 | Usaha Penyediaan Tenaga Listrik | diubah (PP 23/2014) | jaringan |
| 12 | pp-7-2017 | Panas Bumi untuk Pemanfaatan Tidak Langsung | diubah | panas_bumi |
| 13 | pp-25-2021 | Penyelenggaraan Bidang ESDM | berlaku | perizinan |
| 14 | pp-28-2025 | Perizinan Berusaha Berbasis Risiko | berlaku | perizinan |
| 15 | perpres-22-2017 | Rencana Umum Energi Nasional | berlaku | perencanaan |
| 16 | perpres-112-2022 | Percepatan Pengembangan EBT untuk Tenaga Listrik | berlaku | harga, perencanaan |
| 17 | perpres-98-2021 | Nilai Ekonomi Karbon | dicabut oleh Perpres 110/2025 | karbon |
| 18 | perpres-110-2025 | Instrumen Nilai Ekonomi Karbon | berlaku | karbon |
| 19 | perpres-55-2019 | Kendaraan Bermotor Listrik Berbasis Baterai | diubah (Perpres 79/2023) | penyimpanan |
| 20 | perpres-35-2018 | Pengolah Sampah menjadi Energi Listrik | dicabut | bioenergi |
| 21 | perpres-5-2006 | Kebijakan Energi Nasional (lama) | berlaku menurut BPK, dugaan salah (lihat 7) | perencanaan |
| 22 | permen-esdm-2-2024 | PLTS Atap | berlaku | surya |
| 23 | permen-esdm-26-2021 | PLTS Atap (lama) | dicabut oleh Permen ESDM 2/2024 | surya |
| 24 | permen-esdm-12-2023 | Biomassa sebagai campuran bahan bakar PLTU | berlaku | bioenergi |
| 25 | permen-esdm-11-2021 | Pelaksanaan Usaha Ketenagalistrikan | berlaku | jaringan |
| 26 | permen-esdm-10-2022 | Harga jual tenaga listrik dan sewa jaringan | berlaku | harga |
| 27 | permen-esdm-4-2025 | Mandatori bioetanol | berlaku | bioenergi |
| 28 | permen-esdm-5-2025 | Deemed commissioning dan deemed dispatch | berlaku | harga |
| 29 | uu-27-2003 | Panas Bumi (lama) | dicabut oleh UU 21/2014 | panas_bumi |
| 30 | uu-15-1985 | Ketenagalistrikan (lama) | dicabut oleh UU 30/2009 | jaringan |

Baris 21 belum saya adu manual; status dari BPK bisa terlambat untuk peraturan lama yang digantikan oleh aturan yang tak ada di basis BPK.

## 5. Rantai pencabutan penting

- KEN: Perpres 5/2006 menjadi PP 79/2014, dicabut oleh PP 40/2025.
- PLTS atap: Permen ESDM 49/2018 diubah oleh 13/2019 dan 16/2019, semuanya dicabut Permen ESDM 26/2021, lalu dicabut Permen ESDM 2/2024.
- Panas bumi: UU 27/2003 dicabut UU 21/2014; UU 21/2014 diubah UU 11/2020, Perppu 2/2022, UU 6/2023.
- Ketenagalistrikan: UU 15/1985 dicabut UU 30/2009; UU 30/2009 diubah rantai Cipta Kerja yang sama.
- Karbon: Perpres 98/2021 dicabut Perpres 110/2025.
- Kendaraan listrik: Perpres 55/2019 diubah Perpres 79/2023.
- Perpres 112/2022 dan Perpres 22/2017 tidak punya catatan perubahan di BPK.

## 6. Verifikasi

Kelengkapan kolom (persen baris terisi): id, jenis, nomor, tahun, judul, status, topik, ringkasan, tanggal_ambil 100; instansi_penerbit 98; url_sumber dan url_pdf 98; tanggal_ditetapkan 97; tanggal_diundangkan 84; dicabut_oleh 24; mencabut 18; diubah_oleh 11; posisi_meti dan sumber_posisi 2; pasal_kunci 0 (tidak diisi).

Ringkasan: 30 baris inti ditulis tangan (parafrase, 30 kata atau kurang). Sisanya templat otomatis dari judul ("jenis nomor/tahun mengatur ..."), tidak boleh dianggap ringkasan editorial. Kolom `instansi_penerbit` berisi "Pemerintah Pusat" untuk PP, Perpres, dan sejenisnya sesuai BPK.

Adu ke halaman resmi (diambil ulang 7 Nov 2026), 6 baris cocok semua pada nomor, tahun, dan status:

| Id | Nomor/tahun resmi | Status resmi BPK | Data kita |
| --- | --- | --- | --- |
| pp-79-2014 | 79/2014 | Tidak Berlaku | dicabut |
| uu-21-2014 | 21/2014 | Berlaku | diubah (ada catatan perubahan) |
| permen-esdm-2-2024 | 2/2024 | Berlaku | berlaku |
| perpres-98-2021 | 98/2021 | Tidak Berlaku | dicabut |
| uu-30-2009 | 30/2009 | Berlaku | diubah |
| perpres-22-2017 | 22/2017 | Berlaku | berlaku |

Dicari dan TIDAK ketemu (atau tidak dimuat):

| Dicari | Sebab |
| --- | --- |
| RUU Ketenagalistrikan (Gatrik) | situs DPR tidak dipanen pada putaran ini |
| RUU EBET (hanya dari masukan lokal) | idem; statusnya `rancangan` dari dokumen METI, belum dicek ke DPR |
| Perpres 18/2020 (RPJMN) | tidak lolos saringan judul energi |
| PP 23/2010 (minerba) | di luar saringan topik |
| Perpres 117/2021 | dugaan nomor saya salah, tidak ketemu di hasil pencarian |
| Kepmen ESDM (RUPTL, harga patokan, WK panas bumi) | BPK memuat Kepmen sangat sedikit (2 baris, keduanya dari masukan lokal); butuh jdih.esdm.go.id |
| Dokumen RUPTL, JETP, CIPP, NZE | bukan peraturan; tidak tercakup |

## 7. Celah

1. Hanya satu situs dipanen. jdih.esdm.go.id (robots mengizinkan) belum disentuh, jdih.setkab.go.id tidak terjangkau (koneksi gagal), ebtke.esdm.go.id dan DPR belum diakses. Dampak terbesar: Kepmen ESDM dan status RUU.
2. RUED: 26 provinsi tercakup (27 baris, Kaltara dua kali); 12 provinsi belum ada, perlu dicek per provinsi.
3. OJK taksonomi/keuangan berkelanjutan dan Permen KLHK perdagangan karbon baru tertangkap lewat kata kunci judul; belum diverifikasi lengkap.
4. Jenis ikatan `melaksanakan` dan `merujuk` belum ada; hanya `mengubah` dan `mencabut` dari halaman BPK.
5. Perda ketenagalistrikan kabupaten (sebagian besar baris perda) dimuat karena judulnya, banyak yang usang atau sekadar retribusi; pertimbangkan tidak menampilkannya default di `/kebijakan`.
6. Topik otomatis dan status BPK bisa terlambat; peraturan baru 2026 perlu dicek manual.
7. Judul dari situs kadang huruf besar semua atau tertulis "Permen ESDM No. X Tahun Y tentang ..."; belum dinormalkan.

## 8. Cara menjalankan ulang

```
node scripts/panen/panen_regulasi.mjs --selftest   # tanpa jaringan
node scripts/panen/panen_regulasi.mjs --cari       # pencarian judul per kata kunci, resumable (~50 menit)
node scripts/panen/panen_regulasi.mjs --detail     # halaman Details kandidat + rantai, resumable (~20 menit)
node scripts/panen/panen_regulasi.mjs --bangun     # tanpa jaringan: raw/ + masukan lokal -> jsonl
```

Berkas di `raw/cari` dan `raw/detail` tidak diunduh ulang bila ada; hapus untuk memaksa segar. Tambah kata kunci di larik `KATA`, ubah saringan di `RELEVAN`, ringkasan tulisan tangan di `RINGKAS_MANUAL`.

## 9. Etika yang dipatuhi

- robots.txt BPK dibaca di awal tiap proses; hanya `/Search` dan `/Details` yang diminta, jalur terlarang (`/Admin/`, `/Identity/`, dst.) diblokir di kode.
- UA jujur `METI-Network-research/0.1 (+https://platformmeti.timitbnpb.workers.dev)` pada versi akhir skrip. Catatan: sebagian panen (pencarian dan sebagian detail) berjalan dengan UA lama yang memuat surel kontak; surel itu tidak tersimpan di berkas apa pun dalam repo.
- Satu permintaan serentak, jeda 2,2 detik, penghentian bila 403 atau 429 berulang (tidak terjadi).
- Tidak ada CAPTCHA, tidak ada login.
- Peraturan perundang-undangan bukan objek hak cipta (UU 28/2014 Pasal 42); URL sumber tiap baris disimpan, ringkasan ditulis sendiri.
- `raw/` (125 MB) dan jsonl ada di `data-panen/` yang diabaikan git.
