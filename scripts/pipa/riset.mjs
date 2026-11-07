// Tab Riset di /direktori: public/data/{riset,pusat_studi,aset_riset,topik_riset}.json
//   node scripts/pipa/riset.mjs ambil [--segar]   (jaringan: OpenAlex works + institutions; robots dicek, jeda >= 2 dtk, UA METI, tanpa kunci/login)
//   node scripts/pipa/riset.mjs verifikasi        (jaringan: situs seed aset dicek memuat kata kunci; hasil di cache)
//   node scripts/pipa/riset.mjs bangun [tgl]      (tanpa jaringan: cache + riset_ebt.json + organisasi + prodi_pelatihan + program_analisis -> 4 berkas)
// Lisensi: OpenAlex CC0 (atribusi di tiap berkas). Garuda: metadata saja (atribusi Kemdiktisaintek). Surel/telepon penulis TIDAK diambil.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ambil as ambilSopan, UA } from './_panen_sopan.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const MENTAH = path.join(ROOT, 'data-panen/riset');
const PUB = (f) => path.join(ROOT, 'public/data', f);
const baca = (f) => JSON.parse(fs.readFileSync(f, 'utf-8'));
const MAILTO = 'mailto=riset@platformmeti.timitbnpb.workers.dev';
const PERIODE = '2019-2026';
const BASE = 'https://api.openalex.org';
export const LISENSI = 'OpenAlex CC0 (https://openalex.org); Garuda Kemdiktisaintek, metadata saja';

// rumpun (kunci SEKTOR di direktori.js) -> kueri OpenAlex (Inggris) dan kata kunci judul
export const RUMPUN = {
  surya: '"solar energy" OR photovoltaic OR "solar cell" OR "solar power"',
  bayu: '"wind energy" OR "wind turbine" OR "wind power"',
  hidro: 'hydropower OR "micro hydro" OR hydroelectric',
  'panas-bumi': 'geothermal',
  bioenergi: 'bioenergy OR biofuel OR biodiesel OR bioethanol OR biogas',
  'biomassa-sampah': '"waste to energy" OR "biomass energy" OR "municipal solid waste"',
  hidrogen: '"green hydrogen" OR "hydrogen production" OR "fuel cell"',
  penyimpanan: '"energy storage" OR "lithium-ion battery"',
  jaringan: '"smart grid" OR "power system" OR "microgrid"',
  kebijakan: '"energy policy" OR "energy transition" OR "renewable energy policy"',
  efisiensi: '"energy efficiency" OR "energy conservation"',
  nuklir: '"nuclear power" OR "nuclear energy"',
  laut: '"ocean energy" OR "tidal energy" OR "wave energy"',
  elektrifikasi: '"electric vehicle" OR electrification',
  'transisi-adil': '"just energy transition" OR "coal phase-out" OR "coal power plant"',
  karbon: '"carbon emission" OR "carbon pricing" OR "decarbonization"',
};
// Garuda (riset_ebt.json) -> rumpun
const GARUDA_RUMPUN = { surya: 'surya', angin: 'bayu', panas_bumi: 'panas-bumi', hidro: 'hidro', bioenergi: 'bioenergi', biomassa: 'biomassa-sampah', hidrogen: 'hidrogen', baterai: 'penyimpanan', transisi: 'kebijakan' };
export const SEKTOR_SAH = new Set([...Object.keys(RUMPUN), 'nuklir']);
// topik (program_analisis.kode) -> pola judul karya
export const POLA_TOPIK = {
  'plts-100gw': /solar|photovoltaic|\bPLTS\b|surya/i, 'plts-atap': /rooftop|roof-top|atap/i,
  wte: /waste.to.energy|solid waste|sampah|landfill|\bPSEL\b/i, dedieselisasi: /diesel|\bPLTD\b|off-grid|remote island|isolated/i,
  b50: /biodiesel|palm oil|\bFAME\b|\bB[345]0\b/i, e20: /ethanol|etanol/i, ruptl: /\bRUPTL\b|power system|electricity supply|capacity expansion/i,
  psn: /strategic project|proyek strategis/i, jetp: /just energy transition|\bJETP\b|coal phase|coal retire/i,
  'pensiun-dini-pltu': /coal phase|retire|early retirement|coal power plant|\bPLTU\b/i, 'panas-bumi': /geothermal|panas bumi/i,
  'kendaraan-listrik': /electric vehicle|\bEVs?\b|charging station|kendaraan listrik/i, 'hidrogen-hijau': /hydrogen|hidrogen/i,
  nuklir: /nuclear|nuklir/i, 'co-firing': /co-?firing|biomass.{0,40}coal|coal.{0,40}biomass/i, 'super-grid': /interconnect|super ?grid|transmission|smart grid|microgrid/i,
};
// kota OpenAlex (geo.region) -> nama provinsi
const REGION = { 'West Java': 'Jawa Barat', 'Central Java': 'Jawa Tengah', 'East Java': 'Jawa Timur', Banten: 'Banten', Jakarta: 'DKI Jakarta', Yogyakarta: 'DI Yogyakarta', 'North Sumatra': 'Sumatera Utara', 'West Sumatra': 'Sumatera Barat', 'South Sulawesi': 'Sulawesi Selatan', Bali: 'Bali' };
const KAPITAL = /\b[A-Z]{6,}\b/;

export const norma = (s) => String(s || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
// em dash dan titik tengah dilarang di berkas publik (gerbang gaya): jadi tanda hubung
export const tanpaTanda = (t) => String(t ?? '').replace(/\s*\u2014\s*/g, ' - ').replace(/\s*\u00b7\s*/g, ' ').replace(/\s+/g, ' ').trim();
const idPendek = (u) => String(u || '').replace('https://openalex.org/', '');

// ---------- referensi lokal ----------
let _ref;
function ref() {
  if (_ref) return _ref;
  const wil = baca(PUB('wilayah.json')).baris.map((b) => ({ kode: String(b.kode), nama: b.nama }));
  const orang = baca(PUB('orang.json')).baris;
  const ebt = baca(PUB('riset_ebt.json'));
  const kampusProv = new Map(); // openalex institusi -> kode provinsi
  for (const p of ebt.per_provinsi) for (const k of p.kampus) kampusProv.set(k.openalex_id, String(p.kode));
  return (_ref = { wil, orang, ebt, kampusProv, kampus: baca(PUB('riset_kampus.json')), org: baca(PUB('organisasi.json')).baris });
}
export const kodeDariNama = (nama, wil) => { const n = norma(nama); return wil.find((w) => norma(w.nama) === n)?.kode || ''; };
// provinsi yang disebut di teks (nama terpanjang dulu, yang sudah cocok dibuang supaya "Papua" tak menempel di "Papua Barat")
export function provDalamTeks(teks, wil) {
  let t = ' ' + norma(teks) + ' '; const hasil = [];
  for (const w of [...wil].sort((a, b) => b.nama.length - a.nama.length)) {
    const n = ' ' + norma(w.nama) + ' ';
    if (t.includes(n)) { hasil.push(w.kode); t = t.split(n).join(' '); }
  }
  return hasil.sort();
}
const bersih = (s) => norma(String(s).split(',')[0].replace(/\b(prof|dr|ir|dra|drs|ing|st|mt|mst|msc|phd|sh|se|ssi|mp|meng)\b\.?/gi, ''));
// cocok nama persis ke direktori orang; hanya bila tepat satu orang (nama kembar = tidak ditautkan)
export function cocokPakar(nama, orang) {
  const k = bersih(nama); if (k.length < 6) return '';
  const h = orang.filter((o) => bersih(o.nama) === k); return h.length === 1 ? h[0].id : '';
}

// ---------- OpenAlex: ambil ----------
async function oa(url) { return ambilSopan(url + (url.includes('?') ? '&' : '?') + MAILTO, { json: true, headers: { accept: 'application/json' } }); }
const FIELD = 'id,doi,title,publication_year,cited_by_count,primary_location,authorships,open_access';
async function ambilKarya(segar) {
  fs.mkdirSync(path.join(MENTAH, 'works'), { recursive: true });
  for (const [k, q] of Object.entries(RUMPUN)) {
    for (const hal of [1, 2]) {
      const f = path.join(MENTAH, 'works', `${k}-${hal}.json`);
      if (fs.existsSync(f) && !segar) continue;
      const filter = `authorships.institutions.country_code:ID,publication_year:${PERIODE},type:article,title_and_abstract.search:(${q}) AND Indonesia`;
      const u = `${BASE}/works?filter=${encodeURIComponent(filter)}&sort=cited_by_count:desc&per_page=100&page=${hal}&select=${FIELD}`;
      const j = await oa(u); fs.writeFileSync(f, JSON.stringify(j.results || [])); console.log('works', k, hal, (j.results || []).length);
    }
  }
}
const KATA_LEMBAGA = ['energy', 'energi', 'hydrogen', 'nuclear', 'nuklir'];
async function ambilLembaga(segar) {
  const f = path.join(MENTAH, 'lembaga.json'); if (fs.existsSync(f) && !segar) return;
  const m = new Map();
  for (const s of KATA_LEMBAGA) {
    const j = await oa(`${BASE}/institutions?filter=${encodeURIComponent(`country_code:ID,display_name.search:${s}`)}&per_page=50&select=id,display_name,type,homepage_url,geo,ror`);
    for (const r of j.results || []) m.set(r.id, r);
  }
  fs.writeFileSync(f, JSON.stringify([...m.values()])); console.log('lembaga', m.size);
}

// ---------- OpenAlex works -> riset.json ----------
export function karyaDariOA(w, rumpun, { kampusProv, wil, orang }) {
  if (!w?.title || !w.id) return null;
  const aut = (w.authorships || []).filter((a) => a.author?.display_name);
  const idn = aut.flatMap((a) => (a.institutions || []).filter((i) => i.country_code === 'ID'));
  const prov = new Set(); for (const i of idn) { const p = kampusProv.get(idPendek(i.id)); if (p) prov.add(p); }
  for (const p of provDalamTeks(w.title, wil)) prov.add(p);
  const pakar = [...new Set(aut.map((a) => cocokPakar(a.author.display_name, orang)).filter(Boolean))];
  const doi = w.doi ? String(w.doi).replace('https://doi.org/', '') : '';
  const kam = idn.find((i) => i.display_name)?.display_name || '';
  return {
    id: idPendek(w.id), judul: tanpaTanda(w.title.replace(/<[^>]+>/g, '')), penulis: aut.slice(0, 8).map((a) => tanpaTanda(a.author.display_name)),
    jurnal: tanpaTanda(w.primary_location?.source?.display_name), kampus: tanpaTanda(kam), tahun: w.publication_year || null, sitasi: w.cited_by_count ?? 0,
    sektor: [rumpun], wilayah: [...prov].sort().map((p) => ({ prov: p })), pakar, ...(doi ? { doi } : {}), ...(w.open_access?.is_oa ? { oa: true } : {}),
    sumber: 'openalex', sumber_url: 'https://openalex.org/' + idPendek(w.id),
  };
}
export function karyaDariGaruda(a, { wil, orang }) {
  const sektor = [...new Set((a.topik || []).map((t) => GARUDA_RUMPUN[t]).filter(Boolean))];
  if (!a.judul || !sektor.length) return null;
  return {
    id: 'garuda-' + a.garuda_id, judul: tanpaTanda(a.judul), penulis: (a.penulis || []).slice(0, 8).map(tanpaTanda), jurnal: tanpaTanda((a.jurnal || '').split(/\sVol\b|\sVolume\b|\sNo\b/i)[0]), kampus: '', tahun: a.tahun || null, sitasi: null,
    sektor, wilayah: provDalamTeks(a.judul, wil).map((p) => ({ prov: p })), pakar: [...new Set((a.penulis || []).map((n) => cocokPakar(n, orang)).filter(Boolean))],
    ...(a.doi ? { doi: a.doi } : {}), sumber: 'garuda', sumber_url: a.sumber_url,
  };
}
export function gabungKarya(daftar) {
  const m = new Map();
  for (const k of daftar) {
    const a = m.get(k.id);
    if (!a) m.set(k.id, { ...k, sektor: [...k.sektor] }); else a.sektor = [...new Set([...a.sektor, ...k.sektor])].sort();
  }
  return [...m.values()].sort((a, b) => (b.sitasi ?? -1) - (a.sitasi ?? -1) || (b.tahun || 0) - (a.tahun || 0) || a.id.localeCompare(b.id));
}
export function periksaKarya(k) {
  const g = [];
  if (!k.id || !k.judul) g.push('tanpa id/judul');
  if (!/^https:\/\//.test(k.sumber_url || '')) g.push('tanpa sumber_url');
  if (!k.sektor?.length || k.sektor.some((s) => !SEKTOR_SAH.has(s))) g.push('sektor tidak sah');
  if (JSON.stringify(k).match(/@[\w-]+\.\w{2,}/)) g.push('pola surel');
  return g.map((x) => k.id + ': ' + x);
}
function bangunRiset(tanggal) {
  const r = ref(), semua = [];
  for (const k of Object.keys(RUMPUN)) for (const hal of [1, 2]) {
    const f = path.join(MENTAH, 'works', `${k}-${hal}.json`);
    if (fs.existsSync(f)) for (const w of baca(f)) { const x = karyaDariOA(w, k, r); if (x) semua.push(x); }
  }
  for (const a of r.ebt.artikel_jurnal) { const x = karyaDariGaruda(a, r); if (x) semua.push(x); }
  const baris = gabungKarya(semua).map((k) => ({ ...k, tanggal_periksa: tanggal, tingkat_bukti: 'via-pihak-ketiga' }));
  const salah = baris.flatMap(periksaKarya); if (salah.length) throw new Error('riset tidak sah: ' + salah.slice(0, 5).join('; '));
  return baris;
}

// ---------- topik ----------
export function bangunTopik(program, riset, tanggal) {
  const kejadian = program.baris.map((p) => {
    const re = POLA_TOPIK[p.kode];
    const karya = re ? riset.filter((k) => re.test(k.judul)) : [];
    const top = [...karya].sort((a, b) => (b.sitasi ?? -1) - (a.sitasi ?? -1) || a.id.localeCompare(b.id)).slice(0, 10);
    const pakar = [...new Set(karya.flatMap((k) => k.pakar))].sort();
    const tgl = [...(p.berita || []).map((b) => String(b.terbit || b.tanggal || '').slice(0, 10)), ...(p.tonggak || []).map((t) => String(t.tanggal || '').slice(0, 10))].filter((x) => /^\d{4}-\d\d-\d\d$/.test(x)).sort().pop() || '';
    const hit = {}; for (const q of p.proyek || []) if (q.prov) hit[q.prov] = (hit[q.prov] || 0) + 1;
    const prov = Object.entries(hit).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 3).map(([n]) => kodeDariNama(n, ref().wil)).filter(Boolean);
    return {
      id: p.kode, nama: p.nama.id, jenis: p.ikon, tanggal: tgl, prov, program: p.kode,
      n_berita: (p.berita || []).length, n_proyek: (p.proyek || []).length,
      riset: { works_total: karya.length, works: top.map((k) => ({ id: k.id, judul: k.judul, tahun: k.tahun, jurnal: k.jurnal, sitasi: k.sitasi, doi: k.doi })), pakar: pakar.map((id) => ({ id })) },
      jejak: p.ringkasan?.id ? { ringkasan: p.ringkasan.id } : undefined,
    };
  });
  return { diperbarui: tanggal, sumber: 'program_analisis.json, riset.json (pencocokan kata pada judul karya), berita dan proyek program', kejadian };
}

// ---------- pusat studi ----------
const FOKUS = [[/nuclear|nuklir/i, 'nuklir'], [/hydrogen|fuel cell/i, 'hidrogen'], [/bioenergy|bioenergi|biofuel|surfactant/i, 'bioenergi'], [/geotherm|panas bumi/i, 'panas-bumi'], [/solar|surya/i, 'surya'], [/wind|angin|bayu/i, 'bayu'], [/hydropower|\bhidro\b|microhydro/i, 'hidro'], [/battery|baterai/i, 'penyimpanan']];
const TOPIK_KAMPUS = { surya: 'surya', angin: 'bayu', panas_bumi: 'panas-bumi', bioenergi: 'bioenergi', hidro: 'hidro', hidrogen: 'hidrogen', baterai: 'penyimpanan', kebijakan: 'kebijakan' };
const LABEL_SEKTOR = { surya: 'Surya', bayu: 'Bayu (angin)', hidro: 'Hidro', 'panas-bumi': 'Panas bumi', bioenergi: 'Bioenergi', 'biomassa-sampah': 'Biomassa dan sampah', nuklir: 'Nuklir', hidrogen: 'Hidrogen', penyimpanan: 'Penyimpanan', jaringan: 'Jaringan', efisiensi: 'Efisiensi', kebijakan: 'Kebijakan' };
export const LEMBAGA_ABAIKAN = new Set(['I4210158665' /* BATAN, dilebur ke BRIN 2021 */, 'I4405258543' /* Kementerian ESDM, bukan pusat studi */, 'I4405273755' /* Bapeten, regulator */]);
export function bangunPusat(org, kampus, lembaga, wil, tanggal) {
  const topKampus = new Map(); // org id -> 3 rumpun teratas dari riset_kampus
  for (const b of kampus.baris) for (const id of b.organisasi_id || []) topKampus.set(id, Object.entries(b.per_topik).sort((x, y) => y[1] - x[1]).slice(0, 3).map(([t]) => TOPIK_KAMPUS[t]).filter(Boolean));
  const keluar = [];
  for (const o of org.filter((x) => ['perguruan-tinggi', 'think-tank'].includes(x.kategori?.kode))) {
    const kode = kodeDariNama(o.lokasi?.provinsi, wil); const web = o.situs;
    if (!kode || !web) continue;
    if (o.kategori.kode === 'perguruan-tinggi' && !/pusat|center|centre|studi|research|riset/i.test(o.nama)) continue; // kampus biasa bukan pusat studi
    keluar.push({ id: o.id, nama: o.nama.replace(/\s+\(.*\)$/, ''), singkatan: o.singkatan || '', induk: o.induk || '', kota: o.lokasi.kota || '', prov: kode, fokus: (topKampus.get(o.id) || []).map((s) => LABEL_SEKTOR[s]).filter(Boolean), web,
      ...(o.logo ? { logo: o.logo } : {}), jenis: o.kategori.kode === 'think-tank' ? 'think-tank' : 'pusat studi kampus', nama_terverifikasi: true, sumber_url: o.sumber?.[0]?.url || web, diperiksa: o.diperiksa || tanggal, tingkat_bukti: o.sumber?.[0]?.tingkat_bukti || 'situs-sendiri' });
  }
  const NAMA = /energ|hydrogen|nuclear|nuklir|renewable|terbarukan/i;
  for (const l of lembaga) {
    const id = idPendek(l.id); if (LEMBAGA_ABAIKAN.has(id) || l.type === 'education' || !NAMA.test(l.display_name) || !/^https?:\/\//.test(l.homepage_url || '')) continue;
    const kode = kodeDariNama(REGION[l.geo?.region] || l.geo?.region || '', wil); if (!kode) continue;
    if (/Kementerian|Politeknik/.test(l.display_name)) continue;
    const fokus = [...new Set(FOKUS.filter(([re]) => re.test(l.display_name)).map(([, s]) => LABEL_SEKTOR[s]))];
    keluar.push({ id: 'oa-' + id, nama: l.display_name, singkatan: '', induk: l.type === 'government' ? 'BRIN' : '', kota: l.geo?.city || '', prov: kode, fokus, web: l.homepage_url.replace(/\/#.*$/, ''), jenis: l.type === 'government' ? 'organisasi riset pemerintah' : 'perkumpulan', nama_terverifikasi: true,
      sumber_url: 'https://openalex.org/' + id, diperiksa: tanggal, tingkat_bukti: 'via-pihak-ketiga' });
  }
  return keluar.sort((a, b) => a.prov.localeCompare(b.prov) || a.nama.localeCompare(b.nama, 'id'));
}

// ---------- aset riset ----------
const SEKTOR_LSP = [[/surya|plts|photovoltaic/i, 'surya'], [/angin|bayu/i, 'bayu'], [/hidro|air/i, 'hidro'], [/panas bumi|geotermal/i, 'panas-bumi'], [/bio|sampah/i, 'bioenergi'], [/energi|konservasi|audit/i, 'efisiensi']];
export function asetDariLsp(lsp, wil, tanggal) {
  return lsp.map((l) => {
    const prov = provDalamTeks(l.alamat || '', wil)[0] || '';
    const sektor = [...new Set(SEKTOR_LSP.filter(([re]) => (l.skema_ebt || []).some((s) => re.test(s))).map(([, s]) => s))];
    return { id: 'lsp-' + l.slug, nama: 'Lembaga Sertifikasi Profesi ' + l.nama.replace(/^LSP\s+/i, ''), jenis: 'lembaga sertifikasi', pemilik: l.nama, unit: '', kota: '', prov, sektor: sektor.length ? sektor : ['efisiensi'],
      layanan: 'Sertifikasi kompetensi: ' + (l.skema_ebt || []).slice(0, 4).join(', '), sumber_url: l.sumber_url, diperiksa: l.tanggal_periksa || tanggal, tingkat_bukti: l.tingkat_bukti || 'resmi' };
  });
}
export function asetDariSeed(seed, verif, tanggal) { // hanya yang situsnya terbukti memuat kata kunci
  return seed.filter((s) => verif[s.web]?.ok).map(({ kata, ...s }) => ({ ...s, diperiksa: verif[s.web].tanggal || tanggal, tingkat_bukti: 'situs-sendiri', sumber_url: s.web }));
}
async function verifikasi() {
  const seed = ['seed_aset.json', 'seed_dataset.json'].flatMap((n) => baca(path.join(ROOT, 'data/riset', n))), f = path.join(MENTAH, 'verifikasi.json'), hasil = fs.existsSync(f) ? baca(f) : {};
  fs.mkdirSync(MENTAH, { recursive: true });
  for (const s of seed) {
    let ok = false; try { const h = await ambilSopan(s.web); const t = norma(String(h).replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<[^>]+>/g, ' ')); ok = s.kata.every((k) => t.includes(norma(k))); } catch (e) { console.log('gagal', s.web, e.message); }
    hasil[s.web] = { ok, tanggal: new Date().toISOString().slice(0, 10) }; console.log(ok ? 'ok ' : 'TIDAK', s.web);
  }
  fs.writeFileSync(f, JSON.stringify(hasil, null, 1));
}

// ---------- pakar per sektor (dari riset_kampus.penulis_teratas + sektor karya di riset.json) ----------
export function bangunPakar(kampus, riset, orang, kampusProv, tanggal) {
  const sek = new Map(); // nama normal -> {rumpun: n}
  for (const k of riset) if (k.sumber === 'openalex') for (const n of k.penulis) { const m = sek.get(norma(n)) || sek.set(norma(n), {}).get(norma(n)); for (const r of k.sektor) m[r] = (m[r] || 0) + 1; }
  const keluar = [];
  for (const b of kampus.baris) for (const a of b.penulis_teratas || []) {
    const per = sek.get(norma(a.nama)) || {}, oid = cocokPakar(a.nama, orang);
    keluar.push({ id: 'oa-' + a.openalex, nama: tanpaTanda(a.nama), kampus: tanpaTanda(b.nama), kota: b.kota || '', prov: kampusProv.get(b.openalex_id) || '', karya: a.karya_energi_2019_sekarang,
      sektor: Object.entries(per).sort((x, y) => y[1] - x[1] || x[0].localeCompare(y[0])).slice(0, 3).map(([r]) => r), ...(oid ? { orang_id: oid } : {}),
      sumber_url: 'https://openalex.org/' + a.openalex, tanggal_periksa: tanggal, tingkat_bukti: 'via-pihak-ketiga' });
  }
  return keluar.sort((x, y) => y.karya - x.karya || x.nama.localeCompare(y.nama));
}

// ---------- hibah: pendana karya per sektor (OpenAlex group_by funders) ----------
async function ambilHibah(segar) {
  fs.mkdirSync(path.join(MENTAH, 'hibah'), { recursive: true });
  for (const [k, q] of Object.entries(RUMPUN)) {
    const f = path.join(MENTAH, 'hibah', k + '.json'); if (fs.existsSync(f) && !segar) continue;
    const filter = `authorships.institutions.country_code:ID,publication_year:${PERIODE},type:article,title_and_abstract.search:(${q}) AND Indonesia`;
    const j = await oa(`${BASE}/works?filter=${encodeURIComponent(filter)}&group_by=funders.id&per_page=200`);
    fs.writeFileSync(f, JSON.stringify(j.group_by || [])); console.log('hibah', k, (j.group_by || []).length);
  }
}
export function bangunHibah(grupPerSektor, tanggal) {
  const m = new Map();
  for (const [sek, grup] of Object.entries(grupPerSektor)) for (const g of grup) {
    if (!g.key || !g.key_display_name || g.key === 'unknown') continue;
    const id = idPendek(g.key), x = m.get(id) || m.set(id, { id: 'oa-' + id, nama: tanpaTanda(g.key_display_name), total: 0, per_sektor: {}, sumber_url: 'https://openalex.org/' + id, tanggal_periksa: tanggal, tingkat_bukti: 'via-pihak-ketiga' }).get(id);
    x.per_sektor[sek] = g.count; x.total += g.count;
  }
  return [...m.values()].filter((x) => x.total >= 3).map((x) => ({ ...x, sektor: Object.entries(x.per_sektor).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 3).map(([r]) => r) })).sort((a, b) => b.total - a.total || a.nama.localeCompare(b.nama)).slice(0, 300);
}
export function dataset(seed, verif, tanggal) {
  return seed.filter((s) => verif[s.web]?.ok).map(({ kata, ...s }) => ({ ...s, diperiksa: verif[s.web].tanggal || tanggal, tingkat_bukti: 'situs-sendiri', sumber_url: s.web }));
}

// ---------- bangun ----------
function bangun(tanggal) {
  const r = ref(), riset = bangunRiset(tanggal);
  const verif = fs.existsSync(path.join(MENTAH, 'verifikasi.json')) ? baca(path.join(MENTAH, 'verifikasi.json')) : {};
  const lembaga = fs.existsSync(path.join(MENTAH, 'lembaga.json')) ? baca(path.join(MENTAH, 'lembaga.json')) : [];
  const meta = (jenis, n) => ({ jenis, diperbarui: tanggal, jumlah: n, lisensi: LISENSI, ua: UA });
  const pusat = bangunPusat(r.org, r.kampus, lembaga, r.wil, tanggal);
  const aset = [...asetDariSeed(baca(path.join(ROOT, 'data/riset/seed_aset.json')), verif, tanggal), ...asetDariLsp(baca(PUB('prodi_pelatihan.json')).lsp, r.wil, tanggal)];
  const topik = bangunTopik(baca(PUB('program_analisis.json')), riset, tanggal);
  const tulis = (f, d) => fs.writeFileSync(PUB(f), JSON.stringify(d) + '\n');
  const grup = {}; for (const k of Object.keys(RUMPUN)) { const f = path.join(MENTAH, 'hibah', k + '.json'); if (fs.existsSync(f)) grup[k] = baca(f); }
  tulis('pakar_riset.json', bangunPakar(r.kampus, riset, r.orang, r.kampusProv, tanggal)); tulis('hibah_riset.json', bangunHibah(grup, tanggal));
  tulis('dataset_riset.json', dataset(baca(path.join(ROOT, 'data/riset/seed_dataset.json')), verif, tanggal));
  tulis('riset.json', riset); tulis('pusat_studi.json', pusat); tulis('aset_riset.json', aset); tulis('topik_riset.json', topik);
  console.log(JSON.stringify(meta('ringkas', 0)), { riset: riset.length, pusat: pusat.length, aset: aset.length, topik: topik.kejadian.length });
}

export { KAPITAL };
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [cmd, tgl] = process.argv.slice(2).filter((a) => !a.startsWith('--')), segar = process.argv.includes('--segar');
  if (cmd === 'ambil') { await ambilKarya(segar); await ambilLembaga(segar); await ambilHibah(segar); }
  else if (cmd === 'verifikasi') await verifikasi();
  else if (cmd === 'bangun') bangun(tgl || '2026-11-08');
  else console.log('pakai: ambil | verifikasi | bangun [tgl]');
}
