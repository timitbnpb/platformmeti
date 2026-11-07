# R20: Direktori lembaga EBET (7 Nov 2026)

Skrip: `scripts/panen/panen_lembaga.mjs` (`--seed`, `--verifikasi`, `--meti`, `--pengurus`, `--anggota`, `--statistik`). Keluaran di `data-panen/lembaga/` (tidak masuk repo).

- 135 lembaga: asosiasi 22, kementerian 23, lembaga 12, dpr 1, think-tank 8, lsm 5, universitas 10, donor 16, pemda 38 (dinas ESDM 38 provinsi).
- Isi dasar (nama, jenis, induk, kepakaran, kota) berasal dari benih pengetahuan peneliti, `tingkat_bukti: inferensi`. Hanya yang situsnya terbaca (43%) naik ke `situs-sendiri`. Alamat 23%, surel generik 14%.
- Kepengurusan METI 2025-2028: `pengurus-meti.jsonl`, 140 orang dari `metiires.or.id/about/meettheteam` (robots mengizinkan), 27 foto (19%; halaman menandai sisanya "Foto belum tersedia"), 68 tertaut `orang_id` (nama sama persis).
- Keanggotaan 46 baris: asosiasi ke METI (inferensi), bagian-dari, 19 perusahaan ke APAMSI. Daftar anggota asosiasi lain TIDAK terurai (halaman anggota tidak ditemukan/berupa SPA).
- Gagal (`gagal.jsonl`, 15): 12 domain dinas ESDM tebakan tidak ada (ENOTFOUND), 1 HTTP 403 (host dihentikan), 1 timeout, 1 ditolak koneksi.
- Pengurus lembaga lain hanya dari `orang.jsonl` (METI, Komisi XII, ESDM, AESI, dll.); foto 0.
