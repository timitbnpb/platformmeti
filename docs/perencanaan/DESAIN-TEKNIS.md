# DESAIN-TEKNIS: Platform Jaringan METI

Posisi otoritas: sesudah `KEPUTUSAN-METI`, `GRAND-DESIGN`, `RISET`, `PRD`, `ALUR`, `ALGORITMA`, `DESIGN-SYSTEM`; sebelum `KEAMANAN-PRIVASI`, `RENCANA-UJI`, `TIKET` dalam rantai di `KEPUTUSAN-METI`. Versi 1, 7 Nov 2026.

DT menjawab "bagaimana persisnya"; TIKET menjawab "siapa dan kapan". Penyimpangan dari PRD atau dokumen di atasnya dicatat sebagai ADR (§9) dan ditanyakan ke pemilik. Fitur, tabel, atau rute yang tidak tertulis di paket ini tidak dibuat; bila dua dokumen bertentangan, pengerja berhenti dan bertanya.

Rujukan kode asal diperiksa pada `main` repo poskokarhutla, 7 Nov 2026 (commit `ea7dabf96`), lewat `riset/R1-DIREKTORI-ASAL.md` §9 dan pembukaan langsung `scripts/akademisi/hubung.mjs`. Singkatan: KP = KEPUTUSAN-METI, GD = GRAND-DESIGN, KPV = KEAMANAN-PRIVASI, ALG = ALGORITMA, RU = RENCANA-UJI, DS = DESIGN-SYSTEM, Asal = repo poskokarhutla.

Lambang hak (sama dengan kolom KPV §1): PB publik tanpa login, AN anggota, PG pengurus dan Sekretariat, KR kurator, WL wilayah (dibatasi `cakupan_prov`), AD admin, SA super admin. Himpunan: LOGIN = AN PG KR WL AD SA; STAF = PG KR AD SA; KURASI = KR AD SA; ADM = AD SA.

## 1. Arsitektur

```
 PIPELINE (GitHub Actions)                 WORKER (Cloudflare, satu Worker)              LAYAR (public/, vanilla JS)
 -----------------------------             ----------------------------------            ---------------------------
 scripts/panen/*.py   (per sumber R8)      src/worker.js   router objek                  index.html  sensus, beranda
   robots.txt dicek, jeda >= 2 dtk           "METODE /path/:id" + tabel halaman         perusahaan.html, p.html, peta.html
   -> R2 panen/<tgl>/<sumber>.json          src/hak.js      SATU-SATUNYA pintu D1       rantai/pembiaya/bumn/... (F2)
 kurasi_baca.mjs (SELECT D1, baca saja)     src/sesi.js     login, cookie, laju         direktori.html  9 tab, port akademisi
   -> panen/kurasi.json                     src/sandi.js    PBKDF2                      admin.html      akun, kurasi, jejak
 sambung.mjs   gabung panen + kurasi        src/akun.js     admin akun                  masuk/aktivasi/ganti-sandi
 hubung.mjs    dedup, graf, strategis       src/kurasi.js   entitas, fakta, ikatan      i18n/id.json, en.json
 potret.mjs    skor, sensus, per lapis      src/koreksi.js, riwayat.js, dummy.js        taksonomi.js, algo.js (modul tunggal
 jaga_unggah.mjs  gerbang sebelum unggah    src/potret.js   R2 per lapis                  rumus, dipakai Worker + Node + layar)
   -> R2 potret/{publik,anggota,pengurus}/  src/direktori.js  port akademisi.js        
                                            src/util.js     json, gagal, cacheTepi ...
                                                  |                 |
                          D1 `jaringan-meti` <----+                 +----> R2 `jaringan-meti` (binding BERKAS)
                          akun, sesi, jejak, entitas, fakta,                  potret/, gambar/, ringkasan/,
                          ikatan, sumber, alias, label, koreksi,              cadangan/, panen/, privat/
                          riwayat, laju, entitas_cari (FTS5)
                                                  +----> Workers AI (binding AI): ringkasan abstrak riset
```

Prinsip yang menentukan bentuknya:

1. **Layar membaca JSON potret dari R2, D1 hanya untuk tulis dan hak** (KP D2). Kuota baca D1 Free 5 juta baris per hari pernah menjatuhkan situs asal; hitungan berat (graf, skor, sensus) dikerjakan pipeline dan hasilnya jadi JSON (R6 §4.1).
2. **D1 hanya menyimpan tulisan manusia dan hak**: akun, sesi, kurasi, koreksi, riwayat, jejak (ADR-08). Data panen otomatis berada di R2 `panen/` dan digabung dengan kurasi saat potret dibangun; kunci penggabung adalah `entitas.kunci` (ALG §1). Akibatnya pipeline tidak pernah menulis ke D1 (KPV §2.9 dijawab di ADR-08).
3. **Satu pintu D1** `src/hak.js` (KP D7, §5). Gerbang memindai seluruh `src/**`.
4. **Satu modul rumus** `public/algo.js` dan `public/taksonomi.js`: ES module yang dimuat Worker, Node (pipeline dan uji), dan layar. Tidak ada rumus ganda di Python; Python hanya memanen (ADR-03 menjelaskan pemuatan tanpa build step).
5. **Tanpa build step dan tanpa framework** (KP D4). Pustaka luar hanya dari CDN ber-SRI yang terdaftar di CSP (KPV §8).

Satu Worker, satu cron (`0 18 * * *`, sapu), tiga workflow terjadwal di Actions; total jadwal 4 dari batas 5.

## 2. Berkas

### 2.1 Disalin dari asal

Kelas: **G** generik, salin apa adanya; **A** salin lalu ganti titik domain (`R1 §9.4`); **K** spesifik kebencanaan atau BNPB, ditulis ulang atau dibuang. Kolom tiket menunjuk TIKET.

**Layar**

| Path asal | Kelas | Path baru | Tiket |
| --- | --- | --- | --- |
| `public/akademisi.html` | A | `public/direktori.html` | JM-C02 |
| `public/akademisi.js` (3.961 baris) | A | `public/direktori.js` | JM-C02, JM-C03 |
| `public/akademisi.css` (638 kelas `.ak-*`) | A | `public/direktori.css` | JM-C02 (ADR-05) |
| `public/akademisi_tema.js` | G | `public/tema.js` | JM-C01 |
| `public/fungsi_direktori.js` | A | `public/fungsi_direktori.js` | JM-C02 |
| `public/inti/tema.css` | G | `public/inti/tema.css` (token Midnight Energy) | JM-C01 |
| `public/inti/kepala.css`, `gaya.css` | G | `public/inti/kepala.css`, `gaya.css` | JM-C01 |
| `public/inti/kepala.js` | K | `public/inti/kepala.js` (ditulis ulang: menu METI, tombol ID/EN, masuk/keluar) | JM-C01, JM-C06 |
| `public/bencana.json` | K | dibuang | JM-C02 |
| `public/img/logo.svg` | A | `public/img/meti-putih.svg` | JM-C01 |
| `public/geo/provinsi.json`, `public/geo/kabupaten/<kode>.json` | A | sama (batas administratif, bukan data orang) | JM-C02 |
| `public/lambang/kabkota.json`, `public/data/luas_resmi.json` | A | dibuang dari F0 (lisensi lambang belum dicek) | JM-C02 |
| `public/_headers` | A | `public/_headers` (CSP menurut KPV §8) | JM-A05 |

**Worker**

| Path asal | Kelas | Path baru | Tiket |
| --- | --- | --- | --- |
| `src/worker.js` (hanya potongan `json`, `gagal`, `bacaBody`, `cacheTepi`, `ipHash`, `acak`, `sha`) | K | `src/util.js` (memutus impor sirkular asal) | JM-A04 |
| `src/worker.js` (pola router objek, tabel halaman baris 700, pengalih baris 741, penjaga halaman ~884) | K | `src/worker.js` baru | JM-A05 |
| `src/akademisi.js` (410 baris, `RUTE_AKADEMISI`) | A | `src/direktori.js` (`RUTE_DIREKTORI`) | JM-C04 |
| `src/staf.js` (sesi, `stafOK`, `stafPeran`, daftar) | A | dipecah: `src/sesi.js`, `src/akun.js` | JM-B03, JM-B05 |
| `src/posko.js` (`superOK`, `modOK`, `tx`, `RE_EMAIL`) | K | dilebur ke `src/hak.js` dan `src/util.js` (`RE_EMAIL`) | JM-B04 |
| `src/bnpb.js` (`laju`, `lajuIP`) | K | fungsi `hak.sistem.lajuHit` (UPSERT satu tulis, bukan baca-lalu-tulis) | JM-B03 |
| `src/admin_halaman.js`, `statistik.js`, `instansi.js` | K | dibuang; `/admin` ditulis baru | JM-B05 |

**D1**

| Asal | Kelas | Baru | Catatan |
| --- | --- | --- | --- |
| `migrations/0030_staf.sql`, `0085`, `0099`, `0104` | A | `0001_akun.sql` | `nip` -> tanpa; `unit` -> tanpa; `wilayah` JSON -> `cakupan_prov`; sandi `sha256(garam+sandi)` -> PBKDF2 (ADR-04); peran daftar baru |
| tabel sesi staf | A | `sesi` di `0001_akun.sql` | hanya hash token |
| `migrations/0087_akademisi_riwayat.sql` | A | `0005_riwayat.sql` | `kejadian_id` -> `kegiatan_ref`; `jenis` diganti |
| `laju_bnpb` (0022) | G | `0006_laju.sql` | jendela tetap + UPSERT |
| jejak admin (`jejakStmt`) | A | `0002_jejak.sql` | append-only lewat trigger |

**Pipeline**

| Path asal | Kelas | Path baru | Tiket |
| --- | --- | --- | --- |
| `scripts/akademisi/hubung.mjs` (`norm`, `inti`, `indeks`, `cari`, `strategis`, `hubung`) | A | `scripts/direktori/hubung.mjs` | JM-D10 |
| `scripts/akademisi/lembaga_gabung.mjs` | A | `scripts/direktori/lembaga_gabung.mjs` | JM-D10 |
| `scripts/akademisi/sambung_panen.mjs` (81 KB) | K | `scripts/direktori/sambung.mjs` (ditulis ulang; pola `kunciKab`, `lembagaBaru`, `proyekBaru` diambil) | JM-D10 |
| `scripts/akademisi/perbarui.py` | A | `scripts/panen/openalex.py` | JM-D03 |
| `scripts/akademisi/uji_perbarui.py` | G | `tests/panen/uji_openalex.py` | JM-D03 |
| `pemutakhiran/mutakhir.py` | G | `scripts/panen/mutakhir.py` | JM-D03 |
| `pemutakhiran/berita_rss.py` | A | tidak dibawa; F10 memakai API metiires.or.id (`scripts/panen/sinkron_meti.py`) | JM-F10 |
| `pemutakhiran/rayap.py`, `inti.py`, `uji_inti.py` | G | `scripts/panen/rayap.py`, `inti.py`, `tests/panen/uji_inti.py` | JM-D03 |
| `pemutakhiran/jaga_unggah.mjs` | G | `scripts/direktori/jaga_unggah.mjs` (ambang susut 20%, TIKET JM-D02; asal 5%) | JM-D02 |
| `pemutakhiran/panen_proyek.py` | A | `scripts/panen/wb_proyek.py` (World Bank Projects, IATI) | JM-D05 |
| `panen_sentinel.py`, `panen_tesis.py` | K, G | tidak dibawa (tidak ada tiket) | |
| `.github/workflows/direktori-bulanan.yml`, `akademisi.yml` | A | `.github/workflows/panen-bulanan.yml` | JM-A02, JM-D03 |

**Uji**

| Path asal | Kelas | Path baru | Tiket |
| --- | --- | --- | --- |
| `tests/agen/hubung.test.mjs` | A | `tests/hubung.test.mjs` | JM-D10 |
| `tests/agen/direktori-layar.test.mjs` | A | `tests/direktori-layar.test.mjs` | JM-C07 |
| `tests/agen/direktori-seg`, `-klik`, `-versi` | G | `tests/direktori-seg.test.mjs`, `-klik`, `-versi` | JM-C07 |
| `tests/agen/saring-bencana`, `tingkat-penerima`, `cocok-kejadian`, `analisa-keahlian` | A | `tests/saring-sektor.test.mjs` dan setara | JM-C07 |
| `tests/agen/lembaga-gabung.test.mjs` | A | `tests/lembaga-gabung.test.mjs` | JM-C07 |
| `tests/agen/gerbang-headers.test.mjs` | A | `tests/gerbang-headers.test.mjs` | JM-A05 |
| `tests/warga/akademisi_peran`, `_koreksi`, `_riwayat`, `_ringkasan`, `_terdekat`, `_gambar` | A | `tests/rute/direktori-*.test.mjs`; `_peran` diganti `tests/hak.test.mjs` | JM-B04, JM-C04 |
| `tests/e2e/05-dummy-jejak.sql` | A | `tests/e2e/05-dummy-jejak.sql` | JM-C07 |

Catatan pemuatan skrip di HTML: `taksonomi.js` dan `algo.js` adalah ES module yang menempelkan dirinya ke `window.JM`; `direktori.js` (IIFE klasik hasil port) dimuat dengan `defer` sesudahnya. Modul dan skrip `defer` dijalankan menurut urutan dokumen, jadi `window.JM` sudah ada saat `direktori.js` mulai.

### 2.2 Baru

| Path | Isi | Tiket |
| --- | --- | --- |
| `wrangler.jsonc`, `package.json`, `.gitignore`, `.dev.vars.example` | konfigurasi (potongan di §8.6) | JM-A02 |
| `src/hak.js` | RLS: `MATRIKS`, `boleh`, `baca`, `tulis`, `hak.sistem.*` | JM-B04 |
| `src/sandi.js` | `hashSandi`, `cocokSandi` (PBKDF2) | JM-B02 |
| `src/sesi.js` | `POST /api/masuk`, `/api/keluar`, `GET /api/saya`, cookie, CSRF | JM-B03 |
| `src/akun.js` | `/api/admin/akun*`, aktivasi, ganti sandi | JM-B05, JM-B07 |
| `src/kurasi.js` | entitas, fakta, ikatan, sumber, impor, gabung, hapus permanen | JM-D01, JM-E06 |
| `src/koreksi.js`, `src/riwayat.js` | koreksi, riwayat | JM-E06, JM-F09 |
| `src/potret.js` | baca R2 per lapis, gabung profil, cache | JM-D12 |
| `src/dummy.js` | isi dan hapus baris dummy (hanya SA) | JM-C05 |
| `src/status.js` | `GET /api/status` | JM-H04 |
| `src/direktori.js` | rute port (karya, riset, gambar, data, terdekat, ringkasan) | JM-C04 |
| `src/sapu.js` | handler `scheduled` (sesi, laju, tautan kedaluwarsa) | JM-B03 |
| `public/taksonomi.js`, `public/algo.js` | modul rumus tunggal (ALG) | JM-D13 |
| `public/i18n.js`, `public/i18n/id.json`, `en.json` | `t(kunci)`, `angka()`, `tanggal()` | JM-C06 |
| `public/masuk.html`, `aktivasi.html`, `ganti-sandi.html`, `masuk.js` | login | JM-B06 |
| `public/index.html`, `perusahaan.html`, `p.html`, `peta.html`, `metode.html` (+ `.js`, `.css` per halaman, kelas `.jm-*`) | sensus F1 | JM-E01 sampai JM-E05 |
| `public/rantai.html`, `pembiaya.html`, `bumn.html`, `data-center.html`, `desa.html`, `wilayah.html`, `kebijakan.html`, `cerita.html` | halaman F2 | JM-F01 sampai JM-F08 |
| `public/admin.html`, `admin.js`, `admin.css` | akun, kurasi, koreksi, jejak | JM-B05, JM-B07, JM-E06 |
| `scripts/panen/*.py` (per sumber, §7) | panen | JM-D03 sampai JM-D09, JM-F10 |
| `scripts/direktori/kurasi_baca.mjs`, `potret.mjs`, `cerita.mjs` | baca D1, bangun potret, bekukan cerita | JM-D12, JM-F08 |
| `scripts/mesin/buat_super.mjs` | mencetak SQL INSERT akun super pertama; sandi dibaca dari env atau prompt, tidak disimpan | JM-B05 (klarifikasi, §9 butir 4) |
| `data/cerita/<slug>.json` | teks cerita data tulisan kurator (tanpa data pribadi) | JM-F08 |
| `tests/**`, `tests/cakupan.json`, `tests/fixtures/acuan.json`, `tests/fixtures/matriks.json` | RU | JM-C07, JM-H01, JM-H02 |
| `.github/workflows/uji.yml`, `panen-bulanan.yml`, `panen-mingguan.yml`, `potret.yml` | CI dan jadwal (§7.3) | JM-A02 |

### 2.3 Agent

Roster `scripts/agents/roster.json` dan `.claude/agents/*.md` (JM-A01), tiap entri berisi `model:`.

| Agent | Model | Berkas milik | Pemeriksa |
| --- | --- | --- | --- |
| `worker` | sonnet | `src/**`, `migrations/**` | `guard-api`, `security-reviewer`, `migrasi-idempoten` |
| `layar` | sonnet | `public/**` | `selera-angka`, `inp-reviewer` |
| `pipa` | sonnet | `scripts/**`, `.github/workflows/panen-*.yml`, `potret.yml` | `validasi-model` (skor), `security-reviewer` (panen) |
| `mekanik` | sonnet | `package.json`, `wrangler.jsonc`, `.github/workflows/uji.yml`, `scripts/agents/**` | `higiene-repo` |
| `gerbang` | sonnet | `tests/**` | `penulis-gerbang` memeriksa cakupan |
| `guard-api`, `migrasi-idempoten`, `selera-angka` | haiku | tidak menulis | pola tertulis |
| `security-reviewer`, `inp-reviewer`, `validasi-model` | sonnet atau haiku menurut bentuk kerja | tidak menulis | |

Tiap berkas kode punya tepat satu pemilik (gerbang `gerbang-ilmu-agent`); `AGENTS.md` memuat peta modul dan aturan "baca dulu, baru bangun".

## 3. Model data D1

Gaya (mengikuti migrasi asal, R2 §2.7): `CREATE ... IF NOT EXISTS`, `INSERT OR IGNORE` untuk data tetap, `CHECK` lengkap, kolom `dummy` di tiap tabel data, indeks sesuai kueri, tanpa menyunting migrasi yang sudah jalan. Singkatan CHECK: `TGL` = `date(x) IS x` (bentuk `YYYY-MM-DD` yang valid kalender; `date()` mengembalikan NULL untuk tanggal tak sah sehingga `IS` gagal). Rentang migrasi: `0001..0006` (TIKET §0 menyebut `0001..0099`). Daftar nilai tetap di CHECK harus sama dengan `public/taksonomi.js`; gerbang `gerbang-taksonomi.test.mjs` membandingkannya (RU §3).

Catatan klarifikasi terhadap TIKET (dilaporkan di §9 butir 4): `laju` dipindah dari JM-B01 ke `0006_laju.sql`; `entitas` mendapat kolom `sumber_id`, `kunci`, `kategori`, `tampil`, `digabung_ke`, `di_sensus`, `anggota_meti`; tabel `alias`, `label`, `pasangan_ikatan`, `entitas_cari` ikut `0003`.

### 3.1 `0001_akun.sql`

```sql
-- 0001_akun.sql: akun, peran, sesi (JM-B01). Idempoten.
CREATE TABLE IF NOT EXISTS akun (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  surel TEXT NOT NULL COLLATE NOCASE UNIQUE
    CHECK (length(surel) BETWEEN 5 AND 120 AND surel GLOB '*?@?*.?*' AND surel NOT GLOB '* *'),
  nama TEXT NOT NULL CHECK (length(nama) BETWEEN 1 AND 120),
  peran TEXT NOT NULL DEFAULT 'anggota'
    CHECK (peran IN ('anggota','pengurus','kurator','wilayah','admin','super')),
  cakupan_prov TEXT CHECK (cakupan_prov IS NULL OR cakupan_prov GLOB '[0-9][0-9]'),
  bahasa TEXT NOT NULL DEFAULT 'id' CHECK (bahasa IN ('id','en')),
  status TEXT NOT NULL DEFAULT 'menunggu' CHECK (status IN ('menunggu','aktif','nonaktif')),
  garam TEXT CHECK (garam IS NULL OR length(garam) = 32),          -- 16 byte hex
  sandi TEXT CHECK (sandi IS NULL OR length(sandi) = 64),          -- 32 byte hex
  iterasi INTEGER CHECK (iterasi IS NULL OR iterasi >= 100000),
  aktivasi_hash TEXT CHECK (aktivasi_hash IS NULL OR length(aktivasi_hash) = 64),
  aktivasi_sampai INTEGER,
  wajib_ganti INTEGER NOT NULL DEFAULT 0 CHECK (wajib_ganti IN (0,1)),
  masuk_terakhir INTEGER,
  dibuat INTEGER NOT NULL DEFAULT (unixepoch()),
  dibuat_oleh INTEGER REFERENCES akun(id),
  dummy INTEGER NOT NULL DEFAULT 0 CHECK (dummy IN (0,1)),
  CHECK ((peran = 'wilayah') = (cakupan_prov IS NOT NULL)),         -- WL wajib cakupan, peran lain tanpa
  CHECK (status <> 'aktif' OR (garam IS NOT NULL AND sandi IS NOT NULL AND iterasi IS NOT NULL)),
  CHECK ((aktivasi_hash IS NULL) = (aktivasi_sampai IS NULL))
);
CREATE INDEX IF NOT EXISTS akun_peran ON akun (peran, status);

-- Super terakhir tidak boleh diturunkan, dinonaktifkan, atau dihapus (KPV §4).
CREATE TRIGGER IF NOT EXISTS akun_super_terakhir_ubah
BEFORE UPDATE OF peran, status ON akun
WHEN OLD.peran = 'super' AND OLD.status = 'aktif' AND OLD.dummy = 0
 AND (NEW.peran <> 'super' OR NEW.status <> 'aktif')
 AND (SELECT count(*) FROM akun WHERE peran = 'super' AND status = 'aktif' AND dummy = 0 AND id <> OLD.id) = 0
BEGIN SELECT RAISE(ABORT, 'super terakhir tidak boleh diturunkan atau dinonaktifkan'); END;

CREATE TRIGGER IF NOT EXISTS akun_super_terakhir_hapus
BEFORE DELETE ON akun
WHEN OLD.peran = 'super' AND OLD.status = 'aktif' AND OLD.dummy = 0
 AND (SELECT count(*) FROM akun WHERE peran = 'super' AND status = 'aktif' AND dummy = 0 AND id <> OLD.id) = 0
BEGIN SELECT RAISE(ABORT, 'super terakhir tidak boleh dihapus'); END;

CREATE TABLE IF NOT EXISTS sesi (
  id_hash TEXT PRIMARY KEY CHECK (length(id_hash) = 64),            -- SHA-256 token; token mentah tidak disimpan
  akun_id INTEGER NOT NULL REFERENCES akun(id) ON DELETE CASCADE,
  dibuat INTEGER NOT NULL DEFAULT (unixepoch()),
  sampai INTEGER NOT NULL,
  ip_hash TEXT CHECK (ip_hash IS NULL OR length(ip_hash) = 16),
  CHECK (sampai > dibuat)
);
CREATE INDEX IF NOT EXISTS sesi_akun ON sesi (akun_id);
CREATE INDEX IF NOT EXISTS sesi_sampai ON sesi (sampai);
```

Aturan yang SQL tidak bisa menjaga dan dipegang `hak.js` serta diuji (RU §3): Admin tidak menaikkan siapa pun (termasuk dirinya) menjadi `super`, tidak mengubah akun `super`, dan tidak mengubah perannya sendiri (KPV §4); itu butuh pengetahuan tentang pelaku.

### 3.2 `0002_jejak.sql`

```sql
-- 0002_jejak.sql: jejak tulis, append-only (JM-B07). Idempoten.
CREATE TABLE IF NOT EXISTS jejak (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kapan INTEGER NOT NULL DEFAULT (unixepoch()),
  siapa INTEGER,                                                    -- id akun; tanpa FK agar jejak tidak bisa tersentuh cascade
  peran TEXT CHECK (peran IS NULL OR peran IN
    ('publik','anggota','pengurus','kurator','wilayah','admin','super','sistem')),
  aksi TEXT NOT NULL CHECK (aksi IN
    ('masuk','masuk-gagal','keluar','tambah','ubah','hapus','hapus-permanen','aktivasi','ganti-sandi',
     'gabung','tinjau','kirim','cabut','impor','dummy-isi','dummy-hapus')),
  tabel TEXT NOT NULL CHECK (length(tabel) BETWEEN 1 AND 40),
  baris_id TEXT CHECK (baris_id IS NULL OR length(baris_id) <= 80),
  dari TEXT CHECK (dari IS NULL OR (json_valid(dari) AND length(dari) <= 4000)),
  ke TEXT CHECK (ke IS NULL OR (json_valid(ke) AND length(ke) <= 4000)),
  ip_hash TEXT CHECK (ip_hash IS NULL OR length(ip_hash) = 16),
  dummy INTEGER NOT NULL DEFAULT 0 CHECK (dummy IN (0,1))
);
CREATE INDEX IF NOT EXISTS jejak_kapan ON jejak (kapan DESC);
CREATE INDEX IF NOT EXISTS jejak_baris ON jejak (tabel, baris_id);

CREATE TRIGGER IF NOT EXISTS jejak_tanpa_ubah
BEFORE UPDATE ON jejak
BEGIN SELECT RAISE(ABORT, 'jejak tidak boleh diubah'); END;

CREATE TRIGGER IF NOT EXISTS jejak_tanpa_hapus
BEFORE DELETE ON jejak WHEN OLD.dummy = 0
BEGIN SELECT RAISE(ABORT, 'jejak tidak boleh dihapus'); END;
```

Dua aturan isi jejak yang dipegang `hak.js`: (a) kolom rahasia (`garam`, `sandi`, `aktivasi_hash`, `aktivasi_sampai`, `iterasi`) tidak pernah masuk `dari` atau `ke`; (b) untuk baris `entitas` berjenis `orang`, `dari` dan `ke` hanya memuat daftar nama kolom yang berubah, bukan nilainya. Alasan (b): jejak tidak bisa dihapus, sedangkan hak hapus subjek data bersifat keras (KPV §3.3); log yang tidak memuat nilai pribadi tidak bertentangan dengan keduanya.

### 3.3 `0003_entitas.sql`

Tiga konsep inti `entitas`, `fakta`, `ikatan` dengan `sumber` (KP D5), ditambah tabel pembantu.

```sql
-- 0003_entitas.sql: kurasi entitas, fakta, ikatan, sumber (JM-D01). Idempoten.
CREATE TABLE IF NOT EXISTS sumber (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url TEXT NOT NULL UNIQUE
    CHECK (length(url) BETWEEN 10 AND 600 AND (url GLOB 'https://*' OR url GLOB 'http://*') AND url NOT GLOB '* *'),
  domain TEXT NOT NULL CHECK (length(domain) BETWEEN 3 AND 120 AND domain NOT GLOB '*[^a-z0-9.-]*'),
  jenis TEXT NOT NULL CHECK (jenis IN
    ('dokumen-resmi','filing','situs-sendiri','media','data-terbuka','via-pihak-ketiga')),
  judul TEXT CHECK (judul IS NULL OR length(judul) <= 300),
  lisensi TEXT CHECK (lisensi IS NULL OR length(lisensi) <= 60),
  tanggal_dokumen TEXT CHECK (tanggal_dokumen IS NULL OR date(tanggal_dokumen) IS tanggal_dokumen),
  diperiksa TEXT NOT NULL CHECK (date(diperiksa) IS diperiksa),
  kutipan TEXT CHECK (kutipan IS NULL OR length(kutipan) <= 400),   -- kutipan beku untuk tooltip, singkat (hak cipta)
  hash TEXT CHECK (hash IS NULL OR length(hash) = 64),
  dummy INTEGER NOT NULL DEFAULT 0 CHECK (dummy IN (0,1))
);
CREATE INDEX IF NOT EXISTS sumber_domain ON sumber (domain);

CREATE TABLE IF NOT EXISTS entitas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kunci TEXT NOT NULL UNIQUE CHECK (length(kunci) BETWEEN 5 AND 160 AND kunci GLOB '[a-z]*:*'),
  slug TEXT NOT NULL UNIQUE
    CHECK (length(slug) BETWEEN 2 AND 60 AND slug NOT GLOB '*[^a-z0-9-]*' AND slug NOT GLOB '-*' AND slug NOT GLOB '*-'),
  jenis TEXT NOT NULL CHECK (jenis IN
    ('lembaga','orang','proyek','wilayah','regulasi','publikasi','acara','teknologi')),
  kategori TEXT CHECK (kategori IS NULL OR kategori IN
    ('pemerintah','bumn','swasta','asosiasi','riset-kampus','lsm-think-tank','keuangan',
     'internasional','pengembang-teknologi','komunitas')),
  nama TEXT NOT NULL CHECK (length(nama) BETWEEN 1 AND 200),
  nama_en TEXT CHECK (nama_en IS NULL OR length(nama_en) BETWEEN 1 AND 200),
  nama_badan_hukum TEXT CHECK (nama_badan_hukum IS NULL OR length(nama_badan_hukum) <= 200),
  ringkas TEXT CHECK (ringkas IS NULL OR length(ringkas) <= 600),
  ringkas_en TEXT CHECK (ringkas_en IS NULL OR length(ringkas_en) <= 600),
  sektor TEXT CHECK (sektor IS NULL OR sektor IN
    ('surya','bayu','air','panas-bumi','bioenergi','laut','hidrogen','penyimpanan','jaringan',
     'efisiensi','kendaraan-listrik','sampah-energi','nuklir','ccs')),
  prov TEXT CHECK (prov IS NULL OR prov GLOB '[0-9][0-9]' OR prov = 'nasional'),
  lat REAL CHECK (lat IS NULL OR lat BETWEEN -11.5 AND 6.5),
  lon REAL CHECK (lon IS NULL OR lon BETWEEN 94 AND 141.5),
  situs TEXT CHECK (situs IS NULL OR (situs GLOB 'https://*' AND length(situs) <= 300)),
  lapis TEXT NOT NULL DEFAULT 'publik' CHECK (lapis IN ('publik','anggota','pengurus')),
  tampil INTEGER NOT NULL DEFAULT 0 CHECK (tampil IN (0,1)),        -- orang tampil publik hanya bila 1 (KPV §1 butir 2)
  status TEXT NOT NULL DEFAULT 'aktif' CHECK (status IN ('aktif','ditarik','digabung')),
  digabung_ke INTEGER REFERENCES entitas(id),
  di_sensus INTEGER NOT NULL DEFAULT 0 CHECK (di_sensus IN (0,1)),
  anggota_meti INTEGER NOT NULL DEFAULT 0 CHECK (anggota_meti IN (0,1)),  -- lencana, hanya bila Sekretariat konfirmasi (KP D13)
  sumber_id INTEGER NOT NULL REFERENCES sumber(id),                 -- sumber keberadaan entitas
  dibuat INTEGER NOT NULL DEFAULT (unixepoch()),
  diubah INTEGER,
  dibuat_oleh INTEGER,
  dummy INTEGER NOT NULL DEFAULT 0 CHECK (dummy IN (0,1)),
  CHECK ((lat IS NULL) = (lon IS NULL)),
  CHECK ((status = 'digabung') = (digabung_ke IS NOT NULL)),
  CHECK (digabung_ke IS NULL OR digabung_ke <> id),
  CHECK (jenis = 'lembaga' OR kategori IS NULL),
  CHECK (tampil = 0 OR status = 'aktif'),
  CHECK (di_sensus = 0 OR (jenis = 'lembaga' AND status = 'aktif' AND sektor IN
    ('surya','bayu','air','panas-bumi','bioenergi','laut','hidrogen','penyimpanan','jaringan',
     'efisiensi','kendaraan-listrik','sampah-energi')))
);
CREATE INDEX IF NOT EXISTS entitas_jenis ON entitas (jenis, status);
CREATE INDEX IF NOT EXISTS entitas_sensus ON entitas (di_sensus, sektor, prov);
CREATE INDEX IF NOT EXISTS entitas_prov ON entitas (prov);

-- kunci dan slug tidak pernah berubah setelah dibuat (ALG §1); ganti nama = alias baru.
CREATE TRIGGER IF NOT EXISTS entitas_kunci_tetap
BEFORE UPDATE OF kunci, slug ON entitas
WHEN NEW.kunci <> OLD.kunci OR NEW.slug <> OLD.slug
BEGIN SELECT RAISE(ABORT, 'kunci dan slug entitas tidak boleh diubah'); END;

-- penggabungan tidak boleh berantai: target harus berstatus aktif.
CREATE TRIGGER IF NOT EXISTS entitas_gabung_tanpa_rantai
BEFORE UPDATE OF digabung_ke ON entitas
WHEN NEW.digabung_ke IS NOT NULL
 AND (SELECT status FROM entitas WHERE id = NEW.digabung_ke) IS NOT 'aktif'
BEGIN SELECT RAISE(ABORT, 'penggabungan harus ke entitas aktif'); END;

CREATE TABLE IF NOT EXISTS label (
  entitas_id INTEGER NOT NULL REFERENCES entitas(id) ON DELETE CASCADE,
  jenis TEXT NOT NULL CHECK (jenis IN ('sektor','rantai')),
  nilai TEXT NOT NULL,
  dummy INTEGER NOT NULL DEFAULT 0 CHECK (dummy IN (0,1)),
  PRIMARY KEY (entitas_id, jenis, nilai),
  CHECK ((jenis = 'sektor' AND nilai IN
    ('surya','bayu','air','panas-bumi','bioenergi','laut','hidrogen','penyimpanan','jaringan',
     'efisiensi','kendaraan-listrik','sampah-energi','nuklir','ccs'))
   OR (jenis = 'rantai' AND nilai IN
    ('bahan-baku','komponen','manufaktur-modul','manufaktur-inverter','manufaktur-baterai','epc',
     'pengembang-ipp','operator','offtaker','pembiaya','konsultan','regulator')))
) WITHOUT ROWID;

CREATE TABLE IF NOT EXISTS alias (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entitas_id INTEGER NOT NULL REFERENCES entitas(id) ON DELETE CASCADE,
  nama TEXT NOT NULL CHECK (length(nama) BETWEEN 1 AND 200),
  norm TEXT NOT NULL CHECK (length(norm) BETWEEN 1 AND 200),        -- hasil normNama (ALG §1)
  asal TEXT NOT NULL DEFAULT 'kurator' CHECK (asal IN ('kurator','gabung','singkatan','nama-lama','en')),
  dummy INTEGER NOT NULL DEFAULT 0 CHECK (dummy IN (0,1)),
  UNIQUE (norm, entitas_id)
);
CREATE INDEX IF NOT EXISTS alias_norm ON alias (norm);

CREATE TABLE IF NOT EXISTS fakta (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entitas_id INTEGER NOT NULL REFERENCES entitas(id) ON DELETE CASCADE,
  kunci TEXT NOT NULL CHECK (length(kunci) BETWEEN 2 AND 40 AND kunci NOT GLOB '*[^a-z0-9_]*'),
  nilai_teks TEXT CHECK (nilai_teks IS NULL OR length(nilai_teks) <= 1000),
  nilai_en TEXT CHECK (nilai_en IS NULL OR length(nilai_en) <= 1000),
  nilai_num REAL,
  satuan TEXT CHECK (satuan IS NULL OR length(satuan) <= 20),
  per_tanggal TEXT NOT NULL CHECK (date(per_tanggal) IS per_tanggal),
  est INTEGER NOT NULL DEFAULT 0 CHECK (est IN (0,1)),
  rumus TEXT CHECK (rumus IS NULL OR length(rumus) <= 300),
  alasan_kosong TEXT CHECK (alasan_kosong IS NULL OR alasan_kosong IN
    ('tidak-dipublikasikan','belum-ada','menunggu-data','belum-dicari')),
  tingkat_bukti TEXT NOT NULL CHECK (tingkat_bukti IN ('terkonfirmasi','kata-pihak','cuplikan','inferensi')),
  lapis TEXT NOT NULL DEFAULT 'publik' CHECK (lapis IN ('publik','anggota','pengurus')),
  sumber_id INTEGER NOT NULL REFERENCES sumber(id),                 -- NOT NULL: fakta tanpa sumber DITOLAK
  dibuat INTEGER NOT NULL DEFAULT (unixepoch()),
  dibuat_oleh INTEGER,
  dummy INTEGER NOT NULL DEFAULT 0 CHECK (dummy IN (0,1)),
  CHECK (nilai_teks IS NOT NULL OR nilai_num IS NOT NULL OR alasan_kosong IS NOT NULL),
  CHECK (alasan_kosong IS NULL OR (nilai_teks IS NULL AND nilai_num IS NULL)),
  CHECK (nilai_num IS NULL OR satuan IS NOT NULL),
  CHECK (est = 0 OR (rumus IS NOT NULL AND tingkat_bukti = 'inferensi')),   -- EST wajib rumus dan berbukti inferensi
  CHECK (kunci NOT IN ('kontak_surel','kontak_telepon') OR lapis = 'pengurus'),
  CHECK (lapis <> 'publik' OR nilai_teks IS NULL OR
    (nilai_teks NOT GLOB '*?@?*.?*' AND nilai_teks NOT GLOB '*[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]*'))
);
CREATE INDEX IF NOT EXISTS fakta_entitas ON fakta (entitas_id, kunci);
CREATE UNIQUE INDEX IF NOT EXISTS fakta_unik ON fakta (entitas_id, kunci, per_tanggal, sumber_id);

CREATE TABLE IF NOT EXISTS pasangan_ikatan (
  jenis TEXT NOT NULL, dari_jenis TEXT NOT NULL, ke_jenis TEXT NOT NULL,
  PRIMARY KEY (jenis, dari_jenis, ke_jenis)
) WITHOUT ROWID;
INSERT OR IGNORE INTO pasangan_ikatan (jenis, dari_jenis, ke_jenis) VALUES
 ('bekerja-di','orang','lembaga'),
 ('anggota-dari','orang','lembaga'), ('anggota-dari','lembaga','lembaga'),
 ('afiliasi-dengan','orang','lembaga'),
 ('mendanai','lembaga','lembaga'), ('mendanai','lembaga','proyek'), ('mendanai','lembaga','publikasi'),
 ('mengembangkan','lembaga','proyek'),
 ('membangun','lembaga','proyek'),
 ('memiliki','lembaga','lembaga'), ('memiliki','lembaga','proyek'),
 ('memasok','lembaga','lembaga'), ('memasok','lembaga','proyek'),
 ('membeli-dari','lembaga','lembaga'), ('membeli-dari','lembaga','proyek'),
 ('mengatur','regulasi','lembaga'), ('mengatur','regulasi','teknologi'),
 ('mengatur','regulasi','wilayah'), ('mengatur','regulasi','proyek'),
 ('mengubah','regulasi','regulasi'),
 ('mencabut','regulasi','regulasi'),
 ('berlokasi-di','lembaga','wilayah'), ('berlokasi-di','proyek','wilayah'),
 ('bermitra-dengan','lembaga','lembaga'),
 ('menulis','orang','publikasi'),
 ('memimpin','orang','lembaga');

CREATE TABLE IF NOT EXISTS ikatan (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dari INTEGER NOT NULL REFERENCES entitas(id) ON DELETE CASCADE,
  ke INTEGER NOT NULL REFERENCES entitas(id) ON DELETE CASCADE,
  jenis TEXT NOT NULL CHECK (jenis IN
    ('bekerja-di','anggota-dari','afiliasi-dengan','mendanai','mengembangkan','membangun','memiliki',
     'memasok','membeli-dari','mengatur','mengubah','mencabut','berlokasi-di','bermitra-dengan',
     'menulis','memimpin')),
  jenis_pasok TEXT CHECK (jenis_pasok IS NULL OR jenis_pasok IN
    ('bahan-baku','komponen','manufaktur-kontrak','peralatan','energi','perangkat-lunak',
     'jasa-epc','lisensi-teknologi','pembiayaan')),
  rincian TEXT CHECK (rincian IS NULL OR length(rincian) <= 400),
  rincian_en TEXT CHECK (rincian_en IS NULL OR length(rincian_en) <= 400),
  persen REAL CHECK (persen IS NULL OR persen BETWEEN 0 AND 100),
  nilai_num REAL CHECK (nilai_num IS NULL OR nilai_num >= 0),
  satuan TEXT CHECK (satuan IS NULL OR length(satuan) <= 20),
  mulai TEXT CHECK (mulai IS NULL OR date(mulai) IS mulai),
  selesai TEXT CHECK (selesai IS NULL OR date(selesai) IS selesai),
  per_tanggal TEXT NOT NULL CHECK (date(per_tanggal) IS per_tanggal),
  kutipan TEXT CHECK (kutipan IS NULL OR length(kutipan) <= 400),
  tingkat_bukti TEXT NOT NULL CHECK (tingkat_bukti IN ('terkonfirmasi','kata-pihak','cuplikan','inferensi')),
  lapis TEXT NOT NULL DEFAULT 'publik' CHECK (lapis IN ('publik','anggota','pengurus')),
  sumber_id INTEGER NOT NULL REFERENCES sumber(id),                 -- NOT NULL: ikatan tanpa sumber DITOLAK
  dibuat INTEGER NOT NULL DEFAULT (unixepoch()),
  dibuat_oleh INTEGER,
  dummy INTEGER NOT NULL DEFAULT 0 CHECK (dummy IN (0,1)),
  CHECK (dari <> ke),
  CHECK (selesai IS NULL OR mulai IS NULL OR selesai >= mulai),
  CHECK (jenis_pasok IS NULL OR jenis = 'memasok'),
  CHECK (persen IS NULL OR jenis IN ('memiliki','mendanai','membeli-dari')),
  CHECK (nilai_num IS NULL OR satuan IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS ikatan_dari ON ikatan (dari, jenis);
CREATE INDEX IF NOT EXISTS ikatan_ke ON ikatan (ke, jenis);
CREATE UNIQUE INDEX IF NOT EXISTS ikatan_unik ON ikatan (dari, ke, jenis, COALESCE(mulai, ''), sumber_id);

CREATE TRIGGER IF NOT EXISTS ikatan_pasangan_tambah
BEFORE INSERT ON ikatan
WHEN NOT EXISTS (SELECT 1 FROM pasangan_ikatan p
  JOIN entitas a ON a.id = NEW.dari JOIN entitas b ON b.id = NEW.ke
  WHERE p.jenis = NEW.jenis AND p.dari_jenis = a.jenis AND p.ke_jenis = b.jenis)
BEGIN SELECT RAISE(ABORT, 'pasangan jenis simpul tidak sah untuk jenis ikatan'); END;

CREATE TRIGGER IF NOT EXISTS ikatan_pasangan_ubah
BEFORE UPDATE OF dari, ke, jenis ON ikatan
WHEN NOT EXISTS (SELECT 1 FROM pasangan_ikatan p
  JOIN entitas a ON a.id = NEW.dari JOIN entitas b ON b.id = NEW.ke
  WHERE p.jenis = NEW.jenis AND p.dari_jenis = a.jenis AND p.ke_jenis = b.jenis)
BEGIN SELECT RAISE(ABORT, 'pasangan jenis simpul tidak sah untuk jenis ikatan'); END;

-- Pencarian entitas: FTS5 mandiri, rowid = entitas.id. Tokenizer tanpa diakritik, awalan 2 dan 3 huruf.
CREATE VIRTUAL TABLE IF NOT EXISTS entitas_cari USING fts5(
  nama, nama_en, ringkas, alias,
  tokenize = 'unicode61 remove_diacritics 2', prefix = '2 3'
);
CREATE TRIGGER IF NOT EXISTS entitas_cari_tambah AFTER INSERT ON entitas
BEGIN
  INSERT INTO entitas_cari (rowid, nama, nama_en, ringkas, alias)
  VALUES (NEW.id, NEW.nama, COALESCE(NEW.nama_en, ''), COALESCE(NEW.ringkas, ''), '');
END;
CREATE TRIGGER IF NOT EXISTS entitas_cari_ubah AFTER UPDATE OF nama, nama_en, ringkas ON entitas
BEGIN
  DELETE FROM entitas_cari WHERE rowid = OLD.id;
  INSERT INTO entitas_cari (rowid, nama, nama_en, ringkas, alias)
  VALUES (NEW.id, NEW.nama, COALESCE(NEW.nama_en, ''), COALESCE(NEW.ringkas, ''),
          COALESCE((SELECT group_concat(nama, ' ') FROM alias WHERE entitas_id = NEW.id), ''));
END;
CREATE TRIGGER IF NOT EXISTS entitas_cari_hapus AFTER DELETE ON entitas
BEGIN DELETE FROM entitas_cari WHERE rowid = OLD.id; END;
CREATE TRIGGER IF NOT EXISTS alias_cari_tambah AFTER INSERT ON alias
BEGIN
  DELETE FROM entitas_cari WHERE rowid = NEW.entitas_id;
  INSERT INTO entitas_cari (rowid, nama, nama_en, ringkas, alias)
  SELECT e.id, e.nama, COALESCE(e.nama_en, ''), COALESCE(e.ringkas, ''),
         COALESCE((SELECT group_concat(nama, ' ') FROM alias WHERE entitas_id = e.id), '')
  FROM entitas e WHERE e.id = NEW.entitas_id;
END;
CREATE TRIGGER IF NOT EXISTS alias_cari_hapus AFTER DELETE ON alias
BEGIN
  DELETE FROM entitas_cari WHERE rowid = OLD.entitas_id;
  INSERT INTO entitas_cari (rowid, nama, nama_en, ringkas, alias)
  SELECT e.id, e.nama, COALESCE(e.nama_en, ''), COALESCE(e.ringkas, ''),
         COALESCE((SELECT group_concat(nama, ' ') FROM alias WHERE entitas_id = e.id), '')
  FROM entitas e WHERE e.id = OLD.entitas_id;
END;
```

Catatan desain:

1. **Sumber wajib di tiga tingkat.** `entitas.sumber_id`, `fakta.sumber_id`, `ikatan.sumber_id` semuanya `NOT NULL REFERENCES sumber`. Foreign key aktif di D1; uji menolak `INSERT` dengan `sumber_id` tak ada.
2. **Sektor dan rantai lebih dari satu** disimpan di `label`; `entitas.sektor` adalah sektor utama yang dipakai chip dan `di_sensus`. `nuklir` dan `ccs` hanya boleh sebagai sektor "terkait": CHECK `di_sensus` menolak keduanya (ALG §8).
3. **`tampil`** bawaan 0; `hak.tulis` mengisinya 1 untuk jenis selain `orang`. Orang hanya masuk potret publik bila `tampil = 1` (KPV §1 butir 2). Kontak orang disimpan sebagai `fakta` berkunci `kontak_surel` atau `kontak_telepon` yang CHECK memaksa `lapis = 'pengurus'`.
4. **Kolom pribadi dilarang** (alamat rumah, NIK, tanggal lahir, agama, status kawin, biometrik) tidak punya kolom; CHECK `fakta` pada lapis publik menolak teks yang berpola surel atau sembilan angka berurutan (angka besar ditulis di `nilai_num`).
5. **Nilai kosong beralasan**: `alasan_kosong` empat jenis (R7 §6.1 butir 1). Tanda "tidak ada angka" di layar selalu berpasangan dengan salah satunya.
6. **`jenis_pasok`** hanya untuk ikatan `memasok`; `kutipan` beku untuk tooltip, maksimal 400 karakter (hak cipta, R8 §6).
7. **Daftar kunci fakta** (`KUNCI_FAKTA`, ALG §2.8) tidak dijaga CHECK (hanya bentuk `[a-z0-9_]{2,40}`) supaya menambah kunci tidak butuh migrasi; `jaga_unggah.mjs` dan `hak.tulis` menolak kunci di luar daftar.

### 3.4 `0004_koreksi.sql`

```sql
-- 0004_koreksi.sql: usulan koreksi dan permintaan keluar (JM-E06). Idempoten.
CREATE TABLE IF NOT EXISTS koreksi (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entitas_id INTEGER NOT NULL REFERENCES entitas(id) ON DELETE CASCADE,
  jenis TEXT NOT NULL CHECK (jenis IN ('ubah','tambah','hapus-data','keluar')),
  kunci TEXT CHECK (kunci IS NULL OR (length(kunci) BETWEEN 2 AND 40 AND kunci NOT GLOB '*[^a-z0-9_]*')),
  usulan TEXT NOT NULL CHECK (length(usulan) BETWEEN 1 AND 2000),
  sumber_url TEXT CHECK (sumber_url IS NULL OR (sumber_url GLOB 'https://*' AND length(sumber_url) <= 600)),
  pengaju_akun INTEGER REFERENCES akun(id) ON DELETE SET NULL,
  pengaju_kontak TEXT CHECK (pengaju_kontak IS NULL OR length(pengaju_kontak) <= 120),   -- hanya terbaca PG, KR, AD, SA
  status TEXT NOT NULL DEFAULT 'baru' CHECK (status IN ('baru','diterima','ditolak','diterapkan')),
  alasan TEXT CHECK (alasan IS NULL OR length(alasan) <= 500),
  ditinjau_oleh INTEGER REFERENCES akun(id) ON DELETE SET NULL,
  ditinjau_pada INTEGER,
  dibuat INTEGER NOT NULL DEFAULT (unixepoch()),
  dummy INTEGER NOT NULL DEFAULT 0 CHECK (dummy IN (0,1)),
  CHECK (jenis IN ('keluar','hapus-data') OR sumber_url IS NOT NULL),     -- ubah dan tambah wajib bersumber
  CHECK (jenis NOT IN ('ubah','tambah') OR kunci IS NOT NULL),
  CHECK (jenis NOT IN ('keluar','hapus-data') OR pengaju_akun IS NOT NULL OR pengaju_kontak IS NOT NULL),
  CHECK (status = 'baru' OR (ditinjau_oleh IS NOT NULL AND ditinjau_pada IS NOT NULL)),
  CHECK (status <> 'ditolak' OR alasan IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS koreksi_status ON koreksi (status, dibuat);
CREATE INDEX IF NOT EXISTS koreksi_entitas ON koreksi (entitas_id);
-- satu usulan terbuka yang sama per entitas dan pengaju (anti-spam)
CREATE UNIQUE INDEX IF NOT EXISTS koreksi_terbuka_unik
  ON koreksi (entitas_id, jenis, COALESCE(kunci, ''), COALESCE(pengaju_akun, 0)) WHERE status = 'baru';
```

### 3.5 `0005_riwayat.sql`

```sql
-- 0005_riwayat.sql: riwayat dengan METI, lapis pengurus (JM-F09). Idempoten.
CREATE TABLE IF NOT EXISTS riwayat (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  target_id INTEGER NOT NULL REFERENCES entitas(id) ON DELETE CASCADE,
  jenis TEXT NOT NULL CHECK (jenis IN
    ('undangan','narasumber','audiensi','mou','sponsor','kegiatan','kerja-sama','keanggotaan','lainnya')),
  tanggal TEXT NOT NULL CHECK (date(tanggal) IS tanggal),
  tanggal_selesai TEXT CHECK (tanggal_selesai IS NULL OR (date(tanggal_selesai) IS tanggal_selesai AND tanggal_selesai >= tanggal)),
  judul TEXT NOT NULL CHECK (length(judul) BETWEEN 1 AND 200),
  kegiatan_ref TEXT CHECK (kegiatan_ref IS NULL OR (length(kegiatan_ref) <= 80 AND kegiatan_ref NOT GLOB '*[^a-zA-Z0-9_.:-]*')),
  catatan TEXT CHECK (catatan IS NULL OR length(catatan) <= 2000),
  penilaian INTEGER CHECK (penilaian IS NULL OR penilaian BETWEEN 1 AND 5),
  oleh INTEGER NOT NULL REFERENCES akun(id),
  dibuat INTEGER NOT NULL DEFAULT (unixepoch()),
  diubah INTEGER,
  dummy INTEGER NOT NULL DEFAULT 0 CHECK (dummy IN (0,1))
);
CREATE INDEX IF NOT EXISTS riwayat_target ON riwayat (target_id, tanggal DESC);
CREATE INDEX IF NOT EXISTS riwayat_kegiatan ON riwayat (kegiatan_ref) WHERE kegiatan_ref IS NOT NULL;

CREATE TRIGGER IF NOT EXISTS riwayat_target_sah
BEFORE INSERT ON riwayat
WHEN (SELECT jenis FROM entitas WHERE id = NEW.target_id) IS NOT NULL
 AND (SELECT jenis FROM entitas WHERE id = NEW.target_id) NOT IN ('orang','lembaga')
BEGIN SELECT RAISE(ABORT, 'riwayat hanya untuk orang atau lembaga'); END;
```

### 3.6 `0006_laju.sql`

```sql
-- 0006_laju.sql: batas laju jendela tetap, satu tulis per permintaan. Idempoten.
CREATE TABLE IF NOT EXISTS laju (
  kunci TEXT NOT NULL CHECK (length(kunci) BETWEEN 1 AND 100),      -- ipHash atau hash surel, bukan nilai mentah
  aksi TEXT NOT NULL CHECK (aksi IN
    ('masuk-ip','masuk-surel','masuk-log','aktivasi','ganti-sandi','koreksi','keluar-data','cari',
     'riset-ai','ringkasan-ai','kurasi','impor')),
  jendela INTEGER NOT NULL CHECK (jendela >= 0),                     -- floor(unixepoch / lebar jendela aksi)
  jumlah INTEGER NOT NULL DEFAULT 1 CHECK (jumlah >= 1),
  PRIMARY KEY (kunci, aksi, jendela)
) WITHOUT ROWID;
CREATE INDEX IF NOT EXISTS laju_jendela ON laju (jendela);
```

Pemakaian: `INSERT INTO laju (kunci, aksi, jendela) VALUES (?, ?, ?) ON CONFLICT (kunci, aksi, jendela) DO UPDATE SET jumlah = jumlah + 1 RETURNING jumlah`. Satu tulis menggantikan pola baca-lalu-tulis asal (`laju_bnpb`). Sapu cron menghapus `jendela` lebih tua dari satu hari.

### 3.7 Kebiasaan semua migrasi

1. Dijalankan dua kali berturut-turut di D1 lokal tanpa galat dan tanpa baris ganda (RU §3).
2. Tidak ada `DROP`, `ALTER ... DROP COLUMN`, atau `DELETE` pada data. Perubahan skema berikutnya = migrasi bernomor baru; tabel dibangun ulang hanya dengan pola salin-lalu-ganti dan uji data.
3. Pengulas `migrasi-idempoten` memeriksa tiap berkas baru di `migrations/`.
4. Ekspor D1 berkala ke R2 `cadangan/` plus uji pemulihan sebelum pengguna pertama (KPV §9).

## 4. Kontrak API

### 4.1 Aturan bersama

1. **Router.** Satu objek `"METODE /path/:id": async (env, req, url, kini, ctx, id) => Response` di `src/worker.js`; rute modul dihamparkan dengan spread (`...RUTE_DIREKTORI`). Rute tanpa pernyataan hak ditolak saat start (KPV §2.5). Metode tidak dikenal 405; jalur tidak dikenal 404 JSON.
2. **Hak diperiksa di server di tiap rute.** Fungsi `perlu(req, env, himpunan)` membaca cookie `sesi`, mencari hash di D1 (lewat `hak.sistem.sesiCari`), memeriksa `sampai` dan `akun.status = 'aktif'`, lalu mengembalikan `akun` atau melempar 401 (PB di rute terkunci) atau 403 (peran salah). Sesi tak sah, akun nonaktif, atau peran tak dikenal diperlakukan sebagai PB (KPV §1 butir 11).
3. **Bentuk respons.** Sukses `200` atau `201` dengan JSON; galat `{ "galat": "<pesan Indonesia baku>", "kode": "<kode>" }`. Klien menerjemahkan lewat kunci `galat.<kode>` di kamus. Tanpa jejak tumpukan atau pesan internal.
4. **Kode galat tetap:** `belum-masuk` 401, `dilarang` 403, `tidak-ada` 404, `metode` 405, `salah-masukan` 422, `terlalu-sering` 429, `sumber-wajib` 422, `konflik` 409, `terlalu-besar` 413, `layanan` 502.
5. **Masukan.** `application/json` saja; badan maksimal 64 KB (`bacaBody(req, 65536)`); kolom di luar daftar putih ditolak (`salah-masukan`); `id` angka `^\d{1,12}$`; `slug` `^[a-z0-9-]{2,60}$`; `nama` potret `^[a-z0-9_-]{1,80}$`; parameter `ke` hanya jalur relatif.
6. **CSRF.** `SameSite=Lax` plus pemeriksaan `Origin` atau `Sec-Fetch-Site` pada POST, PATCH, DELETE (KPV §4); tanpa tulis lewat GET. Cookie `sesi`: `HttpOnly; Secure; SameSite=Lax; Path=/`, 14 hari.
7. **Cache.** Respons berautentikasi `Cache-Control: private, no-store` dan `Vary: Cookie`; hanya respons lapis publik yang boleh memakai `cacheTepi` (kunci tanpa cookie) dengan `public, max-age=300`.
8. **Paginasi** maksimal 50 baris per halaman; `?hal=1..` dan `?n=` dipotong ke batas; tanpa `COUNT(*)` tak terbatas.
9. **Batas laju** lewat `hak.sistem.lajuHit(kunci, aksi, lebar, batas)`; kunci selalu `ipHash` bergaram harian atau hash surel, tidak pernah nilai mentah.
10. **Tiap tulis D1** menulis baris `jejak` pada `batch` yang sama (§5).
11. **Kontrol.** `X-Content-Type-Options: nosniff` di semua respons; CSP dan header lain di `public/_headers` (KPV §8).

### 4.2 Halaman

Statik disajikan Cloudflare assets (`html_handling: auto-trailing-slash`, tanpa membayar permintaan Worker). Hanya halaman terkunci dan halaman dengan segmen dinamis lewat Worker (`run_worker_first`, §8.6).

| Rute | Berkas | Hak | Perilaku bila tak berizin |
| --- | --- | --- | --- |
| `/` | `index.html` | PB | |
| `/perusahaan`, `/peta`, `/metode` | `perusahaan.html`, `peta.html`, `metode.html` | PB | |
| `/p/:slug` | `p.html` | PB (kontak hanya PG, KR, AD, SA lewat API) | slug tak ada: 404 halaman |
| `/rantai`, `/pembiaya`, `/bumn`, `/data-center`, `/desa`, `/kebijakan`, `/cerita` | berkas sama nama | PB, F2 | |
| `/wilayah/:prov` | `wilayah.html` | PB, F2 | kode 2 digit tak sah: 404 |
| `/direktori` | `direktori.html` | LOGIN | 302 ke `/masuk?ke=/direktori`; `/direktori.html` langsung: 404 |
| `/admin` dan `/admin/*` | `admin.html` | KR, AD, SA (tab Akun hanya AD, SA) | 302 ke `/masuk?ke=/admin`; peran salah: 403 halaman |
| `/masuk`, `/aktivasi`, `/ganti-sandi` | `masuk.html`, `aktivasi.html`, `ganti-sandi.html` | PB (ganti-sandi: LOGIN) | `ke` tidak relatif: diabaikan |
| `/akademisi` | | | tidak ada (tidak di-port) |

`noindex,nofollow`, `Referrer-Policy: no-referrer`, dan `Cache-Control: private, no-store` pada `/direktori`, `/admin`, `/masuk`, `/aktivasi` lewat `_headers` dan `<meta>` (KPV §8). Halaman F2 yang belum jadi tidak dibuat (aturan berhenti).

### 4.3 API

Kolom Hak memakai lambang di kepala. "Fase" hanya ditulis bila bukan F0.

**Masuk dan akun**

| Metode dan jalur | Hak | Perilaku |
| --- | --- | --- |
| `POST /api/masuk` `{surel, sandi}` | PB | batas 10 gagal per 15 menit per ipHash dan per hash surel (`masuk-ip`, `masuk-surel`); hitung PBKDF2 pada surel tak dikenal agar waktu sama; pesan seragam "Surel atau sandi salah."; sukses: buat token acak 32 byte, simpan SHA-256-nya di `sesi`, set cookie; jejak `masuk`; gagal ditulis ke jejak paling banyak sekali per menit per IP (`masuk-log`); `200 {peran, nama, bahasa, wajib_ganti}` |
| `POST /api/keluar` | LOGIN | hapus baris sesi, hapus cookie; jejak `keluar` |
| `GET /api/saya` | PB | `{masuk:false}` atau `{masuk:true, peran, nama, bahasa, cakupan_prov, super, wajib_ganti}`; `no-store`; tidak pernah memuat surel orang lain |
| `POST /api/aktivasi` `{token, sandi}` | PB | cari hash token, cek `aktivasi_sampai`, sandi 12 sampai 128 karakter dan tidak sama dengan surel; set sandi (PBKDF2), `status = 'aktif'`, kosongkan token; sekali pakai; laju 10 per jam per IP; jejak `aktivasi` |
| `POST /api/ganti-sandi` `{lama, baru}` | LOGIN | verifikasi sandi lama, set baru, cabut semua sesi lain akun itu; jejak `ganti-sandi` |
| `PATCH /api/saya` `{nama?, bahasa?}` | LOGIN | sel `T diri`: hanya `nama` dan `bahasa` |

**Admin akun** (JM-B05, JM-B07)

| Metode dan jalur | Hak | Perilaku |
| --- | --- | --- |
| `GET /api/admin/akun?cari&peran&status&hal` | ADM | daftar tanpa kolom rahasia; maks 50; urut `dibuat` turun |
| `POST /api/admin/akun` `{surel, nama, peran, cakupan_prov?}` | ADM | buat akun `menunggu`; AD tidak boleh `peran = super`; `wilayah` wajib `cakupan_prov`; hasil memuat `tautan_aktivasi` SEKALI (token acak 32 byte, hash disimpan, berlaku 72 jam); tautan tidak masuk log; jejak `tambah` |
| `PATCH /api/admin/akun/:id` `{nama?, peran?, cakupan_prov?, status?}` | ADM | AD tidak mengubah akun `super`, tidak menetapkan `super`, tidak mengubah perannya sendiri; trigger `akun_super_terakhir_*` menjaga SA terakhir; `status = 'nonaktif'` mencabut semua sesi seketika; jejak `ubah` |
| `POST /api/admin/akun/:id/aktivasi` | ADM | tautan baru (aktivasi ulang atau reset sandi), sekali tampil, 72 jam |
| `GET /api/admin/jejak?tabel&baris&hal` | ADM | baca `jejak`, maks 50 |
| `GET /api/admin/anggota-meti` | PG, KR, ADM | basis keanggotaan METI (data pribadi) dari R2 `potret/pengurus/anggota_meti.json`, dialirkan utuh; `private, no-store`; bukan `BENDA_POTRET`; tanpa D1; akses baca belum dijejak (CHECK `jejak.aksi` tanpa `baca`) |
| `POST /api/admin/dummy/:halaman` | SA | isi baris dummy untuk halaman itu (`dummy=1`, domain `example.org`, akhiran "(contoh)"); jejak `dummy-isi` |
| `DELETE /api/admin/dummy/:halaman` | SA | hapus baris `dummy=1` halaman itu; jejak dummy ikut terhapus (satu-satunya pengecualian trigger) |

**Direktori (port `src/akademisi.js`, JM-C04)**; semua LOGIN, tulis lewat sesi wajib lolos CSRF. Rute asal `sinta` dibuang (SINTA memblokir bot, R8 §3.22).

| Metode dan jalur | Hak | Perilaku |
| --- | --- | --- |
| `GET /api/direktori` | LOGIN | R2 `potret/anggota/induk.json` (pakar); `no-store`, header `x-diperbarui` dari manifest |
| `GET /api/direktori/data/:nama` | LOGIN | `nama` harus ada di `DATA_DIREKTORI` (daftar tetap, dipangkas dari 51 nama asal); R2 `potret/anggota/<nama>.json`; lapis pengurus tidak lewat rute ini |
| `GET /api/direktori/karya/:id` | LOGIN | `id` `^A\d{4,12}$`; OpenAlex works dengan `mailto` surel resmi METI dan `OPENALEX_KEY`; `?hal=1..50&urut=sitasi|terbaru&jenis=jurnal|prosiding|buku&cari=` (maks 80); sesi dicek SEBELUM cache; `cacheTepi` 1 hari |
| `GET /api/direktori/riset/:id` | LOGIN | `id` `^W\d{4,12}$`; abstrak dirakit dari indeks terbalik OpenAlex; Workers AI ekstraktif hanya dari judul dan abstrak, label "Ringkasan mesin" (KP C-18); 60 per akun per jam (`riset-ai`); cache tepi 30 hari, gagal AI tidak dicache |
| `POST /api/direktori/ringkasan` `{sektor, prov}` | LOGIN | sintesis dari abstrak 30 riset teratas; `sektor` dari `SEKTOR`; cache R2 `ringkasan/<sektor>-<prov|nasional>.json` TTL 30 hari; laju `ringkasan-ai` |
| `GET /api/direktori/terdekat?lat&lon&n` | LOGIN | pakar terdekat (haversine, ALG §10) dari `induk.json`; `n` maks 20 |
| `GET /api/direktori/lembaga/terdekat?lat&lon&kategori&sektor&n` | LOGIN | dari `potret/anggota/lembaga.json`; `kategori` dari `KATEGORI` |
| `GET /api/direktori/kampus` | LOGIN | R2 `potret/anggota/kampus.json` |
| `GET /api/direktori/kontak` | PG, KR, AD, SA | R2 `potret/pengurus/kontak.json` (lapis pengurus); anggota 403 |
| `GET /api/direktori/keahlian/:id` | LOGIN | `id` `^A\d{4,12}$`; proksi OpenAlex host tetap (CSP: klien tidak memanggil OpenAlex langsung); sesi dicek sebelum cache |
| `GET /api/gambar/logo/:id` | PB | R2 `gambar/logo/<16..64 hex>.<png|jpg|jpeg|webp>`; `public, max-age=604800, immutable`; SVG tidak diterima |
| `GET /api/gambar/foto/:id` | LOGIN | R2 `gambar/foto/`; dipakai hanya bila C-04 mengizinkan foto (bawaan: tidak ada foto orang, KPV §3.1); `private` |

**Potret per lapis dan profil** (JM-D12)

| Metode dan jalur | Hak | Perilaku |
| --- | --- | --- |
| `GET /api/potret/publik/:nama` | PB | R2 `potret/publik/<nama>.json`; `public, max-age=300`; cache tepi; tubuh dialirkan tanpa `JSON.parse` |
| `GET /api/potret/anggota/:nama` | LOGIN | R2 `potret/anggota/<nama>.json`; `private, no-store`; bukan LOGIN: 401 |
| `GET /api/potret/pengurus/:nama` | STAF | R2 `potret/pengurus/<nama>.json`; WL dan AN: 403 |
| `GET /api/p/:slug` | PB | profil gabungan: baca `p_<slug>` dari lapis publik; bila LOGIN tambah delta lapis anggota; bila STAF tambah delta lapis pengurus (tiap lapis hanya berisi kolom miliknya, §6); slug tak ada 404; `private` bila ada delta, `public` bila publik saja |
| `GET /api/kontak/:slug` | STAF, WL (hanya `entitas.prov` = `cakupan_prov`) | baca fakta `kontak_*` dari D1 lewat `hak.baca`; potret statis tidak bisa disaring per provinsi, jadi WL memakai rute ini (KPV §1 butir 2); `no-store` |
| `GET /api/cari?q&hal` | PB | FTS5 di D1 (`entitas_cari`) dibatasi `status='aktif'`, `lapis` sampai peran, `tampil` benar untuk orang, `dummy=0`; `q` maks 100 karakter, dinormalkan menjadi `"tok"*` per token, tanda kutip dan operator FTS dibuang; `ORDER BY bm25(entitas_cari, 10, 5, 1, 4) LIMIT 20`; 60 per menit per IP (`cari`); ketik-cepat memakai `cari.json` di potret, bukan rute ini |
| `GET /api/status` | PB | `{versi, potret: <tanggal manifest>, db: "ok"}`; satu `SELECT 1`; dipakai cek rilis (JM-H04) |

**Kurasi** (JM-D01, JM-E06); semua tulis wajib `sumber`: bentuk `sumber: {url, jenis, judul?, tanggal_dokumen?, kutipan?}` atau `sumber_id`. Server membuat atau memperbarui baris `sumber` berdasarkan `url` (`ON CONFLICT (url) DO UPDATE SET diperiksa = excluded.diperiksa`); badan tanpa sumber: `422 sumber-wajib`.

| Metode dan jalur | Hak | Perilaku |
| --- | --- | --- |
| `GET /api/kurasi/entitas?jenis&cari&status&hal` | KURASI, PG (baca) | daftar dari D1 termasuk yang belum terbit; baca tunduk klausa `dummy` |
| `POST /api/kurasi/entitas` | KURASI | buat; `kunci` dan `slug` dihitung server (ALG §1), klien tidak mengirimnya; `tampil` diisi 1 kecuali jenis `orang`; jejak `tambah` |
| `PATCH /api/kurasi/entitas/:id` | KURASI | ubah kolom daftar putih; `kunci`, `slug` tidak bisa diubah; jejak `ubah` |
| `POST /api/kurasi/entitas/:id/gabung` `{ke}` | KURASI | set `status='digabung'`, `digabung_ke`; pindahkan fakta, ikatan, alias, riwayat ke target dalam satu `batch`; nama lama jadi alias `gabung`; jejak `gabung` |
| `POST /api/kurasi/entitas/:id/hapus-permanen` `{koreksi_id}` | KURASI | pemenuhan hak hapus (KPV §3.3): `koreksi_id` harus berjenis `keluar` atau `hapus-data`, status `diterima`; hapus baris (cascade fakta, ikatan, alias, label, riwayat, koreksi), tambah hash identitas ke daftar tolak (R2 `privat/daftar-tolak.json`, hanya hash dan tanggal), hapus berkas R2 terkait, tandai potret perlu dibangun ulang, purge cache tepi; jejak `hapus-permanen` tanpa nilai pribadi |
| `GET/POST/PATCH /api/kurasi/fakta`, `/api/kurasi/fakta/:id` | KURASI | CRUD fakta; `kunci` harus di `KUNCI_FAKTA`; `est=1` wajib `rumus`; kunci `kontak_*` memaksa `lapis='pengurus'` |
| `GET/POST/PATCH /api/kurasi/ikatan`, `/api/kurasi/ikatan/:id` | KURASI | jenis dan pasangan simpul divalidasi `pasangan_ikatan`; kutipan beku opsional |
| `POST /api/kurasi/sumber/:id/periksa` | KURASI | perbarui `diperiksa` ke hari ini setelah cek ulang manual; jejak `ubah` |
| `POST /api/kurasi/impor` `[{...}]` | KURASI | maksimal 200 baris dan 64 KB; tiap baris divalidasi sendiri, baris tanpa sumber ditolak dan dihitung; laporan `{diterima, ditolak:[{baris, kode}]}`; satu `batch` per entitas bersama fakta dan ikatannya; jejak `impor` sekali per panggilan; laju 10 per jam. Jalur ini dipakai seed METI (JM-D07) dan menggantikan jalur tulis pipeline (ADR-08) |
| `GET /api/kurasi/status` | KURASI | `{usia_potret, entitas_tanpa_sumber: 0, antrean_koreksi, kunci_terjemah_kurang}` dari tabel ringkasan manifest, bukan pindai penuh |

**Koreksi dan riwayat** (JM-E06, JM-F09)

| Metode dan jalur | Hak | Perilaku |
| --- | --- | --- |
| `POST /api/koreksi` `{entitas, jenis, kunci?, usulan, sumber_url?, kontak?}` | AN, PG, KR, WL (hanya `prov` miliknya), AD, SA; `keluar` dan `hapus-data` juga PB bila ada `kontak` | `ubah` dan `tambah` wajib `sumber_url`; panjang dibatasi; tautan dirender sebagai teks; laju 5 per jam per akun dan per IP (`koreksi`, `keluar-data`); tidak mengubah data tujuan; jejak `kirim` |
| `GET /api/koreksi?status&hal` | KURASI | antrean; kolom `pengaju_kontak` ikut hanya untuk KR, AD, SA |
| `GET /api/koreksi/saya` | LOGIN | koreksi milik sendiri |
| `PATCH /api/koreksi/:id` `{status, alasan?}` | KURASI | `diterima`, `ditolak` (alasan wajib), `diterapkan`; mengisi `ditinjau_oleh`; jejak `tinjau`; menerapkan koreksi dilakukan lewat rute kurasi, bukan otomatis |
| `GET /api/riwayat?target&hal` | PG, AD, SA | WL dan KR tidak (bawaan KP C-17) |
| `POST /api/riwayat` | PG, AD, SA | target jenis `orang` atau `lembaga`; `oleh` diambil dari sesi, tidak dari badan |
| `PATCH /api/riwayat/:id`, `DELETE /api/riwayat/:id` | penulis sendiri, AD, SA | `oleh` mentah tidak dikirim ke klien; hanya `milik` boolean; jejak `ubah` atau `hapus` |

**Fase 3** (rute dicatat agar kontrak tidak berubah; tidak dibuat sebelum C-01 dan C-09 dijawab)

| Metode dan jalur | Hak | Perilaku |
| --- | --- | --- |
| `POST /api/klaim` (JM-G01), `POST /api/daftar` (JM-G02) | PB dengan Turnstile | klaim lewat surel domain entitas dan persetujuan KR; daftar mandiri menunggu verifikasi Sekretariat |
| `GET /api/terbuka/:nama` (JM-G03) | PB | potret publik dengan `Access-Control-Allow-Origin: *` hanya untuk GET, laju per IP |
| `POST /api/cocok` (JM-G04) | LOGIN | pencocokan kebutuhan ke pakar dan penyedia (BM25 di klien bila cukup) |

**i18n.** Kamus statis `GET /i18n/id.json` dan `GET /i18n/en.json` (aset, PB, `public, max-age=300`, versi lewat `?v=<hash>`). Tidak ada rute API khusus bahasa: pilihan bahasa disimpan klien (`localStorage` dibungkus try/catch dan `?lang=`), dan untuk akun tersimpan di `akun.bahasa` lewat `PATCH /api/saya`. Potret membawa kolom `_en`; bila kosong klien menampilkan versi Indonesia dengan pil "ID" (KP D10).

### 4.4 Bukti agenda METI (K20, JM-F11)

Berkas: `src/agenda.js` (rute, pemilik `worker`), `public/admin_agenda.js` (tab Agenda, `layar`), dialog bukti di `public/kalender.js` (`layar`), `tests/agenda.test.mjs` (`gerbang`). Skema: migrasi 0010 (`agenda_bukti` satu baris per `kegiatan_ref`, `agenda_foto` banyak per bukti). Jenis data hak `agenda`: baca AN, PG, KR, WL, AD, SA; tulis KR, AD, SA; publik ditolak (401 `belum_masuk` bila tanpa sesi, 403 `dilarang` bila peran salah). Semua D1 lewat `hak.baca`/`hak.tulis` (jejak satu batch). `kegiatan_ref` = `id` baris `public/data/kalender.json` (pola `^[a-z0-9_-]{1,40}$`) dan wajib ada di berkas itu dengan `sumber.label = "arsip-meti"` (dibaca lewat `env.ASSETS`), selain itu 404.

| Rute | Peran | Masukan | Keluaran |
| --- | --- | --- | --- |
| `GET /api/agenda` | baca | | `{ bukti: [{ kegiatan_ref, ada_notulensi, jumlah_foto }] }` untuk penanda di kalender |
| `GET /api/agenda/:ref` | baca | | `{ bukti: { kegiatan_ref, tempat, notulensi, diubah } \| null, foto: [{ id, keterangan, urutan, tipe }] }` urut `urutan, id` |
| `PUT /api/agenda/:ref` | tulis | JSON `{ tempat?, notulensi? }` (teks; null mengosongkan) | `{ id }`; tambah bila belum ada, ubah bila ada |
| `POST /api/agenda/:ref/foto?keterangan=` | tulis | badan biner `image/jpeg\|png\|webp`, maks 5 MB; tipe dicek dari magic byte, bukan header saja | 201 `{ id }`; bukti dibuat kosong bila belum ada; R2 `agenda/<32 hex>.<jpg\|png\|webp>` ditulis dulu, dihapus lagi bila D1 gagal |
| `PATCH /api/agenda/foto/:id` | tulis | JSON `{ keterangan?, urutan? }` | `{ id }` |
| `DELETE /api/agenda/foto/:id` | tulis | | `{ ok: true }`; baris D1 dihapus (hak.tulis hapus) lalu objek R2 |
| `GET /api/agenda/foto/:id` | baca | | isi gambar dari R2 dengan `content-type` dari kolom `tipe`, `cache-control: private, no-store`, `content-disposition: inline`, `x-content-type-options: nosniff` |

Batas laju tulis memakai aksi `kurasi` (`hak.catatLaju`). Peramban memperkecil foto (sisi terpanjang 2000 px, JPEG 0,85) lewat canvas sebelum unggah, sehingga EXIF (termasuk lokasi GPS) terbuang. Notulensi ditampilkan sebagai teks biasa (paragraf, daftar bernomor dan berbutir sederhana) setelah `esc()`, tanpa HTML dari pengguna. Gambar tidak pernah masuk potret, repo, atau `public/`.

## 5. `src/hak.js`

Satu-satunya modul yang menyentuh D1 (KP D7, KPV §2). Isinya data (matriks, daftar putih) dan beberapa fungsi pendek; tidak ada kebijakan tersebar di rute.

### 5.1 Antarmuka

```js
export const PERAN = ["publik", "anggota", "pengurus", "kurator", "wilayah", "admin", "super"];
//                     PB        AN         PG         KR         WL         AD       SA   (urutan kolom MATRIKS)

export function boleh(peran, aksi, jenisData, baris, akun) { /* -> { ok: boolean, klausa: string[], alasan?: string } */ }
export async function baca(env, akun, tabel, kueri) { /* kueri: { kolom?, where?, binds?, urut?, hal? } -> baris[] */ }
export async function tulis(env, akun, tabel, aksi, data, id) { /* batch(pernyataan, jejak) -> { id } */ }
export const sistem = {                        // pintu khusus: pernyataan tetap, tanpa peran (KPV §2.1)
  sesiBuat, sesiCari, sesiHapus, sesiCabutSemua,   // hanya hash token
  akunCariSurel, akunCatatMasuk,
  lajuHit, sapu,                                   // sapu = hapus sesi, laju, tautan kedaluwarsa
  jejakTulis, ping,
};
```

Aksi yang dikenal: `baca`, `tambah`, `ubah`, `hapus`, `kirim`, `cabut`, `tinjau`, `hapus_keras`. `jenisData` adalah satu dari 16 kunci `MATRIKS`, satu per baris KPV §1.

### 5.2 Matriks sebagai data

Sumber kebenaran adalah tabel KPV §1; `hak.js` memuatnya sebagai objek, dan `tests/fixtures/matriks.json` (disalin dari KPV §1 oleh manusia, ditinjau `penyelaras`) harus sama dengannya. Sel berupa string kode KPV:

```js
const MATRIKS = {
//                         PB      AN        PG        KR        WL           AD              SA
  entitas:              ["B",    "B",      "B",      "T",      "B",         "T",            "T"],
  fakta:                ["B",    "B",      "B",      "T",      "B",         "T",            "T"],
  ikatan:               ["B",    "B",      "B",      "T",      "B",         "T",            "T"],
  orang:                ["B",    "B",      "B",      "T",      "B",         "T",            "T"],
  kontak:               ["-",    "-",      "T",      "B",      "B prov",    "T",            "T"],
  terlarang:            ["-",    "-",      "-",      "-",      "-",         "-",            "-"],
  potret_publik:        ["B",    "B",      "B",      "B",      "B",         "B",            "B"],
  potret_anggota:       ["-",    "B",      "B",      "B",      "B",         "B",            "B"],
  potret_pengurus:      ["-",    "-",      "B",      "B",      "-",         "B",            "B"],
  akun:                 ["-",    "T diri", "T diri", "T diri", "T diri",    "T bukan-super", "T"],
  sesi:                 ["-",    "T diri", "T diri", "T diri", "T diri",    "T cabut bukan-super", "T"],
  koreksi:              ["-",    "T kirim","T kirim","T",      "T kirim prov","T",          "T"],
  riwayat:              ["-",    "-",      "T",      "-",      "-",         "T",            "T"],
  jejak:                ["-",    "-",      "-",      "-",      "-",         "B",            "B"],
  daftar_tolak:         ["-",    "-",      "-",      "-",      "-",         "-",            "B"],
  dummy:                ["-",    "-",      "-",      "-",      "-",         "-",            "T"],
};
```

16 baris dikali 7 peran = 112 sel; tiap sel punya uji (RU §2.2). Terjemahan kode ke aksi (`AKSI_SEL`):

| Kode sel | Aksi yang diizinkan | Klausa wajib |
| --- | --- | --- |
| `-` | tidak ada | |
| `B` | `baca` | `lapis`, `dummy` |
| `B prov` | `baca` | `prov`, `lapis`, `dummy` |
| `T` | `baca`, `tambah`, `ubah`; plus `tinjau` pada `koreksi`, `hapus_keras` pada `entitas` dan `orang` (hanya lewat rute hapus-permanen dengan koreksi diterima), `hapus` pada `riwayat` dan `dummy` | `dummy` |
| `T diri` | `baca`, `ubah` pada baris milik sendiri; kolom `ubah` hanya `nama`, `bahasa`, `sandi` (akun); sesi sendiri dapat `cabut` | `sendiri` |
| `T bukan-super` | seperti `T` pada `akun`, kecuali baris `peran='super'`, menetapkan `super`, dan mengubah peran sendiri | `bukan-super` |
| `T cabut` | `baca`, `cabut` semua sesi | |
| `T cabut bukan-super` | `T cabut` kecuali sesi akun `peran='super'` (AD pada `sesi`, `sesi_admin`) | `bukan-super` |
| `T kirim` | `kirim` dan `baca` koreksi milik sendiri | `sendiri` |
| `T kirim prov` | seperti `T kirim`, hanya untuk entitas dengan `prov = akun.cakupan_prov` | `sendiri`, `prov` |

Penugasan tabel D1 ke jenis data: `entitas` ke `entitas` atau `orang` (menurut `jenis` baris); `fakta`, `ikatan`, `sumber`, `label`, `alias` ke `fakta` atau `ikatan` atau `orang` menurut entitas induknya, dengan `fakta` berkunci `kontak_*` ke `kontak`; `akun` ke `akun`; `sesi` ke `sesi`; `koreksi` ke `koreksi`; `riwayat` ke `riwayat`; `jejak` ke `jejak`. Fungsi `jenisData(tabel, baris)` memuat pemetaan ini sebagai tabel data, bukan percabangan tersebar.

### 5.3 Klausa cakupan

```js
const KLAUSA = {
  dummy:       { sql: (akun) => akun?.peran === "super" ? null : { s: "dummy = 0", b: [] },
                 baris: (akun, r) => akun?.peran === "super" || r.dummy === 0 },
  lapis:       { sql: (akun) => ({ s: `lapis IN (${lapisBoleh(akun).map(() => "?").join(",")})`, b: lapisBoleh(akun) }),
                 baris: (akun, r) => lapisBoleh(akun).includes(r.lapis) },
  prov:        { sql: (akun) => ({ s: "prov = ?", b: [akun.cakupan_prov] }),      // WL tanpa cakupan: 0 baris
                 baris: (akun, r) => !!akun.cakupan_prov && r.prov === akun.cakupan_prov },
  sendiri:     { sql: (akun, tabel) => ({ s: `${KOLOM_PEMILIK[tabel]} = ?`, b: [akun.id] }),
                 baris: (akun, r, tabel) => r[KOLOM_PEMILIK[tabel]] === akun.id },
  "bukan-super": { sql: () => ({ s: "peran <> 'super'", b: [] }),
                   baris: (akun, r) => r.peran !== "super" },
};
```

`lapisBoleh(akun)`: PB `["publik"]`; AN dan WL `["publik","anggota"]`; PG, KR, AD, SA `["publik","anggota","pengurus"]`. WL tidak membaca lapis pengurus (KPV §1).

### 5.4 Perilaku fungsi

**`boleh(peran, aksi, jenisData, baris, akun)`**
1. `peran` tak dikenal atau akun tak aktif menjadi `publik`.
2. Ambil sel `MATRIKS[jenisData][PERAN.indexOf(peran)]`; ambil aksi yang diizinkan dari `AKSI_SEL`. `aksi` di luar daftar: `{ok:false, alasan:"peran <p> tidak boleh <aksi> pada <jenis>"}`.
3. Bila ada `baris`, evaluasi tiap klausa wajib dengan `KLAUSA[k].baris`; satu saja gagal berarti ditolak. Tanpa `baris`, kembalikan daftar `klausa` untuk dipasang ke SQL oleh `baca`.
4. Pesan penolakan menyebut peran, aksi, dan jenis data (RU §0: pesan gagal menyebut sebab).

**`baca(env, akun, tabel, kueri)`**
1. `tabel` harus kunci `TABEL_BACA`; nama kolom dan kolom urut hanya dari daftar putih `KOLOM_BACA[tabel]`; kolom rahasia (`KOLOM_RAHASIA`) tidak pernah dipilih.
2. Bangun `WHERE (<kueri.where>) AND <klausa 1> AND <klausa 2> ...` dari `boleh(...)`; semua nilai lewat `.bind()`, tanpa sambung string.
3. `LIMIT` dipotong maksimal 50 (200 untuk pemakaian internal pipeline yang menyatakan diri `sistem`); `ORDER BY` kolom daftar putih saja.
4. Satu kueri satu pernyataan; tidak ada `SELECT *`.

**`tulis(env, akun, tabel, aksi, data, id)`**
1. `boleh(...)` dengan `baris` yang dibaca dulu untuk `ubah` dan `hapus`; ditolak berarti lempar `dilarang` dan jejak tidak ditulis.
2. `data` hanya boleh berisi kunci `KOLOM_TULIS[tabel][aksi]` (daftar putih per tabel dan aksi); kunci lain `salah-masukan`. Untuk `T bukan-super` ditolak bila `data.peran === "super"` atau baris adalah akun pelaku sendiri.
3. Baris baru wajib lolos validasi bentuk (`taksonomi.js`: sektor, rantai, kategori, jenis ikatan, jenis sumber, tingkat bukti) sebelum menyentuh D1; CHECK D1 adalah lapis kedua.
4. Jalankan `env.DB.batch([pernyataanTulis, pernyataanJejak])`: satu transaksi. `dari` dan `ke` pada jejak memakai `saring(KOLOM_RAHASIA)`; untuk `entitas` berjenis `orang` hanya nama kolom.
5. `dummy` hanya diisi 1 oleh `src/dummy.js` yang memanggil `tulis` dengan peran `super`; jalur lain memaksa `dummy = 0`.
6. Keluaran `{id}`; galat CHECK atau trigger D1 diterjemahkan ke kode `salah-masukan` atau `konflik`, pesan trigger tidak diteruskan mentah.

### 5.5 Daftar putih dan rahasia

```js
const KOLOM_RAHASIA = {
  akun: ["garam", "sandi", "iterasi", "aktivasi_hash", "aktivasi_sampai"],
  sesi: ["id_hash"], koreksi: ["pengaju_kontak"],   // pengaju_kontak hanya KR, AD, SA
};
const KOLOM_TULIS = {
  entitas: { tambah: ["jenis","kategori","nama","nama_en","nama_badan_hukum","ringkas","ringkas_en","sektor",
                      "prov","lat","lon","situs","lapis","tampil","di_sensus","anggota_meti","sumber"],
             ubah:   ["nama","nama_en","nama_badan_hukum","ringkas","ringkas_en","sektor","kategori","prov",
                      "lat","lon","situs","lapis","tampil","status","di_sensus","anggota_meti"] },
  fakta:   { tambah: ["entitas_id","kunci","nilai_teks","nilai_en","nilai_num","satuan","per_tanggal","est",
                      "rumus","alasan_kosong","tingkat_bukti","lapis","sumber"],
             ubah:   ["nilai_teks","nilai_en","nilai_num","satuan","per_tanggal","est","rumus",
                      "alasan_kosong","tingkat_bukti","lapis"] },
  ikatan:  { tambah: ["dari","ke","jenis","jenis_pasok","rincian","rincian_en","persen","nilai_num","satuan",
                      "mulai","selesai","per_tanggal","kutipan","tingkat_bukti","lapis","sumber"],
             ubah:   ["jenis_pasok","rincian","rincian_en","persen","nilai_num","satuan","mulai","selesai",
                      "per_tanggal","kutipan","tingkat_bukti","lapis"] },
  akun:    { tambah: ["surel","nama","peran","cakupan_prov"], ubah: ["nama","peran","cakupan_prov","status","bahasa"],
             diri:   ["nama","bahasa"] },
  koreksi: { tambah: ["entitas_id","jenis","kunci","usulan","sumber_url","pengaju_kontak"],
             tinjau: ["status","alasan"] },
  riwayat: { tambah: ["target_id","jenis","tanggal","tanggal_selesai","judul","kegiatan_ref","catatan","penilaian"],
             ubah:   ["jenis","tanggal","tanggal_selesai","judul","kegiatan_ref","catatan","penilaian"] },
};
```

`sumber` pada `tambah` bukan kolom; ia memicu pembuatan atau pemakaian baris `sumber` dalam `batch` yang sama dan menjadi `sumber_id`. Kolom `id`, `kunci`, `slug`, `dibuat`, `dibuat_oleh`, `dummy` tidak pernah ada di daftar tulis.

### 5.6 Menambah klausa cakupan

Contoh: peran baru "pembimbing" yang hanya melihat lembaga satu kategori.
1. Tambah entri di `KLAUSA` (`sql` dan `baris`, dua bentuk yang harus setara).
2. Rujuk namanya di sel `MATRIKS` melalui kode sel baru di `AKSI_SEL` (kolom "Klausa wajib").
3. Tambah dua baris di `tests/fixtures/hak-klausa.json`: satu baris yang lolos, satu yang ditolak, untuk bentuk `baris` dan bentuk `sql` (uji memastikan keduanya memberi jawaban sama).
4. `gerbang-matriks.test.mjs` merah bila ada klausa dirujuk tapi tidak terdefinisi, atau terdefinisi tapi tak pernah dirujuk.
5. Ubah KPV §1 dan `tests/fixtures/matriks.json` dalam commit yang sama; tambah uji "peran salah DITOLAK" untuk setiap sel yang berubah; daftarkan di `tests/cakupan.json`.

### 5.7 Uji

`tests/hak.test.mjs` membangkitkan satu uji per sel (112) terhadap D1 lokal nyata (Miniflare, migrasi 0001 sampai 0006 diterapkan): sel `-` harus ditolak, sel `B` dan `T` harus diizinkan pada baris yang memenuhi klausa dan ditolak pada baris yang tidak. `tests/gerbang-d1.test.mjs` memindai `src/**` dan merah bila `env.DB`, `.prepare(`, `.batch(`, atau `.exec(` muncul di luar `hak.js`. Gerbang sejenis memastikan akses R2 `env.BERKAS` hanya di `src/potret.js`, `src/direktori.js` (gambar, ringkasan), dan `src/kurasi.js` (hapus permanen). Rincian di RU §1 dan §2.2.

## 6. R2

Satu bucket `jaringan-meti`, binding `BERKAS`. Tidak ada akses publik langsung ke bucket (domain `r2.dev` hanya pengembangan); semua pembacaan lewat Worker agar hak diperiksa.

| Prefiks | Isi | Penulis | Pembaca | Cache |
| --- | --- | --- | --- | --- |
| `potret/publik/` | JSON lapis publik: `sensus.json`, `cari.json`, `graf.json`, `peta.json`, `rantai.json`, `pembiaya.json`, `bumn.json`, `data-center.json`, `desa.json`, `kebijakan.json`, `wilayah_<kode>.json`, `cerita_<slug>.json`, `p_<slug>.json`, `meta.json` | pipeline | PB lewat Worker | `public, max-age=300`, cache tepi; `cerita_*` `immutable` |
| `potret/anggota/` | delta lapis anggota: `induk.json`, `lembaga.json`, `cari.json`, `p_<slug>.json`, data tab direktori (`DATA_DIREKTORI`) | pipeline | LOGIN | `private, no-store` |
| `potret/pengurus/` | delta lapis pengurus: kontak, `p_<slug>.json`, ringkasan riwayat bila ada | pipeline | STAF | `private, no-store` |
| `potret/manifest.json` | `{versi, dibangun, berkas:[{kunci, sha256, bytes}]}`; ditulis TERAKHIR | pipeline | semua lapis (hanya `versi` dan tanggal) | `public, max-age=60` |
| `gambar/logo/` | logo entitas: PNG, JPEG, WebP, maks 512 KB, nama = hash | Admin atau pipeline | PB | `immutable` |
| `ringkasan/` | `<sektor>-<prov\|nasional>.json` hasil Workers AI, TTL 30 hari | Worker | LOGIN | n/a |
| `cadangan/` | `d1-<tgl>.sql`, `potret-<tgl>/` mingguan | CI | pemilik | n/a |
| `panen/` | `<tgl>/<sumber>.json`, `kurasi.json` | pipeline | pipeline | n/a |
| `privat/daftar-tolak.json` | daftar tolak (KP D14): id atau hash, alasan singkat, tanggal | pemilik | pipeline (token CI), SA (baca) | tidak pernah disajikan lewat rute publik |

Aturan:
1. **Per lapis berarti per berkas.** Pipeline membangun tiap lapis dari daftar kolom per lapis (`KOLOM_LAPIS` di `potret.mjs`); lapis atas hanya berisi kolom miliknya (delta). Worker menggabungkan sesuai peran. Tidak ada penyaringan di klien dan tidak ada tautan dari berkas lapis rendah ke lapis tinggi (KPV §2.6).
2. **Peran diperiksa sebelum R2 dibaca** (`src/potret.js`: `bacaPotret(env, akun, lapis, nama)`); lapis tidak sah 401 atau 403 tanpa menyentuh bucket.
3. **Nama dan kunci R2** dibangun dari pola regex tetap, bukan dari input mentah (`^[a-z0-9_-]{1,80}$`); `..` dan `/` ditolak.
4. **Berkas besar dialirkan** (`new Response(obj.body)`), tidak di-`parse` di Worker (CPU 10 ms, §8.2); batas ukuran per berkas potret 2 MB (gerbang `jaga_unggah`); lebih besar dipecah (per provinsi, per sektor).
5. **Manifest terakhir.** Unggah semua berkas, lalu `manifest.json`; layar memakai `?v=<versi>` dari manifest sehingga pembaca tidak pernah melihat kumpulan setengah baru.
6. **Anggaran operasi R2 Free**: 10 juta Class B per bulan (kira-kira 330 ribu per hari). Tampilan peta dan sensus memuat sekitar 4 sampai 8 berkas; cache tepi menekan pembacaan ulang. Dipantau di JM-H04.
7. **Penghapusan atas permintaan** menghapus berkas `gambar/` dan `p_<slug>` ketiga lapis, lalu cache tepi di-purge (KPV §3.3).

## 7. Pipeline

### 7.1 Aturan semua skrip panen (KPV §6)

1. Membaca `robots.txt` per host (`urllib.robotparser`) sebelum meminta; host atau jalur yang melarang tidak dipanen (uji: host `Disallow` ditolak). Pengecualian satu-satunya ialah API publik yang dokumentasinya mengizinkan (OpenAlex, World Bank, Overpass, Ember CSV).
2. `User-Agent` jelas dengan kontak resmi METI; jeda minimal 2 detik per host; satu percobaan ulang dengan backoff; tanpa melewati CAPTCHA, WAF, atau pembatas bot. Agent `scraper-antibot` tidak dipakai tanpa izin tertulis pemilik (R8 §6).
3. Hanya Python stdlib (`urllib`, `json`, `csv`, `xml`); tanpa dependensi pihak ketiga di pipeline panen.
4. Keluaran selalu `{"sumber": "<id>", "diambil": "<tanggal>", "lisensi": "...", "baris": [...]}`; tiap baris membawa `sumber_url`, `tanggal_periksa`, `tingkat_bukti` atau dasar menentukannya; baris tanpa `sumber_url` dibuang dan dihitung (pola `build.py` neraca-papua, R7 §6.1 butir 4).
5. Rahasia hanya dari variabel lingkungan Actions; tidak dicetak ke log.
6. Mode `--dry-run` tidak menulis ke R2.

### 7.2 Skrip per sumber (gelombang R8 §5)

| Skrip | Sumber R8 | Gel. | Tiket | Keluaran R2 `panen/<tgl>/` | Catatan |
| --- | --- | --- | --- | --- | --- |
| `openalex.py` | OpenAlex (#1) | 1 | JM-D03 | `openalex_pakar.json`, `openalex_lembaga.json`, `openalex_riset.json` | `OPENALEX_KEY` wajib (anggaran harian per IP bersama runner); filter `country_code:ID`; ID topik T11007, T14444, T12271, T14481, T12503 lalu saring kata kunci (subbidang 2105 terlalu longgar); karya >= 3; `mailto` surel resmi METI; cursor dan simpan antar halaman; tautan orang-lembaga dari `authorships` |
| `statistik.py` | Ember, OWID, IRENASTAT, World Bank Indicators (#4, 5, 9, 10) | 1 | JM-D05 | `statistik.json` | CSV bulk atau API PxWeb; atribusi CC BY; IRENASTAT ditandai "lisensi belum terverifikasi" dan tidak disebarkan sebagai data METI |
| `wb_proyek.py` | World Bank Projects (#11), IATI | 2 | JM-D05 | `pendanaan.json` | kunci IATI gratis bila dipakai |
| `osm_pembangkit.py` | OSM Overpass (#8) | 1 | JM-D04 | `osm_<prov>.json` | `power=plant` per provinsi (satu kueri nasional timeout); `User-Agent` khusus; atribusi "OpenStreetMap contributors", ODbL berbagi-serupa; hanya fakta lokasi dan jenis, `operator` jarang ada |
| `regulasi.py` | peraturan.bpk.go.id (sitemap), JDIH ESDM (#13, 14) | 1 | JM-D06 | `regulasi.json` | saring judul dengan kata kunci energi; status berlaku/dicabut dan relasi mengubah/mencabut; peraturan bebas hak cipta (UU 28/2014 Pasal 42) tetap ditulis sumber dan tanggal akses |
| `wri_gppd.py` | WRI GPPD v1.3.0 (#6) | 1 | JM-D09 | `wri_gppd.json` | hanya 178 baris Indonesia, tanpa surya, angin, biomassa; tingkat bukti lemah; sebagai penyemai hidro dan panas bumi |
| `aesi.py` | daftar anggota AESI (#27) | 2 | JM-D09 | `aesi.json` | HTML terbuka; dedup; nama, tanpa kontak |
| `gem.py` | Global Energy Monitor (#7) | 2 | JM-D09 | `gem.json` | berkas diunduh MANUAL lewat formulir lalu diunggah ke `panen/`; skrip hanya membaca CSV; baris CC BY-NC disaring; tautan saja untuk lisensi NC (KPV §6) |
| `orcid.py` | ORCID Public API (#3) | 2 | JM-D03 | `orcid.json` | ID peneliti saja; bukan untuk spam |
| `impor_1001.py` | 1001startup.id | 3 | JM-D08 (tertahan C-13) | `via_1001.json` | TIDAK ada permintaan HTTP ke 1001startup.id (ADR-06). Membaca berkas CSV yang diserahkan pengelola secara tertulis atau yang dikurasi manusia dari sumber primer; tiap baris label `via-pihak-ketiga`, tanggal ambil, tanpa teks deskripsi, estimasi, logo; baris dari sini tidak bisa mencapai keyakinan Tinggi (ALG §4) |
| `sinkron_meti.py` | API `api.metiires.or.id/api/news`, `events` | 2 | JM-F10 | `meti_berita.json` | GET publik tanpa kunci; hanya judul, tanggal, tautan, nama penulis; tanpa isi artikel (hak cipta) |

Tiga sumber di luar TIKET saat ini ditandai untuk tiket baru bila pemilik setuju (tidak dibangun sebelum itu): BPS WebAPI untuk rapor provinsi (R8 gelombang 2 butir 9), ekstraksi RUPTL 2025 sampai 2034 untuk proyek rencana (butir 11), dan HEESI 2025 (butir 6, mesin lokal). Usulan nomor: JM-D14, JM-D15, JM-D16.

### 7.3 Workflow dan jadwal

Batas 5 jadwal akun Free dipakai sebagai disiplin untuk seluruh sistem. Terpakai 4.

| Workflow | Pemicu | Isi |
| --- | --- | --- |
| `.github/workflows/uji.yml` | `push`, `pull_request` | `npm ci`, `npm run uji`, uji Python `npm run uji:pipa`; tanpa rahasia produksi |
| `.github/workflows/panen-bulanan.yml` | cron `0 20 1 * *`, `workflow_dispatch` (input `dry_run`) | `openalex.py`, `statistik.py`, `wb_proyek.py`, `osm_pembangkit.py`, `wri_gppd.py` (sekali), `aesi.py`, `orcid.py`; simpan ke `panen/<tgl>/`; laporan jumlah baris dan baris ditolak |
| `.github/workflows/panen-mingguan.yml` | cron `0 21 * * 0` | `regulasi.py`, `sinkron_meti.py` |
| `.github/workflows/potret.yml` | cron `0 22 * * *`, `workflow_run` sesudah panen, `workflow_dispatch` | urutan §7.4 |
| Worker `scheduled` (`wrangler.jsonc`) | cron `0 18 * * *` | `hak.sistem.sapu`: hapus `sesi.sampai` lewat, `laju.jendela` > 1 hari, `aktivasi_hash` kedaluwarsa (kosongkan), jejak dummy yang ditinggal; tidak ada jadwal baru (KPV §3.4) |

Rahasia Actions: `OPENALEX_KEY`, `CLOUDFLARE_API_TOKEN` (cakupan minimal: D1 baca, R2 tulis, satu akun), `CLOUDFLARE_ACCOUNT_ID`. Bukan di repo; kunci yang pernah bocor diputar.

### 7.4 Urutan dari panen sampai unggah (`potret.yml`)

1. **Panen**: sudah ada di R2 `panen/<tgl>/` dari workflow sebelumnya; langkah ini mengunduh yang terbaru per sumber. SELALU unduh R2 segar sebelum menggabung (pelajaran asal: pernah menimpa).
2. **Kurasi**: `kurasi_baca.mjs` menjalankan `wrangler d1 execute jaringan-meti --remote --json` dengan `SELECT` tetap atas `entitas`, `fakta`, `ikatan`, `sumber`, `alias`, `label` untuk baris `dummy = 0` (baca saja; pipeline tidak menulis D1). Perkiraan baca harian: puluhan ribu baris, jauh di bawah 5 juta. Keluaran `panen/kurasi.json`.
3. **Sambung**: `sambung.mjs` menggabung panen dan kurasi menurut `entitas.kunci` (ALG §1): kurasi menang atas panen; baris panen tanpa kunci kuat dicocokkan lewat dedup (ALG §3) dan yang ambigu dikirim ke antrean kurator, bukan digabung.
4. **Hubung**: `hubung.mjs` menyelesaikan penggabungan, membangun graf `simpul` dan `sisi`, menghitung `strategis()` (DIRI = METI), dan skor keyakinan per profil (`public/algo.js`).
5. **Potret**: `potret.mjs` menghitung sensus, kuadran, mitra strategis, lalu memecah per lapis dengan `KOLOM_LAPIS`; menyaring `daftar-tolak.json`; orang hanya bila `tampil = 1`.
6. **Jaga unggah**: `jaga_unggah.mjs` menolak seluruh unggahan bila satu pun gagal: berkas susut lebih dari 20% terhadap potret sebelumnya, JSON rusak, ada baris tanpa `sumber_url`, pola surel atau telepon di lapis publik dan anggota, kolom terlarang, id yang ada di daftar tolak, berkas lebih dari 2 MB, atau fakta `est` tanpa rumus. Tidak ada jalan pintas; ambang tidak dilemahkan untuk meloloskan kerja.
7. **Unggah**: `wrangler r2 object put` per berkas, `manifest.json` terakhir; cadangan potret sebelumnya ke `cadangan/` tiap Minggu; purge cache tepi lapis publik.
8. **Laporan**: `potret/publik/meta.json` memuat jumlah entitas, ikatan, baris tanpa sumber (harus 0), tanggal; `/api/kurasi/status` membacanya.

Cerita data (JM-F08): `cerita.mjs` mengubah `data/cerita/<slug>.json` (teks tulisan kurator) menjadi `cerita_<slug>.json` dengan `beku_pada` tanggal build; berkas beku tidak ditimpa kecuali versi baru dengan slug berakhiran tanggal.

## 8. Keamanan, performa, dummy, i18n teknis

Rincian kebijakan ada di KPV; bagian ini hanya menetapkan cara teknisnya.

### 8.1 Keamanan

1. **Sandi:** PBKDF2-SHA256 WebCrypto, garam acak 16 byte per akun, perbandingan waktu tetap, kolom `iterasi` per akun agar bisa dinaikkan tanpa membatalkan akun lama (ADR-04).
2. **Sesi:** token 32 byte acak, hanya SHA-256 di D1, cookie `HttpOnly; Secure; SameSite=Lax`.
3. **Masukan:** validasi di server, daftar putih kolom, `.bind()` selalu; `esc()` untuk semua teks dari data sebelum `innerHTML`; tanpa skrip atau gaya inline (CSP, KPV §8); logo hanya PNG, JPEG, WebP dengan cek magic bytes.
4. **Header dan CSP:** `public/_headers` menurut KPV §8; huruf hosting sendiri di `public/fonts/`; satu-satunya CDN skrip `cdnjs.cloudflare.com` dengan SRI; menambah sumber luar mengubah `_headers` dan gerbangnya.
5. **Rahasia:** `wrangler secret put` untuk `OPENALEX_KEY`; `.dev.vars` tidak dilacak; `wrangler.jsonc` di repo berisi id kosong (JM-A02, JM-A03).
6. **Data pribadi:** tidak di repo, `public/`, potret publik, log, atau galat; jejak untuk orang tanpa nilai (§3.2).
7. **Pengulas wajib:** `security-reviewer` dan `guard-api` untuk `src/**`; `migrasi-idempoten` untuk `migrations/**` (KPV §10).

### 8.2 Performa

CPU Worker Free 10 ms per permintaan, 100.000 permintaan per hari, 50 subrequest, memori 128 MB (R6 §4.1). Anggaran rancangan per rute (diukur di JM-H01 dengan `wrangler tail`; angka di bawah target, bukan hasil ukur):

| Rute | Baca D1 (baris) | Operasi R2 | CPU target | Catatan |
| --- | --- | --- | --- | --- |
| `GET /api/potret/publik/:nama` | 0 | 1 Class B (cache tepi mengurangi) | < 1 ms | tubuh dialirkan |
| `GET /api/p/:slug` | 0 | 1 sampai 3 | < 3 ms | `JSON.parse` tiga berkas kecil (< 50 KB) |
| `GET /api/saya` | 1 (indeks `sesi.id_hash`, join `akun`) | 0 | < 1 ms | |
| `POST /api/masuk` | 1 sampai 2 | 0 | PBKDF2 dominan | lihat ADR-04: bukan jalur panas, tapi bisa melewati 10 ms di Free |
| `GET /api/cari` | maks 20 baris hasil + indeks FTS | 0 | < 3 ms | ketik-cepat memakai `cari.json` |
| `GET /api/kurasi/*` | maks 50 | 0 | < 3 ms | |
| `POST /api/kurasi/impor` | tulis maks 200 baris | 0 | < 8 ms | pecah bila lebih (batas 100.000 tulis per hari) |
| Cron sapu harian | tulis puluhan sampai ribuan | 0 | satu `DELETE` per tabel | |

Aturan: tanpa `COUNT(*)` tak terbatas; semua kueri memakai indeks (uji `EXPLAIN QUERY PLAN` di RU §3 untuk kueri utama); agregat dihitung pipeline dan dibaca dari R2; `graf`, `skor`, `kuadran` tidak dihitung di Worker; Cache API tepi untuk lapis publik; MapLibre dan pustaka graf dimuat malas hanya saat tab dibuka (INP, aturan global pemilik). Permintaan API publik tetap melewati Worker sehingga menghabiskan kuota 100.000 per hari; cukup untuk purwarupa, dan paket Workers Paid direkomendasikan sebelum rilis publik (R6 §4.1).

### 8.3 Dummy

> **Dibatalkan KP K15 (7 Nov 2026):** tidak ada tombol dummy, rute `/api/admin/dummy`, kolom `dummy`, maupun gerbang-dummy. Yang tersisa: data contoh fiktif (`example.org`, akhiran "(contoh)") sebagai fixture uji dan `scripts/seed-lokal` untuk D1 lokal/pratinjau, tidak pernah ke produksi. Isi di bawah ini tidak berlaku lagi.

Tiap halaman punya tombol isi data dummy dua ikon (isi dan hapus), hanya SA, isi ditentukan halaman yang dibuka (KP D18). Pola asal dipertahankan: `dataContoh()` per halaman menyusun baris berakhiran "(contoh)", `dummy: true`, domain `example.org`; peta halaman ke berkas dalam `NAMA_DUMMY`. Di server, `POST` dan `DELETE /api/admin/dummy/:halaman` menulis atau menghapus baris `dummy = 1` lewat `hak.js`; klausa `dummy` menyembunyikan baris itu dari semua peran kecuali SA, dan potret tidak pernah memuatnya (pipeline membaca `dummy = 0`). Gerbang: `tests/e2e/05-dummy-jejak.sql` dan `gerbang-dummy.test.mjs` (tiap tabel data punya kolom `dummy`; tiap halaman berlayar data punya tombol; tombol hanya SA).

### 8.4 i18n teknis

1. Kamus `public/i18n/id.json` dan `en.json` datar, kunci bertitik (`nav.sensus`, `galat.dilarang`); `t(kunci, param)`; kunci yang hilang di EN jatuh ke ID dan dicatat sebagai galat uji.
2. Pilihan bahasa: `?lang=` menang atas `localStorage` (dibungkus try/catch) menang atas `akun.bahasa` menang atas bawaan `id`; `<html lang>` diset sesuai.
3. Angka dan tanggal lewat satu formatter di `public/i18n.js` (`angka()`, `tanggal()`), ALG §10; tidak ada `toLocaleString` tersebar.
4. Isi data: kolom `_en` bila ada; bila kosong tampil versi ID dengan pil "ID"; terjemahan mesin ditandai "perlu tinjau" sampai ada peninjau (KP C-14).
5. Tidak ada teks Indonesia tertanam di JS layar baru (gerbang i18n); kode galat API diterjemahkan klien dari `kode`.
6. Gerbang: himpunan kunci `id.json` sama dengan `en.json`; tiap `t("...")` yang dipakai di kode ada di kamus.

### 8.5 Observabilitas dan rilis

`observability.enabled` di `wrangler.jsonc`; `GET /api/status` untuk cek rilis; migrasi produksi dan unggahan R2 produksi dijalankan pemilik (JM-H04); subagent tidak deploy, tidak push, tidak commit. Cadangan D1 ke R2 plus uji pemulihan sebelum pengguna pertama.

### 8.6 `wrangler.jsonc` (id kosong di repo)

```jsonc
{
  "name": "jaringan-meti",
  "main": "src/worker.js",
  "compatibility_date": "2026-11-01",
  "assets": {
    "directory": "./public",
    "binding": "ASSETS",
    "html_handling": "auto-trailing-slash",
    "not_found_handling": "404-page",
    "run_worker_first": ["/api/*", "/direktori", "/direktori.html", "/admin", "/admin.html", "/admin/*", "/p/*", "/wilayah/*"]
  },
  "d1_databases": [{ "binding": "DB", "database_name": "jaringan-meti", "database_id": "", "migrations_dir": "migrations" }],
  "r2_buckets": [{ "binding": "BERKAS", "bucket_name": "jaringan-meti" }],
  "ai": { "binding": "AI" },
  "triggers": { "crons": ["0 18 * * *"] },
  "observability": { "enabled": true }
}
```

## 9. ADR

### ADR-01 RLS di Worker, bukan Postgres (DITERIMA)
Konteks: K9 meminta pembatasan baris. D1 adalah SQLite tanpa RLS bawaan. Opsi: (a) pindah ke Supabase/Postgres dengan RLS asli; (b) Cloudflare Access saja; (c) RLS tiruan di Worker lewat satu modul. Keputusan: (c), `src/hak.js` dengan matriks data, klausa cakupan, daftar putih kolom, jejak transaksional, dan gerbang yang memindai seluruh `src/**`. Konsekuensi: perlindungan hanya selama tidak ada jalur D1 lain, sehingga `gerbang-d1` wajib hijau; tiap sel matriks butuh uji (112); tidak ada perlindungan bila seseorang menjalankan SQL langsung di dasbor Cloudflare (akses akun Cloudflare dijaga pemilik).

### ADR-02 Potret R2 per lapis akses (DITERIMA)
Konteks: data publik, anggota, dan pengurus berbeda; menyaring di klien membocorkan lewat jaringan. Opsi: satu JSON disaring klien; satu JSON disaring Worker per permintaan (CPU); tiga lapis dibangun pipeline. Keputusan: tiga prefiks, lapis atas hanya delta kolomnya, Worker menggabung menurut peran. Konsekuensi: pipeline memegang daftar kolom per lapis dan gerbangnya; WL tidak bisa membaca potret pengurus sehingga kontak per provinsi lewat `GET /api/kontak/:slug`; pembaruan data menunggu `potret.yml` (maks sehari), bukan seketika; koreksi darurat butuh pemicu manual `workflow_dispatch`.

### ADR-03 Tanpa build step (DITERIMA)
Konteks: kode port berupa IIFE klasik 3.961 baris; KP D4. Opsi: Vite/TypeScript; modul ES di mana-mana; tanpa build. Keputusan: tanpa build; HTML, vanilla JS, CSS; rumus bersama di dua ES module (`taksonomi.js`, `algo.js`) yang dipakai Worker (impor), Node (impor), dan layar (`<script type="module">`, menempel ke `window.JM`); Python tidak memuat rumus. Konsekuensi: tidak ada tipe statis, diganti uji acuan (ALG); parity Python-JS tidak diperlukan karena implementasinya satu; tiap berkas harus dimuat dengan urutan dokumen yang benar (§2.1 catatan); versi aset lewat `?v=<hash>` yang diberi pipeline rilis.

### ADR-04 PBKDF2 untuk sandi (DITERIMA; jumlah iterasi PERLU DIUJI)
Konteks: asal memakai `sha256(garam+sandi)` yang lemah; Worker tidak punya argon2/bcrypt bawaan. Opsi: SHA-256 tunggal; PBKDF2-SHA256 WebCrypto; argon2 WASM; tanpa sandi (magic link, R6 §4.5). Keputusan: PBKDF2-SHA256, 210.000 iterasi sesuai KPV §4 dan TIKET JM-B02, garam 16 byte, perbandingan waktu tetap, kolom `iterasi` per akun. Risiko yang harus dibuktikan di JM-B02 sebelum tiket dinyatakan selesai: (1) runtime Workers dapat membatasi jumlah iterasi PBKDF2 (nilai batas harus dibaca dari dokumentasi Cloudflare terbaru dan diuji di `wrangler dev`/workerd; bila 210.000 ditolak, turunkan ke batas dan catat di KPV §4), (2) CPU 10 ms Free mungkin terlampaui oleh hash di jalur login; ukur dengan `wrangler tail`, dan bila terlampaui pindah ke Workers Paid sebelum rilis (R6 §4.1). Konsekuensi: login bukan jalur panas (jarang dipanggil); batas laju mencegah penyalahgunaan CPU; naik iterasi cukup ubah konstanta, akun lama masuk lalu di-rehash saat login berikutnya.

### ADR-05 Kelas `.ak-` dipertahankan di tahap port (DITERIMA)
Konteks: `akademisi.css` 237.875 B berisi 638 kelas `.ak-*`. Opsi: ganti nama ke `.jm-*`; pertahankan. Keputusan: pertahankan pada `direktori.css`; kelas baru memakai `.jm-*` (TIKET §0); token warna datang dari `tema.css` METI. Konsekuensi: diff port kecil dan gerbang layar asal tetap bisa diport; ada dua prefiks sampai ada keputusan pembersihan terpisah; tidak boleh ada palet lokal di CSS halaman (aturan kepala situs).

### ADR-06 Data 1001startup.id lewat pihak ketiga, bukan panen (DITERIMA; izin PERLU PEMILIK †)
Konteks: K11 membolehkan data perusahaan dari 1001startup.id; robots.txt mereka memblokir crawler AI, tidak ada lisensi data (R8, KP D15, KPV §6). Opsi: crawler; salin manual; minta izin tertulis; bangun dari sumber primer yang sama. Keputusan: tidak ada permintaan HTTP otomatis ke situs itu. `impor_1001.py` hanya membaca CSV yang diserahkan pengelola atau dikurasi manusia dari dokumen primer; baris diberi `jenis = 'via-pihak-ketiga'`, atribusi "via 1001startup.id" dengan tanggal ambil, tanpa teks, estimasi, atau logo mereka. Konsekuensi: sensus F1 bertumpu pada sumber primer (laporan tahunan, situs resmi, ESDM, RUPTL, OpenAlex); baris `via-pihak-ketiga` tidak pernah bernilai keyakinan Tinggi (ALG §4); JM-D08 tertahan sampai C-13 dijawab.

### ADR-07 Cloudflare, bukan Supabase, walau situs METI berstack Laravel (DITERIMA)
Konteks: metiires.or.id berjalan di Nuxt dengan API Laravel (R4); pemilik memutuskan Cloudflare (K3). Opsi: tumpang pada backend Laravel METI; Supabase; Cloudflare Worker + D1 + R2. Keputusan: Cloudflare, berdiri sendiri (KP C-03 bawaan); situs METI hanya dibaca lewat API publiknya (berita, acara). Konsekuensi: akun anggota terpisah dari akun situs METI (SSO menunggu C-03); tidak mewarisi sistem keanggotaan situs METI; pemilik mengelola akun Cloudflare (C-06) dan kuota Free.

### ADR-08 Panen ke R2, D1 hanya untuk tulisan manusia (DITERIMA)
Konteks: KPV §2.9 meminta bentuk jalur tulis pipeline ke D1 ditetapkan di DT; D1 Free membatasi 100.000 tulis per hari dan 5 juta baca per hari. Opsi: pipeline menulis ke D1 lewat token layanan; pipeline hanya menulis R2 dan membaca D1. Keputusan: pipeline membaca D1 (SELECT tetap, token CI baca saja) dan menulis R2; baris hasil panen digabung dengan kurasi saat potret dibangun, kunci penggabung `entitas.kunci`; manusia menaikkan baris panen menjadi kurasi lewat `POST /api/kurasi/impor` atau rute kurasi. Konsekuensi: tidak ada token layanan yang bisa menulis D1 (permukaan serangan lebih kecil); kuota tulis hampir seluruhnya milik manusia; entitas hasil panen yang belum dikurasi tidak punya baris D1 sehingga tidak muncul di `GET /api/kurasi/entitas` sampai dinaikkan (kurator melihatnya di antrean sambung dari `panen/`); gerbang `jaga_unggah` jadi satu-satunya penjaga sumber untuk baris panen.

## 10. Padanan teknis semua tiket JM-*

Tiap tiket TIKET §2 menunjuk bagian DT yang menjelaskan cara teknisnya; ALG dan RU menunjuk balik lewat nomor yang sama.

| Tiket | Bagian DT | Padanan teknis |
| --- | --- | --- |
| JM-A01 | §2.3 | roster agent, `AGENTS.md`, `CLAUDE.md` |
| JM-A02 | §2.2, §7.3, §8.6 | `package.json`, `wrangler.jsonc`, `.gitignore`, `.dev.vars.example`, `uji.yml` |
| JM-A03 | §6, §8.5, §8.6 | D1, R2, Worker, secret `OPENALEX_KEY`; id diisi pemilik |
| JM-A04 | §2.1 (`src/util.js`) | `json`, `gagal`, `bacaBody`, `cacheTepi`, `ipHash`, `acak` |
| JM-A05 | §4.1, §4.2, §8.1 | router objek, tabel halaman, pengalih, `_headers` CSP |
| JM-B01 | §3.1, §3.6 | `0001_akun.sql` (akun, sesi, peran, cakupan); `laju` di `0006` |
| JM-B02 | §5, ADR-04 | `src/sandi.js` PBKDF2 |
| JM-B03 | §4.3 (masuk dan akun), §3.6 | `src/sesi.js`, cookie, CSRF, batas laju |
| JM-B04 | §5 | `src/hak.js`, matriks 112 sel, gerbang D1 |
| JM-B05 | §4.3 (admin akun), §2.2 | `/api/admin/akun*`, `buat_super.mjs`, tautan aktivasi |
| JM-B06 | §4.2 | `masuk.html`, `aktivasi.html`, `ganti-sandi.html` |
| JM-B07 | §3.2, §4.3 | `0002_jejak.sql`, `GET /api/admin/jejak` |
| JM-C01 | §2.1 (layar) | token DS, kepala situs, logo |
| JM-C02 | §2.1 (layar) | port `akademisi.*` ke `direktori.*` |
| JM-C03 | §2.1, ALG §2 | `SEKTOR`, `KAT`, `TABS`, `DIRI`, teks |
| JM-C04 | §4.3 (direktori), §2.1 | `src/direktori.js` |
| JM-C05 | §8.3 | `dataContoh()`, dummy dua ikon SA |
| JM-C06 | §8.4 | `i18n.js`, kamus, formatter |
| JM-C07 | §2.1 (uji), RU §1 | gerbang layar asal |
| JM-D01 | §3.3, §4.3 (kurasi) | `0003_entitas.sql`, rute kurasi |
| JM-D02 | §7.4 langkah 6 | `jaga_unggah.mjs` |
| JM-D03 | §7.2 | `openalex.py`, `orcid.py`, `mutakhir.py` |
| JM-D04 | §7.2 | `osm_pembangkit.py` |
| JM-D05 | §7.2 | `statistik.py`, `wb_proyek.py` |
| JM-D06 | §7.2 | `regulasi.py` |
| JM-D07 | §4.3 (`/api/kurasi/impor`) | impor seed lewat kurator |
| JM-D08 | §7.2, ADR-06 | `impor_1001.py`, tertahan |
| JM-D09 | §7.2 | `aesi.py`, `gem.py`, `wri_gppd.py` |
| JM-D10 | §7.4 langkah 3 sampai 4, ALG §3, §6 | `hubung.mjs`, `lembaga_gabung.mjs`, `sambung.mjs` |
| JM-D11 | §6, §7.4 langkah 5 | `privat/daftar-tolak.json`, penyaring potret |
| JM-D12 | §6, §7.4 | `potret.mjs`, `src/potret.js` |
| JM-D13 | ALG §4 | `hitungKeyakinan` di `public/algo.js`, dipakai `potret.mjs` |
| JM-E01 | §6, §4.2 | `index.html` membaca `sensus.json` |
| JM-E02 | §6, ALG §8 | `perusahaan.html` membaca `sensus.json` dan `cari.json` |
| JM-E03 | §4.3 (`/api/p/:slug`), ALG §4, §6 | profil gabungan per lapis |
| JM-E04 | §6, ADR-05 | `peta.json`, MapLibre malas |
| JM-E05 | ALG §4, §9 | `metode.html` membaca konstanta `algo.js` |
| JM-E06 | §3.4, §4.3 (koreksi) | `0004_koreksi.sql`, rute koreksi dan antrean |
| JM-F01 | §6, ALG §2 | `rantai.json` dari ikatan `memasok` |
| JM-F02 | §6, ALG §6 | `pembiaya.json` dari ikatan `mendanai` |
| JM-F03 | ALG §5 | `bumn.json`, kuadran |
| JM-F04 | ALG §2 (SEL_DAYA, RISIKO) | `data-center.json`, matriks risiko |
| JM-F05 | ALG §2 (USAHA_DESA) | `desa.json` |
| JM-F06 | §6, §7.2 | `wilayah_<kode>.json` |
| JM-F07 | §3.3 (ikatan `mengubah`, `mencabut`), ALG §2 | `kebijakan.json`, jejak isu |
| JM-F08 | §7.4 (cerita) | `cerita.mjs`, `cerita_<slug>.json` |
| JM-F09 | §3.5, §4.3 (riwayat) | `0005_riwayat.sql`, rute riwayat, entitas `acara` |
| JM-F10 | §7.2 | `sinkron_meti.py` |
| JM-G01, JM-G02, JM-G03, JM-G04 | §4.3 (Fase 3) | rute dicatat, belum dibuat |
| JM-H01 | RU §2.5 | `tests/e2e/alur.test.mjs` |
| JM-H02 | RU §2.3 | `tests/layar/*.spec.mjs` |
| JM-H03 | RU §5 | `PENYELARASAN.md` |
| JM-H04 | §8.5, RU §5 | rilis, `/api/status` |

Hal yang diklarifikasi terhadap TIKET dan perlu persetujuan sesi induk (bukan keputusan baru pemilik):
1. `laju` di `0006_laju.sql`, bukan `0001_akun.sql` (urutan migrasi diminta pemilik: akun, jejak, entitas, koreksi, riwayat, laju).
2. `entitas` memuat `sumber_id NOT NULL`, `kunci`, `kategori`, `tampil`, `digabung_ke`, `di_sensus`, `anggota_meti`; tabel `alias`, `label`, `pasangan_ikatan`, `entitas_cari` ditambah ke `0003`.
3. Ambang susut `jaga_unggah` 20% (TIKET JM-D02) berbeda dari asal 5%.
4. Akun super pertama dibuat lewat `scripts/mesin/buat_super.mjs` (JM-B05); tanpa itu tidak ada pintu masuk pertama.
5. `GET /api/p/:slug`, `GET /api/kontak/:slug`, `POST /api/kurasi/impor`, `POST .../hapus-permanen` adalah rute turunan KPV §1, §3.3, §5.9 yang belum disebut TIKET.
