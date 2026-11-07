-- 0010_admin.sql: usulan koreksi publik, statistik harian agregat, konten beranda. Idempoten.
-- Tabel "koreksi" sudah dipakai 0004 (skema lain: entitas_id FK, jenis, usulan); usulan publik bebas-entitas ini bernama koreksi_usul.
-- Tanpa IP/surel/user agent. Batas laju lewat tabel laju (0006) dengan kunci ber-hash. jejak (0002) dipakai apa adanya.
CREATE TABLE IF NOT EXISTS koreksi_usul (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entitas TEXT NOT NULL CHECK (entitas IN ('organisasi','proyek','regulasi','orang')),
  entitas_id TEXT NOT NULL CHECK (length(entitas_id) BETWEEN 1 AND 80),
  kolom TEXT NOT NULL CHECK (length(kolom) BETWEEN 1 AND 60),
  nilai_usulan TEXT NOT NULL CHECK (length(nilai_usulan) BETWEEN 1 AND 2000),
  alasan TEXT NOT NULL CHECK (length(alasan) BETWEEN 1 AND 1000),
  sumber_url TEXT CHECK (sumber_url IS NULL OR (sumber_url GLOB 'https://*' AND length(sumber_url) <= 600)),
  status TEXT NOT NULL DEFAULT 'baru' CHECK (status IN ('baru','setuju','tolak')),
  catatan_admin TEXT CHECK (catatan_admin IS NULL OR length(catatan_admin) <= 500),
  dibuat_pada INTEGER NOT NULL DEFAULT (unixepoch()),
  diputus_pada INTEGER,
  diputus_oleh INTEGER REFERENCES akun(id) ON DELETE SET NULL,
  CHECK (status = 'baru' OR (diputus_pada IS NOT NULL AND diputus_oleh IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS koreksi_usul_status ON koreksi_usul (status, dibuat_pada DESC);

CREATE TABLE IF NOT EXISTS statistik_harian (
  tanggal TEXT NOT NULL CHECK (tanggal GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  jenis TEXT NOT NULL CHECK (jenis IN ('halaman','cari')),
  kunci TEXT NOT NULL CHECK (length(kunci) BETWEEN 1 AND 120),
  jumlah INTEGER NOT NULL DEFAULT 1 CHECK (jumlah >= 1),
  PRIMARY KEY (tanggal, jenis, kunci)
) WITHOUT ROWID;

CREATE TABLE IF NOT EXISTS konten_beranda (
  kunci TEXT PRIMARY KEY CHECK (kunci IN ('sorotan','berita_pilihan','agenda','program')),
  isi TEXT NOT NULL CHECK (json_valid(isi) AND length(isi) <= 20000),
  diubah_pada INTEGER NOT NULL DEFAULT (unixepoch()),
  diubah_oleh INTEGER REFERENCES akun(id) ON DELETE SET NULL
);
