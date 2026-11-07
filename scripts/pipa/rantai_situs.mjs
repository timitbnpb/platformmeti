#!/usr/bin/env node
// Cari situs resmi pemasok rantai: coba domain turunan nama (+ kandidat manual), terima hanya bila beranda memuat nama perusahaan.
//   node scripts/pipa/rantai_situs.mjs --cari [--hanya=sub]   -> data/rantai/situs.json {norm_nama: {nama, situs, diverifikasi}}
//   node scripts/pipa/rantai_situs.mjs --selftest
// Nama dikenali dari data/rantai/nama_pemasok.json (dibuat rantai_teknologi.mjs --nama). Sopan: robots, jeda 2 dtk per host (ambil() global >= 2 dtk), UA METI.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { ambil } from './_panen_sopan.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const BAGIAN = (process.argv.find((x) => x.startsWith('--bagian=')) || '').slice(9).split('/').map(Number); // i/n: bagi nama ke n proses (jeda 2 dtk berlaku per proses, host berbeda)
const OUT = path.join(ROOT, 'data/rantai/situs.json'), OUT_BAG = BAGIAN[1] ? path.join(ROOT, `data/rantai/situs_${BAGIAN[0]}.json`) : OUT;
export const norm = (s) => String(s || '').toLowerCase().replace(/\([^)]*\)/g, ' ').replace(/\b(pt|tbk|persero|cv|perseroda|ud)\b/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim();
const UMUM = new Set(['indonesia', 'industri', 'industries', 'utama', 'jaya', 'mandiri', 'abadi', 'sejahtera', 'nusantara', 'teknik', 'energi', 'energy', 'tbk', 'international', 'internasional', 'the', 'and', 'dan', 'prima', 'karya', 'sentosa', 'perkasa', 'sarana']);
export const inti = (n) => { const t = norm(n).split(' ').filter(Boolean); const k = t.filter((x) => !UMUM.has(x)); return (k.length ? k : t).slice(0, 2); };
// Kandidat domain dari nama; manual menimpa/menambah. Kunci manual = norm(nama).
export function domain(n) {
  const t = norm(n).split(' ').filter(Boolean), a = t.join(''), b = inti(n).join('');
  const dasar = [...new Set([a, b, inti(n)[0], t.slice(0, 2).join('')])].filter((x) => x.length >= 4);
  return dasar.flatMap((d) => [`https://www.${d}.co.id`, `https://www.${d}.com`, `https://${d}.co.id`, `https://${d}.com`, `https://www.${d}.id`]);
}
const MANUAL = JSON.parse(fs.existsSync(path.join(ROOT, 'data/rantai/situs_manual.json')) ? fs.readFileSync(path.join(ROOT, 'data/rantai/situs_manual.json'), 'utf8') : '{}'); // {norm: [url,...]}
export function cocok(teks, n, kunciManual, url = '') {
  const t = norm(teks.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' '));
  const k = kunciManual ? norm(kunciManual) : inti(n).join(' ');
  if (!kunciManual && /\.com\/?$/.test(url) && !t.includes('indonesia')) return false; // .com tebakan harus menyebut Indonesia
  return !!k && k.split(' ').every((w) => t.includes(w));
}
async function cari(hanya) {
  const daftar = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/rantai/nama_pemasok.json'), 'utf8'));
  const hasil = fs.existsSync(OUT_BAG) ? JSON.parse(fs.readFileSync(OUT_BAG, 'utf8')) : {};
  const lama = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};
  for (const [i, nama] of daftar.entries()) {
    if (BAGIAN[1] && i % BAGIAN[1] !== BAGIAN[0]) continue; if (lama[norm(nama)]?.dicoba) continue;
    const k = norm(nama); if (hanya && !k.includes(hanya)) continue;
    if (hasil[k]?.situs || hasil[k]?.dicoba === 'ya' && !MANUAL[k]) continue;
    const kand = [...(MANUAL[k] || []).map((x) => (typeof x === 'string' ? { url: x } : x)), ...(MANUAL[k] ? [] : domain(nama).map((url) => ({ url })))];
    let ok = null;
    for (const c of kand) {
      let h; try { h = await ambil(c.url); } catch (e) { if (/403/.test(e.message)) continue; continue; }
      if (h && cocok(h, nama, c.kunci, c.url)) { ok = c.url; break; }
    }
    hasil[k] = { nama, situs: ok, dicoba: 'ya', tanggal: process.env.TGL_PANEN || '2026-11-08' };
    console.log(ok ? 'OK ' : '-- ', nama, ok || '');
    fs.writeFileSync(OUT_BAG, JSON.stringify(hasil, null, 1));
  }
}
// Daftar masukan panen_logo.mjs --daftar: pemasok rantai_pasok.json tanpa logo, dengan situs dari situs.json / organisasi.json.
function daftarLogo() {
  const org = new Map(JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/organisasi.json'), 'utf8')).baris.map((o) => [o.id, o]));
  const situs = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};
  const sudah = new Set(fs.readdirSync(path.join(ROOT, 'public/img/logo/org')).map((f) => f.replace(/\.png$/, '')));
  const ada = new Map();
  for (const t of JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/rantai_pasok.json'), 'utf8')).teknologi) for (const k of t.komponen) for (const p of k.pemasok) {
    if (sudah.has(p.id) || sudah.has(p.org_id) || ada.has(p.id)) continue;
    ada.set(p.id, { id: p.id, nama: p.nama, situs: p.situs || org.get(p.org_id)?.situs || situs[norm(p.nama)]?.situs || null });
  }
  const l = [...ada.values()]; fs.mkdirSync(path.join(ROOT, 'data-panen/rantai'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'data-panen/rantai/logo_daftar.json'), JSON.stringify(l));
  console.log(l.length, 'tanpa logo,', l.filter((x) => x.situs).length, 'bersitus');
}
function selftest() {
  assert.deepEqual(inti('PT Sumi Indo Kabel Tbk'), ['sumi', 'indo']);
  assert.ok(domain('PT Voksel Electric Tbk').includes('https://www.voksel.co.id'));
  assert.ok(cocok('<title>Voksel Electric - kabel</title>', 'PT Voksel Electric Tbk'));
  assert.ok(!cocok('<title>Domain dijual</title>', 'PT Voksel Electric Tbk'));
  console.log('selftest ok');
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv[2] === '--selftest') selftest();
  else if (process.argv[2] === '--daftar') daftarLogo();
  else if (process.argv[2] === '--gabung') { const g = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {}; for (const f of fs.readdirSync(path.join(ROOT, 'data/rantai')).filter((x) => /^situs_\d+\.json$/.test(x))) Object.assign(g, JSON.parse(fs.readFileSync(path.join(ROOT, 'data/rantai', f), 'utf8'))); fs.writeFileSync(OUT, JSON.stringify(g, null, 1)); console.log(Object.keys(g).length, 'nama,', Object.values(g).filter((v) => v.situs).length, 'bersitus'); }
  else if (process.argv[2] === '--cari') await cari((process.argv.find((x) => x.startsWith('--hanya=')) || '').slice(8));
  else console.log('pakai: --cari [--hanya=sub] | --selftest');
}
