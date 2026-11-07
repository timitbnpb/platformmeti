#!/usr/bin/env node
// Global Energy Monitor (CC BY 4.0, atribusi wajib) -> ringkasan Indonesia, pencocokan proyek, PLTU, kandidat lembaga.
//   python3 -I scripts/panen/gem_xlsx.py <folder-xlsx> data-panen/gem/raw     (baca xlsx tak tepercaya, stdlib saja)
//   node scripts/pipa/gem.mjs --bangun      raw -> data/gem/*.json, data/proyek_gem.json, data/strategis/pltu.json,
//                                           data/direktori/kandidat_lembaga_gem.json
//   node scripts/pipa/gem.mjs --terapkan    data/proyek_gem.json -> data-panen/proyek/{proyek,sumber}.jsonl (idempoten)
//   node scripts/pipa/gem.mjs --selftest
// Lalu: node scripts/pipa/potret.mjs. Tanpa jaringan. Tidak menimpa status bersumber lain: beda dicatat di beda_status.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const RAW = path.join(ROOT, 'data-panen/gem/raw');
const TGL_AMBIL = '2026-11-08';
const LISENSI = 'CC BY 4.0';
// rilis dari nama berkas unduhan pemilik
export const TRACKER = {
  solar: { nama: 'Global Solar Power Tracker', rilis: '2026-02', teknologi: 'surya', halaman: 'https://globalenergymonitor.org/projects/global-solar-power-tracker/' },
  wind: { nama: 'Global Wind Power Tracker', rilis: '2026-02', teknologi: 'bayu', halaman: 'https://globalenergymonitor.org/projects/global-wind-power-tracker/' },
  hydropower: { nama: 'Global Hydropower Tracker', rilis: '2026-03', teknologi: 'hidro', halaman: 'https://globalenergymonitor.org/projects/global-hydropower-tracker/' },
  geothermal: { nama: 'Global Geothermal Power Tracker', rilis: '2026-03', teknologi: 'panas-bumi', halaman: 'https://globalenergymonitor.org/projects/global-geothermal-power-tracker/' },
  coal: { nama: 'Global Coal Plant Tracker', rilis: '2026-07', teknologi: 'batubara', halaman: 'https://globalenergymonitor.org/projects/global-coal-plant-tracker/' },
};
const ATRIBUSI = (t) => `Global Energy Monitor, ${TRACKER[t].nama}, ${TRACKER[t].rilis}, ${LISENSI}; diunduh pemilik, diolah METI ${TGL_AMBIL}`;

// ---- normalisasi umum ----
const lepasAksen = (s) => String(s || '').normalize('NFKD').replace(/[̀-ͯ]/g, '');
export const norm = (s) => lepasAksen(s).toLowerCase().replace(/\([^)]*\)/g, ' ').replace(/\b(pt|tbk|persero|cv|perseroda|ud|ltd|co|inc|corp)\b/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim();
const GENERIK = new Set('plt pltp plta plts pltb pltm pltmh pltu pltsa ps power plant station project projects geothermal hydroelectric hydropower hydro solar wind farm pv photovoltaic phase unit stage dam pumped storage bess panas bumi indonesia energy listrik tenaga uap sumatera jawa kalimantan sulawesi sulbagut sulbagsel n'.split(' '));
const ROMAWI = { i: '1', ii: '2', iii: '3', iv: '4', v: '5' };
export const tokenNama = (s) => new Set(norm(s).split(' ').map((t) => ROMAWI[t] || t).filter((t) => t && !GENERIK.has(t)));
const ARAH = new Set('barat timur utara selatan tengah west east north south central'.split(' '));
const angkaSaja = (s) => new Set([...s].filter((t) => /^\d+$/.test(t)));
const kataSaja = (s) => new Set([...s].filter((t) => !/^\d+$/.test(t)));
export const jaccard = (a, b) => { if (!a.size || !b.size) return 0; let i = 0; for (const x of a) if (b.has(x)) i++; return i / (a.size + b.size - i); };
const num = (v) => { const n = parseFloat(String(v ?? '').replace(',', '.')); return Number.isFinite(n) ? n : null; };
const tahun = (v) => { const n = num(v); return n && n > 1800 && n < 2200 ? Math.trunc(n) : null; };
const serialTgl = (v) => { const n = num(v); if (n == null) return null; if (n > 1900 && n < 2200) return String(Math.trunc(n)); return new Date(Date.UTC(1899, 11, 30) + n * 864e5).toISOString().slice(0, 10); };
const tglGem = (v) => { const s = String(v || ''); if (/^\d{4}\/\d\d\/\d\d/.test(s)) return s.slice(0, 10).replace(/\//g, '-'); return serialTgl(s); };
export function jarakKm(a, b, c, d) { const r = Math.PI / 180, dl = (c - a) * r, dg = (d - b) * r; const h = Math.sin(dl / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin(dg / 2) ** 2; return 12742 * Math.asin(Math.sqrt(h)); }

const PROV = { aceh: 'Aceh', 'north sumatra': 'Sumatera Utara', 'north sumatera': 'Sumatera Utara', 'sumatera utara': 'Sumatera Utara', 'west sumatra': 'Sumatera Barat', 'west sumatera': 'Sumatera Barat', 'south sumatra': 'Sumatera Selatan', 'south sumatera': 'Sumatera Selatan', riau: 'Riau', 'riau islands': 'Kepulauan Riau', batam: 'Kepulauan Riau', jambi: 'Jambi', bengkulu: 'Bengkulu', lampung: 'Lampung', 'bangka belitung islands': 'Kepulauan Bangka Belitung', banten: 'Banten', 'west java': 'Jawa Barat', 'central java': 'Jawa Tengah', 'east java': 'Jawa Timur', yogyakarta: 'DI Yogyakarta', jakarta: 'DKI Jakarta', bali: 'Bali', 'west nusa tenggara': 'Nusa Tenggara Barat', 'nusa tenggara barat': 'Nusa Tenggara Barat', 'east nusa tenggara': 'Nusa Tenggara Timur', 'nusa tenggara timur': 'Nusa Tenggara Timur', 'east nusa': 'Nusa Tenggara Timur', 'central sumba': 'Nusa Tenggara Timur', 'west kalimantan': 'Kalimantan Barat', 'central kalimantan': 'Kalimantan Tengah', 'south kalimantan': 'Kalimantan Selatan', 'east kalimantan': 'Kalimantan Timur', 'north kalimantan': 'Kalimantan Utara', 'north sulawesi': 'Sulawesi Utara', 'sulawesi utara': 'Sulawesi Utara', 'central sulawesi': 'Sulawesi Tengah', 'south sulawesi': 'Sulawesi Selatan', 'south east sulawesi': 'Sulawesi Tenggara', 'southeast sulawesi': 'Sulawesi Tenggara', 'west sulawesi': 'Sulawesi Barat', gorontalo: 'Gorontalo', maluku: 'Maluku', 'north maluku': 'Maluku Utara', 'maluku utara': 'Maluku Utara', papua: 'Papua', 'central papua': 'Papua Tengah', 'south papua': 'Papua Selatan', 'west papua': 'Papua Barat', 'southwest papua': 'Papua Barat Daya', 'highland papua': 'Papua Pegunungan' };
const KANON = new Map([...new Set(Object.values(PROV))].map((v) => [v.toLowerCase(), v]));
export const provinsiId = (s) => { const k = lepasAksen(s).toLowerCase().replace(/\b(province|provinsi|regency|kabupaten)\b/g, '').replace(/\s+/g, ' ').trim().replace(/^south aceh$/, 'aceh'); return PROV[k] || KANON.get(k) || null; };

export const statusGem = (s) => { const k = String(s || '').toLowerCase().replace(/\s*-\s*inferred.*$/, '').trim(); return { 'pre-permit': 'announced', permitted: 'pre-construction', mothballed: 'shelved' }[k] || k; };
export const STATUS_LOKAL = { operating: 'beroperasi', construction: 'konstruksi', 'pre-construction': 'rencana', announced: 'rencana', shelved: 'ditunda', cancelled: 'dibatalkan', retired: 'pensiun' };
const URUT_STATUS = ['operating', 'construction', 'pre-construction', 'announced', 'shelved', 'cancelled', 'retired'];
const HIDUP = new Set(['operating', 'construction', 'pre-construction']);

export function pisahPihak(s) {
  return String(s || '').split(';').map((x) => x.trim()).filter(Boolean).map((x) => { const m = x.match(/^(.*?)\s*\[([\d.]+)%\]$/); return { nama: (m ? m[1] : x).trim(), persen: m ? num(m[2]) : null }; })
    .filter((x) => x.nama && !/^(unknown|natural person\(s\)|small shareholder\(s\))$/i.test(x.nama));
}

// ---- 1. baris mentah -> ringkasan per fase/unit ----
const K = {
  solar: { n: 'Project Name', f: 'Phase Name', cap: 'Capacity (MW)', mulai: 'Start year', akhir: 'Retired year', prov: 'State/Province', kota: 'Major area (prefecture, district)', lok: 'GEM location ID', id: 'GEM phase ID', akur: 'Location accuracy', lain: 'Other Name(s)', lokal: 'Project Name in Local Language / Script', pemilik: 'Owner', operator: 'Operator', tgl: 'Date Last Researched' },
  wind: { n: 'Project Name', f: 'Phase Name', cap: 'Capacity (MW)', mulai: 'Start year', akhir: 'Retired year', prov: 'State/Province', kota: 'Major area (prefecture, district)', lok: 'GEM location ID', id: 'GEM phase ID', akur: 'Location accuracy', lain: 'Other Name(s)', lokal: 'Project Name in Local Language / Script', pemilik: 'Owner', operator: 'Operator', tgl: 'Date Last Researched' },
  hydropower: { n: 'Project Name', f: null, cap: 'Capacity (MW)', mulai: 'Start Year', akhir: 'Retired Year', prov: 'State/Province 1', kota: 'Major Area 1', lok: 'GEM location ID', id: 'GEM unit ID', akur: 'Location Accuracy', lain: 'Other name(s)', lokal: 'Project Name (local lang/script)', pemilik: 'Owner', operator: 'Operator', tgl: 'Date Last Researched' },
  geothermal: { n: 'Project Name', f: 'Unit Name', cap: 'Unit Capacity (MW)', mulai: 'Start Year', akhir: 'Retired Year', prov: 'State/Province', kota: 'Major area (prefecture, district)', lok: 'GEM location ID', id: 'GEM unit ID', akur: 'Location Accuracy', lain: 'Other Name(s)', lokal: 'Project Name in Local Language / Script', pemilik: 'Owner', operator: 'Operator', tgl: 'Date Last Researched' },
  coal: { n: 'Plant name', f: 'Unit name', cap: 'Capacity (MW)', mulai: 'Start year', akhir: 'Retired year', prov: 'Subnational unit (province, state)', kota: 'Major area (prefecture, district)', lok: 'GEM location ID', id: 'GEM unit/phase ID', akur: 'Location accuracy', lain: 'Plant name (other)', lokal: 'Plant name (local)', pemilik: 'Owner', operator: null, tgl: null },
};
export function ringkasBaris(t, r, lembar) {
  const k = K[t]; const g = (c) => (c && r[c] != null && r[c] !== '' && r[c] !== '--' ? String(r[c]).trim() : null);
  const lat = num(r.Latitude), lon = num(r.Longitude); const st = statusGem(r.Status);
  const kasar = g(k.prov); const prov = provinsiId(kasar);
  const o = {
    nama: g(k.n), fase: g(k.f), nama_lokal: g(k.lokal), nama_lain: g(k.lain), kapasitas_mw: num(r[k.cap]), status: st, status_asli: g('Status'),
    tahun_mulai: tahun(r[k.mulai]), tahun_pensiun: tahun(r[k.akhir]), pemilik: pisahPihak(r[k.pemilik]), operator: k.operator ? pisahPihak(r[k.operator]) : [],
    provinsi: prov, wilayah_asli: kasar, kota: g(k.kota) || g('Location') || g('City') || g('City 1'),
    lat, lon, akurasi: g(k.akur), gem_id: g(k.id), lokasi_id: g(k.lok), url_wiki: g('Wiki URL'), diriset: k.tgl ? tglGem(r[k.tgl]) : null,
  };
  if (lembar) o.lembar = lembar;
  if (t === 'hydropower') o.teknologi_tipe = g('Technology Type');
  if (t === 'geothermal') o.teknologi_tipe = g('Technology');
  if (t === 'solar') o.teknologi_tipe = g('Technology Type');
  if (t === 'wind') o.teknologi_tipe = g('Installation Type');
  if (t === 'coal') Object.assign(o, { rencana_pensiun: tahun(r['Planned retirement']), teknologi_pembakaran: g('Combustion technology'), jenis_batubara: g('Coal type'), captive: g('Captive'), chp: g('CHP'), induk: pisahPihak(r.Parent), pemilik_negara_persen: num(r['% State Ownership']), co2_juta_t_per_tahun: num(r['Annual CO2 (million tonnes / annum)']), sisa_umur_tahun: num(r['Remaining plant lifetime (years)']), umur_tahun: num(r['Plant age (years)']) });
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v != null && !(Array.isArray(v) && !v.length)));
}
function bacaRaw(t) {
  const f = path.join(RAW, t + '.json'); const d = JSON.parse(fs.readFileSync(f, 'utf8')); const out = []; let total = 0;
  for (const [lembar, l] of Object.entries(d.lembar)) for (const r of l.baris) { out.push(ringkasBaris(t, r, lembar)); }
  for (const l of Object.values(d.lembar)) total += l.baris_total;
  return { baris: out.sort((a, b) => String(a.gem_id).localeCompare(String(b.gem_id))), berkas: d.berkas, total };
}

// ---- 2. kelompok per lokasi (proyek) ----
export function kelompok(baris) {
  const per = new Map();
  for (const b of baris) { const k = b.lokasi_id || b.gem_id; (per.get(k) || per.set(k, []).get(k)).push(b); }
  return [...per.entries()].map(([lokasi_id, fase]) => {
    const hidup = fase.filter((f) => HIDUP.has(f.status)); const dasar = hidup.length ? hidup : fase;
    const status = URUT_STATUS.find((s) => dasar.some((f) => f.status === s)) || dasar[0].status;
    const ut = fase[0]; const kap = dasar.reduce((s, f) => s + (f.kapasitas_mw || 0), 0);
    const uniq = (fn) => [...new Map(dasar.flatMap(fn).map((x) => [x.nama, x])).values()];
    return { lokasi_id, nama: ut.nama, nama_lain: ut.nama_lain, status, kapasitas_mw: kap || null, kapasitas_fase: fase.map((f) => f.kapasitas_mw).filter((x) => x != null), fase, provinsi: ut.provinsi, lat: ut.lat, lon: ut.lon, akurasi: ut.akurasi, url_wiki: ut.url_wiki, kota: ut.kota, pemilik: uniq((f) => f.pemilik || []), operator: uniq((f) => f.operator || []), tahun_mulai: dasar.map((f) => f.tahun_mulai).filter(Boolean).sort()[0] || null, diriset: fase.map((f) => f.diriset).filter(Boolean).sort().pop() || null };
  });
}

// ---- 3. pencocokan ke proyek.jsonl ----
const LEMAH = new Set(['provinsi', 'kabupaten', undefined, null]);
const kapMirip = (a, g) => { if (!a || !g.kapasitas_mw) return true; const cek = (x) => x > 0 && a / x >= 0.5 && a / x <= 2; return cek(g.kapasitas_mw) || g.kapasitas_fase.some(cek); };
export function skorCocok(p, g, tek) {
  const tp = p.teknologi; if (tp !== tek && !(tek === 'hidro' && tp === 'penyimpanan' && /pumped/i.test(g.fase[0]?.teknologi_tipe || ''))) return 0;
  const namaP = (p.nama || []).map((n) => tokenNama(n.nilai)).filter((s) => s.size);
  const namaG = [g.nama, g.nama_lain].filter(Boolean).map(tokenNama).filter((s) => s.size);
  // kata (bukan angka) harus mirip; angka unit (Asahan 1 vs 3) bila keduanya ada harus beririsan
  let j = 0, sub = false; for (const a of namaP) for (const b of namaG) {
    const ka = kataSaja(a), kb = kataSaja(b); if (!ka.size || !kb.size) continue;
    if ([...ka, ...kb].some((t) => ARAH.has(t) && ka.has(t) !== kb.has(t))) continue; // Bali Barat bukan Bali
    const na = angkaSaja(a), nb = angkaSaja(b); if (na.size && nb.size && ![...na].some((x) => nb.has(x))) continue;
    const x = jaccard(ka, kb); if (x > j) { j = x; sub = [...ka].every((t) => kb.has(t)) || [...kb].every((t) => ka.has(t)); }
  }
  if (j < (sub ? 0.5 : 0.6)) return 0;
  const namaAman = namaP.some((s) => [...kataSaja(s)].some((t) => t.length >= 3)); if (!namaAman) return 0;
  const presisi = p.presisi_lokasi;
  if (p.lat != null && p.lng != null && g.lat != null && !LEMAH.has(presisi)) { if (jarakKm(p.lat, p.lng, g.lat, g.lon) > (g.akurasi === 'exact' ? 5 : 25)) return 0; }
  else if (p.provinsi && g.provinsi && provinsiId(p.provinsi) && provinsiId(p.provinsi) !== g.provinsi) return 0;
  const kapP = (p.kapasitas || []).find((c) => c.satuan === 'MW' && typeof c.nilai === 'number')?.nilai;
  if (!kapMirip(kapP, g)) return 0;
  if (j < 0.67 && !(kapP && g.kapasitas_mw)) return 0; // nama setengah cocok wajib didukung kapasitas
  return j + (kapP && g.kapasitas_mw ? 0.1 : 0);
}
const GENERIK_PEMILIK = (v) => /bukan nama perusahaan/.test(v.catatan || '');
const tanpaGem = (arr) => (arr || []).filter((v) => !/^gem-/.test(v.sumber_id || ''));
const idSumber = (t, g) => `gem-${t}-${g.lokasi_id}`;
export function sumberGem(t, g) {
  return { id: idSumber(t, g), jenis: 'gem-' + t, url: g.url_wiki || TRACKER[t].halaman, tingkat_bukti: 'kajian', lisensi: LISENSI, atribusi: ATRIBUSI(t), tanggal_rilis: TRACKER[t].rilis, tanggal_ambil: TGL_AMBIL, catatan: `${TRACKER[t].nama}; GEM location ID ${g.lokasi_id}` };
}
export function patchCocok(t, g, p0, orgPerNama = () => null) {
  const p = { ...p0, status: tanpaGem(p0.status), kapasitas: tanpaGem(p0.kapasitas), pemilik: tanpaGem(p0.pemilik), cod_aktual: tanpaGem(p0.cod_aktual) };
  const sid = idSumber(t, g); const perubahan = {}; const beda = [];
  const lokal = STATUS_LOKAL[g.status];
  if (!p.status.length) perubahan.status = [{ nilai: lokal, status_asli: `${g.status_asli || g.status} (GEM)`, sumber_id: sid }];
  else if (p.status[0].nilai !== lokal) beda.push({ proyek_id: p0.id, status_kita: p.status[0].nilai, sumber_kita: p.status[0].sumber_id, status_gem: g.status, status_gem_asli: g.fase.find((f) => f.status === g.status)?.status_asli, gem_id: g.lokasi_id });
  if (!p.kapasitas.length && g.kapasitas_mw) perubahan.kapasitas = [{ nilai: Math.round(g.kapasitas_mw * 100) / 100, satuan: 'MW', catatan: `jumlah ${g.fase.filter((f) => f.status === g.status).length} fase/unit GEM`, sumber_id: sid }];
  const pihak = g.pemilik.length ? g.pemilik : g.operator.map((x) => ({ ...x, peran: 'operator' }));
  if (pihak.length && (!p.pemilik.length || p.pemilik.every(GENERIK_PEMILIK))) perubahan.pemilik = [...p.pemilik, ...pihak.map((x) => ({ nilai: x.nama, ...(x.persen != null ? { catatan: `${x.persen}%${x.peran ? ', ' + x.peran : ''} (GEM)` } : { catatan: x.peran ? 'operator (GEM)' : 'GEM' }), sumber_id: sid }))];
  if (g.status === 'operating' && g.tahun_mulai && !p.cod_aktual.length) perubahan.cod_aktual = [{ nilai: g.tahun_mulai, catatan: 'tahun mulai operasi menurut GEM', sumber_id: sid }];
  const tekLemah = LEMAH.has(p0.presisi_lokasi) || p0.sumber_lokasi?.jenis === 'gem';
  if (g.lat != null && (tekLemah || (g.akurasi === 'exact' && p0.presisi_lokasi !== 'titik_persis'))) {
    perubahan.lokasi = { lat: g.lat, lng: g.lon, presisi_lokasi: g.akurasi === 'exact' ? 'titik_persis' : 'kabupaten', sumber_lokasi: { jenis: 'gem', url: g.url_wiki || TRACKER[t].halaman, lisensi: LISENSI, tanggal_ambil: TGL_AMBIL, catatan: `GEM ${TRACKER[t].nama} ${TRACKER[t].rilis}, akurasi ${g.akurasi || 'tidak disebut'}; ${g.lokasi_id}` } };
  }
  return { perubahan, beda };
}

export function barisBaru(t, g) {
  const sid = idSumber(t, g); const lokal = STATUS_LOKAL[g.status];
  const aktif = g.fase.filter((f) => f.status === g.status);
  return {
    id: `gem_${t}_${g.lokasi_id}`, nama: [{ nilai: g.nama + (g.fase.length === 1 && g.fase[0].fase ? ' ' + g.fase[0].fase : ''), sumber_id: sid }], teknologi: TRACKER[t].teknologi, provinsi: g.provinsi || null, kabupaten_kota: g.kota || null,
    program: null, programs: [], lat: g.lat ?? null, lng: g.lon ?? null, presisi_lokasi: g.akurasi === 'exact' ? 'titik_persis' : 'kabupaten',
    sumber_lokasi: { jenis: 'gem', url: g.url_wiki || TRACKER[t].halaman, lisensi: LISENSI, tanggal_ambil: TGL_AMBIL, catatan: `GEM ${TRACKER[t].nama} ${TRACKER[t].rilis}, akurasi ${g.akurasi || 'tidak disebut'}` },
    sumber_ids: [sid], kapasitas: g.kapasitas_mw ? [{ nilai: Math.round(g.kapasitas_mw * 100) / 100, satuan: 'MW', catatan: `jumlah ${aktif.length} fase/unit GEM`, sumber_id: sid }] : [],
    pemilik: (g.pemilik.length ? g.pemilik : g.operator).map((x) => ({ nilai: x.nama, catatan: x.persen != null ? `${x.persen}% (GEM)` : 'GEM', sumber_id: sid })), epc: [], pembeli: [], nilai_investasi: [], skema_kerjasama: [], tanggal_ppa: [], financial_close: [], cod_target: [],
    cod_aktual: g.status === 'operating' && g.tahun_mulai ? [{ nilai: g.tahun_mulai, catatan: 'tahun mulai menurut GEM', sumber_id: sid }] : [],
    status: [{ nilai: lokal, status_asli: `${g.fase.find((f) => f.status === g.status)?.status_asli || g.status} (GEM)`, sumber_id: sid }], tenaga_kerja: [], pemberi_dana: [], pihak_terlibat: [],
    catatan: [{ nilai: `Kandidat dari GEM ${TRACKER[t].nama} ${TRACKER[t].rilis} (belum ada di RUPTL/daftar kita); GEM location ID ${g.lokasi_id}`, sumber_id: sid }],
    tingkat_bukti: 'kajian', kandidat: true, asal: 'gem', publik: true,
  };
}

export function terapkanKeProyek(data, proyek, sumber) {
  const per = new Map(proyek.map((p) => [p.id, p])); const sid = new Map(sumber.map((s) => [s.id, s])); let diubah = 0, baru = 0;
  for (const s of data.sumber) sid.set(s.id, s);
  for (const c of data.perkaya) {
    const p = per.get(c.proyek_id); if (!p) continue;
    for (const k of ['status', 'kapasitas', 'pemilik', 'cod_aktual']) p[k] = tanpaGem(p[k]);
    for (const [k, v] of Object.entries(c.perubahan)) { if (k === 'lokasi') Object.assign(p, v); else p[k] = v; }
    p.sumber_ids = [...new Set([...(p.sumber_ids || []).filter((x) => !/^gem-/.test(x)), c.sumber_id])];
    diubah++;
  }
  for (const b of data.baru) { const i = proyek.findIndex((p) => p.id === b.id); if (i >= 0) proyek[i] = b; else { proyek.push(b); baru++; } }
  return { proyek, sumber: [...sid.values()], diubah, baru };
}

// ---- 4. pemilik -> organisasi ----
function petaOrganisasi() {
  const o = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/organisasi.json'), 'utf8')).baris; const m = new Map();
  for (const x of o) { for (const n of [x.nama, x.singkatan, ...(x.nama_lain || [])]) if (n && norm(n)) m.set(norm(n), x.id); }
  return (n) => m.get(norm(n)) || null;
}

// ---- 5. bangun ----
const baca = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
const tulis = (rel, obj) => { const f = path.join(ROOT, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(obj, null, 1) + '\n', 'utf8'); };

function bangun() {
  const orgDari = petaOrganisasi(); const hasil = {}; const ringkas = {};
  for (const t of Object.keys(TRACKER)) {
    const r = bacaRaw(t); const bar = r.baris.map((b) => ({ ...b, pemilik: b.pemilik?.map((x) => ({ ...x, organisasi_id: orgDari(x.nama) || undefined })), operator: b.operator?.map((x) => ({ ...x, organisasi_id: orgDari(x.nama) || undefined })) }));
    hasil[t] = bar; ringkas[t] = { indonesia: bar.length, berkas: r.berkas };
    tulis(`data/gem/${t}.json`, { sumber: TRACKER[t].nama, rilis: TRACKER[t].rilis, halaman: TRACKER[t].halaman, lisensi: LISENSI, atribusi: ATRIBUSI(t), berkas_asal: r.berkas, baris_dunia: r.total, jumlah: bar.length, baris: bar });
  }
  // pencocokan proyek
  const proyek = baca('data-panen/proyek/proyek.jsonl').filter((p) => p.publik !== false && !String(p.id).startsWith('gem_'));
  for (const p of proyek) { for (const k of ['status', 'kapasitas', 'pemilik', 'cod_aktual']) p[k] = tanpaGem(p[k]); }
  const pasang = []; const grup = {};
  for (const t of ['solar', 'wind', 'hydropower', 'geothermal']) {
    grup[t] = kelompok(hasil[t]);
    for (const g of grup[t]) for (const p of proyek) { const s = skorCocok(p, g, TRACKER[t].teknologi); if (s) pasang.push({ t, g, p, s }); }
  }
  pasang.sort((a, b) => b.s - a.s || a.p.id.localeCompare(b.p.id));
  const pakaiG = new Set(), pakaiP = new Set(), cocok = [];
  for (const x of pasang) { const kg = x.t + x.g.lokasi_id; if (pakaiG.has(kg) || pakaiP.has(x.p.id)) continue; pakaiG.add(kg); pakaiP.add(x.p.id); cocok.push(x); }
  const sumber = [], perkaya = [], beda_status = [], isiSebelum = { koordinat: 0, pemilik: 0, kapasitas: 0 }, isiSesudah = { koordinat: 0, pemilik: 0, kapasitas: 0 };
  for (const x of cocok) {
    const { perubahan, beda } = patchCocok(x.t, x.g, x.p, orgDari); sumber.push(sumberGem(x.t, x.g)); beda_status.push(...beda);
    perkaya.push({ proyek_id: x.p.id, tracker: x.t, gem_lokasi_id: x.g.lokasi_id, gem_nama: x.g.nama, skor: Math.round(x.s * 100) / 100, sumber_id: idSumber(x.t, x.g), perubahan });
    if (perubahan.lokasi) isiSesudah.koordinat++; if (perubahan.pemilik) isiSesudah.pemilik++; if (perubahan.kapasitas) isiSesudah.kapasitas++;
  }
  const baru = [], dicatat = [];
  for (const t of Object.keys(grup)) for (const g of grup[t]) {
    if (pakaiG.has(t + g.lokasi_id)) continue;
    if (HIDUP.has(g.status)) { baru.push(barisBaru(t, g)); sumber.push(sumberGem(t, g)); }
    else dicatat.push({ tracker: t, gem_lokasi_id: g.lokasi_id, nama: g.nama, status: g.status, kapasitas_mw: g.kapasitas_mw, url_wiki: g.url_wiki });
  }
  const urut = (a, b) => (a.id || a.gem_lokasi_id).localeCompare(b.id || b.gem_lokasi_id);
  tulis('data/proyek_gem.json', { _catatan: 'Hasil pencocokan GEM (CC BY 4.0) ke proyek kita. perkaya = isi ke baris yang ada (hanya bidang kosong/lemah; status berbeda TIDAK ditimpa, lihat beda_status); baru = kandidat berstatus operating/construction/pre-construction; dicatat = announced/shelved/cancelled. Diterapkan scripts/pipa/gem.mjs --terapkan.', tanggal: TGL_AMBIL, sumber: sumber.sort(urut), perkaya: perkaya.sort((a, b) => a.proyek_id.localeCompare(b.proyek_id)), beda_status, baru: baru.sort(urut), dicatat: dicatat.sort(urut) });
  // PLTU
  const kar = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/karbon.json'), 'utf8')).baris.filter((c) => c.kelompok === 'pembangkit' && /coal/.test(c.jenis_aset) && c.lat != null);
  const plantGroups = kelompok(hasil.coal); const pakaiK = new Set(); const pembangkit = [];
  for (const g of plantGroups) {
    let best = null; for (const c of kar) { if (pakaiK.has(c.id) || g.lat == null) continue; const d = jarakKm(g.lat, g.lon, c.lat, c.lng); const j = jaccard(tokenNama(g.nama), tokenNama(c.nama)); if ((d < 3 || (d < 15 && j >= 0.5)) && (!best || d < best.d)) best = { c, d }; }
    if (best) pakaiK.add(best.c.id);
    pembangkit.push({ id: g.lokasi_id, nama: g.nama, kota: g.kota, status: g.status, kapasitas_mw: g.kapasitas_mw, jumlah_unit: g.fase.length, lat: g.lat, lon: g.lon, akurasi: g.akurasi, url_wiki: g.url_wiki, ...(best ? { karbon_id: best.c.id, jarak_km: Math.round(best.d * 10) / 10, emisi_tco2e: best.c.emisi_tco2e, emisi_tahun: best.c.tahun } : {}) });
  }
  const karPer = new Map(pembangkit.filter((p) => p.karbon_id).map((p) => [p.id, p.karbon_id]));
  const unit = hasil.coal.map((b) => Object.fromEntries(Object.entries({ unit_id: b.gem_id, pembangkit_id: b.lokasi_id, pembangkit: b.nama, unit: b.fase, kapasitas_mw: b.kapasitas_mw, status: b.status, status_asli: b.status_asli, tahun_mulai: b.tahun_mulai, tahun_pensiun: b.tahun_pensiun, rencana_pensiun: b.rencana_pensiun, pemilik: b.pemilik, induk: b.induk, captive: b.captive, chp: b.chp, teknologi_pembakaran: b.teknologi_pembakaran, jenis_batubara: b.jenis_batubara, wilayah: b.wilayah_asli, kota: b.kota, lat: b.lat, lon: b.lon, akurasi: b.akurasi, co2_juta_t_per_tahun: b.co2_juta_t_per_tahun, sisa_umur_tahun: b.sisa_umur_tahun, karbon_id: karPer.get(b.lokasi_id), url_wiki: b.url_wiki }).filter(([, v]) => v != null && !(Array.isArray(v) && !v.length))));
  tulis('data/strategis/pltu.json', { sumber: TRACKER.coal.nama, rilis: TRACKER.coal.rilis, lisensi: LISENSI, atribusi: ATRIBUSI('coal'), halaman: TRACKER.coal.halaman, tanggal_ambil: TGL_AMBIL, catatan: 'unit batubara Indonesia termasuk captive industri; status di luar operating/construction/pre-construction = tidak aktif; karbon_id menaut ke public/data/karbon.json (Climate TRACE) bila jaraknya cocok', jumlah_unit: unit.length, jumlah_pembangkit: pembangkit.length, pembangkit, unit });
  // kandidat lembaga
  const kandidat = new Map();
  for (const t of Object.keys(hasil)) for (const b of hasil[t]) for (const [peran, daftar] of [['pemilik', b.pemilik || []], ['operator', b.operator || []], ['induk', b.induk || []]]) for (const x of daftar) {
    if (orgDari(x.nama)) continue; const k = norm(x.nama); if (!k) continue;
    const e = kandidat.get(k) || kandidat.set(k, { nama: x.nama, peran: new Set(), tracker: new Set(), jumlah_baris: 0, mw: 0, contoh: [] }).get(k);
    e.peran.add(peran); e.tracker.add(t); e.jumlah_baris++; e.mw += peran === 'pemilik' ? b.kapasitas_mw || 0 : 0; if (e.contoh.length < 3 && !e.contoh.includes(b.nama)) e.contoh.push(b.nama);
  }
  const lembaga = [...kandidat.values()].map((e) => ({ nama: e.nama, peran: [...e.peran].sort(), tracker: [...e.tracker].sort(), jumlah_baris: e.jumlah_baris, kapasitas_pemilik_mw: Math.round(e.mw), contoh_proyek: e.contoh })).sort((a, b) => b.jumlah_baris - a.jumlah_baris || a.nama.localeCompare(b.nama));
  tulis('data/direktori/kandidat_lembaga_gem.json', { _catatan: 'Pemilik/operator/induk GEM yang belum ada di organisasi.json (nama ternormalisasi + alias). KANDIDAT saja: tinjau kurator sebelum masuk direktori; tidak dimuat potret.', sumber: 'Global Energy Monitor (' + LISENSI + ')', tanggal: TGL_AMBIL, jumlah: lembaga.length, baris: lembaga });
  const hitungTautan = Object.values(hasil).flat().flatMap((b) => [...(b.pemilik || []), ...(b.operator || [])]);
  console.log(JSON.stringify({ indonesia: ringkas, grup: Object.fromEntries(Object.entries(grup).map(([k, v]) => [k, v.length])), cocok: cocok.length, perkaya_isi: isiSesudah, beda_status: beda_status.length, baru: baru.length, dicatat: dicatat.length, pltu_unit: unit.length, pltu_pembangkit: pembangkit.length, pltu_karbon: karPer.size, tautan_org: hitungTautan.filter((x) => x.organisasi_id).length + '/' + hitungTautan.length, kandidat_lembaga: lembaga.length }, null, 1));
}

function terapkan() {
  const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/proyek_gem.json'), 'utf8'));
  const fp = path.join(ROOT, 'data-panen/proyek/proyek.jsonl'), fs_ = path.join(ROOT, 'data-panen/proyek/sumber.jsonl');
  const r = terapkanKeProyek(data, baca('data-panen/proyek/proyek.jsonl'), baca('data-panen/proyek/sumber.jsonl'));
  fs.writeFileSync(fp, r.proyek.map((x) => JSON.stringify(x)).join('\n') + '\n', 'utf8'); fs.writeFileSync(fs_, r.sumber.map((x) => JSON.stringify(x)).join('\n') + '\n', 'utf8');
  console.log(JSON.stringify({ diubah: r.diubah, baru: r.baru }));
}

function selftest() {
  assert.equal(statusGem('shelved - inferred 2 y'), 'shelved'); assert.equal(statusGem('pre-permit'), 'announced');
  assert.equal(provinsiId('North Sumatra Province'), 'Sumatera Utara'); assert.equal(provinsiId('South Aceh Regency'), 'Aceh'); assert.equal(provinsiId('Java'), null);
  assert.deepEqual(pisahPihak('PT PLN (Persero) [100%]; unknown [5%]'), [{ nama: 'PT PLN (Persero)', persen: 100 }]);
  assert.equal(serialTgl('45979.0'), '2025-11-18'); assert.equal(tglGem('2021/12/20'), '2021-12-20');
  assert.ok(jaccard(tokenNama('Kamojang geothermal power plant'), tokenNama('PLTP Kamojang')) === 1);
  assert.ok(jaccard(tokenNama('Tangerang'), tokenNama('Tangerang Selatan')) < 0.6, 'Tangerang bukan Tangerang Selatan');
  const g = kelompok([{ nama: 'Gunung Salak geothermal power plant', status: 'operating', kapasitas_mw: 55, lokasi_id: 'L1', gem_id: 'G1', lat: -6.7, lon: 106.7, akurasi: 'exact', provinsi: 'Jawa Barat', pemilik: [{ nama: 'Star Energy', persen: 100 }], operator: [], tahun_mulai: 1994, fase: undefined, url_wiki: 'https://www.gem.wiki/x', status_asli: 'operating' }, { nama: 'Gunung Salak geothermal power plant', status: 'announced', kapasitas_mw: 40, lokasi_id: 'L1', gem_id: 'G2', pemilik: [], operator: [] }])[0];
  assert.equal(g.status, 'operating'); assert.equal(g.kapasitas_mw, 55);
  const p = { id: 'pj_1', nama: [{ nilai: 'Gunung Salak geothermal', sumber_id: 's1' }], teknologi: 'panas-bumi', provinsi: 'Jawa Barat', lat: -6.5, lng: 106.5, presisi_lokasi: 'provinsi', kapasitas: [{ nilai: 60, satuan: 'MW', sumber_id: 's1' }], pemilik: [{ nilai: 'IPP', catatan: 'status pengembang menurut RUPTL, bukan nama perusahaan', sumber_id: 's1' }], status: [{ nilai: 'rencana', sumber_id: 's1' }], cod_aktual: [] };
  assert.ok(skorCocok(p, g, 'panas-bumi') > 0.9); assert.equal(skorCocok({ ...p, provinsi: 'Aceh' }, g, 'panas-bumi'), 0); assert.equal(skorCocok(p, g, 'surya'), 0);
  assert.equal(skorCocok({ ...p, kapasitas: [{ nilai: 500, satuan: 'MW' }] }, g, 'panas-bumi'), 0);
  const { perubahan, beda } = patchCocok('geothermal', g, p);
  assert.equal(beda.length, 1, 'status beda dicatat, tidak ditimpa'); assert.ok(!perubahan.status); assert.ok(!perubahan.kapasitas); assert.equal(perubahan.pemilik.length, 2); assert.equal(perubahan.lokasi.presisi_lokasi, 'titik_persis');
  const d = { sumber: [sumberGem('geothermal', g)], perkaya: [{ proyek_id: 'pj_1', sumber_id: 'gem-geothermal-L1', perubahan }], baru: [barisBaru('geothermal', { ...g, lokasi_id: 'L9', fase: g.fase })] };
  let r = terapkanKeProyek(d, [JSON.parse(JSON.stringify(p))], []); const j1 = JSON.stringify(r.proyek); assert.equal(r.baru, 1);
  r = terapkanKeProyek(d, r.proyek, r.sumber); assert.equal(JSON.stringify(r.proyek), j1, 'idempoten'); assert.equal(r.baru, 0);
  console.log('selftest ok');
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--selftest')) selftest(); else if (process.argv.includes('--terapkan')) terapkan(); else if (process.argv.includes('--bangun')) bangun(); else console.log('pakai: --bangun | --terapkan | --selftest');
}
