// Pelacak proyek terpadu (B1): satu baris per proyek unik dari proyek.json + RUPTL + GEM + peristiwa berita.
// Turunan murni: tidak menyunting proyek.json. Keluaran public/data/proyek_terpadu.json.
// Aturan status (sumber paling baru menang, urutan tetap): berita terbit >= rilis GEM > GEM > RUPTL/proyek.json.
// COD: rencana = RUPTL (skenario RE Base) bila ada, kalau tidak target di proyek.json; terbaru = tahun operasi GEM/proyek.json.
// Keterlambatan (tahun): aktual - rencana bila sudah beroperasi; perkiraan GEM - rencana bila belum; tanpa keduanya, tahun data - rencana bila rencana sudah lewat.
// Dedup baris tambahan (RUPTL tanpa tautan, GEM dicatat/ragu) terhadap baris dasar: skor nama+teknologi+kapasitas+provinsi.
//   skor >= AMBANG_GABUNG digabung; AMBANG_RAGU <= skor < AMBANG_GABUNG TIDAK digabung dan masuk antrean tinjau.
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { kodeProvinsi } from './_panen_umum.mjs';

export const AMBANG_GABUNG = 0.85;
export const AMBANG_RAGU = 0.6;
const MW_SATUAN = new Set(['MW', 'MWp']);
export const STATUS = ['rencana', 'izin', 'konstruksi', 'beroperasi', 'ditunda', 'dibatalkan', 'tidak-diketahui'];
const GEM_TEK = { solar: 'surya', wind: 'bayu', hydropower: 'hidro', geothermal: 'panas-bumi', bioenergy: 'bioenergi' };
const GEM_STATUS = { operating: 'beroperasi', construction: 'konstruksi', 'pre-construction': 'izin', announced: 'rencana', shelved: 'ditunda', cancelled: 'dibatalkan', retired: 'dibatalkan', mothballed: 'ditunda' };
const PERISTIWA_STATUS = { groundbreaking: 'konstruksi', konstruksi: 'konstruksi', cod: 'beroperasi', beroperasi: 'beroperasi', peresmian: 'beroperasi', pembatalan: 'dibatalkan', dibatalkan: 'dibatalkan' };
const GENERIK = /^(sh-pln|pln|ipp|-|tidak diketahui)$/i;
const LAZIM = new Set(['plta', 'pltp', 'plts', 'pltb', 'pltbm', 'pltmh', 'pltsa', 'pltbg', 'pltu', 'bess', 'pltn', 'power', 'plant', 'station', 'project', 'geothermal', 'hydropower', 'solar', 'wind', 'farm', 'pembangkit', 'listrik', 'tenaga', 'panas', 'bumi', 'air', 'surya', 'bayu', 'ftp2', 'ftp1', 'unit', 'tahap', 'phase', 'pt', 'ii', 'iii', 'i', 'terapung', 'floating', 'ebt', 'mw']);

export const tokenNama = (n) => String(n || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/).filter((x) => x && !LAZIM.has(x));
const jaccard = (a, b) => { const A = new Set(a), B = new Set(b); if (!A.size || !B.size) return 0; let i = 0; for (const x of A) if (B.has(x)) i++; return i / (A.size + B.size - i); };
const jarakKm = (a, b) => Math.hypot((a.lng - b.lng) * 111.3 * Math.cos((a.lat * Math.PI) / 180), (a.lat - b.lat) * 111.3);

/** Skor 0..1 kemiripan dua baris: teknologi wajib sama (tanpa itu 0); nama 0.5, kapasitas 0.2, provinsi 0.2, jarak titik 0.1. */
export function skor(a, b) {
  if (!a.tek || a.tek !== b.tek) return 0;
  const nama = jaccard(tokenNama(a.nama), tokenNama(b.nama));
  const kap = a.mw && b.mw ? Math.max(0, 1 - Math.abs(a.mw - b.mw) / Math.max(a.mw, b.mw) / 0.25) : 0.3;
  const prov = a.prov && b.prov ? (a.prov === b.prov ? 1 : 0) : 0.4;
  const dekat = a.lat != null && b.lat != null && a.presisi !== 'provinsi' && b.presisi !== 'provinsi' ? (jarakKm({ lat: a.lat, lng: a.lng }, { lat: b.lat, lng: b.lng }) < 25 ? 1 : 0) : 0.3;
  return Math.round((0.5 * nama + 0.2 * kap + 0.2 * prov + 0.1 * dekat) * 100) / 100;
}

const mwDari = (kap) => { const k = (kap || []).find((x) => Number.isFinite(x.nilai) && MW_SATUAN.has(x.satuan)); return k ? k.nilai : null; };
const minTahun = (a) => { const v = (a || []).map((c) => (typeof c === 'number' ? c : c && c.nilai)).filter(Number.isFinite); return v.length ? Math.min(...v) : null; };
const normNama = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

/** Selisih tahun COD: {tahun, jenis} atau null. jenis: aktual | perkiraan | lewat. */
export function keterlambatan(r, tahunData) {
  if (!r.cod_rencana || r.status === 'dibatalkan') return null;
  if (r.status === 'beroperasi') return r.cod_terbaru ? { tahun: r.cod_terbaru - r.cod_rencana, jenis: 'aktual' } : null;
  if (r.cod_terbaru) return { tahun: r.cod_terbaru - r.cod_rencana, jenis: 'perkiraan' };
  return r.cod_rencana < tahunData ? { tahun: tahunData - r.cod_rencana, jenis: 'lewat' } : { tahun: 0, jenis: 'lewat' };
}

function indeksOrganisasi(org) {
  const m = new Map();
  for (const o of org.baris || []) for (const n of [o.nama, o.singkatan, ...(o.nama_lain || [])]) { const k = normNama(n); if (k.length > 3 && !m.has(k)) m.set(k, o); }
  return { cari: (nama) => m.get(normNama(nama)) || m.get(normNama(String(nama).replace(/^PT\.?\s+/i, '').replace(/\s+(Tbk|\(Persero\))\.?$/i, ''))) || null, ada: new Set((org.baris || []).map((o) => o.id)), per: new Map((org.baris || []).map((o) => [o.id, o])) };
}

function pemilikDari(daftar, io) {
  for (const p of daftar || []) {
    const nama = typeof p === 'string' ? p : p.nilai;
    if (!nama || GENERIK.test(nama.trim())) continue;
    const id = (typeof p === 'object' && p.organisasi_id && io.ada.has(p.organisasi_id)) ? p.organisasi_id : (io.cari(nama) || {}).id || null;
    const o = id ? io.per.get(id) : null;
    return { nama: o ? o.nama : nama, org_id: id, logo: o && typeof o.logo === 'string' ? o.logo : null, lainnya: daftar.length - 1 };
  }
  return null;
}

const provDari = (nama) => { const p = nama ? kodeProvinsi(nama) : null; return p ? { prov: p.nama, prov_kode: String(p.kode) } : { prov: nama || null, prov_kode: null }; };

/** masukan: {proyek, ruptl, gem, peristiwa, organisasi}; kembalikan objek keluaran. */
export function bangun({ proyek, ruptl, gem, peristiwa, organisasi, pusat }, tanggal) {
  const tahunData = Number(String(tanggal).slice(0, 4));
  const io = indeksOrganisasi(organisasi);
  const rilis = Object.fromEntries((gem.sumber || []).map((s) => [s.tracker, s.rilis]));
  const gemPer = new Map((gem.baris || []).map((g) => [g.id, g]));
  const ruptlPer = new Map();
  for (const x of ruptl.baris || []) if (x.proyek_id) (ruptlPer.get(x.proyek_id) || ruptlPer.set(x.proyek_id, []).get(x.proyek_id)).push(x);
  const gemUntuk = new Map();
  for (const g of gem.baris || []) { const p = g.pencocokan || {}; if ((p.status === 'cocok' || p.status === 'baru') && p.proyek_id) (gemUntuk.get(p.proyek_id) || gemUntuk.set(p.proyek_id, []).get(p.proyek_id)).push(g); }
  const berita = new Map();
  for (const e of peristiwa.baris || []) { const st = PERISTIWA_STATUS[e.peristiwa]; if (st && e.proyek_id) (berita.get(e.proyek_id) || berita.set(e.proyek_id, []).get(e.proyek_id)).push({ ...e, st }); }

  const baris = []; const antrean = []; let tolak = 0;
  // ---- 1. baris dasar: proyek.json bertipe pembangkit/penyimpanan (pembiayaan multilateral tanpa teknologi dikeluarkan)
  for (const p of proyek.baris) {
    if (!p.teknologi || p.asal === 'worldbank') { tolak++; continue; }   // program pinjaman multilateral bukan proyek berkapasitas
    const s0 = (p.status || [])[0] || {}, sumber = (p.sumber || []).find((s) => s.id === s0.sumber_id) || (p.sumber || [])[0] || {};
    const loc = p.lokasi || {}, pv = provDari(loc.provinsi);
    const r = {
      id: p.id, profil: true, nama: p.nama, tek: p.teknologi, status: STATUS.includes(s0.nilai) ? s0.nilai : 'tidak-diketahui',
      status_sumber: { jenis: sumber.jenis || 'proyek', tanggal: sumber.tanggal || '', url: sumber.url || '' },
      mw: mwDari(p.kapasitas), ...pv, lat: loc.lat ?? null, lng: loc.lng ?? null, presisi: loc.presisi || 'provinsi',
      cod_rencana: minTahun(p.cod_target), cod_terbaru: minTahun(p.cod_aktual), cod_jenis: p.cod_aktual && p.cod_aktual.length ? 'aktual' : null,
      pemilik: pemilikDari((p.pihak || {}).pemilik, io), asal: [...new Set((p.sumber || []).map((s) => s.jenis.replace(/^gem-.*/, 'gem')))], url: sumber.url || '',
    };
    const rp = ruptlPer.get(p.id) || [];
    const codR = minTahun(rp.map((x) => minTahun(x.cod_tahun)));
    if (codR) { r.cod_rencana = codR; if (!r.asal.includes('ruptl')) r.asal.push('ruptl'); }
    // GEM yang sudah dicocokkan pipeline GEM (cocok/baru): status dan tahun operasi terbaru
    const gs = gemUntuk.get(p.id) || [];
    if (gs.length) {
      const g = gs.reduce((a, b) => ((b.kapasitas_mw || 0) > (a.kapasitas_mw || 0) ? b : a));
      r.status = GEM_STATUS[g.status] || r.status; r.status_sumber = { jenis: 'gem', tanggal: rilis[g.tracker] || '', url: g.url_wiki || '' };
      if (g.tahun_mulai) { r.cod_terbaru = g.tahun_mulai; r.cod_jenis = r.status === 'beroperasi' ? 'aktual' : 'perkiraan'; }
      if (!r.mw && g.kapasitas_mw) r.mw = g.kapasitas_mw;
      if (!r.pemilik) r.pemilik = pemilikDari(g.pemilik, io);
      r.gem_id = g.id; if (!r.asal.includes('gem')) r.asal.push('gem');
    }
    // berita terbit setelah rilis GEM menggeser status
    const be = (berita.get(p.id) || []).filter((e) => e.tanggal >= (r.status_sumber.jenis === 'gem' ? r.status_sumber.tanggal + '-01' : '0')).sort((a, b) => (a.tanggal < b.tanggal ? 1 : -1))[0];
    if (be) { r.status = be.st; r.status_sumber = { jenis: 'berita', tanggal: be.tanggal, url: be.sumber_url, media: be.media }; r.perlu_tinjau = !!be.perlu_tinjau; if (!r.asal.includes('berita')) r.asal.push('berita'); }
    baris.push(r);
  }

  // ---- 2. baris tambahan: RUPTL tanpa tautan proyek, GEM dicatat dan ragu; dedup terhadap baris dasar
  const tambahan = [];
  for (const x of ruptl.baris || []) if (!x.proyek_id) {
    const pv = provDari(x.provinsi);
    tambahan.push({ id: x.id, nama: x.nama, tek: x.teknologi, status: x.status === 'konstruksi' ? 'konstruksi' : x.status === 'rencana' ? 'rencana' : 'tidak-diketahui', status_sumber: { jenis: 'ruptl', tanggal: String(x.tahun || ''), url: '' }, mw: x.kapasitas_mw ?? null, ...pv, lat: null, lng: null, presisi: 'provinsi', cod_rencana: minTahun(x.cod_tahun), cod_terbaru: null, cod_jenis: null, pemilik: pemilikDari(x.pengembang_status ? [x.pengembang_status] : [], io), asal: ['ruptl'], url: '' });
  }
  for (const g of gem.baris || []) {
    const st = (g.pencocokan || {}).status;
    if (st !== 'dicatat' && st !== 'ragu') continue;
    const pv = provDari(g.provinsi);
    tambahan.push({ id: g.id, nama: g.nama, tek: GEM_TEK[g.tracker] || null, status: GEM_STATUS[g.status] || 'tidak-diketahui', status_sumber: { jenis: 'gem', tanggal: rilis[g.tracker] || '', url: g.url_wiki || '' }, mw: g.kapasitas_mw ?? null, ...pv, lat: g.lat ?? null, lng: g.lon ?? null, presisi: g.akurasi === 'exact' ? 'titik_persis' : 'kabupaten', cod_rencana: null, cod_terbaru: g.tahun_mulai || null, cod_jenis: g.tahun_mulai ? (g.status === 'operating' ? 'aktual' : 'perkiraan') : null, pemilik: pemilikDari(g.pemilik, io), asal: ['gem'], url: g.url_wiki || '', gem_id: g.id, ragu_dengan: st === 'ragu' ? g.pencocokan.proyek_id : undefined });
  }
  for (const t of tambahan) {
    if (!t.tek) continue;
    let terbaik = null, nilai = 0;
    for (const b of baris) { const s = skor(t, b); if (s > nilai) { nilai = s; terbaik = b; } }
    if (terbaik && !t.ragu_dengan && nilai >= AMBANG_GABUNG) {   // gabung: tambahan memperkaya baris dasar
      if (t.asal[0] === 'ruptl' && t.cod_rencana && !terbaik.cod_rencana) { terbaik.cod_rencana = t.cod_rencana; }
      if (t.asal[0] === 'ruptl' && !terbaik.asal.includes('ruptl')) terbaik.asal.push('ruptl');
      if (t.asal[0] === 'gem') {
        terbaik.status = t.status; terbaik.status_sumber = t.status_sumber; terbaik.gem_id = t.gem_id; if (!terbaik.asal.includes('gem')) terbaik.asal.push('gem');
        if (t.cod_terbaru) { terbaik.cod_terbaru = t.cod_terbaru; terbaik.cod_jenis = t.cod_jenis; }
        if (!terbaik.mw) terbaik.mw = t.mw;
      }
      continue;
    }
    if (terbaik && (t.ragu_dengan || nilai >= AMBANG_RAGU)) {   // tidak digabung: tinjau manusia
      antrean.push({ a: t.id, a_nama: t.nama, b: terbaik.id, b_nama: terbaik.nama, skor: nilai, alasan: t.ragu_dengan ? 'ragu-pipeline-gem' : 'skor-menengah' });
      t.ragu = true;
    }
    baris.push(t);
  }

  // ---- 3. pasangan mirip di dalam baris dasar dilaporkan saja (tidak digabung)
  const dasar = baris.filter((r) => !r.ragu);
  for (let i = 0; i < dasar.length; i++) for (let j = i + 1; j < dasar.length; j++) {
    const s = skor(dasar[i], dasar[j]);
    if (s >= AMBANG_RAGU && !antrean.some((q) => (q.a === dasar[i].id && q.b === dasar[j].id) || (q.a === dasar[j].id && q.b === dasar[i].id))) antrean.push({ a: dasar[i].id, a_nama: dasar[i].nama, b: dasar[j].id, b_nama: dasar[j].nama, skor: s, alasan: 'kemiripan-dalam-data' });
  }

  // titik tanpa koordinat memakai pusat provinsinya (presisi 'provinsi'); tanpa provinsi: tidak tampil di peta
  for (const r of baris) if (r.lat == null && r.prov_kode && pusat && pusat.has(r.prov_kode)) { [r.lng, r.lat] = pusat.get(r.prov_kode); r.presisi = 'provinsi'; }
  for (const r of baris) { const k = keterlambatan(r, tahunData); if (k) { r.telat = k.tahun; r.telat_jenis = k.jenis; } }
  baris.sort((a, b) => (b.mw || 0) - (a.mw || 0) || (a.nama < b.nama ? -1 : 1));
  const hitung = baris.filter((r) => !r.ragu);
  const perTek = {};
  for (const r of hitung) {
    const k = (perTek[r.tek] ||= { n: 0, mw: 0, berjadwal: 0, terlambat: 0, jumlah_tahun: 0, maks: 0 });
    k.n++; k.mw += r.mw || 0;
    if (r.telat != null) { k.berjadwal++; if (r.telat > 0) { k.terlambat++; k.jumlah_tahun += r.telat; k.maks = Math.max(k.maks, r.telat); } }
  }
  const perStatus = {}; for (const r of hitung) perStatus[r.status] = (perStatus[r.status] || 0) + 1;
  const baruGem = hitung.filter((r) => r.asal.length === 1 && r.asal[0] === 'gem').length;
  return {
    lapis: 'publik', dibangun_pada: tanggal,
    meta: {
      jumlah: hitung.length, ragu_dikecualikan: baris.length - hitung.length, mw: Math.round(hitung.reduce((s, r) => s + (r.mw || 0), 0)),
      terlambat: hitung.filter((r) => r.telat > 0).length, baru_gem: baruGem, tahun_data: tahunData, dikeluarkan_tanpa_teknologi: tolak,
      ambang_gabung: AMBANG_GABUNG, ambang_ragu: AMBANG_RAGU,
      aturan_status: 'berita terbit setelah rilis GEM > GEM > RUPTL atau proyek.json',
      aturan_telat: 'aktual - rencana bila beroperasi; perkiraan GEM - rencana bila belum; tahun data - rencana bila jadwal lewat tanpa kabar',
      sumber: ['RUPTL PLN 2025-2034 (COD skenario RE Base)', 'Global Energy Monitor trackers (CC BY 4.0)', 'proyek.json METI (Wikipedia, Wikidata, berita)', 'proyek_peristiwa.json (judul berita)'],
    },
    ringkasan: { per_tek: perTek, per_status: perStatus },
    antrean_tinjau: antrean,
    baris,
  };
}

/** Pusat provinsi (centroid poligon terluas, rumus tali sepatu) dari geo/provinsi.json -> Map(kode -> [lng, lat]). */
export function pusatProvinsi(geo) {
  const m = new Map();
  for (const f of geo.features) {
    let terbaik = null, luasMaks = 0;
    for (const poli of f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates) {
      const c = poli[0]; let a = 0, cx = 0, cy = 0;
      for (let i = 0; i < c.length - 1; i++) { const k = c[i][0] * c[i + 1][1] - c[i + 1][0] * c[i][1]; a += k; cx += (c[i][0] + c[i + 1][0]) * k; cy += (c[i][1] + c[i + 1][1]) * k; }
      if (Math.abs(a) > luasMaks && a) { luasMaks = Math.abs(a); terbaik = [cx / (3 * a), cy / (3 * a)]; }
    }
    if (terbaik) m.set(String(f.properties.kode), terbaik.map((x) => Math.round(x * 1e4) / 1e4));
  }
  return m;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const J = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
  const tanggal = (process.argv.find((a) => a.startsWith('--tanggal=')) || '--tanggal=' + new Date().toISOString().slice(0, 10)).slice(10);
  const d = bangun({ proyek: J('public/data/proyek.json'), ruptl: J('public/data/ruptl.json'), gem: J('public/data/gem_pembangkit.json'), peristiwa: J('public/data/proyek_peristiwa.json'), organisasi: J('public/data/organisasi.json'), pusat: pusatProvinsi(J('public/geo/provinsi.json')) }, tanggal);
  fs.writeFileSync('public/data/proyek_terpadu.json', JSON.stringify(d));
  console.log(JSON.stringify(d.meta), 'antrean', d.antrean_tinjau.length);
}
