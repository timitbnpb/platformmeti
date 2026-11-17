# RENCANA-UJI: 65 fitur pilihan pemilik

RENCANA-UJI induk menang. Prinsip pemilik: perilaku yang tinggal di luar JavaScript layar (SQL, rute, cron) wajib punya uji integrasi yang benar-benar menjalankannya; uji bermock bukan bukti.

## 1. Per jenis kerja

| Jenis | Uji wajib | Bukti |
| --- | --- | --- |
| Modul rumus (39, 40, 42, 45, A) | uji acuan `node:test`: tiap rumus dihitung ulang dari contoh tertulis, termasuk tepi (nol, negatif, porsi tidak 100 persen) | `npm run uji` |
| Layar baru di halaman lama | gerbang i18n (kunci `id.json` dan `en.json` setara), gerbang token, gerbang tipografi, gerbang kontras | `npm run uji` |
| Rute Worker baru | entri `tests/e2e/cakupan.json`; uji peran (tamu, anggota, admin); uji CSRF; uji batas laju | uji integrasi D1 lokal |
| Migrasi | idempoten (dua kali jalan), tidak menyunting migrasi lama | `migrasi-idempoten` |
| Token tiket dan sertifikat | token salah, token event lain, pindai ganda | uji integrasi |
| Cron pengingat | tidak mengirim dua kali untuk perubahan yang sama; menghormati berhenti langganan | uji integrasi dengan waktu tiruan |
| Unggah foto | tipe palsu ditolak dari magic byte; ukuran lebih ditolak | uji integrasi |

## 2. Uji layar per tiket

1. Sapu otomatis: tanpa gulir horizontal di 375, tanpa galat konsol, tanpa permintaan 4xx atau 5xx, tanpa teks "undefined", "NaN", atau kunci i18n mentah.
2. Sapu kontras: nol pasangan baru di bawah 4,5 (teks besar 3) di terang dan gelap.
3. Data terburuk: nama 80 huruf, daftar kosong, angka 0, angka sangat besar, isian negatif.
4. Tangkapan 1440 dan 375, terang dan gelap, ID dan EN, disimpan di `tests/layar/tangkapan/`.
5. Uji asap live (`npm run uji:live`) sesudah deploy; tanpa itu belum dianggap tayang.

Skrip sapu yang dipakai audit 15 Nov 2026 (metrik per halaman dan kontras per kelas) layak dipindah ke `scripts/mesin/` sebagai gerbang tetap; dicatat sebagai bagian F65-001.

## 3. Garis dasar sebelum modul ini

- `npm run uji`: 2.179 lulus, 0 gagal (15 Nov 2026, sesudah perbaikan audit).
- Sapu 90 halaman: nol gulir horizontal di 1440 dan 390.
- Hasil sapu kontras sesudah perbaikan dicatat di laporan audit; angkanya menjadi plafon yang tidak boleh naik.
