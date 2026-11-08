// Pembanding negara + lelang dunia: public/data/global/negara_pembanding.json dan lelang_dunia.json.
//   node scripts/panen/global_negara.mjs ambil <dirCache>          (jaringan: pxweb.irena.org, raw.githubusercontent.com OWID; jeda >= 2 dtk)
//   node scripts/panen/global_negara.mjs bangun <dirCache> <tgl>   (tanpa jaringan)
//   node scripts/panen/global_negara.mjs --selftest
// Kapasitas/pembangkitan: IRENASTAT Country_ELECSTAT_2026_H2 (sambungan "All"); investasi publik: IRENASTAT PUBFIN_2026_H2;
// bauran listrik: OWID energy-data (memuat Ember Yearly Electricity Data). Target/skema/lelang: global_negara_kurasi.mjs (kurasi bersumber URL).
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { Penambang, ROOT } from '../pipa/global_pemasok.mjs';
import { uraiJsonStat } from '../pipa/kapasitas_tren.mjs';
import { NEGARA, CELAH_NEGARA, LELANG, CELAH_LELANG, TGL } from './global_negara_kurasi.mjs';

const PX = 'https://pxweb.irena.org/api/v1/en/IRENASTAT/';
const URL_ELEC = PX + 'Power%20Capacity%20and%20Generation/Country_ELECSTAT_2026_H2_PX.px';
const URL_PUB = PX + 'Finance/PUBFIN_2026_H2_PX.px';
const URL_OWID = 'https://raw.githubusercontent.com/owid/energy-data/master/owid-energy-data.csv';
const ISO3 = NEGARA.map((n) => n.iso3);
const LABEL_IRENA = { 'Viet Nam': 'VNM', Philippines: 'PHL', Thailand: 'THA', Malaysia: 'MYS', India: 'IND', China: 'CHN', Australia: 'AUS', Brazil: 'BRA', 'South Africa': 'ZAF', Chile: 'CHL', 'Saudi Arabia': 'SAU', Indonesia: 'IDN' };
export const TEK = { 'Solar photovoltaic': 'surya', 'Solar thermal energy': 'surya_termal', 'Onshore wind energy': 'bayu_darat', 'Offshore wind energy': 'bayu_lepas_pantai', 'Renewable hydropower': 'air', 'Mechanical storage (Pumped hydro)': 'pumped_storage', 'Geothermal energy': 'panas_bumi', 'Solid biofuels': 'bioenergi_padat', 'Gas biofuels': 'biogas', 'Liquid biofuels': 'biofuel_cair', 'Renewable waste': 'sampah_terbarukan', 'Marine energy': 'laut', 'Total Renewable': 'total_ebt', 'Total Non-Renewable': 'total_non_ebt' };
const NON_EBT_PUB = new Set(['Other fossil fuels', 'Nuclear energy', 'Natural gas', 'Oil', 'Coal', 'Non-renewable waste']);
const T0 = 2010;

export function bangunDeret(rowsIrena) { // -> {iso3: {kapasitas_mw:{tek:{tahun:nilai}}, pembangkitan_gwh:{...}}}
  const out = {};
  for (const r of rowsIrena) {
    if (r['Grid connection'] !== 'All' || r.nilai == null) continue; const iso = LABEL_IRENA[r['Country/area']]; const k = TEK[r.Technology]; const y = Number(r.Year);
    if (!iso || !k || y < T0) continue;
    const jenis = /Capacity/.test(r['Data Type']) ? 'kapasitas_mw' : 'pembangkitan_gwh';
    ((out[iso] ||= { kapasitas_mw: {}, pembangkitan_gwh: {} })[jenis][k] ||= {})[y] = r.nilai;
  }
  return out;
}
export function bangunPub(rows) { // investasi publik (juta USD 2023) per negara-tahun: ebt, non_ebt, per_teknologi
  const out = {};
  for (const r of rows) {
    if (r.nilai == null) continue; const iso = LABEL_IRENA[r['Country/area']] || null; const y = Number(r.Year); if (!iso || y < T0) continue;
    const d = ((out[iso] ||= {})[y] ||= { ebt: 0, non_ebt: 0, per_teknologi: {} });
    const non = NON_EBT_PUB.has(r.Technology); d[non ? 'non_ebt' : 'ebt'] += r.nilai; d.per_teknologi[r.Technology] = Math.round(r.nilai * 100) / 100;
  }
  for (const o of Object.values(out)) for (const d of Object.values(o)) { d.ebt = Math.round(d.ebt * 100) / 100; d.non_ebt = Math.round(d.non_ebt * 100) / 100; }
  return out;
}
export function parseCsv(txt) { // CSV sederhana (tanpa koma dalam tanda kutip pada kolom yang dipakai); header -> objek
  const L = txt.split(/\r?\n/).filter(Boolean); const h = L[0].split(','); const i = Object.fromEntries(h.map((n, k) => [n, k]));
  return { h, i, baris: L.slice(1).map((l) => l.split(',')) };
}
const OWID_KOLOM = { surya: 'solar_share_elec', angin: 'wind_share_elec', hidro: 'hydro_share_elec', bioenergi: 'biofuel_share_elec', ebt_lain_tanpa_bioenergi: 'other_renewables_share_elec_exc_biofuel', nuklir: 'nuclear_share_elec', batubara: 'coal_share_elec', gas: 'gas_share_elec', minyak: 'oil_share_elec', ebt_total: 'renewables_share_elec' };
export function bangunBauran(csv) {
  const out = {}; const { i, baris } = csv;
  for (const b of baris) {
    const iso = b[i.iso_code]; if (!ISO3.includes(iso)) continue; const y = Number(b[i.year]); if (y < T0) continue;
    const o = (out[iso] ||= { deret: {} });
    for (const [k, col] of Object.entries(OWID_KOLOM)) { const v = b[i[col]]; if (v === '' || v == null || Number.isNaN(Number(v))) continue; ((o.deret[k] ||= {})[y] = Math.round(Number(v) * 100) / 100); }
  }
  for (const o of Object.values(out)) {
    const th = Math.max(...Object.values(o.deret.ebt_total || {}).length ? Object.keys(o.deret.ebt_total).map(Number) : [0]);
    o.tahun_terbaru = th || null; o.persen_terbaru = Object.fromEntries(Object.entries(OWID_KOLOM).map(([k]) => [k, o.deret[k]?.[th] ?? null]));
  }
  return out;
}
export function bangun(irena, pub, owid, tgl) {
  const deret = bangunDeret(irena), investasi = bangunPub(pub), bauran = bangunBauran(owid);
  const baris = NEGARA.map((n) => ({
    iso2: n.iso2, iso3: n.iso3, nama: n.nama, nama_en: n.nama_en, kelompok: n.kelompok,
    kapasitas_mw: deret[n.iso3]?.kapasitas_mw ?? null, pembangkitan_gwh: deret[n.iso3]?.pembangkitan_gwh ?? null,
    bauran_listrik: bauran[n.iso3] ? { sumber_id: 's-owid', tingkat_bukti: 'via-pihak-ketiga', satuan: 'persen pembangkitan listrik', ...bauran[n.iso3] } : null,
    investasi_publik_usd_juta_2023: investasi[n.iso3] ? { sumber_id: 's-irena-pubfin', tingkat_bukti: 'resmi', per_tahun: investasi[n.iso3] } : null,
    target: n.target, skema: n.skema, local_content: n.local_content, harga_ppa_fit: [], biaya_rata2: [],
    ...(n.tautan_internal ? { tautan_internal: n.tautan_internal } : {}),
    sumber_kapasitas_id: 's-irena', tingkat_bukti_kapasitas: 'resmi',
    lelang_ids: LELANG.filter((l) => l.iso2 === n.iso2).map((l) => l.id),
  }));
  const sumber = [
    { id: 's-irena', judul: 'IRENASTAT Renewable Energy Statistics 2026 (H2), Electricity statistics by Country/area, Technology, Data Type, Grid connection and Year', penerbit: 'International Renewable Energy Agency (IRENA)', url: 'https://pxweb.irena.org/pxweb/en/IRENASTAT/IRENASTAT__Power%20Capacity%20and%20Generation/', lisensi: 'IRENA: bebas dipakai dengan atribusi IRENASTAT', tanggal: tgl, tingkat_bukti: 'resmi' },
    { id: 's-irena-pubfin', judul: 'IRENASTAT Public Investments (2023 Million USD) by Country/area, Technology and Year (PUBFIN_2026_H2)', penerbit: 'IRENA', url: 'https://pxweb.irena.org/pxweb/en/IRENASTAT/IRENASTAT__Finance/', lisensi: 'IRENA: atribusi IRENASTAT', tanggal: tgl, tingkat_bukti: 'resmi' },
    { id: 's-owid', judul: 'Our World in Data energy-data (memuat Ember Yearly Electricity Data), kolom *_share_elec', penerbit: 'Our World in Data / Ember', url: 'https://github.com/owid/energy-data', lisensi: 'CC BY 4.0', tanggal: tgl, tingkat_bukti: 'via-pihak-ketiga' },
    { id: 's-kurasi', judul: 'Kurasi tangan target dan skema; URL sumber tiap butir di berkas', penerbit: 'beragam (lihat sumber_url tiap butir)', url: null, lisensi: 'ringkasan fakta dengan atribusi', tanggal: TGL, tingkat_bukti: 'via-pihak-ketiga' },
  ];
  const celah = [...CELAH_NEGARA, `Kapasitas/pembangkitan: ${T0}-2025 menurut IRENASTAT 2026 H2; tahun terakhir bisa sementara. Grid 'All' (on-grid + off-grid).`, 'Bauran listrik OWID/Ember: tahun terbaru berbeda tiap negara bila Ember belum merilis; panas bumi masuk ebt_lain_tanpa_bioenergi.'];
  const pembanding = { lapis: 'publik', dibangun_pada: tgl, jumlah: baris.length, meta: { diperbarui: tgl, tahun_awal: T0, kunci_tautan: ['iso3 = asean.json / asean_energi.json baris.iso3', 'iso2 = lelang_dunia.json baris.iso2', 'baris[].lelang_ids = lelang_dunia.json baris.id', 'Indonesia: tautan_internal menunjuk berkas Indonesia yang sudah ada (tidak diduplikasi)'], celah }, sumber, baris };
  const lelang = { lapis: 'publik', dibangun_pada: tgl, jumlah: LELANG.length, meta: { diperbarui: tgl, kunci_tautan: ['iso2 = negara_pembanding.json baris.iso2', 'id baris = negara_pembanding.json baris[].lelang_ids'], satuan_catatan: 'harga dalam mata uang asal per kWh/MWh sesuai sumber; tidak dikonversi kecuali kolom usd_per_mwh (USc/kWh x 10) bila ada', celah: CELAH_LELANG }, sumber: [{ id: 's-kurasi-lelang', judul: 'Hasil lelang dari siaran regulator/pers dagang; URL tiap baris', url: null, tanggal: TGL }], baris: LELANG };
  return { pembanding, lelang };
}

async function ambilData(dir) {
  fs.mkdirSync(dir, { recursive: true }); const H = { 'user-agent': 'METI-Network-research/0.1 (+https://platformmeti.timitbnpb.workers.dev)', 'content-type': 'application/json' };
  const p = new Penambang({ jedaMs: 2100 }); const tidur = (m) => new Promise((r) => setTimeout(r, m));
  for (const [nama, url, iso] of [['irena_11.json', URL_ELEC, ISO3], ['irena_pubfin.json', URL_PUB, ISO3.filter((x) => !['PHL', 'AUS'].includes(x))]]) {
    const r = await fetch(url, { method: 'POST', headers: H, body: JSON.stringify({ query: [{ code: 'Country/area', selection: { filter: 'item', values: iso } }], response: { format: 'json-stat2' } }) });
    if (r.status === 403 || r.status === 429) throw new Error('blokir ' + r.status); if (!r.ok) throw new Error(nama + ' http ' + r.status);
    fs.writeFileSync(path.join(dir, nama), await r.text()); await tidur(2200);
  }
  const o = await p.ambil(URL_OWID); if (!o.ok) throw new Error('owid ' + o.alasan); fs.writeFileSync(path.join(dir, 'owid.csv'), o.buf);
}
async function utama() {
  const [aksi, dir, tgl] = process.argv.slice(2);
  if (aksi === 'ambil') { await ambilData(dir); console.log('ok'); }
  else if (aksi === 'bangun') {
    if (!/^\d{4}-\d\d-\d\d$/.test(tgl || '')) throw new Error('tanggal wajib');
    const rd = (n) => fs.readFileSync(path.join(dir, n), 'utf8');
    const { pembanding, lelang } = bangun(uraiJsonStat(JSON.parse(rd('irena_11.json'))), uraiJsonStat(JSON.parse(rd('irena_pubfin.json'))), parseCsv(rd('owid.csv')), tgl);
    const d = path.join(ROOT, 'public/data/global'); fs.writeFileSync(path.join(d, 'negara_pembanding.json'), JSON.stringify(pembanding) + '\n'); fs.writeFileSync(path.join(d, 'lelang_dunia.json'), JSON.stringify(lelang) + '\n');
    console.log(pembanding.jumlah, 'negara;', lelang.jumlah, 'baris lelang');
  }
}
if (process.argv[2] === '--selftest') {
  const r = (c, t, dt, y, v, g = 'All') => ({ 'Country/area': c, Technology: t, 'Data Type': dt, 'Grid connection': g, Year: String(y), nilai: v });
  const d = bangunDeret([r('Viet Nam', 'Solar photovoltaic', 'Electrical Installed Capacity (MW)', 2020, 16500), r('Viet Nam', 'Solar photovoltaic', 'Electrical Installed Capacity (MW)', 2020, 1, 'On-grid'), r('Viet Nam', 'Solar photovoltaic', 'Electrical Installed Capacity (MW)', 2005, 9), r('Mars', 'Coal', 'x', 2020, 1)]);
  assert.deepEqual(d, { VNM: { kapasitas_mw: { surya: { 2020: 16500 } }, pembangkitan_gwh: {} } });
  const p = bangunPub([{ 'Country/area': 'India', Technology: 'Solar photovoltaic', Year: '2020', nilai: 5.5 }, { 'Country/area': 'India', Technology: 'Coal', Year: '2020', nilai: 2 }, { 'Country/area': 'India', Technology: 'Coal', Year: '2021', nilai: null }]);
  assert.deepEqual(p.IND[2020], { ebt: 5.5, non_ebt: 2, per_teknologi: { 'Solar photovoltaic': 5.5, Coal: 2 } }); assert.equal(p.IND[2021], undefined);
  const c = parseCsv('country,year,iso_code,renewables_share_elec,solar_share_elec\nIndia,2023,IND,21.5,5.1\nIndia,2024,IND,22,\nWorld,2024,,30,3'); const b = bangunBauran(c);
  assert.equal(b.IND.tahun_terbaru, 2024); assert.equal(b.IND.persen_terbaru.ebt_total, 22); assert.equal(b.IND.persen_terbaru.surya, null); assert.ok(!b.World);
  const ids = LELANG.map((l) => l.id); assert.equal(new Set(ids).size, ids.length); assert.ok(NEGARA.every((n) => /^[A-Z]{2}$/.test(n.iso2) && /^[A-Z]{3}$/.test(n.iso3)));
  console.log('selftest ok');
} else if (process.argv[1] === fileURLToPath(import.meta.url)) await utama();
