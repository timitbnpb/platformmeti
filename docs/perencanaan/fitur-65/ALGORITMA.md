# ALGORITMA: 65 fitur pilihan pemilik

Kalah dari ALGORITMA induk untuk enum, label bukti, EST, dan Hipotesis. Tiap rumus di sini tinggal di satu modul `public/inti/*_rumus.js` yang murni (tanpa DOM), dengan uji acuan `node:test` yang menghitung ulang contoh tertulis.

Aturan F4 berlaku untuk semua: konstanta diambil dari data bersumber atau diisi pengguna. Bila tertulis "isian pengguna", tidak ada nilai bawaan.

## 1. Emisi dihindari dan nilai REC (39)

- `E_mwh` = energi tahunan (isian, atau dari kalkulator produksi yang ada).
- `fe` = faktor emisi sistem kelistrikan tempat proyek berada, tCO2e per MWh, dari data intensitas per sistem yang sudah dipakai `/target#transisi`.
- Emisi dihindari per tahun = `E_mwh * fe`.
- Nilai karbon = emisi dihindari kali harga per tCO2e (isian pengguna).
- Jumlah REC = `E_mwh` (1 REC = 1 MWh); nilai REC = jumlah kali harga per REC (isian pengguna).
- Label: Hipotesis. Batas tafsir: bukan metodologi registri; additionality tidak dinilai.

## 2. Hemat dibanding diesel (42)

- Biaya diesel per kWh = `harga_bbm_per_liter * konsumsi_spesifik_liter_per_kwh + om_per_kwh`. Ketiganya isian pengguna kecuali ada nilai bersumber di `dedieselisasi.json`.
- Biaya EBT per kWh = `lcoe()` dari `kelayakan_rumus.js` untuk PLTS plus baterai dengan isian capex, opex, umur, WACC.
- Hemat per tahun = `(biaya_diesel - biaya_ebt) * kWh_tahun`.
- Balik modal tidak dihitung: biaya EBT per kWh adalah biaya terlevelisasi yang sudah memuat investasi, sehingga membaginya lagi dengan capex menghitung investasi dua kali. Selisih negatif ditampilkan apa adanya dengan kalimat "diesel masih lebih murah".

## 3. Baterai geser beban (45)

- Energi tergeser per hari = `min(kapasitas_kwh * dod, daya_kw * jam_geser) * efisiensi_pp`.
- Pendapatan per tahun = energi tergeser kali selisih tarif puncak dan luar puncak kali hari operasi.
- Degradasi linear per tahun (isian) mengurangi kapasitas.
- Arus kas, NPV, balik modal memakai fungsi model keuangan yang ada.

## 4. Pembiayaan campuran (40)

- Porsi hibah, pinjaman lunak, dan utang komersial diisi sebagai persen capex; ekuitas = sisanya. Jumlah ketiganya di atas 100 persen ditolak dengan kalimat penyebab.
- Dua utang berjalan sebagai dua jadwal anuitas yang dijumlahkan per tahun (bunga, pokok, cicilan, saldo); DSCR memakai cicilan gabungan.
- Hibah tidak dikembalikan: hanya mengurangi setoran ekuitas tahun ke-0. Arus proyek (sebelum pendanaan) tidak berubah.
- Bunga rata-rata seluruh utang = `(utang_komersial * r_komersial + utang_lunak * r_lunak) / utang_total`. Imbal hasil ekuitas bukan masukan model, jadi WACC tidak dihitung; tingkat diskonto tetap isian yang ada.

## 5. Pemeriksa insentif (43)

Bukan rumus. Tiap insentif di `insentif_fiskal.json` diberi daftar syarat boolean. Jawaban pengguna menyaring: "memenuhi syarat yang ditanyakan", "tidak memenuhi", atau "perlu dicek" bila syaratnya tidak tercakup pertanyaan. Tidak pernah menulis "berhak".

## 6. Penaksir lahan (44)

- Luas = `kapasitas_mw * luas_per_mw`, ditampilkan sebagai rentang bawah sampai atas per teknologi.
- `luas_per_mw` wajib bersumber (RISET §3); tanpa sumber, teknologi itu tidak ditawarkan.
- Daftar izin = irisan `izin_kontrak.json` dengan kelas kapasitas.

## 7. Rasio terpasang terhadap potensi (24)

- `rasio = terpasang_mw / potensi_mw` per provinsi dan teknologi.
- Potensi nol atau kosong: "tidak ada angka", tidak diwarnai.
- Kelas warna tetap lima tingkat, ambang ditulis di legenda.

## 8. Skor pencocokan bisnis (A)

- Skor 0 sampai 100 = jumlah tertimbang kecocokan teknologi, wilayah, ukuran proyek, dan tahap. Bobot awal sama rata dan terbuka di layar.
- Label Hipotesis. Pasangan tanpa kecocokan teknologi tidak tampil.
- Urutan seri: skor, lalu kelengkapan profil, lalu nama.

## 9. Beda pasal (47)

Beda per kata dengan urutan umum terpanjang (LCS) antara teks pasal lama dan baru dari `hukum/**`. Dijalankan di peramban; teks di atas ambang panjang yang ditetapkan saat tiket dibandingkan per ayat supaya klik tidak membekukan layar (INP).

## 10. Tiket dan sertifikat (86, 89)

- Token tiket = HMAC atas `id_daftar` dengan kunci server, pola yang sama dengan verifikasi KTA.
- Hadir dicatat sekali; pindai kedua mengembalikan jam pindai pertama.
- Sertifikat sah bila pendaftar berstatus hadir dan acara berstatus ditutup.
