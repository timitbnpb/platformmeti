#!/usr/bin/env node
// Panen UN Comtrade BULANAN (API publik /preview, tanpa kunci; 1 periode per panggilan) impor/ekspor Indonesia per HS EBT, semua mitra.
//   PEMERINTAH_MENTAH=<dir> node scripts/panen/data_pemerintah_comtrade.mjs   -> <dir>/comtrade/<hs>_<M|X>_<yyyymm>.json (bisa dilanjutkan)
// Kuota /preview: ~130 panggilan lalu 403 (teramati 2026-11-08); skrip berhenti pada 403, lanjutkan nanti (berkas yang ada dilewati). Argumen: dari sampai [hs,hs].
// Pembangun berkas ada di data_pemerintah.mjs. UA jujur, jeda >= 2 dtk (ambil), stop 403.
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ambil } from '../pipa/_panen_sopan.mjs';
import { HS_BULANAN, bulanRentang } from './data_pemerintah_lib.mjs';

const AKAR = fileURLToPath(new URL('../../', import.meta.url));
export const MENTAH = (process.env.PEMERINTAH_MENTAH || AKAR + 'data/pemerintah_mentah/').replace(/\/?$/, '/');
const API = 'https://comtradeapi.un.org/public/v1/preview/C/M/HS?reporterCode=360';

export async function ambilBulanan(dari = '2022-01', sampai = '2026-10', hsDaftar = Object.keys(HS_BULANAN)) {
  const dir = MENTAH + 'comtrade/';
  fs.mkdirSync(dir, { recursive: true });
  for (const b of bulanRentang(dari, sampai)) for (const hs of hsDaftar) for (const alir of ['M', 'X']) {
    const f = `${dir}${hs}_${alir}_${b}.json`;
    if (fs.existsSync(f)) continue;
    const j = await ambil(`${API}&period=${b}&cmdCode=${hs}&flowCode=${alir}`, { json: true });
    fs.writeFileSync(f, JSON.stringify({ hs, alir, bulan: b, ambil: new Date().toISOString().slice(0, 10), data: (j.data || []).map((r) => ({ p: r.partnerCode, v: r.primaryValue, w: r.netWgt })) }));
    console.log(hs, alir, b, (j.data || []).length);
  }
}
if (process.argv[1] === fileURLToPath(import.meta.url)) await ambilBulanan(process.argv[2], process.argv[3], process.argv[4] ? process.argv[4].split(',') : undefined);
