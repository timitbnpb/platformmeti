-- 0017_kta.sql: Kartu Tanda Anggota (KTA) virtual METI. Idempoten.
-- Satu baris per anggota (anggota_id = id basis R2 potret/pengurus/anggota_meti.json, tanpa FK). akun_id mengaitkan ke akun login.
-- status 'tertunda' = klaim keanggotaan menunggu admin, atau KTA belum diterbitkan; 'kedaluwarsa' dihitung dari berlaku_sampai saat dibaca.
-- nonce acak 16 hex: token verifikasi publik = id + HMAC(rahasia, id|nonce); ganti nonce = tautan lama mati. Jejak (0002) dipakai apa adanya.
CREATE TABLE IF NOT EXISTS kta (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  akun_id INTEGER REFERENCES akun(id) ON DELETE SET NULL,
  anggota_id TEXT NOT NULL CHECK (length(anggota_id) BETWEEN 1 AND 80),
  nomor_kta TEXT UNIQUE CHECK (nomor_kta IS NULL OR (length(nomor_kta) = 19 AND substr(nomor_kta, 1, 5) = 'METI-' AND substr(nomor_kta, 10, 1) = '-' AND substr(nomor_kta, 14, 1) = '-')),
  tahun_masuk INTEGER CHECK (tahun_masuk IS NULL OR tahun_masuk BETWEEN 1999 AND 2100),
  jenis TEXT NOT NULL CHECK (jenis IN ('individu','utama','biasa','luar biasa','kehormatan')),
  nama_cetak TEXT NOT NULL CHECK (length(nama_cetak) BETWEEN 1 AND 120),
  instansi TEXT CHECK (instansi IS NULL OR length(instansi) BETWEEN 1 AND 160),
  berlaku_sampai TEXT CHECK (berlaku_sampai IS NULL OR berlaku_sampai GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  status TEXT NOT NULL DEFAULT 'tertunda' CHECK (status IN ('aktif','tertunda','kedaluwarsa','dicabut')),
  foto_kunci TEXT CHECK (foto_kunci IS NULL OR length(foto_kunci) <= 80),
  bukti_kunci TEXT CHECK (bukti_kunci IS NULL OR length(bukti_kunci) <= 80),
  nonce TEXT NOT NULL CHECK (length(nonce) = 16),
  dibuat INTEGER NOT NULL DEFAULT (unixepoch()),
  diubah INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE UNIQUE INDEX IF NOT EXISTS kta_akun ON kta (akun_id) WHERE akun_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS kta_anggota ON kta (anggota_id);
CREATE INDEX IF NOT EXISTS kta_status ON kta (status, berlaku_sampai);
