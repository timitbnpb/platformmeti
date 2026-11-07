#!/usr/bin/env node
// Panen profil 38 provinsi -> data-panen/wilayah/profil_provinsi.jsonl (satu baris per provinsi; tiap nilai membawa sumber, URL, tanggal).
//   node scripts/panen/panen_provinsi.mjs            lanjutkan (berkas mentah yang sudah ada dipakai ulang, jaringan hanya untuk yang belum)
//   node scripts/panen/panen_provinsi.mjs --ulang    ambil ulang semua halaman web
//   node scripts/panen/panen_provinsi.mjs --selftest
// Etiket: UA tetap, robots.txt dibaca dan dipatuhi (Disallow/Allow terpanjang untuk agen *), jeda >= 2 dtk per host, tanpa login/CAPTCHA.
// Wikidata/MediaWiki API TIDAK dipakai: robots.txt keduanya melarang /w/ dan Special: untuk agen *. Yang diambil hanya halaman artikel /wiki/<judul>.
// Sumber:
//   web   id.wikipedia.org (kotak info: ibu kota, luas, penduduk, kab/kota; tabel PDRB 2025, bersumber BPS; cadangan sampai BPS terbaca otomatis)
//   lokal Statistik Ketenagalistrikan 2024 (Tabel 9 desa berlistrik, Tabel 22 kapasitas per jenis) dan HEESI 2025 (Tabel 6.5.2 PLTP), teks di data-panen/wilayah/raw
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const MENTAH = path.join(ROOT, 'data-panen/wilayah/raw');
const KELUAR = path.join(ROOT, 'data-panen/wilayah/profil_provinsi.jsonl');
const UA = 'METI-Network-research/0.1 (+https://platformmeti.timitbnpb.workers.dev)';
const HARI = process.env.TANGGAL_BANGUN || new Date().toISOString().slice(0, 10);
const WIKI = 'https://id.wikipedia.org/wiki/';
const URL_STAT = 'https://gatrik.esdm.go.id/gatrik/gatrik-api//storage/migrasi/download_index/files/91fa8-buku-statistik-ketenagalistrikan-2024.pdf';
const URL_HEESI = 'https://www.esdm.go.id/assets/media/content/content-handbook-of-energy-and-economic-statistics-of-indonesia-2025.pdf';

/* ---------- nama ---------- */
export const kunci = (s) => String(s || '').toLowerCase().replace(/\bprovinsi\b|\bdaerah\b|\bkhusus\b|\bibukota\b/g, '').replace(/[^a-z]/g, '')
  .replace(/^(dkijakarta|jakarta)$/, 'jakarta').replace(/^(diyogyakarta|istimewayogyakarta)$/, 'yogyakarta').replace(/^kepulauanbangkabelitung$/, 'bangkabelitung');
const JUDUL = { 'DKI Jakarta': 'Jakarta', 'DI Yogyakarta': 'Daerah_Istimewa_Yogyakarta' };
const judulWiki = (n) => JUDUL[n] || n.replace(/ /g, '_');

/* ---------- angka format Indonesia ---------- */
export const angkaId = (s) => { const x = String(s).trim(); if (x === '-' || x === '') return 0; const v = Number(x.replace(/\./g, '').replace(',', '.')); return Number.isFinite(v) ? v : null; };

/* ---------- jaringan sopan ---------- */
const terakhir = new Map(), robots = new Map();
const tidur = (ms) => new Promise((r) => setTimeout(r, ms));
async function jeda(host) { const w = (terakhir.get(host) || 0) + 2100 - Date.now(); if (w > 0) await tidur(w); terakhir.set(host, Date.now()); }
export function bolehRobots(teks, jalur) {
  let berlaku = false, aturan = [];
  for (const g of String(teks).split('\n')) {
    const l = g.replace(/#.*/, '').trim(), i = l.indexOf(':'); if (i < 0) continue;
    const k = l.slice(0, i).trim().toLowerCase(), v = l.slice(i + 1).trim();
    if (k === 'user-agent') berlaku = v === '*';
    else if (berlaku && (k === 'allow' || k === 'disallow') && v) aturan.push([k, v]);
  }
  let terbaik = ['allow', ''];
  for (const [k, v] of aturan) if (jalur.startsWith(v.replace(/\*.*$/, '')) && v.length >= terbaik[1].length) terbaik = [k, v];
  return terbaik[0] === 'allow';
}
async function ambil(url) {
  const u = new URL(url);
  if (!robots.has(u.host)) { await jeda(u.host); const r = await fetch(u.origin + '/robots.txt', { headers: { 'user-agent': UA } }); robots.set(u.host, r.ok ? await r.text() : ''); }
  if (!bolehRobots(robots.get(u.host), u.pathname + u.search)) throw new Error('robots melarang ' + url);
  await jeda(u.host);
  const r = await fetch(url, { headers: { 'user-agent': UA, 'accept-language': 'id' }, redirect: 'follow' });
  if (!r.ok) throw new Error(r.status + ' ' + url);
  return r.text();
}
async function halaman(judul) {
  const f = path.join(MENTAH, 'wiki', judul.replace(/[^\w-]/g, '_') + '.html');
  if (fs.existsSync(f) && !process.argv.includes('--ulang')) return fs.readFileSync(f, 'utf8');
  const h = await ambil(WIKI + encodeURI(judul));
  fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, h);
  return h;
}

/* ---------- Wikipedia ---------- */
const polos = (h) => h.replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<sup[\s\S]*?<\/sup>/g, '').replace(/<[^>]+>/g, '|').replace(/&#160;|&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').replace(/(\|\s*)+/g, '|');
export function kotakInfo(html) {
  const i = html.indexOf('class="infobox'); if (i < 0) return null;
  const b = html.slice(i, html.indexOf('</table>', i));
  const baris = (b.match(/<tr[\s\S]*?<\/tr>/g) || []).map(polos);
  const cari = (re, dari = 0) => { for (let k = dari; k < baris.length; k++) if (re.test(baris[k])) return [baris[k], k]; return [null, -1]; };
  const num = (s) => (s ? angkaId(s) : null);
  const [ib] = cari(/^\|?Ibu kota\|/), [jml] = cari(/^\|?Jumlah satuan pemerintahan/);
  const [luasT, kl] = cari(/^\|?Luas\|/), [tot] = kl >= 0 ? cari(/^\|?•\|Total\|/, kl) : [null];
  const [pop, kp] = cari(/^\|?Populasi\|/), [popT] = kp >= 0 ? cari(/^\|?•\|Total\|/, kp) : [null];
  const thn = pop && pop.match(/(\d{4})/);
  return {
    ibu_kota: ib ? ib.replace(/^\|?Ibu kota\|/, '').split('|')[0].replace(/^Kota\s+/, '').trim() : null,
    kabupaten: jml && jml.match(/Kabupaten:\s*(\d+)/) ? Number(jml.match(/Kabupaten:\s*(\d+)/)[1]) : null,
    kota: jml && jml.match(/Kota:\s*(\d+)/) ? Number(jml.match(/Kota:\s*(\d+)/)[1]) : null,
    luas_km2: tot ? num((tot.match(/Total\|([\d.,]+)/) || [])[1]) : (luasT ? num((luasT.match(/Luas\|([\d.,]+)/) || [])[1]) : null),
    penduduk: popT ? num((popT.match(/Total\|([\d.,]+)/) || [])[1]) : null,
    penduduk_tahun: thn ? Number(thn[1]) : null,
  };
}
export function tabelPdrb(html) {
  const i = html.indexOf('id="PDRB_tahun_2025"'); if (i < 0) return {};
  const tbl = html.slice(i, html.indexOf('</table>', i)), out = {};
  for (const r of tbl.match(/<tr[\s\S]*?<\/tr>/g) || []) {
    const c = (r.match(/<t[dh][\s\S]*?<\/t[dh]>/g) || []).map((x) => polos(x).replace(/\|/g, '').trim());
    if (c.length >= 3 && /^\d+$/.test(c[0])) out[kunci(c[1])] = { peringkat: Number(c[0]), triliun: angkaId(c[2]) };
  }
  return out;
}

/* ---------- teks lokal (PDF -> txt) ---------- */
const baca = (n) => fs.readFileSync(path.join(MENTAH, n), 'utf8').split('\n');
export function desaBerlistrik(baris) {
  const out = {}, awal = baris.findIndex((l) => /LISTRIK PEDESAAN/.test(l)), tabel = baris.slice(Math.max(0, awal - 40), awal + 80);
  for (const l of tabel) {
    const m = l.match(/\b(\d{1,2})\s{2,}([A-Za-z][A-Za-z. ]+?)\s{2,}([\d.]+|-)\s+([\d.]+|-)\s+([\d.]+)\s+(\d{2,3},\d{2})\s*$/);
    if (m) out[kunci(m[2])] = { pln: angkaId(m[3]), non_pln: angkaId(m[4]), jumlah: angkaId(m[5]), persen: angkaId(m[6]) };
  }
  return out;
}
const JENIS = ['pltu', 'pltg', 'pltd', 'plta', 'pltb', 'plt_bio', 'pltp', 'plts', 'pltgb', 'plt_lain'];
export function kapasitasJenis(baris) {
  const awal = baris.findIndex((l) => /^Tabel 22\s*$/.test(l.trim())), out = {};
  for (const l of baris.slice(awal, awal + 70)) {
    const m = l.match(/^\s*(\d{1,2})\s+([A-Za-z][A-Za-z. ]*?)\s{2,}(.+)$/); if (!m) continue;
    const t = m[3].trim().split(/\s+/);
    if (t.length < 10 || !t.slice(0, 10).every((x) => /^(-|[\d.]+)$/.test(x))) continue;
    const mw = Object.fromEntries(JENIS.map((j, i) => [j, angkaId(t[i])]));
    out[kunci(m[2])] = mw;
  }
  return out;
}
export function pltpBeroperasi(baris) {
  const awal = baris.findIndex((l) => /^6\.5\.2 Geothermal Power Plant Capacity 2025/.test(l)), out = {};
  const sampai = baris.findIndex((l, i) => i > awal + 5 && /^6\.5\.3 /.test(l));
  for (const l of baris.slice(awal, sampai > 0 ? sampai : awal + 300)) {
    const m = l.match(/^\s+(\d{2})\s+([A-Za-z][A-Za-z ]+?)\s{2,}(PLTP [^\s].*?)\s{2,}(PT .+)$/); if (!m) continue;
    (out[m[1]] ||= []).push({ nama: m[3].trim(), pemilik: m[4].trim() });
  }
  return out;
}

/* ---------- gabung ---------- */
const sumberWeb = (judul, ket) => ({ sumber: 'Wikipedia bahasa Indonesia, artikel ' + judul.replace(/_/g, ' ') + (ket ? ', ' + ket : ''), url: WIKI + encodeURI(judul), tanggal: HARI, tingkat_bukti: 'via-pihak-ketiga' });

async function main() {
  const prov = fs.readFileSync(path.join(ROOT, 'data-panen/wilayah/provinsi.jsonl'), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
  const sudah = new Map(fs.existsSync(KELUAR) && !process.argv.includes('--ulang') ? fs.readFileSync(KELUAR, 'utf8').split('\n').filter(Boolean).map((l) => { const o = JSON.parse(l); return [o.kode, o]; }) : []);
  const stat = baca('statgatrik-2024.txt'), hee = baca('heesi-2025.txt');
  const desa = desaBerlistrik(stat), kap = kapasitasJenis(stat), pltp = pltpBeroperasi(hee);
  let pdrb = {};
  try { pdrb = tabelPdrb(await halaman('Daftar_provinsi_di_Indonesia_menurut_PDRB')); } catch (e) { console.warn('PDRB:', e.message); }
  const gagal = [];
  for (const p of prov) {
    const kode = String(p.kode), k = kunci(p.nama);
    if (sudah.has(kode) && sudah.get(kode).identitas?.ibu_kota) continue;
    const judul = judulWiki(p.nama);
    let info = null;
    try { info = kotakInfo(await halaman(judul)); } catch (e) { gagal.push([p.nama, e.message]); console.warn(p.nama, e.message); }
    const id = { ...(info || {}), sumber: info ? sumberWeb(judul, 'kotak info') : null };
    const pd = pdrb[k];
    id.pdrb = pd ? { triliun: pd.triliun, tahun: 2025, peringkat: pd.peringkat, ...sumberWeb('Daftar_provinsi_di_Indonesia_menurut_PDRB', 'tabel PDRB 2025, mengutip BPS') } : null;
    id.pdrb_per_kapita_juta = pd && id.penduduk ? Math.round((pd.triliun * 1e6) / id.penduduk * 10) / 10 : null; // dihitung: PDRB (juta Rp) / penduduk
    const jenis = kap[k] || null;
    const baris = {
      kode, nama: p.nama, diperbarui: HARI, identitas: id,
      listrik: {
        kapasitas_jenis_mw: jenis ? { ...jenis, total: Object.values(jenis).reduce((s, v) => s + (v || 0), 0), tahun: 2024, sumber: 'Statistik Ketenagalistrikan 2024, Ditjen Ketenagalistrikan ESDM', halaman: 'Tabel 22 hlm 22 (kapasitas terpasang semua pemilik, dibulatkan MW)', url: URL_STAT, tanggal: HARI, tingkat_bukti: 'resmi' } : null,
        desa_berlistrik: desa[k] ? { ...desa[k], tahun: 2024, sumber: 'Statistik Ketenagalistrikan 2024, Ditjen Ketenagalistrikan ESDM', halaman: 'Tabel 9 hlm 10', url: URL_STAT, tanggal: HARI, tingkat_bukti: 'resmi' } : null,
        pltp: (pltp[String(p.kode)] || []).length ? { daftar: pltp[String(p.kode)], sumber: 'HEESI 2025, Kementerian ESDM', halaman: 'Tabel 6.5.2', url: URL_HEESI, tanggal: HARI, tingkat_bukti: 'resmi' } : null,
      },
    };
    sudah.set(kode, baris);
    fs.writeFileSync(KELUAR, prov.filter((x) => sudah.has(String(x.kode))).map((x) => JSON.stringify(sudah.get(String(x.kode)))).join('\n') + '\n'); // simpan tiap provinsi: bisa dilanjutkan
    console.log(kode, p.nama, id.ibu_kota, id.penduduk, id.pdrb?.triliun, jenis ? 'kap' : '-', desa[k] ? 'desa' : '-');
  }
  console.log('selesai', sudah.size, 'provinsi; gagal', gagal.length);
}

if (process.argv.includes('--selftest')) {
  assert.equal(angkaId('3.906.041'), 3906041); assert.equal(angkaId('50.160,05'), 50160.05); assert.equal(angkaId('-'), 0);
  assert.equal(kunci('Kepulauan Bangka Belitung'), 'bangkabelitung'); assert.equal(kunci('Bangka Belitung'), 'bangkabelitung');
  assert.equal(kunci('D.I. Yogyakarta'), 'yogyakarta'); assert.equal(kunci('DKI Jakarta'), 'jakarta'); assert.equal(kunci('Kepulauan Riau'), 'kepulauanriau'); assert.equal(kunci('Daerah Istimewa Yogyakarta'), 'yogyakarta');
  assert.ok(bolehRobots('User-agent: *\nDisallow: /w/\nAllow: /w/load.php?', '/wiki/Jambi')); assert.ok(!bolehRobots('User-agent: *\nDisallow: /w/\nAllow: /w/load.php?', '/w/api.php'));
  console.log('selftest ok');
} else await main();
