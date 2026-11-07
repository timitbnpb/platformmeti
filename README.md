# Platform Jaringan METI

Direktori jaringan energi terbarukan Indonesia untuk METI (Masyarakat Energi Terbarukan Indonesia). Porting dari Direktori Jaringan Kebencanaan, penyajian informasi ala 1001startup.id, gaya visual METI, di Cloudflare (Worker + D1 + R2). Tanpa build step.

Status 7 Nov 2026: tahap perencanaan dan kerangka. Baca `docs/perencanaan/KEPUTUSAN-METI.md` dulu, lalu `AGENTS.md`.

## Menjalankan lokal

```
npm install
cp .dev.vars.example .dev.vars   # isi nilai lokal; berkas ini tidak dilacak git
npm run dev                       # wrangler dev
npm run uji                       # node --test
npm run agents:build              # hasilkan .claude/agents dari scripts/agents/roster.json
```

Butuh Node >= 20. Wrangler dipasang persis 4.158.0. `wrangler.jsonc` tidak memuat `account_id`; login lewat `npx wrangler login`. Deploy dan migrasi produksi dijalankan pemilik, bukan CI atau agent.

Repo ini publik: data pribadi, kontak, rahasia, dan ID akun Cloudflare tidak pernah masuk repo.
