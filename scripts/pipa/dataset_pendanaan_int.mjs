#!/usr/bin/env node
// public/data/pendanaan_internasional.json: aktivitas energi Indonesia dari IATI (via d-portal) + proyek World Bank
// yang BELUM ada di keuangan.json. Masukan: data-panen/iati/iati_energi.json (tak masuk repo; --ambil mengunduh ulang).
//   node scripts/pipa/dataset_pendanaan_int.mjs [--ambil]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROOT, TGL, baca, bacaAda, norm, bersihkan, hariKeIso, saring, bungkus, tulis, pilihSumber, ambilJson } from './dataset_lib.mjs';

export const SUMBER = {
  's-iati': { id: 's-iati', lisensi: 'IATI open data; lisensi ditetapkan tiap pelapor (umumnya CC BY 4.0); atribusi IATI dan pelapor', judul: 'IATI Datastore via d-portal: aktivitas Indonesia, sektor DAC 230-236 (tanpa 233 non-terbarukan)', penerbit: 'IATI / d-portal (data dilaporkan masing-masing pemberi)', tahun: 2026, url: 'https://d-portal.org/ctrack.html#view=search' },
  's-wb': { id: 's-wb', lisensi: 'CC BY 4.0 (World Bank Open Data)', judul: 'World Bank Projects & Operations API (Indonesia)', penerbit: 'World Bank', tahun: 2026, url: 'https://search.worldbank.org/api/v2/projects?countrycode_exact=ID' },
};
const DUPLIKAT_WB = /^(AidData|World Bank)$/; // WB sudah via API; AidData menduplikasi WB
const GRUP_OK = new Set(['230', '231', '232', '234', '236']);
const PROYEK = [[/muara laboh/i, 'pj_0265'], [/lahendong/i, 'pj_0260'], [/hululais/i, 'pj_0224'], [/upper cisokan|cisokan pump/i, 'pj_0289'], [/matenggeng/i, 'pj_0286'], [/sorik marapi/i, 'pj_0272'], [/ulubelu/i, 'pj_0249'], [/patuha/i, 'pj_0233'], [/dieng/i, 'pj_0242'], [/floating solar.*cirata|cirata.*floating/i, 'pj_0334']];
export const MIN_PORSI = 20; // aktivitas dengan porsi energi < 20 persen dianggap bukan aktivitas energi
const ORG_ALIAS = { 'world bank trust funds': 'World Bank Indonesia' };

// WB: proyek energi/listrik yang tidak ada di keuangan.json (dicek 7 Nov 2026, id P...).
const WB_TAMBAH = [
  { id: 'P180992', nama: 'Indonesia - Electricity Network Transformation (I-ENET) Program', nilai: 500e6, status: 'Pipeline', penerima: 'PT PLN (Persero)', proyek: null },
  { id: 'P178779', nama: 'Matenggeng Hydropower Pumped Storage Project', nilai: 826e6, status: 'Dropped', penerima: 'Government of Indonesia', proyek: 'pj_0286' },
  { id: 'P093047', nama: 'Electricity Access for Rural Transformation', nilai: 150e6, status: 'Dropped', penerima: null, proyek: null },
];

export function bangun(mentah, { orgs = [], proyekIds = new Set(), idKeuangan = new Set() } = {}) {
  const idxOrg = new Map(orgs.map((o) => [norm(o.nama), o.id]));
  const orgId = (n) => (n ? idxOrg.get(norm(ORG_ALIAS[String(n).toLowerCase()] || n)) ?? null : null);
  const aktif = new Map();
  for (const r of mentah) {
    if (DUPLIKAT_WB.test(r.reporting) || !(r.commitment > 0) || !GRUP_OK.has(r.sector_group)) continue;
    const o = aktif.get(r.aid) || { ...r, grup: new Map() };
    o.grup.set(r.sector_group, (o.grup.get(r.sector_group) || 0) + (r.sector_percent || 0));
    aktif.set(r.aid, o);
  }
  const baris = [];
  for (const o of aktif.values()) {
    if ([...o.grup.values()].reduce((a, b) => a + b, 0) < MIN_PORSI) continue;
    const proyek = PROYEK.find(([re]) => re.test(o.title))?.[1] ?? null;
    const selesai = o.day_end ? hariKeIso(o.day_end) : null;
    baris.push(bersihkan({
      id: 'pi_' + o.aid.replace(/[^A-Za-z0-9]+/g, '_'), kelompok: 'pendanaan_internasional', nama: o.title, iati_id: o.aid,
      pemberi: o.reporting, pemberi_ref: o.reporting_ref, pemberi_org_id: orgId(o.reporting), penerima: null, penerima_org_id: null,
      proyek_id: proyek && (proyekIds.size === 0 || proyekIds.has(proyek)) ? proyek : null,
      nilai_usd: Math.round(o.commitment), satuan_nilai: 'USD komitmen aktivitas (konversi oleh d-portal)',
      sektor_dac: [...o.grup.keys()].sort(), porsi_energi_persen: Math.min(100, [...o.grup.values()].reduce((a, b) => a + b, 0)),
      tahun: o.day_start ? Number(hariKeIso(o.day_start).slice(0, 4)) : null, tanggal_mulai: o.day_start ? hariKeIso(o.day_start) : null, tanggal_selesai: selesai,
      status: selesai ? (selesai < TGL ? 'selesai-menurut-tanggal' : 'berjalan-menurut-tanggal') : 'tidak-dilaporkan', provinsi: null,
      sumber_id: 's-iati', sumber_url: 'https://d-portal.org/ctrack.html#view=act&aid=' + encodeURIComponent(o.aid), tanggal: TGL, tingkat_bukti: 'resmi',
    }));
  }
  for (const w of WB_TAMBAH) {
    if (idKeuangan.has('pd_wb_' + w.id)) continue;
    baris.push({
      id: 'pw_' + w.id, kelompok: 'pendanaan_internasional', nama: w.nama, wb_id: w.id, pemberi: 'World Bank (IBRD/IDA)', pemberi_org_id: orgId('World Bank Indonesia'),
      penerima: w.penerima, penerima_org_id: w.penerima ? orgId(w.penerima) : null, proyek_id: w.proyek && (proyekIds.size === 0 || proyekIds.has(w.proyek)) ? w.proyek : null,
      nilai_usd: w.nilai, satuan_nilai: 'USD komitmen (totalcommamt API)', sektor_dac: [], tahun: null, status: w.status, provinsi: null,
      sumber_id: 's-wb', sumber_url: 'https://projects.worldbank.org/en/projects-operations/project-detail/' + w.id, tanggal: TGL, tingkat_bukti: 'resmi',
    });
  }
  return baris;
}

export const CELAH = [
  'AIIB: daftar proyek (aiib.org/en/projects/list) dirender JavaScript; tidak ada API terbuka yang dibaca. Belum dipanen, tidak ada angka ditebak.',
  'IFC: disclosures.ifc.org berupa aplikasi JavaScript tanpa API terbuka yang dibaca; belum dipanen.',
  'ADB: hanya yang dilaporkan ke IATI (via d-portal); halaman proyek ADB tidak dipanen langsung. JICA hanya 2 aktivitas di IATI; KfW hanya lewat laporan BMZ/GIZ IATI, bukan basis KfW sendiri.',
  'World Bank API sudah terwakili di keuangan.json (35 baris pendanaan); di sini hanya 3 proyek energi yang belum ada (pipeline/dropped). Aktivitas WB di IATI (reporter "World Bank") sengaja dibuang agar tidak ganda; trust fund WB dipertahankan dan bisa beririsan dengan hibah WB.',
  'penerima, provinsi, dan status resmi tidak diambil (d-portal tingkat aktivitas tanpa tabel peserta yang terbaca); status diturunkan dari tanggal selesai. penerima_org_id dan sebagian pemberi_org_id null karena organisasi.json belum memuat pemberi asing selain World Bank.',
  'Aktivitas IATI dengan porsi sektor energi < 20 persen dibuang (mis. program ekonomi umum dengan sedikit komponen energi).',
  'Nilai USD adalah komitmen total aktivitas (bukan porsi energi); porsi_energi_persen menunjukkan bagian sektor energi. Satu pinjaman ADB bisa tampil sebagai beberapa baris (LN/GRNT) per pencatatan IATI.',
  'Tidak ada pengecekan robots.txt d-portal.org (mengalihkan ke halaman pencarian, tanpa aturan); permintaan dibatasi jeda 2 detik, tanpa login/formulir.',
];

async function ambil(dir) {
  const hasil = [];
  for (const g of GRUP_OK) {
    const u = `https://d-portal.org/q.json?select=aid,title,reporting,reporting_ref,day_start,day_end,commitment,spend,sector_code,sector_group,sector_percent&from=act,country,sector&country_code=ID&sector_group=${g}&limit=2000`;
    hasil.push(...((await ambilJson(u)).rows || []));
  }
  fs.mkdirSync(path.dirname(dir), { recursive: true });
  fs.writeFileSync(dir, JSON.stringify(hasil));
  return hasil;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const f = path.join(ROOT, 'data-panen/iati/iati_energi.json');
  const mentah = process.argv.includes('--ambil') ? await ambil(f) : JSON.parse(fs.readFileSync(f, 'utf8'));
  const orgs = bacaAda('public/data/organisasi.json')?.baris ?? [];
  const pj = new Set((bacaAda('public/data/proyek.json')?.baris ?? []).map((p) => p.id));
  const kd = new Set((bacaAda('public/data/keuangan.json')?.baris ?? []).map((b) => b.id).filter(Boolean));
  const { ok, ditolak } = saring(bangun(mentah, { orgs, proyekIds: pj, idKeuangan: kd }));
  console.log(tulis('pendanaan_internasional', bungkus({ baris: ok, sumber: pilihSumber(SUMBER, ok), celah: CELAH, ditolak })), ok.length, 'baris');
}
