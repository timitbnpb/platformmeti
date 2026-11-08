# Katalog armada agent - pengetahuan orkestrator

> DI-GENERATE dari `scripts/agents/roster.json` (`npm run agents:build`). Jangan disunting tangan.
> Armada: **18 agent**. Aturan memakainya dan otoritas membuat agent baru: `AGENTS.md` §1.5.

Cara memakai katalog ini:

1. **Siapa pemilik berkasnya?** `node scripts/agents/ilmu.mjs pemilik <berkas...>`. Pengerja pemiliknya
   yang mengerjakan; berkas tanpa pemilik = kerja orkestrator, atau tanda agent baru perlu lahir.
2. **Siapa memverifikasi?** Pemeriksa yang kolom "bisa"-nya cocok, TIDAK PERNAH pengerja yang sama.
3. **Rakitan** = 1 pengerja + 1–3 pemeriksa, maksimal 4–5 jalan bersamaan.
4. Agent baru biasanya langsung terdaftar di tool Agent begitu berkasnya mendarat. Kalau namanya belum
   muncul, panggil `general-purpose` dengan prompt "Kamu adalah <nama>: baca `.claude/agents/<nama>.md`
   dan jalankan `node scripts/agents/ilmu.mjs baca <nama>` dulu".

## Pengerja wilayah - memiliki glob berkas, boleh menyunting di wilayahnya (6)

| Agent | Model | Bisa | Tidak bisa | Wilayah |
| --- | --- | --- | --- | --- |
| `worker` | sonnet | membangun dan membetulkan Worker: router, hak.js, sesi, akun, kurasi, potret, rute direktori, sapu | migrasi SQL; layar; pipeline panen; memverifikasi kerjanya sendiri | `src/**` |
| `layar` | sonnet | membangun dan membetulkan halaman, gaya, i18n, peta, tabel, admin layar | rute Worker; migrasi; pipeline; memverifikasi kerjanya sendiri | `public/**` |
| `pipa` | sonnet | membangun dan membetulkan panen, sambung, hubung, potret, gerbang unggah, workflow panen/potret | rute Worker; layar; migrasi; deploy atau unggah produksi; memverifikasi kerjanya sendiri | `scripts/panen/**`, `scripts/pipa/**`, `scripts/hukum/**` +5 |
| `migrasi` | sonnet | menulis dan membetulkan migrasi D1 baru, trigger, indeks, FTS5 | menerapkan migrasi ke produksi; menyunting migrasi yang sudah jalan; kode Worker | `migrations/**` |
| `gerbang` | sonnet | menulis uji dan gerbang, fixture, mendaftarkan cakupan | kode produksi; memverifikasi uji yang ia tulis sendiri | `tests/**` |
| `mekanik` | sonnet | merawat package.json, wrangler.jsonc, CI uji, settings, mesin agent | kode aplikasi; dokumen perencanaan; deploy | `package.json`, `package-lock.json`, `wrangler.jsonc` +9 |

## Pengerja platform - kerja menyeberang wilayah (0)

| Agent | Model | Bisa | Tidak bisa | Wilayah |
| --- | --- | --- | --- | --- |

## Pemeriksa - read-only, verifier berkonteks bersih (AGENTS.md §3.2) (12)

| Agent | Model | Bisa | Tidak bisa | Wilayah |
| --- | --- | --- | --- | --- |
| `guard-api` | haiku | memeriksa tiap handler punya gerbang peran dan jalur D1 lewat hak.js | menyunting kode; menilai logika bisnis rute | - |
| `migrasi-idempoten` | haiku | memeriksa idempotensi, penomoran, CHECK, trigger, kolom terlarang | menulis migrasi; menerapkan migrasi | - |
| `higiene-repo` | haiku | memindai repo untuk rahasia, berkas terlarang, data pribadi, id akun | menyunting; memutar kunci | - |
| `selera-angka` | haiku | memeriksa penyajian angka di layar dan potret | menyunting; memvalidasi rumus (itu validasi-model) | - |
| `hak-auditor` | haiku | memeriksa hak.js, matriks, dan jalur D1 | menyunting; menilai kriptografi (itu security-reviewer) | - |
| `i18n-guard` | haiku | membandingkan kunci dwibahasa dan mencari teks tertanam | menerjemahkan; menyunting | - |
| `security-reviewer` | sonnet | menilai keamanan sesi, sandi, CSP, XSS, kebocoran lapis akses | menyunting; menilai rumus skor | - |
| `perf-reviewer` | sonnet | menilai biaya baca D1, CPU, ukuran JSON, cache | menyunting; menilai keamanan | - |
| `inp-reviewer` | sonnet | menilai kebekuan layar pada handler interaksi | menyunting; menilai keamanan | - |
| `validasi-model` | sonnet | menilai rumus, skor, kuadran, tingkat bukti | menyunting; menilai keamanan | - |
| `penulis-gerbang` | sonnet | menilai celah cakupan dan gerbang yang hilang | menulis uji; menyunting | - |
| `peninjau-bersih` | sonnet | memverifikasi tiket selesai terhadap dokumen dan bukti perintah | menyunting; memperbaiki temuannya sendiri | - |

## Lapangan - membaca produksi (tidak dipakai di roster METI saat ini) (0)

| Agent | Model | Bisa | Tidak bisa | Wilayah |
| --- | --- | --- | --- | --- |
