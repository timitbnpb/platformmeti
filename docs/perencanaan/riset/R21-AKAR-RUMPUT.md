# R21 Panen akar rumput EBET (7 Nov 2026)

Skrip: `scripts/panen/panen_akar.mjs` (`--selftest`, `--ambil`, `--teks`, `--tautan`, `--bangun`, `--statistik`). Keluaran di `data-panen/akar/` (tidak masuk repo): `organisasi_mahasiswa.jsonl`, `tokoh.jsonl`, `gagal.jsonl`, `raw/`, `seed/`.

## Hasil
- Organisasi mahasiswa (kategori `organisasi-mahasiswa`): 1 (SRE Indonesia, nasional; sumber Wikipedia id, tingkat bukti cuplikan).
- Tokoh (kelompok `aktivis-tokoh-daerah`): 4 (Tri Mumpuni, Iskandar Budisaroso Kuntoadji, Edwin Kudjere, Abdul Dunduk), semua kepakaran `hidro` dengan bukti dan tautan.
- Gagal: 6 (3 org tanpa sumber terbaca atau tanpa bukti EBT; 3 tokoh bernama satu kata, aturan nama dari panen_orang).

## Sumber yang terpakai
Wikipedia id (SRE, Tri Mumpuni), Mongabay Indonesia kategori energi (tujuh artikel energi desa, hanya judul dan peran yang disebut berita).

## Celah
- `sre.co.id` ditolak robots.txt; ketua SRE dan daftar chapter kampus tidak terambil (Wikipedia: lebih dari 50 chapter, tanpa daftar). Perlu izin atau input manual kurator.
- DEM, himpunan energi kampus, BEM berkementerian energi: tidak ada situs yang bisa dijangkau. Tebakan domain (puluhan) tidak ada atau SPA; `iesr.or.id` dan `bem.unpad.ac.id` memberi 403 (host dihentikan); `energyclub.id`, `hmte.ugm.ac.id` ditolak robots; bem.undip/unair 5xx; bem.usu tanpa kementerian energi. Tanpa mesin pencari, penemuan situs buntu: perlu daftar URL dari pemilik.
- Kalpataru, Ashden, Penghargaan Energi Prakarsa: halaman Wikipedia/ESDM tidak memuat penerima bertema EBT; `koaksi`, `ebtke.esdm.go.id` kosong atau tak terjangkau.
- Tokoh bernama satu kata (Ahdar, Jam'ah, Nasirun, Madi, Rubi) ditahan di `gagal.jsonl`; kurator bisa menaikkan bila perlu.
- Iskandar Budisaroso Kuntoadji: keterkaitan IBEKA disimpulkan, perlu tinjau.
- Instagram/X/LinkedIn tidak dipanen; tidak ada satupun `tautan` sosial yang tercatat karena tidak ditemukan.

## Pembaruan: daftar URL penemuan (data-panen/temuan/ormawa.jsonl 53, tokoh.jsonl 59)
`--daftar=berkas.jsonl[,berkas]` mengambil semua URL (robots, jeda 2,2 dtk). Terambil 113 halaman; gagal: 22 robots-tolak, 19 404, 19 ENOTFOUND, 5 host 403 (dihentikan), sisanya timeout/SSL/5xx (`gagal-ambil.log`).
Hasil akhir: organisasi 13 (DEM Indonesia, DEM Sulut, DEM Jabar, DEM UGM, SRE ITS/UNTIRTA/UNAIR/UI/Undip, BEM UI, BEM KM UGM, BEM PTNU; tingkat `daerah` ditambahkan di luar nasional/kampus K19, mohon putusan), ketua/pengurus hanya nama + jabatan. Tokoh 18: Penghargaan Energi Prakarsa Perorangan 2013 (5), 2014 (3), 2015 (3) dari ESDM, Anugerah DEN 2023 Tokoh Daerah (3), plus 4 dari Mongabay/Wikipedia. Nama satu kata penerima penghargaan diterima (`boleh_satu_kata`, ditandai) karena wilayah+penghargaan menjadi pengenal; kepakaran dikosongkan bila teks tak menyebut teknologi (tidak menebak).
Kosong: Kalpataru 2012/2021/2023/2026 tidak memuat penerima bertema energi; Subroto, ASEAN Energy Awards, Ashden hanya memuat perusahaan/lembaga atau Tri Mumpuni (sudah ada); Narto (Banyumas) dan tokoh desa lain bernama satu kata tanpa penghargaan tetap di gagal. Halaman unair.ac.id berupa stub; chapter SRE tanpa nama ketua selain ITS/UNTIRTA.

## Pembaruan: Koperasi (`data-panen/akar/koperasi.jsonl`, 7 baris)
Skema: nama, jenis_koperasi (`kdmp` atau `energi`), desa/kecamatan/kabupaten/provinsi, jenis_ebt, kapasitas, mitra, status, sumber_url. Tanpa nama orang.
- KDMP (2): Koperasi Kelurahan Merah Putih Galang Baru, PLTS Pulau Sembur Laut, Batam, Kepri (1 MWp + baterai 1 MWh, Pertamina NRE dan Kemenkop, sekitar 200 KK; Antara Juni sampai Okt 2026); koperasi minyak jelantah Purwokerto (nama tidak disebut, apakah KDMP tidak jelas).
- Non-KDMP (5): Koperasi Pengelola PLTMH Tepal (NTB), Agro Niaga Jabung (Malang, biogas 505 reaktor), Tuah Sabeena Sejahtera (Aceh Besar, PLTMH 50 kW, jual ke PLN), SAE Pujon (jenis EBT tidak disebut), KPT Maju Sejahtera (Lampung Selatan, biogas).
- Celah: `merahputih.kop.id` hanya beranda (dasbor Simkopdes, statistik tidak terbaca); `kemenkopukm.go.id` sertifikat kedaluwarsa; tak ada daftar KDMP ber-EBT selain Sembur Laut; program PLTS 100 GW berbasis koperasi baru tingkat kebijakan (Kemenkop dan Yayasan Rumah Energi, handbook Koperasi Hijau), belum nama koperasi. Tak ada daftar URL penemuan untuk koperasi, jadi pencarian lewat pencarian situs Antara dan sumber yang sudah terambil.
