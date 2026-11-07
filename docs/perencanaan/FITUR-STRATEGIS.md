# Fitur strategis Direktori METI

Diperbarui 7 Nov 2026 malam, sebelum jeda 12 jam pemilik. Tujuan: Direktori METI menjadi rujukan utama data energi terbarukan Indonesia yang langsung dipakai pemerintah, investor, kampus, media, dan anggota METI.

## Prinsip
- Satu rumah per jenis data, setiap angka bersumber dan bertanggal.
- Halaman publik bisa ditautkan, dibagikan, dan ditemukan mesin pencari.
- Anggota mendapat nilai lebih (kontak, catatan kurator, berkas kerja).
- Tidak ada fitur yang membutuhkan data pribadi publik.

## Sudah ada
- Profil publik per organisasi `/o/<id>` dan per proyek `/p/<id>`, sitemap.xml.

## Gelombang 12 jam (dikerjakan sendiri, tanpa migrasi produksi, tanpa push)
| No | Fitur | Untuk siapa | Isi |
|---|---|---|---|
| 1 | Pencarian global (Ctrl/Cmd+K) di semua halaman | semua | proyek, organisasi, orang publik, regulasi, berita, provinsi dalam satu kotak, langsung ke profil |
| 2 | Data terbuka `/data` | peneliti, media | unduh CSV/JSON per dataset, kamus kolom, lisensi, cara mengutip, tanggal versi |
| 3 | Data peluang: potensi per teknologi per provinsi, BPP pembangkitan per wilayah, harga patokan Perpres 112/2022 | investor, pemda | dataset bersumber `public/data/peluang.json` |
| 4 | Peta peluang investasi | investor, pemda | celah potensi vs terpasang per provinsi, BPP vs harga patokan, proyek rencana tanpa pengembang |
| 5 | Pelacak kebijakan | anggota, advokasi | regulasi baru 90 hari, status RUU EBET, aturan yang mengubah/mencabut, tenggat |
| 6 | Bandingkan provinsi (2 sampai 4) | pemda, investor | tabel dan grafik berdampingan |
| 7 | Gambar OG per halaman dan per profil | semua | kartu bagikan rapi di WA/LinkedIn/X |

Keputusan pemilik 7 Nov malam: no.2 (data terbuka) dan no.7 (OG) batal; sisanya jalan.

## Gelombang 2 (12 jam, "krusial dan gila")
| No | Fitur | Isi |
|---|---|---|
| A | Halaman Peluang `/peluang` | peta celah potensi vs terpasang, BPP vs harga patokan, proyek tanpa pengembang, WKP, KEK, jarak ke gardu |
| B | Kalkulator kelayakan lokasi | klik titik di peta: radiasi surya/angin dari NASA POWER (API publik), BPP lokal, harga patokan, estimasi produksi tahunan, LCOE dan tarif, proyek dan gardu terdekat |
| C | Bandingkan provinsi | 2 sampai 4 provinsi berdampingan, tautan bisa dibagikan |
| D | Jejaring ekosistem | graf siapa terhubung dengan siapa: organisasi, proyek, program, pendana; di profil /o dan halaman sendiri |
| E | Lapisan data baru di layar | RUPTL di Proyek, WKP di Wilayah, karbon & pendanaan hijau, TKDN di Rantai |
| F | Pelacak target nasional | realisasi bauran EBT vs target KEN/RUPTL/NZE dalam grafik (bukan progress bar) |
| G | Lokasi lembaga lengkap | isi provinsi/kota 131 lembaga yang belum punya lokasi |

## Gelombang 3 (berorientasi keputusan, 7 Nov malam, pemilik pergi 12 jam)
| No | Fitur | Keputusan yang dibantu |
|---|---|---|
| H | Halaman Peluang `/peluang` | provinsi dan teknologi mana yang layak dikejar: celah potensi vs terpasang, harga patokan, proyek tanpa pengembang, kalkulator kelayakan tersemat |
| I | Pelacak target nasional | seberapa jauh dari target bauran EBT (KEN/RUPTL/NZE), MW per tahun yang dibutuhkan, investasi yang dibutuhkan (grafik, bukan progress bar) |
| J | Pelacak proyek bermasalah | proyek yang COD-nya lewat, berhenti, atau tanpa kabar 12 bulan; peringatan dini |
| K | Indeks kesiapan provinsi (Hipotesis) | skor terbuka: potensi, rasio pemanfaatan, RUED, proyek, BPP, kelistrikan; metode di /metode |
| L | Bandingkan provinsi | 2 sampai 4 provinsi berdampingan, tautan bisa dibagikan |
| M | Lembar keputusan per provinsi/teknologi | satu halaman ringkas siap cetak/PDF untuk rapat |
| N | Pipeline RUPTL untuk investor | per tahun COD, teknologi, IPP vs PLN, sistem; mana yang terbuka untuk swasta |
| O | Lapisan peta strategis | jaringan transmisi + gardu (OSM, ODbL), KEK dan kawasan industri, untuk kedekatan sambungan |

Data publik strategis yang dipanen: statistik PLN per provinsi (penjualan, pelanggan, rasio elektrifikasi), BPS (penduduk, PDRB, konsumsi per kapita), capaian bauran EBT ESDM, Global Solar/Wind Atlas (Bank Dunia, CC BY) per provinsi, OSM transmisi/gardu, daftar KEK (kek.go.id) dan kawasan industri, tender EBT di LPSE/PLN.
Butuh pemilik: Global Energy Monitor tracker (unduhan lewat formulir, agent tidak boleh mengisi), PDF IESR rantai pasok, Kepmen BPP.

## Gelombang 5 (usulan baru 7 Nov malam, belum diputuskan)
| No | Fitur | Keputusan yang dibantu |
|---|---|---|
| W | Radar tender dan peluang bisnis | tender EBT LPSE/PLN, lelang WKP, pengadaan IPP; saring teknologi/provinsi; untuk anggota |
| X | Pelacak insentif dan perizinan | insentif fiskal/nonfiskal per teknologi, alur izin (OSS) per jenis pembangkit, perkiraan lama |
| Y | Kalkulator PLTS atap | tagihan PLN -> kWp, penghematan, balik modal, kuota sistem |
| Z | PLTS terapung per waduk | luas genangan bendungan -> potensi MWp, proyek terdekat, gardu |
| AA | Listrik desa dan DRE | desa belum berlistrik + peluang PLTS komunal/mikrohidro + koperasi |
| AB | Pelacak pendanaan internasional | siapa mendanai apa (IATI, Bank Dunia, ADB, AIIB) per provinsi/teknologi |
| AC | Dasbor usulan kebijakan METI | 22 usulan METI: status tindak lanjut, regulasi terkait, berita |
| AD | Kalender konsultasi publik dan tenggat | RPP/Permen yang sedang dikonsultasikan, batas masukan, pengingat |
| AE | Penyaring risiko bencana lokasi proyek | banjir, longsor, gempa, karhutla di titik proyek (data BNPB/Posko) |
| AF | Uji tuntas cepat organisasi | profil, proyek, regulasi, berita negatif, afiliasi dalam satu lembar |
| AG | Pencari narasumber | pakar per topik untuk media/acara, kontak lewat sekretariat METI |
| AH | Lonceng pemberitahuan anggota | perubahan proyek/regulasi/organisasi yang dipantau, tanpa surel |
| AI | Pelacak biaya dan harga | harga modul, LCOE, harga patokan, harga karbon, tarif PLN dari waktu ke waktu |
| AJ | METI dalam angka | kontribusi anggota: kapasitas, proyek, investasi, tenaga kerja (agregat) |

Keputusan pemilik: dari gelombang 5 hanya W (radar tender) dan X (insentif & perizinan) yang jalan.

## Gelombang 6 (20 usulan tambahan, belum diputuskan)
| No | Fitur | Data |
|---|---|---|
| 1 | Pelacak RUED per provinsi: target RUED vs realisasi | Perda RUED, HEESI |
| 2 | Program dedieselisasi: daftar PLTD yang diganti EBT + peluang hibrida | PLN, RUPTL, berita |
| 3 | Kalkulator emisi terhindar dan kredit karbon proyek | faktor emisi grid per sistem ESDM |
| 4 | Penyaring lahan: kawasan hutan, konservasi, gambut di lokasi rencana | peta kawasan hutan KLHK (terbuka) |
| 5 | Perdagangan modul surya: impor/ekspor per negara | BPS ekspor-impor HS 8541 |
| 6 | Kartu skor komitmen perusahaan: target net zero, porsi EBT | laporan keberlanjutan publik |
| 7 | Pelacak hidrogen dan amonia hijau | proyek dari berita/siaran pers |
| 8 | Pelacak SPKLU dan kendaraan listrik | data SPKLU PLN, Korlantas/BPS |
| 9 | Pelacak komitmen internasional (JETP, NDC, COP) dan kemajuannya | dokumen resmi |
| 10 | Peta penolakan dan konflik sosial proyek | berita |
| 11 | Repositori dokumen publik per proyek (AMDAL, FS) | pengumuman AMDAL KLHK |
| 12 | Direktori sertifikasi dan lab uji (SNI, LSPro, LSP energi) | BSN, BNSP |
| 13 | Peta SDM hijau: prodi EBT, pelatihan bersertifikat per provinsi | PDDikti, BNSP |
| 14 | Ringkasan mingguan otomatis "apa yang berubah" di beranda anggota | data situs sendiri |
| 15 | Pembanding kebijakan ASEAN (lelang, tarif, target) | dokumen resmi ASEAN/negara |
| 16 | Kalkulator PLTS komunal desa/koperasi (beban jangkar, dana cadangan) | asumsi terbuka + data desa |
| 17 | Polling isu kebijakan untuk anggota | data situs sendiri |
| 18 | Dasbor keanggotaan METI (iuran, partisipasi acara) untuk admin | data anggota internal |
| 19 | Peta jalan per teknologi 2025-2060 (milestone kebijakan, target, proyek kunci) | RUPTL, RUKN, NZE |
| 20 | Pelacak lahan bekas tambang untuk PLTS | izin tambang berakhir (bila terbuka), berita |

## Informasi yang ditawarkan untuk ditambahkan (sumber publik)
- Potensi EBT per provinsi per teknologi (RUEN, ESDM/EBTKE, Geoportal ESDM).
- BPP pembangkitan per sistem/wilayah (Kepmen ESDM BPP terbaru) dan harga patokan Perpres 112/2022.
- RUPTL PLN 2025-2034: pipeline pembangkit EBT per sistem, tahun COD, kapasitas.
- Kuota dan realisasi PLTS atap per sistem PLN.
- Wilayah kerja panas bumi (WKP) dan status lelang.
- Daftar proyek JETP (CIPP) dan pendanaan iklim (green bond/sukuk hijau, ADB, World Bank, AIIB).
- Registri TKDN produk EBT (Kemenperin) untuk rantai pasok.
- Perdagangan karbon IDXCarbon dan sertifikat REC PLN.
- Kawasan industri dan KEK dengan kebutuhan listrik hijau.
- Jaringan transmisi dan gardu induk (peta OSM/PLN publik) untuk kedekatan sambungan.

## P2: berikutnya
| No | Fitur | Catatan |
|---|---|---|
| 8 | Rapor bulanan "Kondisi EBT Indonesia" (PDF/PNG) | dihasilkan dari potret |
| 9 | Indeks kesiapan provinsi (Hipotesis) | skor terbuka; metode di /metode |
| 10 | Pendaftaran anggota mandiri + verifikasi | ditunda per K19; butuh surel |
| 11 | Langganan pembaruan | butuh surel |
| 12 | API publik bertoken untuk mitra | baca saja, kuota |
| 13 | Mode pameran (layar besar acara METI) | putar otomatis sorotan, peta, angka |

## Butuh keputusan pemilik
- Migrasi produksi 0009 (tambah/ubah anggota dari Admin).
- Izin tampil publik data 1001startup (C-13).
- Foto pengurus yang belum ada di sumber publik.
- Daftar situs pusat studi energi kampus dan situs anggota swasta (untuk logo).
- Push ke main (tayang publik) setelah meninjau hasil 12 jam.
