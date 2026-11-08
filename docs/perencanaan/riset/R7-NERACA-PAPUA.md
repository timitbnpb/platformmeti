# Riset repo neraca-papua sebagai rujukan Platform Jaringan METI

Repo: `/Users/priyankaalfatehan28/Documents/GitHub/neraca-papua` (dibaca tanpa mengubah apa pun, tidak menjalankan build).
Remote: `origin git@github.com:pangantara/neraca-papua.git` (fetch dan push, organisasi pangantara).
Riwayat git: satu commit saja, `2287e2b Neraca Papua: portal, data bersumber, sistem desain, dan blueprint` (Senin 19 Okt 2026 17:53 WIB, author git `mbgbangkabelitung`). Working tree bersih. `.gitignore`: `.DS_Store`, `__pycache__/`, `.claude/`, `.taste-skill/`.
Ukuran: `situs/` 6,2 MB, `data/` 744 KB, tiga dokumen md di akar total ±64 KB.

Pembacaan jujur: ini prototipe statis satu malam-dua hari untuk seminar, bukan sistem. Tidak ada Worker, D1, R2, wrangler, package.json, CI, lisensi, atau i18n. Nilai terbesarnya untuk METI ada di tiga hal: (1) cara menulis blueprint dan prinsip data, (2) pola layar yang sudah jadi di `template.html` (graf jaringan, kuadran, peta d3, laci rincian, lencana bukti), (3) skema CSV dan aturan "baris tanpa sumber ditolak".

---

## 1. Apa itu neraca-papua

- Nama lengkap: **Neraca Papua**, "buku besar terbuka sumber daya Tanah Papua: apa yang ada di perut buminya, siapa yang menggalinya, ke mana hasilnya pergi, dan berapa yang kembali. Tiap angka bertaut ke dokumen sumbernya." (`README.md:3`).
- Dibuat untuk Seminar Nasional IA-ITB Papua-Papua Barat, Rabu 21 Okt 2026 (JS Luwansa). Pembaca sasaran: tiga menteri (Bahlil/ESDM, Yassierli/Kemnaker, Brian/Diktisaintek-Badan Industri Mineral), tiap menteri punya satu pertanyaan dan satu halaman andalan (`blueprint-lengkap` §0).
- Cakupan: 6 provinsi, 42 kabupaten/kota Tanah Papua (batas geoBoundaries 2020 dipetakan ke 6 provinsi 2022).
- Isi nyata di repo (bukan hanya rencana): portal 14 layar dalam satu HTML (`situs/neraca-papua.html`, 1,6 MB, hasil build), 12 CSV bersumber (±890 baris total), 29 fakta kunci, 4 rantai nilai, strategi/riset, titik panas VIIRS 7 hari, 4 katalog data kementerian, 17 ringkasan dokumen rujukan.
- Layar yang sudah ada (rute hash di `template.html:1349-1363`): Ringkasan, Insight, Strategi, Komoditas, Izin tambang, Blok migas, Hilirisasi, Satelit, Wilayah (kuadran), Manusia, Jaringan (graf), Peta (peta komando), Metode, Desain.
- Yang hanya ada di blueprint dan belum dibangun: rute `/komoditas/<slug>`, `/izin/<slug>`, Peta Aliran, Matriks Hilirisasi bergambar, tangki dari luar angkasa, laporan beku, `/berhenti`, `llms.txt`, `/en/`, `/statistik`, API baca, Tanya Neraca, gerbang verifikasi, Postgres/Supabase.

---

## 2. Struktur blueprint dan bedanya dengan paket gaya SIPPA

### 2.1 Dua dokumen blueprint

**`blueprint-neraca-papua.md` (21,7 KB, bagian A-C)** adalah dokumen riset-lalu-rancang:
- A. Bedah 1001startup.id (1.108 halaman dibaca): tabel jenis halaman dengan jumlah (A1), 8 pola halaman yang layak ditiru (A2), prinsip data mereka (A3), fitur pertumbuhan dan bisnis termasuk login wall, "Ask 1001", `llms.txt`, bilingual (A4), tampilan (A5).
- B. Data Papua yang sudah terkumpul: tabel angka siap pakai dengan kolom Sumber dan Status `[V]`/`[CEK]` (B1), sumber data untuk mesin (B2), lubang data jadi "permintaan ke kementerian" (B3).
- C. Rancangan situs: 5 dataset (C1), halaman unggulan nomor 1-8 (C2), riset dan berita (C2b), halaman pendukung (C3), cakupan realistis 1,5 hari (C4), rambu (C5).

**`blueprint-lengkap-neraca-papua.md` (36,9 KB, v1, 19 Okt 2026)** adalah spesifikasi produk lengkap, 9 bab:
- §0 satu kalimat + tabel menteri x pertanyaan x halaman andalan.
- §1 Prinsip: 1.1 prinsip data (7 butir), 1.2 prinsip desain (5 butir).
- §2 Arsitektur informasi: 2.1 navigasi (diagram ASCII), 2.2 tabel semua rute (rute, halaman, pola).
- §3 Sistem desain: token warna, tipografi, grid/ruang/bentuk, gerak, tabel 25 komponen, keadaan layar (memuat/kosong/error/luring/data sebagian).
- §4 Spesifikasi halaman 4.1-4.12: tiap halaman ditulis sebagai daftar bernomor (hero, angka besar, tabel + chip filter, kartu, metode), dengan nama komponen dari §3.5.
- §5 Model data: tiga tabel `entitas`, `fakta`, `ikatan` (skema persis di `blueprint-lengkap` §5).
- §6 Teknis: tabel dua kolom "MVP 21 Okt" vs "Setelah pilot" (statis -> Next.js + Supabase).
- §7 Arsitektur sistem: diagram ASCII sumber -> penarik -> arsip mentah -> normalisasi -> gerbang verifikasi -> basis data -> mesin olah -> keluaran; 7.2 modul (penarik-*, mesin-*), 7.3 peran, 7.4 integrasi, 7.5 keandalan.
- §8 Rambu.

### 2.2 Cara menulis rencananya (pola yang khas)

1. Selalu mulai dari rujukan nyata yang dibedah halaman demi halaman, lalu pilih "pola yang diambil, bukan teks/logo/aset".
2. Tanda verifikasi di tiap angka: `[V]` sudah dari sumber primer, `[CEK]` wajib dicek sebelum tampil. Ini jadi aturan: `[CEK]` tidak tampil di depan pejabat (`blueprint-lengkap` §8).
3. Spesifikasi halaman ditulis sebagai daftar bernomor dengan nama komponen, lalu komponen didefinisikan sekali di tabel (§3.5): nama, isi, catatan.
4. Kelemahan data dibalik jadi bahan pitch ("lubang data = undangan", satu per K/L).
5. Cakupan dibagi dua kolom waktu (MVP vs setelah pilot) dan "kerjakan sedikit tapi benar".
6. Rambu pembingkaian ditulis eksplisit ("membantu negara melihat", kata "ilegal" hanya bila sumber resmi memakainya).

### 2.3 Bedanya dengan paket dokumen gaya SIPPA

Paket SIPPA (AGENTS.md poskokarhutla §2.1) adalah 7 dokumen berotoritas berurutan: `KEPUTUSAN` (menang atas semua) > `PRD` > `DESIGN-SYSTEM` > `DESAIN-TEKNIS` > `KERANGKA-BUKU` > `RENCANA-UJI` > `TIKET`, dengan aturan "fitur yang tidak ada di dokumen tidak dibuat; bila bertentangan berhenti dan tanya pemilik".

Neraca Papua tidak punya itu:

| Aspek | Paket SIPPA | Neraca Papua |
| --- | --- | --- |
| Jumlah dokumen | 7 + glosarium, terpisah per fungsi | 2 blueprint besar yang tumpang tindih + `DESIGN.md` + README |
| Keputusan pemilik bernomor | Ada (`KEPUTUSAN-*.md`, 1-53, tertinggi) | Tidak ada; keputusan tersebar di prosa |
| PRD (lingkup, larangan, fitur F-*) | Ada | Tidak ada; sebagian lewat "Rambu" §8 dan "Cakupan realistis" C4 |
| Kriteria terima dan perintah bukti | `RENCANA-UJI.md` | Tidak ada; hanya satu kalimat "tiap build menjalankan uji" (§7.5) |
| Tiket dan urutan kerja | `TIKET.md` (RU-*, KM-*, LP-*) | Tidak ada |
| Skema D1/rute/rumus per berkas | `DESAIN-TEKNIS.md` | Hanya tiga tabel logis (§5) dan tabel penarik (§7.2) tanpa nama berkas |
| Rencana peran agent/pemilik berkas | AGENTS.md + roster | Tidak ada |
| Titik kuat | Dapat diaudit dan dikerjakan agent | Narasi produk yang kaya, katalog komponen, spesifikasi halaman rinci |

Kesimpulan untuk METI: pakai kekuatan Neraca (rujukan dibedah, tabel komponen, spesifikasi halaman, prinsip data), tapi bungkus dengan struktur SIPPA (keputusan bernomor, PRD, rencana uji, tiket) supaya bisa dikerjakan agent tanpa menebak. Neraca juga memperlihatkan kelemahan tanpa itu: `DESIGN.md` dan `blueprint-lengkap` §3 saling bertentangan (lihat §3.4 di bawah) dan tidak ada yang memutuskan mana yang menang.

---

## 3. DESIGN.md: nilai persis, dan apakah meniru 1001startup.id

`DESIGN.md` (3,3 KB, judul "Neraca Papua · DESIGN.md (grand design)"). Sumber kebenaran token: `situs/neraca-papua-theme.css` (variabel shadcn/ui, kompatibel tweakcn), diulang utuh di `template.html:4-62`.

### 3.1 Rujukan (tabel di DESIGN.md)

| Rujukan | Diambil | Dibuang |
| --- | --- | --- |
| Oyenza (milik pemilik) | Putih + panel abu `#f5f5f7` tanpa garis, tombol pill hitam, judul halaman 34/700, angka besar dengan satuan kecil, ikon emoji dalam lingkaran, peta terbelah (panel kiri, peta kanan) | Maskot, ilustrasi musiman |
| Posko Karhutla (Insight) | Kartu insight: label topik, judul kalimat temuan dengan angka berwarna, small multiples, heatmap, catatan sumber di kaki | Navy penuh di bar atas |
| Dashboard admin (Studio Admin, CRM) | Sidebar berlabel dan berkelompok, pencarian, kartu KPI, daftar baris | Avatar dan data palsu |
| Bijak Memilih | Satu angka raksasa sebagai pernyataan pembuka (79%) | Gaya main-main |
| tweakcn / shadcn/ui | Struktur token | Warna preset |
| **1001startup.id** | **Hanya prinsip data**: bersumber atau ditarik, strip beralasan, tingkat bukti | **Huruf grotesk + label mono kapital, kartu bergaris tipis ("sudah dibuang")** |

Jawaban: **tidak meniru tampilan 1001startup.id di versi bangun**. Blueprint awal (A5) mendeskripsikan 1001 (Overused Grotesk + IBM Plex Mono kapital, banner gradasi, kartu bergaris) dan `blueprint-lengkap` §3 menyalinnya sebagai rencana (Geist + Geist Mono kapital, banner gradasi), tetapi DESIGN.md dan kode final membuangnya dan memakai gaya Apple/Oyenza. Yang ditiru dari 1001 hanyalah pola informasi (kartu dataset, kuadran, company web, lencana bukti, estimator berlabel). Untuk METI yang meminta tiruan gaya 1001startup.id, repo ini BUKAN rujukan visual yang benar; rujukan visualnya adalah `blueprint-neraca-papua.md` A5 (nilai di bawah).

### 3.2 Token (kutipan persis, mode terang)

```
--background:#ffffff; --foreground:#1d1d1f;
--card:#f5f5f7; --card-foreground:#1d1d1f;
--popover:#ffffff; --popover-foreground:#1d1d1f;
--primary:#1d1d1f; --primary-foreground:#ffffff;
--secondary:#ececf0; --secondary-foreground:#1d1d1f;
--muted:#f5f5f7; --muted-foreground:#6e6e73;
--accent:#f8e9e1; --accent-foreground:#a9471c;
--destructive:#b4291f; --destructive-foreground:#ffffff;
--border:#e3e3e8; --input:#ececf0; --ring:#a9471c;
--chart-1:#a9471c; --chart-2:#0b6c78; --chart-3:#3c7660; --chart-4:#a87a10; --chart-5:#d2461e;
--sidebar:#ffffff; --sidebar-foreground:#1d1d1f; --sidebar-primary:#1d1d1f; --sidebar-primary-foreground:#ffffff;
--sidebar-accent:#f5f5f7; --sidebar-accent-foreground:#1d1d1f; --sidebar-border:#e3e3e8; --sidebar-ring:#a9471c;
--font-sans:-apple-system,BlinkMacSystemFont,"SF Pro Text","SF Pro Display","Helvetica Neue","Segoe UI",Roboto,Arial,sans-serif;
--font-mono:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
--radius:1.375rem;
/* perluasan */
--success:#1e7a4c; --success-soft:#e2f2e8; --info:#255e9c; --info-soft:#e5eef8;
--warning:#8f6200; --warning-soft:#f8efd6; --danger-soft:#fbe6e3;
--sea:#dfe8ea; --land:#ffffff; --map-ink:#0b1e2a; --forest:#123a2d;
```

Mode gelap (`.dark` dan `[data-theme="dark"]`, `neraca-papua-theme.css`): `--background:#000000; --foreground:#f5f5f7; --card:#1c1c1e; --primary:#f5f5f7; --primary-foreground:#000000; --secondary:#2c2c2e; --muted-foreground:#a1a1a6; --accent:#3a2217; --accent-foreground:#e4804f; --destructive:#ff8a7d; --border:#2c2c2e; --ring:#e4804f; --chart-1:#e4804f; --chart-2:#4fb3bf; --chart-3:#6fb093; --chart-4:#dcb247; --chart-5:#ff7444; --success:#55c98d; --info:#7fb0e8; --warning:#e5b54d; --sea:#0f1a1e; --forest:#0f2e24`.

Alias dalam `template.html:35-45` yang dipakai CSS layar: `--paper`=background, `--surface`=card, `--sunk`=secondary, `--ink`=foreground, `--ink2`/`--ink3`=muted-foreground, `--line`=border, `--brand`=chart-1 (tembaga), `--side:256px`, `--gut:24px`, `--r`=radius, `--r-sm`=radius*0.6.

### 3.3 Huruf, ukuran, radius, ruang (DESIGN.md dan CSS)

- Huruf: tumpukan sistem Apple (SF Pro), cadangan Helvetica/Segoe/Roboto/Arial. Tidak memuat webfont apa pun (tidak ada `@font-face`, tidak ada Google Fonts). Komentar CSS di `template.html:~82` masih menulis "Plus Jakarta Sans" tetapi tidak dimuat; sisa dokumentasi usang.
- Skala (DESIGN.md): 34/700 judul halaman, 22/700 judul seksi, 19/600 kalimat temuan, 15/400 isi, 13 keterangan; angka `tabular-nums`. Kode nyata: body `400 14.5px/1.55`, `.h1` `clamp(22px,2.2vw,28px)/750`, `.h2` 20/700, `.h3` 16/700, `.lede` 14.5/1.6 maks 78ch, `.stat .v` 26/700, `.fact .v` 28/750.
- Radius: `--radius:1.375rem` (22px) untuk panel; 0,6x untuk kartu kecil/isian; pill 999px untuk tombol, chip, lencana. Di kode: `.card` memakai `var(--r)`, `.btn` radius 10px, `.chip` 999px, `.bdg` 6px.
- Ruang: kanvas 34/40px, celah 12/16/22/28px. "Panel dipisah dengan selisih nada, bukan garis; garis hanya di tabel dan daftar" (pada kode nyatanya `.card` tetap `border:1px solid var(--line)`, hanya `.panel` tanpa garis).
- Tema: ikuti `prefers-color-scheme`, tombol ganti tema menyetel `data-theme` di `<html>` (`template.html:1359`). Mode gelap setara.

### 3.4 Identitas dan pola halaman

- Tanda: kotak tembaga siluet puncak (Puncak Jaya/Grasberg) di atas garis neraca (SVG 34x34, `template.html:~167`).
- Tembaga (`--chart-1 #a9471c`) hanya untuk data mineral, sorotan angka, fokus. Aksi selalu hitam (`--primary`).
- Citra NASA asli (Blue Marble relief, Black Marble) sebagai dasar peta dan banner.
- Pola halaman (5): kepala (judul kata benda + satu kalimat abu + aksi pill), kalimat temuan 19/600 sebelum bukti, panel abu membulat, sumber di kaki (lencana bukti + tautan), peta dengan pengganti dasar Relief/Malam/Polos.
- Komponen yang tercantum: tombol (primary, secondary, outline, ghost, destructive), lencana (primary, secondary, outline, error + 4 tingkat bukti + 4 lokasi tahap), isian, sakelar, kotak centang, progres, penggeser, avatar inisial K/L, kartu radio, baris pengaturan, kartu insight, small multiples, heatmap, rantai tahap, peta komando. Semuanya ditampilkan hidup di layar `#desain` (`vDesain`, `template.html:1291`).

### 3.5 Pertentangan internal yang perlu dihindari di METI

`blueprint-lengkap` §3 (Geist/Geist Mono kapital, `--accent #B4532A`, bg gelap `#0E0F10`, kartu radius 12, banner gradasi) vs `DESIGN.md` + kode (SF Pro, `#a9471c`, gelap `#000000`, radius 22, tanpa banner mono). Kode mengikuti DESIGN.md. Pelajaran: satu dokumen desain harus punya "kalah/menang" tertulis.

### 3.6 Nilai gaya 1001startup.id (dari `blueprint-neraca-papua.md` A5, yang BUKAN diterapkan di Neraca)

Ini yang relevan jika METI memang ingin gaya 1001:
- Latar putih, teks hitam, garis `#E7E7E7`.
- Font Overused Grotesk (variabel 300-900) untuk teks; IBM Plex Mono kapital untuk label dan meta.
- Banner atas gradasi `#E8734B -> #F3C64B -> #7AB88A -> #4E7A96`; aksen oranye `#E8734B` (garis bawah nav aktif, kotak kecil di label).
- Kartu bergaris tipis tanpa bayangan, lebar konten 1180 px, angka besar, label mono kecil.
- Rambu repo: jangan memakai nama, teks, logo, font berlisensi, atau aset mereka; ambil pola informasinya saja.
- Versi Neraca yang direncanakan (belum dibangun, `blueprint-lengkap` §3): konten 1200 px, 12 kolom, gutter 24, margin mobile 16, skala ruang 4/8/12/16/24/32/48/72/96, display 64/68 700 `-0.035em`, H1 48/52, H2 32/38, H3 22/28, angka besar 40/44, isi 17/27, label mono 11/14 `letter-spacing:.06em`, radius 0 tabel/12 kartu/999 chip, gerak 300 ms `cubic-bezier(.2,.8,.2,1)` hanya untuk makna, `prefers-reduced-motion` mematikan gerak.

---

## 4. situs/: teknologi, berkas, fitur, deploy

### 4.1 Teknologi

- Vanilla JS satu berkas + d3 7.9.0 dan topojson 3.0.2 dari `cdnjs.cloudflare.com` (`template.html:540-541`). Tanpa framework, tanpa bundler, tanpa package.json.
- `template.html` (1.363 baris, 169 KB; baris-baris JS sangat panjang, beberapa lebih dari 1.000 karakter) adalah sumber; `neraca-papua.html` (1,6 MB) adalah hasil build yang menyisipkan seluruh data sebagai satu blob JSON (`const D = /*__DATA__*/null;` di `template.html:543`).
- Berkas template adalah fragmen: tidak ada `<!doctype>`, `<html lang>`, `<head>`; langsung `<title>`, `<style>`, `<div class="app">`. Tidak ada atribut `lang`.
- Pembangunan: `situs/build.py` (lihat §5.3), `situs/tarik_firms.py`.
- Berkas lain: `papua42.geojson` (945 KB) dan `papua42.topo.json` (32 KB) batas 42 kabupaten; `citra.json` (521 KB: dua citra NASA base64 `relief` 420 KB dan `malam` 114 KB, `bbox [129.0,-9.3,141.2,0.9]`, kredit NASA GIBS); `firms_7h.json` (2,9 MB, titik 7 hari); `fakta_kunci.json` (29 fakta); `rantai.json` (4 rantai); `strategi.json` (39 KB); `dokumen.json`.

### 4.2 Layar dan pola komponen (berkas:baris)

- Cangkang: grid `.app` = sidebar 256 px lengket + kanvas cair, `main` maks 1520 px, peta mode `wide`; sidebar berkelompok (Ikhtisar, Data, Wilayah & manusia) dengan ikon SVG garis 1,6 px, pencarian, kartu "Lubang data", footer seminar (`template.html:~100-175`, HTML di 168-215).
- Rute hash + render malas: `VIEWS` map, `done` Set, tiap view dirender sekali, `try/catch` menampilkan callout "Halaman ini gagal dimuat", `document.title` mengikuti item aktif, scroll ke atas, tutup laci (`template.html:1349-1363`).
- **Pencarian global**: `setupSearch()` (`template.html:754-769`) mengindeks izin, WK, tangki, simpul jaringan, 42 wilayah; substring, 14 hasil, klik membuka laci rincian.
- **Laci rincian** (`openDrawer`/`closeDrawer`/`kvList`/`drawerRow`, `template.html:573-588`): satu panel kanan untuk semua entitas; kolom bernama `sumber*` jadi tautan berdomain, `bukti*` jadi lencana, nilai kosong jadi strip beralasan; baris "Kutip sebagai: Neraca Papua (dibangun tanggal), ...".
- **Lencana bukti** (`bukti()`, `normBukti`, `ARTI_BUKTI`, `template.html:557-562`): TERKONFIRMASI/KATA_PERUSAHAAN/KATA_PEMERINTAH/KATA_LEMBAGA/CUPLIKAN/INFERENSI dengan tooltip arti; CSS `.b-*` di `template.html:~161-164`. Normalisasi legacy huruf A/B/C/D -> tingkat (`:557-560`).
- **Strip beralasan**: `dash(alasan)` menghasilkan "-" dengan `title` alasan; `val(v, alasan)` otomatis untuk nilai kosong (`template.html:565-566`). Tidak pernah menulis 0 untuk data hilang.
- **Kartu fakta** `factCard(id)` (`:615`): periode, angka + satuan, label, catatan, lencana + sumber.
- **Tabel** (`table.t`, `.tbl-wrap`) dengan chip filter, kolom angka rata kanan, baris klik; cakupan field `coverage(rows, fields)` (`:807`) = bar "n dari N" di bawah tabel dataset.
- **Peta dasar** `baseMap(el, opts)` (`:626-640`): SVG d3, `geoEquirectangular().fitExtent`, citra NASA sebagai `<image>` terpasang di bbox, 42 kabupaten (`.kab`) + 6 provinsi (`.prov`, `topojson.merge`), label provinsi, pengganti dasar Relief/Malam/Polos (`setRaster`, kelas `flat`). `addPoints()` titik klik->laci; `canvasDots()` canvas untuk ribuan titik (FIRMS), `ResizeObserver`.
- **Peta komando `vPeta`** (`:1041-1200`): lapisan menyala-mati (izin, WK, tangki, kampus, potensi daerah, proyek peta jalan, titik panas), titik tanpa koordinat ditaruh di centroid kabupaten dengan jitter spiral dan ditandai "perkiraan" (garis putus), `kabOf()` pencocok nama kabupaten.
- **Graf jaringan `vJaringan`** (`:1006-1039`): d3-force (link, charge -160, collide 14, forceX/Y), zoom 0,5-4x, drag simpul, ukuran simpul berdasar derajat, garis putus-putus untuk INFERENSI dan tebal 1,8 untuk TERKONFIRMASI, filter chip subjek (PTFI, Tangguh, ...) dan tingkat bukti, `prefers-reduced-motion` menghentikan simulasi dan menjalankan 300 tick sinkron; klik simpul -> `nodeDrawer` memuat semua sisinya dengan sumber.
- **Kuadran `vWilayah`** (`:920-969`): pilih X dan Y dari indikator (IPM, TPT, kemiskinan, porsi tambang PDRB, PDRB per kapita, ...), garis median `d3.median`, lajur putus-putus "tanpa" untuk wilayah tanpa angka, chip tingkat (42 kab/kota vs 6 provinsi), sorot provinsi, kartu samping dengan peringkat "#n dari N" dan periode+sumber per indikator, tabel semua indikator. Ini implementasi nyata pola `/bumn` 1001; catatan: belum ada skor 0-5 dan preset lensa seperti di blueprint, memakai nilai mentah.
- **Hilirisasi `vHilirisasi`** (`:861`), **Komoditas** (tahap Produksi/Cadangan/Sumber daya/Eksplorasi..., `TAHAP` di `:771`), **Izin** (`:811`), **Migas** (`:838`), **Satelit** (`:891`, FIRMS), **Manusia** (`:986`), **Metode** (`:1202`), **Strategi** (`:1228`, riset Danantara dan quick win), **Desain** (`:1291`, galeri token/komponen + tombol "Salin CSS tema" dan form permintaan data tiruan `reqForm` yang hanya menampilkan pesan).
- Warna komoditas: `komWarna()` (`:609`) memetakan regex nama ke `--cu`(tembaga), `--au`, `--ni`, `--gas`(laut), `--oil`, `--coal`, `--rock`. Warna jenis simpul graf `JCOL` (`:1000`).

### 4.3 i18n

Tidak ada. Semua teks Indonesia langsung di JS/HTML. Blueprint menulis rencana: ID utama di path dasar, EN di `/en/` (kebalikan 1001, alasannya pembaca utama pemerintah). Format angka/tanggal: `Intl.NumberFormat("id-ID")` (`nf`, `nf1`), `tgl()` ke "21 Okt 2026" dengan array `BULAN` (`template.html:546-551`), `toLocaleDateString("id-ID")`. Untuk METI dwibahasa perlu kamus nol-awal; tidak ada yang bisa disalin selain penggunaan `Intl`.

### 4.4 Deploy

Tidak ada konfigurasi deploy: tidak ada `wrangler.toml/jsonc`, `_headers`, workflow GitHub Actions, `package.json`, atau Cloudflare Pages/Workers. README hanya: `cd situs; python3 tarik_firms.py; python3 build.py`, lalu buka `situs/neraca-papua.html` di browser (file lokal). Blueprint §6 menyebut "pola Posko Karhutla (statis + JSON hasil pipeline)" dan rencana Next.js + Supabase setelah pilot; tidak ada rencana Cloudflare Worker/D1/R2. Artinya untuk METI yang akan memakai Worker + D1 + R2, repo ini tidak memberi contoh runtime apa pun; hanya UI statis.

---

## 5. data/: format, sumber, pipeline, skrip, lisensi

### 5.1 Berkas dan skema (header persis)

| Berkas | Baris | Kolom |
| --- | ---: | --- |
| `01_izin_minerba.csv` | 36 | `id,nama_pemegang,jenis_izin,komoditas,tahap,status,provinsi,kabupaten,luas_ha,lat,lon,tanggal_izin,tanggal_status,pemilik_induk,sumber_url,tanggal_akses,tingkat_bukti,catatan` |
| `02_wk_migas.csv` | 30 | `id,nama_wk,operator,mitra_dan_persen,jenis_kontrak,tanggal_tandatangan,tanggal_berakhir,status,provinsi,kabupaten,darat_laut,lat,lon,produksi_minyak_bopd,produksi_gas_mmscfd,tahun_produksi,fasilitas_utama,sumber_url,tanggal_akses,tingkat_bukti,catatan` |
| `02_kepemilikan_migas.csv` | 46 | `entitas,memiliki,persen,jenis_ikatan,sumber_url,tanggal_akses,tingkat_bukti` |
| `03_situs_tangki.csv` | 28 | `id,nama_situs,operator,jenis,provinsi,kabupaten,lat,lon,jumlah_tangki_osm,diameter_m_osm,kapasitas,satuan,atap,bisa_diukur_bayangan,sumber_url,tanggal_akses,tingkat_bukti,catatan` |
| `03_tangki_osm.csv` | 71 | `osm_id,situs_id,lat,lon,diameter_m,tags` |
| `04_jaringan_nodes.csv` | 122 | `id,nama,jenis,negara,catatan` |
| `04_jaringan_edges.csv` | 165 | `from,to,jenis_ikatan,persen_or_nilai,keterangan,sumber_url,tanggal_sumber,tingkat_bukti,subjek` |
| `05_wilayah.csv` | 49 | `kode_bps,nama,provinsi,tingkat,penduduk_jiwa,ipm,kemiskinan_pct,tpt_pct,pdrb_adhb_triliun,porsi_tambang_pdrb_pct,pdrb_adhb_per_kapita_juta,dbh_sda_minerba_miliar,dbh_sda_migas_miliar,dana_otsus,jumlah_izin_tambang` |
| `05_wilayah_long.csv` | 145 | `kode_bps,nama,provinsi,tingkat,indikator,nilai,satuan,periode,sumber_url,tanggal_akses,tingkat_bukti,catatan` (bentuk panjang, satu indikator satu baris, ini yang dipakai portal) |
| `05_sdm.csv` | 31 | `nama,jenis,provinsi,kabupaten,prodi_relevan,jumlah_mahasiswa_atau_peserta,periode,lulusan,akreditasi,mitra_industri,sumber_url,tanggal_akses,tingkat_bukti,catatan` |
| `05_tenaga_kerja.csv` | 23 | `perusahaan,indikator,nilai,periode,dasar_hitung,sumber_url,tingkat_bukti` |
| `06_komoditas.csv` | 143 | `id,komoditas,kelompok,provinsi,kabupaten,lokasi,lat,lon,tahap,kuantitas,satuan,kadar,tahun_estimasi,pemegang,status_mineral_kritis,sumber_url,tanggal_akses,tingkat_bukti,catatan` |

Konvensi: "-" (em dash) = tidak diketahui, alasannya di `catatan`; desimal koma Indonesia pada beberapa kolom string ("48,76%") sementara kolom `lat/lon/luas_ha` memakai titik; `sumber_url` boleh memuat beberapa URL dipisah ` | `; `tanggal_akses` 2026-10-19; `tingkat_bukti` bercampur antara skema baru (`terkonfirmasi/cuplikan/inferensi`) dan lama A/B/C/D (`C_osm_infe...`, `primer`), dinormalisasi di JS (`normBukti`). Tiap `.md` pendamping (`01_...06_`, `katalog_A-D`, `03_vendor_citra`) memuat metode, tabel ringkas, dan peringatan jujur per dataset.

### 5.2 Sumber

Lihat tabel B2 `blueprint-neraca-papua.md`: NASA FIRMS, World Bank GGFR, GFW, Maus dkk., Geoportal ESDM/MOMI (ArcGIS REST `Join_WIUP_vs_IPPKH`, `Wilayah_Kerja_Migas_Konvensional`), Portal Data Ekstraktif ESDM, BPS WebAPI, SEC EDGAR (10-K FCX), DJPK, PDDikti (API internal situsnya), Neraca Sumber Daya dan Cadangan Mineral dan Batubara 2025 (Badan Geologi), siaran pers K/L dan berita. Izin dibaca dari layer GIS ESDM per `kode_wiup`; PDDikti dari endpoint internal; sebagian besar jaringan 108 dari 164 sisi berstatus CUPLIKAN (hanya berita), 19 TERKONFIRMASI, 30 KATA_PERUSAHAAN, 7 INFERENSI (`data/04_jaringan.md`). Satu-satunya data yang ditarik otomatis adalah FIRMS.

### 5.3 Pipeline dan skrip

- **Tidak ada pipeline terjadwal.** Dua skrip manual Python stdlib, tanpa dependensi:
  - `situs/tarik_firms.py` (2,6 KB): mengunduh dua CSV publik 7 hari VIIRS S-NPP dan NOAA-20 dari `firms.modaps.eosdis.nasa.gov/data/active_fire/.../SouthEast_Asia_7d.csv` (berkas publik, **tanpa API key**), saring ke kotak lon 129-141,1 / lat -9,2-1, titik-dalam-poligon ray casting murni (`in_ring`, `in_poly`) terhadap `papua42.geojson`, simpan `firms_7h.json` (kab, prov, tgl, jam, sat, conf, frp). Baris 8-30 di berkas.
  - `situs/build.py` (3,4 KB): `BERKAS` memetakan kunci -> CSV; `KOLOM_SUMBER` mewajibkan `sumber_url` terisi dan bukan "-"/"-"; baris tanpa sumber dibuang dan dilaporkan ("n ditolak tanpa sumber"); memuat JSON pendukung, memampatkan FIRMS jadi array indeks (`[lat, lon, hari_idx, sat_idx, kab_idx]`), menyisipkan topojson, CSS tema, `dibangun` = tanggal hari ini, lalu mengganti `/*__DATA__*/null` di template (`</` di-escape jadi `<\/`).
- Tidak ada uji, tidak ada gerbang selain filter sumber di `build.py`.

### 5.4 Lisensi

Tidak ada berkas LICENSE di repo. Catatan hak cipta di README:
- Ringkasan laporan McKinsey Global Materials Perspective (`data/dokumen/doc_mck_gmp2025.md`, `doc_mck_gmp2026.md`) berasal dari dokumen berlabel confidential; jangan dipublikasikan.
- Citra: NASA Blue Marble dan Black Marble lewat NASA GIBS; batas wilayah: geoBoundaries 2020.
- Angka `[CEK]` belum diverifikasi; dua temuan sensus komoditas (oil shale 97%, kobalt laterit Papua Barat Daya) belum koheren dan jangan dikutip.
- Rencana: VIIRS Nightfire tidak boleh ditampilkan ulang sebelum lisensi beres; citra vendor sesuai lisensinya.
- Tidak ada rahasia di repo: pemindaian pola `api_key|token|secret` hanya menemukan kata itu di `DESIGN.md` (token desain), bukan kredensial.

---

## 6. Yang bisa dipakai ulang untuk METI (berkas:baris) dan ranjau

### 6.1 Pola yang layak dipakai ulang

1. **Prinsip data 7 butir** (`blueprint-lengkap` §1.1, baris 33-47): bersumber atau ditarik; strip beralasan dalam empat jenis ("Tidak dipublikasikan", "Belum ada", "Menunggu data K/L", "Belum kami cari"); estimasi berlabel EST dengan rumus terbuka; bertanggal (periode data dan tanggal baca); bukti berjenjang; tidak menjumlahkan yang tak sebanding; dibekukan saat dikutip. Cocok persis untuk direktori jaringan METI.
2. **Skema tiga tabel `entitas/fakta/ikatan`** (`blueprint-lengkap` §5, baris ~490-510): `ikatan(id, dari_id, ke_id, jenis, persen_atau_nilai, keterangan, sumber_url, tanggal_sumber, tanggal_baca, tingkat_bukti)` langsung menjadi tabel D1 untuk keanggotaan/relasi METI. Tambahkan `bahasa` atau kolom `_en` untuk dwibahasa.
3. **Jenis ikatan** (`template.html:999` `JLBL`; `data/04_jaringan.md` baris 1-10): OWNS, OPERATES, SUPPLIES, BUYS_FROM, BUILDS, LENDS_TO, REGULATES, FUNDS, TRAINS, PARTNER. Untuk METI tambahkan MEMBER_OF, SPONSORS, dst.
4. **Filter sumber di build**: `situs/build.py:13-30` (`KOLOM_SUMBER`, penolakan baris tanpa sumber dan laporan jumlah ditolak). Padanannya di Worker: validasi di jalur impor/POST agar `sumber_url` kosong ditolak.
5. **Lencana bukti + strip + tautan sumber**: `template.html:557-566` (`normBukti`, `LBL_BUKTI`, `ARTI_BUKTI`, `bukti`, `domain`, `srcLinks`, `dash`, `val`) dan CSS `template.html:~161-166` (`.bdg`, `.b-*`, `.src`, `.dash`). Pakai ulang apa adanya, ganti istilah.
6. **Laci rincian generik**: `template.html:573-588` (`openDrawer`, `kvList`, `drawerRow`); satu mekanisme untuk semua entitas, kolom sumber/bukti ditangani otomatis. Cocok untuk profil anggota/proyek METI tanpa navigasi halaman.
7. **Graf jaringan d3-force siap pakai**: `template.html:1006-1039` (zoom, drag, filter chip, garis putus untuk inferensi, derajat -> ukuran, `prefers-reduced-motion` sinkron). Ganti `JCOL` dan filter subjek ke kategori METI (pengembang, investor, regulator, lembaga keuangan, kampus).
8. **Kuadran pilih-sumbu**: `template.html:920-969`, termasuk lajur "tanpa angka" dan median, kartu samping dengan peringkat. Cocok untuk memetakan provinsi/proyek EBT (potensi x kapasitas terpasang).
9. **Peta dasar d3 dengan citra raster + mode Polos**: `template.html:626-640`; `canvasDots()` `:599-607` untuk banyak titik; penempatan titik tanpa koordinat di centroid + jitter dengan tanda "perkiraan" (`vPeta`, `:1041-1060`). Untuk Indonesia perlu `papua42.topo.json` diganti topojson provinsi/kabupaten Indonesia.
10. **Pencarian global berindeks** `setupSearch` (`template.html:754-769`): satu array `[jenis, teks cari, judul, sub, aksi]`.
11. **Formatter ID**: `nf`, `nf1`, `tgl`, `toNum` (`template.html:546-551, 568`) untuk angka/tanggal Indonesia (`toNum` membaca "1.234,5" dan tanda minus Unicode).
12. **Bar cakupan field** `coverage()` (`template.html:807`), konsep "n dari N" jujur di bawah tiap tabel.
13. **Tema dan tombol ganti tema**: token shadcn + `data-theme` (`template.html:4-62, 1359`) jika METI memilih sistem desain serupa; tapi METI diminta meniru 1001, jadi token perlu diganti (§3.6).
14. **Tarik FIRMS tanpa kunci**: `situs/tarik_firms.py:8-30` jika METI butuh data satelit (kurang relevan untuk direktori energi).

### 6.2 Ranjau

1. **Tidak ada runtime server atau i18n atau deploy**; jangan berharap ada Worker/D1/R2 untuk disalin. `blueprint-lengkap` §7 (Postgres/Supabase, RLS, versi) adalah rencana, bukan kode.
2. **Satu berkas HTML 1,6 MB dengan seluruh data tertanam** (citra base64 534 KB + FIRMS 2,9 MB di JSON sebelum dipampatkan). Tidak cocok untuk direktori yang tumbuh; di METI pakai `/api/*` dari D1 dan R2 untuk gambar.
3. **Template JS padat**: baris sampai 1.100+ karakter, tanpa modul/tipe/uji. Menyalin utuh mewarisi kesulitan dibaca. Ambil fungsi per fungsi.
4. **Tidak lolos gerbang INP pemilik**: `vJaringan.draw()` dan `vWilayah.draw()` dirender sinkron penuh pada tiap klik chip/dropdown (membangun ulang SVG dan simulasi), tanpa pemisahan chrome-urgent vs subtree-deferred. `setupSearch` melakukan `filter` + `innerHTML` pada tiap ketukan tanpa debounce. Ulangi dengan pemisahan transisi sebelum dipakai (aturan INP pemilik).
5. **Tidak ada atribut `lang`, tidak ada `<head>`/doctype**; aksesibilitas parsial (ada `aria-label`, `aria-pressed`, `aria-live`, fokus ke tombol tutup laci, `:focus-visible`), tapi pencarian dan graf tidak ramah papan ketik (graf hanya klik/drag).
6. **Teks lencana bukti berubah di kode vs data**: nilai CSV `tingkat_bukti` bercampur skema lama (A/B/C/D, `primer`, `C_osm_infe...`) dan baru; `normBukti` menambal. Tetapkan satu enum sejak awal di D1 (CHECK constraint).
7. **Koma desimal di kolom string** ("48,76%", "40,22") bercampur titik pada kolom numerik; `toNum` mengurai tapi rawan. Simpan numerik murni + satuan di kolom terpisah.
8. **Pertentangan dokumen desain** (§3.5). Jangan mewarisi `blueprint-lengkap` §3 dan DESIGN.md sekaligus.
9. **Hak cipta/kerahasiaan**: ringkasan McKinsey bertanda confidential; jangan disalin. Aturan "jangan meniru nama, teks, logo, font, gambar 1001startup.id" ditulis di repo; METI yang meniru gayanya harus tetap memakai aset sendiri dan font berlisensi terbuka (Geist atau Inter dsb.), bukan Overused Grotesk milik mereka kecuali berlisensi.
10. **Angka `[CEK]` dan data sensitif**: pola pembingkaian rambu (kata "ilegal" dll.) spesifik Papua; padanan METI: hindari klaim kapasitas/investasi yang tidak bersumber.
11. **Form permintaan data di layar Desain tidak mengirim apa pun** (`template.html:1342`: `onsubmit` hanya membuka pesan). Jangan disalin sebagai fitur.
12. **Titik panas FIRMS bukan api**, **suar tidak sama dengan volume**: aturan "tidak menjumlahkan yang tak sebanding" relevan bagi METI (kapasitas terpasang vs rencana vs potensi tidak dijumlah).

---

## 7. Data energi yang relevan untuk METI

Sebagian besar bukan CSV, melainkan narasi bersumber di `data/katalog_C_infrastruktur_energi.md` (18,8 KB; disusun 19 Okt 2026 dari pencarian web tahap-1, ringkasan mesin, semua angka berstatus "perlu cek dokumen primer"). Semuanya wilayah Tanah Papua, bukan nasional.

### 7.1 Angka dan tabel (tabel A-A7, §2 katalog)

| Topik | Angka | Sumber (domain) | Catatan |
| --- | --- | --- | --- |
| Desa belum berlistrik akhir 2023 | 140 desa nasional, semuanya di Papua: Papua Pegunungan 56, Papua Tengah 47, Papua Selatan 16, Papua Barat Daya 12, Papua 9; 185.662 rumah tangga belum berlistrik | esdm.go.id (siaran pers), investortrust.id | Juga di `situs/fakta_kunci.json` id `desa_gelap` dengan bukti KATA_PEMERINTAH |
| RE wilayah PLN Papua+Papua Barat | 97,53%; 99,02% desa (7.361 desa) berlistrik, akhir 2024; pembanding nasional 99,82% (Agu 2024) | kabarbursa.com | [CEK] tanggal artikel bergeser |
| Potensi EBT Tanah Papua | Surya 327,2 GW (253,3 Papua + 66,9 Papua Barat); hidro 35,9 GW (32,9 + 3,0); Papua Barat Daya hidro 1,01 GW, surya 5,89 GW | tirto.id (ESDM) | Pra-pemekaran; Papua Barat Daya angka dalam dokumen penyusunan RUED |
| Mamberamo | ~23.000 MW potensi kelistrikan (studi awal DEN) | papua.antaranews.com | |
| PLTU Amamapare (PTFI) | 3 PLTU total 195 MW (3x65 MW, 1998-99), rencana pensiun 2027; PLTMG 128 MW dipilih; pipa slurry 110 km | gem.wiki (Global Energy Monitor), fortuneidn.com, 10-K FCX | [CEK] rencana pensiun; di graf `04_jaringan_edges.csv` baris 33-34: PTFI OPERATES/OWNS `pltu_ptfi`; "PLN BUKAN pemasok tambang" |
| Tangguh Train 3 | 15 MMSCFD gas pipa lokal (~50 MW) komitmen, 8 MW ke PLN untuk Teluk Bintuni (rencana PoD) | offshore-technology.com | [CEK] realisasi; PLN pembeli LNG Train 3 hingga 2,8 MTPA (SPA 2014), `02_kepemilikan_migas.csv` baris 25 dan edge `pln,tangguh_t3,BUYS_FROM` |
| Tangguh LNG | 11,4 MTPA sejak Train 3 (Okt 2023), ±1/3 gas nasional | esdm.go.id 11 Jun 2025 | TERKONFIRMASI |
| BBM Satu Harga | 111 titik Papua (s.d. Sep 2024); Papua+Maluku 212 titik per Des 2025 | kontan.co.id, ambon.antaranews.com, pasardana.id | [CEK] |
| Pembangkit PLN di data tangki | PLTMG Nabire 20 MW + Nabire 2 10 MW, PLTD Sanggeng Manokwari 7,5 MW, PLTD Kota Sorong, PLTD Fakfak (koordinat OSM) | OpenStreetMap | `data/03_situs_tangki.csv` baris S12, S19-S21 |
| Panas bumi | Manokwari Selatan, Demini Distrik Momiwaren: indikasi entalpi rendah | Badan Geologi | `data/06_komoditas.csv` K124 |
| Politeknik Amamapare | Teknologi Rekayasa Instalasi Listrik D4, 80 mahasiswa (2025/2026 Ganjil) | PDDikti | `data/05_sdm.csv` baris 17 |
| IKK 2024 | Papua Pegunungan 249,12; Papua Tengah 209,28; nasional 110,71 | BPS/Databoks | Relevan untuk biaya proyek EBT |
| Blank spot 4G | ~2.000 desa nasional, mayoritas Papua; 1.773 BTS 4G di Papua (Jun 2025) | investortrust.id | Konteks PLTS komunal |

### 7.2 Dataset energi yang dicatat tapi belum ditarik (daftar katalog C)

A1 Statistik Ketenagalistrikan (Ditjen Gatrik, `gatrik.esdm.go.id`), A2 RE/RDB PLN UIW Papua-Papua Barat, A3 RUPTL PLN 2025-2034 (PDF lampiran proyek per regional di `gatrik.esdm.go.id/assets/uploads/download_index/files/...`; proyek Papua tidak ditemukan), A4 potensi EBT/RUED (Perda 2/2024 Papua Barat; Papua Tengah menyusun 2025-2034), A5 LTSHE per kabupaten (2017-2022, EBTKE), A6 PLTU Amamapare, A7 gas pipa/listrik lokal Tangguh. Celah tercatat (§3 katalog): RE per provinsi baru, proyek Papua di RUPTL (PLTMG, PLTA Urumuka/Mamberamo), kuota BBM per provinsi, dokumen PPM per perusahaan.

### 7.3 Ide fitur energi di katalog (§4 katalog) yang bisa jadi inspirasi METI

1. "Kampung Gelap Papua": desa belum berlistrik + RE ditumpuk dengan konsesi.
3. Peta EBT vs permintaan: potensi hidro/surya vs lokasi tambang dan kebutuhan smelter.
10. Dasbor "Siapa yang Menyuplai Listrik?": PLN vs captive tambang vs pembangkit komunal/LTSHE.

### 7.4 Keterbatasan untuk METI

Tidak ada data EBT nasional, daftar pengembang/IPP, kapasitas PLTS/PLTA/PLTP terpasang, anggota asosiasi, atau tabel peraturan EBT. Yang bisa dipakai: pola, skema, beberapa edge (PTFI-PLTU, PLN-Tangguh), dan angka potensi/rasio listrik Papua sebagai contoh isi. Semua `[CEK]` harus diverifikasi sebelum dipakai di platform METI.

---

## 8. Rekomendasi singkat untuk Platform METI

1. Ambil dari Neraca: prinsip data (§6.1 butir 1), skema `entitas/fakta/ikatan` -> D1, enum bukti tunggal, laci rincian, graf d3-force, kuadran, bar cakupan, pencari berindeks, formatter ID, template spesifikasi halaman + tabel komponen.
2. Jangan ambil: tampilan (itu bukan 1001), tidak ada deploy, tidak ada i18n, tidak ada pemisahan INP.
3. Rujukan visual 1001 yang benar: `blueprint-neraca-papua.md` A5 (nilai di §3.6 laporan ini) dan `blueprint-lengkap` §3 (rencana tidak jadi). Tambahkan keputusan "menang/kalah" tertulis agar tidak seperti pertentangan Neraca.
4. Bungkus rencana METI dengan paket SIPPA (KEPUTUSAN, PRD, DESIGN-SYSTEM, DESAIN-TEKNIS, RENCANA-UJI, TIKET) dan gerbang uji integrasi (D1/route), sesuai standar pemilik; Neraca tidak punya itu.
5. Rancang dwibahasa dari awal: `/` ID, `/en/` EN atau kolom `_id/_en` di D1; jangan menyalin hardcode Indonesia dari `template.html`.
