-- 0034_kotak_tugas.sql: penugasan "ambil butir" di Kotak masuk kurasi terpadu (tab Admin). Satu penangan per butir. Idempoten.
-- butir = id baris D1 (mis. 'k12') atau kunci butir statis (mis. 'org:en_xxx'); tanpa data pribadi di sini.
CREATE TABLE IF NOT EXISTS kotak_tugas (
  jenis TEXT NOT NULL CHECK (length(jenis) BETWEEN 2 AND 24 AND jenis NOT GLOB '*[^a-z_]*'),
  butir TEXT NOT NULL CHECK (length(butir) BETWEEN 1 AND 120),
  akun_id INTEGER NOT NULL REFERENCES akun(id) ON DELETE CASCADE,
  dibuat INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (jenis, butir)
) WITHOUT ROWID;
CREATE INDEX IF NOT EXISTS kotak_tugas_akun ON kotak_tugas (akun_id);
