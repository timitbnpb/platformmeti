#!/usr/bin/env node
// public/data/tender.json: radar tender dan pengadaan EBT.
//   node scripts/pipa/data_tender.mjs            bangun
//   node scripts/pipa/data_tender.mjs --selftest
// Sumber: (1) lelang WKP/PSPE 2025 dari public/data/wkp.json, (2) data/tender/seed.json (pengumuman PLN/ESDM yang dikurasi),
// (3) unduhan opentender.net (OCDS, ODbL) di data-panen/tender/opentender*.json BILA pemilik mengunduhnya sendiri.
// opentender.net robots.txt = "Disallow: /" untuk semua agen (dicek 8 Nov 2026): skrip ini TIDAK mengambilnya lewat jaringan.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { ROOT, TGL, baca, bacaAda, norm, saring, bungkus, tulis } from './dataset_lib.mjs';

const TEK = [['plts', /\bplts\b|surya|solar|photovoltaic/i], ['pltb', /\bpltb\b|bayu|angin|wind/i], ['pltmh', /\bpltmh\b|\bpltm\b|mikro ?hidro|minihidro/i], ['pltp', /\bpltp\b|panas ?bumi|geothermal|\bwkp\b|\bpspe\b/i],
  ['pltbm', /\bpltbm\b|biomassa|biomass/i], ['pltsa', /\bpltsa\b|sampah|waste/i], ['baterai', /baterai|battery|\bbess\b/i], ['spklu', /\bspklu\b|pengisian.*kendaraan listrik|charging/i],
  ['jaringan', /transmisi|gardu|jaringan listrik|sutt/i], ['studi', /studi kelayakan|feasibility|\bfs\b/i], ['plta', /\bplta\b|hidro|tenaga air/i]];
export const teknologiDari = (s) => { const h = TEK.find(([, r]) => r.test(s)); return h ? h[0] : null; };
export const EBT = /plts|pltb|pltmh|pltm\b|pltp|pltbm|pltsa|plta\b|surya|solar|bayu|angin|panas ?bumi|geothermal|wkp|pspe|biomassa|sampah|baterai|battery|bess|spklu|energi (baru|terbarukan)|\bebt\b|ebtke|studi kelayakan.*(energi|listrik)/i;
const TAHAP = { planning: 'perencanaan', active: 'lelang', complete: 'selesai', cancelled: 'batal', unsuccessful: 'gagal', withdrawn: 'batal' };
const PROV = ['Aceh', 'Sumatera Utara', 'Sumatera Barat', 'Riau', 'Kepulauan Riau', 'Jambi', 'Sumatera Selatan', 'Bangka Belitung', 'Bengkulu', 'Lampung', 'DKI Jakarta', 'Banten', 'Jawa Barat', 'Jawa Tengah', 'DI Yogyakarta', 'Jawa Timur', 'Bali', 'Nusa Tenggara Barat', 'Nusa Tenggara Timur', 'Kalimantan Barat', 'Kalimantan Tengah', 'Kalimantan Selatan', 'Kalimantan Timur', 'Kalimantan Utara', 'Sulawesi Utara', 'Gorontalo', 'Sulawesi Tengah', 'Sulawesi Barat', 'Sulawesi Selatan', 'Sulawesi Tenggara', 'Maluku', 'Maluku Utara', 'Papua Barat', 'Papua'];
export const provinsiDari = (s) => PROV.slice().sort((a, b) => b.length - a.length).find((p) => new RegExp('\\b' + p + '\\b', 'i').test(s || '')) || null;
const ODBL = { id: 'opentender', judul: 'opentender.net (Indonesia Corruption Watch), data pengadaan format OCDS', penerbit: 'ICW', lisensi: 'ODbL 1.0; wajib atribusi "opentender.net / ICW" dan bagi-serupa', url: 'https://opentender.net', tahun: 2026 };

/** Satu rilis OCDS -> baris tender, atau null bila bukan EBT / sebelum 2018 / tanpa tanggal. */
export function dariOcds(r, tglAmbil, orgIndeks = new Map()) {
  const t = r.tender || {}, judul = String(t.title || '').trim(), uraian = `${judul} ${t.description || ''}`;
  const tanggal = String(t.tenderPeriod?.startDate || r.date || '').slice(0, 10);
  if (!judul || !EBT.test(uraian) || !/^\d{4}-\d{2}-\d{2}$/.test(tanggal) || tanggal < '2018-01-01') return null;
  const aw = (r.awards || [])[0], pem = aw?.suppliers?.[0]?.name || null, ocid = r.ocid || r.id;
  const lokasi = (t.items || []).map((i) => i.deliveryAddress?.region).find(Boolean) || null;
  return { id: 'tdr_' + String(ocid).replace(/[^A-Za-z0-9]+/g, '_'), judul, instansi: r.buyer?.name || t.procuringEntity?.name || null, nilai_idr: t.value?.amount != null && (t.value.currency || 'IDR') === 'IDR' ? Number(t.value.amount) : null,
    jenis_nilai: 'pagu/HPS', tahap: TAHAP[t.status] || 'lelang', tanggal, tahun: +tanggal.slice(0, 4), pemenang: pem, org_id: pem ? orgIndeks.get(norm(pem)) || null : null,
    lokasi: lokasi, provinsi: provinsiDari(lokasi), teknologi: teknologiDari(uraian), sumber_id: 'opentender', sumber_url: 'https://opentender.net', tanggal_sumber: tglAmbil, tingkat_bukti: 'resmi' };
}
/** Lelang WKP/PSPE 2025 dari wkp.json (sumber berita; tingkat media). Pemenang belum ada. */
export function dariWkp(wkp, sumberById) {
  return wkp.baris.filter((w) => w.status === 'lelang').map((w) => {
    const s = sumberById.get(w.sumber_ids?.[0]); if (!s) return null;
    return { id: 'tdw_' + w.id, judul: `Lelang ${w.jenis} panas bumi ${w.nama}`, instansi: 'Kementerian ESDM', nilai_idr: null, jenis_nilai: null, tahap: 'lelang', tanggal: s.tanggal, tahun: w.tahun, pemenang: w.pemegang, org_id: w.organisasi_id,
      lokasi: w.provinsi, provinsi: w.provinsi, teknologi: 'pltp', rencana_mw: w.rencana_mw, sumber_id: s.id, sumber_url: s.url, tanggal_sumber: TGL, tingkat_bukti: 'media' };
  }).filter(Boolean);
}
export function bangun({ wkp, seed, ocds = [], organisasi = [] }) {
  const idx = new Map(organisasi.map((o) => [norm(o.nama), o.id]));
  const sumber = new Map([[ 'opentender', ODBL ], ...(seed.sumber || []).map((s) => [s.id, s])]);
  const sumberWkp = new Map(wkp.sumber.map((s) => [s.id, s]));
  for (const s of sumberWkp.values()) if (!sumber.has(s.id)) sumber.set(s.id, { id: s.id, judul: s.judul, penerbit: s.penerbit, tahun: s.tahun, url: s.url });
  const semua = [...dariWkp(wkp, sumberWkp), ...(seed.baris || []), ...ocds.map((r) => dariOcds(r, TGL, idx)).filter(Boolean)];
  const { ok, ditolak } = saring(semua);
  const vis = new Map(ok.map((b) => [b.id, b]));
  const baris = [...vis.values()].map((b) => ({ ...b, org_id: b.org_id || (b.pemenang ? idx.get(norm(b.pemenang)) || null : null) }));
  const pakai = new Set(baris.map((b) => b.sumber_id)), srcOut = [...sumber.values()].filter((s) => pakai.has(s.id));
  const celah = ['opentender.net melarang semua robot (robots.txt Disallow /): unduhan JSON/CSV harus diambil pemilik secara manual ke data-panen/tender/opentender*.json; tanpa berkas itu belum ada tender 2018-2024.',
    'Pengumuman pengadaan IPP PLN belum dipanen: halaman PLN berupa SPA tanpa daftar yang dapat dipanen sopan; hanya baris seed berkurasi yang masuk.', 'Hasil lelang WKP/PSPE 2025 (pemenang) belum ditemukan; nilai pagu/HPS null.'];
  return bungkus({ baris, sumber: srcOut, celah, ditolak, tambahMeta: { lisensi_opentender: ODBL.lisensi, dari_opentender: baris.filter((b) => b.sumber_id === 'opentender').length } });
}
export function selftest() {
  const r = { ocid: 'ocds-x-1', date: '2020-03-01T00:00:00Z', buyer: { name: 'Dinas ESDM Papua' }, tender: { title: 'Pembangunan PLTS Komunal Kampung A', status: 'complete', value: { amount: 1500000000, currency: 'IDR' }, items: [{ deliveryAddress: { region: 'Papua' } }] }, awards: [{ suppliers: [{ name: 'PT Arkora Hydro Tbk' }] }] };
  const b = dariOcds(r, TGL, new Map([[norm('PT Arkora Hydro Tbk'), 'ix_arko']]));
  assert.equal(b.tahap, 'selesai'); assert.equal(b.org_id, 'ix_arko'); assert.equal(b.teknologi, 'plts'); assert.equal(b.provinsi, 'Papua'); assert.equal(b.tahun, 2020);
  assert.equal(dariOcds({ ...r, tender: { ...r.tender, title: 'Pengadaan ATK' } }, TGL), null);
  assert.equal(dariOcds({ ...r, date: '2017-12-31T00:00:00Z' }, TGL), null);
  const h = bangun({ wkp: { baris: [], sumber: [] }, seed: { baris: [{ id: 'x', judul: 'PLTS tanpa sumber' }] }, ocds: [r], organisasi: [] });
  assert.equal(h.jumlah, 1); assert.equal(h.meta.ditolak_tanpa_sumber, 1);
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  selftest();
  if (process.argv.includes('--selftest')) console.log('selftest ok'); else {
    const dir = path.join(ROOT, 'data-panen/tender');
    const ocds = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => /^opentender.*\.json$/.test(f)).sort().flatMap((f) => { const j = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); return Array.isArray(j) ? j : j.releases || []; }) : [];
    const h = bangun({ wkp: baca('public/data/wkp.json'), seed: bacaAda('data/tender/seed.json') || {}, ocds, organisasi: baca('public/data/organisasi.json').baris });
    console.log('tender.json:', tulis('tender', h, ROOT), h.jumlah, 'baris; ditolak', h.meta.ditolak_tanpa_sumber);
  }
}
