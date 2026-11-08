// Katalog portal data terbuka: membaca meta tiap public/data/**/*.json dan menulis public/data/katalog_data.json.
// Judul, deskripsi, jumlah baris, sumber, tanggal bangun, lisensi, halaman pemakai, jalur CSV (array datar). Tanpa data pribadi:
// berkas berisi kontak (surel/telepon) atau akun dikecualikan, dan bila daftar tolak lokal ada (data-panen/orang/daftar-tolak-calon.jsonl)
// berkas yang memuat nama di daftar itu ikut dikecualikan. Pakai: node scripts/pipa/katalog_data.mjs [--tanggal=YYYY-MM-DD]
import fs from 'node:fs';
import path from 'node:path';

const AKAR = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const DATA = path.join(AKAR, 'public/data'), PUB = path.join(AKAR, 'public');
const TANGGAL = (process.argv.find((a) => a.startsWith('--tanggal=')) || '--tanggal=2026-11-08').slice(10);
const DIRI = 'katalog_data.json';

export const TEMA = [
  { id: 'listrik', ikon: 'tek-listrik', re: /listrik|sistem_pln|statistik_pln|ember|akses_energi|kelistrikan|desa_|gardu|transmisi|jaringan|ruptl|keandalan|captive|dedieselisasi|kinerja_pembangkit/ },
  { id: 'pembangkit', ikon: 'tek-surya', re: /rued|tkdn|energi_baru|transisi|air_energi|surya|plts|bayu|hidro|panas|bio|pltu|gem|gppd|pembangkit|proyek|psel|psn|sampah|hidrogen|nuklir|penyimpanan|teknologi|kapasitas|potensi|hilirisasi|amdal|inovasi|paten|dagang_komponen|harga_komponen|benchmark/ },
  { id: 'karbon', ikon: 'karbon', re: /karbon|emisi|iklim|komitmen|integritas|jetp/ },
  { id: 'keuangan', ikon: 'kartu', re: /keuangan|pendanaan|obligasi|insentif|biaya|harga|hibah|pasar|pajak|investasi|keberlanjutan_dana/ },
  { id: 'regulasi', ikon: 'regulasi', re: /hukum|dpr_|taksonomi|target|regulasi|izin|perizinan|kebijakan|peraturan|target_realisasi|paket_pemda/ },
  { id: 'wilayah', ikon: 'peta', re: /^wilayah|^geo|peta|kawasan|lahan|provinsi|asean|global|negara|radar_kabupaten|neraca|lokasi|risiko/ },
  { id: 'pelaku', ikon: 'orang', re: /orang|organisasi|pakar|pengurus|anggota|mitra|korporat|rantai|kampus|penyedia|pemangku|pusat_studi|lembaga|kerja|prodi|konsultasi|keanggotaan/ },
  { id: 'pengetahuan', ikon: 'buku', re: /istilah|pustaka|riset|dokumen|topik|berita|galeri|kalender|podcast|event|libur|angka|indeks|cari|metode|kuadran|rapor|riwayat|teks_|aset|dataset|sumber/ },
];
const temaDari = (rel) => (TEMA.find((t) => t.re.test(rel.toLowerCase())) || { id: 'lainnya', ikon: 'tabel' }).id;
export const IKON_TEMA = Object.fromEntries([...TEMA.map((t) => [t.id, t.ikon]), ['lainnya', 'tabel']]);

const KUNCI_KONTAK = /^(surel|email|e_mail|telepon|telp|hp|whatsapp|wa|kontak|nik|nip|sandi|password|token|akun)$/i;
const POLA_KONTAK = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+\.[a-z]{2,}|(?<![\d.])(?:\+62|08)\d{8,11}(?!\d)/;

function jalanBerkas(d, hasil = []) {
  for (const n of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, n.name);
    if (n.isDirectory()) jalanBerkas(p, hasil); else if (n.name.endsWith('.json')) hasil.push(p);
  }
  return hasil.sort();
}
const adaKunciKontak = (x, dalam = 0) => {
  if (!x || typeof x !== 'object' || dalam > 6) return false;
  if (Array.isArray(x)) return x.slice(0, 400).some((e) => adaKunciKontak(e, dalam + 1));
  return Object.entries(x).some(([k, v]) => (KUNCI_KONTAK.test(k) && v != null && v !== '' && !(Array.isArray(v) && !v.length)) || adaKunciKontak(v, dalam + 1));
};
const kunciNama = (s) => String(s || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
function daftarTolak() {
  const f = path.join(AKAR, 'data-panen/orang/daftar-tolak-calon.jsonl');
  if (!fs.existsSync(f)) return null;
  return new Set(fs.readFileSync(f, 'utf-8').split('\n').filter(Boolean).map((g) => { try { return kunciNama(JSON.parse(g).nama); } catch { return ''; } }).filter((k) => k.split(' ').length >= 2));
}
function memuatNamaTolak(teks, tolak) {
  if (!tolak?.size) return false;
  const bersih = ' ' + kunciNama(teks.replace(/\\u[0-9a-f]{4}/gi, ' ')) + ' ';
  for (const k of tolak) if (bersih.includes(' ' + k + ' ')) return true;
  return false;
}

const bi = (v) => (v && typeof v === 'object' && !Array.isArray(v) && (v.id || v.en) ? { id: v.id ?? v.en, en: v.en ?? v.id } : typeof v === 'string' && v.trim() ? { id: v.trim(), en: v.trim() } : null);
const potong = (s, n = 190) => {
  const t = s.replace(/\s+/g, ' ').trim();
  if (t.length <= n) return t;
  const k = t.slice(0, n), i = Math.max(k.lastIndexOf('. '), k.lastIndexOf('; '));
  return (i > 80 ? k.slice(0, i + 1) : k.slice(0, k.lastIndexOf(' '))).replace(/[,;:\s]+$/, '') + (i > 80 ? '' : '...');
};
const manusia = (rel) => {
  const s = path.basename(rel, '.json').replace(/[_-]+/g, ' ').trim();
  const dir = path.dirname(rel) === '.' ? '' : path.dirname(rel).replace(/[_/-]+/g, ' ') + ': ';
  const j = dir + s;
  return j.charAt(0).toUpperCase() + j.slice(1);
};
const TGL = /^\d{4}-\d\d-\d\d/;

function barisDari(d) {
  if (Array.isArray(d)) return { jalur: '', baris: d };
  if (!d || typeof d !== 'object') return { jalur: null, baris: [] };
  if (Array.isArray(d.baris)) return { jalur: 'baris', baris: d.baris };
  let terbaik = null;
  for (const [k, v] of Object.entries(d)) if (Array.isArray(v) && (!terbaik || v.length > terbaik.baris.length)) terbaik = { jalur: k, baris: v };
  if (terbaik && terbaik.baris.length) return terbaik;
  const nilai = Object.values(d);
  if (nilai.length > 3 && nilai.every((v) => v && typeof v === 'object' && !Array.isArray(v))) return { jalur: null, baris: nilai, kamus: true };
  return { jalur: null, baris: [] };
}
const skalar = (v) => v == null || ['string', 'number', 'boolean'].includes(typeof v) || (Array.isArray(v) && v.every((e) => e == null || typeof e !== 'object'));
function datar(baris) {
  const s = baris.slice(0, 60);
  if (!s.length || !s.every((r) => r && typeof r === 'object' && !Array.isArray(r))) return null;
  const kolom = new Set(); let tot = 0, ok = 0;
  for (const r of s) for (const [k, v] of Object.entries(r)) { tot++; if (skalar(v)) { ok++; kolom.add(k); } }
  return tot && ok / tot >= 0.6 && kolom.size ? true : null;
}
function sumberDari(d) {
  const m = d && typeof d === 'object' && !Array.isArray(d) ? d : {};
  const calon = m.sumber ?? m.meta?.sumber ?? m.sumber_data;
  let nama = null, url = null;
  const ambil = (o) => {
    if (typeof o === 'string') nama ||= o;
    else if (o && typeof o === 'object' && !Array.isArray(o)) {
      if (['penerbit', 'judul', 'nama', 'sumber', 'url'].some((k) => k in o)) { nama ||= o.penerbit || o.judul || o.nama || o.sumber || null; url ||= o.url || o.sumber_url || null; }
      else { const v = Object.values(o).find((x) => x && typeof x === 'object' && (x.penerbit || x.judul)); if (v) { nama ||= v.penerbit || v.judul; url ||= v.url || null; } } // kamus sumber: ambil yang pertama
    }
  };
  if (Array.isArray(calon)) calon.slice(0, 3).forEach(ambil); else ambil(calon);
  url ||= m.url || m.sumber_url || m.meta?.url || null;
  if (typeof nama !== 'string') nama = null;
  return { nama: nama ? potong(nama, 140) : null, url: typeof url === 'string' && /^https:\/\//.test(url) ? url : null };
}

/* ---- halaman pemakai: skrip tiap .html + impor statis transitif, lalu cari rujukan berkas data ---- */
function petaPemakai(semua) {
  const jsIsi = new Map();
  const baca = (rel) => jsIsi.get(rel) ?? (jsIsi.set(rel, fs.existsSync(path.join(PUB, rel)) ? fs.readFileSync(path.join(PUB, rel), 'utf-8') : ''), jsIsi.get(rel));
  const impor = (rel, lihat = new Set()) => {
    if (lihat.has(rel)) return lihat;
    lihat.add(rel);
    for (const m of baca(rel).matchAll(/(?:from|import)\s*\(?\s*["'](\/[^"']+\.js)["']/g)) impor(m[1].slice(1), lihat);
    return lihat;
  };
  const set = new Map(semua.map((r) => [r, new Set()]));
  const prefix = (dir) => semua.filter((r) => r.startsWith(dir + '/'));
  for (const h of fs.readdirSync(PUB).filter((n) => n.endsWith('.html') && !/^(404|admin)\.html$/.test(n))) {
    const stem = h.slice(0, -5), html = fs.readFileSync(path.join(PUB, h), 'utf-8');
    const js = new Set();
    for (const m of html.matchAll(/<script[^>]+src="\/([^"?#]+\.js)"/g)) impor(m[1], js);
    for (const f of js) {
      const s = baca(f);
      for (const m of s.matchAll(/\/data\/([\w\-/]+\.json)/g)) set.get(m[1])?.add(stem);
      for (const m of s.matchAll(/muatData\(\s*["'`]([\w\-/]+)["'`]/g)) set.get(m[1] + '.json')?.add(stem);
      for (const m of s.matchAll(/muatTeks\(\s*["'`]([\w\-]+)["'`]/g)) set.get('teks_' + m[1] + '.json')?.add(stem);
      for (const m of s.matchAll(/\/data\/([\w\-/]+)\/\$\{/g)) for (const r of prefix(m[1])) set.get(r).add(stem);
    }
  }
  return set;
}

export function bangun() {
  const semuaAbs = jalanBerkas(DATA).filter((p) => path.relative(DATA, p) !== DIRI);
  const rels = semuaAbs.map((p) => path.relative(DATA, p));
  const pemakai = petaPemakai(rels);
  const tolak = daftarTolak();
  const berkas = [], dikecualikan = [];
  for (const [i, abs] of semuaAbs.entries()) {
    const rel = rels[i], teks = fs.readFileSync(abs, 'utf-8');
    let d;
    try { d = JSON.parse(teks); } catch { dikecualikan.push({ berkas: rel, alasan: 'bukan-json' }); continue; }
    if (adaKunciKontak(d) || POLA_KONTAK.test(teks)) { dikecualikan.push({ berkas: rel, alasan: 'kontak-atau-akun' }); continue; }
    if (rel.startsWith('pribadi/')) { dikecualikan.push({ berkas: rel, alasan: 'pribadi' }); continue; }
    if (memuatNamaTolak(teks, tolak)) { dikecualikan.push({ berkas: rel, alasan: 'daftar-tolak' }); continue; }
    const m = d && typeof d === 'object' && !Array.isArray(d) ? d : {};
    const { jalur, baris, kamus } = barisDari(d);
    const csv = jalur != null && datar(baris) ? jalur : null;
    const tgl = [m.dibangun_pada, m.diperbarui, m.tanggal_ambil, m.meta?.dibangun_pada, m.meta?.diperbarui, m.meta?.tanggal_ambil, m.sumber?.diambil, m.sumber?.tanggal_ambil].find((x) => typeof x === 'string' && TGL.test(x));
    const lis = m.lisensi ?? m.meta?.lisensi ?? m.sumber?.lisensi;
    const layak = (v) => { const b = bi(v); return b && b.id.length >= 40 && !/[a-z]_[a-z]|\s=\s/.test(b.id) ? b : null; };
    const asli = layak(m.deskripsi) || layak(m.lead) || layak(m.meta?.deskripsi) || layak(m.catatan) || layak(m.metode) || layak(m.meta?.catatan);
    const kolom = baris.length && baris[0] && typeof baris[0] === 'object' && !Array.isArray(baris[0]) ? Object.keys(baris[0]).slice(0, 6) : [];
    const tema = temaDari(rel), n = baris.length;
    const jdl = bi(m.judul) || bi(m.meta?.judul) || (typeof m.nama === 'string' && m.nama ? { id: manusia(path.dirname(rel) === '.' ? rel : path.dirname(rel) + '/x').replace(/x$/, '') + m.nama, en: manusia(path.dirname(rel) === '.' ? rel : path.dirname(rel) + '/x').replace(/x$/, '') + m.nama } : null);
    berkas.push({
      berkas: rel, tema,
      judul: jdl ? { id: potong(jdl.id, 90), en: potong(jdl.en, 90) } : { id: manusia(rel), en: manusia(rel) },
      deskripsi: asli ? { id: potong(asli.id), en: potong(asli.en) } : { id: n ? `Berkas data ${n} baris${kolom.length ? ', kolom ' + kolom.join(', ') : ''}.` : 'Berkas data terstruktur (objek).', en: n ? `Data file with ${n} rows${kolom.length ? ', columns ' + kolom.join(', ') : ''}.` : 'Structured data file (object).' },
      deskripsi_asli: !!asli,
      baris: kamus ? n : n || null, csv,
      ukuran: Buffer.byteLength(teks),
      sumber: sumberDari(d),
      dibangun: tgl ? tgl.slice(0, 10) : null,
      lisensi: typeof lis === 'string' ? potong(lis, 120) : null,
      halaman: [...pemakai.get(rel)].sort(),
    });
  }
  return {
    lapis: 'katalog_data', dibangun_pada: TANGGAL,
    jumlah: berkas.length, jumlah_dikecualikan: dikecualikan.length,
    daftar_tolak_diperiksa: !!tolak,
    tema: TEMA.map((t) => ({ id: t.id, ikon: t.ikon })).concat([{ id: 'lainnya', ikon: 'tabel' }]),
    kebijakan: {
      id: 'Berkas yang memuat surel, telepon, atau akun dikecualikan. Bila daftar tolak lokal tersedia, berkas yang memuat nama di dalamnya juga dikecualikan. Lisensi kosong berarti sumber tidak menyatakannya di berkas; ikuti ketentuan sumber asli.',
      en: 'Files containing emails, phone numbers or accounts are excluded. When the local deny list is available, files containing a listed name are excluded too. An empty licence means the source states none in the file; follow the original source terms.',
    },
    dikecualikan,
    berkas,
  };
}

export function periksa(o) {
  const g = [];
  const u = new Set(o.berkas.map((b) => b.berkas));
  if (u.size !== o.berkas.length) g.push('berkas ganda');
  if (u.has(DIRI)) g.push('katalog memuat dirinya');
  for (const b of o.berkas) { if (!b.judul.id || !b.deskripsi.id) g.push('kosong ' + b.berkas); if (b.sumber.url && !/^https:\/\//.test(b.sumber.url)) g.push('url ' + b.berkas); }
  if (JSON.stringify(o).includes('—')) g.push('em dash');
  const s = JSON.stringify(o.berkas);
  if (POLA_KONTAK.test(s)) g.push('kontak di katalog');
  return g;
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const o = bangun(), g = periksa(o);
  if (g.length) { console.error(g.slice(0, 20).join('\n')); process.exit(1); }
  fs.writeFileSync(path.join(DATA, DIRI), JSON.stringify(o) + '\n');
  console.log(`katalog_data: ${o.jumlah} berkas, ${o.jumlah_dikecualikan} dikecualikan, daftar tolak ${o.daftar_tolak_diperiksa ? 'diperiksa' : 'tidak ada'}`);
}
