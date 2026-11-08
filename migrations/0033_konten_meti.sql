-- 0033_konten_meti.sql: berita METI input admin (melengkapi public/data/siaran_pers.json) + dokumen Pustaka unggahan admin (melengkapi public/data/pustaka.json). Idempoten.
-- ref 'bm-<angka>' dan 'pu-<angka>' diisi server. Berkas di R2 (berita-meti/<32 hex>.<ext>, pustaka-u/<32 hex>.<ext>), tidak pernah di repo atau public/.
CREATE TABLE IF NOT EXISTS berita_meti (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ref TEXT NOT NULL UNIQUE CHECK (ref GLOB 'bm-[0-9]*' AND length(ref) BETWEEN 4 AND 24),
  jenis TEXT NOT NULL CHECK (jenis IN ('liputan_media','liputan_kegiatan','siaran_pers')),
  judul TEXT NOT NULL CHECK (length(judul) BETWEEN 5 AND 300),
  tanggal TEXT NOT NULL CHECK (tanggal GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]'),
  media TEXT CHECK (media IS NULL OR length(media) <= 120),
  url TEXT CHECK (url IS NULL OR (url GLOB 'https://*' AND length(url) <= 600)),
  ringkasan TEXT CHECK (ringkasan IS NULL OR length(ringkasan) <= 1000),
  isi TEXT CHECK (isi IS NULL OR length(isi) <= 40000),
  kota TEXT CHECK (kota IS NULL OR length(kota) <= 80),
  penulis TEXT CHECK (penulis IS NULL OR length(penulis) <= 120),
  foto_r2 TEXT UNIQUE CHECK (foto_r2 IS NULL OR (foto_r2 GLOB 'berita-meti/[0-9a-f]*.*' AND length(foto_r2) BETWEEN 45 AND 52)),
  foto_tipe TEXT CHECK (foto_tipe IS NULL OR foto_tipe IN ('jpeg','png','webp')),
  terbit INTEGER NOT NULL DEFAULT 1 CHECK (terbit IN (0,1)),
  oleh INTEGER REFERENCES akun(id),
  dibuat INTEGER DEFAULT (unixepoch()),
  diubah INTEGER,
  CHECK (jenis <> 'liputan_media' OR (media IS NOT NULL AND length(media) >= 2)),
  CHECK (jenis <> 'liputan_media' OR url IS NOT NULL),
  CHECK ((foto_r2 IS NULL) = (foto_tipe IS NULL))
);
CREATE INDEX IF NOT EXISTS berita_meti_terbit_tanggal ON berita_meti (terbit, tanggal);

CREATE TABLE IF NOT EXISTS pustaka_unggah (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ref TEXT NOT NULL UNIQUE CHECK (ref GLOB 'pu-[0-9]*' AND length(ref) BETWEEN 4 AND 24),
  judul TEXT NOT NULL CHECK (length(judul) BETWEEN 3 AND 300),
  penerbit TEXT NOT NULL CHECK (length(penerbit) BETWEEN 2 AND 200),
  tanggal_terbit TEXT CHECK (tanggal_terbit IS NULL OR tanggal_terbit GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]'),
  jenis TEXT NOT NULL CHECK (jenis IN ('laporan','kajian','paparan','regulasi','panduan','data','lainnya')),
  ringkasan TEXT CHECK (ringkasan IS NULL OR length(ringkasan) <= 1500),
  bahasa TEXT NOT NULL DEFAULT 'id' CHECK (bahasa IN ('id','en')),
  akses TEXT NOT NULL CHECK (akses IN ('anggota','pengurus')),
  kunci_r2 TEXT NOT NULL UNIQUE CHECK (kunci_r2 GLOB 'pustaka-u/[0-9a-f]*.*' AND length(kunci_r2) BETWEEN 44 AND 52),
  tipe TEXT NOT NULL CHECK (tipe IN ('pdf','pptx','docx','xlsx')),
  ukuran INTEGER NOT NULL CHECK (ukuran BETWEEN 1 AND 52428800),
  nama_berkas TEXT NOT NULL CHECK (length(nama_berkas) BETWEEN 1 AND 200),
  oleh INTEGER REFERENCES akun(id),
  dibuat INTEGER DEFAULT (unixepoch()),
  diubah INTEGER
);
CREATE INDEX IF NOT EXISTS pustaka_unggah_akses_terbit ON pustaka_unggah (akses, tanggal_terbit);
