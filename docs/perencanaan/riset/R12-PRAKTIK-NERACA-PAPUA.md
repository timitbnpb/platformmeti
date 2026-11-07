# R12. Praktik terbaik (dan jebakan) dari repo neraca-papua untuk Platform Jaringan METI

Tanggal: 7 Nov 2026
Repo dibaca: `/Users/priyankaalfatehan28/Documents/GitHub/neraca-papua`, commit `2287e2b` (`git rev-parse --short HEAD`), satu-satunya commit, working tree bersih.
Pelengkap R7 (`R7-NERACA-PAPUA.md`). R7 sudah merangkum skema data, token desain, layar, lencana bukti, daftar fungsi yang bisa disalin, dan fakta bahwa tidak ada Worker/D1/R2/CI. Laporan ini tidak mengulang itu. Fokusnya infrastruktur, keamanan, pipeline, mutu, operasional, tata kelola agent, dan hutang yang jangan ditiru.

## 0. Pembacaan jujur dulu

Cakupan yang dicari tugas: README, AGENTS.md, CLAUDE.md, package.json, konfigurasi deploy, `src/`, skema/migrasi, `scripts/`, `tests/`, `.github/`, `docs/`, `.claude/`. Hasil pemeriksaan:

| Dicari | Ada? | Bukti |
| --- | --- | --- |
| `AGENTS.md`, `CLAUDE.md`, `.claude/` | Tidak. `.claude/` malah ada di `.gitignore` | `.gitignore:3`; `git ls-files` (58 berkas) |
| `package.json`, lockfile, `wrangler.*`, `_headers`, `_redirects` | Tidak | `git ls-files` |
| `src/`, `scripts/`, `tests/`, `.github/`, `docs/`, migrasi SQL | Tidak | `git ls-files` |
| Rahasia/token/kunci di repo | Tidak ditemukan (pola `key/secret/token/password = nilai panjang` di semua berkas terlacak: nol hasil) | `git grep -E` |
| Kode | 2 skrip Python stdlib (`situs/build.py` 82 baris, `situs/tarik_firms.py` 60 baris) dan 1 template HTML/JS 1.363 baris | `situs/` |

Jadi untuk kategori 1, 4, 5, dan 7, "praktik terbaik" yang ada di repo sebagian besar adalah **niat tertulis di blueprint** (rencana), bukan mekanisme yang jalan. Laporan ini selalu menandai mana yang `[JALAN]` (ada kodenya), `[RENCANA]` (hanya prosa di blueprint), dan `[ABSEN]` (tidak ada sama sekali). Nilai METI justru ada pada dua hal: (a) disiplin proses data yang nyata dan murah (aturan sumber, peringatan jujur, penanda `[CEK]`), (b) daftar rencana yang bagus tapi tak pernah diuji, yang METI bisa wujudkan dengan stack Worker+D1+R2 sejak awal.

Bagian 8 berisi 11 hutang yang tidak boleh ditiru; bagian 9 memberi urutan penerapan.

---

## 1. Infrastruktur dan deploy

### 1.1 Satu sumber data -> satu build -> satu artefak, dengan laporan build [JALAN]
- Praktik: semua angka datang dari `data/*.csv` + JSON pendukung lewat satu skrip; template tidak memuat angka. Skrip mencetak laporan per dataset ("n baris, m ditolak tanpa sumber") dan ukuran keluaran.
- Bukti: `situs/build.py:3-4` (docstring "Tidak ada angka yang diketik di template"), `:41-53` (laporan), `:77-78` (cetak laporan dan ukuran KB).
- Kenapa penting: satu jalur masuk berarti satu tempat memeriksa mutu, dan laporan yang tercetak membuat perubahan jumlah baris terlihat tanpa membuka data.
- Verdict METI: **SESUAIKAN**. Jangan bangun HTML tunggal. Pindahkan jalur ini ke skrip impor ke D1 (`npm run impor`) yang mencetak laporan yang sama (diterima/ditolak per tabel, alasan penolakan dihitung per jenis) dan keluar dengan kode non-nol bila ada penolakan yang tak diharapkan. Mesin yang sama dipakai CI dan operator.

### 1.2 Data dibekukan saat build, tanggal build tercetak di artefak [JALAN]
- Praktik: `dibangun` = tanggal hari ini disisipkan ke data, dan laci rincian menulis "Kutip sebagai: ... (dibangun <tanggal>)".
- Bukti: `situs/build.py:72`; `situs/template.html:586` (baris "Kutip sebagai").
- Kenapa penting: angka yang dikutip orang punya jangkar waktu. Cocok dengan prinsip "dibekukan saat dikutip" (`blueprint-lengkap-neraca-papua.md:44`).
- Verdict METI: **SESUAIKAN**. Untuk direktori hidup, jangan pakai tanggal build tetapi `updated_at` baris dan versi rilis (hash commit + tanggal) di footer dan di respons API (`X-Versi`). Jangan meniru `date.today()` karena membuat build tidak deterministik (lihat 8.6).

### 1.3 Rencana tulis rinci, runtime tidak ada [RENCANA]
- Praktik: blueprint memisahkan kolom "MVP" vs "Setelah pilot", dan wajib-walau-MVP (mode gelap setara, 375 px tanpa scroll horizontal, satu formatter angka/tanggal, 404 dirancang, tanpa teks internal "TODO").
- Bukti: `blueprint-lengkap-neraca-papua.md:512-532` (tabel teknis), `:525-531` (daftar wajib).
- Kenapa penting: daftar "wajib walau MVP" adalah gerbang rilis murah yang bisa diperiksa mesin.
- Verdict METI: **TERAPKAN**, dengan tambahan yang tidak ada di Neraca: atribut `lang` + `hreflang` ID/EN, header keamanan (bagian 2), dan skrip `cek:rilis` yang membuktikan tiap butir (lihat 4.3).

### 1.4 Tidak ada pemisahan lingkungan, rahasia, atau rilis [ABSEN]
- Bukti: tidak ada `wrangler.*`, `.env.example`, atau workflow. README hanya `python3 build.py` lalu buka berkas lokal (`README.md:20-28`).
- Verdict METI: **TERAPKAN** sebagai kekurangan yang harus ditutup: `wrangler.jsonc` dengan tiga lingkungan (lokal, staging, produksi), D1/R2 terpisah per lingkungan, nama variabel rahasia hanya dalam `.dev.vars.example` (nilai tidak pernah di repo), migrasi D1 bernomor berurut yang dijalankan CI sebelum deploy, dan tag rilis. Ini bukan praktik Neraca tetapi harus ada karena Neraca membuktikan akibat ketiadaannya.

### 1.5 Bergantung pada CDN pihak ketiga tanpa SRI [JALAN, lemah]
- Bukti: `situs/template.html:540-541` memuat d3 7.9.0 dan topojson 3.0.2 dari `cdnjs.cloudflare.com` tanpa atribut `integrity`/`crossorigin`.
- Verdict METI: **SESUAIKAN**. Versi dikunci (baik, ditiru) tetapi tambahkan SRI, atau lebih baik salin pustaka ke aset Worker agar CSP bisa `script-src 'self'` dan situs jalan tanpa CDN (lihat 2.2).

---

## 2. Keamanan

### 2.1 Escape keluaran lewat satu fungsi, dipakai konsisten [JALAN, tanpa penjaga]
- Praktik: satu `esc()` (5 karakter HTML) dan semua nilai data ke HTML lewat `esc()`; titik SVG memakai `.text()` bukan `innerHTML`; tautan sumber hanya diterima bila berawalan `http(s):` lalu di-`esc` dan diberi `rel="noopener"`.
- Bukti: `situs/template.html:545` (definisi), `:564` (`srcLinks` menyaring `/^https?:/`), `:596` dan `:634` (`.append("title").text(...)`), 93 pemakaian `esc(` dan 30 penugasan `innerHTML` di berkas itu. Hanya pemeriksaan sampel yang dilakukan; tidak ada audit penuh dan tidak ditemukan celah dalam sampel.
- Kenapa penting: data masuk dari CSV hasil riset (dan di METI dari isian anggota). Satu `innerHTML` yang lupa `esc` = XSS tersimpan.
- Hal yang hilang: tidak ada penjaga mekanis (tidak ada lint, uji, atau CSP). Konsistensinya murni kebiasaan.
- Verdict METI: **TERAPKAN dan perkuat**. Di METI input berasal dari pengguna sungguhan, jadi: (a) template literal bertag `html\`\`` yang meng-escape otomatis, bukan `esc()` manual; (b) uji statis yang menggagalkan CI bila ada `innerHTML =` di luar berkas pembantu itu; (c) allowlist skema URL (`https:` saja) divalidasi di Worker saat simpan, bukan hanya saat tampil.

### 2.2 Tidak ada CSP, header keamanan, atau batas ukuran/laju [ABSEN]
- Bukti: template adalah fragmen tanpa `<head>` (`situs/template.html` baris awal: langsung `<title>` dan `<style>`), tanpa `<meta http-equiv>`, tanpa `_headers`.
- Verdict METI: **TERAPKAN**. Worker menambahkan di satu fungsi pembungkus respons: `Content-Security-Policy` (`default-src 'self'`; gambar R2 lewat domain sendiri), `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, `frame-ancestors 'none'`. Plus batas ukuran badan permintaan, batas laju per IP dan per akun untuk login/formulir, dan uji yang mengecek header ada di semua rute.

### 2.3 Embedding data ke dalam `<script>` di-escape `</` [JALAN]
- Bukti: `situs/build.py:74` mengganti `</` menjadi `<\/` sebelum menyisipkan JSON ke HTML.
- Kenapa penting: mencegah data yang memuat `</script>` memutus blok skrip.
- Verdict METI: **TIDAK PERLU** sebagai pola (METI memakai `fetch('/api/...')`, bukan data tertanam). Jika suatu saat ada data bootstrap tertanam (mis. status login), pakai `JSON.stringify` + escape `<`, `U+2028`, `U+2029`, dan cukup di satu fungsi. Catatan: `build.py` hanya menangani `</`, tidak `<!--`.

### 2.4 Tidak ada data pribadi, kontak hanya kelembagaan [RENCANA]
- Bukti: `blueprint-lengkap-neraca-papua.md:637` ("Tidak ada data pribadi perorangan. Kontak hanya kontak kelembagaan."), `:648`.
- Verdict METI: **SESUAIKAN**. METI punya akun, nama, dan email anggota, jadi prinsipnya dibalik menjadi minimisasi: kolom pribadi dipisah dari kolom publik, tiap kolom diberi label `publik | anggota | admin` di skema (bukan hanya di UI), dan ada daftar bidang yang tidak pernah dikembalikan API publik. Itu tugas hak per baris di Worker, bukan RLS.

### 2.5 Peran dan RLS hanya sebagai prosa, dengan RLS yang tidak ada di D1 [RENCANA]
- Bukti: `blueprint-lengkap-neraca-papua.md:615-623` (lima peran), `:592` ("RLS: publik hanya bisa membaca fakta berstatus terbit"), yang mengandaikan Postgres/Supabase.
- Verdict METI: **SESUAIKAN**. Tabel peran di Neraca berguna sebagai kerangka tetapi tidak bisa dipindah. Karena D1 tidak punya RLS, gantinya satu modul hak (fungsi murni `boleh(pengguna, aksi, baris)`) yang dipanggil oleh **setiap** handler data, ditambah `WHERE` wajib dibangun dari satu fungsi pembangun-kueri, dan uji yang memeriksa matriks peran x aksi x baris dengan D1 sungguhan (bukan mock). Satu-satunya jalur ke D1 lewat pembungkus itu; larang `env.DB.prepare` di handler dengan uji statis.

### 2.6 Hak cipta, lisensi sumber, dan kerahasiaan dikelola per berkas [JALAN sebagian]
- Bukti: README menandai ringkasan laporan konsultan bertanda confidential sebagai "jangan dipublikasikan" (`README.md:41`) tetapi **berkas itu tetap terlacak git** (`data/dokumen/doc_mck_gmp2025.md`, `doc_mck_gmp2026.md`). `data/03_vendor_citra.md` mencatat lisensi publikasi per vendor dan memperingatkan lisensi nonkomersial (bagian 4, butir 5). Blueprint melarang menyalin nama/logo/font/gambar situs rujukan (`blueprint-lengkap-neraca-papua.md:644`). Tidak ada berkas LICENSE.
- Verdict METI: **TERAPKAN** kolom `lisensi_sumber` dan `boleh_diterbitkan` per dataset/baris (nilai bawaan salah), dengan penolakan impor bila kosong. **Jangan** meniru cara menjaga kerahasiaan lewat README: berkas confidential harus di luar repo (atau R2 privat) dan `.gitignore`, bukan "jangan dipublikasikan" di prosa.

---

## 3. Data dan pipeline

### 3.1 Aturan "baris tanpa sumber ditolak" di build [JALAN]
- Praktik: `KOLOM_SUMBER` per dataset; baris yang kolom `sumber_url`-nya kosong, "—", atau "-" dibuang dan dihitung di laporan.
- Bukti: `situs/build.py:24-27`, `:45-53`.
- Kenapa penting: ini satu-satunya gerbang mutu yang benar-benar berjalan di repo, dan murah. Hasil pemeriksaan data: 0 baris tanpa sumber pada 9 dari 11 CSV; 1 baris pada `03_situs_tangki.csv` dan 5 baris pada `05_wilayah_long.csv`, yang semuanya dibuang build.
- Verdict METI: **SESUAIKAN** (rinciannya di 8.1 dan 8.3 karena implementasinya terlalu longgar): terapkan di Worker (jalur POST/impor) dan di D1 (`CHECK (sumber_url LIKE 'https://%')`, `NOT NULL`), bukan hanya "tidak kosong".

### 3.2 Gap yang jujur sebagai baris, bukan sebagai lubang diam-diam [JALAN, tetapi bocor]
- Praktik: nilai tidak diketahui ditulis "—" dengan alasan di kolom `catatan`; baris untuk data yang gagal ditarik tetap dicatat dengan `tingkat_bukti=tidak_ada` dan alasannya (mis. portal dibalik anti-bot).
- Bukti: `data/05_wilayah_long.csv` baris 141-143 (tiga dari lima baris `tidak_ada`); `data/06_komoditas.md:4` ("Aturan: ... '—' berarti tidak diketahui dan alasannya ada di kolom `catatan`").
- Kenapa penting: menghindari angka nol palsu; pembaca tahu apakah "kosong" berarti tak ada atau belum dicari.
- Bocornya: baris-baris "tidak ada data" itu justru dibuang oleh filter sumber di 3.1 (karena `sumber_url` "—"), jadi alasannya tak sampai ke layar (lihat 8.2).
- Verdict METI: **TERAPKAN dengan perbaikan**: di METI, "alasan kosong" jadi kolom resmi `alasan_kosong` (enum: `tidak_dipublikasikan | belum_ada | menunggu_konfirmasi | belum_dicari`) pada tabel fakta; CHECK menuntut `nilai IS NOT NULL OR alasan_kosong IS NOT NULL`. Sel kosong tanpa alasan = ditolak. (Enum empat jenis itu ada di `blueprint-lengkap-neraca-papua.md:38-41`; yang baru di sini adalah mengubahnya menjadi constraint.)

### 3.3 Tingkat bukti, tanggal baca, dan peringatan jujur per berkas [JALAN]
- Praktik: tiap baris CSV punya `tingkat_bukti` dan `tanggal_akses` (seragam 2026-10-19). Tiap `.md` pendamping memuat "Peringatan jujur" tentang apa yang **tidak** diverifikasi (mis. dokumen dibaca lewat ringkasan alat, halaman sumber memberi 403 lalu dicocokkan ke rilis lain).
- Bukti: `data/04_jaringan.md:27` dan `:55`; `data/katalog_C_infrastruktur_energi.md:3-5` (definisi `[CEK]` dan "BELUM membuka dokumen primer"); `data/06_komoditas.md:4`.
- Kenapa penting: kejujuran tentang cara bukti dikumpulkan membuat tingkat bukti bermakna, dan membuat penerima data tahu apa yang boleh dikutip.
- Verdict METI: **TERAPKAN**: kolom `cara_verifikasi` (teks pendek: "dokumen dibaca penuh | ringkasan | situs pihak itu | berita") dan `tanggal_baca` pada tiap fakta; tampilkan di tooltip lencana. Untuk data yang diisi anggota, tingkat bukti bawaan "diisi sendiri" sampai Admin menaikkan.

### 3.4 Pemantauan perubahan sumber dan jangkar ke dokumen primer [RENCANA]
- Praktik: tiap penarik menyimpan **berkas asli + hash + waktu tarik** di arsip mentah; sumber yang hilang tetap bisa dibuktikan.
- Bukti: `blueprint-lengkap-neraca-papua.md:572`.
- Verdict METI: **SESUAIKAN**. Untuk direktori yang diisi manusia, arsip mentah = lampiran bukti (PDF/gambar) di R2 dengan kunci `sha256`, tercatat di tabel `arsip(id, r2_key, sha256, ukuran, tipe, diunggah_oleh, waktu)`. Penarik otomatis hanya bila ada sumber API publik (mis. data regulator); jangan membangun 9 penarik sebelum perlu.

### 3.5 Gerbang verifikasi dengan antrean tinjau manusia [RENCANA]
- Praktik: tolak otomatis (sumber kosong, periode campur, satuan tak dikenal, lompatan nilai tanpa catatan, bertentangan dengan sumber lain); lolos tapi bertingkat lemah (CUPLIKAN/INFERENSI) masuk antrean tinjau, dan tiap keputusan dicatat.
- Bukti: `blueprint-lengkap-neraca-papua.md:580-587`, `:505-509` (impor memeriksa sumber kosong, periode campur, duplikat).
- Verdict METI: **SESUAIKAN**. Ini pola paling bernilai untuk sensus anggota: masukan anggota atau impor tidak langsung terbit, tapi masuk status `diajukan` -> `ditinjau` -> `terbit`, dengan tabel `keputusan(id, objek, oleh, keputusan, alasan, waktu)`. Mulai dari tiga aturan otomatis saja (sumber/skema URL, satuan dikenal, duplikat dengan kunci alami). Aturan "lompatan nilai" dan "bertentangan dengan sumber lain" tunda sampai ada data riwayat.

### 3.6 Versi fakta: yang lama tidak dihapus [RENCANA]
- Bukti: `blueprint-lengkap-neraca-papua.md:591`.
- Verdict METI: **TERAPKAN**: tabel `*_riwayat` (atau kolom `versi`, `berlaku_dari`, `berlaku_sampai`) diisi dalam transaksi yang sama (`env.DB.batch`) dengan perubahan. Penting untuk pertanggungjawaban Admin dan untuk pembatalan.

### 3.7 Cadangan [RENCANA, tanpa mekanisme]
- Bukti: satu kalimat: "Arsip mentah dan basis data dicadangkan harian" (`blueprint-lengkap-neraca-papua.md:636`). Tidak ada skrip, jadwal, atau uji pemulihan. Cadangan di repo ini hanyalah git itu sendiri (CSV terlacak), pack 1,74 MiB.
- Verdict METI: **TERAPKAN lebih tegas**: D1 Time Travel untuk pemulihan titik waktu, ditambah ekspor `wrangler d1 export` terjadwal (Cron Trigger atau Action) ke bucket R2 terpisah yang tidak dipakai aplikasi, dengan retensi tertulis, dan **latihan pemulihan** ke D1 uji tiap kuartal yang dicatat. Cadangan yang belum pernah dipulihkan dianggap belum ada.

### 3.8 Penarik tunggal tanpa ketahanan [JALAN, rapuh]
- Praktik yang baik: sumber publik tanpa kunci; saring titik dengan poligon murni Python; tanggal tarik UTC tercatat di keluaran; jumlah titik per sumber dicatat.
- Bukti: `situs/tarik_firms.py:5-8` (sumber), `:31-53`, `:54` (stempel UTC), `:53` (hitungan per sumber).
- Kelemahan: lihat 8.4.
- Verdict METI: **SESUAIKAN**. Cron Worker boleh menarik data eksternal yang relevan, dengan pola: tarik -> validasi bentuk -> tulis ke tabel sementara -> bandingkan jumlah dengan tarikan terakhir -> baru tukar. Tarikan yang gagal tidak menimpa data lama dan mencatat ke `log_tarik`.

---

## 4. Gerbang mutu dan pengujian

### 4.1 Satu-satunya gerbang yang berjalan: filter sumber di build
Lihat 3.1. Selain itu **tidak ada uji, lint, tipe, atau CI** (`git ls-files` tanpa `tests/`, `.github/`, `package.json`). `blueprint-lengkap-neraca-papua.md:635` hanya berjanji "jumlah baris tidak turun drastis, tidak ada fakta tanpa sumber, skor bisa direproduksi" [RENCANA].

### 4.2 Janji uji yang layak dijadikan uji sungguhan
- Praktik: tiga uji regresi data yang disebut tetapi tidak ditulis: (1) jumlah baris tidak turun drastis, (2) tak ada fakta tanpa sumber, (3) hitungan reproduksi.
- Bukti: `blueprint-lengkap-neraca-papua.md:635`.
- Verdict METI: **TERAPKAN**, sebagai uji integrasi yang menjalankan D1 lokal (miniflare/`wrangler dev`) dengan berkas migrasi sungguhan: (1) jumlah baris tabel inti tidak turun lebih dari ambang dibanding tarikan terakhir tanpa bendera `--izinkan-turun`, (2) tidak ada baris publik tanpa sumber (kueri langsung, bukan mock), (3) hasil agregat yang sama pada dua kali impor dari berkas yang sama (idempotensi).

### 4.3 Daftar "wajib walau MVP" sebagai gerbang rilis [RENCANA]
- Bukti: `blueprint-lengkap-neraca-papua.md:525-531`.
- Verdict METI: **TERAPKAN** sebagai skrip yang gagal bila ada yang kurang: halaman 404 ada, tidak ada teks "TODO"/nama berkas di HTML yang dirender, formatter tunggal dipakai (grep untuk `toFixed`, `toLocaleString` di luar modul format), kontras tema gelap diperiksa, viewport 375 px tanpa scroll horizontal (uji browser tanpa kepala), dan **paritas ID/EN**: setiap kunci kamus ID punya padanan EN (uji statis; Neraca tidak punya i18n sehingga ini tambahan murni).

### 4.4 Penanda `[CEK]` yang ditegakkan oleh mesin [RENCANA, penegakan manual]
- Praktik: angka belum diverifikasi diberi `[CEK]` di dokumen riset (blueprint: 14 + 6 kemunculan; katalog A-D: 22/21/29/15) dan aturan "angka `[CEK]` tidak tampil di depan pejabat".
- Bukti: `blueprint-lengkap-neraca-papua.md:645` dan hitungan `grep -c '\[CEK\]'`; README `:39-40`.
- Kelemahan: penegakannya manual; data yang sama masuk CSV tanpa penanda `[CEK]` (CSV tidak punya kolom status verifikasi), sehingga aturan itu tidak bisa dicek build.
- Verdict METI: **SESUAIKAN**. Jadikan kolom `status_verifikasi` (`belum | cek | terverifikasi`) di tabel, dan lapisan baca publik menyaring `terverifikasi` saja (atau menampilkan lencana "belum diverifikasi" bila produk memilih terbuka). Mesinnya yang menolak, bukan mata manusia.

### 4.5 Tidak ada uji untuk logika grafis/interaksi
Graf, kuadran, dan peta tidak diuji; perilaku render tidak punya rekaman. Verdict METI: **TIDAK PERLU** meniru; yang dibutuhkan hanya uji alur masuk (login, peran, simpan) dan uji tampilan ringan pada layar kunci. Prioritas uji METI ada di hak per baris dan impor (4.2, 2.5), bukan di grafik.

---

## 5. Operasional dan pemantauan

### 5.1 Degradasi yang jujur saat sumber gagal [RENCANA]
- Praktik: bila penarik gagal, tampilan memakai data terakhir yang lolos dengan label "data per <tanggal>", "tidak pernah kosong diam-diam". Keadaan layar tertulis: memuat (skeleton), kosong (satu kalimat + satu aksi), error (kalimat manusiawi + coba lagi), luring (halaman terakhir dari cache), data sebagian (banner "n dari N").
- Bukti: `blueprint-lengkap-neraca-papua.md:634` dan `:215-222`; implementasi sebagian: router merender tiap halaman dalam `try/catch` dengan callout "Halaman ini gagal dimuat" (`situs/template.html:1349-1363`, via R7), `coverage()` "n dari N" (`:807`).
- Verdict METI: **TERAPKAN**: komponen `Keadaan` yang sama untuk lima keadaan itu, dwibahasa, dan **berlaku juga untuk respons API** (bentuk galat seragam `{kode, pesan_id, pesan_en}` dan tidak pernah 200 dengan badan kosong).

### 5.2 Pemantauan, pencatatan, peringatan [ABSEN]
- Bukti: tidak ada log, metrik, uptime, atau alarm. Analitik hanya direncanakan "first-party, tanpa cookie pihak ketiga" (`blueprint-lengkap-neraca-papua.md:485` dan tabel `:530`).
- Verdict METI: **TERAPKAN** (tidak ada contoh dari Neraca): log terstruktur JSON per permintaan (rute, status, waktu, id pengguna **hasil hash**, tanpa badan permintaan), Workers Logs/Logpush, tabel `audit` untuk setiap tulis oleh Admin/Super (siapa, apa, baris mana, sebelum/sesudah), pemantau ketersediaan eksternal untuk `/api/kesehatan`, dan peringatan ke Super bila galat 5xx melewati ambang atau cron tarik/cadangan terlewat. Analitik first-party dan tanpa cookie pihak ketiga: **TERAPKAN** (sejalan dengan UU PDP).

### 5.3 Halaman Metode/keputusan sebagai transparansi operasional [RENCANA]
- Bukti: `blueprint-lengkap-neraca-papua.md:474-486` (Metode: definisi, empat jenis strip, aturan tidak menjumlah, tabel keputusan pengecualian, batas galat) dan `:587` (halaman "Metode -> Keputusan").
- Verdict METI: **SESUAIKAN**: halaman "Cara kami memverifikasi" publik, dibuat dari tabel `keputusan` dan aturan penolakan yang sama dengan yang dijalankan kode (satu sumber, bukan prosa yang disalin).

### 5.4 Pembingkaian dan istilah sensitif sebagai aturan editorial yang bisa dicek [RENCANA]
- Bukti: `blueprint-lengkap-neraca-papua.md:642-649` (kata tertentu hanya bila sumber resmi memakainya, dikutip dengan sumber).
- Verdict METI: **SESUAIKAN**: daftar kata terlarang/berkualifikasi untuk klaim kapasitas, investasi, dan penilaian pihak tertentu, diperiksa oleh skrip pada isian publik dan konten statis (peringatan bagi Admin, bukan penolakan otomatis).

---

## 6. Design system dan UI

R7 sudah memuat token dan komponen. Tambahan yang belum:

### 6.1 Token sebagai satu berkas CSS yang jadi sumber tunggal dan ditampilkan hidup [JALAN]
- Bukti: `situs/neraca-papua-theme.css` (2,5 KB) disalin ke data build (`situs/build.py:59`) dan dipamerkan di halaman `#desain` dengan tombol "Salin CSS tema" (`situs/template.html:1341`). `DESIGN.md:1-3`.
- Verdict METI: **TERAPKAN**: satu `tokens.css` dengan mode terang/gelap, halaman galeri komponen di rute internal (bukan produksi publik), dan uji yang mengecek tidak ada warna heksadesimal di luar berkas token.

### 6.2 Pola halaman dan aturan "kalimat temuan sebelum bukti" [JALAN di dokumen]
- Bukti: `DESIGN.md` bagian "Pola halaman" butir 1-5.
- Verdict METI: **SESUAIKAN**: ambil struktur (kepala, kalimat temuan, panel, sumber di kaki), buang selera spesifik pemilik lain (huruf sistem Apple, tembaga). Putuskan satu dokumen desain berotoritas; Neraca punya dua dokumen yang bertentangan (lihat 8.9).

### 6.3 Aksesibilitas dasar yang sudah ada [JALAN]
- Bukti: `:focus-visible` (`situs/template.html:78`), `prefers-reduced-motion` mematikan transisi (`:330`) dan simulasi graf (`:1032`), `aria-live` pada panel info (`:1087`), `aria-pressed` pada tab, `role="img"` + `aria-label` pada grafik (`:684`, `:711`, `:1320`), fokus ke tombol tutup laci (`:574`), Escape menutup laci (`:577`), `tabindex=0` + Enter pada titik peta (`:594-595`), mode gelap mengikuti sistem dengan tombol penimpa (`:33`, `:1343`, `:1359`).
- Verdict METI: **TERAPKAN** sebagai batas bawah, ditambah yang tidak ada: `lang` di `<html>` (dan berganti dengan bahasa), "lewati ke konten", jebakan fokus pada laci, dan padanan papan ketik/teks untuk graf (tabel tersembunyi atau daftar sisi). Perhatian khusus dwibahasa: `lang="id"`/`"en"` pada potongan teks yang bercampur, `hreflang`, dan format angka/tanggal per bahasa dari satu pembungkus `Intl`.

### 6.4 Perangkat bahasa: strip alasan dan "—" sebagai komponen [JALAN]
Sudah di R7 (`dash`, `val`). Tambahan METI: teks alasan ikut dikamuskan ID/EN karena itu bagian dari antarmuka kepercayaan. Verdict: **TERAPKAN**.

---

## 7. Tata kelola agent dan armada

### 7.1 Tidak ada konfigurasi agent di repo [ABSEN]
- Bukti: tidak ada `AGENTS.md`, `CLAUDE.md`, atau `.claude/`; `.claude/` bahkan diabaikan git (`.gitignore:3`), jadi ilmu agent tidak ikut repo. Orang lain atau agent berikutnya tidak mewarisi aturan apa pun.
- Verdict METI: **TERAPKAN lawannya**: `AGENTS.md` di akar yang diikuti SessionStart (sesuai standar pemilik), `.claude/` ikut repo (kecuali berkas lokal/rahasia), roster dengan model tertulis per agent. Sudah menjadi aturan global pemilik; Neraca adalah contoh mengapa.

### 7.2 Kerja paralel oleh banyak pengerja, dengan format keluaran seragam [JALAN, jejaknya terlihat]
- Praktik: riset dibagi per topik dan menghasilkan berkas bernomor/berpaket yang seragam: katalog A-D (`data/katalog_A_...D_...md`), ringkasan lintas dokumen A-D (`data/dokumen/doc_00_ringkasan_A..D.md`), dataset `01`-`06` masing-masing berpasangan `.csv` + `.md`. Tiap berkas memuat blok **"Aturan:"** di kepala (tanpa angka karangan, definisi `[CEK]`, "tidak dijumlahkan") dan tabel dengan kolom tetap (mis. katalog: No | Nama | Penyedia | URL | Format | Granularitas | Periode terbaru | Akses | Menteri).
- Bukti: `data/katalog_C_infrastruktur_energi.md:3-9`, `data/06_komoditas.md:4`; blueprint menyebut "para pengerja" yang menghasilkan CSV lalu dinormalisasi oleh satu skrip impor (`blueprint-lengkap-neraca-papua.md:505`).
- Kenapa penting: pengerja paralel bisa bekerja tanpa saling menebak bila kontrak keluarannya (kolom tetap + aturan) ditulis di muka.
- Verdict METI: **TERAPKAN**: untuk tiap pengerja data/riset (Sonnet), satu templat keluaran dengan blok aturan dan skema kolom tetap, dan **satu validator** yang menolak berkas bila kolom/enum tak sesuai (Neraca tidak punya validator; hasilnya ada di 8.1).

### 7.3 Pemeriksa angka (manusia + agent) sebagai peran terpisah dari pengerja [RENCANA]
- Bukti: `blueprint-lengkap-neraca-papua.md:587` ("Pemeriksa angka (manusia + agen) memberi keputusan ... dan tiap keputusan dicatat"); disebut sudah ada di proyek Posko Karhutla (`:610`, `:626`).
- Verdict METI: **TERAPKAN**: agent pemeriksa pola (Haiku) hanya membaca keluaran pengerja dan memeriksa terhadap validator + sampel sumber; pemeriksa tidak boleh menulis data. Keputusan tercatat di `keputusan`.

### 7.4 Kejujuran tentang batas alat baca [JALAN]
- Praktik: agent/peneliti mencatat bila isi dokumen primer hanya dibaca lewat ringkasan alat atau halaman diblokir, dan menurunkan tingkat bukti sesuai.
- Bukti: `data/04_jaringan.md:27`, `:55`; `data/05_wilayah_long.csv` baris 141-143 (diblokir anti-bot, dicatat sebagai `tidak_ada`).
- Verdict METI: **TERAPKAN** sebagai aturan agent: "bila tak bisa membuka dokumen primer, jangan naikkan tingkat bukti; tulis `cara_verifikasi` yang sebenarnya".

---

## 8. Kesalahan dan hutang yang JANGAN ditiru

Setiap butir: apa, bukti, dampak bagi METI, tindakan.

### 8.1 Gerbang sumber terlalu longgar dan tidak memvalidasi enum
- Apa: hanya memeriksa bahwa `sumber_url` tidak kosong dan bukan "—"/"-". Teks apa pun lolos ("belum ada", "lihat berita"); tidak ada pemeriksaan bahwa itu URL; `tingkat_bukti` tidak divalidasi.
- Bukti: `situs/build.py:47`. Hasil pembacaan data (hitungan sendiri atas semua CSV): `tingkat_bukti` memakai **empat kosakata**: `terkonfirmasi/kata_perusahaan/cuplikan/inferensi` (huruf kecil), `TERKONFIRMASI/...` (kapital, di jaringan), huruf `A_/B_/C_/D_...` dengan teks bebas di belakangnya (`C_osm_inferens...`, `B_berita (satu...`, `A_osm+B_berita`, `D_kandidat_bel...`), dan `primer/sekunder/klaim/tidak_ada` (wilayah, SDM, tenaga kerja). Normalisasi ditambal di tampilan (`situs/template.html:555-559`, `normBukti`) dengan tebakan: `A->TERKONFIRMASI`, `B->CUPLIKAN`, `C/D->INFERENSI`, sisanya `toUpperCase()`. Nilai `primer/sekunder/klaim` jatuh ke cabang `toUpperCase()` dan tampil sebagai lencana yang tak punya arti di `ARTI_BUKTI`.
- Dampak: skema bukti tidak bisa dipercaya dan tidak bisa difilter; lencana bisa tampil tanpa arti.
- Tindakan METI: enum tunggal di `CHECK` D1 (atau tabel referensi + FK), validasi di Worker, dan **penolakan** saat impor, bukan penambalan saat tampil. Uji: memasukkan nilai di luar enum harus gagal.

### 8.2 Filter sumber membuang baris "gap beralasan"
- Apa: baris yang sengaja mencatat "data tidak bisa diambil, ini alasannya" dibuang karena `sumber_url` "—".
- Bukti: `situs/build.py:47` vs `data/05_wilayah_long.csv` baris 141-143 (`tingkat_bukti=tidak_ada`); enam baris dibuang total (satu di tangki, lima di wilayah) oleh perhitungan di atas. Dua prinsip bertabrakan: "bersumber atau ditarik" (`README.md:32`) dan "strip selalu punya alasan" (`README.md:33`). Alasan tertulis hilang dari layar.
- Tindakan METI: pisahkan dua konsep di skema (3.2): `fakta` bersumber dan `celah` (indikator, entitas, `alasan_kosong`, `diminta_ke`, `tanggal_diminta`). Gerbang menolak fakta tanpa sumber tetapi **menerima celah** dengan alasan.

### 8.3 Pencocokan CSV rapuh: desimal, kunci, dan format bercampur
- Apa: koma desimal dalam string ("48,76%") bercampur titik pada kolom numerik; `—` sebagai null; `|` memisah banyak URL dalam satu sel; periode bebas teks.
- Bukti: `data/` (lihat R7 6.2 butir 7 untuk koma desimal); pemisah `|` dan `;` di `situs/template.html:564`; tidak ada skema atau tipe kolom di `build.py` (`baca()` mengembalikan semua nilai sebagai string, `:35`).
- Dampak: salah urai diam-diam, tidak ada tempat menolak.
- Tindakan METI: skema bertipe (zod-tanpa-dependensi, atau JSON Schema + validator kecil) per tabel, sumber banyak URL sebagai tabel anak `sumber`, bukan sel dengan pemisah.

### 8.4 Penarik menimpa data bagus dengan data kosong
- Apa: `tarik_firms.py` selalu menulis berkas keluaran, walau 0 baris atau satu sumber gagal; satu sumber gagal membatalkan seluruh proses dengan jejak tumpukan tanpa pemulihan; tidak ada percobaan ulang, tidak ada penulisan atomik, tidak ada pemeriksaan jumlah baris; `urlopen` tanpa `try`.
- Bukti: `situs/tarik_firms.py:39-40` (tanpa penanganan galat), `:55` (tulis tanpa syarat); tidak ada uji.
- Dampak: bertentangan dengan janji `blueprint-lengkap-neraca-papua.md:634` ("tidak pernah kosong diam-diam").
- Tindakan METI: lihat 3.8.

### 8.5 Artefak build terlacak di git
- Apa: `situs/neraca-papua.html` (1,6 MB) hasil build ikut commit, bersama JSON besar hasil tarikan (`firms_7h.json` 2,9 MB, `citra.json` 521 KB).
- Bukti: `git ls-files`; `README.md:11`.
- Dampak: diff tak terbaca, riwayat membengkak, tak jelas mana sumber/mana turunan.
- Tindakan METI: hanya sumber di git; artefak build ke direktori yang di-`.gitignore`; gambar/berkas besar di R2, bukan di repo. Sertakan `.gitignore` sejak hari pertama untuk `.dev.vars`, `.wrangler/`, `node_modules/`, `dist/`.

### 8.6 Build tidak deterministik
- Apa: tanggal `date.today()` masuk ke keluaran; urutan kunci JSON mengikuti sisipan; `read_text()` tanpa `encoding` mengikuti locale.
- Bukti: `situs/build.py:72`, `:54-59` (tanpa `encoding="utf-8"`; berbeda dari `baca()` di `:34`).
- Dampak: dua build dari commit yang sama berbeda; tidak bisa diverifikasi ulang; berisiko pada mesin ber-locale lain.
- Tindakan METI: seluruh pembacaan `utf-8`, tanggal berasal dari commit/berkas versi, bukan jam.

### 8.7 Konten XSS-rawan bila data berasal dari pihak lain
- Apa: keamanan hanya bertumpu pada ingatan menulis `esc()` di 30 titik `innerHTML` (2.1). Tidak ada CSP sebagai lapisan kedua.
- Dampak: untuk Neraca data berasal dari riset sendiri sehingga risikonya rendah. Untuk METI isian anggota membuatnya kritis.
- Tindakan METI: lihat 2.1-2.2.

### 8.8 Interaksi berat tanpa pemisahan urgent/deferred
- Apa: `setupSearch` menyaring seluruh indeks dan menimpa `innerHTML` tiap ketukan tanpa debounce; grafik jaringan dan kuadran dirender ulang sinkron pada tiap klik chip/dropdown.
- Bukti: `situs/template.html:754-769` (event `input` -> `filter` -> `innerHTML`), R7 6.2 butir 4 untuk graf/kuadran. Indeks hanya ±400 entri sehingga terasa baik; skala METI akan jauh lebih besar.
- Tindakan METI: pencarian lewat API dengan debounce 150-250 ms + `AbortController`, daftar hasil dirender bertahap; chrome kontrol berubah seketika, subtree berat ditunda (aturan INP pemilik).

### 8.9 Dua dokumen desain bertentangan, tanpa wasit
- Apa: `DESIGN.md` (huruf sistem Apple, tembaga untuk data mineral, aksi hitam) dan `blueprint-lengkap-neraca-papua.md` §3 (§1.2 di `:47-52` menyebut satu aksen tembaga; tipografi dan token di §3, `:108-163`, berbeda dari DESIGN.md). Tidak ada hirarki otoritas dokumen. Rincian di R7 3.5.
- Tindakan METI: satu dokumen desain berotoritas + daftar keputusan bernomor (sudah dirancang di paket SIPPA). Hindari duplikasi nilai token di prosa; token hanya di `tokens.css`.

### 8.10 Janji tanpa kepemilikan: "diuji", "dicadangkan", "RLS" hanya kalimat
- Apa: `blueprint-lengkap-neraca-papua.md:632-640` menulis keandalan dan keamanan sebagai kalimat tanpa pemilik, perintah, ataupun hasil yang diharapkan. `:592` menjanjikan RLS di Postgres yang tak pernah dibangun, dan D1 tidak punya padanannya.
- Dampak: dokumen terbaca lengkap padahal tidak ada gerbangnya (prinsip pemilik: aturan tanpa gerbang mekanis dianggap belum jadi).
- Tindakan METI: tiap butir keandalan/keamanan di PRD mendapat satu perintah bukti di `RENCANA-UJI.md` (sudah dikerjakan di paket SIPPA), dan satu tiket. Butir tanpa perintah bukti ditandai `[BELUM BERGERBANG]`.

### 8.11 Fitur tiruan yang tampak nyata
- Apa: formulir "Permintaan data" di halaman Desain hanya membuka pesan, tidak mengirim apa pun; bagian "Ask" (`#askForm`) hanya menyalin teks ke pencarian.
- Bukti: `situs/template.html:1342`, `:696`.
- Dampak: pengguna mengira permintaannya diterima. Untuk METI (formulir pendaftaran/koreksi) ini kehilangan data tanpa jejak.
- Tindakan METI: tidak ada formulir tanpa tujuan; tiap formulir menulis ke tabel `permintaan`, mengembalikan nomor rujukan, dan gagal secara terlihat.

---

## 9. Urutan penerapan yang disarankan untuk METI

1. Skema D1 dengan `CHECK` enum (tingkat bukti, status, `alasan_kosong`, skema URL) + impor yang menolak + laporan (3.1, 3.2, 8.1-8.3).
2. Modul hak tunggal + pembungkus kueri + uji matriks peran pada D1 sungguhan (2.5).
3. Pembungkus respons: header keamanan, CSP, batas laju/ukuran, bentuk galat dwibahasa (2.2, 5.1).
4. Tabel `audit`, `keputusan`, `*_riwayat`, `arsip` (R2 + sha256) (3.4-3.6, 5.2).
5. Cadangan ekspor R2 + latihan pemulihan + Time Travel (3.7).
6. Gerbang rilis "wajib walau MVP" + paritas ID/EN + larangan `innerHTML`/`env.DB.prepare` di luar pembungkus (4.3, 2.1).
7. `AGENTS.md` + roster agent + templat keluaran pengerja + validator (7.1-7.3).
