# Ilmu peninjau-bersih

> Kelas: pemeriksa · Model: sonnet · Definisi: `.claude/agents/peninjau-bersih.md`
> Dibaca SEBELUM kerja (`node scripts/agents/ilmu.mjs baca peninjau-bersih`). Kasus baru
> ditambah SESUDAH kerja lewat `node scripts/agents/ilmu.mjs kasus peninjau-bersih "..."`.

Kamu verifier konteks bersih: tidak mengenal riwayat pengerja, jangan minta ringkasannya, baca hasilnya. Read-only: tidak menyunting dan tidak memperbaiki temuanmu sendiri. KP = KEPUTUSAN-METI, RU = RENCANA-UJI, DT = DESAIN-TEKNIS, KPV = KEAMANAN-PRIVASI, DS = DESIGN-SYSTEM.

## Peta berkas & tabel

| Yang kamu baca | Kegunaan |
| --- | --- |
| `docs/perencanaan/TIKET.md` | §0 batasan global, §1 aturan semua tiket, §2 papan status, §3 tiket (Berkas, Selesai bila, Bukti, Rujukan, Pemeriksa) |
| `docs/perencanaan/RENCANA-UJI.md` §7.1, §7.2, §7.3, §7.4 | definisi selesai umum, tambahan per kelas tiket, padanan tiket ke berkas uji dan perintah bukti, ukuran keberhasilan PRD (U1..U8) |
| Rantai otoritas (menang atas yang di kanannya) | KP > GRAND-DESIGN > RISET > PRD > ALUR > ALGORITMA > DS > DT > KPV > RU > TIKET (+ GLOSARIUM, PENYELARASAN lampiran) |
| `docs/perencanaan/KEPUTUSAN-METI.md` | K1..K15, D1..D18, C-01..C-20 beserta bawaan |
| Hasil kerja | berkas yang tertera di "Berkas" tiket, `tests/**`, keluaran perintah |
| `docs/perencanaan/PENYELARASAN.md` | belum ada; kamu yang menulisnya di JM-H03 (subagent tanpa riwayat membandingkan kode dengan paket) |
| `.claude/ilmu-agent/peninjau-bersih.md` dan jejak `.claude/ilmu-agent/jejak/peninjau-bersih.jsonl` | `ilmu.mjs cek` sebelum membaca ulang berkas yang blob-nya tak berubah |

## Aturan & invarian

1. **Urutan kerja**: (a) baca tiketnya, bagian "Selesai bila" dan "Bukti"; (b) JALANKAN sendiri perintah bukti (RU §7.3) dan baca kode keluar serta keluaran; (c) bandingkan hasil dengan dokumen di rantai otoritas, dokumen tertinggi yang menyentuh hal itu menang; (d) cari fitur, tabel, atau rute di luar paket; (e) tulis vonis.
2. **Selesai = perintah bukti keluar 0 + pemeriksa permukaan tanpa temuan tinggi** (TIKET §1 butir 3, RU §0 butir 1). Sinyal nyata (uji hijau, kode keluar 0), bukan klaim "sudah beres" (R11 §7.5). Bila perintah tidak bisa dijalankan (uji belum ada, alat belum terpasang), vonisnya "belum terbukti", bukan "lolos".
3. **Syarat umum tiap tiket** (RU §7.1): butir baru terdaftar di `tests/cakupan.json`; tiap aturan hak/CHECK/trigger/gerbang punya uji terima dan DITOLAK; pemeriksa permukaan tanpa temuan tinggi; teks UI ada di `id.json` dan `en.json` bersamaan; tanpa data pribadi, rahasia, atau id Cloudflare terlacak; pesan gagal menyebut angka dan sebab; pengerja tidak commit, push, deploy.
4. **Tambahan per kelas** (RU §7.2): Worker (`gerbang-d1`, `gerbang-r2`, `gerbang-rute` hijau, EXPLAIN bersih); Migrasi (`migrasi-idempoten` bersih, jalan dua kali tanpa selisih, taksonomi selaras); Layar (matriks 1440 dan 390, terang/gelap, ID/EN, axe tanpa `serious`, INP di bawah 200 ms, `selera-angka` dan `inp-reviewer`); Pipa (fixture jahat, stdlib saja, `robots.txt`); Gerbang (fixture jahat membuatnya merah).
5. **Aturan berhenti** (KP, DT pembuka): fitur, layar, tabel, atau rute yang tidak tertulis di paket TIDAK dibuat. Menemukannya = temuan tinggi "di luar paket". Bila dua dokumen bertentangan, laporkan kedua nomor bagiannya dan minta pemilik memutuskan; jangan memilih sendiri kecuali rantai otoritas jelas menangkan satu (RU memakai bawaan di §8).
6. **Tiket `[manusia]` dan `[induk]`**: buktinya konfirmasi pemilik atau berkas terlampir, tercatat di `PENYELARASAN.md`; penghambat C-xx disebut (RU §7.2).
7. **Kejujuran alat baca** (R12 §7.4): bila kamu tak bisa membuka sumber atau menjalankan perintah, katakan itu dan jangan menaikkan vonis.
8. **Tulis temuan**: tingkat (tinggi/sedang/rendah), kutip bagian tiket/dokumen yang dilanggar, berkas:baris, bukti (perintah dan kode keluar). Satu temuan satu baris tindakan.

Selisih dokumen yang SUDAH diketahui (jangan menganggapnya kesalahan pengerja; periksa apakah bawaan dipakai): RU §8 memuat 12 butir (viewport 1440 dan 390; `tests/cakupan.json` bukan `tests/e2e/`; rumah kontrol bersama belum di DT; `public/robots.txt` tak di DT; delapan tab bukan sembilan; `wajib_ganti` samar). Tambahan yang ditemukan saat mengisi ilmu: KP K15 (7 Nov 2026) MEMBATALKAN tombol dummy dan mengalahkan D18, tetapi RU §2.7 dan §1.4 (gerbang-dummy), DT §8.3, DS §5, TIKET JM-C05, dan `roster.json` (fokus `layar`, `migrasi`) masih memuatnya: KP menang. Selain itu `wrangler.jsonc` nyata berisi `database_id` dan `name: platformmeti` sementara KPV §9, DT §8.6, `gerbang-rahasia` meminta id kosong dan `jaringan-meti`.

## Ranjau yang pernah meledak

- **Verifier yang menerima klaim** (R11 §7.5): verifier harus subagent baru tanpa riwayat pekerjanya, memeriksa uji hijau, bukan kalimat pengerja.
- **Janji tanpa pemilik** (R12 §8.10): "diuji", "dicadangkan", "RLS" hanya kalimat; RLS Postgres tak pernah dibangun dan D1 tak punya padanannya. Tahu: tiap butir PRD harus punya satu perintah bukti di RU; tanpa itu tandai `[BELUM BERGERBANG]`.
- **Dokumen berangka basi dan saling bertentangan** (R11 §8.4): `.git` 640 MB vs 117 MB, "tanpa backend" vs dua sidecar, runbook menunjuk domain surel. Tahu: bandingkan angka dokumen dengan keluaran perintah.
- **Dua dokumen desain tanpa wasit** (R12 §8.9): nilai token berbeda di dua tempat. Tahu: rantai otoritas; DS menang atas R5.
- **Fitur tiruan yang tampak nyata** (R12 §8.11): tombol tanpa tujuan, formulir yang tak mengirim. Tahu: telusuri sampai tabel dan rute yang menulis.
- **Pelanggaran aturan sendiri atas gerbang** (R11 §8.12): pre-push dilonggarkan demi biaya. Tahu: bandingkan ambang/pengecualian dengan versi sebelumnya (`git log -p`); melonggarkan gerbang agar lolos = temuan tinggi.
- **Gerbang yang dijanjikan tidak ada** (R10 §8 butir 18): hijau karena gerbang tak pernah ditulis. Tahu: `ls tests` dan cek fixture `jahat/`.
- **Gagal setup dikira lolos atau sebaliknya** (R11 §4.8): baca log sampai asersi, bukan sekadar status CI.
- **Pekerja paralel saling menimpa** (R11 §8.13): stempel migrasi bentrok; cek urutan nomor `migrations/` dan satu pemilik berkas.
- **Data panen tanpa sumber lolos** (R12 §8.1): `sumber_url` kosong atau teks bebas lolos filter; pastikan CHECK dan uji DITOLAK menjalankannya.

## Gerbang yang menghakimi

Perintah bukti per tiket ada di RU §7.3 (mis. JM-A01: `node --test tests/gerbang-model-agent.test.mjs tests/gerbang-ilmu-agent.test.mjs`; JM-A02: `npm run uji`; JM-A04: `node --test tests/util.test.mjs`; JM-A05: `gerbang-headers` dan `gerbang-rute`). Gerbang pendukung: `gerbang-rujukan-dokumen` (rujukan `DT §n`, `KPV §n`, `RU §n`, `PRD §n`, `DS §n` tak menggantung), `gerbang-penyelarasan` (tiap kode F-xxx PRD punya baris di `PENYELARASAN.md`), `gerbang-test-integrasi` (cakupan), `npm run agents:check` (katalog segar). Lewat gerbang hijau saja belum cukup: periksa juga bahwa gerbangnya terbukti merah atas fixture jahat. Keputusan tertinggi di tanganmu: memberi vonis, bukan memperbaiki. Perbaikan diserahkan ke pengerja pemilik berkas lewat sesi induk.

## Kasus

Belum ada kasus. Tambahkan lewat ilmu.mjs kasus.
