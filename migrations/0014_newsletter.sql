-- 0014_newsletter.sql: langganan newsletter METI (ajakan publik, halaman /langganan terbuka untuk tamu). Idempoten.
-- Tanpa IP/user agent. surel disimpan huruf kecil dan unik; token_berhenti acak 64 hex untuk tautan berhenti satu klik.
-- Batas laju memakai tabel laju (0006) dengan kunci ber-hash. jejak (0002) dipakai apa adanya (aksi 'gabung' dan 'cabut').
CREATE TABLE IF NOT EXISTS langganan (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  surel TEXT NOT NULL UNIQUE CHECK (length(surel) BETWEEN 5 AND 254 AND surel = lower(surel) AND instr(surel, '@') > 1),
  nama TEXT NOT NULL CHECK (length(nama) BETWEEN 1 AND 120),
  instansi TEXT CHECK (instansi IS NULL OR length(instansi) BETWEEN 1 AND 160),
  minat TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(minat) AND length(minat) <= 200),
  status TEXT NOT NULL DEFAULT 'aktif' CHECK (status IN ('aktif','berhenti')),
  token_berhenti TEXT NOT NULL UNIQUE CHECK (length(token_berhenti) = 64),
  setuju_pada INTEGER NOT NULL DEFAULT (unixepoch()),            -- bukti persetujuan UU PDP (waktu centang)
  dibuat INTEGER NOT NULL DEFAULT (unixepoch()),
  diubah INTEGER NOT NULL DEFAULT (unixepoch()),
  akun_id INTEGER REFERENCES akun(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS langganan_status ON langganan (status, dibuat DESC);
