# Ilmu perf-reviewer

> Kelas: pemeriksa · Model: sonnet · Definisi: `.claude/agents/perf-reviewer.md`
> Dibaca SEBELUM kerja (`node scripts/agents/ilmu.mjs baca perf-reviewer`). Kasus baru
> ditambah SESUDAH kerja lewat `node scripts/agents/ilmu.mjs kasus perf-reviewer "..."`.

## Peta berkas & tabel

Berkas yang diperiksa (read-only, tidak menambah cache sendiri):

- Rute dan akses data: `src/worker.js`, `src/hak.js` (`baca`, LIMIT, `TABEL_BACA`), `src/potret.js`, `src/direktori.js`, `src/kurasi.js`, `src/sesi.js`, `src/sapu.js`, `src/util.js` (`cacheTepi`).
- Kueri: `migrations/*.sql` untuk indeks (`akun_peran`, `sesi_akun`, `sesi_sampai`, `entitas_jenis`, `entitas_sensus`, `entitas_prov`, `fakta_entitas`, `ikatan_dari`, `ikatan_ke`, `alias_norm`, `jejak_kapan`, `koreksi_status`, `riwayat_target`, `laju_jendela`) dan FTS5 `entitas_cari`.
- Potret dan pipeline: `scripts/direktori/potret.mjs`, `jaga_unggah.mjs`, `.github/workflows/potret.yml`, ukuran berkas di R2 `potret/{publik,anggota,pengurus}/`.
- Layar yang memuat JSON besar: `public/*.js` (memuat malas MapLibre/graf), `public/_headers` (cache).
- Pembatas platform Free: D1 baca 5 juta baris/hari dan tulis 100.000/hari; Worker CPU 10 ms, 100.000 permintaan/hari, 50 subrequest, memori 128 MB; R2 10 juta Class B/bulan (sekitar 330 ribu/hari); 5 cron (terpakai 4).

## Aturan & invarian

1. **Layar publik tidak memicu SELECT D1**; membaca potret R2 dengan cache tepi (KP D2, KPV §2.8, DT §1 prinsip 1).
2. **Anggaran per rute** (DT §8.2, target bukan hasil ukur): potret publik 0 baris D1 dan 1 operasi R2, CPU < 1 ms; `GET /api/p/:slug` 0 baris, 1 sampai 3 R2, < 3 ms; `/api/saya` paling banyak 2 baris (indeks `sesi.id_hash` + join `akun`); `/api/cari` maks 20 hasil + indeks FTS, < 3 ms, ketik-cepat memakai `cari.json`; `/api/kurasi/*` maks 50 baris; `/api/kurasi/impor` maks 200 baris tulis, < 8 ms.
3. **Tanpa `COUNT(*)` tak terbatas**; paginasi maks 50 baris (`?hal`, `?n` dipotong); keyset `WHERE id > ?` dengan pemecah seri bila perlu. Semua kueri berindeks (`EXPLAIN QUERY PLAN`, RU §3.5); tanpa `SELECT *`; tanpa N+1 di rute.
4. **Tidak ada pekerjaan berat di Worker**: `graf`, `skor`, `kuadran`, `hitungKeyakinan`, `hubung`, `potret` tidak diimpor dari `src/**` (RU §2.6 butir 2). Hitungan berat dikerjakan pipeline.
5. **Potret dialirkan** (`new Response(obj.body)`), tidak di-`JSON.parse`; satu berkas maks 2 MB (batas keras `jaga_unggah`); lunak: beranda tidak lebih dari 600 KB gzip dan 8 berkas (RU §2.6 butir 3). Lebih besar dipecah per provinsi/sektor.
6. **Hash sandi hanya di jalur login** (PBKDF2 210.000 iterasi bisa melewati 10 ms di Free; ADR-04: ukur `wrangler tail`, bila lewat pindah Workers Paid sebelum rilis). Batas laju melindungi CPU.
7. **Cache tepi**: lapis publik `public, max-age=300`, `cerita_*` immutable, aset `?v=` immutable, respons berautentikasi `private, no-store`; karya OpenAlex 1 hari; riset 30 hari (gagal AI tidak dicache).
8. **Manifest terakhir**: unggah semua berkas, lalu `manifest.json`; layar memakai `?v=<versi>`.
9. **Potret membawa `dibangun_pada`**; setelah koreksi massal atau migrasi data, pipeline potret dijalankan ulang (R11 §3.12).
10. **Sapu cron** satu `DELETE` per tabel (sesi, laju > 1 hari, aktivasi kedaluwarsa); satu cron; tulis D1 hampir seluruhnya milik manusia (ADR-08).
11. **R2**: tampilan peta/sensus memuat sekitar 4 sampai 8 berkas; hitung terhadap anggaran Class B bulanan (JM-H04).
12. **INP**: MapLibre dan pustaka graf dimuat malas saat tab dibuka; pencarian dengan debounce 150 sampai 250 ms + `AbortController` (R12 §8.8). Soal klik membekukan layar milik `inp-reviewer`; kamu hanya lapor.
13. `run_worker_first` hanya rute yang perlu (`/api/*`, `/direktori`, `/admin`, `/p/*`, `/wilayah/*`); aset statis tidak membayar permintaan Worker (DT §8.6, R10 §1.3).

## Ranjau yang pernah meledak

- **Kuota baca D1 Free menjatuhkan situs asal** (KP D2, KPV §2.8, R1 §8 butir 11). Sebab: layar membaca D1 per kunjungan. Akibat: situs mati sampai reset harian. Tahu: `performa.test.mjs` mencatat `meta.rows_read` per rute.
- **Batas respons memotong diam-diam** (R11 §3.1): 1000 baris tanpa galat, halaman terpotong. Padanan D1: batas parameter terikat per kueri `[verifikasi di dokumentasi Cloudflare]` dan plafon helper.
- **`IN (...)` dengan null / daftar panjang** (R11 §3.2): satu helper yang membuang null dan memecah.
- **Audit log banjir** (R11 §2.16): 290 ribu baris dalam satu sore, IO habis, 70 sampai 95 persen 5xx. D1 menagih per baris ditulis: jangan jejak tulisan pipeline massal.
- **Kapasitas DB tak diproyeksikan** (R11 §5.6): tabel besar tanpa indeks `WHERE` hak, 293 policy tanpa `(SELECT ...)`. Proyeksikan pada skala sensus penuh.
- **Cron di luar anggaran** (R10 §1.6): akun Free maks 5 jadwal; gerbang jumlah cron.
- **Aset 898 KB monolit, `akademisi.js` 658 KB, `en.json` 965 KB** (R10 §8 butir 3). Pecah; `direktori.js` 3.961 baris hasil port masih besar.
- **Cache GitHub sebagai tempat data produksi** (R10 §8 butir 10): data ke R2.
- **Penyaringan tiap ketukan tanpa debounce, graf render ulang sinkron** (R12 §8.8): indeks 400 entri terasa baik, skala METI tidak.
- **Potret lama berbohong** (R11 §3.12) dan **penarik menimpa data bagus dengan kosong** (R12 §8.4): `jaga_unggah` susut > 20 persen menahan.
- **Pemanen di depan DB sakit** (R11 §3.11): backoff, bukan memecah batch.

## Gerbang yang menghakimi

- `tests/performa.test.mjs`: baris D1 dan operasi R2 per rute di atas batas DT §8.2 merah; harness membungkus `env.DB`/`env.BERKAS` di dalam uji.
- `tests/eksplain.test.mjs`: kueri utama harus memakai indeks (`EXPLAIN QUERY PLAN`).
- Gerbang statis impor `hubung`, `potret`, `hitungKeyakinan` dari `src/**`.
- `scripts/direktori/jaga_unggah.mjs`: berkas > 2 MB, susut > 20 persen menolak unggah.
- `tests/gerbang-workflow.test.mjs`: jumlah cron > 5.
- Ukur CPU nyata: `scripts/mesin/ukur-cpu.mjs` oleh pemilik (`wrangler tail`, 30 tembakan per rute) ke `PENYELARASAN.md`. Miniflare tidak menegakkan 10 ms.
- Pasangan: `worker` (pembetul), `inp-reviewer` (interaksi layar), `security-reviewer` (bila cache menyangkut autentikasi).

## Kasus

Belum ada kasus. Tambahkan lewat ilmu.mjs kasus.
