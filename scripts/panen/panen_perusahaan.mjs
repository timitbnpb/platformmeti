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
const RE_JAB = /^(?:(?:wakil\s+)?(?:direktur|komisaris|presiden\s+direktur|presiden\s+komisaris)\b.*|(?:vice\s+)?president\s+(?:director|commissioner)\b.*|(?:independent\s+|deputy\s+|managing\s+|executive\s+)?(?:commissioner|director)\b.*|(?:vice\s+)?chairman\b.*|member of .*board.*|(?:deputy\s+)?managing\s+director\b.*|chief\s+.+\s+officer|chief executive officer|ceo)$/i;
export function jabatanOk(s) {
  const t = s.trim();
  if (t.length < 6 || t.length > 90 || /[.:;]$/.test(t) || /^(direktur|komisaris|director|commissioner)s?$/i.test(t)) return false;
  if (/\b(untuk|dalam|yang|dan\s+\w+\s+\w+\s+\w+|adalah|memiliki)\b/i.test(t) && t.split(' ').length > 9) return false;
  return RE_JAB.test(t);
}
export function jenisJabatan(j) {
  if (/chairman.*(supervisory|board)/i.test(j) && !/vice/i.test(j)) return 'komisaris-utama';
  if (/member of .*(supervisory|board)|vice chairman/i.test(j)) return 'komisaris';
  if (/(presiden|president)\s+komisaris|(president|chairman)\s+commissioner|komisaris utama/i.test(j)) return 'komisaris-utama';
  if (/(presiden|president)\s+direktur|(president|managing)\s+director$|direktur utama|^ceo$|chief executive/i.test(j) && !/wakil|vice|deputy/i.test(j)) return 'direktur-utama';
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
  if (A) { L.forEach((l, i) => { if (/^(komisaris|direktur|commissioner|director)$/i.test(l) && i > 0 && namaOk(L[i - 1])) idxJ.push(i); }); idxJ.sort((a, b) => a - b); } // jabatan tunggal ("Komisaris") sah bila didahului nama (layout A)
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
const hostGap = new Map(), terakhirHost = new Map(); // Crawl-delay robots.txt per host
async function tunggu(u, aksi = 'text/html,application/xhtml+xml,*/*') {
  const host = new URL(u).hostname, gap = Math.max(GAP_MS, hostGap.get(host) || 0), d = Date.now() - Math.max(terakhir, terakhirHost.get(host) || 0);
  if (d < gap) await sleep(gap - d); terakhir = terakhirHost.set(host, Date.now()).get(host);
  return fetch(u, { headers: { 'User-Agent': UA, Accept: aksi }, redirect: 'follow', signal: AbortSignal.timeout(25000) });
}
async function robotsOk(u) {
  const { origin, pathname, search } = new URL(u);
  if (!robotsCache.has(origin)) {
    const aturan = [];
    try {
      const r = await tunggu(origin + '/robots.txt');
      if (r.status === 200) {
        let ua = false;
        for (const b of (await r.text()).split(/\r?\n/)) {
          const m = b.match(/^\s*([a-z-]+)\s*:\s*(.*?)\s*(#.*)?$/i); if (!m) continue;
          const k = m[1].toLowerCase();
          if (k === 'user-agent') ua = m[2] === '*'; else if (ua && k === 'crawl-delay' && +m[2] > 0) hostGap.set(new URL(u).hostname, Math.min(+m[2], 60) * 1000); else if (ua && (k === 'disallow' || k === 'allow') && m[2]) aturan.push([k, m[2]]);
        }
      }
    } catch {}
    robotsCache.set(origin, aturan);
  }
  // aturan paling panjang menang (Allow menang bila sama panjang); '*' dan '$' sebagai wildcard
  let terbaik = null; const jalur = pathname + search;
  for (const [k, p] of robotsCache.get(origin)) { const re = new RegExp('^' + p.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\\\?/g, '\\?').replace(/\*/g, '.*').replace(/\\\$$/, '$')); if (re.test(jalur) && (!terbaik || p.length > terbaik[1].length || (p.length === terbaik[1].length && k === 'allow'))) terbaik = [k, p]; }
  return !terbaik || terbaik[0] === 'allow';
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
  for (const m of teksHalaman.matchAll(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi)) { const [lokal, host] = m[0].toLowerCase().split('@'); if (EMAIL_UMUM.test(lokal) && !/^(gmail|yahoo|ymail|hotmail|outlook|live|icloud|proton|protonmail)\./.test(host) && !/\.(png|jpg|svg|gif)$/.test(host)) out.add(m[0].toLowerCase()); }
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

// Penyesuaian manual per entitas (permintaan pemilik 7 Nov 2026). Kunci = normNama.
const OVERRIDE = {
  'pertamina new renewable energy': { situs: 'https://pertaminanre.com/id', situs_keyakinan: 'tinggi', situs_catatan: 'situs resmi PNRE; entitas sendiri, terpisah dari PT Pertamina Power Indonesia', pengurus_url: ['https://pertaminanre.com/id/tentang-kami/manajemen'] },
  'pertamina power indonesia': { situs: null, situs_keyakinan: null, situs_catatan: 'anak usaha PNRE; tidak ada situs sendiri yang ditemukan (situs pertaminanre.com adalah milik PNRE)' },
  'badan pengelola investasi daya anagata nusantara': { situs: 'https://www.danantaraindonesia.co.id/', situs_keyakinan: 'tinggi', situs_catatan: 'situs resmi BPI Danantara; robots.txt mengizinkan', pengurus_url: ['https://www.danantaraindonesia.co.id/about/our-people/supervisory-board', 'https://www.danantaraindonesia.co.id/about/our-people/bpi-danantaras'] },
};
const SUMBER_ARSIP_DENERA = { id: 'arsip-meti', jenis: 'dokumen-internal', judul: 'Deck UKP hlm 17; Enlit Asia 2026 pptx slide 1-11 (arsip METI, data-panen/arsip-meti)', url: null, tingkat_bukti: 'kata-pihak' };
const SUMBER_JP_DENERA = { id: 'jakartapost-2026-07-14', jenis: 'media', judul: 'The Jakarta Post, Govt names consortia for second batch of waste-to-energy projects (14 Jul 2026): memuat "PT Daya Energi Bersih Nusantara (Denera), Danantara\'s WtE unit"', url: 'https://thejakartapost.com/business/2026/07/14/govt-names-consortia-for-second-batch-of-waste-to-energy-projects', tingkat_bukti: 'cuplikan' };
const SUMBER_PERMINTAAN = { id: 'permintaan-pemilik', jenis: 'permintaan', judul: 'Permintaan pemilik METI 7 Nov 2026 (nama saja; belum ada sumber primer)', url: null, tingkat_bukti: 'inferensi' };
const normNama = (n) => n.toLowerCase().replace(/\(.*?\)/g, ' ').replace(/\b(pt|tbk|persero|cv)\b/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim();
const TEMUAN = new Map(baca(path.join(ROOT, 'data-panen/temuan/situs_perusahaan.jsonl')).map((x) => [normNama(x.nama), x]));
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
    if (/^Denera/.test(nama)) { r.sumber.push({ ...SUMBER_ARSIP_DENERA, tanggal_periksa: HARI_INI }); r.sumber.push({ ...SUMBER_JP_DENERA, tanggal_periksa: HARI_INI }); r.nama_lain = ['Denera', nama]; r.nama = 'PT Daya Energi Bersih Nusantara (Denera)'; r.jenis = 'bumn'; r.sumber_field.nama = 'jakartapost-2026-07-14'; r.sumber_field.jenis = 'jakartapost-2026-07-14'; r.sumber_field.induk = 'jakartapost-2026-07-14'; r.kapasitas_portofolio = 'rencana 33 kota; kapasitas belum ada; dibentuk 1 Apr 2026 (arsip METI)'; r.sumber_field.kapasitas_portofolio = 'arsip-meti'; r.sumber_field.nama = 'arsip-meti'; r.nama_lain = ['Denera']; }
    if (/Mahakarsa/.test(nama)) r.sumber.push({ ...SUMBER_PERMINTAAN, tanggal_periksa: HARI_INI });
    const tm = TEMUAN.get(normNama(nama));
    if (tm && !r.situs) { r.situs = tm.url; r.situs_keyakinan = tm.keyakinan; r.situs_catatan = tm.catatan || null; r.sumber_field.situs = 'temuan-situs'; }
    peta.set(kunci, r);
  }
  for (const n of tabel.keys()) assert(dipakai.has(n), 'tabel modul tanpa benih: ' + n);
  return [...peta.values()];
}
const tokenNama = (n) => (n.toLowerCase().replace(/\(.*?\)/g, ' ').replace(/\b(pt|tbk|persero|cv|inc|corp|corporation|ltd|co|indonesia)\b/g, ' ').match(/[a-z]{4,}/) || [''])[0];

async function jalan(batches) {
  fs.mkdirSync(OUT, { recursive: true });
  const lama = new Map(baca(path.join(OUT, 'perusahaan.jsonl')).map((r) => [r.perusahaan_id, r]));
  const semua = bangunRekaman().map((r) => { const o = lama.get(r.perusahaan_id); return o ? { ...r, verifikasi: o.verifikasi, pengurus_status: o.pengurus_status, sumber: [...r.sumber, ...o.sumber.filter((x) => !r.sumber.some((y) => y.id === x.id))], sumber_field: { ...o.sumber_field, ...r.sumber_field }, situs: r.situs || o.situs, kontak: o.kontak } : r; });
  { const id = new Set(semua.map((x) => x.perusahaan_id)); for (const o of lama.values()) if (!id.has(o.perusahaan_id)) semua.push(o); } // rekaman hasil direktori anggota (batch 6) dipertahankan
  for (const r of semua) { const o = lama.get(r.perusahaan_id); if (o?.anggota_asosiasi) r.anggota_asosiasi = o.anggota_asosiasi; if (o?.kapasitas_portofolio && !r.kapasitas_portofolio) r.kapasitas_portofolio = o.kapasitas_portofolio; }
  const gagalLama = baca(path.join(OUT, 'gagal.jsonl'));
  for (const r of semua) {
    const ov = OVERRIDE[normNama(r.nama)];
    if (ov && r.situs !== ov.situs) { Object.assign(r, { situs: ov.situs, situs_keyakinan: ov.situs_keyakinan, situs_catatan: ov.situs_catatan, pengurus_status: 'belum-dibaca', verifikasi: { situs_ok: false, http: null, judul: null, tanggal_periksa: null } }); }
    if (ov?.pengurus_url) { r.pengurus_url = ov.pengurus_url; if (r.pengurus_status === 'terbaca' && !r.pengurus_v2) { r.pengurus_status = 'belum-dibaca'; r.pengurus_v2 = true; } }
    // salah-tolak robots (bug wildcard lama): ulangi
    if (r.pengurus_status === 'situs-gagal' && gagalLama.some((x) => x.perusahaan_id === r.perusahaan_id && x.alasan === 'robots-tolak')) r.pengurus_status = 'belum-dibaca';
    if (/Denera|Mahakarsa/.test(r.nama) && !r.situs && !gagalLama.some((x) => x.perusahaan_id === r.perusahaan_id)) gagal.push({ perusahaan_id: r.perusahaan_id, url: null, alasan: 'situs-resmi-tidak-ditemukan: nama tidak ada di sumber resmi yang dibaca (situs Danantara, PNRE, direktori APROBI/AESI); butuh URL dari pemilik', tanggal: HARI_INI });
  }
  const orangRows = baca(ORANG); const orangKunci = new Map();
  for (const o of orangRows) { const k = kunciNama(o.nama); orangKunci.set(k, orangKunci.has(k) ? 'ambigu' : o.orang_id); }
  let pengurus = baca(path.join(OUT, 'pengurus.jsonl'));
  for (const x of pengurus) x.jenis_jabatan = jenisJabatan(x.jabatan); // aturan klasifikasi bisa berubah; hitung ulang
  { const tanpaSitus = new Set(semua.filter((x) => !x.situs).map((x) => x.perusahaan_id)); // sisa dari situs yang dicabut (mis. situs induk salah-pasang)
    pengurus = pengurus.filter((x) => !(x.ekstraksi === 'heuristik' && tanpaSitus.has(x.perusahaan_id)));
    for (const r of semua) if (!r.situs && r.sumber_field?.kontak === 'situs') { delete r.kontak; delete r.sumber_field.kontak; delete r.sumber_field.pengurus; r.sumber = r.sumber.filter((x) => x.id !== 'situs'); } }
  const simpan = () => {
    for (const r of semua) r.sumber = r.sumber.filter((x, i, a) => a.findIndex((y) => y.id === x.id && y.url === x.url) === i);
    tulis(path.join(OUT, 'perusahaan.jsonl'), semua); tulis(path.join(OUT, 'pengurus.jsonl'), pengurus);
    const g = baca(path.join(OUT, 'gagal.jsonl')); const k = new Set(g.map((x) => x.url + x.alasan));
    for (const x of gagal) if (!k.has(x.url + x.alasan)) { g.push(x); k.add(x.url + x.alasan); }
    tulis(path.join(OUT, 'gagal.jsonl'), g);
  };
  simpan();
  for (const b of batches) {
    for (const r of semua.filter((x) => x.batch === b)) {
      if (!r.situs || r.pengurus_status !== 'belum-dibaca') continue;
      r.pengurus_status = 'dibaca-tanpa-hasil';
      const h = await ambil(r.situs, r.perusahaan_id);
      if (!h) { r.pengurus_status = 'situs-gagal'; continue; }
      const html = fs.readFileSync(h.file, 'utf8'); const t0 = teks(html);
      const ok = r.pengurus_url ? true : r.situs_keyakinan === 'sedang' ? t0.toLowerCase().replace(/\s+/g, ' ').includes(normNama(r.nama)) : t0.toLowerCase().includes(tokenNama(r.nama)); // 'sedang' = bisa situs induk: nama lengkap wajib tampil
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
      const urut = r.pengurus_url || [...cand].sort((a, b) => b[1] - a[1]).slice(0, 3).map((x) => x[0]);
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
        if (dapat >= 2 && !r.pengurus_url) break;
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
      r.pengurus_status = (dapat || sudah.size) ? 'terbaca' : 'tak-terurai';
      if (!dapat) catatGagal(r.perusahaan_id, r.situs, 'halaman-pengurus-tak-terurai:' + urut.length + '-kandidat');
      if (dapat) r.sumber_field.pengurus = 'situs';
    }
    if (b === 7) {
      const d = semua.find((x) => /Denera/.test(x.nama)); const kn = kunciNama('Fadli Rahman'); const oid = orangKunci.get(kn);
      if (d && oid && oid !== 'ambigu' && !pengurus.some((p) => p.perusahaan_id === d.perusahaan_id)) {
        pengurus.push({ pengurus_id: 'g_' + sha(d.perusahaan_id + kn + 'ceo'), perusahaan_id: d.perusahaan_id, nama: 'Fadli Rahman', jabatan: 'CEO', jenis_jabatan: 'direktur-utama', mulai: null, orang_id: oid, orang_baru: false,
          sumber_url: null, sumber_ket: 'Arsip METI: deck UKP hlm 17; Enlit Asia 2026 slide 1-11 (CEO Denera, Wakil Ketua Umum 2 METI)', tanggal_ambil: HARI_INI, tingkat_bukti: 'kata-pihak', ekstraksi: 'manual-arsip-meti', foto_url: null, foto_berkas: null, foto_sumber: null, hak_cipta: null });
        d.pengurus_status = 'terbaca-arsip'; d.sumber_field.pengurus = 'arsip-meti';
      }
    }
    simpan(); console.error(`batch ${b} tersimpan`);
  }
}


// ---------- direktori anggota asosiasi (APROBI: nama+kontak kantor+kapasitas; AESI: nama dari alt logo anggota) ----------
const rapi = (n) => n.replace(/\s+/g, ' ').trim().replace(/^pt\b/i, 'PT').replace(/\b(\w)(\w*)/g, (m, a, b) => (/^(PT|CV|TBK|PLTS|BESS|EPC)$/i.test(m) ? m.toUpperCase() : a.toUpperCase() + b.toLowerCase())).replace(/\bPt\b/, 'PT');
export function uraiAprobi(t) {
  const L = t.split('\n').map((s) => s.trim()).filter(Boolean); const out = [];
  for (let i = 0; i < L.length; i++) {
    if (!/^PT [A-Z0-9 .&-]{3,}$/.test(L[i])) continue;
    const r = { nama: rapi(L[i]), telepon: [], alamat: null, kapasitas: null, bidang: null };
    for (let j = i + 1; j < L.length && !/^PT [A-Z0-9 .&-]{3,}$/.test(L[j]); j++) {
      if (/^Work\s*:?$/i.test(L[j]) && L[j + 1]) r.telepon.push(...telepon('Telp: ' + L[j + 1].replace(/\(62-?(\d+)\)/, '(0$1)').replace(/^\+62\s*0/, '+62 ')));
      else if (/^Work Address/i.test(L[j]) && L[j + 1]) r.alamat = L[j + 1];
      else if (/^Capacity (Biodiesel|Bioethanol)/i.test(L[j])) { r.bidang = /bioethanol/i.test(L[j]) ? 'bioetanol' : 'biodiesel'; r.kapasitas = (L[j].match(/(TPY|KL)/i) || [''])[0].toUpperCase() + ' ' + (L[j + 1] || ''); }
    }
    out.push(r);
  }
  return out;
}
export function uraiAesi(html) {
  const out = new Set();
  for (const m of html.matchAll(/<img[^>]*alt="([^"]{3,70})"/gi)) { let n = dec(m[1]).replace(/\s+\d+$/, '').trim(); if (/logo|banner|icon|^img/i.test(n) || !/[a-z]/i.test(n)) continue; out.add(rapi(n)); }
  return [...out];
}
async function anggota() {
  const lama = baca(path.join(OUT, 'perusahaan.jsonl')); const peta = new Map(lama.map((r) => [normNama(r.nama), r]));
  const tambah = (nama, grup, url, extra) => {
    let r = peta.get(normNama(nama));
    if (!r) { r = { perusahaan_id: 'p_' + sha(kunciPerusahaan(nama, null)), batch: 6, nama, nama_lain: [], jenis: 'tidak-diketahui', induk: null, kepakaran: grup === 'APROBI' ? ['bioenergi'] : ['surya'], peran_rantai: grup === 'APROBI' ? ['produsen BBN'] : [], kantor_pusat: { kota: null, provinsi: null }, situs: null, tahun_berdiri: null, proyek: [], kapasitas_portofolio: null, kode_saham: null, kapasitas_mwp_tahun: null, pasar: null, apamsi: null, tkdn: null, bmp: null,
        sumber: [], sumber_field: { nama: 'anggota-' + grup, kepakaran: 'anggota-' + grup, peran_rantai: 'anggota-' + grup }, verifikasi: { situs_ok: false, http: null, judul: null, tanggal_periksa: null }, pengurus_status: 'belum-dibaca', anggota_asosiasi: [] };
      peta.set(normNama(nama), r); lama.push(r);
    }
    r.anggota_asosiasi = [...new Set([...(r.anggota_asosiasi || []), grup])];
    if (!r.sumber.some((x) => x.id === 'anggota-' + grup)) r.sumber.push({ id: 'anggota-' + grup, jenis: 'direktori-asosiasi', url, keterangan: 'halaman anggota resmi ' + grup, tanggal_periksa: HARI_INI, tingkat_bukti: 'kata-pihak' });
    if (extra) extra(r);
  };
  const A = await ambil('https://www.aprobi.or.id/about-us/members/', 'asosiasi');
  if (A) for (const x of uraiAprobi(teks(fs.readFileSync(A.file, 'utf8')))) tambah(x.nama, 'APROBI', 'https://www.aprobi.or.id/about-us/members/', (r) => {
    if (x.kapasitas && !r.kapasitas_portofolio) r.kapasitas_portofolio = `kapasitas ${x.bidang} ${x.kapasitas.trim()} (anggota APROBI)`; r.sumber_field.kapasitas_portofolio = 'anggota-APROBI';
    if (!r.kontak && (x.telepon.length || x.alamat)) { r.kontak = { alamat_kantor: x.alamat, kota: r.kantor_pusat.kota, provinsi: r.kantor_pusat.provinsi, kode_pos: (x.alamat || '').match(/\b([1-9]\d{4})\b/)?.[1] || null, telepon: x.telepon, surel: [], situs: r.situs, lat: null, lng: null, lat_lng_sumber: null, sumber_url: 'https://www.aprobi.or.id/about-us/members/', tanggal_ambil: HARI_INI, tingkat_bukti: 'kata-pihak' }; r.sumber_field.kontak = 'anggota-APROBI'; } });
  const S = await ambil('https://aesi.or.id/anggota/', 'asosiasi');
  if (S) for (const n of uraiAesi(fs.readFileSync(S.file, 'utf8'))) tambah(n, 'AESI', 'https://aesi.or.id/anggota/');
  tulis(path.join(OUT, 'perusahaan.jsonl'), lama);
  const g = baca(path.join(OUT, 'gagal.jsonl')); for (const x of gagal) g.push(x); tulis(path.join(OUT, 'gagal.jsonl'), g);
  console.log(JSON.stringify({ total: lama.length, aprobi: lama.filter((r) => r.anggota_asosiasi?.includes('APROBI')).length, aesi: lama.filter((r) => r.anggota_asosiasi?.includes('AESI')).length }));
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
  const K = uraiPengurus('Komisaris\nJajaran Komisaris\nHavidh Nazif\nKomisaris\nLihat profil\nReni Mayerni\nKomisaris Independen\nDireksi\nJohn Anis\nDirektur Utama');
  assert.deepEqual(K.map((x) => x.nama), ['Havidh Nazif', 'Reni Mayerni', 'John Anis']);
  assert.equal(jenisJabatan('Managing Director, Finance'), 'direktur'); assert.equal(jenisJabatan('Chief Executive Officer'), 'direktur-utama');
  const C = uraiPengurus('Budi Santoso - Direktur Utama\nSiti Rahma | Direktur SDM'); assert.equal(C.length, 2);
  const html = '<div><img src="/u/budi.jpg"><h3>Budi Santoso</h3><p>Direktur Utama</p></div><div><img src="/u/siti.jpg"><h3>Siti Rahma</h3></div><img src="/logo.png"><img src="https://evil.com/x.jpg">';
  assert.deepEqual(fotoKandidat(html, ['Budi Santoso', 'Siti Rahma'], 'https://www.example.org/direksi'), ['https://www.example.org/u/budi.jpg', 'https://www.example.org/u/siti.jpg']);
  assert.equal(fotoKandidat('<img src="/u/a.jpg"><b>Budi Santoso</b><b>Siti Rahma</b>', ['Budi Santoso', 'Siti Rahma'], 'https://x.id/')[1], null); // gambar bersama dibuang
  assert.deepEqual(surelUmum('hubungi info@example.org atau budi.santoso@example.org'), ['info@example.org']);
  assert.deepEqual(telepon('Telp: (021) 0000 0000'), ['+622100000000']);
  assert.deepEqual(telepon('Telepon HP: 0812 3456 7890'), []);
  assert.equal(alamat('Alamat\nJl. Medan Merdeka Selatan No. 9, Jakarta 10110').kode_pos, '10110');
  assert.deepEqual(koordinat('x !2d106.8273!3d-6.1754 y'), { lat: -6.1754, lng: 106.8273 });
  assert.equal(uraiAprobi('Members\nPT CONTOH BIODIESEL\nWork :\n+62 21 0000 0000\nWork Address :\nJl. Contoh No. 1, Jakarta 10110\nCapacity Biodiesel TPY:\n100,000')[0].telepon[0], '+622100000000');
  assert.deepEqual(uraiAesi('<img alt="Pt Contoh Surya"><img alt="AESI_Logo_White"><img alt="Bti 1">'), ['PT Contoh Surya', 'Bti']);
  const r = bangunRekaman(); assert(r.length > 100); assert(new Set(r.map((x) => x.perusahaan_id)).size === r.length);
  assert.equal(r.filter((x) => x.kapasitas_mwp_tahun !== null || x.pasar).length, 40);
  assert(r.every((x) => ['bumn', 'swasta', 'asing', 'patungan', 'koperasi', 'tbk', 'tidak-diketahui'].includes(x.jenis)));
  console.log('selftest ok,', r.length, 'perusahaan benih');
}

const arg = (n) => (process.argv.find((a) => a.startsWith(`--${n}`)) || '').split('=').slice(1).join('=');
if (process.argv.includes('--selftest')) selftest();
else if (process.argv.some((a) => a.startsWith('--jalan'))) { const b = arg('jalan'); await jalan(b ? b.split(',').map(Number) : [1, 2, 3, 4, 5]); }
else if (arg('cari')) { // --cari=URL,URL --kata=a,b : unduh (robots, jeda) lalu cetak konteks kata + tautan yang cocok
  const ks = (arg('kata') || '').split(',').filter(Boolean).map((k) => k.toLowerCase());
  for (const u of arg('cari').split(',')) { const h = await ambil(u, 'cari'); if (!h) { console.log('GAGAL', u, JSON.stringify(gagal.at(-1))); continue; }
    const html = fs.readFileSync(h.file, 'utf8'), t = teks(html), low = t.toLowerCase(); console.log('###', u, t.length);
    for (const k of ks) { let i = low.indexOf(k); let n = 0; while (i >= 0 && n++ < 3) { console.log('  [' + k + ']', t.slice(Math.max(0, i - 120), i + 200).replace(/\n/g, ' | ')); i = low.indexOf(k, i + 400); } }
    for (const m of html.matchAll(/<a\s[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi)) { const x = teks(m[2]).replace(/\n/g, ' ') + ' ' + m[1]; if (ks.some((k) => x.toLowerCase().includes(k)) || /(direksi|board|manajemen|leadership|kontak|contact|tentang|about)/i.test(x)) console.log('  link:', x.slice(0, 110)); } } }
else if (process.argv.includes('--anggota')) await anggota();
else if (process.argv.includes('--statistik')) statistik();
else console.log('lihat komentar di kepala berkas');
