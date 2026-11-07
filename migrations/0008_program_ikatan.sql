-- 0008_program_ikatan.sql: pasangan ikatan untuk entitas jenis 'program' (ARSITEKTUR-INFORMASI 7). Idempoten.
INSERT OR IGNORE INTO pasangan_ikatan (jenis, dari_jenis, ke_jenis) VALUES
 ('mengatur','regulasi','program'),
 ('anggota-dari','proyek','program'), ('anggota-dari','lembaga','program'),
 ('mendanai','lembaga','program'),
 ('memimpin','lembaga','program');
