#!/usr/bin/env node
// Comtrade tambahan untuk /baterai-ev: HS 870380 (kendaraan listrik), 283324 (nikel sulfat), 282520 (litium hidroksida), 283691 (litium karbonat), 260200 (bijih mangan), 810520 (kobalt).
// HS yang sudah ada (2604, 7501, 7502, 8507) dibaca dari hilirisasi.json dan dagang_komponen.json, tidak diambil ulang.
//   node scripts/panen/baterai_ev_comtrade.mjs ambil [dir]   (jaringan; jeda >= 2 dtk, stop 403) -> dir/<hs>_<M|X>_<tahun>.json
//   node scripts/panen/baterai_ev_comtrade.mjs ringkas [dir]  (offline) -> mencetak deret ringkas (dipakai baterai_ev.mjs bangun)
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ambil } from '../pipa/_panen_sopan.mjs';

export const HS_TAMBAH = { '870380': 'Kendaraan bermotor penggerak listrik saja (EV)', '283324': 'Nikel sulfat', '282520': 'Litium oksida dan hidroksida', '283691': 'Litium karbonat', '260200': 'Bijih mangan', '810520': 'Kobalt tempa dan barang dari kobalt' };
export const TAHUN = [2018, 2019, 2020, 2021, 2022, 2023, 2024];
export const DIR_BAWAAN = '/private/tmp/claude-501/-Users-priyankaalfatehan28-Documents-GitHub-platformmeti/b1682dc3-8a11-4d9d-90d7-82b836c30f0d/scratchpad/baterai-ev/';
const API = 'https://comtradeapi.un.org/public/v1/preview/C/A/HS?reporterCode=360';

export async function ambilSemua(dir = DIR_BAWAAN) {
  fs.mkdirSync(dir, { recursive: true });
  for (const hs of Object.keys(HS_TAMBAH)) for (const th of TAHUN) for (const alir of ['M', 'X']) {
    const f = `${dir}${hs}_${alir}_${th}.json`;
    if (fs.existsSync(f)) continue;
    const j = await ambil(`${API}&period=${th}&cmdCode=${hs}&flowCode=${alir}`, { json: true });
    if (!j) { console.error('429/terbatas: berhenti, ulangi nanti (hasil yang ada tersimpan)'); return; }
    fs.writeFileSync(f, JSON.stringify({ hs, alir, th, ambil: new Date().toISOString().slice(0, 10), data: (j.data || []).map((r) => ({ p: r.partnerCode, v: r.primaryValue, w: r.netWgt })) }));
    console.log(hs, alir, th, (j.data || []).length);
  }
}
/** Deret per HS dan arah: dunia (p=0) saja, plus lima mitra terbesar (kode numerik Comtrade). Murni. */
export function ringkas(dir = DIR_BAWAAN) {
  const out = [];
  for (const hs of Object.keys(HS_TAMBAH)) for (const alir of ['M', 'X']) for (const th of TAHUN) {
    const f = `${dir}${hs}_${alir}_${th}.json`; if (!fs.existsSync(f)) continue;
    const m = JSON.parse(fs.readFileSync(f, 'utf8')), d = m.data.find((r) => r.p === 0);
    const mitra = m.data.filter((r) => r.p !== 0 && r.v > 0).sort((a, b) => b.v - a.v).slice(0, 5).map((r) => ({ kode: r.p, usd: Math.round(r.v) }));
    out.push({ hs, alir: alir === 'M' ? 'impor' : 'ekspor', tahun: th, usd: d ? Math.round(d.v) : mitra.reduce((a, r) => a + r.usd, 0), kg: d ? Math.round(d.w || 0) : null, mitra, tanggal: m.ambil });
  }
  return out;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dir = process.argv[3] || DIR_BAWAAN;
  if (process.argv[2] === 'ambil') await ambilSemua(dir); else console.log(JSON.stringify(ringkas(dir)).slice(0, 2000));
}
