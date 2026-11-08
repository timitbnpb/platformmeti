#!/usr/bin/env node
// public/data/baterai_ev.json: ekosistem baterai dan kendaraan listrik. Hanya data baru + rujukan id ke berkas lain (tanpa menyalin hilirisasi, captive, esg, bahan_baku).
//   node scripts/panen/baterai_ev_comtrade.mjs ambil   (jaringan, sekali) -> scratchpad/baterai-ev/
//   node scripts/panen/baterai_ev.mjs [dir-mentah]       (offline) -> public/data/baterai_ev.json
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { SUMBER, PEMAIN, KAPASITAS, KEBIJAKAN, ISU, HARGA, PENJUALAN, PENGISIAN, CELAH, TGL } from './baterai_ev_kurasi.mjs';
import { HS_TAMBAH, ringkas, DIR_BAWAAN } from './baterai_ev_comtrade.mjs';

const AKAR = fileURLToPath(new URL('../../', import.meta.url));
const baca = (f) => JSON.parse(fs.readFileSync(AKAR + f, 'utf8'));
export const TAHAP = [
  { id: 'tambang', ikon: 'beliung', hs: ['2604', '260200', '810520'] },
  { id: 'olah', ikon: 'pabrik', hs: ['7501', '7502', '7202', '283324'] },
  { id: 'prekursor', ikon: 'labu', hs: ['282520', '283691'] },
  { id: 'sel', ikon: 'baterai', hs: ['850760'] },
  { id: 'kendaraan', ikon: 'mobil', hs: ['870380'] },
  { id: 'pengisian', ikon: 'colokan', hs: [] },
  { id: 'bess', ikon: 'sistem-listrik', hs: ['850760'] },
  { id: 'daur', ikon: 'daur', hs: [] },
];

/** Murni: gabungkan kurasi + ringkasan Comtrade jadi berkas. Mengembalikan {data, galat}. */
export function bangun({ org, hilirisasi, dagang, mitraRef }) {
  const galat = [];
  const orgAda = new Set((org?.baris || []).map((b) => b.id));
  const hiliIds = new Set((hilirisasi?.baris || []).map((b) => b.id));
  const sumberIds = new Set(SUMBER.map((s) => s.id));
  const cekSumber = (id, dari) => { if (id && !sumberIds.has(id)) galat.push(`sumber tak ada: ${id} (${dari})`); };
  const tahap = TAHAP.map((t) => {
    const pemain = (PEMAIN[t.id] || []).map((p) => {
      for (const o of [p.org_id, ...(p.org_lain || [])].filter(Boolean)) if (!orgAda.has(o)) galat.push(`org tak ada: ${o} (${p.id})`);
      if (p.hilirisasi_id && !hiliIds.has(p.hilirisasi_id)) galat.push(`hilirisasi tak ada: ${p.hilirisasi_id}`);
      cekSumber(p.sumber_id, p.id);
      return { ...p, tingkat_bukti: 'media', tanggal: TGL };
    });
    const kapasitas = (KAPASITAS[t.id] || []).map((k) => { cekSumber(k.sumber_id, k.id); return { ...k, tingkat_bukti: 'media', tanggal: TGL }; });
    const isu = ISU.filter((i) => i.tahap === t.id).map((i) => { cekSumber(i.sumber_id, i.id); return { ...i, tingkat_bukti: 'media', tanggal: TGL }; });
    const kebijakan = KEBIJAKAN.filter((k) => k.tahap.includes(t.id)).map((k) => k.id);
    return { ...t, pemain, kapasitas, isu, kebijakan };
  });
  for (const k of KEBIJAKAN) cekSumber(k.sumber_id, k.id);
  const peta = new Map((mitraRef || []).filter((r) => r.PartnerCodeIsoAlpha2 && !r.isGroup).map((r) => [r.PartnerCode, { kode: r.PartnerCode, iso2: r.PartnerCodeIsoAlpha2.toLowerCase(), nama: r.PartnerDesc }]));
  const pakai = new Set();
  for (const d of dagang) for (const m of d.mitra) pakai.add(m.kode);
  return {
    data: {
      lapis: 'publik', dibangun_pada: TGL, sumber: SUMBER.map(({ ...s }) => s),
      tahap, kebijakan: KEBIJAKAN.map((k) => ({ ...k, tingkat_bukti: 'media', tanggal: TGL })), harga: HARGA, penjualan: PENJUALAN, pengisian: PENGISIAN,
      dagang: { hs: HS_TAMBAH, baris: dagang.map((d) => ({ ...d, sumber_id: 's-comtrade', tingkat_bukti: 'resmi' })), mitra: [...pakai].filter((k) => peta.has(k)).map((k) => peta.get(k)) },
      neraca: { param: { kwh_bev: 45, kwh_motor: 2, kwh_hybrid: 1.5 }, skenario_bess_gwh: [{ k: 'tanpa', gwh: 0 }, { k: 'bali', gwh: 3.3 }, { k: 'pln100', gwh: 82.5 }], skenario_sel: [{ k: 'hli', gwh: 10 }, { k: 'hli-catl1', gwh: 16.9 }, { k: 'hli-catl2', gwh: 25 }], catatan: 'Hipotesis: kWh per kendaraan adalah asumsi, bukan angka sumber.' },
      sumber_comtrade: { id: 's-comtrade', judul: 'UN Comtrade, impor dan ekspor Indonesia (pelapor 360) menurut HS 6 digit, API publik /preview', penerbit: 'United Nations Statistics Division (UN Comtrade)', url: 'https://comtradeapi.un.org', tingkat_bukti: 'resmi', tanggal_ambil: TGL },
      meta: { diperbarui: TGL, celah: [...CELAH.map((c) => c.id), { id: 'HS 8711.60 (motor listrik) gagal diambil: Comtrade membalas 403 sehingga panen dihentikan sesuai aturan; seri HS 8703.80 untuk mobil sudah ada.', en: 'HS 8711.60 (e-motorcycles) could not be fetched: Comtrade returned 403 and harvesting stopped per policy; the HS 8703.80 car series is present.' }] },
    }, galat,
  };
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dagang = ringkas(process.argv[2] || DIR_BAWAAN);
  const { data, galat } = bangun({ org: baca('public/data/organisasi.json'), hilirisasi: baca('public/data/hilirisasi.json'), dagang, mitraRef: baca('data/dagang_komponen/mitra.json').results });
  if (galat.length) { console.error(galat.join('\n')); process.exit(1); }
  fs.writeFileSync(AKAR + 'public/data/baterai_ev.json', JSON.stringify(data) + '\n');
  console.log('tahap', data.tahap.length, 'dagang', data.dagang.baris.length, 'mitra', data.dagang.mitra.length, 'ukuran', JSON.stringify(data).length);
}
