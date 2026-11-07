// Perluasan riset_kampus.json (OpenAlex, kampus): (1) jumlah karya EBT per PROVINSI dari cache OpenAlex panen C (tanpa panggilan baru),
// (2) artikel jurnal nasional dari Garuda (garuda.kemdiktisaintek.go.id, pencarian judul, robots tak membatasi) per topik, dicocokkan ke orang.json.
// Pakai: node scripts/pipa/riset_ebt.mjs [--halaman=5] [--tanggal=...]. HTML mentah di raw/garuda/ (cache, tidak di-commit). SINTA 403 untuk bot: tidak dipakai.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { AKAR, TANGGAL, UA, tidur, tulis, bacaRef, kodeProvinsi } from './_panen_umum.mjs';
import { TOPIK, cocokOrang } from './riset_kampus.mjs';

const C = process.env.PANEN_C || path.join(AKAR, '..', 'C');
const PERIODE = '2019-2026';
const REGION = { 'West Java': 'Jawa Barat', 'Central Java': 'Jawa Tengah', 'East Java': 'Jawa Timur', 'West Sumatra': 'Sumatera Barat', 'South Sulawesi': 'Sulawesi Selatan', 'North Sumatra': 'Sumatera Utara', 'West Nusa Tenggara': 'Nusa Tenggara Barat', Aceh: 'Aceh', Jakarta: 'DKI Jakarta', Banten: 'Banten', 'South Kalimantan': 'Kalimantan Selatan', Riau: 'Riau', Yogyakarta: 'DI Yogyakarta', Jambi: 'Jambi', 'North Sulawesi': 'Sulawesi Utara', 'West Kalimantan': 'Kalimantan Barat', Gorontalo: 'Gorontalo', 'Southeast Sulawesi': 'Sulawesi Tenggara', Maluku: 'Maluku', 'East Nusa Tenggara': 'Nusa Tenggara Timur', 'South Sumatra': 'Sumatera Selatan', Lampung: 'Lampung', 'Central Kalimantan': 'Kalimantan Tengah', Bali: 'Bali', 'East Kalimantan': 'Kalimantan Timur', Bengkulu: 'Bengkulu', 'Central Sulawesi': 'Sulawesi Tengah' };
const sha = u => crypto.createHash('sha1').update(u).digest('hex');
const cacheC = u => { const f = path.join(C, 'raw/openalex', sha(u) + '.json'); return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf-8')) : null; };

export function perProvinsi() {
  const SEMUA = '(' + Object.values(TOPIK).map(s => s.slice(1, -1)).join(' OR ') + ')';
  const dasar = `authorships.institutions.country_code:ID,publication_year:${PERIODE},title_and_abstract.search:`;
  const u = (f) => `https://api.openalex.org/works?filter=${encodeURI(f)}&group_by=authorships.institutions.id&per_page=200`;
  const inst = cacheC('https://api.openalex.org/institutions?filter=country_code:ID,type:education&sort=works_count:desc&per_page=100&select=id,display_name,ror,works_count,geo')?.results;
  const total = cacheC(u(dasar + SEMUA))?.group_by;
  if (!inst || !total) throw new Error('cache OpenAlex panen C tidak ada (PANEN_C=...)');
  const topik = Object.fromEntries(Object.entries(TOPIK).map(([t, s]) => [t, Object.fromEntries((cacheC(u(dasar + s))?.group_by || []).map(g => [g.key, g.count]))]));
  const jml = Object.fromEntries(total.map(g => [g.key, g.count]));
  const p = new Map(); let tanpa = 0;
  for (const i of inst) {
    const n = jml[i.id]; if (!n) continue;
    const prov = kodeProvinsi(REGION[i.geo?.region] || '');
    if (!prov) { tanpa += n; continue; }
    const r = p.get(prov.kode) || p.set(prov.kode, { kode: prov.kode, provinsi: prov.nama, kampus: [], karya_energi_2019_sekarang_jumlah_kampus: 0, per_topik_jumlah_kampus: Object.fromEntries(Object.keys(TOPIK).map(t => [t, 0])) }).get(prov.kode);
    r.kampus.push({ nama: i.display_name, openalex_id: i.id.replace('https://openalex.org/', ''), karya: n });
    r.karya_energi_2019_sekarang_jumlah_kampus += n;
    for (const t of Object.keys(TOPIK)) r.per_topik_jumlah_kampus[t] += topik[t][i.id] || 0;
  }
  const baris = [...p.values()].map(r => ({ ...r, kampus: r.kampus.sort((a, b) => b.karya - a.karya), sumber_url: 'https://api.openalex.org/works', tanggal_periksa: TANGGAL, tingkat_bukti: 'via-pihak-ketiga' })).sort((a, b) => b.karya_energi_2019_sekarang_jumlah_kampus - a.karya_energi_2019_sekarang_jumlah_kampus);
  return { baris, karya_kampus_tanpa_provinsi: tanpa };
}

// ---- Garuda ----
export const GARUDA_TOPIK = {
  surya: 'pembangkit listrik tenaga surya', angin: 'turbin angin', panas_bumi: 'panas bumi', hidro: 'mikrohidro',
  bioenergi: 'biogas', biomassa: 'biomassa energi', hidrogen: 'hidrogen energi', baterai: 'penyimpanan energi baterai', transisi: 'energi terbarukan',
};
const dekode = s => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const xmp = (h, re) => { const m = h.match(re); return m ? dekode(m[1]).replace(/\s+/g, ' ').trim() : null; };
export function parseGaruda(html) {
  const total = Number((html.match(/Found ([\d,]+) documents/) || [])[1]?.replace(/,/g, '')) || 0;
  const artikel = html.split('<div class="article-item">').slice(1).map(b => {
    const id = (b.match(/href="\/documents\/detail\/(\d+)"/) || [])[1];
    const judul = xmp(b, /class="title-article"[^>]*>\s*<xmp>([\s\S]*?)<\/xmp>/);
    const jurnal = xmp(b, /<xmp class="subtitle-article">([\s\S]*?)<\/xmp>/);
    const penerbit = xmp(b, /Publisher : <\/i><xmp class="subtitle-article">([\s\S]*?)<\/xmp>/);
    const penulis = [...b.matchAll(/class="author-article"[^>]*><xmp>([\s\S]*?)<\/xmp>/g)].map(m => dekode(m[1]).trim());
    const doi = (b.match(/href="https?:\/\/doi\.org\/([^"]+)"/) || [])[1] || null;
    const tahun = Number((jurnal || '').match(/\((\d{4})\)/)?.[1]) || null;
    return id && judul ? { garuda_id: id, judul, penulis, jurnal, tahun, penerbit, doi, sumber_url: `https://garuda.kemdiktisaintek.go.id/documents/detail/${id}` } : null;
  }).filter(Boolean);
  return { total, artikel };
}
async function halaman(q, p) {
  const f = path.join(AKAR, 'raw/garuda', sha(q + '|' + p) + '.html');
  if (fs.existsSync(f)) return fs.readFileSync(f, 'utf-8');
  const r = await fetch(`https://garuda.kemdiktisaintek.go.id/documents?q=${encodeURIComponent(q)}&page=${p}`, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(60000) });
  if (r.status === 403) throw new Error('403 berhenti total (Garuda)');
  if (!r.ok) throw new Error(`HTTP ${r.status} garuda ${q} ${p}`);
  const h = await r.text(); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, h, 'utf-8'); await tidur(2200); return h;
}

async function utama() {
  const maks = Number((process.argv.find(a => a.startsWith('--halaman=')) || '=5').split('=')[1]);
  const orang = bacaRef('public/data/orang.json').baris;
  const prov = perProvinsi();
  const jurnal = []; const perTopik = {}; const lihat = new Set();
  for (const [t, q] of Object.entries(GARUDA_TOPIK)) {
    for (let p = 1; p <= maks; p++) {
      const { total, artikel } = parseGaruda(await halaman(q, p));
      perTopik[t] = { kueri: q, total_dokumen_garuda: total };
      if (!artikel.length) break;
      for (const a of artikel) {
        if (lihat.has(a.garuda_id)) { jurnal.find(x => x.garuda_id === a.garuda_id).topik.push(t); continue; } lihat.add(a.garuda_id);
        jurnal.push({ ...a, topik: [t], usulan_orang_id: [...new Set(a.penulis.flatMap(n => cocokOrang(n, orang)))].sort(), tanggal_periksa: TANGGAL, tingkat_bukti: 'via-pihak-ketiga' });
      }
    }
  }
  tulis(path.join(AKAR, 'public/data/riset_ebt.json'), {
    jenis: 'riset_ebt', tanggal_ambil: TANGGAL, tingkat_bukti: 'via-pihak-ketiga', periode_openalex: PERIODE,
    lisensi: { provinsi: 'CC0 (OpenAlex)', jurnal_nasional: 'Garuda: hanya metadata (judul, penulis, jurnal, tahun, tautan); atribusi Kemdiktisaintek' },
    sumber: { provinsi: 'OpenAlex (CC0), agregasi cache panen C: tanpa panggilan baru', jurnal_nasional: 'Garuda, Kemdiktisaintek (garuda.kemdiktisaintek.go.id), pencarian judul' },
    ringkas_garuda: perTopik, jumlah_artikel: jurnal.length, per_provinsi: prov.baris, karya_kampus_tanpa_provinsi: prov.karya_kampus_tanpa_provinsi, artikel_jurnal: jurnal.sort((a, b) => (b.tahun || 0) - (a.tahun || 0) || a.garuda_id.localeCompare(b.garuda_id)),
    meta: {
      catatan: 'per_provinsi: jumlah karya per kampus dijumlah per provinsi kampus; karya bersama antarkampus dihitung berulang dan topik tumpang tindih, jadi jangan dijumlah lintas kampus/topik sebagai karya unik. Per kampus dan per pakar ada di riset_kampus.json (tidak diulang). Artikel Garuda: metadata saja (judul, penulis, jurnal, DOI, tautan), tanpa abstrak/PDF. usulan_orang_id = kecocokan nama persis ke orang.json, usulan untuk kurator.',
      celah: [
        'Kampus yang dihitung = 100 institusi pendidikan teratas OpenAlex; kampus tanpa data provinsi OpenAlex masuk karya_kampus_tanpa_provinsi. Provinsi tanpa kampus di 100 teratas tidak muncul.',
        `Garuda: hanya ${maks} halaman pertama per kueri (urutan relevansi Garuda), bukan seluruh dokumen; total_dokumen_garuda memuat jumlah penuh per kueri. Pencarian judul bahasa Indonesia saja; satu kueri per topik.`,
        'SINTA 403 untuk bot (robots maupun halaman): profil pakar/skor SINTA tidak diambil. Proceeding nasional tidak punya sumber terbuka tersendiri: yang masuk Garuda ikut terhitung.',
        'Nama penulis Garuda tanpa gelar dan sering disingkat: kecocokan ke orang.json konservatif (nama persis), banyak pakar tidak tertaut.',
      ],
    },
  });
  console.log('riset_ebt:', jurnal.length, 'artikel,', prov.baris.length, 'provinsi');
}
if (process.argv[1] === new URL(import.meta.url).pathname) utama().catch(e => { console.error(e.message); process.exit(1); });
