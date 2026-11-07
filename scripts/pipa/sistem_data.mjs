// public/data/sistem_data.json: katalog sistem data energi terbarukan Indonesia dan global.
//   node scripts/pipa/sistem_data.mjs periksa <tgl>   (jaringan; robots.txt per host, jeda >= 2 dtk, 403/429 = berhenti untuk host itu)
//   node scripts/pipa/sistem_data.mjs bangun <tgl>    (tanpa jaringan; data/sistem_data/kurasi.json + periksa.json -> public/data/sistem_data.json)
// Isi kurasi dari pengetahuan sumber; `periksa` hanya mencatat apakah halaman resmi terjangkau dan robots.txt-nya.
// `diverifikasi` sengaja kosong: isi belum dicocokkan baris demi baris ke halaman sumber (tampilan menulisnya terang).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const UA = 'METI-Network-research/0.1 (+https://platformmeti.timitbnpb.workers.dev)';
export const AKSES = ['terbuka', 'api-terbuka', 'api-kunci', 'login', 'permohonan', 'tertutup'];
export const SEKTOR = ['surya', 'bayu', 'hidro', 'panas-bumi', 'bioenergi', 'biomassa-sampah', 'nuklir', 'hidrogen', 'laut', 'penyimpanan', 'jaringan', 'efisiensi', 'elektrifikasi', 'karbon', 'pembiayaan', 'kebijakan', 'industri', 'transisi-adil', 'riset-data'];
const jeda = (ms) => new Promise((r) => setTimeout(r, ms));
const KAPITAL = /\b[A-Z]{6,}\b/;

// robots.txt: true bila agen kita boleh membuka "/" (Disallow: / pada User-agent * atau METI = dilarang).
export function robotsMelarang(txt) {
  let cocok = false, melarang = false;
  for (const g of String(txt || '').split(/\r?\n\s*\r?\n/)) {
    const ag = [...g.matchAll(/^user-agent:\s*(.+)$/gim)].map((m) => m[1].trim().toLowerCase());
    if (!ag.some((a) => a === '*' || UA.toLowerCase().startsWith(a))) continue;
    cocok = true;
    const dis = [...g.matchAll(/^disallow:\s*(.*)$/gim)].map((m) => m[1].trim());
    const alw = [...g.matchAll(/^allow:\s*(.*)$/gim)].map((m) => m[1].trim());
    if (dis.includes('/') && !alw.includes('/')) melarang = true;
  }
  return cocok && melarang;
}

export function periksa(b) {
  const g = [];
  for (const f of ['id', 'nama', 'pemilik', 'uraian', 'portal_url', 'akses', 'lisensi', 'frekuensi', 'cakupan']) if (!b[f]) g.push(`${b.id}: ${f} kosong`);
  if (!AKSES.includes(b.akses)) g.push(`${b.id}: akses`);
  if (!Array.isArray(b.sektor) || !b.sektor.length || b.sektor.some((s) => !SEKTOR.includes(s))) g.push(`${b.id}: sektor`);
  if (!Array.isArray(b.format) || !b.format.length) g.push(`${b.id}: format`);
  if (!Array.isArray(b.jenis_data) || !b.jenis_data.length) g.push(`${b.id}: jenis_data`);
  for (const u of [b.portal_url, b.api_url, b.sumber_url].filter(Boolean)) if (!/^https:\/\//.test(u)) g.push(`${b.id}: url bukan https`);
  if (!b.sumber_url || !b.tanggal_periksa || !b.tingkat_bukti) g.push(`${b.id}: sumber_url/tanggal_periksa/tingkat_bukti`);
  if (/[—–]/.test(JSON.stringify(b))) g.push(`${b.id}: em dash`);
  if (KAPITAL.test(`${b.uraian} ${b.cara_minta}`.replace(/SPARQL/g, ''))) g.push(`${b.id}: KAPITAL penuh`);
  if (/[\w.+-]+@[\w-]+\.\w+/.test(JSON.stringify(b))) g.push(`${b.id}: data pribadi`);
  if (b.akses === 'tertutup' && b.api_url) g.push(`${b.id}: tertutup tetapi punya api_url`);
  return g;
}

const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

// org: nama atau singkatan persis (setelah normalisasi) di organisasi.json; tidak cocok = null (logo jatuh ke ikon).
export function cariOrg(nama, orgs) {
  const k = norm(nama);
  const o = orgs.find((x) => norm(x.nama) === k) || orgs.find((x) => x.singkatan && norm(x.singkatan) === k);
  return o ? o.id : null;
}

// Fakta dari penelusuran laman resmi (telusuri.mjs): hanya yang terbaca di laman, tiap butir dengan URL bukti.
export function terapkanTelusur(b, t) {
  if (!t) return b;
  if (!t.terjangkau) { b.catatan_periksa = t.catatan || 'tidak dapat diperiksa'; b.butuh_pemilik = true; return b; }
  const bukti = {}, ver = new Set(b.diverifikasi || []), url = t.url_akhir || b.portal_url;
  b.status = 'hidup'; b.diperiksa = t.tanggal;
  if (t.nama_cocok) { ver.add('nama'); ver.add('portal_url'); bukti.nama = url; bukti.portal_url = url; }
  if (t.lisensi) {
    if (/tidak dinyatakan/i.test(b.lisensi)) { b.lisensi = `${t.lisensi} (tertulis di laman portal)`; ver.add('lisensi'); bukti.lisensi = url; }
    else if (norm(b.lisensi).includes(norm(t.lisensi).split(' ').slice(0, 2).join(' '))) { ver.add('lisensi'); bukti.lisensi = url; }
  }
  if (t.api && /^https:/.test(t.api) && b.akses !== 'tertutup') { if (!b.api_url) b.api_url = t.api; if (b.api_url === t.api) { ver.add('api_url'); bukti.api_url = url; } }
  if (t.unduhan?.length) { b.unduhan = t.unduhan.map((u) => ({ label: u.label.replace(/[—–]/g, '-').slice(0, 60), url: u.url })); bukti.unduhan = url; }
  if (t.kontak && /contact|kontak|hubungi/i.test(new URL(t.kontak).pathname)) { b.kontak = { url: t.kontak, teks: 'Halaman kontak resmi' }; bukti.kontak = t.kontak; }
  b.diverifikasi = [...ver]; if (Object.keys(bukti).length) b.bukti = bukti;
  return b;
}

export function ubah(r, orgs, tgl, cek = {}, telusur = {}) {
  const c = cek[r.id] || {};
  const b = {
    id: r.id, nama: r.nama, kepanjangan: r.kep || undefined, pemilik: r.pemilik, lembaga_id: cariOrg(r.org || r.pemilik, orgs),
    uraian: r.uraian, sektor: r.sektor, jenis_data: r.jenis, cakupan: r.cakupan, cakupan_internasional: !!r.intl, frekuensi: r.frek,
    format: r.format, lisensi: r.lisensi, akses: r.akses, portal_url: r.portal, api_url: r.api || undefined, cara_minta: r.cara,
    ...(r.contoh ? { contoh_ebt: r.contoh } : {}), dipakai_pantau: !!r.pakai, status: c.terjangkau ? 'hidup' : undefined, robots: c.robots || undefined,
    diperiksa: c.terjangkau ? c.tanggal : undefined, diverifikasi: [],
    sumber: [{ url: r.portal, tanggal: tgl }], sumber_url: r.portal, tanggal_periksa: tgl, tingkat_bukti: 'kata-pihak',
  };
  terapkanTelusur(b, telusur[r.id]);
  for (const k of Object.keys(b)) if (b[k] === undefined) delete b[k];
  return b;
}

async function ambilTeks(u) {
  const r = await fetch(u, { headers: { 'user-agent': UA }, redirect: 'follow', signal: AbortSignal.timeout(20000) }).catch(() => null);
  if (!r) return { status: 0, teks: '' };
  const teks = r.status === 200 ? (await r.text().catch(() => '')).slice(0, 20000) : '';
  return { status: r.status, teks };
}

async function periksaJaringan(tgl) {
  const kur = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/sistem_data/kurasi.json'), 'utf8'));
  const robots = new Map(), henti = new Set(), hasil = {};
  for (const r of kur) {
    const u = new URL(r.portal), host = u.host;
    if (henti.has(host)) { hasil[r.id] = { terjangkau: false, robots: 'berhenti', tanggal: tgl }; continue; }
    if (!robots.has(host)) { await jeda(2100); const { status, teks } = await ambilTeks(`${u.origin}/robots.txt`); robots.set(host, status === 200 && robotsMelarang(teks) ? 'melarang' : status === 200 ? 'boleh' : 'tidak ada'); }
    if (robots.get(host) === 'melarang') { hasil[r.id] = { terjangkau: false, robots: 'melarang', tanggal: tgl }; console.log('robots melarang', r.id); continue; }
    await jeda(2100);
    const { status } = await ambilTeks(r.portal);
    if (status === 403 || status === 429) { henti.add(host); console.log('BERHENTI', host, status); }
    hasil[r.id] = { terjangkau: status >= 200 && status < 400, http: status, robots: robots.get(host), tanggal: tgl };
    console.log(r.id, status);
  }
  fs.writeFileSync(path.join(ROOT, 'data/sistem_data/periksa.json'), JSON.stringify(hasil, null, 1) + '\n', 'utf8');
}

function bangun(tgl) {
  const orgs = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/organisasi.json'), 'utf8')).baris;
  const kur = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/sistem_data/kurasi.json'), 'utf8'));
  const pf = path.join(ROOT, 'data/sistem_data/periksa.json');
  const cek = fs.existsSync(pf) ? JSON.parse(fs.readFileSync(pf, 'utf8')) : {};
  const tf = path.join(ROOT, 'data/sistem_data/telusur.json');
  const tel = fs.existsSync(tf) ? JSON.parse(fs.readFileSync(tf, 'utf8')) : {};
  const baris = kur.map((r) => ubah(r, orgs, tgl, cek, tel)).sort((a, b) => a.id.localeCompare(b.id));
  const gal = baris.flatMap(periksa);
  if (new Set(baris.map((b) => b.id)).size !== baris.length) gal.push('id ganda');
  if (gal.length) { console.error(gal.join('\n')); process.exit(1); }
  fs.writeFileSync(path.join(ROOT, 'public/data/sistem_data.json'), JSON.stringify({ lapis: 'publik', dibangun_pada: tgl, jumlah: baris.length, sistem: baris }) + '\n', 'utf8');
  const per = {}; baris.forEach((b) => (per[b.akses] = (per[b.akses] || 0) + 1));
  console.log(baris.length, per);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [, , cmd, tgl] = process.argv;
  if (!/^\d{4}-\d\d-\d\d$/.test(tgl || '')) { console.log('periksa <tgl> | bangun <tgl>'); process.exit(1); }
  if (cmd === 'periksa') await periksaJaringan(tgl); else if (cmd === 'bangun') bangun(tgl);
}
