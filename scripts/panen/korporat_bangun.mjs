#!/usr/bin/env node
// public/data/korporat.json: komitmen korporat (SBTi + RE100) dan PPA EBT korporat di Indonesia.
//   node scripts/panen/korporat_ambil.mjs <folder>   (jaringan)
//   node scripts/panen/korporat_bangun.mjs <folder>  (offline) -> public/data/korporat.json
// Cakupan: (a) berkantor pusat di Indonesia (SBTi location, RE100 HQ), (b) perusahaan asing yang punya pembelian EBT di Indonesia
// bersumber (korporat_ppa.mjs) dan terdaftar di SBTi atau RE100. Daftar publik tidak memuat "negara operasi", maka (b) bukan daftar lengkap.
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { bacaXlsx, re100Baris } from '../pipa/komitmen_iklim.mjs';
import { namaBaku } from '../../public/inti/nama_baku.js';
import { PPA, AGREGAT } from './korporat_ppa.mjs';

const AKAR = fileURLToPath(new URL('../../', import.meta.url));
const TGL = '2026-11-08';
export const SUMBER = [
  { id: 's-sbti', judul: 'SBTi Companies Taking Action (companies-excel.xlsx)', penerbit: 'Science Based Targets initiative', tahun: 2026, url: 'https://sciencebasedtargets.org/target-dashboard', tingkat_bukti: 'resmi' },
  { id: 's-re100', judul: 'RE100 Members (tabel anggota publik)', penerbit: 'RE100 (The Climate Group dan CDP)', tahun: 2026, url: 'https://www.there100.org/re100-members', tingkat_bukti: 'resmi' },
];
export const CELAH = [
  'SBTi dan RE100 hanya memuat negara kantor pusat, bukan negara operasi: perusahaan asing yang beroperasi di Indonesia hanya masuk bila ada pembelian EBT di Indonesia yang bersumber (PPA, REC, PLTS atap) dan terdaftar di salah satu registri.',
  'Daftar PPA dan REC dikurasi dari berita dan pengumuman perusahaan; kontrak korporat umumnya tidak diumumkan, sehingga daftar ini bukan total pasar. Skema kontrak, harga, dan durasi tidak dimuat bila sumber tidak menyebutnya.',
  'Teks target SBTi dan RE100 tidak disalin; baca di sumber. Status SBTi "komitmen dicabut" berarti perusahaan tidak menyetor target dalam 24 bulan.',
  'Tidak semua perusahaan punya logo di direktori; yang tidak cocok dengan organisasi di direktori tampil dengan monogram.',
];
const n = (s) => String(s ?? '').toLowerCase().replace(/\b(pt|tbk|persero|ltd|inc|plc|co|corp|group|grup)\b/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim();
const thn = (v) => { const x = parseInt(v, 10); return x > 1990 && x < 2100 ? x : null; };
const STATUS = { 'Validated Targets': 'disetujui', 'Targets Set': 'disetujui', 'Commitment to Set Targets': 'komitmen', 'Commitment Removed': 'dicabut', 'Targets Removed': 'dicabut' };
const serial = (v) => (v && +v > 20000 ? new Date(Date.UTC(1899, 11, 30) + Math.floor(+v) * 864e5).toISOString().slice(0, 10) : null);
const ISO = { Indonesia: 'ID', 'United States of America': 'US', France: 'FR', Switzerland: 'CH', 'United Kingdom': 'GB', Japan: 'JP' };
function sbtiInfo(d) {
  return { status: STATUS[d.near_term_status] || null, klasifikasi: d.near_term_target_classification || null, tahun_sasaran: thn(d.near_term_target_year),
    net_zero: STATUS[d.net_zero_status] || null, tahun_net_zero: thn(d.net_zero_year), diperbarui: serial(d.date_updated) };
}
export function bangun(sbtiRows, re100Rows, orgs, tgl = TGL) {
  const peta = new Map(); // kunci nama -> baris perusahaan
  const ambilPerusahaan = (nama, negara, kelompok, sektor) => {
    const k = n(nama); let p = peta.get(k);
    if (!p) { p = { id: 'k_' + k.replace(/ /g, '-'), nama: namaBaku(String(nama).replace(/^PT\.\s*/i, 'PT ').replace(/[,.]?\s*(TBK)\.?$/i, ' Tbk')).nama, negara, kelompok, sektor_grup: null, sektor: sektor || null, sbti: null, re100: null, organisasi_id: null, logo: null, sumber_ids: [], tingkat_bukti: 'resmi', tanggal: tgl }; peta.set(k, p); }
    return p;
  };
  const grupSektor = (s) => (s ? String(s).split(' - ')[0] : null);
  for (const d of sbtiRows.filter((x) => x.location === 'Indonesia' && x.company_name)) {
    const p = ambilPerusahaan(d.company_name, 'ID', 'kantor-pusat', d.sector); p.sbti = sbtiInfo(d); p.sektor_grup = grupSektor(d.sector) || p.sektor_grup; p.sumber_ids.push('s-sbti');
  }
  for (const r of re100Rows.filter((x) => x.hq === 'Indonesia')) {
    const p = ambilPerusahaan(r.nama, 'ID', 'kantor-pusat', r.sektor); p.re100 = { tahun_gabung: r.tahun_gabung, tahun_target: r.tahun_target }; p.sektor_grup ||= r.sektor; p.sumber_ids.push('s-re100');
  }
  // perusahaan asing dengan pembelian EBT bersumber di Indonesia
  for (const nama of [...new Set(PPA.map((x) => x.perusahaan).filter(Boolean))]) {
    const sb = sbtiRows.find((x) => n(x.company_name) === n(nama) && x.location !== 'Indonesia'), re = re100Rows.find((x) => n(x.nama) === n(nama) && x.hq !== 'Indonesia');
    if (!sb && !re) continue;
    const p = ambilPerusahaan(nama, ISO[(sb && sb.location) || re.hq] || null, 'beroperasi', (sb && sb.sector) || re.sektor);
    if (sb) { p.sbti = sbtiInfo(sb); p.sektor_grup = grupSektor(sb.sector); p.sumber_ids.push('s-sbti'); }
    if (re) { p.re100 = { tahun_gabung: re.tahun_gabung, tahun_target: re.tahun_target }; p.sektor_grup ||= re.sektor; p.sumber_ids.push('s-re100'); }
  }
  const idx = new Map();
  for (const o of orgs) for (const x of [o.nama, ...(o.nama_lain || [])]) { const k = n(x); if (k.length > 3 && !idx.has(k)) idx.set(k, o); }
  const perusahaan = [...peta.values()].map((p) => { const o = idx.get(n(p.nama)); return o ? { ...p, organisasi_id: o.id, logo: o.logo || null } : p; })
    .sort((a, b) => a.nama.localeCompare(b.nama));
  const ppa = PPA.map((x) => { const pk = x.perusahaan && peta.get(n(x.perusahaan)); const { perusahaan: _, ...sisa } = x; const po = x.pemasok && (idx.get(n(x.pemasok)) || (/pln/i.test(x.pemasok) ? { id: 'su_ed074ff5' } : null)); return { ...sisa, perusahaan_id: pk ? pk.id : null, pemasok_org_id: po ? po.id : null }; });
  const ada = (f) => perusahaan.filter(f).length;
  return { lapis: 'publik', dibangun_pada: tgl, sumber: SUMBER, perusahaan, ppa, agregat: AGREGAT,
    meta: { diperbarui: tgl, sbti_total_dunia: sbtiRows.length, re100_total_dunia: re100Rows.length, kantor_pusat: ada((p) => p.kelompok === 'kantor-pusat'), beroperasi: ada((p) => p.kelompok === 'beroperasi'), celah: CELAH } };
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dir = process.argv[2]; if (!dir) throw new Error('butuh folder berisi re100.html dan sbti.xlsx');
  const orgs = JSON.parse(fs.readFileSync(AKAR + 'public/data/organisasi.json', 'utf8')).baris;
  const d = bangun(bacaXlsx(dir + '/sbti.xlsx').baris, re100Baris(fs.readFileSync(dir + '/re100.html', 'utf8'), TGL), orgs);
  fs.writeFileSync(AKAR + 'public/data/korporat.json', JSON.stringify(d) + '\n');
  console.log('perusahaan', d.perusahaan.length, 'ppa', d.ppa.length, 'logo', d.perusahaan.filter((p) => p.logo).length, 'org', d.perusahaan.filter((p) => p.organisasi_id).length);
}
