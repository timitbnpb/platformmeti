# Ilmu pipa

> Kelas: pengerja · Model: sonnet · Definisi: `.claude/agents/pipa.md`
> Dibaca SEBELUM kerja (`node scripts/agents/ilmu.mjs baca pipa`). Kasus baru
> ditambah SESUDAH kerja lewat `node scripts/agents/ilmu.mjs kasus pipa "..."`.

## Peta berkas & tabel

Milikmu: `scripts/panen/**`, `scripts/pipa/**`, `scripts/direktori/**`, `scripts/mesin/**`, `data/**`, `.github/workflows/panen-*.yml`, `potret.yml`. Bukan milikmu: `src/**`, `public/**`, `migrations/**`.

**Panen (DT §7.2), keluaran R2 `panen/<tgl>/`:** `openalex.py` (JM-D03, `OPENALEX_KEY`, `country_code:ID`, karya >= 3, topik T11007/T14444/T12271/T14481/T12503), `statistik.py` dan `wb_proyek.py` (JM-D05), `osm_pembangkit.py` (JM-D04, per provinsi, ODbL), `regulasi.py` (JM-D06), `wri_gppd.py`, `aesi.py`, `gem.py` (unduh manual, NC hanya tautan), `orcid.py` (JM-D09/D03), `sinkron_meti.py` (JM-F10, hanya judul, tanggal, tautan, penulis). Yang sudah ada: `scripts/panen/panen_1001.mjs` (R13; `--selftest`, `--daftar`, `--hanya=`, `--parse`; mentah di `data-panen/1001/raw/`, di-.gitignore).

**Pipeline Node (DT §7.4):** `scripts/direktori/kurasi_baca.mjs` (SELECT tetap atas `entitas, fakta, ikatan, sumber, alias, label`, keluaran `panen/kurasi.json`) lalu `sambung.mjs` (kurasi menang atas panen, kunci `entitas.kunci`) lalu `hubung.mjs` (graf, `strategis()` DIRI=METI) lalu `potret.mjs` (sensus, kuadran, pecah per lapis `KOLOM_LAPIS`) lalu `jaga_unggah.mjs` lalu `wrangler r2 object put` (manifest TERAKHIR). Tambahan: `cerita.mjs` (cerita beku), `lembaga_gabung.mjs`, `scripts/mesin/cadangan.mjs`, `ukur-cpu.mjs`, `buat_super.mjs`.

**Workflow:** `panen-bulanan.yml` (cron `0 20 1 * *`), `panen-mingguan.yml` (`0 21 * * 0`), `potret.yml` (`0 22 * * *`, `workflow_run`, `workflow_dispatch`). Empat jadwal terpakai dari batas lima (Worker `0 18 * * *` ikut dihitung).

**Tabel D1 yang kamu BACA saja:** `entitas, fakta, ikatan, sumber, alias, label` (kolom `lapis`, `tampil`, `status`, `sumber_id`, `tingkat_bukti`). Menulis D1 dilarang.

## Aturan & invarian

1. **Pipeline membaca D1 dan menulis R2; TIDAK PERNAH menulis D1** (ADR-08). Token CI D1 cakupan baca saja; manusia menaikkan baris panen ke kurasi lewat `POST /api/kurasi/impor`.
2. **Baris tanpa `sumber_url`, `tanggal_periksa`, `tingkat_bukti` DITOLAK dan dihitung** (KP D5; DT §7.1 butir 4). Keluaran selalu `{"sumber","diambil","lisensi","baris":[...]}`.
3. **Langit-langit tingkat bukti menurut jenis sumber** (ALG §3.2): `situs-sendiri` maks `kata-pihak`; `media` dan `via-pihak-ketiga` maks `cuplikan`; bawaan per skrip ada di ALG §3.2. Baris via-pihak-ketiga tidak pernah keyakinan Tinggi (skor maks 0,59, ALG §4.2).
4. **Panen sopan** (KPV §6; DT §7.1): baca `robots.txt` per host, jeda >= 2 detik, UA jujur dengan kontak METI, satu percobaan ulang dengan backoff, tanpa melewati CAPTCHA/WAF. 403 = berhenti total; 429 = tunggu `Retry-After` (pola R13).
5. **Python hanya stdlib; rumus hanya di `public/algo.js` dan `taksonomi.js`** (diimpor Node). Python tidak menghitung skor (ADR-03).
6. **1001startup.id:** panen terbatas dijalankan atas perintah pemilik 7 Nov 2026 (KP D15, R13): hanya nama, sektor, lokasi, relasi, sumber primer, atribusi "via 1001startup.id" + tanggal ambil; TANPA teks deskripsi, EST mereka, skor, logo, surel/telepon. Jalur `/api`, `/leads`, `/map`, `/stats` tidak pernah diminta. Data mentah tidak masuk repo. Izin tertulis (C-13) tetap syarat tampil publik.
7. **Daftar tolak** (KP D14) privat di R2 `privat/daftar-tolak.json`; dimuat sebelum sambung. Tidak terbaca = pipeline GAGAL keras, bukan lanjut tanpa daftar (RU §4.2 butir 3). Cocokkan lewat `hashTolak`, bukan nama polos.
8. **Potret per lapis (ADR-02; ALG §13):** `publik` penuh, `anggota` dan `pengurus` hanya delta kolom (`KOLOM_LAPIS`). Skor, sensus, kuadran dihitung dari lapis publik saja. Orang masuk hanya bila `tampil = 1`; kontak hanya lapis pengurus; `riwayat`, `koreksi`. Tiap berkas <= 2 MB (pecah per provinsi/sektor).
9. **Jaga unggah semua-atau-tidak-sama-sekali** (DT §7.4 langkah 6): ambang susut 20 persen (asal 5 persen), tidak dilemahkan, tidak ada bendera lingkungan pengganti.
10. **Selalu unduh R2 segar sebelum menggabung** (DT §7.4 langkah 1; pernah menimpa). Hasil deterministik: dua kali jalan, masukan sama, berkas identik byte.
11. **Gagal tidak menimpa data lama** (R12 §3.8, §8.4; R10 §3.3): tarik, validasi bentuk, bandingkan jumlah baris dengan tarikan lalu, baru tukar. Galat sementara = backoff, bukan memecah batch (R11 §3.11).
12. **Rahasia** (`OPENALEX_KEY`, `CLOUDFLARE_API_TOKEN`) hanya dari env Actions, tidak dicetak. Subagent tidak mengunggah ke R2 produksi dan tidak menjalankan workflow di cloud.
13. **Tanggal build/periksa berasal dari masukan, bukan jam** (R12 §8.6); baca/tulis `utf-8` eksplisit.

## Ranjau yang pernah meledak

- **Paginasi tanpa urutan tetap** (R11 §3.3): 78 halaman memberi 38.568 baris tetapi hanya 29.626 unik. Ukur jumlah UNIK terhadap kunci alami; jumlah unik < total = gagal keras.
- **Tujuh ranjau PIHPS** (R11 §3.4): cakupan terlalu kasar, koma vs titik desimal tanpa galat, induk pohon tak direset, wilayah tak disurvei. Satu parser per sumber lengkap dengan locale; uji dengan contoh nyata.
- **Penarik menimpa data bagus dengan data kosong** (R12 §8.4): `tarik_firms.py` menulis tanpa syarat. Periksa jumlah baris sebelum tulis.
- **Normalisasi nama memakan namanya, gabung berbasis nama** (R11 §3.10): 21 kecamatan, 940 sekolah, nol galat. Dedup menghasilkan usulan ke antrean kurator, tidak menggabung otomatis; uji kasus yang memakan nama sendiri.
- **Satuan dua rezim** (R11 §3.9): 155 kali lipat tanpa galat. Satu kolom kanonik + `satuan_asal`; pasangan tak sebanding dikosongkan.
- **Potret tertinggal berbohong** (R11 §3.12): setelah koreksi massal atau migrasi data, bangun ulang potret; potret membawa `dibangun_pada`.
- **Cache Actions sebagai tempat data produksi** (R10 §3.1, §8 butir 10): deploy memakai salinan basi 11 hari tanpa galat. Simpan di R2, jaga kesegaran.
- **Artefak build dan JSON besar terlacak git** (R12 §8.5); `data-panen/`, `daftar-tolak.json`, `*.sqlite` tidak masuk repo.
- **Baris gap beralasan terbuang oleh filter sumber** (R12 §8.2): baris `alasan_kosong` bukan fakta tanpa sumber; pisahkan dari fakta.
- **Desimal Indonesia** ("48,76%") bercampur titik (R12 §8.3).

## Gerbang yang menghakimi

- `tests/jaga-unggah.test.mjs` (JM-D02): J1 susut > 20% (19,9 lolos, 20,1 ditolak), J2 JSON rusak, J3 baris tanpa `sumber_url`, J4 skema `javascript:/data:/blob:`, J5 pola surel/telepon di publik+anggota, J6 kolom terlarang, J7 id di daftar tolak, J8 > 2 MB, J9 `est` tanpa `rumus`, J10 kunci fakta di luar `KUNCI_FAKTA`, J11 taksonomi, J12 rujukan lapis rendah ke tinggi. Satu gagal = NOL `put`, manifest terakhir.
- `tests/daftar-tolak.test.mjs` (JM-D11), `tests/potret.test.mjs` (JM-D12), `tests/hubung.test.mjs` (JM-D10).
- `tests/gerbang-panen.test.mjs`: impor di luar stdlib, tanpa `robots.txt`, UA tanpa kontak METI, rahasia tercetak, permintaan ke host terlarang. `npm run uji:pipa` untuk `tests/panen/uji_*.py`.
- `tests/gerbang-workflow.test.mjs` (jumlah cron <= 5, tanpa `pull_request_target`), `tests/gerbang-rahasia.test.mjs`, `tests/gerbang-test-integrasi.test.mjs` (tiap skrip baru ada di `tests/cakupan.json`).
- Pemeriksa sesudahmu: `security-reviewer` (panen, potret, daftar tolak, kolom pribadi) dan `validasi-model` (skor, kuadran, keyakinan). Kamu tidak memverifikasi kerjamu sendiri.

## Kasus

Belum ada kasus. Tambahkan lewat ilmu.mjs kasus.
