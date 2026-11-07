#!/usr/bin/env node
// Panen situs resmi organisasi -> data-panen/situs/situs.jsonl (dibaca potret.mjs, ditambal ke organisasi).
//   node scripts/panen/panen_situs.mjs --selftest
//   node scripts/panen/panen_situs.mjs [--temukan] [--ambil] [--hanya=id1,id2] [--ulang]
// --temukan : organisasi tanpa situs -> tebak domain dari nama, TERIMA hanya bila halaman memuat nama + kata energi.
// --ambil   : beranda + 1 halaman kontak + 1 halaman tentang -> alamat, koordinat (embed peta), telepon kantor,
//             surel umum, deskripsi singkat (meta), tahun berdiri, bidang. Tingkat bukti: situs-sendiri (maks kata-pihak).
// Sopan: robots.txt per host, UA METI, jeda >= 2 dtk per host, timeout 8 dtk, 403/429 = host berhenti, tanpa login/CAPTCHA/formulir.
// Kontak: hanya telepon tetap kantor dan surel generik (info@, humas@ ...); ponsel dan surel personal dibuang.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { UA, robotsBolehkan, norm } from './berita.mjs';

const AKAR = fileURLToPath(new URL('../..', import.meta.url));
const DIR = AKAR + 'data-panen/situs/', RAW = DIR + 'raw/', HASIL = DIR + 'situs.jsonl';
const arg = (k) => (process.argv.find((a) => a.startsWith(k + '=')) || '').slice(k.length + 1);
const tidur = (ms) => new Promise((r) => setTimeout(r, ms));
const hariIni = () => new Date().toISOString().slice(0, 10);

// ---------- ekstraksi (murni, teruji) ----------
const unent = (s) => s.replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&#0?39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16))).replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n));
export const teksDari = (h) => unent(String(h).replace(/<(script|style|noscript|svg)[\s\S]*?<\/\1>/gi, ' ').replace(/<(br|\/p|\/div|\/li|\/h\d|\/tr)[^>]*>/gi, '\n').replace(/<[^>]+>/g, ' ')).replace(/[ \t ]+/g, ' ').replace(/\s*\n\s*/g, '\n');
export const meta = (h, nama) => { const m = h.match(new RegExp(`<meta[^>]+(?:name|property)=["']${nama}["'][^>]*>`, 'i')); const c = m && m[0].match(/content=["']([^"']*)["']/i); return c ? unent(c[1]).trim() : ''; };
export const judulDari = (h) => unent((String(h).match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [, ''])[1]).replace(/\s+/g, ' ').trim();
const SURAT_UMUM = /^(info|contact|contactus|hello|halo|humas|cs|corsec|corporate|office|sales|admin|marketing|secretariat|sekretariat|customer|customercare|support|ir|investor|inquiry|enquiry|general|press|media|cc|csr|procurement|hrd|recruitment|career|careers|service|layanan|pengaduan|kontak|email)([._-]?[a-z]*)$/i;
const SURAT_BEBAS = /@(gmail|yahoo|ymail|hotmail|outlook|live|icloud|proton|protonmail)\./i;
export function surelUmum(teks) {
  const out = new Set();
  for (const m of String(teks).matchAll(/[A-Za-z0-9._-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+/g)) {
    const e = m[0].replace(/\.$/, '').toLowerCase(); if (/\.(png|jpg|svg|webp|gif)$/.test(e) || SURAT_BEBAS.test(e)) continue;
    if (SURAT_UMUM.test(e.split('@')[0])) out.add(e);
  }
  return [...out].slice(0, 3);
}
export function teleponKantor(teks) { // telepon tetap saja (kode area / 0800 / 1500xxx); ponsel (08x, +628x) dibuang
  const out = new Set();
  for (const m of String(teks).matchAll(/(?:tel(?:p|epon|ephone)?|phone|call|hotline|office|kantor|t)\s*[.:)]?\s*[:.]?\s*(\+?62[\s.-]?\(?\d{2,3}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,5}|\(?0\d{2,3}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,5})/gi)) {
    const t = m[1].replace(/\s+/g, ' ').trim(); const d = t.replace(/\D/g, '');
    if (/^(0?8|628)/.test(d) || d.length < 8 || d.length > 13) continue;
    out.add(t);
  }
  return [...out].slice(0, 2);
}
const SAMPAH_ALAMAT = /narasumber|fasilitator|webinar|seminar|dr\.|psikolog|pendaftaran|\bdan\b.*\bdan\b.*\bdan\b/i;
export function alamatDari(teks) { // harus diawali Jl./Jalan (gedung/menara hanya bila memuat Jl.)
  const t = String(teks).replace(/\s+/g, ' ');
  for (const m of t.matchAll(/\b((?:Jl\.|Jalan|Gedung|Menara|Wisma|Kawasan|Graha|Plaza|Gd\.)\s[^|•]{12,170}?(?:\b\d{5}\b|Indonesia))/g)) {
    const a = m[1].replace(/\s+,/g, ',').replace(/\s+/g, ' ').trim();
    if (a.length <= 220 && /\b(Jl\.?|Jalan)\s/.test(a) && !SAMPAH_ALAMAT.test(a) && (a.match(/\b(Jl\.?|Jalan)\s/g) || []).length <= 2) return a;
  }
  return null;
}
export function koordinatDari(h) { // embed Google Maps: !2dLNG!3dLAT atau @LAT,LNG; hanya dalam kotak Indonesia
  const s = String(h);
  let m = s.match(/!2d(-?\d+\.\d+)!3d(-?\d+\.\d+)/); let lat, lng;
  if (m) { lng = +m[1]; lat = +m[2]; } else if ((m = s.match(/maps[^"']*@(-?\d+\.\d+),(-?\d+\.\d+)/))) { lat = +m[1]; lng = +m[2]; }
  return m && lat > -11.5 && lat < 6.5 && lng > 94 && lng < 141.5 ? { lat: +lat.toFixed(5), lng: +lng.toFixed(5) } : null;
}
export function tahunBerdiri(teks) {
  const m = String(teks).match(/(?:didirikan|berdiri|dibentuk|established|founded|incorporated)\D{0,40}?\b((?:19[3-9]|20[0-2])\d)\b/i);
  return m ? +m[1] : null;
}
const BIDANG = { surya: /\b(solar|surya|photovoltaic|PLTS)\b/gi, bayu: /\b(wind|angin|bayu|PLTB)\b/gi, hidro: /\b(hydro|hidro|PLTA|PLTM|mikrohidro|run-of-river)\b/gi, 'panas-bumi': /\b(geothermal|panas bumi|PLTP)\b/gi, bioenergi: /\b(biomass|biomassa|biogas|bioenergi|biofuel|biodiesel|bioethanol|PLTBm)\b/gi, 'biomassa-sampah': /\b(waste[- ]to[- ]energy|WtE|PLTSa|pengolahan sampah)\b/gi, penyimpanan: /\b(battery|baterai|energy storage|BESS)\b/gi };
export function bidangDari(teks) { // minimal 3 sebutan agar satu kata lewat tak menandai
  return Object.entries(BIDANG).map(([k, re]) => [k, (String(teks).match(re) || []).length]).filter(([, n]) => n >= 3).sort((a, b) => b[1] - a[1]).map(([k]) => k).slice(0, 3);
}
const JUNK_DESK = /silakan isi|lorem ipsum|tugas pokok|sejarah, tugas|^website (resmi|informasi)|official website|just another|selamat datang di website|cookie/i;
export function ringkasDeskripsi(h) { // meta description / og:description, dipotong di batas kalimat <= 200 karakter
  const d = (meta(h, 'og:description') || meta(h, 'description')).replace(/\s+/g, ' ').trim(); if (d.length < 40 || JUNK_DESK.test(d)) return null;
  if (d.length <= 200) return d;
  const k = d.slice(0, 200).replace(/[^.!?]*$/, '').trim(); return k.length >= 60 ? k : d.slice(0, 197).replace(/\s\S*$/, '') + '...';
}
const GENERIK = new Set(['pt', 'cv', 'tbk', 'persero', 'indonesia', 'nusantara', 'the', 'and', 'dan', 'of', 'group', 'grup', 'ltd', 'co', 'inc', 'corp', 'corporation', 'company', 'limited', 'perusahaan', 'tbk.']);
export const tokenKhas = (nama) => norm(nama).split(' ').filter((t) => t && !GENERIK.has(t));
export function kandidatDomain(nama) {
  const t = tokenKhas(nama); if (!t.length) return [];
  const gabung = t.join(''), dua = t.slice(0, 2).join(''), satu = t[0];
  const dasar = [...new Set([gabung, dua, satu.length >= 5 ? satu : null, t.length > 2 ? t.slice(0, 3).join('') : null].filter((x) => x && x.length >= 4))];
  return dasar.flatMap((d) => ['co.id', 'com', 'id'].map((s) => `https://${d}.${s}`)).slice(0, 9);
}
const KATA_ENERGI = /\b(solar|surya|energi|energy|power|listrik|electric|renewable|terbarukan|hydro|geothermal|biomass|wind|battery)\b/i;
export function cocokHalaman(nama, h, host = '') { // nama khas lengkap ada di judul/situs-nama/teks awal + kata energi + bukti keindonesiaan
  const t = tokenKhas(nama); if (!t.length) return false;
  const lokal = /\.id$/.test(host) || /\bindonesia\b/i.test(teksDari(h)); // domain .id atau halaman menyebut Indonesia
  if (!lokal || (t.length < 2 && !/\.id$/.test(host))) return false; // nama satu kata di domain umum terlalu ambigu
  const kepala = norm(judulDari(h) + ' ' + meta(h, 'og:site_name') + ' ' + meta(h, 'og:title') + ' ' + teksDari(h).slice(0, 3000));
  return t.every((x) => kepala.includes(x)) && KATA_ENERGI.test(judulDari(h) + ' ' + meta(h, 'description') + ' ' + teksDari(h).slice(0, 3000)) && !/domain (is )?for sale|dijual|parked|coming soon|under construction/i.test(kepala);
}
export function tautanKunci(h, asal) {
  const hasil = { kontak: null, tentang: null };
  for (const m of String(h).matchAll(/<a\b[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    let u; try { u = new URL(m[1], asal); } catch { continue; } if (u.host.replace(/^www\./, '') !== new URL(asal).host.replace(/^www\./, '') || !/^https?:$/.test(u.protocol)) continue;
    const s = (u.pathname + ' ' + m[2].replace(/<[^>]+>/g, ' ')).toLowerCase(); if (/\.(pdf|jpg|png|zip|docx?|xlsx?)(\?|$)/.test(u.pathname)) continue;
    if (!hasil.kontak && /kontak|contact|hubungi/.test(s)) hasil.kontak = u.href;
    else if (!hasil.tentang && /tentang|about|profil|profile|who-we-are|company/.test(s)) hasil.tentang = u.href;
  }
  return hasil;
}

// ---------- HTTP sopan ----------
const terakhir = new Map(), robots = new Map(), blok = new Set(), antre = new Map();
const gerbang = (host) => { const s = antre.get(host) || Promise.resolve(); const n = s.then(async () => { const w = (terakhir.get(host) || 0) + 2100 - Date.now(); if (w > 0) await tidur(w); terakhir.set(host, Date.now()); }); antre.set(host, n.catch(() => {})); return n; };
async function ambil(url, batas = 1_500_000) {
  const u = new URL(url); if (blok.has(u.host)) return null;
  await gerbang(u.host);
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'text/html,*/*;q=0.5' }, redirect: 'follow', signal: AbortSignal.timeout(8000) });
    if (r.status === 403 || r.status === 429) { blok.add(u.host); return null; }
    const ct = r.headers.get('content-type') || ''; if (!r.ok || (ct && !/html|text|xml/i.test(ct))) return { status: r.status, url: r.url, html: '' };
    const b = Buffer.from(await r.arrayBuffer()); return { status: r.status, url: r.url, html: b.length > batas ? '' : b.toString('utf8') };
  } catch { return null; }
}
async function boleh(url) {
  const u = new URL(url);
  if (!robots.has(u.host)) { const r = await ambil(u.origin + '/robots.txt'); robots.set(u.host, r && r.status === 200 && !/<html/i.test(r.html) ? r.html : ''); if (!r && blok.has(u.host)) return false; }
  return robotsBolehkan(robots.get(u.host), u.pathname + u.search);
}
const muat = async (url) => (await boleh(url)) ? ambil(url) : null;
const slug = (u) => new URL(u).host.replace(/[^a-z0-9]+/gi, '_') + '_' + (new URL(u).pathname.replace(/[^a-z0-9]+/gi, '_').slice(0, 40));
const simpan = (url, html) => { fs.mkdirSync(RAW, { recursive: true }); fs.writeFileSync(RAW + slug(url) + '.html', html.slice(0, 600_000)); };

async function temukan(o) {
  for (const c of kandidatDomain(o.nama)) {
    const host = new URL(c).host;
    try { await (await import('node:dns/promises')).lookup(host); } catch { continue; } // tak ada DNS: lewati tanpa permintaan HTTP
    const r = await muat(c + '/'); if (!r || r.status !== 200 || !r.html) continue;
    if (cocokHalaman(o.nama, r.html, new URL(r.url).host)) return new URL(r.url).origin + '/';
  }
  return null;
}
async function olah(o, situs) {
  const awal = await muat(situs); if (!awal || awal.status !== 200 || !awal.html) return { id: o.id, galat: awal ? 'http-' + awal.status : 'tak-terjangkau' };
  simpan(awal.url, awal.html);
  const tk = tautanKunci(awal.html, awal.url); const halaman = [{ url: awal.url, html: awal.html }];
  const urlTentang = tk.tentang || null; let urlKontak = tk.kontak;
  for (const [jenis, u] of [['kontak', urlKontak], ['tentang', urlTentang]]) {
    if (!u || halaman.some((x) => x.url === u)) continue;
    const r = await muat(u); if (r && r.status === 200 && r.html) { simpan(r.url, r.html); halaman.push({ url: r.url, html: r.html, jenis }); if (jenis === 'kontak') urlKontak = r.url; }
  }
  const semua = halaman.map((p) => p.html).join('\n'), teks = halaman.map((p) => teksDari(p.html)).join('\n');
  const kontakTeks = halaman.filter((p) => p.jenis === 'kontak').map((p) => teksDari(p.html)).join('\n') || teksDari(awal.html);
  const tentangHtml = (halaman.find((p) => p.jenis === 'tentang') || awal).html;
  const koor = koordinatDari(halaman.filter((p) => p.jenis === 'kontak').map((p) => p.html).join('\n') || awal.html);
  const baris = {
    id: o.id, nama: o.nama, situs: new URL(awal.url).origin + '/', sumber_url: urlKontak || awal.url, tanggal_ambil: hariIni(), tingkat_bukti: 'situs-sendiri',
    judul: judulDari(awal.html).slice(0, 120), deskripsi: ringkasDeskripsi(tentangHtml) || ringkasDeskripsi(awal.html), tahun_berdiri: tahunBerdiri(teks), bidang: bidangDari(teks),
    alamat: alamatDari(kontakTeks) || alamatDari(teks), telepon: teleponKantor(kontakTeks), surel: surelUmum(kontakTeks + ' ' + semua.replace(/mailto:/g, ' ')), ...(koor || {}),
  };
  return Object.fromEntries(Object.entries(baris).filter(([, v]) => v != null && !(Array.isArray(v) && !v.length) && v !== ''));
}

async function pool(items, n, fn) { const q = [...items]; await Promise.all(Array.from({ length: n }, async () => { for (let x; (x = q.shift());) await fn(x); })); }
const bacaJsonl = (f) => fs.existsSync(f) ? fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : [];

async function jalankan() {
  const org = JSON.parse(fs.readFileSync(AKAR + 'public/data/organisasi.json', 'utf8')).baris;
  const hanya = arg('--hanya') ? new Set(arg('--hanya').split(',')) : null, ulang = process.argv.includes('--ulang');
  fs.mkdirSync(DIR, { recursive: true });
  const hasil = new Map(bacaJsonl(HASIL).map((r) => [r.id, r])); const simpanSemua = () => fs.writeFileSync(HASIL, [...hasil.values()].sort((a, b) => (a.id < b.id ? -1 : 1)).map((r) => JSON.stringify(r)).join('\n') + '\n');
  const fDomain = DIR + 'domain.json'; const domain = fs.existsSync(fDomain) ? JSON.parse(fs.readFileSync(fDomain, 'utf8')) : {};
  const lingkup = org.filter((o) => !hanya || hanya.has(o.id));
  if (process.argv.includes('--temukan')) {
    const calon = lingkup.filter((o) => !o.situs && !(o.id in domain) && o.kategori.kode !== 'ormawa');
    console.log('temukan domain:', calon.length); let n = 0;
    await pool(calon, 10, async (o) => { domain[o.id] = await temukan(o); if (domain[o.id]) n++; fs.writeFileSync(fDomain, JSON.stringify(domain, null, 1)); });
    console.log('domain ditemukan:', n);
  }
  if (process.argv.includes('--saring')) { // periksa ulang domain tebakan lama dengan aturan terkini (pakai salinan beranda di raw/)
    let buang = 0;
    for (const [id, u] of Object.entries(domain)) {
      if (!u) continue; const f = RAW + slug(u) + '.html'; const o = org.find((x) => x.id === id);
      if (o && fs.existsSync(f) && cocokHalaman(o.nama, fs.readFileSync(f, 'utf8'), new URL(u).host)) continue;
      domain[id] = null; hasil.delete(id); buang++;
    }
    fs.writeFileSync(fDomain, JSON.stringify(domain, null, 1)); simpanSemua(); console.log('domain tebakan dibuang:', buang);
  }
  if (process.argv.includes('--ambil')) {
    const target = lingkup.map((o) => [o, o.situs || domain[o.id]]).filter(([o, s]) => s && (ulang || !hasil.has(o.id) || hasil.get(o.id).galat));
    console.log('ambil situs:', target.length); let ok = 0, gagal = 0;
    await pool(target, 10, async ([o, s]) => { const r = await olah(o, s); if (r.galat) { gagal++; hasil.set(o.id, { id: o.id, nama: o.nama, situs: s, galat: r.galat, tanggal_ambil: hariIni() }); } else { ok++; hasil.set(o.id, { ...r, ...(o.situs ? {} : { situs_ditemukan: true }) }); } simpanSemua(); });
    console.log('berhasil', ok, 'gagal', gagal, 'host diblok (403/429):', [...blok].join(',') || '-');
  }
}

function selftest() {
  assert.deepEqual(surelUmum('hubungi info@pln.co.id atau budi.santoso@pln.co.id dan sales@x.com, a@gmail.com'), ['info@pln.co.id', 'sales@x.com']);
  assert.deepEqual(teleponKantor('Telp: (021) 5201234 | Mobile 0812 3456 7890 | Tel. +62 21 7919 1234'), ['(021) 5201234', '+62 21 7919 1234']);
  assert.equal(alamatDari('Kantor kami\nJl. Gatot Subroto No. 44 Jakarta Selatan 12190 | Telp'), 'Jl. Gatot Subroto No. 44 Jakarta Selatan 12190');
  assert.deepEqual(koordinatDari('<iframe src="https://www.google.com/maps/embed?pb=!1m18!2d106.8!3d-6.2!2m3"></iframe>'), { lat: -6.2, lng: 106.8 });
  assert.equal(koordinatDari('!2d2.3!3d48.8'), null);
  assert.equal(alamatDari('Gedung Griya Legita Narasumber: Dr. Ratna Djuwita Kampus 12345'), null);
  assert.equal(tahunBerdiri('hak cipta sejak 2020'), null);
  assert.equal(tahunBerdiri('PT X didirikan pada tahun 2009 di Jakarta'), 2009);
  assert.deepEqual(bidangDari('solar solar surya wind'), ['surya']);
  assert.deepEqual(kandidatDomain('PT Csi Cleantech Solar Indonesia').slice(0, 3), ['https://csicleantechsolar.co.id', 'https://csicleantechsolar.com', 'https://csicleantechsolar.id']);
  assert.ok(cocokHalaman('PT Csi Cleantech Solar Indonesia', '<title>CSI Cleantech Solar</title><p>solar power Indonesia</p>'));
  assert.ok(!cocokHalaman('Agra', '<title>Agra solar</title><p>Indonesia</p>', 'agra.com'));
  assert.ok(!cocokHalaman('PT Agra Energi', '<title>Agra Travel</title><p>tiket pesawat</p>'));
  assert.equal(tautanKunci('<a href="/kontak-kami">Kontak</a><a href="/tentang-kami">Tentang</a><a href="https://lain.com/contact">x</a>', 'https://x.id/').kontak, 'https://x.id/kontak-kami');
  console.log('selftest panen_situs ok');
}
if (process.argv[1] === fileURLToPath(import.meta.url)) { if (process.argv.includes('--selftest')) selftest(); else jalankan(); }
