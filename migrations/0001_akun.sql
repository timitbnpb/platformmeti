-- 0001_akun.sql: akun, peran, sesi (JM-B01). Idempoten.
CREATE TABLE IF NOT EXISTS akun (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  surel TEXT NOT NULL COLLATE NOCASE UNIQUE
    CHECK (length(surel) BETWEEN 5 AND 120 AND surel GLOB '*?@?*.?*' AND surel NOT GLOB '* *'),
  nama TEXT NOT NULL CHECK (length(nama) BETWEEN 1 AND 120),
  peran TEXT NOT NULL DEFAULT 'anggota'
    CHECK (peran IN ('anggota','pengurus','kurator','wilayah','admin','super')),
  cakupan_prov TEXT CHECK (cakupan_prov IS NULL OR cakupan_prov GLOB '[0-9][0-9]'),
  bahasa TEXT NOT NULL DEFAULT 'id' CHECK (bahasa IN ('id','en')),
  status TEXT NOT NULL DEFAULT 'menunggu' CHECK (status IN ('menunggu','aktif','nonaktif')),
  garam TEXT CHECK (garam IS NULL OR length(garam) = 32),          -- 16 byte hex
  sandi TEXT CHECK (sandi IS NULL OR length(sandi) = 64),          -- 32 byte hex
  iterasi INTEGER CHECK (iterasi IS NULL OR iterasi >= 100000),
  aktivasi_hash TEXT CHECK (aktivasi_hash IS NULL OR length(aktivasi_hash) = 64),
  aktivasi_sampai INTEGER,
  wajib_ganti INTEGER NOT NULL DEFAULT 0 CHECK (wajib_ganti IN (0,1)),
  masuk_terakhir INTEGER,
  dibuat INTEGER NOT NULL DEFAULT (unixepoch()),
  dibuat_oleh INTEGER REFERENCES akun(id),
  CHECK ((peran = 'wilayah') = (cakupan_prov IS NOT NULL)),         -- WL wajib cakupan, peran lain tanpa
  CHECK (status <> 'aktif' OR (garam IS NOT NULL AND sandi IS NOT NULL AND iterasi IS NOT NULL)),
  CHECK ((aktivasi_hash IS NULL) = (aktivasi_sampai IS NULL))
);
CREATE INDEX IF NOT EXISTS akun_peran ON akun (peran, status);

-- Super terakhir tidak boleh diturunkan, dinonaktifkan, atau dihapus (KPV §4).
CREATE TRIGGER IF NOT EXISTS akun_super_terakhir_ubah
BEFORE UPDATE OF peran, status ON akun
WHEN OLD.peran = 'super' AND OLD.status = 'aktif'
 AND (NEW.peran <> 'super' OR NEW.status <> 'aktif')
 AND (SELECT count(*) FROM akun WHERE peran = 'super' AND status = 'aktif' AND id <> OLD.id) = 0
BEGIN SELECT RAISE(ABORT, 'super terakhir tidak boleh diturunkan atau dinonaktifkan'); END;

CREATE TRIGGER IF NOT EXISTS akun_super_terakhir_hapus
BEFORE DELETE ON akun
WHEN OLD.peran = 'super' AND OLD.status = 'aktif'
 AND (SELECT count(*) FROM akun WHERE peran = 'super' AND status = 'aktif' AND id <> OLD.id) = 0
BEGIN SELECT RAISE(ABORT, 'super terakhir tidak boleh dihapus'); END;

CREATE TABLE IF NOT EXISTS sesi (
  id_hash TEXT PRIMARY KEY CHECK (length(id_hash) = 64),            -- SHA-256 token; token mentah tidak disimpan
  akun_id INTEGER NOT NULL REFERENCES akun(id) ON DELETE CASCADE,
  dibuat INTEGER NOT NULL DEFAULT (unixepoch()),
  sampai INTEGER NOT NULL,
  ip_hash TEXT CHECK (ip_hash IS NULL OR length(ip_hash) = 16),
  CHECK (sampai > dibuat)
);
CREATE INDEX IF NOT EXISTS sesi_akun ON sesi (akun_id);
CREATE INDEX IF NOT EXISTS sesi_sampai ON sesi (sampai);
