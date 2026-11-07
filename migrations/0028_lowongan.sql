-- 0028_lowongan.sql: Green jobs /kerja. Lowongan dipasang organisasi anggota (akun terhubung, org_klaim 'setuju'), masuk antrean moderasi admin; tampil hanya bila 'terbit'. Idempoten.
-- Lowongan hasil panen halaman karir resmi TIDAK di sini (potret statis public/data/kerja.json). Tanpa data pribadi: tautan lamaran https ke situs organisasi.
CREATE TABLE IF NOT EXISTS lowongan (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  akun_id INTEGER NOT NULL REFERENCES akun(id) ON DELETE CASCADE,
  organisasi_id TEXT NOT NULL CHECK (length(organisasi_id) BETWEEN 2 AND 60 AND organisasi_id NOT GLOB '*[^A-Za-z0-9_-]*'),
  organisasi_nama TEXT NOT NULL CHECK (length(organisasi_nama) BETWEEN 1 AND 160),
  judul TEXT NOT NULL CHECK (length(judul) BETWEEN 3 AND 160),
  kode_prov TEXT CHECK (kode_prov IS NULL OR (length(kode_prov) = 2 AND kode_prov NOT GLOB '*[^0-9]*')),
  lokasi TEXT CHECK (lokasi IS NULL OR length(lokasi) <= 80),
  teknologi TEXT NOT NULL CHECK (teknologi IN ('surya','bayu','hidro','panas-bumi','bioenergi','biomassa-sampah','penyimpanan','hidrogen','nuklir')),
  jenjang TEXT NOT NULL CHECK (jenjang IN ('magang','pemula','menengah','senior','pimpinan')),
  deskripsi TEXT CHECK (deskripsi IS NULL OR length(deskripsi) <= 1500),
  tautan TEXT NOT NULL CHECK (tautan GLOB 'https://*' AND length(tautan) <= 600),
  batas TEXT CHECK (batas IS NULL OR batas GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  status TEXT NOT NULL DEFAULT 'menunggu' CHECK (status IN ('menunggu','terbit','tolak')),
  catatan_admin TEXT CHECK (catatan_admin IS NULL OR length(catatan_admin) <= 500),
  dibuat INTEGER NOT NULL DEFAULT (unixepoch()),
  diputus_pada INTEGER,
  diputus_oleh INTEGER REFERENCES akun(id) ON DELETE SET NULL,
  CHECK (status = 'menunggu' OR (diputus_pada IS NOT NULL AND diputus_oleh IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS lowongan_status ON lowongan (status, dibuat DESC);
CREATE INDEX IF NOT EXISTS lowongan_akun ON lowongan (akun_id, dibuat DESC);
CREATE INDEX IF NOT EXISTS lowongan_org ON lowongan (organisasi_id, status);
CREATE TRIGGER IF NOT EXISTS lowongan_batas
BEFORE INSERT ON lowongan
WHEN (SELECT count(*) FROM lowongan WHERE akun_id = NEW.akun_id AND status = 'menunggu') >= 10
BEGIN SELECT RAISE(ABORT, 'lowongan: maksimal 10 menunggu per akun'); END;
