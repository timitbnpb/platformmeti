# OPERASIONAL: Platform Jaringan METI (aspek non-teknis)

Lampiran perencanaan. Kalah dari `KEPUTUSAN-METI`, `GRAND-DESIGN`, `PRD`, `ALUR`, `KEAMANAN-PRIVASI`, dan `TIKET`; bila bertentangan, dokumen itu menang. Versi 1, 7 Nov 2026. Status: usulan perancang, belum diputus pemilik. Masih rencana: tidak ada yang di sini berarti kode, akun, atau pengeluaran sudah ada.

Dokumen ini mengisi yang belum tertulis di paket: siapa memutuskan apa, aturan isi data, nilai bagi anggota, tenaga manusia, biaya, peluncuran, risiko, serah terima, hubungan dengan situs metiires.or.id, kalender kerja, dan pertanyaan baru untuk pemilik. Kebijakan hukum (privasi, syarat, lisensi) hanya kerangka dan WAJIB ditinjau penasihat hukum METI sebelum rilis publik. Angka harga adalah perkiraan dan ditandai `[V]` bila harus diverifikasi ke halaman harga resmi sebelum dipakai.

Singkatan: KP = KEPUTUSAN-METI, GD = GRAND-DESIGN, KPV = KEAMANAN-PRIVASI, R3, R4, R6, R9 = `riset/`. PH = Pengurus Harian, SJ = Sekretaris Jenderal, BIM = Bidang Informasi dan Multimedia (nama sesuai KP C-20), MI = METI Institute, MW = METI Wilayah, SEK = Sekretariat, DEV = tim pengembang.

## Daftar isi

1. Tata kelola
2. Kebijakan data
3. Model keanggotaan dan nilai
4. SDM dan peran harian
5. Anggaran
6. Rencana peluncuran
7. Daftar risiko
8. Keberlanjutan
9. Integrasi dengan metiires.or.id
10. Kalender kerja
11. Pertanyaan baru untuk pemilik

---

## 1. Tata kelola

### 1.1 Prinsip

1. Platform ini milik METI, bukan milik tim pengembang. Tim pengembang membangun dan merawat atas mandat METI (KP C-01 menunggu jawaban; bawaan saat ini purwarupa).
2. Satu orang di METI memegang keputusan produk. Tanpa pemilik produk, antrean permintaan menumpuk dan jawaban "boleh tampil atau tidak" berpindah dari satu rapat ke rapat lain.
3. Setiap angka dan nama yang tampil publik punya penyetuju yang bisa disebut. Bila ditanya "siapa yang mengizinkan ini tampil", jawabannya satu peran, bukan "tim".
4. Hak terakhir ada pada METI, bukan pada mesin: tidak ada penerbitan otomatis untuk kelas data yang berisiko (orang, skor, kuadran, posisi kebijakan).

### 1.2 Pemilik produk

| Hal | Usulan | Alasan |
| --- | --- | --- |
| Pemilik produk | Satu anggota PH yang ditunjuk Ketua Umum lewat surat tugas pendek. Bawaan: Sekretaris Jenderal (SJ) | SJ memegang jalur organisasi dan sekretariat; keputusan "tampil atau tidak" menyentuh anggota |
| Wakil pemilik produk | Direktur Eksekutif atau Direktur Sekretariat | Menjaga kerja harian bila SJ berhalangan |
| Sponsor | Ketua Umum | Mandat publik; tanda tangan pada surat rilis |
| Pengelola harian data | BIM (kurator) dengan MI (peninjau angka), KP C-20 | Sudah jadi bawaan KP |
| Catatan nama bidang | Struktur SK revisi (R3 §1.4) menamai Bidang Kerja 7 "Strategic Communication dan Public Campaign", bukan "Informasi dan Multimedia" | Tanyakan nama padanan resmi (C-23) supaya surat tugas menyebut organ yang benar |

Pemilik produk memutus dalam 5 hari kerja untuk permintaan yang sampai ke meja. Lewat 5 hari tanpa jawaban, berlaku bawaan tertulis di KP C atau dokumen ini, dan keputusan dicatat di Log Keputusan (§1.6).

### 1.3 Tabel RACI

R = pelaksana, A = penanggung jawab akhir (satu per baris), C = diajak berunding sebelum, I = diberi tahu sesudah. Kosong = tidak terlibat.

| Kegiatan | PH | SJ | BIM | MI | MW | SEK | DEV | Ketua Umum |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Menetapkan arah dan ruang lingkup platform | C | A | C | C | I | I | C | R (menyetujui) |
| Menyetujui rilis tahap (lunak, publik) | A | R | C | C | I | C | C | R (tanda tangan) |
| Kurasi harian (tambah, ubah, tandai usang) | I | I | A, R | C | C | C | | |
| Meninjau angka turunan, skor, kuadran | I | C | C | A, R | | | C | |
| Menyetujui tampilnya kelas data berisiko (orang, skor BUMN, posisi kebijakan) | C | A | R | R | | C | | I |
| Mengonfirmasi lencana "Anggota METI" | | C | | | | A, R | | |
| Data dan agenda METI Wilayah di provinsinya | | C | C | | A, R | | | |
| Membuat dan menonaktifkan akun | | C | | | C | A, R | C | |
| Memutus koreksi dan hak jawab | | C | A, R | C | | C | | |
| Permintaan hapus dan hak subjek data (UU PDP) | I | A | R | | | R | C | I |
| Penanganan insiden data | I | A | C | | | R | R | I |
| Membeli, membayar, memperpanjang layanan (Cloudflare, domain) | I | A | | | | R | C | |
| Merawat kode, migrasi, deploy | | I | | | | | A, R | |
| Pemilik akun dan kunci layanan (§8) | I | A | | | | R | R | |
| Komunikasi publik (siaran pers, media sosial) | C | C | A, R | C | C | | | I |
| Kebijakan Privasi dan Syarat Penggunaan | C | A | | | | C | C | I |
| Tinjauan hukum | I | A | | | | R | | |

Catatan: baris "A, R" ganda pada kurasi berarti BIM menanggung sekaligus mengerjakan. Peran Admin dan Kurator di sistem (KPV §1) dipegang oleh orang yang ditunjuk di kolom BIM dan SEK; MW dipetakan ke peran `wilayah` dengan `cakupan_prov` (KP C-07).

### 1.4 Siapa menyetujui rilis publik

| Tahap | Syarat | Penyetuju | Bukti tertulis |
| --- | --- | --- | --- |
| Purwarupa internal | Data contoh saja (`example.org`, akhiran "(contoh)") | Pemilik produk | Catatan di Log Keputusan |
| Uji tertutup Pengurus | Lulus gerbang F0, tanpa data pribadi nyata | Pemilik produk | Daftar penguji dan tanggal |
| Peluncuran lunak anggota | Kebijakan Privasi dan Syarat versi 1 sudah ditinjau hukum; kriteria F1 terpenuhi (§6) | PH (rapat atau persetujuan tertulis) | Notulen atau surel persetujuan |
| Peluncuran publik | Semua di atas ditambah checklist siap rilis (§6.5) | Ketua Umum atas rekomendasi PH | Surat rilis ber-tanda tangan |

### 1.5 Siapa menyetujui data tampil

Data dibagi tiga kelas menurut risiko. Kelas ditentukan jenis rekaman, bukan perasaan kurator.

| Kelas | Isi | Penyetuju sebelum tampil publik | Waktu |
| --- | --- | --- | --- |
| A, rutin | Perusahaan, lembaga, proyek, regulasi, wilayah dengan fakta bersumber primer | Kurator (BIM); peninjau angka (MI) hanya untuk angka kapasitas dan keuangan | Langsung setelah gerbang sumber lulus |
| B, turunan | Skor keyakinan tampil, kuadran BUMN, matriks risiko data center, cerita data, rapor provinsi, label `EST` | MI memeriksa metode dan angka; SJ menyetujui terbit; entitas yang diberi skor diberi hak jawab (§2.3) | Maks 10 hari kerja |
| C, sensitif | Rekaman orang (nama, jabatan, afiliasi), kata "Anggota METI", posisi METI atas kebijakan, tuduhan atau perbandingan antar nama perusahaan, entitas yang pernah diminta keluar | SJ (dan PH untuk posisi kebijakan); orang dicek terhadap `daftar-tolak` | Maks 10 hari kerja; tanpa persetujuan tidak tampil |

Aturan pengaman: pipeline otomatis hanya boleh menerbitkan kelas A. Kelas B dan C masuk antrean "menunggu persetujuan" dan tidak masuk potret publik sebelum ditandai disetujui.

### 1.6 Log Keputusan dan ritme rapat

| Hal | Aturan |
| --- | --- |
| Log Keputusan | Satu berkas bersama (tabel: tanggal, keputusan, pemutus, alasan, tautan). Tiap keputusan produk yang menyimpang dari bawaan KP masuk sini, lalu KP bagian D diperbarui |
| Rapat produk | 30 menit per minggu selama F0 sampai F1; dua minggu sekali sesudahnya. Peserta: pemilik produk, wakil BIM, wakil MI, DEV |
| Laporan ke PH | Satu halaman per bulan: angka U1 sampai U8 (GD §8), antrean koreksi, risiko merah |
| Eskalasi | Sengketa data antar bidang (misalnya BIM dan MI beda tafsir angka) naik ke SJ; antar entitas anggota naik ke PH |
| Sinkron dengan paket | Pengerja agen tidak mengubah bawaan KP; hanya pemilik produk lewat sesi perencanaan |

---

## 2. Kebijakan data

### 2.1 Kebijakan kurasi

**Standar sumber.** Urutan keandalan, dari yang paling dipercaya:

| Tingkat bukti (usulan) | Jenis sumber | Contoh | Boleh jadi |
| --- | --- | --- | --- |
| 1, primer resmi | Dokumen yang diterbitkan pihak yang bersangkutan atau pemerintah | Laporan tahunan, siaran pers resmi, peraturan di JDIH, RUPTL, SK kementerian, situs resmi entitas | Fakta tunggal |
| 2, sekunder terpercaya | Lembaga data atau riset yang dikenal dan menyebut metodenya | IRENA, Ember, IEA (ringkasan), World Bank, OpenAlex, BPS, IESR, GEM (tautan saja) | Fakta bila ada sumber 1 atau 2 sumber lain yang cocok |
| 3, media | Berita media arus utama | Kontan, Bisnis, Katadata | Penanda "perlu konfirmasi"; tidak jadi angka utama |
| 4, petunjuk | Agregator, direktori pihak ketiga, unggahan tanpa dokumen | 1001startup.id (hanya penunjuk nama), media sosial | Tidak jadi fakta; hanya memicu pencarian sumber primer |

Nama tingkat dan jumlahnya final mengikuti enum `tingkat_bukti` di ALGORITMA (belum ditulis pada paket ini); tabel ini dasar usulan, dan bila ALGORITMA berbeda, ALGORITMA menang dan bagian ini disesuaikan.

**Aturan fakta.** Tiap fakta wajib `sumber_url`, `tanggal_periksa`, dan `tingkat_bukti` (KP D5). Angka turunan berlabel `EST`. Angka yang berbeda antar sumber (contoh potensi panas bumi 23,2, 23,9, dan 24 GW) disimpan sebagai rentang dengan sumbernya masing-masing, tidak dirata-rata diam-diam. Jabatan pejabat publik berubah cepat; tiap jabatan membawa tanggal "per".

**Kapan entitas masuk sensus.** Semua syarat berikut:

1. Ada keberadaan hukum atau fisik yang bisa dibuktikan dari sumber tingkat 1 atau 2 (akta atau NIB, situs resmi, izin, atau proyek yang tercatat).
2. Kegiatan utamanya masuk sektor di KP C-12 (bawaan: EBT, penyimpanan, jaringan, efisiensi, kendaraan listrik, sampah jadi energi, hidrogen).
3. Aktif dalam 36 bulan terakhir (ada produk, proyek, publikasi, atau dokumen tahun berjalan).
4. Tidak ada di `daftar-tolak` dan lolos pemeriksaan konflik kepentingan (§2.5).
5. Minimal satu fakta bersumber lengkap dan satu pernyataan "apa yang dilakukan" yang ditulis ulang oleh kurator (tidak disalin).

**Kapan keluar atau diberi status.**

| Kondisi | Tindakan |
| --- | --- |
| Entitas dibubarkan atau dicabut izin dan ada sumber | Status "tidak aktif" dengan tanggal; tetap tampil sebagai arsip, keluar dari hitungan sensus aktif |
| Tidak ada pembaruan atau konfirmasi 36 bulan | Label "perlu diperiksa ulang"; setelah 60 bulan tanpa bukti hidup, status "tidak aktif" |
| Fakta usang (lewat batas umur menurut jenis; usul: kapasitas 24 bulan, jabatan 6 bulan, regulasi bila ada perubahan) | Lencana "Per <tanggal>" berubah kuning di layar kurator; tampil publik dengan label usang |
| Permintaan hapus oleh entitas atau orang | Jalur §2.4 |
| Terbukti keliru atau menyesatkan | Koreksi segera (§2.3), jejak koreksi tetap tersimpan di riwayat, bukan dihapus diam-diam |
| Terkait kasus hukum korupsi, orang sudah meninggal | Keluar total (KP D14), tanpa pengecualian |

**Dua mata.** Perubahan fakta kelas B dan C butuh dua orang berbeda: pengusul dan penyetuju. Kurator tidak menyetujui perubahan yang ia usulkan sendiri.

**Pemeriksaan berkala.** Tiap bulan, laporan fakta yang lewat batas umur; tiap triwulan, sampel acak 5 persen entitas diperiksa ulang oleh MI terhadap sumbernya; hasilnya (persen fakta masih benar) masuk laporan ke PH.

### 2.2 Terjemahan

Kurator menulis dalam bahasa Indonesia dahulu (KP C-14). Terjemahan Inggris ditandai "perlu tinjau" sampai ada peninjau penutur; mesin penerjemah boleh membuat draf, tidak boleh menerbitkan sendiri untuk teks kelas B dan C. Istilah teknis dan nama peraturan memakai glosarium tetap (GLOSARIUM) supaya "Perpres 112/2022" dan "RUU EBET" konsisten.

### 2.3 Kebijakan koreksi dan hak jawab

| Langkah | SLA (hari kerja) | Siapa |
| --- | --- | --- |
| Konfirmasi terima (otomatis atau manual) | 2 | Kurator |
| Koreksi faktual dengan bukti jelas (salah ketik, angka salah, jabatan berganti) | 5 sejak terima | Kurator |
| Koreksi yang butuh periksa sumber atau berselisih dengan sumber lain | 10 | Kurator dan MI |
| Hak jawab entitas atas skor, kuadran, atau rapor sebelum terbit pertama | 7 hari kerja bagi entitas menjawab; tanpa jawaban, terbit dengan catatan "sudah diberi kesempatan menjawab" | MI dan SJ |
| Sengketa tidak selesai | Naik ke SJ; keputusan tertulis dalam 14 | SJ |
| Hak subjek data (akses, koreksi data pribadi, hapus, tarik persetujuan) | 14 (KPV §3.3) | SJ, BIM, SEK |

Aturan isi koreksi:

1. Koreksi diumumkan di profil bila mengubah makna ("Diperbarui <tanggal>: jabatan dikoreksi"). Salah ketik kecil tidak perlu catatan.
2. Pengaju tidak perlu akun (formulir publik F3; sebelum itu lewat surel privasi dan antrean kurator, KPV §1 butir 6).
3. Pengaju diminta menunjuk sumber. Tanpa sumber, kurator tetap memeriksa, tetapi keputusan "tolak" ditulis beserta alasan.
4. Entitas yang merasa dirugikan boleh menambah "Tanggapan entitas" setinggi 800 karakter pada profilnya (tampil berlabel, tidak mengubah fakta).
5. Semua koreksi, tolak, dan jejaknya tercatat; tidak ada penghapusan riwayat koreksi.

### 2.4 Kebijakan hapus atas permintaan (UU PDP)

Kerangka: UU 27/2022, Pasal 8, 43, dan 44 (R6 §5.1). Bukan nasihat hukum.

| Aspek | Aturan usulan |
| --- | --- |
| Siapa boleh meminta | Subjek data (orang) atau wakil entitas yang bisa membuktikan kendali surel resmi atau surat kuasa |
| Verifikasi | Balasan dari surel yang tercantum di sumber, atau surat resmi entitas; permintaan tanpa verifikasi diminta melengkapi, bukan diabaikan |
| Batas waktu | 14 hari kerja sejak verifikasi (KPV §3.3) |
| Cakupan penghapusan | Baris D1, kolom turunan, berkas R2 (logo, dokumen), indeks pencarian, potret yang dibangun ulang, cache tepi (KPV §3.3) |
| Yang disimpan | Hash identitas dan tanggal penghapusan di `daftar-tolak` agar impor berikutnya tidak menghidupkan ulang |
| Pengecualian | Data entitas hukum (bukan orang) yang berasal dari sumber primer publik dapat dipertahankan bila ada kepentingan publik; keputusan tertulis SJ, pemohon diberi alasan dan jalur banding. Perlu tinjauan hukum |
| Pencabutan sementara | Atas permintaan, profil bisa "disembunyikan dari publik" dulu (Pasal 11) sambil menunggu keputusan |
| Konfirmasi | Pemohon menerima surel konfirmasi tanggal selesai; nama pengurus yang menangani dicatat di jejak, bukan di surel ke pemohon |

### 2.5 Kebijakan logo dan merek

1. Logo hanya dari situs resmi atau kit pers entitas itu (KP C-15); tidak mengambil dari 1001startup.id atau agregator.
2. Disimpan di R2 dan disajikan lewat `/gambar/:id`, bukan hotlink. Hanya PNG, JPEG, WebP, maksimal 512 KB (KPV §5).
3. Logo tampil sebagai penunjuk identitas dalam daftar fakta, bukan sebagai pernyataan dukungan. Teks pendamping tidak boleh menyiratkan entitas "direkomendasikan" atau "disertifikasi" METI kecuali memang benar dan bersumber.
4. Entitas boleh meminta logo dicabut atau diganti: diproses dalam 5 hari kerja.
5. Logo METI, METI Wilayah, METI Institute, dan METI Energi Muda memakai berkas resmi dari Sekretariat; logo tidak boleh ditebak atau digambar ulang (catatan R3 §7).
6. Lencana "Anggota METI" hanya untuk entitas yang dikonfirmasi SEK (KP D13), dan tidak boleh dipasang pada profil non-anggota.
7. Merek "Jaringan METI" dan "METI Network" milik METI; penggunaan oleh pihak lain (misalnya sponsor menaruhnya di materi mereka) butuh izin SJ.

### 2.6 Kebijakan konflik kepentingan dan penyajian

METI adalah asosiasi yang berisi pelaku usaha. Platform ini tidak boleh menjadi alat anggota untuk menaikkan dirinya. Aturan:

| Aturan | Isi |
| --- | --- |
| Tanpa peringkat berbayar | Urutan tampil memakai kriteria tetap yang tertulis di `/metode` (alfabet, nilai fakta, skor keyakinan). Tidak ada peringkat, posisi, atau penyorotan yang bisa dibeli atau diminta |
| Anggota tidak diuntungkan | Status anggota atau paket tidak memengaruhi skor, urutan, atau kuadran. Lencana "Anggota METI" hanya penanda status |
| Sponsor tidak mengubah isi | Sponsor platform tidak mendapat hak edit, hak melihat draf, atau hak atas halaman yang membahas dirinya. Logo sponsor di satu area terpisah, berlabel "Didukung oleh" |
| Pengungkapan | Bila pengurus METI bekerja di entitas yang diprofilkan (contoh pimpinan METI yang juga direksi perusahaan), profil memuat baris "Terkait METI: <jabatan>, sumber" (fakta publik, bukan tuduhan) |
| Pengurus tidak menyunting profilnya sendiri | Kurator yang punya hubungan kerja atau saham dengan entitas wajib menyatakan di Log dan tidak mengubah atau menyetujui profil itu |
| Skor dan kuadran | Ditetapkan dari kriteria tertulis, diberi pil "Hipotesis" (KP C-16), hak jawab 7 hari kerja, dan tidak dihitung oleh orang yang terkait entitas yang dinilai |
| Sorotan yang adil | Beranda dan cerita data memilih entitas lewat aturan berputar atau kriteria data, bukan atas permintaan |
| Perbandingan antar pihak | Kalimat membandingkan nama perusahaan (lebih baik, lebih buruk) tidak ditulis di teks kurator; tabel menunjukkan angka, pembaca menyimpulkan |

Larangan teks: antarmuka tidak menyebut METI "netral" (GD §9). Yang boleh dijanjikan: aturan penyajian tertulis, sumber terbuka, dan hak koreksi. Alasannya: METI adalah asosiasi yang mewakili pelaku usaha, jadi klaim netral mudah dipatahkan dan tidak diperlukan.

### 2.7 Disclaimer

Teks ringkas yang tampil di kaki tiap halaman dan lengkap di `/metode` (isi disusun ulang oleh penasihat hukum):

- Informasi berasal dari sumber publik yang disebut pada tiap butir, per tanggal yang tertera. Bisa berubah.
- Bukan nasihat investasi, hukum, atau teknis. Tidak ada jaminan kelengkapan.
- Keberadaan sebuah entitas bukan dukungan atau sertifikasi METI.
- Angka berlabel `EST` adalah perkiraan; skor dan kuadran adalah hipotesis dengan cara hitung terbuka.
- Untuk koreksi atau permintaan hapus, hubungi alamat privasi yang tertera.
- Status Draf kerja: selama belum rilis resmi, tampil pita "Draf kerja, sumber publik saja" (JM-E01).

### 2.8 Syarat Penggunaan dan Kebijakan Privasi (kerangka isi)

Keduanya WAJIB ditinjau penasihat hukum METI (KPV §3, R6 §5). Berikut kerangka, bukan teks final.

**Kebijakan Privasi.**

| Bagian | Isi |
| --- | --- |
| 1 Pengendali data | Nama badan hukum METI (perkumpulan), alamat, kontak surel privasi, petugas pelindungan data bila ditunjuk (KPV KP-2) |
| 2 Data yang diproses | Sesuai KPV §3.1: data umum profesional, kontak (lapis Pengurus), data akun, data operasional; dilarang: agama, status kawin, tanggal lahir, alamat rumah, NIK, biometrik |
| 3 Dasar dan tujuan | Per jenis rekaman (KPV §3.2); tujuan: direktori ekosistem EBT dan kerja sama anggota |
| 4 Sumber data | Sumber publik resmi, publikasi terbuka, data yang diserahkan sendiri |
| 5 Pihak yang menerima | Penyedia infrastruktur (Cloudflare), tanpa analitik atau iklan pihak ketiga; tanpa penjualan data |
| 6 Masa simpan | Tabel KPV §3.4 |
| 7 Hak subjek data | Daftar hak dan cara menggunakan (KPV §3.3) dan SLA 14 hari kerja |
| 8 Keamanan dan insiden | Ringkas; pemberitahuan 3 x 24 jam (Pasal 46) |
| 9 Cookie | Hanya cookie sesi masuk; tanpa analitik atau iklan; huruf dihosting sendiri |
| 10 Transfer luar negeri | Pernyataan lokasi penyimpanan (Cloudflare, regional) dan dasar hukumnya (perlu tinjauan) |
| 11 Anak | Tidak memproses data anak |
| 12 Perubahan | Versi, tanggal berlaku, riwayat perubahan |

**Syarat Penggunaan.**

| Bagian | Isi |
| --- | --- |
| 1 Penerimaan dan umur | Penggunaan berarti menerima; pengguna minimal 18 tahun untuk akun |
| 2 Lingkup layanan | Direktori dan sensus informasi; bukan transaksi, bukan nasihat |
| 3 Akun | Dibuat Admin; jaga kerahasiaan sandi; dilarang berbagi akun; METI boleh menonaktifkan akun yang melanggar |
| 4 Penggunaan yang dilarang | Pemanenan massal kontak, menyalin data untuk spam atau penawaran massal, menyamar entitas, mengunggah data pribadi pihak lain tanpa dasar, mengganggu layanan |
| 5 Konten dan lisensi | Lisensi data keluaran (§2.9); kekayaan intelektual kode, desain, dan merek tetap milik METI atau pemiliknya |
| 6 Sumber pihak ketiga | Data bersumber tunduk pada lisensi sumbernya |
| 7 Penafian dan batas tanggung jawab | Seperti §2.7, batas ganti rugi sesuai hukum |
| 8 Koreksi dan hapus | Tautan ke prosedur §2.3 dan §2.4 |
| 9 Perubahan dan penghentian | Hak METI mengubah atau menghentikan layanan dengan pemberitahuan |
| 10 Hukum yang berlaku | Hukum Indonesia; forum sengketa dipilih penasihat hukum |

Keduanya tersedia dalam ID dan EN; versi ID mengikat (usul), dan tiap versi diberi nomor serta tanggal.

### 2.9 Lisensi data keluaran

| Hal | Usulan | Catatan kompatibilitas |
| --- | --- | --- |
| Potret publik (entitas, fakta, ikatan bersumber) | CC BY 4.0, atribusi "Jaringan METI (METI), per <tanggal>" dengan tautan | Fakta mentah dari sumber primer tidak dilindungi hak cipta sendiri; yang dilisensikan adalah susunan, teks kurator, dan skor buatan METI |
| Data turunan dari OpenStreetMap (pembangkit) | Tunduk ODbL: atribusi "OpenStreetMap contributors" dan berbagi-serupa pada basis data turunan. Bila potret OSM dipisah sebagai lapis sendiri, lapis itu dilisensikan ODbL, sisanya CC BY | Mencampur ODbL ke dalam CC BY 4.0 satu berkas menimbulkan sengketa lisensi. Pisahkan berkas atau terbitkan bagian OSM berlisensi ODbL. WAJIB tinjau hukum `[V]` |
| GEM (CC BY-NC-SA) | Tidak disalin ke potret; hanya tautan dan angka ringkasan yang dikutip dengan atribusi bila diizinkan | NC bertentangan dengan lisensi terbuka CC BY dan dengan rencana dana sponsor. Bila ingin memakai langsung, minta izin GEM |
| OpenCorporates (ODbL) | Ringkas dan tautkan, bukan reproduksi | R6 §5.3 |
| OpenAlex (CC0) | Boleh; atribusi sebagai tata krama | Metadata publikasi |
| IRENA, Ember, World Bank dan sejenis | Ikuti lisensi masing-masing; atribusi pada tiap butir | Simpan jenis lisensi di kolom sumber |
| Teks kurator dan cerita data | CC BY 4.0 | Hak cipta pada METI, bukan pada kurator perorangan (perjanjian kerja atau surat tugas menyatakan) |
| Kode | Pilihan terpisah (C-31): tertutup atau lisensi permisif seperti MIT | Repo asal publik; keputusan lisensi kode bukan bagian lisensi data |
| Data pribadi | Tidak dilisensikan; tidak ada dalam potret publik | KPV §3.1 |
| Data 1001startup.id | Tidak diteruskan; hanya fakta primer yang diperoleh dari sumber primer | KP D15 |

Satu berkas `LISENSI-DATA.md` (di repo situs, bukan data) mencatat tiap lapis data dan lisensinya; gerbang menolak potret publik yang memuat kolom sumber berlisensi NC.

### 2.10 Cara mengutip

Meniru 1001startup.id (R9 §8) dengan kalimat buatan METI:

- Tiap halaman dan profil punya baris "Kutip sebagai": `Jaringan METI (Masyarakat Energi Terbarukan Indonesia), "<judul halaman>", per <tanggal beku>, <URL>.`
- Tanggal beku = tanggal potret terakhir yang menjadi dasar angka. Tiap angka dalam kutipan memakai tanggal itu.
- Contoh kalimat: "Menurut Jaringan METI (per 15 Januari 2027), sensus mencatat N entitas EBT di M provinsi."
- Angka berlabel `EST` dikutip dengan labelnya; skor dan kuadran dikutip dengan kata "hipotesis".
- Untuk laporan resmi atau media, pengutipan bebas dengan atribusi dan tautan (CC BY 4.0).
- Tersedia tombol salin kutipan (BibTeX opsional di F3).

---

## 3. Model keanggotaan dan nilai

### 3.1 Nilai bagi tiap kelompok

| Kelompok | Yang didapat | Yang bukan |
| --- | --- | --- |
| Publik | Sensus entitas, profil bersumber, peta, rantai pasok, pembiaya, rapor provinsi, regulasi, cerita data, metode terbuka; nama, jabatan publik, afiliasi orang | Kontak orang, riwayat dengan METI, daftar pendek, ekspor massal |
| Anggota METI (akun) | Semua milik publik, ditambah `/direktori` delapan tab, daftar pendek, ekspor Excel/Word/PDF, kontak yang pemiliknya setujui tampil untuk anggota (PRD §2) | Kontak lapis Pengurus |
| Pengurus dan Sekretariat | Kontak lapis Pengurus, riwayat dengan METI, agenda dan pelantikan MW, antrean koreksi | |
| Mitra (penyedia dana, sponsor, mitra program) | Profil mitra, halaman "Didukung oleh", laporan angka tahunan platform | Hak mengubah isi, melihat draf, atau menaikkan peringkat |

Prinsip dari R6 butir 3: data dasar tidak diberi paywall; nilai anggota ada pada kontak, direktori, daftar pendek, dan acara, bukan pada menyembunyikan sensus.

### 3.2 Paket membership METI dan usulan manfaat direktori

Paket dari tarif resmi 1 Juli 2026 (R4 §3). Usulan di sebelah kanan adalah manfaat tambahan dari platform; semuanya perlu persetujuan PH karena menyentuh paket resmi (C-24).

| Paket | Iuran awal | Iuran tahunan | Perwakilan | Usulan manfaat direktori |
| --- | --- | --- | --- | --- |
| Pelajar | Rp 100.000 | Rp 200.000 | 1 | Akun Anggota dengan tab `/direktori` baca; daftar pendek maks 10 entri; ekspor PDF |
| Individu | Rp 450.000 | Rp 350.000 | 1 | Seperti Pelajar; daftar pendek maks 30; profil pakar sendiri bila persetujuan diberikan |
| Organisasi NGO (Rekomendasi) | Rp 1.600.000 | Rp 600.000 | 2 | Profil organisasi dengan logo dan lencana "Anggota METI" (selaras janji tayang logo), 2 akun, daftar pendek maks 50 |
| Perusahaan Skala Kecil | Rp 25.000.000 | Rp 2.000.000 | 5 | Profil perusahaan berlencana, 5 akun, pembaruan profil sendiri lewat klaim (F3), daftar pendek maks 100, prioritas tinjau koreksi 5 hari kerja |
| Perusahaan Skala Besar | Rp 50.000.000 | Rp 2.500.000 | 5 | Seperti Kecil; tambahan: ekspor data entitas sendiri, laporan dampak profil (kunjungan, ditautkan dari mana, diagregasi) |
| Utama (Charter Member) | Rp 175.000.000 | Rp 5.000.000 | 20 | Seperti Besar; 20 akun; nama di halaman "Anggota Utama"; satu sesi pelatihan profil bersama kurator; masukan roadmap platform |

Pagar bagi semua paket:

1. Tidak ada manfaat yang menyentuh peringkat, skor, urutan, atau isi halaman pihak lain (§2.6).
2. Tidak ada paywall pada sensus dan profil publik (KP D6, PRD §1.4).
3. Hak koreksi dan hapus sama untuk semua, termasuk non-anggota.
4. Persetujuan tayang profil entitas anggota diminta lewat formulir tertulis; paket NGO dan perusahaan sudah menjanjikan tayang logo, tetapi data selain logo dan nama butuh persetujuan (KP C-10).
5. Jumlah akun mengikuti angka "Perwakilan" pada paket; menambah akun di luar angka itu diputus SJ.

### 3.3 Peluang pendanaan platform

| Sumber | Bentuk | Kecocokan | Risiko konflik | Pengamanan |
| --- | --- | --- | --- | --- |
| Hibah lembaga pembangunan (misalnya GIZ lewat ENTRI atau program DRE, mitra METI di R3 §3.7) | Hibah proyek atau jasa konsultan | Tinggi: mandat "direktori kontributor" di materi GIZ 6 Nov 2026 | Pendana mengarahkan isi; hak data; pelaporan | Perjanjian tertulis: isi tetap dikendalikan METI, hak data milik METI, lisensi terbuka |
| Donor filantropi iklim dan energi | Hibah | Sedang | Syarat tematik sempit | Hanya terima yang tidak mengubah §2.6 |
| Sponsor korporat (BUMN energi, swasta) | Dana tahunan dengan label "Didukung oleh" | Sedang | Tinggi: sponsor adalah entitas yang diprofilkan | Tiering tetap, tidak ada hak edit atau draf, sponsor dikecualikan dari peninjauan kuadran yang menilainya, nilai sponsor dipublikasikan di halaman Pendukung |
| Layanan data kustom (laporan pasar, peta pemain, bahan kajian untuk anggota dan pemerintah) | Jasa berbayar dari potret publik dan analisis MI | Sedang sampai tinggi | Sedang: data sama dijual ke satu pihak | Data dasar tetap terbuka; yang dijual hanya analisis kustom dan waktu kerja, bukan data eksklusif |
| Sumbangan keanggotaan (bagian iuran) | Alokasi bagian iuran untuk pemeliharaan platform | Tinggi | Rendah | Keputusan PH; tanpa mengubah paket |
| Iklan | Tidak dipakai | | Merusak penyajian yang adil | Tidak dibuat |

Prinsip: pendanaan dicatat terbuka (siapa, berapa, untuk apa) di halaman Pendukung. Penolakan dana yang menuntut hak atas isi adalah keputusan wajar, bukan kegagalan.

---

## 4. SDM dan peran harian

### 4.1 Peran dan beban perkiraan

Beban setelah F1 (kondisi mantap). Angka adalah perkiraan perancang; perlu diuji dua bulan pertama dan diperbarui. Kolom "Fase bangun" untuk F0 sampai F1.

| Peran | Tugas | Jam per minggu, mantap | Fase bangun (F0 sampai F1) | Asal orang (usulan) |
| --- | --- | --- | --- | --- |
| Pemilik produk | Memutus, menyetujui rilis, menghubungi PH | 2 sampai 3 | 3 sampai 4 | SJ atau wakilnya |
| Kurator utama | Tambah dan periksa entitas, fakta, ikatan; memutus koreksi kelas A | 8 sampai 12 | 15 sampai 20 | BIM |
| Kurator pendamping | Gantian kurator utama, koreksi, pemeriksaan sampel | 4 sampai 6 | 8 | BIM atau MI |
| Peninjau angka | Memeriksa angka turunan, skor, kuadran, cerita data | 4 sampai 6 | 8 | MI |
| Admin akun | Membuat dan menonaktifkan akun, tautan aktivasi, permintaan reset | 1 sampai 2 | 2 | SEK |
| Penanganan privasi | Antrean hak subjek data dan hapus | 1 sampai 2 | 1 | SEK dan BIM |
| Penerjemah dan peninjau EN | Menerjemahkan dan meninjau teks kelas B dan C, kunci antarmuka | 3 sampai 4 | 6 | Anggota METI Energi Muda atau relawan; peninjau penutur |
| Komunikasi | Siaran pers, LinkedIn, Instagram, cerita data | 2 sampai 3 | 4 | BIM |
| Pengembang | Perawatan, perbaikan galat, pipeline panen, migrasi, deploy | 6 sampai 10 (perawatan) | penuh waktu menurut tiket | Tim pengembang |
| Koordinator METI Wilayah | Menjaga data dan agenda MW lewat peran `wilayah` | 1 per MW aktif | | Ketua MW atau staf yang ditunjuk |
| Penasihat hukum (tinjauan) | Tinjau kebijakan, kasus sengketa | sesuai kasus; paket awal 8 sampai 16 jam total | | Penasihat METI |

Total mantap kira-kira 30 sampai 45 jam per minggu lintas orang (di luar pengembang), atau setara 1 sampai 1,5 orang penuh waktu bila tidak dipecah. Jumlah ini ukuran kasar; kalau METI tidak bisa menyediakan, kurangi cakupan sensus (misalnya batasi F1 pada 300 entitas), bukan mutu sumber.

### 4.2 Pelatihan kurator

| Sesi | Isi | Lama |
| --- | --- | --- |
| 1 | Latar: tujuan platform, tiga kelas data, apa yang dilarang (data pribadi, salin teks) | 1,5 jam |
| 2 | Cara mencari sumber primer, membaca RUPTL, laporan tahunan, JDIH; membedakan tingkat bukti | 2 jam |
| 3 | Praktik di `/admin` Kurasi: menambah entitas, fakta, ikatan, sumber (tanggal periksa, tingkat bukti); label `EST` | 2 jam |
| 4 | Koreksi dan hak jawab; surel dan kalimat jawaban; UU PDP praktis | 1,5 jam |
| 5 | Latihan 10 entitas dengan dua mata (pengusul dan penyetuju), lalu umpan balik | 2 jam |
| Ujian kecil | Memasukkan 5 entitas contoh; diterima bila 0 fakta tanpa sumber dan 0 data pribadi | |

Kurator baru bekerja didampingi dua minggu pertama dan setiap perubahannya disetujui orang kedua.

### 4.3 Panduan kurator (ringkas)

1. Mulai dari sumber, bukan dari nama. Tanpa sumber primer atau sekunder terpercaya, jangan buat fakta.
2. Tulis ulang "apa yang dilakukan" dengan kalimat sendiri; jangan salin dari situs entitas, siaran pers, atau 1001startup.id.
3. Isi tanggal periksa hari ini dan tingkat bukti jujur. Tanda "tidak ada angka" lebih baik daripada tebakan.
4. Orang hanya nama, jabatan, afiliasi, dari sumber resmi. Tanpa kontak pribadi, alamat rumah, tanggal lahir, foto.
5. Bila dua sumber berbeda, simpan keduanya sebagai rentang dengan label sumber.
6. Entitas terkait METI diberi baris "Terkait METI" dengan sumber; jangan menyunting profil sendiri atau tempat kerja sendiri.
7. Jangan menulis kata sifat penilai ("terbaik", "unggul", "netral"). Tulis angka dan sumber.
8. Cek `daftar-tolak` melalui tombol periksa sebelum menyimpan rekaman orang.
9. Ragu kelas data? Anggap kelas C dan minta persetujuan.
10. Satu pekerjaan satu catatan di Log; ada keraguan, tulis di Log Keputusan dan tanyakan.

---

## 5. Anggaran

Semua angka perkiraan perancang pada 7 Nov 2026. Tanda `[V]` berarti harga harus diverifikasi ke halaman resmi sebelum dianggarkan. Kurs asumsi Rp 16.500 per USD (bukan kurs resmi; sesuaikan).

### 5.1 Cloudflare

| Layanan | Free | Berbayar | Catatan |
| --- | --- | --- | --- |
| Workers | 100.000 permintaan per hari, CPU 10 ms, 5 cron (R6 §4.1) | Paket Workers Paid kira-kira USD 5 per bulan dengan kuota sertaan besar, CPU jauh lebih longgar `[V]` | R6 merekomendasikan Free untuk purwarupa, pindah Paid sebelum rilis publik |
| D1 | 5 juta baris dibaca per hari, 100.000 ditulis per hari, 5 GB total | Pada paket Paid: kuota sertaan besar; kelebihan dibayar per juta baris dibaca dan ditulis serta per GB simpan `[V]` | Pelajaran direktori lama: satu pindaian tabel menghabiskan kuota Free. Layar membaca potret R2 untuk menjaga baca D1 rendah |
| R2 | 10 GB-bulan, 1 juta operasi Kelas A, 10 juta Kelas B per bulan, tanpa biaya egress | Kelebihan penyimpanan dan operasi dibayar per pemakaian `[V]` | Potret JSON dan logo kecil; kebutuhan awal jauh di bawah 10 GB |
| Workers AI | Kuota harian gratis terbatas `[V]` | Bayar per pemakaian | Hanya ringkasan abstrak riset (KP C-18); atur batas pengeluaran (KPV §9) |
| Turnstile | Gratis | | Untuk formulir publik F3 |
| Cloudflare Access (Zero Trust) | Gratis untuk tim di bawah 50 pengguna (R6) `[V]` | | Tidak dipakai di rencana ini; sesi sendiri dipakai (KP D8) |
| DNS dan sertifikat | Gratis | | Bila domain di Cloudflare |

### 5.2 Biaya lain

| Item | Perkiraan | Catatan |
| --- | --- | --- |
| Domain | Subdomain METI: nol. Domain baru `.id` atau `.or.id`: kira-kira Rp 200.000 sampai Rp 500.000 per tahun `[V]` | Domain `.or.id` butuh persyaratan organisasi; pakai subdomain `jaringan.metiires.or.id` bila boleh (C-02) |
| Surel transaksional (aktivasi, reset) | Penyedia seperti Resend atau Brevo punya tingkat gratis (ratusan sampai ribuan surel per bulan); berbayar mulai kira-kira USD 15 sampai 25 per bulan `[V]` | Bawaan KP C-08 masih tautan manual; surel otomatis menunggu keputusan |
| Kunci API | OpenAlex memerlukan kunci dan surel resmi METI `[V]` (gratis pada rencana dasar saat riset ditulis); Ember dan OWID tanpa biaya | Simpan di secret, bukan repo |
| Workers AI | Perkiraan di bawah USD 5 per bulan pada pemakaian ringan `[V]` | Batas pengeluaran dipasang |
| Pencadangan | Ekspor D1 ke R2 privat; biaya masuk R2 | KPV §9 |
| Tinjauan hukum | Honor penasihat hukum satu kali untuk Kebijakan Privasi, Syarat, lisensi, dan perjanjian sponsor: perkiraan Rp 10.000.000 sampai Rp 25.000.000 | Angka kasar; minta penawaran |
| Desain tambahan, foto, ikon | Dalam batas Design System; lisensi ikon dan huruf terbuka | Tidak ada biaya bila pakai berkas bawaan |
| Acara peluncuran | Mengikuti acara METI yang sudah ada (§6); biaya tidak ditambahkan di sini | |
| Materi cetak atau videografi | Opsional, tidak dihitung | |

### 5.3 Perkiraan bulan 1 sampai 12 (tanpa SDM berbayar)

Bulan 1 adalah bulan mulai F0 (usul November 2026). Satuan USD kecuali tertulis Rp. Perkiraan tertinggi per baris dipakai supaya anggaran tidak kurang; `[V]` pada baris yang harus diperiksa.

| Bulan | Fase | Cloudflare | Domain dan surel | Workers AI dan kunci | Hukum | Total USD (perkiraan) | Catatan |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | F0 | 0 (Free) | 0 | 0 | 0 | 0 | Akun milik pengembang dulu (C-06) |
| 2 | F0 | 0 (Free) | 0 | 0 | 0 | 0 | |
| 3 | F0 sampai F1 | 5 `[V]` | 0 | 0 | 0 | 5 | Pindah Paid bila kuota D1 mendekati batas |
| 4 | F1 | 5 `[V]` | 0 sampai 3 | 0 sampai 2 | 0 | 5 sampai 10 | Panen gelombang 1 |
| 5 | F1 | 5 `[V]` | 0 sampai 3 | 0 sampai 2 | 0 | 5 sampai 10 | |
| 6 | F1 | 5 sampai 8 `[V]` | 0 sampai 3 | 0 sampai 3 | Rp 10.000.000 sampai Rp 25.000.000 (sekali) | 5 sampai 15 + hukum | Tinjauan hukum sebelum uji tertutup |
| 7 | F2 | 5 sampai 8 `[V]` | 1 sampai 3 | 0 sampai 3 | 0 | 6 sampai 14 | |
| 8 | F2 | 5 sampai 8 `[V]` | 1 sampai 3 | 0 sampai 3 | 0 | 6 sampai 14 | |
| 9 | F2 | 5 sampai 10 `[V]` | 1 sampai 25 (surel) | 0 sampai 5 | 0 | 6 sampai 40 | Peluncuran lunak |
| 10 | F2 sampai F3 | 5 sampai 10 `[V]` | 1 sampai 25 | 0 sampai 5 | 0 | 6 sampai 40 | |
| 11 | F3 | 5 sampai 12 `[V]` | 1 sampai 25 | 0 sampai 5 | 0 | 6 sampai 42 | |
| 12 | F3 | 5 sampai 12 `[V]` | 1 sampai 25 | 0 sampai 5 | 0 | 6 sampai 42 | |

Jumlah tahun pertama di luar hukum dan SDM: kira-kira USD 50 sampai USD 220 (sekitar Rp 0,8 juta sampai Rp 3,6 juta pada kurs asumsi). Ditambah tinjauan hukum satu kali Rp 10 sampai 25 juta. Angka paling besar bergantung pada tiga keputusan: surel otomatis atau manual (C-08), domain baru atau subdomain (C-02), dan pindah ke paket Paid sebelum atau sesudah rilis publik.

### 5.4 Biaya SDM bila ada

Rencana dasar mengandalkan SDM METI (BIM, MI, SEK) tanpa biaya tambahan. Bila METI ingin membayar, ada tiga skenario kasar; tarif adalah asumsi `[V]` yang harus diganti dengan standar METI.

| Skenario | Siapa | Beban | Perkiraan biaya per bulan |
| --- | --- | --- | --- |
| A, relawan dan staf METI | BIM, MI, SEK, Energi Muda | 30 sampai 45 jam per minggu lintas orang | Rp 0 tambahan; biaya peluang |
| B, satu kurator paruh waktu berbayar | 1 orang, 20 jam per minggu | Menggantikan sebagian tugas BIM | Rp 6.000.000 sampai Rp 10.000.000 |
| C, kurator penuh waktu dan paruh waktu peninjau | 1 penuh waktu, 1 paruh | Mantap tanpa bergantung relawan | Rp 15.000.000 sampai Rp 25.000.000 |

Pengembang: pada paket ini pengembang disediakan oleh tim; biaya perawatan lanjutan (6 sampai 10 jam per minggu) perlu dianggarkan atau dibiayai hibah (§3.3).

### 5.5 Pengendalian biaya

1. Batas pengeluaran (hard cap) di dasbor Cloudflare untuk Workers AI dan layanan berbayar lain (KPV §9).
2. Peringatan kuota D1 dan Workers pada 70 persen; pemilik produk menerima laporan bulanan angka kuota.
3. Pembayaran lewat kartu atau rekening METI, bukan pribadi (§8).
4. Tinjauan biaya tiap triwulan oleh SEK dan pemilik produk.

---

## 6. Rencana peluncuran

### 6.1 Tahapan

| Tahap | Isi | Siapa | Kapan (usulan) |
| --- | --- | --- | --- |
| T0 Purwarupa internal | F0 jalan di `*.workers.dev`, data contoh; `/direktori` tampil 1280 dan 390 px | Tim, pemilik produk | Minggu 1 sampai 5 |
| T1 Uji tertutup Pengurus | 8 sampai 12 penguji dari PH, BIM, MI, MW; data nyata kelas A saja; kebijakan versi draf | Pemilik produk memilih penguji | Minggu 14 sampai 17 |
| T2 Peluncuran lunak anggota | Akun untuk anggota terpilih (misalnya 50 sampai 100 anggota lebih dulu: pengurus, MW, mitra, Energi Muda, anggota Utama); formulir persetujuan tayang | SEK mengundang; PH menyetujui | Minggu 20 sampai 24 |
| T3 Peluncuran publik | Sensus publik, siaran pers, LinkedIn dan Instagram; peluncuran terbuka | Ketua Umum atas rekomendasi PH | Minggu 25 sampai 28, disesuaikan momen |
| T4 Perluasan (F3) | Klaim profil, daftar mandiri, API terbuka | PH | Minggu 29 ke atas |

### 6.2 Momen peluncuran

| Momen | Pertimbangan | Status |
| --- | --- | --- |
| IndoEBTKE ConEx berikutnya (ke-12 sudah berlangsung 2 sampai 4 Sep 2026 di JIEXPO) | Pangung terbesar tahunan METI; konsep "peluncuran penuh" dengan stand dan demo. Jadwal edisi berikutnya belum diketahui; kemungkinan paruh kedua 2027 | Tanggal harus dikonfirmasi ke panitia |
| Munas METI | Tiap 3 tahun; pengurus 2026 sampai 2028, jadi Munas berikutnya sekitar 2028 | Terlalu jauh untuk peluncuran pertama; cocok untuk laporan capaian |
| Pelantikan METI Wilayah | Ada 6 diresmikan, 4 menyusul, banyak lain direncanakan (R3 §1.5); format rundown 4 jam 15 menit | Dipakai untuk peluncuran lunak regional dan pelatihan MW; tiap pelantikan memuat demo rapor provinsi |
| Rapat Pengurus | Momen persetujuan PH | T2 |
| Forum atau seminar mitra (GIZ, ENTRI, DRE) | Mandat "direktori kontributor" (R3 §7) | Untuk memperkenalkan fungsi direktori ke mitra |
| COP31 (9 sampai 20 Nov 2026) | Terlalu dekat untuk peluncuran; boleh jadi bahan paparan "sedang disiapkan" | Hanya sebut bila diizinkan pimpinan |

Usulan: T3 dijalankan sebagai peluncuran lunak publik pada pelantikan METI Wilayah atau pertemuan PH terdekat setelah kriteria F1 terpenuhi, dan peluncuran penuh bersama stand di IndoEBTKE ConEx berikutnya. Jadi publik tidak menunggu panggung terbesar, tetapi panggung terbesar tetap dipakai.

### 6.3 Komunikasi

| Saluran | Isi | Kapan | Pemilik |
| --- | --- | --- | --- |
| Siaran pers | Apa, siapa, kenapa penting; satu angka kunci bersumber; kutipan Ketua Umum; cara mengutip | T3 | BIM |
| LinkedIn METI | Seri 4 sampai 6 pos: "Kenapa direktori", "Satu pertanyaan, satu jawaban", cerita data, peta, cara koreksi, terima kasih | Dua minggu sebelum sampai sesudah T3 | BIM |
| Instagram METI | Kartu angka dan peta singkat; tautan di bio | Sama | BIM |
| Surel atau grup anggota | Undangan akun (T2); manual lewat SEK (tanpa kiriman otomatis, KPV §3.6) | T2 | SEK |
| Situs metiires.or.id | Berita peluncuran dan tautan menu (§9) | T3 | BIM dan pengelola situs |
| Mitra | Surat pengantar singkat ke GIZ, kementerian, mitra pendana | T3 | SJ |
| Pakar dan tokoh yang tampil | Pemberitahuan bahwa nama dan jabatan publik mereka tampil beserta tombol koreksi, dikirim manual sebelum T3 | Sebelum T3 | SEK |

Pesan baku: "Jaringan METI adalah direktori terbuka ekosistem energi terbarukan Indonesia, tiap angka bersumber dan bertanggal, bisa dikoreksi." Hindari kata "netral", "terlengkap", dan "satu-satunya" (tak terverifikasi).

### 6.4 Ukuran sukses dan kriteria lanjut atau berhenti

| Tahap | Ukuran sukses | Lanjut bila | Berhenti atau tunda bila |
| --- | --- | --- | --- |
| T0 | Uji RLS hijau; tombol dummy jalan; i18n kerangka; tidak ada data pribadi di repo | Gerbang F0 hijau (GD §7) | Gerbang gagal dua kali berturut-turut tanpa penyebab jelas; kembalikan ke perencanaan |
| T1 | 8 dari 10 penguji menyelesaikan tugas "cari entitas, buka profil, ajukan koreksi" tanpa bantuan; 0 galat data pribadi; 0 temuan keamanan tinggi; skor tanggapan penguji 4 dari 5 untuk "bisa dipercaya" | Semua ukuran tercapai dan tinjauan hukum selesai | Ada kebocoran data pribadi atau penolakan PH atas isi; perbaiki, uji ulang |
| T2 | 70 persen akun yang diundang masuk dalam 14 hari; 60 persen anggota memberi persetujuan tayang saat diminta; 0 insiden data; median waktu koreksi di bawah 5 hari kerja | Tercapai | Penolakan anggota besar (lebih dari 30 persen minta keluar); tunda dan perbaiki kebijakan |
| T3 | U1 sampai U8 (GD §8) tercapai; 300+ entitas bersumber; 0 fakta tanpa sumber; 1.000+ ikatan; kunjungan publik dan kutipan media pertama dalam 30 hari; koreksi masuk dan diproses sesuai SLA | Tercapai dan PH menyetujui F3 | Lebih dari 3 koreksi faktual serius dalam 30 hari tanpa tanggapan cepat; bekukan sensus dan audit kurasi |
| T4 | Klaim profil jalan; daftar mandiri tanpa spam; API terbuka tidak melampaui kuota | Disetujui PH (KP C-01) | Penyalahgunaan terdeteksi (pemanenan, spam) |

### 6.5 Checklist siap rilis publik

1. Persetujuan tertulis PH dan Ketua Umum (§1.4).
2. Kebijakan Privasi dan Syarat Penggunaan versi 1 ditinjau penasihat hukum dan ditayangkan (ID dan EN).
3. Surel privasi aktif dan antrean hak subjek data bekerja; SLA diuji.
4. `daftar-tolak` terisi dan uji lulus (KP D14).
5. Uji pemulihan cadangan dijalankan (KPV §9).
6. Domain dan akun Cloudflare milik METI (§8); paket Workers Paid aktif bila perlu.
7. Halaman `/metode` lengkap; setiap halaman publik punya Jawaban singkat, Cara menghitung, Cara mengutip.
8. Terjemahan EN kelas B dan C ditinjau penutur.
9. Tautan silang dengan metiires.or.id siap (§9).
10. Rencana tanggap insiden dan kontak insiden tertulis (KPV §3.7).
11. Pita "Draf kerja" dicabut atau diganti sesuai status resmi (KP C-01).

---

## 7. Daftar risiko

Skala: Peluang dan Dampak = Rendah (R), Sedang (S), Tinggi (T). Pemilik = peran yang menanggung mitigasi.

| Kode | Risiko | Peluang | Dampak | Mitigasi | Pemilik |
| --- | --- | --- | --- | --- | --- |
| OP-01 | Pelanggaran UU PDP (profil orang tanpa dasar sah, kegagalan hapus tepat waktu) | S | T | Dua jenis rekaman orang; dasar tercatat; SLA 14 hari kerja; hapus keras diuji; tinjauan hukum sebelum rilis; petugas PDP | SJ |
| OP-02 | Kebocoran data pribadi atau kontak ke lapis Publik | R | T | Potret per lapis; gerbang pindai potret; uji RLS tiap sel; larangan kolom pribadi; pemeriksaan keamanan | DEV |
| OP-03 | Pelanggaran hak cipta atau lisensi data pihak ketiga (GEM NC, ODbL OSM, teks 1001startup) | S | T | `LISENSI-DATA.md`; tolak sumber NC di potret publik; teks ditulis ulang; izin tertulis bila perlu | BIM |
| OP-04 | Angka salah atau berbeda antar halaman, reputasi METI tercoreng | S | T | Sumber dan tanggal wajib; rentang untuk angka berbeda; dua mata; sampel 5 persen tiap triwulan; koreksi cepat | MI |
| OP-05 | Konflik kepentingan: anggota atau sponsor memengaruhi isi, tuduhan bias | S | T | §2.6; sponsor tanpa hak edit; pengungkapan "Terkait METI"; larangan kata "netral" | SJ |
| OP-06 | Data usang (jabatan, status MW, kapasitas) | T | S | Label "Per <tanggal>"; batas umur per jenis; laporan bulanan fakta usang; tombol koreksi | BIM |
| OP-07 | Kuota Cloudflare habis (D1 5 juta baca per hari, Workers 100.000 permintaan per hari) | S | T | Layar membaca potret R2; kueri berindeks; peringatan 70 persen; pindah Paid sebelum rilis publik | DEV |
| OP-08 | Ketergantungan pada satu orang (pengembang atau kurator tunggal) | T | T | Dokumentasi serah terima; dua kurator; akun milik METI; rencana §8 | SJ |
| OP-09 | Penolakan atau ketidakpedulian Pengurus; mandat tidak jelas | S | T | Uji tertutup Pengurus; pemilik produk resmi; keputusan PH tertulis (C-01); demo nilai singkat | SJ |
| OP-10 | Bentrok dengan situs metiires.or.id yang sudah ada (dua identitas, dua login, dua sumber kebenaran) | S | S | §9: posisi saling melengkapi, tautan silang, API dibaca saja, domain subdomain, satu logo | SJ |
| OP-11 | Terjemahan Inggris salah atau menyesatkan | S | S | Status "perlu tinjau"; glosarium; peninjau penutur untuk kelas B dan C | BIM |
| OP-12 | Pengambilalihan akun (sandi lemah, tautan aktivasi bocor) | S | T | PBKDF2; batas laju; tautan 72 jam sekali pakai; TOTP di F3; nonaktif mencabut sesi | DEV |
| OP-13 | Penyalahgunaan kontak (pemanenan, spam anggota) | S | T | Kontak hanya lapis Pengurus; tanpa ekspor massal; batas laju; syarat penggunaan melarang | DEV |
| OP-14 | Reputasi: kesalahan penyajian entitas besar (BUMN) viral | R | T | Hak jawab 7 hari kerja; skor berlabel hipotesis; koreksi cepat; juru bicara BIM | SJ |
| OP-15 | Klaim palsu atau peniruan entitas | R | S | Klaim hanya lewat surel domain entitas dan persetujuan kurator (F3); sebelum itu tidak ada klaim | BIM |
| OP-16 | Panen melanggar robots.txt atau syarat situs lain, atau disomasi | R | T | Baca robots per host; jeda 2 detik; tanpa panen 1001startup.id kecuali izin; izin tertulis; log panen | DEV |
| OP-17 | Kelelahan kurator, antrean menumpuk, kurasi berhenti | T | S | Beban terukur; pelatihan; kurator pendamping; batasi cakupan; laporan bulanan | SJ |
| OP-18 | Sponsor atau donor menuntut hak atas isi | S | S | Perjanjian tertulis; tolak dana bersyarat; transparansi pendukung | SJ |
| OP-19 | Kegagalan infrastruktur (D1 hilang, penghapusan tak sengaja, akun diretas) | R | T | Ekspor D1 berkala ke R2 privat; uji pemulihan; 2FA akun Cloudflare; peran akun dibatasi | DEV |
| OP-20 | Scope creep: permintaan fitur baru terus datang (iuran, forum, notifikasi) | T | S | Aturan berhenti KP; non-tujuan PRD §1.4; keputusan pemilik produk tertulis | Pemilik produk |
| OP-21 | Kesalahan kebijakan hapus: data entitas yang sah terhapus karena permintaan pihak tak berhak | S | S | Verifikasi surel resmi atau surat kuasa; keputusan tertulis SJ; daftar tolak | SEK |
| OP-22 | Tinjauan hukum terlambat atau lewat; rilis tertunda | S | S | Jadwalkan di minggu 14 sampai 17; paket hukum siap sebelum T1 | SJ |
| OP-23 | Perubahan API atau struktur situs METI memutus sinkron berita | S | R | Cache terakhir; gagal lunak; pemeriksaan skema; kontrak dengan pengelola situs | DEV |
| OP-24 | Kesalahan pengungkapan konflik: pimpinan METI menyunting profil perusahaannya | R | S | Aturan §2.6; jejak admin; pemeriksaan acak | MI |
| OP-25 | Skor atau kuadran dianggap fakta, bukan hipotesis | S | S | Pil "Hipotesis"; "Cara menghitung" terbuka; hak jawab; larangan kata penilai | MI |
| OP-26 | Peraturan pelaksana UU PDP atau Putusan MK mengubah kewajiban (petugas PDP, transfer luar negeri) | S | S | Pantau tiap triwulan; kebijakan versi bernomor; tinjauan hukum berkala | SJ |
| OP-27 | Kehilangan akses karena akun Cloudflare dan domain atas nama pribadi | S | T | §8: akun dan domain atas nama METI; dua pemegang akses | SJ |

---

## 8. Keberlanjutan

### 8.1 Prinsip

Platform hidup lebih lama dari tim pengembangnya. Karena itu, sejak hari pertama: akun milik METI, dokumentasi cukup untuk orang lain mengambil alih, dan rencana jelas bila tim berhenti.

### 8.2 Kepemilikan akun dan kunci

| Aset | Pemilik akhir | Pemegang akses | Catatan |
| --- | --- | --- | --- |
| Akun Cloudflare (Workers, D1, R2, DNS) | METI (atas nama badan hukum, surel organisasi) | Minimal dua orang METI dan satu pengembang | Awal di akun pengembang (C-06); dipindah sebelum rilis publik, paling lambat T2 |
| Domain dan subdomain | METI | SEK | Tidak atas nama pribadi |
| Repo GitHub `timitbnpb/platformmeti` | Dipindah ke organisasi GitHub milik METI sebelum rilis publik | Dua pemilik organisasi, pengembang sebagai kolaborator | Catatan: nama repo saat ini atas nama organisasi pengembang; pemindahan butuh keputusan |
| Kunci (OpenAlex, penyedia surel, token CI) | METI | Disimpan di pengelola kata sandi METI; di Worker lewat `wrangler secret` | Diputar saat orang berganti |
| Pembayaran layanan | Kartu atau rekening METI | SEK dan SJ | Tanpa kartu pribadi |
| Daftar tolak, cadangan D1 | METI (R2 privat) | SA | Tidak di repo |
| Merek, logo | METI | | Berkas resmi dari SEK |
| Lisensi data dan kode | METI | | `LISENSI-DATA.md` |

Aturan: tidak ada aset yang hanya bisa diakses satu orang. Bila ada, itu temuan risiko OP-08 dan dicatat.

### 8.3 Dokumentasi minimum

1. Paket perencanaan ini (dengan KEPUTUSAN, GD, PRD, ALUR, KPV, TIKET, OPERASIONAL).
2. `README` pengelola: cara deploy, cara pulih dari cadangan, cara memutar kunci, cara menambah akun Super Admin.
3. Panduan kurator (§4.3) dan panduan koreksi (§2.3) sebagai halaman internal.
4. Catatan "sepuluh pertanyaan pertama bila ada yang rusak": siapa dihubungi, di mana log, bagaimana membekukan potret.
5. Log Keputusan (§1.6) dan daftar versi kebijakan.
6. Uji (`npm run uji`) yang dapat dijalankan orang baru dalam satu perintah.
7. Dua rekaman layar (10 menit): pengelola akun dan kurator.

### 8.4 Serah terima ke METI

| Langkah | Isi | Waktu |
| --- | --- | --- |
| 1 | Pindah akun Cloudflare dan repo ke METI; ganti surel pemulihan ke surel organisasi | Sebelum T2 |
| 2 | Pelatihan pengelola (Admin dan SA dari SEK) dan kurator | Minggu 10 sampai 20 |
| 3 | Uji "tanpa pengembang": SEK dan BIM membuat akun, memutus koreksi, memulihkan cadangan dalam satu hari | Sebelum T3 |
| 4 | Penyerahan dokumen dan kata sandi lewat pengelola kata sandi METI | Saat T3 |
| 5 | Masa dukungan pengembang: 3 sampai 6 bulan sesudah T3, dengan perjanjian tertulis | T3 sampai T3 + 6 bulan |
| 6 | Tinjauan tahunan: biaya, kuota, kebijakan, risiko | Tiap Januari |

### 8.5 Rencana bila tim berhenti

| Skenario | Tindakan |
| --- | --- |
| Pengembang berhenti mendadak | METI punya akses penuh dan dokumentasi; SEK bisa menjaga akun, cadangan, dan tautan; kurasi berjalan tanpa kode baru; tunjuk pengembang pengganti dari mitra atau Energi Muda |
| Kurator berhenti | Kurator pendamping naik; rekrut dari Energi Muda atau kampus mitra; pelatihan §4.2 |
| Dana habis | Turun ke paket Free; bekukan fitur F2 dan F3; potret publik tetap dilayani dari R2 (biaya sangat rendah) |
| METI memutuskan menghentikan platform | Potret terakhir dibekukan sebagai arsip statis berlabel tanggal; akun dinonaktifkan; data pribadi dihapus sesuai kebijakan; lisensi terbuka potret tetap berlaku; pengumuman tertulis |
| Perubahan pimpinan yang tidak mendukung | Dokumen KP dan Log Keputusan menjadi bahan serah terima; pemilik produk baru ditunjuk; platform tetap dipertahankan minimum |

Prinsip: bentuk yang paling murah untuk dirawat adalah potret JSON statis di R2 di balik Worker kecil. Itu sebabnya arsitektur memilih potret (KP D2); manfaat sampingnya adalah platform bisa "tidur" tanpa mati.

---

## 9. Integrasi dengan situs metiires.or.id

### 9.1 Posisi

Jaringan METI melengkapi situs yang ada, tidak menggantikannya (PRD §1.4). Pembagian:

| | metiires.or.id | Jaringan METI |
| --- | --- | --- |
| Peran | Wajah organisasi: profil, struktur pengurus, berita, acara, membership, kontak (R4) | Direktori dan sensus ekosistem: entitas, orang, proyek, regulasi, peta |
| Akun | Login anggota, membership, event (Nuxt + API Laravel, Turnstile) | Akun sendiri dibuat Admin (KP C-03, D8) |
| Data | Berita, event, paket membership | Entitas, fakta, ikatan, potret |
| Pengelola | Pengelola situs METI | BIM dan SEK dengan DEV |

Catatan teknis (R4): situs sudah punya `/account`, `/admin`, `/admin/membership`, `/events`; ini berarti ada satu alur membership resmi yang tidak boleh ditiru. Direktori tidak menarik iuran dan tidak mengubah status keanggotaan.

### 9.2 Domain

Usulan: `jaringan.metiires.or.id` (subdomain). Alasan: satu merek, kepercayaan pengunjung, sertifikat dan DNS kecil. Sampai disetujui, `*.workers.dev` (KP C-02). Tiap mengganti domain, CSP dan `wrangler.jsonc` berubah (KPV §8).

### 9.3 Tautan silang

| Di mana | Tautan | Kapan |
| --- | --- | --- |
| Menu atas situs METI | "Jaringan" menuju Jaringan METI | T3 |
| Footer situs METI | Satu baris tautan | T3 |
| Halaman kemitraan situs METI | Tautan ke profil anggota dan mitra di direktori (bagi yang menyetujui) | T3 |
| Kepala Jaringan METI | Tombol kembali "metiires.or.id" dan tautan Membership | F0 |
| Profil entitas berlencana "Anggota METI" | Tautan ke halaman membership METI | F1 |
| Halaman kebijakan situs METI | Tautan ke Kebijakan Privasi Jaringan METI | T2 |
| Berita peluncuran | Di situs METI dan dibagikan di platform | T3 |

### 9.4 Satu identitas

1. Logo METI resmi dari Sekretariat; nama "METI" dengan penulisan sama di dua situs.
2. Palet: pengambilan bawaan "Midnight Energy" sesuai template (KP D11, C-05). Situs METI memakai emerald `#059669` (R4 §7); keduanya hijau berdekatan. Bila PH ingin keduanya terasa satu keluarga, ganti token `tema.css` saja (KP C-05). Usulan: biarkan Midnight Energy, tambahkan aksen teal yang berdekatan dengan emerald situs METI.
3. Satu gaya kalimat: bahasa lugas, "kamu" dihindari pada teks resmi, nama organisasi lengkap pada kemunculan pertama.
4. Satu kontak: surel resmi organisasi di situs METI (R4 §3); alamat privasi baru disetujui SJ.
5. Satu daftar anggota "Anggota METI": SEK memberi daftar konfirmasi (nama entitas dan paket, tanpa kontak pribadi) sehingga lencana tampil tanpa menyalin data akun situs.

### 9.5 API berita dan acara

Dari R4 §6, GET publik tanpa kunci:

| Endpoint | Pemakaian | Aturan |
| --- | --- | --- |
| `https://api.metiires.or.id/api/news` | Beranda dan profil: berita terbaru terkait; cerita data memberi tautan | Simpan hanya judul, ringkasan, tanggal, tautan; cache sampai 6 jam; tampilkan "dari metiires.or.id" |
| `https://api.metiires.or.id/api/events` | Agenda publik dan rapor provinsi | Jangan simpan kontak panitia (ada di respons, R4 §6); saring kolom sebelum simpan; tautkan ke halaman acara asli bila ada |
| `https://api.metiires.or.id/api/membership/plans` | Halaman nilai anggota di platform | Hanya baca; label "per <tanggal>"; sumber kebenaran tetap situs METI |

Syarat tata kelola: minta izin tertulis pengelola situs sebelum memakai API (meski publik); catat kontak teknis mereka; gunakan jeda dan cache; bila API berubah, gagal lunak (tampil tautan ke situs METI). Sinkron dijadwalkan di cron yang sudah ada (JM-F10), tanpa menambah jadwal (batas 5).

Catatan nuansa: sitemap situs METI memuat 7 slug berita lama yang 404 (R4 §2); platform tidak boleh mengulang tautan mati itu.

### 9.6 Jalan ke satu akun (opsional, F3 atau sesudahnya)

Bila PH ingin satu login untuk situs dan platform (C-03), butuh OAuth atau SSO dengan pengelola situs; Turnstile dan peran harus dipetakan; tidak dikerjakan sebelum rilis publik. Selama itu, anggota yang sudah punya akun situs METI tetap dibuatkan akun terpisah oleh Admin; pesan di halaman masuk menjelaskan bedanya.

---

## 10. Kalender kerja

Minggu 1 = minggu pertama setelah pemilik menyetujui rencana dan menyerahkan akun Cloudflare (JM-A03). Bulan di kolom kanan adalah perkiraan bila minggu 1 jatuh pada pekan 9 Nov 2026; geser sesuai tanggal mulai sebenarnya. Kalender ini hanya urutan; isi teknis dan tiket ada di `TIKET`.

### 10.1 Jalur kerja (TIKET §5)

| Jalur | Tiket |
| --- | --- |
| W (worker) | A04, A05, B01 sampai B05, B07, C04, D01, E06 |
| L (layar) | B06, C01 sampai C03, C05, C06, E01 sampai E05, F01 sampai F09 |
| P (pipa) | D02 sampai D13, F10 |
| G (gerbang) | C07, H01, H02 |
| M (manusia/METI) | A03, D07, keputusan C-01 sampai C-20, tinjauan hukum, pelatihan, peluncuran |

### 10.2 Kalender mingguan

| Minggu | Bulan (perkiraan) | Fase | Teknis (tiket) | Operasional (dokumen ini) | Gerbang atau keluaran |
| --- | --- | --- | --- | --- | --- |
| 1 | Nov 2026 | F0 | A01, A02, A03 (manusia) | Pemilik menjawab C-01, C-02, C-06, C-21, C-22; menunjuk pemilik produk | Repo, akun Cloudflare |
| 2 | Nov 2026 | F0 | A04, A05, C01 | Surat tugas pemilik produk; susun RACI final | Kerangka berdiri |
| 3 | Des 2026 | F0 | B01, B02, B03 | Daftar penguji tertutup disusun | Tabel akun, sandi, sesi |
| 4 | Des 2026 | F0 | B04 (L), C02 | Pilih penasihat hukum | Matriks RLS dan port layar |
| 5 | Des 2026 | F0 | B05, B06, B07, C03, C04, C05, C06, C07 | Siapkan kerangka kebijakan privasi | F0 lulus (GD §7): RLS hijau, `/direktori` 1280 dan 390 px |
| 6 | Des 2026 sampai Jan 2027 | F1 | D01, D02, D11 | Rapat produk; sepakati kelas data dan tingkat bukti | Skema kurasi, penjaga sumber, daftar tolak |
| 7 | Jan 2027 | F1 | D03, D04 | Pelatihan kurator sesi 1 dan 2 | Panen OpenAlex dan OSM |
| 8 | Jan 2027 | F1 | D05, D06 | Pelatihan kurator sesi 3 sampai 5 | Panen Ember, regulasi |
| 9 | Jan 2027 | F1 | D07 (manusia), D09 | SEK menyiapkan seed 12 anggota, 12 mitra, pengurus SK 0008 (C-10, C-11) | Seed METI |
| 10 | Feb 2027 | F1 | D10, D12 | Kurasi gelombang 1 (target 150 entitas) | Graf dan potret per lapis |
| 11 | Feb 2027 | F1 | D13, E01, E02 | Kurasi lanjut (target 300 entitas); dua mata | Skor keyakinan; beranda; sensus |
| 12 | Feb 2027 | F1 | E03, E05 | Peninjau angka memeriksa sampel 5 persen | Profil dan metode |
| 13 | Mar 2027 | F1 | E04, E06, E07 | Penasihat hukum meninjau kebijakan versi draf | Peta, koreksi, layar kurasi |
| 14 | Mar 2027 | F1 | H01, H02 | **T1 mulai: uji tertutup Pengurus** | Uji ujung ke ujung; layar |
| 15 | Mar 2027 | F1 | Perbaikan hasil uji | T1 umpan balik | F1 lulus: 300+ entitas bersumber, 0 tanpa sumber |
| 16 | Apr 2027 | F2 | F01, F02 | Keputusan C-16 (skor tampil), C-13 (izin 1001startup.id) | Rantai pasok, pembiaya |
| 17 | Apr 2027 | F2 | F03 | Hak jawab BUMN disiapkan | Kuadran BUMN |
| 18 | Apr 2027 | F2 | F04, F05 | Kurasi desa dan KDMP; hak jawab | Data center, energi desa |
| 19 | Mei 2027 | F2 | F06, F07 | MW memeriksa rapor provinsinya | Rapor provinsi, kebijakan |
| 20 | Mei 2027 | F2 | F08, F09 | **T2 mulai: peluncuran lunak anggota** (50 sampai 100 akun) | Cerita data; riwayat METI |
| 21 | Mei 2027 | F2 | F10, perbaikan | Formulir persetujuan tayang; koreksi mulai masuk | Sinkron berita |
| 22 | Jun 2027 | F2 | H01, H02, H03 | Audit kurasi; evaluasi T2 | Penyelarasan konteks bersih |
| 23 | Jun 2027 | F2 | Perbaikan | Pindah akun dan repo ke METI; uji tanpa pengembang | F2 lulus: tiap halaman punya Jawaban singkat, Cara menghitung, tanggal beku |
| 24 | Jun 2027 | F2 | H04 | Checklist siap rilis (§6.5); keputusan PH | Rilis (migrasi produksi, deploy) |
| 25 | Jul 2027 | F2 ke publik | | **T3: peluncuran publik** (siaran pers, LinkedIn, Instagram) | Publik tayang |
| 26 | Jul 2027 | F3 | G03 | Pemantauan 30 hari; kutipan pertama | API terbuka baca potret |
| 27 | Agu 2027 | F3 | G01 | Persetujuan PH F3 (C-01) | Klaim profil |
| 28 | Agu 2027 | F3 | G02 | Daftar mandiri; Turnstile aktif | Daftar mandiri |
| 29 | Sep 2027 | F3 | G04 | Panggung IndoEBTKE ConEx berikutnya bila terjadwal (tanggal perlu konfirmasi) | Pencocokan kebutuhan |
| 30 sampai 32 | Sep 2027 | F3 | Perbaikan, H02, H03 | Tinjauan sesudah 90 hari; laporan ke PH; keputusan lanjut | F3 lulus dan serah terima selesai |

Titik tangguh: tiap fase boleh bertambah 20 persen waktunya. Kalender tidak diikat hari tertentu karena bergantung pada jawaban C-01, C-02, C-06, C-10 dan tersedianya penasihat hukum.

---

## 11. Pertanyaan baru untuk pemilik

Pertanyaan yang BELUM ada di `KEPUTUSAN-METI` bagian C (C-01 sampai C-20). Tiap pertanyaan punya bawaan; kerja jalan dengan bawaan sampai dijawab. Bila disetujui, dipindahkan ke KP bagian C.

| Kode | Pertanyaan | Bawaan | Dampak bila berubah |
| --- | --- | --- | --- |
| C-21 | Siapa pemilik produk di METI (satu nama) dan wakilnya? | SJ sebagai pemilik, Direktur Eksekutif sebagai wakil | RACI §1.3, surat tugas, SLA keputusan 5 hari kerja |
| C-22 | Siapa yang menandatangani rilis publik? | Ketua Umum atas rekomendasi PH | Tahap T3, surat rilis |
| C-23 | Nama padanan resmi "Bidang Informasi dan Multimedia" pada SK 0008 (BK 7 "Strategic Communication dan Public Campaign")? | Dipakai "BIM" untuk fungsi kurasi dan komunikasi | RACI, surat tugas |
| C-24 | Boleh platform menambah manfaat pada paket membership METI (usulan §3.2), atau paket tidak diubah? | Hanya usulan; tidak diumumkan sebelum PH menyetujui | Halaman nilai anggota, janji tayang logo |
| C-25 | Apakah platform boleh menerima pendanaan sponsor dan hibah (§3.3), dan aturan batasnya? | Hibah dan donor boleh dengan perjanjian tertulis; sponsor ditunda sampai F3 | Pendapatan, risiko OP-05 dan OP-18 |
| C-26 | Siapa petugas pelindungan data pribadi dan kontak insiden METI? | Belum ada; surel privasi dikelola SEK | Halaman Privasi, §3.7 KPV |
| C-27 | Siapa penasihat hukum yang meninjau kebijakan, dan kapan anggarannya? | Dicari sebelum minggu 13; anggaran Rp 10 sampai 25 juta | T1, jadwal rilis |
| C-28 | Lisensi data keluaran: CC BY 4.0 untuk potret publik, dengan bagian OSM terpisah berlisensi ODbL? | Ya, usulan §2.9 | Jalur pemisahan potret, gerbang |
| C-29 | Batas umur data (kapasitas 24 bulan, jabatan 6 bulan, entitas 36 bulan sebelum "perlu diperiksa ulang")? | Seperti §2.1 | Laporan data usang, beban kurator |
| C-30 | Aturan hak jawab: tujuh hari kerja bagi entitas menjawab sebelum skor atau kuadran terbit? | Tujuh hari kerja | Waktu terbit kelas B |
| C-31 | Lisensi kode: tertutup di organisasi METI atau lisensi permisif (misalnya MIT)? | Tertutup di organisasi sampai diputus | Repo, bantuan komunitas |
| C-32 | Kapan akun Cloudflare dan repo dipindah ke METI? | Sebelum T2 (peluncuran lunak anggota) | §8.2, risiko OP-27 |
| C-33 | Apakah METI menyetujui peluncuran lunak publik pada pelantikan METI Wilayah atau pertemuan PH, dan peluncuran penuh di IndoEBTKE ConEx berikutnya? | Ya | §6.2, kalender |
| C-34 | Berapa kurator dan penerjemah EN yang dapat disediakan METI (jam per minggu)? | 1 kurator utama, 1 pendamping, 1 peninjau EN; total 30 sampai 45 jam per minggu | Cakupan sensus F1, §4 |
| C-35 | Perlukah formulir persetujuan tayang tertulis untuk anggota, dan siapa yang mengirimkannya? | Ya; SEK mengirim manual, tanpa surel otomatis | T2, ukuran sukses |
| C-36 | Izin tertulis memakai API `api.metiires.or.id` dan siapa pengelola situs? | Minta izin sebelum JM-F10 | Sinkron berita dan acara |
| C-37 | Apakah status MW (Established, Coming soon, Planned) ditetapkan oleh Ketua MW pusat atau Sekjen sebagai sumber otoritatif? | Ketua MW pusat, diverifikasi SJ | Rapor provinsi, ketidakcocokan angka 5, 6, 33, 35 (R3 §1.5) |
| C-38 | Boleh sponsor atau mitra muncul di halaman "Didukung oleh" dan dengan tingkat apa? | Satu area terpisah; tanpa hak edit; tanpa peringkat | §2.6, §3.3 |
| C-39 | Bila PH menolak mandat resmi di C-01, apakah platform dihentikan, diperkecil jadi purwarupa, atau diteruskan sebagai proyek tim? | Diperkecil jadi purwarupa internal tanpa tayang publik | Seluruh fase T1 sampai T4 |
| C-40 | Peninjauan berkala: siapa mengevaluasi platform tiap tahun dan metriknya? | PH setiap Januari, dengan angka U1 sampai U8 dan laporan biaya | §8.4 langkah 6 |

---

## Lampiran: angka dan sumber yang perlu verifikasi

| Butir | Alasan | Cara |
| --- | --- | --- |
| Harga Workers Paid, D1 kelebihan, R2 kelebihan, Workers AI | Harga berubah; R6 tidak memverifikasi harga Paid | Halaman harga resmi Cloudflare, tanggal cek dicatat |
| Harga domain `.id` dan `.or.id` | Berbeda per registrar | Tanya registrar METI |
| Kuota gratis Resend, Brevo, dan sejenis | Berubah | Halaman resmi penyedia |
| Kuota OpenAlex dan syarat kunci | Kebijakan penyedia | Halaman resmi OpenAlex |
| Honor tinjauan hukum | Tarif beragam | Minta penawaran |
| Jadwal IndoEBTKE ConEx berikutnya | Tidak ada di dokumen | Tanya Bidang Kerja 1 dan panitia |
| Kompatibilitas ODbL dan CC BY | Tafsir hukum | Penasihat hukum |
| Nama organ BIM | Beda dengan SK | C-23 |
| Kewajiban petugas PDP dan peraturan pelaksana UU PDP | Terus berkembang | Penasihat hukum, JDIH |
| Beban jam kurator | Perkiraan perancang | Ukur dua bulan pertama |
