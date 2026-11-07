# Grand Design: Platform Jaringan METI

Dokumen kedua dalam urutan otoritas. Kalah dari `KEPUTUSAN-METI`; menang atas `RISET`, `PRD`, dan seterusnya. Versi 1, 7 Nov 2026.

## 1. Masalah

1. METI mengklaim 1.800+ anggota dan 20+ mitra, tetapi situs metiires.or.id hanya menampilkan 12 logo anggota dan 12 logo mitra. Tidak ada direktori, peta, pencarian, atau relasi (R4 §8).
2. Ekosistem EBT Indonesia tersebar: ESDM One Map hanya peta, IESR hanya riset, Satu Data hanya dataset. Tidak ada satu tempat gratis yang menghubungkan orang, lembaga, perusahaan, kampus, riset, proyek, pembiaya, dan regulasi (R6 §2).
3. Materi GIZ Yogyakarta (6 Nov 2026) sudah menyebut METI akan menginisiasi "direktori kontributor" dan "repositori pembelajaran DRE" (R3). Mandatnya ada, alatnya belum.
4. Angka EBT berbeda antar dokumen (potensi panas bumi 23,2 vs 23,9 vs 24 GW; dua versi SK pengurus). Tanpa atribut "per tanggal" dan "sumber", angka METI mudah dipatahkan (R3).

## 2. Tujuan

Satu platform tempat siapa pun bisa menjawab dalam satu menit, dengan sumber bertanggal:
- Siapa saja pemain EBT di Indonesia, per sektor, per provinsi, per rantai nilai?
- Siapa memasok siapa, siapa mendanai siapa, siapa mengatur apa?
- Proyek apa yang sudah jalan, di mana, berapa MW, siapa pengembangnya?
- Siapa pakar yang bisa diundang untuk isu X di provinsi Y?
- Apa posisi METI terhadap RUU EBET, Perpres 112/2022, RUEN, dan apa jejaknya?

## 3. Tiga sumber yang digabung

| Sumber | Yang diambil | Yang tidak diambil |
| --- | --- | --- |
| Direktori Jaringan Kebencanaan (poskokarhutla) | Seluruh kode: layar 8 tab (Donasi dibuang), pencarian global, profil berkartu, graf `simpul`/`sisi`, "Terhubung", peta MapLibre + panel tarik, daftar pendek + ekspor Excel/Word/PDF, hak koreksi, riwayat, tombol dummy, pipeline OpenAlex dan `hubung.mjs`, Worker berpenjaga sesi | Isi kebencanaan, data R2 BNPB, id Cloudflare, merek Centurisk97 |
| 1001startup.id | Isi dan cara penyajian: sensus berhitungan, rantai pasok "siapa memasok siapa", investor, kuadran dua sumbu, cerita data dengan Jawaban singkat, "Cara menghitung", "Cara mengutip", tanggal beku, skor keyakinan, label EST, sumber berlabel per butir | Gaya visual (tetap METI), teks dan estimasi mereka, logo massal |
| neraca-papua | Skema `entitas`/`fakta`/`ikatan` dengan `sumber_url`, `tanggal_periksa`, `tingkat_bukti`; build menolak baris tanpa sumber; laci rincian, lencana sumber | HTML tunggal 1,6 MB, render sinkron, tanpa uji |

## 4. Pilar

| Pilar | Isi | Padanan |
| --- | --- | --- |
| P1 Sensus EBT | Tabel perusahaan dan lembaga EBT berhitungan per sektor, profil bersumber, skor keyakinan | 1001 `/startups`, Lembaga direktori |
| P2 Jaringan | Pakar, tokoh, pengurus METI, kampus, riset, graf "Terhubung", peta | Pakar + Lembaga + Riset direktori |
| P3 Rantai dan modal | Rantai pasok (modul, inverter, baterai, EPC, IPP, offtaker), pembiaya dan investor, kuadran BUMN energi, listrik data center, energi desa dan koperasi | 1001 `/chain`, `/investors`, `/bumn`, `/data-center`, `/umkm` |
| P4 Wilayah dan proyek | Rapor provinsi (potensi, terpasang, rasio elektrifikasi, proyek, METI Wilayah, RUED), peta proyek dan pembangkit | Wilayah direktori, 1001 `/map` |
| P5 Kebijakan dan pengetahuan | Regulasi dan jejak isu (RUU EBET, Perpres 112, RUEN, RUPTL), pustaka kajian METI, cerita data, berita | Pustaka direktori, 1001 `/news`, `/research` |
| P6 Rumah METI | Akun, peran, RLS, admin, kurasi, klaim dan koreksi, riwayat dengan METI, agenda dan pelantikan METI Wilayah | Riwayat + staf direktori |

## 5. Peta layar

| Rute | Layar | Pertanyaan yang dijawab | Lapis | Fase |
| --- | --- | --- | --- | --- |
| `/` | Beranda sensus | Berapa pemain EBT tercatat, apa yang baru | Publik | F1 |
| `/perusahaan` | Sensus perusahaan dan lembaga | Siapa saja, per sektor dan provinsi | Publik | F1 |
| `/p/<slug>` | Profil entitas | Siapa dia, apa buktinya, terhubung ke siapa | Publik (+kontak Pengurus) | F1 |
| `/rantai` | Rantai pasok | Siapa memasok siapa | Publik | F2 |
| `/pembiaya` | Pembiaya dan investor | Siapa mendanai EBT, berapa | Publik | F2 |
| `/bumn` | Kuadran BUMN energi | Di mana posisi tiap BUMN energi | Publik | F2 |
| `/data-center` | Listrik data center | Dari mana listrik data center | Publik | F2 |
| `/desa` | Energi desa dan koperasi | PLTS desa, KDMP, DRE | Publik | F2 |
| `/peta` | Peta proyek dan entitas | Di mana semuanya | Publik | F1 |
| `/wilayah/<prov>` | Rapor provinsi | Kondisi EBT provinsi ini | Publik | F2 |
| `/kebijakan` | Regulasi dan jejak isu | Aturan apa, posisi METI apa | Publik | F2 |
| `/cerita` | Cerita data | Satu pertanyaan, satu jawaban bersumber | Publik | F2 |
| `/metode` | Metode, sumber, skor | Bagaimana angka dihitung | Publik | F1 |
| `/direktori` | Direktori anggota (port langsung 8 tab) | Pakar, lembaga, riset, pendanaan, pustaka | Anggota | F0 |
| `/masuk` | Login | | Semua | F0 |
| `/admin` | Akun, peran, kurasi, antrean koreksi, jejak | | Admin | F0 |

## 6. Arsitektur singkat

```
Pipeline (GitHub Actions, Python stdlib + Node)      Worker (Cloudflare)                Layar (vanilla JS)
 panen OpenAlex, OSM, Ember, IRENA, WB, BPK/JDIH      /api/* berpenjaga hak.js            ID/EN, MapLibre, SVG
 + kurasi D1 (entitas/fakta/ikatan)            ──>   R2: potret per lapis            ──>  sensus, profil, peta
 hubung.mjs -> graf.json, potret publik/anggota       D1: akun, sesi, peran, kurasi,      admin, direktori
 jaga_unggah -> R2                                       klaim, koreksi, riwayat, jejak
```

## 7. Fase dan gerbang

| Fase | Isi | Lulus bila |
| --- | --- | --- |
| F0 Porting | Repo, Worker, D1, R2, login, admin akun, RLS, direktori lama jalan dengan data contoh METI, i18n kerangka | Uji RLS hijau, `/direktori` tampil 1280 dan 390 px, tombol dummy jalan |
| F1 Sensus | Panen gelombang 1, kurasi, sensus perusahaan, profil bersumber, peta, metode | 300+ entitas bersumber, 0 baris tanpa sumber, skor keyakinan tiap profil |
| F2 Rantai dan cerita | Rantai pasok, pembiaya, BUMN, data center, desa, wilayah, kebijakan, cerita data | Tiap halaman punya Jawaban singkat + Cara menghitung + tanggal beku |
| F3 Terbuka | Klaim profil, daftar mandiri, API terbuka, pencocokan kebutuhan | Disetujui Pengurus Harian (C-01) |

## 8. Ukuran keberhasilan

| Kode | Ukuran | Sasaran F1 | Sumber hitung |
| --- | --- | --- | --- |
| U1 | Entitas bersumber | 300+ | potret publik |
| U2 | Fakta tanpa sumber | 0 | `jaga_unggah` |
| U3 | Ikatan antar entitas | 1.000+ | `graf.json` |
| U4 | Halaman dengan Jawaban singkat | semua halaman publik | gerbang teks |
| U5 | Uji RLS (sel matriks) | 100% hijau | `npm run uji` |
| U6 | Teks antarmuka EN | 100% kunci terisi | gerbang i18n |

## 9. Larangan

Tanpa data pribadi di lapis Publik atau di repo. Tanpa angka tanpa sumber dan tanggal. Tanpa menyalin teks, estimasi, atau logo pihak lain secara massal. Tanpa panen situs yang melarang robot (ESDM One Map, SINTA) tanpa izin. Tanpa kiriman otomatis ke luar. Tanpa titik tengah sebagai pemisah teks. Tanpa menyebut METI "netral" di teks antarmuka.
