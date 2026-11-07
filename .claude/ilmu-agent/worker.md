# Ilmu worker

> Kelas: pengerja · Model: sonnet · Definisi: `.claude/agents/worker.md`
> Dibaca SEBELUM kerja (`node scripts/agents/ilmu.mjs baca worker`). Kasus baru
> ditambah SESUDAH kerja lewat `node scripts/agents/ilmu.mjs kasus worker "..."`.

## Peta berkas & tabel

Wilayah: `src/**` (DT §2.3). Satu Worker, router objek, satu cron `0 18 * * *` (DT §1, §8.6).

| Berkas | Isi | Tiket |
| --- | --- | --- |
| `src/util.js` | `json`, `gagal`, `bacaBody`, `cacheTepi`, `ipHash`, `acak`, `sha`, `RE_EMAIL` | JM-A04 |
| `src/worker.js` | router objek `"METODE /path/:id"`, tabel halaman, pengalih `/masuk?ke=`, `perlu(req, env, himpunan)` | JM-A05 |
| `src/hak.js` | SATU-SATUNYA pintu D1: `MATRIKS` (16 jenis x 7 peran = 112 sel), `KLAUSA`, `boleh`, `baca`, `tulis`, `sistem.*` | JM-B04 |
| `src/sandi.js` | `hashSandi`, `cocokSandi` (PBKDF2-SHA256) | JM-B02 |
| `src/sesi.js` | `/api/masuk`, `/api/keluar`, `/api/saya`, cookie, CSRF | JM-B03 |
| `src/akun.js` | `/api/admin/akun*`, aktivasi, ganti sandi, jejak | JM-B05, JM-B07 |
| `src/kurasi.js` | entitas, fakta, ikatan, sumber, impor, gabung, hapus-permanen | JM-D01, JM-E06 |
| `src/koreksi.js`, `riwayat.js` | koreksi, riwayat | JM-E06, JM-F09 |
| `src/potret.js` | `bacaPotret(env, akun, lapis, nama)`, gabung profil per lapis | JM-D12 |
| `src/direktori.js` | `RUTE_DIREKTORI` (port akademisi): karya, riset, gambar, terdekat, ringkasan | JM-C04 |
| `src/status.js`, `sapu.js` | `/api/status`, handler `scheduled` | H04, B03 |

Tabel D1 (migrasi di luar wilayahmu, kamu hanya memakainya lewat `hak.js`): `akun` (peran CHECK 6 nilai, `cakupan_prov` wajib bila `wilayah`, kolom rahasia `garam`, `sandi`, `iterasi`, `aktivasi_hash`, `aktivasi_sampai`), `sesi` (hanya `id_hash`), `jejak` (append-only lewat trigger), `entitas` (`kunci`, `slug`, `lapis`, `tampil`, `sumber_id` NOT NULL), `fakta`, `ikatan`, `sumber`, `koreksi`, `riwayat`, `laju` (UPSERT). Trigger penting: `akun_super_terakhir_ubah/hapus`, `jejak_tanpa_ubah/hapus`, `riwayat_target_sah`.

## Aturan & invarian

1. **Satu pintu D1.** `env.DB`, `.prepare(`, `.batch(`, `.exec(` hanya di `src/hak.js` (KP D7, KPV §2.1, DT §5). Login memakai `hak.sistem.*` dengan pernyataan tetap.
2. **Layar membaca potret R2; D1 hanya tulis dan hak** (KP D2, DT §1 prinsip 1). Pipeline tidak pernah menulis D1 (ADR-08).
3. **Gerbang peran di BARIS PERTAMA handler** sebelum baca body atau sentuh D1/R2. 401 untuk PB di rute terkunci, 403 peran lain (DT §4.1 butir 2, KPV §2.5). Sesi tak sah, akun nonaktif, peran tak dikenal = PB.
4. **Daftar putih.** Nama tabel/kolom dari objek tetap (`KOLOM_BACA`, `KOLOM_TULIS`), nilai selalu `.bind()`, tanpa sambung string (KPV §2.3). `id` `^\d{1,12}$`, nama potret `^[a-z0-9_-]{1,80}$`, badan maks 64 KB, hanya `application/json` (DT §4.1 butir 5).
5. **Tiap tulis D1 = `batch([tulis, jejak])`** satu transaksi. `dari`/`ke` jejak tanpa kolom rahasia; entitas `orang` hanya nama kolom (DT §3.2, §5.4).
6. **Fakta/ikatan tanpa `sumber` = `422 sumber-wajib` untuk semua peran, termasuk SA** (KP D5, KPV §1 butir 1). `kunci`/`slug` dihitung server, tidak diterima dari klien.
7. **Akun.** Admin tidak menetapkan/mengubah `super`, tidak mengubah perannya sendiri; SA terakhir dilindungi (rute dan trigger). Nonaktifkan = cabut semua sesi (KPV §4).
8. **Sesi.** Token 32 byte acak, D1 simpan SHA-256-nya, cookie `HttpOnly; Secure; SameSite=Lax; Path=/` 14 hari; CSRF: `Origin`/`Sec-Fetch-Site` pada POST/PATCH/DELETE; tanpa tulis lewat GET. Respons masuk seragam, PBKDF2 tetap dihitung untuk surel tak dikenal.
9. **Cache.** Respons berautentikasi `private, no-store` + `Vary: Cookie`; `cacheTepi` hanya lapis publik, kunci tanpa cookie. Sesi dicek SEBELUM cache (DT §4.3 karya).
10. **Potret** dialirkan (`new Response(obj.body)`), tidak di-`JSON.parse` (CPU 10 ms). Peran diperiksa sebelum R2 dibaca.
11. Rute baru wajib terdaftar di `tests/cakupan.json`; `kode` galat hanya dari katalog 10 kode DT §4.1 butir 4; tanpa jejak tumpukan ke klien.
12. Data terlarang (alamat rumah, NIK, tanggal lahir, agama, status kawin, biometrik) tidak punya kolom dan ditolak rute mana pun (KPV §1 butir 3).

## Ranjau yang pernah meledak

- **Sandi `sha256(garam+sandi)` dan `===`** (R10 §8 butir 1). Sebab: sandi pilihan manusia, bukan acak. Akibat: dibobol brute force offline. Tahu: `tests/sandi.test.mjs` S2 dan S6.
- **Peran kasar + atribut sempit = gerbang buta** (R11 §2.6, K-1). Sebab: cakupan tidak ikut keluar dari gerbang. Akibat: kursi provinsi bisa semua. Tahu: sel `B prov` WL tanpa cakupan harus 0 baris (RU §2.2).
- **"Punya peran" dianggap izin baca** (R11 §2.8, K-3). Akibat: ribuan akun anggota membaca tabel sensitif. Tahu: sel `-` ditolak dari 8 aksi.
- **Pembatas laju baca-lalu-tulis tidak atomik** (R10 §2.5). Sebab: dua langkah. Tahu: R5 di `sesi.test.mjs`, 20 `lajuHit` paralel harus tepat 20. Dan tabel laju pernah ada tanpa dipakai (R11 §2.10): rute tulis publik wajib memanggil `lajuHit`.
- **Fail-open Turnstile bila kunci kosong** (R10 §8 butir 12). Di METI fail-closed di produksi (F3).
- **Perbandingan secret `!==`** (R11 §8.8). Pakai `timingSafeEqual`.
- **Gerbang hanya `if (!user)`** (R11 §2.3). Sesi valid harus dipetakan ke baris `akun` aktif berperan.
- **Fail-open pada sesi `tak-terbaca`** (R11 §8.7): jangan; error baca sesi = PB.
- **Audit log membengkak** (R11 §2.16): jejak hanya tulisan manusia; impor massal satu entri `impor` per panggilan.
- **Handler tanpa pembungkus galat** (R11 §2.11): satu `try/catch` di router, balasan `{galat, kode}`.
- **Logo hotlink** (R10 §8 butir 13): `/api/gambar/logo/:id` dari R2, SVG ditolak.
- **Hal di pangantara/neraca**: RLS cuma prosa tanpa gerbang (R12 §8.10); formulir tiruan yang tidak menulis (R12 §8.11).

## Gerbang yang menghakimi

- `tests/gerbang-d1.test.mjs` merah bila `env.DB`/`.prepare(`/`.batch(`/`.exec(` di luar `hak.js`.
- `tests/gerbang-r2.test.mjs`: `env.BERKAS` hanya di `potret.js`, `direktori.js`, `kurasi.js`.
- `tests/gerbang-rute.test.mjs`: rute `/api/*` tanpa pernyataan peran; rute DT §4.3 belum ada; tulis lewat GET.
- `tests/hak.test.mjs` (112 sel, D1 lokal nyata), `gerbang-matriks-sinkron`, `gerbang-matriks`.
- `tests/rute-peran.test.mjs`, `sesi.test.mjs`, `sandi.test.mjs` (di workerd), `akun.test.mjs`, `tests/rute/*.test.mjs`.
- `gerbang-test-integrasi` (cakupan.json), `gerbang-ilmu-agent` (satu pemilik per berkas).
- Pemeriksa yang dipanggil orkestrator sesudahmu: `guard-api`, `security-reviewer` (hak/sesi/sandi/rute), `hak-auditor` (hak.js/matriks), `perf-reviewer` (query/rute baru).

## Kasus

Belum ada kasus. Tambahkan lewat ilmu.mjs kasus.
- 2026-11-07 · workerd lokal (wrangler 4.158) menerima PBKDF2 210000 dan 600000; batas produksi diyakini 100000 dan tak bisa diuji lokal, jadi sandi.js turun otomatis ke 100000 saat NotSupportedError dan akun menyimpan iterasi sebenarnya. D1.exec memecah per baris: migrasi uji dipecah sendiri (tests/_bantu.mjs). hak.ubahSandi mereset wajib_ganti dan mencabut semua sesi, jadi tak cocok untuk rehash saat masuk.
- 2026-11-07 · jejak.aksi CHECK (0002) tidak memuat 'baca': rute baca data pribadi (anggota-meti) belum bisa dijejak sampai migrasi menambah aksi; jangan pakai jejakTulis 'baca' (CHECK gagal).
- 2026-11-07 · Anggota METI kini dasar R2 + log D1 anggota_ubah (migrasi 0009), digabung di GET; baris dasar tanpa id diberi b<indeks> (bergeser bila pipa membangun ulang). Tulis lewat hak.anggotaCatat (batch log+jejak). Uji: tests/anggota-ubah.test.mjs
- 2026-11-07 · Tabel koreksi sudah ada di 0004 (skema lain), jadi usulan publik 0010 bernama koreksi_usul. sendBeacon tak bisa pasang x-pb: /api/statistik dikecualikan dari csrfSah dan diperiksa asalSama di worker.js. jejak.aksi CHECK: putus koreksi = 'tinjau', konten = 'ubah'.
