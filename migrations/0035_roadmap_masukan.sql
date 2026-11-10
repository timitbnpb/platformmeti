-- 0035_roadmap_masukan.sql: suka dan komentar anggota atas program di /roadmap. Idempoten.
-- program = kunci program statis di public/data/roadmap.json (bukan FK). Tanpa data pribadi selain akun_id.
CREATE TABLE IF NOT EXISTS roadmap_suka (
  program TEXT NOT NULL CHECK (length(program) BETWEEN 1 AND 80),
  akun_id INTEGER NOT NULL REFERENCES akun(id) ON DELETE CASCADE,
  dibuat_pada INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (program, akun_id)
) WITHOUT ROWID;
CREATE TABLE IF NOT EXISTS roadmap_komentar (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  program TEXT NOT NULL CHECK (length(program) BETWEEN 1 AND 80),
  akun_id INTEGER NOT NULL REFERENCES akun(id) ON DELETE CASCADE,
  isi TEXT NOT NULL CHECK (length(isi) BETWEEN 1 AND 1000),
  status TEXT NOT NULL DEFAULT 'tayang' CHECK (status IN ('tayang','disembunyikan')),
  dibuat_pada INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS roadmap_komentar_program ON roadmap_komentar (program, status, dibuat_pada);
