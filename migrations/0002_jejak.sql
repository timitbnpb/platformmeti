-- 0002_jejak.sql: jejak tulis, append-only (JM-B07). Idempoten.
CREATE TABLE IF NOT EXISTS jejak (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kapan INTEGER NOT NULL DEFAULT (unixepoch()),
  siapa INTEGER,                                                    -- id akun; tanpa FK agar jejak tidak bisa tersentuh cascade
  peran TEXT CHECK (peran IS NULL OR peran IN
    ('publik','anggota','pengurus','kurator','wilayah','admin','super','sistem')),
  aksi TEXT NOT NULL CHECK (aksi IN
    ('masuk','masuk-gagal','keluar','tambah','ubah','hapus','hapus-permanen','aktivasi','ganti-sandi',
     'gabung','tinjau','kirim','cabut','impor')),
  tabel TEXT NOT NULL CHECK (length(tabel) BETWEEN 1 AND 40),
  baris_id TEXT CHECK (baris_id IS NULL OR length(baris_id) <= 80),
  dari TEXT CHECK (dari IS NULL OR (json_valid(dari) AND length(dari) <= 4000)),
  ke TEXT CHECK (ke IS NULL OR (json_valid(ke) AND length(ke) <= 4000)),
  ip_hash TEXT CHECK (ip_hash IS NULL OR length(ip_hash) = 16)
);
CREATE INDEX IF NOT EXISTS jejak_kapan ON jejak (kapan DESC);
CREATE INDEX IF NOT EXISTS jejak_baris ON jejak (tabel, baris_id);

CREATE TRIGGER IF NOT EXISTS jejak_tanpa_ubah
BEFORE UPDATE ON jejak
BEGIN SELECT RAISE(ABORT, 'jejak tidak boleh diubah'); END;

CREATE TRIGGER IF NOT EXISTS jejak_tanpa_hapus
BEFORE DELETE ON jejak
BEGIN SELECT RAISE(ABORT, 'jejak tidak boleh dihapus'); END;
