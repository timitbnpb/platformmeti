# Rencana akhir Direktori METI

Disusun 8 Nov 2026 dari BRAINSTORM-AKHIR.md. Di luar cakupan atas keputusan pemilik: integrasi Midtrans otomatis, Google OAuth, Meta Graph, surel transaksional, dan panen terjadwal lewat CI.

Cara kerja: maksimal 5 agent paralel per gelombang, satu pemilik per berkas, tiap gelombang ditutup dengan `npm run uji` hijau, cek peramban 1440 dan 390, lalu commit. Perkiraan waktu = jam kerja agent (paralel), bukan jam orang.

## Gelombang 0. Stabilkan yang sedang jalan (1 sampai 2 jam)
1. Tunggu dan periksa agent yang masih jalan: topik (cetakan + 3 riset ulang), pakar/kampus/inovasi, pendanaan (negara donor), program, beranda, Tentang, teknologi, foto tajam.
2. Uji penuh hijau (sisa: style= di beranda_pelaku.js, --c di program_kartu.css, uji lembar orang, uji topik basi, S4 flaky).
3. Cek visual halaman utama (beranda, direktori semua tab, proyek, peluang, wilayah, topik, metode, regulasi, tentang, admin) di 1440 dan 390.
4. Commit per kelompok (UI, data, panen, uji). Pemilik push.
Selesai bila: uji hijau, tidak ada tangkapan yang melanggar selera, commit siap.

## Gelombang 1. Data tersambung (4 sampai 6 jam)
1. Kamus id lintas data dan gerbang tautan: tiap rujukan id (organisasi, proyek, orang, regulasi, pendanaan, berita, topik, provinsi, pakar, kampus, inovasi) wajib ada; uji gagal bila ada tautan mati.
2. Dedup: proyek ganda (BESS Smoothing x5, Musi hydro), anak usaha ganda, nama kotor; antrean tinjau untuk kasus ragu.
3. Pasang langkah yang belum masuk rantai potret: proyek_peristiwa, orang_bersih, orang_wikidata, berita_gambar; urutan dicatat di AGENTS.md.
4. Pecah JSON besar (riset 1,7 MB, organisasi 970 KB) jadi per halaman/per tab agar ringan.
Selesai bila: gerbang tautan hijau, jumlah duplikat terlapor 0 atau masuk antrean, ukuran unduhan halaman direktori turun.

## Gelombang 2. Lengkapi data publik (6 sampai 10 jam, bergantung situs sumber)
1. Logo: 257 organisasi tanpa logo (lewat situs manual kurator untuk yang tanpa situs), 7 logo kampus.
2. Orang: tahun jabatan dan pendidikan dari situs direksi resmi; 185 kandidat Wikidata "tinjau".
3. Foto pakar lewat jalur resmi (OpenAlex/ORCID/Wikidata/halaman staf kampus yang mengizinkan); SINTA tidak (403).
4. Berita GDELT 12 bulan saat 429 reda; status proyek dari berita diperluas dengan aturan ketat.
5. Wilayah: RUED 38 provinsi, APBD energi DJPK, Podes BPS desa belum berlistrik, kuota PLTS atap per sistem, WKP.
6. Organisasi: AHU (badan hukum), TKDN per produk, IUPTL, daftar anggota asosiasi.
7. Proyek: lampiran RUPTL, AMDALNET, PSN, progres JETP CIPP (pemilik/pelaksana).
8. Pendanaan: database proyek GCF, ADB, World Bank, AIIB, KfW, JICA untuk Indonesia; BPDLH.
9. Regulasi: JDIH ESDM/KLHK/Kemenperin/OJK, Prolegnas RUU EBET, Perda RUED.
Aturan panen tetap: UA METI, robots, jeda 2 detik, berhenti di 403/429, tanpa login/medsos/Antara.
Selesai bila: tiap dataset punya tanggal panen dan sumber, cakupan per medan dilaporkan.

## Gelombang 3. Fitur dan analisa halaman (8 sampai 12 jam)
1. Green jobs: halaman lowongan EBT (kartu, saring teknologi/provinsi/jenjang, tautan pemberi kerja), kebutuhan tenaga kerja EST dari pipeline RUPTL, peta sertifikasi LSP; input lowongan oleh organisasi anggota dengan moderasi.
2. Beranda: pita "hari ini di EBT" dan "yang berubah minggu ini" (selisih potret mingguan).
3. Wilayah: rapor provinsi tahunan, proyeksi capaian RUED, provinsi sebanding, profil ringkas 514 kab/kota.
4. METI Wilayah: halaman per wilayah, peta wilayah prioritas.
5. Organisasi: skor kesehatan, jaringan proyek bersama, pangsa pasar per teknologi.
6. Orang/pakar/kampus: jejaring rekan, perpindahan jabatan, peta kekuatan riset, celah riset ke inovasi.
7. Pendanaan: kecocokan skema dengan proyek, tenggat yang segera tutup.
8. Proyek: pelacak keterlambatan COD, skor risiko, tenaga kerja EST per proyek.
9. Peluang: dedieselisasi sistem isolated; panel hasil kelayakan dan arus kas PLTS atap (sisa agent peluang).
10. Biaya/keuangan: EBT lebih murah dari BPP per sistem, beban subsidi diesel.
11. Regulasi: dampak aturan baru ke proyek dan organisasi, aturan tumpang tindih.
12. Berita: sentimen dan topik per bulan, siapa paling sering disebut.
13. Topik: ekspor PDF dan ringkasan satu halaman.
14. Ganti exhibit "Cara menghitung" di tiap halaman dengan tautan ke /metode#jangkar.
Selesai bila: tiap fitur punya uji, grafik interaktif, cek visual 1440/390.

## Gelombang 4. Inputan pengguna (4 sampai 6 jam)
1. Pemda mengisi realisasi RUED; pengembang memperbarui status proyek dengan bukti; warga melapor kondisi proyek (foto, koordinat, moderasi).
2. Pakar mengklaim profil dan ketersediaan narasumber; kampus/startup mendaftarkan inovasi; lembaga menambah skema pendanaan.
3. Anggota mengirim acara, siaran pers, dokumen; voting posisi METI di Diskusi; laporan harga PPA anonim; catatan ahli per bab topik.
Semua masuk ke antrean kurasi Admin (Gelombang 5), lewat hak.js, dengan uji integrasi D1.

## Gelombang 5. Admin (4 sampai 6 jam)
1. Kotak masuk kurasi terpadu (koreksi, klaim, inovasi, acara, lowongan, status proyek, laporan warga) dengan status, penugasan, dan riwayat.
2. Panel kesegaran data per dataset (hijau/kuning/merah).
3. Panel duplikat dengan tombol gabung.
4. Panel logo/foto hilang dengan unggah langsung dan penolak foto palsu.
5. Iuran jatuh tempo dan pengingat di layar (tanpa surel otomatis).
6. Log audit yang bisa dicari dan diekspor; endpoint ringkasan untuk pengunduh unik dan total jejak.
Selesai bila: semua rute baru lewat hak.js, uji hak dan integrasi hijau.

## Gelombang 6. Review menyeluruh (3 sampai 4 jam)
1. Keamanan (rute, unggah, panen), INP semua handler baru, i18n EN (ratusan kunci perlu tinjau), selera-angka (EST/Hipotesis), aksesibilitas 390px, kinerja dan kuota Worker/D1.
2. Metode terbaik: pencocokan entitas, status proyek dari berita, bobot indeks kesiapan (uji sensitivitas), tenaga kerja per MW, celah pendanaan (butuh capex per MW bersumber), deteksi logo palsu, dedup proyek. Hasilnya ditulis di /metode.
3. Buku Pegangan Direktori METI diterbitkan sebagai artifact (aturan selera, peta fitur, langkah rilis, ranjau, hasil review, keputusan pemilik).

## Keputusan pemilik yang menahan sebagian langkah
- Foto wajah di repo publik (pindah ke R2 privat atau tetap).
- Berkas di folder Claude outputs (hapus dari repo).
- Surel akun di INFRASTRUKTUR.md.
- scripts/panen_1001.mjs (hapus atau simpan).
- Hapus folder lama ~/Documents/GitHub/platformmeti.

## Perkiraan total
| Gelombang | Jam agent |
|---|---|
| 0 Stabilkan | 1 sampai 2 |
| 1 Data tersambung | 4 sampai 6 |
| 2 Lengkapi data publik | 6 sampai 10 |
| 3 Fitur dan analisa | 8 sampai 12 |
| 4 Inputan | 4 sampai 6 |
| 5 Admin | 4 sampai 6 |
| 6 Review | 3 sampai 4 |
| Total | 30 sampai 46 jam |

Bila jalan 10 sampai 12 jam per hari dengan 5 agent paralel: sekitar 3 sampai 4 hari. Gelombang 1 dan 2 bisa paralel dengan 3; gelombang 4 menunggu 5 (antrean kurasi) atau dikerjakan bersama.

## Tambahan final (8 Nov 2026 malam): data publik dan alat strategis

### Data publik terakhir yang diambil
1. Statistik PLN 2024/2025 per sistem (produksi, susut, konsumen) dan Statistik Ketenagalistrikan ESDM: dasar BPP dan bauran per provinsi.
2. Ember monthly electricity data Indonesia (bauran bulanan, emisi) dan IESR Indonesia Energy Transition Outlook.
3. Global Energy Monitor: Global Coal Plant Tracker, Solar/Wind/Hydro/Geothermal tracker (pembangkit per unit, status, pemilik): sumber utama dedup dan status proyek.
4. ESDM One Map dan geoportal: WKP panas bumi, jaringan transmisi, gardu induk.
5. Kemenperin TKDN (produk EBT per pabrikan), Kemenkeu insentif (tax holiday, PPN DTP), OJK taksonomi.
6. BPS: Podes (desa berlistrik), PDRB, penduduk; DJPK: APBD fungsi energi.
7. IDX: laporan tahunan emiten energi (kapasitas, capex), IDXCarbon (transaksi).
8. KPPIP PSN, AMDALNET, eproc PLN (pengumuman lelang EBT).
9. Database proyek pendana (GCF, ADB, World Bank, AIIB, JICA, KfW) dan JETP CIPP lampiran proyek.
10. Riset: OpenAlex lengkap per kampus Indonesia, PDKI paten EBT, DOAJ jurnal energi.

### Alat dan fitur strategis
1. Green jobs: lowongan, kebutuhan tenaga kerja EST dari RUPTL, peta LSP.
2. Pelacak proyek nasional terpadu (GEM + RUPTL + berita): status, keterlambatan COD, pemilik.
3. Radar peluang investasi per kabupaten: skor sumber daya, jaringan, BPP, harga patokan, lahan.
4. Pelacak dedieselisasi: sistem isolated, penghematan BBM bila diganti EBT.
5. Simulator bauran 2030 (RUPTL vs NZE): berapa MW per teknologi per tahun yang dibutuhkan (alat, bila pemilik setuju).
6. Pencocok pendanaan: skema yang cocok untuk satu proyek/organisasi.
7. Peta rantai pasok dan TKDN: celah komponen yang belum diproduksi lokal.
8. Pelacak kebijakan: dampak aturan baru ke proyek/organisasi + notifikasi.
9. Rapor bulanan otomatis "4 temuan" dan ringkasan mingguan untuk anggota.
10. Laporan PDF satu klik per provinsi, per organisasi, per topik.

### Jadwal 5 jam (berjalan paralel, maks 5 agent)
- Jam 0-1: tuntaskan Gelombang 0 (agent yang masih jalan), uji hijau.
- Jam 0-3: panen data publik 1-4 (GEM tracker, Ember, ESDM One Map, Statistik PLN) + kamus id dan dedup proyek.
- Jam 1-4: Green jobs + pelacak proyek terpadu + radar peluang kabupaten + pelacak dedieselisasi.
- Jam 3-5: pencocok pendanaan, pelacak kebijakan, rapor bulanan otomatis; uji penuh, cek visual, commit siap push.
