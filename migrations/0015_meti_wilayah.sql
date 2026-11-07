-- 0015_meti_wilayah.sql: modul METI Wilayah (status per provinsi + pengajuan pembentukan). Idempoten.
-- meti_wilayah: satu baris per provinsi (kode BPS 2 digit), status dipilih admin. Hanya kontak RESMI kantor (surel/telepon kantor); nomor pribadi tidak punya kolom.
-- meti_wilayah_ajuan: pengajuan pembentukan dari akun login; isi memuat usulan susunan, berkas memuat metadata unggahan R2 (kunci meti-wilayah/<id>/...).
-- Nilai awal: Aspirasi RDPU hlm 4 (8 Sep 2026): 6 berdiri, 5 segera. Angka antar dokumen tidak konsisten; admin yang memilih sumber.
CREATE TABLE IF NOT EXISTS meti_wilayah (
  kode_prov TEXT PRIMARY KEY CHECK (length(kode_prov) = 2 AND kode_prov NOT GLOB '*[^0-9]*'),
  status TEXT NOT NULL DEFAULT 'belum' CHECK (status IN ('berdiri','segera','rencana','belum')),
  ketua TEXT CHECK (ketua IS NULL OR length(ketua) BETWEEN 1 AND 120),
  sekretaris TEXT CHECK (sekretaris IS NULL OR length(sekretaris) BETWEEN 1 AND 120),
  bendahara TEXT CHECK (bendahara IS NULL OR length(bendahara) BETWEEN 1 AND 120),
  sekretariat TEXT CHECK (sekretariat IS NULL OR length(sekretariat) BETWEEN 1 AND 300),
  kontak_surel TEXT CHECK (kontak_surel IS NULL OR (length(kontak_surel) BETWEEN 5 AND 254 AND instr(kontak_surel, '@') > 1)),
  kontak_telp TEXT CHECK (kontak_telp IS NULL OR (length(kontak_telp) BETWEEN 6 AND 20 AND kontak_telp NOT GLOB '*[^0-9+ ()-]*')),
  sk_nomor TEXT CHECK (sk_nomor IS NULL OR length(sk_nomor) BETWEEN 1 AND 120),
  sk_tanggal TEXT CHECK (sk_tanggal IS NULL OR sk_tanggal GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  masa_bakti TEXT CHECK (masa_bakti IS NULL OR length(masa_bakti) BETWEEN 4 AND 40),
  tgl_pelantikan TEXT CHECK (tgl_pelantikan IS NULL OR tgl_pelantikan GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  bidang TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(bidang) AND length(bidang) <= 2000),
  sumber TEXT CHECK (sumber IS NULL OR length(sumber) BETWEEN 1 AND 300),
  status_per TEXT CHECK (status_per IS NULL OR status_per GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  diubah INTEGER NOT NULL DEFAULT (unixepoch()),
  diubah_oleh INTEGER REFERENCES akun(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS meti_wilayah_status ON meti_wilayah (status);

CREATE TABLE IF NOT EXISTS meti_wilayah_ajuan (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kode_prov TEXT NOT NULL CHECK (length(kode_prov) = 2 AND kode_prov NOT GLOB '*[^0-9]*'),
  akun_id INTEGER REFERENCES akun(id) ON DELETE SET NULL,
  isi TEXT NOT NULL CHECK (json_valid(isi) AND length(isi) <= 6000),
  berkas TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(berkas) AND length(berkas) <= 3000),
  status TEXT NOT NULL DEFAULT 'diajukan' CHECK (status IN ('diajukan','ditinjau','sk_terbit','pelantikan','berdiri','ditolak')),
  catatan TEXT CHECK (catatan IS NULL OR length(catatan) <= 1000),
  waktu INTEGER NOT NULL DEFAULT (unixepoch()),
  diubah INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS meti_wilayah_ajuan_prov ON meti_wilayah_ajuan (kode_prov, status);
CREATE INDEX IF NOT EXISTS meti_wilayah_ajuan_akun ON meti_wilayah_ajuan (akun_id, waktu DESC);

-- Nilai awal (tidak menimpa pilihan admin yang sudah ada).
INSERT OR IGNORE INTO meti_wilayah (kode_prov, status, sumber, status_per) VALUES
  ('11', 'berdiri', 'Aspirasi RDPU hlm 4', '2026-09-08'),
  ('12', 'berdiri', 'Aspirasi RDPU hlm 4', '2026-09-08'),
  ('13', 'berdiri', 'Aspirasi RDPU hlm 4', '2026-09-08'),
  ('32', 'berdiri', 'Aspirasi RDPU hlm 4', '2026-09-08'),
  ('71', 'berdiri', 'Aspirasi RDPU hlm 4', '2026-09-08'),
  ('82', 'segera', 'Aspirasi RDPU hlm 4', '2026-09-08'),
  ('31', 'segera', 'Aspirasi RDPU hlm 4', '2026-09-08'),
  ('51', 'segera', 'Aspirasi RDPU hlm 4', '2026-09-08'),
  ('52', 'segera', 'Aspirasi RDPU hlm 4', '2026-09-08'),
  ('53', 'segera', 'Aspirasi RDPU hlm 4', '2026-09-08');
-- Kepri: draft SK progres 21 Jul 2026 (belum bernomor), masa bakti 2026-2028, sekretariat Kampus Polibatam, empat bidang.
INSERT OR IGNORE INTO meti_wilayah (kode_prov, status, sekretariat, masa_bakti, bidang, sumber, status_per) VALUES
  ('21', 'berdiri', 'Kampus Politeknik Negeri Batam (Polibatam), Batam', '2026-2028',
   '["Kebijakan dan kemitraan","Teknologi, riset, dan SDM","Industri, investasi, rantai pasok, UMKM, dan koperasi","Energi kepulauan, ESG, dan masyarakat"]',
   'Aspirasi RDPU hlm 4; draft SK Kepri 21 Jul 2026', '2026-09-08');
