-- 0021_pendaftaran.sql: pendaftaran anggota mandiri + persetujuan admin + iuran (pemilik 8 Nov 2026). Idempoten.
-- Tanpa NIK/KTP/data keuangan pendaftar. HP dan surel tidak pernah tampil publik. Token lacak: hanya SHA-256-nya disimpan.
CREATE TABLE IF NOT EXISTS pendaftaran (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token_hash TEXT NOT NULL UNIQUE CHECK (length(token_hash) = 64),
  jenis TEXT NOT NULL CHECK (jenis IN ('individu','organisasi','mahasiswa')),
  status TEXT NOT NULL DEFAULT 'menunggu' CHECK (status IN ('menunggu','disetujui','ditolak')),
  nama TEXT NOT NULL CHECK (length(nama) BETWEEN 2 AND 120),
  surel TEXT NOT NULL COLLATE NOCASE CHECK (length(surel) BETWEEN 5 AND 120 AND surel GLOB '*?@?*.?*' AND surel NOT GLOB '* *'),
  hp TEXT NOT NULL CHECK (length(hp) BETWEEN 6 AND 20),
  organisasi TEXT CHECK (organisasi IS NULL OR length(organisasi) <= 160),
  kota TEXT CHECK (kota IS NULL OR length(kota) <= 80),
  prov TEXT CHECK (prov IS NULL OR prov GLOB '[0-9][0-9]'),
  rinci TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(rinci) AND length(rinci) <= 8000),
  foto_kunci TEXT CHECK (foto_kunci IS NULL OR length(foto_kunci) <= 80),
  setuju_pdp INTEGER NOT NULL CHECK (setuju_pdp = 1),
  bayar TEXT NOT NULL DEFAULT 'belum' CHECK (bayar IN ('belum','menunggu','lunas')),
  iuran INTEGER CHECK (iuran IS NULL OR iuran >= 0),
  tanpa_lunas INTEGER NOT NULL DEFAULT 0 CHECK (tanpa_lunas IN (0,1)),
  catatan_admin TEXT CHECK (catatan_admin IS NULL OR length(catatan_admin) <= 500),
  akun_id INTEGER REFERENCES akun(id) ON DELETE SET NULL,
  dibuat INTEGER NOT NULL DEFAULT (unixepoch()),
  diputus_pada INTEGER,
  diputus_oleh INTEGER REFERENCES akun(id) ON DELETE SET NULL,
  CHECK (status = 'menunggu' OR diputus_pada IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS pendaftaran_status ON pendaftaran (status, dibuat DESC);
CREATE UNIQUE INDEX IF NOT EXISTS pendaftaran_surel_menunggu ON pendaftaran (surel) WHERE status = 'menunggu';

CREATE TABLE IF NOT EXISTS pendaftaran_bukti (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pendaftaran_id INTEGER NOT NULL REFERENCES pendaftaran(id) ON DELETE CASCADE,
  kunci_r2 TEXT NOT NULL CHECK (length(kunci_r2) BETWEEN 5 AND 80),
  tipe TEXT NOT NULL CHECK (tipe IN ('image/jpeg','image/png','image/webp','application/pdf')),
  ukuran INTEGER NOT NULL CHECK (ukuran BETWEEN 1 AND 5242880),
  status TEXT NOT NULL DEFAULT 'menunggu' CHECK (status IN ('menunggu','diterima','ditolak')),
  catatan TEXT CHECK (catatan IS NULL OR length(catatan) <= 300),
  dibuat INTEGER NOT NULL DEFAULT (unixepoch()),
  diputus_pada INTEGER,
  diputus_oleh INTEGER REFERENCES akun(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS pendaftaran_bukti_p ON pendaftaran_bukti (pendaftaran_id, status);

-- Pengaturan diisi admin di /admin (besaran iuran, rekening tujuan); TIDAK ditulis di repo publik.
CREATE TABLE IF NOT EXISTS pengaturan_daftar (
  kunci TEXT PRIMARY KEY CHECK (kunci IN ('iuran_individu','iuran_organisasi','iuran_mahasiswa','rekening_bank','rekening_nomor','rekening_nama','rekening_catatan')),
  nilai TEXT NOT NULL CHECK (length(nilai) <= 300),
  diubah INTEGER NOT NULL DEFAULT (unixepoch()),
  diubah_oleh INTEGER REFERENCES akun(id) ON DELETE SET NULL
);

-- Jalur opsional Midtrans Snap: gross dari DB (pendaftaran.iuran), bukan dari klien atau notifikasi.
CREATE TABLE IF NOT EXISTS pembayaran_online (
  order_id TEXT PRIMARY KEY CHECK (length(order_id) BETWEEN 8 AND 50),
  pendaftaran_id INTEGER NOT NULL REFERENCES pendaftaran(id) ON DELETE CASCADE,
  gross INTEGER NOT NULL CHECK (gross > 0),
  status TEXT NOT NULL DEFAULT 'tertunda' CHECK (status IN ('tertunda','lunas','gagal')),
  dibuat INTEGER NOT NULL DEFAULT (unixepoch()),
  diubah INTEGER
);
