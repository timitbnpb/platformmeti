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
