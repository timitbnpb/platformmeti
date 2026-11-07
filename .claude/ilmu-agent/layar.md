# Ilmu layar

> Kelas: pengerja · Model: sonnet · Definisi: `.claude/agents/layar.md`
> Dibaca SEBELUM kerja (`node scripts/agents/ilmu.mjs baca layar`). Kasus baru
> ditambah SESUDAH kerja lewat `node scripts/agents/ilmu.mjs kasus layar "..."`.

Singkatan: DT = DESAIN-TEKNIS, DS = DESIGN-SYSTEM, KPV = KEAMANAN-PRIVASI, RU = RENCANA-UJI, KP = KEPUTUSAN-METI. Semua di `docs/perencanaan/`. Bila dua dokumen bertentangan: berhenti dan tanya pemilik (rantai: KP > GD > RISET > PRD > ALUR > ALG > DS > DT > KPV > RU > TIKET).

## Peta berkas & tabel

Wilayahmu hanya `public/**` (DT §2). Dilarang menyentuh `src/**` (worker), `migrations/**`, `scripts/**`, `tests/**`.

| Tiket | Berkas |
| --- | --- |
| JM-C01 token dan kepala | `public/inti/tema.css` (token Midnight Energy), `kepala.css`, `gaya.css`, `kepala.js` (ditulis ulang), `public/tema.js`, `public/img/meti-putih.svg` |
| JM-C02 port direktori | `public/direktori.html`, `direktori.js` (3.961 baris, IIFE klasik), `direktori.css` (638 kelas `.ak-*`), `fungsi_direktori.js`, `public/geo/**` |
| JM-C03 konstanta domain | `RUMPUN` jadi `SEKTOR`, 8 tab (Pakar, Lembaga, Wilayah, Inovasi, Riset, Sistem data, Pendanaan, Pustaka), `DIRI` = METI |
| JM-C06 i18n | `public/i18n.js` (`t()`, `angka()`, `tanggal()`), `public/i18n/id.json`, `en.json` |
| JM-B06 login | `masuk.html`, `aktivasi.html`, `ganti-sandi.html`, `masuk.js` |
| JM-E01..E05 sensus F1 | `index.html`, `perusahaan.html`, `p.html`, `peta.html`, `metode.html` (+ `.js` per halaman), `public/inti/jm.css` (kelas `.jm-*`, maks 400 baris) |
| JM-E06/E07 admin | `admin.html`, `admin.js`, `admin.css`, `public/admin/kurasi.js` |
| JM-F01..F08 F2 | `rantai`, `pembiaya`, `bumn`, `data-center`, `desa`, `wilayah`, `kebijakan`, `cerita` (.html) |
| modul rumus | `public/taksonomi.js`, `public/algo.js` (SATU-SATUNYA tempat rumus), `public/inti/umum.js` (`esc`, `nanti`, `hantu`, `kosong`, `galat`) |
| JM-A05 | `public/_headers`, `public/robots.txt` (KPV §6; DT §2.2 lupa mencatatnya, RU §8 butir 4) |

Rumah kontrol bersama (tab, chip, paginasi, sort, lipat, kotak cari) wajib satu berkas, mis. `public/kontrol.js`; DT belum mencatatnya (RU §8 butir 3): belum diputuskan di paket dokumen, tanya induk sebelum membuat nama berkas.

## Aturan & invarian

1. **Tanpa build, tanpa framework** (KP D4, ADR-03). Pustaka luar hanya MapLibre GL 4.7.1 dari cdnjs dengan `integrity` sha384 dan `crossorigin="anonymous"`, dimuat malas saat peta dibuka (DS §4 aturan muat 2). Pustaka lain: tanya pemilik.
2. **Pemuatan skrip** (DT §2.1 catatan): `taksonomi.js` dan `algo.js` ES module yang menempel ke `window.JM`; `direktori.js` dimuat `defer` sesudahnya. Urutan dokumen = urutan jalan. Urutan CSS tetap: tema, kepala, gaya, direktori, jm; `?v=HASH` dari pipeline rilis (DS §4).
3. **CSP tanpa inline** (KPV §8): tidak ada `<script>` tanpa `src`, `style=`, `onclick=`. Posisi dinamis lewat atribut SVG atau `el.style.setProperty`. Semua teks dari data lewat `esc()` sebelum `innerHTML`; URL luar lewat pemeriksa http(s).
4. **Warna hanya token** (DS §2): tidak ada hex di CSS selain `tema.css`; teks teal selalu `--accent` `#07705A`, bukan teal asli `#0A896A` (kontras 4,38:1 gagal). Tidak ada warna per sektor, hanya `--data1..5` (DS §1). Fokus `:focus-visible`, tidak pernah `:focus`.
5. **Kelas**: port tetap `.ak-*` (ADR-05), baru `.jm-*`. Jangan ganti nama 638 kelas. Jangan menyalin CSS/JS identik ke dua halaman: pindahkan ke `public/inti/`.
6. **Klik tidak boleh membekukan layar** (DS §6.0, RU §2.3.3): chrome kontrol (`aria-selected`, `aria-pressed`, `aria-expanded`, kelas aktif) berubah sinkron di handler; isi berat ditunda lewat `nanti()` sesudah satu bingkai tercat. Membungkus semuanya dalam penundaan BUKAN obatnya. Kotak cari di-debounce 120 ms (DS §6.0) dengan `AbortController`.
7. **Teks**: semua lewat `t(kunci)`; kunci ada di `id.json` DAN `en.json` bersamaan; tidak ada teks Indonesia tertanam di JS baru (DT §8.4). Angka dan tanggal hanya lewat `angka()`/`tanggal()` (KP D17); tanpa titik tengah dan em dash di teks.
8. **Angka tampil**: tiap angka bersumber dan bertanggal per butir (DS §1); turunan berpil `EST`; skor, kuadran, matriks berpil `Hipotesis` dengan "Cara menghitung" terbuka (KP C-16, DS §6.9); sel tanpa data berisi `-`, bukan nol atau tebakan; kartu angka membawa penyebut "n dari N baris" (DS §6.2). Pola wajib halaman publik: Jawaban singkat, kartu angka, komponen utama, Cara menghitung, Cara mengutip + tanggal beku (PRD U4).
9. **Keadaan komponen** (DS §6.0): memuat = kerangka `.jm-hantu` setinggi isi akhir; kosong = ikon, satu kalimat, satu aksi; galat = `role="alert"` + "Coba lagi"; di 390 px tanpa gulir horizontal halaman, target sentuh minimal 44 px.
10. **Rute halaman** (DT §4.2): `/direktori` LOGIN (302 ke `/masuk?ke=`), `/admin` KR AD SA, tab Akun hanya AD dan SA dan benar-benar tidak ada di DOM untuk KR. Tak ada `/akademisi`. `?ke=` yang tidak relatif diabaikan. Tidak ada kontak (surel, telepon) di DOM halaman publik.
11. **Tombol isi data dummy DIBATALKAN pemilik** (KP K15, 7 Nov 2026, mengalahkan D18 dan DUMMY.md untuk repo ini). Jangan membuat tombol, `dataContoh()` di layar, atau elemen `.ak-dummy`. Sisa rujukan di roster, DT §8.3, DS §5, TIKET JM-C05, RU §2.7 basi: laporkan, jangan ikuti. Data contoh hanya fixture uji dan seed D1 lokal.
12. Bahasa: `?lang=` menang atas `localStorage` (try/catch) menang atas `akun.bahasa` menang atas `id`; isi data `_en` kosong tampil ID dengan pil "ID".

## Ranjau yang pernah meledak

- **Monolit** (R10 §8.3): `index.html` 898 KB, `akademisi.js` 658 KB. Sebab: semua di satu berkas. Akibat: sulit diuji, lambat, rawan. Tahu: ukuran berkas; ASAL `direktori.css` 238 KB sudah dimuat di halaman publik, ukur LCP di JM-E01 (DS §4 butir 4).
- **CSP `unsafe-inline`** (R10 §8.2): lahir dari skrip/gaya inline. Tahu: gerbang-headers merah.
- **MapLibre tanpa SRI, dua jalur muat** (R10 §8.14) dan **logo hotlink** (R10 §8.13): melacak pengunjung ke host lain. Logo hanya dari `/api/gambar/logo/`.
- **Peta tidak ganti tema** setelah dibuat (R10 §8.15): gaya dipilih sekali. Ganti tema harus memanggil penggantian gaya peta.
- **Kunci kamus = teks Indonesia, kamus 965 KB** (R10 §6.2): rapuh dan berat. Pakai kunci titik (`nav.sensus`), kamus per halaman bila membengkak.
- **Pencarian menimpa `innerHTML` tiap ketukan tanpa debounce** (R12 §8.8): terasa baik di 400 entri, beku di ribuan. Render bertahap.
- **Formulir tiruan** (R12 §8.11): tombol yang tidak mengirim apa pun. Tiap formulir menulis ke server, mengembalikan nomor rujukan, gagal terlihat.
- **Kelas/variabel CSS dipakai tapi tak terdefinisi** gagal diam (R11 §6.2): periksa tiap `var(--x)` ada di `tema.css`.
- **Overlay INP menyala meski sudah di-transition** (R11 §4.11): chrome ikut tertunda; cat tak pernah datang.

## Gerbang yang menghakimi

Merah bila: `gerbang-headers` (inline, `*`, sumber luar tak terdaftar), `gerbang-i18n` (kunci id/en beda, `t()` ke kunci tak ada, teks tertanam di JS baru), `gerbang-teks` (U+00B7, U+2014, sisa BNPB/BPBD/karhutla/DIBI, `toLocaleString` di luar `i18n.js`), `gerbang-token-meti` dan `gerbang-kontras` (hex liar, pasangan gagal AA), `gerbang-inp-transisi` (kontrol berchrome di luar rumah kontrol, handler tak terdaftar di `tests/inp-daftar.json`), port `direktori-seg/-klik/-layar/-versi`, dan `tests/layar/*.spec.mjs` L1 sampai L11 di 1440 dan 390, terang/gelap, ID/EN (RU §2.3). Pemeriksa dipanggil: `selera-angka` (angka, EST, Hipotesis), `inp-reviewer` (handler interaksi), `i18n-guard` (kamus). Status gerbang-dummy: basi karena K15, tanya induk.

## Kasus

Belum ada kasus. Tambahkan lewat ilmu.mjs kasus.
- 2026-11-07 · Pseudo-elemen fixed z-index pada body menimpa kartu di Chrome; latar grid/gradasi taruh di background body (attachment fixed), bukan ::before.
- 2026-11-07 · Gerbang CSS menolak var(--x) lokal (--tc, --w): pakai kelas per warna dan el.style.width, bukan variabel kustom
- 2026-11-07 · Tangkapan layar peta WebGL headless: set tinggi viewport = scrollHeight (desktop) sebelum capture, kalau tidak kanvas MapLibre terpotong; viewport tinggi >8000px di mobile menggandakan isi.
- 2026-11-07 · IntersectionObserver tidak menyala bila bagian dilewati lompatan gulir; tambah cek posisi saat scroll. Grid CSS tanpa grid-template-columns:minmax(0,1fr) melebar mengikuti isi nowrap (overflow 375). Regex pengganti CSS bisa merusak @media; periksa keseimbangan kurung
- 2026-11-07 · Wrapper div (#daftar) di dalam main.jm-halaman memutus grid gap: kartu menempel ke hero. Tiap wrapper anak perlu display:grid+gap sendiri. Class .jm-bar bentrok dengan jm.css (bilah alat grid); li dengan grid 3 kolom membuat tombol di dalamnya 220px sehingga batang hilang: pakai kelas li terpisah untuk batang berupa tombol.
- 2026-11-07 · CSP img-src: https: lebar ditolak; pakai daftar host eksplisit (>=3 foto) karena _headers max 2000 karakter per baris; id elemen filter jangan 'bahasa' (bentrok tombol kepala)
- 2026-11-07 · gerbang-i18n menganggap kata 'surel' dalam literal sebagai teks Indonesia; gerbang CSS menolak var(--x) lokal: set lebar batang lewat el.style di JS, bukan var(--p)
- 2026-11-07 · Aksi seksi: inti/aksi_ex.js (aksiHtml) + exHtml. Dialog showModal menutupi toast fixed (top layer): umpan balik dalam dialog lewat teks tombol. Screenshot 375: pakai CDP Emulation (headless --window-size memotong lebar ~500). exHtml tanpa subHtml tidak membuat .jm-ex-sub: beri ' ' bila diperbarui dinamis.
- 2026-11-07 · Impor 'ada' dari i18n.js tertimpa const lokal 'ada' di siapPeta (beranda_bawah.js): gagal diam jadi 'ada is not a function' dan peta disembunyikan; headless Chrome butuh --use-angle=swiftshader --enable-unsafe-swiftshader agar MapLibre jalan; gerbang CSS melarang var(--lokal): pakai currentColor.
- 2026-11-07 · Poligon peredam 'dunia minus 38 provinsi mentah' memicu serpihan putih (lubang saling menyentuh membuat earcut gagal). Solusi: larutkan dulu jadi satu bentuk bersih di public/geo/luar-indonesia.json (dibuat dengan shapely sekali jalan), jangan bangun lubang di klien. Tahu: zoom 3-6 tanpa segitiga. Salinan lama masih di peta_indonesia.js dan direktori.js.
- 2026-11-07 · Dua agent memakai /tmp/claude-501/shot.mjs bersamaan dan saling menimpa; skrip tangkapan harus di folder scratchpad sendiri. Dialog modal: pasang height:fit-content, bukan auto, supaya tidak mengisi max-height. Dua kolom modal pakai column-count dengan .jm-pj-kol{display:contents} agar tinggi seimbang dan tidak ada kolom kosong.
- 2026-11-07 · Peta Organisasi: data R2 bisa hanya punya koordinat presisi tepat; itemPeta() kini jatuh ke pusat provinsi (PT.cent dari bbox geo/provinsi.json) dan hitungan 'ditempatkan' menghitung anggota grup g:, bukan hanya key l:. Chip = total per kategori. Uji lokal: harness playwright dari /opt/homebrew/lib/node_modules/@playwright/cli, stub /api/direktori.
- 2026-11-07 · dialog di kepala.css: global ada align-items:center pada dialog[open] flex; set align-items:stretch eksplisit, dan input type=search kena max-width/border global (timpa dengan .jm-cari .jm-cari-isi). Gerbang i18n menolak literal JS berisi kata 'dan' (alias singkatan: tulis tanpa kata sambung).
- 2026-11-07 · Chrome headless min lebar jendela 500: tangkapan 375 lewat iframe 375 di halaman pembungkus; grid halaman wajib minmax(0,1fr) agar tabel/kartu tak melebarkan layar. Marker peta dipasang di style.load, bukan load (load menunggu semua ubin).
- 2026-11-08 · Screenshot headless Chrome atas halaman bermodul JS tak stabil; cara andal: sisipkan skrip probe di salinan _p.html (hapus sesudahnya) yang menunggu elemen lalu klik, dan jalankan ulang beberapa kali. Dialog position:fixed inset:0 dengan height:auto meregang penuh; pakai height:fit-content.
- 2026-11-08 · Headless Chrome --window-size<500 memotong tangkapan (layout 500px); .jm-hero di gaya.css sudah dipakai pita hijau, jangan pakai nama itu; tipografi gate menolak calc(px).
- 2026-11-08 · Tabel admin table-layout:fixed: kolom tanpa kelas lebar jadi 0 px dan isi tetangga menimpa; jangan fixed tanpa lebar semua kolom. Kelas legenda jm-adm-w0..4 diganti jm-adm-dt0..4.
- 2026-11-08 · Foto avatar: crop wajah dikerjakan di pipeline (scripts/pipa/foto_wajah.mjs + wajah.swift Vision, catatan data/foto_wajah.json), bukan object-position; python3 -I tak menemukan PIL user-site
- 2026-11-08 · gerbang-i18n: regex literal salah pasang bila template berisi ${esc(x || "")} atau regex /\/\//; pindahkan ke const dan pakai [/][/]
- 2026-11-08 · Peta 3D MapLibre ditolak pemilik (7 Nov): koroplet provinsi tetap SVG datar. Screenshot headless WebGL harus real-time (CDP + tunggu), bukan --virtual-time-budget; stylesheet dinamis harus ditunggu sebelum new Map atau kanvas 0px.
- 2026-11-08 · Gerbang var(--x) hanya menerima definisi di tema.css: token baru (mis. --batik) wajib didefinisikan di tema.css :root, bukan lokal di jm.css. Server statis python tak menjawab /api/saya sehingga halaman kosong; pakai server node kecil yang mengembalikan {masuk:true}. Sesi lain bisa git stash pekerjaan kita: cek git stash list dan pulihkan lewat git show stash@{0}:berkas.
- 2026-11-08 · Mobile: pemeriksaan luber harus lewat getBoundingClientRect, bukan scrollWidth saja (body menyembunyikan luber). Cek: node scripts/mesin/cek_mobile.mjs. Aturan seluler bersama ada di akhir inti/jm.css dan gaya.css.
- 2026-11-08 · Gerbang CSS layar-statis menuntut tiap var(--x) terdefinisi di tema.css: pakai --tk/--sk untuk warna lokal, bukan nama baru. Aturan .jm-rank a (grid 28px) menjepit tautan di dalam .jm-rank-tx hingga nama patah per kata.
- 2026-11-08 · Kelas .jm-rt-tabel sudah dipakai tabel kota di analisis.css (table-layout fixed); tabel baru memakai .jm-rp-tabel. td::before kartu mobile mewarisi nowrap dari td.jm-num.
- 2026-11-08 · Halaman gabungan (/peluang, /kalender, /galeri) memakai inti/tab_halaman.js: tiap tab memuat modul lamanya lewat import() malas; modul tak boleh memanggil mulaiHalaman lagi (penangan ganda) dan tiap tab punya id wadah sendiri (isi, isiVideo, isiPodcast, isiEvent). Alihan halaman lama = 301 di ALIH_GABUNG src/worker.js, bukan stub HTML (gerbang-layar-statis menuntut kepala situs di tiap .html). Tahu: tests/rute-gabung.test.mjs
- 2026-11-08 · Paginasi: satu komponen public/inti/paginasi.js (paginasiHtml{hal,total,per,satuan}; total null + n/ada untuk server tanpa total; sorotHalaman sinkron). Skrip klasik (direktori.js) memakainya lewat window.JM dari direktori_awal.js. Gerbang: tests/gerbang-paginasi.test.mjs. Jangan edit JS dengan index() ganda: IKJ muncul 3x.
- 2026-11-08 · Kepala .jm-kh wajib berisi sisi kanan (ubin|gambar|fakta) lewat inti/kh.js khSisi; statis pakai data-kh-tautan. Kepala admin_umum.kepalaTab dan pf-kepala (o/p) ikut. Tahu: tests/gerbang-kepala-halaman.test.mjs 'sisi kanan kepala terisi'.
- 2026-11-08 · komponen.js urut global membungkus th tabel jm-tabel tanpa button.jm-urut dan mengurut DOM sendiri; tabel berpaginasi wajib pasang button.jm-urut sendiri. terkaitHtml pecah bila RUTE[j] tak ada (orang): rinci kini null. Scratchpad dipakai bersama agent lain: pakai nama berkas berawalan unik.
- 2026-11-08 · Tombol 'Tampilkan lagi/lebih banyak/lebih sedikit' dilarang pemilik: pakai paginasiHtml (data dari server/state) atau navLokal+pasangLokal di public/inti/paginasi.js (baris sudah di DOM, hidden per indeks). Gerbang: tests/gerbang-paginasi.test.mjs (event.js dikecualikan sementara).
- 2026-11-08 · Kartu ketum kosong: .tn-grp flex column + align-items:center membuat ul shrink-to-fit lebar 0 saat li hanya berisi anak absolut; beri lebar eksplisit pada ul. Cek lewat boundingBox, bukan tebakan CSS. Skrip uji layar: server statis + page.route mock /api (worker butuh login).
- 2026-11-08 · Investasi sektor identik karena proyek diatribusikan via kepakaran organisasi; hitung proyek/MW sektor teknologi lewat p.teknologi
- 2026-11-08 · tabel BPP: tingkat baris diturunkan di layar dari kapital nama (pulau/wilayah/sub); label OCR terpotong disambung di scripts/pipa/pdf/bpp.mjs; selector kartu mobile jm-tabel butuh spesifisitas .dd-t.dd-t tbody tr td
- 2026-11-08 · tender digabung ke /proyek tab #tender (proyek_tender.js, dipasang proyek.js setelah mulaiHalaman); bungkus section dengan wrapper grid wajib minmax(0,1fr) agar trik 100vw full-bleed tidak meluap
