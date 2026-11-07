#!/usr/bin/env node
// Bangun dataset tab Direktori anggota (/api/direktori/data/<n>) dari data-panen METI. Tanpa jaringan.
//   node scripts/pipa/data_direktori.mjs            tulis data-panen/direktori/<n>.json lalu pindai data pribadi
//   node scripts/pipa/data_direktori.mjs --selftest
// Bentuk keluaran mengikuti pembaca di public/direktori.js (ADAPTER/MUAT): riset, jejak_isu, pusat_studi, aset_riset,
// inovasi, sistem_data, pendanaan, dokumen. Web hasil periksa: data-panen/direktori/raw/web.json (panen_direktori.mjs --ambil).
// Tanpa surel, telepon, atau pendiri; tanggal dari masukan, bukan jam (R12 §8.6).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { pindai } from './potret.mjs';
import { REGISTRI, fokusDari } from '../panen/panen_direktori.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DP = path.join(ROOT, 'data-panen');
const OUT = path.join(DP, 'direktori');
const TGL = '2026-11-07';
export const NAMA = ['riset', 'jejak_isu', 'pusat_studi', 'aset_riset', 'inovasi', 'sistem_data', 'pendanaan', 'dokumen'];

const jsonl = (f) => (fs.existsSync(f) ? fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : []);
const json = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
// huruf disisipkan di tengah supaya id tidak pernah berupa 10 digit murni (dibaca pemindai sebagai ponsel)
const hash = (s) => { const h = crypto.createHash('sha1').update(s).digest('hex').slice(0, 10); return h.slice(0, 5) + 'x' + h.slice(5); };
const bersih = (o) => JSON.parse(JSON.stringify(o, (k, v) => (v === null || v === '' || (Array.isArray(v) && !v.length) ? undefined : v)));
const SEKTOR_NAMA = { surya: 'surya', bayu: 'bayu (angin)', hidro: 'hidro', 'panas-bumi': 'panas bumi', bioenergi: 'bioenergi', 'biomassa-sampah': 'biomassa dan sampah', nuklir: 'nuklir', hidrogen: 'hidrogen', laut: 'energi laut', penyimpanan: 'penyimpanan', jaringan: 'jaringan', efisiensi: 'efisiensi', elektrifikasi: 'elektrifikasi', karbon: 'karbon', pembiayaan: 'pembiayaan', kebijakan: 'kebijakan', industri: 'industri', 'transisi-adil': 'transisi adil', 'riset-data': 'riset dan data' };

// ---------- riset + jejak_isu dari pakar.jsonl ----------
const doiBaku = (d) => String(d || '').toLowerCase().replace(/^https?:\/\/(dx\.)?doi\.org\//, '');
const judulKunci = (j) => String(j || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
// Karya teratas seorang pakar bisa di luar energi (membran, enzim): hanya judul bertema energi yang masuk, sektor dari judulnya dulu.
const KATA_SEKTOR = { surya: /solar|photovolt|\bpv\b|surya/i, bayu: /\bwind\b|angin|turbin/i, hidro: /hydropower|hydro-?electric|\bpico\b|mikrohidro|\bhydro\b/i, 'panas-bumi': /geotherm|panas bumi/i, bioenergi: /biofuel|biodiesel|biogas|bioethanol|bioenergy|biomass|biomassa|bio-oil|pyrolysis|gasification|palm oil|\bcpo\b/i, nuklir: /nuclear|nuklir|thorium/i, hidrogen: /hydrogen|hidrogen|fuel cell|electrolyz|electrolys/i, penyimpanan: /batter|lithium|supercapacitor|energy storage|accumulator|baterai/i, jaringan: /smart grid|power grid|power system|microgrid|transmission|distribution network|jaringan listrik/i, efisiensi: /energy efficien|energy saving|efisiensi energi|energy conservation/i, elektrifikasi: /electric vehicle|\bev\b|electrification|elektrifikasi|kendaraan listrik/i, karbon: /carbon capture|co2|carbon dioxide|decarboni|emission|karbon|\bccs\b|\bccus\b/i, pembiayaan: /green financ|energy invest|subsid/i, kebijakan: /energy polic|renewable energy polic|energy transition|transisi energi/i };
export const sektorJudul = (j) => Object.entries(KATA_SEKTOR).filter(([, re]) => re.test(j)).map(([k]) => k);
const ENERGI = /energy|energi|renewable|terbarukan|electric|listrik|power plant|power generation|photocatal.*hydrogen|oil|fuel|ethanol|\bgas\b|coal|batubara/i;
export function bangunRiset(pakar) {
  const peta = new Map();
  for (const p of pakar) {
    const utama = (p.kepakaran || []).filter((k) => k.utama).map((k) => k.kode), kode = utama.length ? utama : (p.kepakaran || []).slice(0, 1).map((k) => k.kode);
    for (const w of [...(p.karya_teratas || []), ...(p.karya_terbaru || [])]) {
      if (!w.judul || !w.tahun) continue;
      const sj = sektorJudul(w.judul); if (!sj.length && !ENERGI.test(w.judul)) continue;
      const k = doiBaku(w.doi) || judulKunci(w.judul) + '|' + w.tahun;
      const x = peta.get(k) || { judul: w.judul, tahun: w.tahun, sitasi: 0, doi: w.doi || undefined, penulis: [], pakar: [], sektor: new Set(), kampus: p.afiliasi?.institusi || undefined, prov: new Set() };
      x.sitasi = Math.max(x.sitasi, w.sitasi || 0);
      if (!x.penulis.includes(p.nama)) x.penulis.push(p.nama);
      if (!x.pakar.includes(p.openalex_id)) x.pakar.push(p.openalex_id);
      (sj.length ? sj : kode).forEach((c) => x.sektor.add(c));
      if (p.afiliasi?.provinsi) x.prov.add(String(p.afiliasi.provinsi));
      peta.set(k, x);
    }
  }
  return [...peta.entries()].map(([k, x]) => bersih({ id: 'rs-' + hash(k), judul: x.judul, tahun: x.tahun, sitasi: x.sitasi, doi: x.doi, penulis: x.penulis, pakar: x.pakar, sektor: [...x.sektor].sort(), kampus: x.kampus, sumber: 'openalex', wilayah: [...x.prov].sort().map((prov) => ({ prov })) }))
    .sort((a, b) => b.sitasi - a.sitasi || b.tahun - a.tahun || a.id.localeCompare(b.id));
}
export function bangunJejak(riset) {
  const per = {};
  for (const r of riset) for (const s of r.sektor || []) (per[s] ||= []).push(r);
  const kejadian = Object.entries(per).filter(([, a]) => a.length >= 5).sort((a, b) => b[1].length - a[1].length).map(([s, a]) => {
    const tahun = {}; a.forEach((r) => { tahun[r.tahun] = (tahun[r.tahun] || 0) + 1; });
    const pk = {}; a.forEach((r) => (r.pakar || []).forEach((i) => { pk[i] = (pk[i] || 0) + 1; }));
    const th = Object.keys(tahun).map(Number).sort((x, y) => x - y), nm = SEKTOR_NAMA[s] || s;
    return { id: 'jr-' + s, nama: `Jejak riset ${nm} di Indonesia`, jenis: s, tanggal: '',
      jejak: { ringkasan: `${a.length} karya ${nm} oleh pakar Indonesia di direktori, terbit ${th[0]} sampai ${th.at(-1)}. Dihitung dari karya teratas dan terbaru tiap pakar di OpenAlex, jadi bukan seluruh karya.`,
        kronologi: th.map((y) => ({ tanggal: String(y), teks: `${tahun[y]} karya ${nm}.`, sumber: 'https://openalex.org' })) },
      riset: { works_total: a.length, works: a.slice(0, 12).map((r) => bersih({ judul: r.judul, tahun: r.tahun, sitasi: r.sitasi, doi: r.doi })), pakar: Object.entries(pk).sort((x, y) => y[1] - x[1] || x[0].localeCompare(y[0])).slice(0, 30).map(([id]) => ({ id })) } };
  });
  return { diperbarui: TGL, kejadian };
}

// ---------- pusat_studi, aset_riset, sistem_data dari registri + hasil periksa web ----------
export function bangunWeb(web) {
  const h = web?.hasil || {}, tgl = web?.diambil || TGL;
  const pusat = REGISTRI.pusat_studi.filter((e) => h[e.id]?.ok).map((e) => bersih({ id: e.id, nama: e.nama, singkatan: e.singkatan, induk: e.induk, kota: e.kota, prov: e.prov, fokus: e.fokus || h[e.id].fokus, web: e.web, sumber_url: e.web, nama_terverifikasi: true, diperiksa: tgl }));
  const aset = REGISTRI.aset_riset.filter((e) => h[e.id]?.ok).map((e) => bersih({ id: e.id, nama: e.nama, jenis: e.jenis, pemilik: e.pemilik, unit: e.unit, kota: e.kota, prov: e.prov, sektor: e.sektor || h[e.id].fokus, layanan: e.layanan, web: e.web, sumber_url: e.web, diperiksa: tgl,
    catatan_sumber: e.hanya_alih ? 'Situs lama P3TKEBTKE dialihkan resmi ke ' + e.hanya_alih + '; isi laman tujuan tidak dibaca (robots).' : undefined }));
  const sistem = REGISTRI.sistem_data.filter((e) => h[e.id] && (h[e.id].ok || /robots|menolak/.test(h[e.id].catatan))).map((e) => {
    const hidup = h[e.id].ok, { harus, ...x } = e;
    return bersih({ ...x, status: hidup ? 'hidup' : 'belum diperiksa', cara_minta: hidup ? undefined : 'Pemeriksaan otomatis ditolak situs (' + h[e.id].catatan + '); buka manual.', sumber: [{ url: e.portal_url }], diperiksa: tgl, cakupan_internasional: e.cakupan_internasional || false });
  });
  return { pusat, aset, sistem };
}

// ---------- inovasi ----------
const PROV_KOTA = [[/jakarta/i, '31'], [/tangerang/i, '36'], [/bekasi|bandung|bogor|depok/i, '32'], [/denpasar|badung/i, '51'], [/deli serdang|medan/i, '12'], [/surabaya|malang/i, '35'], [/yogya|sleman/i, '34'], [/semarang/i, '33']];
const provKota = (k) => PROV_KOTA.find(([re]) => re.test(k || ''))?.[1];
export function klasifikasi1001(label) {
  const t = String(label || '');
  if (/solar/i.test(t)) return { jenis: 'surya atap dan proyek surya', sektor: ['surya'] };
  if (/swap/i.test(t)) return { jenis: 'penukaran baterai kendaraan listrik', sektor: ['penyimpanan', 'elektrifikasi'] };
  if (/\bEV\b|electric|charging/i.test(t)) return { jenis: 'kendaraan listrik dan pengisian', sektor: ['elektrifikasi'] };
  if (/biofuel|\bUCO\b/i.test(t)) return { jenis: 'bahan bakar nabati', sektor: ['bioenergi'] };
  if (/waste-to-carbon|carbonization/i.test(t)) return { jenis: 'karbonisasi limbah', sektor: ['biomassa-sampah', 'karbon'] };
  if (/carbon|MRV|REDD/i.test(t)) return { jenis: 'platform dan proyek karbon', sektor: ['karbon'] };
  return null;
}
export function bangunInovasi(brin, lomba, p1001) {
  const a = [];
  for (const b of brin) a.push(bersih({ id: 'in-' + b.id, nama: b.nama, ringkasan: `Riset kolaborasi ${b.unit} dengan ${b.mitra}; diberitakan ${b.tanggal_berita}.`, jenis: 'riset kolaborasi', status: 'purwarupa', sektor: ['surya'], pembuat: [{ nama: b.unit, jenis: 'lembaga riset' }], mitra: [b.mitra], web: b.sumber_url, sumber: [{ url: b.sumber_url }], diperiksa: b.tanggal_ambil }));
  for (const l of lomba) a.push(bersih({ id: 'in-' + l.id, nama: l.nama, ringkasan: `Pemenang ${l.penghargaan}.`, jenis: 'penghargaan inovasi', tahun: String(l.tanggal).slice(0, 4), sektor: ['panas-bumi', 'bioenergi'], pembuat: [{ nama: l.penerima, jenis: 'BUMN' }], klaim: `${l.penghargaan} (${l.penyelenggara})`, web: l.sumber_url, sumber: [{ url: l.sumber_url }], diperiksa: l.tanggal_ambil }));
  for (const s of p1001.filter((p) => p.jenis_entitas === 'startup')) {
    const k = klasifikasi1001(s.label_bidang); if (!k) continue;
    const prov = provKota(s.kantor?.kota);
    a.push(bersih({ id: 'in-1001-' + s.slug, nama: s.nama, ringkasan: `Startup ${k.jenis}, berkantor di ${s.kantor?.kota || 'Indonesia'}. Dicatat dari sensus 1001startup.id.`, jenis: k.jenis, tahun: s.tahun_berdiri, sektor: k.sektor, pembuat: [{ nama: s.nama, jenis: 'startup' }],
      penerapan: s.kantor?.kota ? [{ lokasi: s.kantor.kota, prov }] : undefined, web: s.situs_resmi, sumber: [{ url: s.situs_resmi || s.url_halaman }], via: '1001startup.id', diperiksa: s.tanggal_ambil }));
  }
  return a.sort((x, y) => x.id.localeCompare(y.id));
}

// ---------- pendanaan ----------
export function bangunPendanaan(jetp, hijau, idxc) {
  const a = [], sumber = (u) => [{ url: u }];
  const kom = jetp.find((r) => r.jenis === 'komitmen');
  if (kom) a.push(bersih({ id: 'pd-jetp', nama: 'Just Energy Transition Partnership (JETP) Indonesia', jenis: 'dana iklim', pemberi: 'Kelompok Mitra Internasional (IPG) dan GFANZ', sasaran: ['transisi energi', 'pensiun dini PLTU', 'EBT'], besaran: `US$ ${kom.total_usd_miliar} miliar (IPG ${kom.ipg_usd_miliar} miliar, GFANZ ${kom.gfanz_usd_miliar} miliar)`, status: 'berjalan', sektor: ['pembiayaan', 'transisi-adil'], url: kom.sumber_url, sumber: sumber(kom.sumber_url), diperiksa: kom.tanggal, jenis_entri: 'skema' }));
  for (const g of hijau.filter((r) => r.jenis === 'penerbitan')) a.push(bersih({ id: 'pd-' + hash(g.isin), nama: g.instrumen, jenis: 'instrumen domestik', pemberi: 'Kementerian Keuangan (DJPPR)', sasaran: ['proyek hijau pemerintah'], besaran: `${g.satuan} ${g.nilai}${g.tenor_tahun ? `, tenor ${g.tenor_tahun} tahun` : ''}${g.kupon_persen ? `, kupon ${String(g.kupon_persen).replace('.', ',')}%` : ''}`, status: 'diterbitkan', sektor: ['pembiayaan'], url: g.sumber_url, sumber: sumber(g.sumber_url), diperiksa: g.tanggal, jenis_entri: 'skema' }));
  const ter = idxc.filter((r) => r.periode).sort((x, y) => y.periode.localeCompare(x.periode))[0];
  if (ter) a.push(bersih({ id: 'pd-idxcarbon', nama: 'Bursa Karbon Indonesia (IDXCarbon)', jenis: 'dana iklim', pemberi: 'Bursa Efek Indonesia', sasaran: ['perdagangan unit karbon'], besaran: `Sampai ${ter.periode}: ${ter.volume_ytd_tco2e.toLocaleString('id-ID')} tCO2e diperdagangkan, Rp ${ter.nilai_ytd_idr.toLocaleString('id-ID')}`, status: 'berjalan', sektor: ['karbon', 'pembiayaan'], url: ter.halaman_sumber, sumber: sumber(ter.sumber_url), diperiksa: ter.tanggal_periksa, jenis_entri: 'skema' }));
  for (const p of jetp.filter((r) => r.jenis === 'portofolio' && r.proyek && !/MRT/.test(r.proyek))) a.push(bersih({ id: 'pd-jetp-' + hash(p.proyek), nama: p.proyek, pemberi: 'JETP Indonesia', pelaksana: undefined, sektor: p.teknologi ? [p.teknologi] : ['pembiayaan'], nilai_usd: p.nilai_usd_juta != null ? p.nilai_usd_juta * 1e6 : undefined, status: 'portofolio', url: p.sumber_url, sumber: sumber(p.sumber_url), diperiksa: p.tanggal, jenis_entri: 'proyek' }));
  return a;
}

// ---------- dokumen ----------
const TOPIK = { surya: 'surya', angin: 'bayu', hidro: 'hidro', panas_bumi: 'panas-bumi', bioenergi: 'bioenergi', nuklir: 'nuklir', hidrogen: 'hidrogen', penyimpanan: 'penyimpanan', jaringan: 'jaringan', efisiensi: 'efisiensi', karbon: 'karbon', harga: 'pembiayaan', insentif: 'pembiayaan', perizinan: 'kebijakan', perencanaan: 'kebijakan', tkdn: 'industri' };
const JENIS_PERATURAN = { uu: 'UU', pp: 'PP', perpres: 'Perpres', permen: 'Permen', perda: 'Perda', inpres: 'Inpres', keppres: 'Keppres', perppu: 'Perppu' };
export function bangunDokumen(regulasi, pustaka) {
  const a = [];
  for (const r of regulasi.filter((x) => x.status !== 'dicabut')) {
    const sing = JENIS_PERATURAN[r.jenis], no = r.nomor ? ` ${r.nomor}/${r.tahun}` : '';
    a.push(bersih({ judul: sing ? `${sing}${no}: ${r.judul}` : r.judul, jenis: 'regulasi', tahun: r.tahun, sektor: [...new Set((r.topik || []).map((t) => TOPIK[t]).filter(Boolean))], url: r.url_pdf || r.url_sumber, sumber_url: r.url_sumber }));
  }
  for (const p of pustaka.filter((x) => x.jenis !== 'regulasi' && x.rahasia === false && x.lapis === 'publik')) a.push(bersih({ judul: p.judul, jenis: p.jenis, tahun: Number(String(p.tanggal).slice(0, 4)) || undefined, sektor: p.kepakaran }));
  return a.sort((x, y) => (y.tahun || 0) - (x.tahun || 0) || x.judul.localeCompare(y.judul));
}

export function bangunSemua() {
  const pakar = jsonl(path.join(DP, 'orang/pakar.jsonl')), riset = bangunRiset(pakar);
  const webF = path.join(OUT, 'raw/web.json'), web = bangunWeb(fs.existsSync(webF) ? json(webF) : null);
  return {
    riset, jejak_isu: bangunJejak(riset), pusat_studi: web.pusat, aset_riset: web.aset, sistem_data: web.sistem,
    inovasi: bangunInovasi(jsonl(path.join(DP, 'inovasi/brin.jsonl')), jsonl(path.join(DP, 'inovasi/lomba.jsonl')), jsonl(path.join(DP, '1001/perusahaan.jsonl'))),
    pendanaan: bangunPendanaan(jsonl(path.join(DP, 'keuangan/jetp.jsonl')), jsonl(path.join(DP, 'keuangan/green_finance.jsonl')), jsonl(path.join(DP, 'karbon/idxcarbon.jsonl'))),
    dokumen: bangunDokumen(json(path.join(ROOT, 'public/data/regulasi.json')).baris, json(path.join(ROOT, 'public/data/pustaka.json')).baris),
  };
}

function selftest() {
  const r = bangunRiset([{ openalex_id: 'A1', nama: 'Ani', kepakaran: [{ kode: 'surya', utama: true }], afiliasi: { institusi: 'UX', provinsi: '33' }, karya_teratas: [{ judul: 'PV', tahun: 2020, sitasi: 5, doi: 'https://doi.org/10.1/x' }], karya_terbaru: [] },
    { openalex_id: 'A2', nama: 'Budi', kepakaran: [{ kode: 'surya', utama: true }], karya_teratas: [], karya_terbaru: [{ judul: 'PV', tahun: 2020, sitasi: 9, doi: 'https://DOI.org/10.1/X' }] }]);
  assert.equal(r.length, 1); assert.deepEqual(r[0].penulis, ['Ani', 'Budi']); assert.equal(r[0].sitasi, 9);
  assert.equal(klasifikasi1001('mobility — EV battery-swapping network').sektor[0], 'penyimpanan'); assert.equal(klasifikasi1001('Agritech SaaS'), null);
  assert(pindai('hubungi a.b@gmail.com').length, 'pemindai harus menangkap surel pribadi');
  console.log('selftest ok');
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--selftest')) selftest();
  else {
    const h = bangunSemua(); fs.mkdirSync(OUT, { recursive: true }); const temuan = [];
    for (const n of NAMA) {
      const s = JSON.stringify(h[n]);
      for (const t of pindai(s)) temuan.push(`${n}: ${t}`);
      fs.writeFileSync(path.join(OUT, n + '.json'), s);
      console.log(n.padEnd(12), String(Array.isArray(h[n]) ? h[n].length : h[n].kejadian.length).padStart(6), (Buffer.byteLength(s) / 1024).toFixed(0).padStart(6) + ' KB');
    }
    if (temuan.length) { console.error('GAGAL pemindai data pribadi:\n' + temuan.slice(0, 30).join('\n')); process.exit(1); }
    console.log('pemindai data pribadi: bersih');
  }
}
