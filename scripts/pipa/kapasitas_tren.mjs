// public/data/kapasitas_tren.json: kapasitas terpasang (MW) dan pembangkitan (GWh) EBT Indonesia per teknologi per tahun (IRENA), plus pangsa EBT (IRENA, World Bank WDI).
//   node scripts/pipa/kapasitas_tren.mjs ambil <dirMentah>          (jaringan: pxweb.irena.org, api.worldbank.org; jeda >= 2 dtk)
//   node scripts/pipa/kapasitas_tren.mjs bangun <dirMentah> <tgl>   (tanpa jaringan; tanggal dari masukan)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ambil } from './_panen_sopan.mjs';

const PX = 'https://pxweb.irena.org/api/v1/en/IRENASTAT/Power%20Capacity%20and%20Generation/';
const SUMBER = [
  { id: 's-irena', lisensi: 'IRENA: bebas dipakai dengan atribusi IRENASTAT (syarat penggunaan IRENA)', judul: 'IRENASTAT Renewable Energy Statistics 2026, Electricity statistics by Country/area (Indonesia)', penerbit: 'International Renewable Energy Agency (IRENA)', tahun: 2026, url: 'https://pxweb.irena.org/pxweb/en/IRENASTAT/IRENASTAT__Power%20Capacity%20and%20Generation/', tingkat_bukti: 'resmi' },
  { id: 's-irena-pangsa', lisensi: 'IRENA: bebas dipakai dengan atribusi IRENASTAT (syarat penggunaan IRENA)', judul: 'IRENASTAT RE share of electricity capacity and generation (%), Indonesia', penerbit: 'International Renewable Energy Agency (IRENA)', tahun: 2026, url: 'https://pxweb.irena.org/pxweb/en/IRENASTAT/IRENASTAT__Power%20Capacity%20and%20Generation/', tingkat_bukti: 'resmi' },
  { id: 's-wb', lisensi: 'CC BY 4.0 (World Bank Open Data)', judul: 'World Development Indicators EG.ELC.RNEW.ZS: Renewable electricity output (% of total electricity output), Indonesia', penerbit: 'World Bank', tahun: 2026, url: 'https://data.worldbank.org/indicator/EG.ELC.RNEW.ZS?locations=ID', tingkat_bukti: 'resmi' } ];
// Teknologi EBT (kode IRENA) -> kunci taksonomi METI. Total dan nonEBT hanya untuk penyebut.
// Kunci taksonomi METI (public/taksonomi.js) per teknologi IRENA; null = tidak ada padanan (jangan dijumlahkan ke taksonomi).
export const TAKSONOMI = { air: 'hidro', surya: 'surya', bayu: 'bayu', panas_bumi: 'panas-bumi', bioenergi_padat: 'bioenergi', biogas: 'bioenergi', bahan_bakar_cair_nabati: 'bioenergi', sampah_terbarukan: 'biomassa-sampah', penyimpanan_pumped_hydro: 'penyimpanan' };
export const TEKNOLOGI = { 'Renewable hydropower': 'air', 'Solar photovoltaic': 'surya', 'Onshore wind energy': 'bayu', 'Geothermal energy': 'panas_bumi', 'Solid biofuels': 'bioenergi_padat', 'Gas biofuels': 'biogas', 'Liquid biofuels': 'bahan_bakar_cair_nabati', 'Renewable waste': 'sampah_terbarukan', 'Offshore wind energy': 'bayu_lepas_pantai', 'Solar thermal energy': 'surya_termal', 'Marine energy': 'laut', 'Total Renewable': 'total_ebt', 'Total Non-Renewable': 'total_non_ebt', 'Mixed hydropower': 'air_campuran', 'Pure hydropower': 'air_murni', 'Mechanical storage (Pumped hydro)': 'penyimpanan_pumped_hydro' };

export function uraiJsonStat(d, dimTek = 'Technology') { // -> [{teknologi_asal,tahun,jenis,grid,nilai}], jenis dari "Data Type"
  const ids = d.id, size = d.size; const lab = (k) => d.dimension[k].category;
  const idx = (k) => Object.keys(lab(k).index || lab(k).label);
  const cats = ids.map(idx); const out = [];
  const total = size.reduce((a, b) => a * b, 1); if (d.value.length !== total) throw new Error('json-stat: panjang value tak cocok');
  for (let i = 0; i < total; i++) {
    let r = i; const pos = []; for (let k = ids.length - 1; k >= 0; k--) { pos[k] = r % size[k]; r = Math.floor(r / size[k]); }
    const row = {}; ids.forEach((id, k) => { row[id] = lab(id).label[cats[k][pos[k]]]; });
    row.nilai = d.value[i]; out.push(row);
  }
  return out;
}
export function bangunData(irena, pangsa, wb, tgl) {
  const bar = new Map(); const celah = [];
  for (const r of uraiJsonStat(irena)) {
    if (r['Grid connection'] !== 'All') continue; const k = TEKNOLOGI[r.Technology]; if (!k || r.nilai == null) continue;
    const key = k + '|' + r.Year; const b = bar.get(key) || { teknologi: k, taksonomi: TAKSONOMI[k] ?? null, teknologi_asal: r.Technology, tahun: Number(r.Year), kapasitas_mw: null, pembangkitan_gwh: null, sumber_id: 's-irena', tingkat_bukti: 'resmi', tanggal: tgl };
    if (/Capacity/.test(r['Data Type'])) b.kapasitas_mw = r.nilai; else b.pembangkitan_gwh = r.nilai; bar.set(key, b);
  }
  const baris = [...bar.values()].filter((b) => b.tahun >= 2000).sort((a, b) => a.teknologi.localeCompare(b.teknologi) || a.tahun - b.tahun);
  const pg = uraiJsonStat(pangsa).filter((r) => r.nilai != null).map((r) => ({ tahun: Number(r.Year), indikator: /capacity/.test(r.Indicator) ? 'pangsa_kapasitas_ebt_persen' : 'pangsa_pembangkitan_ebt_persen', nilai: r.nilai, sumber_id: 's-irena-pangsa', tingkat_bukti: 'resmi', tanggal: tgl }));
  const wbRows = (Array.isArray(wb) ? wb[1] : []).filter((r) => r.value != null && Number(r.date) >= 2000).map((r) => ({ tahun: Number(r.date), indikator: 'pangsa_listrik_terbarukan_wdi_persen', nilai: Math.round(r.value * 100) / 100, sumber_id: 's-wb', tingkat_bukti: 'resmi', tanggal: tgl }));
  const pangsaAll = [...pg, ...wbRows].sort((a, b) => a.indikator.localeCompare(b.indikator) || a.tahun - b.tahun);
  const thn = baris.map((b) => b.tahun); const akhir = Math.max(...thn);
  const wbMax = Math.max(0, ...wbRows.map((r) => r.tahun));
  celah.push(`Rentang kapasitas: ${Math.min(...thn)}-${akhir} (rilis IRENA 2026 H2). IRENA memakai kapasitas terpasang akhir tahun; tahun terbaru bersifat sementara dan dapat direvisi.`);
  if (wbMax < akhir) celah.push(`World Bank WDI EG.ELC.RNEW.ZS hanya terisi sampai ${wbMax}; tahun sesudahnya kosong di sumber (null), tidak diisi dari tempat lain.`);
  const gMax = Math.max(...baris.filter((b) => b.pembangkitan_gwh != null).map((b) => b.tahun));
  if (gMax < akhir) celah.push(`Pembangkitan GWh terisi sampai ${gMax}; ${gMax + 1}-${akhir} null (belum dirilis IRENA).`);
  celah.push('air_campuran, air_murni dan penyimpanan_pumped_hydro adalah rincian/irisan IRENA; jangan dijumlahkan dengan air. Pembangkitan GWh per teknologi tersedia hanya bila IRENA mempublikasikannya; sel kosong = tidak ada nilai di sumber. Angka IRENA mencakup on-grid dan off-grid; PLN/ESDM bisa berbeda (definisi dan cakupan).');
  return { lapis: 'publik', dibangun_pada: tgl, jumlah: baris.length, baris, pangsa: pangsaAll, sumber: SUMBER, meta: { diperbarui: tgl, lisensi_sumber: 'IRENA: bebas dipakai dengan atribusi (terms of use IRENA); World Bank: CC BY 4.0', celah } };
}
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [cmd, dir, tgl] = process.argv.slice(2); const w = (n) => path.join(dir, n);
  const Q = (code) => JSON.stringify({ query: [{ code, selection: { filter: 'item', values: ['IDN'] } }], response: { format: 'json-stat2' } });
  if (cmd === 'ambil') {
    fs.mkdirSync(dir, { recursive: true });
    const h = { 'content-type': 'application/json' };
    fs.writeFileSync(w('irena.json'), JSON.stringify(await ambil(PX + 'Country_ELECSTAT_2026_H2_PX.px', { json: true, method: 'POST', body: Q('Country/area'), headers: h })));
    fs.writeFileSync(w('irena_pangsa.json'), JSON.stringify(await ambil(PX + 'RE-SHARE_2026_H2_PX.px', { json: true, method: 'POST', body: Q('Region/country/area'), headers: h })));
    fs.writeFileSync(w('wb_rnew.json'), JSON.stringify(await ambil('https://api.worldbank.org/v2/country/IDN/indicator/EG.ELC.RNEW.ZS?format=json&per_page=100', { json: true })));
  } else if (cmd === 'bangun' && tgl) {
    const r = (n) => JSON.parse(fs.readFileSync(w(n), 'utf8'));
    const out = bangunData(r('irena.json'), r('irena_pangsa.json'), r('wb_rnew.json'), tgl);
    const f = path.join(ROOT, 'public/data/kapasitas_tren.json'); fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(f, JSON.stringify(out) + '\n'); console.log('kapasitas_tren:', out.jumlah, 'baris,', out.pangsa.length, 'pangsa');
  } else { console.error('pakai: ambil <dir> | bangun <dir> <tgl>'); process.exit(2); }
}
