# FITUR-200: 200 fitur dan informasi strategis untuk Direktori METI

Disusun 8 Nov 2026 oleh agen peneliti. Hanya dokumen; tidak ada kode diubah, tidak ada commit. Dibaca dulu: `VISI-PUSAT-DATA.md`, `FITUR-STRATEGIS.md`, `DATA-BARU.md`, daftar `public/*.html` (45 halaman) dan `public/data` (60-an berkas).

## 0. Cara membaca

Yang sudah ada tidak diusulkan ulang. Butir yang menyentuh hal yang sudah ada ditandai "(peningkatan)" dan hanya menambah yang belum ada. Butir yang sudah pernah diusulkan tetapi belum diputuskan (gelombang 5 dan 6 `FITUR-STRATEGIS.md`) ditandai "(usul lama)" supaya pemilik tidak menilai dua kali.

Kolom:
- **J (jenis)**: F fitur, D data, A analisis, K komunitas.
- **U (usaha)**: S sekitar 1 sampai 3 hari, M sekitar 1 sampai 2 minggu, L lebih dari 2 minggu atau butuh banyak kurasi.
- **D (dampak)**: 1 sampai 5.
- **Akses**: OTO bisa diambil otomatis (API, berkas terbuka, HTML publik); UNDUH unduhan manual tanpa formulir; PDF dokumen resmi yang diekstrak setelah diunduh; FORM butuh formulir atau akun (tidak boleh diisi agen, pemilik yang mengunduh); MAN kurasi tangan atau input pengguna; INT data Direktori sendiri.
- **Putusan**: BIAYA (uang atau kunci API), PRIBADI (data pribadi, UU PDP), MITRA (kemitraan atau izin pihak lain), LEGAL (lisensi atau hukum perlu dicek), POLITIK (sensitif ke pemerintah atau anggota).
- **Kunci sumber** dijelaskan di bagian 2. Tanda [B] = halaman dibaca dalam riset ini, [C] = hanya hasil pencarian, [-] = tidak dikunjungi, dasar dari `DATA-BARU.md` atau pengetahuan umum dan harus diperiksa sebelum dipakai.

## 1. Ringkasan temuan riset (lima yang paling menentukan)

1. **Celah terbesar adalah pipeline proyek bertahap, bukan daftar proyek.** CPI mencatat investasi EBT Indonesia hanya USD 1,79 miliar per tahun terhadap kebutuhan USD 9,1 miliar, dan proyek prioritas JETP baru menutup 43% (23,86 GW) dari 54,5 GW kebutuhan 2020-2030 (Ember). Tidak ada pelacak publik yang menunjukkan tiap proyek ada di tahap apa (RUPTL, PPA, financial close, konstruksi, COD) dengan tingkat bukti. Pembanding terdekat, Power Africa Tracking Tool, justru membuka tahap, lokasi, bahan bakar, dan biaya proyek. Direktori sudah punya RUPTL, AMDAL, dan proyek; yang belum ada adalah mesin tahapnya.
2. **Angka resmi dan angka pihak lain sering berbeda, dan itu bahan baku produk.** Contoh dari pencarian: tambahan kapasitas EBT 2025 versi IESR sekitar 1,3 GW dibanding laporan ESDM; jumlah SPKLU 4.655, 4.769, dan "di atas 5.000" muncul bersamaan; volume bursa karbon dilaporkan berbeda tipis antar media. Papan "rekonsiliasi angka" (butir L01) memberi METI peran wasit data yang tidak dipegang lembaga lain, dan sulit ditiru karena butuh kurasi berkelanjutan.
3. **Data pengadaan publik sudah terbuka lewat jalur pihak ketiga.** opentender.net (ICW) menerbitkan data LKPP dalam format OCDS, ODbL, JSON/CSV/Excel, 2010 sampai Juli 2025, sedangkan portal LKPP baru (inaproc.id) disebut membatasi akses otomatis. Radar tender EBT (butir A09) bisa jalan tanpa menyentuh portal yang membatasi bot, dengan syarat berbagi-serupa ODbL.
4. **Data resmi Indonesia terkunci dalam PDF dan portal yang sulit diotomasi.** HEESI, Statistik Listrik BPS (21 MB, PDF), RUPTL, Perda RUED, dan Perpres hanya terbit sebagai dokumen; ESDM One Map tidak mendokumentasikan alamat WMS; SIGN SMART dan SRN PPI tidak punya unduhan publik yang saya temukan; MODI Minerba ditutup 1 Sep 2025. Keunggulan yang sulit ditiru adalah "pabrik ekstraksi" yang mengubah dokumen ini menjadi tabel bertanggal, berversi, dan bersitasi halaman (butir K01 dan K02), bukan satu dataset lagi.
5. **Lisensi menentukan apa yang boleh dibuka.** Ember, Global Solar/Wind Atlas, Climate TRACE, OWID, GEM (sebagian), World Bank memakai CC BY. OSM dan opentender memakai ODbL (berbagi-serupa). GEM menandai sebagian rekaman asal TransitionZero dengan CC BY-NC 4.0. BPS hanya menulis hak cipta tanpa lisensi terbuka. IEA sebagian besar berbayar. Karena pemilik membatalkan unduhan data untuk publik, registri lisensi per baris (butir K03) adalah syarat sebelum data apa pun dibuka atau dijadikan API.

Catatan tambahan: tenaga EBT kita bergerak ke program besar (100 GW PLTS disebut IEEFA dan Eco-Business dalam hasil pencarian, laporan IEEFA tidak terbaca karena 403). Butir A07 dan C04 menyiapkan pelacaknya, dengan catatan bahwa rincian program belum saya verifikasi dari dokumen resmi.

## 2. Pembanding dan sumber yang dikunjungi

Metode: 30 percobaan WebFetch (18 terbaca, 2 memuat halaman kosong karena aplikasi JavaScript, 10 gagal 403/404/503/DNS) dan 24 pencarian web. Tidak ada skrip, tidak ada login, formulir, atau paywall yang disentuh. Karena memakai WebFetch dan WebSearch, bukan skrip sendiri, pengecekan robots.txt tidak dijalankan manual dan UA riset METI tidak dipakai; untuk penarikan otomatis nanti, pakai pembantu `_panen_sopan.mjs` yang sudah ada.

### 2.1 Pembanding internasional

| Pembanding | URL | Status | Fitur unggulan | Data dibuka dan lisensi |
|---|---|---|---|---|
| Ember | https://ember-energy.org/data/ | terbaca | Electricity Data Explorer, data bulanan, pelacak target EBT 2030 (96 negara), API | CC BY 4.0 untuk seluruh isi |
| Global Energy Monitor | https://globalenergymonitor.org/projects/ | terbaca | 25 peta dan dasbor, 182 ribu fasilitas, tema batu bara, migas, EBT, industri berat, keuangan | halaman tema tidak menyebut lisensi; tracker surya CC BY 4.0 dengan sebagian rekaman CC BY-NC 4.0 (TransitionZero) |
| GEM Global Solar Power Tracker | https://globalenergymonitor.org/projects/global-solar-power-tracker/ | terbaca | data per fase PLTS di atas 1 MW (103.940 fase), agregat PLTS tersebar 31 negara, tabel ringkas | CC BY 4.0, atribusi di berkas unduhan |
| GEM artikel Indonesia | https://globalenergymonitor.org/article/unlocking-clean-energy-decisions-indonesia | terbaca | data aset GEM dipakai menutup celah data pemerintah untuk CIPP JETP | n.a. |
| Climate TRACE | https://climatetrace.org/data | terbaca | emisi per aset dan sektor, API beta, BigQuery, data kota | Creative Commons 4.0 (rincian di syarat) |
| ENERGYDATA.INFO (Bank Dunia, ESMAP) | https://energydata.info/ | terbaca | 1.191 dataset, 12 aplikasi (Global Solar/Wind Atlas, Global Electrification Platform) | lisensi per dataset |
| Our World in Data | https://ourworldindata.org/energy | terbaca | grafik tersemat, dataset GitHub energi | CC BY; data pihak ketiga ikut lisensinya |
| IEA | https://www.iea.org/data-and-statistics | terbaca | Data Explorer, basis data kebijakan, Chart Library | sebagian gratis (listrik bulanan 47 negara), sebagian berbayar |
| RE100 (Climate Group) | https://www.theclimategroup.org/re100 | terbaca | direktori anggota (400+ perusahaan, 550 TWh/tahun), pedoman pelaporan | tidak ada data tingkat anggota di halaman |
| CDP | https://www.cdp.net/en/data | terbaca | portal data terbuka kota/negara bagian, skor perusahaan dilisensikan | data korporasi berlisensi |
| Climate Policy Initiative, dasbor keuangan sektor listrik Indonesia | https://www.climatepolicyinitiative.org/dataviz/indonesia-power-sector-finance-dashboard | terbaca | arus investasi EBT vs fosil 2019-2023, sumber dana, penyelaman PLN | rincian unduhan tidak terbaca |
| Ember, wawasan Indonesia | https://ember-energy.org/latest-insights/insight/indonesias-expansion-of-clean-power-can-spur-growth-and-equality/ | terbaca | analisis batu bara berlebih, utilisasi 48%, peluang PLTS di daerah batu bara | CC BY |
| Clean Energy Council (Australia) | https://cleanenergycouncil.org.au/resources/resources-hub | terbaca sebagian | laporan tahunan, laporan proyek kuartalan, laporan investasi semesteran | lisensi tidak disebut |
| ENERGY TRACKER ASIA | https://energytracker.asia/renewable-energy-in-indonesia/ | terbaca | berita per negara, publikasi, buletin investasi | tidak ada data sendiri di halaman |
| Global Electrification Platform | https://blogs.worldbank.org/en/energy/the-global-electrification-platform-3-0--more-data-for-more-accu | terbaca | pembanding biaya terendah: jaringan, minigrid, surya mandiri per permukiman | terbuka, lisensi tidak disebut |
| Global Solar Atlas / Global Wind Atlas | https://globalsolaratlas.info/ , https://globalwindatlas.info/ | halaman JS kosong; info dari pencarian [C] | peta radiasi/angin 250 m, unduhan GIS | CC BY 4.0 (dari katalog Bank Dunia dan Wikipedia, via pencarian) |
| IRENA (IRENASTAT, biaya) | https://www.irena.org/Data | 403; info dari pencarian [C] | basis data biaya terbarukan, alat kueri IRENASTAT, profil negara | atribusi IRENA; rincian tidak terbaca |
| SEIA | https://www.seia.org/solar-industry-research-data | 403; pencarian [C] | Solar Market Insight: ringkasan gratis, laporan penuh berbayar (USD 5.500 anggota, USD 7.500 bukan anggota), peta sensus tenaga kerja | berbayar |
| Solar Power Europe | https://www.solarpowereurope.org/insights | 404 | tidak terbaca | n.a. |
| WindEurope | https://windeurope.org/intelligence-platform/ | 503 | tidak terbaca | n.a. |
| Power Africa Tracking Tool | https://www.powerafrica.gov/ | DNS gagal; pencarian [C] | pelacak transaksi: tahap, lokasi, bahan bakar, biaya; 297 proyek 27 GW (angka lama) | status terkini tidak terkonfirmasi |
| PitchBook | https://try.pitchbook.com/ma-verticals/ | pencarian [C] | pelacak M&A per industri, pratinjau laporan iklim | berbayar, pratinjau buram |
| Wood Mackenzie, Rystad, BNEF | pencarian [C] | tidak ada ringkasan publik Indonesia yang berguna; hanya laporan riset pasar komersial | berbayar |
| IESR (IETO 2026, EPS, LCOE tool) | https://iesr.or.id/wp-content/uploads/2025/12/Presentasi-Indonesia-Energy-Transition-Outlook-IETO-2026-IESR.pdf | pencarian [C]; halaman pustaka 403 | indeks kesiapan transisi (11 faktor), simulator kebijakan, kalkulator LCOE dan surya | tergantung dokumen |
| ASEAN Centre for Energy, AEDS | https://aeds.aseanenergy.org/ | pencarian [C] | basis data energi ASEAN, sedang dirombak dengan Bank Dunia | lisensi tidak terkonfirmasi |

### 2.2 Sumber Indonesia

| Sumber | URL | Status | Catatan |
|---|---|---|---|
| ESDM One Map / Geoportal ESDM | https://www.esdm.go.id/en/berita-unit/directorate-general-of-electricity/data-spasial-ketenagalistrikan-dapat-diakses-di-esdm-one-map | terbaca | lapisan pembangkit, transmisi, proyek 35.000 MW, listrik 2.500 desa; mode publik; alamat WMS tidak terdokumentasi |
| MOMI | https://momi.minerba.esdm.go.id | pencarian [C] | peta izin tambang; MODI ditutup 1 Sep 2025 |
| BPS Statistik Listrik 2020-2024 | https://www.bps.go.id/en/publication/2025/12/31/c4f7aade5d4801236ec79b81/statistik-listrik-2020-2024.html | terbaca | PDF 21 MB, Indonesia dan Inggris; tanpa lisensi terbuka |
| BPS WebAPI | https://lubuklinggaukota.bps.go.id/en/news/2024/12/31/344/webapi-badan-pusat-statistik.html | pencarian [C] | ada API; dokumentasi dan kunci perlu dicek |
| HEESI 2025 | https://esdm.go.id/assets/media/content/content-handbook-of-energy-and-economic-statistics-of-indonesia-2025.pdf | pencarian [C] | PDF tahunan sejak 2007 |
| opentender.net via Open Contracting Partnership | https://data.open-contracting.org/en/publication/101 | terbaca | OCDS, ODbL, 211 MB JSONL, dari LKPP, 1970 sampai Jul 2025 |
| OJK TKBI | https://ojk.go.id/id/berita-dan-kegiatan/info-terkini/Pages/Taksonomi-untuk-Keuangan-Berkelanjutan-Indonesia.aspx | pencarian [C] | versi 1 (Feb 2024), versi 2 (11 Feb 2025), label Hijau/Transisi |
| SIGN SMART / SRN PPI | https://signsmart.kemenlh.go.id | pencarian [C] | tidak ada unduhan publik yang ditemukan; SIGN SMART ROBUST diluncurkan 2026 |
| IDXCarbon | berita Kontan, Databoks, KabarBursa | pencarian [C] | kumulatif 1,98 juta ton CO2e dan Rp93,81 miliar hingga 30 Jun 2026; 155 pengguna jasa |
| satudata.go.id dan portal daerah | https://satudata.sultengprov.go.id , https://data.jatengprov.go.id | pencarian [C] | portal daerah berbasis CKAN, lisensi CC BY per dataset; API tanpa kunci untuk package_list/show |
| PLN statistik, BKPM/OSS, LKPP/SIRUP | pencarian [C] | statistik PLN 2025 tidak ditemukan sebagai unduhan; OSS tidak punya API publik yang terdokumentasi; LKPP baru membatasi akses otomatis |
| PLN SPKLU | berita CNN Indonesia, Liputan6, Investortrust | pencarian [C] | tidak ada dataset terbuka, hanya angka pernyataan |
| IESR IETO 2026 | lihat atas | pencarian [C] | kapasitas EBT 2025 tambah sekitar 1,3 GW; anggaran EBT provinsi Rp426,7 miliar dari 33 provinsi; Bali kurang dari 3% dari target 11% |
| Berkas Direktori sendiri | `public/data/*.json`, `docs/perencanaan/*.md` | dibaca | dasar "sudah ada" |

## 3. Daftar 200 butir

Kunci akses ringkas dipakai di kolom Sumber. "Ada" berarti `public/data/<berkas>.json` sudah ada.

### A. Investor dan pengembang (20)

| ID | Nama | Keputusan atau masalah | Isi | Sumber dan akses | J | U | D | Gantung | Putusan |
|---|---|---|---|---|---|---|---|---|---|
| A01 | Pelacak pipeline proyek bertahap | proyek mana yang benar-benar maju dan kapan COD realistis | tiap proyek punya tahap (rencana RUPTL, penetapan, PPA, financial close, konstruksi, COD, tertunda, batal), tanggal tiap loncatan, tingkat bukti; model Power Africa Tracking Tool [C] | ruptl.json, proyek.json, amdal.json (ada); siaran pers ESDM/PLN dan berita; OTO dan MAN | D | L | 5 | - | - |
| A02 | Statistik lead time perizinan sampai COD | berapa bulan dari AMDAL ke COD per teknologi | median dan sebaran lama antar tahap per teknologi dan pulau, dihitung dari A01 | hasil A01, amdal.json; INT | A | M | 4 | A01 | - |
| A03 | Skor kedekatan sambungan lokasi | titik mana punya jalur evakuasi daya | jarak ke gardu dan transmisi, rencana tambahan transmisi RUPTL, penanda "jaringan lemah" (peningkatan lapisan O) | OSM [-] (ODbL), ESDM One Map [B] (WMS belum terdokumentasi), RUPTL; OTO | F | M | 5 | - | LEGAL (ODbL) |
| A04 | Kapasitas serap EBT variabel per sistem PLN | berapa MW surya/bayu lagi bisa diserap | porsi variabel saat ini dan rencana per sistem, rencana penyimpanan, penanda sistem kecil (rujukan Ember: serap 14% 2030 ke 36% 2050) [B] | RUPTL PDF, Ember insight [B]; PDF | A | M | 4 | K01 | - |
| A05 | Simulasi arus kas proyek | apakah proyek bankable pada tarif tertentu | ekuitas, utang, DSCR, IRR, sensitivitas, asumsi terbuka dan bisa diubah, ekspor lembar keputusan (peningkatan `kelayakan.html`) | harga patokan Perpres 112/2022 (ada tarif_harga.json), asumsi INT | F | M | 4 | - | - |
| A06 | Pembanding LCOE Indonesia lawan global | apakah biaya yang diklaim wajar | LCOE IRENA per teknologi vs LCOE Indonesia (IESR, Agora) vs tarif; sumber dan tahun tiap angka | IRENA Renewable Power Generation Costs [C], IESR LCOE [C], Agora PDF [C]; UNDUH dan PDF | D | S | 4 | - | LEGAL (atribusi IRENA) |
| A07 | Papan program 100 GW PLTS | seberapa maju program surya skala besar | lokasi, status, pelaksana, kapasitas, pembiayaan, kritik IEEFA; dibuat setelah dokumen resmi diverifikasi | dokumen resmi pemerintah (belum diverifikasi), IEEFA Agt 2026 [C, PDF 403], berita; MAN | D | M | 5 | A01 | POLITIK |
| A08 | Kamus klausul PPA dan risiko kontrak | negosiasi tarif dan risiko | ringkasan klausul umum (take-or-pay, deemed dispatch, force majeure, penalti keterlambatan) dengan rujukan aturan | JDIH ESDM/BPK [-], aturan PLN; MAN | K | M | 4 | pakar hukum METI | PRIBADI tidak; LEGAL |
| A09 | Radar tender EBT dari data pengadaan terbuka (peningkatan W) | tender dan paket mana relevan | saring KBLI/kata kunci EBT dari OCDS, pemenang, nilai, pagu; pengingat batas penawaran | opentender.net OCDS ODbL [B], LPSE PLN; OTO (bulk JSONL 211 MB) | F | M | 5 | - | LEGAL (berbagi-serupa) |
| A10 | Status lelang WKP dan penugasan panas bumi | lelang mana terbuka | tahap tiap WKP, peserta, tenggat; menambah wkp.json | siaran pers EBTKE, laman lelang; OTO dan MAN | D | S | 4 | - | - |
| A11 | Penyaring lahan: hutan, gambut, konsesi, bekas tambang | lokasi aman izinnya | lapisan kawasan hutan, gambut, HGU, izin tambang; peringatan tumpang tindih saat klik titik di kalkulator | geoportal KLHK [-], ESDM One Map [B], MOMI [C]; UNDUH atau WMS | F | L | 5 | - | LEGAL |
| A12 | Cek risiko lokasi bencana (AE) | lokasi tahan bencana | banjir, longsor, gempa, karhutla, gunung api di titik proyek; memakai modul bersaudara (Posko, BNPB) | repo saudara poskokarhutla, BNPB; INT | F | M | 4 | - | MITRA |
| A13 | Peta pembeli listrik hijau | siapa yang akan membeli | KEK, kawasan industri, smelter, pusat data, dengan estimasi kebutuhan MWh | kek.go.id [-], GEM captive [B], CPI [B]; OTO dan MAN | D | M | 5 | - | - |
| A14 | Peta pembangkit captive dan peluang substitusi | smelter mana bisa pindah ke EBT | captive batu bara (CPI: 43% investasi captive) per kawasan, jarak ke potensi surya/bayu/hidro | GEM (unduhan lewat formulir) [B], CPI [B], pemda | D | L | 5 | A13 | FORM: pemilik mengunduh GEM |
| A15 | Pencari mitra proyek | cari EPC, finansier, konsultan, off-taker | pencarian berfaset dari organisasi.json dan penyedia_teknologi.json, ditambah riwayat proyek bersama | INT | F | M | 4 | K05 | - |
| A16 | Papan transaksi EBT Indonesia | siapa membeli/mendanai apa | akuisisi, pendanaan, financial close, hibah dari siaran pers dan keterbukaan IDX; PitchBook berbayar jadi alasan membuat sendiri [C] | berita, idx.co.id keterbukaan; OTO dan MAN | D | M | 4 | A01 | - |
| A17 | Kalkulator insentif per proyek (peningkatan insentif.json) | insentif apa berlaku dan berapa nilainya | tax holiday, tax allowance, bea masuk, PPN; hitung dampak ke IRR | insentif.json (ada), PMK/PP di JDIH; MAN | F | M | 4 | A05 | - |
| A18 | Harga komponen: modul, baterai, inverter, baja | kapan membeli | seri harga bulanan modul dan baterai global dan impor Indonesia | IRENA/IEA publikasi [C], BPS impor [C] | D | M | 3 | - | LEGAL (BPS tanpa lisensi terbuka) |
| A19 | Peta standar dan SNI per teknologi | syarat teknis | SNI/IEC yang berlaku per komponen dan siapa lab ujinya | BSN, BNSP [-]; MAN | D | S | 3 | J09 | - |
| A20 | Paket data ruang investor | menyiapkan data room | daftar dokumen standar (AMDAL, FS, PPA, Amdal Lalin, izin lokasi) beserta contoh publik dan di mana mengurusnya | OSS [C], AMDALNET (amdal.json) | K | S | 3 | - | - |

### B. BUMN, PLN, dan utilitas (12)

| ID | Nama | Keputusan atau masalah | Isi | Sumber dan akses | J | U | D | Gantung | Putusan |
|---|---|---|---|---|---|---|---|---|---|
| B01 | Pelacak realisasi RUPTL per tahun | seberapa melenceng realisasi dari rencana | MW rencana vs COD per tahun, per teknologi (peningkatan ruptl.json); contoh: ESDM menyatakan PLN menyelesaikan 37% transmisi 2025 [C] | RUPTL PDF, laporan kinerja ESDM; PDF | D | M | 5 | A01 | POLITIK |
| B02 | Pelacak transmisi dan gardu | pembangunan jaringan tertinggal di mana | km terbangun vs rencana per sistem | RUPTL, ESDM [C]; PDF | D | M | 4 | B01 | - |
| B03 | Peta dedieselisasi (usul lama 2) | PLTD mana diganti | daftar PLTD, biaya BBM, peluang hibrida surya+baterai | RUPTL, statistik PLN [C]; PDF | D | M | 4 | - | - |
| B04 | Biaya pokok penyediaan per sistem dari waktu ke waktu | di mana EBT paling hemat | BPP per sistem 2019 sampai kini (peningkatan peluang.json yang memuat sebagian) | Kepmen ESDM BPP [-]; PDF | D | S | 4 | - | - |
| B05 | Pelacak REC dan green tariff | permintaan listrik hijau korporat | volume REC PLN, harga, pelanggan; bandingkan dengan RE100 [B] | PLN siaran pers [-]; MAN | D | S | 4 | - | - |
| B06 | Peta batu bara berlebih dan utilisasi | PLTU yang kapasitasnya tidak terpakai | utilisasi PLTU nasional (Ember: 48% pada 2023 [B]) dan per sistem, peluang substitusi | Ember [B], RUPTL | A | M | 4 | A04 | POLITIK |
| B07 | Peta cofiring biomassa | kebutuhan pasokan biomassa | PLTU cofiring, kapasitas, kebutuhan ton, pasokan terdekat | siaran pers PLN, RUPTL; MAN | D | M | 4 | N09 | - |
| B08 | Beban dan pertumbuhan permintaan per sistem | di mana permintaan tumbuh | penjualan GWh, pelanggan, beban puncak per sistem (statistik_pln.json baru 2024, tahunan) | statistik PLN, BPS [B]; PDF | D | S | 3 | - | - |
| B09 | Cetak biru PLTS atap per sistem | kuota dan antrian | kuota, permohonan, terpasang per sistem (peningkatan plts_atap.json) | PLN, ESDM; MAN | D | M | 4 | - | - |
| B10 | Kendaraan listrik dan SPKLU | beban listrik baru | jumlah SPKLU per provinsi dengan sumber pernyataan; PLN Mobile tidak menyediakan dataset [C] | siaran pers PLN, ESDM; MAN | D | S | 3 | L01 | - |
| B11 | Pembangkit swasta (IPP) per wilayah | siapa memasok | daftar IPP, kapasitas, PPA, tahun mulai; menyatukan dari GPPD dan OSM | gppd.json, pembangkit_osm.json (ada), RUPTL | D | M | 4 | A01 | - |
| B12 | Perbandingan kinerja operator panas bumi dan hidro | siapa efisien | faktor kapasitas per PLTP/PLTA bila tersedia; GEM dan laporan | GEM [B] (FORM), laporan tahunan; MAN | A | L | 3 | - | FORM |

### C. Kementerian dan pemda (16)

| ID | Nama | Keputusan atau masalah | Isi | Sumber dan akses | J | U | D | Gantung | Putusan |
|---|---|---|---|---|---|---|---|---|---|
| C01 | Papan RUED vs realisasi (usul lama 1) | provinsi mana tertinggal | target RUED (rued.json ada) vs realisasi bauran HEESI per provinsi; IESR: Bali kurang dari 3% dari target 11% [C] | rued.json, HEESI PDF [C]; PDF | D | M | 5 | - | - |
| C02 | Anggaran EBT dalam APBD | keseriusan daerah | belanja EBT per provinsi/kabupaten; IESR: Rp426,7 miliar dari 33 provinsi 2025 [C] | DJPK/Kemenkeu (data APBD) [-], portal daerah [C]; UNDUH dan PDF | D | L | 5 | - | - |
| C03 | Portal data kabupaten/kota | pemda tingkat bawah | profil EBT 514 kab/kota: potensi, listrik desa, proyek, rencana | wilayah/*, desa_listrik.json (ada), BPS [B] | F | L | 4 | K06 | - |
| C04 | Pelacak program prioritas pusat | status program | PLTS atap pemerintah, listrik desa, dedieselisasi, PLTS 100 GW; PIC, anggaran, realisasi | dokumen RKP/Renja [-], A07 | D | M | 4 | A07 | POLITIK |
| C05 | Pembanding kebijakan antarprovinsi | kebijakan mana efektif | matriks Perda RUED, insentif daerah, tarif retribusi, izin, per provinsi | rued.json, JDIH daerah [-]; PDF | D | L | 4 | - | - |
| C06 | Lembar keputusan bupati/gubernur | menyiapkan rapat | satu halaman per daerah: potensi, celah, proyek, rekomendasi, siap cetak (peningkatan lembar keputusan) | INT | F | S | 4 | - | - |
| C07 | Indeks kesiapan provinsi 2.0 | prioritas pembinaan | menambah anggaran, listrik desa, waktu izin, proyek tahap lanjut pada indeks kesiapan; rujukan: kerangka 11 faktor IESR [C] | INT, IESR [C] | A | M | 4 | C02, A02 | - |
| C08 | Peta konflik data pusat dan daerah | perbedaan angka | angka potensi atau kapasitas yang berbeda antar dokumen RUED, RUEN, ESDM | INT | A | M | 3 | L01 | POLITIK |
| C09 | Pemantau penerapan RUKN | arah nasional | target RUKN per tahun dan sumber; PDF diseminasi [C] | gatrik.esdm.go.id [C]; PDF | D | S | 3 | - | - |
| C10 | Tanya jawab perizinan EBT | prosedur izin | alur OSS per jenis pembangkit dengan perkiraan lama, yang bisa diperiksa (peningkatan X) | OSS [C], aturan | K | M | 4 | - | - |
| C11 | Direktori kontak dinas energi | siapa dihubungi | dinas ESDM/DPMPTSP provinsi dan kabupaten, plus pejabat publik | situs pemda; MAN | D | M | 3 | - | PRIBADI (hanya jabatan, bukan kontak pribadi) |
| C12 | Pelacak desa energi mandiri | program desa | daftar Desa Energi Berdikari, PLTMH, PLTS komunal (desa_energi.json ada, daftar desa belum) | Kemendes [-], ESDM; UNDUH | D | M | 3 | - | - |
| C13 | Peta potensi hidro mikro | daerah terpencil | potensi hidro kecil dari DEM dan aliran | SRTM/HydroSHEDS [-]; UNDUH | D | L | 3 | - | - |
| C14 | Rapor transisi per provinsi (bulanan) | komunikasi publik | PDF/PNG ringkas per provinsi, otomatis dari potret (peningkatan rapor bulanan P2) | INT | F | S | 3 | C07 | - |
| C15 | Kamus istilah dan satuan | kesalahan baca | glosarium bilingual MW/MWp/MWac, kapasitas terpasang vs dapat diandalkan, bauran primer vs listrik | docs/GLOSARIUM.md, IRENA [C] | K | S | 3 | - | - |
| C16 | Pelacak pelaporan inventarisasi GRK daerah | kepatuhan | provinsi yang sudah lapor IGRK (Kompas: baru 21 provinsi pada 2025 [C]) | KLH siaran pers [C]; MAN | D | S | 3 | - | - |

### D. DPR dan pembuat kebijakan (8)

| ID | Nama | Keputusan atau masalah | Isi | Sumber dan akses | J | U | D | Gantung | Putusan |
|---|---|---|---|---|---|---|---|---|---|
| D01 | Pelacak RUU dan Prolegnas energi | posisi METI | status RUU EBET, tahap, fraksi, versi naskah (peningkatan pelacak kebijakan) | dpr.go.id [-]; OTO dan MAN | D | M | 4 | - | POLITIK |
| D02 | Kalender konsultasi publik dan tenggat (usul lama AD) | kapan memberi masukan | RPP/Permen berstatus konsultasi, batas masukan | situs ESDM, JDIH [-]; OTO | F | M | 5 | - | - |
| D03 | Repositori masukan METI | rekam jejak advokasi | 22 usulan METI, aturan terkait, tanggapan, hasil (usul lama AC) | INT | F | M | 5 | - | POLITIK |
| D04 | Analisis dampak aturan | dampak sebelum terbit | ringkasan per rancangan: siapa terdampak, biaya, tarif, TKDN | INT dan pakar | A | L | 4 | D02 | - |
| D05 | Bandingkan aturan ASEAN | belajar negara lain | lelang, tarif, target per negara (asean_energi.json punya kolom null) | dokumen negara; PDF | D | L | 3 | - | - |
| D06 | Tabel pemetaan target internasional | konsistensi | target NDC, JETP, RUEN, RUPTL, KEN dalam satu tabel dan perbedaannya | dokumen resmi; PDF | D | S | 4 | L01 | - |
| D07 | Jejak suara komite | siapa membahas apa | pembahasan komite energi DPR yang menyentuh EBT | dpr.go.id [-]; MAN | D | M | 2 | D01 | POLITIK, PRIBADI |
| D08 | Panduan singkat kebijakan | anggota legislatif non-teknis | satu halaman per isu: apa, kenapa, pilihan, biaya | INT | K | M | 3 | - | - |

### E. Akademisi, mahasiswa, pencari kerja (14)

| ID | Nama | Keputusan atau masalah | Isi | Sumber dan akses | J | U | D | Gantung | Putusan |
|---|---|---|---|---|---|---|---|---|---|
| E01 | Peta riset EBT per topik dan kampus (peningkatan riset_kampus) | siapa meneliti apa | perluas dari 25 kampus ke semua, kata kunci Indonesia, graf kolaborasi | OpenAlex CC0 [-], Garuda; OTO | D | M | 4 | - | - |
| E02 | Celah riset | topik yang kurang | topik tinggi permintaan (dari Proyek) tetapi sedikit riset | riset_ebt.json, proyek.json | A | M | 3 | E01 | - |
| E03 | Kumpulan data terbuka untuk riset | bahan skripsi | paket dataset kurasi dengan kamus kolom, DOI Zenodo (peningkatan `/data`; unduhan publik dibatalkan pemilik, jadi untuk akun peneliti terverifikasi) | INT | F | M | 4 | K03 | LEGAL, POLITIK |
| E04 | Katalog paten EBT (usul lama) | inovasi lokal | paten Indonesia dan internasional bertopik EBT; DATA-BARU mencatat belum ada sumber terbaca [DATA-BARU] | WIPO PATENTSCOPE, PDKI [-] | D | L | 3 | - | LEGAL |
| E05 | Peta jalan karier EBT | memilih jalur | peran, kompetensi, sertifikasi BNSP (prodi_pelatihan.json 34 LSP), gaji bila ada | BNSP [-], survei METI | D | M | 4 | E07 | - |
| E06 | Lowongan EBT teragregasi | cari kerja | lowongan dari situs anggota dan portal publik, disaring teknologi dan provinsi | situs karir anggota; OTO | F | M | 4 | - | MITRA |
| E07 | Peta prodi dan lulusan EBT | pengembangan SDM | prodi EBT per kampus dan daya tampung | PDDikti [-], BAN-PT; sulit diotomasi (DATA-BARU mencatat tak terjangkau) | D | L | 3 | - | MITRA |
| E08 | Proyek akhir terbuka | topik skripsi | daftar masalah riil dari anggota METI yang boleh dikerjakan mahasiswa | anggota; MAN | K | M | 3 | I03 | MITRA |
| E09 | Magang dan beasiswa | peluang | magang di anggota, beasiswa energi | situs anggota, LPDP [-]; MAN | D | S | 3 | - | - |
| E10 | Dataset latih untuk mahasiswa | belajar analitik | notebook publik yang memakai dataset Direktori (Jupyter/Colab) | INT | K | M | 2 | E03 | - |
| E11 | Kamus rumus energi | belajar | faktor kapasitas, LCOE, PLF, degradasi modul; rumus dan contoh data Indonesia | INT, IRENA [C] | K | S | 2 | - | - |
| E12 | Peta laboratorium dan fasilitas uji | riset terapan | lab uji modul, baterai, turbin, panas bumi di kampus dan instansi | BSN, kampus; MAN | D | M | 3 | A19 | - |
| E13 | Kalender konferensi dan seminar | jejaring | konferensi EBT nasional dan internasional (kalender.json ada, tambah akademik) | situs penyelenggara; OTO | D | S | 2 | - | - |
| E14 | Bank soal dan sertifikasi mandiri | persiapan BNSP | latihan soal skema sertifikasi EBT | BNSP skema [-], METI | K | L | 2 | - | MITRA |

### F. Media (10)

| ID | Nama | Keputusan atau masalah | Isi | Sumber dan akses | J | U | D | Gantung | Putusan |
|---|---|---|---|---|---|---|---|---|---|
| F01 | Pemeriksa fakta angka | angka mana yang benar | masukkan klaim ("EBT 14,4%") dan lihat sumber, tahun, dan angka tandingan | INT, L01 | F | M | 5 | L01 | - |
| F02 | Kit data media | menulis cepat | ringkasan angka kunci per provinsi dan teknologi, siap kutip dengan sumber | INT | F | S | 4 | - | - |
| F03 | Grafik tersemat | berita memakai grafik kita | iframe/embed grafik dengan atribusi otomatis (rujukan OWID: grafik tersemat bebas dengan atribusi [B]) | INT | F | M | 4 | K03 | LEGAL |
| F04 | Kalender rilis data | kapan data baru terbit | jadwal rilis HEESI, Statistik Listrik BPS, RUPTL, IETO, laporan kuartal | situs penerbit; MAN | D | S | 3 | - | - |
| F05 | Pencari narasumber (usul lama AG) | cari pakar | pakar per topik, kontak lewat sekretariat | orang.json | F | M | 4 | - | PRIBADI |
| F06 | Kliping berita ternilai | cepat tahu | berita EBT dengan label nada, proyek terkait, dan tingkat sumber (media_tier.json ada) | berita.json | D | M | 3 | - | - |
| F07 | Linimasa kejadian besar | konteks | peristiwa kunci: aturan, proyek, pembatalan, per teknologi | INT | D | M | 3 | A01 | - |
| F08 | Kamus bantahan | menanggapi mitos | mitos umum (PLTS mahal, PLTB tak cocok) dengan data lokal | INT | K | S | 3 | - | - |
| F09 | Tangkapan data hari ini | topik harian | tiga angka paling berubah minggu ini | INT | F | S | 3 | K07 | - |
| F10 | Kartu bagikan per angka | media sosial | kartu gambar per angka (OG; pemilik membatalkan OG sebelumnya, jadi butuh putusan ulang) | INT | F | S | 3 | - | POLITIK |

### G. LSM dan masyarakat terdampak (12)

| ID | Nama | Keputusan atau masalah | Isi | Sumber dan akses | J | U | D | Gantung | Putusan |
|---|---|---|---|---|---|---|---|---|---|
| G01 | Peta proyek dan dampak sosial | masyarakat tahu proyek di sekitarnya | proyek, status AMDAL, jadwal konsultasi | amdal.json, proyek.json | F | M | 4 | A01 | - |
| G02 | Pelacak konsultasi AMDAL | kapan memberi masukan | pengumuman AMDAL baru (AMDALNET) dengan batas masukan | AMDALNET (amdal.json) OTO | F | S | 4 | - | - |
| G03 | Peta konflik dan penolakan proyek (usul lama 10) | risiko sosial | konflik tercatat dari berita, kategori, status penyelesaian | berita; MAN | D | L | 3 | - | POLITIK, LEGAL |
| G04 | Panduan hak warga | menghadapi proyek | hak informasi, ganti rugi, FPIC, ringkasan peraturan | JDIH [-]; MAN | K | M | 3 | - | - |
| G05 | Peta kemiskinan energi | siapa belum berlistrik | desa/kabupaten dengan rasio elektrifikasi rendah (desa_listrik.json) | ESDM statistik, BPS [B] | D | M | 4 | - | - |
| G06 | Panduan koperasi energi desa | warga bisa membentuk | langkah, contoh PLTS komunal, pembiayaan (usul lama 16) | Kemendes [-], contoh proyek | K | M | 4 | - | - |
| G07 | Peta pekerjaan terdampak transisi | transisi adil | pekerja batu bara per kabupaten (Ember: Kaltim bisa kehilangan 17.000 pekerjaan pertambangan sampai 2050 [B]) | Ember [B], BPS | D | L | 4 | - | POLITIK |
| G08 | Pelacak aduan dan ombudsman | saluran keluhan | rujukan saluran aduan per jenis masalah | situs lembaga; MAN | K | S | 2 | - | - |
| G09 | Indeks transparansi proyek | siapa terbuka | skor keterbukaan dokumen per pengembang (AMDAL, laporan, kontak) | INT | A | M | 3 | A01 | POLITIK |
| G10 | Pemantau dampak lingkungan lokal | pengawasan | indeks vegetasi, tutupan lahan sekitar proyek (Sentinel) | Copernicus [-]; OTO | D | L | 3 | - | - |
| G11 | Peta jejak karbon desa | menghitung emisi | emisi per kabupaten dari SIGN SMART bila tersedia | SIGN SMART [C], Climate TRACE [B] | D | L | 3 | - | LEGAL |
| G12 | Sekolah dan puskesmas tanpa listrik | prioritas | fasilitas publik tanpa listrik andal dan peluang PLTS | Dapodik, ESDM; sebagian formulir [-] | D | L | 4 | - | MITRA |

### H. Pendana internasional dan lembaga keuangan (14)

| ID | Nama | Keputusan atau masalah | Isi | Sumber dan akses | J | U | D | Gantung | Putusan |
|---|---|---|---|---|---|---|---|---|---|
| H01 | Pencocok pendana dan proyek | siapa mendanai apa | proyek siap dibiayai vs mandat tiap pendana (ADB, AIIB, IFC, JETP) | pendanaan_internasional.json (ada), jetp_cipp.json | F | L | 5 | A01 | - |
| H02 | Daftar proyek JETP/CIPP terstruktur | cakupan JETP | tabel CIPP lengkap (DATA-BARU: PDF terputus); ember: JETP baru mencakup 43% kebutuhan [B] | Sekretariat JETP; UNDUH | D | M | 5 | - | UNDUH |
| H03 | Dasbor arus investasi EBT vs fosil | skala celah investasi | integrasi data CPI 2019-2023 (USD 38,02 miliar) [B] dengan proyek Direktori | CPI [B]; UNDUH | A | M | 4 | - | LEGAL (lisensi CPI belum terbaca) |
| H04 | Pelacak instrumen: obligasi hijau, sukuk, pinjaman berkelanjutan | alternatif pendanaan | penerbitan, nilai, tujuan, peringkat (obligasi_hijau.json 12 baris) | DJPPR, OJK, IDX; MAN | D | M | 4 | - | - |
| H05 | Kelayakan dalam taksonomi TKBI | apakah kegiatan masuk "hijau" | cek aktivitas proyek terhadap TKBI v2 (hijau, transisi, tidak memenuhi), ambang 100 gCO2e/kWh dari pemberitaan [C] | OJK TKBI PDF [C]; PDF | F | M | 4 | - | LEGAL |
| H06 | Dasbor bank dan portofolio hijau | siapa membiayai | pangsa pembiayaan EBT bank, sumber laporan keberlanjutan | laporan tahunan bank; PDF | D | L | 4 | - | - |
| H07 | Daftar penjamin dan asuransi risiko | menurunkan risiko | PII, ADB guarantee, MIGA, JETP instrumen | situs lembaga; MAN | D | S | 3 | - | - |
| H08 | Kursus mitigasi risiko valas | pendanaan USD | skema hedging TCX, PLN dan Kemenkeu | situs lembaga | K | S | 2 | - | - |
| H09 | Dasbor hibah dan studi kelayakan | pendanaan dini | skema hibah project preparation (SDG Indonesia One, ADB, GIZ, USAID) | situs lembaga; MAN | D | M | 4 | - | - |
| H10 | Peta pembiayaan koperasi dan UMKM EBT | mikro | program KUR hijau, LPDB, bank desa | OJK, LPDB; MAN | D | M | 3 | - | - |
| H11 | Pelacak kredit karbon proyek EBT | nilai tambahan | proyek bersertifikat (karbon_proyek.json 26), harga, buyer | VROD, Gold Standard, SRN; OTO | D | M | 4 | M01 | - |
| H12 | Standar uji tuntas ESG | memenuhi investor | daftar periksa IFC PS, Equator Principles untuk EBT Indonesia | IFC [-]; MAN | K | S | 3 | - | - |
| H13 | Penilaian risiko negara untuk investor | persepsi risiko | kontrak, kurs, regulasi, TKDN, dirangkum netral dari sumber publik | INT, IMF/WB [-] | A | M | 3 | - | POLITIK |
| H14 | Pembanding Indonesia dan negara tetangga | tempat investasi | tarif, target, lelang Vietnam, Filipina, India, Thailand | asean_energi.json, IRENA [C]; PDF | A | M | 3 | D05 | - |

### I. Anggota METI dan METI Wilayah (14)

| ID | Nama | Keputusan atau masalah | Isi | Sumber dan akses | J | U | D | Gantung | Putusan |
|---|---|---|---|---|---|---|---|---|---|
| I01 | Portal perusahaan terverifikasi | anggota mengurus profil sendiri | login perusahaan, ubah profil dan portofolio lewat antrean kurasi (butir 8 VISI) | INT | F | L | 5 | - | PRIBADI |
| I02 | Dasbor kontribusi anggota (usul lama AJ) | menunjukkan nilai METI | MW, proyek, investasi, tenaga kerja agregat | INT | F | M | 4 | I01 | MITRA |
| I03 | Papan permintaan kerja sama | mempertemukan | anggota memasang kebutuhan (cari mitra, pasokan, lokasi), kurator memoderasi | INT | F | M | 4 | I01 | PRIBADI |
| I04 | Direktori kepakaran anggota | mencari pakar | keahlian per anggota ditandai topik, publikasi (OpenAlex) | orang.json, OpenAlex | F | M | 4 | - | PRIBADI |
| I05 | Peta jejaring METI Wilayah | koordinasi | peta pengurus, kegiatan, agenda per wilayah (meti-wilayah.json) | INT | F | M | 3 | - | - |
| I06 | Buku tahunan METI | dokumentasi | rekap proyek, advokasi, acara, anggota baru per tahun | INT | A | M | 3 | I02 | - |
| I07 | Polling isu kebijakan anggota (usul lama 17) | suara anggota | jajak singkat dengan hasil agregat | INT | F | S | 3 | I01 | PRIBADI |
| I08 | Dasbor keanggotaan untuk admin (usul lama 18) | iuran, partisipasi | status iuran, kehadiran acara | INT | F | M | 3 | I01 | PRIBADI |
| I09 | Pendaftar acara dan sertifikat kehadiran | acara METI | RSVP, kehadiran, sertifikat PDF (RSVP ada) | INT | F | M | 3 | - | PRIBADI |
| I10 | Bank dokumen anggota | berbagi | kertas posisi, template, notulen khusus anggota | INT | F | M | 3 | I01 | MITRA |
| I11 | Forum tanya-jawab pakar | menjawab pertanyaan | tanya dan jawab bersitasi, dimoderasi | INT | K | L | 3 | - | PRIBADI |
| I12 | Peta kebutuhan anggota per wilayah | agenda wilayah | survei singkat tantangan per wilayah | INT | K | M | 3 | I05 | PRIBADI |
| I13 | Kartu anggota digital (peningkatan kta.html) | identitas | KTA di telepon, pengecekan oleh pihak lain | kta.html (ada) | F | S | 2 | - | PRIBADI |
| I14 | Jadwal bersama METI Wilayah | menghindari bentrok | kalender gabungan pusat dan wilayah (kalender.json ada, tambah wilayah) | INT | F | S | 3 | - | - |

### J. Pemasok dan pabrikan (12)

| ID | Nama | Keputusan atau masalah | Isi | Sumber dan akses | J | U | D | Gantung | Putusan |
|---|---|---|---|---|---|---|---|---|---|
| J01 | Pemetaan kapasitas pabrik lokal | siapa bisa memasok | pabrik modul, inverter, baterai, turbin, kabel: lokasi, kapasitas, TKDN (rantai_plts.json, tkdn.json ada) | Kemenperin, siaran pers; MAN | D | M | 5 | - | - |
| J02 | Pelacak TKDN per proyek | kepatuhan | persyaratan TKDN per jenis proyek dan produk bersertifikat | Kemenperin [-]; PDF | D | M | 4 | - | - |
| J03 | Pelacak impor modul dan komponen | ketergantungan | impor HS 8541 per negara (usul lama 5) | BPS ekspor-impor [C]; UNDUH | D | M | 4 | - | LEGAL |
| J04 | Papan permintaan komponen | prakiraan pasar | MW proyek RUPTL per tahun dikonversi ke jumlah modul, inverter, turbin | RUPTL, A01 | A | M | 5 | A01 | - |
| J05 | Peta bahan baku | pasokan nikel, tembaga, pasir silika | cadangan dan pengolahan bahan baku baterai dan modul; GEM mencatat pengolahan logam memakai batu bara [B] | Kementerian ESDM, GEM [B] | D | L | 4 | - | - |
| J06 | Katalog produk dan datasheet | memilih produk | produk bersertifikat per kategori dengan bagian teknis | situs pabrikan; MAN | D | L | 3 | I01 | MITRA |
| J07 | Daftar rekam jejak pemasok | seleksi | proyek yang pernah dipasok, sengketa publik, rating | INT | D | L | 4 | I01 | PRIBADI, LEGAL |
| J08 | Peta pelabuhan dan logistik | pengangkutan | pelabuhan dan jalan untuk pengiriman turbin dan trafo | OSM [-]; OTO | D | M | 3 | - | LEGAL (ODbL) |
| J09 | Daftar lab uji dan sertifikasi | memenuhi standar | LSPro, lab uji, SNI (usul lama 12) | BSN, BNSP [-]; MAN | D | M | 3 | - | - |
| J10 | Perbandingan harga pasar | negosiasi | harga indikatif per teknologi bila ada sumber publik | media, rilis harga; MAN | D | M | 3 | - | LEGAL |
| J11 | Pelacak investasi pabrik | tren industri | pengumuman pabrik baru dari BKPM/berita | BKPM [C], berita | D | M | 3 | - | - |
| J12 | Papan kebutuhan pasokan lokal | membeli lokal | pengembang mengumumkan kebutuhan paket, pemasok merespons | INT | F | M | 3 | I03 | - |

### K. Data inti dan kualitas (14)

| ID | Nama | Keputusan atau masalah | Isi | Sumber dan akses | J | U | D | Gantung | Putusan |
|---|---|---|---|---|---|---|---|---|---|
| K01 | Pabrik ekstraksi dokumen resmi | data terkunci di PDF | alur yang mengubah PDF (RUPTL, HEESI, Statistik Listrik, Perda RUED) menjadi tabel dengan halaman asal, versi, dan pemeriksaan ulang oleh kurator | HEESI [C], BPS [B], RUPTL, peraturan.bpk.go.id; PDF | D | L | 5 | - | - |
| K02 | Versi dan sejarah tiap angka | kapan angka berubah | setiap angka menyimpan riwayat revisi dan sumber tiap versi | INT | F | M | 4 | K01 | - |
| K03 | Registri lisensi dan atribusi | boleh dipakai apa | tiap dataset dan baris punya lisensi (CC BY, ODbL, CC BY-NC dsb), teks atribusi, aturan berbagi-serupa | semua sumber; INT | D | M | 5 | - | LEGAL |
| K04 | API baca-saja bertoken (usul lama P2 12) | mitra mengambil data | kuota, dokumentasi, versi, hanya set data berlisensi terbuka | INT | F | L | 4 | K03 | BIAYA, LEGAL, MITRA |
| K05 | Graf pengetahuan EBT | menelusuri keterkaitan | entitas bertaut (VISI butir 1): siapa membangun apa di mana, didanai siapa | INT | F | L | 5 | K02 | - |
| K06 | Kode wilayah baku | menggabung data | tabel kode BPS/Kemendagri 514 kab/kota dengan sejarah pemekaran | BPS/Kemendagri [-]; UNDUH | D | S | 4 | - | - |
| K07 | Skor kesegaran data | percaya | tampilkan usia tiap angka dan peringatan basi | INT | F | S | 4 | - | - |
| K08 | Deduplikasi entitas | konsistensi | gabung nama lembaga dan proyek ganda lintas sumber (GPPD, OSM, RUPTL) | cocok_proyek.mjs (ada) | D | M | 4 | - | - |
| K09 | Pengecekan silang antar sumber | menemukan salah | otomatis membandingkan angka sama dari sumber berbeda dan memberi tanda | INT | A | M | 4 | L01 | - |
| K10 | Lembar pembuatan data (data card) | transparansi | kartu per dataset: asal, metode, batas, penanggung jawab | INT | D | S | 3 | K03 | - |
| K11 | Bahasa dua arah | akses internasional | terjemahan penuh dengan tinjauan penutur (VISI butir 11) | INT | F | M | 3 | - | - |
| K12 | Aksesibilitas | pengguna disabilitas | mode baca layar, kontras, navigasi papan ketik | INT | F | M | 3 | - | - |
| K13 | Pemantau kesehatan sumber | sumber mati | tautan sumber diperiksa terjadwal, tanda saat berubah (peningkatan kesehatan data) | INT | F | S | 3 | - | - |
| K14 | Kiriman data dari pengguna | memperkaya | formulir koreksi dengan bukti dan antrean kurator (peningkatan koreksi) | INT | F | M | 4 | - | PRIBADI |

### L. Analisis dan indeks (14)

| ID | Nama | Keputusan atau masalah | Isi | Sumber dan akses | J | U | D | Gantung | Putusan |
|---|---|---|---|---|---|---|---|---|---|
| L01 | Papan rekonsiliasi angka | angka berbeda antar sumber | satu indikator (kapasitas EBT, bauran, SPKLU, volume karbon) dengan semua versi, selisih, dan penjelasan definisi; contoh nyata: kapasitas EBT 2025, jumlah SPKLU, volume IDXCarbon | ESDM, IESR, PLN, media [C]; MAN dan OTO | A | M | 5 | K02 | POLITIK |
| L02 | Pelacak kapasitas baru bulanan | seberapa cepat | MW baru per teknologi per bulan dari siaran pers dan laporan (IESR: tambahan 2025 sekitar 1,3 GW dari total 14,3 GW pada 2024 [C]) | ESDM/PLN siaran pers; OTO dan MAN | D | M | 5 | A01 | - |
| L03 | Proyeksi MW per tahun untuk capai target | jarak ke target | kapasitas yang dibutuhkan tiap tahun vs terpasang (peningkatan target.json) | target.json (ada) | A | S | 4 | L02 | - |
| L04 | Skor risiko proyek | prioritas pantau | gabungan COD lewat, tanpa kabar, perizinan, bukti (peningkatan pelacak J) | INT | A | M | 4 | A01 | POLITIK |
| L05 | Indeks daya saing teknologi per provinsi | di mana teknologi menang | LCOE lokal vs BPP | peluang.json, GSA/GWA [C] | A | M | 4 | - | - |
| L06 | Peta kerugian peluang (curtailment) | EBT terbuang | perkiraan energi terbuang bila jaringan lemah | RUPTL, A04 | A | L | 3 | A04 | - |
| L07 | Analisis sensitivitas tarif | tarif bankable | tarif minimum agar IRR sesuai di tiap provinsi | A05 | A | M | 4 | A05 | - |
| L08 | Dekomposisi bauran | bauran naik karena apa | porsi EBT naik karena EBT naik atau permintaan turun | HEESI [C] | A | S | 3 | K01 | - |
| L09 | Kajian ketimpangan wilayah | pemerataan | EBT per kapita dan per PDRB per provinsi (BPS) | BPS [B]; UNDUH | A | S | 3 | - | - |
| L10 | Skor kematangan teknologi di Indonesia | teknologi mana siap | tahapan: riset, uji coba, komersial, massal per teknologi | INT dan pakar | A | M | 3 | N16 | - |
| L11 | Perbandingan biaya pembangkit EBT vs fosil | persepsi biaya | LCOE vs BPP vs subsidi fosil (IESR: Rp1.023 triliun 2022-2026 [C]) | IESR [C], APBN | A | M | 4 | A06 | POLITIK |
| L12 | Skenario 2030 dan 2060 | arah | tombol skenario target RUEN/NZE dengan rujukan IESR EPS [C] | RUEN, IESR EPS [C] | A | L | 3 | - | LEGAL (lisensi model) |
| L13 | Indeks keseimbangan sistem | mana siap EBT besar | stabilitas sistem Jawa-Bali, Sumatra, dll | RUPTL | A | L | 3 | A04 | - |
| L14 | Laporan kuartalan "Kondisi EBT" | publikasi | PDF dari potret otomatis, bahan pers | INT | F | M | 4 | L02 | - |

### M. Iklim dan karbon (10)

| ID | Nama | Keputusan atau masalah | Isi | Sumber dan akses | J | U | D | Gantung | Putusan |
|---|---|---|---|---|---|---|---|---|---|
| M01 | Papan harga dan volume IDXCarbon | pasar karbon | seri harian/bulanan volume, nilai, harga (kumulatif 1,98 juta ton, Rp93,81 miliar hingga 30 Jun 2026 [C]) | IDXCarbon laporan; OTO atau MAN | D | S | 4 | - | - |
| M02 | Faktor emisi grid per sistem | hitung emisi terhindar | faktor emisi ESDM per sistem (usul lama 3) | ESDM; PDF | D | S | 4 | K01 | - |
| M03 | Kalkulator emisi terhindar dan kredit | nilai karbon | MW ke tCO2 terhindar dan estimasi pendapatan | M02, M01 | F | S | 4 | M02 | - |
| M04 | Peta emisi sektor listrik per aset | sumber emisi | emisi PLTU per aset (Climate TRACE CC 4.0, API beta) [B] | Climate TRACE [B]; OTO | D | M | 4 | - | LEGAL |
| M05 | Status SRN PPI per proyek | sertifikasi | proyek terdaftar SRN dan SPEI (data publik terbatas) | SRN [C]; MAN | D | M | 3 | - | - |
| M06 | Pelacak pajak karbon | rencana | status regulasi pajak karbon dan tarif | JDIH Kemenkeu; MAN | D | S | 3 | - | - |
| M07 | NDC dan pelaporan | komitmen | target NDC, laporan transparansi, BTR | UNFCCC [-]; PDF | D | S | 3 | D06 | - |
| M08 | Pasar karbon global pembanding | harga | harga EU ETS, VCM | publik [-]; OTO | D | S | 2 | - | LEGAL |
| M09 | Peta penggunaan lahan karbon | risiko proyek | gambut/hutan sekitar proyek | KLHK [-] | D | L | 3 | A11 | - |
| M10 | Kartu komitmen korporasi (usul lama 6) | siapa komit | target net zero, EBT, anggota RE100 dan CDP (daftar anggota RE100 terbuka) [B] | RE100 [B], laporan keberlanjutan; MAN | D | M | 4 | A13 | - |

### N. Teknologi spesifik (16)

| ID | Nama | Keputusan atau masalah | Isi | Sumber dan akses | J | U | D | Gantung | Putusan |
|---|---|---|---|---|---|---|---|---|---|
| N01 | Peta PLTS terapung per waduk (usul lama Z) | lokasi | waduk, luas, potensi MWp (data waduk belum diambil [DATA-BARU]) | OSM, geoBoundaries; OTO | D | M | 4 | - | LEGAL |
| N02 | Pelacak PLTS atap dan komunal | adopsi | pemasang, kapasitas, kuota (plts_atap.json) | PLN/ESDM; MAN | D | M | 4 | B09 | - |
| N03 | Pelacak bayu | potensi riil | proyek bayu, kecepatan angin dari Global Wind Atlas [C] | GWA, proyek.json | D | M | 4 | A01 | - |
| N04 | Pelacak panas bumi | cadangan vs terpasang | WKP, kapasitas, status eksplorasi, biaya (ESDM: sistem satu data menekan biaya eksplorasi [C]) | ESDM, wkp.json | D | M | 4 | A10 | - |
| N05 | Pelacak PLTA dan PLTMH | proyek hidro | proyek, sungai, kapasitas, sengketa; pembanding LCOE | proyek.json, IRENA [C] | D | M | 3 | - | - |
| N06 | Pelacak bioenergi (biomassa, biogas, BBN) | pasokan | pasokan limbah sawit, kebutuhan cofiring; Ember catat bioenergi tambahan 1,3 GW [B] | ESDM, GAPKI [-] | D | M | 4 | B07 | - |
| N07 | Pelacak sampah jadi energi | proyek PSEL | lokasi, status, tarif | siaran pers; MAN | D | M | 3 | - | - |
| N08 | Pelacak penyimpanan baterai | integrasi | proyek baterai, kapasitas, lokasi | RUPTL, siaran pers | D | M | 4 | - | - |
| N09 | Pelacak hidrogen dan amonia hijau (usul lama 7) | pasar baru | proyek, pelaku, target | berita; MAN | D | M | 3 | - | - |
| N10 | Pelacak kendaraan listrik dan SPKLU (usul lama 8) | permintaan | penjualan, SPKLU per provinsi (angka berbeda antar sumber [C]) | Gaikindo, PLN; MAN | D | M | 3 | L01 | - |
| N11 | Pelacak nuklir dan SMR | rencana | rencana PLTN, regulator BAPETEN | publik; MAN | D | S | 2 | - | POLITIK |
| N12 | Pelacak pembangkit hibrida | teknologi | proyek PLTS+baterai, PLTD hibrida | siaran pers | D | M | 3 | B03 | - |
| N13 | Pelacak efisiensi energi | permintaan | program audit, label hemat energi | ESDM; MAN | D | M | 3 | - | - |
| N14 | Pelacak panas surya dan industri | proses | pemanas surya industri | publik; MAN | D | M | 2 | - | - |
| N15 | Pelacak daur ulang modul dan baterai | akhir masa | regulasi, kapasitas daur ulang | siaran pers | D | M | 2 | - | - |
| N16 | Peta jalan per teknologi 2025-2060 (usul lama 19) | arah | milestone aturan, target, proyek kunci per teknologi | RUPTL, RUKN, NZE [C] | A | M | 4 | - | - |

### O. Komunitas dan produk METI (14)

| ID | Nama | Keputusan atau masalah | Isi | Sumber dan akses | J | U | D | Gantung | Putusan |
|---|---|---|---|---|---|---|---|---|---|
| O01 | Tanya Direktori (asisten bersumber) | tanya bahasa biasa | jawaban hanya dari data Direktori dengan kutipan; menolak bila tak ada dasar (VISI butir 2) | INT | F | L | 5 | K05 | BIAYA |
| O02 | Lonceng dan ringkasan mingguan | mengikuti perubahan | ikuti proyek, regulasi, provinsi; ringkasan "apa yang berubah" (usul lama 14, AH) | INT | F | M | 5 | K02 | - |
| O03 | Dasbor per peran | beranda relevan | beranda terpisah untuk investor, pemda, peneliti, media | INT | F | M | 4 | - | - |
| O04 | Bandingkan organisasi dan teknologi | memilih | tabel berdampingan (peningkatan bandingkan provinsi) | INT | F | M | 3 | - | - |
| O05 | Uji tuntas cepat organisasi (AF) | menilai mitra | satu lembar: profil, proyek, regulasi, berita, afiliasi | INT | F | M | 5 | K08 | LEGAL |
| O06 | Mode pameran (P2 13) | acara METI | putar otomatis sorotan | INT | F | M | 2 | - | - |
| O07 | Penghargaan METI | pengakuan | proyek dan tokoh berprestasi | INT | K | S | 2 | - | - |
| O08 | Podcast dan webinar bertranskrip | menjangkau | transkrip dan pencarian (podcast.json ada) | INT | F | M | 3 | - | - |
| O09 | Peta kegiatan pelatihan | meningkatkan kompetensi | jadwal pelatihan EBT per kota | situs anggota | D | S | 3 | E05 | - |
| O10 | Buletin dwimingguan | menjangkau | rangkuman otomatis dari O02 | INT | F | S | 3 | O02 | PRIBADI (surel) |
| O11 | Rujukan publik METI | identitas | halaman "METI dalam angka" (usul lama AJ) | INT | A | S | 3 | I02 | - |
| O12 | Dukungan tutor pengguna baru | adopsi | tur fitur, contoh pertanyaan | INT | K | S | 2 | - | - |
| O13 | Peta jalan platform terbuka | transparansi | halaman perkembangan dan papan suara pengguna | INT | K | S | 2 | - | - |
| O14 | Pengukuran penggunaan | evaluasi | kata cari tak terjawab, halaman terpopuler (VISI bagian 6) | INT | A | S | 3 | - | PRIBADI |

## 4. Dua puluh prioritas

Urutan menimbang dampak dibanding usaha, keunggulan yang sulit ditiru, dan penguatan peran METI sebagai wasit data dan penghubung pasar.

| # | Butir | Alasan strategis |
|---|---|---|
| 1 | A01 Pelacak pipeline proyek bertahap | Celah terbesar dari riset; dasar untuk A02, A07, A16, L02, L04. Datanya sudah sebagian ada (ruptl, amdal, proyek). |
| 2 | L01 Papan rekonsiliasi angka | Menjadikan METI wasit data. Murah (kurasi), dampak reputasi tinggi, sulit ditiru karena butuh kepercayaan. |
| 3 | K01 Pabrik ekstraksi dokumen resmi | Mengunci keunggulan data: dokumen terkunci PDF jadi tabel bersitasi halaman. Menjadi mesin untuk B01, C01, M02, L08. |
| 4 | K03 Registri lisensi dan atribusi | Syarat hukum sebelum data apa pun dibuka. ODbL dan CC BY-NC di sumber kita menuntut pelacakan per baris. |
| 5 | A09 Radar tender dari data pengadaan terbuka | Data siap unduh (opentender ODbL, OCDS) dan jawaban langsung bagi pengembang. |
| 6 | O02 Lonceng dan ringkasan mingguan | Membuat orang kembali tiap minggu; membuktikan data hidup. |
| 7 | A03 Skor kedekatan sambungan lokasi | Pertanyaan pertama investor. Menyatukan OSM, RUPTL, dan ESDM One Map. |
| 8 | C02 Anggaran EBT dalam APBD | Tidak ada pelacak publik; IESR hanya merekap sekali setahun. Menguatkan peran METI terhadap pemda. |
| 9 | H01 Pencocok pendana dan proyek | Mempertemukan sisi kebutuhan (A01) dan pasokan modal (IATI, JETP, CPI), peran perantara yang cocok untuk METI. |
| 10 | H02 Daftar proyek JETP/CIPP terstruktur | Dasar bagi H01; ketimpangan 43% dari kebutuhan layak disorot. |
| 11 | D02 Kalender konsultasi publik dan tenggat | Permintaan nyata anggota, memperkuat advokasi, usaha kecil. |
| 12 | D03 Repositori masukan METI | Menampilkan nilai METI sendiri. |
| 13 | A13 Peta pembeli listrik hijau | Sisi permintaan: KEK, smelter, pusat data. Hubungkan dengan REC dan RE100. |
| 14 | A14 Peta captive dan peluang substitusi | Peluang dengan skala GW; riset GEM dan CPI menunjukkan ukurannya. |
| 15 | I01 Portal perusahaan terverifikasi | Menyelesaikan masalah data basi dengan membuat anggota merawat datanya. |
| 16 | F01 Pemeriksa fakta angka | Alat media; memperluas jangkauan dan sitasi. |
| 17 | J04 Papan permintaan komponen | Menerjemahkan RUPTL jadi pasar bagi pemasok. |
| 18 | O01 Tanya Direktori | Antarmuka akhir yang mengubah semua data jadi jawaban; ditunda sampai K05 dan K02 siap supaya tidak mengarang. |
| 19 | L02 Pelacak kapasitas baru bulanan | Jawaban atas "seberapa cepat"; murah dari siaran pers. |
| 20 | C01 Papan RUED vs realisasi | Perda RUED sudah ada; hanya butuh realisasi dari HEESI. |

Butir tinggi dampak yang sengaja tidak masuk dua puluh: A11 (penyaring lahan, usaha L dengan risiko hukum lisensi), A05 (arus kas, kelayakan.js sudah ada dasar), K05 (graf, dikerjakan bertahap lewat A01).

## 5. Peta jalan tiga gelombang

**Gelombang 1 (bulan 0 sampai 3): fondasi dan data murah**
K03, K01 (RUPTL dan HEESI dulu), K07, K02, L01 (5 indikator dulu), L02, A09 (opentender), D02, D03, C01, M01, A06, H02, B04, A10, B08.
Keluaran: data bersitasi dan berlisensi, dua papan yang membedakan METI (L01, L02), radar tender.

**Gelombang 2 (bulan 3 sampai 9): produk pipeline dan keuangan**
A01, A02, A03, A04, H01, H03, H04, H05, C02, C07, A13, A14, B01, J01, J04, F01, F02, O02, I01, L03, L04.
Keluaran: pelacak pipeline bertahap, peta pembeli, cocok pendana-proyek, portal perusahaan.

**Gelombang 3 (bulan 9 sampai 18): jaringan dan kecerdasan**
K05, O01, K04, A11, A12, A07, C03, E03, F03, G01, G03, L12, I02, O05, N-seri (pelacak teknologi), butir sisa.
Keluaran: graf pengetahuan, asisten bersumber, API mitra, penyaring lahan, pelacak program prioritas.

## 6. Butir yang butuh keputusan pemilik

| Butir | Keputusan |
|---|---|
| O01 | kunci API dan biaya bulanan; batas jawaban dan penolakan |
| K04, E03, F03, F10 | pemilik membatalkan unduhan data dan kartu OG untuk publik pada 7 Nov; perlu putusan ulang bila dibuka untuk akun terverifikasi atau mitra |
| A14, B12 | unduhan GEM lewat formulir; pemilik mengunduh sendiri, lalu agen yang mengolah |
| I01, I03, I04, I07, I08, I09, I11, I12, K14, F05, O14 | menyentuh data pribadi (UU PDP): persetujuan, hak jawab, masa simpan |
| H03, A06, A18, J03 | lisensi CPI, IRENA, BPS belum jelas; perlu surat izin atau pembatasan ke ringkasan |
| A07, C04, B01, C08, G03, G09, G07, L01, L04 | sensitif ke pemerintah atau anggota; perlu kebijakan redaksi dan hak jawab |
| H01, J12, A15, A16, I03 | menyentuh kemitraan; perlu aturan keterlibatan METI sebagai perantara (konflik kepentingan) |
| A09, A03, J08, N01 | berbagi-serupa ODbL: apakah turunan data Direktori boleh dibuka dengan lisensi sama |
| K04 | skema kuota dan kemungkinan berbayar |
| O10 | layanan surel |

## 7. Catatan metode dan batas riset

- Ringkasan sumber memakai WebFetch (model kecil merangkum halaman) dan WebSearch; angka yang saya kutip dari pencarian ditandai [C] dan harus diperiksa pada sumber asli sebelum dipakai di produk.
- Dua belas sumber tidak terbaca (IRENA, SEIA, Solar Power Europe, WindEurope, IESR, Power Africa, IEEFA PDF, dan beberapa halaman JavaScript). Informasi tentang mereka dari pencarian tidak boleh dianggap lengkap.
- Hasil pencarian memuat bahan bertanggal 2026 dan beberapa berasal dari media; keandalan sumber sekunder tidak diuji satu per satu.
- Tidak ada data pribadi yang diambil. Tidak ada kode diubah dan tidak ada commit.

## 8. Dua puluh final (gabungan, diputuskan 8 Nov 2026)

Penggabungan dari 200 butir, 20 prioritas riset, dan 20 usulan awal. Yang sudah dibangun (Ikuti dan ringkasan mingguan O02, Portal lembaga I01, Indeks terbuka, Rantai pasok, Program prioritas) tidak dihitung ulang; hanya ditingkatkan bila perlu.

| # | Butir gabungan | Menggabungkan | Gelombang |
|---|---|---|---|
| 1 | Pelacak pipeline proyek bertahap (RUPTL, izin, PPA, financial close, konstruksi, COD) dengan peringatan proyek macet | A01, A02, A07, A16, L04, proyek bermasalah | 2 |
| 2 | Pabrik ekstraksi dokumen resmi: PDF (RUPTL, HEESI, Statistik PLN, Perda RUED, Kepmen BPP) jadi tabel berversi bersitasi halaman | K01, K02, K07, B01 | 1 |
| 3 | Registri lisensi dan atribusi per baris data, syarat sebelum apa pun dibuka | K03, K04 (dasar) | 1 |
| 4 | Papan rekonsiliasi angka plus pemeriksa fakta untuk media | L01, F01, F02 | 1 |
| 5 | Pelacak kapasitas baru bulanan dan rapor bulanan "Kondisi EBT Indonesia" (PDF/PNG siap bagi) | L02, M01, rapor bulanan | 1 |
| 6 | Radar tender dan pengadaan IPP (opentender OCDS, pengumuman PLN) | A09, A10 | 1 |
| 7 | Kedekatan jaringan: skor sambungan lokasi, gardu, transmisi, neraca daya per sistem | A03, B04, B08 | 2 |
| 8 | Pencocok pendana dan proyek, dengan daftar JETP/CIPP terstruktur dan pelacak pendanaan iklim | H01, H02, H03, H04, H05 | 2 |
| 9 | Peta sisi permintaan: pembeli listrik hijau (KEK, smelter, pusat data, RE100), captive dan peluang substitusinya | A13, A14 | 2 |
| 10 | Papan daerah: RUED dibanding realisasi, anggaran EBT di APBD, profil kabupaten/kota | C01, C02, C07, profil kab/kota | 1 dan 2 |
| 11 | Advokasi kebijakan: kalender konsultasi publik dan tenggat, plus repositori masukan dan posisi METI | D02, D03 | 1 |
| 12 | Kalkulator PLTS atap rumah dan industri (tagihan ke kWp, penghematan, balik modal, kuota sistem) | A05, kalkulator atap | 1 |
| 13 | Papan permintaan komponen dan pasar pemasok dari RUPTL (kebutuhan per tahun per komponen) | J01, J04 | 2 |
| 14 | Dedieselisasi dan elektrifikasi pulau: PLTD yang diganti EBT, peluang hibrida, desa belum berlistrik | B-seri dedieselisasi, desa listrik | 2 |
| 15 | Penyaring lahan dan risiko lokasi (kawasan hutan, gambut, rawan bencana, lahan bekas tambang) | A11, A12, lahan bekas tambang | 3 |
| 16 | Papan lowongan, magang, dan SDM hijau (prodi, LSP, pelatihan) | E-seri, lowongan, SDM hijau | 2 |
| 17 | Peta risiko sosial: konflik dan penolakan proyek, plus repositori AMDAL per proyek | G01, G03, AMDAL | 3 |
| 18 | Beranda per peran (investor, pemda, praktisi, peneliti, media) memakai semua papan di atas | beranda per peran | 2 |
| 19 | Graf pengetahuan lanjutan dan API mitra bertoken (baca saja, kuota) | K05, K04 | 3 |
| 20 | Tanya Direktori: asisten AI yang hanya menjawab dari data situs dengan kutipan | O01 | 3 (butuh keputusan biaya) |

Urutan kerja: gelombang 1 (nomor 2, 3, 4, 5, 6, 10a, 11, 12) membangun fondasi data dan produk yang langsung terlihat; gelombang 2 memakai fondasi itu untuk produk pasar; gelombang 3 menunggu data dan keputusan.
