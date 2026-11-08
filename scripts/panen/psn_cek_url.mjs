// Memeriksa tiap URL sumber di data/psn/pengayaan.json (GET, UA proyek, jeda >= 2 dtk, berhenti pada 429).
//   node scripts/panen/psn_cek_url.mjs <berkasKeluaran.json>   -> {id: kodeStatus}
import fs from 'node:fs';
const UA = 'METI-Network-research/0.1 (+https://platformmeti.timitbnpb.workers.dev)';
const d = JSON.parse(fs.readFileSync(new URL('../../data/psn/pengayaan.json', import.meta.url), 'utf8'));
const hasil = {};
for (const [id, s] of Object.entries(d.sumber)) {
  if (!s.url) continue;
  try {
    const r = await fetch(s.url, { headers: { 'User-Agent': UA }, redirect: 'follow', signal: AbortSignal.timeout(25000) });
    hasil[id] = r.status; await r.body?.cancel();
    if (r.status === 429) { console.error('429, berhenti'); break; }
  } catch (e) { hasil[id] = 'galat:' + (e.cause?.code || e.name); }
  await new Promise((r) => setTimeout(r, 2200));
}
fs.writeFileSync(process.argv[2], JSON.stringify(hasil, null, 1));
console.log(Object.entries(hasil).filter(([, v]) => v !== 200).map(([k, v]) => k + '=' + v).join(' ') || 'semua 200');
