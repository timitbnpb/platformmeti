-- 0019_ikuti_portal.sql: (A) ikuti entitas + penanda "terakhir dilihat"; (B) portal pembaruan data lembaga (klaim organisasi + ajuan, dikurasi admin). Idempoten.
-- ikuti.ref = id publik di data statis (pj_..., ix_..., slug regulasi, kode provinsi 2 digit, id tender). Tanpa FK ke data statis; maks 200 per akun.
-- org_klaim: akun menyatakan terhubung ke organisasi; HANYA status 'setuju' (diputus admin) yang memberi hak mengajukan. Bukti opsional (https).
-- org_ajuan: perubahan profil organisasi / proyek baru / status proyek; isi = JSON terstruktur yang sudah divalidasi Worker (tanpa data pribadi); bukti_url wajib (KP D5).
-- Yang berstatus 'setuju' menjadi lapisan "diperbarui oleh lembaga, dikurasi METI" di profil; data dasar di R2 tidak diubah.
CREATE TABLE IF NOT EXISTS ikuti (
  akun_id INTEGER NOT NULL REFERENCES akun(id) ON DELETE CASCADE,
  jenis TEXT NOT NULL CHECK (jenis IN ('proyek','organisasi','provinsi','regulasi','tender')),
  ref TEXT NOT NULL CHECK (length(ref) BETWEEN 1 AND 80 AND ref NOT GLOB '*[^A-Za-z0-9_.:-]*'),
  dibuat INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (akun_id, jenis, ref)
) WITHOUT ROWID;

CREATE TRIGGER IF NOT EXISTS ikuti_batas
BEFORE INSERT ON ikuti
WHEN (SELECT count(*) FROM ikuti WHERE akun_id = NEW.akun_id) >= 200
BEGIN SELECT RAISE(ABORT, 'ikuti: maksimal 200 per akun'); END;

CREATE TABLE IF NOT EXISTS ikuti_lihat (
  akun_id INTEGER PRIMARY KEY REFERENCES akun(id) ON DELETE CASCADE,
  waktu INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS org_klaim (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  akun_id INTEGER NOT NULL REFERENCES akun(id) ON DELETE CASCADE,
  organisasi_id TEXT NOT NULL CHECK (length(organisasi_id) BETWEEN 2 AND 60 AND organisasi_id NOT GLOB '*[^A-Za-z0-9_-]*'),
  jabatan TEXT CHECK (jabatan IS NULL OR length(jabatan) BETWEEN 1 AND 120),
  bukti_url TEXT CHECK (bukti_url IS NULL OR (bukti_url GLOB 'https://*' AND length(bukti_url) <= 600)),
  status TEXT NOT NULL DEFAULT 'baru' CHECK (status IN ('baru','setuju','tolak')),
  catatan_admin TEXT CHECK (catatan_admin IS NULL OR length(catatan_admin) <= 500),
  dibuat INTEGER NOT NULL DEFAULT (unixepoch()),
  diputus_pada INTEGER,
  diputus_oleh INTEGER REFERENCES akun(id) ON DELETE SET NULL,
  CHECK (status = 'baru' OR (diputus_pada IS NOT NULL AND diputus_oleh IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS org_klaim_status ON org_klaim (status, dibuat DESC);
CREATE UNIQUE INDEX IF NOT EXISTS org_klaim_aktif ON org_klaim (akun_id, organisasi_id) WHERE status IN ('baru','setuju');

CREATE TABLE IF NOT EXISTS org_ajuan (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  akun_id INTEGER NOT NULL REFERENCES akun(id) ON DELETE CASCADE,
  organisasi_id TEXT NOT NULL CHECK (length(organisasi_id) BETWEEN 2 AND 60 AND organisasi_id NOT GLOB '*[^A-Za-z0-9_-]*'),
  jenis TEXT NOT NULL CHECK (jenis IN ('profil','proyek_baru','proyek_status')),
  proyek_id TEXT CHECK (proyek_id IS NULL OR (length(proyek_id) BETWEEN 2 AND 60 AND proyek_id NOT GLOB '*[^A-Za-z0-9_-]*')),
  isi TEXT NOT NULL CHECK (json_valid(isi) AND length(isi) <= 1500),
  bukti_url TEXT NOT NULL CHECK (bukti_url GLOB 'https://*' AND length(bukti_url) <= 600),
  status TEXT NOT NULL DEFAULT 'baru' CHECK (status IN ('baru','setuju','tolak')),
  catatan_admin TEXT CHECK (catatan_admin IS NULL OR length(catatan_admin) <= 500),
  dibuat INTEGER NOT NULL DEFAULT (unixepoch()),
  diputus_pada INTEGER,
  diputus_oleh INTEGER REFERENCES akun(id) ON DELETE SET NULL,
  CHECK (jenis <> 'proyek_status' OR proyek_id IS NOT NULL),
  CHECK (status = 'baru' OR (diputus_pada IS NOT NULL AND diputus_oleh IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS org_ajuan_status ON org_ajuan (status, dibuat DESC);
CREATE INDEX IF NOT EXISTS org_ajuan_org ON org_ajuan (organisasi_id, status, diputus_pada DESC);
CREATE INDEX IF NOT EXISTS org_ajuan_akun ON org_ajuan (akun_id, dibuat DESC);

-- sesi_info: ringkasan perangkat dan lokasi tingkat kota untuk daftar "Perangkat dan sesi aktif" (tabel pendamping sesi; ALTER ADD COLUMN tidak idempoten).
-- Tanpa User-Agent mentah, tanpa IP, tanpa koordinat. Sesi lama tanpa baris di sini tampil "Perangkat tidak dikenal". Ikut terhapus bersama sesinya.
CREATE TABLE IF NOT EXISTS sesi_info (
  id_hash TEXT PRIMARY KEY REFERENCES sesi(id_hash) ON DELETE CASCADE CHECK (length(id_hash) = 64),
  perangkat TEXT CHECK (perangkat IS NULL OR length(perangkat) <= 60),
  jenis TEXT NOT NULL DEFAULT 'desktop' CHECK (jenis IN ('desktop','ponsel','tablet')),
  kota TEXT CHECK (kota IS NULL OR length(kota) <= 60),
  wilayah TEXT CHECK (wilayah IS NULL OR length(wilayah) <= 60),
  negara TEXT CHECK (negara IS NULL OR (length(negara) = 2 AND negara NOT GLOB '*[^A-Z]*'))
) WITHOUT ROWID;

-- wilayah_akun: pengurus METI Wilayah = akun yang ditautkan admin ke SATU provinsi (kode BPS). Dipilih tabel tautan, bukan peran baru, karena CHECK peran di
-- akun (0001) beku dan peran 'wilayah' (kursi provinsi, cakupan_prov) sudah ada; hak mengunggah dicek dari tabel ini di hak.js.
CREATE TABLE IF NOT EXISTS wilayah_akun (
  akun_id INTEGER PRIMARY KEY REFERENCES akun(id) ON DELETE CASCADE,
  kode_prov TEXT NOT NULL CHECK (kode_prov GLOB '[0-9][0-9]'),
  dibuat INTEGER NOT NULL DEFAULT (unixepoch()),
  oleh INTEGER REFERENCES akun(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS wilayah_akun_prov ON wilayah_akun (kode_prov);

-- wilayah_ajuan: data METI Wilayah yang diunggah pengurusnya; antrean kurasi Admin yang sama dengan org_ajuan. Berkas (PDF SK, foto) di R2 BERKAS kunci wilayah/<kode>/<acak>.
-- Foto (pengurus, kegiatan) hanya sah dengan pernyataan persetujuan (persetujuan_foto = 1), dipaksa di sini.
CREATE TABLE IF NOT EXISTS wilayah_ajuan (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  akun_id INTEGER NOT NULL REFERENCES akun(id) ON DELETE CASCADE,
  kode_prov TEXT NOT NULL CHECK (kode_prov GLOB '[0-9][0-9]'),
  jenis TEXT NOT NULL CHECK (jenis IN ('sk','sekretariat','pengurus','bidang','keanggotaan','kegiatan','proyek_potensi')),
  isi TEXT NOT NULL CHECK (json_valid(isi) AND length(isi) <= 3000),
  bukti_url TEXT CHECK (bukti_url IS NULL OR (bukti_url GLOB 'https://*' AND length(bukti_url) <= 600)),
  berkas TEXT CHECK (berkas IS NULL OR (json_valid(berkas) AND length(berkas) <= 400)),
  berkas_kunci TEXT CHECK (berkas_kunci IS NULL OR (berkas_kunci GLOB 'wilayah/[0-9][0-9]/*' AND length(berkas_kunci) <= 80)),
  persetujuan_foto INTEGER NOT NULL DEFAULT 0 CHECK (persetujuan_foto IN (0,1)),
  status TEXT NOT NULL DEFAULT 'baru' CHECK (status IN ('baru','setuju','tolak')),
  catatan_admin TEXT CHECK (catatan_admin IS NULL OR length(catatan_admin) <= 500),
  dibuat INTEGER NOT NULL DEFAULT (unixepoch()),
  diputus_pada INTEGER,
  diputus_oleh INTEGER REFERENCES akun(id) ON DELETE SET NULL,
  CHECK (bukti_url IS NOT NULL OR berkas IS NOT NULL),
  CHECK (jenis <> 'sk' OR berkas IS NOT NULL),
  CHECK ((berkas IS NULL) = (berkas_kunci IS NULL)),
  CHECK (berkas IS NULL OR jenis = 'sk' OR persetujuan_foto = 1),
  CHECK (status = 'baru' OR (diputus_pada IS NOT NULL AND diputus_oleh IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS wilayah_ajuan_status ON wilayah_ajuan (status, dibuat DESC);
CREATE INDEX IF NOT EXISTS wilayah_ajuan_prov ON wilayah_ajuan (kode_prov, status, diputus_pada DESC);

-- profil_tambah: bahasa yang dikuasai (JSON [{nama, tingkat}]) dan kode gambar sampul profil (daftar putih di Worker, bukan CHECK, supaya daftar bisa bertambah).
-- Tabel pendamping profil (0018): ALTER ADD COLUMN tidak idempoten dan CHECK jenis riwayat beku.
CREATE TABLE IF NOT EXISTS profil_tambah (
  akun_id INTEGER PRIMARY KEY REFERENCES akun(id) ON DELETE CASCADE,
  bahasa TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(bahasa) AND length(bahasa) <= 900),
  sampul TEXT CHECK (sampul IS NULL OR (length(sampul) BETWEEN 1 AND 40 AND sampul NOT GLOB '*[^a-z0-9_-]*')),
  diubah INTEGER NOT NULL DEFAULT (unixepoch())
);
