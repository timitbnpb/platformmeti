# ARSITEKTUR-INFORMASI: Platform Jaringan METI

Peta MECE seluruh informasi dan halaman (7 Nov 2026, atas perintah pemilik: "setiap halaman ada fungsinya, dibuat MECE"). Dokumen ini menurunkan K16, K17, K18 menjadi struktur. Posisinya di rantai otoritas: di bawah ALUR, di atas DESIGN-SYSTEM. Bila bertentangan dengan DESAIN-TEKNIS §4.2, dokumen ini menang untuk daftar halaman; DT tetap menang untuk perilaku teknis rute.

## 0. Prinsip MECE

1. **Satu benda, satu rumah.** Tiap benda (proyek, organisasi, orang, regulasi, wilayah, program, acara) punya tepat SATU halaman daftar dan SATU halaman profil. Halaman lain hanya menautkan, tidak menyalin.
2. **Satu halaman, satu pertanyaan.** Halaman analisis (lensa) menjawab satu pertanyaan dan tidak punya benda sendiri; ia membaca benda dari rumahnya.
3. **Satu fakta, satu sumber baris.** Angka dan klaim tinggal di `fakta`/`ikatan` bersumber (D1), lalu dipotret ke JSON per lapis. Halaman tidak menyimpan angka sendiri.
4. **Lapis akses tegak lurus dengan halaman.** Halaman yang sama tampil berbeda per lapis (publik, anggota, pengurus); lapis tidak melahirkan halaman baru.

## 1. Pertanyaan yang dijawab platform (MECE)

| # | Pertanyaan | Benda | Lensa |
| --- | --- | --- | --- |
| Q1 | Siapa pelakunya? | Organisasi, Orang | Narasumber, Rotasi jabatan |
| Q2 | Apa yang dibangun, di mana? | Proyek, Wilayah | Pelacak proyek, Potensi vs realisasi |
| Q3 | Seberapa jauh kemajuannya? | Program | Rapor Transisi, Kesiapan investasi |
| Q4 | Berapa uang dan harganya? | (fakta pada Proyek/Organisasi) | Dana iklim, Pembiaya, Tarif |
| Q5 | Dari mana barangnya? | (ikatan `memasok`) | Rantai pasok |
| Q6 | Aturannya apa? | Regulasi | Linimasa regulasi |
| Q7 | Kapan sesuatu terjadi? | Acara | Kalender, Pengadaan |
| Q8 | Apa dampaknya? | (fakta turunan) | Kalkulator manfaat, Kerja hijau, Isu sosial-lingkungan |
| Q9 | Di mana posisi Indonesia? | Wilayah (negara) | Perbandingan ASEAN |

Tiap fitur K17/K18 jatuh ke tepat satu sel; tidak ada fitur di luar tabel.

## 2. Benda dan isinya

Tujuh benda = `entitas.jenis`. Isi tiap benda dikelompokkan MECE dengan delapan laci yang sama, supaya layar profil seragam: **Identitas, Lokasi, Teknis, Uang, Waktu, Pihak, Status, Sumber**. Laci yang tidak relevan untuk satu benda dikosongkan, tidak diganti nama.

### 2.1 Proyek (`jenis=proyek`)
| Laci | Isi |
| --- | --- |
| Identitas | nama ID/EN, teknologi (K16), program (`plts-100gw`, `wte`, `b50`, `e20`, `ruptl`, `psn`, `jetp`) |
| Lokasi | provinsi, kab/kota, desa, lat/lng, presisi lokasi, ikon Google Maps |
| Teknis | kapasitas (MW, MWp, MWh, kL/tahun, ton/hari), teknologi rinci, TKDN |
| Uang | nilai investasi, skema (IPP/PPA, KPBU, BOO/BOT, captive, hibah), tarif PPA, VGF, pinjaman |
| Waktu | PPA, financial close, groundbreaking, COD target, COD aktual, keterlambatan (hari) |
| Pihak | pengembang, pemilik, EPC, pemasok, pembeli (PLN/captive), pendana, pemda |
| Status | rencana, perizinan, pendanaan, konstruksi, beroperasi, ditunda, dibatalkan; tenaga kerja; isu sosial-lingkungan |
| Sumber | tiap nilai: URL, tanggal periksa, tingkat bukti; konflik ditampilkan berdampingan |

### 2.2 Organisasi (`jenis=lembaga`, `kategori` sebagai pembeda)
Satu rumah untuk perusahaan, asosiasi, lembaga pemerintah, DPR, think tank, kampus, dan donor. Pembedanya `kategori` (pemerintah, bumn, swasta, asosiasi, riset-kampus, lsm-think-tank, keuangan, internasional, pengembang-teknologi, komunitas), bukan halaman terpisah.
| Laci | Isi |
| --- | --- |
| Identitas | nama, singkatan, badan hukum, induk/grup, kategori, peran rantai, kepakaran (K16), tahun berdiri, kode saham, dasar hukum (lembaga negara) |
| Lokasi | alamat kantor, kota, provinsi, lat/lng, ikon Maps; lokasi pabrik/fasilitas |
| Teknis | kapasitas produksi (pabrikan), portofolio MW, produk, sertifikat, TKDN |
| Uang | pendapatan dan laba (hanya tbk/BUMN berlaporan publik), portofolio pembiayaan (pembiaya) |
| Waktu | riwayat jabatan pengurus, peristiwa korporasi |
| Pihak | pengurus (Dirut, direksi, komisaris, ketua) dengan foto beratribusi, anggota (asosiasi), anak usaha, mitra |
| Status | aktif, berganti nama, bubar; keanggotaan METI |
| Sumber | sama seperti 2.1; kontak korporat: telepon, surel umum, situs |

### 2.3 Orang (`jenis=orang`)
| Laci | Isi |
| --- | --- |
| Identitas | nama, gelar, alias, foto (halaman resmi saja), kepakaran (maks 3, satu utama) |
| Lokasi | tidak diisi (privasi) |
| Teknis | bidang paparan, publikasi |
| Uang | tidak diisi (harta pejabat tidak dimuat) |
| Waktu | riwayat jabatan mulai-selesai |
| Pihak | organisasi tempat menjabat, sesi acara sebagai pembicara |
| Status | menjabat, mantan; jalur karier, penanda `pernah-birokrasi` (netral) |
| Sumber | tiap jabatan bersumber; tanpa kontak pribadi, tanpa tanggal lahir |

### 2.4 Regulasi (`jenis=regulasi`)
Identitas (jenis, nomor, tahun, judul, penerbit) / Waktu (terbit, berlaku, dicabut) / Pihak (penerbit, yang diatur) / Status (berlaku, diubah, dicabut, RUU dengan tahap pembahasan) / Isi pokok (ringkasan, ambang angka seperti TKDN 20%) / Ikatan `mengatur`, `mengubah`, `mencabut` ke proyek, program, regulasi lain.

### 2.5 Wilayah (`jenis=wilayah`)
Provinsi (38) dan negara ASEAN. Isi: potensi teknis per teknologi, kapasitas terpasang, target RUED, bauran, rasio elektrifikasi, BPP, proyek di wilayah itu, regulasi daerah, kerja hijau, skor kesiapan investasi.

### 2.6 Program (`jenis=program`, BUTUH migrasi 0007)
PLTS 100 GWp, B50, E5-E20/SAF, WtE, RUPTL 2025-2034, JETP, PSN energi. Isi: dasar hukum, target dan tahap, realisasi, anggaran, pelaksana, daftar proyek anggota, kartu kemajuan. `program` belum ada di CHECK `entitas.jenis`; sampai 0007 jalan, program hanya tampil sebagai saringan di Pelacak proyek.

### 2.7 Acara (`jenis=acara`)
Konferensi (IndoEBTKE ConEx), rapat Komisi XII, lelang, tenggat regulasi, groundbreaking. Isi: tanggal, tempat, penyelenggara, pembicara (ikatan ke Orang), materi.

### Bukan benda
- **Berita** = baris `sumber` jenis media yang ditautkan ke fakta dan ditampilkan di laci Sumber dan umpan berita tiap profil. Judul dan tautan saja.
- **Angka/indikator** = `fakta` milik Wilayah, Program, atau Organisasi. Tidak ada halaman "angka" yang berdiri sendiri.
- **Publikasi** (`jenis=publikasi`) = laporan dan kajian; tampil di laci Sumber dan di Pustaka (§3.4).

## 3. Peta halaman

Empat golongan, saling lepas. Kolom Infra: **A** = aset statik + potret JSON (tanpa Worker, cache tepi), **W** = Worker (`run_worker_first`), **L** = perlu login.

### 3.1 Pintu (2)
| Rute | Fungsi tunggal | Isi | Infra |
| --- | --- | --- | --- |
| `/` | Kondisi transisi energi sekarang dalam 30 detik | 5 kartu indikator bersumber, proyek terbaru, rapor terakhir, cari global | A |
| `/cari?q=` | Menemukan benda apa pun | hasil per golongan benda | W (D1 FTS5) |

### 3.2 Rumah benda (7 daftar + 7 profil)
| Daftar | Profil | Fungsi | Infra |
| --- | --- | --- | --- |
| `/proyek` | `/proyek/:slug` | Pelacak proyek: peta klaster teknologi/status, saringan program/provinsi/status, funnel, daftar terlambat COD | A / W |
| `/organisasi` | `/organisasi/:slug` | Direktori organisasi dengan tab kategori (perusahaan, asosiasi, pemerintah, riset, donor) | A / W |
| `/orang` | `/orang/:slug` | Direktori profesional; mode Narasumber = saringan kepakaran | A / W |
| `/regulasi` | `/regulasi/:slug` | Daftar aturan; mode Linimasa | A / W |
| `/wilayah` | `/wilayah/:kode` | Peta provinsi; profil provinsi = rapor provinsi | A / W |
| `/program` | `/program/:slug` | Program nasional dan kemajuannya | A / W |
| `/kalender` | `/acara/:slug` | Kalender ekosistem; mode Pengadaan = acara jenis lelang | A / W |

`/p/:slug` (DT §4.2) dipertahankan sebagai pengalih 301 ke rumah yang sesuai jenisnya. `/perusahaan`, `/peta`, `/kebijakan`, `/pembiaya` (PRD lama) dilebur: `/perusahaan` ke `/organisasi?kategori=swasta`, `/peta` ke `/proyek`, `/kebijakan` ke `/regulasi`, `/pembiaya` ke lensa Pembiayaan.

### 3.3 Lensa analisis (satu pertanyaan per halaman)
| Rute | Pertanyaan | Membaca benda | Tiket | Fase |
| --- | --- | --- | --- | --- |
| `/rapor` | Berapa proyek jalan, macet, terlambat kuartal ini? | Proyek, Program | JM-P07 | F2 |
| `/rantai` | Cukupkah pasokan lokal untuk program? | Organisasi (pabrikan), Program | JM-P05, F01 | F2 |
| `/pembiayaan` | Siapa mendanai apa, berapa celahnya? | Organisasi (keuangan), Proyek | JM-Q12, F02 | F3 |
| `/tarif` | Berapa harga listrik EBT per teknologi? | Proyek, Regulasi | JM-Q03 | F2 |
| `/potensi` | Seberapa jauh realisasi dari potensi dan RUED? | Wilayah | JM-Q01 | F2 |
| `/kesiapan` | Provinsi mana paling siap investasi? | Wilayah | JM-Q02 | F3 |
| `/manfaat` | Apa dampak emisi, kerja, devisa? | Proyek, Wilayah | JM-Q10, Q11 | F2 |
| `/asean` | Di mana posisi Indonesia? | Wilayah (negara) | JM-Q14 | F2 |
| `/bumn` | Bagaimana posisi BUMN energi? | Organisasi | F03 | F2 |
| `/data-center`, `/desa` | Tema lintas program | Program, Proyek | F04, F05 | F2 |

Rotasi jabatan (Q07) dan isu sosial (Q13) bukan halaman: keduanya laci di profil Organisasi/Orang dan Proyek, plus notifikasi.

### 3.4 Terbitan dan rujukan
| Rute | Fungsi | Infra |
| --- | --- | --- |
| `/rapor/:kuartal` | Rapor Transisi beku, bisa dikutip, PDF | A |
| `/cerita/:slug` | Cerita data beku | A |
| `/pustaka` | Publikasi dan kajian | A |
| `/metode` | Cara menghitung, tingkat bukti, cara mengutip | A |
| `/koreksi` | Ajukan koreksi dan hak jawab | W |
| `/tentang`, `/privasi` | Siapa METI, kebijakan data | A |

### 3.5 Akun dan kerja internal
| Rute | Fungsi | Infra |
| --- | --- | --- |
| `/masuk`, `/aktivasi`, `/ganti-sandi` | Pintu akun | W |
| `/ikuti` | Daftar yang diikuti, ringkasan surel (F3, JM-Q08) | W, L |
| `/admin` | Akun, kurasi, impor, antrean koreksi | W, L (KR/AD/SA) |
| `/direktori` | Port Direktori Jaringan untuk anggota | W, L |

## 4. Lapis akses per laci

| Laci | Publik | Anggota | Pengurus |
| --- | --- | --- | --- |
| Identitas, Lokasi, Teknis, Status, Sumber | ya | ya | ya |
| Waktu | ya | ya | ya |
| Uang: angka ringkas | ya | ya | ya |
| Uang: rincian kontrak dan pendana | tidak | ya | ya |
| Pihak: nama organisasi | ya | ya | ya |
| Pihak: kontak korporat | ya | ya | ya |
| Pihak: kontak orang | tidak pernah dimuat | | |
| Catatan kurator, konflik belum putus | tidak | tidak | ya |

## 5. Infrastruktur per golongan

- **Daftar** dan **lensa**: HTML statik + potret JSON per lapis (`/data/<benda>.<lapis>.json`), dibangun pipa dari D1, cache tepi 300 detik. Tidak membayar baca D1 per kunjungan.
- **Profil**: Worker mengambil potret satu benda dari R2/aset; tidak query D1 langsung kecuali lapis pengurus. SEO: Worker menyisipkan `<title>`, deskripsi, dan JSON-LD (Organization, Person, Place).
- **Cari**: D1 FTS5 lewat `src/hak.js`, laju dibatasi.
- **Peta**: MapLibre 4.7.1 lokal; klaster di sisi klien dari potret `proyek.publik.json`; ikon Google Maps hanyalah tautan.
- **Terbitan**: dibekukan sebagai berkas statik bertanggal; tidak pernah berubah setelah terbit.
- **Dwibahasa**: rute sama, bahasa lewat `?lang=` + `i18n`; nama benda punya `nama_en`.

## 6. Inventaris sumber informasi publik (MECE per benda)

Status: **jalan** = sedang dipanen, **belum** = tersedia tapi belum disentuh.

| Benda | Sumber | Status |
| --- | --- | --- |
| Proyek | Global Energy Monitor trackers, World Bank PPI, RUPTL, PSN/KPPIP, JETP CIPP, rilis ESDM, materi IndoEBTKE | jalan |
| Proyek | AMDAL (Amdalnet KLHK), izin usaha (OSS publik), WIUP panas bumi ESDM, lelang WKP | belum |
| Proyek | Laporan proyek ADB/AIIB/WB/JICA, data PLN UIP, siaran pers PLN | sebagian |
| Organisasi | situs resmi, IDX (laporan tahunan, keterbukaan informasi, RUPS), daftar pabrikan ESDM/Kemenperin, anggota asosiasi | jalan |
| Organisasi | Daftar TKDN Kemenperin, daftar BU BBN ESDM, daftar IUPTL ESDM, daftar pemegang WKP, portofolio green bond/sukuk (Kemenkeu, IDX) | belum |
| Orang | halaman pimpinan resmi, guidebook, pembicara acara | jalan |
| Orang | dpr.go.id (Komisi XII), keterbukaan IDX perubahan direksi, SK pengangkatan direksi BUMN (Kementerian BUMN) | belum |
| Regulasi | JDIH ESDM, peraturan.bpk.go.id, JDIH Kemenperin, Kemenkeu, Perda RUED | jalan |
| Regulasi | DPR (tahap RUU EBET, naskah akademik), Prolegnas | belum |
| Wilayah | potensi EBT ESDM, Statistik Ketenagalistrikan, HEESI, RUED-P, BPS | belum |
| Wilayah | Ember, IRENA IRENASTAT, OWID, World Bank (ASEAN) | belum (tiket D05) |
| Program | Kepmen/Perpres dasar program, laporan kinerja ESDM, BPDP | sebagian |
| Acara | IndoEBTKE, agenda DPR, kalender ESDM/METI, lelang PLN | sebagian |
| Uang/harga | BPP PLN (Kepmen ESDM), Perpres 112/2022 tarif, hasil lelang PLN, APBN subsidi | belum |
| Berita | GDELT, RSS media, YouTube ESDM/PLN/METI | jalan |

## 7. Perubahan yang dituntut dokumen ini

1. Migrasi `0007_program.sql`: tambah `program` ke CHECK `entitas.jenis` (SQLite: bangun ulang tabel; agent `migrasi`, diperiksa `migrasi-idempoten`).
2. DESAIN-TEKNIS §4.2 diselaraskan dengan §3 di sini (rute rumah benda, pengalih `/p/:slug`).
3. TIKET: JM-P02 ke `/proyek`, JM-P04 ke `/organisasi` dan `/orang`; F01, F02 dirujuk dari lensa.
