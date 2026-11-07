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
