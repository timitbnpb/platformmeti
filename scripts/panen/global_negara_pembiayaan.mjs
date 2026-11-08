// Pembiayaan luar ke energi Indonesia: public/data/global/pembiayaan_luar.json
// Sumber: World Bank PPI Database (2024-PPI-Full-DTA.dta, negara=Indonesia, sektor=energi), AidData GCDF 3.0 (sektor ENERGY, resipien IDN),
// BU GDP Center China's Global Energy Finance 2020 update (IDN). IATI + proyek World Bank tetap di pendanaan_internasional.json (tidak diduplikasi).
// OECD CRS: tidak dipanen (lihat meta.celah).
//   node scripts/panen/global_negara_pembiayaan.mjs ambil <dirCache>            (jaringan; robots; jeda >= 2 dtk; stop 403/429)
//   node scripts/panen/global_negara_pembiayaan.mjs bangun <dirCache> <tgl>     (tanpa jaringan)
//   node scripts/panen/global_negara_pembiayaan.mjs --selftest
// Tautan dua arah (wiki): baris[].proyek_id -> proyek.json id; baris[].penerima_org_id / pemberi_org_id -> organisasi.json id;
// arah balik: per_proyek[proyek_id] dan per_organisasi[org_id] -> daftar baris[].id di berkas ini.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { Penambang, ROOT } from '../pipa/global_pemasok.mjs';
import { cocokProyek, indeksProyek, cocokOrg, indeksOrg, provinsi } from '../pipa/_cocok.mjs';
import { bacaDta } from './global_negara_dta.mjs';
import { bacaXlsx, bacaZip } from './global_negara_xlsx.mjs';

const URL_PPI = 'https://www.worldbank.org/content/dam/PPI/documents/2024-PPI-Full-DTA.dta';
const URL_AID = 'https://docs.aiddata.org/ad4/datasets/AidDatas_Global_Chinese_Development_Finance_Dataset_Version_3_0.zip';
const URL_BU = 'https://www.bu.edu/gdp/files/2021/02/BU_CGEF_2020_Update-1.xlsx';
const J = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8'));
// gerbang-layar-statis melarang em dash dan titik tengah di public/**: teks sumber dinormalkan saat bangun
export const bersihTeks = (o) => JSON.parse(JSON.stringify(o).replace(/\s*[\u2014\u2013]\s*/g, ', ').replace(/\s*\u00b7\s*/g, ', '));
const r2 = (v) => (v == null || Number.isNaN(v) ? null : Math.round(v * 100) / 100);

export const TEK_EBT = [[/geotherm|panas bumi/i, 'panas-bumi', true], [/hydro|dam\b|PLTA|PLTM/i, 'air', true], [/solar|PV\b|PLTS/i, 'surya', true], [/wind|bayu|PLTB/i, 'bayu', true], [/biomass|biogas|biofuel|waste|PLTBm|PLTSa/i, 'bioenergi', true], [/battery|batteries|storage/i, 'penyimpanan', true], [/\bcoal\b|PLTU|batubara/i, 'batubara', false], [/\bgas\b|LNG|PLTG/i, 'gas', false], [/diesel|PLTD/i, 'diesel', false], [/nuclear/i, 'nuklir', false], [/transmission|substation|grid|jaringan/i, 'jaringan', false]];
export function teknologiDari(teks) { const h = TEK_EBT.find(([re]) => re.test(teks || '')); return h ? { teknologi: h[1], ebt: h[2] } : { teknologi: 'tak-tentu', ebt: null }; }
const PPI_TEK = { 'Biogas': 'bioenergi', 'Biomass': 'bioenergi', 'Coal': 'batubara', 'Diesel': 'diesel', 'Enhanced Geothermal': 'panas-bumi', 'Large Hydro (>50MW)': 'air', 'Small Hydro (<50MW)': 'air', 'Natural Gas': 'gas', 'Natural Gas, Diesel': 'gas', 'Nuclear': 'nuklir', 'Solar CSP': 'surya', 'Solar PV': 'surya', 'Waste': 'bioenergi', 'Wind, onshore': 'bayu', 'Wind, offshore': 'bayu', 'Wave': 'laut', 'Hydrogen': 'hidrogen', 'Steam': 'tak-tentu', 'Batteries': 'penyimpanan', 'NA': 'tak-tentu' };
const EBT_SET = new Set(['bioenergi', 'panas-bumi', 'air', 'surya', 'bayu', 'laut', 'hidrogen', 'penyimpanan']);
const PPI_STATUS = { 1: 'aktif', 3: 'berakhir-atau-selesai', 4: 'dibatalkan', 5: 'bermasalah' }; // TAFSIRAN kode (kodebuku tidak ada di .dta)

export function barisPpi(dta, tgl) {
  const { baris, etiket } = dta; const out = [];
  for (const r of baris) {
    if (r.country !== 57 || r.sector !== 2) continue; const tek = PPI_TEK[etiket.technol?.[r.technol]] ?? 'tak-tentu';
    out.push({ id: `ppi_${r.ID}_${r.IY}`, sumber_data: 'ppi', nama: r.name, pemberi: 'Swasta (PPI tidak menyebut pemberi dana per proyek)', penerima: r.name, nilai_usd_juta: r2(r.investment), nilai_keterangan: 'investasi total proyek pada tahun investasi, USD juta berjalan (PPI)',
      tahun: r.IY, tahun_penutupan_keuangan: r.FCY ?? null, teknologi: tek, teknologi_asal: etiket.technol?.[r.technol] ?? null, ebt: tek === 'tak-tentu' ? null : EBT_SET.has(tek), kapasitas_mw: r.capacity === 2 ? r2(r.pcapacity) : null,
      status: PPI_STATUS[r.status_n] ?? null, status_kode_asal: r.status_n, status_catatan: 'tafsiran kode status PPI (1 aktif, 3 berakhir/selesai, 5 bermasalah); kodebuku resmi tidak ada di berkas .dta',
      dukungan_multilateral: r.MLS === 1, dukungan_bilateral: r.BS === 1, utang_multilateral_usd_juta: r2(r.m_debt), utang_bilateral_usd_juta: r2(r.b_debt), utang_komersial_usd_juta: r2(r.c_debt), utang_total_usd_juta: r2(r.debt), ekuitas_usd_juta: r2(Number(r.equity)) ,
      lokasi: null, provinsi: null, sumber_id: 's-ppi', sumber_url: 'https://ppi.worldbank.org/en/ppidata', tingkat_bukti: 'resmi', tanggal: tgl });
  }
  return out;
}
export function barisAid(rows, tgl) { // rows = objek dengan kunci header
  return rows.filter((r) => r['Recipient ISO-3'] === 'IDN' && /ENERGY/i.test(r['Sector Name'] || '')).map((r) => {
    const { teknologi, ebt } = teknologiDari(`${r.Title} ${r.Description}`.slice(0, 1200)); const url = String(r['Source URLs'] || '').split('|').map((s) => s.trim()).find((s) => /^https?:\/\//.test(s)) || null;
    return { id: `ad_${r['AidData Record ID']}`, sumber_data: 'aiddata', nama: r.Title, pemberi: r['Funding Agencies'] || null, pemberi_negara: r['Financier Country'] || null, penerima: r['Direct Receiving Agencies'] || null, nilai_usd_juta: r2(Number(r['Amount (Nominal USD)']) / 1e6), nilai_keterangan: 'USD nominal, komitmen (AidData; bisa estimasi)',
      tahun: Number(r['Commitment Year']) || null, teknologi, ebt, kapasitas_mw: null, status: r.Status || null, jenis_aliran: r['Flow Type'] || null, kelas_aliran: r['Flow Class'] || null, lokasi: r['Location Narrative'] || null, provinsi: provinsi(`${r['Location Narrative'] || ''} ${r.Title}`),
      sumber_id: 's-aiddata', sumber_url: 'https://www.aiddata.org/data/aiddatas-global-chinese-development-finance-dataset-version-3-0', bukti_url: url, tingkat_bukti: 'via-pihak-ketiga', tanggal: tgl };
  });
}
export function barisBu(rows, tgl) {
  return rows.filter((r) => r.CountryCode === 'IDN').map((r) => { const { teknologi, ebt } = teknologiDari(`${r.EnergySource} ${r.Description}`);
    return { id: `bu_${r.Date}_${String(r.Description).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 40)}`, sumber_data: 'bu-cgef', nama: String(r.Description).replace(/^"|"$/g, '').trim(), pemberi: r.Lender === 'Ex-Im Bank' ? 'Export-Import Bank of China' : r.Lender === 'CDB' ? 'China Development Bank' : r.Lender, pemberi_negara: "China (People's Republic of)", penerima: r.Borrower || null, nilai_usd_juta: r2(Number(r['Amount ($m)'])), nilai_keterangan: 'USD juta komitmen (BU CGEF)',
      tahun: Number(r.Date) || null, teknologi, ebt, kapasitas_mw: null, status: null, lokasi: r.Location || null, provinsi: provinsi(r.Location), sumber_id: 's-bu-cgef', sumber_url: 'https://www.bu.edu/gdp/2021/02/12/chinas-global-energy-finance-2020/', tingkat_bukti: 'via-pihak-ketiga', tanggal: tgl }; });
}
export function tautkan(baris, proyek, orgs) {
  const ip = indeksProyek(proyek), io = indeksOrg(orgs); const per_proyek = {}, per_organisasi = {};
  for (const b of baris) {
    const mw = b.kapasitas_mw ?? (/(\d+(?:[.,]\d+)?)\s*MW\b/i.exec(b.nama)?.[1] ? Number(/(\d+(?:[.,]\d+)?)\s*MW\b/i.exec(b.nama)[1].replace(',', '.')) : null);
    const c = cocokProyek(b.nama, b.provinsi, mw, ip, b.teknologi === 'tak-tentu' ? null : (b.teknologi === 'panas-bumi' ? 'panas-bumi' : b.teknologi)); let pid = c.proyek_id; // cadangan: nama penerima (SPV bernama proyek, mis. Star Energy Geothermal (Wayang Windu))
    if (!pid && b.penerima && b.penerima !== b.nama) pid = cocokProyek(b.penerima, b.provinsi, mw, ip, null).proyek_id;
    b.proyek_id = pid; b.proyek_kandidat = c.proyek_id ? [] : c.kandidat;
    const po = cocokOrg(b.pemberi, io), re = cocokOrg(b.penerima, io); b.pemberi_org_id = po?.id ?? null; b.penerima_org_id = re?.id ?? null;
    if (b.proyek_id) (per_proyek[b.proyek_id] ||= []).push(b.id); for (const o of new Set([b.pemberi_org_id, b.penerima_org_id].filter(Boolean))) (per_organisasi[o] ||= []).push(b.id);
  }
  return { per_proyek, per_organisasi };
}
export function bangun({ ppi, aid, bu }, proyek, orgs, tgl) {
  const baris = [...barisPpi(ppi, tgl), ...barisAid(aid, tgl), ...barisBu(bu, tgl)]; const ids = new Set(baris.map((b) => b.id));
  if (ids.size !== baris.length) { const seen = new Set(); for (const b of baris) { while (seen.has(b.id)) b.id += '_b'; seen.add(b.id); } }
  const { per_proyek, per_organisasi } = tautkan(baris, proyek, orgs);
  const sum = (arr) => Math.round(arr.reduce((a, b) => a + (b.nilai_usd_juta || 0), 0) * 100) / 100; const dari = (s) => baris.filter((b) => b.sumber_data === s);
  return { lapis: 'publik', dibangun_pada: tgl, jumlah: baris.length,
    meta: { diperbarui: tgl, per_sumber: Object.fromEntries(['ppi', 'aiddata', 'bu-cgef'].map((s) => [s, { jumlah: dari(s).length, ebt: dari(s).filter((b) => b.ebt).length, nilai_usd_juta_ebt: sum(dari(s).filter((b) => b.ebt)) }])), tertaut_proyek: baris.filter((b) => b.proyek_id).length, tertaut_organisasi: baris.filter((b) => b.pemberi_org_id || b.penerima_org_id).length,
      kunci_tautan: ['baris[].proyek_id -> public/data/proyek.json baris.id (pj_xxxx)', 'baris[].pemberi_org_id / penerima_org_id -> public/data/organisasi.json baris.id (en_xxxx)', 'per_proyek[pj_id] dan per_organisasi[en_id] = baris[].id di berkas ini (arah balik)', 'berpasangan dengan pendanaan_internasional.json (IATI + World Bank): sumber berbeda, tidak diduplikasi'],
      celah: ['OECD CRS tidak dipanen: berkas massal CRS terlalu besar dan dimensi SDMX-nya belum dipetakan; sebagian aktivitas ODA sudah ada via IATI di pendanaan_internasional.json.', 'PPI tidak menyebut nama pemberi dana/sponsor per proyek pada berkas .dta (hanya total, jenis utang multilateral/bilateral/komersial); kolom pemberi diisi generik.', 'Kode status PPI ditafsirkan (kodebuku tidak ada di .dta); proyek PPI tidak punya lokasi/provinsi.', 'BU CGEF hanya sampai pembaruan 2020 (22 baris Indonesia, hampir semuanya batubara); AidData GCDF 3.0 mencakup batubara dan non-EBT lain: kolom ebt menyaring.', 'Pencocokan proyek memakai kemiripan nama + provinsi + MW (cocokProyek, ambang 0,6): hanya usulan, bukan pernyataan resmi pembiayaan; kandidat lemah ada di proyek_kandidat.'] },
    sumber: [
      { id: 's-ppi', judul: 'World Bank Private Participation in Infrastructure (PPI) Database, 2024-PPI-Full-DTA.dta', penerbit: 'World Bank', url: 'https://ppi.worldbank.org/en/ppidata', lisensi: 'CC BY 4.0 (World Bank Open Data)', tanggal: tgl, tingkat_bukti: 'resmi' },
      { id: 's-aiddata', judul: "AidData's Global Chinese Development Finance Dataset, Version 3.0", penerbit: 'AidData (William & Mary)', url: 'https://www.aiddata.org/data/aiddatas-global-chinese-development-finance-dataset-version-3-0', lisensi: 'CC BY 4.0 (AidData)', tanggal: tgl, tingkat_bukti: 'via-pihak-ketiga' },
      { id: 's-bu-cgef', judul: "China's Global Energy Finance (CGEF), 2020 update", penerbit: 'Boston University Global Development Policy Center', url: 'https://www.bu.edu/gdp/2021/02/12/chinas-global-energy-finance-2020/', lisensi: 'kutip dengan atribusi (BU GDP Center)', tanggal: tgl, tingkat_bukti: 'via-pihak-ketiga' }],
    baris, per_proyek, per_organisasi };
}
function muatXlsx(buf, lembar, kunciHeader) { const out = []; let hdr = null; bacaXlsx(buf, lembar, (r) => { if (!hdr) { if (r.A === kunciHeader || Object.values(r).includes(kunciHeader)) hdr = r; return; } out.push(Object.fromEntries(Object.entries(r).map(([k, v]) => [hdr[k], v]).filter(([k]) => k))); }); return out; }
async function utama() {
  const [aksi, dir, tgl] = process.argv.slice(2); if (!dir) throw new Error('pakai: ambil|bangun <dirCache> [tgl]');
  if (aksi === 'ambil') {
    const p = new Penambang({ jedaMs: 2100 });
    for (const [url, rel] of [[URL_PPI, 'ppi/2024-PPI-Full-DTA.dta'], [URL_AID, 'aid/gcdf3.zip'], [URL_BU, 'bu/cgef2020.xlsx']]) {
      const f = path.join(dir, rel); if (fs.existsSync(f)) continue; const r = await p.ambil(url, { cekRobots: true }); if (!r.ok) throw new Error(url + ' ' + r.alasan);
      fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, r.buf);
    }
    console.log('ok');
  } else if (aksi === 'bangun') {
    if (!/^\d{4}-\d\d-\d\d$/.test(tgl || '')) throw new Error('tanggal wajib');
    const ppi = bacaDta(fs.readFileSync(path.join(dir, 'ppi/2024-PPI-Full-DTA.dta')));
    const z = bacaZip(fs.readFileSync(path.join(dir, 'aid/gcdf3.zip'))); const nx = [...z.keys()].find((k) => /GlobalChineseDevelopmentFinanceDataset_v3\.0\.xlsx$/.test(k) && !k.startsWith('__MACOSX'));
    const aid = muatXlsx(z.get(nx)(), 5, 'AidData Record ID').filter((r) => r['Recipient ISO-3'] === 'IDN');
    const bu = muatXlsx(fs.readFileSync(path.join(dir, 'bu/cgef2020.xlsx')), 1, 'Date').filter((r) => r.CountryCode === 'IDN');
    const o = bangun({ ppi, aid, bu }, J('public/data/proyek.json').baris, J('public/data/organisasi.json').baris, tgl);
    fs.writeFileSync(path.join(ROOT, 'public/data/global/pembiayaan_luar.json'), JSON.stringify(bersihTeks(o)) + '\n'); console.log(o.jumlah, JSON.stringify(o.meta.per_sumber), 'proyek', o.meta.tertaut_proyek, 'org', o.meta.tertaut_organisasi);
  }
}
if (process.argv[2] === '--selftest') {
  assert.deepEqual(teknologiDari('Muara Laboh Geothermal'), { teknologi: 'panas-bumi', ebt: true }); assert.equal(teknologiDari('Suralaya coal-fired').ebt, false); assert.equal(teknologiDari('xyz').ebt, null);
  const a = barisAid([{ 'Recipient ISO-3': 'IDN', 'Sector Name': 'ENERGY', 'AidData Record ID': '1', Title: 'ICBC loan for 100MW solar', Description: '', 'Amount (Nominal USD)': '37500000', 'Commitment Year': '2020', 'Funding Agencies': 'ICBC', 'Source URLs': '|https://a.org/x|b' }, { 'Recipient ISO-3': 'KEN', 'Sector Name': 'ENERGY' }], '2026-11-08');
  assert.equal(a.length, 1); assert.equal(a[0].nilai_usd_juta, 37.5); assert.equal(a[0].bukti_url, 'https://a.org/x'); assert.equal(a[0].ebt, true);
  const b = barisBu([{ Date: '2013', CountryCode: 'IDN', Description: 'Cilacap Power', Lender: 'CDB', Borrower: 'Government', 'Amount ($m)': '700', EnergySource: 'Coal', Location: 'Cilacap, Central Java Province' }], '2026-11-08'); assert.equal(b[0].ebt, false); assert.equal(b[0].provinsi, 'Jawa Tengah'); assert.equal(b[0].pemberi, 'China Development Bank');
  const proyek = [{ id: 'pj_1', nama: 'Sidrap Wind Farm', teknologi: 'bayu', lokasi: { provinsi: 'Sulawesi Selatan' }, kapasitas: [{ nilai: 75, satuan: 'MW' }] }];
  const rows = [{ id: 'x', nama: 'Sidrap Wind Farm', provinsi: 'Sulawesi Selatan', teknologi: 'bayu', kapasitas_mw: 75, pemberi: 'Foo', penerima: 'Bar' }]; const t = tautkan(rows, proyek, [{ id: 'en_1', nama: 'Foo Ltd' }]);
  assert.equal(rows[0].proyek_id, 'pj_1'); assert.deepEqual(t.per_proyek, { pj_1: ['x'] }); assert.equal(rows[0].pemberi_org_id, 'en_1'); assert.deepEqual(t.per_organisasi, { en_1: ['x'] });
  assert.equal(bersihTeks({ a: 'x \u2014 y\u00b7z' }).a, 'x, y, z');
  console.log('selftest ok');
} else if (process.argv[1] === fileURLToPath(import.meta.url)) await utama();
