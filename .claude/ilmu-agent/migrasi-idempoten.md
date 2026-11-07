# Ilmu migrasi-idempoten

> Kelas: pemeriksa · Model: haiku · Definisi: `.claude/agents/migrasi-idempoten.md`
> Dibaca SEBELUM kerja (`node scripts/agents/ilmu.mjs baca migrasi-idempoten`). Kasus baru
> ditambah SESUDAH kerja lewat `node scripts/agents/ilmu.mjs kasus migrasi-idempoten "..."`.

## Peta berkas & tabel

Berkas yang kamu periksa: `migrations/*.sql` yang dibuat atau diubah (read-only; lapor, jangan sunting). Pembanding: `git diff main -- migrations/`, `tests/fixtures/migrasi-beku.json`, `public/taksonomi.js`.

Skema acuan (DT §3), enam berkas awal:

- `0001_akun.sql`: `akun`, `sesi`, dua trigger penjaga super terakhir.
- `0002_jejak.sql`: `jejak` + `jejak_tanpa_ubah`, `jejak_tanpa_hapus`.
- `0003_entitas.sql`: `sumber`, `entitas`, `label`, `alias`, `fakta`, `pasangan_ikatan`, `ikatan`, FTS5 `entitas_cari`, trigger sinkron FTS, trigger kunci tetap, gabung tanpa rantai, pasangan ikatan.
- `0004_koreksi.sql`, `0005_riwayat.sql`, `0006_laju.sql`.

Kolom yang harus kamu lihat ada dan tak longgar: `sumber_id NOT NULL REFERENCES sumber(id)` pada `entitas`, `fakta`, `ikatan`; `tingkat_bukti NOT NULL CHECK (... 4 nilai)`; `per_tanggal`/`diperiksa` bertanggal `date(x) IS x`; `url` bersyarat GLOB `https://*`.

## Aturan & invarian

Daftar periksa, urut, tiap butir lapor LOLOS atau TEMUAN dengan berkas:baris:

1. **IF NOT EXISTS** pada setiap `CREATE TABLE`, `CREATE INDEX`, `CREATE UNIQUE INDEX`, `CREATE TRIGGER`, `CREATE VIRTUAL TABLE` (DT §3 gaya; RU §1.4 `gerbang-migrasi`).
2. **Data tetap** (`INSERT` ke `pasangan_ikatan` dan sejenis) memakai `INSERT OR IGNORE` agar putaran kedua tidak melipat baris (RU §3.1 butir 2).
3. **Berkas lama tidak berubah:** bandingkan dengan `git diff main`. Ubahan pada berkas yang sudah ada di `main` = TEMUAN kritis, kecuali berkas itu belum pernah diterapkan dan pemilik menyatakannya (DT §3.7 butir 2; TIKET §0). Berkas beku dicocokkan hash di `migrasi-beku.json`.
4. **Penomoran:** `0001..0099` berurutan, tanpa lubang, tanpa ganda, tanpa nama berspasi atau berakhiran ` 2` (salinan nyasar, R10 §8 butir 8). `laju` ada di `0006`, bukan `0001`.
5. **Sumber wajib:** `sumber_id`/`sumber_url`, `tanggal_periksa` (`per_tanggal`/`diperiksa`), `tingkat_bukti` ada dengan `NOT NULL` dan CHECK; tidak ada perubahan yang membuatnya nullable (KP D5).
6. **Jejak append-only:** trigger `BEFORE UPDATE` dan `BEFORE DELETE` yang `RAISE(ABORT, ...)` pada `jejak`. Tidak ada `INSERT OR REPLACE` atas `jejak` (R10 §3.5).
7. **Kolom terlarang:** tidak ada kolom NIK, alamat rumah, tanggal lahir, agama, status kawin, biometrik, foto wajah (KPV §3.1). Kolom sandi/garam/aktivasi hanya di `akun`.
8. **Tanpa `DROP TABLE`, `ALTER ... DROP COLUMN`, `DELETE` massal** tanpa alasan tertulis di komentar berkas (DT §3.7). `DROP TRIGGER IF EXISTS` sebelum CREATE ditemukan di agent lama; DT memakai `CREATE TRIGGER IF NOT EXISTS`, jadi `DROP TRIGGER` baru pun dicatat sebagai TEMUAN ringan untuk dikonfirmasi.
10. **Enum sama dengan `public/taksonomi.js`** (sektor, kategori, jenis, rantai, peran, aksi jejak, aksi laju, tingkat bukti, jenis sumber). Beda satu nilai = TEMUAN.
11. **Satu pernyataan per titik koma yang utuh:** trigger `BEGIN ... END;` tidak terpotong; `wrangler d1 execute --file` gagal bila trigger terpecah.
12. **Tidak ada klaim RLS di komentar SQL** (D1 tak punya RLS; ADR-01).

## Ranjau yang pernah meledak

- **Penomoran ganda dan salinan Finder** (R10 §8 butir 8; R11 §8.3 menyebut kelas `* 2.*`): urutan terapan tak pasti, gerbang ikut teracuni. Cara tahu: `ls migrations | grep -E ' |\.rej|_2'`.
- **Stempel migrasi bentrok** dan `create or replace` atas salinan usang (R11 §8.13): periksa bahwa nomor baru = nomor tertinggi + 1 pada cabang kerja.
- **Migrasi membetulkan DATA tanpa menyegarkan rekap/potret** (R11 §3.12): bila migrasi memuat `UPDATE` data, tulis TEMUAN "potret wajib dibangun ulang".
- **Enum bebas di tampilan** (R12 §8.1): empat kosakata `tingkat_bukti` ditambal saat tampil. Periksa bahwa CHECK menolak nilai di luar empat nilai.
- **Tanggal tanpa pemeriksaan bentuk** (R12 §8.3): CHECK `date(x) IS x`, bukan `length(x) = 10`.
- **`no such table` tersebar di tiap modul** (R10 §1.9): bukan tugasmu menambalnya, tetapi laporkan bila migrasi baru bergantung tabel yang belum dibuat berkas sebelumnya.
- **Jejak dapat diubah** karena trigger hanya `BEFORE DELETE` tanpa `BEFORE UPDATE`: selalu periksa keduanya.

## Gerbang yang menghakimi

- `tests/gerbang-migrasi.test.mjs` adalah versi mesin dari daftar di atas (butir 1 sampai 4, 8). Bila kamu menemukan pelanggaran yang tidak ditangkap gerbang ini, tulis sebagai kasus agar `penulis-gerbang` memperkuatnya (aturan tanpa gerbang mesin = belum jadi).
- `tests/migrasi.test.mjs`: putaran ulang dua kali, `sqlite_master` identik, `foreign_key_check`/`integrity_check` bersih (RU §3.1). Kamu tidak menjalankan migrasi ke remote; `--local` dan hanya bila diminta.
- `tests/skema.test.mjs`: tiap CHECK/trigger baru wajib punya baris uji DITOLAK dan DITERIMA (RU §3.2); `tests/gerbang-taksonomi.test.mjs` untuk butir 10.
- `tests/gerbang-test-integrasi.test.mjs`: tabel atau trigger baru tanpa entri di `tests/cakupan.json` = merah; sebut dalam laporan.
- Bentuk laporan: satu baris per butir daftar, vonis `bersih` atau `temuan`, lalu catat lewat `ilmu.mjs catat migrasi-idempoten <berkas> <bersih|temuan> "..."`. Tingkat keparahan: kritis (berkas lama diubah, sumber nullable, kolom terlarang), tinggi (tanpa IF NOT EXISTS, jejak bisa diubah), ringan (gaya).

## Kasus

Belum ada kasus. Tambahkan lewat ilmu.mjs kasus.
- 2026-11-07 · Rebuild tabel SQLite via CREATE _cad AS SELECT: (1) DROP TABLE IF EXISTS _cad_x di awal menghapus cadangan yang tinggal satu-satunya bila berkas putus setelah DROP induk lalu dijalankan ulang; cara tahu: putuskan berkas di antara DROP akun dan CREATE akun, jalankan ulang, cek _cad_akun. (2) DROP TABLE + INSERT id eksplisit mereset sqlite_sequence ke max(id) (AUTOINCREMENT); cara tahu: bandingkan sqlite_sequence sebelum dan sesudah.
- 2026-11-07 · Cadangan yang dibuat sekali (IF NOT EXISTS) aman terhadap putus, tetapi basi bila tabel asal masih bisa ditulis selama jeda: rerun menimpa tulisan jeda dengan cadangan lama. Cara tahu: putuskan setelah DROP tabel pertama tetapi sebelum DROP induk, tulis baris lewat tabel yang masih ada, jalankan ulang, cek baris itu.
