# Aturan dan selera pemilik (dihimpun untuk platformmeti)

Dihimpun 7 Nov 2026 dari memori Claude semua proyek, `~/.claude/*.md`, 200 rincian selera (skill selera-pinka), `AGENTS.md` dan `docs/` repo poskokarhutla, pangantara, neraca-papua, gemah-ripah, Betutu Sambe, worth-it, dan paket perencanaan METI. Pesan commit "gas" dilewati.

## Cara baca

- Satu aturan satu baris. Kode di kurung adalah asal: `MT` memori platformmeti, `KM` KEPUTUSAN-METI, `PK` memori poskokarhutla, `PA` pangantara, `BS` Betutu Sambe, `GR` gemah-ripah, `WI` worth-it, `NP` neraca-papua, `S200` 200-rincian-selera, `WEB` `~/.claude/WEBSITE.md`, `G` berkas global lain.
- Urutan menang untuk METI: `KEPUTUSAN-METI.md` > memori platformmeti > `GRAND-DESIGN` dan `DESIGN-SYSTEM` METI > aturan proyek lain. Palet dan nama merek proyek lain (navy dan emas MBG, navy Centurisk97, tembaga Papua) TIDAK berlaku; METI memakai Midnight Energy dengan aksen lime (KM C-05, MT selera-tabel).
- Tanda `[BENTROK]` menandai aturan yang saling bertentangan; keputusan untuk METI ada di bagian "Aturan yang bertentangan" paling bawah.
- Tanda `[BUKAN METI]` menandai aturan proyek lain yang sengaja tidak dibawa.

---

## 1. Tata letak dan ruang

- T1. Tidak boleh ada elemen dempet: kartu menempel atau menimpa tepi hero, kartu tanpa jarak antar baris, isi menempel tepi wadah. (MT tanpa-dempet, PK bagian-dalam-kartu)
- T2. Jarak minimal 24px antara hero dan baris kartu; gap antar kartu 16 sampai 24px; tinggi kartu sejajar sama. (MT)
- T3. Tidak ada ruang kosong di kanan atau kolom kosong mana pun: kolom tak berisi berarti jadi satu kolom penuh atau diisi konten terkait; tidak ada isi dobel. (MT, WI anti-ruang-kosong)
- T4. Di layout dua kolom, panel kanan mulai sejajar judul; judul masuk kolom kiri, bukan header selebar halaman. (WI)
- T5. Hero tidak boleh setengah kosong; sisi kanan diisi jawaban visual (angka besar plus bar). (MT)
- T6. Kartu teks (Metode dan sejenis) tidak menyisakan separuh kanan kosong: isi penuh lebar atau grid kolom. (MT)
- T7. Judul bagian dan kontrolnya (pilih, urut) tidak boleh melayang sendiri; selalu di dalam wadah atau kepala exhibit. (MT)
- T8. Tiap bagian profil, lembar, laci adalah kartu sendiri: putih, border 1px, radius sekitar 14px, padding, judul kecil kapital di dalam, jarak 12px antar kartu; tanpa garis pemisah dengan celah besar. (PK bagian-dalam-kartu)
- T9. Tiap kartu atau seksi punya kepala berikon dan judul tebal; situs harus terasa berwarna, bukan teks polos. (WI selera-ui-pemilik)
- T10. Tiap seksi data berkepala exhibit gaya Posko: eyebrow topik berikon, satu kalimat judul dengan angka kunci disorot, sub metrik plus EST, ikon aksi kanan atas (bagikan, unduh PNG/PDF, CSV untuk tabel) dan ikon sumber. Judul dua baris bertele-tele dilarang. (MT)
- T11. Label KPI satu baris (pendekkan, konteks pindah ke subjudul atau tooltip); angka semua kartu sejajar satu garis dasar. (MT)
- T12. Blok statistik mengisi lebar penuh (jumlah kolom sama dengan jumlah item), tidak menyisakan celah kanan. (PK)
- T13. Setiap halaman memakai kepala situs bersama dan token desain proyek; tidak ada halaman dengan palet atau kepala sendiri. (PK kepala-situs-wajib)
- T14. Halaman baru meniru modul padanan di poskokarhutla lebih dulu (anatomi dan pipa), bukan dirancang dari nol; brief agent menyebut path rujukan. (MT tiru-posko, PK plug-and-play)
- T15. Default fitur baru adalah mirroring kode yang sudah ada; menambah konteks baru boleh hanya bila padanannya tidak ada atau memang tidak cocok, dan alasannya disebut. (PK plug-and-play)
- T16. Judul kelompok berikon dan berwadah kartu; bar bawah selebar konten. (BS pilihan-penuh-lebar)
- T17. Daftar peringkat berupa baris berbar (bar proporsional, angka tabular rata kanan, nomor bulat), bukan teks polos rapat kiri-kanan. (MT)
- T18. Daftar orang atau lembaga memakai satu komponen baris ringkas: avatar 40px, nama, satu baris meta abu, maksimal dua pil ikon kecil, metrik di kolom sempit tetap. (PK)
- T19. Deskripsi generik yang hanya mengulang nama dan kategori disembunyikan. (PK)
- T20. Sheet dan modal tingginya mengikuti isi; tanpa label seksi yang mengulang judul. (WEB)
- T21. Detail program atau proyek tampil sebagai pop-up besar di tengah, bukan panel samping. (MT)
- T22. Pop-up lebar; judul maksimal tiga baris; ukuran huruf kecil dan halus. (PK aturan-berulang)
- T23. Kaki popup yang punya lebih dari satu tombol: semua sebaris, sama lebar, ujung ke ujung; Batal dan Hapus tetap tombol berbingkai, bukan teks. (PA kaki-modal-tombol-penuh)
- T24. Tata letak satu baris; yang meluap menjadi kolom sendiri. (PK aturan-berulang)
- T25. Desktop dicek di 1440 dan 1280, ponsel di 375 sampai 390, tanpa scroll horizontal; target sentuh minimal 44px. (MT, WEB, PK)
- T26. Tiap layar punya keadaan loading (skeleton), kosong dengan satu aksi, error, dan offline. (WEB)
- T27. Halaman 404 dan 500 dirancang, bukan bawaan. (WEB)

## 2. Kontrol dan navigasi

- K1. ATURAN NOMOR SATU: tab, segmen, toggle, deretan pilihan selalu ujung ke ujung, lebar item sama (`grid-auto-columns:1fr`), isi rata tengah; tidak pernah rata kiri. Berlaku juga untuk toggle kecil di dalam kartu dan lembar. (MT, PK deretan-pilihan, BS pilihan-penuh-lebar, WI)
- K2. Grup pilihan lebih dari tiga opsi dibagi beberapa baris yang tetap rata penuh; tinggi minimal 44px; teks satu baris tanpa terpotong. (BS)
- K3. Item terpilih (menu navbar, tab, segmen) berupa pil warna merek tua (`--brand`) dengan teks putih, bukan warna muda dan bukan cincin. (MT, WI)
- K4. Item menu kepala punya lebar, padding, tinggi seragam; ikon dan teks sejajar. (MT)
- K5. Setiap tombol di deretan pilihan memakai ikon. (PK)
- K6. Tombol berikon tampil sebagai ikon polos: tanpa border, kotak berlatar, atau outline bulat; hover cukup ganti warna; fokus keyboard tetap boleh outline lewat `:focus-visible`. (PK ikon-tanpa-garis-luar) `[BENTROK]` dengan S200 #49 (lihat bagian bentrok)
- K7. Aksi berupa ikon dengan tooltip, bukan tombol teks. (PK)
- K8. Panel mengambang di atas peta bisa digeser bebas, diubah lebarnya, dilipat, dan posisinya diingat per halaman (komponen `public/inti/panel_geser.js`). (MT, PK sidebar-bisa-ditarik)
- K9. Semua sidebar atau panel samping punya pegangan tarik lebar yang diingat per peramban. (PK)
- K10. Filter panel jenis (misalnya bencana) multi-pilih seperti ceklis, filter OR, URL memuat pilihan, "Semua" membersihkan; panel hanya tampil di tab yang relevan. (PK panel-bencana-direktori)
- K11. Pembanding wilayah lewat checkbox atau multi-pil. (PK)
- K12. Klik tidak boleh membekukan layar; chrome kontrol urgent, subtree berat deferred. (G INP.md)
- K13. Grup tabel kab/kota lalu kecamatan lahir TERTUTUP; pencarian aktif boleh membuka grup yang cocok. (PA grup-wilayah-tertutup)
- K14. Rincian satu tingkat di bawah cakupan: nasional ke provinsi, provinsi ke kab/kota, kab/kota ke kecamatan. (PA standar-tabel-sppg)
- K15. Pilihan status atau kondisi berupa picker berwarna atau segmen, bukan `<select>` native. (S200 #128, PK)
- K16. Tombol utama aksi penting bukan tautan teks polos; tombol punya umpan sentuh (`active:scale`). (S200 #78, #79)
- K17. Tombol disabled tetap terlihat; loading di tombol itu sendiri. (S200 #74, #75)
- K18. Konfirmasi destruktif menyebut dampak (jumlah data) dan menawarkan ekspor dulu. (WEB)
- K19. Tombol status (misalnya "Paket kamu") tidak boleh terlihat seperti tombol aksi. (WEB)
- K20. Bagikan dan unduh memakai satu mesin bersama, bukan `navigator.share` buatan sendiri. (PK plug-and-play)

## 3. Tabel

- B1. Semua tabel memakai satu kelas bersama `.jm-tabel`; brief agent layar wajib menyebutnya. (MT selera-tabel)
- B2. Thead SATU gradien warna merek menyambung di `tr`, th putih 10.5 sampai 12px, letter-spacing .09em, RATA TENGAH, garis aksen 2px di bawah header (METI: lime), sudut atas rounded. (MT, S200 #81 sampai #83)
- B3. Zebra halus, hover lembut, border bawah tipis, mode kartu di HP (`data-label`). (S200 #84, #85, MT)
- B4. SEMUA tabel bisa diurutkan per kolom (header tombol dengan ikon urut dan `aria-sort`); tabel berhalaman mengurutkan data penuh sebelum dipotong halaman. (MT, PK aturan-berulang)
- B5. Tabel dokumen punya kolom unduh langsung (ikon PDF) dan tautan sumber. (MT)
- B6. Tiap penyebutan regulasi di mana pun punya ikon unduh PDF dan tautan sumber (`unduhRegHtml`). (MT)
- B7. Perataan tabel: header tengah; kolom label (biasanya pertama) kiri; kolom lain, termasuk angka, tengah. `[BENTROK]` dengan MT (angka rata kanan) dan S200 #35 (lihat bagian bentrok). (PK 30 Okt)
- B8. Nol teks terpotong "…" di sel; tabel muat tanpa geser di 1280px; kolom sekunder pindah ke detail; geser samping hanya cadangan layar sempit. (GR selera-tabel-ui, MT)
- B9. Tabel tidak boleh terpotong (kolom kanan hilang): `table-layout:fixed`, lebar kolom eksplisit, meta di baris kedua, mode kartu di layar sempit. (MT)
- B10. Sel tidak pernah dua baris, kecuali kolom teks bebas panjang (Keterangan, Catatan) dengan lebar maksimal. (GR)
- B11. Identitas dua baris (nama tebal plus meta kecil); kolom No di kiri abu. (S200 #88)
- B12. Nilai kosong ditulis "-" redup bertooltip, bukan kata "belum tersedia". (MT)
- B13. Tabel data tetap digambar walau kosong: kepala kolom plus satu baris "Belum ada ..."; EmptyState besar tidak menggantikan tabel. (PA tabel-kosong-tetap-tampil, BS) `[BENTROK]` dengan S200 #94 (EmptyState ramah), keputusan: B13 menang
- B14. Kode plus nama adalah SATU kolom (lencana kode plus nama pendek), bukan dua kolom. (PA)
- B15. Footer total sejajar kolom angka; angka `tabular-nums`. (S200 #93, #35)
- B16. Tempo, status, kategori kecil berupa ikon plus legenda satu baris, bukan kata berulang. (GR)
- B17. Angka bertanda "EST" bila perkiraan; "Rp" kiri, angka kanan di ekspor. (MT, GR)
- B18. Ekspor Excel, PDF, PPT mengikuti aturan perataan yang sama dengan layar; PDF meniru kit PDF pangantara (pita header, kolom header tengah, zebra, "halaman n dari m") dan memuat gambar. (PK ekspor-pdf-pangantara)
- B19. Limit wajar dan urutan terbaru dulu. (S200 #100)
- B20. Tabel pencarian dan filter: bar cari di atas tabel, ekspor di kanan. (S200 #92)

## 4. Grafik dan data visual

- G1. Data disajikan sebagai grafik sungguhan (batang atau kolom dengan ambang dan nilai), bukan baris teks berjarak lebar. (MT)
- G2. Setiap grafik atau figur interaktif: hover atau sentuh menampilkan garis pemandu, titik sorot, dan tooltip nilai plus perubahan dari titik sebelumnya; SVG statis tidak cukup. (PK selera-teks-grafik)
- G3. Angka ditulis di grafik, termasuk nilai kecil. (PK aturan-berulang)
- G4. Jangan pakai progress bar atau batang progres bertumpuk untuk angka per baris; pakai pil berlabel titik warna plus angka. (MT)
- G5. Kartu insight: pil kategori, satu kalimat temuan dengan angka berwarna, kontrol segmen, grafik, kaki dengan legenda tengah dan "Sumber:". Tanpa subjudul, catatan penjelas, atau kotak KPI. (PK gaya-kartu-insight)
- G6. Tiap kartu insight punya kalimat temuan sebelum bukti; angka kunci diberi warna sesuai makna. (NP, PK)
- G7. Hindari singkatan "rb" dalam perbandingan; satu palet seri grafik; grafik pastel dengan kontrol sebaris kanan. (PK, GR)
- G8. Satu angka besar dengan satuan kecil (Rp kecil), plus pembanding. (WEB, NP)
- G9. Skor dan kuadran yang belum teruji berlabel "Hipotesis" dengan "Cara menghitung" terbuka. (KM C-16)
- G10. Pembanding periode like-for-like. (G)
- G11. Warna status baku: merah belum atau gagal, biru terkirim atau aktif, hijau selesai, kuning menunggu atau telat; legenda memakai warna bermakna dan label Indonesia. (S200 #22, PK)

## 5. Peta

- P1. Semua peta penuh (selebar wadah atau full-bleed); panel dan daftar mengambang di atas peta atau laci yang muncul saat diklik; tidak ada kolom samping berisi instruksi kosong. (MT)
- P2. Peta meniru peta Direktori Jaringan Kebencanaan dan peta utama poskokarhutla (`public/index.html`): panel overlay berubin, kartu legenda putih berjudul LEGENDA, jejak "Indonesia ›", tabel gaya `.tb`. (KM K10, PK sidebar-bisa-ditarik)
- P3. Zoom awal pas ke data. (MT)
- P4. Peta titik tanpa peta dasar dilarang; titik selalu di atas garis provinsi atau peta. (MT)
- P5. Tiap negara berbendera, tiap provinsi berlambang, tiap organisasi berlogo. (MT)
- P6. Chip label peta tidak terpotong (satu kolom atau label penuh). (MT)
- P7. Mutu koordinat dijaga: tidak ada pin menumpuk atau nyasar; sapuan titik berkala. (G penjaga-titik)
- P8. Lapisan rinci dan kontrol peta baru disalin dari peta utama, bukan gaya karangan sendiri. (PK)
- P9. Citra satelit asli, bukan ilustrasi, sebagai dasar dan banner bila ada rujukan Papua. (NP) `[BUKAN METI]` bila tidak ada kebutuhan

## 6. Gambar, logo, ikon

- I1. Ikon aksi bergaya Lucide: stroke 2 sampai 2.4, round cap dan join, viewBox 24, ukuran 16 sampai 18px; tanpa library ikon baru. (S200 #47, #53)
- I2. Emoji tidak pernah menggantikan logo merek; WhatsApp memakai SVG resmi. (S200 #45, #46)
- I3. Tombol ikon polos tanpa garis luar (lihat K6). (PK)
- I4. Logo organisasi dari situs resmi entitasnya, disimpan di R2, dengan penghapusan atas permintaan; tanpa inisial pengganti bila tak ada logo resmi. (KM C-15, PK aktor)
- I5. Thumbnail dan foto berita wajib ada (rujukan `public/akademisi.js` BFOTO, `berita_rss.py` og:image). (MT tiru-posko)
- I6. Semua baris "Sumber:" dan "Kredit foto" menjadi ikon info bulat yang bisa diklik (popover), bukan teks panjang di bawah seksi (`sumberHtml()` dan `.jm-sumber`). (MT)
- I7. Gambar OG 1200x630, favicon lengkap, JSON-LD, sitemap, robots. (WEB)
- I8. Kop email tanpa logo gambar (diblok Gmail, tampil ikon rusak). (GR commit f4069fb)
- I9. Tanpa cursor `help` di mana pun. (PK fitur-disembunyikan)

## 7. Bahasa dan tulisan

- L1. Tanpa em dash di berkas apa pun; ganti titik dua atau koma. (S200 #39, MT, G)
- L2. Tanpa karakter titik tengah (U+00B7) sebagai pemisah teks di UI, kartu, dan deck; pakai koma, kalimat, label sendiri, atau baris baru. (PK tanpa-titik-tengah)
- L3. Tanpa teks KAPITAL penuh yang sampai ke mata: nama orang, lembaga, wilayah, kepala kelompok, baris total, label peta. Berlaku layar dan ekspor; rapikan seluruh KELAS sumber, bukan per tempat. (PA caps-lock-dilarang, vonis empat kali) `[BENTROK]` dengan header tabel `uppercase`; keputusan: lihat bagian bentrok
- L4. Bahasa lugas, faktual, birokratis-polos; bukan puitis atau berbau AI: tanpa personifikasi, slogan, kontras retoris "X bukan Y", tiga-serangkai, kalimat penutup bergaya. (PK bahasa-lugas)
- L5. Judul berupa pernyataan fakta plus angka plus sumber; label berupa kata benda polos. (PK)
- L6. Instruksi di UI maksimal satu kalimat; contoh nyata di placeholder. (S200 #42)
- L7. Blok paragraf (ringkasan, biografi, narasi) selalu `text-align:justify` dengan `hyphens:auto`. (PK selera-teks-grafik)
- L8. Strip teks penjelas: data plus label saja. (PK aturan-berulang, hitungan 25 kali)
- L9. Dwibahasa Indonesia dan Inggris dengan tombol ganti; kunci setara; tak ada teks tertanam di JS. (KM K8)
- L10. Bahasa Indonesia kasual-santun di UI; format angka, tanggal, jam satu formatter; jam Indonesia 24 jam dengan "WIB". (WEB, S200 #36 sampai #38)
- L11. Nama satu masakan satu nama; label, bahan, atau lauk tidak menempel di nama (berlaku sebagai pola: satu entitas satu nama baku, kata golongan dibuang). (BS nama-resep-satu-masakan)
- L12. Sapaan ke pemilik: tanpa "Bapak" atau "Pak"; pakai "lu" atau tanpa kata ganti, Indonesia kasual. (PK sapaan-pemilik)
- L13. Mengunci nama merek: jangan tulis nama merek lama proyek lain (mis. "Pantau Bencana") di proyek ini. (PK tanpa-pantau-bencana) `[BUKAN METI]` untuk namanya, polanya berlaku: hanya nama merek yang sah.
- L14. Kata "prioritas", "mitra" dan sejenis dipakai sesuai sudut pandang pemilik layanan, bukan label netral otomatis. (PK kita-bnpb)
- L15. Nama pemilik di sampul dokumen pihak ketiga ikut aturan khusus; tanyakan bila perlu gelar. (PK nama-pemilik)
- L16. Komentar kode berbahasa Indonesia, menjelaskan alasan dan sejarah. (S200 #12, #198)
- L17. Pesan terima kasih dan sapaan sopan formal-hangat di pesan keluar; WA dengan struktur baku. (S200 #174, #175)

## 8. Data dan sumber

- D1. Tidak ada angka tanpa asal: sumber, tanggal, label EST, format ID/EN. (G selera-angka, WEB)
- D2. Panen data wajib menyisir berita juga (bukan hanya Wikipedia dan dokumen resmi); entri dari berita bertingkat bukti "media" dengan url dan tanggal. (MT sumber-berita-juga)
- D3. Setiap data saling terhubung: satu profil per orang di semua tab, anggota organisasi tampil di profil organisasi dan sebaliknya; dataset baru ditambah ke skrip hubung plus ujinya. (PK direktori-semua-terhubung)
- D4. Tiap fakta profil bersumber; tag kepakaran wajib bersumber dan tidak ditebak dari nama lembaga. (KM K16)
- D5. Dikeluarkan dari direktori: orang yang tersangkut kasus KPK (tersangka, saksi OTT, atau tersebut dalam pemberitaan), orang yang sudah meninggal, dan nama yang disebut pemilik; tidak dipulihkan di panen berikutnya. (PK direktori-tanpa-kasus-kpk) `[BUKAN METI]` untuk daftar namanya; polanya (cek berita sebelum unggah) berlaku.
- D6. Tingkat bukti ditampilkan (resmi, media, perkiraan); perkiraan bergaris putus-putus atau berlabel. (NP, KM)
- D7. Panen hormat: hormati robots.txt dan Crawl-delay, jeda per domain, UA jelas, berhenti di 403 atau 429, tidak mengakali dinding bot, buang nomor HP dan email dari deskripsi (UU PDP), foto hanya URL. (WI panen-terima-risiko-tos, PK)
- D8. Data dari 1001startup.id: fakta plus sumber primer dengan atribusi, tanpa teks, estimasi, atau logo mereka. (KM C-13)
- D9. Satu modul hitung untuk tiap pertanyaan bisnis, satu sumber kebenaran; semua layar memakainya. (WEB, S200 #13)
- D10. Angka dibuat dari perhitungan, bukan dikarang; format angka dan label sama antar layar; beda sedikit dianggap bug. (WEB)
- D11. Hasil model: ceritakan keterbatasan dan keyakinan; jangan campur tingkat keyakinan tanpa kalibrasi. (PK keyakinan-rendah)
- D12. Snapshot data di dokumen agar dokumen tak berubah saat master berubah. (S200 #162)
- D13. Semua waktu Asia/Jakarta; timestamp `timestamptz`. (S200 #151)
- D14. Tiap data punya pemeliharaan berkala; dataset baru punya jadwal pembaruan otomatis. (PK direktori-data-strategis)
- D15. Fitur yang sengaja disembunyikan dicatat di daftar (berkas, cara memulihkan) agar bisa dikembalikan. (PK fitur-disembunyikan)
- D16. Data contoh fiktif hanya fixture uji dan seed D1 lokal atau pratinjau, tidak pernah lewat tombol di layar. (KM K15, MT)
- D17. Perkiraan kebutuhan kuota baca: sebelum menambah kerja terjadwal, hitung baris dibaca per jalan kali jumlah jalan per hari terhadap batas D1 (5 juta per hari tingkat gratis). (PK d1-kuota-baca)

## 9. Keamanan dan privasi

- S1. Repo publik: tanpa rahasia, data pribadi, atau `account_id`. (CLAUDE.md METI)
- S2. Data pakar atau pribadi tidak masuk repo atau `public/`; simpan di R2 dan layani lewat API berperan. (PK direktori-akademisi)
- S3. Kunci API hanya di secret server atau Keychain; tak pernah di berkas, git, log, atau chat; kunci yang pernah ter-commit diputar. (PK kunci-bps, WEB)
- S4. Kunci yang ditempel pemilik ke chat tidak diulang atau ditulis ke berkas; siapkan perintah tempel-sendiri lebih dulu. (BS rahasia-lewat-chat)
- S5. Autentikasi diperiksa di setiap rute server, bukan hanya disembunyikan di UI; RLS atau `hak.js` untuk data; validasi tiap input di server. (WEB, KM K9)
- S6. Batas laju per pengguna dan IP di rute yang memakan kuota atau tagihan; batas belanja di dasbor penyedia AI. (WEB)
- S7. Error ke klien tanpa stack trace; pelacakan error aktif. (WEB)
- S8. Halaman tanpa login memakai token atau slug; token acak tidak tampil ke manusia, slug terbaca; tautan lama tetap hidup. (S200 #141 sampai #150)
- S9. "Lihat sebagai" masuk lewat sesi dan RLS akun sungguhan, bukan menukar tampilan; tercatat di audit log. (PA lihat-sebagai-sesi-asli)
- S10. Akses tabel nasional dibatasi cakupan wilayah pembacanya. (G cakupan-auditor)
- S11. Kebijakan privasi dan ketentuan; consent untuk analitik; klaim di landing tidak lebih manis dari kebijakan. (WEB)
- S12. Backup DB otomatis dan uji pemulihan sungguhan sebelum pengguna pertama. (WEB)
- S13. Tiap penyebutan data pribadi mengikuti UU PDP; halaman internal hanya untuk peran yang berhak. (PK, WI)

## 10. Kerja agent dan proses

- A1. Opus hanya merencana, memutuskan, mengunci kontrak, dan review akhir; pengerja Sonnet, pemeriksa pola dan pencarian Haiku; tiap agent bermodel tertulis. (MT, PK hemat-token-model, G AGEN.md)
- A2. Maksimal 5 agent paralel, satu pemilik per berkas, brief berisi path plus kriteria selesai, laporan maksimal 15 baris, lanjutkan lewat SendMessage. (MT)
- A3. Kunci kontrak inti dulu, baru agent paralel; jangan biarkan kerja menunggu. (MT kecepatan-dan-model)
- A4. Tiap proyek baru dipasangi armada agent sejak hari pertama (roster, model, ilmu per agent, AGENTS.md). (PA armada-agent-proyek-baru, G)
- A5. Pemilik perfeksionis: kerja agent direview baris demi baris oleh sesi induk plus verifier konteks bersih sebelum commit; laporan sendiri agent bukan bukti. (PK kendali-mutu)
- A6. Periksa tangkapan sendiri sebelum lapor: 1440 dan 375, terang dan gelap, ID dan EN, bandingkan berdampingan dengan padanan Posko. (MT, PK)
- A7. Aturan yang diulang pemilik lebih dari sekali masuk ke gerbang mekanis (uji atau hook) pada giliran yang sama, bukan hanya memori. (PK aturan-ke-gerbang, G)
- A8. Sebelum menulis aturan baru, periksa bentrok dengan aturan lama dan tanyakan pemilik mana yang menang. (PK)
- A9. Tiap fitur baru lahir dengan hub dan tombol bagikan; tidak ada fitur yatim. (S200 #10)
- A10. Tiap perilaku di luar JavaScript (trigger, constraint, RLS, fungsi SQL, route handler, alur lintas tabel) punya uji integrasi yang benar-benar menjalankannya; mock tidak cukup. (G TEST.md)
- A11. Definisi selesai: bukti hijau, typecheck atau uji nol temuan, commit bersih, balasan berisi tautan siap klik plus apa yang belum live; gagal berarti sebut akar masalah dan solusi, jangan memutar. (S200 #199, AGENTS.md)
- A12. Hemat token tanpa menurunkan standar; keputusan teknis boleh didelegasikan ke Claude selama mutu tetap. (BS hemat-token-tanpa-turun-standar, PK)
- A13. Target waktu pemilik dianggap nyata (METI 4 hari); port kode yang sudah ada seharusnya hitungan jam. (MT)
- A14. Fitur, layar, atau tabel yang tidak tertulis di paket perencanaan tidak dibuat; bila dokumen bertentangan atau kurang, berhenti dan tanya. (KM, AGENTS.md)
- A15. Pekerjaan besar yang belum disetujui jangan dikerjakan satu per satu di tengah diskusi; catat dulu, rekomendasikan, bangun bersama nanti. (PK peluang-bisnis-data)
- A16. Tombol isi data dummy TIDAK ada di METI (lihat bentrok). (KM K15)
- A17. Layar dinyatakan selesai hanya setelah alur desain AGENTS.md §5 (lihat, audit, review terpisah) jalan. (AGENTS.md)
- A18. Cek INP untuk handler klik, tab, paginasi, sort baru (agent `inp-reviewer`). (G INP.md)
- A19. Jangan menahan suntingan setengah jadi di working tree sebagai pengaman: commit "gas" pemilik menyapu semuanya; simpan di scratchpad sampai aman. (PK gas-menyapu)
- A20. Dokumentasi perencanaan: dokumen di atas menang; konflik dilaporkan, bukan diselesaikan sendiri. (KM)

## 11. Deploy

- Y1. Hanya branch `main`; tanpa branch agent, tanpa worktree tersisa; bila ada branch lain, laporkan dan berikan perintah hapus. (PK hanya-main, BS git-cuma-main, PA) `[BENTROK]` dengan AGENTS.md METI §3.3 (lihat bentrok)
- Y2. Commit dengan path spesifik: `git add -- <path>` dulu, baru `git commit -m ... -- <path>`; jangan `git add -A`; berkas baru harus di-stage atau tertinggal dan memecah deploy. (BS commit-path-berkas-baru, PK icloud-documents)
- Y3. Push ke main = tayang publik pada repo METI: jangan commit `wrangler.jsonc` atau kode Worker yang bisa ter-deploy sampai F0 lolos gerbang keamanan (hak.js, sesi, CSP, uji 112 sel). (MT deploy-main-otomatis)
- Y4. Setelah push, pastikan run deploy sukses dan satu aset berubah memang ada di situs live sebelum bilang "tayang"; push sukses bukan bukti tayang. (PK terbit-gagal)
- Y5. Batas `_headers` Cloudflare (100 aturan): tambah banyak berkas statis harus memeriksa jumlahnya. (PK terbit-gagal)
- Y6. Token git mesin ini tak punya scope `workflow`; commit yang menyentuh `.github/workflows/**` ditolak, minta pemilik mendorong lewat GitHub Desktop. (PK kendali-mutu, gas-menyapu)
- Y7. Migrasi bernama unik, idempoten, tidak menyunting yang sudah jalan; tiap status berCHECK; trigger untuk kaitan wajib. (S200 #5, #193 sampai #195)
- Y8. Rute lama tetap hidup (redirect, bukan 404) saat yang baru datang. (S200 #14)
- Y9. Keputusan tampilan yang menyentuh sumber daya produksi (unggah R2, tulis produksi) minta persetujuan pemilik. (PK direktori-jejak)
- Y10. Siapkan rencana rollback tertulis untuk hari peluncuran; pantau kegagalan CI dan deploy (skill beresin-gagal-deploy). (WEB, G)

---

## Aturan yang bertentangan dan mana yang berlaku di METI

| No | Bentrok | Berlaku di METI | Alasan |
| --- | --- | --- | --- |
| X1 | Tombol dummy: `DUMMY.md` global dan "tiap website wajib punya tombol dummy" lawan K15 | TANPA tombol dummy | KM K15 menang atas aturan global (kata pemilik: "tombol dummy gausah") |
| X2 | Perataan angka di tabel: MT dan S200 #35 (angka tabular rata kanan) lawan PK 30 Okt dan ekspor-pdf (angka tengah; kolom label kiri) lawan PA/GR (Rp kiri angka kanan) | Header tengah selalu. Kolom label kiri. Angka: rata kanan di sel dengan `tabular-nums` (ketentuan MT selera-tabel, memori khusus METI), dan jangan campur dengan keputusan 30 Okt poskokarhutla | Memori platformmeti menang; keputusan 30 Okt hanya mengikat proyek poskokarhutla. Bila pemilik menginginkan angka tengah, ubah di `.jm-tabel` dan gerbang serentak |
| X3 | Header tabel `uppercase` (MT, S200) lawan "tanpa KAPITAL penuh" (PA caps-lock-dilarang) | Header tabel memakai `capitalize` atau huruf awal kapital (bukan kapital penuh), kecuali label eyebrow kecil yang memang ditetapkan MT | MT selera-tabel menyebut "uppercase/capitalize"; larangan kapital penuh untuk data, nama, dan total tetap berlaku; konfirmasi ke pemilik bila ingin header kapital penuh |
| X4 | Worktree: AGENTS.md METI §3.3 (agent penulis pakai `isolation: worktree`) lawan "hanya main" pemilik (PK, BS, PA) | Hanya `main`; agent penulis berjalan di checkout utama dengan berkas terpisah, tanpa worktree tersisa | Larangan pemilik berulang kali; perbaiki AGENTS.md §3.3 METI |
| X5 | Ikon dibungkus kotak `h-8 w-8 rounded-lg border` (S200 #49) lawan ikon polos tanpa garis luar (PK 3 Nov) | Ikon polos tanpa garis luar | Keputusan lebih baru (3 Nov 2026) dan eksplisit "di proyek mana pun" |
| X6 | EmptyState ramah (S200 #94) lawan tabel kosong tetap tampil (PA, BS) | Tabel kosong tetap tampil; EmptyState hanya untuk layar non-tabel | Vonis lebih baru, diulang dua kali |
| X7 | Palet: navy dan emas MBG (S200), navy Centurisk97 (PK), tembaga Papua (NP) lawan Midnight Energy dan lime METI | Palet METI (KM C-05, MT) | Setiap proyek punya merek sendiri |
| X8 | Rujukan gaya: Oyenza monokrom ala iOS (WEB §1) lawan gaya METI (KM K4) | Gaya METI; Oyenza hanya untuk detail, konsistensi, dan format angka | KM K4 dan AGENTS.md §5 menyatakan DESIGN-SYSTEM METI menang atas skill mana pun |
| X9 | Emoji untuk menu (S200 #43, #44) lawan ikon SVG bergaya Lucide (S200 #47, WEB) | Ikon SVG; emoji tidak dipakai di UI METI | S200 khusus aplikasi dapur MBG; METI formal-institusional |
| X10 | Bahasa: kasual-santun "kamu" (WEB) lawan birokratis-polos tanpa gaya (PK bahasa-lugas) | Birokratis-polos, faktual | Audiens METI adalah pengurus dan pemangku kepentingan energi; PK bahasa-lugas lebih tegas |
| X11 | "Bagikan lewat share sheet" lawan mesin Bagikan bersama | Mesin Bagikan bersama (`aksi_ex.js`) | PK plug-and-play |
| X12 | Satu bahasa desain lawan ide model baru per modul | Tiru modul padanan lalu sesuaikan konteks METI | MT tiru-posko, PK plug-and-play |
