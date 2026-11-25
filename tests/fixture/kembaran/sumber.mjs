// Fixture kecil sumber baru kembaran: CSV WRI GPPD, GEM gas, Ember; elemen konstruksi OSM; statistik resmi. Data buatan ("contoh").
export const GPPD = [
  'country,name,gppd_idnr,capacity_mw,latitude,longitude,primary_fuel,commissioning_year,owner,year_of_capacity_data,url',
  'IDN,"PLTU Uji, Satu (contoh)",IDN001,200.456,-7,106.5,Coal,2010.0,"PT ""Contoh"" Energi",2021,https://example.org/a',
  'IDN,PLTG Dua (contoh),IDN002,,-7.1,106.6,Gas,,,,',
  'IDN,PLTS Tiga (contoh),IDN003,50,-7,106.7,Solar,2020,PT Contoh,2021,',
  'MYS,PLTU Seberang (contoh),MYS001,300,3,101,Coal,2005,PT Contoh,2021,',
  'IDN,PLTU Tanpa Titik (contoh),IDN004,100,,,Coal,2005,PT Contoh,2021,',
  'x',
].join('\r\n');

export const GEM_GAS = [
  'country,project,status,fuel_type,capacity,start_year,lat,lng,owner,url',
  'Indonesia,Blok Uji,operating,fossil gas,100,2012,-7,106.5,PT Contoh,https://example.org/g',
  'Indonesia,Blok Uji,operating,fossil gas,50,2008,-7,106.5,PT Contoh,https://example.org/g',
  'Indonesia,Blok Uji,construction,fossil gas,70,2027,-7,106.5,PT Contoh,',
  'Indonesia,Blok Panas Buang,operating,waste heat,40,2015,-7,106.5,PT Contoh,',
  'Indonesia,Blok Pensiun,retired,fossil gas,40,1990,-7,106.5,PT Contoh,',
  'Malaysia,Blok Seberang,operating,fossil gas,40,2015,3,101,PT Contoh,',
  'Indonesia,Blok Batu,operating,coal,40,2015,-7,106.5,PT Contoh,',
  'Indonesia,Blok Solar,operating,fuel oil,30,2015,-7.2,106.5,PT Contoh,',
].join('\n');

const H = ['ISO 3 code', 'Area type', 'Year', 'Electricity source', 'Generation (TWh)', 'Emissions (MtCO2e)', 'Emissions intensity (gCO2e/kWh)', 'Share of generation (%)'];
const e = (src, y, over) => ({ 'ISO 3 code': 'IDN', 'Area type': 'Country or economy', Year: String(y), 'Electricity source': src, 'Generation (TWh)': '1', 'Emissions (MtCO2e)': '', 'Emissions intensity (gCO2e/kWh)': '', 'Share of generation (%)': '', ...over });
const csv = (rows) => [H.join(','), ...rows.map((r) => H.map((h) => r[h]).join(','))].join('\n');
export const EMBER = csv([
  e('Coal', 2023, { 'Generation (TWh)': '200', 'Emissions (MtCO2e)': '190' }), e('Total generation', 2023, { 'Generation (TWh)': '300', 'Emissions (MtCO2e)': '200', 'Emissions intensity (gCO2e/kWh)': '666' }),
  e('Fossil', 2023, { 'Share of generation (%)': '80' }), e('Hydro', 2023, { 'Generation (TWh)': '' }),
  e('Coal', 2024, {}), // tahun tanpa Total generation: dibuang
  { ...e('Coal', 2023, { 'Generation (TWh)': '999' }), 'ISO 3 code': 'MYS' }, // negara lain
  { ...e('Total generation', 2023, { 'Generation (TWh)': '888' }), 'Area type': 'Region' }, // bukan negara
]);

const el = (id, tags, geometry) => ({ type: 'way', id, tags, geometry });
const g2 = (a, b) => [{ lat: a[1], lon: a[0] }, { lat: b[1], lon: b[0] }];
export const KONSTRUKSI = [
  el(901, { power: 'construction', construction: 'line', voltage: '500000' }, g2([106.2, -7.5], [106.4, -7.5])),
  el(902, { 'construction:power': 'cable', voltage: '150000' }, g2([106.2, -7.6], [106.3, -7.6])),
  el(903, { power: 'line', line: 'construction' }, g2([106.2, -7.7], [106.3, -7.7])), // tanpa tegangan: tetap diterima, kv null
  el(904, { power: 'construction', construction: 'line', voltage: '20000' }, g2([106.2, -7.8], [106.3, -7.8])), // < 66 kV: dibuang
  { type: 'node', id: 905, lat: -7.55, lon: 106.25, tags: { power: 'construction', construction: 'substation', voltage: '150000', name: 'GI Baru (contoh)' } },
];

// Statistik resmi minimal (skema data/kembaran/statistik.json), tahun 2024.
const bps = (k, gwh, over) => ({ tahun: 2024, tingkat: 'provinsi', prov_kode: k, unit: 'BPS', baris: 'BPS', gwh, src: 'BPS-859-2024', st: 'sumber', ...over });
export const SR = () => ({
  meta: { celah: [] }, sumber: [{ id: 'BPS-859-2024', judul: 'BPS uji (contoh)', penerbit: 'BPS', url: 'https://example.org/bps', lisensi: 'uji', tanggal_terbit: '2025-01-01', tanggal_baca: '2026-11-25' }],
  penjualan_provinsi: [bps('32', 4000), bps('33', 3000), bps(null, 7000), bps('32', 123, { tahun: 2021, src: 'PLN-STAT-2021' })],
  penjualan_unit_pln: [], produksi_bahan_bakar: [],
  bauran_energi_primer_pln: [{ tahun: 2023, jenis: 'Gas', persen: 20, src: 'A' }, { tahun: 2023, jenis: 'Batubara', persen: 60, src: 'A' }, { tahun: 2023, jenis: 'BBN', persen: 1, src: 'A' }],
  beban_puncak_sistem: [{ tahun: 2024, tingkat: 'provinsi', sistem_pln: 'UIW Barat', unit: 'UIW Barat', prov_kode: '32', mw: 900, src: 'S' }, { tahun: 2024, tingkat: 'provinsi', sistem_pln: 'UIW Timur', unit: 'UIW Timur', prov_kode: '33', mw: null, src: 'S' }],
  saidi_saifi: [{ tahun: 2024, tingkat: 'provinsi', unit: 'UIW Barat', prov_kode: '32', saidi_jam: 3, saifi_kali: 2, src: 'S', st: 'sumber' }, { tahun: 2024, tingkat: 'unit', unit: 'Indonesia', prov_kode: null, saidi_jam: 5, saifi_kali: 4, src: 'S', st: 'sumber' }],
  mva_provinsi_tegangan: [{ tahun: 2024, tingkat: 'provinsi', prov_kode: '32', unit: 'UIW Barat', kv: '150', unit_trafo: 3, mva: 200, src: 'S' }, { tahun: 2024, tingkat: 'provinsi', prov_kode: '32', unit: 'UIW Barat', kv: '70', unit_trafo: 1, mva: 50, src: 'S' }, { tahun: 2024, tingkat: 'provinsi', prov_kode: '33', unit: 'UIW Timur', kv: '150', unit_trafo: 1, mva: null, src: 'S' }],
  faktor_emisi_resmi: [{ tahun: 2019, sistem: 'Jamali', provinsi: 'Jawa', om: 0.8, bm: 0.5, cm: 0.65, satuan: 't/MWh', src: 'E', st: 'sumber' }],
});
