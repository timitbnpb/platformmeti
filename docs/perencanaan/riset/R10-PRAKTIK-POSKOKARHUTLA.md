# R10. Praktik terbaik dari repo poskokarhutla untuk Jaringan METI

- Tanggal: 7 Nov 2026
- Repo diperiksa: `/Users/priyankaalfatehan28/Documents/GitHub/poskokarhutla`, commit `c7ba969d1` (`git rev-parse --short HEAD`), cabang `main`, bersih.
- Tujuan: menyaring praktik yang layak ditiru (dan yang jangan) untuk Jaringan METI: direktori/sensus pelaku energi terbarukan Indonesia, dwibahasa ID/EN, login + peran Super/Admin/anggota, hak per baris di Worker (D1 tidak punya RLS). Stack METI: Cloudflare Workers + D1 + R2, JS murni (lihat `DESAIN-TEKNIS.md` §1 dan §8).
- Cara baca: tiap butir = praktik, bukti `path:baris`, kenapa penting / insiden, **verdict**: TERAPKAN (ambil apa adanya) / SESUAIKAN (ambil idenya, ubah bentuknya) / TIDAK PERLU.
- Aturan penulisan: tidak ada nilai rahasia, token, ID akun, email, atau data pribadi yang disalin; hanya nama variabel (`IP_SALT`, `ADMIN_TOKEN`, `SESI_KUNCI`, `TURNSTILE_SECRET`, `TURNSTILE_SITEKEY`, `CLOUDFLARE_API_TOKEN`, dst.).
- Batas pemeriksaan: repo ini besar (26 rb baris di `src/`, 108 migrasi, 51 berkas gerbang di `tests/agen`, 140 berkas di `tests/warga`, 30 workflow). Saya membaca penuh berkas kebijakan dan gerbang inti, dan memeriksa sampling kode (`worker.js`, `staf.js`, `instansi.js`, `akademisi.js`, `index.html` bagian peta). Nomor baris dapat bergeser bila repo itu berubah; tanda `~` = perkiraan ±5 baris. Hal yang berasal dari pengetahuan umum (bukan dari repo) ditandai **[umum, verifikasi]**.

---

## Ringkasan: 15 hal terpenting

1. Gerbang mekanis menurunkan kebutuhan dari kode lalu menagihnya ke konfigurasi (binding, cron, jumlah aturan `_headers`): insiden nyata di produksi, bukan teori.
2. Registri cakupan uji (`cakupan.json`): tiap rute/tabel/trigger baru wajib tercatat sebagai "diuji" (dengan nama uji yang benar-benar ada) atau "dikecualikan" (dengan alasan); utang `antre` hanya boleh menyusut.
3. Uji integrasi memakai Miniflare + D1/R2 lokal sungguhan + migrasi apa adanya, tanpa mock.
4. Hak per baris di Worker: cakupan wilayah disisipkan sebagai klausa SQL tunggal (`lingkupSql`) + padanannya di memori (`dalamLingkup`), plus trigger SQL yang menjaga nilai peran/wilayah.
5. Penjaga data basi sebelum deploy (`jaga_segar.py`) dan "situs live sebagai cadangan data" (`isi_data.py`): lahir dari insiden situs mundur 11 hari tanpa galat.
6. Batas laju di D1 dengan kunci IP di-hash + garam, IPv6 dipangkas ke /64, ditambah batas gagal-masuk berlapis (pengguna+IP, pengguna, IP) yang memverifikasi sandi lebih dulu.
7. CSRF ketat: POST bersesi wajib Origin sama-situs (Origin kosong/`null` hanya lolos bila `Sec-Fetch-Site: same-origin`) + header `x-pb: 1` untuk sesi staf.
8. Audit log append-only dipaksa trigger SQL (`RAISE(ABORT)` pada UPDATE/DELETE).
9. Anggaran Cloudflare Free dijaga gerbang: satu cron `* * * * *`, tugas dipin ke menit tetap, tugas lebih sering dari per jam harus terdaftar beralasan.
10. Tata kelola agent: `AGENTS.md` sebagai router + kebijakan model (Opus rencana, Sonnet kerja, Haiku cocok-pola), tiap agent wajib `model:`, ilmu per agent di repo, verifier berkonteks bersih.
11. Peta: MapLibre GL JS 4.7.1 + gaya OpenFreeMap (positron/dark), dimuat malas; pin berlogo = marker HTML terbatas per viewport (decluttering) + circle layer; tabel wilayah turun-bor Indonesia > provinsi > kab/kota dengan hitungan.
12. Peta direktori punya padanan "Daftar" (bukan hanya kanvas), kotak cari ber-ARIA combobox, dan fallback galat jika pustaka gagal dimuat.
13. JANGAN TIRU: kata sandi disimpan sebagai `sha256(garam + sandi)` (bukan KDF lambat), dibandingkan dengan `===`.
14. JANGAN TIRU: CSP memakai `'unsafe-inline'`; `index.html` monolit 898 KB dan `akademisi.js` 658 KB; tidak ada cadangan D1 terjadwal/Time Travel yang terdokumentasi; staging berbagi D1/R2 produksi.
15. JANGAN TIRU: logo entitas di-hotlink dari domain pihak ketiga (rantai favicon) dan MapLibre dimuat dari CDN tanpa SRI padahal salinan vendor ada; peta direktori tidak ikut berganti tema gelap/terang setelah dibuat.

---

## 1. Infrastruktur dan deploy

### 1.1 Gerbang konfigurasi produksi: kebutuhan diturunkan dari kode
- Praktik: uji membaca `src/*.js`, mengekstrak semua `env.X` dan konstanta `CRON_*`, lalu menagih bahwa `wrangler.jsonc` produksi punya binding/cron yang dipakai kode.
- Bukti: `tests/agen/gerbang-wrangler.test.mjs:1-8` (insiden), `:25-26` (regex ekstraksi), `:33-37` (binding), `:43-50` (cron).
- Insiden: cron FIRMS dan R2 `MEDIA` sempat hanya ada di `wrangler.warga.jsonc`; titik panas D1 berhenti diperbarui dan unggah foto menjawab 503 tanpa satu pun uji merah (15 Okt 2026).
- Verdict METI: **TERAPKAN**. Satu uji ~50 baris yang menagih `wrangler.jsonc` terhadap `env.*` di `src/` (DB, MEDIA, ASSETS, secret yang wajib). Hindari berkas wrangler kedua yang "usulan".

### 1.2 Satu berkas wrangler, nama worker keramat
- Praktik: komentar di kepala `wrangler.jsonc` menjelaskan bahwa nama worker = worker yang memegang domain, secret, dan cron.
- Bukti: `wrangler.jsonc:2-4`; konfigurasi inti `:6-21` (assets + `run_worker_first` larik, D1 `DB`, R2 `MEDIA`, `observability.enabled`).
- Insiden: 16 Okt 2026 worker aslinya berganti nama di dasbor; terbit berikutnya membuat worker baru tanpa domain dan secret, situs publik membeku sejak 17 Okt 00.42 WIB.
- Verdict METI: **TERAPKAN**. Tulis nama worker, domain, dan secret yang diperlukan di komentar `wrangler.jsonc`; jangan pernah mengganti nama tanpa memindah domain + secret. Tambahkan gerbang yang gagal bila `name` berubah dari yang tercatat di ADR.

### 1.3 Aset statis dulu, Worker hanya untuk yang perlu
- Praktik: `assets.run_worker_first` hanya `["/*.html"]` (gerbang akses di Worker); JS/CSS/JSON/gambar dilayani aset tanpa memanggil Worker, jadi hemat kuota. `html_handling: "none"`.
- Bukti: `wrangler.jsonc:8-11`; `src/worker.js` ~781-830 (daftar rute HTML lewat Worker, kunci jalur untuk statistik).
- Catatan: butuh wrangler >= 4 untuk larik `run_worker_first`.
- Verdict METI: **SESUAIKAN**. METI punya halaman bergerbang login (direktori anggota) sehingga pola ini cocok; tetapkan satu versi wrangler untuk lokal DAN CI (lihat butir 8.6, repo ini punya tiga versi berbeda).

### 1.4 Deploy hanya lewat CI, setelah gerbang uji
- Praktik: `terbit.yml` dipicu `workflow_dispatch` saja; urutan: `npm ci` -> `npm run uji:agen` -> `npm run uji:warga` -> `uji:sippa` -> pulihkan data -> `jaga_segar.py` -> `wrangler deploy`. Uji merah = tidak deploy. `concurrency: group: data, cancel-in-progress: false`. `timeout-minutes: 25`.
- Bukti: `.github/workflows/terbit.yml:1-9` (komentar), `:12-24` (concurrency, timeout), `~:25-40` (langkah uji), langkah "Terbitkan ke Cloudflare" `~:115-135` (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` dari `secrets.*`).
- Pemicu push tidak langsung, melainkan lewat `terbit_antre.yml` supaya tidak mengusir cron data dari satu-satunya slot antre (insiden 27 Okt 2026).
- Verdict METI: **SESUAIKAN**. Ambil urutan "uji dulu baru deploy" dan `concurrency` tanpa cancel. METI tidak punya jalur data berat, jadi cukup satu workflow `deploy.yml` (push ke `main` setelah uji hijau) tanpa antrean ganda.

### 1.5 Pratinjau/staging
- Praktik: cabang non-`main` memakai `wrangler versions upload --preview-alias staging` (tidak dipromosikan; domain dan cron produksi tak berubah).
- Bukti: `.github/workflows/terbit.yml` langkah terbit (percabangan `$GITHUB_REF_NAME`), komentar "staging memakai D1/R2 produksi yang sama".
- Kelemahan sendiri: staging berbagi D1/R2 produksi, jadi laporan uji di staging masuk basis produksi.
- Verdict METI: **SESUAIKAN**. Pakai pratinjau versi, tetapi dengan D1 + R2 **terpisah** (`env.staging` di wrangler, `database_id` berbeda). Data direktori anggota terlalu sensitif untuk berbagi basis.

### 1.6 Anggaran cron Free: satu jadwal, dispatcher dalam kode
- Praktik: `triggers.crons = ["* * * * *"]`; `scheduled()` memilih tugas dari menit/jam UTC; tiap tugas dibungkus `try/catch` sendiri sehingga satu kegagalan tidak menjatuhkan yang lain.
- Bukti: `wrangler.jsonc:18`; `src/worker.js:906-935` (dispatcher); `tests/agen/gerbang-anggaran-cf.test.mjs:1-8, 21-24, 28-41 (LEBIH_SERING, daftar beralasan yang hanya boleh menyusut), 43-60 (menitTetap, cekDispatcher), 73 (plafon aset 15.000 berkas / 25 MB)`.
- Insiden: 16 Okt 2026 terbit gagal karena akun Free maksimal 5 jadwal cron untuk semua worker.
- Verdict METI: **SESUAIKAN**. Bila METI di akun yang sama, pakai pola satu cron + dispatcher. Bila akun Paid, tidak wajib, tetapi gerbang "tugas pada menit tetap" dan `try/catch` per tugas tetap berguna. Tugas METI: bersih-bersih sesi/laju, tinjau kedaluwarsa anggota, cadangan.

### 1.7 Header statis dan batas aturan Cloudflare
- Praktik: `public/_headers` memuat header keamanan global + cache per jalur; `scripts/terbit/versi.py` menambahkan `?v=<hash isi>` dan menggabung aturan sebelum deploy; gerbang menjalankan `versi.py` pada salinan `public/` lalu menghitung aturan (batas keras 100, peringatan 80).
- Bukti: `public/_headers:1-30`; `tests/agen/gerbang-headers.test.mjs:1-8 (insiden kode 100324), 19-21 (MAKS_ATURAN=100, PERINGATAN=80), 28-34 (terbit pada salinan), 37-49 (urai), 56-64 (Cache-Control efektif)`.
- Insiden: dua deploy gagal karena `_headers` berisi 136 aturan (>100).
- Verdict METI: **TERAPKAN** (versi ringan). Cache-busting `?v=<hash>` dan gerbang jumlah aturan; METI kecil, jadi cukup aturan tulisan tangan + uji hitung.

### 1.8 Migrasi D1: idempoten, bernomor, beku
- Praktik: migrasi bernomor berurutan (`0001` ... `0108`), ditulis idempoten (`IF NOT EXISTS`, `DROP TRIGGER IF EXISTS` lalu buat ulang), migrasi lama tidak disunting ("beku"), daftar enum (peran, tab) dijaga sama di SQL, JS, dan klien oleh uji.
- Bukti: `migrations/0099_command_center.sql:1-14` (komentar idempoten, "0030/0085 ... beku", preseden DROP+CREATE trigger); agent `migrasi-idempoten` (`AGENTS.md:24, 195`); `tests/warga/_bantu.mjs:8-20` (pecah SQL per pernyataan, trigger `BEGIN...END` utuh).
- Catatan: terapan remote manual (`wrangler d1 migrations apply ... --remote`) dan tercatat di `WARGA.md:83, 180, 217, 285` serta `docs/OUTSTANDING.md` C3 ("cek sudah jalan di D1 produksi").
- Verdict METI: **TERAPKAN** idempotensi + "migrasi lama beku". **SESUAIKAN** penerapan: jangan manual; langkah `d1 migrations apply --remote` otomatis di CI **sebelum** `deploy`, supaya kode tidak pernah mendahului skema (repo ini berulang kali mencatat "terapkan migrasi dulu atau rute 503/500").

### 1.9 Pola degradasi saat tabel belum ada
- Praktik: rute baru menjawab 503 jelas bila migrasi belum diterapkan; cron mengembalikan `{lewat}`; `tabelBelum()` menangkap `no such table`.
- Bukti: `src/staf.js:~44` (`tabelBelum`), `WARGA.md:235, 250` ("tanpa itu rute menjawab 503 yang jelas; tugas lain tetap jalan").
- Verdict METI: **SESUAIKAN**. Berguna selama transisi, tetapi bila migrasi otomatis di CI (butir 1.8) cukup satu gerbang ekspor skema; jangan menyebar `no such table` di setiap modul.

### 1.10 Dev lokal
- Praktik: `npm run dev:warga` = `wrangler dev --local -c wrangler.warga.jsonc --port 8787`; `.dev.vars.example` berisi nama variabel (isi `IP_SALT`, `ADMIN_TOKEN` acak); `.dev.vars` dan `.env` di `.gitignore`.
- Bukti: `package.json:13`; `WARGA.md:47-50`; `.gitignore` (baris awal memuat `.dev.vars`, `.env`).
- Verdict METI: **TERAPKAN** `.dev.vars.example` dan skrip `dev`. Hindari konfigurasi dev terpisah yang menyimpang (lihat 8.6).

---

## 2. Keamanan

### 2.1 Header keamanan dan CSP
- Praktik: HSTS 1 tahun, `X-Frame-Options: SAMEORIGIN`, `nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (geolocation hanya self; kamera/mik/payment/usb ditutup), CSP **ditegakkan** (bukan report-only) sejak 1 Nov 2026 setelah semua halaman dibuka dengan CSP dan konsol bersih; `frame-ancestors 'self'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`; daftar putih eksplisit untuk host ubin/API di `connect-src`.
- Bukti: `public/_headers:1-30` (komentar penegakan + semua direktif), respons API membawa `x-content-type-options: nosniff` dari `src/worker.js:94` dan `src/api_v1.js:94`.
- Cacat: `script-src` dan `style-src` memuat `'unsafe-inline'` (`index.html` memuat skrip inline). Direktori `akademisi.js` sudah menulis "CSP: tanpa skrip inline" (`public/akademisi.js:3`), jadi mungkin.
- Verdict METI: **TERAPKAN** semua kecuali `unsafe-inline`: bangun METI tanpa skrip/gaya inline sejak awal, pakai nonce atau berkas eksternal, sehingga CSP bisa `script-src 'self'` murni. Daftar host peta (lihat §9) masuk `connect-src`/`img-src`/`worker-src blob:`.

### 2.2 CSRF
- Praktik: tiap POST/PATCH/DELETE melewati `tolakOrigin`: bila ada cookie sesi (`sesi_admin|sesi_pendataan|sesi_staf|sesi_kemitraan`) Origin wajib sama-situs; Origin kosong/`null` ditolak kecuali `Sec-Fetch-Site: same-origin` (header terlarang, tak bisa dipalsukan halaman). Tanpa cookie sesi: aturan lebih longgar. Tambahan sesi staf: kiriman wajib `x-pb: 1`.
- Bukti: `src/worker.js:634-643` (fungsi + komentar kasus iframe tersandbox), `:654-657` (diterapkan di router), `src/staf.js:7, ~64` (`x-pb`), `tests/warga/audit-keamanan-worker.test.mjs:1-4` (diuji di workerd).
- Verdict METI: **TERAPKAN**. Cookie `SameSite=Lax` saja tidak cukup (komentar `staf.js:7`). Pasang `tolakOrigin` di router sebelum handler apa pun.

### 2.3 Sesi dan cookie
- Praktik: token acak 32 byte, **hanya hash** (`sha256(token)`) disimpan di D1 (`staf_sesi.token_sha`), cookie `HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age`, masa hidup 30 hari, sesi lama staf dibersihkan saat masuk, ganti sandi mencabut sesi lain, keluar menghapus baris D1 (bukan sekadar cookie). Sesi admin berbeda: cookie bertanda tangan HMAC `SESI_KUNCI`, 12 jam (`WARGA.md:181`).
- Bukti: `src/staf.js:30-31 (SESI_UMUR, COOKIE)`, `:77 (cookieSet)`, `:~83-97 (masuk)`, `:~99-110 (keluar, gantiSandi mencabut sesi lain)`, `:~48-60 (muatSesi: JOIN, kedaluwarsa > ?, status = 'aktif')`.
- Verdict METI: **TERAPKAN** (token acak, hash di D1, cabut dari server, `status='aktif'` dicek tiap permintaan sehingga pencabutan anggota langsung berlaku). **SESUAIKAN** masa hidup: 30 hari mungkin panjang untuk Admin/Super; pakai 12 jam-7 hari berperan, sliding.

### 2.4 Kata sandi
- Praktik: sandi awal acak 16 huruf tampil sekali, `wajib_ganti = 1` sampai pengguna mengganti, sesi yang `wajib_ganti` hanya boleh ke rute ganti-sandi/keluar/saya; username tak dikenal tetap menghitung hash (anti pembeda waktu kasar).
- Bukti: `src/staf.js:1-9 (aturan pemilik)`, `:~83-90 (hash tetap dihitung untuk username tak dikenal)`, `src/instansi.js:93-122`, `:122 (403 wajib_ganti)`.
- Cacat: hash = `sha256(garam + sandi)` (`src/staf.js:79`, `src/instansi.js:100`, `src/worker.js:97`), bukan KDF lambat; perbandingan `===`. Pemilik repo menerimanya karena sandi acak 93 bit (`staf.js:8`). Untuk sandi pilihan manusia ini tidak aman.
- Verdict METI: **SESUAIKAN**. Ambil alur "sandi awal sekali pakai + wajib ganti". Untuk hash gunakan PBKDF2-SHA256 via WebCrypto (`crypto.subtle.deriveBits`, iterasi ~100 rb, batas CPU Worker diuji) atau, lebih baik, hindari kata sandi sama sekali: tautan ajaib (magic link) email + peran, atau OAuth. Bandingkan dengan perbandingan konstan-waktu. **[umum, verifikasi]**: Workers menyediakan `crypto.subtle.timingSafeEqual`.

### 2.5 Batas laju
- Praktik: tabel D1 `jejak`/`laju` menyimpan `(ip_hash, aksi, waktu)`; `cekLaju` memeriksa beberapa jendela (mis. `lapor` 10/jam + 30/hari); IP di-hash `SHA-256(IP_SALT | ip)`, IPv6 dipangkas ke /64 (`kunciIP`); penghitung global (`BATAS_GLOBAL_LAPOR = 600`/jam); jejak laju dihapus setelah 2 hari (IP mentah tidak disimpan, `WARGA.md:131`).
- Bukti: `src/worker.js:85-88 (BATAS)`, `:163-171 (cekLaju)`, `:172-179 (kunciIP, ipHash + catatan CGNAT)`, `src/staf.js:~84-95 (gagal-masuk: (username+IP) 8/jam, per username 200/jam, per IP 30/jam; sandi benar selalu masuk sehingga penyerang tak bisa mengunci pemilik)`.
- Catatan: tanpa `IP_SALT` semua POST dijawab 503 (`worker.js:~655-657`), jadi kegagalan konfigurasi terlihat.
- Verdict METI: **TERAPKAN**. Perhatikan kelemahan yang diakui: baca-lalu-tulis tidak atomik (`ponytail:` di `staf.js:8`); untuk METI pertimbangkan Rate Limiting binding atau Durable Object bila trafik naik.

### 2.6 Validasi input dan batas ukuran
- Praktik: `bacaBody` membatasi byte dan huruf (413), menolak non-objek JSON; `bacaBytes` membaca bertahap untuk badan chunked tanpa `Content-Length` dan membuang kelebihan agar koneksi tak putus; katalog jenis:sub divalidasi lewat uji yang mencoba **semua** pasangan sah dan silang (`WARGA.md:63`); regex ketat untuk id/parameter (`^[0-9A-Za-z]{16}$`, `/^A\d{4,12}$/`); filter query divalidasi (`?hal=1..50`, `?urut=` enum).
- Bukti: `src/worker.js:181-205`, `src/akademisi.js:~27-33`, `src/monitor.js:16`, `src/pemulihan.js:5-15` (enum + `pilih(...)`), `WARGA.md:63`.
- Verdict METI: **TERAPKAN**. Satu pustaka kecil `pilih/teks/angka` pembatas input bersama, bukan validasi ad hoc per rute. Tambahkan skema untuk entitas energi (kapasitas MW, koordinat dalam kotak Indonesia seperti `BATAS_ID` `worker.js:83`).

### 2.7 Turnstile
- Praktik: aktif hanya bila `TURNSTILE_SITEKEY` **dan** `TURNSTILE_SECRET` keduanya diset; sitekey dipantulkan ke klien lewat `/api/warga/konfig`; verifikasi sisi server ke `challenges.cloudflare.com/turnstile/v0/siteverify`; aksi yang berdampak publik (aduan, kirim laporan) wajib.
- Bukti: `src/worker.js:210-219 (turnstileOK)`, `:310, :392-393`; `wrangler.jsonc:20` (hanya nama var `TURNSTILE_SITEKEY` dipakai; `_headers` mengizinkan `challenges.cloudflare.com` pada script/frame).
- Verdict METI: **TERAPKAN** untuk formulir pendaftaran/klaim entitas dan "minta bergabung". Perhatikan fail-open saat `turnstileOK` tak dikonfigurasi (`return true`): di METI buat fail-closed di produksi.

### 2.8 Hak akses: peran + lingkup baris di Worker
- Praktik: (a) peran staf sebagai larik yang dijaga trigger SQL (`staf_larik_sah`: nilai peran harus dalam daftar, tak berulang, wilayah 2 digit); (b) `stafSesi` -> `stafPeran(env, req, peran)` -> `stafOK` (admin ATAU peran); (c) peran "tertentu saja" dipotong di `stafSesi` (`hanyaDirektori`) sehingga rute lain menolaknya tanpa menyunting satu per satu; (d) lingkup wilayah per baris: `lingkupSql(a)` menghasilkan `[klausa, bind]` yang ditempel ke SELECT, `dalamLingkup(a, t)` untuk memeriksa satu baris di memori, `dalamWilayahStaf` pada aksi tulis; (e) daftar peran yang boleh membuka sebuah modul adalah daftar EKSPLISIT (`P_AKADEMISI`), peran baru tertutup sampai dimasukkan; (f) daftar peran sama di SQL, `src/staf.js`, dan `public/admin/pantau.js`, dijaga uji.
- Bukti: `src/instansi.js:230-231`, `src/staf.js:28-30 (PERAN), :62-67 (hanyaDirektori, stafSesi), :89-103 (stafPeran, stafOK, dalamWilayahStaf)`, `src/akademisi.js:~13-17 (P_AKADEMISI + komentar)`, `src/monitor.js:12-31`, `migrations/0099_command_center.sql:4-14`, `tests/warga/akademisi_peran.test.mjs`.
- Verdict METI: **TERAPKAN** sebagai pola inti `hak.js`: satu fungsi per tabel yang mengembalikan `[klausa, bind]`; JANGAN menulis `WHERE` hak secara manual di tiap rute. Peran METI (Super/Admin/anggota) lebih sederhana daripada 10 peran BNPB. Wajib uji "peran X tidak melihat baris milik Y" per tabel (lihat §4).

### 2.9 Audit log append-only
- Praktik: tabel audit tidak bisa diubah/dihapus dari SQL sekalipun kode bocor.
- Bukti: `migrations/0003_moderasi.sql:16-17 (audit_tetap_ubah, audit_tetap_hapus)`, `migrations/0099_command_center.sql:64-68 (cc_jejak_tetap_ubah/tambah; _tambah menolak INSERT OR REPLACE)`, `src/staf.js:~80 (jejakStmt -> pantau_jejak)`, retensi 2 tahun (`WARGA.md:324`).
- Verdict METI: **TERAPKAN**. Satu tabel `jejak` append-only (siapa, apa, ke siapa, kapan, catatan), dengan trigger yang menolak UPDATE/DELETE; tulis dalam `DB.batch` bersama aksi yang diaudit agar atomik.

### 2.10 Privasi data pribadi
- Praktik: IP tak disimpan mentah; kontak warga disembunyikan dari daftar dan dibuka lewat aksi berbatas; GeoJSON publik "tanpa kontak, tanpa hash"; log prompt pemilik disamarkan (`samarkan()`) karena repo publik.
- Bukti: `WARGA.md:131-133`, `src/worker.js:~228` (komentar "baris -> GeoJSON tanpa kontak, tanpa hash"), `AGENTS.md:66-68`.
- Verdict METI: **TERAPKAN**: pisahkan field publik/anggota/admin di lapisan serializer (fungsi `publik(row)`, `anggota(row)`), bukan `SELECT *`. Cocok dengan `KEAMANAN-PRIVASI.md` METI (UU PDP).

### 2.11 Rahasia dan lingkungan
- Praktik: rahasia lewat `wrangler secret put` (`IP_SALT`, `ADMIN_TOKEN`, `SESI_KUNCI`, `FIRMS_MAP_KEY`, `TURNSTILE_SECRET`, `EMAIL_API_KEY`, `OPENALEX_KEY`, `SUPER_ADMIN`), nilai non-rahasia di `vars`, `.dev.vars` dan `.env` di-ignore, aturan "Secret tidak pernah masuk berkas yang dilacak git" (`AGENTS.md:208`), CI memakai `secrets.CLOUDFLARE_API_TOKEN`.
- Bukti: `WARGA.md:83-96, 181-185, 222-224`, `AGENTS.md:208`, `.gitignore`, `wrangler.jsonc:20` (`vars`).
- Cacat: `wrangler.jsonc:20` memuat alamat email pribadi pada `vars` (jangan ditiru; email = data pribadi) dan `database_id` produksi terlacak git (bukan rahasia kriptografis, tetapi memudahkan pemetaan). Tidak ada uji yang memindai rahasia.
- Verdict METI: **SESUAIKAN**. Ambil pemisahan secret/vars; tambahkan gerbang pemindai rahasia (regex token umum) di CI; email/nomor kontak operasional jadi secret atau tabel D1.

### 2.12 Cache tepi publik
- Praktik: `cacheTepi(req, ctx, detik, buat, tanpaQuery)` menyimpan jawaban 200 di Cache API dengan kunci query terurut; `x-jangan-simpan` mencegah menyimpan; `private, no-store` untuk data bergerbang.
- Bukti: `src/worker.js:768-780`, `:830, :835`; `src/akademisi.js:~19-21` (`private, no-store`); `public/_headers` aturan `/data/*` `max-age=300, stale-while-revalidate=3600`.
- Verdict METI: **TERAPKAN** untuk direktori publik (agregat) dan endpoint titik peta; WAJIB `private, no-store` untuk data anggota.

---

## 3. Data dan pipeline

### 3.1 Penjaga data basi sebelum deploy
- Praktik: `jaga_segar.py` membaca `meta.json.dibuat` dan `hotspot.json.acuan`; menolak deploy bila lebih tua dari `BATAS_JAM = 36` atau lebih tua dari yang tayang; situs tak terjangkau = peringatan, bukan blokir; darurat `PAKSA_TERBIT=1`; punya mode `uji` (self-check).
- Bukti: `scripts/terbit/jaga_segar.py:1-18, 21`.
- Insiden: 23 Okt 2026 `udara.yml` tidak menemukan cache `data-` (repo melewati batas 10 GB cache GitHub), deploy memakai salinan git bertanggal 12 Okt; situs mundur 11 hari tanpa galat.
- Verdict METI: **SESUAIKAN**. METI tidak punya data satelit, tetapi punya impor/kurasi sensus: terapkan "jangan terbit bila hasil impor lebih sedikit/lebih tua dari yang tayang" (penjaga susut), mis. jumlah entitas turun >10% = tahan dan minta konfirmasi.

### 3.2 Situs live sebagai cadangan data
- Praktik: `isi_data.py buat` menulis `_isi.json` (daftar berkas + ukuran + sha1) yang ikut tayang; `tarik` mengunduh dari situs live berkas yang berbeda dan memverifikasi sha1; `perlu` hanya menarik bila salinan lokal lebih tua dari live; cache lebih baru tidak pernah ditimpa.
- Bukti: `scripts/terbit/isi_data.py:1-24`, `:27-40 (sha, nyasar)`.
- Verdict METI: **TIDAK PERLU** untuk data D1 (sumber kebenaran ada di D1, bukan artefak CI). **TERAPKAN** idenya hanya untuk ekspor statis (GeoJSON titik peta publik) bila dibangun di CI: manifes sha1 + verifikasi.

### 3.3 Panen terjadwal yang tahan gagal
- Praktik: tiap langkah panen `continue-on-error: true` dengan `::warning`/`::error` beranotasi; "berkas lama dibiarkan" bila gagal; swauji (`... uji`) sebelum menghasilkan; pemulihan R2 sebelum unggah; cron Actions dipin ke menit tetap (GitHub menunda cron ±35 menit median); `concurrency: group: data`.
- Bukti: `.github/workflows/data.yml:20-21, 111, 141-145, 189-195, 207-230, 271, 292`; `.github/workflows/titik.yml:3-14, 18-24`.
- Verdict METI: **SESUAIKAN**. Jika METI menambah pemanenan profil perusahaan (pencarian direktori publik, situs perusahaan), pakai pola: langkah gagal tidak menimpa data lama, tiap sumber punya swauji, anotasi `::warning` agar terbaca di UI Actions.

### 3.4 Provenans sumber
- Praktik: tiap lapisan peta mendokumentasikan sumber, lisensi sesuai teks penerbit, status ("SUDAH ADA / SEBAGIAN / BELUM"), cara akses ("UBIN / OLAH"), dan tanggal verifikasi; data berpemilik "tidak diambil, tidak di-scrape"; lisensi yang belum jelas ditulis "BELUM TERVERIFIKASI"; atribusi ada di sumber MapLibre (`attribution:` per sumber). Kolom `sumber` ('worker' | 'pipeline') dicadangkan di tabel titik.
- Bukti: `docs/sumber-lapisan.md:1-12 (aturan + legenda), 14-30 (tabel), 47-49 (uji ubin)`, `public/inti/peta/nasa.js:~14-19 (ATRIB, attribution per sumber)`, `WARGA.md:159`.
- Verdict METI: **TERAPKAN** sebagai `sumber-data.md` untuk METI dan sebagai kolom `sumber`, `sumber_url`, `diverifikasi_oleh/pada` di tiap entitas (provenans per baris). Penting untuk direktori yang bisa digugat ("dari mana data PLTS ini?").

### 3.5 Idempotensi dan unik
- Praktik: skrip pipeline bisa dijalankan ulang (hasil sama), tugas Worker "dibuat sekali per versi" (`tugas api`), `pengingat` idempoten, ringkasan harian dihitung cron bukan per permintaan, `INSERT OR REPLACE` dilarang pada tabel jejak (trigger).
- Bukti: `src/worker.js:~918-925 (komentar idempoten)`, `WARGA.md:164`, `migrations/0099_command_center.sql:68`.
- Verdict METI: **TERAPKAN** untuk impor sensus: kunci alami (mis. `npwp/nib` hash atau `slug`+`wilayah`), upsert terkontrol, dan baris "kembar" ditandai bukan ditimpa.

### 3.6 Cadangan dan pemulihan
- Praktik yang ada: arsip cadangan versi lama di R2 (`akademisi/cadangan/<tgl>/...`) setiap panen bulanan; pemulihan R2 sebelum penggabungan (`risiko_produksi.py pulih`, "hanya menambah"); `tracker pemulihan` adalah fitur produk, bukan cadangan sistem.
- Bukti: `.github/workflows/direktori-bulanan.yml:1-6, 83, 100-114`, `.github/workflows/data.yml:168, 189`.
- **Kekosongan**: tidak ada cadangan D1 terjadwal, tidak ada penyebutan `d1 export`/Time Travel, tidak ada runbook pemulihan (pencarian di seluruh `docs/`, `WARGA.md`, workflow: nihil). Seluruh data warga/staf/jejak hanya ada di D1.
- Verdict METI: **TERAPKAN** pola "cadangan bertanggal di R2" dan **WAJIB menambah** yang tidak ada di repo ini: cron mingguan `wrangler d1 export` -> R2 `cadangan/<tgl>.sql` (retensi 8 minggu), uji pemulihan bulanan ke D1 kosong, dan runbook yang menyebut D1 Time Travel. **[umum, verifikasi]**: Time Travel menyimpan 30 hari di paket berbayar.

---

## 4. Gerbang mutu dan pengujian

### 4.1 Prinsip: aturan pemilik jadi gerbang mesin, bukan memory
- Praktik: "Tiap kali pemilik bilang 'catat' atau mengulang koreksi, tanya dulu apakah mesin bisa memeriksanya. Kalau bisa, jadikan gerbang uji atau hook di giliran yang sama dan betulkan pelanggaran yang ada di commit yang sama." Memori hanya untuk fakta/selera.
- Bukti: `AGENTS.md:178-187`, `AGENTS.md:202-208 (batas mati: gerbang haram dilemahkan)`.
- Verdict METI: **TERAPKAN** persis (selaras dengan `~/.claude/CLAUDE.md` pemilik).

### 4.2 Registri cakupan uji
- Praktik: `tests/warga/cakupan.json` mencatat tiap rute/tabel/trigger/cron: "diuji" (nilai = potongan nama uji yang BENAR-BENAR ada, diperiksa), "dikecualikan" (nilai = alasan), "antre" (utang eksplisit, hanya boleh menyusut; `BATAS_ANTRE = 2`). Gerbang mengekstrak rute dari `src/worker.js` dengan regex, tabel dari migrasi, lalu menolak yang tak tercatat.
- Bukti: `tests/warga/cakupan.json:2 (_catatan)`, `tests/warga/gerbang.test.mjs:1-2, 15 (muat), 16 (BATAS_ANTRE), 18-41 (temukan rute/cron)`.
- Verdict METI: **TERAPKAN**. Dengan ~40 rute METI, registri yang kecil tetapi wajib; mencegah rute baru lahir tanpa uji.

### 4.3 Uji integrasi D1 nyata (tanpa mock)
- Praktik: Miniflare menjalankan `src/worker.js` di workerd dengan D1 dan R2 lokal sungguhan, memuat SEMUA migrasi apa adanya (`migrasi()`/`pecah()`), `serviceBindings.ASSETS` memalsukan aset statis dari `public/`, secret uji lewat `bindings`, IP unik per permintaan (`ipBaru()`) agar batas laju tak saling mengganggu, `--test-concurrency=1`, `cache: false`.
- Bukti: `tests/warga/audit-keamanan-worker.test.mjs:1-4, 21-31, 33 (ipBaru), 34-37 (kirim)`, `tests/warga/_bantu.mjs:1-20`, `package.json:5 (uji:warga)`, `WARGA.md:63-70`.
- Mencakup (contoh): body berbatas, CSRF berbasis cookie, batas gagal masuk, filter query, cron tahan gagal satu langkah, `BEGIN ... ROLLBACK` untuk menguji semua pasangan katalog.
- Verdict METI: **TERAPKAN** sebagai gerbang nomor satu. Uji wajib METI: hak per baris (anggota A tidak membaca baris anggota B; Admin wilayah X tak menulis wilayah Y; Super saja yang membuat Admin), trigger audit, impor sensus, batas laju, CSRF.

### 4.4 Gerbang anti-salinan
- Praktik: tidak boleh ada CSS/JS identik di dua berkas layar; pemindai mengambil aturan CSS >= 90 karakter dan fungsi JS >= 200 karakter yang identik; pengecualian dilarang; perbaikan = pindahkan ke `public/inti/`.
- Bukti: `tests/agen/gerbang-inti.test.mjs:1-14, 24-26 (CSS_MIN, JS_MIN)`.
- Verdict METI: **TERAPKAN** dari awal (`public/inti/`: `format.js`, `kartu.js`, `maplibre.js`, `lapis.js`). Mencegah drift antarhalaman.

### 4.5 Gerbang lain yang layak ditiru
- `gerbang-model-agent` (tiap agent punya `model:`; `AGENTS.md:44-47`), `gerbang-ilmu-agent` (katalog segar, tiap berkas kode punya tepat satu pemilik; `AGENTS.md:87-90`), `gerbang-tab-registry`, `gerbang-paket-modul`, `gerbang-jalur-mutlak` (19 KB; jalur absolut aset), `gerbang-antrean-data` (cron `titik.yml` sinkron dengan kondisi langkah; `titik.yml:11-14`), `gerbang-terbit`, `gerbang-tabel-rata`. 51 berkas di `tests/agen/`.
- Verdict METI: **SESUAIKAN**. Hanya yang relevan: model-agent, ilmu-agent (bila armada dipakai), jalur-mutlak, tab-registry/rute-registry, wrangler, headers, anggaran-cf.

### 4.6 CI
- Praktik: uji node dijalankan di checkout bersih sebelum cache data dipulihkan; `npm ci` + `actions/setup-node@v4` node 22 + `cache: npm`; `miniflare` dikunci di `package.json` (`3.20250718.3`); wrangler dikunci (`@4.42.0`) di perintah npx.
- Bukti: `.github/workflows/terbit.yml:20-35`, `package.json:22-25`.
- Cacat: uji TIDAK jalan pada pull request / push (workflow hanya `workflow_dispatch`); tidak ada status check wajib untuk PR. Gerbang bergantung pada disiplin sesi induk (`AGENTS.md:206`).
- Verdict METI: **SESUAIKAN**. Tambahkan workflow `uji.yml` pada `pull_request` + `push` ke `main` yang menjalankan `npm test`; deploy hanya setelah hijau. Kunci versi wrangler satu tempat.

### 4.7 Dummy data
- Praktik: aturan pemilik "tiap website wajib punya tombol isi data dummy sejak awal" (`~/.claude/DUMMY.md`); implementasi: kolom `dummy` di tabel (`staf.dummy`, `pantau_jejak.dummy`), data dummy konsisten dari satu kumpulan mentah (`src/sla_dummy.js:1-2`), penanda untuk hapus (kabupaten contoh + `dummy = 1`), baris dummy disaring dari rute yang dibuka untuk staf (`stafNyata`, `staf.js:~104`), `SQL_DUMMY(a)` ikut di `lingkupSql` (`instansi.js:230`), hanya `SUPER_ADMIN` boleh memakai tombol (`WARGA.md:224`).
- Verdict METI: **TERAPKAN** (aturan pemilik). Satu fungsi `isiDummy(halaman)` per halaman, kolom `dummy` di setiap tabel entitas, filter `dummy` otomatis di serializer publik, dan hapus dummy satu klik.

### 4.8 INP / performa interaksi
- Praktik: agent `inp-reviewer` (model sonnet) memeriksa handler klik/tab/geser; area klik titik kecil dilebarkan ±6 px; `requestAnimationFrame` + `nanti()` menunda render pin; `setStyle(..., {diff:false})` dikomentari mengapa.
- Bukti: `.claude/agents/inp-reviewer.md:1-8`, `AGENTS.md:26, 196-199`, `public/index.html:2227 (bidik ±6 px)`, `public/akademisi.js:1705 (jadwalPin)`.
- Cacat: gerbang INP otomatis (seperti `gerbang-inp-transisi` yang disebut di `~/.claude/INP.md`) TIDAK ada di repo ini; hanya agent peninjau.
- Verdict METI: **SESUAIKAN**. Tulis aturan "chrome kontrol urgent, subtree berat deferred" di `DESIGN-SYSTEM.md` METI dan uji profil sederhana untuk klik tab wilayah dan buka kartu.

---

## 5. Operasional dan pemantauan

### 5.1 Observabilitas dan log
- Praktik: `observability.enabled: true`; log terstruktur per tugas cron `console.log("tugas", JSON.stringify(hasil))` dan `console.error("tugas", e?.message)` (pesan saja, bukan objek penuh); hanya dilog bila ada pekerjaan (`if (h.coba) ...`) agar tidak membanjiri.
- Bukti: `wrangler.jsonc:21`, `src/worker.js:911-935`, `:~662` (`console.error("rute", url.pathname, e)` lalu balas `galat server` generik).
- Verdict METI: **TERAPKAN**. Galat internal ke log, klien hanya `{galat: "galat server"}`.

### 5.2 Penanganan galat seragam
- Praktik: `json()`/`gagal(status, pesan, headers)` satu bentuk `{galat: ...}` dengan `no-store` + `nosniff`; router `try/catch` -> 500 generik; 405 dengan `allow`; 429 dengan `retry-after`; 413 untuk badan besar; 503 jelas bila konfigurasi/migrasi belum siap.
- Bukti: `src/worker.js:93-96 (json, gagal)`, `:163-168 (429)`, `:648-651 (405)`, `:659-663 (try/catch)`, `tests/warga/admin-403-pantul.test.mjs`.
- Verdict METI: **TERAPKAN**. Tambahkan `id` korelasi (UUID) di galat 500 dan di log agar bisa dicari.

### 5.3 Status, pemantauan, dan peringatan
- Praktik: halaman status staf `/monitor` (peringatan sudah dibaca, groundcheck, tindak lanjut), `SLA`, `/api/status` yang di-cache tepi, anotasi `::error/::warning` di Actions, penjaga susut/basi, alarm Himawari ke kanal Posko; pemantauan "tabel yang belum dimigrasi" lewat 503 yang terlihat.
- Bukti: `src/monitor.js:1-18`, `src/sla.js`, `src/worker.js:835 (cacheTepi /api/status tanpaQuery)`, `src/worker.js:~925 (alarmHimawari)`.
- Cacat: peringatan operasional berhenti di log/Actions; tidak ada pemberitahuan terjadwal ke pemilik saat workflow gagal (tidak ditemukan notifikasi kegagalan workflow).
- Verdict METI: **SESUAIKAN**. Satu endpoint `/api/status` (versi, jumlah entitas, usia impor terakhir, kesehatan D1/R2) + email/WA ke pemilik bila cron gagal atau cadangan terlambat.

### 5.4 Biaya dan kuota
- Praktik: perhitungan kuota Free tertulis (≈ 40-50 rb kunjungan/hari menghabiskan 100 rb permintaan; galat 1027 saat habis); tulis D1 disampel; cache tepi 5 menit-1 hari; `PLAFON_BERKAS = 15000`, `PLAFON_UKURAN = 25 MB` untuk aset; tidak ada panen per menit.
- Bukti: `WARGA.md:107, 193-194`, `tests/agen/gerbang-anggaran-cf.test.mjs:1-8, 73-75`, `public/_headers` (aturan cache).
- Verdict METI: **TERAPKAN**. Tulis anggaran METI (permintaan/hari, baca/tulis D1, ukuran R2) di `OPERASIONAL.md` dan uji plafon aset. Pertimbangkan Paid (US$5/bulan) sejak awal untuk sensus produktif **[umum, verifikasi]**.

### 5.5 Runbook dan daftar utang
- Praktik: `docs/OUTSTANDING.md` (daftar terbuka dengan kolom "Status / menunggu" dan rujukan), `docs/cara-kerja.md` (alur data, sumber, rumus dalam bahasa awam), `WARGA.md` (pasang, secret, migrasi, uji), `docs/buku-pegangan/AUDIT-ATURAN-HARNESS.md`.
- Bukti: `docs/OUTSTANDING.md:1-75`, `docs/cara-kerja.md:1-60`, `WARGA.md:83-96`.
- Cacat: `OUTSTANDING.md` mencampur utang teknis, urusan pemilik, dan kerja sesi yang putus (bagian D); beberapa baris basi.
- Verdict METI: **SESUAIKAN**. Satu `RUNBOOK.md` (pasang, rotasi secret, pulihkan D1, rollback deploy, cabut anggota) terpisah dari `UTANG.md` yang hanya memuat utang teknis dengan pemilik dan tenggat.

### 5.6 Rollback
- Praktik: tidak ada runbook rollback eksplisit; yang ada: `wrangler versions upload` (pratinjau) dan sifat Workers (versi lama tersimpan). Untuk data: penjaga basi.
- Verdict METI: **SESUAIKAN**. Tulis rollback: `wrangler rollback` untuk kode, migrasi "maju saja" (kompatibel mundur satu versi) untuk skema, Time Travel/ekspor untuk data. **[umum, verifikasi]**.

---

## 6. Design system dan UI

### 6.1 Token dan tema
- Praktik: token warna `oklch(...)` di `:root` (`--paper`, `--card`, `--surface`, `--ink`), tema gelap lewat `document.documentElement.dataset.theme` ATAU `prefers-color-scheme`, fungsi `gelap()` jadi satu-satunya sumber; pengganti `lapor-gelap.css`.
- Bukti: `public/index.html:~38-45 (:root)`, `:1829 (gelap())`, `public/inti/lapor-gelap.css`, `public/inti/gaya.css`, `public/inti/kepala.css`.
- Verdict METI: **TERAPKAN** (oklch + dataset.theme + prefers-color-scheme + `gelap()` tunggal; sesuai `DESIGN-SYSTEM.md` METI).

### 6.2 i18n dwibahasa tanpa menulis ulang modul
- Praktik: UI ditulis dalam ID, mode EN menerjemahkan simpul teks dan atribut (`title`, `aria-label`, `placeholder`, `alt`, `data-tip`) lewat `MutationObserver` memakai kamus `{kamus, pola}`; angka diganti `{0},{1}` sebelum pencarian; format angka/tanggal `id-ID` -> `en-GB`; `<html lang>` diset; `?lang=en` ikut di `pushState`; konten pengguna/pihak ketiga dilewati (`[data-no-i18n]`, `[translate=no]`); dimuat sinkron paling awal; bahasa hanya bertahan di tab (sessionStorage).
- Bukti: `public/i18n.js:1-13 (desain), :16-19 (parameter, lang), :84 (simpul teks+atribut), :143-157 (URL)`, `public/i18n/en.json` (965 KB).
- Cacat: kamus 965 KB dimuat penuh di mode EN; kunci = teks Indonesia (rapuh terhadap perubahan redaksi); terjemahan tidak diuji secara otomatis (tidak ditemukan gerbang kamus).
- Verdict METI: **TIDAK PERLU** pendekatan ini; **SESUAIKAN**: METI dwibahasa sejak awal sebaiknya memakai kunci i18n (`pelaku.kapasitas`) dengan dua berkas `id.json`/`en.json` per halaman (lazy), plus gerbang "kunci ID dan EN sama". Ambil dari repo ini: format angka/tanggal mengikuti locale, `lang` atribut, pengecualian konten pengguna, `?lang=` di URL.

### 6.3 Aksesibilitas yang tampak
- Praktik: `role="application"` + `aria-label` pada peta, `aria-pressed` pada tombol lapisan, `role="option"`/`aria-selected`/`aria-activedescendant`/`aria-expanded` pada kotak cari, `aria-sort` pada tabel yang bisa diurut, tombol tutup bertipe `button` ber-`aria-label`, `prefers-reduced-motion` mematikan animasi, `<dialog>` dengan `aria-label`.
- Bukti: `public/akademisi.js:1900-1902 (role=application, aria-label), :1881-1895 (combobox), :1953 (aria-sort)`, `public/akademisi.css:328, 2340 (reduced-motion)`, `public/index.html:1525, 1633 (aria-label)`.
- Verdict METI: **TERAPKAN**; tambahkan uji aksesibilitas (axe) pada halaman direktori dan tabel wilayah.

### 6.4 Performa muat
- Praktik: skrip modul dimuat `defer`/malas; `inti/nanti.js` menjadwalkan kerja; `loading="lazy"` pada logo; `ResizeObserver` untuk `map.resize()`; cache busting `?v=hash`; Cloudflare static assets menangani kompresi.
- Bukti: `public/akademisi.js:83, 1963`, `public/inti/nanti.js`, `public/_headers`.
- Cacat: `index.html` 898.433 byte, `akademisi.js` 658.547 byte, `en.json` 965 KB (diukur `wc -c`/`ls`); tidak ada pemecahan bundel.
- Verdict METI: **SESUAIKAN**: JS murni tanpa build tetap bisa modular lewat ES modules + `import()` per halaman; anggaran ukuran per halaman diuji (gerbang plafon, mis. 150 KB gzip JS awal).

### 6.5 Escape dan keamanan DOM
- Praktik: `esc()` untuk semua teks luar sebelum `innerHTML`; `urlOk()` hanya mengizinkan `http(s)` atau jalur internal untuk URL luar; `referrerpolicy="no-referrer"` pada gambar luar; popup MapLibre memakai `setHTML` dengan hasil `esc()`, atau `setDOMContent` untuk konten sendiri.
- Bukti: `public/akademisi.js:7, 742, 83`, `public/index.html:2235-2240`, `public/inti/format.js:6`.
- Risiko: `setHTML` dengan template string besar (rawan lupa `esc`). Verdict METI: **TERAPKAN** `esc/urlOk`; popup via `setDOMContent` + `textContent`; gerbang: larang `innerHTML` pada variabel tak ber-`esc`.

---

## 7. Tata kelola agent / armada

### 7.1 `AGENTS.md` sebagai router
- Praktik: gerbang konteks (peta modul -> `ilmu.mjs pemilik <berkas>` -> `ilmu.mjs baca <agent>`) sebelum tool apa pun; kontrak kerja diucapkan (CAKUPAN / DI LUAR / BUKTI SIAP); router "kerja -> agent"; peta modul dengan berkas, keluaran, jadwal, pengerja; urutan otoritas dokumen per modul (keputusan pemilik > PRD > DESIGN-SYSTEM > DESAIN-TEKNIS > RENCANA-UJI > TIKET); aturan berhenti ("bila dokumen bertentangan, berhenti dan tanya pemilik"); `CLAUDE.md` hanya menunjuk `@AGENTS.md`.
- Bukti: `AGENTS.md:8-31, 92-107, 109-155`, `CLAUDE.md:1-6`.
- Verdict METI: **TERAPKAN** (sesuai standar pemilik `AGEN.md`). Susun `AGENTS.md` METI dengan modul: Direktori/peta, Sensus/impor, Auth & hak, Admin, i18n, Gerbang.

### 7.2 Kebijakan model
- Praktik: Opus merencanakan, Sonnet mengerjakan, Haiku mencocokkan pola; tiap `.claude/agents/*.md` wajib `model:`; generator menolak entri roster tanpa model; agent bawaan (`general-purpose`, `Explore`, `Plan`) diturunkan ke Sonnet oleh `env.CLAUDE_CODE_SUBAGENT_MODEL` di `.claude/settings.json`; gerbang `gerbang-model-agent.test.mjs`; naik tingkat butuh alasan.
- Bukti: `AGENTS.md:33-51`, `.claude/settings.json` (env `CLAUDE_CODE_SUBAGENT_MODEL: sonnet`), `.claude/agents/guard-api.md:4 (model: haiku)`, `.claude/agents/inp-reviewer.md:4 (model: sonnet)`, `tests/agen/gerbang-model-agent.test.mjs`.
- Verdict METI: **TERAPKAN** tanpa perubahan.

### 7.3 Roster sebagai sumber, definisi di-generate
- Praktik: `scripts/agents/roster.json` -> `npm run agents:build` menghasilkan `.claude/agents/*.md` dan `KATALOG.md`; `agents:check` (`--cek`) menolak kedaluwarsa; berkas agent berkepala "DI-GENERATE ... Sunting manifest-nya".
- Bukti: `package.json:14-15`, `AGENTS.md:53-90`, `.claude/agents/inp-reviewer.md:12-14`.
- Verdict METI: **TERAPKAN**.

### 7.4 Ilmu dan jejak per agent
- Praktik: `.claude/ilmu-agent/<nama>.md` (peta berkas, aturan, ranjau, gerbang, kasus) + `jejak/<nama>.jsonl` (berkas apa sudah diperiksa, dikunci ke blob git + hash definisi agent) agar tidak mengulang review tanpa perubahan (`ilmu.mjs cek` -> `LEWATI|ULANG|BARU`); plafon ilmu 40 KB; prompt pemilik dicatat tersamar lewat hook `UserPromptSubmit`.
- Bukti: `AGENTS.md:53-90`, `.claude/settings.json` (hook `prompt-catat`, `pengingat-paket.mjs`), `.claude/ilmu-agent/warga-api.md:1-12`.
- Catatan privasi: repo publik; satu-satunya penjaga adalah `samarkan()` (`AGENTS.md:66-68`).
- Verdict METI: **SESUAIKAN**. Ambil ilmu+jejak, tetapi METI memuat data anggota: log prompt jangan di-commit ke repo publik; simpan lokal atau repo privat.

### 7.5 Pemisahan pekerja dan pengulas; isolasi
- Praktik: verifier = subagent baru tanpa riwayat pekerjanya, memeriksa sinyal nyata (uji hijau), bukan klaim; fan-out yang menulis memakai `isolation: "worktree"`; commit dengan path spesifik, jangan `git add -A`; agent baru tidak boleh push/deploy/melonggarkan gerbang; subagent tidak commit; branch sementara dihapus segera (`sapu-branch.sh`).
- Bukti: `AGENTS.md:157-176, 200-208`.
- Verdict METI: **TERAPKAN**.

### 7.6 Hook dan skill proyek
- Praktik: hanya dua hook di `settings.json`, keduanya `UserPromptSubmit` (catat prompt, pengingat paket); tidak ada hook pre-commit yang menjalankan gerbang; skill `graphify` global.
- Bukti: `.claude/settings.json` (seluruh berkas, ±22 baris).
- Verdict METI: **SESUAIKAN**. Tambahkan hook `SessionStart` armada (`armada-agent-proyek.mjs`, `AGEN.md`) dan pre-commit/CI untuk gerbang agar tidak bergantung pada disiplin.

---

## 8. Kesalahan dan hutang di repo itu yang JANGAN ditiru

1. **Kata sandi = SHA-256 + garam** dan `===` (`src/staf.js:77-79`, `src/instansi.js:100`, `src/worker.js:97`). Dibenarkan hanya karena sandi acak; jangan untuk sandi pilihan pengguna. Pakai PBKDF2/Argon-sejenis atau tanpa sandi (lihat 2.4).
2. **CSP dengan `'unsafe-inline'`** pada `script-src` dan `style-src` (`public/_headers`), akibat skrip/gaya inline di `index.html`. METI: tanpa inline sejak awal.
3. **Monolit**: `public/index.html` 898 KB satu berkas dengan inti peta dalam satu `<script>` inline (`.claude/ilmu-agent/layar-peta.md:11`), `akademisi.js` 658 KB, kamus `en.json` 965 KB. Sulit diuji, lambat dimuat, rawan galat.
4. **Tidak ada cadangan/pemulihan D1** yang terdokumentasi (3.6). Seluruh data pengguna hanya di D1.
5. **Staging berbagi D1/R2 produksi** (`terbit.yml`, komentar langkah terbit). Laporan uji masuk produksi.
6. **Tiga versi wrangler berbeda**: komentar/gerbang menyebut `wrangler@3` (`tests/agen/gerbang-wrangler.test.mjs:3`, `WARGA.md:83-96`), CI memakai `wrangler@4.42.0` (`terbit.yml`), `package.json:24` meminta `^4.151.0`. Komentar `wrangler.jsonc:9` sendiri mencatat wrangler@3 menolak konfigurasi.
7. **Berkas konfigurasi ganda yang basi**: `wrangler.warga.jsonc` ("usulan pengganti", `database_id` placeholder, tanpa `run_worker_first`) masih dipakai `npm run dev:warga` (`package.json:13`) dan jadi sumber kebingungan yang melahirkan insiden 1.1.
8. **Migrasi manual ke produksi** dan daftar "cek sudah jalan" di `docs/OUTSTANDING.md` C3; penomoran ganda (dua `0023_*`, dua `0024_*`, `0053_kontak 2.sql` salinan nyasar, `cakupan.json.rej` tertinggal, aturan `AGENTS.md:207` "berkas `* 2.*` salinan nyasar").
9. **CI tidak jalan pada PR/push**; gerbang mengandalkan pemicu manual (`terbit.yml:12-13`).
10. **Cache GitHub sebagai tempat data produksi** (`actions/cache`, batas 10 GB) lalu ditambal `isi_data.py`/`jaga_segar.py`. Akar masalahnya arsitektur; untuk METI simpan di R2/D1.
11. **Data dan ID di konfigurasi terlacak**: email pribadi di `vars` (`wrangler.jsonc:20`), `database_id` produksi di git; secret scanning tidak ada.
12. **Fail-open Turnstile** bila salah satu kunci kosong (`worker.js:213`); acceptable untuk dev, berbahaya jika lupa di produksi.
13. **Hotlink logo pihak ketiga** (`chainLogo` mencoba `logo`, `https://<host>/apple-touch-icon.png`, `https://<host>/favicon.ico`; `public/akademisi.js:1152`): tergantung server orang, melacak pengguna ke host lain, rusak sewaktu-waktu.
14. **MapLibre dimuat dari cdnjs tanpa SRI** (`public/index.html:35-36`, `public/akademisi.js:1623-1624`) padahal salinan vendor ada di `public/vendor/maplibre` (`inti/maplibre.js` memakainya). Dua jalur muat, satu tanpa integritas.
15. **Peta direktori tidak berganti tema** setelah dibuat: gaya dipilih sekali saat konstruksi (`public/akademisi.js:~1913`), tanpa `setStyle` saat tema berubah (hanya `index.html` memanggil `gantiDasar`, `:1998`).
16. **Komentar basi dan utang tercampur**: contoh `docs/OUTSTANDING.md` A9 "komentar basi" dan bagian D "sesi putus".
17. **Log prompt pemilik di repo publik** dengan penyamaran satu lapis (`AGENTS.md:66-68`).
18. **Gerbang INP dan dummy yang dijanjikan standar pemilik tidak ada di repo ini** (hanya agent peninjau dan kolom `dummy`); aturan tanpa gerbang mekanis dianggap belum jadi.

---

## 9. Peta (permintaan pemilik: peta METI memakai model peta poskokarhutla)

Rujukan visual pemilik: peta 1001startup.id: logo perusahaan di atas peta OSM/Protomaps, tab kota dengan hitungan, "N of M companies placed". Catatan: deskripsi 1001startup berasal dari brief, tidak saya verifikasi dari situsnya.

### 9.1 Pustaka dan versi
- MapLibre GL JS **4.7.1**, tiga jalur muat berbeda:
  1. `index.html` sinkron dari CDN di `<head>`: `public/index.html:35-36` (`cdnjs.cloudflare.com/ajax/libs/maplibre-gl/4.7.1/...`), tanpa SRI (`grep -c integrity` = 0).
  2. `akademisi.js` memuat malas dari CDN yang sama: `public/akademisi.js:1622-1624` (`LIB.maplibre`, `MAP_CSS`), `:1962` (`muatMapLib` dengan janji bersama + dibuang saat gagal agar bisa dicoba ulang).
  3. Salinan vendor lokal `public/vendor/maplibre/maplibre-gl.js` (772,8 KB) + `maplibre-gl.css` (64 KB), dipakai modul `public/inti/maplibre.js:1-10` (`muatMapLibre()`, sekali muat, galat dibuang agar ulang).
- Tidak ada Leaflet/OpenLayers/PMTiles/Protomaps di kode (pencarian di `public`, `src`, `scripts`, `docs`, `tests`): PMTiles hanya disebut di `docs/sumber-lapisan.md` sebagai opsi "OLAH" untuk data besar.
- Verdict METI: **SESUAIKAN**. Pakai MapLibre GL JS dari **vendor lokal** (`/vendor/maplibre/`, satu versi dikunci, uji `gerbang-vendor` yang memeriksa versi dan hash), dimuat malas lewat `muatMapLibre()`. Hapus jalur CDN agar CSP `script-src 'self'` dan tanpa SRI.

### 9.2 Peta dasar (basemap), tile, lisensi
- Gaya vektor **OpenFreeMap** (hosted, tanpa kunci): `https://tiles.openfreemap.org/styles/dark` atau `.../positron` menurut tema. Bukti: `public/index.html:1985`, `public/akademisi.js:~1913` (`"https://tiles.openfreemap.org/styles/" + (gelap ? "dark" : "positron")`). Host terdaftar di `connect-src` CSP (`public/_headers`).
- Lapisan tambahan (raster): Esri World Imagery (`server.arcgisonline.com`, atribusi "Citra © Esri, Maxar, Earthstar"; `index.html:~2006-2008`), NASA GIBS (`gibs.earthdata.nasa.gov`, `public/inti/peta/nasa.js:~7-19`), OSM tile (`tile.openstreetmap.org`), EOX, Global Forest Watch, Kemenhut geoportal ArcGIS export (`docs/sumber-lapisan.md:47-49`), RainViewer, EFFIS. Semua host didaftar putih di `connect-src`.
- Lisensi: `docs/sumber-lapisan.md` mencatat lisensi tiap lapisan dari teks penerbit (OSM = ODbL 1.0, GFW/Descals = CC BY 4.0, Kemenhut = "BELUM TERVERIFIKASI"); uji ubin dengan `curl` (200 + CORS) tercatat. Untuk OpenFreeMap sendiri repo tidak mencatat lisensi: **[umum, verifikasi]** gaya dan ubinnya bebas dipakai, data OSM (ODbL) + OpenMapTiles wajib diatribusi; syarat layanan hosting publik perlu dibaca sebelum produksi.
- Tidak ada ubin yang di-host sendiri.
- Verdict METI: **SESUAIKAN**. Untuk METI (kemandirian, CSP ketat, tanpa tergantung layanan gratis pihak ketiga) rekomendasi: **Protomaps PMTiles** basemap OSM Indonesia di R2 (satu berkas, dilayani lewat Worker/R2 dengan dukungan HTTP Range) + protokol `pmtiles` di MapLibre + gaya dari `@protomaps/basemaps` (varian light/dark). Ini selaras dengan rujukan 1001startup (OSM/Protomaps). **[umum, verifikasi]** ukuran ekstrak Indonesia, versi pustaka `pmtiles`, dan syarat atribusi Protomaps (© OpenStreetMap contributors + Protomaps) dicek saat implementasi. Cadangan: tetap bisa memakai OpenFreeMap sebagai gaya jatuh-balik selama pengembangan karena repo ini sudah membuktikannya berjalan.

### 9.3 Cara data titik dimuat
- Direktori (`akademisi`): data lembaga dari endpoint bergerbang sesi `/api/akademisi/data/<nama>` (`public/akademisi.js:741`, `ambilData` dengan cache janji per nama, tanpa data = hapus cache), sisi Worker mengalirkan berkas JSON dari R2 `akademisi/induk.json` dengan `cache-control: private, no-store` (`src/akademisi.js:9-19`). Format: larik objek (`lat`, `lon`, `kategori`, `prov`, `kab`, `logo`, `web`, dst.). Diubah di klien menjadi GeoJSON `FeatureCollection` hanya berisi `{key, warna, op}` per titik (`geoPts`, `public/akademisi.js:1656`) untuk `circle` layer; detail lewat `PT.items`.
- Peta karhutla: titik panas `data/titik_hari/<tgl>.json` (arsip, `index.html:1896`), `data/kluster_hari/<tgl>.json`, hot titik langsung `GET /api/titik` (Worker, D1) di-cache tepi 600 dtk (`src/worker.js:830`), `GET /api/himawari` tiap 10 menit (`index.html:~2420`). Format: GeoJSON `type: geojson` sumber MapLibre dengan `setData` untuk pembaruan (`peta.getSource("himawari")?.setData(...)`).
- Tidak ada vector tiles buatan sendiri maupun PMTiles untuk data titik; yang besar ditandai "OLAH" di dokumen.
- Verdict METI: **TERAPKAN** pola "satu endpoint GeoJSON ringan" `GET /api/peta/titik?wilayah=&sektor=` yang hanya mengembalikan `{id, lat, lon, tipe, logo_id, nama_singkat, bobot}` (tanpa field berat), di-cache tepi 5 menit (`cacheTepi`) untuk data publik; profil lengkap diambil saat klik. Rentang ±1-2 rb entitas cukup GeoJSON; PMTiles/vektor untuk poligon wilayah bila besar (`public/geo/provinsi.json` 381 KB sudah menunjukkan batasnya).

### 9.4 Clustering
- Dua mekanisme berbeda, keduanya berguna:
  1. **Cluster bawaan MapLibre** untuk titik banyak: `peta.addSource("prio", {type: "geojson", data, cluster: true, clusterRadius: 38, clusterMaxZoom: 7})`, lapisan lingkaran berukuran menurut `point_count` (`interpolate [2→13, 10→18, 40→26]`), angka di tengah (symbol layer, `text-font: ["Noto Sans Bold"]`), dan titik tunggal di bawah zoom 10; Himawari `clusterRadius: 40`. Bukti: `public/index.html:2039-2049, 2424`. Klik cluster: `getClusterLeaves` + `fitBounds` (`index.html:2220-2222`) atau `getClusterExpansionZoom` + `easeTo` (`index.html:2219`).
  2. **Decluttering marker HTML** untuk pin berlogo (direktori): urut menurut bobot, tolak pin yang kotaknya menimpa pin terpilih, batas jumlah menurut zoom `cap = min(90, round(10 + (z-3)*9))`, lebar label diukur dengan `canvas.measureText`, pin strategis selalu digambar, koordinat identik digabung jadi satu pin "N lembaga" yang membuka daftar, pin strategis berkoordinat sama disebar melingkar dalam piksel layar. Bukti: `public/akademisi.js:1632 (bobot), 1646-1652 (gabung koordinat sama), 1685-1704 (gambarPin), 1705 (jadwalPin rAF)`.
- Verdict METI: **TERAPKAN gabungan**: zoom < 8 = cluster bawaan (bubble bernomor, warna per sektor atau netral), zoom ≥ 8 = marker logo ber-decluttering seperti `gambarPin()`; gabung koordinat identik; rumus bobot METI: kapasitas MW, anggota METI terverifikasi, ada logo.

### 9.5 Ikon/logo per titik
- Pin = `<button class="ak-pin">` berisi lingkaran 38 px berbingkai warna kategori (`--w0`), isi ikon SVG kategori sebagai fallback, `<img>` logo di atasnya (`object-fit: contain`, padding 3 px, latar putih), `loading="lazy"`, `referrerpolicy="no-referrer"`, dan `data-next` untuk rantai URL cadangan (`onerror` di listener global karena CSP tanpa inline); label pil di kanan (nama pendek, `labelPin()` memendekkan singkatan generik); lencana bintang untuk partner strategis. Bukti: `public/akademisi.js:1680-1684 (elPin)`, `public/akademisi.css:633-636, 644, 807, 1192, 1403, 1409`, `:1636 (labelPin)`, `:1152 (chainLogo)`, `:3153 (lgoIkon)`, komentar CSP `:3`.
- Untuk titik sensor: ikon kanvas 32×32 per kelas dengan bentuk (lingkaran/segitiga/berlian) + warna palet Okabe-Ito (aman buta warna), didaftarkan `map.addImage(nama, imageData, {pixelRatio: 2})` dan dipakai symbol layer (`icon-image: ["get","ikon"]`, `icon-size` menurut zoom). Bukti: `public/akademisi.js:1659-1663 (snIkon)`, `:1668-1672 (sns-dot)`, `public/index.html:2051-2053 (ikon drone)`.
- Verdict METI: **SESUAIKAN**. Ambil `elPin` (marker HTML + logo + fallback ikon sektor) dan `snIkon` (bentuk+warna berbeda per teknologi: surya/angin/hidro/panas bumi/bioenergi). Logo disimpan di **R2 METI** dan disajikan lewat Worker (`/api/logo/<id>` ber-`cache-control` panjang, ukuran 96 px, WebP), bukan hotlink; `img-src 'self'`. Entitas tanpa logo: ikon sektor + inisial.

### 9.6 Tab wilayah dengan hitungan
- Padanan "Indonesia 516 / Jakarta 449": **sidebar tabel wilayah turun-bor** di `public/akademisi.js:1739 (SDP)`, `:1744-1752 (barisSide)`, `:1753- (isiSide)`: breadcrumb `Indonesia > <provinsi> > <kab/kota>` (tombol `data-sd-naik`), judul dan hitungan (`"${angka(tot)} lembaga"`), tabel yang bisa diurut (kolom: Total, Pemerintah, Kampus, LSM, Berkontak, Pakar; `aria-sort`), klik baris = `terbangKe(prov)` / `terbangKab(kab)` (`fitBounds`), dan di tingkat kab/kota menampilkan daftar lembaga per kategori. Hasil agregasi di-cache menurut kunci `(prov|jumlah|strat)` (`rowsCache`, `:1747`). Mode choropleth ("Lembaga di tiap kab/kota", `modePeta(true)`, `:1835-1840`) dengan pilihan Pulau (6 pulau, peta `PULAU` `:1625`), Tingkat (provinsi/kab), Ukuran (jumlah/berkontak/per juta penduduk/kesenjangan risiko).
- Tip wilayah saat hover: lambang daerah, angka ukuran, baris fakta, logo lima lembaga terbesar. `tipWilayah` `:1726`, `tipLogos` `:1722`, lambang `/lambang/provinsi/<kode>.png` dan `/lambang/kabkota/<slug>.png` (755 berkas, `public/lambang/`).
- "N of M placed": padanan teks "<N> lembaga tersebar di <P> provinsi, <T> bertitik peta" (`public/akademisi.js:1543`) dan tombol lapisan yang menampilkan jumlah berkoordinat (`:1904` `lbArr.filter(x => Number.isFinite(x.lat)).length`); entitas tanpa koordinat tetap bisa dicari dan dibuka profilnya (`pilihSaran`: "tanpa koordinat: langsung profil", `:1879`).
- Verdict METI: **TERAPKAN**. Komponen "pita wilayah": deretan tab Indonesia + 3-5 provinsi teratas (dengan hitungan, `role="tablist"`) di atas peta, tombol "Semua wilayah" membuka tabel penuh; penghitung eksplisit "**N dari M** entitas ditempatkan di peta" (M = semua yang lolos filter, N = yang punya koordinat tervalidasi); entitas tanpa koordinat dikelompokkan ke centroid kab/kota (ditandai "lokasi perkiraan") atau hanya di daftar.

### 9.7 Zoom dan kontrol
- Parameter: `center: [118, -2.4], zoom: 4.1` (nasional), `minZoom: 3, maxZoom: 15` (karhutla) / `bounds: [[94,-11.5],[141.5,6.5]]`, `minZoom: 3, maxZoom: 16` (direktori), `dragRotate: false`, `pitchWithRotate: false`, `touchZoomRotate.disableRotation()`. Kontrol: `NavigationControl({showCompass:false})` dan `ScaleControl({unit:"metric"})` di kanan bawah; `GeolocateControl` di direktori; `fitBounds` dengan padding menyesuaikan lebar sidebar. Kotak Indonesia konsisten dengan `BATAS_ID` (`src/worker.js:83`: lat -11,5..6,5; lon 94,5..141,5).
- Bukti: `public/index.html:1988-1993`, `public/akademisi.js:~1913-1916, 1881`.
- Verdict METI: **TERAPKAN** persis; pakai `maxBounds` Indonesia sedikit longgar agar pengguna tidak tersesat.

### 9.8 Popup / kartu
- Peta karhutla: popup MapLibre dengan kelas `.kartu` (kepala berwarna aksen, grid `.kg` baris label–nilai, aksi lokasi, sumber), `maxWidth: "280px"/"300px"/"340px"`, `closeButton: false`, `setHTML` (`public/index.html:2235-2240, 2380, 2560 (className pw-pop)`), CSS tema `.maplibregl-popup-content{background:var(--card)}` (`:393-395`).
- Direktori: tip hover satu elemen `#akTip` (`tipPeta`, `public/akademisi.js:1733`), klik pin = lembar detail (`bukaSheet`/drawer `role="dialog" aria-labelledby`, `:1904`), hasil cari = popup `setDOMContent` + `Marker` cincin sorot (`pilihSaran`, `:1876-1895`), pin berkoordinat sama = lembar daftar (`bukaGrupPin`, `:1653`).
- Verdict METI: **SESUAIKAN**. Hover = tip ringan; klik = drawer kanan (desktop) / bottom sheet (mobile) yang bisa difokus, bukan popup HTML besar; profil entitas di halaman sendiri (`/pelaku/<slug>`) agar bisa dibagikan dan diindeks.

### 9.9 Performa peta
- Lazy load pustaka (9.1), `ResizeObserver` → `map.resize()`, penjadwalan `requestAnimationFrame` + `nanti()` untuk `gambarPin` pada `moveend`, cap jumlah pin menurut zoom, indeks cari dibuat sekali per perubahan data (`indeksSaran` memakai kunci jumlah), debounce 120 ms pada input cari, `querySourceFeatures` hanya di bawah zoom 8, `setData` hanya bila hasil berubah (`kunci !== this._hwk`, `index.html:~2328`), polling `setInterval` hanya bila tab terlihat (`!document.hidden`, `index.html:~2421`). Bundel: GL JS 772,8 KB min (vendor).
- Bukti: `public/akademisi.js:1705, 1913-1916, 1860-1872 (indeksSaran), 1892 (debounce 120)`, `public/index.html:~2328, ~2421`.
- Cacat: pencarian linear pada array (cukup untuk ribuan entitas); halaman utama memuat pustaka peta sinkron di `<head>` (`index.html:36`) memblokir render.
- Verdict METI: **TERAPKAN** semuanya kecuali pemuatan sinkron. Anggaran: GL JS 773 KB + gaya + PMTiles header; target LCP < 2,5 dtk di 4G dengan placeholder statis (gambar peta kosong + hitungan) sebelum kanvas siap.

### 9.10 Tema gelap/terang
- `gelap()` memadukan `dataset.theme` dan `prefers-color-scheme` (`public/index.html:1829`); gaya dasar ditukar `positron`/`dark` dengan `setStyle(DASAR(), {diff: false})` dan lapisan data dipasang ulang pada event `style.load` (`index.html:1995, 1998`; komentar: tanpa `diff:false` MapLibre membuang lapisan data tanpa memicu `style.load`); label memakai warna halo menurut tema (`index.html:2054-2056`).
- Cacat: peta direktori hanya memilih saat dibuat (8.15).
- Verdict METI: **TERAPKAN** pola `setStyle({diff:false}) + style.load` di satu modul peta dan satu tes yang mengganti tema lalu memastikan lapisan titik/cluster masih ada.

### 9.11 Mobile
- Padding kamera adaptif: `innerWidth <= 700 ? {bottom: innerHeight*.4} : {left: lebar sidebar + 24}` pada `flyTo` (`public/akademisi.js:1881`); sidebar bisa dilipat dan peta `resize()` 250 ms kemudian (`:~1925`); `touchZoomRotate.disableRotation()`; area klik titik diperbesar ±6 px; kontrol di kanan bawah (terjangkau ibu jari); media query `max-width: 600/700/1000/1100` untuk tata letak (`public/akademisi.css:15, 73, 90, 329`).
- Verdict METI: **TERAPKAN**; di ponsel sidebar wilayah menjadi sheet bawah dan pin berlogo dikurangi (cap lebih kecil) demi performa. Tambahkan uji viewport 375 px (resize_window preset mobile).

### 9.12 Aksesibilitas peta
- Ada: `role="application"` + `aria-label="Peta lembaga mitra"` (`public/akademisi.js:1902`), grup lapisan `role="group"` + `aria-pressed`, pin = `<button>` yang bisa difokus dengan `title`, kotak cari `combobox` (panah/Enter/Escape), sub-tampilan **Daftar** sebagai alternatif non-peta (`:1976`, tab "Peta | Daftar"), `prefers-reduced-motion` mematikan animasi (`akademisi.css:328, 2340`), teks pengganti saat pustaka gagal ("Peta tidak bisa dimuat..."; `:1912`).
- Kurang: pin tidak punya `aria-label` nama lengkap (hanya `title`); kanvas peta tak bisa dinavigasi keyboard selain kontrol bawaan; tidak ada pengumuman `aria-live` hasil filter.
- Verdict METI: **TERAPKAN + perbaiki**: `aria-label` per pin, `aria-live="polite"` "N dari M entitas ditempatkan", fokus ke drawer saat dibuka dan kembali ke pin saat ditutup, tab Daftar sebagai jalur utama bagi pembaca layar.

### 9.13 Atribusi
- `attributionControl: {compact: true}` (`index.html:1989`) dan `customAttribution: "Batas wilayah BIG"` (`akademisi.js:~1914`); atribusi per sumber raster (`attribution: "Citra © Esri, Maxar, Earthstar"`, `nasa.js:~15 ATRIB`); `.maplibregl-ctrl-attrib{font-size:10px}` (`index.html:395`).
- Verdict METI: **TERAPKAN** dan lengkapi: "© OpenStreetMap contributors" (ODbL), atribusi Protomaps/OpenMapTiles sesuai gaya terpilih, dan sumber batas wilayah; halaman `/atribusi` memuat daftar sumber + lisensi (turunan `docs/sumber-lapisan.md`). Jangan menyembunyikan kontrol atribusi.

### 9.14 Rekomendasi konkret: memakai ulang modul peta untuk direktori METI
Struktur berkas yang disarankan (JS murni, ES modules, tanpa build):
```
public/vendor/maplibre/        maplibre-gl.js + .css (vendor, satu versi, tanpa CDN)
public/vendor/pmtiles/         pmtiles.js (bila PMTiles dipilih)
public/inti/maplibre.js        salin dari poskokarhutla: muatMapLibre() (sekali muat, galat dibuang)
public/inti/peta/dasar.js      gaya terang/gelap + gantiTema (setStyle diff:false + style.load)
public/inti/peta/pin.js        elPin + gambarPin (decluttering, bobot, cap per zoom, gabung koordinat sama)
public/inti/peta/cluster.js    sumber geojson cluster + klik expansion zoom
public/inti/peta/pita.js       tab wilayah + tabel turun-bor + "N dari M ditempatkan"
public/peta.html + peta.js     halaman: muat malas, ambil /api/peta/titik, pasang modul
src/peta.js                    GET /api/peta/titik, GET /api/peta/wilayah, /api/logo/<id> (R2)
```
Langkah:
1. Salin ide, bukan berkas, dari `public/inti/maplibre.js`, `public/akademisi.js:1622-1704` dan `:1739-1760`; hapus ketergantungan pada global `PT`, `lbArr`, `KAT`; jadikan modul dengan parameter `{items, kategori, onBuka}` supaya direktori METI dan halaman lain (mis. peta proyek) memakai kode yang sama (gerbang anti-salinan `gerbang-inti`).
2. `item` METI = `{id, lat, lon, nama, singkatan, tipe (surya|angin|hidro|panas-bumi|bioenergi|...), logo_id, bobot, wilayah (kode prov/kab)}`. Rumus `bobot` mengikuti `akademisi.js:1632` (skala + jumlah cabang + skor + ada logo).
3. Data: `GET /api/peta/titik` (publik, ringkas, cache tepi 5 mnt; baris diserialisasi lewat `publik(row)` agar tidak membocorkan kontak/field anggota; untuk anggota login, endpoint lain yang memakai `lingkupSql`). Hitungan tab wilayah dihitung di Worker (`GROUP BY prov`) dan di-cache, bukan di klien.
4. Basemap: Protomaps PMTiles (R2) atau OpenFreeMap sementara; keduanya mengikuti `gelap()`; tambahkan semua host ke CSP `connect-src` dan `worker-src blob:` (MapLibre memakai worker blob; lihat `_headers`: `worker-src 'self' blob:` dan `child-src blob:`).
5. Logo: unggah di R2, endpoint `GET /api/logo/<id>` ber-`cache-control: public, max-age=86400, stale-while-revalidate=604800` (aturan sudah ada untuk `/lambang/*` di `_headers`), `img-src 'self'`; hapus `chainLogo` favicon.
6. Pita wilayah: komponen `role="tablist"`; tombol "Semua"; penghitung `N dari M` dengan `aria-live`; entitas tanpa koordinat ditandai dan tetap bisa dibuka.
7. Uji (gerbang): (a) uji integrasi Miniflare untuk `/api/peta/titik` (tak membocorkan kontak, hitungan = hasil `COUNT`, hak anggota); (b) uji `node:vm`/jsdom ala `tests/kemitraan` untuk `gambarPin` (tak ada pin yang kotaknya bertabrakan, cap menurut zoom); (c) uji tema: setelah `gantiTema` lapisan `titik` ada; (d) gerbang vendor: versi MapLibre dan hash; (e) gerbang CSP: tak ada host peta di luar daftar.
8. Tidak diambil: lapisan sains (FWI, NASA GIBS, hujan, Himawari), choropleth risiko, mode `Sim` 3D: tidak relevan bagi direktori energi; satu lapisan opsional "Peta potensi" bila METI punya data potensi per wilayah.

---

## Lampiran A. Berkas utama yang dibaca
`AGENTS.md`, `CLAUDE.md`, `WARGA.md` (sebagian), `package.json`, `wrangler.jsonc`, `wrangler.warga.jsonc`, `docs/cara-kerja.md`, `docs/sumber-lapisan.md`, `docs/OUTSTANDING.md`, `public/_headers`, `src/worker.js` (header, laju, CSRF, router, scheduled, cacheTepi), `src/staf.js`, `src/instansi.js` (hak/lingkup, sandi), `src/akademisi.js`, `src/monitor.js`, `src/pemulihan.js`, `src/api_v1.js`, `migrations/0003`, `0099`, `tests/agen/gerbang-{wrangler,headers,anggaran-cf,inti}.test.mjs`, `tests/warga/{_bantu.mjs,gerbang.test.mjs,audit-keamanan-worker.test.mjs,cakupan.json}`, `.github/workflows/{terbit,titik,data,direktori-bulanan}.yml`, `scripts/terbit/{isi_data,jaga_segar,versi}.py`, `.claude/{settings.json,agents/*,ilmu-agent/*}`, `public/index.html` (peta), `public/akademisi.js` + `.css` (peta lembaga), `public/inti/{maplibre.js,peta/nasa.js}`, `public/i18n.js`.

## Lampiran B. Yang belum saya periksa (jangan dianggap aman)
- Isi penuh 108 migrasi, 30 workflow, dan sebagian besar modul `src/` (hanya sampel).
- Apakah `.claude/hooks` ada selain di `settings.json` (tidak ditemukan).
- Isi `docs/panen/RENCANA-PANEN-DATA.md` dan `docs/buku-pegangan/AUDIT-ATURAN-HARNESS.md`.
- Perilaku nyata peta di peramban (tidak dijalankan); semua klaim peta berasal dari pembacaan kode.
- Lisensi dan syarat layanan OpenFreeMap, Protomaps, dan ukuran ekstrak Indonesia: **[umum, verifikasi]** sebelum dipilih.
