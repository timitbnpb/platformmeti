#!/usr/bin/env node
// Pelacak PSEL/WTE nasional -> public/data/psel.json (turunan public/data/proyek.json + data/global/wte/psel_overlay.json + Perpres 35/2018, 109/2025).
//   node scripts/panen/psel.mjs --selftest | --bangun        (tanpa jaringan; tanggal dari overlay)
// Tidak mengarang: tipping fee, tahun, isu, harga PPA proyek diisi hanya bila ada di sumber proyek; tarif regulasi dipisah dari PPA proyek.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { idPenyedia } from './global_wte.mjs';

const AKAR = fileURLToPath(new URL('../..', import.meta.url));
const J = (f) => JSON.parse(fs.readFileSync(AKAR + f, 'utf8'));
const URUT = ['mangkrak', 'rencana', 'lelang', 'ppa', 'konstruksi', 'cod', 'beroperasi'];
const PENGEMBANG_UMUM = /^(IPP|PLN|SH-PLN)$/;
export const statusTerjauh = (st = []) => { const v = st.map((s) => s.nilai).filter((n) => URUT.includes(n)); return v.length ? v.reduce((a, b) => URUT.indexOf(b) > URUT.indexOf(a) ? b : a) : null; };
export const wte = (r) => (r.program_ids || []).includes('wte') || r.teknologi === 'biomassa-sampah';

export function bangun(proyek = J('public/data/proyek.json'), ov = J('data/global/wte/psel_overlay.json'), pemasok = J('public/data/global/pemasok_wte.json')) {
  const idPem = Object.fromEntries(pemasok.baris.map((p) => [p.slug, p]));
  const kota35 = new Set(ov.regulasi.find((r) => r.id === 'perpres-35-2018').kota);
  const baris = proyek.baris.filter(wte).map((r) => {
    const kk = r.lokasi?.kabupaten_kota?.[0]?.nilai || null, w = ov.kota[kk || r.lokasi?.provinsi] || null;
    const kap = r.kapasitas || [];
    const hari = kap.filter((k) => /^ton.*hari/.test(k.satuan)), mw = kap.filter((k) => k.satuan === 'MW');
    const peng = (r.pihak?.pemilik || []).filter((p) => !PENGEMBANG_UMUM.test(p.nilai)).map((p) => ({ nama: p.nilai, organisasi_id: p.organisasi_id || null, catatan: p.catatan || null }));
    const pem = (ov.pemasok[r.id] || []).map((x) => { const p = idPem[x.pemasok]; return { pemasok_id: p.id, nama: p.nama, peran: x.peran }; });
    return { id: 'psel_' + r.id, proyek_id: r.id, nama: r.nama, kota: kk, provinsi: r.lokasi?.provinsi || w?.provinsi || null, kode_bps: w?.kode_bps || null,
      perpres_35_2018: kk ? kota35.has(kk) || (kk === 'Jakarta' && kota35.has('DKI Jakarta')) : false,
      kapasitas_ton_hari: [...new Set(hari.map((k) => k.nilai))], kapasitas_mw: [...new Set(mw.map((k) => k.nilai))],
      teknologi: null, pengembang: peng, penyedia_teknologi: pem, status: statusTerjauh(r.status), status_riwayat: (r.status || []).map((s) => ({ nilai: s.nilai, asli: s.status_asli || null, tanggal: s.tanggal || null })),
      cod_target: (r.cod_target || []).map((c) => c.nilai), nilai_investasi: r.nilai_investasi || [], tipping_fee: null, harga_ppa: null,
      isu: (r.status || []).filter((s) => /belum|kendala|tunda|mangkrak|gagal/i.test(s.status_asli || '')).map((s) => s.status_asli),
      regulasi_ids: r.regulasi_ids || [], tingkat_bukti: r.tingkat_bukti, sumber: (r.sumber || []).map((s) => ({ url: s.url, tingkat_bukti: s.tingkat_bukti, tanggal: s.tanggal })) };
  });
  return { lapis: 'publik', dibangun_pada: ov.tanggal_periksa, jumlah: baris.length, catatan: 'Tarif regulasi di bawah adalah ketentuan Perpres, BUKAN harga PPA proyek. tipping_fee/harga_ppa proyek kosong sampai ada sumber.', regulasi: ov.regulasi,
    kota_perpres_35_2018: ov.regulasi[0].kota.map((k) => ({ kota: k, kode_bps: ov.kota[k].kode_bps, proyek_ids: baris.filter((b) => b.kota === k || (k === 'DKI Jakarta' && b.kota === 'Jakarta')).map((b) => b.proyek_id) })), baris };
}
const a = process.argv;
if (a.includes('--selftest')) {
  assert.equal(statusTerjauh([{ nilai: 'rencana' }, { nilai: 'konstruksi' }]), 'konstruksi'); assert.equal(statusTerjauh([]), null);
  const b = bangun(); assert.ok(b.jumlah >= 20); assert.equal(b.kota_perpres_35_2018.length, 12);
  assert.ok(b.kota_perpres_35_2018.every((k) => k.proyek_ids.length && k.kode_bps)); assert.ok(b.baris.every((x) => x.sumber.length && x.sumber.every((s) => s.url && s.tingkat_bukti)));
  console.log('selftest ok', b.jumlah);
} else if (a.includes('--bangun')) { const b = bangun(); fs.writeFileSync(AKAR + 'public/data/psel.json', JSON.stringify(b) + '\n'); console.log('psel', b.jumlah); }
