// JM-T02..T05: gerbang statis workflow panen (RENCANA-UJI §6.3). Tanpa pustaka YAML: pemeriksaan per baris/indentasi.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const DIR = new URL('../.github/workflows/', import.meta.url);
const NAMA = ['harian', 'mingguan', 'bulanan', 'kuartalan'];
const tulis = ['contents: write', 'pull-requests: write', 'issues: write'];

function jobs(teks) {
  const m = teks.split('\njobs:\n')[1] || '', hasil = {};
  let cur = null;
  for (const l of m.split('\n')) { const h = l.match(/^  ([a-z_]+):\s*$/); if (h) { cur = h[1]; hasil[cur] = []; } else if (cur) hasil[cur].push(l); }
  return Object.fromEntries(Object.entries(hasil).map(([k, v]) => [k, v.join('\n')]));
}
function blokRun(teks) { // isi semua `run:` (sebaris atau blok)
  const baris = teks.split('\n'), out = [];
  for (let i = 0; i < baris.length; i++) {
    const m = baris[i].match(/^(\s*)(?:- )?run:\s*(.*)$/); if (!m) continue;
    if (m[2] && !/^[|>]/.test(m[2])) { out.push(m[2]); continue; }
    const ind = m[1].length; for (let j = i + 1; j < baris.length && (baris[j].trim() === '' || baris[j].search(/\S/) > ind + 1); j++) out.push(baris[j]);
  }
  return out.join('\n');
}
export function periksa(teks) {
  const g = [], head = teks.split('\njobs:\n')[0], J = jobs(teks);
  if (!/^permissions:\n  contents: read\n(?=\S)/m.test(head)) g.push('permissions level workflow bukan persis contents: read');
  if (/write-all/.test(teks)) g.push('write-all');
  if (/pull_request_target/.test(teks)) g.push('pull_request_target');
  const on = (head.match(/^on:\n((?:  .*\n)+)/m) || [, ''])[1].split('\n').filter((l) => /^  [a-z_]+:/.test(l)).map((l) => l.trim().replace(':', ''));
  if (on.sort().join() !== 'schedule,workflow_dispatch') g.push('pemicu selain schedule dan workflow_dispatch: ' + on);
  if (!/^concurrency:/m.test(head)) g.push('tanpa concurrency');
  for (const l of teks.split('\n').filter((x) => /\buses:/.test(x))) if (!/@[0-9a-f]{40}\b/.test(l)) g.push('aksi tanpa SHA: ' + l.trim());
  if (/\$\{\{\s*(github\.event\.)?inputs\./.test(blokRun(teks))) g.push('inputs langsung di run:');
  if (/CLOUDFLARE|R2_|WRANGLER/i.test(teks)) g.push('rahasia Cloudflare di workflow panen');
  for (const [n, isi] of Object.entries(J)) {
    if (!/vars\.BOT_AKTIF == 'true'/.test(isi)) g.push(`job ${n} tanpa sakelar BOT_AKTIF`);
    if (n !== 'bot_pr') { if (tulis.some((t) => isi.includes(t))) g.push(`job ${n} memegang izin tulis`); if (!/permissions:\n\s+contents: read/.test(isi)) g.push(`job ${n} tanpa contents: read eksplisit`); if (/GITHUB_TOKEN/.test(isi)) g.push(`job ${n} memakai GITHUB_TOKEN`); }
    else { for (const t of tulis) if (!isi.includes(t)) g.push('bot_pr kurang ' + t); const rah = [...isi.matchAll(/secrets\.([A-Z_]+)/g)].map((x) => x[1]).filter((x) => x !== 'GITHUB_TOKEN'); if (rah.length) g.push('bot_pr memegang rahasia ' + rah); if (/git push[^\n]*\bmain\b/.test(blokRun(isi))) g.push('bot_pr mendorong ke main'); }
  }
  for (const n of ['uji', 'bot_pr']) if (J[n] && (/tar [^\n]*-x/.test(J[n]) || !/arsip_aman\.mjs/.test(J[n]))) g.push(`job ${n} membuka arsip tanpa arsip_aman.mjs`);
  if (!J.panen || !J.uji || !J.bot_pr) g.push('job panen/uji/bot_pr tidak lengkap');
  else { if (!/needs: panen/.test(J.uji) || !/needs: uji/.test(J.bot_pr)) g.push('rantai needs salah'); if (!/npm run uji/.test(J.uji)) g.push('uji tidak dijalankan di dalam job'); }
  return g;
}
const baca = (n) => fs.readFileSync(new URL(`panen-${n}.yml`, DIR), 'utf-8');

for (const n of NAMA) test(`T0x panen-${n}.yml lolos gerbang izin dan pin`, () => assert.deepEqual(periksa(baca(n)), []));
test('T0x cron panen: satu per berkas, total workflow <= 5 (Worker menambah)', () => {
  let semua = 0;
  for (const f of fs.readdirSync(DIR).filter((x) => x.endsWith('.yml'))) semua += (fs.readFileSync(new URL(f, DIR), 'utf-8').match(/- cron:/g) || []).length;
  for (const n of NAMA) assert.equal((baca(n).match(/- cron:/g) || []).length, 1, n);
  assert.ok(semua <= 4, 'sisakan jatah untuk Worker: ' + semua);
});
test('T0x gerbang sendiri menolak pelanggaran (uji dua arah)', () => {
  const b = baca('harian'), uji = (f) => assert.ok(periksa(f(b)).length > 0);
  uji((t) => t.replace(/^permissions:\n  contents: read/m, 'permissions: write-all'));
  uji((t) => t.replace('  panen:\n', '  panen:\n    permissions:\n      issues: write\n'));
  uji((t) => t.replace('on:\n', 'on:\n  pull_request_target:\n'));
  uji((t) => t.replace('34e114876b0b11c390a56381ad16ebd13914f8d5', 'v4'));
  uji((t) => t.replace('node scripts/pipa/bot_pr.mjs --jadwal "$JADWAL"', 'git push origin main'));
  uji((t) => t.replace(/ *- run: npm run uji\n/, ''));
  uji((t) => t.replaceAll('node scripts/pipa/arsip_aman.mjs', 'tar -xzf'));
  uji((t) => t.replace(/BOT_AKTIF == 'true'/, 'true'));
  uji((t) => t.replace('node scripts/pipa/rangkai.mjs "${args[@]}"', 'node x ${{ github.event.inputs.sumber }}'));
  uji((t) => t.replace(/^concurrency:\n.*\n.*\n/m, ''));
  uji((t) => t.replace('GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}', 'GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}\n          X: ${{ secrets.CLOUDFLARE_API_TOKEN }}'));
});
