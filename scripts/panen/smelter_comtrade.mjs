// Ekspor Indonesia HS 7202/7501/7502/2604/8507/7601/2606 dari UN Comtrade (API preview publik tanpa kunci) -> data/industri/ekspor_comtrade.json
//   node scripts/panen/smelter_comtrade.mjs [tahun...]   (satu panggilan per tahun, jeda 3 dtk, berhenti pada 403/429; UA proyek)
// Preview membatasi satu periode per panggilan dan 500 baris. Nilai = USD FOB dilaporkan Indonesia (reporter 360), arus ekspor.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const UA = 'METI-Network-research/0.1 (+https://platformmeti.timitbnpb.workers.dev)';
export const HS = { 7202: 'Ferro-alloy (termasuk feronikel/NPI)', 7501: 'Matte nikel', 7502: 'Nikel tempa (katoda)', 2604: 'Bijih nikel', 8507: 'Akumulator listrik (baterai)', 7601: 'Aluminium tempa', 2606: 'Bijih bauksit' };
// Kode mitra M49 yang muncul sebagai mitra utama -> ISO2 (sisanya tidak dinamai)
export const ISO = { 156: 'cn', 410: 'kr', 392: 'jp', 842: 'us', 699: 'in', 36: 'au', 702: 'sg', 458: 'my', 704: 'vn', 764: 'th', 276: 'de', 344: 'hk', 490: 'tw', 528: 'nl', 380: 'it', 792: 'tr', 818: 'eg', 784: 'ae', 608: 'ph', 724: 'es', 250: 'fr', 826: 'gb', 710: 'za', 76: 'br', 124: 'ca', 643: 'ru', 586: 'pk', 50: 'bd', 56: 'be', 100: 'bg', 360: 'id', 251: 'fr', 12: 'dz', 579: 'no', 484: 'mx' };
const bendera = (i) => (i && fs.existsSync(path.join(ROOT, 'public/img/bendera', i + '.svg')) ? i : null); // tanpa berkas bendera = tanpa ikon
export function ringkas(d, tahun) {
  const out = {};
  for (const x of d.data || []) {
    const o = (out[x.cmdCode] ??= { tahun, usd: null, ton: null, mitra: [] });
    if (x.partnerCode === 0) { o.usd = Math.round(x.primaryValue); o.ton = Math.round((x.netWgt || 0) / 1000); } else if (x.primaryValue > 0) o.mitra.push({ kode: x.partnerCode, iso: bendera(ISO[x.partnerCode]), usd: Math.round(x.primaryValue) });
  }
  for (const o of Object.values(out)) { o.mitra.sort((a, b) => b.usd - a.usd); o.mitra = o.mitra.slice(0, 6); }
  return out;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const tahun = process.argv.slice(2).map(Number).filter(Boolean); if (!tahun.length) tahun.push(2021, 2022, 2023, 2024);
  const hasil = {};
  for (const y of tahun) {
    const r = await fetch(`https://comtradeapi.un.org/public/v1/preview/C/A/HS?reporterCode=360&flowCode=X&maxrecords=500&cmdCode=${Object.keys(HS).join(',')}&period=${y}`, { headers: { 'user-agent': UA } });
    if (r.status === 403 || r.status === 429) { console.error('berhenti:', r.status); break; }
    if (!r.ok) { console.error(y, r.status); continue; }
    const ring = ringkas(await r.json(), y);
    for (const [k, v] of Object.entries(ring)) (hasil[k] ??= {})[y] = v;
    await new Promise((s) => setTimeout(s, 3000));
  }
  const berkas = { diambil: new Date().toISOString().slice(0, 10), sumber: { judul: 'UN Comtrade (API preview publik), ekspor Indonesia, HS 2017', penerbit: 'UN Statistics Division', url: 'https://comtradeapi.un.org/public/v1/preview/C/A/HS', tingkat_bukti: 'resmi' }, hs: HS, nilai: hasil };
  fs.writeFileSync(path.join(ROOT, 'data/industri/ekspor_comtrade.json'), JSON.stringify(berkas, null, 1) + '\n');
  console.log('ekspor_comtrade:', Object.keys(hasil).join(','));
}
