# Ilmu mekanik

> Kelas: pengerja · Model: sonnet · Definisi: `.claude/agents/mekanik.md`
> Dibaca SEBELUM kerja (`node scripts/agents/ilmu.mjs baca mekanik`). Kasus baru
> ditambah SESUDAH kerja lewat `node scripts/agents/ilmu.mjs kasus mekanik "..."`.

DT = DESAIN-TEKNIS, KPV = KEAMANAN-PRIVASI, RU = RENCANA-UJI. Kamu tidak menyentuh kode aplikasi dan tidak mengubah dokumen perencanaan. Tidak commit, push, deploy.

## Peta berkas & tabel

Keadaan NYATA repo (dibaca 7 Nov 2026), bukan sekadar rencana:

| Berkas | Keadaan nyata | Aturan |
| --- | --- | --- |
| `package.json` | `name: platformmeti`, `type: module`, `engines.node >=20`; skrip `uji` (`node --test tests/`), `dev` (`wrangler dev`), `agents:build`, `agents:check`; satu devDependency `wrangler` versi `4.158.0` PERSIS | versi dipin tanpa `^` (RU §1.2); menambah alat mengubah RU §1.2 |
| `wrangler.jsonc` | `name: platformmeti`, `main: src/worker.js`, `compatibility_date 2026-11-01`, assets (`binding ASSETS`, `html_handling auto-trailing-slash`, `404-page`, `run_worker_first` 8 pola), D1 `DB`/`jaringan-meti` dengan `database_id` TERISI, blok `r2_buckets` dikomentari, `ai: AI`, cron `0 18 * * *`, observability on | tanpa `account_id`; lihat selisih dokumen di bawah |
| `.dev.vars.example` | satu baris `OPENALEX_KEY=` | hanya nama kunci, nol nilai; `.dev.vars` tidak dilacak |
| `.gitignore` | `.dev.vars`, `.wrangler/`, `*.sqlite`, `*.env`, `.env*` (kecuali `.dev.vars.example`), `node_modules/`, `data/pribadi/`, `daftar-tolak.json`, `data-panen/`, `.DS_Store`, `.claude/ilmu-agent/jejak/` | jangan kehilangan entri (KPV §9) |
| `.github/workflows/uji.yml` | `on: push, pull_request`; `permissions: contents: read`; checkout@v4, setup-node@v4 node 22 + cache npm, `npm ci`, `npm run uji` | tanpa deploy, tanpa `secrets.`, tanpa `pull_request_target` |
| `.claude/settings.json` | `env.CLAUDE_CODE_SUBAGENT_MODEL = sonnet` | wajib (gerbang-model-agent) |
| `.claude/agents/**` | DI-GENERATE dari roster | jangan sunting tangan |
| `.claude/hooks/**` | belum ada hook | tiap hook baru butuh insiden sumber (R11 §7.8) |
| `scripts/agents/{roster.json,build.mjs,ilmu.mjs}` | roster = manifest; `build.mjs` men-generate `.claude/agents/*.md` dan `KATALOG.md`; `ilmu.mjs` (`baca|cek|catat|kasus|pemilik`, plafon ilmu 40.000 byte, `ILMU_DIR` menimpa folder) | sunting roster, lalu `npm run agents:build` |

`AGENTS.md` dan `CLAUDE.md` belum ada (milik induk, JM-A01); `tests/gerbang-ilmu-agent.test.mjs` menuntut `AGENTS.md` memuat `### 1.5 Orkestrator`.

## Aturan & invarian

1. **Satu pemilik per berkas** (gerbang-ilmu-agent): menambah berkas di luar glob `milik` roster membuat pemilik nol dan gerbang merah. Berkas baru: tambahkan glob ke roster, bangun ulang.
2. **Roster lalu build**: tambah/ubah agent = sunting `scripts/agents/roster.json` (wajib `nama, kelas, model, ringkas, kapan, fokus, larangan, bisa, tidak`; pengerja wajib `milik`), jalankan `npm run agents:build`, cek `npm run agents:check` keluar 0. Model: pengerja sonnet, pemeriksa pola haiku, pemeriksa nalar sonnet, induk opus. Agent tanpa `model:` ikut Opus diam-diam.
3. **Larangan bersama** (dipaku di `build.mjs`, 4 baris: tidak deploy/unggah R2 produksi, tidak push/commit, tidak migrasi produksi, tidak melonggarkan gerbang) wajib hadir di tiap definisi agent.
4. **`wrangler.jsonc`**: tanpa `account_id` (dibaca dari login lokal atau `CLOUDFLARE_ACCOUNT_ID`); blok R2 tetap dikomentari sampai R2 aktif di akun (JM-A03); versi `wrangler` SATU di `package.json`, jangan menyebut versi lain di komentar, CI, atau gerbang (R10 §8 butir 6); jangan ada berkas wrangler ganda (R10 §8 butir 7).
5. **Cron maksimal 5** (akun Free). Terpakai 4 (DT §7.3): Worker sapu `0 18 * * *`, `panen-bulanan` `0 20 1 * *`, `panen-mingguan` `0 21 * * 0`, `potret` `0 22 * * *`. `uji.yml` tanpa jadwal. Jadwal baru = ubah DT dulu.
6. **CI**: `uji.yml` tanpa rahasia produksi; `permissions:` eksplisit minimal; tambah `timeout-minutes` per job; pemasangan alat boleh diulang, ujinya tidak; pesan yang membedakan setup jatuh dari asersi pecah (R11 §4.8). RU §6.2 merencanakan job `gerbang`, `unit`, `pipa`, `d1`, `layar` yang `needs: gerbang`; baru satu job `uji` hari ini.
7. **Skrip `npm`** RU §1.1 (`uji:gerbang`, `uji:unit`, `uji:d1`, `uji:e2e`, `uji:pipa`, `uji:layar`, `uji:siapkan`, `uji:asap`) belum ada; menambah hanya atas permintaan tiket dan setelah `gerbang` menyiapkan berkas ujinya (skrip menunjuk berkas yang tak ada = CI merah).
8. **Node**: `engines >=20`; CI memakai 22; RU §1.2 menyebut 22 LTS dengan `.nvmrc` yang belum ada. Satukan hanya bila diminta.
9. **`.dev.vars.example`** tidak pernah berisi nilai. Rahasia Actions (`OPENALEX_KEY`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`) bukan di repo.
10. **Jangan menambah workflow yang deploy** dan jangan menjalankan `wrangler deploy` atau migrasi `--remote`; hanya `--local` untuk uji.

Selisih dokumen yang kamu temui (laporkan ke induk, jangan putuskan sendiri): KPV §9, DT §8.6, dan `gerbang-rahasia` menuntut `database_id` KOSONG di repo, sedangkan `wrangler.jsonc` nyata berisi id dan berkomentar bahwa pemilik membolehkannya; DT §8.6 memberi `name: jaringan-meti`, nyata `platformmeti`; DT §8.6 mengaktifkan blok R2, nyata dikomentari. Keputusan pemilik: belum diputuskan di paket dokumen.

## Ranjau yang pernah meledak

- **Tiga versi wrangler berbeda** (R10 §8 butir 6): komentar, CI, dan `package.json` tak sepakat; wrangler@3 menolak konfigurasi. Tahu: grep `wrangler@`.
- **Berkas konfigurasi ganda basi** (R10 §8 butir 7): `wrangler.warga.jsonc` placeholder tetap dipakai satu skrip.
- **ID produksi dan email pribadi di konfigurasi terlacak** (R10 §8 butir 11): secret scanning tidak ada. Tahu: `gerbang-rahasia`.
- **CI tidak jalan di PR/push** (R10 §8 butir 9, §4.6): gerbang bergantung disiplin sesi. `uji.yml` METI jalan di keduanya.
- **Token workflow `read` memanggil Actions API** 403 (R11 §4.8) dan pemasangan alat gagal.
- **Sampah terlacak**: salinan Finder `* 2`, `scratch/`, `t8.sql` di akar (R11 §8.3). Tahu: `git ls-files | grep ' 2'`.
- **Mesin penjaga melahirkan kelas gagal baru** (R11 §8.5): pre-push 4-10 menit, kunci global berumur 11 jam, `--no-verify`. Gerbang METI harus cepat (suite statis di bawah satu menit).
- **`AGENTS.md` membengkak** 110 KB (R11 §8.1): jaga di bawah ~200 baris.
- **Artefak build dan log prompt di repo publik** (R12 §8.5, R10 §8 butir 17): `.claude/ilmu-agent/jejak/` sudah di-`.gitignore` (R11 §7.4).

## Gerbang yang menghakimi

`gerbang-rahasia` (pola kunci, berkas terlarang terlacak, `.gitignore` kurang entri KPV §9, `wrangler.jsonc` id bukan kosong, `.dev.vars.example` berisi nilai), `gerbang-workflow` (`uji.yml` tanpa `pull_request_target`/`secrets.`/`permissions: contents: read`; cron lebih dari 5), `gerbang-model-agent` (env sonnet dan tiap agent punya `model:`), `gerbang-ilmu-agent` (katalog segar, ilmu terisi, satu pemilik), `npm run agents:check`. Pemeriksa: `higiene-repo` sebelum commit besar. Sebelum selesai jalankan `npm run uji` dan `npm run agents:check`.

## Kasus

Belum ada kasus. Tambahkan lewat ilmu.mjs kasus.
