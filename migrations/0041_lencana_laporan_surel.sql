-- 0041_lencana_laporan_surel.sql (F65-213..216): lencana verifikasi organisasi, laporan warga atas proyek, pilihan pengingat surel, antrean surel keluar, draf buletin.
-- Idempoten (IF NOT EXISTS). D1 hanya lewat hak.js. Tabel baru, bukan kolom baru: ALTER TABLE ADD COLUMN tidak punya IF NOT EXISTS di SQLite (lihat 0012).
-- Tidak ada pengiriman surel di platform ini (K19: layanan surel belum dipilih). surel_antre hanya DAFTAR yang akan dikirim; tidak ada kode yang mengirimnya.

-- Lencana verifikasi (legalitas, sertifikat, proyek) atas organisasi yang klaimnya disetujui. Alur kiriman 0039: menunggu -> disetujui | ditolak; pengirim boleh menarik.
-- Bukti berupa tautan https ke dokumen organisasi yang sudah terbit di tempat lain; TIDAK ada unggahan dokumen dan tidak ada dokumen identitas pribadi.
CREATE TABLE IF NOT EXISTS lencana (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  akun_id INTEGER NOT NULL REFERENCES akun(id) ON DELETE CASCADE,
  organisasi_id TEXT NOT NULL CHECK (length(organisasi_id) BETWEEN 2 AND 60 AND organisasi_id NOT GLOB '*[^A-Za-z0-9_-]*'),
  jenis TEXT NOT NULL CHECK (jenis IN ('legalitas','sertifikat','proyek')),
  bukti_url TEXT NOT NULL CHECK (bukti_url GLOB 'https://*' AND length(bukti_url) <= 600),
  uraian TEXT NOT NULL CHECK (length(uraian) BETWEEN 10 AND 400),
  status TEXT NOT NULL DEFAULT 'menunggu' CHECK (status IN ('menunggu','disetujui','ditolak','ditarik')),
  alasan TEXT CHECK (alasan IS NULL OR length(alasan) <= 500),
  dibuat INTEGER NOT NULL DEFAULT (unixepoch()),
  diputus_pada INTEGER,
  diputus_oleh INTEGER REFERENCES akun(id) ON DELETE SET NULL,
  CHECK (status IN ('menunggu','ditarik') OR (diputus_pada IS NOT NULL AND diputus_oleh IS NOT NULL)),
  CHECK (status <> 'ditolak' OR alasan IS NOT NULL)
);
-- Satu lencana aktif per organisasi per jenis (siapa pun pengirimnya).
CREATE UNIQUE INDEX IF NOT EXISTS lencana_aktif ON lencana (organisasi_id, jenis) WHERE status IN ('menunggu','disetujui');
CREATE INDEX IF NOT EXISTS lencana_status ON lencana (status, dibuat DESC);

-- Laporan warga atas proyek yang berhenti atau mangkrak. Teks polos; tidak tampil sebelum ditinjau; nama pelapor tidak pernah tampil ke pengguna lain.
CREATE TABLE IF NOT EXISTS laporan_warga (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  akun_id INTEGER NOT NULL REFERENCES akun(id) ON DELETE CASCADE,
  proyek_id TEXT NOT NULL CHECK (length(proyek_id) BETWEEN 2 AND 60 AND proyek_id NOT GLOB '*[^A-Za-z0-9_-]*'),
  isi TEXT NOT NULL CHECK (length(isi) BETWEEN 20 AND 1000),
  status TEXT NOT NULL DEFAULT 'menunggu' CHECK (status IN ('menunggu','disetujui','ditolak','ditarik')),
  alasan TEXT CHECK (alasan IS NULL OR length(alasan) <= 500),
  dibuat INTEGER NOT NULL DEFAULT (unixepoch()),
  diputus_pada INTEGER,
  diputus_oleh INTEGER REFERENCES akun(id) ON DELETE SET NULL,
  CHECK (status IN ('menunggu','ditarik') OR (diputus_pada IS NOT NULL AND diputus_oleh IS NOT NULL)),
  CHECK (status <> 'ditolak' OR alasan IS NOT NULL)
);
CREATE UNIQUE INDEX IF NOT EXISTS laporan_warga_aktif ON laporan_warga (akun_id, proyek_id) WHERE status IN ('menunggu','disetujui');
CREATE INDEX IF NOT EXISTS laporan_warga_status ON laporan_warga (status, dibuat DESC);
CREATE INDEX IF NOT EXISTS laporan_warga_proyek ON laporan_warga (proyek_id, status);

-- Pilihan "kirimi saya surel" PER hal yang diikuti. Tidak ada baris = tidak dikirimi (bawaan mati, termasuk untuk semua yang sudah mengikuti sebelum migrasi ini).
CREATE TABLE IF NOT EXISTS ikuti_surel (
  akun_id INTEGER NOT NULL REFERENCES akun(id) ON DELETE CASCADE,
  jenis TEXT NOT NULL CHECK (jenis IN ('proyek','organisasi','provinsi','regulasi','tender','topik')),
  ref TEXT NOT NULL CHECK (length(ref) BETWEEN 1 AND 80 AND ref NOT GLOB '*[^A-Za-z0-9_.:-]*'),
  dibuat INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (akun_id, jenis, ref)
) WITHOUT ROWID;

-- Penanda pengingat terakhir per akun: butir yang waktunya tidak lebih baru dari ini tidak diantrekan lagi.
CREATE TABLE IF NOT EXISTS surel_penanda (
  akun_id INTEGER PRIMARY KEY REFERENCES akun(id) ON DELETE CASCADE,
  terakhir INTEGER NOT NULL
);

-- Draf buletin mingguan: dirakit cron, diputus admin. Satu draf per minggu ISO.
CREATE TABLE IF NOT EXISTS surel_draf (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  minggu TEXT NOT NULL UNIQUE CHECK (minggu GLOB '[0-9][0-9][0-9][0-9]-W[0-9][0-9]'),
  subjek TEXT NOT NULL CHECK (length(subjek) BETWEEN 3 AND 200),
  isi TEXT NOT NULL CHECK (length(isi) BETWEEN 10 AND 20000),
  status TEXT NOT NULL DEFAULT 'draf' CHECK (status IN ('draf','disetujui','batal')),
  penerima INTEGER CHECK (penerima IS NULL OR penerima >= 0),
  dibuat INTEGER NOT NULL DEFAULT (unixepoch()),
  diputus_pada INTEGER,
  diputus_oleh INTEGER REFERENCES akun(id) ON DELETE SET NULL,
  CHECK (status = 'draf' OR (diputus_pada IS NOT NULL AND diputus_oleh IS NOT NULL))
);

-- Antrean surel keluar. Alamat surel TIDAK disalin ke sini: penerima = akun (pengingat) atau baris langganan (buletin), dibaca saat kirim kelak.
-- kunci unik mencegah antre ganda: 'p:<akun>:<YYYY-MM-DD>' (paling banyak satu pengingat per akun per hari) dan 'b:<draf>:<langganan>'.
CREATE TABLE IF NOT EXISTS surel_antre (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  jenis TEXT NOT NULL CHECK (jenis IN ('pengingat','buletin')),
  akun_id INTEGER REFERENCES akun(id) ON DELETE CASCADE,
  langganan_id INTEGER REFERENCES langganan(id) ON DELETE CASCADE,
  draf_id INTEGER REFERENCES surel_draf(id) ON DELETE CASCADE,
  kunci TEXT NOT NULL UNIQUE CHECK (length(kunci) BETWEEN 3 AND 80),
  subjek TEXT NOT NULL CHECK (length(subjek) BETWEEN 3 AND 200),
  isi TEXT NOT NULL CHECK (length(isi) BETWEEN 10 AND 20000),
  status TEXT NOT NULL DEFAULT 'antre' CHECK (status IN ('antre','terkirim','gagal','batal')),
  dibuat INTEGER NOT NULL DEFAULT (unixepoch()),
  CHECK ((jenis = 'pengingat' AND akun_id IS NOT NULL AND langganan_id IS NULL AND draf_id IS NULL)
      OR (jenis = 'buletin' AND langganan_id IS NOT NULL AND akun_id IS NULL AND draf_id IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS surel_antre_status ON surel_antre (status, jenis, dibuat DESC);

-- Jaring pengaman di D1 (rute juga memeriksa): buletin hanya bisa diantrekan dari draf yang SUDAH disetujui admin, dan hanya ke pelanggan aktif.
CREATE TRIGGER IF NOT EXISTS surel_antre_buletin_sah
BEFORE INSERT ON surel_antre
WHEN NEW.jenis = 'buletin' AND (
  NOT EXISTS (SELECT 1 FROM surel_draf WHERE id = NEW.draf_id AND status = 'disetujui')
  OR NOT EXISTS (SELECT 1 FROM langganan WHERE id = NEW.langganan_id AND status = 'aktif'))
BEGIN SELECT RAISE(ABORT, 'surel_antre tidak boleh: draf belum disetujui atau pelanggan tidak aktif'); END;

-- Pengingat hanya untuk akun aktif yang masih punya minimal satu pilihan surel.
CREATE TRIGGER IF NOT EXISTS surel_antre_pengingat_sah
BEFORE INSERT ON surel_antre
WHEN NEW.jenis = 'pengingat' AND (
  NOT EXISTS (SELECT 1 FROM akun WHERE id = NEW.akun_id AND status = 'aktif')
  OR NOT EXISTS (SELECT 1 FROM ikuti_surel WHERE akun_id = NEW.akun_id))
BEGIN SELECT RAISE(ABORT, 'surel_antre tidak boleh: akun tidak memilih pengingat surel'); END;
