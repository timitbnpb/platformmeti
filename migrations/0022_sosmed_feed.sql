-- 0022_sosmed_feed.sql: feed terbaru media sosial METI di /galeri#sosmed. Idempoten.
-- youtube/instagram/facebook diisi cron lewat jalur resmi (RSS YouTube, Meta Graph API); linkedin dikurasi admin (tempel URL).
-- gambar = kunci R2 "sosmed/..." (salinan, karena URL CDN Meta kedaluwarsa); tidak ada token atau data pribadi di tabel ini.
CREATE TABLE IF NOT EXISTS sosmed_feed (
  platform TEXT NOT NULL CHECK (platform IN ('youtube','instagram','facebook','linkedin')),
  uid TEXT NOT NULL CHECK (length(uid) BETWEEN 1 AND 80),
  judul TEXT NOT NULL CHECK (length(judul) <= 400),
  tanggal TEXT NOT NULL CHECK (tanggal GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]*'),
  url TEXT NOT NULL CHECK (url LIKE 'https://%' AND length(url) <= 400),
  gambar TEXT CHECK (gambar IS NULL OR (gambar LIKE 'sosmed/%' AND length(gambar) <= 80)),
  PRIMARY KEY (platform, uid)
);
CREATE INDEX IF NOT EXISTS sosmed_feed_tgl ON sosmed_feed (tanggal DESC);
