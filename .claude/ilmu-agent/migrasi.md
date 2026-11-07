# Ilmu migrasi

> Kelas: pengerja · Model: sonnet · Definisi: `.claude/agents/migrasi.md`
> Dibaca SEBELUM kerja (`node scripts/agents/ilmu.mjs baca migrasi`). Kasus baru
> ditambah SESUDAH kerja lewat `node scripts/agents/ilmu.mjs kasus migrasi "..."`.

## Peta berkas & tabel

Wilayahmu hanya `migrations/**` (0001..0099). Sumber kebenaran skema: DESAIN-TEKNIS (DT) §3; tabel di luar DT §3 tidak dibuat.

| Berkas | Tabel dan isi penting | Tiket |
| --- | --- | --- |
| `0001_akun.sql` | `akun` (peran `anggota/pengurus/kurator/wilayah/admin/super`, `cakupan_prov` wajib bila `wilayah`, `garam` 32 hex, `sandi` 64 hex, `iterasi >= 100000`, `aktivasi_hash`, `status`); `sesi` (`id_hash` 64, `sampai > dibuat`); trigger `akun_super_terakhir_ubah/hapus` | JM-B01 |
| `0002_jejak.sql` | `jejak` append-only: trigger `jejak_tanpa_ubah` (semua UPDATE) dan `jejak_tanpa_hapus` (DELETE ditolak); `dari`/`ke` JSON valid maks 4000 | JM-B07 |
| `0003_entitas.sql` | `sumber`, `entitas`, `label`, `alias`, `fakta`, `pasangan_ikatan`, `ikatan`, FTS5 `entitas_cari` (+ 6 trigger sinkron), trigger `entitas_kunci_tetap`, `entitas_gabung_tanpa_rantai`, `ikatan_pasangan_tambah/ubah` | JM-D01 |
| `0004_koreksi.sql` | `koreksi` (indeks unik parsial `koreksi_terbuka_unik` WHERE `status='baru'`) | JM-E06 |
| `0005_riwayat.sql` | `riwayat` (lapis pengurus; trigger `riwayat_target_sah`: target hanya `orang`/`lembaga`; `kegiatan_ref`, bukan `kejadian_id`) | JM-F09 |
| `0006_laju.sql` | `laju` WITHOUT ROWID, PK `(kunci, aksi, jendela)`, dipakai UPSERT satu tulis | JM-B03 |

Kolom wajib bersumber: `entitas.sumber_id`, `fakta.sumber_id`, `ikatan.sumber_id` semuanya `NOT NULL REFERENCES sumber(id)`. `fakta.tingkat_bukti` dan `ikatan.tingkat_bukti` NOT NULL dengan empat nilai `terkonfirmasi, kata-pihak, cuplikan, inferensi`. `sumber.url` GLOB `https://*`/`http://*` tanpa spasi; `sumber.jenis` enam nilai (`dokumen-resmi, filing, situs-sendiri, media, data-terbuka, via-pihak-ketiga`).

Berkas terkait yang kamu baca tetapi tidak kamu miliki: `public/taksonomi.js` (harus sama persis dengan semua daftar CHECK), `src/hak.js` (aturan yang SQL tidak bisa jaga), `tests/fixtures/migrasi-beku.json`.

## Aturan & invarian

1. **Migrasi yang sudah jalan tidak disunting.** Perubahan skema = berkas bernomor baru (DT §3.7 butir 2; TIKET §0). Setelah pemilik menerapkan ke produksi (JM-H04) hash masuk `migrasi-beku.json`.
2. **Idempoten:** `CREATE TABLE/INDEX/TRIGGER/VIRTUAL TABLE IF NOT EXISTS`; data tetap lewat `INSERT OR IGNORE` (contoh `pasangan_ikatan`). Pola DT memakai `CREATE TRIGGER IF NOT EXISTS`, bukan DROP lalu CREATE (RU §1.4 `gerbang-migrasi` melarang `DROP`).
3. **Tanpa `DROP`, `ALTER ... DROP COLUMN`, `DELETE` pada data.** Membangun ulang tabel hanya dengan pola salin-lalu-ganti plus uji data (DT §3.7).
4. **Sumber wajib tiga tingkat, ditolak di SQL** (KP D5; DT §3.3 catatan 1). Jangan melonggarkan `NOT NULL` atau panjang CHECK demi meloloskan impor.
5. **Kolom terlarang tidak punya kolom:** NIK, alamat rumah, tanggal lahir, agama, status kawin, biometrik (KPV §3.1, DT §3.3 catatan 4). CHECK `fakta` menolak teks berpola surel atau sembilan angka berurutan di lapis `publik`; `kontak_surel`/`kontak_telepon` hanya lapis `pengurus`.
6. **Rahasia akun** (`garam`, `sandi`, `iterasi`, `aktivasi_hash`, `aktivasi_sampai`) hanya di `akun`; tidak pernah masuk `jejak.dari/ke` (dipegang `hak.js`).
8. **Taksonomi:** daftar nilai CHECK (sektor, kategori, jenis, jenis ikatan, jenis pasok, jenis sumber, tingkat bukti, rantai, alasan kosong, peran, aksi jejak, aksi laju, status) sama sebagai himpunan dengan `public/taksonomi.js` (RU §3.3). Mengubah satu sisi tanpa sisi lain merah.
9. **`nuklir` dan `ccs` tidak boleh `di_sensus`** (CHECK, ALG §8, KP C-12). `est = 1` wajib `rumus` dan `tingkat_bukti = 'inferensi'`.
10. **`kunci` dan `slug` entitas tak berubah**; penggabungan tidak berantai (trigger).
11. **Jangan menjalankan migrasi ke remote/produksi.** Hanya `--local` untuk uji; produksi dijalankan pemilik (DT §8.5, KPV §9).
12. **Penomoran urut 0001..0099 tanpa lompatan atau ganda.** `laju` ada di `0006`, bukan `0001` walau TIKET JM-B01 masih menyebutnya (DT §3 catatan klarifikasi).

## Ranjau yang pernah meledak

- **Penomoran ganda dan salinan nyasar** (R10 §8 butir 8): dua `0023_*`, dua `0024_*`, `0053_kontak 2.sql`. Sebab: banyak sesi menulis bersamaan, salinan Finder. Akibat: urutan terapan tak pasti. Tahu dari `gerbang-migrasi` (nomor tidak berurutan) dan `ls migrations | grep ' '`.
- **Stempel migrasi bentrok 4 kali dalam 2 hari** dan `create or replace` atas salinan usang (R11 §8.13). Sebab: aturan di dokumen kalah oleh agent paralel. Obat: hanya gerbang mekanis; periksa nomor tertinggi sebelum menulis.
- **Migrasi manual ke produksi lalu kode mendahului skema** (R10 §1.8, §8 butir 8): rute 503/500 karena tabel belum ada. Di METI pemilik yang menerapkan; kamu tidak pernah.
- **Gerbang sumber longgar dan empat kosakata `tingkat_bukti`** (R12 §8.1): hanya cek "tidak kosong", enum bebas, ditambal di tampilan. Di METI satu enum di CHECK, nilai lain DITOLAK saat impor.
- **Filter sumber membuang "gap beralasan"** (R12 §8.2): `alasan_kosong` harus kolom resmi dengan CHECK `nilai IS NOT NULL OR alasan_kosong IS NOT NULL` (sudah di DT §3.3), jangan dibuang.
- **RLS hanya kalimat** (R12 §8.10): D1 tak punya RLS; jangan menulis komentar SQL seolah ada. Aturan lintas tabel dipegang `hak.js` dengan uji (ADR-01).
- **Tanggal palsu lolos:** `date(x) IS x` menolak `2026-02-30`; CHECK tanggal tanpa itu menerima teks apa pun.
- **Unik parsial dan COALESCE:** `ikatan_unik` dan `koreksi_terbuka_unik` memakai `COALESCE(...)`; lupa itu membuat NULL dianggap beda sehingga duplikat lolos.

## Gerbang yang menghakimi

- `tests/gerbang-migrasi.test.mjs` (statis): merah bila nomor tak urut atau lewat 0099, `CREATE` tanpa `IF NOT EXISTS`, `INSERT` data tetap tanpa `OR IGNORE`, ada `DROP`/`DELETE` data, hash berkas beku berubah.
- `tests/migrasi.test.mjs` (D1 lokal nyata): jalankan ulang tiap berkas dua kali, `sqlite_master` identik, tak ada baris ganda, `foreign_key_check` dan `integrity_check` bersih (RU §3.1).
- `tests/skema.test.mjs`: tiap CHECK/trigger/FK punya uji DITOLAK dan DITERIMA (RU §3.2); `tests/cari.test.mjs` untuk FTS5; `tests/eksplain.test.mjs` untuk indeks.
- `tests/gerbang-taksonomi.test.mjs`.test.mjs`, `tests/gerbang-test-integrasi.test.mjs` (tiap `CREATE TABLE/TRIGGER` baru wajib ada di `tests/cakupan.json`).
- Pemeriksa yang dipanggil sesudahmu: `migrasi-idempoten`; untuk tabel akun/sesi/entitas juga `security-reviewer` (KPV §10).

## Kasus

Belum ada kasus. Tambahkan lewat ilmu.mjs kasus.
- 2026-11-07 · D1 melarang PRAGMA integrity_check (SQLITE_AUTH); uji pakai foreign_key_check saja. Menghapus kolom dummy dengan regex meninggalkan koma menggantung sebelum ')' - jalankan migrasi nyata, jangan percaya baca mata.
- 2026-11-07 · DROP induk menjalankan CASCADE walau PRAGMA foreign_keys=OFF (tak berlaku dalam transaksi): bangun ulang induk WAJIB cadangkan dan bangun ulang anaknya juga (0007). Kolom baru idempoten lewat CREATE TABLE _cad AS SELECT t.*, NULL AS kolom (nama ganda jadi kolom:1, nama asli menang di rerun).
- 2026-11-07 · Bangun ulang tabel: cadangan _cad_* pakai CREATE TABLE IF NOT EXISTS (jangan DROP di awal, putus di tengah = data hilang) dan pulihkan sqlite_sequence = max(lama, kini). IF NOT EXISTS pada CREATE TABLE AS tidak meresolusi SELECT, jadi aman walau tabel asal sudah hilang.
