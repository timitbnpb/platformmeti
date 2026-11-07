#!/usr/bin/env node
// public/data/global/kebijakan_dagang.json
//   node scripts/panen/dagang_kebijakan.mjs periksa   (jaringan: cek tiap dokumen Federal Register masih ada, judul cocok; UA jujur, jeda >= 2 dtk) -> data/dagang_kebijakan/periksa.json
//   node scripts/panen/dagang_kebijakan.mjs bangun    (offline)
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ambil } from '../pipa/_panen_sopan.mjs';
import { SUMBER, bangun } from './dagang_kebijakan_lib.mjs';

const AKAR = fileURLToPath(new URL('../../', import.meta.url));
const baca = (p) => JSON.parse(fs.readFileSync(AKAR + p, 'utf8'));

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv[2] === 'periksa') {
    fs.mkdirSync(AKAR + 'data/dagang_kebijakan/', { recursive: true });
    const hasil = [];
    for (const [id, s] of Object.entries(SUMBER)) {
      const m = s.url.match(/federalregister\.gov\/d\/(.+)$/); if (!m) continue;
      const j = await ambil(`https://www.federalregister.gov/api/v1/documents/${m[1]}.json`, { json: true });
      hasil.push({ id, nomor: m[1], terbit: j.publication_date, judul: j.title, cocok: j.publication_date === s.dokumen.slice(-10) });
      console.log(id, j.publication_date, hasil.at(-1).cocok);
    }
    fs.writeFileSync(AKAR + 'data/dagang_kebijakan/periksa.json', JSON.stringify(hasil, null, 1) + '\n');
  } else {
    const komponen = baca('public/data/dagang_komponen.json');
    const orgIds = new Set(baca('public/data/organisasi.json').baris.map((o) => o.id));
    const d = bangun({ komponen, insentif: baca('public/data/insentif_fiskal.json'), orgIds, tanggal: komponen.dibangun_pada });
    if (d.ditolak.length) console.error('ditolak', JSON.stringify(d.ditolak));
    fs.mkdirSync(AKAR + 'public/data/global/', { recursive: true });
    fs.writeFileSync(AKAR + 'public/data/global/kebijakan_dagang.json', JSON.stringify(d) + '\n');
    console.log('baris', d.jumlah);
  }
}
