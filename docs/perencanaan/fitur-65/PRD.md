# PRD: 65 fitur pilihan pemilik

Kalah dari `KEPUTUSAN.md` modul ini dan dari PRD induk kecuali di butir yang dicabut lewat F65-000. Status "kini" berasal dari pemetaan grep 15 Nov 2026 dan belum diuji di browser (F2).

Kolom G = gelombang (F1). "Selesai bila" adalah kriteria terima yang bisa diuji.

## 1. Sudah ada: verifikasi saja (15 butir)

| No | Fitur | Rumah | Selesai bila |
| --- | --- | --- | --- |
| M4 | Tingkat manfaat per paket | `/daftar` | tabel manfaat tampil di 375 tanpa gulir halaman |
| M5 | Profil yang bisa diklaim | `/portal` | klaim, tinjau admin, tolak, dan setuju lulus uji integrasi |
| 20 | Unduh data + lisensi + kutipan | `/data` | tiap berkas punya sumber, tanggal, lisensi, cara kutip; Excel ditambah bila pemilik minta |
| 25 | Lapisan transmisi dan gardu | `/jaringan` | lapisan menyala dan mati tanpa membekukan layar |
| 30 | Indeks kesiapan investasi | `/indeks` | label Hipotesis dan bobot terbuka tampil |
| 31 | Papan peringkat pemda | `/pemda` | peringkat provinsi; kabupaten dicatat sebagai celah data |
| 34 | Jejak emisi per sistem | `/target#transisi` | intensitas per sistem punya sumber dan tahun |
| 35 | Statistik tenaga kerja hijau | `/kerja` | angka berlabel EST dengan Cara menghitung |
| 36 | Kalkulator PLTS atap | `/panduan` | hasil sama dengan uji acuan rumus |
| 37 | Kalkulator LCOE | `/investasi#hitung` | sama |
| 38 | Simulasi PPA | `/investasi` model keuangan | eskalasi tarif ada; bila belum, ditambah |
| 46 | Pelacak RUU per tahap | `/kebijakan` | tiap tahap punya sumber bertanggal |
| 50 | Konsultasi publik per pasal | konsultasi naskah | komentar per pasal dan rekap `.docx` lulus uji |
| 68 | Glosarium interaktif | `/panduan#istilah` | istilah bergaris bawah di halaman lain membuka definisi |
| 73 | Infografik siap bagi | tombol PNG tiap kartu | PNG terunduh di terang dan gelap |

## 2. Gelombang 1: layar dan rumus di atas data yang ada (13 butir)

| No | Fitur | Rumah | Lingkup | Selesai bila |
| --- | --- | --- | --- | --- |
| 18 | Pembanding proyek | `/banding` | segmen ketiga "Proyek" di samping Provinsi dan Organisasi; 2 sampai 4 proyek apa pun | baris kapasitas, status, COD, pemilik, pendanaan tampil berdampingan; tautan bisa dibagikan |
| 24 | Peta panas potensi vs terpasang | `/wilayah` | lapisan rasio terpasang dibagi potensi per provinsi | legenda bertingkat, angka per provinsi sama dengan tabel |
| 39 | Kalkulator kredit karbon dan REC | `/karbon` | emisi dihindari = energi kali faktor emisi sistem; nilai = volume kali harga yang diisi pengguna | hasil berlabel Hipotesis; faktor emisi dari data sistem yang ada |
| 40 | Simulasi pembiayaan campuran | `/investasi` model keuangan | porsi hibah, pinjaman lunak, komersial, ekuitas; WACC dan DSCR | jumlah porsi 100 persen dipaksa; hasil mengalir ke LCOE |
| 42 | Hemat vs diesel untuk desa | `/desa-energi` | biaya diesel per kWh dari harga BBM dan konsumsi spesifik isian pengguna dibanding LCOE PLTS plus baterai | tanpa angka bawaan tak bersumber (F4) |
| 43 | Pemeriksa insentif pajak | `/investasi#pembiayaan` | pertanyaan ya atau tidak dipetakan ke daftar insentif fiskal yang ada | tiap insentif menaut ke dasar hukumnya |
| 44 | Penaksir lahan dan izin | `/izin-kontrak` | luas lahan per MW per teknologi dan daftar izin per kelas kapasitas | rentang, bukan satu angka; sumber per teknologi |
| 45 | Baterai geser beban | `/investasi` model keuangan | kapasitas baterai, jam geser, selisih tarif isian pengguna | arus kas tahunan dan balik modal |
| 47 | Pembanding versi pasal | `/regulasi` | beda teks dua peraturan yang berelasi mengubah | tambahan dan hapusan ditandai teks dan warna |
| 51 | Peta kewenangan | `/regulasi` | tabel urusan energi per tingkat pemerintahan dari katalog hukum | tiap sel menaut pasal |
| 52 | Alur izin interaktif | `/izin-kontrak` | langkah berurutan per teknologi dari tanya jawab yang ada | tiap langkah punya dasar pasal dan perkiraan lama bila bersumber |
| 55 | Kartu skor janji vs realisasi | `/target#rapor` | janji kebijakan bertanggal dibanding realisasi | status tidak hanya warna |
| 63 | Pembanding pemasok per komponen | `/banding` | saringan komponen pada segmen Organisasi | TKDN, kapasitas, lokasi berdampingan |

## 3. Gelombang 2: tabel D1 dan rute Worker baru (18 butir)

| No | Fitur | Rumah | Lingkup | Selesai bila |
| --- | --- | --- | --- | --- |
| 90 | Survei pasca event | detail event | pakai ulang mesin survei keyakinan | hanya peserta terdaftar, sekali isi, agregat tanpa nama |
| 89 | Sertifikat kehadiran | detail event | pakai ulang perender kartu KTA | hanya peserta yang ditandai hadir; verifikasi lewat QR |
| 86 | Tiket dan QR masuk | detail event, admin event | tiket per pendaftar, pindai di admin | QR sekali pakai, tercatat jam hadir |
| 88 | Laporan jangkauan sponsor | admin event | kunjungan halaman event dan klik sponsor dari statistik yang ada | angka cocok dengan `/admin` statistik |
| 66 | Sertifikat akademi | `/panduan#akademi` | progres pindah dari peramban ke D1 | sertifikat hanya setelah semua kuis lulus |
| 67 | Kuis webinar | `/galeri#video` | kuis per rekaman | memakai mesin kuis akademi |
| 64 | Foto tonggak proyek | `/proyek` | unggah foto bukti oleh pemilik proyek, tinjau admin | magic byte dan batas ukuran sama dengan unggah agenda |
| 60 | Agregasi permintaan listrik hijau | `/pasar-listrik-hijau` | formulir minat korporat, agregat per wilayah | nama perusahaan tidak tampil publik tanpa izin |
| 56 | Pasar proyek cari investor | `/investasi` ruang investasi | pemilik proyek memasang kebutuhan dana, tinjau admin, kontak lewat pesan | penafian "bukan penawaran efek" tetap tampil |
| A | Pencocokan bisnis | `/saya`, `/investasi` | cocokkan pengembang ke pembiaya, EPC, pemasok dari teknologi, wilayah, ukuran | skor berlabel Hipotesis; perkenalan lewat pesan yang ada |
| M1 | Program mentor | `/portal` | daftar mentor, minta mentor, antrean admin | tanpa pengelola (C-04) berhenti di antrean |
| M2 | Forum per bidang | `/bidang` | utas dan balasan konsultasi dipakai ulang di luar naskah | sembunyi oleh admin, batas laju per akun |
| C | Lamaran lewat platform | `/kerja` | formulir minat tanpa CV (C-03) | pelamar bisa menarik lamarannya |
| M6 | Lencana verifikasi | profil organisasi | lencana legalitas, sertifikat, proyek setelah tinjau admin | lencana punya tanggal dan peninjau |
| 65 | Laporan warga proyek mangkrak | `/proyek#henti` | formulir untuk yang sudah masuk (C-08), antrean admin | laporan tidak tampil sebelum ditinjau |
| 61 | Pengingat tender | `/lelang` | ikuti putaran, surel saat tenggat mendekat | jalur surel yang ada (F7) |
| 49 | Peringatan regulasi | `/diikuti` | surel saat regulasi sektor yang diikuti bertambah | sama |
| 70 | Buletin mingguan otomatis | `/langganan`, admin surel | rakit dari ringkasan yang ada, admin menyetujui sebelum kirim | tidak ada kirim tanpa persetujuan admin |

## 4. Gelombang 3: bergantung pada hal di luar kode (19 butir)

| No | Fitur | Yang menahan | Yang bisa dibangun sekarang |
| --- | --- | --- | --- |
| M3 | Perpanjangan iuran QRIS dan faktur | C-01 | alur perpanjangan mandiri mode sandbox; faktur PDF |
| 59 | Pasar REC dan karbon | C-01, C-02 | papan minat tanpa uang |
| 87 | Pemesanan stan | C-01 | denah dan pesan tanpa bayar |
| B | Tenaga ahli tersertifikasi | C-05 | kolom sertifikasi isian sendiri berlabel "belum diverifikasi" |
| 22 | Deret kapasitas per provinsi | C-05 | kerangka grafik; tampil hanya tahun yang ada |
| 26 | Lapisan tata ruang | C-05 | tidak ada |
| 27 | Lapisan iradiasi dan angin | C-05 | titik per ibu kota provinsi yang sudah ada |
| 41 | Biaya interkoneksi | C-05 | jarak ke gardu yang sudah ada, biaya satuan isian pengguna |
| 53 | Kalender tenggat kepatuhan | C-05 | jenis acara sudah ada; isi menunggu data |
| 54 | Basis putusan dan sengketa | C-05 | tidak ada |
| 58 | Daftar lahan siap proyek | C-05 | tidak ada |
| 62 | Katalog produk ber-TKDN | C-05 | kolom sertifikat pada pabrikan |
| 72 | Transkrip podcast | C-05 | tidak ada |
| 57 | Ruang data uji tuntas | C-09 | tidak ada |
| 48 | Ringkasan AI per peraturan | C-06 | ringkasan berkutipan pasal lewat binding AI yang ada |
| 74 | Ringkasan berita harian | C-07 | ringkasan dari judul |
| 75 | Cek fakta klaim energi | C-04 | antrean klaim dan templat putusan |

Dua butir lain yang menunggu redaksi masuk gelombang 3 sebagai pekerjaan isi, bukan kode: 69 (studi kasus proyek besar) dan 71 (laporan tahunan cetak, tiket induk JM-P07).

## 5. Non-tujuan modul ini

- Tidak ada uang yang ditahan platform; pembayaran hanya lewat penyedia.
- Tidak ada data contoh di layar (K15).
- Tidak ada halaman baru untuk butir yang punya rumah di tabel atas.
