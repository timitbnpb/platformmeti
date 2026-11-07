// Riset energi terbarukan per kampus Indonesia dari OpenAlex (terbuka, tanpa kunci; hemat: hanya group_by, ~60 permintaan).
// Pakai: node scripts/pipa/riset_kampus.mjs [--tanggal=...] [--maks-kampus=25]   Cache mentah di raw/openalex/ (tidak di-commit); jalan ulang memakai cache.
// Tanpa parameter mailto: tidak ada alamat generik METI yang ditetapkan; UA memuat URL platform.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { AKAR, TANGGAL, UA, ambilJson, tulis, bacaRef, norma } from './_panen_umum.mjs';

const BASE = 'https://api.openalex.org';
const TAHUN = '2019-2026';
const q = (...f) => '(' + f.map(x => `"${x}"`).join(' OR ') + ')';
export const TOPIK = {
  surya: q('solar energy', 'photovoltaic', 'solar cell', 'solar power'),
  angin: q('wind energy', 'wind turbine', 'wind power'),
  panas_bumi: q('geothermal'),
  bioenergi: q('bioenergy', 'biofuel', 'biodiesel', 'bioethanol', 'biogas', 'biomass energy'),
  hidro: q('hydropower', 'micro hydro', 'hydroelectric'),
  hidrogen: q('hydrogen production', 'green hydrogen', 'hydrogen energy', 'fuel cell'),
  baterai: q('lithium-ion battery', 'energy storage', 'battery energy storage'),
  kebijakan: q('energy policy', 'energy transition', 'renewable energy policy'),
};
const SEMUA = '(' + Object.values(TOPIK).map(s => s.slice(1, -1)).join(' OR ') + ')';
const CACHE = path.join(AKAR, 'raw/openalex');
const idPendek = s => String(s || '').replace('https://openalex.org/', '');
const orcidPendek = s => String(s || '').replace('https://orcid.org/', '') || null;

async function tarik(url) {
  const f = path.join(CACHE, crypto.createHash('sha1').update(url).digest('hex') + '.json');
  if (fs.existsSync(f)) return JSON.parse(fs.readFileSync(f, 'utf-8'));
  const j = await ambilJson(url);
  fs.mkdirSync(CACHE, { recursive: true });
  fs.writeFileSync(f, JSON.stringify(j));
  return j;
}
const kelompok = async (filter, groupBy) =>
  Object.fromEntries((await tarik(`${BASE}/works?filter=${encodeURI(filter)}&group_by=${groupBy}&per_page=200`)).group_by.map(g => [idPendek(g.key), g.count]));

// nama OpenAlex (Inggris) -> nama Indonesia pada organisasi.json
const ALIAS = { 'Bandung Institute of Technology': 'Institut Teknologi Bandung', 'University of Indonesia': 'Universitas Indonesia', 'Diponegoro University': 'Universitas Diponegoro', 'IPB University': 'Institut Pertanian Bogor', 'Pertamina University': 'Universitas Pertamina', 'Del Institute of Technology': 'Institut Teknologi Del' };
export function cocokkan(namaKampus, organisasi) {
  const n = norma(ALIAS[namaKampus] || namaKampus);
  return organisasi.filter(o => o.kategori?.kode === 'perguruan-tinggi' && norma(o.nama).includes(n)).map(o => o.id).sort();
}
export function cocokOrang(nama, orang) {
  const bersih = s => norma(String(s).split(',')[0].replace(/\b(prof|dr|ir|dra|drs|ing|st|mt|mst|msc|phd|sh|se|ssi|mp|meng|mengsc)\b\.?/gi, ''));
  const k = bersih(nama);
  return k.length < 6 ? [] : orang.filter(o => bersih(o.nama) === k).map(o => o.id).sort();
}

async function penulisTeratas(id, orang) {
    const grup = await kelompok(`authorships.institutions.id:${id},publication_year:${TAHUN},title_and_abstract.search:${SEMUA}`, 'authorships.author.id');
    const calon = Object.entries(grup).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 40);
    const detail = (await tarik(`${BASE}/authors?filter=openalex:${calon.map(c => c[0]).join('|')}&per_page=40&select=id,display_name,orcid,last_known_institutions,affiliations`)).results;
    const info = new Map(detail.map(a => [idPendek(a.id), a]));
    return calon.filter(([a]) => {
      const x = info.get(a); if (!x) return false;
      return (x.last_known_institutions || []).some(l => idPendek(l.id) === id) || (x.affiliations || []).some(l => idPendek(l.institution?.id) === id);
    }).slice(0, 10).map(([a, n]) => {
      const x = info.get(a);
      return { nama: x.display_name, orcid: orcidPendek(x.orcid), openalex: a, karya_energi_2019_sekarang: n, usulan_orang_id: cocokOrang(x.display_name, orang) };
    });
}

async function utama() {
  const maks = Number((process.argv.find(a => a.startsWith('--maks-kampus=')) || '=25').split('=')[1]);
  const organisasi = bacaRef('public/data/organisasi.json').baris;
  const orang = bacaRef('public/data/orang.json').baris;
  const dasar = `authorships.institutions.country_code:ID,publication_year:${TAHUN},title_and_abstract.search:`;
  const inst = (await tarik(`${BASE}/institutions?filter=country_code:ID,type:education&sort=works_count:desc&per_page=100&select=id,display_name,ror,works_count,geo`)).results;
  const kampus = new Map(inst.map(i => [idPendek(i.id), i]));
  const total = await kelompok(dasar + SEMUA, 'authorships.institutions.id');
  const perTopik = {};
  for (const [t, s] of Object.entries(TOPIK)) perTopik[t] = await kelompok(dasar + s, 'authorships.institutions.id');
  const urut = [...kampus.keys()].filter(k => total[k]).sort((a, b) => total[b] - total[a] || a.localeCompare(b)).slice(0, maks);

  const baris = [];
  let habis = false; // anggaran gratis OpenAlex habis (429): sisa kampus dicatat tanpa penulis
  for (const id of urut) {
    const i = kampus.get(id);
    let penulis = null;
    if (!habis) try { penulis = await penulisTeratas(id, orang); } catch (e) { if (!/^429/.test(e.message)) throw e; habis = true; }
    baris.push({
      openalex_id: id, nama: i.display_name, ror: i.ror || null, kota: i.geo?.city || null, organisasi_id: cocokkan(i.display_name, organisasi),
      karya_energi_2019_sekarang: total[id], per_topik: Object.fromEntries(Object.keys(TOPIK).map(t => [t, perTopik[t][id] || 0])), penulis_teratas: penulis,
      sumber_url: `https://openalex.org/${id}`, tanggal_periksa: TANGGAL, tingkat_bukti: 'via-pihak-ketiga',
    });
  }
  tulis(path.join(AKAR, 'public/data/riset_kampus.json'), {
    jenis: 'riset_kampus', sumber: 'OpenAlex (api.openalex.org)', url: 'https://openalex.org', tanggal_ambil: TANGGAL, tingkat_bukti: 'via-pihak-ketiga', lisensi: 'CC0 (OpenAlex)',
    periode: TAHUN, topik_kueri: TOPIK, jumlah_kampus: baris.length, baris,
    meta: {
      catatan: 'karya = karya berjudul/abstrak cocok kueri topik dengan >= 1 afiliasi institusi (karya bersama dihitung ke tiap institusi; topik saling tumpang tindih, jangan dijumlahkan). Pencarian kata kunci judul/abstrak berbahasa Inggris. usulan_orang_id = kecocokan NAMA persis ke orang.json: usulan untuk kurator, bukan penggabungan. Penulis = afiliasi X di OpenAlex dan ikut karya energi berafiliasi X; jumlah karya penulis = karya energi (2019+) yang memuat X.',
      celah: [
        ...(habis ? [`Anggaran gratis OpenAlex habis (HTTP 429): ${baris.filter(b => b.penulis_teratas === null).length} kampus tanpa daftar penulis (null). Jalankan ulang setelah reset harian; cache dipakai ulang.`] : []),
        `Hanya ${baris.length} kampus teratas menurut karya energi; kampus lain dan lembaga riset non-pendidikan (BRIN, LIPI) tidak diambil.`,
        'Tanpa kunci API dan tanpa parameter mailto (tidak ada alamat generik METI ditetapkan); anggaran gratis harian bersama.',
        'Kueri kata kunci bahasa Inggris saja; karya berbahasa Indonesia terlewat. Tidak memakai klasifikasi topik OpenAlex.',
        'organisasi_id memetakan kampus ke unit pusat studi di organisasi.json berdasarkan nama kampus pada nama unit; kosong bila tidak ada.',
      ],
    },
  });
  console.log('riset_kampus:', baris.length, 'kampus');
}

if (process.argv[1] === new URL(import.meta.url).pathname) utama().catch(e => { console.error(e.message); process.exit(1); });
