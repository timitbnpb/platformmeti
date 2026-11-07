# Ilmu gerbang

> Kelas: pengerja · Model: sonnet · Definisi: `.claude/agents/gerbang.md`
> Dibaca SEBELUM kerja (`node scripts/agents/ilmu.mjs baca gerbang`). Kasus baru
> ditambah SESUDAH kerja lewat `node scripts/agents/ilmu.mjs kasus gerbang "..."`.

RU = RENCANA-UJI, DT = DESAIN-TEKNIS, KPV = KEAMANAN-PRIVASI. Aturan induk pemilik: `~/.claude/TEST.md` (jangan disalin ke sini). Wilayahmu hanya `tests/**`; kode produksi (src, public, scripts, migrations) milik agent lain: laporkan pemiliknya, jangan sunting.

## Peta berkas & tabel

Yang SUDAH ada di repo: `tests/gerbang-model-agent.test.mjs`, `tests/gerbang-ilmu-agent.test.mjs`. Sisanya rencana RU; jangan menganggap ada sebelum dicek dengan `ls tests`.

| Lapisan (RU §1.1) | Berkas | Perintah |
| --- | --- | --- |
| Gerbang statis (tanpa DB, tanpa peramban) | `tests/gerbang-{d1,r2,rute,matriks-sinkron,matriks,headers,taksonomi,migrasi,i18n,teks,inp-transisi,kontras,token-meti,rahasia,workflow,panen,test-integrasi,model-agent,ilmu-agent,rujukan-dokumen,penyelarasan}.test.mjs` | `npm run uji:gerbang` |
| Fungsi murni | `tests/util.test.mjs`, `algo.test.mjs`, `i18n.test.mjs` (acuan `fixtures/acuan.json` dari ALG) | `npm run uji:unit` |
| D1 nyata (CHECK, trigger, FTS5) | `skema.test.mjs`, `migrasi.test.mjs`, `eksplain.test.mjs`, `cari.test.mjs`, `sapu.test.mjs` | `npm run uji:d1` |
| Hak baris | `hak.test.mjs` dibangkitkan dari `fixtures/matriks.json`: 16 baris x 7 peran = 112 sel, tiap sel terima dan DITOLAK | `node --test tests/hak.test.mjs` |
| Rute dan sesi | `rute-peran.test.mjs`, `sesi.test.mjs`, `akun.test.mjs`, `sandi.test.mjs` (di workerd), `rute/*.test.mjs` | `npm run uji:d1` |
| Alur lintas tabel | `e2e/alur.test.mjs`, `e2e/*.sql` | `npm run uji:e2e` |
| Pipeline | `hubung`, `potret`, `jaga-unggah`, `daftar-tolak`, `lembaga-gabung` (.test.mjs); `tests/panen/uji_*.py` (unittest, tanpa jaringan) | `npm run uji:pipa` |
| Layar | `tests/layar/*.spec.mjs` + `playwright.config.mjs`, `fixtures/halaman.json` | `npm run uji:layar` |
| Registri | `tests/cakupan.json` (BUKAN `tests/e2e/cakupan.json`, RU §8 butir 2), `tests/inp-daftar.json`, `tests/kontras.json` | |
| Helper | `tests/helper/{d1,akun,pekerja-uji,pesan,jam}.mjs` | |
| Fixture jahat | `tests/fixtures/gerbang/<nama>/jahat/` satu folder per gerbang | |

Keadaan nyata: `package.json` hanya punya skrip `uji` (`node --test tests/`), `dev`, `agents:*`; skrip `uji:*`, miniflare, dan Playwright di RU §1.1/§1.2 belum ada. Menambahnya milik `mekanik`: minta, jangan sunting `package.json`.

## Aturan & invarian

1. **Node `node:test` + `node:assert/strict`**, tanpa Vitest dan tanpa TypeScript (RU §1.2). Python hanya `unittest` stdlib.
2. **Mock bukan bukti** (RU §0 butir 2). Perilaku di D1/trigger/CHECK/FTS5/hak/rute diuji terhadap D1 lokal NYATA (workerd lewat Miniflare), R2 lokal, handler Worker utuh. Hanya tiga hal boleh diganti: sistem luar (OpenAlex, Overpass, Workers AI, tile) dengan fixture rekaman, jam (`kini` disuntikkan), sumber acak.
3. **Uji yang salah DITOLAK, berpasangan dengan uji terima** untuk tiap aturan hak, CHECK, trigger (KP D7; TIKET §1 butir 4). Pesan: peran, aksi, jenis data.
4. **Isolasi D1 (RU §1.3)**: baseline dibangun sekali per hash isi `migrations/` lewat `wrangler d1 migrations apply --local` (bukan `exec()` per baris yang memecah trigger); tiap berkas uji menyalin baseline; awal berkas wajib `PRAGMA foreign_keys` = 1, bila 0 harness gagal sebelum uji pertama.
5. **Invarian, bukan potret data** (RU §0 butir 4): jangan menulis "entitas berjumlah 300". Sel matriks = baris x peran dihitung dari fixture, dibandingkan dengan jumlah uji yang dibangkitkan.
6. **Pesan gagal lewat `tests/helper/pesan.mjs`** `gagal({uji, harapan, hasil, sebab, periksa})`: menyebut angka dan sebab teknis. Berhenti di galat pertama.
7. **Tiap gerbang punya penjaga "minimal N berkas terbaca"** dan fixture jahat yang HARUS membuatnya merah (RU §1.5 butir 2). Pemindai mengenali beberapa bentuk penulisan, bukan satu regex. Pengecualian per butir (handler, tabel, rute), tidak per berkas.
8. **Registri `tests/cakupan.json`** (RU §6.1): lima jenis (`rute`, `tabel`, `trigger`, `skrip`, `fungsi`) masing-masing `diuji`/`dikecualikan`/`antre` + `antre_batas`. Butir ada di TEPAT SATU daftar; `diuji` menunjuk berkas yang ada DAN yang teksnya menyebut nama butir; `dikecualikan` beralasan minimal 20 karakter; `antre` hanya boleh menyusut.
9. **Jangan melonggarkan ambang atau menghapus uji agar hijau.** Mengubah ambang/pengecualian lewat PR tersendiri, ditinjau `security-reviewer` bila menyangkut hak, header, rahasia (RU §1.5 butir 4).
10. **Data uji**: `example.org`, akhiran "(contoh)", surel `@example.org`, sandi acak per proses tidak dicetak, tanpa rahasia produksi, tanpa data pribadi nyata. Uji tidak menyentuh produksi (hanya `uji:asap`, GET saja).
11. Viewport uji layar 1440 dan 390 (RU §8 butir 1), bukan 1280.
12. **Tombol dummy DIBATALKAN** (KP K15). `gerbang-dummy`, `gerbang-dummy-layar`, `tests/e2e/05-dummy-jejak.sql`, `layar/dummy.spec.mjs`, `fixtures/dummy-halaman.json` yang dirancang RU §2.7 basi; jangan ditulis sebelum induk memutuskan nasib kolom `dummy` (belum diputuskan di paket dokumen).

## Ranjau yang pernah meledak

- **Pemindai yang berhenti membaca melapor hijau** (R11 §4.3): empat gerbang hijau atas utang nyata karena pola terlalu sempit. Tahu: nol temuan. Obat: asersi "masih menemukan N objek" dan satu kasus positif sintetis.
- **Gerbang INP dijanjikan tapi tidak ada** (R10 §4.8, §8 butir 18): hanya agent peninjau, aturan tanpa gerbang.
- **Gerbang terdaftar per berkas** (INP.md): satu pengecualian meloloskan semua handler di berkas.
- **Setup jatuh dikira uji gagal** (R11 §4.8): token default `read` memanggil Actions API, 403, tercatat "E2E GAGAL" padahal tak satu uji jalan; `apt-get` keluar 100. Obat: `permissions:` eksplisit, `timeout-minutes`, pesan yang membedakan setup jatuh dari asersi pecah.
- **Gerbang janji tanpa pemilik** (R12 §4.1, §8.10): "diuji", "dicadangkan", "RLS" hanya kalimat. Tandai `[BELUM BERGERBANG]`.
- **Janji uji regresi data tidak ditulis** (R12 §4.2): jumlah baris tak turun drastis, tak ada fakta tanpa sumber (kueri langsung, bukan mock), agregat sama pada dua impor.
- **Asersi potret membusuk** (TEST.md): empat asersi "jumlah harus 22" merah bertahun-tahun tanpa ada yang tahu.
- **Penomoran migrasi bentrok, salinan Finder "* 2"** meracuni gerbang (R11 §8.3, §8.13): gerbang-migrasi harus mengunci urutan dan hash beku.
- **Suite berat tiap push** menghabiskan menit CI (R11 §4.9): saring jalur pemicu (RU §6.2).

## Gerbang yang menghakimi

Kamu penulisnya; penghakimmu: `penulis-gerbang` (cakupan dan celah gerbang), `peninjau-bersih` (bukti perintah), `security-reviewer` untuk gerbang hak/header/rahasia. Definisi selesai (RU §7.1): perintah bukti di §7.3 keluar 0 lokal dan hijau di CI, butir baru terdaftar di `cakupan.json`, tiap gerbang punya fixture jahat merah. `gerbang-test-integrasi` merah bila butir baru tak terdaftar, `diuji` menunjuk berkas hantu, `dikecualikan` tanpa alasan, atau `antre` bertambah. `gerbang-ilmu-agent` merah bila ilmu agent di bawah 2.000 karakter atau sebuah berkas punya nol atau dua pemilik.

## Kasus

Belum ada kasus. Tambahkan lewat ilmu.mjs kasus.
- 2026-11-07 · Uji rute lewat worker.fetch dengan sesi dimasukkan via hak.catatSesi (token hex 64, cookie sesi=); terapkanMigrasi dua kali ke DB berisi gagal karena migrasi lain tak idempoten terhadap data, uji idempoten per-berkas saja.
- 2026-11-08 · gerbang-konsistensi-data: ringkas.json basi vs berkas (regulasi 430/496, berita 519/866, keuangan 145/180, karbon 195/206) dan 36 id mati (lokal-430, p_* organisasi) membuat 2 uji data-nyata merah sengaja; jalankan node scripts/pipa/konsistensi.mjs untuk memuat ulang konsistensi.json
