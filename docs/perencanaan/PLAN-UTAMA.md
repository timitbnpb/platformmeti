# Plan utama 5 jam (8 Nov 2026 malam)

Satu rencana pengganti RENCANA-AKHIR.md dan BRAINSTORM-AKHIR.md untuk sesi 5 jam. Induk (Opus) memutuskan semua; pemilik tidak diminta keputusan. Mesin dijaga hidup dengan caffeinate 6 jam.

## Aturan jalan
- Maks sekitar 6 agent paralel, satu pemilik per berkas; berkas bersama (direktori.js, tema.css, i18n) disunting potongan kecil.
- Tiap agent: selera pemilik (memori tanpa-dempet), cek peramban 1440/390, uji tanpa kegagalan baru.
- Panen: UA METI, robots dihormati, jeda 2 detik, berhenti di 403/429, tanpa login/medsos/Antara. Lisensi dicatat.
- Tidak dikerjakan (keputusan pemilik): integrasi Midtrans otomatis, Google OAuth, Meta Graph, surel transaksional, panen terjadwal CI.
- Tidak push ke main (push = tayang publik): commit lokal per kelompok, pemilik push sendiri.

## Keputusan induk atas hal tertunda
- ESDM One Map: robots melarang (Disallow: /). Pengganti: OpenStreetMap (ODbL, atribusi) untuk jaringan transmisi dan gardu induk lewat Overpass; WKP panas bumi dari daftar publik ESDM/GEM yang sudah ada.
- Ember bulanan tidak memuat Indonesia tanpa kunci API: pakai tahunan 2015-2025 yang ada.
- Foto wajah di repo, folder Claude outputs, email di INFRASTRUKTUR.md, panen_1001.mjs, folder lama: dibiarkan, dicatat di Buku Pegangan untuk pemilik (tidak menghapus apa pun).
- Simulator bauran 2030 (alat): ditunda sesuai arahan "tools nanti".

## Lingkup data publik
| No | Data | Status |
|---|---|---|
| 1 | Global Energy Monitor (PLTU, surya, bayu, hidro, panas bumi, bio) | Selesai: 478 lokasi, 59 cocok ke proyek, 8 ragu, 122 baru |
| 2 | Ember bauran | Tahunan 2015-2025 ada |
| 3 | Jaringan transmisi, gardu induk, WKP | Gelombang B (OSM pengganti ESDM) |
| 4 | Statistik PLN/ESDM per wilayah | Edisi 2024 ada; 2025, BPP, susut di Gelombang B |
| 5 | TKDN per produk, insentif Kemenkeu, taksonomi OJK | Gelombang B |
| 6 | Podes BPS desa berlistrik, APBD energi DJPK | Gelombang B |
| 7 | PSN, AMDALNET, pengumuman lelang PLN | Gelombang C |
| 8 | Database proyek GCF, ADB, World Bank, AIIB, JICA, lampiran JETP | Gelombang C |
| 9 | OpenAlex per kampus, paten PDKI, jurnal DOAJ | Gelombang C |

## Lingkup fitur strategis
| No | Fitur | Gelombang |
|---|---|---|
| 1 | Green jobs /kerja | A (berjalan) |
| 2 | Radar peluang kabupaten + dedieselisasi /radar | A (berjalan) |
| 3 | Pelacak proyek terpadu (GEM + RUPTL + berita): status, keterlambatan COD, pemilik, dedup | B |
| 4 | Peta rantai pasok dan TKDN: komponen belum diproduksi lokal | C |
| 5 | Topik mendalam 16 topik lengkap + cetakan | A (berjalan) |
| 6 | Pendanaan: negara donor, cocok mengajukan | A (berjalan) |
| 7 | Program nasional terpadu | A (berjalan) |

## Gelombang dan jadwal
- A, jam 0-2 (berjalan): cetakan topik, riset ulang 3 kelompok topik, program, Green jobs, radar, pendanaan.
- B, jam 0-3: (B1) pelacak proyek terpadu + jaringan OSM; (B2) panen TKDN/insentif/taksonomi + Podes/DJPK + Statistik 2025.
- C, jam 2-4: (C1) panen PSN/AMDALNET/lelang + database pendana + JETP, disambung ke proyek dan pendanaan; (C2) riset OpenAlex/PDKI/DOAJ disambung ke kampus/pakar/inovasi; (C3) peta rantai pasok dan TKDN.
- D, jam 4-5: kamus id lintas data + gerbang tautan mati, uji penuh hijau, cek visual halaman utama 1440/390, commit lokal per kelompok, Buku Pegangan diterbitkan sebagai artifact, laporan akhir.

## Selesai bila
- npm run uji hijau (kecuali uji waktu flaky yang ditandai).
- Semua halaman baru punya kepala berubin, grafik interaktif, label berwarna berikon, paginasi standar, tampil rapi di 390.
- Tiap dataset baru punya sumber, tanggal akses, lisensi, dan uji kecil.
- Commit lokal siap push; daftar perintah migrasi produksi (lowongan) di laporan akhir.

## Gelombang E: 40 tambahan (masuk antrean, dikerjakan setelah A-C sesuai slot)
Yang tadi di brainstorm belum masuk plan 5 jam ditandai (B). Urutan = prioritas.

### Halaman dan analisa
1. (B) Pita "hari ini di EBT" + "yang berubah minggu ini" di beranda (selisih potret mingguan).
2. (B) Rapor provinsi tahunan + proyeksi capaian RUED + provinsi sebanding.
3. (B) Halaman tiap METI Wilayah (pengurus, agenda, kegiatan) + peta wilayah prioritas.
4. (B) Skor kesehatan organisasi + jaringan proyek bersama + pangsa pasar per teknologi (HHI).
5. (B) Jejaring orang (rekan direksi/komisaris) + riwayat perpindahan jabatan.
6. (B) Peta kekuatan riset per kampus + celah riset ke inovasi.
7. (B) Pencocok pendanaan: skema cocok per proyek/organisasi + tenggat segera tutup.
8. (B) Dampak aturan baru ke proyek/organisasi + aturan tumpang tindih.
9. (B) Sentimen dan topik berita per bulan + siapa paling sering disebut.
10. (B) Ekspor PDF satu klik per provinsi, organisasi, topik.
11. Rapor bulanan otomatis "4 temuan" (gaya 1001startup).
12. Profil ringkas 514 kabupaten/kota.
13. Halaman "Proyek berhenti" diperkaya kronologi dan penyebab (pola gagal).
14. Halaman PLTS atap nasional: kuota per sistem, pelanggan, kapasitas terpasang.
15. Halaman perdagangan karbon: IDXCarbon transaksi, harga, SPE-GRK proyek EBT.
16. Halaman JETP: dana tersalur, proyek CIPP, pensiun PLTU (linimasa).
17. Pelacak pensiun dini PLTU (GEM coal + JETP) dengan dampak emisi.
18. Halaman kendaraan listrik: SPKLU per provinsi, penjualan, pabrik baterai.
19. Halaman hidrogen dan amonia hijau: proyek, MoU, kawasan.
20. Kalender tenggat regulasi dan lelang (ICS).

### Data publik
21. Kuota PLTS atap per sistem (PLN, Permen ESDM 2/2024).
22. SPKLU per provinsi (PLN/ESDM) dan penjualan BEV (Gaikindo/AISI ringkasan).
23. IDXCarbon transaksi bulanan dan SRN PPI proyek terdaftar.
24. Laporan tahunan emiten energi IDX (kapasitas, capex EBT).
25. LHKPN/AHU ringkas pengurus perusahaan (tanpa data pribadi).
26. Daftar IUPTL/IUPTLS ESDM.
27. Daftar anggota asosiasi (APLSI, AESI, API, APROBI, MKI, Gabel).
28. Perda RUED 38 provinsi lengkap + target per teknologi.
29. Rasio elektrifikasi dan desa belum berlistrik per kabupaten (ESDM/PLN).
30. Harga BBM industri/diesel per wilayah (untuk dedieselisasi).
31. Faktor emisi grid per sistem (KESDM) untuk hitung emisi terhindar.
32. Global Wind/Solar Atlas per kabupaten (rata-rata, bukan titik ibu kota).

### Inputan dan admin
33. (B) Pemda mengisi realisasi RUED; pengembang memperbarui status proyek dengan bukti.
34. (B) Warga melapor kondisi proyek (foto, koordinat, moderasi).
35. (B) Pakar klaim profil + ketersediaan narasumber; kampus/startup daftar inovasi.
36. (B) Kotak masuk kurasi terpadu di Admin (semua usulan satu antrean, status, penugasan).
37. (B) Panel kesegaran data per dataset + panel duplikat dengan tombol gabung.
38. (B) Panel logo/foto hilang dengan unggah langsung.
39. (B) Log audit bisa dicari dan diekspor; endpoint ringkasan pengunduh unik dan total jejak.
40. Notifikasi "ikuti" (organisasi, proyek, provinsi, topik, regulasi) di layar akun.

## Gelombang F: 9 pilihan pemilik (8 Nov 2026 malam)
1. Komitmen korporat dan PPA korporat (RE100, SBTi, target net zero, PPA EBT korporat) -> /korporat.
2. Kinerja pembangkit aktual (faktor kapasitas nyata vs rencana) -> /kinerja.
3. Peta risiko sosial dan lingkungan (kawasan hutan, gambut, adat, rawan bencana x proyek) -> /risiko.
4. Pelacak harga komponen (modul, baterai, turbin, inverter) -> /harga-komponen.
5. Indeks kemudahan perizinan per provinsi -> /perizinan.
6. Keandalan sistem listrik (SAIDI/SAIFI, curtailment per wilayah PLN) -> /keandalan.
7. Desa energi mandiri (PLTS komunal/PLTMH desa: hidup/mati, penyebab) -> perluas /desa-energi.
8. Ekspor-impor komponen EBT (HS code, negara asal) -> bagian di /harga-komponen.
9. Pasokan SDM vokasi (prodi, SMK, politeknik energi, lulusan vs kebutuhan) -> bagian di /kerja.
Pembagian agent: F1 (1+2), F2 (3+7), F3 (4+8), F4 (5+6), F5 (9, agent Green jobs).

## Gelombang G: dipilih induk untuk sesi otomatis 5 jam (kompleks, berdampak besar)
1. G1 Riwayat perubahan dan kesegaran data: potret harian dibandingkan (diff) -> changelog per entitas (organisasi, orang, proyek, regulasi), umur tiap dataset, panel Admin, "diperbarui ..." di halaman publik, pita "yang berubah minggu ini" di beranda.
2. G2 Cari global berbasis isi + label kepercayaan: indeks gabungan (organisasi, orang, proyek, regulasi + pasal hukum, topik per bab, berita, pakar, inovasi) dengan peringkat; komponen label kepercayaan (Resmi/Media/EST/Hipotesis + tanggal + sumber) dipasang di ubin dan tabel bersama.
3. G3 Dasbor anggota "METI untuk saya": ikuti entitas, umpan perubahan dari G1, skema pendanaan cocok, acara terdekat, lowongan cocok; notifikasi di layar akun.
4. G4 Mode presentasi + ekspor: layar penuh per exhibit, ekspor PPT gaya METI dan PDF, kartu bagikan OG otomatis per entitas (Worker merender SVG ke PNG atau SVG statis).
5. G5 Glosarium nasional /istilah dengan hover definisi di seluruh situs.
Urutan jalan: G1 dan G2 segera; G3 setelah G1; G4 dan G5 saat slot kosong; Gelombang D (uji hijau, cek visual, commit lokal, Buku Pegangan) di jam terakhir.
6. Pilihan pemilik tambahan: kartu bagikan otomatis (OG), glosarium nasional /istilah, aksesibilitas + mode gelap penuh, tinjau seluruh bahasa Inggris (en.json). Aksesibilitas/mode gelap dan tinjau EN dijalankan di gelombang D (setelah agent lain berhenti menyunting CSS dan i18n) agar tidak bentrok.

## Gelombang H: Iklim dan karbon (lapisan klaim, bukan direktori terpisah)
- H1 (fase 1): registri karbon terpadu (Verra, Gold Standard, SRN PPI, IDXCarbon, Plan Vivo), pasar karbon energi (IDXCarbon, PTBAE-PU, pajak karbon, faktor emisi grid), dampak harga karbon ke EBT vs PLTU, halaman /karbon, pelaku masuk direktori.
- H2 (fase 2): lapisan lahan (konsesi, perhutanan sosial, wilayah adat, mangrove, kawasan hutan, gambut), klaim per provinsi/kabupaten di profil wilayah, uji integritas karbon (tidak di SRN, multi-registri, tumpang tindih, metodologi, otorisasi) berbahasa netral dengan hak jawab, lapisan di peta nasional.
- Fase 3 (kemitraan data poligon resmi KLHK/BRWA/CIFOR) ditunda sampai ada mitra.
Juga: peta pemangku kepentingan per proyek, pencocok lokasi industri hijau, pelacak target vs realisasi (berjalan).
