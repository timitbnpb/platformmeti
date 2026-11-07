# Ilmu selera-angka

> Kelas: pemeriksa · Model: haiku · Definisi: `.claude/agents/selera-angka.md`
> Dibaca SEBELUM kerja (`node scripts/agents/ilmu.mjs baca selera-angka`). Kasus baru
> ditambah SESUDAH kerja lewat `node scripts/agents/ilmu.mjs kasus selera-angka "..."`.

## Peta berkas & tabel

Berkas yang kamu periksa (read-only): layar dan potret yang menampilkan angka: `public/index.html` + `.js` (JM-E01), `perusahaan.*` (E02), `p.html` (E03 profil), `peta.*` (E04), `metode.*` (E05), halaman F2 (`rantai`, `pembiaya`, `bumn`, `data-center`, `desa`, `wilayah`, `kebijakan`, `cerita`), `public/direktori.js`, dan `public/i18n.js` (`angka()`, `tanggal()`). Potret yang disuapkan: `potret/publik/*.json` (`sensus.json`, `meta.json`, `cerita_<slug>.json`).

Komponen DS (DESIGN-SYSTEM §6): `.jm-angka` kartu angka kunci (§6.2), `.jm-est` dan `.jm-hipotesis` dan `.jm-yakin` (§6.9), `.jm-jawab` (§6.3), `.jm-hitung` Cara menghitung (§6.4), `.jm-kutip` (§6.5), `.jm-fakta` (§6.8), `.jm-kuadran` (§6.11), `.jm-risiko` (§6.12).

Kolom sumber angka: `fakta.nilai_num` + `satuan` + `per_tanggal` + `sumber_id` (-> `sumber.url`, `sumber.diperiksa`), `fakta.est`, `fakta.rumus`, `fakta.alasan_kosong` (`tidak-dipublikasikan, belum-ada, menunggu-data, belum-dicari`), `fakta.tingkat_bukti`.

## Aturan & invarian

1. **Tiap angka punya sumber dan tanggal periksa** (KP D5): tautan atau tooltip ke `sumber.url` dan tanggal. Tidak ada angka tanpa asal. Tiap total menyebut penyebut jujur "n dari N baris" (DS §6.2; ALG §9.2).
2. **Angka turunan berpil `EST`** dengan tooltip dan tautan Metode; `EST` tidak pernah di angka yang diumumkan sumber; `EST` tidak dijumlah dengan angka diumumkan dalam satu total (ALG §9.1). Kunci `output_idr` dan `skor_mandat` wajib EST.
3. **Skor, kuadran, kesiapan, matriks risiko berpil `Hipotesis`** dan tautan "Cara menghitung" terbuka sampai ALG menyatakan lolos (KP C-16; DS §6.9). Skor keyakinan tampil dengan label Tinggi (>= 0,75), Sedang (0,40 sampai 0,74), Rendah, dan SATU kalimat alasan; ALG menang bila beda.
4. **Format hanya lewat `angka()`, `tanggal()`, `rupiah()`, `kapasitas()`, `persen()`, `skor()`** di `public/i18n.js` (ALG §10; KP D17; DT §8.4 butir 3). ID: titik ribuan, koma desimal (`1.234.567,5`); EN: sebaliknya. `toLocaleString`, `Intl.NumberFormat` langsung, atau `toFixed` di luar `i18n.js` = temuan. Tidak ada titik tengah (U+00B7) atau em dash di teks (`gerbang-teks`).
5. **Kosong bukan nol:** `null/undefined/NaN` tampil `-` (strip) dengan `title` "Tidak ada angka kredibel, kami tidak menebak" dan satu dari empat alasan kosong. `0` hanya untuk nol yang benar-benar tercatat. Kalimat Jawaban singkat membuang klausa kosong, tidak pernah memuat "null", "NaN", "?" (ALG §9.7).
6. **Penanda angka** (ALG §9.2): `EST`, `min` (batas bawah, kunci `_min`), `di induk` (jangan dijumlah ulang), `-`, `beku <tanggal>`, `Hipotesis`. `_min` tidak berdampingan dengan kunci biasa dalam satu total.
7. **Tanggal beku:** "Cara mengutip" memakai tanggal potret (`meta.json`), bukan tanggal buka (DS §6.5; ALG §9.6). Cerita data menampilkan `beku <tanggal>`.
8. **Potensi, terpasang, rencana tidak digabung jadi satu angka;** proyek `diumumkan` bukan MW terpasang; nilai berbeda antar sumber tampil sebagai rentang bersumber (ALG §9.5, §4.3).
9. **Data contoh (fixture uji, seed D1 lokal) dihitung konsisten** (KPV §9): berakhiran "(contoh)", domain `example.org`. Tidak ada tombol dummy (KP K15).
10. **Poin 1001startup.id:** angka yang berasal dari sana berlabel "via 1001startup.id" + tanggal ambil; estimasi, valuasi, skor mereka tidak tampil sebagai angka platform (KP D15).
11. **Angka orang:** tidak ada angka pribadi (usia, tanggal lahir); kontak tidak tampil di lapis publik.
12. **Bukan tugasmu:** menilai kebenaran data sumber atau rumus (itu `validasi-model`), menyunting, atau mengurus kinerja klik (`inp-reviewer`).

## Ranjau yang pernah meledak

- **Strip menelan alasan:** filter sumber membuang baris "tidak ada data" sehingga alasan tertulis tak sampai layar (R12 §8.2). Tanda `-` tanpa alasan = temuan.
- **Nol palsu** dari `NULL` yang diformat (R12 §3.2; R11 §3.9): 155 kali lipat dari satuan tertukar dan tampil percaya diri. Periksa `angka(null)` memberi `-`, bukan `0`.
- **Koma desimal ID bercampur titik** (R12 §8.3; R11 §3.4 butir 2): harga seperseribu tanpa galat. Cari string angka mentah di data layar yang tak melewati `angka()`.
- **Fitur tiruan yang tampak nyata** (R12 §8.11): formulir atau kartu yang tampak berfungsi tetapi tak mengirim apa pun.
- **Umur data satu-satunya tanda** (R11 §3.6): panen gagal tampak sama dengan sukses. Layar menampilkan umur potret; angka tanpa tanggal = temuan.
- **Angka basi yang saling bertentangan di dokumen** (R11 §8.4): angka yang bisa dihasilkan mesin sebaiknya di-generate, bukan diketik. Jumlah entitas di layar harus dari `meta.json`, bukan teks tertanam.
- **Total tanpa penyebut atau agregat EST tak berlabel** (ALG §9.1 butir 3): kuadran, kesiapan, kapasitas grup adalah EST dan Hipotesis walau tidak disimpan sebagai fakta.
- **Pil Hipotesis hilang lebih dulu dari ujinya:** pil hanya boleh hilang bila ALG menyatakan lulus kalibrasi (§4.7).

## Gerbang yang menghakimi

- `tests/gerbang-teks.test.mjs`: merah bila ada U+00B7 atau U+2014 di `public/**` dan `docs/perencanaan/*.md`, `toLocaleString` di luar `public/i18n.js`, `lorem`/`TODO` terlihat, sisa `BNPB/BPBD/karhutla/DIBI` di `direktori.*`.
- `tests/gerbang-i18n.test.mjs`: kunci `id.json` = `en.json`; `t("...")` ada di kamus; teks Indonesia tertanam di JS layar baru.
- `tests/algo.test.mjs` keluarga F: `angka(1234567.5)` = `1.234.567,5` (ID) dan `1,234,567.5` (EN); `angka(0)` = `0`; `angka(null)` = `-`.
- `tests/layar/*.spec.mjs` (JM-H02) pada 1440 dan 390 px; potret fixture `_en` kosong menampilkan versi ID berpil "ID" (RU §2.8).
- `tests/potret.test.mjs`: `meta.json` `tanpa_sumber = 0`.
- Laporan: satu baris per temuan `berkas:baris`, aturan di atas yang dilanggar, kutip singkat; vonis `bersih` atau `temuan` dicatat lewat `ilmu.mjs catat selera-angka <berkas> ...`. Rumus keliru dilempar ke `validasi-model`; privasi ke `security-reviewer`.

## Kasus

Belum ada kasus. Tambahkan lewat ilmu.mjs kasus.
