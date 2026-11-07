# Riset: Direktori Jaringan Kebencanaan (repo poskokarhutla) untuk ditiru ke METI

Dipetakan 7 Nov 2026 dari `/Users/priyankaalfatehan28/Developer/poskokarhutla`. Tidak ada berkas repo yang diubah. Nama berkas, kelas, dan konstanta dikutip dari kode. Catatan: aplikasi ini satu halaman (`/direktori`, berkas `public/akademisi.html`; `/akademisi` dialihkan 301), satu IIFE JS besar tanpa build step, data seluruhnya JSON di R2.

---

## 0. Gambaran satu paragraf

Halaman statis `akademisi.html` + `akademisi.js` (3.961 baris, 668.622 byte, vanilla JS, satu IIFE `(() => {"use strict"; ...})()`) + `akademisi.css` (237.875 byte, 638 kelas `.ak-*`). Data TIDAK di repo/public (repo publik, data pribadi): satu set berkas JSON di R2 (bucket binding `MEDIA`, prefiks `akademisi/`), dilayani Worker (`src/akademisi.js`, 410 baris) hanya setelah sesi staf lolos (`stafOK(env, req, P_AKADEMISI)`). Data dipanen dari sumber publik oleh skrip lokal/GitHub Actions (OpenAlex, SINTA, ORCID, IATI, DJPK, e-Katalog LKPP, OAI-PMH kampus, RSS berita, dsb.), digabung & dihubungkan oleh `hubung.mjs` menjadi `graf.json` (simpul + sisi), lalu diunggah ke R2. Layar membangun semua tampilan di klien dari JSON itu (peta MapLibre, grafik SVG buatan sendiri, ekspor Excel/Word/PDF lewat pustaka CDN ber-SRI).

---

## 1. Daftar TAMPILAN / tab / menu

### 1.1 Kepala halaman (`akademisi.html`)
- `header.top` (navy gradien, fixed, tinggi `--top:58px`): burger `#burger` (`.iconbtn`, hanya sempit), logo `/img/logo.svg`, menu bencana `details.bencana` (digambar `/inti/kepala.js` dari `/bencana.json`), `nav.tabs#akTampil` (tab utama, digambar JS), tombol tema `#tema` (`.iconbtn`, simpan `localStorage "pk-tema"`).
- `section.ak-kepala` (latar navy dengan pola SVG kontur `stroke-opacity .07`): `h1` "Direktori Jaringan Kebencanaan" (`clamp(30px,4.2vw,44px)`, `--display` 800, putih); kotak cari global `#akCari` (`.ak-cari-besar`, placeholder "Cari orang, lembaga, kampus, inovasi, dokumen, wilayah…", kunci `/` untuk fokus `<kbd class="ak-kbd">`), panel hasil `#akCariPanel.ak-cr`; ringkasan angka `#akAngka.ak-ringkas.enam.tujuh` (kartu ikon + angka besar + label, tiap kartu `role=button data-go=<tab>` yang membuka tab itu); `nav#akSubTab.ak-seg.ak-subtab` (sub-tab) dan `#akPkSeg` (segmen Akademisi / Tokoh publik).
- `section.ak-bpanel` + `#akBencana.ak-chip.ak-bencana`: panel chip bencana multi-pilih (lihat 1.4).
- `#akDummy.ak-dummy`: dua tombol ikon (`data-dummy="isi"` tabung uji, `data-dummy="hapus"` sapu) + `#akDummyPesan role=status`. Hanya Super Admin (cek `GET /api/akademisi/saya` -> `super`). Isi data contoh per halaman lewat `dataContoh()` (lihat 2.9).
- `#akMasuk.ak-panel.ak-kosong`: layar "Masuk untuk membuka direktori" bila 401, tautan `/admin/masuk?ke=/direktori`.
- `#akLembar.ak-lembar` (modal pakar, `.ak-dlg`, `#akDIsi`), `#akSheet.ak-sheet` (lembar detail umum, `#akSIsi`), `#akDpBar.ak-dpbar` (bilah Daftar Pendek, fixed bawah), `#akTip.ak-gr-tip` (tooltip grafik).

### 1.2 Tab utama (`TABS`, 9 tab, `VIEW`/`TAB_LABEL`)
`const TABS = ["pakar","lembaga","wilayah","inovasi","riset","sistem_data","pendanaan","donasi","pustaka"]`. URL `?tampil=<tab>&sub=<sub>`, disimpan `localStorage TAMPIL_KEY`. `LAMA` memetakan alamat lama (berita, riset, kejadian, pusat, aset, buku, dokumen, relasi, tokoh) ke tab+sub baru. Tab sebagian digambar lambat lewat `MUAT[view] = [nama berkas data, bangun(), sah(d)]` + `bukaView()`. Tab disembunyikan pemilik tapi kode tetap ada: Jurnal (`bangunJur`), Pengadaan kajian (`bangunPeng`), dibiarkan sebagai komentar "pulihkan".

| Tab (`data-t`) | Isi | Sub-tampilan / filter / urutan |
| --- | --- | --- |
| **pakar** "Pakar" (`#akIsi`, `section.ak-saring`) | Direktori akademisi (+ tokoh publik di segmen `#akPkSeg`). Kartu per orang, paginasi `PER_HAL = 24`, `#akHal`. | Cari `#akQ` ("Cari nama, kampus, atau topik riset"); toggle "Pakar baru bulan ini" `#akBaruTog` (`st.baru`, data `baru`); pilih provinsi multi `#akVBtn` (popup `.ak-kpop`, `role=listbox aria-multiselectable`); pilih kampus/lembaga multi `#akKBtn` (segmen `#akKJenis`: "Universitas dan kampus" `data-j=k` / "Lembaga" `data-j=l`); pilih program studi `#akPBtn`; slot bidang `#akBdSlot`; segmen Sumber `#akS` (Semua / SINTA / ...); segmen Urutkan `#akU` (`data-v` 4 h-index, 5 Karya, 6 Sitasi); `st = {q, prov:Set, kampus:Set, prodi, sumber, urut:4, rumpun:Set, bidang, hal, kJenis:"k", baru}`. Empty state `#akHampa` + tombol `#akReset` "Hapus semua saringan". Daftar pendek (shortlist) per kartu. |
| **lembaga** "Lembaga" | Lembaga/organisasi jaringan (BPBD, PMI, LAZ, ormas, internasional, dunia usaha, profesi, dsb.) | `segHtml("akLS")`: **Peta** (`#akLbPeta`, MapLibre + sidebar `.ak-side` + legenda lapisan) / **Daftar** (`#akLbDaftar`) / Analisa (`#akLbAnalisa`, `bangunAnalisa`/`renderAnalisa`) / Proyek (`#akLbProyek`, dialihkan ke tab pendanaan). Chip kategori `KAT` (15, lihat 2.2), skala, bidang, rumpun, "Izin dan integritas". Lembar rinci `bukaLb()`/`bukaDrawer()` (`.ak-drawer`). Cari di peta `pasangCariPeta()` (`indeksSaran/cariSaran`). |
| **wilayah** "Wilayah" | Rapor satu provinsi/kab-kota: pilih `htmlPilih("akWlP")` ("Cari kab/kota atau provinsi"), `?wilayah=<kode>`; tanpa pilihan: `awalWil()` (peta kuadran kesenjangan `petaKesenjangan`, peringkat). Dengan pilihan: `renderWil()` | Kartu: lembaga di tiap kab/kota, fiskal (BTT/APBD), fasilitas kritis, jalan/jembatan, SPAB/Destana, "Kondisi terkini" (`kondisiWil`: prediksi besok, titik24, MAGMA, status darurat), skor kesiapan (`kesiapanWil`, `dayaWil`, label **Hipotesis**), uji skor `ujiKs`, PDF wilayah `cetakWil`. Panel chip bencana disembunyikan (`ak-sembunyi`). |
| **inovasi** "Inovasi" | Katalog teknologi/inovasi kebencanaan (`bangunInovasi`, peta `petaIn` `#akInMap`) | Klik batang "Per rumpun", per status, per jenis teknologi, per kesiapan teknologi (TKT 1-9, `TKT_DESK`), per kategori. Kelas kesiapan "siap dipakai" (bukan "siap beli"). Lembar `sheetSd`-gaya. |
| **riset** "Riset" | 4 sub-tab (`SUBTAB.riset`) | `riset` "Riset daerah" (`bangunRiset`: indeks `indeksRiset`, `saringRiset`, ringkasan AI `ringkasTemuan`, peta `setWilRiset`, lembar `sheetRiset`); `kejadian` "Kejadian besar" (`bangunKej`: 12 kejadian, jejak `jejakHtml`, pelajaran, jejak internasional `jejakIntl`); `pusat` "Pusat studi" (`bangunPs`, `kartuPs`, `sheetPs`); `aset` "Aset riset" (`bangunAset`: drone/radar/lab dst., `bisa_disewa`). |
| **sistem_data** "Sistem data" | Sistem/sumber data milik lembaga lain + cara mengambilnya (`bangunSd`, filter `SD = {rumpun, akses, pemilik, jenis, pakai, q, hal}`, `SDPER = 18`) | Chip akses `AKSES`: terbuka, api-terbuka, api-kunci, login, permohonan, tertutup (warna per jenis). Grafik "Per rumpun/akses/pemilik (sepuluh terbanyak)". Tombol "Bisa langsung diambil, belum dipakai". |
| **pendanaan** "Pendanaan" | `bangunDana`, segmen `akPdS`: **Skema** / **Proyek** / **Negara donor** | `JENIS_DANA` (pinjaman, hibah G2G, hibah multilateral, dana iklim, dana riset, instrumen domestik, asuransi risiko). `PD.fs.jenis` filter, `cocokSkema()` ("Cocok mengajukan" = pencocokan skema ke pakar/kampus), `lembarSkema`, `sheetNegara`, tumpukan pemberi `tumpukPemberi`. |
| **donasi** "Donasi" | `bangunDonasi` dari `donasi_bencana` (intl IFRC, zakat BAZNAS, pemberi, aksi, per provinsi) | Pemberi (`kunci L:/T:`), aksi (bentuk: uang/barang/peralatan), per provinsi. ACT dan kasus KPK dibuang saat panen. |
| **pustaka** "Pustaka" | 4 sub-tab (`SUBTAB.pustaka`) | `buku` "Buku" (`bangunBuku`, sampul dari R2, `sheetBk`); `dok` "Dokumen" (`bangunPustaka`, jenis RPB/KRB/regulasi...); `relasi` "Relasi peraturan" (`bangunRelasi`, katalog `/data/bnpb/hukum/katalog.json`, tidak disaring bencana); `berita` "Berita" (`bangunBerita`, `KAT_BERITA` 11 kategori, filter jenis entitas/media/tanggal `BR`, `BRPER = 15`). |

Segmen kecil di kepala: `#akPkSeg` Akademisi / Tokoh publik (tokoh = `bangunTokoh`, `sheetTk`). Segmen sub-view dipindah JS dari panel ke `.ak-kepala-nav` (`letakBencana()`, atribut `data-hero-view`).

### 1.3 Pencarian global
`pasangCari()` (baris 3799) + `bukaHasilCari()`: panel `#akCariPanel.ak-cr` berkelompok `.ak-cr-g`, "Semua" `.ak-cr-all`; mencari lintas pakar, lembaga, kampus, inovasi, dokumen, wilayah; `nrmCari` normalisasi; pintasan `/`.

### 1.4 Panel chip bencana (aturan pemilik)
`GL = {r:"", set:Set}`, `cocokBencana(pilihan, rumpun)` dari `fungsi_direktori.js` (OR, kosong = semua), URL `?bencana=a,b`, "Semua bencana" mengosongkan. Satu-satunya penentu visibilitas: `BENCANA_VIEW = new Set(["pakar","pustaka","dok","buku","berita"])` di `letakBencana()` (pakar+sub tokoh dan pustaka+relasi dikecualikan). Panel tersembunyi = saringan dilepas (`setBencanaSet([])`). **Titik ganti METI: `RUMPUN`, `BENCANA_VIEW`, `ALIAS` di fungsi_direktori.js (`wabah` -> `kesehatan bencana`), teks "Semua bencana".**

### 1.5 Daftar pendek pakar (shortlist), `#akDpBar`
Bilah fixed bawah (`.ak-dpbar`): jumlah `#akDpN`, "Lihat" (`data-dpa=lihat`, `lihatDp`, `daftarDp`), "Kosongkan", "Unduh" (menu `#akDpMenu`: input "Keperluan (opsional)" `#akDpPerlu` maks 120, lalu `data-dpf` xlsx / docx / pdf), Salin surel (`data-dpa=salin`, `navigator.clipboard.writeText(em.join("; "))`). Simpan `localStorage DP_KEY "ak-dp"`, `PERLU_KEY "ak-dp-perlu"`; versi untuk lembaga `DPL_KEY` (`dplUbah/daftarDpl/lihatDpl/dataDpl`). Ekspor: `xlsx(L)` (SheetJS 0.18.5), `docx(L)` (docx 8.5.0), `pdf(L)` (jsPDF 2.5.1 + autotable 3.8.2), semua via `LIB[...] = [url, cek, sha384]` + `muat()` (pemuat skrip CDN ber-SRI). Selain itu `cetakDp()`/`cetakHalaman(html)` (cetak lewat iframe, band navy meniru `pangantara/lib/pdf/kit.ts`: gradien navy, garis aksen 2 px, kepala kolom navy rata tengah berulang, zebra, "Hal n dari m"), `cetakBpbd`, `cetakWil`, `cetakDpl`.

---

## 2. JENIS ENTITAS dan field (nama persis dari kode)

Semua berkas berada di R2 `akademisi/<nama>.json`. Daftar bernama yang boleh dilayani: `DATA_AKADEMISI` (src/akademisi.js baris 203, 51 nama): riset, logo_pemilik, bpbd_kapasitas, kejadian, kolaborasi, jurnal, pusat_studi, pengadaan, baru, lembaga, lembaga_3w, aset_riset, sensor, inovasi, sistem_data, tokoh, dokumen, berita, pendanaan, negara_donor, afiliasi, buku, penyedia, kalender, pelatih, respons_internasional, media, graf, pemutakhiran, donatur_kejadian, csr, ahli_asing, redaksi, strategis, alumni, kalaksa, hibah_riset, penghargaan, diaspora, peneliti_muda, prodi_beasiswa, foto_pakar, wilayah_daya, lembaga_ekstra, pakar_ekstra, kejadian_ekstra, tesis, donasi_bencana, temuan_riset, kode_terbuka. Berkas khusus (rute sendiri): `induk.json` (pakar), `kampus.json`, `kontak.json`, `sinta/<id%64>.json`, `gambar/<hash>.<ext>`, `ringkasan/<rumpun>-<prov>.json`, `koreksi/<tgl>/<uuid>.json`, `baru/YYYY-MM.json`, `panen/`, `cadangan/`.

### 2.1 Pakar / akademisi (`induk.json`; baris = array, bukan objek)
Dokumentasi di kepala `akademisi.js`: `[id, nama, kampus, [rumpun], h, karya, sitasi, orcid, [topik], foto, idSinta, prodi, subjek, status, logo]` (indeks 0-14; kolom ke-16 = penanda `"diaspora"` atau `"asing"`, ditulis `perbarui.py`). `status`: `s` terdaftar SINTA, `x` tidak ada, `""` belum dicek. `id` = id penulis OpenAlex (`A\d{4,12}`). `METRIK = [[4,"h-index","Pengaruh riset"],[5,"Karya","Publikasi ilmiah"],[6,"Sitasi","Dikutip peneliti lain"]]`. Pakar tambahan non-OpenAlex: `pakar_ekstra.json` (paten, `extraPakar()`), tokoh yang sama digabung (2.7).
- Profil lembar pakar (kartu `.ak-dbagian`, judul `<h3>`): Ringkasan, Rekam jejak per tahun (grafik tahunan karya+sitasi, dari `tahunan` `[tahun, karya, sitasi]`), Topik riset utama, Bidang menurut SINTA, Metrik publikasi menurut SINTA (rinci SINTA: berkuartil Q1-Q4, h-index Scopus/GScholar, skor; `rinciSinta`), Karya ilmiah (dari `/api/akademisi/karya/:id`, urut sitasi/terbaru, jenis jurnal/prosiding/buku, cari judul, halaman 1-50, 8 per halaman), Artikel Scopus terbaru, Analisa keahlian dari karya (`keahlian()`, hitung topik/kata kunci dari 200 karya OpenAlex di klien), Sering menulis bersama (kolaborator), Pendidikan dan riwayat jabatan (ORCID, `ringkasOrcid`), Profil di luar (ORCID, SINTA, Scholar, Scopus, medsos), Afiliasi lain, Kiprah kebencanaan, Berita terkait, Riset wilayah, Paten, Riwayat dengan BNPB (2.8), "Terhubung" (graf), tombol "Koreksi data" (hak koreksi).
- Kontak: dari `kontak.json` (laman resmi kampus): surel/telepon, `emailDari(o)?.list`.

### 2.2 Lembaga (`lembaga.json`, objek per lembaga)
Field (dari `dataContoh()`, `lembaga_gabung.mjs`): `id, nama, singkatan, alias[], badan_hukum, kategori, sub, skala, prov, kab, lat, lon, lokasi_sumber, alamat, bidang[], rumpun[], web, telepon[], email[], wa[], linkedin, medsos{instagram,youtube,x,facebook,tiktok}, pimpinan{nama,jabatan,sumber_url}, mitra_bnpb{bukti,tahun,sumber_url}, izin{jenis,nomor,berlaku_sampai,status,sumber_url}, induk (id lembaga induk, cabang), sensor[{jenis,jumlah,cakupan,data_terbuka,portal_url,sumber_url}], inovasi_produk[{nama,uraian,rumpun,tahun,sumber_url}], potensi_bantuan[{teks,kejadian,tahun,sumber_url}], sumber[{butir,url,diperiksa}], diperiksa, logo, dummy`.
- `KATEGORI` (15): pemerintah, kerelawanan, tanggap-ormas, donasi, jejaring, internasional, mitra-internasional, keagamaan, dunia-usaha, komunikasi, profesi, kesehatan, riset, inovasi, lsm. Label+ikon+warna di `KAT` (mis. `pemerintah: ["Pemerintah", IK_GEDUNG, "#1c7ed6"]`, `kerelawanan "#d6336c"`, `donasi "#2b8a3e"`, `jejaring "#5f3dc4"`, `internasional "#0b7285"`, `keagamaan "#8d5524"`, `profesi "#862e9c"`, `kesehatan "#e03131"`).
- `SKALA`: nasional, provinsi, kabkota, internasional. `BIDANG` (di lembaga_gabung.mjs): tanggap darurat, SAR, logistik, kesehatan, psikososial, air dan sanitasi, pendanaan, pangan, hunian, perlindungan, komunikasi, data dan pemetaan, riset, PRB dan kesiapsiagaan, lingkungan.
- Pembersihan: `bersihkan(x)`, `telp(x)`, `urlAman(v)` (tolak `"'<>` spasi), keyakinan `yakin(l)` (umur `diperiksa`), `gabung(daftar, bpbd)` (dedup antar sumber). Tab "Izin dan integritas": status izin LAZ/PUB, AHU, blacklist LKPP (`daftarHitamCocok`).
- Turunan: `lembaga_3w` (proyek donor: `id, judul, donor, pelaksana, sektor[], prov[], nilai_usd, mulai, selesai, status, sumber_url`), `lembaga_ekstra`, `bpbd_kapasitas`, `kalaksa` (kepala), `penyedia` (vendor e-Katalog), `pelatih`, `respons_internasional` (EMT/USAR/INSARAG).
- Profil lembaga (`bukaLb`): kontak, bidang, peta mini, "Pimpinan", "Mitra BNPB", izin, anggota/pakar yang bekerja di sana, cabang, proyek mitra (`pendanaan` + `lembaga_3w` yang `lembaga_id` cocok), jurnal terbitan (`jurnalLembaga`), inovasi, sensor, "Terhubung", "Sejenis".

### 2.3 Kampus (`kampus.json`, objek berkunci nama kampus)
Field: `prov` (kode BPS), `kota`, `lat`, `lon`, `logo`, `alias[]`, `web`; `perK` indeks pakar per kampus. Profil kampus (`profilKampus`/`bukaKampus`): Identitas kampus, daftar pakar (urut h-index/karya/sitasi `URUT_PK`, cari `#akKpN`), Unit kajian (pusat studi), jurnal (`jurnalKampus`), tesis (`tesis`, 4.791 dari 17 kampus), calon pakar GARUDA, Terhubung.

### 2.4 Tokoh publik (`tokoh.json`)
`id, nama, peran, jenis ("pejabat","tokoh masyarakat",...), lembaga, rumpun[], prov, kiprah[{teks,tahun,sumber_url}], medsos_resmi{}, web, wikidata, pakar_id (diisi hubung.mjs bila orang sama), sumber[{butir,url}], diperiksa, dummy`. Lembar `sheetTk`, daftar `gambarTk`.

### 2.5 Inovasi (`inovasi.json`)
`id, nama, ringkasan, jenis ("sensor","model/AI","drone","sistem informasi","alat",...), rumpun[], pembuat[{nama,lembaga_id,jenis}], tahun, status ("terpasang","uji lapangan","dikomersialkan","purwarupa","berhenti"), penerapan[{lokasi,prov,lat,lon,tahun,sumber_url}], mitra[], paten[{nomor,sumber_url}], TKT (rubrik 1-9 `TKT_DESK`, perkiraan dari bukti publik), sumber_url`. Berkas `inovasi_tkt.json` (30 Okt) ditempel di `inovasi`.

### 2.6 Sistem data (`sistem_data.json`)
`id, nama, kepanjangan, pemilik, lembaga_id, uraian, jenis_data[], sensor[], rumpun[], cakupan, rentang, frekuensi, akses (terbuka|api-terbuka|api-kunci|login|permohonan|tertutup), format[], lisensi, portal_url, api_url, pakai (apakah sudah dipakai sistem sendiri), diperiksa, dummy`.

### 2.7 Entitas lain
- **Pendanaan** (`pendanaan.json`): `id, jenis_entri ("skema"|"proyek"), nama, pemberi, lembaga_id, jenis (JENIS_DANA), sasaran[] ("pemerintah pusat","pemda","kampus",...), nilai, mata_uang, nilai_usd, tahun, selesai, status, penerima, pelaksana[], prov[], rumpun[], syarat, cara, tenggat, kontak{email[],telepon}`. Proyek donor internasional (WB/ADB/JICA/IATI via d-portal) digabung dengan dedupe.
- **Kejadian** (`kejadian.json` + `kejadian_ekstra` + `kejadian_jejak` hasil `gabung_jejak.js`): 12 kejadian besar; kronologi, dampak, respons, dokumen, riset, pelajaran (berhasil / kurang / strategi dengan pil "Analisis"), tim pakar (`timPakar()` ukuran 8), jejak internasional (GDACS, Sentinel Asia `sentinelAsia`, CEMS `satelitCems`, ReliefWeb/HDX, OCHA FTS).
- **Riset** (`riset.json`), `temuan_riset` (`id, doi, judul, tahun, temuan, pilar[], jenis[], angka[{besaran,nilai,satuan,jenis}], teknologi, rekomendasi, kualitas, pakar[]`; indeks `prov{}`, `kab{}`, `kejadian{}`), `hibah_riset`, `peneliti_muda`, `penghargaan`, `alumni`, `diaspora`, `ahli_asing`, `prodi_beasiswa`.
- **Dokumen** (`dokumen.json`: `id, judul, jenis (RPB|KRB|regulasi...), tahun, rumpun[], wilayah[{prov,kab}], url, sumber_url`), **Buku** (`buku.json`, sampul `akademisi/gambar/<hash>`), **Jurnal** (`jurnal.json`, penerbit = kampus/lembaga), **Berita** (`berita.json`: `id, judul, tanggal, media, url, ringkas, kategori, entitas[{jenis,id}], rumpun[]`).
- **Aset riset** (`aset_riset.json`: `id, nama, jenis, pemilik, unit, prov, kota, layanan, bisa_disewa, kontak{email,telepon}, web, sumber_url, diperiksa`), **Sensor** (`sensor.json`: `id, nama, jenis, pemilik, jaringan, lat, lon, status`), **Pusat studi** (`pusat_studi.json`).
- **Wilayah** (`wilayah_daya.json`, dibangun `wilayahDaya(P)`): per kab/prov fiskal (BTT per jiwa, anggaran vs realisasi dipisah), fasilitas kritis, jalan/jembatan, SPAB/Destana, indeks desa, SPM, IRBI, kebutuhan (BPS), `kesiapan{skor,kuadran,uji}`. Nama kab dinormalkan `kunciKab()`.
- **Orang yang sama**: tokoh yang juga pakar = SATU profil. `hubung.mjs` baris 127-133: `t.pakar_id = t.pakar_id || pakarNama.get(gelar(t.nama)) || pakarInisial.get(inisial(gelar(t.nama)))` lalu `tepi("T:"+t.id, "P:"+pid, "orang yang sama")`. Pakar OpenAlex yang terpecah (mis. non-akademisi tanpa afiliasi) digabung dengan nama persis.

### 2.8 Riwayat dengan BNPB (satu-satunya data D1 tulis oleh staf)
Tabel `akademisi_riwayat` (migrasi 0087): `id INTEGER PK, jenis_target ('pakar'|'tokoh'|'lembaga'), target_id (1-80), jenis ('undangan','narasumber','kontrak','penugasan','lapangan','lainnya'), tanggal (YYYY-MM-DD GLOB), tanggal_selesai, judul (1-200), kejadian_id, catatan (<=2000), penilaian (1-5), oleh, oleh_nama, dibuat, diubah`; indeks `akademisi_riwayat_target(jenis_target,target_id)` dan `_kejadian(kejadian_id)`. Rute: `GET/POST /api/akademisi/riwayat`, `PATCH/DELETE /api/akademisi/riwayat/:id` (semua staf berperan boleh tulis; ubah/hapus hanya penulis atau admin; `milik` dihitung server; `oleh` mentah tidak dikirim). Kolom `oleh` memuat "staf:<id>" atau hash admin.

### 2.9 Data contoh (tombol dummy)
`dataContoh()` (baris 2035) menyusun lembaga (22), lembaga_3w (5), aset_riset (5), sensor (8), inovasi (5), sistem_data (6 akses), tokoh (2), dokumen, berita (4), pendanaan (5), donasi_bencana, temuan_riset; semua berakhiran " (contoh)", `dummy: true`, domain `example.org`. Peta tab -> berkas: `NAMA_DUMMY`. `dummyIsi()/dummyHapus()/dummyMuat()/pasangDummyAk()`; tombol hanya tampil bagi `super`. Gerbang repo: `tests/e2e/05-dummy-jejak.sql`, `gerbang-dummy` (aturan global DUMMY.md).

---

## 3. Profil per entitas, tautan silang, graf jaringan

- **Bentuk profil**: lembar modal/sheet (`bukaSheet(jenis, htmlKepala, isiFn)`, `bukaDrawer`, `#akLembar` untuk pakar, `#akSheet` umum, `.ak-dlg` dialog, `.ak-dkepala` + `.ak-dk-atas` kepala dengan avatar/logo `lgoIkon()`, nama `.ak-nama`, subjudul). Tiap bagian = kartu `section.ak-dbagian > .ak-disi > h3` (aturan pemilik, lihat 8.7). Tombol tutup `.ak-x data-tutup`, Esc menutup, deep link `?tampil=...&wilayah=...`.
- **Bagian "Terhubung"** (`htmlTerhubung(key)`, `terhubungDi(key)`, `judulTerh(rel,out,nb)`, `barisNode(id,v)`): tiap simpul grafik menampilkan semua tetangga dikelompokkan per relasi (`ANGGOTA_RE` mengelompokkan anggota/pengurus/ketua/tim ahli/editor), baris ringkas (avatar 40 px, nama, satu baris meta abu, maks 2 pil ikon). Klik baris membuka profil tetangga (`bukaProfilSaran`/`sheetG(gid)` untuk organisasi tanpa profil sendiri). Juga "Sejenis".
- **Graf (data)**: `akademisi/graf.json` = `{simpul: {<id>: {j, n, logo?}}, sisi: [[a, b, relasi, sumber?], ...]}`. Awalan id: `P:` pakar (id OpenAlex), `T:` tokoh, `L:` lembaga, `K:<nama>` kampus, `G:` organisasi (dari afiliasi/keanggotaan), `D:` pendanaan, `J:` proyek 3W, `N:` paten, dst. `JENIS_NODE = {pakar, lembaga, organisasi, buku, kampus, proyek, dokumen, inovasi, sistem, dana, jurnal, aset, tokoh, paten}`. Relasi (teks bebas): "bekerja di", "anggota", "pengurus", "ketua", "penasihat", "tim ahli", "berperan di", "kepala pelaksana", "lainnya", "mendanai", "memberi", "memiliki", "membuat", "menerbitkan", "cabang dari", "orang yang sama", "muncul bersama di berita", "dewan redaksi", "editor". Klien: `siapGraf()` memuat dan membangun `adj` (Map id -> [{to, rel, src, out}]) dua arah.
- **Tidak ada visualisasi graf jaringan force-directed**: "graf jaringan" di UI = daftar tautan `Terhubung`, grafik batang/area/tumpuk SVG buatan sendiri (`ak-gr-*`, `batang()`, `gambarPj`, `reStk`, `gambarLb`, `gambarPin`) dan peta MapLibre; tidak memakai d3/vis/cytoscape.
- **Pembangun graf**: `scripts/akademisi/hubung.mjs` (`hubung(D)`): indeks nama `indeks(entitas)` (kunci `norm(nama)`, `inti(nama)` tanpa kata umum BUANG, singkatan 3+ huruf, alias, `badan_hukum`), `cari(peta, nama, akar)` (cocok ketat; kunci ambigu tidak ditautkan; pilih akar bila ambigu; fallback nama terpanjang >= 12 huruf termuat utuh), `ALIAS` (~100 alias Inggris -> nama resmi). Keluaran: `graf.json` + salinan berkas dengan `*_id` terisi (`lembaga_id`, `pembuat[].lembaga_id`, `pakar_id`).
- **Partner strategis** (`strategis(g, D)`, keluar `strategis.json`): skor transparan per organisasi dari komponen `{orang, dana, aset, cabang, jejak, jangkau:Set, proyek}`; bintang di UI (`ak-bintang`, `?strat=`). Pengecualian: regex `DIRI = /^badan nasional penanggulangan bencana\b|\bbnpb\b|^badan penanggulangan bencana\b|\bbpbd\b|\bbpba\b/i` tidak pernah diberi bintang (BNPB/BPBD = "kita").

---

## 4. Sumber data dan pipeline panen

### 4.1 Sumber
OpenAlex (tulang punggung pakar; kunci `OPENALEX_KEY`; karya/sitasi/topik/afiliasi), SINTA (foto, nama resmi kampus, prodi, metrik; dipanen lewat Chrome nyata + in-page fetch jeda 1,5 dtk, 1.793 profil, 64 pecahan R2), ORCID publik (bio, pendidikan, riwayat jabatan), PDDikti (reCAPTCHA, TIDAK dipanen massal; jabatan/pendidikan hanya dari ORCID), Google Scholar (tautan), situs resmi lembaga/kampus (kontak, logo), BNPB GIS, SIMZAT Kemenag, IATI + d-portal (proyek donor), DJPK SIKD (APBD, BTT), e-Katalog LKPP (+ daftar hitam), Dana Desa, OCHA FTS, BAZNAS/LAZ Kemenag, AHU, BNSP, Basarnas, WHO EMT/INSARAG, DJKI (paten), BIMA/RIIM/Kedaireka (hibah), GARUDA (jurnal/penulis), Zenodo/Mendeley/GitHub (kode terbuka), InaRISK IRBI, GDACS, CEMS, Sentinel Asia, BPS (indeks desa, P0/air/sanitasi/IPM), IKP Bapanas, SIMAS (masjid), OSM (damkar/helipad), repositori kampus (OAI-PMH tesis), RSS media (berita), Wikidata/ROR (ID silang), UKRI, Wikipedia (jejak kejadian, ditandai belum terverifikasi).
### 4.2 Skrip (`scripts/akademisi/`, dijalankan lokal/Actions; data TIDAK masuk repo)
- `perbarui.py` (11,9 KB): pembaruan bulanan induk pakar: (a) segarkan h-index/karya/sitasi/topik dari OpenAlex per id (batch 100), kolom SINTA/diaspora tidak disentuh, id hilang tidak dibuang; (b) pakar baru = penulis OpenAlex `last_known_institutions.country_code:ID`, karya >= 3, punya topik di DAFTAR TOPIK BENCANA; rumpun baru = rumpun mayoritas per topik; (c) kolom 16 `asing()` dari `affiliations.years`; kandidat diurut sitasi, `--maks-kandidat 30000`, `--dry-run`. Unggah ke R2 + cadangan `akademisi/cadangan/induk-<tgl>.json`, `akademisi/baru/YYYY-MM.json`. Uji: `uji_perbarui.py`. Workflow: `.github/workflows/akademisi.yml` (cron `0 20 1 * *`).
- `hubung.mjs` (28,3 KB): graf + `*_id` + strategis (3).
- `sambung_panen.mjs` (81,1 KB): menyambung 13+ dataset panen ke berkas R2: `wilayahDaya`, `lembagaEkstra`, `pakarEkstra` (paten + ORCID), `timPakar`, `danaResmi`, `ringkasBantuanProv`, `donasiBencana` (membuang ACT dan judul `\bkpk\b|korupsi`, aksi ganda 7 hari disatukan), `kejadianEkstra`, `lembagaBaru`, `hibahBaru`, `radarSkema`, `kesiapanDaerah` (persentil BTT/jiwa, faskes, lembaga, pakar; kesenjangan lawan risiko; kuadran) + `ujiKesiapan` (uji balik vs DIBI, hasil jujur "tidak lulus" r -0,02, layar berlabel Hipotesis), `temuanRiset`, `tesisKampus`, `daftarHitamCocok`, `sentinelAsia`, `hibahUkri`, `proyekBaru`, `satelitCems`. Pemakaian: `node scripts/akademisi/sambung_panen.mjs <panen> <r2 kini> <keluar>` lalu `hubung.mjs`. Aturan: SELALU unduh R2 segar sebelum re-merge (pernah menimpa).
- `lembaga_gabung.mjs` (13,9 KB): normalisasi + dedup lembaga (`KATEGORI`, `SKALA`, `BIDANG`, `RUMPUN`, `PROV`, `JKT_KOTA`, `urlAman`, `telp`, `bersihkan`, `yakin`, `gabung`).
- `pemutakhiran/` (dipicu `direktori-bulanan.yml`, cron `0 1 3 * *`, ada `dry_run`): `mutakhir.py` (segar semua), `berita_rss.py` (17,8 KB; RSS penerbit tanpa secret; saringan ketat: KPK/korupsi membuang SELURUH berita, dunia usaha butuh kata kebencanaan di judul, tokoh butuh konteks), `berita.py`, `panen_publik.py`, `panen_proyek.py`, `panen_sentinel.py`, `panen_tesis.py`, `rayap.py` (crawler), `inti.py`, `jaga_unggah.mjs` (penjaga sebelum unggah: tolak berkas susut/rusak), `uji_inti.py`. Langkah workflow: uji logika -> unduh R2 -> mutakhirkan -> panen berita -> panen ulang+sambung+graf -> unggah hasil+cadangan+laporan (`pemutakhiran.json`, `GET /api/akademisi/data/pemutakhiran`).
- Panen berat lain (di luar repo): `~/direktori-panen/<tgl>/` (ATURAN.md + skrip), pemanen SINTA/PDDikti/tokoh memakai browser nyata. Lokal terjadwal `radar-dana-direktori` (Senin 07:00).
### 4.3 Skor dan peringkat
Pakar: urut h-index (default), karya, sitasi (`URUT_PK`, `st.urut`). Partner strategis: `strategis()`. Kesiapan daerah: `kesiapanDaerah`. Peringkat wilayah `peringkat()`, `kuantil()`. Kecocokan skema pendanaan ke pakar: `cocokSkema()`. TKT inovasi: rubrik 1-9. Keyakinan lembaga: `yakin(l)`.
### 4.4 Aturan pengecualian (dijaga di data, bukan kode layar)
Orang terkait kasus KPK (tersangka/saksi OTT/disebut), eks kepala BNPB tertentu (Suharyanto), orang meninggal, ACT (izin PUB dicabut 2022), vendor terkait kasus (PT Trans Lintas Selaras), serta nama lain yang diminta pemilik (daftar privat, tidak di repo). Diterapkan manual saat panen/unggah (`tokoh.json`, `graf`), plus filter otomatis berita (`berita_rss.py`) dan donasi (`DONASI_ACT`, `DONASI_KORUPSI`). Tidak ada daftar tolak terpusat di kode: sebaiknya METI membuat satu berkas `daftar-tolak` + uji.

---

## 5. Arsitektur

### 5.1 Worker (`src/akademisi.js`, `RUTE_AKADEMISI`, didaftarkan di `src/worker.js` baris 54 dan 622: `...RUTE_AKADEMISI`)
Semua rute dijaga `stafOK(env, req, P_AKADEMISI)`: admin (token / akun gerbang / sesi admin) ATAU sesi staf (cookie `sesi_staf`, hanya hash di D1) berperan salah satu `P_AKADEMISI = ["verifikator","pusdalops","analis_konsesi","udara","tmc","koordalops","pimpinan","kemitraan","direktori"]` (`direktori` = peran yang HANYA membuka Direktori; `operator_cc` sengaja tidak ada). Tulis lewat sesi staf wajib header `x-pb: 1`. Galat 401 "masuk sebagai staf BNPB atau admin".

| Metode + path | Fungsi | Sumber/keluaran | Cache |
| --- | --- | --- | --- |
| `GET /api/akademisi` | `induk` | R2 `akademisi/induk.json` | `private, no-store`, header `x-diperbarui` |
| `GET /api/akademisi/kampus`, `/kontak` | `berkas` | R2 `akademisi/kampus.json`, `kontak.json` | no-store |
| `GET /api/akademisi/data/<nama>` (51 nama, satu rute per nama) | `dataBaca` | R2 `akademisi/<nama>.json`; `baru` = berkas `akademisi/baru/YYYY-MM.json` terbaru (list prefix, urut leksikal) | no-store |
| `GET /api/akademisi/karya/:id` (id `A\d{4,12}`) | `karya` | OpenAlex works + authors (+ ORCID bila `?orcid=`), `?hal=1..50 &urut=sitasi\|terbaru &jenis=jurnal\|prosiding\|buku &cari=<=80` | cache tepi 1 hari (`cacheTepi`), sesi dicek DULU |
| `GET /api/akademisi/riset/:id` (id `W\d{4,12}`) | `riset` | OpenAlex work (abstrak dirakit dari indeks terbalik `rakitAbstrak`) + Workers AI `@cf/meta/llama-3.3-70b-instruct-fp8-fast` (ringkasan/penjelasan/kesimpulan HANYA dari judul+abstrak, skema JSON `SKEMA_RISET`); 60/staf/jam (`laju`) | cache tepi 30 hari; AI gagal = tidak dicache 30 hari |
| `GET /api/akademisi/sinta/:id` | `sinta` | R2 `akademisi/sinta/<id % 64>.json` (`PECAHAN = 64`) | `private, max-age=3600` |
| `GET /api/akademisi/gambar/:id` | `gambar` | R2 `akademisi/gambar/<16-64 hex>.<png/jpg/jpeg/gif/webp/ico/svg>` | `private, max-age=604800, immutable` |
| `GET /api/akademisi/terdekat` | `terdekat` | pakar terdekat (haversine) dari `induk`+`kampus`+`kontak` (cache isolate `TTL = 600000`) | no-store |
| `GET /api/akademisi/lembaga/terdekat` | `lembagaTerdekat` | `lembaga.json`, `?lat&lon&kategori&sub&n` (kategori dari `KATEGORI_LEMBAGA`) | no-store |
| `POST /api/akademisi/ringkasan` `{rumpun, prov}` | `ringkasan` | sintesis kebijakan dari abstrak 30 riset teratas (`TOP_RISET = 30`), Workers AI, cache R2 `akademisi/ringkasan/<rumpun>-<prov\|nasional>.json` TTL 30 hari (`TTL_RINGKAS`); `RUMPUN_SAH` 14 nilai; dibatasi `laju()` | no-store |
| `GET /api/akademisi/saya` | `saya` | `{peran: ["admin"]\|s.peran, super: bool}` (`superOK`) | no-store |
| `POST /api/akademisi/koreksi` (hak koreksi) / `GET` (admin) | `koreksiBuat`/`koreksiDaftar` | R2 `akademisi/koreksi/<tgl>/<uuid>.json` `{uuid, jenis, id, butir, isi, sumber_url, oleh, waktu}`; `JENIS_KOREKSI = {pakar,lembaga,inovasi,sistem_data,tokoh,dokumen}` | 201 |
| `GET/POST /api/akademisi/riwayat`, `PATCH/DELETE /api/akademisi/riwayat/:id` | `riwayatDaftar/Buat/UbahHapus` | D1 `akademisi_riwayat`; `RE_KUNCI = /^[a-zA-Z0-9_.:-]{1,80}$/` | no-store |
Pencocok id dinamis di `worker.js` baris 658: regex `oa = jalur.match(/^(\/api\/akademisi\/karya)\/(A\d{4,12})$/) || ... riset/(W..) || sinta/(\d{1,9}) || gambar/([^/]{1,100}) || riwayat/(\d{1,12})` (ini yang mengisi `id` bagi rute `:id`).
### 5.2 Halaman dan penjagaan
- `src/worker.js` baris 700-701: tabel halaman `[/^\/direktori\/?$/, "/akademisi.html", "/direktori"]`; baris 741: `/akademisi` -> 301 `/direktori`+query; baris ~884: halaman kunci: sesi staf berperan `P_AKADEMISI` boleh GET `/direktori`, `operator_cc` melihat semua. Aset statis di `public/`; `run_worker_first: ["/*.html"]`. `noindex`: `<meta name="robots" content="noindex,nofollow">`, `<meta name="referrer" content="no-referrer">`, `theme-color #14284b`.
- Header keamanan: `public/_headers` (CSP ditegakkan 1 Nov 2026; sumber luar harus didaftarkan: cdnjs.cloudflare.com, cdn.jsdelivr.net, fonts.googleapis/gstatic, tiles.openfreemap.org, api.openalex.org, `img-src https:`). Tanpa skrip inline: galat foto lewat listener capture. Gerbang: `tests/agen/gerbang-headers.test.mjs`.
- Versi aset: `scripts/terbit/versi.py` menambah `?v=<hash>` (di html `?v=104` hanya placeholder); gerbang `direktori-versi.test.mjs`.
### 5.3 Penyimpanan
- R2: bucket `poskokarhutla-foto`, binding `MEDIA`, prefiks `akademisi/`; unggah: `npx wrangler r2 object put poskokarhutla-foto/akademisi/induk.json --file ... --remote`.
- D1: `poskowarga`, binding `DB`; tabel yang dipakai direktori: `akademisi_riwayat` (0087), `staf` + sesi staf (0030, dibuat ulang 0085, 0099, 0104 `staf_peran_lengkap` menambah peran `direktori`), tabel batas laju (`laju_bnpb`, via `laju()`), jejak admin (`jejakStmt`).
- Workers AI: binding `AI`; Secrets: `OPENALEX_KEY` (worker secret + `.dev.vars`), `ADMIN_TOKEN`/`AKUN_SITUS` (admin).
- Cache: `cacheTepi(req, ctx, detik, buat, tanpaQuery)` (Cache API tepi, kunci URL sintetis `https://akademisi.karya/<id>?...`), memori per isolat `simpanL`, `TTL 10 menit`.
- Klien: `localStorage` kunci `pk-tema`, `TAMPIL_KEY`, `DP_KEY "ak-dp"`, `PERLU_KEY`, `DPL_KEY`, `LEBAR_KEY` (lebar sidebar peta); URL state `?tampil ?sub ?bencana ?kat ?strat ?wilayah`.
### 5.4 Akses
Hanya staf BNPB + admin (UU PDP, keputusan 28 Okt 2026). Peran `direktori` melihat Direktori saja. Kode klien: `fetch("/api/akademisi")` 401 -> tampil `#akMasuk`. Tautan masuk: `/admin/masuk?ke=/direktori`. Pengelolaan akun: `/api/staf/admin/daftar` (Super Admin).
### 5.5 Workflow GitHub
`.github/workflows/akademisi.yml` (bulanan pakar), `direktori-bulanan.yml` (bulanan seluruh panen), `kemitraan-pakar.yml` (pakar untuk modul Kemitraan, tidak perlu ditiru). Secret Actions: `OPENALEX_KEY`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.

---

## 6. Design system

### 6.1 Token (`public/inti/tema.css`, 2.232 B; dipasang SEBELUM gaya.css)
Terang (`:root`): `--paper:oklch(97.6% .006 255)`, `--card:oklch(100% 0 0)`, `--surface:oklch(95.5% .012 255)`, `--ink:oklch(25.5% .075 256)`, `--ink2:oklch(50% .045 258)`, `--line:oklch(90% .015 255)`, `--brand:oklch(25.5% .075 256)`, `--brand2:oklch(42% .11 255)`, `--accent:oklch(68% .09 252)`, `--ok:oklch(62% .16 150)`, `--warn:oklch(76% .16 75)`, `--bad:oklch(57% .21 27)`, `--info:oklch(66% .13 235)`, `--f0:oklch(72% .15 150)`, `--f1:oklch(86% .16 98)`, `--f2:oklch(73% .17 58)` (oranye angka kunci), `--f3:oklch(57% .21 27)`, `--shadow:0 2px 14px oklch(25% .07 256 / .08)`, `--shadow-lg:0 8px 28px oklch(25% .07 256 / .16)`, `--r:16px`, `--r-sm:10px`, `--top:58px`, `--font:"Inter",system-ui,-apple-system,"Segoe UI",sans-serif`, `--display:"Plus Jakarta Sans",var(--font)`, `color-scheme:light`.
Gelap (dua kali: `@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){...}}` dan `:root[data-theme="dark"]{...}`): `--paper:oklch(18% .035 256)`, `--card:oklch(22.5% .045 256)`, `--surface:oklch(26% .05 256)`, `--ink:oklch(94% .012 255)`, `--ink2:oklch(76% .035 255)`, `--line:oklch(33% .05 256)`, `--brand:oklch(64% .12 252)`, `--brand2:oklch(70% .11 250)`, `--accent:oklch(72% .1 252)`, bayangan hitam .35/.5.
Hex yang muncul: navy header `#14284b` (`theme-color`, `lgoIkon` default), warna rumpun/kategori/akses di JS (daftar di 1.2, 2.2, `RUMPUN`: gempa `#e8590c`, tsunami `#0b7285`, gunung api `#c92a2a`, banjir `#1c7ed6`, longsor `#8d5524`, karhutla `#f76707`, hidrometeorologi `#4263eb`, iklim `#e03131`, kekeringan `#b8860b`, pesisir `#1098ad`, geologi `#5f3dc4`, manajemen bencana `#2b8a3e`, kesehatan bencana `#d6336c`, wabah `#7048e8`, penginderaan jauh `#495057`; `AKSES`: `#2b8a3e/#1c7ed6/#0b7285/#b25e00/#862e9c`). Dasar: `body{background:var(--paper);color:var(--ink);font:14.5px/1.5 var(--font);letter-spacing:-.006em}`; `.lbl{10.5px 800 uppercase .08em}`; `.toast`. Font dimuat dari Google Fonts: Inter 400/500/600/700, Plus Jakarta Sans 600/700/800.
### 6.2 Kepala (`inti/kepala.css` 2.822 B, `inti/gaya.css` 5.818 B, `inti/kepala.js` 5.968 B)
- `header.top{position:fixed;inset:0 0 auto 0;height:var(--top);z-index:30;display:flex;align-items:center;gap:12px;padding:0 14px;background:linear-gradient(135deg,oklch(42% .11 255),oklch(25.5% .075 256));color:#fff}`; `.iconbtn{34x34;border-radius:10px;background:oklch(100% 0 0 / .12)}` hover `.22`.
- `nav.tabs` (di gaya.css): rata tengah, `justify-content:safe center`, tombol `border-radius:999px`, `font-size:14.5px` (13.5px < 1500px), aktif `background:oklch(100% 0 0 / .16)` (di akademisi dipakai `aria-pressed`), ikon 16 px; ada aturan 9 tab (ikon disembunyikan 1281-1500px). `.lainnya` = menu "Lainnya" (tidak dipakai direktori).
- `.bencana` (menu bencana): `details/summary`, `.menu` kartu popup `border-radius:14px`, `.bc-segera` pil "Soon", `.bc-pred` tombol Prediksi. `IKON` di kepala.js (karhutla, banjir, gempa, cuaca, pesisir, udara, kekeringan, gunungapi) dari registry `/bencana.json`.
- Burger: `#burger` + kelas `header.top.buka` di layar sempit (JS toggle `aria-expanded`; tab turun jadi panel); `.ak-tabpanah` panah geser tab di <1100px.
### 6.3 Komponen direktori (`akademisi.css`, 237.875 B, 638 kelas `.ak-*`; dipakai `?v=` hash)
- Tata letak: `.ak{max-width:1240px;margin:-64px auto 0;padding:0 20px 64px;display:grid;gap:20px}` (menimpa kepala biru dengan -64px). `.ak-kepala` (navy + pola kontur SVG data-URI, `.ak-kepala-isi` flex tengah, `.ak-kepala-nav`), `.ak-ringkas{display:grid;grid-template-columns:repeat(4,auto);border-top:1px solid oklch(100% 0 0 / .14)}` (varian `.enam`, `.tujuh`): item `div` grid ikon 40 px (`border-radius:12px`, latar putih .1) + angka `b` (`--display` 800, `clamp(22px,2.4vw,30px)`) + label 12.5 px.
- `.ak-panel{background:var(--card);border:1px solid var(--line);border-radius:var(--r);box-shadow:var(--shadow);padding:24px}`.
- Segmen: `.ak-seg{inline-flex;border:1px solid var(--line);border-radius:999px;padding:3px;overflow-x:auto}`, `button` 13.5 px 600 `min-height:36px`, aktif `background:var(--brand);color:#fff`, `.ak-seg-lbl` (11 px uppercase). Aturan pemilik: semua deretan pilihan selebar penuh, dibagi rata, tiap tombol berikon (gerbang `direktori-seg.test.mjs`, kelas `.ak-urut` termasuk).
- Chip: `.ak-chip{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:8px}`, `button` pil `min-height:36px`, aktif `--brand`, hitungan `span` (11 px, `--surface`).
- Pil rumpun `.ak-r` (+ `.utama`, variabel `--w0` warna), ikon `.ak-ikon` (stroke 24 px, `--w` warna), pencarian `.ak-cari`, `.ak-kbd`, dropdown `.ak-kampus-pilih/.ak-kbtn/.ak-kpop/.ak-kcari/.ak-kdaftar` (multi-pilih, `role=listbox`), `.ak-tog`, `.ak-tbl` (tombol tautan).
- Kartu: `.ak-daftar` (grid kartu pakar), `.ak-foto`, `.ak-nama`, `.ak-metrik` (3 kolom h-index/Karya/Sitasi, `.ak-mlabel`), `.ak-fav` (bintang daftar pendek), `.ak-bintang`, `.ak-pil` (pil info), `.ak-hit` (hitungan kecil di judul).
- Lembar: `.ak-lembar` (overlay), `.ak-latar`, `.ak-dlg`, `.ak-x`, `.ak-sheet`, `.ak-drawer`/`.ak-drtutup`, `.ak-dkepala`, `.ak-dk-atas`, `.ak-dbagian` + `.ak-disi` (kartu bagian), `.ak-dtubuh`, `.ak-dikon`.
- Grafik: `.ak-gr-*` (`gr-dasar`, `gr-garis`, `gr-bantu`, `gr-tip`), `.ak-bars`, `.ak-bartip`, `.ak-garis`, `.ak-evgrid`, `.ak-bkr-*` (batang), `.ak-brk2-*` (kartu berita/kejadian), `.ak-afg`.
- Peta: MapLibre GL 4.7.1 (`https://cdnjs.cloudflare.com/ajax/libs/maplibre-gl/4.7.1/maplibre-gl.min.js` + `.css`, dimuat lambat via `LIB.maplibre`), gaya `https://tiles.openfreemap.org/styles/positron` (terang) / `/dark` (gelap), batas Indonesia `bounds:[[94,-11.5],[141.5,6.5]]`, `minZoom 3`, `maxZoom 16`, `dragRotate:false`. Sidebar peta `.ak-side` (bisa ditarik, `LEBAR_KEY`, `aturLebar()`), `.ak-ptaisi`, `.ak-pta`, `.ak-lbpeta`, legenda lapisan, `terbangKe/terbangKab`, geojson `/geo/provinsi.json`, `/geo/kabupaten/<kode>.json`, lambang `/lambang/kabkota.json`.
- Responsif: ~14 `@media`: `max-width:1100px` (tab berpanah, bpanel), `1000px` (ringkas 2 kolom, `.ak-sdgrid` 2 kolom), `700px` (bilah samping peta jadi lembar bawah `.ak-pta > .ak-side{top:auto;bottom:0}`, ringkas 3 kolom), `600px` (chip bencana flex-wrap). Gerbang uji layar 1280 dan 390 px.
- Mode gelap: semua lewat token + override selektif `:root[data-theme="dark"] .ak-...` (mis. `.ak-kdaftar button[aria-selected="true"]{background:oklch(35% .08 255)}`). Variabel hex tidak dipakai kecuali warna kategori.
- `public/inti/kartu.css` (13,3 KB) TIDAK dimuat halaman ini (itu kartu laporan `.ex.ex-std`), jadi tidak perlu dibawa.

---

## 7. Fitur kecil yang gampang terlewat
1. Pintasan `/` fokus ke pencarian global (`.ak-kbd`); Esc menutup popup/lembar (`keydown` baris 788); Enter/Spasi membuka kartu berfokus (`data-kpt`, `data-ri`, `data-kj`).
2. Kartu ringkasan angka di kepala dapat diklik (`data-go`), `role=button tabindex=0`; angka diisi lambat (`...` lalu angka).
3. Skeleton `hantuHtml` dan `kosongHtml(nama)` (state kosong per tab); `akMuat` pemuat awal.
4. Tombol "Pakar baru bulan ini" + pil "Baru" di kartu (`muatBaru`, berkas `baru`).
5. Daftar pendek: simpan di localStorage, unduh Excel/Word/PDF dengan "Keperluan", salin semua surel, cetak.
6. Hak koreksi: tombol di tiap profil, kirim ke `POST /api/akademisi/koreksi`, admin melihat antrean.
7. Riwayat dengan BNPB (undangan/narasumber/kontrak/penugasan/lapangan + nilai 1-5) per orang/lembaga dan per kejadian.
8. Ringkasan AI: ringkasan riset per karya (Workers AI) dan sintesis kebijakan per rumpun+provinsi (`ringkasTemuan`), cache R2/tepi, batas laju.
9. Peta lembaga dengan pencarian saran, lapisan (sensor, inovasi, proyek), sidebar bisa ditarik, "Terbang ke" kab/prov; lembaga terdekat dari titik (`/lembaga/terdekat`), pakar terdekat.
10. Tanda `Hipotesis` pada skor yang belum lolos uji balik (kesiapan daerah); badge bukti (TKT, "diperiksa <tgl>", sumber di tiap butir `sumber_url`).
11. Filter bencana multi-pilih dengan URL `?bencana=`; deep link `?tampil=&sub=&wilayah=&kat=&strat=`; ingat tab terakhir.
12. Unggah gambar sampul/logo ke R2 (`/gambar/:id`) karena situs sumber memblokir hotlink; `muatGrafLogo/muatLogoPem/muatFotoPakar/muatBFoto/muatLambang`.
13. Segmen sub-view dipindah ke kepala navy (`data-hero-view`), panah geser tab, `scrollIntoView` tab aktif.
14. Escape semua teks luar (`esc`), `LUAR = 'target="_blank" rel="noopener noreferrer"'`, `urlOkLogo`, SRI sha384 pada tiap pustaka CDN.
15. Catatan "Sumber:" bukan lagi di kaki kartu (aturan 3.5 AGENTS: kartu tanpa kaki sumber; definisi masuk `title`) tetapi direktori tetap menautkan sumber per butir.
16. Paginasi `PER_HAL`, `navHal`, `aria-live="polite"`; kotak "Tidak ada pakar yang cocok" + reset.
17. Fungsi murni dapat diuji di Node: `fungsi_direktori.js` (UMD: `tingkatPenerima`, `cocokBencana`, `bacaBencana`, `tulisBencana`, `togglePilihan`; `module.exports` bila `module` ada).
18. Tombol dummy hanya untuk Super Admin dan hanya mengisi klien (`DATA[n] = Promise.resolve(...)`), tidak menulis ke server.

---

## 8. Pelajaran dan ranjau dari memori (koreksi pemilik)
1. **Data pribadi tidak masuk repo/public** (repo publik; PDP). Satu berkas JSON per set di R2; layar hanya lewat Worker bersesi. Jangan buat data contoh asli.
2. **Aturan ke gerbang** (`aturan-ke-gerbang`): tiap koreksi berulang pemilik jadi uji/hook, bukan memori. Gerbang direktori: `direktori-seg`, `direktori-klik`, `direktori-layar`, `direktori-versi`.
3. **Semua terhubung** (30 Okt): setiap data harus saling tertaut dan tampil di dua sisi; orang = SATU profil; dataset baru wajib masuk `hubung.mjs` + uji di `hubung.test.mjs` + bagian "Terhubung" di profil. Pencocokan nama ketat: lebih baik tidak terhubung daripada salah.
4. **Tanpa kasus KPK/hukum** (lihat 4.4): cek tiap panen/pemutakhiran; nama yang sudah dihapus pemilik tidak dipulihkan; mati juga dikeluarkan; ACT/PUB dicabut keluar.
5. **Kita = BNPB**: BNPB dan BPBD/BPBA bukan "mitra strategis", tidak berbintang; teks "jaringan BNPB", bukan "mitra BNPB" untuk BPBD. Untuk METI: padanannya adalah METI sebagai pemilik (anggota METI bukan "mitra eksternal"); ganti regex `DIRI` di `strategis()`.
6. **Panel bencana per tab**: multi-pilih OR, disembunyikan di tab yang tidak disaringnya; satu sumber kebenaran `letakBencana()` + `BENCANA_VIEW`; tab baru: putuskan eksplisit, default tersembunyi.
7. **Deretan pilihan ujung ke ujung**: semua segmen, sub-tab, pil filter, chip ringkasan selebar kontainer, dibagi rata, berikon; berlaku juga toggle kecil di dalam kartu/lembar (`.ak-urut`). Pil status berwarna bermakna (jalan=hijau, selesai=abu, siap=kuning, batal=merah), label Indonesia.
8. **Bagian dalam kartu**: tiap bagian profil/lembar/drawer = kartu sendiri (putih, border 1 px, radius ~14 px, padding, judul kecil huruf kapital di dalam, jarak 12 px); tanpa garis pemisah dengan celah besar; baris orang/lembaga = satu komponen ringkas (avatar 40 px, nama, satu baris meta abu, maks 2 pil ikon 20 px, metrik di kolom sempit tetap); sembunyikan deskripsi generik yang hanya mengulang nama+kategori; aksi = tombol ikon + tooltip; blok statistik penuh lebar (kolom = jumlah butir); "ga mau ada yang nempel": padding dalam di tiap konteks. Cek tangkapan layar 1280 dan 390 px sebelum menunjukkan.
9. **Kepala situs wajib** (`kepala-situs-wajib`): tiap halaman pakai header navy bersama + token Centurisk97, bukan palet lokal. `gaya.css` membuat `<main>` fixed; halaman bergulir pakai `div` + `body{padding-top:var(--top)}`.
10. **Tanpa titik tengah ("·")** sebagai pemisah teks; **bahasa lugas**; **tanpa "Pantau Bencana"** (sebut "Centurisk97"); jangan sapa pemilik "Bapak/Pak".
11. **Kuota baca D1**: D1 Free 5 juta baca/hari; scan cron pernah menjatuhkan situs. Direktori sengaja hampir seluruhnya di R2 (D1 hanya sesi staf + riwayat); cek `d1 insights` sebelum menambah query.
12. **PDDikti reCAPTCHA**: jangan panen massal (anti-bot evasion); pakai ORCID atau surat resmi. Panen SINTA lewat browser nyata dengan jeda; Cloudflare/WAF memblokir banyak situs (Dapodik, Kitabisa, Bappenas, BRIN dataverse).
13. **Selalu unduh R2 segar** sebelum `sambung_panen` (sesi lain pernah menimpa `lembaga.json`, 275 tambahan hilang); cadangkan R2 sebelum unggah (`cadangan/`).
14. **Jangan klaim terverifikasi**: angka jejak kejadian dari Wikipedia/snippet ditandai; skor kesiapan lolos uji balik dulu baru boleh tanpa label Hipotesis (r -0,02 tidak lulus); anggaran dan realisasi DJPK dipisah; TKT = perkiraan.
15. **Mengunggah ke R2 produksi**: mode otomatis menolak; pemilik yang menyetujui/mengunggah. Migrasi D1 produksi diterapkan pemilik (`wrangler d1 migrations apply`, kena 7403 sesaat, ulang).
16. **Beberapa sesi bersama**: tree utama dipakai banyak sesi; `public/akademisi.js` disunting banyak sesi, koordinasi; commit dengan path spesifik, jangan `git add -A`; berkas ` 2.*` abaikan.
17. **Tab disembunyikan pemilik tetap menyimpan kode "pulihkan"** (Jurnal, Pengadaan, kalimat pembuka `setBuka`): jangan hapus, dan jangan tampilkan lagi tanpa diminta.
18. **CSP**: tanpa skrip inline, pustaka CDN dengan SRI dan domain terdaftar di `_headers`; menambah CDN/API baru = ubah `_headers`.
19. **Peta lokal**: `wrangler dev` pernah rusak (miniflare); pratinjau statis pakai server sendiri.
20. **Aturan global pemilik**: `~/.claude/DUMMY.md` (tombol dummy, dua ikon, Super Admin, per halaman), `INP.md` (klik tidak boleh membekukan: chrome urgent, subtree berat deferred, `nanti()`), `TEST.md` (uji integrasi nyata, bukan mock), `WEBSITE.md` (checklist siap rilis), `AGEN.md` (armada agent).

---

## 9. PETA PORTING (ambil backbone, adaptasi ke METI di `/Users/priyankaalfatehan28/Documents/GitHub/platformmeti`: Worker + D1 + R2, repo publik)

### 9.1 Inventaris berkas, ukuran, dan ketergantungan
Legenda: **[G]** generik, salin apa adanya (atau hampir); **[A]** salin lalu ganti titik domain; **[K]** spesifik kebencanaan/BNPB, tulis ulang atau buang.

**Front-end**
| Berkas | Ukuran | Kelas | Bergantung pada | Catatan |
| --- | --- | --- | --- | --- |
| `public/akademisi.html` | 15.058 B | [A] | memuat `akademisi_tema.js`, `inti/kepala.css`, `inti/tema.css`, `inti/gaya.css`, `akademisi.css`, `fungsi_direktori.js`, `akademisi.js`, `inti/kepala.js` (module) | ganti `<title>`, `h1`, placeholder cari, menu bencana, `data-bencana="karhutla"`, teks `#akMasuk` ("staf BNPB"), tautan `/admin/masuk?ke=/direktori`, favicon `/img/logo.svg`, tema `#14284b` |
| `public/akademisi.js` | 668.622 B (3.961 baris) | [A], campuran | fetch `/api/akademisi*`; CDN: maplibre-gl 4.7.1, xlsx 0.18.5, docx 8.5.0, jspdf 2.5.1, jspdf-autotable 3.8.2; file statis `/geo/provinsi.json`, `/geo/kabupaten/<kode>.json`, `/lambang/kabkota.json`, `/data/luas_resmi.json`, `/bencana.json` (via kepala.js); data sistem BNPB (lihat K) | satu IIFE; `DATA_*` = fetch `/api/akademisi/data/<nama>` lewat `ambilData(nama)` dengan cache Promise `DATA[nama]` |
| `public/akademisi.css` | 237.875 B | [A] | `tema.css`, `gaya.css` (token + `.sr`, `*{box-sizing}`) | warna kategori ada di JS, bukan CSS; hanya selektor `.ak-*` |
| `public/akademisi_tema.js` | 224 B | [G] | - | set `data-theme` dari localStorage `pk-tema` sebelum CSS (hindari kedip). Ubah nama kunci bila perlu |
| `public/fungsi_direktori.js` | 15.052 B | [A] | - (UMD, diuji Node) | `tingkatPenerima` (regex DAERAH/PUSAT/NONPEM: kata "bpbd", "bnpb", "basarnas", "bmkg" spesifik), `cocokBencana/bacaBencana/tulisBencana/togglePilihan` generik (ganti ALIAS `wabah`) |
| `public/inti/tema.css` | 2.232 B | [G] | - | ganti token warna/brand (METI: hijau/energi bersih?), pertahankan NAMA token |
| `public/inti/kepala.css` | 2.822 B | [G] | tema.css | `.bencana`, `.bc-ik`, `.iconbtn`, `header.top`; menu bencana dapat dibuang bila METI tak punya dropdown bidang (ganti dengan nama organisasi) |
| `public/inti/gaya.css` | 5.818 B | [G] | tema.css | `nav.tabs`, `.mark`, `.stat`, `.lainnya`; HATI-HATI: file ini membuat `<main>` fixed, pakai div |
| `public/inti/kepala.js` | 5.968 B | [K] | `fetch("/bencana.json")` (registry) | tulis ulang jadi menu sederhana/hilangkan: berisi `IKON` bencana, `TAMPIL`, `URUT`, tautan `/prediksi`, `/kemitraan`. Untuk METI: buang atau ganti menu "Bidang energi" |
| `public/bencana.json` | (registry) | [K] | - | dibuang; METI buat `public/bidang.json` bila perlu |
| `public/img/logo.svg`, `/lambang/kabkota.json`, `/geo/*.json`, `/data/luas_resmi.json` | (aset) | [A] | - | logo ganti METI; geo kab/prov batas administratif Indonesia dipakai ulang (BPS/OSM, bukan data orang); lambang daerah opsional |
| `public/_headers` | - | [A] | - | CSP: salin blok, daftarkan domain CDN/API yang dipakai |

**Worker (`src/`)**
| Berkas | Ukuran | Kelas | Bergantung pada | Catatan |
| --- | --- | --- | --- | --- |
| `src/akademisi.js` | 38.867 B (410 baris) | [A] | impor `{gagal, json, cacheTepi, bacaBody, adminOK}` dari `./worker.js`, `{stafOK, stafSesiSemua, stafPeran}` dari `./staf.js`, `{superOK}` dari `./posko.js`, `{laju}` dari `./bnpb.js` | seluruh logika rute (lihat 5.1). Ganti `KUNCI`, `P_AKADEMISI`, `DATA_AKADEMISI`, `RUMPUN_SAH`, `KATEGORI_LEMBAGA`, `JENIS_KOREKSI`, pesan galat "staf BNPB", prompt AI (`SKEMA_RISET`, `SKEMA_RINGKAS`, kalimat kebijakan bencana) |
| `src/worker.js` (hanya potongan) | 93.458 B | [K] | - | JANGAN salin utuh. Ambil pola: `json`, `gagal`, `bacaBody(req,maks)`, `cacheTepi(req,ctx,detik,buat,tanpaQuery)`, `adminOK(env,req)`, `ipHash`, `acak`, `sha`; router rute berbentuk objek `"METODE /path/:id": (env,req,url,kini,ctx,id)`; pencocok `:id` di baris 658; tabel halaman baris 700 (`[regex, aset.html, rute]`); redirect baris 741; penjaga halaman baris ~884 |
| `src/staf.js` | 18.999 B | [A] | `worker.js`, `posko.js` (`tx, modOK, superOK, RE_EMAIL`), `instansi.js` (`PROV, sandiAcak`), `admin_halaman.js`, `statistik.js` | akun per orang, sesi `sesi_staf`, `stafOK`, `stafSesiSemua`, `stafPeran`, hash sandi `sha256(garam+sandi)`, `x-pb:1`; dependensi `instansi/admin_halaman/statistik` mengikat ke BNPB: pangkas ke inti (cobaMasuk, sesi, peran, daftar) |
| `src/posko.js` (hanya `superOK`, `modOK`, `tx`, `RE_EMAIL`) | 65.567 B | [K] | - | ambil fungsi kecil saja |
| `src/bnpb.js` (hanya `laju(env, kunci, aksi, batas, kini)`, `lajuIP`) | 8.456 B | [K] | tabel `laju_bnpb` | batas laju baca-lalu-tulis D1; ganti nama tabel |
| `src/admin_halaman.js`, `src/statistik.js`, `src/instansi.js` | - | [K] | - | halaman login/akun admin; buat versi METI sendiri atau pakai Cloudflare Access sebagai gantinya |

**D1 (`migrations/`)**
| Berkas | Isi | Kelas |
| --- | --- | --- |
| `0030_staf.sql` (+ `0085`, `0099`, `0104_staf_peran_lengkap.sql` yang membangun ulang trigger `staf_larik_sah` / daftar peran) | tabel `staf` (id, username, nama, nip, unit, email, wa, peran JSON array, wilayah JSON array, garam, sandi_sha, wajib_ganti, status, dibuat, dibuat_oleh, diputus, dummy), tabel sesi staf, trigger daftar peran sah | [A]: ganti `nip`->`no_anggota`, `unit`, buang `wilayah` bila tak dipakai, daftar peran jadi `anggota/pengurus/admin/direktori` |
| `0087_akademisi_riwayat.sql` | `akademisi_riwayat` (2.8) | [A]: ganti `kejadian_id` jadi `kegiatan_id`; `jenis` jadi (`undangan`,`narasumber`,`proyek`,`kerja sama`,...) |
| (tabel laju: grep `laju_bnpb` di migrations) | batas laju | [G] |
| Tidak dibawa: 0016 sihka, 0032 laporan karhutla, 0037, 0042, 0048, 0080-0084 kemitraan, dst. | | [K] |

**Skrip pipeline (`scripts/akademisi/`)**
| Berkas | Ukuran | Kelas | Catatan |
| --- | --- | --- | --- |
| `hubung.mjs` | 28.303 B | [A] | `norm/inti/singkat/indeks/cari` generik; `ALIAS` (nama kampus/lembaga bencana, ganti dengan METI/energi: PLN, ESDM, IESR, ...); `BUANG`; `strategis()` ( regex `DIRI`: ganti ke METI); `hubung(D)`: daftar dataset masukan di komentar kepala (tokoh, inovasi, sistem_data, pendanaan, ... ), tepi spesifik BNPB (kalaksa, bpbd, donatur_kejadian, csr, sensor) dibuang/diganti |
| `lembaga_gabung.mjs` | 13.870 B | [A] | `KATEGORI`, `SKALA`, `BIDANG`, `RUMPUN`, `PROV`, `JKT_KOTA` -> ganti kategori/bidang/rumpun (mis. rumpun: surya, angin, panas bumi, hidro, bioenergi, laut, hidrogen, penyimpanan, efisiensi); `telp/urlAman/bersihkan/yakin/gabung` generik |
| `sambung_panen.mjs` | 81.107 B | [K] | sebagian besar spesifik (DJPK BTT, DIBI, kesiapan daerah, donasi, GDACS, Sentinel, tesis). Ambil pola `kunciKab`, `lembagaBaru`, `hibahBaru`, `proyekBaru`, `tesisKampus`, `temuanRiset`; sisanya tulis ulang per sumber METI |
| `perbarui.py` | 11.895 B | [A] | pakar OpenAlex bulanan: ganti DAFTAR TOPIK (`topik energi terbarukan`), ganti `UA` mailto, `BUCKET`, prefiks R2, rumpun; logika (segarkan, pakar baru, `asing()`) generik |
| `uji_perbarui.py` | 3.118 B | [G] | uji offline logika gabung |
| `pemutakhiran/mutakhir.py` | 7.426 B | [G] | orkestrasi pembaruan |
| `pemutakhiran/berita_rss.py` | 17.794 B | [A] | daftar RSS media, saringan kata kunci (kebencanaan -> energi), saringan KPK/korupsi (pertahankan) |
| `pemutakhiran/berita.py`, `panen_publik.py`, `panen_proyek.py`, `panen_sentinel.py`, `panen_tesis.py`, `rayap.py`, `inti.py`, `uji_inti.py`, `jaga_unggah.mjs` | 7,5 / 3,6 / 15,6 / 8,8 / 7,6 / 12,8 / 2,8 / 7,4 / 1,8 KB | `rayap`, `inti`, `jaga_unggah`, `uji_inti` [G]; `panen_proyek` [A] (IATI/d-portal/world bank -> proyek energi); `panen_sentinel` [K]; `panen_tesis` [G] (OAI-PMH kampus, ganti filter judul); `berita`/`panen_publik` [A] |
| `.github/workflows/direktori-bulanan.yml`, `akademisi.yml` | - | [A] | ganti bucket, prefiks, nama, jadwal; secret Actions: `OPENALEX_KEY`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` |

**Uji (`tests/`)**
| Berkas | Ukuran | Kelas |
| --- | --- | --- |
| `tests/agen/hubung.test.mjs` | 30.381 B | [A] (data contoh BNPB diganti) |
| `tests/agen/direktori-layar.test.mjs` | 12.996 B | [A] (gerbang tampilan/DOM: tab, nama kelas, `BENCANA_VIEW`) |
| `tests/agen/direktori-seg.test.mjs`, `direktori-klik.test.mjs`, `direktori-versi.test.mjs` | 1,8 / 1,1 / 0,7 KB | [G] |
| `tests/agen/saring-bencana.test.mjs`, `tingkat-penerima.test.mjs`, `cocok-kejadian.test.mjs`, `analisa-keahlian.test.mjs` | 1,7 / 1,5 / 1,8 / 3,7 KB | [A] (uji `fungsi_direktori.js` dan fungsi murni) |
| `tests/agen/lembaga-gabung.test.mjs`, `pemutakhiran-direktori.test.mjs` | 3,9 / 1,9 KB | [A] |
| `tests/warga/akademisi_peran.test.mjs`, `_gambar`, `_koreksi`, `_riwayat`, `_ringkasan`, `_terdekat` | 5,8 / 3,0 / 5,8 / 6,9 / 9,4 / 6,1 KB | [A]: pakai harness D1/R2 tiruan (`tests/warga/*` pembantu bersama; cek impor di tiap berkas); `akademisi_peran` menjaga daftar peran, WAJIB dipertahankan |
| `tests/agen/gerbang-headers.test.mjs` | - | [A] gerbang CSP |
| `tests/e2e/05-dummy-jejak.sql` | - | [A] gerbang dummy |
| `docs/bnpb/RENCANA-AKADEMISI.md`, `SURAT-PERMINTAAN-DATA-DIREKTORI.md` | 9,7 KB / - | [K]/[A] dokumen; berguna sebagai kerangka rencana & surat permintaan data (ganti BNPB -> METI) |

### 9.2 Graf ketergantungan (siapa impor/memuat siapa)
```
akademisi.html --> akademisi_tema.js (sinkron, sebelum CSS)
               --> inti/kepala.css, inti/tema.css, inti/gaya.css, akademisi.css
               --> fungsi_direktori.js (global: tingkatPenerima, cocokBencana, bacaBencana, tulisBencana, togglePilihan)
               --> akademisi.js  (memakai global di atas; CDN malas: maplibre, xlsx, docx, jspdf, jspdf-autotable)
               --> inti/kepala.js (module; fetch /bencana.json)
akademisi.js --> GET /api/akademisi/* (src/akademisi.js)
             --> GET /geo/*.json, /lambang/kabkota.json, /data/*, /banjir/data/*, /prediksi/data/*  (data sistem BNPB, bagian K)
src/akademisi.js --> worker.js {gagal,json,cacheTepi,bacaBody,adminOK}
                 --> staf.js {stafOK,stafSesiSemua,stafPeran} --> worker.js, posko.js, instansi.js, admin_halaman.js, statistik.js
                 --> posko.js {superOK}
                 --> bnpb.js {laju}
worker.js --> RUTE_AKADEMISI (spread di objek rute), P_AKADEMISI (penjaga halaman)
scripts: sambung_panen.mjs --> hubung.mjs {norm, indeks, cari};  hubung.mjs berdiri sendiri; lembaga_gabung.mjs berdiri sendiri
```
Sirkular: `src/akademisi.js` <-> `worker.js` (worker mengimpor RUTE_AKADEMISI, akademisi mengimpor fungsi dari worker). Di METI hindari: taruh `json/gagal/cacheTepi/bacaBody` di `src/util.js`.

### 9.3 Yang GENERIK (salin apa adanya)
`akademisi_tema.js`; `inti/tema.css`, `inti/kepala.css`, `inti/gaya.css` (ganti nilai token saja); logika UI di `akademisi.js`: `esc/angka/nol/inisial`, `nanti()` (INP: dua rAF + 120 ms), `segHtml/hiasSeg/setSeg`, `htmlPilih/pasangPilih` (dropdown multi), `LIB`+`muat()` (pemuat CDN ber-SRI), `xlsx/docx/pdf/cetakHalaman`, daftar pendek (`dpUbah`, `lihatDp`, `eksporDp`), pencarian global (`pasangCari`, `nrmCari`), grafik SVG (`batang`, `gambarPj`, `reStk`), peta (`bangunPeta`, `segarPeta`, `pasangCariPeta`, `aturLebar`), graf klien (`siapGraf`, `htmlTerhubung`, `barisNode`, `judulTerh`), hak koreksi (`kirimKoreksi`), riwayat (`riwayatDi`), sistem dummy (`pasangDummyAk`, `dummyIsi/Hapus`), `letakBencana`, `tampil`, `bukaView`/`MUAT`; seluruh rute Worker (karya OpenAlex, sinta, gambar, koreksi, riwayat, saya, data/:nama, induk, kampus, kontak, terdekat); `rakitAbstrak`, `ringkasOrcid`; `hubung.mjs` (`norm/indeks/cari`, `hubung`), `lembaga_gabung.mjs` (`bersihkan/telp/urlAman/gabung`), `perbarui.py` logika, `rayap.py`, `jaga_unggah.mjs`, pola migrasi riwayat.

### 9.4 Yang SPESIFIK kebencanaan/BNPB dan titik ganti konkret
**A. Konstanta di `public/akademisi.js` (cari dengan grep nama persis)**
1. `RUMPUN` (baris 16-50): 15 bencana + ikon+warna -> rumpun energi (surya, angin, panas bumi, hidro, bioenergi, laut/arus, hidrogen, penyimpanan baterai, jaringan/transmisi, efisiensi energi, kebijakan/regulasi, pembiayaan, CCS/CCUS, nuklir). Dipakai oleh `pilRumpun`, panel `#akBencana` (`segarBencana()`, `setBencanaSet`), `GL`, `turunRumpun`, `perkayaRumpun`. Ganti nama konsep UI "bencana" menjadi "teknologi/sektor" (ID `akBencana`, kelas `.ak-bencana/.ak-bpanel`, URL `?bencana=` boleh dipertahankan tapi sebaiknya `?sektor=`; gerbang `saring-bencana.test.mjs`).
2. `PROV` (34-38 provinsi) generik, pertahankan.
3. `KAT` (baris 1123): 15 kategori lembaga dan ikon/warna -> kategori METI (pemerintah, BUMN/PLN, swasta/IPP, asosiasi profesi, lembaga riset/kampus, LSM/think tank, lembaga keuangan/pembiaya, internasional/donor, pengembang teknologi, komunitas). Sinkron dengan `KATEGORI` (`lembaga_gabung.mjs`) dan `KATEGORI_LEMBAGA` (`src/akademisi.js` baris 219).
4. `TABS`/`VIEW`/`SUBTAB`/`LAMA`/`TAB_LABEL`/`MUAT`/`INTRO`/`BENCANA_VIEW`: pilih tab METI. Tab kandidat: Pakar (+Tokoh), Lembaga/Anggota METI, Wilayah (potensi energi per provinsi), Inovasi/Teknologi, Proyek (pembangkit/PPA), Pendanaan, Regulasi/Pustaka, Berita, Riset. Buang: Donasi (`bangunDonasi`, `donasi_bencana`), Sistem data (atau ganti dengan portal data energi: ESDM, PLN, IRENA), Kejadian besar (`bangunKej`), Riset daerah pola bencana.
5. `AKSES` (sistem data), `JENIS_DANA` (dana), `KAT_BERITA`, `JENIS_ENT`, `BR`, `TKT_DESK` (rubrik TKT generik; bisa dipakai ulang untuk teknologi energi), `JENIS_NODE`, `ANGGOTA_RE`.
6. Fungsi Wilayah: `bangunWilayah`, `renderWil`, `kondisiWil`, `kesiapanWil`, `dayaWil`, `awalWil`, `petaKesenjangan`, `ujiKs`, `ujiLb`, `cetakWil`, `cetakBpbd`, `isiBpbd`, `kapLb`, `izinLb` ("Izin dan integritas" berisi LAZ/PUB: ganti dengan izin usaha/IUPTL/WIUP bila perlu) -> hampir semua K; boleh pakai struktur "pilih wilayah -> kartu".
7. Endpoint data sistem BNPB yang dibaca klien: `/banjir/data/risiko_kecamatan.json` (5 pemakaian), `/banjir/data/abu_gunungapi.json`, `/data/dibi_kejadian.json`, `/data/status_darurat.json`, `/data/titik24.json`, `/prediksi/data/prediksi.json`, `/data/bnpb/hukum/katalog.json`, `/data/luas_resmi.json`, `fetch("/api/staf/admin/daftar")` (daftar akun untuk panel super): semua dibuang atau diganti sumber METI.
8. Teks: "staf BNPB", "BNPB", "BPBD", "karhutla", "Kemitraan", teks pada `INTRO`, `#akMasuk`, `setBuka`, `kosongHtml`; `grep -n "BNPB\|BPBD\|DIBI\|karhutla\|Karhutla" public/akademisi.js` -> 85 baris; `akademisi.html` 2 baris `BNPB`; surel `<surel-disamarkan>` dan `<surel-disamarkan>` di `fetch` OpenAlex (`mailto=`) dan `UA` di `perbarui.py` -> GANTI dengan kontak METI.
9. Riwayat "Riwayat dengan BNPB": `JENIS_RIWAYAT`, `kejadian_id`, label di UI `riwayatDi()` -> "Riwayat dengan METI" (kegiatan, webinar, kerja sama, keanggotaan).
10. Dummy: `dataContoh()` (lembaga BPBD/PMI/LAZ...), `NAMA_DUMMY`.
**B. `fungsi_direktori.js`**: `DAERAH/PUSAT/NONPEM` di `tingkatPenerima` (regex lembaga pusat/daerah/non-pemerintah: tambah PLN, ESDM, BUMN, IPP), `ALIAS={wabah:...}`.
**C. `src/akademisi.js`**: `P_AKADEMISI` (peran), `DATA_AKADEMISI` (51 nama, kurangi), `RUMPUN_SAH` (14 rumpun), `KATEGORI_LEMBAGA`, `JENIS_KOREKSI`, `JENIS_RIWAYAT/JENIS_TARGET`, pesan "staf BNPB atau admin" (banyak tempat, ganti dengan satu konstanta `PESAN_401`), `MODEL_RISET` dan `SKEMA_RISET`/`SKEMA_RINGKAS` (Workers AI; teks prompt kebijakan bencana), `RE_KUNCI`, `KUNCI = "akademisi/induk.json"`.
**D. `scripts/akademisi/*`**: `ALIAS` (hubung), `DIRI` (strategis), kategori/bidang/rumpun/`JKT_KOTA` (lembaga_gabung), DAFTAR TOPIK BENCANA (perbarui), semua `panen_*` sumber bencana, `kesiapanDaerah`, `ujiKesiapan`, DJPK/DIBI/GDACS/Sentinel/CEMS/e-Katalog/BNSP/Basarnas/PMI/LAZ, `daftarHitamCocok`, `donasiBencana`, `DONASI_ACT`, `RISET_BENCANA` (regex), `UA`, `BUCKET`.
**E. Filter KPK/hukum**: tidak terkodifikasi terpusat; titik: `berita_rss.py` fungsi saringan (baris ~115), `sambung_panen.mjs` baris 202 (`DONASI_ACT`, `DONASI_KORUPSI`), penghapusan manual tokoh. Untuk METI: PERTAHANKAN prinsip (orang/lembaga terkait kasus hukum tidak ditampilkan, meninggal dikeluarkan); buat satu `scripts/direktori/daftar-tolak.json` + uji.
**F. Registry/menu**: `public/bencana.json`, `inti/kepala.js` (IKON, TAMPIL, URUT, `/prediksi`, `/kemitraan`), `kepala.css` `html[data-situs=w]`: ganti dengan menu METI sederhana.

### 9.5 Yang TIDAK BOLEH ikut ke repo METI (publik)
1. **Semua data orang/lembaga**: seluruh isi R2 `poskokarhutla-foto/akademisi/**` (induk.json, kampus.json, kontak.json, `sinta/`, `gambar/`, `koreksi/`, `baru/`, `panen/`, `cadangan/`, `ringkasan/`, graf, tokoh, dst.), folder lokal `~/direktori-panen/**`, scratchpad pemanen, `akademisi/riwayat` (D1 `akademisi_riwayat` isi baris), tabel `staf` isi (NIP, WA, surel, hash sandi, garam), `orang`, `lp_*`. Data pribadi akademisi (surel, telepon, WA) tidak boleh masuk repo atau `public/`; METI butuh basis R2 SENDIRI dan data panen METI sendiri.
2. **Data contoh yang memuat nama/nomor nyata**: sampel di `tests/**` harus fiktif (`example.org`, "contoh").
3. **Rahasia**: `OPENALEX_KEY` (kunci OpenAlex pemilik; ada di Keychain `openalex-api` dan secret worker), `ADMIN_TOKEN`, `AKUN_SITUS`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, kunci BPS (Keychain `bps-webapi`), `.dev.vars`, `.env*`, `.claude/cadangan-akun/**` (memori pemilik, email/telepon disamarkan), `.claude/ilmu-agent/prompt/*.jsonl` (log prompt), cookie `sesi_staf`.
4. **ID Cloudflare dari `wrangler.jsonc` BNPB**: `database_id: <id-d1-disamarkan>` (D1 `poskowarga`), bucket `poskokarhutla-foto`, nama worker `centurisk97`, domain `centurisk97.id`/`pantau.terasurban.com`, id akun. METI membuat D1, bucket R2, dan worker sendiri; isi `wrangler.jsonc` METI dengan id baru.
5. **Kunci/surel kontak pemilik**: `<surel-disamarkan>`, `<surel-disamarkan>` (di `akademisi.js` dan `perbarui.py`), `OPENALEX_KEY` ditulis di chat 28 Okt (kemungkinan sudah diganti): jangan pernah disalin.
6. **Kode/nama merek BNPB**: logo `/img/logo.svg` Centurisk97, `lambang/` daerah (aset publik, boleh tetapi cek lisensi), kata "Centurisk97", "Pantau Bencana", "BNPB" (pemilik: jangan sebut "Pantau Bencana"), nama pejabat nyata di `tokoh.json` dan kasus KPK.
7. **Berkas `* 2.*`** (salinan nyasar iCloud) abaikan; **`public/akademisi.js` versi `?v=`** bukan sumber, ambil sumber sebenarnya.

### 9.6 Urutan porting yang disarankan (satu paragraf per langkah)
1. **Kerangka**: salin `tema.css`, `kepala.css`, `gaya.css`, `akademisi_tema.js`, `akademisi.html` -> ubah token, judul, menu; hapus `kepala.js`/`bencana.json` dulu, ganti dengan tautan statis.
2. **Worker inti**: buat `src/util.js` (json/gagal/bacaBody/cacheTepi/ipHash), `src/staf.js` ringkas (login per orang + sesi + peran + `stafOK`), migrasi `staf` + sesi + `laju` + `akademisi_riwayat`, salin `src/akademisi.js` lalu ganti konstanta 9.4.C. Daftarkan `RUTE_AKADEMISI` dan tabel halaman `/direktori`. Pasang `_headers` + `noindex`.
3. **Layar**: salin `akademisi.js` + `akademisi.css` + `fungsi_direktori.js`; ganti `RUMPUN`, `KAT`, `TABS`, teks, mailto, buang tab/fungsi bencana; jalankan `dataContoh()` ber-"(contoh)" dengan data METI fiktif lewat tombol dummy untuk memeriksa layar tanpa data asli.
4. **Pipeline**: salin `hubung.mjs`, `lembaga_gabung.mjs`, `perbarui.py`, `pemutakhiran/{mutakhir,berita_rss,rayap,inti,jaga_unggah,uji_inti}`; ganti topik/ALIAS/kategori; panen pakar energi dari OpenAlex (`country_code:ID`, topik energi), anggota METI dari data keanggotaan METI (diberikan METI, tidak dari repo), SINTA/ORCID sesuai aturan 4.1; hasil ke R2 METI.
5. **Gerbang**: salin dan sesuaikan uji `tests/agen/{hubung,direktori-*,lembaga-gabung,saring-*}.test.mjs` dan `tests/warga/akademisi_peran.test.mjs` serta gerbang CSP dan dummy; jalankan sebelum klaim selesai (aturan pemilik: uji integrasi nyata, bukan mock).
6. **Tinjauan aturan pemilik**: terapkan 8.1-8.10 sebelum menunjukkan (kartu bagian, deretan ujung ke ujung, tanpa titik tengah, header bersama, tombol dummy dua ikon Super Admin, cek 1280 dan 390 px).
