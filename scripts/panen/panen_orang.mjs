#!/usr/bin/env node
// Panen direktori profesional & pejabat EBET untuk Jaringan METI. Node stdlib saja.
//   node panen_orang.mjs --selftest            uji penyaring privasi, tanpa jaringan
//   node panen_orang.mjs --ambil=URL[,URL]     unduh ke raw/ (robots dicek, jeda >= 2 dtk, resumable) lalu cetak teks
//   node panen_orang.mjs --teks=URL            cetak teks dari raw/ tanpa jaringan
//   node panen_orang.mjs --bangun              bangun orang.jsonl + jabatan.jsonl dari berkas/ + lokal + PDF DPR
//   node panen_orang.mjs --statistik           angka untuk laporan
// Etika: UA jujur, 1 permintaan serentak, jeda >= 2 dtk, 403/429 = berhenti total. Tanpa LinkedIn.
// Privasi (UU PDP 27/2022, C-04, C-11, D14): hanya nama, gelar, jabatan, organisasi, periode, status, jenis,
// sektor, sumber. Surel/telepon/tanggal lahir/NIK/alamat/foto/akun pribadi DITOLAK oleh saring().
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const UA = 'METI-Network-research/0.1 (+timitbnpb@gmail.com)';
const GAP_MS = 2200;
const HOME = process.env.HOME;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = path.join(ROOT, 'data-panen/orang');
const RAW = path.join(OUT, 'raw');
const SEED = path.join(OUT, 'seed'); // berkas JSONL hasil kurasi baca halaman resmi (satu baris = satu jabatan)
const LOKAL = path.join(ROOT, 'data-panen/lokal/entitas.jsonl');
const PDF_TXT = path.join(OUT, 'raw/guidebook-komisi-xii.txt');
const HARI_INI = new Date().toISOString().slice(0, 10);

// ---------- penyaring privasi ----------
const POLA_TERLARANG = [
  ['surel', /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i],
  ['telepon', /(?:\+62|\b62|\b0)\s?\d{2,4}[\s-]?\d{3,4}[\s-]?\d{3,5}\b/],
  ['nik', /\b\d{16}\b/],
  ['tanggal-lahir', /\b(lahir|lahir di|tgl\.? lahir|tempat lahir|born|dob)\b|\b\d{1,2}[-/]\d{1,2}[-/](19|20)\d{2}\b/i],
  ['akun-sosial', /(instagram|facebook|twitter|tiktok|linkedin)\.com\/|(?:^|\s)@[a-z0-9_]{3,}\b/i],
  ['alamat', /\b(jl\.|jalan)\s+\w+.*\bno\.?\s*\d+/i],
  ['agama-kesehatan', /\b(agama|beragama|sakit|penyakit|riwayat kesehatan)\b/i],
];
const KUNCI_BOLEH = new Set(['nama', 'gelar', 'jabatan', 'organisasi', 'mulai', 'selesai', 'periode_mulai', 'periode_selesai',
  'status', 'jenis', 'sektor', 'sumber_url', 'tanggal_sumber', 'tanggal_ambil', 'orang_id', 'fraksi', 'catatan']);
export function saring(rec) {
  for (const k of Object.keys(rec)) if (!KUNCI_BOLEH.has(k)) return { ok: false, alasan: `kolom-terlarang:${k}` };
  for (const [k, v] of Object.entries(rec)) {
    if (v == null || k === 'sumber_url') continue;
    for (const [nama, re] of POLA_TERLARANG) if (re.test(String(v))) return { ok: false, alasan: `${nama}:${k}` };
  }
  return { ok: true };
}

// ---------- normalisasi nama ----------
const GELAR = /\b(prof|dr|drs|dra|ir|h|hj|kh|dipl|ing|se|sh|st|mt|mm|mba|msc|ma|map|mh|mkn|sip|ssi|ssos|spd|sag|sk|sm|mpd|phd|llm|ak|ca|cfa|mbus|meng|mp|msi|mtp|msi|ssn|stp|sstp|mse|ssi|mcom|cpa|bsc|bba|mpa|mem|s1|s2|s3|\.)\b/gi;
export function kunciNama(nama) {
  return nama.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/,.*$/, '') // gelar belakang setelah koma
    .replace(/\./g, ' ').replace(GELAR, ' ').replace(/[^a-z\s]/g, ' ').replace(/\s+/g, ' ').trim();
}
export function pisahGelar(raw) {
  const t = raw.replace(/\s+/g, ' ').trim();
  const [nama, ...sisa] = t.split(',');
  const dep = (nama.match(/^((?:(?:Prof|Dr|Drs|Dra|Ir|H|Hj|KH|Ing)\.?\s+)+)/i) || [])[1] || '';
  const bersih = nama.slice(dep.length).trim();
  const gelar = (dep.trim() + (sisa.length ? ', ' + sisa.join(',').trim() : '')).replace(/^,\s*/, '').trim();
  return { nama: bersih, gelar: gelar || undefined };
}
const idOrang = (kunci, org) => 'o_' + crypto.createHash('sha1').update(kunci).digest('hex').slice(0, 10);

// ---------- jaringan ----------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let terakhir = 0;
const robotsCache = new Map();
const slug = (u) => u.replace(/^https?:\/\//, '').replace(/[^a-z0-9]+/gi, '_').slice(0, 120);
async function robotsOk(u) {
  const { origin, pathname } = new URL(u);
  if (!robotsCache.has(origin)) {
    let aturan = [];
    try {
      const r = await tunggu(origin + '/robots.txt');
      if (r.status === 200) {
        let ua = false;
        for (const baris of (await r.text()).split(/\r?\n/)) {
          const m = baris.match(/^\s*([a-z-]+)\s*:\s*(.*?)\s*(#.*)?$/i);
          if (!m) continue;
          const k = m[1].toLowerCase();
          if (k === 'user-agent') ua = m[2] === '*';
          else if (ua && k === 'disallow' && m[2]) aturan.push(m[2]);
        }
      }
    } catch {}
    robotsCache.set(origin, aturan);
  }
  return !robotsCache.get(origin).some((p) => pathname.startsWith(p.replace(/\*.*$/, '')));
}
async function tunggu(u) {
  const d = Date.now() - terakhir;
  if (d < GAP_MS) await sleep(GAP_MS - d);
  terakhir = Date.now();
  return fetch(u, { headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml,*/*' }, redirect: 'follow', signal: AbortSignal.timeout(30000) });
}
async function ambil(u) {
  fs.mkdirSync(RAW, { recursive: true });
  const f = path.join(RAW, slug(u) + '.html');
  if (fs.existsSync(f)) return f;
  if (/linkedin\.com/i.test(u)) throw new Error('LinkedIn dilarang');
  if (!(await robotsOk(u))) { console.error('ROBOTS-TOLAK', u); return null; }
  const r = await tunggu(u);
  if (r.status === 403 || r.status === 429) { console.error('BERHENTI', r.status, u); process.exit(3); }
  if (r.status !== 200) { console.error('HTTP', r.status, u); return null; }
  fs.writeFileSync(f, Buffer.from(await r.arrayBuffer()));
  return f;
}
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
const dec = (s) => s.replace(/&#x([0-9a-f]+);|&#(\d+);|&(\w+);/gi, (m, h, d, n) => h ? String.fromCodePoint(parseInt(h, 16)) : d ? String.fromCodePoint(+d) : (ENT[n] ?? m));
export const teks = (h) => dec(h.replace(/<(script|style|noscript)[\s\S]*?<\/\1>/gi, ' ').replace(/<\/(p|div|li|tr|h\d|br|section|article|td)>|<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ' '))
  .replace(/[ \t\f\r]+/g, ' ').replace(/\n\s*/g, '\n').trim();

// ---------- berkas keluaran ----------
const baca = (f) => fs.existsSync(f) ? fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : [];
const tulis = (f, rows) => fs.writeFileSync(f, rows.map((r) => JSON.stringify(r)).join('\n') + (rows.length ? '\n' : ''));

// ---------- sumber: guidebook DPR (nama + jabatan + fraksi saja) ----------
export function urai_dpr(t) {
  const baris = t.split('\n');
  const hasil = []; let fraksi = null; let pimpinan = true;
  const jab = (kol, i) => 'Anggota Komisi XII DPR RI';
  for (let i = 0; i < baris.length; i++) {
    const b = baris[i];
    const pf = b.match(/^\s*Partai\s+(.+?)\s*$/);
    if (pf && /ANGGOTA KOMISI XII/.test(baris[i - 1] || '')) { fraksi = pf[1]; pimpinan = false; continue; }
    if (!/Dapil/.test(b)) continue;
    // baris nama = baris tak-kosong di atas "Dapil"; kolom dipisah >=3 spasi; jabatan pimpinan di baris atasnya
    let j = i - 1; while (j >= 0 && !baris[j].trim()) j--;
    const kolNama = baris[j].trim().split(/\s{3,}/).filter(Boolean);
    const kolDapil = b.trim().split(/\s{3,}/).filter(Boolean);
    let rolAtas = []; let k = j - 1; while (k >= 0 && !baris[k].trim()) k--;
    if (pimpinan) rolAtas = baris[k].trim().split(/\s{3,}/).filter(Boolean);
    kolNama.forEach((n, idx) => {
      if (/^(Kapoksi|\{Kapoksi\}|Ketua|Wakil Ketua)$/i.test(n) || n.length < 4) return;
      hasil.push({ nama_mentah: n, fraksi, pimpinan, kolDapil: kolDapil[idx] || '', rolAtas });
    });
  }
  return hasil;
}

// ---------- selftest ----------
function selftest() {
  const buruk = [
    { nama: 'A B', jabatan: 'Direktur', organisasi: 'X', surel: 'a@b.co' },
    { nama: 'A B', jabatan: 'Direktur surel a.b@pln.co.id', organisasi: 'X' },
    { nama: 'A B', jabatan: 'Direktur', organisasi: 'X', catatan: 'tel 0812-3456-7890' },
    { nama: 'A B', jabatan: 'Direktur', organisasi: 'X', catatan: '+62 21 5551234' },
    { nama: 'A B', jabatan: 'Direktur', organisasi: 'X', catatan: 'lahir di Solo' },
    { nama: 'A B', jabatan: 'Direktur', organisasi: 'X', catatan: '17-08-1965' },
    { nama: 'A B', jabatan: 'Direktur', organisasi: 'X', catatan: 'NIK 3174010101010001' },
    { nama: 'A B', jabatan: 'Direktur', organisasi: 'X', catatan: 'instagram.com/abc' },
    { nama: 'A B', jabatan: 'Direktur', organisasi: 'X', foto: 'x.jpg' },
    { nama: 'A B', jabatan: 'Direktur', organisasi: 'X', catatan: 'tinggal di Jl. Mawar No. 5' },
  ];
  for (const r of buruk) assert.equal(saring(r).ok, false, JSON.stringify(r));
  const baik = { nama: 'A B', jabatan: 'Direktur Utama', organisasi: 'PT X', status: 'menjabat', jenis: 'direksi', sumber_url: 'https://x.co/a@b' };
  assert.equal(saring(baik).ok, true);
  assert.equal(kunciNama('Dr. Ir. Eniya Listiani Dewi, S.T., M.T.'), 'eniya listiani dewi');
  assert.equal(kunciNama('H. Bambang Haryadi, SE'), 'bambang haryadi');
  assert.deepEqual(pisahGelar('Dr. Ir. Eniya Listiani Dewi, S.T., M.T.').nama, 'Eniya Listiani Dewi');
  const d = urai_dpr('ANGGOTA KOMISI XII\nPartai Demokrat\n\n  Budi Santoso, S.H.    Ani Yulia\n  Dapil Jateng I    Dapil Jabar II\n');
  assert.equal(d.length, 2); assert.equal(d[0].fraksi, 'Demokrat');
  console.log('selftest OK: 10 pola ditolak, 1 rekaman sah lolos, normalisasi nama, parser DPR');
}

// ---------- bangun ----------
const JENIS_OK = new Set(['pejabat-publik', 'direksi', 'komisaris', 'anggota-dpr', 'akademisi', 'asosiasi', 'lsm']);
const STATUS_OK = new Set(['menjabat', 'mantan', 'tidak-diketahui']);
function bangun() {
  const tolak = [];
  const orang = new Map(); const jabatan = []; const konflik = [];
  const seen = new Set();
  const masuk = (r, sumberBerkas) => {
    const { nama, gelar } = r.gelar ? { nama: r.nama, gelar: r.gelar } : pisahGelar(r.nama);
    const rec = { nama, gelar, jabatan: r.jabatan, organisasi: r.organisasi, periode_mulai: r.mulai ?? r.periode_mulai ?? null,
      periode_selesai: r.selesai ?? r.periode_selesai ?? null, status: r.status || 'tidak-diketahui', jenis: r.jenis, sektor: r.sektor,
      sumber_url: r.sumber_url, tanggal_sumber: r.tanggal_sumber || null, tanggal_ambil: r.tanggal_ambil || HARI_INI };
    if (r.fraksi) rec.fraksi = r.fraksi;
    for (const k of Object.keys(rec)) if (rec[k] === undefined) delete rec[k];
    if (r.tolak) { tolak.push({ nama, alasan: r.tolak, sumber_url: r.sumber_url, tanggal_ambil: HARI_INI }); return; }
    const s = saring(rec);
    if (!s.ok) { tolak.push({ nama, alasan: 'privasi:' + s.alasan, sumber_url: r.sumber_url, tanggal_ambil: HARI_INI }); return; }
    if (!JENIS_OK.has(rec.jenis) || !STATUS_OK.has(rec.status) || !rec.jabatan || !rec.organisasi || !rec.sumber_url) {
      tolak.push({ nama, alasan: `skema:${sumberBerkas}`, sumber_url: r.sumber_url, tanggal_ambil: HARI_INI }); return;
    }
    const kn = kunciNama(nama);
    if (kn.split(' ').length < 2 && !r.boleh_satu_kata) { tolak.push({ nama, alasan: 'nama-satu-kata-ambigu', sumber_url: r.sumber_url, tanggal_ambil: HARI_INI }); return; }
    const dupe = [kn, rec.organisasi, rec.jabatan, rec.periode_mulai].join('|');
    if (seen.has(dupe)) return; seen.add(dupe);
    const id = idOrang(kn);
    const o = orang.get(id);
    if (!o) orang.set(id, { orang_id: id, nama, gelar: rec.gelar, jenis: rec.jenis, sektor: rec.sektor, status: rec.status,
      jabatan_terkini: rec.jabatan, organisasi_terkini: rec.organisasi, sumber_url: rec.sumber_url, tanggal_sumber: rec.tanggal_sumber, tanggal_ambil: rec.tanggal_ambil });
    else {
      if (!o.gelar && rec.gelar) o.gelar = rec.gelar;
      if (rec.status === 'menjabat' && o.status !== 'menjabat') { o.status = 'menjabat'; o.jabatan_terkini = rec.jabatan; o.organisasi_terkini = rec.organisasi; }
      if (o.nama !== nama && kunciNama(o.nama) === kn) { /* variasi penulisan, sama */ }
    }
    jabatan.push({ orang_id: id, jabatan: rec.jabatan, organisasi: rec.organisasi, mulai: rec.periode_mulai, selesai: rec.periode_selesai,
      status: rec.status, jenis: rec.jenis, fraksi: rec.fraksi, sumber_url: rec.sumber_url, tanggal_sumber: rec.tanggal_sumber, tanggal_ambil: rec.tanggal_ambil });
  };

  // 1) seed hasil baca halaman resmi
  if (fs.existsSync(SEED)) for (const f of fs.readdirSync(SEED).filter((x) => x.endsWith('.jsonl')).sort()) for (const r of baca(path.join(SEED, f))) masuk(r, f);

  // 2) guidebook DPR
  if (fs.existsSync(PDF_TXT)) {
    const sumber = 'lokal:guidebook-komisi-xii-dpr-2024-2029-update-2025-11-10';
    const isi = fs.readFileSync(PDF_TXT, 'utf8');
    const urutPimp = [];
    for (const m of urai_dpr(isi)) {
      let jb = 'Anggota Komisi XII DPR RI';
      if (m.pimpinan) {
        const kolom = m.rolAtas;
        jb = 'Pimpinan Komisi XII DPR RI';
        if (kolom.length) { const idx = urai_dpr(isi).filter((x) => x.pimpinan).indexOf(m); }
      }
      masuk({ nama: m.nama_mentah, jabatan: jb, organisasi: 'DPR RI Komisi XII', mulai: '2024-10', selesai: null, status: 'menjabat',
        jenis: 'anggota-dpr', sektor: 'energi', fraksi: m.fraksi || undefined, sumber_url: sumber, tanggal_sumber: '2025-11-10' }, 'dpr');
    }
  }

  // 3) entitas.jsonl lokal: orang tanpa jabatan di berkas itu, tidak dimasukkan (hanya nama). Dicatat untuk laporan.
  const tanpaJabatan = baca(LOKAL).filter((e) => e.jenis === 'orang').length;

  const rows = [...orang.values()];
  fs.mkdirSync(OUT, { recursive: true });
  const lama = baca(path.join(OUT, 'daftar-tolak-calon.jsonl')).filter((x) => x.manual); // butir tolak manual dipertahankan
  tulis(path.join(OUT, 'orang.jsonl'), rows);
  tulis(path.join(OUT, 'jabatan.jsonl'), jabatan);
  tulis(path.join(OUT, 'daftar-tolak-calon.jsonl'), [...lama, ...tolak]);
  console.log(JSON.stringify({ orang: rows.length, jabatan: jabatan.length, tolak: tolak.length + lama.length, entitas_orang_tanpa_jabatan: tanpaJabatan }));
}

// ---------- main ----------
const arg = (n) => (process.argv.find((a) => a.startsWith(`--${n}=`)) || '').split('=').slice(1).join('=');
if (process.argv.includes('--selftest')) selftest();
else if (process.argv.includes('--bangun')) bangun();
else if (arg('ambil')) {
  for (const u of arg('ambil').split(',')) {
    let f = null;
    try { f = await ambil(u); } catch (e) { console.error('GAGAL', u, e.cause?.code || e.message); }
    if (f) { const t = teks(fs.readFileSync(f, 'utf8')); console.log(`### ${u} (${t.length} huruf)\n` + t.slice(0, +arg('maks') || 6000)); }
  }
} else if (process.argv.includes('--dpr')) {
  for (const m of urai_dpr(fs.readFileSync(PDF_TXT, 'utf8'))) console.log([m.fraksi, m.pimpinan ? 'PIMP' : '', m.nama_mentah, '|', m.kolDapil, '|', m.rolAtas.join(' / ')].join(' ; '));
} else if (arg('tautan')) { // --tautan=URL[ --cari=regex]: daftar href dari raw/
  const f = path.join(RAW, slug(arg('tautan')) + '.html'); const re = new RegExp(arg('cari') || '.', 'i');
  const h = fs.readFileSync(f, 'utf8'); const b = new URL(arg('tautan'));
  for (const m of h.matchAll(/<a\s[^>]*href="([^"#]+)"[^>]*>([\s\S]*?)<\/a>/gi)) { const t = teks(m[2]).replace(/\n/g, ' '); const u = new URL(m[1], b).href; if (re.test(t + ' ' + u)) console.log(t.slice(0, 60), '|', u); }
} else if (arg('teks')) {
  const f = path.join(RAW, slug(arg('teks')) + '.html');
  const t = teks(fs.readFileSync(f, 'utf8')); const o = +arg('mulai') || 0;
  console.log(t.slice(o, o + (+arg('maks') || 6000)));
} else console.log('lihat komentar di kepala berkas');
