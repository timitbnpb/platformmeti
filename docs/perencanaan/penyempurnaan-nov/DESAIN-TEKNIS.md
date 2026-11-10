# DESAIN-TEKNIS penyempurnaan November 2026

Otoritas: `KEPUTUSAN-METI` K21 sampai K26, D19 sampai D23, C-21 sampai C-28. MELENGKAPI `docs/perencanaan/DESAIN-TEKNIS.md` (DT-lama); tidak menyalin isinya. Rumus dan ambang ada di `ALGORITMA.md` folder ini (ALG-baru); bagian `§tier`, `§tautan`, dan seterusnya merujuk ke sana. Nama tabel dan fungsi diperiksa terhadap `migrations/0001` sampai `0037` dan `src/hak.js` per 11 Nov 2026; yang belum ada ditandai BARU.

Bagian: `§bot`, `§regulasi`, `§migrasi`, `§rute-matriks`, `§potret-tier`, `§admin-wilayah`, `§berkas-agent`, `§biaya`, Catatan untuk induk.

Aturan yang tidak berubah dan dipakai di semua bagian: (1) SATU pintu D1: semua SQL lewat `src/hak.js` (gerbang `gerbang-d1` memindai `src/**`); modul baru di `src/` memanggil fungsi `hak.*`, tidak `env.DB.prepare`. (2) Layar membaca JSON potret dari aset atau R2; D1 hanya untuk tulis dan hak (KP D2). (3) Migrasi idempoten (`IF NOT EXISTS`, `INSERT OR IGNORE`), tidak menyunting migrasi yang sudah jalan, CHECK sebagai gerbang terakhir. (4) Tiap rute baru terdaftar di `tests/e2e/cakupan.json` dan punya uji peran benar DAN peran salah (JM-S08). (5) Subagent tidak commit, push, deploy, atau migrasi produksi.

---

## §bot: arsitektur bot panen (K21; JM-T01 sampai T08)

### B.1 Gambaran

```
GitHub Actions (jadwal UTC)                         Worker cron (denyut)                 D1
 panen-harian|mingguan|bulanan|kuartalan.yml          05:30 dan 11:30 UTC                  sumber_denyut
   1. _bot.mjs: ambil sumber jatuh tempo              src/denyut.js: HEAD/ETag             denyut_putaran
      (robots, UA, jeda, berhenti 403/429)             ~80 sumber, maks 40 fetch/putaran    (0038)
   2. rantai.mjs: sambung, hubung, skor, potret
   3. job uji: npm run uji (hanya baca)               panel kesegaran (T08) =
   4. job bot_pr: cabang data-bot, PR ke main           D1 denyut + public/data/kesegaran.json
                                                        (tanggal panen dari bot)
 main = tayang publik (memori "Deploy main otomatis"): bot TIDAK pernah push ke main.
```

Pembagian (KP K21): **Actions mengambil dan membangun; Worker memantau.** Worker cron tidak mengunduh isi, tidak menjalankan `pdftotext`, tidak menulis ke repo. Hasil denyut hanya masuk D1 dan panel. OCR tetap lokal di Mac pemilik (`scripts/pipa/ocr_pdf.swift`), bukan di Actions.

### B.2 Registri sumber (JM-T01)

`data/sumber_jadwal.json` (pemilik: `pipa`), satu entri per sumber, kunci `kode` = `[a-z0-9_]{2,40}`:

```
{ kode, nama, host, url_sinyal, jenis_sinyal: etag|last_modified|panjang|tanpa,
  frekuensi: harian|mingguan|bulanan|kuartalan|tahunan|statis,
  mode: otomatis|semi_manual, jenis_waktu: aliran|rilisan, jeda_rilis_hari,
  dataset: [kunci dataset yang diturunkan], utama: true|false,
  skrip: "scripts/panen/....mjs", butuh_kunci: null|"BPS_KUNCI"|..., robots_boleh: true|false,
  status: ok|basi|gagal|blokir|perlu_kunci, gagal_beruntun, diambil, dicek }
```

Sumber `butuh_kunci` tanpa GitHub Secret otomatis berstatus `perlu_kunci` dan dilewati (C-25: BPS, EIA, Ember, Comtrade penuh). Sumber yang pernah 403/429 atau yang robots-nya melarang menjadi `blokir`, diam sampai ditinjau orang, dan tampil di antrean semi-manual (tidak dipaksa; tanpa mengakali). Daftar yang dilarang tanpa izin tetap: Antara, media sosial, login, ESDM One Map, SINTA (S04 muatan lama dibuang di JM-S04).

Salinan runtime tanpa rahasia dibangun menjadi `public/data/sumber_denyut.json` oleh `pipa` (kode, nama, host, url_sinyal, jenis_sinyal, frekuensi, interval_cek_jam, robots_boleh); Worker menyinkronkannya ke D1 di awal tiap putaran denyut lewat `env.ASSETS.fetch` (internal, bukan fetch luar).

### B.3 Pustaka tunggal `scripts/panen/_bot.mjs`

Menggantikan dua salinan UA yang terpisah (`scripts/pipa/_panen_sopan.mjs` dan `_panen_umum.mjs`, kini bertuliskan URL workers.dev) dan membungkus `ambil` yang sudah benar: UA jujur METI satu konstanta (`METI-Network-research/<versi> (+https://direktori.metiires.or.id)`), robots dibaca ulang tiap PUTARAN (cache per proses, proses = satu putaran), jeda >= 2,1 detik per host (10 detik untuk host yang ditandai lambat), satu percobaan ulang untuk 5xx, 403 menghentikan host (status `blokir`), 429 menghormati `Retry-After` sekali lalu berhenti. API:

```
jalankan({ jadwal, sumber?, kini })        // baca sumber_jadwal.json, pilih jatuh tempo, panggil skrip
ambilSopan(url, opsi)                       // = ambil() lama + hitung per host + larangan daftar hitam
catat(kode, status, rinci)                  // tulis data/bot/status.json
```

Swauji pustaka (`tests/bot_pustaka.test.mjs`): jalur yang dilarang robots ditolak tanpa fetch; 403 menghentikan host; jeda dihormati dengan jam palsu; URL Antara atau domain media sosial ditolak sebelum fetch.

### B.4 Workflow (JM-T02 sampai T05)

Pemilik berkas: `pipa` untuk `.github/workflows/panen-*.yml` dan `potret.yml` (roster); `mekanik` untuk `package.json` dan `wrangler.jsonc`.

| Berkas | Cron (UTC) | Sumber (kode katalog) | Batas waktu | Menit/bulan |
| --- | --- | --- | --- | --- |
| `panen-harian.yml` | `30 17 * * *` | berita, IDXCarbon, pengadaan publik | 25 | 450 |
| `panen-mingguan.yml` | `0 18 * * 1` | JDIH ESDM, BPK, Amdalnet, siaran pers, OpenAlex, Crossref, DOAJ, Wikidata, DPR, HBA | 90 | 240 |
| `panen-bulanan.yml` | `0 2 3 * *` | Ember, Bank Dunia, OWID, Pink Sheet, Comtrade, GEM, Gatrik, ICP, BPS, SBTi | 150 | 120 |
| `panen-kuartalan.yml` | `0 2 5 1,4,7,10 *` | DJPPR, BKPM, PSN, JETP, AIIB, GCF, IFC, OJK | 60 | 20 |

Semua punya `workflow_dispatch` dengan masukan `sumber` (kode, kosong = semua yang jatuh tempo) dan `paksa` (abaikan jatuh tempo, tetap hormati robots). Kerangka bersama:

```yaml
permissions: { contents: read }                                  # level workflow: hanya baca (K21, D23)
concurrency: { group: data-bot, cancel-in-progress: false }      # satu putaran bot pada satu waktu
jobs:
  panen:                                                         # hanya baca; memegang kunci API dari Secrets
    permissions: { contents: read }
    runs-on: ubuntu-latest
    timeout-minutes: 25
    steps:
      - uses: actions/checkout@<SHA 40 hex>
        with: { fetch-depth: 0 }
      - uses: actions/setup-node@<SHA 40 hex>
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: node scripts/panen/_bot.mjs --jadwal harian
      - run: node scripts/pipa/rantai.mjs --jadwal harian        # sambung, hubung, skor, potret (T06)
      - uses: actions/upload-artifact@<SHA 40 hex>               # hanya putih-daftar B.5 butir 2; retensi 1 hari
        with: { name: hasil-panen, path: "public/data/**\ndata/direktori/**\ndata/bot/**\nhukum/**", retention-days: 1 }
  uji:                                                           # hanya baca; gerbang sebelum ada PR
    needs: panen
    permissions: { contents: read }
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@<SHA 40 hex>
      - uses: actions/setup-node@<SHA 40 hex>
        with: { node-version: 22, cache: npm }
      - uses: actions/download-artifact@<SHA 40 hex>
        with: { name: hasil-panen }
      - run: npm ci
      - run: npm run uji                                          # tanpa kunci API dan tanpa rahasia lain
  bot_pr:                                                        # SATU-SATUNYA pemegang izin tulis
    needs: uji
    permissions: { contents: write, pull-requests: write, issues: write }
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@<SHA 40 hex>
        with: { fetch-depth: 0 }
      - uses: actions/download-artifact@<SHA 40 hex>
        with: { name: hasil-panen }
      - run: node scripts/pipa/bot_pr.mjs --jadwal harian         # kode dari main, bukan dari artefak; stage putih-daftar
        env: { GH_TOKEN: "${{ secrets.GITHUB_TOKEN }}" }
```

Aturan izin (K21, D23): `permissions` level workflow selalu `contents: read`; job `panen` dan `uji` hanya baca; `contents: write`, `pull-requests: write`, dan `issues: write` hanya ada di job `bot_pr`, yang tidak memegang kunci API dan tidak menjalankan skrip dari artefak (hanya menyalin jalur putih-daftar). Tanpa `write-all` dan tanpa scope `workflow`. Gerbang statis RENCANA-UJI §6.3 menagih ini.

Catatan teknis: (a) PR yang dibuat dengan `GITHUB_TOKEN` TIDAK memicu `uji.yml` (aturan GitHub), jadi gerbang dijalankan di job `uji` sebelum `bot_pr` (`npm run uji`) dan hasilnya ditulis di badan PR (D23); tidak memakai PAT atau GitHub App. (b) Sumber kunci disuntik dari Secrets (`BPS_KUNCI`, `EIA_KUNCI`, `EMBER_KUNCI`, `COMTRADE_KUNCI`), tidak pernah dicetak ke log. (c) Workflow terjadwal GitHub dinonaktifkan setelah 60 hari repo tanpa aktivitas; PR dan commit `data-bot` termasuk aktivitas, jadi aman selama bot jalan. (d) Cron GitHub bisa terlambat beberapa menit; bot tidak bergantung pada jam tepat (pakai `kini` dari runner, tanggal UTC).

### B.5 Rantai, cabang `data-bot`, dan PR (JM-T06)

`scripts/pipa/rantai.mjs` merangkai urutan DT-lama §7.4 menjadi satu perintah: panen -> sambung -> hubung -> skor -> `potret.mjs` -> `jaga_unggah`. 65 skrip yatim (audit): tiap skrip dipasang ke satu langkah rantai di `scripts/pipa/rantai.json` ATAU dicatat sebagai pensiun di `scripts/pensiun.md` dengan alasan; gerbang `rantai.tak-ada-yatim` menagihnya.

Aturan `bot_pr.mjs`:
1. `git switch -C data-bot origin/main` (cabang dibangun ulang dari `main` tiap putaran, jadi PR selalu satu dan berbasis `main` terbaru).
2. Stage hanya putih-daftar: `public/data/**`, `data/direktori/**`, `data/bot/**`, `hukum/**`. Selain itu ditolak (galat), agar bot tidak menyentuh kode.
3. **Tulis hanya bila isi berubah.** Cap `dibangun_pada` diabaikan saat membandingkan (hash isi tanpa medan itu). Tanpa ini setiap hari menulis ulang `organisasi.json` (1,2 MB) dan riwayat git tumbuh sekitar 440 MB per tahun.
4. Tidak ada perubahan: selesai, tidak ada PR kosong.
5. Commit `data-bot: <jadwal> <YYYY-MM-DD>`, `git push --force-with-lease origin data-bot`.
6. `gh pr list --head data-bot`: bila belum ada, `gh pr create --base main --head data-bot`; bila ada, `gh pr edit` (satu PR bergulir).
7. Badan PR (`data/bot/ringkasan.md`, dibangun skrip): per dataset baris tambah/ubah/hapus; sumber gagal beserta `gagal_beruntun`; cakupan tautan sebelum-sesudah (ALG-baru T.5); indeks kesegaran; hasil `npm run uji`. Merge dilakukan pemilik; bot tidak pernah auto-merge (K21).
8. Satu sumber gagal TIDAK menggagalkan putaran (`continue-on-error` per sumber di `_bot.mjs`, status ditulis ke `data/bot/status.json`). `gagal_beruntun >= 3` (di job `bot_pr`, izin `issues: write`): `gh issue create --label data-bot --title "data-bot: <kode> gagal 3 kali berturut-turut"`, hanya bila belum ada isu terbuka berjudul sama. Keluaran lama dipertahankan; `diambil` tidak berubah, layar menampilkan umurnya.

Pemeriksa PR: `higiene-repo` (rahasia, id akun, data pribadi, em dash), diwujudkan sebagai bagian `npm run uji`.

### B.6 Denyut di Worker cron (JM-T07)

`wrangler.jsonc`: `"triggers": { "crons": ["0 18 * * *", "30 5 * * *", "30 11 * * *"] }` (paket Free memperbolehkan 5 trigger; verifikasi di dokumentasi Cloudflare, belum dicek). `src/worker.js` `scheduled(ev, env, ctx)` bercabang menurut `ev.cron`: `"0 18 * * *"` tetap menjalankan `hak.sistem.sapu`, `perbaruiRentang`, `perbaruiSosmed` (tanpa perubahan); dua jadwal lain memanggil `denyut(env)`.

`src/denyut.js` (BARU; pemilik `worker`):

```js
export const BATAS_FETCH = 40, PARALEL = 5, JEDA_HOST_MS = 2000, MAKS_PER_HOST = 3, BATAS_WAKTU_MS = 25000;
// 40 fetch + 2 operasi D1 = 42 < 50: aman terhadap batas 50 subrequest paket Free (konservatif).
export async function denyut(env, kini = Math.floor(Date.now() / 1000)) {
  await hak.sistem.denyutSinkron(env);                               // upsert dari ASSETS public/data/sumber_denyut.json
  const due = await hak.sistem.denyutJatuhTempo(env, kini, BATAS_FETCH);
  // 1 query: aktif=1 AND robots_boleh=1 AND status NOT IN ('blokir','perlu_kunci') AND jatuh_tempo<=kini
  //          ORDER BY jatuh_tempo, kode LIMIT 40
  // per sumber: HEAD url_sinyal dengan If-None-Match/If-Modified-Since, redirect manual, AbortSignal.timeout(8000)
  //   304 atau etag/last_modified/panjang sama -> tak berubah; beda -> berubah (berubah_pada = kini)
  //   405/501 -> satu GET Range bytes=0-0 (menghitung 2 subrequest)
  //   403 atau 429 -> status 'blokir' (berhenti, tidak dicoba lagi sampai admin mengaktifkan)
  //   5xx atau timeout -> gagal_beruntun + 1; status 'gagal'; sukses -> 0 dan 'ok'
  // jatuh_tempo = kini + interval_cek_jam*3600 + (crc(kode) % 900)   // jitter deterministik
  await hak.sistem.denyutCatat(env, hasil, putaran);                  // SATU batch D1
}
```

Aturan: tidak mengambil robots.txt di Worker (menambah subrequest); bendera `robots_boleh` ditulis bot mingguan dari pembacaan robots dan dibawa lewat `sumber_denyut.json`. Maksimal 3 sumber per host per putaran dan jeda 2 detik antar sumber satu host. Berhenti lebih awal bila fetch mencapai 40 atau 25 detik berlalu (`alasan_henti` dicatat). Fungsi baru di `hak.js`: `denyutSinkron`, `denyutJatuhTempo`, `denyutCatat`, `denyutDaftar` (untuk panel); semuanya dalam `sistem`/admin sesuai pola `sapu`. `sapu` diperluas menghapus `denyut_putaran` lebih tua dari 90 hari.

Beban denyut per hari (perkiraan dari katalog): harian 5 sumber x 2 = 10; mingguan 13 x 1 = 13; bulanan 10 x 0,5 = 5; kuartalan 8/7 = 1,1; tahunan 6/7 = 0,9; semi-manual dan statis sekitar 38 / 7 = 5,4; total sekitar 35 fetch per hari, bahkan bila fallback GET menggandakan jadi 71, di bawah kapasitas 2 x 40 = 80.

### B.7 Panel kesegaran (JM-T08)

`public/admin_kesegaran.js` (pemilik `layar`) membaca `GET /api/admin/kesegaran`, dilayani `src/` (pemilik `worker`): menggabung D1 `sumber_denyut` (dicek, berubah, status) dengan `public/data/kesegaran.json` (178 dataset: kunci, frekuensi, jenis_waktu, tanggal_data, tanggal_periksa, masukan) dibaca lewat `env.ASSETS.fetch` (tanpa D1). Status dihitung SAAT dibaca memakai fungsi murni ALG-baru §kesegaran (modul bersama `public/inti/kesegaran_rumus.js`, dipakai Worker dan layar, gaya `kelayakan_rumus.js`). Pembangun `kesegaran.json`: `scripts/pipa/kesegaran_bangun.mjs` (menggantikan versi 16 dataset) membaca `sumber_jadwal.json` dan tanggal tiap dataset.

---

## §regulasi: teks peraturan di GitHub (K22; JM-U01 sampai U07)

### R.1 Jalur dan penamaan

`hukum/<jenis>/<tahun>/<id>.md` di akar repo (BUKAN di `public/`, jadi tidak ikut aset Worker: `wrangler.jsonc` `assets.directory = ./public`). `<id>` = `hukum_dok.id` yang ada (mis. `permen-panrb-37-2017`, `perda-prov-kalimantan-utara-8-2025`); `<jenis>` = token sebelum tanda hubung pertama pada `id` (`uu`, `pp`, `perpres`, `keppres`, `inpres`, `permen`, `perda`, `pergub`, `perbup`, `perwal`, `pojk`, `lain`); `<tahun>` = `tahun`. Katalog saat ini 622 dokumen: permen 279, perda 105, pp 59, perpres 55, pergub 34, keppres 30, perbup 19, uu 19, lain 9, perwal 7, inpres 5, pojk 1. Id dengan tanda hubung ganda (mis. `pergub--jakarta-5-2026`) ditulis dengan tanda hubung tunggal di nama berkas dan `id_lama` mencatat aslinya; gerbang menolak berkas tanpa padanan satu-ke-satu dengan `hukum_dok.id`.

Pustaka tidak menyimpan PDF mentah (R2 atau tautan sumber; hanya `pdf_sha256`). Indeks `hukum/_indeks.json` (id, jenis, tahun, status, relasi) dibangun dari frontmatter oleh `scripts/hukum/ekspor_md.mjs`, tidak diedit tangan. Perkiraan ukuran 60 sampai 100 MB (seed lokal 62 MB); satu berkas maksimal 10 MB (gerbang memberi galat di atasnya; UU besar bisa mendekati).

### R.2 Frontmatter (YAML, kunci diurut tetap)

```
---
id: permen-esdm-5-2025            # = hukum_dok.id (setelah normalisasi tanda hubung)
id_lama: null                      # id asli bila dinormalisasi
regulasi_id: permen-esdm-5-2025    # tautan ke public/data/regulasi.json
jenis: Peraturan Menteri
nomor: "5"                         # string
tahun: 2025
judul: ...                         # dari halaman 1 PDF (U05), bukan dari katalog
tgl_tetap: 2025-03-01              # null bila tak terbaca (141 dokumen saat ini)
tgl_undang: 2025-03-08             # null bila tak terbaca
status: berlaku                    # berlaku | diubah | dicabut | dicabut_sebagian | rancangan | tidak_diketahui
status_per: 2026-11-11             # tanggal terakhir diperiksa
mulai: 2025-03-08
mulai_perkiraan: false             # true bila tgl_undang kosong dan mulai = tgl_tetap
selesai: null                      # mulai regulasi yang mencabutnya
mencabut: []                       # id atau {id, pasal: ["3","4"]}
mengubah: []
mengganti: []
mengingat: [uu-30-2009]
merujuk: []
dicabut_oleh: null                 # TURUNAN dari mencabut regulasi lain
diubah_oleh: []                    # TURUNAN
topik: [ebt, tarif]
sumber: { situs: peraturan.bpk.go.id, url: ..., pdf_sha256: <64 hex>, diambil: 2026-11-11, etag: <opsional> }
ekstraksi: { metode: pdftotext, halaman: 49, halaman_ocr: 0, mutu: 1.0, perlu_tinjau: false }
resmi: false                       # salinan JDIH/BPK, bukan naskah otentik (Lembaran Negara/Berita Negara)
lisensi: { dasar: "UU 28/2014 Pasal 42", diperiksa_naskah: false }   # true setelah JM-U01 memeriksa naskah resmi
---
```

`ekstraksi.metode` ∈ `pdftotext`, `ocr-vision`, `manual`. Berkas hasil OCR: `perlu_tinjau: true` dan pengutipan angka dari berkas itu bertingkat `cuplikan` (ALG-baru §dampak E1) sampai dibaca orang.

### R.3 Isi dan segmen

Urutan baku (menjadi `hukum_segmen.jenis`): judul (`# <judul>`) -> `## Menimbang` (`menimbang`) -> `## Mengingat` (`mengingat`) -> `## Memutuskan` (`menetapkan`) -> bab bila ada (`## BAB I <judul>`, kolom `bab`) -> `### Pasal N` (`pasal`; satu pasal satu segmen, anchor GitHub otomatis `#pasal-n`) -> `## Penjelasan` dengan `### Penjelasan Pasal N` (`penjelasan`) -> `## Lampiran` (`lampiran`; tabel Markdown bila bisa, kalau tidak tautan ke PDF dan `lain`). Pasal lebih dari 6.000 karakter (batas CHECK `hukum_segmen.teks`) dipecah pada batas ayat `(n)` dan diberi penanda `<!-- bagian 2 -->` di awal bagian lanjutan.

**Invarian bolak-balik** (uji `hukum.md-ke-segmen-identik`): mengurai berkas md kembali menghasilkan baris `hukum_segmen` yang sama (jumlah, `jenis`, `label`, hash `teks`) dengan seed yang dipakai `0029_hukum.sql`. D1 tetap berisi indeks FTS untuk `/api/hukum/cari` (derived); GitHub adalah sumber teks (K22).

### R.4 Relasi dua arah dan status (JM-U06)

Frontmatter menyimpan hanya relasi KELUAR (`mencabut`, `mengubah`, `mengganti`, `mengingat`, `merujuk`); `dicabut_oleh` dan `diubah_oleh` ditulis skrip sebagai turunan terbalik. Gerbang `hukum.relasi-dua-arah`: untuk semua pasangan, `A.mencabut` memuat B jika dan hanya jika `B.dicabut_oleh` memuat A. Relasi menunjuk dokumen di luar katalog dicatat `terdaftar: false` di `_indeks.json` (sama dengan `hukum_relasi.terdaftar`). Status dihitung `berlakuPada` (ALG-baru §dampak D.1) dari relasi; siklus atau pertentangan masuk `hukum_kurasi`. Cek mingguan memakai `sumber.etag` halaman detail BPK; bila relasi berubah, bot membuka isu `hukum-relasi`.

### R.5 Pemeriksaan di tiket (gerbang)

| Tiket | Gerbang |
| --- | --- |
| U01 | 622 berkas lolos skema frontmatter; id unik; path sesuai; `md_sha256` konsisten; `polaPribadi` (ALG-lama 13.2) kosong (nama pejabat penanda tangan diizinkan, surel/telepon/NIK tidak); `lisensi.diperiksa_naskah` HARUS diisi benar-benar sebelum rilis, bila belum build berlabel "pra-rilis" |
| U02, U03 | 50 target nasional dan 38 Perda RUED: tiap target punya berkas, atau baris `data/hukum/target_kosong.json` dengan alasan; tidak ada nomor dikarang |
| U04 | `halaman_ocr` dan `mutu` terisi untuk 51 pindaian; 125 gagal diulang dan sisa gagal diberi alasan |
| U05 | nomor/judul dari halaman 1 PDF; beda dengan katalog masuk `hukum_kurasi` jenis `nomor_beda` |
| U06 | `hukum.relasi-dua-arah`, `berlakuPada.*` (ALG-baru) |
| U07 | `dampak.json` (turunan, di `public/data/`) lolos uji acuan dan target cakupan ALG-baru D.6 |

Tidak ada tabel D1 untuk `dampak`: hasilnya JSON potret (`public/data/dampak_regulasi.json`, dipecah `.n.json` bila lebih dari 1,6 MB), sehingga layar tetap membaca JSON (KP D2).

---

## §migrasi: skema D1 0038 ke atas per tiket

### M.1 Kebiasaan (tambahan DT-lama §3.7)

Nama berkas `00NN_<topik>.sql`, satu berkas per tiket yang butuh skema, nomor urut tetap (tidak menyusun ulang yang sudah dijalankan). Tidak ada `ALTER TABLE ... ADD COLUMN` (tidak idempoten; pola pendamping seperti `profil_tambah` 0019). Setiap tabel: `CREATE TABLE IF NOT EXISTS`, indeks `IF NOT EXISTS`, trigger `IF NOT EXISTS`, nilai awal `INSERT OR IGNORE`. Tanggal teks bentuk `YYYY-MM-DD` dijaga `GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]'`; waktu epoch `INTEGER DEFAULT (unixepoch())`. Pemeriksa: `migrasi-idempoten`. Pengerja: `migrasi`. Uji: eksekusi migrasi DUA KALI di D1 lokal tanpa galat dan jumlah baris sama (uji `migrasi.idempoten-dua-kali`, `tests/migrasi.test.mjs`).

Rekap:

| Berkas | Tiket | Tabel |
| --- | --- | --- |
| `0038_denyut.sql` | T07, T08 | `sumber_denyut`, `denyut_putaran` |
| `0039_tautan.sql` | L01 sampai L06, L08 | `tautan_antrean` |
| `0040_hukum_md.sql` | U01, U05, U06 | `hukum_md`, `hukum_relasi_pasal`, `hukum_kurasi` |
| `0041_wilayah_kegiatan.sql` | W01 | `wil_kegiatan`, `wil_foto`, `wil_dokumen`, `wil_berita`, `wil_pengurus` |
| `0042_akun_tier.sql` | N01 | `akun_tier` (+ pemicu dan isi awal) |
| `0043` sampai `0050` | M01, M02, M03, M04, M06, M07, M09, M12 | lihat M.7 |

M05, M08, M10, M11 tidak butuh D1 (layar dan data JSON saja). S07 (`/api/riwayat`) memakai tabel `riwayat` (0005) yang sudah ada.

### M.2 `0038_denyut.sql` (JM-T07, T08)

```sql
-- 0038_denyut.sql: denyut perubahan sumber (K21). Diisi Worker cron lewat hak.sistem. Idempoten.
CREATE TABLE IF NOT EXISTS sumber_denyut (
  kode TEXT PRIMARY KEY CHECK (length(kode) BETWEEN 2 AND 40 AND kode NOT GLOB '*[^a-z0-9_]*'),
  nama TEXT NOT NULL CHECK (length(nama) BETWEEN 2 AND 120),
  host TEXT NOT NULL CHECK (length(host) BETWEEN 3 AND 120 AND host NOT GLOB '*[^a-z0-9.-]*'),
  url_sinyal TEXT NOT NULL CHECK (url_sinyal GLOB 'https://*' AND length(url_sinyal) <= 400),
  jenis_sinyal TEXT NOT NULL DEFAULT 'etag' CHECK (jenis_sinyal IN ('etag','last_modified','panjang','tanpa')),
  frekuensi TEXT NOT NULL CHECK (frekuensi IN ('harian','mingguan','bulanan','kuartalan','tahunan','statis')),
  interval_cek_jam INTEGER NOT NULL CHECK (interval_cek_jam BETWEEN 6 AND 720),
  robots_boleh INTEGER NOT NULL DEFAULT 1 CHECK (robots_boleh IN (0,1)),
  aktif INTEGER NOT NULL DEFAULT 1 CHECK (aktif IN (0,1)),
  status TEXT NOT NULL DEFAULT 'ok' CHECK (status IN ('ok','basi','gagal','blokir','perlu_kunci')),
  etag TEXT CHECK (etag IS NULL OR length(etag) <= 200),
  last_modified TEXT CHECK (last_modified IS NULL OR length(last_modified) <= 60),
  panjang INTEGER CHECK (panjang IS NULL OR panjang >= 0),
  kode_http INTEGER CHECK (kode_http IS NULL OR kode_http BETWEEN 100 AND 599),
  gagal_beruntun INTEGER NOT NULL DEFAULT 0 CHECK (gagal_beruntun BETWEEN 0 AND 1000),
  dicek_pada INTEGER, berubah_pada INTEGER,
  jatuh_tempo INTEGER NOT NULL DEFAULT 0,
  diubah INTEGER NOT NULL DEFAULT (unixepoch()),
  CHECK (status <> 'blokir' OR aktif = 0)                -- host terblokir tidak diperiksa lagi sampai admin mengaktifkan
);
CREATE INDEX IF NOT EXISTS sumber_denyut_tempo ON sumber_denyut (aktif, robots_boleh, jatuh_tempo, kode);
CREATE INDEX IF NOT EXISTS sumber_denyut_status ON sumber_denyut (status);

CREATE TABLE IF NOT EXISTS denyut_putaran (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mulai INTEGER NOT NULL, selesai INTEGER,
  dipilih INTEGER NOT NULL DEFAULT 0 CHECK (dipilih BETWEEN 0 AND 80),
  subrequest INTEGER NOT NULL DEFAULT 0 CHECK (subrequest BETWEEN 0 AND 50),   -- gerbang batas Worker di data
  berubah INTEGER NOT NULL DEFAULT 0 CHECK (berubah >= 0),
  gagal INTEGER NOT NULL DEFAULT 0 CHECK (gagal >= 0),
  alasan_henti TEXT CHECK (alasan_henti IS NULL OR alasan_henti IN ('selesai','batas_fetch','batas_waktu','galat'))
);
CREATE INDEX IF NOT EXISTS denyut_putaran_mulai ON denyut_putaran (mulai DESC);
```

Tanpa data pribadi. Retensi: `sapu` menghapus `denyut_putaran` > 90 hari.

### M.3 `0039_tautan.sql` (L01 sampai L06, L08)

```sql
-- 0039_tautan.sql: antrean tautan ragu untuk kurator (ALG-baru §tautan T.4). Idempoten.
CREATE TABLE IF NOT EXISTS tautan_antrean (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kunci TEXT NOT NULL UNIQUE CHECK (length(kunci) = 12 AND kunci NOT GLOB '*[^0-9a-f]*'),     -- sha1 12 hex dari "jenis|dari|ke"
  jenis TEXT NOT NULL CHECK (jenis IN ('proyek_org','proyek_regulasi','proyek_berita','pendanaan_proyek','pendanaan_org',
    'riset_pakar','pakar_orang','riset_kampus','berita_entitas','berita_wilayah','proyek_kab','org_baru')),
  dari_t TEXT NOT NULL CHECK (dari_t IN ('proyek','organisasi','orang','regulasi','berita','pendanaan','riset','pakar_riset','inovasi','wilayah')),
  dari_id TEXT NOT NULL CHECK (length(dari_id) BETWEEN 1 AND 80),
  ke_t TEXT NOT NULL CHECK (ke_t IN ('proyek','organisasi','orang','regulasi','berita','pendanaan','riset','pakar_riset','inovasi','wilayah')),
  ke_id TEXT NOT NULL CHECK (length(ke_id) BETWEEN 1 AND 80),
  skor REAL NOT NULL CHECK (skor >= 0 AND skor <= 1),
  tingkat_bukti TEXT NOT NULL CHECK (tingkat_bukti IN ('terkonfirmasi','kata-pihak','cuplikan','inferensi')),
  cara TEXT NOT NULL CHECK (cara IN ('kunci','nama-baku','alias-kurasi','singkatan','token','teks-resmi','berita','koordinat')),
  alasan TEXT CHECK (alasan IS NULL OR alasan IN ('ragu','ambigu','kembaran','organisasi_baru','bertentangan')),
  bukti TEXT NOT NULL CHECK (json_valid(bukti) AND length(bukti) <= 2000),    -- istilah cocok + rujukan, bukan salinan paragraf
  versi_metode TEXT NOT NULL CHECK (length(versi_metode) BETWEEN 3 AND 20),
  status TEXT NOT NULL DEFAULT 'ragu' CHECK (status IN ('ragu','setuju','tolak','tunda','kedaluwarsa')),
  catatan TEXT CHECK (catatan IS NULL OR length(catatan) <= 500),
  dibuat INTEGER NOT NULL DEFAULT (unixepoch()),
  diputus_pada INTEGER,
  diputus_oleh INTEGER REFERENCES akun(id) ON DELETE SET NULL,
  CHECK (NOT (dari_t = ke_t AND dari_id = ke_id)),
  CHECK (status IN ('ragu','tunda','kedaluwarsa') OR (diputus_pada IS NOT NULL AND diputus_oleh IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS tautan_antrean_urut ON tautan_antrean (jenis, status, skor DESC, kunci);
CREATE INDEX IF NOT EXISTS tautan_antrean_putus ON tautan_antrean (status, diputus_pada);

-- Maksimal 200 butir aktif per jenis. IGNORE (bukan ABORT): baris lebih dari batas dilewati diam-diam
-- sehingga impor INSERT OR IGNORE tetap jalan; pemuat menghitung changes() untuk "tersisa_tak_diantre".
CREATE TRIGGER IF NOT EXISTS tautan_antrean_batas BEFORE INSERT ON tautan_antrean
WHEN NEW.status = 'ragu' AND (SELECT count(*) FROM tautan_antrean WHERE jenis = NEW.jenis AND status = 'ragu') >= 200
BEGIN SELECT RAISE(IGNORE); END;
```

Pemuatan: `POST /api/admin/tautan/muat` (admin, super) membaca aset `public/data/antrean_tautan.json` dan menjalankan `INSERT ... ON CONFLICT(kunci) DO UPDATE SET skor=excluded.skor, bukti=excluded.bukti, versi_metode=excluded.versi_metode, dibuat=excluded.dibuat WHERE tautan_antrean.status IN ('ragu','tunda','kedaluwarsa') AND tautan_antrean.versi_metode <> excluded.versi_metode`. Baris `setuju`/`tolak` tidak ditimpa selama versi metode sama. Maksimal sekitar 1.200 baris per muat (6 jenis x 200), jauh di bawah batas tulis.

### M.4 `0040_hukum_md.sql` (U01, U05, U06)

Pendamping `hukum_dok` (0029) agar tidak ada `ALTER`:

```sql
CREATE TABLE IF NOT EXISTS hukum_md (
  dok TEXT PRIMARY KEY REFERENCES hukum_dok (id),
  md_path TEXT NOT NULL CHECK (md_path GLOB 'hukum/*/[0-9][0-9][0-9][0-9]/*.md' AND length(md_path) <= 160),
  md_sha256 TEXT NOT NULL CHECK (length(md_sha256) = 64 AND md_sha256 NOT GLOB '*[^0-9a-f]*'),
  pdf_sha256 TEXT CHECK (pdf_sha256 IS NULL OR (length(pdf_sha256) = 64 AND pdf_sha256 NOT GLOB '*[^0-9a-f]*')),
  status_berlaku TEXT NOT NULL DEFAULT 'tidak_diketahui'
    CHECK (status_berlaku IN ('berlaku','diubah','dicabut','dicabut_sebagian','rancangan','tidak_diketahui')),
  status_per TEXT CHECK (status_per IS NULL OR status_per GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]'),
  mulai TEXT CHECK (mulai IS NULL OR mulai GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]'),
  mulai_perkiraan INTEGER NOT NULL DEFAULT 0 CHECK (mulai_perkiraan IN (0,1)),
  selesai TEXT CHECK (selesai IS NULL OR selesai GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]'),
  metode_ekstraksi TEXT NOT NULL DEFAULT 'pdftotext' CHECK (metode_ekstraksi IN ('pdftotext','ocr-vision','manual')),
  halaman_ocr INTEGER NOT NULL DEFAULT 0 CHECK (halaman_ocr >= 0),
  mutu REAL CHECK (mutu IS NULL OR (mutu >= 0 AND mutu <= 1)),
  perlu_tinjau INTEGER NOT NULL DEFAULT 0 CHECK (perlu_tinjau IN (0,1)),
  diperbarui INTEGER NOT NULL DEFAULT (unixepoch()),
  CHECK (selesai IS NULL OR mulai IS NULL OR selesai >= mulai)
);
CREATE INDEX IF NOT EXISTS hukum_md_status ON hukum_md (status_berlaku, mulai);
CREATE TABLE IF NOT EXISTS hukum_relasi_pasal (
  dari TEXT NOT NULL, ke TEXT NOT NULL,
  jenis TEXT NOT NULL CHECK (jenis IN ('mencabut','mengubah')),
  pasal TEXT NOT NULL CHECK (length(pasal) BETWEEN 1 AND 40),
  PRIMARY KEY (dari, ke, jenis, pasal)
) WITHOUT ROWID;
CREATE INDEX IF NOT EXISTS hukum_relasi_pasal_ke ON hukum_relasi_pasal (ke);
CREATE TABLE IF NOT EXISTS hukum_kurasi (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dok TEXT NOT NULL,
  jenis TEXT NOT NULL CHECK (jenis IN ('nomor_beda','relasi_bertentangan','dasar_pasal_42','ocr_tinjau','status_ragu')),
  rincian TEXT NOT NULL CHECK (json_valid(rincian) AND length(rincian) <= 2000),
  status TEXT NOT NULL DEFAULT 'baru' CHECK (status IN ('baru','selesai','tolak')),
  catatan TEXT CHECK (catatan IS NULL OR length(catatan) <= 500),
  dibuat INTEGER NOT NULL DEFAULT (unixepoch()),
  diputus_pada INTEGER, diputus_oleh INTEGER REFERENCES akun(id) ON DELETE SET NULL,
  UNIQUE (dok, jenis),
  CHECK (status = 'baru' OR diputus_pada IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS hukum_kurasi_status ON hukum_kurasi (status, jenis);
```

Isi `hukum_md` dan `hukum_relasi_pasal` datang dari seed (`scripts/hukum/hukum.py` diperluas, `data/hukum/seed*.sql` tetap tidak masuk repo). `hukum_kurasi` diisi seed dan diputus kurator.

### M.5 `0041_wilayah_kegiatan.sql` (W01)

Lima tabel; kolom `kode_prov` ada di SETIAP tabel agar klausa `prov` sederhana (`kode_prov = ?`).

```sql
CREATE TABLE IF NOT EXISTS wil_kegiatan (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ref TEXT NOT NULL UNIQUE CHECK (ref GLOB 'wk-[0-9]*' AND length(ref) BETWEEN 4 AND 20),
  kode_prov TEXT NOT NULL CHECK (kode_prov GLOB '[0-9][0-9]'),
  judul TEXT NOT NULL CHECK (length(judul) BETWEEN 3 AND 200),
  tanggal TEXT NOT NULL CHECK (tanggal GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]'),
  tanggal_selesai TEXT CHECK (tanggal_selesai IS NULL OR (tanggal_selesai GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]' AND tanggal_selesai >= tanggal)),
  tempat TEXT CHECK (tempat IS NULL OR length(tempat) <= 200),
  jenis TEXT NOT NULL CHECK (jenis IN ('audiensi','seminar','konferensi','lokakarya','rapat','kunjungan','pelatihan','lainnya')),
  ringkas TEXT CHECK (ringkas IS NULL OR length(ringkas) <= 600),
  notulensi TEXT CHECK (notulensi IS NULL OR length(notulensi) <= 30000),
  terbit INTEGER NOT NULL DEFAULT 0 CHECK (terbit IN (0,1)),
  oleh INTEGER NOT NULL REFERENCES akun(id),
  dibuat INTEGER NOT NULL DEFAULT (unixepoch()), diubah INTEGER
);
CREATE INDEX IF NOT EXISTS wil_kegiatan_prov ON wil_kegiatan (kode_prov, tanggal DESC);
CREATE INDEX IF NOT EXISTS wil_kegiatan_terbit ON wil_kegiatan (terbit, tanggal DESC);

CREATE TABLE IF NOT EXISTS wil_foto (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kegiatan_id INTEGER NOT NULL REFERENCES wil_kegiatan(id) ON DELETE CASCADE,
  kode_prov TEXT NOT NULL CHECK (kode_prov GLOB '[0-9][0-9]'),
  kunci_r2 TEXT NOT NULL UNIQUE CHECK (kunci_r2 GLOB 'wil/[0-9][0-9]/[0-9a-f]*.*' AND length(kunci_r2) BETWEEN 40 AND 60
    AND (kunci_r2 GLOB '*.jpg' OR kunci_r2 GLOB '*.png' OR kunci_r2 GLOB '*.webp')),
  tipe TEXT NOT NULL CHECK (tipe IN ('image/jpeg','image/png','image/webp')),
  ukuran INTEGER NOT NULL CHECK (ukuran BETWEEN 1 AND 5242880),
  persetujuan_foto INTEGER NOT NULL CHECK (persetujuan_foto = 1),            -- sama dengan wilayah_ajuan (0019)
  keterangan TEXT CHECK (keterangan IS NULL OR length(keterangan) <= 300),
  urutan INTEGER NOT NULL DEFAULT 0 CHECK (urutan BETWEEN 0 AND 999),
  oleh INTEGER REFERENCES akun(id), dibuat INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS wil_foto_kegiatan ON wil_foto (kegiatan_id, urutan, id);
CREATE TRIGGER IF NOT EXISTS wil_foto_prov BEFORE INSERT ON wil_foto
WHEN NEW.kode_prov <> (SELECT kode_prov FROM wil_kegiatan WHERE id = NEW.kegiatan_id)
BEGIN SELECT RAISE(ABORT, 'wil_foto: kode_prov harus sama dengan kegiatan'); END;
CREATE TRIGGER IF NOT EXISTS wil_foto_batas BEFORE INSERT ON wil_foto
WHEN (SELECT count(*) FROM wil_foto WHERE kegiatan_id = NEW.kegiatan_id) >= 40
BEGIN SELECT RAISE(ABORT, 'wil_foto: maksimal 40 foto per kegiatan'); END;

CREATE TABLE IF NOT EXISTS wil_dokumen (          -- internal: tanpa akses anggota
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kegiatan_id INTEGER REFERENCES wil_kegiatan(id) ON DELETE CASCADE,
  kode_prov TEXT NOT NULL CHECK (kode_prov GLOB '[0-9][0-9]'),
  kunci_r2 TEXT NOT NULL UNIQUE CHECK (kunci_r2 GLOB 'wil-dok/[0-9][0-9]/[0-9a-f]*.*' AND length(kunci_r2) BETWEEN 45 AND 64),
  tipe TEXT NOT NULL CHECK (tipe IN ('pdf','pptx','docx','xlsx')),
  ukuran INTEGER NOT NULL CHECK (ukuran BETWEEN 1 AND 20971520),
  nama_berkas TEXT NOT NULL CHECK (length(nama_berkas) BETWEEN 1 AND 200),
  keterangan TEXT CHECK (keterangan IS NULL OR length(keterangan) <= 300),
  oleh INTEGER NOT NULL REFERENCES akun(id), dibuat INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS wil_dokumen_prov ON wil_dokumen (kode_prov, dibuat DESC);

CREATE TABLE IF NOT EXISTS wil_berita (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ref TEXT NOT NULL UNIQUE CHECK (ref GLOB 'wb-[0-9]*' AND length(ref) BETWEEN 4 AND 20),
  kode_prov TEXT NOT NULL CHECK (kode_prov GLOB '[0-9][0-9]'),
  judul TEXT NOT NULL CHECK (length(judul) BETWEEN 3 AND 200),
  tanggal TEXT NOT NULL CHECK (tanggal GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]'),
  isi TEXT NOT NULL CHECK (length(isi) BETWEEN 1 AND 20000),
  status TEXT NOT NULL DEFAULT 'draf' CHECK (status IN ('draf','terbit','ditarik')),
  oleh INTEGER NOT NULL REFERENCES akun(id),
  dibuat INTEGER NOT NULL DEFAULT (unixepoch()), diubah INTEGER
);
CREATE INDEX IF NOT EXISTS wil_berita_prov ON wil_berita (kode_prov, status, tanggal DESC);

CREATE TABLE IF NOT EXISTS wil_pengurus (          -- tanpa kontak; nama dan jabatan saja
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kode_prov TEXT NOT NULL CHECK (kode_prov GLOB '[0-9][0-9]'),
  nama TEXT NOT NULL CHECK (length(nama) BETWEEN 1 AND 120),
  jabatan TEXT NOT NULL CHECK (length(jabatan) BETWEEN 1 AND 120),
  orang_id TEXT CHECK (orang_id IS NULL OR length(orang_id) BETWEEN 1 AND 40),
  urut INTEGER NOT NULL DEFAULT 0 CHECK (urut BETWEEN 0 AND 99),
  mulai TEXT CHECK (mulai IS NULL OR mulai GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]'),
  selesai TEXT CHECK (selesai IS NULL OR selesai GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]'),
  oleh INTEGER NOT NULL REFERENCES akun(id),
  dibuat INTEGER NOT NULL DEFAULT (unixepoch()), diubah INTEGER
);
CREATE INDEX IF NOT EXISTS wil_pengurus_prov ON wil_pengurus (kode_prov, urut);
```

Batas 30 dokumen per kegiatan memakai pola trigger `agenda_dokumen_batas` (0032) yang sama.

### M.6 `0042_akun_tier.sql` (N01; D22)

```sql
-- 0042_akun_tier.sql: tamu dan tier anggota (D22, K24). Tabel pendamping: CHECK akun.status beku (0001).
CREATE TABLE IF NOT EXISTS akun_tier (
  akun_id INTEGER PRIMARY KEY REFERENCES akun(id) ON DELETE CASCADE,
  keanggotaan TEXT NOT NULL DEFAULT 'tamu' CHECK (keanggotaan IN ('tamu','anggota')),
  tier TEXT NOT NULL DEFAULT 'tamu' CHECK (tier IN ('tamu','pelajar','individu','ngo','usaha_kecil','usaha_besar','utama')),
  asal TEXT NOT NULL DEFAULT 'admin' CHECK (asal IN ('pendaftaran','admin','backfill')),
  pendaftaran_id INTEGER REFERENCES pendaftaran(id) ON DELETE SET NULL,
  berlaku_dari TEXT CHECK (berlaku_dari IS NULL OR berlaku_dari GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]'),
  berlaku_sampai TEXT CHECK (berlaku_sampai IS NULL OR berlaku_sampai GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]'),
  tanpa_lunas INTEGER NOT NULL DEFAULT 0 CHECK (tanpa_lunas IN (0,1)),
  diubah INTEGER NOT NULL DEFAULT (unixepoch()),
  diubah_oleh INTEGER REFERENCES akun(id) ON DELETE SET NULL,
  CHECK ((keanggotaan = 'tamu') = (tier = 'tamu')),
  CHECK (berlaku_sampai IS NULL OR berlaku_dari IS NULL OR berlaku_sampai >= berlaku_dari)
);
CREATE INDEX IF NOT EXISTS akun_tier_tier ON akun_tier (tier, berlaku_sampai);

-- Akun anggota baru otomatis tamu sampai tier ditetapkan.
CREATE TRIGGER IF NOT EXISTS akun_tier_baru AFTER INSERT ON akun WHEN NEW.peran = 'anggota'
BEGIN INSERT OR IGNORE INTO akun_tier (akun_id) VALUES (NEW.id); END;

-- Isi awal: anggota yang sudah ada TIDAK dikunci. Dari pendaftaran disetujui bila ada, selain itu 'individu' bertanda backfill.
INSERT OR IGNORE INTO akun_tier (akun_id, keanggotaan, tier, asal, pendaftaran_id, berlaku_dari)
SELECT a.id, 'anggota',
  COALESCE((SELECT p.jenis FROM pendaftaran p WHERE p.akun_id = a.id AND p.status = 'disetujui' ORDER BY p.id DESC LIMIT 1), 'individu'),
  CASE WHEN EXISTS (SELECT 1 FROM pendaftaran p WHERE p.akun_id = a.id AND p.status = 'disetujui') THEN 'pendaftaran' ELSE 'backfill' END,
  (SELECT p.id FROM pendaftaran p WHERE p.akun_id = a.id AND p.status = 'disetujui' ORDER BY p.id DESC LIMIT 1),
  date(a.dibuat, 'unixepoch')
FROM akun a WHERE a.peran = 'anggota';
```

Akun staf (pengurus ke atas) tidak punya baris; `hak.js` memperlakukan mereka peringkat 6 (ALG-baru §tier R.1). Daftar `asal = 'backfill'` ditampilkan di `GET /api/admin/tier?asal=backfill` untuk ditetapkan admin.

### M.7 `0043` sampai `0050`: dua belas program (seri M)

Rincian kolom ditetapkan pengerja `migrasi` saat tiket dimulai, dengan kebiasaan M.1; di sini kontrak minimum (nama tabel, kunci, CHECK yang menjaga aturan program). Peluncuran yang mengikat organisasi menunggu C-01 (K25).

| Berkas | Tiket | Tabel dan CHECK utama |
| --- | --- | --- |
| `0043_rapor.sql` | M01 | `rapor_edisi(ref 'rp-YYYYQn' UNIQUE, status IN ('draf','tinjau','beku','terbit'), hash_isi 64 hex, dibekukan_pada, penyunting, disahkan_oleh)`; pemicu: baris `beku`/`terbit` tidak dapat diubah isinya (hanya `beku` ke `terbit`); `rapor_unduh(akun_id, set, bulan, jumlah)` untuk kuota `unduh_data` |
| `0044_advokasi.sql` | M02 | `advokasi_butir(ref, regulasi_id, status_aturan, posisi_meti <= 2000, posisi_status IN ('draf','disahkan'))`; `advokasi_suara(butir_id, akun_id, pilihan IN ('setuju','netral','tolak'), UNIQUE(butir_id, akun_id))`; `advokasi_komentar`; `kelompok_kerja`, `kelompok_anggota`, `kelompok_tugas(tenggat, status)` |
| `0045_pemasang.sql` | M03 | `pemasang(org_id, status IN ('daftar','uji','komite','terdaftar','dicabut'), no_sertifikat UNIQUE, berlaku_sampai, qr_token_hash 64)`; `pemasang_putusan` (hanya tambah, pemicu cegah UPDATE/DELETE); `pemasang_aduan(kontak <= 120, putusan_pada, hapus_setelah = putusan_pada + 24 bulan)`; `sapu` menghapus aduan 24 bulan sesudah putusan (C-26; aduan belum diputus tidak dihapus) |
| `0046_pipeline.sql` | M04 | `pipeline_ajuan(proyek_id, org_id, status IN ('diajukan','ditinjau','diterima','ditolak'))`; `pipeline_ruang(proyek_id, kunci_r2 'ruang/...')`; `pipeline_ruang_akses(ruang_id, akun_id, berlaku_sampai)` |
| `0047_akademi.sql` | M06 | `kompetensi_jalur`, `ujian_daftar(akun_id, jalur, jadwal, status)`, `sertifikat(akun_id, jalur, nomor UNIQUE, terbit, berlaku_sampai, qr_token_hash)` |
| `0048_temu.sql` | M07 | `temu_profil(org_id, sisi IN ('penawaran','kebutuhan'), teknologi, kode_prov, kapasitas_mw)`; `temu_permintaan(dari_akun, ke_profil, status IN ('diminta','dijadwal','selesai','tolak'), jadwal)`; `temu_kuota(akun_id, bulan, dipakai)` |
| `0049_produk.sql` | M09 | `produk_daftar(org_id, nama, jenis, tkdn_persen 0..100, bukti_url https, status IN ('diajukan','verifikasi','terverifikasi','ditolak'), verifikator)` |
| `0050_pembeli.sql` | M12 | `pembeli_profil(akun_id UNIQUE, kawasan, kode_prov, beban_kw, anonim IN (0,1))`; `pembeli_cocok(profil_id, proyek_id, skor)` (turunan, boleh dihapus) |

M05, M08, M10, M11 tanpa skema. Pemeriksa seri M: `migrasi-idempoten`, `hak-auditor`, `security-reviewer`.

---

## §rute-matriks: rute baru dan sel MATRIKS (`src/hak.js`)

### X.1 Perubahan struktur `hak.js` (pemilik `worker`)

1. **Kode sel BARU** di `KODE`: `"T prov"` (aksi `baca,tambah,ubah,hapus`, klausa `prov`), `"B terbit"` (aksi `baca`, klausa `terbit`), `"B diri"` (aksi `baca`, klausa `sendiri`). Kode lain di tabel X.2 sudah ada di `KODE` (`B`, `B prov`, `T`, `T daftar`, `T kirim`, `T tinjau`) atau BARU: `"B disahkan"` (aksi `baca`, klausa `disahkan`: kolom `posisi_meti` dikosongkan bila `posisi_status = 'draf'`), `"B anonim"` (aksi `baca`, klausa `anonim`: `KOLOM_BACA` tanpa `akun_id` dan `nama`, dijaga di server), `"B ruang"` (aksi `baca`, klausa `ruang`: pemilik ajuan atau akun tertulis di `pipeline_ruang_akses` yang belum kedaluwarsa; tiap baca menulis `jejak`), `"T daftar terbit"` (aksi `baca,tambah,ubah`, klausa `sendiri_atau_terbit`: semua baris milik sendiri ditambah baris berstatus terbit milik siapa pun; `terbit` per tabel: `pemasang`: `status = 'terdaftar'`, `produk_daftar`: `status = 'terverifikasi'`). Dua kunci `sertifikat` dan `pemasang_putusan` memakai `T tinjau` dengan pemicu pencatat tidak sama dengan pemutus (pola `konten_otorisasi`).
2. **Klausa `prov`**: `PROV_SQL` ditambah `wil_kegiatan`, `wil_foto`, `wil_dokumen`, `wil_berita`, `wil_pengurus` -> `"kode_prov = ?"` dan `anggota_prov` -> `"prov = ?"`. `KLAUSA.prov.baris` diubah menjadi `(r.prov ?? r.kode_prov) === akun.cakupan_prov`. Tanpa ini klausa `prov` mengembalikan `0 = 1` untuk tabel baru (aman tapi tak berguna) atau menolak semua baris karena kolomnya bukan `prov`.
3. **Klausa `terbit`** BARU: `sql` per tabel (`wil_kegiatan`: `terbit = 1`; `wil_berita`: `status = 'terbit'`; `wil_foto`: `kegiatan_id IN (SELECT id FROM wil_kegiatan WHERE terbit = 1)`; `rapor_edisi`: `status = 'terbit'`); `baris`: `r.terbit === 1 || r.status === 'terbit'`. Dikecualikan untuk peran yang menulis (`wilayah` melihat drafnya sendiri lewat sel `T prov`).
4. **`PEMILIK`** ditambah `akun_tier|rapor_unduh|advokasi_suara|advokasi_komentar|ujian_daftar|temu_kuota|pembeli_profil|pembeli_cocok: "akun_id"` (`pembeli_cocok` lewat `profil_id`), `temu_permintaan: "dari_akun"`, `kelompok_tugas: "penerima"`, `pipeline_ajuan: "akun_id"`. Tabel berpemilik organisasi (`pemasang`, `pemasang_putusan`, `produk_daftar`, `temu_profil`) memakai `org_id` yang diselesaikan lewat tautan akun-organisasi yang ada; pengerja `migrasi` memastikan tautannya ada sebelum M03 (bila belum, tabel pendamping ditambah di migrasi tiket itu; Catatan 11).
5. **`TAMBAHAN_T`** ditambah `wil_kegiatan|wil_foto|wil_dokumen|wil_berita|wil_pengurus: ["hapus"]`, `tautan_antrean|hukum_kurasi|rapor_edisi|advokasi_butir|pemasang|pemasang_putusan|pemasang_aduan|pipeline_ajuan|temu_profil|ujian_daftar|sertifikat: ["tinjau"]`.
6. **Tabel baru wajib masuk** `KOLOM_BACA`, `KOLOM_TULIS`, `TABEL_BACA`, `JENIS_TABEL`, `BARIS_SQL` (aturan hak.js: tabel tanpa entri = temuan, `jenisData` melempar). `KOLOM_BACA.anggota_prov = ["id","jenis","nama","organisasi","kota","prov"]` (tanpa `hp`, `surel`, `rinci`, `foto_kunci`); `TABEL_BACA.anggota_prov = { t: "pendaftaran", jenis: "anggota_prov", tetap: "status = 'disetujui'" }`.
7. **`lapisBoleh` dan `bacaSesi`** untuk tier: lihat `§potret-tier` P.4; `bacaSesi` menambah `LEFT JOIN akun_tier t ON t.akun_id = a.id` dan kolom `t.tier, t.keanggotaan, t.berlaku_sampai, t.tanpa_lunas`.
8. **Penegakan provinsi di sisi server**: untuk peran `wilayah`, `hak.tulis` MENIMPA `data.kode_prov` dengan `akun.cakupan_prov` sebelum `boleh()` (klien tak pernah menentukan provinsi); admin dan super wajib menyertakan `kode_prov` sah.

### X.2 Sel MATRIKS baru

Urutan kolom: PB AN PG KR WL AD SA (`PERAN`).

| Jenis data (tabel) | PB | AN | PG | KR | WL | AD | SA | Catatan |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `wil_kegiatan` | - | B terbit | B terbit | B terbit | T prov | T | T | W01; pusat melihat semua provinsi; draf hanya penulis, wilayahnya, AD, SA |
| `wil_foto` | - | B terbit | B terbit | B terbit | T prov | T | T | `persetujuan_foto = 1` dipaksa CHECK |
| `wil_dokumen` | - | - | B | B | T prov | T | T | internal: anggota tidak punya akses |
| `wil_berita` | - | B terbit | B terbit | B terbit | T prov | T | T | admin menarik (`ditarik`) lewat `ubah` |
| `wil_pengurus` | - | B | B | B | T prov | T | T | nama dan jabatan saja |
| `anggota_prov` | - | - | B | - | B prov | B | B | tampilan terbatas dari `pendaftaran`, tanpa `hp`/`surel` |
| `akun_tier` | - | B diri | B diri | B diri | B diri | T | T | pengurus menetapkan tier lewat persetujuan pendaftaran (fungsi `pendaftaran`), bukan sel ini |
| `sumber_denyut` | - | - | - | B | - | T | T | tulis rutin oleh `hak.sistem` (cron), AD/SA hanya `aktif` dan `interval` |
| `denyut_putaran` | - | - | - | - | - | B | B | log putaran; ditulis `hak.sistem` |
| `tautan_antrean` | - | - | B | T | - | T | T | `T` memutus (aksi `tinjau`) |
| `hukum_kurasi` | - | - | B | T | - | T | T | U05, U06 |
| `hukum_md` | - | B | B | B | B | B | B | hanya baca lewat `hak.hukum*`; tulis hanya seed dan skrip, tanpa rute tulis |
| `hukum_relasi_pasal` | - | B | B | B | B | B | B | hanya baca lewat `hak.hukum*`; tulis hanya seed |
| `rapor_edisi` | - | B terbit | T | T | B terbit | T | T | M01; penyunting PG atau KR; pemicu: `beku`/`terbit` tak dapat diubah isinya |
| `rapor_unduh` | - | B diri | B diri | B diri | B diri | B | B | M01; kuota `unduh_data`; ditulis `hak.sistem` saat rute unduh |
| `advokasi_butir` | - | B disahkan | T tinjau | B disahkan | B disahkan | T | T | M02; `posisi_meti` berstatus `draf` hanya PG, AD, SA; PG mengesahkan (`tinjau`) |
| `advokasi_suara` | - | T daftar | T daftar | T daftar | T daftar | T daftar | T daftar | M02; `UNIQUE(butir_id, akun_id)`; syarat tier lewat gerbang fitur |
| `advokasi_komentar` | - | T daftar | T | T | T daftar | T | T | M02; PG dan KR memoderasi |
| `kelompok_kerja` | - | B | T | B | B | T | T | M02 |
| `kelompok_anggota` | - | B | T | B | B | T | T | M02; nama saja |
| `kelompok_tugas` | - | T daftar | T | T daftar | T daftar | T | T | M02; `tenggat`, `status` |
| `pemasang` | - | T daftar terbit | T tinjau | B | B | T | T | M03; baris `terdaftar` terbaca semua yang login, baris sendiri semua status; PG peninjau skema |
| `pemasang_putusan` | - | B diri | T tinjau | - | - | B | T | M03; hanya tambah, pemicu cegah UPDATE/DELETE |
| `pemasang_aduan` | - | T kirim | T tinjau | T kirim | T kirim | B | T | M03; pelapor membaca miliknya; teradu menjawab lewat `hak.aduanJawab`; hapus 24 bulan sesudah putusan (C-26) |
| `pipeline_ajuan` | - | T daftar | T tinjau | B | T daftar | T | T | M04; pemilik mengubah ajuannya; PG dan AD memutus status |
| `pipeline_ruang` | - | T daftar | B ruang | - | - | B ruang | B | M04; pemilik ajuan menulis; PG dan AD membaca hanya bila tertulis di `pipeline_ruang_akses` |
| `pipeline_ruang_akses` | - | - | B diri | - | - | T | T | M04; penugasan tertulis, `berlaku_sampai` |
| `kompetensi_jalur` | - | B | B | T | B | T | T | M06 |
| `ujian_daftar` | - | T daftar | B | T tinjau | T daftar | T | T | M06; kuota ujian dijaga trigger; asesor KR menilai |
| `sertifikat` | - | B diri | T tinjau | T tinjau | B | T | T | M06; dua kunci pada penerbitan: pencatat (asesor KR) tidak sama dengan pengesah (PG), lewat pemicu; KR mencabut dengan alasan, banding ke PG; `qr_token_hash` 64 hex |
| `temu_profil` | - | B | T tinjau | B | B | T | T | M07; AN mengisi lewat ajuan generik, PG (penyelenggara) menyetujui agar tampil; tanpa kontak sebelum diterima |
| `temu_permintaan` | - | T daftar | T daftar | T daftar | T daftar | T | T | M07; penerima menjawab lewat `hak.temuJawab`; tidak ke diri sendiri (CHECK/pemicu); kuota via trigger |
| `temu_kuota` | - | B diri | B diri | B diri | B diri | B | B | M07; ditulis trigger dan `hak.sistem` |
| `produk_daftar` | - | T daftar terbit | B | T tinjau | B terbit | T | T | M09; baris `terverifikasi` terbaca semua yang login, baris sendiri semua status; verifikator KR |
| `pembeli_profil` | - | T daftar | B anonim | - | - | B anonim | B anonim | M12; `anonim` dipaksa di server; hapus atas permintaan subjek lewat fungsi hak subjek |
| `pembeli_cocok` | - | B diri | B | - | - | B | B | M12; turunan, boleh dihapus; ditulis `hak.sistem` |

Tiga puluh enam tabel, mencakup SEMUA tabel migrasi 0038 sampai 0050 (`sumber_denyut`, `denyut_putaran`, `tautan_antrean`, `hukum_md`, `hukum_relasi_pasal`, `hukum_kurasi`, `wil_*`, `akun_tier`, dan seri M: `rapor_*`, `advokasi_*`, `kelompok_*`, `pemasang*`, `pipeline_*`, `ujian_daftar`, `sertifikat`, `temu_*`, `produk_daftar`, `pembeli_*`) ditambah `anggota_prov` (tampilan atas `pendaftaran`) dan `kompetensi_jalur`. Kolom TM (tamu) tidak ada di `PERAN`: tamu adalah akun `anggota` bertier 0 (§potret-tier), sehingga selnya mengikuti kolom AN dikurangi fitur terkunci tier; KEAMANAN-PRIVASI §2 memuat kolom TM per tabel. Tabel `dampak` tidak ada: peta dampak adalah JSON potret (R.5). Antrean semi-manual panen tidak punya tabel D1 (berkas `data/bot/status.json` di PR). Daftar radar, tender, dan peluang adalah potret berlapis tier (N02), bukan tabel.

Sel yang sudah ada dan dipakai tanpa perubahan: `riwayat` (PG, AD, SA `T`; C-17), `pendaftaran` (PG, AD, SA `T`), `agenda`, `event_*`.

Cakupan uji `hak.test.mjs` (pemeriksa `hak-auditor`): untuk TIAP sel baru, uji peran yang BOLEH dan peran yang DITOLAK; untuk `T prov`, wilayah `32` mencoba `ubah`/`hapus` baris `kode_prov = '12'` = 403 `dilarang`, `baca` daftar = tanpa baris itu, `baca` per id = 404; wilayah tanpa `cakupan_prov` = nol baris (aturan R11 2.6). Dijalankan di D1 lokal sungguhan, bukan mock (TEST.md).

### X.3 Rute baru

Semua rute: gerbang peran di BARIS PERTAMA handler (`perlu(p, DAFTAR)`), terdaftar di `cakupan.json`, uji peran benar dan salah. Singkatan peran seperti DT-lama (LOGIN = AN PG KR WL AD SA; STAF = PG KR AD SA).

| Rute | Peran | Jenis data | Tiket |
| --- | --- | --- | --- |
| `GET /api/riwayat?target=`, `POST /api/riwayat`, `PATCH /api/riwayat/:id`, `DELETE /api/riwayat/:id` | PG AD SA (C-17) | `riwayat` | S07 |
| `GET /api/admin/denyut` | KR AD SA | `sumber_denyut` | T07 |
| `PATCH /api/admin/denyut/:kode` (aktif, interval) | AD SA | `sumber_denyut` | T07 |
| `GET /api/admin/kesegaran` | KR AD SA | `sumber_denyut` + aset | T08 |
| `GET /api/admin/tautan?jenis=&status=&hal=` | PG KR AD SA | `tautan_antrean` | L01..L06 |
| `POST /api/admin/tautan/:id/putus` {aksi: setuju\|tolak\|tunda, catatan} | KR AD SA | `tautan_antrean` | L01..L06 |
| `POST /api/admin/tautan/muat` | AD SA | `tautan_antrean` | L01..L06 |
| `GET /api/bot/tautan-putus?sejak=` (bearer `BOT_RAHASIA`, D23) | bukan sesi; hanya-baca, banding waktu-tetap, batas laju, tercatat di `jejak` (KEAMANAN-PRIVASI §4.1); tanpa bearer 401, salah 403 | `tautan_antrean` (baca) | T06, L08 |
| `GET /api/admin/hukum/kurasi`, `POST /api/admin/hukum/kurasi/:id` | PG(baca) KR AD SA | `hukum_kurasi` | U05, U06 |
| `GET /api/hukum/dok?id=` (diperluas: `status_berlaku`, `mulai`, `selesai`, `md_path`) | LOGIN | helper `hak.hukum*` | U06 |
| `GET /api/wilayah-admin/ringkas?prov=` | WL AD SA | `wil_*` | W02 |
| `GET\|POST /api/wilayah-admin/kegiatan`, `PATCH\|DELETE /api/wilayah-admin/kegiatan/:id` | WL AD SA | `wil_kegiatan` | W02 |
| `POST /api/wilayah-admin/kegiatan/:id/foto`, `DELETE /api/wilayah-admin/foto/:fid`, `GET /api/wilayah/foto/:fid` | tulis: WL AD SA; baca: LOGIN (terbit) | `wil_foto` | W02, W03 |
| `GET\|POST /api/wilayah-admin/dokumen`, `DELETE /api/wilayah-admin/dokumen/:id`, `GET /api/wilayah-admin/dokumen/:id/berkas` | WL AD SA (baca juga PG KR) | `wil_dokumen` | W02 |
| `GET\|POST\|PATCH\|DELETE /api/wilayah-admin/berita[/:id]` | WL AD SA | `wil_berita` | W02 |
| `GET\|POST\|PATCH\|DELETE /api/wilayah-admin/pengurus[/:id]` | WL AD SA | `wil_pengurus` | W02 |
| `GET /api/wilayah-admin/anggota?prov=` | WL(prov sendiri) AD SA, PG | `anggota_prov` | W02 |
| `GET /api/wilayah/papan/:kode` | LOGIN | `wil_*` terbit | W03 |
| `GET /api/tier/manfaat` | LOGIN | peta fitur (kode) | N03 |
| `GET /api/saya` (diperluas: `tier`, `tier_rank`, `berlaku_sampai`, `tanpa_lunas`) | LOGIN | `akun_tier` | N01 |
| `GET /api/admin/tier?asal=&tier=`, `PATCH /api/admin/tier/:akunId` | AD SA | `akun_tier` | N01 |
| `POST /api/admin/pendaftaran/:id/setujui` (diperluas: `tier_sebagai` = `tamu` atau jenis) | PG AD SA | `pendaftaran`, `akun_tier` | N01 |
| `GET /api/direktori/potret/:benda` (digerbang tier; 403 `tier` bila lapis diminta tak boleh) | LOGIN | R2 | N02 |

Rute seri M (final ditetapkan saat tiket, kontrak awal): M01 `GET /api/rapor`, `GET /api/rapor/:ref`, `POST /api/admin/rapor`, `POST /api/admin/rapor/:ref/{tinjau,bekukan,terbitkan}`, `GET /api/data/unduh/:set` (tier `unduh_data`, tercatat di `rapor_unduh`); M02 `GET /api/advokasi`, `POST /api/advokasi/:id/{suara,komentar}`, `PUT /api/admin/advokasi/:id/posisi`, rute `kelompok`; M03 `GET /api/pemasang`, `POST /api/pemasang/daftar`, `POST /api/pemasang/aduan`, `POST /api/admin/pemasang/:id/putus`; M04 `GET /api/pipeline`, `POST /api/pipeline/ajuan`, `GET /api/pipeline/ruang/:id/berkas/:n`; M06 `GET /api/akademi/jalur`, `POST /api/akademi/ujian`, `GET /api/sertifikat/v/:token` (peran LOGIN eksplisit, C-27); M07 `GET /api/temu`, `POST /api/temu/permintaan`; M09 `GET /api/produk`, `POST /api/produk/daftar`, `POST /api/admin/produk/:id/verifikasi`; M12 `GET /api/pembeli/saya`, `PUT /api/pembeli/saya`. Verifikasi lencana berbasis token (`/api/sertifikat/v/:token` dan verifikasi pemasang) wajib login (C-27): peran LOGIN eksplisit di baris pertama handler, tanpa sesi 401, dibatasi laju per IP hash, tidak masuk himpunan pengecualian D19 (`API_PUBLIK`); hanya `/kta/v/<token>` yang terbuka tanpa login. Respons memuat nama, jalur, status, tanggal saja.

Perubahan `worker.js`: tabel halaman ditambah `/wilayah-admin` (WL AD SA), `/rapor`, `/advokasi`, `/pemasang`, `/pipeline`, `/temu`, `/produk`, `/pembeli` (LOGIN, dengan gerbang tier di layar manfaat), mengikuti pola penjaga halaman D19 (302 ke `/masuk?ke=` tanpa sesi).

---

## §potret-tier: skema potret per lapis untuk tier D22 (JM-N02)

### P.1 Lapis

Tiga lapis lama (`publik`, `anggota`, `pengurus`) tetap, kolom `lapis` di D1 (entitas, fakta, ikatan) TIDAK berubah (CHECK beku). Tier dilapiskan di LEVEL POTRET: `anggota` dipecah menjadi empat tingkat kumulatif.

| Lapis R2 | Isi | Boleh bagi | Peringkat minimal |
| --- | --- | --- | --- |
| `potret/publik/<benda>.json` | baris penuh, data dasar | semua yang login, termasuk `tamu` (C-23: data dasar untuk semua yang login) | 0 |
| `potret/anggota/<benda>.json` | delta, SAMA seperti sekarang | `pelajar` ke atas | 1 |
| `potret/anggota-t2/<benda>.json` | delta tambahan | `individu` ke atas | 2 |
| `potret/anggota-t3/<benda>.json` | delta tambahan | `ngo` ke atas | 3 |
| `potret/anggota-t4/<benda>.json` | delta tambahan | `usaha_kecil`, `usaha_besar`, `utama` | 4 |
| `potret/pengurus/<benda>.json` | delta, SAMA seperti sekarang | pengurus, kurator, admin, super | staf |

Delta tiap tier hanya memuat kolom tambahan menurut aturan SKEMA-POTRET (`{id, ...kolom}`, tanpa mengulang kolom lapis di bawahnya). Satu kolom hidup di TEPAT satu lapis (gerbang `tier_kolom.tepat-satu-lapis`). Amplop: `{lapis, tier_min, dibangun_pada, jumlah, baris}`; pemecahan `<benda>.<n>.json` dan `{bagian:[...]}` tetap.

### P.2 Peta kolom ke lapis

Sumber tunggal: `data/tier_kolom.json` (pemilik `pipa`), `{ "<benda>": { "<kolom>": "publik|anggota|anggota-t2|anggota-t3|anggota-t4|pengurus" } }`. Isi awal (selaras C-23 dan peta benchmark, usulan [U] menunggu konfirmasi):

| Benda.kolom | Lapis baru | Alasan |
| --- | --- | --- |
| `organisasi.kontak` (surel/telepon korporat generik) | `publik` (TIDAK dipindah) | C-23: kontak korporat tetap terlihat semua yang login; kontak orang tetap lapis `pengurus` |
| `proyek.skema_kerjasama`, `tanggal_ppa`, `financial_close`, `pemberi_dana` | `anggota-t3` | data pasar rinci, bahan Desk Siap Bank |
| `proyek.pihak_terlibat`, `tenaga_kerja`, `dari_materi` | `anggota-t4` | materi paparan internal, tier usaha dan atas |
| `angka.*` baris tanpa URL publik | `anggota-t2` | laporan lengkap |
| `keuangan.baris` kelompok `tarif`, `bpp` rinci | `anggota-t2` | data pasar rinci |
| `regulasi.posisi_meti`, `posisi_topik` | `anggota` | tidak berubah |
| `orang.pendidikan`, `kiprah`, `foto`, `akademik` | `anggota` | tidak berubah |
| semua kolom `pengurus` lama | `pengurus` | tidak berubah |

Skrip `scripts/pipa/potret.mjs` membaca peta ini dan memecah tiap benda; kolom yang tidak ada di peta jatuh ke lapis lamanya (kompatibel mundur). Pemindai data pribadi (SKEMA-POTRET Aturan 3) tetap menggagalkan bangun bila ada surel/ponsel pribadi di lapis mana pun selain `pengurus`.

### P.3 Batas 2 MB

Batas per berkas 2 MB (KP/SKEMA-POTRET Aturan 4; `jaga_unggah.mjs`) berlaku PER LAPIS PER BENDA. Anggaran: target <= 1,2 MB per berkas, peringatan di 1,6 MB, tolak di 2 MB. Perkiraan awal: `organisasi.json` publik 1,24 MB (sudah mendekati target; kolom `kontak` tetap di sana, tidak dipindah menurut C-23); delta `anggota-t2` organisasi sekitar 0,1 sampai 0,2 MB; delta `anggota-t3` proyek sekitar 0,2 MB. Bila melebihi: dipecah `<benda>.<n>.json` menurut `id` terurut (potongan stabil), dan `<benda>.json` memuat `{bagian:[...]}`. Catatan: `public/data/istilah.json` (2,12 MB) dan `riset.json` (1,72 MB) sudah di atas atau dekat batas sebagai aset statis; di luar skema potret tetapi layak dipecah (temuan untuk `perf-reviewer`).

Gerbang tambahan `jaga_unggah`: (1) kolom ada di lapis yang dipetakan; (2) tidak ada kolom di dua lapis; (3) `tier_min` amplop = peringkat minimal tabel P.1; (4) tidak ada tautan berkas lapis rendah ke lapis tinggi (SKEMA-POTRET); (5) ukuran.

### P.4 Penegakan di Worker (server, bukan klien)

`src/direktori.js` memakai `LAPIS_PERAN` sendiri (bukan `hak.lapisBoleh`) pada `potretBaru`; keduanya disatukan agar ada SATU sumber:

```js
// hak.js (BARU, menggantikan tubuh lapisBoleh)
export const TIER_LAPIS = [["anggota", 1], ["anggota-t2", 2], ["anggota-t3", 3], ["anggota-t4", 4]];
export function lapisBoleh(akun) {
  const p = peranEfektif(akun);
  if (p === "publik") return ["publik"];
  if (["pengurus", "kurator", "admin", "super"].includes(p)) return ["publik", ...TIER_LAPIS.map(([l]) => l), "pengurus"];
  if (p === "wilayah") return ["publik", ...TIER_LAPIS.map(([l]) => l)];          // tidak ada lapis pengurus (seperti sekarang)
  const r = peringkatTier(akun);                                                   // dari bacaSesi: tierEfektif (ALG-baru §tier R.2)
  return ["publik", ...TIER_LAPIS.filter(([, min]) => r >= min).map(([l]) => l)];  // tamu (0) hanya publik
}
// direktori.js
const LAPIS_PERAN = (akun) => hak.lapisBoleh(akun);
```

`potretBaru` tetap menggabung delta di server (`gabungLapis`); tanpa lapis yang tak boleh, kolomnya tidak pernah dikirim (bukan disaring klien). Permintaan lapis eksplisit di luar hak (`?lapis=`, bila ada) = 403 `{kode:"tier", tier_min, fitur}` supaya layar manfaat (N03) dapat menampilkan ajakan; benda yang tidak ada = 404 seperti sekarang. Unduhan `GET /api/data/unduh/:set` (M01) membaca berkas jadi `potret/unduh/<tier_min>/<set>.csv|json` yang dirender pipa per tier (tidak digabung di Worker; batas CPU) dan menolak bila `tier < tier_min`.

CPU dan R2: tiap permintaan potret membaca sampai 1 + 4 + 1 berkas (publik, empat tier, pengurus) dan mem-parse semuanya di Worker (perilaku sekarang untuk dua lapis). Mitigasi wajib di N02: `caches.default` dengan kunci `potret/<benda>/<himpunan-lapis>/<dibangun_pada>` (hasil gabungan hanya bergantung pada himpunan lapis, bukan pengguna, jadi aman dibagi; `cache-control` respons ke klien tetap `private`), diisi lewat `ctx.waitUntil(cache.put)`; ukuran tertinggi per entri <= 2 x 4 MB. Pemeriksa: `perf-reviewer`, `security-reviewer`.

### P.5 Uji (JM-N02)

D1 lokal + R2 tiruan lokal: untuk TIAP benda dan TIAP peringkat 0 sampai 6: respons memuat tepat himpunan kolom yang diizinkan (tamu: tanpa satu pun kolom `anggota*`; pelajar: tanpa `anggota-t2` ke atas; dst.), tidak memuat kolom `pengurus` untuk non-staf; akun dengan `tierEfektif` kedaluwarsa jatuh ke `tamu`; `?lapis=anggota-t3` oleh individu = 403 `tier`. Nama uji: `potret.tier-kolom-per-peringkat`, `potret.tamu-hanya-publik`, `potret.tier-kedaluwarsa-tamu`, `potret.lapis-terlarang-403`, `potret.cache-kunci-himpunan-lapis`.

---

## §admin-wilayah: admin Wilayah dengan `cakupan_prov` (K23; JM-W01 sampai W03)

### W.1 Mekanisme hak

Ada dua mekanisme terpisah di kode sekarang dan keduanya tetap: (a) PERAN `wilayah` + `akun.cakupan_prov` (CHECK `(peran = 'wilayah') = (cakupan_prov IS NOT NULL)`, 0001): kursi provinsi; (b) tabel `wilayah_akun` (0019): anggota biasa yang ditautkan ke satu provinsi, memberi hak unggah ajuan `wilayah_ajuan`. K23 memakai (a). Ketua Wilayah = akun `peran = wilayah` dengan `cakupan_prov` = kode BPS provinsinya, dibuat admin (`POST /api/admin/akun`). `GET /api/saya` sudah mengeluarkan `cakupan_prov`.

Aturan (diuji D1 lokal sungguhan): (1) semua tulis lewat `hak.tulis` jenis `wil_*` sel `T prov`; (2) server MENIMPA `kode_prov` dengan `cakupan_prov` untuk `wilayah`; (3) wilayah lain DITOLAK pada `tambah`, `ubah`, `hapus`, dan tidak terlihat pada `baca`; (4) `admin` dan `super` mengelola semua provinsi dengan `kode_prov` eksplisit; (5) tiap tulis menghasilkan baris `jejak` (`susunJejak`) dengan tabel `wil_*`; (6) `wilayah` tanpa `cakupan_prov` nol baris.

### W.2 Halaman `/wilayah-admin` (JM-W02)

Berkas: `public/wilayah_admin.html`, `wilayah_admin.js`, `wilayah_admin.css` (pemilik `layar`); rute `src/wilayah_admin.js` (BARU, pemilik `worker`, mengikuti `src/wilayah_kelola.js`). Penjaga halaman: peran `wilayah`, `admin`, `super`; selain itu 302 atau 403 sesuai pola penjaga D19.

Tab: Ringkasan (hitung kegiatan, berita, pengurus, anggota provinsi), Kegiatan (agenda + notulen + foto), Berita, Dokumen, Pengurus, Anggota (hanya baca). `wilayah`: provinsi tetap, pemilih provinsi tidak tampil. `admin`/`super`: pemilih 38 provinsi (`prov=` pada tiap GET). Anggota provinsi: daftar `anggota_prov` (nama, jenis, organisasi, kota; TANPA HP, surel, atau berkas) -- mengelola berarti melihat dan menandai, bukan mengubah keanggotaan; persetujuan keanggotaan tetap di tab "Persetujuan anggota" pengurus Pusat (D20).

Kewajiban layar (AGENTS.md §5): INP (tab, paginasi, simpan tidak membekukan; `inp-reviewer`), dwibahasa (`i18n-guard`), tabel gradien `.jm-tabel` (D21), galat `role="alert"` dengan tombol Coba lagi, bagian opsional kosong disembunyikan, tanpa tombol dummy (K15), ikon menu di semua lebar.

### W.3 Papan publik per Wilayah (JM-W03; M08)

`GET /api/wilayah/papan/:kode` mengembalikan kegiatan terbit, berita terbit, pengurus (`wil_pengurus`, nama dan jabatan) dari D1 lewat `hak.baca` (klausa `terbit`); rapor provinsi, orang, organisasi, proyek provinsi dibaca layar dari JSON potret yang sudah ada (`wilayah.json`, `orang.json`, dst.). `orang.meti_wilayah` diisi pipa dari `meti_wilayah_orang.mjs` (sudah ada) dengan sumber; target cakupan mengikuti ALG-baru. Halaman `/wilayah/<kode>` sudah ada di penjaga `worker.js` (baris 236) dan diperluas, bukan diganti.

### W.4 Berkas R2

Foto kegiatan `wil/<kode>/<32 hex>.<ext>`, dokumen `wil-dok/<kode>/<32 hex>.<ext>` (CHECK 0041). Unggah memakai pola `agenda`/`wilayah_kelola` (tipe dan ukuran divalidasi di Worker dan CHECK; foto wajib `persetujuan_foto = 1`). Pembacaan berkas lewat rute berpenjaga (`GET /api/wilayah/foto/:fid`, `.../dokumen/:id/berkas`) yang memeriksa baris dan klausa lebih dulu; tidak ada URL R2 langsung.

---

## §berkas-agent: berkas dan pemilik agent per tiket

Pemilik mengikuti `scripts/agents/roster.json` (`milik` glob; satu berkas satu pemilik). Subagent tidak commit, push, deploy, atau migrasi produksi. Sebelum bekerja tiap agent menjalankan `node scripts/agents/ilmu.mjs pemilik <berkas>` (AGENTS.md §0). Pemeriksa dipanggil sesudah pengerja selesai, bukan oleh pengerja.

| Tiket | Pengerja dan berkas | Pemeriksa |
| --- | --- | --- |
| S01 | `worker`: `src/**`; `gerbang`: `tests/**` | security-reviewer, guard-api, hak-auditor |
| S02 | `worker`/`layar`/`pipa` per temuan | peninjau-bersih |
| S04 | `pipa`: `scripts/panen/berita.mjs`, pemanen `tarif_harga`, `obligasi_hijau`, data turunan; `gerbang`: uji tanpa Antara | higiene-repo |
| S05 | `pipa`: `scripts/pipa/proyek_satu.mjs` (BARU), `data/direktori/proyek_rekon.json`; `layar`: kartu penjelasan selisih; `gerbang`: `tests/proyek_satu.test.mjs` | validasi-model, selera-angka |
| S06 | `pipa`+`layar`: `public/data/teks_*.json`, blok kosong; `gerbang`: gerbang label internal | selera-angka |
| S07 | `worker`: `src/riwayat.js` (BARU) + rute di `src/worker.js`; `gerbang` | guard-api, hak-auditor |
| S08 | `gerbang`: `tests/e2e/cakupan.json`, `tests/e2e/*.test.mjs` (gerbang rute tak terdaftar) | penulis-gerbang |
| S10 | `worker`: `src/tanya.js`; `gerbang`: uji fixture injeksi | security-reviewer |
| S11 | `gerbang`: gerbang sinkron `MATRIKS` terhadap dokumen hak (`tests/gerbang-matriks-sinkron.test.mjs`); `worker`: hanya bila sel `src/hak.js` berbeda dari yang tertulis | hak-auditor, penulis-gerbang |
| T01 | `pipa`: `data/sumber_jadwal.json`, `scripts/panen/_bot.mjs`, `tests/bot_pustaka.test.mjs` (via `gerbang`) | higiene-repo |
| T02 sampai T05 | `pipa`: `.github/workflows/panen-*.yml`; `mekanik`: `package.json` (skrip) | higiene-repo, security-reviewer (izin workflow) |
| T06 | `pipa`: `scripts/pipa/rantai.mjs`, `rantai.json`, `bot_pr.mjs`, `scripts/pensiun.md`, `.github/workflows/potret.yml` | higiene-repo |
| T07 | `migrasi`: `0038_denyut.sql`; `worker`: `src/denyut.js`, `src/hak.js`, `src/worker.js`; `mekanik`: `wrangler.jsonc` | perf-reviewer, migrasi-idempoten, hak-auditor |
| T08 | `worker`: rute `/api/admin/kesegaran`; `layar`: `public/admin_kesegaran.js`, `public/inti/kesegaran_rumus.js`; `pipa`: `scripts/pipa/kesegaran_bangun.mjs` | validasi-model, selera-angka |
| U01 | `pipa`: `hukum/**` (BARU di roster, lihat Catatan 1), `scripts/hukum/ekspor_md.mjs`, `scripts/hukum/hukum.py`; `migrasi`: `0040_hukum_md.sql` | higiene-repo, migrasi-idempoten |
| U02, U03, U04, U05 | `pipa`: `scripts/hukum/**`, `data/hukum/**` (laporan target), `hukum/**` | higiene-repo, validasi-model |
| U06 | `pipa`: relasi dan status; `worker`: `src/hukum.js` | validasi-model, hak-auditor |
| U07 | `pipa`: `scripts/pipa/dampak_regulasi.mjs` (BARU); `layar`: bagian "Aturan yang mengikat" di profil proyek, organisasi, regulasi | validasi-model, selera-angka |
| L01 sampai L06 | `pipa`: `scripts/pipa/tautan_*.mjs`, `data/direktori/tautan.json`, `antrean_tautan.json`, `iati_org.json`; `layar` (L04, L06): profil memuat tautan masuk; `worker`+`migrasi`: `0039_tautan.sql`, rute antrean | validasi-model, penulis-gerbang |
| L07 | `pipa`: `scripts/pipa/indeks_cari.mjs`; `layar`: `public/inti/cari_global.js` | selera-angka |
| L08 | `gerbang`: `tests/gerbang-tautan.test.mjs` (garis dasar naik-saja, `tests/e2e/cakupan_tautan.json`) | penulis-gerbang |
| W01 | `migrasi`: `0041`; `worker`: `src/hak.js` (kode sel, klausa, entri tabel); `gerbang` | migrasi-idempoten, hak-auditor |
| W02 | `worker`: `src/wilayah_admin.js`; `layar`: `public/wilayah_admin.*` | security-reviewer, guard-api, inp-reviewer |
| W03 | `layar`: `public/wilayah.*`; `worker`: `/api/wilayah/papan/:kode` | i18n-guard, selera-angka |
| N01 | `migrasi`: `0042`; `worker`: `src/hak.js` (`bacaSesi`, `lapisBoleh`), `src/sesi.js`, `src/daftar.js`, `src/akun.js` | migrasi-idempoten, hak-auditor, security-reviewer |
| N02 | `pipa`: `scripts/pipa/potret.mjs`, `data/tier_kolom.json`, `jaga_unggah.mjs`; `worker`: `src/direktori.js` | security-reviewer, perf-reviewer |
| N03 | `layar`: `public/manfaat.*`, `public/inti/tier_rumus.js` (BARU, bersama Worker) | i18n-guard, selera-angka |
| M01 sampai M12 | per baris TIKET (worker, layar, pipa, migrasi); `gerbang` untuk uji integrasi | per tiket; wajib `hak-auditor` bila ada tabel baru |
| Z02 | `peninjau-bersih` | security-reviewer, perf-reviewer, inp-reviewer, i18n-guard, selera-angka, higiene-repo |

Jalur tulis menurut TIKET §3 (W: `src/**` dan `migrations/**`; L: `public/**`; P: `scripts/**` dan `data/**`; G: `tests/**`) tidak diubah.

---

## §biaya: kuota D1, Worker, Actions

Asumsi paket (belum dicek terhadap dasbor akun; verifikasi sebelum angka dipakai memutuskan): D1 Free: baca 5 juta baris/hari, tulis 100 ribu baris/hari, 5 GB; Worker Free: 100 ribu permintaan/hari, 50 subrequest per invokasi, 10 ms CPU. Bila akun berbayar, semua batas jauh lebih longgar dan rancangan tetap berlaku.

### Q.1 D1

| Beban | Baca baris/hari | Tulis baris/hari | Dasar |
| --- | --- | --- | --- |
| `bacaSesi` + `LEFT JOIN akun_tier` (N01) | + 1 per permintaan terautentikasi; 5.000 permintaan = 5.000 | 0 | lookup kunci primer |
| Denyut (2 putaran) | sekitar 300 (<= 80 sumber + indeks, 2x) | sekitar 84 (<= 40 pembaruan + 1 log, 2x) | B.6 |
| Panel kesegaran dibuka 50 kali | 4.000 (80 baris) | 0 | `sumber_denyut` kecil |
| Antrean tautan, 100 daftar halaman 50 baris | 5.000 | 0 | indeks `tautan_antrean_urut` |
| Keputusan kurator, 100/hari | 200 | 100 + jejak 100 | PK/UNIQUE |
| Muat antrean mingguan | 1.200 sekali | 1.200 sekali per minggu (sekitar 170/hari) | M.3 |
| `wil_*` (38 provinsi aktif) | sekitar 2.000 | sekitar 100 + jejak | kecil |
| `hukum_*` (pencarian FTS, pola lama) | tergantung 27.901 segmen; tidak berubah | impor satu kali | tetap |
| Total tambahan | kurang dari 20.000 | kurang dari 700 | sekitar 0,4% baca, 0,7% tulis dari kuota Free |

Penyimpanan: `sumber_denyut` kecil (< 100 KB); `denyut_putaran` 2 x 365 x ~60 B = ~44 KB/tahun (dipangkas 90 hari); `tautan_antrean` <= 1.200 baris aktif + riwayat putusan (sekitar 1 MB/tahun); `wil_*` metadata kecil, notulen <= 30 KB; berkas di R2.

### Q.2 Worker

Cron: denyut +2 invokasi/hari (masing-masing <= 42 subrequest termasuk D1, di bawah 50; CPU kecil karena menunggu I/O; verifikasi batas CPU cron paket Free). Permintaan: gerbang tier tidak menambah permintaan. Potret berlapis menaikkan jumlah GET R2 per tampilan benda dari 2 menjadi sampai 6; dengan cache `caches.default` (P.4) pembacaan R2 berkurang sebanding rasio kena cache. Perkiraan tanpa cache: 200 pengguna x 30 tampilan x 6 = 36.000 R2 Class B/hari = ~1,1 juta/bulan, di bawah gratis 10 juta/bulan.

### Q.3 R2

Penyimpanan baru: foto wilayah (maks 40 x 5 MB per kegiatan, praktik jauh lebih kecil), dokumen (<= 20 MB), lapis tier (puluhan MB), unduhan prarender per tier (puluhan MB). Jauh di bawah 10 GB gratis. Unggah R2 produksi dijalankan pemilik.

### Q.4 GitHub Actions

Perkiraan menit/bulan: harian 15 menit x 30 = 450; mingguan 60 x 4 = 240; bulanan 120; kuartalan 60 per kuartal (20/bulan); gerbang di PR sudah di dalam job; total sekitar 830 sampai 900 menit/bulan. Repo publik mendapat runner standar tanpa batas menit; bila repo menjadi privat batas 2.000 menit paket Free masih cukup (kebijakan GitHub dari pengetahuan umum, belum diverifikasi). Penyimpanan repo: `hukum/` 60 sampai 100 MB (satu kali), pertumbuhan data bot kecil berkat aturan "tulis hanya bila isi berubah" (B.5 butir 3); PDF mentah tidak masuk repo; OCR lokal, tidak memakai menit. Artefak Actions dipakai untuk log ringkas (retensi 7 hari) dan `hasil-panen` antar job (retensi 1 hari).

---

## Catatan untuk induk

Penyimpangan atau pertentangan terhadap KEPUTUSAN atau dokumen di atasnya, dan hal yang butuh keputusan. Tidak ada yang diputuskan sendiri kecuali pilihan bawaan yang disebut.

1. **Roster agent belum memiliki `hukum/**`.** `scripts/agents/roster.json` `pipa.milik` tidak memuat `hukum/**`, jadi U01 melanggar aturan "satu berkas satu pemilik". Perlu entri baru (dikerjakan `mekanik`, `agents:build`) sebelum U01. Begitu pula `public/data/dampak_regulasi.json` (tercakup `data/**` dan `public/**`: pemilik `layar` untuk `public/**`; ubah ke `pipa` bagi `public/data/**` bila diinginkan).
2. **D22 dan CHECK `akun.status` (selesai).** `0001` menjaga `status IN ('menunggu','aktif','nonaktif')` dan ada pola penolakan membangun ulang `akun`; D22 sendiri menetapkan tier di tabel pendamping `akun_tier` (M.6), CHECK `akun.status` tidak diubah. Tamu adalah `keanggotaan = 'tamu'`, bukan nilai `akun.status`.
3. **Kontak korporat tidak dipindah (C-23, diputuskan).** `organisasi.kontak` tetap di lapis `publik` dan terlihat semua yang login; tidak ada kolom `organisasi` yang berpindah lapis. Tier individu tetap bernilai lewat kolom lain di `anggota-t2` (`angka.*` tanpa URL publik, `keuangan.baris` `tarif` dan `bpp` rinci). Yang berlaku untuk fitur `kontak` hanya kontak pakar dan kontributor (ALG-baru `§tier` R.3).
4. **Bot membaca keputusan kurator (D23, diputuskan).** `GET /api/bot/tautan-putus` memakai bearer `BOT_RAHASIA` (secret Worker dan Actions): hanya-baca, dibandingkan waktu-tetap, terbatas laju, dan tiap panggilan tercatat di `jejak` (KEAMANAN-PRIVASI §4.1). Rute ini bukan pengecualian D19 untuk halaman; ia bukan sesi dan tidak menyentuh tabel lain. PR dari `GITHUB_TOKEN` tidak memicu `uji.yml`; gerbang berjalan di job `uji` (B.4).
5. **`LAPIS_PERAN` di `src/direktori.js` menyimpang dari `hak.lapisBoleh`.** Dua sumber kebenaran untuk lapis (potret memakai daftar sendiri berbasis `PENGURUS`, bukan `hak.js`). P.4 menyatukannya; ini melintasi dua berkas pemilik `worker` dan mengubah perilaku sekarang (`wilayah` kini hanya `publik` dan `anggota`, tetap sama pada rancangan ini). Uji regresi diwajibkan.
6. **Batas Worker belum diverifikasi.** Angka 50 subrequest (Free), 10 ms CPU, jumlah trigger cron, dan kuota D1/R2 berasal dari pengetahuan umum dan dokumen riset 11 Nov yang menandainya "perlu verifikasi". Rancangan denyut sengaja konservatif (40 fetch + 2 D1). Paket akun sebenarnya (Free atau berbayar) perlu dipastikan pemilik.
7. **`wilayah_akun` (0019) dan peran `wilayah`** adalah dua mekanisme keanggotaan wilayah yang tumpang tindih; K23 memakai peran `wilayah` (W.1). Penyatuan atau pembiaran keduanya butuh keputusan; rancangan ini tidak menyentuh `wilayah_akun`.
8. **Id regulasi dengan tanda hubung ganda** (`pergub--jakarta-5-2026`) di `hukum_dok` adalah cacat penamaan data lama. R.1 menormalkan nama berkas dan menyimpan `id_lama`; perbaikan di sumber (`hukum_dok.id`) menyentuh `regulasi_id` dan tautan, jadi tidak dilakukan di sini.
9. **Penomoran migrasi seri M (0043 sampai 0050)** dikunci sekarang untuk menghindari tabrakan; bila urutan pengerjaan M berubah, nomor yang BELUM dijalankan boleh disusun ulang, yang sudah jalan tidak.
10. **`istilah.json` 2,12 MB** melampaui batas 2 MB yang berlaku untuk berkas potret publik. Itu aset statis di luar skema potret, tetapi menyalahi semangat Aturan 4 SKEMA-POTRET; tidak diubah di sini.
11. **Kepemilikan `org_id` untuk tabel organisasi.** Hak per pemilik pada `pemasang`, `produk_daftar`, `temu_profil` butuh pemetaan akun ke organisasi. Belum diperiksa apakah tautan itu sudah ada di `migrations/0001` sampai `0037`; pengerja `migrasi` memeriksanya di awal M03 dan menambah tabel pendamping bila tidak ada. Pertanyaan ke pemilik tidak diperlukan; hanya pemeriksaan.
