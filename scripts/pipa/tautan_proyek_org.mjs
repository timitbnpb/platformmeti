// Tautan organisasi <-> proyek dari data yang SUDAH ada (tanpa jaringan, tanpa mengarang).
//   node scripts/pipa/tautan_proyek_org.mjs bangun <tgl>      tulis data/direktori/tautan_proyek_org.json
//   node scripts/pipa/tautan_proyek_org.mjs terapkan          gabung proyek_ids + proyek_peran ke public/data/organisasi.json
// Sumber: proyek.json pihak.*, ruptl_pengembang.json (org_id), pendanaan.json (lembaga_id/penerima_org_id + proyek_id).
// Pencocokan: nama baku persis (nama, singkatan, nama_lain; akhiran badan hukum dibuang) atau alias kurasi di bawah. Tanpa fuzzy.
// Nama pihak yang tidak punya padanan dicatat di `tanpa_padanan`, bukan ditebak. Rumus tidak ada di sini.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { namaBaku } from '../../public/inti/nama_baku.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const baca = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf-8'));
export const OUT = 'data/direktori/tautan_proyek_org.json';
const STATUS = /^(IPP|SH-PLN)$/; // bukan perusahaan
const PERAN = { pemilik: 'pemilik', epc: 'epc', pembeli: 'pembeli', peminjam: 'peminjam', pelaksana: 'pelaksana' };

export const norm = (s) => namaBaku(String(s ?? '')).nama.toLowerCase()
  .replace(/\((ipp|persero|tbk)\)/g, ' ').replace(/\(([^)]*)\)\s*$/, ' $1 ')
  .replace(/\b(pt|tbk|persero|cv|ltd|pte|pvt|inc|corp|corporation|co|sa|plc)\b\.?/g, ' ')
  .replace(/[^a-z0-9]+/g, ' ').trim();

// Alias kurasi: nama-di-sumber (sudah dinormalkan) -> id organisasi. Tiap baris wajib alasan; id yang tak ada di organisasi dibuang.
export const ALIAS = [
  ['indonesia power', 'p_5a2e7d0c63', 'PT Indonesia Power berganti nama menjadi PT PLN Indonesia Power'],
  ['pln ip', 'p_5a2e7d0c63', 'singkatan PLN Indonesia Power'],
  ['pembangkitan jawa bali', 'p_ff7a390a42', 'PT PJB berganti nama menjadi PT PLN Nusantara Power'],
  ['perusahaan listrik negara', 'su_ed074ff5', 'nama lengkap PLN'],
  ['pln', 'su_ed074ff5', 'PLN'],
  ['perusahaan listrik negara pln', 'su_ed074ff5', 'nama lengkap PLN'],
  ['barito renewables', 'p_bdd0f2d140', 'nama pendek PT Barito Renewables Energy Tbk'],
  ['ministry of energy and mineral resources', 'l_7278e0528a', 'terjemahan nama Kementerian ESDM'],
  ['ministry of finance', 'l_7b43a2574c', 'terjemahan nama Kementerian Keuangan'],
  ['ministry of finance republic of indonesia', 'l_7b43a2574c', 'terjemahan nama Kementerian Keuangan'],
];

export function aliasKurasi() {
  const f = path.join(ROOT, 'data/direktori/org_pemilik_kurasi.json'); if (!fs.existsSync(f)) return [];
  const k = baca('data/direktori/org_pemilik_kurasi.json');
  return [...k.alias.map((a) => [norm(a.nama), a.org_id, a.alasan]), ...k.baru.flatMap((b) => [b.nama, ...b.varian].map((n) => [norm(n), b.id, 'organisasi baru dari kurasi pemilik proyek']))];
}
export function indeksOrg(orgs, alias = [...ALIAS, ...aliasKurasi()]) {
  const idx = new Map(), ada = new Set(orgs.map((o) => o.id));
  const tambah = (k, id, cara) => { if (k && !idx.has(k)) idx.set(k, { id, cara }); else if (k && idx.get(k).id !== id) idx.set(k, { id: null, cara: 'ambigu' }); };
  for (const o of orgs) for (const n of [o.nama, o.singkatan, ...(o.nama_lain || [])]) if (n) for (const v of new Set([n, n.replace(/\s*\([^)]*\)\s*/g, ' ').trim()])) if (norm(v).length > 3) tambah(norm(v), o.id, 'nama-baku');
  for (const [k, id] of alias) if (ada.has(id)) idx.set(k, { id, cara: 'alias-kurasi' });
  return idx;
}
export function cari(nama, idx) {
  const s = String(nama ?? '').trim(); if (!s || STATUS.test(s)) return [];
  const utuh = idx.get(norm(s)); if (utuh) return utuh.id ? [{ ...utuh, nama: s }] : [];
  if (!/,/.test(s)) return [];
  return s.split(',').map((x) => x.trim()).map((x) => ({ x, h: idx.get(norm(x)) })).filter((e) => e.h?.id).map((e) => ({ ...e.h, nama: e.x, cara: e.h.cara + '+bagian' }));
}

export function gemPemilik() {
  const f = path.join(ROOT, 'data/proyek_gem.json'); if (!fs.existsSync(f)) return { perkaya: [], pemilik: new Map() };
  const pemilik = new Map();
  for (const t of ['solar', 'wind', 'hydropower', 'geothermal']) for (const b of baca(`data/gem/${t}.json`).baris) if (b.lokasi_id) { const s = pemilik.get(b.lokasi_id) || pemilik.set(b.lokasi_id, new Set()).get(b.lokasi_id); for (const o of b.pemilik || []) if (o.nama) s.add(o.nama); }
  return { perkaya: baca('data/proyek_gem.json').perkaya, pemilik: new Map([...pemilik].map(([k, v]) => [k, [...v]])) };
}

export function bangun(tgl, { proyek = baca('public/data/proyek.json'), org = baca('public/data/organisasi.json'), ruptl = baca('public/data/ruptl.json'), rp = baca('public/data/ruptl_pengembang.json'), pend = baca('public/data/pendanaan.json'), orgTambahan = [], gem = gemPemilik() } = {}) {
  const orgs = [...org.baris, ...orgTambahan.filter((o) => !org.baris.some((x) => x.id === o.id))];
  const publik = new Set(org.baris.map((o) => o.id)), pid = new Set(proyek.baris.map((p) => p.id));
  const idx = indeksOrg(orgs);
  const baris = {}, kosong = new Map();
  const catat = (oid, e) => { const l = baris[oid] || (baris[oid] = []); if (!l.some((x) => x.proyek_id === e.proyek_id && x.peran === e.peran)) l.push(e); };
  for (const p of proyek.baris) {
    const sumber = (id) => (p.sumber || []).find((s) => s.id === id)?.url || null;
    for (const [k, daftar] of Object.entries(p.pihak || {})) for (const v of daftar) {
      const hit = v.organisasi_id ? [{ id: v.organisasi_id, cara: 'id-sumber', nama: v.nilai }] : cari(v.nilai, idx);
      if (!hit.length && !STATUS.test(v.nilai)) { const kk = k + '|' + v.nilai; kosong.set(kk, (kosong.get(kk) || 0) + 1); }
      for (const h of hit) catat(h.id, { proyek_id: p.id, peran: PERAN[k] || k, nama_di_sumber: h.nama, cocok: h.cara, sumber: 'proyek.json pihak.' + k, sumber_url: sumber(v.sumber_id) });
    }
  }
  for (const x of gem.perkaya) { // pemilik GEM (CC BY 4.0) untuk proyek yang GEM-nya sudah dicocokkan ke proyek kita
    if (!pid.has(x.proyek_id)) continue;
    for (const n of gem.pemilik.get(x.gem_lokasi_id) || []) for (const h of cari(n, idx)) catat(h.id, { proyek_id: x.proyek_id, peran: 'pemilik', nama_di_sumber: n, cocok: h.cara, sumber: 'Global Energy Monitor ' + x.tracker + ' ' + x.gem_lokasi_id + ' (CC BY 4.0)', sumber_url: 'https://www.gem.wiki/' + encodeURIComponent(x.gem_nama.replace(/ /g, '_')) });
  }
  const rBy = new Map(ruptl.baris.map((r) => [r.id, r]));
  for (const [rid, v] of Object.entries(rp.baris || {})) {
    const r = rBy.get(rid); if (!v.org_id || !r?.proyek_id || !pid.has(r.proyek_id)) continue;
    catat(v.org_id, { proyek_id: r.proyek_id, peran: 'pemilik', nama_di_sumber: v.nama, cocok: 'id-sumber', sumber: 'ruptl_pengembang.json (' + v.sumber + ')', sumber_url: v.sumber_url || null });
  }
  for (const e of pend.pendanaan || []) {
    if (!e.proyek_id || !pid.has(e.proyek_id)) continue;
    if (e.lembaga_id) catat(e.lembaga_id, { proyek_id: e.proyek_id, peran: 'pendana', nama_di_sumber: e.pemberi, cocok: 'id-sumber', sumber: 'pendanaan.json ' + e.id, sumber_url: e.sumber_url || null });
    if (e.penerima_org_id) catat(e.penerima_org_id, { proyek_id: e.proyek_id, peran: 'penerima pendanaan', nama_di_sumber: e.penerima, cocok: 'id-sumber', sumber: 'pendanaan.json ' + e.id, sumber_url: e.sumber_url || null });
  }
  const ada = new Set(orgs.map((o) => o.id));
  for (const id of Object.keys(baris)) if (!ada.has(id)) delete baris[id];
  for (const l of Object.values(baris)) l.sort((a, b) => a.proyek_id.localeCompare(b.proyek_id) || a.peran.localeCompare(b.peran));
  const urut = Object.fromEntries(Object.keys(baris).sort().map((k) => [k, baris[k]]));
  const tanpa = [...kosong].map(([k, n]) => { const [peran, nama] = k.split('|'); return { nama, peran, proyek: n }; }).sort((a, b) => b.proyek - a.proyek || a.nama.localeCompare(b.nama));
  return { meta: { diperbarui: tgl, organisasi_bertaut: Object.keys(urut).length, organisasi_publik_bertaut: Object.keys(urut).filter((i) => publik.has(i)).length, tautan: Object.values(urut).reduce((a, l) => a + l.length, 0), keterangan: 'Tautan organisasi-proyek dari data yang sudah ada; cocok = nama baku persis, alias kurasi, atau id dari sumber. Bukan pernyataan resmi kepemilikan.' }, baris: urut, tanpa_padanan: tanpa };
}

export function terapkan(org, t) {
  let ubah = 0;
  for (const o of org.baris) {
    const l = t.baris[o.id]; if (!l) continue;
    const ids = [...new Set([...(o.proyek_ids || []), ...l.map((x) => x.proyek_id)])].sort();
    const peran = [...new Map(l.map((x) => [x.proyek_id + '|' + x.peran, { proyek_id: x.proyek_id, peran: x.peran }])).values()];
    if (ids.length !== (o.proyek_ids || []).length) ubah++;
    o.proyek_ids = ids; o.proyek_peran = peran;
  }
  return ubah;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [, , cmd, tgl] = process.argv;
  const sebelum = () => baca('public/data/organisasi.json').baris.filter((o) => (o.proyek_ids || []).length).length;
  if (cmd === 'bangun') {
    if (!/^\d{4}-\d\d-\d\d$/.test(tgl || '')) { console.error('pakai: bangun <YYYY-MM-DD>'); process.exit(1); }
    const f = path.join(ROOT, 'data-panen/potret/publik/organisasi.json');
    const t = bangun(tgl, { orgTambahan: fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf-8')).baris : [] });
    fs.writeFileSync(path.join(ROOT, OUT), JSON.stringify(t, null, 1) + '\n', 'utf-8');
    console.log(JSON.stringify({ sebelum_publik: sebelum(), ...t.meta, tanpa_padanan: t.tanpa_padanan.length }));
  } else if (cmd === 'terapkan') {
    const fo = path.join(ROOT, 'public/data/organisasi.json'), org = JSON.parse(fs.readFileSync(fo, 'utf-8'));
    const n = terapkan(org, baca(OUT));
    fs.writeFileSync(fo, JSON.stringify(org), 'utf-8');
    console.log('organisasi dengan proyek_ids:', org.baris.filter((o) => (o.proyek_ids || []).length).length, 'bertambah isi:', n);
  } else { console.error('pakai: bangun <tgl> | terapkan'); process.exit(1); }
}
