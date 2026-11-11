#!/usr/bin/env node
// Rangkaian pipa satu perintah (JM-T06): panen (bot) -> bangun -> sambung -> potret (hubung, skor) -> periksa -> salin.
//   node scripts/pipa/rangkai.mjs --jadwal harian|mingguan|bulanan|kuartalan|manual [--sumber=a,b] [--paksa] [--kering]
// Tidak menulis D1, tidak mengunggah R2 (itu unggah_potret.mjs, dijalankan koordinator). Satu langkah/sumber gagal tidak
// menggagalkan putaran; langkah turunan (sambung, potret, periksa, salin) berhenti bila pendahulunya gagal.
// Peta skrip dan pensiun: data/rangkai.json. Hasil: data/bot/rangkai.json dan data/bot/status.json (dibaca bot_pr.mjs).
import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { jalankan, scrub, bacaRegistri, validasiRegistri, bangunDenyut, JADWAL } from '../panen/_bot.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DIR_SKRIP = ['scripts/panen', 'scripts/pipa', 'scripts/direktori', 'scripts/mesin'];
const baca = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf-8'));

function semuaBerkas(d, hasil = []) {
  for (const e of fs.readdirSync(path.join(ROOT, d), { withFileTypes: true })) {
    const p = d + '/' + e.name;
    if (e.isDirectory()) semuaBerkas(p, hasil); else hasil.push(p);
  }
  return hasil;
}
// Skrip yatim = tidak dirujuk berkas lain di scripts/, tests/, .github/, src/, package.json.
export function cariYatim() {
  const teks = {};
  for (const d of ['scripts', 'tests', '.github', 'src']) if (fs.existsSync(path.join(ROOT, d))) for (const f of semuaBerkas(d)) if (/\.(mjs|js|py|yml|json|swift|sh)$/.test(f)) teks[f] = fs.readFileSync(path.join(ROOT, f), 'utf-8');
  teks['package.json'] = fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8');
  const kandidat = Object.keys(teks).filter((f) => DIR_SKRIP.some((d) => f.startsWith(d + '/')) && /\.(mjs|py)$/.test(f));
  return kandidat.filter((f) => {
    const b = path.basename(f), nm = b.replace(/\.(mjs|py)$/, '');
    return !Object.entries(teks).some(([g, t]) => g !== f && (t.includes(b) || t.includes('/' + nm + '.') || new RegExp(`['"]\\./${nm}(\\.mjs)?['"]`).test(t)));
  }).sort();
}
// Skrip yang sudah terpasang: peta rangkai.json (langkah + pensiun) dan registri sumber.
export function terpasang() {
  const rj = baca('data/rangkai.json'), s = new Set(Object.keys(rj.pensiun));
  for (const l of rj.langkah) for (const k of l.skrip) s.add(k.skrip);
  for (const x of bacaRegistri()) if (x.skrip) s.add(x.skrip);
  return s;
}

const lari = (skrip, args = [], kini, menit = 30) => new Promise((ok) => {
  const cmd = skrip.endsWith('.py') ? 'python3' : process.execPath;
  execFile(cmd, [path.join(ROOT, skrip), ...args], { cwd: ROOT, timeout: menit * 6e4, maxBuffer: 16e6, env: { ...process.env, TANGGAL_BANGUN: kini } }, (e, so, se) => ok({ kode: e ? (typeof e.code === 'number' ? e.code : 1) : 0, teks: scrub((se || so || (e && e.message) || '').trim().split('\n').slice(-2).join(' ')).slice(0, 300) }));
});

export async function rangkai({ jadwal, sumber, kini, paksa = false, kering = false, tulis = !kering, ada = (p) => fs.existsSync(path.join(ROOT, p)), lariFn = lari, panenFn = jalankan, log = console.log }) {
  const rj = baca('data/rangkai.json'), laporan = {};
  const panen = await panenFn({ jadwal, sumber, kini, paksa, kering, log });
  laporan.panen = { diproses: panen.hasil.length, gagal: panen.hasil.filter((h) => h.status === 'gagal').map((h) => h.kode), isu: panen.isu };
  if (tulis && !sumber?.length) { // salinan runtime tanpa rahasia untuk denyut Worker (T07)
    fs.writeFileSync(path.join(ROOT, 'public/data/sumber_denyut.json'), JSON.stringify({ sumber: bangunDenyut(bacaRegistri()) }, null, 1) + '\n', 'utf-8');
  }
  let rantaiPutus = false;
  for (const l of rj.langkah) {
    const turunan = l.id !== 'bangun';
    for (const k of l.skrip.filter((x) => x.jadwal.includes(jadwal))) {
      const kunci = l.id + ':' + path.basename(k.skrip) + (k.args ? ' ' + k.args.join(' ') : '');
      if (turunan && rantaiPutus) { laporan[kunci] = 'dilewati: langkah sebelumnya gagal'; continue; }
      const hilang = l.syarat.filter((p) => !ada(p));
      if (hilang.length) { laporan[kunci] = 'dilewati: masukan tidak ada (' + hilang.join(', ') + ')'; if (turunan) rantaiPutus = true; continue; }
      if (kering) { laporan[kunci] = 'akan dijalankan'; continue; }
      const r = await lariFn(k.skrip, k.args || [], kini);
      laporan[kunci] = scrub(r.kode === 0 ? 'ok' : `gagal exit ${r.kode}: ${r.teks}`);
      if (r.kode !== 0 && turunan) rantaiPutus = true;
      log(kunci + ' -> ' + laporan[kunci]);
    }
  }
  if (tulis) {
    fs.mkdirSync(path.join(ROOT, 'data/bot'), { recursive: true });
    fs.writeFileSync(path.join(ROOT, 'data/bot/rangkai.json'), scrub(JSON.stringify({ jadwal, tanggal: kini, laporan }, null, 2)) + '\n', 'utf-8');
  }
  return laporan;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const a = process.argv.slice(2), nilai = (k) => { const i = a.findIndex((x) => x === k || x.startsWith(k + '=')); return i < 0 ? null : a[i].includes('=') ? a[i].split('=')[1] : a[i + 1]; };
  const jadwal = nilai('--jadwal'), sumber = (nilai('--sumber') || '').split(',').filter(Boolean);
  if (!JADWAL.includes(jadwal)) { console.error('pakai --jadwal harian|mingguan|bulanan|kuartalan|manual'); process.exit(1); }
  const g = validasiRegistri(bacaRegistri()); if (g.length) { console.error('registri rusak:\n' + g.join('\n')); process.exit(1); }
  const kini = process.env.TANGGAL_BANGUN || new Date().toISOString().slice(0, 10);
  const lap = await rangkai({ jadwal, sumber, kini, paksa: a.includes('--paksa'), kering: a.includes('--kering') });
  console.log(`rangkai ${jadwal}: panen ${lap.panen.diproses} sumber, ${lap.panen.gagal.length} gagal; langkah lain ${Object.keys(lap).length - 1}`);
}
