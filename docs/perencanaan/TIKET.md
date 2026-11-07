# TIKET: Platform Jaringan METI

Dokumen terakhir dalam urutan otoritas (`KEPUTUSAN-METI` > `GRAND-DESIGN` > `RISET` > `PRD` > `ALUR` > `ALGORITMA` > `DESIGN-SYSTEM` > `DESAIN-TEKNIS` > `KEAMANAN-PRIVASI` > `RENCANA-UJI` > `TIKET`). TIKET hanya mengatur siapa dan kapan; isi teknis ada di dokumen atasnya.

> **Untuk pekerja agen:** satu sesi = satu tiket. Baca tiketmu dan bagian "Rujukan" saja. Sentuh hanya "Berkas". Yang tidak tertulis: berhenti dan tanya. Subagent tidak commit, push, atau deploy.

Singkatan: KP = KEPUTUSAN-METI, GD = GRAND-DESIGN, R1..R9 = riset/, DT = DESAIN-TEKNIS, KPV = KEAMANAN-PRIVASI, RU = RENCANA-UJI, DS = DESIGN-SYSTEM. Asal = repo poskokarhutla.

## 0. Batasan global

| Batasan | Nilai |
| --- | --- |
| Stack | 1 Worker Cloudflare + static assets, D1, R2, Workers AI; tanpa build step |
| Data pribadi | tidak di repo, tidak di `public/`, tidak di potret publik |
| Akses D1 | hanya lewat `src/hak.js` (KP D7) |
| Migrasi | `migrations/0001..0099`, idempoten, tidak menyunting yang sudah jalan |
| Cron | maksimal 5 jadwal (akun Free) |
| Angka | wajib sumber + tanggal; turunan berlabel `EST` |
| Bahasa | tiap kunci teks ada di `id.json` dan `en.json` |
| Gaya | token DS, kelas `.ak-*` (port) dan `.jm-*` (baru) |
| Ukuran | S < ½ hari, M ~1 hari, L > 1 hari (pecah bila bisa) |

## 1. Aturan semua tiket

1. Model: pengerja `sonnet`, pemeriksa pola `haiku`, sesi induk `opus`.
2. Tiket tulis paralel memakai worktree, merge ke `main` lalu hapus branch.
3. Selesai = perintah bukti keluar 0 + pemeriksa tanpa temuan tinggi.
4. Tiap aturan hak, CHECK, dan trigger punya uji "yang salah DITOLAK".
5. Tiap fungsi, rute, dan skrip baru terdaftar di `tests/cakupan.json`.
6. Teks antarmuka ID dan EN bersamaan.
7. `[induk]` = dikerjakan sesi induk; `[manusia]` = butuh pemilik atau METI.

## 2. Papan status

| ID | Judul | Pengerja | Fase | Ukuran | Status |
| --- | --- | --- | --- | --- | --- |
| JM-A01 | Armada agent, AGENTS.md, CLAUDE.md `[induk]` | induk | F0 | S | belum |
| JM-A02 | Kerangka repo, wrangler, package.json, CI uji | mekanik | F0 | S | belum |
| JM-A03 | `[manusia]` Buat D1, R2, Worker di akun Cloudflare (C-06) | pemilik | F0 | S | belum |
| JM-A04 | `src/util.js` dari potongan `worker.js` asal | worker | F0 | S | belum |
| JM-A05 | Router Worker + tabel halaman + `_headers` CSP | worker | F0 | M | belum |
| JM-B01 | Migrasi `0001_akun.sql` (akun, sesi, peran, cakupan) | worker | F0 | M | belum |
| JM-B02 | `src/sandi.js` PBKDF2 + uji | worker | F0 | S | belum |
| JM-B03 | `src/sesi.js` login, keluar, sesi cookie, batas laju | worker | F0 | M | belum |
| JM-B04 | `src/hak.js` matriks RLS + uji tiap sel | worker | F0 | L | belum |
| JM-B05 | `/admin` akun: buat, ubah peran, nonaktifkan, tautan aktivasi | worker+layar | F0 | M | belum |
| JM-B06 | `/masuk`, `/aktivasi`, `/ganti-sandi` | layar | F0 | S | belum |
| JM-B07 | Jejak admin `0002_jejak.sql` + layar jejak | worker | F0 | S | belum |
| JM-C01 | Token DS METI `public/inti/tema.css` + kepala situs | layar | F0 | S | belum |
| JM-C02 | Port `akademisi.html/js/css` ke `/direktori` (berkas [A]) | layar | F0 | L | belum |
| JM-C03 | Ganti konstanta domain: `RUMPUN`->`SEKTOR`, `KAT`, `TABS`, teks | layar | F0 | M | belum |
| JM-C04 | Port `src/akademisi.js` ke `src/direktori.js` + konstanta | worker | F0 | M | belum |
| JM-C05 | Data contoh METI fiktif sebagai fixture uji + seed D1 lokal/pratinjau (TANPA tombol dummy, KP K15) | layar | F0 | S | belum |
| JM-C06 | i18n: `id.json`, `en.json`, toggle, formatter angka | layar | F0 | M | belum |
| JM-C07 | Gerbang layar asal diport (`direktori-seg/klik/layar/versi`) | gerbang | F0 | M | belum |
| JM-D01 | Skema kurasi `0003_entitas.sql` (entitas, fakta, ikatan, sumber) | worker | F1 | M | belum |
| JM-D02 | `jaga_unggah.mjs` tolak baris tanpa sumber | pipa | F1 | S | belum |
| JM-D03 | Panen OpenAlex pakar EBT (`perbarui.py` diport) | pipa | F1 | M | belum |
| JM-D04 | Panen OSM pembangkit per provinsi (Overpass) | pipa | F1 | M | belum |
| JM-D05 | Panen Ember, OWID, IRENASTAT, World Bank | pipa | F1 | M | belum |
| JM-D06 | Panen regulasi BPK + JDIH ESDM | pipa | F1 | M | belum |
| JM-D07 | `[manusia]` Seed METI: 12 anggota, 12 mitra, pengurus SK 0008, METI Wilayah | kurator | F1 | M | belum |
| JM-D08 | Panen 1001startup.id energi (fakta + sumber primer, C-13) | pipa | F1 | M | panen awal selesai (R13); izin rilis tunggu C-13 |
| JM-D09 | Panen AESI anggota, GEM manual, WRI GPPD | pipa | F1 | M | belum |
| JM-D10 | `hubung.mjs` diport: graf + dedup + `strategis()` DIRI=METI | pipa | F1 | L | belum |
| JM-D11 | Daftar tolak terpusat + uji | pipa | F1 | S | belum |
| JM-D12 | Potret per lapis (publik, anggota, pengurus) ke R2 | pipa | F1 | M | belum |
| JM-D13 | Skor keyakinan 0-1 per profil (ALG §4) | pipa | F1 | M | belum |
| JM-E01 | Beranda sensus `/` (angka kunci, terbaru, cerita) | layar | F1 | M | belum |
| JM-E02 | Sensus `/perusahaan` (tabel, chip sektor berhitungan, cari) | layar | F1 | M | belum |
| JM-E03 | Profil `/p/<slug>` gaya 1001 (ringkas, sumber, keyakinan, Terhubung, Sejenis) | layar | F1 | L | belum |
| JM-E04 | Peta `/peta` (MapLibre, panel tarik, logo bundar, lapisan) | layar | F1 | L | belum |
| JM-E05 | `/metode` (cara hitung, tingkat bukti, skor, sumber) | layar | F1 | S | belum |
| JM-E06 | Hak koreksi + antrean kurator | worker+layar | F1 | M | belum |
| JM-E07 | Layar kurasi `/admin`: entitas, fakta, ikatan, sumber (PRD F-M4) | layar+worker | F1 | M | belum |
| JM-F01 | Rantai pasok `/rantai` (pemasok kiri, pelanggan kanan) | layar | F2 | L | belum |
| JM-F02 | Pembiaya `/pembiaya` (peringkat, portofolio) | layar | F2 | M | belum |
| JM-F03 | Kuadran BUMN energi `/bumn` (pemilih X/Y, skor bersumber) | layar | F2 | L | belum |
| JM-F04 | Listrik data center `/data-center` (matriks risiko) | layar | F2 | M | belum |
| JM-F05 | Energi desa `/desa` (PLTS desa, KDMP, DRE) | layar | F2 | M | belum |
| JM-F06 | Rapor provinsi `/wilayah/<prov>` | layar | F2 | L | belum |
| JM-F07 | Kebijakan `/kebijakan` + jejak isu (RUU EBET dst.) | layar | F2 | M | belum |
| JM-F08 | Cerita data `/cerita` (Jawaban singkat, Cara menghitung, Cara mengutip, beku) | layar | F2 | M | belum |
| JM-F09 | Riwayat dengan METI + agenda METI Wilayah | worker+layar | F2 | M | belum |
| JM-F10 | Sinkron berita dan acara dari API metiires.or.id | pipa | F2 | S | belum |
| JM-P01 | Data proyek ke `entitas`/`fakta`/`ikatan` (K17): impor `data-panen/proyek` + program + COD target/aktual | pipa | F1 | M | belum |
| JM-P02 | Pelacak proyek `/proyek` (peta klaster per teknologi/status, saringan program/provinsi, funnel status, daftar terlambat COD) | layar | F1 | L | belum |
| JM-P03 | Profil proyek `/p/<id>` (garis waktu PPA-COD, pihak, pendana, regulasi, berita) ID/EN; ikon Google Maps per proyek (`google.com/maps/search/?api=1&query=lat,lng`, label presisi lokasi bila bukan titik persis) juga di kartu daftar `/proyek` | layar | F1 | L | belum |
| JM-P04 | Profil perusahaan (direksi dengan foto beratribusi, proyek, rantai, kontak korporat: alamat, telepon, surel umum, ikon Maps kantor) + profil orang (riwayat jabatan, `pernah-birokrasi` netral) | layar | F1 | L | belum |
| JM-P05 | Rantai pasok PLTS 100 GW: kebutuhan per tahun vs kapasitas pabrikan lokal/ekspor/TKDN | layar+pipa | F2 | M | belum |
| JM-P06 | Regulasi terhubung ke proyek (ikatan `diatur_oleh`/`terhambat_oleh` bersumber) | pipa+layar | F2 | M | belum |
| JM-P07 | Rapor Transisi Energi kuartalan (beku, tautan kutip, PDF) | layar+pipa | F2 | M | belum |
| JM-P08 | Bagian Pengurus METI (Dewan Pembina, Pengurus Harian, Bidang, METI Institute, Wilayah) dengan foto resmi, di `/organisasi/meti` dan `/tentang#pengurus` | pipa+layar | F1 | M | belum |
| JM-R01 | Migrasi 0007: kategori organisasi K19, `program`, kelompok orang, `akun.telepon`, profil milik akun, verifikasi surel | migrasi | F1 | M | belum |
| JM-R02 | `/daftar` + verifikasi surel (DITUNDA pemilik 7 Nov 2026: masa uji, akun dibuat manual oleh admin lewat `/admin` + tautan aktivasi) | worker+layar | F3 | L | tunda |
| JM-R03 | `/profil-saya`: sunting profil, unggah foto R2 (gambar saja, maks 2 MB, EXIF dibuang), pendidikan, tautan, privasi kontak | worker+layar | F1 | L | belum |
| JM-R04 | Tab kelompok orang (Profesional, Praktisi, Akademisi, Think Tank, Tokoh Publik, Aktivis/Tokoh Daerah) dan saringan kategori organisasi K19 | layar | F1 | M | belum |
| JM-R05 | Panen aktivis, tokoh daerah EBT, dan organisasi mahasiswa (SRE, Dewan Energi Mahasiswa, BEM) | pipa | F1 | M | belum |
| JM-Q01 | Potensi vs realisasi per provinsi (potensi teknis ESDM, terpasang, target RUED) | pipa+layar | F2 | M | belum |
| JM-Q02 | Indeks kesiapan investasi provinsi (regulasi daerah, jaringan, lahan, RUED; metode terbuka) | pipa+layar | F3 | L | belum |
| JM-Q03 | Pelacak tarif dan harga (PPA per teknologi, hasil lelang, BPP per sistem) | pipa+layar | F2 | M | belum |
| JM-Q04 | Pemantau pengadaan (lelang PLN, IPP, LPSE) sebagai papan peluang | pipa+layar | F3 | M | belum |
| JM-Q05 | Linimasa regulasi (status RUU EBET, aturan baru, dampak ke proyek terhubung) | pipa+layar | F2 | M | belum |
| JM-Q06 | Pencari narasumber per kepakaran K16 (media, DPR) | layar | F2 | S | belum |
| JM-Q07 | Pelacak rotasi jabatan (perubahan direksi/komisaris dari RUPS/keterbukaan IDX) + notifikasi | pipa+worker | F3 | M | belum |
| JM-Q08 | Ikuti proyek/perusahaan/provinsi + ringkasan mingguan surel | worker+layar | F3 | M | belum |
| JM-Q09 | Kalender ekosistem (acara, rapat Komisi XII, tenggat lelang dan regulasi) | pipa+layar | F2 | M | belum |
| JM-Q10 | Lapangan kerja hijau per provinsi (dari data proyek bersumber) | pipa+layar | F2 | S | belum |
| JM-Q11 | Kalkulator manfaat per proyek (emisi dihindari, kerja, devisa; cara hitung terbuka, label EST) | layar | F2 | M | belum |
| JM-Q12 | Pelacak dana iklim (JETP, ADB, WB, green sukuk/bond sampai ke proyek) | pipa+layar | F3 | L | belum |
| JM-Q13 | Isu sosial dan lingkungan per proyek (lahan, AMDAL, keluhan; sumber media, hak jawab) | pipa+layar | F3 | M | belum |
| JM-Q14 | Perbandingan ASEAN (Ember, IRENA) | pipa+layar | F2 | S | belum |
| JM-G01 | Klaim profil oleh entitas | worker+layar | F3 | M | belum |
| JM-G02 | Daftar mandiri + verifikasi Sekretariat (C-09) | worker+layar | F3 | M | belum |
| JM-G03 | API terbuka baca potret publik | worker | F3 | S | belum |
| JM-G04 | Pencocokan kebutuhan proyek ke pakar/penyedia | layar | F3 | L | belum |
| JM-H01 | Uji ujung ke ujung login sampai kurasi | gerbang | semua | M | belum |
| JM-H02 | Uji layar 1440 dan 390, terang dan gelap, ID dan EN | gerbang | semua | M | belum |
| JM-H03 | Penyelarasan konteks bersih (PENYELARASAN.md) | peninjau | semua | M | belum |
| JM-H04 | Commit, migrasi produksi, deploy `[induk]` `[manusia]` | induk | semua | S | belum |

## 3. Tiket

### 3.A Fondasi

#### JM-A01 Armada agent `[induk]`
- **Tujuan:** roster agent (pengerja `worker`, `layar`, `pipa`, `mekanik`, `gerbang`; pemeriksa `guard-api`, `security-reviewer`, `selera-angka`, `inp-reviewer`, `migrasi-idempoten`), `AGENTS.md` dengan peta modul dan "baca dulu, baru bangun", `CLAUDE.md`.
- **Berkas:** `AGENTS.md`, `CLAUDE.md`, `.claude/agents/*.md`, `.claude/settings.json`.
- **Selesai bila:** tiap agent punya `model:`; tiap glob berkas punya satu pemilik.
- **Rujukan:** R2 §6. **Ukuran:** S

#### JM-A02 Kerangka repo
- **Berkas:** `package.json` (skrip `uji`, `dev`), `wrangler.jsonc` (id kosong), `.gitignore` (`.dev.vars`, `.wrangler`), `.github/workflows/uji.yml`.
- **Bukti:** `npm run uji` hijau di CI. **Ukuran:** S

#### JM-A03 `[manusia]` Sumber daya Cloudflare
- **Isi:** pemilik membuat D1 `jaringan-meti`, R2 `jaringan-meti`, Worker `jaringan-meti`, secret `OPENALEX_KEY`, lalu mengisi id di `wrangler.jsonc` lokal.
- **Penghambat:** C-02, C-06.

#### JM-A04 `src/util.js`
- **Tujuan:** ambil `json`, `gagal`, `bacaBody`, `cacheTepi`, `ipHash`, `acak` dari `src/worker.js` asal; putus impor sirkular asal.
- **Bukti:** `node --test tests/util.test.mjs`. **Rujukan:** R1 §9.1, §9.2. **Ukuran:** S

#### JM-A05 Router dan CSP
- **Berkas:** `src/worker.js` (router objek `"METODE /path/:id"`, tabel halaman, pengalih), `public/_headers`.
- **Selesai bila:** halaman tanpa izin dialihkan ke `/masuk?ke=`; CSP tanpa skrip inline; `noindex` di `/direktori` dan `/admin`.
- **Rujukan:** R1 §5.2. **Ukuran:** M

### 3.B Login, admin, RLS

#### JM-B01 Migrasi akun
- **Berkas:** `migrations/0001_akun.sql`: `akun(id, surel UNIQUE, nama, peran CHECK IN ('anggota','pengurus','kurator','wilayah','admin','super'), cakupan_prov, garam, sandi, status, aktivasi_hash, aktivasi_sampai, dibuat, dibuat_oleh, dummy)`, `sesi(id_hash, akun_id, sampai, ip_hash)`, `laju(kunci, jumlah, jendela)`.
- **Pemeriksa:** `migrasi-idempoten`. **Bukti:** uji SQL Miniflare: peran tak sah DITOLAK. **Ukuran:** M

#### JM-B02 Sandi PBKDF2
- **Antarmuka:** `hashSandi(sandi) -> {garam, hash}`, `cocokSandi(sandi, garam, hash)` (WebCrypto, 210.000 iterasi, perbandingan waktu tetap).
- **Bukti:** `node --test tests/sandi.test.mjs`. **Ukuran:** S

#### JM-B03 Sesi
- **Rute:** `POST /api/masuk`, `POST /api/keluar`, `GET /api/saya`. Cookie `sesi` HttpOnly Secure SameSite=Lax, 14 hari, hanya hash di D1. Batas 10 gagal per 15 menit per IP dan per surel.
- **Pemeriksa:** `guard-api`, `security-reviewer`. **Ukuran:** M

#### JM-B04 `src/hak.js` (RLS)
- **Tujuan:** satu-satunya pintu D1. `boleh(peran, aksi, tabel, baris, akun)`; `baca(env, akun, tabel, kueri)` menambah klausa cakupan (`dummy`, `cakupan_prov`, `pemilik`); `tulis()` menolak kolom di luar daftar putih.
- **Selesai bila:** tiap sel matriks KPV §1 punya uji izinkan dan uji DITOLAK; gerbang memindai `env.DB.prepare` di luar `hak.js` = merah.
- **Bukti:** `node --test tests/hak.test.mjs tests/gerbang-d1.test.mjs`. **Ukuran:** L

#### JM-B05 Admin akun
- **Rute:** `GET/POST /api/admin/akun`, `PATCH /api/admin/akun/:id`, `POST /api/admin/akun/:id/aktivasi` (tautan sekali pakai 72 jam, disalin Admin; surel menunggu C-08).
- **Layar:** `/admin` tab Akun (tabel, cari, peran, status, salin tautan).
- **Selesai bila:** admin tidak bisa menaikkan diri jadi super; super terakhir tidak bisa dinonaktifkan. **Ukuran:** M

#### JM-B06 Halaman masuk
- **Berkas:** `public/masuk.html`, `public/aktivasi.html`, `public/ganti-sandi.html`, `public/masuk.js`. ID/EN. **Ukuran:** S

#### JM-B07 Jejak
- **Isi:** tiap tulis D1 menulis `jejak(siapa, kapan, aksi, tabel, id, dari, ke)`; layar `/admin` tab Jejak. **Ukuran:** S

### 3.C Porting direktori

#### JM-C01 Token dan kepala
- **Berkas:** `public/inti/tema.css`, `kepala.css`, `gaya.css`, `public/tema.js`, logo METI putih di `public/img/`.
- **Rujukan:** R5 §6.2, DS §2. **Ukuran:** S

#### JM-C02 Port layar direktori
- **Tujuan:** salin `akademisi.html`, `akademisi.js` (3.961 baris), `akademisi.css`, `fungsi_direktori.js` ke `public/direktori.*`; ganti `fetch("/api/akademisi` jadi `/api/direktori`; buang `kepala.js`/`bencana.json`; buang fetch data sistem BNPB (R1 §9.4 A7).
- **Di luar:** tab baru F1–F2. **Bukti:** `node --test tests/direktori-layar.test.mjs`. **Ukuran:** L

#### JM-C03 Konstanta domain
- **Isi:** `RUMPUN` -> `SEKTOR` (ALG §2), `KAT` (10 kategori lembaga energi), `TABS` (Pakar, Lembaga, Wilayah, Inovasi, Riset, Sistem data, Pendanaan, Pustaka; Donasi dibuang; Kejadian besar -> Jejak isu), `DIRI` = METI, teks BNPB/BPBD diganti, surel `mailto` OpenAlex diganti surel resmi METI.
- **Bukti:** `grep -nE "BNPB|BPBD|karhutla|DIBI" public/direktori.js` kosong. **Ukuran:** M

#### JM-C04 Worker direktori
- **Tujuan:** `src/akademisi.js` -> `src/direktori.js`; `P_AKADEMISI` diganti cek `hak.js`; `DATA_AKADEMISI` dipangkas ke berkas METI; prompt Workers AI bahasa energi.
- **Pemeriksa:** `guard-api`. **Ukuran:** M

#### JM-C05 Data contoh dan dummy
- **Isi:** data contoh energi fiktif (`example.org`, akhiran "(contoh)") sebagai fixture uji dan seed D1 lokal/pratinjau. TANPA tombol dummy (KP K15). **Ukuran:** S

#### JM-C06 i18n
- **Berkas:** `public/i18n/id.json`, `en.json`, `public/i18n.js` (`t(kunci)`, `angka(n)`, `tanggal(d)`), tombol ID/EN di kepala.
- **Bukti:** gerbang: kunci di `id.json` = kunci di `en.json`; tidak ada teks Indonesia tertanam di JS layar baru. **Ukuran:** M

#### JM-C07 Gerbang layar asal
- **Isi:** port `direktori-seg`, `direktori-klik`, `direktori-layar`, `direktori-versi`, `hubung.test`, `lembaga-gabung.test`, gerbang CSP, gerbang dummy, gerbang titik tengah. **Ukuran:** M

### 3.D Data dan pipeline

#### JM-D01 Skema kurasi
- **Berkas:** `migrations/0003_entitas.sql`: `entitas(id, jenis, slug, nama, nama_en, ringkas, ringkas_en, sektor, prov, lat, lon, situs, lapis, status, dummy)`, `fakta(id, entitas_id, kunci, nilai, satuan, per_tanggal, est, sumber_id)`, `ikatan(id, dari, ke, jenis, per_tanggal, sumber_id)`, `sumber(id, url, jenis CHECK IN ('dokumen-resmi','filing','situs-sendiri','media','data-terbuka','via-pihak-ketiga'), diperiksa)`.
- **Selesai bila:** `fakta.sumber_id` dan `ikatan.sumber_id` NOT NULL; uji DITOLAK. **Ukuran:** M

#### JM-D02 Penjaga unggah
- Port `jaga_unggah.mjs`: tolak berkas susut > 20%, JSON rusak, baris tanpa sumber, pola surel/telepon di potret publik. **Ukuran:** S

#### JM-D03 Pakar OpenAlex
- Port `perbarui.py`: topik energi (ID topik OpenAlex, bukan subbidang 2105 yang terlalu longgar), `country_code:ID`, karya >= 3; `OPENALEX_KEY` wajib. **Rujukan:** R8. **Ukuran:** M

#### JM-D04 OSM pembangkit
- Overpass `power=plant` per provinsi (nasional timeout), user-agent khusus, atribusi ODbL. **Ukuran:** M

#### JM-D05 Statistik terbuka
- Ember CSV, OWID CSV, IRENASTAT PxWeb, World Bank Indicators dan Projects. Keluaran `fakta` bertanggal per provinsi atau nasional. **Ukuran:** M

#### JM-D06 Regulasi
- peraturan.bpk.go.id (sitemap) + JDIH ESDM: regulasi EBT, status berlaku, relasi mengubah/mencabut. **Ukuran:** M

#### JM-D07 `[manusia]` Seed METI
- Kurator memasukkan 12 anggota + 12 mitra metiires.or.id, pengurus SK 0008 (nama + jabatan), 6 METI Wilayah diresmikan, agenda 2026. Penghambat C-10, C-11.

#### JM-D08 1001startup.id energi
- Hanya setelah C-13: ambil nama, sektor, lokasi, relasi, dan URL sumber primer; label `via-pihak-ketiga`; tanpa teks dan logo. **Status:** panen awal selesai 7 Nov 2026 (R13: 89 entitas, 508 ikatan, `scripts/panen/panen_1001.mjs`); tampil publik menunggu izin tertulis (C-13).

#### JM-D09 AESI, GEM, WRI
- AESI daftar anggota (dedup), GEM unduhan manual (saring baris CC BY-NC bila perlu), WRI GPPD (hanya 178 pembangkit Indonesia, tanpa surya/angin; tanda lemah). **Ukuran:** M

#### JM-D10 Graf
- Port `hubung.mjs`: `ALIAS` energi (PLN, ESDM, EBTKE, DEN, PGE, Pertamina NRE, IESR, ...), `DIRI` METI, jenis ikatan ALG §3. **Bukti:** `node --test tests/hubung.test.mjs`. **Ukuran:** L

#### JM-D11 Daftar tolak
- `daftar-tolak.json` privat di R2; uji bahwa id di daftar tidak muncul di potret mana pun. **Ukuran:** S

#### JM-D12 Potret per lapis
- `potret/publik/*.json`, `potret/anggota/*.json`, `potret/pengurus/*.json`; kolom pribadi hanya di lapis pengurus. **Bukti:** gerbang pindai potret publik. **Ukuran:** M

#### JM-D13 Skor keyakinan
- Rumus ALG §4 (jumlah sumber, jenis sumber, umur periksa, kecocokan antar sumber); keluaran 0-1 + label Tinggi/Sedang/Rendah + kalimat alasan. **Pemeriksa:** `validasi-model`. **Ukuran:** M

### 3.E Layar sensus F1

#### JM-E01 Beranda
- Jawaban singkat ("Per <tanggal>, sensus mencatat N entitas EBT di M provinsi ..."), 4-5 kartu angka, cerita terbaru, pita "Draf kerja, sumber publik saja, angka turunan berlabel estimasi". **Ukuran:** M

#### JM-E02 Sensus perusahaan
- Tabel (Entitas, Sektor, Provinsi, Pemasok, Pelanggan, Proyek, MW), chip sektor berhitungan, cari, urut, "di luar sensus" untuk entitas tanpa profil. **Ukuran:** M

#### JM-E03 Profil
- Urutan bagian: kepala (logo, nama, nama badan hukum, pil sektor, nomor sensus), ringkas bertanggal, tombol situs, lalu baris fakta (Pendiri/Pimpinan, Berdiri, Kapasitas, Proyek, Pendanaan, Lokasi) tiap baris bersumber, Investor/Pembiaya, Pemasok, Pelanggan, Proyek, Terhubung, Keyakinan (skor + alasan), Sumber, Sejenis. Kartu per bagian. **Ukuran:** L

#### JM-E04 Peta
- Port peta Lembaga asal + logo bundar, lapisan (proyek, entitas, METI Wilayah), panel tarik, "Terbang ke". **Pemeriksa:** `inp-reviewer`. **Ukuran:** L

#### JM-E05 Metode
- Tingkat bukti, jenis sumber, skor keyakinan, label EST, tanggal beku, cara mengutip. **Ukuran:** S

#### JM-E06 Koreksi
- Port `koreksi` asal ke D1 lewat `hak.js`; antrean kurator di `/admin`. **Ukuran:** M

#### JM-E07 Layar kurasi
- **Tujuan:** kurator menambah dan mengubah entitas, fakta, ikatan, dan sumber lewat `/admin` tab Kurasi; tiap simpan wajib sumber, tanggal periksa, tingkat bukti.
- **Berkas:** `public/admin/kurasi.js`, rute kurasi di `src/kurasi.js` lewat `hak.js`.
- **Pemeriksa:** `guard-api`. **Rujukan:** PRD F-M4. **Ukuran:** M

### 3.F Halaman F2

JM-F01 sampai JM-F10 mengikuti fitur PRD §5 sampai §10 (peta tiket ke fitur di PRD §11.1). Pola wajib tiap halaman: Jawaban singkat, kartu angka, komponen utama, "Cara menghitung", "Cara mengutip" dengan tanggal beku, tautan ke profil. Kuadran (`F03`) dan matriks risiko (`F04`) memakai skor 0-5 bersumber dengan pil "Hipotesis" sampai C-16 dijawab.

### 3.G Halaman F3

JM-G01 sampai JM-G04 menunggu C-01 dan C-09.

### 3.H Lintas

#### JM-H01 Uji ujung ke ujung
- Admin buat akun, aktivasi, masuk, kurator tambah fakta bersumber, potret dibangun, publik melihat tanpa kontak, anggota melihat lebih, peran salah DITOLAK. **Ukuran:** M

#### JM-H02 Uji layar
- Playwright 1440 dan 390, terang/gelap, ID/EN, tanpa galat konsol, INP < 200 ms pada klik tab dan chip. **Ukuran:** M

#### JM-H03 Penyelarasan
- Subagent tanpa riwayat membandingkan kode dengan paket; menulis `PENYELARASAN.md`. **Ukuran:** M

#### JM-H04 `[induk]` `[manusia]` Rilis
- Commit path spesifik, `wrangler d1 migrations apply --remote` oleh pemilik, deploy, cek `/api/status`. **Ukuran:** S

## 4. Grafik dependensi

```
A01 ─> A02 ─> A04 ─> A05 ─┬─> B01 ─> B02 ─> B03 ─> B04 ══> B05 ─> B06
                          │                          └─> B07
A03[manusia] ─────────────┤
                          └─> C01 ─> C02 ─> C03 ─> C05 ─> C07
                                     C04 (setelah B04)   C06
B04 ══> D01 ─> D02 ─> D03,D04,D05,D06,D09 ─> D10 ─> D11 ─> D12 ─> D13
D07[manusia], D08[tertahan] ─> D10
D12 ══> E01, E02, E03, E04, E05, E06 ══> F01..F10 ─> G01..G04
H01, H02 di akhir tiap fase; H03 ─> H04
```
Jalur kritis: A01 > A02 > A04 > A05 > B01 > B04 > D01 > D10 > D12 > E03.

## 5. Jalur kerja (satu pekerja per jalur, tidak berbagi berkas)

| Jalur | Tiket | Berkas milik |
| --- | --- | --- |
| W (worker) | A04, A05, B01-B05, B07, C04, D01, E06 | `src/**`, `migrations/**` |
| L (layar) | B06, C01-C03, C05, C06, E01-E05, F01-F09 | `public/**` |
| P (pipa) | D02-D13, F10 | `scripts/**` |
| G (gerbang) | C07, H01, H02 | `tests/**` |

## 6. Penghambat dari pemilik

| Kode | Butuh | Menahan |
| --- | --- | --- |
| C-02, C-06 | domain dan akun Cloudflare | A03, H04 |
| C-08 | penyedia surel | surel otomatis B05 |
| C-10, C-11 | izin data anggota dan pengurus | D07 |
| C-13 | izin 1001startup.id | D08 |
| C-01, C-09 | status resmi, daftar mandiri | G01-G04 |
