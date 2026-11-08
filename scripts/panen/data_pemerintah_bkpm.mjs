#!/usr/bin/env node
// Panen data.bkpm.go.id (Kementerian Investasi, Satu Data, terbuka): "Data Realisasi Investasi Triwulan N Tahun Y" (LKPM/OSS), CSV dalam zip.
//   PEMERINTAH_MENTAH=<dir> node scripts/panen/data_pemerintah_bkpm.mjs ambil   -> <dir>/bkpm/<tahun>-<tw>.csv  (bisa dilanjutkan; robots Allow /)
//   PEMERINTAH_MENTAH=<dir> node scripts/panen/data_pemerintah_bkpm.mjs ringkas  -> mentah ke ringkasan agregat (lihat data_pemerintah.mjs bangun)
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { ambil } from '../pipa/_panen_sopan.mjs';

const AKAR = fileURLToPath(new URL('../../', import.meta.url));
export const MENTAH = (process.env.PEMERINTAH_MENTAH || AKAR + 'data/pemerintah_mentah/').replace(/\/?$/, '/');
const ROMAWI = ['i', 'ii', 'iii', 'iv'];
// Sebagian slug memakai akhiran acak (terbaca dari daftar data.bkpm.go.id/dataset?search=realisasi investasi triwulan).
export const AKHIRAN = { '2022-1': 'wRMSb3X', '2022-4': 'n28Sqxg', '2023-1': '6pOYjbx', '2023-4': 'EggwcsQ', '2024-2': 'UVTkOaI', '2024-3': 'oXA2V00', '2024-4': 'nKo1EyF', '2025-1': 'X4LGYJf', '2025-3': 'hXdFHZK', '2025-4': 'szexEQe', '2026-1': 'i5AeXC3' };
export const slug = (th, tw) => `data-realisasi-investasi-triwulan-${ROMAWI[tw - 1]}-tahun-${th}` + (AKHIRAN[`${th}-${tw}`] ? '-' + AKHIRAN[`${th}-${tw}`] : '');

export async function ambilSemua(dari = 2022, sampai = 2026) {
  const dir = MENTAH + 'bkpm/'; fs.mkdirSync(dir, { recursive: true });
  for (let th = dari; th <= sampai; th++) for (let tw = 1; tw <= 4; tw++) {
    const f = `${dir}${th}-${tw}.csv`;
    if (fs.existsSync(f) || fs.existsSync(f + '.tidak-ada')) continue;
    let html; try { html = await ambil(`https://data.bkpm.go.id/dataset-detail/${slug(th, tw)}`); } catch (e) { fs.writeFileSync(f + '.tidak-ada', String(e.message)); console.log(th, tw, 'tak ada', e.message); continue; }
    const m = /generate-download-zip\/[0-9a-f-]{36}\/file/.exec(html);
    if (!m) { fs.writeFileSync(f + '.tidak-ada', 'tanpa tautan unduh'); console.log(th, tw, 'tanpa tautan'); continue; }
    const zip = dir + `${th}-${tw}.zip`;
    fs.writeFileSync(zip, await ambil('https://data.bkpm.go.id/dataset/' + m[0], { buf: true }));
    const ada = execFileSync('unzip', ['-Z1', zip], { encoding: 'utf8' }).split('\n').find((x) => /\.csv$/i.test(x));
    if (!ada) { fs.writeFileSync(f + '.tidak-ada', 'zip tanpa csv'); continue; }
    fs.writeFileSync(f, execFileSync('unzip', ['-p', zip, ada], { maxBuffer: 1 << 28 }));
    fs.unlinkSync(zip); console.log(th, tw, 'ok', fs.statSync(f).size);
  }
}
if (process.argv[1] === fileURLToPath(import.meta.url)) await ambilSemua();
