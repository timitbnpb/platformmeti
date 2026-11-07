-- 0007_program.sql: jenis entitas 'program' (ARSITEKTUR-INFORMASI 7), kategori organisasi K19(d), kelompok orang K19(c),
-- kepakaran dan jalur K16 lewat label, akun.telepon K19(a). Idempoten.
-- SQLite tidak bisa mengubah CHECK, jadi tabel dibangun ulang: cadangkan semua tabel yang terkait, hapus anak lalu induk,
-- buat ulang dengan skema baru, isi dari cadangan, hapus cadangan. Anak ikut dibangun ulang karena DROP induk
-- menjalankan ON DELETE CASCADE / SET NULL walau PRAGMA foreign_keys dimatikan (tidak berlaku dalam transaksi).
-- Aman diputus di tengah: cadangan _cad_* dibuat SEKALI (IF NOT EXISTS; tidak dihapus di awal) dan baru dihapus di akhir.
-- Dijalankan ulang sesudah putus, tabel asal hilang tetapi cadangan masih ada: cadangan dipakai, bukan ditimpa.
-- Dijalankan ulang pada skema baru: cadangan diambil dari skema baru, hasil akhir sama dan tidak ada data hilang.
-- sqlite_sequence dipulihkan supaya id yang sudah dihapus tidak dipakai ulang (jejak.siapa tanpa FK).
-- Pemetaan kategori: riset-kampus ke perguruan-tinggi, lsm-think-tank ke lsm-yayasan, pengembang-teknologi ke swasta,
-- komunitas ke lsm-yayasan. Indeks FTS entitas_cari tidak disentuh (rowid = entitas.id tetap).

CREATE TABLE IF NOT EXISTS _cad_akun AS SELECT a.*, NULL AS telepon FROM akun a;
CREATE TABLE IF NOT EXISTS _cad_sesi AS SELECT * FROM sesi;
CREATE TABLE IF NOT EXISTS _cad_entitas AS SELECT * FROM entitas;
CREATE TABLE IF NOT EXISTS _cad_label AS SELECT l.*, NULL AS utama, NULL AS sumber_id FROM label l;
CREATE TABLE IF NOT EXISTS _cad_alias AS SELECT * FROM alias;
CREATE TABLE IF NOT EXISTS _cad_fakta AS SELECT * FROM fakta;
CREATE TABLE IF NOT EXISTS _cad_ikatan AS SELECT * FROM ikatan;
CREATE TABLE IF NOT EXISTS _cad_riwayat AS SELECT * FROM riwayat;
CREATE TABLE IF NOT EXISTS _cad_koreksi AS SELECT * FROM koreksi;
CREATE TABLE IF NOT EXISTS _cad_seq AS SELECT name, seq FROM sqlite_sequence WHERE name IN ('akun','entitas','alias','fakta','ikatan','riwayat','koreksi');

DROP TABLE IF EXISTS alias;
DROP TABLE IF EXISTS fakta;
DROP TABLE IF EXISTS ikatan;
DROP TABLE IF EXISTS riwayat;
DROP TABLE IF EXISTS koreksi;
DROP TABLE IF EXISTS sesi;
DROP TABLE IF EXISTS label;
DROP TABLE IF EXISTS entitas;
DROP TABLE IF EXISTS akun;

CREATE TABLE IF NOT EXISTS akun (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  surel TEXT NOT NULL COLLATE NOCASE UNIQUE
    CHECK (length(surel) BETWEEN 5 AND 120 AND surel GLOB '*?@?*.?*' AND surel NOT GLOB '* *'),
  nama TEXT NOT NULL CHECK (length(nama) BETWEEN 1 AND 120),
  peran TEXT NOT NULL DEFAULT 'anggota'
    CHECK (peran IN ('anggota','pengurus','kurator','wilayah','admin','super')),
  cakupan_prov TEXT CHECK (cakupan_prov IS NULL OR cakupan_prov GLOB '[0-9][0-9]'),
  bahasa TEXT NOT NULL DEFAULT 'id' CHECK (bahasa IN ('id','en')),
  status TEXT NOT NULL DEFAULT 'menunggu' CHECK (status IN ('menunggu','aktif','nonaktif')),
  garam TEXT CHECK (garam IS NULL OR length(garam) = 32),          -- 16 byte hex
  sandi TEXT CHECK (sandi IS NULL OR length(sandi) = 64),          -- 32 byte hex
  iterasi INTEGER CHECK (iterasi IS NULL OR iterasi >= 100000),
  aktivasi_hash TEXT CHECK (aktivasi_hash IS NULL OR length(aktivasi_hash) = 64),
  aktivasi_sampai INTEGER,
  wajib_ganti INTEGER NOT NULL DEFAULT 0 CHECK (wajib_ganti IN (0,1)),
  masuk_terakhir INTEGER,
  telepon TEXT CHECK (telepon IS NULL OR (length(telepon) BETWEEN 8 AND 20 AND telepon NOT GLOB '*[^0-9+]*')),   -- K19, tidak pernah tampil publik
  dibuat INTEGER NOT NULL DEFAULT (unixepoch()),
  dibuat_oleh INTEGER REFERENCES akun(id),
  CHECK ((peran = 'wilayah') = (cakupan_prov IS NOT NULL)),         -- WL wajib cakupan, peran lain tanpa
  CHECK (status <> 'aktif' OR (garam IS NOT NULL AND sandi IS NOT NULL AND iterasi IS NOT NULL)),
  CHECK ((aktivasi_hash IS NULL) = (aktivasi_sampai IS NULL))
);
CREATE INDEX IF NOT EXISTS akun_peran ON akun (peran, status);

-- Super terakhir tidak boleh diturunkan, dinonaktifkan, atau dihapus (KPV §4).
CREATE TRIGGER IF NOT EXISTS akun_super_terakhir_ubah
BEFORE UPDATE OF peran, status ON akun
WHEN OLD.peran = 'super' AND OLD.status = 'aktif'
 AND (NEW.peran <> 'super' OR NEW.status <> 'aktif')
 AND (SELECT count(*) FROM akun WHERE peran = 'super' AND status = 'aktif' AND id <> OLD.id) = 0
BEGIN SELECT RAISE(ABORT, 'super terakhir tidak boleh diturunkan atau dinonaktifkan'); END;

CREATE TRIGGER IF NOT EXISTS akun_super_terakhir_hapus
BEFORE DELETE ON akun
WHEN OLD.peran = 'super' AND OLD.status = 'aktif'
 AND (SELECT count(*) FROM akun WHERE peran = 'super' AND status = 'aktif' AND id <> OLD.id) = 0
BEGIN SELECT RAISE(ABORT, 'super terakhir tidak boleh dihapus'); END;

CREATE TABLE IF NOT EXISTS sesi (
  id_hash TEXT PRIMARY KEY CHECK (length(id_hash) = 64),            -- SHA-256 token; token mentah tidak disimpan
  akun_id INTEGER NOT NULL REFERENCES akun(id) ON DELETE CASCADE,
  dibuat INTEGER NOT NULL DEFAULT (unixepoch()),
  sampai INTEGER NOT NULL,
  ip_hash TEXT CHECK (ip_hash IS NULL OR length(ip_hash) = 16),
  CHECK (sampai > dibuat)
);
CREATE INDEX IF NOT EXISTS sesi_akun ON sesi (akun_id);
CREATE INDEX IF NOT EXISTS sesi_sampai ON sesi (sampai);

CREATE TABLE IF NOT EXISTS entitas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kunci TEXT NOT NULL UNIQUE CHECK (length(kunci) BETWEEN 5 AND 160 AND kunci GLOB '[a-z]*:*'),
  slug TEXT NOT NULL UNIQUE
    CHECK (length(slug) BETWEEN 2 AND 60 AND slug NOT GLOB '*[^a-z0-9-]*' AND slug NOT GLOB '-*' AND slug NOT GLOB '*-'),
  jenis TEXT NOT NULL CHECK (jenis IN
    ('lembaga','orang','proyek','wilayah','regulasi','publikasi','acara','teknologi','program')),
  kategori TEXT CHECK (kategori IS NULL OR kategori IN
    ('bumn','bumd','swasta','internasional','pemerintah','pemda','perguruan-tinggi','think-tank',
     'lsm-yayasan','donor','asosiasi','keuangan','organisasi-mahasiswa','koperasi')),
  nama TEXT NOT NULL CHECK (length(nama) BETWEEN 1 AND 200),
  nama_en TEXT CHECK (nama_en IS NULL OR length(nama_en) BETWEEN 1 AND 200),
  nama_badan_hukum TEXT CHECK (nama_badan_hukum IS NULL OR length(nama_badan_hukum) <= 200),
  ringkas TEXT CHECK (ringkas IS NULL OR length(ringkas) <= 600),
  ringkas_en TEXT CHECK (ringkas_en IS NULL OR length(ringkas_en) <= 600),
  sektor TEXT CHECK (sektor IS NULL OR sektor IN
    ('surya','bayu','air','panas-bumi','bioenergi','laut','hidrogen','penyimpanan','jaringan',
     'efisiensi','kendaraan-listrik','sampah-energi','nuklir','ccs')),
  prov TEXT CHECK (prov IS NULL OR prov GLOB '[0-9][0-9]' OR prov = 'nasional'),
  lat REAL CHECK (lat IS NULL OR lat BETWEEN -11.5 AND 6.5),
  lon REAL CHECK (lon IS NULL OR lon BETWEEN 94 AND 141.5),
  situs TEXT CHECK (situs IS NULL OR (situs GLOB 'https://*' AND length(situs) <= 300)),
  lapis TEXT NOT NULL DEFAULT 'publik' CHECK (lapis IN ('publik','anggota','pengurus')),
  tampil INTEGER NOT NULL DEFAULT 0 CHECK (tampil IN (0,1)),        -- orang tampil publik hanya bila 1 (KPV §1 butir 2)
  status TEXT NOT NULL DEFAULT 'aktif' CHECK (status IN ('aktif','ditarik','digabung')),
  digabung_ke INTEGER REFERENCES entitas(id),
  di_sensus INTEGER NOT NULL DEFAULT 0 CHECK (di_sensus IN (0,1)),
  anggota_meti INTEGER NOT NULL DEFAULT 0 CHECK (anggota_meti IN (0,1)),  -- lencana, hanya bila Sekretariat konfirmasi (KP D13)
  sumber_id INTEGER NOT NULL REFERENCES sumber(id),                 -- sumber keberadaan entitas
  dibuat INTEGER NOT NULL DEFAULT (unixepoch()),
  diubah INTEGER,
  dibuat_oleh INTEGER,
  CHECK ((lat IS NULL) = (lon IS NULL)),
  CHECK ((status = 'digabung') = (digabung_ke IS NOT NULL)),
  CHECK (digabung_ke IS NULL OR digabung_ke <> id),
  CHECK (jenis = 'lembaga' OR kategori IS NULL),
  CHECK (tampil = 0 OR status = 'aktif'),
  CHECK (di_sensus = 0 OR (jenis = 'lembaga' AND status = 'aktif' AND sektor IN
    ('surya','bayu','air','panas-bumi','bioenergi','laut','hidrogen','penyimpanan','jaringan',
     'efisiensi','kendaraan-listrik','sampah-energi')))
);
CREATE INDEX IF NOT EXISTS entitas_jenis ON entitas (jenis, status);
CREATE INDEX IF NOT EXISTS entitas_sensus ON entitas (di_sensus, sektor, prov);
CREATE INDEX IF NOT EXISTS entitas_prov ON entitas (prov);

-- kunci dan slug tidak pernah berubah setelah dibuat (ALG §1); ganti nama = alias baru.
CREATE TRIGGER IF NOT EXISTS entitas_kunci_tetap
BEFORE UPDATE OF kunci, slug ON entitas
WHEN NEW.kunci <> OLD.kunci OR NEW.slug <> OLD.slug
BEGIN SELECT RAISE(ABORT, 'kunci dan slug entitas tidak boleh diubah'); END;

-- penggabungan tidak boleh berantai: target harus berstatus aktif.
CREATE TRIGGER IF NOT EXISTS entitas_gabung_tanpa_rantai
BEFORE UPDATE OF digabung_ke ON entitas
WHEN NEW.digabung_ke IS NOT NULL
 AND (SELECT status FROM entitas WHERE id = NEW.digabung_ke) IS NOT 'aktif'
BEGIN SELECT RAISE(ABORT, 'penggabungan harus ke entitas aktif'); END;

-- kunci dan slug tidak pernah berubah setelah dibuat (ALG §1); ganti nama = alias baru.
CREATE TRIGGER IF NOT EXISTS entitas_kunci_tetap
BEFORE UPDATE OF kunci, slug ON entitas
WHEN NEW.kunci <> OLD.kunci OR NEW.slug <> OLD.slug
BEGIN SELECT RAISE(ABORT, 'kunci dan slug entitas tidak boleh diubah'); END;

-- penggabungan tidak boleh berantai: target harus berstatus aktif.
CREATE TRIGGER IF NOT EXISTS entitas_gabung_tanpa_rantai
BEFORE UPDATE OF digabung_ke ON entitas
WHEN NEW.digabung_ke IS NOT NULL
 AND (SELECT status FROM entitas WHERE id = NEW.digabung_ke) IS NOT 'aktif'
BEGIN SELECT RAISE(ABORT, 'penggabungan harus ke entitas aktif'); END;

CREATE TABLE IF NOT EXISTS label (
  entitas_id INTEGER NOT NULL REFERENCES entitas(id) ON DELETE CASCADE,
  jenis TEXT NOT NULL CHECK (jenis IN ('sektor','rantai','kepakaran','jalur','kelompok')),
  nilai TEXT NOT NULL,
  utama INTEGER NOT NULL DEFAULT 0 CHECK (utama IN (0,1)),          -- kepakaran utama (K16), satu per orang
  sumber_id INTEGER REFERENCES sumber(id),                          -- wajib untuk kepakaran dan jalur (K16)
  PRIMARY KEY (entitas_id, jenis, nilai),
  CHECK ((jenis = 'sektor' AND nilai IN
    ('surya','bayu','air','panas-bumi','bioenergi','laut','hidrogen','penyimpanan','jaringan',
     'efisiensi','kendaraan-listrik','sampah-energi','nuklir','ccs'))
   OR (jenis = 'rantai' AND nilai IN
    ('bahan-baku','komponen','manufaktur-modul','manufaktur-inverter','manufaktur-baterai','epc',
     'pengembang-ipp','operator','offtaker','pembiaya','konsultan','regulator'))
   OR (jenis = 'kepakaran' AND nilai IN
    ('surya','bayu','hidro','panas-bumi','bioenergi','biomassa-sampah','nuklir','hidrogen','laut',
     'penyimpanan','jaringan','efisiensi','elektrifikasi','karbon','pembiayaan','kebijakan','industri',
     'transisi-adil','riset-data'))
   OR (jenis = 'jalur' AND nilai IN
    ('birokrasi','legislatif','bumn','swasta','asosiasi','akademisi','masyarakat-sipil','keuangan','internasional'))
   OR (jenis = 'kelompok' AND nilai IN
    ('profesional','praktisi','akademisi','think-tank','tokoh-publik','aktivis-tokoh-daerah'))),
  CHECK (jenis NOT IN ('kepakaran','jalur') OR sumber_id IS NOT NULL),
  CHECK (utama = 0 OR jenis = 'kepakaran')
) WITHOUT ROWID;
CREATE UNIQUE INDEX IF NOT EXISTS label_utama_unik ON label (entitas_id) WHERE utama = 1;
CREATE UNIQUE INDEX IF NOT EXISTS label_kelompok_unik ON label (entitas_id) WHERE jenis = 'kelompok';
CREATE TRIGGER IF NOT EXISTS label_jenis_simpul
BEFORE INSERT ON label
WHEN NEW.jenis IN ('jalur','kelompok')
 AND (SELECT jenis FROM entitas WHERE id = NEW.entitas_id) IS NOT 'orang'
BEGIN SELECT RAISE(ABORT, 'jalur dan kelompok hanya untuk orang'); END;
CREATE TRIGGER IF NOT EXISTS label_kepakaran_simpul
BEFORE INSERT ON label
WHEN NEW.jenis = 'kepakaran'
 AND (SELECT jenis FROM entitas WHERE id = NEW.entitas_id) NOT IN ('orang','lembaga')
BEGIN SELECT RAISE(ABORT, 'kepakaran hanya untuk orang atau lembaga'); END;
CREATE TRIGGER IF NOT EXISTS label_kepakaran_maks3
BEFORE INSERT ON label
WHEN NEW.jenis = 'kepakaran'
 AND (SELECT jenis FROM entitas WHERE id = NEW.entitas_id) = 'orang'
 AND (SELECT count(*) FROM label WHERE entitas_id = NEW.entitas_id AND jenis = 'kepakaran') >= 3
BEGIN SELECT RAISE(ABORT, 'kepakaran maksimal 3 per orang'); END;

CREATE TABLE IF NOT EXISTS alias (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entitas_id INTEGER NOT NULL REFERENCES entitas(id) ON DELETE CASCADE,
  nama TEXT NOT NULL CHECK (length(nama) BETWEEN 1 AND 200),
  norm TEXT NOT NULL CHECK (length(norm) BETWEEN 1 AND 200),        -- hasil normNama (ALG §1)
  asal TEXT NOT NULL DEFAULT 'kurator' CHECK (asal IN ('kurator','gabung','singkatan','nama-lama','en')),
  UNIQUE (norm, entitas_id)
);
CREATE INDEX IF NOT EXISTS alias_norm ON alias (norm);

CREATE TABLE IF NOT EXISTS fakta (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entitas_id INTEGER NOT NULL REFERENCES entitas(id) ON DELETE CASCADE,
  kunci TEXT NOT NULL CHECK (length(kunci) BETWEEN 2 AND 40 AND kunci NOT GLOB '*[^a-z0-9_]*'),
  nilai_teks TEXT CHECK (nilai_teks IS NULL OR length(nilai_teks) <= 1000),
  nilai_en TEXT CHECK (nilai_en IS NULL OR length(nilai_en) <= 1000),
  nilai_num REAL,
  satuan TEXT CHECK (satuan IS NULL OR length(satuan) <= 20),
  per_tanggal TEXT NOT NULL CHECK (date(per_tanggal) IS per_tanggal),
  est INTEGER NOT NULL DEFAULT 0 CHECK (est IN (0,1)),
  rumus TEXT CHECK (rumus IS NULL OR length(rumus) <= 300),
  alasan_kosong TEXT CHECK (alasan_kosong IS NULL OR alasan_kosong IN
    ('tidak-dipublikasikan','belum-ada','menunggu-data','belum-dicari')),
  tingkat_bukti TEXT NOT NULL CHECK (tingkat_bukti IN ('terkonfirmasi','kata-pihak','cuplikan','inferensi')),
  lapis TEXT NOT NULL DEFAULT 'publik' CHECK (lapis IN ('publik','anggota','pengurus')),
  sumber_id INTEGER NOT NULL REFERENCES sumber(id),                 -- NOT NULL: fakta tanpa sumber DITOLAK
  dibuat INTEGER NOT NULL DEFAULT (unixepoch()),
  dibuat_oleh INTEGER,
  CHECK (nilai_teks IS NOT NULL OR nilai_num IS NOT NULL OR alasan_kosong IS NOT NULL),
  CHECK (alasan_kosong IS NULL OR (nilai_teks IS NULL AND nilai_num IS NULL)),
  CHECK (nilai_num IS NULL OR satuan IS NOT NULL),
  CHECK (est = 0 OR (rumus IS NOT NULL AND tingkat_bukti = 'inferensi')),   -- EST wajib rumus dan berbukti inferensi
  CHECK (kunci NOT IN ('kontak_surel','kontak_telepon') OR lapis = 'pengurus'),
  CHECK (lapis <> 'publik' OR nilai_teks IS NULL OR
    (nilai_teks NOT GLOB '*?@?*.?*' AND nilai_teks NOT GLOB '*[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]*'))
);
CREATE INDEX IF NOT EXISTS fakta_entitas ON fakta (entitas_id, kunci);
CREATE UNIQUE INDEX IF NOT EXISTS fakta_unik ON fakta (entitas_id, kunci, per_tanggal, sumber_id);

CREATE TABLE IF NOT EXISTS ikatan (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dari INTEGER NOT NULL REFERENCES entitas(id) ON DELETE CASCADE,
  ke INTEGER NOT NULL REFERENCES entitas(id) ON DELETE CASCADE,
  jenis TEXT NOT NULL CHECK (jenis IN
    ('bekerja-di','anggota-dari','afiliasi-dengan','mendanai','mengembangkan','membangun','memiliki',
     'memasok','membeli-dari','mengatur','mengubah','mencabut','berlokasi-di','bermitra-dengan',
     'menulis','memimpin')),
  jenis_pasok TEXT CHECK (jenis_pasok IS NULL OR jenis_pasok IN
    ('bahan-baku','komponen','manufaktur-kontrak','peralatan','energi','perangkat-lunak',
     'jasa-epc','lisensi-teknologi','pembiayaan')),
  rincian TEXT CHECK (rincian IS NULL OR length(rincian) <= 400),
  rincian_en TEXT CHECK (rincian_en IS NULL OR length(rincian_en) <= 400),
  persen REAL CHECK (persen IS NULL OR persen BETWEEN 0 AND 100),
  nilai_num REAL CHECK (nilai_num IS NULL OR nilai_num >= 0),
  satuan TEXT CHECK (satuan IS NULL OR length(satuan) <= 20),
  mulai TEXT CHECK (mulai IS NULL OR date(mulai) IS mulai),
  selesai TEXT CHECK (selesai IS NULL OR date(selesai) IS selesai),
  per_tanggal TEXT NOT NULL CHECK (date(per_tanggal) IS per_tanggal),
  kutipan TEXT CHECK (kutipan IS NULL OR length(kutipan) <= 400),
  tingkat_bukti TEXT NOT NULL CHECK (tingkat_bukti IN ('terkonfirmasi','kata-pihak','cuplikan','inferensi')),
  lapis TEXT NOT NULL DEFAULT 'publik' CHECK (lapis IN ('publik','anggota','pengurus')),
  sumber_id INTEGER NOT NULL REFERENCES sumber(id),                 -- NOT NULL: ikatan tanpa sumber DITOLAK
  dibuat INTEGER NOT NULL DEFAULT (unixepoch()),
  dibuat_oleh INTEGER,
  CHECK (dari <> ke),
  CHECK (selesai IS NULL OR mulai IS NULL OR selesai >= mulai),
  CHECK (jenis_pasok IS NULL OR jenis = 'memasok'),
  CHECK (persen IS NULL OR jenis IN ('memiliki','mendanai','membeli-dari')),
  CHECK (nilai_num IS NULL OR satuan IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS ikatan_dari ON ikatan (dari, jenis);
CREATE INDEX IF NOT EXISTS ikatan_ke ON ikatan (ke, jenis);
CREATE UNIQUE INDEX IF NOT EXISTS ikatan_unik ON ikatan (dari, ke, jenis, COALESCE(mulai, ''), sumber_id);

CREATE TRIGGER IF NOT EXISTS ikatan_pasangan_tambah
BEFORE INSERT ON ikatan
WHEN NOT EXISTS (SELECT 1 FROM pasangan_ikatan p
  JOIN entitas a ON a.id = NEW.dari JOIN entitas b ON b.id = NEW.ke
  WHERE p.jenis = NEW.jenis AND p.dari_jenis = a.jenis AND p.ke_jenis = b.jenis)
BEGIN SELECT RAISE(ABORT, 'pasangan jenis simpul tidak sah untuk jenis ikatan'); END;

CREATE TRIGGER IF NOT EXISTS ikatan_pasangan_ubah
BEFORE UPDATE OF dari, ke, jenis ON ikatan
WHEN NOT EXISTS (SELECT 1 FROM pasangan_ikatan p
  JOIN entitas a ON a.id = NEW.dari JOIN entitas b ON b.id = NEW.ke
  WHERE p.jenis = NEW.jenis AND p.dari_jenis = a.jenis AND p.ke_jenis = b.jenis)
BEGIN SELECT RAISE(ABORT, 'pasangan jenis simpul tidak sah untuk jenis ikatan'); END;

CREATE TABLE IF NOT EXISTS riwayat (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  target_id INTEGER NOT NULL REFERENCES entitas(id) ON DELETE CASCADE,
  jenis TEXT NOT NULL CHECK (jenis IN
    ('undangan','narasumber','audiensi','mou','sponsor','kegiatan','kerja-sama','keanggotaan','lainnya')),
  tanggal TEXT NOT NULL CHECK (date(tanggal) IS tanggal),
  tanggal_selesai TEXT CHECK (tanggal_selesai IS NULL OR (date(tanggal_selesai) IS tanggal_selesai AND tanggal_selesai >= tanggal)),
  judul TEXT NOT NULL CHECK (length(judul) BETWEEN 1 AND 200),
  kegiatan_ref TEXT CHECK (kegiatan_ref IS NULL OR (length(kegiatan_ref) <= 80 AND kegiatan_ref NOT GLOB '*[^a-zA-Z0-9_.:-]*')),
  catatan TEXT CHECK (catatan IS NULL OR length(catatan) <= 2000),
  penilaian INTEGER CHECK (penilaian IS NULL OR penilaian BETWEEN 1 AND 5),
  oleh INTEGER NOT NULL REFERENCES akun(id),
  dibuat INTEGER NOT NULL DEFAULT (unixepoch()),
  diubah INTEGER
);
CREATE INDEX IF NOT EXISTS riwayat_target ON riwayat (target_id, tanggal DESC);
CREATE INDEX IF NOT EXISTS riwayat_kegiatan ON riwayat (kegiatan_ref) WHERE kegiatan_ref IS NOT NULL;

CREATE TRIGGER IF NOT EXISTS riwayat_target_sah
BEFORE INSERT ON riwayat
WHEN (SELECT jenis FROM entitas WHERE id = NEW.target_id) IS NOT NULL
 AND (SELECT jenis FROM entitas WHERE id = NEW.target_id) NOT IN ('orang','lembaga')
BEGIN SELECT RAISE(ABORT, 'riwayat hanya untuk orang atau lembaga'); END;

CREATE TABLE IF NOT EXISTS koreksi (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entitas_id INTEGER NOT NULL REFERENCES entitas(id) ON DELETE CASCADE,
  jenis TEXT NOT NULL CHECK (jenis IN ('ubah','tambah','hapus-data','keluar')),
  kunci TEXT CHECK (kunci IS NULL OR (length(kunci) BETWEEN 2 AND 40 AND kunci NOT GLOB '*[^a-z0-9_]*')),
  usulan TEXT NOT NULL CHECK (length(usulan) BETWEEN 1 AND 2000),
  sumber_url TEXT CHECK (sumber_url IS NULL OR (sumber_url GLOB 'https://*' AND length(sumber_url) <= 600)),
  pengaju_akun INTEGER REFERENCES akun(id) ON DELETE SET NULL,
  pengaju_kontak TEXT CHECK (pengaju_kontak IS NULL OR length(pengaju_kontak) <= 120),   -- hanya terbaca PG, KR, AD, SA
  status TEXT NOT NULL DEFAULT 'baru' CHECK (status IN ('baru','diterima','ditolak','diterapkan')),
  alasan TEXT CHECK (alasan IS NULL OR length(alasan) <= 500),
  ditinjau_oleh INTEGER REFERENCES akun(id) ON DELETE SET NULL,
  ditinjau_pada INTEGER,
  dibuat INTEGER NOT NULL DEFAULT (unixepoch()),
  CHECK (jenis IN ('keluar','hapus-data') OR sumber_url IS NOT NULL),     -- ubah dan tambah wajib bersumber
  CHECK (jenis NOT IN ('ubah','tambah') OR kunci IS NOT NULL),
  CHECK (jenis NOT IN ('keluar','hapus-data') OR pengaju_akun IS NOT NULL OR pengaju_kontak IS NOT NULL),
  CHECK (status = 'baru' OR (ditinjau_oleh IS NOT NULL AND ditinjau_pada IS NOT NULL)),
  CHECK (status <> 'ditolak' OR alasan IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS koreksi_status ON koreksi (status, dibuat);
CREATE INDEX IF NOT EXISTS koreksi_entitas ON koreksi (entitas_id);
-- satu usulan terbuka yang sama per entitas dan pengaju (anti-spam)
CREATE UNIQUE INDEX IF NOT EXISTS koreksi_terbuka_unik
  ON koreksi (entitas_id, jenis, COALESCE(kunci, ''), COALESCE(pengaju_akun, 0)) WHERE status = 'baru';

-- isi ulang dari cadangan (induk dulu; akun dan entitas berurut id, entitas digabung terakhir)
INSERT INTO akun (id, surel, nama, peran, cakupan_prov, bahasa, status, garam, sandi, iterasi, aktivasi_hash, aktivasi_sampai, wajib_ganti, masuk_terakhir, dibuat, dibuat_oleh, telepon)
SELECT id, surel, nama, peran, cakupan_prov, bahasa, status, garam, sandi, iterasi, aktivasi_hash, aktivasi_sampai, wajib_ganti, masuk_terakhir, dibuat, dibuat_oleh, telepon FROM _cad_akun ORDER BY id;
INSERT INTO sesi (id_hash, akun_id, dibuat, sampai, ip_hash)
SELECT id_hash, akun_id, dibuat, sampai, ip_hash FROM _cad_sesi;
INSERT INTO entitas (id, kunci, slug, jenis, kategori, nama, nama_en, nama_badan_hukum, ringkas, ringkas_en, sektor, prov, lat, lon, situs, lapis, tampil, status, digabung_ke, di_sensus, anggota_meti, sumber_id, dibuat, diubah, dibuat_oleh)
SELECT id, kunci, slug, jenis, CASE kategori WHEN 'riset-kampus' THEN 'perguruan-tinggi' WHEN 'lsm-think-tank' THEN 'lsm-yayasan'
    WHEN 'pengembang-teknologi' THEN 'swasta' WHEN 'komunitas' THEN 'lsm-yayasan' ELSE kategori END, nama, nama_en, nama_badan_hukum, ringkas, ringkas_en, sektor, prov, lat, lon, situs, lapis, tampil, status, digabung_ke, di_sensus, anggota_meti, sumber_id, dibuat, diubah, dibuat_oleh FROM _cad_entitas WHERE status <> 'digabung' ORDER BY id;
INSERT INTO entitas (id, kunci, slug, jenis, kategori, nama, nama_en, nama_badan_hukum, ringkas, ringkas_en, sektor, prov, lat, lon, situs, lapis, tampil, status, digabung_ke, di_sensus, anggota_meti, sumber_id, dibuat, diubah, dibuat_oleh)
SELECT id, kunci, slug, jenis, CASE kategori WHEN 'riset-kampus' THEN 'perguruan-tinggi' WHEN 'lsm-think-tank' THEN 'lsm-yayasan'
    WHEN 'pengembang-teknologi' THEN 'swasta' WHEN 'komunitas' THEN 'lsm-yayasan' ELSE kategori END, nama, nama_en, nama_badan_hukum, ringkas, ringkas_en, sektor, prov, lat, lon, situs, lapis, tampil, status, digabung_ke, di_sensus, anggota_meti, sumber_id, dibuat, diubah, dibuat_oleh FROM _cad_entitas WHERE status = 'digabung' ORDER BY id;
INSERT INTO label (entitas_id, jenis, nilai, utama, sumber_id)
SELECT entitas_id, jenis, nilai, COALESCE(utama, 0), sumber_id FROM _cad_label;
INSERT INTO alias (id, entitas_id, nama, norm, asal)
SELECT id, entitas_id, nama, norm, asal FROM _cad_alias;
INSERT INTO fakta (id, entitas_id, kunci, nilai_teks, nilai_en, nilai_num, satuan, per_tanggal, est, rumus, alasan_kosong, tingkat_bukti, lapis, sumber_id, dibuat, dibuat_oleh)
SELECT id, entitas_id, kunci, nilai_teks, nilai_en, nilai_num, satuan, per_tanggal, est, rumus, alasan_kosong, tingkat_bukti, lapis, sumber_id, dibuat, dibuat_oleh FROM _cad_fakta;
INSERT INTO ikatan (id, dari, ke, jenis, jenis_pasok, rincian, rincian_en, persen, nilai_num, satuan, mulai, selesai, per_tanggal, kutipan, tingkat_bukti, lapis, sumber_id, dibuat, dibuat_oleh)
SELECT id, dari, ke, jenis, jenis_pasok, rincian, rincian_en, persen, nilai_num, satuan, mulai, selesai, per_tanggal, kutipan, tingkat_bukti, lapis, sumber_id, dibuat, dibuat_oleh FROM _cad_ikatan;
INSERT INTO riwayat (id, target_id, jenis, tanggal, tanggal_selesai, judul, kegiatan_ref, catatan, penilaian, oleh, dibuat, diubah)
SELECT id, target_id, jenis, tanggal, tanggal_selesai, judul, kegiatan_ref, catatan, penilaian, oleh, dibuat, diubah FROM _cad_riwayat;
INSERT INTO koreksi (id, entitas_id, jenis, kunci, usulan, sumber_url, pengaju_akun, pengaju_kontak, status, alasan, ditinjau_oleh, ditinjau_pada, dibuat)
SELECT id, entitas_id, jenis, kunci, usulan, sumber_url, pengaju_akun, pengaju_kontak, status, alasan, ditinjau_oleh, ditinjau_pada, dibuat FROM _cad_koreksi;

-- FTS dan trigger sinkronnya dibuat SESUDAH isi ulang supaya baris entitas_cari tidak ganda
CREATE TRIGGER IF NOT EXISTS entitas_cari_tambah AFTER INSERT ON entitas
BEGIN
  INSERT INTO entitas_cari (rowid, nama, nama_en, ringkas, alias)
  VALUES (NEW.id, NEW.nama, COALESCE(NEW.nama_en, ''), COALESCE(NEW.ringkas, ''), '');
END;
CREATE TRIGGER IF NOT EXISTS entitas_cari_ubah AFTER UPDATE OF nama, nama_en, ringkas ON entitas
BEGIN
  DELETE FROM entitas_cari WHERE rowid = OLD.id;
  INSERT INTO entitas_cari (rowid, nama, nama_en, ringkas, alias)
  VALUES (NEW.id, NEW.nama, COALESCE(NEW.nama_en, ''), COALESCE(NEW.ringkas, ''),
          COALESCE((SELECT group_concat(nama, ' ') FROM alias WHERE entitas_id = NEW.id), ''));
END;
CREATE TRIGGER IF NOT EXISTS entitas_cari_hapus AFTER DELETE ON entitas
BEGIN DELETE FROM entitas_cari WHERE rowid = OLD.id; END;
CREATE TRIGGER IF NOT EXISTS alias_cari_tambah AFTER INSERT ON alias
BEGIN
  DELETE FROM entitas_cari WHERE rowid = NEW.entitas_id;
  INSERT INTO entitas_cari (rowid, nama, nama_en, ringkas, alias)
  SELECT e.id, e.nama, COALESCE(e.nama_en, ''), COALESCE(e.ringkas, ''),
         COALESCE((SELECT group_concat(nama, ' ') FROM alias WHERE entitas_id = e.id), '')
  FROM entitas e WHERE e.id = NEW.entitas_id;
END;
CREATE TRIGGER IF NOT EXISTS alias_cari_hapus AFTER DELETE ON alias
BEGIN
  DELETE FROM entitas_cari WHERE rowid = OLD.entitas_id;
  INSERT INTO entitas_cari (rowid, nama, nama_en, ringkas, alias)
  SELECT e.id, e.nama, COALESCE(e.nama_en, ''), COALESCE(e.ringkas, ''),
         COALESCE((SELECT group_concat(nama, ' ') FROM alias WHERE entitas_id = e.id), '')
  FROM entitas e WHERE e.id = OLD.entitas_id;
END;


-- id tidak boleh dipakai ulang: seq = max(seq lama, seq sekarang)
UPDATE sqlite_sequence SET seq = MAX(seq, (SELECT s.seq FROM _cad_seq s WHERE s.name = sqlite_sequence.name))
WHERE name IN (SELECT name FROM _cad_seq);
INSERT INTO sqlite_sequence (name, seq) SELECT name, seq FROM _cad_seq WHERE name NOT IN (SELECT name FROM sqlite_sequence);
DROP TABLE IF EXISTS _cad_akun;
DROP TABLE IF EXISTS _cad_sesi;
DROP TABLE IF EXISTS _cad_entitas;
DROP TABLE IF EXISTS _cad_label;
DROP TABLE IF EXISTS _cad_alias;
DROP TABLE IF EXISTS _cad_fakta;
DROP TABLE IF EXISTS _cad_ikatan;
DROP TABLE IF EXISTS _cad_riwayat;
DROP TABLE IF EXISTS _cad_koreksi;
DROP TABLE IF EXISTS _cad_seq;
