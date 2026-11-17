-- 0042_minat_fakta.sql (F65-303, 302, 306): papan minat REC dan karbon, minat stan pameran, antrean cek fakta.
-- Idempoten (IF NOT EXISTS). D1 hanya lewat hak.js. Tabel baru, bukan kolom baru: ALTER TABLE ADD COLUMN tidak punya IF NOT EXISTS di SQLite (lihat 0012).
-- Alur kiriman 0039: menunggu -> disetujui | ditolak (alasan wajib); pengirim boleh menarik. Hanya yang disetujui tampil ke pengguna lain.
-- Tidak ada uang, harga, atau pembayaran di tiga tabel ini (bawaan C-01 dan C-02): hanya minat.

-- Papan minat REC dan kredit karbon. volume = klaim pengirim per tahun; satuannya mengikuti jenis (rec = MWh, karbon = tCO2e), jadi tidak disimpan.
-- organisasi_id terisi HANYA bila pengirim memilih menampilkan nama organisasinya, dan wajib salah satu klaim organisasinya yang disetujui (dijaga hak.js).
CREATE TABLE IF NOT EXISTS minat_unit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  akun_id INTEGER NOT NULL REFERENCES akun(id) ON DELETE CASCADE,
  jenis TEXT NOT NULL CHECK (jenis IN ('rec','karbon')),
  arah TEXT NOT NULL CHECK (arah IN ('beli','jual')),
  volume INTEGER NOT NULL CHECK (volume BETWEEN 1 AND 1000000000),
  rujukan TEXT CHECK (rujukan IS NULL OR length(rujukan) BETWEEN 2 AND 40),
  prov TEXT NOT NULL CHECK (length(prov) = 2 AND prov NOT GLOB '*[^0-9]*'),
  uraian TEXT NOT NULL CHECK (length(uraian) BETWEEN 10 AND 500),
  organisasi_id TEXT CHECK (organisasi_id IS NULL OR (length(organisasi_id) BETWEEN 2 AND 60 AND organisasi_id NOT GLOB '*[^A-Za-z0-9_-]*')),
  status TEXT NOT NULL DEFAULT 'menunggu' CHECK (status IN ('menunggu','disetujui','ditolak','ditarik')),
  alasan TEXT CHECK (alasan IS NULL OR length(alasan) <= 500),
  dibuat INTEGER NOT NULL DEFAULT (unixepoch()),
  diputus_pada INTEGER,
  diputus_oleh INTEGER REFERENCES akun(id) ON DELETE SET NULL,
  CHECK (status IN ('menunggu','ditarik') OR diputus_pada IS NOT NULL),
  CHECK (status <> 'ditolak' OR alasan IS NOT NULL)
);
-- Satu minat aktif per akun per jenis per arah.
CREATE UNIQUE INDEX IF NOT EXISTS minat_unit_aktif ON minat_unit (akun_id, jenis, arah) WHERE status IN ('menunggu','disetujui');
CREATE INDEX IF NOT EXISTS minat_unit_status ON minat_unit (status, dibuat DESC);

-- Minat stan pameran pada sebuah acara. Tanpa denah, tanpa kuota, tanpa bayar: admin hanya menyetujui atau menolak.
CREATE TABLE IF NOT EXISTS event_stan (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  akun_id INTEGER NOT NULL REFERENCES akun(id) ON DELETE CASCADE,
  event_id TEXT NOT NULL CHECK (length(event_id) BETWEEN 1 AND 80 AND event_id NOT GLOB '*[^a-z0-9-]*'),
  organisasi TEXT NOT NULL CHECK (length(organisasi) BETWEEN 2 AND 120),
  kebutuhan TEXT NOT NULL CHECK (length(kebutuhan) BETWEEN 10 AND 500),
  status TEXT NOT NULL DEFAULT 'menunggu' CHECK (status IN ('menunggu','disetujui','ditolak','ditarik')),
  alasan TEXT CHECK (alasan IS NULL OR length(alasan) <= 500),
  dibuat INTEGER NOT NULL DEFAULT (unixepoch()),
  diputus_pada INTEGER,
  diputus_oleh INTEGER REFERENCES akun(id) ON DELETE SET NULL,
  CHECK (status IN ('menunggu','ditarik') OR diputus_pada IS NOT NULL),
  CHECK (status <> 'ditolak' OR alasan IS NOT NULL)
);
CREATE UNIQUE INDEX IF NOT EXISTS event_stan_aktif ON event_stan (akun_id, event_id) WHERE status IN ('menunggu','disetujui');
CREATE INDEX IF NOT EXISTS event_stan_status ON event_stan (status, dibuat DESC);
-- Jaring pengaman (rute juga memeriksa): minat stan hanya untuk acara yang pengaturannya ada.
CREATE TRIGGER IF NOT EXISTS event_stan_sah
BEFORE INSERT ON event_stan
WHEN NOT EXISTS (SELECT 1 FROM event_atur WHERE event_id = NEW.event_id)
BEGIN SELECT RAISE(ABORT, 'event_stan tidak boleh: acara tanpa pengaturan'); END;

-- Cek fakta klaim energi. Akun mengajukan klaim; redaksi (admin) menulis putusan. status 'disetujui' = SUDAH DIPUTUS dan tampil.
-- Putusan wajib membawa penjelasan dan minimal satu tautan sumber https (sumber = larik JSON). Tidak ada putusan otomatis.
CREATE TABLE IF NOT EXISTS cek_fakta (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  akun_id INTEGER NOT NULL REFERENCES akun(id) ON DELETE CASCADE,
  kutipan TEXT NOT NULL CHECK (length(kutipan) BETWEEN 20 AND 600),
  penutur TEXT NOT NULL CHECK (length(penutur) BETWEEN 2 AND 120),
  sumber_url TEXT NOT NULL CHECK (sumber_url GLOB 'https://*' AND length(sumber_url) <= 600),
  tanggal TEXT NOT NULL CHECK (tanggal GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  status TEXT NOT NULL DEFAULT 'menunggu' CHECK (status IN ('menunggu','disetujui','ditolak','ditarik')),
  alasan TEXT CHECK (alasan IS NULL OR length(alasan) <= 500),
  putusan TEXT CHECK (putusan IS NULL OR putusan IN ('benar','sebagian','keliru','tidak_pasti')),
  penjelasan TEXT CHECK (penjelasan IS NULL OR length(penjelasan) BETWEEN 20 AND 1500),
  sumber TEXT CHECK (sumber IS NULL OR (json_valid(sumber) AND json_array_length(sumber) BETWEEN 1 AND 5)),
  dibuat INTEGER NOT NULL DEFAULT (unixepoch()),
  diputus_pada INTEGER,
  diputus_oleh INTEGER REFERENCES akun(id) ON DELETE SET NULL,
  CHECK (status IN ('menunggu','ditarik') OR diputus_pada IS NOT NULL),
  CHECK (status <> 'ditolak' OR alasan IS NOT NULL),
  CHECK (status <> 'disetujui' OR (putusan IS NOT NULL AND penjelasan IS NOT NULL AND sumber IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS cek_fakta_status ON cek_fakta (status, diputus_pada DESC);
