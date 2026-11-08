# Bedah 1001startup.id untuk pola "Platform Jaringan METI"

Dibaca 7 Nov 2026 (data situs: sensus "diperbarui 29 Okt 2026", rantai pasok "dicek ulang 29 Sep 2026"). Pengambilan: curl dengan User-Agent generik, tanpa login, tanpa formulir, tanpa cookie, sekitar 70 permintaan, sekali per halaman. Berkas mentah ada di `scratchpad/raw/`. Yang ditiru adalah POLA dan CARA PENYAJIAN, bukan isi.

Koreksi pemilik diikuti: tampilan visual tetap gaya METI (Midnight Energy, Poppins), bagian Desain sengaja ringkas (bagian 5). Bobot laporan ada di bagian 2, 3, 4, 7, 9.

Catatan penyebutan: di situs, "census" = sensus. Entitas utamanya perusahaan rintisan (startup), tapi pola yang sama dipakai untuk BUMN, BUMD, pusat data, dan eksportir UMKM. Itu sebabnya polanya bisa dipakai untuk jaringan energi.

---

## 1. Peta situs dan navigasi

### 1.1 Kerangka global (sama di semua halaman)

1. Pita atas satu baris huruf kapital kecil: `WORKING DRAFT · PUBLIC SOURCES ONLY · EVERY DERIVED FIGURE IS A LABELED ESTIMATE`. Di halaman rantai pasok pitanya diganti: `WORKING DRAFT · RELATIONSHIPS ARE PUBLISHED ONLY WHERE A NAMED DOCUMENT CARRIES THEM`. Jadi pita itu dibuat per jenis halaman, tetap satu kalimat janji kejujuran.
2. Kepala: logo "1001", tombol Menu, pemilih bahasa `EN / ID`, penghitung `N online` dan `169,740 views` (tautan "Stats →" ke /stats), tautan "Sign in" (untuk fitur Follow).
3. Menu (dua tingkat, satu kalimat penjelas di bawah tiap butir):
   - **Datasets**: Startups ("funding, investors, headcount and offices"), State companies BUMN ("on ten yardsticks, as a logo quadrant"), Regional companies BUMD ("and their joint operations with the BUMN groups"), Data centres ("who powers them, and the companies that own and build them"), Peering map, Exporters UMKM ("what they make, where they ship, how each was verified").
   - Berkas tunggal: **News**, **Research**, **Map**, **Supply chain**, **Investors**.
   - **Census**: Sectors, The monthly report ("four findings, figures frozen"), Billion-dollar startups, Valuation ("what the combined figure contains"), Y Combinator, Endeavor, Antler, Closed ("what stopped, with dates and sources").
   - **Method**: "How the numbers are made" (/coverage: anchors, inklusi, catatan), "The formal model" (/model: estimator ditulis dengan persamaan), "What the output figure is", "Where the line is" ("what is deliberately not counted, and why"), "Taken out" (baris yang dikeluarkan setelah cek hidup), About.
   - **Agents**: "The dataset" (privat, "held back, every figure is on its company page") dan "Lead search" (/leads, digerbang login: orang yang tepat di tiap perusahaan, dicari agen riset). Menu Agents adalah bagian yang TERTUTUP; sisanya publik.
4. Kaki: "1001startup.id, the census of Indonesian startups", tautan "Live traffic", "Cookies" (ke kebijakan cookie di vantis.sh), "Anchors: BPS", kartu "Who is building this" (nama pembangun, kontak). Halaman metode menambah "FX 17,701 · updated 2026-10-29".

### 1.2 Pohon URL (dari sitemap.xml, 2.389 URL, setengahnya pohon /id/)

| Jalur | Jumlah | Isi |
|---|---|---|
| `/` | 1 | beranda "company graph": 6 dataset |
| `/startups` | 1 | tabel sensus 558 baris |
| `/company/<slug>` | 595 (en) + 595 (id) | profil perusahaan |
| `/sector/<slug>` | 17 | 16 sektor + indeks |
| `/chain` | 1 | indeks rantai pasok, 330 perusahaan |
| `/chain/<slug>` | sekitar 160 | rantai pasok perusahaan sensus |
| `/chain/x/<slug>` | 172 | rantai pasok perusahaan "di luar sensus" |
| `/investors`, `/investor/<slug>` | 1 + 172 | peringkat dan portofolio investor |
| `/bumn`, `/bumn/<slug>` | 1 + 47 | kuadran 56 BUMN, peta grup per BUMN |
| `/bumd`, `/bumd/<slug>` | 1 + 53 | 719 BUMD, kartu per perusahaan daerah |
| `/data-center`, `/data-center/<slug>` | 1 + 8 | matriks daya, tabel risiko, "company web" per grup |
| `/umkm` | 1 | 1.410 eksportir (halaman tunggal, 2,7 MB HTML) |
| `/news`, `/news/<slug>` | 1 + 4 | cerita data |
| `/research`, `/research/<slug>` | 1 + 2 | makalah panjang (001, 002) |
| `/report/2026-10` | 1 | laporan bulanan, angka dibekukan |
| `/map`, `/map/kelurahan` | 2 | peta MapLibre |
| `/city/<slug>` | 5 | jakarta, bandung, surabaya, yogyakarta, bali |
| `/unicorn`, `/closed`, `/coverage`, `/model`, `/about`, `/stats` | 6 | halaman Census dan Method |
| `/llms.txt`, `/data/search-index.json` | 2 | untuk mesin |

URL ber-ID di `/id/...` untuk hampir semua halaman profil, tidak untuk /bumn, /bumd, /data-center, /umkm ("English only", dinyatakan di kartu beranda). Itu contoh jujur soal cakupan bahasa.

### 1.3 Teknologi (bukan Next.js)

- Halaman dirender server, HTML statis berisi data. Tidak ada `__NEXT_DATA__`, tidak ada `/_next/data`. CSS `px.css`, `builder1001.css`, JS vanilla per fitur (`home1001.js`, `nav1001.js`, `follow1001.js`, `wall1001.js`, `watch1001.js`, `px.js`, `consent.js`).
- Pencarian: satu berkas `GET /data/search-index.json` (469 KB, 2.909 baris). Bentuk: `{"v":"<stempel versi>","r":[[nama, jenis, "Sektor · Kota", slug, logo, nama hukum + provinsi], ...]}`. Jenis: `s` startup 558, `e` eksportir 1.410, `r` BUMD 765, `p` proyek pusat data 72, `b` BUMN 56, `d` grup pusat data 48. Dicari di klien. Pola ini cocok persis untuk METI (satu indeks JSON statis, tanpa mesin pencari).
- Data besar dibenamkan di HTML sebagai JSON inline (halaman /bumn memuat skor, alasan, dan rumus tiap BUMN dalam skrip), lalu JS menggambar kuadran. Tabel besar sudah ada di HTML sebagai `<table>` biasa (bisa dibaca tanpa JS), JS hanya menyaring dan mengurutkan.
- API: hanya `/api/me/follows` dan `/api/me/follow` (Follow, perlu login), `/api/wall/event` dan `/api/px/beat` (penghitung pembaca), `/api/watch/search`, `/api/netfac`, `/api/ixpfx` (peta peering, data PeeringDB). Tidak ada API data publik. `/robots.txt` bahkan melarang crawler indeks mereka sendiri masuk ke `/api/`, `/leads`, `/map`, `/stats`.
- JSON-LD di tiap profil: `Organization` (legalName, founder[], foundingDate, address, numberOfEmployees), `WebPage` (isPartOf Dataset "The Indonesian Startup Census", creditText "1001startup.id", dateModified), `BreadcrumbList`. Ini yang bikin mesin jawab bisa mengutip.
- `hreflang` en, id, x-default pada tiap profil; kanonik ke versi bahasa Inggris.
- Peta: MapLibre GL 6.11.2 dengan basemap Protomaps (data OpenStreetMap), kredit "© OpenStreetMap · Protomaps" di pojok.
- Penghitung "online" dan "views" dikelola sendiri (Umami self-hosted menurut kebijakan cookie), halaman /stats memisahkan "People" dari "AI answers", "AI search and training", "Search engines". Per 7 Nov: 169.740 pembacaan sejak 29 Agt 2026, dan 54% adalah crawler AI. Mereka sengaja memamerkan itu.

---

## 2. Per halaman: tujuan, komponen, urutan bagian, kalimat pola

Konvensi umum yang dipakai SEMUA halaman (ini yang paling perlu ditiru, lebih dari tampilannya):

- **Kalimat fakta berkepala "According to"**: satu kalimat berstempel tanggal, memuat nama sumber, tanggal, dan 3-4 angka kunci, ditulis supaya bisa disalin ke jawaban orang lain. Pola:
  `According to 1001startup.id (updated 29 Oct 2026), 558 Indonesian startups are on record, with US$18.7 billion in disclosed funding and an estimated 176,895 jobs. 16 of them belong to a big group or listed company and are flagged as such.`
  Profil: `According to the 1001startup.id census (updated 29 Oct 2026), Xurya was founded by Eka Himawan, Edwin Widjonarko and Philip Effendy in 2018; has 110 employees on record; disclosed funding of US$88M; its head office is in Jakarta Selatan.` Kalimat itu disusun dari field yang ada; field kosong dibuang dari kalimat (Xurya tidak punya "market capitalisation", Gojek punya, dan kalimat mengikutinya).
- **Baris "Cite as"**: `Cite as Xurya, 1001startup.id, the census of Indonesian startups, updated 29 Oct 2026. 1001startup.id/company/xurya`.
- **Tanda "-"** = tidak ada angka kredibel; tidak pernah diisi tebakan ("a dash means no credible public figure exists, we do not invent one").
- **Tanda `est`** di samping angka turunan; `min` untuk batas bawah; `trk` untuk sumber pelacak data (bukan pengumuman); `ipo`, `in parent`, `id only` sebagai penanda jenis.
- **Pengelompokan dengan hitungan**: judul kelompok + angka (`Energy 42`, `Hardware 4`).
- **Janji kejujuran di bawah daftar**: `Absence of a link is not absence of a relationship, it means nothing public says so yet.`

### 2.1 `/` Beranda

Tujuan: gerbang ke 6 dataset dengan satu janji ("every figure linked to the document that carries it").
Urutan:
1. Pita atas + menu.
2. Hero: judul `Indonesia's company graph.`, satu kalimat penjelas (`Startups, state and regional companies, data centres, exporters and where the internet's networks meet, six live datasets, every figure linked to the document that carries it.`), kotak pencarian, enam hitungan ber-label (`558 startups · 56 BUMN · 719 BUMD · 72 data-centre projects · 1,410 exporters · 80 internet exchanges`), lalu pita logo/nama berjalan (Startup Gojek, BUMN PLN, Data centre DCI, Exporters Coffee & Tea).
3. Enam kartu dataset bernomor `01`-`06`, tiap kartu: label nama, `Updated <tanggal>` (tiap dataset punya tanggal sendiri), judul tajuk, satu kalimat, 3 angka besar, SAMPEL isi dataset (10 baris teratas, kuadran mini, titik-titik BUMD, matriks daya mini, batang sektor eksportir), kalimat fakta "According to...", tautan `Browse all 558 →`.
Pola yang dipakai: **tiap dataset punya tanggal pembaruan sendiri**, dan kartu beranda adalah cuplikan hidup dataset (bukan ilustrasi).

### 2.2 `/startups` (tabel sensus)

Urutan:
1. Judul `Indonesia's startup graph.`; satu paragraf cakupan (`558 companies and counting, who they are, where they sit, what they raised, whom they employ, and what that activity adds to the economy. Built from public reporting and national statistics, across 17 cities: Greater Jakarta (485), Bandung (20), Surabaya (12) and 14 more. Search it like a phone book; read it like a census.`).
2. Kalimat fakta "According to...", dua tombol (Browse, See on the map).
3. Lima kartu angka dengan keterangan kecil pada tiap angka: `558 companies tracked`, `US$ 18.7 B disclosed funding · 249 of 558 rows`, `US$ 20.6 B combined valuation · 21 of 558 marked →`, `176,895 jobs, estimate`, `IDR 96.5 T output / yr, estimate · what this means →`. Catatan "249 of 558 rows" adalah penyebut kejujuran: setiap total menyebut berapa baris yang menyumbang.
4. Bilah alat: kolom pencarian (`Search 558 companies, name, sector, city…`), chip sektor (All + 16, satu aktif), baris chip kedua berhitungan sebagai penyaring boolean: `Y Combinator only · 24`, `Endeavor only · 30`, `Antler only · 19`, `Disclosed funding only · 249`, `Valuation on record · 25`, `Hide group companies · 16`, dan penghitung `558 shown`. Petunjuk baris: `Click any company for its full profile, funding, investors, head office, headcount and every source behind the row.`
5. Tabel: `# | Company | Sector | City | Funding US$M | Valuation US$M | Jobs est | Output est IDR bn/yr`. Sel angka membawa penanda (`5,300 trk min`, `3,100 est`, `2,900 in parent`, `Grab Indonesia ... id only`). Lencana inline (YC S15, ENDEAVOR).

### 2.3 `/company/<slug>` (profil), urutan bagian PERSIS

(contoh: /company/xurya; /company/gojek memakai bentuk sama)
1. Jejak: `1001startup.id / Climate & Sustainability / Xurya`.
2. Nama + nama hukum (`PT Xurya Daya Indonesia`), sektor, `Census #48 of 558`, label bidang satu baris (`climate/energy tech (no-upfront-cost rooftop solar leasing, C&I)`).
3. Kalimat fakta "According to the 1001startup.id census (...)". Baris "Cite as". Tombol: Visit website, See on the map, Follow.
4. Blok field berlabel (tiap field = label + nilai + domain sumber + catatan satu kalimat):
   - **Founders**: nama-nama, `founded 2018`, dua domain sumber, lalu catatan bukti dalam kalimat (`Founded in 2018 by ..., per investor East Ventures and youngster.id. East Ventures adds that the first two began the venture in 2017 and Philip Effendy joined later.`). Perbedaan sumber DITULIS, tidak dilicinkan.
   - **Disclosed funding**: `US$ 88 M`, sumber `acv.vc`; penanda `min` bila batas bawah; catatan bila angka agregat pelacak (`Cumulative venture funding... never disclosed as a single figure`).
   - **Last round**: `Growth round (US$55M, undesignated series) 2024`.
   - **Valuation** (bila ada): `US$ 3,100 M · Market capitalisation, read 2026`.
   - **People**: `110 employees`, tanggal baca (`Read 2026-06-30`) atau `Date of this figure not recorded`.
   - **Output**: `IDR 74 bn / yr est`, dengan rumus tertulis di bawahnya: `110 employees × Rp 675 million of value added per worker, the Rp 675 million default, this sector having no anchor of its own`.
   - **Where**: kecamatan dan kota (`Kebayoran Baru, Jakarta Selatan`).
5. **Investors**: nama-nama (chip tautan ke /investor/<slug>).
6. **Supply chain**: ringkasan (`42 technology & manufacturing links (0 suppliers, 42 customers). Every one links to the page or filing it came from; each was re-checked on 29 Sep 2026.`), lalu dua kolom Suppliers N / Customers N, tiap kolom dikelompokkan per jenis (Hardware 4, Energy 1, Software 3, Cloud & infrastructure 3), tiap baris: nama (tanda `outside the census` / `not in the census` bila tidak punya profil), kalimat hubungan, label bukti, domain sumber, tanggal dokumen. Baris kepemilikan di atasnya: `Owns Bank Jago 21.40% filing goinfra.co.id`. Tautan `The full chain, with every source quoted →`.
7. **Head office**: alamat lengkap; catatan presisi peta (`Pinned to the road it sits in, not to the building, the map dot is that approximate.`).
8. **Public contact**: surel peran dan tautan Careers, dengan baris etika: `Published on the company's own pages, read 2026-10-23. Role mailboxes and office lines only: no personal address is guessed and no mobile number is shown.`
9. **What the figures mean**: satu paragraf per angka yang bisa disalahbaca. Untuk Output: `Output is gross value added, what the company adds to GDP ... Revenue is a bigger number... Nobody publishes value added, so the census estimates it from headcount and a BPS sector anchor; funding, valuation and GMV never enter.`
10. **How well we know this**: skor `0.90 · high` + tingkat bahasa (`High, primary sources or filings`) + paragraf alasan. Lalu baris status situs: `Website live, checked 2026-08-29. Website responded normally when last checked`. Kadang `Every figure above was put to an adversarial re-check on <tanggal>, the numbers that survived are the ones shown.`
11. **Sources**: daftar `domain + URL penuh`, 3-6 baris (rata-rata 12-33 tautan eksternal per profil termasuk bukti rantai).
12. **Comparable in <Sektor>**: 6 nama + nomor urut sensus (`SUN Energy #86`).
13. Kaki: `Public sources only. Figures marked est are ours, derived and labeled, never disclosed numbers. How the estimates are built →`, tombol `← Back to the census`.

Catatan "Website blocked": di 20 profil yang saya periksa hanya muncul status "Website live, checked <tanggal>". Varian "blocked" tidak saya temui di halaman publik; kemungkinan hanya muncul bila pengecekan hidup gagal. Saran METI: tiga status (live, blocked/tidak bisa dicek, mati) dengan tanggal cek, karena situs BUMN dan koperasi sering menolak bot.

### 2.4 `/chain` dan `/chain/<slug>`, `/chain/x/<slug>` (rantai pasok)

Indeks `/chain`:
1. Judul `Who supplies whom`; paragraf cakupan (`The technology and manufacturing chain around Indonesian startups: who makes their products and parts, who supplies their materials and goods, whose hardware, software, energy and cloud they run on, and who buys from them. Suppliers on the left, customers on the right. The census is where the map starts, not where it ends, any company these chains run through can hold a page, in the census or outside it.`).
2. Satu kalimat angka: `732 supply-chain links and 41 ownership links (334 filing · 439 first-party), every one a claim some named document still makes today: an audited filing that names the counterparty, or a page published by one side of the relationship. Re-checked 29 Sep 2026.`
3. Chip jenis hubungan berhitungan: `Materials 19, Parts & components 9, Contract manufacturing 104, Goods 123, Hardware 90, Energy 86, Software 148, Cloud & infrastructure 147, Technology licence 6`.
4. Tabel `Company | Sector | Suppliers | Customers | Corporate` (angka masuk/keluar per perusahaan, `-` bila nol), urut dari yang terhubung terbanyak. Perusahaan di luar sensus tampil sejajar dengan label `outside the census` + nama hukum (Google Cloud 26, AWS 23, Alibaba Cloud 22, Alfamart 14 pelanggan).

Halaman rantai satu perusahaan (/chain/xurya), urutan:
1. Jejak `Supply chain / Xurya`; judul; satu baris hitungan `42 technology & manufacturing links (0 suppliers, 42 customers). Re-checked 29 Sep 2026. The company profile →`.
2. **Diagram dua sisi**: kolom kiri `Suppliers 0` (`No supplier publicly evidenced yet.`), kotak tengah nama + sektor + `0 in · 42 out`, kolom kanan `Customers 42`, dikelompokkan per jenis (Energy), nama-nama sebagai chip.
3. `Every relationship`: daftar lengkap Suppliers lalu Customers. Baris = nama + `outside the census`/`not in the census` + kalimat hubungan (dengan angka teknis: `4,554 panels, ~2.9 GWh a year`, `22.5 MW rooftop solar plant`) + label bukti + domain + tanggal. Tooltip pada tombol bukti memuat KUTIPAN BEKU dokumen: `Named in a company's own regulatory filing, "Below is the detail of revenue from customers which exceeded 10% from the total consolidated revenue: 2025 ... PT Berau Coal Energy Tbk 58.126.355.000 17,71% ..."`.
4. Angka konsentrasi inline pada baris: `· 17.71% of SUN Energy's revenue` (dari catatan laporan tahunan).
5. `Supply chain map`: dua tingkat (suppliers' suppliers, customers' customers, `Buys from the same suppliers`), dengan aturan eksplisit: `Only technology and manufacturing links are followed, and never through a shared rail such as a hyperscaler, which links to nearly everything.`
6. `The documents`: daftar dokumen sumber (judul, penerbit, tanggal, "Audited consolidated FS FY2025: Note 26 purchases >10% of revenue ...").

Halaman `/chain/x/<slug>` (perusahaan di luar sensus): sama, tapi diawali pernyataan `PT PLN. Not a census company, this page exists because census companies' chains run through it.` plus satu kalimat peran (`State electricity company; supplies charging power to Grab and buys rooftop solar from BTI Energy.`) dan tautan `Its website ↗`. Ini kunci: **entitas tidak harus anggota sensus untuk punya halaman**, cukup ada hubungan bersumber yang melewatinya.

Dua jenis bukti saja: **filing** (laporan tahunan/keuangan audit/dokumen regulator yang menyebut pihak lawan; 203 label di halaman yang saya baca) dan **first-party** (halaman yang diterbitkan salah satu pihak; 580 label). Tidak ada "berita".

### 2.5 `/investors` dan `/investor/<slug>`

Indeks: tabel `# | Investor | Companies | Portfolio disclosed funding | Jobs | Top sectors | Examples` (contoh: `East Ventures 73 · US$2.5B · 24,942 jobs`). Profil: kalimat jujur di atas (`Everything on this page derives from the census: the companies below name East Ventures among their investors, each with the source on its company page. A curated fund profile lands here when a per-fund verification pass runs.`), empat angka (`73 census companies backed`, `US$2.5B disclosed funding raised by that portfolio, all investors combined, not this fund's cheque`, jobs, sektor), tabel `The census portfolio` (`Company | Sector | Round note | Raised total | Jobs | Where`). Perhatikan peringatan "all investors combined, not this fund's cheque": angka tidak diklaim lebih dari isinya.

### 2.6 `/bumn` (kuadran skor dua sumbu)

Urutan:
1. Label `STATE COMPANIES · BUMN · 18 OCT 2026`; judul `Indonesia's state companies, mapped`; satu paragraf (`56 BUMN on ten yardsticks: where their money comes from and how much they handle, then national priority, strategic weight, duty, reach, prestige and risk. Pick two to see who sits where. Every score carries its reason and its source.`).
2. Kalimat fakta (`...hold 1,120 subsidiaries and stakes, and 50 of them are held by Danantara Asset Management. The largest by FY2025 revenue are Pertamina (Rp1,168 trillion) and PLN (Rp583 trillion).`).
3. Lima angka besar (56 placed, 1,120 subsidiaries/stakes (386 held directly), 50 held by Danantara in 14 sectors, `Rp131.41T dividends to Danantara 2025`, `1,046 → 200` target entitas).
4. **THE QUADRANT**: kanvas dua sumbu, tiap titik = logo bundar BUMN (14 terbesar berlogo; sisanya titik/inisial), garis silang di MEDIAN (`The lines cross at the median, so half the companies sit on each side of each line`), skala sama 0-5 di dua sumbu, pemilih `X` dan `Y` (10 ukuran) dan pemilih "Lens" bernama (`Where money comes from`). Empat kuadran diberi nama manusiawi (`State-funded`, `Twin engines`, `Small, self-standing`, `Market earners`). Klik logo membuka kartu skor, angka, dan sumber.
5. `ALL SCORES AND RANKS`: tabel semua skor, angka kecil = peringkat dari 56, `=` untuk seri, `-` bila tak ada angka publik; satuan rupiah triliun bertautan ke sumber.
6. `DANANTARA, IN FOUR FACTS`: empat butir dengan domain sumber di ujung.
7. `HOW THE SCORES WORK`: satu blok per ukuran dengan rumus teks (`finance = 5 × mean( pct(assets), pct(revenue), pct(net profit) )`), pita 0-5 yang didefinisikan (`public money 1 = under Rp1T, 2 = Rp1–5T ...`), dan `Limits`.
8. Tautan ke BUMD.

Halaman `/bumn/<slug>` (peta grup, mis. `/bumn/pln`): judul `PLN, by region and by company`; pita lebar = pendapatan per region (Jan-Jun 2026, Rp327,1 tn); blok `WHAT THE STATE ASKS OF PLN` (dua kartu bertag `Public duty` dan `National programme`, masing-masing satu kalimat bersumber, mis. `Asked by the government to speed up the 100 GW solar programme (October 2026). fortuneidn.com · 15 Oct 2026`); lalu `ITS 48 COMPANIES, BRANCH BY BRANCH`: anak usaha langsung selebar jumlah perusahaan di cabangnya, dengan persentase kepemilikan, tag `active` / `not yet operating`, fungsi (`power generation`, `primary energy (coal, gas, biomass)`, `EPC`). Ini PERSIS pola untuk pemetaan grup PLN/Pertamina di METI.

### 2.7 `/bumd` (perusahaan daerah)

Judul `What Indonesia's regions own`; tabel + sebar titik (aset skala log di sumbu X, laba bersih di Y, `Each dot is one company, in its latest published accounts. The fourteen largest by assets carry their logo.`), peringkat `Largest by assets`, kalimat statistik jujur (`197 of 521 report a net loss in their latest published accounts.`), `204 company pages · English only`. Hitungan terbuka tentang cakupan: `719 mapped of 1,092 per Kemendagri` (ada penyebut resmi).

### 2.8 `/data-center` (daya pusat data: halaman paling relevan energi)

Urutan bagian (ada daftar tautan lompat `Matrix · Who carries the risk · Company webs · Projects · Vendors · Rules · Method`):
1. Label `DATA CENTRES · INDONESIA · 17 OCT 2026`, judul `Who powers Indonesia's data centres`, kalimat fakta (`72 data-centre projects ... 48 of the 57 that could be placed by power source draw on the grid: PLN, PLN Batam or an estate utility`).
2. **THE POWER MATRIX**: baris = tapak (Greenfield, Brownfield), kolom = model daya (Grid-connected, Behind-the-meter, Off-grid, Hybrid renewable). Tiap sel: judul manusiawi (`PLN-first build`, `Own plant inside the fence`, `Self-powered park`, `PLN plus its own clean source`) + anotasi risiko satu baris (`largest scale, longest wait for 500 kV`), operator di sel, "Power from" (PLN 17, PLN Batam 8, Tamarin 4, Maxpower 4, CL Cikarang Listrindo 3), "Vendors named", dan `36 projects · 4,613 MW`. Sel kosong TETAP ditulis dengan alasan: `No retrofit found that runs its own generation day to day.`
3. Empat angka (57 proyek di matriks + 15 tak bisa ditempatkan, 48 grid, 10 di jaringan estat, 114 tautan vendor `66 confirmed`).
4. `WHAT THE MAP SHOWS`: empat paragraf temuan bertajuk tebal (`Estate utilities matter more than expected`, `Own power is rare and small`, `The rules explain the shape`) berisi angka rupiah dari laporan (mis. biaya listrik DCI Rp396,8 mlr dari Rp457,8 mlr ke Cikarang Listrindo).
5. **WHO CARRIES THE RISK**: matriks 10 perusahaan (kolom, dikelompokkan Vendors/Builders/Land and power/Operators and AI clouds) x 6 risiko (Equipment, Build, Land, Power, Capital, Customer). Tiap sel = tingkat `Primary` / `Shared` / `Limited` + frasa 3-6 kata (`Supplies the grid, builds substations`) dan bisa diklik: membuka kutipan sumber dengan label kepercayaan (`Confirmed`, `Company's word`, `Reported`, `Our match`). Tiga paragraf kesimpulan lalu `How the levels were set` (definisi tiga tingkat). Sel `Limited` berisi `No source names a role here, so it reads as limited.`
6. `Company webs`: 8 grup (DCI, BDx, NeutraDC, Digital Edge, DayOne, PDG, STT GDC, SM+), tiap grup punya halaman `/data-center/<slug>`: `Bottom line` satu paragraf, empat angka (`48 tied directly`, `125 sourced ties · 81 confirmed`), legenda bukti (`Confirmed · Company's word · Snippet only · Our inference`), diagram jaring dengan kotak bergaris putus = orang, kotak berwarna = kampus; lajur `Campuses and units`, `Tenants and customers`, `Built and equipped by`, `Works with it`.
7. `Projects`: 72 kartu proyek (nama, operator, lokasi, sel model daya, MW, status `live / planned / announced`, "Power from", `Follow`), dengan penyaring wilayah dan sel.
8. `Vendors`, `Rules` (aturan: pusat data hanya boleh beli listrik dari utilitas wilayahnya, wheeling belum diizinkan, dst.), `Method`. Legenda singkatan: `Greenfield = new site`, `BTM = generation on the customer's side of the meter`, `"plan" = announced only`, dan `Pictures are illustrations, not the real sites`.

### 2.9 `/umkm` (eksportir UMKM)

Judul `Indonesia's export supplier census.`; lima angka (`1,410 exporters`, `16 product sectors`, `33 provinces on record for 1,154 rows`, `372 verified beyond a listing`, `750 with a direct channel · 356 email · 434 phone · 602 site`); chip sektor; **chip tingkat bukti berhitungan** (`Verified shipper · 15`, `Confirmed shipper · 243`, `InaExport-verified · 114`, `Trade-show exhibitor · 60`, `Export-listed · 929`, `Marketplace seller · 49`); pilih provinsi; `Direct contact only · 750`; tabel `# | Exporter | Sector | Location | Products | Export markets | Contact`; hover pada lencana tingkat bukti menjelaskan artinya. Satu baris tabel = satu klaim yang diberi derajat verifikasi. Halaman ini satu berkas 2,7 MB (semua baris di HTML): untuk METI pecah per halaman atau muat JSON.

### 2.10 `/map` dan `/map/kelurahan`

Kanvas MapLibre penuh layar. Panel hitungan per wilayah (`Indonesia · 516`, `Greater Jakarta · 449`, `Bandung · 20`...). Tiap perusahaan = LOGO BUNDAR di alamatnya. Instruksi: `Drag to pan · scroll to zoom · click a logo`. Keterangan jujur: `516 of 558 companies placed`. Cadangan tanpa JS/WebGL: kalimat `The same companies are in the census table.` `/map/kelurahan`: "Biggest by kelurahan" (peringkat kelurahan menurut jumlah perusahaan). Titik ditempel ke JALAN, bukan gedung (dinyatakan di profil).

### 2.11 `/news` (cerita data) dan artikel

Indeks: `Data stories from the census.` + paragraf aturan (`Each post answers one question about Indonesian startups with the census's own numbers: dated, in a table, and linked to the company pages and the sources behind every row.`), lalu kartu berlabel topik (Funding, Jobs, Investors, Shutdowns, Research) + tanggal + judul berupa PERTANYAAN + kalimat "As of..." yang sudah memuat jawabannya.

Urutan artikel (diperiksa pada tiga artikel: funding rounds 2026, biggest employers, most active investors):
1. Label topik, `Data story`, tanggal; judul pertanyaan (`Which Indonesian startups raised money in 2026?`); subjudul satu kalimat (`23 companies ... Most were venture rounds, and most of those never said how much.`).
2. **Short answer** (kalimat "As of 18 October 2026, ..." berangka, dengan tautan ke profil).
3. Empat angka besar bertajuk kecil.
4. Satu grafik batang berurutan (`US$ million, as stated in the round`), judul bagian diikuti satu kalimat pengantar yang menyebut batasnya.
5. Tabel lengkap (`Company | Sector | What the census records | US$ million | Source`), kolom sumber = domain + `↗`, baris tanpa angka diberi `-` (tidak diisi).
6. Dua-tiga bagian "bukan semua ini X" (`Not all of it is venture money`, `Most rounds do not say how much`) yang menyingkap penyebut dan jenis peristiwa.
7. **How this was counted** (aturan hitung: `The census keeps each company's most recent round. A company is counted here when that round is dated 2026. Amounts are only the US-dollar figures written in the round's own record; rupiah and Singapore-dollar figures are left as written. 23 is the count among the 499 companies in the census, not every Indonesian startup that raised money in 2026.`).
8. **Using these numbers** (aturan kutip: `Quote any figure with the credit below and a link. For a figure about one company, link that company's page: that is where its sources are. The figures on this page were frozen on the date above; company pages keep updating.`) lalu baris `Source: 1001startup.id census, data frozen 18 October 2026, <URL>`.
9. `More from the census`: tautan ke cerita lain.

Kunci pola: **angka di artikel DIBEKUKAN pada tanggal**; profil terus diperbarui. Dua lapis: arsip beku yang bisa dikutip, dan data hidup.

### 2.12 `/report/2026-10` (laporan bulanan) dan `/research/*`

Laporan: empat temuan bernomor (`1 · THE MONEY`, `2 · THE BACKERS`, `3 · WHAT STOPPED`, ...), tiap temuan = kalimat-judul berupa pernyataan berangka (`Ten companies hold 62.7% of the disclosed money.`), satu paragraf, tabel 10 teratas. Tertulis `Free to cite with credit`. Catatan: angka laporan (438 startup) lebih kecil dari sensus kini (558) karena dibekukan Okt.
Research (001 Perdagangan dan komputasi, 002 Internet tanpa Singapura): makalah panjang dengan satu angka sorotan bergrafik, rentang ketidakpastian (`56% could not be carried (range 27-74%)`), dan janji `gives the calculation, the public data and every query needed to repeat the test`. Sumber lemah dinyatakan terang-terangan (`Source: supplied trade spreadsheets; original provider not independently authenticated.`).

### 2.13 `/closed`, `/unicorn`, `/sector/<slug>`, `/stats`

- `/closed`: `What stopped.`; alasan keberadaan halaman (`A census that only counts the living flatters the ecosystem twice`), 37 perusahaan, kolom `Company | Sector | City | Founded | Ended | What happened | Raised US$M | Why, and where it is written down`. "Nothing listed on rumour" adalah syarat masuk.
- `/unicorn`: daftar bernilai ≥ US$1B, tiga kelompok dipisah (`private marks`, `live market capitalisation`, `estimated`), kotak `What this page does not claim.`
- `/sector/climate`: judul `Climate & sustainability startups in Indonesia.`; kalimat `The census tracks 33 operating ..., US$144.6 million of disclosed funding across 12 companies, roughly 1,775 jobs (estimated), and IDR 1.2 trillion a year of output (estimated).`; empat angka; tabel perusahaan.
- `/stats`: lalu-lintas hidup, orang vs AI vs mesin pencari dipisah.

### 2.14 `/coverage` dan `/model` (halaman Method)

Lihat bagian 4 (isi lengkap). Struktur `/coverage` (diberi jangkar `#valuation`, `#output`): (a) `WHAT THE COMBINED VALUATION CONTAINS` (25 dari 558 punya valuasi; 4 dikeluarkan karena sudah ada di induk; tabel `Held out of the sum | US$M | Already inside | Why`), (b) `WHAT THE DISCLOSED-FUNDING TOTAL CONTAINS` (249 dari 558; 48 perusahaan angkanya hanya batas bawah; 136 raised-but-never-told; 119 tak ada putaran luar; 37 didanai induk luar negeri; 17 IPO/hibah/pinjaman; setiap baris tanpa angka menyebut SATU dari empat alasan), (c) `where the counting line is drawn` (inklusi: sektor, geografi, hidup), tabel `Not counted | Batch | Where it actually sits | Why not` (7 baris dengan tanggal pengecekan), (d) apa itu angka output, (e) `Taken out` (baris yang gugur uji hidup).
`/model`: lihat 4.2.

### 2.15 Halaman yang TIDAK ada

Saya tidak menemukan: halaman syarat penggunaan, halaman lisensi data, halaman privasi sendiri (semua 404: /terms, /privacy, /license, /legal), dan tidak ada halaman `/agents` publik atau unduhan dataset (menu "The dataset: private"). Satu-satunya dokumen hukum adalah kebijakan cookie di `vantis.sh/cookies/` (efektif 25 Jul 2026, Vantis Spark Technologies Pte. Ltd.): analitik Umami self-hosted, tanpa cookie iklan, tanpa pelacakan lintas situs, sinyal GPC/DNT dianggap "tidak". Aturan pemakaian ada di `/llms.txt`, `/about` (How to cite it), dan kalimat "Free to cite with credit".

---

## 3. Model data yang tersirat

### 3.1 Entitas dan field

**Company (startup, 595 slug termasuk non-sensus)**
`slug, name, legal_name, sector (16 nilai), field_label (satu baris deskriptor), census_rank, founders[] (nama + sumber), founded_year, hq_address, hq_kecamatan, hq_city, lat/lng (ke jalan), website, careers_url, public_contact{email_role, tel_office, source}, funding_usd_m {value, flag: min|trk|ipo|none, reason_if_null: unknown_amount|no_outside_round|parent_funded|non_equity}, funding_source, last_round {label, year, amount?}, valuation_usd_m {value, kind: private_mark|market_cap|estimate, as_of, in_parent?}, headcount {value, read_date, source, basis: linkedin|filing|tracxn}, output_idr_bn {value, formula_text, anchor_used}, badges[] (YC batch, Endeavor, Antler), group_flag (anak grup/listed), confidence {score 0-1, tier, rationale_text}, website_check {status, date}, sources[] {domain, url}, comparable[] (slug), updated_at`
**Investor**: `slug, name, portfolio[] (slug perusahaan), disclosed_funding_sum, jobs_sum, top_sectors`. Tidak ada profil dana terkurasi; seluruhnya diturunkan dari entri perusahaan ("derives from the census").
**Person**: hanya sebagai pendiri (teks + nama di JSON-LD) dan sebagai simpul "dashed box" di jaring pusat data; tidak ada halaman profil orang di sensus startup (data lead dijaga privat).
**Sector**: `slug, name, aggregates (count, funding, jobs est, output est)`; sektor ditetapkan oleh regex berurutan (first match wins), bukan oleh pengisi.
**ChainLink (hubungan rantai pasok)**: `from_slug, to_slug, direction (supplier→customer), kind (Materials | Parts & components | Contract manufacturing | Goods | Hardware | Energy | Software | Cloud & infrastructure | Technology licence), sentence (kalimat hubungan dengan angka teknis), evidence_type (filing | first-party), source_url, source_domain, document_date, quote (kutipan beku untuk tooltip), stake_or_share? (mis. 17,71% pendapatan), checked_at`. Aturan: **satu tautan = satu klaim dengan satu dokumen bernama yang SEKARANG masih membuat klaim itu**.
**OwnershipLink**: `parent, child, pct, evidence (filing)`.
**Outside-the-census entity** (`/chain/x/<slug>`): `slug, name, legal_name, one_line_role, website, in_census=false`. Lahir otomatis saat ada tautan yang melewatinya. Label di UI: `outside the census` (punya halaman rantai) atau `not in the census` (hanya nama).
**BUMN**: `slug, short, name, cluster, sector, scores{finance, earned, state, handled, reach, priority, strategic, responsibility, prestige, risk (0-5)}, why{<tiap skor>: teks rumus + bukti + tanggal}, weight, logo, revenue/assets/profit (FY), subsidiaries[]` dan pohon anak usaha dengan persentase, status (`active | not yet operating`), fungsi.
**BUMD**: `owner (prov/kab/kota), type (Rural bank | Water utility | Other business | Minority stake), assets, net_profit, latest_year, JV links ke grup BUMN`.
**DataCentreProject**: `id, name, operator, location, region, power_cell (greenfield|brownfield × grid|BTM|off-grid|hybrid), size_mw, status (live|planned|announced), power_from[] (PLN, PLN Batam, estate utility, own solar, own gas, own battery), vendors_named[], sources[] {url, evidence_level: Confirmed|Company's word|Reported|Our match|Our inference, quote}`.
**RiskCell**: `company × risk (Equipment|Build|Land|Power|Capital|Customer) → level (Primary|Shared|Limited), phrase, sources[]`.
**Exporter (UMKM)**: `name, sector (16), city, province, products, markets, trade_terms, contact_channels (email|phone|site), verification_tier (6 tingkat), source`.
**ClosedRecord**: `slug, year_founded, year_ended, status (Closed | Acquired then shut), cause, raised, source`.
**Story/Report**: `slug, topic, date, question_title, short_answer, figures_frozen_at, tables[], method_text, citation_line`.

### 3.2 Konsep lintas-entitas

- **Jenis tautan**: `filing` (dokumen regulasi/keuangan audit), `first-party` (halaman pihak sendiri). Di data pusat data ada empat tingkat: `Confirmed`, `Company's word`, `Snippet only`, `Our inference`/`Our match`. Bukti LEMAH tetap boleh ditampilkan asal ber-label.
- **"Outside the census"**: bendera inklusi. Entitas bisa dirujuk tanpa menjadi anggota.
- **Skor keyakinan 0-1** per profil, tiga tingkat teks: `high` ≥ 0,80 ("primary sources or filings"; contoh 0,90 Xurya, 0,85 SUN Energy, 0,80 Volta), `medium` 0,60-0,79 ("credible reporting, not company-confirmed"; 0,75 Dash Electric, 0,70 ALVA, 0,65 BTI Energy), `low` < 0,60 ("thin public record; the doubt is stated, not hidden"; 0,50 Charged Asia). Pembatas tingkat ini saya simpulkan dari 9 profil; ambangnya TIDAK dipublikasikan secara eksplisit.
- **Penanda EST** pada angka turunan (jobs, output) dan pada valuasi hasil carve-out (`3,100 est`).
- **Tanggal**: setiap angka punya tanggal-baca sendiri (`Read 2026-06-30`) atau "Date of this figure not recorded". Per halaman: `updated`; per rantai: `Re-checked 29 Sep 2026`; per situs: `checked 2026-08-29`.
- **Alasan kosong** yang bertipe: bukan sekadar blank; tiap `-` memiliki salah satu dari empat alasan (tidak diumumkan, tak ada putaran luar, didanai induk luar negeri, jenis modal lain).
- **Pengecualian ganda hitung**: `held out of the sum` untuk anak yang nilainya sudah termasuk induk.
- **Pengecekan hidup** (liveness screen): situs masih merespons, LinkedIn aktif, pemberitaan terbaru; yang gagal masuk `Taken out` atau `Closed`.

---

## 4. Metode

### 4.1 Prinsip pengumpulan dan pelabelan

1. **Hanya sumber publik**; tiap angka bertautan ke dokumen yang membawanya. Konflik antar sumber ditulis di catatan (contoh Charged Asia: angka Tracxn US$47,7 jt DITOLAK karena rilis SGX hanya mencairkan US$4 jt; angka yang bertahan dari "adversarial re-check" US$11,5 jt).
2. **Tidak menebak**: pendanaan, valuasi, dan jumlah pekerja tidak pernah diturunkan satu dari yang lain (`the census leaves those blank rather than borrowing a tracker's guess`). Pendanaan "min" untuk batas bawah.
3. **Penanda jenis uang**: ipo, hibah, pinjaman, sukuk dicatat tetapi dipisah dari putaran ekuitas.
4. **Pembekuan**: cerita dan laporan dibekukan pada tanggal; profil hidup.
5. **Pemeriksaan ulang**: rantai pasok `Re-checked 29 Sep 2026`; situs `checked 2026-08-29`; "Every figure above was put to an adversarial re-check on <tanggal>".
6. **Verifikasi berjenjang** untuk daftar besar (UMKM: enam tingkat).
7. **Etika kontak**: hanya surel peran dan nomor kantor; "no personal address is guessed and no mobile number is shown".
8. **Pembaruan**: sensus dibangun ulang berkala (stempel `29 Okt 2026`); `/data/search-index.json` membawa string versi berisi stempel waktu tiap dataset (`2026-10-29|2026-10-18|2026-10-17|2026-08-31|true|2026-10-23`). Itu pola cache-busting dan sekaligus tanda "tiap dataset punya tanggal sendiri".

### 4.2 Estimasi output (GVA) di `/model`

- Estimator: `G_i = h_i × a_s(i)`: pekerja (headcount, dicek tangan) × jangkar sektor (Rp juta nilai tambah per pekerja per tahun). Jangkar dari dua publikasi BPS (PDRB 2023 + Sakernas Agt 2023), dikurangi (δ), dicap (professional services cap 1.282 jt), digabung dengan rata-rata 675 jt. Sektor tanpa jangkar sendiri (Crypto, Climate & Sustainability) memakai **default 675 jt**, dinyatakan terang ("the conservative choice, not a measured one, and it is the first thing to revisit as those buckets grow"). Bank berlisensi dikecualikan dari cap (1.680 jt).
- **Angka tidak dipakai**: dana, valuasi, GMV tidak pernah masuk estimator; baris tanpa headcount menerbitkan NULL (54 dari 558) alih-alih diimputasi.
- **Pengganda tidak langsung κ = 1,5** dikenakan SEKALI pada portofolio, tidak per baris (dampak tak langsung satu startup sebagian adalah dampak langsung yang lain).
- **Model galat**: galat multiplikatif per baris; jumlah portofolio tahan terhadap ±50% galat independen; sumber ~5% adalah batas bawah pita jujur; sebab itu situs mengutip total portofolio dan jumlah sektor, "no single company row should ever be read as that company's measured output".
- **Gerbang waras**: `GMV gate` (output marketplace tak boleh melebihi pendapatan take-rate), `Payroll gate` (perusahaan pra-pendapatan ≈ payroll + penyusutan), `Null gate`.
- Diagram alir Mermaid disalin di halaman (`Mermaid source, copy for docs`), 10 persamaan EQ 1-10, tabel jangkar 15 sektor per jumlah perusahaan, pekerja, GVA (T Rp). Catatan ketidaksesuaian vintage (jangkar 2023 pada headcount 2026) dinyatakan sebagai konservatisme sengaja.
- Penjelasan awam di profil (bagian "What the figures mean"): nilai tambah, bukan pendapatan, bukan gaji.

### 4.3 Skor kuadran BUMN (contoh metode yang bisa ditiru persis)

- `finance = 5 × mean( pct(assets), pct(revenue), pct(net profit) )` dengan persentil di antara 56 BUMN; `earned` = rerata persentil pendapatan dan laba (aset sengaja dikeluarkan); `state` = rerata dua pita (uang publik per tahun dan utang berjaminan negara, pita 1-5 dengan batas rupiah tertulis); `reach` pita jumlah penduduk dilayani; `priority` 0-5 = instrumen formal (0-2) + peran program Presiden (0-2) + perhatian Presiden (0-1); `strategic` 0-5; `responsibility` berbobot (0,30 uang publik + 0,30 orang dilayani + 0,15 keharusan mandat + 0,25 eksposur negara); `prestige` jumlah lima bagian dikurangi penalti; `risk` jumlah empat bagian (hukum maksimal 3, distres keuangan 1, temuan audit 0,5, pergantian direktur 0,5).
- Setiap skor: **alasan tertulis berformat rumus + bukti**, contoh PLN: `P=1+2+1: RUPTL 2025-2034 (ministerial) being revised for 100 GW PLTS; lead grid/offtaker for PLTS 100 GWp and PSEL; Palace meeting 14 Oct 2026 ... S=2+2+1: electricity; national grid operator; economy-wide scale.`
- Aturan pelabelan bila data tertinggal: tahun terbaru yang tersedia ditampilkan di sebelah angka (Peruri 2023).

### 4.4 Skor keyakinan

Per profil: angka 0-1, label tiga tingkat, paragraf alasan bebas yang menyebut konflik bukti dan apa yang dikeluarkan. Plus status situs dengan tanggal. Alasannya ditulis oleh peneliti/agen, bukan dari rumus (tidak ada rumus publik untuk 0,85).

---

## 5. Desain (ringkas; visual METI tetap Midnight Energy + Poppins)

- Font mereka: Overused Grotesk (variabel) untuk teks, IBM Plex Mono untuk label/angka/penanda. Untuk METI: Poppins menggantikan grotesk; label kecil huruf kapital berspasi dan penanda `est/min/filing/first-party` tetap layak dibuat dengan gaya "label mono kecil" (atau Poppins 600 kapital kecil) agar bisa dipindai.
- Palet: dasar putih, teks hitam, abu `#52525B`, garis `#E7E7E7`, panel `#FAFAFA`, hijau "live" `#12703B`; **satu gradien penanda** oranye `#E8734B` → kuning `#F3C64B` → hijau `#7AB88A` → biru-teal `#4E7A96` (dipakai pada angka besar dan garis aksen). Untuk METI padanannya cukup satu gradien dari palet Midnight Energy.
- Tata letak: satu kolom lebar baca, jarak longgar, kartu bernomor `01`-`06`, label bagian huruf kapital kecil bersudut kotak (`THE COMPANIES`, `THE QUADRANT`), angka besar di atas label kecil dengan keterangan penyebut (`249 of 558 rows`). Tabel: kepala sedikit mono, angka rata kanan, baris klik penuh, lencana inline. Chip: bundar, aktif ditandai isi, dengan hitungan di dalam label. Mobile: matriks daya menggulir mendatar dengan petunjuk `Swipe across for the other power models →`.
- Pola interaksi yang berharga (bukan gaya): tooltip bukti berisi KUTIPAN dokumen; sel yang bisa diklik membuka sumber; kuadran dengan pemilih X/Y; peta logo bundar; jaring "company web" dengan kotak bergaris putus untuk orang.

---

## 6. Bahasa (ID/EN)

- Dua pohon URL: Inggris di jalur polos (kanonik), Indonesia di `/id/...`. `hreflang` en/id/x-default dan kanonik ke Inggris. Tombol `EN / ID` di kepala berpindah ke jalur padanan.
- Terjemahan HANYA antarmuka dan kalimat templat: `Sensus #48 dari 558`, `Menurut sensus 1001startup.id (diperbarui 29 Okt 2026), Xurya didirikan oleh ... pada 2018; tercatat 110 pekerja; pendanaan yang diumumkan US$88 juta...`, `Kutip sebagai ...`, `Pemasok 0`, `Pelanggan 42`, `Seberapa baik kami mengetahuinya`, `Sumber`, `Ikuti`. Angka diformat Indonesia pada versi ID (US$88 juta).
- Teks bukti dan catatan alasan TETAP bahasa Inggris pada versi ID (campuran). Halaman besar (BUMN, BUMD, data centre, UMKM) "English only" dan dinyatakan di kartu. Untuk METI: karena target dwibahasa penuh, rencanakan kolom `note_id` dan `note_en` pada catatan bukti sejak awal, dan tandai halaman yang baru satu bahasa.
- Tidak ada penerjemahan otomatis di sisi klien; templat kalimat fakta punya dua versi.

---

## 7. Isi relevan ENERGI (hanya nama, sektor, URL halaman, sumber primer)

### 7.1 Perusahaan rintisan energi/iklim (sektor "Climate & Sustainability" dan mobilitas listrik di sensus)

Halaman sektor: https://1001startup.id/sector/climate (33 perusahaan). Halaman perusahaan: `https://1001startup.id/company/<slug>`; rantai: `https://1001startup.id/chain/<slug>`.

| Nama | Sektor 1001 | Halaman 1001 | Sumber primer / situs yang mereka kutip |
|---|---|---|---|
| Xurya | Climate (PLTS atap C&I tanpa modal awal) | /company/xurya, /chain/xurya (42 pelanggan) | xurya.com siaran pers dan pendanaan (`xurya.com/en/news/renewable-energy-start-up-xurya-announces-major-funding-from-domestic-and-foreign-investors`), `xurya.com/company_profile/Xurya_Company_Profile.pdf`, acv.vc |
| SUN Energy | Climate (PLTS C&I, penyimpanan baterai) | /company/sun-energy, /chain/sun-energy (39 tautan) | sunenergy.id laporan tahunan 2025 (`sunenergy.id/cfind/source/files/sun-laporan-tahunan-2025.pdf`), rilis Series A US$25 jt, rilis dengan Huawei Indonesia |
| SolarKita | Climate (PLTS atap) | /company/solarkita | solarkita.com, cbinsights.com, cnbcindonesia.com (29 Jul 2026), teknologi.bisnis.com (investasi Schneider Electric Energy Access Asia) |
| Suryanesia | Climate (panel surya, pendanaan Intudo) | /company/suryanesia | suryanesia.com (about, news), technode.global (Des 2022) |
| BTI Energy | Climate (PLTS, Bali) | /company/bti-energy, /chain/bti-energy | btienergy.id (about, project: PLN Area Bali Selatan, Solusi Bangun Indonesia), companieshouse.id, newenergynexus.id |
| Voltron | lainnya (jaringan pengisian EV, ex-EVCUZZ) | /company/voltron | voltron.id, dapurpacu.id, dialeksis.com |
| Starvo | SaaS (stasiun pengisian/tukar) | /company/starvo | starvo.com (stations, about) |
| SWAP Energi (Smoot) | Mobilitas (tukar baterai) | /company/swap-energi | swap.id, dealstreetasia.com (Series A), indonesiabusinesspost.com |
| Electrum | Mobilitas (motor listrik, GoTo-Indika-TBS) | /company/electrum, /chain/electrum | electrum.id, goinfra.co.id (LK GOTO 30 Jun 2026), assets.thisistbs.com (LK TBS 2025), gojek.com |
| ALVA | Mobilitas (motor listrik, Indika) | /company/alva | indikaenergy.co.id (AR 2025, siaran pers), avcj.com |
| Dash Electric | Logistik (kendaraan listrik) | /company/dash-electric | dashelectric.co newsroom, news.dailysocial.id |
| Blitz Electric Mobility | Logistik (EV logistik) | /company/blitz-electric-mobility | rideblitz.com, prnasia.com, techverse.asia |
| Volta | Mobilitas (pabrik motor listrik Semarang) | /company/volta | voltaindonesia.com, katadata.co.id |
| Charged Asia | Mobilitas (e-bike langganan) | /company/charged-asia | charged.co.id, links.sgx.com (pinjaman US$4 jt), vmoto.com |
| Alner, Kepul, Rebricks, Plasticpay, Waste4Change, Rekosistem, Koltiva, Fairatmos, CarbonEthics, Jejakin, TruCarbon, CarbonX | Climate (limbah, karbon, rantai pasok komoditas) | /company/<slug-sama-dengan-nama-huruf-kecil> | situs masing-masing perusahaan; tidak dirinci di sini |

### 7.2 Entitas di luar sensus yang dilewati rantai energi (`/chain/x/<slug>`)

PLN (`/chain/x/pln`; sumber: pln.co.id, indonet.id laporan 31 Des 2025, sucaco.com), Cikarang Listrindo (`/chain/x/cikarang-listrindo`), TBS Energi Utama (`/chain/x/tbs-energi-utama`; sumber assets.thisistbs.com), Pertamina Patra Niaga (`/chain/x/pertamina-patra-niaga`), Huawei Indonesia (`/chain/x/huawei-indonesia`), Gogoro (`/chain/x/gogoro`), Devindo Surya Amora (`/chain/x/devindo-surya-amora`).

### 7.3 BUMN energi

| Nama | Halaman | Catatan |
|---|---|---|
| PLN | /bumn/pln (peta grup: PLN Indonesia Power, PLN Nusantara Power, PLN Batam, PLN Energi Primer Indonesia, PLN Icon Plus, PLN Enjiniring, PLN Nusa Daya dst., 48 perusahaan) | sumber: pln.co.id (pendapatan Jan-Jun 2026 Rp327,1 tn; subsidi Rp53,2 tn; kompensasi Rp77,4 tn), fortuneidn.com (100 GW PLTS, 15 Okt 2026) |
| Pertamina | /bumn/pertamina | klaster Energi, migas dan petrokimia; skor `why` per sumbu |
| MIND ID | /bumn/mind-id | mineral (mata rantai baterai) |
| Pupuk Indonesia | /bumn/pupuk-indonesia | pasokan gas |
| BUMD energi (daftar kartu) | Pema Global Energi (/bumd/pema-global-energi-pge), Jakarta Oses Energi (/bumd/jakarta-oses-energi-joe), Energi Negeri Mandiri (/bumd/energi-negeri-mandiri-enm), MUJ Energi Indonesia (/bumd/muj-energi-indonesia-muji), Jateng Petro Energi (/bumd/jateng-petro-energi-jpen), Sarana Patra Hulu Cepu (/bumd/sarana-patra-hulu-cepu-sphc), Petrogas Jatim Sampang Energi, Kutai Timur Energi, PT Lampung Energi Berjaya, Migas Hulu Jabar ONWJ, Petrogas Jatim Utama dan Adipodai, Ketenagalistrikan Kaltim | sumber: akun terbitan BUMD dan Kemendagri (jumlah 1.092) |

### 7.4 Pasokan daya pusat data (`/data-center`; halaman grup `/data-center/<slug>`)

Grup: DCI Indonesia, BDx Indonesia, NeutraDC, Digital Edge, DayOne, Princeton Digital Group, STT GDC, SM+ (Sinar Mas). Proyek energi-signifikan (nama, halaman jangkar, sumber primer yang dikutip):

| Proyek | Model daya | Sumber primer |
|---|---|---|
| DCI H2 Karawang (PLTS hingga 30 MW) | Hybrid renewable, greenfield | dci-indonesia.com/news (peresmian bersama Salim Group), eita.com.my (Furutec), sumarajaindah.com |
| SpaceDC JAK2 (genset gas sendiri 1,45 MW, pasokan PGN) | Behind-the-meter | powerprogress.com (mtu), datacenterdynamics.com, frontier-enterprise.com |
| Liquidstar edge modules Sumba (surya, luar jaringan) | Off-grid | datacenterdynamics.com |
| Aslan Jakarta Data Centre (40 MW, baterai 120 MWh, JIEP) | Hybrid, hanya rencana | w.media |
| Firmus NVIDIA DSX Batam (360 MW) | Grid, PLN Batam | firmus.co (rilis) |
| NeutraDC program AI dengan Danantara (hingga 1 GW) | Rencana, PLN | investortrust.id |
| PLN GI 150 kV "Data Center" GIIC (investasi >Rp312 mlr) | pasokan | zonapasar.com, digitaledgedc.com (2 x 725 MVA) |
| Cikarang Listrindo untuk DCI (Rp396,8 mlr dari Rp457,8 mlr biaya listrik 2025) | utilitas estat | laporan tahunan DCI |
| PDN 1 Cikarang, PDN 3 IKN | Grid | dokumen Komdigi |

### 7.5 Rantai pasok PLTS: contoh dua perusahaan dari 1001startup (struktur dan pelanggan, bukan salin teks)

- Xurya: 0 pemasok, 42 pelanggan, semua `first-party` dari xurya.com (siaran pers tertanggal 2020-2026; mis. Trans Mall Group 16 lokasi 12,34 MWp, 16 Sep 2026; Muliaglass dan Muliakeramik 22,5 MW, 29 Apr 2026; Uni-Charm 12 MWp). Pelanggan bertipe mal, pabrik, rumah sakit, hotel.
- SUN Energy: 1 pemasok (Huawei Indonesia, ESS baterai, sunenergy.id 18 Des 2023), 38 pelanggan; 11 di antaranya `filing` dari Laporan Tahunan 2025 (Berau Coal 17,71% pendapatan FY2025, Indah Kiat, Indocement 32,5 MW, Tjiwi Kimia, Pindo Deli, Lamipak), sisanya `first-party`.
Dari sini terlihat polanya: **hubungan "filing" lahir dari catatan atas laporan keuangan (konsentrasi pelanggan > 10%, aset kontrak, komitmen signifikan)**, bukan dari berita.

Perhatian: sumber primer bagi METI sebaiknya diambil LANGSUNG ke domain sumber tersebut (laporan tahunan, situs perusahaan), bukan lewat 1001startup.id. Daftar di atas hanya sebagai penunjuk.

---

## 8. Legal dan etika panen

### 8.1 Yang tertulis

**`/robots.txt`** (3,4 KB; kebijakan ditetapkan 2026-09-28) berisi tiga lapis yang SALING BERTENTANGAN:
1. Blok "Cloudflare Managed content": `User-agent: *` dengan `Content-Signal: search=yes,ai-train=no,use=reference` dan `Allow: /`; lalu `Disallow: /` untuk crawler pelatihan AI (Amazonbot, Applebot-Extended, Bytespider, CCBot, ClaudeBot, Diffbot, Google-Extended, GPTBot, anthropic-ai, Claude-Web, cohere-ai, MistralAI-Training, meta-externalagent, GoogleOther, Google-CloudVertexBot, KimiBot, dan lainnya). Komentar di atasnya menyatakan sinyal "no" adalah pencadangan hak sesuai Pasal 4 Direktif UE 2019/790.
2. Blok buatan operator: komentar `1001startup.id: every crawler is welcome, AI training crawlers included. The census is public on purpose. We want search engines, answer engines and the models behind them to know it and cite it. Cite the company page URL ...` lalu `User-agent: * / Allow: /` dan `Sitemap`.
3. Pengecualian untuk crawler mereka sendiri (`VantisSupportBot`): tidak boleh ke `/id/`, `/map`, `/leads`, `/api/`, `/stats`.
Dua blok pertama bertentangan secara teks (blok Cloudflare melarang training; komentar operator mengundangnya). Perlakukan yang LEBIH KETAT sebagai berlaku bila ragu.

**`/llms.txt`**: `How to attribute: name the source and link the page.` Contoh yang diminta: `According to the 1001startup.id census (updated 29 Oct 2026), Gojek (GoTo Group) has ...` + URL profil. Aturan membaca angka: `est` = estimasi kami, `-` = tidak ada angka kredibel, jumlah pekerja memuat tanggal baca. Setiap profil menyertakan baris "Cite as".
**`/about`**: "How to cite it" (nama sensus, tanggal, tautan halaman). **`/report/2026-10`**: `Free to cite with credit`. **Berita**: `Quote any figure with the credit below and a link.`
**Tidak ditemukan**: syarat penggunaan, lisensi data (CC/ODbL dsb.), API publik, atau unduhan dataset berlisensi. Menu "The dataset" ditandai `private` ("Held back"). Data kontak dan "lead" digerbang login dan dikecualikan dari robots.
**Kebijakan cookie** (vantis.sh/cookies/): analitik Umami milik sendiri, tidak ada cookie iklan; GPC/DNT dianggap penolakan. Banner persetujuan memblokir skrip analitik sampai dijawab. Saya tidak menerima apa pun; semua pengambilan lewat curl tanpa cookie.

### 8.2 Rekomendasi untuk METI

**Boleh (dengan atribusi, sumber utama dihubungkan):**
- Fakta mentah yang tidak punya perlindungan hak cipta tersendiri dan tersedia dari dokumen primer: nama entitas, hubungan "A memasok B" beserta tautan dokumen primer, tahun pendirian, nama pendiri, lokasi. Ambil dari DOKUMEN PRIMER-nya (laporan tahunan, situs perusahaan, siaran pers), bukan dengan menyalin kalimat 1001startup.id.
- Meniru POLA (struktur halaman, nama bagian, tipe field, label bukti, tingkat keyakinan, kuadran, matriks risiko, kerangka cerita data). Ide dan metode tidak dilindungi; formulasinya sendiri harus buatan METI.
- Mengutip angka sensus mereka SEBAGAI KUTIPAN (satu-dua angka) dengan kredit dan tautan sesuai `llms.txt`: `According to the 1001startup.id census (updated <tanggal>), ...`.
- Membaca `/data/search-index.json` sekali untuk memahami struktur (sudah dilakukan; tidak perlu diulang).

**Tidak (dan alasannya):**
- Menyalin kalimat deskripsi, catatan alasan keyakinan, "What this means", cerita data, atau kutipan tooltip (karya tulis mereka; EU 2019/790 Pasal 4 dinyatakan dicadangkan untuk ai-train=no).
- Menyalin angka estimasi mereka (output IDR, jobs est, skor 0-5 BUMN, `confidence`, tingkat Primary/Shared/Limited) sebagai angka METI. Itu hasil metodologi dan penilaian mereka; METI harus menghitung sendiri atau menandainya "mengutip 1001startup.id".
- Panen massal (595 profil + 331 rantai + 172 investor): tidak ada lisensi, robots.txt memuat larangan ai-train, ada pembeda "People vs AI vs mesin pencari" di /stats yang menunjukkan mereka memantau crawler. Dan tidak diperlukan: ada cara lebih baik di bawah.
- Memakai logo perusahaan (aset mereka, dan hak merek pemiliknya) secara massal; pakai logo dari situs/sumber perusahaan sendiri, dengan izin atau dari kit pers.
- Mengabaikan bahwa halaman `/map`, `/stats`, `/api/`, `/leads` dikecualikan bagi crawler mereka.

**Cara praktis paling aman:** bangun korpus METI dari sumber primer yang sama (laporan tahunan perusahaan energi di bursa, situs resmi, ESDM, PLN RUPTL, Kementerian BUMN/Danantara), simpan kolom `source_url`, `source_domain`, `document_date`, `evidence_type`, `quote_frozen`. Gunakan 1001startup.id hanya untuk (a) menemukan nama yang perlu dicek dan (b) menjadi bahan perbandingan metode. Jika ingin data langsung dari mereka (daftar perusahaan atau API), tanyakan resmi ke pembangun (kontak tertera di /about); belum ada jalur lisensi terbuka.

---

## 9. Fitur yang layak ditiru untuk METI (pemetaan ke padanan energi), dengan pola kalimat dan urutan bagian

Urutan dan kalimat di bawah berupa TEMPLAT untuk METI (bukan salinan teks mereka). Placeholder di dalam `<...>`.

### 9.1 Kerangka global METI

- **Pita atas kejujuran** per jenis halaman. Template: `DRAF KERJA · SUMBER PUBLIK SAJA · TIAP ANGKA TURUNAN BERLABEL ESTIMASI` / `WORKING DRAFT · PUBLIC SOURCES ONLY · EVERY DERIVED FIGURE IS A LABELED ESTIMATE`. Untuk halaman rantai: `HUBUNGAN HANYA DITERBITKAN BILA ADA DOKUMEN BERNAMA YANG MEMUATNYA`.
- Menu: Datasets (Anggota METI, Pengembang & IPP, Pemasok teknologi, BUMN energi, Pembiaya, Data center & listrik, Koperasi & UMKM energi), News (Cerita data), Research, Map, Supply chain, Investors/Pembiaya, Census, Method, Agents (jika ada).
- Kaki kebersihan: tautan "Cookies", "Cara mengutip", "Metode", "Kontak koreksi".
- Penghitung "online/views" opsional; sederhana saja, tanpa cookie iklan.
- Indeks pencarian satu berkas JSON statis `/data/search-index.json` + `[nama, jenis, "Sektor · Kota", slug, logo, nama hukum + provinsi]`.
- `schema.org` JSON-LD (Organization, WebPage `isPartOf` Dataset "Direktori Jaringan Energi Terbarukan Indonesia", BreadcrumbList), `hreflang`, kanonik.

### 9.2 Peta fitur 1001startup.id ke padanan METI

| Fitur 1001startup.id | Padanan METI | Catatan pola |
|---|---|---|
| Startups census | **Direktori anggota/perusahaan EBT** (pengembang, IPP, EPC, produsen modul/inverter/baterai, distributor, integrator, layanan keuangan, riset) | tabel + chip sektor + chip boolean (`Anggota METI`, `Terverifikasi`, `Punya proyek COD`) |
| Sektor (16) | Sektor EBT: PLTS atap, PLTS skala utilitas, PLTB, PLTA/mikrohidro, panas bumi, bioenergi, penyimpanan baterai, EV dan pengisian, jaringan & mikrogrid, EPC, pembiayaan | satu halaman `/sektor/<slug>` dengan kalimat fakta |
| Supply chain `/chain` | **Rantai pasok EBT**: bahan baku (silikon, litium, nikel, kobalt) → modul/sel → inverter/BESS → BOS/kabel/trafo → EPC → pengembang/IPP → offtaker (PLN, C&I, pemda, koperasi). Pemasok kiri, pelanggan kanan | jenis tautan baru: `Modul`, `Inverter`, `Baterai`, `Trafo & kabel`, `EPC`, `O&M`, `Pembiayaan`, `Lisensi teknologi`, `Offtake (PPA)` |
| `/chain/x/<slug>` entitas di luar sensus | PLN, ESDM, Danantara, pabrikan asing (Huawei, Sungrow, Longi, CATL), bank, DFI (Norfund, BII, ADB) | beri halaman ringan "Bukan anggota METI. Halaman ini ada karena rantai anggota melewatinya." |
| Investors | **Pembiaya EBT**: bank (BRI, BNI, Mandiri, BCA), DFI, dana iklim, investor strategis, penyedia sewa-guna. Portofolio = anggota METI yang didanai | tabel `Pembiaya | Perusahaan didukung | Pendanaan diumumkan | Pekerja | Contoh`, peringatan "all investors combined, not this fund's cheque" |
| BUMN quadrant | **BUMN & anak usaha energi**: PLN (Indonesia Power, Nusantara Power, Batam, Energi Primer, Icon Plus), Pertamina (NRE, Geothermal Energy, Patra Niaga), MIND ID, PGN, Pupuk, PTBA, Antam, Danantara | kuadran X/Y dengan ukuran: porsi EBT di bauran, kapasitas EBT terpasang, rencana RUPTL, risiko, keterlibatan program 100 GW PLTS; pita "WHAT THE STATE ASKS OF PLN" |
| BUMD | **BUMD energi**: Pema Global Energi, JOE, ENM, SPHC, Kutai Timur Energi dll. | tabel + sebar aset vs laba |
| Data center + power matrix | **Pasokan listrik pusat data**: matriks `Grid | BTM | Off-grid | Hybrid` x `Greenfield | Brownfield`; PPA/REC, PLTS atap, PLN Batam, Cikarang Listrindo | temuan dengan angka (MW, MVA, Rp), tabel `Who carries the risk` (Equipment, Build, Land, Power, Capital, Customer) untuk proyek PLTS |
| UMKM exporters | **Koperasi/UMKM energi desa**: KDMP dan PLTS desa, PLTMH, biogas, tungku bersih, bengkel konversi EV. Tabel dengan tingkat verifikasi | enam tingkat bukti serupa: `Terverifikasi lapangan`, `Terdaftar ESDM/DJEBTKE`, `Terdaftar KDMP`, `Terdaftar pameran`, `Terdaftar daftar publik`, `Penjual marketplace` |
| Map | **Peta jaringan**: titik logo bundar anggota, layer PLTS/PLTB/PLTA/panas bumi, label kecamatan, penutup "N dari M ditempatkan" | MapLibre + Protomaps (OSM) sudah cukup; titik ditempel ke jalan, bukan gedung |
| News (cerita data) | **Cerita data EBT**: `Siapa saja pengembang PLTS atap yang menandatangani PPA pada 2026?`, `Pelanggan terbesar penyedia PLTS C&I`, `Pembiaya paling aktif`, `Proyek EBT yang mundur dari jadwal COD` | format baku di 9.4 |
| Research | makalah panjang (potensi, kebijakan, harga PPA) dengan tabel dan kueri yang bisa diulang | |
| Report bulanan beku | Laporan bulanan METI dengan empat temuan, angka dibekukan | |
| Method + model GVA | **Metode estimasi kapasitas/investasi/lapangan kerja**: `kapasitas_MW x faktor kapasitas`, `jumlah pekerja x jangkar nilai tambah per pekerja (BPS)` | `est` dan aturan "tidak menurunkan satu dari yang lain" |
| Closed register | **Register proyek/perusahaan EBT berhenti** (bangkrut, proyek batal, PPA diputus) | syarat masuk: `nothing listed on rumour` |
| Coverage | Halaman "What the directory contains" (cakupan, apa yang sengaja tidak dihitung) | |
| Skor keyakinan 0-1 | Skor keyakinan per entri METI | |
| Follow | Pantau entitas (login), opsional | |
| Agents/Lead search | Agen riset internal untuk menemukan kontak (privat) | bukan untuk publik |

### 9.3 Profil entitas METI: urutan bagian persis (tiru profil 2.3)

1. Jejak `METI / <Sektor> / <Nama>`.
2. Nama, nama hukum, sektor, `Direktori #<n> dari <N>`, label bidang satu baris.
3. Kalimat fakta (pola ID): `Menurut direktori Platform Jaringan METI (diperbarui <tgl>), <Nama> didirikan oleh <pendiri> pada <tahun>; tercatat <n> pekerja (dibaca <tgl>); kapasitas terpasang <x> MWp (<jenis sumber>); kantor pusat di <kota>.` Field kosong dibuang dari kalimat.
4. `Kutip sebagai <Nama>, Platform Jaringan METI, diperbarui <tgl>. <url>`.
5. Blok field berlabel bersumber: Pendiri; Pendanaan diumumkan (dengan penanda min/est); Putaran terakhir; Valuasi/Kapitalisasi (bila ada); Pekerja (dengan tanggal baca); **Kapasitas dan proyek** (MWp terpasang, MWp dalam konstruksi, jenis offtaker); **Output estimasi `est`** (rumus tertulis); Lokasi.
6. Pembiaya (chip tautan).
7. Rantai pasok: `<n> tautan teknologi dan manufaktur (<a> pemasok, <b> pelanggan). Tiap tautan merujuk ke halaman atau dokumen asalnya; semuanya dicek ulang pada <tgl>.` Kolom Pemasok dan Pelanggan, dikelompokkan per jenis (Modul, Inverter, Baterai, EPC, O&M, Offtake, ...), tiap baris: nama (+ `di luar direktori`), kalimat hubungan dengan angka teknis, tag `FILING`/`PIHAK-PERTAMA`, domain, tanggal dokumen. Penutup: `Tidak adanya tautan bukan berarti tidak ada hubungan: artinya belum ada sumber publik yang menyatakannya.`
8. Kantor pusat (catatan presisi peta), Kontak publik (hanya surel peran/telepon kantor, tanggal dibaca).
9. `Apa arti angka-angka ini` (nilai tambah, kapasitas terpasang vs dioperasikan, MWp vs MWac).
10. `Seberapa baik kami mengetahuinya`: `0,85 · TINGGI` + `Tinggi: sumber primer atau filing` + paragraf alasan + `Situs: aktif, dicek <tgl>` / `Situs memblokir pengecekan otomatis, dicek manual <tgl>` (tiga status: aktif, memblokir, tidak aktif).
11. Sumber: daftar `domain + URL`.
12. Pembanding di sektor: 6 entri + nomor urut.
13. Kaki: `Sumber publik saja. Angka bertanda est adalah estimasi kami, diturunkan dan diberi label, bukan angka yang diumumkan. Cara estimasi dibangun →`.

### 9.4 Cerita data METI: urutan bagian persis (tiru 2.11)

1. Label topik + `Cerita data` + tanggal.
2. Judul berupa pertanyaan; subjudul satu kalimat yang sudah memuat jawabannya.
3. **Jawaban singkat**: `Per <tgl>, direktori mencatat <n> dari <N> perusahaan ... <angka kunci>; terbesar <nama> (<angka>).`
4. Empat angka besar.
5. Satu grafik batang berurutan + kalimat pengantar yang menyebut batasnya.
6. Tabel lengkap `Entitas | Sektor | Yang dicatat | Nilai | Sumber`, `-` bila angka tidak diumumkan.
7. Bagian "Tidak semua ini <X>" dan "Kebanyakan <Y> tidak menyebut angka".
8. **Cara menghitung**: `Direktori memakai putaran/PPA/COD terbaru tiap entitas ... angka hanya yang tertulis di catatan ... <N> adalah hitungan di antara <M> entitas direktori, bukan seluruh <populasi>.`
9. **Memakai angka ini**: `Kutip angka mana pun dengan kredit di bawah dan tautan. Angka pada halaman ini dibekukan pada tanggal di atas; halaman perusahaan terus diperbarui.` + `Sumber: Platform Jaringan METI, data dibekukan <tgl>, <url>`.
10. Cerita lain.

### 9.5 Halaman rantai pasok EBT (tiru 2.4)

- Indeks `/rantai`: judul `Siapa memasok siapa di rantai EBT`; paragraf cakupan; satu kalimat angka (`<n> tautan pasokan dan <m> tautan kepemilikan (<a> filing · <b> pihak-pertama), tiap tautan adalah klaim yang masih dibuat dokumen bernama: filing audit yang menyebut pihak lawan, atau halaman yang diterbitkan salah satu pihak. Dicek ulang <tgl>.`), chip jenis (Modul 12, Inverter 9, Baterai 7, ...), tabel `Perusahaan | Sektor | Pemasok | Pelanggan | Korporat`.
- Aturan "dua tingkat": hanya tautan teknologi dan manufaktur, tidak melalui hub umum (mis. PLN sebagai pembeli tunggal bisa membuat semua perusahaan "terhubung"; pakai aturan serupa: jangan telusuri tingkat dua melalui PLN).
- Konsentrasi pelanggan dari laporan: `· 17,71% pendapatan <nama>` (diambil dari catatan laporan keuangan).
- Tiga jenis kutipan beku per tautan (tooltip): jenis dokumen + kutipan pendek (di bawah batas kutip) + tanggal.

### 9.6 Kuadran BUMN energi (tiru 2.6)

- Sepuluh ukuran dengan skala sama 0-5, pemilih X/Y, garis silang di median, logo bundar, kartu skor dengan "alasan: rumus + bukti + tanggal", tabel semua skor dan peringkat (`=` seri), blok `Cara kerja skor` dan `Batas`.
- Ukuran khusus energi yang bisa menggantikan/menambahi: `bauran EBT (% kapasitas)`, `MW EBT terpasang`, `MW EBT direncanakan RUPTL`, `ketergantungan batu bara`, `subsidi/kompensasi (Rp)`, `keterlibatan 100 GW PLTS`, `risiko hukum/keuangan`.
- Halaman per BUMN (`/bumn/pln`): peta pendapatan per region, `WHAT THE STATE ASKS` (kewajiban dan program nasional bersumber), pohon anak usaha dengan persentase dan status (`aktif`/`belum beroperasi`).

### 9.7 Matriks "pasokan listrik pusat data" METI (tiru 2.8)

- Matriks `Greenfield | Brownfield` x `Grid | Behind-the-meter | Off-grid | Hybrid`; tiap sel = judul manusiawi + anotasi risiko + daftar operator + sumber daya (`PLN`, `PLN Batam`, `Cikarang Listrindo`, `PPA surya`, `REC`) + `n proyek · X MW`.
- Sel kosong tetap ditulis dengan alasan.
- `Who carries the risk` menjadi `Siapa menanggung risiko PLTS`: Peralatan, Konstruksi, Lahan, Daya/interkoneksi, Modal, Pelanggan/offtake x pelaku (Pabrikan, EPC, PLN/utilitas, Pengembang, Pembiaya, Offtaker). Tiga tingkat `Utama | Bersama | Terbatas`, tiap sel bisa diklik ke kutipan sumber dan label kepercayaan.
- Kalimat "WHAT THE MAP SHOWS" sebagai tiga paragraf temuan dengan angka rupiah/MW bersumber.

### 9.8 Koperasi/UMKM energi desa dan KDMP (tiru 2.9)

- Kartu angka (`n koperasi`, `n provinsi tercatat`, `n terverifikasi lapangan`, `n dengan kanal langsung`), chip jenis usaha (PLTS desa, PLTMH, biogas, bioenergi, EV dan bengkel, tungku bersih), chip tingkat bukti berhitungan, pemilih provinsi, `Hanya kontak langsung`, tabel `# | Koperasi/UMKM | Jenis | Lokasi | Kapasitas/produk | Mitra/pembeli | Kontak`.
- Hover lencana tingkat bukti menjelaskan maknanya.

### 9.9 Metode dan skor keyakinan METI (tiru 4)

- Satu halaman `/metode` (persamaan EQ tertulis) + `/cakupan` (apa yang dihitung, apa yang sengaja tidak, alasannya).
- Tiga tingkat keyakinan dengan kalimat tetap dan ambang publik (usul: tinggi ≥ 0,80, sedang 0,60-0,79, rendah < 0,60), plus paragraf alasan per entri.
- Aturan: angka tak diturunkan satu dari yang lain (kapasitas tidak diturunkan dari investasi; investasi tidak diturunkan dari pembiayaan).
- Pengganda tidak langsung (jika dipakai) diterapkan SEKALI pada portofolio.
- Jangkar sektor dari BPS, ditandai default bila sektor belum punya.

### 9.10 Yang sebaiknya TIDAK ditiru

- Menu "Agents/The dataset private" sebagai fitur publik: bagian riset-agen sebaiknya internal.
- "Follow"/login: belum perlu.
- Halaman raksasa tunggal (/umkm 2,7 MB, /bumn 490 KB): pecah atau muat dari JSON.
- Pola `cookie banner` pihak ketiga: METI cukup tanpa cookie non-esensial.
- Keselarasan hukum: sediakan SYARAT dan LISENSI DATA (mis. CC BY 4.0 untuk fakta dan tautan sumber, hak cipta METI untuk teks) yang tidak mereka miliki.

### 9.11 Prioritas bangun (usulan)

1. Skema data (3.1) + 20 entri awal dengan field lengkap dan sumber primer.
2. Profil entitas dengan 13 bagian (9.3) + kalimat fakta + kutipan.
3. Tabel direktori + chip + pencarian JSON (9.1, 2.2).
4. Rantai pasok `/rantai` dan `/rantai/x/` (9.5).
5. Halaman metode dan cakupan (9.9).
6. Pembiaya (investor) turunan otomatis dari entri.
7. Kuadran BUMN dan peta grup PLN (9.6).
8. Peta MapLibre (OSM).
9. Cerita data bulanan (9.4).
10. Matriks pasokan listrik pusat data (9.7) dan koperasi desa (9.8).

---

## Lampiran A. Ringkasan angka dan tanggal yang dibaca

Sensus startup 558 (pendanaan diumumkan US$18,7 mlr dari 249 baris; valuasi gabungan US$20,6 mlr dari 21 tanda; 176.895 pekerja est; output IDR 96,5 T/tahun, dengan pengganda 1,5 menjadi IDR 144,7 T), 56 BUMN (1.120 anak usaha dan saham, Rp131,41 T dividen ke Danantara 2025), 719 BUMD (dari 1.092 menurut Kemendagri), 72 proyek pusat data (57 ditempatkan di matriks, 48 pakai grid), 1.410 eksportir UMKM (372 diverifikasi lebih dari sekadar daftar), 732 tautan pasokan + 41 tautan kepemilikan (334 filing, 439 first-party) per 29 Sep 2026, 37 perusahaan tutup (2019-2025).

## Lampiran B. Berkas mentah

`/private/tmp/claude-501/-Users-priyankaalfatehan28-Developer-poskokarhutla/e103ba63-5b39-4229-8371-ef441f13f506/scratchpad/raw/` berisi robots.txt, sitemap.xml, llms.txt, search-index.json, px.css, dan salinan HTML halaman yang dibaca (p_*.html tanpa ekstensi, c_<slug> untuk 15 profil energi). Pengurai teks: `.../scratchpad/tx.py`.
