// Organisasi baru dari pemilik proyek yang belum ada di direktori (tanpa jaringan).
//   node scripts/pipa/org_pemilik.mjs bangun <tgl>   tulis data-panen/perusahaan/tambahan_pemilik.jsonl (dibaca potret.mjs)
//   node scripts/pipa/org_pemilik.mjs --selftest
// Daftar dan keputusan ada di data/direktori/org_pemilik_kurasi.json (baru / alias / kurator). Tiap organisasi baru wajib punya
// minimal satu sumber berurl: halaman proyek (GEM wiki, RUPTL, berita) yang menyebut namanya sebagai pemilik. Tanpa URL = tidak dibangun.
// Kota, situs, tahun berdiri, logo diisi belakangan dari Wikidata (wikidata_org.mjs), bukan ditebak di sini.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { norm } from './tautan_proyek_org.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const baca = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf-8'));
const TEK = new Set(['surya', 'bayu', 'hidro', 'panas-bumi', 'bioenergi', 'biomassa-sampah', 'penyimpanan']);
const URUT = { resmi: 3, kajian: 2, 'kata-pihak': 1 };

export function bangun(tgl, kurasi, proyek) {
  const per = new Map(kurasi.baru.map((b) => [b.id, { b, src: new Map(), tek: new Set() }]));
  const peta = new Map(kurasi.baru.flatMap((b) => [b.nama, ...b.varian].map((n) => [norm(n), b.id])));
  for (const p of proyek) for (const l of Object.values(p.pihak || {})) for (const v of l) {
    const id = peta.get(norm(v.nilai)); if (!id) continue;
    const e = per.get(id), s = (p.sumber || []).find((x) => x.id === v.sumber_id);
    if (p.teknologi && TEK.has(p.teknologi)) e.tek.add(p.teknologi);
    if (s?.url && /^https:\/\//.test(s.url)) e.src.set(s.url, { jenis: s.jenis, tingkat_bukti: s.tingkat_bukti, proyek: p.nama });
  }
  const baris = [], tanpaSumber = [];
  for (const { b, src, tek } of per.values()) {
    if (!src.size) { tanpaSumber.push(b.nama); continue; }
    const sumber = [...src].sort((a, c) => (URUT[c[1].tingkat_bukti] || 0) - (URUT[a[1].tingkat_bukti] || 0) || a[0].localeCompare(c[0])).slice(0, 5)
      .map(([url, s], i) => ({ id: 'pemilik-' + (i + 1), jenis: s.jenis || 'proyek', url, keterangan: `disebut sebagai pemilik/pengembang proyek "${s.proyek}"`, tingkat_bukti: s.tingkat_bukti || 'kajian', tanggal_periksa: tgl }));
    baris.push({ perusahaan_id: b.id, nama: b.nama, nama_lain: b.varian.filter((v) => v !== b.nama), jenis: b.jenis, kepakaran: [...tek].sort(), peran_rantai: ['pengembang'], sumber, tanggal_ambil: tgl });
  }
  return { baris, tanpaSumber };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv[2] === '--selftest') {
    const k = { baru: [{ id: 'pm_a', nama: 'PT Foo', varian: ['PT Foo', 'FOO'], jenis: 'swasta' }, { id: 'pm_b', nama: 'PT Bar', varian: ['PT Bar'], jenis: 'swasta' }] };
    const p = [{ nama: 'PLTS X', teknologi: 'surya', pihak: { pemilik: [{ nilai: 'FOO', sumber_id: 's1' }, { nilai: 'PT Bar', sumber_id: 's2' }] }, sumber: [{ id: 's1', url: 'https://gem.wiki/x', jenis: 'gem', tingkat_bukti: 'kajian' }, { id: 's2', url: null }] }];
    const h = bangun('2026-01-01', k, p);
    assert.equal(h.baris.length, 1); assert.deepEqual(h.tanpaSumber, ['PT Bar']); assert.deepEqual(h.baris[0].kepakaran, ['surya']);
    console.log('selftest org_pemilik ok');
  } else if (process.argv[2] === 'bangun') {
    const tgl = process.argv[3]; if (!/^\d{4}-\d\d-\d\d$/.test(tgl || '')) { console.error('pakai: bangun <YYYY-MM-DD>'); process.exit(1); }
    const h = bangun(tgl, baca('data/direktori/org_pemilik_kurasi.json'), baca('public/data/proyek.json').baris);
    fs.mkdirSync(path.join(ROOT, 'data-panen/perusahaan'), { recursive: true });
    fs.writeFileSync(path.join(ROOT, 'data-panen/perusahaan/tambahan_pemilik.jsonl'), h.baris.map((r) => JSON.stringify(r)).join('\n') + '\n', 'utf-8');
    console.log('organisasi baru:', h.baris.length, 'tanpa sumber berurl (ditahan):', h.tanpaSumber.join('; ') || '-');
  } else { console.error('pakai: bangun <tgl> | --selftest'); process.exit(1); }
}
