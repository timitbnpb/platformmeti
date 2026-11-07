// Label "METI <Singkatan>" per orang: dipakai potret.mjs (orangOut.publik); CLI menambal public/data/orang.json di tempat.
//   node scripts/pipa/meti_wilayah_orang.mjs [--selftest]
// Sumber: data/meti_wilayah.json (ketua provinsi, ketua_wilayah_pusat) + teks jabatan/organisasi. Ragu = lewati.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PROV, kodeProv, singkatProv } from '../../public/inti/prov_singkat.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const norm = (s) => String(s || '').toLowerCase().replace(/\([^)]*\)/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim();
const PUSAT = { kode: '', label: 'METI Wilayah' };
const lab = (kode) => ({ kode, label: 'METI ' + singkatProv(kode) });

// "METI Wilayah Sumut", "METI Sumatera Utara", "Ketua METI Kepri". Satu provinsi saja; dua = ragu.
const NAMA_RE = [...new Set(Object.values(PROV).flat())].sort((a, b) => b.length - a.length).map((n) => n.replace(/ /g, '\\s+')).join('|');
const RE_TEKS = new RegExp(`\\bMETI\\s+(?:Wilayah\\s+|Daerah\\s+)?(?:Provinsi\\s+)?(${NAMA_RE})(?![A-Za-z])`, 'gi');
const RE_PUSAT = /\b(?:Wakil\s+)?Koordinator\s+METI\s+Wilayah\b(?!\s+\S*[A-Z])/;
export function dariTeks(teks) {
  const kode = new Set(); for (const m of String(teks || '').matchAll(RE_TEKS)) { const k = kodeProv(m[1]); if (k) kode.add(k); }
  return kode.size === 1 ? [...kode][0] : '';
}

/** bangunPeta(mw) -> { ketua: Map(norm nama -> kode|''), } dari data/meti_wilayah.json */
export function bangunKetua(mw) {
  const m = new Map(); const tambah = (nama, kode) => { const n = norm(nama); if (n) m.set(n, m.has(n) && m.get(n) !== kode ? null : kode); };
  for (const p of mw.provinsi || []) { tambah(p.ketua, p.kode); tambah(p.sekretaris, p.kode); for (const x of p.pengurus || []) tambah(typeof x === 'string' ? x : x.nama, p.kode); }
  for (const n of String(mw.ketua_wilayah_pusat || '').replace(/\(.*?\)/g, ',').split(/,|\bwakil\b/i)) tambah(n.trim(), '');
  return m;
}

/** labelOrang(orang, ketua) -> {kode,label} | undefined */
export function labelOrang(o, ketua) {
  const teks = [o.jabatan_terkini, o.organisasi_terkini, ...(o.jabatan || []).filter((j) => j.kini).flatMap((j) => [j.jabatan, j.organisasi])];
  const kt = ketua.get(norm(o.nama));
  if (teks.some((t) => RE_PUSAT.test(t || '')) || kt === '') return PUSAT;
  const dariT = [...new Set(teks.map(dariTeks).filter(Boolean))];
  if (dariT.length > 1) return undefined;
  if (kt === null) return undefined; // nama ganda lintas provinsi
  if (kt && dariT.length && dariT[0] !== kt) return undefined; // bukti bertentangan
  const kode = kt || dariT[0];
  return kode ? lab(kode) : undefined;
}

/** terapkan(baris, mw): isi baris[].meti_wilayah di tempat; kembalikan jumlah. Nama kembar (>1 baris) dilewati kecuali dari teks. */
export function terapkan(baris, mw) {
  const ketua = bangunKetua(mw), jml = new Map(); for (const o of baris) jml.set(norm(o.nama), (jml.get(norm(o.nama)) || 0) + 1);
  let n = 0;
  for (const o of baris) {
    delete o.meti_wilayah;
    const kembar = jml.get(norm(o.nama)) > 1, l = labelOrang(o, kembar ? new Map() : ketua);
    if (l) { o.meti_wilayah = l; n++; }
  }
  return n;
}

export function selftest() {
  const assert = (c, m) => { if (!c) throw new Error('selftest gagal: ' + m); };
  assert(singkatProv('12') === 'Sumut' && kodeProv('Sumatera Utara') === '12' && kodeProv('Sumut') === '12' && kodeProv('Sumatera') === '', 'peta');
  assert(dariTeks('Ketua METI Wilayah Sumut') === '12' && dariTeks('Ketua METI Sumatera Utara') === '12', 'teks');
  assert(dariTeks('Ketua METI Energi Muda') === '' && dariTeks('Direktur METI Institute') === '', 'METI non-wilayah');
  assert(dariTeks('METI Jawa Barat dan METI Aceh') === '', 'dua provinsi = ragu');
  assert(dariTeks('METI Papua Barat') === '92' && dariTeks('METI Sulawesi Utaraan') === '', 'terpanjang menang, batas kata');
  const mw = { provinsi: [{ kode: '32', ketua: 'Fragaria Alfissima' }], ketua_wilayah_pusat: 'Parlindungan Purba (Koordinator/Ketua METI Wilayah), wakil Eva Djauhari' };
  const b = [{ nama: 'Fragaria Alfissima' }, { nama: 'Eva Djauhari' }, { nama: 'Budi', jabatan_terkini: 'Ketua METI Wilayah Kepri' }, { nama: 'Siti', jabatan_terkini: 'Dosen' }, { nama: 'Fragaria Alfissima Z' }, { nama: 'Ani', jabatan_terkini: 'Koordinator METI Wilayah' }];
  assert(terapkan(b, mw) === 4, 'jumlah');
  assert(b[0].meti_wilayah.label === 'METI Jabar' && b[1].meti_wilayah.kode === '' && b[2].meti_wilayah.label === 'METI Kepri' && !b[3].meti_wilayah && !b[4].meti_wilayah && b[5].meti_wilayah.label === 'METI Wilayah', 'label');
  console.log('selftest ok');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--selftest')) selftest();
  else {
    const f = path.join(ROOT, 'public/data/orang.json'), d = JSON.parse(fs.readFileSync(f, 'utf8'));
    const n = terapkan(d.baris, JSON.parse(fs.readFileSync(path.join(ROOT, 'data/meti_wilayah.json'), 'utf8')));
    fs.writeFileSync(f, JSON.stringify(d), 'utf8'); console.log('orang.json: meti_wilayah', n);
  }
}
