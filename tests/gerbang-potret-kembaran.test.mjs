// KJ-04: gerbang potret kembaran (statis, tanpa DB). Tiap fakta wajib st/src/tgl, st dari 4 nilai, ukuran gzip <= batas kontrak §5.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const ST = new Set(['sumber', 'hitung', 'menunggu', 'est']);
export const BATAS = { 'public/data/kembaran/ringkas.json': 40e3, 'public/data/kembaran/objek-inti.json': 150e3, 'public/data/kembaran/objek-rs.json': 250e3, 'public/data/kembaran/objek-fakta.json': 300e3, 'public/data/kembaran/energi.json': 60e3, 'public/geo/kembaran.json': 900e3 };
const adaSumber = (o) => Object.keys(o).some((k) => (k === 'src' || k.startsWith('src_')) && o[k]);

// Kembalikan daftar pelanggaran: tiap objek ber-`st` wajib st sah, sumber (src / src_*) dan tgl (tabel `faktor` memakai tanggal meta).
export function periksaFakta(x, jalur = '$', keluar = []) {
  if (Array.isArray(x)) x.forEach((y, i) => periksaFakta(y, `${jalur}[${i}]`, keluar));
  else if (x && typeof x === 'object') {
    if ('st' in x) {
      if (!ST.has(x.st)) keluar.push(`${jalur}: st '${x.st}' di luar ${[...ST]}`);
      if (!adaSumber(x)) keluar.push(`${jalur}: tanpa src`);
      if (!x.tgl && !jalur.includes('.faktor[')) keluar.push(`${jalur}: tanpa tgl`);
    }
    for (const k of Object.keys(x)) periksaFakta(x[k], `${jalur}.${k}`, keluar);
  }
  return keluar;
}

test('penjaga pemeriksa: menolak fakta tanpa src/tgl dan st di luar 4 nilai, meloloskan yang sah', () => {
  assert.deepEqual(periksaFakta({ fakta: [{ k: 'a', v: 1, st: 'hitung', src: 'osm-power', tgl: '2026-11-24' }] }), []);
  assert.equal(periksaFakta({ fakta: [{ k: 'a', st: 'hitung', tgl: 'x' }] }).length, 1, 'tanpa src harus ditolak');
  assert.equal(periksaFakta({ fakta: [{ k: 'a', st: 'hitung', src: 's' }] }).length, 1, 'tanpa tgl harus ditolak');
  assert.equal(periksaFakta({ fakta: [{ k: 'a', st: 'mungkin', src: 's', tgl: 't' }] }).length, 1, 'st di luar 4 nilai harus ditolak');
  assert.equal(periksaFakta([{ st: 'sumber' }]).length, 2, 'tanpa src dan tgl = dua pelanggaran');
});

const ada = Object.keys(BATAS).filter((f) => fs.existsSync(path.join(ROOT, f)));
const dir = fs.existsSync(path.join(ROOT, 'public/data/kembaran'));

test('penjaga: bila potret kembaran ada, semua berkas terbaca dan berisi fakta (bukan hijau-kosong)', { skip: !dir && 'potret kembaran belum dibangun (node scripts/pipa/graf_jaringan.mjs bangun)' }, () => {
  const harapan = Object.keys(BATAS).length;
  assert.equal(ada.length, harapan, `berkas potret terbaca ${ada.length}, harapan ${harapan}: ${Object.keys(BATAS).filter((f) => !ada.includes(f))} hilang`);
  const baca = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/kembaran', f), 'utf8'));
  const o = { ...baca('objek-inti.json'), ...baca('objek-rs.json') };
  const n = ['op', 'sis', 'prov', 'pb', 'gi', 'jl', 'rs'].map((k) => o[k]?.length || 0);
  assert.ok(n.every((v) => v > 0), `lapis kosong (op,sis,prov,pb,gi,jl,rs) = ${n}`);
});

for (const f of Object.keys(BATAS)) {
  const skip = !fs.existsSync(path.join(ROOT, f)) && 'potret belum dibangun';
  if (f.endsWith('kembaran.json') && f.startsWith('public/geo')) {
    test(`ukuran ${f}`, { skip }, () => { const g = zlib.gzipSync(fs.readFileSync(path.join(ROOT, f))).length; assert.ok(g <= BATAS[f], `${f}: gzip ${g} B > batas ${BATAS[f]} B (kontrak §5)`); });
    continue;
  }
  test(`fakta dan ukuran ${f}`, { skip }, () => {
    const g = zlib.gzipSync(fs.readFileSync(path.join(ROOT, f))).length;
    assert.ok(g <= BATAS[f], `${f}: gzip ${g} B > batas ${BATAS[f]} B (kontrak §5)`);
    const salah = periksaFakta(JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8')));
    const ringkas = [...new Set(salah.map((s) => s.replace(/\[\d+\]/g, '[]')))];
    assert.deepEqual(ringkas, [], `${salah.length} fakta melanggar kontrak §2 di ${f} (contoh: ${salah[0]})`);
  });
}
