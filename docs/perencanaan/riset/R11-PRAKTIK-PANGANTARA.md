# R11. Praktik terbaik dari repo Pangantara untuk Jaringan METI

Tanggal: 7 November 2026
Sumber: repo `pangantara` (Next.js 15 + Supabase Postgres + Vercel), commit `44f998484` (`git rev-parse --short HEAD`), 7.899 commit, 10.661 berkas terlacak.
Penerima: Jaringan METI (Cloudflare Workers + D1 + R2, JS murni, tanpa build step; `DESAIN-TEKNIS.md` §1 dan §8).
Sifat: riset baca-saja. Tidak ada perubahan di repo pangantara. Tidak ada rahasia, token, ID akun, email, atau data pribadi yang disalin; variabel hanya disebut namanya.

## 0. Cara membaca

Setiap butir: **praktik**, **bukti** (`path:baris`, relatif ke akar pangantara kecuali ditulis lain), **sebab/insiden** bila tertulis, **verdict** untuk METI: **TERAPKAN** (ambil hampir apa adanya), **SESUAIKAN** (ambil gagasannya, bentuknya berbeda), **TIDAK PERLU** (tidak relevan di stack METI).

Singkatan berkas rujukan:
- `R700` = `.claude/skills/selera-pinka/references/700-ranjau-deploy.md` (7.903 baris; katalog kegagalan dengan tanggal dan insiden).
- `KANON` = `.claude/skills/selera-pinka/references/100-kanon.md` (631 baris).
- `AUDIT-NAS` = `docs/AUDIT-KESIAPAN-NASIONAL-2026-09-12.md`.
- `RUNBOOK` = `docs/RUNBOOK.md`.

Cakupan baca (jujur): dibaca penuh atau hampir penuh: `CLAUDE.md`, `ARCHITECTURE.md`, `next.config.ts`, `lib/api-guard.ts`, `lib/api-aman.ts`, `.github/workflows/ci.yml`, `cadangan-db.yml`, `integrasi.yml`, `wa-gateway-monitor.yml`, `dependabot.yml`, `docs/RUNBOOK.md`, `docs/model-ancaman-ai.md` (awal), `tests/README.md`, bagian-bagian `AGENTS.md` (§1.3, §1.5, §6, §9), `KATALOG.md` hook. `R700` dan `AUDIT-NAS` dibaca selektif per bagian (§0 sampai §6, §3.5, §3.13, §3.24, §9.17, §10, §3.8 audit). Dari 1.440 migrasi, 273 berkas `tests/e2e`, 70 agent, dan 72 hook hanya dibaca sampel dan katalognya. Yang tidak dibaca tidak diklaim.

---

## 1. Infrastruktur dan deploy

**1.1 Peta gerbang berurutan dan tabel "hijau di sini, merah di sana".**
Praktik: lima gerbang (pre-commit, pre-push, Stop hook, CI, build Vercel) masing-masing dengan cakupan tertulis, plus tabel kombinasi yang menerjemahkan "Vercel READY tapi CI merah" menjadi "testnya yang rusak, bukan app".
Bukti: `R700:37-62`; angka sampel 71 run CI di `R700:64-100` (34 merah; 22 di antaranya step Test).
Sebab: hijau di satu gerbang dianggap jaminan di gerbang lain; merah di CI bertahan 10 run karena app tetap live.
Verdict METI: **SESUAIKAN**. METI hanya punya dua gerbang nyata: CI (typecheck JSDoc/lint, uji, pemindai) dan `wrangler deploy` oleh pemilik. Tulis tabel kombinasi untuk dua gerbang itu (CI hijau tapi `/api/status` merah, dan sebaliknya).

**1.2 Versi runtime CI wajib sama dengan produksi.**
Bukti: `.github/workflows/ci.yml:58` (`node-version-file: .nvmrc`), alasan `ci.yml:50-57`; aturan terkunci nomor 6 di `R700:2718` dst. Gerbang: `tests/unit/gerbang-deploy.test.ts`.
Sebab: CI membangun di Node 20 sementara produksi Node 24, sehingga hijaunya CI menjamin app yang bukan app produksi.
Verdict: **TERAPKAN**. Padanan: `compatibility_date` di `wrangler.jsonc` (DESAIN-TEKNIS §8.6 sudah `2026-11-01`) dan versi `wrangler`/Node di `.nvmrc` dipatok; uji CI berjalan di runtime Workers (Miniflare/workerd) dengan `compatibility_date` yang sama, bukan di Node polos.

**1.3 Hemat kuota CI: `paths-ignore`, `concurrency` dengan `cancel-in-progress`, jadwal berbudget.**
Bukti: `ci.yml:13-41` (abaikan `**/*.md`, `kg/**`, `bekal/**`), `ci.yml:43` (`group: ci-${{ github.ref }}`), `wa-gateway-monitor.yml:17-22` (tiap jam, bukan tiap 30 menit, dengan hitungan menit/bulan), gerbang `tests/unit/gerbang-kuota-actions.test.ts` (budget cron 900 menit).
Sebab: 187 run dalam 3 hari menghabiskan 2000 menit/bulan plan Free (25 Jul 2026). Actions mati tiga kali karena anggaran akun nol; tandanya run gagal 3-5 detik tanpa satu langkah (`RUNBOOK` §1 butir 5 dan §6).
Verdict: **TERAPKAN**. DESAIN-TEKNIS §1 sudah menghitung "4 dari 5 jadwal"; tambahkan gerbang yang menghitung menit Actions per bulan dan `timeout-minutes` di tiap job (`integrasi.yml:43`, `cadangan-db.yml:64`).

**1.4 Batas platform ditulis sebagai tabel angka dan dicek saat merencanakan.**
Bukti: `R700:435-499` (§3.5: memori build 8192 MB, Hobby 12 fungsi, cron maks sekali sehari, timeout 30 dtk).
Sebab: kelas gagal "kodenya benar, platformnya menolak" tidak terlihat saat menulis kode.
Verdict: **TERAPKAN**. Buat tabel serupa untuk Cloudflare dan D1 sebelum implementasi: baris dibaca per hari (5 juta di Free), ukuran D1, jumlah cron trigger (5), CPU time Worker, ukuran respons, batas parameter terikat per kueri D1 [verifikasi di dokumentasi Cloudflare; angka tidak diambil dari pangantara], dan isi tabel dari dokumen resmi bertanggal.

**1.5 Cron: katalog dokumentasi, kill-switch per cron, jejak tiap run, "nebeng" satu jadwal.**
Bukti: `lib/cronCatalog.ts:1-60` (katalog dirawat tangan, `togglable`), `app/api/cron/ops-automation/route.ts:14,44` (`isCronEnabled`, gerbang `CRON_SECRET`), `lib/cron-jejak.ts:1-30` (satu baris `automation_runs` per run, best-effort), `ARCHITECTURE.md:§8` ("menambah otomasi: nebeng jadwal yang ada, jangan tambah entri cron").
Sebab: audit 11 Agt 2026 tidak bisa menjawab "cron mana yang tidak jalan" karena hanya 5 dari 9 menulis jejak.
Verdict: **TERAPKAN** (kecuali `CRON_SECRET`). Di Workers handler `scheduled()` tidak punya URL publik, jadi tidak butuh secret; kalau ada jalur HTTP pemicu manual, gerbangi dengan peran Super. Kill-switch per tugas sapu di tabel `pengaturan`, jejak di tabel `jejak_sapu` (sudah ada konsepnya di METI), katalog cron di dokumen.

**1.6 Migrasi: bukti adalah katalog hidup, bukan buku migrasi.**
Bukti: `scripts/cek-drift-db.mjs:1-30`, `scripts/audit/rls-katalog.mjs:1-30`, `CLAUDE.md` bagian "`lib/database.types.ts` basi".
Sebab: 6 Sep 2026 heuristik "bandingkan nama berkas dengan `list_migrations`" memberi 37 migrasi "belum diterapkan", semuanya salah; yang percaya akan menerapkan ulang 37 migrasi ke produksi. Detektor regex RLS menghasilkan 96 temuan tinggi, 87 salah.
Verdict: **TERAPKAN prinsipnya**. Padanan D1: sumber kebenaran skema produksi = `sqlite_master` / `PRAGMA table_info` hasil `wrangler d1 execute --remote`, bukan tabel `d1_migrations`. Skrip `drift:d1` membandingkan objek yang dilahirkan `migrations/*.sql` dengan katalog remote, dijalankan sebelum dan sesudah migrasi produksi (JM-H04).

**1.7 Migrasi harus idempoten dan berstempel unik.**
Bukti: agent `.claude/agents/migrasi-idempoten.md`; gerbang `tests/unit/gerbang-migrasi-stempel.test.ts`; `R700:2765+` (§6 baris "Stempel migrasi bentrok antar sesi": 4 kali dalam 2 hari, 6 Sep 2026); `R700` §3.27 (dua sesi, `create or replace` saling menimpa, 5 Okt 2026).
Verdict: **SESUAIKAN**. D1 memakai nomor urut `0001_...sql`. Gerbang: nomor unik, tanpa lubang, tidak ada berkas lama yang berubah isinya (hash), `CREATE ... IF NOT EXISTS`, dan tiap `DROP`/`ALTER` destruktif butuh penanda yang disetujui pemilik.

**1.8 Objek DB yang lahir di luar repo (GUI/MCP) tidak terlihat pemindai berkas.**
Bukti: `tests/README.md` ("Audit 85 gerbang", kelas 1): `trg_auto_verify_supplier_bill` ditemukan hidup di produksi tanpa satu `CREATE TRIGGER` di repo (24 Agt 2026); registri trigger diperiksa dua arah (`tests/e2e/cakupan.json`, `scripts/e2e-db.mjs`).
Verdict: **TERAPKAN**. Larang `d1 execute --remote` untuk DDL kecuali lewat berkas migrasi; skrip drift memeriksa trigger, indeks, dan tabel yang ada di produksi tapi tidak ada di repo.

**1.9 Uji tidak boleh menyentuh produksi: cermin, dan penjaga host.**
Bukti: `R700:1189-1260` (§3.13), `.github/workflows/cermin-e2e.yml`, `e2e-db.yml`, `scripts/e2e-db.mjs:61-72` (`HOST_PRODUKSI`, `E2E_DB_IZIN_PRODUKSI`), pembungkus transaksi `ROLLBACK` di `scripts/e2e-db.mjs:6-7,118`.
Sebab: 9 Sep 2026 18:50-19:56 WIB, delapan run uji sehari ke DB produksi compute NANO menghabiskan burst IO; server auth memutus koneksi; yang terlihat pengguna: "kata sandi salah" untuk semua akun.
Verdict: **SESUAIKAN**. Prinsip TERAPKAN: produksi tidak pernah menerima INSERT uji. Bentuk: D1 lokal (Miniflare, `--persist-to` sementara) di runner; skrip uji menolak `database_id` produksi kecuali bendera eksplisit. JANGAN menyalin cermin data mentah (lihat 8.10).

**1.10 Staging/preview.**
Pangantara tidak punya staging; produksi = `main` auto-deploy, dan "Review Lokal" memakai Supabase lokal (`CLAUDE.md` bagian Stack, `R700` §3.18).
Verdict: **SESUAIKAN**. METI: `env.staging` di `wrangler.jsonc` dengan D1 dan bucket R2 terpisah, domain `*.workers.dev` untuk pratinjau, diisi seed dummy. Dengan data pribadi anggota, staging tidak boleh berisi salinan produksi.

**1.11 Rollback.**
Pangantara: tombol Promote Vercel (`RUNBOOK` §3 butir 2). Aturan: READY tapi rusak berarti kodenya, rollback dulu baru cari sebab.
Verdict: **SESUAIKAN**. Padanan Cloudflare: `wrangler rollback` / Versions dan Deployments untuk kode; D1 Time Travel untuk data [cek retensi per paket]; R2 versioning untuk berkas. Catatan: rollback kode tidak membalik migrasi; tulis migrasi "ekspansi dulu, penyusutan kemudian" supaya kode lama tetap jalan di skema baru.

**1.12 Region dekat DB.**
Bukti: `vercel.json:3` (`"regions": ["hnd1"]`), alasan di `R700` §4 aturan 2 (DB di Tokyo).
Verdict: **SESUAIKAN**. Padanan: lokasi primer D1 (location hint) dan Smart Placement agar Worker berdekatan dengan D1; dicatat di ADR karena JSON tak bisa dikomentari (`wrangler.jsonc` bisa).

**1.13 Dependabot mingguan, dikelompokkan, major ditahan.**
Bukti: `.github/dependabot.yml:1-50`; alasan: audit 27 Agt 2026 menemukan 6 kerentanan (3 high) di dependensi transitif yang tak ada yang cek.
Verdict: **TERAPKAN**. METI nyaris tanpa dependensi; tetap pasang untuk `wrangler`, devDependencies, dan GitHub Actions; tahan major `wrangler`. Tambah SRI + daftar CDN di CSP sebagai gerbang (CDN tidak terpantau Dependabot).

**1.14 Aturan lain yang spesifik Vercel.** Author commit terkunci (`R700` §4 no. 1, state BLOCKED), `NEXT_DIST_DIR`, `ignoreBuildErrors` (no. 3-4), heap build (`ci.yml:83,147`), chunk skew (`lib/chunkReload.ts`), alias webpack `web-push: false` untuk Edge (`next.config.ts:~200`).
Verdict: **TIDAK PERLU**. Tidak ada build step. Pelajaran umum yang tetap berlaku: jangan longgarkan gerbang demi mengejar deploy (no. 5).

---

## 2. Keamanan

**2.1 Header keamanan dan alasan yang tertulis.**
Bukti: `next.config.ts:19-55` (X-Frame-Options, CSP parsial `frame-ancestors`/`object-src`/`base-uri`/`form-action`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`), alasan `next.config.ts:7-18`.
Sebab: sebelum 25 Jul 2026 produksi hanya mengirim HSTS; halaman tanpa login yang dibagikan lewat WA mudah dibungkus iframe.
Verdict: **SESUAIKAN, lebih ketat**. Pangantara sengaja tidak memasang `script-src`/`style-src` karena Next menyuntik inline (salah pasang berarti app putih). METI vanilla tanpa inline: pasang CSP penuh sejak awal (`default-src 'self'`, `script-src 'self'` + hash/SRI untuk CDN yang terdaftar, `connect-src 'self'`, `img-src 'self' data:`, `frame-ancestors 'none'`), HSTS lewat setelan zona atau header Worker, dan `nosniff` terutama untuk berkas R2 yang dilayani lewat Worker. Satu fungsi `util.js` menempelkan header ke setiap respons (termasuk galat) agar tak ada jalur tanpa header.

**2.2 `noindex` lewat header `X-Robots-Tag`, bukan `Disallow`.**
Bukti: `next.config.ts:57-69` (alasan), `next.config.ts:~228-231` (daftar `halamanBertoken`).
Sebab: robots.txt melarang merayap sehingga perayap tak pernah melihat noindex; URL yang ditautkan tetap bisa terindeks tanpa isi.
Verdict: **TERAPKAN** untuk halaman anggota, admin, aktivasi, dan tautan bertoken. Profil publik direktori diatur terpisah (indeks atau tidak adalah keputusan produk di PRD).

**2.3 Satu pintu otorisasi; ambang minimum bukan "sudah login".**
Bukti: `lib/api-guard.ts:1-30` (alasan), `:99` (`requireStaff`), ambang = baris profil berperan, bukan sekadar sesi (`:~115-128`).
Sebab: audit 25 Jul 2026: pendaftaran terbuka memberi sesi `authenticated` sah tanpa menjadi staf; puluhan route hanya cek `if (!user)`. Banyak route memakai service role yang melewati RLS, jadi gerbang route adalah satu-satunya pembatas.
Verdict: **TERAPKAN**. Padanan langsung `src/hak.js` (DESAIN-TEKNIS §5). D1 tidak punya RLS sehingga seluruh Worker setara "service role": sesi valid harus dipetakan ke baris `akun` aktif berperan; sesi tanpa baris ditolak 403 dengan `kode` stabil.

**2.4 Gerbang menjadi uji perilaku, bukan pemindai kata.**
Bukti: `tests/README.md` (kelas 4: gerbang peran dinaikkan dari memindai kata `requireStaff` menjadi memanggil 197 handler tanpa sesi, `tests/integrasi/guard-route-api.test.ts`), `integrasi.yml:1-20` dan `:~50` (lane `peran-403` dengan sesi sungguhan, tiap rute uang/admin wajib balas persis 403).
Sebab: pemindai hanya tahu nama muncul di berkas, bukan bahwa gerbang menolak.
Verdict: **TERAPKAN**, dan METI bisa lebih murah: router berupa objek "METODE /path" (DESAIN-TEKNIS §1) bisa dienumerasi, jadi satu uji memanggil setiap rute tanpa sesi dan harus mendapat 401/403, plus matriks (peran x rute) dari `KEAMANAN-PRIVASI.md`. Karena murah, masukkan ke CI utama, tidak dipisah seperti `integrasi.yml` (di pangantara 514-859 dtk, `integrasi.yml:14-16`).

**2.5 Bendera tulis untuk peran baca-saja.**
Bukti: `lib/api-guard.ts:75-97` (`{ tulis: true }`), gerbang `tests/unit/gerbang-kursi-pantau.test.ts`.
Sebab: kursi pantau tidak boleh menulis (vonis 13 Sep 2026), tapi ~63 route tulis bergerbang `ANY_STAFF`; benderanya ada di pemanggil karena `requireStaff` tidak tahu metode HTTP.
Verdict: **SESUAIKAN**. Di METI metode HTTP sudah ada di router objek, jadi `hak.js` bisa memutuskan dari METODE: semua non-GET ditolak untuk peran baca-saja tanpa bendera per route; daftar kecualinya eksplisit.

**2.6 Peran kasar + atribut sempit = gerbang buta.**
Bukti: `AUDIT-NAS:143-173` (K-1, KRITIS): kursi provinsi dipetakan ke peran `admin`, dibedakan hanya oleh `jabatan`, yang tidak dibaca gerbang; nol dari 190 route bisa menyempit. Perbaikan: `jabatan` masuk `StaffGate` (`lib/api-guard.ts:~53-68`).
Verdict: **TERAPKAN pelajarannya**. Konteks Super/Admin/anggota METI: jangan memberi "Admin" sebagai satu peran bila ada cakupan (wilayah, lapis data). Cakupan harus ikut keluar dari `hak.js` sebagai bagian hasil gerbang, dan diuji "peran tanpa cakupan melihat NOL, bukan semua" (`tests/e2e/39-tim-provinsi.sql`, `AUDIT-NAS` §3.8 butir 4).

**2.7 Hak per baris: pola RESTRICTIVE.**
Bukti: `AUDIT-NAS:695-729` §3.8 butir 6: penyempit yang ditulis PERMISSIVE di sebelah policy permissive lain tidak berefek (no-op); 12 tabel uang memakai `RESTRICTIVE ... _wilayah_terbatas`.
Verdict: **SESUAIKAN**. Padanan di Worker: filter kepemilikan/cakupan digabung dengan AND ke setiap kueri baca dan tulis oleh `hak.js`, tidak pernah OR; tidak ada jalur "baca mentah" di luar `hak.js`. Gerbang statis memindai `src/**` untuk `env.DB.prepare` di luar `hak.js` (DESAIN-TEKNIS prinsip 3 sudah menyebut ini; tambahkan uji perilaku: untuk tiap tabel berhak-baris, akun anggota A tidak bisa membaca/mengubah baris anggota B lewat setiap rute).

**2.8 Default-deny dan populasi akun yang tumbuh.**
Bukti: `AUDIT-NAS:197-224` (K-3, KRITIS): `is_staff()` = punya peran apa pun; 28.000 akun koperasi lolos; 106 tabel dengan SELECT persis itu, termasuk rekening supplier.
Verdict: **TERAPKAN**. Sensus METI akan menambah ribuan anggota. "Punya peran" bukan izin baca; tiap tabel/kolom sensitif (kontak pribadi, dokumen) punya aturan baca eksplisit di matriks hak, diuji.

**2.9 Fungsi yang melewati hak wajib daftar putih.**
Bukti: `AUDIT-NAS` §3.8 butir 2 (424 fungsi `SECURITY DEFINER`, nol bisa dipanggil `anon`, nol tanpa `search_path`), `tests/e2e/01-skema.sql` asersi 10-11, `tests/README.md` tabel "Utang yang ditulis eksplisit" (pintu telanjang 16; dapat menulis 1).
Verdict: **TIDAK PERLU** untuk fungsinya (SQLite tanpa fungsi bermakna hak), tapi **TERAPKAN** padanannya: modul pipeline/koreksi yang menulis atas nama sistem (bukan akun) didaftar dan diuji, dan utang ditulis sebagai ratchet.

**2.10 Pembatas laju.**
Bukti: `lib/api-guard.ts:150-200` (`rateLimitOk` via RPC atomik, fail-open disengaja), `:206` (`clientIp`: header yang ditulis ulang platform didahulukan, `x-forwarded-for` jatuhan terakhir), `lib/api-guard.ts:~145` komentar: tabel `rpc_rate_limit` ada tetapi tak dipakai satu baris kode pun sampai audit 25 Jul 2026.
Verdict: **SESUAIKAN**. METI sudah merencanakan tabel `laju`. Pakai `CF-Connecting-IP` (tak bisa dipalsukan klien) dan pertimbangkan Rate Limiting binding/WAF untuk lapis kasar. Bedakan: pembatas biaya/spam boleh fail-open; login, aktivasi, ganti-sandi, dan permintaan token harus fail-closed atau menunda (brute force). Tambah gerbang "setiap rute tulis publik memanggil pembatas laju" supaya tabel tak menganggur lagi.

**2.11 Pembungkus handler: galat selalu JSON.**
Bukti: `lib/api-aman.ts:10-33` (`amanJson`, `balasGalat`), gerbang ratchet `tests/unit/gerbang-api-aman.test.ts`.
Sebab: tanpa pembungkus Next membalas 500 body kosong dan klien bertoken melihat galat parse JSON; 429 penyedia dipetakan ke pesan sendiri; kunci service hilang menjadi 503 "belum siap".
Verdict: **TERAPKAN** di router: satu `try/catch` terpusat, detail hanya ke log, balasan `{ kode, ... }` stabil agar klien menerjemahkan lewat kamus i18n (DESAIN-TEKNIS §8.4 butir 5).

**2.12 Idempotensi tulisan dari klien yang bisa mengirim ulang.**
Bukti: `lib/kdmp-idempoten.ts:1-24` (`HEADER_IDEMPOTEN`), kunci dibuat klien per ketukan tombol, bukan sidik jari isi.
Sebab: service worker (`public/sw.js`) mengantre tulisan saat sinyal putus; setoran 30 kg bisa tercatat dua kali tanpa error.
Verdict: **SESUAIKAN**. Relevan untuk formulir panjang pengajuan/koreksi anggota di jaringan buruk: tabel `kunci_idempoten (kunci PRIMARY KEY, hasil)` di D1 dan `INSERT OR IGNORE`.

**2.13 Tautan bertoken berumur terbatas dan bisa dicabut.**
Bukti: `lib/external-link-guard.ts:8` (`LINK_TTL_DAYS = 14`), `:23,:46` (akses vs kirim), pencabutan dengan menonaktifkan baris (`RUNBOOK` §5 butir 3).
Verdict: **TERAPKAN** untuk aktivasi akun dan ganti-sandi: token acak, simpan hash, sekali pakai, umur pendek, status terpisah untuk "boleh dibuka" dan "boleh dikirim".

**2.14 Rahasia dan env.**
Bukti: `.env.example` (hanya nama variabel: `CRON_SECRET`, `OPS_NOTIFY_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `LLM_API_KEY`, dst.), `.gitignore:17,61` (`.env`, `.env*.local`, `.env*` kecuali contoh), `cadangan-db.yml:~76-90` (langkah "Periksa secret lengkap" berhenti dan menyebut NAMA secret yang kurang), `cadangan-db.yml:~12-20` (passphrase disimpan di luar GitHub).
Sebab: secret kosong menyamar menjadi error koneksi Postgres yang menyesatkan (29 Agt 2026).
Verdict: **TERAPKAN**: `wrangler secret put`, `.dev.vars` di-ignore, `.dev.vars.example` hanya nama; gerbang boot `/api/status` melaporkan secret yang kurang (nama saja); workflow memeriksa secret sebelum bekerja.

**2.15 Perbandingan secret dan HMAC.**
Bukti: `app/api/cron/ops-automation/route.ts:44` (`auth !== \`Bearer ${secret}\``, tidak konstan-waktu), `app/api/ops/notify/route.ts:~30` (webhook HMAC-SHA1).
Verdict: **JANGAN tiru** (lihat 8.8). Pakai perbandingan konstan-waktu (`crypto.subtle.timingSafeEqual` di Workers) dan HMAC-SHA-256.

**2.16 Audit log yang membengkak.**
Bukti: `R700:2540-2570` (§3.24): ±290 ribu baris `audit_log` lahir dalam satu sore dari penyemaian mesin (83% seluruh `audit_log`, `actor` NULL), IO habis, 70-95% request 5xx berjam-jam; obat: UPDATE tanpa perubahan tak dicatat, retensi 180 hari, trigger audit tabel bervolume dicabut, tabel uang tetap diaudit.
Verdict: **TERAPKAN** pada tabel `jejak`: catat tulisan manusia dan perubahan bernilai, jangan tulisan pipeline massal; retensi tertulis; hitung baris/hari dipantau. D1 menagih per baris ditulis, jadi biaya IO sama nyatanya.

**2.17 Model ancaman untuk fitur AI.**
Bukti: `docs/model-ancaman-ai.md:1-70` (dokumen terpisah: aset, pintu masuk tak tepercaya, ancaman A1..., penjaga yang ada, celah yang belum ditutup). Celah yang diakui: prompt tidak memakai pembatas "ini DATA, bukan perintah" dan tak ada uji.
Verdict: **SESUAIKAN**. Workers AI untuk ringkasan abstrak riset (DESAIN-TEKNIS §1): perlakukan abstrak sumber luar sebagai tak tepercaya, pisahkan dengan pembatas, keluaran model tidak pernah menulis ke fakta/kurasi otomatis (hanya cache ringkasan berlabel "mesin, perlu tinjau"), validasi deterministik sesudah keluaran, dan uji injeksi. Lapisan penentu pangantara: validasi deterministik dan trigger DB menolak angka tak waras.

**2.18 Privasi dan insiden kebocoran.**
Bukti: `RUNBOOK` §5 (3 x 24 jam sejak DIKETAHUI, bukan dikonfirmasi; catat waktu, persempit, cabut akses, kumpulkan bukti, beri tahu), halaman `/kebijakan` terbuka tanpa login (`app/kebijakan`, `R700` §8.5).
Verdict: **TERAPKAN** (sudah selaras dengan `KEAMANAN-PRIVASI.md` METI): tambahkan runbook kebocoran berbahasa gejala dan halaman kebijakan publik; nama penanggung jawab data pribadi tidak ditempel di halaman publik (`RUNBOOK` §7 paragraf akhir).

---

## 3. Data dan pipeline

**3.1 Batas respons yang memotong diam-diam.**
Bukti: `lib/supabase/ambil-semua.ts:1-30`, `CLAUDE.md` bagian "Baca tabel besar", gerbang `tests/unit/paginasi-tabel-besar.test.ts` dan `lib/tabel-besar.ts`.
Sebab: PostgREST memotong di 1000 baris tanpa error; 28 Jul 2026 halaman Resep hanya memuat A sampai "Gula Pasir"; tombol "Lengkapi" meng-INSERT ulang dan memicu 23505.
Verdict: **SESUAIKAN**. D1 tidak memotong diam di 1000, tetapi ada batas lain (baris dibaca/hari, ukuran respons, parameter terikat per kueri) dan Workers punya batas CPU/memori. Padanan: paginasi keyset (`WHERE id > ?`) yang WAJIB berpemecah seri `ORDER BY id`, helper `ambilSemua` yang berhenti di plafon, dan daftar tabel besar yang diperiksa gerbang. Prinsip lanjutannya penting: `.range()` menjaga kelengkapan, bukan ongkos (`CLAUDE.md` aturan ketiga).

**3.2 `IN (...)` yang disuapi nilai null.**
Bukti: `CLAUDE.md` ("`idsUntukIn()`", ratchet `gerbang-in-nullable.test.ts`), `lib/supabase/ids-untuk-in.ts`.
Verdict: **TERAPKAN**: satu helper yang membuang null/duplikat dan memecah daftar panjang (batas parameter terikat D1 [verifikasi]); `IN (NULL)` tak pernah cocok dan tak pernah error.

**3.3 Paginasi sumber luar tanpa urutan tetap.**
Bukti: `R700:7312-7340` (§9.17, 13 Sep 2026): sumber tanpa `ORDER BY`; 78 halaman menghasilkan 38.568 baris (sama dengan total diiklankan) tetapi cuma 29.626 unik; 8.942 duplikat, nol error. Obat: pembagi yang totalnya diketahui, bukan urutan.
Verdict: **TERAPKAN** untuk pipeline panen R8: ukur jumlah UNIK terhadap kunci alami, jangan jumlah baris terhadap total yang diiklankan; dedup di kunci; jika hitungan unik < total, pipeline gagal keras (bukan peringatan).

**3.4 Panen terjadwal dari sumber publik: pelajaran PIHPS.**
Bukti: `R700:3085-3180` (§10): fetch biasa ke endpoint JSON publik, bukan browser; satu sapuan 714 request; tujuh ranjau: (1) cakupan wilayah terlalu kasar meruntuhkan rentang min/max; (2) koma sebagai pemisah ribuan lawan titik di parser lain (harga seperseribu tanpa error), dua parser sengaja terpisah; (3) induk pohon datar harus direset tiap grup (angka benar, label salah); (4) sumber tak mensurvei semua wilayah, simpan baris cadangan tingkat atas; (5) view lambat 1.093 ms baru terasa setelah tabel membesar, 20 ms setelah subquery berkorelasi; (6) batas atas regulasi membalik rentang; (7) `JSON.stringify` ke kolom jsonb menghasilkan skalar string yang tak bisa ditanyai.
Verdict: **TERAPKAN pelajarannya** (METI tidak memanen PIHPS, tetapi `scripts/panen/*.py` per sumber R8 sama kelasnya): satu parser per sumber lengkap dengan locale angka, uji parser dengan contoh nyata, periksa ulang kueri berat sesudah panen pertama mengisi tabel, simpan JSON sebagai TEXT dan uji bahwa `json_extract` mengembalikan angka.

**3.5 Jejak run dan kosakata status dari constraint.**
Bukti: `lib/cron-jejak.ts:~18-26` (tipe `running|ok|warn|failed` diturunkan dari `automation_runs_status_check`, bukan dikarang), gerbang `tests/unit/gerbang-status-automation-runs.test.ts`.
Sebab: tiga cron memakai `'error'`, yang tidak ada di constraint, dan kehilangan baris kegagalannya persis saat dibutuhkan (11 Sep 2026).
Verdict: **TERAPKAN**: tabel `jejak_pipeline` dengan `CHECK(status IN (...))`, tipe JS dibuat dari satu daftar yang sama, gerbang membandingkan keduanya.

**3.6 Provenans dan umur data sebagai fitur.**
Bukti: `R700:~3115-3150` (§10): `unique (sumber, komoditas_kode)`, jejak `automation_runs` sendiri per panen, kartu System Health merah bila lewat 2 hari; alasan: "panen yang gagal tiap hari terlihat persis sama dengan yang berhasil, lencana tetap tercetak, cuma angkanya makin tua, dan umur itu satu-satunya tanda, di tooltip."
Verdict: **TERAPKAN**: setiap fakta panen membawa `sumber`, `url_asal`, `diambil_pada`; UI menampilkan umur; `/api/status` melaporkan umur potret terakhir, panen terakhir per sumber, dan cadangan terakhir (pemeriksaan kesegaran, bukan "run sukses").

**3.7 Pembagian deterministik vs AI.**
Bukti: `KANON:~62-70` (prinsip 6): input berposisi tetap dibaca deterministik; AI hanya untuk yang butuh penilaian; "syarat mati" fitur AI: label, log, apply-rate, cache hash-prompt, korpus koreksi.
Verdict: **TERAPKAN**: impor sensus CSV/XLSX dibaca deterministik dengan validasi per baris dan laporan galat per baris; AI hanya meringkas dan selalu berlabel.

**3.8 Validasi sesudah impor di lapisan DB, bukan hanya form.**
Bukti: `ARCHITECTURE.md:§2` ("Lapis ketiga yang menentukan": seed, impor Excel, MCP, cron menulis lewat pintu lain), trigger `recipe_items_selaras`.
Verdict: **SESUAIKAN**: D1 mendukung CHECK, UNIQUE, FOREIGN KEY, dan trigger; pasang di skema untuk invarian murni (kode rujukan, rentang tahun, kapasitas ≥ 0, satuan di daftar). Aturan lintas-tabel yang rumit tetap di `hak.js` dengan uji. Kunci pelajaran: validasi di form tidak menutup jalur impor/pipeline.

**3.9 Satuan: dua rezim, pembaca yang menyamakan.**
Bukti: `ARCHITECTURE.md:§5` (insiden 2 Agt 2026: bahan ber-`item_id` NULL bersatuan `g`; 90 "g" x harga per kg = Rp13,95 juta, 155 kali lipat; gagal diam), `lib/satuan-bahan.ts`.
Verdict: **TERAPKAN**: kapasitas (kW/MW/GW), energi (kWh/MWh), mata uang, dan tahun disimpan dalam satuan kanonik satu kolom + kolom `satuan_asal`; satu fungsi konversi di `algo.js`; pasangan tak sebanding dikosongkan dengan tanda, tidak dihitung apa adanya.

**3.10 Identitas dan penggabungan entitas.**
Bukti: `R700` §9.10 (sedesa boleh berbagi gedung meloloskan 7.292 baris), §9.7.3 (pengupas awalan memakan namanya: 21 kecamatan, 940 sekolah, nol error), §9.15 (penggabungan berbasis nama dibatalkan), `R700` §9.14 (tiga cacat yang hanya terlihat karena angkanya diperiksa).
Verdict: **TERAPKAN pada `hubung.mjs` (dedup)**: kunci gabung stabil non-nama (NPWP/NIB bila ada, domain, kombinasi terverifikasi), setiap normalisasi nama diuji dengan kasus yang memakan nama sendiri, hasil dedup tidak otomatis menggabung (usulan ke kurasi), dan setiap aturan gabung punya hitungan "sebelum/sesudah" yang dibandingkan.

**3.11 Pemanen di depan database yang sakit.**
Bukti: `R700:2562-2570`: 503 diperlakukan sebagai "baris ditolak", batch dipecah sampai satuan: 3.812 request ber-503 dalam sejam, dan `KeepAlive` menghidupkannya lagi tiap 30 menit.
Verdict: **TERAPKAN**: galat sementara (5xx, timeout, kuota) = backoff eksponensial + jeda, bukan pemecahan batch; batas jumlah percobaan; sirkuit terbuka bila 3 kegagalan berturut-turut; pipeline METI tidak menulis ke D1 sama sekali (DESAIN-TEKNIS prinsip 2), yang menutup kelas ini dari awal.

**3.12 Materialized view/potret yang tertinggal berbohong.**
Bukti: `R700` §9.7 dan §9.7.1 ("migrasi yang membetulkan DATA tapi tidak menyegarkan rekapnya"), §9.8 (uji e2e menembak matview: fixture lahir sesudah penyegaran terakhir).
Verdict: **TERAPKAN pada potret R2**: setiap potret membawa `dibangun_pada` dan versi skema; setelah koreksi massal atau migrasi data, pipeline potret wajib dijalankan ulang (langkah di checklist migrasi); layar menampilkan umur potret.

**3.13 Cadangan dan pemulihan.**
Bukti: `.github/workflows/cadangan-db.yml:1-193` (harian 19:00 UTC; roles, schema, data, dan akun dipisah; pemeriksaan "dump kosong" dengan ambang ukuran dan `CREATE TABLE`, `:127-150`; kompres + GPG AES256; artifact 30 hari `:171`; lapor ke endpoint ops bila gagal), `RUNBOOK` §0 (RPO 24 jam, RTO operasional 4 jam), §2 (pulihkan ke proyek sementara, jangan ke produksi), uji pemulihan "sebulan sekali" (`cadangan-db.yml:~28`).
Sebab: run pertama (29 Agt 2026) gagal karena secret tak pernah dipasang; dump `auth` ternyata tidak ikut `--data-only` sehingga cadangan akan menjadi "DB berisi data tanpa satu pun orang yang bisa masuk" (`:~118-126`).
Verdict: **TERAPKAN, padanan Cloudflare**: Worker `scheduled()` atau job Actions memanggil `wrangler d1 export --remote` [export dapat memblokir tulis selama berjalan; periksa dokumentasi], hasil dienkripsi (age/GPG), diunggah ke bucket R2 `cadangan/` terpisah dengan lifecycle retensi, ditambah D1 Time Travel untuk pemulihan titik-waktu; berkas di R2 yang jadi sumber kebenaran harus ikut dicadangkan (replikasi ke bucket di akun/penyedia lain, karena satu akun yang tersuspensi menghilangkan keduanya). Tiga pemeriksaan wajib dicontek: secret lengkap sebelum jalan, dump tidak kosong (ukuran dan jumlah tabel), dan cadangan gagal membunyikan alarm. RPO/RTO ditulis sebagai angka di runbook.

**3.14 Retensi dan prune.**
Bukti: `R700:~3110` (harga 180 hari; view berjendela 45 hari; ukuran diukur: 45 hari = 160 rb baris = 53 MB), `cadangan-db.yml:171`, `cermin-e2e.yml` (artifact 3 hari).
Verdict: **TERAPKAN**: tiap tabel bervolume punya retensi tertulis dan ukuran keadaan tunak yang diukur (`laju`, `sesi`, `jejak`, `riwayat`).

**3.15 Kamus tipe skema vs DB nyata.**
Bukti: `CLAUDE.md` ("`lib/database.types.ts` basi = gerbang yang berbohong"): tipe basi gagal ke dua arah dan diam; `scripts/cek-types-drift.mjs`.
Verdict: **SESUAIKAN**: JS murni tanpa tipe generate. Padanannya satu berkas skema kolom (`skema.js`) yang dipakai validator dan `hak.js`; gerbang mengadu daftar kolomnya dengan `PRAGMA table_info` hasil migrasi lokal.

**3.16 Provenans pada proses "semesta" vs operasional.**
Bukti: `CLAUDE.md` "Dua lapis sekolah, jangan disatukan" (`schools` operasional vs `sekolah_dapodik` semesta, ditaut `kunci_wilayah`, gerbang `gerbang-kunci-sekolah.test.ts`).
Verdict: **TERAPKAN**: data panen luar (semesta, tidak diklaim siapa pun) dan data terkurasi/tertulis anggota (klaim) di tabel/lapis terpisah dengan tautan kunci; tidak dilebur.

---

## 4. Gerbang mutu dan pengujian

**4.1 "Aturan tanpa gerbang mekanis dianggap belum jadi" dan protokol tiga lapis.**
Bukti: `KANON:~58-60` (prinsip 7), `R700:11-35` (§0: perbaiki, catat di tabel dengan kolom "Dijaga oleh", pasang gerbang di titik paling hulu; tabel "kelas -> gerbang").
Verdict: **TERAPKAN**. Ini praktik inti. Ringankan: satu berkas `docs/ranjau.md` dengan kolom "Dijaga oleh" wajib terisi, dan gerbang yang memeriksa kolom itu. Tanpa mesin "buku vonis" (lihat 8.5).

**4.2 Klasifikasi gerbang: naikkan ke perilaku atau biarkan statis.**
Bukti: `tests/README.md` bagian "Audit 85 gerbang pemindai sumber (24 Agt 2026)": kelas 1 (pemindai migrasi) NAIKKAN, kelas 2 (selera/tampilan) STATIS, kelas 3 (dokumen/konfigurasi) STATIS, kelas 4 (memastikan panggilan ADA) NAIKKAN SEBAGIAN.
Verdict: **TERAPKAN** cara memilahnya: pemindai menangkap lebih awal (saat menulis), uji perilaku membuktikan; keduanya dipertahankan.

**4.3 Pemindai yang berhenti membaca melapor hijau.**
Bukti: `AUDIT-NAS:748-770` (Tema 2): empat gerbang hijau atas utang nyata karena pola yang dikenal terlalu sempit (`gerbang-status-automation-runs`, `paginasi-tabel-besar`, `gerbang-waktu-wib`, `gerbang-wilayah-nasional`). Bentuk obat: `expect(ditulis.length).toBeGreaterThan(10)` dengan komentar "nol temuan berarti regexnya berhenti mengenali".
Verdict: **TERAPKAN**: setiap pemindai sumber punya asersi "masih menemukan N objek yang seharusnya ia lihat" dan, idealnya, satu kasus positif sintetis yang harus ia tolak.

**4.4 Ratchet: besaran yang hanya boleh turun.**
Bukti: `ARCHITECTURE.md:§9` (ukuran berkas: 65 berkas >1.200 baris; `any`: 1.249; pola guard: 0; ambang coverage di `vitest.config.ts`), `lint:ratchet` (`ci.yml:~96-105`), `tests/unit/gerbang-ukuran-berkas.test.ts`, `gerbang-any-ratchet.test.ts`.
Verdict: **SESUAIKAN**: JS murni tidak punya `any`. Ratchet yang relevan: ukuran berkas per modul, peringatan ESLint, ambang coverage, jumlah `// ponytail:`/TODO, jumlah rute tanpa uji. Plafon disetel persis di angka nyata saat dipasang; menurunkannya bagian dari commit yang memperbaiki.

**4.5 Uji integrasi nyata untuk perilaku di luar kode aplikasi.**
Bukti: `CLAUDE.md` ("Uji integrasi WAJIB"), `ARCHITECTURE.md:§9` (tabel logika -> jenis uji; "Unit test bermock dilarang dipakai sebagai bukti bahwa alur sebenarnya bekerja"), `tests/e2e/*.sql` (273 berkas) dibungkus transaksi ROLLBACK oleh runner (`scripts/e2e-db.mjs:6-7,118`), registri `tests/e2e/cakupan.json` (158 diuji, 41 dikecualikan dengan alasan, 0 antre; `tests/README.md`).
Verdict: **TERAPKAN**. Padanan METI: `@cloudflare/vitest-pool-workers` atau Miniflare menjalankan Worker + D1 + R2 lokal sungguhan; tiap uji memakai penyimpanan terisolasi (atau DB sementara yang dibuang). Yang diuji nyata: setiap trigger/CHECK/UNIQUE, setiap rute hak (peran x baris), migrasi dari nol dan dari snapshot, FTS5 `entitas_cari`, pipeline `jaga_unggah.mjs`. Registri `cakupan.json` METI: daftar trigger/indeks unik/CHECK dari `sqlite_master` yang harus punya uji, dengan jalur "dikecualikan + alasan".

**4.6 Registri dua arah.**
Bukti: `tests/e2e/cakupan.json:1-15` (dijaga dari berkas migrasi oleh `tests/unit/gerbang-test-integrasi.test.ts` dan dari katalog hidup oleh `scripts/e2e-db.mjs`; "antre" tidak boleh naik).
Verdict: **TERAPKAN** dua arahnya: repo ke katalog DB dan katalog DB ke repo.

**4.7 Cermin produksi sebagai arena uji.**
Bukti: `cermin-e2e.yml` dan `e2e-db.yml` (§1.9 di atas).
Verdict: **SESUAIKAN keras**: untuk METI jangan cermin data mentah (data pribadi UU PDP); gunakan seed sintetis + (opsional) salinan teranonimkan, dan jalankan migrasi terhadap snapshot terkecil yang mewakili.

**4.8 Pecahnya langkah setup dan izin token.**
Bukti: `R700:1189-1260` §3.13 (b) dan (c): token workflow default `read` tidak boleh memanggil Actions API, dibalas `HTTP 403`, tercatat sebagai "E2E GAGAL" padahal tak satu uji pun jalan; `apt-get install` keluar 100 karena mirror runner; `.github/workflows/e2e-db.yml:50` (`permissions:` eksplisit); gerbang memindai SEMUA workflow, bukan satu nama berkas.
Verdict: **TERAPKAN**: `permissions:` minimal eksplisit di tiap workflow, gerbang yang memindai semua workflow, pemasangan alat diulang 3 kali (alat, bukan ujinya), `timeout-minutes` di tiap job, dan pesan galat yang membedakan "setup jatuh" dari "asersi pecah".

**4.9 Gerbang lokal ringan vs CI penuh: kompromi yang diambil pemilik.**
Bukti: `R700` §4 aturan 5 (7 Okt 2026): pre-push hanya uji terkait diff (`scripts/mesin/uji-terkait.mjs`); alasan: 655 berkas uji, push 4-10 menit, median 239 dtk, antre 35 proses; konsekuensi di `R700` §6: pemindai yang tak menyebut berkas berubah lolos push dan baru merah di CI; "Tidak ada notifikasi saat CI merah"; `git push --no-verify` melewati semuanya.
Verdict: **SESUAIKAN**. Suite METI kecil: jalankan penuh di pre-push dan CI selama masih < 1 menit. Bila nanti diringankan, syaratkan notifikasi CI merah (email/ntfy) dan catat residu di daftar lubang.

**4.10 Tombol data dummy berjejak.**
Bukti: `lib/dummy-modul.ts:1-14` (halaman -> modul), `tests/unit/gerbang-dummy.test.ts:1-30` (tiga kelas yang gagal diam: dua daftar modul yang menyimpang antara TypeScript dan SQL; modul yang bisa diisi tapi tidak bisa dihapus; tombol lepas dari gerbang peran), `tests/e2e/05-dummy-jejak.sql` (80 KB; isi -> hapus -> hitung baris asli), `CLAUDE.md` ("tombol 🧪/🧹 dicabut dari nav app ini, vonis 22 Sep 2026; mesinnya dibiarkan").
Sebab: baris dummy mendarat di DB produksi; modul tanpa jalur hapus adalah kotoran permanen di laporan.
Verdict: **TERAPKAN** (sesuai standar pemilik `~/.claude/DUMMY.md`): endpoint Super saja; tabel `dummy_jejak(tabel, id, modul, batch)` supaya hapus presisi; semua baris dummy bertanda dan diabaikan potret publik; gerbang mengadu daftar modul antar sisi; uji isi-lalu-hapus mengembalikan hitungan baris asli. Isolasi lebih kuat dari pangantara: dummy di D1 staging, dan di produksi hanya bila tertandai dan ikut terhapus bersih. Catat keputusan pemilik pangantara mencabut tombol dari nav: untuk METI tombol tetap ada tetapi pindah ke halaman admin.

**4.11 INP: klik tidak boleh membekukan layar.**
Bukti: `components/ui/transisi.ts:1-35`, `tests/unit/gerbang-inp-transisi.test.ts:1-30`, `ARCHITECTURE.md:§10`, agent `.claude/agents/inp-reviewer.md`.
Sebab: 24-25 Agt 2026 overlay INP Vercel Toolbar menyala di empat lalu dua kontrol, meski `startTransition` sudah dipasang; membungkus SELURUH setState dalam transition membuat tak ada update urgent yang dicat.
Verdict: **SESUAIKAN**: React tidak dipakai. Aturan intinya tetap: chrome kontrol (kelas aktif, `aria-expanded`, panah sort) diperbarui sinkron; isi berat (tabel direktori 1000+ baris, peta, chart) dirender menyusul (`requestAnimationFrame` + `setTimeout`/`scheduler.yield()`), dengan paginasi server, `content-visibility: auto`, dan delegasi event. Ukur dengan `PerformanceObserver` (event timing) pada halaman direktori/sensus dan masukkan ambang ke CI smoke (Playwright) bila perlu.

**4.12 Uji gagal diam pada waktu.**
Bukti: hook `blok-waktu-utc.mjs` (KATALOG), `AUDIT-NAS` §3.3 Z-1 sampai Z-7.
Verdict: lihat 5.8.

---

## 5. Operasional dan pemantauan

**5.1 Runbook ditulis dari gejala, dengan angka RPO/RTO.**
Bukti: `docs/RUNBOOK.md` (§0 angka disepakati; §1 urutan 5 menit; §2 data hilang/rusak; §3 app mati; §4 WA; §5 kebocoran; §6 gerbang mutu tak menjaga apa pun; §7 kontak; §8 sesudah insiden).
Sebab: "empat pertanyaan belum tertulis di mana pun": siapa dihubungi, langkahnya, berapa lama pulih, berapa jam data boleh hilang (27 Agt 2026).
Verdict: **TERAPKAN strukturnya** dalam `docs/perencanaan/OPERASIONAL.md` METI. Kontak ditulis di luar sistem yang dipulihkan (prinsip `RUNBOOK` §7) tetapi lihat 8.9: tanpa nomor/nama di repo publik; pakai peran dan lokasi dokumen kontak pribadi pemilik.

**5.2 Satu pintu sinyal operasional, dengan kanal berbeda dari yang dipantau.**
Bukti: `app/api/ops/notify/route.ts:1-35` (webhook deploy, laporan diri cron, hasil kg:check, bentuk generik `{ sumber, jenis, severity, judul, dedupe_key }`), kanal web push BUKAN WA karena kalau jalur WA yang rusak, alarm lewat WA tak pernah sampai (`RUNBOOK` §4 butir 3).
Verdict: **SESUAIKAN**: Worker `POST /api/ops/notify` yang ditulis ke tabel `peristiwa_ops` dan diteruskan ke email/Telegram/ntfy; kanal alarm tidak boleh bergantung pada komponen yang sedang dipantau (mis. jangan memakai kanal email yang dikirim dari Worker yang mati; tambah pemeriksa eksternal bebas).

**5.3 Galat runtime bersuara.**
Bukti: `instrumentation.ts:1-40` (`runtime.error` ke `ops_events` + push admin), pengecualian jalur yang error-nya bukan kabar buruk, `R700` §8.4.
Verdict: **SESUAIKAN**: `observability.enabled` (DESAIN-TEKNIS §8.5) menyediakan log; tambahkan `try/catch` global yang menulis galat 5xx ke `peristiwa_ops` via `ctx.waitUntil`, dengan dedupe dan daftar pengecualian (404/401 wajar).

**5.4 Deteksi "tidak ada kabar".**
Bukti: kartu System Health "Panen harga pasar (PIHPS)" merah bila lewat 2 hari (`R700:~3115`); `AUDIT-NAS` O-3 (tiga cron tidak menulis satu baris pun); `AUDIT-NAS` P-2 (dua panel yang dipakai menilai kesiapan berbohong).
Verdict: **TERAPKAN**: `/api/status` memeriksa umur (potret, panen, cadangan, sapu cron), bukan "tidak ada error". Pemantau eksternal (UptimeRobot atau Cloudflare Health Checks) memanggil `/api/status` dan menilai kontennya.

**5.5 Pemantau dari luar karena cron platform terbatas.**
Bukti: `.github/workflows/wa-gateway-monitor.yml:1-41` (Hobby: cron Vercel sekali sehari; jadwal GitHub bisa telat atau dilewati; alternatif cron-job.org).
Verdict: **SESUAIKAN**: Cloudflare cron triggers jauh lebih fleksibel; yang tetap berlaku: jangan satu-satunya pemantau Worker adalah Worker itu sendiri.

**5.6 Kapasitas database sebagai risiko kelas satu.**
Bukti: `AUDIT-NAS:504-525` (P-1: `penerima_manfaat` nasional 47.451.080 baris vs disk Pro 8 GB), `:526-536` (P-3: 293 dari 851 policy memanggil fungsi auth tanpa `(SELECT ...)`), `:553` (P-5: `user_profiles` 29.337 baris tanpa indeks `role`/`sppg_id`), `.env.example` (`SUPABASE_DB_KUOTA_MB`), `R700:2540` (IO habis).
Verdict: **TERAPKAN**: untuk D1, tambahkan "anggaran baris" ke desain: ukuran per tabel diproyeksikan pada skala sensus penuh, `EXPLAIN QUERY PLAN` untuk kueri hak, indeks pada kolom `WHERE` hak, dan pantau `meta.rows_read`/`rows_written` hasil D1 per rute. Prinsip METI "layar membaca JSON potret dari R2" sudah memindahkan beban baca; pastikan juga jalur tulis dan hak punya indeks.

**5.7 Zona waktu.**
Bukti: `AUDIT-NAS:334-420` (Z-1 tanggal UTC menimpa baris kemarin; Z-2 jam diketik disimpan ber-offset `+07:00` mati; Z-3 mesin zona tak terpasang di 12 halaman bertoken; Z-4 `system-health` salah hari; Z-5 batas 48 jam longgar ke arah salah; Z-7 jam senyap WA dihitung WIB), hook `blok-waktu-utc.mjs` (tolak `toISOString().slice()`), `blok-jam-titik.mjs`.
Sebab: Indonesia tiga zona (WIB/WITA/WIT); pangantara membangun WIB lalu jadi nasional (9.2 di `R700:3355`).
Verdict: **TERAPKAN**: Workers selalu UTC. Simpan waktu UTC ISO-8601 (`Z`), tanggal "hari ini" selalu lewat satu formatter di `i18n.js`/`algo.js` dengan zona eksplisit (default `Asia/Jakarta` atau zona pengguna), dilarang `toISOString().slice(0,10)` sebagai tanggal lokal, dan gerbang pemindai untuk polanya (dengan asersi "masih melihat").

**5.8 Otomasi menyiapkan, manusia memutuskan kirim.**
Bukti: `KANON:~44-50` (prinsip 2): "tidak ada blast diam-diam; otomasi yang tidak bisa dimatikan ditolak; agent otonom berhenti di PR".
Verdict: **TERAPKAN**: email pengingat/undangan massal METI lewat antrean yang disetujui admin dan kill-switch.

**5.9 Penutupan insiden tiga lapis.**
Bukti: `RUNBOOK` §8, `R700:11-35`, skill `beresin-gagal-deploy`.
Verdict: **TERAPKAN** tanpa skill khusus: templat catatan insiden (gejala, sebab akar, perbaikan, gerbang yang ditambahkan, tanggal).

**5.10 Dokumen kesiapan nasional sebagai audit berkala.**
Bukti: `AUDIT-NAS` (12 Sep 2026, 930+ baris): temuan bertingkat KRITIS/TINGGI dengan bukti `path:baris`, "kekuatan yang haram dibongkar" (§3.8), strategi per tema, rencana ber-milestone, pertanyaan terbuka bagi pemilik, "cara audit dikerjakan" (§7).
Verdict: **TERAPKAN**: jadwalkan audit pra-peluncuran METI dengan format yang sama (skill `audit-teknis` global sudah mengikuti), terutama bagian "kekuatan yang haram dibongkar" agar perbaikan tidak merusak yang benar.

---

## 6. Design system dan UI

**6.1 Token sebagai CSS variable berpola triplet RGB, dark mode lewat class.**
Bukti: `app/globals.css:6-21` (`--color-paper: 245 247 251`, `--color-ink`, `--color-brand`, `--color-accent`), `:63-67` (mode gelap), `tailwind.config.ts:1-30`.
Verdict: **TERAPKAN**: `public/tokens.css` dengan triplet RGB agar `rgb(var(--ink) / .5)` bekerja tanpa preprocessor; tema gelap lewat `[data-theme=dark]` dan `prefers-color-scheme`; satu sumber token (METI `DESIGN-SYSTEM.md`).

**6.2 Kelas yang tak ter-generate gagal diam.**
Bukti: `tailwind.config.ts:~12-18`: skala opacity default tak punya `/8`, 118 pemakaian kehilangan gaya diam-diam (28 Jul 2026).
Verdict: **SESUAIKAN**: tanpa Tailwind, risikonya berpindah ke nama kelas/variabel CSS yang dipakai tapi tak didefinisikan; gerbang pemindai membandingkan `var(--x)` dan `class="..."` terhadap `tokens.css`/`app.css`.

**6.3 Kanon: satu berkas yang wajib dibaca, sisanya kamus.**
Bukti: `KANON:10-37` (beban baca di depan turun dari 9 berkas / 1.642 baris "wajib" yang tak ada yang membaca menjadi 2 berkas), `CLAUDE.md` tabel "Aturan baru ditulis di berkas yang mana".
Verdict: **TERAPKAN** untuk `DESIGN-SYSTEM.md`: satu halaman prinsip + keputusan terkunci, rincian angka di berkas terpisah yang dibuka saat perlu.

**6.4 Mode berdasarkan audiens (A internal, B tautan HP lapangan, C proyek baru) dengan dial V/M/D dan "Design Read" satu baris.**
Bukti: `KANON:86-110`.
Verdict: **SESUAIKAN**: METI punya tiga audiens: pengunjung publik direktori, anggota berlogin (isi/ubah profil), admin/kurasi. Ambil gagasan menetapkan mode sebelum menulis UI, bukan nilai dial-nya.

**6.5 Tabel: anatomi baku dan aturan kecil yang menghentikan pengulangan koreksi.**
Bukti: `KANON:250` (no. 102 kepala tabel selalu rata tengah; uang/Qty kanan; teks kiri), `:259` (no. 111 popup tidak pernah menyuruh menggeser ke kanan), `:254` (no. 106 blok dashboard punya lima unsur: grafik, rata-rata, total, perbandingan, rincian di popup), `docs/STANDAR-TABEL.md`.
Verdict: **SESUAIKAN**: direktori METI = tabel + kartu + peta; tetapkan anatomi tabel sekali (kolom angka rata kanan, kepala konsisten, paginasi server, urut yang jelas, responsif HP).

**6.6 Anggaran performa halaman tanpa login di HP kelas menengah-bawah.**
Bukti: `ARCHITECTURE.md:§6` ("anggaran performa paling ketat ... mereka berhenti mengisi").
Verdict: **TERAPKAN**: halaman publik METI (sensus, direktori) dibaca dari potret JSON R2 + cache tepi; anggaran bobot halaman dan INP dipatok di CI.

**6.7 INP.** Lihat 4.11.

**6.8 Aksesibilitas.**
Bukti: tidak ada gerbang a11y mekanis yang ditemukan (`ls tests/unit | grep -i "a11y|aksesib|kontras"` kosong; hanya `aria-expanded` dalam pola INP, `components/ui/transisi.ts`). `app/layout.tsx:49` mengatur `lang="id"`.
Verdict: **TIDAK ada untuk ditiru**; METI harus menambah sendiri: pemeriksaan kontras token, `axe`/`pa11y` smoke pada halaman utama, fokus keyboard, label formulir, `prefers-reduced-motion`.

**6.9 i18n.**
Bukti: pangantara hanya satu bahasa (`app/layout.tsx:49`), tidak ada kamus. Aturan tulisan yang bisa dipakai: hook `blok-em-dash.mjs`, `blok-jam-titik.mjs`, `KANON` "Tulisan dan angka".
Verdict: **TIDAK PERLU sebagai model i18n**. Yang diambil: aturan copy dikunci mesin (tanda baca, format jam/angka lewat satu formatter), dan gerbang "tidak ada teks Indonesia tertanam di JS" yang sudah direncanakan METI (DESAIN-TEKNIS §8.4).

**6.10 Komentar "kenapa" sebagai instrumen audit.**
Bukti: `AUDIT-NAS:§3.8` butir 8: beberapa temuan ditemukan justru karena komentar menuliskan apa yang seharusnya terjadi lalu kodenya berselisih (`kdmp_dalam_cakupan` 0827, `/api/kdmp/rekap`).
Verdict: **SESUAIKAN**: komentar sebab dan tanggal untuk keputusan non-sepele dan setiap gerbang; tidak sepanjang di pangantara (lihat 8.1).

**6.11 Service worker dan antrean offline.**
Bukti: `public/sw.js` (10,7 KB) + idempotensi (2.12).
Verdict: **TIDAK PERLU** di fase 1; **SESUAIKAN** nanti bila formulir anggota di jaringan buruk jadi masalah.

---

## 7. Tata kelola agent dan armada

**7.1 Indeks tipis yang dimuat tiap sesi + dokumen DNA terpisah + aturan "ditulis di berkas yang mana".**
Bukti: `CLAUDE.md` (180 baris, 19,7 KB) vs `AGENTS.md` (619 baris, 109,8 KB); tabel "Aturan baru ditulis di berkas yang mana"; hook `blok-claude-md-gemuk`; `AGENTS.md` sengaja tidak di-`@import`.
Verdict: **SESUAIKAN**: ambil pembagian "fakta/invarian repo di CLAUDE.md, DNA agent di AGENTS.md, ranjau di satu katalog". Jaga `AGENTS.md` METI ringkas (di bawah ~200 baris); 110 KB itu sendiri hutang (8.1).

**7.2 Model tertulis per agent; agent bawaan mewarisi Opus.**
Bukti: `AGENTS.md:303-330` (§1.3): tabel bentuk kerja -> model (haiku pencocok pola; sonnet pembaca-penyimpul; opus perencana); "Opus MERENCANAKAN, model murah MENGERJAKAN"; setiap `.claude/agents/*.md` wajib `model:` (gerbang `tests/unit/gerbang-model-agent.test.ts`); agent bawaan (`general-purpose`, `Explore`, `Plan`) tak punya berkas sehingga mewarisi model induk: 67,6% dari 330 dispatch jatuh ke dua yang pertama (diukur 14 Sep 2026 dari 1.346 transkrip).
Verdict: **TERAPKAN** (sejalan dengan `~/.claude/AGEN.md`): `model:` di setiap agent, env `CLAUDE_CODE_SUBAGENT_MODEL`, gerbang yang menolak agent tanpa model.

**7.3 Roster sebagai manifest, berkas agent di-generate.**
Bukti: `scripts/agents/roster.json` -> `npm run agents:build` / `agents:check`; kepala setiap `.claude/agents/*.md`: "DI-GENERATE ... Sunting manifest-nya, bukan berkas ini".
Verdict: **TERAPKAN**, versi ringan: satu `roster.json`, skrip generate, gerbang `--cek`.

**7.4 Ilmu per agent dan jejak terkunci ke blob git.**
Bukti: `AGENTS.md:381-411` (§1.5): `.claude/ilmu-agent/KATALOG.md` (generate), `.claude/ilmu-agent/<nama>.md` (peta berkas, ranjau, gerbang, Kasus), `.claude/ilmu-agent/jejak/<nama>.jsonl`; `ilmu.mjs cek` menjawab `LEWATI` hanya bila blob berkas DAN hash definisi agent sama; plafon ilmu 40 KB; pemilik tunggal tiap halaman/route/komponen.
Verdict: **SESUAIKAN**: mulai dengan KATALOG + `ilmu/<nama>.md` pendek per agent. Jejak berbasis blob ditunda sampai review berulang jadi mahal. Pemilik tunggal per wilayah (`gerbang-ilmu-agent.test.ts`) layak diambil sejak awal karena mencegah dua agent menimpa pekerjaan satu sama lain.

**7.5 Otoritas orkestrator membuat agent, dengan pemicu dan batas.**
Bukti: `AGENTS.md:~395-410`: tiga pemicu (berkas tanpa pemilik dengan kelas kerja berulang; dua kali jatuh ke `general-purpose`; ilmu menembus 40 KB); batas: agent baru tak boleh push/deploy/melonggarkan gerbang dan tak boleh memegang wilayah agent lain.
Verdict: **TERAPKAN** persis, termasuk larangan push/deploy (sejalan dengan DESAIN-TEKNIS §8.5: subagent tidak deploy, push, atau commit).

**7.6 Pengulas bukan penulis, konteks bersih, melapor bukan memperbaiki.**
Bukti: `AGENTS.md:540-554` (§6; tabel permukaan -> pengulas: `selera-guard`, `security-reviewer`, `perf-reviewer`, `inp-reviewer`, `code-review`, `db-migrator`), `AGENTS.md:~436-460` (§3.2 verifier wajib konteks bersih).
Verdict: **TERAPKAN**: padankan untuk METI: `hak-auditor` (jalur ke D1 harus lewat `hak.js`), `security-reviewer`, `migrasi-idempoten`, `penulis-uji-integrasi`, `i18n-guard`, `inp-reviewer`. Haiku untuk pencocok pola, Sonnet untuk yang menyimpulkan.

**7.7 Sapuan agent paralel dengan prompt yang menyebut BERKAS, bukan domain.**
Bukti: `AGENTS.md:~325-328`: dua agent sonnet yang disuruh "inventarisasi domain X" menghabiskan 271.532 token untuk dua daftar yang muat di satu layar (12 Sep 2026); batas paralel maks 4 (hook `blok-agent-kebanyakan.mjs`, `R700` §6).
Verdict: **TERAPKAN**: perintah agent menyebut glob/berkas/perintah dan format keluaran; maksimal 4 agent bersamaan.

**7.8 Hook pemblokir sebagai katalog yang diikat mesin ke settings.**
Bukti: `.claude/hooks/KATALOG.md:1-30` (satu baris per hook; `tests/unit/gerbang-deploy.test.ts` menolak drift dua arah; `blok-hook-tak-terdaftar.mjs` menolak hook baru tanpa baris); contoh hook bernilai tinggi: `blok-sintaks-rusak`, `blok-waktu-utc`, `blok-impor-hilang`, `blok-tabel-aturan-patah`, `blok-em-dash`, `blok-jam-titik`.
Verdict: **SESUAIKAN**: ambil sedikit yang menahan kelas berulang di JS murni: sintaks rusak, `toISOString().slice`, impor `import` tak terpasang, teks Indonesia tertanam di JS layar, dan hook "jalur D1 di luar hak.js". Jangan meniru 72 hook; tiap hook harus punya insiden sumber.

**7.9 Gerbang konteks: knowledge graph sebelum membaca.**
Bukti: `CLAUDE.md` bagian "Gerbang konteks", `npm run kg`, `kg/graph.json`.
Verdict: **TIDAK PERLU dulu**. Repo METI kecil. Bila tumbuh, `graphify` global sudah ada.

**7.10 Stop hook auto-commit dan push ke `main`.**
Bukti: `CLAUDE.md` bagian "Git & deploy"; `R700` §1 (gerbang 3); 239 `PUSH DITAHAN` dalam sebulan (`R700:~96`).
Verdict: **TIDAK PERLU / JANGAN**: METI menetapkan subagent tidak commit/push/deploy. Pelajaran yang berguna: vonis gerbang yang benar 22 dari 22 kali tetapi penerimanya salah (tumpukan commit yang ditahan menunggu tangan manusia).

**7.11 Ukur biaya konteks.**
Bukti: `npm run token:ukur` (`scripts/token-ukur.mjs`), `AGENTS.md:~330`: 103,9 rb token konteks median sebelum satu hasil alat; di 63 giliran terberat angka delegasi rendah; Giliran yang menggiling sendiri ditolak mesin.
Verdict: **SESUAIKAN**: ukur sekali sesudah menyusun `CLAUDE.md`/`AGENTS.md` METI; tidak perlu mesin penolak.

**7.12 Mesin 24 jam, routine cloud ("Dalang", "pelunas", "pembaru buku pegangan"), buku vonis.**
Bukti: `R700:563` (§3.6), `scripts/pelunas/*`, `scripts/mesin/*`, `package.json` skrip `pelunas:*`, `mesin:*`, `vonis:*`, `dalang`.
Verdict: **TIDAK PERLU**. Biaya perawatan dan jumlah kelas gagal baru yang dilahirkannya sendiri besar (lihat 8.5).

---

## 8. Kesalahan dan hutang yang JANGAN ditiru

**8.1 Dokumen aturan yang membengkak.** `R700` 7.903 baris dan `AGENTS.md` 109,8 KB (`AGENTS.md:603` "Imported Claude Cowork project instructions" menumpuk di bawah §9). Sembilan berkas "wajib" 1.642 baris pernah tak dibaca siapa pun (`KANON:~14`). Katalog baru ikut menambah dokumen yang harus disegarkan (`BRIEF-TIM-WEBSITE-PINKA`: 207 rb token salinan, dijaga uji). Bagi METI: batasi, indeks tipis + katalog bertanggal, hapus yang basi. **Jangan tiru.**

**8.2 Berkas raksasa dan `any`.** `ARCHITECTURE.md:§11`: 21 berkas >2.000 baris, `app/(app)/po/page.tsx` 6,7 rb baris; 1.249 `as any`; contoh `const db = supabase as any` di `app/api/cron/ops-automation/route.ts:~48`. Ratchet menahan pertumbuhan, bukan menurunkan. Bagi METI: plafon ukuran berkas sejak commit pertama (mis. 400 baris/modul), bukan ratchet belakangan.

**8.3 Sampah terlacak di git dan akar repo.** Hasil `git ls-files`: `.cursorrules 2`, `.nvmrc 2` (hasil duplikasi Finder), `LICENSE 2`, `.skillignore 2`, `.gitkeep 2` di `bekal/`, `t8.sql`, `tugas-jalur-m.txt`, `scratchpad-dump2.mjs`, `scratch-inspect.mjs`, folder `scratch/` (8 berkas), `schema.sql`, `seed.sql`, `seed_sppg.sql` di akar; `bekal/` melacak 2.355 berkas salinan lapisan global `~/.claude` (sampai harus dikecualikan dari CI di `ci.yml:~32-37`). `R700` §3.23 "Salinan Finder yang meracuni gerbang, bukan repo" mencatat kelasnya. Bagi METI: `.gitignore` untuk `* 2*`, hook pre-commit yang menolak nama berakhiran ` 2`, tidak ada salinan konfigurasi pribadi di repo. **Jangan tiru.**

**8.4 Dokumen dengan angka basi yang saling bertentangan.** `ARCHITECTURE.md:§11` menyebut `.git` 640 MB; di mesin ini `du -sh .git` = 117 MB. `ARCHITECTURE.md:§1` menyebut "tidak ada backend terpisah" sementara `CLAUDE.md` mencatat dua sidecar (`wa-gateway/`, `ocr-server/`) dan tiga skrip mesin lokal. `RUNBOOK` §1 pernah menunjuk domain yang ternyata hanya domain surel, sehingga langkah pertama selalu terbaca "app mati" (4 Sep 2026). Angka yang bisa dihasilkan mesin sebaiknya di-generate (`kg/PETA.md`) bukan ditulis tangan (`700 §7`). **Jangan tiru.**

**8.5 Meta-proses yang melahirkan kelas gagal baru.** Buku vonis push, pelunas `claude -p`, Dalang, antrean lock global `/tmp/claude-heavy-queue.lock`, `blok-claude-md-gemuk` vs `blok-hook-tak-terdaftar` yang saling mendorong (`.claude/hooks/KATALOG.md:~12`), pre-push 4-10 menit dengan pemegang kunci berumur 11 jam 26 menit (`R700` §6 baris `.husky/pre-push` tanpa plafon waktu), 239 `PUSH DITAHAN`. `R700` §6 mencatat belasan "lubang yang masih terbuka" yang lahir dari mesin penjaga itu sendiri. Bagi METI: gerbang sedikit, cepat, dan masing-masing punya insiden asal; hindari proses yang mengelola proses. **Jangan tiru.**

**8.6 Tanpa branch, tanpa PR, semua ke `main`; `--no-verify` dipakai Stop hook.** `R700` §4 no. 7 dan `AGENTS.md:594` (§9); `R700` §6 baris "`git push --no-verify` melewati semua gerbang lokal" dan "Baris tumpukan ... masuk commit lewat Stop hook tanpa diformat (`--no-verify`)"; `.github/dependabot.yml:~16` (`open-pull-requests-limit: 0`). Pelanggaran satu gerbang mendarat di `main` lebih dulu baru ketahuan di CI (22 dari 34 merah = Test, `R700:~75`). METI: tetap pakai cabang/PR untuk perubahan hak, skema, dan keamanan (CODEOWNERS), sekalipun pemilik tunggal.

**8.7 Header dan kebijakan keamanan yang setengah jadi.** CSP hanya empat direktif (`next.config.ts:25-31`); middleware fail-open pada sesi `tak-terbaca` (`ARCHITECTURE.md:§2`, disengaja tapi memindahkan beban ke lapis berikut); tabel pembatas laju ada bulan-bulan tidak dipakai (`lib/api-guard.ts:~145`); audit menemukan 4 kritis keamanan hanya 50 hari sesudah peluncuran fitur (K-1 sampai K-4, `AUDIT-NAS:143-238`), seperti `/api/kdmp/link` menerbitkan dan mencabut token portal koperasi mana pun (K-4) dan `qty_terima` negatif dari tautan publik masuk draf invoice (K-5). METI: matriks hak dan uji penolakan ada SEBELUM rute, bukan sesudah audit.

**8.8 Detail kriptografi kecil.** Perbandingan secret `!==` (`app/api/cron/ops-automation/route.ts:44`) dan HMAC-SHA1 (`app/api/ops/notify/route.ts:~30`). Gunakan `timingSafeEqual` dan SHA-256.

**8.9 Data pribadi di dokumentasi repo.** `docs/RUNBOOK.md` §7 memuat nama dan nomor telepon orang, dan §1 memuat ID proyek Supabase serta domain; alasan penyalinan masuk akal (kontak harus terbaca saat sistem mati), tetapi repo pangantara bukan tempat yang terkunci. Laporan ini tidak menyalin nilainya. METI: simpan peran, bukan nama/nomor; kontak darurat di dokumen pemilik di luar repo, dan `KEAMANAN-PRIVASI.md` mencatat lokasinya. **Jangan tiru.**

**8.10 Cermin data produksi mentah ke artifact CI.** `cermin-e2e.yml` menyalin seluruh data (kecuali `public.audit_log`) dan `auth.users` ke artifact GitHub terenkripsi 3 hari, dan `cadangan-db.yml` menyimpan cadangan 30 hari sebagai satu-satunya salinan (komentar kepala: "Tidak ada bucket pihak ketiga"). Untuk data sensus pribadi: salinan di infrastruktur CI memperluas permukaan UU PDP dan membuat cadangan bergantung pada satu akun GitHub yang pernah mati tiga kali karena anggaran. METI: cadangan ke R2 terpisah + replika di luar akun; uji pakai seed sintetis.

**8.11 Single point of failure manusia.** `RUNBOOK` §7: dua peran dipegang orang yang sama dan tidak ada cadangan orang. METI (pemilik tunggal): minimal tulis pemulihan sehingga orang kedua bisa menjalankannya dari dokumen, dan ambil pelajaran bahwa dokumen tidak menutup masalah ini.

**8.12 Pelanggaran sendiri atas aturan terkunci.** Aturan "jangan lemahkan gerbang demi deploy" lalu pada 7 Okt 2026 pre-push dilonggarkan atas keputusan pemilik (`R700` §4 no. 5) karena biayanya; dampak baru dicatat sebagai lubang (`R700` §6). Pelajaran: ongkos gerbang harus dirancang sejak awal (cepat, terkait-diff, deterministik) agar tidak perlu dilonggarkan.

**8.13 Pola yang berulang karena mengandalkan kewaspadaan agent paralel.** `R700` §3.27 dan §6: stempel migrasi bentrok 4 kali dalam 2 hari; `create or replace` atas salinan usang (§9.7.5) "peringatan yang ditulis sembilan jam sebelum kelasnya meledak". Pelajaran: ketika banyak sesi menulis bersamaan, aturan di dokumen kalah; hanya gerbang mekanis yang menahan.

---

## 9. Padanan Supabase/Vercel ke Cloudflare (ringkas)

| Pangantara | METI (Cloudflare) |
| --- | --- |
| RLS Postgres + `get_my_role()` + `SECURITY DEFINER` | `src/hak.js` satu-satunya pintu D1; filter hak digabung AND ke setiap kueri; uji perilaku peran x baris |
| `requireStaff()` di tiap route | `hak.js` dipanggil router objek; sesi -> baris `akun` aktif berperan |
| `createAdminClient()` (service role) | binding `env.DB` (selalu "service role"); gerbang statis memindai akses di luar `hak.js` |
| Tabel `rpc_rate_limit` + RPC atomik | tabel `laju` di D1 atau Rate Limiting binding/WAF; `CF-Connecting-IP` |
| `vercel.json` crons + `CRON_SECRET` | `triggers.crons` (handler `scheduled()` tanpa secret); kill-switch di `pengaturan` |
| Vercel Promote (rollback) | `wrangler rollback`; D1 Time Travel; R2 versioning |
| `supabase db dump` + GPG + artifact 30 hari | `wrangler d1 export --remote` -> enkripsi -> R2 `cadangan/` + replika luar akun |
| PITR Supabase (berbayar) | D1 Time Travel [cek retensi paket] |
| `list_migrations` / drift | `PRAGMA`/`sqlite_master` remote vs `migrations/*.sql`; tabel `d1_migrations` bukan bukti |
| `lib/database.types.ts` generate | `skema.js` + gerbang vs `PRAGMA table_info` |
| `max_rows` 1000 PostgREST | keyset pagination + plafon helper + batas baris-baca D1 |
| `automation_runs` + System Health | `jejak_pipeline` + `/api/status` berbasis umur artefak |
| `instrumentation.ts` -> `ops_events` + web push | `try/catch` global + `ctx.waitUntil` -> `peristiwa_ops` -> email/ntfy; `observability.enabled` |
| Vercel Toolbar INP overlay | `PerformanceObserver` event timing + smoke Playwright |
| Preview Vercel / Review Lokal Supabase | `env.staging` + Miniflare lokal; tanpa salinan produksi |
| Supabase Storage/Drive arsip | R2 (`privat/`, `cadangan/`, `potret/`) |
| Edge/Node bundling, chunk skew, heap build | tidak ada (tanpa build step) |

---

## 10. Urutan penerapan yang disarankan untuk METI

1. Sebelum rute pertama: matriks hak diuji (2.3, 2.4, 2.6, 2.7, 2.8), header + CSP penuh (2.1), pembungkus galat (2.11), skema dengan CHECK/UNIQUE (3.8), konvensi waktu UTC (5.7).
2. Sebelum pengguna pertama: cadangan D1 -> R2 + uji pemulihan (3.13), `/api/status` berbasis umur (5.4), runbook gejala dengan RPO/RTO (5.1), tombol dummy berjejak di staging (4.10), CI dengan Miniflare + uji integrasi (4.5, 4.8), gerbang drift D1 (1.6).
3. Bersama pipeline R8: parser per sumber + hitungan unik (3.3, 3.4), jejak run dengan kosakata dari CHECK (3.5), provenans + umur (3.6), backoff (3.11), dedup tanpa kunci nama (3.10).
4. Tata kelola agent: `model:` per agent + roster manifest + pengulas terpisah (7.2, 7.3, 7.6), AGENTS.md ringkas, hook sedikit yang punya insiden asal (7.8).
5. Audit pra-peluncuran berformat `AUDIT-NAS` (5.10).
