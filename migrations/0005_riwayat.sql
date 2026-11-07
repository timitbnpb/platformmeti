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
  diubah INTEGER
);
CREATE INDEX IF NOT EXISTS riwayat_target ON riwayat (target_id, tanggal DESC);
CREATE INDEX IF NOT EXISTS riwayat_kegiatan ON riwayat (kegiatan_ref) WHERE kegiatan_ref IS NOT NULL;

CREATE TRIGGER IF NOT EXISTS riwayat_target_sah
BEFORE INSERT ON riwayat
WHEN (SELECT jenis FROM entitas WHERE id = NEW.target_id) IS NOT NULL
 AND (SELECT jenis FROM entitas WHERE id = NEW.target_id) NOT IN ('orang','lembaga')
BEGIN SELECT RAISE(ABORT, 'riwayat hanya untuk orang atau lembaga'); END;
