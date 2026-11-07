-- 0013_event.sql: pendaftaran (RSVP) acara dan pengaturannya. Idempoten. D1 hanya lewat hak.js; tiap tulis dijejak.
-- event_id = slug acara di public/data/kalender.json (bukan FK: kalender hidup di berkas). Kuota dan "terbuka" dijaga trigger (atomik).
CREATE TABLE IF NOT EXISTS event_atur (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id TEXT NOT NULL UNIQUE CHECK (length(event_id) BETWEEN 1 AND 80 AND event_id NOT GLOB '*[^a-z0-9-]*'),
  terbuka INTEGER NOT NULL DEFAULT 0 CHECK (terbuka IN (0,1)),
  kuota INTEGER CHECK (kuota IS NULL OR kuota BETWEEN 1 AND 100000),
  batas TEXT CHECK (batas IS NULL OR batas GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  kontak_nama TEXT CHECK (kontak_nama IS NULL OR length(kontak_nama) <= 120),
  kontak_peran TEXT CHECK (kontak_peran IS NULL OR length(kontak_peran) <= 120),
  kontak_wa TEXT CHECK (kontak_wa IS NULL OR (length(kontak_wa) BETWEEN 6 AND 20 AND kontak_wa NOT GLOB '*[^0-9+ -]*')),
  kontak_surel TEXT CHECK (kontak_surel IS NULL OR (length(kontak_surel) BETWEEN 5 AND 120 AND kontak_surel GLOB '*?@?*.?*' AND kontak_surel NOT GLOB '* *')),
  kontak_setuju INTEGER NOT NULL DEFAULT 0 CHECK (kontak_setuju IN (0,1)),  -- 1 = admin menyetujui kontak ini tampil; 0 = sekretariat METI
  oleh INTEGER REFERENCES akun(id),
  dibuat INTEGER NOT NULL DEFAULT (unixepoch()),
  diubah INTEGER
);

CREATE TABLE IF NOT EXISTS event_daftar (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id TEXT NOT NULL CHECK (length(event_id) BETWEEN 1 AND 80 AND event_id NOT GLOB '*[^a-z0-9-]*'),
  akun_id INTEGER NOT NULL REFERENCES akun(id),
  jumlah INTEGER NOT NULL DEFAULT 1 CHECK (jumlah BETWEEN 1 AND 20),
  instansi TEXT CHECK (instansi IS NULL OR length(instansi) <= 120),
  telepon TEXT CHECK (telepon IS NULL OR (length(telepon) BETWEEN 6 AND 20 AND telepon NOT GLOB '*[^0-9+ -]*')),
  catatan TEXT CHECK (catatan IS NULL OR length(catatan) <= 500),
  status TEXT NOT NULL DEFAULT 'terdaftar' CHECK (status IN ('terdaftar','batal')),
  waktu INTEGER NOT NULL DEFAULT (unixepoch()),
  diubah INTEGER,
  UNIQUE (event_id, akun_id)
);
CREATE INDEX IF NOT EXISTS event_daftar_akun ON event_daftar (akun_id, event_id);

-- Pendaftaran baru atau yang diaktifkan lagi hanya bila pendaftaran terbuka.
CREATE TRIGGER IF NOT EXISTS event_daftar_terbuka_tambah
BEFORE INSERT ON event_daftar
WHEN NEW.status = 'terdaftar' AND NOT EXISTS (SELECT 1 FROM event_atur WHERE event_id = NEW.event_id AND terbuka = 1)
BEGIN SELECT RAISE(ABORT, 'event_daftar tidak boleh: pendaftaran tertutup'); END;

CREATE TRIGGER IF NOT EXISTS event_daftar_terbuka_ubah
BEFORE UPDATE OF status ON event_daftar
WHEN NEW.status = 'terdaftar' AND OLD.status = 'batal' AND NOT EXISTS (SELECT 1 FROM event_atur WHERE event_id = NEW.event_id AND terbuka = 1)
BEGIN SELECT RAISE(ABORT, 'event_daftar tidak boleh: pendaftaran tertutup'); END;

-- Jumlah peserta terdaftar tidak boleh melewati kuota (atomik, juga saat dua permintaan bersamaan).
CREATE TRIGGER IF NOT EXISTS event_daftar_kuota_tambah
BEFORE INSERT ON event_daftar
WHEN NEW.status = 'terdaftar'
 AND (SELECT kuota FROM event_atur WHERE event_id = NEW.event_id) IS NOT NULL
 AND (SELECT coalesce(sum(jumlah), 0) FROM event_daftar WHERE event_id = NEW.event_id AND status = 'terdaftar') + NEW.jumlah
     > (SELECT kuota FROM event_atur WHERE event_id = NEW.event_id)
BEGIN SELECT RAISE(ABORT, 'event_daftar tidak boleh melewati kuota'); END;

CREATE TRIGGER IF NOT EXISTS event_daftar_kuota_ubah
BEFORE UPDATE OF status, jumlah ON event_daftar
WHEN NEW.status = 'terdaftar'
 AND (SELECT kuota FROM event_atur WHERE event_id = NEW.event_id) IS NOT NULL
 AND (SELECT coalesce(sum(jumlah), 0) FROM event_daftar WHERE event_id = NEW.event_id AND status = 'terdaftar' AND id <> NEW.id) + NEW.jumlah
     > (SELECT kuota FROM event_atur WHERE event_id = NEW.event_id)
BEGIN SELECT RAISE(ABORT, 'event_daftar tidak boleh melewati kuota'); END;

-- Golf perdana METI: kuota 216 dan batas pendaftaran 17 Nov 2026 dari API publik METI (api.metiires.or.id/api/events). Kontak = sekretariat.
INSERT OR IGNORE INTO event_atur (event_id, terbuka, kuota, batas, kontak_nama, kontak_peran, kontak_surel, kontak_setuju)
VALUES ('meti-challenge-trophy-golf-2026', 1, 216, '2026-11-17', 'Sekretariat METI', 'Panitia', 'meti.ires@gmail.com', 1);
