# Ilmu orkestrator

> Kelas: orkestrator · Model: opus (sesi induk)
> Dibaca SEBELUM kerja (`node scripts/agents/ilmu.mjs baca orkestrator`). Kasus baru
> ditambah SESUDAH kerja lewat `node scripts/agents/ilmu.mjs kasus orkestrator "..."`.

## Peta berkas & tabel

- `scripts/agents/roster.json`: manifest SATU-SATUNYA sumber armada (18 agent). Tiap entri: `nama`, `kelas` (pengerja|platform|pemeriksa|lapangan), `model`, `ringkas`, `kapan`, `fokus`, `larangan`, `bisa`, `tidak`; pengerja wajib `milik` (glob wilayah).
- `npm run agents:build` menghasilkan `.claude/agents/*.md`, kerangka `.claude/ilmu-agent/<nama>.md`, dan `KATALOG.md`; `npm run agents:check` menolak yang basi atau yatim.
- `node scripts/agents/ilmu.mjs pemilik <berkas...>`: pengerja pemilik berkas. `baca`, `cek`, `catat`, `kasus` untuk ilmu dan jejak.
- Pemilik wilayah: `worker` src/**; `layar` public/**; `pipa` scripts/panen|pipa|direktori|mesin, data/**, workflow panen dan potret; `migrasi` migrations/**; `gerbang` tests/**; `mekanik` config, CI uji, scripts/agents, .claude/settings.json.
- Dokumen sumber: `docs/perencanaan/` (rantai otoritas di AGENTS.md). Meteran: `npm run token:ukur`.

## Aturan & invarian

- Opus merencanakan dan memegang kontrak inti (skema D1, API `hak.js`, router, token desain), commit dan push; pengerja Sonnet menulis kode; pemeriksa pola Haiku, pemeriksa nalar Sonnet (AGENTS.md §1.3).
- Rakitan = 1 pengerja + 1-3 pemeriksa, maksimal 5 paralel; pemeriksa tidak pernah pengerja yang sama; verifier konteks bersih memakai `peninjau-bersih`.
- Kontrak inti dikunci dulu, baru agent paralel. Satu pemilik per berkas. Brief = path + kriteria selesai. Laporan agent <= 15 baris.
- Larangan semua agent: tidak deploy, push, commit, migrasi produksi, melonggarkan gerbang. Dipaku di `build.mjs`.
- Otoritas membuat agent: berkas tanpa pemilik dengan kerja berulang, dua kali jatuh ke `general-purpose`, atau ilmu menembus 40 KB. Pintunya roster -> build -> isi ilmu -> laporkan.
- Dokumen bertentangan atau kurang: berhenti dan tanya pemilik (KEPUTUSAN-METI). KP K15: tidak ada tombol, kolom, atau rute dummy.

## Ranjau yang pernah meledak

- Sub-agent tanpa `model:` diam-diam jalan di Opus (AGEN.md); jaringnya env `CLAUDE_CODE_SUBAGENT_MODEL` dan gerbang model.
- AGENTS.md pangantara 110 KB jadi hutang (R11 §8.1): jaga di bawah ~150 baris, rinci ke ilmu agent.
- Kebijakan tanpa meteran hanya terbaca (R11 §7.11): jalankan `npm run token:ukur`.
- Dua penulis di berkas yang sama saling menimpa: pakai `ilmu.mjs pemilik` dan worktree untuk fan-out yang menulis.
- Pertentangan antar dokumen yang sudah diketahui (panen 1001startup D15 vs KPV/ADR-06, `laju` di 0001 vs 0006, pemilik `migrations/**` DT §2.3 vs roster): ikuti rantai otoritas, laporkan ke pemilik.

## Gerbang yang menghakimi

- `tests/gerbang-model-agent.test.mjs`: env ada dan bukan opus, tiap agent dan entri roster ber-`model:` sonnet|haiku.
- `tests/gerbang-ilmu-agent.test.mjs`: katalog segar, ilmu terisi (>= 2000 karakter, lima bagian), protokol ilmu ada, larangan bersama ada, satu pemilik per berkas, jejak melewati yang tak berubah, AGENTS.md memuat §1.5.
- `npm run agents:check` dan `npm run uji` di CI (`.github/workflows/uji.yml`).

## Kasus

Belum ada kasus. Tambahkan lewat ilmu.mjs kasus.
