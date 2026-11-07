-- 0026_masuk_google.sql: tautan akun ke sub Google (OpenID Connect). Idempoten.
-- Tabel pendamping (ALTER ADD COLUMN tidak idempoten). sub tetap milik satu akun; surel Google berubah tidak membajak akun lain.
CREATE TABLE IF NOT EXISTS akun_google (
  akun_id INTEGER PRIMARY KEY REFERENCES akun(id) ON DELETE CASCADE,
  sub TEXT NOT NULL UNIQUE CHECK (length(sub) BETWEEN 1 AND 255),
  dibuat INTEGER NOT NULL DEFAULT (unixepoch())
);
