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
