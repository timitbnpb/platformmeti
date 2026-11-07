# Riset situs resmi METI (metiires.or.id)

Dibaca 7 Nov 2026 dengan curl (User-Agent generik). Tidak ada formulir yang diisi, tidak ada login. Semua data di bawah publik. Nomor HP dan email pribadi sengaja tidak dicatat (hanya email resmi organisasi).

## 1. Temuan utama (baca ini dulu)

1. **Bukan WordPress.** Situs ini aplikasi Nuxt (Vue 3, SSR) + Tailwind, dengan backend terpisah di `https://api.metiires.or.id/api` (gaya Laravel: pesan galat "The route api/... could not be found", `/storage/...` untuk unggahan). Jadi `/wp-json/*` dan `/feed` 404. Sitemap dibuat modul `@nuxtjs/sitemap v7.5.2`. Gambar lewat `_ipx` (Nuxt Image, webp). i18n Indonesia + Inggris (`/en/...`).
2. **Situs ini sudah berupa platform, bukan brosur.** Bundel JS memuat rute `/account`, `/account/events`, `/account/security` (TOTP, perangkat), `/admin/dashboard`, `/admin/users`, `/admin/membership` (plans, bank-accounts), `/admin/events` (create), `/admin/news` (create, settings), `/admin/materials`, `/admin/audit`, `/admin/contact/messages`, `/certificates/`, `/events/check-in`, `/register`, `/forgot-password`. Pembayaran membership manual: transfer lalu unggah bukti, admin verifikasi. Login dilindungi Cloudflare Turnstile.
3. **Daftar anggota publik sangat tipis**: hanya 12 logo anggota dan 12 logo mitra di `/about/partnership`. Klaim "1000+ anggota" tidak ditampilkan sebagai daftar. Ini celah terbesar yang justru diisi oleh "Direktori Jaringan Energi Terbarukan".
4. **Tidak ada**: halaman METI Wilayah publik, publikasi/policy brief publik, daftar acara lampau (IndoEBTKE ConEx tidak disebut sama sekali), pencarian, peta, data teknis (kapasitas, proyek, lokasi). Menu "Event" dan "Materi & Dokumen" diberi label Member dan mengarah ke `/membership` (terkunci).
5. Konteks: repo lokal `/Users/priyankaalfatehan28/Documents/GitHub/platformmeti` dan folder `1. METI` ada di direktori kerja. Bila platform baru itu kelanjutan situs ini, API di bagian 6 bisa dipakai ulang apa adanya.

## 2. Peta halaman (URL)

Sitemap index `https://metiires.or.id/sitemap.xml` memuat dua sitemap bahasa (`/__sitemap__/id-ID.xml`, `/__sitemap__/en-US.xml`). `robots.txt`: `Allow: /` dan menunjuk ke sitemap.

| URL | Isi | Status |
| --- | --- | --- |
| `/` | Beranda | 200 |
| `/about` | Siapa Kami (profil, visi, misi, peran) | 200 |
| `/about/meettheteam` | Struktur Organisasi 2025–2028 (39 pengurus, 10 bagian) | 200 |
| `/about/partnership` | Kemitraan: 12 anggota + 12 mitra strategis | 200 |
| `/news` | Ruang Berita, 5 berita, filter kategori/format/tag/cari | 200 |
| `/news/{slug}` | Detail berita | 200 untuk 5 slug nyata |
| `/membership` | 6 paket keanggotaan, 3 PDF resmi | 200 |
| `/contact` | Kontak + formulir (tidak diisi) | 200 |
| `/events/check-in` | Layar login (check-in/akun) | 200 |
| `/policy`, `/policy/terms`, `/policy/cookie`, `/policy/membership` | Kebijakan privasi, syarat, cookie, pembayaran | 200 |
| `/en/...` | Cermin Inggris semua halaman di atas | 200 |

Catatan galat: sitemap memuat 7 slug berita lama yang kini **404** (`40th-big-bisnis-indonesia-group-conference-2025-arah-bisnis-2026`, `afternoon-tea-pengurus-meti`, `bincang-sore`, `electricity-connect-2025`, `meti-untuk-negeri`, `satu-hari-energi-bersih-from-learning-to-living`, `suara-meti-di-dpr`). Judulnya jejak acara/berita lama METI yang berguna sebagai petunjuk riset, tapi isinya hilang dari situs. Detail event di sisi API ada (`/api/events/{slug}`), tapi tidak ada halaman publik `/events` di sitemap.

**Navigasi (menu atas):** Beranda | Tentang Kami (Siapa Kami, Struktur Organisasi, Kemitraan) | Berita & Pembaruan (Berita, Event [Member], Materi & Dokumen [Member]) | Gabung Membership (tombol CTA) | Kontak | pemilih bahasa ID/EN (bendera). **Footer:** Tentang Kami, Berita & Pembaruan, Hubungi Kami (3 kolom lipat), LinkedIn, Instagram, 4 tautan kebijakan, "© 2026 METI".

## 3. Isi kunci tiap halaman

### Beranda
- Judul tab: "METI – Forum Nasional Energi Terbarukan Indonesia". Tagline: "Energi bersih untuk masa depan Indonesia." Sebutan: METI / IRES.
- Angka: 1000+ Anggota & Institusi, 20+ Kolaborator & Mitra, 25+ Tahun Kontribusi (footer: 1999 sejak berdiri, 1K+ anggota, 20+ mitra).
- Bagian: Tentang METI; Peran Kami (1 Advokasi Kebijakan, 2 Dialog Multi-Pemangku Kepentingan, 3 Penguatan Kapasitas & Pengetahuan); "Mengapa Energi Terbarukan Penting" dengan dua grafik (PM2.5 2015–2023: 32, 34, 36, 38, 41 µg/m³ vs batas WHO ≤5; bauran energi: batu bara 61%, minyak 19%, gas 13%, terbarukan 7%); 4 Program Strategis (Kebijakan & Advokasi, Riset & Pengetahuan, Pengembangan Kapasitas, Kemitraan & Jejaring); 4 berita terbaru; CTA membership.
- OG image: `https://metiires.or.id/images/hero/home-hero.webp`.

### Siapa Kami (/about)
- Didirikan **11 Mei 1999**, organisasi nirlaba, fokus Advokasi & Pengembangan Energi Terbarukan. Nama: Masyarakat Energi Terbarukan Indonesia / Indonesia Renewable Energy Society (METI/IRES).
- Berdiri atas prakarsa intelektual, pejabat pemerintah, pelaku usaha, profesional yang peduli pemakaian energi fosil tak terkendali. Mewadahi ilmuwan, pendidik, regulator, pengembang bisnis, LSM, asosiasi sektor EBT.
- Peran: Forum Nasional, Pusat Pengetahuan, Advokasi Kebijakan, Penguat Ekosistem.
- **Visi:** "Menjadi wahana yang efektif dan terpercaya dalam pengembangan energi terbarukan Indonesia."
- **Misi:** (1) mendorong pengembangan dan penerapan teknologi EBT yang efisien dan efektif; (2) meningkatkan jumlah dan kualitas SDM serta kapasitas industri EBT; (3) mengadvokasi kebijakan dan regulasi yang mendukung investasi dan pemanfaatan EBT secara luas.
- Ada blok "Jejak Nasional: memperkuat energi terbarukan di seluruh Indonesia / kolaborasi lintas provinsi" tetapi **tanpa daftar atau peta wilayah**.

### Struktur Organisasi (/about/meettheteam)
Periode **2025–2028**, ditetapkan **14 Desember 2024**, 10 "ruang kerja", 39 pengurus inti (belum menghitung anggota tiap bidang). Foto per orang tersedia di `/images/teams/<Nama>.png` (sebagian "Foto belum tersedia").

Nama dan jabatan yang tampil publik:

- **Ketua Umum:** Norman Ginting. **Wakil Ketua Umum 1:** Hokkop Situngkir. **WKU 2:** Fadli Rahman.
- **Sekretaris Jenderal:** Elvi Nasution. Wakil Sekretaris 1–4: Ricky Andrian, Lucila Ismoyo Rukmi, Daniel Tampubolon, Dicky Septriadi. Senior Advisor Sekjen: Bawa Santosa.
- **Bendahara Umum:** Erik Agus Sandi. Wakil Bendahara 1–3: Andi Paluseri, Mirda Rasyid, Arief Subekti.
- **Direktur Eksekutif:** Yasmine Surachman. Wakil 1: Mutya Yustika. Wakil 2: Putri Anggani Oditha.
- **Dewan Pengawas** (ketua Wiluyo Kusdiharto, 16 anggota termasuk Ex-Officio): Nur Pamudji, Eddie Widiono Suwondho, Riki Firmandha Ibrahim, Tri Mumpuni, Sri Endah Agustina, Abdul Malik Sadat Idris (Deputi Infrastruktur Bappenas), Dosmar Banjarnahor, Rudi Margono (JAM Pengawasan Kejaksaan Agung); Ex-Officio: Ahmad Erani Yustika (Sekjen ESDM), Dadan Kusdiana (Sekjen DEN), Eniya Listiani Dewi (Dirjen EBTKE), Tri Winarno (Plt. Dirjen Gatrik), Febrio Nathan Kacaribu (Kemenkeu), Elen Setiadi (Kemenko Perekonomian), Ary Sudijanto (KLHK), Abdi Mustakim (Kementerian BUMN).
- **Dewan Pakar** (ketua Herman Darnel Ibrahim, 14 anggota): wakil I Widi Pancono, wakil II Chairani Rachmatullah; Mukhtasor, Saleh Abdurrahman, Hardiv Situmeang, Soeripno Martosaputro, Arief Yunan, Arya Rezavidi, Fabby Tumiwa, Prijandaru Effendi, Kusetiadi Raharjo (PLTM), Muhammad Abdul Kholiq (ABGI), Jalal, Alimin Ginting.
- **Komite Energi Terbarukan:** koordinator Suroso Isnandar (wakil: Ruly Firmansyah, Bernardus Sudarmanta, Rakhmad Dewantoa). Komite per sumber: Surya, Mada Ayu Habsari; Bayu, Agung Hermawan; Air, Sutiyo Siswanto; Panas Bumi, Julfi Hadi; Bioenergi, Sumanggar Milton Pakpahan.
- **Ketua Bidang (8 bidang + 3 unit khusus), tiap bidang punya 4–11 anggota yang namanya tampil:**
  1. Pengembangan Organisasi & Kerjasama Antar Lembaga: Yudha Permana Jayadikarta (8 anggota)
  2. Advokasi & Regulasi: Ruly Marianti (8)
  3. Pengembangan SDM & Teknologi: Sim Budiman Setiawan (8)
  4. Pendanaan, Investasi & Hubungan Internasional: Delano Dalo (11)
  5. Pengembangan UMKM & Koperasi: Muliandy Nasution (6)
  6. Dekarbonisasi & Keberlanjutan: Kuki Soejachmoen (7)
  7. Informasi & Multimedia: Arief Noerhidayat (6)
  8. Sertifikasi: John Paulus Pantouw (5)
  9. **Direktur METI Institute:** Elrika Hamdi (4 anggota)
  10. **Koordinator METI Wilayah:** Parlindungan Purba (wakil: Eva Djauhari). Hanya satu baris, tanpa daftar wilayah.
  11. **Ketua METI Energi Muda:** Alif Zulviqar Syahroni (4 anggota)
- **Staf operasional:** Nurullita (Senior Program Officer), Zakariya Fikriyadi (Consultant Program), Syahrul Anwar (Finance Admin), Siti Fadilla Ariadi (General Admin).

### Kemitraan (/about/partnership)
Penghitung di halaman: 23+ anggota (di teks), 12 Mitra Strategis, 11 Ekosistem. Filter anggota: Semua / Pemerintah / Industri / LSM-NGO (filter ada, tanpa isi per kategori yang tegas).

**Anggota (12, logo di `/images/members/`):** PLN; Pertamina Power Indonesia; Pertamina Kilang Internasional; Indonesia Power; PT EMI (Persero) (Energy Management Indonesia); Medco Energi; Indika Energy; Star Energy Geothermal; Supreme Energy; PT Maharaska Biru Energi; Yayasan Bina Usaha Lingkungan; GOBEL Foundation.

**Mitra Strategis (12, logo di `/images/partners/`):** Kementerian ESDM; Ditjen EBTKE; Kemenko Marves (Maritim dan Investasi); BRIN; PLN; GIZ; UGM Pusat Studi Energi (PSE); LPEM FEB UI; Hivos Southeast Asia; KADIN Indonesia; Dewan Energi Nasional (DEN).

Cara berkolaborasi: Kebijakan & Advokasi, Teknologi & Inovasi, Pengembangan Proyek, Penguatan Kapasitas. Statistik: 25+ Dialog & Forum Kebijakan, 15+ Proyek & Inisiatif, **6 Provinsi Terdampak**, 100+ Pemangku Kepentingan (tanpa rincian).

### Berita (/news dan API)
Kategori: Siaran Pers, Kegiatan, Seminar, Advokasi, Insight, Sosial, Berita. Format: Activity, Seminar, Insight, Update, Announcement. Tag: #hydropower, #meti, #metixiaitb, #pln. Total 5 artikel (lihat bagian 5).

### Membership (/membership)
Tarif resmi ditetapkan Jakarta, 1 Juli 2026. Dari API `/api/membership/plans`:

| Kode | Paket | Iuran awal | Iuran tahunan | Perwakilan |
| --- | --- | --- | --- | --- |
| student | Pelajar | Rp 100.000 | Rp 200.000 | 1 |
| individual | Individu | Rp 450.000 | Rp 350.000 | 1 |
| ngo | Organisasi NGO (Rekomendasi) | Rp 1.600.000 | Rp 600.000 | 2 |
| small_company | Perusahaan Skala Kecil | Rp 25.000.000 | Rp 2.000.000 | 5 |
| large_company | Perusahaan Skala Besar | Rp 50.000.000 | Rp 2.500.000 | 5 |
| main | Utama (Charter Member) | Rp 175.000.000 | Rp 5.000.000 | 20 |

Manfaat NGO (contoh): 2 perwakilan tiap pertemuan, pleno tahunan dan potongan biaya seminar/FGD, **logo dan nama organisasi non-profit ditayangkan di situs METI**, e-card dan surat keanggotaan, akses grup WhatsApp/Telegram. Manfaat umum: akses event dan forum eksklusif, akses publikasi dan riset (policy brief, laporan), hak partisipasi dan voting. Alur: pilih paket, login/daftar, transfer, unggah bukti, verifikasi dan aktivasi. Dokumen PDF: `/documents/membership/iuran-anggota-meti-2026.pdf`, `/documents/membership/application-for-membership-2026.pdf`, `/documents/membership/manfaat-anggota-meti-2026.pdf`.

Petunjuk penting untuk direktori: paket Perusahaan dan NGO menjanjikan **tayang logo di situs**. Itulah pintu masuk alami direktori anggota.

### Kontak (/contact)
Email resmi organisasi: `<surel-disamarkan>` (satu kotak untuk umum, kemitraan, media). Alamat: PSW Tower, Office 2nd Floor, Jl. Pangeran Antasari No. 75, Jakarta Selatan, DKI Jakarta (tautan Google Maps "PSW Tower Antasari Jakarta"). Jam layanan Senin–Jumat 09.00–17.00 WIB. Respons awal 2–3 hari kerja. Media sosial: LinkedIn `https://www.linkedin.com/in/meti-ires-b06066a1/`, Instagram `https://www.instagram.com/metiires/` (tidak ada X/YouTube/Facebook).

## 4. Acara dan publikasi

**Acara (API `/api/events`, 1 entri):**
- The 1st METI Challenge Trophy Golf Tournament 2026, tema "Together for a Renewable Future", 22–23 Nov 2026 (jam UTC tersimpan 14.00 sampai 06.00; zona Asia/Jakarta), Emeralda Golf Club, Cimanggis Boulevard, Depok, offline, akses publik, kapasitas 216, pendaftaran 23 Okt sampai 17 Nov 2026. URL API: `https://api.metiires.or.id/api/events/the-1st-meti-challenge-trophy-golf-tournament-2026`. Ada fitur check-in peserta, umpan balik, sertifikat, kalender (`/calendar`), kuota, syarat membership, paket yang berhak.
- Event lampau yang tersirat dari artikel dan sitemap (tidak ada halaman acaranya): Indonesia Hydropower Summit 2026 (METI x IA ITB, 19 Agt 2026), Electricity Connect 2025, Bincang Sore, Afternoon Tea Pengurus METI, Satu Hari Energi Bersih "From Learning to Living", 40th BIG Bisnis Indonesia Group Conference 2025, Suara METI di DPR, METI untuk Negeri. **IndoEBTKE ConEx tidak muncul di situs**; sumbernya harus dari luar.

**Publikasi/Materi:** `/api/materials` mengembalikan `[]` (kosong). Tidak ada publikasi, policy brief, atau laporan publik. Jawaban yang dijanjikan hanya "untuk anggota".

## 5. Berita (judul, tanggal, URL)

Semua di bawah `https://metiires.or.id/news/<slug>`; penulis staf METI. Gambar di `https://api.metiires.or.id/storage/news/...`.

| Tanggal | Kategori | Judul | Slug |
| --- | --- | --- | --- |
| 2026-10-21 | Siaran Pers | Dua Tahun Pemerintahan Prabowo, METI Apresiasi Transformasi Energi Terbarukan untuk Kemandirian Energi dan Kesejahteraan Rakyat (B50, E20, PLTS 100 GWp, sampah jadi energi) | `siaran-pers-dua-tahun-pemerintahan-prabowo-meti-apresiasi-transformasi-energi-terbarukan-untuk-kemandirian-energi-dan-kesejahteraan-rakyat` |
| 2026-10-29 | Seminar | METI Dorong Peluang Ekonomi Energi Terbarukan yang Melibatkan Masyarakat (Ketum Norman Ginting di Sarasehan Nasional Executive Business Forum TV Muhammadiyah) | `meti-dorong-peluang-ekonomi-energi-terbarukan-yang-melibatkan-masyarakat` |
| 2026-10-27 | Berita | Courtesy Meeting Pengurus Harian METI dengan Utusan Khusus Presiden Bidang Iklim dan Energi, Hashim Djojohadikusumo | `courtesy-meeting-pengurus-harian-meti-dengan-utusan-khusus-presiden-bidang-iklim-dan-energi-bapak-hashim-djojohadikusumo` |
| 2026-10-26 | Berita | METI Sampaikan Selamat kepada Dirut PLN yang Baru, Siap Dukung Transisi Energi Indonesia (PLTS 100 GWp) | `meti-sampaikan-selamat-kepada-dirut-pln-yang-baru-siap-dukung-transisi-energi-indonesia` |
| 2026-08-19 | Kegiatan | Indonesia Hydropower Summit 2026 Dorong Akselerasi 16 GW Energi Hidro (METI & IA ITB; potensi hidro >95 GW baru 6,7 GW; RUPTL 2025–2034 menargetkan 16 GW dari 69,5 GW kapasitas baru) | `indonesia-hydropower-summit-2026-dorong-akselerasi-16-gw-energi-hidro-sebagai-pilar-keandalan-sistem-kelistrikan-indonesia-2` |

Catatan data: pada daftar `/news` kelima artikel tampil, tetapi beranda hanya memuat 4 dan tombol "Lihat Semua Berita". Hitungan "dilihat" semuanya 0, jadi situs baru. Artikel tertua hanya Agustus 2026: arsip berita sebelum itu tidak dimigrasi.

## 6. API dan feed yang bisa dipanen

Tanpa kunci, GET publik, JSON, `Accept: application/json`. Basis: `https://api.metiires.or.id/api`.

| Endpoint | Hasil |
| --- | --- |
| `/news` | `{featured, list[], filters{categories,types,tags}, highlightStrategy, pagination}`; field artikel: id, slug, title, excerpt, contentText, category, categorySlug, type, image, date, uploadAt, featured, author, authorMeta, location, viewsCount, likesCount, tags |
| `/news/{slug}` | satu artikel |
| `/events` (juga `?scope=...`) | `{data[], pagination}`; tiap event: slug, title, excerpt, description, location, venueMapUrl, startAt, endAt, status, accessLevel, eventMode, bannerImage, capacity, spotsLeft, registrationOpens/ClosesAt, requiresMembership, eligiblePlanCodes, checkInMode, certificate/feedback flags, calendarPath. **Ada kontak panitia (nama, email, telepon) di respons: jangan disimpan.** |
| `/events/{slug}` | satu event |
| `/membership/plans` | 6 paket (di atas) |
| `/materials` | kosong |
| `/contact` | POST saja (jangan dipakai) |
| tidak ada | `/members`, `/partners`, `/teams`, `/tags`, `/categories`, `/documents`, `/settings` (404) |

Feed lain: `/sitemap.xml` (index, 2 bahasa, perlu disaring karena 7 slug 404), tidak ada RSS (`/feed` 404), tidak ada WP REST. Daftar anggota, mitra, dan struktur pengurus **hanya ada di HTML** (SSR) dan di `/_nuxt/*.js` / `/_i18n/.../messages.json`, jadi panen lewat parse HTML halaman `/about/meettheteam` dan `/about/partnership`. Logo anggota: `/images/members/<berkas>`; mitra: `/images/partners/<berkas>`; foto pengurus: `/images/teams/<berkas>`. Patuhi hak cipta logo, jangan salin massal tanpa izin METI.

## 7. Identitas visual

- **Teknologi:** Nuxt 3 SSR, Vue, Tailwind CSS (kelas bawaan `slate`, `emerald`, `lime`), `@nuxt/image` (IPX, webp q80–84), `@nuxtjs/i18n`, `@nuxtjs/sitemap`, Cloudflare Turnstile di login dan kontak. Bukan WordPress, tidak ada tema.
- **Warna dominan (hex dari CSS dan HTML):** hijau zamrud sebagai aksen utama. `#059669` (emerald-600, garis bawah menu aktif dan aksen), `#047857` (emerald-700), `#065f46` (emerald-800, teks/latar gelap), `#10b981` (emerald-500, fokus ring `#10b98159`), `#d1fae5` (emerald-100), `#ecfdf5` (emerald-50), `#f0fdf4`. Aksen kedua kuning-hijau `#bef264` (lime-300). Aksen biru langit `#0ea5e9` dipakai sedikit. Netral: `#0f172a` / `#020617` (slate gelap), `#111827`, `#6b7280`, `#f8fafc`, `#f1f5f9`, `#e5e7eb`, `#cbd5e1`, latar `#f8faf9` / `#f6faf8` (putih kehijauan), putih `#ffffff`. Peringatan: `#fbbf24`/`#fcd34d`/`#fef3c7` (amber), `#f43f5e` (rose).
- **Font:** tidak ada font kustom dan tidak ada Google Fonts. Tumpukan sistem: `ui-sans-serif, system-ui, sans-serif` (turunan Tailwind), cadangan `Helvetica Neue, Arial, Helvetica, sans-serif`. Tampilan jadi netral dan cepat, tapi tidak punya karakter huruf sendiri.
- **Logo:** `https://metiires.or.id/images/logo/meti.png` (PNG RGBA 206x214, diunggah 17 Des 2025); header memakai varian 200x200 webp bersama teks "METI / Masyarakat Energi Terbarukan Indonesia". Favicon: `/icons/favicon/meti.ico`, `meti-16x16.png`, `meti-32x32.png`. Ikon UI SVG di `/icons/ui/` (mail, linkedin, instagram), bendera `/icons/flags/Flag_of_Indonesia.svg`.
- **Gaya foto:** hero lebar webp per halaman (`/images/hero/home-hero.webp`, `about-hero.webp`, `meet-the-team-hero.webp`, `partnership-hero.webp`, `membership-hero.webp`, `contact-hero.webp`), foto forum dialog (`/images/about/forum.jpg`), ilustrasi/foto program di `/images/visimisi/program_1..4`, foto kegiatan nyata di berita (pembicara, rapat, panggung). Foto pengurus potret bulat/tegak berlatar polos. Logo anggota ditata grid putih.
- **Komponen/gaya:** sudut membulat `rounded-lg/xl`, kartu putih bergaris tipis, banyak ruang putih, bagian bernomor (01, 02, 03...), penanda kategori kecil (pil) di atas judul berita, "Sorotan utama" untuk berita unggulan, hero gelap berlapis foto, nada tulisan "tenang" ("ruang baca yang tenang"). Nav sticky dengan garis bawah hijau animasi saat hover. Bahasa antarmuka campur "kamu" dan kata baku.
- **Gaya penyajian:** bagian "Direktori Pengurus" dengan 9 grup bernomor, lipatan "Lihat N anggota" (+), jumlah per grup. Pola ini bisa langsung ditiru untuk direktori anggota.

## 8. Celah (tidak ada di situs, berguna di direktori)

1. **Direktori anggota sungguhan**: 1000+ anggota, hanya 12 logo tampil. Butuh profil per anggota: nama, jenis (BUMN, swasta, LSM, akademisi, pemerintah), sumber energi (surya, bayu, air, panas bumi, bioenergi, biomassa, hidrogen), rantai nilai (pengembang, EPC, produsen, pembiaya, konsultan), provinsi/kota, ukuran (kecil/besar sesuai paket), tahun gabung, status keanggotaan, situs, LinkedIn, kontak resmi terbuka (opsional).
2. **METI Wilayah**: jabatan Koordinator ada, daftar wilayah dan pengurus tidak. Klaim "6 provinsi terdampak" tidak punya rincian.
3. **Peta dan pencarian**: tidak ada peta jaringan, tidak ada pencarian global, tidak ada filter lintas jenis.
4. **Proyek dan aset EBT**: 15+ proyek diklaim, tidak ada daftar (PLTS, PLTB, PLTA/PLTM, PLTP, bioenergi, lokasi, kapasitas MW, pengembang, status).
5. **Pakar dan narasumber**: Dewan Pakar ada sebagai nama saja, tanpa bidang keahlian, afiliasi, publikasi, atau tombol "undang narasumber" (desk media hanya email).
6. **Lembaga pemerintah dan regulator**: hanya 11 logo mitra. Perlu peta kewenangan (Ditjen EBTKE, Ditjen Gatrik, DEN, BRIN, PLN, Pemda ESDM provinsi).
7. **Akademisi, riset, kampus, startup, pembiaya, asosiasi sektor** (misalnya asosiasi surya, panas bumi, bioenergi, hidro, PLTM): tidak ada sama sekali.
8. **Acara**: tidak ada kalender publik, arsip acara lama, atau rangkaian tahunan (IndoEBTKE ConEx dan lain-lain). Hanya satu event terbit.
9. **Publikasi/materi**: kosong (`/api/materials = []`). Policy brief, kajian, press release lama tidak tersedia, arsip berita sebelum Agustus 2026 hilang.
10. **Relasi**: tidak ada hubungan antara orang, lembaga, bidang/komite, event, dan berita. Misalnya "Komite Energi Air" tidak terhubung ke anggota PLTA atau ke Hydropower Summit.
11. **Data bauran energi dan peta potensi** hanya dua grafik statis di beranda (angka tanpa sumber yang disebut).
12. **Tidak ada**: sertifikasi (Ketua Bidang Sertifikasi ada tapi tanpa daftar bersertifikat), METI Institute (direktur ada, produk tidak), METI Energi Muda (ketua ada, program tidak), kontak per bidang (semua lewat satu email).
13. SEO/teknis: sitemap memuat 7 URL 404; `og:image` memakai hero yang sama untuk semua halaman; tidak ada RSS; font tidak dimuat khusus.

## 9. Saran untuk Direktori Jaringan Energi Terbarukan

- Tiru pola direktori kebencanaan: kategori utama = Pemerintah, BUMN, Industri/Swasta, LSM, Akademisi/Riset, Asosiasi, Pembiaya/Mitra Internasional, Pakar/Tokoh; facet tambahan sumber energi, rantai nilai, provinsi.
- Benih data legal dari situs ini: 12 anggota + 12 mitra + 39 pengurus + 16 Dewan Pengawas + 14 Dewan Pakar + 5 komite sumber energi + 11 bidang/unit. Semua sudah publik.
- Sisanya (1000+ anggota) harus dari data internal METI (dengan izin anggota, selaras kebijakan privasi dan paket membership yang menjanjikan tayang logo) atau panen sumber publik lain (ESDM, DEN, asosiasi).
- Gunakan `/api/news`, `/api/events`, `/api/membership/plans` sebagai sumber sinkron bila perlu; selaras dengan token warna emerald agar direktori terasa satu keluarga dengan situs METI (emerald `#059669`, lime `#bef264`, slate gelap `#0f172a`, latar `#f8faf9`).
- Hindari menyalin nomor HP/email personal dari respons event.

Berkas mentah (HTML, JSON API, CSS) tersimpan di `/private/tmp/claude-501/-Users-priyankaalfatehan28-Developer-poskokarhutla/e103ba63-5b39-4229-8371-ef441f13f506/scratchpad/meti/`.
