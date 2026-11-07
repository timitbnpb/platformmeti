-- 0027_ikuti_topik.sql: jenis ikuti 'topik' (ref = slug topik). CHECK berubah, jadi ikuti dibangun ulang (data dan trigger dipertahankan). Idempoten: tiap jalan menyalin lalu menukar.
CREATE TABLE IF NOT EXISTS ikuti_baru (
  akun_id INTEGER NOT NULL REFERENCES akun(id) ON DELETE CASCADE,
  jenis TEXT NOT NULL CHECK (jenis IN ('proyek','organisasi','provinsi','regulasi','tender','topik')),
  ref TEXT NOT NULL CHECK (length(ref) BETWEEN 1 AND 80 AND ref NOT GLOB '*[^A-Za-z0-9_.:-]*'),
  dibuat INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (akun_id, jenis, ref)
) WITHOUT ROWID;
INSERT OR IGNORE INTO ikuti_baru (akun_id, jenis, ref, dibuat) SELECT akun_id, jenis, ref, dibuat FROM ikuti;
DROP TABLE ikuti;
ALTER TABLE ikuti_baru RENAME TO ikuti;
CREATE TRIGGER IF NOT EXISTS ikuti_batas
BEFORE INSERT ON ikuti
WHEN (SELECT count(*) FROM ikuti WHERE akun_id = NEW.akun_id) >= 200
BEGIN SELECT RAISE(ABORT, 'ikuti: maksimal 200 per akun'); END;
