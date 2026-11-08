// Perkuat riset_kampus.json: tren tahunan, kolaborator luar negeri (iso2), sitasi (batas bawah) per kampus, dari OpenAlex (CC0, tanpa kunci).
// Pakai: node scripts/panen/openalex_kampus.mjs   Cache: raw/openalex_kampus/ (tidak di-commit). Berhenti pada 429/403; jalan ulang melanjutkan.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { AKAR, ambilJson, tulis } from '../pipa/_panen_umum.mjs';
import { TOPIK } from '../pipa/riset_kampus.mjs';

const BERKAS = path.join(AKAR, 'public/data/riset_kampus.json');
const CACHE = process.env.OA_CACHE || path.join(AKAR, 'raw/openalex_kampus');
const SEMUA = '(' + Object.values(TOPIK).map(s => s.slice(1, -1)).join(' OR ') + ')';
const f = id => `authorships.institutions.id:${id},publication_year:2019-2026,title_and_abstract.search:${SEMUA}`;
const url = (id, g) => `https://api.openalex.org/works?filter=${encodeURI(f(id))}&group_by=${g}&per_page=200`;

async function tarik(u) {
  const b = path.join(CACHE, crypto.createHash('sha1').update(u).digest('hex') + '.json');
  if (fs.existsSync(b)) return JSON.parse(fs.readFileSync(b, 'utf-8'));
  const j = await ambilJson(u);
  fs.mkdirSync(CACHE, { recursive: true }); fs.writeFileSync(b, JSON.stringify(j.group_by));
  return j.group_by;
}
const baca = u => { const b = path.join(CACHE, crypto.createHash('sha1').update(u).digest('hex') + '.json'); return fs.existsSync(b) ? JSON.parse(fs.readFileSync(b, 'utf-8')) : null; };

// murni: kelompok OpenAlex -> bidang tambahan baris kampus
export function ringkas(tahun, negara, sitasi) {
  const iso = k => String(k).replace('https://openalex.org/countries/', '').toUpperCase();
  return {
    tren_tahunan: Object.fromEntries(tahun.map(g => [String(g.key), g.count]).sort()),
    kolaborator_negara: negara.map(g => ({ iso2: iso(g.key), karya: g.count })).filter(x => /^[A-Z]{2}$/.test(x.iso2) && x.iso2 !== 'ID').sort((a, b) => b.karya - a.karya).slice(0, 12),
    sitasi_min: sitasi.reduce((s, g) => s + Number(g.key) * g.count, 0),
  };
}

async function utama() {
  const d = JSON.parse(fs.readFileSync(BERKAS, 'utf-8'));
  let henti = null, isi = 0;
  for (const b of d.baris) {
    if (b.tren_tahunan) { isi++; continue; }
    try {
      const t = [];
      for (const g of ['publication_year', 'authorships.countries', 'cited_by_count']) t.push(await tarik(url(b.openalex_id, g)));
      Object.assign(b, ringkas(...t)); isi++;
    } catch (e) { henti = e.message.slice(0, 80); break; }
  }
  d.meta.celah = (d.meta.celah || []).filter(x => !x.startsWith('Tren/kolaborator'));
  if (isi < d.baris.length) d.meta.celah.push(`Tren/kolaborator/sitasi baru untuk ${isi} dari ${d.baris.length} kampus (${henti || 'belum selesai'}); anggaran gratis OpenAlex dibagi per IP. Jalankan ulang untuk melanjutkan.`);
  d.meta.catatan_tambahan = 'tren_tahunan = karya energi per tahun terbit; kolaborator_negara = karya energi kampus yang juga berafiliasi di negara lain (iso2, tanpa ID); sitasi_min = jumlah sitasi dari 200 kelompok sitasi terbesar (batas bawah, ekor panjang terpotong).';
  tulis(BERKAS, d);
  console.log('terisi', isi, '/', d.baris.length, henti || '');
}
if (process.argv[1] === new URL(import.meta.url).pathname) utama().catch(e => { console.error(e.message); process.exit(1); });
