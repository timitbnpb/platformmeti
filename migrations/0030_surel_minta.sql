-- 0030_surel_minta.sql: permintaan alamat surel @metiires.or.id. Akun masuk mengajukan, admin menyetujui/menolak lalu menandai "dibuat" setelah kotak dibuat MANUAL di penyedia.
-- Tanpa integrasi API penyedia dan tanpa sandi apa pun di sini. Satu pengajuan aktif per akun (selain ditolak); satu alamat final hanya untuk satu pengajuan. Idempoten.
CREATE TABLE IF NOT EXISTS surel_minta (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  akun_id INTEGER NOT NULL REFERENCES akun(id) ON DELETE CASCADE,
  nama_lokal TEXT NOT NULL CHECK (length(nama_lokal) BETWEEN 3 AND 32 AND nama_lokal NOT GLOB '*[^a-z0-9.-]*'),
  alternatif_1 TEXT CHECK (alternatif_1 IS NULL OR (length(alternatif_1) BETWEEN 3 AND 32 AND alternatif_1 NOT GLOB '*[^a-z0-9.-]*')),
  alternatif_2 TEXT CHECK (alternatif_2 IS NULL OR (length(alternatif_2) BETWEEN 3 AND 32 AND alternatif_2 NOT GLOB '*[^a-z0-9.-]*')),
  alasan TEXT NOT NULL CHECK (length(alasan) BETWEEN 3 AND 300),
  organisasi TEXT NOT NULL CHECK (length(organisasi) BETWEEN 2 AND 120),
  status TEXT NOT NULL DEFAULT 'diajukan' CHECK (status IN ('diajukan','disetujui','ditolak','dibuat')),
  alamat_final TEXT CHECK (alamat_final IS NULL OR (length(alamat_final) BETWEEN 3 AND 32 AND alamat_final NOT GLOB '*[^a-z0-9.-]*')),
  catatan_admin TEXT CHECK (catatan_admin IS NULL OR length(catatan_admin) <= 500),
  dibuat INTEGER NOT NULL DEFAULT (unixepoch()),
  diputus_pada INTEGER,
  diputus_oleh INTEGER REFERENCES akun(id) ON DELETE SET NULL,
  dibuat_pada INTEGER,
  dibuat_oleh INTEGER REFERENCES akun(id) ON DELETE SET NULL,
  CHECK (status = 'diajukan' OR diputus_pada IS NOT NULL),
  CHECK (status NOT IN ('disetujui','dibuat') OR alamat_final IS NOT NULL),
  CHECK (status <> 'dibuat' OR dibuat_pada IS NOT NULL)
);
CREATE UNIQUE INDEX IF NOT EXISTS surel_minta_aktif ON surel_minta (akun_id) WHERE status <> 'ditolak';
CREATE UNIQUE INDEX IF NOT EXISTS surel_minta_alamat ON surel_minta (alamat_final) WHERE status IN ('disetujui','dibuat');
CREATE INDEX IF NOT EXISTS surel_minta_status ON surel_minta (status, dibuat DESC);
