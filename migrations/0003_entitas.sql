-- 0003_entitas.sql: kurasi entitas, fakta, ikatan, sumber (JM-D01). Idempoten.
CREATE TABLE IF NOT EXISTS sumber (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url TEXT NOT NULL UNIQUE
    CHECK (length(url) BETWEEN 10 AND 600 AND (url GLOB 'https://*' OR url GLOB 'http://*') AND url NOT GLOB '* *'),
  domain TEXT NOT NULL CHECK (length(domain) BETWEEN 3 AND 120 AND domain NOT GLOB '*[^a-z0-9.-]*'),
  jenis TEXT NOT NULL CHECK (jenis IN
    ('dokumen-resmi','filing','situs-sendiri','media','data-terbuka','via-pihak-ketiga')),
  judul TEXT CHECK (judul IS NULL OR length(judul) <= 300),
  lisensi TEXT CHECK (lisensi IS NULL OR length(lisensi) <= 60),
  tanggal_dokumen TEXT CHECK (tanggal_dokumen IS NULL OR date(tanggal_dokumen) IS tanggal_dokumen),
  diperiksa TEXT NOT NULL CHECK (date(diperiksa) IS diperiksa),
  kutipan TEXT CHECK (kutipan IS NULL OR length(kutipan) <= 400),   -- kutipan beku untuk tooltip, singkat (hak cipta)
  hash TEXT CHECK (hash IS NULL OR length(hash) = 64)
);
CREATE INDEX IF NOT EXISTS sumber_domain ON sumber (domain);

CREATE TABLE IF NOT EXISTS entitas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kunci TEXT NOT NULL UNIQUE CHECK (length(kunci) BETWEEN 5 AND 160 AND kunci GLOB '[a-z]*:*'),
  slug TEXT NOT NULL UNIQUE
    CHECK (length(slug) BETWEEN 2 AND 60 AND slug NOT GLOB '*[^a-z0-9-]*' AND slug NOT GLOB '-*' AND slug NOT GLOB '*-'),
  jenis TEXT NOT NULL CHECK (jenis IN
    ('lembaga','orang','proyek','wilayah','regulasi','publikasi','acara','teknologi')),
  kategori TEXT CHECK (kategori IS NULL OR kategori IN
    ('pemerintah','bumn','swasta','asosiasi','riset-kampus','lsm-think-tank','keuangan',
     'internasional','pengembang-teknologi','komunitas')),
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

CREATE TABLE IF NOT EXISTS label (
  entitas_id INTEGER NOT NULL REFERENCES entitas(id) ON DELETE CASCADE,
  jenis TEXT NOT NULL CHECK (jenis IN ('sektor','rantai')),
  nilai TEXT NOT NULL,
  PRIMARY KEY (entitas_id, jenis, nilai),
  CHECK ((jenis = 'sektor' AND nilai IN
    ('surya','bayu','air','panas-bumi','bioenergi','laut','hidrogen','penyimpanan','jaringan',
     'efisiensi','kendaraan-listrik','sampah-energi','nuklir','ccs'))
   OR (jenis = 'rantai' AND nilai IN
    ('bahan-baku','komponen','manufaktur-modul','manufaktur-inverter','manufaktur-baterai','epc',
     'pengembang-ipp','operator','offtaker','pembiaya','konsultan','regulator')))
) WITHOUT ROWID;

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

CREATE TABLE IF NOT EXISTS pasangan_ikatan (
  jenis TEXT NOT NULL, dari_jenis TEXT NOT NULL, ke_jenis TEXT NOT NULL,
  PRIMARY KEY (jenis, dari_jenis, ke_jenis)
) WITHOUT ROWID;
INSERT OR IGNORE INTO pasangan_ikatan (jenis, dari_jenis, ke_jenis) VALUES
 ('bekerja-di','orang','lembaga'),
 ('anggota-dari','orang','lembaga'), ('anggota-dari','lembaga','lembaga'),
 ('afiliasi-dengan','orang','lembaga'),
 ('mendanai','lembaga','lembaga'), ('mendanai','lembaga','proyek'), ('mendanai','lembaga','publikasi'),
 ('mengembangkan','lembaga','proyek'),
 ('membangun','lembaga','proyek'),
 ('memiliki','lembaga','lembaga'), ('memiliki','lembaga','proyek'),
 ('memasok','lembaga','lembaga'), ('memasok','lembaga','proyek'),
 ('membeli-dari','lembaga','lembaga'), ('membeli-dari','lembaga','proyek'),
 ('mengatur','regulasi','lembaga'), ('mengatur','regulasi','teknologi'),
 ('mengatur','regulasi','wilayah'), ('mengatur','regulasi','proyek'),
 ('mengubah','regulasi','regulasi'),
 ('mencabut','regulasi','regulasi'),
 ('berlokasi-di','lembaga','wilayah'), ('berlokasi-di','proyek','wilayah'),
 ('bermitra-dengan','lembaga','lembaga'),
 ('menulis','orang','publikasi'),
 ('memimpin','orang','lembaga');

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

-- Pencarian entitas: FTS5 mandiri, rowid = entitas.id. Tokenizer tanpa diakritik, awalan 2 dan 3 huruf.
CREATE VIRTUAL TABLE IF NOT EXISTS entitas_cari USING fts5(
  nama, nama_en, ringkas, alias,
  tokenize = 'unicode61 remove_diacritics 2', prefix = '2 3'
);
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
