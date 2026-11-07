#!/usr/bin/env node
// Panen proyek EBT (energi baru terbarukan) Indonesia untuk Jaringan METI (R18). Node stdlib saja.
//   node panen_proyek.mjs --selftest        uji parser, dedup, presisi; tanpa jaringan
//   node panen_proyek.mjs --ambil           unduh Wikipedia (CC BY-SA) ke raw/ (robots dicek, jeda >= 2 dtk, resumable)
//   node panen_proyek.mjs --wikidata        ambil pembangkit Wikidata (CC0, Action API) ke raw/wikidata_pembangkit.jsonl
//   node panen_proyek.mjs --bangun          bangun proyek.jsonl, pihak.jsonl, konflik.jsonl
//   node panen_proyek.mjs --geo-pusat      hitung titik pusat kabupaten/provinsi dari geoBoundaries (berkas statis di raw/geo/)
//   node panen_proyek.mjs --ruptl-teks=BERKAS.txt   urai tabel pembangkit RUPTL (hasil pdftotext -layout) ke seed/ruptl.jsonl
//   node panen_proyek.mjs --gem-periksa     tampilkan header CSV GEM di raw/gem/ dan kolom yang dipakai
//   node panen_proyek.mjs --statistik       angka cakupan untuk laporan
// Sumber masukan:
//   data-panen/proyek/seed/*.jsonl      kurasi tangan (Wikipedia CC BY-SA, materi konferensi, portofolio JETP); TIDAK masuk repo.
//                                       Blok dibuka baris {"_sumber":{...}}; _sumber.publik=false menandai sumber rahasia.
//   data-panen/proyek/raw/wp_en_*.wiki  tabel pembangkit EBT Wikipedia (media, CC BY-SA 4.0)
//   data-panen/proyek/raw/gem/*.csv     CSV Global Energy Monitor bila pemilik sudah mengunduhnya lewat formulir (belum ada)
//   data-panen/berita/berita.jsonl      bila ada: pengayaan media (belum ada, tidak dibaca)
// Aturan: UA jujur, jeda >= 2 dtk, robots dicek, tanpa CAPTCHA/login/formulir. Nilai tanpa sumber TIDAK diisi.
// Setiap nilai atribut = {nilai, ..., sumber_id}; nilai bertentangan antar sumber tetap berjajar dan dicatat di konflik.jsonl.
// Koordinat: sumber (GEM, JETP, resmi) lebih dulu, lalu titik pusat wilayah geoBoundaries; presisi_lokasi jujur; tidak ada koordinat karangan.
// Overpass (/api/) dan Nominatim (/search) dilarang robots.txt-nya: TIDAK dipakai.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const UA = 'METI-Network-research/0.1 (+https://platformmeti.timitbnpb.workers.dev)';
const GAP_MS = 2200;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = path.join(ROOT, 'data-panen/proyek');
const RAW = path.join(OUT, 'raw');
const SEED_DIRS = [path.join(OUT, 'seed')]; // di luar git: Wikipedia CC BY-SA, materi konferensi, JETP
const HARI_INI = process.env.TANGGAL_AMBIL || new Date().toISOString().slice(0, 10);

export const TEKNOLOGI = new Set(['surya', 'bayu', 'hidro', 'panas-bumi', 'bioenergi', 'biomassa-sampah', 'nuklir', 'hidrogen', 'laut', 'penyimpanan']);
export const STATUS = new Set(['rencana', 'perizinan', 'konstruksi', 'beroperasi', 'ditunda', 'dibatalkan']);
export const PROGRAM = new Set(['plts-100gw', 'wte-danantara', 'b50', 'e20', 'psn', 'jetp']);
export const PRESISI = ['titik_persis', 'desa', 'kecamatan', 'kabupaten', 'provinsi', 'landmark'];
const BUKTI = ['media', 'terbit', 'resmi']; // urutan naik

const PROV_EN = {
  'aceh': 'Aceh', 'north sumatra': 'Sumatera Utara', 'west sumatra': 'Sumatera Barat', 'riau': 'Riau', 'jambi': 'Jambi',
  'south sumatra': 'Sumatera Selatan', 'bengkulu': 'Bengkulu', 'lampung': 'Lampung', 'bangka belitung': 'Kepulauan Bangka Belitung',
  'bangka-belitung': 'Kepulauan Bangka Belitung', 'bangka-belitung islands': 'Kepulauan Bangka Belitung', 'jakarta special capital region': 'DKI Jakarta', 'riau islands': 'Kepulauan Riau', 'jakarta': 'DKI Jakarta', 'west java': 'Jawa Barat',
  'central java': 'Jawa Tengah', 'yogyakarta': 'DI Yogyakarta', 'special region of yogyakarta': 'DI Yogyakarta', 'east java': 'Jawa Timur',
  'banten': 'Banten', 'bali': 'Bali', 'west nusa tenggara': 'Nusa Tenggara Barat', 'east nusa tenggara': 'Nusa Tenggara Timur',
  'west kalimantan': 'Kalimantan Barat', 'central kalimantan': 'Kalimantan Tengah', 'south kalimantan': 'Kalimantan Selatan',
  'east kalimantan': 'Kalimantan Timur', 'north kalimantan': 'Kalimantan Utara', 'north sulawesi': 'Sulawesi Utara',
  'central sulawesi': 'Sulawesi Tengah', 'south sulawesi': 'Sulawesi Selatan', 'southeast sulawesi': 'Sulawesi Tenggara',
  'west sulawesi': 'Sulawesi Barat', 'gorontalo': 'Gorontalo', 'maluku': 'Maluku', 'north maluku': 'Maluku Utara', 'papua': 'Papua',
  'west papua': 'Papua Barat',
};
export const provId = (s) => PROV_EN[String(s || '').toLowerCase().replace(/[^a-z -]/g, '').trim()] || null;

// ---------- teks ----------
export function bersih(s) {
  return String(s || '')
    .replace(/<ref[^>]*\/>/gi, ' ').replace(/<ref[\s\S]*?<\/ref>/gi, ' ').replace(/\{\{[^}]*\}\}/g, ' ')
    .replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, '$1').replace(/'''?/g, '').replace(/<br\s*\/?>/gi, ' ')
    .replace(/&nbsp;/g, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}
export function angka(s) {
  const t = bersih(s).replace(/\s/g, '');
  if (!/^\d{1,3}(,\d{3})+(\.\d+)?$|^\d+(\.\d+)?$/.test(t)) return null; // bukan angka murni: kosongkan, jangan menebak
  const n = Number(t.replace(/,/g, ''));
  return Number.isFinite(n) && n > 0 ? n : null;
}

// ---------- parser tabel Wikipedia ----------
export function barisTabel(wikitext) {
  const hasil = [];
  const bagian = wikitext.split(/\n(?===+[^=])/);
  for (const b of bagian) {
    const judul = (b.match(/^=+\s*([^=\n]+?)\s*=+/) || [])[1] || '';
    for (const tabel of b.split(/\n\{\|/).slice(1)) {
      const kepala = tabel.split('\n').filter((l) => l.startsWith('!')).join('!!').replace(/^!+/, '').split('!!').map((h) => bersih(h).toLowerCase());
      for (const baris of tabel.split(/\n\|-/).slice(1)) {
        const sel = [];
        for (const l of baris.split('\n')) {
          if (/^\|[-}+]/.test(l)) continue;
          if (l.startsWith('|')) l.slice(1).split('||').forEach((c) => sel.push(c));
          else if (sel.length) sel[sel.length - 1] += ' ' + l;
        }
        if (sel.length >= kepala.length - 1 && sel.length > 4) hasil.push({ judul, kepala, sel });
      }
    }
  }
  return hasil;
}
const TEK_JUDUL = { geothermal: 'panas-bumi', hydroelectric: 'hidro', 'pumped-storage hydroelectric': 'penyimpanan', wind: 'bayu', solar: 'surya' };
export function dariWikiEn(wikitext) {
  const kandidat = [];
  let ditolak = 0;
  const mulai = wikitext.indexOf('== Renewable ==');
  for (const r of barisTabel(wikitext.slice(mulai < 0 ? 0 : mulai))) {
    const tek = TEK_JUDUL[r.judul.toLowerCase()];
    if (!tek) continue;
    const idx = (k) => r.kepala.findIndex((h) => h.includes(k));
    const iCap = r.kepala.findIndex((h) => h.startsWith('installed'));
    const nama = bersih(r.sel[idx('power station')]);
    const prov = provId(bersih(r.sel[idx('province')]));
    if (!nama || !prov) { ditolak++; continue; }
    const cap = iCap >= 0 ? angka(r.sel[iCap]) : null;
    const kab = bersih(r.sel[idx('district')]);
    const op = bersih(r.sel[idx('operator')]);
    kandidat.push({
      nama, teknologi: tek, provinsi: prov, kabupaten_kota: kab || null,
      kapasitas: cap ? { nilai: cap, satuan: 'MW' } : null, pemilik: op || null,
    });
  }
  return { kandidat, ditolak };
}

// ---------- kemiripan & dedup ----------
const UMUM = new Set(['plts', 'plta', 'pltp', 'pltb', 'pltsa', 'pltmh', 'plt', 'pltu', 'solar', 'power', 'station', 'plant', 'geothermal', 'hydro', 'hydroelectric', 'wind', 'farm', 'pv', 'psel', 'pembangkit', 'listrik', 'tenaga', 'surya', 'air', 'panas', 'bumi', 'bayu', 'pumped', 'storage', 'unit', 'phase', 'i', 'ii', 'iii', 'iv', 'energi', 'asal', 'sampah', 'psn', 'nomor', '154', 'kota', 'kabupaten', 'ebt', 'floating', 'terapung', 'ftp1', 'ftp2', 'pump', 'storage', 'small', 'scale', 'binary']);
const tokenNama = (n) => new Set(String(n).normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\([^)]*\)/g, ' ').split(/[^a-z0-9]+/).filter((t) => t && !UMUM.has(t)));
export function mirip(a, b) {
  const A = tokenNama(a), B = tokenNama(b);
  if (!A.size || !B.size) return false;
  let sama = 0; for (const t of A) if (B.has(t)) sama++;
  return sama / (A.size + B.size - sama) >= 0.6; // Jaccard: Tangerang tidak melebur ke Tangerang Selatan
}
const MW = new Set(['MW', 'MWp', 'MWac']);
export function kapasitasSama(a, b) { // true bila ADA pasangan kapasitas sebanding (+-10 persen); null bila tak dapat dibandingkan
  const A = (a || []).filter((c) => MW.has(c.satuan) && typeof c.nilai === 'number'), B = (b || []).filter((c) => MW.has(c.satuan) && typeof c.nilai === 'number');
  if (!A.length || !B.length) return null;
  return A.some((x) => B.some((y) => Math.abs(x.nilai - y.nilai) <= 0.1 * Math.max(x.nilai, y.nilai)));
}

// ---------- berkas ----------
const bacaJsonl = (f) => fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
const tulis = (f, rows) => fs.writeFileSync(f, rows.map((r) => JSON.stringify(r)).join('\n') + (rows.length ? '\n' : ''));
const larik = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);

const ATRIBUT = ['kapasitas', 'pemilik', 'epc', 'pembeli', 'nilai_investasi', 'skema_kerjasama', 'tanggal_ppa', 'financial_close',
  'cod_target', 'cod_aktual', 'status', 'tenaga_kerja', 'pemberi_dana'];

export function muatSeed(dir) {
  if (!fs.existsSync(dir)) return [];
  const hasil = [];
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.jsonl')).sort()) {
    let sumber = null;
    for (const r of bacaJsonl(path.join(dir, f))) {
      if (r._sumber) { sumber = { ...r._sumber, berkas_seed: f }; continue; }
      hasil.push({ ...r, _sumber: sumber });
    }
  }
  return hasil;
}

// ---------- pembangunan ----------
export function bangun(masukan) {
  // masukan: [{_sumber:{jenis,url,tingkat_bukti,tanggal_ambil,lisensi,halaman?,catatan?}, nama, teknologi, provinsi, ...}]
  const ditolak = [];
  const sumberTab = new Map();
  const idSumber = (s) => {
    const k = [s.url, s.halaman || '', s.berkas || ''].join('|');
    if (!sumberTab.has(k)) sumberTab.set(k, { id: 's' + (sumberTab.size + 1), ...s });
    return sumberTab.get(k).id;
  };
  const sah = [];
  for (const r of masukan) {
    const s = r._sumber;
    const alasan = !s || !s.url ? 'tanpa-sumber_url' : !s.tanggal_ambil ? 'tanpa-tanggal' : !BUKTI.includes(s.tingkat_bukti) ? 'tanpa-tingkat_bukti'
      : !r.nama ? 'tanpa-nama' : !TEKNOLOGI.has(r.teknologi) ? 'teknologi-bukan-K16'
      : r.program && !PROGRAM.has(r.program) ? 'program-tak-dikenal' : r.status && !STATUS.has(r.status.nilai ?? r.status) ? 'status-tak-dikenal' : null;
    if (alasan) { ditolak.push({ nama: r.nama, alasan }); continue; }
    sah.push(r);
  }
  const proyek = [];
  const konflik = [];
  for (const r of sah) {
    const sid = idSumber(r._sumber);
    // cari kembaran DARI SUMBER LAIN (baris sesumber = unit/fase berbeda, tidak digabung): teknologi sama, provinsi sama (bila keduanya ada), nama mirip
    let t = proyek.find((p) => !p.sumber_ids.includes(sid) && p.teknologi === r.teknologi && (!p.provinsi || !r.provinsi || p.provinsi === r.provinsi) && p.nama.some((n) => mirip(n.nilai, r.nama)));
    const kapBaru = r.kapasitas ? larik(r.kapasitas).map((c) => ({ ...c, sumber_id: sid })) : [];
    if (t) {
      const sama = kapasitasSama(t.kapasitas, kapBaru);
      if (sama === false) {
        konflik.push({ jenis: 'nama-sama-kapasitas-beda-tidak-digabung', _t: t, nama: r.nama, kapasitas_a: t.kapasitas, kapasitas_b: kapBaru, sumber_id: sid });
        t = null;
      }
    }
    if (!t) {
      t = { id: null, nama: [], teknologi: r.teknologi, provinsi: r.provinsi || null, kabupaten_kota: null, program: r.program || null, programs: [], lat: null, lng: null, presisi_lokasi: null, sumber_lokasi: null, sumber_ids: [] };
      ATRIBUT.forEach((a) => (t[a] = []));
      t.pihak_terlibat = []; t.catatan = [];
      proyek.push(t);
    }
    t.provinsi ||= r.provinsi || null;
    t.program ||= r.program || null;
    if (r.program && !t.programs.includes(r.program)) t.programs.push(r.program); // satu proyek bisa di beberapa program (Saguling: jetp dan plts-100gw)
    if (!t.sumber_ids.includes(sid)) t.sumber_ids.push(sid);
    if (!t.nama.some((n) => n.nilai === r.nama)) t.nama.push({ nilai: r.nama, sumber_id: sid });
    if (r.kabupaten_kota) { t.kabupaten_kota ||= []; if (!Array.isArray(t.kabupaten_kota)) t.kabupaten_kota = []; if (!t.kabupaten_kota.some((k) => k.nilai === r.kabupaten_kota)) t.kabupaten_kota.push({ nilai: r.kabupaten_kota, sumber_id: sid }); }
    for (const a of ATRIBUT) {
      for (const v of larik(a === 'kapasitas' ? kapBaru : r[a])) {
        const o = typeof v === 'object' && v ? { ...v, sumber_id: v.sumber_id || sid } : { nilai: v, sumber_id: sid };
        if (a === 'status' && !STATUS.has(o.nilai)) continue;
        if (!t[a].some((x) => JSON.stringify({ ...x, sumber_id: 0 }) === JSON.stringify({ ...o, sumber_id: 0 }))) t[a].push(o);
      }
    }
    if (r.nama_perlu_tinjau) t.nama_perlu_tinjau = true;
    if (r.catatan) t.catatan.push({ nilai: r.catatan, sumber_id: sid });
    for (const p of larik(r.pihak)) t.pihak_terlibat.push({ nama: p.nama, peran: p.peran, sumber_id: sid });
    if (r.lat != null && r.lng != null && r.presisi_lokasi && t.lat == null) {
      t.lat = r.lat; t.lng = r.lng; t.presisi_lokasi = r.presisi_lokasi; t.sumber_lokasi = { sumber_id: sid };
    }
  }
  // id stabil: urut teknologi, provinsi, nama
  proyek.sort((a, b) => (a.teknologi + (a.provinsi || '') + a.nama[0].nilai).localeCompare(b.teknologi + (b.provinsi || '') + b.nama[0].nilai));
  proyek.forEach((p, i) => (p.id = 'pj_' + String(i + 1).padStart(4, '0')));
  for (const k of konflik) if (k._t) { k.proyek_id = k._t.id; delete k._t; }
  // konflik nilai antar sumber
  for (const p of proyek) {
    for (const a of ['kapasitas', 'status', 'nilai_investasi', 'cod_target', 'cod_aktual']) { // pemilik tidak dibandingkan: kepemilikan bersama bukan pertentangan {
      const per = new Map();
      for (const v of p[a]) { const k = a === 'kapasitas' ? v.satuan : a === 'nilai_investasi' ? v.mata_uang : '_'; (per.get(k) || per.set(k, []).get(k)).push(v); }
      for (const [k, vs] of per) {
        const bedaVal = new Set(vs.map((v) => JSON.stringify(v.nilai)));
        const sumberBeda = new Set(vs.map((v) => v.sumber_id)).size > 1;
        if (bedaVal.size > 1 && (sumberBeda || !a.startsWith('cod'))) konflik.push({ jenis: 'nilai-bertentangan', proyek_id: p.id, atribut: a, satuan: k === '_' ? null : k, nilai: vs.map((v) => ({ nilai: v.nilai, sumber_id: v.sumber_id })) });
      }
    }
    const tertinggi = p.sumber_ids.map((s) => BUKTI.indexOf([...sumberTab.values()].find((x) => x.id === s).tingkat_bukti)).reduce((m, x) => Math.max(m, x), 0);
    p.tingkat_bukti = BUKTI[tertinggi];
    const ss = p.sumber_ids.map((x) => [...sumberTab.values()].find((y) => y.id === x));
    p.publik = ss.some((x) => x.publik !== false); // false = HANYA sumber rahasia; potret publik wajib membuang nilai ber-sumber publik:false
    const ck = ss.filter((x) => x.publik === false).map((x) => x.catatan_kerahasiaan).filter(Boolean);
    if (ck.length) p.catatan_kerahasiaan = ck.join('; ');
  }
  const pihak = [];
  for (const p of proyek) {
    for (const [a, peran] of [['pemilik', 'pemilik/pengembang'], ['epc', 'EPC'], ['pembeli', 'pembeli'], ['pemberi_dana', 'pemberi dana']]) for (const v of p[a]) pihak.push({ proyek_id: p.id, nama: v.nilai, peran, sumber_id: v.sumber_id });
    for (const v of p.pihak_terlibat) pihak.push({ proyek_id: p.id, nama: v.nama, peran: v.peran, sumber_id: v.sumber_id });
  }
  return { proyek, pihak, konflik, sumber: [...sumberTab.values()], ditolak };
}

// ---------- koordinat pusat wilayah (geoBoundaries IDN; berkas statis, tanpa API geokode) ----------
// ADM1 lisensi ODbL 1.0; ADM2 CC BY 3.0 IGO (sumber BPS/WFP/OCHA ROAP). Hasil = titik pusat wilayah, BUKAN lokasi proyek.
const GEO_DIR = path.join(RAW, 'geo');
const GEO_PUSAT = path.join(GEO_DIR, 'pusat.json');
const GEO_SUMBER = {
  ADM1: { url: 'https://www.geoboundaries.org/api/current/gbOpen/IDN/ADM1/', lisensi: 'ODbL 1.0' },
  ADM2: { url: 'https://www.geoboundaries.org/api/current/gbOpen/IDN/ADM2/', lisensi: 'CC BY 3.0 IGO (BPS, WFP, OCHA ROAP)' },
};
export function pusatCincin(ring) { // centroid poligon planar pada lon/lat, luas bertanda
  let a = 0, cx = 0, cy = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [x0, y0] = ring[j], [x1, y1] = ring[i];
    const f = x0 * y1 - x1 * y0; a += f; cx += (x0 + x1) * f; cy += (y0 + y1) * f;
  }
  a /= 2;
  return a ? { luas: Math.abs(a), lng: cx / (6 * a), lat: cy / (6 * a) } : null;
}
export function pusatGeom(g) { // poligon terluas (cincin luar); kepulauan tidak jatuh ke laut di antara pulau
  const polys = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
  let terbaik = null;
  for (const p of polys) { const c = pusatCincin(p[0]); if (c && (!terbaik || c.luas > terbaik.luas)) terbaik = c; }
  return terbaik && { lat: +terbaik.lat.toFixed(5), lng: +terbaik.lng.toFixed(5) };
}
export function dalamCincin(x, y, ring) {
  let d = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) d = !d;
  }
  return d;
}
export function normWilayah(s) {
  const t = String(s || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z ]/g, ' ');
  const arah = { west: 'barat', east: 'timur', north: 'utara', south: 'selatan', central: 'tengah' };
  const m = t.trim().match(/^(west|east|north|south|central) ([a-z ]+)$/); // West Lampung -> lampung barat
  const t2 = m ? m[2] + ' ' + arah[m[1]] : t;
  const tipe = /\b(kota|city)\b/.test(t) ? 'kota' : /\b(kabupaten|kab|regency)\b/.test(t) ? 'kabupaten' : null;
  return { nama: t2.replace(/\b(kota|city|kabupaten|kab|regency|administrasi|administrative)\b/g, ' ').replace(/\s+/g, ' ').trim(), tipe };
}
function bangunPusat() {
  const a1 = JSON.parse(fs.readFileSync(path.join(GEO_DIR, 'IDN-ADM1.geojson'), 'utf8'));
  const a2 = JSON.parse(fs.readFileSync(path.join(GEO_DIR, 'IDN-ADM2.geojson'), 'utf8'));
  const adm1 = {};
  const prov = a1.features.map((f) => ({ nama: provId(f.properties.shapeName) || null, asli: f.properties.shapeName, g: f.geometry }));
  for (const p of prov) { const c = pusatGeom(p.g); if (p.nama && c) adm1[p.nama] = { ...c, asli: p.asli }; }
  const adm2 = [];
  for (const f of a2.features) {
    const c = pusatGeom(f.geometry); if (!c) continue;
    const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
    const pv = prov.find((p) => p.nama && (p.g.type === 'Polygon' ? [p.g.coordinates] : p.g.coordinates).some((q) => dalamCincin(c.lng, c.lat, q[0]))); // pusat kab dalam provinsi mana
    const n = normWilayah(f.properties.shapeName);
    adm2.push({ asli: f.properties.shapeName, nama: n.nama, tipe: n.tipe || 'kabupaten', provinsi: pv ? pv.nama : null, ...c, _p: polys.length });
  }
  fs.writeFileSync(GEO_PUSAT, JSON.stringify({ adm1, adm2 }));
  return { adm1: Object.keys(adm1).length, adm2: adm2.length };
}
export function cariPusat(pusat, kab, provinsi) {
  const n = kab ? normWilayah(kab) : null;
  if (n && n.nama) {
    let k = pusat.adm2.filter((x) => x.nama === n.nama);
    if (n.tipe) { const t = k.filter((x) => x.tipe === n.tipe); k = t.length ? t : k; }
    if (k.length > 1 && provinsi) { const t = k.filter((x) => x.provinsi === provinsi); if (t.length) k = t; }
    if (k.length > 1 && !n.tipe) { /* Bandung vs Kota Bandung tanpa penanda: ambigu, jatuh ke provinsi */ k = []; }
    if (k.length === 1) return { lat: k[0].lat, lng: k[0].lng, presisi_lokasi: 'kabupaten', adm: 'ADM2', nama: k[0].asli };
  }
  const p = provinsi && pusat.adm1[provinsi];
  return p ? { lat: p.lat, lng: p.lng, presisi_lokasi: 'provinsi', adm: 'ADM1', nama: p.asli } : null;
}
function terapkanGeo(proyek, pusat) {
  for (const p of proyek) {
    if (p.lat != null) continue;
    const h = cariPusat(pusat, (p.kabupaten_kota || [])[0]?.nilai, p.provinsi);
    if (!h) continue;
    p.lat = h.lat; p.lng = h.lng; p.presisi_lokasi = h.presisi_lokasi;
    p.sumber_lokasi = { jenis: 'geoBoundaries-pusat-wilayah', adm: h.adm, wilayah: h.nama, url: GEO_SUMBER[h.adm].url, lisensi: GEO_SUMBER[h.adm].lisensi, tanggal_ambil: HARI_INI, catatan: 'titik pusat wilayah (poligon terluas), bukan lokasi proyek' };
  }
}

// ---------- GEM (CSV unduhan manual pemilik); kolom DIPERIKSA, tidak ditebak ----------
export function csvBaris(teks) {
  const hasil = []; let baris = [], sel = '', q = false;
  for (let i = 0; i < teks.length; i++) {
    const c = teks[i];
    if (q) { if (c === '"') { if (teks[i + 1] === '"') { sel += '"'; i++; } else q = false; } else sel += c; }
    else if (c === '"') q = true;
    else if (c === ',') { baris.push(sel); sel = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && teks[i + 1] === '\n') i++; baris.push(sel); sel = ''; if (baris.some((x) => x !== '')) hasil.push(baris); baris = []; }
    else sel += c;
  }
  if (sel !== '' || baris.length) { baris.push(sel); hasil.push(baris); }
  return hasil;
}
const GEM_WAJIB = ['Project Name', 'Country/Area', 'Capacity (MW)', 'Status', 'Latitude', 'Longitude'];
const GEM_STATUS = { operating: 'beroperasi', construction: 'konstruksi', 'pre-construction': 'rencana', announced: 'rencana', permitted: 'perizinan', shelved: 'ditunda', cancelled: 'dibatalkan' };
const GEM_TEK = [['solar', 'surya'], ['wind', 'bayu'], ['hydro', 'hidro'], ['geothermal', 'panas-bumi'], ['bioenergy', 'bioenergi']];
export function gemDari(namaBerkas, teks, tanggal) {
  const baris = csvBaris(teks), kepala = baris[0] || [];
  const tek = (GEM_TEK.find(([k]) => namaBerkas.toLowerCase().includes(k)) || [])[1];
  const hilang = GEM_WAJIB.filter((k) => !kepala.includes(k));
  if (!tek || hilang.length) return { masukan: [], lapor: { berkas: namaBerkas, dilewati: true, alasan: !tek ? 'teknologi tak dikenali dari nama berkas' : 'kolom wajib tidak ada: ' + hilang.join('; '), header: kepala } };
  const ix = (k) => kepala.indexOf(k), opt = (r, k) => (ix(k) >= 0 ? r[ix(k)] : '');
  const sumber = { jenis: 'gem', url: 'https://globalenergymonitor.org/projects/', tingkat_bukti: 'terbit', lisensi: 'CC BY 4.0 (baris TZ ID: CC BY-NC 4.0)', tanggal_ambil: tanggal, berkas: namaBerkas, atribusi: 'Global Energy Monitor, ' + namaBerkas };
  const masukan = [];
  for (const r of baris.slice(1)) {
    if (r[ix('Country/Area')] !== 'Indonesia') continue;
    const mw = Number(String(r[ix('Capacity (MW)')]).replace(/,/g, ''));
    const lat = Number(r[ix('Latitude')]), lng = Number(r[ix('Longitude')]);
    const o = { nama: r[ix('Project Name')], teknologi: tek, provinsi: provId(opt(r, 'State/Province')), _sumber: sumber };
    if (Number.isFinite(mw) && mw > 0) o.kapasitas = { nilai: mw, satuan: 'MW' };
    const st = GEM_STATUS[String(r[ix('Status')]).toLowerCase()]; if (st) o.status = { nilai: st, status_asli: r[ix('Status')] };
    const own = opt(r, 'Owner'); if (own) o.pemilik = own;
    if (r[ix('Latitude')] !== '' && Number.isFinite(lat) && Number.isFinite(lng)) {
      o.lat = lat; o.lng = lng; o.presisi_lokasi = /^exact/i.test(opt(r, 'Location accuracy')) ? 'titik_persis' : 'landmark';
    }
    if (o.nama) masukan.push(o);
  }
  return { masukan, lapor: { berkas: namaBerkas, baris: masukan.length } };
}
function gemMuat() {
  const dir = path.join(RAW, 'gem'); const m = []; const lapor = [];
  if (!fs.existsSync(dir)) return { m, lapor };
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.csv')).sort()) {
    const h = gemDari(f, fs.readFileSync(path.join(dir, f), 'utf8'), HARI_INI); m.push(...h.masukan); lapor.push(h.lapor);
  }
  return { m, lapor };
}

// ---------- jaringan ----------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let terakhir = 0;
async function tunggu(u) {
  const d = Date.now() - terakhir;
  if (d < GAP_MS) await sleep(GAP_MS - d);
  terakhir = Date.now();
  return fetch(u, { headers: { 'User-Agent': UA }, redirect: 'follow', signal: AbortSignal.timeout(30000) });
}
async function robotsOk(u) {
  const { origin, pathname } = new URL(u);
  try {
    const r = await tunggu(origin + '/robots.txt');
    if (r.status !== 200) return true;
    let ua = false; const tolak = [];
    for (const b of (await r.text()).split(/\r?\n/)) {
      const m = b.match(/^\s*([a-z-]+)\s*:\s*(.*?)\s*(#.*)?$/i); if (!m) continue;
      const k = m[1].toLowerCase();
      if (k === 'user-agent') ua = m[2] === '*'; else if (ua && k === 'disallow' && m[2]) tolak.push(m[2]);
    }
    return !tolak.some((p) => pathname.startsWith(p));
  } catch { return true; }
}
const WIKI = [['en', 'List_of_power_stations_in_Indonesia', 'wp_en_List_of_power_stations_in_Indonesia.wiki'], ['id', 'Daftar_Proyek_Strategis_Nasional', 'wp_id_psn.wiki']];
async function ambil() {
  fs.mkdirSync(RAW, { recursive: true });
  for (const [bhs, judul, berkas] of WIKI) {
    const f = path.join(RAW, berkas); if (fs.existsSync(f)) continue;
    const u = `https://${bhs}.wikipedia.org/w/index.php?title=${judul}&action=raw`;
    if (!(await robotsOk(u))) { console.error('ROBOTS-TOLAK', u); continue; }
    const r = await tunggu(u);
    if (r.status === 403 || r.status === 429) { console.error('BERHENTI', r.status, u); process.exit(3); }
    if (r.status !== 200) { console.error('HTTP', r.status, u); continue; }
    fs.writeFileSync(f, Buffer.from(await r.arrayBuffer()));
  }
}
// ---------- Wikidata (CC0): pembangkit Indonesia lewat Action API (query.wikidata.org/sparql DILARANG robots.txt-nya: tidak dipakai) ----------
// Pencarian haswbstatement:P17=Q252 + kata kunci, lalu wbgetentities per 50. Fosil disimpan di raw (teknologi null) tapi tidak masuk proyek.jsonl.
const WD_API = 'https://www.wikidata.org/w/api.php';
const WD_RAW = path.join(RAW, 'wikidata_pembangkit.jsonl');
const SUMBER_WD = { jenis: 'wikidata', url: 'https://www.wikidata.org/', tingkat_bukti: 'media', lisensi: 'CC0 1.0', atribusi: 'Wikidata (CC0), diambil ' + HARI_INI + '; data komunitas, koordinat sebagaimana tercatat', catatan: 'Wikidata; QID di catatan baris' };
export function tekDariTeks(t) {
  const s = String(t || '').toLowerCase();
  if (/pumped|battery|energy storage/.test(s)) return 'penyimpanan';
  if (/geotherm|panas bumi|pltp/.test(s)) return 'panas-bumi';
  if (/solar|photovoltaic|pltS\b|plts\b/i.test(s)) return 'surya';
  if (/wind|pltb\b|bayu/.test(s)) return 'bayu';
  if (/hydro|plta\b|pltm|run-of-the-river|tidal/.test(s) && !/tidal/.test(s)) return 'hidro';
  if (/waste|garbage|landfill|pltsa|sampah/.test(s)) return 'biomassa-sampah';
  if (/biomass|biogas|biofuel|bioenergy|biodiesel|palm oil|pltbm|pltbg/.test(s)) return 'bioenergi';
  if (/nuclear/.test(s)) return 'nuklir';
  if (/tidal|wave/.test(s)) return 'laut';
  return null;
}
const SATUAN_MW = { megawatt: 1, kilowatt: 1e-3, watt: 1e-6, gigawatt: 1e3 };
// ent: entitas Wikidata; lab: {qid:{en,id}}; induk: {qid:[qid P131]}
export function dariWikidata(ent, lab, induk) {
  const L = (q) => lab[q]?.en || lab[q]?.id || null;
  const cl = (p) => ent.claims?.[p] || [];
  const nilaiQ = (p) => cl(p).map((c) => c.mainsnak?.datavalue?.value?.id).filter(Boolean);
  const p31 = nilaiQ('P31').map(L).filter(Boolean), sumberE = nilaiQ('P618').map(L).filter(Boolean);
  const nama = ent.labels?.en?.value || ent.labels?.id?.value || null;
  if (!nama) return null;
  const tek = tekDariTeks([...sumberE, ...p31, nama].join(' | '));
  const kap = cl('P2109').map((c) => c.mainsnak?.datavalue?.value).filter(Boolean).map((v) => ({ n: Number(v.amount), u: L((v.unit || '').split('/').pop()) })).map((v) => ({ mw: Number.isFinite(v.n) && SATUAN_MW[String(v.u).toLowerCase()] ? +(v.n * SATUAN_MW[String(v.u).toLowerCase()]).toFixed(4) : null })).map((v) => v.mw).filter((x) => x > 0);
  const k = cl('P625')[0]?.mainsnak?.datavalue?.value;
  // rantai P131 sampai provinsi (maks 5 lompatan)
  const rantai = []; let fr = nilaiQ('P131'); let provinsi = null;
  for (let i = 0; i < 5 && fr.length && !provinsi; i++) {
    const nx = [];
    for (const q of fr) { const nm = L(q); if (nm) rantai.push(nm); const pv = provId(nm); if (pv) { provinsi = pv; break; } nx.push(...(induk[q] || [])); }
    fr = nx;
  }
  const tgl = (p) => (cl(p)[0]?.mainsnak?.datavalue?.value?.time || '').slice(1, 5) || null;
  const st = nilaiQ('P5817').map(L).join(' ').toLowerCase();
  return {
    qid: ent.id, nama, nama_id: ent.labels?.id?.value || null, jenis: p31, sumber_energi: sumberE, teknologi: tek, kapasitas_mw: kap.length ? Math.max(...kap) : null,
    pemilik: [...new Set([...nilaiQ('P127'), ...nilaiQ('P137')].map(L).filter(Boolean))], lat: k ? k.latitude : null, lng: k ? k.longitude : null,
    provinsi, kabupaten: rantai.find((x) => x !== provinsi && !provId(x)) || null, tahun_operasi: tgl('P729'), tahun_berdiri: tgl('P571'),
    status: /operat|in use/.test(st) ? 'beroperasi' : /construct/.test(st) ? 'konstruksi' : /plan|propos/.test(st) ? 'rencana' : null,
  };
}
async function wdGet(params) {
  const u = WD_API + '?' + new URLSearchParams({ format: 'json', maxlag: '30', ...params });
  for (let i = 0; i < 4; i++) {
    const r = await tunggu(u);
    if (r.status === 429 || r.status === 403) { console.error('BERHENTI', r.status, u); process.exit(3); }
    if (r.status === 200) { const j = await r.json(); if (!j.error) return j; if (j.error.code !== 'maxlag') throw new Error(JSON.stringify(j.error)); }
    await sleep(5000);
  }
  throw new Error('wikidata gagal ' + u);
}
async function ambilWikidata() {
  const ids = new Set();
  for (const q of ['power station', 'power plant', 'PLTU', 'PLTA', 'PLTP', 'PLTS', 'PLTB', 'PLTD', 'PLTG', 'PLTMH', 'geothermal', 'solar', 'wind farm', 'hydroelectric', 'dam', 'biomass', 'waste to energy', 'coal-fired', 'gas-fired', 'diesel']) {
    for (let off = 0; ;) {
      const j = await wdGet({ action: 'query', list: 'search', srsearch: q + ' haswbstatement:P17=Q252', srlimit: '50', sroffset: String(off) });
      j.query.search.forEach((s) => ids.add(s.title));
      if (!j.continue) break; off = j.continue.sroffset;
    }
  }
  const ent = {}; const lab = {}; const induk = {};
  const batch = async (qs, props) => { const out = {}; for (let i = 0; i < qs.length; i += 50) Object.assign(out, (await wdGet({ action: 'wbgetentities', ids: qs.slice(i, i + 50).join('|'), props, languages: 'en|id' })).entities); return out; };
  Object.assign(ent, await batch([...ids], 'labels|claims'));
  // rujukan: P31, P618, P127, P137, P131, satuan P2109
  const ruj = new Set();
  const rujDari = (e) => { for (const p of ['P31', 'P618', 'P127', 'P137', 'P131', 'P5817']) for (const c of e.claims?.[p] || []) { const q = c.mainsnak?.datavalue?.value?.id; if (q) ruj.add(q); } for (const c of e.claims?.P2109 || []) { const u = c.mainsnak?.datavalue?.value?.unit; if (u) ruj.add(u.split('/').pop()); } };
  Object.values(ent).forEach(rujDari);
  let antre = [...ruj]; const lihat = new Set();
  for (let lompat = 0; lompat < 5 && antre.length; lompat++) {
    const baru = antre.filter((q) => !lihat.has(q)); baru.forEach((q) => lihat.add(q)); antre = [];
    const e = await batch(baru, lompat < 5 ? 'labels|claims' : 'labels');
    for (const [q, v] of Object.entries(e)) {
      lab[q] = { en: v.labels?.en?.value, id: v.labels?.id?.value };
      if (lompat < 4 && !provId(lab[q].en)) { induk[q] = (v.claims?.P131 || []).map((c) => c.mainsnak?.datavalue?.value?.id).filter(Boolean); antre.push(...induk[q]); }
    }
  }
  const hasil = [];
  for (const e of Object.values(ent)) {
    if (!e.id) continue;
    const r = dariWikidata(e, lab, induk);
    if (!r) continue;
    const bukanPembangkit = !r.jenis.some((j) => /power (station|plant)|power stat|dam|wind farm|solar park|geothermal|plant/i.test(j)) && !r.kapasitas_mw && !r.sumber_energi.length;
    if (!bukanPembangkit) hasil.push(r);
  }
  hasil.sort((a, b) => a.qid.localeCompare(b.qid, 'en', { numeric: true }));
  tulis(WD_RAW, hasil.map((r) => ({ ...r, diambil: HARI_INI })));
  const ebt = hasil.filter((r) => r.teknologi);
  console.error('wikidata:', JSON.stringify({ kandidat: ids.size, pembangkit: hasil.length, ebt: ebt.length, fosil_atau_lain: hasil.length - ebt.length, berkoordinat: hasil.filter((r) => r.lat != null).length, berprovinsi: hasil.filter((r) => r.provinsi).length }));
}
export function wdMasukan(rows, tanggal) {
  const m = [];
  for (const r of rows) {
    const tek = tekDariTeks([...r.sumber_energi, ...r.jenis, r.nama].join(' | ')); // ulang: bendungan/waduk saja bukan pembangkit
    if (!tek) continue;
    m.push({
      nama: r.nama, teknologi: tek, provinsi: r.provinsi, kabupaten_kota: r.kabupaten,
      kapasitas: r.kapasitas_mw ? [{ nilai: r.kapasitas_mw, satuan: 'MW' }] : [], pemilik: r.pemilik,
      status: r.status ? { nilai: r.status, status_asli: 'Wikidata P5817' } : null, cod_aktual: r.tahun_operasi ? [{ nilai: Number(r.tahun_operasi), catatan: 'Wikidata P729' }] : [],
      lat: r.lat, lng: r.lng, presisi_lokasi: r.lat != null ? 'titik_persis' : null, catatan: 'Wikidata ' + r.qid,
      _sumber: { ...SUMBER_WD, halaman: r.qid, url: 'https://www.wikidata.org/wiki/' + r.qid, tanggal_ambil: r.diambil || tanggal },
    });
  }
  return m;
}
// ---------- RUPTL PLN 2025-2034 (teks hasil `pdftotext -layout`; dokumen publik PLN) ----------
// Tabel rincian pembangkit per provinsi (Lampiran A, B, C). Baris bernama sama dalam satu provinsi digabung (kapasitas dijumlah,
// tiap tahap COD dicatat). Baris "kuota/tersebar" bukan proyek bernama: dilewati dan dihitung. Tabel berupa gambar: tidak diurai (tanpa OCR).
const PROV_RUPTL = {
  A1: 'Aceh', A2: 'Sumatera Utara', A3: 'Riau', A4: 'Kepulauan Riau', A5: 'Kepulauan Bangka Belitung', A6: 'Sumatera Barat', A7: 'Jambi', A8: 'Sumatera Selatan',
  A9: 'Bengkulu', A10: 'Lampung', A11: 'Kalimantan Barat', A12: 'Kalimantan Selatan', A13: 'Kalimantan Tengah', A14: 'Kalimantan Timur', A15: 'Kalimantan Utara',
  B1: 'DKI Jakarta', B2: 'Banten', B3: 'Jawa Barat', B4: 'Jawa Tengah', B5: 'DI Yogyakarta', B6: 'Jawa Timur', B7: 'Bali',
  C1: 'Sulawesi Utara', C2: 'Sulawesi Tengah', C3: 'Gorontalo', C4: 'Sulawesi Selatan', C5: 'Sulawesi Tenggara', C6: 'Sulawesi Barat', C7: 'Maluku', C8: 'Maluku Utara',
  C9: null, C10: null, C11: 'Nusa Tenggara Barat', C12: 'Nusa Tenggara Timur', // C9, C10: gabungan beberapa provinsi Papua; provinsi per baris tidak pasti
};
const TEK_RUPTL = { PLTS: 'surya', 'PLTS+BESS': 'surya', 'PLTS+BESS ': 'surya', PLTB: 'bayu', PLTA: 'hidro', PLTM: 'hidro', PLTMH: 'hidro', PLTP: 'panas-bumi', PLTBm: 'bioenergi', PLTBg: 'bioenergi', 'PLT Bio': 'bioenergi', PLTBio: 'bioenergi',
  PLTSa: 'biomassa-sampah', BESS: 'penyimpanan', PS: 'penyimpanan', PLTN: 'nuklir', PLTL: 'laut', PLTH: 'hidrogen' };
const STATUS_RUPTL = { konstruksi: 'konstruksi', rencana: 'rencana', ppa: 'rencana', committed: 'rencana', pengadaan: 'rencana', pendanaan: 'rencana', eksplorasi: 'rencana' };
const RE_STATUS = /(Konstruksi|Rencana|PPA|Committed|Pengadaan|Pendanaan|Eksplorasi|Dilanjutkan|Operasi|Studi|Perencanaan)\s+(SH-PLN|PLN|IPP|[A-Za-z][A-Za-z/&+-]{1,15})\s*$/;
const RE_TAHAP = /((?:\d+x)?\d[\d.,]*)\*?\s+(20\d\d|-)\s+(20\d\d|-)(?=\s|$)/g;
const RE_JENIS = /(?:^|\s)(PLTS\s?\+\s?BESS|PLT Bio|PLT[A-Za-z]{1,3}|BESS|PS)(?=\s|$)/;
const numId = (s) => { const [a, b] = String(s).includes('x') ? String(s).split('x') : [1, s]; return +(Number(a) * Number(String(b).replace(/\./g, '').replace(',', '.'))).toFixed(3); }; // 3.567,7 -> 3567.7 ; 9,8 -> 9.8 ; 2,08 -> 2.08
const RE_STATUS_LONGGAR = /(Konstru\s*ksi|Konstru|Rencana|PPA|Committed|Pengadaan|Pendanaan|Eksplorasi|Dilanjutkan|Operasi)\b/;
const RE_PENG = /(?:^|\s)(SH-PLN|PLN|IPP)\s*$/;
const RE_TAJUK_ISI = /Skenario|\bBase\b|\bARED\b|\(MW\)|Tenaga|Listrik|\bTarget\b|\bCOD\b|Lokasi|Pembangk|^\s*(No|Sistem|Jenis|Status)\b/;
export function ruptlDari(teks) {
  const hal = []; let cf = 1;
  const baris = teks.split('\n').map((l) => { hal.push(cf); cf += (l.match(/\f/g) || []).length; return l.replace(/\f/g, ''); });
  const judul = [];
  baris.forEach((l, i) => {
    const m = l.match(/^\s*Tabel ([ABC]\d+)\.(\d+)\.?\s+(Rincian|Rencana|Daftar)\b.*Pembangkit/);
    if (m && !/KTT|Rekapitulasi|Confidence|Kepastian/i.test(l)) judul.push({ i, sek: m[1] });
  });
  const hasil = new Map(); const lewat = { kuota: 0, bukan_ebt: 0, tanpa_tahap: 0 }; const tabel = {};
  for (const { i: mulai, sek } of judul) {
    let akhir = baris.length;
    for (let k = mulai + 1; k < baris.length; k++) if (/^\s*Tabel [A-Z]\d+\.\d+/.test(baris[k]) || /^\s*TOTAL\b/.test(baris[k])) { akhir = k; break; }
    // 1. kumpulkan baris isi: {l, lok, utama(jenis), halaman}
    let lok = -1; let sejakTajuk = 0; const isi = [];
    for (let k = mulai; k < akhir; k++) {
      const l = baris[k];
      if (/Pengembang\s*$/.test(l) && k > mulai) { // tajuk (berulang tiap halaman); posisi kolom nama = 'Lokasi' di sekitar tajuk
        const dekat = [l, baris[k - 1], baris[k - 2], baris[k - 3], baris[k + 1]].filter(Boolean);
        const sekitar = dekat.find((x) => /Lokasi/.test(x));
        if (sekitar) lok = sekitar.indexOf('Lokasi');
        else { const q = dekat.find((x) => /\b(Proyek|Pembangkit)\b/.test(x)); if (!q) continue; lok = q.search(/\b(Proyek|Pembangkit)\b/); }
        sejakTajuk = 1; continue;
      }
      if (lok < 0 || !l.trim() || /^\s*[A-C]\s*-\s*\d+\s*$/.test(l) || /\bKapasitas\b|\bCOD\b.*\bCOD\b/.test(l)) continue;
      const jm = l.match(RE_JENIS); const utama = !!jm && jm.index + jm[0].length - jm[1].length < lok - 3;
      if (sejakTajuk && !utama && RE_TAJUK_ISI.test(l)) continue; // sisa tajuk bertingkat
      if (utama) sejakTajuk = 0;
      isi.push({ l, lok, utama, jenis: utama ? jm[1].replace(/\s/g, '').replace('PLTBio', 'PLTBio') : null, hal: hal[k] });
    }
    // 2. tiap baris bukan-utama dibagi ke baris utama terdekat: separuh atas ke sebelumnya, sisanya ke sesudahnya
    const utamaIdx = isi.map((x, i) => (x.utama ? i : -1)).filter((i) => i >= 0);
    const blok = utamaIdx.map((i) => ({ sek, jenis: isi[i].jenis, halaman: isi[i].hal, baris: [isi[i]] }));
    const taruh = (a, b, ke) => { for (let i = a; i < b; i++) blok[ke].baris.push(isi[i]); };
    // baris utama yang sudah memuat nama sendiri tidak mengambil pecahan tetangga; pecahan tanpa pemilik jelas dibagi dua
    const sendiri = utamaIdx.map((i) => { const x = isi[i]; const tm = x.l.match(new RegExp(RE_TAHAP.source)); const sm = x.l.match(RE_STATUS_LONGGAR); const potong = Math.min(x.l.length, tm ? tm.index : 1e9, sm && sm.index > x.lok ? sm.index : 1e9); return x.l.slice(Math.max(0, x.lok - 3), potong).trim().length > 0; });
    if (utamaIdx.length) {
      taruh(0, utamaIdx[0], 0);
      for (let u = 0; u < utamaIdx.length; u++) {
        const a = utamaIdx[u] + 1, b = u + 1 < utamaIdx.length ? utamaIdx[u + 1] : isi.length;
        if (u + 1 >= utamaIdx.length) { taruh(a, b, u); continue; }
        if (!sendiri[u] && !sendiri[u + 1]) { const mid = a + Math.floor((b - a) / 2); taruh(a, mid, u); taruh(mid, b, u + 1); }
        else if (!sendiri[u]) taruh(a, b, u);
        else if (!sendiri[u + 1]) taruh(a, b, u + 1);
        else taruh(a, b, u); // dua baris bernama sendiri: lanjutan baris menggantung ke atas
      }
    }
    tabel[sek] = blok.length;
    for (const b of blok) {
      const tek = TEK_RUPTL[b.jenis];
      if (!tek) { lewat.bukan_ebt++; continue; }
      const tahap = []; const nm = []; let peng = null; const ekor = [];
      b.baris.sort((x, y) => isi.indexOf(x) - isi.indexOf(y));
      for (const { l, lok: lk } of b.baris) {
        let potong = l.length;
        const tm = l.match(new RegExp(RE_TAHAP.source)); if (tm) potong = Math.min(potong, tm.index);
        for (const mm of l.matchAll(RE_TAHAP)) tahap.push({ mw: numId(mm[1]), base: mm[2] === '-' ? null : Number(mm[2]), ared: mm[3] === '-' ? null : Number(mm[3]) });
        const sm = l.match(RE_STATUS_LONGGAR); if (sm && sm.index > lk) { potong = Math.min(potong, sm.index); ekor.push(sm[1]); }
        const pm = l.match(RE_PENG); if (pm) { potong = Math.min(potong, pm.index); peng = pm[1]; }
        const frag = l.slice(Math.max(0, lk - 3), potong).trim();
        if (frag && frag.length <= 45) nm.push(frag); // pecahan lebih panjang = teks paragraf di bawah tabel tanpa TOTAL
      }
      const st = ekor.length ? ekor.join('').replace(/\s/g, '').replace(/^Konstru(ksi)?$/, 'Konstruksi') : null;
      const nama = nm.join(' ').replace(/\s+/g, ' ').replace(/([a-z])\d\)/g, '$1').replace(/\s\d\)/g, '').replace(/\*/g, '').trim();
      const bersihNama = nama.replace(/\b(Jawa-Bali|Jawa Barat|Jawa Tengah|Jawa Timur|Sumatera\(Kuo|Tersebar|Upper)\b\s*/g, (m) => (m.startsWith('Upper') ? m : '')).replace(/\s+/g, ' ').trim();
      if (/kuota|dedieselisasi|isolated|lisdes/i.test(nama) || !bersihNama) { lewat.kuota++; continue; }
      if (!tahap.length) { lewat.tanpa_tahap++; if (process.env.DEBUG_RUPTL) console.error('TANPA', sek, b.jenis, JSON.stringify(nama), b.baris.length); continue; }
      const kunci = [sek, tek, bersihNama.toLowerCase()].join('|');
      const h = hasil.get(kunci) || { sek, provinsi: PROV_RUPTL[sek] ?? null, jenis: b.jenis, tek, nama: bersihNama, tahap: [], st, peng, halaman: b.halaman, baris: 0 };
      h.tahap.push(...tahap); h.baris++; hasil.set(kunci, h);
    }
  }
  return { proyek: [...hasil.values()], lewat, tabel };
}
const URL_RUPTL = 'https://gatrik.esdm.go.id/gatrik/gatrik-api//storage/migrasi/download_index/files/b967d-ruptl-pln-2025-2034-pub-.pdf'; // dokumen publik resmi Ditjen Gatrik (daftar unduhan)
// Nama terpotong oleh kolom tata letak PDF ("ulehu" = Tulehu): lengkapi dari teks yang sama bila hanya satu pelengkap huruf-awal ditemukan; kalau tidak, tandai.
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export function perbaikiNama(nama, teks) {
  const kotor = /\d{1,3}(\.\d{3})*,\d|Jumlah|\.\s|\s(yang|dan|dapat|sebagai|akan|tersebut|pembangkit)\s/i.test(nama) || nama.length > 50 || /\s[a-z]{1,2}$/.test(nama);
  const m = nama.match(/^(\S+)\s+([a-z]\S*(?:\s+\S+){0,2})$/);
  if (m && !kotor) {
    const cari = new RegExp('(?<![A-Za-z])([A-Z][A-Za-z]{0,3})' + esc(m[2].split(/[(\d#]/)[0].trim()).replace(/\s+/g, '\\s+'), 'g');
    const semua = [...teks.matchAll(cari)].map((x) => x[1]);
    const cand = new Set(semua);
    // pelengkap harus tunggal dan muncul >= 2 kali di dokumen (tabel + narasi/transmisi)
    if (cand.size === 1 && semua.length >= 2) { const [c] = cand; return { nama: m[1] + ' ' + c + m[2], diperbaiki: true }; }
    return { nama, perlu_tinjau: true };
  }
  return kotor || /^\S+\s+[a-z]/.test(nama) ? { nama, perlu_tinjau: true } : { nama };
}
export function ruptlSeed(teks, tanggal) {
  const { proyek, lewat, tabel } = ruptlDari(teks);
  const baris = [];
  for (const p of proyek) {
    baris.push({ _sumber: { jenis: 'ruptl', url: URL_RUPTL + '#page=' + p.halaman, halaman: 'hlm PDF ' + p.halaman, tingkat_bukti: 'resmi', lisensi: 'dokumen publik PLN', tanggal_ambil: tanggal, catatan: 'Tabel rincian rencana pembangunan pembangkit ' + p.sek + '; status pengembang RUPTL (PLN/IPP/SH-PLN) bukan nama perusahaan; tahun COD = skenario RE Base' } });
    const total = +p.tahap.reduce((s, t) => s + t.mw, 0).toFixed(3);
    const tahunBeda = [...new Set(p.tahap.map((t) => t.base ?? t.ared).filter(Boolean))].sort();
    const pn = perbaikiNama(`${p.jenis} ${p.nama}`, teks);
    const r = { nama: pn.nama, nama_perlu_tinjau: pn.perlu_tinjau ? true : undefined, nama_diperbaiki: pn.diperbaiki ? `${p.jenis} ${p.nama}` : undefined, teknologi: p.tek, provinsi: p.provinsi,
      kapasitas: { nilai: total, satuan: 'MW', catatan: p.baris > 1 || p.tahap.length > 1 ? `jumlah ${p.tahap.length} tahap/unit: ${p.tahap.map((t) => t.mw).join(' + ')}` : undefined },
      cod_target: tahunBeda.map((y) => ({ nilai: y, catatan: 'RE Base' + (p.tahap.some((t) => t.base === y && t.ared !== y) ? '; ARED ' + [...new Set(p.tahap.filter((t) => t.base === y).map((t) => t.ared))].join('/') : p.tahap.some((t) => t.base == null && t.ared === y) ? '; hanya skenario ARED (RE Base tanpa tahun)' : '') })),
      pemilik: p.peng ? { nilai: p.peng, catatan: 'status pengembang menurut RUPTL, bukan nama perusahaan' } : undefined,
      catatan: `RUPTL ${p.sek}; status asli: ${p.st || 'tidak terbaca'}` };
    const sk = STATUS_RUPTL[String(p.st || '').toLowerCase()]; if (sk) r.status = { nilai: sk, status_asli: p.st };
    baris.push(JSON.parse(JSON.stringify(r)));
  }
  return { baris, lewat, tabel, n: proyek.length };
}

// ---------- perakitan ----------
const SUMBER_WIKI_EN = { jenis: 'wikipedia', url: 'https://en.wikipedia.org/wiki/List_of_power_stations_in_Indonesia', tingkat_bukti: 'media', lisensi: 'CC BY-SA 4.0', atribusi: 'Wikipedia contributors, List of power stations in Indonesia, CC BY-SA 4.0, diambil ' + HARI_INI + '; data turunan wajib berlisensi sama', catatan: 'daftar komunitas, tanpa tanggal data per baris; status tidak dinyatakan' };
function kumpulMasukan() {
  const m = [];
  const wiki = path.join(RAW, 'wp_en_List_of_power_stations_in_Indonesia.wiki');
  if (fs.existsSync(wiki)) {
    const { kandidat } = dariWikiEn(fs.readFileSync(wiki, 'utf8'));
    for (const k of kandidat) m.push({ ...k, _sumber: { ...SUMBER_WIKI_EN, tanggal_ambil: HARI_INI } });
  }
  m.push(...gemMuat().m);
  if (fs.existsSync(WD_RAW)) m.push(...wdMasukan(bacaJsonl(WD_RAW), HARI_INI));
  for (const d of SEED_DIRS) m.push(...muatSeed(d));
  return m;
}
function dasarProyek() { return bangun(kumpulMasukan()); }

function statistik(h) {
  const n = h.proyek.length;
  const pct = (f) => (n ? Math.round((100 * h.proyek.filter(f).length) / n) : 0);
  const hit = (arr, k) => arr.reduce((o, x) => ((o[x[k] || 'null'] = (o[x[k] || 'null'] || 0) + 1), o), {});
  const tekStatus = {};
  for (const p of h.proyek) { const s = p.status[0]?.nilai || 'tanpa-status'; tekStatus[p.teknologi] ||= {}; tekStatus[p.teknologi][s] = (tekStatus[p.teknologi][s] || 0) + 1; }
  return {
    jumlah: n, ditolak: h.ditolak.length, konflik: h.konflik.length, pihak: h.pihak.length,
    per_teknologi_status: tekStatus, per_program: hit(h.proyek, 'program'), per_presisi: hit(h.proyek, 'presisi_lokasi'), per_bukti: hit(h.proyek, 'tingkat_bukti'),
    persen_terisi: {
      provinsi: pct((p) => p.provinsi), kabupaten_kota: pct((p) => p.kabupaten_kota?.length), koordinat: pct((p) => p.lat != null),
      kapasitas: pct((p) => p.kapasitas.length), pemilik: pct((p) => p.pemilik.length), epc: pct((p) => p.epc.length), pembeli: pct((p) => p.pembeli.length),
      nilai_investasi: pct((p) => p.nilai_investasi.length), skema_kerjasama: pct((p) => p.skema_kerjasama.length), tanggal_ppa: pct((p) => p.tanggal_ppa.length),
      financial_close: pct((p) => p.financial_close.length), cod_target: pct((p) => p.cod_target.length), cod_aktual: pct((p) => p.cod_aktual.length),
      status: pct((p) => p.status.length), tenaga_kerja: pct((p) => p.tenaga_kerja.length), pemberi_dana: pct((p) => p.pemberi_dana.length), pihak_terlibat: pct((p) => p.pihak_terlibat.length),
    },
    persen_presisi: Object.fromEntries(Object.entries(hit(h.proyek, 'presisi_lokasi')).map(([k, v]) => [k, Math.round((100 * v) / (n || 1))])),
  };
}

function selftest() {
  { // Wikidata: tanpa jaringan
    const lab = { Q1: { en: 'geothermal power station' }, Q2: { en: 'Kamojang' }, Q3: { en: 'West Java' }, Q4: { en: 'megawatt' }, Q5: { en: 'Pertamina' } };
    const e = { id: 'Q99', labels: { en: { value: 'Kamojang Geothermal' } }, claims: { P31: [{ mainsnak: { datavalue: { value: { id: 'Q1' } } } }], P131: [{ mainsnak: { datavalue: { value: { id: 'Q2' } } } }], P2109: [{ mainsnak: { datavalue: { value: { amount: '+235', unit: 'http://www.wikidata.org/entity/Q4' } } } }], P625: [{ mainsnak: { datavalue: { value: { latitude: -7.14, longitude: 107.8 } } } }], P127: [{ mainsnak: { datavalue: { value: { id: 'Q5' } } } }] } };
    const r = dariWikidata(e, lab, { Q2: ['Q3'] });
    assert.equal(r.teknologi, 'panas-bumi'); assert.equal(r.kapasitas_mw, 235); assert.equal(r.provinsi, 'Jawa Barat'); assert.deepEqual(r.pemilik, ['Pertamina']);
    const m = wdMasukan([{ ...r, diambil: '2026-11-07' }], '2026-11-07')[0];
    assert.equal(m.presisi_lokasi, 'titik_persis'); assert.equal(m._sumber.tingkat_bukti, 'media'); assert.equal(tekDariTeks('coal-fired power station'), null);
  }
  assert.equal(angka('1,320'), 1320); assert.equal(angka('4 x 65'), null); assert.equal(angka(' 235 '), 235);
  assert.equal(bersih("[[Kamojang|Kamojang geothermal]] ''x''<ref>a</ref>"), 'Kamojang geothermal x');
  assert.equal(provId('West Java'), 'Jawa Barat'); assert.equal(provId('Nowhere'), null);
  assert.ok(mirip('Kamojang geothermal', 'PLTP Kamojang')); assert.ok(!mirip('Cirata', 'Saguling')); assert.ok(!mirip('Energi asal sampah Kota Tangerang (PSN nomor 154)', 'Energi asal sampah Tangerang Selatan (PSN nomor 154)'));
  assert.equal(kapasitasSama([{ nilai: 100, satuan: 'MW' }], [{ nilai: 108, satuan: 'MWp' }]), true);
  assert.equal(kapasitasSama([{ nilai: 100, satuan: 'MW' }], [{ nilai: 150, satuan: 'MW' }]), false);
  assert.equal(kapasitasSama([{ nilai: 100, satuan: 'MW' }], []), null);
  const wt = '== Renewable ==\n=== Solar ===\n{| class="x"\n! Power station !! Location !! District !! Province !! Region !! Installed capacity !! Operator !! Sector !! Remarks\n|-\n| [[A solar]] || L ||[[Bandung]]||[[West Java]]|| Java || 50 ||PT X|| Private || n\n|-\n|B Solar\n|L\n|Garut\n|Banten\n|Java\n|1,000\n|PT Y\n|Gov\n|n\n|}';
  const { kandidat } = dariWikiEn(wt);
  assert.equal(kandidat.length, 2); assert.equal(kandidat[1].kapasitas.nilai, 1000); assert.equal(kandidat[0].provinsi, 'Jawa Barat');
  const S = (u, b = 'media') => ({ jenis: 't', url: u, tingkat_bukti: b, tanggal_ambil: '2026-11-07' });
  const h = bangun([
    { nama: 'PLTP Kamojang', teknologi: 'panas-bumi', provinsi: 'Jawa Barat', kapasitas: { nilai: 235, satuan: 'MW' }, _sumber: S('http://a') },
    { nama: 'Kamojang geothermal', teknologi: 'panas-bumi', provinsi: 'Jawa Barat', kapasitas: { nilai: 240, satuan: 'MW' }, _sumber: S('http://b', 'resmi') },
    { nama: 'Kamojang geothermal', teknologi: 'panas-bumi', provinsi: 'Jawa Barat', kapasitas: { nilai: 500, satuan: 'MW' }, _sumber: S('http://c') },
    { nama: 'Tanpa sumber', teknologi: 'surya', provinsi: 'Bali', _sumber: { url: '' } },
    { nama: 'Salah teknologi', teknologi: 'batubara', provinsi: 'Bali', _sumber: S('http://d') },
  ]);
  assert.equal(h.proyek.length, 2, 'dua proyek: gabung 235/240, pisah 500'); assert.equal(h.ditolak.length, 2);
  assert.ok(h.konflik.some((k) => k.jenis === 'nama-sama-kapasitas-beda-tidak-digabung'));
  assert.ok(h.konflik.some((k) => k.jenis === 'nilai-bertentangan' && k.atribut === 'kapasitas'));
  assert.equal(h.proyek.find((p) => p.kapasitas.length === 2).tingkat_bukti, 'resmi');
  const kotak = { type: 'Polygon', coordinates: [[[0, 0], [4, 0], [4, 2], [0, 2], [0, 0]]] };
  const pc = pusatGeom(kotak); assert.deepEqual([pc.lng, pc.lat], [2, 1]);
  assert.ok(dalamCincin(1, 1, kotak.coordinates[0]) && !dalamCincin(5, 1, kotak.coordinates[0]));
  assert.deepEqual(normWilayah('Kota Bandung'), { nama: 'bandung', tipe: 'kota' });
  const pus = { adm1: { 'Jawa Barat': { lat: -6.9, lng: 107.6, asli: 'West Java' } }, adm2: [{ asli: 'Bandung', nama: 'bandung', tipe: 'kabupaten', provinsi: 'Jawa Barat', lat: -7, lng: 107.5 }, { asli: 'Bandung City', nama: 'bandung', tipe: 'kota', provinsi: 'Jawa Barat', lat: -6.9, lng: 107.6 }] };
  assert.equal(cariPusat(pus, 'Kota Bandung', 'Jawa Barat').lat, -6.9);
  assert.equal(cariPusat(pus, 'Bandung', 'Jawa Barat').presisi_lokasi, 'provinsi'); // ambigu: jatuh ke provinsi
  assert.equal(cariPusat(pus, 'Tidak Ada', 'Bali'), null);
  const gem = gemDari('gem_wind_tracker.csv', 'Project Name,Country/Area,Capacity (MW),Status,Latitude,Longitude,Owner\n"Sidrap, I",Indonesia,"75",operating,-3.9,119.9,UPC\nX,Vietnam,10,operating,1,1,Y\n', '2026-11-07');
  assert.equal(gem.masukan.length, 1); assert.equal(gem.masukan[0].status.nilai, 'beroperasi'); assert.equal(gem.masukan[0].nama, 'Sidrap, I');
  assert.ok(gemDari('gem_wind.csv', 'Nama,Negara\nA,B\n', 'x').lapor.dilewati, 'kolom tak dikenal: dilewati, tidak ditebak');
  const rh = bangun([{ nama: 'Rahasia', teknologi: 'bioenergi', provinsi: 'Bali', _sumber: { url: 'internal:x', tingkat_bukti: 'resmi', tanggal_ambil: 't', publik: false, catatan_kerahasiaan: 'ck' } }]);
  assert.equal(rh.proyek[0].publik, false); assert.equal(rh.proyek[0].catatan_kerahasiaan, 'ck');
  const kol = (...x) => ' ' + String(x[0]).padEnd(4) + String(x[1]).padEnd(12) + String(x[2]).padEnd(10) + String(x[3]).padEnd(14) + String(x[4]).padEnd(8) + String(x[5]).padEnd(7) + String(x[6]).padEnd(7) + String(x[7]).padEnd(13) + x[8];
  const rt = ruptlDari(['Tabel B4.10. Rencana Pembangunan Pembangkit', kol('', '', '', 'Lokasi/Nama', 'Kapasitas', 'COD', '', '', ''), kol('No', 'Sistem', 'Jenis', 'Pembangkit', '(MW)', 'Base', 'ARED', 'Status', 'Pengembang'),
    kol(1, 'Jawa Bali', 'PLTM', 'Harjosari', '9,9', '2025', '2025', 'Konstruksi', 'IPP'), kol(2, 'Jawa Bali', 'PLTP', 'Dieng', '2x55', '-', '2030', 'Rencana', 'SH-PLN'), kol(3, 'Jawa Bali', 'PLTU', 'Batubara', '600', '2025', '2025', 'Rencana', 'PLN'), ''].join('\n'));
  assert.equal(rt.proyek.length, 2); assert.equal(rt.proyek[0].tahap[0].mw, 9.9); assert.equal(rt.proyek[1].tahap[0].mw, 110); assert.equal(rt.proyek[1].tahap[0].base, null); assert.equal(rt.lewat.bukan_ebt, 1);
  assert.equal(rt.proyek[0].peng, 'IPP'); assert.equal(rt.proyek[0].provinsi, 'Jawa Tengah');
  console.log('selftest OK');
}

async function main() {
  const a = new Set(process.argv.slice(2));
  if (a.has('--selftest')) return selftest();
  fs.mkdirSync(RAW, { recursive: true });
  if (a.has('--ambil')) await ambil();
  if (a.has('--wikidata')) { if (!(await robotsOk(WD_API)) && process.env.WIKIDATA_IZIN_PEMILIK !== '1') { console.error('ROBOTS-TOLAK', WD_API, '(robots.txt Wikidata: Disallow /w/ dan /sparql untuk agen *; lanjut hanya atas izin pemilik: WIKIDATA_IZIN_PEMILIK=1)'); process.exit(2); } await ambilWikidata(); }
  if (a.has('--geo-pusat')) console.error('pusat wilayah:', JSON.stringify(bangunPusat()));
  const rt = process.argv.find((x) => x.startsWith('--ruptl-teks='));
  if (rt) { const h = ruptlSeed(fs.readFileSync(rt.slice(13), 'utf8'), HARI_INI); fs.mkdirSync(path.join(OUT, 'seed'), { recursive: true }); tulis(path.join(OUT, 'seed/ruptl.jsonl'), h.baris); console.error('ruptl:', JSON.stringify({ proyek: h.n, lewat: h.lewat, tabel: h.tabel })); }
  if (a.has('--gem-periksa')) console.log(JSON.stringify(gemMuat().lapor, null, 1));
  if (a.has('--bangun') || a.has('--statistik')) {
    const h = dasarProyek();
    if (fs.existsSync(GEO_PUSAT)) terapkanGeo(h.proyek, JSON.parse(fs.readFileSync(GEO_PUSAT, 'utf8')));
    if (a.has('--bangun')) {
      tulis(path.join(OUT, 'proyek.jsonl'), h.proyek);
      tulis(path.join(OUT, 'pihak.jsonl'), h.pihak);
      tulis(path.join(OUT, 'konflik.jsonl'), h.konflik);
      tulis(path.join(OUT, 'sumber.jsonl'), h.sumber);
      tulis(path.join(OUT, 'ditolak.jsonl'), h.ditolak);
    }
    console.log(JSON.stringify(statistik(h), null, 1));
  }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
