# R24: Panen korporasi dan keuangan EBET

Tanggal panen 7 Nov 2026. Skrip `scripts/panen/panen_keuangan.mjs` (`--ambil`, `--tkdn`, `--bangun`, `--selftest`). Luaran di `data-panen/keuangan/` dan `data-panen/perusahaan/tambahan_*.jsonl`; bukti mentah di `data-panen/keuangan/raw/`. Tiap baris memuat `sumber_url`, `tanggal`, `tingkat_bukti`. UA jujur, jeda 2,3 dtk, robots dicek, tanpa login/CAPTCHA.

## Hasil per target

| Target | Berkas | Isi | Mutu |
| ------ | ------ | --- | ---- |
| 1. IDX emiten | `keuangan/idx.jsonl` (25 baris) | PGEO, BREN, KEEN, MEDC, TOBA, ARKO: pendapatan, laba bersih FY2024, aksi korporasi; PGEO juga dua pengurus | PGEO resmi (siaran pers PGE). Lainnya via media = `sedang`, ada konflik angka BREN (122,1 vs 155 juta USD) dan ARKO |
| 2. TKDN | `perusahaan/tambahan_tkdn.jsonl` (102 sertifikat, 55 perusahaan) | modul/panel surya, floater, penyangga, baterai, inverter, turbin; nilai TKDN, BMP, masa berlaku | resmi (tkdn.kemenperin.go.id/sertifikat?q=...). `kepakaran_usulan` heuristik kata kunci, perlu mata kurator |
| 3. BU BBN | `perusahaan/tambahan_bubbn.jsonl` | alokasi biodiesel 2026 (Kepmen 439/2025: 15.646.372 kL; PSO 7.454.600; non-PSO 8.191.772), 2025 (~15,6 juta kL), jumlah BU (26 BBN, 32 BBM) | total resmi; NAMA BU dan alokasi per BU tidak ada |
| 4. IUPTL | `perusahaan/tambahan_iuptl.jsonl` | hanya baris celah | tidak ada daftar publik |
| 5a. Green sukuk | `keuangan/green_finance.jsonl` | SNI 0754 USD600 juta (2 Jul 2024), PBSG001 IDR8,95 T, alokasi kumulatif 2018-2024: EBT IDR5,96 T (USD414 juta, 3,59%), efisiensi energi IDR4,64 T | resmi (laporan DJPPR 2025); lolos cek silang ke PDF |
| 5b. JETP | `keuangan/jetp.jsonl` | komitmen USD20 M (10 IPG + 10 GFANZ), CIPP 21 Nov 2023, konsultasi progress report 2025, 4 portofolio (MRT East-West USD1.027 juta) | resmi (jetp-id.org); daftar proyek CIPP belum terbaca |
| 6a. Tarif | `keuangan/tarif.jsonl` (93 baris) | Perpres 112/2022 Lampiran I per teknologi/varian/kapasitas (thn 1-10 x F, thn 11+), faktor F | resmi, hasil OCR PDF BPK, angka dicek silang antar tabel |
| 6b. BPP | `keuangan/bpp.jsonl` | Kepmen 169/2021 (BPP 2020) 13 sistem | angka via media (`sedang`) dan KEDALUWARSA (berlaku s.d. 31 Maret 2022) |

## Celah dan penyebab

1. **idx.co.id menjawab 403 Cloudflare** ke UA jujur, bahkan untuk robots.txt. Tidak ditembus (aturan antibot). Jalur sah: situs IR emiten, laporan tahunan PDF (belum diunduh), OJK, atau izin pemilik memakai pemanen-radar. Direksi/komisaris lengkap hanya PGEO dua nama; sisanya butuh laporan tahunan.
2. **Angka emiten non-PGEO dari media**, wajib diverifikasi ke laporan keuangan audit sebelum tampil. Laba bersih KEEN 2024 tidak terkonfirmasi. Aksi korporasi (IPO, obligasi) belum tertangkap; yang ada hanya proyek/COD.
3. **Nama BU BBN dan volume per BU**: hanya ada di lampiran Kepmen 439/2025 dan 341/2024 (JDIH ESDM / peraturan.go.id), tidak di rilis maupun media. Langkah berikut: unduh lampiran dan parse.
4. **TKDN**: `/cari`, `/export_excel`, `/api/` dilarang robots, jadi dipakai halaman `/sertifikat?q=` (tidak dilarang). Tiap kueri dibatasi 8 halaman (80 hasil); `inverter` (133) dan `baterai lithium` (320) terpotong. Total basis 82.694 sertifikat. Pabrikan modul surya besar (mis. PT Rec Solar Energy Indonesia, Adyawinsa, Utomo Solar) masuk, tapi cakupan belum lengkap.
5. **BPP**: Kepmen BPP setelah 2022 tidak ditemukan publik; abstrak JDIH tanpa tabel lampiran. Jangan tampilkan sebagai BPP berlaku.
6. **JETP**: PDF CIPP terpotong di 98 KB saat diunduh (server memutus), dan WebFetch 403. Daftar proyek prioritas dan angka per area fokus belum diambil. Progress Report 2025 versi final belum terbit.
7. **IUPTL**: ESDM tidak menerbitkan daftar; jalur permintaan PPID atau OSS. Green/sustainability-linked bond IDX: tidak terjangkau karena poin 1.
8. **Tarif**: F untuk Maluku, Papua, Mentawai terbaca samar dan dibuang; PLTP uap setara listrik >100 MW thn 11+ (3,91) samar. Tarif bisa diubah Kepmen ESDM; cek ulang sebelum dikutip.

## Catatan integrasi

`data-panen/` di-gitignore (dipakai sebagai area kerja pipa). Baris `jenis:"celah"` sengaja ada agar pemeriksa tahu yang kosong adalah kosong, bukan lupa. Belum ada gerbang `jaga_unggah` yang mengenal skema berkas ini; skema baru, bukan `perusahaan.jsonl`.
