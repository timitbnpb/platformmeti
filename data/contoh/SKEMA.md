# Skema data contoh direktori (JSON)

Semua isi fiktif: nama berakhiran "(contoh)", tautan hanya `*.example.org`. Bentuk yang sama diisi pipeline (`scripts/panen/*`, `scripts/direktori/*`) lalu dilayani Worker dari R2 `potret/anggota/<nama>.json`. Tiap objek wajib punya sumber (`sumber_url` atau `sumber[{butir,url,diperiksa}]`) dan tanggal `diperiksa` (YYYY-MM-DD).

## Orang (tokoh.json, larik)
Satu catatan per orang. `pakar_id` (id penulis OpenAlex, `A\d{4,12}`) menautkan ke baris pakar di `induk.json` sehingga lembar pakar ikut memuat bagian ini.

| Bidang | Isi |
| --- | --- |
| `id`, `nama`, `eid` | kunci layar, nama, id entitas D1 (bilangan bulat; dipakai `/api/riwayat?target=`) |
| `peran`, `jenis`, `peran_energi` | jabatan kini, jenis (`pejabat`, `akademisi`, `pengusaha`, ...), peran di energi |
| `lembaga`, `lembaga_id`, `sektor[]`, `prov` | organisasi kini (id = `lembaga.json`), kunci SEKTOR, kode provinsi |
| `alasan` | ringkasan satu kalimat (tampil di kepala lembar) |
| `riwayat[]` | RIWAYAT JABATAN: `{jabatan, lembaga, mulai, selesai?, sumber_url}`; tanpa `selesai` = "Kini" |
| `pendidikan[]` | PENDIDIKAN: `{jenjang (S1..S3), gelar, bidang, institusi, mulai, selesai, sumber_url}` |
| `kiprah[]` | KIPRAH EBET: `{teks, tahun, sumber_url}` |
| `tautan[]` | TAUTAN: `{jenis (linkedin, x, web, scholar), url}` (https) |
| `sumber[]`, `diperiksa` | daftar SUMBER lembar |

## Pakar (induk.json)
`orang` = larik baris `[id, nama, kampus, [sektor], h, karya, sitasi, orcid, [topik], foto, idSinta, prodi, subjek, status, logo]`; `sumber` ada di tingkat berkas.

## SINTA (sinta.json, objek berkunci id SINTA; R2 `potret/anggota/sinta/<id % 64>.json`)
`{diperiksa, prodi, subjek[], tabel{Article, Citation, "Cited Document", "H-Index", "i10-Index", "G-Index": [scopus, scholar]}, skor{"SINTA Score Overall", "SINTA Score 3Yr"}, grafik{"scopus-chart-articles": [[tahun, n]]}, artikel[{judul, url, tahun, sitasi, terbitan, kuartil ("Q1 Journal"), urutan ("1 of 4"), penulis}]}`.

## Riwayat dengan METI (D1, bukan berkas)
Hanya lapis pengurus: `GET/POST /api/riwayat`, `PATCH/DELETE /api/riwayat/:id` (DT 4.3). Badan POST: `{target_id, jenis, tanggal, tanggal_selesai?, judul, catatan?, penilaian?}`.
