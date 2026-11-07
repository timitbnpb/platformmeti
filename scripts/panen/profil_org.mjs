#!/usr/bin/env node
// Profil organisasi (swasta, BUMN, internasional, keuangan) dari situs resmi -> data/direktori/profil_org.json (dibaca potret.mjs).
//   node scripts/panen/profil_org.mjs --selftest
//   node scripts/panen/profil_org.mjs --ambil [--hanya=id,id] [--maks=N]   jaringan; cache data-panen/profil_org/<id>.json (resume: yang sudah ada dilewati)
//   node scripts/panen/profil_org.mjs --bangun <tanggal>                   tanpa jaringan; cache -> data/direktori/profil_org.json
// Sopan: robots.txt per host, jeda >= 2 dtk, UA METI, 403 = host berhenti, 429 = tunggu (lihat pipa/_panen_sopan.mjs). Tanpa login/formulir/medsos.
// Hanya fakta pendek berumber (angka, tahun, kontak kantor generik, tautan). Teks "tentang kami" TIDAK disalin: ringkasan disusun potret.mjs dari fakta terstruktur.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { ambil } from '../pipa/_panen_sopan.mjs';
import { suratKorporat } from '../pipa/potret.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CACHE = path.join(ROOT, 'data-panen/profil_org'), OUT = path.join(ROOT, 'data/direktori/profil_org.json');
const KAT = new Set(['asosiasi', 'bumn', 'kementerian-lembaga', 'perguruan-tinggi', 'think-tank', 'donor', 'lsm-yayasan', 'swasta', 'internasional', 'keuangan']);
const MAKS_HALAMAN = 6;
const POLA_HALAMAN = [['tentang', /about|tentang|profile|profil|company|perusahaan|who-we|siapa/i], ['keberlanjutan', /sustainab|keberlanjutan|esg|csr|environment|lingkungan|net-?zero/i], ['investor', /investor|hubungan-investor|shareholder|laporan-tahunan|annual-report/i], ['proyek', /project|proyek|portfolio|operations|business|bisnis|usaha/i], ['kontak', /contact|kontak|hubungi/i], ['manajemen', /management|manajemen|board|direksi|leader|pengurus|struktur|organization-structure/i], ['anggota', /member|anggota|keanggotaan/i], ['program', /program|kegiatan|event|agenda|acara/i]];

// ---------- murni, teruji ----------
export const teksDari = (h) => String(h).replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<noscript[\s\S]*?<\/noscript>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&').replace(/&#0?39;|&#8217;|&rsquo;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
const kalimat = (t) => t.split(/(?<=[.!?])\s+(?=[A-Z0-9])/).filter((s) => s.length > 20 && s.length < 600);
export function tautanHalaman(html, dasar) { // tautan internal bertema, satu per tema
  const hasil = new Map(); const host = new URL(dasar).host.replace(/^www\./, '');
  for (const m of html.matchAll(/<a\b[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]{0,120}?)<\/a>/gi)) {
    let u; try { u = new URL(m[1].replace(/&amp;/g, '&'), dasar); } catch { continue; }
    if (!/^https?:$/.test(u.protocol) || u.host.replace(/^www\./, '') !== host || /\.(pdf|jpe?g|png|zip|docx?|xlsx?)$/i.test(u.pathname) || u.pathname.length < 2) continue;
    const kunci = decodeURIComponent(u.pathname).toLowerCase() + ' ' + teksDari(m[2]).toLowerCase();
    for (const [tema, re] of POLA_HALAMAN) if (!hasil.has(tema) && re.test(kunci) && u.pathname.split('/').filter(Boolean).length <= 3) hasil.set(tema, u.origin + u.pathname + u.search);
  }
  return [...hasil].map(([tema, url]) => ({ tema, url }));
}
export function sosmedDari(html) { // tautan profil resmi saja; tautan bagikan/intent dibuang
  const out = []; const lihat = new Set();
  for (const m of html.matchAll(/href=["'](https?:\/\/(?:www\.)?(linkedin|facebook|instagram|twitter|x|youtube|tiktok)\.com\/[^"'\s]+)["']/gi)) {
    const u = m[1].replace(/&amp;/g, '&').replace(/[?#].*$/, '').replace(/\/$/, ''); const j = m[2].toLowerCase();
    if (/share|intent|sharer|login|plugins|dialog|hashtag|watch|embed|\/p\/|\/status\//i.test(u) || u.split('/').length < 4) continue;
    if (j === 'linkedin' && !/\/company\//.test(u)) continue;
    if (!lihat.has(j)) { lihat.add(j); out.push({ jenis: j === 'x' ? 'twitter' : j, url: u }); }
  }
  return out;
}
export function kontakDari(html) { // kantor saja: surel generik (info@, corsec@ ...) dan telepon tetap; ponsel dan surel pribadi dibuang
  const t = html.replace(/&#43;/g, '+'); const surel = new Set(), tel = new Set();
  for (const e of (t.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+/g) || [])) { const x = e.toLowerCase(); if (/\.(png|jpe?g|webp|svg|gif)$/.test(x)) continue; if (suratKorporat(x)) surel.add(x); }
  for (const m of t.matchAll(/(?:href=["']tel:([^"']+)["']|(?:Tel(?:p|epon|ephone)?|Phone|Telp)\.?\s*[:.]?\s*(\(?\+?\d[\d\s()\-]{7,20}\d))/gi)) {
    const n = (m[1] || m[2]).replace(/%20/g, ' ').replace(/[^\d+()\s-]/g, '').trim(); const d = n.replace(/\D/g, '');
    if (d.length < 8 || d.length > 14 || /^(\+?62|0)8/.test(d) || /^(\+?62)?8\d{9,}/.test(d)) continue; // ponsel (kontak pribadi) tidak diambil
    tel.add(n);
  }
  return { telepon: [...tel].slice(0, 3), surel: [...surel].slice(0, 3) };
}
export function faktaDari(teks) {
  const f = {}; const ks = kalimat(teks);
  const th = teks.match(/\b(?:didirikan|berdiri|founded|established|incorporated|pendirian)\b[^.]{0,70}?\b(1[89]\d\d|20[0-2]\d)\b/i); if (th) f.tahun_berdiri = Number(th[1]);
  const cap = [];
  for (const s of ks) {
    if (!/\b(MW|MWp|GW|GWp)\b/.test(s) || !/(terpasang|installed|capacity|kapasitas|pipeline|renewable|terbarukan|EBT|geothermal|panas bumi|solar|surya|hydro|PLT)/i.test(s)) continue;
    const m = s.match(/(\d[\d.,]*)\s*(MWp|MW|GWp|GW)\b/); if (!m) continue;
    let v = m[1]; v = /,\d{1,2}$/.test(v) ? v.replace(/\./g, '').replace(',', '.') : v.replace(/,/g, ''); let mw = Number(v); if (!Number.isFinite(mw) || mw <= 0) continue;
    if (/^G/.test(m[2])) mw *= 1000;
    cap.push({ mw, jenis: /pipeline|rencana|target|planned/i.test(s) ? 'pipeline' : /terpasang|installed|operasi|operating|commercial/i.test(s) ? 'terpasang' : 'tercatat', konteks: s.slice(0, 180) });
    if (cap.length >= 4) break;
  }
  if (cap.length) f.kapasitas = cap;
  for (const s of ks) { const m = s.match(/(net[- ]?zero|nol bersih|carbon neutral|netral karbon|emisi nol)[^.]{0,120}?\b(20[2-6]\d)\b|\b(20[2-6]\d)\b[^.]{0,80}?(net[- ]?zero|nol bersih|carbon neutral|netral karbon)/i); if (m) { f.net_zero = { tahun: Number(m[2] || m[3]), konteks: s.slice(0, 180) }; break; } }
  const iso = [...new Set((teks.match(/\bISO[\s/-]?(9001|14001|45001|50001|27001|37001|26000|17025)\b/gi) || []).map((x) => 'ISO ' + x.replace(/\D/g, '')))]; if (iso.length) f.sertifikasi = iso.slice(0, 6);
  const asoc = [...new Set((teks.match(/\b(AESI|METI|APROBI|APLSI|ASPERHI|ASPEBI|APAMSI|IPPEBT|EBTKE|KADIN|Indonesia Business Council for Sustainable Development)\b/g) || []))]; if (asoc.length) f.asosiasi_disebut = asoc.slice(0, 6);
  const ang = [...new Set((teks.match(/\bPT\.? [A-Z][A-Za-z&.-]+(?: [A-Z][A-Za-z&.-]+){0,4}(?: Tbk)?/g) || []).map((x) => x.replace(/\.$/, '')))]; if (ang.length >= 3) f.anggota_disebut = ang.slice(0, 80);
  const vi = teks.match(/\b(?:Visi|Vision)\b\s*[:\-]?\s*((?:[A-Z][^.]{25,220})\.)/); if (vi) f.visi = vi[1].slice(0, 220);
  const mi = teks.match(/\b(?:Misi|Mission)\b\s*[:\-]?\s*((?:[A-Z0-9][^.]{25,220})\.)/); if (mi) f.misi = mi[1].slice(0, 220);
  const al = teks.match(/\b(?:Jl\.|Jalan)\s[^|]{8,140}?\b\d{5}\b/); if (al) f.alamat = al[0].replace(/\s+/g, ' ').slice(0, 180);
  const AF = ['ISES', 'IRENA', 'SEforALL', 'World Energy Council', 'Global Solar Council', 'GWEC', 'International Hydropower Association', 'International Geothermal Association', 'World Bioenergy Association', 'REN21', 'ASEAN Centre for Energy', 'SolarPower Europe', 'APREA', 'IEA', 'WFES', 'CIGRE', 'IEEE'];
  const afl = AF.filter((a) => new RegExp('(?<![A-Za-z])' + a + '(?![A-Za-z])').test(teks)); if (afl.length) f.afiliasi_disebut = afl.slice(0, 8);
  const kar = teks.match(/(\d[\d.,]{2,})\s*(?:karyawan|pekerja|employees|staff|team members)\b/i); if (kar) { const n = Number(kar[1].replace(/[.,]/g, '')); if (n >= 10 && n < 500000) f.karyawan = n; }
  return f;
}
export function logoDari(html, dasar) {
  const og = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1] || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)?.[1];
  const ap = html.match(/<link[^>]+rel=["'](?:apple-touch-icon|icon)[^"']*["'][^>]+href=["']([^"']+)["']/i)?.[1];
  for (const c of [og && /logo/i.test(og) ? og : null, ap, og]) if (c) { try { return new URL(c.replace(/&amp;/g, '&'), dasar).href; } catch { /* rusak */ } }
  return null;
}
export function gabungHalaman(hal) { // hal: [{url,tema,fakta,kontak,sosmed,logo}] -> satu profil dengan sumber_url per fakta
  const p = { halaman: {}, sumber: [] };
  for (const h of hal) {
    p.sumber.push(h.url); p.halaman[h.tema] = h.url;
    const f = h.fakta || {};
    if (f.tahun_berdiri && !p.tahun_berdiri) p.tahun_berdiri = { nilai: f.tahun_berdiri, sumber_url: h.url };
    if (f.kapasitas) (p.kapasitas ||= []).push(...f.kapasitas.map((c) => ({ ...c, sumber_url: h.url })));
    if (f.net_zero && !p.net_zero) p.net_zero = { ...f.net_zero, sumber_url: h.url };
    if (f.sertifikasi) p.sertifikasi = [...new Set([...(p.sertifikasi || []), ...f.sertifikasi])];
    if (f.asosiasi_disebut) p.asosiasi = [...new Set([...(p.asosiasi || []), ...f.asosiasi_disebut])];
    if (f.anggota_disebut && h.tema === 'anggota') p.anggota_disebut = [...new Set([...(p.anggota_disebut || []), ...f.anggota_disebut])].slice(0, 80);
    if (f.visi && !p.visi) p.visi = { nilai: f.visi, sumber_url: h.url };
    if (f.misi && !p.misi) p.misi = { nilai: f.misi, sumber_url: h.url };
    if (f.alamat && !p.alamat) p.alamat = { nilai: f.alamat, sumber_url: h.url };
    if (f.afiliasi_disebut) p.afiliasi = { nama: [...new Set([...(p.afiliasi?.nama || []), ...f.afiliasi_disebut])], sumber_url: p.afiliasi?.sumber_url || h.url };
    if (f.karyawan && !p.karyawan) p.karyawan = { nilai: f.karyawan, sumber_url: h.url };
    if (h.kontak?.telepon?.length || h.kontak?.surel?.length) { p.kontak ||= { telepon: [], surel: [], sumber_url: h.url }; p.kontak.telepon = [...new Set([...p.kontak.telepon, ...h.kontak.telepon])].slice(0, 3); p.kontak.surel = [...new Set([...p.kontak.surel, ...h.kontak.surel])].slice(0, 3); }
    if (h.sosmed?.length && !p.sosmed) p.sosmed = h.sosmed.map((s) => ({ ...s, sumber_url: h.url }));
    if (h.logo && !p.logo_url) p.logo_url = h.logo;
  }
  if (p.kapasitas) { const lihat = new Set(); p.kapasitas = p.kapasitas.filter((c) => { const k = c.mw + c.jenis; if (lihat.has(k)) return false; lihat.add(k); return true; }).slice(0, 4); }
  if (!p.kontak) delete p.kontak; return p;
}

// ---------- jaringan ----------
const hariIni = () => new Date().toISOString().slice(0, 10);
const blok = new Set();
async function profilkan(o) {
  const dasar = o.situs; const host = new URL(dasar).host; if (blok.has(host)) return { blokir: true, galat: 'host diblokir sebelumnya' };
  const hal = []; let galat = null;
  const proses = async (url, tema) => {
    const html = await ambil(url); const teks = teksDari(html);
    hal.push({ url, tema, fakta: faktaDari(teks), kontak: kontakDari(html), sosmed: tema === 'beranda' ? sosmedDari(html) : [], logo: tema === 'beranda' ? logoDari(html, url) : null });
    return html;
  };
  try {
    const beranda = await proses(dasar, 'beranda');
    const tautan = tautanHalaman(beranda, dasar).slice(0, MAKS_HALAMAN - 1);
    for (const t of tautan) { try { await proses(t.url, t.tema); } catch (e) { if (/^403/.test(e.message)) throw e; } }
  } catch (e) { galat = e.message; if (/^403|429/.test(e.message)) blok.add(host); }
  if (!hal.length) return { galat, blokir: /^403/.test(galat || '') };
  return { diambil: hariIni(), profil: gabungHalaman(hal), galat: galat || undefined };
}
function sasaran() {
  const tamb = path.join(ROOT, 'data/direktori/asosiasi_tambahan.json');
  const org = [...JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/organisasi.json'), 'utf8')).baris, ...(fs.existsSync(tamb) ? JSON.parse(fs.readFileSync(tamb, 'utf8')).baris.map((b) => ({ ...b, kategori: { kode: b.kategori } })) : [])].filter((o) => KAT.has(o.kategori.kode) && /^https?:\/\//.test(o.situs || ''));
  const bobot = (o) => (o.kategori.kode === 'asosiasi' ? -1 : o.kategori.kode === 'bumn' ? 0 : ['kementerian-lembaga', 'perguruan-tinggi', 'think-tank'].includes(o.kategori.kode) ? 0.5 : o.kode_saham ? 1 : (o.peran_rantai || []).some((p) => /pengembang|IPP|EPC/i.test(p)) ? 2 : 3);
  return org.sort((a, b) => bobot(a) - bobot(b) || (a.id < b.id ? -1 : 1));
}
async function ambilSemua(arg) {
  fs.mkdirSync(CACHE, { recursive: true });
  const hanya = (arg.find((a) => a.startsWith('--hanya=')) || '').slice(8).split(',').filter(Boolean); const maks = Number((arg.find((a) => a.startsWith('--maks=')) || '').slice(7)) || 1e9;
  let n = 0; const blokirDaftar = [];
  for (const o of sasaran()) {
    if (hanya.length && !hanya.includes(o.id)) continue; if (n >= maks) break;
    const f = path.join(CACHE, o.id + '.json'); if (fs.existsSync(f)) continue;
    n++; const r = await profilkan(o); fs.writeFileSync(f, JSON.stringify({ id: o.id, nama: o.nama, situs: o.situs, ...r }));
    console.log(o.id, o.nama, r.profil ? 'ok ' + r.profil.sumber.length + ' hal' : 'GAGAL ' + r.galat); if (r.blokir) blokirDaftar.push(o.situs);
  }
  console.log('diproses', n, 'diblokir', blokirDaftar.join(' '));
}
function bangun(tanggal) {
  assert.match(String(tanggal || ''), /^\d{4}-\d{2}-\d{2}$/, 'tanggal wajib YYYY-MM-DD');
  const baris = {}; let gagal = 0;
  for (const f of fs.existsSync(CACHE) ? fs.readdirSync(CACHE).sort() : []) {
    const c = JSON.parse(fs.readFileSync(path.join(CACHE, f), 'utf8')); if (!c.profil) { gagal++; continue; }
    baris[c.id] = { ...c.profil, tanggal_periksa: c.diambil || tanggal };
  }
  const lama = fs.existsSync(OUT) ? Object.keys(JSON.parse(fs.readFileSync(OUT, 'utf8')).baris || {}).length : 0;
  if (lama && Object.keys(baris).length < lama * 0.8) throw new Error(`susut: ${Object.keys(baris).length} < 80% dari ${lama}; tidak menimpa`);
  fs.writeFileSync(OUT, JSON.stringify({ sumber: 'situs resmi tiap organisasi (beranda dan halaman tentang, keberlanjutan, investor, kontak)', diambil: tanggal, lisensi: 'fakta pendek berumber; teks sumber tidak disalin', baris }, null, 1) + '\n');
  console.log('ditulis', Object.keys(baris).length, 'profil;', gagal, 'cache tanpa hasil');
}
function selftest() {
  const h = `<a href="/en/about-us">About Us</a><a href="/sustainability/">Sustainability</a><a href="/contact">Contact</a><a href="https://other.com/about">x</a>
  <a href="https://www.linkedin.com/company/medco/">in</a><a href="https://www.facebook.com/sharer/sharer.php?u=1">s</a><a href="https://www.instagram.com/medco">ig</a>
  <a href="tel:+62 21 2995 3000">t</a> info@contoh.co.id budi.santoso@contoh.co.id <meta property="og:image" content="/img/logo-big.png">`;
  assert.deepEqual(tautanHalaman(h, 'https://www.contoh.co.id').map((x) => x.tema), ['tentang', 'keberlanjutan', 'kontak']);
  assert.deepEqual(sosmedDari(h).map((x) => x.jenis), ['linkedin', 'instagram']);
  assert.deepEqual(kontakDari(h), { telepon: ['+62 21 2995 3000'], surel: ['info@contoh.co.id'] });
  assert.equal(kontakDari('Phone: 0812 3456 7890').telepon.length, 0);
  assert.equal(logoDari(h, 'https://www.contoh.co.id'), 'https://www.contoh.co.id/img/logo-big.png');
  const f = faktaDari('Perusahaan didirikan pada tahun 1980 di Jakarta. Kapasitas terpasang PLTS kami mencapai 1,5 GW pada akhir tahun lalu. Kami menargetkan net zero emission pada 2050 untuk semua operasi. Bersertifikat ISO 14001 dan ISO 45001. Anggota AESI.');
  assert.equal(f.tahun_berdiri, 1980); assert.equal(f.kapasitas[0].mw, 1500); assert.equal(f.kapasitas[0].jenis, 'terpasang'); assert.equal(f.net_zero.tahun, 2050); assert.deepEqual(f.sertifikasi, ['ISO 14001', 'ISO 45001']); assert.deepEqual(f.asosiasi_disebut, ['AESI']);
  const p = gabungHalaman([{ url: 'https://a.id', tema: 'beranda', fakta: f, kontak: { telepon: [], surel: [] }, sosmed: [], logo: null }, { url: 'https://a.id/k', tema: 'kontak', fakta: {}, kontak: { telepon: ['+62 21 1'], surel: [] } }]);
  assert.equal(p.tahun_berdiri.sumber_url, 'https://a.id'); assert.equal(p.kontak.sumber_url, 'https://a.id/k');
  console.log('selftest ok');
}
const arg = process.argv.slice(2);
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (arg.includes('--selftest')) selftest(); else if (arg.includes('--ambil')) await ambilSemua(arg); else if (arg.includes('--bangun')) bangun(arg[arg.indexOf('--bangun') + 1]); else console.log('pakai: --selftest | --ambil | --bangun <tanggal>');
}
