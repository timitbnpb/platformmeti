# R18: Inventaris proyek EBT Indonesia dan rekomendasi visualisasi

Status: hasil panen pertama, 7 Nov 2026. Pengurai: `scripts/panen/panen_proyek.mjs`. Keluaran (tidak masuk git): `data-panen/proyek/{proyek,pihak,konflik,sumber,ditolak}.jsonl`, `raw/`. Seed kurasi tangan: `data-panen/proyek/seed/` (di luar git). Daftar sumber gagal: `data-panen/proyek/gagal.jsonl`.

## 1. Sumber, lisensi, hasil cek

| Sumber | Lisensi | Hasil 7 Nov 2026 |
|---|---|---|
| GEM trackers (Solar, Wind, Hydropower, Geothermal, Bioenergy) | CC BY 4.0; catatan Solar: baris ber-"TZ ID" dari TransitionZero memakai CC BY-NC 4.0 | TIDAK terambil. Unduhan lewat formulir (`api.globalenergymonitor.org/static/gem-download-form.bundle.js`); tidak ada tautan berkas langsung. Tidak ada yang dikirim. Pemuat CSV belum ada (lihat langkah pemilik, bagian 6). |
| World Bank PPI | CC BY 4.0 (katalog WB) | Tidak terambil. `ppi.worldbank.org` tidak punya robots.txt (404) dan halaman data tidak memberi tautan berkas langsung; perlu dicari manual. |
| OSM power=plant via Overpass | ODbL | DILEWATI: robots.txt `overpass-api.de` melarang `/api/`. |
| Nominatim (geokode) | ODbL | DILEWATI: robots.txt melarang `/search`. Satu permintaan uji terkirim sebelum robots dibaca. Diganti titik pusat geoBoundaries (bagian 5). |
| geoBoundaries IDN ADM1/ADM2 (versi simplified) | ADM1 ODbL 1.0; ADM2 CC BY 3.0 IGO (BPS, WFP, OCHA ROAP), bukan CC BY 4.0 seperti perkiraan awal | Terambil (berkas statis GitHub, 34 provinsi, 519 kabupaten/kota; ADM2 beresolusi penuh 150 MB lebih tidak selesai diunduh, versi simplified dipakai). Dipakai hanya untuk titik pusat wilayah. |
| JETP Indonesia, portofolio (`jetp-id.org/portfolio-sub`) | tidak dinyatakan; sumber resmi sekretariat | 2 proyek EBT dengan koordinat pin: PLTS terapung Saguling (60 MW/92 MWp, PLN IP dan ACWA Power, pembiayaan JETP USD 60 juta dari DEG, Proparco, Standard Chartered) dan PLTP Muara Laboh (85 menjadi 168 MW; halaman rinci 404). Dua entri lain adalah MRT, bukan EBT. PDF CIPP 2023 tersedia tetapi dokumen kebijakan, belum diurai. |
| Wikipedia en "List of power stations in Indonesia" (tabel EBT) | CC BY-SA 4.0 | Terambil, 50 baris diurai (4 dibuang karena provinsi tak terpetakan). Tanpa tanggal data, status, atau koordinat. tingkat_bukti = media. Atribusi CC BY-SA 4.0 tercatat di `sumber.jsonl` (`atribusi`); data ini berada di `data-panen/` dan tidak masuk git. Share-alike: keputusan pemilik bila basis data diterbitkan. |
| Wikipedia id (Daftar PSN item 154; TPA Benowo; Daftar pembangkit) | CC BY-SA 4.0 | 12 kota energi sampah, Benowo, Putri Cempo, Bantargebang. media. Seed dipindah ke `data-panen/proyek/seed/` (tidak masuk git), atribusi di sumber. |
| Materi IndoEBTKE 2026 lokal (laporan PLTS 100 GWp 25 Agu, Gallery Walk B50/E20 hlm 13, Legok Nangka, Agrinas) | materi paparan, tanpa lisensi tertulis | 39 baris kurasi di `data-panen/proyek/seed/` (tidak masuk git). tingkat_bukti = resmi. Slide Agrinas berlabel STRICTLY CONFIDENTIAL: 2 proyek bertanda `publik: false` dengan `catatan_kerahasiaan`; potret publik wajib membuangnya dan membuang nilai ber-sumber `publik: false` pada proyek campuran. |
| RUPTL PLN 2025-2034, KPPIP, World Bank PPI, ESDM EBTKE siaran pers, ADB | publik | GAGAL, rinci di `gagal.jsonl`: RUPTL (DNS gatrik dan web.pln.co.id tidak resolve), PPI (alat kueri interaktif, tanpa berkas statis), ebtke.esdm.go.id (SPA tanpa HTML statis), ADB (HTTP 403 tantangan Cloudflare, berhenti). |
| `data-panen/berita/berita.jsonl` | | Belum ada. |

## 2. Hasil (99 proyek)

Menurut teknologi (kode K16) dan status:

| teknologi | jumlah | status terisi |
|---|---|---|
| hidro | 30 | 0 |
| surya | 18 | 15 (beroperasi 2, konstruksi 6, rencana 7) |
| bioenergi | 17 | 2 rencana |
| biomassa-sampah | 16 | 8 (beroperasi 1, konstruksi 2, rencana 5) |
| panas-bumi | 12 | 0 |
| penyimpanan | 4 (PLTA pumped storage) | 0 |
| bayu | 2 | 0 |
| nuklir, hidrogen, laut | 0 | |

Menurut program: plts-100gw 14, psn 12, e20 16, b50 1, jetp 2, wte-danantara 0, tanpa program 54 (Saguling masuk jetp dan plts-100gw sekaligus: `programs[]`; PLTS 100 GWp yang berdiri sendiri 14 baris + Saguling). Menurut bukti: resmi 34, media 65. Rahasia (`publik:false`): 2.

Cakupan per bidang (persen dari 99): provinsi 96, kabupaten/kota 76, kapasitas 80, pemilik 63, status 25, pihak terlibat 8, nilai investasi 2, skema kerja sama 2, pembeli 1, pemberi dana 2, tenaga kerja 1; EPC, tanggal PPA, financial close, COD target, COD aktual 0. Koordinat 96 (presisi: titik_persis 2%, kabupaten 59%, provinsi 35%, kosong 4%; lihat bagian 5). Sumber transaksi (PPI, RUPTL, ADB, ESDM) gagal, jadi investasi, skema, dan COD tetap 2%, 2%, 0%.

Konflik tercatat (2): kapasitas Legok Nangka (2.131 vs 1.853-2.131 ton/hari, dua materi) dan PLTS Pulau Sembur (0,92 MWp peta vs 1 MWp rincian, satu laporan). Tidak ada nilai yang dipilih diam-diam; semua tetap berjajar dengan sumber_id.

Catatan data: laporan PLTS 100 GWp memuat 15 lokasi (jumlah kapasitas 5.334 MWp), bukan 14; Gilimanuk dan Buleleng satu kotak. Angka program (5,3 GWp, Rp135 T, 234 ribu lapangan kerja konstruksi) tidak dibagi ke proyek.

## 3. Bentuk data

Tiap bidang atribut berupa larik `{nilai, satuan?, sumber_id}`; `sumber.jsonl` memuat jenis, url, tingkat_bukti, lisensi, halaman, tanggal_ambil. `program`: plts-100gw, wte-danantara, b50, e20, psn, jetp, atau null. Koordinat: `lat`, `lng`, `presisi_lokasi` (titik_persis, desa, kecamatan, kabupaten, provinsi; skrip menambah `landmark` untuk hasil geokode berupa bangunan/waduk), `sumber_lokasi`. Tautan Google Maps dibangun di layar dari lat/lng. Dedup: teknologi sama, provinsi sama, nama mirip (Jaccard token >= 0,6 setelah membuang kata umum), kapasitas dalam +-10 persen; nama sama tetapi kapasitas beda TIDAK digabung dan dicatat di konflik. Baris sesumber tidak pernah digabung (unit atau fase berbeda).

## 4. Tiga celah terbesar

1. Tulang punggung GEM belum ada (formulir). Tanpa GEM tidak ada koordinat tepat, pemilik per unit, dan tanggal untuk ratusan PLTS/PLTB/PLTA/PLTP. Pemuat CSV sudah ada (`--gem-periksa`; kolom diperiksa persis, tidak ditebak, diuji hanya dengan CSV sintetis).
2. Sumber transaksi (PPI, RUPTL, siaran pers ESDM, ADB) gagal dibaca dari sini (lihat `gagal.jsonl`): nilai investasi, skema, PPA, financial close, COD, pemberi dana masih nyaris kosong. Program wte-danantara dan daftar BU BBN B50 per alokasi (Kepmen) belum ditemukan di materi lokal (materi B50 hanya agregat: 26 BU BBN, 28 pabrik FAME, 22,02 juta kL).
3. Lokasi tepat: 96% koordinat hanyalah titik pusat kabupaten/provinsi; hanya 2 proyek (JETP) bertitik pin sumber.

## 5. Koordinat dan Google Maps

Urutan: titik sumber (GEM, resmi, JETP), lalu titik pusat wilayah geoBoundaries. Overpass dan Nominatim tidak dipakai (robots.txt). Titik pusat = centroid poligon terluas kabupaten (ADM2) atau provinsi (ADM1), berlabel `presisi_lokasi` kabupaten atau provinsi dan `sumber_lokasi` = geoBoundaries-pusat-wilayah dengan lisensi dan tanggal. Nama kabupaten tanpa penanda Kota/Kabupaten yang ambigu (Bandung) jatuh ke provinsi, tidak ditebak. Provinsi baru hasil pemekaran Papua tidak ada di ADM1 (34 provinsi), sehingga proyek di sana tanpa koordinat. Layar wajib menandai tombol Maps berpresisi kabupaten/provinsi sebagai "perkiraan wilayah", jangan sebagai lokasi proyek. `landmark` hanya untuk titik yang diberikan sumber (misalnya GEM "approximate").

## 6. Langkah untuk pemilik

1. GEM: buka halaman Download data tiap tracker di `globalenergymonitor.org/projects/<tracker>/download-data/`, isi formulir sendiri, simpan berkas ke `data-panen/proyek/raw/gem/` (CSV hasil ekspor sheet utama), filter negara Indonesia. Pemuat CSV GEM ditulis setelah ada berkas nyata (kolom tiap tracker berbeda; jangan menebak). Pertahankan atribusi CC BY 4.0 dan pisahkan baris TZ ID (NC).
2. Untuk lokasi tepat tanpa GEM: ekstrak OSM sendiri (Geofabrik, ODbL) atau tambahkan titik dari dokumen resmi per proyek.
3. Putuskan lisensi CC BY-SA untuk data turunan Wikipedia, dan izin tampil untuk materi konferensi (terutama Agrinas).

## 7. Rekomendasi visualisasi

Penilaian untuk platform ini (JS biasa, MapLibre 4.7.1 sudah ada, tanpa kerangka kerja, data kecil: ratusan sampai ribuan titik, banyak atribut kosong):

| Opsi | Cocok? | Alasan |
|---|---|---|
| Peta titik + klaster, warna teknologi, cincin status | Ya, utama | MapLibre bawaan menyediakan klaster GeoJSON tanpa pustaka baru; pakai tautan Maps per titik. Tetapi hanya untuk proyek berkoordinat; presisi kabupaten digambar sebagai lingkaran berpola, bukan titik tegas. |
| Koroplet provinsi | Ya, pendamping | Berfungsi walau koordinat per proyek tidak ada (cukup provinsi, terisi 96 persen); pakai `public/geo/` yang sudah ada. Metrik: kapasitas per provinsi, per teknologi. |
| Corong pipeline (rencana, perizinan, konstruksi, beroperasi) | Ya, di ringkasan | Murah (SVG/CSS), tetapi status baru 26 persen terisi: tampilkan "tanpa status" sebagai batang sendiri, jangan disembunyikan. |
| Batang kapasitas per provinsi | Ya | Paling jujur dan paling murah; dasar koroplet yang bisa diurutkan dan dibaca pembaca layar. |
| Gantt/lini masa COD | Hanya profil | COD, PPA, financial close terisi 0 persen sekarang; hanya bermakna untuk proyek ber-tanggal (laporan PLTS 100 GWp punya status bertanggal 25 Agu 2026). |
| Sankey pendana, pengembang, teknologi | Tidak sekarang | pemberi dana 1 persen; hanya menyesatkan sampai PPI/ADB/JETP terbaca. Tunda. |

Pilihan untuk layar direktori proyek: (a) peta titik berklaster dengan koroplet provinsi sebagai lapisan yang bisa diganti, (b) di bawahnya batang kapasitas per provinsi dan corong status sebagai tabel-grafik yang sama datanya, (c) filter program nasional (plts-100gw, psn, e20, b50, wte-danantara) dan teknologi. Untuk profil proyek: kartu fakta dengan SEMUA nilai berjajar bersama sumbernya (termasuk yang bertentangan), peta mini bila ada koordinat (dengan label presisi) dan tombol Maps, lini masa kecil hanya jika ada tanggal. Gantt dan sankey ditambahkan setelah bidang terkait terisi di atas 40 persen.
