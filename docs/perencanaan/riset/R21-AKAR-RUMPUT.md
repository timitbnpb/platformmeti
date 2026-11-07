# R21 Panen akar rumput EBET (7 Nov 2026)

Skrip: `scripts/panen/panen_akar.mjs` (`--selftest`, `--ambil`, `--teks`, `--tautan`, `--bangun`, `--statistik`). Keluaran di `data-panen/akar/` (tidak masuk repo): `organisasi_mahasiswa.jsonl`, `tokoh.jsonl`, `gagal.jsonl`, `raw/`, `seed/`.

## Hasil
- Organisasi mahasiswa (kategori `organisasi-mahasiswa`): 1 (SRE Indonesia, nasional; sumber Wikipedia id, tingkat bukti cuplikan).
- Tokoh (kelompok `aktivis-tokoh-daerah`): 4 (Tri Mumpuni, Iskandar Budisaroso Kuntoadji, Edwin Kudjere, Abdul Dunduk), semua kepakaran `hidro` dengan bukti dan tautan.
- Gagal: 6 (3 org tanpa sumber terbaca atau tanpa bukti EBT; 3 tokoh bernama satu kata, aturan nama dari panen_orang).

## Sumber yang terpakai
Wikipedia id (SRE, Tri Mumpuni), Mongabay Indonesia kategori energi (tujuh artikel energi desa, hanya judul dan peran yang disebut berita).

## Celah
- `sre.co.id` ditolak robots.txt; ketua SRE dan daftar chapter kampus tidak terambil (Wikipedia: lebih dari 50 chapter, tanpa daftar). Perlu izin atau input manual kurator.
- DEM, himpunan energi kampus, BEM berkementerian energi: tidak ada situs yang bisa dijangkau. Tebakan domain (puluhan) tidak ada atau SPA; `iesr.or.id` dan `bem.unpad.ac.id` memberi 403 (host dihentikan); `energyclub.id`, `hmte.ugm.ac.id` ditolak robots; bem.undip/unair 5xx; bem.usu tanpa kementerian energi. Tanpa mesin pencari, penemuan situs buntu: perlu daftar URL dari pemilik.
- Kalpataru, Ashden, Penghargaan Energi Prakarsa: halaman Wikipedia/ESDM tidak memuat penerima bertema EBT; `koaksi`, `ebtke.esdm.go.id` kosong atau tak terjangkau.
- Tokoh bernama satu kata (Ahdar, Jam'ah, Nasirun, Madi, Rubi) ditahan di `gagal.jsonl`; kurator bisa menaikkan bila perlu.
- Iskandar Budisaroso Kuntoadji: keterkaitan IBEKA disimpulkan, perlu tinjau.
- Instagram/X/LinkedIn tidak dipanen; tidak ada satupun `tautan` sosial yang tercatat karena tidak ditemukan.
