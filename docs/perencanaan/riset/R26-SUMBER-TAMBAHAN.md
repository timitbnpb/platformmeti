# R26: Sumber tambahan (karbon, atlas surya, outlook; 7 Nov 2026)

Skrip: `scripts/panen/panen_tambahan.mjs` (`--selftest`, `--ambil`). Keluaran di `data-panen/` (tidak masuk repo). UA jujur, jeda 2,2 detik, robots dicek, tanpa login, formulir, atau CAPTCHA. Catatan kegagalan mesin: `data-panen/tambahan_gagal.jsonl`.

## Hasil per sumber

| # | Sumber | Status | Baris | Berkas |
|---|--------|--------|-------|--------|
| 1 | ESDM Geoportal / One Map | GAGAL | 0 | robots.txt `Disallow: /` untuk semua agen; jalur REST ArcGIS (`/arcgis`, `/server`) juga 404. Tidak diambil. |
| 2a | Global Solar Atlas | BERHASIL | 38 | `wilayah/atlas.jsonl` |
| 2b | Global Wind Atlas | GAGAL | 0 | Tidak ada API publik terdokumentasi (tebakan endpoint HTTP 400 atau timeout). Unduhan GeoTIFF negara butuh pengolahan raster. Kolom angin di `atlas.jsonl` sengaja `null`. |
| 3a | IDXCarbon | BERHASIL | 14 | `karbon/idxcarbon.jsonl` (laporan bulanan resmi, PDF di `idxcarbon.co.id/id/data-monthly`) |
| 3b | SRN PPI KLHK | GAGAL | 0 | Host `srn.menlhk.go.id` tidak terselesaikan (ENOTFOUND); SRN PPI digantikan SRUK (POJK 10/2026) dan registri butuh login. |
| 4 | PDDikti | GAGAL | 0 | API `api-pddikti` membalas 401 (butuh kunci); situs web melarang `/search/` dan `/hasil-pp` di robots.txt. Tidak ada jalur publik tanpa login. |
| 5 | BKPM realisasi investasi per provinsi | GAGAL | 0 | `nswi.bkpm.go.id` timeout; `bkpm.go.id` memuat tabel lewat skrip dinamis tanpa berkas PDF/CSV; rincian provinsi x sektor listrik tidak ada di rilis yang terjangkau. Angka nasional ESDM (investasi EBTKE 2025 US$2,4 miliar versus US$2,284 miliar) saling berbeda di media dan TIDAK diambil. |
| 6 | Climate TRACE | BERHASIL | 182 | `karbon/climatetrace.jsonl` (sektor `power`, IDN, tahun 2024, CC BY 4.0) |
| 7a | IESR IETO 2026 (deck presentasi) | BERHASIL | lihat berkas | `angka/outlook.jsonl` |
| 7b | DEN Outlook Energi Indonesia | GAGAL | 0 | robots.txt `den.go.id` `Disallow: /` untuk semua agen. |

`proyek/tambahan_geoportal.jsonl`, `wilayah/geoportal_*.jsonl`, `karbon/srn.jsonl`, `sdm/prodi.jsonl`, `keuangan/investasi_provinsi.jsonl` TIDAK dibuat (tidak ada data sah untuk diisi).

## Catatan kualitas

- **Atlas surya**: nilai SATU titik per provinsi (koordinat ibu kota, pendekatan), BUKAN rata-rata luas provinsi. Isi: PVOUT (kWh/kWp per tahun), GHI, DNI, GTI optimal. Pakai sebagai indikasi relatif; untuk rata-rata provinsi perlu raster unduhan. Sumber: `api.globalsolaratlas.info/data/lta` (backend situs, tanpa login; robots situs tidak melarang). Lisensi CC BY 4.0, atribusi Global Solar Atlas 2.0 (Solargis, World Bank/ESMAP).
- **IDXCarbon**: ringkasan perdagangan (proyek terdaftar, unit tersedia, volume, nilai, frekuensi, peserta; bulan dan YTD). Dua baris berlabel "November 2024" dan "September 2024" di tabel situs diduga salah ketik tahun (urutan antara Oktober 2025 dan Desember 2025 tidak bersambung); label dibawa apa adanya ke `periode` dan perlu dikonfirmasi pemilik data. Data per proyek (nama, pemilik, jenis) tidak dipublikasikan di laporan bulanan; yang ada hanya jumlah proyek terdaftar.
- **Climate TRACE**: estimasi berbasis satelit dan model, bukan laporan operator; tingkat bukti `via-pihak-ketiga` (maks keyakinan Sedang). Tiap baris memuat koordinat, kapasitas MW, emisi tCO2e, pemilik. Untuk menyambung ke proyek/transisi perlu pencocokan nama dan koordinat (belum dikerjakan; itu tugas skrip sambung di `scripts/pipa/`). Respons API menyertakan URL thumbnail Mapbox ber-token; kolom itu TIDAK disimpan.
- **IETO**: sumber yang terjangkau hanya deck presentasi (sebagian besar grafik gambar, teks tak terbaca). Hanya angka yang frasanya terverifikasi di teks PDF yang diambil; tiap entri membawa nomor halaman PDF. Laporan IETO penuh dan Outlook Energi DEN tidak terjangkau. robots.txt IESR memblokir sejumlah bot AI bernama (bukan UA kami) dan mengizinkan `*`.

## Menunggu keputusan pemilik

1. Jalur resmi untuk ESDM Geoportal dan PDDikti (permintaan data atau kunci API) karena jalur publik tertutup.
2. Apakah rata-rata luas provinsi (raster GSA/GWA) layak dikerjakan; butuh GDAL atau pengolah raster, belum ada di toolchain tanpa-build.
