#!/usr/bin/env node
// Wilayah, ASEAN, dan rantai PLTS -> public/data/{wilayah,asean,rantai_plts}.json (lapis publik saja, statis, tanpa rute Worker).
// Masukan: data-panen/wilayah/{provinsi,asean}.jsonl, data-panen/perusahaan/perusahaan.jsonl, public/data/{proyek,regulasi,organisasi,orang,program}.json.
//   node scripts/pipa/potret_wilayah.mjs            bangun
//   node scripts/pipa/potret_wilayah.mjs --selftest
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const jsonl = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
const pub = (n) => JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data', n), 'utf8'));
const TANGGAL = process.env.TANGGAL_BANGUN || '2026-11-07';

// titik pusat kota (perkiraan, pengetahuan umum; bukan lokasi pabrik) untuk peta pabrikan
export const KOTA = {
  Bandung: [-6.917, 107.619], 'Kabupaten Bandung': [-7.02, 107.55], Bekasi: [-6.235, 106.992], Kendal: [-6.92, 110.2], Demak: [-6.89, 110.64],
  Batang: [-6.91, 109.73], Batam: [1.13, 104.05], Tangerang: [-6.178, 106.63], 'Tangerang Selatan': [-6.29, 106.71], Bogor: [-6.595, 106.8],
  Jakarta: [-6.2, 106.82], Pasuruan: [-7.645, 112.9], Mojokerto: [-7.47, 112.43], Kudus: [-6.8, 110.84],
};
const ALIAS = { 'daerah khusus ibukota jakarta': 'DKI Jakarta', 'daerah istimewa yogyakarta': 'DI Yogyakarta', 'bangka belitung': 'Kepulauan Bangka Belitung' };
export const namaProv = (s) => ALIAS[String(s || '').toLowerCase()] || s;
const nilai = (x) => (x && x.nilai != null ? x.nilai : null);
const sm = (x) => (x && x.nilai != null ? { nilai: x.nilai, satuan: x.satuan, tahun: x.tahun, sumber: x.sumber, halaman: x.halaman, url: x.sumber_url, tanggal: x.tanggal_periksa } : null);
const kosong = (x) => ({ nilai: null, alasan: x?.alasan_kosong || null, tanggal: x?.tanggal_periksa || TANGGAL });

export function bangunWilayah() {
  const prov = jsonl('data-panen/wilayah/provinsi.jsonl');
  const atlas = new Map(jsonl('data-panen/wilayah/atlas.jsonl').map((a) => [String(a.kode), a]));
  const proyek = pub('proyek.json').baris, reg = pub('regulasi.json').baris, org = pub('organisasi.json').baris, orang = pub('orang.json').baris;
  const per = (a, f) => { const m = new Map(); for (const x of a) { const k = f(x); if (k) (m.get(k) || m.set(k, []).get(k)).push(x); } return m; };
  const pProv = per(proyek, (x) => namaProv(x.lokasi?.provinsi));
  const pPerda = per(reg.filter((x) => x.jenis === 'perda' && /^Pemerintah Provinsi /.test(x.instansi_penerbit)), (x) => namaProv(x.instansi_penerbit.replace('Pemerintah Provinsi ', '')));
  const pOrg = per(org, (x) => namaProv(x.lokasi?.provinsi));
  const orgNama = new Map(org.map((o) => [o.nama, o]));
  const baris = prov.map((p) => {
    const ps = (pProv.get(p.nama) || []).map((x) => ({ id: x.id, nama: x.nama, teknologi: x.teknologi, mw: x.kapasitas?.[0]?.nilai ?? null, satuan: x.kapasitas?.[0]?.satuan ?? null, status: x.status?.[0]?.nilai ?? null }));
    const os = pOrg.get(p.nama) || [];
    const ids = new Set(os.map((o) => o.nama));
    const pk = orang.filter((o) => ids.has(o.organisasi_terkini)).map((o) => ({ id: o.id, nama: o.nama, jabatan: o.jabatan_terkini, organisasi: o.organisasi_terkini }));
    const r = p.rued || {};
    return {
      kode: String(p.kode), nama: p.nama, diperbarui: p.diperbarui,
      terpasang_mw: sm(p.terpasang), per_teknologi_mw: p.terpasang?.per_teknologi_mw || {},
      rasio_elektrifikasi: sm(p.rasio_elektrifikasi),
      potensi_panas_bumi: sm(p.potensi?.['panas-bumi']),
      potensi_lain: Object.fromEntries(Object.entries(p.potensi || {}).filter(([k, v]) => k !== 'panas-bumi' && nilai(v) == null).map(([k, v]) => [k, kosong(v)])),
      rued: r.perda ? { perda: r.perda, url: r.url_sumber, target_ebt_persen: r.target_ebt_persen ?? null, kandidat: (r.kandidat || []).map((k) => ({ tahun: k.tahun, persen: k.persen })), tanggal: r.tanggal_periksa, catatan_kosong: r.target_ebt_persen == null ? r.ekstraksi || null : null } : { ...kosong(r), perda: null },
      jumlah_proyek: ps.length, proyek: ps,
      perda: (pPerda.get(p.nama) || []).map((x) => ({ id: x.id, nomor: x.nomor, tahun: x.tahun, judul: x.judul, status: x.status, url: x.url_sumber })),
      organisasi: os.map((o) => ({ id: o.id, nama: o.nama, kategori: o.kategori?.label || null })),
      pakar: pk,
      surya_atlas: atlas.get(String(p.kode)) ? (({ titik, surya_pvout_kwh_per_kwp_tahun: pvout, ghi_kwh_per_m2_tahun: ghi, dni_kwh_per_m2_tahun: dni, gti_optimal_kwh_per_m2_tahun: gti, sudut_optimal_derajat: sudut, suhu_udara_c: suhu, lat, lon, sumber, sumber_url, tanggal_periksa, lisensi, tingkat_bukti, catatan }) => ({ label: 'indikasi satu titik (' + titik + '), BUKAN rata-rata provinsi', titik: { lat, lng: lon, keterangan: titik }, pvout_kwh_per_kwp_tahun: pvout, ghi_kwh_per_m2_tahun: ghi, dni_kwh_per_m2_tahun: dni, gti_optimal_kwh_per_m2_tahun: gti, sudut_optimal_derajat: sudut, suhu_udara_c: suhu != null ? Math.round(suhu * 10) / 10 : null, sumber, url: sumber_url, tanggal: tanggal_periksa, lisensi, tingkat_bukti, catatan }))(atlas.get(String(p.kode))) : null,
    };
  });
  const tanpaLokasi = proyek.filter((x) => !x.lokasi?.provinsi).length;
  return { lapis: 'publik', dibangun_pada: TANGGAL, jumlah: baris.length, proyek_tanpa_provinsi: tanpaLokasi, baris };
}

const ekor = (a, n = 10) => (Array.isArray(a) ? a.slice(-n).map(({ tahun, nilai: v }) => ({ tahun, nilai: v })) : []);
const akhir = (a) => (Array.isArray(a) && a.length ? a[a.length - 1] : null);

export function bangunAsean() {
  const n = jsonl('data-panen/wilayah/asean.jsonl');
  const baris = n.map((c) => {
    const e = c.ember_via_owid || {}, ir = c.irena?.kapasitas_terpasang_mw?.['Total Renewable'], wb = c.world_bank || {};
    const tr = (e.tren || []).map((t) => ({ tahun: t.tahun, nilai: t.renewables_share_elec }));
    return {
      iso3: c.iso3, nama: c.nama,
      bauran_persen: akhir(tr), kapasitas_ebt_mw: akhir(ir), akses_persen: akhir(wb.akses_listrik_persen),
      tren_bauran: ekor(tr), tren_kapasitas: ekor(ir), tren_akses: ekor(wb.akses_listrik_persen),
    };
  });
  const s = n[0];
  return {
    lapis: 'publik', dibangun_pada: TANGGAL, jumlah: baris.length,
    sumber: {
      bauran: { sumber: s.ember_via_owid.sumber, url: s.ember_via_owid.sumber_url, lisensi: s.ember_via_owid.lisensi, tanggal: s.ember_via_owid.tanggal_periksa, keterangan: 'renewables_share_elec, persen dari pembangkitan listrik' },
      kapasitas: { sumber: s.irena.sumber, url: s.irena.sumber_url, lisensi: s.irena.lisensi, tanggal: s.irena.tanggal_periksa, keterangan: 'Total Renewable, MW' },
      akses: { sumber: s.world_bank.sumber, url: s.world_bank.sumber_url, lisensi: s.world_bank.lisensi, tanggal: s.world_bank.tanggal_periksa, keterangan: 'EG.ELC.ACCS.ZS, persen penduduk' },
    },
    baris,
  };
}

export function bangunRantai() {
  const p = jsonl('data-panen/perusahaan/perusahaan.jsonl').filter((x) => x.sumber?.some((s) => s.id === 'tabel-modul'));
  const sumber = p[0].sumber.find((s) => s.id === 'tabel-modul');
  const pabrikan = p.map((x) => ({
    id: x.perusahaan_id, nama: x.nama, kota: x.kantor_pusat?.kota || null, provinsi: x.kantor_pusat?.provinsi || null,
    mwp: x.kapasitas_mwp_tahun, pasar: x.pasar, apamsi: x.apamsi, tkdn: x.tkdn, bmp: x.bmp,
  })).sort((a, b) => (b.mwp ?? -1) - (a.mwp ?? -1) || a.nama.localeCompare(b.nama));
  const jml = (f) => pabrikan.filter(f).reduce((s, x) => s + (x.mwp || 0), 0);
  const total = jml(() => true), lokal = jml((x) => x.pasar === 'lokal'), ekspor = jml((x) => x.pasar !== 'lokal');
  const prog = pub('program.json').baris.find((x) => x.id === 'plts-100gw');
  const kota = {};
  for (const x of pabrikan) if (x.kota && KOTA[x.kota]) { const k = (kota[x.kota] ||= { kota: x.kota, lat: KOTA[x.kota][0], lng: KOTA[x.kota][1], pabrik: 0, mwp: 0 }); k.pabrik++; k.mwp += x.mwp || 0; }
  return {
    lapis: 'publik', dibangun_pada: TANGGAL,
    sumber: { judul: sumber.judul, jenis: sumber.jenis, diterima: sumber.diterima, tingkat_bukti: sumber.tingkat_bukti, tanggal: sumber.tanggal_periksa },
    ringkas: { pabrikan: pabrikan.length, tanpa_kapasitas: pabrikan.filter((x) => x.mwp == null).length, total_mwp: total, lokal_mwp: lokal, ekspor_mwp: ekspor, ekspor_hanya_mwp: jml((x) => x.pasar === 'ekspor'), keduanya_mwp: jml((x) => x.pasar === 'keduanya') },
    program: {
      id: 'plts-100gw', nama: prog?.nama || 'PLTS 100 GWp', target_gwp: 100, tahap_awal_gwp: 5.3, tahap_awal_proyek: 14, jadwal_selesai: null,
      sumber: 'Laporan Menteri ESDM kepada Presiden, peluncuran dan groundbreaking Program PLTS 100 GWp (materi IndoEBTKE ConEx ke-12)', tanggal_sumber: '2026-08-25', tanggal: TANGGAL,
      terlacak: { proyek: prog?.jumlah_proyek ?? 0, mw: prog?.kapasitas_mw ?? 0, sumber: 'public/data/program.json (METI, bersumber RUPTL dan materi publik)' },
    },
    kota: Object.values(kota), pabrikan,
  };
}

function tulis(nama, o) { fs.writeFileSync(path.join(ROOT, 'public/data', nama), JSON.stringify(o) + '\n'); console.log(nama, (JSON.stringify(o).length / 1024).toFixed(0) + ' KB'); }

if (process.argv.includes('--selftest')) {
  const w = bangunWilayah(), a = bangunAsean(), r = bangunRantai();
  assert.equal(w.jumlah, 38); assert.equal(a.jumlah, 10); assert.equal(r.ringkas.pabrikan, 40);
  assert.equal(Math.round(r.ringkas.total_mwp / 100) / 10, 24.9); assert.equal(Math.round(r.ringkas.ekspor_mwp / 100) / 10, 18.3);
  assert.ok(w.baris.every((b) => b.rued.perda || b.rued.nilai === null));
  assert.ok(!JSON.stringify([w, a, r]).match(/[\w.]+@[\w.]+/), 'tanpa surel');
  console.log('selftest ok');
} else {
  tulis('wilayah.json', bangunWilayah()); tulis('asean.json', bangunAsean()); tulis('rantai_plts.json', bangunRantai());
}
