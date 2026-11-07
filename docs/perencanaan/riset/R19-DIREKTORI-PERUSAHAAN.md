# R19: Direktori perusahaan EBET Indonesia (7 Nov 2026)

Status: tahap awal. 111 perusahaan benih, 32 situs resmi terverifikasi, 7 perusahaan dengan pengurus terbaca. Bukan "lengkap"; lihat Celah.

## Cara kerja
- `scripts/panen/panen_perusahaan.mjs` (`--selftest`, `--jalan[=batch]`, `--statistik`), benih di `scripts/panen/perusahaan_seed.mjs`. Keluaran `data-panen/perusahaan/{perusahaan,pengurus,gagal}.jsonl`, `raw/`, `foto/` (di-.gitignore).
- Urutan batch: 1 BUMN, 2 pabrikan modul surya (tabel pemilik), 3 produsen BBN, 4 IPP/pengembang, 5 asing/manufaktur global. Simpan tiap batch; mentah di `raw/` membuat jalan ulang bisa dilanjut.
- Sopan: UA jujur, jeda >= 2,2 dtk, robots.txt dicek, tanpa login/CAPTCHA/LinkedIn/sosial. 403/429 menghentikan host itu. Galat TLS tidak dilonggarkan.
- Pengurus ditautkan ke `orang_id` hanya bila `kunciNama` sama persis dengan `orang.jsonl`; selain itu `orang_baru: true` (id `o_`+sha1 nama, skema sama dengan panen_orang).

## Sumber dan tingkat bukti
| Sumber | Dipakai untuk | tingkat_bukti |
| --- | --- | --- |
| Benih (pengetahuan peneliti) | nama, jenis, induk, peran, kepakaran, kantor, kode saham | `inferensi` (belum diverifikasi; kepakaran K16 belum bersumber per tag) |
| DJEBTKE ESDM, Daftar Pabrikan Modul Surya di Indonesia, hlm 12 (tangkapan layar pemilik, 2026-11-07; dokumen-pemerintah) | `kapasitas_mwp_tahun`, `pasar`, `apamsi`, `tkdn`, `bmp` (40 baris) | `resmi` (di luar enum D1, perlu dipetakan) |
| Situs resmi perusahaan | situs, direksi/komisaris, foto, kontak korporat | `kata-pihak` |
| OSM Nominatim (ODbL) | lat/lng bila alamat ada tetapi koordinat tidak | `lat_lng_sumber` dicatat |

Hanover Solar Indonesia (SOLEHAN slide 6, 35 nama tanpa kapasitas) dicatat terpisah sebagai `kandidat:true` dengan sumbernya sendiri; pptx SOLEHAN tidak dipakai untuk kolom tabel 40.

## Cakupan per kolom (111 perusahaan)
Nama/jenis/peran/kepakaran/induk 100% (benih, inferensi). Situs terverifikasi 29% (32). Kontak (surel, telepon, alamat, atau koordinat) 19,8%; lat/lng 7 perusahaan. Pengurus terbaca 7 perusahaan (41 orang, 24 berfoto resmi, 9 tertaut `orang.jsonl`); Direktur Utama ada di 5,4% perusahaan; foto di 4,5%. `tahun_berdiri`, `proyek`, `kapasitas_portofolio`: kosong (belum dipanen).
Kontak: hanya surel umum (info@, sekretariat@, humas@ dst.; daftar putih awalan) dan telepon kantor, E.164; seluler (+628) dan nomor WhatsApp dibuang; tanpa menebak pola surel.

## Celah
1. 59 perusahaan tanpa situs di benih (hampir semua pabrikan modul, produsen BBN swasta): situs tidak ditebak; butuh direktori resmi (Kemenperin/ESDM) atau daftar anggota APAMSI/APROBI/AESI/METI. Daftar anggota asosiasi belum dipanen.
2. 25 situs terbaca tetapi halaman direksi tak terurai (render JavaScript, PDF, atau tata letak lain); laporan tahunan IDX belum dipakai.
3. 19 situs gagal (DNS salah, timeout, TLS tak tepercaya, 403, 500); 4 host menolak lewat robots (Danantara, PTBA, Holding Perkebunan, dll.).
4. Ekstraksi heuristik: tiap pengurus `ekstraksi:'heuristik'`, perlu tinjau kurator (contoh: dua "Direktur Utama" di satu perusahaan = derau).
5. GEM trackers yang diunduh di `data-panen/proyek/raw` hanya halaman unduh, tanpa nama pemilik; `pihak.jsonl` belum ada. Daftar B50 ESDM, TKDN P3DN, IDX sektor energi terbarukan belum dipanen.

## Usulan halaman profil (meniru lembaga di Direktori Kebencanaan)
Kepala: nama, jenis, induk/grup, kode saham, peran rantai, kepakaran (chip). Blok "Pimpinan" langsung di atas lipatan: kartu Direktur Utama lalu direktur lalu komisaris (foto, nama, jabatan, "sumber: halaman resmi", tanggal ambil; foto dengan atribusi "milik perusahaan"). Samping: kontak korporat + peta bila ada koordinat. Bawah: portofolio proyek, kapasitas, TKDN/BMP/APAMSI (pabrikan modul), sumber dan tingkat bukti per kolom. Foto tampil hanya setelah tinjau dan izin; tanpa foto resmi = inisial.
