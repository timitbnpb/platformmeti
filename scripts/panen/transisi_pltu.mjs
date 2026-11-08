#!/usr/bin/env node
// public/data/transisi_pltu.json: transisi PLTU ujung ke ujung. Hanya data baru + rujukan id ke pltu.json, captive_power.json, energi_baru.json,
// pasar_listrik.json, isu.json, radar_kabupaten.json, regulasi.json (tanpa menyalin). Offline: node scripts/panen/transisi_pltu.mjs
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { TGL, SUMBER, PRODUKSI, BIAYA, PENDANAAN, PEKERJA, PASAL3, CELAH } from './transisi_pltu_kurasi.mjs';

const AKAR = fileURLToPath(new URL('../../', import.meta.url));
const baca = (f) => JSON.parse(fs.readFileSync(AKAR + 'public/data/' + f, 'utf8'));
export const ISU_IDS = ['pensiun-dini-pltu', 'pltu-captive', 'jetp-cipp', 'co-firing-biomassa', 'dmo-harga-batubara', 'oversupply-take-or-pay', 'harga-patokan-112'];
export const REGULASI_IDS = ['perpres-112-2022', 'pp-40-2025', 'permen-esdm-12-2023', 'permen-esdm-19-2017', 'uu-30-2009', 'perpres-110-2025'];
const r1 = (x, d = 0) => Math.round(x * 10 ** d) / 10 ** d;

export function bangun(w = {}) {
  const pltu = w.pltu || baca('pltu.json'), cap = w.cap || baca('captive_power.json'), radar = w.radar || baca('radar_kabupaten.json');
  const enb = w.enb || baca('energi_baru.json'), isu = w.isu || baca('isu.json'), reg = w.reg || baca('regulasi.json');
  const galat = [];
  const pid = new Set(pltu.baris.map((b) => b.id)), sumber = new Set(SUMBER.map((s) => s.id));
  const cek = (id, dari) => { if (!sumber.has(id)) galat.push(`sumber tak ada: ${id} (${dari})`); };
  for (const x of [...PRODUKSI, ...BIAYA, ...PENDANAAN, ...PEKERJA]) { cek(x.sumber_id, x.id || x.tahun); if (x.pid && !pid.has(x.pid)) galat.push(`pltu tak ada: ${x.pid}`); }
  for (const i of ISU_IDS) if (!isu.baris.some((b) => b.id === i)) galat.push(`isu tak ada: ${i}`);
  for (const i of REGULASI_IDS) if (!reg.baris.some((b) => b.id === i)) galat.push(`regulasi tak ada: ${i}`);
  const cf = enb.baris.filter((b) => b.bagian === 'cofiring').map((b) => b.id);
  const h2 = enb.baris.filter((b) => b.id.startsWith('h2-')).map((b) => b.id);
  const P = cap.parameter, capIds = new Set(cap.pembangkit.map((b) => b.id));
  // pengganti EBT per pembangkit operasi: energi = MW x FK batubara x jam; MW EBT = energi x bauran / (FK EBT x jam). Hipotesis.
  const baris = pltu.baris.filter((b) => b.st === 'operasi' && b.mw_operasi > 0).map((b) => {
    const mwh = b.mw_operasi * P.fk_batubara * P.jam;
    const sep = Object.fromEntries(Object.keys(P.bauran).map((k) => [k, r1(mwh * P.bauran[k] / (P.fk_ebt[k] * P.jam))]));
    return { pid: b.id, prov: b.prov, mw: b.mw_operasi, captive: capIds.has(b.id), mwh_tahun_est: Math.round(mwh), sepadan_mw: { ...sep, total: r1(Object.values(sep).reduce((a, c) => a + c, 0)) } };
  }).sort((a, c) => c.mw - a.mw);
  const prov = {};
  for (const b of baris) {
    const p = (prov[b.prov] ??= { kode: b.prov, mw: 0, n: 0, sepadan_mw: { surya: 0, bayu: 0, firm: 0 } });
    p.mw += b.mw; p.n++; for (const k of Object.keys(p.sepadan_mw)) p.sepadan_mw[k] += b.sepadan_mw[k];
  }
  const provinsi = Object.values(prov).map((p) => {
    const c = radar.provinsi[p.kode]?.mentah?.celah;
    const celah = c ? { surya: r1(c.surya), bayu: r1(c.bayu), firm: r1(c['hidro'] + c['panas-bumi'] + c.bioenergi) } : null;
    const s = Object.fromEntries(Object.entries(p.sepadan_mw).map(([k, v]) => [k, r1(v)]));
    return { ...p, sepadan_mw: s, celah_mw: celah, rasio: celah ? Object.fromEntries(Object.keys(s).map((k) => [k, celah[k] ? r1(celah[k] / s[k], 2) : 0])) : null };
  }).sort((a, c) => c.mw - a.mw);
  const biaya = BIAYA.map((x) => ({ ...x, tanggal: TGL, per_mw_est: x.usd_juta ? { nilai: r1(x.usd_juta / x.mw, 2), satuan: 'juta USD per MW' } : { nilai: r1(x.idr_triliun * 1000 / x.mw, 2), satuan: 'miliar Rp per MW' } }));
  return {
    data: {
      lapis: 'publik', dibangun_pada: TGL, sumber: SUMBER.map((s) => ({ ...s, tanggal_periksa: TGL })),
      tambang: { produksi: PRODUKSI.map((x) => ({ ...x, tanggal: TGL })), rujukan: { hba: 'pasar_listrik.json#hba', dmo: 'pasar_listrik.json#dmo', analisis: 'pasar_listrik.json#analisis' } },
      armada: { rujukan: 'pltu.json', captive: 'captive_power.json' },
      pensiun: { biaya, kandidat: 'pltu.json#kandidat', jetp: 'jetp_cipp.json' },
      pengganti: { param: { fk_batubara: P.fk_batubara, bauran: P.bauran, fk_ebt: P.fk_ebt, jam: P.jam, tingkat_bukti: 'hipotesis', dari: 'captive_power.json#parameter', celah_dari: 'radar_kabupaten.json#provinsi.mentah.celah' }, baris, provinsi },
      cofiring: { energi_baru_ids: cf, hidrogen_amonia_ids: h2, bioenergi: 'bioenergi.json#cofiring' },
      pekerja: { faktor: PEKERJA.map((x) => ({ ...x, tanggal: TGL })), faktor_ebt: 'riset/tenaga_kerja.json', skenario_ton: { dasar: 'pasar_listrik.json#analisis.tahunan.volume_pembangkit_juta_t', tingkat_bukti: 'hipotesis' } },
      pendanaan: { angka: PENDANAAN.map((x) => ({ ...x, tanggal: TGL })), rujukan: ['jetp_cipp.json', 'global/pembiayaan_luar.json', 'pendanaan_internasional.json'] },
      kebijakan: { pasal3: PASAL3, sumber_id: 'perpres-112', tingkat_bukti: 'resmi', regulasi_ids: REGULASI_IDS },
      isu_ids: ISU_IDS,
      meta: { diperbarui: TGL, celah: CELAH.map((c) => c.id), celah_en: CELAH.map((c) => c.en) },
    }, galat,
  };
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { data, galat } = bangun();
  if (galat.length) { console.error(galat.join('\n')); process.exit(1); }
  fs.writeFileSync(AKAR + 'public/data/transisi_pltu.json', JSON.stringify(data, null, 1) + '\n');
  console.log('transisi_pltu.json:', data.pengganti.baris.length, 'PLTU,', data.pengganti.provinsi.length, 'provinsi');
}
