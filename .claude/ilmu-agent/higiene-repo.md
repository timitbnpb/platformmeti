# Ilmu higiene-repo

> Kelas: pemeriksa · Model: haiku · Definisi: `.claude/agents/higiene-repo.md`
> Dibaca SEBELUM kerja (`node scripts/agents/ilmu.mjs baca higiene-repo`). Kasus baru
> ditambah SESUDAH kerja lewat `node scripts/agents/ilmu.mjs kasus higiene-repo "..."`.

Read-only: memindai dan melapor; tidak menyunting, tidak memutar kunci. Repo ini PUBLIK (KPV §9), jadi apa pun yang terlacak git dianggap terbaca dunia. KPV = KEAMANAN-PRIVASI.

## Peta berkas & tabel

| Yang dipindai | Cara |
| --- | --- |
| Seluruh berkas terlacak: `git ls-files` | pola kunci, berkas terlarang, data pribadi, em dash |
| `.gitignore` | harus memuat `.dev.vars`, `.wrangler/`, `*.sqlite`, `data/pribadi/`, `daftar-tolak.json`, `*.env` (KPV §9); nyata juga `.env*` dengan `!.dev.vars.example`, `node_modules/`, `data-panen/`, `.DS_Store`, `.claude/ilmu-agent/jejak/` |
| `.dev.vars.example` | hanya nama kunci (kini `OPENALEX_KEY=`), tanpa nilai |
| `wrangler.jsonc` | tanpa `account_id`; id D1/R2/Worker: lihat catatan di bawah |
| `public/**` | tanpa surel, telepon, NIK, alamat rumah; data contoh `example.org` dan akhiran "(contoh)" |
| `data/**`, `data/cerita/*.json` | teks tulisan kurator tanpa data pribadi; `data/pribadi/` tidak boleh terlacak |
| `docs/perencanaan/**` | tanpa nomor telepon/nama orang pribadi, tanpa id akun; tanpa em dash |
| `.github/workflows/*.yml` | tanpa nilai rahasia; hanya referensi `secrets.NAMA` di workflow panen/potret, tidak di `uji.yml` |
| `tests/fixtures/**` | data contoh saja; surel `@example.org`; sandi uji dibangkitkan, tidak ditulis |

Berkas yang tidak boleh terlacak sama sekali: `.dev.vars`, `daftar-tolak.json`, `*.sqlite`, `data/pribadi/`, `data-panen/` (panen mentah pihak ketiga, KP D15/ADR-06), `*.env`, `.wrangler/`, jejak agent.

## Aturan & invarian

1. **Pola kunci** (KPV §9): `-----BEGIN`, `Bearer ` diikuti token, awalan `sk-`, `AKIA`, pola `ghp_`/`xox`, string base64 panjang di `vars`. Pindai juga komentar dan fixture.
2. **Kunci yang pernah ter-commit** dilaporkan sebagai WAJIB DIPUTAR ULANG (rotate), bukan sekadar dihapus dari pohon; riwayat git masih menyimpannya. Tingkat tinggi.
3. **Id Cloudflare**: KPV §9 dan DT §8.6 meminta `wrangler.jsonc` berid KOSONG; `gerbang-rahasia` merah bila tidak. Keadaan nyata: `database_id` D1 terisi dan berkomentar bahwa pemilik membolehkan. Laporkan sebagai temuan sedang "dokumen dan berkas belum selaras", bukan kebocoran; id D1 bukan rahasia tetapi `account_id` tetap DILARANG ada.
4. **Data pribadi** (UU PDP 27/2022, KPV §3): tidak ada NIK, alamat rumah, tanggal lahir, agama, status kawin, biometrik di kolom, fixture, atau teks. Surel/telepon pribadi tidak di `public/`, potret publik, log, atau galat. Kontak darurat dan nama orang tidak di dokumen repo; simpan peran, bukan nama/nomor (R11 §8.9).
5. **Daftar tolak** (`data/daftar-tolak.json`) hanya di R2 privat, tidak di repo. Nama dari daftar itu tidak boleh muncul di berkas terlacak mana pun.
6. **Data pihak ketiga**: panen mentah 1001startup.id dan sejenisnya di `data-panen/` yang di-`.gitignore`; di repo hanya fakta yang sudah dikurasi dengan atribusi "via 1001startup.id" dan tanggal ambil, tanpa teks, estimasi, skor, atau logo mereka (KP D15, ADR-06).
7. **Em dash dan titik tengah**: tidak ada U+2014 dan U+00B7 sebagai pemisah di teks Indonesia di `public/**` dan `docs/perencanaan/*.md` (KP D17, gerbang-teks). Cari dengan `grep -rn $'\xe2\x80\x94'` dan `$'\xc2\xb7'`.
8. **Contoh data**: `example.org`, akhiran "(contoh)", surel uji `@example.org`; surel OpenAlex `mailto` memakai surel resmi METI hanya setelah pemilik memberinya (TIKET JM-C03).
9. **Sampah terlacak**: salinan Finder (`* 2.*`), `scratch*`, `*.rej`, `*.orig`, `*.sql` liar di akar, artefak build/JSON hasil tarikan besar, `.DS_Store`.
10. **Log prompt/jejak agent** tidak di repo publik (`.claude/ilmu-agent/jejak/` harus tetap di `.gitignore`; R11 §7.4).
11. **`.gitignore` tidak kehilangan entri**: bandingkan dengan daftar di atas; entri hilang = temuan tinggi.
12. Hasil laporan: temuan, tingkat, berkas:baris, tindakan. Jangan mencetak nilai rahasia yang kamu temukan: tulis berkas, baris, dan jenis polanya saja.

## Ranjau yang pernah meledak

- **ID proyek produksi, `database_id`, dan email pribadi di konfigurasi terlacak** (R10 §8 butir 11): tanpa secret scanning. Tahu: `grep -n "database_id\|@" wrangler*.jsonc`.
- **Nomor telepon dan nama orang di `docs/RUNBOOK.md`** serta ID proyek Supabase dan domain (R11 §8.9): dibenarkan "agar terbaca saat sistem mati", tetapi repo bukan tempat terkunci.
- **Log prompt pemilik di repo publik** dengan penyamaran satu lapis (R10 §8 butir 17): satu-satunya penjaga adalah fungsi penyamar.
- **Sampah di akar repo** (R11 §8.3): `.cursorrules 2`, `LICENSE 2`, `t8.sql`, `scratch/`, `seed.sql`; `bekal/` 2.355 berkas salinan lapisan global. Tahu: `git ls-files | grep -E ' 2(\.|$)'`.
- **Artefak build dan JSON tarikan besar di git** (R12 §8.5): HTML 1,6 MB, `firms_7h.json` 2,9 MB. Hanya sumber di git; berkas besar di R2.
- **Cermin data produksi mentah ke artifact CI** (R11 §8.10): memperluas permukaan UU PDP. Cadangan ke R2 privat, bukan artifact.
- **Kunci diganti `!==`/HMAC-SHA1** bukan wilayahmu, tetapi bila kamu melihat perbandingan rahasia tak konstan, teruskan ke `security-reviewer`.
- **Fail-open bila kunci kosong** (R10 §8 butir 12): `.dev.vars.example` kosong aman; konfigurasi produksi yang kosong tidak.

## Gerbang yang menghakimi

`gerbang-rahasia.test.mjs` merah bila: pola `-----BEGIN`, `Bearer `, `sk-`, `AKIA` di berkas terlacak; berkas terlarang terlacak (`.dev.vars`, `daftar-tolak.json`, `*.sqlite`, `data/pribadi/`); `.gitignore` kurang entri KPV §9; `wrangler.jsonc` berisi id bukan kosong; `.dev.vars.example` berisi nilai. `gerbang-teks.test.mjs` merah untuk U+2014 dan U+00B7. `gerbang-workflow.test.mjs` merah bila `uji.yml` memakai `secrets.` atau `pull_request_target`. `gerbang-panen.test.mjs` merah bila ada permintaan HTTP ke 1001startup.id. Kamu menangkap lebih awal (sebelum commit besar dan rilis); keputusan memutar kunci dan membersihkan riwayat ada di pemilik dan sesi induk. Gerbang statis belum semuanya ada; sebut gerbang mana yang masih belum menjaga hal yang kamu temukan.

## Kasus

Belum ada kasus. Tambahkan lewat ilmu.mjs kasus.
