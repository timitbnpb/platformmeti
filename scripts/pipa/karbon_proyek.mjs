// public/data/karbon_proyek.json: proyek kredit karbon energi terbarukan Indonesia (Verra VCS via Berkeley VROD; Gold Standard via API publik).
//   node scripts/pipa/karbon_proyek.mjs ambil <dirMentah>          (jaringan; jeda >= 2 dtk; lalu: python3 -I scripts/pipa/vrod_ekstrak.py <dir>/vrod.xlsx <dir>/vrod_id.json)
//   node scripts/pipa/karbon_proyek.mjs bangun <dirMentah> <tgl>   (tanpa jaringan)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ambil } from './_panen_sopan.mjs';
import { muat, indeksProyek, indeksOrg, cocokProyek, cocokOrg, provinsi, mwDariNama } from './_cocok.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const VROD = 'https://gspp.berkeley.edu/assets/uploads/page/VROD-registry-files--2026-08.xlsx';
const SUMBER = [
  { id: 's-vrod', judul: 'Voluntary Registry Offsets Database (VROD) registry files 2026-08: Verra VCS Projects, Issuances, Retirements (Indonesia)', penerbit: 'Berkeley Carbon Trading Project, UC Berkeley (data asal: Verra Registry)', tahun: 2026, url: 'https://gspp.berkeley.edu/berkeley-carbon-trading-project/offsets-database', tingkat_bukti: 'via-pihak-ketiga', lisensi: 'CC BY 4.0' },
  { id: 's-gs', lisensi: 'Gold Standard: data registri publik; atribusi Gold Standard', judul: 'Gold Standard public API: projects (countries=ID)', penerbit: 'Gold Standard Foundation', tahun: 2026, url: 'https://public-api.goldstandard.org/projects?countries=ID', tingkat_bukti: 'resmi' },
  { id: 's-gs-vrod', judul: 'VROD registry files 2026-08: Gold Issuances, Gold Retirements (Indonesia)', penerbit: 'Berkeley Carbon Trading Project, UC Berkeley (data asal: Gold Standard)', tahun: 2026, url: 'https://gspp.berkeley.edu/berkeley-carbon-trading-project/offsets-database', tingkat_bukti: 'via-pihak-ketiga', lisensi: 'CC BY 4.0' } ];
const RE_METODE_EBT = /ACM0002|AMS-I\.[ADF]\b|ACM0006|ACM0018|ACM0001/;
const STATUS = [[/^registered$/i, 'terdaftar'], [/late to verify/i, 'terdaftar_terlambat_verifikasi'], [/under validation/i, 'validasi'], [/registration/i, 'pengajuan_registrasi'], [/pipeline/i, 'pipa_pengembangan'], [/withdrawn/i, 'ditarik'], [/inactive/i, 'nonaktif'], [/GOLD_STANDARD_CERTIFIED_PROJECT|certified project/i, 'tersertifikasi'], [/CERTIFIED_DESIGN/i, 'desain_tersertifikasi'], [/LISTED|listed/, 'terdaftar_daftar_awal']];
export const statusBaku = (s) => (STATUS.find(([r]) => r.test(String(s ?? ''))) || [0, 'lainnya'])[1];
const TEK_GS = { Geothermal: 'panas-bumi', Wind: 'bayu', 'Small, Low - Impact Hydro': 'hidro', 'Biogas - Electricity': 'bioenergi', 'Biogas - Heat': 'bioenergi', 'Solar Thermal - Electricity': 'surya', 'Biomass, or Liquid Biofuel - Heat': 'bioenergi', 'Biomass, or Liquid Biofuel - Electricity': 'bioenergi', Solar: 'surya', Hydro: 'hidro' };
export function tekVerra(nama, metode) {
  const n = `${nama} ${metode}`.toLowerCase();
  if (/geotherm/.test(n)) return 'panas-bumi'; if (/hydro|mini hydro/.test(n)) return 'hidro'; if (/wind/.test(n)) return 'bayu'; if (/solar|pv/.test(n)) return 'surya';
  if (/biogas|biomass|landfill|biofuel|wastewater/.test(n) || /ACM0001|ACM0006|AMS-I\.[DF]/.test(metode)) return 'bioenergi'; return null;
}
const jumlah = (rows, kunci, f) => { const m = new Map(); for (const r of rows) m.set(String(r[kunci]), (m.get(String(r[kunci])) || 0) + (Number(f(r)) || 0)); return m; };
const tgl10 = (s) => (s ? String(s).slice(0, 10) : null);
export function bangunData(vrod, gs, tgl, proyek, org) {
  const ip = indeksProyek(proyek), io = indeksOrg(org); const celah = []; const baris = []; let vcsLuar = 0;
  const terbit = jumlah(vrod['Verra VCS Issuances'], 'Project ID', (r) => r.Units); const pensiun = jumlah(vrod['Verra VCS Retirements'], 'Project ID', (r) => r['Retirement QTY']);
  const gTerbit = jumlah(vrod['Gold Issuances'], 'GSID', (r) => r.Quantity); const gPensiun = jumlah(vrod['Gold Retirements'], 'GSID', (r) => r.Quantity);
  const kait = (nama, prov, mw, tek, dev) => { const c = cocokProyek(nama, prov, mw, ip, tek); const o = cocokOrg(dev, io); return { proyek_id: c.proyek_id, kandidat_proyek: c.kandidat, organisasi_id: o?.id ?? null }; };
  for (const p of vrod['Verra VCS Projects']) {
    const metode = String(p.Methodology ?? '');
    if (!(String(p['Sectoral Scope']).includes('Energy industries') && RE_METODE_EBT.test(metode))) { vcsLuar++; continue; }
    const id = String(p['Project ID']); const prov = provinsi(p['State/Province']); const dev = String(p.Proponents ?? '').replace(/\s*\(PP\)\s*$/, '').trim() || null; const tek = tekVerra(p['Project Name'], metode);
    baris.push({ id: 'vcs_' + id, registri: 'Verra VCS', registri_id: 'VCS' + id, nama: p['Project Name'], pengembang: dev, ...kait(p['Project Name'], prov, mwDariNama(p['Project Name']), tek, dev), teknologi: tek, lokasi: { provinsi: prov, teks_asal: p['State/Province'] ?? null, lat: null, lng: null }, metodologi: metode, status: statusBaku(p.Status), status_asli: p.Status, kredit: { diterbitkan: terbit.get(id) ?? 0, dipensiunkan: pensiun.get(id) ?? 0, taksiran_tahunan: p['Estimated Average Annual Emission Reductions and Carbon Dioxide Removals'] ?? null, satuan: 'tCO2e' }, periode_kredit: { mulai: tgl10(p['Crediting Period Duration Start Date']), akhir: tgl10(p['Crediting Period Duration End Date']) }, tanggal_registrasi: tgl10(p['Project Registration Date']), sumber_id: 's-vrod', sumber_url: 'https://registry.verra.org/app/projectDetail/VCS/' + id, tingkat_bukti: 'via-pihak-ketiga', tanggal: tgl });
  }
  let gsLuar = 0;
  for (const g of gs) {
    const tek = TEK_GS[g.type]; if (!tek) { gsLuar++; continue; }
    const gsid = String(g.sustaincert_id ?? ''); const nama = g.name; const dev = g.project_developer ?? null;
    const hit = (k) => [...k.keys()].includes(gsid) ? k.get(gsid) : 0;
    baris.push({ id: 'gs_' + g.id, registri: 'Gold Standard', registri_id: gsid ? 'GS' + gsid : null, nama, pengembang: dev, ...kait(nama, provinsi(g.state), mwDariNama(nama), tek, dev), teknologi: tek, lokasi: { provinsi: provinsi(g.state), teks_asal: g.state ?? null, lat: g.latitude ?? null, lng: g.longitude ?? null }, metodologi: g.methodology ?? null, status: statusBaku(g.status), status_asli: g.status, kredit: { diterbitkan: hit(gTerbit), dipensiunkan: hit(gPensiun), taksiran_tahunan: g.estimated_annual_credits || null, satuan: 'tCO2e' }, periode_kredit: { mulai: g.crediting_period_start_date ?? null, akhir: g.crediting_period_end_date ?? null }, tanggal_registrasi: null, sumber_id: 's-gs', sumber_url: g.sustaincert_url || 'https://registry.goldstandard.org/projects', tingkat_bukti: 'resmi', tanggal: tgl });
  }
  baris.sort((a, b) => a.id.localeCompare(b.id));
  celah.push(`Verra: ${vcsLuar} proyek Indonesia di luar energi terbarukan (AFOLU, limbah/metana murni, transportasi, gas alam AM0029, dll.) dikeluarkan; filter = lingkup sektor "Energy industries" dan metodologi ACM0002, AMS-I.A/D/F, ACM0006, ACM0018 atau ACM0001.`);
  celah.push(`Gold Standard: ${gsLuar} proyek Indonesia non-pembangkit (efisiensi energi, A/R, memasak bersih, lainnya) dikeluarkan.`);
  celah.push('Verra dibaca dari salinan Berkeley VROD (CC BY 4.0, rilis 2026-08), bukan langsung dari registry.verra.org: registry baru Verra adalah SPA berkunci API dan tidak dipanen. Karena itu tingkat_bukti = via-pihak-ketiga, lat/lng Verra kosong (tidak ada di ekspor), dan angka sampai tanggal rilis VROD.');
  celah.push('SRN PPI KLHK (srn.menlhk.go.id) tidak terjangkau (koneksi gagal/ditolak) dan tidak dipanen; proyek yang hanya terdaftar di SRN/IDXCarbon tidak ada di berkas ini.');
  celah.push('proyek_id hanya diisi bila kemiripan nama >= 0,6 tanpa pesaing seimbang dan provinsi/teknologi tidak bertentangan; selain itu kandidat_proyek berisi usulan untuk kurator (proyek.json memuat beberapa catatan untuk satu PLTP, sehingga banyak kasus ambigu). organisasi_id hanya untuk kecocokan nama eksak/hampir eksak.');
  return { lapis: 'publik', dibangun_pada: tgl, jumlah: baris.length, baris, sumber: SUMBER, meta: { diperbarui: tgl, celah } };
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [cmd, dir, tgl] = process.argv.slice(2); const w = (n) => path.join(dir, n);
  if (cmd === 'ambil') {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(w('vrod.xlsx'), await ambil(VROD, { buf: true }));
    fs.writeFileSync(w('gs_id.json'), JSON.stringify(await ambil('https://public-api.goldstandard.org/projects?page=1&size=150&countries=ID', { json: true })));
  } else if (cmd === 'bangun' && tgl) {
    const r = (n) => JSON.parse(fs.readFileSync(w(n), 'utf8'));
    const out = bangunData(r('vrod_id.json'), r('gs_id.json'), tgl, muat('proyek.json').baris, muat('organisasi.json').baris);
    const f = path.join(ROOT, 'public/data/karbon_proyek.json'); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(out) + '\n');
    console.log('karbon_proyek:', out.jumlah, 'proyek;', out.baris.filter((b) => b.proyek_id).length, 'tertaut proyek;', out.baris.filter((b) => b.organisasi_id).length, 'tertaut organisasi');
  } else { console.error('pakai: ambil <dir> | bangun <dir> <tgl>'); process.exit(2); }
}
