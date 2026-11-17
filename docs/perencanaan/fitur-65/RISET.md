# RISET: 65 fitur pilihan pemilik

Sumber satu-satunya sejauh ini: pemetaan repo 15 Nov 2026 (grep rute `src/*.js`, `migrations/`, `public/i18n/id.json`, nama berkas `public/`). Belum ada riset luar (pembanding, harga, lisensi data). Yang belum diriset ditulis sebagai belum, tidak dikarang.

## 1. Temuan pemetaan

| Kelas | Jumlah | Butir |
| --- | --- | --- |
| ADA | 15 | M4, M5, 20, 25, 30, 31, 34, 35, 36, 37, 38, 46, 50, 68, 73 |
| SEBAGIAN | 38 | A, B, C, M2, M3, M6, 18, 22, 24, 26, 27, 40, 41, 43, 44, 47, 48, 49, 52, 53, 55, 56, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 69, 70, 71, 72, 86, 88 |
| BELUM | 12 | M1, 39, 42, 45, 51, 54, 57, 74, 75, 87, 89, 90 |

Batas pemetaan: "ADA" berarti rute dan teks antarmukanya ditemukan, bukan bahwa fiturnya sudah diuji ujung ke ujung (tiket F65-001).

## 2. Modal yang bisa dipakai ulang

| Kebutuhan | Yang sudah ada |
| --- | --- |
| Rumus kelayakan, LCOE, CRF | `public/inti/kelayakan_rumus.js`, `model_keuangan_rumus.js`, `investasi_rumus.js` |
| Pembanding berdampingan | `/banding` (provinsi, organisasi) |
| Mesin survei | migrasi `0031_keyakinan.sql`, `src/keyakinan.js` |
| Pendaftar event | migrasi `0013_event.sql` (`event_daftar`), `src/event.js` |
| Kartu dan QR terverifikasi | `src/kta.js`, `public/kta_kartu.js` |
| Utas, balasan, sembunyi | `src/konsultasi.js` |
| Unggah gambar aman | unggah agenda dan foto profil (magic byte, kunci R2 dibuat server) |
| Surel dan berhenti langganan | `src/surel.js`, `src/langganan.js` |
| Ikuti entitas | `src/ikuti.js`, `/diikuti` |
| Pembayaran | Midtrans Snap opsional di `src/daftar.js` |
| Data insentif, izin, karbon, desa | `public/data/insentif_fiskal.json`, `izin_kontrak.json`, `karbon*.json`, `desa_energi*.json`, `dedieselisasi.json` |
| AI | binding `AI` dan Vectorize (`src/tanya.js`) |

## 3. Yang belum diriset (wajib sebelum tiketnya dibuka)

| Butir | Riset yang kurang |
| --- | --- |
| 39 | harga rujukan REC dan kredit karbon yang boleh dikutip; bila tak ada, harga murni isian pengguna |
| 42 | konsumsi spesifik genset dan harga BBM daerah terpencil bersumber; periksa dulu isi `dedieselisasi.json` |
| 44 | luas lahan per MW per teknologi dari sumber resmi |
| 51 | pembagian urusan energi menurut UU Pemda dan perubahannya; pasal mana yang berlaku sekarang |
| 55 | daftar janji kebijakan bertanggal dan siapa yang mengucapkannya |
| 86, 89 | cara pindai QR di peramban tanpa pustaka baru (DS §4 butir 2 melarang pustaka tambahan tanpa keputusan pemilik) |
| M3 | QRIS lewat Midtrans: biaya, alur notifikasi, bentuk faktur yang sah |
| 48, 74 | kuota dan biaya binding AI per hari |
| semua gelombang 3 | lisensi dan ketersediaan data di C-05 |
