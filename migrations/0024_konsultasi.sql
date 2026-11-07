-- 0024_konsultasi.sql: forum diskusi anggota atas naskah RUU/RPP dan dokumen "Masukan METI" (tab Konsultasi di /regulasi). Idempoten.
-- Seluruh situs di balik login; tamu tidak membaca apa pun di sini. Tulis lewat hak.js (hak konsultasi dan konsultasi_putus) + jejak.
-- kons_dokumen.bentuk: 'naskah' = bab/pasal/ayat hasil pecah naskah yang diunggah; 'butir' = butir bernomor (topik, rujukan pasal, posisi, alasan, status).
-- Berkas asli (PDF/DOCX/teks) di R2 BERKAS kunci konsultasi/<32 hex>.<ext>, privat, hanya keluar lewat rute berautentikasi.
-- Butir Masukan METI 1-22 TIDAK ada di migrasi ini: dimuat admin lewat data/konsultasi/seed_masukan_meti.sql (dibangkitkan scripts/pipa/seed_konsultasi.mjs).
CREATE TABLE IF NOT EXISTS kons_dokumen (
  id TEXT PRIMARY KEY CHECK (length(id) BETWEEN 2 AND 60 AND id NOT GLOB '*[^a-z0-9-]*'),
  judul TEXT NOT NULL CHECK (length(judul) BETWEEN 3 AND 300),
  jenis TEXT NOT NULL CHECK (jenis IN ('ruu','rpp','rperpres','rpermen','masukan')),
  instansi TEXT CHECK (instansi IS NULL OR length(instansi) <= 200),
  tahap TEXT NOT NULL DEFAULT 'konsultasi' CHECK (tahap IN ('usul','pembahasan','konsultasi','disahkan')),
  tenggat TEXT CHECK (tenggat IS NULL OR tenggat GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  sumber_url TEXT CHECK (sumber_url IS NULL OR (sumber_url GLOB 'https://*' AND length(sumber_url) <= 600)),
  catatan TEXT CHECK (catatan IS NULL OR length(catatan) <= 600),
  bentuk TEXT NOT NULL DEFAULT 'naskah' CHECK (bentuk IN ('naskah','butir')),
  status TEXT NOT NULL DEFAULT 'draf' CHECK (status IN ('draf','terbit','arsip')),
  berkas_kunci TEXT CHECK (berkas_kunci IS NULL OR (berkas_kunci GLOB 'konsultasi/[0-9a-f]*' AND length(berkas_kunci) BETWEEN 44 AND 52)),
  berkas_nama TEXT CHECK (berkas_nama IS NULL OR length(berkas_nama) <= 120),
  berkas_tipe TEXT CHECK (berkas_tipe IS NULL OR berkas_tipe IN ('application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document','text/plain')),
  berkas_ukuran INTEGER CHECK (berkas_ukuran IS NULL OR berkas_ukuran BETWEEN 1 AND 15728640),
  oleh INTEGER REFERENCES akun(id) ON DELETE SET NULL,
  dibuat INTEGER NOT NULL DEFAULT (unixepoch()),
  diubah INTEGER
);
CREATE INDEX IF NOT EXISTS kons_dokumen_status ON kons_dokumen (status, tenggat);

CREATE TABLE IF NOT EXISTS kons_bagian (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dokumen_id TEXT NOT NULL REFERENCES kons_dokumen(id) ON DELETE CASCADE,
  urutan INTEGER NOT NULL CHECK (urutan BETWEEN 0 AND 20000),
  tingkat TEXT NOT NULL CHECK (tingkat IN ('bab','pasal','ayat','butir')),
  nomor TEXT CHECK (nomor IS NULL OR length(nomor) <= 40),
  judul TEXT CHECK (judul IS NULL OR length(judul) <= 300),
  teks TEXT NOT NULL DEFAULT '' CHECK (length(teks) <= 20000),
  rujukan TEXT CHECK (rujukan IS NULL OR length(rujukan) <= 200),
  alasan TEXT CHECK (alasan IS NULL OR length(alasan) <= 4000),
  status_asal TEXT CHECK (status_asal IS NULL OR length(status_asal) <= 120),
  sumber_asal TEXT CHECK (sumber_asal IS NULL OR length(sumber_asal) <= 200),
  UNIQUE (dokumen_id, urutan)
);

CREATE TABLE IF NOT EXISTS kons_utas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dokumen_id TEXT NOT NULL REFERENCES kons_dokumen(id) ON DELETE CASCADE,
  bagian_id INTEGER REFERENCES kons_bagian(id) ON DELETE SET NULL,
  jenis TEXT NOT NULL CHECK (jenis IN ('umum','sorot','komentar','ubah','coret','tambah','butir_baru')),
  kutipan TEXT CHECK (kutipan IS NULL OR length(kutipan) BETWEEN 1 AND 1200),
  mulai INTEGER CHECK (mulai IS NULL OR mulai BETWEEN 0 AND 20000),
  akhir INTEGER CHECK (akhir IS NULL OR akhir BETWEEN 0 AND 20000),
  teks_ganti TEXT CHECK (teks_ganti IS NULL OR length(teks_ganti) BETWEEN 1 AND 6000),
  sisip TEXT CHECK (sisip IS NULL OR sisip IN ('sebelum','sesudah')),
  isi TEXT NOT NULL CHECK (length(isi) BETWEEN 1 AND 4000),
  akun_id INTEGER NOT NULL REFERENCES akun(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'terbuka' CHECK (status IN ('terbuka','diterima','ditolak','digabung','ditarik')),
  selesai INTEGER NOT NULL DEFAULT 0 CHECK (selesai IN (0,1)),
  tersembunyi INTEGER NOT NULL DEFAULT 0 CHECK (tersembunyi IN (0,1)),
  putusan TEXT CHECK (putusan IS NULL OR length(putusan) <= 1000),
  gabung_ke INTEGER REFERENCES kons_utas(id) ON DELETE SET NULL,
  diputus_oleh INTEGER REFERENCES akun(id) ON DELETE SET NULL,
  diputus_pada INTEGER,
  dibuat INTEGER NOT NULL DEFAULT (unixepoch()),
  diubah INTEGER,
  CHECK (jenis IN ('umum','butir_baru') OR kutipan IS NOT NULL),
  CHECK (jenis NOT IN ('ubah','tambah','butir_baru') OR teks_ganti IS NOT NULL),
  CHECK (jenis <> 'tambah' OR sisip IS NOT NULL),
  CHECK (status IN ('terbuka','ditarik') OR jenis IN ('ubah','coret','tambah','butir_baru')),
  CHECK (status IN ('terbuka','ditarik') OR (diputus_oleh IS NOT NULL AND diputus_pada IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS kons_utas_dok ON kons_utas (dokumen_id, bagian_id, id);
CREATE INDEX IF NOT EXISTS kons_utas_akun ON kons_utas (akun_id, dibuat DESC);

CREATE TABLE IF NOT EXISTS kons_balasan (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  utas_id INTEGER NOT NULL REFERENCES kons_utas(id) ON DELETE CASCADE,
  akun_id INTEGER NOT NULL REFERENCES akun(id) ON DELETE CASCADE,
  isi TEXT NOT NULL CHECK (length(isi) BETWEEN 1 AND 2000),
  tersembunyi INTEGER NOT NULL DEFAULT 0 CHECK (tersembunyi IN (0,1)),
  ditarik INTEGER NOT NULL DEFAULT 0 CHECK (ditarik IN (0,1)),
  dibuat INTEGER NOT NULL DEFAULT (unixepoch()),
  diubah INTEGER
);
CREATE INDEX IF NOT EXISTS kons_balasan_utas ON kons_balasan (utas_id, id);

-- Dukungan (+1) pada usulan: satu akun satu suara per utas.
CREATE TABLE IF NOT EXISTS kons_dukung (
  utas_id INTEGER NOT NULL REFERENCES kons_utas(id) ON DELETE CASCADE,
  akun_id INTEGER NOT NULL REFERENCES akun(id) ON DELETE CASCADE,
  dibuat INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (utas_id, akun_id)
) WITHOUT ROWID;

-- Sebutan @nama: hanya akun terdaftar dan aktif (divalidasi hak.js). balasan_id 0 = pada utasnya sendiri.
CREATE TABLE IF NOT EXISTS kons_sebut (
  utas_id INTEGER NOT NULL REFERENCES kons_utas(id) ON DELETE CASCADE,
  balasan_id INTEGER NOT NULL DEFAULT 0,
  akun_id INTEGER NOT NULL REFERENCES akun(id) ON DELETE CASCADE,
  dibuat INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (utas_id, balasan_id, akun_id)
) WITHOUT ROWID;
CREATE INDEX IF NOT EXISTS kons_sebut_akun ON kons_sebut (akun_id, dibuat DESC);

-- Dokumen awal (tanpa isi). RUU EBET: naskah belum ada, jadi tampil "Naskah belum diunggah". Masukan METI: berstatus draf sampai butirnya dimuat admin.
INSERT OR IGNORE INTO kons_dokumen (id, judul, jenis, instansi, tahap, sumber_url, catatan, bentuk, status) VALUES
  ('ruu-ebet', 'Rancangan Undang-Undang Energi Baru dan Energi Terbarukan (RUU EBET)', 'ruu', 'DPR RI (Komisi XII)', 'pembahasan',
   'https://www.liputan6.com/bisnis/read/6312024/meti-minta-ruu-ebet-segera-disahkan',
   'Tahap menurut arsip agenda METI dan berita; belum dicek ke situs DPR. Tenggat masukan belum diumumkan.', 'naskah', 'terbit');
INSERT OR IGNORE INTO kons_dokumen (id, judul, jenis, instansi, tahap, sumber_url, catatan, bentuk, status) VALUES
  ('masukan-meti-ruu-ebet', 'Masukan METI atas RUU EBET (RDPU Komisi XII DPR RI, 8 September 2026)', 'masukan', 'DPR RI (Komisi XII)', 'pembahasan',
   'https://www.liputan6.com/bisnis/read/6312024/meti-minta-ruu-ebet-segera-disahkan',
   'Bahan diskusi internal anggota. Butir disampaikan METI pada audiensi/RDPU; usulan anggota yang diterima pengurus menjadi versi baru.', 'butir', 'draf');
