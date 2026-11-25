// Panen OSM power=plant|generator semua bahan bakar untuk kembaran jaringan (KJ-14). Lisensi ODbL.
//   node scripts/panen/osm_pembangkit_kembaran.mjs <dirMentah>   (satu berkas JSON per ubin; lanjut bila diulang)
// Host, UA, ubin sama dengan scripts/pipa/data_transmisi.mjs. Tidak menyentuh public/data/pembangkit_osm.json.
import fs from 'node:fs';
import path from 'node:path';
import { UA, HOST, WILAYAH } from '../pipa/data_transmisi.mjs';

const dir = process.argv[2];
if (!dir) { console.log('pakai: node scripts/panen/osm_pembangkit_kembaran.mjs <dirMentah>'); process.exit(1); }
const tidur = (ms) => new Promise((r) => setTimeout(r, ms));
// center: titik pusat untuk way/relation; tag lengkap (plant:source, generator:source, plant:output:electricity, operator, name, start_date).
const kueri = (b) => `[out:json][timeout:280];(nwr["power"~"^(plant|generator)$"](${b.join(',')}););out center tags;`;

async function tarik(b) {
  const r = await fetch(HOST, { method: 'POST', headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'data=' + encodeURIComponent(kueri(b)), signal: AbortSignal.timeout(330000) }).catch((e) => ({ ok: false, status: String(e) }));
  if (r.ok) { const t = await r.text(); JSON.parse(t); return t; }
  console.log('gagal', b.join(','), r.status); if (r.status === 403) process.exit(2);
  await tidur(r.status === 429 ? 60000 : 20000); return null;
}
async function ubin(b, minSisi = 1.5) {
  const f = path.join(dir, `u_${b.join('_')}.json`); if (fs.existsSync(f)) return;
  for (let k = 0; k < 2; k++) { const t = await tarik(b); if (t) { fs.writeFileSync(f, t); console.log('ok', b.join(','), t.length); await tidur(6000); return; } }
  const [s, w, n, e] = b; if (Math.min(n - s, e - w) / 2 < minSisi) { console.log('menyerah', b.join(',')); return; }
  const ms = (s + n) / 2, mw = (w + e) / 2;
  for (const q of [[s, w, ms, mw], [s, mw, ms, e], [ms, w, n, mw], [ms, mw, n, e]]) await ubin(q, minSisi);
}
fs.mkdirSync(dir, { recursive: true });
for (const b of Object.values(WILAYAH)) await ubin(b);
console.log('selesai');
