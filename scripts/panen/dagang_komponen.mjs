#!/usr/bin/env node
// public/data/dagang_komponen.json: ekspor-impor Indonesia komponen EBT menurut HS 6 digit, per tahun dan mitra dagang.
//   node scripts/panen/dagang_komponen.mjs ambil   (jaringan: UN Comtrade API publik /preview tanpa kunci; UA jujur, jeda >= 2 dtk, stop 403) -> data/dagang_komponen/*.json
//   node scripts/panen/dagang_komponen.mjs bangun  (offline) -> public/data/dagang_komponen.json
// Fungsi murni ada di dagang_komponen_lib.mjs agar bisa diuji.
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ambil } from '../pipa/_panen_sopan.mjs';
import { KOMPONEN, TAHUN, kodeUntuk, bangun } from './dagang_komponen_lib.mjs';

const AKAR = fileURLToPath(new URL('../../', import.meta.url));
const MENTAH = AKAR + 'data/dagang_komponen/';
const API = 'https://comtradeapi.un.org/public/v1/preview/C/A/HS?reporterCode=360';

export async function ambilSemua() {
  fs.mkdirSync(MENTAH, { recursive: true });
  const ref = MENTAH + 'mitra.json';
  if (!fs.existsSync(ref)) fs.writeFileSync(ref, await ambil('https://comtradeapi.un.org/files/v1/app/reference/partnerAreas.json'));
  for (const k of KOMPONEN) for (const th of TAHUN) for (const alir of ['M', 'X']) {
    const hs = kodeUntuk(k, th), f = `${MENTAH}${hs}_${alir}_${th}.json`;
    if (fs.existsSync(f)) continue;
    const j = await ambil(`${API}&period=${th}&cmdCode=${hs}&flowCode=${alir}`, { json: true });
    fs.writeFileSync(f, JSON.stringify({ hs, alir, th, ambil: new Date().toISOString().slice(0, 10), data: (j.data || []).map((r) => ({ p: r.partnerCode, v: r.primaryValue, w: r.netWgt, q: r.qty })) }));
    console.log(hs, alir, th, (j.data || []).length);
  }
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv[2] === 'ambil') await ambilSemua();
  else { const d = bangun(); fs.writeFileSync(AKAR + 'public/data/dagang_komponen.json', JSON.stringify(d) + '\n'); console.log('baris', d.tahunan.length, 'mitra', d.mitra.length); }
}
