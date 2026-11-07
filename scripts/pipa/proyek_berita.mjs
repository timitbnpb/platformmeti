#!/usr/bin/env node
// Terapkan data/proyek_berita.json (proyek dari berita, tingkat_bukti media) ke data-panen/proyek/*.jsonl.
//   node scripts/pipa/proyek_berita.mjs            terapkan (idempoten: nilai/sumber/proyek yang sudah ada dilewati)
//   node scripts/pipa/proyek_berita.mjs --selftest
// Lalu bangun ulang potret. Tidak menyentuh jaringan; nilai hanya yang tertulis di berkas masukan.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { cariPusat } from '../panen/panen_proyek.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DIR = path.join(ROOT, 'data-panen/proyek');
const TGL = '2026-11-07';
const baca = (f) => fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
const tulis = (f, rows) => fs.writeFileSync(f, rows.map((r) => JSON.stringify(r)).join('\n') + '\n', 'utf8');
const sid = (b) => 'sb' + b.slice(1);
const sama = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const KUNCI = ['kapasitas', 'status', 'cod_target', 'nilai_investasi', 'pemilik'];

export function nilaiDari(v) { const { s, ...r } = v; return { ...r, sumber_id: sid(s) }; }

export function terapkan(data, proyek, sumber, pusat) {
  const idS = new Set(sumber.map((s) => s.id)); let tS = 0, tP = 0, tB = 0;
  for (const s of data.sumber) if (!idS.has(sid(s.id))) { sumber.push({ id: sid(s.id), jenis: 'berita', url: s.url, tingkat_bukti: s.tingkat_bukti, lisensi: 'tidak ditentukan', tanggal_ambil: TGL, catatan: `${s.media} ${s.tanggal}; ${s.catatan}; hanya fakta yang dikutip` }); tS++; }
  const per = new Map(proyek.map((p) => [p.id, p]));
  for (const e of data.perkaya) {
    const p = per.get(e.id); assert(p, 'proyek tidak ada: ' + e.id);
    let ubah = false;
    for (const k of KUNCI) for (const v of e[k] || []) { const n = nilaiDari(v); p[k] = p[k] || []; if (!p[k].some((x) => sama(x, n))) { p[k].push(n); ubah = true; } }
    const s0 = KUNCI.flatMap((k) => (e[k] || []).map((v) => v.s))[0];
    for (const nm of e.nama_lain || []) if (!p.nama.some((x) => x.nilai === nm)) { p.nama.push({ nilai: nm, sumber_id: sid(s0) }); ubah = true; }
    const ids = KUNCI.flatMap((k) => (e[k] || []).map((v) => sid(v.s)));
    p.sumber_ids = [...new Set([...(p.sumber_ids || []), ...ids])];
    if (ubah) tP++;
  }
  for (const b of data.baru) {
    if (per.has(b.id)) continue;
    const ids = [...new Set(KUNCI.flatMap((k) => (b[k] || []).map((v) => sid(v.s))))];
    const r = { id: b.id, nama: [{ nilai: b.nama, sumber_id: ids[0] }], teknologi: b.teknologi, provinsi: b.provinsi, kabupaten_kota: b.kabupaten_kota ? [{ nilai: b.kabupaten_kota, sumber_id: ids[0] }] : null, program: b.program || null, programs: b.program ? [b.program] : [], sumber_ids: ids };
    for (const k of ['epc', 'pembeli', 'skema_kerjasama', 'tanggal_ppa', 'financial_close', 'cod_aktual', 'tenaga_kerja', 'pemberi_dana', 'pihak_terlibat', 'catatan', ...KUNCI]) r[k] = (b[k] || []).map(nilaiDari);
    const h = cariPusat(pusat, b.kabupaten_kota, b.provinsi);
    if (h) { r.lat = h.lat; r.lng = h.lng; r.presisi_lokasi = h.presisi_lokasi; r.sumber_lokasi = { jenis: 'geoBoundaries-pusat-wilayah', adm: h.adm, wilayah: h.nama, url: h.adm === 'ADM2' ? 'https://www.geoboundaries.org/api/current/gbOpen/IDN/ADM2/' : 'https://www.geoboundaries.org/api/current/gbOpen/IDN/ADM1/', lisensi: h.adm === 'ADM2' ? 'CC BY 3.0 IGO (BPS, WFP, OCHA ROAP)' : 'ODbL 1.0', tanggal_ambil: TGL, catatan: 'titik pusat wilayah (poligon terluas), bukan lokasi proyek' }; }
    r.tingkat_bukti = 'media'; r.publik = true; r.dari_berita = true;
    proyek.push(r); tB++;
  }
  return { tS, tP, tB };
}

if (process.argv.includes('--selftest')) {
  const d = { sumber: [{ id: 'b01', media: 'M', tanggal: '2026-01-01', url: 'https://x/a', catatan: 'c', tingkat_bukti: 'media' }], perkaya: [{ id: 'pj_1', status: [{ nilai: 'rencana', s: 'b01' }] }], baru: [{ id: 'pjb_1', nama: 'PSEL X', teknologi: 'biomassa-sampah', provinsi: 'Bali', kabupaten_kota: null, status: [{ nilai: 'rencana', s: 'b01' }] }] };
  const mk = () => [{ id: 'pj_1', nama: [{ nilai: 'A', sumber_id: 's1' }], status: [] }];
  const pu = { adm1: { Bali: { lat: 1, lng: 2, asli: 'Bali' } }, adm2: [] };
  const P = mk(), S = [];
  assert.deepEqual(terapkan(d, P, S, pu), { tS: 1, tP: 1, tB: 1 });
  assert.deepEqual(terapkan(d, P, S, pu), { tS: 0, tP: 0, tB: 0 }); // idempoten
  assert.equal(P[1].lat, 1); assert.equal(P[0].status[0].sumber_id, 'sb01');
  console.log('selftest ok');
} else {
  const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/proyek_berita.json'), 'utf8'));
  const f = (n) => path.join(DIR, n);
  const proyek = baca(f('proyek.jsonl')), sumber = baca(f('sumber.jsonl'));
  const pusat = JSON.parse(fs.readFileSync(path.join(DIR, 'raw/geo/pusat.json'), 'utf8'));
  const h = terapkan(data, proyek, sumber, pusat);
  tulis(f('proyek.jsonl'), proyek); tulis(f('sumber.jsonl'), sumber);
  console.log(JSON.stringify(h));
}
