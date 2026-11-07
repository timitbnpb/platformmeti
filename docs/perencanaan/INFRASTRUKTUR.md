# INFRASTRUKTUR: Platform Jaringan METI

Posisi otoritas: sesudah `DESAIN-TEKNIS` dan `KEAMANAN-PRIVASI`, sebelum `RENCANA-UJI` dan `TIKET` dalam rantai di `KEPUTUSAN-METI`. Kalah dari semua dokumen di atasnya; bila bertentangan, dokumen di atas menang dan pengerja berhenti dan bertanya. Versi 1, 7 Nov 2026.

Dokumen ini menjawab satu hal: **di mana semuanya hidup, bagaimana kode dan data sampai ke sana, bagaimana dipulihkan, dan siapa memegang kunci**. Isi yang sudah ada dirujuk, tidak diulang. Yang ditulis di sini hanya yang BELUM ada di paket. Fitur, tabel, atau rute yang tidak tertulis di paket tidak dibuat; usulan yang menambahnya diberi tiket JM-I* dan ditandai "butuh persetujuan pemilik".

Singkatan: KP = KEPUTUSAN-METI, GD = GRAND-DESIGN, DT = DESAIN-TEKNIS, KPV = KEAMANAN-PRIVASI, OP = OPERASIONAL, TK = TIKET, R6, R8, R10, R11, R12 = `riset/`, WS = `~/.claude/WEBSITE.md`, AG = `~/.claude/AGEN.md`, TS = `~/.claude/TEST.md`, DM = `~/.claude/DUMMY.md`, INP = `~/.claude/INP.md`. Peran: PEMILIK (pemilik produk di tim), DEV (pengembang), SEK, BIM, MI, SJ, PH (seperti OP). Tanda `(verifikasi)` berarti angka, harga, kuota, atau perilaku platform belum diperiksa ke dokumentasi resmi pada 7 Nov 2026 dan WAJIB diperiksa sebelum dijadikan dasar keputusan.

## Daftar isi

0. Keputusan dan klarifikasi yang melintasi dokumen
1. Peta sumber daya
2. Lingkungan
3. Alur deploy dan rilis
4. CI/CD GitHub Actions
5. Data dan penyimpanan
6. Keamanan infrastruktur
7. Observabilitas dan operasi
8. Performa dan skala
9. Peta
10. Pipeline data
11. Armada agent dan tata kelola kode
12. Kepemilikan dan keberlanjutan
13. Hal yang belum terbayangkan
14. Checklist siap rilis infrastruktur
15. Tiket baru dan pertanyaan baru

---

## 0. Keputusan dan klarifikasi yang melintasi dokumen

> **Putusan sesi induk dan pemilik, 7 Nov 2026 (mengalahkan isi di bawah bila bertentangan):**
> 1. **Deploy: pemilik memilih Workers Builds dari `main`** (tidak diputus). Mitigasi: `wrangler.jsonc` dan kode Worker tidak di-push sampai F0 lolos gerbang keamanan; sesudah itu tiap push ke `main` wajib lewat PR dengan CI hijau (branch protection). Migrasi D1 tetap dijalankan terpisah sebelum merge. JM-I01 diubah: bukan memutus Builds, tetapi memasang branch protection + CI wajib.
> 2. Nama: Worker `platformmeti`; D1 `jaringan-meti` (54954854-9ba2-4752-83ff-412941fb9d52) dan `jaringan-meti-pratinjau` (4aca1930-b82c-46f5-a66f-4b66d44477b5); R2 `jaringan-meti`, `jaringan-meti-pratinjau`, `jaringan-meti-cadangan` (semua sudah dibuat, region R2 ENAM). Staging disebut "pratinjau".
> 3. Tombol dummy dibatalkan (KP K15), jadi klarifikasi soal dummy gugur.
> 4. R2 sudah aktif, jadi jalur "tanpa R2" hanya cadangan, tidak dipakai.

### 0.1 Keputusan nama (final di dokumen ini, menunggu sesi induk menyelaraskan dokumen lain)

| Hal | Nama | Alasan | Bukti |
| --- | --- | --- | --- |
| Worker produksi | `platformmeti` | Sudah dibuat pemilik 7 Nov 2026 dan kemungkinan sudah tersambung Git. Nama Worker adalah pemegang domain, secret, dan cron; mengganti nama membuat Worker baru tanpa ketiganya dan situs membeku (insiden poskokarhutla 16 Okt 2026). Workers Builds juga menuntut `name` di `wrangler.jsonc` sama dengan nama Worker di dasbor. | R10 §1.2 |
| Worker staging | `platformmeti-staging` (lewat `env.staging`) | Nama turunan default `wrangler`, jelas terlihat di dasbor. | R10 §1.5 |
| D1 produksi | `jaringan-meti` (uuid `54954854-9ba2-4752-83ff-412941fb9d52`, APAC), binding `DB` | Sudah ada. UUID adalah pengenal, bukan kredensial, tetapi tetap tidak masuk repo (KPV §9). | fakta 7 Nov 2026 |
| D1 staging | `jaringan-meti-pratinjau`, binding `DB` | Terpisah dari produksi, bukan berbagi (R10 §8 butir 5). | R10 §1.5 |
| R2 aplikasi | `jaringan-meti`, binding `BERKAS` | Sesuai DT §6. | DT §6 |
| R2 cadangan | `jaringan-meti-cadangan`, TANPA binding ke Worker mana pun | Peretasan aplikasi atau token deploy tidak boleh sampai ke cadangan (§5.2). | R11 §8.10 |
| R2 staging | `jaringan-meti-pratinjau`, binding `BERKAS` di `env.staging` | Terpisah. | R10 §1.5 |
| Tautan GitHub | `timitbnpb/platformmeti`, publik | Fakta pemilik. | fakta |

### 0.2 Klarifikasi yang butuh keputusan sesi induk

| No | Dokumen asal | Isi yang bertentangan atau kurang | Usulan INFRA | Dampak bila diterima |
| --- | --- | --- | --- | --- |
| K-I1 | DT §8.6, TK JM-A03 | Menulis Worker `jaringan-meti`; kenyataannya `platformmeti`. | Pakai `platformmeti` (§0.1). | Ubah DT §8.6 dan TK JM-A03; tambahkan `env.staging`. |
| K-I2 | Permintaan induk | Kode pertanyaan "C-21 dst." | C-21 sampai C-40 SUDAH dipakai OP §11. INFRA memakai **C-41 sampai C-55** (§15.2). | Tidak ada tabrakan kode. |
| K-I3 | DT §6 | `cadangan/` ada di bucket `jaringan-meti`. | Pindah ke bucket terpisah `jaringan-meti-cadangan` tanpa binding (§5.2). | Ubah satu baris tabel DT §6 dan JM-A03. |
| K-I4 | KPV §8 butir 2, §6 baris Runtime | MapLibre dari cdnjs ber-SRI. | MapLibre vendor lokal di `public/vendor/maplibre/` (R10 §9.1). CSP `script-src 'self'` saja; hapus `cdnjs.cloudflare.com` dari `script-src` dan `style-src`. | Amandemen KPV §8 dan gerbang headers; tiket JM-I14. |
| K-I5 | DT §7.3 | "Terpakai 4 dari 5 jadwal" mencampur jadwal Actions dengan Cron Trigger Worker. | Batas 5 berlaku untuk Cron Trigger Worker di akun Free (R6 §4.1). Jadwal Actions tidak dibatasi 5. Terpakai: **1 dari 5** (sapu `0 18 * * *`). Staging WAJIB `crons: []` supaya tidak memakai slot. | Koreksi kalimat; gerbang `gerbang-wrangler` menghitung efektif. |
| K-I6 | KPV §9 baris "Batas biaya" | Menjanjikan "hard cap" di dasbor Cloudflare untuk Workers AI. | Cloudflare tidak menyediakan hard cap pengeluaran yang saya ketahui `(verifikasi)`. Ganti dengan: batas harian di kode (`AI_BATAS_HARIAN`), cache ringkasan 30 hari, peran LOGIN saja, dan notifikasi tagihan (§6.6). | Ubah kalimat KPV §9; tiket JM-I22 mencakup batas harian. |
| K-I7 | DT §6 butir 6, §8.2 | Mengandalkan cache tepi (`cacheTepi`, Cache API) menekan operasi R2 dan kuota Worker. | Cache API tidak berfungsi pada `*.workers.dev` `(verifikasi)`; berfungsi di domain kustom pada zona Cloudflare. Selama C-02 masih `workers.dev`, lapis publik tetap berupa static assets (jalur F0, §3.9) dan R2 hanya untuk lapis anggota dan pengurus, logo, panen, dan cadangan. | DT §6 butir 6 ditandai bersyarat; urutan migrasi R2 di §3.9. |
| K-I8 | DT ADR-04, KPV §4 | PBKDF2 210.000 iterasi. | Runtime Workers diketahui membatasi iterasi PBKDF2 pada 100.000 `(verifikasi)`. Ukur di JM-B02; bila ditolak, turunkan ke batas dan catat. Tidak mengubah arsitektur. | JM-B02 sudah mewajibkan pengukuran; INFRA hanya mengingatkan. |
| K-I9 | KPV §2.10 vs DT §8.3 vs matriks KPV §1 | KPV §2.10: tombol dummy "tidak menulis ke server"; matriks KPV: SA bisa T baris dummy; DT §8.3: `POST /api/admin/dummy/:halaman` menulis `dummy = 1`. | Untuk infrastruktur: staging DIISI lewat tombol dummy server (DT §8.3) dan produksi hanya SA. Tolong sesi induk memilih satu bunyi. | Memengaruhi §2.4 dan §14. |
| K-I10 | KP C-31, repo publik | C-31 bawaan "tertutup di organisasi" tetapi repo `timitbnpb/platformmeti` PUBLIK. | Repo publik tanpa `LICENSE` berarti semua hak dicadangkan penulis, tetapi tampak terbuka. Putuskan: tetap publik (branch protection dan Environments gratis, §3.3) atau privat (butuh paket GitHub berbayar untuk fitur sama) `(verifikasi)`. Bawaan INFRA: tetap publik, README memuat pernyataan hak cipta METI sampai C-31 dijawab. | Pertanyaan C-42. |
| K-I11 | TK §5 jalur kerja | `scripts/**` milik jalur P (pipa); `.github/**` dan `wrangler.jsonc` tidak punya pemilik jelas selain JM-A02 (mekanik). | Pemilik tunggal untuk `.github/**`, `wrangler.jsonc`, `package.json`, `.nvmrc`, dan `scripts/rilis/**` adalah jalur M (mekanik). `scripts/panen/**` dan `scripts/potret/**` tetap jalur P. | Perbarui TK §5 dan roster. |
| K-I12 | KP C-06 | Bawaan "akun lu dulu". Fakta baru: akun adalah "Timitbnpb@gmail.com's Account" milik tim IT BNPB. | Boleh untuk purwarupa (T0). Data METI nyata (T1 ke atas) di akun yang dikuasai METI. Ditanyakan di C-48. | OP §8.2 dan §12. |

---

## 1. Peta sumber daya

### 1.1 Inventaris

Kolom "Bayar" mengikuti angka R6 §4.1 dan OP §5.1; semua harga berbayar `(verifikasi)`. Lingkungan: L = lokal, S = staging, P = produksi.

| Sumber daya | Nama | Binding atau jenis | Ling. | Pemilik | Free | Paid | Batas dan pemicu naik |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Akun Cloudflare | "Timitbnpb@gmail.com's Account" | akun | S P | PEMILIK, serah ke METI (§12) | gratis | n/a | Anggota akun dan 2FA wajib (§6.1) |
| Worker | `platformmeti` | Worker + static assets | P | DEV | 100.000 permintaan per hari, CPU 10 ms, 50 subrequest, 128 MB | USD 5 per bulan, tanpa batas harian, CPU jauh lebih besar `(verifikasi)` | Naik bila rata-rata > 60.000 permintaan per hari 3 hari berturut, atau login > 10 ms CPU (ADR-04), atau sebelum T2 (§8.4) |
| Worker | `platformmeti-staging` | Worker | S | DEV | Memakai kuota akun yang SAMA (100.000 per hari dibagi bersama) | sama | Uji beban tidak dijalankan di staging Free |
| Static assets | `ASSETS` | di Worker | S P | DEV | Permintaan aset statis tidak dihitung sebagai permintaan Worker bila Worker tidak dipanggil `(verifikasi)`; 20.000 berkas, 25 MiB per berkas `(verifikasi)` | batas lebih besar | Gerbang plafon 15.000 berkas dan 25 MB total (R10 §1.6) |
| D1 produksi | `jaringan-meti` | `DB` | P | DEV (skema), SA (isi) | 5 juta baris dibaca per hari, 100.000 ditulis per hari, 500 MB per database, 5 GB total | kuota sertaan besar | Naik bila baca > 3 juta per hari (60 persen) atau Time Travel 30 hari dibutuhkan |
| D1 staging | `jaringan-meti-pratinjau` | `DB` di `env.staging` | S | DEV | memakai kuota akun yang sama | sama | Hanya data dummy |
| D1 uji pulih | `jaringan-meti-uji-pulih` | dibuat dan dibuang oleh workflow | S | CI | sama | sama | Hidup < 10 menit (§5.6) |
| R2 aplikasi | `jaringan-meti` | `BERKAS` | P | DEV | 10 GB-bulan, 1 juta Class A, 10 juta Class B per bulan, tanpa egress | bayar pemakaian | Naik bila Class B > 6 juta per bulan (60 persen) |
| R2 staging | `jaringan-meti-pratinjau` | `BERKAS` di `env.staging` | S | DEV | sama | sama | Hanya data dummy |
| R2 cadangan | `jaringan-meti-cadangan` | tanpa binding; diakses CI lewat kunci S3 | P | PEMILIK, SEK | sama | sama | Lokasi `apac` dipilih saat dibuat (§13 butir 23) |
| Workers AI | `AI` | `AI` | P | DEV | kuota harian gratis terbatas `(verifikasi)` | bayar per pemakaian | Batas harian di kode; tanpa hard cap platform (K-I6) |
| Cron Trigger | `0 18 * * *` (sapu) | `triggers.crons` | P | DEV | 5 per akun, terpakai 1 | 250 | Staging `crons: []` |
| Rate Limiting | `BATAS_LAJU` | binding `ratelimit` `(verifikasi)` | S P | DEV | termasuk `(verifikasi)` | sama | Pengganti aturan WAF selama `workers.dev` (§6.4) |
| Observability | Workers Logs | `observability.enabled` | S P | DEV | retensi pendek, batas log harian `(verifikasi)` | retensi lebih panjang | Naik ke Paid memperpanjang retensi |
| Domain dan DNS | belum diputus (C-02, C-41) | zona Cloudflare | P | SEK | gratis | n/a | Prasyarat cache tepi, WAF, Email Routing (§13) |
| Surel masuk | alias `privasi@`, `keamanan@`, `kontak@` | Email Routing atau kotak METI | P | SEK | gratis, hanya bila domain di zona Cloudflare | n/a | C-47 |
| Surel keluar | tautan manual (bawaan KP C-08) | penyedia surel opsional | P | SEK | Resend atau Brevo ada tingkat gratis `(verifikasi)` | USD 15 sampai 25 | Hanya bila C-08 dijawab |
| Turnstile | widget formulir publik | siteverify dari Worker | P | DEV | gratis | n/a | Dipakai mulai F3 (KPV §7) |
| WAF dan aturan laju | aturan kustom | zona | P | DEV | beberapa aturan gratis `(verifikasi)` | lebih banyak | Tidak tersedia di `workers.dev` (§6.4) |
| GitHub | `timitbnpb/platformmeti` | repo, Actions, Environments | semua | PEMILIK | publik: Actions standar gratis `(verifikasi)`, branch protection gratis | n/a | §4.5 |
| Cadangan luar akun | disediakan METI (C-44) | S3 atau Drive METI | P | SEK | tingkat gratis `(verifikasi)` | murah | §5.3 |
| Pemantau luar | UptimeRobot atau setara | HTTP check | P | DEV | 50 monitor, interval 5 menit `(verifikasi)` | n/a | §7.3 |
| Pengelola kata sandi | milik METI (C-43) | Bitwarden atau setara | P | SEK | tingkat gratis `(verifikasi)` | USD 4 per pengguna per bulan `(verifikasi)` | §12.2 |

### 1.2 Yang sengaja TIDAK dipakai

| Layanan | Keputusan | Alasan | Pemicu meninjau ulang |
| --- | --- | --- | --- |
| KV | Tidak | Tidak ada data yang butuh baca global murah dan tulis jarang yang tidak sudah dilayani potret R2 atau aset. Bendera fitur dan mode pemeliharaan cukup lewat `vars`/secret Worker (§3.8). Satu penyimpanan lagi berarti satu permukaan hak dan satu kuota (1.000 tulis per hari di Free `(verifikasi)`). | Bila ada kebutuhan bendera yang berubah tanpa deploy dan sering |
| Queues | Tidak | Tidak ada kerja asinkron di Worker. Pipeline berjalan di Actions; surel manual. `ctx.waitUntil` cukup untuk log. | Surel otomatis volume besar (C-08) |
| Durable Objects | Tidak | Batas laju cukup dengan binding `ratelimit` plus tabel `laju`. Tidak ada sesi realtime. | Fitur kolaborasi waktu nyata |
| Vectorize, Hyperdrive, Browser Rendering | Tidak | Pencarian pakai FTS5 dan `cari.json` (DT). Tidak ada Postgres luar. | Pencarian semantik (belum di KP) |
| Cloudflare Access | Tidak | Sesi sendiri (KP D8). Access gratis < 50 pengguna `(verifikasi)` dapat dipakai nanti HANYA untuk melindungi `staging` dari publik (§2.5). | Staging berisi data bukan dummy |
| Analytics Engine | Ditunda | Statistik agregat cukup dari metrik Workers (§7.6). Ketersediaan di Free `(verifikasi)`. | C-52 menginginkan lebih |
| Cloudflare Web Analytics, Google Analytics | Tidak | KPV §3.6 butir 4: tanpa analitik pihak ketiga; first-party berconsent bila ada. | C-52 |
| Images, Stream, Pages | Tidak | Logo kecil diolah di pipeline; tanpa video; Workers + assets adalah arah Cloudflare saat ini. | n/a |

### 1.3 Sumber daya per fase

| Fase | Wajib ada | Boleh belum |
| --- | --- | --- |
| F0 (T0) | Akun, Worker `platformmeti`, D1 `jaringan-meti`, D1 staging, GitHub Actions | R2 (menunggu billing), domain, surel, Turnstile |
| F1 (T1, T2) | R2 tiga bucket, cadangan harian, pemantau luar, Workers Paid sebelum T2, domain kustom disarankan | Turnstile, API terbuka |
| F2 | Status page, DNS lengkap (CAA, DNSSEC, SPF, DKIM, DMARC), aturan WAF | PMTiles |
| F3 | Turnstile, API terbuka dengan kunci, kemungkinan Paid yang lebih tinggi | n/a |

---

## 2. Lingkungan

### 2.1 Tiga lingkungan, satu repo, satu `wrangler.jsonc`

| Lingkungan | Tujuan | Worker | D1 | R2 | Data | Siapa mengubah |
| --- | --- | --- | --- | --- | --- | --- |
| Lokal | Pengembangan dan uji | `wrangler dev --local` | SQLite lokal (`.wrangler/state`) | R2 lokal | Dummy dan seed | Siapa pun di mesin sendiri |
| Staging | Uji sebelum rilis, uji layar, latihan migrasi | `platformmeti-staging` | `jaringan-meti-pratinjau` | `jaringan-meti-pratinjau` | HANYA dummy sintetis; tidak pernah salinan produksi | CI (`staging.yml`) |
| Produksi | Pengguna nyata | `platformmeti` | `jaringan-meti` | `jaringan-meti` | Nyata | CI (`rilis.yml`) dengan persetujuan |

Aturan keras: tidak ada salinan data produksi di lingkungan lain, termasuk untuk "debug sebentar". Kebocoran lewat staging adalah kelas insiden UU PDP yang sama (R11 §8.10).

### 2.2 Cara memisahkan di wrangler

Satu berkas. Konfigurasi tingkat atas adalah **produksi** (konvensi wrangler, dan Workers Builds membaca ini). `env.staging` mendefinisikan ULANG semua binding (binding tidak diwariskan antar `env`) `(verifikasi pewarisan tiap kunci dengan wrangler deploy --dry-run --env staging)`. Tidak ada berkas wrangler kedua (R10 §8 butir 7).

```jsonc
{
  // Nama Worker = pemegang domain, secret, dan cron. JANGAN diganti tanpa memindah ketiganya (R10 §1.2).
  "name": "platformmeti",
  "main": "src/worker.js",
  "compatibility_date": "2026-11-01",
  "workers_dev": true,
  "preview_urls": false,            // URL pratinjau versi publik secara bawaan (verifikasi)
  "assets": {
    "directory": "./public",
    "binding": "ASSETS",
    "html_handling": "auto-trailing-slash",
    "not_found_handling": "404-page",
    "run_worker_first": ["/api/*", "/direktori", "/direktori.html", "/admin", "/admin.html", "/admin/*", "/p/*", "/wilayah/*"]
  },
  "d1_databases": [{ "binding": "DB", "database_name": "jaringan-meti", "database_id": "", "migrations_dir": "migrations" }],
  // F1: r2_buckets BERKAS = jaringan-meti. Sebelum bucket ada, JANGAN dideklarasikan (deploy gagal).
  "ai": { "binding": "AI" },
  "triggers": { "crons": ["0 18 * * *"] },
  "observability": { "enabled": true },
  "vars": { "LINGKUNGAN": "produksi", "POTRET_SUMBER": "assets", "PEMELIHARAAN": "0", "AI_BATAS_HARIAN": "200" },
  "env": {
    "staging": {
      "name": "platformmeti-staging",
      "workers_dev": true,
      "preview_urls": false,
      "assets": { "directory": "./public", "binding": "ASSETS", "html_handling": "auto-trailing-slash", "not_found_handling": "404-page", "run_worker_first": ["/api/*", "/direktori", "/direktori.html", "/admin", "/admin.html", "/admin/*", "/p/*", "/wilayah/*"] },
      "d1_databases": [{ "binding": "DB", "database_name": "jaringan-meti-pratinjau", "database_id": "", "migrations_dir": "migrations" }],
      "ai": { "binding": "AI" },
      "triggers": { "crons": [] },
      "observability": { "enabled": true },
      "vars": { "LINGKUNGAN": "staging", "POTRET_SUMBER": "assets", "PEMELIHARAAN": "0", "AI_BATAS_HARIAN": "20" }
    }
  }
}
```

Id kosong di repo (KPV §9, DT §8.6). CI mengisinya dari variabel Actions (`D1_ID_PRODUKSI`, `D1_ID_STAGING`, bukan rahasia kredensial) lewat `scripts/rilis/isi-id.mjs` yang menambal salinan di runner, tidak pernah di-commit. Skrip itu satu fungsi murni dengan uji (masukan JSONC dan peta id, keluaran JSONC; id kosong atau tidak dikenal = galat).

Bendera `LINGKUNGAN` dibaca `/api/status` dan uji. Binding Workers AI selalu terhubung ke akun sungguhan walau `--local` `(verifikasi)`; karena itu uji dan dev lokal memakai tiruan AI (`AI_TIRUAN=1`), bukan binding sungguhan.

### 2.3 Penjaga: uji tidak pernah menyentuh produksi

Lapisan berurutan; tiap lapis berdiri sendiri (R11 §1.9, R11 §8.10, TS "empat hal yang tidak boleh hilang").

| Lapis | Penjaga | Bukti |
| --- | --- | --- |
| 1 | Job `uji` di CI TIDAK punya rahasia Cloudflare sama sekali; token hanya ada di Environment `staging`, `produksi`, `data`, `cadangan` (§4.3). Uji tidak mampu menyentuh akun walau mau. | `gerbang-workflow` memeriksa job `uji` tanpa `environment` dan tanpa `secrets.CF_*` |
| 2 | Uji integrasi memakai Miniflare dengan D1 lokal SEMENTARA yang dibuat baru per berkas uji dan dibuang sesudahnya. D1 tidak mendukung transaksi lintas panggilan, jadi basis baru per berkas adalah padanan `ROLLBACK`; berkas uji yang lupa membersihkan tetap tidak bisa menetapkan apa pun. | `tests/e2e/jalankan.mjs`, TS butir 1 |
| 3 | Runner berhenti di galat pertama (`node --test --test-concurrency=1 --bail` atau `set -e`); uji gagal tidak boleh melapor lolos. | TS butir 2 |
| 4 | `scripts/rilis/penjaga.mjs` membungkus semua skrip `npm run d1:*`: menolak `--remote` kecuali `JM_IZIN_PRODUKSI=ya` dan diawali dari `rilis.yml`; menolak `database_id` produksi di perintah uji. Padanan `HOST_PRODUKSI` dan `E2E_DB_IZIN_PRODUKSI` pangantara. | R11 §1.9 |
| 5 | Uji layar (Playwright) membaca `BASE_URL` dan menolak bila bukan `http://localhost:*` atau `*platformmeti-staging*`. | JM-H02 |
| 6 | `gerbang-env-terpisah`: nama dan id D1, R2, Worker di `env.staging` berbeda dari produksi; staging `triggers.crons` kosong; `LINGKUNGAN` berbeda. | JM-I04 |
| 7 | Hook agent `blok-produksi.mjs` dan aturan `deny` di `.claude/settings.json` menolak `--remote`, `wrangler deploy`, `wrangler r2 object`, `git push`, dan `gh workflow run rilis` dari sesi agent (§11.4). | JM-I11 |
| 8 | Staging hanya diisi dummy: skrip `seed-staging.mjs` memakai rute dummy resmi (DM) dan menolak jalan bila `LINGKUNGAN` bukan `staging`. | JM-I06 |

### 2.4 Dummy per lingkungan (DM)

| Lingkungan | Dummy | Catatan |
| --- | --- | --- |
| Lokal | Tombol dua ikon (isi dan hapus) bekerja untuk SA; `dataContoh()` per halaman | DM syarat 1 sampai 6; tabel baru yang dibaca layar bertombol dummy wajib masuk `tests/e2e/05-dummy-jejak.sql` |
| Staging | Terisi penuh oleh `seed-staging.mjs` tiap deploy staging: tiap ember status terisi, periode yang terpampang, angka dari rantai sungguhan (DM syarat 3 sampai 5) | Sesudah seed, smoke test memanggil endpoint tiap layar dan memastikan tiap kolom bukan nol (DM syarat 5) |
| Produksi | Tombol dummy hanya SA; baris `dummy = 1` tidak pernah masuk potret (DT §8.3, KPV §1 butir 10) | Latihan pulih memeriksa `COUNT(*) WHERE dummy = 1` di potret = 0 |

### 2.5 Staging tidak boleh bocor ke publik

`*.workers.dev` staging dapat dibuka siapa pun yang tahu URL-nya. Karena hanya berisi dummy, risikonya reputasi (profil contoh terindeks mesin pencari), bukan data pribadi. Mitigasi tanpa biaya: `X-Robots-Tag: noindex, nofollow` dan `<meta name="robots">` pada semua respons bila `LINGKUNGAN != produksi`; kata "STAGING" tetap di kepala situs; `robots.txt` staging `Disallow: /`. Bila staging suatu saat berisi data selain dummy, pasang Cloudflare Access (gratis < 50 pengguna `(verifikasi)`) di depannya.

### 2.6 Satu akun, atau dua?

Bawaan F0: satu akun Cloudflare, sumber daya terpisah. Kelemahannya: login `wrangler` lokal (OAuth) bersifat penuh atas akun, termasuk produksi, dan token API Cloudflare tidak bisa dibatasi ke satu Worker atau D1 `(verifikasi)`. Pagar kita adalah §2.3 lapis 4 dan 7, bukan pembatas platform. Mulai T2, staging dan pengembangan dipindah ke akun terpisah (milik DEV) bila C-43 menyediakan orang kedua; produksi di akun METI. Pertanyaan C-48.

---

## 3. Alur deploy dan rilis

### 3.1 Rekomendasi: `wrangler deploy` dari GitHub Actions, bukan Workers Builds

| Pertimbangan | Workers Builds (Cloudflare membangun dari Git) | `wrangler deploy` dari Actions | Menang |
| --- | --- | --- | --- |
| Gerbang uji sebelum deploy | Tidak bisa menunggu hasil Actions; deploy jalan paralel dengan CI `(verifikasi)` | Deploy hanya setelah gerbang hijau, dalam satu alur | Actions |
| Migrasi D1 sebelum kode | Harus diakali lewat perintah build; kegagalan migrasi tetap men-deploy kode | Langkah terpisah berurutan, berhenti di galat | Actions |
| Persetujuan manusia sebelum produksi | Tidak ada | Environment `produksi` dengan peninjau wajib | Actions |
| Rollback otomatis bila smoke gagal | Tidak ada | Ada (§3.5) | Actions |
| Repo publik, PR dari fork | Build dapat terpicu oleh cabang non-`main` sesuai pengaturan | Rahasia tidak diberikan ke PR fork | Actions |
| Rahasia | Token build disimpan di Cloudflare | Tersebar di GitHub, tetapi per Environment | Seri |
| Kemudahan | Nol konfigurasi | Perlu menulis workflow | Workers Builds |
| Satu pintu deploy | Dua pintu bila keduanya aktif (bahaya, §13 butir 18) | Satu | Actions |

Keputusan: **satu pintu, Actions**. Karena Worker `platformmeti` kemungkinan sudah tersambung ke Git, tindakan pertama PEMILIK (JM-I01): buka dasbor Worker, Settings, Builds, dan **putuskan sambungan** (atau jika harus dipertahankan, matikan build untuk semua cabang dan nonaktifkan deploy otomatis). Alasan terbesar: merge ke `main` akan men-deploy kode TANPA migrasi dan TANPA persetujuan, melewati seluruh §3.

Alat deploy: `npx wrangler` dengan versi yang dipatok persis di `package.json` (tanpa `^`) dan `package-lock.json`, bukan action pihak ketiga `wrangler-action`. Satu versi yang sama untuk lokal dan CI (R10 §8 butir 6: repo asal punya tiga versi).

### 3.2 Alur ujung ke ujung

```
 cabang fitur ──PR──> uji.yml (wajib hijau) ──merge──> main
                                                       │
                          staging.yml (otomatis) ──────┤  migrasi staging -> deploy staging -> seed dummy -> smoke
                                                       │
                          rilis.yml (workflow_dispatch + persetujuan) ──> produksi
                             1. periksa: SHA = HEAD main, staging hijau untuk SHA itu
                             2. tangkap bookmark Time Travel + cadangan cepat
                             3. d1 migrations apply --remote
                             4. wrangler versions upload, lalu versions deploy
                             5. smoke /api/status (versi = SHA, lingkungan = produksi)
                             6. gagal -> wrangler rollback otomatis + peringatan
```

### 3.3 Pagar GitHub

| Pagar | Nilai | Catatan |
| --- | --- | --- |
| Cabang `main` | Ruleset: PR wajib, 1 persetujuan, status wajib `uji`, `gerbang`, `pindai`; tanpa force-push; tanpa penghapusan; penyelesaian diskusi wajib | Berlaku juga untuk PEMILIK, tanpa pengecualian admin (R11 §8.6) |
| CODEOWNERS | `src/hak.js`, `src/sesi.js`, `src/sandi.js`, `migrations/**`, `public/_headers`, `wrangler.jsonc`, `.github/**`, `scripts/rilis/**` dimiliki PEMILIK dan satu orang kedua (C-43) | Perubahan hak, skema, dan header butuh dua mata |
| Environment `produksi` | Peninjau wajib: PEMILIK dan satu orang kedua; cegah persetujuan diri sendiri bila ada dua orang; hanya cabang `main` | Rahasia produksi hanya terlihat di job yang memakainya |
| Environment `staging` | Tanpa peninjau; hanya `main` | |
| Environment `data` | Tanpa peninjau; hanya `main`; rahasia panen dan potret | Job terjadwal tidak boleh menunggu manusia |
| Environment `cadangan` | Tanpa peninjau; hanya `main`; rahasia cadangan terpisah | |
| Siapa boleh men-dispatch `rilis.yml` | Hanya yang punya hak tulis; tetapi persetujuan Environment tetap wajib | Agent tidak punya kredensial GitHub dengan hak ini (§11.4) |
| Fork dan PR luar | Pengaturan Actions: "Require approval for all outside collaborators"; tanpa `pull_request_target`; izin token default `contents: read` | §13 butir 20 |
| Pemindaian | Secret scanning dan push protection aktif; Dependabot alerts aktif | Gratis di repo publik `(verifikasi)` |
| Pengaman tambahan | Perubahan pada `.github/workflows/**` butuh CODEOWNERS | Workflow adalah pintu rahasia |

### 3.4 Versi Worker dan rollback

| Aspek | Aturan |
| --- | --- |
| Versi | Tiap `wrangler versions upload` menghasilkan versi tersimpan. Pesan versi memuat SHA commit dan tanggal (`--message "<sha> <tgl>"`) `(verifikasi flag)`. `/api/status` mengembalikan `versi` = SHA. |
| Rollback kode | `wrangler rollback` ke versi sebelumnya (atau `wrangler versions deploy <id>@100%`) `(verifikasi)`. Target waktu: 15 menit sejak keputusan. |
| Rollback tidak membalik migrasi | Karena itu migrasi bergaya "ekspansi dulu, penyusutan kemudian" (§3.6): kode versi sebelumnya HARUS tetap jalan di skema baru. |
| Rollback data | D1 Time Travel ke bookmark yang ditangkap sebelum migrasi (§5.4). Menghapus perubahan setelah titik itu, jadi hanya untuk kerusakan data, bukan untuk "kode salah". |
| Rollback potret | Potret lama disimpan di `cadangan/` mingguan dan R2 `potret/` sebelumnya; `workflow_dispatch` `potret.yml` dengan input `versi` memulihkan. Pada jalur F0, rollback potret = rollback versi Worker. |
| Uji rollback | Dilakukan di staging tiap kuartal (bagian dari §5.6). Rollback yang belum pernah dilatih dianggap belum ada. |

### 3.5 Migrasi D1 terpisah dari kode

1. Berkas `migrations/NNNN_nama.sql`: nomor unik tanpa lubang, idempoten (`IF NOT EXISTS`, `DROP TRIGGER IF EXISTS` lalu buat ulang), berkas lama tidak pernah disunting (hash dibandingkan). Gerbang `gerbang-migrasi-stempel` (R11 §1.7). Pengulas: `migrasi-idempoten`.
2. **Urutan produksi: migrasi, lalu kode.** Skema baru harus kompatibel dengan kode LAMA (hanya menambah). Penghapusan kolom atau tabel menunggu satu rilis penuh sesudahnya dan ditandai `-- DESTRUKTIF: disetujui <tgl>` agar gerbang tahu (R11 §1.7).
3. `rilis.yml` menjalankan `wrangler d1 migrations apply jaringan-meti --remote` HANYA di job produksi; tidak ada perintah migrasi manual dari laptop (R10 §8 butir 8). Perintah `d1 execute --remote` untuk DDL dilarang; yang diizinkan hanya `SELECT` baca oleh pipeline kurasi (DT §7.4 langkah 2).
4. Sebelum dan sesudah migrasi, `scripts/rilis/drift.mjs` membandingkan `sqlite_master` dan `PRAGMA table_info` hasil `d1 execute --remote --json` dengan skema yang dilahirkan `migrations/*.sql` di D1 lokal. Tabel `d1_migrations` BUKAN bukti (R11 §1.6). Objek yang ada di produksi tetapi tidak di repo (trigger buatan tangan) = gagal (R11 §1.8).
5. Tiap migrasi diuji di staging lebih dulu pada basis yang sudah berisi dummy, bukan basis kosong.
6. Migrasi data besar (>100.000 tulis, batas harian Free) dipecah dalam beberapa hari atau dikerjakan setelah naik ke Paid.
7. Jika migrasi gagal di tengah: berhenti, JANGAN deploy kode, periksa `drift`, putuskan antara perbaiki-maju atau Time Travel. Perilaku atomik migrasi D1 `(verifikasi)`.

### 3.6 Bendera fitur dan mode pemeliharaan

Tanpa KV (§1.2). Keduanya lewat `vars` dan secret Worker, dibaca satu kali di router.

| Bendera | Tempat | Cara mengubah | Efek |
| --- | --- | --- | --- |
| `PEMELIHARAAN` | var, bisa ditimpa secret | `rilis.yml` input `pemeliharaan=on|off` yang menjalankan `wrangler secret put` atau mengubah var lalu deploy versi sama | Semua rute HTML dijawab 503 + `Retry-After` + halaman pemeliharaan statis; `/api/status` tetap hidup dan menyatakan `pemeliharaan: true`; tulis D1 berhenti |
| `AI_AKTIF` | var | PR kecil atau input `rilis.yml` | Mematikan ringkasan mesin tanpa kode baru |
| `DAFTAR_MANDIRI` | var, bawaan `0` | PR | Fitur F3 tersembunyi sampai dinyalakan (WS: fitur yang belum jalan disembunyikan) |
| `TULIS_DIBEKUKAN` | var | sama dengan pemeliharaan | Hanya baca; dipakai saat latihan pulih atau dugaan kerusakan data |

Bendera yang berumur > 1 rilis setelah fitur stabil dihapus (kode mati = utang).

### 3.7 Rencana rollback hari peluncuran (T2 dan T3)

| Waktu | Tindakan | Penanggung jawab | Bukti |
| --- | --- | --- | --- |
| T-7 hari | Pembekuan rilis fitur; hanya perbaikan | PEMILIK | `CHANGELOG` bertanda beku |
| T-3 hari | Latihan penuh di staging: migrasi, deploy, smoke, rollback, mode pemeliharaan | DEV | Catatan latihan |
| T-2 hari | Uji pemulihan D1 ke basis sementara dijalankan dan lulus (§5.6); Workers Paid aktif; ambang kuota dipasang | DEV, SEK | Laporan `latihan-pulih` |
| T-1 hari | Cadangan manual tambahan; catat bookmark Time Travel; periksa `/api/status` semua hijau; kontak insiden dikonfirmasi | DEV | Bookmark tercatat di catatan rilis |
| T-0, 2 jam sebelum | Cek Cloudflare Status dan GitHub Status; periksa kuota harian terpakai < 20 persen | DEV | |
| T-0 | Deploy lewat `rilis.yml`; smoke; uji manual 5 jalur (masuk, cari, profil, peta, koreksi) pada 1280 dan 390 px | DEV, PEMILIK | Ceklis |
| T+1 jam | Pantau 5xx, `/api/status`, kuota Worker, log | DEV | |
| T+1 hari | Tinjau galat dan kuota; cabut pembekuan bila stabil | PEMILIK | |
| Pemicu rollback | 5xx > 2 persen selama 10 menit; `/api/status` merah; login gagal untuk semua; data pribadi muncul di lapis salah; potret rusak | PEMILIK memutuskan dalam 10 menit | |
| Aksi | Kebocoran data: PEMELIHARAAN on dulu, baru selidiki (KPV §3.7, 3 x 24 jam). Lainnya: `wrangler rollback`, lalu sebab. | DEV | Catatan insiden |
| Hari terlarang | Jumat sore, malam, hari libur nasional, hari acara METI | PEMILIK | §13 butir 32 |

### 3.8 Jalur sementara tanpa R2 (F0)

R2 belum aktif (menunggu billing). Rencana yang bisa dijalankan sekarang dan dimigrasi tanpa menulis ulang layar:

| Langkah | Isi |
| --- | --- |
| 1 | `src/potret.js` mengekspor `bacaPotret(env, akun, lapis, nama)` (DT §6 butir 2) dengan dua penyokong: `assets` (membaca `env.ASSETS.fetch(new Request(origin + "/potret/<lapis>/<nama>"))`) dan `r2` (`env.BERKAS.get`). Pilihan lewat var `POTRET_SUMBER`. Peran tetap diperiksa SEBELUM menyentuh penyokong mana pun. |
| 2 | F0 hanya lapis **publik**: dibangun `potret.mjs` dari data seed METI dan dummy, ditulis ke `public/potret/publik/` DI RUNNER saat rilis. Folder itu masuk `.gitignore` (artefak build tidak masuk git, R12 §8.5), jadi tidak ada artefak 1,6 MB di riwayat publik. |
| 3 | Lapis anggota dan pengurus tidak punya berkas statis sama sekali di F0: `/direktori` memakai `dataContoh()` fiktif (JM-C05). Data nyata anggota baru masuk setelah R2 aktif (F1), karena aset statis bisa diunduh siapa pun, tanpa pemeriksaan peran. Gerbang: `public/potret/anggota` dan `public/potret/pengurus` HARAM ada. |
| 4 | `potret.yml` terjadwal TIDAK aktif di F0 (tanpa R2 tidak ada tempat unggah). Pembaruan potret = rilis biasa lewat `rilis.yml`. Karena F0 berisi data seed yang jarang berubah, ini cukup. |
| 5 | Migrasi ke R2 (JM-I16, F1): buat bucket (JM-I15), tambah `r2_buckets` ke `wrangler.jsonc` (gerbang `gerbang-wrangler` diperbarui), jalankan `potret.yml` pertama, ubah var `POTRET_SUMBER` ke `r2` di staging, uji, lalu di produksi. Berkas statis `public/potret/` dihapus pada rilis berikutnya. |
| 6 | Keputusan akhir tentang lapis publik: bila C-02 masih `workers.dev` saat F1, lapis publik tetap `assets` (cache tepi tidak berfungsi, K-I7) dan R2 hanya untuk lapis privat. Bila domain kustom sudah ada, lapis publik pindah ke R2 sesuai DT dan Cache API memangkas bacaan. |

---

## 4. CI/CD GitHub Actions

### 4.1 Daftar workflow

Waktu dalam UTC; WIB = UTC + 7. Menit jadwal sengaja ganjil: GitHub menunda jadwal tepat jam sekitar 35 menit (median) (R10 §1.6, R10 §3.3). Konkurensi: `data` untuk panen dan potret (tidak membatalkan yang berjalan), `d1-admin` untuk rilis, cadangan, dan latihan pulih (tidak pernah dua sekaligus). Semua job punya `timeout-minutes` dan `permissions: contents: read` kecuali dinyatakan lain.

| Berkas | Pemicu | Isi | Environment | Perkiraan menit per bulan |
| --- | --- | --- | --- | --- |
| `uji.yml` | `push`, `pull_request` (abaikan `**/*.md`) | `npm ci`, `npm run uji` (unit, integrasi D1 lokal, gerbang), `npm run uji:pipa` (Python), lint workflow, `isi-id` uji | tidak ada, tanpa rahasia | 320 |
| `pindai.yml` | `pull_request`, jadwal `29 2 * * 1` | Pemindai rahasia, `npm audit --omit=dev`, CodeQL JavaScript, pemindai pola surel/telepon di `docs/` dan `public/` | tidak ada | 40 |
| `staging.yml` | `push` ke `main` (setelah `uji`) | isi id, migrasi staging, `wrangler deploy --env staging`, `seed-staging.mjs`, smoke | `staging` | 100 |
| `rilis.yml` | `workflow_dispatch` (input: `sha`, `pemeliharaan`) | §3.2 | `produksi` (peninjau) | 40 |
| `panen-bulanan.yml` | `23 20 1 * *`, `workflow_dispatch` (`dry_run`) | DT §7.3 | `data` | 40 |
| `panen-mingguan.yml` | `41 21 * * 0` | `regulasi.py`, `sinkron_meti.py` | `data` | 24 |
| `potret.yml` | `17 22 * * *`, `workflow_run` sesudah panen, `workflow_dispatch` (`versi`) | DT §7.4; aktif sejak R2 (F1) | `data` | 150 |
| `cadangan.yml` | `43 19 * * *` | §5.3; aktif sejak R2 (F1) | `cadangan` | 90 |
| `latihan-pulih.yml` | `37 3 8 * *`, `workflow_dispatch` | §5.6 | `cadangan` | 10 |
| `pemantau.yml` | `11 */3 * * *` | `/api/status` produksi dan staging; menilai KESEGARAN; gagal = surel dari GitHub (§7.4) | tanpa rahasia (token pemantau di Environment `pemantau`) | 240 (satu menit minimum per job) |
| `kuota.yml` | `53 1 * * 1` | Laporan mingguan kuota Workers, D1, R2 dan masa berlaku token | `data` | 4 |

Total perkiraan: sekitar 1.060 menit per bulan. Di repo publik menit runner standar gratis `(verifikasi)`; angka ini hanya relevan bila repo menjadi privat (batas Free 2.000 menit per bulan `(verifikasi)`; pangantara menghabiskannya dalam 3 hari pada 25 Jul 2026, R11 §1.3). Gerbang `gerbang-kuota-actions` menjumlahkan jadwal dan menolak total > 1.500.

Perubahan dari DT §7.3: menit jadwal digeser dari `:00` ke menit ganjil; `cadangan.yml`, `latihan-pulih.yml`, `pemantau.yml`, `kuota.yml`, `pindai.yml`, `staging.yml`, `rilis.yml` ditambahkan. Batas 5 jadwal bukan batas Actions (K-I5).

### 4.2 Urutan jadwal harian (WIB)

| WIB | UTC | Apa |
| --- | --- | --- |
| 01:00 | 18:00 | Cron Worker sapu (sesi, laju, aktivasi kedaluwarsa) |
| 02:43 | 19:43 | Cadangan D1 harian |
| 03:23 tgl 2 | 20:23 tgl 1 | Panen bulanan |
| 04:41 Senin | 21:41 Minggu | Panen mingguan |
| 05:17 | 22:17 | Potret |
| tiap 3 jam | | Pemantau |

Cadangan sebelum panen dan potret supaya cadangan memuat keadaan sebelum pipeline menyentuh apa pun; sapu sebelum cadangan supaya cadangan kecil.

### 4.3 Rahasia dan variabel

Pembagian token per Environment (DT §7.3 menyebut satu `CLOUDFLARE_API_TOKEN`; INFRA memecahnya supaya satu kebocoran tidak membuka semuanya). Izin tepat `(verifikasi di dasbor saat membuat)`.

| Nama | Environment | Izin minimal | Dipakai oleh |
| --- | --- | --- | --- |
| `CF_API_TOKEN_STAGING` | `staging` | Workers Scripts Edit, D1 Edit, R2 Edit (akun) | `staging.yml` |
| `CF_API_TOKEN_PRODUKSI` | `produksi` | Workers Scripts Edit, D1 Edit | `rilis.yml` |
| `CF_API_TOKEN_KURASI` | `data` | D1 Read saja | `potret.yml` (`kurasi_baca.mjs`) |
| `CF_API_TOKEN_POTRET` | `data` | R2 Edit untuk bucket aplikasi (kunci S3 terlingkup bucket bila mungkin) | `panen-*.yml`, `potret.yml` |
| `CF_API_TOKEN_CADANGAN_D1` | `cadangan` | D1 export (perlu `Edit`? `(verifikasi)`) | `cadangan.yml` |
| `R2_CADANGAN_KEY_ID`, `R2_CADANGAN_SECRET` | `cadangan` | Object Read dan Write, terlingkup bucket `jaringan-meti-cadangan` | `cadangan.yml`, `latihan-pulih.yml` |
| `OFFSITE_*` | `cadangan` | Menulis ke penyimpanan luar akun (C-44) | `cadangan.yml` |
| `AGE_PUBLIC_KEY` | variabel, bukan rahasia | Kunci publik enkripsi cadangan | `cadangan.yml` |
| `OPENALEX_KEY` | `data` | Kunci API | `panen-bulanan.yml` |
| `PEMANTAU_TOKEN` | `pemantau` | Header khusus untuk melewati tantangan bot di zona (§13 butir 16) | `pemantau.yml`, smoke |
| `CF_ACCOUNT_ID`, `D1_ID_PRODUKSI`, `D1_ID_STAGING` | variabel | Pengenal, bukan kredensial | semua yang perlu |

Aturan: tiap workflow memeriksa rahasia yang dibutuhkan di langkah pertama dan berhenti dengan menyebut NAMA yang kurang (R11 §2.14, run pertama pangantara gagal karena secret tak dipasang). Tidak ada rahasia dicetak ke log; `::add-mask::` untuk nilai turunan. Tidak ada OIDC Cloudflare, jadi token berumur: setiap token dibuat dengan tanggal kedaluwarsa 90 hari, dan `kuota.yml` memeriksa sisa umur lewat `GET /user/tokens/verify` `(verifikasi)` lalu menggagalkan job bila < 14 hari.

### 4.4 Pin versi, dependabot, SRI

| Hal | Aturan |
| --- | --- |
| Actions pihak ketiga | Dipatok ke SHA commit penuh, komentar versi di sampingnya (`uses: actions/checkout@<sha> # v4.x`). Seminimal mungkin: `actions/checkout`, `actions/setup-node`, `github/codeql-action`. Tidak ada `wrangler-action`. |
| Node dan wrangler | `.nvmrc` dan `package.json` `engines`; `wrangler` versi persis di `devDependencies`; `package-lock.json` dikomit. CI membaca `node-version-file: .nvmrc` (R11 §1.2). |
| `compatibility_date` | Dinaikkan terencana tiap kuartal lewat PR dengan uji; bukan otomatis. |
| Dependabot | `.github/dependabot.yml`: mingguan, dikelompokkan, untuk `github-actions`, `npm` (dev), dan `pip` bila ada berkas persyaratan; major `wrangler` ditahan dan ditinjau manual (R11 §1.13). Pembaruan SHA Actions masuk lewat Dependabot. |
| SRI | Tidak ada CDN skrip setelah K-I4 (MapLibre vendor). Bila CDN apa pun ditambah: `integrity` sha384, `crossorigin`, terdaftar di `_headers`, dan gerbang. |
| Vendor | `public/vendor/maplibre/` dengan `VERSI` dan `SHA256`; `gerbang-vendor` menghitung hash (R10 §9.1). |

### 4.5 Repo publik: apa yang berubah

| Fakta | Dampak |
| --- | --- |
| Siapa pun dapat membuka PR dari fork | Rahasia tidak diberikan ke PR fork; `pull_request_target` dilarang oleh `gerbang-workflow`; persetujuan wajib untuk kontributor luar |
| Workflow terjadwal dinonaktifkan GitHub bila repo tidak ada aktivitas 60 hari `(verifikasi)` | Panen dan cadangan bisa mati diam-diam; lihat §13 butir 19 |
| Riwayat dan `docs/perencanaan/` terbaca publik | Tidak ada nama orang, surel, telepon, atau ID akun; `pindai.yml` memeriksa. Dokumen operasional memakai PERAN, bukan nama (R11 §8.9) |
| Issue dan diskusi publik | Templat issue memuat peringatan "jangan tulis data pribadi"; `SECURITY.md` mengarahkan laporan kerentanan ke kanal privat (§6.8) |
| Menit Actions | Standar gratis `(verifikasi)` |

---

## 5. Data dan penyimpanan

### 5.1 Skema prefiks R2 dan siklus hidup

DT §6 sudah memerinci prefiks, penulis, pembaca, dan cache. Tambahan INFRA: bucket, siklus hidup, dan lokasi. Aturan lifecycle R2 `(verifikasi bahwa R2 mendukung lifecycle per prefiks dan kunci bucket/retensi)`.

| Bucket | Prefiks | Siklus hidup | Alasan |
| --- | --- | --- | --- |
| `jaringan-meti` | `potret/publik/`, `potret/anggota/`, `potret/pengurus/`, `potret/manifest.json` | Tanpa kedaluwarsa; hanya ditimpa pipeline; versi lama tersalin ke cadangan mingguan | Sumber layar |
| `jaringan-meti` | `gambar/logo/` | Tanpa kedaluwarsa; dihapus atas permintaan | Logo bernama hash |
| `jaringan-meti` | `ringkasan/` | Kedaluwarsa 30 hari | TTL DT §6 |
| `jaringan-meti` | `panen/<tgl>/` | Kedaluwarsa 400 hari | Cukup untuk dua siklus panen bulanan setahun dan pembandingan susut |
| `jaringan-meti` | `panen/kurasi.json` | Ditimpa | |
| `jaringan-meti` | `privat/daftar-tolak.json` | Tanpa kedaluwarsa; pernah-berubah tersimpan di cadangan | Sensitif (KPV §3.5) |
| `jaringan-meti-cadangan` | `d1/harian/` | Kedaluwarsa 35 hari | RPO harian |
| `jaringan-meti-cadangan` | `d1/mingguan/` (Minggu terakhir) | Kedaluwarsa 60 hari (8 minggu, R10 §3.6) | |
| `jaringan-meti-cadangan` | `d1/bulanan/` (tanggal 1) | Kedaluwarsa 400 hari | Acuan audit tahunan |
| `jaringan-meti-cadangan` | `potret/mingguan/` | Kedaluwarsa 60 hari | |
| `jaringan-meti-cadangan` | `privat/daftar-tolak/` | Versi bertanggal, 400 hari | |
| `jaringan-meti-pratinjau` | semua | Kedaluwarsa 14 hari | Dummy |

Penamaan objek: huruf kecil, `^[a-z0-9_./-]{1,200}$`, tanpa `..`; kunci dibangun dari pola tetap, bukan masukan mentah (DT §6 butir 3).

### 5.2 Mengapa bucket cadangan terpisah dan tanpa binding

1. Worker tidak punya binding ke `jaringan-meti-cadangan`, jadi kode yang bocor atau SQL injeksi tidak bisa menghapus cadangan dari dalam aplikasi.
2. Kunci S3 cadangan hanya ada di Environment `cadangan`; token deploy dan token potret tidak bisa menyentuhnya.
3. Kunci bucket/retensi (bucket lock) `(verifikasi)` pada prefiks `d1/` selama 35 hari membuat cadangan tak terhapus walau kunci bocor.
4. Satu akun yang disuspend menghilangkan D1, R2, dan Worker sekaligus; karena itu ada salinan luar akun (§5.3).

### 5.3 Cadangan D1

| Lapis | Mekanisme | Frekuensi | Retensi | RPO | Menghadapi |
| --- | --- | --- | --- | --- | --- |
| 1. Time Travel | Bawaan D1, pemulihan titik waktu | Terus-menerus | 7 hari Free, 30 hari Paid `(verifikasi)` | menit | Salah ubah data, migrasi merusak |
| 2. Ekspor ke R2 cadangan | `wrangler d1 export jaringan-meti --remote --output x.sql` di `cadangan.yml`, lalu pemeriksaan, enkripsi `age`, unggah | Harian 02:43 WIB | 35 hari harian, 8 minggu mingguan, 13 bulan bulanan | 24 jam | D1 rusak berat, penghapusan tak sengaja |
| 3. Salinan luar akun | Berkas `age` yang sama disalin ke penyimpanan milik METI di penyedia lain (C-44) | Harian | 30 hari | 24 jam | Akun Cloudflare disuspend atau terkunci |

Pemeriksaan wajib di `cadangan.yml` sebelum unggah (pelajaran pangantara, `cadangan-db.yml`): ukuran > batas bawah (bukan 0); memuat `CREATE TABLE` untuk semua tabel yang diharapkan (daftar dibangkitkan dari `migrations/`); memuat baris `akun` bila produksi (cadangan tanpa akun = "DB berisi data tanpa seorang pun yang bisa masuk", R11 §3.13); jumlah baris tiap tabel dicatat ke `d1/<tgl>.json` di samping SQL. Bila salah satu gagal: job merah, surel GitHub, dan `/api/status` melaporkan `cadangan_terakhir` basi dalam 26 jam.

`d1 export` dapat memblokir tulis selama berjalan `(verifikasi)`; volume tulis METI kecil dan jadwal 02:43 WIB menghindari jam kerja.

Enkripsi: R2 dan D1 terenkripsi saat diam secara bawaan `(verifikasi)`. Di atas itu, berkas cadangan dienkripsi dengan `age` memakai kunci publik; kunci privat dipegang dua orang METI di pengelola kata sandi dan satu salinan kertas tersegel (C-43). Tanpa kunci privat, cadangan tak terbaca; karena itu kehilangan kunci adalah risiko tersendiri (OP-08) dan latihan pulih membuktikan kunci bisa dipakai.

### 5.4 Bookmark Time Travel sebelum migrasi

Langkah 2 di `rilis.yml` menjalankan `wrangler d1 time-travel info jaringan-meti` `(verifikasi)` dan menyimpan bookmark ke ringkasan job dan `cadangan/d1/rilis/<sha>.txt`. Tanpa bookmark tercatat, Time Travel tetap bisa dipakai dengan stempel waktu, tetapi bookmark mempersingkat keputusan saat panik.

### 5.5 Angka RPO dan RTO

Disepakati sebagai target (C-50 meminta persetujuan):

| Skenario | RPO | RTO | Jalur |
| --- | --- | --- | --- |
| Kode salah rilis | 0 | 15 menit | `wrangler rollback` |
| Data salah ubah, akun utuh | 5 menit | 1 jam | Time Travel ke bookmark atau stempel |
| D1 rusak, akun utuh | 24 jam | 4 jam | Impor ekspor harian ke D1 baru lalu ganti `database_id` lewat rilis |
| Potret rusak atau basi | 24 jam | 1 jam | `potret.yml` ulang atau pulihkan potret mingguan |
| Akun Cloudflare hilang atau disuspend | 24 jam | 72 jam | Akun baru, D1 dan R2 baru, impor dari salinan luar, deploy ulang, atur secret, DNS |
| Domain kedaluwarsa atau dibajak | n/a | 24 jam | Registrar METI, kunci registrar (§13 butir 29) |
| Kunci `age` hilang | n/a | tak terpulihkan untuk cadangan lama | Pencegahan: dua pemegang |
| Ketersediaan | target 99 persen per bulan (sekitar 7 jam turun), jam kerja WIB diprioritaskan | | Tanpa SLA berbayar (§7.8) |

### 5.6 Latihan pemulihan (R11 §3.13, R12 §3.7: cadangan yang belum pernah dipulihkan dianggap belum ada)

| Jenis | Frekuensi | Isi | Lulus bila |
| --- | --- | --- | --- |
| Otomatis `latihan-pulih.yml` | Bulanan, tanggal 8 | Unduh ekspor harian terbaru dari bucket cadangan, dekripsi, buat D1 `jaringan-meti-uji-pulih`, impor, `PRAGMA integrity_check`, jumlah baris tiap tabel dalam toleransi terhadap `d1/<tgl>.json`, `COUNT(*) WHERE dummy = 1` pada data produksi = 0, terapkan ulang daftar tolak (§5.8), hapus D1 sementara | Semua hijau; durasi tercatat sebagai RTO terukur |
| Manual penuh | Kuartalan, dan wajib sebelum T2 dan T3 | Pemulihan ke staging, rollback kode di staging, simulasi "akun hilang": akun uji dengan D1 dan Worker baru dari salinan luar, ukur waktu | Waktu terukur <= RTO; catatan latihan di `docs/latihan/` |
| Uji "tanpa pengembang" | Sekali sebelum T3 (OP §8.4 langkah 3) | SEK dan BIM memulihkan dari dokumen saja | Berhasil dalam satu hari |

### 5.7 Retensi dan jejak

Retensi dasar sudah di KPV §3.4. Tambahan infrastruktur: ukuran keadaan tunak diukur dan dicatat (R11 §3.14): `sesi` (14 hari), `laju` (jendela 15 menit), `jejak` (2 tahun) dipantau `kuota.yml` lewat `SELECT COUNT(*)` dengan indeks. Jejak hanya mencatat tulisan manusia dan perubahan bernilai, bukan tulisan massal pipeline (R11 §2.16); trigger append-only pada `jejak` menolak `UPDATE`, `DELETE`, dan `INSERT OR REPLACE` (R10 §2.9, JM-B07).

### 5.8 Penghapusan atas permintaan (UU PDP) dan cadangan

KPV §3.3 mewajibkan penghapusan keras dari D1, R2, indeks, potret, dan cache. Cadangan menyimpan data lama sampai kedaluwarsa. Aturan INFRA:

1. Kebijakan Privasi menyatakan: data yang dihapus dari sistem aktif bisa tetap ada di cadangan terenkripsi paling lama 35 hari (harian) dan 13 bulan (bulanan); cadangan tidak dipakai untuk pemrosesan lain. Tinjauan penasihat hukum (C-27). Bila ditolak, ubah retensi bulanan menjadi nol dan hanya simpan 35 hari.
2. Setiap penghapusan mencatat hash identitas di daftar tolak (KPV §3.3) dan baris jejak. Langkah pemulihan APA PUN dari cadangan diakhiri `scripts/rilis/terapkan-penghapusan.mjs`: menghapus ulang semua identitas di daftar tolak dan semua permintaan hapus bertanggal setelah cadangan itu dibuat, SEBELUM situs dibuka kembali. Latihan pulih memeriksanya.
3. Daftar tolak versi bertanggal juga dicadangkan terpisah (§5.1).
4. Purge cache tepi lapis publik setelah penghapusan (KPV §3.3) hanya bermakna di domain kustom (K-I7); di `workers.dev` potret publik dihapus dengan rilis ulang.

### 5.9 Kapasitas dan anggaran baris

Proyeksi skala sensus penuh (R11 §5.6: tulis anggaran baris sejak awal). Perkiraan kasar `(ukur di JM-D12)`:

| Tabel | Baris perkiraan (F1 selesai) | Catatan |
| --- | --- | --- |
| `entitas` | 3.000 sampai 10.000 | Sensus perusahaan, lembaga, orang, proyek |
| `fakta` | 30.000 sampai 150.000 | Tiga sampai lima belas per entitas |
| `ikatan` | 5.000 sampai 40.000 | Target U3 >= 1.000 |
| `jejak` | 50.000 per tahun | Hanya tulisan manusia |
| `sesi`, `laju` | ratusan | Dibersihkan sapu |

Ukuran D1 jauh di bawah 500 MB per database. Anggaran baca harian dari Worker: puluhan ribu, jauh di bawah 5 juta; pipeline kurasi menyumbang puluhan ribu baris per hari (DT §7.4 langkah 2). Bila `COUNT(*)` tak berindeks muncul, `EXPLAIN QUERY PLAN` di RU menangkapnya.

---

## 6. Keamanan infrastruktur

KPV memerinci hak aplikasi, sandi, sesi, CSRF, dan CSP. Bagian ini hanya yang menyangkut akun, pipa, dan tepi.

### 6.1 Akun Cloudflare

| Kontrol | Aturan | Bukti |
| --- | --- | --- |
| 2FA | Wajib untuk setiap anggota akun; kunci keamanan perangkat keras (FIDO2) untuk dua Super Administrator `(verifikasi harga)`; kode pemulihan disimpan di pengelola kata sandi METI dan di kertas tersegel | JM-I01 |
| Surel akun | Saat ini surel gmail tim; 2FA gmail aktif, nomor pemulihan milik organisasi, bukan pribadi | C-48 |
| Peran anggota | Super Administrator: PEMILIK dan satu orang METI (C-43). DEV: peran Workers Platform Admin atau setara yang menutup billing dan anggota `(verifikasi nama peran)`. SEK dan BIM: Read Only atau Analytics. Tidak ada akun bersama; satu orang satu login. | |
| Notifikasi | Aktifkan notifikasi Cloudflare untuk: tagihan dan penggunaan, kegagalan deploy, perubahan anggota, kenaikan pemakaian `(verifikasi daftar)`; tujuan: dua alamat | |
| Log audit akun | Ditinjau bulanan oleh SEK (siapa menambah anggota, token, mengubah DNS) `(verifikasi retensi)` | |
| Pembayaran | Kartu METI (OP §5.5 butir 3) | |

### 6.2 Token API

| Aturan | Isi |
| --- | --- |
| Lingkup | Satu token per fungsi (§4.3); tidak ada token "semua izin"; token milik akun, bukan global API key |
| Umur | 90 hari, `kuota.yml` memeriksa dan memperingatkan 14 hari sebelumnya |
| Penyimpanan | Hanya di Environment GitHub; tidak di `.dev.vars`, tidak di laptop. Login `wrangler` lokal memakai OAuth pemilik dan dicabut (`wrangler logout`) saat tidak dibutuhkan |
| Rotasi | Terjadwal tiap 90 hari, segera saat orang berganti, dan segera bila dicurigai bocor; kunci yang pernah ter-commit diputar, bukan hanya dihapus (KPV §9) |
| Bukti rotasi | Baris di `docs/RUNBOOK.md` bagian rotasi dengan tanggal dan siapa |

### 6.3 Rahasia

| Tempat | Isi | Cara |
| --- | --- | --- |
| Rahasia Worker | `OPENALEX_KEY` bila dipakai Worker, token layanan, kunci penyedia surel (C-08), `PEPPER_SANDI` bila ADR-04 memaksa | `wrangler secret put`; nama saja di `.dev.vars.example` |
| Rahasia Actions | §4.3 | Per Environment |
| Lokal | `.dev.vars` tidak dilacak; hanya nilai tiruan | |
| Super Admin pertama | Dibuat sekali lewat `scripts/rilis/buat_super.mjs` yang membaca sandi dari prompt interaktif, bukan argumen atau variabel lingkungan, dan tidak ada akun bawaan dengan sandi bawaan | JM-I07 mencatat |
| Pemindaian | `gitleaks` di `pindai.yml` dan gerbang pola kunci (KPV §9); secret scanning dan push protection GitHub | |

`/api/status` melaporkan NAMA rahasia yang wajib tetapi kosong (R11 §2.14), tidak pernah nilainya.

### 6.4 Tepi: WAF, laju, bot

Fakta kunci: aturan WAF kustom dan aturan batas laju zona hanya ada untuk domain di zona Cloudflare. Pada `*.workers.dev` tidak ada `(verifikasi)`. Konsekuensi:

| Lapis | Selama `workers.dev` | Setelah domain kustom (JM-I28) |
| --- | --- | --- |
| Laju kasar per IP untuk `/api/*` | Binding `ratelimit` (`BATAS_LAJU`) di Worker `(verifikasi)` | Aturan batas laju zona + binding |
| Laju login, aktivasi, ganti-sandi, token | Tabel `laju` di D1 plus `ratelimit`; **gagal tertutup**: bila D1 tidak terjangkau, tolak atau tunda, jangan izinkan (R11 §2.10) | sama |
| Laju pembatas biaya dan spam (pencarian, koreksi) | Boleh gagal terbuka | sama |
| WAF OWASP, Bot Fight Mode | Tidak ada | Aktifkan paket terkelola gratis `(verifikasi)` dan kecualikan kunci pemantau (§13 butir 16) |
| Blokir negara atau ASN | Tidak ada; tidak direncanakan | Hanya bila serangan |
| IP klien | `CF-Connecting-IP`, dikunci dengan hash bergaram harian (KPV §4, R11 §2.10) | sama |
| DDoS | Perlindungan L3/L4 bawaan Cloudflare | sama |
| Turnstile | Formulir publik F3 (KPV §7). Gagal tertutup di produksi bila kunci kosong (R10 §8 butir 12): gerbang boot menolak `LINGKUNGAN=produksi` dengan `DAFTAR_MANDIRI=1` tanpa kunci | JM-I23 |

Tiap rute `/api/*` menyatakan batas lajunya di tabel rute; `guard-api` memeriksa (DT §4, KPV §2 butir 5).

### 6.5 Header, CSP, dan `security.txt`

Header dan CSP: KPV §8, tanpa pengulangan; satu perubahan di sini (K-I4: tanpa `cdnjs`). Tambahan:

| Hal | Aturan |
| --- | --- |
| `/.well-known/security.txt` | Memuat `Contact:` (alamat `keamanan@` atau formulir privat), `Expires:` (maksimal 1 tahun ke depan, RFC 9116), `Preferred-Languages: id, en`, `Policy:` (tautan §6.8), `Canonical:`. Tanggal `Expires` diperiksa `kuota.yml` (gagal bila < 30 hari). Tidak ada tanda tangan PGP di F1. |
| `_headers` | Batas 100 aturan keras, peringatan di 80 (R10 §1.7); gerbang menghitung |
| `?v=<hash>` | Dibangkitkan `scripts/rilis/versi.mjs` pada salinan `public/` di runner |
| `X-Robots-Tag` | Staging dan rute terkunci `noindex` (KPV §8); lihat §2.5 |
| HSTS | `max-age=31536000; includeSubDomains` (KPV). `preload` TIDAK dipasang sampai domain final dan semua subdomain HTTPS (§13 butir 1) |

### 6.6 Biaya sebagai permukaan serangan

Penyalahgunaan yang menaikkan tagihan: pemanenan API, banjir permintaan, pemanggilan Workers AI. Pagar: batas laju (§6.4), cache, `AI_BATAS_HARIAN` di kode (penghitung harian di tabel `pengaturan` atau penampung memori dengan sapu; bentuk final di JM-I22), peran LOGIN saja untuk AI, notifikasi tagihan di dasbor pada ambang rendah (misalnya USD 5 dan USD 10) `(verifikasi)`, dan tinjauan kuota mingguan (`kuota.yml`). Tidak mengandalkan hard cap platform (K-I6).

### 6.7 Pemindaian rahasia dan dependensi

| Pemindai | Kapan | Gagal bila |
| --- | --- | --- |
| `gitleaks` | `pindai.yml` pada PR dan mingguan, plus sebelum commit lokal | Pola kunci, token, `-----BEGIN` |
| Gerbang berkas terlarang | `uji.yml` | `.dev.vars`, `daftar-tolak.json`, `*.sqlite`, `data-panen/`, `*.env`, `data/pribadi/` terlacak |
| Pola data pribadi di `docs/`, `public/`, `scripts/`, `data/` | `pindai.yml` | Surel nyata, telepon, NIK, nama pada daftar yang dilarang |
| `npm audit --omit=dev` | mingguan | Kerentanan tinggi atau kritis pada dependensi runtime (hampir tidak ada) |
| CodeQL JavaScript | PR dan mingguan | Temuan tinggi `(verifikasi tersedia untuk repo publik)` |
| `higiene-repo` (agent Haiku) | Sebelum commit besar | Sampah, salinan `* 2.*`, artefak build (R11 §8.3) |

### 6.8 Pengungkapan kerentanan

`SECURITY.md` di akar repo dan halaman `/keamanan` (atau bagian di `/privasi`): cara melapor lewat alamat `keamanan@` (privat) atau fitur pelaporan kerentanan privat GitHub `(verifikasi)`, ruang lingkup (platform produksi, bukan penyerangan terhadap data orang lain), janji tanggapan awal 5 hari kerja, tidak ada hadiah uang, perlindungan itikad baik, larangan akses data pribadi lebih dari yang perlu. Penanggung jawab penerimaan: DEV dengan salinan ke SEK. Kontak insiden pribadi dan nomor telepon TIDAK di repo (R11 §8.9); disimpan di dokumen pemilik di luar repo, lokasinya dicatat di KPV §3.7.

### 6.9 Audit log append-only

Dijalankan oleh JM-B07 (R10 §2.9). Tambahan INFRA: perubahan di luar aplikasi juga terlacak oleh sumber lain: log audit akun Cloudflare (siapa mengubah Worker, token, DNS) dan riwayat GitHub (siapa menyetujui rilis, siapa mengubah Environment). Ketiganya ditinjau bersama tiap triwulan (OP §5.5 butir 4).

### 6.10 Daftar JANGAN TIRU (larangan, bukan saran)

| No | Jangan | Asal | Gerbang atau aturan di METI |
| --- | --- | --- | --- |
| L-01 | SHA-256 tunggal untuk sandi pilihan pengguna | R10 §8.1 | PBKDF2 (JM-B02), `gerbang` memindai `sha256(` untuk sandi |
| L-02 | `'unsafe-inline'` pada CSP | R10 §8.2 | `gerbang-headers` (KPV §8 butir 7) |
| L-03 | Monolit berkas raksasa dan `any` | R10 §8.3, R11 §8.2 | Plafon ukuran berkas 400 baris per modul JS baru (kecuali port); `gerbang-ukuran` |
| L-04 | Tanpa cadangan D1 dan tanpa runbook pulih | R10 §8.4 | §5; JM-I17, JM-I18, JM-I21 |
| L-05 | Staging berbagi D1 dan R2 produksi | R10 §8.5 | §2; `gerbang-env-terpisah` |
| L-06 | Tiga versi wrangler | R10 §8.6 | Satu versi persis di `package.json`; gerbang |
| L-07 | Berkas wrangler kedua yang basi | R10 §8.7 | Satu `wrangler.jsonc`; gerbang menolak `wrangler.*.jsonc` lain |
| L-08 | Migrasi manual ke produksi, penomoran ganda, salinan nyasar `* 2.*` | R10 §8.8, R11 §8.3 | §3.5; `gerbang-migrasi-stempel`; `.gitignore` `* 2*` |
| L-09 | CI tidak jalan pada PR | R10 §8.9 | `uji.yml` pada `push` dan `pull_request`; status wajib |
| L-10 | Cache GitHub atau artifact sebagai tempat data produksi | R10 §8.10, R11 §8.10 | Data di R2 dan D1; artifact CI hanya sementara |
| L-11 | ID akun, `database_id`, dan surel pribadi di konfigurasi terlacak | R10 §8.11 | `isi-id.mjs`; gerbang `database_id` kosong |
| L-12 | Turnstile gagal terbuka di produksi | R10 §8.12 | JM-I23 |
| L-13 | Hotlink logo pihak ketiga | R10 §8.13 | Logo di R2, `img-src 'self'` |
| L-14 | MapLibre dari CDN tanpa SRI, dua jalur muat | R10 §8.14 | Vendor lokal (K-I4) |
| L-15 | Peta tidak berganti tema | R10 §8.15 | Uji tema peta (§9.5) |
| L-16 | Prompt pemilik dan log sesi di repo publik | R10 §8.17 | `pindai.yml`; `.claude/` bagian log di `.gitignore` |
| L-17 | Gerbang yang dijanjikan tetapi tidak ada (INP, dummy) | R10 §8.18, R12 §8.10 | Gerbang dipasang sejak awal walau daftar kosong (INP butir 3); butir tanpa perintah bukti ditandai `[BELUM BERGERBANG]` |
| L-18 | Dokumen aturan yang membengkak, angka basi yang ditulis tangan | R11 §8.1, §8.4 | Angka yang bisa dibangkitkan mesin dibangkitkan; dokumen ini diberi tanggal verifikasi |
| L-19 | Semua langsung ke `main` dan `--no-verify` | R11 §8.6 | Ruleset §3.3; hook menolak `--no-verify` |
| L-20 | `!==` pada rahasia, HMAC-SHA1 | R11 §8.8 | `crypto.subtle.timingSafeEqual`; SHA-256 |
| L-21 | Nama dan nomor telepon di dokumen repo publik | R11 §8.9 | §6.8, `pindai.yml` |
| L-22 | Cermin data produksi mentah ke artifact CI | R11 §8.10 | Uji memakai seed sintetis; tidak ada job yang mengunduh data produksi selain `cadangan.yml` (terenkripsi) |
| L-23 | Satu orang pemegang semua kunci | R11 §8.11 | §12.2 |
| L-24 | Gerbang dilonggarkan demi mengejar deploy | R11 §8.12 | Ongkos gerbang dirancang kecil (gerbang total < 3 menit); ambang `jaga_unggah` tidak dilemahkan (DT §7.4) |
| L-25 | Mengandalkan kewaspadaan agent paralel untuk stempel migrasi | R11 §8.13 | `gerbang-migrasi-stempel`; satu pemilik per berkas |
| L-26 | Penarik menimpa data bagus dengan data kosong | R12 §8.4 | `jaga_unggah`; panen tulis ke berkas bertanggal |
| L-27 | Artefak build terlacak di git | R12 §8.5 | `.gitignore` `artefak/`, `public/potret/`, `dist/` |
| L-28 | Build tidak deterministik (`date.today()` dalam keluaran, locale) | R12 §8.6 | Tanggal dari commit/berkas versi; `encoding="utf-8"` |
| L-29 | Formulir tiruan yang tampak nyata | R12 §8.11 | Tiap formulir menulis ke tabel, mengembalikan nomor rujukan |
| L-30 | Dua dokumen desain bertentangan tanpa wasit | R12 §8.9 | Rantai otoritas KP; dokumen ini mencatat penyimpangan di §0.2 |

---

## 7. Observabilitas dan operasi

### 7.1 Log

`observability.enabled` (DT §8.5). Log terstruktur: satu baris JSON per kejadian penting; hanya dilog bila ada pekerjaan (R10 §5.1). Galat 5xx: `console.error("rute", {id, rute, pesan})` dengan `id` UUID korelasi yang JUGA dikembalikan ke klien di badan `{kode, id}`; klien tidak pernah melihat tumpukan (R10 §5.2, R11 §5.9, KPV §5 butir 1). Tidak ada data pribadi, token, atau tautan aktivasi di log (KPV §7 baris tautan). Retensi Workers Logs pendek `(verifikasi)`; yang harus bertahan lama (jejak) ada di D1.

Pelacakan galat di luar log (Sentry dan sejenis): **tidak dipasang** di F0 sampai F2. Alasan: mengirim jejak tumpukan dan konteks ke pihak ketiga bertentangan dengan semangat KPV §3.6 butir 4 dan memperluas daftar pemroses data. Padanan WS ("Sentry atau setara"): galat 5xx tertangkap `try/catch` global, diberi `id`, ditulis ke log, dan dihitung di `/api/status` (`galat_5xx_24j` dari penghitung yang disapu, bentuk final di JM-I09), ditambah peringatan §7.4. Tabel `peristiwa_ops` (R11 §5.3) hanya bila terbukti perlu; menambahnya butuh persetujuan pemilik (aturan berhenti KP).

### 7.2 `/api/status` berbasis kesegaran

Satu rute publik, tanpa data pribadi, `Cache-Control: public, max-age=30` (R10 §5.3, R11 §5.4). Isi:

| Bidang | Arti | Sumber | Merah bila |
| --- | --- | --- | --- |
| `versi` | SHA commit | var yang diisi `rilis.yml` | tidak sama dengan SHA rilis |
| `lingkungan` | produksi atau staging | `LINGKUNGAN` | tidak sesuai harapan |
| `pemeliharaan` | benar atau salah | var | benar tanpa pengumuman |
| `potret.dibangun` | stempel waktu `potret/publik/meta.json` | potret | lebih dari 36 jam (R10 §3.1 `BATAS_JAM`) |
| `potret.entitas`, `potret.tanpa_sumber` | jumlah; baris tanpa sumber | meta | `tanpa_sumber > 0` |
| `panen.<sumber>.terakhir` | tanggal panen sukses per sumber | `panen/` | lebih dari 40 hari (bulanan) atau 9 hari (mingguan) |
| `cadangan.terakhir` | stempel `d1/<tgl>.json` terbaru | bucket cadangan lewat penanda yang ditulis `cadangan.yml` ke R2 aplikasi (Worker tidak membaca bucket cadangan) | lebih dari 26 jam |
| `sapu.terakhir` | stempel sapu cron | satu baris di tabel yang sudah ada atau penanda R2 | lebih dari 26 jam |
| `d1.ok`, `r2.ok` | satu kueri `SELECT 1` dan satu `head` | langsung | gagal |
| `rahasia_kurang` | NAMA rahasia wajib yang kosong | env | tidak kosong |
| `galat_5xx_24j` | hitungan | penghitung | di atas ambang |

Prinsip: memeriksa UMUR, bukan "tidak ada galat" (R11 §5.4). Panen yang gagal tiap hari terlihat sama dengan yang berhasil kecuali umurnya.

Rute memakai kuota Worker; panggilan dari pemantau tiap 5 menit = 288 per hari per target, tidak berarti. Pengguna tidak disarankan memanggilnya dari halaman.

### 7.3 Pemantau luar

| Pemantau | Apa | Interval | Ke mana |
| --- | --- | --- | --- |
| UptimeRobot atau setara (akun milik METI) | `GET /api/status` harus 200 DAN kata kunci `"lingkungan":"produksi"` dan tanpa `"merah"` | 5 menit `(verifikasi tingkat gratis)` | Surel dua orang + Telegram atau ntfy |
| UptimeRobot | `GET /` dan `GET /peta` dan `GET /api/potret/publik/meta` | 5 menit | sama |
| `pemantau.yml` | Pemeriksaan kedua dari GitHub: menilai kesegaran lengkap | 3 jam | Gagal job = surel GitHub ke pemilik repo |
| Masa berlaku | Domain, sertifikat, `security.txt`, token | mingguan di `kuota.yml` | Gagal job |

Pemantau luar dan pemantau GitHub saling mengawasi: tidak satu pun bergantung pada Worker yang dipantau (R11 §5.2, §5.5).

### 7.4 Peringatan: ke mana, siapa

| Tingkat | Contoh | Kanal | Penerima | Waktu tanggap |
| --- | --- | --- | --- | --- |
| P1 | Situs mati, kebocoran data, login gagal semua, cadangan > 48 jam | Telegram atau ntfy + telepon + surel | DEV dan PEMILIK, lalu SJ bila kebocoran | 1 jam jam kerja, 4 jam di luar jam kerja (usaha terbaik, C-50) |
| P2 | Potret basi > 36 jam, panen basi, kuota > 70 persen, deploy staging gagal | Surel dua alamat | DEV | 1 hari kerja |
| P3 | Token < 14 hari, `security.txt` < 30 hari, Dependabot, domain < 60 hari | Surel mingguan `kuota.yml` | PEMILIK, SEK | 1 minggu |

Kanal peringatan tidak boleh sama dengan komponen yang dipantau: tidak ada peringatan P1 yang dikirim hanya lewat Worker (R11 §5.2). WhatsApp tidak dipakai sebagai kanal peringatan (kiriman otomatis ke luar dilarang, KPV §3.6 butir 3).

### 7.5 Runbook insiden (gejala, langkah)

Berkas `docs/RUNBOOK.md` (JM-I21) ditulis dari gejala; kontak sebagai peran dengan lokasi dokumen kontak di luar repo. Kerangka dan langkah pertama:

| Gejala | Tiga langkah pertama |
| --- | --- |
| Situs mati atau 5xx semua | 1. Cek Cloudflare Status dan `/api/status`. 2. Bila baru rilis: `wrangler rollback`. 3. Bila bukan rilis: baca log, cek kuota (galat kuota Workers), cek D1 dan R2 |
| Kuota Worker atau D1 habis | 1. Pastikan penyebab (bot atau lonjakan sah) di metrik. 2. Aktifkan `PEMELIHARAAN` tulis-beku bila D1; naik ke Paid bila sah. 3. Pasang aturan laju lebih ketat; catat |
| Login gagal untuk semua | 1. Cek `/api/status` D1. 2. Cek rilis terakhir (PBKDF2, cookie). 3. Rollback; bila D1: Time Travel hanya bila data rusak |
| Potret basi atau kosong | 1. `potret.yml` terakhir (log). 2. `jaga_unggah` menolak? baca alasannya, jangan melemahkan ambang. 3. Pulihkan potret mingguan atau jalankan ulang dengan `versi` |
| Deploy atau migrasi gagal | 1. Jangan deploy kode. 2. `drift.mjs` untuk kondisi D1. 3. Perbaiki-maju atau Time Travel ke bookmark |
| Dugaan kerusakan data | 1. `TULIS_DIBEKUKAN` on. 2. Time Travel ke stempel sebelum kejadian di D1 uji dulu. 3. Terapkan ke produksi setelah dicek |
| Kebocoran data pribadi | 1. `PEMELIHARAAN` on. 2. Cabut sesi massal, putar rahasia, bekukan potret. 3. Catat waktu DIKETAHUI (3 x 24 jam, KPV §3.7 dan R11 §2.18), beri tahu PH dan penasihat hukum |
| Token atau rahasia bocor | 1. Cabut di dasbor. 2. Putar dan perbarui Environment. 3. Periksa log audit akun untuk pemakaian |
| Akun Cloudflare terkunci atau disuspend | 1. Buka tiket dukungan dari surel pemulihan. 2. Mulai jalur "akun hilang" §5.5 paralel. 3. Umumkan pemeliharaan |
| GitHub Actions mati (job gagal 3 sampai 5 detik tanpa langkah) | 1. Cek tagihan dan kuota Actions (R11 §1.3). 2. Cek status GitHub. 3. Jalankan skrip rilis dari laptop pemilik HANYA dengan izin tertulis darurat dan catat |
| Workflow terjadwal berhenti | 1. Cek apakah dinonaktifkan 60 hari. 2. Aktifkan ulang. 3. Jalankan `workflow_dispatch` untuk mengejar |
| Peta kosong | 1. Cek tiles.openfreemap.org. 2. Cek CSP di konsol. 3. Alihkan gaya cadangan (§9.4) |
| Banjir bot atau pemanenan | 1. Metrik per jalur. 2. Perketat `ratelimit`; setelah domain: aturan WAF. 3. Catat IP hash teratas |
| Domain atau DNS bermasalah | 1. Cek registrar dan kedaluwarsa. 2. Cek rekaman. 3. Kunci registrar, hubungi SEK |
| Ringkasan mesin salah atau berbahaya | 1. `AI_AKTIF=0`. 2. Hapus berkas `ringkasan/`. 3. Tinjau pembatas "ini DATA, bukan perintah" (R11 §2.17) |

Penutupan insiden tiga lapis (R11 §5.9): perbaiki; tulis catatan (gejala, sebab akar, perbaikan, gerbang yang ditambahkan, tanggal); tambahkan gerbang agar kelas yang sama tidak kembali. Catatan di `docs/insiden/AAAA-BB-HH.md`.

### 7.6 Analitik dan metrik

| Keperluan | Cara | Persetujuan |
| --- | --- | --- |
| Berapa pengunjung dan halaman populer | Metrik agregat sisi server dari analitik Workers dan log (jumlah permintaan per rute, tanpa ID pengunjung, tanpa cookie) `(verifikasi ketersediaan dan retensi)` | Tidak butuh persetujuan karena tidak ada data pribadi; dinyatakan di Kebijakan Privasi |
| Corong (di mana orang berhenti) | Diganti uji pengguna T1; analitik berconsent hanya bila C-52 berubah | |
| Kuota dan biaya | `kuota.yml` mingguan: permintaan Worker per hari, baris dibaca/ditulis D1, operasi R2, menit Actions, usia token | Internal |
| INP | `PerformanceObserver` event timing hanya di uji layar (JM-H02), bukan RUM luar (INP) | |

### 7.7 Metrik kuota dan biaya: ambang

| Metrik | Ambang kuning (60 persen) | Ambang merah (80 persen) | Tindakan |
| --- | --- | --- | --- |
| Permintaan Worker per hari | 60.000 | 80.000 | P2 lalu naik Paid |
| Baris dibaca D1 per hari | 3 juta | 4 juta | Cari kueri tak berindeks; cache; Paid |
| Baris ditulis D1 per hari | 60.000 | 80.000 | Periksa jejak massal, sapu |
| Class B R2 per bulan | 6 juta | 8 juta | Cache, domain kustom, Paid |
| Penyimpanan R2 | 6 GB | 8 GB | Kedaluwarsa panen |
| Workers AI | 60 persen `AI_BATAS_HARIAN` | 90 persen | Matikan `AI_AKTIF` |
| Menit Actions (bila privat) | 1.200 | 1.600 | Kurangi jadwal |

### 7.8 On-call sederhana untuk tim kecil

Tidak ada SLA berbayar dan tidak ada jaga 24 jam. Model:

| Lapis | Siapa | Jam | Tugas |
| --- | --- | --- | --- |
| Primer | DEV | Jam kerja WIB 08:00 sampai 18:00 hari kerja; di luar itu usaha terbaik untuk P1 | Terima P1, P2; jalankan runbook |
| Sekunder | PEMILIK | Sama | Bila primer tak merespons 30 menit; keputusan rollback dan pemeliharaan |
| Eskalasi | SJ lalu PH | Sesuai OP | Kebocoran data, pernyataan publik |
| Penanggung jawab data pribadi | belum ada (C-26) | | Notifikasi 3 x 24 jam |

Rotasi mingguan bila ada dua orang teknis. Kalender memuat pekan jaga, cuti, dan hari bebas rilis. Pelajaran pangantara: dua peran dipegang satu orang tanpa cadangan adalah titik gagal manusia (R11 §8.11); runbook ditulis supaya orang kedua bisa menjalankannya, tetapi tidak menutup masalahnya (§12.3).

---

## 8. Performa dan skala

### 8.1 Anggaran

CPU 10 ms Free dan anggaran per rute: DT §8.2, tanpa pengulangan. Tambahan INFRA:

| Hal | Aturan |
| --- | --- |
| Aset statis | Dilayani tanpa memanggil Worker (hanya jalur `run_worker_first` yang memanggil). Halaman publik `/`, `/perusahaan`, `/peta`, `/metode` adalah aset; `/p/*` dan `/wilayah/*` lewat Worker karena mengubah judul dan meta per entitas |
| Kompresi | Brotli otomatis oleh Cloudflare; JSON potret tidak diperkecil tangan |
| Muat awal | Tanpa pustaka berat di muat awal: MapLibre dan graf dimuat malas (INP); target LCP < 2,5 detik di 4G (R10 §9.9); halaman < 3 detik di Android murah (WS) |
| Anggaran muat | JS awal < 150 KB terkompres; MapLibre 773 KB hanya di `/peta` dan tab peta |
| Mengukur | `wrangler tail` dan metrik di JM-H01 |
| PBKDF2 | Satu-satunya kerja CPU berat; di Free bisa > 10 ms (ADR-04). Pemicu naik Paid sebelum T2 bila terukur |

### 8.2 Cache tepi dan potret per lapis

| Lapis | `Cache-Control` | Tempat cache | Syarat |
| --- | --- | --- | --- |
| Aset statis | `public, max-age=31536000, immutable` dengan `?v=<hash>` | Tepi, otomatis | Hash dibangkitkan `versi.mjs` |
| HTML | `no-cache` | | |
| Potret publik (F0, aset) | Ditangani aset statis | Tepi | Rilis ulang untuk memperbarui |
| Potret publik (F1, R2) | `public, max-age=300` | Cache API tepi **hanya di domain kustom** (K-I7) | JM-I28 |
| Potret anggota dan pengurus | `private, no-store`, `Vary: Cookie` | Tidak ada | KPV §2 butir 7 |
| `/api/status` | `public, max-age=30` | Tepi bila domain kustom | |
| Logo | `public, max-age=31536000, immutable` | Tepi | Nama hash |

### 8.3 Batas D1 dan R2 yang dipantau

D1 Free: 5 juta baca dan 100.000 tulis per hari, 500 MB per database `(R6 §4.1, verifikasi)`. Seluruh pembacaan layar publik berasal dari potret, jadi baca D1 hampir seluruhnya login, kurasi, dan pipeline. Tulis D1 terutama sesi dan jejak. Setiap rute berpola `COUNT(*)` tak terbatas, `LIKE '%x%'` pada tabel besar, atau tanpa indeks gagal `EXPLAIN QUERY PLAN` di RU. Parameter terikat per kueri D1 terbatas `(verifikasi angka)`; helper `idsUntukIn()` membuang null dan duplikat serta memecah (R11 §3.2).

### 8.4 Kapan naik ke Workers Paid

Naik bila SALAH SATU:

1. Sebelum T2 (peluncuran lunak anggota) karena beban dan kebutuhan CPU login, Time Travel 30 hari, dan retensi log (OP §5.3 menyebut bulan 3; INFRA menggeser ke "sebelum T2", mana yang lebih dulu).
2. CPU login PBKDF2 terukur > 10 ms (ADR-04).
3. Permintaan Worker rata-rata > 60.000 per hari tiga hari berturut.
4. Baca D1 > 3 juta per hari.
5. Class B R2 > 6 juta per bulan.
6. Perlu retensi log lebih lama untuk investigasi.

Pembayaran dengan kartu METI (C-46). Naik ke Paid tidak mengubah kode.

### 8.5 Rencana bila pengguna naik 10 kali

Asumsi awal `(estimasi, ukur di JM-H01)`: satu tampilan halaman publik memanggil 4 sampai 8 berkas potret lewat Worker dan 10 sampai 15 aset statis. Pada Free dengan potret lewat Worker, 100.000 permintaan per hari berarti sekitar 12.000 sampai 25.000 tampilan per hari. Peta dan sensus yang baru diluncurkan tidak akan melampaui itu, tetapi lonjakan media bisa.

| Langkah | Kapan | Efek |
| --- | --- | --- |
| 1. Potret publik sebagai aset statis (bukan lewat Worker) | Sudah di F0 | Permintaan potret tidak memakai kuota Worker `(verifikasi)` |
| 2. Domain kustom + cache tepi + aturan laju | Sebelum T3 | Memangkas R2 dan Worker |
| 3. Workers Paid | Sebelum T2 | Tanpa batas harian; 10 juta permintaan sertaan per bulan `(verifikasi)` |
| 4. Batasi `/api/cari` ke `cari.json` di klien | Sudah rencana DT | Tanpa kueri D1 per ketikan |
| 5. Tiles: tetap OpenFreeMap; PMTiles hanya bila Paid dan domain (§9) | F2 | Hindari menghabiskan kuota dengan ratusan ubin per tampilan |
| 6. Pertimbangkan replika baca D1 `(verifikasi ketersediaan)` | Hanya bila baca D1 jadi bottleneck | Tidak diperlukan pada skala ini |
| 7. Bot dan pemanenan | Segera | Laju + WAF |

---

## 9. Peta

Pola, modul, dan UI peta: R10 §9 dan GD/DS; tidak diulang. Yang diputuskan di sini hanya infrastruktur ubin.

### 9.1 Pustaka

MapLibre GL JS 4.7.1 (versi yang dipatok R10 §9.1) dari **vendor lokal** `public/vendor/maplibre/` (JS 772,8 KB, CSS 64 KB di poskokarhutla). Dimuat malas hanya saat tab Peta dibuka. Satu jalur muat. `gerbang-vendor` memeriksa versi dan hash. Perlu amandemen KPV §8 (K-I4).

### 9.2 Ubin: OpenFreeMap sekarang, PMTiles nanti (menyimpang dari saran R10 §9.2, dengan alasan)

| Aspek | OpenFreeMap (hosted) | PMTiles Protomaps di R2 |
| --- | --- | --- |
| Biaya | Tanpa biaya, tanpa kunci `(verifikasi syarat layanan)` | R2 murah, tetapi lihat kuota |
| Beban ke kuota Worker | Nol (ubin langsung dari host mereka) | Setiap ubin = satu permintaan Range via Worker; satu tampilan peta bisa 20 sampai 60 ubin, sehingga 100.000 permintaan per hari habis oleh sekitar 2.000 sampai 5.000 tampilan peta `(estimasi)` |
| Beban ke Class B R2 | Nol | Satu operasi per ubin, 10 juta per bulan |
| CSP | `tiles.openfreemap.org` di `connect-src` dan `img-src` (sudah di KPV §8) | `'self'` saja |
| Ketergantungan | Pihak ketiga tanpa SLA | Mandiri |
| Akses langsung bucket | Tidak perlu | Melewati Worker bertentangan dengan "tanpa akses langsung R2" (DT §6) kecuali domain kustom; bisa gunakan domain khusus bucket `(verifikasi)` |
| Ukuran | n/a | Ekstrak Indonesia hingga zoom 12 sampai 14: ukuran perlu diukur `(verifikasi, mungkin ratusan MB sampai beberapa GB)` |

Keputusan: **F1 dan F2 awal: OpenFreeMap** (sesuai KPV §8, sudah terbukti di poskokarhutla). **PMTiles** dievaluasi di JM-I31 saat memenuhi SEMUA: Workers Paid aktif, domain kustom + cache aktif, dan ada alasan (ketergantungan atau syarat layanan menjadi masalah, atau gangguan OpenFreeMap terjadi dua kali). Sebelum itu, PMTiles lewat Worker di Free dilarang karena menghabiskan kuota.

### 9.3 Lisensi dan atribusi

OpenStreetMap contributors (ODbL) dan OpenMapTiles/OpenFreeMap sesuai teks yang mereka syaratkan `(verifikasi kalimat persis)`; kontrol atribusi MapLibre tidak disembunyikan; halaman `/atribusi` memuat tabel sumber dan lisensi (turunan `docs/sumber-lapisan.md` poskokarhutla, R10 §9.13). Batas wilayah: sumber resmi yang dipakai dicatat. Data OSM yang masuk potret (pembangkit) memakai ODbL berbagi-serupa dan dipisah dari bagian CC BY (OP §2.9, C-28).

### 9.4 Cadangan bila ubin mati

Gaya jatuh-balik: gaya minimal tanpa basemap (latar polos + batas provinsi dari `public/geo/provinsi.json`) sehingga titik tetap tampil walau ubin gagal; pesan "Peta dasar tidak bisa dimuat" (R10 §9.12). Titik data bukan bagian ubin, jadi peta tetap berguna.

### 9.5 Cache, ukuran, tema

| Hal | Aturan |
| --- | --- |
| Data titik | Satu berkas ringkas `peta.json` dari potret (id, lat, lon, tipe, logo, singkatan, bobot), bukan endpoint D1 per tampilan (R10 §9.3 diadaptasi ke potret) |
| Logo | R2 dan aset; ukuran 96 px, WebP; bukan hotlink |
| Gelap/terang | `setStyle({diff:false})` + `style.load`; uji bahwa lapisan titik masih ada sesudah ganti tema (R10 §9.10) |
| Mobile | Uji 375 px; pin berkurang; sheet bawah (R10 §9.11) |
| Aksesibilitas | Tab Daftar sebagai jalur utama pembaca layar; `aria-live` "N dari M ditempatkan" (R10 §9.12) |
| Gelombang ubin | `maxBounds` Indonesia longgar |

---

## 10. Pipeline data

Skrip, sumber, gelombang, dan urutan: DT §7 dan R8. Tidak diulang. Tambahan INFRA: kuota luar, ketahanan, dan penjaga.

### 10.1 Jadwal dan kuota sumber luar

Semua angka kuota `(verifikasi di dokumentasi penyedia sebelum menulis skrip)`.

| Sumber (skrip) | Jadwal | Kunci | Batas yang diingat | Ketahanan |
| --- | --- | --- | --- | --- |
| OpenAlex (`openalex.py`) | Bulanan | `OPENALEX_KEY` + `mailto` METI | Anggaran harian per kunci; runner GitHub berbagi IP sehingga tanpa kunci mudah tercekik (DT §7.2) | Cursor tersimpan antar halaman; gagal keras bila hitungan UNIK < total diiklankan (R11 §3.3) |
| Ember, OWID, IRENASTAT, World Bank (`statistik.py`, `wb_proyek.py`) | Bulanan | tanpa kunci atau kunci gratis | CSV bulk; satu unduhan per sumber | Atribusi CC BY; IRENASTAT "lisensi belum terverifikasi" |
| OSM Overpass (`osm_pembangkit.py`) | Bulanan | tanpa kunci | Kebijakan penggunaan wajar; kueri per provinsi, jeda, satu per beberapa menit (R8) | Backoff eksponensial; tidak memecah batch saat 5xx (R11 §3.11); `User-Agent` khusus |
| BPK, JDIH ESDM (`regulasi.py`) | Mingguan | tanpa kunci | Jeda >= 2 detik, `robots.txt` dicek | |
| WRI GPPD, AESI, GEM, ORCID | Sekali atau bulanan | tanpa kunci; GEM manual | ORCID API publik punya batas per IP `(verifikasi)` | GEM diunggah manual ke `panen/` |
| API `api.metiires.or.id` (`sinkron_meti.py`) | Mingguan | tanpa kunci | Izin tertulis (C-36) | Judul, tanggal, tautan saja |
| 1001startup.id | Tidak ada panen otomatis | n/a | ADR-06 | `scripts/panen/panen_1001.mjs` dan `data-panen/` hanya lokal; `data-panen/` di `.gitignore` |

### 10.2 Penjaga

| Penjaga | Aturan | Sumber |
| --- | --- | --- |
| `jaga_unggah.mjs` | Tolak seluruh unggahan: berkas susut > 20 persen terhadap potret sebelumnya, JSON rusak, baris tanpa `sumber_url`, pola surel atau telepon di publik/anggota, kolom terlarang, id di daftar tolak, berkas > 2 MB, fakta `est` tanpa rumus | DT §7.4 langkah 6 |
| Penjaga susut total | Jumlah entitas publik turun > 10 persen terhadap potret tayang = tahan dan minta konfirmasi; di atas ambang berkas | R10 §3.1 (tambahan INFRA) |
| Penjaga kesegaran | Hasil impor/panen lebih tua dari potret tayang tidak ditayangkan; `/api/status` merah bila potret > 36 jam | R10 §3.1, R11 §3.6 |
| Penulisan atomik | Panen ke berkas bertanggal baru, tidak menimpa; kegagalan satu sumber tidak menghapus data lama; `continue-on-error` per sumber dengan anotasi `::warning` | R10 §3.3, R12 §8.4 |
| Swauji per skrip | `python skrip.py uji` memakai contoh nyata (locale angka, pemisah ribuan) sebelum menghasilkan | R11 §3.4 |
| Idempotensi | Menjalankan ulang pada masukan sama menghasilkan keluaran sama (hash `sha256` sama); `potret.mjs` tidak mengunggah berkas yang hash-nya sudah ada di `manifest.json`; kunci alami untuk upsert (R10 §3.5) | |
| Determinisme | Tanggal dari argumen atau commit, bukan jam sistem; `encoding="utf-8"`; kunci JSON diurutkan | R12 §8.6 |
| Pipa tidak menulis D1 | Pipeline hanya membaca D1 (token baca saja) dan menulis R2; baris panen naik ke kurasi lewat manusia | ADR-08 |
| Pencatatan | `potret/publik/meta.json` memuat jumlah entitas, ikatan, baris ditolak, `tanpa_sumber`, umur sumber, dan hash | DT §7.4 langkah 8 |
| Provenans (R12) | Tiap fakta membawa `sumber_url`, `tanggal_periksa`, `tingkat_bukti` dari enum `CHECK`; celah dicatat sebagai `alasan_kosong`, bukan dibuang; berkas mentah panen disimpan 400 hari dengan `sha256` (R12 §3.1 sampai 3.4, §8.1, §8.2) | KP D5 |
| Satuan | Satuan kanonik satu kolom + `satuan_asal`; pasangan tak sebanding dikosongkan dengan tanda (R11 §3.9) | |

### 10.3 Kegagalan dan pelaporan

Tiap workflow data berakhir dengan ringkasan (`$GITHUB_STEP_SUMMARY`): baris per sumber, ditolak, durasi. Kegagalan sumber = job kuning, bukan merah, selama potret sebelumnya masih segar; potret basi > 36 jam = merah (`/api/status`). Panen sumber yang sama gagal 3 kali berturut-turut: sirkuit terbuka, laporan ke P2.

---

## 11. Armada agent dan tata kelola kode

Aturan lengkap: AG. Bagian ini hanya menetapkan isinya untuk repo ini dan tambahan infrastruktur.

### 11.1 Pemasangan hari pertama (AG)

| Langkah | Isi | Bukti |
| --- | --- | --- |
| 1 | `CLAUDE_CODE_SUBAGENT_MODEL=sonnet` di `~/.claude/settings.json` (sudah) dan di `.claude/settings.json` repo | `gerbang-model-agent` |
| 2 | Salin mesin armada dari `~/Documents/GitHub/gemah-ripah` (versi ramping): `scripts/agents/build.mjs`, `ilmu.mjs`, `roster.json`, skrip `agents:build` dan `agents:check` | JM-A01 |
| 3 | Roster dengan `model:` tertulis | di bawah |
| 4 | Ilmu tiap agent di `.claude/ilmu-agent/<nama>.md`, ≥ 2000 karakter, diisi dari kode nyata; diturunkan ke agent Sonnet paralel, bukan dikerjakan di Opus | `gerbang-ilmu-agent` |
| 5 | `AGENTS.md` ramping sebagai router; `CLAUDE.md` menunjuk ke sana | JM-A01 |
| 6 | Hook SessionStart `armada-agent-proyek.mjs` akan menegur repo ber-`package.json` tanpa `roster.json`; `package.json` dibuat di JM-A02, jadi JM-A01 harus mendahuluinya atau serentak | AG |

### 11.2 Roster

| Agent | Kelas | Model | Milik atau tugas |
| --- | --- | --- | --- |
| `worker` | pengerja | sonnet | `src/**`, `migrations/**` (jalur W) |
| `layar` | pengerja | sonnet | `public/**` kecuali `_headers` dan `potret/` (jalur L) |
| `pipa` | pengerja | sonnet | `scripts/panen/**`, `scripts/potret/**` (jalur P) |
| `gerbang` | pengerja | sonnet | `tests/**` (jalur G) |
| `mekanik` | pengerja | sonnet | `.github/**`, `wrangler.jsonc`, `package.json`, `.nvmrc`, `scripts/rilis/**`, `public/_headers` (jalur M, K-I11) |
| `guard-api` | pemeriksa pola | haiku | rute `/api/*` |
| `migrasi-idempoten` | pemeriksa pola | haiku | `migrations/**` |
| `higiene-repo` | pemeriksa pola | haiku | sampah, salinan nyasar, artefak, berkas terlarang |
| `workflow-lint` (baru) | pemeriksa pola | haiku | `.github/workflows/**`: izin token, pin SHA, `timeout-minutes`, `concurrency`, larangan `pull_request_target`, nama rahasia terdaftar |
| `selera-angka` | pemeriksa pola | haiku | format angka dan tanggal |
| `security-reviewer` | pemeriksa nalar | sonnet | `src/hak.js`, `sesi.js`, `sandi.js`, header, potret |
| `infra-reviewer` (baru) | pemeriksa nalar | sonnet | `wrangler.jsonc`, `rilis.yml`, `cadangan.yml`, `scripts/rilis/**`: urutan migrasi, pemisahan lingkungan, penjaga produksi, cakupan token |
| `inp-reviewer` | pemeriksa nalar | sonnet | kontrol berchrome (INP) |

Satu pemilik per berkas; glob tak boleh tumpang tindih (gerbang). Agent tanpa `model:` diam-diam ikut Opus (AG), jadi `gerbang-model-agent` menolaknya.

### 11.3 Gerbang armada dan pengulas konteks bersih

`tests/gerbang-model-agent.test.mjs` (env ada, tiap agent bermodel) dan `tests/gerbang-ilmu-agent.test.mjs` (katalog segar, ilmu terisi, satu pemilik per berkas, jejak melewati yang tak berubah). Perubahan infrastruktur (jalur M) diperiksa `infra-reviewer` dan `workflow-lint`; sebelum T2 dan T3, JM-H03 menjalankan pengulas berkonteks bersih (agent tanpa riwayat) yang membandingkan kode dengan paket ini dan menulis `PENYELARASAN.md`, termasuk daftar "kekuatan yang haram dibongkar" (R11 §5.10) agar perbaikan tidak merusak yang benar.

### 11.4 Larangan agent deploy dan push, ditegakkan mesin

Larangan "subagent tidak commit, push, atau deploy" (TK §1) ditulis, tetapi aturan tanpa gerbang mekanis dianggap belum jadi. Penegakan:

| Lapis | Mekanisme |
| --- | --- |
| Izin Claude Code | `.claude/settings.json` `permissions.deny`: `Bash(wrangler deploy*)`, `Bash(wrangler versions deploy*)`, `Bash(wrangler rollback*)`, `Bash(wrangler r2 object*)`, `Bash(wrangler d1 migrations apply*--remote*)`, `Bash(wrangler d1 execute*--remote*)`, `Bash(wrangler secret*)`, `Bash(git push*)`, `Bash(git commit*--no-verify*)`, `Bash(gh workflow run*)`, `Bash(gh api*)`. Pola persis diverifikasi di JM-I11. |
| Hook | `.claude/hooks/blok-produksi.mjs` (PreToolUse Bash): menolak perintah yang memuat `--remote`, `wrangler deploy`, `--env produksi`, `JM_IZIN_PRODUKSI`, atau token Cloudflare; menyebut alasan. Hook terdaftar di katalog dan diuji. |
| Kredensial | Sesi agent tidak mewarisi `CLOUDFLARE_API_TOKEN` atau `GH_TOKEN` dengan hak persetujuan Environment. Persetujuan `produksi` hanya bisa oleh akun manusia. |
| Ruleset GitHub | `main` terproteksi: agent tidak bisa mendorong atau menggabung tanpa persetujuan manusia. |
| Gerbang | `gerbang-workflow` memastikan hanya `rilis.yml` yang memakai `CF_API_TOKEN_PRODUKSI`; `uji.yml` tanpa rahasia. |
| Dokumen | `AGENTS.md` memuat larangan; ilmu `mekanik` memuat daftar perintah terlarang. |

Pemeriksa dan pengulas tidak punya perkakas tulis (pola AG: pemeriksa membaca, pengerja menulis).

---

## 12. Kepemilikan dan keberlanjutan

OP §8 sudah memuat kepemilikan akun, dokumentasi minimum, dan serah terima. Tidak diulang; ini langkah teknisnya dan celah yang belum tertulis.

### 12.1 Serah terima akun ke METI (C-06, C-32)

Fakta penting: **Worker, D1, dan R2 tidak bisa dipindahkan antar akun Cloudflare** `(verifikasi)`. Memindah akun berarti membuat ulang. Karena itu dua jalur:

| Jalur | Langkah | Waktu | Kapan |
| --- | --- | --- | --- |
| A, ganti pengendali akun yang sama (disarankan bila BNPB mengizinkan) | Undang dua orang METI sebagai Super Administrator; ubah surel login utama ke surel organisasi METI atau serahkan akun gmail dengan 2FA baru; buang orang yang tak lagi berwenang; putar semua token; ganti kartu pembayaran ke kartu METI; catat di log audit | 1 hari | T2 |
| B, bangun ulang di akun METI | Buat akun baru; buat D1, R2, Worker bernama sama; `d1 export` lalu `import`; salin R2 dengan `rclone`; atur ulang secret; ganti `CF_ACCOUNT_ID` dan id di variabel Actions; ubah DNS; matikan Worker lama setelah pemantauan 7 hari | 1 sampai 3 hari | Bila C-48 jawabannya "tidak boleh di akun tim IT BNPB" |

Jalur B sekaligus latihan skenario "akun hilang" (§5.5); lakukan di staging lebih dulu. Dalam kedua jalur: URL `workers.dev` berubah bila akun berubah (subdomain akun), sehingga domain kustom sebelum T2 mengurangi dampak ke tautan, mesin pencari, dan tautan silang (OP §9.3).

Repo: pindah ke organisasi GitHub METI (OP §8.2) atau tambahkan METI sebagai pemilik organisasi `timitbnpb`; Environment dan rahasia dipasang ulang; ruleset diekspor ulang.

### 12.2 Bus factor

| Aset | Risiko saat ini | Penutup |
| --- | --- | --- |
| Akun Cloudflare | Satu surel gmail tim | Dua Super Administrator METI, kunci keamanan perangkat keras, kode pemulihan ganda |
| GitHub | Satu pemilik repo | Dua pemilik organisasi |
| Kunci `age` | Satu pemegang | Dua pemegang + kertas tersegel (C-43) |
| Pengelola kata sandi | Belum ada | Disediakan METI (C-43) |
| Domain | Belum ada | Atas nama organisasi, surel pendaftar organisasi, kunci registrar |
| Pengetahuan | Di kepala DEV | Runbook, `README` pengelola, dua rekaman layar 10 menit (OP §8.3), latihan "tanpa pengembang" |
| Tagihan | Kartu | Kartu METI; dua orang melihat |

Aturan OP §8.2 dipertahankan: tidak ada aset yang hanya bisa diakses satu orang; bila ada, itu temuan OP-08.

### 12.3 Dokumentasi serah terima

Selain OP §8.3: `docs/RUNBOOK.md` (gejala, langkah, rotasi, pulih, pindah akun), `docs/UTANG.md` (utang teknis dengan pemilik dan tenggat, terpisah dari runbook, R10 §5.5), `docs/latihan/` (catatan latihan pulih dan rollback), `docs/insiden/`, `docs/sumber-data.md` dan `/atribusi` (R10 §3.4), daftar versi kebijakan, dan peta aset ("di mana setiap hal hidup": tabel §1). Dokumen ini diberi tanggal verifikasi untuk angka kuota dan harga; peninjauan tahunan tiap Januari (OP §8.4 langkah 6).

### 12.4 Biaya bulanan proyeksi (selisih terhadap OP §5.3)

OP §5.3 menghitung Cloudflare, domain, surel, AI, dan hukum. Yang BELUM ada di OP dan ditambahkan INFRA (semua `(verifikasi)`):

| Item | Kapan | Perkiraan | Catatan |
| --- | --- | --- | --- |
| Penyimpanan cadangan luar akun | F1 | USD 0 sampai 2 per bulan | Tingkat gratis penyedia atau Drive METI (C-44) |
| Pemantau luar | F1 | USD 0 | Tingkat gratis; berbayar bila perlu interval 1 menit |
| Pengelola kata sandi | T1 | USD 0 sampai 8 per bulan | Tingkat gratis atau dua kursi tim |
| Kunci keamanan perangkat keras x2 | T1 | Rp 0,9 juta sampai 1,6 juta sekali | Untuk dua Super Administrator |
| Domain kustom | sebelum T2 | Rp 200.000 sampai 500.000 per tahun | OP §5.2 |
| Workers Paid | sebelum T2 | USD 5 per bulan | Menggeser OP bulan 3 |
| Surel transaksional | bila C-08 | USD 0 sampai 25 per bulan | OP §5.2 |

Tahun pertama infrastruktur tetap sekitar USD 100 sampai USD 300 di luar hukum dan SDM; pencatatan resmi tetap di OP §5.3.

### 12.5 Strategi keluar dan portabilitas

| Aset | Format keluar | Cara | Waktu |
| --- | --- | --- | --- |
| Data terkurasi | SQL dump D1 + potret JSON | `d1 export`, unduh `potret/` | Jam |
| Kode | Git, JavaScript standar | Berjalan di `workerd` sumber terbuka atau diporting ke Node + SQLite + penyimpanan S3 | 1 sampai 2 minggu |
| Layar | Statis, tanpa build | Dapat dilayani host statis mana pun | Hari |
| Akun pengguna | Hash PBKDF2 dengan kolom `iterasi` | Bawa apa adanya | |
| Domain dan merek | Milik METI | n/a | |
| Pipeline | Actions YAML + Python stdlib + Node | Jalankan di CI lain | Hari |

Bentuk paling murah dirawat tetap potret JSON statis di balik Worker kecil (OP §8.5); platform bisa "tidur" tanpa mati.

---

## 13. Hal yang belum terbayangkan

Tiap butir: kenapa penting, keputusan bawaan, tiket. Keputusan bawaan berlaku sampai pemilik menjawab.

| No | Hal | Kenapa penting | Keputusan bawaan | Tiket |
| --- | --- | --- | --- | --- |
| 1 | DNSSEC dan HSTS preload | DNSSEC mencegah pemalsuan jawaban DNS; HSTS preload tidak bisa ditarik cepat dan mencakup semua subdomain | DNSSEC aktif begitu domain di zona Cloudflare dan registrar mendukung `(verifikasi dukungan registrar .id/.or.id)`; HSTS preload TIDAK dipasang | JM-I28 |
| 2 | Rekaman CAA | Membatasi penerbit sertifikat | CAA mengizinkan penerbit yang dipakai Cloudflare `(verifikasi daftar)`; `iodef` ke `keamanan@` | JM-I28 |
| 3 | SPF, DKIM, DMARC | Tanpa itu surel dipalsukan atau masuk spam (WS: butir peluncuran) | Domain yang tidak mengirim surel: SPF `-all`, DMARC `p=reject`, MX nol. Bila C-08 dijawab: subdomain pengirim terpisah, DKIM dari penyedia, DMARC mulai `p=none` + laporan, naik ke `quarantine` setelah 30 hari bersih | JM-I28 |
| 4 | Alias surel privasi, keamanan, kontak | Hak subjek data 14 hari kerja (KPV §3.3) dan pelaporan kerentanan butuh alamat nyata sebelum rilis | `privasi@`, `keamanan@`, `kontak@` meneruskan ke kotak Sekretariat lewat Email Routing bila domain di zona; sebelum itu satu alamat METI yang ada | JM-I28, C-47 |
| 5 | `robots.txt`, `sitemap.xml`, `llms.txt` | Mesin pencari dan model bahasa menemukan halaman; KPV §6 sudah mengatur `Disallow` | `sitemap.xml` dibangkitkan dari potret publik; `llms.txt` ringkas dengan tautan ke `/metode`, `/atribusi`, lisensi; `robots.txt` per lingkungan | JM-I24 |
| 6 | OG, kartu X/WhatsApp, favicon, JSON-LD | Tautan yang dibagikan lewat WhatsApp adalah saluran utama METI | OG statis 1200x630 per tipe halaman; `/p/<slug>` dan `/wilayah/<prov>` dirender judul dan deskripsi di Worker; JSON-LD `Organization` dan `Dataset`; OG dinamis per profil ditunda (CPU) | JM-I24 |
| 7 | Halaman 404, 500, pemeliharaan, offline | WS: hari pertama; `not_found_handling: "404-page"` butuh `404.html` | Dirancang sesuai DS; 500 dari Worker untuk HTML, JSON untuk `/api`; semua membawa `id` korelasi | JM-I24 |
| 8 | Status page publik | Pengguna tahu apakah masalah di kita; mengurangi beban pertanyaan | Pemantau luar menyediakan halaman status publik; tautan di footer; tidak di Worker yang dipantau | JM-I29 |
| 9 | Kebijakan privasi, ketentuan, atribusi, aksesibilitas | Wajib sebelum publik (OP §6.5 butir 2); sudah ada kerangka OP §2.8 | `/privasi`, `/ketentuan`, `/atribusi`, `/metode`, `/aksesibilitas`, dwibahasa, bertanggal dan berversi; daftar penyimpanan browser (cookie `sesi`, `localStorage` bahasa dan tema) tercantum | JM-I25 |
| 10 | Aksesibilitas WCAG 2.1 AA | Kontras, fokus, label peta, pembaca layar; layanan publik diharapkan dapat diakses `(verifikasi dasar hukum)` | `axe-core` di Playwright (JM-H02) sebagai gerbang; `:focus-visible`, kontras (DS D11), `prefers-reduced-motion` | JM-I26 |
| 11 | PWA dan offline | WS meminta PWA; KP berhenti untuk fitur tak tertulis; service worker berisiko menyimpan respons berautentikasi | Manifest + ikon + halaman keadaan offline di UI; **tanpa service worker** sampai C-51 dijawab. Bila ada nanti: tidak pernah cache `/api/*` dan lapis non-publik | JM-I24, C-51 |
| 12 | Zona waktu WIB, WITA, WIT | Indonesia tiga zona; Workers dan cron UTC; bug "tanggal kemarin" (R11 §5.7) | Simpan UTC ISO-8601 `Z`; satu formatter di `i18n.js` dengan zona eksplisit (bawaan `Asia/Jakarta`, pilihan pengguna WITA/WIT); `toISOString().slice(0,10)` dilarang; kuota Workers reset 00:00 UTC = 07:00 WIB | JM-I27 |
| 13 | Data di luar negeri vs UU PDP | Cloudflare memproses di luar Indonesia; UU PDP Pasal 56 mengatur transfer lintas batas `(verifikasi pasal)` | Minimalkan: kontak hanya di lapis pengurus; Kebijakan Privasi menyebut pemroses (Cloudflare) dan lokasi (wilayah APAC); DPA Cloudflare diterima di dasbor `(verifikasi)`; cadangan diengkripsi sebelum keluar akun; tinjauan C-27 | JM-I25, JM-I34 |
| 14 | Pendaftaran PSE Lingkup Privat | Penyelenggara sistem elektronik privat di Indonesia diwajibkan terdaftar `(verifikasi, Permenkominfo 5/2020 dan penggantinya)` | Tanyakan penasihat hukum sebelum T2; bila METI sudah terdaftar untuk situs lain, periksa apakah cukup | JM-I34, C-54 |
| 15 | Cache API tidak jalan di `workers.dev` | Seluruh anggaran R2 dan CPU di DT bersandar pada cache tepi | Lihat K-I7; lapis publik sebagai aset sampai domain kustom | JM-I10, JM-I28 |
| 16 | Tantangan bot memblokir pemantau sendiri | Bot Fight Mode dan WAF dapat menantang runner GitHub yang memanggil `/api/status`; pemantau menjadi buta atau salah alarm | Aturan WAF melewatkan permintaan dengan header `x-pemantau: <PEMANTAU_TOKEN>` (hanya jalur `/api/status` dan `/`) setelah domain kustom | JM-I28 |
| 17 | URL pratinjau versi publik | Setiap versi Worker dapat memiliki URL pratinjau yang bisa dibuka siapa pun `(verifikasi)`, termasuk versi yang belum dirilis | `preview_urls: false` di semua lingkungan | JM-I02 |
| 18 | Workers Builds ganda dengan Actions | Dua pintu deploy melewati gerbang dan migrasi | Putuskan sambungan Builds; gerbang tidak bisa memeriksa dasbor, jadi dicatat di runbook dan dicek manual tiap kuartal | JM-I01 |
| 19 | Jadwal Actions mati sendiri setelah 60 hari tanpa aktivitas repo | Panen dan cadangan berhenti diam-diam | `/api/status` mengukur umur cadangan dan panen (menangkap akibatnya); kalender pengingat tiap 50 hari "buat commit kecil"; `CHANGELOG` diperbarui bulanan | JM-I20 |
| 20 | Repo publik: PR luar, issue, rahasia | Fork bisa memicu workflow; issue publik bisa memuat data pribadi | §3.3 dan §4.5; templat issue berperingatan; `SECURITY.md` | JM-I08 |
| 21 | Rotasi token dan kalender | Token tanpa umur adalah utang | 90 hari, diperiksa `kuota.yml` | JM-I20 |
| 22 | Pemulihan menghidupkan lagi data yang sudah dihapus | Melanggar hak hapus dan daftar tolak | `terapkan-penghapusan.mjs` wajib setelah pemulihan apa pun (§5.8) | JM-I18 |
| 23 | Lokasi R2 tidak dapat diubah setelah bucket dibuat | Latensi dan kepatuhan | Buat dengan petunjuk lokasi `apac` `(verifikasi flag)`, sama dengan D1 APAC | JM-I15 |
| 24 | Logo: ukuran, hak cipta, hotlink | KPV §5 butir 4, C-15; menghemat byte | Pipeline mengunduh logo dari situs resmi entitas, memeriksa magic bytes, mengecilkan ke 96 px WebP, menyimpan dengan nama hash; dihapus atas permintaan | JM-D12 (perluasan) |
| 25 | Perayap mesin pencari dan AI | Data publik berlisensi terbuka (C-28) tetapi pemanenan agresif memakan kuota | Mesin pencari diizinkan; AI tidak diblokir khusus; semua dibatasi laju; ulas setelah C-28 | C-55 |
| 26 | Batas 100 aturan `_headers` dan 20.000 berkas aset | Dua deploy poskokarhutla gagal karena `_headers` 136 aturan (R10 §1.7) | Gerbang menghitung dan memperingatkan di 80; plafon aset 15.000 berkas dan 25 MB | JM-I13 |
| 27 | Versi aset dan cache | Pengguna melihat JS lama dengan API baru | `?v=<hash isi>` oleh `versi.mjs`; API menyertakan `versi_skema` yang ditolak klien lama dengan pesan segarkan | JM-I02 |
| 28 | Kontak darurat di luar repo | Nama dan telepon di repo publik adalah kebocoran (R11 §8.9) | Dokumen kontak di pengelola kata sandi METI; repo hanya memuat peran dan lokasi | JM-I21 |
| 29 | Kedaluwarsa domain dan pembajakan | Domain mati = situs mati, surel mati | Perpanjangan otomatis, kunci registrar, surel pendaftar organisasi, pengingat 60 hari, dipantau `kuota.yml` | JM-I28 |
| 30 | Laporan penyalahgunaan Cloudflare dan GitHub | Pemberitahuan abuse masuk ke surel akun; terlewat = akun ditangguhkan | Surel akun dipantau dua orang; templat tanggapan di runbook | JM-I01 |
| 31 | Kuota harian reset 00:00 UTC | Reset 07:00 WIB: lonjakan jam kerja memakai awal kuota baru, sehingga habis kuota tampak pada sore/malam WIB | Ambang kuota dibaca per hari UTC; laporan memakai WIB | JM-I20 |
| 32 | Jendela rilis dan beku acara | Rilis saat acara METI atau hari libur menambah risiko | Selasa sampai Kamis 10:00 sampai 15:00 WIB; beku 7 hari sebelum T2 dan T3 (C-49) | JM-I07 |
| 33 | Super Admin pertama di produksi | Akun bawaan dengan sandi bawaan adalah celah klasik | Skrip interaktif sekali pakai; tanpa sandi di env/argumen; segera ganti; dicatat di jejak | JM-I07 |
| 34 | Lisensi repo publik tanpa LICENSE | Tidak jelas hak orang lain; bertentangan dengan C-31 | Pernyataan hak cipta METI di README sampai C-31 | C-42 |
| 35 | Uji AI memakai binding sungguhan | Binding `AI` selalu menyentuh akun walau lokal `(verifikasi)`; uji bisa membakar kuota | `AI_TIRUAN=1` di semua uji; gerbang menolak binding AI sungguhan di CI | JM-I22 |
| 36 | PBKDF2 ditolak runtime | Login tidak bisa dibuat | Ukur di JM-B02; lihat K-I8 | JM-I30 |
| 37 | Bahasa dan terjemahan di infrastruktur | Pesan galat, halaman 404/500/pemeliharaan, `security.txt`, surel harus dwibahasa; WS: satu bahasa per tampilan | Kunci `id.json` dan `en.json` dibawa `gerbang i18n` termasuk halaman statis infrastruktur | JM-I24 |
| 38 | Pengujian beban | Kuota dan CPU hanya terbukti dengan beban | Uji beban ringan di staging dengan `k6` atau `autocannon` lokal terhadap `wrangler dev`, BUKAN ke staging Free (memakai kuota akun yang sama) | JM-I30 |

---

## 14. Checklist siap rilis infrastruktur

Dipetakan ke WS §2 ("Checklist siap rilis"). `[ ]` = belum; centang oleh PEMILIK saat bukti ada. "Tiket" menunjuk pekerjaan yang membuatnya benar.

### 14.1 Fondasi dan teknis

| Centang | Butir WS §2 | Padanan infrastruktur | Bukti | Tiket |
| --- | --- | --- | --- | --- |
| [ ] | Token tema light/dark di satu tempat | Hanya `tema.css`; gerbang menolak palet lokal | DS, JM-C01 | JM-C01 |
| [ ] | Satu formatter angka dan tanggal | `i18n.js`; zona WIB eksplisit | JM-C06, §13 butir 12 | JM-I27 |
| [ ] | Katalog error code, `/health` dan feature flag | `/api/status` berbasis kesegaran; bendera lewat `vars` | §7.2, §3.6 | JM-I09 |
| [ ] | Tombol isi data dummy (DM) | Staging terisi; produksi hanya SA | §2.4 | JM-C05 |
| [ ] | PWA: manifest, ikon, offline | Manifest dan keadaan offline; tanpa service worker (C-51) | §13 butir 11 | JM-I24 |
| [ ] | Auth: lupa sandi, tampilkan sandi | Admin membuat tautan; KPV §4 | KPV | JM-B05 |
| [ ] | Analitik first-party berconsent, pelacak galat | Agregat sisi server tanpa cookie; log berkorelasi `id`; tanpa pihak ketiga | §7.1, §7.6 | JM-I09 |
| [ ] | Backup DB otomatis + enkripsi at-rest SEBELUM pengguna pertama | Harian, `age`, tiga lapis | §5.3 | JM-I17 |
| [ ] | Uji integrasi RLS/trigger/route (TS) | Harness D1 lokal per berkas, `cakupan.json` | §2.3 lapis 2 | JM-I35 |
| [ ] | Lighthouse >= 90 pada landing | Dijalankan di staging sebelum T3 | JM-H02 | JM-I26 |
| [ ] | Armada agent (AG) | §11 | `gerbang-model-agent`, `gerbang-ilmu-agent` | JM-A01, JM-I33 |
| [ ] | Klik tidak membekukan layar (INP) | Gerbang `gerbang-inp-transisi` sejak awal walau daftar kosong | INP butir 3 | JM-H02 |

### 14.2 Keamanan dan operasi peluncuran (daftar 20 pemilik, WS §2)

| Centang | Butir | Padanan | Bukti | Tiket |
| --- | --- | --- | --- | --- |
| [ ] | 1. Kunci API hanya di secret server | `wrangler secret`, Environment GitHub | §6.3 | JM-I08 |
| [ ] | 2. Kunci yang pernah ter-commit diputar | Pemindai + aturan putar | §6.7 | JM-I12 |
| [ ] | 3. Batas laju per pengguna/IP di tiap rute yang memakan kuota | `ratelimit` + `laju`; gerbang "tiap rute tulis punya batas" | §6.4 | JM-I22 |
| [ ] | 4. Autentikasi diperiksa di setiap rute server | `guard-api`; router menolak rute tanpa peran | KPV §2 butir 5 | JM-B03 |
| [ ] | 5. Hak akses data hanya milik sendiri | `hak.js`, 112 sel | KPV §1 | JM-B04 |
| [ ] | 6. Validasi input server | KPV §5 | KPV | JM-A05 |
| [ ] | 7. Batas pengeluaran (hard cap) di penyedia berbayar | Batas harian di kode + notifikasi tagihan; tanpa hard cap platform (K-I6) | §6.6 | JM-I22 |
| [ ] | 8. Galat ke klien tanpa tumpukan | Pembungkus galat dengan `id` | §7.1 | JM-A05 |
| [ ] | 9. Pelacakan galat yang memberi tahu | Peringatan P1/P2 dari `/api/status` + pemantau luar | §7.3, §7.4 | JM-I20 |
| [ ] | 10. Backup DB DAN uji pemulihan dijalankan | `latihan-pulih.yml` + latihan manual | §5.6 | JM-I18 |
| [ ] | 11. Halaman 404 dan 500 dirancang | `404.html`, 500 dari Worker | §13 butir 7 | JM-I24 |
| [ ] | 12. Lancar di Android murah/3G | Anggaran muat awal; peta malas | §8.1 | JM-H02 |
| [ ] | 13. Tiap halaman < 3 detik | Aset statis; uji LCP | §8.1 | JM-H02 |
| [ ] | 14. Meta dan OG agar tautan bagus di X/WhatsApp | OG per tipe halaman | §13 butir 6 | JM-I24 |
| [ ] | 15. Kebijakan privasi dan ketentuan | `/privasi`, `/ketentuan`, ditinjau hukum | §13 butir 9 | JM-I25 |
| [ ] | 16. Analitik corong | Diganti uji pengguna T1; tanpa pelacak pihak ketiga (C-52) | §7.6 | JM-I25 |
| [ ] | 17. Uji ujung ke ujung: daftar, bayar, reset sandi | Tanpa pembayaran; JM-H01 mencakup masuk, aktivasi, reset sandi, kurasi | JM-H01 | JM-H01 |
| [ ] | 18. Email tidak masuk spam: SPF, DKIM, DMARC | Domain pengirim dikonfigurasi atau domain bisu terlindungi | §13 butir 3 | JM-I28 |
| [ ] | 19. Cara pengguna menghubungi pemilik | `kontak@`, `privasi@`, formulir koreksi | §13 butir 4 | JM-I28 |
| [ ] | 20. Rencana rollback tertulis untuk hari peluncuran | §3.7 | §3.7 | JM-I07 |

### 14.3 Butir tambahan khusus infrastruktur (tidak ada di WS §2)

| Centang | Butir | Bukti | Tiket |
| --- | --- | --- | --- |
| [ ] | Workers Builds diputus; hanya Actions yang men-deploy | Tangkapan layar dasbor di catatan rilis | JM-I01 |
| [ ] | Staging D1 dan R2 terpisah (nama dan id), `crons: []` | `gerbang-env-terpisah` hijau | JM-I04 |
| [ ] | Ruleset `main` dan Environment `produksi` aktif | Ekspor ruleset | JM-I08 |
| [ ] | `/api/status` hijau dan memeriksa umur | Kunjungan manual dan pemantau | JM-I09 |
| [ ] | Pemantau luar aktif dengan dua alamat penerima | Uji alarm | JM-I20 |
| [ ] | Dua Super Administrator Cloudflare, dua pemilik GitHub, dua pemegang kunci `age` | Daftar anggota | JM-I32 |
| [ ] | Token berumur 90 hari dan terlingkup | `kuota.yml` hijau | JM-I20 |
| [ ] | Pemulihan menerapkan ulang daftar tolak | Latihan pulih | JM-I18 |
| [ ] | `security.txt` dan `SECURITY.md` aktif dengan `Expires` valid | `kuota.yml` | JM-I24 |
| [ ] | Workers Paid aktif dan notifikasi tagihan terpasang | Dasbor | JM-I30 |
| [ ] | Domain kustom, CAA, DNSSEC, DMARC | `dig` | JM-I28 |
| [ ] | Pendaftaran PSE ditentukan perlu atau tidak | Catatan hukum | JM-I34 |
| [ ] | `docs/RUNBOOK.md` diuji oleh orang kedua | Latihan "tanpa pengembang" | JM-I21 |

---

## 15. Tiket baru dan pertanyaan baru

### 15.1 Tiket JM-I (infrastruktur)

Kode JM-I01 dan seterusnya belum dipakai di TK. Fase mengikuti GD §7. Ukuran: S < setengah hari, M sekitar 1 hari, L > 1 hari. Pengerja: `mekanik`, `worker`, `layar`, `pipa`, `gerbang`, `induk`, `[manusia]`. Semua tiket yang menambah tabel, rute, atau fitur ditandai "butuh persetujuan pemilik" (aturan berhenti KP).

| ID | Judul | Pengerja | Fase | Ukuran | Bergantung | Isi singkat |
| --- | --- | --- | --- | --- | --- | --- |
| JM-I01 | `[manusia]` Rapikan akun Cloudflare | pemilik | F0 | S | | 2FA semua anggota; tambah satu Super Administrator kedua; putuskan Workers Builds pada `platformmeti`; periksa subdomain `workers.dev` akun; matikan URL pratinjau; aktifkan notifikasi; periksa surel pemulihan; catat hasil |
| JM-I02 | `wrangler.jsonc` dengan `env.staging` | mekanik | F0 | S | A02 | §2.2; `isi-id.mjs` + uji; `preview_urls: false`; `versi.mjs`; menggantikan contoh DT §8.6 |
| JM-I03 | `[manusia]` Sumber daya staging | pemilik | F0 | S | I01 | D1 `jaringan-meti-pratinjau`; variabel GitHub `D1_ID_*`, `CF_ACCOUNT_ID`; token per Environment |
| JM-I04 | Gerbang `gerbang-wrangler` dan `gerbang-env-terpisah` | gerbang | F0 | S | I02 | Binding yang dipakai `env.*` ada di tiap env; `name` tercatat; id kosong; cron <= 5 efektif; staging terpisah; versi wrangler tunggal; tanpa `wrangler.*.jsonc` lain (R10 §1.1, §1.2) |
| JM-I05 | `uji.yml` lengkap + `gerbang-workflow` | mekanik+gerbang | F0 | M | A02 | Izin token, pin SHA, `timeout-minutes`, `concurrency`, tanpa `pull_request_target`, job `uji` tanpa rahasia; `gerbang-kuota-actions` |
| JM-I06 | `staging.yml` | mekanik | F0 | M | I02, I03, I05 | Migrasi staging, deploy, `seed-staging.mjs` (hanya bila `LINGKUNGAN=staging`), smoke |
| JM-I07 | `rilis.yml` | mekanik | F0 | L | I06 | §3.2 dan §3.7: periksa SHA, bookmark Time Travel, cadangan cepat, migrasi, versions upload dan deploy, smoke, rollback otomatis, input pemeliharaan, `buat_super.mjs`, `drift.mjs`; butuh persetujuan pemilik |
| JM-I08 | `[manusia]` Pagar GitHub | pemilik+mekanik | F0 | S | I05 | Ruleset, Environments, CODEOWNERS, `dependabot.yml`, push protection, persetujuan kontributor luar, templat issue, `SECURITY.md` |
| JM-I09 | `/api/status` berbasis kesegaran | worker | F0 | M | A05 | §7.2; tidak menambah tabel (penanda di R2/aset); butuh persetujuan pemilik bila perlu penghitung galat |
| JM-I10 | Jalur potret F0 tanpa R2 | worker+pipa | F0 | M | D12 | §3.8: `bacaPotret` dengan dua penyokong, `POTRET_SUMBER`, potret publik dibangun di runner, gerbang melarang `public/potret/anggota` |
| JM-I11 | Penjaga produksi untuk laptop dan agent | mekanik+induk | F0 | S | A01 | `penjaga.mjs`, `npm run d1:*`, hook `blok-produksi.mjs`, `.claude/settings.json` deny (§11.4) |
| JM-I12 | `pindai.yml` dan pemindai pola | mekanik | F0 | S | I05 | gitleaks, berkas terlarang, pola pribadi di `docs/` dan `public/`, `npm audit`, CodeQL |
| JM-I13 | Gerbang anggaran Cloudflare | gerbang | F0 | S | I02 | Plafon aset, `_headers` <= 80 aturan, jumlah cron, menit Actions |
| JM-I14 | MapLibre vendor + `gerbang-vendor` | layar+gerbang | F1 | S | E04 | §9.1; amandemen KPV §8 `[induk]` |
| JM-I15 | `[manusia]` Aktifkan R2 dan buat bucket | pemilik | F1 | S | billing | Tiga bucket dengan lokasi `apac`, aturan siklus hidup §5.1, kunci retensi cadangan, kunci S3 terlingkup |
| JM-I16 | Migrasi potret ke R2 | worker | F1 | M | I15, D12 | §3.8 langkah 5; `r2_buckets` di `wrangler.jsonc`; `potret.yml` diaktifkan |
| JM-I17 | `cadangan.yml` | mekanik+pipa | F1 | M | I15, I19 | §5.3: ekspor, pemeriksaan, `age`, unggah, salinan luar, penanda ke R2 aplikasi untuk `/api/status` |
| JM-I18 | `latihan-pulih.yml` dan `terapkan-penghapusan.mjs` | pipa | F1 | M | I17 | §5.6, §5.8 |
| JM-I19 | `[manusia]` Salinan luar akun dan kunci `age` | pemilik | F1 | S | C-43, C-44 | Penyimpanan luar, dua pemegang kunci, kertas tersegel |
| JM-I20 | Pemantauan: `pemantau.yml`, `kuota.yml`, pemantau luar | mekanik+pemilik | F1 | M | I09 | §7.3, §7.7; umur token, `security.txt`, domain |
| JM-I21 | `RUNBOOK.md`, `UTANG.md`, templat insiden | induk | F1 | M | I07, I17 | §7.5; kontak sebagai peran |
| JM-I22 | Batas laju dan batas AI | worker | F0 | M | B03 | Binding `ratelimit`, tabel `laju`, gagal tertutup untuk auth, `AI_BATAS_HARIAN`, `AI_TIRUAN`; gerbang "tiap rute tulis punya batas" |
| JM-I23 | Turnstile di server, gagal tertutup | worker | F3 | S | G02 | §6.4 |
| JM-I24 | Halaman sistem: 404, 500, pemeliharaan, offline; `robots`, `sitemap`, `llms`, OG, favicon, manifest, `security.txt` | layar | F1 | M | E01 | §13 butir 5 sampai 7, 11 |
| JM-I25 | Halaman legal | layar+`[manusia]` | F1 | M | C-27 | `/privasi`, `/ketentuan`, `/atribusi`, `/aksesibilitas`; tinjauan hukum |
| JM-I26 | Aksesibilitas dan Lighthouse sebagai gerbang | gerbang | F1 | S | H02 | `axe-core`, Lighthouse |
| JM-I27 | Zona waktu | gerbang | F0 | S | C06 | Pemindai `toISOString().slice`, formatter WIB/WITA/WIT |
| JM-I28 | `[manusia]` Domain dan DNS | pemilik+mekanik | F2 | M | C-41 | Zona, CAA, DNSSEC, SPF/DKIM/DMARC, Email Routing, WAF/laju, Always HTTPS, TLS minimal 1.2, aturan lewat pemantau, kedaluwarsa |
| JM-I29 | Status page publik dan `/status` | layar | F2 | S | I20 | §13 butir 8 |
| JM-I30 | Naik ke Workers Paid dan ukur anggaran | pemilik+worker | F1 | S | | Ukur CPU PBKDF2 dan rute (ADR-04); notifikasi tagihan; uji beban lokal |
| JM-I31 | Evaluasi PMTiles | pipa | F2 | M | I28, I30 | §9.2: ukur ekstrak, hitung permintaan, keputusan |
| JM-I32 | `[manusia]` Serah terima akun | pemilik | F1 | M | C-43, C-48 | §12.1 jalur A atau B; token diputar; daftar anggota; kartu METI |
| JM-I33 | Gerbang armada | gerbang | F0 | S | A01 | `gerbang-model-agent`, `gerbang-ilmu-agent`, roster §11.2 (termasuk `infra-reviewer`, `workflow-lint`) |
| JM-I34 | `[manusia]` Hukum infrastruktur | pemilik | F2 | S | C-27 | PSE, lokasi data, DPA, retensi cadangan (§5.8) |
| JM-I35 | Harness uji integrasi D1 | gerbang | F0 | M | B01 | Runner yang membuat D1 lokal sementara per berkas, berhenti di galat pertama, `tests/e2e/cakupan.json` (diuji, dikecualikan, antre), penjaga host produksi (TS) |

Jumlah tiket baru: **35** (JM-I01 sampai JM-I35).

### 15.2 Pertanyaan baru untuk pemilik

Mulai C-41 karena C-21 sampai C-40 sudah ada di OP §11 (K-I2). Tiap pertanyaan punya bawaan; kerja jalan memakai bawaan sampai dijawab.

| Kode | Pertanyaan | Bawaan | Dampak bila berubah |
| --- | --- | --- | --- |
| C-41 | Domain persisnya apa, dan siapa memegang DNS-nya? Pilihan: (a) domain baru milik METI di zona Cloudflare, (b) memindah seluruh `metiires.or.id` ke Cloudflare agar `jaringan.metiires.or.id` bisa dipasang, (c) `workers.dev` terus. Menambah subdomain dari zona yang DNS-nya di tempat lain tidak bisa diarahkan ke Worker di paket Free `(verifikasi)`. | (c) sampai T1, (a) sebelum T2 | JM-I28, CSP, tautan silang, cache tepi (K-I7) |
| C-42 | Repo `timitbnpb/platformmeti` tetap publik atau privat? Publik memberi branch protection, Environments, dan menit Actions gratis; privat butuh paket berbayar `(verifikasi)`. Dan lisensi kode apa (C-31)? | Publik; README memuat hak cipta METI tanpa LICENSE | §3.3, §4.5, JM-I08 |
| C-43 | Siapa dua orang METI yang menerima akses Super Administrator Cloudflare, pemilik GitHub, dan menjadi pemegang kunci `age`? Siapa menyediakan pengelola kata sandi? | PEMILIK dan satu orang yang ditunjuk SJ; Bitwarden tingkat gratis | §12.2, JM-I19, JM-I32 |
| C-44 | Salinan cadangan di luar akun Cloudflare disimpan di mana? | Penyimpanan S3 kompatibel milik METI, terenkripsi `age`; alternatif Drive METI | JM-I17, JM-I19 |
| C-45 | Kanal peringatan P1 selain surel: Telegram, ntfy, atau lainnya, dan nomor siapa? | Surel dua alamat + Telegram grup kecil | §7.4, JM-I20 |
| C-46 | Kapan pindah ke Workers Paid dan kartu siapa yang membayar? | Sebelum T2, kartu METI | §8.4, JM-I30 |
| C-47 | Alamat `privasi@`, `keamanan@`, `kontak@`: siapa memantau dan di kotak surel mana? | Alias ke satu kotak Sekretariat | §13 butir 4 |
| C-48 | Akun Cloudflare saat ini adalah akun tim IT BNPB. Apakah ada izin tertulis menaruh data METI di sana sampai T1, dan apakah data nyata (T1 ke atas) boleh di akun itu atau harus di akun METI? Jalur serah terima A atau B (§12.1)? | Akun dipakai untuk T0 saja; data nyata di akun METI mulai T1; jalur B bila izin tidak ada | §12.1, K-I12 |
| C-49 | Jendela rilis dan beku: jam dan hari yang diizinkan? | Selasa sampai Kamis 10:00 sampai 15:00 WIB, bukan hari libur nasional, beku 7 hari sebelum T2 dan T3 | §3.7 |
| C-50 | Target ketersediaan, RPO, RTO yang disetujui METI? | 99 persen per bulan, RPO 24 jam, RTO data 4 jam, RTO akun hilang 72 jam, tanpa jaga 24 jam | §5.5, §7.8 |
| C-51 | Perlu service worker dan mode offline? | Tidak; manifest dan keadaan offline di UI saja sampai F2 | §13 butir 11 |
| C-52 | Statistik pengunjung: agregat server-side tanpa cookie cukup, atau perlu analitik berconsent? | Agregat tanpa cookie | §7.6 |
| C-53 | Peta dasar: tetap OpenFreeMap sampai ada alasan memindah ke PMTiles sendiri? | Ya; PMTiles dievaluasi di F2 | §9.2, JM-I31 |
| C-54 | Apakah METI atau platform ini perlu terdaftar sebagai PSE Lingkup Privat, dan sudah terdaftar untuk situs lain? | Tanyakan penasihat hukum sebelum T2 | JM-I34 |
| C-55 | Kebijakan terhadap perayap mesin pencari dan AI atas data publik? | Mesin pencari diizinkan; AI tidak diblokir khusus; semua dibatasi laju; ulas setelah C-28 | `robots.txt`, §13 butir 25 |

Jumlah pertanyaan baru: **15** (C-41 sampai C-55).

### 15.3 Peta ketergantungan ke fase

| Fase | Tiket JM-I |
| --- | --- |
| F0 (T0) | I01, I02, I03, I04, I05, I06, I07, I08, I09, I10, I11, I12, I13, I22, I27, I33, I35 |
| F1 (T1, T2) | I14, I15, I16, I17, I18, I19, I20, I21, I24, I25, I26, I30, I32 |
| F2 | I28, I29, I31, I34 |
| F3 | I23 |

Jalur kritis infrastruktur: I01 > I02 > I03 > I05 > I06 > I07 (alur deploy hijau) lalu I15 > I17 > I18 (cadangan terbukti) sebelum pengguna pertama. Pengguna pertama (T1) TIDAK dibuka sebelum I17 dan I18 hijau (WS: backup DB dan uji pemulihan sebelum pengguna pertama).

---

## Lampiran A. Angka dan perilaku yang harus diverifikasi sebelum dipakai

Semua baris bertanda `(verifikasi)` di dokumen ini. Verifikasi dilakukan ke dokumentasi resmi Cloudflare, GitHub, dan penyedia, tanggal cek ditulis di `docs/sumber-data.md` atau catatan rilis.

| Butir | Di mana | Risiko bila salah |
| --- | --- | --- |
| Kuota Free Workers, D1, R2, Workers AI; harga Paid | §1.1, §8 | Anggaran salah |
| Aset statis tidak menghitung sebagai permintaan Worker | §1.1, §8.5 | Kuota habis lebih cepat |
| Cache API tidak aktif pada `workers.dev` | K-I7, §3.8, §13 butir 15 | Anggaran R2 DT salah |
| Aturan WAF dan batas laju zona tidak tersedia di `workers.dev` | §6.4 | Perlindungan tepi kosong |
| Binding `ratelimit`, sintaks wrangler | §6.4 | Konfigurasi gagal |
| `preview_urls` dan perilaku URL pratinjau | §2.2, §13 butir 17 | Versi belum rilis terbuka |
| Pewarisan kunci `env` di wrangler | §2.2 | Staging mewarisi cron atau binding produksi |
| `d1 export` memblokir tulis; izin token yang diperlukan | §5.3, §4.3 | Cadangan mengganggu atau token terlalu besar |
| Time Travel retensi Free dan Paid | §5.3 | RPO salah |
| Lifecycle R2 dan kunci retensi bucket | §5.1 | Cadangan tidak kedaluwarsa atau tidak terkunci |
| Batas iterasi PBKDF2 di Workers | K-I8 | Login tidak bisa dibuat |
| Workers AI tanpa hard cap; binding AI selalu terhubung ke akun | K-I6, §13 butir 35 | Tagihan tak terduga |
| Menit Actions publik gratis; penonaktifan jadwal 60 hari | §4.5 | Panen mati diam-diam |
| Kemampuan Cloudflare memasang Worker pada subdomain dari zona DNS luar | C-41 | Rencana domain salah |
| Persyaratan PSE, UU PDP Pasal 56, DPA | §13 butir 13, 14 | Risiko hukum |
| Syarat layanan dan atribusi OpenFreeMap | §9.2, §9.3 | Pelanggaran lisensi |
| Kuota API luar (OpenAlex, Overpass, ORCID) | §10.1 | Panen diblokir |
| Ukuran ekstrak PMTiles Indonesia | §9.2 | Keputusan peta |
