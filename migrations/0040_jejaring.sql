-- 0040_jejaring.sql (F65-209..212): minat lowongan, program mentor, forum per bidang. Idempoten (IF NOT EXISTS). D1 hanya lewat hak.js.
-- Pencocokan bisnis (F65-209) dihitung di peramban dari potret yang sudah ada dan tidak punya tabel.
-- Tidak ada CV, dokumen identitas, surel, atau telepon di tabel ini: teks pengguna divalidasi rute (teks() portal menolak surel dan telepon).

-- Minat lowongan (C-03): satu minat per akun per lowongan, pesan singkat opsional. Menarik minat = baris dihapus.
-- Hanya untuk lowongan yang terbit dan belum lewat batas; pemasang tidak bisa meminati lowongannya sendiri.
CREATE TABLE IF NOT EXISTS kerja_minat (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lowongan_id INTEGER NOT NULL REFERENCES lowongan(id) ON DELETE CASCADE,
  akun_id INTEGER NOT NULL REFERENCES akun(id) ON DELETE CASCADE,
  pesan TEXT CHECK (pesan IS NULL OR length(pesan) BETWEEN 1 AND 500),
  dibuat INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE (lowongan_id, akun_id)
);
CREATE INDEX IF NOT EXISTS kerja_minat_akun ON kerja_minat (akun_id, id DESC);
CREATE TRIGGER IF NOT EXISTS kerja_minat_sah
BEFORE INSERT ON kerja_minat
WHEN NOT EXISTS (SELECT 1 FROM lowongan WHERE id = NEW.lowongan_id AND status = 'terbit' AND (batas IS NULL OR batas >= date('now')) AND akun_id <> NEW.akun_id)
BEGIN SELECT RAISE(ABORT, 'kerja_minat tidak boleh: lowongan tutup atau milik sendiri'); END;

-- Mentor (C-04): akun mendaftar, admin meninjau; hanya yang disetujui tampil. Bidang = sembilan bidang kerja METI yang sudah ada.
CREATE TABLE IF NOT EXISTS mentor (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  akun_id INTEGER NOT NULL REFERENCES akun(id) ON DELETE CASCADE,
  bidang TEXT NOT NULL CHECK (bidang IN ('organisasi','advokasi','sdm','pendanaan','umkm','esg','komunikasi','internasional','data')),
  uraian TEXT NOT NULL CHECK (length(uraian) BETWEEN 20 AND 600),
  status TEXT NOT NULL DEFAULT 'menunggu' CHECK (status IN ('menunggu','disetujui','ditolak','ditarik')),
  alasan TEXT CHECK (alasan IS NULL OR length(alasan) <= 500),
  dibuat INTEGER NOT NULL DEFAULT (unixepoch()),
  diputus_pada INTEGER,
  diputus_oleh INTEGER REFERENCES akun(id) ON DELETE SET NULL,
  CHECK (status IN ('menunggu','ditarik') OR (diputus_pada IS NOT NULL AND diputus_oleh IS NOT NULL)),
  CHECK (status <> 'ditolak' OR alasan IS NOT NULL)
);
CREATE UNIQUE INDEX IF NOT EXISTS mentor_aktif ON mentor (akun_id) WHERE status IN ('menunggu','disetujui');
CREATE INDEX IF NOT EXISTS mentor_status ON mentor (status, dibuat DESC);

-- Permintaan mentor: masuk antrean admin; sesudah disetujui baru terlihat mentor yang dituju. Tidak ada pencocokan otomatis.
CREATE TABLE IF NOT EXISTS mentor_minta (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  akun_id INTEGER NOT NULL REFERENCES akun(id) ON DELETE CASCADE,
  mentor_id INTEGER NOT NULL REFERENCES mentor(id) ON DELETE CASCADE,
  pesan TEXT NOT NULL CHECK (length(pesan) BETWEEN 20 AND 600),
  status TEXT NOT NULL DEFAULT 'menunggu' CHECK (status IN ('menunggu','disetujui','ditolak','ditarik')),
  alasan TEXT CHECK (alasan IS NULL OR length(alasan) <= 500),
  dibuat INTEGER NOT NULL DEFAULT (unixepoch()),
  diputus_pada INTEGER,
  diputus_oleh INTEGER REFERENCES akun(id) ON DELETE SET NULL,
  CHECK (status IN ('menunggu','ditarik') OR (diputus_pada IS NOT NULL AND diputus_oleh IS NOT NULL)),
  CHECK (status <> 'ditolak' OR alasan IS NOT NULL)
);
CREATE UNIQUE INDEX IF NOT EXISTS mentor_minta_aktif ON mentor_minta (akun_id, mentor_id) WHERE status IN ('menunggu','disetujui');
CREATE INDEX IF NOT EXISTS mentor_minta_status ON mentor_minta (status, dibuat DESC);
CREATE INDEX IF NOT EXISTS mentor_minta_mentor ON mentor_minta (mentor_id, status);
CREATE TRIGGER IF NOT EXISTS mentor_minta_sah
BEFORE INSERT ON mentor_minta
WHEN NOT EXISTS (SELECT 1 FROM mentor WHERE id = NEW.mentor_id AND status = 'disetujui' AND akun_id <> NEW.akun_id)
BEGIN SELECT RAISE(ABORT, 'mentor_minta tidak boleh: mentor belum disetujui atau diri sendiri'); END;

-- Forum per bidang (C-04): utas dan balasan teks polos, langsung tampil bagi akun masuk; admin menyembunyikan dengan alasan (tercatat di jejak).
CREATE TABLE IF NOT EXISTS forum_utas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bidang TEXT NOT NULL CHECK (bidang IN ('organisasi','advokasi','sdm','pendanaan','umkm','esg','komunikasi','internasional','data')),
  akun_id INTEGER NOT NULL REFERENCES akun(id) ON DELETE CASCADE,
  judul TEXT NOT NULL CHECK (length(judul) BETWEEN 5 AND 160),
  isi TEXT NOT NULL CHECK (length(isi) BETWEEN 10 AND 4000),
  tersembunyi INTEGER NOT NULL DEFAULT 0 CHECK (tersembunyi IN (0,1)),
  alasan TEXT CHECK (alasan IS NULL OR length(alasan) <= 500),
  dibuat INTEGER NOT NULL DEFAULT (unixepoch()),
  CHECK (tersembunyi = 0 OR alasan IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS forum_utas_bidang ON forum_utas (bidang, tersembunyi, id DESC);

CREATE TABLE IF NOT EXISTS forum_balasan (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  utas_id INTEGER NOT NULL REFERENCES forum_utas(id) ON DELETE CASCADE,
  akun_id INTEGER NOT NULL REFERENCES akun(id) ON DELETE CASCADE,
  isi TEXT NOT NULL CHECK (length(isi) BETWEEN 2 AND 2000),
  tersembunyi INTEGER NOT NULL DEFAULT 0 CHECK (tersembunyi IN (0,1)),
  alasan TEXT CHECK (alasan IS NULL OR length(alasan) <= 500),
  dibuat INTEGER NOT NULL DEFAULT (unixepoch()),
  CHECK (tersembunyi = 0 OR alasan IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS forum_balasan_utas ON forum_balasan (utas_id, id);
-- Balasan hanya pada utas yang masih tampil.
CREATE TRIGGER IF NOT EXISTS forum_balasan_sah
BEFORE INSERT ON forum_balasan
WHEN NOT EXISTS (SELECT 1 FROM forum_utas WHERE id = NEW.utas_id AND tersembunyi = 0)
BEGIN SELECT RAISE(ABORT, 'forum_balasan tidak boleh: utas tidak ada atau disembunyikan'); END;

-- Laporan: satu per akun per sasaran. Admin membaca antrean ini lalu memutuskan menyembunyikan atau tidak.
CREATE TABLE IF NOT EXISTS forum_lapor (
  jenis TEXT NOT NULL CHECK (jenis IN ('utas','balasan')),
  sasaran_id INTEGER NOT NULL,
  akun_id INTEGER NOT NULL REFERENCES akun(id) ON DELETE CASCADE,
  alasan TEXT NOT NULL CHECK (length(alasan) BETWEEN 5 AND 300),
  dibuat INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (jenis, sasaran_id, akun_id)
) WITHOUT ROWID;
