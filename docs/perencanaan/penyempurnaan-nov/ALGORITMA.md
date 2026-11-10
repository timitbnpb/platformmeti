# ALGORITMA penyempurnaan November 2026

Otoritas: `KEPUTUSAN-METI` K21 sampai K26, D19 sampai D23, C-21 sampai C-28. Dokumen ini MELENGKAPI `docs/perencanaan/ALGORITMA.md` (selanjutnya ALG-lama); ia tidak menyalin isinya. Bila bertentangan, urutan: KEPUTUSAN, lalu dokumen ini untuk enam bagian di bawah, lalu ALG-lama. Rujukan ke ALG-lama memakai nomor bagiannya (mis. ALG-lama 4.1 = enum `tingkat_bukti`). Tanggal acuan: 11 Nov 2026.

Bagian: `§proyek`, `§tautan`, `§dampak`, `§kesegaran`, `§kesiapan`, `§tier`. Tiket pemakai: S05 (§proyek); L01 sampai L08 (§tautan); U06, U07 (§dampak); T01, T07, T08 (§kesegaran); M04 (§kesiapan); N01 sampai N03 (§tier).

## Pembuka: konvensi

1. **Deterministik dan bisa diaudit.** Tiap metode di sini fungsi murni: masukan sama, keluaran sama, byte demi byte. Tanpa model bahasa, tanpa `Math.random()`, tanpa `Date.now()` (tanggal masuk sebagai parameter `kini`, format `YYYY-MM-DD`). Semua daftar diurutkan menurut `id` leksikografis sebelum diproses dan sebelum ditulis. Tiap keluaran membawa `versi_metode` (mis. `tautan-1`); mengubah bobot atau ambang berarti menaikkan versi dan menjalankan ulang uji acuan.
2. **Dua sumbu yang tidak boleh dicampur.** `skor` (0 sampai 1) = seberapa pasti IDENTITAS pasangan itu sama atau berhubungan. `tingkat_bukti` = dari mana bukti hubungan itu, memakai enum tunggal ALG-lama 4.1 (`terkonfirmasi`, `kata-pihak`, `cuplikan`, `inferensi`; bobot 1,00; 0,70; 0,40; 0,20). Nama persis di berita adalah `skor` 1,00 tetapi `tingkat_bukti = cuplikan`. Kecocokan fuzzy nama dengan tebakan lokasi adalah `skor` rendah dan `inferensi`.
3. **Pembulatan.** `bulat(x, n)` membulatkan setengah ke atas (0,505 x 100 = 50,5 menjadi 51). Semua perbandingan ambang memakai `bulat4(x)` agar 0,8499999 tidak berbeda dari 0,85 karena galat pecahan.
4. **Tiga zona ambang** berlaku untuk semua `§tautan` (konstanta tunggal, mengubahnya = ganti versi): `A_OTO = 0,85` (masuk otomatis), `A_RAGU = 0,60` (antrean kurator), di bawah `A_RAGU` dibuang dan hanya dicatat di log penolakan. Batas bawah masing-masing inklusif: skor 0,60 = ragu, 0,85 = otomatis, 0,5999 = buang, 0,8499 = ragu.
5. **Pemeriksaan pembaca.** Tiap keluaran tautan wajib membawa `bukti[]` (minimal satu) berisi istilah yang cocok dan rujukan (id atau url), BUKAN salinan paragraf sumber. Kutipan dibatasi pada istilah yang cocok (mis. nama organisasi), maksimal 15 kata.
6. **Persentil, `pilihFakta`, `bulat2`** memakai definisi ALG-lama 4.3, 4.4, 5.1. Nama baku memakai `namaBaku` (`public/inti/nama_baku.js`) dan `norm` dari `scripts/pipa/tautan_proyek_org.mjs` (huruf kecil, buang `pt|tbk|persero|cv|ltd|pte|pvt|inc|corp|co|sa|plc`, selain a-z0-9 jadi spasi). `tokenNama(s)` = himpunan token hasil `norm`, tanpa token kosong. `jaccard(A, B) = |A irisan B| / |A gabung B|`; dua himpunan kosong = 0.

---

## §proyek: satu daftar, dedup, rekonsiliasi kapasitas (JM-S05)

### P.1 Masalah dan angka acuan

`public/data/proyek.json` berisi 548 baris dan `public/data/proyek_terpadu.json` 607 baris (di luar 607: 16 diragukan dan 60 dikeluarkan karena tanpa teknologi). Beranda memakai 548, pelacak memakai 607. Kapasitas terlacak terhadap angka nasional di `konsistensi.json`: surya 855 dari 1.494 MW (57,2%), hidro 5.469 dari 7.587 (72,1%), panas bumi 1.332 dari 2.744 (48,5%). Pengguna bertanya "mana yang benar" dan "kenapa sedikit". Yang dibangun: SATU keluaran `proyek.json` dari dua masukan, plus `proyek_rekon.json` yang menjelaskan setiap selisih. Tidak ada angka yang dipilih diam-diam.

### P.2 Normalisasi masukan

Untuk tiap baris `p` dari kedua berkas:

| Medan | Aturan |
| --- | --- |
| `tek` | teknologi taksonomi K16 (ALG-lama 2.6); kosong = baris tidak ikut dedup, masuk `dikeluarkan.tanpa_teknologi` |
| `prov` | kode BPS 2 digit dari `lokasi.provinsi`; tak dikenal = `null` |
| `kap_mw`, `jenis_mw` | dari `kapasitas[0]` (nilai pertama per proyek, sama dengan agregat program). kW dibagi 1.000, GW dikali 1.000. Satuan `MWp` = `dc`, `MWac` = `ac`, `MW` = `tak-jelas`. Nilai kosong atau nol = `null` |
| `tokens` | `tokenNama(nama)` setelah membuang kata generik `{plts, pltb, pltu, plta, pltp, pltmh, pltbm, pltd, pltg, proyek, pembangkit, listrik, tenaga}` TETAPI mempertahankan semua token angka |
| `id_luar` | himpunan `{gem:<id>, wkp:<kode>, psn:<id>, osm:<id>}` bila ada |

### P.3 Pasangan kandidat dan skor

Pembentukan blok: hanya pasangan dengan `tek` SAMA yang dibandingkan (aturan keras; teknologi berbeda tidak pernah digabung). Pasangan berprovinsi sama atau salah satunya `prov = null` diperiksa; provinsi berbeda tegas tidak diperiksa.

1. **Kunci pasti**: `id` sama, atau salah satu `id_luar` sama. Skor 1,00, gabung.
2. **Skor duplikat** `skor_dup = 0,45 x sim_nama + 0,20 x sama_tek + 0,15 x sama_prov + 0,20 x sim_kap`, dengan:
   - `sim_nama = jaccard(tokens_a, tokens_b)`. Bila himpunan token ANGKA kedua baris berbeda (tahap, unit, blok), `sim_nama = min(sim_nama, 0,5)`.
   - `sama_tek` selalu 1 (blok sudah menjamin).
   - `sama_prov` = 1 bila kode sama, 0,5 bila salah satu `null`, 0 bila beda (tidak dihitung, tak lolos blok).
   - `sim_kap`: kedua `null` atau salah satu `null` = 0,5. Jenis sama (atau keduanya `tak-jelas`): `1 - min(1, |a - b| / max(a, b))`. `ac` melawan `dc`: rasio `r = dc / ac`; `1,0 <= r <= 1,5` maka 0,8, selain itu 0.
3. **Keputusan**: `skor_dup >= 0,85` DAN `sim_nama >= 0,75` maka gabung otomatis. `skor_dup >= 0,65` selain itu maka ANTREAN RAGU (kedua baris tetap, ditandai `kembar_mungkin: [id]`). Di bawah 0,65: dua proyek berbeda.
4. **Klaster**: pasangan otomatis dihubungkan dengan union-find; klaster maksimal 3 anggota dan SEMUA pasangan di dalamnya harus `skor_dup >= 0,65`; bila tidak, klaster dipecah dan pasangan terlemah masuk antrean.
5. **Penggabungan**: `id` kanonik = `pj_` terkecil; yang lain disimpan di `id_lama[]` (tautan lama dari berita, regulasi, dan pencarian tetap terselesaikan). Tiap medan dipilih `pilihFakta` (ALG-lama 4.3): tingkat bukti tertinggi, seri oleh `per_tanggal` terbaru, lalu `id` terkecil. `asal: ["proyek","terpadu"]` dan `sumber[]` digabung tanpa duplikat.

**Contoh kerja.**

| Pasangan | sim_nama | sim_kap | skor_dup | Hasil |
| --- | --- | --- | --- | --- |
| A "PLTS Terapung Cirata", surya, 32, 192 MWp; B "PLTS Cirata Terapung", surya, 32, 145 MWac | 1,00 | 0,8 (r = 192/145 = 1,324) | 0,45 + 0,20 + 0,15 + 0,16 = 0,96 | gabung otomatis |
| A "PLTB Sidrap Wind", bayu, 73, 75 MW; B "PLTB Sidrap Wind Farm", bayu, 73, 75 MW | 0,667 (token {sidrap, wind} lawan {sidrap, wind, farm}) | 1,00 | 0,30 + 0,20 + 0,15 + 0,20 = 0,85 | antrean ragu (skor lolos, `sim_nama` kurang dari 0,75) |
| A "PLTS Cirata Tahap 1", 100 MW; B "PLTS Cirata Tahap 2", 45 MW | 2/4 = 0,5 (angka beda, batas 0,5) | 1 - 55/100 = 0,45 | 0,225 + 0,20 + 0,15 + 0,09 = 0,665 | antrean ragu; kurator dapat menetapkan `tahap_dari` |
| A "PLTS Atap Gedung Bandung" (tokens: atap, gedung, bandung); B "PLTS Bandung 1" (bandung, 1), kapasitas B kosong | 1/4 = 0,25 | 0,5 | 0,1125 + 0,20 + 0,15 + 0,10 = 0,5625 | dua proyek berbeda |

**Kasus tepi.** (a) Teknologi berbeda dengan nama sama ("PLTS Hibrida X" surya melawan "PLTD X" diesel): tidak pernah digabung; bila kedua milik satu lokasi, kurator boleh mengaitkan `hibrida_dengan`. (b) Provinsi kosong di kedua sisi: `sama_prov = 0,5` memotong peluang otomatis: skor maksimum 0,925 masih bisa lolos bila nama dan kapasitas identik; itu disengaja (nama identik, teknologi sama). (c) Kapasitas nol di satu sisi: diperlakukan `null`. (d) Rantai A~B, B~C tetapi A tidak ~ C: klaster dipecah (langkah 4). (e) Dua baris di satu berkas sumber yang sama dengan `id` berbeda: tetap diperiksa sebagai pasangan biasa.

### P.4 Rekonsiliasi hitungan

`proyek_rekon.json` (publik) berisi, dan uji menjamin persamaannya:

```
masuk_a = 548, masuk_b = 607
gabung_kunci + gabung_skor = jumlah pasangan yang dilebur (tiap peleburan mengurangi satu baris)
dikeluarkan = { tanpa_teknologi: 60, diragukan: 16 }   // tercatat, tidak dihitung ke akhir
antrean_ragu = jumlah pasangan ragu (kedua baris dipertahankan)
akhir = masuk_a + masuk_b - gabung_kunci - gabung_skor        // semua baris unik yang tampil
```

`akhir` TIDAK dikurangi `dikeluarkan` karena angka 607 sudah di luar 60 dan 16 itu. Invarian yang diuji: `akhir == jumlah baris proyek.json`, semua `id_lama` terselesaikan, tidak ada dua baris dengan `id` sama, `sum(per_teknologi) == akhir`.

### P.5 Rekonsiliasi kapasitas terhadap angka nasional

Untuk tiap teknologi `t`: `terlacak(t)` = jumlah `kap_mw` (dikonversi MWac bila `dc`, dibagi 1,3 sebagai asumsi tercatat) khusus status `operasi`, dibandingkan dengan `nasional(t)` (terpasang, ESDM, `konsistensi.json`). Membandingkan kapasitas rencana dengan terpasang adalah kesalahan; uji `kapasitas.hanya-operasi` menegurnya.

```
cakupan(t) = terlacak(t) / nasional(t)                      // bulat 1 desimal, persen
bagian_lain(t) = jumlah kategori terukur yang diketahui     // mis. PLTS atap dari data_plts_atap_hitung
sisa(t) = nasional(t) - terlacak(t) - bagian_lain(t)
```

Tampilan: tiga bagian yang jumlahnya 100: `terlacak`, `lain terukur`, `sisa`; bagian terakhir = 100 dikurangi dua lainnya (agar tidak 99,9). Kalimat bawaan: "Terlacak X MW dari Y MW terpasang nasional (Z%). Sisanya belum tercatat sebagai proyek di platform."

**Contoh (angka PLTS atap ILUSTRASI, bukan data).** surya: nasional 1.494; terlacak 855 (57,2%); atap 120 (8,0%); sisa 519, ditampilkan 100 - 57,2 - 8,0 = 34,8%. Panas bumi 1.332 dari 2.744 = 48,5%, tanpa kategori lain, sisa 51,5%.

**Kasus tepi.** `nasional` kosong: tidak ada persen, tampil "pembanding nasional belum tersedia". `terlacak > nasional`: tampil 100% dengan tanda `melebihi` dan baris masuk laporan admin (tanda data ganda atau status salah). Tanpa kategori lain: bagian itu tidak ditampilkan.

### P.6 Uji acuan

`proyek.kunci-pasti-id-luar`, `proyek.skor-cirata-gabung`, `proyek.sidrap-ragu-sim-nama`, `proyek.tahap-beda-ragu`, `proyek.teknologi-beda-tak-digabung`, `proyek.klaster-dipecah`, `proyek.id-lama-terselesaikan`, `proyek.rekon-persamaan`, `kapasitas.hanya-operasi`, `kapasitas.sisa-pelengkap-100`, `kapasitas.melebihi-ditandai`.

---

## §tautan: metode penautan (JM-L01 sampai L08)

### T.1 Bentuk satu tautan

Satu daftar kanonik `data/direktori/tautan.json`; array dua arah di berkas entitas (mis. `organisasi.proyek_ids` dan `proyek.organisasi_id`) DITURUNKAN darinya oleh `terapkanTautan`, tidak diedit tangan. Dengan begitu dua arah selalu ada (prinsip memori "wiki terintegrasi").

```
{ kunci,            // sha1 12 hex dari "jenis|dari|ke"
  jenis,            // lihat T.3, mis. proyek-org, proyek-regulasi, riset-pakar
  dari: {t, id}, ke: {t, id},
  peran,            // mis. pemilik, epc, pendana, penulis; opsional
  skor,             // 0..1, bulat4
  cara,             // kunci | nama-baku | alias-kurasi | singkatan | token | teks-resmi | berita | koordinat
  tingkat_bukti,    // enum ALG-lama 4.1
  fitur: {...},     // nilai tiap fitur yang membentuk skor (audit)
  bukti: [{istilah, ref}],
  status,           // oto | kurator-setuju
  versi_metode, dibuat }
```

`oto` hanya bila `skor >= A_OTO` DAN fitur utama (nama atau kunci) `>= 0,90`: pencocokan fuzzy yang diselamatkan fitur pendukung tidak pernah otomatis.

### T.2 Pencocokan nama organisasi (dasar L01, L03, L04, L05)

`f_nama(a, b)` berurutan, ambil yang pertama berlaku:

| Kondisi | `f_nama` | `cara` |
| --- | --- | --- |
| `norm(a) == norm(b)` untuk salah satu `nama`, `singkatan`, `nama_lain` organisasi (panjang `norm` > 3) | 1,00 | `nama-baku` |
| terdaftar di `ALIAS` atau `org_pemilik_kurasi.json` | 1,00 | `alias-kurasi` |
| `a` persis satu singkatan organisasi, 3 sampai 6 huruf, dan singkatan itu unik di seluruh `organisasi.json` | 0,90 | `singkatan` |
| `jaccard(tokenNama(a), tokenNama(b)) = j >= 0,60` | `j` | `token` |
| selain itu | 0 | tidak ada tautan |

**Ambigu**: bila dua organisasi atau lebih mendapat `f_nama` tertinggi yang sama, TIDAK ada yang otomatis; semuanya masuk antrean dengan `catatan: ambigu`. Nama yang hanya status (`IPP`, `SH-PLN`) dilewati.

### T.3 Metode per pasangan

**L01 proyek ke organisasi** (`proyek-org`). Masukan: `pihak.pemilik|epc|pembeli|peminjam|pelaksana` (teks), `ruptl_pengembang.json`, `pendanaan.json`. Pendukung (masing-masing benar atau salah): `prov_sama` (provinsi kantor/lokasi organisasi sama dengan provinsi proyek), `kategori_wajar` (kategori organisasi cocok dengan peran: `pemilik` bukan `kementerian-lembaga` kecuali proyek PSN; `epc` bukan `bumn` induk listrik), `tek_cocok` (kepakaran organisasi memuat teknologi proyek).

`skor = f_nama x (0,85 + 0,05 x n_pendukung)` dengan `n_pendukung` dari 0 sampai 3. Veto: peran mustahil (organisasi `donor` sebagai `epc`) memberi skor 0. `tingkat_bukti` mengikuti sumber teks pihaknya (situs resmi pengembang = `kata-pihak`; dokumen RUPTL = `terkonfirmasi`; berita = `cuplikan`; hanya fitur nama = `inferensi` bila tak ada sumber).

| Pihak (teks) | Organisasi | f_nama | Pendukung | Skor | Zona |
| --- | --- | --- | --- | --- | --- |
| "PT PLN Indonesia Power" (proyek hidro, Jawa Barat) | "PT PLN Indonesia Power" | 1,00 (`nama-baku`) | kategori_wajar, tek_cocok = 2 | 1,00 x 0,95 = 0,95 | otomatis |
| "Indonesia Power" | PLN Indonesia Power | 1,00 (`alias-kurasi`) | 1 | 0,90 | otomatis |
| "Medco Power" | "Medco Power Indonesia" | 2/3 = 0,667 (`token`) | 1 | 0,667 x 0,90 = 0,60 | RAGU (batas bawah inklusif) |
| "Pertamina Power" | "Pertamina Power Indonesia" dan "Pertamina Power Energi" (hipotetis) | 2/3 = 0,667 untuk keduanya, seri | - | tidak dinilai | antrean `ambigu` |
| "Abc Energi" | tidak ada | 0 | - | 0 | tidak ada tautan; `tanpa_padanan` |

**L02 proyek ke regulasi** (`proyek-regulasi`), empat jalur; satu pasangan memakai skor jalur tertinggi.
- **Jalur A, program**: proyek ber-`program_ids`, regulasi ada di `program.regulasi_ids` atau `dasar hukum` program. `skor 0,85`, `tingkat kata-pihak` (dataset program disusun dari rujukan resmi), `cara: teks-resmi`.
- **Jalur C, sebut eksplisit**: segmen `pasal` atau `lampiran` regulasi menyebut nama proyek (`tokenNama` identik, panjang >= 2 token) atau kode PSN/WKP. `skor 1,00`, `terkonfirmasi` bila ekstraksi bukan OCR dan `mutu >= 0,9`, selain itu `cuplikan`.
- **Jalur B, kategori** (inferensi, cadangan): `skor = 0,40 x f_tek + 0,25 x f_wilayah + 0,20 x f_status + 0,15 x f_instansi`. `f_tek` = 1 bila `topik[]` regulasi memuat teknologi proyek; `f_wilayah` = 1 bila perda provinsi proyek atau regulasi nasional dengan 0,6; `f_status` = 1 bila `berlakuPada(r, tanggal_acuan_proyek)` benar, veto (skor 0) bila `dicabut` sebelum tanggal itu; `f_instansi` = 1 bila penerbit relevan (ESDM, Kemenkeu, Bappenas, PLN untuk kelistrikan), 0,5 selain itu. `tingkat inferensi`. Tiap proyek menyimpan maksimal 8 tautan jalur B (urut skor menurun, lalu `tgl_tetap` terbaru, lalu `id`).
- **Jalur D, berita**: judul berita yang sudah bertaut ke proyek (T.4) dan menyebut pola regulasi `(jenis) (nomor)/(tahun)` yang ada di katalog. `skor 0,90`, `cuplikan`.

Contoh jalur B: proyek surya, Jawa Barat, tanggal acuan 2025-06-01. Permen nasional PLTS Atap berlaku, penerbit ESDM: `0,40 + 0,25 x 0,6 + 0,20 + 0,15 = 0,90` otomatis. Perda energi Sumatera Utara, topik surya: `f_wilayah` 0 (provinsi beda, veto wilayah: aturan daerah lain tidak pernah ditautkan), skor 0.

**L03 pendanaan** (`pendanaan-proyek`, `pendanaan-org`). Proyek: `skor = 0,50 x sim_nama_proyek + 0,20 x pemberi_cocok + 0,15 x tek_sama + 0,15 x tahun_dalam`, `sim_nama_proyek = jaccard` judul pendanaan melawan nama proyek; `pemberi_cocok` = 1 bila pemberi dana ada di `pihak` proyek; `tahun_dalam` = 1 bila tahun pendanaan antara `waktu.persetujuan - 1` dan `waktu.penutupan + 1`. Nama proyek yang disebut persis dengan >= 2 token distinktif memberi `sim_nama_proyek` 1,00. Pemberi ke organisasi: kode IATI (mis. `AU-5`) dipetakan lewat tabel silang `data/direktori/iati_org.json` (kode ke `organisasi_id`, disusun kurator); tanpa baris di tabel: nama pemberi lewat T.2; tidak ada padanan = usul `organisasi_baru` ke antrean (tidak dibuat otomatis).

**L04 riset ke pakar, kampus, inovasi.**
- Pakar ke orang (`pakar-orang`): kunci pasti `openalex_id` atau `orcid` sama = 1,00 `terkonfirmasi`. Selain itu `skor = 0,55 x f_nama + 0,25 x f_afil + 0,20 x f_bidang`; `f_nama`: himpunan token nama (gelar dibuang, urutan diabaikan) identik 1,00; nama belakang sama dan inisial depan cocok 0,70; selain itu 0 (veto bila di bawah 0,70). `f_afil`: afiliasi cocok 1, tak diketahui 0,5, bertentangan 0. `f_bidang`: irisan `kepakaran` orang dengan topik riset tak kosong 1, selain itu 0. **Kembaran**: bila lebih dari satu orang punya `f_nama >= 0,90` untuk pakar yang sama, tak satu pun otomatis.
- Riset ke pakar: tiap penulis riset dicocokkan lewat `openalex_id` penulis ke `pakar_riset`, lalu ke orang.
- Kampus (`riset-kampus`): afiliasi teks melawan organisasi kategori `perguruan-tinggi` lewat T.2 (`singkatan` ITB, UI, UGM masuk tabel singkatan unik). Tanpa padanan: usul `organisasi_baru`.
- Inovasi dan kampus: `inovasi.lembaga_id` valid dibalik menjadi `organisasi.inovasi_ids` (kunci pasti, `skor 1,00`, tidak melewati antrean).

| Kasus | f_nama | f_afil | f_bidang | Skor | Zona |
| --- | --- | --- | --- | --- | --- |
| "Budi Santoso, Dr. Ir., M.T." melawan penulis "Budi Santoso", ITB sama, bidang cocok, hanya satu "Budi Santoso" | 1,00 | 1 | 1 | 0,55 + 0,25 + 0,20 = 1,00 | otomatis |
| sama, afiliasi tak diketahui, bidang cocok | 1,00 | 0,5 | 1 | 0,55 + 0,125 + 0,20 = 0,875 | otomatis |
| "B. Santoso" | 0,70 | 1 | 0 | 0,385 + 0,25 = 0,635 | ragu |
| nama sama, dua orang direktori bernama itu | 1,00 | - | - | - | antrean `kembaran` |

**L05 berita ke entitas dan wilayah.** Berita hanya menyimpan judul dan tautan (SKEMA-POTRET), jadi pencocokan dilakukan atas `judul` ditambah nama media. Kamus penanda dibangun dari `norm` nama, singkatan unik, dan alias setiap organisasi, proyek, orang (nama lengkap saja), serta pola regulasi. Pencocokan memakai batas kata, terpanjang menang (`Pertamina NRE` mengalahkan `Pertamina`). Skor entitas: `skor = 0,60 x f_nama + 0,20 x f_konteks + 0,20 x f_unik`; `f_nama` = 1,00 untuk nama atau alias >= 2 token, 0,90 untuk singkatan unik 3 sampai 6 huruf, 0,50 untuk satu token lain; `f_konteks` = 1 bila judul memuat kata kunci energi atau teknologi dari kamus `KONTEKS_ENERGI`; `f_unik` = 1 bila pencocokan terpanjang hanya cocok ke satu entitas. Pola regulasi persis `Permen ESDM 5/2025` ke regulasi di katalog = `skor 1,00`, tingkat `cuplikan`.

| Judul | Pencocokan | Skor | Zona |
| --- | --- | --- | --- |
| "PT PLN (Persero) Tambah PLTS Atap di Jawa Barat" | PLN (alias >= 2 token) 1,00; konteks 1; unik 1 | 1,00 | otomatis |
| "PLN Targetkan PLTS Atap 1 GW" | singkatan unik 0,90; konteks 1; unik 1 | 0,54 + 0,20 + 0,20 = 0,94 | otomatis |
| "Surya Hadirkan Energi Bersih" (dua organisasi bernama satu kata "Surya") | satu token 0,50; konteks 1; unik 0 | 0,30 + 0,20 + 0 = 0,50 | buang |
| "Pembangkit Baru Beroperasi" | tidak ada kecocokan | - | tanpa tautan |

Wilayah: gazetteer 38 provinsi (nama, singkatan resmi `NTT`, `DKI`) dan 514 kabupaten/kota (awalan `Kab.` atau `Kota` dipakai untuk membedakan Bandung kabupaten dan kota). Terpanjang menang: "Papua Barat Daya" bukan "Papua". Satu kata yang hanya nama pulau ("Jawa", "Sumatera") TIDAK dipetakan ke provinsi. `skor` provinsi persis 0,95; kabupaten persis 0,90; ambigu (nama kabupaten sama di dua provinsi, mis. "Bandung") tanpa nama provinsi di judul = antrean `ambigu`. Maksimal 3 wilayah per berita (urut kemunculan).

**L06 tingkat kabupaten** (`kode_kab`). Urutan: (1) `lokasi.kabupaten_kota` teks melawan gazetteer di dalam provinsi proyek, persis = skor 1,00 `kata-pihak`; (2) koordinat: poligon kabupaten bila `data/geo/kab.geojson` ada (titik dalam poligon, skor 0,95, `inferensi`); bila poligon tidak ada, tetangga terdekat ke titik pusat kabupaten dalam provinsi yang sama: `skor = 1 - d1 / (d1 + d2)` dengan `d1`, `d2` jarak terdekat dan kedua; `d1 > 50 km` atau selisih `d2 - d1 < 20% x d1` = antrean ragu `ambigu`. `data/geo/pusat-wilayah.json` sudah ada; poligon belum, jadi pada L06 awal cabang tetangga terdekat dipakai dengan skor tertinggi 0,85 dikurangi 0,25 (maksimum 0,60, sehingga SELALU antrean, tidak otomatis) sampai poligon tersedia. Itu disengaja: titik pusat bukan batas wilayah.

### T.4 Antrean ragu

Zona `A_RAGU <= skor < A_OTO`, tautan ambigu, kembaran, dan usul entitas baru masuk antrean. Satu baris `tautan_antrean` per `kunci` (DT `0039`).

- Urutan tampil: skor menurun, lalu jumlah halaman yang akan terisi (`dampak`) menurun, lalu `kunci`.
- Batas: maksimal 200 baris aktif per `jenis`; sisanya TIDAK diantre (dihitung di `tersisa_tak_diantre` agar target cakupan jujur) dan diproses ulang putaran berikut.
- Keputusan kurator: `setuju` (tautan masuk dengan `status = kurator-setuju`, `tingkat_bukti` tetap dari sumbernya, tambah `diverifikasi`), `tolak` (kunci masuk `tautan_tolak`; bot tidak mengantre ulang pasangan yang sama selama `versi_metode` sama), `tunda`. Kedaluwarsa 120 hari tanpa keputusan: status `kedaluwarsa`, boleh diantre lagi.
- Sasaran kerja kurator [U]: 50 butir per hari per kurator; di atas itu antrean menumpuk dan laporan cakupan menulis `antrean_menunggu`.

### T.5 Target cakupan terukur

`cakupan(m) = |entitas yang punya >= 1 tautan aktif jenis m| / |entitas populasi m|`, dihitung hanya dari `tautan.json` (oto + kurator-setuju). `batas_atas(m) = |entitas yang punya >= 1 kandidat dengan skor >= A_RAGU| / |populasi|`: berapa pun upaya, tautan tak bisa melebihi ini tanpa mengarang. **Target efektif = min(target nominal, 0,95 x batas_atas)**; bila target nominal lebih tinggi daripada batas atas, laporan menulis "data belum mencukupi" dan angka itu, tidak menurunkan ambang.

| Metrik (populasi) | Garis dasar (audit 11 Nov) | Target nominal | Tiket |
| --- | --- | --- | --- |
| proyek punya >= 1 organisasi | 34,9% (191 dari 548) | >= 70% | L01 |
| proyek punya >= 1 regulasi, apa pun | 4% | >= 90% (terukur di `§dampak`) | L02 |
| proyek punya >= 1 berita | 3% | >= 25% | L02 |
| pendanaan punya proyek | 14% (48 dari 338) | >= 30% | L03 |
| pemberi dana (kode IATI) punya organisasi | 0% dari 232 | >= 70% | L03 |
| riset punya >= 1 pakar bertaut orang | 1% | >= 40% | L04 |
| pakar_riset punya `orang_id` | 0% dari 250 | >= 25% | L04 |
| riset punya kampus bertaut organisasi | 4,7% (121 dari 2.581) | >= 60% | L04 |
| inovasi dengan lembaga valid punya tautan masuk | 0% | >= 98% | L04 |
| berita punya >= 1 entitas | 35% | >= 70% | L05 |
| berita punya >= 1 wilayah | 24% | >= 80% | L05 |
| proyek berprovinsi punya `kode_kab` | 0% | >= 60% | L06 |

Target [U] diperlakukan sebagai perkiraan perancang; pemilik boleh mengubahnya. **Gerbang L08 memakai pengunci naik-saja (ratchet)**: `cakupan_ukur >= garis_dasar_tersimpan - 0,5 poin`; `garis_dasar_tersimpan` hanya dinaikkan oleh tiket, tidak pernah diturunkan tanpa catatan keputusan.

### T.6 Dua arah dan idempotensi

`terapkanTautan` menulis kedua sisi dari satu baris `tautan`. Menjalankannya dua kali menghasilkan berkas identik (uji `tautan.ulang-byte-sama`). Untuk simetri, `jenis` kebalikan dipasangkan (`proyek-org` dengan `org-proyek`) sehingga gerbang L08 cukup memeriksa: tiap rujukan `a.x_ids` mengandung `b` hanya bila `b.y_ids` mengandung `a`.

### T.7 Kasus tepi lintas metode

(a) Entitas `digabung_ke`: tautan ke id lama dialihkan ke id kanonik sebelum penilaian (ALG-lama 3.1 aturan 3). (b) Organisasi berganti nama: nama lama harus ada di `nama_lain`, bukan dicocokkan lewat token. (c) Dua tautan dengan jenis sama tetapi peran berbeda (organisasi yang `pemilik` sekaligus `epc`) disimpan dua baris, dihitung satu entitas pada `cakupan`. (d) Nama yang berubah menjadi sangat panjang oleh `norm` (> 6 token) hanya cocok persis. (e) Semua tautan yang tingkat buktinya `inferensi` ditampilkan dengan lencana "Hitungan kami" dan diurutkan sesudah tingkat yang lebih tinggi.

### T.8 Uji acuan

`f_nama.urutan-aturan`, `f_nama.ambigu-tak-otomatis`, `skorProyekOrg.pln-0,95`, `skorProyekOrg.medco-batas-0,60-ragu`, `skorProyekOrg.veto-peran`, `skorPakar.kembaran-antre`, `skorPakar.inisial-0,635`, `skorBerita.terpanjang-menang`, `skorBerita.satu-token-buang`, `wilayah.papua-barat-daya`, `wilayah.pulau-tak-dipetakan`, `kab.tanpa-poligon-selalu-antre`, `zona.batas-inklusif-0,60-0,85`, `oto.syarat-fitur-utama-0,90`, `antrean.batas-200`, `cakupan.batas-atas-target-efektif`, `cakupan.ratchet-naik-saja`, `tautan.ulang-byte-sama`, `tautan.dua-arah`.

---

## §dampak: peta regulasi ke entitas (JM-U06, U07)

### D.1 Status berlaku

Perluasan ALG-lama 2.9: frontmatter `hukum/**` memakai enam nilai `status` (`berlaku`, `diubah`, `dicabut`, `dicabut_sebagian`, `rancangan`, `tidak_diketahui`). Pemetaan ke `STATUS_REGULASI` (tiga nilai) yang dipakai layar lama: `dicabut_sebagian` menjadi `diubah` dengan penanda `pasal_dicabut[]`; `rancangan` dan `tidak_diketahui` menjadi `null` dengan alasan `belum-berlaku` atau `belum-dicari`. Aturan lama "dicabut menang" tetap.

**Rentang berlaku.** `mulai(r) = tgl_undang` bila ada (asas berlaku sejak diundangkan, kecuali pasal peralihan menyebut lain); jika `tgl_undang` kosong, `mulai = tgl_tetap` dengan penanda `mulai_perkiraan: true`. `selesai(r)` = `mulai` regulasi TERPENDEK yang `mencabut` r (relasi dua arah, U06); bila tidak ada, tak terbatas. Relasi `mengubah` tidak mengakhiri r; ia membuka versi baru pada pasal yang diubah.

```
berlakuPada(r, t):
  rancangan                      -> "rancangan"
  t < mulai(r)                   -> "belum_berlaku"
  t >= selesai(r)                -> "dicabut"
  ada ubah u dengan mulai(u) <= t -> "diubah"        // masih berlaku, ada perubahan
  selain itu                     -> "berlaku"
statusPasal(r, p, t): "dicabut" bila p ada di pasal_dicabut[] dari relasi yang mulai(.) <= t; selain itu berlakuPada(r, t)
```

Relasi bertentangan (A mencabut B dan B mencabut A) atau siklus: tidak ditentukan; kedua `status = tidak_diketahui`, masuk antrean `hukum_kurasi` (DT `0040`).

### D.2 Jalur dampak dan skor

Untuk pasangan (regulasi `r`, entitas `e`), skor jalur tertinggi dipakai:

| Jalur | Cara | Skor | `tingkat_bukti` |
| --- | --- | --- | --- |
| E1 eksplisit nama lengkap | segmen `pasal` atau `lampiran` memuat nama/alias >= 2 token entitas (T.2, terpanjang menang) | 1,00 | `terkonfirmasi` (teks bukan OCR, `mutu >= 0,9`); OCR atau `mutu < 0,9` = `cuplikan` |
| E2 eksplisit singkatan | singkatan unik 3 sampai 6 huruf | 0,90 | sama dengan E1 |
| K1 kategori + wilayah | pasal ruang lingkup (Pasal 1 sampai 5 atau "Ketentuan Umum") memuat kata kunci teknologi entitas (`KATA_TEK`, batas kata) dan wilayah regulasi mencakup wilayah entitas | 0,75 | `inferensi` |
| K2 kategori nasional | kata kunci teknologi cocok, regulasi nasional | 0,60 | `inferensi` |
| W1 wilayah saja | perda/pergub provinsi `X` ke entitas berprovinsi `X` tanpa kecocokan teknologi | 0,40 | `inferensi` |
| R1 pewarisan | `r` mengubah `s`, dan `s` berdampak ke `e` pada pasal yang diubah | skor `s` x 0,95 | tingkat `s` |

`kekuatan`: skor >= 0,85 `mengikat`; 0,60 sampai kurang dari 0,85 `terkait`; di bawah 0,60 disimpan di log, tidak tampil. Regulasi `rancangan` tidak pernah `mengikat` (dibatasi `terkait`, label "rancangan, belum mengikat"). Berbeda dari `§tautan`: jalur K1/K2 tidak melewati antrean kurator (jumlahnya ribuan); antrean hanya untuk E1/E2 yang ambigu (nama sama di dua entitas) dan relasi bertentangan. Tampil di profil entitas: maksimal 8 aturan, urut `kekuatan`, skor menurun, `mulai` terbaru, `id`; tombol "lihat semua".

`dasar` tiap tautan dampak = `{dok, segmen_label, halaman}` (mis. `{"dok":"permen-contoh-10-2024","segmen":"Pasal 14","halaman":6}`) sehingga layar menautkan ke `#pasal-14` di naskah.

### D.3 Tanggal acuan per entitas

Proyek: `tanggal_acuan = tanggal_ppa` bila ada, else `cod_target`, else `kini`. Tampil DUA kolom: "Berlaku pada tanggal acuan proyek" dan "Berlaku sekarang". Entitas lain: `kini`.

### D.4 Contoh kerja

Data fiktif: `permen-contoh-10-2024` (ditetapkan 2024-03-01, diundangkan 2024-03-08; Pasal 3 ruang lingkup "PLTS atap"; Pasal 14 menyebut "PT PLN (Persero)"). `permen-contoh-25-2025` (diundangkan 2025-02-10) mencabut Permen 10/2024.

| Entitas | Jalur | Skor | Kekuatan | Dasar |
| --- | --- | --- | --- | --- |
| organisasi PT PLN (Persero) | E1 | 1,00 | mengikat | Pasal 14 |
| proyek "PLTS Atap Gedung A" (surya, atap, Jawa Barat, `cod_target` 2025-06-01) | K2 | 0,60 | terkait | Pasal 3 |

`berlakuPada(permen-10-2024, 2024-12-31)` = `berlaku`; `berlakuPada(permen-10-2024, 2025-06-01)` = `dicabut` (selesai 2025-02-10). Untuk proyek di atas pada tanggal acuan 2025-06-01: Permen 25/2025 `terkait` dan berlaku, Permen 10/2024 tampil di bagian riwayat. Kolom "sekarang" menampilkan hanya Permen 25/2025 bila 10/2024 sudah dicabut.

### D.5 Kasus tepi

(a) `mulai_perkiraan`: dampak tampil dengan tanda; tidak memengaruhi skor. (b) Pasal peralihan: bila segmen berjudul "Ketentuan Peralihan" memuat tanggal khusus, ditaruh sebagai `catatan_peralihan` (tidak diurai otomatis); kurator memutuskan. (c) UU yang dibatalkan sebagian oleh putusan MK: ditandai manual `dicabut_sebagian` oleh kurator dengan rujukan putusan. (d) Satu entitas dapat ditunjuk E1 oleh pasal yang kemudian dicabut sebagian: `statusPasal` yang menentukan, bukan `status` dokumen. (e) Regulasi tanpa teks (RUU, rancangan lokal): hanya jalur K1/K2/W1 dari metadata `topik`; E1/E2 tak ada. (f) Nama entitas muncul di `menimbang` (konsiderans): bukan dasar `mengikat` (konsiderans tidak mengikat); dihitung `terkait` 0,80.

### D.6 Target cakupan (U07)

| Metrik | Garis dasar | Target |
| --- | --- | --- |
| proyek punya >= 1 aturan `terkait` atau lebih kuat | 4% | >= 90% |
| proyek punya >= 1 aturan `mengikat` | belum ada | >= 35% |
| regulasi berlaku punya >= 1 entitas terdampak, atau alasan `tanpa-sasaran-terukur` | 5% | 100% |
| tiap 38 provinsi punya >= 1 regulasi berlaku yang menyebutnya | belum ada | 38 dari 38 |

Perhitungan dan pengunci naik-saja seperti T.5.

### D.7 Uji acuan

`berlakuPada.dicabut-menang`, `berlakuPada.belum-berlaku`, `berlakuPada.diubah-masih-berlaku`, `berlakuPada.mulai-perkiraan`, `statusPasal.dicabut-sebagian`, `dampak.e1-pasal-14-mengikat`, `dampak.k2-terkait-0,60`, `dampak.rancangan-tak-mengikat`, `dampak.konsiderans-0,80`, `dampak.wilayah-lain-ditolak`, `dampak.ocr-turun-cuplikan`, `dampak.relasi-siklus-antre`, `dampak.8-teratas-urutan`.

---

## §kesegaran: batas basi per frekuensi (JM-T01, T07, T08)

### K.1 Masalah

`kesegaran.json` memantau 16 dari 178 dataset dan menghitung umur terhadap tanggal BANGUN, bukan tanggal sumber, sehingga semuanya "segar" padahal berita terbaru 7 Nov. Yang baru: 178 dataset, tiap dataset punya frekuensi, dan dua jam yang tidak dicampur: kapan terakhir diperiksa (`umur_ambil`) dan umur data itu sendiri (`umur_data`).

### K.2 Masukan per dataset (dari `data/sumber_jadwal.json`)

`frekuensi` ∈ `harian`, `mingguan`, `bulanan`, `kuartalan`, `tahunan`, `statis`. `jenis_waktu` ∈ `aliran` (data mengalir terus: berita, harga, tender; umur diukur dari tanggal data terbaru) atau `rilisan` (terbit berkala; umur diukur dari pemeriksaan sukses terakhir). `jeda_rilis_hari` (penerbit baru merilis sekian hari setelah periode data, bawaan 0). `utama: true|false`. `masukan[]` untuk dataset turunan. Status sumber T01: `ok | basi | gagal | blokir | perlu_kunci`.

### K.3 Interval dan batas

`I(f)`: harian 1, mingguan 7, bulanan 30, kuartalan 91, tahunan 365. Batas dalam hari bulat:

| Frekuensi | I | segar bila umur <= `floor(1,5 x I)` | perlu bila umur <= `3 x I` | basi bila lebih |
| --- | --- | --- | --- | --- |
| harian | 1 | 1 | 3 | > 3 |
| mingguan | 7 | 10 | 21 | > 21 |
| bulanan | 30 | 45 | 90 | > 90 |
| kuartalan | 91 | 136 | 273 | > 273 |
| tahunan | 365 | 547 | 1.095 | > 1.095 |
| statis | - | selalu segar | - | - |

```
umur_ambil = hari(kini - tanggal_periksa_sukses_terakhir)
umur_data  = hari(kini - tanggal_data_terbaru) - jeda_rilis_hari       // hanya jenis_waktu = aliran, minimal 0
s1 = tingkat(umur_ambil, f)
s2 = (jenis_waktu = aliran) ? tingkat(umur_data, f) : segar
status = terburuk(s1, s2)                                                // segar < perlu < basi
```

**Turunan**: `status` = terburuk dari status dataset `masukan[]` yang bertanda `utama`. **Label tertahan**: bila sumber berstatus `blokir` atau `perlu_kunci`, status dasar tetap dihitung tetapi layar menambah label "tertahan: <alasan>" (mis. C-25 kunci API) agar bukan sekadar "basi". Sumber `gagal` dengan `gagal_beruntun >= 3` menaikkan status dataset minimal ke `perlu`. **Menunggu panen**: bila `sinyal_berubah_pada` (denyut Worker, T07) lebih baru daripada `tanggal_periksa_sukses_terakhir` dan selisihnya lebih dari `floor(0,5 x I)`, tampil "sumber berubah, belum dipanen".

**Indeks panel**: `indeks_segar = bulat(100 x (n_segar + 0,5 x n_perlu) / n_total, 0)`.

### K.4 Contoh kerja (`kini` = 2026-11-11)

| Dataset | Frekuensi | Jenis waktu | umur_ambil | umur_data (jeda) | s1 | s2 | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| berita | harian | aliran | 4 | 4 (jeda 0) | basi (4 lebih dari 3) | basi | basi |
| regulasi (katalog) | mingguan | rilisan | 4 | - | segar (<= 10) | segar | segar |
| ember_bulanan | bulanan | rilisan | 50 | - | perlu (50 lebih dari 45, kurang dari 90) | segar | perlu |
| harga_icp | bulanan | aliran | 12 | 42 - 15 = 27 | segar | segar (<= 45) | segar |
| bps_tahunan | tahunan | rilisan | 400 | - | segar (<= 547) | segar | segar |
| ruptl | statis | - | - | - | segar | - | segar |

Panel: 120 segar, 30 perlu, 28 basi dari 178: `bulat(100 x (120 + 15) / 178, 0)` = 76. Catatan penting: "regulasi terbaru ditetapkan 88 hari lalu" adalah sifat data, bukan kesegaran; kesegaran regulasi diukur dari pemeriksaan katalog.

### K.5 Kasus tepi

(a) Dataset tanpa frekuensi terdaftar: status `tidak_dipantau` (bukan segar), dihitung di `n_total` sebagai `perlu`, sehingga panel tidak menyembunyikan lubang; T08 menutupnya sampai 178 terdaftar. (b) `kini` sebelum `tanggal_data` (zona waktu): umur dipaku 0. (c) Pemeriksaan sukses tetapi sumber tidak berubah: untuk `rilisan` sah (umur_ambil di-reset); untuk `aliran` tidak (umur_data tetap). (d) Sumber berhenti terbit selamanya: terdeteksi lewat `umur_data` hanya untuk `aliran`; `rilisan` macet tampil sebagai `tanggal_data` lama di kartu, ditandai manual oleh kurator. (e) Dataset dengan banyak sumber: `tanggal_data_terbaru` = maksimum dari sumber `utama`.

### K.6 Uji acuan

`tingkatSegar.batas-per-frekuensi`, `tingkatSegar.batas-inklusif`, `kesegaran.aliran-vs-rilisan`, `kesegaran.berita-basi-empat-hari`, `kesegaran.jeda-rilis`, `kesegaran.turunan-terburuk-utama`, `kesegaran.tertahan-label`, `kesegaran.gagal-3-perlu`, `kesegaran.tanpa-frekuensi-perlu`, `indeksSegar.76`.

---

## §kesiapan: skor desk siap bank dan uji sensitivitas (JM-M04)

### S.1 Definisi

Indeks 0 sampai 100 atas SATU proyek tahap pra-operasi, menyatakan seberapa lengkap bukti lima syarat pembiayaan. Berstatus Hipotesis (KP C-16) sampai lolos S.6. Proyek berstatus `operasi` di luar lingkup (`di-luar-lingkup`).

### S.2 Lima dimensi dan tingkat 0 sampai 4

Fakta yang dibaca terdaftar sebagai `kunci_fakta` baru oleh M04: `lahan_tingkat`, `izin_tingkat`, `sambung_tingkat`, `offtake_tingkat`, `epc_tingkat` (bilangan bulat 0 sampai 4) beserta `tingkat_bukti`.

| Dimensi (kode, bobot `w`) | 1 | 2 | 3 | 4 |
| --- | --- | --- | --- | --- |
| lahan `L` 0,20 | lokasi diketahui | lahan teridentifikasi atau dibebaskan | hak atas lahan terdokumentasi (izin lokasi, sewa, HGU/HGB) | tersertifikasi, bebas sengketa |
| izin `I` 0,25 | pra-izin | izin lokasi atau AMDAL berproses | izin lingkungan + sebagian izin usaha | semua izin utama terbit |
| jaringan `J` 0,20 | rencana (RUPTL) | studi sambung selesai | persetujuan sambung atau PJBL | tersambung |
| offtake `O` 0,25 | masuk RUPTL atau ditunjuk | LoI atau negosiasi PPA | PPA ditandatangani | PPA + tarif tetap + financial close |
| EPC `E` 0,10 | calon | terpilih | kontrak EPC | konstruksi berjalan |

Tingkat 0 = tidak ada data. Bobot `w` berjumlah 1,00 [U], dikunci sebagai hipotesis.

### S.3 Rumus

```
s_d = (tingkat_d / 4) x bobotTingkat(tingkat_bukti_d)        // ALG-lama 4.1: 1,00 / 0,70 / 0,40 / 0,20
skor_mentah = sum(w_d x s_d)                                  // 0..1
kelengkapan = jumlah dimensi dengan tingkat_d >= 1
skor = bulat(100 x skor_mentah, 0)                            // hanya bila kelengkapan >= 3, selain itu null "data-kurang"
label: skor < 25 ide; 25 sampai 49 awal; 50 sampai 74 hampir-siap; >= 75 siap-bank
```

**Gerbang keras**: label `siap-bank` diturunkan menjadi `hampir-siap` bila `tingkat_O < 3` atau `tingkat_I < 3`, berapa pun skornya. Tingkat yang hanya berbukti `inferensi` tidak pernah melampaui `s_d` 0,20, sehingga proyek tak bisa "siap bank" dari tebakan.

### S.4 Contoh kerja

Proyek X: `L` tingkat 3 (`terkonfirmasi`), `I` 2 (`kata-pihak`), `J` 2 (`kata-pihak`), `O` 3 (`terkonfirmasi`), `E` 1 (`cuplikan`).

`s_L = 0,75`; `s_I = 0,5 x 0,7 = 0,35`; `s_J = 0,35`; `s_O = 0,75`; `s_E = 0,25 x 0,4 = 0,10`.
`skor_mentah = 0,20x0,75 + 0,25x0,35 + 0,20x0,35 + 0,25x0,75 + 0,10x0,10 = 0,15 + 0,0875 + 0,07 + 0,1875 + 0,01 = 0,505`. Skor 50,5 dibulatkan **51**, label `hampir-siap` (gerbang keras tidak berlaku).

### S.5 Uji sensitivitas

`sensitivitas(profil, delta = 0,20)`: untuk tiap dimensi `d`, dua perturbasi: `w_d` dikali `(1 - delta)` dan `(1 + delta)`, bobot lain tetap, lalu seluruh bobot dinormalisasi ulang agar berjumlah 1 (10 perturbasi untuk 5 dimensi). Keluaran: `{skor, rentang: [min, max] (setelah bulat), label, label_stabil, n_label_berubah, penentu}`; `label_stabil` benar bila label sama di semua perturbasi; `penentu` = dimensi dengan |selisih| skor tak bulat terbesar (seri: urutan `L, I, J, O, E`).

Untuk Proyek X, `skor_mentah` tertimbang ulang: `(0,505 + w_d x s_d x (f - 1)) / (1 + w_d x (f - 1))`.

| Perturbasi | Skor tak bulat | Dibulatkan | Label |
| --- | --- | --- | --- |
| L x 0,8 | 49,48 | 49 | awal |
| L x 1,2 | 51,44 | 51 | hampir-siap |
| I x 0,8 | 51,32 | 51 | hampir-siap |
| I x 1,2 | 49,76 | 50 | hampir-siap |
| J x 0,8 | 51,15 | 51 | hampir-siap |
| J x 1,2 | 49,90 | 50 | hampir-siap |
| O x 0,8 | 49,21 | 49 | awal |
| O x 1,2 | 51,67 | 52 | hampir-siap |
| E x 0,8 | 51,33 | 51 | hampir-siap |
| E x 1,2 | 49,71 | 50 | hampir-siap |

Hasil: rentang [49, 52], `n_label_berubah = 2`, `label_stabil = false`, `penentu = O` (selisih terbesar 50,5 - 49,21 = 1,29). Kebijakan tampil: label tidak stabil ditulis "51 (49 sampai 52), dekat batas 50" dan proyek tidak boleh berlabel `siap-bank`. `label siap-bank` hanya bila `label_stabil`.

**Uji portofolio**: untuk semua proyek, korelasi peringkat `spearman` (ALG-lama 7.4) antara peringkat dasar dan tiap peringkat perturbasi harus >= 0,90; jika tidak, bobot tidak dirilis.

### S.6 Melepas label Hipotesis [U]

Syarat: untuk >= 15 proyek yang sudah ada keputusan pembiayaan, `spearman` antara skor dan urutan tahap aktual (financial close paling cepat) >= 0,50 dan `label_stabil` benar untuk >= 80% proyek. Sampai itu, tampil pil "Hipotesis".

### S.7 Kasus tepi

(a) Dimensi tanpa data tetapi dimensi lain kuat: `kelengkapan` 3 tetap menghitung, dimensi kosong bernilai 0 (menghukum), layar menulis dimensi yang belum ada. (b) Tingkat tertinggi tetapi satu sumber `inferensi`: `s_d` tetap 0,20 (S.3). (c) Proyek berubah status menjadi `operasi`: skor dihapus, riwayat disimpan. (d) Dua fakta bertentangan: `pilihFakta` memilih tingkat bukti tertinggi, seri tanggal terbaru. (e) `skor` tepat pada batas (49,5): `bulat4` lalu `bulat` menghasilkan 50.

### S.8 Uji acuan

`kesiapan.proyek-x-51`, `kesiapan.gerbang-keras-siap-bank`, `kesiapan.inferensi-maks-0,20`, `kesiapan.data-kurang`, `sensitivitas.proyek-x-rentang-49-52`, `sensitivitas.label-tak-stabil`, `sensitivitas.penentu-O`, `sensitivitas.bobot-ternormalisasi`, `kesiapan.spearman-portofolio-0,90`, `kesiapan.operasi-di-luar-lingkup`.

---

## §tier: tangga anggota dan gerbang fitur (JM-N01 sampai N03)

### R.1 Tangga dan peringkat

D22: non-anggota adalah akun gratis `tamu`; tier mengikuti tangga iuran (`keanggotaan.json`, `pendaftaran.jenis`). Peringkat tetap menurut iuran awal menaik:

| Tier | `rank` | Iuran awal (data) |
| --- | --- | --- |
| `tamu` | 0 | 0 |
| `pelajar` | 1 | Rp100.000 |
| `individu` | 2 | Rp450.000 |
| `ngo` | 3 | Rp1,6 juta |
| `usaha_kecil` | 4 | Rp25 juta |
| `usaha_besar` | 5 | Rp50 juta |
| `utama` | 6 | Rp175 juta |

Penyebutan K24 (individu, mahasiswa, perusahaan) dipetakan ke kode di atas sekali di GLOSARIUM §5; dokumen ini hanya memakai kode.

Peran staf (`pengurus`, `kurator`, `wilayah`, `admin`, `super`) memakai peringkat 6 untuk gerbang tier; tier hanya membedakan akun `anggota`.

### R.2 Menentukan tier

```
tierDari(pendaftaran, kini):
  status != disetujui                    -> tamu
  bayar = lunas                          -> jenis
  tanpa_lunas = 1 dan kini <= diputus_pada + TENGGANG_BELUM_LUNAS (30 hari) -> tierDasar(kategori)   // C-28: pelajar bagi mahasiswa, individu bagi lainnya
  selain itu                             -> tamu
tierEfektif(baris, kini):
  baris.tanpa_lunas = 1                  -> kini <= baris.berlaku_dari + TENGGANG_BELUM_LUNAS ? tierDasar(kategori) : tamu   // C-28; berlaku_dari = tanggal persetujuan
  berlaku_sampai kosong                  -> baris.tier
  kini <= berlaku_sampai + TENGGANG_IURAN (30 hari) -> baris.tier
  selain itu                             -> tamu
```

`tierDasar(kategori)` adalah fungsi, bukan konstanta: tier terendah berbayar untuk kategorinya (`pelajar` bagi mahasiswa, `individu` bagi lainnya termasuk organisasi) (C-28; GLOSARIUM §5). `tierEfektif` dihitung saat dibaca, tidak diubah oleh cron (deterministik, tanpa kerja terjadwal tambahan). `pelajar` tidak punya iuran tahunan (data): `berlaku_sampai` kosong sampai admin menetapkan. Tenggang belum lunas 30 hari adalah KEPUTUSAN (C-28: tier dasar selama tenggang, tier berbayar sesudah lunas, lewat tenggang turun ke `tamu` tanpa menghapus data). Tenggang iuran lewat masa berlaku 30 hari tetap usulan [U]. Tanpa C-21 (pengingat iuran) tidak ada pemberitahuan otomatis, hanya pita di layar akun.

### R.3 Peta fitur

`FITUR[kunci] = {tingkat: [...urut naik], per_tier: [tamu, pelajar, individu, ngo, usaha_kecil, usaha_besar, utama]}`; `levelFitur(tier, kunci)` mengembalikan elemen `tingkat` pada indeks tier. Nilai bersumber peta tingkatan manfaat di riset benchmark (usulan [U], diperbarui hanya lewat keputusan pemilik; C-23 menetapkan lima kelompok kunci: kontak, data pasar rinci, unduhan, laporan lengkap, alat analisis).

| Fitur (`kunci`) | tamu | pelajar | individu | ngo | usaha_kecil | usaha_besar | utama |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `rapor_ringkas` | ya | ya | ya | ya | ya | ya | ya |
| `rapor_lengkap` | - | - | ya | ya | ya | ya | ya+analisis |
| `unduh_data` (CSV/JSON bersitasi) | - | terbatas | ya | ya | ya | ya | ya+API |
| `advokasi` | baca | baca | komentar | komentar | komentar | usul | kursi |
| `radar_proyek` | ringkas | ringkas | ringkas | ya | ya | awal | ruang |
| `desk_siap_bank` | - | - | - | ya | ya | ya | prioritas |
| `temu_bisnis` | - | - | ya | ya | ya | ya | kuota+ |
| `kelompok_kerja` | - | - | peninjau | anggota | anggota | anggota | calon-ketua |
| `akademi` | dasar | penuh | penuh | penuh | penuh | penuh | kelas-khusus |
| `tanda_terpercaya` | - | - | - | - | ya | ya | ya |
| `kontak` (C-23; kontak pakar dan kontributor, bukan kontak korporat organisasi) | - | - | ya | ya | ya | ya | ya |
| `pasar_rinci` (C-23) | - | - | - | ya | ya | ya | ya |
| `alat_analisis` (C-23) | - | - | ya | ya | ya | ya | ya |
| `lowongan` | baca | magang | pasang | pasang | pasang | pasang | unggulan |

Tingkat urut tiap fitur: `rapor_ringkas`, `tanda_terpercaya`, `kontak`, `pasar_rinci`, `alat_analisis`: [-, ya]; `rapor_lengkap`: [-, ya, ya+analisis]; `unduh_data`: [-, terbatas, ya, ya+API]; `advokasi`: [-, baca, komentar, usul, kursi]; `radar_proyek`: [-, ringkas, ya, awal, ruang]; `desk_siap_bank`: [-, ya, prioritas]; `temu_bisnis`: [-, ya, kuota+]; `kelompok_kerja`: [-, peninjau, anggota, calon-ketua]; `akademi`: [-, dasar, penuh, kelas-khusus]; `lowongan`: [-, baca, magang, pasang, unggulan]. Gerbang `fitur.monoton`: tiap baris tidak boleh menurun dari kiri ke kanan menurut urutan `tingkat`; kolom `tamu` dan `pelajar` tidak boleh kosong seluruhnya (tier bawah harus bernilai pembelajaran dan jaringan).

### R.4 Gerbang

```
bolehFitur(akun, kunci, kini) -> { ok, level, tier, tier_min, alasan }
  tier = staf ? 6 : peringkat(tierEfektif(akun_tier, kini))
  level = levelFitur(tier, kunci)
  ok = level != "-"
  tier_min = tier terendah dengan level != "-"        // untuk ajakan naik tier di JM-N03
```

Server menyaring data (N02); klien tidak menyaring. Gerbang ke R2 potret: `lapisBoleh` (DT `§potret-tier`).

### R.5 Contoh kerja

Akun A: pendaftaran `individu`, `bayar = lunas`, `berlaku_sampai = 2027-06-30`; `kini` 2026-11-11: tier `individu` (rank 2). `bolehFitur(A, rapor_lengkap)` = ya; `pasar_rinci` = tidak, `tier_min = ngo`, ajakan "tersedia mulai keanggotaan NGO". Akun B: `individu`, `berlaku_sampai = 2026-09-01`: `kini <= 2026-10-01`? Tidak (2026-11-11), jadi `tierEfektif = tamu` dan `rapor_lengkap` ditolak. Akun C: pendaftaran `ngo` disetujui, `tanpa_lunas = 1`, diputus 2026-10-20: tier dasar `individu` (bukan mahasiswa) sampai 2026-11-19 (hari ke-30); pada 2026-11-20 menjadi `tamu`. Bila lunas pada 2026-11-05: tier `ngo` sejak saat itu.

### R.6 Kasus tepi

(a) Akun lama tanpa pendaftaran (dibuat admin): `asal = backfill`, tier `individu` sambil menunggu penetapan admin (jangan mengunci anggota yang sudah ada). (b) Pendaftar ditolak: tidak punya akun, tidak ada tier. (c) Perubahan tier di tengah sesi: nilai dibaca saat sesi dimuat; efek paling lambat satu sesi (kontrol: `GET /api/saya` membaca ulang tiap muat halaman). (d) Fitur yang tidak ada di peta: ditolak (`ok = false`, alasan `fitur-tak-dikenal`), bukan dibuka. (e) Peran staf yang menyamar sebagai tamu: tidak ada; tier tidak mengurangi hak peran.

### R.7 Uji acuan

`tierDari.lunas`, `tierDari.tanpa-lunas-tenggang-30`, `tierDari.tanpa-lunas-tier-dasar-mahasiswa-pelajar`, `tierDari.tanpa-lunas-tier-dasar-lainnya-individu`, `tierDari.lunas-di-tenggang-tier-jenis`, `tierDari.belum-bayar-tamu`, `tierEfektif.tenggang-iuran`, `tierEfektif.berlaku-kosong`, `bolehFitur.individu-rapor-lengkap`, `bolehFitur.tier-min-ajakan`, `bolehFitur.staf-rank-6`, `bolehFitur.fitur-tak-dikenal-ditolak`, `fitur.monoton`, `tier.backfill-individu`.

---

## Catatan untuk induk

Hal yang bertentangan atau menyimpang dari KEPUTUSAN atau dokumen di atasnya. Tidak ada yang sudah diputuskan sendiri di luar pilihan bawaan di bawah; tiap butir menunggu induk atau pemilik.

1. **D22 menyebut status `tamu` pada akun.** Tabel `akun.status` punya CHECK `('menunggu','aktif','nonaktif')` yang beku (membangunnya ulang berarti membangun `akun` yang dirujuk puluhan tabel; komentar `0019_ikuti_portal.sql` menolak jalan itu untuk `peran`). Bawaan: `tamu` disimpan di tabel pendamping `akun_tier` (DT `0042`), akun tetap `peran = anggota`, `status = aktif`. Efek D22 sama; D22 sendiri menetapkan tabel pendamping `akun_tier`, jadi butir ini selesai.
2. **Frontmatter regulasi enam nilai status melawan `STATUS_REGULASI` tiga nilai (ALG-lama 2.9).** `§dampak` D.1 memetakan enam ke tiga tanpa mengubah ALG-lama. Bila induk ingin enum di ALG-lama diperluas, ubah 2.9 dan `public/taksonomi.js`.
3. **Kontak korporat tidak dipindah (C-23, diputuskan).** `organisasi.kontak` tetap di lapis `publik` dan terlihat semua yang login; tidak ada kolom `organisasi` yang berpindah lapis. Fitur `kontak` di peta R.3 berlaku untuk kontak pakar dan kontributor; kontak orang tetap hanya Pengurus.
4. **Tanda `tanpa_lunas` (D20) dan pembeda nyata (K24) (C-28, diputuskan).** Anggota yang disetujui tanpa lunas memakai tier terendah berbayar untuk kategorinya (`pelajar` bagi mahasiswa, `individu` bagi lainnya termasuk organisasi) selama tenggang 30 hari dan naik ke tier pilihan sesudah lunas; lewat tenggang turun ke `tamu` tanpa menghapus data (`§tier` R.2). Pembeda K24 tidak bocor karena tier berbayar baru berlaku sesudah lunas. Yang masih usulan [U]: tenggang 30 hari untuk iuran yang lewat masa berlaku.
5. **Perubahan data lama yang hanya terukur setelah ada data.** Target cakupan di `§tautan` T.5 dan `§dampak` D.6 adalah perkiraan perancang [U]; `batas_atas` mengoreksi target yang mustahil. Pemilik berwenang menetapkan ulang.
6. **Bobot `§kesiapan` S.2 dan peta fitur `§tier` R.3 adalah [U]** dan berstatus Hipotesis (C-16). Bobot dan peta tidak boleh dipakai untuk keputusan eksternal (peluncuran C-01) sebelum disetujui.
7. **Angka 607.** TIKET JM-S05 hanya menyebut 548 dan 607. Audit menulis 607 sebagai angka di luar 16 diragukan dan 60 tanpa teknologi; `§proyek` P.4 mengikuti audit (tidak mengurangkan lagi). Bila 607 ternyata sudah termasuk keduanya, persamaan rekon harus diubah (hitung ulang dari berkas, bukan dari audit).
