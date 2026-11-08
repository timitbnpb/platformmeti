// Bangun public/data/global/pelaku_global.json dari data/global/pelaku/panen.json + proyek.json + gem_pembangkit.json, lalu
// gabung ke data/direktori/entitas_tambah.json (idempoten, _asal "global_pelaku"). Tanpa jaringan.
//   node scripts/panen/global_pelaku_bangun.mjs <tanggal> | --selftest
import path from 'node:path';
import assert from 'node:assert/strict';
import { ROOT, TINGKAT, bacaJson, tulisJson, kelengkapan } from '../pipa/global_pemasok.mjs';
import { idEntitas } from '../pipa/entitas_tambah.mjs';
import { cocokProyek, kunciNama } from './global_lain_bangun.mjs';

const PERAN = { ipp: ['IPP', 'pengembang'], epc: ['EPC'], uji: ['lembaga'], konsultan: ['konsultan'], eca: ['pendana'], asuransi: ['pembiaya'], pembeli: [] };
const PERAN_PROYEK = { ipp: 'pengembang', epc: 'epc', uji: 'penguji', konsultan: 'konsultan', eca: 'pendana/penjamin', asuransi: 'penjamin', pembeli: 'pembeli' };
const KEPAKARAN = { surya: 'surya', bayu: 'bayu', 'panas-bumi': 'panas-bumi', hidro: 'hidro', hidrogen: 'hidrogen', transmisi: 'jaringan', jaringan: 'jaringan', baterai: 'penyimpanan', biomassa: 'bioenergi', biofuel: 'bioenergi', PLTU: 'batubara', smelter: 'industri', 'data-center': 'industri', hukum: 'kebijakan', 'penasihat-keuangan': 'pembiayaan' };
const KAT_KHUSUS = { 'Pertamina Geothermal Energy': 'bumn', 'Indonesia Infrastructure Guarantee Fund': 'bumn', 'PLN Puslitbang': 'bumn', 'LSPro PT PLN Persero': 'bumn', 'B4T Kementerian Perindustrian': 'bumn', 'Balai Besar Pengujian Perangkat Telekomunikasi': 'bumn', RE100: 'lsm-yayasan' };
const ALIAS = { TotalEnergies: 'TotalEnergies|Total Eren', 'Total Eren': 'Total Eren', Orsted: 'Orsted|Ørsted', 'Sembcorp Industries': 'Sembcorp', PowerChina: 'PowerChina|Power Construction Corporation', 'Hyundai Engineering and Construction': 'Hyundai Engineering|Hyundai E&C', 'Larsen and Toubro': 'Larsen & Toubro|L&T', 'Sterling and Wilson': 'Sterling and Wilson|Sterling & Wilson', 'Japan Bank for International Cooperation': 'JBIC|Japan Bank for International Cooperation', 'Indonesia Infrastructure Guarantee Fund': 'IIGF|Penjaminan Infrastruktur', 'Multilateral Investment Guarantee Agency': 'MIGA', 'TUV SUD': 'TÜV SÜD|TUV SUD', 'TUV Rheinland': 'TÜV Rheinland|TUV Rheinland', 'Sumitomo Corporation': 'Sumitomo Corporation', 'Mitsubishi Corporation': 'Mitsubishi Corporation', 'Pertamina Geothermal Energy': 'Pertamina Geothermal|PGE\\b', 'Star Energy Geothermal': 'Star Energy', 'Medco Power Indonesia': 'Medco Power', 'China Energy Engineering Corporation': 'China Energy Engineering|CEEC', 'Kansai Electric Power': 'Kansai Electric', 'Quantum Power Asia': 'Quantum Power', 'Amazon Web Services': 'Amazon Web Services', 'Vale Indonesia': 'Vale Indonesia', 'EDP Renewables': 'EDP Renewables|EDPR' };
const SINGKAT = new Set(['EDF', 'SGS', 'DNV', 'ReNew', 'WSP', 'UL', 'RE100', 'Arup', 'Apple', 'Google', 'Nvidia', 'Jacobs', 'AECOM', 'Lazard', 'Nestle', 'Danone', 'Allianz', 'ENGIE', 'JERA', 'Ricardo', 'Toyo']);
const esc = (s) => s.replace(/[.*+?^${}()[\]\\]/g, '\\$&');
export const aliasPelaku = (nama) => { const a = ALIAS[nama] || esc(nama); return `\\b(?:${a})\\b`; };
export const kategoriPelaku = (nama, kelompok, iso2) => KAT_KHUSUS[nama] || (kelompok === 'eca' || kelompok === 'asuransi' ? 'keuangan' : iso2 === 'ID' ? 'swasta' : 'internasional');

const bersih = (v) => typeof v === 'string' ? v.replace(/\s*—\s*/g, ', ').replace(/\s*·\s*/g, ' ') : Array.isArray(v) ? v.map(bersih) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, bersih(x)])) : v;
export function bangunSatu(r, tgl, proyek, gem, orgAda) {
  const w = r.wikidata, b = r.beranda, wk = r.wikipedia, fakta = [], sumber = [], catatan = [];
  const f = (medan, nilai, url, tingkat) => fakta.push({ medan, nilai, sumber_url: url, tanggal_periksa: tgl, tingkat_bukti: tingkat });
  const wdUrl = w ? `https://www.wikidata.org/wiki/${w.id}` : null;
  const situsOk = b.gagal ? false : true; const situsWd = w?.cocok === 'situs';
  const terverifikasi = situsOk || situsWd;
  if (situsOk) sumber.push({ url: r.situs, tingkat_bukti: 'situs-sendiri', tanggal_periksa: tgl, keterangan: 'beranda resmi' });
  if (w) sumber.push({ url: wdUrl, tingkat_bukti: 'via-pihak-ketiga', tanggal_periksa: tgl, keterangan: 'Wikidata (CC0)' });
  if (wk) sumber.push({ url: wk.url, tingkat_bukti: 'via-pihak-ketiga', tanggal_periksa: tgl, keterangan: 'Wikipedia (CC BY-SA)' });
  let iso2 = w?.iso2?.[0] || null;
  if (iso2) f('negara_iso2', iso2, wdUrl, 'via-pihak-ketiga');
  else if (situsOk) { iso2 = r.iso2_seed; catatan.push('negara dari daftar pemilik, belum terverifikasi Wikidata'); }
  if (w?.tahun_berdiri) f('tahun_berdiri', w.tahun_berdiri, wdUrl, 'via-pihak-ketiga');
  if (w?.deskripsi) f('deskripsi_wikidata', w.deskripsi, wdUrl, 'via-pihak-ketiga');
  if (b.deskripsi) f('deskripsi_situs', b.deskripsi.slice(0, 300), r.situs, 'situs-sendiri');
  if (b.indonesia) f('halaman_indonesia', b.indonesia, b.indonesia, 'situs-sendiri');
  const kut = (arr) => (arr || []).map((teks) => ({ teks, sumber_url: wk.url, tanggal_periksa: tgl, tingkat_bukti: 'via-pihak-ketiga' }));
  const pi = cocokProyek(aliasPelaku(r.nama), proyek, gem);
  const kaitan = pi.filter((x) => x.proyek_id).map((x) => ({ proyek_id: x.proyek_id, peran: PERAN_PROYEK[r.kelompok] || x.peran, peran_tercatat: x.peran, sumber_url: x.sumber_url, tingkat_bukti: x.tingkat_bukti }));
  const kepakaran = [...new Set(r.topik.map((t) => KEPAKARAN[t]).filter(Boolean))];
  if (r.kelompok === 'eca' || r.kelompok === 'asuransi') kepakaran.push('pembiayaan');
  const id = idEntitas(r.nama);
  return {
    id, org_id: orgAda.get(kunciNama(r.nama)) || id, nama: r.nama, negara_iso2: iso2, kelompok: r.kelompok, peran: [PERAN_PROYEK[r.kelompok]], topik: r.topik, situs: situsOk || situsWd ? r.situs : null, tahun_berdiri: w?.tahun_berdiri || undefined,
    kategori: kategoriPelaku(r.nama, r.kelompok, iso2), kepakaran: [...new Set(kepakaran)], peran_rantai: PERAN[r.kelompok],
    halaman_indonesia: b.indonesia || null, portofolio: kut(wk?.portofolio), kehadiran_indonesia: kut(wk?.indonesia), minat_komitmen: kut(wk?.komitmen),
    proyek_id: [...new Set(kaitan.map((k) => k.proyek_id))], ikatan_proyek: kaitan, proyek_indonesia: pi,
    logo: r.logo?.berkas ? `/img/logo/org/${r.logo.berkas}` : null, fakta, sumber, terverifikasi, catatan,
  };
}
export function validasi(p) {
  const s = [];
  if (!/^[A-Z]{2}$/.test(p.negara_iso2 || '')) s.push(`${p.nama}: negara_iso2`);
  if (!p.sumber.length) s.push(`${p.nama}: sumber`);
  for (const x of p.sumber) if (!/^https:\/\//.test(x.url) || !TINGKAT.has(x.tingkat_bukti) || !x.tanggal_periksa) s.push(`${p.nama}: sumber tak lengkap`);
  for (const x of [...p.fakta, ...p.portofolio, ...p.kehadiran_indonesia, ...p.minat_komitmen]) if (!x.sumber_url || !x.tanggal_periksa || !TINGKAT.has(x.tingkat_bukti)) s.push(`${p.nama}: butir tanpa sumber/tanggal/tingkat`);
  if (/[—·]/.test(JSON.stringify(p))) s.push(`${p.nama}: em dash/titik tengah`);
  return s;
}
export function indeks(daftar) {
  const per = (fn) => { const o = {}; for (const p of daftar) for (const k of fn(p)) (o[k] ||= []).push(p.org_id); return Object.fromEntries(Object.entries(o).sort()); };
  const proyek = {}; for (const p of daftar) for (const k of p.ikatan_proyek) (proyek[k.proyek_id] ||= []).push({ org_id: p.org_id, peran: k.peran });
  return { per_proyek: Object.fromEntries(Object.entries(proyek).sort()), per_negara: per((p) => [p.negara_iso2]), per_topik: per((p) => p.topik), per_kelompok: per((p) => [p.kelompok]) };
}
export function gabung(daftar, tgl, berkas = path.join(ROOT, 'data/direktori/entitas_tambah.json')) {
  const d = bacaJson(berkas); const lama = d.baris.filter((b) => b._asal !== 'global_pelaku'); const ada = new Set(lama.map((b) => idEntitas(b.nama)));
  const baru = [], lewat = [];
  for (const p of daftar) {
    if (p.org_id !== p.id || ada.has(p.id)) { lewat.push(p.nama); continue; }
    ada.add(p.id);
    baru.push({ _asal: 'global_pelaku', nama: p.nama, nama_lain: [], kategori: p.kategori, kepakaran: p.kepakaran, peran_rantai: p.peran_rantai, situs: p.situs || undefined,
      sumber: p.sumber.map((s) => ({ url: s.url, tingkat_bukti: s.tingkat_bukti, keterangan: s.keterangan })) });
  }
  d.baris = [...lama, ...baru]; if (!d.tanggal_periksa || d.tanggal_periksa < tgl) d.tanggal_periksa = tgl;
  tulisJson(berkas, d); return { baru: baru.length, sudah_ada_di_direktori: lewat.length };
}
if (process.argv[1] === new URL(import.meta.url).pathname) {
  if (process.argv.includes('--selftest')) {
    assert.match('Total Eren', new RegExp(aliasPelaku('Total Eren'))); assert.ok(!new RegExp(aliasPelaku('Allianz')).test('Allianzxyz'));
    assert.equal(kategoriPelaku('X', 'eca', 'JP'), 'keuangan'); assert.equal(kategoriPelaku('X', 'ipp', 'FR'), 'internasional'); assert.equal(kategoriPelaku('RE100', 'pembeli', 'GB'), 'lsm-yayasan');
    const pj = [{ id: 'pj_1', nama: 'X', tingkat_bukti: 'resmi', sumber: [{ id: 's1', url: 'https://a.id/' }], pihak: { pemilik: [{ nilai: 'Ormat Technologies', sumber_id: 's1' }] } }];
    const r = { nama: 'Ormat Technologies', kelompok: 'ipp', topik: ['panas-bumi'], situs: 'https://ormat.com/', iso2_seed: 'US', wikidata: { id: 'Q1', cocok: 'situs', iso2: ['US'] }, beranda: { judul: 'x' }, wikipedia: null, logo: null };
    const p = bangunSatu(r, '2026-11-08', pj, [], new Map()); assert.deepEqual(p.proyek_id, ['pj_1']); assert.equal(p.ikatan_proyek[0].peran, 'pengembang'); assert.deepEqual(validasi(p), []);
    assert.deepEqual(indeks([p]).per_proyek.pj_1, [{ org_id: p.id, peran: 'pengembang' }]);
    console.log('selftest ok');
  } else {
    const tgl = process.argv[2]; if (!/^\d{4}-\d\d-\d\d$/.test(tgl || '')) throw new Error('tanggal YYYY-MM-DD wajib');
    const panen = bacaJson(path.join(ROOT, 'data/global/pelaku/panen.json'));
    const proyek = bacaJson(path.join(ROOT, 'public/data/proyek.json')).baris, gem = bacaJson(path.join(ROOT, 'public/data/gem_pembangkit.json')).baris;
    const orgAda = new Map(bacaJson(path.join(ROOT, 'public/data/organisasi.json')).baris.map((o) => [kunciNama(o.nama), o.id]));
    const semua = panen.baris.map((r) => bersih(bangunSatu(r, tgl, proyek, gem, orgAda)));
    const lengkap = semua.filter((p) => p.terverifikasi && p.negara_iso2), tunda = semua.filter((p) => !lengkap.includes(p)).map((p) => p.nama);
    const salah = lengkap.flatMap(validasi); if (salah.length) throw new Error(salah.join('; '));
    const medan = { negara: (p) => p.negara_iso2, tahun_berdiri: (p) => p.tahun_berdiri, halaman_indonesia: (p) => p.halaman_indonesia, kehadiran_indonesia: (p) => p.kehadiran_indonesia.length, portofolio: (p) => p.portofolio.length, minat_komitmen: (p) => p.minat_komitmen.length, proyek_indonesia: (p) => p.proyek_id.length, logo: (p) => p.logo };
    tulisJson(path.join(ROOT, 'public/data/global/pelaku_global.json'), { lapis: 'publik', dibangun_pada: tgl, sumber: 'Wikidata (CC0), Wikipedia (CC BY-SA), beranda resmi, proyek.json, Global Energy Monitor (CC BY 4.0)', jumlah: lengkap.length, belum_terverifikasi: tunda, kelengkapan_persen: kelengkapan(lengkap, medan), ...indeks(lengkap), baris: lengkap.map(({ kategori, kepakaran, peran_rantai, terverifikasi, ...p }) => p) });
    console.log(lengkap.length, 'pelaku; tunda:', tunda.join(', ') || '-', gabung(lengkap, tgl), JSON.stringify(kelengkapan(lengkap, medan)));
  }
}
