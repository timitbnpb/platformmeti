-- 0032_agenda_kegiatan.sql: kegiatan agenda buatan admin (di luar kalender.json) + dokumen per bukti agenda. Idempoten.
-- ref 'k-<angka>' diisi server. Dokumen di R2 (kunci agenda-dok/<32 hex>.<ext>), tidak pernah di repo atau public/.
CREATE TABLE IF NOT EXISTS agenda_kegiatan (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ref TEXT NOT NULL UNIQUE CHECK (ref GLOB 'k-[0-9]*' AND length(ref) BETWEEN 3 AND 20),
  judul TEXT NOT NULL CHECK (length(judul) BETWEEN 3 AND 200),
  tanggal TEXT NOT NULL CHECK (tanggal GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]'),
  tanggal_selesai TEXT CHECK (tanggal_selesai IS NULL OR (tanggal_selesai GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]' AND tanggal_selesai >= tanggal)),
  tempat TEXT CHECK (tempat IS NULL OR length(tempat) <= 200),
  jenis TEXT NOT NULL CHECK (jenis IN ('audiensi','seminar','konferensi','lokakarya','rapat','kunjungan','lainnya')),
  oleh INTEGER NOT NULL REFERENCES akun(id),
  dibuat INTEGER NOT NULL DEFAULT (unixepoch()),
  diubah INTEGER
);
CREATE INDEX IF NOT EXISTS agenda_kegiatan_tanggal ON agenda_kegiatan (tanggal);

CREATE TABLE IF NOT EXISTS agenda_dokumen (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bukti_id INTEGER NOT NULL REFERENCES agenda_bukti(id) ON DELETE CASCADE,
  kunci_r2 TEXT NOT NULL UNIQUE CHECK (kunci_r2 GLOB 'agenda-dok/[0-9a-f]*.*' AND length(kunci_r2) BETWEEN 45 AND 52),
  tipe TEXT NOT NULL CHECK (tipe IN ('pdf','pptx','docx','xlsx')),
  ukuran INTEGER NOT NULL CHECK (ukuran BETWEEN 1 AND 20971520),
  nama_berkas TEXT NOT NULL CHECK (length(nama_berkas) BETWEEN 1 AND 200),
  asal TEXT NOT NULL CHECK (asal IN ('meti','eksternal')),
  dari TEXT CHECK (dari IS NULL OR length(dari) <= 200),
  akses TEXT NOT NULL CHECK (akses IN ('anggota','pengurus')),
  sumber_resmi INTEGER NOT NULL DEFAULT 0 CHECK (sumber_resmi IN (0,1)),
  penerbit TEXT CHECK (penerbit IS NULL OR length(penerbit) <= 200),
  tanggal_terbit TEXT CHECK (tanggal_terbit IS NULL OR tanggal_terbit GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]'),
  keterangan TEXT CHECK (keterangan IS NULL OR length(keterangan) <= 300),
  oleh INTEGER NOT NULL REFERENCES akun(id),
  dibuat INTEGER NOT NULL DEFAULT (unixepoch()),
  CHECK (sumber_resmi = 0 OR (asal = 'eksternal' AND akses = 'anggota' AND penerbit IS NOT NULL AND length(penerbit) >= 2))
);
CREATE INDEX IF NOT EXISTS agenda_dokumen_bukti ON agenda_dokumen (bukti_id);
CREATE INDEX IF NOT EXISTS agenda_dokumen_resmi ON agenda_dokumen (bukti_id) WHERE sumber_resmi = 1;

-- Batas 30 dokumen per agenda.
CREATE TRIGGER IF NOT EXISTS agenda_dokumen_batas
BEFORE INSERT ON agenda_dokumen
WHEN (SELECT count(*) FROM agenda_dokumen WHERE bukti_id = NEW.bukti_id) >= 30
BEGIN SELECT RAISE(ABORT, 'agenda_dokumen terakhir: maksimal 30 dokumen per agenda'); END;
