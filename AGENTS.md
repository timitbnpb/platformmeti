# AGENTS.md: Platform Jaringan METI

DNA semua agent dan subagent di repo ini. Versi ramping dari gemah-ripah/pangantara (aturan pemilik: `~/.claude/AGEN.md`). Fakta singkat repo di `CLAUDE.md`; peta arsitektur di `docs/perencanaan/DESAIN-TEKNIS.md`.

## 0. Gerbang konteks, sebelum tool apa pun

1. `docs/perencanaan/DESAIN-TEKNIS.md` §1 (arsitektur) dan §2 (berkas + pemilik) untuk tugasmu.
2. `node scripts/agents/ilmu.mjs pemilik <berkas>`: siapa pengerja pemiliknya.
3. `node scripts/agents/ilmu.mjs baca <agent>`: ilmu + jejak kerja terakhirnya.

Lalu ucapkan kontrak kerja: CAKUPAN (berkas yang disentuh), DI LUAR (yang tidak), BUKTI SIAP (perintah yang membuktikan selesai).

## 1. Router

| Kerja | Baca dulu | Agent |
| --- | --- | --- |
| `src/**` (rute, `hak.js`, sesi) | DT §4, §5; KPV §1, §2, §4 | `worker` |
| `public/**` (layar, i18n, gaya) | DS; DT §2.1; ALUR | `layar` |
| `scripts/panen|pipa|direktori|mesin/**`, workflow panen | DT §7; R8; ALG | `pipa` |
| `migrations/**` | DT §3 | `migrasi` |
| `tests/**` | RENCANA-UJI | `gerbang` |
| `package.json`, `wrangler.jsonc`, CI, `scripts/agents/**`, `.claude/**` | DT §8.6 | `mekanik` |

Daftar lengkap berikut bisa/tidak bisa: **`.claude/ilmu-agent/KATALOG.md`** (generate).

### Rantai otoritas dokumen

`KEPUTUSAN-METI` > `GRAND-DESIGN` > `RISET` > `PRD` > `ALUR` > `ALGORITMA` > `DESIGN-SYSTEM` > `DESAIN-TEKNIS` > `KEAMANAN-PRIVASI` > `RENCANA-UJI` > `TIKET` (+ `GLOSARIUM`, `PENYELARASAN` lampiran). Dokumen di atas menang. **Aturan berhenti:** fitur, layar, tabel, atau rute yang tidak tertulis di paket tidak dibuat; dokumen bertentangan atau ada yang kurang = berhenti dan tanya pemilik. Pertanyaan terbuka (KEPUTUSAN bagian C) punya bawaan; kerja jalan dengan bawaan.

### 1.3 Kebijakan model dan orkestrasi

| Model | Peran | Isi |
| --- | --- | --- |
| `opus` (5.5) | sesi induk/perencana SAJA | rencana, keputusan arsitektur, kontrak inti (skema D1, API `src/hak.js`, router, token desain), memecah tugas, review akhir, commit/push. TIDAK menulis kode massal, TIDAK membaca berkas besar utuh (grep judul/baris) |
| `sonnet` | pengerja + pemeriksa nalar | kode per wilayah berkas, dokumen, riset, `security-reviewer`, `perf-reviewer`, `inp-reviewer`, `validasi-model`, `penulis-gerbang`, `peninjau-bersih` |
| `haiku` | pemeriksa pola + pencarian murah | `guard-api`, `migrasi-idempoten`, `higiene-repo`, `selera-angka`, `hak-auditor`, `i18n-guard`, eksplorasi/lokasi berkas |

- Tiap `.claude/agents/*.md` WAJIB punya `model:` (generator menolak entri tanpa model; `tests/gerbang-model-agent.test.mjs` menagihnya). `env.CLAUDE_CODE_SUBAGENT_MODEL=sonnet` di `.claude/settings.json` jaring pengaman untuk agent bawaan (`general-purpose`, `Explore`, `Plan`).
- Naik ke `opus` per panggilan hanya untuk `hak.js`, sandi, atau migrasi berisiko, dengan alasan tertulis.

**Hemat token**
- Brief menyebut path berkas + kriteria selesai, bukan domain.
- Kunci kontrak inti dulu, baru agent paralel; maksimal 5 agent paralel; satu pemilik per berkas (tak ada dua penulis di berkas sama).
- Laporan balik agent <= 15 baris; rincian ditulis ke berkas.
- Jangan baca ulang dokumen perencanaan utuh: rujuk §.
- Pemeriksa hanya untuk permukaan berisiko (`src/hak.js`, sesi, sandi, migrasi, `_headers`; tabel di §6).
- Agent yang sama masih relevan: lanjutkan via SendMessage, bukan agent baru.

**Hemat waktu**
- Pipeline per fase: kontrak -> paralel -> gerbang mekanis -> review Opus -> push.
- Gerbang mekanis lebih dulu dari review manusia.
- Agent tidak menunggu agent lain kecuali bergantung kontrak.

**Meteran:** `npm run token:ukur` (`scripts/token-ukur.mjs`) mengukur persen pesan subagent di Sonnet/Haiku; kebijakan tanpa meteran hanya terbaca, tidak bekerja.

### 1.5 Orkestrator: pengetahuan armada, ilmu agent, dan otoritas membuat agent

| Berkas | Isinya | Penulis |
| --- | --- | --- |
| `scripts/agents/roster.json` | satu-satunya sumber armada | manusia/induk |
| `.claude/ilmu-agent/KATALOG.md` | kelas, model, bisa, tidak bisa, wilayah | generate (`npm run agents:build`) |
| `.claude/ilmu-agent/<nama>.md` | peta berkas, aturan, ranjau, gerbang, Kasus | agentnya (`ilmu.mjs kasus`) |
| `.claude/ilmu-agent/jejak/<nama>.jsonl` | berkas yang sudah diperiksa (lokal, tidak di-commit) | agentnya (`ilmu.mjs catat`) |

Jejak dikunci ke blob git berkas DAN hash definisi agent; `ilmu.mjs cek` menjawab `LEWATI` hanya bila keduanya sama.

**Cara merakit:** `ilmu.mjs pemilik <berkas>` menunjuk pengerja; pemeriksa dipilih dari kolom "bisa" katalog, TIDAK PERNAH pengerja yang sama; rakitan 1 pengerja + 1-3 pemeriksa.

**Otoritas membuat agent**, tanpa izin per kasus: berkas tanpa pemilik dengan kelas kerja berulang, kelas kerja sama jatuh dua kali ke `general-purpose`, atau ilmu satu agent menembus 40 KB. Pintunya satu: entri `roster.json` -> `npm run agents:build` -> isi ilmu dari dokumen/kode nyata -> sebut di laporan. Agent baru tidak boleh push, deploy, atau melonggarkan gerbang; mencabut agent keputusan pemilik. Gerbangnya `tests/gerbang-ilmu-agent.test.mjs`.

## 3. Bentuk kerja

### 3.2 Verifier wajib konteks bersih

Penulis kode bukan pengulasnya. Verifier = subagent baru tanpa riwayat pekerjanya (`peninjau-bersih`), memeriksa sinyal nyata (perintah bukti di TIKET keluar 0), bukan klaim "sudah beres". Selesai = bukti hijau + pemeriksa tanpa temuan tinggi (TIKET §1).

### 3.3 Isolasi pekerja

Fan-out yang membaca aman di tree yang sama; yang menulis pakai `isolation: "worktree"`. Commit dengan path spesifik, jangan `git add -A`.

## 6. Review

| Permukaan berubah | Pengulas |
| --- | --- |
| `hak.js`, `sesi.js`, `sandi.js`, rute `/api/*` | `security-reviewer`, `guard-api`, `hak-auditor` |
| `_headers`, CSP, HTML dari data luar | `security-reviewer` |
| `migrations/**` | `migrasi-idempoten` |
| Potret per lapis, daftar tolak, skor | `security-reviewer`, `validasi-model` |
| Angka yang tampil | `selera-angka` |
| Handler klik/tab/sort | `inp-reviewer` |
| Teks antarmuka | `i18n-guard` |
| Query, ukuran potret | `perf-reviewer` |
| Aturan baru, rute/fungsi baru | `penulis-gerbang` |
| Repo besar sebelum commit | `higiene-repo` |

Pengulas melapor, tidak auto-fix. Pengerja pemiliknya yang membetulkan.

## 9. Batas mati

- Subagent tidak deploy, tidak push, tidak commit; sesi induk yang commit. Migrasi D1 produksi dan unggah R2 produksi dijalankan pemilik.
- Gerbang, ambang, dan uji haram dilemahkan untuk meloloskan kerjaan sendiri.
- Tidak ada rahasia, data pribadi, atau `account_id` di repo (KPV §9).
- Tidak ada tombol, kolom, atau rute data dummy (KEPUTUSAN K15); data contoh = fixture uji + seed D1 lokal.
- Teks Indonesia tanpa em dash; teks antarmuka ada di `id.json` dan `en.json`.
- Commit bahasa Indonesia, per batch.
