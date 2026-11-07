# Riset desain METI untuk platform web (direktori jaringan energi terbarukan)

Disusun 7 Nov 2026. Sumber: SKILL.md ppt-format-meti v3, METI_Midnight_Energy_Palette.pdf, theme1.xml dan frekuensi srgbClr dari Katalog v3, Contoh v2, Mandatori, deck Sumut, deck DJPI, Struktur Organisasi, tiga PDF materi. Berkas sumber tidak diubah.

Folder kerja: `/private/tmp/claude-501/-Users-priyankaalfatehan28-Developer-poskokarhutla/e103ba63-5b39-4229-8371-ef441f13f506/scratchpad/meti-desain/`
Singkatan jalur: `$D` = folder di atas.

---

## 1. Palet METI persis

### 1.1 Midnight Energy (resmi, PDF palet + theme.xml Katalog v3 + SKILL.md)

Slogan palet: "Deep foundations. Electric highlights." Aturan pakai dari PDF: navy untuk kedalaman, teal + petrol untuk struktur, cyan untuk data, lime untuk sorotan (5 sampai 10% saja).

| Nama | Hex | Peran resmi | Slot theme.xml |
| --- | --- | --- | --- |
| Navy | `#122B4A` | fondasi, cover, judul, kartu hero, kotak kesimpulan, slide gelap | dk2 dan accent5 |
| Petrol Blue | `#155B79` | judul/struktur, header tabel, band header, label peta | accent2, folHlink |
| METI Teal | `#0A896A` | identitas inti, kata sorotan judul, tag, provinsi METI Wilayah, ikon | accent1, hlink |
| Electric Cyan | `#65C7EC` | data/sekunder, sorotan judul di latar gelap, pendar (glow) | accent3 |
| Lime Pop | `#B9D75A` | sorotan utama: nomor keypoint/pilar, provinsi highlight, angka di kotak navy | accent4 |
| Cloud White | `#F3F7FB` | latar bersih, kotak lembut, kolom pertama tabel | lt2 |
| (abu aksen) | `#7F8C99` | aksen netral | accent6 |
| dk1 / lt1 | `#000000` / `#FFFFFF` | teks isi / putih | dk1 / lt1 |

### 1.2 Warna turunan yang benar-benar muncul di slide (frekuensi srgbClr, Katalog v3 + deck Sumut)

| Hex | Dipakai untuk | Frekuensi (Katalog / Sumut) |
| --- | --- | --- |
| `#FFFFFF` | latar slide konten, kartu | 271 / 167 |
| `#D5DEE8` | garis tipis kartu, bingkai header/footer, pemisah | 216 / 85 |
| `#000000` | teks isi dan semua angka data | 150 / 67 |
| `#0A896A` | tag, sorotan, ikon | 96 / 45 |
| `#155B79` | header tabel, band | 79 / 40 |
| `#122B4A` | judul, kartu navy | 77 / 34 |
| `#DCE6EF` | garis sel tabel | 59 / 26 |
| `#5B6875` | teks sumber/keterangan (abu tua) | 34 |
| `#3E4C59` | teks sekunder lebih tua | 29 |
| `#B9D75A` | lime | 27 / 18 |
| `#F3F7FB` | kotak lembut | 26 / 15 |
| `#9FB3C6` | teks di latar gelap (redup) | 26 / 26 |
| `#E3F4FB` | biru muda: kotak catatan/insight | 16 |
| `#65C7EC` | cyan | 16 |
| `#E3F2EC` | hijau muda: kotak output/kemenangan | 3 (Contoh v2) |
| `#1E2A36` | teks gelap alternatif | 21 (Contoh v2) |
| `#C55A11` | oranye, HANYA status "belum"/penurunan | 4 (Contoh v2) |

### 1.3 Warna "bukan Midnight" yang ikut muncul (jangan dibawa ke web)

- Slide Tentang METI (Mandatori, disalin utuh ke semua deck): latar foto turbin biru, `#00357A`, `#1466A7`, `#2F5B96`, `#14333D`, lime `#89D957` / `#C9E265`. Itu aset foto yang dilarang diubah, bukan palet UI.
- Deck DJPI (versi lama): kepala gradien teal ke biru `#56BEBC` / `#0070C0`, navy `#182B4E`, font Aptos. Itu gaya v1 yang sudah tidak dipakai (SKILL.md: "template v1 yang sudah tidak dipakai").
- Struktur Organisasi: `#14333D` (hijau-petrol tua), abu `#595959`/`#DDE2E8`, kotak biru muda `#A3D9E9`. Diagram, bukan UI.
- Palet ORI (`#14333D`) hanya patut dipakai bila perlu padanan hijau-petrol tua untuk diagram jaringan; selain itu pakai Midnight.

### 1.4 Peran semantik yang disarankan untuk web

- Primer: Navy (kepala, judul, kartu hero). Struktur/aksi: Petrol dan Teal. Aksen data: Cyan. Sorotan: Lime (batasi 5 sampai 10%). Latar: putih dan Cloud White. Teks isi: hampir hitam. Status: ok = teal, perhatian/belum = oranye `#C55A11`, info = cyan. Merah tidak ada di palet METI; untuk galat/destruktif pakai merah gelap tambahan (`#B3261E`), jarang.

---

## 2. Tipografi

- **Poppins** (tema deck: major dan minor font Poppins/Arial): judul slide 20 pt, subjudul 20 pt, judul kartu/panel, tag, keypoint, SEMUA angka data, header tabel, kolom angka. Bobot dipakai: Regular dan Bold (di berkas: "Poppins" 295x, "Poppins Bold" di Mandatori). Judul cover tebal.
- **Arial**: isi poin, sel tabel teks, sumber, keterangan.
- Angka di kotak besar: otomatis 26 sampai 44 pt, Poppins Bold, satuan kecil ("%", "GW", "MW") di sampingnya.
- Aptos hanya di slide Mandatori (aset warisan), bukan standar.
- Skala ukuran yang terhitung di slide (kanvas 13,33 x 7,5 in): `sz` terbanyak 1200 (12 pt), 1000, 1250, 1600, 950, 2000, 1100, 1400; judul cover 3000 (30 pt) di Contoh v2.
- Warna teks: isi dan data penting hitam; abu hanya untuk sumber/keterangan/label referensi; judul navy dengan kata sorotan teal (latar gelap: cyan).

**Terjemahan web yang disarankan**: Poppins untuk judul, angka, label, header tabel (bobot 500/600/700); isi teks panjang Arial di deck, di web lebih baik **Inter atau system-ui** untuk isi supaya nyaman dibaca layar, tetapi bila ingin setia ke METI pakai `Arial, Helvetica, sans-serif`. Rekomendasi: judul Poppins, isi Inter dengan fallback Arial. Muat Poppins dari Google Fonts (weight 400;500;600;700), `font-display:swap`.

| Token | Ukuran (mobile / desktop) | Bobot | Dipakai untuk |
| --- | --- | --- | --- |
| `--t-display` | 30 / 44 px | Poppins 700 | judul hero beranda |
| `--t-h1` | 24 / 32 px | Poppins 700 | judul halaman (kalimat temuan, kata kunci teal) |
| `--t-h2` | 18 / 22 px | Poppins 600 | judul kartu/panel |
| `--t-angka` | 28 / 40 px | Poppins 700, `tabular-nums` | angka kunci di kartu |
| `--t-body` | 15 / 15 px | Inter 400, tinggi baris 1,55 | isi |
| `--t-kecil` | 12,5 px | Inter 400 | sumber, keterangan |
| `--t-label` | 11 px, huruf kapital, spasi 0,08em | Poppins 600 | tag/pil kategori (gaya "METI / STRATEGIC INSIGHTS" di PDF palet) |

---

## 3. Aturan dari SKILL.md dan Mandatori Template

SKILL.md (v3, 16 KB) memuat aturan deck. Yang relevan sebagai **wajib/larangan identitas** (bukan aturan alur kerja PPT):

**Wajib**
- Latar slide konten selalu **putih**; warna hanya di kotak (abu `F3F7FB`, biru muda `E3F4FB`, atau navy/teal untuk sorotan).
- **Semua kotak bersudut bulat**, radius 0,12 in (sekitar 12 px bila 1 in = 100 px kanvas).
- Logo METI selalu **kiri atas**, otomatis putih di latar gelap. Logo penyelenggara kanan atas cover/penutup, diberi kartu putih bila logonya berwarna.
- Garis tipis header (0,88 in) dan footer (6,9 in); `metiires.or.id` kiri bawah; nomor halaman selalu ada (kecuali cover dan penutup). (Catatan: tertulis "metiires.or.id" di SKILL.md dan slide; domain resmi METI di Mandatori/penutup `www.metiires.or.id`; konfirmasi ke pemilik sebelum menaruh di footer web.)
- Kotak keypoint: kotak navy kecil, nomor lime + judul butir.
- Kotak sorotan memakai **bayangan**; di latar gelap bayangan diganti **pendar cyan**.
- Judul dekat isi (jarak 0,15 in); kalimat kesimpulan memuat angka kunci; tiap tabel/chart diikuti satu kesimpulan.
- Semua angka data dan isi penting **hitam**; terang/lembut hanya untuk sumber, keterangan, dan teks dalam kotak gelap.
- Angka gaya Indonesia (titik ribuan, koma desimal), tanggal "25 Sep 2026". **Sumber** di tiap slide data; **Keterangan** bila ada singkatan.
- Ikon: set Fluent (Microsoft), gaya ikon Office, dapat diganti warna; banyak ikon, logo, foto; tidak ada slide teks polos.
- Slide "Tentang METI" (visi, misi, Lingkup Peran) wajib dan utuh. Teks resmi: "Sejak 1999, METI menjadi satu-satunya wadah yang menyatukan +1.800 anggota lintas rantai nilai energi terbarukan untuk menjadikan EBT pilar utama ketahanan energi nasional." Visi: "Menjadi katalisator utama percepatan energi terbarukan sebagai prioritas nasional pilar ketahanan energi dan motor pertumbuhan ekonomi hijau di Indonesia." Lima Lingkup Peran: Multi Classes Stakeholder Platform, Center of Excellence, Mitra Pemerintah, Mengembangkan Kompetensi SDM, Memberdayakan Masyarakat.
- METI Wilayah (Okt 2026) di deck v3: 8 provinsi (Aceh, Sumut, Riau, Kepri, Jabar, Jateng, Jatim/Surabaya, Sulut); deck Mandatori/UKP memakai angka berbeda (6 berdiri, 4 segera, 25 direncanakan), jadi **jangan menulis jumlah tetap tanpa konfirmasi pemilik**.

**Larangan**
- Tanpa em dash. Bahasa mengalir, tidak terasa tulisan AI.
- Jangan pakai logo tebakan; tanpa file logo penyelenggara muncul placeholder.
- Jangan mengarang angka (tulis `[angka menunggu konfirmasi]`).
- Oranye `C55A11` hanya untuk "belum"/penurunan. Lime maksimal 5 sampai 10%.
- Jangan ada kalimat yang menyebut posisi METI sebagai "asosiasi netral"; netralitas terasa dari isi. Jangan membela satu korporasi (termasuk PNRE atau PLN). Jangan menjanjikan komitmen METI (MoU, pendanaan) yang belum diputuskan pengurus; rumusan "METI siap menjadi mitra".
- Jangan memaparkan ulang kebijakan kepada pembuatnya. Untuk web: direktori tidak menyalin teks regulasi; tampilkan hubungan, pelaku, dan celahnya.

**Mandatori Template.pptx** hanya 4 slide contoh pemakaian (cover Telkom, cover Muhammadiyah, Tentang METI dengan foto turbin + 5 foto kegiatan, peta METI Wilayah 3D). Isinya aset konten yang wajib disalin utuh; slide 4 menyatakan "METI telah hadir di 5 Wilayah" dengan angka 6/4/25. Tidak ada aturan tertulis tambahan di dalamnya.

---

## 4. Pola visual dari deck nyata

PNG contoh (lembar kontak, 12 slide per lembar, 40 dpi):

| Berkas | Isi |
| --- | --- |
| `$D/png/palet-1.png` | PDF palet Midnight Energy (80 dpi, terbaca jelas) |
| `$D/png/katalog_1.png`, `katalog_2.png` | Katalog Template v3: 18 layout (cover, kerangka diskusi, tentang METI, struktur, peta wilayah, pembuka bab, dashboard bento, bar/garis/donut, tabel + trapesium, corong, timeline, kesimpulan gelap, penutup) |
| `$D/png/sumut_1.png` | Deck nyata Audiensi Gubernur Sumut (10 slide, format v3 dipakai sungguhan) |
| `$D/png/telkom_1.png`, `telkom_2.png` | SRE Telkom University (v1, 14 slide; masih memuat kartu tabel padat, kotak sorot merah) |
| `$D/png/ukp_1.png`, `ukp_2.png` | UKP Bidang Iklim (22 slide; bahasa visual "ringkasan eksekutif" lebih rapat, kartu ikon + pil "AGENDA STRATEGIS") |
| `$D/png/ruu_1.png`, `ruu_2.png` | Aspirasi RUU EBET (15 slide; tabel pasal berbaris panjang, peta isometrik 3D) |
| `$D/png/djpi_1.png` | deck DJPI (gaya lama, gradien teal-biru; hanya rujukan negatif) |
| `$D/png/mandatori_1.png`, `$D/png/struktur_1.png` | Mandatori + bagan struktur organisasi |
| `$D/x/kat_*.png`, `sumut_*.png`, `tel_*.png` dst. | halaman tunggal 40 dpi (naik ke 100 dpi dengan `pdftoppm -r 100 $D/x/pdf/kat.pdf`) |

PDF hasil render: `$D/x/pdf/{kat,sumut,djpi,mand,struktur}.pdf`.

**Pola yang terbaca**
- **Kartu**: putih atau Cloud White, sudut bulat 12 px, garis `#D5DEE8` 1 px, tanpa bayangan berat; kartu sorotan navy/teal dengan bayangan (gelap: pendar cyan). Tiap bagian = satu kartu dengan judul kecil tebal di dalam, ikon di pojok kanan atas dalam lingkaran teal lembut.
- **Kartu KPI (bento)**: label kecil, angka Poppins Bold besar (satuan kecil), pil perubahan (segitiga naik/turun, hijau teal / oranye), kartu hero navy 2x tinggi di kiri.
- **Tag dan keypoint**: pil kecil berlatar teal `#0A896A` bertulisan putih tebal (misal "Bauran Energi") di atas judul; di atasnya pil navy memuat nomor lime + judul butir ("01 Pembahasan Kondisi EBT").
- **Judul**: kalimat temuan Poppins Bold navy; angka/kata kunci teal (`#0A896A`) atau di latar gelap cyan.
- **Ikon**: Fluent regular, garis tipis, berwarna teal atau petrol, di dalam lingkaran/rounded-square bernuansa teal 10 sampai 15% (`#E3F2EC`/`#E3F4FB`). Ikon besar di lingkaran bergantian (layar "iconRow"). Selaras dengan selera pemilik: ikon polos tanpa garis luar.
- **Tabel**: header petrol `#155B79` teks putih Poppins tebal, kolom pertama Cloud White, garis sel `#DCE6EF`, baris zebra biru muda `#E3F4FB` pada tabel lebar; kesimpulan trapesium navy di kanan.
- **Grafik**: batang navy/teal/cyan, batang sorotan lime atau teal tua, kurung pertumbuhan % antar batang, garis tren dengan pita target, donut dengan angka besar di tengah + legenda persen berkotak warna, anotasi kecil berkotak oranye pucat ("Mulai adopsi bus & truk tambang"). Satu palet seri: navy, teal, cyan, lime.
- **Foto**: sampul = foto PLTS dari udara dengan fade putih kiri (`cover_fade.png`) agar judul terbaca; penutup = foto PLTP gelap dengan tint navy, logo putih, "TERIMA KASIH" besar putih; slot foto bulat sudut di pembuka bab dan di samping daftar. Foto kegiatan (5 foto kecil bersudut tegas) di slide Tentang METI.
- **Peta**: peta Indonesia isometrik 3D abu muda, tiap provinsi shape sendiri; provinsi METI Wilayah teal `#0A896A`, highlight lime `#B9D75A`; label kotak kecil petrol/biru dengan pin; legenda "Sudah terbentuk / Fokus paparan"; tanpa kotak angka (di v3). UKP/RUU memakai peta biru muda dengan 3 kotak statistik (6 / 5 / 25).
- **Slide gelap (kesimpulan)**: navy `#122B4A`, judul putih dengan kata cyan, empat kotak nomor lime (01 sampai 04) bergaris cyan lembut, banner teal penuh di bawah.
- **Struktur organisasi**: bagan kotak abu bergaris tipis, tanpa warna kuat, huruf sangat kecil; web sebaiknya diganti pohon interaktif.
- **Pembuka bab**: panel navy bersudut bulat dengan angka bab lime ("01"), judul putih, subjudul; kanan atas foto; di bawahnya daftar sub-bahasan berikon.
- Kecenderungan: padat angka, banyak kotak, tidak ada slide teks polos. Ini selaras dengan selera pemilik (padat, berisi).

---

## 5. Logo

Berkas yang disalin ke `$D/logo/`:

| Berkas | Varian | Ukuran | Keterangan |
| --- | --- | --- | --- |
| `$D/logo/logo_meti.png` | berwarna (untuk latar terang) | 130 x 185 px, PNG transparan | lambang dua tangan biru-cyan + tunas hijau + tulisan "METI" teal. Rasio 0,70 (potret). |
| `$D/logo/logo_meti_white.png` | putih (untuk latar navy/foto gelap) | 130 x 185 px, PNG transparan | dipakai otomatis di slide gelap dan penutup |
| `$D/logo/cover_photo.jpg` | foto sampul PLTS | 379 KB | foto aset template |
| `$D/logo/closing_photo.jpg` | foto penutup PLTP | 434 KB | foto aset template |

Catatan:
- Resolusi logo **rendah** (130 x 185). Untuk web butuh vektor/SVG atau PNG 2x, minta pemilik berkas aslinya. Sementara pakai tinggi maksimum 40 sampai 48 px di kepala situs (tajam di 2x layar).
- Di PDF palet logo dipasang di dalam **kartu putih bersudut bulat** di atas navy (versi berwarna dalam kartu). Pola ini bisa dipakai di kepala web: kepala navy + logo putih langsung, atau logo berwarna dalam kartu putih bila ruang sempit.
- Aset lain di `ppt-format-meti-v3.zip` (diekstrak di `$D/x/v3zip/ppt-format-meti/assets/`): `fluent_icons.json` (116 ikon Fluent, regular + filled, siap pakai sebagai SVG), `indonesia_provinsi.geojson` (34 provinsi, 711 KB, untuk peta web), `struktur_organisasi.png`, `cover_fade.png`, `mandatori_tentang_meti.pptx`. Skrip `meti.js`/`peta.js` di `$D/x/v3zip/ppt-format-meti/scripts/` memuat proyeksi peta (bisa dibaca bila perlu meniru peta isometrik).
- Foto kegiatan METI ada di `$D/x/mand/ppt/media/` (image*.jpeg); hak pakai web perlu dikonfirmasi.

---

## 6. Terjemahan ke token web

### 6.1 Prinsip
1. Putih sebagai latar kerja, warna di kartu (selaras aturan METI dan selera Oyenza/pemilik: tenang, premium).
2. Tiga tingkat teal karena **METI Teal `#0A896A` tidak lulus AA sebagai teks di putih (4,38:1)**. Pakai `--teal` (identitas, ikon, isian besar) dan `--teal-teks` `#07705A` (teks/tautan/tombol, 6,04:1).
3. Cyan dan lime **tidak boleh jadi teks di latar terang** (1,92:1 dan 1,62:1). Hanya sebagai isian/aksen, atau teks di atas navy.
4. Gelap = Navy turun satu tingkat (`#0C1D33` latar, `#122B4A` kartu). Bukan hitam.
5. Teks isi hampir hitam bernuansa navy `#0B1726` (METI minta hitam; ini kontras 18:1 dan lebih serasi).
6. Format `oklch` dipakai direktori lama (tema.css); di sini hex dahulu supaya persis sama dengan deck; bila ingin konsisten dengan tema.css, konversikan di tahap implementasi.

### 6.2 Token CSS (terang dan gelap)

```css
:root{
  /* palet inti METI (tetap sama di dua tema) */
  --meti-navy:#122B4A; --meti-petrol:#155B79; --meti-teal:#0A896A;
  --meti-cyan:#65C7EC; --meti-lime:#B9D75A; --meti-cloud:#F3F7FB; --meti-oranye:#C55A11;

  --paper:#FFFFFF;        /* latar halaman (METI: latar konten putih) */
  --surface:#F3F7FB;      /* Cloud White: kotak lembut, kolom pertama tabel */
  --card:#FFFFFF;
  --soft-biru:#E3F4FB;    /* catatan, insight, baris zebra */
  --soft-hijau:#E3F2EC;   /* output, status baik */
  --line:#D5DEE8;         /* garis kartu (dekoratif) */
  --line-cell:#DCE6EF;    /* garis sel tabel */
  --line-ctl:#6F7F90;     /* batas input/kontrol, 4,11:1 di putih (syarat 3:1) */
  --ink:#0B1726;          /* isi dan angka */
  --ink2:#4A5A6B;         /* sekunder, 7,08:1 */
  --head:#122B4A;         /* judul */
  --brand:#122B4A;        /* kepala situs, kartu hero, tombol utama */
  --brand2:#155B79;       /* header tabel, struktur */
  --aksi:#07705A;         /* tautan, tombol sekunder, teks teal (6,04:1) */
  --aksi-isi:#0A896A;     /* isian ikon, tag, provinsi, grafik */
  --on-aksi:#FFFFFF;
  --data1:#122B4A; --data2:#0A896A; --data3:#65C7EC; --data4:#B9D75A; --data5:#155B79; /* seri grafik, urut tetap */
  --sorot:#B9D75A;        /* lime: nomor, highlight (5-10%) */
  --ok:#066B52; --warn:#A8480A; --bad:#B3261E; --info:#155B79;  /* teks status di putih, semua >=5,4:1 */
  --ok-bg:#E3F2EC; --warn-bg:#FBEBDD; --bad-bg:#FBE7E5; --info-bg:#E3F4FB;
  --fokus:#155B79;        /* outline :focus-visible, 7,49:1 */
  --shadow:0 2px 14px rgb(18 43 74/.08); --shadow-lg:0 8px 28px rgb(18 43 74/.16);
  --pendar:0 0 0 1px rgb(101 199 236/.35),0 8px 28px rgb(101 199 236/.18); /* kartu sorot di latar gelap */
  --r:12px; --r-lg:16px; --r-pil:999px; --top:60px;
  --font-judul:"Poppins",system-ui,sans-serif; --font:"Inter",Arial,system-ui,sans-serif;
  color-scheme:light;
}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){ /* sama dengan blok dark di bawah */ }}
:root[data-theme="dark"]{
  --paper:#0C1D33; --surface:#122B4A; --card:#122B4A;
  --soft-biru:#163456; --soft-hijau:#10382F;
  --line:#25405F; --line-cell:#25405F; --line-ctl:#6E88A3;   /* 4,61:1 di #0C1D33 */
  --ink:#EAF1F8; --ink2:#A9BBCD; --head:#FFFFFF;
  --brand:#0A1830;                                           /* kepala tetap lebih gelap dari kartu */
  --brand2:#1B4F6E;
  --aksi:#3FC9A2; --aksi-isi:#0A896A; --on-aksi:#0C1D33;     /* tombol teal terang + teks navy: 8,14:1 */
  --data1:#65C7EC; --data2:#3FC9A2; --data3:#B9D75A; --data4:#9FB3C6; --data5:#2C7FA3;
  --ok:#3FC9A2; --warn:#F2955A; --bad:#FF8A80; --info:#65C7EC;
  --ok-bg:#10382F; --warn-bg:#3A2616; --bad-bg:#3A1B19; --info-bg:#163456;
  --fokus:#65C7EC;
  --shadow:0 2px 14px rgb(0 0 0/.35); --shadow-lg:0 8px 28px rgb(0 0 0/.5);
  color-scheme:dark;
}
```
(Blok `@media` dark disalin persis dari `:root[data-theme="dark"]` agar pola sama dengan `tema.css` direktori lama: `prefers-color-scheme` dengan pengaman `:not([data-theme="light"])`, plus `:root[data-theme="dark"]`.)

### 6.3 Rasio kontras WCAG (dihitung dengan rumus luminans relatif; AA teks biasa 4,5; teks besar dan komponen UI 3)

| Pasangan | Rasio | Hasil |
| --- | --- | --- |
| terang: `--ink` #0B1726 / putih | 18,03 | lulus |
| terang: `--ink` / Cloud #F3F7FB | 16,75 | lulus |
| terang: `--ink2` #4A5A6B / putih | 7,08 | lulus |
| terang: `--ink2` / Cloud | 6,58 | lulus |
| deck `#5B6875` (sumber) / putih | 5,70 | lulus |
| navy #122B4A / putih (judul) | 14,28 | lulus |
| petrol #155B79 / putih | 7,49 | lulus (header tabel, fokus) |
| **METI Teal #0A896A / putih** | **4,38** | **GAGAL teks AA**, hanya isian/ikon besar |
| METI Teal / Cloud #F3F7FB | 4,06 | gagal teks |
| `--aksi` #07705A / putih | 6,04 | lulus (tautan, tombol) |
| `--aksi` / Cloud | 5,61 | lulus |
| putih / #07705A (teks tombol) | 6,04 | lulus |
| putih / petrol #155B79 | 7,49 | lulus |
| lime #B9D75A / navy | 8,80 | lulus (nomor lime di kotak navy) |
| cyan #65C7EC / navy | 7,44 | lulus (kata sorotan di latar gelap) |
| navy / lime (teks di pil lime) | 8,80 | lulus |
| navy / cyan (teks di pil cyan) | 7,44 | lulus |
| cyan / putih | 1,92 | GAGAL, larangan sebagai teks |
| lime / putih | 1,62 | GAGAL, larangan sebagai teks |
| oranye METI #C55A11 / putih | 4,33 | gagal tipis; pakai `--warn` #A8480A |
| `--warn` #A8480A / putih | 5,84 | lulus |
| `--warn` / Cloud | 5,42 | lulus |
| `--ok` #066B52 / `#E3F2EC` | 5,62 | lulus (METI Teal di sini hanya 3,79) |
| petrol / `#E3F4FB` | 6,63 | lulus |
| navy / `#E3F4FB` | 12,65 | lulus |
| `--line-ctl` #6F7F90 / putih | 4,11 | lulus 3:1 untuk batas kontrol |
| `--line` #D5DEE8 / putih | 1,36 | dekoratif saja; jangan jadi satu-satunya tanda tepi input |
| gelap: `--ink` #EAF1F8 / #0C1D33 | 14,88 | lulus |
| gelap: `--ink` / kartu #122B4A | 12,54 | lulus |
| gelap: `--ink2` #A9BBCD / #0C1D33 | 8,62 | lulus |
| gelap: `--ink2` / kartu #122B4A | 7,26 | lulus |
| gelap: `--ink2` / #183656 | 6,28 | lulus |
| gelap: cyan #65C7EC / #0C1D33 | 8,82 | lulus |
| gelap: cyan / kartu | 7,44 | lulus |
| gelap: `--aksi` #3FC9A2 / #0C1D33 | 8,14 | lulus |
| gelap: `--aksi` / kartu | 6,86 | lulus |
| gelap: lime / #0C1D33 | 10,43 | lulus |
| gelap: `--warn` #F2955A / kartu | 6,27 | lulus |
| gelap: teks tombol #0C1D33 / #3FC9A2 | 8,14 | lulus |
| gelap: `--line-ctl` #6E88A3 / #0C1D33 | 4,61 | lulus 3:1 |
| gelap: `--line-ctl` / kartu #122B4A | 3,89 | lulus 3:1 |
| putih / navy #122B4A | 14,28 | lulus (teks di kepala) |

Nilai `--bad` (#B3261E terang, #FF8A80 gelap) belum dihitung; hitung ulang saat dipakai. Warna `--ok-bg/--warn-bg/--bad-bg/--soft-*` (kecuali `#E3F4FB` dan `#E3F2EC`) adalah usulan baru di luar deck dan perlu dicek ulang di implementasi.

### 6.4 Komponen yang perlu

| Komponen | Spesifikasi turunan METI |
| --- | --- |
| **Kepala situs** | Bilah navy `--brand` penuh lebar, tinggi 60 px, logo `logo_meti_white.png` tinggi 40 px kiri, nama "Jaringan EBT METI" Poppins 700, tab nav, tombol tema (ikon polos). Pola kepala sama untuk SEMUA halaman (aturan pemilik: kepala bersama). Gradien tipis navy ke `#155B79` opsional, mengikuti `header.top` situs lama. Di bawahnya garis lime 2 px pendek (seperti garis aksen cover PDF palet) sebagai tanda tangan. |
| **Kartu** | `--card`, radius 12, garis 1 px `--line`, padding 16 sampai 20, judul kecil tebal di dalam kartu (aturan pemilik: setiap bagian = satu kartu, tidak ada yang menempel ke tepi), jarak antar kartu 12. Varian hero: navy, teks putih, angka lime. Varian sorot gelap: pendar cyan. |
| **Pil / tag** | Tinggi 22 sampai 26, radius penuh, Poppins 600 11 px kapital. Tag kategori: latar `--aksi-isi` teks putih (kontras 4,38, aman karena teks tebal 11 px: sebaiknya pakai `--aksi` #07705A latar agar AA). Pil nomor: navy teks lime. Pil status: warna semantik + label Indonesia. |
| **Chip pilihan (filter)** | Barisan membentang ujung ke ujung wadah, lebar dibagi rata, tiap chip beri ikon (aturan pemilik). Aktif = isian navy teks putih; tidak aktif = Cloud White teks `--ink`. Multi-pilih untuk bidang/teknologi (PLTS, PLTB, PLTA, PLTP, bioenergi, hidrogen). |
| **Tabel** | Header `--brand2` (petrol) teks putih Poppins 600 rata tengah; kolom pertama `--surface`; garis `--line-cell`; zebra `--soft-biru` pada tabel lebar; angka Poppins `tabular-nums` rata kanan; tabel menempel penuh di kartu; definisi kolom di `title` header; tanpa kaki sumber di kartu laporan bila mengikuti kartu standar pemilik, tetapi METI mewajibkan "Sumber" (tulis di bawah kartu data publik; konfirmasi mana yang menang). |
| **Tombol** | Utama: pill `--aksi` teks `--on-aksi` (selera pemilik: pill). Sekunder: pill Cloud White teks navy. **Tombol ikon: polos, tanpa border, tanpa latar, tanpa kotak**; hover cukup ganti warna (ke `--aksi`) atau membesar sedikit; `:focus-visible` memakai outline `--fokus` 2 px offset 2 (satu-satunya pengecualian garis). Target sentuh minimal 44 px (area klik diperluas dengan padding transparan, bukan kotak tampak). |
| **Panel samping bisa ditarik** | Sidebar/panel yang melayang di atas peta atau di sebelah daftar punya pegangan tarik lebar (gaya `.tarik` di `public/index.html` situs lama); lebar tersimpan per peramban (localStorage, dibungkus try/catch). Pegangan 6 px, kursor `col-resize`, hover garis `--aksi`; di mobile berubah jadi sheet bawah. |
| **Graf jaringan** | Simpul = anggota/organisasi/proyek; warna per jenis dari seri tetap `--data1..5` (navy, teal, cyan, lime, petrol), ukuran simpul = skala data, sisi `--line-ctl` tipis 1 px, sisi terpilih `--aksi` 2 px; hover memunculkan tooltip kartu mini; simpul terpilih memberi panel profil (kartu per bagian). Semua grafik interaktif dengan tooltip (selera pemilik). Mode gelap memakai seri gelap di atas. Sediakan daftar teks setara untuk aksesibilitas dan `prefers-reduced-motion` mematikan simulasi gerak. |
| **Peta** | Dasar abu muda `--surface` (peta Indonesia), provinsi METI Wilayah `--aksi-isi`, highlight `--sorot` lime, label kotak kecil petrol dengan pin, legenda kartu putih berjudul LEGENDA, jejak "Indonesia ›" (pola situs peta lama), panel overlay berubin, kartu legenda. Sumber geometri: `$D/x/v3zip/ppt-format-meti/assets/indonesia_provinsi.geojson` (34 provinsi, 711 KB; perlu penyederhanaan ke <150 KB untuk web). Gaya isometrik 3D tidak perlu di web; cukup datar dengan bayangan lembut. |
| **Ikon** | Fluent System Icons (regular, kontur 1,5 px) atau Lucide; tampilkan dalam lingkaran isian `--soft-hijau`/`--soft-biru` bila perlu penegasan, atau polos tanpa wadah di tombol. Ukuran 18, 20, 24. |
| **Angka besar** | Poppins 700 `--t-angka`, satuan 40% ukuran, pil perubahan (segitiga naik/turun; naik = `--ok`, turun/belum = `--warn`). Format Indonesia lewat satu formatter (titik ribuan, koma desimal). |
| **Kartu kesimpulan** | Navy, judul putih dengan kata cyan, nomor lime, mengikuti slide kesimpulan gelap. |
| **Footer** | Navy, logo putih, tautan, `metiires.or.id` (konfirmasi domain), nomor kontak resmi sesuai pemilik; tanpa teks "METI asosiasi netral". |

---

## 7. Selera pemilik yang relevan (dari WEBSITE.md, README starter-kit, tema situs lama, memori)

**Dari `~/.claude/WEBSITE.md`**
- Rujukan utama Oyenza: monokrom ala iOS, panel abu `#F5F5F7`, teks `#171717`, tombol pill, tanpa border berat, SATU warna aksen. Untuk METI: ganti dengan Midnight Energy, tetap tenang, pill, tanpa border berat.
- Detail dan konsistensi di atas segalanya: format angka/tanggal/jam yang beda, label beda nama, hitungan tak cocok antar layar dianggap bug. Satu formatter, satu modul hitung per pertanyaan bisnis.
- Angka harus benar dan bisa dicek; data dummy dihitung, bukan dikarang.
- Pasar Indonesia dulu: bahasa Indonesia, EN opsional (i18n ID/EN).
- Premium tapi tenang: bento grid, motion halus 60 fps hanya bila bermakna, hormati `prefers-reduced-motion`.
- Jujur: klaim di landing tidak melebihi kenyataan/kebijakan privasi.
- Siap rilis = lengkap: legal (privasi, ketentuan, UU PDP), empty state, error state, offline, 404 dan 500 dirancang, SEO (sitemap, robots, OG 1200x630, JSON-LD, `llms.txt`), PWA, dummy, tes.
- UI: tiap layar punya loading (skeleton), empty state dengan SATU aksi, error, offline; mobile 375 px tanpa scroll horizontal; target sentuh minimal 44 px; `:focus-visible` bukan `:focus`; kontras AA; destruktif harus konfirmasi yang menyebut dampak; klik tidak membekukan layar (aturan INP).
- Fitur yang tidak jalan disembunyikan, bukan dinonaktifkan dengan catatan kecil.
- Tombol isi data dummy sejak awal: dua ikon, Super Admin saja, isi ditentukan halaman yang dibuka (DUMMY.md).
- Armada agent proyek sejak hari pertama (AGEN.md).
- Dilarang: format campur, dua rumus untuk angka sama, klaim melebihi kebijakan, dev toggle/teks internal di produksi.

**Stack default (WEBSITE.md §3, README starter-kit)**: Next.js App Router + TypeScript, Tailwind v4 + shadcn/ui (Radix), Motion, Lucide, Zustand/Dexie bila local-first, Serwist PWA, Supabase (Postgres + Auth + RLS + Storage), react-hook-form + zod, TanStack Query/Table, shadcn Charts (Recharts, satu palet seri), Resend, Sentry + Umami. Hosting default Vercel + Supabase; **tetapi untuk platform METI target Cloudflare**, jadi perlu keputusan adaptor (OpenNext untuk Cloudflare Workers, D1/R2 sebagai ganti Supabase atau tetap Supabase). Starter-kit: tema G1 sampai G9 lewat `NEXT_PUBLIC_GAYA`, brand di `lib/merek.ts`, modul plug (AI, email, unggah, PWA/push, analitik, cron) mati sampai dinyalakan, tema di `app/globals.css` dibangkitkan dari `lib/tema/gaya.ts`, dan uji SQL/RLS wajib.

**Dari situs lama (`public/inti/tema.css` + `kepala.css`)**: token `--paper --card --surface --ink --ink2 --line --brand --brand2 --accent --ok --warn --bad --info`, radius 16/10, `--top:58px`, font Inter + Plus Jakarta Sans, dark lewat `prefers-color-scheme` + `[data-theme]`, kepala `header.top` gradien navy tetap, `.iconbtn` 34 px, `.lbl` 10,5 px kapital 800, toast bawah-kanan. Struktur token di 6.2 sengaja memakai nama yang sama agar mudah dipetakan.

**Dari memori pemilik (cadangan-akun)**
- Ikon tanpa garis luar: tombol ikon polos, tanpa border/kotak/latar; fokus keyboard tetap outline.
- Sidebar/panel samping wajib bisa ditarik; layar peta baru meniru peta utama (overlay berubin, legenda putih, jejak, tabel `.tb`).
- Kepala situs bersama di SEMUA halaman (logo, menu, tab, burger di layar sempit, tombol tema), token merek bersama, bukan palet lokal.
- Deretan pilihan (segmen, sub-tab, pil filter, chip ringkasan) membentang ujung ke ujung, dibagi rata, tiap tombol berikon; warna status bermakna + label Indonesia.
- Tiap bagian profil/sheet/drawer = kartu sendiri (putih, border 1 px, radius ~14, judul kecil kapital di dalam, jarak 12); baris daftar memakai satu komponen ringkas (avatar 40, nama, satu baris meta abu, maks 2 pil ikon 20 px); sembunyikan deskripsi generik; blok statistik mengisi penuh lebar; tidak ada yang menempel ke wadah.
- Tanpa pemisah titik tengah "·" di teks UI; pakai koma, kalimat, label, atau baris baru.
- Paragraf rata kiri-kanan (justify) dan setiap grafik/gambar interaktif dengan tooltip hover (29 Okt 2026).
- Direktori terhubung: setiap rekaman saling tautan, satu orang = satu profil; data baru lewat satu pintu gabung. Tidak memuat orang berkasus (bila berlaku di data METI, tanyakan aturan serupa).
- "Kita BNPB" pada direktori lama; untuk METI, penyajian dari sudut METI sebagai wadah anggota, tanpa memihak korporasi.
- Aturan baru pemilik masuk gerbang uji (`tests/agen/**`), bukan hanya memori; kartu laporan standar `.ex.ex-std` di proyek lama tidak berlaku untuk METI, tetapi pola kartu temuan (pil kategori + judul kalimat temuan + angka disorot) cocok dengan gaya slide METI.

---

## 8. Rekomendasi cepat dan hal yang perlu dikonfirmasi pemilik

1. Minta logo METI vektor (SVG) atau PNG minimal 4x; berkas sekarang 130 x 185 px.
2. Konfirmasi domain resmi (`metiires.or.id` vs `metiir.or.id`/`www.metiires.or.id` yang terlihat di deck), nama platform, dan jumlah METI Wilayah (8 vs 6/4/25 di deck lain).
3. Konfirmasi hak pakai foto (cover PLTS, penutup PLTP, foto kegiatan Tentang METI) untuk web.
4. Putuskan font isi: Inter (nyaman layar) atau Arial (setia deck).
5. Putuskan kebijakan "Sumber" di web: METI mewajibkan, kartu standar pemilik menghilangkannya; sarankan baris sumber kecil di bawah kartu data publik.
6. Putuskan adaptor Cloudflare (D1/R2 vs Supabase) sebelum memilih library graf (cytoscape atau d3-force, tanpa dependency besar bila memungkinkan).
