-- 0020_lalu_lintas.sql: lalu lintas "orang dan AI, dihitung terpisah" (tab Statistik /admin). Idempoten.
-- Tiru poskokarhutla (stat_hari/stat_tamu/stat_garam/stat_ip), disederhanakan: satu tabel penghitung (tgl, dim, kunci) -> n.
-- Tanpa IP, tanpa cookie pelacak, tanpa baris per pengunjung. Pengunjung unik = 16 hex SHA-256(garam harian | IP | UA); garam hari
-- lalu dimusnahkan, jadi hash kemarin tak bisa dicocokkan lagi. Hit dihitung di Worker SEBELUM gerbang masuk (bot menabrak /masuk tetap tercatat).
-- dim: jenis (orang, tampilan, ai_jawab, ai_crawl, mesin_cari, tak, klik_ai), jam (jenis|HH WIB), halaman, rujukan, kanal, negara,
-- perangkat, ai_agen (nama|status), ai_halaman, perayap (jenis|nama|status), jalur_bot, tak (alasan).
CREATE TABLE IF NOT EXISTS lalin (
  tgl TEXT NOT NULL CHECK (tgl GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]'),
  dim TEXT NOT NULL CHECK (dim IN ('jenis','jam','halaman','rujukan','kanal','negara','perangkat','ai_agen','ai_halaman','perayap','jalur_bot','tak')),
  kunci TEXT NOT NULL CHECK (length(kunci) BETWEEN 1 AND 120),
  n INTEGER NOT NULL DEFAULT 0 CHECK (n >= 0),
  PRIMARY KEY (tgl, dim, kunci)
) WITHOUT ROWID;
CREATE TABLE IF NOT EXISTS lalin_tamu (
  tgl TEXT NOT NULL CHECK (tgl GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]'),
  h TEXT NOT NULL CHECK (length(h) = 16 AND h NOT GLOB '*[^0-9a-f]*'),
  PRIMARY KEY (tgl, h)
) WITHOUT ROWID;
CREATE TABLE IF NOT EXISTS lalin_garam (
  tgl TEXT PRIMARY KEY CHECK (tgl GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]'),
  garam TEXT NOT NULL CHECK (length(garam) = 64 AND garam NOT GLOB '*[^0-9a-f]*')
);
-- Rentang IP resmi operator perayap (diambil cron harian dari daftar yang mereka terbitkan) untuk lencana "terverifikasi".
CREATE TABLE IF NOT EXISTS lalin_ip (
  operator TEXT PRIMARY KEY CHECK (length(operator) BETWEEN 2 AND 40),
  cidr TEXT NOT NULL CHECK (json_valid(cidr) AND json_type(cidr) = 'array' AND length(cidr) <= 1000000),
  diambil INTEGER NOT NULL
);
-- "Sedang membaca sekarang": 8 hex pertama hash tamu + jalur; baris lebih tua dari 10 menit dibuang tiap hit.
CREATE TABLE IF NOT EXISTS lalin_kini (
  h TEXT PRIMARY KEY CHECK (length(h) = 8),
  waktu INTEGER NOT NULL,
  jalur TEXT NOT NULL CHECK (length(jalur) BETWEEN 1 AND 80)
) WITHOUT ROWID;
CREATE INDEX IF NOT EXISTS lalin_kini_waktu ON lalin_kini (waktu);
