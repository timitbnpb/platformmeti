// public/data/ruptl_pengembang.json: nama perusahaan pengembang untuk baris RUPTL berlabel IPP / SH-PLN.
//   node scripts/pipa/data_pengembang.mjs bangun <tgl>      (tanpa jaringan; tanggal dari masukan)
// Urutan sumber: (1) pemilik non-status pada proyek tertaut (public/data/proyek.json), (2) GEM (data/gem/*, CC BY 4.0),
// (3) kurasi tertulis (data/ruptl_pengembang_kurasi.json, tiap baris wajib sumber_url). Yang ambigu TIDAK dicocokkan.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { namaBaku } from '../../public/inti/nama_baku.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const baca = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf-8'));
const STATUS = /^(IPP|PLN|SH-PLN)$/;
const TEK = { hidro: 'hydropower', 'panas-bumi': 'geothermal', surya: 'solar', bayu: 'wind' };
const GENERIK = new Set(['plta', 'pltp', 'plts', 'pltb', 'pltm', 'pltmh', 'pltsa', 'pltbm', 'ftp2', 'hydroelectric', 'plant', 'geothermal', 'power', 'solar', 'farm', 'wind', 'pembangkit', 'listrik', 'tenaga', 'air', 'panas', 'bumi', 'surya', 'bayu', 'pv', 'ekspansi', 'unit', 'tahap', 'phase', 'project', 'and', 'dan']);
const PLN_PERSERO = /^pt pln \(persero\)$/i;

export const inti = (s) => String(s ?? '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/).filter((k) => k && !GENERIK.has(k) && !/^\d+$/.test(k) && k.length > 1);
export const jaccard = (a, b) => { const A = new Set(a), B = new Set(b); if (!A.size || !B.size) return 0; let i = 0; for (const x of A) if (B.has(x)) i++; return i / (A.size + B.size - i); };
const mirip = (a, b) => b > 0 && Math.abs(a - b) / Math.max(a, b) <= 0.2;
const normOrg = (s) => String(s ?? '').toLowerCase().replace(/\b(pt|tbk|persero|cv|ltd|pte|inc|corp)\b/g, ' ').replace(/\([^)]*\)/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim();

// pemilik terbesar; imbang -> maks 2 nama digabung (konsorsium); tanpa persen dan >2 nama -> ambigu (null)
export function pilihUtama(daftar) {
  const d = daftar.filter((x) => x.nama);
  if (!d.length) return null;
  if (d.some((x) => x.persen == null) && d.some((x) => x.persen != null)) return null; // persen sebagian: tidak sebanding
  const maks = Math.max(...d.map((x) => x.persen ?? -1));
  const atas = d.filter((x) => (x.persen ?? -1) === maks);
  return atas.length <= 2 ? atas.map((x) => x.nama) : null;
}

function dariProyek(p) {
  const d = (p?.pihak?.pemilik || []).filter((o) => !STATUS.test(o.nilai));
  if (!d.length) return null;
  const nonGem = d.filter((o) => !/GEM/.test(o.catatan || ''));
  const pakai = nonGem.length ? nonGem : d;
  const nama = pilihUtama(pakai.map((o) => ({ nama: o.nilai, persen: /(\d+)%/.exec(o.catatan || '')?.[1] ? +/(\d+)%/.exec(o.catatan)[1] : null })));
  if (!nama) return null;
  const sid = pakai.find((o) => o.nilai === nama[0]).sumber_id;
  const s = (p.sumber || []).find((x) => x.id === sid);
  return { nama, sumber: nonGem.length ? 'proyek.json' : 'GEM (via proyek.json)', sumber_url: s?.url || null, bukti: nonGem.length ? 'media' : 'kajian' };
}

export function gemIndeks() {
  const out = [];
  for (const [tek, f] of Object.entries(TEK)) {
    const g = baca(`data/gem/${f}.json`);
    const grup = new Map();
    for (const b of g.baris) {
      if (!b.pemilik?.length) continue;
      const k = b.lokasi_id || b.gem_id;
      if (!grup.has(k)) grup.set(k, { tek, prov: b.provinsi, nama: [b.nama, b.nama_lokal, b.nama_lain].filter(Boolean), mw: [], pemilik: b.pemilik, url: b.url_wiki, rilis: g.rilis, gem_id: b.gem_id });
      const x = grup.get(k); x.mw.push(b.kapasitas_mw || 0);
    }
    for (const x of grup.values()) { x.total = x.mw.reduce((a, b) => a + b, 0); out.push(x); }
  }
  return out;
}

export function cocokGem(r, idx) {
  const rn = inti(r.nama);
  const calon = idx.filter((x) => x.tek === r.teknologi && x.prov === r.provinsi && rn.length && Math.max(...x.nama.map((n) => jaccard(rn, inti(n)))) >= 0.5
    && (mirip(r.kapasitas_mw, x.total) || x.mw.some((m) => mirip(r.kapasitas_mw, m))));
  if (calon.length !== 1) return null; // nol atau ambigu: jangan dicocokkan
  const x = calon[0], nama = pilihUtama(x.pemilik.map((o) => ({ nama: o.nama, persen: o.persen })));
  return nama ? { nama, sumber: 'Global Energy Monitor', sumber_url: x.url || null, bukti: 'kajian', gem_id: x.gem_id } : null;
}

export function bangun(tgl, { ruptl = baca('public/data/ruptl.json'), proyek = baca('public/data/proyek.json'), org = baca('public/data/organisasi.json'), kurasi = fs.existsSync(path.join(ROOT, 'data/ruptl_pengembang_kurasi.json')) ? baca('data/ruptl_pengembang_kurasi.json') : { baris: {} }, gem = gemIndeks(), logoAda = (id) => fs.existsSync(path.join(ROOT, 'public/img/logo/org', id + '.png')) } = {}) {
  const P = new Map(proyek.baris.map((p) => [p.id, p]));
  const orgIdx = new Map(org.baris.map((o) => [normOrg(o.nama), o]));
  const hasil = {};
  const hitung = { ipp: 0, ipp_kenal: 0, sh: 0, sh_kenal: 0, per_sumber: {} };
  for (const r of ruptl.baris) {
    const ipp = r.pengembang_status === 'IPP', sh = r.pengembang_status === 'SH-PLN';
    if (!ipp && !sh) continue;
    hitung[ipp ? 'ipp' : 'sh']++;
    const k = kurasi.baris?.[r.id];
    if (k && !(k.sumber_url && k.tanggal_periksa && k.tingkat_bukti)) throw new Error('kurasi ' + r.id + ' tanpa sumber_url/tanggal_periksa/tingkat_bukti');
    let h = k ? { nama: [k.nama], sumber: k.sumber || 'kurasi', sumber_url: k.sumber_url, bukti: k.tingkat_bukti } : dariProyek(P.get(r.proyek_id)) || cocokGem(r, gem);
    if (h && sh) h.nama = h.nama.filter((n) => !PLN_PERSERO.test(n));
    if (!h || !h.nama.length) continue;
    const nama = h.nama.map((n) => namaBaku(n).nama.replace(/\s*\([A-Z]{2,6}\)\s*$/, ''));
    const o = nama.length === 1 ? orgIdx.get(normOrg(nama[0])) : null;
    hasil[r.id] = { nama: nama.join(' / '), ...(o ? { org_id: o.id, ...(logoAda(o.id) ? { logo: true } : {}) } : {}), sumber: h.sumber, ...(h.sumber_url ? { sumber_url: h.sumber_url } : {}), tingkat_bukti: h.bukti, tanggal_periksa: tgl };
    hitung[ipp ? 'ipp_kenal' : 'sh_kenal']++;
    hitung.per_sumber[h.sumber] = (hitung.per_sumber[h.sumber] || 0) + 1;
  }
  return { meta: { diperbarui: tgl, keterangan: 'Perusahaan pengembang untuk baris RUPTL berlabel IPP/SH-PLN. Dicocokkan lewat proyek tertaut, lalu GEM (nama+teknologi+provinsi+kapasitas +-20%, ambigu dilewati). Pemilik terbesar menurut sumber; bukan pernyataan resmi PLN.', ...hitung }, baris: hasil };
}

if (process.argv[1] === fileURLToPath(import.meta.url) && process.argv[2] === 'bangun') {
  const tgl = process.argv[3]; if (!/^\d{4}-\d\d-\d\d$/.test(tgl || '')) { console.error('pakai: bangun <YYYY-MM-DD>'); process.exit(1); }
  const o = bangun(tgl);
  fs.writeFileSync(path.join(ROOT, 'public/data/ruptl_pengembang.json'), JSON.stringify(o, null, 1) + '\n', 'utf-8');
  console.log(JSON.stringify(o.meta));
}
