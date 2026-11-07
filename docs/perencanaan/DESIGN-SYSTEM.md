# DESIGN-SYSTEM: Platform Jaringan METI

Dokumen ketujuh dalam urutan otoritas (`KEPUTUSAN-METI` > `GRAND-DESIGN` > `RISET` > `PRD` > `ALUR` > `ALGORITMA` > `DESIGN-SYSTEM` > `DESAIN-TEKNIS` > `KEAMANAN-PRIVASI` > `RENCANA-UJI` > `TIKET`). Menang atas DESAIN-TEKNIS dan seterusnya; kalah dari PRD, ALUR, dan ALGORITMA (nilai enum, rumus, dan istilah skor mengikuti ALGORITMA). Versi 1, 7 Nov 2026.

> **Untuk pekerja agen:** layar baru hanya memakai token di §2 dan komponen di §6. Tidak membuat palet, huruf, atau kelas lepas. Komponen yang tidak ada di sini tidak dibuat; berhenti dan tanya pemilik. Pengulas wajib: `selera-angka`, `inp-reviewer`.

Singkatan: KP = KEPUTUSAN-METI, GD = GRAND-DESIGN, R1..R7 = `riset/`, DS = dokumen ini, Asal = repo poskokarhutla (Direktori Jaringan Kebencanaan).

## 1. Prinsip dan sumber token

**Satu aturan induk:** tiru Direktori Jaringan Kebencanaan (kelas `.ak-*`, kepala navy bersama, kartu per bagian), ganti hanya token warna dan huruf dengan token METI "Midnight Energy" (KP D3, D11). Penyajian informasinya meniru 1001startup.id (KP K7, D6): satu pertanyaan per halaman, Jawaban singkat, angka dengan penyebut, sumber bertanggal per butir. Gaya visual 1001startup.id (huruf grotesk, label mono kapital, banner gradasi oranye) TIDAK dipakai.

| Elemen | Sumber | Dipakai di |
| --- | --- | --- |
| Nama token (`--paper`, `--card`, `--surface`, `--ink`, `--ink2`, `--line`, `--brand`, `--brand2`, `--accent`, `--ok`, `--warn`, `--bad`, `--info`, `--shadow`, `--r`, `--top`, `--font`, `--display`) | Asal `public/inti/tema.css` (R1 §6.1) | Semua CSS port `.ak-*` jalan tanpa disunting |
| Nilai warna terang dan gelap | R5 §6.2, palet resmi METI (KP D11) | `public/inti/tema.css` |
| Kepala, tab, tombol ikon | Asal `inti/kepala.css`, `inti/gaya.css` (R1 §6.2), warna diganti ke token | Semua halaman |
| Komponen `.ak-*` (638 kelas) | Asal `akademisi.css` (R1 §6.3), disalin ke `public/direktori.css` | `/direktori`, `/peta`, profil, laci |
| Komponen `.jm-*` | Baru, maks 400 baris di `public/inti/jm.css` | Halaman publik sensus dan F2 |
| Pola isi halaman (Jawaban singkat, Cara menghitung, Cara mengutip, EST, skor keyakinan) | 1001startup.id via `riset-1001startup` (D6), R7 §6.1 | Semua halaman publik |
| Lencana bukti dan laci rincian | neraca-papua `template.html:557-588` (R7 §6.1), ditulis ulang bersih | `.jm-fakta`, `.jm-laci` |

Bila dua sumber bertentangan: DS menang atas R5 (riset), R5 menang atas Asal untuk nilai warna, Asal menang atas R5 untuk nama token. Beda yang sudah diputus ada di tabel berikut.

| Beda | R5 | DS memutuskan | Alasan |
| --- | --- | --- | --- |
| Nama token tautan dan tombol | `--aksi`, `--aksi-isi` | `--accent`, `--accent-isi` | Nama asal tetap, diff port kecil |
| Nama token huruf judul | `--font-judul` | `--display` | Nama asal |
| Radius kartu | `--r:12px` | `--r:14px`, `--r-sm:10px`, `--r-lg:16px` | Aturan pemilik "radius sekitar 14" |
| Muat huruf | Google Fonts | Hosting sendiri (`/fonts/*.woff2`, lisensi OFL) | Privasi (IP pengunjung tidak ke Google), CSP lebih ketat, INP; KEAMANAN-PRIVASI §6 |
| Sumber di kaki kartu | METI mewajibkan, aturan kartu standar asal menghilangkan | Sumber ditulis PER BUTIR (baris fakta, sel tabel, lencana), bukan kaki kartu; kartu data punya satu baris "n dari N baris" | R5 §8 butir 5; D5 mewajibkan sumber tiap fakta |
| Warna per sektor | Asal memakai 15 hex per rumpun | Tidak ada warna per sektor. Sektor dibedakan ikon dan label; warna hanya seri grafik tetap `--data1..5` | Menghindari palet lepas dan kegagalan kontras |

## 2. Token CSS lengkap

Berkas: `public/inti/tema.css`, dipasang SEBELUM `gaya.css` dan `jm.css`. Tidak ada hex di berkas CSS lain (gerbang `gerbang-token-meti`, kecuali logo SVG dan `theme-color`).

```css
:root{
  /* palet inti METI, sama di dua tema */
  --meti-navy:#122B4A; --meti-petrol:#155B79; --meti-teal:#0A896A;
  --meti-cyan:#65C7EC; --meti-lime:#B9D75A; --meti-cloud:#F3F7FB; --meti-oranye:#C55A11;

  --paper:#FFFFFF;        /* latar halaman */
  --surface:#F3F7FB;      /* Cloud White: kotak lembut, kolom pertama tabel */
  --card:#FFFFFF;
  --soft-biru:#E3F4FB;    /* catatan, insight, zebra */
  --soft-hijau:#E3F2EC;   /* output, status baik */
  --line:#D5DEE8;         /* garis kartu (dekoratif) */
  --line-cell:#DCE6EF;    /* garis sel tabel */
  --line-ctl:#6F7F90;     /* batas input dan kontrol, 4,11:1 */
  --ink:#0B1726;          /* isi dan angka */
  --ink2:#4A5A6B;         /* sekunder */
  --head:#122B4A;         /* judul */
  --brand:#122B4A;        /* kepala situs, kartu hero, segmen aktif */
  --brand2:#155B79;       /* header tabel, struktur */
  --accent:#07705A;       /* tautan, tombol utama, teks teal (6,04:1) */
  --accent-isi:#0A896A;   /* isian ikon, tag, grafik; BUKAN teks */
  --on-accent:#FFFFFF;
  --data1:#122B4A; --data2:#0A896A; --data3:#65C7EC; --data4:#B9D75A; --data5:#155B79; /* seri grafik, urutan tetap */
  --sorot:#B9D75A;        /* lime: nomor, highlight, 5 sampai 10 persen luas */
  --ok:#066B52; --warn:#A8480A; --bad:#B3261E; --info:#155B79;
  --ok-bg:#E3F2EC; --warn-bg:#FBEBDD; --bad-bg:#FBE7E5; --info-bg:#E3F4FB;
  --fokus:#155B79;
  --shadow:0 2px 14px rgb(18 43 74/.08); --shadow-lg:0 8px 28px rgb(18 43 74/.16);
  --pendar:0 0 0 1px rgb(101 199 236/.35),0 8px 28px rgb(101 199 236/.18);
  --r:14px; --r-sm:10px; --r-lg:16px; --r-pil:999px;
  --top:60px; --maks:1240px; --gut:20px; --gap:12px; --target:44px;
  --display:"Poppins",system-ui,sans-serif;
  --font:"Inter",Arial,system-ui,sans-serif;
  color-scheme:light;
}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){ /* isi sama persis dengan blok data-theme="dark" */ }}
:root[data-theme="dark"]{
  --paper:#0C1D33; --surface:#122B4A; --card:#122B4A;
  --soft-biru:#163456; --soft-hijau:#10382F;
  --line:#25405F; --line-cell:#25405F; --line-ctl:#6E88A3;
  --ink:#EAF1F8; --ink2:#A9BBCD; --head:#FFFFFF;
  --brand:#0A1830; --brand2:#1B4F6E;
  --accent:#3FC9A2; --accent-isi:#0A896A; --on-accent:#0C1D33;
  --data1:#65C7EC; --data2:#3FC9A2; --data3:#B9D75A; --data4:#9FB3C6; --data5:#2C7FA3;
  --ok:#3FC9A2; --warn:#F2955A; --bad:#FF8A80; --info:#65C7EC;
  --ok-bg:#10382F; --warn-bg:#3A2616; --bad-bg:#3A1B19; --info-bg:#163456;
  --fokus:#65C7EC;
  --shadow:0 2px 14px rgb(0 0 0/.35); --shadow-lg:0 8px 28px rgb(0 0 0/.5);
  color-scheme:dark;
}
```

Aturan token:
1. Dua blok gelap (`@media` dan `[data-theme="dark"]`) wajib identik; gerbang `gerbang-tema-kembar` membandingkannya.
2. Teks teal selalu `--accent`, tidak pernah `--accent-isi` atau `--meti-teal` (4,38:1, gagal AA).
3. Cyan dan lime BUKAN warna teks di latar terang (1,92:1 dan 1,62:1). Boleh sebagai isian, atau teks di atas navy.
4. Mode gelap adalah Navy turun satu tingkat, bukan hitam. Kepala (`--brand`) tetap lebih gelap dari kartu.
5. Merah tidak ada di palet METI; `--bad` hanya untuk galat dan aksi merusak, jarang.
6. Jarak: antar kartu `--gap` (12px), padding dalam kartu 16 sampai 20px, gutter halaman `--gut` (20px, 16px di bawah 600px).
7. Warna `--ok-bg`, `--warn-bg`, `--bad-bg`, `--soft-*` selain `#E3F4FB` dan `#E3F2EC` adalah usulan baru; pasangannya wajib lolos gerbang kontras sebelum dipakai.

### 2.1 Tabel kontras (AA teks 4,5; teks besar dan komponen UI 3)

Sumber: R5 §6.3 (luminans relatif), baris `--bad` dihitung perancang 7 Nov 2026. Gerbang `gerbang-kontras` membaca pasangan dari `tests/kontras.json` dan menghitung ulang dari `tema.css`; pasangan baru wajib didaftarkan di sana.

| Pasangan | Rasio | Hasil | Dipakai untuk |
| --- | --- | --- | --- |
| terang: `--ink` / putih | 18,03 | lulus | isi, angka |
| terang: `--ink` / `--surface` | 16,75 | lulus | isi di kotak lembut |
| terang: `--ink2` / putih | 7,08 | lulus | sekunder, keterangan |
| terang: `--ink2` / `--surface` | 6,58 | lulus | sekunder di kotak lembut |
| navy / putih | 14,28 | lulus | judul |
| petrol / putih | 7,49 | lulus | header tabel, fokus |
| `--accent` #07705A / putih | 6,04 | lulus | tautan, tombol |
| `--accent` / `--surface` | 5,61 | lulus | tautan di kotak lembut |
| putih / `--accent` | 6,04 | lulus | teks tombol utama |
| **METI Teal #0A896A / putih** | **4,38** | **gagal teks** | hanya isian dan ikon besar |
| METI Teal / `--surface` | 4,06 | gagal teks | hanya isian |
| lime / navy | 8,80 | lulus | nomor lime di kotak navy |
| cyan / navy | 7,44 | lulus | kata sorotan di kotak navy |
| cyan / putih | 1,92 | GAGAL | dilarang sebagai teks |
| lime / putih | 1,62 | GAGAL | dilarang sebagai teks |
| `--warn` #A8480A / putih | 5,84 | lulus | pil Hipotesis, perhatian |
| `--warn` / `--surface` | 5,42 | lulus | perhatian di kotak lembut |
| oranye METI #C55A11 / putih | 4,33 | gagal tipis | tidak dipakai sebagai teks |
| `--ok` #066B52 / `--ok-bg` | 5,62 | lulus | pil status baik |
| petrol / `--info-bg` | 6,63 | lulus | catatan info |
| navy / `--info-bg` | 12,65 | lulus | catatan insight |
| `--bad` #B3261E / putih | 6,53 | lulus | galat |
| `--line-ctl` / putih | 4,11 | lulus 3:1 | batas input dan kontrol |
| `--line` / putih | 1,36 | dekoratif | tidak boleh jadi satu-satunya tepi input |
| gelap: `--ink` / `--paper` | 14,88 | lulus | isi |
| gelap: `--ink` / `--card` | 12,54 | lulus | isi di kartu |
| gelap: `--ink2` / `--paper` | 8,62 | lulus | sekunder |
| gelap: `--ink2` / `--card` | 7,26 | lulus | sekunder di kartu |
| gelap: `--accent` #3FC9A2 / `--paper` | 8,14 | lulus | tautan |
| gelap: `--accent` / `--card` | 6,86 | lulus | tautan di kartu |
| gelap: teks tombol `--on-accent` / `--accent` | 8,14 | lulus | tombol utama |
| gelap: cyan / `--paper` | 8,82 | lulus | sorotan |
| gelap: lime / `--paper` | 10,43 | lulus | nomor |
| gelap: `--warn` #F2955A / `--card` | 6,27 | lulus | Hipotesis |
| gelap: `--bad` #FF8A80 / `--paper` | 7,42 | lulus | galat |
| gelap: `--line-ctl` / `--paper` | 4,61 | lulus 3:1 | batas kontrol |
| gelap: `--line-ctl` / `--card` | 3,89 | lulus 3:1 | batas kontrol di kartu |

Status tidak pernah hanya warna: selalu ada label teks Indonesia (dan Inggris di mode EN) dan, bila ada ruang, ikon.

## 3. Tipografi

Poppins untuk judul, angka, label, header tabel; Inter untuk isi (fallback Arial). Hosting sendiri: `public/fonts/poppins-{400,500,600,700}.woff2`, `inter-{400,500,600,700}.woff2`, subset Latin, `font-display:swap`, `preload` hanya Poppins 600 dan Inter 400. Angka selalu `font-variant-numeric:tabular-nums`.

| Token | Mobile / desktop | Bobot | Dipakai untuk |
| --- | --- | --- | --- |
| `--t-display` | 30 / 44 px | Poppins 700 | judul hero beranda |
| `--t-h1` | 24 / 32 px | Poppins 700 | judul halaman: kalimat temuan, kata kunci teal |
| `--t-h2` | 18 / 22 px | Poppins 600 | judul kartu |
| `--t-angka` | 28 / 40 px | Poppins 700, tabular | angka kunci di kartu |
| `--t-body` | 15 / 15 px, baris 1,55 | Inter 400 | isi |
| `--t-kecil` | 12,5 px | Inter 400 | sumber, keterangan |
| `--t-label` | 11 px, kapital, spasi .08em | Poppins 600 | pil kategori, label kecil |

- Paragraf isi rata kiri-kanan (`text-align:justify; hyphens:auto`, `lang` terpasang); judul, sel tabel, dan keterangan rata kiri.
- Judul halaman memakai kalimat temuan; kata kunci diberi `<em class="hl">` (teal di latar terang, cyan di kotak navy).
- Satuan di samping angka besar 40 persen dari ukuran angka (`GW`, `MW`, `%`).
- Mode EN memakai tumpukan huruf yang sama; tidak ada huruf kedua.

## 4. Cara memuat

Tanpa skrip dan gaya inline (CSP, KEAMANAN-PRIVASI §8). Posisi dinamis lewat atribut SVG atau `el.style.setProperty` (CSSOM, diizinkan CSP), tidak lewat atribut `style=` dan tidak lewat `onclick=`.

```html
<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Sensus perusahaan | Jaringan METI</title>
  <meta name="theme-color" content="#122B4A">
  <meta name="description" content="...">            <!-- kalimat Jawaban singkat halaman -->
  <link rel="preload" href="/fonts/poppins-600.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="/inti/tema.css?v=HASH">       <!-- 1 token -->
  <link rel="stylesheet" href="/inti/kepala.css?v=HASH">     <!-- 2 kepala -->
  <link rel="stylesheet" href="/inti/gaya.css?v=HASH">       <!-- 3 dasar, tombol ikon, tab -->
  <link rel="stylesheet" href="/direktori.css?v=HASH">       <!-- 4 komponen .ak-* (port) -->
  <link rel="stylesheet" href="/inti/jm.css?v=HASH">         <!-- 5 komponen .jm-* -->
  <script src="/tema.js?v=HASH"></script>                    <!-- sinkron di head: pasang data-theme sebelum cat pertama, localStorage dibungkus try/catch -->
</head>
<body>
  <header class="top">...</header>
  ...
  <script src="/i18n.js?v=HASH" defer></script>              <!-- t(), angka(), tanggal() -->
  <script src="/inti/umum.js?v=HASH" defer></script>         <!-- esc, nanti, hantu, kosong, galat, formatter -->
  <script src="/<halaman>.js?v=HASH" defer></script>
</body>
</html>
```

Aturan muat:
1. Urutan CSS tetap: tema, kepala, gaya, direktori, jm. `?v=` diisi penambah hash (port `versi.py`, gerbang `direktori-versi`).
2. Pustaka luar hanya MapLibre GL 4.7.1 dari cdnjs, dimuat malas saat peta dibuka, dengan `integrity` (SRI sha384) dan `crossorigin="anonymous"`; domain terdaftar di `_headers`. Pustaka lain (graf, grafik) tidak ditambah tanpa keputusan pemilik.
3. `gaya.css` asal membuat `<main>` fixed; halaman bergulir memakai `div` dan `body{padding-top:var(--top)}`.
4. Berkas `direktori.css` (238 KB mentah) ikut dimuat di halaman publik pada F1; ukur gzip dan LCP saat JM-E01 (ambang LCP 2,5 detik pada 4G). Bila terlampaui, pemilik diminta memutuskan pemisahan `ak-dasar.css`.
5. Teks tampil lewat `t(kunci)` dari `public/i18n/id.json` dan `en.json`; tidak ada teks Indonesia tertanam di JS layar baru (gerbang `gerbang-i18n`).

## 5. Anatomi halaman

Pohon (id dan kelas tetap; sama untuk semua halaman, KP D11):

```
body                              padding-top:var(--top)
  header.top                      navy, fixed, tinggi 60px, gradien tipis --brand ke --brand2
    button#burger.iconbtn         hanya < 1100px, aria-expanded
    a.jm-merek                    logo putih 40px + "Jaringan METI"
    nav.tabs#menu                 tab utama, digambar JS dari satu tabel halaman
    div.jm-bahasa                 tombol ID | EN (aria-pressed), simpan localStorage + ?lang=
    div.ak-dummy#dummy            dua ikon, HANYA Super Admin (D18)
    button#tema.iconbtn           ikon polos, simpan localStorage
  div.jm-pita                     pita "Draf kerja" (C-01), satu konstanta untuk mati
  div.jm-halaman                  maks 1240px, padding 0 var(--gut) 64px, grid gap var(--gap)
    section.jm-jawab              Jawaban singkat (semua halaman publik)
    section.jm-angka              kartu angka kunci
    section.ak-panel*             satu kartu per bagian
    section.jm-hitung             Cara menghitung
    section.jm-kutip              Cara mengutip + tanggal beku
  footer.jm-kaki                  navy, logo putih, tautan privasi/ketentuan/metode
  #akLembar #akSheet #akTip       lapisan: laci, lembar, tooltip grafik
```

Kepala:
- Latar `--brand`, di bawahnya garis lime 2px sepanjang 48px di kiri (`header.top::after`), penanda tangan METI (R5 §6.4).
- Logo: `logo_meti_white.png` 130 x 185 px, tinggi tampil 40px; minta SVG atau PNG 4x ke pemilik (R5 §8 butir 1). Di layar sempit tanpa ruang, logo berwarna dalam kartu putih bersudut bulat.
- Tab utama (publik): Beranda, Perusahaan, Peta, Rantai, Pembiaya, Wilayah, Kebijakan, Cerita, Metode; Direktori dan Admin hanya muncul bagi yang berhak. Di bawah 1100px tab turun menjadi panel burger; tab aktif `scrollIntoView`.
- Tombol ID | EN adalah dua tombol kompak di kepala (bukan deretan pilihan isi, jadi tidak diwajibkan ujung ke ujung); aktif berisi `--on-accent` di atas `--accent`.
- Tombol dummy dua ikon (tabung uji "isi", sapu "hapus"), hanya jika `GET /api/saya` mengembalikan peran `super`; isi ditentukan halaman yang dibuka (`dataContoh()` per halaman); hanya mengisi klien dan tidak menulis ke server.

Pita draf: `--info-bg`, teks `--ink`, ikon info. Isi `jm.pita.draf`. Tidak bisa ditutup. Dihapus lewat satu konstanta `PITA_DRAF=false` bila C-01 dijawab "resmi".

Footer: navy, logo putih, tautan Privasi, Ketentuan, Metode, Kontak; tanpa teks "METI asosiasi netral" (GD §9); tanpa nomor kontak sebelum pemilik memberi yang resmi.

Hero beranda dan `/direktori` memakai `.ak-kepala` (latar `--brand` dengan pola kontur SVG) berisi `h1`, kotak cari global `#akCari` (pintasan `/`), dan ringkasan angka `.ak-ringkas`.

## 6. Komponen

### 6.0 Aturan semua komponen

| Keadaan | Aturan |
| --- | --- |
| Memuat | Kerangka `hantuHtml` (kelas `.jm-hantu`) setinggi isi akhir, tanpa loncatan tata letak; angka berisi `...` lalu angka. Tanpa spinner penuh layar. |
| Kosong | `kosongHtml(nama)`: ikon, satu kalimat penyebab, SATU aksi berukuran normal (misal "Hapus filter"). |
| Galat | `role="alert"`, kalimat dari katalog galat (bukan pesan mentah atau jejak tumpukan), tombol "Coba lagi". |
| Luring | Pita kecil di atas halaman "Kamu sedang luring. Data yang tampil bisa lama." Data terakhir tetap tampil. |
| Gelap | Hanya lewat token; override `:root[data-theme="dark"] .jm-...` hanya bila token tidak cukup, dan tetap tanpa hex. |
| 390 px | Tanpa gulir horizontal halaman; target sentuh minimal 44px (area klik diperluas dengan padding transparan, bukan kotak tampak); tabel lebar bergulir di dalam kartunya. |
| Fokus | `:focus-visible` outline `--fokus` 2px offset 2px; tidak pernah `:focus`. |
| Gerak | `prefers-reduced-motion` mematikan gerak non-esensial dan simulasi. |
| Klik | Chrome kontrol (gaya aktif, `aria-pressed`) berubah seketika di handler; render berat (tabel, grafik, peta) ditunda lewat `nanti()` (INP). Pencarian ketik di-debounce 120 ms. |

### 6.1 Komponen pakai ulang dari direktori (`.ak-*`)

Dipakai apa adanya; hanya token yang berubah. Nama kelas dipertahankan (KP D3).

| Komponen | Kelas | Dipakai di | Penyesuaian METI |
| --- | --- | --- | --- |
| Kartu bagian | `.ak-panel`, `.ak-dbagian > .ak-disi > h3` | semua | judul kecil kapital di dalam kartu; tidak ada yang menempel ke tepi |
| Deretan segmen | `.ak-seg`, `.ak-seg-lbl`, `.ak-urut` | sub-tab, urut, pemilih X/Y | wajib ujung ke ujung, dibagi rata, berikon (gerbang `direktori-seg`) |
| Chip pilihan | `.ak-chip` | filter sektor, provinsi | aktif `--brand` teks putih; hitungan `span` |
| Pil info dan kategori | `.ak-pil`, `.ak-r` (+ `.utama`) | profil, tabel | `.ak-r` jadi pil sektor netral berikon, tanpa `--w` per rumpun |
| Ikon | `.ak-ikon` | semua | stroke 1,5px, `currentColor` (§8) |
| Pencarian global | `.ak-cari-besar`, `.ak-cr`, `.ak-kbd` | kepala beranda dan direktori | placeholder dari kamus; `Esc` menutup |
| Ringkasan angka kepala | `.ak-ringkas` (+ `.enam`) | hero | kartu ikon + angka + label; klik membuka halaman (`data-go`) |
| Kartu orang dan lembaga | `.ak-daftar`, `.ak-nama`, `.ak-metrik` | direktori | baris ringkas: avatar inisial 40px, nama, satu baris meta abu, maks 2 pil |
| Lembar, sheet, drawer | `.ak-lembar`, `.ak-sheet`, `.ak-dlg`, `.ak-x`, `.ak-dkepala` | profil, laci | `Esc` menutup, fokus terkurung dan kembali ke pemicu |
| Grafik SVG | `.ak-gr-*`, `.ak-bars`, `.ak-bartip` | cerita, wilayah | setiap grafik interaktif dengan tooltip hover dan fokus papan ketik |
| Tooltip grafik | `#akTip.ak-gr-tip` | grafik, kuadran | satu instans |
| Peta dan panel samping | `.ak-side`, `.ak-pta`, `.ak-lbpeta` | `/peta` | lihat §6.14 |
| Daftar pendek | `.ak-dpbar` | `/direktori` | ekspor Excel, Word, PDF; tanpa kolom kontak kecuali PG, AD, SA |
| Paginasi | `PER_HAL`, `navHal` | tabel | `aria-live="polite"` |
| Tombol dummy | `.ak-dummy` | kepala | §5 |
| Toast | `.toast` | semua | bawah-kanan, `role="status"` |

### 6.2 Kartu angka kunci `.jm-angka`

Satu baris 4 sampai 5 kartu; tiap angka membawa penyebut jujur ("n dari N baris").

```html
<section class="jm-angka" aria-label="Angka kunci">
  <div class="ak-panel jm-angka-k">
    <span class="lbl">Entitas tercatat</span>
    <b class="jm-v" data-nilai="312">312</b>
    <span class="jm-sat">entitas</span>
    <small class="jm-pen">semua baris bersumber</small>
  </div>
  <div class="ak-panel jm-angka-k">
    <span class="lbl">Pendanaan terungkap</span>
    <b class="jm-v">Rp 4,2 T</b><span class="jm-est">EST</span>
    <small class="jm-pen">87 dari 312 baris</small>
  </div>
</section>
```

- Angka Poppins 700 `--t-angka`, satuan 40 persen ukuran; semua lewat `angka()` (id-ID di mode ID).
- Varian hero: latar `--brand`, teks putih, angka `--sorot`.
- Kartu dengan angka turunan membawa pil `EST` (§6.9) dan tautan "Cara menghitung".
- Memuat: `...` lalu angka. Kosong: tulis tanda strip `-` (bukan nol) dengan `title` "Tidak ada angka kredibel, kami tidak menebak". Galat: kartu tunggal berisi "Tidak bisa memuat angka" + Coba lagi.
- Gelap: kartu hero tetap navy dengan `--pendar`. 390 px: 2 kolom, kartu kelima penuh lebar.

### 6.3 Jawaban singkat `.jm-jawab`

Satu kalimat berstempel tanggal yang memuat sumber, tanggal, dan 3 sampai 4 angka kunci, bisa disalin ke jawaban orang lain (pola "According to" 1001startup.id).

```html
<section class="ak-panel jm-jawab" aria-labelledby="jawabH">
  <span class="lbl" id="jawabH">Jawaban singkat</span>
  <p>Menurut sensus Jaringan METI (diperbarui <time datetime="2026-11-07">7 Nov 2026</time>),
     <b>312</b> entitas energi terbarukan tercatat di <b>31</b> provinsi, <b>87</b> di antaranya
     mengungkap pendanaan.</p>
  <button class="iconbtn" data-salin aria-label="Salin kalimat" title="Salin kalimat"></button>
</section>
```

- Kalimat disusun dari kolom yang terisi; kolom kosong dibuang dari kalimat (bukan diisi tebakan).
- Selalu di atas angka kunci; isi sama dengan `<meta name="description">`.
- Memuat: dua baris kerangka. Kosong: kalimat "Belum ada data untuk dirangkum" + aksi. Galat: sama dengan §6.0.
- Gelap: `--soft-biru` jadi `--info-bg`. 390 px: tombol salin turun ke baris bawah, tetap 44px.

### 6.4 Cara menghitung `.jm-hitung`

```html
<section class="ak-panel jm-hitung">
  <span class="lbl">Cara menghitung</span>
  <dl>
    <dt>Total pendanaan terungkap</dt>
    <dd>Jumlah angka dolar yang tertulis di catatan putaran terakhir tiap entitas. Rupiah tidak dikonversi.
        <small>Dihitung dari 87 dari 312 baris.</small></dd>
  </dl>
  <p class="jm-batas"><b>Batas:</b> kapasitas terpasang, rencana, dan potensi tidak dijumlahkan.</p>
</section>
```

- Satu `dt` per angka yang bisa disalahbaca, dengan rumus tertulis dan batasnya. Ditutup (`details`) di 390 px, terbuka di layar lebar.
- Kosong: bagian tidak ditampilkan (bukan kosong). Galat: tidak berlaku (statis).

### 6.5 Cara mengutip `.jm-kutip`

```html
<section class="ak-panel jm-kutip">
  <span class="lbl">Cara mengutip</span>
  <p class="jm-kutip-teks">Kutip sebagai Sensus perusahaan, Jaringan METI, sensus ekosistem energi
     terbarukan Indonesia, diperbarui 7 Nov 2026. https://.../perusahaan</p>
  <p><small>Angka di halaman ini dibekukan pada <time datetime="2026-11-07">7 Nov 2026</time>.
     Profil terus diperbarui.</small></p>
  <button class="ak-tbl" data-salin>Salin kutipan</button>
</section>
```

- Tanggal beku = tanggal potret publik yang dipakai halaman (bukan tanggal buka). Profil entitas memakai pola "Kutip sebagai {nama}".
- Kosong: tidak berlaku. Galat salin: toast "Tidak bisa menyalin, pilih teksnya".
- 390 px: tombol penuh lebar.

### 6.6 Tabel sensus `.jm-tabel`

Tabel menempel penuh di kartu; header petrol `--brand2` teks putih Poppins 600 rata tengah; kolom pertama `--surface`; garis `--line-cell`; zebra `--soft-biru`; angka rata kanan `tabular-nums`.

```html
<section class="ak-panel jm-tabel-k">
  <div class="jm-bilah">
    <input class="ak-cari" type="search" aria-label="Cari entitas" placeholder="Cari 312 entitas">
    <span class="jm-n" aria-live="polite">312 tampil</span>
  </div>
  <div class="jm-gulir"><table class="jm-tabel">
    <thead><tr>
      <th scope="col" title="Nomor urut sensus">#</th>
      <th scope="col">Entitas</th><th scope="col">Sektor</th><th scope="col">Provinsi</th>
      <th scope="col" title="Jumlah pemasok yang bersumber">Pemasok</th>
      <th scope="col">Pelanggan</th><th scope="col" title="Kapasitas terpasang, MW">MW</th>
    </tr></thead>
    <tbody>...</tbody>
  </table></div>
  <p class="jm-pen">87 dari 312 baris punya data pendanaan.</p>
</section>
```

- Definisi kolom di `title` header. Sel tanpa angka kredibel berisi `-` (tanda strip, bukan nol, bukan tebakan). Sel turunan membawa `EST`; batas bawah membawa `min`. Entitas tanpa profil bertanda "Di luar sensus".
- Baris bisa difokus dan dibuka dengan `Enter`/`Spasi` (`data-ri`), membuka laci profil (§6.15).
- Urut: klik header; `aria-sort`. Paginasi `PER_HAL`. Render ulang ditunda `nanti()`.
- Memuat: 8 baris kerangka. Kosong: "Tidak ada entitas yang cocok" + "Hapus filter". Galat: kartu galat.
- Gelap: zebra `--soft-biru` gelap. 390 px: tabel bergulir di `.jm-gulir`, kolom Entitas dan # menempel (sticky) di kiri.

### 6.7 Chip sektor berhitungan `.jm-sektor`

Deretan membentang ujung ke ujung wadah, lebar dibagi rata, tiap chip berikon dan berhitungan; multi-pilih (OR).

```html
<nav class="ak-chip jm-sektor" aria-label="Sektor">
  <button aria-pressed="true" data-sektor="semua"><svg class="ak-ikon"><use href="#i-semua"/></svg>Semua <span>312</span></button>
  <button aria-pressed="false" data-sektor="surya"><svg class="ak-ikon"><use href="#i-surya"/></svg>PLTS <span>118</span></button>
  ...
</nav>
```

- Daftar sektor mengikuti `SEKTOR` di ALGORITMA §2. Hitungan menghormati filter lain (hitungan tidak pernah menampilkan 0 diam-diam; sektor 0 tampil redup dengan hitungan `0`).
- Baris kedua boleh berisi chip boolean berhitungan ("Pendanaan terungkap 87", "Punya proyek 140", "Anggota METI 42").
- Aktif `--brand` teks putih; tidak aktif `--surface` teks `--ink`. Filter tersimpan di URL (`?sektor=surya,angin`).
- Klik: aktif seketika, tabel dirender ulang lewat `nanti()`.
- Memuat: chip kerangka tanpa hitungan. Kosong: tidak berlaku. Galat: chip tetap tampil tanpa hitungan, ada ikon info.
- 390 px: grid `repeat(auto-fill,minmax(140px,1fr))`, dua sampai tiga kolom, tetap penuh lebar.

### 6.8 Baris fakta bersumber `.jm-fakta`

Satu fakta = label, nilai, lencana jenis sumber, domain, tanggal. Nilai berbeda antar sumber DITULIS, tidak dilicinkan.

```html
<div class="jm-fakta">
  <span class="lbl">Berdiri</span>
  <b class="jm-fv">2018</b>
  <span class="jm-bukti jm-b-resmi" title="Dokumen resmi: akta atau laporan yang menyebut fakta ini">
    <svg class="ak-ikon"><use href="#i-dokumen"/></svg>Dokumen resmi</span>
  <a class="jm-src" href="https://..." target="_blank" rel="noopener noreferrer">domain.id</a>
  <time class="jm-tgl" datetime="2026-10-23">Diperiksa 23 Okt 2026</time>
  <p class="jm-cat">Dua sumber berbeda: sumber A menyebut 2017, sumber B menyebut 2018.</p>
</div>
```

- Lencana jenis sumber (nama tampil di §7, kunci enum mengikuti ALGORITMA §3): Dokumen resmi, Laporan keuangan, Situs entitas, Data terbuka, Berita, Hitungan kami. Setiap lencana punya ikon dan label; `title` memuat arti dan, bila ada, KUTIPAN BEKU dokumen sumber.
- Tanpa `sumber_url` dan `tanggal_periksa`, baris TIDAK dirender (selaras D5; pipeline sudah menolak).
- Tautan luar selalu `target="_blank" rel="noopener noreferrer"`, hanya skema `https:` atau `http:`.
- Memuat: kerangka satu baris. Kosong (fakta belum ada): baris tetap tampil dengan tanda strip dan alasan, salah satu dari empat jenis strip: "Tidak dipublikasikan", "Belum ada", "Menunggu data K/L", "Belum kami cari". Galat: baris galat kecil.
- Gelap: lencana memakai `--info-bg`/`--ok-bg` gelap. 390 px: label di atas nilai, lencana dan tanggal turun satu baris.

### 6.9 Skor keyakinan `.jm-yakin`, pil EST `.jm-est`, pil Hipotesis `.jm-hipotesis`

```html
<section class="ak-panel jm-yakin">
  <span class="lbl">Seberapa yakin kami</span>
  <div class="jm-yakin-baris">
    <meter min="0" max="1" low="0.4" high="0.75" optimum="1" value="0.82" aria-label="Skor keyakinan 0,82 dari 1"></meter>
    <b class="jm-yv">0,82</b>
    <span class="ak-pil jm-y-tinggi"><svg class="ak-ikon"><use href="#i-centang"/></svg>Tinggi</span>
  </div>
  <p>Tiga sumber primer, dua cocok satu sama lain, terakhir diperiksa 23 Okt 2026.</p>
</section>

<span class="jm-est" title="Angka turunan hitungan kami, bukan yang diumumkan sumbernya. Cara menghitung ada di halaman Metode.">EST</span>
<span class="ak-pil jm-hipotesis" title="Belum diuji terhadap data pembanding. Cara menghitungnya terbuka.">Hipotesis</span>
```

- Skor 0 sampai 1 memakai `<meter>` bawaan (tanpa atribut `style`), angka `id-ID` dua desimal, label Tinggi (>= 0,75), Sedang (0,40 sampai 0,74), Rendah (< 0,40); rumus dan ambang mengikuti ALGORITMA §4 dan menang bila beda. Selalu ada kalimat alasan.
- `EST`: pil kecil `--info-bg` teks `--info`, kapital Poppins 600 11px, selalu menempel pada angka turunan; tooltip menjelaskan dan menautkan Metode. Tidak pernah dipakai pada angka yang diumumkan sumber.
- `Hipotesis`: `--warn-bg` teks `--warn`, dipakai pada skor/kuadran/matriks yang belum lolos uji (KP C-16), hilang hanya bila ALGORITMA menyatakan lolos.
- Memuat: batang kerangka. Kosong: "Belum dinilai" tanpa angka. Galat: tidak menampilkan skor palsu.
- Gelap: warna meter lewat token `--accent`. 390 px: batang penuh lebar, angka dan label di baris bawah.

### 6.10 Daftar pemasok dan pelanggan `.jm-rantai`

Pemasok di kiri, pelanggan di kanan, dikelompokkan per jenis hubungan dengan hitungan; entitas tanpa profil tetap tampil dengan "Di luar sensus".

```html
<section class="ak-panel jm-rantai">
  <span class="lbl">Rantai pasok</span>
  <p class="jm-pen">42 hubungan: 5 pemasok, 37 pelanggan. Tiap hubungan bersumber, diperiksa 7 Nov 2026.</p>
  <div class="jm-rantai-dua">
    <div class="jm-kol" aria-labelledby="pemH"><h3 id="pemH">Pemasok <span>5</span></h3>
      <h4>Modul <span>3</span></h4>
      <ul>
        <li class="jm-baris"><a class="jm-ent" href="/p/contoh-modul">Contoh Modul (contoh)</a>
            <span class="ak-pil">Di luar sensus</span>
            <span class="jm-kal">Memasok 4.554 panel surya.</span>
            <span class="jm-bukti jm-b-fin">Laporan keuangan</span>
            <a class="jm-src" href="https://...">domain.id</a><time>7 Nov 2026</time></li>
      </ul>
    </div>
    <div class="jm-tengah"><b>Contoh Entitas</b><small>5 masuk, 37 keluar</small></div>
    <div class="jm-kol">...Pelanggan...</div>
  </div>
  <p class="jm-janji">Tidak adanya tautan bukan berarti tidak ada hubungan, hanya belum ada sumber publik yang menyebutnya.</p>
</section>
```

- Dua kolom dengan kotak entitas di tengah (diagram dua sisi). Tiap baris: nama, kalimat hubungan (dengan angka teknis bila ada), lencana jenis sumber, domain, tanggal. Hanya hubungan teknologi dan manufaktur yang diikuti, tidak lewat rel bersama yang menyambung ke semua.
- Kolom kosong: "Belum ada pemasok yang bersumber" (bukan area kosong). Memuat: kerangka dua kolom. Galat: kartu galat.
- Gelap: token. 390 px: kolom ditumpuk (pemasok, kotak tengah, pelanggan); kelompok jenis dilipat (`details`) dengan hitungan di ringkasan.

### 6.11 Kuadran dua sumbu `.jm-kuadran`

SVG satu kanvas, skala sama 0 sampai 5 di dua sumbu, garis silang di MEDIAN, pemilih sumbu X dan Y (dua `.ak-seg` ujung ke ujung), titik = logo bundar atau inisial.

```html
<section class="ak-panel jm-kuadran">
  <span class="lbl">Kuadran</span>
  <span class="ak-pil jm-hipotesis">Hipotesis</span>
  <div class="jm-pilih">
    <nav class="ak-seg" aria-label="Sumbu X">...</nav>
    <nav class="ak-seg" aria-label="Sumbu Y">...</nav>
  </div>
  <svg class="jm-kv" viewBox="0 0 640 420" role="img" aria-label="Kuadran BUMN energi, sumbu X ... sumbu Y ...">
    <line class="jm-med" x1="320" y1="0" x2="320" y2="420"/><line class="jm-med" x1="0" y1="210" x2="640" y2="210"/>
    <g class="jm-titik" tabindex="0" role="button" aria-label="PLN, X 4,1, Y 3,2"><circle cx="..." cy="..." r="18"/><image href="/gambar/pln" .../></g>
  </svg>
  <table class="jm-tabel">...semua skor, angka kecil = peringkat dari N...</table>
</section>
```

- Empat kuadran diberi nama manusiawi dari ALGORITMA. Klik atau `Enter` pada titik membuka kartu skor (angka, alasan, sumber) di laci. Tabel semua skor di bawahnya adalah padanan teks (aksesibilitas); `-` bila tak ada angka publik, `=` bila seri.
- Posisi titik dihitung klien dan ditulis sebagai atribut SVG. Penyebut: "N dari M entitas punya skor".
- Memuat: kanvas kerangka. Kosong: "Belum ada entitas yang punya skor untuk dua sumbu ini". Galat: kartu galat, tabel tetap tampil bila sudah dimuat.
- Gelap: titik memakai `--data1..5`, garis median `--line-ctl`. 390 px: kanvas penuh lebar, pemilih sumbu ditumpuk, logo menjadi titik berinisial di bawah 480px.

### 6.12 Matriks risiko `.jm-risiko`

Baris = perusahaan (dikelompokkan), kolom = jenis risiko; sel = tingkat `Utama`, `Berbagi`, `Terbatas` + frasa 3 sampai 6 kata, dapat diklik membuka kutipan sumber dengan label kepercayaan.

```html
<table class="jm-tabel jm-risiko">
  <thead><tr><th scope="col">Perusahaan</th><th scope="col">Peralatan</th><th scope="col">Pembangunan</th>
    <th scope="col">Lahan</th><th scope="col">Daya</th><th scope="col">Modal</th><th scope="col">Pelanggan</th></tr></thead>
  <tbody><tr><th scope="row">Contoh Utilitas</th>
    <td><button class="jm-sel jm-t-utama" data-bukti="..."><b>Utama</b><span>Memasok jaringan</span></button></td>
    <td><button class="jm-sel jm-t-terbatas"><b>Terbatas</b><span>Tidak ada sumber</span></button></td>
  </tr></tbody>
</table>
```

- Tingkat dibedakan lebih dari warna: Utama = isian `--brand` teks putih; Berbagi = `--soft-biru` dengan garis kiri tebal `--brand2`; Terbatas = `--surface` dengan garis putus. Selalu ada kata tingkatnya.
- Sel `Terbatas` tanpa sumber berisi "Tidak ada sumber yang menyebut peran di sini, jadi dibaca terbatas." Label kepercayaan kutipan: Terkonfirmasi, Kata perusahaan, Dilaporkan, Hitungan kami. Pil `Hipotesis` pada judul sampai KP C-16 dijawab.
- Memuat: tabel kerangka. Kosong: baris tanpa data tetap tampil dengan alasan. Galat: kartu galat.
- Gelap: token. 390 px: tabel bergulir di kartu, kolom perusahaan menempel di kiri; frasa sel menyusut ke ikon tingkat + kata.

### 6.13 Logo bundar `.jm-logo-bundar`

Penanda peta dan titik kuadran: logo dalam lingkaran putih berborder `--line`, diameter 36px (28px di 390px), inisial `--brand` di atas `--soft-biru` bila logo tidak ada atau gagal dimuat (listener galat `capture`, bukan atribut `onerror`). Logo hanya dari R2 (`/gambar/:id`), tidak hotlink (KP C-15).

### 6.14 Peta `.ak-pta` dengan panel tarik `.ak-side`

Port peta Lembaga asal (KP D12): MapLibre GL 4.7.1, gaya `https://tiles.openfreemap.org/styles/positron` (terang) dan `/dark` (gelap), batas `[[94,-11.5],[141.5,6.5]]`, `minZoom 3`, `maxZoom 16`, `dragRotate:false`. Peta mengikuti tema; ganti tema memuat ulang gaya.

```html
<div class="ak-pta">
  <aside class="ak-side" id="akSide" aria-label="Panel peta">
    <div class="jm-tarik" role="separator" aria-orientation="vertical" tabindex="0" aria-label="Ubah lebar panel"></div>
    <div class="ak-ptaisi">cari saran, lapisan, legenda, Terbang ke</div>
  </aside>
  <div id="peta" role="application" aria-label="Peta proyek dan entitas"></div>
  <p class="jm-peta-alt">Entitas yang sama ada di <a href="/perusahaan">tabel sensus</a>.</p>
</div>
```

- Panel samping BISA DITARIK: pegangan 6px, kursor `col-resize`, hover garis `--accent`, panah kiri/kanan di pegangan mengubah lebar; lebar tersimpan di `localStorage` (`LEBAR_KEY`, try/catch). Di bawah 700px menjadi lembar bawah (`.ak-pta > .ak-side{top:auto;bottom:0}`) dengan tinggi mengikuti isi.
- Lapisan: proyek, entitas, METI Wilayah; legenda kartu putih berjudul Legenda; jejak "Indonesia > Provinsi"; "Terbang ke" provinsi memakai `/geo/provinsi.json` yang disederhanakan di bawah 150 KB; provinsi METI Wilayah `--accent-isi`, sorotan `--sorot`.
- Sampai 80 logo ditampilkan sebagai penanda DOM `.jm-logo-bundar`; selebihnya titik lingkaran di lapisan, logo muncul saat zoom. Titik ditempel ke jalan atau pusat wilayah; tampilkan "n dari N entitas ditempatkan" dan tanda `perkiraan` pada titik tanpa koordinat pasti.
- Memuat: kanvas kerangka `--surface` dan teks "Memuat peta". Kosong: "Tidak ada entitas di lapisan ini" + aksi "Nyalakan lapisan lain". Galat (WebGL atau tile gagal): kartu galat dan tautan ke tabel sensus.
- Penanganan klik/geser: handler ringan, render lapisan ditunda `nanti()` (pemeriksa `inp-reviewer`).
- Gelap: gaya peta `dark`, token panel. 390 px: panel jadi lembar bawah, target sentuh 44px.

### 6.15 Terhubung `.jm-terhubung` (dan graf ego)

Bagian "Terhubung" meniru asal (R1 §3): tetangga dikelompokkan per relasi, baris ringkas, klik membuka profil tetangga; "Sejenis" di bawahnya.

```html
<section class="ak-panel jm-terhubung">
  <span class="lbl">Terhubung <span class="ak-hit">18</span></span>
  <h3>Pengurus <span>4</span></h3>
  <ul class="jm-baris-orang">
    <li><button class="jm-baris" data-gid="P:123"><span class="ak-foto">AB</span>
        <span class="ak-nama">Nama Contoh (contoh)</span><small>Jabatan, Afiliasi</small>
        <span class="ak-pil">Anggota METI</span></button></li>
  </ul>
</section>
```

- Satu orang = satu profil; baris tetangga menampilkan avatar inisial 40px, nama, satu baris meta abu, maks 2 pil ikon. Jenis hubungan memakai kamus ALGORITMA §3 (nama tampil Indonesia dan Inggris).
- Graf ego (satu simpul dan 1 sampai 2 lompatan, di bawah 500 simpul) bersifat F2 dan hanya bila dituliskan di PRD: SVG buatan sendiri tanpa pustaka (seperti asal), simpul memakai seri `--data1..5` per jenis, ukuran simpul = derajat, sisi `--line-ctl` 1px dan terpilih `--accent` 2px, tooltip kartu mini, daftar teks setara, `prefers-reduced-motion` mematikan simulasi, dimuat malas saat tab dibuka. Pilihan pustaka graf (Cytoscape atau d3-force) BUKAN keputusan DS; tanya pemilik (KP aturan berhenti).
- Memuat: baris kerangka. Kosong: "Belum ada hubungan yang bersumber" plus kalimat janji (§6.10). Galat: kartu galat.
- Gelap: token. 390 px: daftar satu kolom; graf ego digantikan daftar teks.

### 6.16 Laci profil `.jm-laci`

Port `.ak-sheet`/drawer asal; profil entitas dibuka sebagai laci dari tabel, peta, dan Terhubung tanpa pindah halaman, dan juga sebagai halaman penuh `/p/<slug>`. Tiap bagian = kartu sendiri (`.ak-dbagian > .ak-disi`).

Urutan bagian (selaras JM-E03): kepala (logo bundar, nama, nama badan hukum, pil sektor, nomor sensus), Jawaban singkat, ringkas bertanggal, tombol situs dan Salin tautan, baris fakta (§6.8), Investor/Pembiaya, rantai (§6.10), Proyek, Terhubung (§6.15), Seberapa yakin kami (§6.9), Sumber, Sejenis, Ajukan koreksi.

```html
<aside class="ak-sheet jm-laci" id="akSheet" role="dialog" aria-modal="true" aria-labelledby="laciJudul" hidden>
  <header class="ak-dkepala">...<button class="ak-x" data-tutup aria-label="Tutup" title="Tutup"></button></header>
  <div class="ak-dtubuh" id="akSIsi"></div>
</aside>
```

- `Esc` menutup, fokus terkurung (`inert` pada latar) dan kembali ke pemicu, deep link `?p=<slug>`. Tinggi mengikuti isi (maks 92vh), tanpa label bagian yang mengulang judul.
- Kolom kontak hanya dirender bila peran berhak (KEAMANAN-PRIVASI §1); peran lain tidak menerima datanya dari server, bukan disembunyikan di klien.
- Memuat: kerangka bertahap per bagian. Kosong: bagian yang tak punya isi dibuang (bukan kartu kosong). Galat: kartu galat di dalam laci.
- Gelap: token. 390 px: lembar bawah penuh lebar dengan pegangan tarik, tombol Tutup 44px.

## 7. Kalimat antarmuka

Sapaan "kamu". Label tetap berikut dipakai di semua halaman lewat `t(kunci)`; `{x}` adalah isian. Angka selalu lewat `angka()`: format Indonesia (`toLocaleString("id-ID")`, titik ribuan, koma desimal) di mode ID dan format Inggris di mode EN (KP D17). Tanggal `7 Nov 2026` dengan nama bulan sesuai bahasa, jam 24 jam. Tanpa titik tengah sebagai pemisah teks. Terjemahan EN yang belum ditinjau penutur ditandai di `en.json` (KP C-14).

| Kunci | Indonesia | Inggris |
| --- | --- | --- |
| `jm.jawab` | Jawaban singkat | Short answer |
| `jm.hitung` | Cara menghitung | How this is counted |
| `jm.kutip` | Cara mengutip | How to cite |
| `jm.kutip.pola` | Kutip sebagai {nama}, Jaringan METI, sensus ekosistem energi terbarukan Indonesia, diperbarui {tanggal}. {url} | Cite as {name}, METI Network, census of Indonesia's renewable energy ecosystem, updated {date}. {url} |
| `jm.menurut` | Menurut sensus Jaringan METI (diperbarui {tanggal}), | According to the METI Network census (updated {date}), |
| `jm.beku` | Angka di halaman ini dibekukan pada {tanggal}. Profil terus diperbarui. | Figures on this page were frozen on {date}. Profiles keep updating. |
| `jm.est` | EST | EST |
| `jm.est.tip` | Angka turunan hitungan kami, bukan yang diumumkan sumbernya. | A figure we derived, not one the source announced. |
| `jm.hipotesis` | Hipotesis | Hypothesis |
| `jm.hipotesis.tip` | Belum diuji terhadap data pembanding. Cara menghitungnya terbuka. | Not yet tested against comparison data. The method is open. |
| `jm.strip.tip` | Tidak ada angka kredibel yang diumumkan; kami tidak menebak. | No credible public figure exists; we do not guess. |
| `jm.strip.1` | Tidak dipublikasikan | Not published |
| `jm.strip.2` | Belum ada | None yet |
| `jm.strip.3` | Menunggu data K/L | Awaiting ministry data |
| `jm.strip.4` | Belum kami cari | Not yet searched |
| `jm.janji` | Tidak adanya tautan bukan berarti tidak ada hubungan, hanya belum ada sumber publik yang menyebutnya. | Absence of a link is not absence of a relationship; it means nothing public says so yet. |
| `jm.luar` | Di luar sensus | Outside the census |
| `jm.n_dari` | {n} dari {N} baris | {n} of {N} rows |
| `jm.diperiksa` | Diperiksa {tanggal} | Checked {date} |
| `jm.pita` | Draf kerja, sumber publik saja, angka turunan berlabel estimasi. | Working draft, public sources only, derived figures labeled as estimates. |
| `jm.yakin` | Seberapa yakin kami | How well we know this |
| `jm.yakin.tinggi` | Tinggi | High |
| `jm.yakin.sedang` | Sedang | Medium |
| `jm.yakin.rendah` | Rendah | Low |
| `jm.sumber.resmi` | Dokumen resmi | Official document |
| `jm.sumber.fin` | Laporan keuangan | Financial filing |
| `jm.sumber.situs` | Situs entitas | Entity website |
| `jm.sumber.terbuka` | Data terbuka | Open data |
| `jm.sumber.berita` | Berita | News |
| `jm.sumber.hitung` | Hitungan kami | Our calculation |
| `jm.tingkat.utama` | Utama | Primary |
| `jm.tingkat.berbagi` | Berbagi | Shared |
| `jm.tingkat.terbatas` | Terbatas | Limited |
| `jm.tingkat.kosong` | Tidak ada sumber yang menyebut peran di sini, jadi dibaca terbatas. | No source names a role here, so it reads as limited. |
| `jm.percaya.1..4` | Terkonfirmasi, Kata perusahaan, Dilaporkan, Hitungan kami | Confirmed, Company's word, Reported, Our match |
| `jm.cari` | Cari perusahaan, lembaga, orang, proyek, regulasi, wilayah | Search companies, institutions, people, projects, regulations, regions |
| `jm.terbang` | Terbang ke | Fly to |
| `jm.legenda` | Legenda | Legend |
| `jm.terhubung` | Terhubung | Connected |
| `jm.sejenis` | Sejenis | Similar |
| `jm.koreksi` | Ajukan koreksi | Suggest a correction |
| `jm.salin` | Salin | Copy |
| `jm.tutup` | Tutup | Close |
| `jm.masuk` | Masuk | Sign in |
| `jm.keluar` | Keluar | Sign out |
| `jm.bahasa` | Bahasa | Language |
| `jm.tema` | Ganti tema | Switch theme |
| `jm.dummy.isi` | Isi data contoh | Fill sample data |
| `jm.dummy.hapus` | Hapus data contoh | Clear sample data |
| `jm.memuat` | Memuat | Loading |
| `jm.kosong.cocok` | Tidak ada yang cocok. | No match. |
| `jm.kosong.reset` | Hapus filter | Clear filters |
| `jm.galat` | Tidak bisa memuat. Coba lagi. | Could not load. Try again. |
| `jm.galat.ulang` | Coba lagi | Try again |
| `jm.luring` | Kamu sedang luring. Data yang tampil bisa lama. | You are offline. The data shown may be old. |
| `jm.hapus.konfirm` | Hapus {n} data? Tidak bisa dibatalkan. Unduh dulu? | Delete {n} records? This cannot be undone. Download first? |
| `jm.akses.ditolak` | Kamu tidak punya akses ke bagian ini. | You do not have access to this section. |
| `jm.peta.n` | {n} dari {N} entitas ditempatkan | {n} of {N} entities placed |
| `jm.peta.perk` | perkiraan | approximate |

Kata kerja tombol: Simpan, Batal, Setujui, Tolak, Salin tautan aktivasi, Nonaktifkan, Ubah peran. Tombol status (misal "Aktif") tidak tampil seperti tombol aksi. Judul halaman memakai kalimat temuan. Dilarang di teks antarmuka: "terbukti" untuk yang belum diuji, "METI netral", kata puitis, titik tengah, em dash.

## 8. Ikon

- Sumber: Fluent System Icons (regular, kontur 1,5px; 116 ikon siap pakai di `fluent_icons.json` paket template METI, R5 §5) dan Lucide (ISC) bila Fluent tidak punya. Satu keluarga per ikon; dalam satu kelompok tidak dicampur.
- Format: sprite SVG `public/img/ikon.svg` dipanggil `<use href="#i-nama"/>`; `fill:none; stroke:currentColor; stroke-width:1.5`; ukuran 18, 20, 24px; dekoratif `aria-hidden="true"`.
- Tombol ikon POLOS: tanpa border, tanpa latar, tanpa kotak; hover cukup ganti warna ke `--accent` atau membesar sedikit; satu-satunya garis adalah outline `:focus-visible`. Tiap tombol ikon punya `aria-label` dan `title`.
- Ikon penegas (bukan tombol) boleh dalam lingkaran isian `--soft-hijau` atau `--soft-biru`.
- Daftar yang dibutuhkan (nama final dipastikan saat JM-C01; bila Fluent tidak punya, pakai Lucide):

| Kelompok | Ikon |
| --- | --- |
| Sektor | semua, surya, angin, air, panas bumi, bioenergi, hidrogen, penyimpanan, jaringan listrik, efisiensi, kendaraan listrik, sampah jadi energi, terkait |
| Jenis sumber | dokumen, laporan keuangan, situs, data terbuka, berita, hitungan |
| Aksi dan kontrol | cari, tema, bahasa (globe), burger, tutup, salin, tautan luar, filter, unduh, daftar pendek (bintang), info, peringatan, centang, panah |
| Dummy | tabung uji (isi), sapu (hapus) |
| Peta | peta, lapisan, terbang, pin |

Logo METI: `logo_meti_white.png` di kepala, `logo_meti.png` di kartu putih; 130 x 185 px terlalu kecil untuk layar 2x, jadi tinggi tampil maks 40 sampai 48px sampai pemilik memberi SVG.

## 9. Lakukan dan jangan

| Lakukan | Jangan | Gerbang |
| --- | --- | --- |
| Setiap bagian = satu kartu `.ak-panel` dengan judul kecil di dalam | Bagian yang menempel ke tepi atau kepala bagian lepas | `direktori-layar`, `gerbang-kartu` |
| Deretan pilihan (segmen, sub-tab, pil filter, chip ringkasan) membentang ujung ke ujung, dibagi rata, tiap tombol berikon | Deretan sempit di tengah, tombol tanpa ikon | `direktori-seg` |
| Pakai koma, kalimat, label, atau baris baru sebagai pemisah teks | Titik tengah atau em dash sebagai pemisah | `gerbang-titik-tengah` |
| Tombol ikon polos tanpa border, kotak, atau latar | Tombol ikon berkotak atau berbingkai | `gerbang-ikon-polos` |
| Panel samping dan sidebar bisa ditarik, lebar tersimpan (try/catch) | Panel tetap tak bisa diubah | `direktori-layar` |
| Setiap grafik dan gambar interaktif dengan tooltip hover dan fokus | Grafik statis tanpa tooltip | `direktori-layar` |
| Kontrol berubah seketika, render berat ditunda `nanti()`; debounce ketik 120 ms | Membungkus SELURUH setState dalam transition; render sinkron saat klik | `direktori-klik`, `inp-reviewer` |
| Semua angka lewat satu formatter `angka()` (id-ID di mode ID); satu modul hitung per pertanyaan | Dua rumus untuk angka sama, format campur | `gerbang-i18n`, `selera-angka` |
| Tiap angka bersumber dan bertanggal; turunan berlabel `EST`; skor 0 sampai 1 dengan alasan | Angka tanpa sumber, presisi palsu, `0` untuk "tidak ada data" | `jaga_unggah`, `selera-angka` |
| Penyebut tiap total ("87 dari 312 baris") | Total tanpa penyebut | `selera-angka` |
| Skor dan kuadran yang belum lolos uji berpil `Hipotesis` | Mengklaim "terbukti" atau "terverifikasi" tanpa uji | `selera-angka` |
| Token dari `tema.css`, kontras AA, `:focus-visible` | Hex di CSS lain, `:focus`, teal asli sebagai teks | `gerbang-token-meti`, `gerbang-kontras` |
| Kepala navy bersama di semua halaman | Palet atau kepala lokal | `direktori-layar` |
| Tombol dummy dua ikon hanya Super Admin, isi per halaman | Tombol dummy untuk peran lain, dummy tanpa dihitung | `gerbang-dummy` |
| Teks tampil lewat `t(kunci)`, ID dan EN bersamaan | Teks Indonesia tertanam di JS, kunci hanya di satu bahasa | `gerbang-i18n` |
| Data pribadi hanya di lapis yang berhak, tidak pernah di potret publik | Menyembunyikan kontak lewat CSS atau JS | `tests/hak.test.mjs` |
| Skrip dan gaya eksternal, SRI untuk CDN | `style=`, `onclick=`, skrip inline | `gerbang-headers` |
| Fitur yang tidak jalan di platform ini disembunyikan | Dinonaktifkan dengan catatan kecil | pengulas |
| Rata kiri-kanan untuk paragraf isi | Rata kiri-kanan pada sel tabel dan judul | pengulas |
| Entitas "kita" (METI, METI Wilayah, METI Institute, METI Energi Muda) tanpa bintang "mitra strategis" | Menyebut METI "netral", memberi bintang pada METI sendiri | `hubung.test.mjs` |

Gerbang bertanda `gerbang-*` yang belum ada diajukan lewat `penulis-gerbang` dalam tiket JM-C07 dan JM-H02; dokumen ini tidak membuat tiket baru.

## 10. Checklist pengulas

Tandai sebelum bilang selesai; satu butir gagal berarti kembali ke pengerja.

- [ ] Hanya token `tema.css`; `grep -nE "#[0-9a-fA-F]{3,8}" public/*.css public/inti/*.css` hanya mengenai `tema.css`.
- [ ] Dua blok mode gelap identik; mode gelap tampil benar di 1440 dan 390 px, bukan hitam.
- [ ] Pasangan warna baru terdaftar di `tests/kontras.json` dan lulus AA.
- [ ] Teks teal memakai `--accent`; cyan dan lime tidak jadi teks di latar terang.
- [ ] Poppins untuk judul dan angka, Inter untuk isi, angka `tabular-nums`; huruf dihosting sendiri.
- [ ] Kepala navy bersama, garis lime, tombol ID | EN, tombol tema; dummy hanya Super Admin.
- [ ] Setiap halaman publik punya Jawaban singkat, angka kunci, komponen utama, Cara menghitung, Cara mengutip dengan tanggal beku.
- [ ] Tiap angka bersumber dan bertanggal; turunan `EST`; ada penyebut "n dari N".
- [ ] Skor keyakinan 0 sampai 1 dengan label dan alasan; skor belum diuji berpil `Hipotesis`.
- [ ] Fakta dan hubungan tanpa `sumber_url` tidak dirender.
- [ ] Tiap komponen punya keadaan memuat, kosong, galat, dan luring yang dirancang.
- [ ] Deretan pilihan ujung ke ujung dan berikon; tombol ikon polos; tiap bagian satu kartu.
- [ ] Panel samping bisa ditarik; di 390 px menjadi lembar bawah setinggi isi.
- [ ] Grafik dan kuadran interaktif dengan tooltip; ada padanan tabel atau daftar teks; tanpa gerak saat `prefers-reduced-motion`.
- [ ] Klik, tab, urut, filter tidak membekukan layar (kontrol seketika, subtree berat ditunda); `inp-reviewer` tanpa temuan tinggi.
- [ ] Tanpa `style=`, `onclick=`, skrip inline; CDN ber-SRI dan terdaftar di `_headers`.
- [ ] Kunci `id.json` sama dengan `en.json`; tanpa teks Indonesia tertanam di JS; angka dan tanggal lewat formatter.
- [ ] Pindai titik tengah dan em dash pada teks antarmuka dan dokumen: kosong (`gerbang-titik-tengah`).
- [ ] Tiga lapis tampil benar sesuai peran (publik, anggota, pengurus); kontak tidak ada di respons peran yang tidak berhak.
- [ ] Layar diperiksa di 1440 dan 390 px, terang dan gelap, ID dan EN; tanpa gulir horizontal halaman; target sentuh minimal 44px.
- [ ] Halaman 404 dan 500 dirancang; tiap layar punya satu aksi pada keadaan kosong.
- [ ] Tidak ada teks "netral", "terbukti", "Pantau Bencana", BNPB, atau karhutla di UI.
