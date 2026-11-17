-- 0039_kiriman.sql (F65-205..208): nilai kuis akademi di akun, kuis per rekaman, dan tiga kiriman pengguna yang ditinjau admin
-- (foto tonggak proyek, minat listrik hijau, kebutuhan dana proyek). Idempoten (IF NOT EXISTS). D1 hanya lewat hak.js.
-- Tidak ada kiriman pengguna yang masuk public/data atau repo; yang tampil ke pengguna lain hanya baris berstatus 'disetujui'.

-- Nilai kuis terbaik per akun per modul. modul = id modul akademi, atau 'rekaman:<id video>' untuk kuis rekaman.
-- Nilai dihitung SERVER dari jawaban (rute menilai terhadap bank soal), tidak pernah dari angka kiriman klien.
CREATE TABLE IF NOT EXISTS akademi_nilai (
  akun_id INTEGER NOT NULL REFERENCES akun(id) ON DELETE CASCADE,
  modul TEXT NOT NULL CHECK (length(modul) BETWEEN 1 AND 80 AND modul NOT GLOB '*[^A-Za-z0-9:_-]*'),
  persen INTEGER NOT NULL CHECK (persen BETWEEN 0 AND 100),
  lulus INTEGER NOT NULL CHECK (lulus IN (0, 1)),
  diubah INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (akun_id, modul)
) WITHOUT ROWID;

-- Bank soal per rekaman, diisi admin (redaksi). soal = JSON [{ q, o: [..], a }] yang sudah divalidasi hak.js. Tanpa baris = rekaman tanpa kuis.
CREATE TABLE IF NOT EXISTS kuis_rekaman (
  rekaman_id TEXT PRIMARY KEY CHECK (length(rekaman_id) BETWEEN 1 AND 40 AND rekaman_id NOT GLOB '*[^A-Za-z0-9_-]*'),
  soal TEXT NOT NULL CHECK (json_valid(soal) AND length(soal) <= 12000),
  diubah INTEGER NOT NULL DEFAULT (unixepoch()),
  oleh INTEGER REFERENCES akun(id) ON DELETE SET NULL
) WITHOUT ROWID;

-- Foto bukti tonggak proyek. Pengunggah = akun dengan klaim organisasi yang disetujui (organisasi_id dicatat untuk peninjau).
-- kunci = kunci R2 buatan server (tanpa nama berkas pengguna). Foto 'menunggu' hanya terlihat pengirim dan admin (dijaga hak.js).
CREATE TABLE IF NOT EXISTS proyek_foto (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  akun_id INTEGER NOT NULL REFERENCES akun(id) ON DELETE CASCADE,
  organisasi_id TEXT NOT NULL CHECK (length(organisasi_id) BETWEEN 2 AND 60 AND organisasi_id NOT GLOB '*[^A-Za-z0-9_-]*'),
  proyek_id TEXT NOT NULL CHECK (length(proyek_id) BETWEEN 2 AND 60 AND proyek_id NOT GLOB '*[^A-Za-z0-9_-]*'),
  kunci TEXT NOT NULL UNIQUE CHECK (length(kunci) BETWEEN 10 AND 120),
  tipe TEXT NOT NULL CHECK (tipe IN ('image/png','image/jpeg','image/webp')),
  ukuran INTEGER NOT NULL CHECK (ukuran BETWEEN 1 AND 5242880),
  keterangan TEXT NOT NULL CHECK (length(keterangan) BETWEEN 3 AND 300),
  status TEXT NOT NULL DEFAULT 'menunggu' CHECK (status IN ('menunggu','disetujui','ditolak','ditarik')),
  alasan TEXT CHECK (alasan IS NULL OR length(alasan) <= 500),
  dibuat INTEGER NOT NULL DEFAULT (unixepoch()),
  diputus_pada INTEGER,
  diputus_oleh INTEGER REFERENCES akun(id) ON DELETE SET NULL,
  CHECK (status IN ('menunggu','ditarik') OR (diputus_pada IS NOT NULL AND diputus_oleh IS NOT NULL)),
  CHECK (status <> 'ditolak' OR alasan IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS proyek_foto_proyek ON proyek_foto (proyek_id, status);
CREATE INDEX IF NOT EXISTS proyek_foto_status ON proyek_foto (status, dibuat DESC);
CREATE INDEX IF NOT EXISTS proyek_foto_akun ON proyek_foto (akun_id);

-- Minat listrik hijau korporat. Nama perusahaan dan catatan TIDAK pernah keluar ke pengguna lain: publik hanya agregat per provinsi (n >= ambang, dijaga hak.js).
-- Satu kiriman aktif (menunggu atau disetujui) per akun.
CREATE TABLE IF NOT EXISTS permintaan_hijau (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  akun_id INTEGER NOT NULL REFERENCES akun(id) ON DELETE CASCADE,
  perusahaan TEXT NOT NULL CHECK (length(perusahaan) BETWEEN 2 AND 120),
  prov TEXT NOT NULL CHECK (length(prov) = 2 AND prov NOT GLOB '*[^0-9]*'),
  mwh_tahun INTEGER NOT NULL CHECK (mwh_tahun BETWEEN 1 AND 100000000),
  tahun_mulai INTEGER NOT NULL CHECK (tahun_mulai BETWEEN 2000 AND 2100),
  catatan TEXT CHECK (catatan IS NULL OR length(catatan) <= 500),
  status TEXT NOT NULL DEFAULT 'menunggu' CHECK (status IN ('menunggu','disetujui','ditolak','ditarik')),
  alasan TEXT CHECK (alasan IS NULL OR length(alasan) <= 500),
  dibuat INTEGER NOT NULL DEFAULT (unixepoch()),
  diputus_pada INTEGER,
  diputus_oleh INTEGER REFERENCES akun(id) ON DELETE SET NULL,
  CHECK (status IN ('menunggu','ditarik') OR (diputus_pada IS NOT NULL AND diputus_oleh IS NOT NULL)),
  CHECK (status <> 'ditolak' OR alasan IS NOT NULL)
);
CREATE UNIQUE INDEX IF NOT EXISTS permintaan_hijau_aktif ON permintaan_hijau (akun_id) WHERE status IN ('menunggu','disetujui');
CREATE INDEX IF NOT EXISTS permintaan_hijau_status ON permintaan_hijau (status, dibuat DESC);
CREATE INDEX IF NOT EXISTS permintaan_hijau_prov ON permintaan_hijau (prov) WHERE status = 'disetujui';

-- Kebutuhan dana proyek yang dipasang akun berklaim organisasi. Angka adalah KLAIM pengirim (berlabel begitu di layar), bukan data Direktori.
-- Tanpa surel atau telepon: kontak hanya lewat pesan ke sekretariat. Satu kiriman aktif per akun per proyek.
CREATE TABLE IF NOT EXISTS proyek_dana (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  akun_id INTEGER NOT NULL REFERENCES akun(id) ON DELETE CASCADE,
  organisasi_id TEXT NOT NULL CHECK (length(organisasi_id) BETWEEN 2 AND 60 AND organisasi_id NOT GLOB '*[^A-Za-z0-9_-]*'),
  proyek_id TEXT NOT NULL CHECK (length(proyek_id) BETWEEN 2 AND 60 AND proyek_id NOT GLOB '*[^A-Za-z0-9_-]*'),
  jumlah INTEGER NOT NULL CHECK (jumlah BETWEEN 1 AND 1000000000000000),
  mata_uang TEXT NOT NULL CHECK (mata_uang IN ('IDR','USD')),
  jenis TEXT NOT NULL CHECK (jenis IN ('ekuitas','utang','hibah','campuran')),
  uraian TEXT NOT NULL CHECK (length(uraian) BETWEEN 10 AND 600),
  status TEXT NOT NULL DEFAULT 'menunggu' CHECK (status IN ('menunggu','disetujui','ditolak','ditarik')),
  alasan TEXT CHECK (alasan IS NULL OR length(alasan) <= 500),
  dibuat INTEGER NOT NULL DEFAULT (unixepoch()),
  diputus_pada INTEGER,
  diputus_oleh INTEGER REFERENCES akun(id) ON DELETE SET NULL,
  CHECK (status IN ('menunggu','ditarik') OR (diputus_pada IS NOT NULL AND diputus_oleh IS NOT NULL)),
  CHECK (status <> 'ditolak' OR alasan IS NOT NULL)
);
CREATE UNIQUE INDEX IF NOT EXISTS proyek_dana_aktif ON proyek_dana (akun_id, proyek_id) WHERE status IN ('menunggu','disetujui');
CREATE INDEX IF NOT EXISTS proyek_dana_status ON proyek_dana (status, dibuat DESC);
