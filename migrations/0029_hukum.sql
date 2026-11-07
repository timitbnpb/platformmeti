-- 0029_hukum.sql: Pustaka hukum EBT (docs: scripts/hukum/hukum.py). Isi dari data/hukum/seed.sql (DELETE lalu INSERT). Idempoten.
-- Kontrak ditiru dari Pustaka Hukum Posko (0052), ditambah regulasi_id (tautan ke public/data/regulasi.json) dan ocr (halaman dibaca OCR).
CREATE TABLE IF NOT EXISTS hukum_dok (
  id TEXT PRIMARY KEY CHECK (length(id) BETWEEN 3 AND 60),
  regulasi_id TEXT, slug TEXT, tipe TEXT, jenis TEXT, singkatan TEXT, nomor TEXT, tahun INTEGER,
  judul TEXT NOT NULL, status TEXT, subjek TEXT, tgl_tetap TEXT, tgl_undang TEXT, url TEXT,
  pdf TEXT, halaman INTEGER, ocr INTEGER NOT NULL DEFAULT 0, mutu REAL, diperbarui INTEGER,
  resmi INTEGER NOT NULL DEFAULT 1 CHECK (resmi IN (0,1)),
  sumber TEXT
);
CREATE INDEX IF NOT EXISTS hukum_dok_tahun ON hukum_dok (tahun);
CREATE INDEX IF NOT EXISTS hukum_dok_regulasi ON hukum_dok (regulasi_id);
CREATE TABLE IF NOT EXISTS hukum_segmen (
  id INTEGER PRIMARY KEY,
  dok TEXT NOT NULL REFERENCES hukum_dok (id),
  urut INTEGER NOT NULL,
  jenis TEXT NOT NULL CHECK (jenis IN ('judul','menimbang','mengingat','menetapkan','pasal','penjelasan','lampiran','lain')),
  label TEXT NOT NULL, bab TEXT, halaman INTEGER,
  teks TEXT NOT NULL CHECK (length(teks) <= 6000)
);
CREATE INDEX IF NOT EXISTS hukum_segmen_dok ON hukum_segmen (dok, urut);
CREATE VIRTUAL TABLE IF NOT EXISTS hukum_fts USING fts5 (teks, label, judul, tokenize = 'unicode61 remove_diacritics 2');
CREATE TABLE IF NOT EXISTS hukum_relasi (
  dari TEXT NOT NULL, ke TEXT NOT NULL,
  jenis TEXT NOT NULL CHECK (jenis IN ('mengingat','mencabut','mengganti','mengubah','merujuk')),
  terdaftar INTEGER NOT NULL DEFAULT 0 CHECK (terdaftar IN (0,1)),
  ke_judul TEXT,
  PRIMARY KEY (dari, ke, jenis)
);
CREATE INDEX IF NOT EXISTS hukum_relasi_ke ON hukum_relasi (ke);
