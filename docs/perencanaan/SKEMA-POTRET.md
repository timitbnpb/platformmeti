# SKEMA-POTRET: bentuk JSON yang dibaca layar

Dibangun `scripts/pipa/potret.mjs` ke `data-panen/potret/{publik,anggota,pengurus}/<benda>.json` (R2 `potret/<lapis>/<benda>.json`). Dasar: ARSITEKTUR-INFORMASI §2, §4, §5; KEPUTUSAN K16, K19. Tanggal bangun dari masukan, bukan jam.

## Amplop (semua berkas)
`{ "lapis": "publik|anggota|pengurus", "dibangun_pada": "YYYY-MM-DD", "jumlah": n, "baris": [ ... ] }`
Benda: `proyek`, `organisasi`, `orang`, `regulasi`, `program`, `berita`, `video`, `angka`, `keuangan`, `karbon`, plus `ringkas.json` (bentuk sendiri). `anggota_meti.json` hanya di lapis pengurus.

- **publik** = baris penuh. **anggota** dan **pengurus** = DELTA: `{id, ...kolom tambahan}`, digabung layar ke baris publik dengan `id` yang sama. Tidak ada kolom publik yang diulang. Baris yang ditahan dari publik (lihat Aturan) muncul di delta dengan `baru: true` dan `nama`.
- Berkas lapis tanpa delta tetap ada dengan `baris: []`. Berkas yang melebihi 2 MB dipecah `<benda>.<n>.json` dan `<benda>.json` berisi `{bagian:[nama berkas]}`.
- Tautan silang selalu lewat `id` (satu benda, satu rumah): `organisasi_id`, `orang_id`, `proyek_ids`, `regulasi_ids`, `program_ids`, `berita_ids`. Id tak ada di berkas = tidak ditulis.
- Sumber: `sumber:[{id, jenis, url, tingkat_bukti, tanggal, lisensi?}]`; nilai bersumber membawa `sumber_id`.

## proyek (id `pj_NNNN`)
- publik: `nama`, `teknologi` (K16), `program_ids[]`, `lokasi{provinsi,kabupaten_kota,lat,lng,presisi,sumber{jenis,url,lisensi,catatan}}`, `kapasitas[{nilai,satuan,catatan,sumber_id}]`, `status[]`, `cod_target[]`, `cod_aktual[]`, `nilai_investasi[]`, `pihak{pemilik[],epc[],pembeli[]}` (tiap `{nilai, organisasi_id?, sumber_id}`), `regulasi_ids[]`, `berita_ids[]`, `tingkat_bukti`, `sumber[]`.
- anggota: `skema_kerjasama[]`, `tanggal_ppa[]`, `financial_close[]`, `pemberi_dana[]`, `pihak_terlibat[]`, `tenaga_kerja[]`, `dari_materi{kolom:[nilai]}` (nilai dari materi paparan internal, tidak boleh publik).
- pengurus: `catatan[]`, `konflik[]` (belum putus).
- Dibuang di semua lapis: baris `publik:false` dan nilai bersumber `publik:false`. Sumber dokumen terbit tanpa URL (RUPTL PDF) tampil dengan `dokumen`+`halaman`, tanpa `url`; materi paparan konferensi = internal (anggota).

## organisasi (id `p_`, `l_`, `kp_`, `om_`, `am_`)
- publik: `nama`, `singkatan`, `nama_lain[]`, `kategori{kode,label}` (K19: bumn, bumd, swasta, internasional, kementerian-lembaga, pemda, perguruan-tinggi, think-tank, lsm-yayasan, donor, asosiasi, keuangan, ormawa, koperasi), `induk`, `kepakaran[]` (K16), `peran_rantai[]`, `lokasi{alamat,kota,provinsi,lat,lng}`, `situs`, `tahun_berdiri`, `kode_saham`, `dasar_hukum`, `teknis{kapasitas_mwp_tahun,pasar,apamsi,tkdn,bmp,kapasitas_portofolio}`, `kontak{telepon[],surel[]}` (hanya korporat generik), `anggota_meti{jenis}`, `keanggotaan[{organisasi_id,jenis}]`, `pengurus[{orang_id,nama,jabatan,jenis_jabatan,mulai,selesai}]`, `proyek_ids[]`, `berita_ids[]`, `sumber[]`, `diperiksa`.
- anggota: `anggota_meti{jenis}` (keanggotaan METI dari arsip), `pengurus_foto[{orang_id,berkas,sumber_url,hak_cipta}]` (`berkas` = `foto/<orang_id>.<ext>`, R2 `potret/anggota/foto/`), `pengurus_ormawa[{nama,jabatan}]`.
- pengurus: `kontak_internal{telepon[],surel[]}` (surel non-generik, ponsel), `catatan_kurator{verifikasi,pengurus_status,situs_keyakinan,situs_catatan,ekstraksi}`, `gagal[]`, `keanggotaan_meti{jenis_keanggotaan,sektor,sumber_berkas}`; organisasi tanpa URL ditahan (`baru:true, ditahan`).

## orang (id `o_`, `ot_`, `pm_`)
- publik: `nama`, `gelar`, `kelompok{kode,label}` (K19: profesional, praktisi, akademisi, think-tank-peneliti, tokoh-publik, aktivis-tokoh-daerah), `jenis`, `status`, `jabatan_terkini`, `organisasi_terkini`, `organisasi_id`, `kepakaran[{kode,utama,bukti,sumber_url}]` (K16, maks 3), `jalur[]`, `pernah_birokrasi`, `jabatan[{organisasi_id,organisasi,jabatan,mulai,selesai,kini,sumber_url}]`, `tautan[]`, `wikidata_id`, `berita_ids[]`, `sumber_url`, `tanggal`.
- anggota: `pendidikan[]`, `kiprah[]`, `foto{berkas,sumber_url,lisensi,pengarang}` (`berkas` = `foto/<orang_id>.<ext>`), `akademik`.
- pengurus: `alias[]`, `sumber_riwayat[]`, `ekstraksi`, `perlu_tinjau[]`, `berita_kandidat_ids[]` (cocok nama belum pasti).
- Tidak pernah dimuat: kontak pribadi, tanggal lahir, NIK, harta.

## regulasi (id slug, mis. `uu-62-1954`)
- publik: `jenis`, `nomor`, `tahun`, `judul`, `instansi_penerbit`, `status`, `tanggal_ditetapkan`, `tanggal_diundangkan`, `topik[]`, `ringkasan`, `pasal_kunci`, `url_sumber`, `url_pdf`, `ikatan[{ke,jenis}]` (mencabut/mengubah), `diikat_oleh[{dari,jenis}]`, `program_ids[]`, `proyek_ids[]`, `berita_ids[]`, `tanggal_ambil`.
- anggota: `posisi_meti`; amplop lapis anggota membawa juga `posisi_topik[]` (arsip posisi METI, 27 butir).
- pengurus: `sumber_posisi`.

## program (id `plts-100gw`, `wte`, `b50`, `e20`, `ruptl`, `psn`, `jetp`)
Hanya publik: `nama`, `ringkas`, `regulasi_ids[]` (dasar hukum), `proyek_ids[]`, `jumlah_proyek`, `kapasitas_mw` (MW+MWp, nilai pertama per proyek), `per_status{}`, `per_teknologi{}`. Anggota dan pengurus kosong. Program belum entitas D1 (migrasi 0007).

## berita (id hex 10)
Judul dan tautan saja. publik: `judul`, `url`, `media`, `terbit`, `bahasa`, `kepakaran[]`, `organisasi_ids[]`, `proyek_ids[]`, `regulasi_ids[]`, `orang_ids[]`, `sumber_panen`, `tanggal_ambil`. Lapis lain kosong.

## ringkas.json (per lapis, bentuk sendiri)
`{lapis, dibangun_pada, hitung{proyek,organisasi,orang,regulasi,program,berita}, kartu[5]{kode,label,nilai,satuan,catatan}, proyek_per_teknologi{}, proyek_per_status{}, berita_terbaru[id x5]}`. Lima kartu: proyek terlacak, kapasitas (MW+MWp), organisasi, orang, regulasi berlaku. Lapis pengurus menambah `anggota_meti{...}`.

## anggota_meti.json (pengurus saja)
`baris[]` dari arsip keanggotaan METI (`no_anggota, jenis, status, tahun_daftar, nama, jabatan, instansi, alamat, telepon, seluler, surel, iuran, sumber`). Berisi data pribadi; tidak pernah ke lapis lain.

## Aturan
1. Baris butuh `sumber_url`, tanggal, `tingkat_bukti` (KP D5). Organisasi/orang yang hanya bersumber "benih" tanpa URL ditahan dari publik: muncul di delta pengurus dengan `baru:true` dan `ditahan:"tanpa-sumber-url"`.
2. Angka rapat IndoEBTKE (`angka.jsonl`) tanpa URL publik masuk lapis anggota (`anggota/angka.json`, baris utuh; `publik/angka.json` untuk yang berURL); yang berURL masuk publik. Nilai proyek dari materi paparan internal ke `dari_materi` (anggota).
3. Pemindai (selftest dan tiap bangun): surel pribadi, ponsel, NIK, tanggal lahir di publik dan anggota = bangun GAGAL. Surel/telepon korporat generik lolos lewat allowlist (info@, humas@, sekretariat@, corsec@, cs@, ...).
4. Tiap berkas publik < 2 MB.

## Tambahan (8 Nov 2026)
- **proyek** baru: `asal` (`worldbank`, `wkp`, `jica`), `waktu{persetujuan,penutupan}`, `pihak.peminjam[]`, `pihak.pelaksana[]`, `nilai_investasi` bisa `USD` atau `JPY juta`, `karbon_ids[]` (id baris `karbon.json` yang cocok nama dan jarak). anggota: `pemberi_dana[]` untuk Bank Dunia/JICA.
- **organisasi** baru: `via_1001{sub,sektor,atribusi}` (startup/BUMD/pusat data dari 1001startup.id: hanya nama, sektor, lokasi, relasi, sumber primer; tanpa deskripsi, pegawai, valuasi; syarat izin C-13 tetap), `relasi[{arah,jenis,nama,organisasi_id?,persen_kepemilikan,label_bukti,sumber_url}]`, `teknis.sertifikat_tkdn[{produk,merk,tipe,tkdn_persen,bmp_persen,diterbitkan,berlaku_sd,sumber_url}]`, `keuangan[{tahun,metrik,nilai,satuan,sumber_url,tingkat_bukti}]` (emiten IDX).
- **orang** baru: `dpr{komisi,fraksi,dapil}`, `jabatan[].catatan`; kelompok `praktisi` mencakup direksi/komisaris BUMN. Ketua Komisi XII mengikuti `tambahan_dpr` (menimpa guidebook lama).
- **regulasi** baru: `tahap` (RUU EBET: `dalam pembahasan DPR`, boleh tanpa URL, ditandai `catatan_sumber`). Amplop anggota `posisi_topik[]` memuat `regulasi_id` (RUU EBET) per butir.
- **program** `b50` membawa `alokasi_bbn[]` (alokasi biodiesel per tahun, Kepmen ESDM).
- **keuangan.json** (publik): `baris[{kelompok: tarif|bpp|green_finance|jetp|idx|celah, ...baris sumber, sumber_url, tingkat_bukti, tanggal}]`; `idx` membawa `organisasi_id`; BPP lama bertanda `kedaluwarsa`.
- **karbon.json** (publik): `kelompok: pembangkit` (Climate TRACE 2024, CC BY 4.0, `via-pihak-ketiga`, estimasi model; `proyek_ids`, `organisasi_ids`) dan `bursa_karbon` (IDXCarbon bulanan). Tiap baris membawa `sumber_url`, `lisensi`.
- **video.json** (publik): `{id,judul,kanal,jenis (resmi|media|kreator),terbit,url,organisasi_ids,proyek_ids,regulasi_ids}`; kreator hanya bila judul menaut benda.
- **angka.json**: baris IETO 2026 (IESR) berbentuk `{id,laporan,penerbit,indikator,nilai,satuan,teks,halaman,sumber_url,lisensi,tingkat_bukti}`.
- **wilayah** (`public/data/wilayah.json`, dari `potret_wilayah.mjs`): `surya_atlas{label,titik,pvout_kwh_per_kwp_tahun,...,lisensi}` berlabel titik ibu kota, bukan rata-rata provinsi.
