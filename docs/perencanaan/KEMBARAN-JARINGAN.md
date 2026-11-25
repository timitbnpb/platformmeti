# Kembaran Jaringan: kontrak fitur

Diputus pemilik 24 Nov 2026 (KEPUTUSAN D-KJ). Halaman `/jaringan` mendapat kembaran data publik jaringan tegangan tinggi Indonesia: saluran, gardu induk, dan pembangkit sebagai objek yang saling terhubung. Acuan konsep: Foundry IDN-GRID. Yang ditiru metodenya, bukan rupa, teks, kode, atau angkanya. Semua angka dihitung ulang dari sumber publik kita sendiri.

## 1. Lingkup

| Masuk | Tidak masuk |
| --- | --- |
| Tab **Peta** jadi **Kembaran**: klik ruas atau gardu, keluar kartu fakta | Kotak tanya, obrolan, tombol pertanyaan ("Bagaimana kalau terputus?", "Tanyakan soal ini"). Hasilnya ditampilkan langsung di kartu |
| Blok **Kalau terputus** dihitung statis per ruas | Model bauran per jam, aliran per jam, prakiraan cuaca |
| Tab baru **Ontologi**: tujuh lapis, tumpukan, jejak, tabel per lapis | API publik berkunci |
| Tab baru **Ringkasan jaringan**: bab bernomor | Bab "yang bertambah sejak 2021" (butuh BIG Satu Peta, tiket KJ-09 antre) |
| Neraca tahunan per wilayah PLN (produksi vs penjualan, Statistik 2024) | Aliran antarprovinsi per jam |
| Tab **Bauran** tahunan: bauran energi per bahan bakar per sistem dan provinsi (Statistik 2024), intensitas karbon tahunan (langsung dan daur hidup) dihitung dari faktor terbitan, di samping angka terbitan (RUPTL, ESDM FE 2019) | Garis waktu, tombol putar, pita rentang per jam |
| Tab **Aliran** tahunan: neraca provinsi (mengekspor/mengimpor/hampir seimbang), panah antarprovinsi dalam satu sistem dengan bobot sirkit yang melintas batas, label `hitung`; panel per sistem dan per provinsi (asal listrik, batas provinsi ini) | |
| Mode peta Kembaran: warna per tegangan, warna per sistem (label bernomor), sorot jalur tunggal (label bernomor + jumlah gardu di belakangnya) | |

## 2. Status fakta

Tiap fakta di potret punya `st` dari empat nilai. Chip tampil di kartu, tabel, dan bab.

| `st` | Label ID | Label EN | Arti |
| --- | --- | --- | --- |
| `sumber` | Bersumber | Sourced | Ada sumber publik yang menyebutnya |
| `hitung` | Dihitung | Computed | Hasil hitungan atau analisis graf dari fakta lain |
| `menunggu` | Menunggu data operator | Awaiting operator data | Butuh data PLN; tampil sebagai baris kosong |
| `est` | Perkiraan | Estimate | Dipakai hanya bila tak terhindarkan, selalu berlabel |

Tiap fakta juga wajib punya `src` (id sumber di `meta.sumber`) dan `tgl` (tanggal data). Tanpa itu, gerbang menolak potret.

## 3. Tujuh lapis ontologi

| # | Lapis | id | Isi | Relasi ke lapis bawah |
| --- | --- | --- | --- | --- |
| 1 | Operator | `op` | Pengelola dari tag OSM `operator` dan pemilik pembangkit (GEM, PLTU) | mengelola |
| 2 | Sistem kelistrikan | `sis` | Komponen terhubung graf, panjang >= 50 km | mencakup |
| 3 | Provinsi | `prov` | 38 provinsi (`public/geo/provinsi.json`) | berisi |
| 4 | Pembangkit | `pb` | `pltu.json` + `gem_pembangkit.json` + `pembangkit_osm.json`, dedup jarak < 2 km dan jenis sama | tersambung ke |
| 5 | Gardu induk | `gi` | OSM `power=substation` >= 66 kV | dihubungkan |
| 6 | Jalur | `jl` | Rantai ruas antara dua gardu (gardu ke gardu) | terdiri dari |
| 7 | Ruas saluran | `rs` | Tiap way OSM `power=line|cable` >= 66 kV | |

## 4. Algoritma pipa (`scripts/pipa/graf_jaringan.mjs`)

Masukan: mentah Overpass di luar repo (`../platformmeti-mentah/osm-kembaran/u_*.json`, dipanen `TEG_MIN=66 node scripts/pipa/data_transmisi.mjs ambil <dir>`), `public/geo/provinsi.json`, tiga berkas pembangkit, `public/data/statistik_pln.json`.

1. **Simpul.** Tiap ujung ruas dan tiap titik bersama antar-ruas jadi simpul. Ujung ruas dalam jarak 400 m dari pusat gardu atau di dalam poligon gardu ditempel ke gardu itu. Ujung yang berdekatan < 150 m dengan ujung ruas lain digabung. Tiap penempelan yang disimpulkan dicatat (`sambung_simpul[]`, `st: hitung`).
2. **Sistem.** Komponen terhubung (union-find). Sistem < 50 km jadi `potongan_kecil` (dihitung, tidak didaftar). Nama sistem: Jawa-Bali, Sumatera, dan seterusnya untuk dua terbesar per pulau; selain itu nama kota terbesar dekat pusat (gardu terbanyak) dengan awalan "Sistem".
3. **Jalur.** Graf gardu: simpul gardu, sisi = rantai ruas tanpa gardu di tengah. Sirkit jalur = maks tag `circuits` (atau `cables`/3) pada ruasnya, null bila tak tercatat.
4. **Jalur tunggal.** Jembatan graf (Tarjan, iteratif, bukan rekursif). Untuk tiap jembatan: sisi yang lebih kecil (jumlah gardu; seri: MW lebih kecil) = "di belakangnya" (diubah 24 Nov 2026: aturan "sisi tanpa pembangkit terbesar" memberi ratusan gardu di belakang ruas pendek di tengah sistem). Hitung gardu, MVA tercatat (null bila tak ada), MW pembangkit PLN (tanpa captive) di belakangnya.
5. **Pembangkit ke gardu.** Tiap pembangkit ditempel ke gardu terdekat di sistemnya bila jarak <= 15 km, selain itu `gi: null` (tidak masuk "di belakangnya").
6. **Provinsi.** Titik-dalam-poligon untuk gardu, pembangkit, dan titik tengah ruas; ruas yang melintas batas mendapat dua provinsi.
7. **Neraca wilayah PLN.** Produksi PLN 2024 per provinsi dijumlah per `wilayah_pln`, dibanding penjualan; selisih = `hitung`, label tegas: memuat susut dan pemakaian sendiri, bukan aliran terukur.

8. **Bauran tahunan.** Produksi PLN 2024 per jenis per provinsi dijumlah per sistem (provinsi masuk sistem tempat gardunya berada; provinsi lintas sistem dibagi menurut MW pembangkit). Intensitas = sum(energi x faktor) / sum(energi), faktor langsung (IPCC 2006 V2 Bab 2 + ESDM pedoman 2018) dan daur hidup (IPCC AR5 WG3 A.III.2), tiap faktor dengan `src`. Pembanding terbitan: RUPTL 2025 dan ESDM FE 2019 per sistem bila ada di `public/data`.
9. **Aliran tahunan.** Neraca provinsi = produksi - (penjualan + susut nasional %) dengan penjualan per provinsi dari BPS/Statistik bila ada, selain itu dari wilayah PLN dibagi menurut produksi; "hampir seimbang" bila |neraca| < 5 % konsumsi. Batas antarprovinsi = pasangan provinsi yang dilintasi ruas dalam satu sistem, dengan jumlah sirkit per tegangan. Arah dan besar aliran tahunan rata-rata (MW = GWh/8,76) disebar dari surplus ke defisit lewat batas dengan bobot sirkit x kV (aliran DC kasar, Laplacian graf provinsi); semua `st: hitung`, kalimat batas wajib tampil.

10. **Panen semua sumber (pemilik 24 Nov 2026).** Selain OSM saluran/gardu: (a) BIG Satu Peta / Ina-Geoportal layanan ArcGIS REST publik: saluran transmisi, gardu induk (MVA, tahun operasi), pembangkit; (b) OSM `power=plant|generator` semua bahan bakar termasuk gas dan diesel; (c) GEM GIPT hanya bila ada unduhan publik tanpa formulir, selain itu tetap KJ-10. Mentah di luar repo, robots.txt dihormati, jeda antar permintaan. BIG mengisi MVA dan tahun gardu (`st: sumber`, src BIG) dan menambah objek yang tak ada di OSM (ditandai asal).
11. **Integrasi dengan data yang sudah ada.** Tiap objek kembaran ditautkan ke entitas direktori bila cocok, sebagai `tautan: {jenis, id, url}`: operator -> `organisasi.json` (cocok nama/alias, termasuk `pemilik.org_id` di `pltu.json`); pembangkit -> `pltu.json` (id GEM), `gem_pembangkit.json`, `pembangkit_osm.json` (`proyek_id` -> pelacak proyek), `ruptl.json`; provinsi -> halaman wilayah/profil provinsi yang ada; sistem -> `sistem_pln.json` (beban puncak, BPP, susut, interkoneksi) dan `keandalan.json`. Cocok ragu tidak ditautkan otomatis, masuk `ragu[]` di meta. Kartu Kembaran menampilkan tautan "Lihat di direktori", dan halaman entitas tidak diubah di tiket ini.

12. **Fakta terbitan (kurasi, `data/kembaran/terbitan.json`).** Dikumpulkan dari dokumen publik, tiap baris punya `src` dengan URL, penerbit, tanggal terbit, tanggal baca, lisensi: (a) `sambungan_diketahui[]`: sambungan yang ada menurut sumber publik tapi tak ada di peta OSM (contoh kabel Suramadu Kedinding-Bangkalan), ditambahkan ke graf dengan tanda `asal: terbitan`, sehingga jalur tunggal palsu hilang; (b) `peristiwa[]`: saluran, gardu, kabel yang mulai beroperasi, dibangun ulang, atau dipulihkan 2024-2026 dari siaran pers PLN/ESDM dan media (bahan bab "yang bertambah"); (c) `batas_terbit[]`: batas kemampuan sambungan yang terbit (kabel laut); (d) `kiriman_terbit[]`: angka kiriman antarwilayah pada beban puncak dari RUPTL 2025-2034 sebagai pembanding aliran, dengan catatan sebanding atau tidak; (e) `pembanding_emisi[]`: angka RUPTL dan ESDM FE 2019 per sistem; (f) `angka_pln[]`: kms, MVA, MW terpasang, beban puncak Statistik PLN 2024. Diutamakan dokumen yang sudah ada di `public/data/dokumen/` dan `public/data/resmi/`.

Determinisme: urutan keluaran diurut id; dua kali jalan dari mentah yang sama menghasilkan byte yang sama (diuji).

## 5. Keluaran (potret statis, lapis publik)

| Berkas | Isi | Batas ukuran (gzip) |
| --- | --- | --- |
| `public/data/kembaran/ringkas.json` | `meta` (tanggal, sumber[], atribusi, celah[]), `angka` sekilas, `lapis[7]` (id, jumlah), `sistem[]`, `tegangan[]` (km per kelas), `tunggal_teratas[]` (20), `neraca[]`, `menunggu[]` (5 baris kosong) | 40 KB |
| `public/data/kembaran/objek-inti.json` | `op[]`, `sis[]`, `prov[]`, `pb[]`, `gi[]`, `jl[]` tanpa geometri dan tanpa fakta, id relasi ke atas/bawah (dipecah 25 Nov 2026 demi waktu muat) | 150 KB |
| `public/data/kembaran/objek-rs.json` | `rs[]` ruas + `jl_rs` (ruas per jalur), dimuat sesudah inti | 250 KB |
| `public/data/kembaran/objek-fakta.json` | `fakta{<id>: [{k, v, sat, st, src, tgl}]}` + `sambung_simpul`, dimuat saat kartu dibuka | 300 KB |
| `public/data/kembaran/energi.json` | `bauran[]` per sistem dan provinsi (GWh per jenis, persen, intensitas langsung dan daur hidup, pembanding terbitan), `faktor[]`, `neraca[]` per provinsi, `batas[]` antarprovinsi (sirkit per kV, aliran MW, arah), `aliran_sistem[]` (aliran terbesar per sistem) | 60 KB |
| `public/geo/kembaran.json` | geometri ruas `{id, kv, c:[[lng,lat]...]}` dan titik gardu/pembangkit, 4 desimal | 900 KB |

Skema baris inti:

- `sis`: `{id, nama, km, gi, mw_pln, mw_captive, kv_maks, prov[], bbox, warna_kelas}`
- `rs`: `{id, nama, kv, sirkit, km, sis, prov[], jl, tunggal, belakang:{gi, mva, mw}|null, osm}`
- `gi`: `{id, nama, kv, sis, prov, mva, tahun, jl[], pb[], satu_masuk}`
- `jl`: `{id, a, b, rs[], kv, sirkit, km, tunggal, belakang}`

Atribusi wajib: OSM ODbL, GEM CC BY 4.0, ESDM.

## 6. Layar

Semua di `/jaringan`, modul malas per tab, token DS METI, ID dan EN.

1. **Kembaran** (`jr_peta.js` diperluas, `?tab=peta`): lapis ruas diwarnai per kelas tegangan (500, 230-275, 115-150, 66-70, tak tercatat), legenda bawah. Klik ruas/gardu/pembangkit: sorot, panel kartu berisi jejak (Jaringan Indonesia > Sistem > Provinsi), judul, 3 angka (tegangan, panjang, sirkit), blok **Kalau terputus** (gardu di belakangnya, MVA, MW, sirkit, kalimat penjelas, chip, tanggal, catatan "menurut peta publik"), baris **Menunggu data operator**, dan daftar **Semua fakta (n)** yang bisa dibuka. `?fokus=<id>` membuka objek langsung. Lapis lama (antar-pulau, lintas negara) tetap.
2. **Ontologi** (`jr_ontologi.js`, `?tab=ontologi`): tumpukan 7 pelat isometrik (SVG, objek digambar dari koordinat nyata, disederhanakan), label lapis + jumlah + kata relasi. Klik lapis = tabel lapis itu; klik objek = jejak menelusur ke lapis berikutnya. Panel kanan: jejak, judul lapis, kotak cari, jumlah, tabel berurut dengan tombol **Peta** (ke Kembaran `?fokus=`). Tabel sistem: nama + garis warna kelas, panjang km, gardu, MW PLN tanpa captive, kV tertinggi.
3. **Ringkasan jaringan** (`jr_ringkasan.js`, `?tab=ringkasan`): bab 1 Sekilas (km per kelas tegangan, gardu, pembangkit tercatat, MW PLN tanpa captive, MVA BIG, pembanding kms Statistik PLN dengan catatan beda ukuran), 2 Sistem terpisah (daftar bernomor + batang komposisi kV + tooltip km per kV, potongan kecil), 3 Jalur tunggal (8 teratas "gardu di belakangnya" + n lainnya, sambungan dari terbitan yang menghapus jalur tunggal palsu), 4 Yang bertambah sejak 2021 (km OSM yang tak ada di BIG per pulau dan per kV + daftar "Diumumkan sejak 2024" dari `peristiwa`), 5 Neraca tahunan wilayah PLN, 6 Yang tidak terlihat dari data publik (5 baris menunggu + histogram gardu menurut tahun mulai operasi BIG), 7 Cara kami membuatnya + "Diterbitkan PLN" (`angka_pln`). Tiap bab: judul, 1 kalimat jawaban, ubin angka, daftar teratas + "n lainnya", chip status + id sumber, tanggal, tautan "Berikutnya: <bab>" di akhir.

4. **Bauran** (`jr_bauran.js`, `?tab=bauran`): peta sistem diwarnai intensitas karbon tahunan (skala 400-1.150 g/kWh, abu = tidak dihitung), sakelar Langsung/Daur hidup, panel Indonesia (intensitas rata-rata berbobot energi, persen rendah karbon, persen batu bara), daftar sistem dari paling bersih dengan batang bauran; klik sistem = rincian per jenis (persen + GWh) dan blok "Angka yang sudah terbit di samping angka kami". Pengganti grafik per jam: grafik tren tahunan intensitas dan bauran bertumpuk per jenis untuk tahun yang punya data terbit (minimal 2023-2024; tahun tanpa data tidak digambar), dengan legenda warna bahan bakar yang sama di semua tab. Baris penutup "Data operasi PLN per jam: menunggu data operator".
5. **Aliran** (`jr_aliran.js`, `?tab=aliran`): provinsi diwarnai neraca (mengimpor ungu, mengekspor hijau, skala token), panah antarprovinsi dengan label MW, tanda kabel laut terbatas; sakelar Neraca/Karbon dipakai; panel daftar sistem dengan aliran terbesar; klik sistem = beban/aliran terbesar + daftar provinsi; klik provinsi = dibangkitkan vs dipakai, asal listrik, batas provinsi ini (sirkit per kV, MW). Semua berlabel tahunan 2024 dan `Dihitung`. Batang per provinsi bersegmen: dibangkitkan dan dipakai di sini (abu), dikirim keluar (hijau), didatangkan (ungu), tidak tertutup daftar pembangkit kami (arsir, bila produksi terbit + aliran masuk < konsumsi); legenda di bawahnya. Panel sistem memuat blok **Dicek dengan angka terbitan PLN**: per baris `kiriman_terbit`, angka kami vs angka terbitan dengan arah, selisih MW dan persen, tanggal beban puncak, chip id sumber, chip "sebanding langsung" / "tidak sebanding langsung" / "berlawanan arah", kalimat alasan tidak sebanding, dan bila kena batas kabel: angka tanpa batas itu.
6. **Mode peta Kembaran** (bagian dari KJ-05): sakelar Tegangan / Sistem / Jalur tunggal; mode Sistem memberi label bernomor dan legenda nama sistem; mode Jalur tunggal menyorot ruas tanpa jalur kedua (merah muda) dan satu sirkit (merah), label bernomor 8 teratas, tombol Atur ulang peta.

7. **Rincian wajib (dari acuan 24 Nov 2026).**
   - Kartu Kembaran ada untuk ketujuh jenis objek. Operator: km saluran, gardu, MW pembangkit. Provinsi: jejak `Jaringan Indonesia > <pulau>`, km, gardu, MVA trafo (`menunggu` bila tak tercatat). Sistem: km, gardu, MW PLN, kV tertinggi. Pembangkit: bahan bakar, MW, unit pertama, pemilik, gardu tersambung.
   - Mode Jalur tunggal: ruas tanpa jalur kedua (merah muda), satu sirkit tanpa jalur kedua (merah), gardu dengan satu jalur masuk ditandai cincin; panel angka 8/545/357 versi kita (ruas satu sirkit, jalur tanpa jalur kedua, gardu satu jalur masuk dari total) dan daftar "Gardu induk di belakangnya" bernomor dengan batang.
   - Ontologi: memilih objek mengubah tiap label lapis jadi "<n> terkait" (hijau), menggambar garis penghubung lintas pelat ke objek terkait, dan meredupkan objek lain; hover objek di pelat = tooltip nama + jenis + angka utama; jejak bertumpuk (Seluruh jaringan > Sistem > Provinsi > ...) dengan tombol "Buka <nama> di peta". Tabel per lapis: Operator (nama, km, gardu, MW); Sistem (nama + garis warna, km, gardu, MW PLN tanpa captive, kV tertinggi); Provinsi (nama, km, gardu, MVA, pulau); Pembangkit (nama + provinsi, bahan bakar, MW terurut turun, unit pertama, sistem); Gardu (nama, kV, MVA, sistem, provinsi, jalur masuk); Jalur (nama a ke b, kV, sirkit, km, tunggal); Ruas (nama, kV, sirkit, km). Filter dropdown Sistem dan Provinsi pada lapis 4 sampai 7. Kolom bisa diurutkan.
   - Pembangkit yang belum tersambung ke sistem tampil "-" di kolom sistem, tidak disembunyikan.

8. **Sumber** (`jr_sumber.js`, `?tab=sumber`): status fakta (4 chip dan artinya), tanggal data per sumber, cara kami menghitung kembaran, bauran tahunan, dan aliran tahunan (langkah bernomor, data yang dipakai per langkah dengan chip id sumber), tabel "seberapa dekat" (intensitas dari energi terbitan vs RUPTL vs ESDM FE 2019 per sistem; aliran tahunan vs kiriman RUPTL dengan kolom sebanding), "yang tidak dihitung", atribusi, lalu daftar sumber lengkap (id, judul, penerbit, tanggal, lisensi, tombol Buka sumber). Chip id sumber di semua tab menaut ke baris di sini (`?tab=sumber#src-<id>`).
9. **Peta Kembaran saat diperbesar:** label nama gardu (GI/GITET) dan pembangkit muncul mulai zoom 9, pembangkit berupa titik berwarna bahan bakar dengan ukuran menurut MW; ruas yang dipilih disorot merah.

10. **Ontologi, perilaku yang harus benar (cacat yang terlihat di acuan, jangan ditiru).**
   - Jejak = jalur telusur yang sah. Memilih objek yang terkait dengan objek terakhir menambah satu langkah; memilih objek yang tidak terkait (misal operator lain dari pelat operator) mengganti jejak jadi `Seluruh jaringan > <objek itu>`, bukan menumpuk operator di belakang sistem yang tak berhubungan. Klik langkah jejak memotong jejak sampai langkah itu.
   - Hitungan "terkait" konsisten lintas lapis: bila ada ruas terkait maka jalur dan gardu yang memuat ruas itu ikut terhitung (tidak boleh "0 terkait" di lapis Jalur sementara Ruas 1.059 terkait). Diuji dengan invarian di fixture.
   - Lapis objek terpilih sendiri menampilkan objek itu (1), bukan tabel kosong "0 objek"; tabel bawaan sesudah memilih objek = lapis terkait terdekat yang tidak kosong.
   - Kosong yang sah (memang tak ada data terkait, misal operator captive tanpa sistem) memakai kalimat yang menjelaskan sebabnya ("Pembangkit ini tidak tersambung ke sistem mana pun di peta publik"), bukan saran mengubah pencarian.
   - Sistem yang dikelola PLN = semua sistem yang memuat ruas/gardu ber-operator PLN, bukan hanya 10 teratas.

INP: tabel besar dipaginasi (50 baris) dan cari di-debounce; objek-rs.json dimuat lewat `nanti()` sesudah inti, objek-fakta.json saat kartu dibuka.

## 6b. Tata letak (pemilik 25 Nov 2026, pilihan A "peta penuh")

`/jaringan` jadi aplikasi peta layar penuh, tetap satu halaman dan satu rute:
- Mode peta: peta selebar viewport di bawah kepala situs (tinggi `100dvh` dikurangi kepala, dengan fallback). Pil tab melayang di atas peta: Kembaran, Bauran, Aliran (ketiganya berbagi SATU instans MapLibre; ganti tab = ganti lapis dan panel, bukan muat ulang peta). Satu panel kiri yang bisa dilipat (lebar ~380 px; di <= 768 px jadi lembar bawah yang bisa ditarik) memuat isi panel tab aktif; kartu objek terbuka di panel yang sama (dengan tombol kembali), bukan panel kanan kedua. Legenda dan sakelar mode di bawah peta.
- Mode baca: pil tab yang sama memuat Ontologi, Ringkasan, Sumber, dan "Rencana dan kebijakan" (sembilan tab lama: Rencana RUPTL, Antar-pulau, ASEAN dan lintas negara, Penyimpanan, Curtailment, Keandalan, Pendanaan, Pemain) sebagai halaman baca biasa berlebar konten.
- Hero RUPTL dan ubin angkanya pindah ke tab "Rencana dan kebijakan"; mode peta tanpa hero.
- `?tab=` tetap berlaku (tautan lama tidak rusak; tab lama dipetakan ke "Rencana dan kebijakan" dengan sub-tab).

## 7. Bukti selesai

- `npm run uji` hijau, termasuk uji baru: algoritma graf pada fixture kecil (jembatan, komponen, tempel), determinisme, gerbang potret (`st/src/tgl` wajib, ukuran), i18n setara. Skrip baru terdaftar di `data/rangkai.json` (uji T06); `tests/e2e/cakupan.json` hanya untuk rute, dan fitur ini tidak menambah rute.
- Tangkapan 1440 dan 375, terang dan gelap, ID dan EN di `tests/layar/tangkapan/`.
- Pemeriksa: `selera-angka`, `perf-reviewer`, `inp-reviewer`, `i18n-guard`, `peninjau-bersih`.
