#!/usr/bin/env node
// Pemasok komponen 7 teknologi di luar surya -> data/rantai/pemasok.json (dibaca rantai_pasok.mjs).
//   node scripts/pipa/rantai_teknologi.mjs --bangun   gabung sertifikat TKDN panenan (data-panen/rantai/tkdn) + data/rantai/seed.json + situs.json
//   node scripts/pipa/rantai_teknologi.mjs --nama     tulis data/rantai/nama_pemasok.json (masukan rantai_situs.mjs --cari)
//   node scripts/pipa/rantai_teknologi.mjs --selftest
// Aturan: komponen ditentukan dari NAMA PRODUK sertifikat (bukan kata kunci pencarian: pencarian teks penuh berisik); produk bukan
// komponen energi (obat, kimia boiler, ambulans) tidak masuk. Kapasitas hanya dari seed bersumber; kosong = null. Jasa (EPC/pengeboran) = jenis "jasa".
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const RAW = path.join(ROOT, 'data-panen/rantai/tkdn');
const D = (f) => path.join(ROOT, 'data/rantai', f);
const TGL = process.env.TGL_PANEN || '2026-11-08';
export const norm = (s) => String(s || '').toLowerCase().replace(/\([^)]*\)/g, ' ').replace(/\b(pt|tbk|persero|cv|perseroda|ud)\b/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim();
export const idTk = (nama) => 'tk_' + crypto.createHash('sha1').update(norm(nama)).digest('hex').slice(0, 8); // sama dengan potret.mjs

// [teknologi, komponen, pola produk]. Urutan = prioritas; satu sertifikat dapat memenuhi beberapa aturan.
const BUKAN = /pendingin|air conditioner|kendaraan|mobil|ambulan|karoseri|obat|treatment|scavenger|inhibitor|antiscalant|kimia|chemical|ipal|septik|septic|grease|videotron|semen|mortar|pelumas|ventilator|syringe|kompor|aspal|container sampah|incinerator|insinerator|klem|topi|rantai conveyor|cultivator|sampah|simulator|pembelajaran|ayam|kompos|burner|akumulator|aki\b|forging|hot rolled|seal|hanger/i;
export const ATURAN = [
  ['bayu', 'bilah', /bilah.*(turbin|angin)|wind turbine blade/i], ['bayu', 'menara', /(menara|tower).*(angin|wind|turbin)|wind tower/i], ['bayu', 'nacelle', /nacelle/i],
  ['bayu', 'gearbox_generator', /turbin angin|wind turbine|generator.*angin|pltb/i],
  ['hidro', 'turbin_hidro', /turbin (air|pelton|kaplan|francis|crossflow|cross flow)|micro ?hydro|mikro ?hidro|pltmh|runner|guide vane/i],
  ['hidro', 'generator', /generator (sinkron|hidro|mikro)|micro hydro generator|synchronous generator|alternator/i], ['hidro', 'pipa_pesat', /penstock|pipa pesat/i],
  ['panas_bumi', 'turbin_uap', /turbin uap|steam turbine/i], ['panas_bumi', 'pipa_uap', /pipa.*(panas bumi|geothermal|uap)|steam (pipe|line)/i], ['panas_bumi', 'kepala_sumur', /wellhead|x-?mas tree|kepala sumur/i],
  ['bioenergi', 'digester', /digester|biodigester|biogas(?!tron)/i], ['bioenergi', 'boiler_gasifier', /\bboiler\b|gasifi|ketel uap|steam generator|tungku biomassa/i],
  ['baterai', 'sel', /sel baterai|battery cell|\bcell\b/i], ['baterai', 'pack', /bater|battery|lifepo4|lithium|\bbess\b/i], ['baterai', 'bms_pcs', /\bbms\b|battery management|power conversion|\bpcs\b/i],
  ['hidrogen', 'elektroliser', /elektroli[sz]er|electroly[sz]er/i], ['hidrogen', 'tangki_tekan', /pressure vessel|bejana tekan|tangki (hidrogen|bertekanan)|hydrogen (tank|cylinder)|tabung gas/i],
  ['jaringan', 'inverter', /^inverter\b/i], ['jaringan', 'panel_tr', /panel (listrik|distribusi|tegangan|lv|mv|hubung)|switchgear|\bpanel\b.*(tr|lvmdp|mdp)/i],
  ['jaringan', 'trafo', /^transformator|trafo (distribusi|daya)|transformator \(trafo\)|power transformer/i], ['jaringan', 'kabel', /^kabel|\bcable\b|konduktor|conductor|twisted|acsr|aaac|nyy|nym/i],
];
const SYARAT_ENERGI = { baterai: /lithium|lifepo|lfp|\bion\b|bess|energy storage|storage|penyimpan|pack|cell|sel baterai/i }; // aki asam-timbal dsb. tidak dihitung sebagai penyimpan energi

// Komponen berproduk umum (bejana tekan, wellhead migas, boiler uap) ditandai relevansi 'umum': sertifikat tidak menyebut teknologi energinya.
const UMUM_KOMP = new Set(['hidrogen/tangki_tekan', 'panas_bumi/kepala_sumur', 'bioenergi/boiler_gasifier']);
export function klasifikasi(r) {
  const produk = String(r.produk || (r.spesifikasi || []).slice(0, 1).join(' ')).replace(/&amp;/g, '&'); // produk kosong: spesifikasi pertama
  if (!produk || BUKAN.test(produk + ' ' + (r.kelompok_barang || ''))) return [];
  const nama = [produk, r.tipe].filter(Boolean).join(' ');
  return ATURAN.filter(([, , re]) => re.test(produk))
    .filter(([t]) => t !== 'baterai' || SYARAT_ENERGI.baterai.test(nama + ' ' + (r.spesifikasi || []).join(' ')))
    .filter(([, k]) => !(k === 'tangki_tekan' && /oksigen/i.test(nama))).map(([t, k]) => [t, k, UMUM_KOMP.has(t + '/' + k) ? 'umum' : 'langsung']);
}
const tanpaDuplikat = (a) => [...new Set(a)];
const muatBaris = () => fs.existsSync(RAW) ? fs.readdirSync(RAW).filter((f) => f.endsWith('.json')).sort().flatMap((f) => { const d = JSON.parse(fs.readFileSync(path.join(RAW, f), 'utf8')); return d.rows.map((r) => ({ ...r, _url: d.url, _tgl: d.tanggal })); }) : [];
const kapital = (s) => s.replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();

export function bangun({ baris, seed = [], situs = {}, orgNorm = new Map(), tgl = TGL }) {
  const P = new Map(); // norm -> pemasok
  const ambil = (nama, dasar) => { const k = norm(nama); if (!P.has(k)) P.set(k, { id: orgNorm.get(k) || idTk(nama), org_id: orgNorm.get(k) || null, nama: kapital(nama).replace(/^PT\.?\s*/i, 'PT '), jenis: 'pabrikan', kota: null, provinsi: null, situs: situs[k]?.situs || null, pasar: null, anggota: [], komponen: {}, sumber: [], ...dasar }); return P.get(k); };
  for (const r of baris) {
    const kl = klasifikasi(r); if (!kl.length || !/^https:\/\//.test(r._url)) continue;
    const p = ambil(r.perusahaan, {});
    p.kota = p.kota || (r.lokasi && r.lokasi.length <= 40 && !/jl\.|jalan|\d/i.test(r.lokasi) ? r.lokasi.replace(/^(Kabupaten|Kota) /, '') : null); p.provinsi = p.provinsi || r.provinsi || null;
    for (const [t, k, rel] of kl) {
      const key = t + '/' + k, c = p.komponen[key] || (p.komponen[key] = { teknologi: t, komponen: k, relevansi: rel, produk: [], tkdn: null, kapasitas: null, satuan: null });
      c.produk = tanpaDuplikat([...c.produk, (r.produk || r.spesifikasi?.[0] || '').replace(/&amp;/g, '&').slice(0, 90)]).slice(0, 6); c.tkdn = Math.max(c.tkdn ?? -1, r.tkdn_persen ?? -1) < 0 ? null : Math.max(c.tkdn ?? -1, r.tkdn_persen ?? -1);
    }
    if (!p.sumber.some((s) => s.url === r._url)) p.sumber.push({ url: r._url, jenis: 'sertifikat-tkdn', tingkat_bukti: 'resmi', tanggal: r._tgl || tgl });
  }
  for (const s of seed) { // seed bersumber: wajib sumber[] berurl, tanggal, tingkat_bukti; kapasitas null bila tak disebut
    if (!s.nama || !(s.sumber || []).length || !s.sumber.every((x) => /^https:\/\//.test(x.url) && x.tanggal && x.tingkat_bukti)) { console.error('seed ditolak (tanpa sumber):', s.nama); continue; }
    const p = ambil(s.nama, {}); Object.assign(p, { jenis: s.jenis || p.jenis, kota: s.kota ?? p.kota, provinsi: s.provinsi ?? p.provinsi, pasar: s.pasar ?? p.pasar, anggota: s.anggota || p.anggota, induk: s.induk || p.induk, catatan: s.catatan || p.catatan });
    if (s.situs) p.situs = s.situs;
    for (const c of s.komponen) { const key = c.teknologi + '/' + c.komponen; p.komponen[key] = { produk: [], tkdn: null, kapasitas: null, satuan: null, ...p.komponen[key], ...c }; }
    p.sumber.push(...s.sumber);
  }
  const keluar = [...P.values()].map((p) => ({ ...p, komponen: Object.values(p.komponen).sort((a, b) => (a.teknologi + a.komponen).localeCompare(b.teknologi + b.komponen)), tanggal_periksa: tgl })).filter((p) => p.komponen.length && p.sumber.length)
    .sort((a, b) => a.nama.localeCompare(b.nama));
  return keluar;
}
function tulis() {
  const baca = (f, d) => (fs.existsSync(D(f)) ? JSON.parse(fs.readFileSync(D(f), 'utf8')) : d);
  const org = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/organisasi.json'), 'utf8')).baris;
  const orgNorm = new Map(org.map((o) => [norm(o.nama), o.id]));
  const p = bangun({ baris: muatBaris(), seed: baca('seed.json', []), situs: baca('situs.json', {}), orgNorm });
  const per = {}; for (const x of p) for (const c of x.komponen) (per[c.teknologi] ||= new Set()).add(x.id);
  fs.writeFileSync(D('pemasok.json'), JSON.stringify({ lapis: 'publik', dibangun_pada: TGL, sumber: 'tkdn.kemenperin.go.id/sertifikat (pencarian publik per kata kunci) + seed bersumber', pemasok: p }, null, 1));
  console.log('pemasok', p.length, Object.entries(per).map(([k, v]) => `${k}=${v.size}`).join(' '));
}
function selftest() {
  assert.deepEqual(klasifikasi({ produk: 'Transformator (Trafo) Distribusi', kelompok_barang: 'Peralatan Kelistrikan' }), [['jaringan', 'trafo', 'langsung']]);
  assert.deepEqual(klasifikasi({ produk: 'Boiler Water Treatment' }), []);
  assert.deepEqual(klasifikasi({ produk: 'Karoseri Modifikasi Ambulance', tipe: 'inverter' }), []);
  assert.ok(klasifikasi({ produk: 'Micro Hydro Generator' }).some(([, k]) => k === 'generator'));
  assert.equal(idTk('PT Indo Energi Elektrik'), 'tk_ac531297');
  const b = bangun({ baris: [{ perusahaan: 'PT X Trafo', produk: 'Transformator (Trafo) Distribusi', lokasi: 'Kota Bekasi', provinsi: 'Jawa Barat', tkdn_persen: 80, _url: 'https://tkdn.kemenperin.go.id/sertifikat?q=a', _tgl: '2026-11-08' }], seed: [{ nama: 'PT Tanpa Sumber', komponen: [], sumber: [] }] });
  assert.equal(b.length, 1); assert.equal(b[0].komponen[0].tkdn, 80); assert.equal(b[0].kota, 'Bekasi');
  console.log('selftest ok');
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const a = process.argv[2];
  if (a === '--selftest') selftest();
  else if (a === '--bangun') tulis();
  else if (a === '--nama') {
    const pm = fs.existsSync(D('pemasok.json')) ? JSON.parse(fs.readFileSync(D('pemasok.json'), 'utf8')).pemasok.map((x) => x.nama) : [];
    const pl = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/rantai_pasok.json'), 'utf8')).teknologi.flatMap((t) => t.komponen.flatMap((k) => k.pemasok.map((x) => x.nama)));
    const seen = new Map(); for (const n of [...pl, ...pm]) seen.set(norm(n), seen.get(norm(n)) || n);
    fs.writeFileSync(D('nama_pemasok.json'), JSON.stringify([...seen.values()].sort(), null, 0)); console.log(seen.size, 'nama');
  } else console.log('pakai: --bangun | --nama | --selftest');
}
