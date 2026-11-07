-- 0018_profil.sql: Profil saya (profil anggota yang bisa disunting sendiri). Idempoten.
-- instansi dan telepon juga ada di akun_profil (0012, dipakai Pustaka); rute profil menyalinnya ke sana sekali tulis, jadi keduanya tidak berselisih.
-- keahlian: JSON array teks; tautan: JSON {linkedin, situs}; privasi: JSON {bagian: 'semua'|'admin'} (bagian yang tak tercatat memakai bawaan di hak.js).
-- foto_kunci: kunci R2 BERKAS profil/<akun_id>.webp. Telepon dan surel kontak tidak masuk jejak (K20).
CREATE TABLE IF NOT EXISTS profil (
  akun_id INTEGER PRIMARY KEY REFERENCES akun(id) ON DELETE CASCADE,
  gelar TEXT CHECK (gelar IS NULL OR length(gelar) BETWEEN 1 AND 40),
  jabatan TEXT CHECK (jabatan IS NULL OR length(jabatan) BETWEEN 1 AND 120),
  instansi TEXT CHECK (instansi IS NULL OR length(instansi) BETWEEN 1 AND 160),
  organisasi_id TEXT CHECK (organisasi_id IS NULL OR (length(organisasi_id) BETWEEN 2 AND 60 AND organisasi_id NOT GLOB '*[^A-Za-z0-9_-]*')),
  kota TEXT CHECK (kota IS NULL OR length(kota) BETWEEN 1 AND 80),
  kode_prov TEXT CHECK (kode_prov IS NULL OR kode_prov GLOB '[0-9][0-9]'),
  bio TEXT CHECK (bio IS NULL OR length(bio) BETWEEN 1 AND 600),
  keahlian TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(keahlian) AND length(keahlian) <= 1200),
  tautan TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(tautan) AND length(tautan) <= 600),
  telepon TEXT CHECK (telepon IS NULL OR (length(telepon) BETWEEN 6 AND 20 AND telepon NOT GLOB '*[^0-9+ ()-]*')),
  foto_kunci TEXT CHECK (foto_kunci IS NULL OR length(foto_kunci) <= 80),
  privasi TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(privasi) AND length(privasi) <= 400),
  diubah INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS profil_riwayat (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  akun_id INTEGER NOT NULL REFERENCES akun(id) ON DELETE CASCADE,
  jenis TEXT NOT NULL CHECK (jenis IN ('pendidikan','pengalaman','sertifikasi','publikasi')),
  isi TEXT NOT NULL CHECK (json_valid(isi) AND length(isi) <= 800),
  urut INTEGER NOT NULL DEFAULT 0,
  diubah INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS profil_riwayat_akun ON profil_riwayat (akun_id, jenis, urut);
