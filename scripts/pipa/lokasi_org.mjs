#!/usr/bin/env node
// Kantor pusat organisasi tanpa provinsi -> data/direktori/lokasi_org.json (disunting/ditinjau manusia; dibaca potret.mjs).
//   node scripts/pipa/lokasi_org.mjs --situs       alamat dari halaman kontak situs resmi (tingkat situs-sendiri)
//   node scripts/pipa/lokasi_org.mjs --wikidata    P159 (kantor pusat) Wikidata, nama persis (tingkat media: data komunitas)
//   node scripts/pipa/lokasi_org.mjs --selftest
// Sopan: UA METI, robots.txt dihormati (Wikidata api.php: pengecualian pemilik, sama seperti panen_logo.mjs), jeda >= 2,1 dtk per host,
// tanpa login/formulir/CAPTCHA, 403/429 = berhenti untuk host itu. Tidak menimpa isian yang sudah ada di berkas hasil.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { UA, robotsBolehkan, norm } from '../panen/berita.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const KELUAR = path.join(ROOT, 'data/direktori/lokasi_org.json');
const PUSAT = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/geo/pusat-wilayah.json'), 'utf8'));
const tgl = () => new Date().toISOString().slice(0, 10);
const tidur = (ms) => new Promise((r) => setTimeout(r, ms));
const terakhir = new Map(), robots = new Map(), blok = new Set();
async function ambil(url, terima = '*/*') {
  const u = new URL(url); if (blok.has(u.host)) return null;
  const w = (terakhir.get(u.host) || 0) + 2100 - Date.now(); terakhir.set(u.host, Date.now() + Math.max(w, 0)); if (w > 0) await tidur(w);
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: terima }, redirect: 'follow', signal: AbortSignal.timeout(9000) });
    if (r.status === 403 || r.status === 429) { blok.add(u.host); return null; }
    return r.ok ? { url: r.url, teks: (await r.text()).slice(0, 1_500_000) } : null;
  } catch { return null; }
}
async function boleh(url) {
  const u = new URL(url); if (/wikidata\.org$/.test(u.host)) return true;
  if (!robots.has(u.host)) { const r = await ambil(u.origin + '/robots.txt'); robots.set(u.host, r ? r.teks : ''); }
  return robotsBolehkan(robots.get(u.host), u.pathname + u.search);
}

// ---------- nama wilayah -> provinsi ----------
const ADM1 = Object.keys(PUSAT.adm1);
const ALIAS = { 'special capital region of jakarta': 'DKI Jakarta', 'daerah khusus ibukota jakarta': 'DKI Jakarta', 'jakarta': 'DKI Jakarta', 'special region of yogyakarta': 'DI Yogyakarta', 'daerah istimewa yogyakarta': 'DI Yogyakarta', 'yogyakarta': 'DI Yogyakarta', 'bangka belitung islands': 'Kepulauan Bangka Belitung', 'bangka belitung': 'Kepulauan Bangka Belitung', 'riau islands': 'Kepulauan Riau', 'west java': 'Jawa Barat', 'central java': 'Jawa Tengah', 'east java': 'Jawa Timur', 'north sumatra': 'Sumatera Utara', 'west sumatra': 'Sumatera Barat', 'south sumatra': 'Sumatera Selatan', 'east kalimantan': 'Kalimantan Timur', 'south sulawesi': 'Sulawesi Selatan', 'north sulawesi': 'Sulawesi Utara', 'west nusa tenggara': 'Nusa Tenggara Barat', 'east nusa tenggara': 'Nusa Tenggara Timur', 'south kalimantan': 'Kalimantan Selatan', 'west kalimantan': 'Kalimantan Barat', 'central kalimantan': 'Kalimantan Tengah', 'north kalimantan': 'Kalimantan Utara', 'central sulawesi': 'Sulawesi Tengah', 'southeast sulawesi': 'Sulawesi Tenggara', 'west sulawesi': 'Sulawesi Barat', 'north maluku': 'Maluku Utara', 'west papua': 'Papua Barat' };
export function provinsiDari(teks) {
  const t = norm(teks); if (!t) return null;
  for (const k of ADM1) if (norm(k) === t) return k;
  return ALIAS[t] || null;
}
// satu-satunya kota/provinsi yang disebut dalam potongan alamat; ambigu/nol = null
export function wilayahDariAlamat(alamat) {
  const t = ' ' + norm(alamat) + ' ';
  if (/ jakarta /.test(t)) return { kota: 'Jakarta', provinsi: 'DKI Jakarta' };
  const kota = PUSAT.adm2.filter((x) => x.nama.length >= 5 && !/^(barat|timur|utara|selatan|tengah)/.test(x.nama) && t.includes(' ' + x.nama + ' '));
  const nm = [...new Set(kota.map((k) => k.nama))];
  if (nm.length === 1 && new Set(kota.map((k) => k.provinsi)).size === 1) return { kota: kota.find((k) => k.tipe === 'kota')?.asli || kota[0].asli, provinsi: kota[0].provinsi };
  const pv = ADM1.filter((k) => !['Papua', 'Papua Barat'].includes(k) && t.includes(' ' + norm(k) + ' '));
  return pv.length === 1 ? { kota: null, provinsi: pv[0] } : null;
}
const strip = (h) => h.replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ').replace(/<br\s*\/?>|<\/(p|div|li|address|h\d)>/gi, '\n').replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&').replace(/[ \t]+/g, ' ');
export function alamatDariHtml(html) {
  const baris = strip(html).split('\n').map((s) => s.trim()).filter(Boolean);
  for (let i = 0; i < baris.length; i++) if (/\b(jl\.?|jalan|gedung|menara|kawasan)\b/i.test(baris[i]) && baris[i].length < 240) {
    const w = wilayahDariAlamat(baris.slice(i, i + 3).join(' ').slice(0, 300)); if (w) return { ...w, alamat: baris[i].slice(0, 160) };
  }
  return null;
}

// ---------- Wikidata P159 ----------
const api = async (p) => { const r = await ambil('https://www.wikidata.org/w/api.php?' + new URLSearchParams({ format: 'json', ...p }), 'application/json'); try { return r ? JSON.parse(r.teks) : null; } catch { return null; } };
const bersih = (s) => norm(String(s).replace(/\([^)]*\)/g, ' ')).replace(/\b(pt|tbk|persero|cv|perum|perseroan|terbuka)\b/g, ' ').replace(/\s+/g, ' ').trim();
async function dariWikidata(o) {
  const nama = bersih(o.nama); if (nama.length < 4) return null;
  const s = await api({ action: 'wbsearchentities', search: String(o.nama).replace(/\([^)]*\)/g, '').replace(/^PT\.?\s+/i, '').trim(), language: 'id', uselang: 'id', limit: '6', type: 'item' });
  const cocok = (s?.search || []).filter((e) => [e.label, ...(e.aliases || []), e.match?.text].filter(Boolean).some((x) => bersih(x) === nama));
  if (cocok.length !== 1) return null; // ambigu = lewati
  const e = await api({ action: 'wbgetentities', ids: cocok[0].id, props: 'claims' });
  const hq = e?.entities?.[cocok[0].id]?.claims?.P159?.[0]?.mainsnak?.datavalue?.value?.id; if (!hq) return null;
  let id = hq, kota = null;
  for (let hop = 0; hop < 4 && id; hop++) {
    const g = await api({ action: 'wbgetentities', ids: id, props: 'labels|claims', languages: 'id|en' });
    const x = g?.entities?.[id]; if (!x) return null;
    const lab = x.labels?.id?.value || x.labels?.en?.value;
    if (hop === 0) kota = lab;
    const pv = provinsiDari(lab); if (pv) return { kota: pv === lab || provinsiDari(kota) ? null : kota, provinsi: pv, qid: cocok[0].id };
    id = x.claims?.P131?.[0]?.mainsnak?.datavalue?.value?.id;
  }
  return null;
}

// ---------- jalan ----------
function muatOrg() {
  const m = new Map();
  for (const l of ['publik', 'anggota', 'pengurus']) for (const o of JSON.parse(fs.readFileSync(path.join(ROOT, `data-panen/potret/${l}/organisasi.json`), 'utf8')).baris) m.set(o.id, { ...(m.get(o.id) || {}), ...o });
  return [...m.values()].filter((o) => !o.lokasi?.provinsi && o.kategori?.kode !== 'internasional');
}
const arg = process.argv[2];
if (arg === '--selftest') {
  assert.equal(provinsiDari('West Java'), 'Jawa Barat'); assert.equal(provinsiDari('Daerah Khusus Ibukota Jakarta'), 'DKI Jakarta');
  assert.deepEqual(wilayahDariAlamat('Jl. Sudirman Kav 5, Jakarta Selatan'), { kota: 'Jakarta', provinsi: 'DKI Jakarta' });
  assert.equal(wilayahDariAlamat('Jl. Mawar 1 Surabaya Malang'), null); // dua kota = ambigu
  assert.equal(alamatDariHtml('<p>Kantor</p><p>Jl. Ahmad Yani 10, Kota Bandung, Jawa Barat</p>').provinsi, 'Jawa Barat');
  console.log('selftest ok');
} else if (arg === '--situs' || arg === '--wikidata') {
  const hasil = fs.existsSync(KELUAR) ? JSON.parse(fs.readFileSync(KELUAR, 'utf8')) : { _catatan: 'Kantor pusat organisasi hasil scripts/pipa/lokasi_org.mjs. Dibaca potret.mjs; tidak menimpa lokasi yang sudah ada. presisi dihitung potret dari kota/provinsi.', baris: {} };
  const simpan = () => fs.writeFileSync(KELUAR, JSON.stringify(hasil, null, 1) + '\n', 'utf8');
  const daftar = muatOrg().filter((o) => !hasil.baris[o.id] && (arg === '--wikidata' || o.situs));
  console.log('kandidat', daftar.length);
  for (const o of daftar) {
    let h = null;
    if (arg === '--wikidata') { const w = await dariWikidata(o); if (w) h = { kota: w.kota, provinsi: w.provinsi, sumber_url: 'https://www.wikidata.org/wiki/' + w.qid, jenis: 'wikidata-P159', tingkat_bukti: 'media' }; }
    else {
      const origin = new URL(o.situs).origin;
      for (const j of ['/', '/kontak', '/contact', '/contact-us', '/hubungi-kami', '/kontak-kami', '/tentang-kami', '/about']) {
        if (!(await boleh(origin + j))) continue;
        const r = await ambil(origin + j, 'text/html'); if (!r) { if (j === '/') break; continue; }
        const a = alamatDariHtml(r.teks); if (a) { h = { kota: a.kota, provinsi: a.provinsi, alamat: a.alamat, sumber_url: r.url, jenis: 'situs-resmi', tingkat_bukti: 'situs-sendiri' }; break; }
      }
    }
    if (h) { hasil.baris[o.id] = { nama: o.nama, ...h, tanggal: tgl() }; simpan(); console.log(o.id, o.nama, '->', h.kota, h.provinsi); }
  }
  simpan(); console.log('selesai', Object.keys(hasil.baris).length);
} else console.log('pakai --situs | --wikidata | --selftest');
