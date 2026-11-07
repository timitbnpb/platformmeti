// public/data/hilirisasi.json: smelter nikel/aluminium/tembaga, prekursor, sel baterai + tautan captive power, organisasi, ekspor Comtrade, intensitas emisi (EST).
//   node scripts/pipa/hilirisasi.mjs [--selftest]      (tanpa jaringan; masukan: smelter_kurasi.mjs, captive_power.json, ekspor_comtrade.json, organisasi.json, korporat.json)
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { SMELTER } from '../panen/smelter_kurasi.mjs';
import { idEntitas } from './entitas_tambah.mjs';
import { ZONA } from './captive_power.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const baca = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));

/* Parameter terbuka (Hipotesis). Lingkup listrik saja: panas proses, reduktan batubara, dan asam tidak dihitung. */
export const PARAMETER = {
  mwh_per_ton: { matte: 30, rkef: 38, feni: 40, hpal: 9, aluminium: 14.5 }, // MWh listrik per ton produk (Ni kandungan, atau Al)
  kadar_ni_mhp: 0.35, // ton Ni per ton MHP
  faktor_emisi: { 'captive-pltu': null, jaringan: 0.8, 'ebt-hidro': 0 }, // tCO2e per MWh; captive diambil dari Climate TRACE zona
  faktor_emisi_captive_default: 0.95,
  jam: 8760,
  catatan: 'Intensitas = MWh per ton x faktor emisi sumber listrik. Hanya baris dengan kapasitas terpublikasi dan jenis yang punya angka MWh per ton yang dihitung; sel baterai dan alumina belum.',
};
const norm = (s) => String(s || '').toLowerCase().replace(/\b(pt|tbk|persero|limited|ltd|co)\b/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim();

export function bangun({ cp, ekspor, org, entitas, korporat, logoAda = () => false, tanggal }) {
  const kunci = new Map();
  for (const o of org.baris) for (const n of [o.nama, ...(o.nama_lain || [])]) kunci.set(norm(n), { id: o.id, nama: o.nama, logo: o.logo && logoAda(o.logo) ? o.logo : null });
  for (const e of entitas.baris) { const id = idEntitas(e.nama); for (const n of [e.nama, ...(e.nama_lain || [])]) if (!kunci.has(norm(n))) kunci.set(norm(n), { id, nama: e.nama, logo: null }); }
  const kor = new Map(korporat.perusahaan.map((k) => [norm(k.nama), k]));
  const plant = new Map(cp.pembangkit.map((p) => [p.nama, p]));
  const ebt = new Map(cp.proyek_konversi.map((p) => [p.nama, p]));
  const zonaCp = new Map(cp.kawasan.map((k) => [k.id, k]));
  const zonaDef = new Map(ZONA.map((z) => [z.id, z]));
  const efZona = (z) => { const k = zonaCp.get(z); return k && k.mwh_tahun ? k.emisi_tco2e / k.mwh_tahun : PARAMETER.faktor_emisi_captive_default; };

  const baris = SMELTER.map((s) => {
    const zona = s.zona ? zonaCp.get(s.zona) : null;
    const pem = (s.captive_nama || []).map((n) => plant.get(n)).filter(Boolean);
    const zonaPem = !pem.length && zona ? zona.pembangkit_ids.map((id) => cp.pembangkit.find((p) => p.id === id)).filter(Boolean) : [];
    const eb = (s.ebt_nama || []).map((n) => ebt.get(n)).filter(Boolean);
    const pemilik = s.pemilik.map((nama, i) => { const o = kunci.get(norm(nama)); return { nama: o?.nama || nama, negara: s.negara[Math.min(i, s.negara.length - 1)], org_id: o?.id ?? null, logo: o?.logo ?? null, korporat: kor.get(norm(nama))?.id ?? null }; });
    let ni = null, mwh_ton = null, listrik_gwh = null, mw_rata = null, ef = null, intensitas = null;
    if (s.kapasitas) {
      if (/Ni\/tahun/.test(s.kapasitas.satuan)) ni = s.kapasitas.nilai; else if (/MHP/.test(s.kapasitas.satuan)) ni = Math.round(s.kapasitas.nilai * PARAMETER.kadar_ni_mhp); else if (/Al\//.test(s.kapasitas.satuan)) ni = s.kapasitas.nilai;
      mwh_ton = s.jenis === 'aluminium' ? PARAMETER.mwh_per_ton.aluminium : PARAMETER.mwh_per_ton[s.jenis] ?? null;
      if (ni && mwh_ton) {
        listrik_gwh = Math.round((ni * mwh_ton) / 1000); mw_rata = Math.round((ni * mwh_ton) / PARAMETER.jam);
        ef = s.listrik === 'captive-pltu' ? efZona(s.zona) : PARAMETER.faktor_emisi[s.listrik] ?? null;
        if (ef !== null) intensitas = Number((mwh_ton * ef).toFixed(1));
      }
    }
    const eksporIso = s.jenis === 'sel' ? [] : s.rantai === 'logam' ? [] : ['cn'];
    return {
      id: s.id, nama: s.nama, rantai: s.rantai, jenis: s.jenis, produk: s.produk, kapasitas: s.kapasitas, ton_logam_tahun: ni, teknologi: s.teknologi, pemilik, status: s.status, ket_status: s.ket_status ?? null, tahun: s.tahun,
      lat: s.lat, lng: s.lng, zona: s.zona, kawasan_id: s.kawasan_id ?? zonaDef.get(s.zona)?.kawasan_id ?? null, provinsi: s.provinsi ?? zonaDef.get(s.zona)?.prov ?? null, kode_prov: s.kode_prov ?? zonaDef.get(s.zona)?.kode ?? null,
      sumber_listrik: s.listrik, tautan_listrik: s.dasar === 'kawasan' || (!pem.length && zonaPem.length) ? 'kawasan' : pem.length ? 'pemilik-sama' : null,
      pembangkit_ids: (pem.length ? pem : zonaPem).map((p) => p.id), mw_pembangkit: Math.round((pem.length ? pem : zonaPem).reduce((a, p) => a + p.mw_operasi, 0)), mw_pembangkit_konstruksi: Math.round((pem.length ? pem : zonaPem).reduce((a, p) => a + p.mw_konstruksi, 0)), ebt_ids: eb.map((e) => e.id),
      mwh_per_ton: mwh_ton, listrik_gwh_tahun: listrik_gwh, mw_rata: mw_rata, faktor_emisi: ef === null ? null : Number(ef.toFixed(3)), intensitas_tco2e_per_ton: intensitas,
      pembeli: s.pembeli ?? [], ekspor_utama: eksporIso, org_id: s.org ? kunci.get(norm(s.org))?.id ?? null : null, tingkat_bukti: s.bukti || 'laporan-publik', sumber: s.sumber,
    };
  });
  const op = baris.filter((b) => b.status === 'operasi');
  const nikel = baris.filter((b) => b.ton_logam_tahun && ['matte', 'rkef', 'feni', 'hpal'].includes(b.jenis));
  const konstruksi = (st) => nikel.filter((b) => b.status === st).reduce((a, b) => a + b.ton_logam_tahun, 0);
  return {
    lapis: 'hilirisasi', dibangun_pada: tanggal, parameter: PARAMETER,
    sumber: [{ id: 'kurasi', judul: 'Kurasi smelter dan baterai (scripts/panen/smelter_kurasi.mjs), sumber per baris', penerbit: 'METI Network', url: 'https://platformmeti.timitbnpb.workers.dev', tingkat_bukti: 'laporan-publik' }, ekspor.sumber],
    meta: {
      jumlah: baris.length, jumlah_operasi: op.length, jumlah_smelter_nikel: baris.filter((b) => ['matte', 'rkef', 'feni', 'hpal'].includes(b.jenis)).length,
      nikel_ton_operasi: konstruksi('operasi'), nikel_ton_konstruksi: konstruksi('konstruksi'), tanpa_kapasitas: baris.filter((b) => !b.kapasitas).length,
      mwh_per_ton: PARAMETER.mwh_per_ton,
    },
    ekspor: { hs: ekspor.hs, nilai: ekspor.nilai, diambil: ekspor.diambil },
    baris,
  };
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--selftest')) {
    assert.equal(norm('PT Vale Indonesia Tbk'), 'vale indonesia'); assert.ok(SMELTER.every((s) => s.sumber.length && s.sumber.every((x) => /^https:\/\//.test(x.url))));
    assert.equal(new Set(SMELTER.map((s) => s.id)).size, SMELTER.length);
    console.log('selftest hilirisasi ok');
  } else {
    const logoAda = (l) => fs.existsSync(path.join(ROOT, 'public', l));
    const d = bangun({ cp: baca('public/data/captive_power.json'), ekspor: baca('data/industri/ekspor_comtrade.json'), org: baca('public/data/organisasi.json'), entitas: baca('data/direktori/entitas_tambah.json'), korporat: baca('public/data/korporat.json'), logoAda, tanggal: '2026-11-08' });
    fs.writeFileSync(path.join(ROOT, 'public/data/hilirisasi.json'), JSON.stringify(d, null, 1) + '\n');
    console.log('hilirisasi:', d.baris.length, 'baris;', JSON.stringify(d.meta));
  }
}
