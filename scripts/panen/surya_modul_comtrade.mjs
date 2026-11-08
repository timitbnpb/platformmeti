#!/usr/bin/env node
// Comtrade untuk /surya, tab Bahan baku: ekspor-impor Indonesia (pelapor 360) HS 250510 (pasir silika dan pasir kuarsa), 280461 (silikon >= 99,99 persen), 280469 (silikon lain), 700510/700529 tidak diambil (kaca surya belum terpisah di HS).
//   node scripts/panen/surya_modul_comtrade.mjs ambil [dir]   (jaringan; UA jujur, robots, jeda >= 2 dtk, stop 403/429)
//   node scripts/panen/surya_modul_comtrade.mjs ringkas [dir] (offline)
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ambil } from '../pipa/_panen_sopan.mjs';

export const HS = { '250510': 'Pasir silika dan pasir kuarsa', '280461': 'Silikon, kadar silikon minimal 99,99 persen (kelas polisilikon)', '280469': 'Silikon lain (kadar di bawah 99,99 persen)' };
export const TAHUN = [2019, 2020, 2021, 2022, 2023, 2024];
export const DIR_BAWAAN = '/private/tmp/claude-501/-Users-priyankaalfatehan28-Documents-GitHub-platformmeti/b1682dc3-8a11-4d9d-90d7-82b836c30f0d/scratchpad/surya-modul/';
const API = 'https://comtradeapi.un.org/public/v1/preview/C/A/HS?reporterCode=360';

export async function ambilSemua(dir = DIR_BAWAAN) {
  fs.mkdirSync(dir, { recursive: true });
  for (const hs of Object.keys(HS)) for (const th of TAHUN) for (const alir of ['M', 'X']) {
    const f = `${dir}${hs}_${alir}_${th}.json`;
    if (fs.existsSync(f)) continue;
    let j; try { j = await ambil(`${API}&period=${th}&cmdCode=${hs}&flowCode=${alir}`, { json: true }); } catch (e) { console.error('berhenti:', e.message); return; }
    if (!j) { console.error('429/terbatas: berhenti, hasil yang ada tersimpan'); return; }
    fs.writeFileSync(f, JSON.stringify({ hs, alir, th, ambil: new Date().toISOString().slice(0, 10), data: (j.data || []).map((r) => ({ p: r.partnerCode, v: r.primaryValue, w: r.netWgt })) }));
    console.log(hs, alir, th, (j.data || []).length);
  }
}
/** Murni: deret per HS dan arah (dunia p=0) plus lima mitra terbesar. */
export function ringkas(dir = DIR_BAWAAN) {
  const out = [];
  for (const hs of Object.keys(HS)) for (const alir of ['M', 'X']) for (const th of TAHUN) {
    const f = `${dir}${hs}_${alir}_${th}.json`; if (!fs.existsSync(f)) continue;
    const m = JSON.parse(fs.readFileSync(f, 'utf8')), d = m.data.find((r) => r.p === 0);
    const mitra = m.data.filter((r) => r.p !== 0 && r.v > 0).sort((a, b) => b.v - a.v).slice(0, 5).map((r) => ({ kode: r.p, usd: Math.round(r.v), kg: Math.round(r.w || 0) }));
    out.push({ hs, alir: alir === 'M' ? 'impor' : 'ekspor', tahun: th, usd: d ? Math.round(d.v) : mitra.reduce((a, r) => a + r.usd, 0), kg: d ? Math.round(d.w || 0) : null, mitra, tanggal: m.ambil });
  }
  return out;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dir = process.argv[3] || DIR_BAWAAN;
  if (process.argv[2] === 'ambil') await ambilSemua(dir); else console.log(JSON.stringify(ringkas(dir)).slice(0, 2000));
}
