// Peristiwa proyek dari berita: tautkan berita.json ke proyek.json (nama pembangkit + lokasi, ketat) lalu ekstrak peristiwa bertanggal
// (groundbreaking, COD/peresmian, PPA, pendanaan, penundaan, pembatalan) -> public/data/proyek_peristiwa.json; status_terbaru ke proyek.json.
//   node scripts/pipa/proyek_peristiwa.mjs            bangun (tanpa jaringan; masukan: public/data/berita.json, peristiwa_ebt.json, proyek.json)
//   node scripts/pipa/proyek_peristiwa.mjs terapkan   bangun + isi proyek.status_terbaru (tidak menyentuh proyek.status sumber asli)
//   node scripts/pipa/proyek_peristiwa.mjs --selftest
// Hanya judul (tidak ada isi artikel). Tanggal = tanggal terbit berita (bukan tanggal kejadian). Semua baris perlu_tinjau; tingkat bukti media
// (peristiwa_ebt ESDM: situs-sendiri). Cocok = SEMUA token nama khas proyek ada di judul DAN lokasi tidak bertentangan (provinsi sama bila keduanya diketahui);
// nama khas satu token hanya bila >= 6 huruf dan unik di seluruh proyek; nama kembar di beberapa proyek wajib lokasi cocok.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { norm } from './cocok_proyek.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const GENERIK = new Set('plta pltm pltmh pltp pltb plts pltbm pltsa pltbg pltn pltu pltg pltd pltgu pembangkit listrik tenaga surya bayu angin air panas bumi uap unit tahap phase power plant project proyek energi baru terbarukan psel sampah asal bess baterai penyimpanan terapung atap ground mounted psn nomor mw kw mwp gw gunung sungai danau waduk wilayah kerja wkp kabupaten kota provinsi desa kecamatan pt ii iii iv v vi dan di ke dari the of for hybrid hibrida'.split(' '));
let GEO = new Set('sumatera jawa kalimantan sulawesi papua maluku bali nusa tenggara barat timur utara selatan tengah'.split(' '));   // nama pulau/arah = bukan nama pembangkit
const khas = (s) => norm(s).split(' ').filter((t) => t.length > 2 && !GENERIK.has(t) && !GEO.has(t) && !/^\d+$/.test(t));
const PROV_KUNCI = (s) => norm(s);

export const PERISTIWA = [
  ['pembatalan', /\b(dibatalkan|batal(kan)?|dihentikan|menarik diri|mangkrak)\b/],
  ['penundaan', /\b(ditunda|tertunda|menunda|mundur|molor|diundur|ditangguhkan)\b/],
  ['groundbreaking', /\b(groundbreaking|peletakan batu pertama|mulai dibangun|dimulai pembangunan|pembangunan dimulai|mulai konstruksi|ground breaking)\b/],
  ['cod', /\b(cod|beroperasi komersial|mulai beroperasi|resmi beroperasi|diresmikan|resmikan|peresmian|sinkron|energize)\b/],
  ['ppa', /\b(ppa|jual beli tenaga listrik|jual beli listrik|teken kontrak|penandatanganan kontrak|kontrak jual beli)\b/],
  ['pendanaan', /\b(pendanaan|pembiayaan|financial close|pinjaman|kredit sindikasi|investasi rp|suntikan dana|menyuntik)\b/],
];
const STATUS = { groundbreaking: 'konstruksi', cod: 'beroperasi', pembatalan: 'dibatalkan', penundaan: 'ditunda' };
const MASA_DEPAN = /\b(ditarget(kan)?|target(kan)?|akan|segera|rencana|bakal|bidik|ditargetkan|menjelang|sebelum)\b/;   // rencana bukan peristiwa
export const jenis = (judul) => { const t = norm(judul), j = (PERISTIWA.find(([, re]) => re.test(t)) || [null])[0]; return j && MASA_DEPAN.test(t) && !/^(pembatalan|penundaan)$/.test(j) ? null : j; };

export function siapkan(proyek) {
  GEO = new Set([...GEO, ...proyek.flatMap((p) => norm(p.lokasi?.provinsi || '').split(' ')).filter((t) => t.length > 2)]);
  const nama = proyek.map((p) => ({ p, ns: [p.nama, ...(p.nama_lain || [])].map(khas).filter((a) => a.length) }));
  const df = new Map(); for (const { p, ns } of nama) for (const t of new Set(ns.flat())) df.set(t, (df.get(t) || 0) + 1);
  const namaKembar = new Map(); for (const { p, ns } of nama) for (const a of ns) { const k = [...a].sort().join(' '); (namaKembar.get(k) || namaKembar.set(k, new Set()).get(k)).add(p.id); }
  return { nama, df, namaKembar };
}
/** Kembalikan [{proyek, kecocokan}] untuk satu berita. wilayahProv: Set provinsi (nama baku) dari berita, boleh kosong. */
export function tautkan(judul, wilayahProv, S) {
  const tj = new Set(norm(judul).split(' ')), out = [];
  for (const { p, ns } of S.nama) {
    const provP = p.lokasi?.provinsi;
    for (const a of ns) {
      if (![...a].every((t) => tj.has(t))) continue;
      if (a.length === 1 && !(a[0].length >= 6 && S.df.get(a[0]) === 1)) continue;
      const kembar = S.namaKembar.get([...a].sort().join(' '))?.size > 1;
      const lokKonflik = provP && wilayahProv.size && !wilayahProv.has(provP);
      if (lokKonflik) continue;
      const lokCocok = provP && wilayahProv.has(provP);
      if (kembar && !lokCocok) continue;
      out.push({ proyek: p, kecocokan: lokCocok ? 'nama+lokasi' : 'nama-khas' }); break;
    }
  }
  return out;
}
export function bangun(berita, ebt, proyek, tgl) {
  const S = siapkan(proyek), baris = [], lihat = new Set();
  const tambah = (r) => { const k = r.proyek_id + '|' + r.sumber_url; if (lihat.has(k)) return; lihat.add(k); baris.push(r); };
  for (const b of berita) {
    const j = jenis(b.judul); if (!j) continue;
    for (const { proyek: p, kecocokan } of tautkan(b.judul, new Set((b.wilayah || []).map((w) => w.prov).filter(Boolean)), S))
      tambah({ id: `pb_${b.id}_${p.id}`, proyek_id: p.id, proyek_nama: p.nama, peristiwa: j, tanggal: b.terbit.slice(0, 10), tanggal_jenis: 'terbit-berita', judul: b.judul, media: b.media, sumber_url: b.url, kecocokan, perlu_tinjau: true, tanggal_periksa: tgl, tingkat_bukti: 'media' });
  }
  for (const e of ebt) {   // peristiwa_ebt ESDM: sudah punya proyek_id nama-saja; terima hanya yang lolos aturan ketat yang sama
    const j = e.peristiwa === 'peresmian' ? 'cod' : e.peristiwa === 'batal-tunda' ? (jenis(e.judul) || 'penundaan') : e.peristiwa === 'ppa' ? 'ppa' : jenis(e.judul); if (!j) continue;
    for (const { proyek: p, kecocokan } of tautkan(e.judul, new Set(e.provinsi ? [e.provinsi] : []), S))
      tambah({ id: `pe_${e.id}_${p.id}`.slice(0, 120), proyek_id: p.id, proyek_nama: p.nama, peristiwa: j, tanggal: e.tanggal, tanggal_jenis: 'terbit-berita', judul: e.judul, media: 'esdm.go.id', sumber_url: e.sumber_url, kecocokan, perlu_tinjau: true, tanggal_periksa: tgl, tingkat_bukti: e.tingkat_bukti });
  }
  return baris.sort((a, b) => b.tanggal.localeCompare(a.tanggal) || (a.id < b.id ? -1 : 1));
}
/** status_terbaru per proyek: peristiwa terbaru yang memetakan ke status; hanya bila lebih baru dari 2026-01-01 dan beda dari status sumber asli. */
export function statusTerbaru(baris, proyek) {
  const per = new Map(proyek.map((p) => [p.id, p])), out = new Map();
  for (const r of baris) { const st = STATUS[r.peristiwa]; if (!st || out.has(r.proyek_id)) continue; if (per.get(r.proyek_id)?.status?.[0]?.nilai === st) continue;
    out.set(r.proyek_id, { nilai: st, peristiwa: r.peristiwa, tanggal: r.tanggal, judul: r.judul, sumber_url: r.sumber_url, media: r.media, tingkat_bukti: r.tingkat_bukti, perlu_tinjau: true, tanggal_periksa: r.tanggal_periksa }); }
  return out;
}
function selftest() {
  assert.equal(jenis('PLTS Terapung Gajah Mungkur Mulai Dibangun, Investasi Rp1 T'), 'groundbreaking'); assert.equal(jenis('PLTP X ditunda'), 'penundaan'); assert.equal(jenis('Harga batu bara'), null); assert.equal(jenis('PLTS Saguling ditargetkan beroperasi April 2027'), null); assert.equal(jenis('PLTP X resmi beroperasi'), 'cod');
  const P = [{ id: 'a', nama: 'PLTS Terapung Gajah Mungkur', lokasi: { provinsi: 'Jawa Tengah' } }, { id: 'b', nama: 'PLTA Kembar Raya', lokasi: { provinsi: 'Aceh' } }, { id: 'c', nama: 'PLTM Kembar Raya', lokasi: { provinsi: 'Riau' } }, { id: 'd', nama: 'PLTB Bayu Sumatera', lokasi: { provinsi: 'Aceh' } }, { id: 'e', nama: 'PLTP Sorik Marapi', lokasi: { provinsi: 'Sumatera Utara' } }];
  const S = siapkan(P);
  assert.deepEqual(tautkan('PLTS Terapung Gajah Mungkur dibangun', new Set(), S).map((x) => x.proyek.id), ['a']);
  assert.deepEqual(tautkan('PLTS Gajah Mungkur dibangun', new Set(['Jawa Barat']), S), []);   // lokasi bertentangan
  assert.deepEqual(tautkan('Kembar Raya dibangun', new Set(), S), []);                              // kembar tanpa lokasi
  assert.deepEqual(tautkan('Kembar Raya dibangun', new Set(['Aceh']), S).map((x) => x.proyek.id), ['b']);
  assert.deepEqual(tautkan('PLTB Bayu Sumatera beroperasi', new Set(), S), []);                // semua token generik = tak cocok
  assert.deepEqual(tautkan('Sorik di Sumut', new Set(), S), []);                               // satu token khas harus semua nama, dua token
  const bs = bangun([{ id: 'x', judul: 'PLTS Terapung Gajah Mungkur Mulai Dibangun', url: 'https://u/1', media: 'm', terbit: '2026-10-01T00:00:00Z' }], [], P, '2026-11-08');
  assert.equal(bs.length, 1); assert(bs[0].sumber_url && bs[0].tanggal_periksa && bs[0].tingkat_bukti); assert.equal(statusTerbaru(bs, P).get('a').nilai, 'konstruksi');
  console.log('selftest ok');
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--selftest')) selftest();
  else {
    const J = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data', f), 'utf8'));
    const tgl = process.env.TANGGAL_BANGUN || '2026-11-08';
    const pr = J('proyek.json'), baris = bangun(J('berita.json').baris, J('peristiwa_ebt.json').baris, pr.baris, tgl), st = statusTerbaru(baris, pr.baris);
    const out = { lapis: 'publik', dibangun_pada: tgl, jumlah: baris.length, jumlah_proyek: new Set(baris.map((r) => r.proyek_id)).size, catatan: 'Judul berita saja; tanggal = tanggal terbit berita; semua perlu_tinjau; kecocokan nama khas + lokasi tidak bertentangan.', baris };
    fs.writeFileSync(path.join(ROOT, 'public/data/proyek_peristiwa.json'), JSON.stringify(out)); console.log('peristiwa', baris.length, 'proyek', out.jumlah_proyek, 'status_terbaru', st.size, Object.fromEntries(baris.reduce((m, r) => m.set(r.peristiwa, (m.get(r.peristiwa) || 0) + 1), new Map())));
    if (process.argv.includes('terapkan')) { for (const p of pr.baris) { delete p.status_terbaru; if (st.has(p.id)) p.status_terbaru = st.get(p.id); } fs.writeFileSync(path.join(ROOT, 'public/data/proyek.json'), JSON.stringify(pr) + (fs.readFileSync(path.join(ROOT, 'public/data/proyek.json'), 'utf8').endsWith('\n') ? '\n' : '')); }
  }
}
