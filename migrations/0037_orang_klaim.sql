-- 0037_orang_klaim.sql: akun mengklaim entri orang di direktori (id data panen, mis. o_00c8421ae3); admin menyetujui SEKALI (KEPUTUSAN K19b).
-- Sesudah 'setuju', isi profil akun (0018) menjadi lapisan di atas data panen tanpa persetujuan per revisi. Satu orang satu pemilik aktif, satu akun satu klaim aktif. Idempoten.
CREATE TABLE IF NOT EXISTS orang_klaim (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  akun_id INTEGER NOT NULL REFERENCES akun(id) ON DELETE CASCADE,
  orang_id TEXT NOT NULL CHECK (length(orang_id) BETWEEN 2 AND 60 AND orang_id NOT GLOB '*[^A-Za-z0-9_-]*'),
  bukti_url TEXT CHECK (bukti_url IS NULL OR (bukti_url GLOB 'https://*' AND length(bukti_url) <= 600)),
  status TEXT NOT NULL DEFAULT 'baru' CHECK (status IN ('baru','setuju','tolak')),
  catatan_admin TEXT CHECK (catatan_admin IS NULL OR length(catatan_admin) <= 500),
  dibuat INTEGER NOT NULL DEFAULT (unixepoch()),
  diputus_pada INTEGER,
  diputus_oleh INTEGER REFERENCES akun(id) ON DELETE SET NULL,
  CHECK (status = 'baru' OR (diputus_pada IS NOT NULL AND diputus_oleh IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS orang_klaim_status ON orang_klaim (status, dibuat DESC);
CREATE UNIQUE INDEX IF NOT EXISTS orang_klaim_pemilik ON orang_klaim (orang_id) WHERE status = 'setuju';
CREATE UNIQUE INDEX IF NOT EXISTS orang_klaim_akun ON orang_klaim (akun_id) WHERE status IN ('baru','setuju');
