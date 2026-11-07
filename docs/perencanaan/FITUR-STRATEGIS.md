# Fitur strategis Direktori METI

Disusun 7 Nov 2026 malam. Tujuan: Direktori METI menjadi rujukan utama data energi terbarukan Indonesia yang langsung dipakai pemerintah, investor, kampus, media, dan anggota METI.

## Prinsip
- Satu rumah per jenis data, setiap angka bersumber dan bertanggal.
- Halaman publik bisa ditautkan, dibagikan, dan ditemukan mesin pencari.
- Anggota mendapat nilai lebih (kontak, catatan kurator, berkas kerja).
- Tidak ada fitur yang membutuhkan data pribadi publik.

## P1: dikerjakan malam ini (tanpa migrasi produksi)
| No | Fitur | Untuk siapa | Isi |
|---|---|---|---|
| 1 | Profil publik per organisasi `/o/<id>` | publik, media, investor | logo, kategori, lokasi, proyek, pengurus publik, regulasi terkait, berita, sumber; OG image; tautan dari semua daftar |
| 2 | Profil publik per proyek `/p/<id>` | publik, investor | status, kapasitas, pemilik, program, lokasi di peta, linimasa COD, berita, sumber |
| 3 | Pencarian global ⌘K di semua halaman | semua | proyek, organisasi, orang publik, regulasi, berita, provinsi dalam satu kotak |
| 4 | Data terbuka `/data` | peneliti, media | unduh CSV/JSON per dataset, kamus kolom, lisensi, cara mengutip, versi bertanggal |
| 5 | Peta peluang investasi | investor, pemda | celah potensi vs terpasang per provinsi, proyek rencana tanpa pemilik, tarif dan BPP daerah |
| 6 | SEO dan bagikan | semua | sitemap.xml, robots, judul dan deskripsi per halaman, gambar OG per halaman dan per profil |
| 7 | Pelacak kebijakan | anggota, advokasi | status RUU EBET, regulasi baru 90 hari, aturan yang mengubah/mencabut, tenggat |

## P2: berikutnya
| No | Fitur | Catatan |
|---|---|---|
| 8 | Bandingkan (provinsi vs provinsi, organisasi vs organisasi) | pilih 2-4, tabel dan grafik berdampingan |
| 9 | Rapor bulanan "Kondisi EBT Indonesia" (PDF/PNG) | dihasilkan dari potret, siap dikirim ke anggota |
| 10 | Indeks kesiapan provinsi (Hipotesis) | skor terbuka: RUED, potensi, rasio, proyek, regulasi; metode di /metode |
| 11 | Pendaftaran anggota mandiri + verifikasi | ditunda per K19; butuh surel |
| 12 | Langganan pembaruan (proyek/provinsi/regulasi) | butuh surel; pakai Cloudflare Email Routing |
| 13 | API publik bertoken untuk mitra | baca saja, kuota |
| 14 | Mode pameran (layar besar acara METI) | putar otomatis sorotan, peta, angka |

## Butuh keputusan pemilik
- Migrasi produksi 0009 (tambah/ubah anggota dari Admin).
- Izin tampil publik data 1001startup (C-13).
- Foto pengurus yang belum ada di sumber publik.
- Daftar situs pusat studi energi kampus dan situs anggota swasta (untuk logo).
