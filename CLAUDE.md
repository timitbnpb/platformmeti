# CLAUDE.md: Platform Jaringan METI

Semua aturan agent dan subagent ada di **`AGENTS.md`** (router, rantai otoritas dokumen, kebijakan model, batas mati). Baca itu dulu.

Fakta singkat: Cloudflare Worker + static assets + D1 + R2, vanilla JS tanpa build step dan tanpa framework, uji `node:test` (`npm run uji`). Paket perencanaan di `docs/perencanaan/`; `KEPUTUSAN-METI.md` menang atas dokumen lain. Repo publik: tanpa rahasia, data pribadi, atau `account_id`.

Kebijakan model (rinci: `AGENTS.md` §1.3):
- Opus 5.5 = induk/perencana saja: rencana, kontrak inti, review akhir, commit/push; tidak menulis kode massal atau membaca berkas besar utuh.
- Sonnet = pengerja + pemeriksa nalar; Haiku = pemeriksa pola dan pencarian murah.
- Tiap `.claude/agents/*.md` wajib `model:`; env `CLAUDE_CODE_SUBAGENT_MODEL=sonnet` jaring pengaman.
- Hemat: brief = path + kriteria selesai, maks 5 agent paralel, satu pemilik per berkas, laporan <= 15 baris, SendMessage bukan agent baru.
- Ukur dengan `npm run token:ukur`.
