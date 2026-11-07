# Riset sumber data publik: Direktori Jaringan Energi Terbarukan Indonesia (METI)

Tanggal riset: 7 Nov 2026. Cara verifikasi: curl/WebFetch/WebSearch langsung ke situs dan API pada hari ini. Tanda status per sumber:

- **[TERUJI]** endpoint dibuka dan isinya dibaca hari ini.
- **[SEBAGIAN]** halaman terbuka, tapi isi data/lisensi tidak bisa dipastikan dari halaman (situs JS, 403 bot, atau halaman tak menyebut).
- **[BELUM TERUJI]** hanya dari hasil pencarian atau pengetahuan umum; WAJIB dicek ulang sebelum dibangun.

Angka yang saya hitung sendiri hari ini ditulis tebal dengan "hitung 7 Nov". Angka dari berita/pencarian diberi sumber.

---

## 1. Tabel ringkas

| # | Sumber | Isi | Format / akses | Lisensi | Kunci | Entitas yang diisi | Status |
|---|---|---|---|---|---|---|---|
| 1 | OpenAlex | karya, penulis, institusi, topik, pendana | REST JSON | CC0 | opsional, kini ada jatah harian (lihat §3.1) | orang, kampus, riset, lembaga, pendana | TERUJI |
| 2 | Crossref | metadata DOI, pendana, referensi | REST JSON | fakta bebas; abstrak variatif | tidak (pakai `mailto`) | riset, pendanaan | TERUJI |
| 3 | ORCID Public API | profil peneliti, afiliasi | REST JSON/XML | CC0 untuk data publik | tidak untuk pencarian publik | orang | TERUJI |
| 4 | Ember (data tahunan) | bauran listrik, kapasitas, per negara | CSV bulk + API | CC BY 4.0 | CSV tidak; API ya | statistik nasional | TERUJI |
| 5 | Our World in Data energy-data | bauran listrik per negara, 1900-2024 | CSV di GitHub | CC BY 4.0 (data pihak ketiga ikut lisensi asal) | tidak | statistik nasional | TERUJI |
| 6 | WRI Global Power Plant DB v1.3.0 | pembangkit, 34.936 global | ZIP CSV | CC BY 4.0 | tidak | proyek/pembangkit | TERUJI |
| 7 | Global Energy Monitor (GEM) trackers | proyek surya/angin/hidro/panas bumi/bioenergi | unduh via formulir; ringkasan Google Sheets | CC BY 4.0 (sebagian TZ ID CC BY-NC 4.0) | formulir | proyek, pemilik/pengembang | SEBAGIAN |
| 8 | OpenStreetMap via Overpass | `power=plant/generator` | Overpass QL JSON | ODbL | tidak | proyek (lokasi) | TERUJI |
| 9 | IRENASTAT (PxWeb) | kapasitas/generasi per negara, 2000-2025 | API PxWeb JSON | hak cipta IRENA, syarat pakai tidak tertulis di halaman | tidak | statistik nasional | TERUJI (API), lisensi BELUM |
| 10 | World Bank Indicators API | rasio elektrifikasi, indikator energi | REST JSON | CC BY 4.0 | tidak | wilayah/nasional | TERUJI |
| 11 | World Bank Projects API | proyek Bank Dunia di Indonesia | REST JSON | CC BY 4.0 (umum WB) | tidak | pendanaan, proyek | TERUJI |
| 12 | HEESI ESDM | statistik energi dan ekonomi nasional | PDF | tidak dinyatakan | tidak | statistik nasional, regulasi konteks | TERUJI (PDF 2025 ada) |
| 13 | JDIH ESDM | peraturan Kementerian ESDM | HTML + PDF | publik | tidak | regulasi | TERUJI |
| 14 | peraturan.bpk.go.id | peraturan pusat/daerah + PDF | HTML + PDF | publik | tidak | regulasi | TERUJI |
| 15 | peraturan.go.id | JDIHN Kemenkum | HTML | publik | tidak | regulasi | SEBAGIAN |
| 16 | ESDM One Map (geoportal.esdm.go.id) | layer EBTKE, geologi, ketenagalistrikan | portal peta | tidak dinyatakan | akun untuk unduh | wilayah, proyek | SEBAGIAN, robots.txt melarang semua |
| 17 | EBTKE (ebtke.esdm.go.id) | statistik EBT, PLTS atap, WKP | SPA JS | tidak dinyatakan | tidak | proyek, statistik | SEBAGIAN, robots melarang `/lintas/` |
| 18 | PLN (RUPTL 2025-2034, statistik) | rencana tambah pembangkit | PDF | tidak dinyatakan | tidak | proyek rencana, wilayah | SEBAGIAN (rilis ESDM terbuka, PDF tak terlacak) |
| 19 | Global Solar Atlas | potensi PV | GeoTIFF/atlas web | CC BY 4.0 (setahu saya; belum terbaca hari ini) | tidak | wilayah (potensi) | BELUM TERUJI |
| 20 | Global Wind Atlas | potensi angin | aplikasi JS | idem | tidak | wilayah | BELUM TERUJI |
| 21 | BPS (WebAPI + sirusa) | rasio elektrifikasi, desa berlistrik, PDRB | REST JSON | CC BY 4.0 per kebijakan BPS (cek) | ya, gratis | wilayah | SEBAGIAN |
| 22 | Garuda (Kemdiktisaintek) | artikel jurnal Indonesia | HTML, tanpa API terdokumentasi | tidak dinyatakan | tidak | riset | SEBAGIAN |
| 23 | SINTA | profil dosen/peneliti, skor | HTML | tidak dinyatakan | tidak | orang, kampus | 403 untuk bot |
| 24 | AHU Online | badan hukum | HTML interaktif | publik terbatas | akun | perusahaan | SEBAGIAN |
| 25 | OSS / BKPM | perizinan, proyek investasi | portal | publik terbatas | akun | perusahaan | SEBAGIAN |
| 26 | PDKI DJKI | paten | HTML | publik | tidak | riset/inovasi | SEBAGIAN (redirect loop ke curl) |
| 27 | Asosiasi: AESI, APLSI, APROBI, dst. | daftar anggota | HTML | hak cipta asosiasi | tidak | lembaga, perusahaan | SEBAGIAN (AESI TERUJI) |
| 28 | JETP Indonesia / JDU | CIPP, daftar proyek | PDF/web | tidak dinyatakan | tidak | pendanaan, proyek | SEBAGIAN |
| 29 | ADB, AIIB, GCF, CPI, IATI | proyek pendanaan | web (ADB 403 bot) | beragam | tidak | pendanaan | SEBAGIAN |
| 30 | DEN, JDIH DPR | RUEN/KEN, RUU EBET | web | publik | tidak | regulasi | SEBAGIAN (jdih.dpr 403) |
| 31 | RSS media energi | berita | RSS | hak cipta media | tidak | berita/acara | BELUM TERUJI |
| 32 | IEA | statistik | web, berbayar | berbayar, 403 bot | ya | tidak dipakai | TERUJI (diblokir) |

---

## 2. Temuan penting hari ini (ringkas)

1. **WRI GPPD lemah untuk Indonesia.** Saya unduh dan hitung v1.3.0: dari 34.936 pembangkit global hanya **178 di Indonesia (hitung 7 Nov)**: batu bara 70, hidro 41, gas 41, minyak 16, panas bumi 10. **Nol surya, angin, biomassa.** Tahun COD kosong untuk 158 dari 178. Datanya basis 2019. Gunakan hanya sebagai penyemai hidro/panas bumi berskala besar, bukan sumber utama.
2. **OpenStreetMap lebih kaya untuk lokasi EBT** (hitung 7 Nov, `power=plant` di area Indonesia): surya **137** (135 way, 2 relation), angin **11**, hidro **95**, panas bumi **45**, biomassa **2**. Pembangkit di OSM jarang punya `operator`, `capacity` konsisten. Hitungan `power=generator` (PLTS per modul) timeout di server publik: pakai ekspor regional, bukan satu kueri nasional.
3. **OpenAlex adalah tulang punggung orang, kampus, riset.** 2.546 institusi bernegara ID (hitung 7 Nov). Karya dengan afiliasi ID dan subbidang 2105 (Renewable Energy, Sustainability and the Environment): **42.293** total, **5.643** tahun 2025. Hati-hati: subbidang 2105 terlalu longgar (contoh sampel: fotokatalis); pakai ID topik (T11007, T14444, T12271, T14481, T12503) dan saring ulang dengan kata kunci.
4. **OpenAlex kini punya anggaran harian bersama per IP** tanpa kunci (respons: "$0.10 budget shared per IP", kunci gratis memberi $1/hari). Pipeline GitHub Actions berbagi IP runner, jadi **wajib pakai `api_key`** (daftar gratis).
5. **Sumber statistik nasional paling mudah dipanen:** Ember CSV, OWID CSV, IRENASTAT PxWeb API, World Bank API. Semuanya JSON/CSV tanpa gerbang.
6. **Sumber pemerintah RI bisa dibaca tapi sebagian dilarang robots.txt:** `geoportal.esdm.go.id` (`Disallow: /` untuk semua), `ebtke.esdm.go.id` (`Disallow: /lintas/`, `/simantaps/`, `/konversi/`), ESDM utama (`/psbe/`, `/wkmigas/`, `/lhe/`, dll). JDIH ESDM, peraturan.bpk.go.id, peraturan.go.id mengizinkan.
7. **SINTA, ADB, IEA, IESR, JDIH DPR memblokir bot (403 / Cloudflare).** Jangan bypass: ini wilayah `scraper-antibot` dan hanya bila diizinkan pemilik, plus ada pertimbangan hukum (§6).

---

## 3. Detail per sumber

### 3.1 OpenAlex [TERUJI]
- URL: `https://api.openalex.org`
- Data: works, authors, institutions, topics, funders, sources, publishers. Institusi punya `ror`, `country_code`, `type` (education, company, government, nonprofit, facility).
- Format: JSON REST, paginasi cursor (`cursor=*`, `per-page` sampai 200).
- Lisensi: CC0.
- Kunci: opsional, tapi respons hari ini memuat peringatan jatah harian bersama per IP. Kunci gratis: `https://openalex.org/settings/api`, lalu `&api_key=...`. Simpan sebagai secret GitHub, jangan di repo.
- Contoh endpoint nyata (semua mengembalikan 200 hari ini):
  - `https://api.openalex.org/institutions?filter=country_code:ID&per-page=200` (2.546 institusi, urut karya terbanyak; teratas University of Indonesia, 94.684 karya)
  - `https://api.openalex.org/topics?search=renewable%20energy&per-page=5`
  - `https://api.openalex.org/works?filter=authorships.institutions.country_code:ID,topics.id:T11007|T14444|T12271|T14481|T12503&per-page=200&select=id,doi,title,publication_year,authorships,topics,cited_by_count`
  - Penulis dari sebuah karya: `authorships[].author.id`, `.orcid`, `.institutions[]`.
- Cakupan: sangat luas; sebagian afiliasi Indonesia salah dikenali (nama kampus ganda). Disambiguasi penulis belum sempurna (satu orang bisa terpecah ke beberapa ID).
- Pembaruan: kontinu (mingguan-an). Tanggal data terlihat: karya terbit 2025 sudah masuk.
- Kelemahan: subbidang 2105 mencampur kimia material; abstrak berbentuk inverted index; field `topics` bisa salah label.
- Mengisi: orang/pakar, kampus/lembaga, riset/publikasi, pendana (`funders`), tautan orang-lembaga-riset.

### 3.2 Crossref [TERUJI]
- URL: `https://api.crossref.org/works?query=solar+indonesia&rows=0` mengembalikan `total-results` 1.124.762 untuk "solar indonesia" (pencarian bebas, banyak noise).
- Format JSON; gunakan `mailto=` di parameter agar masuk "polite pool"; filter `filter=from-pub-date:2024-01,has-funder:true`.
- Lisensi: metadata faktual bebas dipakai; abstrak tergantung penerbit.
- Berguna untuk: pendana riset (`funder`), DOI kanonis, referensi. Funder registry: `https://api.crossref.org/funders?query=indonesia`.
- Tanpa kunci.
- Mengisi: riset, pendanaan. Cakupan afiliasi lemah dibanding OpenAlex; pakai hanya untuk melengkapi.

### 3.3 ORCID Public API [TERUJI]
- Pencarian: `https://pub.orcid.org/v3.0/expanded-search/?q=affiliation-org-name:"Institut Teknologi Bandung"&rows=1` (kirim `Accept: application/json`). Hasil hari ini: **5.669** ORCID dengan afiliasi ITB.
- Lisensi: data publik CC0; ORCID melarang pemakaian untuk spam/kontak massal. Hanya field yang diberi visibilitas publik.
- Kunci: pencarian publik tanpa kunci; untuk volume besar daftar client_credentials gratis.
- Kegunaan: menambatkan ID peneliti, bukan sumber utama. Banyak profil kosong. Email biasanya tersembunyi (bagus untuk PDP).
- Mengisi: orang (ID), afiliasi.

### 3.4 Ember [TERUJI]
- Halaman: `https://ember-energy.org/data/yearly-electricity-data/`, "Last Updated: 20/03/2026" (dari halaman API Ember).
- CSV bulk (diuji, 200): `https://files.ember-energy.org/public-downloads/generation/outputs/release_generation_yearly_global.csv`. Kolom: Area, ISO 3 code, Year, Electricity source, Generation (TWh), Capacity (GW), Share of generation (%), Emissions, dst.
- Indonesia surya, baris tahun 2025 tersedia (26 baris tahun, **hitung 7 Nov**); tahun terakhir 2025 untuk generasi surya 1,592 TWh, kolom kapasitas kosong untuk baris itu.
- API: `https://api.ember-energy.org/v1/...` butuh `api_key` (tes tanpa kunci: 403). Dokumentasi `https://api.ember-energy.org/v1/docs`.
- Lisensi: CC BY 4.0 (dinyatakan di halaman API). robots.txt Ember hanya melarang `/wp-json/` dan admin; CSV bulk di `files.` host terbuka.
- Format: CSV. Resolusi: negara-tahun (tidak ada provinsi).
- Mengisi: panel statistik nasional pada profil wilayah "Indonesia", konteks bauran.

### 3.5 Our World in Data energy-data [TERUJI]
- CSV: `https://raw.githubusercontent.com/owid/energy-data/master/owid-energy-data.csv` (9,2 MB; 200). Indonesia (IDN): 125 baris, tahun terakhir **2024** (hitung 7 Nov); 130 kolom; contoh 2024: surya 1,35 TWh, angin 0,47, hidro 27,29.
- Lisensi: repo menyatakan CC BY 4.0, tetapi data pihak ketiga (Energy Institute, Ember) ikut lisensi asal.
- Tanpa kunci. Pembaruan: berkala tahunan; ikut sumber (Energy Institute Statistical Review).
- Kegunaan: runtun panjang untuk grafik; redundan terhadap Ember. Pilih satu sebagai kanonis (rekomendasi Ember untuk tahun terbaru, OWID untuk 1965-).
- Mengisi: statistik nasional.

### 3.6 WRI Global Power Plant Database [TERUJI]
- Halaman: `https://datasets.wri.org/dataset/globalpowerplantdatabase`. Versi terbaru **1.3.0**, halaman menunjuk "Last Updated Oct 6, 2025" (1.1.0 dan 1.2.0 ditandai deprecated).
- Unduhan nyata (diuji, 200, 4,2 MB): `https://datasets.wri.org/private-admin/dataset/53623dfd-3df6-4f15-a091-67457cdb571f/resource/66bcdacc-3d0e-46ad-9271-a5a76b1853d2/download/globalpowerplantdatabasev130.zip`. Isi: `global_power_plant_database.csv` + README + catatan rilis.
- Lisensi: CC BY (metadata CKAN: Creative Commons Attribution; halaman web sendiri tidak menulisnya secara jelas).
- Kolom: country, name, gppd_idnr, capacity_mw, lat/lon, primary_fuel, commissioning_year, owner, source, url, generation 2013-2019.
- Indonesia: **178 pembangkit** (batu bara 70, hidro 41, gas 41, minyak 16, panas bumi 10; tanpa surya/angin/biomassa), COD kosong untuk 158 (**hitung 7 Nov**).
- Kualitas: statis, tidak lagi dipelihara aktif (pembangkit baru 2020+ hampir tidak ada). Tidak ada API stabil (jalur `package_show` CKAN mengembalikan error).
- Mengisi: proyek (hidro, panas bumi besar), pemilik/operator. Pakai sebagai cadangan pencocokan nama.

### 3.7 Global Energy Monitor [SEBAGIAN]
- Halaman unduh contoh: `https://globalenergymonitor.org/projects/global-solar-power-tracker/download-data/`. Rilis terbaru yang dinyatakan: **Februari 2026** (surya). Pelacak lain punya jadwal sendiri (hasil pencarian: hidro April 2025, panas bumi Maret 2025 di ringkasan GEM September 2025; cek ulang).
- Pelacak relevan: Global Solar, Wind, Hydropower, Geothermal, Bioenergy Power Tracker, plus Global Integrated Power Tracker. Tiap proyek punya ID GEM, kapasitas MW, status, tahun COD/rencana, lokasi, pemilik/pemegang saham induk.
- Akses: tombol "Download data" memicu formulir (skrip `gem-download-form.bundle.js` memanggil layanan Supabase `presign`), jadi **tidak ada URL tetap yang dapat dipanen otomatis**. Ringkasan tabel tersedia di Google Sheets (bukan basis proyek).
- Lisensi: CC BY 4.0 dengan atribusi; catatan: baris bertanda "TZ ID" dari TransitionZero Solar Asset Mapper berlisensi **CC BY-NC 4.0** (non-komersial). Harus disaring bila direktori dapat dianggap komersial atau berbayar.
- Rekomendasi: unduh manual sekali per rilis (formulir) oleh METI dan simpan XLSX di R2/repo privat; jangan buat scraper melawan formulir. Alternatif: menghubungi GEM (alamat kontak tertera di halaman) untuk akses data berkala.
- Mengisi: proyek (nilai tinggi: pemilik, kapasitas, status), perusahaan induk.

### 3.8 OpenStreetMap / Overpass [TERUJI]
- Endpoint: `https://overpass-api.de/api/interpreter` (POST `data=`). Basis data per 7 Nov 2026 (timestamp respons 2026-11-07T05:45Z).
- Catatan teknis: **harus kirim User-Agent khusus**; UA bawaan curl/browser umum mengembalikan **HTTP 406**. Cermin `overpass.private.coffee` mengembalikan kosong; `overpass.kumi.systems` lambat (>3 menit).
- Kueri teruji (hitung 7 Nov): `area["ISO3166-1"="ID"]->.a; nwr["power"="plant"]["plant:source"="solar"](area.a); out count;` → 137 (solar), 11 (wind), 95 (hydro), 45 (geothermal), 2 (biomass). `power=generator` nasional timeout; pecah per provinsi.
- Lisensi: ODbL (atribusi + share-alike untuk basis data turunan yang dipublikasikan). Direktori yang menggabungkan OSM ke dalam basis data publik harus patuh share-alike atau menyimpan OSM sebagai lapisan terpisah.
- Kualitas: tag `operator`, `plant:output:electricity` sering kosong; nama bisa tak seragam. Tidak boleh dianggap lengkap (PLTS atap hampir tak ada).
- Batas laju: kebijakan penggunaan wajar; satu kueri per beberapa menit, cache hasil.
- Mengisi: proyek (titik lokasi untuk peta), pemetaan ke wilayah.

### 3.9 IRENASTAT [TERUJI untuk API; lisensi BELUM]
- Portal: `https://pxweb.irena.org/pxweb/en/IRENASTAT` (PxWeb 2020 v1). Halaman unduh biasa `irena.org/Data/Download-statistics` memblokir bot (403) tetapi API PxWeb berjalan.
- API (diuji): `https://pxweb.irena.org/api/v1/en/IRENASTAT/Power%20Capacity%20and%20Generation` menampilkan tabel `Country_ELECSTAT_2026_H2_PX.px` (update 2026-09-28), `Region_ELECSTAT_2026_H2_PX.px`, `RE-SHARE_2026_H2_PX.px`.
- Metadata tabel: variabel Country/area (224), Technology (26), Data Type (2: kapasitas/generasi), Grid connection (3), Year (26; tahun terakhir 2025).
- Cara ambil: POST JSON query ke URL tabel dengan `{"query":[{"code":"Country/area","selection":{"filter":"item","values":["IDN"]}}],"response":{"format":"csv"}}` (format PxWeb standar; belum saya jalankan sampai selesai).
- Lisensi: halaman hanya menulis "© IRENA, All Rights Reserved". Aturan reuse IRENA (setahu saya, CC BY 4.0 untuk data statistik sejak 2023) **belum terverifikasi hari ini**; tanyakan atau baca halaman terms sebelum menampilkan ulang.
- Mengisi: statistik nasional per teknologi (terperinci: bioenergi, panas bumi, hidro, laut), pelengkap Ember.

### 3.10 World Bank Indicators API [TERUJI]
- `https://api.worldbank.org/v2/country/IDN/indicator/EG.ELC.ACCS.ZS?format=json&per_page=100`. Hasil: akses listrik Indonesia 2024 = **99,9%** (2025 null); `lastupdated` 2026-10-08.
- Lisensi: CC BY 4.0. Tanpa kunci. Hanya level nasional. Indikator lain: `EG.FEC.RNEW.ZS` (porsi EBT konsumsi akhir), `EG.ELC.RNEW.ZS`.
- Mengisi: statistik wilayah nasional.

### 3.11 World Bank Projects API [TERUJI]
- `https://search.worldbank.org/api/v2/projects?format=json&countrycode_exact=ID&rows=100&fl=id,project_name,totalcommamt,boardapprovaldate,sector1,url`. Total proyek Indonesia: **593** (hitung 7 Nov). Contoh nyata: P099757 "Geothermal Power Generation Development".
- Filter energi: `qterm=geothermal+solar+renewable` (hasil 5 pada percobaan; kata kunci, tidak ada filter sektor yang andal; `sector_exact=Energy and Extractives` mengembalikan 0).
- Field berguna: `id`, `project_name`, `totalcommamt`, `boardapprovaldate`, `url`, `project_abstract`. Beberapa nilai `totalcommamt` bernilai 0 (proyek belum ber-komitmen).
- Lisensi CC BY 4.0, tanpa kunci.
- Mengisi: pendanaan (Bank Dunia sebagai investor/mitra), proyek (pendanaan).

### 3.12 HEESI ESDM [TERUJI]
- Halaman: `https://www.esdm.go.id/id/publikasi/handbook-of-energy-economic-statistics-of-indonesia`.
- PDF edisi **2025**: `https://esdm.go.id/assets/media/content/content-handbook-of-energy-and-economic-statistics-of-indonesia-2025.pdf` (HTTP 200, `application/pdf`, 10,96 MB, Last-Modified 27 Agt 2026; diuji dengan HEAD). Edisi 2024 dirilis Juli 2025 (hasil pencarian). Pola URL sama untuk 2023 dan 2024.
- Format: PDF dengan tabel; parse dengan `pdftotext -layout` (di luar stdlib; bisa dijalankan di langkah lokal, bukan di Actions stdlib murni).
- Lisensi: tidak dinyatakan; data pemerintah, pakai dengan sitasi.
- Isi: bauran, kapasitas terpasang per jenis pembangkit, produksi listrik, per tahun (tahun data biasanya t-1).
- Mengisi: statistik nasional dan sebagian provinsi; konteks regulasi.

### 3.13 JDIH ESDM [TERUJI]
- `https://jdih.esdm.go.id/dokumen/peraturan` (daftar), PDF: `https://jdih.esdm.go.id/dokumen/download?id=2025pmesdm17.pdf` (pola nyata terlihat di beranda; entri 2026 ada, mis. `2026pmesdm12.pdf`, `2026kmesdm381k.pdf`).
- robots.txt: `Allow: /`.
- Format HTML (Yii) + PDF; metadata (nomor, tahun, tentang, status) di halaman detail. Cakupan: UU/PP/Perpres/Permen/Kepmen sektor ESDM. Pembaruan: berjalan.
- Lisensi: dokumen peraturan adalah domain publik (UU 28/2014 Pasal 42: peraturan perundang-undangan tidak berhak cipta).
- Mengisi: regulasi (tautan ke pengembang yang terdampak melalui topik).

### 3.14 peraturan.bpk.go.id [TERUJI]
- Pencarian: `https://peraturan.bpk.go.id/Search?keywords=energi%20baru%20terbarukan`. Detail: `/Details/142586/permen-esdm-no-39-tahun-2017`. Unduh: `/Download/134009/Permen%20ESDM%20Nomor%2039%20Tahun%202017.pdf`.
- robots.txt: hanya melarang `/Admin/`, `/Identity/`, dll; menyediakan `sitemap.xml` (cara terbaik mengenumerasi seluruh dokumen secara sopan).
- Metadata per dokumen: jenis, nomor, tahun, tentang, status (mencabut/diubah oleh), relasi antar peraturan. Ini berguna untuk tautan "peraturan terkait".
- Tanpa kunci; HTML dipindai dengan regex/`html.parser`. Domain publik.
- Mengisi: regulasi + relasi regulasi-regulasi.

### 3.15 peraturan.go.id (JDIHN) [SEBAGIAN]
- Beranda terbuka (200, 75 KB); jalur pencarian yang saya coba (`/peraturan/index.html?q=...`) 404. robots.txt: `Disallow:` kosong (boleh); sitemap `https://peraturan.go.id/sitemap.xml`.
- Jalur terbaik: gunakan sitemap, bukan form pencarian. Duplikasi tinggi dengan BPK; jadikan cadangan.

### 3.16 ESDM One Map / Geoportal [SEBAGIAN]
- `https://geoportal.esdm.go.id/` (200; judul "ESDM One Map - Exploring Energy and Mineral Resources of Indonesia"); menu: `/home/map/ebtke`, `/home/map/ketenagalistrikan`, `/home/map/geologi`, `/home/data_dictionary`, `/home/file`, `/home/metadata_html`.
- **robots.txt: `User-agent: *` `Disallow: /`.** Jalur REST ArcGIS yang saya tebak (`/arcgis/rest/services`, `/gdi-esdm/rest/services`) mengembalikan 404/Cloudflare.
- Rekomendasi: **jangan panen otomatis**. Ajukan permintaan data resmi ke Pusdatin ESDM atau gunakan peta sebagai rujukan manual. Layer ketenagalistrikan dan EBTKE potensial sangat berguna (lokasi PLTS/PLTA/PLTP), jadi layak diminta lewat jalur METI.

### 3.17 EBTKE (ebtke.esdm.go.id) [SEBAGIAN]
- Beranda adalah SPA JS (1.620 byte HTML kosong); `/statistik` memberi halaman yang sama; `/api` 403. robots.txt: `Disallow: /simantaps/`, `/lintas/`, `/konversi/`.
- Data terbaru dari pencarian (bukan dari situs): PLTS atap **538 MWp, 10.882 pelanggan PLN (Juli 2025)**, 495 MWp (Juni 2025), 406,78 MW (Maret 2025); bauran EBT **15,2 GW (semester I 2025)** (Bisnis, Kompas, Wartaekonomi; lihat sumber di akhir). Belum ada publikasi "Statistik EBTKE 2025" yang saya temukan.
- Rekomendasi: panen angka lewat rilis berita ESDM (HTML statis) dan HEESI, bukan SPA. Minta data struktural (daftar pembangkit EBT per provinsi, IUPTL) langsung ke Ditjen EBTKE.

### 3.18 PLN dan RUPTL 2025-2034 [SEBAGIAN]
- Rilis ESDM resmi: `https://esdm.go.id/id/media-center/arsip-berita/kementerian-esdm-resmi-merilis-dokumen-ruptl-pln-2025-2034` (200). Nomor keputusan **Kepmen ESDM 188.K/TL.03/MEM.L/2025** (ditandatangani 26 Mei 2025; koreksi atas "TL.01" pada pertanyaan awal). Tambahan kapasitas 69,5 GW, 42,6 GW (61%) EBT; investasi Rp2.967,4 triliun (IESR via IDX Channel; hasil pencarian).
- Tautan PDF langsung tidak terkonfirmasi; `web.pln.co.id` tidak ter-resolve dari mesin ini dan `pln.co.id/investor/statistik` 404. PLN punya Statistik PLN tahunan (PDF), belum terverifikasi URL 2025.
- Catatan: dokumen memuat daftar proyek per sistem/wilayah (tabel di lampiran); ekstraksi dari PDF besar dan format tabel tidak seragam. Nilai tinggi untuk "proyek rencana" dan "wilayah".

### 3.19 Global Solar Atlas dan Global Wind Atlas [BELUM TERUJI]
- `https://globalsolaratlas.info/download/indonesia` dan `https://globalwindatlas.info/en/download/gis-files` terbuka (200), tetapi aplikasinya JS; pembaca otomatis hanya melihat judul, jadi detail lisensi/format **tidak terbaca**.
- Pengetahuan umum (cek ulang): data Global Solar Atlas disediakan Bank Dunia/ESMAP, dihasilkan Solargis, lisensi CC BY 4.0; unduhan per negara berupa GeoTIFF (GHI, DNI, PVOUT, dll). Global Wind Atlas dari DTU/World Bank, unduhan GeoTIFF/GIS file per negara (butuh klik manual).
- Penggunaan: hitung rata-rata PVOUT/kecepatan angin per kabupaten dari GeoTIFF (butuh GDAL/rasterio di luar stdlib; lakukan sekali, simpan hasil JSON). Tidak perlu panen berkala.
- Mengisi: wilayah (potensi surya/angin).

### 3.20 BPS [SEBAGIAN]
- WebAPI: `https://webapi.bps.go.id/v1/api/...` butuh `key` (respons 400 tanpa kunci, jadi aktif). Dokumentasi di `webapi.bps.go.id/documentation` memakai Cloudflare challenge ("Attention Required") untuk klien curl.
- Metadata: `https://sirusa.bps.go.id/` (200).
- Data relevan: rasio elektrifikasi, persentase rumah tangga berlistrik PLN/non-PLN, PDRB per provinsi/kabupaten. Desa berlistrik ada di Podes (rilis berkala).
- Kunci gratis; di repo pemilik sudah ada kebiasaan kunci BPS di Keychain (jangan di berkas). Untuk Actions gunakan secret.
- Mengisi: wilayah (profil provinsi/kabupaten).

### 3.21 Garuda [SEBAGIAN]
- `https://garuda.kemdiktisaintek.go.id/` (200). Tidak ada OAI-PMH atau API terdokumentasi yang saya temukan; `robots.txt` 404 (artinya tak ada aturan). Pencarian lewat HTML (`/documents?...`).
- Cakupan artikel jurnal nasional (Sinta-terakreditasi); sebagian besar tanpa DOI di OpenAlex. Nilai: pakar lokal yang tidak muncul di OpenAlex.
- Risiko: scraping HTML situs pemerintah; tanyakan izin; pakai laju rendah.

### 3.22 SINTA [diblokir untuk bot]
- `https://sinta.kemdiktisaintek.go.id/` dan `/robots.txt` mengembalikan **403 Forbidden** untuk klien otomatis. Tidak ada API publik terdokumentasi.
- Rekomendasi: **jangan di-scrape**. Alternatif legal: minta kerja sama (MoU/akses data) lewat Kemdiktisaintek, atau minta pakar mengisi ID SINTA sendiri (field di formulir METI).

### 3.23 AHU Online, OSS/BKPM, PDKI [SEBAGIAN]
- AHU: `https://ahu.go.id/` 200; robots `Allow: /`. Pencarian badan hukum interaktif (`ahu.go.id/pencarian/profil-pt`); data publik terbatas (nama, nomor SK) dan ada captcha/batas. Bukan untuk panen massal.
- OSS: `https://oss.go.id/` 200; robots melarang `/api/`, `/admin/`; sitemap `https://oss.go.id/api/sitemap/index`. Data proyek per perusahaan butuh login (NIB). Untuk direktori: hanya referensi publik (sitemap).
- PDKI: `https://pdki-indonesia.dgip.go.id/` memberi redirect berantai (curl berhenti di 50 redirect); butuh browser. Paten: jauh lebih mudah lewat Google Patents/Lens atau OpenAlex `works` bertipe paten tidak lengkap. Prioritas rendah.

### 3.24 Asosiasi [SEBAGIAN]
- **AESI (Asosiasi Energi Surya Indonesia)** [TERUJI]: `https://www.aesi.or.id/anggota` memuat daftar anggota publik per kategori (Developer, EPC, Supplier, Instalasi PLTS, Konsultan, Lembaga Inspeksi, Sertifikasi, Distributor, BESS, Produsen Sel Surya, Lembaga Keuangan, dst.), sekitar **130 entri (hitung dari fetch 7 Nov, ada duplikat antar kategori)**, nama di `alt` gambar logo, tautan ke `aesi.or.id/anggota/[slug]`. Footer hak cipta AESI 2025, tanpa syarat penggunaan eksplisit. Contoh: Pertamina NRE, Medco, TotalEnergies, Xurya Daya Indonesia, Adaro.
- **APLSI** `https://www.aplsi.or.id/` (200); `/anggota` 404, jalur anggota belum ditemukan. **APROBI** `https://aprobi.or.id/` (200); `/anggota/` 404. INAGA/AEEI: domain tebakan saya tidak ter-resolve, **URL resmi belum ditemukan**.
- IESR (`iesr.or.id`) memblokir curl (403 Cloudflare), sama untuk `/feed`.
- Rekomendasi: panen daftar anggota yang terbuka (AESI) dengan sitasi sumber; asosiasi lain lewat permintaan resmi/kerja sama METI.

### 3.25 JETP Indonesia dan pendanaan [SEBAGIAN]
- `https://jetp-id.org/` mengembalikan konten mirip APLSI saat dibuka (isi halaman tidak seperti situs JETP; kemungkinan domain salah/dialihkan). **Situs resmi JETP belum terkonfirmasi.** Faktor penting: Sekretariat JETP dibiayai Jepang via ADB sejak 2023; **JETP Delivery Unit (JDU) didanai Jerman mengambil peran mulai Januari 2026**; factsheet JDU ada di `https://ger-idn.energyhub.id/wp-content/uploads/2026/02/JETP-Delivery-Unit-JDU-Factsheet.pdf` (hasil pencarian). Dana: US$21,4 miliar diperoleh, ±US$3,1 miliar terpakai; >20 proyek dalam pipeline (hasil pencarian, tanggal berita tak jelas).
- CIPP versi publik terakhir yang dapat saya konfirmasi adalah rilis Nov 2023 (dokumen tahunan "hidup"); revisi 2025 belum ditemukan.
- **ADB** (`adb.org/projects`) 403 untuk bot. Data ADB lewat **IATI** (standar publikasi bantuan): `https://iatiregistry.org` (sebagian), datastore IATI baru (`https://api.iatistandard.org/datastore/...`) butuh **subscription key** (401 tanpa kunci; kunci gratis).
- **AIIB** `https://www.aiib.org/en/projects/list/index.html` (200, HTML daftar proyek). **GCF** `https://www.greenclimate.fund/projects` (200; portofolio JS, belum ada unduhan CSV yang ditemukan). **CPI** `https://www.climatepolicyinitiative.org/` (200; laporan PDF, bukan basis data).
- Rekomendasi: Bank Dunia (API), IATI (kunci gratis) untuk ADB/GIZ dan lainnya; AIIB/GCF input manual atau scrape ringan per daftar.

### 3.26 DEN, DPR [SEBAGIAN]
- DEN `https://www.den.go.id/` (200): RUEN/KEN (dokumen PDF). JDIH DPR `https://jdih.dpr.go.id/` 403 (bot). RUU EBET: catat sebagai entitas regulasi manual (status Prolegnas).
- Rekomendasi: input kurasi manual; jumlahnya kecil.

### 3.27 Berita dan acara [BELUM TERUJI]
- ESDM: `https://www.esdm.go.id/id/media-center/arsip-berita` (200, HTML arsip); `/rss` 404. Tidak ada RSS ESDM yang ditemukan. Media energi (Bisnis, Kontan, Kompas Lestari, Katadata, CNBC) umumnya punya RSS tetapi **tidak saya uji**. Wajib: simpan judul + tautan + tanggal saja, bukan isi (hak cipta).
- Acara: kalender dari situs asosiasi (belum ada sumber terstruktur yang terverifikasi).

### 3.28 IEA [diblokir]
- `https://www.iea.org/countries/indonesia` 403; data IEA berbayar/syarat ketat. Tidak dipakai; Ember + IRENASTAT + HEESI menggantikan.

---

## 4. Peta sumber ke entitas direktori

| Entitas | Sumber utama | Pelengkap |
|---|---|---|
| Orang/pakar | OpenAlex (penulis), ORCID | SINTA (manual/izin), Garuda, isian METI |
| Kampus/peneliti | OpenAlex institusi (ROR) | Garuda; kampus dari data BPS/PDDikti (belum diriset) |
| Riset/publikasi | OpenAlex works, Crossref | Garuda |
| Lembaga pemerintah | JDIH, situs kementerian, BPK (penerbit peraturan) | kurasi METI |
| BUMN | RUPTL (PLN, Pertamina NRE), AHU | situs perusahaan |
| Perusahaan/pengembang | AESI anggota, GEM (pemilik), OSM `operator` | AHU, OSS (manual) |
| Asosiasi | situs asosiasi | METI |
| Proyek/pembangkit | GEM, OSM, WRI, RUPTL | ESDM One Map (permintaan resmi) |
| Regulasi | JDIH ESDM, peraturan.bpk.go.id | DEN, DPR (manual) |
| Wilayah | BPS, World Bank, Global Solar/Wind Atlas, HEESI | RUPTL per wilayah |
| Pendanaan/investor | World Bank Projects, IATI, Crossref funder, OpenAlex funders | AIIB, GCF, JETP (manual) |
| Mitra internasional | pendana/penerbit di atas | situs GIZ/IESR (IESR memblokir bot) |
| Statistik nasional | Ember, OWID, IRENASTAT, World Bank, HEESI | n/a |

---

## 5. Rencana panen (urut prioritas)

### Gelombang 1 (bisa mulai sekarang; stabil, bebas, CSV/JSON, tanpa gerbang)
1. **OpenAlex** (pakai `api_key`): institusi ID, topik EBT, karya + penulis; satu workflow bulanan dengan cursor, simpan ke R2, muat ke D1. Tautan orang-lembaga-riset otomatis dari `authorships`.
2. **Ember + OWID + IRENASTAT + World Bank Indicators**: panel statistik nasional, harian/bulanan cukup (data tahunan, ubah tiap beberapa bulan).
3. **OSM Overpass**: pembangkit EBT per jenis, satu kali per bulan, dengan UA khusus dan cache; pecah per provinsi untuk generator.
4. **WRI GPPD v1.3.0**: penyemai hidro/PLTP sekali jalan; cocokkan nama dengan OSM/GEM.
5. **peraturan.bpk.go.id (sitemap)** + **JDIH ESDM**: regulasi sektor energi; filter judul dengan kata kunci (energi terbarukan, panas bumi, PLTS, biomassa, ketenagalistrikan, EBET, dst.).
6. **HEESI 2025 PDF**: ekstraksi tabel sekali per tahun (di mesin lokal; PDF 11 MB).

### Gelombang 2 (butuh kunci gratis, izin, atau kerja manual terbatas)
7. **GEM trackers**: unduh manual lewat formulir tiap rilis (surya Feb 2026), unggah ke R2; saring baris TZ ID (NC) bila dipublikasikan komersial.
8. **World Bank Projects API + IATI** (kunci gratis) untuk pendanaan; **Crossref funders**.
9. **BPS WebAPI** (kunci gratis): rasio elektrifikasi/PDRB per wilayah.
10. **ORCID** untuk ID peneliti; **AESI anggota** (HTML terbuka).
11. **RUPTL 2025-2034**: ekstraksi tabel proyek per sistem dari PDF resmi (cari PDF resmi dari rilis ESDM); ini sumber proyek rencana terbaik.
12. **Global Solar/Wind Atlas**: ambil GeoTIFF sekali, hitung rata-rata per kabupaten.

### Gelombang 3 (hanya dengan izin/kerja sama; hindari scraping)
13. **ESDM One Map / EBTKE** (robots melarang): minta data resmi (daftar pembangkit EBT, WKP, IUPTL).
14. **SINTA, AHU, OSS, PDKI, ADB, IESR, JDIH DPR**: bot-blocked atau berlogin; gunakan MoU/permintaan atau input manual.
15. **Berita/acara**: RSS media (uji dulu), simpan metadata saja.

Catatan arsitektur ringkas: satu tabel `sumber` (id, url, lisensi, tanggal ambil, hash) agar atribusi tiap entitas bisa ditampilkan; ID kanonis: ROR (institusi), ORCID/OpenAlex ID (orang), GEM ID/gppd_idnr/OSM id (proyek), nomor peraturan (regulasi), kode BPS/kemendagri (wilayah). Pencocokan nama perusahaan butuh normalisasi (PT/Tbk/Persero) dan antrean tinjau manual.

---

## 6. Risiko hukum dan etika

- **PDP (UU 27/2022):** nama peneliti, afiliasi, ORCID, dan ID penulis di OpenAlex adalah data publik, tetapi tetap data pribadi. Tampilkan hanya data profesional (nama, afiliasi, publikasi); **jangan** simpan atau tampilkan email, telepon, alamat rumah, tanggal lahir. Sediakan tombol "ajukan koreksi/hapus" dan proses penghapusan; catat dasar pemrosesan (kepentingan yang sah). ORCID melarang pemakaian untuk spam.
- **Lisensi dan atribusi:** CC BY (Ember, OWID, WRI, World Bank, GEM) wajib atribusi: tampilkan sumber per entitas. **GEM: baris TZ ID adalah CC BY-NC**, saring bila ada unsur komersial. **OSM: ODbL** memerlukan atribusi "© OpenStreetMap contributors" dan share-alike untuk basis data turunan. **IRENA: syarat reuse belum terverifikasi**; "All Rights Reserved" tertulis di portal.
- **robots.txt (diuji hari ini):** `geoportal.esdm.go.id` melarang semua (`Disallow: /`); `ebtke.esdm.go.id` melarang `/lintas/`, `/simantaps/`, `/konversi/`; ESDM utama melarang beberapa jalur. **Patuhi**: jangan panen. JDIH ESDM, BPK, peraturan.go.id, OSS (kecuali `/api/`), AHU mengizinkan.
- **Situs yang memblokir bot (403/Cloudflare):** SINTA, ADB, IEA, IESR, JDIH DPR, dokumentasi BPS. Menembus blokir (rotasi UA/IP, penyamaran browser) berisiko melanggar syarat layanan dan UU ITE (akses tanpa hak); jangan lakukan tanpa izin tertulis. Agen `scraper-antibot` hanya untuk kasus yang pemiliknya memberi izin.
- **Google Scholar:** syarat layanan Google melarang scraping otomatis; tidak dipakai. Gunakan OpenAlex/ORCID/Crossref sebagai pengganti.
- **Berita:** hak cipta; simpan judul, tautan, tanggal, nama media saja, tanpa isi artikel.
- **Peraturan:** tidak berhak cipta menurut UU 28/2014 Pasal 42 (aman disalin); tetap cantumkan sumber dan tanggal akses; status "berlaku/dicabut" bisa usang.
- **Akurasi dan reputasi:** pencocokan nama otomatis dapat menautkan orang/perusahaan yang salah (disambiguasi OpenAlex belum sempurna). Beri label "otomatis, belum diverifikasi" dan antrean tinjau METI. Jangan menampilkan klaim kinerja/penilaian perusahaan dari data tak lengkap (OSM, WRI 2019).
- **Etika kebijakan:** tampilkan proyek GEM dengan status (rencana/konstruksi/operasi) jelas; hindari kesan "sudah berjalan" bagi proyek rencana.
- **Beban teknis dan sopan santun:** UA yang jujur dengan alamat kontak; laju rendah; cache dan jangan ulang panen sama dalam sebulan. Rahasia (kunci OpenAlex, BPS, IATI, Ember) hanya di GitHub Secrets.

---

## 7. Celah yang hanya bisa diisi METI sendiri

- Daftar **anggota METI** (perorangan dan korporasi), kategori keanggotaan, tanggal bergabung, status aktif.
- **Pengurus** dan dewan pakar/dewan pembina, jabatan, periode (SK pengurus).
- **Kontak resmi** (email/telepon sekretariat, kontak PIC lembaga/perusahaan), dengan persetujuan tertulis (PDP).
- **Persetujuan tampil** orang dan perusahaan di direktori (consent), dan preferensi privasi.
- Tautan keanggotaan ke **kelompok kerja/komite teknis METI**, acara, dan publikasi METI (position paper, kajian).
- **Keahlian** pakar yang dikurasi sendiri (bidang, teknologi, wilayah) dan ID SINTA/Scopus yang diisi pakar.
- Hubungan **kemitraan dan MoU** METI dengan lembaga/pendana/mitra internasional.
- Data **proyek anggota** yang tidak ada di sumber publik (PLTS atap swasta, captive, off-grid, desa mandiri energi).
- Daftar asosiasi mitra dan **jaringan kontak lembaga pemerintah** (siapa PIC di ESDM/BUMN/BPBD-setara), yang bersifat kerja sama, bukan data publik.
- Data resmi yang perlu **permintaan khusus**: layer ESDM One Map (ketenagalistrikan, EBTKE), daftar IUPTL/WKP/PPA, CIPP JETP terbaru, SINTA via kerja sama.

---

## Sumber hasil pencarian (belum diverifikasi langsung ke situs primer)

- ESDM rilis RUPTL: https://esdm.go.id/id/media-center/arsip-berita/kementerian-esdm-resmi-merilis-dokumen-ruptl-pln-2025-2034
- Bisnis, bauran EBT 15,2 GW Juni 2025: https://ekonomi.bisnis.com/read/20250811/44/1901152/bauran-ebt-capai-152-gw-juni-2025-145-dari-total-pembangkit
- Kompas, PLTS atap 1 GW 2025: https://lestari.kompas.com/read/2025/09/02/151320886/kapasitas-plts-atap-di-indonesia-ditargetkan-capai-1-gw-tahun-ini
- Wartaekonomi, PLTS atap 495 MWp: https://wartaekonomi.co.id/read581280/semester-i-2025-pemanfaatan-plts-atap-baru-sentuh-495-mwp-dari-target-1-gw
- JDU factsheet: https://ger-idn.energyhub.id/wp-content/uploads/2026/02/JETP-Delivery-Unit-JDU-Factsheet.pdf
- Jakarta Post, kritik JETP (Mar 2026): https://www.thejakartapost.com/opinion/2026/03/07/the-worlds-largest-climate-finance-deal-was-built-to-flounder
- Kontan, progres RUPTL: https://industri.kontan.co.id/news/progres-ruptl-pln-2025-2034-40-masuk-tahap-eksekusi-143-proyek-sudah-beroperasi
