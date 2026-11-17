-- 0038_event_hadir.sql (F65-201..204): tiket dan hadir, penutupan acara, survei pasca acara. Idempoten (IF NOT EXISTS). D1 hanya lewat hak.js.
-- Tabel baru, bukan kolom baru di event_daftar: ALTER TABLE ADD COLUMN tidak punya IF NOT EXISTS di SQLite (lihat 0012).
-- Tiket = token HMAC yang dihitung server dari baris event_daftar (tidak disimpan). Sertifikat = hadir + acara ditutup (tidak disimpan).

-- Satu baris per pendaftaran yang hadir. PRIMARY KEY membuat pencatatan hadir sekali saja secara atomik (INSERT OR IGNORE).
CREATE TABLE IF NOT EXISTS event_hadir (
  daftar_id INTEGER PRIMARY KEY REFERENCES event_daftar(id),
  event_id TEXT NOT NULL CHECK (length(event_id) BETWEEN 1 AND 80 AND event_id NOT GLOB '*[^a-z0-9-]*'),
  hadir_pada INTEGER NOT NULL DEFAULT (unixepoch()),
  oleh INTEGER REFERENCES akun(id)
);
CREATE INDEX IF NOT EXISTS event_hadir_event ON event_hadir (event_id);

-- Hadir hanya untuk pendaftaran yang masih aktif, dan event_id harus sama dengan pendaftarannya.
CREATE TRIGGER IF NOT EXISTS event_hadir_sah
BEFORE INSERT ON event_hadir
WHEN NOT EXISTS (SELECT 1 FROM event_daftar WHERE id = NEW.daftar_id AND event_id = NEW.event_id AND status = 'terdaftar')
BEGIN SELECT RAISE(ABORT, 'event_hadir tidak boleh: pendaftaran tidak aktif'); END;

-- Acara yang sudah ditutup admin: sertifikat dan survei baru terbuka sesudah ini. Baris dihapus = dibuka lagi.
CREATE TABLE IF NOT EXISTS event_tutup (
  event_id TEXT PRIMARY KEY CHECK (length(event_id) BETWEEN 1 AND 80 AND event_id NOT GLOB '*[^a-z0-9-]*'),
  ditutup INTEGER NOT NULL DEFAULT (unixepoch()),
  oleh INTEGER REFERENCES akun(id)
) WITHOUT ROWID;

-- Survei pasca acara: empat butir skala 1-5, SATU jawaban per akun per acara. Tidak pernah dibaca per baris oleh klien; admin hanya menerima agregat (n >= 5, dijaga hak.js).
CREATE TABLE IF NOT EXISTS event_survei (
  event_id TEXT NOT NULL CHECK (length(event_id) BETWEEN 1 AND 80 AND event_id NOT GLOB '*[^a-z0-9-]*'),
  akun_id INTEGER NOT NULL REFERENCES akun(id) ON DELETE CASCADE,
  k_puas INTEGER NOT NULL CHECK (k_puas BETWEEN 1 AND 5),
  k_relevan INTEGER NOT NULL CHECK (k_relevan BETWEEN 1 AND 5),
  k_selenggara INTEGER NOT NULL CHECK (k_selenggara BETWEEN 1 AND 5),
  k_minat INTEGER NOT NULL CHECK (k_minat BETWEEN 1 AND 5),
  dibuat INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (event_id, akun_id)
) WITHOUT ROWID;

-- Jaring pengaman di D1 (rute juga memeriksa): survei hanya dari peserta yang hadir, dan hanya sesudah acara ditutup.
CREATE TRIGGER IF NOT EXISTS event_survei_sah
BEFORE INSERT ON event_survei
WHEN NOT EXISTS (SELECT 1 FROM event_tutup WHERE event_id = NEW.event_id)
  OR NOT EXISTS (SELECT 1 FROM event_hadir h JOIN event_daftar d ON d.id = h.daftar_id WHERE d.event_id = NEW.event_id AND d.akun_id = NEW.akun_id)
BEGIN SELECT RAISE(ABORT, 'event_survei tidak boleh: belum hadir atau acara belum ditutup'); END;

-- Jawaban tidak dapat diubah atau dipindah.
CREATE TRIGGER IF NOT EXISTS event_survei_tetap
BEFORE UPDATE ON event_survei
BEGIN SELECT RAISE(ABORT, 'event_survei tidak boleh diubah'); END;
