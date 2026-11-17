-- 0043_ringkas_iuran.sql (F65-304, F65-301, dan satu jaring tinjauan keamanan). Idempoten (IF NOT EXISTS). D1 hanya lewat hak.js.

-- F65-304: tembolok ringkasan mesin per peraturan. Satu baris per dokumen; versi = "jumlah pasal:jumlah huruf pasal" saat ringkasan dibuat,
-- supaya ringkasan dari teks lama tidak tampil sesudah teks pasal berubah. Tanpa FK ke hukum_dok: seed hukum menghapus lalu mengisi ulang tabel itu.
-- butir = larik JSON [{k: kalimat, p: [label pasal]}] yang SUDAH lolos pemeriksa kutipan server; keluaran model mentah tidak pernah disimpan.
CREATE TABLE IF NOT EXISTS hukum_ringkas (
  dok TEXT PRIMARY KEY CHECK (length(dok) BETWEEN 3 AND 60),
  versi TEXT NOT NULL CHECK (length(versi) BETWEEN 3 AND 40),
  model TEXT NOT NULL CHECK (length(model) BETWEEN 1 AND 100),
  butir TEXT NOT NULL CHECK (json_valid(butir) AND json_array_length(butir) BETWEEN 1 AND 8 AND length(butir) <= 8000),
  dikirim INTEGER NOT NULL CHECK (dikirim >= 1),
  total INTEGER NOT NULL CHECK (total >= dikirim),
  dibuang INTEGER NOT NULL DEFAULT 0 CHECK (dibuang >= 0),
  dibuat INTEGER NOT NULL DEFAULT (unixepoch()),
  oleh INTEGER REFERENCES akun(id) ON DELETE SET NULL
) WITHOUT ROWID;

-- F65-301: pembayaran perpanjangan iuran anggota. gross SELALU dihitung server dari tarif tahunan kategori; tidak pernah dari klien.
-- jalur 'midtrans' (order_id terisi) atau 'bukti' (bukti transfer ditinjau admin). id = nomor urut bukti pembayaran.
-- berlaku_sampai diisi saat lunas = masa berlaku KTA sesudah perpanjangan (untuk bukti pembayaran).
CREATE TABLE IF NOT EXISTS iuran_bayar (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  akun_id INTEGER NOT NULL REFERENCES akun(id) ON DELETE CASCADE,
  kta_id INTEGER NOT NULL REFERENCES kta(id) ON DELETE CASCADE,
  jalur TEXT NOT NULL CHECK (jalur IN ('midtrans','bukti')),
  order_id TEXT UNIQUE CHECK (order_id IS NULL OR (length(order_id) BETWEEN 8 AND 50 AND substr(order_id, 1, 3) = 'IU-')),
  bukti_kunci TEXT CHECK (bukti_kunci IS NULL OR length(bukti_kunci) <= 80),
  bukti_tipe TEXT CHECK (bukti_tipe IS NULL OR length(bukti_tipe) <= 40),
  jenis TEXT NOT NULL CHECK (length(jenis) BETWEEN 1 AND 20),
  gross INTEGER NOT NULL CHECK (gross > 0),
  status TEXT NOT NULL DEFAULT 'menunggu' CHECK (status IN ('menunggu','lunas','gagal','ditolak')),
  berlaku_sampai TEXT CHECK (berlaku_sampai IS NULL OR berlaku_sampai GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  alasan TEXT CHECK (alasan IS NULL OR length(alasan) <= 500),
  dibuat INTEGER NOT NULL DEFAULT (unixepoch()),
  diputus_pada INTEGER,
  diputus_oleh INTEGER REFERENCES akun(id) ON DELETE SET NULL,
  CHECK ((jalur = 'midtrans') = (order_id IS NOT NULL)),
  CHECK ((jalur = 'bukti') = (bukti_kunci IS NOT NULL)),
  CHECK (status = 'menunggu' OR diputus_pada IS NOT NULL),
  CHECK (status <> 'ditolak' OR alasan IS NOT NULL)
);
-- Satu bukti transfer yang menunggu per akun (atomik); pesanan Midtrans yang menunggu boleh lebih dari satu (pengguna menutup jendela bayar lalu mencoba lagi).
CREATE UNIQUE INDEX IF NOT EXISTS iuran_bayar_bukti_aktif ON iuran_bayar (akun_id) WHERE status = 'menunggu' AND jalur = 'bukti';
CREATE INDEX IF NOT EXISTS iuran_bayar_akun ON iuran_bayar (akun_id, id DESC);
CREATE INDEX IF NOT EXISTS iuran_bayar_status ON iuran_bayar (status, jalur, id);

-- Tinjauan keamanan rumpun minat (15 Nov 2026): minat stan tidak boleh masuk untuk acara yang sudah ditutup admin (rute juga memeriksa).
CREATE TRIGGER IF NOT EXISTS event_stan_belum_tutup
BEFORE INSERT ON event_stan
WHEN EXISTS (SELECT 1 FROM event_tutup WHERE event_id = NEW.event_id)
BEGIN SELECT RAISE(ABORT, 'event_stan tidak boleh: acara sudah ditutup'); END;
