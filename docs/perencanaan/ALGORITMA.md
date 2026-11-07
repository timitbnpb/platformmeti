# ALGORITMA: Platform Jaringan METI

Dokumen keenam dalam urutan otoritas (`KEPUTUSAN-METI` > `GRAND-DESIGN` > `RISET` > `PRD` > `ALUR` > `ALGORITMA` > `DESIGN-SYSTEM` > `DESAIN-TEKNIS` > `KEAMANAN-PRIVASI` > `RENCANA-UJI` > `TIKET`). Kalah dari `KEPUTUSAN-METI`, `GRAND-DESIGN`, `RISET`, `PRD`, dan `ALUR`; menang atas `DESIGN-SYSTEM`, `DESAIN-TEKNIS`, `KEAMANAN-PRIVASI`, `RENCANA-UJI`, dan `TIKET`. Versi 1, 7 Nov 2026.

Dokumen ini menjawab satu pertanyaan: **dihitung bagaimana**. Isinya rumus, bobot, ambang, nilai enum, dan kasus acuan sebagai fungsi murni. Layar, tabel, dan alur ada di dokumen lain; di sini hanya angka dan aturan yang menghasilkannya. Bila `DESIGN-SYSTEM` atau `DESAIN-TEKNIS` menulis nilai yang berbeda dari dokumen ini, dokumen ini menang dan mereka disesuaikan (daftar yang perlu disesuaikan ada di §14.5).

## Daftar isi

Pembuka: konvensi, modul, dan peta rujukan masuk
1. Kunci entitas, normalisasi nama, slug, alias
2. Taksonomi (`SEKTOR`, rantai nilai, kategori, kunci fakta, dan seterusnya)
3. Ikatan, jenis sumber, dan pencocokan entitas
4. Tingkat bukti dan skor keyakinan
5. Kuadran BUMN energi
6. Graf ikatan, "Terhubung", rantai pasok, pembiaya
7. Skor kesiapan provinsi
8. Sensus dan hitungan per sektor dan provinsi
9. Label EST, tanda kosong, "Cara menghitung", "Cara mengutip"
10. Formatter angka, tanggal, dan jarak
11. Pencarian (indeks statis dan kueri FTS)
12. Daftar tolak
13. Aturan potret per lapis
14. Daftar uji acuan, hal terbuka, dan penyelarasan

---

## Pembuka

### P.1 Cara membaca

Tiap rumus ditulis dengan enam butir tetap, supaya pengerja dan penguji membaca bentuk yang sama:

| Butir | Isi |
| --- | --- |
| Definisi | Apa yang dihitung dan mengapa, dalam kalimat |
| Masukan | Nama, tipe, dan satuan |
| Keluaran | Nama, tipe, rentang, dan cara dibulatkan |
| Kasus tepi | Perilaku bila data kosong, kembar, di batas, atau di luar rentang |
| Contoh | Satu perhitungan angka lengkap yang bisa diulang tangan |
| Uji acuan | Nama uji yang memuat contoh itu sebagai harga yang diharapkan (daftar lengkap di §14.2 untuk `RENCANA-UJI`) |

Contoh angka memakai entitas fiktif berakhiran "(contoh)". Semua angka contoh sudah dihitung ulang dengan skrip Node saat dokumen ini ditulis. Bila contoh diubah, berkas `tests/fixtures/algo-acuan.json` diubah dalam commit yang sama.

### P.2 Modul

| Modul | Isi | Dipakai oleh |
| --- | --- | --- |
| `public/taksonomi.js` | Semua enum, daftar tetap, dan kamus nama tampil ID/EN (§2, §3.1, §3.2, §4.1) | Worker (validasi bentuk di `hak.tulis`), pipeline, layar, gerbang `gerbang-taksonomi` |
| `public/algo.js` | Semua fungsi hitung, konstanta bobot dan ambang (`KONSTANTA`), dan `STATUS_UJI` | Worker (hanya fungsi bentuk: `normNama`, `buatKunci`, `buatSlug`, `tingkatSah`, `bangunQueryFts`, `polaPribadi`), pipeline Node (semuanya), layar (formatter dan penempatan kuadran) |

Keduanya ES module tanpa build (ADR-03), tanpa dependensi, tanpa akses jaringan, tanpa `Date.now()` di dalam fungsi hitung: waktu sekarang selalu masuk sebagai argumen `kini` supaya uji deterministik. Python tidak memuat rumus (DT §1). Skor, graf, dan kuadran tidak dihitung di Worker (DT §8.2); Worker hanya memakai fungsi bentuk di atas.

### P.3 Konvensi umum

1. **Pembulatan.** Satu fungsi `bulat(n, d)`: setengah menjauhi nol berdasarkan nilai desimal yang tertulis (`bulat(1.005, 2)` = 1,01; `Number.prototype.toFixed` memberi 1,00 dan TIDAK dipakai). Skor keyakinan dan kuadran dibulatkan sekali, di akhir; komponen antara tidak dibulatkan.
2. **Tanggal** selalu string `YYYY-MM-DD` sah menurut kalender (sama dengan CHECK `TGL` di DT §3). Fungsi tidak pernah memakai `new Date("YYYY-MM-DD")` (zona waktu); tanggal dipecah manual dan selisih hari dihitung dari nomor hari sipil (§10.2).
3. **Nilai kosong.** `null` atau `undefined` berarti "tidak ada angka". Fungsi tidak pernah mengubahnya menjadi 0. Hasil yang tidak bisa dihitung adalah `null` disertai `alasan` (kode dari §2.8), bukan 0 dan bukan tebakan.
4. **Persentil** memakai satu definisi (§5.1) di seluruh dokumen.
5. **Status uji.** Skor keyakinan (§4), kuadran (§5), skor kesiapan (§7), dan bintang strategis (§6.6) berstatus **Hipotesis** (KP C-16) sampai ada uji kalibrasi yang lulus. Status dibaca layar dari `STATUS_UJI` di `algo.js`; mengubahnya menjadi `lolos` menuntut revisi dokumen ini (catatan di bagian D) dan fixture uji lulusnya.
6. **Bahasa.** Nama tampil ada di `taksonomi.js` sebagai pasangan `{id, en}`. Kalimat alasan dirakit dari kunci kamus (`yakin.*`, `kuadran.*`), bukan teks tertanam di fungsi.
7. **Tanpa titik tengah dan tanpa em dash** pada semua teks keluaran. Tanda "tidak ada angka" ialah tanda hubung `-` (DS §6.11), selalu dengan alasannya di dekatnya.

### P.4 Peta rujukan masuk

Dokumen lain merujuk "ALG §n". Tabel ini memastikan tiap rujukan punya tujuan.

| Rujukan | Dari | Bagian di sini |
| --- | --- | --- |
| ALG §1 | DT §1 butir 2, §3.3 (trigger kunci tetap, kolom `norm`), §4.3 (`POST /api/kurasi/entitas`), §7.4 langkah 3 | §1 |
| ALG §2 | PRD F-S2, TIKET JM-C03, DT JM-C03, JM-F01, JM-F07, DS tentang `SEKTOR` | §2 |
| ALG §2 (`SEL_DAYA`, `RISIKO`, `USAHA_DESA`) | DT JM-F04, JM-F05 | §2.7 |
| ALG §2.8 | DT §3.3 catatan 7 (`KUNCI_FAKTA`) | §2.8 |
| ALG §3 (jenis ikatan) | ALUR 2.1 langkah 5, PRD F-J5, TIKET JM-D10, GLOSARIUM, DS (kamus jenis hubungan) | §3.1 |
| ALG §3 (jenis sumber) | DS §6.8 | §3.2 |
| ALG §3 (dedup) | DT §7.4 langkah 3, JM-D10 | §3.3 |
| ALG §4 | ALUR 2.2 langkah 5, PRD F-S4, TIKET JM-D13, DT JM-D13, JM-E03, JM-E05, DS skor | §4 |
| ALG §5 | DT JM-F03, DS kuadran | §5 |
| ALG §6 | DT JM-D10, JM-E03, JM-F02 | §6 |
| ALG §8 | DT §3.3 catatan 2, JM-E02 | §8 |
| ALG §9 | DT JM-E05 | §9 |
| ALG §10 | DT §4.3 (`terdekat`), §8.4 | §10 |

---

## 1. Kunci entitas, normalisasi nama, slug, alias

Entitas dikenali dari `kunci` (identitas mesin, tidak pernah berubah) dan `slug` (alamat `/p/<slug>`, tidak pernah berubah). Nama boleh berganti; nama lama menjadi alias. Seluruh bagian ini porting dari `scripts/akademisi/hubung.mjs` di repo asal (R1 §9, [A]) dengan tiga perbaikan yang tercatat di tiap butir.

### 1.1 Normalisasi nama: `normNama`, `intiNama`, `singkatan`

**Definisi.**
- `normNama(s)`: bentuk kanonik untuk membandingkan dua nama. Langkah berurutan: ubah ke string (`null` menjadi kosong), huruf kecil, `NFKD`, buang tanda diakritik (U+0300 sampai U+036F), buang semua teks di dalam kurung beserta kurungnya, ganti setiap deret karakter selain `a-z0-9` dengan satu spasi, pangkas.
- `intiNama(s)`: `normNama(s)` lalu buang kata dari `BUANG`, rapatkan spasi. `BUANG` = `pt tbk persero perseroan terbatas cv ud pte ltd limited inc corp corporation gmbh the of dan and yayasan perkumpulan lembaga badan indonesia republik ri` (asal 14 kata, ditambah bentuk badan hukum umum; daftar hanya boleh ditambah lewat perubahan dokumen ini disertai uji).
- `singkatan(s)`: huruf di dalam kurung yang berbentuk singkatan, diubah ke huruf kecil. Hanya yang cocok `^[A-Z][A-Z0-9-]{2,}$` (huruf besar semua, minimal 3 karakter). **Perbaikan atas asal:** asal menerima `(Persero)` sebagai singkatan; di sini `(Persero)` dan `(Tbk)` ditolak karena bukan huruf besar semua.
- `KATA_UMUM` (perbaikan atas asal): bila `intiNama` hanya berisi satu kata dan kata itu ada di `KATA_UMUM` (`bank dinas kementerian universitas institut pusat balai direktorat unit kantor`), hasil `intiNama` TIDAK dipakai sebagai kunci pencocokan (mencegah "Bank Indonesia" dan "Bank" bertabrakan).

**Masukan.** `s`: string atau `null`. **Keluaran.** string (mungkin kosong) untuk `normNama` dan `intiNama`; string atau `null` untuk `singkatan`.

**Kasus tepi.** `normNama(null)` = `""`. Nama yang seluruhnya di dalam kurung menjadi `""` dan tidak boleh dipakai sebagai kunci (panjang kunci minimal 3). Angka dipertahankan (`PLTS 100 GW` menjadi `plts 100 gw`). Tanda `&` hilang (menjadi spasi), jadi `Dewan & Pakar` = `dewan pakar`, sedangkan `Dewan dan Pakar` = `dewan dan pakar` pada `normNama` dan sama pada `intiNama`.

**Contoh.**

| Masukan | `normNama` | `intiNama` | `singkatan` |
| --- | --- | --- | --- |
| `PT Pertamina (Persero)` | `pt pertamina` | `pertamina` | `null` |
| `PT Pertamina Geothermal Energy Tbk (PGE)` | `pt pertamina geothermal energy tbk` | `pertamina geothermal energy` | `pge` |
| `Énergi  Müda` | `energi muda` | `energi muda` | `null` |
| `PLN Indonesia Power` | `pln indonesia power` | `pln power` | `null` |
| `Bank Indonesia` | `bank indonesia` | `bank` (dilewati: `KATA_UMUM`) | `null` |

**Uji acuan.** `normNama.acuan`, `normNama.tepi`, `intiNama.acuan`, `intiNama.kataUmum`, `singkatan.persero-bukan-singkatan`.

### 1.2 Kunci entitas: `buatKunci`

**Definisi.** `kunci` berbentuk `<awalan>:<nilai>`, huruf kecil, 5 sampai 160 karakter (CHECK DT §3.3). Dipilih sekali saat entitas dibuat: awalan terkuat yang tersedia, menurut `RANK_KUNCI`. Kunci tidak berubah lagi (trigger `entitas_kunci_tetap`); pengenal yang baru datang sesudahnya disimpan sebagai fakta berkunci `id_*` (§2.8) dan ikut dipakai pencocokan (§3.3).

| Awalan | Jenis entitas | Kekuatan | Isi nilai | Aturan |
| --- | --- | --- | --- | --- |
| `nib` | lembaga berbadan hukum atau badan usaha | kuat | 13 angka NIB | TIDAK dipakai untuk usaha perseorangan (itu data pribadi) |
| `ror` | lembaga (kampus, lembaga riset) | kuat | kode ROR 9 karakter | huruf kecil |
| `wikidata` | semua jenis | kuat | `q` + angka | |
| `orcid` | orang | kuat | 16 karakter `0000-0000-0000-000x` | akhiran `X` ditulis `x` |
| `openalex` | orang, lembaga, publikasi | kuat | `a123`, `i123`, `w123` | |
| `doi` | publikasi | kuat | DOI huruf kecil | |
| `osm` | proyek (pembangkit) | kuat | `way/123`, `node/123`, `relation/123` | |
| `bps` | wilayah | kuat | kode BPS 2 angka (provinsi) | |
| `reg` | regulasi | kuat | `<jenis>-<nomor>-<tahun>` | `perpres-112-2022` |
| `nama` | semua jenis | lemah | `<slug>.<prov atau nas>` | cadangan terakhir bila tidak ada pengenal |

**Urutan memilih** per jenis: lembaga `nib`, `ror`, `wikidata`, `openalex`, `osm`, `nama`; orang `orcid`, `openalex`, `wikidata`, `nama`; proyek `osm`, `wikidata`, `nama`; publikasi `doi`, `openalex`; wilayah `bps`; regulasi `reg`.

**NPWP dan NIB.** NPWP TIDAK pernah menjadi bagian `kunci` dan tidak pernah tampil di lapis Publik atau Anggota. Bila kurator memilikinya (badan usaha saja; NPWP orang pribadi adalah NIK dan dilarang, DT §3.3 catatan 4), ia disimpan sebagai fakta `id_npwp` berisi **hash** `sha256("jm-npwp-v1:" + 15 angka)` di lapis Pengurus, hanya untuk pencocokan, tidak untuk ditampilkan. Ini bawaan perancang (butir H-1 di §14.3).

**Masukan.** `jenis` (enum §2.4), `pengenal` (objek `{nib?, ror?, wikidata?, openalex?, osm?, orcid?, doi?, bps?, reg?}`), `nama`, `prov`. **Keluaran.** string kunci, atau galat `kunci-tidak-sah` bila nilai tidak lolos bentuk.

**Kasus tepi.** Pengenal dengan bentuk salah (NIB bukan 13 angka) dilewati dan awalan berikutnya dipakai; bila semuanya gagal jatuh ke `nama:`. Dua kunci `nama:` yang sama (nama dan provinsi sama) ditolak UNIQUE; kurator diminta membuka entitas yang ada atau menandai berbeda (ALUR 2.1 langkah 2).

**Contoh.** Lembaga "PT Surya Contoh Energi Tbk (contoh)" provinsi 32 tanpa pengenal: `buatSlug` = `surya-contoh-energi`, `buatKunci` = `nama:surya-contoh-energi.32`. Dengan NIB `1234567890123` kunci = `nib:1234567890123`.

**Uji acuan.** `buatKunci.prioritas`, `buatKunci.nib-bentuk-salah`, `buatKunci.npwp-tidak-masuk-kunci`, `buatKunci.nama-lemah`.

### 1.3 Slug: `buatSlug`

**Definisi.** Alamat `/p/<slug>`: `normNama(nama)` tanpa bentuk badan hukum (hanya `pt tbk persero perseroan terbatas cv ud pte ltd limited inc corp corporation gmbh`, BUKAN seluruh `BUANG`), spasi menjadi `-`, dipotong 60 karakter, tanda hubung di ujung dibuang. Cocok dengan CHECK DT §3.3 (`[a-z0-9-]`, 2 sampai 60, tidak diawali atau diakhiri `-`); tanda hubung ganda tidak dibuat.

**Bila bentrok:** tambah `-<prov>` (dua angka), lalu `-2`, `-3`, dan seterusnya. Slug dibuat server saat entitas dibuat (klien tidak mengirimnya, DT §4.3) dan tidak pernah berubah. Ganti nama membuat alias baru, bukan slug baru. Slug entitas yang digabung (`status = 'digabung'`) tetap hidup dan dialihkan ke entitas tujuan oleh Worker; penggabungan tidak berantai (trigger `entitas_gabung_tanpa_rantai`).

**Kasus tepi.** Nama kurang dari 2 karakter sesudah normalisasi: galat `nama-terlalu-pendek`. Slug yang sama dengan segmen terlarang tidak mungkin terjadi karena rute entitas selalu `/p/<slug>`.

**Contoh.** `buatSlug("PT Surya Contoh Energi Tbk")` = `surya-contoh-energi`; `buatSlug("PT Pertamina (Persero)")` = `pertamina`; bentrok kedua pada provinsi 32 = `pertamina-32`; bentrok ketiga = `pertamina-32-2`.

**Uji acuan.** `buatSlug.acuan`, `buatSlug.bentrok`, `buatSlug.panjang-60`, `buatSlug.tanpa-tanda-hubung-ganda`.

### 1.4 Alias

**Definisi.** Alias ialah nama lain yang menunjuk ke entitas yang sama. Tiap alias disimpan dengan hasil `normNama` di kolom `norm` (DT §3.3) dan `asal` salah satu dari `kurator`, `gabung`, `singkatan`, `nama-lama`, `en`. Entitas otomatis mendapat alias dari: `nama_badan_hukum`, `nama_en`, `singkatan` kurator, `singkatan(nama)`, dan nama entitas yang digabung ke dalamnya.

**Kamus alias Inggris ke nama resmi** (`ALIAS_ENERGI`, ditaruh di `taksonomi.js` dan diimpor `hubung.mjs`; lihat penyelarasan P-3). Kunci diperiksa lewat `normNama`. Awal (hanya yang pasti, daftar diperluas kurator lewat PR dengan uji):

| Alias (Inggris atau singkatan) | Nama resmi |
| --- | --- |
| `ministry of energy and mineral resources` | Kementerian Energi dan Sumber Daya Mineral |
| `esdm` | Kementerian Energi dan Sumber Daya Mineral |
| `directorate general of new renewable energy and energy conservation`, `ebtke`, `djebtke` | Direktorat Jenderal Energi Baru, Terbarukan, dan Konservasi Energi |
| `national energy council`, `den` | Dewan Energi Nasional |
| `indonesian renewable energy society`, `ires`, `meti` | Masyarakat Energi Terbarukan Indonesia |
| `state electricity company`, `pln` | PT PLN (Persero) |
| `pertamina geothermal energy`, `pge` | PT Pertamina Geothermal Energy Tbk |
| `pertamina new and renewable energy`, `pertamina nre` | PT Pertamina New and Renewable Energy |
| `institute for essential services reform`, `iesr` | Institute for Essential Services Reform |
| `indonesian solar energy association`, `aesi` | Asosiasi Energi Surya Indonesia |

Alias yang pada `intiNama` atau `normNama` menunjuk ke dua entitas atau lebih disebut **ambigu** dan tidak dipakai untuk menautkan (§3.3).

**Uji acuan.** `aliasEnergi.normal-dan-unik`, `aliasEnergi.ambigu-tidak-dipakai`.

### 1.5 Kebijakan kunci dan penggabungan

1. Kunci dan slug tidak diubah, tidak dipakai ulang, dan tidak dihapus; entitas yang ditarik tetap punya barisnya untuk jejak (ALUR 2.1 langkah 9).
2. Penggabungan memindahkan fakta, ikatan, alias, dan riwayat ke entitas tujuan dalam satu `batch`; nama lama menjadi alias `gabung` (DT §4.3).
3. Pipeline menggabung panen dan kurasi menurut `entitas.kunci` plus pengenal `id_*`; kurasi menang atas panen (DT §7.4 langkah 3). Baris panen tanpa pengenal kuat memakai §3.3.

---

## 2. Taksonomi

Semua nilai di bagian ini sama persis dengan daftar `CHECK` di DT §3 dan dijaga oleh gerbang `gerbang-taksonomi.test.mjs` (RU §3). Menambah nilai berarti mengubah dokumen ini, `taksonomi.js`, migrasi baru (tidak menyunting yang lama), dan uji, dalam satu commit.

### 2.1 `SEKTOR`

Cakupan mengikuti KP C-12 (bawaan): EBT, penyimpanan, jaringan, efisiensi, kendaraan listrik, sampah jadi energi, hidrogen; nuklir dan CCS hanya "terkait". Pembagian `kelompok` di bawah juga bawaan C-12; bila C-12 dijawab lain, hanya tabel ini yang berubah.

| Kunci | Indonesia | Inggris | Kelompok | Chip utama | Boleh `di_sensus` |
| --- | --- | --- | --- | --- | --- |
| `surya` | Surya | Solar | `ebt` | ya | ya |
| `bayu` | Bayu (angin) | Wind | `ebt` | ya | ya |
| `air` | Air (hidro) | Hydropower | `ebt` | ya | ya |
| `panas-bumi` | Panas bumi | Geothermal | `ebt` | ya | ya |
| `bioenergi` | Bioenergi | Bioenergy | `ebt` | ya | ya |
| `laut` | Energi laut | Ocean energy | `ebt` | ya | ya |
| `hidrogen` | Hidrogen | Hydrogen | `pendukung` | ya | ya |
| `penyimpanan` | Penyimpanan | Storage | `pendukung` | ya | ya |
| `jaringan` | Jaringan | Grid | `pendukung` | ya | ya |
| `efisiensi` | Efisiensi | Efficiency | `pendukung` | ya | ya |
| `kendaraan-listrik` | Kendaraan listrik | Electric vehicles | `pendukung` | ya | ya |
| `sampah-energi` | Sampah jadi energi | Waste-to-energy | `pendukung` | ya | ya |
| `nuklir` | Nuklir | Nuclear | `terkait` | tidak | tidak |
| `ccs` | CCS/CCUS | CCS/CCUS | `terkait` | tidak | tidak |

**Aturan.**
1. `entitas.sektor` ialah sektor utama (satu); sektor tambahan disimpan di `label` (`jenis = 'sektor'`). Chip, hitungan, dan `di_sensus` memakai sektor utama dan tambahan sesuai §8.3.
2. Nilai `terkait` ditolak CHECK `di_sensus` (DT §3.3 catatan 2); entitas bersektor `nuklir` atau `ccs` boleh punya profil dan ikatan tetapi tidak masuk hitungan sensus dan tidak punya chip utama (PRD F-J10).
3. `SEKTOR_VIEW`: lihat §2.10.

**Uji acuan.** `SEKTOR.empat-belas-nilai`, `SEKTOR.terkait-tolak-di-sensus`, `taksonomi.sama-dengan-check-d1`.

### 2.2 `RANTAI` (rantai nilai)

Dua belas peran, diurut dari hulu ke hilir. Satu entitas boleh punya beberapa peran (tabel `label`, `jenis = 'rantai'`).

| Kunci | Indonesia | Inggris | Lajur |
| --- | --- | --- | --- |
| `bahan-baku` | Bahan baku | Raw materials | hulu |
| `komponen` | Komponen | Components | hulu |
| `manufaktur-modul` | Manufaktur modul | Module manufacturing | manufaktur |
| `manufaktur-inverter` | Manufaktur inverter | Inverter manufacturing | manufaktur |
| `manufaktur-baterai` | Manufaktur baterai | Battery manufacturing | manufaktur |
| `epc` | EPC (rancang-bangun) | EPC contractor | bangun |
| `pengembang-ipp` | Pengembang atau IPP | Developer or IPP | pengembang |
| `operator` | Operator | Operator | pengembang |
| `offtaker` | Pembeli listrik (offtaker) | Offtaker | pembeli |
| `pembiaya` | Pembiaya | Financier | lintas |
| `konsultan` | Konsultan | Consultant | lintas |
| `regulator` | Regulator | Regulator | lintas |

Lajur `lintas` tidak diurut dalam diagram rantai; ia tampil sebagai chip. Nilai ini dipakai `rantai.json` (JM-F01) dan sebagai chip di `/perusahaan`.

**Uji acuan.** `RANTAI.dua-belas-nilai`.

### 2.3 `KAT` (kategori lembaga)

Sepuluh kategori, hanya untuk `jenis = 'lembaga'` (CHECK `jenis = 'lembaga' OR kategori IS NULL`).

| Kunci | Indonesia | Inggris |
| --- | --- | --- |
| `pemerintah` | Pemerintah | Government |
| `bumn` | BUMN dan BUMD | State-owned enterprise |
| `swasta` | Swasta | Private company |
| `asosiasi` | Asosiasi | Association |
| `riset-kampus` | Riset dan kampus | Research and university |
| `lsm-think-tank` | LSM dan think tank | NGO and think tank |
| `keuangan` | Keuangan | Finance |
| `internasional` | Internasional | International |
| `pengembang-teknologi` | Pengembang teknologi | Technology developer |
| `komunitas` | Komunitas | Community |

**Uji acuan.** `KAT.sepuluh-nilai`.

### 2.4 `JENIS_ENTITAS`

Delapan jenis: `lembaga`, `orang`, `proyek`, `wilayah`, `regulasi`, `publikasi`, `acara`, `teknologi`. Perusahaan, kampus, dan koperasi adalah `lembaga` dengan `kategori` yang sesuai (daftar contoh jenis di ALUR 2.1 langkah 2 bersifat ilustrasi dan menunjuk DT). Tabel `pasangan_ikatan` (§3.1) menentukan jenis mana yang boleh terhubung.

### 2.5 `JENIS_PASOK` dan `JENIS_DANA`

`JENIS_PASOK` hanya untuk ikatan `memasok` (CHECK `jenis_pasok IS NULL OR jenis = 'memasok'`). Sembilan nilai mengikuti DT; padanan dengan chip 1001startup.id di kolom kanan.

| Kunci | Indonesia | Inggris | Padanan R9 |
| --- | --- | --- | --- |
| `bahan-baku` | Bahan baku | Materials | Materials |
| `komponen` | Komponen | Parts and components | Parts and components |
| `manufaktur-kontrak` | Kontrak manufaktur | Contract manufacturing | Contract manufacturing |
| `peralatan` | Barang dan perangkat keras | Goods and hardware | Goods + Hardware (digabung, lihat P-1) |
| `energi` | Energi | Energy | Energy |
| `perangkat-lunak` | Perangkat lunak | Software | Software |
| `jasa-epc` | Jasa EPC | EPC services | (baru untuk energi) |
| `lisensi-teknologi` | Lisensi teknologi | Technology licence | Technology licence |
| `pembiayaan` | Pembiayaan sebagai layanan | Financing as a service | (baru; bukan aliran dana investor) |

Aliran dana investor ke penerima memakai ikatan `mendanai`, BUKAN `memasok` dengan `pembiayaan`. `JENIS_DANA` (tanpa kolom khusus di DT; lihat H-7 dan P-6): token baku di awal kolom `rincian` ikatan `mendanai`, bentuk `<jenis>: <uraian>`, dengan `<jenis>` salah satu dari `ekuitas`, `hibah`, `pinjaman`, `dana-iklim`, `lainnya`. Nama tampil: Ekuitas, Hibah, Pinjaman, Dana iklim, Lainnya (EN: Equity, Grant, Loan, Climate fund, Other).

### 2.6 Pembangkit dan proyek

| `JENIS_PEMBANGKIT` | Singkatan | Sektor yang dipetakan |
| --- | --- | --- |
| `plts` | PLTS | `surya` |
| `pltb` | PLTB | `bayu` |
| `plta` | PLTA | `air` |
| `pltm` | PLTM atau PLTMH | `air` |
| `pltp` | PLTP | `panas-bumi` |
| `pltbm` | PLTBm | `bioenergi` |
| `pltsa` | PLTSa | `sampah-energi` |

`STATUS_PROYEK` (PRD F-W3): `beroperasi`, `konstruksi`, `direncanakan`, `diumumkan`. Urutan kematangan: beroperasi 3, konstruksi 2, direncanakan 1, diumumkan 0. **Aturan:** `diumumkan` berbeda dari `direncanakan` dan TIDAK pernah masuk hitungan MW terpasang (§8.4).

### 2.7 Pusat data, risiko, energi desa

**`SEL_DAYA`** (PRD F-R5): delapan sel, tapak x model daya.

| Kunci | Tapak | Model daya | Judul manusiawi (Indonesia) |
| --- | --- | --- | --- |
| `greenfield-jaringan` | `greenfield` | `jaringan` (jaringan PLN) | Dibangun menunggu jaringan |
| `greenfield-btm` | `greenfield` | `btm` (di sisi pelanggan) | Pembangkit sendiri di dalam pagar |
| `greenfield-luar-jaringan` | `greenfield` | `luar-jaringan` | Kawasan berdaya sendiri |
| `greenfield-hibrida` | `greenfield` | `hibrida` (terbarukan) | Jaringan ditambah sumber bersih sendiri |
| `brownfield-jaringan` | `brownfield` | `jaringan` | Tambah beban di jaringan yang ada |
| `brownfield-btm` | `brownfield` | `btm` | Pasang pembangkit di tapak lama |
| `brownfield-luar-jaringan` | `brownfield` | `luar-jaringan` | Tapak lama lepas jaringan |
| `brownfield-hibrida` | `brownfield` | `hibrida` | Tapak lama jaringan plus sumber bersih |

Judul manusiawi di atas bawaan perancang (tidak disalin dari 1001startup.id) dan dapat diganti pemilik tanpa mengubah kunci. Sel tanpa proyek tetap ditulis dengan alasan, tidak dikosongkan.

**`RISIKO`** (matriks "siapa menanggung risiko"): enam jenis `peralatan`, `bangun`, `lahan`, `daya`, `modal`, `pelanggan`. **`TINGKAT_RISIKO`**: `utama` (Utama), `berbagi` (Berbagi), `terbatas` (Terbatas). Sel `terbatas` berarti tidak ada sumber yang menyebut peran, BUKAN tidak ada peran (PRD F-R5). **Label kepercayaan sel** memakai enum tunggal tingkat bukti (§4.1): `terkonfirmasi` (Dikonfirmasi), `kata-pihak` (Kata perusahaan), `cuplikan` (Dilaporkan), `inferensi` (Hitungan kami). Sel disimpan sebagai fakta `risiko_<jenis>` dengan `nilai_teks` berbentuk `<tingkat>|<frasa tiga sampai enam kata>`.

**`USAHA_DESA`** (chip jenis `/desa`): `plts-desa`, `plt-mikrohidro`, `plt-biomassa`, `kdmp`, `dre-lain`. **`DERAJAT_DESA`** (chip "tingkat bukti" PRD F-R6): `terverifikasi-lapangan`, `dikonfirmasi-pihak-kedua`, `dokumen-resmi`, `terdaftar-saja`. `DERAJAT_DESA` BUKAN enum `tingkat_bukti` kedua: ia menyatakan cara lokasi diverifikasi dan disimpan sebagai fakta `verifikasi_desa`. Hubungannya dengan enum tunggal: `terverifikasi-lapangan` mensyaratkan `tingkat_bukti = terkonfirmasi`; `terdaftar-saja` tidak boleh lebih tinggi dari `cuplikan`. Uji: `derajatDesa.syarat-tingkat`.

### 2.8 `KUNCI_FAKTA`

Daftar kunci yang boleh dipakai `fakta.kunci`. Bentuk kunci `[a-z0-9_]{2,40}` dijaga CHECK; keanggotaan daftar dijaga `jaga_unggah.mjs` dan `hak.tulis` (DT §3.3 catatan 7). Kolom "EST" bernilai `wajib` bila kunci hanya boleh berisi angka turunan (CHECK DT: `est = 1` menuntut `rumus` dan `tingkat_bukti = 'inferensi'`). Kolom "Lapis" ialah lapis minimal; kunci bertanda `P` hanya boleh `pengurus`. Tipe `T` = `nilai_teks`, `N` = `nilai_num` (wajib bersatuan).

| Kunci | Arti (Indonesia) | Tipe | Satuan baku | EST | Lapis |
| --- | --- | --- | --- | --- | --- |
| `id_nib` | NIB | T | | | publik |
| `id_ror`, `id_orcid`, `id_openalex`, `id_wikidata`, `id_osm`, `id_doi` | Pengenal luar | T | | | publik |
| `id_npwp` | Hash NPWP badan usaha (§1.2) | T | | | P |
| `pendiri` | Pendiri | T | | | publik |
| `pimpinan` | Pimpinan | T | | | publik |
| `jabatan` | Jabatan publik (orang) | T | | | publik |
| `berdiri` | Tahun berdiri | N | `tahun` | | publik |
| `lokasi_alamat` | Alamat kantor (hanya lembaga) | T | | | publik |
| `titik_presisi` | Ketepatan titik peta: `jalan`, `kecamatan`, `kota`, `perkiraan` | T | | | publik |
| `situs_status` | Status situs: `hidup`, `tidak-bisa-dicek`, `mati` (dengan tanggal cek di `per_tanggal`) | T | | | publik |
| `kontak_tautan` | Tautan resmi kontak (tanpa surel) | T | | | publik |
| `kontak_surel`, `kontak_telepon` | Kontak | T | | | P |
| `pekerja` | Jumlah pekerja (`per_tanggal` = tanggal baca) | N | `orang` | | publik |
| `pendapatan_idr`, `aset_idr`, `laba_idr` | Keuangan tahunan terbit | N | `IDR` | | publik |
| `pendanaan_usd` | Pendanaan terungkap, semua investor digabung | N | `USD` | | publik |
| `pendanaan_usd_min` | Batas bawah pendanaan (§9.3) | N | `USD` | | publik |
| `putaran_terakhir` | Putaran terakhir | T | | | publik |
| `valuasi_usd` | Valuasi terbit | N | `USD` | | publik |
| `kapasitas_mw` | Kapasitas pembangkit (proyek) atau tercatat di profil (lembaga) | N | `MW` | | publik |
| `kapasitas_rencana_mw` | Kapasitas rencana | N | `MW` | | publik |
| `kapasitas_ebt_mw`, `kapasitas_total_mw` | Kapasitas EBT dan total satu grup (untuk §5) | N | `MW` | | publik |
| `produksi_gwh` | Produksi energi | N | `GWh` | | publik |
| `tahun_cod` | Tahun operasi komersial | N | `tahun` | | publik |
| `jenis_pembangkit` | `JENIS_PEMBANGKIT` | T | | | publik |
| `status_proyek` | `STATUS_PROYEK` | T | | | publik |
| `tkt` | Tingkat kesiapan teknologi 1 sampai 9 | N | `TKT` | | publik |
| `sel_daya` | `SEL_DAYA` (pusat data) | T | | | publik |
| `daya_dari` | Sumber listrik pusat data | T | | | publik |
| `risiko_peralatan`, `risiko_bangun`, `risiko_lahan`, `risiko_daya`, `risiko_modal`, `risiko_pelanggan` | Sel matriks risiko (§2.7) | T | | | publik |
| `usaha_desa`, `verifikasi_desa` | `USAHA_DESA`, `DERAJAT_DESA` | T | | | publik |
| `potensi_gw` | Potensi EBT wilayah | N | `GW` | | publik |
| `terpasang_gw` | Terpasang EBT wilayah | N | `GW` | | publik |
| `bauran_ebt_persen` | Bauran EBT | N | `persen` | | publik |
| `rasio_elektrifikasi_persen` | Rasio elektrifikasi | N | `persen` | | publik |
| `desa_belum_berlistrik` | Desa belum berlistrik | N | `desa` | | publik |
| `penduduk_jiwa` | Penduduk | N | `jiwa` | | publik |
| `status_regulasi` | `STATUS_REGULASI` (§2.9) | T | | | publik |
| `nomor_regulasi`, `penerbit` | Nomor dan penerbit | T | | | publik |
| `peristiwa` | Butir garis waktu jejak isu | T | | | publik |
| `posisi_meti` | Kutipan posisi METI dari dokumen METI | T | | | publik |
| `status_meti_wilayah` | `STATUS_METI_WILAYAH` | T | | | publik |
| `tanggal_peresmian` | Tanggal peresmian METI Wilayah | T | | | publik |
| `output_idr` | Output (nilai tambah) tahunan, §9.4 | N | `IDR` | wajib | publik |
| `skor_mandat` | Skor rubrik mandat EBT 0 sampai 5, §5.3 | N | `skor` | wajib | publik |

**`ALASAN_KOSONG`** (empat nilai, selaras CHECK DT dan DS §6.8): `tidak-dipublikasikan` (Tidak dipublikasikan, Not published), `belum-ada` (Belum ada, None yet), `menunggu-data` (Menunggu data K/L, Awaiting agency data), `belum-dicari` (Belum kami cari, Not yet searched). Nilai kosong tanpa salah satunya ditolak (R12 §3.2).

**Aturan umum kunci fakta.** (1) Kunci di luar tabel ditolak. (2) `nilai_num` tanpa `satuan` ditolak. (3) Kunci `kontak_*` memaksa `lapis = 'pengurus'` (CHECK). (4) Kunci berakhiran `_min` ialah batas bawah dan tidak pernah dijumlahkan dengan kunci tanpa akhiran. (5) Menambah kunci memerlukan perubahan tabel ini dan `taksonomi.js`, tanpa migrasi D1.

**Uji acuan.** `kunciFakta.bentuk`, `kunciFakta.est-wajib-untuk-turunan`, `kunciFakta.kontak-hanya-pengurus`, `kunciFakta.satuan-wajib`.

### 2.9 Regulasi dan perencanaan

| Enum | Nilai |
| --- | --- |
| `JENIS_REGULASI` | `uu`, `pp`, `perpres`, `permen`, `kepmen`, `perda`, `sk`, `lainnya` |
| `STATUS_REGULASI` | `berlaku`, `diubah`, `dicabut` |
| `DOKUMEN_PERENCANAAN` | `ken`, `ruen`, `rued`, `ruptl` |

**Aturan status** (PRD F-K1: status tidak diketik tangan bila sumber punya status): `statusRegulasi(r, ikatan)` ialah `dicabut` bila ada ikatan `mencabut` yang menunjuk ke `r`; `diubah` bila tidak dicabut tetapi ada ikatan `mengubah` yang menunjuk ke `r`; selain itu nilai fakta `status_regulasi` bila ada, dan `berlaku` hanya bila sumber primer menyebutnya. Tanpa satu pun, status `null` dengan alasan `belum-dicari`. **Uji acuan:** `statusRegulasi.dicabut-menang`.

### 2.10 `TABS`, `SEKTOR_VIEW`

`TABS` direktori (urutan tetap, TIKET JM-C03): `pakar`, `lembaga`, `wilayah`, `inovasi`, `riset`, `sistem-data`, `pendanaan`, `pustaka`. Donasi dibuang; Kejadian besar menjadi sub-tab `jejak-isu` di bawah `riset`.

`SEKTOR_VIEW`: tab tempat panel chip sektor tampil. Bawaan: `pakar`, `lembaga`, `inovasi`, `riset`, `pendanaan`, `pustaka`. Tab `wilayah` dan `sistem-data` tidak (PRD F-W2). Bila TIKET JM-C03 memperinci lain, rincian TIKET dipakai sampai ALG diperbarui (H-6). Panel tersembunyi berarti saringan dilepas.

### 2.11 `DIRI` dan METI Wilayah

`DIRI` ialah "kita" (KP D13): METI Pusat, METI Wilayah, METI Institute, METI Energi Muda. Ia tidak pernah diberi bintang "mitra strategis" dan tidak diperlakukan sebagai pihak luar di graf. Cocok bila `normNama(nama)` memenuhi `^masyarakat energi terbarukan indonesia\b` atau mengandung kata utuh `meti`. `STATUS_METI_WILAYAH`: `established`, `coming-soon`, `planned` (nama tampil Established, Coming soon, Planned; GLOSARIUM §1.3). Lencana "Anggota METI" bukan bagian `DIRI` dan hanya dari `entitas.anggota_meti = 1` yang dikonfirmasi Sekretariat.

**Uji acuan.** `DIRI.cocok-dan-tidak`, `DIRI.meti-wilayah`.

### 2.12 `PROV` (38 provinsi)

Kunci kode BPS 2 angka: `11` Aceh, `12` Sumatera Utara, `13` Sumatera Barat, `14` Riau, `15` Jambi, `16` Sumatera Selatan, `17` Bengkulu, `18` Lampung, `19` Kepulauan Bangka Belitung, `21` Kepulauan Riau, `31` DKI Jakarta, `32` Jawa Barat, `33` Jawa Tengah, `34` DI Yogyakarta, `35` Jawa Timur, `36` Banten, `51` Bali, `52` Nusa Tenggara Barat, `53` Nusa Tenggara Timur, `61` Kalimantan Barat, `62` Kalimantan Tengah, `63` Kalimantan Selatan, `64` Kalimantan Timur, `65` Kalimantan Utara, `71` Sulawesi Utara, `72` Sulawesi Tengah, `73` Sulawesi Selatan, `74` Sulawesi Tenggara, `75` Gorontalo, `76` Sulawesi Barat, `81` Maluku, `82` Maluku Utara, `91` Papua, `92` Papua Barat, `93` Papua Selatan, `94` Papua Tengah, `95` Papua Pegunungan, `96` Papua Barat Daya. Nilai tambahan `nasional` hanya untuk entitas tanpa lokasi provinsi dan tidak dihitung sebagai provinsi (§8.3). Nama tampil EN memakai nama yang sama kecuali "Jakarta Special Capital Region" dan "Special Region of Yogyakarta" untuk `31` dan `34`. Kotak batas koordinat Indonesia: lintang -11,5 sampai 6,5; bujur 94 sampai 141,5 (CHECK DT).

**Uji acuan.** `PROV.tiga-puluh-delapan`.

---

## 3. Ikatan, jenis sumber, dan pencocokan entitas

### 3.1 Jenis ikatan dan arah

**Definisi.** Ikatan ialah baris `ikatan(dari, ke, jenis, ...)`: satu klaim bersumber bahwa `dari` melakukan `jenis` terhadap `ke`. Arah selalu dari pelaku ke sasaran menurut kata kerja aktif. Enam belas jenis, dengan pasangan jenis simpul yang sah (sama dengan tabel `pasangan_ikatan` DT §3.3; uji `pasanganIkatan.sama-dengan-d1`):

| Kunci | Pelaku -> sasaran (jenis simpul) | Teks dari sisi `dari` (ID / EN) | Teks dari sisi `ke` (ID / EN) | Simetris | Diikuti di rantai |
| --- | --- | --- | --- | --- | --- |
| `bekerja-di` | orang -> lembaga | Bekerja di / Works at | Pekerja / Staff | tidak | tidak |
| `anggota-dari` | orang -> lembaga; lembaga -> lembaga | Anggota dari / Member of | Anggota / Members | tidak | tidak |
| `afiliasi-dengan` | orang -> lembaga | Berafiliasi dengan / Affiliated with | Afiliasi / Affiliates | tidak | tidak |
| `mendanai` | lembaga -> lembaga, proyek, publikasi | Mendanai / Funds | Didanai oleh / Funded by | tidak | tidak |
| `mengembangkan` | lembaga -> proyek | Mengembangkan / Develops | Dikembangkan oleh / Developed by | tidak | ya |
| `membangun` | lembaga -> proyek | Membangun / Builds | Dibangun oleh / Built by | tidak | ya |
| `memiliki` | lembaga -> lembaga, proyek | Memiliki / Owns | Dimiliki oleh / Owned by | tidak | ya |
| `memasok` | lembaga -> lembaga, proyek | Memasok / Supplies | Dipasok oleh / Supplied by | tidak | ya (lihat §6.3) |
| `membeli-dari` | lembaga -> lembaga, proyek | Membeli dari / Buys from | Menjual ke / Sells to | tidak | dibalik ke `memasok` |
| `mengatur` | regulasi -> lembaga, teknologi, wilayah, proyek | Mengatur / Regulates | Diatur oleh / Regulated by | tidak | tidak |
| `mengubah` | regulasi -> regulasi | Mengubah / Amends | Diubah oleh / Amended by | tidak | tidak |
| `mencabut` | regulasi -> regulasi | Mencabut / Repeals | Dicabut oleh / Repealed by | tidak | tidak |
| `berlokasi-di` | lembaga, proyek -> wilayah | Berlokasi di / Located in | Memuat / Hosts | tidak | tidak |
| `bermitra-dengan` | lembaga -> lembaga | Bermitra dengan / Partners with | Mitra / Partners | ya | tidak |
| `menulis` | orang -> publikasi | Menulis / Authored | Ditulis oleh / Authored by | tidak | tidak |
| `memimpin` | orang -> lembaga | Memimpin / Leads | Dipimpin oleh / Led by | tidak | tidak |

Kolom "Teks dari sisi `ke`" ialah kamus yang dibaca DS (baris tetangga) dan bagian "Terhubung".

**Aturan.**
1. **Dua sisi sama.** `memasok(A,B)` dan `membeli-dari(B,A)` menyatakan hubungan yang sama. Saat graf dibangun, `membeli-dari(X,Y)` DIBALIK menjadi `memasok(Y,X)` dan `persen`-nya dibawa sebagai `porsi` (porsi pembelian X dari Y, persen). Hubungan dihitung sekali (kunci dedup §6.2).
2. **Simetris** (`bermitra-dengan`): disimpan dengan `dari` ber-`id` lebih kecil daripada `ke`; pembalikan dilakukan `hak.tulis` sebelum menulis. Dua baris `A->B` dan `B->A` dihitung satu.
3. **Tidak ke diri sendiri** (CHECK `dari <> ke`). Ikatan ke entitas yang `digabung` dialihkan ke `digabung_ke` saat graf dibangun.
4. **Wajib sumber** (`sumber_id NOT NULL`), `per_tanggal` wajib; `mulai` dan `selesai` opsional, `selesai >= mulai`.
5. **Ikatan berakhir** (`selesai` lebih kecil dari `kini`) tetap ada di profil (sebagai riwayat) tetapi tidak dihitung ke "ikatan aktif" di kartu angka. `ikatanAktif(i, kini)` = `selesai` kosong atau `selesai >= kini`.
6. **`persen`** hanya untuk `memiliki`, `mendanai`, `membeli-dari`, rentang 0 sampai 100.
7. **Jenis pasok** (`jenis_pasok`) wajib diisi untuk `memasok` yang masuk halaman `/rantai` (§2.5). Ikatan `memasok` hanya sah bila sumbernya berjenis `filing` atau `situs-sendiri` (PRD F-R1: tanpa berita); `sumberPasokSah(jenisSumber)` mengembalikan benar hanya untuk keduanya.

**Contoh.** Laporan keuangan (filing) PT Konsumen Contoh menyebut membeli 4.554 panel dari PT Modul Contoh; kurator mencatat `membeli-dari(Konsumen, Modul)` dengan `persen` 17,71 dan `jenis_pasok = komponen`. Graf menyimpannya sebagai sisi `[modul, konsumen, "memasok", {porsi: 17.71}]`, bukan dua sisi.

**Uji acuan.** `pasanganIkatan.sama-dengan-d1`, `ikatan.membeli-dari-dibalik`, `ikatan.simetris-urut-id`, `ikatan.diri-sendiri-ditolak`, `ikatanAktif.batas-selesai`, `sumberPasokSah.hanya-filing-dan-situs`.

### 3.2 Jenis sumber

Enam nilai, urutan sama dengan PRD F-S4 dan CHECK `sumber.jenis`. Peringkat mengikuti tabel keandalan OPERASIONAL §2.1; kolom "Tingkat maks" ialah langit-langit `tingkat_bukti` yang boleh diklaim fakta atau ikatan yang bersumber dari jenis itu (`tingkatSah`, §4.1).

| Kunci | Indonesia (lencana) | Inggris | Peringkat | Tingkat maks | Contoh |
| --- | --- | --- | --- | --- | --- |
| `dokumen-resmi` | Dokumen resmi | Official document | 1 | `terkonfirmasi` | Peraturan di JDIH, RUPTL, SK, laporan tahunan lembaga pemerintah |
| `filing` | Laporan keuangan | Financial filing | 1 | `terkonfirmasi` | Laporan tahunan dan keuangan audit emiten, dokumen regulator yang menyebut pihak lawan |
| `situs-sendiri` | Situs entitas | Own website | 1 untuk klaim tentang dirinya sendiri | `kata-pihak` | Situs resmi, siaran pers, profil perusahaan |
| `data-terbuka` | Data terbuka | Open data | 2 | `terkonfirmasi` bila penerbit data juga pengumpul primernya; selain itu `cuplikan` | Ember, IRENASTAT, World Bank, OpenAlex, OSM |
| `media` | Berita | News | 3 | `cuplikan` | Berita media arus utama |
| `via-pihak-ketiga` | Pihak ketiga | Third party | 4 | `cuplikan` | Agregator atau direktori yang menyerahkan data (mis. 1001startup.id dengan izin) |

Nilai bawaan tingkat bukti per skrip panen (boleh diturunkan kurator, tidak boleh dinaikkan di atas langit-langit jenis sumbernya):

| Skrip | `jenis` sumber | Tingkat bawaan |
| --- | --- | --- |
| `statistik.py`, `wb_proyek.py` (angka dari penerbit asal) | `data-terbuka` | `terkonfirmasi` |
| `regulasi.py` | `dokumen-resmi` | `terkonfirmasi` |
| `osm_pembangkit.py` | `data-terbuka` | `inferensi` |
| `wri_gppd.py`, `gem.py`, `openalex.py` | `data-terbuka` | `cuplikan` |
| `orcid.py` | `data-terbuka` | `kata-pihak` |
| `aesi.py`, `sinkron_meti.py` | `situs-sendiri` | `kata-pihak` |
| `impor_1001.py` | `via-pihak-ketiga` | `cuplikan` |

Peringkat 1 sampai 4 menggantikan istilah "tingkat bukti (usulan) 1 sampai 4" di OPERASIONAL §2.1; nama "tingkat bukti" hanya dipakai untuk enum empat nilai di §4.1 (penyelarasan P-4).

**Uji acuan.** `JENIS_SUMBER.enam-nilai`, `tingkatSah.langit-langit`, `tingkatBawaan.tidak-melewati-langit-langit`.

### 3.3 Pencocokan dan dedup entitas

**Definisi.** Dedup menjawab "baris ini entitas yang sama dengan yang sudah ada?" tanpa menyatukan dua entitas yang berbeda. Prinsip asal dipertahankan: **lebih baik tidak terhubung daripada salah terhubung** (R1 §10 butir 3). Urutan keputusan:

1. **Kunci kuat dulu.** `kunciKuat(e)` ialah himpunan pengenal `nib`, `ror`, `wikidata`, `orcid`, `openalex`, `doi`, `osm`, `bps`, `reg` dari `kunci` dan dari fakta `id_*`. Dua entitas dengan satu pengenal kuat yang sama ialah entitas yang sama.
2. **Indeks nama ketat** (`bangunIndeks`, port `indeks` asal). Tiap entitas didaftarkan di bawah kunci: `normNama` dan `intiNama` untuk nama, `nama_badan_hukum`, tiap alias; plus `singkatan` kurator dan `singkatan(nama)` bila minimal 3 karakter. Kunci kurang dari 3 karakter diabaikan; `intiNama` satu kata umum diabaikan (§1.1).
3. **Cari ketat** (`cariNama`, port `cari` asal). Urutan kandidat kunci: alias Inggris bila ada, lalu `normNama`, `intiNama`, `singkatan`. Kunci yang menunjuk tepat satu entitas ialah cocok. Bila menunjuk lebih dari satu, pilih satu yang berstatus **akar** (tanpa induk lewat `memiliki` atau `digabung`) bila tepat satu; selain itu **ambigu: tidak ditautkan**. Pencarian nama panjang di dalam teks bebas (mis. kolom afiliasi): nama terpanjang yang termuat utuh dan hanya dimiliki satu entitas, dengan panjang minimal 12 karakter; dua kandidat seri berarti tidak ditautkan.
4. **Skor lunak** (`skorKemiripan`) hanya untuk mengurutkan antrean kurator dan TIDAK pernah menggabung sendiri:

`skor = 0,5 x jaccard(token intiNama a, token intiNama b) + 0,3 x [host situs sama] + 0,1 x [prov sama] + 0,1 x [jenis sama]`

   `host situs` ialah nama host tanpa awalan `www.`, dibandingkan persis (tanpa daftar akhiran publik). Ambang: `>= 0,85` antrean prioritas; `0,60 sampai < 0,85` antrean biasa; `< 0,60` entitas baru.

**`putusanCocok(baris, indeks, kini)` mengembalikan `{aksi, ke?, skor?, alasan}`** dengan `aksi` satu dari `tautkan`, `antrean`, `baru`:

| No | Kondisi | Aksi |
| --- | --- | --- |
| 1 | Satu pengenal kuat sama | `tautkan` ke entitas itu |
| 2 | Pengenal kuat sejenis berbeda (dua `ror` berbeda) walau nama sama | `baru`, dan `antrean` bila nama ketat sama (konflik kunci) |
| 3 | Cari ketat memberi tepat satu entitas, jenis sama, dan provinsi sama atau salah satunya kosong atau `nasional` | `tautkan` |
| 4 | Cari ketat memberi tepat satu entitas tetapi jenis atau provinsi berbeda | `antrean` |
| 5 | Cari ketat ambigu dan tidak ada akar tunggal | `antrean` |
| 6 | Tidak cocok ketat dan skor lunak `>= 0,60` | `antrean`, diurut menurut skor |
| 7 | Selain itu | `baru` |

Orang tanpa pengenal kuat tidak pernah ditautkan lewat nama saja: aturan 3 untuk `jenis = 'orang'` berubah menjadi `antrean` kecuali nama dan afiliasi (`bekerja-di`) sama dengan entitas yang ada. Alasan: nama orang sering kembar dan salah tautan mengenai data pribadi.

**Kasus tepi.** Alias yang sama pada dua entitas membuat kunci itu ambigu bagi keduanya; kurator memperbaiki alias, bukan pipeline. Entitas `ditarik` dan `digabung` tidak masuk indeks sebagai target (nama lamanya menunjuk target gabungan). Baris yang menyebut dirinya `DIRI` (§2.11) tidak diberi bintang tetapi tetap dicocokkan.

**Contoh (skor lunak).** a = "Surya Contoh Energi", b = "Surya Contoh Tenaga", situs sama (`suryacontoh.example.org`), provinsi 32 sama, jenis `lembaga` sama. Token `intiNama`: {surya, contoh, energi} dan {surya, contoh, tenaga}: irisan 2, gabungan 4, jaccard 0,5. Skor = 0,5 x 0,5 + 0,3 + 0,1 + 0,1 = **0,75**, jadi `antrean` biasa. Contoh keputusan: nama "PLN" (alias ke "PT PLN (Persero)") dengan satu entitas pemilik kunci itu, jenis dan provinsi (`nasional`) cocok, maka `tautkan`.

**Uji acuan.** `bangunIndeks.kunci-pendek-diabaikan`, `cariNama.ambigu-tidak-ditautkan`, `cariNama.pilih-akar`, `cariNama.nama-panjang-dalam-teks`, `skorKemiripan.acuan-0.75`, `putusanCocok.kunci-kuat`, `putusanCocok.konflik-kunci`, `putusanCocok.prov-beda-antrean`, `putusanCocok.orang-tanpa-pengenal`.

---

## 4. Tingkat bukti dan skor keyakinan

### 4.1 Enum tunggal `tingkat_bukti`

Satu enum untuk `fakta.tingkat_bukti`, `ikatan.tingkat_bukti`, dan label kepercayaan sel matriks risiko. Tidak ada kosakata kedua (pelajaran R12 §8.1: neraca-papua memakai empat kosakata dan menambalnya di tampilan). Nilai di luar enum DITOLAK saat impor, tidak ditambal saat tampil.

| Kunci | Urutan | Bobot | Indonesia (lencana) | Inggris | Arti |
| --- | --- | --- | --- | --- | --- |
| `terkonfirmasi` | 3 | 1,00 | Terkonfirmasi | Confirmed | Dokumen primer yang menyebut klaim itu telah dibuka dan dibaca; atau data dari penerbit asalnya |
| `kata-pihak` | 2 | 0,70 | Kata pihak itu | Party's own word | Pernyataan pihak yang bersangkutan sendiri (situs, siaran pers, daftar anggota asosiasi) tanpa konfirmasi independen |
| `cuplikan` | 1 | 0,40 | Cuplikan saja | Snippet only | Hanya terbaca dari sumber sekunder, berita, atau ringkasan; dokumen primer belum dibuka |
| `inferensi` | 0 | 0,20 | Hitungan kami | Our inference | Disimpulkan platform dari data tak langsung (mis. tag OSM, hitungan EST) |

**Fungsi.** `tingkatSah(jenisSumber, tingkat)` benar bila urutan `tingkat` tidak lebih tinggi daripada langit-langit jenis sumber (§3.2). `bobotTingkat(tingkat)` mengembalikan bobot di atas. Fakta `est = 1` wajib `tingkat_bukti = inferensi` (CHECK DT). Bobot bawaan, dikalibrasi pada uji §4.7.

**Normalisasi masukan lama (hanya untuk impor data neraca-papua atau CSV pihak lain):** `kata_perusahaan` -> `kata-pihak`; `terkonfirmasi`, `cuplikan`, `inferensi` dibawa; huruf besar diturunkan; kosakata `A_`, `B_`, `C_`, `D_` dan `primer`, `sekunder`, `klaim`, `tidak_ada` TIDAK ditebak: baris ditolak dengan galat `tingkat-bukti-tak-dikenal`. **Uji acuan:** `tingkatSah.langit-langit`, `bobotTingkat.empat-nilai`, `normTingkatLama.tolak-kosakata-lain`.

### 4.2 Skor keyakinan: `hitungKeyakinan`

**Definisi.** Angka 0 sampai 1 per profil entitas yang menyatakan seberapa jauh profil itu bisa dipercaya, dihitung pipeline (tidak diketik kurator) dari empat komponen: mutu bukti, banyaknya sumber independen, kesegaran pemeriksaan, dan kecocokan antar sumber. Skor tampil dengan pil "Hipotesis" dan kalimat alasan (PRD F-S4, DS §6.9).

**Masukan.** `profil = {entitas, butir[], sumber[]}` dan `kini` (tanggal). `butir` ialah fakta aktif dan ikatan aktif milik entitas pada **lapis Publik** (skor sama di semua lapis, §13.1): `{tipe: 'fakta'|'ikatan', kunci, nilai, per_tanggal, tingkat_bukti, sumber_id}`. `sumber` ialah baris `sumber` yang dirujuk: `{id, jenis, domain, diperiksa}`.

**Langkah.**

1. **Butir terbaik per kunci.** Kelompokkan `butir`: fakta menurut `kunci`, ikatan menurut `(jenis, lawan)`. Dari tiap kelompok ambil `tingkat_bukti` tertinggi. Jumlah kelompok = `n`. Bila `n = 0`: hasil `null`, alasan `tanpa-fakta-bersumber`, profil tampil "di luar sensus".
2. **K1 mutu bukti** = rata-rata `bobotTingkat` dari `n` butir terbaik.
3. **K2 sumber independen.** `n_eff` = jumlah domain berbeda di `sumber`, dengan domain yang seluruh sumbernya `via-pihak-ketiga` dihitung 0,5. `K2 = min(1, n_eff / 4)`.
4. **K3 kesegaran.** Untuk tiap sumber, umur `u` = hari antara `diperiksa` dan `kini`. `f(u) = 1` bila `u <= 180`; `f(u) = (1095 - u) / 915` bila `180 < u < 1095`; `f(u) = 0` bila `u >= 1095`. `K3` = rata-rata `f` atas semua sumber. (1095 hari = 36 bulan, selaras ambang "perlu diperiksa ulang" OPERASIONAL §2.1.)
5. **K4 kecocokan antar sumber.** Untuk tiap kunci fakta yang punya dua entri atau lebih dari `sumber_id` berbeda dengan `per_tanggal` saling berselisih paling banyak 365 hari: "dapat dibandingkan". Entri **cocok** bila `nilai_teks` sama setelah `normNama`, atau (angka) `|a - b| / max(|a|, |b|) <= 0,05`. `K4 = cocok / dapatDibandingkan`. Bila `dapatDibandingkan = 0`, K4 tidak dipakai dan bobot lainnya dinormalkan ulang.
6. **Gabung.** Bobot: `W1 = 0,40`, `W2 = 0,25`, `W3 = 0,20`, `W4 = 0,15`. `mentah = W1*K1 + W2*K2 + W3*K3 + W4*K4`; tanpa K4: `mentah = (W1*K1 + W2*K2 + W3*K3) / 0,85`.
7. **Batas atas** (diterapkan sesudah gabung, yang paling ketat menang):
   - semua sumber berjenis `via-pihak-ketiga`: skor maksimum **0,59**;
   - tidak ada satu pun butir terbaik berderajat `terkonfirmasi` atau `kata-pihak`: maksimum **0,59**;
   - hanya satu domain sumber: maksimum **0,74** (tidak bisa Tinggi dari satu sumber).
8. **Bulatkan** `bulat(skor, 2)`; lalu **label**: `>= 0,75` Tinggi; `>= 0,40` Sedang; selain itu Rendah (sama dengan DS §6.9, "Sedang 0,40 sampai 0,74" bila dibaca pada dua desimal).

**Keluaran.** `{skor: 0..1 | null, label: 'tinggi'|'sedang'|'rendah'|null, komponen: {K1,K2,K3,K4|null}, batas: [kode], alasan: [{kunci, param}]}`. Kalimat alasan dirakit dari butir tetap (kunci kamus `yakin.alasan.*`), selalu menyebut: jumlah sumber dan domain, berapa butir terkonfirmasi, umur periksa tertua, kecocokan antar sumber (atau "belum ada fakta yang bisa dibandingkan antar sumber"), dan batas yang dikenakan bila ada. Sumber lemah dinyatakan terang-terangan.

**Kasus tepi.** Sumber dengan `diperiksa` di masa depan: umur dipotong menjadi 0 dan dicatat sebagai peringatan data. Fakta `est = 1` ikut dihitung sebagai butir berderajat `inferensi` (bobot 0,20) dan tidak pernah dibandingkan sebagai "cocok" dengan angka yang diumumkan (kuncinya turunan). Fakta berlapis Anggota atau Pengurus TIDAK ikut dihitung. Entitas `ditarik` atau `digabung` tidak dihitung.

**Contoh 1 (Tinggi).** Entitas "PT Surya Contoh Energi (contoh)", `kini` = 2026-11-07. Empat sumber: s1 `dokumen-resmi` (diperiksa 2026-10-23), s2 `situs-sendiri` (2026-09-01), s3 `media` (2026-03-10), s4 `filing` (2025-11-07). Butir terbaik per kunci: `berdiri` terkonfirmasi (1,00), `kapasitas_mw` kata-pihak (0,70), `pendanaan_usd` cuplikan (0,40), `lokasi_alamat` kata-pihak (0,70), ikatan memasok bersumber filing terkonfirmasi (1,00).
- K1 = (1,00 + 0,70 + 0,40 + 0,70 + 1,00) / 5 = **0,76**.
- K2: empat domain berbeda, `n_eff` = 4, K2 = min(1, 4/4) = **1,00**.
- K3: umur s1 = 15 hari, s2 = 67, s3 = 242, s4 = 365. f = 1; 1; (1095-242)/915 = 0,93224; (1095-365)/915 = 0,79781. Rata-rata = **0,93251**.
- K4: dapat dibandingkan: `berdiri` (s1 = 2018, s2 = 2018, cocok), `kapasitas_mw` (s2 = 12,3 per 2026-09-01; s4 = 12,0 per 2025-11-07; selisih 365 hari, 2,4 persen, cocok), `pendanaan_usd` (s2 = 25 juta, s3 = 18 juta; 28 persen, tidak cocok). K4 = 2/3 = **0,66667**.
- Mentah = 0,40 x 0,76 + 0,25 x 1,00 + 0,20 x 0,93251 + 0,15 x 0,66667 = 0,304 + 0,25 + 0,18650 + 0,10 = 0,84050. Tidak ada batas atas. **Skor 0,84, Tinggi.**

**Contoh 2 (Sedang, tanpa K4).** Satu sumber `situs-sendiri`, diperiksa 20 hari lalu; dua butir `kata-pihak`. K1 = 0,70; K2 = 1/4 = 0,25; K3 = 1; K4 tidak ada. Mentah = (0,40 x 0,70 + 0,25 x 0,25 + 0,20 x 1) / 0,85 = 0,5425 / 0,85 = 0,63824. Batas satu domain (0,74) tidak mengikat. **Skor 0,64, Sedang.**

**Contoh 3 (batas atas mengikat).** Satu sumber `dokumen-resmi` diperiksa 10 hari lalu, tiga butir terkonfirmasi. K1 = 1; K2 = 0,25; K3 = 1. Mentah = (0,40 + 0,0625 + 0,20) / 0,85 = 0,77941. Batas satu domain menurunkan ke 0,74. **Skor 0,74, Sedang**, dengan alasan "hanya satu domain sumber".

**Uji acuan.** `hitungKeyakinan.acuan-0.84`, `hitungKeyakinan.acuan-0.64`, `hitungKeyakinan.batas-satu-domain`, `hitungKeyakinan.semua-pihak-ketiga-maks-0.59`, `hitungKeyakinan.tanpa-fakta-null`, `hitungKeyakinan.kesegaran-batas-180-1095`, `hitungKeyakinan.lapis-anggota-diabaikan`, `labelKeyakinan.batas-0.75-0.40`.

### 4.3 Memilih nilai bila sumber berbeda: `pilihFakta`

**Definisi.** Angka yang berbeda antar sumber (contoh potensi panas bumi 23,2, 23,9, dan 24 GW) disimpan dan ditampilkan sebagai rentang dengan sumbernya masing-masing, TIDAK dirata-rata diam-diam (OPERASIONAL §2.1, PRD F-S3).

**Masukan.** Entri fakta satu entitas satu kunci. **Keluaran.** `{utama, lainnya[], konflik, rentang}`.
1. `utama` = entri dengan urutan `tingkat_bukti` tertinggi; seri dipecahkan oleh `per_tanggal` terbaru, lalu peringkat jenis sumber lebih kecil (§3.2), lalu `id` terkecil.
2. `konflik` = benar bila ada entri lain yang tidak cocok dengan `utama` menurut aturan K4 (§4.2 langkah 5).
3. `rentang` hanya untuk angka berkonflik: `{min, maks}` dari semua entri yang `per_tanggal`-nya dalam 365 hari dari `utama`. Layar menulis keduanya dan sumbernya; kalimat catatan bawaan "Dua sumber berbeda: sumber A menyebut x, sumber B menyebut y."
4. Angka berbeda satuan ditolak digabung (galat `satuan-berbeda`), tidak dikonversi diam-diam.

**Contoh.** Potensi panas bumi: s1 23,2 GW (tingkat `kata-pihak`), s2 23,9 GW (`terkonfirmasi`), s3 24 GW (`cuplikan`), semuanya per 2025. `utama` = s2; konflik benar; rentang 23,2 sampai 24 GW dengan tiga sumber ditulis.

**Uji acuan.** `pilihFakta.konflik-rentang-tanpa-rata`, `pilihFakta.satuan-berbeda-ditolak`, `pilihFakta.seri-per-tanggal`.

### 4.4 `bulat2` dan batas label

`bulat2(x)` = `bulat(x, 2)`. Label dihitung dari angka SESUDAH dibulatkan: 0,745 menjadi 0,75 (Tinggi), 0,744 menjadi 0,74 (Sedang). Uji: `labelKeyakinan.batas-0.75-0.40`.

### 4.5 Status entitas dan "perlu diperiksa ulang"

`statusUmur(tanggalBuktiTerakhir, kini)`: umur dalam bulan kalender dari bukti hidup terakhir (maksimum `per_tanggal` fakta atau `tanggal_dokumen` sumber). `< 36` bulan `aktif`; `36 sampai < 60` bulan `perlu-diperiksa-ulang`; `>= 60` bulan `tidak-aktif` (OPERASIONAL §2.1). Dipakai §8.2.

### 4.6 Ringkasan konstanta

`KONSTANTA.keyakinan = {bobot: {K1: 0.40, K2: 0.25, K3: 0.20, K4: 0.15}, sumberJenuh: 4, segarHari: 180, kedaluwarsaHari: 1095, toleransiAngka: 0.05, jendelaBandingHari: 365, ambangTinggi: 0.75, ambangSedang: 0.40, batas: {satuDomain: 0.74, tanpaKuat: 0.59, semuaPihakKetiga: 0.59}}`. `/metode` membaca konstanta ini langsung (JM-E05); tidak ada angka kedua di dokumen layar.

### 4.7 Uji kalibrasi (syarat melepas pil "Hipotesis")

Skor keyakinan boleh berstatus `lolos` bila: (1) tiga puluh profil acak dari potret dinilai independen oleh dua peninjau METI Institute (KP C-20) dengan skala Tinggi, Sedang, Rendah; (2) korelasi Spearman antara skor dan penilaian rata-rata peninjau `>= 0,6` dengan `|t| >= 2` (fungsi `spearman`, §7.4); (3) tidak ada profil yang dinilai Rendah oleh kedua peninjau tetapi berlabel Tinggi. Ambang bawaan perancang (H-3); mengubahnya butuh persetujuan pemilik. Sampai lulus, `STATUS_UJI.keyakinan = "hipotesis"`.

---

## 5. Kuadran BUMN energi

### 5.1 Persentil dan peringkat

**`persentil(nilai[], x)`.** Persentil peringkat tengah: `(banyak nilai < x + banyak nilai == x / 2) / banyak nilai`. Rentang 0 sampai 1; nilai kembar mendapat posisi rata-ratanya (sama dengan `pctl` pada kode asal). Bila `nilai` kurang dari `NMIN` (bawaan 5 entitas bernilai), hasil `null` dengan alasan `data-belum-cukup`. `x` kosong menghasilkan `null`.

**`peringkat(nilai[], x)`.** Peringkat kompetisi (1, 2, 3, 3, 5): `1 + banyak nilai > x` bila urut menurun. Seri ditandai `=` di layar.

**Contoh.** Kapasitas EBT terpasang lima entitas (MW): A 600, B 150, C 0, D 150, E 2000. Terurut: 0, 150, 150, 600, 2000. Persentil A = (3 + 1/2) / 5 = 0,70; B = (1 + 2/2) / 5 = 0,40; C = (0 + 1/2) / 5 = 0,10; D = 0,40; E = (4 + 1/2) / 5 = 0,90. Peringkat menurun: E 1, A 2, B 3 (=), D 3 (=), C 5.

**Uji acuan.** `persentil.acuan`, `persentil.n-kurang-dari-nmin-null`, `peringkat.seri-kompetisi`.

### 5.2 Skor 0 sampai 5 per ukuran: `skorKuadran`

Tiap ukuran menghasilkan angka 0 sampai 5 (skala sama di dua sumbu, PRD F-R4), dibulatkan dua desimal di akhir. Ukuran bawaan (semuanya Hipotesis, KP C-16; daftar boleh ditambah pemilik tanpa mengubah fungsi):

| Ukuran | Rumus | Data |
| --- | --- | --- |
| `keuangan` | `5 x rata(persentil(aset), persentil(pendapatan), persentil(laba))` | fakta `aset_idr`, `pendapatan_idr`, `laba_idr` tahun terbit terbaru; ukuran dihitung bila minimal dua dari tiga ada |
| `kapasitas_ebt` | `5 x persentil(kapasitas_ebt_mw)` | `kapasitas_ebt_mw` setelah konsolidasi grup (§5.4) |
| `porsi_ebt` | `5 x (kapasitas_ebt_mw / kapasitas_total_mw)` | kedua fakta ada dan total > 0; 100 persen berarti 5 |
| `rencana_ebt` | `5 x persentil(kapasitas_rencana_mw)` | `kapasitas_rencana_mw` dari dokumen perencanaan yang bersumber |
| `mandat_ebt` | rubrik `skor_mandat`, §5.3 | fakta `skor_mandat` (EST wajib) |

Entitas tanpa angka sebuah ukuran TIDAK diberi 0: ia tidak ditempatkan di kanvas untuk ukuran itu, tampil di tabel dengan tanda `-` dan alasan, dan penyebut ditulis "N dari M entitas punya skor". Persentil `null` (n < NMIN) berarti ukuran itu belum bisa dipakai.

### 5.3 Rubrik `skor_mandat` (0 sampai 5, ditentukan peninjau, EST wajib)

`skor_mandat` = instrumen formal (0 tidak ada; 1 disebut dalam dokumen perencanaan; 2 diperintahkan peraturan) + peran dalam program prioritas (0 tidak ada; 1 pendukung; 2 pelaksana utama) + perhatian pejabat tinggi yang terdokumentasi (0 atau 1). Jumlah 0 sampai 5. Tiap komponen punya sumber; `rumus` fakta ditulis `M=a+b+c` dengan butir-butirnya (mis. `M=2+1+1: Perpres ..., program ..., pernyataan ...`). Tidak dihitung oleh orang yang terkait entitas yang dinilai (OPERASIONAL §4). Hak jawab 7 hari kerja sebelum terbit pertama (OPERASIONAL C-30) ialah gerbang proses, bukan rumus.

### 5.4 Himpunan kuadran dan konsolidasi grup

`anggotaKuadran(entitas[])`: entitas `lembaga` berstatus `aktif`, `kategori = 'bumn'`, yang punya sedikitnya satu sektor utama (bukan `terkait`) di `label` atau `sektor`, dan **bukan anak usaha** (tidak ada ikatan `memiliki` masuk dari BUMN lain). Anak usaha tampil di halaman grup (PRD F-R4), tidak di kanvas.

`kapasitasGrup(induk, graf)`: kapasitas EBT grup = kapasitas langsung induk + jumlah (kapasitas anak x `persen`/100) atas ikatan `memiliki` aktif ke anak; anak tanpa `persen` tidak ditambahkan dan ditandai `di induk: persen tidak diketahui`. Pembobotan ekuitas menghindari hitung ganda (angka anak sudah ada di induk); hasilnya berlabel **EST** karena itu hitungan kami. **Uji acuan:** `kapasitasGrup.tanpa-hitung-ganda`, `anggotaKuadran.anak-usaha-keluar`.

### 5.5 Median, kuadran, dan nama

**`kuadran(x, y, medX, medY)`.** `medX` dan `medY` ialah median skor yang ada pada masing-masing sumbu (garis silang di median: separuh entitas di tiap sisi). Titik tepat di median masuk sisi **tinggi** (`>=`). Hasil satu dari `ka` (kanan-atas), `ki` (kiri-atas), `kb` (kanan-bawah), `kib` (kiri-bawah). Tanpa x atau y: `null`.

**Lensa** ialah pasangan sumbu bernama. Nama kuadran mengikuti lensa; kunci kamus `kuadran.<lensa>.<ka|ki|kb|kib>`. Lensa bawaan:

| Lensa | X | Y | `ka` | `ki` | `kb` | `kib` |
| --- | --- | --- | --- | --- | --- | --- |
| `kemampuan-arah` ("Kemampuan dan arah") | `kapasitas_ebt` | `porsi_ebt` | Besar dan sudah beralih | Kecil tetapi condong EBT | Besar, EBT masih kecil | Kecil, EBT masih kecil |
| `uang-mandat` ("Uang dan mandat") | `keuangan` | `mandat_ebt` | Kuat dan diminta negara | Kecil tetapi diminta negara | Kuat tanpa dorongan mandat | Kecil dan tanpa dorongan mandat |
| `rencana-nyata` ("Rencana dan kenyataan") | `kapasitas_ebt` | `rencana_ebt` | Berjalan dan berencana | Baru berencana | Berjalan, belum berencana | Belum keduanya |

Teks Inggris menyusul di `en.json` (ditandai perlu tinjau, KP C-14). Nama-nama di atas bawaan perancang, bukan salinan nama 1001startup.id, dan tidak memakai kata "netral" atau penilai.

**Contoh (lensa `kemampuan-arah`, lima entitas).** X = skor `kapasitas_ebt` = 5 x persentil: A 3,50, B 2,00, C 0,50, D 2,00, E 4,50. Y = skor `porsi_ebt` = 5 x (EBT/total): A 600/6000 = 10 persen menjadi 0,50; B 25 persen menjadi 1,25; C 0 menjadi 0,00; D 50 persen menjadi 2,50; E 2000/10000 = 20 persen menjadi 1,00. Median X (0,50; 2,00; 2,00; 3,50; 4,50) = 2,00; median Y (0,00; 0,50; 1,00; 1,25; 2,50) = 1,00. Penempatan: A (3,50; 0,50) = `kb`; B (2,00; 1,25) = `ka` (X di median masuk tinggi); C (0,50; 0,00) = `kib`; D (2,00; 2,50) = `ka`; E (4,50; 1,00) = `ka` (Y di median masuk tinggi). Peringkat X: E 1, A 2, B 3 (=), D 3 (=), C 5.

**Label Hipotesis.** Seluruh kuadran memakai `STATUS_UJI.kuadran = "hipotesis"`. Syarat lolos (H-5): dua peninjau METI Institute menyusun peringkat ukuran tanpa melihat hasil, korelasi Spearman dengan peringkat rumus `>= 0,6` untuk tiap ukuran yang dipakai. Sampai lulus, pil "Hipotesis" dan "Cara menghitung" terbuka wajib (KP C-16). Skor dan kuadran tidak dipengaruhi status keanggotaan atau sponsor (OPERASIONAL §4).

**Uji acuan.** `skorKuadran.keuangan-dua-dari-tiga`, `skorKuadran.porsi-ebt`, `kuadran.median-masuk-tinggi`, `kuadran.acuan-lima-entitas`, `kuadran.entitas-tanpa-skor-tidak-ditempatkan`.

---

## 6. Graf ikatan, "Terhubung", rantai pasok, pembiaya

### 6.1 Bentuk graf

`graf.json` berisi `{simpul, sisi}` (R1 §3). `simpul` ialah objek berkunci `slug` dengan `{j: jenis, n: nama, logo?, bintang?}`. `sisi` ialah larik `[dari_slug, ke_slug, jenis, meta?]` dengan `meta = {t: per_tanggal, b: tingkat_bukti, s: sumber_id, porsi?, nilai?, satuan?, jp?}`. Graf dibangun per potret oleh `hubung.mjs` memakai `bangunGraf` dan tidak pernah dihitung di Worker.

### 6.2 `bangunGraf`: aturan pembangunan

Urutan tetap (uji `bangunGraf.urutan-aturan`):
1. Ambil entitas `status = 'aktif'`; alihkan semua rujukan ke `digabung_ke` (satu langkah).
2. Buang entitas dan ikatan yang kena daftar tolak (§12) dan entitas `orang` ber-`tampil = 0`.
3. Pilih ikatan menurut lapis potret (§13) dan `dummy = 0`.
4. Buang ikatan ke diri sendiri sesudah pengalihan (dua entitas yang digabung menjadi satu).
5. Balik `membeli-dari` menjadi `memasok`; urutkan ikatan simetris.
6. Hapus kembar: kunci dedup `dari|ke|jenis|mulai|sumber_id` (sama dengan indeks unik DT). Ikatan sama dari sumber berbeda dipertahankan sebagai dua butir pada satu sisi (tingkat bukti terbaiknya yang tampil, sumber lain di daftar).
7. Buang ikatan `selesai < kini` dari hitungan aktif (tetap ada di riwayat profil).
8. Simpul tanpa sisi dan tanpa profil dibuang; simpul "di luar sensus" dipertahankan hanya bila punya sisi.

**Kasus tepi.** Ikatan yang menunjuk entitas yang sudah dihapus permanen tidak mungkin ada (cascade). Ikatan yang menunjuk entitas `ditarik` dibuang. **Uji acuan:** `bangunGraf.membeli-dari-dibalik`, `bangunGraf.tolak-membuang-sisi`, `bangunGraf.gabung-bukan-diri-sendiri`, `bangunGraf.dedup-sumber-beda`.

### 6.3 Larangan melewati rel bersama (rantai dua tingkat)

**Definisi.** Halaman satu entitas menampilkan peta rantai dua tingkat: pemasok dari pemasok dan pelanggan dari pelanggan (PRD F-R1). Rantai **tidak diikuti melalui rel bersama**: simpul yang menghubungkan hampir semua pihak (di 1001startup.id: penyedia komputasi awan; di energi: PLN sebagai pembeli hampir semua IPP, bank pembangunan besar, penyedia perangkat lunak umum), karena mengikutinya membuat peta menjadi satu gumpalan yang tidak menjawab apa pun.

`petaDuaTingkat(graf, mulai, opsi)`:
1. Hanya sisi `memasok` (setelah pembalikan) dengan `jenis_pasok` di `DIIKUTI` = {`bahan-baku`, `komponen`, `manufaktur-kontrak`, `peralatan`, `perangkat-lunak`, `lisensi-teknologi`, `jasa-epc`}, dan sisi `memiliki`. `energi` dan `pembiayaan` TIDAK diikuti (listrik dan uang mengalir lewat rel bersama).
2. Kedalaman maksimum 2 dari `mulai`.
3. **Rel bersama** = simpul dengan jumlah tetangga unik pada sisi yang diikuti `>= AMBANG_REL` (bawaan 25), atau yang ditandai `rel_bersama` oleh kurator. Rel bersama tampil sebagai simpul ujung tetapi sisi-sisinya yang lain TIDAK dikembangkan.
4. Kalimat jujur wajib di bawah peta: "Hanya hubungan teknologi dan manufaktur yang diikuti, dan tidak lewat rel bersama. Tidak adanya tautan bukan berarti tidak adanya hubungan, hanya belum ada sumber publik yang menyebutnya."

**Kasus tepi.** `mulai` sendiri rel bersama: tingkat pertama tetap ditampilkan (halaman miliknya), tingkat kedua dari tetangganya dibatasi 25 simpul pertama menurut jumlah ikatan, sisanya "dan N lainnya". Siklus: simpul tidak diulang. `AMBANG_REL = 25` ialah bawaan, dikalibrasi dengan data F1 di JM-D10 (H-2).

**Contoh.** Simpul Z punya 30 pemasok `komponen` dan 12 pelanggan: derajatnya 42 pada sisi yang diikuti, jadi rel bersama; saat peta entitas X (pelanggan Z) dibangun, Z muncul sebagai pemasok X tetapi 29 pemasok Z lainnya tidak ditarik masuk.

**Uji acuan.** `petaDuaTingkat.rel-bersama-berhenti`, `petaDuaTingkat.energi-tidak-diikuti`, `petaDuaTingkat.kedalaman-2`, `petaDuaTingkat.tanda-kurator`.

### 6.4 Bagian "Terhubung"

`kelompokTerhubung(slug, graf)` mengelompokkan semua tetangga per (jenis, arah) dengan teks sisi masing-masing (§3.1), urut tetap: (1) Pimpinan dan anggota (`memimpin`, `anggota-dari` masuk, `bekerja-di` masuk, `afiliasi-dengan` masuk), (2) Memiliki dan dimiliki, (3) Memasok dan dipasok, (4) Mendanai dan didanai, (5) Mengembangkan dan membangun, (6) Mengatur dan diatur, (7) Mitra dan lokasi, (8) Karya (`menulis`). Tiap kelompok diurut menurut tingkat bukti menurun, lalu `per_tanggal` terbaru, lalu nama. Kunci tetangga ambigu tidak ditautkan (§3.3); `DIRI` tidak pernah diberi bintang. **Uji acuan:** `kelompokTerhubung.urutan-kelompok`, `kelompokTerhubung.urut-dalam-kelompok`.

### 6.5 "Sejenis"

`sejenis(e, semua)`: kandidat ialah entitas `di_sensus = 1` selain `e`. `skor = 2 x |label sektor yang sama| + 1 x [kategori sama] + 0,5 x [prov sama]`. Ambil enam teratas dengan `skor > 0`, seri dipecahkan oleh nomor sensus lebih kecil (§8.5), lalu nama. Tiap nama tampil dengan nomor sensusnya. Entitas yang bukan `di_sensus` tidak punya "Sejenis". **Uji acuan:** `sejenis.acuan-enam`, `sejenis.seri-nomor-sensus`.

### 6.6 `strategis`: penanda pihak luar yang menonjol (Hipotesis)

**Definisi.** Port `strategis()` asal: skor transparan untuk organisasi luar dari graf, bukan penilaian subjektif; bintang di UI. **`DIRI` (§2.11) tidak pernah diberi bintang** dan tidak dihitung dalam persentil.

Komponen per organisasi (lembaga, `kategori` bukan `DIRI`): `orang` (jumlah orang yang `bekerja-di`, `anggota-dari`, `memimpin` ke organisasi, tampil publik), `dana` (jumlah `nilai_num` USD ikatan `mendanai` keluar, tanpa hitung ganda §6.7), `proyek` (jumlah proyek yang dikembangkan, dibangun, dimiliki), `rantai` (jumlah mitra pasok unik, pemasok dan pelanggan), `jangkau` (jumlah tetangga unik). Tiap komponen diubah ke persentil di antara organisasi yang komponennya > 0, lalu `skor = 0,2 x (p_orang + p_dana + p_proyek + p_rantai + p_jangkau)`; `aktif` = jumlah komponen > 0.

Bintang: `aktif >= 2` dan `skor >= 0,35`; enam puluh skor tertinggi ditambah tiga teratas di tiap `kategori` (aturan asal). Keluaran `{skor, aktif, alasan[], peringkat, bintang}`. `STATUS_UJI.strategis = "hipotesis"` (bobot sama rata, bawaan; bandingkan `ponytail` di asal). **Uji acuan:** `strategis.DIRI-tanpa-bintang`, `strategis.syarat-aktif-dan-skor`, `strategis.tiga-teratas-per-kategori`.

### 6.7 Ringkasan pembiaya: `ringkasPembiaya`

**Definisi.** Untuk `/pembiaya` (PRD F-R2) dari ikatan `mendanai` agar angka tidak diklaim lebih dari isinya.

Aturan:
1. **Total terungkap pembiaya** = jumlah `nilai_num` ikatan `mendanai` milik pembiaya itu saja (jumlah yang DIA berikan), dikelompokkan menurut `satuan` (USD dan IDR dijumlah terpisah, tidak dikonversi). Fakta entitas `pendanaan_usd` (semua investor digabung) TIDAK dijumlahkan ke pembiaya mana pun.
2. **Penyebut.** Tiap total menyebut "N dari M ikatan punya angka"; ikatan tanpa `nilai_num` dihitung sebagai "angka tidak diumumkan", bukan 0.
3. **Entitas didanai** = jumlah entitas unik (setelah pengalihan gabung), bukan jumlah ikatan.
4. **Jenis dana dipisah** (`JENIS_DANA`, §2.5): total per jenis; ekuitas, hibah, pinjaman, dan dana iklim tidak dijumlah menjadi satu angka.
5. **Hitung ganda.** Dua ikatan `mendanai` dengan `sumber_id` yang sama, penerima sama, dan nilai sama dihitung sekali. Bila induk dan anak usahanya sama-sama dicatat menerima dana yang sama, nilai anak ditandai `di induk` dan tidak dijumlah.
6. **Kalimat peringatan wajib** di halaman profil pembiaya: angka portofolio entitas ialah gabungan semua investor, bukan cek pembiaya ini.

**Contoh.** Pembiaya A: ikatan ke X (10 juta USD, `ekuitas`), ke Y (5 juta USD, `pinjaman`), ke Z (tanpa angka). Hasil: entitas didanai 3; total terungkap USD 15 juta (ekuitas 10, pinjaman 5); penyebut "2 dari 3 ikatan punya angka"; Z dicatat "angka tidak diumumkan". Pembiaya B memberi X 20 juta USD. Portofolio X pada fakta `pendanaan_usd` = 30 juta (semua investor), yang cocok dengan 10 + 20 hanya bila tidak ada investor lain; halaman X menulis "Total terungkap semua investor 30 juta USD", bukan menjumlah A dan B.

**Uji acuan.** `ringkasPembiaya.acuan`, `ringkasPembiaya.satuan-tidak-dicampur`, `ringkasPembiaya.hitung-ganda-di-induk`, `ringkasPembiaya.jenis-dana-terpisah`.

---

## 7. Skor kesiapan provinsi

### 7.1 Definisi

Indeks 0 sampai 100 per provinsi yang menyatakan seberapa siap provinsi itu mengembangkan EBT, dari persentil lima komponen di antara provinsi yang punya angka (port `kesiapanDaerah` asal, diganti komponennya). Berstatus Hipotesis (KP C-16). Tampil di rapor provinsi (F-W1) dan tab Wilayah (F-W2).

### 7.2 Komponen

| Komponen | Rumus | Fakta | Arah baik |
| --- | --- | --- | --- |
| `pemanfaatan` | `terpasang_gw / potensi_gw`, dipotong paling tinggi 1 | `terpasang_gw`, `potensi_gw` | tinggi |
| `elektrifikasi` | `rasio_elektrifikasi_persen` | langsung | tinggi |
| `bauran` | `bauran_ebt_persen` | langsung | tinggi |
| `ekosistem` | `jumlah entitas di_sensus di provinsi / penduduk_jiwa x 1.000.000` | hitungan §8 dan `penduduk_jiwa` | tinggi |
| `pakar` | `jumlah pakar OpenAlex terhubung ke provinsi / penduduk_jiwa x 1.000.000` | graf dan `penduduk_jiwa` | tinggi |

Nilai potensi yang berkonflik antar sumber dipilih oleh `pilihFakta` (§4.3) dan versinya ditulis di kartu. Komponen hanya dihitung dari fakta bertingkat `kata-pihak` atau lebih tinggi; `cuplikan` dan `inferensi` tidak masuk (menghindari indeks bertumpu pada hitungan lemah).

### 7.3 `kesiapanProvinsi(baris[])`

Untuk tiap provinsi `p`: `komp_k = persentil(nilai_k semua provinsi bernilai, nilai_k(p))` (§5.1; `NMIN` untuk provinsi = 10). `skor = bulat(100 x rata(komp tersedia), 0)`, **minimal tiga komponen tersedia**, selain itu `null` dengan alasan `komponen-kurang` (layar menulis alasannya dan komponen mana yang belum ada, tidak mengosongkan kolom). `peringkat` kompetisi atas provinsi bernilai.

Kuadran kesenjangan (analog asal): X = skor kesiapan, Y = persentil `potensi_gw`; `kuadran(x, y, median, median)` (§5.5) dengan nama `prioritas-bantu` (potensi tinggi, kesiapan rendah), `siap-berpotensi`, `perkuat-dasar`, `siaga`. Bawaan, bobot sama rata (`ponytail` asal).

**Contoh** (lima provinsi fiktif P1 sampai P5, tiga komponen). Rasio elektrifikasi (persen): 99,9; 98,5; 97,0; 99,9; 92,0. Bauran EBT (persen): 40; 22; 15; 22; 5. Entitas sensus per sejuta jiwa: 8,0; 3,0; 6,0; 1,0; 0,5. Untuk P3: persentil elektrifikasi = (1 + 1/2) / 5 = 0,30; bauran = (1 + 1/2) / 5 = 0,30; ekosistem = (3 + 1/2) / 5 = 0,70. Rata-rata = 0,43333; **skor 43**. Provinsi dengan hanya dua komponen: `null`, alasan `komponen-kurang`.

### 7.4 Uji balik: `spearman`, `ujiKesiapan`

`spearman(a, b)` ialah korelasi peringkat (peringkat tengah untuk seri) dengan statistik `t = r x sqrt((n-2)/(1-r^2))`. `ujiKesiapan(baris, tambahanMW)` membandingkan skor kesiapan dengan kapasitas EBT tambahan tiga tahun berikutnya per sejuta jiwa. **Lulus** bila `n >= 20` provinsi, `r >= 0,2`, dan `|t| >= 2`; tidak lulus berarti layar tetap memberi pil Hipotesis. Batas: skor memakai data sekarang, tambahan kapasitas dari masa lalu atau berikutnya; ini menguji kecocokan, bukan ramalan, dan korelasi bukan sebab. Bawaan perancang (H-3). **Uji acuan:** `kesiapanProvinsi.acuan-43`, `kesiapanProvinsi.kurang-komponen-null`, `kesiapanProvinsi.potensi-berkonflik`, `spearman.acuan`, `ujiKesiapan.ambang`.

---

## 8. Sensus dan hitungan per sektor dan provinsi

### 8.1 Syarat masuk sensus: `layakSensus`

`di_sensus` bernilai 1 hanya bila semua syarat berikut (OPERASIONAL §2.1; empat yang pertama diperiksa mesin, yang kelima oleh kurator):

1. Ada keberadaan hukum atau fisik yang bisa dibuktikan: sedikitnya satu fakta atau `entitas.sumber_id` berjenis sumber peringkat 1 atau 2.
2. `jenis = 'lembaga'`, `status = 'aktif'`, dan `sektor` salah satu dari 12 nilai non-`terkait` (CHECK DT).
3. Aktif dalam 36 bulan terakhir (`statusUmur`, §4.5, hasil `aktif`; `perlu-diperiksa-ulang` tetap masuk dengan penanda, `tidak-aktif` keluar dari hitungan aktif tetapi tetap tampil sebagai arsip).
4. Tidak ada di daftar tolak (§12).
5. Minimal satu fakta bersumber lengkap dan satu pernyataan "apa yang dilakukan" yang ditulis ulang kurator (`ringkas` tidak kosong).

`layakSensus(e, fakta, sumber, kini, tolak)` mengembalikan `{ok, alasan[]}`; `alasan` berisi kode syarat yang gagal. Entitas dengan ikatan bersumber tetapi tidak `ok` ialah "di luar sensus" (PRD F-S6) dan tidak dihitung di U1.

**Uji acuan.** `layakSensus.alasan-gagal`, `layakSensus.terkait-ditolak`, `statusUmur.batas-36-60`.

### 8.2 Status siklus hidup

`aktif` (< 36 bulan), `perlu-diperiksa-ulang` (36 sampai < 60), `tidak-aktif` (>= 60 atau pembubaran bersumber). Entitas pembubaran: status `tidak-aktif` dengan tanggal, tampil sebagai arsip, keluar dari hitungan sensus aktif.

### 8.3 `hitungSensus` dan chip berhitungan

**Masukan.** Daftar entitas `di_sensus = 1` pada lapis Publik, pilihan filter `{sektor[], prov, boolean{...}, cari}`. **Keluaran.** `{total, perSektor, perProv, matriks, provinsiAda}`.

Aturan:
1. **Total** menghitung entitas unik sekali. **Chip sektor** menghitung entitas yang sektor utama atau salah satu label sektornya sama dengan chip; karena itu jumlah chip bisa melebihi total (entitas multi-sektor muncul di beberapa chip). Penyebut selalu ditulis.
2. **Chip menghormati filter lain** (DS §6.7): hitungan tiap chip dihitung dengan semua filter kecuali filter sektor itu sendiri; sektor dengan hitungan 0 tetap tampil redup dengan `0`, tidak pernah disembunyikan dan tidak pernah menampilkan 0 diam-diam.
3. **Pilihan sektor.** `/perusahaan` satu chip aktif; `/direktori` multi-pilih dengan `cocokSektor(pilihan, e)` berarti OR dan pilihan kosong berarti semua (PRD F-J10). URL `?sektor=a,b`.
4. **Provinsi.** `provinsiAda` = jumlah kode provinsi berbeda (2 angka) yang punya minimal satu entitas; nilai `nasional` dan kosong TIDAK dihitung sebagai provinsi dan ditulis "N entitas tanpa provinsi".
5. **Filter boolean** (PRD F-S2): `pendanaan_terungkap` (ada fakta `pendanaan_usd` atau `_min`), `kapasitas_tercatat` (ada `kapasitas_mw` atau proyek bersumber), `sembunyikan_anak_grup` (tidak ada ikatan `memiliki` masuk dari entitas sensus lain), `anggota_meti` (`anggota_meti = 1`).
6. **Hitungan publik hanya dari entitas lapis Publik** (§13.1) supaya keberadaan entitas di lapis lain tidak bocor lewat angka.

**Contoh.** Lima entitas sensus: e1 (surya, 32), e2 (surya + penyimpanan, 31), e3 (air, 32), e4 (surya, `nasional`), e5 (panas-bumi, 32). Total = 5. Chip: surya 3 (e1, e2, e4), penyimpanan 1, air 1, panas-bumi 1, jumlah chip 6 (> 5). `provinsiAda` = 2 (31 dan 32); "1 entitas tanpa provinsi". Dengan filter provinsi 32, chip surya = 1, air = 1, panas-bumi = 1, penyimpanan = 0 (redup, `0`).

**Uji acuan.** `hitungSensus.chip-hormati-filter`, `hitungSensus.multisektor-total-sekali`, `hitungSensus.nasional-bukan-provinsi`, `hitungSensus.hitungan-hanya-lapis-publik`, `cocokSektor.or-dan-kosong`.

### 8.4 MW: `jumlahMW`

MW dijumlah hanya dari **proyek** (bukan entitas ganda) berstatus `beroperasi` dengan `kapasitas_mw`. `diumumkan`, `direncanakan`, dan `konstruksi` tidak masuk MW terpasang dan masing-masing dijumlah dalam kelompok sendiri. Potensi, terpasang, dan rencana TIDAK pernah dijumlah menjadi satu angka (R12 §6.2 butir 12). Kolom MW di tabel sensus: jumlah MW proyek `beroperasi` yang dikembangkan atau dimiliki entitas; bila entitas tak punya proyek bersumber tetapi punya fakta `kapasitas_mw`, angka fakta dipakai dengan penanda "dari profil"; keduanya tidak pernah dijumlah. Proyek yang dimiliki bersama dihitung pada kepemilikan `persen`/100 bila `persen` diketahui, selain itu penuh pada pengembang utama dan ditandai `di induk`. Tiap total menyebut "N dari M proyek punya MW". **Uji acuan:** `jumlahMW.diumumkan-tidak-masuk`, `jumlahMW.tanpa-hitung-ganda`, `jumlahMW.penyebut`.

### 8.5 Nomor sensus

`nomorSensus(e, daftar)`: "#n dari N" dengan `N` = banyak entitas sensus di potret dan `n` = urutan menaik menurut `entitas.id` di antara entitas sensus pada potret itu. Stabil dalam satu potret dan satu tanggal beku; berubah antar potret bila ada yang ditarik. Dipakai juga pada "Sejenis". Bawaan (H-8); bila pemilik menginginkan nomor permanen, kolom baru di DT diperlukan.

**Uji acuan.** `nomorSensus.urut-id`, `nomorSensus.satu-potret`.

---

## 9. Label EST, tanda kosong, "Cara menghitung", "Cara mengutip"

### 9.1 Kapan `EST` wajib

`EST` menandai angka turunan: hitungan platform dari angka lain, bukan angka yang diumumkan sumbernya (DS §6.9). Aturan yang dijaga mesin:
1. `fakta.est = 1` menuntut `rumus` terisi dan `tingkat_bukti = inferensi` (CHECK DT).
2. `perluEst(kunci)` benar untuk kunci bertanda "wajib" di §2.8 (`output_idr`, `skor_mandat`); fakta kunci itu tanpa `est = 1` ditolak ("Angka turunan harus berlabel EST dan menyebut rumusnya", ALUR 2.1 langkah 4).
3. Angka hasil agregasi pipeline (kuadran, kesiapan, kapasitas grup §5.4) ditandai EST dan Hipotesis di layar walau tidak disimpan sebagai fakta.
4. `EST` tidak pernah dipasang pada angka yang diumumkan sumber. Angka EST tidak pernah dijumlah dengan angka yang diumumkan dalam satu total tanpa memisahkannya.

### 9.2 Penanda angka

| Penanda | Arti | Tempat penyimpanan |
| --- | --- | --- |
| `EST` | Hitungan kami | `fakta.est = 1` |
| `min` | Batas bawah (angka sebenarnya lebih besar) | kunci berakhiran `_min` (§2.8) |
| `di induk` | Sudah masuk angka grup induknya; tidak dijumlah lagi | dihitung dari ikatan `memiliki`, tidak disimpan |
| `-` (strip) | Tidak ada angka publik yang kredibel | `fakta.alasan_kosong`; selalu disertai satu dari empat alasan (§2.8) |
| `beku <tanggal>` | Angka cerita dibekukan pada tanggal itu | `cerita_<slug>.json` |
| `Hipotesis` | Skor atau kuadran belum diuji | `STATUS_UJI` (§P.3) |

Tidak ada angka yang diisi tebakan; tiap baris tanpa angka menyebut satu alasan; tiap total menyebut berapa baris yang menyumbang ("249 dari 558 baris"). Penanda didaftarkan di `/metode`.

### 9.3 Batas bawah `_min`

`pendanaan_usd_min` dipakai bila hanya sebagian putaran terungkap. Aturan: tampil dengan `min`; masuk total sebagai batas bawah dan total diberi `min`; tidak dijumlahkan dengan `pendanaan_usd` pada entitas yang sama (hanya satu dari keduanya dipakai: yang tanpa akhiran bila ada). **Uji acuan:** `penanda.min-tidak-dijumlah-dengan-biasa`.

### 9.4 `estimasiOutput`: output sebagai pekerja x nilai tambah per pekerja

**Definisi.** Output tahunan perusahaan dalam arti **nilai tambah bruto** (apa yang ditambahkan ke PDB), bukan pendapatan dan bukan gaji (R9 §4.2): `output = pekerja x jangkar_sektor`. Dihitung hanya bila kedua masukan ada; tidak pernah diturunkan dari pendanaan, valuasi, atau pendapatan.

**Masukan.** `pekerja` (fakta `pekerja`, `orang`, dengan tanggal baca), `jangkar` (Rp juta nilai tambah per pekerja per tahun, per sektor, dengan sumber BPS: PDRB lapangan usaha dan Sakernas). **Keluaran.** `{nilai_idr, rumus, est: true}` atau `null` dengan alasan.

**Kasus tepi.**
- Tanpa `pekerja`: `null`, alasan `belum-dicari` atau `tidak-dipublikasikan` menurut fakta; TIDAK diimputasi.
- Tanpa jangkar sektor: `null`, alasan `menunggu-data`. **Tabel jangkar bawaan KOSONG**: tidak ada angka bawaan (angka default 1001startup.id tidak disalin, KP D15). Pengisian jangkar tiap sektor memerlukan sumber dan peninjau METI Institute (H-4).
- Pengganda tidak langsung tidak dipakai di F1; total portofolio ialah jumlah baris tanpa pengganda.
- Baris `output_idr` tidak pernah ditulis sebagai angka perusahaan yang "terukur": layar menulis "Hitungan kami dari jumlah pekerja dan jangkar sektor" dan menautkan `/metode`.

**Teks rumus** (disimpan di `fakta.rumus`, maksimum 300 karakter): `{pekerja} pekerja x Rp {jangkar} juta nilai tambah per pekerja per tahun (jangkar sektor {sektor}, {sumber jangkar})`.

**Contoh (angka ilustrasi, bukan data BPS).** 110 pekerja (dibaca 2026-06-30) dan jangkar contoh Rp 500 juta per pekerja: `110 x 500 = 55.000` juta rupiah = **Rp 55 miliar per tahun**, EST. Hasil ditampilkan "Rp55 miliar per tahun (EST)" di ID dan "IDR 55 billion per year (EST)" di EN (§10.3).

**Uji acuan.** `estimasiOutput.acuan-55-miliar`, `estimasiOutput.tanpa-jangkar-null`, `estimasiOutput.tanpa-pekerja-tidak-diimputasi`, `perluEst.kunci-turunan`.

### 9.5 "Cara menghitung"

Setiap halaman publik punya bagian ini (PRD F-S7, TIKET §3.F). Susunan tetap: (1) apa yang dihitung dan rumusnya (merujuk kunci `metode.*`), (2) penyebut tiap total, (3) apa yang TIDAK dihitung dan alasannya, (4) batas. `METODE` di `algo.js` menyimpan tabel "tidak dihitung" yang dibaca `/metode` (JM-E05):

| Tidak dihitung | Ada di mana | Alasan |
| --- | --- | --- |
| Potensi, terpasang, dan rencana digabung jadi satu angka | Terpisah per kunci (`potensi_gw`, `terpasang_gw`, `kapasitas_rencana_mw`) | Tidak sebanding (R12 §6.2 butir 12) |
| Proyek `diumumkan` ke MW terpasang | Hitungan sendiri per status | Belum ada fisik |
| Pendanaan satu entitas dijumlah ke tiap pembiaya | Hanya `nilai_num` ikatan pembiaya itu | Angka entitas gabungan semua investor |
| Entitas "di luar sensus" ke U1 dan total sensus | Halaman rantai | Tidak punya profil lengkap |
| Orang dengan `tampil = 0` | Tidak tampil | Aturan privasi (KPV §1) |
| Angka EST ke total angka yang diumumkan | Dipisah dan berlabel | Beda sifat |
| Sektor `nuklir` dan `ccs` ke sensus | Profil boleh ada | KP C-12 bawaan |
| Skor keyakinan dirata-ratakan antar entitas | Tidak ada | Skor menjawab satu profil, bukan kualitas seluruh data |
| Output dengan pengganda tidak langsung | Tidak ada | Tidak dipakai di F1 |

### 9.6 "Cara mengutip" dan tanggal beku: `kutip`

`kutip({nama, tanggal, url, bahasa})` merakit baris sitasi dari kunci kamus `jm.kutip.pola` (DS §7): ID "Kutip sebagai {nama}, Jaringan METI, sensus ekosistem energi terbarukan Indonesia, diperbarui {tanggal}. {url}"; EN "Cite as {name}, METI Network, census of Indonesia's renewable energy ecosystem, updated {date}. {url}". `tanggal` ialah **tanggal beku**: tanggal potret publik yang dipakai halaman (`meta.json`), bukan tanggal buka (DS §6.5). Tanggal diformat §10.2. Bila `tanggal` atau `url` kosong, fungsi gagal dengan galat (tombol salin tidak dirender), bukan menulis sitasi tak lengkap. **Uji acuan:** `kutip.acuan-id-en`, `kutip.tanpa-tanggal-galat`.

### 9.7 Kalimat "Jawaban singkat": `jawabanSingkat`

**Definisi.** Kalimat fakta berstempel tanggal di awal tiap halaman publik (PRD F-S1): disusun dari klausa bersyarat; **klausa yang medannya kosong dibuang**, kalimat tidak pernah memuat "null", "NaN", atau tanda tanya. Templat ada di kamus (`jm.menurut` + klausa). **Contoh:** klausa [`sensus mencatat {N} entitas EBT`] [`di {M} provinsi`] [`dengan {K} ikatan bersumber`] dengan N = 312, M = 31, K kosong menghasilkan "Per 7 Nov 2026, sensus mencatat 312 entitas EBT di 31 provinsi." (angka contoh). Bila N kosong, seluruh kalimat diganti pesan "Data belum tersedia" (ALUR 3.1 langkah 1), bukan kalimat berlubang. **Uji acuan:** `jawabanSingkat.buang-klausa-kosong`, `jawabanSingkat.tanpa-inti-pesan-belum`.

---

## 10. Formatter angka, tanggal, dan jarak

Satu pintu format untuk semua layar dan pipeline (KP D17, DT §8.4 butir 3): `angka()`, `tanggal()` di `public/i18n.js` memanggil fungsi di `algo.js`; tidak ada `toLocaleString` tersebar (gerbang `selera-angka`, `gerbang-i18n`).

### 10.1 Angka

**`bulat(n, d)`**: setengah menjauhi nol atas nilai desimal tertulis; `bulat(1.005, 2)` = 1,01; `bulat(-2.5, 0)` = -3; `bulat(0.8405, 2)` = 0,84. Untuk bilangan yang string-nya berbentuk eksponen (`1e-7`) dipakai `Math.round(|n| x 10^d) / 10^d`.

**`angka(n, {desimal, bahasa})`**: `Intl.NumberFormat("id-ID")` di mode ID dan `("en-US")` di mode EN, `useGrouping: true`, digit pecahan sama dengan `desimal`; `n` dibulatkan dulu dengan `bulat`. Bawaan `desimal`: bilangan bulat 0, persen 1, skor 2, MW 1. Nilai `null`, `undefined`, `NaN`, `Infinity` menghasilkan `-` (tanda hubung). Tanda minus ialah tanda hubung biasa.

| Masukan | ID | EN |
| --- | --- | --- |
| `angka(1234567.891, {desimal: 2})` | `1.234.567,89` | `1,234,567.89` |
| `angka(0.84, {desimal: 2})` | `0,84` | `0.84` |
| `angka(1234.56, {desimal: 1})` | `1.234,6` | `1,234.6` |
| `angka(null)` | `-` | `-` |

**`angkaRingkas(n, {bahasa})`** untuk bilangan besar: ID `ribu`, `juta`, `miliar`, `triliun`; EN `thousand`, `million`, `billion`, `trillion`; ambang kelipatan 1.000 untuk ribu dan seterusnya dengan satu desimal. Contoh 1.234.567 -> ID "1,2 juta", EN "1.2 million".

**`rupiah(n, {bahasa})`**: IDR di ID `Rp1,2 triliun` (>= 1e12), `Rp55 miliar` (>= 1e9), `Rp675 juta` (>= 1e6), selain itu `Rp1.250.000`; EN `IDR 1.2 trillion`, `IDR 55 billion`, `IDR 675 million`, `IDR 1,250,000`. USD: ID `US$25 juta`, EN `US$25 million`. Satu desimal bila hasil skala bukan bilangan bulat, tanpa desimal bila bulat.

**`kapasitas(mw, {bahasa})`**: di bawah 1000 MW "{angka 1 desimal} MW"; mulai 1000 "{angka 2 desimal} GW" (mw/1000). `persen(p)` satu desimal dengan tanda "persen" (ID "12,5 persen", EN "12.5 percent"; kata "persen" bukan simbol % di teks kalimat, simbol dipakai di tabel sempit). `skor(x)` selalu dua desimal.

**Kasus tepi.** `angka` tidak pernah mengubah `null` menjadi "0". Bilangan di atas 1e21 tidak diformat (galat `terlalu-besar`). Format ID bergantung pada data ICU Node dan Workers (gerbang menjalankan `angka.id-en` di keduanya).

**Uji acuan.** `bulat.setengah-jauh-nol`, `angka.id-en`, `angka.null-menjadi-strip`, `angkaRingkas.skala`, `rupiah.skala-id-en`, `kapasitas.mw-gw`, `persen.id-en`.

### 10.2 Tanggal dan waktu

Tanggal data ialah string `YYYY-MM-DD`. `tanggalSah(s)`: bentuk benar dan sah menurut kalender (29 Februari hanya tahun kabisat).

`tanggal(s, {gaya, bahasa})`: tabel bulan sendiri (tidak memakai `Intl`, supaya "Agu" dan "Mei" tidak berbeda antar mesin).

| Gaya | ID | EN |
| --- | --- | --- |
| `pendek` (bawaan) | `7 Nov 2026` | `7 Nov 2026` |
| `panjang` | `7 November 2026` | `7 November 2026` |

Singkatan bulan ID: Jan, Feb, Mar, Apr, Mei, Jun, Jul, Agu, Sep, Okt, Nov, Des; EN: Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sep, Oct, Nov, Dec. Tanggal tidak sah menghasilkan `-`. `jam(unix)`: 24 jam `HH:MM` zona WIB (UTC+7, bawaan) dengan akhiran "WIB". `umurHari(a, b)`: selisih hari dari nomor hari sipil (algoritma hari sipil, tanpa `Date`). `tambahBulan(s, n)`: menambah bulan kalender, tanggal dipotong ke hari terakhir bulan tujuan (31 Maret + 1 bulan = 30 April).

**Uji acuan.** `tanggal.id-en-pendek-panjang`, `tanggal.tidak-sah-strip`, `umurHari.lintas-kabisat`, `tambahBulan.potong-akhir-bulan`, `jam.wib`.

### 10.3 Jarak: `jarakKm`, `terdekat`

**Definisi.** Jarak lingkaran besar (haversine) antara dua titik, jari-jari bumi 6371 km (asal memakai diameter 12742): `d = 12742 x asin(sqrt(sin^2(dlat/2) + cos(lat1) x cos(lat2) x sin^2(dlon/2)))`.

**Masukan.** `lat1, lon1, lat2, lon2` derajat desimal dalam kotak Indonesia (lintang -11,5 sampai 6,5; bujur 94 sampai 141,5; sama dengan CHECK DT). **Keluaran.** kilometer, dibulatkan satu desimal.

**`terdekat(titik, daftar, n)`**: urut menaik menurut jarak; seri dipecahkan oleh `id` terkecil; `n` dipotong ke antara 1 dan 20 (DT §4.3); entitas tanpa koordinat dilewati; titik di luar kotak menghasilkan galat `koordinat-tidak-sah` (rute memberi 422).

**Contoh.** Jakarta (-6,2088; 106,8456) ke Bandung (-6,9175; 107,6191) = **116,2 km**; ke Surabaya (-7,2575; 112,7521) = **662,6 km**. `terdekat` dari Jakarta atas {Bandung, Surabaya} dengan `n = 1` mengembalikan Bandung.

**Uji acuan.** `jarakKm.acuan-jakarta-bandung`, `jarakKm.titik-sama-nol`, `jarakKm.luar-kotak-galat`, `terdekat.batas-20`, `terdekat.seri-id`.

---

## 11. Pencarian (indeks statis dan kueri FTS)

Dua jalur dengan pembagian tegas (DT §4.3, PRD F-J1): **ketik-cepat** memakai indeks statis `cari.json` di klien (tidak membaca D1); **`GET /api/cari`** memakai FTS5 di D1 hanya untuk halaman hasil lengkap.

### 11.1 `nrmCari` dan sinonim

`nrmCari(q)` = `normNama(q)` (§1.1) tanpa tanda kurung dibuang (tanda kurung pada kueri dipertahankan isinya: kueri "(PGE)" menjadi "pge") dan kata henti `dan atau and or the of di ke yang untuk` dibuang bila masih tersisa minimal satu kata. Panjang kueri maksimum 100 karakter; minimum 2 karakter agar cocok awalan FTS (`prefix = '2 3'`).

`SINONIM` (daftar tetap di `taksonomi.js`) memperluas kata kueri ke sektor: `plts`, `solar`, `pv`, `panel surya` -> `surya`; `angin`, `wind`, `pltb` -> `bayu`; `hidro`, `plta`, `pltm`, `pltmh`, `minihidro`, `mikrohidro` -> `air`; `geothermal`, `pltp` -> `panas-bumi`; `biomassa`, `biogas`, `pltbm` -> `bioenergi`; `baterai`, `storage`, `bess` -> `penyimpanan`; `ev`, `motor listrik`, `mobil listrik` -> `kendaraan-listrik`; `pltsa`, `waste` -> `sampah-energi`; `h2` -> `hidrogen`. Sinonim menambah **kecocokan sektor** (entitas bersektor itu ikut, dengan skor lebih rendah), tidak mengganti kata kueri.

### 11.2 Indeks statis `cari.json`

Satu larik rekor per entitas yang boleh tampil pada lapisnya (tanpa orang `tampil = 0`, tanpa daftar tolak): `[slug, jenis, nama, sub, kunciCari, nomorSensus|0]` dengan `sub` = "Sektor, Kota" (atau jabatan dan afiliasi untuk orang) dan `kunciCari` = gabungan `normNama(nama)`, `normNama` alias, `singkatan`, dan `normNama(nama_badan_hukum)` yang dipisah spasi. String versi `v` = tanggal tiap dataset digabung (pola `search-index.json` 1001startup.id), dipakai sebagai `?v=` untuk membuang cache. Batas ukuran per berkas 2 MB (DT §6).

### 11.3 `cariIndeks`: pencocokan dan urutan

Kueri dipecah menjadi token `nrmCari`. Satu entitas cocok bila **setiap token** cocok awalan salah satu token `kunciCari` (AND). Skor urut menurun, bobot tetap:

| Skor | Syarat |
| --- | --- |
| 100 | `normNama(nama)` sama persis dengan kueri utuh |
| 90 | kueri sama dengan salah satu alias atau `singkatan` |
| 80 | `normNama(nama)` diawali kueri utuh |
| 60 | semua token cocok awalan pada `nama` |
| 40 | semua token cocok pada gabungan nama dan alias |
| 20 | hanya cocok lewat sinonim sektor |

Seri: entitas `di_sensus` lebih dulu, lalu nomor sensus lebih kecil, lalu nama menurut `normNama`. Hasil dikelompokkan per `jenis` (maksimum lima per kelompok dengan tombol "Semua"), kelompok diurut menurut skor tertinggi di dalamnya. Debounce 150 sampai 250 ms dan `AbortController` untuk rute API (R12 §8.8). Panel hasil tidak boleh membekukan layar (D3).

**Contoh.** Kueri `plts` pada tiga entitas: "PLTS Atap Contoh (contoh)" skor 80 (nama diawali kueri), "Surya Contoh Energi (contoh)" skor 20 (hanya lewat sinonim sektor `surya`), "Hidro Contoh (contoh)" tidak cocok.

### 11.4 `bangunQueryFts` (sisi D1)

Hanya untuk `GET /api/cari`. Langkah: `nrmCari` -> maksimum 8 token -> tiap token dibungkus `"token"*` -> digabung spasi (AND implisit). Tanda kutip, tanda bintang, `NEAR`, `AND`, `OR`, `NOT`, kurung, dan titik dua tidak pernah lolos mentah karena `normNama` menghapus semua karakter selain `a-z0-9` dan token dibungkus kutip. Hasil kosong -> tidak ada kueri. Urutan memakai `bm25(entitas_cari, 10, 5, 1, 4)` dan `LIMIT 20` (DT §4.3).

**Contoh.** `bangunQueryFts('PLTS "atap" OR surya*')` = `"plts"* "atap"* "surya"*` (kata henti `or` dibuang).

**Uji acuan.** `nrmCari.acuan`, `nrmCari.kata-henti-bersisa-satu`, `sinonim.surya`, `cariIndeks.urutan-skor`, `cariIndeks.seri-sensus`, `bangunQueryFts.acuan`, `bangunQueryFts.operator-tidak-lolos`, `bangunQueryFts.maks-8-token`, `cariIndeks.orang-tampil-nol-tidak-ada`.

---

## 12. Daftar tolak

**Definisi.** `data/daftar-tolak.json` (privat di R2 `privat/daftar-tolak.json`, bukan repo; KP D14, KPV §3.5) memuat orang atau lembaga yang tidak boleh tampil di mana pun: terkait kasus hukum korupsi, sudah meninggal, atau meminta keluar. Format baris: `{kunci?, h_nama?, h_inti?, alasan, tanggal, kecuali?}`, dengan `alasan` salah satu dari `korupsi`, `wafat`, `diminta-keluar`. Nama tidak disimpan polos untuk entri yang berasal dari permintaan hapus (KPV §3.3); yang disimpan hanya hash.

**`hashTolak(s)`** = `sha256("jm-tolak-v1:" + normNama(s))` dalam heksa huruf kecil (64 karakter). `h_inti` memakai `intiNama`.

**`tolakKena(entitas, daftar)`** benar bila salah satu: (1) `kunci` entitas atau salah satu pengenal `id_*`-nya ada di `daftar`; (2) `hashTolak(nama)` atau `hashTolak` salah satu alias sama dengan `h_nama`; (3) `hashTolak(intiNama(nama))` sama dengan `h_inti` dengan syarat `intiNama` lebih dari satu kata (mencegah "Bank" menjatuhkan semua bank). Entri `kecuali` (daftar `kunci`) mengeluarkan entitas tertentu dari kecocokan nama (pelepasan manual oleh pemilik bila nama kembar). **Aturan privasi:** kecocokan nama saja membuang entitas (utamakan tidak tampil daripada salah tampil) dan menambah hitungan `tolak_nama` di laporan sehingga kurator dapat menambahkan `kecuali`.

**Titik pemakaian (urut):** `sambung.mjs` (sebelum penggabungan), `bangunGraf` (§6.2 langkah 2), `cari.json` (§11.2), potret akhir semua lapis, dan teks cerita data. Cerita data beku (`cerita_<slug>.json`) dipindai terhadap hash nama yang ada di teksnya; satu kena membuat `jaga_unggah` merah dan cerita diganti dengan versi baru bertanggal (aturan beku tidak menolak penggantian karena alasan privasi, DT §7.4).

**Perilaku keluar.** Rute yang menerima slug entitas yang kena daftar tolak menjawab 404 yang sama dengan slug yang tidak ada (ALUR 3.1 langkah 4); tidak ada petunjuk bahwa ia ada. Penghapusan permanen atas permintaan menambah baris baru (hash identitas dan tanggal) dan tidak pernah dipulihkan tanpa perintah pemilik.

**Contoh.** Entri `{h_nama: hashTolak("Budi Contoh Santoso"), alasan: "diminta-keluar", tanggal: "2026-11-07"}`. Entitas "Budi Contoh Santoso (contoh)" kena (butir 2) dan hilang dari potret, graf, dan `cari.json`. "Bank Contoh Energi" tidak kena entri `h_inti = hashTolak("bank")` karena `intiNama` satu kata dan `bank` ada di `KATA_UMUM`.

**Uji acuan.** `hashTolak.acuan`, `tolakKena.kunci`, `tolakKena.nama-dan-alias`, `tolakKena.inti-satu-kata-tidak-dipakai`, `tolakKena.kecuali`, `tolakKena.cerita-beku-dipindai`, `tolakKena.dua-bentuk-404-sama`.

---

## 13. Aturan potret per lapis

### 13.1 Prinsip

Tiga lapis: `publik`, `anggota`, `pengurus` (DT §6, KPV §1 butir 4). Tiap fakta, ikatan, dan entitas punya `lapis` sendiri. Aturan:

1. **Per lapis berarti per berkas dan per delta.** Potret `publik` memuat butir ber-`lapis = 'publik'`. Potret `anggota` memuat HANYA butir ber-`lapis = 'anggota'` (delta); `pengurus` hanya `pengurus`. Worker menggabung menurut peran (`lapisBoleh`, DT §5). Tidak ada penyaringan di klien dan tidak ada tautan dari berkas lapis rendah ke lapis tinggi.
2. **Skor dan hitungan dihitung dari lapis Publik saja** dan sama di semua lapis: skor keyakinan (§4.2), hitungan sensus (§8.3), nomor sensus, kuadran. Tujuan: pembaca publik dapat mengulang angkanya dari apa yang ia lihat, dan keberadaan butir tersembunyi tidak bocor lewat angka.
3. **Orang.** Lapis Publik hanya `slug`, `nama`, `jabatan`, dan afiliasi (ikatan `bekerja-di`, `memimpin` ke lembaga publik) (KP C-04, C-11). Orang tampil hanya bila `tampil = 1`; yang `tampil = 0` tidak ada di potret Publik maupun Anggota, tidak di `cari.json`, tidak di graf. Kontak (`kontak_surel`, `kontak_telepon`) hanya di lapis Pengurus.
4. **Tidak masuk potret mana pun yang bukan Pengurus:** `riwayat`, `koreksi`, kolom rahasia, `dummy = 1`. Riwayat dengan METI hanya potret Pengurus (ALUR 4.1 langkah 5).
5. **Manifest terakhir** (DT §6): `manifest.json` ditulis sesudah semua berkas; `meta.json` memuat jumlah entitas, ikatan, baris tanpa sumber (harus 0), dan tanggal beku.

### 13.2 `polaPribadi(teks)`

Satu fungsi pemindai yang dipakai `jaga_unggah.mjs`, `hak.tulis`, dan `jaga_unggah` untuk lapis Publik dan Anggota. Mengembalikan daftar `{jenis, cuplikan}` dengan `jenis` satu dari:
- `surel`: `[^\s@]+@[^\s@]+\.[^\s@]+` (selaras CHECK `GLOB '*?@?*.?*'`);
- `telepon`: `(?:\+?62|0)\s?\d{2,4}[\s.-]?\d{3,4}[\s.-]?\d{3,5}`;
- `angka-panjang`: sembilan angka berurutan atau lebih (selaras CHECK DT; angka besar yang sah ditulis di `nilai_num`, bukan `nilai_teks`).

Fakta dengan kunci `kontak_*` dikecualikan dari pemindaian hanya pada lapis `pengurus`. **Contoh:** `polaPribadi("hubungi budi@example.org atau 0812-3456-7890")` menghasilkan dua temuan (`surel`, `telepon`); `polaPribadi("kapasitas 12,5 MW")` tidak menghasilkan temuan. **Uji acuan:** `polaPribadi.surel-telepon-angka`, `polaPribadi.angka-sah-bukan-temuan`, `polaPribadi.kontak-pengurus-dikecualikan`.

### 13.3 `susutBerlebih`

`susutBerlebih(lama, baru, batas = 0,20)` benar bila `baru * 5 < lama * 4` (bentuk bilangan bulat untuk `batas = 0,20`; umum: `(lama - baru) / lama > batas`). `lama = 0` -> salah. Berkas yang susut lebih dari 20 persen terhadap potret `tayang` sebelumnya ditolak (TIKET JM-D02, DT §7.4 langkah 6; beda dengan 5 persen di asal, DT §10). **Contoh:** `lama = 1000`: `baru = 800` lolos (tepat 20 persen), `baru = 790` ditolak. **Uji acuan:** `susutBerlebih.batas-tepat-dua-puluh`, `susutBerlebih.lama-nol`.

### 13.4 `bagiLapis`

`bagiLapis(butir[], kolomLapis)` memecah butir menjadi tiga berkas menurut `KOLOM_LAPIS` dan menolak (galat) butir yang kolomnya melintasi lapis: fakta `lapis = 'publik'` yang `nilai_teks`-nya kena `polaPribadi` ditolak; kunci `kontak_*` dengan `lapis` bukan `pengurus` ditolak. Berkas lebih dari 2 MB dipecah per provinsi atau per sektor sebelum diunggah (DT §6 butir 4). **Uji acuan:** `bagiLapis.delta-bukan-akumulasi`, `bagiLapis.orang-tampil-nol`, `bagiLapis.hitungan-hanya-publik`, `bagiLapis.kontak-hanya-pengurus`, `bagiLapis.pecah-2mb`.

---

## 14. Daftar uji acuan, hal terbuka, dan penyelarasan

### 14.1 Berkas modul

Fungsi yang diekspor `public/algo.js` (selain yang tertulis di P.2, semuanya dipakai pipeline): `bulat`, `normNama`, `intiNama`, `singkatan`, `buatSlug`, `buatKunci`, `bangunIndeks`, `cariNama`, `skorKemiripan`, `putusanCocok`, `tingkatSah`, `bobotTingkat`, `normTingkatLama`, `hitungKeyakinan`, `labelKeyakinan`, `pilihFakta`, `statusUmur`, `statusRegulasi`, `persentil`, `peringkat`, `skorKuadran`, `anggotaKuadran`, `kapasitasGrup`, `kuadran`, `bangunGraf`, `petaDuaTingkat`, `kelompokTerhubung`, `sejenis`, `strategis`, `ringkasPembiaya`, `kesiapanProvinsi`, `spearman`, `ujiKesiapan`, `layakSensus`, `hitungSensus`, `cocokSektor`, `nomorSensus`, `jumlahMW`, `perluEst`, `estimasiOutput`, `kutip`, `jawabanSingkat`, `angka`, `angkaRingkas`, `rupiah`, `kapasitas`, `persen`, `skor`, `tanggal`, `tanggalSah`, `jam`, `umurHari`, `tambahBulan`, `jarakKm`, `terdekat`, `nrmCari`, `cariIndeks`, `bangunQueryFts`, `hashTolak`, `tolakKena`, `polaPribadi`, `susutBerlebih`, `bagiLapis`, serta objek `KONSTANTA`, `METODE`, `STATUS_UJI`. Fungsi `hashTolak` memakai WebCrypto (`crypto.subtle.digest`), jadi asinkron; fungsi lain sinkron.

### 14.2 Daftar nama uji acuan untuk RENCANA-UJI

Berkas `tests/algo/<nn>-<topik>.test.mjs` dijalankan `node --test` (RU §1); harga yang diharapkan dibaca dari `tests/fixtures/algo-acuan.json`. Gerbang `gerbang-algo-acuan` memastikan tiap nama di bawah ada di fixture dan tiap kunci fixture ada di daftar ini. Uji bukan mock: fungsi bentuk (`bangunQueryFts`, `polaPribadi`, `tingkatSah`) diuji juga melalui D1 lokal nyata di RU §2 (kueri FTS dan CHECK yang menolak).

| Berkas | Bagian | Nama uji |
| --- | --- | --- |
| `01-kunci.test.mjs` | §1 | `normNama.acuan`, `normNama.tepi`, `intiNama.acuan`, `intiNama.kataUmum`, `singkatan.persero-bukan-singkatan`, `buatKunci.prioritas`, `buatKunci.nib-bentuk-salah`, `buatKunci.npwp-tidak-masuk-kunci`, `buatKunci.nama-lemah`, `buatSlug.acuan`, `buatSlug.bentrok`, `buatSlug.panjang-60`, `buatSlug.tanpa-tanda-hubung-ganda`, `aliasEnergi.normal-dan-unik`, `aliasEnergi.ambigu-tidak-dipakai` |
| `02-taksonomi.test.mjs` | §2 | `SEKTOR.empat-belas-nilai`, `SEKTOR.terkait-tolak-di-sensus`, `taksonomi.sama-dengan-check-d1`, `RANTAI.dua-belas-nilai`, `KAT.sepuluh-nilai`, `kunciFakta.bentuk`, `kunciFakta.est-wajib-untuk-turunan`, `kunciFakta.kontak-hanya-pengurus`, `kunciFakta.satuan-wajib`, `derajatDesa.syarat-tingkat`, `statusRegulasi.dicabut-menang`, `DIRI.cocok-dan-tidak`, `DIRI.meti-wilayah`, `PROV.tiga-puluh-delapan` |
| `03-ikatan.test.mjs` | §3 | `pasanganIkatan.sama-dengan-d1`, `ikatan.membeli-dari-dibalik`, `ikatan.simetris-urut-id`, `ikatan.diri-sendiri-ditolak`, `ikatanAktif.batas-selesai`, `sumberPasokSah.hanya-filing-dan-situs`, `JENIS_SUMBER.enam-nilai`, `tingkatBawaan.tidak-melewati-langit-langit`, `bangunIndeks.kunci-pendek-diabaikan`, `cariNama.ambigu-tidak-ditautkan`, `cariNama.pilih-akar`, `cariNama.nama-panjang-dalam-teks`, `skorKemiripan.acuan-0.75`, `putusanCocok.kunci-kuat`, `putusanCocok.konflik-kunci`, `putusanCocok.prov-beda-antrean`, `putusanCocok.orang-tanpa-pengenal` |
| `04-keyakinan.test.mjs` | §4 | `tingkatSah.langit-langit`, `bobotTingkat.empat-nilai`, `normTingkatLama.tolak-kosakata-lain`, `hitungKeyakinan.acuan-0.84`, `hitungKeyakinan.acuan-0.64`, `hitungKeyakinan.batas-satu-domain`, `hitungKeyakinan.semua-pihak-ketiga-maks-0.59`, `hitungKeyakinan.tanpa-fakta-null`, `hitungKeyakinan.kesegaran-batas-180-1095`, `hitungKeyakinan.lapis-anggota-diabaikan`, `labelKeyakinan.batas-0.75-0.40`, `pilihFakta.konflik-rentang-tanpa-rata`, `pilihFakta.satuan-berbeda-ditolak`, `pilihFakta.seri-per-tanggal`, `statusUmur.batas-36-60` |
| `05-kuadran.test.mjs` | §5 | `persentil.acuan`, `persentil.n-kurang-dari-nmin-null`, `peringkat.seri-kompetisi`, `skorKuadran.keuangan-dua-dari-tiga`, `skorKuadran.porsi-ebt`, `kuadran.median-masuk-tinggi`, `kuadran.acuan-lima-entitas`, `kuadran.entitas-tanpa-skor-tidak-ditempatkan`, `kapasitasGrup.tanpa-hitung-ganda`, `anggotaKuadran.anak-usaha-keluar` |
| `06-graf.test.mjs` | §6 | `bangunGraf.urutan-aturan`, `bangunGraf.membeli-dari-dibalik`, `bangunGraf.tolak-membuang-sisi`, `bangunGraf.gabung-bukan-diri-sendiri`, `bangunGraf.dedup-sumber-beda`, `petaDuaTingkat.rel-bersama-berhenti`, `petaDuaTingkat.energi-tidak-diikuti`, `petaDuaTingkat.kedalaman-2`, `petaDuaTingkat.tanda-kurator`, `kelompokTerhubung.urutan-kelompok`, `kelompokTerhubung.urut-dalam-kelompok`, `sejenis.acuan-enam`, `sejenis.seri-nomor-sensus`, `strategis.DIRI-tanpa-bintang`, `strategis.syarat-aktif-dan-skor`, `strategis.tiga-teratas-per-kategori`, `ringkasPembiaya.acuan`, `ringkasPembiaya.satuan-tidak-dicampur`, `ringkasPembiaya.hitung-ganda-di-induk`, `ringkasPembiaya.jenis-dana-terpisah` |
| `07-kesiapan.test.mjs` | §7 | `kesiapanProvinsi.acuan-43`, `kesiapanProvinsi.kurang-komponen-null`, `kesiapanProvinsi.potensi-berkonflik`, `spearman.acuan`, `ujiKesiapan.ambang` |
| `08-sensus.test.mjs` | §8 | `layakSensus.alasan-gagal`, `layakSensus.terkait-ditolak`, `hitungSensus.chip-hormati-filter`, `hitungSensus.multisektor-total-sekali`, `hitungSensus.nasional-bukan-provinsi`, `hitungSensus.hitungan-hanya-lapis-publik`, `cocokSektor.or-dan-kosong`, `jumlahMW.diumumkan-tidak-masuk`, `jumlahMW.tanpa-hitung-ganda`, `jumlahMW.penyebut`, `nomorSensus.urut-id`, `nomorSensus.satu-potret` |
| `09-est.test.mjs` | §9 | `perluEst.kunci-turunan`, `estimasiOutput.acuan-55-miliar`, `estimasiOutput.tanpa-jangkar-null`, `estimasiOutput.tanpa-pekerja-tidak-diimputasi`, `kutip.acuan-id-en`, `kutip.tanpa-tanggal-galat`, `jawabanSingkat.buang-klausa-kosong`, `jawabanSingkat.tanpa-inti-pesan-belum`, `penanda.min-tidak-dijumlah-dengan-biasa` |
| `10-format.test.mjs` | §10 | `bulat.setengah-jauh-nol`, `angka.id-en`, `angka.null-menjadi-strip`, `angkaRingkas.skala`, `rupiah.skala-id-en`, `kapasitas.mw-gw`, `persen.id-en`, `tanggal.id-en-pendek-panjang`, `tanggal.tidak-sah-strip`, `umurHari.lintas-kabisat`, `tambahBulan.potong-akhir-bulan`, `jam.wib`, `jarakKm.acuan-jakarta-bandung`, `jarakKm.titik-sama-nol`, `jarakKm.luar-kotak-galat`, `terdekat.batas-20`, `terdekat.seri-id` |
| `11-cari.test.mjs` | §11 | `nrmCari.acuan`, `nrmCari.kata-henti-bersisa-satu`, `sinonim.surya`, `cariIndeks.urutan-skor`, `cariIndeks.seri-sensus`, `bangunQueryFts.acuan`, `bangunQueryFts.operator-tidak-lolos`, `bangunQueryFts.maks-8-token`, `cariIndeks.orang-tampil-nol-tidak-ada` |
| `12-tolak.test.mjs` | §12 | `hashTolak.acuan`, `tolakKena.kunci`, `tolakKena.nama-dan-alias`, `tolakKena.inti-satu-kata-tidak-dipakai`, `tolakKena.kecuali`, `tolakKena.cerita-beku-dipindai`, `tolakKena.dua-bentuk-404-sama` |
| `13-lapis.test.mjs` | §13 | `polaPribadi.surel-telepon-angka`, `polaPribadi.angka-sah-bukan-temuan`, `polaPribadi.kontak-pengurus-dikecualikan`, `susutBerlebih.batas-tepat-dua-puluh`, `susutBerlebih.lama-nol`, `bagiLapis.delta-bukan-akumulasi`, `bagiLapis.orang-tampil-nol`, `bagiLapis.hitungan-hanya-publik`, `bagiLapis.kontak-hanya-pengurus`, `bagiLapis.pecah-2mb` |

Jumlah nama uji acuan: 15 + 14 + 17 + 15 + 10 + 20 + 5 + 12 + 9 + 17 + 9 + 7 + 10 = **160**.

### 14.3 Hal yang belum diputus (bawaan berlaku, bukan keputusan pemilik)

| Kode | Hal | Bawaan di dokumen ini | Rujukan |
| --- | --- | --- | --- |
| H-1 | Penanganan NIB dan NPWP sebagai kunci | NIB boleh jadi `kunci` untuk badan usaha; NPWP hanya hash di lapis Pengurus; usaha perseorangan tidak diberi kunci NIB | belum ada kode C; usulan butir baru, tinjau di KPV §3 |
| H-2 | `AMBANG_REL` (rel bersama) | 25 sambungan unik, dikalibrasi dengan data F1 | JM-D10 |
| H-3 | Bobot skor keyakinan, ambang uji kalibrasi, ambang uji kesiapan | 0,40/0,25/0,20/0,15; Spearman `>= 0,6`/`>= 0,2` | KP C-16, C-20 |
| H-4 | Jangkar nilai tambah per pekerja per sektor | KOSONG; output tidak dihitung tanpa jangkar bersumber BPS | KP C-16, D15 |
| H-5 | Himpunan BUMN, rubrik `skor_mandat`, lensa kuadran | §5.2 sampai §5.5 | KP C-16, C-20; OPERASIONAL C-30 |
| H-6 | `SEKTOR_VIEW` rinci | enam tab di §2.10 | TIKET JM-C03 |
| H-7 | Jenis dana pada ikatan `mendanai` | token baku di awal `rincian` | DT §3.3 tidak punya kolom |
| H-8 | Nomor sensus permanen atau per potret | per potret menurut `entitas.id` | PRD F-S3 |
| H-9 | Pembagian `kelompok` sektor | `ebt` (6), `pendukung` (6), `terkait` (2) | KP C-12 |

### 14.4 Rujukan ALG yang dipenuhi

Dihitung dengan `grep -o "ALG §[0-9.]*"` atas `docs/perencanaan/*.md` (tanpa `riset/`) sesudah dokumen ini ada:

| Bentuk rujukan | Jumlah | Rincian per berkas | Nomor bagian yang dirujuk |
| --- | --- | --- | --- |
| `ALG §n` | 34 | `ALUR.md` 2, `DESAIN-TEKNIS.md` 24, `PRD.md` 4, `TIKET.md` 4 | §1, §2, §2.8, §3, §4, §5, §6, §8, §10 |
| `§n` lanjutan dalam sel yang sama dengan `ALG §m` | 3 | `DESAIN-TEKNIS.md` baris tiket JM-D10 (§6), JM-E03 (§6), JM-E05 (§9) | §6, §9 |
| `ALGORITMA §n` | 8 | `DESIGN-SYSTEM.md` 4 (§2, §3 dua kali, §4), `GLOSARIUM.md` 3 (§3 dua kali, §4), `KEPUTUSAN-METI.md` 1 (§2) | §2, §3, §4 |
| **Jumlah** | **45** | | |

**Tertutup: 45. Belum tertutup: 0.** Setiap nomor di atas punya judul bagian di dokumen ini (§1, §2, §2.8, §3, §4, §5, §6, §8, §9, §10 ada sebagai judul; §7, §11, §12, §13, dan §14 ada sebagai bagian tambahan yang belum dirujuk dokumen lain). Rujukan tanpa nomor ("sesuai ALGORITMA", mis. `KEAMANAN-PRIVASI` §2 butir 1 tentang enum `tingkat_bukti`, `OPERASIONAL` §2.1, `DESIGN-SYSTEM` kepala dokumen) ditutup oleh §4.1 dan §3.2. Rujukan di `riset/R2-POLA-DOKUMEN.md` (§2, §3, §3.1, §3.3) adalah contoh untuk proyek lain dan tidak dihitung; bagian bernomor sama tersedia di sini sehingga tidak ada yang menggantung.

Bukan rujukan ALG tetapi menggantung terhadap dokumen ini dan perlu disesuaikan: lihat §14.5.

### 14.5 Penyelarasan yang diminta ke dokumen lain

Dokumen ini menang atas DS, DT, KPV, RU, dan TIKET, tetapi kalah dari PRD dan ALUR. Butir berikut bukan perubahan nilai pemilik; semuanya perlu disesuaikan atau diputus pemilik (bawaan dipakai sampai ada jawaban).

| No | Dokumen | Ketidakselarasan | Bawaan dan tindakan |
| --- | --- | --- | --- |
| P-1 | PRD F-R1 vs DT §3.3 | PRD menyebut sembilan chip jenis pasok termasuk "barang" dan "perangkat keras" terpisah dan tanpa "pembiayaan"; DT punya `peralatan` dan `pembiayaan` | Enum DT dipakai (CHECK sudah ada): "barang" dan "perangkat keras" jadi satu chip `peralatan` ("Barang dan perangkat keras"). Pemilik memutus bila dua chip harus terpisah (butuh migrasi) |
| P-2 | DS §6.8 | Lencana jenis sumber memuat "Hitungan kami" sebagai satu dari enam, padahal enam jenis sumber ialah PRD F-S4 | "Hitungan kami" ialah label tingkat bukti `inferensi` (§4.1), bukan jenis sumber; lencana keenam jenis sumber ialah "Pihak ketiga" (§3.2). DS disesuaikan |
| P-3 | TIKET JM-D10, GLOSARIUM | `ALIAS` energi disebut di `hubung.mjs` | `ALIAS_ENERGI` ditaruh di `taksonomi.js` (§1.4), `hubung.mjs` mengimpornya, agar Worker dan uji memakai daftar yang sama |
| P-4 | OPERASIONAL §2.1 | "Tingkat bukti (usulan) 1 sampai 4" memakai nama yang sama dengan enum | Diganti "peringkat sumber 1 sampai 4" (§3.2); enum `tingkat_bukti` empat nilai di §4.1 yang berlaku |
| P-5 | DS §6.9 | Label "Sedang (0,40 sampai 0,74)" | Sama dengan §4.2 langkah 8; diperjelas bahwa penentuan label memakai skor yang sudah dibulatkan dua desimal |
| P-6 | DT §3.3 | `ikatan` tidak punya kolom jenis dana (ekuitas, hibah, pinjaman, dana iklim) yang diperlukan PRD F-R2 | Token baku di awal `rincian` (§2.5). Bila pemilik ingin kolom CHECK, DT menambah migrasi |
| P-7 | DS dan PRD | Tiga skala skor: keyakinan 0 sampai 1, kuadran 0 sampai 5, kesiapan 0 sampai 100 | Disengaja (tiap skala meniru padanannya: 1001startup.id `confidence`, kuadran BUMN, asal `kesiapanDaerah`); DS menulis rentang di label tiap skor |
| P-8 | ALUR 2.1 langkah 2 | Contoh jenis entitas menyebut `perusahaan` dan `kampus` | Itu `lembaga` dengan `kategori` (§2.4); contoh di ALUR bersifat ilustrasi dan menunjuk DT |
| P-9 | PRD F-R6 | "Chip tingkat bukti" desa berisi empat derajat yang berbeda dari enum `tingkat_bukti` | Dipenuhi dengan `DERAJAT_DESA` sebagai fakta `verifikasi_desa` (§2.7) tanpa enum kedua |
| P-10 | DT §7.2 `impor_1001.py` | Menyebut baris `via-pihak-ketiga` tidak bisa mencapai Tinggi | Dipenuhi dua lapis: langit-langit `cuplikan` (§3.2) dan batas atas 0,59 untuk profil yang semua sumbernya pihak ketiga (§4.2 langkah 7) |

---

## D. Perubahan sesudah rilis awal

Belum ada. Setiap perubahan rumus, bobot, ambang, atau nilai enum dicatat di sini dengan tanggal, alasan, dan nama uji yang berubah; perubahan yang melepas pil "Hipotesis" menuntut hasil uji kalibrasi (§4.7, §5.5, §7.4) terlampir.
