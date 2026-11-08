# Audit Serah Terima: Platform Jaringan METI

Tanggal audit: 8 November 2026. Cakupan: clone `/Users/priyankaalfatehan28/Developer/platformmeti` (cabang `main`, working tree bersih, 3.910 berkas terlacak, 231 commit). Metode: audit-teknis 4 fase, hanya baca, tidak ada kode diubah. Label: **[F]** fakta terverifikasi di berkas, **[P]** penilaian, **[D]** dugaan yang belum diverifikasi tuntas.

Area yang hanya ditinjau ringan: isi 340 skrip panen/pipa (pola saja), isi 892 JSON data, 2.788 baris `src/hak.js` (struktur saja), logika 99 halaman HTML. Kedalaman ada di kebersihan kepemilikan, operasi, dokumentasi, dan permukaan keamanan.

---

## 1. Ringkasan Eksekutif

**Nilai kesehatan teknis: B-. Nilai kesiapan dijual: D+.**

Mesin teknisnya sehat untuk usianya: 1.651 uji (1.643 lulus, 8 dilewati) selesai 37 detik; CSP ketat tanpa `unsafe-inline`; CSRF berlapis; kuki `HttpOnly; Secure; SameSite=Lax`; migrasi D1 berurut 0001 sampai 0034; tanpa build step. Yang belum layak diserahkan adalah bungkusnya: tidak ada LICENSE, SECURITY, CHANGELOG; README hanya 1 KB dan usang; `.dev.vars.example` hanya mencatat 1 dari 16 variabel yang dipakai kode; tidak ada cadangan D1/R2 terjadwal; repo penuh jejak kerja internal dan rujukan ke proyek lain.

Tiga risiko teratas:
1. **Kepemilikan akun dan repo kabur.** Repo ada di `github.com/timitbnpb/platformmeti`; akun Cloudflare tertulis milik tim IT BNPB, bukan penjual atau klien.
2. **Lisensi data pihak ketiga.** Data GEM (CC BY-NC-SA, nonkomersial), foto Wikimedia orang sungguhan (CC BY-SA 4.0), dan data OSM (ODbL) tertanam di repo yang akan dijual.
3. **Riwayat git dan jejak internal.** `.git` 528 MB, blob 29,6 MB "Claude outputs", surel pribadi di metadata commit, `.claude/` dan `AGENTS.md` berisi instruksi agent, jalur lokal `/Users/...` di kode.

Tiga peluang teratas:
1. Satu paket serah terima (README, ARSITEKTUR, RUNBOOK, KAMUS-DATA, SECURITY, LISENSI-DATA) menaikkan nilai jual lebih besar daripada refaktor kode.
2. Memecah 469 berkas datar di `public/` per modul aman karena uji sudah ada.
3. Workflow cadangan harian dan uji asap live menutup celah operasi terbesar dengan biaya kecil.

---

## 2. Peta Repo

Jenis: situs direktori dan sensus energi terbarukan untuk METI. Cloudflare Worker (`src/worker.js`) + static assets (`public/`) + D1 (`DB`) + R2 (`BERKAS`) + Workers AI + Vectorize (`meti-tanya`). JavaScript ESM murni, tanpa framework, tanpa build. Kematangan: layanan produksi awal (domain `direktori.metiires.or.id`, cron `0 18 * * *`, `wrangler.jsonc:19-27`).

| Direktori | Isi (terverifikasi) |
| --- | --- |
| `public/` | 83 MB; 2.950 berkas terlacak; **469 berkas langsung di root** (267 `.js`, 99 `.html`, 96 `.css`); subfolder `img` (1.463 berkas, 25 MB), `data` (892 JSON, 41 MB), `inti` (68, modul bersama), `og`, `vendor`, `geo`, `fonts`, `i18n` |
| `src/` | 43 modul Worker, 8.150 baris; `hak.js` 2.788 baris (matriks hak, "RLS tiruan"), `agenda.js` 548, `direktori.js` 427, `worker.js` 334 |
| `migrations/` | 0001 sampai 0034 (1.761 baris SQL) |
| `scripts/` | 340 berkas: `panen` (pengambil data per sumber), `pipa` (potret/skor/indeks), `mesin` (seed lokal, uji asap), `agents` (generator armada agent), `hukum` (Python 1.145 baris) |
| `data/` | 75 MB bahan olah (GEM, lahan, strategis, internasional, dll), sebagian terlacak |
| `tests/` | 203 berkas uji `node:test` + fixture |
| `docs/` | `perencanaan/` (27 berkas, sekitar 118 ribu kata), `riset/`, `buku-pegangan/`, `ATURAN-PEMILIK.md`, `internal/` (gitignore) |
| `.claude/`, `AGENTS.md`, `CLAUDE.md` | konfigurasi dan instruksi agent (terlacak, 40 berkas di `.claude/`) |
| tidak semestinya terlacak | `agenda-struktur.bundle` (root, 95 KB), `artefak/rencana-jaringan-meti.html`, `raw/openalex_kampus/*.json` (14 berkas), `.claude/launch.json` |

Hal mengejutkan: tidak ada CD (deploy manual oleh pemilik), cadangan hanya direncanakan di dokumen, `docs/perencanaan/OPERASIONAL.md` berukuran 0 byte, `data-panen/` lokal 3,8 GB (gitignore, tidak ikut repo).

---

## 3. Skor Kesiapan per Area (0-10)

| Area | Skor | Catatan singkat |
| --- | --- | --- |
| Kebersihan kepemilikan dan hukum | 2 | rujukan BNPB, akun pihak lain, lisensi data, tanpa LICENSE |
| Dokumentasi penerima | 3 | perencanaan sangat tebal, dokumentasi operasi dan penerima nyaris kosong |
| Operasi dan pemulihan | 4 | wrangler rapi, tetapi tanpa cadangan, tanpa CD, env contoh tak lengkap |
| Struktur repo | 5 | konsisten dan terdokumentasi, tetapi `public/` datar dan berkas raksasa |
| Keamanan aplikasi | 7 | header, CSRF, kuki, hak terpusat baik; perlu tinjauan per-situs `innerHTML` |
| Kualitas kode | 6 | tanpa build, modular di `src/`, tetapi `direktori.js` 662 KB dan `hak.js` besar |
| Uji dan CI | 7 | 1.643 lulus, cepat; CI hanya `npm run uji`, tanpa lint/higiene/asap |
| Kinerja | 5 | beberapa JSON 1,2 sampai 3 MB, `direktori.js` 662 KB |

---

## 4. Laporan Audit

### 4.1 Kritis

**K1. Akun dan repo bukan milik pihak yang menjual.** [F]
- Remote `origin` = `https://github.com/timitbnpb/platformmeti.git`.
- `docs/perencanaan/INFRASTRUKTUR.md:66` dan `:78`: akun Cloudflare adalah "Timitbnpb@gmail.com's Account" milik tim IT BNPB, dengan catatan "serah ke METI (§12)". Surel pihak ketiga tertulis di repo publik.
- Konsekuensi: Worker, D1 (`wrangler.jsonc:16`), R2, dan domain tidak dapat dipindahkan oleh penjual bila akunnya bukan miliknya; pembeli bisa menerima kode saja.

**K2. Data berlisensi nonkomersial dan berbagi-serupa tertanam, bertentangan dengan dokumen sendiri.** [F]
- `docs/perencanaan/KEAMANAN-PRIVASI.md:190`: GEM (CC BY-NC-SA) "hanya tautan, bukan salinan"; OpenCorporates ODbL berbagi-serupa.
- Kenyataan: `data/gem/coal.json` (516 KB), `geothermal`, `hydropower`, `solar`, `wind` terlacak; `public/data/gem_pembangkit.json`, `public/data/pemangku/gem_geothermal_L1000007*.json`, `data/proyek_gem.json` (365 KB) ada di repo dan sebagian tayang publik.
- Konsekuensi: lisensi NC melarang penggunaan komersial; menjual platform yang menyajikan salinan GEM berisiko sengketa. Wajib dicabut atau dimintakan izin tertulis.
- `public/data/geo/jaringan_osm.geojson` (570 KB) turunan OSM: ODbL mewajibkan atribusi dan berbagi-serupa basis data turunan. File ada [F]; atribusi di layar belum diverifikasi [D].

**K3. Foto orang sungguhan dari Wikimedia dalam repo.** [F]
- `data/foto_orang_kredit.json` mencatat lisensi `CC BY-SA 4.0` per foto (contoh Agung Wicaksono, penulis "Mgglputs"). `public/img/orang/` 128 berkas, `public/img/pengurus/` 116 berkas.
- Konsekuensi: CC BY-SA mewajibkan atribusi dan berbagi-serupa; foto tokoh juga data pribadi (UU PDP 27/2022) dan menyangkut hak potret. Pembeli perlu daftar kredit yang tayang di situs dan keputusan foto ikut dijual atau tidak.

**K4. Instruksi dan jejak agent terlacak di repo.** [F]
- 40 berkas `.claude/` (agents, ilmu-agent, settings, `launch.json`), `AGENTS.md` (8,4 KB), `CLAUDE.md`. `AGENTS.md:3` merujuk `gemah-ripah/pangantara` dan `~/.claude/AGEN.md` (jalur di luar repo). 24 commit berautor `Claude <noreply@anthropic.com>`.
- Konsekuensi: pembeli menerima instruksi internal penjual dan rujukan ke proyek lain; instruksi "berhenti dan tanya pemilik" akan menghalangi alat bantu pembeli.

### 4.2 Tinggi

**T1. Riwayat git berat dan membawa artefak internal.** [F] `.git` 528 MB, pack 396 MB; blob 29.651.937 byte `Claude outputs/agenda-struktur-v2.bundle` ada di riwayat (kini di-gitignore); `agenda-struktur.bundle` (95 KB) masih terlacak di root. Tidak ditemukan `PRIVATE KEY` atau pola kunci panjang di berkas terlacak. Pemindaian riwayat penuh dengan alat khusus belum dijalankan [D].

**T2. Metadata commit memuat surel pribadi.** [F] Penulis: `pinkatitan@gmail.com`, `mbgbangkabelitung@gmail.com` (205 commit), `68919761+pinkaariffia@users.noreply.github.com`. Konsekuensi: surel pribadi ikut terjual bersama riwayat.

**T3. Jalur lokal dan rujukan proyek lain di kode dan dokumen.** [F]
- `scripts/pipa/klaim_lahan.mjs:15` bawaan `/Users/priyankaalfatehan28/Documents/GitHub/poskokarhutla/public/geo/kabupaten`.
- `scripts/pipa/pustaka.mjs:17` `/Users/priyankaalfatehan28/Documents/1. METI` dan `/Users/priyankaalfatehan28/Downloads/METI-...zip`.
- Rujukan poskokarhutla/pangantara/neraca-papua/BNPB/centurisk di sekitar 30 berkas: `docs/perencanaan/*` (PRD, KEPUTUSAN-METI, DESAIN-TEKNIS, dll), `docs/perencanaan/riset/R1,R3,R4,R7,R10,R11,R12,R13`, `docs/ATURAN-PEMILIK.md`, `data/lahan/kabupaten.json`, `data/risiko/mentah.json`.
- Konsekuensi: skrip tidak jalan di mesin lain; dokumen membuka sumber dan keputusan internal.

**T4. `.dev.vars.example` tidak lengkap.** [F] Berisi `OPENALEX_KEY=` saja, padahal `src/` membaca: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `MIDTRANS_SERVER_KEY`, `MIDTRANS_PRODUKSI`, `META_TOKEN`, `FB_PAGE_ID`, `IG_USER_ID`, `ICS_RAHASIA`, `IP_SALT`, `KTA_RAHASIA`, `PUSTAKA_RAHASIA`, `SAMPEL_BOT`, `OPENALEX_MAILTO`, `VERSI`. Konsekuensi: penerima tidak tahu rahasia apa yang harus dibuat; fitur login Google, pembayaran, dan sosial gagal tanpa petunjuk.

**T5. Tanpa cadangan nyata.** [F] `.github/workflows/` hanya `uji.yml`. `INFRASTRUKTUR.md:47` dan `:87` merencanakan bucket `jaringan-meti-cadangan` dan cadangan harian oleh CI; tidak ada workflow yang mengerjakannya. Konsekuensi: data D1 (akun, sesi, pendaftaran, pembayaran) tidak punya pemulihan selain fitur bawaan Cloudflare [D].

**T6. Tanpa LICENSE/SECURITY/CHANGELOG/CONTRIBUTING.** [F] Tidak ada di root. `package.json` versi `0.0.1`, tanpa bidang `license`. Konsekuensi: repo publik tanpa lisensi berarti hak cipta penuh pada penulis; pembeli tidak punya dasar hukum yang jelas.

**T7. Sumber data pihak ketiga tanpa tabel syarat.** [P] Panen dari 1001startup.id (`docs/perencanaan/TIRU-1001STARTUP.md`, riset R13), OpenAlex, katalog hukum (`public/data/hukum/katalog.json` 3,1 MB), Comtrade, Ember, Wikipedia/Wikidata. Tidak ada satu tabel "sumber, lisensi, boleh dijual atau tidak".

### 4.3 Sedang

**S1. `public/` datar.** [F] 469 berkas di root dengan pola `x.html`, `x.js`, `x.css`, `x_lib`. Sebagian sudah di `public/inti/`. [P] Pengelompokan per modul aman bila tautan HTML, rute worker, dan `_headers` disesuaikan dan uji menjaga.

**S2. Berkas raksasa.** [F] `public/direktori.js` 3.922 baris / 661.944 byte, baris terpanjang 4.044 karakter, 196 pemakaian `innerHTML`; `src/hak.js` 2.788 baris (203 baris >400 karakter); `public/direktori.css` 3.351 baris; `scripts/pipa/topik_bayu.mjs` 906. Apakah `direktori.js` dihasilkan alat atau ditulis tangan belum dikonfirmasi [D]; tidak ada halaman `public/*.html` yang memuatnya langsung (kemungkinan dimuat dinamis lewat `direktori_awal.js`) [D].

**S3. Dua sumber CSP.** [F] Isi sama di `public/_headers` dan `src/util.js:157`. Risiko selisih saat salah satu diubah; ada atau tidaknya uji pembanding belum diverifikasi [D].

**S4. `innerHTML` banyak.** [F] 234 kecocokan di 26 berkas `public/inti` dan sekitarnya, dipasangkan pembantu `esc` (`public/inti/umum.js`). [P] Pola disiplin, namun perlu tinjauan per-situs sebelum klaim bebas XSS ke pembeli. CSP `script-src 'self'` mengurangi dampak.

**S5. Ukuran JSON per halaman.** [F] Terbesar: `public/data/hukum/katalog.json` 3,1 MB, `istilah.json` 2,1 MB, `riset.json` 1,7 MB, `organisasi.json` 1,2 MB, `i18n/id.json` dan `en.json` sekitar 775 KB masing-masing, `kuadran.json` 653 KB; geojson total sekitar 10 MB; `/data/*` di-cache 300 detik (`_headers`). Pemetaan halaman ke JSON belum ada [D].

**S6. CI minimal.** [F] `.github/workflows/uji.yml`: `npm ci` lalu `npm run uji` setiap push dan PR. Tanpa lint/format, tanpa gerbang higiene, tanpa uji asap (`UJI_LIVE=1` dilewati), tanpa CD.

**S7. README usang.** [F] `README.md` menulis "Status 7 Nov 2026: tahap perencanaan dan kerangka", padahal sudah ada 34 migrasi, domain, dan cron. Tidak ada seed, rahasia, arsitektur, deploy, panen.

**S8. Wrangler dan lingkungan.** [F] Index Vectorize wajib dibuat manual (`wrangler.jsonc:14`, "tanpa index, deploy gagal"); env `pratinjau` tidak memuat Vectorize. ID D1 produksi dan pratinjau tertulis di repo (keputusan pemilik; bukan rahasia tetapi menautkan ke akun).

**S9. Surel kontak dikodekan keras.** [F] `meti.ires@gmail.com` di `public/inti/kepala.js:123`, `public/tentang.js:13`, `public/topik_bab.js:91`, `public/event_detail.js:104`, `public/kta_kartu.js:218`, `public/index.html:88`, `migrations/0013_event.sql:64`, `public/i18n/*.json:1102`, `data/event_mitra.json:6`. [P] Sebaiknya satu konstanta konfigurasi.

**S10. Data kontak dalam JSON publik.** [F] `public/data/organisasi.json` memuat nomor telepon dan satu bidang `surel`; `penyedia_teknologi.json` memuat bidang telepon/WA. Apakah korporat atau pribadi belum diverifikasi [D]. Gerbang pemindai surel pribadi sudah ada (`scripts/pipa/potret.mjs:768`).

**S11. Pembayaran Midtrans.** [F] `MIDTRANS_SERVER_KEY`; `/api/daftar/midtrans/notifikasi` dikecualikan dari CSRF (`src/worker.js:299`). Pengecualian wajar untuk webhook; verifikasi tanda tangan notifikasi belum diperiksa [D].

### 4.4 Rendah

- R1. `docs/perencanaan/OPERASIONAL.md` kosong (0 byte). [F]
- R2. `artefak/`, `raw/openalex_kampus/`, `.claude/launch.json`, `agenda-struktur.bundle` bukan bagian produk. [F]
- R3. Penamaan Indonesia konsisten (`hak`, `sesi`, `kuadran`), komentar campur; `GLOSARIUM.md` (15 KB) ada. [P]
- R4. `public/vendor/pptxgenjs/LISENSI.txt` (MIT) dan `qrcode/LISENSI.txt` ada; font Inter di `public/fonts/` tanpa berkas lisensi OFL. [F]
- R5. 340 skrip panen berpola `x.mjs` + `x_lib.mjs` konsisten, tanpa indeks skrip. [P]
- R6. `public/img/logo` 649 berkas dan `bendera` 97 berkas: merek dagang pihak ketiga; izin pemakaian belum terdokumentasi [D].

### 4.5 Kekuatan (dipertahankan)

- CSP, HSTS, `X-Frame-Options: DENY`, `Permissions-Policy` ketat (`public/_headers:1-9`). [F]
- CSRF berlapis `x-pb` + `Sec-Fetch-Site` + `Origin` (`src/worker.js:105-116`); kuki aman (`src/sesi.js:12`, `src/google.js:18`). [F]
- PBKDF2-SHA256 WebCrypto, garam, banding waktu tetap (`src/sandi.js:1`); jumlah iterasi belum diverifikasi. [F]
- Hak terpusat (`src/hak.js` `MATRIKS`, `boleh()`) dengan `tests/hak.test.mjs`. [F]
- Uji cepat dan hijau: 203 berkas, 1.651 uji. [F]
- Gerbang data pribadi di pipa potret (`scripts/pipa/potret.mjs`). [F]
- Dokumen perencanaan rinci dengan rantai otoritas jelas. [F]
- Tanpa build step; `npm ci` lalu `wrangler dev`. [F]

---

## 5. Strategi Peningkatan

- **Tema A, Bersihkan lalu serahkan.** Target: repo serah terima hanya berisi produk. Prinsip: yang dijual sama dengan yang boleh dijual.
- **Tema B, Hukum data sebelum kode.** Tiap dataset punya sumber, lisensi, dan status "boleh dijual / perlu izin / dicabut" dalam `LISENSI-DATA.md`.
- **Tema C, Dokumentasi untuk orang yang tidak hadir.** Penerima menjalankan, mengoperasikan, memulihkan sistem hanya dari `docs/serah-terima/`.
- **Tema D, Operasi yang bisa dibuktikan.** Cadangan harian, CD terkendali, uji asap live, env contoh lengkap.
- **Tema E, Struktur tanpa risiko.** Refaktor hanya bila ada uji penjaga.

Trade-off, TIDAK direkomendasikan sekarang: pindah ke framework/bundler; menulis ulang `hak.js`; memecah isi `direktori.js` per fungsi (cukup per berkas bila perlu); menerjemahkan semua identifier ke Inggris; menulis ulang riwayat (repo bersih baru lebih murah).

Definisi selesai: (1) nol temuan Kritis; (2) pencarian `/Users/`, `poskokarhutla`, `pangantara`, `BNPB` pada paket yang dijual kosong; (3) `LISENSI-DATA.md` mencakup 100% dataset; (4) orang baru berhasil `npm ci && npm run dev && npm run uji` hanya dari README; (5) pemulihan D1 dari cadangan dilatih sekali dan dicatat; (6) CI memeriksa uji + higiene.

---

## 6. Rencana Kerja Ber-Milestone

Total sekitar 96 jam kerja satu orang (sekitar 12 hari). S <2 jam, M setengah hari, L 1-2 hari.

### M1. Kebersihan dan keamanan (sekitar 30 jam)

| ID | Tugas | Area | Kriteria selesai | Jam | Risiko | Bergantung |
| --- | --- | --- | --- | --- | --- | --- |
| M1.1 | Putuskan paket yang dijual (bagian 8), buat repo serah terima baru tanpa riwayat | repo | repo bersih di akun tujuan, `.git` <30 MB | 4 | riwayat kerja hilang (arsipkan salinan lokal) | keputusan 1, 5 |
| M1.2 | Keluarkan `.claude/`, `AGENTS.md`, `CLAUDE.md`, `agenda-struktur.bundle`, `artefak/`, `raw/`, `docs/ATURAN-PEMILIK.md`, `docs/internal/` dari paket | repo | `git ls-files` tidak memuat berkas itu; uji tetap hijau | 3 | uji yang menagih `.claude/agents` (mis. `tests/gerbang-model-agent.test.mjs`) gagal, sesuaikan | M1.1 |
| M1.3 | Hapus jalur `/Users/...`; env tanpa nilai bawaan pribadi | `scripts/pipa/klaim_lahan.mjs:15`, `pustaka.mjs:17` | `grep -rn "/Users/"` kosong; skrip gagal dengan pesan jelas bila env kosong | 2 | skrip panen berhenti di mesin penjual | - |
| M1.4 | Netralkan rujukan proyek lain di docs, data, dan pindahkan riset internal ke arsip | `docs/perencanaan/**`, `data/lahan`, `data/risiko` | pencarian kata kunci kosong di paket | 6 | konteks keputusan hilang; simpan arsip | M1.2 |
| M1.5 | Audit lisensi data; cabut GEM NC atau lampirkan izin tertulis | `data/gem/*`, `public/data/gem_pembangkit.json`, `pemangku/gem_*`, `data/proyek_gem.json` | `LISENSI-DATA.md` lengkap; GEM dicabut atau izin dilampirkan | 6 | fitur pembangkit/proyek kosong | keputusan 4 |
| M1.6 | Atribusi foto Wikimedia tayang di layar atau foto dicabut | `data/foto_orang_kredit.json`, `public/img/orang`, `pengurus` | halaman kredit memuat penulis dan lisensi tiap foto, atau foto diganti | 4 | wajah kosong di profil | keputusan 4 |
| M1.7 | Pemindai rahasia atas seluruh riwayat (gitleaks/trufflehog); rotasi rahasia produksi sebelum serah | seluruh repo | 0 temuan, atau semua temuan dirotasi | 3 | - | - |
| M1.8 | Tinjau telepon/surel di `organisasi.json`, `penyedia_teknologi.json` | `public/data` | tiap kolom kontak punya dasar (korporat/publik) atau dihapus | 2 | direktori kehilangan kontak | - |

Kemenangan cepat M1 (<2 jam, dampak tinggi): M1.3; lepas `agenda-struktur.bundle` dari lacak; pindahkan `raw/` dan `artefak/` ke arsip.

### M2. Struktur dan refaktor aman (sekitar 38 jam)

| ID | Tugas | Area | Kriteria selesai | Jam | Risiko | Bergantung |
| --- | --- | --- | --- | --- | --- | --- |
| M2.1 | Jaring pengaman: `npm run uji` hijau + skrip pemeriksa tautan antarhalaman | tests | skrip tautan mati lulus | 4 | - | - |
| M2.2 | Pindahkan halaman ke `public/modul/<nama>/` bertahap (mulai 5 modul terkecil); perbarui `_headers`, rute `src/worker.js`, sitemap | `public/**`, `src/worker.js` | berkas di root `public/` <60; uji dan tautan hijau; uji asap lokal | 14 | tautan putus, SEO | M2.1 |
| M2.3 | Satu konfigurasi situs (surel, nama organisasi, domain) | `public/inti/konfig.js` | 10 lokasi S9 memakai konfigurasi | 4 | i18n tidak ikut | - |
| M2.4 | Satukan CSP: `_headers` sebagai sumber, uji gagal bila `src/util.js:157` berbeda | `public/_headers`, `src/util.js` | uji pembanding hijau | 2 | - | - |
| M2.5 | Konfirmasi asal `public/direktori.js`; pecah per bagian bila ditulis tangan | `public/direktori*.js` | tiap berkas <1.000 baris atau catatan "dihasilkan oleh X" | 8 | regresi tampilan | M2.1 |
| M2.6 | Peta halaman ke JSON dan ukurannya; kompres/pecah berkas >1 MB | `public/data`, `docs` | target usulan: data awal tiap halaman publik <1,5 MB | 6 | halaman lambat bila salah | M2.2 |

### M3. Dokumentasi serah terima (sekitar 26 jam)

Semua di `docs/serah-terima/`, bahasa Indonesia.

| ID | Dokumen | Kriteria selesai | Jam |
| --- | --- | --- | --- |
| M3.1 | `README.md` baru, `LICENSE` (sesuai keputusan), `CHANGELOG.md` v1.0.0 | orang baru menjalankan lokal dalam 15 menit | 4 |
| M3.2 | `ARSITEKTUR.md`: Worker, assets, D1, R2, AI, Vectorize, cron, alur panen ke potret ke publik | diagram + tabel binding | 4 |
| M3.3 | `KAMUS-DATA.md`: skema D1 dari 34 migrasi, indeks, trigger, matriks hak | tiap tabel punya satu baris deskripsi | 5 |
| M3.4 | `RUNBOOK.md`: deploy, migrasi D1 (lokal, pratinjau, produksi), seed, pembuatan rahasia, panen harian, unggah potret, bangun Vectorize, rollback, pemulihan | tiap prosedur ada perintah + verifikasi | 6 |
| M3.5 | `LISENSI-DATA.md`: sumber, lisensi, atribusi, boleh dijual atau tidak, tanggal ambil | cakup 100% dataset | 3 |
| M3.6 | `SECURITY.md` + `PRIVASI-UU-PDP.md`: data pribadi, dasar, retensi, insiden 3x24 jam | disahkan pemilik | 2 |
| M3.7 | `UTANG-TEKNIS.md` + `SERAH-AKUN.md` | semua item bagian 7 tercantum | 2 |

### M4. Operasi dan CI (sekitar 18 jam)

| ID | Tugas | Kriteria selesai | Jam | Risiko |
| --- | --- | --- | --- | --- |
| M4.1 | `.dev.vars.example` lengkap (16 variabel) + penjelasan | semua `env.*` di `src/` tercantum; uji membandingkan | 2 | - |
| M4.2 | Workflow cadangan D1 dan R2 harian ke bucket terpisah, simpan 30 hari | satu pemulihan percobaan sukses tercatat di runbook | 6 | kunci CI, biaya R2 kecil |
| M4.3 | Workflow CI: uji + higiene (rahasia, `/Users`, em dash, surel pribadi) | PR merah bila terlanggar | 3 | - |
| M4.4 | Workflow deploy manual (`workflow_dispatch`) dengan persetujuan + migrasi | deploy ke pratinjau sukses | 4 | rahasia CI |
| M4.5 | Uji asap live harian + pemantau uptime luar | notifikasi bila merah | 3 | - |

Sketsa tiga tugas teratas:
- **M1.1** Salin hanya berkas lolos daftar putih ke direktori baru, `git init`, commit awal "v1.0.0 serah terima", dorong ke repo tujuan. Jebakan: jangan salin `.git` atau `.dev.vars`; periksa `git ls-files | wc -l` dan ukuran.
- **M1.5** Turunkan tabel dari kolom `sumber`/`lisensi` di `data/*` dan `public/data/*`; telusuri JSON turunan lewat `scripts/panen/*`. Jebakan: berkas turunan menyembunyikan sumber aslinya.
- **M4.2** `wrangler d1 export` terjadwal di Actions, unggah ke R2 terpisah dengan kunci S3 hak minimum. Jebakan: token Cloudflare berlebih; uji pulih ke D1 pratinjau.

---

## 7. Daftar Serah Akun dan Aset

| Aset | Keadaan sekarang | Aksi |
| --- | --- | --- |
| Repo GitHub | `timitbnpb/platformmeti` (publik) | transfer atau repo baru di akun tujuan |
| Cloudflare (Worker, D1 `jaringan-meti`, R2 `jaringan-meti`, Vectorize `meti-tanya`) | akun tim IT BNPB (INFRASTRUKTUR.md:66,78) | akun baru milik pembeli; ekspor D1/R2, impor, buat ulang binding, ganti `database_id` |
| Zona dan domain `metiires.or.id` | tercatat dibuat di Cloudflare 7 Nov 2026 (`wrangler.jsonc:25`); pemegang registrar [D] | konfirmasi pemegang; pembeli menambah DNS |
| Google OAuth | rahasia di Worker | klien OAuth baru di proyek Google pembeli, perbarui redirect URI |
| Midtrans | kunci di Worker | akun merchant pembeli; produksi setelah uji sandbox |
| Meta (FB/IG) | token di Worker | aplikasi Meta pembeli |
| Workers AI, OpenAlex, IP salt, rahasia ICS/KTA/Pustaka | kunci di Worker | buat baru, jangan disalin |
| Surel kontak | `meti.ires@gmail.com` | konfirmasi kepemilikan METI |

---

## 8. Keputusan yang Harus Diambil Pemilik

1. **Siapa pembeli sebenarnya dan siapa pemilik sah kode?** METI, tim IT BNPB, atau penjual. Menentukan K1 dan lisensi.
2. **Lisensi kode:** proprietary dengan lisensi pakai, MIT/Apache, atau serah hak cipta penuh. Saat ini tidak ada LICENSE.
3. **Apa yang ikut dijual:** kode saja; kode + data olah; kode + data D1 produksi (akun pengguna, pembayaran). Data pengguna butuh dasar hukum pemindahan menurut UU PDP.
4. **Data berlisensi:** GEM dicabut atau dimintakan izin; foto Wikimedia dipertahankan dengan atribusi atau diganti.
5. **Riwayat git:** repo baru tanpa riwayat atau riwayat dibersihkan.
6. **Berkas internal agent dan perencanaan:** ikut, diringkas, atau dikeluarkan.
7. **Akun yang dipindah** (Cloudflare, GitHub, domain, Google OAuth, Midtrans, Meta) dan siapa membayar biaya berjalan (Workers Paid, R2, AI).
8. **Dukungan purna jual:** masa garansi, SLA, siapa menjalankan panen harian (butuh mesin dengan akses jaringan).
9. **Identitas kontak:** `meti.ires@gmail.com` tetap atau diganti.
10. **Skrip panen:** diserahkan (butuh dokumentasi syarat tiap situs sumber) atau hanya data hasil.

## 9. Batasan Audit

Tidak dijalankan: pemindaian rahasia seluruh riwayat dengan alat khusus, `npm audit` (hanya satu devDependency, `wrangler 4.158.0`), uji asap live, Lighthouse, tinjauan aksesibilitas, verifikasi webhook Midtrans, jumlah iterasi PBKDF2, pemeriksaan lisensi satu per satu atas 892 JSON. Semua klaim bertanda [D] perlu dibuka dan dikonfirmasi sebelum masuk dokumen resmi untuk pembeli.
