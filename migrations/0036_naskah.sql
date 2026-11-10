-- 0036_naskah.sql: Portal otorisasi METI, konsep dua kunci: Admin memasukkan naskah, Pengurus mengotorisasi dan memberi evaluasi, Anggota hanya melihat yang sah. Idempoten.
-- (0035 sudah dipakai roadmap_masukan, maka nomor ini 0036.) Aturan dua kunci ditegakkan TRIGGER di DB, bukan hanya di JS:
-- pengesah <> pembuat dan berperan pengurus/super; transisi status hanya yang sah; isi beku di luar draf/revisi; tolak/revisi/tarik wajib catatan; catatan append-only.
-- Berkas lampiran di R2 (naskah/<32 hex>.<ext>), tidak pernah di repo atau public/. ref 'nk-<angka>' diisi server.
CREATE TABLE IF NOT EXISTS naskah (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ref TEXT NOT NULL UNIQUE CHECK (ref GLOB 'nk-[0-9]*' AND length(ref) BETWEEN 4 AND 24),
  jenis TEXT NOT NULL CHECK (jenis IN ('notulensi','bahan','kajian','keputusan','laporan','lainnya')),
  judul TEXT NOT NULL CHECK (length(judul) BETWEEN 5 AND 300),
  ringkasan TEXT CHECK (ringkasan IS NULL OR length(ringkasan) <= 1500),
  isi TEXT CHECK (isi IS NULL OR length(isi) <= 40000),
  tanggal TEXT NOT NULL CHECK (tanggal GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]'),
  kunci_r2 TEXT UNIQUE CHECK (kunci_r2 IS NULL OR (kunci_r2 GLOB 'naskah/[0-9a-f]*.*' AND length(kunci_r2) BETWEEN 42 AND 52)),
  tipe TEXT CHECK (tipe IS NULL OR tipe IN ('pdf','pptx','docx','xlsx')),
  ukuran INTEGER CHECK (ukuran IS NULL OR ukuran BETWEEN 1 AND 52428800),
  nama_berkas TEXT CHECK (nama_berkas IS NULL OR length(nama_berkas) BETWEEN 1 AND 200),
  status TEXT NOT NULL DEFAULT 'draf' CHECK (status IN ('draf','menunggu','revisi','disahkan','ditolak','ditarik')),
  versi INTEGER NOT NULL DEFAULT 1 CHECK (versi BETWEEN 1 AND 999),
  oleh INTEGER NOT NULL REFERENCES akun(id),
  penyunting INTEGER REFERENCES akun(id),
  diajukan INTEGER,
  disahkan_oleh INTEGER REFERENCES akun(id),
  disahkan_pada INTEGER,
  dibuat INTEGER DEFAULT (unixepoch()),
  diubah INTEGER,
  CHECK ((kunci_r2 IS NULL) = (tipe IS NULL) AND (kunci_r2 IS NULL) = (ukuran IS NULL) AND (kunci_r2 IS NULL) = (nama_berkas IS NULL)),
  CHECK ((status = 'disahkan') = (disahkan_pada IS NOT NULL) OR status = 'ditarik')
);
CREATE INDEX IF NOT EXISTS naskah_status_tanggal ON naskah (status, tanggal);

-- Berita METI dan Pustaka unggahan juga lewat dua kunci tanpa ALTER: tabel samping konten_otorisasi (satu baris per konten, dibuat/direset TRIGGER pada
-- berita_meti dan pustaka_unggah). Konten lama tanpa baris di sini dianggap sah (tayang sebelum aturan ini). Tak ada status draf: draf tetap terbit=0.
CREATE TABLE IF NOT EXISTS konten_otorisasi (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sumber TEXT NOT NULL CHECK (sumber IN ('berita_meti','pustaka_unggah')),
  ref TEXT NOT NULL CHECK (length(ref) BETWEEN 4 AND 24),
  status TEXT NOT NULL DEFAULT 'menunggu' CHECK (status IN ('menunggu','revisi','disahkan','ditolak')),
  versi INTEGER NOT NULL DEFAULT 1 CHECK (versi BETWEEN 1 AND 999),
  oleh INTEGER REFERENCES akun(id),
  penyunting INTEGER REFERENCES akun(id),
  disahkan_oleh INTEGER REFERENCES akun(id),
  disahkan_pada INTEGER,
  dibuat INTEGER NOT NULL DEFAULT (unixepoch()),
  diubah INTEGER,
  UNIQUE (sumber, ref),
  CHECK ((status = 'disahkan') = (disahkan_pada IS NOT NULL AND disahkan_oleh IS NOT NULL))
);

CREATE TABLE IF NOT EXISTS naskah_catatan (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  naskah_id INTEGER REFERENCES naskah(id),
  otorisasi_id INTEGER REFERENCES konten_otorisasi(id),
  versi INTEGER NOT NULL CHECK (versi BETWEEN 1 AND 999),
  oleh INTEGER NOT NULL REFERENCES akun(id),
  peran TEXT NOT NULL CHECK (peran IN ('anggota','pengurus','kurator','wilayah','admin','super')),
  jenis TEXT NOT NULL CHECK (jenis IN ('ajukan','evaluasi','setujui','tolak','revisi','tarik')),
  isi TEXT CHECK (isi IS NULL OR length(isi) <= 4000),
  kapan INTEGER NOT NULL DEFAULT (unixepoch()),
  CHECK ((naskah_id IS NULL) <> (otorisasi_id IS NULL))
);
CREATE INDEX IF NOT EXISTS naskah_catatan_otorisasi ON naskah_catatan (otorisasi_id, id);
CREATE INDEX IF NOT EXISTS naskah_catatan_naskah ON naskah_catatan (naskah_id, id);

-- naskah baru selalu draf; tak ada pengesahan lewat INSERT
CREATE TRIGGER IF NOT EXISTS naskah_masuk_draf
BEFORE INSERT ON naskah
WHEN NEW.status <> 'draf' OR NEW.disahkan_oleh IS NOT NULL OR NEW.disahkan_pada IS NOT NULL
BEGIN SELECT RAISE(ABORT, 'naskah baru tidak boleh berstatus selain draf'); END;

CREATE TRIGGER IF NOT EXISTS naskah_tanpa_hapus
BEFORE DELETE ON naskah
BEGIN SELECT RAISE(ABORT, 'naskah tidak boleh dihapus'); END;

-- transisi status: draf/revisi -> menunggu; menunggu -> disahkan/ditolak/revisi; disahkan -> ditarik. Selain itu ditolak.
CREATE TRIGGER IF NOT EXISTS naskah_transisi
BEFORE UPDATE OF status ON naskah
WHEN NEW.status <> OLD.status AND NOT (
  (OLD.status IN ('draf','revisi') AND NEW.status = 'menunggu')
  OR (OLD.status = 'menunggu' AND NEW.status IN ('disahkan','ditolak','revisi'))
  OR (OLD.status = 'disahkan' AND NEW.status = 'ditarik'))
BEGIN SELECT RAISE(ABORT, 'transisi status naskah tidak boleh begitu'); END;

-- dua kunci: status jadi disahkan wajib disahkan_oleh terisi, bukan pembuat, dan berperan pengurus atau super
CREATE TRIGGER IF NOT EXISTS naskah_dua_kunci
BEFORE UPDATE ON naskah
WHEN NEW.status = 'disahkan' AND OLD.status = 'menunggu' AND (
  NEW.disahkan_oleh IS NULL OR NEW.disahkan_oleh = NEW.oleh OR NEW.disahkan_oleh IS NEW.penyunting
  OR NOT EXISTS (SELECT 1 FROM akun WHERE id = NEW.disahkan_oleh AND peran IN ('pengurus','super') AND status = 'aktif'))
BEGIN SELECT RAISE(ABORT, 'pengesah tidak boleh selain pengurus atau super dan tidak boleh pembuat atau penyunting naskah'); END;

-- pengesah dan waktu sah tak bisa diubah sesudah sah
CREATE TRIGGER IF NOT EXISTS naskah_sah_tetap
BEFORE UPDATE ON naskah
WHEN OLD.status IN ('disahkan','ditarik') AND (NEW.disahkan_oleh IS NOT OLD.disahkan_oleh OR NEW.disahkan_pada IS NOT OLD.disahkan_pada)
BEGIN SELECT RAISE(ABORT, 'pengesahan naskah tidak boleh diubah'); END;

-- isi, judul, lampiran, pembuat hanya berubah saat draf atau revisi; naskah menunggu/sah/ditolak/ditarik beku
CREATE TRIGGER IF NOT EXISTS naskah_isi_beku
BEFORE UPDATE ON naskah
WHEN OLD.status NOT IN ('draf','revisi') AND (
  NEW.ref IS NOT OLD.ref OR NEW.jenis IS NOT OLD.jenis OR NEW.judul IS NOT OLD.judul OR NEW.ringkasan IS NOT OLD.ringkasan
  OR NEW.isi IS NOT OLD.isi OR NEW.tanggal IS NOT OLD.tanggal OR NEW.kunci_r2 IS NOT OLD.kunci_r2 OR NEW.tipe IS NOT OLD.tipe
  OR NEW.ukuran IS NOT OLD.ukuran OR NEW.nama_berkas IS NOT OLD.nama_berkas OR NEW.oleh IS NOT OLD.oleh)
BEGIN SELECT RAISE(ABORT, 'naskah tidak boleh disunting pada status ini'); END;

-- mengajukan ulang (revisi -> menunggu) menaikkan versi tepat satu; selain itu versi tetap
CREATE TRIGGER IF NOT EXISTS naskah_versi
BEFORE UPDATE OF versi, status ON naskah
WHEN (OLD.status = 'revisi' AND NEW.status = 'menunggu' AND NEW.versi <> OLD.versi + 1)
  OR (NOT (OLD.status = 'revisi' AND NEW.status = 'menunggu') AND NEW.versi <> OLD.versi)
BEGIN SELECT RAISE(ABORT, 'versi naskah tidak boleh selain naik satu saat diajukan ulang'); END;

-- tolak, revisi, tarik wajib disertai catatan (jenis sama, versi sama, tidak kosong) yang sudah tercatat lebih dulu
CREATE TRIGGER IF NOT EXISTS naskah_wajib_catatan
BEFORE UPDATE OF status ON naskah
WHEN NEW.status IN ('ditolak','revisi','ditarik') AND OLD.status <> NEW.status AND NOT EXISTS (
  SELECT 1 FROM naskah_catatan WHERE naskah_id = OLD.id AND versi = OLD.versi AND length(trim(isi)) >= 3
    AND jenis = CASE NEW.status WHEN 'ditolak' THEN 'tolak' WHEN 'revisi' THEN 'revisi' ELSE 'tarik' END)
BEGIN SELECT RAISE(ABORT, 'tolak, revisi, dan tarik tidak boleh tanpa catatan'); END;

-- catatan append-only
CREATE TRIGGER IF NOT EXISTS naskah_catatan_tanpa_ubah
BEFORE UPDATE ON naskah_catatan
BEGIN SELECT RAISE(ABORT, 'catatan naskah tidak boleh diubah'); END;

CREATE TRIGGER IF NOT EXISTS naskah_catatan_tanpa_hapus
BEFORE DELETE ON naskah_catatan
BEGIN SELECT RAISE(ABORT, 'catatan naskah tidak boleh dihapus'); END;

-- tolak/revisi/tarik/evaluasi wajib berisi; keputusan dua kunci hanya oleh pengurus/super yang bukan pembuat; ajukan/tarik hanya admin/super
CREATE TRIGGER IF NOT EXISTS naskah_catatan_isi_wajib
BEFORE INSERT ON naskah_catatan
WHEN NEW.jenis IN ('evaluasi','tolak','revisi','tarik') AND (NEW.isi IS NULL OR length(trim(NEW.isi)) < 3)
BEGIN SELECT RAISE(ABORT, 'catatan tidak boleh kosong'); END;

CREATE TRIGGER IF NOT EXISTS naskah_catatan_kunci_putus
BEFORE INSERT ON naskah_catatan
WHEN NEW.jenis IN ('evaluasi','setujui','tolak','revisi') AND (
  NEW.oleh IN (SELECT oleh FROM naskah WHERE id = NEW.naskah_id UNION SELECT penyunting FROM naskah WHERE id = NEW.naskah_id UNION SELECT oleh FROM konten_otorisasi WHERE id = NEW.otorisasi_id UNION SELECT penyunting FROM konten_otorisasi WHERE id = NEW.otorisasi_id)
  OR NOT EXISTS (SELECT 1 FROM akun WHERE id = NEW.oleh AND peran IN ('pengurus','super')))
BEGIN SELECT RAISE(ABORT, 'keputusan dan evaluasi tidak boleh selain oleh pengurus atau super yang bukan pembuat naskah'); END;

CREATE TRIGGER IF NOT EXISTS naskah_catatan_kunci_masuk
BEFORE INSERT ON naskah_catatan
WHEN NEW.jenis IN ('ajukan','tarik') AND NOT EXISTS (SELECT 1 FROM akun WHERE id = NEW.oleh AND peran IN ('admin','super'))
BEGIN SELECT RAISE(ABORT, 'ajukan dan tarik tidak boleh selain oleh admin atau super'); END;

-- Konten (berita/pustaka): transisi menunggu -> disahkan/ditolak/revisi; revisi/disahkan -> menunggu (disunting ulang, versi naik satu)
CREATE TRIGGER IF NOT EXISTS konten_transisi
BEFORE UPDATE OF status ON konten_otorisasi
WHEN NEW.status <> OLD.status AND NOT (
  (OLD.status = 'menunggu' AND NEW.status IN ('disahkan','ditolak','revisi'))
  OR (OLD.status IN ('revisi','disahkan') AND NEW.status = 'menunggu'))
BEGIN SELECT RAISE(ABORT, 'transisi status konten tidak boleh begitu'); END;

CREATE TRIGGER IF NOT EXISTS konten_dua_kunci
BEFORE UPDATE ON konten_otorisasi
WHEN NEW.status = 'disahkan' AND OLD.status = 'menunggu' AND (
  NEW.disahkan_oleh IS NULL OR NEW.disahkan_oleh IS NEW.oleh OR NEW.disahkan_oleh IS NEW.penyunting
  OR NOT EXISTS (SELECT 1 FROM akun WHERE id = NEW.disahkan_oleh AND peran IN ('pengurus','super') AND status = 'aktif'))
BEGIN SELECT RAISE(ABORT, 'pengesah konten tidak boleh selain pengurus atau super dan tidak boleh pembuatnya'); END;

CREATE TRIGGER IF NOT EXISTS konten_versi
BEFORE UPDATE OF versi, status ON konten_otorisasi
WHEN (OLD.status IN ('revisi','disahkan') AND NEW.status = 'menunggu' AND NEW.versi <> OLD.versi + 1)
  OR (OLD.status = 'menunggu' AND NEW.status = 'menunggu' AND NEW.versi NOT IN (OLD.versi, OLD.versi + 1))
  OR (NOT (NEW.status = 'menunggu' AND OLD.status IN ('menunggu','revisi','disahkan')) AND NEW.versi <> OLD.versi)
BEGIN SELECT RAISE(ABORT, 'versi konten tidak boleh selain naik satu saat disunting atau diajukan ulang'); END;

CREATE TRIGGER IF NOT EXISTS konten_wajib_catatan
BEFORE UPDATE OF status ON konten_otorisasi
WHEN NEW.status IN ('ditolak','revisi') AND OLD.status = 'menunggu' AND NOT EXISTS (
  SELECT 1 FROM naskah_catatan WHERE otorisasi_id = OLD.id AND versi = OLD.versi AND length(trim(isi)) >= 3
    AND jenis = CASE NEW.status WHEN 'ditolak' THEN 'tolak' ELSE 'revisi' END)
BEGIN SELECT RAISE(ABORT, 'tolak dan revisi konten tidak boleh tanpa catatan'); END;

CREATE TRIGGER IF NOT EXISTS konten_tanpa_hapus
BEFORE DELETE ON konten_otorisasi
BEGIN SELECT RAISE(ABORT, 'baris otorisasi konten tidak boleh dihapus'); END;

-- konten baru selalu menunggu; disunting ulang kembali menunggu dan versi naik, juga saat sedang menunggu (konten lama tanpa baris otorisasi ikut masuk antrean)
CREATE TRIGGER IF NOT EXISTS berita_meti_otorisasi_baru
AFTER INSERT ON berita_meti
BEGIN INSERT OR IGNORE INTO konten_otorisasi (sumber, ref, oleh) VALUES ('berita_meti', NEW.ref, NEW.oleh); END;

CREATE TRIGGER IF NOT EXISTS pustaka_unggah_otorisasi_baru
AFTER INSERT ON pustaka_unggah
BEGIN INSERT OR IGNORE INTO konten_otorisasi (sumber, ref, oleh) VALUES ('pustaka_unggah', NEW.ref, NEW.oleh); END;

CREATE TRIGGER IF NOT EXISTS berita_meti_otorisasi_ubah
AFTER UPDATE ON berita_meti
WHEN NEW.jenis IS NOT OLD.jenis OR NEW.judul IS NOT OLD.judul OR NEW.tanggal IS NOT OLD.tanggal OR NEW.media IS NOT OLD.media OR NEW.url IS NOT OLD.url
  OR NEW.ringkasan IS NOT OLD.ringkasan OR NEW.isi IS NOT OLD.isi OR NEW.kota IS NOT OLD.kota OR NEW.penulis IS NOT OLD.penulis
  OR NEW.foto_r2 IS NOT OLD.foto_r2 OR NEW.foto_tipe IS NOT OLD.foto_tipe
BEGIN
  INSERT OR IGNORE INTO konten_otorisasi (sumber, ref, oleh) VALUES ('berita_meti', NEW.ref, NEW.oleh);
  UPDATE konten_otorisasi SET status = 'menunggu', versi = versi + 1, disahkan_oleh = NULL, disahkan_pada = NULL, diubah = unixepoch()
    WHERE sumber = 'berita_meti' AND ref = NEW.ref AND status IN ('menunggu','revisi','disahkan');
END;

CREATE TRIGGER IF NOT EXISTS pustaka_unggah_otorisasi_ubah
AFTER UPDATE ON pustaka_unggah
WHEN NEW.judul IS NOT OLD.judul OR NEW.penerbit IS NOT OLD.penerbit OR NEW.tanggal_terbit IS NOT OLD.tanggal_terbit OR NEW.jenis IS NOT OLD.jenis
  OR NEW.ringkasan IS NOT OLD.ringkasan OR NEW.bahasa IS NOT OLD.bahasa OR NEW.akses IS NOT OLD.akses OR NEW.kunci_r2 IS NOT OLD.kunci_r2
  OR NEW.tipe IS NOT OLD.tipe OR NEW.ukuran IS NOT OLD.ukuran OR NEW.nama_berkas IS NOT OLD.nama_berkas
BEGIN
  INSERT OR IGNORE INTO konten_otorisasi (sumber, ref, oleh) VALUES ('pustaka_unggah', NEW.ref, NEW.oleh);
  UPDATE konten_otorisasi SET status = 'menunggu', versi = versi + 1, disahkan_oleh = NULL, disahkan_pada = NULL, diubah = unixepoch()
    WHERE sumber = 'pustaka_unggah' AND ref = NEW.ref AND status IN ('menunggu','revisi','disahkan');
END;

-- konten_otorisasi dijaga seperti naskah: baris baru hanya menunggu (tak ada baris sah yang disisipkan lebih dulu), identitas beku, pengesahan tetap
CREATE TRIGGER IF NOT EXISTS konten_masuk_menunggu
BEFORE INSERT ON konten_otorisasi
WHEN NEW.status <> 'menunggu' OR NEW.versi <> 1 OR NEW.disahkan_oleh IS NOT NULL OR NEW.disahkan_pada IS NOT NULL
BEGIN SELECT RAISE(ABORT, 'baris otorisasi baru tidak boleh selain menunggu versi satu'); END;

CREATE TRIGGER IF NOT EXISTS konten_identitas_tetap
BEFORE UPDATE ON konten_otorisasi
WHEN NEW.sumber <> OLD.sumber OR NEW.ref <> OLD.ref OR NEW.oleh IS NOT OLD.oleh
BEGIN SELECT RAISE(ABORT, 'sumber, ref, dan pembuat otorisasi tidak boleh diubah'); END;

CREATE TRIGGER IF NOT EXISTS konten_sah_tetap
BEFORE UPDATE ON konten_otorisasi
WHEN OLD.status = 'disahkan' AND NEW.status <> 'menunggu' AND (NEW.disahkan_oleh IS NOT OLD.disahkan_oleh OR NEW.disahkan_pada IS NOT OLD.disahkan_pada OR NEW.status <> OLD.status)
BEGIN SELECT RAISE(ABORT, 'pengesahan konten tidak boleh diubah selain kembali menunggu karena disunting'); END;

CREATE TRIGGER IF NOT EXISTS naskah_oleh_tetap
BEFORE UPDATE ON naskah
WHEN NEW.oleh IS NOT OLD.oleh
BEGIN SELECT RAISE(ABORT, 'pembuat naskah tidak boleh diubah'); END;
