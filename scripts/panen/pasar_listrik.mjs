#!/usr/bin/env node
// public/data/pasar_listrik.json: HBA, DMO, tarif, subsidi, keandalan wilayah, analisis EST.
//   node scripts/panen/pasar_listrik.mjs            (offline) membangun berkas dari pasar_listrik_lib.mjs + berkas data yang sudah ada
//   node scripts/panen/pasar_listrik.mjs ambil DIR  (jaringan; UA jujur, robots, jeda >= 2 dtk, berhenti 403/429) unduh dua PDF resmi ESDM ke DIR untuk dibaca ulang
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { bangun, SUMBER } from './pasar_listrik_lib.mjs';
import { ambil } from '../pipa/_panen_sopan.mjs';

if (process.argv[2] === 'ambil') {
  const dir = process.argv[3]; if (!dir) throw new Error('beri DIR tujuan di luar repo');
  fs.mkdirSync(dir, { recursive: true });
  for (const id of ['hessi-2024', 'stat-gatrik-2024', 'kepmen-1395-2018']) {
    const s = SUMBER.find((x) => x.id === id);
    fs.writeFileSync(path.join(dir, id + '.pdf'), await ambil(s.url, { buf: true })); console.log('unduh', id);
  }
} else {
  const d = bangun();
  fs.writeFileSync(fileURLToPath(new URL('../../public/data/pasar_listrik.json', import.meta.url)), JSON.stringify(d) + '\n');
  console.log('sumber', d.sumber.length, 'hba tahunan', d.hba.tahunan.length, 'golongan', d.tarif.golongan.length, 'triwulan', d.tarif.triwulan.length);
}
