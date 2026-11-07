# Dataset baru (panen A, B, C, J, K, L), 8 Nov 2026

Skrip di `scripts/pipa/`, uji di `tests/`, keluaran `public/data/<nama>.json`. Data mentah (`data-panen/`, `mentah/`, `raw/`, `pdf/`) pihak ketiga, tidak masuk repo. Hasil sudah dibangun ulang dari mentah dan identik byte dengan panennya. Pembantu: `_panen_umum.mjs` (C/K: angka, PDF, kode provinsi), `_panen_sopan.mjs` (J: robots, jeda, ambil), `_cocok.mjs`, `cocok_proyek.mjs`, `dataset_lib.mjs`.

| Dataset | Baris | Sumber dan lisensi | Celah utama | Usulan panel |
|---|---|---|---|---|
| pembangkit_osm | 515 | OpenStreetMap, ODbL 1.0 (atribusi + berbagi-serupa) | batu bara/gas/diesel/baterai belum terambil (Overpass); kapasitas sering null | peta proyek (lapisan "OSM, belum terverifikasi") + Proyek |
| gppd | 178 | WRI GPPD v1.3.0, CC BY 4.0 | berhenti 2021; tanpa surya/bayu | Proyek (pembanding), peta |
| ember_bulanan | 110 | Ember, CC BY 4.0 (tahunan, bukan bulanan) | tanpa bulanan Indonesia; panas bumi tak terpisah | Indikator / Tren nasional |
| kapasitas_tren | 209 (+73 pangsa) | IRENASTAT (atribusi IRENA), World Bank CC BY 4.0 | WDI sampai 2021; 2025 sementara | Tren nasional (garis kapasitas 2000-2025) |
| asean_energi | 10 negara | OWID/Ember CC BY 4.0, AEO9 kutipan | target, tarif, kebijakan per negara null | halaman ASEAN |
| pendanaan_internasional | 235 | IATI (lisensi tiap pelapor), World Bank CC BY 4.0 | AIIB, IFC, ADB langsung belum | Keuangan / Pendanaan |
| insentif | 12 | JDIH BPK (peraturan publik) | PP 78/2019, PMK 11/2020 tak ditemukan | Regulasi / Insentif |
| obligasi_hijau | 12 | DJPPR (publik), ANTARA (judul, angka, tautan) | sukuk 2018-2021 tak dirinci; idx.co.id | Keuangan |
| tarif_harga | 33 | ANTARA (judul, angka, tautan) | tarif Q4 2026 belum | Indikator / Tarif |
| jetp_cipp | 8 | Sekretariat JETP (fakta, atribusi) | daftar proyek CIPP 2023 tak terbaca (PDF terputus) | Keuangan / JETP, Proyek |
| karbon_proyek | 26 | VROD Berkeley CC BY 4.0 (asal Verra), Gold Standard publik | non-EBT dikeluarkan | Karbon (sudah ada karbon.json) |
| amdal | 160 | AMDALNET KLH/BPLH (pengumuman publik) | hanya judul memuat kata kunci EBT; pemrakarsa perseorangan null (103 null), akhiran " - nama" dibuang | Proyek (tahap perizinan), Perizinan |
| desa_listrik | 38 provinsi | Statistik Ketenagalistrikan 2024, ESDM | BPS Podes kabupaten tak ada | Wilayah (profil provinsi) |
| statistik_pln | 38 provinsi | idem | beban puncak, BPP null; hanya 2024 | Wilayah |
| emisi_provinsi | nasional + 38 | idem, Tabel 18 | emisi sektor energi per provinsi tak ada (SIGN SMART) | Wilayah / Karbon |
| desa_energi | 37 provinsi | Kemendes Satu Data, ODC-BY | daftar Desa Energi Berdikari tak dipanen | Wilayah |
| riset_kampus | 25 kampus | OpenAlex CC0 | hanya 25 teratas, kata kunci Inggris | Pakar / Riset |
| riset_ebt | 406 artikel, 21 provinsi | OpenAlex CC0, Garuda (metadata) | 5 halaman pertama per kueri | Pakar / Riset, Wilayah |
| prodi_pelatihan | 34 LSP EBT dari 68 | BNSP (direktori publik) | PDDikti, PPSDM tak terjangkau (prodi, lembaga = []) | Talenta / Pelatihan |
| rued | 27 perda (21 bertarget) | peraturan.bpk.go.id (domain publik) | 6 perda tanpa angka; MW per teknologi tak diekstrak | Wilayah (target RUED), Regulasi |
| penyedia_teknologi | 186 (146 terhubung, 40 kandidat) | organisasi.json, tkdn.json, `data/penyedia_aesi.json` (AESI) | angin, hidro, panas bumi, biogas, WtE tanpa sumber; kontak hanya surel/telepon kantor | Direktori penyedia / Rantai pasok |
| waduk | BELUM ADA | OSM ODbL + geoBoundaries | skrip `waduk.mjs --ambil` belum dijalankan (Overpass, jeda 8 dtk); uji dilewati sampai ada | PLTS terapung (Potensi) |

Tidak dipindah (kosong, hanya celah): `paten_ebt` (tak ada sumber paten terbuka yang bisa dibaca sopan; skrip dan uji tidak dibawa), `investasi_listrik` (BKPM/Kemendagri tak bisa diurai; mentah `bkpm_*.html` ada di panen J). `lowongan.json` dan `penyedia_teknologi` versi E (113 baris) tidak diambil; L (186 baris) lebih lengkap.

## RUED
Riau 2050 = 46,64 (teks perda 2/2022; heuristik panen lama 44,63 salah). Dikoreksi lewat `potret_wilayah.mjs` (`koreksiKandidat` memakai `rued.json` baris tanpa `perlu_tinjau`), bukan sunting tangan. Kalimantan Utara: Perda 3/2019 tanpa angka dan sudah digantikan; yang berlaku Perda 8/2025 (tabel kita benar). Angka 8/2025 (EBT 14% 2025, 25% 2034) hasil OCR kacau, `perlu_tinjau`, maka tidak dipakai menimpa wilayah.json: kandidat lamanya (2025=51, 2030=21,8) perlu ditinjau manusia.

## Atribusi dan privasi
Tiap sumber memuat `lisensi`. ODbL OSM wajib ditampilkan "© OpenStreetMap contributors" di tiap panel yang memakai `pembangkit_osm`/`waduk`. CC BY (GEM, GPPD, Ember, OWID, World Bank, VROD): tulis nama sumber. Sumber ANTARA: hanya judul, angka, tautan. `tests/cakupan.json` tidak ada di repo ini, jadi tidak ada yang didaftarkan.
