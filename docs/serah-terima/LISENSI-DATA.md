# Lisensi Data Pihak Ketiga

Dibuat 8 Nov 2026 untuk butir M1.5 audit serah terima. Dokumen ini inventaris teknis, bukan nasihat hukum; keputusan jual dan nasihat hukum ada di pemilik dan penasihat hukumnya.

Cara baca kolom "Status verifikasi": **V** = teks lisensi/syarat terbaca dari halaman resmi pada 8 Nov 2026 (URL di kolom Dasar). **S** = hanya dari kutipan mesin pencari atau halaman turunan; **T** = halaman resmi tidak dapat dibuka atau tidak memuat lisensi, perlu dicek ulang oleh manusia sebelum jual.

## 1. Tabel sumber

| Sumber | Berkas di repo | Lisensi | Atribusi wajib | Komersial | Status | Tindakan sebelum dijual |
| --- | --- | --- | --- | --- | --- | --- |
| Global Energy Monitor (GEM) | `data/gem/{coal,geothermal,hydropower,solar,wind}.json` (748 KB), `data/proyek_gem.json` (368 KB), `public/data/gem_pembangkit.json`, `public/data/pemangku/gem_*.json` (548 berkas dalam folder itu) | Halaman tracker GEM menyebut CC BY 4.0, tetapi: (a) rekaman berasal dari TransitionZero (kolom "TZ ID") CC BY-NC 4.0; (b) formulir unduh GEM meminta pengguna menyatakan tidak memakainya secara komersial dan menyediakan jalur "commercial exemption"; (c) `KEAMANAN-PRIVASI.md:190` menulis CC BY-NC-SA | Ya: kutip "Global Energy Monitor, nama tracker, rilis" | **Perlu izin** (tidak boleh dianggap bebas) | V sebagian, T untuk teks syarat unduh | **Tandai, jangan hapus (keputusan pemilik).** Minta izin tertulis GEM, atau pisahkan baris ber-TZ ID, atau cabut. Sampai selesai, jangan jual sebagai "bebas lisensi". Samakan dokumen: `sumber_katalog.json` menulis CC BY 4.0, `KEAMANAN-PRIVASI.md` menulis NC-SA; keduanya perlu satu pernyataan benar |
| OpenStreetMap (OSM) | `public/data/geo/jaringan_osm.geojson` (560 KB), `public/data/pembangkit_osm.json`, skrip `scripts/pipa/data_pemerintah_osm.mjs` | ODbL 1.0 | Ya: "(c) OpenStreetMap contributors" dan tautan hak cipta, terlihat di layar | Ya, dengan syarat berbagi-serupa untuk basis data turunan | V | Pasang atribusi di layar peta dan di kaki halaman; sediakan turunan basis data (berkas ini) sebagai terbuka ODbL; jangan dicampur ke data berlisensi tertutup tanpa pemisahan |
| Wikimedia Commons (foto) | `public/img/orang/`, `public/img/pengurus/`, `public/img/beranda/`, `public/img/tentang/`; kredit di `data/foto_orang_kredit.json`, `public/img/*/KREDIT.md`/`SUMBER.md`, `public/data/kredit_foto.json` | Per foto: CC BY 2.0/3.0/4.0, CC BY-SA 3.0/4.0, CC0, domain publik (PD-IDGov) | Ya untuk CC BY dan BY-SA: penulis, lisensi, tautan; tautan ke halaman berkas Commons memenuhi | Ya (BY dan BY-SA membolehkan komersial); BY-SA mewajibkan berbagi-serupa untuk adaptasi foto | V | Halaman `/kredit-foto` sudah menampilkan kredit (butir M1.6). Foto orang juga data pribadi/hak potret (UU PDP): putuskan foto ikut dijual atau tidak |
| Foto tokoh dari situs perusahaan/pemilik situs | `public/img/orang/` (sekitar 129 baris di `data/foto_orang_kredit.json` berlisensi "milik perusahaan/pemilik situs, tampil dengan atribusi") | **Tidak ada lisensi.** Hak cipta tetap pada pemilik; "tampil dengan atribusi" bukan lisensi | Ya, tetapi atribusi tidak menggantikan izin | **Perlu izin** per pemilik | T | Risiko tertinggi di tabel ini. Minta izin tertulis atau ganti foto/inisial sebelum jual; tampilkan hanya yang berizin |
| Wikidata | `data/internasional/wiki.json` dan hasil panen terkait | CC0 untuk data terstruktur | Tidak wajib (dianjurkan) | Ya | V | Tidak ada |
| Wikipedia (teks) | ringkasan/teks yang dipanen ke data internasional dan profil | CC BY-SA 4.0 | Ya: kreditkan, tautan lisensi, tandai perubahan | Ya, dengan berbagi-serupa | V | Pastikan teks yang disalin memuat atribusi dan tautan artikel; ringkasan sendiri tidak terikat |
| OpenAlex | `scripts/panen/openalex_kampus.mjs`, `public/data/riset*.json`, `pakar_riset.json`, `dataset_riset.json` | Dugaan CC0 (diketahui umum) tetapi halaman bantuan resmi yang dibuka tidak menyebutnya | Dianjurkan | Kemungkinan ya | **T** | Buka `https://help.openalex.org/` bagian lisensi/akses dan cocokkan; catat versi API dan batas laju untuk pembeli |
| UN Comtrade | `data/dagang_komponen/*.json`, `public/data/dagang_komponen.json`, `data/dagang_kebijakan/`, skrip `scripts/panen/*comtrade*.mjs` | Perjanjian lisensi UN Comtrade; penyebaran ulang data apa adanya (tanpa transformasi) di platform lain memerlukan langganan premium | Ya (cantumkan UN Comtrade) | **Perlu izin** untuk redistribusi mentah; angka turunan hitungan sendiri dinilai berbeda | S | Pastikan berkas hanya memuat agregat/turunan, bukan salinan baris mentah; hubungi `comtrade@un.org` bila ragu. Dasar: ringkasan hasil pencarian kebijakan Comtrade, perlu dibaca langsung di situs UN Comtrade |
| Ember | `public/data/ember_bulanan.json`, `scripts/pipa/ember_bulanan.mjs` | CC BY 4.0 | Ya: kreditkan Ember; logo perlu izin | Ya | V | Pasang atribusi Ember di layar; jangan pakai logo |
| Our World in Data (energy-data) | `public/data/biaya_listrik.json`, `kapasitas_tren.json` (dan tarikan `owid/energy-data`) | Karya OWID CC BY; data pihak ketiga (EI, EIA, Ember) mengikuti lisensi aslinya | Ya | Bergantung sumber asal | S | Cek per seri; pakai langsung dari Ember (CC BY 4.0) bila bisa |
| IRENA / IRENASTAT | `public/data/kapasitas_tren.json`, `biaya_listrik.json`, `keuangan_hijau` | Syarat penggunaan IRENA: salin/bagi untuk **nonkomersial** dengan atribusi; selain itu perlu izin tertulis; materi pihak ketiga bersyarat lain | Ya: IRENA, nama seri | **Perlu izin** untuk pemakaian komersial (`sumber_katalog.json` menulis "bebas dipakai", yang bertentangan dengan hasil ini) | S (halaman resmi 403; dari kutipan pencarian) | Baca syarat terbaru di `https://www.irena.org/terms-and-conditions`, minta izin ke `statistics@irena.org` untuk bagian yang dijual, dan koreksi kolom lisensi di katalog |
| WRI Global Power Plant Database | `public/data/gppd.json`, `scripts/pipa/gppd.mjs` | CC BY 4.0 (kode MIT) | Ya: World Resources Institute, Global Power Plant Database | Ya | V | Proyek tidak dipelihara sejak 2022; catat usia data |
| World Bank Open Data / API proyek | `public/data/kapasitas_tren.json`, pendanaan internasional | CC BY 4.0 (menurut katalog sumber repo) | Ya | Ya | T (belum dibuka ulang) | Cek `https://data.worldbank.org/summary-terms-of-use` |
| Katalog hukum / JDIH / peraturan.bpk.go.id | `public/data/hukum/katalog.json` (3,0 MB), `data/hukum/seed*.sql` (60 MB lebih), `src/hukum*.js` | Peraturan perundang-undangan tidak berhak cipta (UU 28/2014 Pasal 42 menurut ringkasan sekunder); teks resmi PDF tidak terbaca otomatis | Tidak wajib; cantumkan sumber | Ya untuk teks peraturan; anotasi/ringkasan sendiri milik METI | S | Baca Pasal 42 di teks resmi JDIH sebelum jual; simpan hanya fakta + tautan, bukan PDF situs pihak ketiga |
| 1001startup.id | `scripts/panen/panen_1001.mjs`, hasil di `public/data/organisasi.json` dan potret terkait | Situs menyatakan data kerja "tidak untuk unduhan publik; akses massal hubungi situs"; tidak ada syarat layanan yang ditemukan | Tidak jelas | **Perlu izin** untuk panen massal | V (catatan situs) / T (syarat) | Hentikan panen otomatis; minta izin tertulis atau buang kolom turunan 1001startup; pertahankan hanya fakta publik dari sumber resmi lain |
| BPS (Badan Pusat Statistik) | angka statistik di `public/data/*` bersumber BPS (wilayah, penduduk, PDRB) | Hak cipta BPS/Pemerintah; syarat pakai situs BPS mewajibkan kutipan (judul, tanggal akses, tautan) dan melarang kesan dukungan | Ya | Tidak disebut tegas | S (halaman daerah BPS, bukan pusat) | Pasang kutipan BPS di tiap angka; cek syarat pusat di `https://www.bps.go.id` sebelum jual |
| Kementerian ESDM / PLN / Ditjen Gatrik | `public/data/kelistrikan.json`, `statistik_pln.json`, `ruptl_pengembang.json`, `data/biaya_listrik/` | Publikasi pemerintah/BUMN; tidak ada lisensi terbuka eksplisit | Ya (cantumkan) | Tidak tegas, anggap perlu izin bila salinan tabel utuh | T | Simpan fakta dan angka kunci dengan tautan; hindari menyalin dokumen utuh |
| Berita media (ANTARA, Kontan, Jawa Pos, Liputan6, dll) | `public/data/berita.json`, `berita_foto.json`, `proyek_berita.json`, `data/internasional/antara.json` | Hak cipta masing-masing media | Ya: judul, media, tautan | **Perlu izin** untuk isi/foto; judul + tautan + fakta umumnya aman | T | Simpan hanya judul, tanggal, tautan, fakta; foto berita (`berita_foto.json`) dicabut kecuali berizin |
| Sumber lain di `sumber_katalog.json` (Gold Standard, Berkeley, IATI, JETP, SBTi, RE100, HKI, geoBoundaries, Climate TRACE, TKDN, DJPPR, KEK) | berkas dataset terkait | Beragam; kolom lisensi katalog kosong untuk 49 dari 81 baris | Ya | Beragam | T | Lengkapi kolom lisensi katalog baris demi baris sebelum jual |

## 2. Hal yang butuh keputusan pemilik

1. GEM: izin tertulis, pemisahan rekaman TZ ID, atau pencabutan. Repo ini tidak menghapus apa pun.
2. Foto tokoh tanpa lisensi (sekitar 129 baris): minta izin atau ganti dengan inisial.
3. 1001startup.id, IRENA, Comtrade: izin tertulis untuk bagian yang dijual.
4. Ketidaksesuaian dokumen: `sumber_katalog.json` (GEM "CC BY 4.0", IRENA "bebas dipakai") vs hasil verifikasi di atas.

## 3. Sumber halaman lisensi yang dipakai

- OSM: https://www.openstreetmap.org/copyright
- Ember: https://ember-energy.org/creative-commons/
- Wikidata: https://www.wikidata.org/wiki/Wikidata:Licensing
- Wikipedia: https://en.wikipedia.org/wiki/Wikipedia:Text_of_the_Creative_Commons_Attribution-ShareAlike_4.0_International_License
- Wikimedia Commons reuse: https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia
- WRI GPPD: https://github.com/wri/global-power-plant-database
- GEM (Solar tracker FAQ): https://globalenergymonitor.org/projects/global-solar-power-tracker
- IRENA: https://www.irena.org/terms-and-conditions (403 saat dibuka; isi dari ringkasan pencarian)
- UN Comtrade (re-dissemination): ringkasan pencarian atas https://comtradeplus.un.org/ ; belum terbaca langsung
- UU 28/2014: https://peraturan.go.id/files/uu28-2014bt.pdf (PDF terkompresi, Pasal 42 belum terbaca otomatis)
- 1001startup.id: https://1001startup.id/
- BPS: https://yogyakarta.bps.go.id/en/term-of-use (halaman daerah)
- CC: https://creativecommons.org/licenses/
