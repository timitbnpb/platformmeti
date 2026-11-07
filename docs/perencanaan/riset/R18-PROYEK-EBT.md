# R18: Inventaris proyek EBT Indonesia dan rekomendasi visualisasi

Status: hasil panen pertama, 7 Nov 2026. Pengurai: `scripts/panen/panen_proyek.mjs`. Keluaran (tidak masuk git): `data-panen/proyek/{proyek,pihak,konflik,sumber,ditolak}.jsonl`, `raw/`. Kurasi publik terlacak: `data/seed-proyek/`.

## 1. Sumber, lisensi, hasil cek

| Sumber | Lisensi | Hasil 7 Nov 2026 |
|---|---|---|
| GEM trackers (Solar, Wind, Hydropower, Geothermal, Bioenergy) | CC BY 4.0; catatan Solar: baris ber-"TZ ID" dari TransitionZero memakai CC BY-NC 4.0 | TIDAK terambil. Unduhan lewat formulir (`api.globalenergymonitor.org/static/gem-download-form.bundle.js`); tidak ada tautan berkas langsung. Tidak ada yang dikirim. Pemuat CSV belum ada (lihat langkah pemilik, bagian 6). |
| World Bank PPI | CC BY 4.0 (katalog WB) | Tidak terambil. `ppi.worldbank.org` tidak punya robots.txt (404) dan halaman data tidak memberi tautan berkas langsung; perlu dicari manual. |
| OSM power=plant via Overpass | ODbL | DILEWATI: robots.txt `overpass-api.de` melarang `/api/`. |
| Nominatim (geokode) | ODbL | robots.txt melarang `/search` bagi UA umum. Satu permintaan uji sudah terkirim (kabupaten Muara Enim), selebihnya TIDAK jalan. Skrip menolak jalan tanpa `--izin-nominatim`. |
| Wikipedia en "List of power stations in Indonesia" (tabel EBT) | CC BY-SA 4.0 | Terambil, 50 baris diurai (4 dibuang karena provinsi tak terpetakan). Tanpa tanggal data, tanpa status, tanpa koordinat. tingkat_bukti = media. Share-alike: keputusan pemilik bila basis data diterbitkan. |
| Wikipedia id (Daftar PSN item 154; TPA Benowo; Daftar pembangkit) | CC BY-SA 4.0 | 12 kota energi sampah, Benowo, Putri Cempo, Bantargebang. media. |
| Materi IndoEBTKE 2026 lokal (laporan PLTS 100 GWp 25 Agu, Gallery Walk B50/E20 hlm 13, Legok Nangka, Agrinas) | materi paparan, tanpa lisensi tertulis | 39 baris kurasi di `data-panen/proyek/seed/` (tidak masuk git). tingkat_bukti = resmi. Slide Agrinas berlabel STRICTLY CONFIDENTIAL: tidak boleh tampil publik tanpa izin. |
| RUPTL 2025-2034, KPPIP/PSN resmi, JETP CIPP, ADB/AIIB/WB, siaran pers ESDM | dokumen publik | BELUM dikerjakan (tidak ada berkas lokal; pencarian tanpa akses mesin pencari). Ini celah terbesar. |
| `data-panen/berita/berita.jsonl` | | Belum ada. |

## 2. Hasil (98 proyek)

Menurut teknologi (kode K16) dan status:

| teknologi | jumlah | status terisi |
|---|---|---|
| hidro | 30 | 0 |
| surya | 18 | 15 (beroperasi 2, konstruksi 6, rencana 7) |
| bioenergi | 17 | 2 rencana |
| biomassa-sampah | 16 | 8 (beroperasi 1, konstruksi 2, rencana 5) |
| panas-bumi | 11 | 0 |
| penyimpanan | 4 (PLTA pumped storage) | 0 |
| bayu | 2 | 0 |
| nuklir, hidrogen, laut | 0 | |

Menurut program: plts-100gw 15, psn 12, e20 16, b50 1, wte-danantara 0, jetp 0, tanpa program 54. Menurut bukti: resmi 33, media 65.

Cakupan per bidang (persen dari 98): provinsi 96, kabupaten/kota 74, kapasitas 80, pemilik 62, status 26, pihak terlibat 8, nilai investasi 2, skema kerja sama 2, pembeli 1, pemberi dana 1, tenaga kerja 1; EPC, tanggal PPA, financial close, COD target, COD aktual 0. Koordinat 0, presisi_lokasi 100 persen kosong (belum ada sumber koordinat yang boleh dipakai; lihat bagian 5).

Konflik tercatat (2): kapasitas Legok Nangka (2.131 vs 1.853-2.131 ton/hari, dua materi) dan PLTS Pulau Sembur (0,92 MWp peta vs 1 MWp rincian, satu laporan). Tidak ada nilai yang dipilih diam-diam; semua tetap berjajar dengan sumber_id.

Catatan data: laporan PLTS 100 GWp memuat 15 lokasi (jumlah kapasitas 5.334 MWp), bukan 14; Gilimanuk dan Buleleng satu kotak. Angka program (5,3 GWp, Rp135 T, 234 ribu lapangan kerja konstruksi) tidak dibagi ke proyek.

## 3. Bentuk data

Tiap bidang atribut berupa larik `{nilai, satuan?, sumber_id}`; `sumber.jsonl` memuat jenis, url, tingkat_bukti, lisensi, halaman, tanggal_ambil. `program`: plts-100gw, wte-danantara, b50, e20, psn, jetp, atau null. Koordinat: `lat`, `lng`, `presisi_lokasi` (titik_persis, desa, kecamatan, kabupaten, provinsi; skrip menambah `landmark` untuk hasil geokode berupa bangunan/waduk), `sumber_lokasi`. Tautan Google Maps dibangun di layar dari lat/lng. Dedup: teknologi sama, provinsi sama, nama mirip (Jaccard token >= 0,6 setelah membuang kata umum), kapasitas dalam +-10 persen; nama sama tetapi kapasitas beda TIDAK digabung dan dicatat di konflik. Baris sesumber tidak pernah digabung (unit atau fase berbeda).

## 4. Tiga celah terbesar

1. Tulang punggung GEM belum ada (formulir). Tanpa GEM tidak ada koordinat, pemilik per unit, dan tanggal untuk ratusan PLTS/PLTB/PLTA/PLTP.
2. Sumber transaksi (PPI, RUPTL, JETP, ADB/AIIB, siaran pers ESDM) belum dibaca: nilai investasi, skema, PPA, financial close, COD, pemberi dana masih nyaris kosong. Program wte-danantara dan daftar BU BBN B50 per alokasi (Kepmen) belum ditemukan di materi lokal (materi B50 hanya agregat: 26 BU BBN, 28 pabrik FAME, 22,02 juta kL).
3. Koordinat: Overpass dan Nominatim dilarang robots.txt; tanpa keputusan pemilik tidak ada lat/lng.

## 5. Koordinat dan Google Maps

Urutan: GEM, sumber resmi, OSM power=plant, geokode nama desa/kabupaten. GEM belum ada; Overpass dilarang; geokode Nominatim menunggu `--izin-nominatim` dari pemilik (60 kueri unik kabupaten/provinsi pada data sekarang, 2,2 dtk per kueri, sekitar 2 menit). Hasilnya titik tengah kabupaten atau provinsi dan WAJIB berlabel presisi itu; tombol Maps untuk presisi kabupaten/provinsi sebaiknya diberi tanda "perkiraan wilayah". Tanpa izin, layar tidak punya titik untuk dibuka di Maps.

## 6. Langkah untuk pemilik

1. GEM: buka halaman Download data tiap tracker di `globalenergymonitor.org/projects/<tracker>/download-data/`, isi formulir sendiri, simpan berkas ke `data-panen/proyek/raw/gem/` (CSV hasil ekspor sheet utama), filter negara Indonesia. Pemuat CSV GEM ditulis setelah ada berkas nyata (kolom tiap tracker berbeda; jangan menebak). Pertahankan atribusi CC BY 4.0 dan pisahkan baris TZ ID (NC).
2. Putuskan geokode Nominatim (robots melarang `/search`, kebijakan penggunaan mengizinkan <= 1 permintaan per detik dengan UA beridentitas) atau unduh ekstrak OSM sendiri.
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
