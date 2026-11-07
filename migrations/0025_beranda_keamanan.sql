-- 0025_beranda_keamanan.sql: beranda admin (hitungan antrean murah) dan keamanan akun. Idempoten; tidak menyentuh data.
-- Indeks untuk COUNT antrean dan riwayat gagal masuk 30 hari.
CREATE INDEX IF NOT EXISTS jejak_aksi ON jejak (aksi, kapan DESC);
CREATE INDEX IF NOT EXISTS pendaftaran_bukti_status ON pendaftaran_bukti (status);
CREATE INDEX IF NOT EXISTS kons_utas_status ON kons_utas (status, jenis);

-- sesi_aktif: waktu terakhir sesi dipakai (diperbarui paling cepat tiap 10 menit per sesi, dari hak.bacaSesi).
-- Tabel pendamping karena ALTER ADD COLUMN pada sesi tidak idempoten. Tanpa FK cascade (cascade menambah changes() pada DELETE sesi); yatim disapu hak.sapu.
CREATE TABLE IF NOT EXISTS sesi_aktif (
  id_hash TEXT PRIMARY KEY CHECK (length(id_hash) = 64),
  terakhir INTEGER NOT NULL
) WITHOUT ROWID;
