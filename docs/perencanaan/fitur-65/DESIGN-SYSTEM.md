# DESIGN-SYSTEM: 65 fitur pilihan pemilik

Tidak ada token, huruf, atau palet baru. DESIGN-SYSTEM induk menang. Dokumen ini hanya menetapkan komponen mana yang dipakai tiap pola baru, supaya tidak lahir kelas lepas.

## 1. Pemetaan pola ke komponen yang ada

| Pola baru | Komponen yang dipakai | Catatan |
| --- | --- | --- |
| Kartu kalkulator | kartu analisis `.jm-ex` dengan `.jm-hitung` (Cara menghitung) | isian memakai kontrol formulir yang ada; hasil memakai `.jm-angka` |
| Hasil berlabel | `.jm-hip` (Hipotesis), `.jm-est` | wajib di samping angka hasil |
| Pembanding berdampingan | tabel `/banding` yang ada | kolom pertama lengket di 375 |
| Segmen dan tab | `.jm-tab`, segmen yang ada | aturan K1: ujung ke ujung, lebar sama, isi rata tengah |
| Antrean tinjauan admin | `admin_tabel.js`, pil status | status tidak hanya warna |
| Formulir kiriman | pola formulir `/portal` | galat di bawah kolom, `role="alert"` |
| Tiket dan sertifikat | perender kartu KTA | satu perender, tiga templat |
| Utas forum | komponen utas konsultasi | tanpa gaya baru |
| Daftar panjang | `paginasi.js` bernomor | tombol "tampilkan lagi" dilarang |
| Peta rasio | peta provinsi `/wilayah` | lima kelas dari satu seri warna; legenda bertingkat |
| Beda pasal | `--ok-bg` untuk tambahan, `--bad-bg` untuk hapusan | ditambah tanda teks "+" dan "-", bukan warna saja |

## 2. Keadaan yang wajib ada di tiap kartu baru

Sesuai DS induk §6.0: memuat (kerangka setinggi isi akhir), kosong (satu kalimat penyebab dan satu aksi), galat (kalimat dari katalog galat dan Coba lagi), luring, gelap, 375, fokus terlihat, gerak dimatikan bila `prefers-reduced-motion`.

## 3. Pelajaran audit 15 Nov 2026 yang mengikat fitur baru

- Teks di atas latar `--accent` memakai `--on-accent`, bukan `--on-brand`. Di tema gelap `--accent` terang, sehingga teks putih tidak terbaca.
- `--brand` bukan warna teks. Di tema gelap `--brand` gelap. Teks hijau memakai `--accent` atau `--head`.
- Pil berwarna topik: latar `color-mix(warna 14%, kartu)`, teks `color-mix(warna 45%, tinta)`. Memakai warna topik mentah sebagai teks gagal kontras untuk kuning, lime, dan biru muda.
- Angka di ubin tidak boleh patah di tengah digit: `white-space:nowrap` pada angka, satuan boleh turun baris.
- Kontrol kecil (lencana, ikon sumber) diperluas area sentuhnya dengan pseudo-elemen, tampaknya tetap.

## 4. Pustaka

Tidak ada pustaka baru. Pemindai QR (86) memakai `BarcodeDetector` bila peramban mendukung; bila tidak, admin mengetik kode tiket. Menambah pustaka pemindai butuh keputusan pemilik (DS induk §4 butir 2).
