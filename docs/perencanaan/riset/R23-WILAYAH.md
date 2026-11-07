# R23: Panen wilayah (provinsi dan ASEAN), 7 November 2026

Tiket: JM-Q01 (potensi vs realisasi provinsi), JM-Q14 (perbandingan ASEAN), JM-D05, dan benda `wilayah` (ARSITEKTUR-INFORMASI §2.5, §6).
Skrip: `scripts/panen/panen_wilayah.mjs` (`--selftest`, `--ambil`, `--teks`, `--bangun`). Keluaran di `data-panen/wilayah/` (di luar git): `provinsi.jsonl` (38 baris), `asean.jsonl` (10 baris), `gagal.jsonl`, `konflik.jsonl`. Mentah di `data-panen/wilayah/raw/`.
Tambahan: `scripts/panen/panen_proyek.mjs --wikidata` (pembangkit Wikidata; DIJALANKAN 7 Nov 2026 atas keputusan koordinator/pemilik, lihat bawah).

## Cakupan (apa yang terisi, dengan sumber)

| Isi | Cakupan | Sumber (tingkat bukti) |
| --- | --- | --- |
| Kapasitas terpasang EBT per provinsi (hidro besar/mini/mikro, panas bumi, surya, bayu, biogas, biomassa), 2025 | 38 dari 38 (kode Kemendagri, termasuk 4 provinsi Papua baru); total 15.652 MW | HEESI 2025 Tabel 6.4.9 hlm 118, sumber asal Ditjen Gatrik (resmi) |
| Potensi panas bumi (sumber daya + cadangan), Desember 2025 | 32 provinsi bernilai > 0, 6 provinsi tak tercantum di tabel = 0; total 23.204 MW (tercetak 23.203, selisih pembulatan) | HEESI 2025 Tabel 6.5.1 hlm 120-121, sumber asal Badan Geologi (resmi) |
| Rasio elektrifikasi 2024 + rumah tangga berlistrik PLN/non-PLN | 38 dari 38; terendah Papua Pegunungan 94,02, Papua Tengah 94,49, NTT 96,35, Kalteng 98,05 | Statistik Ketenagalistrikan 2024 Tabel 7 hlm 9 (resmi) |
| Potensi surya, bayu, hidro, bioenergi, laut | KOSONG di 38 baris (`alasan_kosong` tertulis) | lihat "Gagal" |
| Target bauran EBT RUED 2025/2030/2050 | 26 provinsi punya perda RUED di data regulasi (Kaltara punya dua: 8/2019 dan 8/2025, dipakai yang terbaru); 12 provinsi belum punya baris RUED. Angka TIDAK dipastikan: `target_ebt_persen` sengaja `null`; `kandidat` memuat kutipan kalimat + angka hasil ekstraksi heuristik (11 provinsi punya kandidat) | Perda RUED di peraturan.bpk.go.id (resmi), ekstraksi mesin, wajib ditinjau |
| BPP per sistem | KOSONG. Satu angka nasional ada di sumber: tarif keekonomian (BPP + margin) golongan TR 2024 Rp1.772,22/kWh (Statistik Ketenagalistrikan 2024 Tabel 45 hlm 53); belum dimasukkan ke baris provinsi | |
| ASEAN (ID, VN, PH, TH, MY, SG, LA, KH, MM, BN) | 10 negara: pembangkitan, listrik terbarukan, pangsa terbarukan, surya, angin, hidro, bio, pangsa fosil, listrik per kapita, intensitas karbon; tahun terbaru 2024 plus tren 2014-2024. IRENASTAT: kapasitas terpasang per teknologi 2014-2025 untuk 9 negara (Brunei tidak ada di tabelnya). World Bank: akses listrik, pangsa terbarukan, kWh per kapita 2014-2025 | OWID energy-data memuat Ember (CC BY 4.0); IRENASTAT 2026 H2; World Bank WDI (CC BY 4.0) |

Setiap nilai punya `sumber_url`, `tanggal_periksa`, `tingkat_bukti` (KP D5). Nilai kosong membawa `alasan_kosong`, bukan angka karangan.

## Daftar rumah angka (file yang dibaca)

HEESI 2025 `https://www.esdm.go.id/assets/media/content/content-handbook-of-energy-and-economic-statistics-of-indonesia-2025.pdf` (juga 2024 diunduh, belum dipakai). Statistik Ketenagalistrikan 2024: daftar dokumen Ditjen Gatrik tersedia sebagai JSON publik `https://gatrik.esdm.go.id/gatrik/gatrik-api/api/download-index?length=700` (628 dokumen: statistik 2006-2024, RUPTL 2015-2034, Laporan Kinerja); `robots.txt` gatrik hanya melarang `/perpus/`.

## Konflik dan kehati-hatian

1. **Uji silang lolos:** jumlah 38 provinsi per kolom Tabel 6.4.9 sama dengan baris Total tercetak (`konflik.jsonl` kosong). Rasio elektrifikasi nasional 99,83 sama di HEESI (sumber BPS) dan Statistik Gatrik (2024).
2. **Tahun berbeda antar kolom:** terpasang = 2025, rasio = 2024, panas bumi = Desember 2025. Layar harus menampilkan tahun per kolom.
3. **Satuan terpasang:** Tabel 6.4.9 tidak menulis satuan di kepala tabel yang terbaca; MW disimpulkan dari baris Total (hidro 6.372 MW, PLTU 60.542 MW sesuai angka nasional). Dicatat di baris.
4. **Papua:** HEESI memakai kode 91-96 (provinsi baru); data lama berkode 91/92 saja tidak sebanding lintas tahun.
5. **Ekstraksi target RUED menyesatkan bila dipercaya:** uji menghasilkan angka nasional 23%/31% dan skenario BAU yang tertukar dengan target daerah (contoh Lampung 2050 = 5, Banten 2025 = 5). Karena itu tidak ada angka target yang dipublikasikan otomatis; 9 baris punya `kandidat_seragam_per_tahun` yang masih perlu dibaca manusia. Dokumen RUED beragam (tabel berupa gambar, tahun dasar 2015 vs 2020, jalur BAU vs RUED).
6. **Pembanding kapasitas:** Kapasitas Wikidata (bila nanti dijalankan) akan berjajar dengan WP/GEM di `konflik.jsonl` proyek; dua sumber tidak ditimpa.
7. Ember asli vs OWID: OWID mengutip Ember Yearly Electricity Data; angka sama, penerbit perantara berbeda. Tingkat bukti `terbit`, bukan `resmi`.

## Gagal / tidak diambil (juga di `gagal.jsonl`)

| Sumber | Alasan | Langkah |
| --- | --- | --- |
| Wikidata (SPARQL/Action API) | robots.txt melarang /sparql dan /w/ untuk agen *. Koordinator memutuskan 7 Nov 2026 bahwa kebijakan UA dan batas laju Wikimedia mengizinkan bot ber-UA jujur; dijalankan lewat Action API (bukan SPARQL; P31 subclass tak bisa lewat pencarian), jeda 2,2 dtk, maxlag 30. Hasil: 504 pembangkit mentah, 37 proyek EBT memuat data Wikidata, 25 proyek baru hanya-Wikidata, 81% bertitik_persis; bendungan polos disaring. Penyelidikan awal memakai sekitar 120 GET pencarian sebelum keputusan itu. Penjagaan WIKIDATA_IZIN_PEMILIK=1 tetap ada | Selesai; mentah CC0 di data-panen/proyek/raw/wikidata_pembangkit.jsonl |
| Ember (files.ember-energy.org) | `robots.txt`: `Disallow: /` (hanya `*.pdf`) | Dipakai turunan OWID. Bila perlu CSV Ember asli, ekspor manual dari ember-energy.org/data |
| DEN (RUED provinsi, potensi) | `www.den.go.id/robots.txt`: `Disallow: /` (satu GET beranda terjadi saat penyelidikan, tidak disimpan) | Tidak diambil |
| Potensi EBT per provinsi (surya/bayu/hidro/bio/laut) | ebtke.esdm.go.id SPA tanpa daftar berkas statis yang ditemukan; sidata-ebtke.esdm.go.id tak terjangkau; lampiran RUEN Perpres 22/2017 hanya 10 KB teks (lampiran gambar); tabel potensi di RUED berupa gambar atau tak seragam | Entri manual dari RUEN Lampiran atau Buku Potensi EBT; atau OCR |
| BPP per sistem (Kepmen ESDM) | jdih.esdm.go.id 403 (WAF), tidak ada sumber lain terbuka yang ditemukan | Pemilik mengunduh Kepmen BPP terbaru |
| BPS | `api.bps.go.id` 403 tanpa kunci API (WebAPI BPS butuh key gratis) | Pemilik mendaftar key; produksi/konsumsi listrik per provinsi menyusul |
| IRENA situs web | www.irena.org 403 untuk klien non-peramban | Dipakai `pxweb.irena.org` (API PxWeb terbuka); Brunei tak ada di tabel |

## Temuan sampingan

- Daftar dokumen Gatrik memuat **RUPTL PLN 2025-2034** (`.../b967d-ruptl-pln-2025-2034-pub-.pdf`), jawaban untuk entri RUPTL di `data-panen/proyek/gagal.jsonl` yang mencatat PDF tak ditemukan. Tidak diunduh di sini (di luar tiket).
- `heesi-2025.txt` memuat banyak tabel lain yang belum dipakai: produksi pembangkit per jenis (6.4.2), PLTP per lokasi (6.5.2), kapasitas biofuel (6.6.1).

## Saran lanjutan

1. Pemilik memutuskan BPS key (Wikidata sudah diputuskan dan dijalankan); membuka data konsumsi.
2. Entri manual potensi EBT per provinsi dari RUEN sebagai seed berhasil sumber (satu berkas seed, pola `panen_proyek.mjs`).
3. Peninjau manusia membaca `kandidat` target RUED dan mengisi `target_ebt_persen`.
4. Tambahkan `tests/panen/` untuk `panen_wilayah.mjs` bila gerbang panen mewajibkan; saat ini hanya `--selftest`.
