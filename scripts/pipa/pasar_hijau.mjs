#!/usr/bin/env node
// public/data/pasar_hijau.json (FITUR-200 B05, M10, B11): pembangkit swasta (IPP) dari GPPD dan proyek METI per wilayah; REC/RE100 dicatat sebagai celah.
//   node scripts/pipa/pasar_hijau.mjs  (offline; membaca public/data/gppd.json dan proyek.json)
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const AKAR = fileURLToPath(new URL('../../', import.meta.url));
const TGL = '2026-11-08';
const baca = (f) => JSON.parse(fs.readFileSync(AKAR + f, 'utf8'));
const GRUP_PLN = /\b(PLN|Perusahaan Listrik Negara|Indonesia Power|Pembangkitan Jawa|PJB|Pembangkitan Listrik Negara)\b/i;
const BAHAN = { Coal: 'batubara', Gas: 'gas', Oil: 'minyak', Hydro: 'air', Geothermal: 'panas-bumi' };
export const SUMBER = [
  { id: 'gppd', judul: 'Global Power Plant Database v1.3.0 (baris IDN)', penerbit: 'World Resources Institute', tahun: 2021, url: 'https://github.com/wri/global-power-plant-database', lisensi: 'CC BY 4.0', tingkat_bukti: 'via-pihak-ketiga' },
  { id: 'proyek', judul: 'Daftar proyek METI (proyek.json), bersumber RUPTL dan sumber per baris', penerbit: 'Platform Jaringan METI', tahun: 2026, url: 'https://platformmeti.timitbnpb.workers.dev/proyek', lisensi: 'Data METI; sumber per baris', tingkat_bukti: 'kata-pihak' },
];
export const CELAH = [
  { kunci: 'rec', url: 'https://web.pln.co.id' },
  { kunci: 'tarif_hijau', url: 'https://web.pln.co.id' },
  { kunci: 're100', url: 'https://www.there100.org' },
  { kunci: 'komitmen', url: 'https://www.cdp.net' },
];
export function bangun() {
  const g = baca('public/data/gppd.json').baris;
  const pem = new Map();
  for (const x of g) {
    const nama = (x.pemilik || '').trim() || 'tanpa-nama';
    if (!pem.has(nama)) pem.set(nama, { pemilik: nama, grup: GRUP_PLN.test(nama) ? 'pln' : 'swasta-atau-lain', unit: 0, kapasitas_mw: 0, bahan: {} });
    const p = pem.get(nama); p.unit++; p.kapasitas_mw += x.kapasitas_mw || 0;
    const b = BAHAN[x.bahan_bakar] || x.bahan_bakar; p.bahan[b] = (p.bahan[b] || 0) + (x.kapasitas_mw || 0);
  }
  const pemilik = [...pem.values()].map((p) => ({ ...p, kapasitas_mw: Math.round(p.kapasitas_mw * 10) / 10, bahan: Object.fromEntries(Object.entries(p.bahan).map(([k, v]) => [k, Math.round(v * 10) / 10])), sumber_id: 'gppd', tingkat_bukti: 'via-pihak-ketiga', tanggal: TGL })).sort((a, b) => b.kapasitas_mw - a.kapasitas_mw);
  const prov = new Map();
  for (const p of baca('public/data/proyek.json').baris) {
    const nama = p.lokasi?.provinsi || 'tanpa-provinsi', st = p.status?.[0]?.nilai || 'tidak-diketahui', mw = p.kapasitas?.[0]?.satuan === 'MW' ? p.kapasitas[0].nilai || 0 : 0;
    if (!prov.has(nama)) prov.set(nama, { provinsi: nama, proyek: 0, mw: 0, beroperasi_mw: 0, konstruksi_mw: 0, rencana_mw: 0, pln: 0 });
    const r = prov.get(nama); r.proyek++; r.mw += mw;
    if (st === 'beroperasi') r.beroperasi_mw += mw; else if (st === 'konstruksi') r.konstruksi_mw += mw; else if (st === 'rencana') r.rencana_mw += mw;
    if (p.pihak?.pemilik?.some((x) => /PLN/.test(x.nilai))) r.pln++;
  }
  const wilayah = [...prov.values()].map((r) => ({ ...r, mw: Math.round(r.mw), beroperasi_mw: Math.round(r.beroperasi_mw), konstruksi_mw: Math.round(r.konstruksi_mw), rencana_mw: Math.round(r.rencana_mw), sumber_id: 'proyek', tingkat_bukti: 'kata-pihak', tanggal: TGL })).sort((a, b) => b.mw - a.mw);
  return { lapis: 'publik', dibangun_pada: TGL, sumber: SUMBER, pemilik_pembangkit: pemilik, proyek_wilayah: wilayah, celah: CELAH, meta: { diperbarui: TGL, catatan_klasifikasi: 'grup pln dicocokkan dari nama pemilik (EST); sisanya swasta atau lain', celah_gppd: 'GPPD berhenti 2021 dan tanpa surya/bayu' } };
}
if (process.argv[1] === fileURLToPath(import.meta.url)) { const d = bangun(); fs.writeFileSync(AKAR + 'public/data/pasar_hijau.json', JSON.stringify(d) + '\n'); console.log('pemilik', d.pemilik_pembangkit.length, d.pemilik_pembangkit.slice(0, 5).map((p) => p.pemilik + ' ' + p.grup + ' ' + p.kapasitas_mw), 'wilayah', d.proyek_wilayah.length); }
