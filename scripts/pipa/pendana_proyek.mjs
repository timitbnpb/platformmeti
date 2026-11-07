// Pendana multilateral -> proyek.json. Sumber: Bank Dunia (data-panen/proyek/tambahan_worldbank.jsonl, API CC BY 4.0, sudah dipanen
// panen_lanjutan.mjs --wb) dan daftar proyek publik AIIB (aiib.org/en/projects/list/.content/all-projects-data.js, robots mengizinkan).
// ADB: adb.org/projects dijawab 403 untuk bot, jadi berhenti (tidak dilewati).
//   node scripts/pipa/pendana_proyek.mjs aiib            ambil daftar AIIB -> data/pendanaan/aiib_indonesia.json
//   node scripts/pipa/pendana_proyek.mjs bangun <tgl>    cocokkan WB + AIIB ke proyek.json -> data/pendanaan/tautan_proyek.json
//   node scripts/pipa/pendana_proyek.mjs --selftest
// Cocok = semua kata khas nama proyek kita ada di judul (WB: judul + tujuan) DAN satu kata langka (muncul di <= 3 proyek), teknologi sejalan,
// dan tepat satu kandidat. Ambigu atau nol = `tanpa_padanan`, tidak ditebak.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { token, norm } from './cocok_proyek.mjs';
import { ambil } from './_panen_sopan.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const baca = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf-8'));
export const AIIB_URL = 'https://www.aiib.org/en/projects/list/.content/all-projects-data.js';
const TERJEMAH = [[/floating/gi, 'terapung'], [/pumped storage/gi, 'pumped storage']];
const TEK = [['panas-bumi', /geotherm|panas bumi/i], ['surya', /solar|surya|photovolt/i], ['hidro', /hydro|hidro/i], ['bayu', /\bwind\b|bayu/i], ['penyimpanan', /pumped|storage|battery/i]];

export const parseAiib = (js) => [...String(js).matchAll(/^\s*(\{"date".*\}),?\s*$/gm)].map((m) => JSON.parse(m[1]));
export const usdDari = (s) => { const m = /USD\s*([\d.,]+)\s*(million|billion)?/i.exec(s || ''); if (!m) return null; const n = parseFloat(m[1].replace(/,/g, '')); return Math.round(n * (/billion/i.test(m[2]) ? 1e9 : /million/i.test(m[2]) ? 1e6 : 1)); };

export function cocokkan(teks, daftar, df) {
  let t = teks; for (const [re, ganti] of TERJEMAH) t = t.replace(re, ganti);
  const w = norm(t).split(' '), kata = new Set(w), rapat = w.join(''); // 'gajahmungkur' memuat 'gajah' + 'mungkur'
  const ada = (x) => kata.has(x) || (x.length >= 5 && rapat.includes(x));
  const tekTeks = TEK.filter(([, re]) => re.test(teks)).map(([k]) => k);
  return daftar.filter((p) => {
    const tk = [...token(p.nama)]; if (!tk.length || !tk.every(ada)) return false;
    if (!tk.some((x) => (df.get(x) || 0) <= 3 && x.length >= 5)) return false;
    return !tekTeks.length || !p.teknologi || tekTeks.includes(p.teknologi) || (p.teknologi === 'penyimpanan' && tekTeks.includes('hidro'));
  });
}

export function bangun(tgl, { proyek = baca('public/data/proyek.json').baris, wb = [], aiib = [] } = {}) {
  const daftar = proyek.filter((p) => !/^wb_/.test(p.id)), df = new Map();
  for (const p of daftar) for (const t of token(p.nama)) df.set(t, (df.get(t) || 0) + 1);
  const tautan = {}, tanpa = [];
  const proses = (id, nama, teks, pemberi, url) => {
    const c = cocokkan(teks, daftar, df);
    if (c.length === 1) tautan[id] = { proyek_id: c[0].id, pemberi, nama_pendana: nama, nama_proyek: c[0].nama, bukti: 'semua kata khas nama proyek ada di judul proyek pendana' + (c[0].lokasi?.provinsi ? '; provinsi ' + c[0].lokasi.provinsi : ''), sumber_url: url };
    else tanpa.push({ id, nama, pemberi, sumber_url: url, alasan: c.length ? 'ambigu: ' + c.map((x) => x.id).join(', ') : 'tidak ada proyek bernama sama di proyek.json' });
  };
  for (const w of wb) proses(w.id, w.nama, w.nama + ' ' + (w.tujuan || ''), 'World Bank', w.sumber_url);
  for (const a of aiib) proses(a.id, a.nama, a.nama, 'AIIB', a.sumber_url);
  return { meta: { diperbarui: tgl, wb_dicek: wb.length, aiib_dicek: aiib.length, tertaut: Object.keys(tautan).length, tanpa_padanan: tanpa.length, adb: 'dilewati: adb.org/projects menjawab 403 untuk bot', keterangan: 'Tautan pendana ke proyek.json berdasar kecocokan nama pasti; bukan pernyataan resmi pembiayaan.' }, tautan, tanpa_padanan: tanpa };
}

const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70);
function selftest() {
  assert.equal(usdDari('USD21 million'), 21e6); assert.equal(usdDari('USD1.5 billion'), 1.5e9); assert.equal(usdDari(''), null);
  assert.equal(parseAiib('var data=[\n\t{"date":"2025","name":"x"},\n\t\n];').length, 1);
  const proyek = [{ id: 'pj_1', nama: 'PLTS Terapung Gajah Mungkur', teknologi: 'surya' }, { id: 'pj_2', nama: 'PLTA Gajah Mungkur', teknologi: 'hidro' }, { id: 'pj_3', nama: 'PLTS Pasuruan', teknologi: 'surya' }];
  const h = bangun('2026-01-01', { proyek, aiib: [{ id: 'a1', nama: 'Gajahmungkur Floating Solar', sumber_url: 'u' }, { id: 'a2', nama: 'Gajah Mungkur Floating Solar PV', sumber_url: 'u' }, { id: 'a3', nama: 'Pasuruan 100 MW Solar PV', sumber_url: 'u' }, { id: 'a4', nama: 'Road', sumber_url: 'u' }] });
  assert.equal(h.tautan.a1.proyek_id, 'pj_1'); assert.equal(h.tautan.a2.proyek_id, 'pj_1'); assert.equal(h.tautan.a3.proyek_id, 'pj_3'); assert.ok(!h.tautan.a4);
  console.log('selftest pendana_proyek ok');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [, , cmd, tgl] = process.argv;
  const fa = path.join(ROOT, 'data/pendanaan/aiib_indonesia.json');
  if (cmd === '--selftest') selftest();
  else if (cmd === 'aiib') {
    const baris = parseAiib(await ambil(AIIB_URL)); if (baris.length < 100) throw new Error('daftar AIIB terlalu pendek: ' + baris.length);
    const hari = process.argv[3]; if (!/^\d{4}-\d\d-\d\d$/.test(hari || '')) { console.error('pakai: aiib <YYYY-MM-DD>'); process.exit(1); }
    const id = baris.filter((b) => b.economy === 'Indonesia');
    const out = { sumber: 'AIIB, daftar proyek publik', sumber_url: 'https://www.aiib.org/en/projects/list/index.html', diambil: hari, jumlah_dunia: baris.length, jumlah_indonesia: id.length,
      baris: id.filter((b) => b.sector === 'Energy').map((b) => ({ id: 'aiib_' + slug(b.name.replace(/^Indonesia\s*:\s*/, '')), nama: b.name.replace(/^Indonesia\s*:\s*/, '').trim(), sektor: b.sector, status: b.status === 'Approved' ? 'disetujui' : 'diusulkan', tahun: /^\d{4}$/.test(b.date) ? +b.date : undefined, nilai_usd: usdDari(b.approved_funding || b.proposed_funding), nilai_asli: (b.approved_funding || b.proposed_funding || '').trim(), sumber_url: 'https://www.aiib.org' + b.path, tanggal_periksa: hari, tingkat_bukti: 'resmi' })) };
    fs.writeFileSync(fa, JSON.stringify(out, null, 1) + '\n', 'utf-8'); console.log('AIIB dunia', baris.length, 'Indonesia', id.length, 'energi', out.baris.length);
  } else if (cmd === 'bangun') {
    if (!/^\d{4}-\d\d-\d\d$/.test(tgl || '')) { console.error('pakai: bangun <YYYY-MM-DD>'); process.exit(1); }
    const fw = path.join(ROOT, 'data-panen/proyek/tambahan_worldbank.jsonl');
    const wb = fs.existsSync(fw) ? fs.readFileSync(fw, 'utf-8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : [];
    const h = bangun(tgl, { wb, aiib: fs.existsSync(fa) ? JSON.parse(fs.readFileSync(fa, 'utf-8')).baris : [] });
    fs.writeFileSync(path.join(ROOT, 'data/pendanaan/tautan_proyek.json'), JSON.stringify(h, null, 1) + '\n', 'utf-8'); console.log(JSON.stringify(h.meta));
  } else { console.error('pakai: aiib <tgl> | bangun <tgl> | --selftest'); process.exit(1); }
}
