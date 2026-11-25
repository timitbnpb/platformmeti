// KJ-04: gerbang potret kembaran (statis, tanpa DB). Tiap fakta wajib st/src/tgl, st dari 4 nilai, ukuran gzip <= batas kontrak §5.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const ST = new Set(['sumber', 'hitung', 'menunggu', 'est']);
export const BATAS = { 'public/data/kembaran/ringkas.json': 40e3, 'public/data/kembaran/objek-inti.json': 150e3, 'public/data/kembaran/objek-rs.json': 250e3, 'public/data/kembaran/objek-fakta.json': 300e3, 'public/data/kembaran/energi.json': 60e3, 'public/data/kembaran/lapis.json': 100e3, 'public/data/kembaran/deret.json': 80e3, 'public/data/kembaran/sumber.json': 60e3, 'public/geo/kembaran.json': 900e3 };
const adaSumber = (o) => Object.keys(o).some((k) => (k === 'src' || k.startsWith('src_')) && o[k]);

// Kembalikan daftar pelanggaran: tiap objek ber-`st` wajib st sah, sumber (src / src_*) dan tgl (tabel `faktor` memakai tanggal meta).
// `daftar` (Set id dari sumber.json, opsional): tiap id di src / src_* (string "a,b" atau larik) wajib terdaftar.
const idSrc = (v) => (Array.isArray(v) ? v.flatMap(idSrc) : typeof v === 'string' ? v.split(',').map((s) => s.trim()).filter(Boolean) : []);
export function periksaFakta(x, jalur = '$', keluar = [], daftar = null) {
  if (Array.isArray(x)) x.forEach((y, i) => periksaFakta(y, `${jalur}[${i}]`, keluar, daftar));
  else if (x && typeof x === 'object') {
    if ('st' in x) {
      if (!ST.has(x.st)) keluar.push(`${jalur}: st '${x.st}' di luar ${[...ST]}`);
      if (!adaSumber(x)) keluar.push(`${jalur}: tanpa src`);
      if (!x.tgl && !jalur.includes('.faktor[')) keluar.push(`${jalur}: tanpa tgl`);
      if (daftar) for (const k of Object.keys(x)) if (k === 'src' || k.startsWith('src_')) for (const id of idSrc(x[k])) if (!daftar.has(id)) keluar.push(`${jalur}: ${k} '${id}' tak terdaftar di sumber.json`);
    }
    for (const k of Object.keys(x)) periksaFakta(x[k], `${jalur}.${k}`, keluar, daftar);
  }
  return keluar;
}

test('penjaga pemeriksa: menolak fakta tanpa src/tgl dan st di luar 4 nilai, meloloskan yang sah', () => {
  assert.deepEqual(periksaFakta({ fakta: [{ k: 'a', v: 1, st: 'hitung', src: 'osm-power', tgl: '2026-11-24' }] }), []);
  assert.equal(periksaFakta({ fakta: [{ k: 'a', st: 'hitung', tgl: 'x' }] }).length, 1, 'tanpa src harus ditolak');
  assert.equal(periksaFakta({ fakta: [{ k: 'a', st: 'hitung', src: 's' }] }).length, 1, 'tanpa tgl harus ditolak');
  assert.equal(periksaFakta({ fakta: [{ k: 'a', st: 'mungkin', src: 's', tgl: 't' }] }).length, 1, 'st di luar 4 nilai harus ditolak');
  assert.equal(periksaFakta([{ st: 'sumber' }]).length, 2, 'tanpa src dan tgl = dua pelanggaran');
  const d = new Set(['a', 'b']), f = (src) => periksaFakta([{ st: 'hitung', src, tgl: 't' }], '$', [], d).length;
  assert.deepEqual([f('a'), f('a,b'), f(['a', 'b']), f('x'), f('a,x'), f(['a', 'x'])], [0, 0, 0, 1, 1, 1], 'src tak terdaftar di sumber.json DITOLAK, termasuk dalam daftar');
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
    const fs_ = path.join(ROOT, 'public/data/kembaran/sumber.json'), daftar = fs.existsSync(fs_) && !f.endsWith('/sumber.json') ? new Set(JSON.parse(fs.readFileSync(fs_, 'utf8')).sumber.map((s) => s.id)) : null;
    if (daftar) assert.ok(daftar.size >= 10, `sumber.json hanya ${daftar.size} id: daftar kosong meloloskan semua`);
    const salah = periksaFakta(JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8')), '$', [], daftar);
    const ringkas = [...new Set(salah.map((s) => s.replace(/\[\d+\]/g, '[]')))];
    assert.deepEqual(ringkas, [], `${salah.length} fakta melanggar kontrak §2 di ${f} (contoh: ${salah[0]})`);
  });
}
