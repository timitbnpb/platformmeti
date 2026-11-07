// public/data/logo_pemilik.json + public/img/logo/sd/*.png: logo pemilik sistem data, skema, dan pendana.
//   node scripts/pipa/logo_pemilik.mjs ambil     (jaringan: ikon situs resmi lewat layanan favicon Google, jeda >= 2 dtk, simpan lokal)
//   node scripts/pipa/logo_pemilik.mjs bangun    (tanpa jaringan: peta nama -> logo, hanya berkas yang ada)
// Nama = teks persis di sistem_data.json (pemilik), pendanaan.json (pemberi, pendana). Tanpa logo = layar memakai monogram.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const UA = 'METI-Network-research/0.1 (+https://platformmeti.timitbnpb.workers.dev)';
// Logo yang sudah ada di repo (dipakai dulu).
export const LOKAL = {
  'Kementerian ESDM': '/img/logo/esdm.png', 'Kementerian Keuangan': '/img/logo/kemenkeu.png', 'Kementerian Keuangan (DJPPR)': '/img/logo/kemenkeu.png', 'PT PLN (Persero)': '/img/logo/pln.png',
  'Kementerian Investasi dan Hilirisasi/BKPM': '/img/logo/bkpm.png', 'Badan Riset dan Inovasi Nasional': '/img/logo/brin.png', 'Otoritas Jasa Keuangan': '/img/logo/ojk.png',
  'Badan Meteorologi, Klimatologi, dan Geofisika': '/img/penerbit/bmkg.png', 'Badan Informasi Geospasial': '/img/penerbit/big.png', 'Kementerian Perindustrian': '/img/penerbit/kemenperin.png',
};
export const DOMAIN = {
  'ASEAN Centre for Energy': 'aseanenergy.org', 'Kementerian Lingkungan Hidup': 'menlhk.go.id', 'Bloomberg': 'bloomberg.com', 'Badan Pusat Statistik': 'bps.go.id', 'Climate TRACE Coalition': 'climatetrace.org',
  'Kementerian PPN/Bappenas': 'bappenas.go.id', 'Dewan Energi Nasional': 'den.go.id', 'Energy Institute': 'energyinst.org', 'Ember': 'ember-energy.org', 'Bank Dunia': 'worldbank.org',
  'Copernicus, ECMWF': 'copernicus.eu', 'Kementerian Pendidikan Tinggi, Sains, dan Teknologi': 'kemdiktisaintek.go.id', 'Global Energy Monitor': 'globalenergymonitor.org', 'William and Mary geoLab': 'geoboundaries.org',
  'ESMAP, Bank Dunia': 'esmap.org', 'DTU dan Bank Dunia': 'dtu.dk', 'Gold Standard': 'goldstandard.org', 'IATI': 'iatistandard.org', 'Bursa Efek Indonesia': 'idx.co.id', 'International Energy Agency': 'iea.org',
  'LKPP': 'lkpp.go.id', 'International Renewable Energy Agency': 'irena.org', 'Badan Pemeriksa Keuangan': 'bpk.go.id', 'Kementerian Desa dan PDT': 'kemendesa.go.id', 'NASA': 'nasa.gov', 'OECD': 'oecd.org',
  'OurResearch': 'ourresearch.org', 'Indonesia Corruption Watch': 'antikorupsi.org', 'OpenStreetMap Foundation': 'openstreetmap.org', 'Our World in Data': 'ourworldindata.org', 'REN21': 'ren21.net', 'Verra': 'verra.org',
  'Wikimedia Foundation': 'wikimedia.org', 'World Resources Institute': 'wri.org', 'Asian Development Bank': 'adb.org', 'World Bank (IBRD/IDA)': 'worldbank.org', 'World Bank Trust Funds': 'worldbank.org',
  'Federal Ministry for Economic Cooperation and Development (BMZ)': 'bmz.de', 'Netherlands Enterprise Agency': 'rvo.nl', 'UK - Foreign, Commonwealth Development Office (FCDO)': 'gov.uk', 'Green Climate Fund': 'greenclimate.fund',
  'U.S. Agency for International Development': 'usaid.gov', 'Australia Aid': 'dfat.gov.au', 'Ministry for Foreign Affairs of Finland': 'um.fi', 'Sweden': 'sida.se', 'Asian Infrastructure Investment Bank': 'aiib.org',
  'Foreign Affairs, Trade and Development Canada (DFATD)': 'international.gc.ca', 'Ministry of Foreign Affairs of the Netherlands': 'government.nl', 'Office for Government Policy Coordination': 'opc.go.kr',
  'Ministry of Foreign Affairs, Denmark': 'um.dk', 'DEPARTMENT FOR SCIENCE, INNOVATION AND TECHNOLOGY': 'gov.uk', 'United Nations Development Programme': 'undp.org', 'Trade and Development Agency': 'ustda.gov',
  'European Commission - Directorate-General for International Partnerships': 'ec.europa.eu', 'Private Infrastructure Development Group': 'pidg.org', 'Norad - Norwegian Agency for Development Cooperation': 'norad.no',
  'Islamic Development Bank': 'isdb.org', 'JETP Indonesia (IPG dan GFANZ)': 'jetp-id.org', 'Germany - Federal Foreign Office': 'auswaertiges-amt.de', 'Global Environment Facility': 'thegef.org',
  'New Zealand Ministry of Foreign Affairs and Trade': 'mfat.govt.nz', 'Japan International Cooperation Agency (JICA)': 'jica.go.jp', 'Japan International Cooperation Agency': 'jica.go.jp', 'AFD': 'afd.fr',
  'Millennium Challenge Corporation': 'mcc.gov', 'Department of Energy': 'energy.gov', 'Department of State': 'state.gov', 'Danamart': 'danamart.id', 'GSMA Foundation': 'gsma.com',
  'Badan Pengelola Dana Lingkungan Hidup': 'bpdlh.id', 'KfW Development Bank': 'kfw-entwicklungsbank.de', 'Climate Investment Funds': 'cif.org', 'PT Sarana Multi Infrastruktur': 'ptsmi.co.id',
  'International Partners Group dan GFANZ': 'jetp-id.org', 'Verra dan Gold Standard': 'verra.org', 'Lembaga Pengelola Dana Pendidikan': 'lpdp.kemenkeu.go.id',
};
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9.]+/g, '-').replace(/^-|-$/g, '');
const jeda = (ms) => new Promise((r) => setTimeout(r, ms));
const dir = path.join(ROOT, 'public/img/logo/sd');

const EXT = ['png', 'ico', 'svg', 'jpg'];
const ada = (d) => EXT.map((e) => path.join(dir, slug(d) + '.' + e)).find((f) => fs.existsSync(f));
const tipe = (ct, u) => (/svg/.test(ct) ? 'svg' : /png/.test(ct) ? 'png' : /jpe?g/.test(ct) ? 'jpg' : /icon|ico/.test(ct) || /\.ico$/.test(u) ? 'ico' : 'png');
async function langsung(d) {
  for (const u of [`https://www.${d}/apple-touch-icon.png`, `https://${d}/apple-touch-icon.png`, `https://www.${d}/favicon.ico`, `https://${d}/favicon.ico`]) {
    await jeda(2100);
    const r = await fetch(u, { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(20000) }).catch(() => null);
    if (!r || !r.ok || !/image|icon|octet/.test(r.headers.get('content-type') || '')) continue;
    const b = Buffer.from(await r.arrayBuffer());
    if (b.length < 400) continue;
    fs.writeFileSync(path.join(dir, slug(d) + '.' + tipe(r.headers.get('content-type') || '', u)), b); console.log('langsung', u, b.length); return true;
  }
  return false;
}
async function ambil() {
  fs.mkdirSync(dir, { recursive: true });
  const dom = [...new Set(Object.values(DOMAIN))];
  for (const d of dom) {
    const f = path.join(dir, slug(d) + '.png');
    if (ada(d)) continue;
    await jeda(2100);
    const r = await fetch(`https://www.google.com/s2/favicons?domain=${d}&sz=128`, { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(20000) }).catch(() => null);
    if (!r || !r.ok) { console.log('gagal', d, r && r.status); await langsung(d); continue; }
    const b = Buffer.from(await r.arrayBuffer());
    if (b.length < 400) { console.log('terlalu kecil (ikon bawaan?)', d, b.length); await langsung(d); continue; }
    fs.writeFileSync(f, b); console.log('ok', d, b.length);
  }
}

export function peta() {
  const out = {};
  for (const [n, u] of Object.entries(LOKAL)) if (fs.existsSync(path.join(ROOT, 'public' + u))) out[n] = { logo: u };
  for (const [n, d] of Object.entries(DOMAIN)) { const f = ada(d); if (!out[n] && f) out[n] = { logo: `/img/logo/sd/${path.basename(f)}`, sumber: `https://${d}/` }; }
  return out;
}
function bangun() {
  const o = peta();
  fs.writeFileSync(path.join(ROOT, 'public/data/logo_pemilik.json'), JSON.stringify(o, null, 1) + '\n', 'utf8');
  console.log(Object.keys(o).length, 'logo dari', Object.keys(LOKAL).length + Object.keys(DOMAIN).length, 'nama');
}
if (process.argv[1] === fileURLToPath(import.meta.url)) { if (process.argv[2] === 'ambil') await ambil(); else if (process.argv[2] === 'bangun') bangun(); }
