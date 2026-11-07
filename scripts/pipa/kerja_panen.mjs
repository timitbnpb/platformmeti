#!/usr/bin/env node
// Panen lowongan EBT dari halaman karir RESMI organisasi (public/data/organisasi.json -> situs). Hanya HTML publik / JSON-LD JobPosting.
// Dilarang: LinkedIn, Jobstreet, medsos, login, CAPTCHA. Sopan: UA jujur, robots.txt, jeda >= 2 dtk, 403 = host berhenti, 429 = tunggu.
//   node scripts/pipa/kerja_panen.mjs --selftest
//   node scripts/pipa/kerja_panen.mjs [--maks=N] [--hanya=id1,id2]      -> menulis bagian `lowongan` + `periksa` di public/data/kerja.json
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { ambil } from './_panen_sopan.mjs';

const AKAR = fileURLToPath(new URL('../..', import.meta.url));
const OUT = AKAR + 'public/data/kerja.json';
const arg = (k) => (process.argv.find((a) => a.startsWith(k + '=')) || '').slice(k.length + 1);
const hariIni = () => new Date().toISOString().slice(0, 10);
const DILARANG = /(^|\.)(linkedin\.com|jobstreet\.[a-z.]+|glints\.com|kalibrr\.com|indeed\.com|facebook\.com|instagram\.com|twitter\.com|x\.com|tiktok\.com|youtube\.com|wa\.me|whatsapp\.com|t\.me)$/i;
const TAUT_KARIR = /karir|karier|career|lowongan|loker|\bjobs?\b|rekrut|recruit|join-us|bergabung/i;

export const unent = (s) => String(s).replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const bersih = (s) => unent(String(s ?? '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

// Tautan karir dalam host yang sama (maks 2), dari teks atau href.
export function tautanKarir(html, dasar) {
  const hasil = new Map();
  let host; try { host = new URL(dasar).host; } catch { return []; }
  for (const m of String(html).matchAll(/<a\b[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    let u; try { u = new URL(unent(m[1]), dasar); } catch { continue; }
    if (!/^https?:$/.test(u.protocol) || DILARANG.test(u.hostname)) continue;
    const sama = u.host === host || u.host.endsWith('.' + host.replace(/^www\./, ''));
    if (!sama || !(TAUT_KARIR.test(u.pathname) || TAUT_KARIR.test(bersih(m[2])))) continue;
    if (/\.(pdf|docx?|jpe?g|png|zip)$/i.test(u.pathname)) continue;
    hasil.set(u.origin + u.pathname + u.search, 1);
  }
  return [...hasil.keys()].slice(0, 2);
}

// JSON-LD JobPosting (objek, larik, atau @graph).
export function jobPostings(html) {
  const keluar = [];
  const telusur = (n) => {
    if (!n || typeof n !== 'object') return;
    if (Array.isArray(n)) return n.forEach(telusur);
    const tipe = [].concat(n['@type'] ?? []);
    if (tipe.includes('JobPosting')) keluar.push(n);
    if (n['@graph']) telusur(n['@graph']);
  };
  for (const m of String(html).matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try { telusur(JSON.parse(m[1].trim())); } catch { /* JSON-LD rusak: lewati */ }
  }
  return keluar;
}

const PROV = {
  11: 'aceh', 12: 'sumatera utara', 13: 'sumatera barat', 14: 'riau', 15: 'jambi', 16: 'sumatera selatan', 17: 'bengkulu', 18: 'lampung', 19: 'bangka belitung', 21: 'kepulauan riau',
  31: 'jakarta', 32: 'jawa barat', 33: 'jawa tengah', 34: 'yogyakarta', 35: 'jawa timur', 36: 'banten', 51: 'bali', 52: 'nusa tenggara barat', 53: 'nusa tenggara timur',
  61: 'kalimantan barat', 62: 'kalimantan tengah', 63: 'kalimantan selatan', 64: 'kalimantan timur', 65: 'kalimantan utara', 71: 'sulawesi utara', 72: 'sulawesi tengah', 73: 'sulawesi selatan',
  74: 'sulawesi tenggara', 75: 'gorontalo', 76: 'sulawesi barat', 81: 'maluku', 82: 'maluku utara', 91: 'papua', 92: 'papua barat', 93: 'papua selatan', 94: 'papua tengah', 95: 'papua pegunungan', 96: 'papua barat daya',
};
const KOTA = { bandung: 32, bogor: 32, bekasi: 32, depok: 32, semarang: 33, surabaya: 35, malang: 35, tangerang: 36, medan: 12, palembang: 16, makassar: 73, balikpapan: 64, pekanbaru: 14, denpasar: 51, manado: 71, kupang: 53, jayapura: 91, ambon: 81, batam: 21, cilegon: 36, karawang: 32 };
export function kodeProvLokasi(teks) {
  const t = String(teks || '').toLowerCase();
  if (!t) return '';
  let terbaik = '';
  for (const [k, n] of Object.entries(PROV)) if (t.includes(n) && n.length > (PROV[terbaik]?.length || 0)) terbaik = k;
  if (terbaik) return terbaik;
  for (const [kota, k] of Object.entries(KOTA)) if (new RegExp('\\b' + kota + '\\b').test(t)) return String(k);
  return '';
}
export function jenjang(teks) {
  const t = String(teks || '').toLowerCase();
  if (/magang|intern(ship)?\b|trainee/.test(t)) return 'magang';
  if (/fresh ?graduate|entry|junior|pemula|staf muda|staff muda|associate/.test(t)) return 'pemula';
  if (/director|direktur|vice president|\bvp\b|general manager|kepala divisi|head of/.test(t)) return 'pimpinan';
  if (/senior|manager|manajer|lead|principal|supervisor|specialist|spesialis|expert/.test(t)) return 'senior';
  return 'menengah';
}
const TEK = { surya: /\b(solar|surya|photovoltaic|plts|pv)\b/, bayu: /\b(wind|angin|bayu|pltb)\b/, hidro: /\b(hydro|hidro|plta|pltm|mikrohidro)\b/, 'panas-bumi': /\b(geothermal|panas bumi|pltp)\b/, bioenergi: /\b(biomass|biomassa|bioenergi|biogas|biodiesel|bioetanol|bioethanol)\b/, 'biomassa-sampah': /\b(waste[- ]to[- ]energy|pltsa|sampah)\b/, penyimpanan: /\b(battery|baterai|bess|storage|penyimpanan)\b/, hidrogen: /\b(hydrogen|hidrogen|amonia|ammonia)\b/ };
export function teknologiDari(teks, bawaan) {
  const t = String(teks || '').toLowerCase();
  for (const [k, re] of Object.entries(TEK)) if (re.test(t)) return k;
  return bawaan || '';
}

// Satu JobPosting -> baris lowongan (null bila tak lengkap). Tautan wajib https dan bukan situs terlarang.
export function barisDari(jp, org, halaman) {
  const judul = bersih(jp.title).slice(0, 160);
  if (!judul) return null;
  let tautan = String(jp.url || jp.sameAs || halaman);
  try { tautan = new URL(tautan, halaman).href; } catch { tautan = halaman; }
  let u; try { u = new URL(tautan); } catch { return null; }
  if (u.protocol !== 'https:' || DILARANG.test(u.hostname)) return null;
  const lok = [].concat(jp.jobLocation ?? [])[0]?.address ?? {};
  const lokasiTeks = [lok.addressLocality, lok.addressRegion, lok.streetAddress].filter((x) => typeof x === 'string').join(' ');
  const tgl = String(jp.datePosted || '').slice(0, 10);
  const batas = String(jp.validThrough || '').slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(batas) && batas < hariIni()) return null; // sudah ditutup
  return {
    judul, organisasi_id: org.id, organisasi: org.nama,
    provinsi: kodeProvLokasi(lokasiTeks), lokasi: bersih(lokasiTeks).slice(0, 80) || null,
    teknologi: teknologiDari(judul + ' ' + bersih(jp.description).slice(0, 600), org.kepakaran?.[0]),
    jenjang: jenjang(judul + ' ' + (typeof jp.experienceRequirements === 'string' ? jp.experienceRequirements : '')),
    tanggal: /^\d{4}-\d{2}-\d{2}$/.test(tgl) ? tgl : null, batas: /^\d{4}-\d{2}-\d{2}$/.test(batas) ? batas : null,
    tautan: u.href, sumber_halaman: halaman,
  };
}

async function panen() {
  const org = JSON.parse(fs.readFileSync(AKAR + 'public/data/organisasi.json', 'utf8')).baris;
  const hanya = arg('--hanya') ? new Set(arg('--hanya').split(',')) : null;
  const maks = Number(arg('--maks')) || Infinity;
  const daftar = org.filter((o) => o.situs && o.kepakaran?.length && (!hanya || hanya.has(o.id))).slice(0, maks);
  const lowongan = [], stat = { situs: daftar.length, diperiksa: 0, halaman_karir: 0, dengan_lowongan: 0, gagal: 0 };
  for (const o of daftar) {
    try {
      const u = new URL(o.situs);
      if (u.protocol !== 'https:' && u.protocol !== 'http:') continue;
      stat.diperiksa++;
      const beranda = await ambil(u.href);
      const halaman = tautanKarir(beranda, u.href);
      if (halaman.length) stat.halaman_karir++;
      let ada = 0;
      for (const h of [u.href, ...halaman]) {
        const html = h === u.href ? beranda : await ambil(h);
        for (const jp of jobPostings(html)) { const b = barisDari(jp, o, h); if (b && !lowongan.some((x) => x.tautan === b.tautan && x.judul === b.judul)) { lowongan.push(b); ada++; } }
      }
      if (ada) stat.dengan_lowongan++;
    } catch (e) {
      stat.gagal++;
      console.error('lewati', o.id, String(e.message).slice(0, 80));
    }
  }
  let d = {}; try { d = JSON.parse(fs.readFileSync(OUT, 'utf8')); } catch { /* baru */ }
  d.lowongan = lowongan.sort((a, b) => (b.tanggal || '').localeCompare(a.tanggal || ''));
  d.periksa = { ...stat, tanggal: hariIni(), ua: 'METI-Network-research/0.1', keterangan: 'Hanya halaman karir resmi organisasi (JSON-LD JobPosting / HTML publik). Tanpa LinkedIn, Jobstreet, dan media sosial.' };
  fs.writeFileSync(OUT, JSON.stringify(d, null, 1) + '\n');
  console.log(JSON.stringify(stat), 'lowongan:', lowongan.length);
}

function selftest() {
  const html = '<a href="/id/karir">Karier</a><a href="https://www.linkedin.com/company/x/jobs">Jobs</a><a href="/tentang">Tentang</a><script type="application/ld+json">{"@graph":[{"@type":"JobPosting","title":"Senior Solar Engineer","datePosted":"2026-10-01","jobLocation":{"address":{"addressRegion":"Jawa Barat"}},"url":"https://x.co.id/j/1"}]}</script>';
  assert.deepEqual(tautanKarir(html, 'https://x.co.id/'), ['https://x.co.id/id/karir']);
  const [jp] = jobPostings(html);
  const b = barisDari(jp, { id: 'o1', nama: 'X', kepakaran: ['bayu'] }, 'https://x.co.id/id/karir');
  assert.equal(b.provinsi, '32'); assert.equal(b.teknologi, 'surya'); assert.equal(b.jenjang, 'senior'); assert.equal(b.tautan, 'https://x.co.id/j/1');
  assert.equal(barisDari({ title: 'A', url: 'https://www.linkedin.com/jobs/1' }, { id: 'o' }, 'https://x.co.id/'), null);
  assert.equal(barisDari({ title: 'A', validThrough: '2020-01-01' }, { id: 'o' }, 'https://x.co.id/'), null);
  assert.equal(jenjang('Magang PLTS'), 'magang');
  console.log('selftest ok');
}
if (process.argv.includes('--selftest')) selftest();
else if (process.argv[1] === fileURLToPath(import.meta.url)) panen().catch((e) => { console.error(e); process.exit(1); });
