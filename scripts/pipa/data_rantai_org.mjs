#!/usr/bin/env node
// "Siapa memasok siapa": tautan pemasok -> pelanggan antar organisasi, tiap tautan wajib dokumen berurl. Node stdlib saja.
//   node scripts/pipa/data_rantai_org.mjs bangun     -> public/data/rantai_org.json
//   node scripts/pipa/data_rantai_org.mjs --selftest
// Sumber SAAT INI (tanpa jaringan): GEM operator -> pemilik (O&M), pendanaan_internasional pemberi -> penerima (pendana),
// tautan manual berdokumen di data/rantai_org_manual.json (filing/pihak-pertama/media). Tidak ada tautan tanpa url_dokumen.
// kutipan: hanya bila ada teks dokumen; null bila tautan berasal dari data terstruktur (tidak dikarang).
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const J = (r) => JSON.parse(fs.readFileSync(path.join(ROOT, r), 'utf8'));
const TGL = process.env.TGL || '2026-11-08';
export const KATEGORI = ['modul-panel', 'inverter-baterai', 'turbin', 'epc-pemasang', 'om', 'pendana', 'offtaker', 'sewa-atap-ppa', 'kepemilikan'];
export const JENIS_DOK = { filing: 'Filing', 'pihak-pertama': 'Pihak pertama', media: 'Media' };
const norm = (s) => ' ' + String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\b(pt|tbk|persero|ltd|co|inc|corp|corporation|pte|sdn|bhd)\b/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim() + ' ';
const kata = (s) => String(s || '').trim().split(/\s+/).filter(Boolean).length;

export function bangunTautan({ gem, pendanaan, manual }) {
  const t = [];
  for (const g of gem) for (const r of g.baris) for (const o of r.operator || []) for (const p of r.pemilik || [])
    if (norm(o.nama) !== norm(p.nama) && !/to be determined|unnamed/i.test(p.nama + o.nama) && r.url_wiki)
      t.push({ pemasok: o.nama, pelanggan: p.nama, kategori: 'om', jenis_dokumen: 'media', label_bukti: 'dataset-terbuka', tanggal_dokumen: r.diriset || null, url_dokumen: r.url_wiki, kutipan: null, angka: r.kapasitas_mw != null ? { nilai: r.kapasitas_mw, satuan: 'MW' } : null, proyek: r.nama, catatan: 'GEM ' + g.sumber + ' (' + g.rilis + '), operator dan pemilik proyek; CC BY 4.0' });
  for (const b of pendanaan) if (b.pemberi && b.penerima && /^https?:/.test(b.sumber_url || ''))
    t.push({ pemasok: b.pemberi, pelanggan: b.penerima, kategori: 'pendana', jenis_dokumen: 'media', label_bukti: 'dataset-terbuka', tanggal_dokumen: b.tanggal, url_dokumen: b.sumber_url, kutipan: null, angka: b.nilai_usd != null ? { nilai: b.nilai_usd, satuan: 'USD' } : null, proyek: b.nama, catatan: 'IATI via d-portal' });
  for (const m of manual) t.push(m);
  return t.filter((x) => /^https?:\/\//.test(x.url_dokumen || '') && x.pemasok && x.pelanggan && KATEGORI.includes(x.kategori) && (x.kutipan == null || kata(x.kutipan) <= 25));
}
export function jaring(tautan, orgs) {
  const idx = new Map(orgs.map((o) => [norm(o.nama), o]));
  const simpul = new Map();
  const ambil = (nama) => { const o = idx.get(norm(nama)); const id = o ? o.id : 'x_' + norm(nama).trim().replace(/ /g, '-').slice(0, 60); if (!simpul.has(id)) simpul.set(id, { id, nama: o ? o.nama : nama, di_direktori: !!o, sektor: o?.kepakaran?.[0] || null, masuk: 0, keluar: 0 }); return simpul.get(id); };
  const seen = new Set(), rel = [];
  for (const x of tautan) {
    const a = ambil(x.pemasok), b = ambil(x.pelanggan); const k = [a.id, b.id, x.kategori, x.url_dokumen].join('|'); if (a.id === b.id || seen.has(k)) continue; seen.add(k);
    a.keluar++; b.masuk++; rel.push({ pemasok_id: a.id, pelanggan_id: b.id, ...x, pemasok: undefined, pelanggan: undefined, domain: new URL(x.url_dokumen).hostname });
  }
  return { simpul: [...simpul.values()].sort((p, q) => q.masuk + q.keluar - p.masuk - p.keluar || (p.id < q.id ? -1 : 1)), tautan: rel.sort((p, q) => (p.pemasok_id + p.pelanggan_id + p.url_dokumen < q.pemasok_id + q.pelanggan_id + q.url_dokumen ? -1 : 1)) };
}
function bangun() {
  const gem = fs.readdirSync(path.join(ROOT, 'data/gem')).filter((f) => f.endsWith('.json')).map((f) => J('data/gem/' + f));
  const mf = path.join(ROOT, 'data/rantai_org_manual.json');
  const manual = fs.existsSync(mf) ? J('data/rantai_org_manual.json').baris : [];
  const orgs = J('data-panen/potret/publik/organisasi.json').baris;
  const h = jaring(bangunTautan({ gem, pendanaan: J('public/data/pendanaan_internasional.json').baris, manual }), orgs);
  const per = {}; h.tautan.forEach((x) => { per[x.kategori] = (per[x.kategori] || 0) + 1; });
  fs.writeFileSync(path.join(ROOT, 'public/data/rantai_org.json'), JSON.stringify({ lapis: 'publik', dibangun_pada: TGL, jumlah: h.simpul.length, jumlah_tautan: h.tautan.length, per_kategori: per, kategori: KATEGORI, simpul: h.simpul, tautan: h.tautan }) + '\n');
  console.log('simpul', h.simpul.length, 'tautan', h.tautan.length, per);
}
function selftest() {
  const gem = [{ sumber: 'x', rilis: '2026', baris: [{ nama: 'P', operator: [{ nama: 'PT Op' }], pemilik: [{ nama: 'Own Ltd' }], url_wiki: 'https://g.test/p', kapasitas_mw: 5 }, { nama: 'Q', operator: [{ nama: 'Same' }], pemilik: [{ nama: 'Same' }], url_wiki: 'https://g.test/q' }] }];
  const t = bangunTautan({ gem, pendanaan: [{ pemberi: 'A', penerima: 'B', sumber_url: null }], manual: [{ pemasok: 'M', pelanggan: 'N', kategori: 'epc-pemasang', url_dokumen: 'https://m.test', kutipan: 'satu dua tiga' }, { pemasok: 'M', pelanggan: 'N', kategori: 'epc-pemasang', url_dokumen: null }] });
  assert.equal(t.length, 2); // pemilik=operator dibuang, tanpa url dibuang
  const h = jaring(t, [{ id: 'p_1', nama: 'PT Op', kepakaran: ['surya'] }]);
  assert.equal(h.simpul.find((s) => s.id === 'p_1').keluar, 1); assert.equal(h.simpul.filter((s) => !s.di_direktori).length, 3);
  assert.equal(bangunTautan({ gem: [], pendanaan: [], manual: [{ pemasok: 'a', pelanggan: 'b', kategori: 'om', url_dokumen: 'https://z', kutipan: Array(26).fill('k').join(' ') }] }).length, 0);
  console.log('selftest ok');
}
if (process.argv[2] === '--selftest') selftest(); else if (process.argv[2] === 'bangun') bangun(); else console.log('pakai: bangun | --selftest');
