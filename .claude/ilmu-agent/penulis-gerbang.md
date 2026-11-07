# Ilmu penulis-gerbang

> Kelas: pemeriksa · Model: sonnet · Definisi: `.claude/agents/penulis-gerbang.md`
> Dibaca SEBELUM kerja (`node scripts/agents/ilmu.mjs baca penulis-gerbang`). Kasus baru
> ditambah SESUDAH kerja lewat `node scripts/agents/ilmu.mjs kasus penulis-gerbang "..."`.

Read-only: kamu menilai CELAH cakupan dan menulis laporannya; gerbang ditulis oleh agent `gerbang`. RU = RENCANA-UJI, KPV = KEAMANAN-PRIVASI, DT = DESAIN-TEKNIS. Aturan pemilik: `~/.claude/TEST.md`.

## Peta berkas & tabel

| Berkas yang kamu baca | Untuk apa |
| --- | --- |
| `tests/cakupan.json` | registri lima jenis butir (`rute`, `tabel`, `trigger`, `skrip`, `fungsi`); tiap jenis `diuji`, `dikecualikan`, `antre`, plus `antre_batas` |
| `src/worker.js` + modul rute (`sesi`, `akun`, `kurasi`, `koreksi`, `riwayat`, `potret`, `direktori`, `status`) | sumber butir `rute` (kunci router "METODE /path") dan `fungsi` ekspor `hak.js`, `sandi.js`, `sesi.js`, `akun.js`, `kurasi.js`, `potret.js` |
| `migrations/*.sql` | butir `tabel` (`CREATE TABLE`, `CREATE VIRTUAL TABLE`) dan `trigger` (`CREATE TRIGGER`) |
| `scripts/**/*.{mjs,py}` | butir `skrip` |
| `tests/gerbang-*.test.mjs` dan `tests/fixtures/gerbang/<nama>/jahat/` | apakah gerbang ada, punya penjaga N berkas, terbukti merah |
| `docs/perencanaan/RENCANA-UJI.md` §1.4, §7.3 | daftar gerbang dan padanan tiket ke berkas uji |
| `docs/perencanaan/KEAMANAN-PRIVASI.md` §1, §10 | matriks hak (16 baris x 7 peran = 112 sel) dan bukti wajib per permukaan |
| `docs/perencanaan/TIKET.md` | aturan "Selesai bila" dan "Bukti" tiket yang baru selesai |

Keadaan saat ini: hanya `gerbang-model-agent` dan `gerbang-ilmu-agent` yang ada; `tests/cakupan.json` belum ada (dibuat di JM-A02). Sebelum menilai, `ls tests` dan baca berkasnya, jangan berasumsi dari RU.

## Aturan & invarian

1. **Aturan tanpa gerbang mekanis dianggap belum jadi.** Tiap aturan baru (di dokumen, kode, atau ilmu agent) menunjuk SATU uji yang merah bila dilanggar. Aturan yang hanya berupa kalimat dilaporkan sebagai `[BELUM BERGERBANG]` (R12 §8.10).
2. **Dua arah registri** (R11 §4.6, RU §6.1): repo ke registri (butir baru tak terdaftar = merah) dan registri ke repo (butir yang sudah hilang tapi masih terdaftar = basi).
3. **Entri `diuji` bukan palsu**: menunjuk berkas uji yang ADA dan yang teksnya MENYEBUT nama butir. `dikecualikan` beralasan minimal 20 karakter dan bukan alasan malas ("aset statis tanpa logika; dijaga gerbang-i18n" boleh). `antre` hanya menyusut; setelah rilis pertama (JM-H04) `antre_batas` dikunci dan butir baru dilarang masuk `antre`.
4. **Tiap aturan hak/CHECK/trigger punya uji DITOLAK yang menjalankan perilakunya** terhadap D1 lokal nyata, bukan mock (RU §0 butir 2 dan 3). Pasangan terima/tolak wajib. Matriks: jumlah uji dibangkitkan harus sama dengan baris x peran dari fixture.
5. **Gerbang tidak hijau-kosong**: tiap gerbang punya asersi "terbaca minimal N objek" (R11 §4.3) DAN folder `jahat/` yang terbukti merah (RU §1.5 butir 2). Gerbang tanpa keduanya = belum jadi.
6. **Pengecualian per butir, bukan per berkas** (RU §1.5 butir 1). Entri pengecualian bergaya berkas = temuan tinggi.
7. **Pemindai mengenali beberapa bentuk penulisan** (handler bernama, atribut bersyarat di baris berikutnya, nama berbahasa Inggris): satu regex tunggal = temuan sedang.
8. **Padanan tiket**: cocokkan tiket yang selesai dengan baris RU §7.3 (berkas uji + perintah bukti) dan tambahan per kelas §7.2 (Worker, Migrasi, Layar, Pipa, Gerbang). Tiket tertahan menyisakan uji dasar yang sudah bisa hijau.
9. **Pesan gagal** menyebut angka dan sebab teknis, lewat `tests/helper/pesan.mjs` (RU §0 butir 5).
10. **Pengulas wajib** menurut KPV §10 ikut dicek: `hak.js`/`sesi`/`sandi`/rute -> `security-reviewer` + `guard-api`; `_headers` -> `security-reviewer`; migrasi -> `migrasi-idempoten`; skor -> `validasi-model`; angka -> `selera-angka`.
11. **Tombol dummy dibatalkan** (KP K15): jangan menuntut `gerbang-dummy` atau `gerbang-dummy-layar` sampai induk menyelaraskan RU §2.7; laporkan ketidakselarasan itu sebagai celah dokumen, bukan celah kode.

Format laporan: celah, tingkat (tinggi bila perilaku D1/hak tanpa uji DITOLAK atau gerbang tidak terbukti merah), butir/berkas, uji yang harus ditulis, nama berkas uji (ikuti RU §7.3), pemilik yang menulis (`gerbang`).

## Ranjau yang pernah meledak

- **Janji uji yang tidak pernah ditulis** (R12 §4.1, §4.2, §8.10): blueprint menjanjikan "jumlah baris tidak turun drastis, tak ada fakta tanpa sumber, skor reproduksi", repo tanpa `tests/`. Tahu: `git ls-files` tanpa uji.
- **Pemindai berhenti membaca, hijau** (R11 §4.3, AUDIT-NAS Tema 2): pola terlalu sempit. Tahu: nol temuan; tuntut asersi N objek.
- **Gerbang dijanjikan standar pemilik, tidak ada** (R10 §4.8, §8 butir 18): INP hanya berupa agent.
- **Registri tanpa BATAS** (R10 §4.2): `BATAS_ANTRE = 2` pada asal; METI memulai dari `antre_batas: 0`.
- **Gerbang yang hanya memindai satu nama workflow** (R11 §4.8): harus memindai SEMUA workflow.
- **Asersi potret** (TEST.md): "jumlah harus N" merah diam-diam bertahun-tahun.
- **Aturan di dokumen kalah saat banyak sesi menulis** (R11 §8.13): stempel migrasi bentrok 4 kali dalam 2 hari; hanya gerbang mekanis menahan.
- **Dokumen berotoritas ganda tanpa wasit** (R12 §8.9): satu aturan, dua nilai; gerbang `gerbang-matriks-sinkron` mengadu fixture, kode, dan tabel markdown KPV §1.

## Gerbang yang menghakimi

Yang kamu periksa: `gerbang-test-integrasi.test.mjs` (hijau dan tidak diakali), seluruh daftar RU §1.4 (apakah tiap gerbang ada dan terbukti merah), `gerbang-rujukan-dokumen` (rujukan `DT §n` tak menggantung), `gerbang-penyelarasan` (tiap kode F-xxx PRD punya baris di `PENYELARASAN.md`). Temuanmu dianggap benar bila ia bisa ditunjuk sebagai: butir tak terdaftar, uji tanpa sisi DITOLAK, atau gerbang tanpa `jahat/`. Kamu tidak menulis uji; serahkan ke `gerbang`.

## Kasus

Belum ada kasus. Tambahkan lewat ilmu.mjs kasus.
