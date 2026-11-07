# Ilmu guard-api

> Kelas: pemeriksa · Model: haiku · Definisi: `.claude/agents/guard-api.md`
> Dibaca SEBELUM kerja (`node scripts/agents/ilmu.mjs baca guard-api`). Kasus baru
> ditambah SESUDAH kerja lewat `node scripts/agents/ilmu.mjs kasus guard-api "..."`.

## Peta berkas & tabel

Berkas yang diperiksa (read-only):

- `src/worker.js` (router objek `"METODE /path/:id"`, tabel halaman, `perlu(...)`), dan modul rute: `sesi.js`, `akun.js`, `kurasi.js`, `koreksi.js`, `riwayat.js`, `potret.js`, `direktori.js`, `status.js`.
- `src/hak.js` (hanya untuk memastikan rute memanggilnya; audit matriks ada di `hak-auditor`).
- `tests/cakupan.json` (rute baru terdaftar?) dan tabel rute DT §4.3 sebagai acuan daftar rute yang HARUS ada.

Kontrak rute (DT §4.3), himpunan peran: LOGIN = AN PG KR WL AD SA; STAF = PG KR AD SA; KURASI = KR AD SA; ADM = AD SA.

| Kelompok | Hak |
| --- | --- |
| `POST /api/masuk`, `/api/aktivasi`, `GET /api/saya`, `/api/status`, `/api/cari`, `/api/p/:slug`, `/api/potret/publik/:nama`, `/api/gambar/logo/:id` | PB |
| `POST /api/keluar`, `/api/ganti-sandi`, `PATCH /api/saya`, `/api/direktori*`, `/api/potret/anggota/:nama` | LOGIN |
| `/api/potret/pengurus/:nama`, `/api/riwayat*` (PG AD SA saja) | STAF / PG AD SA |
| `/api/kontak/:slug` | STAF + WL (hanya `prov` = `cakupan_prov`) |
| `/api/kurasi/*`, `GET/PATCH /api/koreksi` | KURASI (`GET kurasi/entitas` juga PG) |
| `/api/admin/akun*`, `/api/admin/jejak` | ADM |
| `POST /api/koreksi` | AN PG KR WL AD SA (`keluar`/`hapus-data` juga PB dengan `kontak`) |

## Aturan & invarian

1. Gerbang peran ada di BARIS PERTAMA handler, sebelum `bacaBody`, validasi masukan, D1, atau R2 (KPV §2.5, RU §2.4.1). Peran di luar himpunan: 401 (PB) atau 403, TANPA efek samping.
2. Rute tanpa pernyataan peran ditolak router saat start; rute PB harus eksplisit, bukan "lupa" (DT §4.1 butir 1).
3. Tidak ada `env.DB.prepare/batch/exec` di luar `src/hak.js` (KP D7, DT §5.7).
4. Rute tulis (POST/PATCH/DELETE): periksa CSRF (`Origin` atau `Sec-Fetch-Site`), hanya `application/json`, badan maks 64 KB, kolom di luar daftar putih `salah-masukan` (DT §4.1 butir 5 dan 6, KPV §4, §5).
5. Rute tulis publik dan sensitif memanggil `hak.sistem.lajuHit` dengan kunci hash (`ipHash` bergaram harian atau hash surel). Batas tetap: masuk 10 gagal per 15 menit per IP dan per surel; aktivasi 10 per jam per IP; koreksi 5 per jam; cari 60 per menit; riset-ai 60 per jam; impor 10 per jam (DT §4.3, RU §2.4.4 R7).
6. Tanpa tulis lewat GET: jumlah baris semua tabel sama sebelum dan sesudah (RU §2.4.5 butir 3).
7. Respons tidak boleh memuat `garam`, `sandi`, `iterasi`, `aktivasi_hash`, `aktivasi_sampai`, `sesi.id_hash`; `koreksi.pengaju_kontak` hanya untuk KR AD SA; `riwayat.oleh` mentah tidak keluar, hanya boolean `milik` (DT §4.3, §5.5).
8. Galat hanya `{galat, kode}` dari 10 kode tetap: belum-masuk 401, dilarang 403, tidak-ada 404, metode 405, salah-masukan 422, terlalu-sering 429, sumber-wajib 422, konflik 409, terlalu-besar 413, layanan 502. Tanpa jejak tumpukan atau pesan SQL/trigger mentah (DT §4.1 butir 3 dan 4).
9. Respons berautentikasi `Cache-Control: private, no-store` + `Vary: Cookie`; `cacheTepi` hanya lapis publik (DT §4.1 butir 7). Sesi dicek sebelum cache (`/api/direktori/karya`).
10. Parameter `ke` hanya jalur relatif (tolak `//`, `/\`, `javascript:`, URL absolut); `id` `^\d{1,12}$`, slug `^[a-z0-9-]{2,60}$`, nama potret `^[a-z0-9_-]{1,80}$`, `A\d{4,12}`/`W\d{4,12}` untuk OpenAlex; paginasi maks 50.
11. Rute baru terdaftar di `tests/cakupan.json`. Rute F3 (`/api/klaim`, `/api/daftar`, `/api/terbuka`, `/api/cocok`) tidak boleh ada sebelum KP C-01 dan C-09 dijawab.
12. Ragu publik atau internal: tanya, jangan tebak.

## Ranjau yang pernah meledak

- **Puluhan rute hanya `if (!user)`** (R11 §2.3, audit 25 Jul 2026): pendaftaran terbuka memberi sesi sah tanpa jadi staf. Tahu: panggil tiap rute dengan tiap peran (RU §2.4.1).
- **Pemindai kata `requireStaff` bukan bukti** (R11 §2.4): nama muncul di berkas tidak berarti menolak. Periksa PERILAKU, bukan nama; lihat uji `rute-peran.test.mjs`.
- **Rute tulis untuk peran baca-saja** (R11 §2.5): ~63 rute tulis lolos karena bendera di pemanggil. Di METI metode ada di router; periksa semua non-GET.
- **Tabel laju ada tapi tak dipanggil** (R11 §2.10): cari rute publik tulis tanpa `lajuHit`.
- **CSRF cuma SameSite=Lax** (R10 §2.2): wajib `tolakOrigin`; `Origin` kosong/`null` ditolak kecuali `Sec-Fetch-Site: same-origin`.
- **Fail-open Turnstile** (R10 §8 butir 12, F3).
- **Kunci `x-forwarded-for` untuk laju** (R11 §2.10): pakai `CF-Connecting-IP`.
- **Formulir tiruan tidak menulis** (R12 §8.11): tiap formulir menulis dan mengembalikan rujukan.
- **Hotlink logo** (R10 §8 butir 13) dan SVG diterima: tolak ekstensi `svg`.
- **Respons galat 500 kosong / pesan SQL bocor** (R11 §2.11).

## Gerbang yang menghakimi

- `tests/gerbang-rute.test.mjs`: rute tanpa pernyataan peran, rute DT §4.3 belum ada, tulis lewat GET.
- `tests/rute-peran.test.mjs`: 7 peran x semua rute, ditolak sebelum validasi atau sentuhan D1/R2.
- `tests/gerbang-d1.test.mjs`: akses D1 di luar `hak.js`. `tests/sesi.test.mjs` (CSRF, laju, cache, redirect). `tests/rute/*.test.mjs`. `tests/gerbang-test-integrasi.test.mjs` (cakupan.json).
- Temuan peran/matriks: rujuk `hak-auditor`. Temuan sesi, sandi, header, XSS: rujuk `security-reviewer`. Query berat: `perf-reviewer`.

## Kasus

Belum ada kasus. Tambahkan lewat ilmu.mjs kasus.
