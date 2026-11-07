-- 0010_agenda_bukti.sql: bukti agenda METI di Kalender (KP K20, JM-F11): notulensi + foto per kegiatan. Idempoten.
-- Baca: semua peran yang login (anggota sampai super). Tulis: kurator, admin, super. Semua tulis lewat hak.js + jejak.
-- Berkas foto di R2 (kunci agenda/<32 hex>.<ext>), tidak pernah di repo atau public/.
CREATE TABLE IF NOT EXISTS agenda_bukti (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kegiatan_ref TEXT NOT NULL UNIQUE CHECK (length(kegiatan_ref) BETWEEN 1 AND 40 AND kegiatan_ref NOT GLOB '*[^a-z0-9_-]*'),
  tempat TEXT CHECK (tempat IS NULL OR length(tempat) <= 200),
  notulensi TEXT CHECK (notulensi IS NULL OR length(notulensi) <= 30000),
  oleh INTEGER REFERENCES akun(id),
  dibuat INTEGER NOT NULL DEFAULT (unixepoch()),
  diubah INTEGER
);

CREATE TABLE IF NOT EXISTS agenda_foto (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bukti_id INTEGER NOT NULL REFERENCES agenda_bukti(id) ON DELETE CASCADE,
  kunci_r2 TEXT NOT NULL UNIQUE CHECK (kunci_r2 GLOB 'agenda/[0-9a-f]*.*' AND length(kunci_r2) BETWEEN 40 AND 44
    AND (kunci_r2 GLOB '*.jpg' OR kunci_r2 GLOB '*.png' OR kunci_r2 GLOB '*.webp')),
  tipe TEXT NOT NULL CHECK (tipe IN ('image/jpeg','image/png','image/webp')),
  ukuran INTEGER NOT NULL CHECK (ukuran BETWEEN 1 AND 5242880),
  keterangan TEXT CHECK (keterangan IS NULL OR length(keterangan) <= 300),
  urutan INTEGER NOT NULL DEFAULT 0 CHECK (urutan BETWEEN 0 AND 999),
  oleh INTEGER REFERENCES akun(id),
  dibuat INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS agenda_foto_bukti ON agenda_foto (bukti_id, urutan, id);

-- Batas 40 foto per agenda (jaga kuota R2 dan ukuran dialog).
CREATE TRIGGER IF NOT EXISTS agenda_foto_batas
BEFORE INSERT ON agenda_foto
WHEN (SELECT count(*) FROM agenda_foto WHERE bukti_id = NEW.bukti_id) >= 40
BEGIN SELECT RAISE(ABORT, 'agenda_foto terakhir: maksimal 40 foto per agenda'); END;
