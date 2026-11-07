#!/usr/bin/env node
// Unduh dua daftar publik komitmen korporat ke folder yang diberi (scratchpad), bukan ke repo.
//   node scripts/panen/korporat_ambil.mjs <folder>   -> <folder>/re100.html, <folder>/sbti.xlsx
// UA jujur, robots dicek, jeda >= 2 dtk, berhenti pada 403/429 (lihat scripts/pipa/_panen_sopan.mjs). Tanpa login, tanpa medsos.
import fs from 'node:fs';
import { ambil } from '../pipa/_panen_sopan.mjs';

export const BERKAS = [
  ['https://www.there100.org/re100-members', 're100.html', false],
  ['https://files.sciencebasedtargets.org/production/files/companies-excel.xlsx', 'sbti.xlsx', true],
];
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  const dir = process.argv[2]; if (!dir) throw new Error('butuh folder tujuan');
  fs.mkdirSync(dir, { recursive: true });
  for (const [u, f, buf] of BERKAS) { const x = await ambil(u, { buf }); fs.writeFileSync(`${dir}/${f}`, x); console.log('ok', f, x.length); }
}
