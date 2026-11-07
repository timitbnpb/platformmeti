-- 0009_anggota_ubah.sql: penyunting basis Anggota METI dari layar admin. Idempoten.
-- Dasar anggota tetap di R2 (potret/pengurus/anggota_meti.json); perubahan dicatat di sini, ditumpuk berurutan oleh GET.
-- jejak.aksi sudah memuat tambah/ubah/hapus (0002), jadi tidak ada perubahan jejak.
CREATE TABLE IF NOT EXISTS anggota_ubah (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  anggota_id TEXT NOT NULL CHECK (length(anggota_id) BETWEEN 1 AND 80),
  aksi TEXT NOT NULL CHECK (aksi IN ('tambah','ubah','hapus')),
  data TEXT CHECK (data IS NULL OR (json_valid(data) AND length(data) <= 8000)),
  oleh INTEGER,
  dibuat TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  catatan TEXT CHECK (catatan IS NULL OR length(catatan) <= 500)
);
CREATE INDEX IF NOT EXISTS anggota_ubah_anggota ON anggota_ubah (anggota_id);
