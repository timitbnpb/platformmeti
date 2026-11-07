#!/usr/bin/env node
// Panen direktori perusahaan EBET Indonesia + pengurusnya (direksi/komisaris) untuk Jaringan METI. Node stdlib saja.
//   node panen_perusahaan.mjs --selftest        uji parser, tanpa jaringan
//   node panen_perusahaan.mjs --jalan[=1,2,..]  per batch: bangun rekaman, baca situs resmi, urai pengurus, unduh foto resmi; simpan tiap batch
//   node panen_perusahaan.mjs --statistik       angka laporan
// Etika: UA jujur, jeda >= 2 dtk, robots.txt dicek, tanpa login/CAPTCHA/LinkedIn/media sosial/pencarian gambar.
// 403/429 = host itu dihentikan untuk sisa jalan (bukan memaksa); dicatat di gagal.jsonl.
// Foto HANYA dari halaman resmi perusahaan (host sama dengan situs). Tanpa foto resmi = kosong, tidak dicari di tempat lain.
// Pengurus hasil heuristik teks halaman (ekstraksi:'heuristik'); wajib ditinjau kurator sebelum tampil publik.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { BENIH, TABEL_MODUL, SUMBER_BENIH } from './perusahaan_seed.mjs';

const UA = 'METI-Network-research/0.1 (+https://platformmeti.timitbnpb.workers.dev)';
const GAP_MS = 2200;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = path.join(ROOT, 'data-panen/perusahaan');
const RAW = path.join(OUT, 'raw');
const FOTO = path.join(OUT, 'foto');
const ORANG = path.join(ROOT, 'data-panen/orang/orang.jsonl');
const HARI_INI = new Date().toISOString().slice(0, 10);
const HAK_CIPTA = 'milik perusahaan, tampil dengan atribusi';
const SUMBER_TABEL = { id: 'tabel-modul', jenis: 'dokumen-pemerintah', judul: 'DJEBTKE ESDM, Daftar Pabrikan Modul Surya di Indonesia, hlm 12', diterima: 'pemilik, 2026-11-07', tingkat_bukti: 'resmi', url: null }; // tangkapan layar dari pemilik; BUKAN pptx SOLEHAN
const SUMBER_HANOVER = { id: 'solehan-slide6', jenis: 'dokumen-presentasi', judul: '[SOLEHAN] 2026-09-02 Bahan Kebijakan Pengembangan Industri Modul Surya (EBT Connex), slide 6: daftar 35 industri modul surya dalam negeri', diterima: 'pemilik, berkas lokal', tingkat_bukti: 'kata-pihak', url: null };

// ---------- util ----------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const baca = (f) => fs.existsSync(f) ? fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : [];
const tulis = (f, rows) => fs.writeFileSync(f, rows.map((r) => JSON.stringify(r)).join('\n') + (rows.length ? '\n' : ''));
const sha = (s, n = 10) => crypto.createHash('sha1').update(s).digest('hex').slice(0, n);
const slug = (u) => u.replace(/^https?:\/\//, '').replace(/[^a-z0-9]+/gi, '_').slice(0, 120);
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
const dec = (s) => s.replace(/&#x([0-9a-f]+);|&#(\d+);|&(\w+);/gi, (m, h, d, n) => h ? String.fromCodePoint(parseInt(h, 16)) : d ? String.fromCodePoint(+d) : (ENT[n] ?? m));
export const teks = (h) => dec(h.replace(/<(script|style|noscript)[\s\S]*?<\/\1>/gi, ' ').replace(/<\/(p|div|li|tr|h\d|br|section|article|td|span|a)>|<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ' '))
  .replace(/[ \t\f\r ]+/g, ' ').replace(/\n\s*/g, '\n').trim();

const GELAR = /\b(prof|drg|dr|drs|dra|ir|h|hj|kh|ing|se|sh|st|mt|mm|mba|msc|ma|map|mh|mkn|sip|ssi|spd|phd|llm|ak|ca|cfa|meng|mp|msi|mse|mcom|cpa|bsc|bba|mpa|mem)\b/gi;
export function kunciNama(nama) {
  return nama.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/,.*$/, '')
    .replace(/\./g, ' ').replace(GELAR, ' ').replace(/[^a-z\s]/g, ' ').replace(/\s+/g, ' ').trim();
}
export function kunciPerusahaan(nama, situs) {
  const n = nama.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\(.*?\)/g, ' ')
    .replace(/\b(pt|tbk|persero|cv|inc|corp|corporation|ltd|co)\b/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim();
  return n + '|' + (situs ? new URL(situs).hostname.replace(/^www\./, '') : '');
}

// ---------- parser pengurus ----------
const STOP = new Set('tentang profil kontak berita laporan direksi komisaris dewan perusahaan tata kelola karir karier beranda home about news contact board management directors commissioners investor relations annual report sustainability read more selengkapnya lihat download unduh pt tbk persero group indonesia energy energi power struktur organisasi visi misi sejarah kebijakan pengadaan informasi publik layanan produk media pers search cari bahasa english manajemen eksekutif komite sekretaris corporate secretary audit internal pengurus anggota jajaran kembali lebih lanjut'.split(' '));
const PART = new Set(['bin', 'binti', 'van', 'de', 'der', 'al', 'el', 'von', 'dan']);
const RE_JAB = /^(?:(?:wakil\s+)?(?:direktur|komisaris|presiden\s+direktur|presiden\s+komisaris)\b.*|(?:vice\s+)?president\s+(?:director|commissioner)\b.*|(?:independent\s+|deputy\s+|managing\s+|executive\s+)?(?:commissioner|director)\b.*|chief\s+.+\s+officer|chief executive officer|ceo)$/i;
export function jabatanOk(s) {
  const t = s.trim();
  if (t.length < 6 || t.length > 90 || /[.:;]$/.test(t) || /^(direktur|komisaris|director|commissioner)s?$/i.test(t)) return false;
  if (/\b(untuk|dalam|yang|dan\s+\w+\s+\w+\s+\w+|adalah|memiliki)\b/i.test(t) && t.split(' ').length > 9) return false;
  return RE_JAB.test(t);
}
export function jenisJabatan(j) {
  if (/(presiden|president)\s+komisaris|(president|chairman)\s+commissioner|komisaris utama/i.test(j)) return 'komisaris-utama';
  if (/(presiden|president)\s+direktur|(president|managing)\s+director|direktur utama|^ceo$|chief executive/i.test(j) && !/wakil|vice|deputy/i.test(j)) return 'direktur-utama';
  if (/komisaris|commissioner/i.test(j)) return 'komisaris';
  if (/direktur|director|chief/i.test(j)) return 'direktur';
  return 'lain';
}
export function namaOk(s) {
  let t = s.trim().replace(/\s+/g, ' ');
  if (t.length < 5 || t.length > 70) return null;
  const [inti, ...sisa] = t.split(',');
  const kata = inti.trim().split(' ');
  if (kata.length < 2 || kata.length > 7 || /\d|[@/|:()]/.test(inti)) return null;
  let nTitik = 0;
  for (const k of kata) {
    const l = k.toLowerCase().replace(/\./g, '');
    if (STOP.has(l) || RE_JAB.test(k) && /^(direktur|komisaris|director|commissioner|chief|ceo)$/i.test(k)) return null;
    if (PART.has(l)) continue;
    if (!/^[\p{Lu}][\p{L}.'’-]*$/u.test(k)) return null;
    nTitik++;
  }
  if (nTitik < 2 && !/^(dr|ir|prof|h|hj)\.?$/i.test(kata[0])) return null;
  return { nama: inti.trim(), gelar: sisa.join(',').trim() || undefined };
}
// layout A: nama lalu jabatan; layout B: jabatan lalu nama. Diputuskan dari jabatan pertama halaman.
export function uraiPengurus(t) {
  const L = t.split('\n').map((s) => s.trim()).filter(Boolean);
  const hasil = []; const lihat = new Set();
  const tambah = (n, j) => { const k = kunciNama(n.nama) + '|' + j.toLowerCase(); if (!lihat.has(k)) { lihat.add(k); hasil.push({ ...n, jabatan: j }); } };
  const idxJ = []; L.forEach((l, i) => { if (jabatanOk(l)) idxJ.push(i); });
  const pisah = (l) => { for (const sep of [' - ', ' – ', ' | ', ' — ']) { const p = l.split(sep); if (p.length === 2) { if (jabatanOk(p[1]) && namaOk(p[0])) return [namaOk(p[0]), p[1].trim()]; if (jabatanOk(p[0]) && namaOk(p[1])) return [namaOk(p[1]), p[0].trim()]; } } return null; };
  L.forEach((l) => { const p = pisah(l); if (p) tambah(p[0], p[1]); });
  const A = idxJ.length && idxJ[0] > 0 && namaOk(L[idxJ[0] - 1]);
  for (const i of idxJ) {
    const n = A ? namaOk(L[i - 1] || '') : namaOk(L[i + 1] || '');
    if (n) tambah(n, L[i]);
  }
  return hasil;
}
const dom = (h) => { const p = h.replace(/^www\./, '').split('.'); return /^(co|or|go|ac|web|sch)$/.test(p.at(-2)) ? p.slice(-3).join('.') : p.slice(-2).join('.'); };
export function fotoKandidat(html, namaList, pageUrl) {
  const pos = namaList.map((n) => html.toLowerCase().indexOf(n.toLowerCase()));
  const imgs = [];
  for (const m of html.matchAll(/<img\b[^>]*>/gi)) {
    const src = (m[0].match(/\b(?:data-src|data-lazy-src|data-original|src)=["']([^"']+)["']/i) || [])[1];
    if (!src || /logo|icon|sprite|banner|placeholder|favicon|flag|social|\.svg|\.gif|^data:/i.test(src)) continue;
    let u; try { u = new URL(dec(src), pageUrl); } catch { continue; }
    if (!/^https?:$/.test(u.protocol) || dom(u.hostname) !== dom(new URL(pageUrl).hostname)) continue;
    imgs.push({ at: m.index, url: u.href });
  }
  const pakai = new Map(); const out = namaList.map(() => null);
  const urut = pos.map((p, i) => [p, i]).filter(([p]) => p >= 0).sort((a, b) => a[0] - b[0]);
  urut.forEach(([p, i], k) => {
    const lo = k ? (urut[k - 1][0] + p) / 2 : p - 2500, hi = k < urut.length - 1 ? (urut[k + 1][0] + p) / 2 : p + 2500;
    const c = imgs.filter((x) => x.at >= lo && x.at <= hi).sort((a, b) => Math.abs(a.at - p) - Math.abs(b.at - p))[0];
    if (c) { out[i] = c.url; pakai.set(c.url, (pakai.get(c.url) || 0) + 1); }
  });
  return out.map((u) => (u && pakai.get(u) === 1 ? u : null)); // gambar dipakai > 1 orang = spanduk, buang
}

// ---------- jaringan ----------
let terakhir = 0;
const robotsCache = new Map(); const hostBlok = new Set();
async function tunggu(u, aksi = 'text/html,application/xhtml+xml,*/*') {
  const d = Date.now() - terakhir; if (d < GAP_MS) await sleep(GAP_MS - d); terakhir = Date.now();
  return fetch(u, { headers: { 'User-Agent': UA, Accept: aksi }, redirect: 'follow', signal: AbortSignal.timeout(25000) });
}
async function robotsOk(u) {
  const { origin, pathname } = new URL(u);
  if (!robotsCache.has(origin)) {
    const aturan = [];
    try {
      const r = await tunggu(origin + '/robots.txt');
      if (r.status === 200) {
        let ua = false;
        for (const b of (await r.text()).split(/\r?\n/)) {
          const m = b.match(/^\s*([a-z-]+)\s*:\s*(.*?)\s*(#.*)?$/i); if (!m) continue;
          const k = m[1].toLowerCase();
          if (k === 'user-agent') ua = m[2] === '*'; else if (ua && k === 'disallow' && m[2]) aturan.push(m[2]);
        }
      }
    } catch {}
    robotsCache.set(origin, aturan);
  }
  return !robotsCache.get(origin).some((p) => pathname.startsWith(p.replace(/\*.*$/, '').replace(/\$$/, '')));
}
const gagal = [];
const catatGagal = (perusahaan_id, url, alasan) => gagal.push({ perusahaan_id, url, alasan, tanggal: HARI_INI });
async function ambil(u, pid) { // -> {file, final} | null
  const host = new URL(u).hostname;
  if (/linkedin|facebook|instagram|twitter|x\.com|tiktok|youtube/i.test(host)) { catatGagal(pid, u, 'host-terlarang'); return null; }
  if (hostBlok.has(host)) { catatGagal(pid, u, 'host-dihentikan'); return null; }
  fs.mkdirSync(RAW, { recursive: true });
  const f = path.join(RAW, slug(u) + '.html');
  if (fs.existsSync(f)) return { file: f, final: u };
  try {
    if (!(await robotsOk(u))) { catatGagal(pid, u, 'robots-tolak'); return null; }
    const r = await tunggu(u);
    if (r.status === 403 || r.status === 429) { hostBlok.add(host); catatGagal(pid, u, 'http-' + r.status + '-host-dihentikan'); return null; }
    if (r.status !== 200) { catatGagal(pid, u, 'http-' + r.status); return null; }
    fs.writeFileSync(f, Buffer.from(await r.arrayBuffer()));
    return { file: f, final: r.url || u };
  } catch (e) { catatGagal(pid, u, 'jaringan:' + (e.cause?.code || e.name || e.message)); return null; }
}
async function ambilFoto(u, orangId, pid) {
  try {
    if (!(await robotsOk(u))) { catatGagal(pid, u, 'foto-robots-tolak'); return null; }
    const r = await tunggu(u, 'image/*');
    if (r.status !== 200) { catatGagal(pid, u, 'foto-http-' + r.status); return null; }
    const ct = r.headers.get('content-type') || ''; const ext = /jpe?g/.test(ct) ? 'jpg' : /png/.test(ct) ? 'png' : /webp/.test(ct) ? 'webp' : null;
    const b = Buffer.from(await r.arrayBuffer());
    if (!ext || b.length < 4000 || b.length > 3_000_000) { catatGagal(pid, u, 'foto-tipe-atau-ukuran:' + ct + ':' + b.length); return null; }
    fs.mkdirSync(FOTO, { recursive: true });
    const nama = `${orangId}.${ext}`; fs.writeFileSync(path.join(FOTO, nama), b);
    return nama;
  } catch (e) { catatGagal(pid, u, 'foto-jaringan:' + (e.cause?.code || e.name)); return null; }
}


// ---------- kontak korporat (hanya yang tercetak di sumber resmi; bukan milik perorangan) ----------
const EMAIL_UMUM = /^(info|contact|contactus|corporate|corsec|corp|sekretariat|secretary|secretariat|investor|ir|investorrelations|customer|customercare|cs|care|humas|hello|office|admin|marketing|sales|support|csr|legal|procurement|pengadaan|layanan|callcenter|enquiry|inquiry|press|media|komunikasi|publikasi|general|mail|public|corpcom|cc|hrd|recruitment|karir|career)([._-]?[a-z]*)?$/i;
export function surelUmum(teksHalaman) {
  const out = new Set();
  for (const m of teksHalaman.matchAll(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi)) { const [lokal, host] = m[0].toLowerCase().split('@'); if (EMAIL_UMUM.test(lokal) && !/\.(png|jpg|svg|gif)$/.test(host)) out.add(m[0].toLowerCase()); }
  return [...out];
}
export function telepon(teksHalaman) {
  const out = new Set();
  for (const baris of teksHalaman.split('\n')) {
    if (/fax|faks|whatsapp|\bwa\b/i.test(baris)) continue;
    for (const m of baris.matchAll(/(?:\+62|\(0\d{1,3}\)|\b0\d{1,3})[\s.()-]*\d[\d\s.-]{5,11}\d/g)) {
      const raw = m[0]; if (!/tel|phone|telp|call|hotline|kontak|contact|\bt\b|office|kantor|^\+62/i.test(baris + raw)) continue;
      let d = raw.replace(/\D/g, ''); if (d.startsWith('0')) d = '62' + d.slice(1);
      if (!d.startsWith('62') || d.length < 10 || d.length > 14 || /^628/.test(d)) continue; // 628xx = seluler, bisa milik perorangan: dibuang
      out.add('+' + d);
    }
  }
  return [...out];
}
export function alamat(teksHalaman) {
  const L = teksHalaman.split('\n').map((s) => s.trim()).filter(Boolean);
  for (let i = 0; i < L.length; i++) {
    if (!/\b(jl\.?|jalan)\s/i.test(L[i]) || L[i].length < 15 || L[i].length > 220) continue;
    let a = L[i]; if (a.length < 60 && L[i + 1] && L[i + 1].length < 120 && !/@|tel|phone/i.test(L[i + 1])) a += ', ' + L[i + 1];
    return { alamat_kantor: a.replace(/^(alamat|address|kantor pusat|head office)\s*[:\-]?\s*/i, ''), kode_pos: (a.match(/\b([1-9]\d{4})\b/) || [])[1] || null };
  }
  return null;
}
export function koordinat(html) {
  const m = html.match(/!2d(-?\d+\.\d+)!3d(-?\d+\.\d+)/) || html.match(/"latitude"\s*:\s*"?(-?\d+\.\d+)"?\s*,\s*"longitude"\s*:\s*"?(-?\d+\.\d+)/);
  if (!m) return null; const [a, b] = m[0].includes('!2d') ? [m[2], m[1]] : [m[1], m[2]]; // gmaps: 2d=lng, 3d=lat
  return { lat: +a, lng: +b };
}
async function nominatim(q, pid) {
  try {
    const r = await tunggu('https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=id&q=' + encodeURIComponent(q), 'application/json');
    if (r.status !== 200) { catatGagal(pid, 'nominatim', 'http-' + r.status); return null; }
    const j = (await r.json())[0]; return j ? { lat: +(+j.lat).toFixed(5), lng: +(+j.lon).toFixed(5) } : null;
  } catch { return null; }
}

// ---------- rekaman ----------
function bangunRekaman() {
  const tabel = new Map(TABEL_MODUL.trim().split('\n').map((l) => { const [n, mwp, pasar, apamsi, tkdn, bmp] = l.split('|'); return [n, { mwp, pasar, apamsi, tkdn, bmp }]; }));
  const peta = new Map(); const dipakai = new Set();
  for (const l of BENIH.trim().split('\n')) {
    const [batch, nama, jenis, peran, kep, induk, kota, prov, situs, saham] = l.split('|');
    const kunci = kunciPerusahaan(nama, situs || null);
    if (peta.has(kunci)) continue;
    const r = {
      perusahaan_id: 'p_' + sha(kunci), batch: +batch, nama, nama_lain: [], jenis, induk: induk || null,
      kepakaran: kep.split(',').filter(Boolean), peran_rantai: peran.split(',').filter(Boolean),
      kantor_pusat: { kota: kota || null, provinsi: prov || null }, situs: situs || null, tahun_berdiri: null,
      proyek: [], kapasitas_portofolio: null, kode_saham: saham || null,
      kapasitas_mwp_tahun: null, pasar: null, apamsi: null, tkdn: null, bmp: null,
      sumber: [{ id: 'benih', url: null, keterangan: SUMBER_BENIH, tanggal_periksa: HARI_INI, tingkat_bukti: 'inferensi' }],
      sumber_field: { nama: 'benih', jenis: 'benih', induk: 'benih', kepakaran: 'benih', peran_rantai: 'benih', kantor_pusat: 'benih' },
      verifikasi: { situs_ok: false, http: null, judul: null, tanggal_periksa: null }, pengurus_status: 'belum-dibaca',
    };
    const t = tabel.get(nama);
    if (t) {
      dipakai.add(nama);
      r.kapasitas_mwp_tahun = t.mwp ? +t.mwp : null; r.pasar = t.pasar; r.apamsi = t.apamsi === 'APAMSI';
      r.tkdn = t.tkdn ? +t.tkdn : null; r.bmp = t.bmp ? +t.bmp : null;
      r.sumber.push({ ...SUMBER_TABEL, tanggal_periksa: HARI_INI });
      for (const k of ['kapasitas_mwp_tahun', 'pasar', 'apamsi', 'tkdn', 'bmp']) r.sumber_field[k] = 'tabel-modul';
    }
    if (/Hanover Solar/.test(nama)) { r.kandidat = true; r.sumber.push({ ...SUMBER_HANOVER, tanggal_periksa: HARI_INI }); r.sumber_field.nama = 'solehan-slide6'; }
    peta.set(kunci, r);
  }
  for (const n of tabel.keys()) assert(dipakai.has(n), 'tabel modul tanpa benih: ' + n);
  return [...peta.values()];
}
const tokenNama = (n) => (n.toLowerCase().replace(/\(.*?\)/g, ' ').replace(/\b(pt|tbk|persero|cv|inc|corp|corporation|ltd|co|indonesia)\b/g, ' ').match(/[a-z]{4,}/) || [''])[0];

async function jalan(batches) {
  fs.mkdirSync(OUT, { recursive: true });
  const lama = new Map(baca(path.join(OUT, 'perusahaan.jsonl')).map((r) => [r.perusahaan_id, r]));
  const semua = bangunRekaman().map((r) => { const o = lama.get(r.perusahaan_id); return o ? { ...r, verifikasi: o.verifikasi, pengurus_status: o.pengurus_status, sumber: [...r.sumber, ...o.sumber.filter((x) => !r.sumber.some((y) => y.id === x.id))], sumber_field: { ...o.sumber_field, ...r.sumber_field }, situs: o.situs, kontak: o.kontak } : r; });
  const orangRows = baca(ORANG); const orangKunci = new Map();
  for (const o of orangRows) { const k = kunciNama(o.nama); orangKunci.set(k, orangKunci.has(k) ? 'ambigu' : o.orang_id); }
  let pengurus = baca(path.join(OUT, 'pengurus.jsonl'));
  const simpan = () => {
    tulis(path.join(OUT, 'perusahaan.jsonl'), semua); tulis(path.join(OUT, 'pengurus.jsonl'), pengurus);
    const g = baca(path.join(OUT, 'gagal.jsonl')); const k = new Set(g.map((x) => x.url + x.alasan));
    for (const x of gagal) if (!k.has(x.url + x.alasan)) { g.push(x); k.add(x.url + x.alasan); }
    tulis(path.join(OUT, 'gagal.jsonl'), g);
  };
  simpan();
  for (const b of batches) {
    for (const r of semua.filter((x) => x.batch === b)) {
      if (!r.situs || r.pengurus_status !== 'belum-dibaca') continue;
      const h = await ambil(r.situs, r.perusahaan_id);
      if (!h) { r.pengurus_status = 'situs-gagal'; continue; }
      const html = fs.readFileSync(h.file, 'utf8'); const t0 = teks(html);
      const ok = t0.toLowerCase().includes(tokenNama(r.nama));
      r.verifikasi = { situs_ok: ok, http: 200, judul: dec((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '').replace(/\s+/g, ' ').trim().slice(0, 120), tanggal_periksa: HARI_INI };
      if (!ok) { r.pengurus_status = 'situs-tak-memuat-nama'; catatGagal(r.perusahaan_id, r.situs, 'nama-tak-ditemukan-di-beranda'); continue; }
      r.sumber.push({ id: 'situs', url: r.situs, keterangan: 'situs resmi perusahaan, beranda terbaca', tanggal_periksa: HARI_INI, tingkat_bukti: 'kata-pihak' });
      r.sumber_field.situs = 'situs';
      // cari halaman direksi/manajemen dari tautan beranda
      const base = new URL(h.final); const cand = new Map();
      for (const m of html.matchAll(/<a\s[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
        let u; try { u = new URL(dec(m[1]), base); } catch { continue; }
        if (dom(u.hostname) !== dom(base.hostname) || /\.(pdf|jpe?g|png|zip|docx?|xlsx?)$/i.test(u.pathname)) continue;
        const s = teks(m[2]).replace(/\n/g, ' ') + ' ' + u.pathname;
        const skor = /(direksi|board of directors|dewan direksi)/i.test(s) ? 3 : /(komisaris|commissioner|management|manajemen|leadership|pengurus|our people)/i.test(s) ? 2 : /(tata kelola|governance|tentang|about)/i.test(s) ? 1 : 0;
        if (skor && (cand.get(u.href) || 0) < skor) cand.set(u.href, skor);
      }
      const kon = new Map();
      for (const m of html.matchAll(/<a\s[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi)) { let u; try { u = new URL(dec(m[1]), base); } catch { continue; } if (dom(u.hostname) === dom(base.hostname) && /(kontak|contact|hubungi)/i.test(teks(m[2]) + ' ' + u.pathname) && !/\.(pdf|jpe?g|png)$/i.test(u.pathname)) kon.set(u.href, 1); }
      const urutKon = [...kon.keys()].slice(0, 1);
      const urut = [...cand].sort((a, b) => b[1] - a[1]).slice(0, 3).map((x) => x[0]);
      let dapat = 0; const sudah = new Set(pengurus.filter((p) => p.perusahaan_id === r.perusahaan_id).map((p) => p.pengurus_id));
      for (const u of urut) {
        const hp = await ambil(u, r.perusahaan_id); if (!hp) continue;
        const hh = fs.readFileSync(hp.file, 'utf8');
        const hasil = uraiPengurus(teks(hh)); if (hasil.length < 2) continue;
        const fotoU = fotoKandidat(hh, hasil.map((x) => x.nama), hp.final);
        for (let i = 0; i < hasil.length; i++) {
          const x = hasil[i]; const kn = kunciNama(x.nama); const oid = orangKunci.get(kn);
          const orang_id = oid && oid !== 'ambigu' ? oid : 'o_' + sha(kn);
          const pid = 'g_' + sha(r.perusahaan_id + kn + x.jabatan.toLowerCase());
          if (sudah.has(pid)) continue; sudah.add(pid);
          const rec = { pengurus_id: pid, perusahaan_id: r.perusahaan_id, nama: x.nama, gelar: x.gelar, jabatan: x.jabatan, jenis_jabatan: jenisJabatan(x.jabatan), mulai: null,
            orang_id, orang_baru: !(oid && oid !== 'ambigu'), sumber_url: hp.final, tanggal_ambil: HARI_INI, tingkat_bukti: 'kata-pihak', ekstraksi: 'heuristik',
            foto_url: null, foto_berkas: null, foto_sumber: null, hak_cipta: null };
          if (fotoU[i]) {
            const f = fs.existsSync(FOTO) ? fs.readdirSync(FOTO).find((n) => n.startsWith(orang_id + '.')) : null;
            const berkas = f || await ambilFoto(fotoU[i], orang_id, r.perusahaan_id);
            if (berkas) Object.assign(rec, { foto_url: fotoU[i], foto_berkas: 'foto/' + berkas, foto_sumber: hp.final, hak_cipta: HAK_CIPTA });
          }
          pengurus.push(rec); dapat++;
        }
        if (dapat >= 2) break;
      }
      { const sumberTxt = [{ u: h.final, html }]; for (const u of urutKon) { const hk = await ambil(u, r.perusahaan_id); if (hk) sumberTxt.push({ u: hk.final, html: fs.readFileSync(hk.file, 'utf8') }); }
        const k = { alamat_kantor: null, kota: r.kantor_pusat.kota, provinsi: r.kantor_pusat.provinsi, kode_pos: null, telepon: [], surel: [], situs: r.situs, lat: null, lng: null, lat_lng_sumber: null, sumber_url: null, tanggal_ambil: HARI_INI, tingkat_bukti: 'kata-pihak' };
        for (const x of sumberTxt) { const tt = teks(x.html); const e = surelUmum(tt), tl = telepon(tt), a = alamat(tt), c = koordinat(x.html);
          if ((e.length || tl.length || a || c) && !k.sumber_url) k.sumber_url = x.u;
          k.surel = [...new Set([...k.surel, ...e])]; k.telepon = [...new Set([...k.telepon, ...tl])];
          if (a && !k.alamat_kantor) { k.alamat_kantor = a.alamat_kantor; k.kode_pos = a.kode_pos; }
          if (c && k.lat == null) { k.lat = c.lat; k.lng = c.lng; k.lat_lng_sumber = 'halaman-resmi'; } }
        if (k.alamat_kantor && k.lat == null) { const c = await nominatim(k.alamat_kantor, r.perusahaan_id); if (c) { k.lat = c.lat; k.lng = c.lng; k.lat_lng_sumber = 'OpenStreetMap Nominatim (ODbL)'; } }
        r.kontak = k; r.sumber_field.kontak = 'situs'; }
      r.pengurus_status = dapat ? 'terbaca' : 'tak-terurai';
      if (!dapat) catatGagal(r.perusahaan_id, r.situs, 'halaman-pengurus-tak-terurai:' + urut.length + '-kandidat');
      if (dapat) r.sumber_field.pengurus = 'situs';
    }
    simpan(); console.error(`batch ${b} tersimpan`);
  }
}

function statistik() {
  const P = baca(path.join(OUT, 'perusahaan.jsonl')), G = baca(path.join(OUT, 'pengurus.jsonl')), F = baca(path.join(OUT, 'gagal.jsonl'));
  const h = (f) => P.reduce((m, r) => { for (const k of [].concat(f(r))) m[k] = (m[k] || 0) + 1; return m; }, {});
  const adaDU = new Set(G.filter((x) => x.jenis_jabatan === 'direktur-utama').map((x) => x.perusahaan_id));
  const adaFoto = new Set(G.filter((x) => x.foto_berkas).map((x) => x.perusahaan_id));
  const pct = (n) => Math.round(1000 * n / P.length) / 10 + '%';
  console.log(JSON.stringify({ perusahaan: P.length, per_jenis: h((r) => r.jenis), per_peran: h((r) => r.peran_rantai), situs_terverifikasi: P.filter((r) => r.verifikasi.situs_ok).length,
    kontak_terisi: { surel: P.filter((r) => r.kontak?.surel?.length).length, telepon: P.filter((r) => r.kontak?.telepon?.length).length, alamat: P.filter((r) => r.kontak?.alamat_kantor).length, lat_lng: P.filter((r) => r.kontak?.lat != null).length, salah_satu_persen: pct(P.filter((r) => r.kontak && (r.kontak.surel.length || r.kontak.telepon.length || r.kontak.alamat_kantor)).length) },
    pengurus: G.length, pengurus_berfoto: G.filter((x) => x.foto_berkas).length, orang_tertaut_orang_jsonl: G.filter((x) => !x.orang_baru).length,
    persen_perusahaan_dengan_direktur_utama: pct(adaDU.size), persen_perusahaan_dengan_foto: pct(adaFoto.size), status: h((r) => r.pengurus_status), gagal: F.length,
    gagal_per_alasan: F.reduce((m, x) => (m[x.alasan.split(':')[0]] = (m[x.alasan.split(':')[0]] || 0) + 1, m), {}) }, null, 1));
}

function selftest() {
  assert.equal(kunciNama('Dr. Ir. Budi Santoso, M.M.'), 'budi santoso');
  assert.deepEqual(namaOk('Budi Santoso, S.T., M.M.'), { nama: 'Budi Santoso', gelar: 'S.T., M.M.' });
  assert.equal(namaOk('Tentang Kami'), null); assert.equal(namaOk('Dewan Komisaris'), null); assert.equal(namaOk('Direktur Utama'), null);
  assert(jabatanOk('Direktur Utama') && jabatanOk('President Director') && jabatanOk('Komisaris Independen') && jabatanOk('Direktur Keuangan'));
  assert(!jabatanOk('Direksi') && !jabatanOk('Direktur') && !jabatanOk('Kami memiliki direktur yang berpengalaman.'));
  assert.equal(jenisJabatan('Presiden Direktur'), 'direktur-utama'); assert.equal(jenisJabatan('Wakil Direktur Utama'), 'direktur'); assert.equal(jenisJabatan('Komisaris Utama'), 'komisaris-utama');
  const A = uraiPengurus('Direksi\nBudi Santoso\nDirektur Utama\nSiti Rahma, S.E.\nDirektur Keuangan\nDewan Komisaris\nAndi Wijaya\nKomisaris Utama');
  assert.equal(A.length, 3); assert.equal(A[1].jabatan, 'Direktur Keuangan');
  const B = uraiPengurus('Direksi\nDirektur Utama\nBudi Santoso\nDirektur Keuangan\nSiti Rahma');
  assert.equal(B.length, 2); assert.equal(B[0].nama, 'Budi Santoso');
  const C = uraiPengurus('Budi Santoso - Direktur Utama\nSiti Rahma | Direktur SDM'); assert.equal(C.length, 2);
  const html = '<div><img src="/u/budi.jpg"><h3>Budi Santoso</h3><p>Direktur Utama</p></div><div><img src="/u/siti.jpg"><h3>Siti Rahma</h3></div><img src="/logo.png"><img src="https://evil.com/x.jpg">';
  assert.deepEqual(fotoKandidat(html, ['Budi Santoso', 'Siti Rahma'], 'https://www.example.org/direksi'), ['https://www.example.org/u/budi.jpg', 'https://www.example.org/u/siti.jpg']);
  assert.equal(fotoKandidat('<img src="/u/a.jpg"><b>Budi Santoso</b><b>Siti Rahma</b>', ['Budi Santoso', 'Siti Rahma'], 'https://x.id/')[1], null); // gambar bersama dibuang
  assert.deepEqual(surelUmum('hubungi info@example.org atau budi.santoso@example.org'), ['info@example.org']);
  assert.deepEqual(telepon('Telp: (021) 0000 0000'), ['+622100000000']);
  assert.deepEqual(telepon('Telepon HP: 0812 3456 7890'), []);
  assert.equal(alamat('Alamat\nJl. Medan Merdeka Selatan No. 9, Jakarta 10110').kode_pos, '10110');
  assert.deepEqual(koordinat('x !2d106.8273!3d-6.1754 y'), { lat: -6.1754, lng: 106.8273 });
  const r = bangunRekaman(); assert(r.length > 100); assert(new Set(r.map((x) => x.perusahaan_id)).size === r.length);
  assert.equal(r.filter((x) => x.kapasitas_mwp_tahun !== null || x.pasar).length, 40);
  assert(r.every((x) => ['bumn', 'swasta', 'asing', 'patungan', 'koperasi', 'tbk', 'tidak-diketahui'].includes(x.jenis)));
  console.log('selftest ok,', r.length, 'perusahaan benih');
}

const arg = (n) => (process.argv.find((a) => a.startsWith(`--${n}`)) || '').split('=').slice(1).join('=');
if (process.argv.includes('--selftest')) selftest();
else if (process.argv.some((a) => a.startsWith('--jalan'))) { const b = arg('jalan'); await jalan(b ? b.split(',').map(Number) : [1, 2, 3, 4, 5]); }
else if (process.argv.includes('--statistik')) statistik();
else console.log('lihat komentar di kepala berkas');
