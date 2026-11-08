#!/usr/bin/env node
// public/data/keuangan_hijau.json (FITUR-200 H02-H09, H13, H14, H03): investasi publik EBT vs fosil, obligasi/sukuk hijau, JETP, skema hibah, pembanding ASEAN.
//   node scripts/pipa/keuangan_hijau.mjs ambil   (jaringan: pxweb.irena.org; UA jujur, jeda >= 2 dtk) -> data/keuangan_hijau/pubfin.json
//   node scripts/pipa/keuangan_hijau.mjs bangun  (offline; membaca berkas data publik yang sudah ada)
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ambil } from './_panen_sopan.mjs';

const AKAR = fileURLToPath(new URL('../../', import.meta.url));
const TGL = '2026-11-08';
const PUBFIN = 'https://pxweb.irena.org/api/v1/en/IRENASTAT/Finance/PUBFIN_2026_H2_PX.px';
const baca = (f) => JSON.parse(fs.readFileSync(AKAR + f, 'utf8'));
const FOSIL = new Set(['Coal', 'Natural gas', 'Oil', 'Other fossil fuels']);
const LAIN = new Set(['Nuclear energy', 'Non-renewable waste', 'Mechanical storage']);
export const SUMBER = [
  { id: 's-pubfin', judul: 'IRENA Public Finance Database 2026 H2 dan OECD DAC (investasi publik, juta USD 2023), penerima Indonesia', penerbit: 'IRENA dan OECD', tahun: 2026, url: 'https://pxweb.irena.org/pxweb/en/IRENASTAT/IRENASTAT__Finance/', lisensi: 'IRENA: bebas dipakai dengan atribusi', tingkat_bukti: 'resmi' },
  { id: 's-djppr', judul: '2025 Green Sukuk Allocation and Impact Report', penerbit: 'DJPPR Kemenkeu', tahun: 2025, url: 'https://www.djppr.kemenkeu.go.id', lisensi: 'Publikasi pemerintah terbuka; atribusi', tingkat_bukti: 'resmi' },
  { id: 's-jetp', judul: 'JETP Indonesia Portfolio Dashboard', penerbit: 'Sekretariat JETP Indonesia', tahun: 2026, url: 'https://jetp-id.org/portfolio-sub/index', lisensi: 'Publikasi Sekretariat JETP; hanya fakta dan angka', tingkat_bukti: 'resmi' },
  { id: 's-pendanaan', judul: 'Tab Pendanaan METI (pendanaan.json): skema dan pendana', penerbit: 'Platform Jaringan METI', tahun: 2026, url: 'https://platformmeti.timitbnpb.workers.dev/direktori', lisensi: 'Data METI; sumber per baris', tingkat_bukti: 'kata-pihak' },
  { id: 's-ember', judul: 'Our World in Data energy-data (Ember Yearly Electricity), baris ASEAN', penerbit: 'Ember via Our World in Data', tahun: 2026, url: 'https://github.com/owid/energy-data', lisensi: 'CC BY 4.0', tingkat_bukti: 'via-pihak-ketiga' },
];
export const CELAH = [
  { kunci: 'tkbi', url: 'https://www.ojk.go.id' },
  { kunci: 'bank', url: 'https://www.ojk.go.id' },
  { kunci: 'penjamin', url: 'https://www.pii.co.id' },
  { kunci: 'valas', url: 'https://www.tcxfund.com' },
  { kunci: 'cipp', url: 'https://jetp-id.org/cipp' },
  { kunci: 'risiko', url: 'https://www.worldbank.org/en/country/indonesia' },
  { kunci: 'cpi', url: 'https://www.climatepolicyinitiative.org' },
  { kunci: 'idx', url: 'https://www.idx.co.id' },
];
export async function ambilSemua() {
  const m = await ambil(PUBFIN, { json: true });
  const v = m.variables.find((x) => x.code === 'Country/area');
  const kode = v.values[v.valueTexts.indexOf('Indonesia')];
  const d = await ambil(PUBFIN, { json: true, method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ query: [{ code: 'Country/area', selection: { filter: 'item', values: [kode] } }], response: { format: 'json-stat2' } }) });
  fs.writeFileSync(AKAR + 'data/keuangan_hijau/pubfin.json', JSON.stringify(d));
}
export function bangun() {
  const p = baca('data/keuangan_hijau/pubfin.json');
  const tek = Object.values(p.dimension.Technology.category.label), th = Object.values(p.dimension.Year.category.label);
  const investasi = [];
  tek.forEach((nama, i) => th.forEach((y, j) => {
    const v = p.value[i * th.length + j]; if (v === null || v === undefined) return;
    investasi.push({ tahun: +y, teknologi: nama, kelompok: FOSIL.has(nama) ? 'fosil' : LAIN.has(nama) ? 'lain' : 'ebt', usd_juta_2023: v, sumber_id: 's-pubfin', tingkat_bukti: 'resmi', tanggal: TGL });
  }));
  const og = baca('public/data/obligasi_hijau.json');
  const instrumen = og.baris.map((b) => ({ id: b.id, penerbit: b.penerbit, penerbit_org_id: b.penerbit_org_id, instrumen: b.instrumen, pemerintah: !!b.penerbit_pemerintah, nilai: b.nilai, satuan: b.satuan_nilai, tahun: b.tahun, tenor_tahun: b.tenor_tahun, kupon_persen: b.kupon_persen, tanggal_terbit: b.tanggal_terbit, sertifikasi: b.sertifikasi, penggunaan_dana: b.penggunaan_dana, sumber_url: b.sumber_url, sumber_id: b.sumber_id === 's-djppr' ? 's-djppr' : 's-pendanaan', tingkat_bukti: b.tingkat_bukti, tanggal: b.tanggal }));
  const kj = baca('public/data/keuangan.json').baris;
  const alokasi = kj.filter((b) => b.kelompok === 'green_finance' && b.jenis === 'alokasi_kumulatif_2018_2024' && b.sektor).map((b) => ({ sektor: b.sektor, usd: b.usd, porsi_persen: b.porsi_persen, sumber_id: 's-djppr', tingkat_bukti: 'resmi', tanggal: b.tanggal }));
  const jc = baca('public/data/jetp_cipp.json');
  const jetp = jc.baris.map((b) => ({ nama: b.nama, jenis: b.jenis, teknologi: b.teknologi, ebt: b.ebt, kapasitas_mw: b.kapasitas_mw, status: b.status, sumber_url: b.sumber_url, sumber_id: 's-jetp', tingkat_bukti: b.tingkat_bukti, tanggal: b.tanggal }));
  const komit = kj.find((b) => b.kelompok === 'jetp' && b.jenis === 'komitmen');
  const pd = baca('public/data/pendanaan.json');
  const skema = pd.pendanaan.filter((b) => b.jenis_entri === 'skema' && ['hibah', 'blended', 'pinjaman lunak', 'insentif fiskal'].includes(b.jenis)).map((b) => ({ nama: b.nama, pemberi: b.pemberi, jenis: b.jenis, uraian: b.uraian, status: b.status, url: b.url, sumber_id: 's-pendanaan', tingkat_bukti: b.tingkat_bukti, tanggal: b.tanggal_periksa }));
  const pemberi = pd.ringkasan.nilai_per_pemberi.slice(0, 12).map((x) => ({ pemberi: x.pemberi, usd: x.total_usd, jumlah_proyek: x.jumlah_proyek, sumber_id: 's-pendanaan', tingkat_bukti: 'kata-pihak', tanggal: TGL }));
  const ae = baca('public/data/asean_energi.json');
  const tetangga = ae.baris.map((b) => ({ iso3: b.iso3, nama: b.nama, ebt_persen: b.bauran_listrik_persen?.ebt_total?.nilai ?? null, fosil_persen: b.bauran_listrik_persen ? Math.round(((b.bauran_listrik_persen.batubara?.nilai ?? 0) + (b.bauran_listrik_persen.gas?.nilai ?? 0) + (b.bauran_listrik_persen.minyak?.nilai ?? 0)) * 100) / 100 : null, intensitas_gco2_kwh: b.intensitas_karbon_gco2_kwh?.nilai ?? null, tahun: b.bauran_listrik_persen?.ebt_total?.tahun ?? null, sumber_id: 's-ember', tingkat_bukti: 'via-pihak-ketiga', tanggal: TGL })).filter((x) => x.ebt_persen !== null);
  return { lapis: 'publik', dibangun_pada: TGL, sumber: SUMBER, investasi_publik: investasi, instrumen_hijau: instrumen, alokasi_sukuk: alokasi, jetp: { komitmen_usd_miliar: komit?.total_usd_miliar ?? null, proyek: jetp, sumber_id: 's-jetp', tingkat_bukti: 'resmi', tanggal: TGL }, skema, pemberi, tetangga, celah: CELAH, meta: { diperbarui: TGL } };
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv[2] === 'ambil') await ambilSemua();
  else { const d = bangun(); fs.writeFileSync(AKAR + 'public/data/keuangan_hijau.json', JSON.stringify(d) + '\n'); console.log('investasi', d.investasi_publik.length, 'instrumen', d.instrumen_hijau.length, 'alokasi', d.alokasi_sukuk.length, 'jetp', d.jetp.proyek.length, 'skema', d.skema.length, 'tetangga', d.tetangga.length); }
}
