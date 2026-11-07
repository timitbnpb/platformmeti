-- 0012_pustaka.sql: Pustaka dokumen (unduh bertanggung jawab). Idempoten.
-- Profil tambahan akun dipisah ke tabel sendiri: ALTER TABLE ADD COLUMN tidak punya IF NOT EXISTS di SQLite, jadi tidak bisa idempoten.
CREATE TABLE IF NOT EXISTS akun_profil (
  akun_id INTEGER PRIMARY KEY REFERENCES akun(id) ON DELETE CASCADE,
  instansi TEXT CHECK (instansi IS NULL OR length(instansi) BETWEEN 1 AND 120),
  telepon TEXT CHECK (telepon IS NULL OR (length(telepon) BETWEEN 6 AND 20 AND telepon NOT GLOB '*[^0-9+ ()-]*')),
  diubah INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Log unduhan: satu baris per unduhan. Tanpa IP, tanpa salinan data profil (nama, surel, instansi dibaca lewat akun).
CREATE TABLE IF NOT EXISTS dokumen_unduh (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  akun_id INTEGER REFERENCES akun(id) ON DELETE SET NULL,
  dokumen_id TEXT NOT NULL CHECK (length(dokumen_id) BETWEEN 1 AND 120),
  berkas_id TEXT NOT NULL DEFAULT 'utama' CHECK (length(berkas_id) BETWEEN 1 AND 40),
  tujuan TEXT NOT NULL CHECK (tujuan IN ('riset','kebijakan','bisnis','media','lainnya')),
  via TEXT NOT NULL CHECK (via IN ('r2','sumber')),
  waktu INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS dokumen_unduh_dok ON dokumen_unduh (dokumen_id, waktu DESC);
CREATE INDEX IF NOT EXISTS dokumen_unduh_akun ON dokumen_unduh (akun_id, waktu DESC);

-- Append-only: isi log tidak bisa diubah atau dihapus (akun_id boleh menjadi NULL lewat ON DELETE SET NULL).
CREATE TRIGGER IF NOT EXISTS dokumen_unduh_tanpa_ubah
BEFORE UPDATE OF dokumen_id, berkas_id, tujuan, via, waktu ON dokumen_unduh
BEGIN SELECT RAISE(ABORT, 'log unduhan tidak boleh diubah'); END;

CREATE TRIGGER IF NOT EXISTS dokumen_unduh_tanpa_hapus
BEFORE DELETE ON dokumen_unduh
BEGIN SELECT RAISE(ABORT, 'log unduhan tidak boleh dihapus'); END;
