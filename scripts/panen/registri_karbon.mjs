// Panen registri karbon Indonesia ke direktori mentah (di luar repo). Sopan: UA jujur, robots, jeda >= 2 dtk, berhenti di 403/429.
//   node scripts/panen/registri_karbon.mjs <dirMentah>
// Sumber: VROD Berkeley (salinan Verra + Gold Standard, CC BY 4.0), Gold Standard public API, IDXCarbon (SPE-GRK + PDF bulanan), Plan Vivo.
// Tidak dipanen: registry.verra.org (SPA berkunci API), srn.menlhk.go.id (koneksi gagal), World Bank dashboard (404 tanpa kunci).
import fs from 'node:fs';
import path from 'node:path';
import { ambil } from '../pipa/_panen_sopan.mjs';

const dir = process.argv[2]; if (!dir) { console.error('pakai: registri_karbon.mjs <dir>'); process.exit(1); }
fs.mkdirSync(dir, { recursive: true });
const w = (n) => path.join(dir, n);
const ada = (n) => fs.existsSync(w(n)) && fs.statSync(w(n)).size > 1000;
const coba = async (nama, f) => { try { await f(); console.log('ok', nama); } catch (e) { console.log('GAGAL', nama, e.message); } };

await coba('vrod', async () => { if (!ada('vrod.xlsx')) fs.writeFileSync(w('vrod.xlsx'), await ambil('https://gspp.berkeley.edu/assets/uploads/page/VROD-registry-files--2026-08.xlsx', { buf: true })); });
await coba('gs', async () => {
  if (ada('gs_semua.json')) return; const semua = [];
  for (let p = 1; p < 20; p++) { const r = await ambil(`https://public-api.goldstandard.org/projects?page=${p}&size=150&countries=ID`, { json: true }); const a = Array.isArray(r) ? r : r.data || r.content || []; semua.push(...a); if (a.length < 150) break; }
  fs.writeFileSync(w('gs_semua.json'), JSON.stringify(semua));
});
await coba('idx_spe', async () => { if (!ada('idx_spe.html')) fs.writeFileSync(w('idx_spe.html'), await ambil('https://idxcarbon.co.id/product-spe-grk')); });
await coba('idx_bulanan_daftar', async () => { if (!ada('idx_bulanan.html')) fs.writeFileSync(w('idx_bulanan.html'), await ambil('https://idxcarbon.co.id/data-monthly')); });
if (ada('idx_bulanan.html')) {
  const t = fs.readFileSync(w('idx_bulanan.html'), 'utf8'); let i = 0;
  for (const m of t.matchAll(/<td[^>]*>([A-Z][a-z]+ \d{4})<\/td>(.*?)<\/tr>/gs)) {
    i++; const h = m[2].match(/href="(https:\/\/[^"]+\/document\/share\/[^"]+)"/); if (!h) continue; const f = `idx_b_${i}.pdf`;
    if (ada(f)) continue;
    await coba('idx ' + m[1], async () => { // host tanpa www lebih sering hidup; 404 dilewati (dokumen belum publik)
      const b = await ambil(h[1].replace('://www.', '://'), { buf: true }); if (b.slice(0, 4).toString() !== '%PDF') throw new Error('bukan PDF'); fs.writeFileSync(w(f), b); fs.writeFileSync(w(`idx_b_${i}.bulan`), m[1]);
    });
  }
}
await coba('permen16', async () => { if (!ada('permen16.pdf')) fs.writeFileSync(w('permen16.pdf'), await ambil('https://jdih.esdm.go.id/dokumen/download?id=Permen+ESDM+Nomor+16+Tahun+2022.pdf', { buf: true })); });
await coba('uu_hpp', async () => { if (!ada('uuhpp.pdf')) fs.writeFileSync(w('uuhpp.pdf'), await ambil('https://peraturan.bpk.go.id/Download/178620/UU%20Nomor%207%20Tahun%202021.pdf', { buf: true })); });
await coba('planvivo_nanga', async () => { if (!ada('nanga.html')) fs.writeFileSync(w('nanga.html'), await ambil('https://www.planvivo.org/projects/nanga-lauk-indonesia')); });
await coba('planvivo', async () => { if (!ada('planvivo.html')) fs.writeFileSync(w('planvivo.html'), await ambil('https://www.planvivo.org/projects')); });
