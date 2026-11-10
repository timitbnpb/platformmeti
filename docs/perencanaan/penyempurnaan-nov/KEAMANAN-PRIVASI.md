# KEAMANAN-PRIVASI penyempurnaan November 2026

Otoritas: `KEPUTUSAN-METI` K15, K21 sampai K26, D19 sampai D23, C-21 sampai C-28. Melengkapi `docs/perencanaan/KEAMANAN-PRIVASI.md` (KPV lama). Dokumen ini hanya memuat **prinsip dan matriks** untuk tabel, rute, dan alur baru. Rincian celah tertentu tidak ditulis di sini (repo publik); temuan ditangani lewat tiket JM-S01 sampai S03 dan dicatat di luar repo.

Aturan tetap dari KPV lama dan AGENTS.md berlaku tanpa diulang: semua baca dan tulis D1 lewat `src/hak.js`; tiap sel matriks punya uji tolak; potret dipisah per lapis saat dibangun, bukan disaring di klien; repo publik tanpa rahasia, data pribadi, atau `account_id`; CSP tanpa skrip dan gaya inline; CSRF cek Origin, hanya JSON, badan maksimal 64 KB, kolom tak dikenal ditolak.

## 1. Peran, lapis, dan tier

### 1.1 Peran dan lapis (tidak berubah)

Peran: publik, anggota, pengurus, kurator, wilayah, admin, super (`PERAN` di `src/hak.js`). Setelah D19 "publik" berarti hanya rute pengecualian; semua halaman dan data lain butuh sesi. Lapis data: publik, anggota, pengurus.

### 1.2 Tier adalah atribut akun, bukan peran baru (D22, K24)

- Status akun: `tamu` (akun gratis), lalu anggota dengan tier menurut kode DT (`pelajar`, `individu`, `ngo`, `usaha_kecil`, `usaha_besar`, `utama`; pemetaan penyebutan K24 ada di GLOSARIUM §5) mengikuti tangga iuran. Disimpan di tabel pendamping `akun_tier` (migrasi 0042, JM-N01), BUKAN kolom `akun` (CHECK `akun.status` beku); tidak menambah elemen pada `PERAN`.
- Peran menentukan **apa yang boleh dilakukan**; tier menentukan **seberapa dalam data yang boleh dibaca**. Keduanya diperiksa di server; tier tidak pernah dibaca dari klien atau dari token yang dikirim klien.
- `tamu` diperlakukan sama dengan peran anggota untuk lapis publik **kecuali** isi yang dikunci C-23: data dasar untuk semua yang login; kontak pakar dan kontributor, data pasar rinci, unduhan CSV atau JSON, laporan lengkap, dan alat analisis hanya anggota menurut tier. Kontak korporat organisasi (`organisasi.kontak`) TIDAK dikunci dan tidak dipindah lapis (C-23); kontak orang tetap lapis `pengurus`.
- Pengunci: potret dibangun per lapis dan per tier (JM-N02); berkas untuk tier lebih tinggi tidak ada di respons tier lebih rendah. Menyaring di layar bukan pengamanan.
- Perubahan tier (naik atau turun) dan status `tamu` tercatat di jejak; turun tier mencabut akses sebelum respons berikut (tanpa cache tepi yang melayani lapis lebih tinggi). Anggota yang disetujui tanpa lunas memakai `tierDasar(kategori)` (tier terendah berbayar untuk kategorinya (`pelajar` bagi mahasiswa, `individu` bagi lainnya termasuk organisasi)) selama tenggang 30 hari dan naik ke tier pilihan sesudah lunas; lewat tenggang turun ke `tamu` tanpa menghapus data (C-28; ALGORITMA `§tier` R.2).

## 2. Matriks peran x lapis x tabel untuk tabel dan rute baru

Simbol mengikuti `MATRIKS` dan kode sel `KODE` di `src/hak.js` (B baca, T tulis menurut aksi yang disebut, `-` tidak ada akses; kode baru dan klausanya ada di DESAIN-TEKNIS `§rute-matriks` X.1). Kolom: PB publik, TM tamu, AN anggota, PG pengurus, KR kurator, WL wilayah, AD admin, SA super. **Nama tabel mengikuti DESAIN-TEKNIS (DT menang)**; tabel ini mencakup seluruh tabel migrasi 0038 sampai 0050. Sel di sini adalah kontrak hak yang DT dan `hak.js` wajib penuhi dan sama dengan DT X.2 (tanpa kolom TM, yang mengikuti AN dikurangi fitur terkunci tier). PB selalu `-`: setelah D19 publik hanya rute pengecualian.

Uji penolakan per nama tabel ada di RENCANA-UJI §4.3.

| Tabel | PB | TM | AN | PG | KR | WL | AD | SA | Catatan dan batas |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `wil_kegiatan` | `-` | B terbit | B terbit | B terbit | B terbit | T prov | T | T | Terbit terlihat semua yang login; draf hanya penulis, wilayahnya, AD, SA. Wilayah luar `cakupan_prov` ditolak (403) pada baca draf dan tulis; baca per id 404; `kode_prov` ditimpa server. |
| `wil_foto` | `-` | B terbit | B terbit | B terbit | B terbit | T prov | T | T | Berkas lewat rute berperan, tanpa URL R2 langsung; tipe dan ukuran dibatasi server dan CHECK. |
| `wil_dokumen` | `-` | `-` | `-` | B | B | T prov | T | T | Internal: anggota dan tamu tidak melihat; R2 privat lewat rute berperan. |
| `wil_berita` | `-` | B terbit | B terbit | B terbit | B terbit | T prov | T | T | Status `terbit` saja untuk selain penulis; AD menarik. |
| `wil_pengurus` | `-` | B | B | B | B | T prov | T | T | Nama dan jabatan; tanpa kontak. |
| `anggota_prov` | `-` | `-` | `-` | B | `-` | B prov | B | B | Kolom terbatas (tanpa `hp`, `surel`, `rinci`, `foto_kunci`); WL hanya provinsinya; hanya baca. |
| `akun_tier` | `-` | B diri | B diri | B diri | B diri | B diri | T | T | Tidak ada pelaku menaikkan tier dirinya; perubahan lewat iuran terverifikasi atau AD; staf tanpa baris. |
| `sumber_denyut` | `-` | `-` | `-` | `-` | B | `-` | T | T | Dibaca KR, AD, SA; tulis rutin hanya cron Worker; klien tak punya rute tulis kecuali PATCH AD/SA. |
| `denyut_putaran` | `-` | `-` | `-` | `-` | `-` | `-` | B | B | Log teknis; hanya AD dan SA membaca. |
| `tautan_antrean` | `-` | `-` | `-` | B | T | `-` | T | T | KR memutus (alasan tercatat); tautan ditolak masuk daftar tolak tautan; PG membaca. |
| `hukum_kurasi` | `-` | `-` | `-` | B | T | `-` | T | T | Antrean nomor beda, relasi bertentangan, OCR tinjau, dasar Pasal 42. |
| `hukum_md` | `-` | `-` | B | B | B | B | B | B | Teks aturan dokumen publik bagi yang login; pemindai data pribadi §6; tanpa rute tulis. |
| `hukum_relasi_pasal` | `-` | `-` | B | B | B | B | B | B | Relasi mencabut dan mengubah per pasal; pasal wajib (CHECK). |
| `rapor_edisi` | `-` | B terbit | B terbit | T | T | B terbit | T | T | Hanya `terbit` tampil bagi AN, TM, WL; penyunting PG dan KR; isi lengkap dikunci tier lewat potret. |
| `rapor_unduh` | `-` | `-` | B diri | B diri | B diri | B diri | B | B | Log unduhan dan kuota; tercatat di jejak; batas laju. |
| `advokasi_butir` | `-` | B disahkan | B disahkan | T tinjau | B disahkan | B disahkan | T | T | Status aturan terbaca semua yang login; `posisi_meti` draf dibuang dari respons AN, KR, WL, TM; publikasi posisi menunggu C-01. |
| `advokasi_suara` | `-` | `-` | T daftar | T daftar | T daftar | T daftar | T daftar | T daftar | Satu suara per akun per isu (constraint unik); hanya milik sendiri. |
| `advokasi_komentar` | `-` | B | T daftar | T | T | T daftar | T | T | Komentar dibaca TM; menulis menurut tier (gerbang fitur); moderasi PG, KR, AD, SA. |
| `kelompok_kerja` | `-` | `-` | B | T | B | B | T | T | Wadah kerja dibuat PG, AD, SA. |
| `kelompok_anggota` | `-` | `-` | B | T | B | B | T | T | Keanggotaan ditetapkan PG, AD, SA; tanpa kontak. |
| `kelompok_tugas` | `-` | `-` | T daftar | T | T daftar | T daftar | T | T | Penerima tugas memperbarui miliknya; PG, AD, SA menetapkan. |
| `pemasang` | `-` | B terbit | T daftar terbit | T tinjau | B | B | T | T | Direktori berlabel "belum disertifikasi METI" sebelum C-01; pemilik membaca dan mengubah ajuannya saja. |
| `pemasang_putusan` | `-` | `-` | B diri | T tinjau | `-` | `-` | B | T | Putusan komite; append-only dijaga trigger; pemilik membaca putusan tentang dirinya. |
| `pemasang_aduan` | `-` | T kirim | T kirim | T tinjau | T kirim | T kirim | B | T | Pelapor melihat miliknya saja; pihak teradu membaca isi yang ditujukan kepadanya (hak jawab); komite PG memutus; retensi 24 bulan sesudah putusan. |
| `pipeline_ajuan` | `-` | `-` | T daftar | T tinjau | B | T daftar | T | T | Hanya pemilik mengubah; PG dan AD memutus. Daftar radar, tender, peluang adalah potret berlapis tier, bukan tabel. |
| `pipeline_ruang` | `-` | `-` | T daftar | B ruang | `-` | `-` | B ruang | B | Berkas R2 privat, tautan sekali pakai; tiap baca dan unduh tercatat di jejak; tidak masuk potret, pencarian, atau Tanya. |
| `pipeline_ruang_akses` | `-` | `-` | `-` | B diri | `-` | `-` | T | T | Penugasan tim METI ditulis AD dan SA; PG melihat penugasan dirinya. |
| `kompetensi_jalur` | `-` | B | B | B | T | B | T | T | Jalur dan modul; asesor KR menyunting. |
| `ujian_daftar` | `-` | `-` | T daftar | B | T tinjau | T daftar | T | T | Pendaftar membaca miliknya; asesor KR menilai; kuota di server. |
| `sertifikat` | `-` | `-` | B diri | T tinjau | T tinjau | B | T | T | Terbit: asesor KR mencatat lulus, PG mengesahkan (orang berbeda); KR mencabut dengan alasan, peserta banding ke PG; AN membaca miliknya; lencana QR lewat rute verifikasi berperan LOGIN (§8). |
| `temu_profil` | `-` | `-` | B | T tinjau | B | B | T | T | Penawaran dan kebutuhan; kontak pihak lain tidak ada di respons sebelum `diterima`. |
| `temu_permintaan` | `-` | `-` | T daftar | T daftar | T daftar | T daftar | T | T | Pemohon menulis miliknya; kuota per tier dijaga server dan trigger; kontak terbuka sesudah kedua pihak setuju. |
| `temu_kuota` | `-` | `-` | B diri | B diri | B diri | B diri | B | B | Pemakaian kuota per bulan; tak ditulis klien. |
| `produk_daftar` | `-` | B terbit | T daftar terbit | B | T tinjau | B terbit | T | T | Hanya `terverifikasi` tampil; `bukti_url` hanya https; verifikator KR. |
| `pembeli_profil` | `-` | `-` | T daftar | B anonim | `-` | `-` | B anonim | B anonim | Identitas disembunyikan bila diminta, di server; peran selain pemilik membaca versi anonim; tidak dipublikasikan ke anggota lain. |
| `pembeli_cocok` | `-` | `-` | B diri | B | `-` | `-` | B | B | Turunan kecocokan; tanpa identitas. |

Rute dan data tanpa tabel D1 sendiri (tetap punya gerbang peran dan uji tolak):

| Rute atau data | Gerbang | Catatan |
| --- | --- | --- |
| `GET /api/admin/kesegaran` (membaca `sumber_denyut` dan aset `kesegaran.json`) | KR AD SA; PG, AN, TM, WL `-` | Hanya AD dan SA memicu putaran manual lewat `PATCH /api/admin/denyut/:kode`. |
| `GET /api/bot/tautan-putus` | bearer `BOT_RAHASIA`, bukan sesi | §4.1 (D23). |
| `GET /api/sertifikat/v/:token` dan verifikasi lencana pemasang | LOGIN (AN PG KR WL AD SA); tanpa sesi 401 | Eksplisit login, bukan pengecualian D19 (C-27, §8). |
| `dampak_regulasi.json` (peta dampak) | potret lapis publik (dasar) | Tidak ada tabel D1; `tinjau` tautan dampak lewat `tautan_antrean` dan `hukum_kurasi`. |
| daftar radar, tender, peluang | potret berlapis tier (N02) | Skor dan alasan dibaca sesuai tier; ruang data privat ada di `pipeline_ruang`. |
| antrean semi-manual panen | berkas `data/bot/status.json` di PR | Tidak ada tabel D1; isi dari luar diperlakukan tak tepercaya (§5). |

Aturan sel (berlaku untuk seluruh tabel di atas):
1. Sel `-` berarti rute mengembalikan 403 untuk sesi dan 401 tanpa sesi, tanpa membocorkan apakah baris ada.
2. Sel "prov" berarti filter `cakupan_prov` diterapkan **di dalam `hak.js` pada tiap query**, bukan di rute. Rute baru yang membaca tabel berprovinsi tanpa melewati filter itu ditolak oleh pengulas `hak-auditor`.
3. Sel "diri" berarti `akun_id` dari sesi, bukan dari badan permintaan.
4. Tulis oleh akun wilayah pada provinsi yang bukan miliknya diperlakukan sebagai kegagalan hak dan dicatat di jejak (tanpa isi baris).
5. Tiap sel punya uji "yang salah DITOLAK" (RENCANA-UJI §4).

## 3. Kunci di sisi server (C-23) dan ajakan naik

- Data yang dikunci tidak dikirim. Ajakan naik tier (komponen kunci di DESIGN-SYSTEM §2.5) memakai teks tetap dan tidak memuat potongan data terkunci, jumlah baris terkunci yang bisa dipakai menebak isi, atau pratinjau kabur dari data nyata.
- Hitungan "n dari N" pada daftar terkunci boleh tampil bila N sudah publik di lapis dasar; bila tidak, tidak ditampilkan.
- Unduhan CSV atau JSON: dibuat di server dari potret tier pemanggil; berstempel nama akun dan tanggal (sitasi), tercatat di jejak, dengan batas laju. Berkas unduhan tidak disimpan di R2 publik.
- Perubahan tier berlaku tanpa menunggu kedaluwarsa cache: respons berlapis tier tidak boleh di-cache bersama (`Cache-Control: private` atau kunci cache berisi tier).

## 4. Bot panen dan Actions (K21)

Prinsip: bot hanya boleh **mengusulkan**; tidak ada jalur dari internet luar ke produksi tanpa tinjauan.

| Hal | Aturan |
| --- | --- |
| Token | `permissions: {contents: read}` ditulis di level workflow. Job `panen` dan `uji` hanya baca. Job terpisah `bot_pr` adalah SATU-SATUNYA pemegang `contents: write`, `pull-requests: write`, dan `issues: write`; job itu tidak memegang kunci API dan hanya menyalin jalur putih-daftar (DESAIN-TEKNIS B.4). Tidak ada `permissions: write-all`. Token tidak punya scope `workflow` (Y6): berkas `.github/workflows/*` dipasang pemilik. |
| Pemicu | `schedule` dan `workflow_dispatch` saja. Dilarang `pull_request_target` dan pemicu yang menjalankan kode dari fork dengan rahasia. Input `workflow_dispatch` tidak pernah dimasukkan ke perintah shell tanpa dikutip atau lewat `env:`. |
| Secrets | Kunci API (BPS, EIA, Ember, Comtrade; C-25) hanya GitHub Secrets pemilik; tidak dicetak, tidak di artefak, tidak di cache. Langkah yang memakai rahasia tidak menjalankan kode dari data hasil panen. Sumber `perlu_kunci` dilewati tanpa kunci. Tidak ada secret Cloudflare produksi di workflow panen (unggah R2 dan migrasi produksi tetap oleh pemilik). |
| Hasil | Masuk cabang `data-bot` lalu PR berisi selisih; tidak push ke `main`. PR dari `GITHUB_TOKEN` tidak memicu `uji.yml`, jadi `npm run uji` berjalan di job `uji` sebelum `bot_pr` (D23). Cabang `main` dilindungi: PR wajib, `npm run uji` wajib hijau. PR bot memuat ringkasan selisih (jumlah baris, sumber, status gagal) tanpa isi mentah panjang. |
| Pustaka panen | Satu pustaka: UA jujur METI dengan tautan kontak organisasi (bukan surel pribadi), robots.txt dibaca tiap putaran, `Crawl-delay` dihormati, jeda minimal 2 detik per host, berhenti di 403 atau 429, tanpa login, tanpa medsos, tanpa mengakali blokir, tanpa Antara. Sumber yang melarang tidak dipaksa. |
| Pihak ketiga | Action pihak ketiga dipin ke SHA commit, bukan tag. Dependensi dipasang dengan `npm ci` dari lockfile. |
| Kegagalan | Satu sumber gagal tidak menggagalkan putaran; tiga gagal berturut-turut membuka isu. Isu dan log tidak memuat respons mentah yang berpotensi memuat data pribadi. |
| Batas | Cron maksimal 5 (akun Free). Kuota baca D1 5 juta per hari dihitung sebelum menambah kerja terjadwal. Denyut perubahan di Worker dibagi per putaran agar di bawah batas subrequest. |
| Higiene | Sebelum PR dibuka: pemindai data pribadi dan rahasia pada hasil (pola surel, telepon, NIK, kunci); hasil yang cocok dibuang dan dihitung, dan PR ditandai. |

### 4.1 Rute bot `GET /api/bot/tautan-putus` (D23)

Bot membaca keputusan kurator lewat rute khusus, bukan sesi. Aturan:

1. **Hanya-baca.** Hanya `GET`; tidak ada rute tulis untuk bot. Rute membaca `tautan_antrean` berstatus diputus, dengan kolom terbatas (tanpa `catatan` kurator dan tanpa `diputus_oleh`).
2. **`BOT_RAHASIA`.** Secret Worker dan GitHub Secrets (bukan di repo, log, atau artefak). Dikirim sebagai bearer. Bukan pengecualian D19: rute ini tidak melayani halaman dan tidak menerima sesi; tanpa bearer yang sah ia tidak memberi apa pun.
3. **Banding waktu-tetap.** Bearer dibandingkan dengan `BOT_RAHASIA` secara waktu-tetap (panjang berbeda tidak memberi jalan pintas), sehingga waktu respons tidak membocorkan awalan yang benar.
4. **Batas laju.** Per IP hash dan global untuk rute ini; lewat batas dijawab 429 tanpa isi. Gagal otentikasi dihitung terhadap batas yang sama.
5. **Jejak.** Tiap panggilan (berhasil atau gagal) menulis `jejak` dengan rute, hasil, dan IP hash bergaram harian; rahasia dan bearer tidak dicatat.
6. **Penolakan.** Tanpa bearer: 401. Bearer salah: 403. Pesan galat sama untuk semua kasus gagal. Memutar `BOT_RAHASIA` (insiden §9) dan membekukan bot tidak butuh perubahan kode.

## 5. Isi tak tepercaya dari panen

Seluruh isi dari luar (HTML, PDF, RSS, JSON sumber, hasil OCR, teks peraturan, judul berita) diperlakukan sebagai **data tak tepercaya** sampai disaring.

1. **HTML dan penyisipan.** Semua teks data lewat `esc()` sebelum masuk DOM. Tidak ada `innerHTML` dengan teks sumber mentah. HTML dari sumber dibuang tag-nya saat panen dan tidak disimpan sebagai HTML. Teks peraturan dirender dari markdown oleh perender sendiri dengan daftar elemen terbatas; tautan hanya `https:` atau jangkar; gambar dari sumber tidak dimuat langsung (hanya gambar yang sudah melalui R2 `/gambar/:id`).
2. **Frontmatter dan nama berkas.** Nilai frontmatter di `hukum/**/*.md` dikutip dan di-escape; `id` dan jalur berkas dibentuk dari pola ketat (huruf kecil, angka, tanda hubung) sehingga tidak ada traversal jalur. Berkas yang lolos pola lain ditolak.
3. **Tautan keluar.** Tautan ke sumber memakai `rel="noopener noreferrer"`, hanya skema `https`. Tidak ada pengalihan terbuka dari parameter data.
4. **SSRF dan jangkauan.** Pustaka panen hanya memanggil host yang terdaftar di `data/sumber_jadwal.json`; pengalihan ke host lain diikuti hanya bila masih dalam daftar. Alamat privat dan metadata awan ditolak. Worker tidak menjalankan fetch ke URL dari data pengguna.
5. **Ukuran dan bentuk.** Respons dibatasi ukuran; PDF dan berkas diurai di mesin kerja bukan di Worker; JSON rusak atau di luar skema ditolak dan dihitung. Potret yang menyusut lebih dari 20 persen, rusak, atau berisi baris tanpa sumber ditolak (jaga unggah yang sudah ada).
6. **Prompt injection pada Tanya AI (C-22).** Potongan teks dari panen dan regulasi bisa memuat instruksi tersembunyi. Prinsip: (a) potongan masuk ke model sebagai data berbatas jelas, dan instruksi sistem menyatakan isinya tidak boleh dipatuhi; (b) model tidak punya alat, tidak bisa memanggil rute, dan tidak menerima sesi pengguna; (c) jawaban hanya dari potongan bersitasi dan keluaran yang tidak bersitasi dibuang; (d) keluaran dirender sebagai teks, bukan HTML; (e) hanya potongan yang boleh dibaca peran penanya yang masuk indeks (tidak ada indeks gabungan lintas lapis); (f) ada uji fixture berisi instruksi jahat yang harus gagal memengaruhi jawaban (RENCANA-UJI §6.5). Pengerasan ini dikerjakan di JM-S10 (FN-S10).
7. **Ringkasan mesin.** Hanya dari teks abstrak publik, berlabel "Ringkasan mesin", tidak dijadikan fakta bersumber.
8. **Hasil OCR.** Mutu OCR dicatat; teks OCR dengan mutu rendah tidak dipakai sebagai dasar pasal pada peta dampak tanpa verifikasi kurator (JM-U05).

## 6. Data pribadi dalam teks regulasi dan data publik

- Peraturan adalah dokumen publik, tetapi lampiran, putusan, dan pindaian dapat memuat data pribadi (NIK, alamat, nomor telepon, nama pihak swasta). Ekspor ke GitHub publik (JM-U01) melewati **pemindai data pribadi yang sama dengan potret**: pola NIK, telepon, surel, alamat rumah. Hasil cocok pada lampiran: lampiran dibuang dan dicatat, teks batang tubuh tetap.
- Nama pejabat penanda tangan dan nama jabatan dalam batang tubuh adalah bagian dokumen resmi dan dipertahankan; nama pihak swasta perseorangan dalam lampiran tidak dipertahankan.
- Permintaan penghapusan dari pemilik data pribadi pada teks yang sudah terbit dilayani lewat hak subjek (§9): berkas diubah di cabang, dan riwayat git disentuh hanya atas keputusan pemilik.
- Dasar pengumuman ulang naskah (UU 28/2014 Pasal 42) diperiksa dari naskah resmi saat JM-U01 dan dicatat; sampai itu selesai, ekspor tidak dipublikasikan di luar repo.
- Berlaku juga untuk data tautan baru (L01 sampai L06): tidak ada profil pribadi, medsos, atau LinkedIn; tag kepakaran bersumber, tidak ditebak.
- Foto tokoh tanpa lisensi tetap keputusan pemilik (C-24); gelombang ini tidak menambahkan foto baru.

## 7. Pengaduan konsumen, hak jawab, dan skema pemasang (K25 M03, Q13)

- Pelapor (konsumen) wajib akun masuk; identitasnya tampil hanya kepada komite dan pihak teradu sejauh perlu untuk menjawab; tidak tampil publik. Pelapor boleh meminta nama tidak dibuka kepada pihak teradu, dan komite menimbang.
- Pihak teradu mendapat **hak jawab** dalam tenggat yang ditentukan ALUR sebelum putusan; jawaban dan putusan tersimpan bersama aduan (append-only dijaga trigger). Aduan yang belum diputus tidak ditayangkan sebagai fakta tentang pemasang.
- Publikasi putusan (mis. status "dicabut") hanya setelah keputusan komite tercatat dan memakai kalimat faktual tanpa opini; isi aduan tidak tayang.
- Skema yang mengikat organisasi (sertifikasi, kode etik) menunggu Pengurus Harian (C-01). Sebelum itu, direktori pemasang berlabel "belum disertifikasi METI" dan tidak memakai kata "terverifikasi" untuk yang belum teruji.
- Isu sosial (Q13) wajib memuat hak jawab; opini METI hanya yang berstatus `terbit` pada `advokasi_posisi`.

## 8. Ruang data privat dan lencana

- **Ruang data privat** (dokumen bank, studi kelayakan, kontrak): berkas di R2 privat, dilayani lewat rute berperan dengan tautan sekali pakai berumur pendek; tidak ada URL tetap yang bisa dibagikan. Akses = pemilik ajuan dan tim METI yang ditugaskan secara tertulis; tiap baca dan unduh tercatat. Perjanjian kerahasiaan ditampilkan sebelum unggah. Berkas tidak diindeks pencarian, tidak masuk potret, tidak masuk Tanya AI.
- Pemilik dapat menarik dan menghapus berkasnya; penghapusan menghapus berkas R2 dan baris rujukan dalam satu tindakan yang dapat diverifikasi.
- **Lencana QR:** token verifikasi acak panjang, tidak berurutan, tidak memuat ID akun; bisa dicabut; halaman verifikasi hanya memuat nama, jalur, status, tanggal; dibatasi laju per IP; tanpa surel atau HP. Verifikasi (`GET /api/sertifikat/v/:token`, lencana pemasang, lencana QR) wajib login (C-27): peran LOGIN eksplisit (AN PG KR WL AD SA), tanpa sesi 401. Ini BUKAN pengecualian D19; hanya `/kta/v/<token>` yang terbuka tanpa login.
- **Permintaan temu:** kontak terbuka hanya sesudah kedua pihak setuju; kanal kontak dipilih pemilik akun; tanpa alamat rumah.
- **Pembeli hijau:** profil beban bersifat komersial sensitif; anonim bila diminta; tidak dipublikasikan ke anggota lain tanpa persetujuan.

## 9. UU PDP dan hak subjek (prinsip)

- Dasar pemrosesan: persetujuan untuk data akun dan pendaftaran; kepentingan sah untuk data dokumen publik. Persetujuan UU PDP wajib pada formulir baru yang menghimpun data pribadi (ajuan proyek, pendaftaran lencana, profil pembeli, permintaan temu).
- Minimisasi: hanya kolom yang dipakai; tidak ada NIK, alamat rumah, tanggal lahir, agama, status kawin, atau biometrik (tidak ada kolomnya).
- Hak subjek: akses, koreksi, hapus, tarik persetujuan; layanan 14 hari kerja; koreksi faktual berbukti jelas 5 hari kerja, perlu cek sumber 10; konfirmasi 2 hari kerja (KPV lama). Alur baru mewarisi ini tanpa mengubah.
- Kegagalan pelindungan data diberitahukan dalam 3 x 24 jam. Eskalasi insiden: nonaktifkan sesi massal, putar rahasia, bekukan potret; bot ikut dibekukan (nonaktifkan workflow).
- Retensi (C-26, diputuskan): jejak 12 bulan, log 12 bulan (termasuk log temu), aduan konsumen 24 bulan sesudah putusan. Pembersihan oleh `sapu` (cron); aduan yang belum diputus tidak dihapus.
- Anonimisasi dan pseudonimisasi: IP di jejak hash bergaram harian; angka agregat survei hanya bila n minimal 5.
- Transfer lintas batas: Cloudflare dan GitHub memproses data; tercatat di kebijakan privasi. Data pribadi anggota tidak masuk GitHub, hanya data dokumen publik.

## 10. Batas laju dan penyalahgunaan

Rute baru yang menulis atau membuat tagihan (Workers AI, unggah, unduhan CSV, verifikasi lencana, permintaan temu, kirim aduan) memakai batas laju per akun dan per IP hash. Gagal membuat pesan sama untuk kasus ada dan tidak ada. Galat ke klien tanpa jejak tumpukan. Formulir publik (`/daftar`) tetap memakai honeypot dan batas laju tanpa CAPTCHA pihak ketiga.

## 11. Gerbang mekanis yang menahan aturan ini

| Aturan | Gerbang |
| --- | --- |
| Tiap sel matriks, yang salah ditolak | `tests/hak.test.mjs`, uji D1 per tabel baru (RENCANA-UJI §4) |
| Tiap rute `/api/` terdaftar dengan peran benar dan salah | `tests/e2e/cakupan.json` + gerbang rute tak terdaftar (JM-S08) |
| Permission workflow `contents: read` di level workflow, tulis hanya job `bot_pr`, tanpa `pull_request_target`, aksi dipin SHA | gerbang statis workflow (RENCANA-UJI §6.3) |
| Tanpa rahasia dan data pribadi di repo | `higiene-repo`, pemindai potret, pemindai ekspor regulasi |
| CSP dan header | `tests/gerbang-headers.test.mjs` |
| Tanpa HTML mentah dari sumber | gerbang penyisipan (cari `innerHTML` dengan data tak lewat `esc()`) |
| Prompt injection | uji fixture Tanya (JM-S10) |
| Tiap jenis `MATRIKS` punya baris di dokumen hak | gerbang sinkron `MATRIKS` terhadap KPV §1 dan tabel §2 (JM-S11) |
| Rute bot `BOT_RAHASIA`: tanpa bearer 401, salah 403, laju 429, jejak | `tests/bot-rute.test.mjs` (RENCANA-UJI §6.2a) |
| Tier dikunci di server | uji peran salah DITOLAK per dataset (JM-N02) |

## Catatan untuk induk

Butir yang dulu terbuka dan kini diputuskan atau selesai ditulis sebagai keputusan, bukan pertanyaan.

1. **Nama tabel (selesai).** §2 sudah dipetakan ke nama tabel DESAIN-TEKNIS (DT menang) dan mencakup seluruh tabel migrasi 0038 sampai 0050. Bila DT menambah atau menggabung tabel, sel dipetakan ulang, tidak dilonggarkan.
2. **`wilayah` (selesai).** Diputuskan di DT `§admin-wilayah` W.1: peran `wilayah` dengan `cakupan_prov` memakai lima tabel `wil_*` baru (migrasi 0041); `src/meti_wilayah.js` dan `src/wilayah_kelola.js` tetap; `wilayah_akun` (0019) tidak disentuh.
3. **Lencana dan D19 (diputuskan, C-27).** Verifikasi lencana dan sertifikat wajib login; bukan pengecualian D19.
4. **Retensi (diputuskan, C-26).** Jejak 12 bulan, log 12 bulan, aduan 24 bulan; §9.
5. **Tanya AI (tiket ada).** Pengerasan §5.6 dikerjakan di JM-S10 (FN-S10) pada `src/tanya.js`; tanpa fitur baru.
6. **Tier tamu dan `PERAN`.** D22 menjadikan `tamu` status akun di tabel pendamping `akun_tier`; `MATRIKS` tetap 7 peran. Kolom TM di §2 adalah status, bukan peran; `hak.js` memakai pengubah tier tanpa menambah elemen `PERAN`.
7. **Branch protection** untuk `main` (PR wajib, uji wajib) adalah pengaturan GitHub oleh pemilik, bukan kode. Perlu dikerjakan sebelum bot pertama jalan.
8. **Teks regulasi di repo publik** bergantung pada dasar Pasal 42 UU 28/2014 yang diperiksa di JM-U01; sampai itu selesai, ekspor tidak dipublikasikan.
9. **12 jenis `MATRIKS` tanpa baris KPV §1 (JM-S11).** `agenda`, `konten_meti`, `konten_otorisasi`, `naskah`, `naskah_catatan`, `event_atur`, `event_daftar`, `konsultasi`, `sesi_admin`, `surel_minta`, `konsultasi_putus`, `keyakinan` ada di `src/hak.js` tetapi tidak di KPV lama §1; JM-S11 menulis barisnya dan memasang gerbang yang menggagalkan uji bila jenis `MATRIKS` tak punya baris.
