// public/data/inovasi.json: direktori inovasi energi terbarukan Indonesia.
//   node scripts/pipa/inovasi.mjs ambil <dirMentah>        (jaringan; WP REST pencarian kampus, robots Allow, jeda >= 2 dtk, berhenti 403/429)
//   node scripts/pipa/inovasi.mjs bangun <tgl>             (tanpa jaringan; data/inovasi/kurasi.json + public/data/tkdn.json -> public/data/inovasi.json)
// Sumber: halaman publik kampus (ITS, UNDIP, IPB, PENS), sertifikat TKDN (tkdn.json), berita.json. TANPA 1001startup (C-13).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const UA = 'METI-Network-research/0.1 (+https://platformmeti.timitbnpb.workers.dev)';
export const JENIS = ['produk', 'alat', 'sistem', 'material', 'proses', 'layanan'];
export const STATUS = ['purwarupa', 'uji lapangan', 'terpasang', 'dikomersialkan', 'berhenti'];
export const SEKTOR = ['surya', 'bayu', 'hidro', 'panas-bumi', 'bioenergi', 'biomassa-sampah', 'nuklir', 'hidrogen', 'laut', 'penyimpanan', 'jaringan', 'efisiensi', 'elektrifikasi'];
const HOSTS = ['www.its.ac.id', 'undip.ac.id', 'www.ipb.ac.id', 'www.pens.ac.id'];
const KATA = ['turbin angin', 'PLTS', 'pikohidro', 'mikrohidro', 'biomassa', 'biogas', 'baterai lithium', 'hidrogen', 'gasifikasi', 'panas bumi', 'gelombang laut', 'arus laut', 'PLTS terapung', 'konversi motor listrik', 'inovasi energi terbarukan', 'bioetanol', 'biodiesel', 'pengering surya', 'sel surya', 'kompor biomassa', 'sampah menjadi energi', 'smart grid', 'prototipe energi', 'kincir air', 'mobil listrik', 'bioavtur', 'pirolisis', 'penyimpanan energi'];
const jeda = (ms) => new Promise((r) => setTimeout(r, ms));
const tanpaTag = (h) => String(h || '').replace(/<[^>]+>/g, ' ').replace(/&#8217;|&#039;/g, "'").replace(/&#8211;|&#8212;/g, '-').replace(/&amp;/g, '&').replace(/&hellip;|\[&hellip;\]/g, '').replace(/\s+/g, ' ').trim();

async function ambil(dir) {
  fs.mkdirSync(dir, { recursive: true });
  const hasil = {};
  for (const h of HOSTS) {
    const rb = await fetch(`https://${h}/robots.txt`, { headers: { 'user-agent': UA } }).then((r) => r.text()).catch(() => '');
    if (/Disallow:\s*\/wp-json/i.test(rb)) { console.log('robots melarang wp-json:', h); continue; }
    for (const k of KATA) {
      await jeda(2100);
      const u = `https://${h}/wp-json/wp/v2/posts?search=${encodeURIComponent(k)}&per_page=10&_fields=link,title,date,excerpt`;
      const r = await fetch(u, { headers: { 'user-agent': UA } }).catch(() => null);
      if (!r) continue;
      if (r.status === 403 || r.status === 429) { console.log('BERHENTI', h, r.status); break; }
      if (!r.ok) continue;
      for (const p of await r.json().catch(() => [])) (hasil[p.link] ||= { url: p.link, host: h, judul: tanpaTag(p.title?.rendered), tanggal: String(p.date || '').slice(0, 10), kutipan: tanpaTag(p.excerpt?.rendered), kata: [] }).kata.push(k);
    }
  }
  fs.writeFileSync(path.join(dir, 'kampus.json'), JSON.stringify(Object.values(hasil), null, 1));
  console.log('tulis', Object.keys(hasil).length);
}

// Perinci: baca halaman sumber tiap inovasi kampus (robots dicek, jeda >= 2 dtk, berhenti 403/429), simpan teks + og:image ke <dir>/rinci.json.
// Isi rinci (ringkasan, masalah, cara kerja, spesifikasi, tonggak, tim, mitra, pendana, lokasi, foto) disusun dari teks itu ke data/inovasi/rinci.json, lalu `bangun` menggabungkan.
async function ambilRinci(dir) {
  fs.mkdirSync(dir, { recursive: true });
  const kur = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/inovasi/kurasi.json'), 'utf8')), robots = {}, hasil = {};
  for (const b of kur) for (const sm of b.sumber) {
    const h = new URL(sm.url).host;
    if (!(h in robots)) { robots[h] = await fetch(`https://${h}/robots.txt`, { headers: { 'user-agent': UA } }).then((r) => r.text()).catch(() => ''); await jeda(2100); }
    const cek = /User-agent:\s*\*([\s\S]*?)(?:\n\s*\n|$)/i.exec(robots[h])?.[1] || '';
    if (cek.split('\n').some((l) => /^Disallow:\s*\/\s*$/i.test(l.trim()))) { console.log('robots melarang', h); continue; }
    const r = await fetch(sm.url, { headers: { 'user-agent': UA } }).catch(() => null); await jeda(2100);
    if (!r) continue;
    if (r.status === 403 || r.status === 429) { console.log('BERHENTI', h, r.status); break; }
    if (!r.ok) { console.log(r.status, sm.url); continue; }
    const html = await r.text(), m = (re) => re.exec(html)?.[1] || '';
    const i1 = html.search(/<h1/i), badan = (i1 >= 0 ? html.slice(i1) : html).split(/<footer|id=["']comments|class=["'][^"']*(?:related|post-navigation)/i)[0].replace(/<(script|style|nav|header|aside|form)[\s\S]*?<\/\1>/gi, ' ');
    (hasil[b.id] ||= []).push({ url: sm.url, judul: tanpaTag(m(/<title>([^<]*)/i)), og_image: m(/property=["']og:image["'] content=["']([^"']+)/i), terbit: m(/article:published_time["'] content=["']([^"']+)/i).slice(0, 10), teks: tanpaTag(badan.replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')).slice(0, 7000) });
  }
  fs.writeFileSync(path.join(dir, 'rinci.json'), JSON.stringify(hasil, null, 1));
  console.log('rinci', Object.keys(hasil).length);
}

const KAPITAL = /\b[A-Z]{6,}\b/; // 6+ huruf kapital berurutan = KAPITAL penuh (singkatan <= 5 huruf boleh)
export function periksa(b) {
  const g = [];
  for (const f of ['id', 'nama', 'jenis', 'ringkasan']) if (!b[f]) g.push(`${b.id}: ${f} kosong`);
  if (!JENIS.includes(b.jenis)) g.push(`${b.id}: jenis`);
  if (b.status && !STATUS.includes(b.status)) g.push(`${b.id}: status`);
  if (!Array.isArray(b.sektor) || !b.sektor.length || b.sektor.some((s) => !SEKTOR.includes(s))) g.push(`${b.id}: sektor`);
  if (b.trl != null && !(b.trl >= 1 && b.trl <= 9)) g.push(`${b.id}: trl`);
  if (!Array.isArray(b.sumber) || !b.sumber.length || b.sumber.some((s) => !/^https?:\/\//.test(s.url || '') || !/^\d{4}-\d\d-\d\d$/.test(s.tanggal || ''))) g.push(`${b.id}: sumber`);
  const su = new Set((b.sumber || []).map((x) => x.url));
  for (const f of ['spesifikasi', 'tonggak']) for (const e of b[f] || []) if (!e.sumber_url || !su.has(e.sumber_url)) g.push(`${b.id}: ${f} tanpa sumber`);
  for (const f of ['masalah', 'cara_kerja']) if (b[f] && b[f].length > 700) g.push(`${b.id}: ${f} terlalu panjang`);
  if (/[—–]/.test(JSON.stringify(b))) g.push(`${b.id}: em dash`);
  if (KAPITAL.test(b.nama)) g.push(`${b.id}: nama KAPITAL`);
  if (/[\w.+-]+@[\w-]+\.\w+|(?:\+62|\b0)8\d{8,11}/.test(JSON.stringify(b))) g.push(`${b.id}: data pribadi`);
  return g;
}

const baku = (s) => String(s).replace(/\s+/g, ' ').trim();
const judulKata = (s) => baku(s).split(' ').map((w) => (w.length > 5 && w === w.toUpperCase() ? w[0] + w.slice(1).toLowerCase() : w)).join(' ');
const normOrg = (s) => String(s).toLowerCase().replace(/\b(pt|cv|tbk|persero|universitas|institut|badan|nasional)\b|[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

const BLN = { Jan: '01', Feb: '02', Mar: '03', Apr: '04', Mei: '05', Jun: '06', Jul: '07', Agu: '08', Agt: '08', Sep: '09', Okt: '10', Nov: '11', Des: '12' };
const tglIso = (t) => { const m = /(\d{1,2}) (\w{3}) (\d{4})/.exec(t || ''); return m && BLN[m[2]] ? `${m[3]}-${BLN[m[2]]}-${m[1].padStart(2, '0')}` : ''; };

export function dariTkdn(tk, orgs) {
  const idx = new Map(orgs.map((o) => [normOrg(o.nama), o.id]));
  const KAT = { modul_surya: ['modul surya', 'surya', 'produk'], baterai: ['baterai', 'penyimpanan', 'produk'], inverter: ['inverter', 'surya', 'alat'], turbin: ['turbin', 'bayu', 'alat'] };
  const grup = new Map();
  for (const r of tk.baris) {
    const merk = /^-+$/.test(r.merk) ? '' : judulKata(r.merk);
    const pr = judulKata(r.produsen.replace(/^PT\.?\s*/i, 'PT '));
    const k = `${r.kategori}|${normOrg(r.produsen)}|${merk.toLowerCase()}`;
    (grup.get(k) || grup.set(k, { r, merk, pr, n: [] }).get(k)).n.push(r);
  }
  return [...grup.values()].map(({ r, merk, pr, n }) => {
    const [kat, sek, jenis] = KAT[r.kategori];
    const nilai = n.map((x) => x.tkdn_persen).filter(Number.isFinite), lo = Math.min(...nilai), hi = Math.max(...nilai);
    const nm = merk && merk.toLowerCase() !== pr.toLowerCase() ? `${merk} (${kat})` : `${kat[0].toUpperCase()}${kat.slice(1)} ${pr.replace(/^PT /, '')}`;
    return { id: `in_tkdn_${n[0].id.replace('tkdn_', '')}`, nama: nm, jenis, sektor: [sek], status: 'dikomersialkan',
      ringkasan: `Produk ${kat} dalam negeri dari ${pr}${r.provinsi ? ` (${r.provinsi})` : ''}, memiliki ${n.length} sertifikat TKDN dengan nilai ${lo === hi ? lo : lo + ' sampai ' + hi} persen (tipe: ${baku(r.tipe || '-').replace(/[—–]/g, '-').slice(0, 80)}).`,
      pembuat: [{ nama: pr, lembaga_id: r.produsen_org_id && orgs.find((o) => o.id === r.produsen_org_id) ? r.produsen_org_id : idx.get(normOrg(r.produsen)) || null }],
      tahun: Number((r.diterbitkan || '').slice(-4)) || null, trl: 9, trl_dasar: 'perkiraan', lokasi: r.provinsi || null,
      spesifikasi: [{ nama: 'Nilai TKDN', nilai: `${lo === hi ? lo : lo + ' sampai ' + hi} persen`, sumber_url: r.sumber_url }, { nama: 'Produk', nilai: r.produk, sumber_url: r.sumber_url }, { nama: 'Jumlah sertifikat TKDN', nilai: String(n.length), sumber_url: r.sumber_url }, ...(r.berlaku_sampai ? [{ nama: 'Berlaku sampai', nilai: r.berlaku_sampai, sumber_url: r.sumber_url }] : [])],
      tonggak: [...new Set(n.map((x) => x.diterbitkan).filter(Boolean))].slice(0, 3).map((t) => ({ tanggal: tglIso(t), teks: 'Sertifikat TKDN diterbitkan Kemenperin', sumber_url: r.sumber_url })).filter((t) => t.tanggal),
      sumber: [{ url: r.sumber_url, tanggal: r.tanggal }], asal: 'tkdn' };
  });
}

function bangun(tgl) {
  const tk = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/tkdn.json'), 'utf8'));
  const orgs = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/organisasi.json'), 'utf8')).baris;
  const kur = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/inovasi/kurasi.json'), 'utf8'));
  const ids = new Set(orgs.map((o) => o.id)), byNm = new Map(orgs.map((o) => [normOrg(o.nama), o.id]));
  for (const k of JSON.parse(fs.readFileSync(path.join(ROOT, 'data/inovasi/kampus_org.json'), 'utf8'))) for (const n of [k.nama, ...k.alias]) byNm.set(normOrg(n), k.id); // kampus pembuat (kampus_org.mjs); menimpa sub-unit bernama mirip
  for (const b of kur) for (const p of b.pembuat || []) p.lembaga_id ||= (ids.has(p.lembaga_id) && p.lembaga_id) || byNm.get(normOrg(p.nama)) || null;
  const rinci = fs.existsSync(path.join(ROOT, 'data/inovasi/rinci.json')) ? JSON.parse(fs.readFileSync(path.join(ROOT, 'data/inovasi/rinci.json'), 'utf8')) : {};
  for (const b of kur) { const r = rinci[b.id]; if (!r) continue; const { sumber_tambah, ...isi } = r; Object.assign(b, isi); if (sumber_tambah) b.sumber = [...b.sumber, ...sumber_tambah.filter((t) => !b.sumber.some((x) => x.url === t.url))]; }
  const baris = [...kur, ...dariTkdn(tk, orgs)].sort((a, b) => a.id.localeCompare(b.id));
  const gal = baris.flatMap(periksa); if (gal.length) { console.error(gal.join('\n')); process.exit(1); }
  if (new Set(baris.map((b) => b.id)).size !== baris.length) { console.error('id ganda'); process.exit(1); }
  const out = { lapis: 'publik', dibangun_pada: tgl, jumlah: baris.length, inovasi: baris };
  fs.writeFileSync(path.join(ROOT, 'public/data/inovasi.json'), JSON.stringify(out) + '\n');
  const per = {}; baris.forEach((b) => b.sektor.forEach((s) => (per[s] = (per[s] || 0) + 1)));
  console.log(baris.length, per);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [, , cmd, a] = process.argv;
  if (cmd === 'ambil') await ambil(a); else if (cmd === 'ambil-rinci') await ambilRinci(a); else if (cmd === 'bangun') bangun(a); else console.log('ambil <dir> | bangun <tgl>');
}
