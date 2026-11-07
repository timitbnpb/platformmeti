# Ilmu hak-auditor

> Kelas: pemeriksa · Model: haiku · Definisi: `.claude/agents/hak-auditor.md`
> Dibaca SEBELUM kerja (`node scripts/agents/ilmu.mjs baca hak-auditor`). Kasus baru
> ditambah SESUDAH kerja lewat `node scripts/agents/ilmu.mjs kasus hak-auditor "..."`.

## Peta berkas & tabel

Berkas yang diperiksa (read-only):

- `src/hak.js`: `PERAN`, `MATRIKS`, `AKSI_SEL`, `KLAUSA`, `KOLOM_RAHASIA`, `KOLOM_BACA`, `KOLOM_TULIS`, `TABEL_BACA`, `boleh`, `baca`, `tulis`, `sistem.*` (DT §5).
- `docs/perencanaan/KEAMANAN-PRIVASI.md` §1 (sumber kebenaran matriks), `tests/fixtures/matriks.json`, `tests/fixtures/hak-klausa.json`.
- `src/**` selain `hak.js` (pindai jalur D1 liar), rute tulis di `src/*.js`.
- `migrations/0001_akun.sql` dan `0002_jejak.sql` (CHECK peran, trigger super terakhir, trigger jejak).

Matriks: 15 jenis data (`entitas, fakta, ikatan, orang, kontak, terlarang, potret_publik, potret_anggota, potret_pengurus, akun, sesi, koreksi, riwayat, jejak, daftar_tolak`; baris `dummy` di KPV §1 dibatalkan KP K15). Kode sel: `-`, `B`, `B prov`, `T`, `T diri`, `T bukan-super`, `T cabut`, `T kirim`, `T kirim prov`. Klausa: `lapis`, `prov`, `sendiri`, `bukan-super`. `lapisBoleh`: PB publik; AN dan WL publik+anggota; PG KR AD SA semuanya.

## Aturan & invarian

1. Tak ada akses D1 di luar `hak.js`: pola `env.DB`, `.prepare(`, `.batch(`, `.exec(` di `src/**` selain `hak.js` = temuan tinggi (KP D7, KPV §2.1, DT §5.7).
2. `MATRIKS`, `tests/fixtures/matriks.json`, dan tabel KPV §1 identik. Selisih satu sel = temuan. Perubahan matriks adalah keputusan pemilik; kamu hanya melapor (KPV §1 penutup, DT §5.2).
3. Tiap sel punya uji izin dan uji DITOLAK (RU §2.2). Jumlah uji dibangkitkan = baris x peran dibaca dari fixture; selisih dengan jumlah sel matriks merah (RU menulis 112 sebelum K15 membuang baris dummy; jumlah baru ditetapkan induk).
4. WL: sel `B prov` dan `T kirim prov` memaksa `prov = akun.cakupan_prov`; WL tanpa cakupan = 0 baris; WL tidak membaca lapis pengurus, tidak membaca riwayat (KPV §1 butir 2 dan 7). Kontak WL hanya lewat `GET /api/kontak/:slug`.
6. Peran tak dikenal, akun nonaktif, sesi kedaluwarsa = PB, di `boleh()` langkah 1 (KPV §1 butir 11, DT §5.4).
7. Klausa digabung dengan AND, tidak pernah OR; tiap klausa punya bentuk `sql` dan `baris` yang setara (R11 §2.7, DT §5.6). Klausa dirujuk tapi tak terdefinisi, atau terdefinisi tapi tak dirujuk = temuan.
8. `tulis`: kolom di luar `KOLOM_TULIS[tabel][aksi]` ditolak; `id, kunci, slug, dibuat, dibuat_oleh` tidak pernah bisa ditulis siapa pun.
9. Akun: Admin tidak menetapkan `super`, tidak menyentuh akun `super`, tidak mengubah perannya sendiri; SA terakhir tidak turun/nonaktif/terhapus (rute dan trigger). Sel `T diri` hanya `nama`, `bahasa`, `sandi`.
10. Kolom rahasia (`KOLOM_RAHASIA`) tidak pernah dipilih `baca`; `jejak.dari/ke` tanpa kolom rahasia, entitas `orang` hanya nama kolom (DT §3.2, §5.4).
11. Tiap tabel D1 terpetakan di `jenisData(tabel, baris)`; fakta berkunci `kontak_*` ke `kontak`, bukan `fakta`. Tabel baru tanpa pemetaan = temuan.
12. Data terlarang (`agama, nik, tanggal_lahir, usia, alamat_rumah, status_kawin, biometrik, foto_wajah`) tak ada sebagai kolom di tabel mana pun, SA pun ditolak.
13. Pipeline tidak menulis D1 (ADR-08); jalur `sistem` hanya pernyataan tetap.

## Ranjau yang pernah meledak

- **Peran kasar + atribut sempit** (R11 §2.6, K-1 KRITIS): kursi provinsi = `admin`, `jabatan` tidak dibaca gerbang. Di METI: WL tanpa cakupan harus 0, bukan semua. Tahu: sel `B prov` di `hak.test.mjs`.
- **"Punya peran" = izin baca** (R11 §2.8, K-3 KRITIS): `is_staff()` meloloskan 28.000 akun ke 106 tabel. Tahu: sel `-` ditolak untuk 8 aksi; AN tidak membaca potret pengurus.
- **Penyempit PERMISSIVE di sebelah permissive = no-op** (R11 §2.7). Padanan: filter OR dibanding AND; periksa penggabungan klausa.
- **RLS hanya prosa** (R12 §2.5, §8.10): janji tanpa gerbang; D1 tidak punya RLS. Pastikan `gerbang-d1` hijau, kalau tidak seluruh matriks cuma hiasan (ADR-01).
- **Peta hak ditulis tangan di tiap rute** (R10 §2.8): `WHERE` hak manual tersebar. Hak harus satu fungsi per tabel mengembalikan `[klausa, bind]`.
- **Peran baru otomatis terbuka** (R10 §2.8 butir e): daftar peran yang boleh membuka modul harus eksplisit; peran baru tertutup.
- **`hapus_keras` lewat rute biasa**: hanya lewat hapus-permanen dengan `koreksi` `diterima` (DT §5.2).
- **Bendera tulis di pemanggil** (R11 §2.5): keputusan baca-saja belum ada di METI, jadi tidak ada peran baca-saja; kalau muncul, lapor.
- **Matriks fixture disalin otomatis dari kode**: harus disalin manusia dari KPV §1 dan ditinjau (DT §5.2); fixture yang dihasilkan dari `MATRIKS` membuat uji sinkron selalu hijau.

## Gerbang yang menghakimi

- `tests/hak.test.mjs`: sel matriks (112 di RU sebelum K15) + 9 uji turunan (daftar putih tulis, kolom rahasia, terlarang, fakta tanpa sumber, tabel ke jenis, injeksi, peran tak dikenal, klausa setara). Merah bila satu sel salah atau jumlah uji bukan 112.
- `tests/gerbang-d1.test.mjs`: akses D1 di luar `hak.js`.
- `tests/gerbang-matriks-sinkron.test.mjs`: `MATRIKS` vs fixture vs KPV §1 (diparse dari markdown).
- `tests/gerbang-matriks.test.mjs`: klausa dirujuk/terdefinisi tidak sinkron.
- `tests/akun.test.mjs`: AD tidak naik ke super, SA terakhir. `tests/rute-peran.test.mjs`: rute x peran.
- Eskalasi: akses D1 liar atau bypass sesi ke `security-reviewer`; rute tanpa gerbang ke `guard-api`; migrasi ke `migrasi-idempoten`.

## Kasus

Belum ada kasus. Tambahkan lewat ilmu.mjs kasus.
