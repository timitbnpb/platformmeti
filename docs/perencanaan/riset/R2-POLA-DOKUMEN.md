# Pola paket dokumen perencanaan pemilik (diekstrak dari repo poskokarhutla)

Sumber yang dibaca (3–5 Nov 2026 tertulis di berkasnya): `data/kajian-bnpb/pipa/` (SIPPA, paket terbesar, 24–30 Okt),
`kampus/` (Kemitraan Kampus, ringkas, 29–30 Okt), `lapangan/` (Pegawai dan Relawan Lapangan, paling ringkas, 1–2 Nov),
`kedeputian/` (Ruang Unit BNPB, 5 Nov, urutan sama dengan SIPPA). Ukuran: SIPPA PRD 218 KB, TIKET 173 KB;
Kampus PRD 19 KB, TIKET 59 KB; Lapangan PRD 4 KB, TIKET 10 KB. Untuk proyek baru tiru bentuk Kampus (menengah);
Lapangan adalah versi minimum yang masih lolos gerbang.

Singkatan lazim di berkas: KP/KD/KA = berkas keputusan; PRD; AL/ALUR; ALG; PD; DS; DT; KM; RU; TIKET. Rujukan silang
selalu `<singkatan> §<nomor>` (contoh "DT §5.1", "ALG §3.3", "RU §2.5").

---

## 1. Urutan otoritas dan fungsi tiap dokumen

Urutan otoritas ditulis ulang di kepala TIAP dokumen (kalimat "Dokumen ke-N dalam urutan otoritas. Kalah dari X;
menang atas Y"). Bila dua dokumen bertentangan atau sesuatu tidak tertulis, pengerja BERHENTI dan tanya pemilik.

Kampus (10 dokumen):
`KEPUTUSAN-KAMPUS` > `PRD` > `ALUR` > `ALGORITMA` > `PROFIL-DAERAH` > `DESIGN-SYSTEM` > `DESAIN-TEKNIS` > `KEAMANAN-PRIVASI` > `RENCANA-UJI` > `TIKET` (+ `GLOSARIUM`, `PENYELARASAN` sebagai lampiran, kalah dari semua).

SIPPA (7 inti): `KEPUTUSAN-SIPPA` > `PRD` > `DESIGN-SYSTEM` > `DESAIN-TEKNIS` > `KERANGKA-BUKU` > `RENCANA-UJI` > `TIKET`.
Dokumen pendukung di luar urutan: `KRITIK-DAN-KEPUTUSAN` (kalah dari KEPUTUSAN), `PENYELARASAN`, `baca-A/B/C`.

Lapangan: `KEPUTUSAN-LAPANGAN` > `RISET` > `PRD` > `ALUR` > `ALGORITMA` > `DESIGN-SYSTEM` > `DESAIN-TEKNIS` > `KEAMANAN-PRIVASI` > `RENCANA-UJI` > `TIKET` (+ `GLOSARIUM`, `KONTRAK-TAHAP-C`).

Ruang Unit: `KEPUTUSAN-UNIT` (bila ada) > `KEPUTUSAN-AWAL` > `riset/1-6` + `RISET` > `PRD` > `ALUR` > `ALGORITMA` > `DESIGN-SYSTEM` > `DESAIN-TEKNIS` > `KEAMANAN-PRIVASI` > `RENCANA-UJI` > `TIKET` (+ `GLOSARIUM`). Pengecualian tertulis: nama baku dan rumus dikuasai `ALGORITMA`.

| Dokumen | Fungsi (1–2 kalimat) |
| --- | --- |
| KEPUTUSAN-* | Daftar keputusan pemilik bernomor, dikutip dari percakapan; menang atas semua. Memuat juga keputusan perancang (boleh dibatalkan pemilik) dan pertanyaan terbuka dengan bawaan. |
| RISET / riset/ | Apa yang sudah ada di GitHub, praktik lazim, dan kode repo yang dipakai ulang; supaya tidak mengarang dan tidak membuat kembaran. Ditaruh sebelum PRD (Lapangan) atau jadi sumber sintesis (Ruang Unit). |
| PRD | Masalah, tujuan, ukuran keberhasilan, non-tujuan, larangan, peran, peta layar, dan fitur bernomor F-* beserta aturannya. Menjawab "apa". |
| ALUR | Alur ujung ke ujung tiap peran dan status, langkah bernomor, titik tolak, jejak. Menjawab "siapa melakukan apa, urutannya". |
| ALGORITMA | Rumus, bobot, ambang sebagai fungsi murni dengan kasus acuan; satu tempat konstanta. Menjawab "dihitung bagaimana". |
| PROFIL-DAERAH (khusus Kampus) | Skema JSON data turunan dan susunan buku cetak; contoh dokumen "skema data" untuk modul berbasis data. |
| DESIGN-SYSTEM | Token, cara memuat CSS/JS, anatomi halaman, komponen dipakai ulang vs baru (prefiks kelas), ikon, kalimat antarmuka, lakukan/jangan. Menjawab "tampilannya". |
| DESAIN-TEKNIS | Arsitektur, daftar berkas, SQL migrasi lengkap, kontrak API, fungsi murni, alur teknis, pipeline, keamanan/performa, ADR. Menjawab "bagaimana persisnya". |
| KEAMANAN-PRIVASI | Matriks hak peran x data, data pribadi (UU PDP), autentikasi, masukan/berkas, penyalahgunaan, header/CSP. |
| RENCANA-UJI | Kriteria terima bernomor dan perintah bukti yang harus keluar 0; tidak menambah fitur. |
| TIKET | Urutan kerja, pembagian pengerja, dependensi, bukti selesai. Hanya mengatur "siapa dan kapan"; isi teknis tetap di dokumen atasnya. |
| GLOSARIUM | Istilah baku + peta program/slide sumber ke fitur + peta indikator ke kueri. Tidak menetapkan apa pun. |
| PENYELARASAN | Laporan peninjau berkonteks bersih (lihat §5). |
| KRITIK-DAN-KEPUTUSAN (SIPPA) | Kritik klaim dokumen sumber, putusan GO/NO-GO per komponen, gerbang (lihat §5). |

---

## 2. Kerangka per jenis dokumen, format entri, contoh

### 2.1 KEPUTUSAN-*

Kepala: `# Keputusan pemilik: <Modul> (<tanggal>)`, satu paragraf "dokumen pertama dalam urutan otoritas", baris rantai
otoritas dengan `>`, kalimat aturan berhenti, kalimat "Sumber:" (paparan/percakapan + tanggal).

Kerangka (Kampus): `## A. Arah` / `## B. <Pilar 1>` / `## C. ...` (satu huruf per tema, tiap pilar satu bagian) /
`## F. Fondasi` / `## G. Rupa dan kerja` / `## H. Pertanyaan terbuka (punya bawaan, tidak menghalangi kerja)` /
`## I. Perubahan sesudah rilis awal`.
SIPPA: `A. Arah, B. Buku, C. Kelembagaan, D. Data, E. Aplikasi web, F. UI/UX, G. Eksekusi, H. Keputusan tambahan (tanggal)`.
Lapangan: `A. Diputus pemilik` (tabel K1..K12 dengan kolom "Kata pemilik" berisi kutipan asli) dan
`B. Diputus perancang (sesi induk), boleh dibatalkan pemilik` (tabel D1..D7 dengan kolom Alasan).
Ruang Unit: `KEPUTUSAN-AWAL` = dasar & susunan unit, masalah yang dijawab, prinsip mengikat, mesin bersama, katalog sistem per unit dan fase, bentuk produk, pertanyaan U1–U12, nama baku teknis.

Format entri:
- Satu keputusan = satu butir BERNOMOR BERKELANJUTAN lintas bagian (Kampus 1–25, SIPPA 1–64, tidak mulai ulang per huruf).
  Judul tebal singkat, lalu kalimat. Tambahan sesudah rilis ditambah di akhir dengan tanggal, dan menyebut mana yang dikalahkannya.
- Format Lapangan: `| K4 | Absen mencocokkan wajah; ... | *"kutipan pemilik"* |`.
- Pertanyaan terbuka: tabel `Kode | Pertanyaan | Bawaan sementara | Dampak bila berubah` (Kampus T-A..T-G); Ruang Unit `No | Pertanyaan | Bawaan bila tidak dijawab` (U1–U12). Kunci pola: SETIAP pertanyaan punya bawaan, jadi kerja tidak terhenti.

Contoh nyata (Kampus):
> `25. **Vonis model gagal uji TIDAK memunculkan masalah (2 Nov 2026).** Model platform yang gagal uji balik tidak lagi menjadi pembentuk masalah otomatis ... Menang atas kalimat "model yang gagal uji" di butir 2 bila dibaca sebagai sumber masalah otomatis.`

Contoh (Kampus, pertanyaan): `| T-C | Boleh pakai LLM untuk meringkas solusi dari paper? | Tidak. Fase 1 ekstraktif (kalimat asli abstrak + tautan) | Tiket ALG-6 berganti |`

Contoh (Lapangan): `| K3 | Foto absen dan logbook memuat tanda waktu dan geotag | *"Ada fotonya juga ada time tag dan geotag"* |`

### 2.2 RISET (Lapangan, Ruang Unit)

Lapangan `RISET.md` = indeks + `## 1. Biasanya gimana (jawaban singkat)` (6 butir) + `## 2. Yang ditiru dan dari mana`;
rincian di `riset/R1-GITHUB-<tema>.md`, `R2-PRAKTIK-LAZIM.md`, `R3-KODE-REPO.md` (kode repo yang dipakai ulang, dengan `berkas:baris`).
Ruang Unit `RISET.md` = tabel berkas riset per unit + `## Cara riset dikerjakan` (4 langkah: baca teks aturan dari korpus lokal bukan ingatan; cari juklak dan cek status berlaku; cari sistem resmi di web, yang tak bisa diverifikasi URL tidak ditulis fakta; cek kode repo supaya tidak mengulang) + `## Batas riset` (apa yang tidak dilakukan, mis. tidak mewawancarai pegawai). Isi tiap `riset/N-*.md`: tugas fungsi unit dikutip dengan nomor pasal, kerja nyata, sistem resmi yang ada, bukti per usulan, bagian "Sumber yang tidak bisa diakses".

### 2.3 PRD

Kepala: `# PRD: <Modul> (<rute>)`, kalimat posisi dalam otoritas (kalah dari / menang atas), versi + tanggal, paragraf "Konvensi berkas ini" (skema kode fitur, kode ukuran U1.., kode pertanyaan).

Kerangka Kampus: `## 1. Ringkasan` (`### 1.1 Masalah`, `1.2 Tujuan`, `1.3 Ukuran keberhasilan`, `1.4 Non-tujuan`, `1.5 Larangan`) /
`## 2. Pengguna dan peran` / `## 3. Peta layar` / `## 4. Fondasi` / `## 5. P1 ...` / `## 6. P2 ...` / `## 7. P3 ...` / `## 8. P4 ...` (bagian per pilar berisi fitur).
SIPPA (lebih besar): `1 Ringkasan, tujuan, ukuran, non-tujuan, larangan / 2 Keputusan terkunci dan pertanyaan terbuka / 3 Pengguna, peran, RACI / 4 Lini masa dan gerbang / 5 Lingkup operasional / 6 Lingkup teknis / 7 Data / 8 Buku dan deck / 9 Aplikasi web (9.1 arsitektur informasi, peta layar...) / 10 Rencana kerja / 11 Anggaran, risiko, asumsi, glosarium / 12 Keterlacakan`. Ada `Daftar isi` tertulis di kepala.
Lapangan (minimum): tujuan + ukuran, `## 3. Peran` (tabel Peran/Siapa/Akses), `## 4. Fitur` (tabel `Kode | Fitur | Tahap`).

Format entri:
- Ukuran keberhasilan: tabel `Kode | Ukuran | Sasaran | Sumber hitung`. Contoh: `| U1 | Kab/kota dengan profil daerah siap cetak | 514 (semua kode IRBI) | pipeline profil_daerah.py |`.
- Peran: tabel `Peran | Kode hak | Masuk lewat | Boleh` dengan kode 2 huruf (ST, PM, SA, BP, KK, AG, PL, PB).
- Fitur (Kampus): `### F-<pilar><n> <Nama>` lalu butir tebal: `**Tujuan:**`, `**Isi:**` / `**Form:**`, `**Tata letak:**`, `**Aturan:**` (+ `**Pemicu**`, `**Status:**` bila perlu). Contoh:

```
### F-M3 Masalah otomatis (kategori dari data)
- **Tujuan:** tiap daerah mendapat daftar masalah kandidat dari data sebelum pendataan.
- **Isi:** kategori = bahaya x aspek (ALG §2); tiap masalah berisi judul baku, bukti angka ..., pil "Otomatis, belum divalidasi".
- **Aturan:** dihasilkan pipeline; tidak tersimpan di D1 sampai diambil ...
```
- Layar SIPPA: tabel `Rute | Layar | Pertanyaan yang dijawab | Peran yang membuka | Perangkat utama | Fitur keputusan 33`. Kolom "pertanyaan yang dijawab" memaksa tiap layar punya alasan.
- Keputusan terkunci dieksekusi di mana: tabel `No | Keputusan | Bagian PRD`; bagian terakhir PRD (SIPPA §12) = keterlacakan keputusan ke bagian.
- Lapangan: satu baris fitur `| F-05 | Pendaftaran wajah lima arah ... | B |`; tahap A/B/C (30/60/90 hari).

### 2.4 ALUR

Kepala: `# ALUR: <Modul>`, posisi otoritas, **notasi**: `[peran]` pelaku, `→` langkah, `⟂` titik tolak (validasi gagal, pesan baku), `◆` jejak tercatat; status ditulis `monospace`; aturan global ("tiap tulis D1 sekaligus menulis baris jejak km_jejak (siapa, kapan, dari, ke)", "semua kiriman ke luar = tombol yang ditekan manusia").
Kerangka: `## 1. Fondasi` (`### 1.1 Kampus bergabung` ...), satu bagian per pilar, `## 6. Lintas` (dasbor, dummy). Lapangan: `## A1..A8` alur bernomor per peran.
Entri = daftar langkah bernomor, tiap langkah `[peran] aksi → hasil sistem. ⟂ kondisi tolak → "pesan baku". ◆`. Contoh:
> `1. [PB] /kemitraan/daftar pilih "Kampus" → isi form + unggah surat tugas. ⟂ nama kampus sudah ada berstatus aktif → "Kampus sudah terdaftar. Hubungi koordinatornya."`

### 2.5 ALGORITMA

Kepala: semua rumus = fungsi murni dengan kasus acuan di `tests/<modul>/fixtures/acuan.json`; Python (pipeline) dan JS (layar) harus sama (selisih <= 1e-9); bobot/ambang = "asumsi-kebijakan" dalam konstanta bernama di SATU tempat (`konst.py` = `konst.js`, dijaga uji); prinsip (tanpa ML hitam, tanpa LLM, stdlib saja, bisa dijelaskan per angka).
Kerangka Kampus: `1 Kunci wilayah / 2 Taksonomi (nilai tetap) / 3 Masalah otomatis dan prioritas (bahan, skor, aturan pembentuk, penggabungan) / 4 Pencocokan pakar (korpus, kueri, BM25, komponen, skor akhir, tempat hitung) / 5 Solusi ekstraktif / 6 Generator pertanyaan / 7-10 skor-skor lain / 11 Uji kejujuran algoritma`.
Entri: sub-bagian berisi rumus, tabel bobot, kasus tepi, label keyakinan. Lapangan: `§1-§2 sudut wajah, §3-§5 ambang dan putus status`; `putusStatus` hanya menghasilkan `diterima/tinjau`, tidak pernah `tolak` otomatis (keputusan D3).

### 2.6 DESIGN-SYSTEM

Kerangka Kampus: `1 Cara memuat` (urutan `<link>`/`<script>` persis, tanpa inline karena CSP) / `2 Token` / `3 Anatomi halaman` (pohon id/kelas) / `4 Komponen pakai ulang` / `5 Komponen baru (prefiks .km-, maks 400 baris)` (`### 5.1 Kartu daerah .km-daerah` ... tiap komponen: markup, keadaan) / `6 Ikon baru (path SVG)` / `7 Kalimat antarmuka` / `8 Lakukan dan jangan`.
SIPPA: `1 Prinsip dan sumber token` (tabel "elemen | sumber berkas:baris | dipakai di") / `2 Token` / `3 Komponen web` / `4 Wireframe tiap layar (PRD §9.1.1)` / `5 Visual buku dan deck` / `6 Aturan copy` / `7 Checklist untuk pengulas` / `8 Butir desain dengan bawaan tertulis`.
Pola kunci: satu aturan induk di kepala ("Satu aturan induk: tiru /akademisi"; Lapangan: "tidak membuat palet sendiri"); tiap keadaan layar wajib (memuat, kosong, galat, luring); bagian "Kalimat antarmuka" menetapkan label tetap. Contoh isi:
> `Label tetap: "Belum diuji", "Otomatis, belum divalidasi", "Tidak ada data untuk wilayah ini". Angka: toLocaleString("id-ID"); ... Tombol kata kerja: Setujui, Tolak, Ambil, Validasi, ...`
Lapangan: `§1 Fondasi (wajib)` butir kepala situs/token/format angka/target sentuh >= 48 px/ikon garis/keadaan layar/tombol dummy/INP; `§2 Layar petugas` tabel `Layar | Isi | Komponen` (L1..L5).

### 2.7 DESAIN-TEKNIS

Kepala: "DT menjawab 'bagaimana persisnya'; TIKET menjawab 'siapa dan kapan'. Penyimpangan dari PRD dicatat sebagai ADR (§9)"; "Rujukan kode diperiksa pada main <tanggal> (commit)".
Kerangka Kampus: `1 Arsitektur` (diagram ASCII 3 kolom: Pipeline / Worker / Layar) / `2 Berkas` (`2.1 Baru`, `2.2 Berubah`, `2.3 Agent baru`) / `3 Model data D1` (gaya diikuti + singkatan CHECK; `3.1 Migrasi 0080_km_dasar.sql` dst., SQL penuh) / `4 Kontrak API` (`4.1 Aturan bersama`, `4.2 Halaman`, `4.3 API`) / `5 Fungsi murni dan perhitungan` / `6 Alur teknis penting` / `7 Pipeline` (workflow, jadwal) / `8 Keamanan, performa, dummy` / `9 ADR` (/ `10 pemetaan kolom` di versi akhir).
SIPPA menambah observabilitas dan deploy di §8 dan pertanyaan terbuka di §9.
Format ADR (satu per butir, `### ADR-NN <judul> (DITERIMA | DIUSULKAN | PERLU PEMILIK †)`): `Konteks`, `Opsi`, `Keputusan`, `Konsekuensi`. Contoh:
> `### ADR-01 Kunci kab = kode IRBI 4 digit (DITERIMA)` / Konteks: empat skema kode di repo. Opsi: BPS, Kemendagri, IRBI. Keputusan: IRBI, karena ... Konsekuensi: tabel lama ber-nama di-join lewat kode.json.
Format rute (tabel): `Metode dan jalur | Hak | Perilaku`; lambang hak didefinisikan di awal (T tamu, B baca, W tulis, SA super admin). Format SQL: `CHECK` lengkap, kolom `dummy`, idempoten `CREATE ... IF NOT EXISTS`, `ON CONFLICT DO NOTHING`.

### 2.8 KEAMANAN-PRIVASI

Kerangka Kampus: `1 Matriks hak (baca B, tulis T, — tidak)` (baris = jenis data, kolom = peran PB AG BP PL KK ST PM SA) / `2 Data pribadi (UU 27/2022 PDP)` / `3 Autentikasi` / `4 Masukan dan berkas` / `5 Penyalahgunaan` / `6 Header dan CSP`. Kalimat penutup matriks: "Tiap baris = satu uji 'peran salah DITOLAK' di RU §2.4". Kepala menyebut pengulas wajib (`security-reviewer`, `guard-api`). Lapangan: kalimat tak boleh dilanggar "vektor wajah tidak pernah keluar dari Worker".
Contoh baris: `| Buku profil (bab 8 pakar) | — | — | B kabnya | — | B | B | B | B |`.

### 2.9 RENCANA-UJI

Kerangka Kampus: `0 Aturan dasar` / `1 Lapisan` (tabel `Logika | Uji | Perintah`) / `2 Kriteria terima` (`2.1 Kasus acuan`, `2.2 Profil daerah (pipeline)`, `2.3 Per layar (1440 dan 390)`, `2.4 Matriks rute`, `2.5 Alur lintas-tabel`, `2.6-2.8 INP, a11y, larangan teks`, `2.9 Uji relevansi`) / `3 D1 (tiap CHECK dan trigger)` / `4 Pipeline` / `5 Pengulas dan deploy`. SIPPA menambah `5 Buku dan deck`, `6 Data pilot`, `7 Registri cakupan dan gerbang mekanis`, `9 Butir yang dulu terbuka`.
Aturan dasar yang diulang: Selesai = semua perintah bukti hijau + pengulas tanpa temuan tinggi; logika di D1 diuji SQL langsung lewat Miniflare, rute lewat handler worker utuh, alur lintas-tabel satu uji ujung ke ujung; "unit test bermock bukan bukti" (rujuk `~/.claude/TEST.md`); **uji yang salah DITOLAK wajib ada** untuk tiap CHECK, trigger, gerbang hak; pesan gagal menyebut angka dan sebab.
Format entri: tabel `No | Fungsi/Diberikan | Kasus/Ketika | Hasil/Maka | Bukti`. Contoh: `| A3 | skor_auto | 3 komponen saja | null (< 4) |`; `| D5 | public/data/kemitraan/** | pindai | tidak ada email, nomor 62..., id A[0-9]{6,} | gerbang-kemitraan.test.mjs |`. Lapangan: `| U-06 | Foto dengan sha256 sama ditolak; foto bukan JPEG ditolak ... | tests/warga/lapangan.test.mjs |`. SIPPA memakai kode kasus per layar (H1..H8 hitung, P1..P7 peta, F1..F8 form, G1..G6 log) dan memuat nilai harapan dihitung tangan.

### 2.10 TIKET

Kepala: `# TIKET <Modul>`, rantai otoritas, singkatan, kotak "Untuk pekerja agen" (satu sesi = satu tiket; baca tiketmu + bagian "Rujukan" SAJA; kerjakan hanya "Berkas"; tak tertulis = berhenti dan tanya; subagent jangan commit/push/deploy).
Kerangka Kampus: `## 0. Batasan global (salin persis)` (tabel `Batasan | Nilai`: kunci wilayah, rentang migrasi, kode pribadi, batas ukuran JSON, CPU worker, cron, gaya, kiriman keluar, lokasi konstanta) / `## 1. Aturan semua tiket` (10 butir: model, isolasi worktree, selesai = bukti hijau + pengulas, uji yang salah ditolak, registri cakupan, tak menyunting migrasi lama/dokumen KP, teks antarmuka, ukuran S/M/L, tag `[induk]`, tag `[manusia]`) / `## 2. Indeks dan papan status` / `## 3. Tiket` (`### 3.A Fondasi teknis` ... `3.H Lintas, uji, rilis`) / `## 4. Grafik dependensi` (ASCII, jalur kritis `══>`) / `## 5. Jalur kerja` / `## 6. Penghambat dari pemilik`.
SIPPA menambah `1.1 Prosedur eksekusi standar` (pola subagent-driven: ringkasan tiket ke berkas, buku besar progres, putaran perbaikan maks 5, baris `Ruling:`), `5 Gelombang paralel dan rencana sprint`, `6 Jalur kritis`, `8 Tiket commit dan deploy`, `9 Pemeriksaan kelengkapan`, `11 Program <tanggal>`.

Papan status (tabel): `ID | Judul | Pengerja | Jalur (Kampus) atau Gel. (SIPPA) | Ukuran | Status` (Ruang Unit menambah kolom Pemeriksa); status `belum, jalan, tinjau, selesai, tertahan (<penghambat>)`. Lapangan memakai satu tabel per tahap: `Tiket | Isi | Berkas | Rujukan | Bukti | Ukuran`.

Format satu tiket (Kampus, kanonik: judul `#### <ID> <judul>`; tag `[induk]`/`[manusia]` di judul):
```
#### KM-B03 Masalah otomatis `masalah.py`
- **Tujuan:** isi blok `masalah` tiap kab: komponen ALG §3.1 (persentil nasional), skor_auto, kelas, aturan ALG §3.3, bukti angka asli.
- **Berkas:** `scripts/kemitraan/masalah.py` (dipanggil profil_daerah.py), `tests/kemitraan/fixtures/acuan.json` (lengkapi A1–A4).
- **Antarmuka:** auto_id = "auto-<kab4>-<bahaya>-<aspek>"; judul tanpa angka; komponen_n.
- **Pengerja / pemeriksa:** `kampus` / `validasi-model`.
- **Model:** sonnet. **Dependensi:** B02, A02. **Paralel dengan:** B04. **Isolasi:** worktree ya.
- **Selesai bila:** kasus acuan hijau; < 4 komponen → tanpa masalah; tiap masalah >= 2 bukti bersumber.
- **Bukti:** `python3 -I scripts/kemitraan/masalah.py --cek`.
- **Rujukan:** ALG §3; PD §1. **Ukuran:** M
```
Medan lain yang muncul: `**Di luar:**` (apa yang TIDAK disentuh), `**Pemilik:**` (tiket manusia), `**Langkah:**` dengan kotak centang `- [ ]` (Ruang Unit, SIPPA). SIPPA menyebut daftar medan di kepala bagian 3: Tujuan; Berkas; Di luar; Pengerja/pemeriksa; Model; Dependensi; Paralel dengan; Isolasi; Selesai bila; Bukti; Rujukan; Ukuran. Estimasi = Ukuran S (< 1/2 hari), M (~1 hari), L (> 1 hari, pecah bila bisa); tidak ada estimasi jam.
Tiket penutup selalu: uji ujung ke ujung, uji layar (1440/390), penyelarasan konteks bersih (`H06`), commit/migrasi produksi/terbit `[induk]` (`H07`). Tiket awal selalu `A01 [induk]` = daftarkan agent pengerja di roster + tambah §2.x di AGENTS.md.

### 2.11 GLOSARIUM

Kerangka Kampus: `1 Istilah baku` (tabel `Istilah | Arti di modul ini`) / `2 Peta 19 program Grand Design -> fitur` / `3 Peta 14 indikator (slide 28) -> kueri`. Kepala: "Lampiran rujukan; tidak menetapkan apa pun (kalah dari semua dokumen lain)". Contoh: `| Kampus mitra | institusi berstatus aktif di km_kampus |`.

### 2.12 KERANGKA-BUKU (khusus SIPPA, modul yang menghasilkan buku/deck)

Kerangka: `0 Keputusan yang mengikat kerangka` / `1 Identitas buku` / `2 Prinsip isi` / `3 Bagian depan` (sampul, kolofon, kata pengantar, ringkasan eksekutif dua lapis) / `4 Bab demi bab` / `5 Lampiran` / `6 Register rekomendasi` / `7 Foto, peta, grafik, gambar teknik` / `8 Perubahan mesin yang diperlukan` / `9 Urutan produksi dan gerbang QA` / `10 Butir terbuka` / `11 Deck paparan`.
Pola tiap bab: judul baku; subbab; pertanyaan kunci (jadi front matter); angka wajib (kunci registri, nilai acuan, berkas sumber, keyakinan); objek bernomor; rekomendasi yang lahir di bab; alokasi halaman; berkas bukti; dibuka `::: ringkasan-bab` (Temuan, Angka kunci, Rekomendasi) dan ditutup "Implikasi bagi keputusan". Tidak ada padanan di Kampus/Lapangan (tanpa buku), kecuali `PROFIL-DAERAH §3 Buku: susunan bab`.

---

## 3. Konvensi

Penomoran ID:
- Keputusan: bernomor lintas bagian (SIPPA 1–64, Kampus 1–25, Lapangan K1–K12 pemilik + D1–D7 perancang). Pertanyaan: `T-A..T-K` (SIPPA, Kampus), `U1..U12` (Ruang Unit; U7/U8 Lapangan merujuk "KP U7"). Ukuran keberhasilan `U1..` di PRD (kode sama bentuknya dengan pertanyaan Ruang Unit; di Ruang Unit U = pertanyaan pemilik di KEPUTUSAN-AWAL, bukan ukuran).
- Fitur: `F-<pilar><n>` (Kampus F-D1, F-M1..M7, F-R1..R7, F-S1..S5, F-T1.., F-X1..X3), `F-01..` datar (Lapangan).
- Tiket: SIPPA `SP-001..SP-141+` (urut angka, dikelompokkan `3.A Fondasi`...); Kampus `KM-<huruf pilar><nn>` (A fondasi teknis, B profil daerah, C masalah/pakar, D pintu kampus, E riset dan dana, F satgas, G talenta, H lintas/uji/rilis); Lapangan `LP-001..` (tahap A/B/C); Ruang Unit `RU-000..` (RU-000 = kontrak dan putusan sesi induk). Awalan 2–3 huruf = singkatan modul; huruf kelompok HANYA di Kampus.
- Kriteria uji: `A1..A13` (kasus acuan fungsi), `D1..D7` (pipeline), `L1..L9` (layar), `E1..E9` (alur ujung ke ujung), `U-01..U-nn` (Lapangan), `H1..H8`, `P1..P7`, dll. (SIPPA). Migrasi: rentang nomor ditulis di TIKET §0 (Kampus 0080–0084, Lapangan 0095–0098/0101, SIPPA 0056–0059) dan dinomori ulang bila bentrok dengan sesi lain (dicatat di dokumen).
- ADR `ADR-01..`. Agen: nama pendek modul (`sippa`, `kampus`, `lapangan`, `ruang-bnpb`).

Fase: SIPPA memakai gerbang G0–G5 (lokasi, air, bench, waktu gelar, efikasi, skala) di PRD §4 dan rilis R1–R4. Ruang Unit memakai fase **F0** (perbaikan, 5–15 Nov), **F1** (mesin bersama MB-1..MB-8 + 15 sistem pertama), **F2** (31 sistem), **F3** (20 sistem, belum dijadwalkan) + kelas **T** (4, tertahan); F2* = ukuran L yang tetap di F2 karena tenggat. Lapangan memakai Tahap A/B/C (30/60/90 hari). Kampus memakai pilar P1..P4 + fondasi; urutan nilai: "P dan W sampai C08 + L sampai C11 menghasilkan Belanja Masalah lengkap yang bisa didemokan; jalur D–G menyusul".

Pertanyaan pemilik: SELALU berpasangan dengan bawaan; kerja jalan memakai bawaan sampai dijawab. Pertanyaan yang menghambat (butuh orang atau data) dipisah di TIKET `§6/§7 Penghambat` (Kampus P1 = dua staf penilai relevansi).

Aturan "tidak ada di dokumen = tidak dibuat": tertulis di AGENTS.md §2.1 ("Fitur, layar, atau bab yang tidak ada di dokumen itu tidak dibuat. Bila dokumen bertentangan atau kurang, berhenti dan tanya pemilik; jangan mengarang arah") dan diulang di kepala tiap dokumen, di kotak "Untuk pekerja agen" TIKET, dan di PRD `1.5 Larangan` / `1.4 Non-tujuan`. Tiap PRD punya Non-tujuan eksplisit (Kampus: alur paraf MoU, LMS, forum, kiriman otomatis, native app, penilaian dosen, perintah ke TNI/Polri).

Larangan khas yang diulang: tidak ada angka tanpa sumber+tanggal; label keyakinan (`resmi`, `terverifikasi`, `estimasi-model`, `asumsi-kebijakan`, `menunggu`, `hipotesis`); indeks buatan sendiri berpil "Belum diuji"; data pribadi tidak masuk `public/` atau git; tidak ada kiriman otomatis ke luar (wa.me/mailto/salin); tidak membuat tabel kembar; tombol dummy untuk Super Admin; hemat kuota D1 (hitung berat ke pipeline, hasil ke R2/JSON); tanpa cron baru (batas 5 jadwal akun Free); tanpa CDN (CSP).

Gaya bahasa dokumen: Bahasa Indonesia lugas; sapaan "kamu" untuk antarmuka; TANPA titik tengah `·` (aturan pemilik, gerbang `gerbang-titik-tengah`; pakai koma, kalimat, label, atau baris baru; "<angka kunci> dulu"); tanpa em dash (gunakan tanda baca biasa, en dash hanya rentang); tanpa "terbukti" untuk yang belum diuji; "titik panas" untuk data satelit; judul tanpa angka; tanpa kata puitis/AI-slop; tanpa nama "Pantau Bencana" di UI (pakai Centurisk97); gelar pejabat penuh.
Tabel vs paragraf: tabel untuk apa pun yang berstruktur (keputusan Lapangan, pertanyaan, ukuran, peran, hak, rute, indeks tiket, kriteria uji, istilah); paragraf pendek hanya untuk kepala/konteks; butir tebal `**Tujuan:**` untuk fitur dan tiket; kode/jalur berkas selalu dalam backtick; rujukan silang `<singkatan> §x.y`; blok kode untuk SQL, JSON skema, diagram ASCII dependensi, pohon DOM. Dokumen kecil (Lapangan) memadatkan seluruh PRD ke tabel.

---

## 4. Subfolder SIPPA dan gunanya

| Subfolder | Isi | Fungsi |
| --- | --- | --- |
| `data/` | `README.md` + 17 CSV turunan (OSM jarak, DEM, GSW, area terbakar, CHIRPS, WorldCover, kompleks, matriks gudang) | Paket data publik hasil tarikan (24–25 Okt), dibangun `bangun/pipa_data.py`. `README.md` = tabel `Berkas | Sumber | Isi | Lisensi | Keterbatasan`, tanggal tarik, status langkah, apa yang sengaja tidak ditarik dan sebabnya (GloFAS butuh akun). Rujukan angka buku dan fixture uji. |
| `formulir/` | `G3-lite.pdf`, `probe.pdf` | Formulir kertas cadangan lapangan (waktu gelar, probe suhu); tiket SP-009. Padanan kertas dari form luring web. |
| `onepager/` | `pilot-kalteng.html/.pdf` | Ringkasan satu halaman untuk pimpinan/lapangan (rencana pilot). Dibuat dari data paket, cetak A4. |
| `sumber/` | `Karhutla_Decision_Dashboard.html` + `README.md` | Salinan APA ADANYA artefak pemilik yang dipertahankan (keputusan 34). README mencatat asal, tanggal salin, ukuran, sha256, dasar keputusan, "jangan disunting; perubahan hidup di berkas lain dengan tanda `SIPPA:`". |
| `baca-A/B/C.md` | ringkasan berkas sumber pemilik (docx/pdf) tanpa penilaian, per berkas `## A1..` dengan `### Struktur bab`, `### Klaim teknis berangka` (tag [OCR] untuk angka dari gambar) | Memisahkan MEMBACA dari MENILAI: bahan mentah ringkas yang dikritik di KRITIK-DAN-KEPUTUSAN (A/B ~335 klaim). |
Lapangan: `riset/R1-R3` + `KONTRAK-TAHAP-C.md` (satu sumber bentuk API/tabel untuk tiga pengerja backend, layar, dan gateway). Ruang Unit: `riset/1..6`. Kampus tidak punya subfolder; fixture ada di `tests/<modul>/fixtures/`.

---

## 5. PENYELARASAN dan KRITIK-DAN-KEPUTUSAN

**KRITIK-DAN-KEPUTUSAN (SIPPA, dokumen satu kali sebelum PRD).** Disusun dari `baca-*` + data repo + sumber resmi. Kerangka: kepala berisi definisi label keyakinan; `1 Ringkasan putusan` (putusan utama satu kalimat tebal: NO-GO untuk grand design sebagaimana ditulis, GO bersyarat untuk pilot; 3 temuan pembalik logika; `1.1 Putusan per komponen` tabel `Komponen | Putusan | Syarat terukur (gerbang) | Alasan`; `1.2 per skenario` dengan CAPEX; `1.3 Lima gerbang` G0..G4 tabel `Gerbang | Kapan | Lulus bila | Gagal berarti`) / `2 Kritik per klaim teknis` (K-01..K-nn) / `3 Strategi terpilih` / `4 Biaya total rinci` / `5 Integrasi dengan repo` / `6 Daftar yang harus dibuat bila GO` / `7 Yang belum diketahui dan risiko` / Lampiran angka repo dihitung ulang. Fungsi: mengubah dokumen mentah pemilik menjadi arah desain yang bisa dibangun, dan menjadi sumber gerbang PRD §4. Kalah dari KEPUTUSAN. Padanan di modul lain: `RISET` (Lapangan, Ruang Unit); Kampus tidak punya (arah datang dari paparan pemilik).

**PENYELARASAN (ditulis SESUDAH dokumen lengkap, oleh peninjau berkonteks bersih, AGENTS.md §3.2).** Dikerjakan tiket penutup (`KM-H06`: "subagent tanpa riwayat membandingkan kode dengan 10 dokumen; menulis PENYELARASAN.md; selesai bila tiap fitur PRD punya baris matriks, penyimpangan nol atau dicatat ADR"). Berkas ber-tanggal, bertambah per putaran (`## Penyelarasan 30 Okt 2026`, lalu `## Penyelarasan 26 Okt 2026: nomor migrasi` dst.). Kerangka SIPPA: tabel "Fakta yang diperiksa ke kode dan data | Cara periksa | Hasil" di kepala / `1 Daftar perubahan` per dokumen (`1.1 PRD.md` tabel `Bagian | Sebelum | Sesudah | Alasan (butir brief)`) / `2 Matriks cakupan` (`Fitur | PRD | DESIGN-SYSTEM | DESAIN-TEKNIS | RENCANA-UJI | TIKET`, sel berisi nomor bagian/tiket) / `3 Pertanyaan pemilik yang tersisa` (`Kode | Pertanyaan | Bawaan | Mendesak`) / `4 Penyimpangan dari brief, dengan bukti` / `5 Tindak lanjut di luar dokumen (untuk sesi induk)`. Kerangka Kampus (ringkas): `Fakta yang dicek dan BENAR` (daftar `fungsi (berkas:baris)`) / `Temuan dan penyelesaian` tabel `# | Tingkat (tinggi/sedang) | Temuan | Penyelesaian` / `Pemetaan bencana ke registri` / `Pertanyaan pemilik tersisa` / `Tindak lanjut`. Contoh baris: `| 3 | tinggi | trigger peran staf menolak kemitraan | migrasi 0085 DROP/CREATE trigger (A09) |`. Hasil nyata: temuan tinggi tipe "jalur tiket bertabrakan berkas" mengganti gelombang dengan **jalur satu-pekerja** (TIKET §5), `pengingat.jenis` ber-CHECK melahirkan ADR-06. Aturan: KEPUTUSAN tidak pernah disentuh penyelaras; setiap perubahan dicatat sebelum-sesudah-alasan.

---

## 6. Keterikatan ke AGENTS.md, roster, dan gerbang

AGENTS.md repo:
- **§2 Peta modul**: satu baris per modul, kolom `Modul | Berkas | Keluaran / jadwal | Pengerja`. Baris menyebut glob berkas yang dimiliki dan agent pengerja (`sippa`, `kampus`, `lapangan`, `ruang-bnpb`).
- **§2.1–§2.4**: bagian berjudul `### 2.x <Modul> (<rute>): baca dulu, baru bangun`. Isi baku: kalimat "Sebelum menyentuh apa pun tentang X (daftar kata kunci lingkup), baca dokumen di `data/kajian-bnpb/<modul>/` dengan urutan otoritas ini:" + daftar bernomor 1..10 (`KEPUTUSAN` dulu ... `TIKET` terakhir, tiap butir 1 frasa fungsi) + kalimat aturan berhenti ("Aturan berhentinya sama dengan §2.1") + ketentuan khusus modul (SIPPA: "Fitur, layar, atau bab yang tidak ada di dokumen itu tidak dibuat"; Lapangan: "Vektor wajah tidak pernah keluar dari Worker"; Ruang Unit: "Data staf hanya di R2 unit/").
- **§0 Gerbang konteks** (sebelum tool apa pun): baris modul di peta, `ilmu.mjs pemilik <berkas>`, `ilmu.mjs baca <agent>`, lalu ucapkan kontrak CAKUPAN / DI LUAR / BUKTI SIAP; ini sama dengan kolom Berkas / Di luar / Bukti di tiket.
- **§1 Router** memetakan kerja ke pengerja pemilik + pemeriksa ("Layar `/pipa` -> `sippa` -> `inp-reviewer` + `selera-angka`"); **§1.3** model: tiket tulis dipegang `sonnet`, pemeriksa pola `haiku`, `opus` hanya sesi induk; **§1.5** otoritas membuat agent baru bila berkas tak punya pemilik dan kelas kerja berulang; **§3.2** pemeriksa wajib konteks bersih dan bukan pengerjanya; **§3.3** isolasi worktree untuk fan-out menulis, branch dihapus setelah merge; **§6** tabel permukaan berubah -> pengulas; **§9** batas mati (subagent tidak commit/push/deploy, gerbang tidak dilemahkan).

Roster dan ilmu:
- `scripts/agents/roster.json`: entri `{nama, kelas:"pengerja", model, ringkas, kapan (glob pemicu), fokus[] (butir pertama = "Baca dulu data/kajian-bnpb/<modul>/ urut otoritas AGENTS.md §2.x; ambil satu tiket TIKET.md, kerjakan hanya cakupannya"), larangan, bisa, tidak, milik[] (glob)}`. `npm run agents:build` membuat `.claude/agents/<nama>.md` dan `.claude/ilmu-agent/KATALOG.md`; generator menolak entri tanpa `model`. Tiket pertama modul (`A01`/`SP-003`/`LP-001`, tag `[induk]`) = mendaftarkan entri ini + §2.x di AGENTS.md; "Selesai bila" tiket itu memeriksa `ilmu.mjs pemilik <berkas>` menjawab agent baru.
- `.claude/ilmu-agent/<nama>.md` berisi ringkasan DS/ALG/PD, ranjau, Kasus; `jejak/<nama>.jsonl` mengunci vonis ke blob git berkas.

Gerbang yang mengikat paket dokumen dan tiket:
- `tests/agen/gerbang-paket-modul.test.mjs` (pemilik 1 Nov 2026): parser mengambil tiap `### 2.x ... baca dulu, baru bangun` dari AGENTS.md, lalu `data/kajian-bnpb/<modul>/` WAJIB berisi `KEPUTUSAN-*.md`, `PRD.md`, `DESAIN-TEKNIS.md`, `RENCANA-UJI.md`, `TIKET.md`. Paket bolong = merah. Hook `scripts/agents/pengingat-paket.mjs` (UserPromptSubmit) mengingatkan agent merekomendasikan paket dokumen bila prompt berbunyi "fitur/modul/sistem baru" atau "bikin/buat/bangun fitur...".
- `tests/agen/gerbang-ilmu-agent.test.mjs` (`npm run uji:agen`): katalog dan definisi segar, tiap agent punya ilmu terisi, tiap berkas kode tepat satu pemilik, jejak benar-benar melewati yang tak berubah dan memeriksa ulang yang berubah. `gerbang-model-agent.test.mjs`: tiap agent punya model; env `CLAUDE_CODE_SUBAGENT_MODEL` menurunkan agent bawaan ke Sonnet.
- Registri cakupan per modul `tests/<modul>/cakupan.json` + `gerbang-cakupan.test.mjs`: tiap ekspor fungsi, modul JS, rute `src/*.js`, dan skrip `.py` WAJIB terdaftar di `diuji` dengan nama uji; yang tak diuji harus dicatat alasannya. TIKET aturan 5: tiap fungsi/rute/tabel baru masuk registri; hanya jalur G (penulis-gerbang) yang menyunting registri, jalur lain menitipkan entri di laporan tiket.
- Gerbang teks modul `tests/<modul>/gerbang-<modul>.test.mjs` (pindai teks terlarang, aset, data pribadi di `public/`), skema D1 beku `tests/warga/migrasi_beku.json` (sha256 migrasi), paritas Py=JS (`paritas.test.mjs` atas `acuan.json`), `gerbang-titik-tengah`, `gerbang-kartu-std`, `gerbang-uji-sebelum-push` (`npm run uji:warga && npm run uji:agen && npm run uji:layar` hijau sebelum push).
- Tiket mengikat lewat tiga kolom yang bisa dijalankan: Berkas (satu-satunya yang boleh disentuh, pemilik berkas diperiksa `ilmu.mjs pemilik`), Bukti (perintah wajib keluar 0), Pengerja/pemeriksa (agent bernama di roster, pemeriksa tak pernah pengerja yang sama). SIPPA memakai `awk` mengekstrak satu tiket (`#### SP-NNN`) ke berkas ringkasan untuk dikirim ke subagent. Status di papan hanya diubah sesi induk saat commit; commit dengan path spesifik (`git commit -- <berkas>`).

---

## Templat turunan untuk proyek baru (hasil ekstraksi)

Folder `data/kajian-bnpb/<modul>/` berisi, dalam urutan tulis yang disarankan: (1) `KEPUTUSAN-<MODUL>.md` (A Arah, B..F per pilar, G rupa dan kerja, H pertanyaan terbuka dengan bawaan; butir bernomor); (2) `RISET.md` bila ada bahan GitHub/praktik lazim/kode repo; (3) `PRD.md` (ringkasan, U-ukuran, non-tujuan, larangan, peran, peta layar, fitur F-*); (4) `ALUR.md`; (5) `ALGORITMA.md` bila ada rumus; (6) `DESIGN-SYSTEM.md`; (7) `DESAIN-TEKNIS.md` (SQL, API, ADR); (8) `KEAMANAN-PRIVASI.md`; (9) `RENCANA-UJI.md`; (10) `TIKET.md` (batasan global, aturan, papan, tiket, jalur); (11) `GLOSARIUM.md`; (12) `PENYELARASAN.md` setelah kode ada. Lalu: entri roster + `.claude/ilmu-agent/<nama>.md`, baris peta modul dan §2.x "baca dulu, baru bangun" di AGENTS.md, `tests/<modul>/cakupan.json` + gerbang teks.
