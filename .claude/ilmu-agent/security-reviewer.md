# Ilmu security-reviewer

> Kelas: pemeriksa · Model: sonnet · Definisi: `.claude/agents/security-reviewer.md`
> Dibaca SEBELUM kerja (`node scripts/agents/ilmu.mjs baca security-reviewer`). Kasus baru
> ditambah SESUDAH kerja lewat `node scripts/agents/ilmu.mjs kasus security-reviewer "..."`.

## Peta berkas & tabel

Berkas yang diperiksa (read-only, lapor tanpa auto-fix):

- `src/hak.js`, `src/sesi.js`, `src/sandi.js`, `src/akun.js`, `src/potret.js`, `src/direktori.js`, rute `/api/*` di `src/**`.
- `public/_headers`, `public/robots.txt`, HTML/JS yang menyisipkan data luar (`innerHTML`, `esc()`), halaman terkunci (`direktori`, `admin`, `masuk`, `aktivasi`).
- `scripts/direktori/potret.mjs`, `jaga_unggah.mjs`, `scripts/panen/*.py` (panen), `data/daftar-tolak.json` tidak ada di repo (privat R2 `privat/daftar-tolak.json`).
- `wrangler.jsonc`, `.gitignore`, `.dev.vars.example`, `.github/workflows/*.yml`.
- Tabel: `akun` (`garam` 32 heks, `sandi` 64 heks, `iterasi >= 100000`, `aktivasi_hash`, `aktivasi_sampai`), `sesi` (`id_hash` 64), `laju`, `jejak`, `koreksi.pengaju_kontak`, `entitas.tampil/lapis`.

## Aturan & invarian

1. **Sandi** PBKDF2-SHA256 WebCrypto, 210.000 iterasi (atau batas workerd yang terbukti, catat di KPV §4/ADR-04), garam 16 byte per akun, kolom `iterasi` per akun, perbandingan waktu tetap, bukan SHA-256 tunggal. Kebijakan 12 sampai 128 karakter, tidak sama dengan surel (KPV §4, DT §8.1).
2. **Sesi** token 32 byte acak, D1 hanya hash SHA-256, cookie `HttpOnly; Secure; SameSite=Lax; Path=/` 14 hari; keluar menghapus baris; nonaktif/ganti sandi mencabut sesi.
3. **CSRF** `SameSite=Lax` DITAMBAH pemeriksaan `Origin`/`Sec-Fetch-Site` pada POST/PATCH/DELETE; hanya `application/json`; tanpa tulis lewat GET.
4. **Batas laju** login 10 gagal per 15 menit per IP dan per surel; IP disimpan `ipHash` bergaram harian; respons masuk seragam dan PBKDF2 tetap dihitung untuk surel tak dikenal.
5. **Aktivasi/reset** tautan sekali pakai 72 jam, hash di D1, tampil SEKALI ke Admin, tidak dicatat di log. Parameter `ke` hanya jalur relatif.
6. **CSP** sesuai KPV §8: `script-src 'self' https://cdnjs.cloudflare.com`, tanpa `'unsafe-inline'` pada `script-src`, tanpa `*`, `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'none'`. Tanpa skrip inline dan atribut `style=`/`onclick=`. MapLibre 4.7.1 hanya dari cdnjs ber-SRI sha384 + `crossorigin`. Menambah sumber luar mengubah `_headers` dan gerbangnya. `noindex` + `no-store` di `/direktori`, `/admin`, `/masuk`, `/aktivasi`.
7. **XSS** semua teks data lewat `esc()` sebelum `innerHTML`; `sumber_url` hanya `https:`/`http:` (tolak `javascript:`, `data:`, `blob:`); tautan luar `rel="noopener noreferrer"`.
8. **Gambar** hanya PNG/JPEG/WebP (SVG ditolak), cek magic bytes, maks 512 KB, nama = hash dari server, `nosniff`, tanpa hotlink.
9. **Potret per lapis** berkas lapis tinggi tidak dirujuk dari lapis rendah; peran dicek sebelum R2 dibaca; nama R2 dari regex `^[a-z0-9_-]{1,80}$`; lapis non-publik `private, no-store`; lapis publik/anggota dipindai pola surel, telepon, kolom terlarang.
10. **Data pribadi** (surel, telepon, alamat rumah) tak pernah di lapis Publik, repo, `public/`, log, atau galat. Data terlarang tak punya kolom. Orang tampil publik hanya `tampil = 1`. Daftar tolak (KP D14) privat, tak pernah di potret, impor menolaknya.
11. **Rahasia** hanya `wrangler secret put` / Actions secrets; `wrangler.jsonc` id kosong; `.gitignore` memuat `.dev.vars`, `.wrangler/`, `*.sqlite`, `data/pribadi/`, `daftar-tolak.json`, `*.env`; `uji.yml` tanpa `pull_request_target`/`secrets.`, `permissions: contents: read`. Kunci pernah bocor = diputar.
12. **Panen** baca `robots.txt`, UA jujur berkontak METI, jeda >= 2 dtk, stdlib saja, tanpa CAPTCHA/WAF bypass. Panen terbatas 1001startup.id sesuai KP D15/R13 (UA jujur, atribusi, tanpa teks/EST/logo); KPV §6 dan ADR-06 masih menulis TIDAK ada panen otomatis: bila bertentangan, KP menang, lapor ke orkestrator.
13. **Workers AI** hanya teks abstrak publik; abstrak sumber luar diperlakukan tak tepercaya; keluaran tidak menulis fakta otomatis (KPV §3.6 butir 5, R11 §2.17).
14. **Admin tidak naik ke super**; super terakhir dilindungi (KPV §4).

## Ranjau yang pernah meledak

- **`sha256(garam+sandi)` dan `===`** (R10 §8 butir 1, R11 §8.8). Akibat: brute force offline, timing leak. Tahu: S1 sampai S6 di `sandi.test.mjs`.
- **CSP dengan `'unsafe-inline'`** (R10 §8 butir 2): skrip inline di `index.html`. Tahu: `gerbang-headers`.
- **CSP tidak ada / empat direktif saja** (R12 §2.2, R11 §8.7); `esc()` hanya kebiasaan, 30 titik `innerHTML` tanpa penjaga (R12 §2.1, §8.7). Pakai tagged template/uji statis.
- **MapLibre cdnjs tanpa SRI** padahal ada vendor (R10 §8 butir 14).
- **Hotlink logo** (R10 §8 butir 13): melacak pengunjung, rusak sewaktu-waktu.
- **Fail-open Turnstile** (R10 §8 butir 12).
- **Email pribadi dan `database_id` di `wrangler.jsonc`** (R10 §2.11, §8 butir 11): bukan di repo.
- **Salinan pribadi/confidential di repo** (R12 §2.6; R11 §8.9 nama dan nomor telepon di runbook; R11 §8.10 cermin data produksi ke artifact CI).
- **Cache menyajikan respons berautentikasi** (KPV §2.7): kunci tanpa cookie; uji AN lalu PB.
- **Sesi `tak-terbaca` fail-open** (R11 §8.7). **Audit log banjir** (R11 §2.16).
- **Staging berbagi D1/R2 produksi** (R10 §8 butir 5).
- **Kunci terikat salah, pengalihan terbuka via `ke`**: korpus `//evil.com`, `/\evil.com`, `%2F%2F` (RU §2.4.5).

## Gerbang yang menghakimi

- `tests/sandi.test.mjs` (di workerd; S1 merah bila 210.000 ditolak runtime), `sesi.test.mjs` (T1-T9, R1-R8, CSRF, redirect, cache), `akun.test.mjs`, `hak.test.mjs`, `gerbang-d1`.
- `tests/gerbang-headers.test.mjs`: `'unsafe-inline'` di `script-src`, `*`, sumber tak terdaftar, `style=`/`onclick=`/`<script>` tanpa `src`, header halaman terkunci kurang.
- `tests/gerbang-rahasia.test.mjs`: pola `-----BEGIN`, `Bearer `, `sk-`, `AKIA`; berkas terlarang terlacak; `wrangler.jsonc` id tak kosong; `.gitignore` kurang entri.
- `tests/gerbang-workflow.test.mjs`, `gerbang-panen.test.mjs` (stdlib saja, host 1001startup.id, robots, UA).
- `tests/potret.test.mjs`, `tests/daftar-tolak.test.mjs`, `scripts/direktori/jaga_unggah.mjs` (pemindai pola pribadi).
- Pemeriksa pasangan: `guard-api`, `hak-auditor`, `migrasi-idempoten`, `higiene-repo`.

## Kasus

Belum ada kasus. Tambahkan lewat ilmu.mjs kasus.
