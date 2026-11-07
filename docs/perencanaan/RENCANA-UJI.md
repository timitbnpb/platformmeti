# RENCANA-UJI: Platform Jaringan METI

Dokumen kesepuluh dalam urutan otoritas (`KEPUTUSAN-METI` > `GRAND-DESIGN` > `RISET` > `PRD` > `ALUR` > `ALGORITMA` > `DESIGN-SYSTEM` > `DESAIN-TEKNIS` > `KEAMANAN-PRIVASI` > `RENCANA-UJI` > `TIKET`). Posisi otoritas: sesudah `KEAMANAN-PRIVASI`, sebelum `TIKET`. Menang atas TIKET; kalah dari semua dokumen di atasnya. RU tidak menambah fitur, tabel, atau rute; ia menetapkan bukti bahwa yang sudah tertulis di paket ini bekerja. Versi 1, 7 Nov 2026.

> **Untuk pekerja agen:** "selesai" berarti perintah bukti di tiketmu keluar 0 dan pemeriksa tidak punya temuan tinggi. Baca §0, bagian lapisan yang menyentuh tiketmu, lalu baris tiketmu di §7.3. Uji yang salah DITOLAK wajib ada untuk tiap aturan. Mock bukan bukti. Yang tidak tertulis: berhenti dan tanya pemilik. Subagent tidak commit, push, atau deploy.

Singkatan: KP = KEPUTUSAN-METI, PRD, ALG = ALGORITMA, DS = DESIGN-SYSTEM, DT = DESAIN-TEKNIS, KPV = KEAMANAN-PRIVASI, RU = RENCANA-UJI, OP = OPERASIONAL. Lambang peran sama dengan KPV §1: PB, AN, PG, KR, WL, AD, SA. Sumber aturan global pemilik: `~/.claude/TEST.md` (uji integrasi), `~/.claude/DUMMY.md` (data dummy), `~/.claude/INP.md` (klik tidak membekukan layar).

## 0. Aturan dasar

1. **Selesai = bukti keluar 0 + pemeriksa tanpa temuan tinggi** (TIKET §1 butir 3). Bukti dijalankan lokal dan hijau di CI (§6).
2. **Logika yang tinggal di luar JavaScript murni diuji dengan menjalankannya.** CHECK, trigger, indeks, FTS5, hak baris di `hak.js`, handler rute, dan alur lintas tabel diuji terhadap D1 lokal NYATA (workerd lewat Miniflare), R2 lokal nyata, dan handler Worker utuh. Unit test bermock tidak pernah menjadi bukti. Hanya tiga hal yang boleh diganti: sistem luar (OpenAlex, Overpass, Workers AI, tile peta) dengan fixture rekaman, jam (`kini` disuntikkan), dan sumber acak (untuk vektor tetap).
3. **Uji bahwa yang salah DITOLAK**, bukan hanya bahwa yang benar tersimpan. Tiap aturan hak, CHECK, trigger, dan gerbang punya uji tolak berpasangan dengan uji terima (KP D7, KPV §1).
4. **Invarian, bukan potret data.** "Sel matriks = baris x peran" dihitung dari fixture; "tidak ada fakta tanpa sumber" benar selamanya. Asersi seperti "entitas berjumlah 300" tidak ditulis di uji (itu laporan pipeline, PRD U1).
5. **Pesan gagal menyebut angka dan sebab teknis**, terbaca sekali jalan oleh orang yang berdiri di depan CI merah. Semua uji gagal lewat `tests/helper/pesan.mjs` (`gagal({uji, harapan, hasil, sebab, periksa})`). Contoh: `sel akun/anggota ubah kolom "peran" pada baris sendiri: diharapkan DITOLAK, hasil DIIZINKAN (peran=anggota, aksi=ubah, jenis=akun). Periksa MATRIKS.akun[1] dan KOLOM_TULIS.akun.diri di src/hak.js.`
6. **Berhenti di galat pertama.** `node --test` mengembalikan kode keluar tak nol pada satu uji gagal; skrip pembungkus memakai `set -euo pipefail`; runner SQL berhenti di asersi pertama yang gagal. Uji yang gagal tetapi melapor lolos lebih buruk daripada tanpa uji.
7. **Aturan tanpa gerbang mekanis dianggap belum jadi.** Gerbang diperinci di §1.4; tiap gerbang punya fixture jahat yang harus membuatnya merah (§1.5).
8. **Uji tidak menyentuh produksi.** Hanya `npm run uji:asap` (§5.4) yang bicara dengan situs hidup, dan hanya dengan GET serta permintaan yang pasti ditolak sebelum menulis apa pun.
9. **Tanpa data pribadi nyata dan tanpa rahasia di uji.** Fixture memakai `example.org` dan akhiran "(contoh)"; surel uji berakhiran `@example.org`; sandi uji dibangkitkan acak per proses dan tidak dicetak; CI tidak membawa rahasia produksi (DT §7.3, KPV §9).

## 1. Lapisan, alat, dan gerbang mekanis

### 1.1 Piramida

```
                   asap produksi (§5.4)           1 skrip, GET saja, sesudah deploy [manusia]
                  /                    \
            layar Playwright (§2.3)   e2e alur (§2.5)       sedikit, lambat, jalan di PR yang menyentuhnya
           /                                             \
     rute + hak + D1 nyata (§2.2, §2.4, §3)               banyak, sedang, workerd + SQLite nyata
    /                                                       \
  fungsi murni + acuan ALG (§2.1)    gerbang statis (§1.4)    paling banyak, paling murah, tanpa DB dan tanpa peramban
```

| Logikanya di | Diuji dengan | Berkas | Perintah |
| --- | --- | --- | --- |
| Fungsi murni (format, hitung, `esc`, `normNama`, `haversine`, skor) | unit test biasa, banyak, cepat | `tests/util.test.mjs`, `tests/algo.test.mjs`, `tests/i18n.test.mjs` | `npm run uji:unit` |
| Sandi PBKDF2 (batas iterasi hidup di workerd, bukan di Node) | uji di workerd lewat pekerja uji | `tests/sandi.test.mjs` | `node --test tests/sandi.test.mjs` |
| CHECK, trigger, indeks, FTS5, kunci asing | SQL langsung ke D1 lokal, asersi per aturan | `tests/skema.test.mjs`, `tests/migrasi.test.mjs`, `tests/eksplain.test.mjs`, `tests/cari.test.mjs` | `npm run uji:d1` |
| Hak baris (`hak.js`) | satu uji per sel, D1 nyata | `tests/hak.test.mjs` | `node --test tests/hak.test.mjs` |
| Handler rute dan penjaga peran | panggil Worker utuh (`fetch`), bukan mock klien | `tests/rute-peran.test.mjs`, `tests/sesi.test.mjs`, `tests/akun.test.mjs`, `tests/rute/*.test.mjs` | `npm run uji:d1` |
| Alur lintas tabel (akun, kurasi, potret, hak) | satu uji ujung ke ujung melewati semua tahap | `tests/e2e/alur.test.mjs`, `tests/e2e/*.sql` | `npm run uji:e2e` |
| Pipeline Node (hubung, potret, jaga_unggah) | fixture kurasi + R2 lokal | `tests/hubung.test.mjs`, `tests/potret.test.mjs`, `tests/jaga-unggah.test.mjs`, `tests/daftar-tolak.test.mjs` | `npm run uji:d1` |
| Pipeline Python (panen) | stdlib `unittest`, fixture rekaman, tanpa jaringan | `tests/panen/uji_*.py` | `npm run uji:pipa` |
| Layar | Playwright di 1440 dan 390 px | `tests/layar/*.spec.mjs` | `npm run uji:layar` |
| Aturan teks, header, rahasia, model agent | gerbang statis, tanpa DB dan tanpa peramban | `tests/gerbang-*.test.mjs` | `npm run uji:gerbang` |

`npm run uji` = `uji:gerbang` + `uji:unit` + `uji:d1` + `uji:e2e` + `uji:pipa` (tanpa peramban, bukti TIKET JM-A02). `npm run uji:semua` menambah `uji:layar`.

### 1.2 Alat (versi dipin; menambah alat baru mengubah bagian ini)

| Alat | Dipakai untuk | Catatan |
| --- | --- | --- |
| Node 22 LTS (`.nvmrc`, `engines`) | semua uji JS | `node:test` dan `node:assert/strict` bawaan; tanpa Jest dan tanpa Vitest (tambahan dependensi tanpa nilai) |
| `wrangler` (devDependency, versi dipin) | menerapkan migrasi ke D1 lokal, `wrangler dev --local` untuk uji layar | pasangan versi dengan Miniflare dicatat di `package.json` |
| `miniflare` (devDependency, dipin) | membuka D1, R2, dan Worker di workerd dalam proses uji | satu runtime dengan produksi, bukan SQLite pengganti |
| Playwright + `@axe-core/playwright` (devDependency) | uji layar, aksesibilitas, INP | hanya Chromium; tidak dimuat di runtime situs, jadi KP D4 (tanpa build step) tetap utuh |
| Python 3.12, `unittest` | uji pipeline panen | stdlib saja, sama dengan aturan skrip panen (DT §7.1 butir 3) |
| `tests/helper/*.mjs` | `d1.mjs` (baseline dan salinan), `akun.mjs` (membuat akun uji per peran), `pekerja-uji.mjs` (Worker uji untuk sandi), `pesan.mjs` (format gagal), `jam.mjs` (`kini`) | tidak dikirim ke produksi |

### 1.3 D1 lokal nyata dan isolasi (padanan "runner yang membungkus transaksi" di TEST.md)

D1 tidak punya transaksi lintas panggilan, jadi isolasinya diganti salinan basis data segar:

1. **Baseline.** `tests/helper/d1.mjs` membangun sekali per isi folder `migrations/` (kunci = sha256 semua berkas): `wrangler d1 migrations apply jaringan-meti --local --persist-to .wrangler/uji/baseline`. Jalur yang sama dengan produksi, jadi trigger berbaris banyak dan FTS5 diterapkan persis seperti nanti. Pemanggilan `exec()` per baris TIDAK dipakai untuk migrasi karena memecah trigger.
2. **Salinan per berkas uji.** Tiap berkas uji menyalin baseline ke folder sementara dan membuka Miniflare di atasnya. Berkas yang lupa membersihkan tetap tidak bisa menetapkan apa pun untuk berkas lain. Fixture dimuat lewat `INSERT` di awal berkas, bukan lewat `wrangler`.
3. **Pagar harness.** Awal tiap berkas: `PRAGMA foreign_keys` harus 1 dan `SELECT sqlite_version()` dicatat. Bila kunci asing mati, uji `REFERENCES` akan berbohong, jadi harness gagal sebelum uji pertama.
4. **R2 lokal** lewat `r2Persist` yang disalin sama. Binding `BERKAS` dan `AI` disuntikkan; `AI` hanya perekam muatan keluar (§2.4).
5. **Jam.** Rute menerima `kini` (DT §4.1 butir 1); uji memajukan jam untuk kedaluwarsa sesi, tautan aktivasi, dan jendela laju tanpa tidur.
6. **Batas jujur Miniflare.** Ia bukan produksi: kuota, batas CPU 10 ms, latensi, dan perilaku tepi tidak ditiru. Karena itu ada uji asap produksi (§5.4) dan pengukuran CPU di `wrangler tail` (§2.6).

### 1.4 Daftar gerbang mekanis

Semua gerbang adalah `node --test` biasa tanpa DB dan tanpa peramban, kecuali dicatat. Nama berkas di `tests/`.

| Gerbang | Merah bila | Aturan sumber | Tiket |
| --- | --- | --- | --- |
| `gerbang-d1.test.mjs` | `env.DB`, `.prepare(`, `.batch(`, atau `.exec(` muncul di `src/**` di luar `hak.js` | KP D7, KPV §2.4, DT §5.7 | JM-B04 |
| `gerbang-r2.test.mjs` | `env.BERKAS` muncul di luar `src/potret.js`, `src/direktori.js` (gambar, ringkasan), `src/kurasi.js` (hapus permanen) | DT §5.7 | JM-B04 |
| `gerbang-rute.test.mjs` | ada rute `/api/*` tanpa pernyataan peran; ada rute di tabel DT §4.3 yang belum ada; ada tulis lewat `GET` | KPV §2.5, DT §4.1 | JM-A05 |
| `gerbang-matriks-sinkron.test.mjs` | `MATRIKS` di `hak.js`, `tests/fixtures/matriks.json`, dan tabel KPV §1 (diparse dari markdown) tidak sama persis | KPV §1 penutup | JM-B04 |
| `gerbang-matriks.test.mjs` | klausa dirujuk di `MATRIKS` tetapi tak terdefinisi di `KLAUSA`, atau terdefinisi tetapi tak pernah dirujuk | DT §5.6 butir 4 | JM-B04 |
| `gerbang-headers.test.mjs` | CSP punya `'unsafe-inline'` di `script-src`, memuat `*`, ada sumber luar tak terdaftar; HTML atau JS memuat `style=`, `onclick=`, atau `<script>` tanpa `src`; `robots.txt` tak sama dengan KPV §6; header halaman terkunci kurang | KPV §8 butir 7 | JM-A05 |
| `gerbang-taksonomi.test.mjs` | daftar nilai di CHECK migrasi tidak sama dengan `public/taksonomi.js` (sektor, kategori, jenis, jenis ikatan, tingkat bukti, jenis sumber, rantai, peran, aksi jejak) | DT §3 pembuka | JM-D01 |
| `gerbang-migrasi.test.mjs` | nomor tidak berurutan atau lewat 0099; `CREATE` tanpa `IF NOT EXISTS`; `INSERT` data tetap tanpa `OR IGNORE`; ada `DROP`, `ALTER ... DROP COLUMN`, atau `DELETE` pada data; hash berkas yang sudah ditandai beku berubah (`tests/fixtures/migrasi-beku.json`) | DT §3.7, TIKET §0 | JM-B01 |
| `gerbang-i18n.test.mjs` | kunci `id.json` tidak sama dengan `en.json`; `t("...")` merujuk kunci yang tak ada; teks Indonesia tertanam di JS layar baru (heuristik kata penghubung, pengecualian bersyarat di `tests/fixtures/teks-diizinkan.json` dengan alasan) | PRD U6, DT §8.4 butir 5 dan 6 | JM-C06 |
| `gerbang-teks.test.mjs` | titik tengah (U+00B7) atau em dash (U+2014) di `public/**` dan `docs/perencanaan/*.md`; sisa asal `BNPB`, `BPBD`, `karhutla`, `DIBI` di `public/direktori.*`; `lorem`, `TODO` terlihat; angka diformat dengan `toLocaleString` di luar `public/i18n.js` | KP D17, TIKET JM-C03 | JM-C07 |
| `gerbang-dummy.test.mjs` | tabel data tanpa kolom `dummy`; halaman berlayar data tanpa tombol; tombol terpasang untuk peran selain SA; tabel ber-`dummy` yang dibaca halaman tetapi tak ditulis pengisi mana pun dan tak masuk daftar dikecualikan | KP D18, DT §8.3, DUMMY.md kelas A | JM-C07 |
| `gerbang-dummy-layar.test.mjs` | peta `NAMA_DUMMY` halaman ke pengisi tidak lengkap, atau pengisi tidak mendaftarkan periode yang terpampang | DUMMY.md syarat 1 | JM-C07 |
| `gerbang-inp-transisi.test.mjs` | kontrol berchrome (tab, chip, paginasi, sort, lipat, kotak cari) dibuat di luar rumah kontrol bersama; `aria-selected`, `aria-pressed`, `aria-expanded`, `aria-current` ditulis di luar rumah itu; handler tidak ada di `tests/inp-daftar.json` padahal menunda chrome (§2.3.3) | INP.md | JM-C07 |
| `gerbang-kontras.test.mjs` dan `gerbang-token-meti.test.mjs` | pasangan di `tests/kontras.json` gagal AA bila dihitung ulang dari `tema.css`; hex di CSS selain `tema.css`; teal asli `#0A896A` dipakai sebagai teks; dua blok mode gelap tidak identik; `:focus` tanpa `:focus-visible` | DS §2.1, DS checklist | JM-C01 |
| `gerbang-rahasia.test.mjs` | pola `-----BEGIN`, `Bearer `, `sk-`, `AKIA` di berkas terlacak; berkas terlarang terlacak (`.dev.vars`, `daftar-tolak.json`, `*.sqlite`, `data/pribadi/`); `.gitignore` kurang entri KPV §9; `wrangler.jsonc` berisi id bukan kosong; `.dev.vars.example` berisi nilai | KPV §9 | JM-A02 |
| `gerbang-workflow.test.mjs` | `uji.yml` memakai `pull_request_target`, merujuk `secrets.`, atau tanpa `permissions: contents: read`; jumlah jadwal (`cron`) di workflow dan `wrangler.jsonc` lebih dari 5 | DT §7.3, TIKET §0 | JM-A02 |
| `gerbang-panen.test.mjs` | skrip panen mengimpor di luar stdlib; ada permintaan HTTP ke host 1001startup.id; skrip tanpa pembacaan `robots.txt`; `User-Agent` tanpa kontak METI; skrip mencetak variabel rahasia | KPV §6, DT §7.1, ADR-06 | JM-D03 |
| `gerbang-test-integrasi.test.mjs` | tabel, trigger, rute, skrip, atau fungsi ekspor baru tidak ada di `tests/cakupan.json`; entri `diuji` menunjuk berkas yang tak ada atau tak menyebut butirnya; entri `dikecualikan` tanpa alasan; `antre` bertambah (§6.1) | TEST.md, TIKET §1 butir 5 | JM-A02 |
| `gerbang-model-agent.test.mjs` | `CLAUDE_CODE_SUBAGENT_MODEL` tidak terpasang atau ada agent di `roster.json` tanpa `model:` | AGEN.md | JM-A01 |
| `gerbang-ilmu-agent.test.mjs` | katalog agent basi; berkas ilmu di bawah 2.000 karakter; sebuah berkas kode punya nol atau lebih dari satu pemilik | AGEN.md, DT §2.3 | JM-A01 |
| `gerbang-rujukan-dokumen.test.mjs` | rujukan `DT §n`, `KPV §n`, `RU §n`, `PRD §n`, `DS §n`, `KP` di `docs/perencanaan/*.md` menunjuk judul yang tidak ada di dokumen tujuan (rujukan `ALG §n` dicek bila `ALGORITMA.md` sudah ada) | pelajaran RU §n yang pernah menggantung | JM-H03 |
| `gerbang-penyelarasan.test.mjs` | ada kode fitur `F-xxx` di `PRD.md` tanpa baris di `PENYELARASAN.md` | PRD §11, TIKET JM-H03 | JM-H03 |
| Port gerbang layar asal: `direktori-seg`, `direktori-klik`, `direktori-layar`, `direktori-versi`, `hubung`, `lembaga-gabung` | sama dengan di asal (kelas `.ak-*`, klik, segmen, versi aset, graf, penggabungan lembaga), diadaptasi ke domain energi | DT §2.1 Uji | JM-C07 |

### 1.5 Aturan memasang gerbang

1. **Daftar per butir, bukan per berkas.** Pengecualian dicatat per handler, per tabel, atau per rute. Pengecualian per berkas meloloskan semua isi berkas yang sama tanpa terlihat (kegagalan paling sunyi menurut INP.md).
2. **Gerbang dibuktikan merah.** Tiap gerbang punya folder `tests/fixtures/gerbang/<nama>/jahat/` berisi contoh pelanggaran; satu uji di berkas gerbang itu menjalankan pemindainya atas folder tersebut dan menuntut hasil merah. Gerbang yang tidak pernah terbukti merah belum jadi.
3. **Pemindai mengenali beberapa bentuk penulisan** (handler bernama, atribut bersyarat di baris berikutnya, nama berbahasa Inggris), bukan satu pola regex tunggal.
4. **Gerbang tidak dilemahkan untuk meloloskan kerja.** Mengubah ambang atau daftar pengecualian lewat PR tersendiri yang ditinjau `security-reviewer` bila menyangkut hak, header, atau rahasia.

## 2. Kriteria terima

### 2.1 Fungsi murni dan acuan ALGORITMA

Satu implementasi (`public/taksonomi.js`, `public/algo.js`, ADR-03) dimuat Worker, Node, dan layar; maka tidak ada uji kesepadanan Python dan JS. Gantinya, **kasus acuan dengan nilai harapan dihitung tangan** disimpan di `tests/fixtures/acuan.json` (`id`, `fungsi`, `diberikan`, `harapan`, `rujukan ALG §n`) dan dijalankan oleh `tests/algo.test.mjs`. Modul harus bisa diimpor di Node tanpa `window` (penempelan ke `window.JM` dijaga `typeof window`).

`ALGORITMA.md` belum ada di folder ini saat RU versi 1 ditulis. Kasus berlabel "ALG" di bawah adalah keluarga dengan jumlah minimum; nilai harapannya diisi `penulis-gerbang` dari ALGORITMA begitu dokumen itu ada, dan tidak boleh diturunkan dari keluaran kode yang sedang diuji.

| Keluarga | Fungsi | Kasus minimum | Hasil yang dituntut |
| --- | --- | --- | --- |
| N | `normNama`, kunci dan slug (ALG §1) | variasi huruf besar, tanda baca, "PT", "Tbk", "(Persero)", diakritik, spasi ganda; 12 kasus | hasil tangan; idempoten: `norm(norm(x)) == norm(x)`; slug lolos `^[a-z0-9-]{2,60}$` dan tidak diawali atau diakhiri "-" |
| D | dedup dan alias (ALG §3) | pasangan sama, mirip, dan sengaja ambigu; 10 kasus | yang ambigu masuk antrean kurator, tidak digabung; hasil komutatif terhadap urutan masukan |
| K | `hitungKeyakinan` (ALG §4) | satu sumber, banyak sumber, sumber basi, sumber bertentangan, `via-pihak-ketiga`; 12 kasus | angka 0 sampai 1 sama dengan hasil tangan; label Tinggi, Sedang, Rendah di batasnya; `via-pihak-ketiga` tidak pernah Tinggi (ADR-06); lebih banyak sumber bebas tidak menurunkan skor |
| Q | kuadran dan skor 0 sampai 5 (ALG §5) | titik di tiap kuadran, di sumbu, data kosong; 10 kasus | kuadran benar; data kosong `-`, seri `=` (DS) |
| S | `strategis()` dengan DIRI = METI (ALG §6) | METI Pusat, METI Wilayah, METI Institute, METI Energi Muda, mitra biasa | keempat entitas METI tidak diberi bintang (KP D13); lencana "Anggota METI" hanya bila `anggota_meti = 1` |
| C | sensus (ALG §8) | entitas tiap sektor, `nuklir`, `ccs`, jenis non lembaga | `nuklir` dan `ccs` tidak masuk hitungan; entitas di luar sensus tidak dihitung |
| G | `haversine` (ALG §10) | titik sama, antipoda, dua kota Indonesia dengan jarak dihitung tangan | simetris, nol untuk titik sama, galat di bawah 0,5 persen terhadap nilai tangan |
| F | `angka()` dan `tanggal()` (KP D17) | `angka(1234567.5)` | mode ID `1.234.567,5`; mode EN `1,234,567.5`; `angka(0)` memberi `0` di kedua mode; tidak mengandung titik tengah |
| E | `esc()` | `<img src=x onerror=alert(1)>`, `"`, `'`, `&`, tanda petik balik | semua metakarakter HTML menjadi entitas; hasil tidak mengandung `<` mentah |
| U | `util.js` | `bacaBody` batas 65.536 byte; `cacheTepi` kunci tanpa cookie; `ipHash` garam harian | 65.537 byte menghasilkan `terlalu-besar`; dua permintaan beda cookie, satu kunci cache; hash berbeda antar hari, sama dalam sehari, tidak memuat IP mentah |

### 2.2 Uji matriks hak: 112 sel, izin dan DITOLAK

`tests/hak.test.mjs` membangkitkan uji dari `tests/fixtures/matriks.json` (salinan KPV §1) terhadap D1 lokal nyata dengan migrasi 0001 sampai 0006. Jumlah uji dasar = jumlah baris x jumlah peran dibaca dari fixture (16 x 7 = 112 hari ini) dan dibandingkan dengan jumlah uji yang benar-benar dibangkitkan; selisih apa pun merah. Perubahan `MATRIKS` tanpa perubahan KPV §1 dan fixture merah lewat `gerbang-matriks-sinkron`.

Fixture data: satu akun aktif tiap peran (WL dua: cakupan `91` dan cakupan `92`; satu WL tanpa cakupan tidak bisa ada karena CHECK akun, jadi kasus "tanpa cakupan" diuji pada fungsi klausa), baris contoh tiap jenis data di tiga lapis, baris `dummy = 1`, baris provinsi `91` dan `92`.

| Kode sel | Uji terima (harus diizinkan) | Uji DITOLAK (wajib) |
| --- | --- | --- |
| `-` | tidak ada | semua delapan aksi (`baca`, `tambah`, `ubah`, `hapus`, `kirim`, `cabut`, `tinjau`, `hapus_keras`) ditolak oleh `boleh()` DAN lewat `baca`/`tulis` terhadap D1 nyata; jumlah baris tidak berubah; pesan menyebut peran, aksi, jenis data (DT §5.4 butir 4) |
| `B` | `baca` mengembalikan baris lapis yang boleh | `tambah`, `ubah`, `hapus` ditolak; baris `dummy = 1` tak terbaca (kecuali SA); baris lapis lebih tinggi tak terbaca |
| `B prov` | WL `91` membaca baris `prov = 91` | baris `prov = 92` tak terbaca; klausa `prov` tanpa cakupan menghasilkan 0 baris |
| `T` | `tambah` dan `ubah` pada baris valid; satu baris `jejak` tertulis dalam `batch` yang sama dengan datanya | aksi di luar daftar sel ditolak; kegagalan pernyataan kedua dalam `batch` membatalkan data DAN jejak (atomik); `hapus_keras` hanya lewat rute hapus-permanen dengan koreksi `diterima` |
| `T diri` | ubah `nama` dan `bahasa` baris sendiri | ubah `peran`, `status`, `cakupan_prov`, `surel` sendiri ditolak; ubah akun orang lain ditolak; kolom rahasia tak pernah terpilih |
| `T bukan-super` (AD pada `akun`) | ubah akun non-super lain | menyentuh baris `peran = 'super'`, menetapkan `super`, atau mengubah peran sendiri ditolak (sama dengan §3.4) |
| `T cabut` (AD pada `sesi`) | cabut semua sesi satu akun | cabut sesi yang bukan miliknya lewat rute non-admin ditolak |
| `T kirim` | `kirim` koreksi; baca koreksi milik sendiri | baca atau tinjau koreksi orang lain ditolak; ubah data tujuan ditolak (koreksi tidak mengubah data) |
| `T kirim prov` (WL) | kirim koreksi untuk entitas `prov` miliknya | entitas provinsi lain ditolak |

Uji turunan yang wajib ada selain 112 sel dasar (semuanya dibangkitkan dari skema atau fixture, bukan daftar tulis tangan):

1. **Daftar putih tulis.** Untuk tiap (tabel, aksi, peran yang boleh), setiap kolom hasil `PRAGMA table_info` yang tidak ada di `KOLOM_TULIS` ditolak (`salah-masukan`); kolom `id`, `kunci`, `slug`, `dibuat`, `dibuat_oleh`, `dummy` tidak pernah bisa ditulis siapa pun, termasuk SA (DT §5.5).
2. **Kolom rahasia.** `baca` pada `akun` tidak pernah mengembalikan `garam`, `sandi`, `iterasi`, `aktivasi_hash`, `aktivasi_sampai` untuk peran mana pun; `sesi.id_hash` dan `koreksi.pengaju_kontak` (kecuali KR, AD, SA) juga tidak.
3. **Data terlarang.** Tidak ada kolom bernama `agama`, `nik`, `tanggal_lahir`, `usia`, `alamat_rumah`, `status_kawin`, `biometrik`, `foto_wajah` di tabel mana pun (invarian atas `PRAGMA table_info` semua tabel); `tulis` dengan nama kolom itu ditolak bahkan untuk SA (baris "Data terlarang" KPV §1).
4. **Fakta tanpa sumber ditolak untuk semua peran, termasuk SA** (KPV §1 butir 1): `tulis` fakta tanpa `sumber`, dengan `sumber_id` yang tidak ada, atau tanpa `tingkat_bukti` menghasilkan `sumber-wajib` atau `salah-masukan`.
5. **Tabel ke jenis data.** Tiap tabel D1 muncul di pemetaan `jenisData(tabel, baris)`; tabel baru tanpa pemetaan merah. Fakta berkunci `kontak_*` dipetakan ke `kontak`, bukan ke `fakta`.
6. **Injeksi.** Korpus nama tabel, kolom, dan urut berbahaya (`"id; DROP TABLE akun"`, `"1=1"`, `"akun--"`, unicode, string kosong, 10.000 karakter) ke `baca` dan `tulis` ditolak; tabel `akun`, `sesi`, `jejak` tetap utuh sesudahnya.
7. **Peran tak dikenal diperlakukan PB** (KPV §1 butir 11): akun nonaktif, sesi kedaluwarsa, dan peran `"hacker"` memberi hasil sama dengan PB pada semua sel.
8. **Dummy.** `baca` oleh peran selain SA tidak pernah mengembalikan baris `dummy = 1` pada tabel mana pun yang punya kolom itu (dibangkitkan dari skema).
9. **Klausa setara.** `tests/fixtures/hak-klausa.json`: tiap klausa memberi jawaban sama pada bentuk `baris` dan bentuk `sql` (DT §5.6 butir 3).

### 2.3 Uji layar: 1440 dan 390 px (JM-H02)

Playwright menjalankan Worker lewat `wrangler dev --local` di atas baseline D1 berisi fixture dan akun uji per peran (dibuat helper, sandi acak, `storageState` per peran). Peta halaman dari `tests/fixtures/halaman.json` (rute, hak, peran uji, bagian wajib).

**2.3.1 Matriks.** Tiap halaman diuji di: viewport {1440 x 900, 390 x 844} x tema {terang, gelap} x bahasa {ID, EN}. Halaman: `/`, `/perusahaan`, `/p/<slug contoh>`, `/peta`, `/metode`, `/masuk`, `/aktivasi?...`, `/ganti-sandi`, `/direktori` (8 tab: Pakar, Lembaga, Wilayah, Inovasi, Riset, Sistem data, Pendanaan, Pustaka; PRD §3), `/admin` (tab Akun, Kurasi, Koreksi, Jejak). Halaman F2 masuk matriks yang sama saat tiketnya dikerjakan. Tangkapan layar disimpan sebagai artefak untuk peninjau manusia, TIDAK dibandingkan piksel (rapuh).

**2.3.2 Asersi tiap sel matriks.**

| Kode | Asersi |
| --- | --- |
| L1 | tanpa `console.error`, tanpa `pageerror`, tanpa `requestfailed`, tanpa kejadian `securitypolicyviolation` (menangkap skrip dan gaya inline); respons 4xx atau 5xx yang tidak diharapkan gagal |
| L2 | tanpa gulir horizontal halaman di 390 (`scrollWidth <= clientWidth`); tabel lebar bergulir di dalam kartunya |
| L3 | target sentuh interaktif minimal 44 x 44 px di 390 (area klik, bukan kotak tampak; DS §6) |
| L4 | `<html lang>` sesuai bahasa; teks terlihat tidak memuat kunci mentah (pola `^[a-z]+\.[a-z_.]+$`), `undefined`, `NaN`, `null`, titik tengah, atau em dash |
| L5 | kepala situs navy bersama sama di semua halaman (warna latar terhitung = token `--navy`); tidak ada warna hex di luar token pada elemen terhitung |
| L6 | mode gelap: latar `body` bukan `rgb(0,0,0)` dan bukan sama dengan mode terang; teks berkontras AA (juga axe) |
| L7 | halaman publik memuat bagian Jawaban singkat, kartu angka, Cara menghitung, Cara mengutip, dan tanggal beku (PRD U4), dikenali lewat teks kunci kamus; angka turunan (`est = 1`) berlabel `EST`; nilai kosong menampilkan salah satu dari empat alasan kosong, tidak pernah angka tanpa sumber |
| L8 | tautan luar ber-`rel="noopener noreferrer"`; semua gambar termuat (`naturalWidth > 0`); logo hanya dari `/api/gambar/logo/` |
| L9 | halaman publik tidak memuat string surel atau telepon (pindai DOM dan respons JSON yang dimuat halaman) |
| L10 | MapLibre dan pustaka graf tidak diminta sebelum tab atau halaman yang memerlukannya dibuka (log jaringan; DT §8.2); beranda memuat tidak lebih dari 8 berkas `/api/potret/` |
| L11 | `?lang=en` menang atas `localStorage`; saat `localStorage` dibuat melempar galat (skrip awal), halaman tetap tampil dalam bahasa bawaan Indonesia |

**2.3.3 INP (PRD U8, INP.md).** Tujuh interaksi: klik tab direktori, klik chip sektor, paginasi, sort kolom, buka laci profil, ketik di kotak cari, ganti ID/EN. Diukur dengan `PerformanceObserver({type:'event', durationThreshold:16})`, 5 ulangan, CPU dibatasi lewat CDP `Emulation.setCPUThrottlingRate` (4x untuk halaman login, 6x untuk halaman tanpa login di 390 px karena penggunanya memakai ponsel kelas menengah-bawah, INP.md). Lolos bila nilai tertinggi kedua dari lima ulangan di bawah 200 ms. Tiap interaksi juga menuntut chrome kontrol (`aria-selected`, `aria-pressed`, `aria-expanded`, kelas aktif) berubah dalam bingkai pertama, sebelum isi berat dicat: asersi memeriksa atribut sudah berubah pada `requestAnimationFrame` pertama sesudah klik, sementara isi baru boleh menyusul.

Kontrak bagi `gerbang-inp-transisi`: kontrol berchrome dibuat lewat satu rumah kontrol bersama yang menyerahkan kerja berat sesudah satu bingkai tercat (dua `requestAnimationFrame` dengan `setTimeout` sebagai jaring untuk tab tersembunyi, INP.md kelas kelima). Daftar pengecualian `tests/inp-daftar.json` per handler. Saat jumlah halaman melewati sepuluh (kira-kira F2), jalankan skill `inp-sweep` dan agent `inp-reviewer` atas seluruh permukaan, halaman tanpa login sebagai wilayah sendiri.

**2.3.4 Aksesibilitas dan kontras.**

1. `@axe-core/playwright` dengan tag `wcag2a`, `wcag2aa`, `wcag21aa`: gagal bila ada pelanggaran `serious` atau `critical` di sel mana pun; `moderate` dan `minor` dilaporkan sebagai artefak, tidak memblokir.
2. **Kontras:** `gerbang-kontras` (statis, dari `tema.css` ke `tests/kontras.json`) ditambah axe `color-contrast` pada halaman terender di kedua tema. Teks teal selalu `--accent` (`#07705A`); teal asli 4,38:1 gagal (KP D11, DS §2).
3. **Papan ketik:** dari awal halaman, `Tab` menjangkau tab, chip, paginasi, tombol bahasa, dan tombol dummy (untuk SA) dalam urutan visual; `Enter` dan `Space` mengoperasikan tombol; `:focus-visible` terlihat (kontras cincin 3:1); laci dan lembar bawah menutup dengan `Escape` dan mengembalikan fokus ke pemicunya; tidak ada perangkap fokus.
4. **Gerak:** dengan `prefers-reduced-motion: reduce`, `document.getAnimations()` untuk komponen non-esensial kosong dan simulasi tidak berjalan (DS §6).
5. **Padanan teks:** kuadran, grafik, dan peta punya padanan tabel atau daftar teks; titik kuadran dapat dibuka dengan `Enter` (DS §6.11).
6. **Semantik:** satu `h1` per halaman; kontrol bernama (`aria-label` atau teks); tabel punya `th scope`.

**2.3.5 Kasus per layar (tambahan di atas matriks).**

| Kode | Layar | Kasus |
| --- | --- | --- |
| LA1 | `/` | pita "Draf kerja, sumber publik saja, angka turunan berlabel estimasi" terlihat; kalimat Jawaban singkat memuat tanggal dan angka dari `sensus.json` (bukan konstanta) |
| LA2 | `/perusahaan` | chip sektor berhitungan; klik chip menyaring tabel; cari "sur" menemukan entitas berawalan itu; "di luar sensus" tidak dihitung |
| LA3 | `/p/<slug>` | urutan bagian sesuai TIKET JM-E03; tiap baris fakta menampilkan sumber dan tanggal periksa; skor keyakinan disertai kalimat alasan; PB tidak melihat kontak, PG melihat |
| LA4 | `/peta` | panel tarik, lapisan, "Terbang ke" provinsi; di 390 panel menjadi lembar bawah; tile dan gaya peta di-stub fixture; MapLibre dari cdnjs dimuat dengan SRI yang cocok (uji nyata atas hash) |
| LA5 | `/metode` | konstanta (tingkat bukti, bobot skor) sama dengan nilai di `algo.js` (dibaca, bukan disalin) |
| LA6 | `/masuk` | sandi salah dan surel tak dikenal menampilkan pesan sama; tombol "tampilkan sandi" ada; `?ke=//evil.com` diabaikan; tanpa autofill ke URL |
| LA7 | `/direktori` | tanpa cookie: 302 ke `/masuk?ke=/direktori`; `/direktori.html` langsung 404; `/akademisi` 404; PB tidak pernah menerima HTML direktori; delapan tab hadir |
| LA8 | `/admin` | KR, AD, SA 200; PG, AN, WL 403 halaman; tab Akun hanya AD dan SA (di DOM tidak ada untuk KR, bukan sekadar tersembunyi); kurasi menolak simpan tanpa sumber dengan pesan dari kamus |
| LA9 | tombol dummy | dua ikon, satu tempat yang sama di tiap halaman, ada di DOM hanya untuk SA (jumlah elemen 0 untuk peran lain); lihat §2.7 |

### 2.4 Rute, sandi, sesi, laju, CSRF

**2.4.1 Matriks rute x peran** (`tests/rute-peran.test.mjs`). Dibangkitkan dari objek tabel rute yang sama dengan router (tiap rute sudah wajib menyatakan himpunan peran). Untuk tiap rute dan tiap dari 7 peran: peran di luar himpunan harus 401 (PB) atau 403 (lainnya) SEBELUM validasi masukan atau sentuhan D1/R2; peran dalam himpunan tidak boleh 401 atau 403 (hasil lain, misalnya 422 pada badan kosong, sah). Rute dengan kualifikasi (WL pada `/api/kontak/:slug` hanya `prov` miliknya; koreksi `keluar` oleh PB bila ada `kontak`; riwayat penulis sendiri) punya kasus tambahan. Jumlah uji = rute x 7, dihitung dari tabel.

**2.4.2 Sandi** (`tests/sandi.test.mjs`, dijalankan di workerd lewat `tests/helper/pekerja-uji.mjs`, BUKAN di Node, karena batas iterasi PBKDF2 hidup di runtime Workers; ADR-04):

| Kode | Kasus | Hasil |
| --- | --- | --- |
| S1 | `hashSandi` dengan 210.000 iterasi di workerd | berhasil; bila runtime menolak, uji gagal dengan pesan: "turunkan ke batas runtime, catat di KPV §4 dan ADR-04" |
| S2 | vektor uji PBKDF2-HMAC-SHA256 publik (RFC 7914 §11) lewat fungsi turunan yang sama | sama dengan nilai RFC (membuktikan algoritma benar, bukan hanya konsisten) |
| S3 | `cocokSandi` benar, salah, panjang beda, kosong, hash rusak | benar hanya untuk pasangan yang cocok; tidak pernah melempar ke pemanggil |
| S4 | garam | 16 byte (32 heksa), dua akun sandi sama, dua garam beda, dua hash beda |
| S5 | kolom `iterasi` per akun | akun dengan iterasi lama masuk berhasil lalu di-rehash ke konstanta baru saat login berikutnya |
| S6 | perbandingan waktu tetap | pemindai statis menolak `===` atau `==` pada hash di `sandi.js` dan perbandingan membaca semua byte (uji perilaku pada posisi selisih berbeda); tidak ada uji ukur waktu (rapuh) |
| S7 | kebijakan | panjang 11 ditolak, 12 diterima, 128 diterima, 129 ditolak; sandi sama dengan surel ditolak |

**2.4.3 Sesi** (`tests/sesi.test.mjs`):

| Kode | Kasus | Hasil |
| --- | --- | --- |
| T1 | login sukses | cookie `sesi` ber-atribut tepat `HttpOnly; Secure; SameSite=Lax; Path=/` dan umur 14 hari; token 32 byte acak; baris `sesi.id_hash` = SHA-256(token); tidak ada kolom di D1 yang bernilai token mentah |
| T2 | keluar | baris sesi terhapus, cookie dihapus, pemakaian cookie lama menjadi PB |
| T3 | kedaluwarsa | jam maju 14 hari + 1 detik: PB; 14 hari - 1 detik: sah |
| T4 | akun dinonaktifkan | semua sesinya mati seketika; permintaan berikutnya PB |
| T5 | ganti sandi | semua sesi LAIN akun itu dicabut, sesi yang dipakai tetap |
| T6 | respons seragam | surel tak dikenal dan sandi salah memberi status dan badan identik; PBKDF2 tetap dihitung pada surel tak dikenal (jumlah panggilan `deriveBits` dihitung lewat pembungkus tipis yang tetap menjalankan fungsi aslinya) |
| T7 | aktivasi | tautan sekali pakai; pemakaian kedua gagal; jam maju 72 jam + 1 detik gagal; yang tersimpan hanya hash; token tidak muncul di log (tangkap `console` selama uji); sandi dipasang lewat PBKDF2 dan `status = 'aktif'` |
| T8 | `GET /api/saya` | PB: `{masuk:false}`; login: peran, nama, bahasa, `cakupan_prov`, tanpa surel orang lain; `no-store` |
| T9 | `wajib_ganti` | dikembalikan sesuai akun; tidak ada halaman selain `/ganti-sandi` dan keluar yang dapat dipakai sampai diganti (bila dinyatakan di ALUR; bila tidak, kasus dilewati dengan catatan) |

**2.4.4 Batas laju** (`tests/sesi.test.mjs`, kunci `masuk-ip` dan `masuk-surel`; DT §3.6):

| Kode | Kasus | Hasil |
| --- | --- | --- |
| R1 | 10 percobaan gagal dalam 15 menit dari satu IP | ke-10 masih dijawab seperti biasa; ke-11 `429 terlalu-sering` |
| R2 | 10 percobaan gagal ke satu surel dari 10 IP berbeda | ke-11 `429` (batas per surel berdiri sendiri) |
| R3 | jendela berganti (jam maju 15 menit) | penghitung mulai dari awal |
| R4 | kunci di tabel `laju` | tidak ada baris yang kuncinya sama dengan IP mentah atau surel mentah (invarian atas isi tabel); `ipHash` berubah antar hari |
| R5 | `lajuHit` serempak (20 pemanggilan paralel) | `jumlah` akhir tepat 20: satu tulis UPSERT, bukan baca-lalu-tulis |
| R6 | login sukses sesudah 9 gagal | tetap sukses; penghitung tidak mengunci akun yang sah secara permanen |
| R7 | aksi lain (`aktivasi` 10 per jam, `koreksi` 5 per jam, `cari` 60 per menit, `riset-ai` 60 per jam, `kurasi`, `impor` 10 per jam) | batas tepat sesuai DT §4.3: ke-N lolos, ke-N+1 `429` |
| R8 | jejak `masuk-gagal` | ditulis paling banyak sekali per menit per IP (`masuk-log`), bukan tiap percobaan |

**2.4.5 CSRF dan permintaan** (`tests/sesi.test.mjs`, `tests/rute-peran.test.mjs`):

1. Tiap `POST`, `PATCH`, `DELETE` dengan cookie sah tetapi `Origin` berbeda, atau `Sec-Fetch-Site: cross-site`, ditolak 403 tanpa efek (jumlah baris dan jejak tidak berubah). Dibangkitkan atas semua rute tulis.
2. `Content-Type` selain `application/json` ditolak (`salah-masukan`); badan 65.537 byte `terlalu-besar`; kolom tak dikenal ditolak; `id` bukan `^\d{1,12}$` ditolak.
3. **Tanpa tulis lewat GET.** Untuk tiap rute `GET`, jumlah baris semua tabel dan jejak sebelum dan sesudah sama (invarian atas semua tabel).
4. **Pengalihan terbuka.** `ke` bernilai `//evil.com`, `https://evil.com`, `/\evil.com`, `javascript:alert(1)`, `%2F%2Fevil.com`, tab dan baris baru di dalamnya: semua diabaikan; hanya jalur relatif situs sendiri diterima.
5. **Respons galat** hanya berbentuk `{galat, kode}` dari katalog kode tetap; tanpa jejak tumpukan, nama berkas, atau pesan SQL (paksa galat internal lewat fixture dan periksa badan).
6. **Cache.** Respons berautentikasi `Cache-Control: private, no-store` dengan `Vary: Cookie`; respons peran AN atas `/api/p/<slug>` tidak pernah keluar untuk permintaan PB sesudahnya (uji dengan Cache API Miniflare); lapis publik `public, max-age=300`; kunci `cacheTepi` tidak memuat cookie.

**2.4.6 Admin akun** (`tests/akun.test.mjs`): AD tidak dapat menetapkan `super` (buat atau ubah), tidak dapat mengubah akun `super`, tidak dapat mengubah perannya sendiri; SA terakhir tidak dapat dinonaktifkan, diturunkan, atau dihapus (lewat rute DAN lewat trigger, §3.2); `wilayah` wajib `cakupan_prov`; `cakupan_prov` hanya diubah AD dan SA; tautan aktivasi tampil sekali dan tidak ada di `GET` berikutnya; `buat_super.mjs` mencetak SQL yang menghasilkan akun `super` valid dan sandi tidak disimpan di berkas mana pun.

**2.4.7 Rute lain** (`tests/rute/*.test.mjs`):

1. **Potret.** Nama di luar `^[a-z0-9_-]{1,80}$`, `..`, `/`, dan lapis tak dikenal ditolak tanpa menyentuh bucket (hitung panggilan `BERKAS` = 0); lapis anggota untuk PB 401; lapis pengurus untuk AN dan WL 403. **Berkas besar dialirkan:** R2 diisi berkas 100 KB berisi JSON TIDAK VALID; rute publik harus mengembalikannya byte-identik dengan 200 (bukti bahwa Worker tidak `JSON.parse`, DT §6 butir 4).
2. **Profil `/api/p/:slug`.** PB: hanya lapis publik; AN: ditambah delta anggota; PG: ditambah delta pengurus; tiap lapis hanya memuat kolomnya; slug tak ada 404.
3. **Kontak.** WL membaca kontak hanya entitas `prov = cakupan_prov`; PB dan AN 403.
4. **Cari.** `q` 101 karakter ditolak; operator FTS dan tanda kutip di `q` dibuang (`"`, `*`, `NEAR`, `OR`, `-`); hasil hanya `status = 'aktif'`, `dummy = 0`, `tampil` benar untuk orang, lapis sampai peran; paginasi maksimal 50.
5. **Direktori (port).** `id` penulis `^A\d{4,12}$`, karya `^W\d{4,12}$`; sesi dicek SEBELUM cache; OpenAlex diganti fixture rekaman. **Workers AI:** binding `AI` perekam; muatan keluar hanya judul dan abstrak (tanpa pola surel atau telepon, tanpa kontak), respons berlabel "Ringkasan mesin", kegagalan AI tidak disimpan di cache; `ringkasan` menerima `sektor` hanya dari `SEKTOR`.
6. **Gambar.** `GET /api/gambar/logo/:id` menolak ekstensi `svg`, id bukan 16 sampai 64 heksa, dan jalur di luar prefiks; respons `X-Content-Type-Options: nosniff`, `Content-Type` tetap. Celah: DT belum mendefinisikan rute unggah logo; cek magic bytes PNG, JPEG, WebP, batas 512 KB, dan nama hash (KPV §5.4) wajib diuji pada komponen mana pun yang kelak menulis ke `gambar/` (§8 butir 9).
7. **Kurasi.** Tulis tanpa `sumber` `422 sumber-wajib`; `kunci` dan `slug` kiriman klien diabaikan atau ditolak (server yang menghitung); `gabung` memindahkan fakta, ikatan, alias, riwayat dalam satu `batch` (gagal di tengah = tidak ada yang pindah) dan menolak target yang bukan `aktif`; `impor` 201 baris ditolak, baris tanpa sumber dihitung di `ditolak`, satu entri jejak `impor` per panggilan; `hapus-permanen` ditolak tanpa `koreksi_id` berjenis `keluar` atau `hapus-data` berstatus `diterima`, dan bila sukses: baris D1 (beserta anak), berkas R2 terkait, dan `p_<slug>` tiga lapis hilang, hash masuk daftar tolak, jejak tanpa nilai pribadi.
8. **Koreksi dan riwayat.** `ubah` dan `tambah` tanpa `sumber_url` ditolak; `keluar` oleh PB hanya dengan `kontak`; usulan terbuka kembar ditolak; `ditolak` tanpa `alasan` ditolak; WL dan KR tak membaca riwayat; `oleh` tidak pernah keluar mentah, hanya boolean `milik`.
9. **Status.** `GET /api/status` memberi `{versi, potret, db:"ok"}` dengan satu `SELECT 1`.
10. **Jejak.** Tiap tulis D1 menambah tepat satu baris `jejak` dalam transaksi yang sama (penghitung sebelum dan sesudah atas seluruh rute tulis); jejak tidak memuat `garam`, `sandi`, `aktivasi_hash`, `aktivasi_sampai`, `iterasi`; untuk entitas `orang`, `dari` dan `ke` hanya memuat nama kolom (DT §3.2).

### 2.5 Uji ujung ke ujung alur lintas tabel (JM-H01)

`tests/e2e/alur.test.mjs`, satu skenario berurutan terhadap Worker utuh, D1 dan R2 lokal, dan pipeline Node sungguhan. Tiap langkah menyertakan lawan "peran salah DITOLAK".

| Langkah | Aksi | Dibuktikan |
| --- | --- | --- |
| 1 | `buat_super.mjs` menghasilkan SA pertama; SA masuk | tanpa langkah ini tidak ada pintu pertama (DT §10 butir 4) |
| 2 | SA membuat AD; AD membuat akun AN, PG, KR, WL(91) lewat tautan aktivasi; tiap akun aktivasi dan masuk | AD tidak bisa membuat `super` (DITOLAK); tautan kedua kali gagal |
| 3 | KR menambah lembaga bersumber, satu proyek, satu orang (`tampil = 0`) dengan fakta dan ikatan | tanpa sumber DITOLAK `sumber-wajib`; ikatan pasangan tak sah DITOLAK trigger; AN menambah entitas DITOLAK |
| 4 | KR menambah fakta `kontak_surel` untuk orang tersebut | tersimpan hanya `lapis = 'pengurus'`; di lapis publik DITOLAK CHECK |
| 5 | Pipeline: `kurasi_baca` (D1 lokal), `sambung`, `hubung`, `potret`, `jaga_unggah`, unggah R2 lokal | `meta.json` melaporkan baris tanpa sumber = 0; manifest ditulis terakhir |
| 6 | PB mengambil `/api/potret/publik/*` dan `/api/p/<slug>` | tidak ada surel, telepon, kontak; orang `tampil = 0` tidak ada; baris `dummy` tidak ada |
| 7 | AN mengambil lapis anggota; PG mengambil lapis pengurus dan `/api/kontak` | AN ke lapis pengurus DITOLAK 403; PB ke lapis anggota 401; WL(91) membaca kontak entitas provinsi 91, entitas provinsi 92 DITOLAK |
| 8 | AN mengirim koreksi dengan sumber; KR menerima dan menerapkan lewat rute kurasi | AN meninjau DITOLAK; data tujuan tidak berubah sebelum KR menerapkan; jejak `kirim`, `tinjau`, `ubah` ada |
| 9 | Permintaan keluar atas satu orang: KR `hapus-permanen` | baris D1, berkas R2, `p_<slug>` tiga lapis hilang; potret dibangun ulang tanpa orang itu; hash di daftar tolak; impor ulang entitas itu DITOLAK; nama dan slug tidak ditemukan di berkas potret mana pun |
| 10 | SA mengisi dummy lalu menghapus | AD/AN/PB tidak melihat baris dummy; potret baru tanpa dummy; sesudah hapus, jumlah baris semua tabel sama dengan sebelum isi |
| 11 | AD menonaktifkan akun KR | sesi KR mati; KR menulis DITOLAK; SA terakhir tidak bisa dinonaktifkan |
| 12 | Pemeriksaan penutup (invarian) | jumlah baris `jejak` = jumlah operasi tulis yang dilakukan skenario; tidak ada baris `fakta` atau `ikatan` dengan `sumber_id` kosong; `PRAGMA foreign_key_check` kosong; `PRAGMA integrity_check` = `ok` |

Skenario SQL pendamping `tests/e2e/*.sql` (mis. `05-dummy-jejak.sql`, diport dari asal) dijalankan `scripts/mesin/e2e-d1.mjs` terhadap salinan baseline segar. Format: blok pernyataan dipisah baris kosong; `-- @asersi <pesan>` diikuti satu `SELECT` yang mengembalikan `(ok, nilai)` (gagal bila `ok <> 1`, pesan dan `nilai` dicetak); `-- @ditolak <potongan pesan galat>` diikuti satu pernyataan yang HARUS gagal dengan galat memuat potongan itu. Runner berhenti di kegagalan pertama.

### 2.6 Performa

Anggaran berasal dari DT §8.2 (angka target, bukan hasil ukur).

1. **Baris D1 dan operasi R2 per rute** (`tests/performa.test.mjs`): harness membungkus `env.DB` dan `env.BERKAS` (di dalam uji, bukan di `src/`) dan mencatat `meta.rows_read` serta jumlah operasi. Batas: `GET /api/potret/publik/:nama` 0 baris D1 dan 1 operasi R2; `GET /api/p/:slug` 0 baris dan 1 sampai 3 operasi; `GET /api/saya` paling banyak 2 baris (indeks `sesi.id_hash` + join `akun`); `GET /api/cari` paling banyak 20 baris hasil; `GET /api/kurasi/*` paling banyak 50; `POST /api/kurasi/impor` paling banyak 200 tulis. Bila versi Miniflare terpasang tidak mengembalikan `rows_read`, EXPLAIN (§3.5) adalah satu-satunya bukti dan keterbatasannya dicatat di berkas uji.
2. **Tanpa pekerjaan berat di Worker.** `graf`, `skor`, `kuadran` tidak dihitung di Worker: gerbang statis menolak impor `hubung`, `potret`, atau `hitungKeyakinan` dari `src/**`. Rute potret mengalirkan tubuh (§2.4.7 butir 1).
3. **Ukuran potret.** Tiap berkas potret tidak lebih dari 2 MB (batas keras `jaga_unggah`). Batas lunak bawaan RU, boleh diubah lewat PR: total berkas awal beranda tidak lebih dari 600 KB terkompresi gzip dan tidak lebih dari 8 berkas (DT §6 butir 6). Berkas lebih besar dipecah per provinsi atau sektor.
4. **CPU Worker (10 ms di paket Free).** Miniflare tidak menegakkan batas ini, jadi pengukuran dilakukan pemilik di lingkungan nyata dengan `wrangler tail` (kolom `cpuTime`) memakai `scripts/mesin/ukur-cpu.mjs` yang menembakkan tiap rute 30 kali; hasilnya ditulis di `PENYELARASAN.md` bagian "Ukur CPU <tanggal>" dan dibandingkan dengan target DT §8.2 (potret kurang dari 1 ms, profil kurang dari 3 ms, cari dan kurasi kurang dari 3 ms, impor kurang dari 8 ms). Login (PBKDF2) dicatat terpisah karena dapat melewati 10 ms; bila terlampaui, keputusan Workers Paid diambil sebelum rilis (ADR-04). Pengukuran ini bukan gerbang CI.
5. **Beban R2.** Pembacaan R2 per tampilan beranda dan peta dihitung dari log jaringan layar (L10) dan dibandingkan anggaran 10 juta Class B per bulan (DT §6 butir 6); dipantau pada JM-H04.

### 2.7 Data dummy (KP D18, DUMMY.md)

> **Dibatalkan KP K15 (7 Nov 2026):** tidak ada tombol dummy, rute `/api/admin/dummy`, kolom `dummy`, maupun gerbang-dummy. Yang tersisa: data contoh fiktif (`example.org`, akhiran "(contoh)") sebagai fixture uji dan `scripts/seed-lokal` untuk D1 lokal/pratinjau, tidak pernah ke produksi. Isi di bawah ini tidak berlaku lagi.

`gerbang-dummy`, `gerbang-dummy-layar`, `tests/e2e/05-dummy-jejak.sql`, dan langkah 10 e2e (§2.5) menjaga enam syarat dan tiga kelas kegagalan DUMMY.md dalam bentuk METI:

| Syarat atau kelas | Wujud uji |
| --- | --- |
| Hanya SA | tombol ada di DOM hanya untuk SA (LA9); `POST` dan `DELETE /api/admin/dummy/:halaman` selain SA = 403 (dan 401 untuk PB); sel `dummy` di `hak.test.mjs` |
| Isi ditentukan HALAMAN | tiap halaman di `NAMA_DUMMY` memanggil pengisi miliknya; uji layar: klik ikon isi di `/perusahaan` menambah baris sektor, di `/admin` tab Kurasi menambah entitas; tidak ada dropdown pilihan modul |
| Syarat 1: periode terpampang | halaman yang memegang periode atau filter mendaftarkannya ke satu rumah yang dibaca pengisi; uji memilih filter selain bawaan lalu mengisi dan menuntut baris tampil di filter itu |
| Syarat 2: gerbang "sudah ada" menghitung baris yang masih hidup | isi, hapus satu baris dummy lewat jalur lain, isi lagi: tombol bekerja dan tidak melapor "sudah ada" untuk data yang sudah tidak ada |
| Syarat 3: angka dari rantai sungguhan | agregat halaman (jumlah di kartu) sama dengan penjumlahan baris dummy yang tampil; entitas dummy punya fakta dan ikatan bersumber `example.org`, bukan konstanta |
| Syarat 4: tiap ember status terisi | koreksi berstatus `baru`, `diterima`, `ditolak`, `diterapkan` masing-masing minimal satu; tiap sektor dan tiap tingkat bukti yang punya chip atau ember terwakili; tiap label keyakinan (Tinggi, Sedang, Rendah) terwakili |
| Syarat 5: semua fitur berangka | pada `tests/fixtures/dummy-halaman.json` (kolom wajib berangka per halaman), panggil endpoint atau potret yang menyuapi layar sesudah isi dan tuntut tiap kolom terdaftar bukan nol dan bukan kosong |
| Syarat 6: muat ulang penuh | uji layar: sesudah klik isi atau hapus, data halaman diambil ulang dari server (permintaan jaringan baru terjadi) dan DOM berubah |
| Kelas A: tabel dibaca banyak halaman, ditulis satu modul | `gerbang-dummy` menyusun peta halaman ke tabel yang dibacanya dan tabel yang ditulis pengisi; tabel ber-`dummy` yang tak ditulis siapa pun merah kecuali di daftar dikecualikan dengan alasan |
| Kelas B: dua sisi disamakan | untuk pasangan yang dibandingkan layar (mis. koreksi diajukan vs diterapkan, sumber pertama vs kedua), pengisi menghasilkan selisih tidak nol minimal pada satu baris dan nol pada minimal satu baris |
| Kelas C: langkah yang melapor nol baris dicabut dari buku | DT §8.3 tidak mendefinisikan buku langkah. Bila DT kelak menambahnya, uji kelas C (langkah nol baris dicabut; hapus mengosongkan buku) wajib ditambahkan di sini sebelum tiketnya selesai |
| Bisa dibatalkan | isi lalu hapus mengembalikan jumlah baris semua tabel ke nilai awal; jejak dummy ikut terhapus (satu-satunya pengecualian trigger `jejak_tanpa_hapus`, §3.2); tabel tanpa kolom `id` (`label`) disebut sendiri oleh penghapus dan dipatok ke induk dummy-nya sehingga baris sungguhan tidak ikut hilang |
| Potret bersih | pipeline membaca `dummy = 0`; `potret.test.mjs` menuntut tidak ada baris dummy di berkas mana pun |
| Tidak menulis di server (pola asal) | KPV §1 butir 10 menyebut tombol hanya mengisi klien, DT §8.3 menyebut `POST` dan `DELETE` ke server. DT lebih tinggi dalam rantai sehingga RU menguji jalur server; bila pemilik memilih pola klien saja, uji server diganti dengan uji "tidak ada permintaan tulis dari tombol" (§8 butir 5) |

### 2.8 Teks, bahasa, dan larangan

1. **Paritas kamus:** himpunan kunci `id.json` sama dengan `en.json` (PRD U6), tiap `t("...")` ada, kunci yang hilang di EN tidak jatuh ke ID secara diam-diam (jatuh dan tercatat sebagai galat uji, DT §8.4 butir 1). Kode galat API (`galat.<kode>`) ada di kedua kamus untuk 10 kode DT §4.1 butir 4.
2. **Data dwibahasa:** potret fixture dengan `_en` kosong menampilkan versi Indonesia berpil "ID"; terjemahan mesin berstatus "perlu tinjau" (KP D10, C-14).
3. **Larangan teks** (`gerbang-teks`): tanpa titik tengah, tanpa em dash, tanpa sisa asal (JM-C03), tanpa angka tanpa format satu formatter (KP D17).
4. **Nama.** Teks antarmuka tidak menyebut "RLS" sebagai fitur D1 bawaan: janji RLS dipenuhi `hak.js` dan tidak dinyatakan lebih (PRD F-M3); pindai kamus untuk "row level security" dan "RLS" yang tidak diikuti penjelasan.
5. **Hutang i18n terdaftar.** `public/direktori.js` (hasil port, 3.961 baris) berisi teks Indonesia tertanam; ia masuk `antre` registri `gerbang-i18n` (hanya boleh menyusut) sampai JM-C06 meluas ke berkas itu (§8 butir 10).

## 3. Uji D1

Semua uji bagian ini berjalan di D1 lokal nyata (§1.3) dan memakai fixture jahat yang HARUS ditolak. Berkas: `tests/skema.test.mjs`, `tests/migrasi.test.mjs`, `tests/eksplain.test.mjs`, `tests/cari.test.mjs`, `tests/akun.test.mjs`, `tests/sapu.test.mjs`.

### 3.1 Migrasi idempoten: jalan dua kali (`tests/migrasi.test.mjs`)

`wrangler d1 migrations apply` mencatat migrasi yang sudah jalan sehingga pemanggilan kedua tidak menjalankan apa pun; itu BUKAN uji idempoten. Yang diuji:

1. Terapkan 0001 sampai 0006 lewat `wrangler d1 migrations apply` (baseline), lalu jalankan ULANG isi tiap berkas langsung (`wrangler d1 execute --file`, melewati pencatatan), dua kali berturut-turut, dalam urutan. Tidak boleh ada galat.
2. Ambil `SELECT type, name, tbl_name, sql FROM sqlite_master ORDER BY name` sebelum dan sesudah putaran ulang: identik. Jumlah baris `pasangan_ikatan` sama (data tetap `INSERT OR IGNORE`, tanpa baris ganda). Jumlah trigger, indeks, dan tabel sama.
3. Putaran ulang pada basis data yang berisi fixture: tidak ada data hilang, berubah, atau berlipat (jumlah baris dan checksum per tabel sama).
4. Migrasi dari kosong dan migrasi berurutan satu per satu menghasilkan `sqlite_master` yang sama.
5. `PRAGMA foreign_key_check` dan `PRAGMA integrity_check` bersih sesudah semuanya.
6. **Beku.** Sesudah pemilik menerapkan migrasi ke produksi (JM-H04), hash berkasnya dimasukkan ke `tests/fixtures/migrasi-beku.json`; `gerbang-migrasi` merah bila hash berubah. Perubahan skema berikutnya = berkas bernomor baru.

### 3.2 CHECK, trigger, kunci asing: tiap aturan punya uji terima dan DITOLAK (`tests/skema.test.mjs`)

Satu blok uji per tabel. Tiap baris "ditolak" memeriksa pesan galat memuat jenis pelanggaran (CHECK, FOREIGN KEY, UNIQUE, atau teks `RAISE`).

| Tabel | Harus DITOLAK | Harus DITERIMA (pasangan) |
| --- | --- | --- |
| `akun` | peran `hacker`; surel tanpa `@`, dengan spasi, 4 atau 121 karakter; `wilayah` tanpa `cakupan_prov`; peran lain dengan `cakupan_prov`; `cakupan_prov` `9` atau `abc`; `status = 'aktif'` tanpa `garam`, `sandi`, atau `iterasi`; `garam` panjang bukan 32; `iterasi` 99.999; `aktivasi_hash` tanpa `aktivasi_sampai`; surel kembar beda huruf besar (NOCASE); UPDATE yang menurunkan atau menonaktifkan super aktif terakhir (trigger, pesan memuat "super terakhir"); DELETE super aktif terakhir | semua peran sah; super kedua lalu penurunan super pertama; super dengan `dummy = 1` tidak dihitung sebagai pelindung |
| `sesi` | `id_hash` panjang bukan 64; `sampai <= dibuat`; `akun_id` tak ada (FK); `ip_hash` panjang bukan 16 | hapus akun menghapus sesinya (CASCADE) |
| `jejak` | UPDATE apa pun; DELETE baris `dummy = 0`; `aksi` tak dikenal; `dari` atau `ke` bukan JSON atau lebih dari 4.000 karakter; `peran` tak dikenal | DELETE baris `dummy = 1`; INSERT sah |
| `sumber` | `url` berskema `javascript:`, `data:`, `blob:`, `ftp:`; `url` memuat spasi; `url` 9 atau 601 karakter; `jenis` tak dikenal; `domain` berhuruf besar; tanggal `2026-02-30` dan `2026-13-01` pada `diperiksa`; `url` kembar | `https:` dan `http:` sah; `tanggal_dokumen` kosong |
| `entitas` | `kunci` tanpa pola `[a-z]*:*`; `slug` berhuruf besar, diawali atau diakhiri "-", 1 karakter; `jenis` dan `kategori` tak dikenal; `kategori` pada `jenis <> 'lembaga'`; `lat` tanpa `lon`; `lat` di luar -11,5 sampai 6,5 atau `lon` di luar 94 sampai 141,5; `status = 'digabung'` tanpa `digabung_ke` dan sebaliknya; `digabung_ke = id`; `tampil = 1` dengan `status <> 'aktif'`; `di_sensus = 1` untuk `nuklir`, `ccs`, atau jenis bukan lembaga; `situs` berskema `http:`; `sumber_id` NULL atau tak ada; UPDATE `kunci` atau `slug`; penggabungan ke entitas bukan `aktif` (berantai) | sektor `surya` di sensus; `prov = 'nasional'`; `prov = '91'` |
| `label` | `jenis = 'sektor'` dengan nilai rantai dan sebaliknya; nilai tak dikenal; kembar (PK) | sektor ganda untuk satu entitas |
| `alias` | `norm` kosong; `asal` tak dikenal; pasangan (`norm`, `entitas_id`) kembar | norm sama untuk entitas berbeda (ditangkap dedup, bukan CHECK; uji memastikan keduanya tersimpan dan `alias_norm` dipakai) |
| `fakta` | `sumber_id` NULL; `sumber_id` tak ada; `tingkat_bukti` tak dikenal atau NULL; `est = 1` tanpa `rumus`; `est = 1` dengan `tingkat_bukti = 'terkonfirmasi'`; `nilai_num` tanpa `satuan`; ketiga nilai kosong tanpa `alasan_kosong`; `alasan_kosong` bersama nilai; `alasan_kosong` tak dikenal; `kunci` `kontak_surel` atau `kontak_telepon` di lapis `publik` atau `anggota`; `nilai_teks` berpola surel atau sembilan angka berurutan di lapis publik; `per_tanggal` `2026-02-30`; `kunci` berhuruf besar; duplikat (`entitas_id`, `kunci`, `per_tanggal`, `sumber_id`) | `kontak_surel` di `pengurus`; angka besar di `nilai_num`; `alasan_kosong` empat jenis; `est = 1` dengan rumus dan `inferensi` |
| `ikatan` | `sumber_id` NULL atau tak ada; `dari = ke`; `selesai < mulai`; `jenis_pasok` pada jenis selain `memasok`; `persen` pada jenis selain `memiliki`, `mendanai`, `membeli-dari`; `nilai_num` tanpa `satuan`; pasangan jenis simpul tak sah saat INSERT dan saat UPDATE (trigger); jenis tak dikenal; duplikat | tiap baris `pasangan_ikatan` sah diterima, termasuk `memiliki lembaga->proyek` |
| `koreksi` | `ubah` atau `tambah` tanpa `sumber_url`; `ubah` tanpa `kunci`; `keluar` atau `hapus-data` tanpa `pengaju_akun` dan `pengaju_kontak`; `status <> 'baru'` tanpa peninjau; `ditolak` tanpa `alasan`; `sumber_url` berskema `http:`; usulan terbuka kembar (indeks parsial) | usulan kembar setelah yang pertama ditinjau |
| `riwayat` | `target_id` berjenis `proyek` atau `regulasi` (trigger); `tanggal_selesai < tanggal`; `penilaian` 0 atau 6; `kegiatan_ref` memuat spasi; `jenis` tak dikenal; `oleh` tak ada | target `orang` dan `lembaga` |
| `laju` | `aksi` tak dikenal; `jumlah` 0; `jendela` negatif; UPSERT serempak (R5) | UPSERT menaikkan `jumlah` |

### 3.3 Taksonomi sama dengan CHECK (`gerbang-taksonomi`)

Daftar nilai tiap CHECK diekstrak dari berkas migrasi dan dibandingkan sebagai himpunan dengan `public/taksonomi.js` untuk sektor, kategori, jenis entitas, jenis ikatan, jenis pasok, jenis sumber, tingkat bukti, rantai, alasan kosong, peran, aksi jejak, aksi laju, dan status. Selisih ke arah mana pun merah dengan daftar nilai yang kurang atau lebih. Uji tambahan: tiap nilai dalam taksonomi dapat disimpan (satu INSERT sah per nilai), dan nilai di luar daftar ditolak.

### 3.4 Aturan yang SQL tidak bisa menjaga (dipegang `hak.js`, DT §3.1)

Diuji di `tests/akun.test.mjs` lewat Worker utuh dan di `tests/hak.test.mjs`: AD tidak menaikkan siapa pun (termasuk dirinya) menjadi `super`; AD tidak mengubah akun `super`; AD tidak mengubah perannya sendiri; SA terakhir dilindungi di dua lapis (rute memberi `konflik` dengan pesan jelas; trigger tetap menolak bila lapis rute dilewati dengan SQL langsung); `status = 'nonaktif'` mencabut sesi seketika; kolom rahasia tidak pernah masuk jejak.

### 3.5 EXPLAIN QUERY PLAN kueri utama (`tests/eksplain.test.mjs`)

Daftar kueri tidak ditulis tangan: harness membungkus `env.DB.prepare` dan merekam setiap pernyataan SQL beserta nilai `bind` selama seluruh `tests/rute-peran.test.mjs`, `tests/rute/*.test.mjs`, dan `tests/e2e/alur.test.mjs`. Setiap pernyataan unik lalu dijalankan sebagai `EXPLAIN QUERY PLAN` dengan bind yang sama.

Aturan (merah bila dilanggar, pesan menyebut pernyataan dan rencananya):

1. Tidak ada `SCAN` penuh pada tabel data (`akun`, `sesi`, `jejak`, `sumber`, `entitas`, `label`, `alias`, `fakta`, `ikatan`, `koreksi`, `riwayat`, `laju`) kecuali tercatat di `tests/fixtures/scan-diizinkan.json` per pernyataan dengan alasan tertulis (contoh: pencarian akun dengan `LIKE` pada tabel yang dibatasi ribuan baris). Daftar itu hanya boleh menyusut atau bertambah lewat PR yang ditinjau `guard-api`.
2. `USE TEMP B-TREE FOR ORDER BY` hanya bila pernyataan memuat `LIMIT` paling banyak 50 dan terdaftar.
3. Pencarian entitas memakai `MATCH` pada `entitas_cari` dan `LIMIT 20` (rencana memuat `VIRTUAL TABLE INDEX`).
4. Tidak ada `COUNT(*)` tak terbatas pada tabel data (pemindai atas SQL terekam).
5. Indeks yang dirancang benar-benar dipilih: pencarian sesi memakai PK `id_hash`; pencarian akun menurut surel memakai indeks unik; `lajuHit` memakai PK `(kunci, aksi, jendela)`; daftar akun menurut `peran`/`status` memakai `akun_peran`; fakta per entitas memakai `fakta_entitas`; ikatan memakai `ikatan_dari` atau `ikatan_ke`; sapu memakai `sesi_sampai` dan `laju_jendela`; antrean koreksi memakai `koreksi_status`; jejak terbaru memakai `jejak_kapan`.

### 3.6 Pencarian FTS5 dan sapu

1. **FTS5 selaras** (`tests/cari.test.mjs`): sesudah INSERT, UPDATE nama, tambah alias, hapus alias, dan DELETE entitas, isi `entitas_cari` selalu sama dengan keadaan tabel induk (pencarian nama, nama Inggris, ringkas, dan alias menemukan entitas yang benar; entitas terhapus tidak ditemukan). Awalan 2 huruf menemukan; diakritik diabaikan; operator FTS di masukan tidak menimbulkan galat sintaks (dibuang oleh rute).
2. **Sapu** (`tests/sapu.test.mjs`): `hak.sistem.sapu` menghapus `sesi.sampai` yang lewat, `laju.jendela` lebih tua dari sehari, mengosongkan `aktivasi_hash` kedaluwarsa, dan jejak dummy yang ditinggal; TIDAK menyentuh sesi sah, jendela berjalan, tautan aktif, atau jejak non-dummy; berjalan dua kali memberi hasil sama.

## 4. Uji pipeline

### 4.1 `jaga_unggah.mjs` menolak (`tests/jaga-unggah.test.mjs`, JM-D02)

Tiap syarat punya satu fixture jahat dan satu fixture yang lolos. Keputusan bersifat semua-atau-tidak-sama-sekali: satu kegagalan membuat NOL unggahan (jumlah panggilan `put` = 0) dan kode keluar tak nol.

| Kode | Syarat penolakan (DT §7.4 langkah 6, KPV §5.9) | Batas diuji |
| --- | --- | --- |
| J1 | berkas susut lebih dari 20% terhadap potret sebelumnya | 19,9% lolos, 20,1% ditolak |
| J2 | JSON rusak | satu karakter dipotong |
| J3 | baris tanpa `sumber_url` | satu dari seribu baris cukup untuk menolak; jumlah baris tanpa sumber dilaporkan |
| J4 | `sumber_url` berskema `javascript:`, `data:`, `blob:` | ditolak |
| J5 | pola surel atau telepon di lapis publik dan anggota | surel biasa, `a [at] b`, `+62`, `08xx`, sembilan angka berurutan |
| J6 | kolom terlarang (agama, nik, tanggal lahir, alamat rumah, status kawin, biometrik) di lapis mana pun | nama kolom di objek bersarang juga |
| J7 | id atau hash ada di daftar tolak | |
| J8 | berkas lebih dari 2 MB | 2 MB lolos, 2 MB + 1 byte ditolak |
| J9 | fakta `est` tanpa `rumus` | |
| J10 | `kunci` fakta di luar `KUNCI_FAKTA` | |
| J11 | `tingkat_bukti` atau `jenis` sumber di luar taksonomi | |
| J12 | rujukan dari berkas lapis rendah ke berkas lapis tinggi (string `potret/anggota/` atau `potret/pengurus/` di lapis publik) | |

Selain itu: `manifest.json` diunggah TERAKHIR (urutan panggilan `put` direkam); mode `--dry-run` tidak melakukan `put`; ambang tidak dapat diganti lewat bendera lingkungan.

### 4.2 Daftar tolak bersih di semua potret (`tests/daftar-tolak.test.mjs`, JM-D11, PRD U7)

1. Fixture kurasi memuat tiga entitas yang diletakkan di `daftar-tolak.json` (fixture, berisi id dan hash, bukan nama nyata): satu orang, satu lembaga, satu proyek. Pipeline dijalankan penuh.
2. **Invarian:** untuk setiap id, hash, nama, slug, kunci, dan alias milik entitas di daftar, TIDAK ADA kemunculan di berkas potret mana pun pada ketiga lapis (pindai teks semua berkas: `sensus`, `cari`, `graf`, `peta`, `p_*`, `wilayah_*`, `cerita_*`, `induk`, `lembaga`, dan seterusnya), termasuk sebagai ujung ikatan di entitas lain dan sebagai hasil pencarian.
3. Daftar bukan berkas repo: `gerbang-rahasia` menolak `daftar-tolak.json` terlacak; uji memastikan pipeline mengambilnya dari jalur privat (R2 `privat/`) dan gagal dengan pesan jelas bila daftar tidak terbaca (bukan diam-diam melanjutkan tanpa daftar).
4. Impor ulang entitas yang ada di daftar lewat `POST /api/kurasi/impor` ditolak dan dihitung di `ditolak`.
5. Nama yang "diminta keluar" mengalahkan semua sumber: baris panen yang cocok dengan hash di daftar disaring sebelum sambung.

### 4.3 Potret per lapis (`tests/potret.test.mjs`, JM-D12)

Fixture mencakup: orang `tampil = 1`, orang `tampil = 0`, kontak orang, entitas `status = 'ditarik'` dan `'digabung'`, baris `dummy = 1`, fakta `lapis` publik, anggota, dan pengurus.

1. Lapis publik tidak memuat: kontak, orang `tampil = 0`, entitas ditarik atau digabung (kecuali sebagai alias pada target), baris dummy, fakta berlapis lebih tinggi.
2. Lapis atas hanya berisi delta kolom miliknya (`KOLOM_LAPIS`); gabungan Worker (`/api/p/:slug`) sama dengan profil penuh yang dihitung langsung dari D1 untuk peran itu.
3. `gerbang pindai`: tiap berkas publik dan anggota bebas pola surel, telepon, dan kolom terlarang.
4. Entitas "di luar sensus" tidak dihitung di `sensus.json`; entitas `nuklir` dan `ccs` tidak punya chip utama.
5. `meta.json`: `tanpa_sumber = 0`; jumlah entitas dan ikatan sama dengan hitungan independen atas fixture (PRD U1 dan U3 dilaporkan, bukan diassert pada angka tetap).
6. Penggabungan (`sambung`): kurasi menang atas panen pada kunci sama; baris panen ambigu masuk antrean kurator dan TIDAK digabung; menjalankan pipeline dua kali pada masukan sama menghasilkan berkas identik byte (deterministik).
7. Graf: ikatan dengan ujung yang ditarik atau di daftar tolak tidak muncul; sisi tidak menunjuk simpul yang tidak ada; `strategis()` mengikuti §2.1 keluarga S.
8. Cerita beku: `cerita_<slug>.json` berisi `beku_pada`; membangun ulang tidak menimpa berkas beku kecuali slug bertanggal baru (DT §7.4).

### 4.4 Panen Python (`tests/panen/uji_*.py`, `gerbang-panen`)

Tanpa jaringan: semua respons dari `tests/fixtures/panen/` (rekaman sampel) dan server `http.server` lokal untuk `robots.txt`.

1. **robots.txt:** host dengan `Disallow` pada jalur yang diminta TIDAK diminta (jumlah permintaan ke jalur itu = 0); host tanpa `robots.txt` mengikuti kebijakan DT §7.1 butir 1 (API resmi terdaftar sebagai pengecualian tertulis).
2. **Sopan santun:** `User-Agent` memuat kontak resmi METI; jeda antar permintaan ke host sama tidak kurang dari 2 detik (jam disuntikkan); satu percobaan ulang dengan backoff, bukan lebih.
3. **Keluaran** berbentuk `{"sumber","diambil","lisensi","baris":[...]}`; baris tanpa `sumber_url` dibuang dan DIHITUNG di laporan; `--dry-run` tidak menulis R2 (penulis palsu menghitung nol).
4. **Hanya stdlib:** `gerbang-panen` memeriksa impor terhadap `sys.stdlib_module_names`.
5. **1001startup.id:** tidak ada kode permintaan jaringan ke host itu; `impor_1001.py` hanya membaca berkas lokal, memberi `jenis = 'via-pihak-ketiga'`, tanggal ambil, tanpa teks deskripsi, estimasi, dan logo (ADR-06). JM-D08 tertahan: uji dasar ini sudah hijau sebelum tiketnya jalan.
6. **Lisensi:** baris GEM berlisensi NC disaring atau hanya berupa tautan; atribusi "OpenStreetMap contributors" dan "via 1001startup.id" ada pada keluaran yang relevan.
7. **Rahasia:** `OPENALEX_KEY` hanya dari lingkungan; tidak ada di keluaran, log, atau pesan galat (tangkap `stdout` dan `stderr`).
8. **OpenAlex:** filter `country_code:ID`, karya paling sedikit 3, topik energi dari ID yang terdaftar, `mailto` surel resmi METI; penolakan topik terlalu longgar (subbidang 2105) tercakup uji.
9. Kontrak sumber nyata (perubahan skema API pihak lain) tidak diuji di CI; ia dipantau lewat `panen-bulanan` dengan `dry_run` manual dan laporan jumlah baris.

## 5. Pengulas, penyelarasan, cadangan, dan rilis

### 5.1 Pengulas wajib (KPV §10, DT §2.3)

Pemeriksa membaca diff dan menulis temuan bertingkat; "selesai" menuntut nol temuan tinggi.

| Permukaan berubah | Pengulas |
| --- | --- |
| `src/hak.js`, `sesi.js`, `sandi.js`, `akun.js`, rute `/api/*` | `security-reviewer`, `guard-api` |
| `_headers`, CSP, penyisipan HTML dari data luar | `security-reviewer` |
| `migrations/**` | `migrasi-idempoten` |
| potret per lapis, daftar tolak, kolom pribadi, skrip panen | `security-reviewer`; `validasi-model` untuk skor |
| angka yang tampil | `selera-angka` |
| kontrol berchrome, tab, chip, paginasi, peta | `inp-reviewer` |
| berkas baru di `tests/` dan `tests/cakupan.json` | `penulis-gerbang` memeriksa cakupan |
| armada agent | `higiene-repo` |

### 5.2 Penyelarasan konteks bersih (JM-H03)

Satu subagent tanpa riwayat percakapan membandingkan kode dengan seluruh paket dokumen dan menulis `docs/perencanaan/PENYELARASAN.md` (lampiran; kalah dari semua dokumen). Isi: tabel fitur PRD ke berkas dan uji (satu baris per kode `F-xxx`), penyimpangan (nol, atau dicatat sebagai ADR di DT dan ditanyakan ke pemilik), hasil `gerbang-rujukan-dokumen` (tidak ada rujukan menggantung), hasil ukur CPU (§2.6), dan catatan pelajaran. Selesai bila tiap fitur PRD punya baris dan `gerbang-penyelarasan` hijau. Berkas bertambah per putaran dengan judul bertanggal; putaran lama tidak ditimpa.

### 5.3 Cadangan dan latihan pemulihan (sebelum pengguna pertama; KPV §9, OP, DT §8.5)

**Cadangan.** Skrip `scripts/mesin/cadangan.mjs` mengekspor D1 (`wrangler d1 export`) ke R2 privat `cadangan/d1-<tgl>.sql` dan menyalin potret mingguan ke `cadangan/potret-<tgl>/`. Dijalankan pemilik atau CI dengan token minimal; bukan jadwal baru (batas 5 jadwal).

**Latihan pemulihan di lokal (`tests/pemulihan.test.mjs`, CI):**

1. Dari baseline berfixture (akun semua peran, entitas, fakta, ikatan, koreksi, riwayat, jejak, sesi), ekspor ke berkas SQL.
2. Impor ke D1 lokal KOSONG baru (migrasi tidak diterapkan; hanya hasil impor).
3. Tuntut: jumlah baris dan checksum tiap tabel sama; `sqlite_master` sama (tabel, indeks, trigger, tabel FTS5); `PRAGMA foreign_key_check` dan `integrity_check` bersih; trigger tetap bekerja (UPDATE `jejak` ditolak; super terakhir tetap dilindungi); pencarian FTS5 menemukan entitas; SA fixture bisa masuk dengan sandi lamanya; kolom `iterasi` tetap.
4. Tuntut juga bahwa cadangan TIDAK memuat sandi mentah, token sesi mentah, atau token aktivasi mentah (hanya hash).

**Risiko yang diuji, bukan diasumsikan.** Ekspor D1 yang saya ketahui tidak mendukung basis data berisi tabel virtual, sedangkan `entitas_cari` adalah tabel virtual FTS5 (DT §3.3). Langkah 1 harus membuktikan ekspor berhasil di versi `wrangler` terpasang. Bila gagal, kegagalan ini harus muncul di CI (bukan tersembunyi) dan keputusan jatuh ke pemilik: (a) cadangan memakai ekspor per tabel kecuali tabel virtual, indeks FTS dibangun ulang sesudah impor (uji pemulihan disesuaikan), dengan atau tanpa (b) Time Travel D1 sebagai lapis kedua. Verifikasi perilaku terbaru di dokumentasi Cloudflare sebelum JM-A03 (§8 butir 6).

**Latihan pemulihan produksi** (manual, dicatat di `PENYELARASAN.md`): pemilik memulihkan cadangan produksi ke D1 sementara bernama lain, menjalankan `npm run uji:asap` terhadap Worker sementara itu, lalu menghapus D1 sementara. Ulang sebelum pengguna pertama dan bersama uji "tanpa pengembang" OP (SEK dan BIM memulihkan cadangan dalam satu hari).

### 5.4 Uji asap produksi pasca deploy (`npm run uji:asap -- https://<host>`, JM-H04)

`scripts/mesin/asap-produksi.mjs`. Hanya `GET` dan permintaan tulis tanpa cookie yang pasti ditolak sebelum menyentuh data. Tanpa kredensial. Satu kegagalan membuat kode keluar tak nol dengan pesan yang menyebut URL, harapan, dan hasil.

| Kelompok | Permintaan | Harapan |
| --- | --- | --- |
| Status | `GET /api/status` | 200; `db = "ok"`; `potret` berupa tanggal dan tidak lebih tua dari 2 hari (peringatan, bukan galat, bila lebih); `versi` terisi |
| Rute publik terbuka | `GET /`, `/perusahaan`, `/peta`, `/metode`, `/masuk`, `/i18n/id.json`, `/i18n/en.json`, `/api/potret/publik/sensus`, `/api/potret/manifest.json` (nama berkas mengikuti R2) | 200; potret publik berformat JSON valid; badan potret publik bebas pola surel dan telepon; `/api/potret/publik/*` memberi `public, max-age=300` |
| Rute terkunci menolak | `GET /direktori`, `/admin` | 302 ke `/masuk?ke=...`; `/direktori.html` 404; `/akademisi` 404 |
| | `GET /api/direktori`, `/api/potret/anggota/induk`, `/api/potret/pengurus/x`, `/api/admin/akun`, `/api/admin/jejak`, `/api/kurasi/entitas`, `/api/riwayat`, `/api/koreksi/saya` | 401 dengan `{galat, kode:"belum-masuk"}` |
| | `POST /api/kurasi/entitas`, `/api/admin/dummy/x`, `/api/kurasi/impor` tanpa cookie | 401 (bukan 200, bukan 500), tidak ada tulis |
| | `POST /api/koreksi` dengan `Origin` asing | 403 |
| Header | `GET /` | `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, CSP tanpa `unsafe-inline` pada `script-src` dan tanpa `*`; `GET /direktori` dan `/admin`: `X-Robots-Tag: noindex, nofollow`, `Cache-Control: private, no-store`; `GET /api/saya`: `no-store` |
| Robots | `GET /robots.txt` | memuat `Disallow` untuk `/api/`, `/direktori`, `/admin`, `/masuk`, `/aktivasi` (KPV §6) |
| Rahasia | badan `/`, `/api/status`, `/wrangler.jsonc`, `/.dev.vars`, `/migrations/0001_akun.sql` | tidak memuat pola kunci; berkas internal tidak terlayani (404) |
| Ukuran | berkas potret publik dari manifest | tiap berkas tidak lebih dari 2 MB |

Setelah lolos: catat hasil di `PENYELARASAN.md` bagian "Rilis <tanggal>" dan jalankan pengukuran CPU (§2.6 butir 4). Uji berkredensial (masuk sebagai SA di produksi) tidak dilakukan skrip ini; alur login sudah dibuktikan lokal (§2.5) dan di Worker uji sementara.

### 5.5 Prosedur rilis (JM-H04; subagent tidak commit, push, atau deploy)

Dikerjakan pemilik atau sesi induk atas perintah pemilik:

1. `npm run uji:semua` hijau di `main` dan semua pemeriksa di §5.1 tanpa temuan tinggi; `PENYELARASAN.md` tanpa penyimpangan terbuka.
2. Cadangan D1 produksi (jika sudah berisi) ke R2 privat.
3. Pemilik menjalankan `wrangler d1 migrations apply jaringan-meti --remote` (id nyata hanya di salinan lokal; `wrangler.jsonc` di repo tetap kosong). Sesudahnya hash migrasi baru dimasukkan ke `migrasi-beku.json` lewat commit terpisah.
4. Unggah potret awal ke R2 produksi dengan manifest terakhir; purge cache tepi.
5. `wrangler deploy`.
6. `npm run uji:asap -- https://<host>` (§5.4); lalu latihan pemulihan produksi dan ukur CPU bila ini rilis pertama.
7. Kegagalan di langkah 6: `wrangler rollback` memulihkan kode; migrasi tidak digulung balik (hanya maju), jadi bila migrasi bermasalah, pulihkan dari cadangan (§5.3) dan tambah migrasi perbaikan bernomor baru.

## 6. Registri cakupan dan CI

### 6.1 Registri `tests/cakupan.json`

Lokasi mengikuti DT §2.2, KPV §10, dan TIKET §1 butir 5 (`tests/cakupan.json`), bukan `tests/e2e/` seperti contoh `mbg-kdmp` (§8 butir 2). Tiga daftar per jenis butir, sesuai TEST.md:

```json
{
  "versi": 1,
  "rute":    { "diuji": { "POST /api/masuk": ["tests/sesi.test.mjs"] },
               "dikecualikan": { "GET /i18n/id.json": "aset statis tanpa logika; dijaga gerbang-i18n" },
               "antre": [] },
  "tabel":   { "diuji": {}, "dikecualikan": {}, "antre": [] },
  "trigger": { "diuji": {}, "dikecualikan": {}, "antre": [] },
  "skrip":   { "diuji": {}, "dikecualikan": {}, "antre": [] },
  "fungsi":  { "diuji": {}, "dikecualikan": {}, "antre": [] },
  "antre_batas": 0
}
```

Butir yang dihitung `gerbang-test-integrasi`: tiap kunci rute di router dan modulnya; tiap `CREATE TABLE`, `CREATE VIRTUAL TABLE`, dan `CREATE TRIGGER` di `migrations/*.sql`; tiap berkas di `scripts/**/*.{mjs,py}`; tiap fungsi yang diekspor `src/hak.js`, `src/sandi.js`, `src/sesi.js`, `src/akun.js`, `src/kurasi.js`, `src/potret.js`. Aturan (merah bila dilanggar, pesan menyebut butir dan sebabnya):

1. Setiap butir ada di TEPAT SATU dari `diuji`, `dikecualikan`, `antre`; butir yang hilang dari sumber tetapi masih terdaftar dilaporkan basi.
2. `diuji` menunjuk berkas uji yang ada DAN yang teksnya menyebut nama butir (mencegah entri palsu).
3. `dikecualikan` wajib beralasan paling sedikit 20 karakter.
4. `antre` adalah utang eksplisit yang hanya boleh menyusut: panjangnya tidak boleh melebihi `antre_batas`; menurunkan `antre_batas` dilakukan manual saat utang dilunasi. Mulai JM-H04, `antre_batas` dikunci setelah rilis pertama dan butir baru TIDAK boleh masuk `antre`.
5. Suite yang berat tidak dijalankan di setiap push tanpa alasan (TEST.md butir 4): lihat pemicu di §6.2.

### 6.2 CI GitHub Actions (`.github/workflows/uji.yml`, JM-A02)

Tanpa rahasia produksi, `permissions: contents: read`, tanpa `pull_request_target` (`gerbang-workflow`). Tidak menambah jadwal cron baru: terpakai 4 dari 5 (DT §7.3), sehingga pemicu uji berat adalah perubahan jalur, permintaan tarik, dan `workflow_dispatch`, bukan jadwal harian. Repo publik (KPV §9), jadi menit CI tidak menjadi kendala utama, tetapi pemicu tetap disaring jalur agar umpan balik cepat.

| Urutan | Job | Isi | Pemicu | Memblokir merge |
| --- | --- | --- | --- | --- |
| 1 | `gerbang` | `npm ci`; `npm run uji:gerbang` (seluruh §1.4, tanpa DB dan peramban, di bawah satu menit) | `push`, `pull_request`, `workflow_dispatch` | ya; job lain `needs: gerbang` |
| 2a | `unit` | `npm run uji:unit` (§2.1, i18n, util) | sama | ya |
| 2b | `pipa` | Python 3.12, `npm run uji:pipa` (§4.4) | sama; jalur `scripts/**`, `tests/panen/**` | ya |
| 2c | `d1` | `npm run uji:siapkan` (baseline, di-cache menurut hash `migrations/`); `npm run uji:d1` lalu `npm run uji:e2e` (§2.2, §2.4, §2.5, §3, §4.1 sampai §4.3, pemulihan) | `pull_request`, `push` ke `main`, `workflow_dispatch`; jalur `src/**`, `migrations/**`, `scripts/direktori/**`, `public/taksonomi.js`, `public/algo.js`, `tests/**`, `wrangler.jsonc` | ya |
| 3 | `layar` | `needs: d1`; `npx playwright install --with-deps chromium`; `npm run uji:layar` (§2.3); artefak: laporan HTML, tangkapan layar, jejak saat gagal | `pull_request` dan `workflow_dispatch`; jalur `public/**`, `src/**`, `tests/layar/**`, `tests/fixtures/**` | ya (pelanggaran axe `serious` atau `critical`, galat konsol, INP di atas batas, gulir horizontal) |
| 4 | `ringkasan` | menempel angka: jumlah sel hak teruji, `antre` tersisa, jumlah kunci i18n | selalu | tidak |

Tidak memblokir (informasional): temuan axe `moderate` dan `minor`; tangkapan layar untuk peninjau manusia; keluaran `ukur-cpu`. Tidak berjalan di CI sama sekali: `uji:asap`, ukur CPU, latihan pemulihan produksi, dan panen sumber nyata (semuanya manual oleh pemilik, §5). Pemilik mengaktifkan perlindungan cabang `main` dengan status wajib `gerbang`, `unit`, `pipa`, `d1`, `layar` ([manusia], bagian JM-A03).

## 7. Definisi "selesai" dan padanan tiket

### 7.1 Definisi umum (berlaku untuk semua tiket JM-*)

1. Perintah bukti di §7.3 keluar 0 lokal dan job CI terkait hijau.
2. Semua butir baru (rute, tabel, trigger, skrip, fungsi ekspor) terdaftar `diuji` atau `dikecualikan` beralasan di `tests/cakupan.json`; `antre` tidak bertambah.
3. Tiap aturan hak, CHECK, trigger, dan gerbang yang disentuh punya uji terima dan uji "yang salah DITOLAK".
4. Pemeriksa permukaan itu (§5.1) tanpa temuan tinggi.
5. Teks antarmuka baru ada di `id.json` dan `en.json` bersamaan (`gerbang-i18n` hijau).
6. Tanpa data pribadi, rahasia, atau id Cloudflare di berkas yang dilacak (`gerbang-rahasia` hijau).
7. Pesan gagal uji baru menyebut angka dan sebab (lewat `pesan.mjs`).
8. Pengerja tidak commit, push, atau deploy.

### 7.2 Tambahan menurut kelas tiket

| Kelas | Tambahan syarat selesai |
| --- | --- |
| Worker | `gerbang-d1`, `gerbang-r2`, `gerbang-rute` hijau; peran minimal rute tertulis; cuplikan `rows_read` dan EXPLAIN bersih (§3.5) untuk kueri baru |
| Migrasi | `migrasi-idempoten` bersih; jalan dua kali tanpa selisih (§3.1); taksonomi selaras (§3.3); tiap CHECK dan trigger baru punya baris di §3.2 |
| Layar | lolos matriks 1440 dan 390, terang dan gelap, ID dan EN (§2.3.1); axe tanpa `serious`; INP di bawah 200 ms; kontrol berchrome lewat rumah kontrol bersama; `selera-angka` dan `inp-reviewer` |
| Pipa | fixture jahat §4 tercakup; hanya stdlib; membaca `robots.txt`; baris tanpa sumber dibuang dan dihitung |
| Gerbang | punya fixture jahat yang membuatnya merah (§1.5 butir 2); daftar per butir |
| `[manusia]` | bukti berupa konfirmasi pemilik atau berkas yang dilampirkan; tercatat di `PENYELARASAN.md`; penghambat C-xx disebut |
| Tertahan | tiket tertahan menyisakan uji dasar yang sudah bisa hijau (mis. JM-D08: tidak ada permintaan ke 1001startup.id) |

### 7.3 Padanan tiket ke berkas uji dan perintah

Perintah memakai `node --test` per berkas (jalan sendiri karena `tests/helper/d1.mjs` menyiapkan baseline bila belum ada). `U` = ukuran keberhasilan PRD §1.3.

| Tiket | Berkas uji | Perintah bukti | Catatan |
| --- | --- | --- | --- |
| JM-A01 | `tests/gerbang-model-agent.test.mjs`, `tests/gerbang-ilmu-agent.test.mjs` | `node --test tests/gerbang-model-agent.test.mjs tests/gerbang-ilmu-agent.test.mjs` | tiap agent punya `model:`, satu pemilik per berkas |
| JM-A02 | `tests/gerbang-rahasia.test.mjs`, `tests/gerbang-workflow.test.mjs`, `tests/gerbang-test-integrasi.test.mjs` | `npm run uji` | hijau di CI; registri `cakupan.json` ada |
| JM-A03 `[manusia]` | tanpa uji otomatis | `wrangler d1 list` memuat `jaringan-meti`; `npm run uji:asap` belum berlaku | bukti: konfirmasi pemilik, `wrangler.jsonc` repo tetap berid kosong (`gerbang-rahasia`) |
| JM-A04 | `tests/util.test.mjs` | `node --test tests/util.test.mjs` | §2.1 keluarga U |
| JM-A05 | `tests/gerbang-headers.test.mjs`, `tests/gerbang-rute.test.mjs`, `tests/rute-peran.test.mjs` (halaman: pengalih dan `noindex`) | `node --test tests/gerbang-headers.test.mjs tests/gerbang-rute.test.mjs` | halaman tak berizin dialihkan ke `/masuk?ke=` |
| JM-B01 | `tests/skema.test.mjs` (akun, sesi), `tests/migrasi.test.mjs`, `tests/gerbang-migrasi.test.mjs` | `node --test tests/skema.test.mjs tests/migrasi.test.mjs tests/gerbang-migrasi.test.mjs` | peran tak sah DITOLAK; super terakhir |
| JM-B02 | `tests/sandi.test.mjs` | `node --test tests/sandi.test.mjs` | di workerd; S1 sampai S7 |
| JM-B03 | `tests/sesi.test.mjs` | `node --test tests/sesi.test.mjs` | T1 sampai T9, R1 sampai R8, CSRF |
| JM-B04 | `tests/hak.test.mjs`, `tests/gerbang-d1.test.mjs`, `tests/gerbang-r2.test.mjs`, `tests/gerbang-matriks-sinkron.test.mjs`, `tests/gerbang-matriks.test.mjs` | `node --test tests/hak.test.mjs tests/gerbang-d1.test.mjs tests/gerbang-matriks-sinkron.test.mjs` | 112 sel; U5 |
| JM-B05 | `tests/akun.test.mjs`, `tests/rute-peran.test.mjs` | `node --test tests/akun.test.mjs tests/rute-peran.test.mjs` | admin tidak naik ke super; super terakhir |
| JM-B06 | `tests/layar/masuk.spec.mjs` | `npx playwright test tests/layar/masuk.spec.mjs` | LA6; ID dan EN |
| JM-B07 | `tests/skema.test.mjs` (jejak), `tests/rute/jejak.test.mjs` | `node --test tests/skema.test.mjs tests/rute/jejak.test.mjs` | append-only; jejak bebas rahasia |
| JM-C01 | `tests/gerbang-kontras.test.mjs`, `tests/gerbang-token-meti.test.mjs`, `tests/layar/tema.spec.mjs` | `node --test tests/gerbang-kontras.test.mjs tests/gerbang-token-meti.test.mjs` | L5, L6 |
| JM-C02 | `tests/direktori-layar.test.mjs`, `tests/layar/direktori.spec.mjs` | `node --test tests/direktori-layar.test.mjs` | LA7; delapan tab |
| JM-C03 | `tests/gerbang-teks.test.mjs`, `tests/saring-sektor.test.mjs` | `node --test tests/gerbang-teks.test.mjs` | `grep -nE "BNPB|BPBD|karhutla|DIBI" public/direktori.js` kosong |
| JM-C04 | `tests/rute/direktori-*.test.mjs`, `tests/hak.test.mjs` | `node --test tests/rute/direktori-karya.test.mjs tests/rute/direktori-riset.test.mjs tests/rute/direktori-gambar.test.mjs` | §2.4.7 butir 5 dan 6 |
| JM-C05 | `tests/gerbang-dummy.test.mjs`, `tests/gerbang-dummy-layar.test.mjs`, `tests/e2e/05-dummy-jejak.sql`, `tests/layar/dummy.spec.mjs` | `node --test tests/gerbang-dummy.test.mjs tests/gerbang-dummy-layar.test.mjs && npm run uji:e2e` | §2.7 |
| JM-C06 | `tests/gerbang-i18n.test.mjs`, `tests/i18n.test.mjs` | `node --test tests/gerbang-i18n.test.mjs tests/i18n.test.mjs` | U6; keluarga F |
| JM-C07 | `tests/direktori-seg.test.mjs`, `tests/direktori-klik.test.mjs`, `tests/direktori-layar.test.mjs`, `tests/direktori-versi.test.mjs`, `tests/hubung.test.mjs`, `tests/lembaga-gabung.test.mjs`, `tests/gerbang-inp-transisi.test.mjs`, `tests/gerbang-teks.test.mjs`, `tests/gerbang-dummy.test.mjs` | `npm run uji:gerbang` | gerbang layar asal diport (§1.4) |
| JM-D01 | `tests/skema.test.mjs`, `tests/gerbang-taksonomi.test.mjs`, `tests/cari.test.mjs`, `tests/rute/kurasi.test.mjs` | `node --test tests/skema.test.mjs tests/gerbang-taksonomi.test.mjs tests/cari.test.mjs` | sumber NOT NULL; U2 |
| JM-D02 | `tests/jaga-unggah.test.mjs` | `node --test tests/jaga-unggah.test.mjs` | J1 sampai J12 |
| JM-D03 | `tests/panen/uji_openalex.py`, `tests/panen/uji_inti.py`, `tests/gerbang-panen.test.mjs` | `npm run uji:pipa` | §4.4 butir 8 |
| JM-D04 | `tests/panen/uji_osm.py` | `npm run uji:pipa` | atribusi ODbL |
| JM-D05 | `tests/panen/uji_statistik.py` | `npm run uji:pipa` | lisensi IRENASTAT ditandai |
| JM-D06 | `tests/panen/uji_regulasi.py` | `npm run uji:pipa` | status berlaku dan relasi mengubah/mencabut |
| JM-D07 `[manusia]` | `tests/rute/kurasi.test.mjs` (impor) | `node --test tests/rute/kurasi.test.mjs` | seed lewat `POST /api/kurasi/impor`; tertahan C-10, C-11 |
| JM-D08 | `tests/gerbang-panen.test.mjs`, `tests/panen/uji_via_1001.py` | `npm run uji:pipa` | tertahan C-13; uji dasar hijau (§4.4 butir 5) |
| JM-D09 | `tests/panen/uji_aesi.py`, `uji_gem.py`, `uji_wri.py` | `npm run uji:pipa` | lisensi NC disaring |
| JM-D10 | `tests/hubung.test.mjs`, `tests/lembaga-gabung.test.mjs`, `tests/algo.test.mjs` | `node --test tests/hubung.test.mjs tests/algo.test.mjs` | keluarga D dan S; KP D13 |
| JM-D11 | `tests/daftar-tolak.test.mjs` | `node --test tests/daftar-tolak.test.mjs` | U7 |
| JM-D12 | `tests/potret.test.mjs`, `tests/rute/potret.test.mjs` | `node --test tests/potret.test.mjs tests/rute/potret.test.mjs` | §4.3, §2.4.7 butir 1 |
| JM-D13 | `tests/algo.test.mjs` (keluarga K) | `node --test tests/algo.test.mjs` | `via-pihak-ketiga` tidak pernah Tinggi |
| JM-E01 | `tests/layar/beranda.spec.mjs` | `npx playwright test tests/layar/beranda.spec.mjs` | LA1; U4 |
| JM-E02 | `tests/layar/perusahaan.spec.mjs` | `npx playwright test tests/layar/perusahaan.spec.mjs` | LA2; INP chip |
| JM-E03 | `tests/layar/profil.spec.mjs`, `tests/rute/profil.test.mjs` | `npx playwright test tests/layar/profil.spec.mjs` dan `node --test tests/rute/profil.test.mjs` | LA3 |
| JM-E04 | `tests/layar/peta.spec.mjs` | `npx playwright test tests/layar/peta.spec.mjs` | LA4; INP; `inp-reviewer` |
| JM-E05 | `tests/layar/metode.spec.mjs` | `npx playwright test tests/layar/metode.spec.mjs` | LA5 |
| JM-E06 | `tests/rute/koreksi.test.mjs`, `tests/skema.test.mjs` (koreksi), `tests/e2e/alur.test.mjs` (langkah 8) | `node --test tests/rute/koreksi.test.mjs tests/skema.test.mjs` | §2.4.7 butir 8 |
| JM-E07 | `tests/rute/kurasi.test.mjs`, `tests/layar/admin.spec.mjs` | `node --test tests/rute/kurasi.test.mjs` | simpan tanpa sumber DITOLAK; LA8 |
| JM-F01 | `tests/layar/rantai.spec.mjs`, `tests/potret.test.mjs` | `npx playwright test tests/layar/rantai.spec.mjs` | pola halaman wajib (L7) |
| JM-F02 | `tests/layar/pembiaya.spec.mjs` | `npx playwright test tests/layar/pembiaya.spec.mjs` | L7 |
| JM-F03 | `tests/algo.test.mjs` (keluarga Q), `tests/layar/bumn.spec.mjs` | `node --test tests/algo.test.mjs` dan `npx playwright test tests/layar/bumn.spec.mjs` | pil Hipotesis; padanan tabel; papan ketik |
| JM-F04 | `tests/layar/data-center.spec.mjs` | `npx playwright test tests/layar/data-center.spec.mjs` | matriks risiko; pil Hipotesis |
| JM-F05 | `tests/layar/desa.spec.mjs` | `npx playwright test tests/layar/desa.spec.mjs` | L7 |
| JM-F06 | `tests/layar/wilayah.spec.mjs`, `tests/rute/wilayah.test.mjs` | `npx playwright test tests/layar/wilayah.spec.mjs` | kode 2 digit tak sah 404 |
| JM-F07 | `tests/layar/kebijakan.spec.mjs` | `npx playwright test tests/layar/kebijakan.spec.mjs` | jejak isu |
| JM-F08 | `tests/potret.test.mjs` (cerita beku), `tests/layar/cerita.spec.mjs` | `node --test tests/potret.test.mjs` dan `npx playwright test tests/layar/cerita.spec.mjs` | tanggal beku; Cara mengutip |
| JM-F09 | `tests/skema.test.mjs` (riwayat), `tests/rute/riwayat.test.mjs` | `node --test tests/skema.test.mjs tests/rute/riwayat.test.mjs` | WL dan KR tidak membaca |
| JM-F10 | `tests/panen/uji_meti.py` | `npm run uji:pipa` | hanya judul, tanggal, tautan, penulis |
| JM-G01 sampai JM-G04 | belum ditulis | menunggu C-01 dan C-09 | Turnstile, klaim lewat surel domain, API terbuka dengan CORS GET saja; RU diperluas saat tiket diaktifkan |
| JM-H01 | `tests/e2e/alur.test.mjs`, `tests/e2e/*.sql` | `npm run uji:e2e` | §2.5 langkah 1 sampai 12 |
| JM-H02 | `tests/layar/*.spec.mjs` | `npm run uji:layar` | §2.3; U8 |
| JM-H03 | `tests/gerbang-rujukan-dokumen.test.mjs`, `tests/gerbang-penyelarasan.test.mjs` | `node --test tests/gerbang-rujukan-dokumen.test.mjs tests/gerbang-penyelarasan.test.mjs` | `PENYELARASAN.md` |
| JM-H04 `[induk]` `[manusia]` | `tests/pemulihan.test.mjs`, `scripts/mesin/asap-produksi.mjs` | `node --test tests/pemulihan.test.mjs` lalu `npm run uji:asap -- https://<host>` | §5.3 sampai §5.5 |

### 7.4 Ukuran keberhasilan PRD ke perintah bukti

| Kode | Perintah bukti |
| --- | --- |
| U1 entitas bersumber | `meta.json` hasil `potret.mjs` dibaca laporan; bukan asersi uji (§0 butir 4) |
| U2 fakta atau ikatan tanpa sumber = 0 | `node --test tests/jaga-unggah.test.mjs tests/skema.test.mjs` |
| U3 ikatan | `meta.json`; bukan asersi uji |
| U4 bagian wajib halaman publik | `npm run uji:layar` (L7) |
| U5 sel matriks teruji 100% | `node --test tests/hak.test.mjs` |
| U6 paritas kunci EN | `node --test tests/gerbang-i18n.test.mjs` |
| U7 daftar tolak = 0 di potret | `node --test tests/daftar-tolak.test.mjs` |
| U8 INP di bawah 200 ms pada 1440 dan 390 | `npm run uji:layar` (§2.3.3) |

## 8. Celah dan pertanyaan untuk sesi induk (ditemukan saat menulis RU)

Semua punya bawaan yang dipakai RU; kerja jalan memakai bawaan sampai dijawab.

| No | Temuan | Bawaan RU |
| --- | --- | --- |
| 1 | Permintaan penulisan RU menyebut viewport 1280 dan 390; PRD U8, DS, dan TIKET JM-H02 menyebut 1440 dan 390 | 1440 dan 390 (dokumen berotoritas lebih tinggi). Mengubah ke 1280 cukup satu konstanta di `tests/layar/playwright.config.mjs` dan baris §2.3.1 |
| 2 | Permintaan menyebut `tests/e2e/cakupan.json`; DT §2.2, KPV §10, dan TIKET §1 butir 5 menyebut `tests/cakupan.json` | `tests/cakupan.json` |
| 3 | INP.md menuntut satu rumah perkakas transisi sebelum halaman kedua lahir; DT §2.2 tidak memuat berkas itu | RU mengasumsikan satu berkas kontrol bersama (mis. `public/kontrol.js`) dibuat di JM-C01 atau JM-C02; DT perlu menambah barisnya |
| 4 | KPV §6 menetapkan isi `robots.txt`, tetapi `public/robots.txt` tidak ada di daftar berkas DT §2.2 | `gerbang-headers` dan uji asap mengasumsikan berkasnya ada |
| 5 | KPV §1 butir 10 (tombol dummy hanya mengisi klien) berlawanan dengan DT §8.3 dan §4.3 (`POST` dan `DELETE /api/admin/dummy/:halaman` menulis baris `dummy = 1`) | DT menang (urutan lebih tinggi); §2.7 menguji jalur server |
| 6 | Ekspor D1 (`wrangler d1 export`) yang saya ketahui tidak mendukung tabel virtual, sedangkan `entitas_cari` adalah FTS5 | uji pemulihan (§5.3) membuktikannya; verifikasi dokumentasi Cloudflare terbaru sebelum JM-A03 |
| 7 | Batas iterasi PBKDF2 di workerd belum diketahui (ADR-04) | S1 menjadi bukti; turunkan iterasi dan catat di KPV §4 bila ditolak |
| 8 | `ALGORITMA.md` belum ada di folder; `tests/fixtures/acuan.json` butuh nilainya | §2.1 menetapkan keluarga dan jumlah minimum; nilai diisi dari ALGORITMA saat tersedia |
| 9 | DT tidak mendefinisikan rute atau skrip yang menulis logo ke `gambar/`, padahal KPV §5.4 menuntut cek magic bytes, batas 512 KB, dan nama hash | uji ditempelkan ke komponen yang kelak menulis `gambar/`; tiket pemiliknya perlu ditetapkan |
| 10 | `public/direktori.js` hasil port berisi teks Indonesia tertanam, sedangkan K8 menuntut dwibahasa | masuk `antre` `gerbang-i18n` (utang eksplisit); pemilik memutuskan kapan i18n meluas ke berkas itu |
| 11 | DT §1 (diagram) menyebut direktori "9 tab"; PRD §3 dan TIKET JM-C03 menyebut delapan tab | delapan tab (PRD lebih tinggi) |
| 12 | Aturan `wajib_ganti` (DT §4.3 `POST /api/masuk` mengembalikan `wajib_ganti`) tidak jelas apakah memblokir halaman lain | T9 bersyarat; ALUR perlu menegaskan |
