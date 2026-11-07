# Ilmu validasi-model

> Kelas: pemeriksa · Model: sonnet · Definisi: `.claude/agents/validasi-model.md`
> Dibaca SEBELUM kerja (`node scripts/agents/ilmu.mjs baca validasi-model`). Kasus baru
> ditambah SESUDAH kerja lewat `node scripts/agents/ilmu.mjs kasus validasi-model "..."`.

## Peta berkas & tabel

Berkas yang kamu periksa (read-only, lapor tanpa auto-fix): `public/algo.js`, `public/taksonomi.js`, `tests/fixtures/acuan.json` (RU) atau `tests/fixtures/algo-acuan.json` (ALG §14.2), `tests/algo.test.mjs` dan `tests/algo/<nn>-<topik>.test.mjs`, serta skor/kuadran yang tertulis di potret oleh `scripts/direktori/potret.mjs`. Rujukan: `docs/perencanaan/ALGORITMA.md` (ALG) ada di paket dan menang atas DS bila beda angka.

Kolom D1 yang relevan: `fakta.tingkat_bukti`, `ikatan.tingkat_bukti` (empat nilai), `sumber.jenis` (enam), `sumber.diperiksa`, `fakta.est` + `rumus`, `fakta.alasan_kosong`, `entitas.di_sensus`, `entitas.anggota_meti`.

Modul dan bagian ALG: kunci/nama/slug §1, taksonomi §2, ikatan dan dedup §3, tingkat bukti dan keyakinan §4, kuadran §5, graf dan `strategis` §6, kesiapan provinsi §7, sensus §8, EST/Cara menghitung §9, formatter §10, cari §11, daftar tolak §12, lapis §13.

## Aturan & invarian

1. **Satu implementasi rumus:** hanya `public/algo.js` dan `taksonomi.js`, diimpor Worker, Node, dan layar (ADR-03). Tidak ada salinan di Python, `scripts/**` lain, atau JS layar. Modul bisa diimpor di Node tanpa `window` (`typeof window`).
2. **Tingkat bukti empat nilai** (ALG §4.1): bobot `terkonfirmasi` 1,00, `kata-pihak` 0,70, `cuplikan` 0,40, `inferensi` 0,20. Nilai lain DITOLAK saat impor, tidak ditambal saat tampil. Langit-langit jenis sumber (ALG §3.2): `via-pihak-ketiga` dan `media` maks `cuplikan`; `situs-sendiri` maks `kata-pihak`.
3. **`hitungKeyakinan` (ALG §4.2):** `mentah = 0,40*K1 + 0,25*K2 + 0,20*K3 + 0,15*K4`; tanpa K4 dibagi 0,85. K2 = `min(1, n_eff/4)`, domain via-pihak-ketiga dihitung 0,5. K3: 1 sampai 180 hari, linear turun ke 0 pada 1095. Batas atas: semua via-pihak-ketiga 0,59; tanpa butir terkonfirmasi/kata-pihak 0,59; satu domain 0,74. Bulatkan dua desimal DULU, baru label: >= 0,75 Tinggi, >= 0,40 Sedang, selain itu Rendah. `via-pihak-ketiga` tidak pernah Tinggi.
4. **Skor dihitung dari lapis publik saja** dan sama di semua lapis (ALG §13.1 butir 2). Butir `est = 1` dihitung sebagai `inferensi`; tidak dirata-ratakan antar entitas.
5. **Konstanta tercatat**, bukan angka sihir: `KONSTANTA.keyakinan` di ALG §4.6 dibaca `/metode`; tidak ada angka kedua di dokumen layar. Bobot, `NMIN` (5 entitas; 10 provinsi), jendela 365 hari, toleransi 5 persen, 20 persen susut, semuanya punya tempat tunggal.
6. **Data kosong bukan nol:** `persentil` dengan n < `NMIN` memberi `null` (`data-belum-cukup`); entitas tanpa angka sebuah ukuran TIDAK ditempatkan di kanvas dan tampil `-` dengan alasan; kesiapan provinsi butuh >= 3 komponen, selain itu `null` (`komponen-kurang`).
7. **Kuadran:** titik tepat di median masuk sisi tinggi (`>=`); median dihitung atas skor yang ada; kapasitas grup dibobot `persen` ekuitas tanpa hitung ganda dan berlabel EST (ALG §5.4).
8. **Status uji:** `STATUS_UJI` skor, kuadran, kesiapan = `hipotesis` sampai uji kalibrasi lulus (ALG §4.7: 30 profil, dua peninjau, Spearman >= 0,6, |t| >= 2; kesiapan §7.4: n >= 20, r >= 0,2). Tampil dengan pil Hipotesis dan "Cara menghitung" (KP C-16). Mengubah ambang butuh persetujuan pemilik (H-3).
9. **EST (ALG §9.1):** angka turunan wajib `est = 1` + `rumus` + `tingkat_bukti = inferensi`; EST tidak dijumlah dengan angka diumumkan; `_min` tidak dijumlah dengan kunci biasa; `output` tidak diturunkan dari pendanaan atau valuasi; jangkar nilai tambah sektor masih KOSONG (H-4), jadi `estimasiOutput` mengembalikan `null` tanpa jangkar bersumber.
10. **`pilihFakta`:** nilai berbeda antar sumber jadi rentang bersumber, tidak dirata-ratakan diam-diam; satuan berbeda ditolak (`satuan-berbeda`), tidak dikonversi diam-diam.
11. **`nuklir` dan `ccs`** tidak masuk sensus (CHECK `di_sensus`, ALG §8); `strategis()` tidak memberi bintang pada empat entitas METI (KP D13).
12. **Fixture acuan:** nilai harapan dihitung tangan dari ALG, TIDAK diturunkan dari keluaran kode yang diuji (RU §2.1). Tiap nama uji di ALG §14.2 (160 nama) ada di fixture dan sebaliknya.

## Ranjau yang pernah meledak

- **Empat kosakata tingkat bukti ditambal di tampilan** (R12 §8.1; ALG §4.1): `A_/B_/C_`, `primer/sekunder/klaim`. Cari `normTingkatLama` dipakai selain impor lama, dan cari kosakata kedua di layar.
- **Normalisasi yang memakan nama sendiri** (R11 §3.10): pengupas awalan menghapus nama entitas; 940 sekolah hilang tanpa galat. Periksa kasus uji `intiNama` dengan satu kata (`KATA_UMUM`, "Bank").
- **Angka gagal diam karena satuan** (R11 §3.9): 155 kali lipat. Periksa konversi satuan terpusat dan pasangan tak sebanding.
- **Rata-rata diam-diam atas sumber berbeda** (ALG §4.3) dan **desimal ID bercampur titik** (R12 §8.3).
- **Hitung ganda kapasitas grup** (ALG §5.4): anak usaha dijumlah ke induk dan tampil sendiri. Cek `kapasitasGrup.tanpa-hitung-ganda`.
- **Janji tanpa pemilik** (R12 §8.10): "skor diuji" tanpa perintah bukti. Skor tanpa fixture acuan atau tanpa pil Hipotesis = temuan.
- **Potret basi menyajikan skor lama** (R11 §3.12): rumus berubah tetapi potret tidak dibangun ulang; minta `dibangun_pada` dan versi skema.
- **Seri/pembulatan:** label dari angka belum dibulatkan (0,745 ditulis 0,74); `bulat` setengah menjauhi nol.

## Gerbang yang menghakimi

- `tests/algo.test.mjs` dan `tests/algo/01..13-*.test.mjs` terhadap `tests/fixtures/acuan.json`: merah bila keluaran rumus tak sama dengan harapan tangan; keluarga N, D, K, Q, S, C, G, F, E, U (RU §2.1).
- `tests/gerbang-algo-acuan` (ALG §14.2): nama uji dan kunci fixture tidak sama.
- `tests/gerbang-taksonomi.test.mjs`: nilai `taksonomi.js` berbeda dari CHECK migrasi ke arah mana pun.
- `tests/potret.test.mjs`: skor/sensus hanya dari lapis publik, `meta.json` `tanpa_sumber = 0`, deterministik byte.
- `tests/gerbang-test-integrasi.test.mjs` bila fungsi ekspor baru tak terdaftar di `tests/cakupan.json`.
- Kamu dipanggil bila `algo.js`, `taksonomi.js`, skor/kuadran potret, atau fixture acuan berubah. Laporan: butir yang dilanggar, rujukan ALG §, berkas:baris, tingkat keparahan; tidak menyunting; tidak menilai keamanan (itu `security-reviewer`).
- Fakta penting paket: ALGORITMA ada (108 KB) tetapi RU §2.1 dan §8 butir 8 masih menyatakannya belum ada; fixture memakai ALG, dan bila beda, ALG menang atas DS §6.9 (DS sendiri menyatakannya).

## Kasus

Belum ada kasus. Tambahkan lewat ilmu.mjs kasus.
