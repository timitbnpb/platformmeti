# R25. Panen lanjutan: proyek, orang, inovasi (7 Nov 2026)

Skrip: `scripts/panen/panen_lanjutan.mjs` (`--selftest`, `--dprwiki`, `--wb`, `--kurasi`, `--url=`). Keluaran di `data-panen/` (di luar repo). UA jujur, jeda 2,2 dtk, robots dicek, tanpa login, formulir, atau CAPTCHA. Nilai tanpa sumber tidak diisi.

## Hasil

| Target | Berkas | Baris | Bukti |
|---|---|---|---|
| 1c/1d Bank Dunia, energi Indonesia | `proyek/tambahan_worldbank.jsonl` | 60 dari 593 proyek ID | resmi (API terbuka, CC BY 4.0) |
| 1a WKP/PSPE dilelang 2025 | `proyek/tambahan_wkp_jica.jsonl` | 10 | media (Kontan, CNBC mengutip paparan Ditjen EBTKE 17 Sep 2025) |
| 1d JICA Hululais (Bengkulu), 29.156 juta yen, 30 Mar 2026 | idem | 1 | resmi (siaran pers JICA) |
| 2a Komisi XII 2024-2029 | `orang/tambahan_dpr.jsonl` | 45 (nama, fraksi, dapil, peran) | media (Wikipedia id, CC BY-SA) |
| 2b rotasi BUMN energi | `orang/tambahan_rotasi.jsonl` | 15 (PLN 18 Jun 2025, PLN 14 Okt 2026, Pertamina 12 Jun 2025) | media |
| 3c lomba | `inovasi/lomba.jsonl` | 1 (GeO-Fert PGE, ASEAN RE Project Awards 2025) | media |
| 3b BRIN | `inovasi/brin.jsonl` | 1 (Si-ZERO, daur ulang panel surya) | resmi |
| 3a paten, 3d startup | `inovasi/paten.jsonl`, `startup.jsonl` | 0 | lihat hambatan |

## Hambatan (jangan dicoba ulang tanpa keputusan pemilik)

- **DJKI/PDKI**: `robots.txt` = `Disallow: /`. Tidak dipanen.
- **ADB** (`adb.org`, `data.adb.org`): tantangan Cloudflare ("Just a moment"). Melewatinya = bypass bot-detection, dilarang. Proyek ADB belum ada; jalur sah: pemilik unduh CSV dari portal ADB, atau cari mirror terbuka.
- **dpr.go.id**: halaman anggota memakai GraphQL `/gql` yang menjawab `Unauthenticated`; REST `/api/` dilarang robots. Maka foto dpr.go.id TIDAK diambil dan sumber anggota memakai Wikipedia (media). Seed lokal guidebook 10 Nov 2025 sudah ada di `orang/seed`. Perubahan nyata: Ketua Komisi XII kini Bambang Patijaya (Golkar), guidebook mencatat Melchias Markus Mekeng; perlu direkonsiliasi oleh sesi yang memiliki `orang.jsonl`.
- **Amdalnet**: `fetch failed` untuk `amdalnet.menlhk.go.id` dan `amdalnet-dev` (tidak terjangkau dari sini); belum ada data AMDAL.
- **bisnis.com** membalas 403; **ANTARA** melarang crawling otomatis di syarat situsnya (satu halaman dipakai untuk fakta jabatan publik, jangan tambah).
- **Lelang PLN untuk IPP EBT**, **PLTS atap per provinsi**, **JICA di luar Hululais**, **paten/startup tambahan**: tidak ada sumber terbuka yang ditemukan pencarian; PLTS atap hanya angka nasional lama (Mei 2023: 95 MW, 7.075 pelanggan) dan PLTS semua jenis semester I 2025 +233,3 MW, bukan per provinsi, jadi tidak dimasukkan.

## Catatan mutu

- Pemenang lelang WKP 2025 belum ditemukan; kolom `pemenang` null.
- Pergantian Dirut PLN 14 Okt 2026 hanya dari satu media (kutipan Komisaris Independen PLN); ditandai "perlu dicek ke pengumuman resmi".
- Bank Dunia: sebagian proyek lama tanpa tanggal; DPL/kebijakan sektor energi ikut tersaring (teknologi null); `sektor_wb` disertakan untuk disaring lanjut. Tanpa koordinat dan provinsi.
- Format baris proyek tambahan lebih sederhana dari `proyek.jsonl` (belum berbentuk atribut `{nilai, sumber_id}`); sesi yang memiliki `panen_proyek.mjs` perlu memetakan.
- Orang tambahan memakai `orang_id` yang sama dengan skema `panen_orang.mjs` (sha1 nama ternormalisasi) agar bisa digabung.
