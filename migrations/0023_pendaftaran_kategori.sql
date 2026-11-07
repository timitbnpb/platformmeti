-- 0023_pendaftaran_kategori.sql: 6 kategori keanggotaan resmi (metiires.or.id/membership, tarif 1 Juli 2026).
-- 0021 sudah jalan di produksi dengan CHECK lama (individu/organisasi/mahasiswa); SQLite tidak bisa mengubah CHECK,
-- jadi tabel dibangun ulang. Urutan rename dulu supaya DROP tidak memicu ON DELETE CASCADE ke anak yang baru.
-- Pemetaan: organisasi -> ngo, mahasiswa -> pelajar; iuran_organisasi -> iuran_ngo, iuran_mahasiswa -> iuran_pelajar.
PRAGMA defer_foreign_keys = true;

ALTER TABLE pendaftaran RENAME TO pendaftaran_lama;
ALTER TABLE pendaftaran_bukti RENAME TO pendaftaran_bukti_lama;
ALTER TABLE pembayaran_online RENAME TO pembayaran_online_lama;
ALTER TABLE pengaturan_daftar RENAME TO pengaturan_daftar_lama;

CREATE TABLE pendaftaran (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token_hash TEXT NOT NULL UNIQUE CHECK (length(token_hash) = 64),
  jenis TEXT NOT NULL CHECK (jenis IN ('pelajar','individu','ngo','usaha_kecil','usaha_besar','utama')),
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
INSERT INTO pendaftaran SELECT id, token_hash,
  CASE jenis WHEN 'organisasi' THEN 'ngo' WHEN 'mahasiswa' THEN 'pelajar' ELSE jenis END,
  status, nama, surel, hp, organisasi, kota, prov, rinci, foto_kunci, setuju_pdp, bayar, iuran, tanpa_lunas,
  catatan_admin, akun_id, dibuat, diputus_pada, diputus_oleh FROM pendaftaran_lama;

CREATE TABLE pendaftaran_bukti (
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
INSERT INTO pendaftaran_bukti SELECT * FROM pendaftaran_bukti_lama;

CREATE TABLE pembayaran_online (
  order_id TEXT PRIMARY KEY CHECK (length(order_id) BETWEEN 8 AND 50),
  pendaftaran_id INTEGER NOT NULL REFERENCES pendaftaran(id) ON DELETE CASCADE,
  gross INTEGER NOT NULL CHECK (gross > 0),
  status TEXT NOT NULL DEFAULT 'tertunda' CHECK (status IN ('tertunda','lunas','gagal')),
  dibuat INTEGER NOT NULL DEFAULT (unixepoch()),
  diubah INTEGER
);
INSERT INTO pembayaran_online SELECT * FROM pembayaran_online_lama;

-- Pengaturan diisi admin di /admin (iuran awal per kategori, rekening tujuan); TIDAK ditulis di repo publik. Kosong = tarif resmi bawaan public/data/keanggotaan.json.
CREATE TABLE pengaturan_daftar (
  kunci TEXT PRIMARY KEY CHECK (kunci IN ('iuran_pelajar','iuran_individu','iuran_ngo','iuran_usaha_kecil','iuran_usaha_besar','iuran_utama','rekening_bank','rekening_nomor','rekening_nama','rekening_catatan')),
  nilai TEXT NOT NULL CHECK (length(nilai) <= 300),
  diubah INTEGER NOT NULL DEFAULT (unixepoch()),
  diubah_oleh INTEGER REFERENCES akun(id) ON DELETE SET NULL
);
INSERT INTO pengaturan_daftar SELECT
  CASE kunci WHEN 'iuran_organisasi' THEN 'iuran_ngo' WHEN 'iuran_mahasiswa' THEN 'iuran_pelajar' ELSE kunci END,
  nilai, diubah, diubah_oleh FROM pengaturan_daftar_lama;

-- anak dulu, lalu induk lama (anak lama sudah tidak ada, jadi DROP induk tidak memicu cascade ke tabel baru)
DROP TABLE pembayaran_online_lama;
DROP TABLE pendaftaran_bukti_lama;
DROP TABLE pendaftaran_lama;
DROP TABLE pengaturan_daftar_lama;

CREATE INDEX IF NOT EXISTS pendaftaran_status ON pendaftaran (status, dibuat DESC);
CREATE UNIQUE INDEX IF NOT EXISTS pendaftaran_surel_menunggu ON pendaftaran (surel) WHERE status = 'menunggu';
CREATE INDEX IF NOT EXISTS pendaftaran_bukti_p ON pendaftaran_bukti (pendaftaran_id, status);
