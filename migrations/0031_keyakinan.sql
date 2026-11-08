-- 0031_keyakinan.sql: indeks keyakinan bisnis EBT. Survei triwulanan untuk akun masuk: 8 butir skala 1-5, SATU jawaban per akun per periode (PRIMARY KEY).
-- Periode = 'YYYY-Qn' (diturunkan server dari waktu WIB; jawaban periode lalu tidak dapat diubah lewat rute). Agregat hanya ditampilkan bila n >= 5 (dijaga hak.js);
-- tabel tidak pernah dibaca per baris oleh klien dan tidak memuat data pribadi selain akun_id. Idempoten (IF NOT EXISTS).
CREATE TABLE IF NOT EXISTS keyakinan_jawab (
  akun_id INTEGER NOT NULL REFERENCES akun(id) ON DELETE CASCADE,
  periode TEXT NOT NULL CHECK (periode GLOB '[0-9][0-9][0-9][0-9]-Q[1-4]'),
  k_kondisi INTEGER NOT NULL CHECK (k_kondisi BETWEEN 1 AND 5),
  k_pipeline INTEGER NOT NULL CHECK (k_pipeline BETWEEN 1 AND 5),
  k_pembiayaan INTEGER NOT NULL CHECK (k_pembiayaan BETWEEN 1 AND 5),
  k_perizinan INTEGER NOT NULL CHECK (k_perizinan BETWEEN 1 AND 5),
  k_harga INTEGER NOT NULL CHECK (k_harga BETWEEN 1 AND 5),
  k_regulasi INTEGER NOT NULL CHECK (k_regulasi BETWEEN 1 AND 5),
  k_investasi INTEGER NOT NULL CHECK (k_investasi BETWEEN 1 AND 5),
  k_tenaga INTEGER NOT NULL CHECK (k_tenaga BETWEEN 1 AND 5),
  dibuat INTEGER NOT NULL DEFAULT (unixepoch()),
  diubah INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (akun_id, periode)
) WITHOUT ROWID;
CREATE INDEX IF NOT EXISTS keyakinan_periode ON keyakinan_jawab (periode);
