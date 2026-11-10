# RENCANA-UJI penyempurnaan November 2026

Otoritas: `KEPUTUSAN-METI` K21 sampai K26, D21 sampai D23, C-23, C-26 sampai C-28; AGENTS.md; `docs/perencanaan/TIKET.md` §1 (definisi selesai). Dokumen ini mengatur **cara membuktikan** tiket di `TIKET.md` folder ini. Aturan global: tiap perilaku di luar TypeScript atau JS (trigger, CHECK, RLS tiruan, fungsi SQL, route handler, alur lintas tabel) wajib punya uji yang benar-benar menjalankannya. Mock tidak dihitung sebagai bukti. Gerbang, ambang, dan uji tidak boleh dilemahkan untuk meloloskan kerja sendiri.

## 1. Lapisan uji

| Lapis | Alat dan lokasi | Menguji | Boleh mock? |
| --- | --- | --- | --- |
| L1 Unit murni | `node:test`, `tests/*.test.mjs` | fungsi murni tanpa I/O: rumus skor, penyaring, perender markdown, parser jadwal | Tidak perlu |
| L2 Integrasi D1 lokal | `tests/_bantu.mjs` (`buatEnv()` via `wrangler getPlatformProxy`, semua `migrations/*.sql` diterapkan) | CHECK, trigger, indeks unik, FTS5, `hak.js`, route handler, alur lintas tabel | **Tidak**; D1 lokal sungguhan |
| L3 Rute HTTP | `worker.fetch` dengan `env` dari L2 | pengecualian D19, sesi, CSRF, kode status, peran benar dan salah | Tidak untuk D1 dan `hak.js`; boleh mengganti jaringan luar (fetch sumber panen, Workers AI) |
| L4 Pipeline data | `tests/potret.test.mjs`, fixture di `tests/fixture/` | panen, sambung, hubung, skor, potret per lapis, pemindai data pribadi | Jaringan diganti fixture berkas; tidak ada panggilan internet di CI |
| L5 Bot dan workflow | `tests/bot-*.test.mjs` + gerbang statis YAML | pustaka panen, robots, jeda, status sumber, isi workflow | Server HTTP lokal sebagai sumber palsu; bukan mock fungsi |
| L6 Gerbang statis | `tests/gerbang-*.test.mjs` | aturan lintas berkas: token, i18n, tema kembar, tautan dua arah, model agent | Tidak |
| L7 Layar | tangkapan Playwright via `tests/layar/`, hasil di `tests/layar/tangkapan/` (gitignored) | tampilan 1440 dan 390, terang dan gelap, ID dan EN, keadaan Memuat/Kosong/Galat | Data dari D1 lokal berisi seed uji |
| L8 Asap live | `npm run uji:live` | tayang menurut AGENTS.md (setelah push ke `main`) | Tidak |

Aturan umum:
- Uji bermock **tidak** dihitung sebagai bukti untuk CHECK, trigger, RLS, fungsi SQL, atau rute. Boleh ada sebagai pelengkap L1, bukan pengganti L2.
- Data contoh fiktif hanya fixture uji dan seed D1 lokal (K15). Tidak ada rute atau tombol untuk mengisinya di aplikasi; gerbang `05-dummy-jejak` tetap hijau.
- Tiap uji gagal-sebelum: untuk perbaikan bug (JM-S01, S02), uji ditulis lebih dulu, terbukti gagal pada kode lama, lalu hijau (perintah dan keluaran disebut di laporan).
- `npm run uji` harus lulus tanpa jaringan.
- Pengerja tiket bukan pengulasnya; pengulas melapor, tidak memperbaiki.

## 2. Definisi selesai

Selesai = perintah bukti keluar 0 **dan** pemeriksa tanpa temuan tinggi (TIKET §1). Untuk layar ditambah §8 di bawah (dilihat, bukan hanya diuji) dan review terpisah `peninjau-bersih` pada konteks bersih. Laporan agent bukan bukti; sesi induk memeriksa keluaran perintah sendiri.

## 3. Kriteria terima per tiket

Perintah dasar: `npm run uji`. Kolom "Tambahan" adalah bukti spesifik di atasnya. "D1" = uji L2.

### Seri S

| Tiket | Kriteria terima | Tambahan |
| --- | --- | --- |
| S01 | Tiap perbaikan punya uji yang gagal sebelum perbaikan; dua perbaikan jalur data lewat D1 lokal. | D1; pemeriksa security-reviewer, guard-api, hak-auditor |
| S02 | Tiap temuan terbukti punya uji gagal-sebelum; `data/cari/hukum.json` ada dan terbaca oleh pencarian global; `siapTautan("provinsi")` terpanggil di semua halaman yang perlu. | penelusuran lokal: 0 galat konsol, 0 aset 404 (skrip telusur memuat seluruh halaman pada daftar rute) |
| S03 | Tiap dugaan punya status terbukti atau ditutup beserta alasan tertulis di tiket; yang terbukti dipindah ke S02 dengan uji. | - |
| S04 | Tidak ada URL atau judul bersumber Antara di keluaran panen dan `data/**` turunan. | gerbang `gerbang-tanpa-antara` (cari domain dan nama sumber di data dan di kode panen); uji sumber palsu yang berisi Antara harus dibuang |
| S05 | Satu sumber daftar proyek; `proyek_terpadu.json` dan `proyek.json` tidak lagi dua sumber; layar menjelaskan selisih kapasitas terlacak terhadap angka nasional dengan rumus dan "n dari N". | uji potret (jumlah, tanpa duplikat kunci entitas); tangkapan layar |
| S06 | Label internal tidak ada di `public/data/teks_*.json`; blok kosong tersembunyi. | gerbang teks internal (daftar frasa terlarang); uji layar: blok dengan data kosong tidak dirender |
| S07 | `/api/riwayat` ada, lewat `hak.js`, riwayat hanya lapis pengurus ke atas. | D1: peran selain pengurus, admin, super DITOLAK; entri di `cakupan.json` |
| S08 | `cakupan.json` memuat seluruh rute `/api/` (sekitar 200); gerbang gagal bila ada rute tak terdaftar atau terdaftar ke berkas uji yang tidak ada; tiap rute punya satu uji peran benar dan satu peran salah. | §5 |
| S09 | Tidak ada `.ak-dummy` dan `jm.dummy.*` di dokumen perencanaan. | cari teks; gerbang dummy-layar tetap hijau |
| S10 | Prompt yang dikirim ke model memuat batas data jelas dan instruksi sistem, tanpa alat dan tanpa sesi; fixture instruksi jahat tidak memengaruhi jawaban; jawaban tanpa sitasi dibuang; keluaran dirender sebagai teks. | fixture di `tests/fixture/tanya/`; penyuntik model diganti pembaca prompt (§6.5); security-reviewer |
| S11 | Tiap jenis `MATRIKS` punya baris di dokumen hak (12 jenis lama ditulis); gerbang gagal pada jenis yatim dan baris tanpa jenis; tiap baris punya uji peran salah. | fixture jenis yatim memerahkan gerbang; `tests/gerbang-matriks-sinkron.test.mjs`; hak-auditor |

### Seri T

| Tiket | Kriteria terima | Tambahan |
| --- | --- | --- |
| T01 | `data/sumber_jadwal.json` valid terhadap skema; tiap sumber punya frekuensi, sinyal perubahan, status dari enum; pustaka menolak jalur yang dilarang robots, berhenti di 403 dan 429, menjaga jeda 2 detik per host. | §6: uji dengan server HTTP lokal |
| T02 sampai T05 | YAML valid, `permissions: {contents: read}` di level workflow, job `panen` dan `uji` hanya baca, tulis hanya di job `bot_pr`, tanpa `pull_request_target`, aksi dipin SHA, hanya `schedule` dan `workflow_dispatch`, `concurrency` per jadwal; `workflow_dispatch` lulus untuk tiap jadwal. | gerbang statis workflow (§6.3); lari manual oleh pemilik dicatat di tiket |
| T06 | Satu perintah rantai panen sampai potret; satu sumber gagal tidak menggagalkan putaran; tiga gagal berturut membuka isu; hasil ke cabang `data-bot` sebagai PR; 65 skrip yatim terpasang atau tercatat pensiun. | uji rantai dengan fixture; `higiene-repo` |
| T07 | Migrasi baru idempoten dan jalan dua kali; denyut tulis ke D1; jumlah subrequest per putaran di bawah batas; cron tetap maksimal 5. | D1; uji pembagi putaran (jumlah sumber / ukuran putaran, cakupan penuh dalam N putaran); perf-reviewer |
| T08 | Panel menampilkan 178 dataset; batas basi mengikuti frekuensi sumber; status enum. | uji ambang (tepat di batas, satu di bawah, satu di atas); tangkapan §8 |

### Seri U

| Tiket | Kriteria terima | Tambahan |
| --- | --- | --- |
| U01 | 622 berkas `hukum/<jenis>/<tahun>/<id>.md` valid terhadap skema frontmatter; tanpa data pribadi; jalur berkas dari pola ketat. | `scripts/hukum/ekspor_md.mjs --cek`; selftest pemindai data pribadi (kasus positif dan negatif); higiene-repo |
| U02, U03 | Laporan cakupan per target (ada, tidak tersedia + alasan); tidak ada naskah karangan. | uji: tiap target kosong punya alasan atau berkas |
| U04 | 51 pindaian punya teks atau alasan gagal; 125 gagal punya status baru; mutu tercatat di frontmatter. | uji mutu (nilai dalam rentang, wajib ada untuk OCR) |
| U05 | Nomor dan judul dari halaman pertama dibandingkan katalog; beda masuk antrean kurator, bukan menimpa. | uji fixture PDF dua kasus (cocok, beda) |
| U06 | Relasi mencabut, diubah, mengingat dua arah; status berlaku per tanggal benar pada tanggal batas. | uji acuan: tiga aturan berantai, status pada hari pencabutan |
| U07 | Tiap regulasi menunjukkan entitas terdampak dengan dasar pasal dan tingkat bukti; tiap entitas menunjukkan aturan yang mengikat; cakupan proyek ber-regulasi mencapai target ALGORITMA. | uji acuan (fixture berjawaban benar); gerbang tautan (L08); validasi-model |

### Seri L

| Tiket | Kriteria terima | Tambahan |
| --- | --- | --- |
| L01 sampai L06 | Tiap tautan punya sumber dan tingkat bukti; yang ragu ke antrean; cakupan sesudah >= garis dasar. | laporan cakupan sebelum-sesudah tersimpan di `tests/fixture/cakupan-tautan.json` (garis dasar) |
| L07 | Indeks memuat jenis baru (riset, kalender, pusat studi, lowongan, hukum); tiap hasil bisa dibuka. | uji: setiap entri indeks menunjuk rute yang ada; ukuran indeks di bawah batas |
| L08 | Rujukan satu arah menggagalkan uji; cakupan turun dari garis dasar menggagalkan uji. | §7 |

### Seri W

| Tiket | Kriteria terima | Tambahan |
| --- | --- | --- |
| W01 | Migrasi idempoten; semua akses lewat `hak.js` dengan `cakupan_prov`; wilayah lain DITOLAK. | D1 (§4.3); migrasi-idempoten, hak-auditor |
| W02 | Ketua Wilayah mengelola kegiatan, agenda, notulen, foto, berita, anggota provinsinya; Pusat melihat semua; peran lain ditolak. | D1 + rute (§4.3); tangkapan §8; inp-reviewer |
| W03 | Halaman Wilayah menampilkan kegiatan, rapor, orang, organisasi, proyek provinsi; `orang.meti_wilayah` terisi dari sumber. | uji potret (jumlah dan sumber); tangkapan |

### Seri N

| Tiket | Kriteria terima | Tambahan |
| --- | --- | --- |
| N01 | Status tamu dan tier terpasang; migrasi jalan dua kali; akun lama otomatis mendapat nilai bawaan yang benar; tier tidak bisa dinaikkan sendiri. | D1; migrasi-idempoten, hak-auditor, security-reviewer |
| N02 | Tiap dataset terkunci tidak ada di respons tier rendah (cek isi respons, bukan hanya status); cache tidak melayani lapis lebih tinggi. | D1 + rute: matriks dataset x tier (§4.4) |
| N03 | Tiap fitur terkunci menampilkan manfaat dan cara naik; ajakan tidak memuat data terkunci. | i18n-guard, selera-angka; tangkapan; uji: isi HTML ajakan tidak memuat nilai dari data terkunci |

### Seri M

Tiap tiket M: rute baru terdaftar di `cakupan.json`, tiap tabel dan sel hak diuji tolak (§4), keadaan Memuat/Kosong/Galat dilihat (§8), tidak ada fitur di luar PRD. Bukti per program:

| Tiket | Bukti khusus |
| --- | --- |
| M01 | Alur penerbitan beku: hanya status `terbit` yang tampil; lembar data bersitasi; unduh `/data` menurut tier (peran salah DITOLAK). |
| M02 | Status aturan menurut U07; `posisi_meti` draf tidak terlihat peran rendah; satu suara per akun per isu (constraint unik diuji ganda). |
| M03 | Aduan: pelapor hanya melihat miliknya; pihak teradu bisa menjawab; putusan append-only (trigger menolak ubah); QR di KTA terverifikasi. |
| M04 | Skor kesiapan sesuai uji acuan ALGORITMA (Hipotesis tampil sampai C-16); ruang data privat menolak peran selain pemilik dan yang ditugaskan; jejak tiap baca. |
| M05 | Kalkulator komunal hitungan sesuai uji acuan; angka bersumber dan EST. |
| M06 | Lencana: token acak tidak berurutan; dicabut berubah status; kuota ujian; QR terbaca (§8); `GET /api/sertifikat/v/:token` tanpa sesi 401 dan dengan sesi login 200 (C-27, bukan pengecualian D19). |
| M07 | Kuota per tier ditegakkan trigger; kontak tersembunyi sebelum diterima (isi respons diperiksa); permintaan ke diri sendiri ditolak. |
| M08 | Papan 38 provinsi: angka sama dengan potret; tanpa duplikasi dengan `meti-wilayah`. |
| M09 | Produk terverifikasi: hanya yang lolos verifikasi tampil; data TKDN bersumber. |
| M10 | Pembanding kebijakan: sumber dan tanggal tiap nilai. |
| M11 | Magang ke `kerja`: tautan dua arah; hibah dan aset sesuai peran. |
| M12 | Profil anonim: peran selain pemilik tidak melihat identitas (isi respons diperiksa). |

### Seri Z

| Tiket | Kriteria terima |
| --- | --- |
| Z01 | Buku Pegangan dan papan `docs/perencanaan/TIKET.md` selaras hasil; angka tiket dan keputusan cocok dengan berkas sumber (cek skrip). |
| Z02 | `peninjau-bersih` atas tiket selesai; security-reviewer, perf-reviewer, inp-reviewer, i18n-guard, selera-angka, higiene-repo tanpa temuan tinggi; `npm run uji` hijau; telusur 1440 dan 390; `npm run uji:live` setelah deploy. |

## 4. Uji D1 lokal (bukan mock)

### 4.1 Pola dasar

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { buatEnv } from "./_bantu.mjs";

test("CHECK menolak status di luar enum", async (t) => {
  const { env, tutup } = await buatEnv();       // D1 lokal + semua migrasi
  t.after(tutup);
  await assert.rejects(env.DB.prepare("INSERT INTO ... VALUES (?)").bind("ngawur").run(), /CHECK|constraint/i);
});
```

Aturan: pasang `t.after(tutup)`; satu `buatEnv()` per berkas uji bila isolasi tidak diperlukan; jangan membuat tabel di dalam uji (hanya lewat migrasi); jangan menimpa `env.DB` dengan objek tiruan.

### 4.2 Wajib untuk setiap CHECK dan trigger baru

Untuk **tiap** `CHECK`, `UNIQUE`, `FOREIGN KEY`, dan `TRIGGER` pada migrasi baru, satu uji pasangan:
1. **Yang benar diterima**: baris valid masuk dan terbaca kembali.
2. **Yang salah DITOLAK**: nilai di luar enum, kolom wajib kosong, duplikat kunci unik, rujukan yatim, ubah atau hapus baris append-only, lompatan status yang dilarang trigger. Diperiksa bahwa galat benar berasal dari aturan itu (pesan atau kode), dan baris **tidak** tersimpan.
3. **Jalan dua kali**: terapkan migrasi dua kali pada DB yang sama tanpa galat dan tanpa baris dobel (idempoten). Migrasi yang sudah jalan tidak disunting (`migrasi-beku.test.mjs` menjaga).
4. **Tabel kunci hak**: tabel baru yang menyimpan data berperan didaftarkan di `MATRIKS` dan `jenisData()`; uji `hak.test.mjs` memeriksa bahwa tabel tak terdaftar tidak bisa dibaca lewat `baca()`.

Daftar CHECK dan trigger wajib uji untuk gelombang ini (nama tabel mengikuti DT):
- enum status sumber `ok|basi|gagal|blokir|perlu_kunci`; frekuensi; enum tingkat bukti; enum status berlaku regulasi.
- `wil_kegiatan`, `wil_foto`, `wil_dokumen`, `wil_berita`, `wil_pengurus`: `kode_prov` wajib; tahap draf ke terbit; foto tanpa `persetujuan_foto = 1` ditolak; `wil_foto.kode_prov` harus sama dengan kegiatan; baris provinsi A tidak bisa dipindah ke provinsi B oleh pelaku wilayah A.
- `akun_tier`: `tier` dari enum kode DT (`tamu`, `pelajar`, `individu`, `ngo`, `usaha_kecil`, `usaha_besar`, `utama`); `keanggotaan = 'tamu'` jika dan hanya jika `tier = 'tamu'`; tamu tidak bisa jadi tier tanpa jejak; akun anggota baru otomatis `tamu` (pemicu `akun_tier_baru`).
- `temu_permintaan` dan `temu_kuota`: kuota (trigger), tidak ke diri sendiri, tidak dobel untuk pasangan yang sama dalam periode.
- `advokasi_suara`: satu suara per akun per isu (`UNIQUE(butir_id, akun_id)`).
- `pemasang_putusan`, `pemasang_aduan` (jawaban dan putusan), jejak: append-only (UPDATE dan DELETE ditolak trigger); `rapor_edisi` berstatus `beku` atau `terbit` tidak dapat diubah isinya.
- `pemasang_aduan`: `sapu` menghapus aduan 24 bulan sesudah putusan (jam disuntikkan; tepat di batas, satu di bawah, satu di atas) dan tidak menghapus aduan yang belum diputus (C-26).
- `sertifikat`: dua kunci pada penerbitan (pencatat, yaitu asesor KR, tidak sama dengan pengesah PG); pencabutan wajib beralasan; `pemasang_putusan`: pemutus bukan pencatat.
- `hukum_relasi_pasal`: `pasal` wajib dan `jenis` dari enum; `dampak_regulasi.json` (potret, bukan tabel D1): tautan tanpa dasar pasal dan sumber ditolak gerbang potret.
- `hukum_md`, `hukum_kurasi`, `tautan_antrean`, `sumber_denyut`, `denyut_putaran`: enum status dan CHECK sesuai DESAIN-TEKNIS M.2 sampai M.4 (termasuk `status = 'blokir'` mensyaratkan `aktif = 0`).
- Seri M (0043 sampai 0050): tiap CHECK dan trigger yang ditetapkan pengerja `migrasi` per tiket (`rapor_edisi`, `advokasi_butir`, `kelompok_*`, `pemasang`, `pipeline_*`, `ujian_daftar`, `sertifikat`, `temu_*`, `produk_daftar`, `pembeli_*`) memakai pola pasangan 1 sampai 3 di atas.

### 4.3 Sel hak: yang salah DITOLAK

Untuk tiap sel `-` di KEAMANAN-PRIVASI §2 dan tiap batas "prov", "diri", "putus", satu uji lewat `hak.js` (`baca`, `tulis`) dan satu uji lewat rute HTTP (L3):
- Peran tanpa hak: hasil `403` untuk sesi dan `401` tanpa sesi; tidak ada baris di tabel sesudahnya.
- Wilayah A menulis ke wilayah B: DITOLAK; jumlah baris tidak berubah; pelaku wilayah A membaca draf wilayah B: tidak ada di hasil.
- Pelaku wilayah tanpa `cakupan_prov`: semua ditolak (bukan semua diizinkan).
- Id dari badan permintaan yang menunjuk akun lain ("diri"): diabaikan atau ditolak.
- Kolom tak dikenal, badan lebih dari 64 KB, bukan JSON: ditolak sebelum menyentuh D1.
- Origin salah pada tulis: ditolak.
Daftar uji tolak per NAMA TABEL (nama mengikuti DESAIN-TEKNIS; sel mengikuti DT X.2 dan KEAMANAN-PRIVASI §2). Untuk tiap baris: tiap peran di kolom "Baca ditolak" menerima 403 (sesi) atau 401 (tanpa sesi) pada `baca`; tiap peran di kolom "Tulis ditolak" menerima penolakan pada `tambah`, `ubah`, `hapus` dan jumlah baris tidak berubah. PB (tanpa sesi) selalu 401. TM adalah akun `anggota` bertier `tamu`. Sel berklausa (`prov`, `diri`, `terbit`, `ruang`, `anonim`, `disahkan`) memperoleh uji klausa tambahan (§4.3 di atas).

| Tabel | Baca ditolak | Tulis ditolak |
| --- | --- | --- |
| `wil_kegiatan` | PB | TM, AN, PG, KR |
| `wil_foto` | PB | TM, AN, PG, KR |
| `wil_dokumen` | PB, TM, AN | TM, AN, PG, KR |
| `wil_berita` | PB | TM, AN, PG, KR |
| `wil_pengurus` | PB | TM, AN, PG, KR |
| `anggota_prov` | PB, TM, AN, KR | TM, AN, PG, KR, WL, AD, SA |
| `akun_tier` | PB | TM, AN, PG, KR, WL |
| `sumber_denyut` | PB, TM, AN, PG, WL | TM, AN, PG, KR, WL |
| `denyut_putaran` | PB, TM, AN, PG, KR, WL | TM, AN, PG, KR, WL, AD, SA |
| `tautan_antrean` | PB, TM, AN, WL | TM, AN, PG, WL |
| `hukum_kurasi` | PB, TM, AN, WL | TM, AN, PG, WL |
| `hukum_md` | PB, TM | TM, AN, PG, KR, WL, AD, SA |
| `hukum_relasi_pasal` | PB, TM | TM, AN, PG, KR, WL, AD, SA |
| `rapor_edisi` | PB | TM, AN, WL |
| `rapor_unduh` | PB, TM | TM, AN, PG, KR, WL, AD, SA |
| `advokasi_butir` | PB | TM, AN, KR, WL |
| `advokasi_suara` | PB, TM | TM |
| `advokasi_komentar` | PB | TM |
| `kelompok_kerja` | PB, TM | TM, AN, KR, WL |
| `kelompok_anggota` | PB, TM | TM, AN, KR, WL |
| `kelompok_tugas` | PB, TM | TM |
| `pemasang` | PB | TM, KR, WL |
| `pemasang_putusan` | PB, TM, KR, WL | TM, AN, KR, WL, AD |
| `pemasang_aduan` | PB | AD |
| `pipeline_ajuan` | PB, TM | TM, KR |
| `pipeline_ruang` | PB, TM, KR, WL | TM, PG, KR, WL, AD, SA |
| `pipeline_ruang_akses` | PB, TM, AN, KR, WL | TM, AN, PG, KR, WL |
| `kompetensi_jalur` | PB | TM, AN, PG, WL |
| `ujian_daftar` | PB, TM | TM, PG |
| `sertifikat` | PB, TM | TM, AN, WL |
| `temu_profil` | PB, TM | TM, AN, KR, WL |
| `temu_permintaan` | PB, TM | TM |
| `temu_kuota` | PB, TM | TM, AN, PG, KR, WL, AD, SA |
| `produk_daftar` | PB | TM, PG, WL |
| `pembeli_profil` | PB, TM, KR, WL | TM, PG, KR, WL, AD, SA |
| `pembeli_cocok` | PB, TM, KR, WL | TM, AN, PG, KR, WL, AD, SA |

Tambahan di luar tabel: `GET /api/admin/kesegaran` (PG, AN, TM, WL ditolak), `GET /api/sertifikat/v/:token` (tanpa sesi 401; semua peran login 200 dengan token sah; C-27), `GET /api/bot/tautan-putus` (§6.2a).

Uji matriks dibangkitkan dari `MATRIKS` (loop peran x tabel x aksi) dan dibandingkan dengan fixture `tests/fixtures/matriks.json` agar perubahan sel diam-diam gagal terdeteksi.

### 4.4 Tier (N02)

Matriks dataset x tier (kode DT: `tamu`, `pelajar`, `individu`, `ngo`, `usaha_kecil`, `usaha_besar`, `utama`, dan peran pengurus ke atas; pemetaan penyebutan K24 di GLOSARIUM §5): untuk tiap dataset terkunci, respons tier rendah **tidak memuat** bidang terkunci (diperiksa pada isi JSON, bukan status saja); respons tier tinggi memuat. Uji kedua tier berurutan pada Worker yang sama untuk menangkap cache lintas tier. Setelah tier diturunkan, permintaan berikut tidak mendapat data lapis tinggi. Kontak korporat `organisasi.kontak` tetap ada di respons `tamu` (C-23; uji kebalikan agar tidak ikut terkunci). Tenggang 30 hari (C-28): tanda `tanpa_lunas` pada hari ke-30 masih `tierDasar(kategori)` (`pelajar` bagi mahasiswa, `individu` bagi lainnya), bukan tier pilihan, pada hari ke-31 `tamu` tanpa data terhapus, dan lunas di dalam tenggang memberi tier berbayar (jam disuntikkan).

### 4.5 Alur lintas tabel

Tiap alur yang menyentuh lebih dari satu tabel memakai satu uji ujung ke ujung di D1 lokal: ajuan proyek ke skor ke antrean pengurus; aduan ke jawaban ke putusan ke status pemasang; permintaan temu ke diterima ke kontak terbuka; penerbitan sertifikat ke lencana ke verifikasi ke pencabutan; panen ke antrean ragu ke putusan kurator ke tautan terbit ke tampil dua arah.

### 4.6 Waktu dan acak

Uji yang bergantung pada waktu (status berlaku per tanggal, batas basi, kedaluwarsa temu, umur token) menyuntikkan jam lewat parameter fungsi, bukan `Date.now()` langsung, dan menguji tepat di batas, satu di bawah, satu di atas.

## 5. Memperluas `cakupan.json` ke sekitar 200 rute (JM-S08)

Keadaan: `tests/e2e/cakupan.json` memuat 23 rute dalam bentuk `{"rute":{"diuji":{"METODE /api/jalur": "tests/berkas.test.mjs"}}}`. Tabel rute di `src/worker.js` dan modul `src/*.js` memakai kunci `"METODE /api/..."` dan himpunan `API_PUBLIK`, sehingga rute bisa diekstrak mesin.

Langkah:
1. **Ekstraktor** `scripts/uji/daftar_rute.mjs`: membaca tabel rute dari modul `src/**` (impor langsung bila diekspor, atau urai kunci `"GET /api/..."`), mengeluarkan daftar `METODE jalur` terurut beserta berkas sumber. Hasil dibandingkan dengan `cakupan.json`; hitungan harus sekitar 200 dan dicatat di laporan tiket.
2. **Bagian baru di `cakupan.json`**: `rute.diuji` tetap; tambah `rute.dikecualikan` (rute yang sengaja tanpa uji, dengan `alasan` tertulis, mis. webhook pihak ketiga yang diuji di berkas lain) dan `rute.peran` (untuk tiap rute: `benar` dan `salah`, yaitu peran yang diuji lolos dan peran yang diuji ditolak).
3. **Gerbang** `tests/gerbang-rute.test.mjs`: gagal bila (a) ada rute di kode tak ada di `diuji` atau `dikecualikan`; (b) ada entri di `cakupan.json` yang rutenya tidak ada lagi di kode; (c) berkas uji yang ditunjuk tidak ada; (d) berkas uji tidak menyebut jalur rutenya (pencarian string sederhana, supaya entri tidak asal); (e) entri `dikecualikan` tanpa alasan; (f) rute tulis tanpa peran `salah`.
4. **Uji per kelompok rute**, bukan per rute dalam berkas terpisah. Satu berkas per modul (`tests/api-<modul>.test.mjs`) yang memakai pembantu `tests/_rute.mjs`:
   ```js
   // tests/_rute.mjs: memanggil worker.fetch dengan sesi peran tertentu (akun dibuat lewat hak.js di D1 lokal)
   export async function panggil(env, { metode, jalur, peran, badan, origin }) { /* -> { status, json } */ }
   export function ujiPeran(t, env, rute, { benar, salah }) { /* loop: benar -> 2xx, salah -> 401/403 */ }
   ```
   Tiap rute: satu panggilan peran benar (status dan bentuk badan), satu peran salah (ditolak, tanpa membocorkan data), dan untuk tulis: satu Origin salah dan satu badan di luar skema.
5. **Urutan pengerjaan** (bukan sekaligus, agar tinjauan kecil): (i) rute berperan sensitif lebih dulu (akun, sesi, admin, pendaftaran, naskah, konten, iuran); (ii) rute data baca terkunci tier; (iii) rute publik pengecualian D19; (iv) sisanya. Tiap gelombang menaikkan hitungan di `cakupan.json` dan gerbang tetap hijau.
6. **Rute baru gelombang ini** (wilayah, tier, pipeline, temu, lencana, advokasi, pengaduan, kesegaran) didaftarkan **pada tiket yang membuatnya**, bukan menunggu S08 (aturan TIKET §1).
7. **Garis dasar**: jumlah rute terdaftar dicatat di `tests/fixture/cakupan-garis-dasar.json`; gerbang gagal bila jumlahnya turun.
8. Perbaikan nama: `gerbang-ilmu-agent` menyebut `tests/cakupan.json`, lokasi sebenarnya `tests/e2e/cakupan.json` (lihat Catatan).

## 6. Uji bot, workflow, dan gerbang tautan

### 6.1 Bot dengan fixture (L4, L5)

Prinsip: tidak ada internet di CI. Sumber diganti **server HTTP lokal** yang dijalankan uji (`http.createServer` pada port acak) dan melayani fixture dari `tests/fixture/panen/`; pustaka panen diberi daftar host yang diizinkan hanya `127.0.0.1`.

Kasus wajib:
| Kasus | Harapan |
| --- | --- |
| `robots.txt` melarang jalur | pustaka tidak meminta jalur itu; status sumber `blokir` atau dilewati; tercatat |
| `Crawl-delay` besar | jeda mengikuti nilai yang lebih besar dari 2 detik |
| jeda | selisih waktu antar permintaan ke host sama >= 2 detik (jam disuntikkan; uji tidak tidur sungguhan) |
| respons 403 dan 429 | berhenti untuk host itu pada putaran ini, tidak mencoba ulang agresif, status `blokir` |
| UA | semua permintaan membawa UA jujur METI |
| tanpa login | sumber yang butuh login tidak dipanen; kunci kosong menghasilkan status `perlu_kunci` dan dilewati |
| judul atau URL Antara | dibuang sebelum tersimpan (S04) |
| HTML jahat | `<script>`, `onerror`, `javascript:` pada judul dan isi: keluaran tidak memuatnya |
| respons terlalu besar, JSON rusak, skema salah | ditolak dan dihitung; putaran lanjut ke sumber lain |
| satu sumber gagal | putaran selesai, sumber lain tetap menulis |
| tiga gagal berturut | pembuat isu dipanggil (disuntik pengganti, diperiksa argumen) |
| baris tanpa sumber | dibuang |
| data pribadi (surel, telepon, NIK) dalam deskripsi | dibuang oleh pemindai |
| idempoten | panen dua kali dari fixture sama menghasilkan keluaran identik |
| selisih PR | ringkasan selisih (jumlah baru, berubah, hilang) benar terhadap dua keluaran fixture |

### 6.2 Denyut Worker (T07)

D1 lokal + fetch sumber palsu: HEAD dengan ETag sama menghasilkan "tidak berubah"; ETag beda menghasilkan "berubah" dan baris tersimpan; pembagian putaran menutup seluruh sumber dalam N putaran dan jumlah subrequest per putaran di bawah batas yang dikonfigurasi (uji menghitung panggilan fetch).

### 6.2a Rute bot `GET /api/bot/tautan-putus` (D23)

`tests/bot-rute.test.mjs` di D1 lokal dengan `BOT_RAHASIA` uji pada `env` (L3, `worker.fetch`; bukan mock `hak.js`):
1. Tanpa header `Authorization`: 401, tanpa isi data.
2. Bearer salah (termasuk awalan benar tetapi panjang berbeda, dan kosong): 403, pesan galat sama dengan kasus 1 selain kodenya.
3. Bearer benar: 200, hanya baris diputus, kolom terbatas (tanpa `catatan` dan `diputus_oleh`).
4. Metode selain GET: ditolak; tidak ada jalur tulis.
5. Batas laju: permintaan melewati ambang dari satu IP hash dijawab 429; kegagalan otentikasi dihitung terhadap batas yang sama.
6. Jejak: tiap panggilan (200, 401, 403, 429) menulis satu baris `jejak`; baris tidak memuat bearer maupun `BOT_RAHASIA`.
7. Banding waktu-tetap: uji unit atas fungsi pembanding (hasil sama untuk panjang beda dan awalan beda; tidak memakai `===` pada rahasia). Pemindai statis menolak `===` atau `==` yang membandingkan `BOT_RAHASIA`.
8. Rute terdaftar di `cakupan.json` dengan peran `benar` (bearer) dan `salah` (sesi admin tanpa bearer = 401).

### 6.3 Gerbang statis workflow

`tests/gerbang-workflow.test.mjs` membaca `.github/workflows/*.yml` dan gagal bila: `permissions` level workflow tidak persis `contents: read`; `write-all`; `contents: write`, `pull-requests: write`, atau `issues: write` di luar job `bot_pr`; job `panen` atau `uji` memegang izin tulis; job `bot_pr` memegang rahasia selain `GITHUB_TOKEN`; ada `pull_request_target`; pemicu selain `schedule` dan `workflow_dispatch` pada panen-*; `uses:` tanpa SHA 40 karakter pada aksi pihak ketiga; ada `${{ github.event.inputs.* }}` langsung di `run:`; rahasia produksi Cloudflare ada di workflow panen; jadwal cron lebih dari yang diizinkan; tidak ada `concurrency`. Berkas `uji.yml` yang ada tetap lolos.

### 6.4 Gerbang tautan dua arah (L08)

`tests/gerbang-tautan.test.mjs` membaca potret `public/data/**` dan:
1. Untuk tiap rujukan A menunjuk B, B menunjuk A (atau tercatat di daftar "satu arah yang sah" dengan alasan).
2. Tiap rujukan menunjuk entitas yang ada (tidak yatim); tiap tautan punya `sumber_url`, `tanggal_periksa`, `tingkat_bukti`.
3. Cakupan tiap hubungan (proyek ke organisasi, ke regulasi, ke berita; pendanaan ke proyek; berita ke entitas; kode kabupaten pada proyek; pakar ke riset) >= garis dasar di `tests/fixture/cakupan-tautan.json`. Garis dasar hanya boleh naik; mengubahnya turun butuh keputusan pemilik tertulis di PR.
4. Dataset baru yang tidak didaftarkan pada skrip hubung menggagalkan uji.
Uji gerbang sendiri: fixture kecil dengan satu rujukan satu arah harus menggagalkan, fixture dua arah lolos.

### 6.5 Gerbang lain gelombang ini

- `gerbang-tanpa-antara`: tidak ada sumber Antara di `data/**`, `public/data/**`, dan skrip panen.
- Teks internal: frasa terlarang ("Butuh unduhan pemilik" dan kawan-kawan) tidak ada di `public/data/teks_*.json`.
- Tanya AI: fixture potongan berisi instruksi jahat ("abaikan perintah sebelumnya", permintaan membocorkan rahasia); penyuntik model diganti pembaca yang memeriksa **prompt** yang dikirim (batas data jelas, instruksi sistem ada, tidak ada alat) dan jawaban tanpa sitasi dibuang.
- Penyisipan: gerbang statis mencari `innerHTML`, `insertAdjacentHTML`, dan `document.write` pada data tak lewat `esc()` di `public/**`.
- Ekspor regulasi: skema frontmatter, pola nama berkas, pemindai data pribadi (selftest dua arah).
- Dummy: `05-dummy-jejak` dan `gerbang-dummy-layar` tetap hijau; tidak ada kunci `jm.dummy.*`.

## 7. Uji data dan angka

- Potret: `tests/potret.test.mjs` tetap; tambah kasus untuk lapisan tier (N02): lapis lebih tinggi tidak bocor ke lapis lebih rendah, ukuran maksimal 2 MB, susut >20 persen ditolak.
- Angka tampil: `selera-angka` memeriksa sumber, tanggal, label EST, format `id-ID` dan `en`; uji unit pada `angka()` dengan nilai ekstrem (0, null, 1e9, negatif, NaN).
- Rumus (skor, kesiapan, dampak): uji acuan berfixture dengan jawaban yang dihitung tangan dan dicantumkan di fixture dengan sumbernya; `validasi-model` memeriksa. Skor yang belum lolos C-16 tetap tampil dengan pil Hipotesis (uji layar).

## 8. Uji layar (L7)

Untuk tiap tiket layar (W02, W03, T08, U07, N03, seri M):
- **Lebar**: 1440 dan 390 px (cek tambahan 1280). Tanpa scroll horizontal, target sentuh >= 44 px, tidak ada elemen dempet, kartu tinggi sama, label KPI satu baris.
- **Tema**: terang dan gelap, tanpa kilatan tema salah saat muat; dua blok gelap `tema.css` identik (`gerbang-tema-kembar`).
- **Bahasa**: ID dan EN; kunci `id.json` dan `en.json` setara (`gerbang-i18n`); tidak ada teks tertanam di JS; panjang teks EN tidak merusak tata letak.
- **Keadaan**: Memuat, Kosong, Galat (kartu utama menampilkan galat, bagian opsional disembunyikan, D21), Terkunci, Luring; dilihat satu per satu dengan data D1 lokal yang dikosongkan atau dirusak sungguhan (tidak ada tombol dummy).
- **Data terburuk**: nama 120 karakter tanpa spasi, nol baris, 1 baris, 10.000 baris, angka ekstrem, aksara non-Latin, provinsi dengan nama terpanjang.
- **Fokus dan tombol papan ketik**: urutan tab logis, `:focus-visible` terlihat, dialog menjebak fokus dan menutup dengan Esc, kembali ke pemicu.
- **Aksesibilitas**: WCAG AA (kontras teks, `aria-sort`, `role=alert` untuk galat utama, label tombol ikon); QR lencana terbaca pemindai pada kedua tema.
- **Grafik**: hover atau sentuh memunculkan garis pemandu dan tooltip; klik membuka detail di tengah; padanan tabel ada; `prefers-reduced-motion` mematikan gerak.
- **INP**: `inp-reviewer` untuk handler klik, tab, paginasi, sort; tidak ada klik yang membekukan layar (chrome urgent, subtree berat lewat `nanti()`).
- **Telusur lokal**: skrip membuka seluruh halaman dari daftar rute, mencatat konsol dan jaringan: 0 galat, 0 aset 404.
- **Tangkapan**: disimpan di `tests/layar/tangkapan/` (gitignored); induk memeriksa tangkapan sendiri, lalu `peninjau-bersih` menilai tanpa riwayat pengerjaan.
- Setelah deploy: `npm run uji:live` sebelum dinyatakan tayang.

## 9. Pemeriksa per permukaan (ringkas)

| Permukaan | Pemeriksa |
| --- | --- |
| `src/hak.js`, rute `/api/*` | security-reviewer, guard-api, hak-auditor |
| `migrations/**` | migrasi-idempoten |
| `.github/workflows/**`, `scripts/agents/**` | security-reviewer, penulis-gerbang |
| potret, daftar tolak, skor | security-reviewer, validasi-model |
| angka tampil | selera-angka |
| klik, tab, sort | inp-reviewer |
| teks UI | i18n-guard |
| query dan ukuran potret, denyut | perf-reviewer |
| aturan atau rute baru | penulis-gerbang |
| sebelum commit besar | higiene-repo |
| tiket selesai | peninjau-bersih |

Penulis kode bukan pengulasnya. Pengulas melapor, tidak memperbaiki. Sub-agent tidak commit, push, atau deploy. Migrasi D1 produksi dan unggah R2 produksi dijalankan pemilik.

## 10. Hal yang tidak diuji otomatis (dicatat, bukan diabaikan)

- Putaran workflow sungguhan di GitHub (pemilik menjalankan `workflow_dispatch`, hasil dicatat di tiket).
- Perilaku situs sumber nyata terhadap robot (berubah-ubah); pustaka diuji lewat server palsu, bukan sumber asli.
- Pengaturan GitHub (proteksi cabang `main`, secrets) dan Cloudflare produksi.
- Keputusan isi, bukan bentuk (mis. kewajaran skor Hipotesis): ditinjau kurator dan pemilik.

## Catatan untuk induk

1. **Lokasi `cakupan.json`.** Berkas ada di `tests/e2e/cakupan.json`; `tests/gerbang-ilmu-agent.test.mjs` (baris sekitar 101) dan `TIKET.md` lama menulis `tests/cakupan.json`. Perlu diseragamkan (S08 atau Z01). TIKET folder ini menulis `tests/e2e/cakupan.json`, benar.
2. **Jumlah rute.** "Sekitar 200" berasal dari TIKET JM-S08; hitungan sungguhan baru diketahui setelah ekstraktor §5 dijalankan. Pencarian kasar string `/api/` unik di `src/` menghasilkan jauh lebih sedikit (belum memperhitungkan tabel rute yang disusun dinamis); angka final ditetapkan tiket S08.
3. **Mock.** Beberapa uji lama memakai pembantu tanpa D1; saya tidak menilainya di sini. Aturan §1 hanya berlaku untuk uji baru dan untuk uji yang dipakai sebagai bukti tiket.
4. **Sasaran waktu uji.** Memperluas ke ~200 rute menambah waktu `npm run uji`; belum ada anggaran waktu tertulis. Usul: satu `buatEnv()` per berkas dan pembagian berkas lewat `node --test` bawaan; anggaran menunggu pengukuran.
5. **Playwright.** Uji layar L7 diasumsikan berjalan di mesin kerja (tidak di CI); `tests/layar/` hanya berisi folder tangkapan. Bila pemilik ingin L7 di CI, itu tiket tambahan.
6. **Uji akses tier vs cache tepi.** Uji §4.4 hanya menjangkau cache di Worker lokal; perilaku cache tepi Cloudflare produksi hanya terverifikasi lewat `uji:live`.
7. **Ambang cakupan proyek ber-regulasi (U07)** ada di ALGORITMA (tidak saya baca); kriteria U07 di sini merujuknya, bukan menetapkannya.
