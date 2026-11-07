-- 0016_pesan.sql: chat akun ke admin (utas percakapan + pesan). Idempoten.
-- Pengirim selalu akun yang masuk (seluruh situs di balik login). Lampiran (gambar/PDF, maks 5 MB) disimpan di R2 BERKAS
-- kunci pesan/<utas_id>/<pesan_id>; kolom lampiran hanya metadata JSON {nama, tipe, ukuran}. Tanpa IP.
CREATE TABLE IF NOT EXISTS pesan_utas (
  id TEXT PRIMARY KEY CHECK (length(id) = 16 AND id NOT GLOB '*[^0-9a-f]*'),
  akun_id INTEGER NOT NULL REFERENCES akun(id) ON DELETE CASCADE,
  topik TEXT NOT NULL CHECK (topik IN ('umum','koreksi','keanggotaan','kerja_sama','wilayah','teknis')),
  status TEXT NOT NULL DEFAULT 'baru' CHECK (status IN ('baru','dibalas','selesai')),
  dibuat INTEGER NOT NULL DEFAULT (unixepoch()),
  diubah INTEGER NOT NULL DEFAULT (unixepoch()),
  dibaca_admin INTEGER NOT NULL DEFAULT 0 CHECK (dibaca_admin IN (0,1)),   -- 0 = ada pesan akun yang belum dibuka admin
  dibaca_akun INTEGER NOT NULL DEFAULT 1 CHECK (dibaca_akun IN (0,1))      -- 0 = ada balasan admin yang belum dibuka akun
);
CREATE INDEX IF NOT EXISTS pesan_utas_akun ON pesan_utas (akun_id, diubah DESC);
CREATE INDEX IF NOT EXISTS pesan_utas_status ON pesan_utas (status, diubah DESC);

CREATE TABLE IF NOT EXISTS pesan (
  id TEXT PRIMARY KEY CHECK (length(id) = 16 AND id NOT GLOB '*[^0-9a-f]*'),
  utas_id TEXT NOT NULL REFERENCES pesan_utas(id) ON DELETE CASCADE,
  dari TEXT NOT NULL CHECK (dari IN ('akun','admin')),
  akun_id INTEGER REFERENCES akun(id) ON DELETE SET NULL,                  -- penulis (akun pengirim atau admin yang membalas)
  isi TEXT NOT NULL CHECK (length(isi) BETWEEN 1 AND 2000),
  lampiran TEXT CHECK (lampiran IS NULL OR (json_valid(lampiran) AND length(lampiran) <= 400)),
  waktu INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS pesan_utas_waktu ON pesan (utas_id, waktu);
