// Isi orang.foto yang kosong dari foto pengurus METI yang sudah ada (tanpa jaringan, tanpa foto baru).
//   node scripts/pipa/foto_orang_gabung.mjs terapkan   isi public/data/orang.json, tulis public/data/foto_orang.json (id -> foto)
//                                                       dan data/direktori/foto_belum.json (bahan permintaan ke sekretariat)
//   node scripts/pipa/foto_orang_gabung.mjs --selftest
// Urutan cocok: orang_id di pengurus-meti.json, lalu nama tanpa gelar di pengurus-meti.json, lalu berkas public/img/pengurus/<slug>(-b).webp.
// Foto yang sudah ada tidak ditimpa; berkasnya harus ada di disk. Dipanggil juga oleh potret.mjs supaya bangun ulang tidak menghapusnya.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const GELAR = new Set(['prof', 'dr', 'dra', 'drs', 'ir', 'h', 'hj', 'msc', 'mt', 'st', 'se', 'sh', 'mba', 'mm', 'ma', 'mpp', 'phd', 'ipm', 'ipu', 'ssi', 'msi', 'mkom', 'skom', 'sip', 'mp', 'meng', 'beng', 'llm', 'cfa', 'cpa', 'mph', 'ssos', 'spd', 'mpd', 'mhum', 'mie', 'dipl', 'eng']);
export const normNama = (s) => String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').split(',')[0].replace(/[^a-z0-9]+/g, ' ').split(' ').filter((t) => t && !GELAR.has(t)).join(' ');
const slugDari = (n) => normNama(n).replace(/ /g, '-');

// pengurus: isi pengurus-meti.json; berkas: Set nama berkas di public/img/pengurus; ada(urlFoto) -> boolean
export function gabung(orang, pengurus, berkas, ada) {
  const entri = [...Object.values(pengurus.unit || {}).flat(), ...(pengurus.bidang || []).flatMap((b) => b.anggota || [])].filter((e) => e.foto && ada(e.foto));
  const idx = new Map(), nm = new Map();
  for (const e of entri) { if (e.orang_id && !idx.has(e.orang_id)) idx.set(e.orang_id, e.foto); const k = normNama(e.nama); if (k && !nm.has(k)) nm.set(k, e.foto); }
  const dari = (o) => {
    if (idx.has(o.id)) return idx.get(o.id);
    const k = normNama(o.nama); if (k && nm.has(k)) return nm.get(k);
    const sl = slugDari(o.nama); if (!sl.includes('-')) return null; // satu kata terlalu ambigu
    for (const f of [sl + '-b.webp', sl + '.webp']) if (berkas.has(f)) return '/img/pengurus/' + f;
    return null;
  };
  let isi = 0;
  for (const o of orang) if (!o.foto) { const f = dari(o); if (f) { o.foto = f; isi++; } }
  return isi;
}
const METI = /\bMETI\b|Masyarakat Energi Terbarukan/i;
export function belum(orang, namaMeti) {
  return orang.filter((o) => !o.foto).map((o) => ({ id: o.id, nama: o.nama, organisasi: o.organisasi_terkini || '', meti: METI.test(o.organisasi_terkini || '') || namaMeti.has(normNama(o.nama)) })).sort((a, b) => Number(b.meti) - Number(a.meti) || a.id.localeCompare(b.id));
}
export function muat() {
  const pengurus = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/pengurus-meti.json'), 'utf8'));
  const dir = path.join(ROOT, 'public/img/pengurus');
  return { pengurus, berkas: new Set(fs.readdirSync(dir)), ada: (u) => fs.existsSync(path.join(ROOT, 'public', u)) };
}
export const namaPengurus = (p) => new Set([...Object.values(p.unit || {}).flat(), ...(p.bidang || []).flatMap((b) => b.anggota || [])].map((e) => normNama(e.nama)).filter(Boolean));

function selftest() {
  assert.equal(normNama('Prof. Dr. Ir. Budi Santoso, M.Sc.'), 'budi santoso');
  const peng = { unit: { a: [{ nama: 'Ani Wati', foto: '/img/pengurus/ani-wati-b.webp', orang_id: 'o_1' }, { nama: 'Milton Pakpahan', foto: '/img/pengurus/sumanggar-milton-pakpahan-b.webp' }, { nama: 'Kosong', foto: '' }] } };
  const orang = [{ id: 'o_1', nama: 'Ani W' }, { id: 'o_2', nama: 'Dr. Milton Pakpahan, M.Sc' }, { id: 'o_3', nama: 'Budi Hartono' }, { id: 'o_4', nama: 'Siti Aminah', foto: '/x.webp' }, { id: 'o_5', nama: 'Kosong' }, { id: 'o_6', nama: 'Joko' }];
  const n = gabung(orang, peng, new Set(['budi-hartono.webp', 'joko.webp']), () => true);
  assert.equal(n, 3); assert.equal(orang[0].foto, '/img/pengurus/ani-wati-b.webp'); assert.equal(orang[1].foto, '/img/pengurus/sumanggar-milton-pakpahan-b.webp');
  assert.equal(orang[2].foto, '/img/pengurus/budi-hartono.webp'); assert.equal(orang[3].foto, '/x.webp'); assert.ok(!orang[4].foto && !orang[5].foto);
  console.log('selftest foto_orang_gabung ok');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv[2] === '--selftest') selftest();
  else if (process.argv[2] === 'terapkan') {
    const fo = path.join(ROOT, 'public/data/orang.json'), o = JSON.parse(fs.readFileSync(fo, 'utf8')), m = muat();
    const sebelum = o.baris.filter((x) => x.foto).length, isi = gabung(o.baris, m.pengurus, m.berkas, m.ada);
    fs.writeFileSync(fo, JSON.stringify(o), 'utf8');
    fs.writeFileSync(path.join(ROOT, 'public/data/foto_orang.json'), JSON.stringify(Object.fromEntries(o.baris.filter((x) => x.foto).map((x) => [x.id, x.foto]).sort((a, b) => a[0].localeCompare(b[0])))), 'utf8');
    const b = belum(o.baris, namaPengurus(m.pengurus));
    fs.writeFileSync(path.join(ROOT, 'data/direktori/foto_belum.json'), JSON.stringify(b, null, 1) + '\n', 'utf8');
    console.log(`foto: ${sebelum} -> ${sebelum + isi} dari ${o.baris.length}; belum ${b.length} (METI ${b.filter((x) => x.meti).length})`);
  } else { console.error('pakai: terapkan | --selftest'); process.exit(1); }
}
