import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { pangsaLolos, premiPada, pasokan, rpKwpDariUsdW, capexPada, irrPada, simulasi, peta } from '../public/inti/simulasi_tkdn_rumus.js';
import { hitungModel } from '../public/inti/model_keuangan_rumus.js';

const near = (x, y, e = 1e-9) => assert.ok(Math.abs(x - y) < e, `${x} != ${y}`);
// Angka tangan: capex dasar 1000, kurs 1. Modul impor 100/kWp (0,1 USD/W), inverter impor 50/kWp.
const A = {
  capexDasarRpKwp: 1000, kurs: 1,
  modul: { usdW: 0.1, premiRef: 0.4, tkdnRef: 40, sertifikat: [10, 30, 50, 70], kapasitasGw: 10, kebutuhanGw: 8 },
  inverter: { usdW: 0.05, premiRef: 0.2, tkdnRef: 40, sertifikat: [35, 45], kapasitasGw: null, kebutuhanGw: 8 },
};
const KEU = { mw: 1, capexUsdKw: 0, opexUsdKwThn: 5, kurs: 1, fk: 0.2, degr: 0, umur: 20, tarif: 1, porsiBayar: 1, pajak: 0, susut: 20, diskonto: 0.1 };

test('pangsaLolos: hitung bernilai >= syarat, bobot, kosong', () => {
  assert.equal(pangsaLolos([10, 30, 50, 70], 30), 0.75);
  assert.equal(pangsaLolos([10, 30, 50, 70], 71), 0);
  near(pangsaLolos([{ tkdn: 20, bobot: 3 }, { tkdn: 60, bobot: 1 }], 50), 0.25);
  assert.equal(pangsaLolos([], 40), null);
});

test('premi linear lewat nol dan rpKwp', () => {
  near(premiPada(0.4, 40, 20), 0.2);
  near(premiPada(0.4, 40, 60), 0.6);
  assert.equal(rpKwpDariUsdW(0.1, 1), 100);
  assert.equal(rpKwpDariUsdW(0.1, 16000), 1600000);
});

test('pasokan: T=60 hanya sertifikat 70 lolos -> 10 x 0,25 = 2,5 GW lawan 8 GW', () => {
  const p = pasokan(A.modul, 60);
  near(p.kapasitasLolosGw, 2.5); near(p.rasio, 0.3125); near(p.kekuranganGw, 5.5); near(p.cakupan, 0.3125);
  const q = pasokan(A.modul, 20); // semua kecuali 10 lolos -> 7,5 GW lawan 8
  near(q.rasio, 0.9375); near(q.cakupan, 0.9375);
  const kosong = pasokan(A.inverter, 40); // kapasitas tak diketahui
  assert.equal(kosong.cakupan, null); assert.equal(kosong.pangsa, 0.5);
});

test('capexPada: modul T=20 -> +20; T=60 patuh +60, campur +60 x 0,3125 = 18,75; inverter T=40 -> +10', () => {
  const c20 = capexPada(A, 20, 0);
  near(c20.capexPatuh, 1020); near(c20.deltaPatuh, 20);
  near(c20.capexCampur, 1000 + 20 * 0.9375);
  const c60 = capexPada(A, 60, 0);
  near(c60.capexPatuh, 1060); near(c60.capexCampur, 1018.75);
  const ci = capexPada(A, 0, 40);
  near(ci.capexPatuh, 1010); near(ci.capexCampur, 1010); // kapasitas null -> cakupan dianggap 1
  const g = capexPada(A, 20, 40); near(g.capexPatuh, 1030);
  const nol = capexPada(A, 0, 0); near(nol.capexPatuh, 1000); near(nol.capexCampur, 1000);
});

test('irrPada = hitungModel langsung; capex naik -> IRR turun', () => {
  const i1 = irrPada(KEU, 1000), i2 = irrPada(KEU, 1200);
  near(i1.irrProyek, hitungModel({ ...KEU, capexUsdKw: 1000 }).ringkas.irrProyek);
  assert.ok(i2.irrProyek < i1.irrProyek);
});

test('simulasi: dasar tanpa syarat -> delta nol; syarat naik -> delta IRR negatif dan makin dalam', () => {
  const s0 = simulasi(A, KEU, 0, 0);
  near(s0.irr.deltaPatuh, 0); near(s0.irr.deltaCampur, 0);
  const s20 = simulasi(A, KEU, 20, 0), s60 = simulasi(A, KEU, 60, 0);
  assert.ok(s20.irr.deltaPatuh < 0 && s60.irr.deltaPatuh < s20.irr.deltaPatuh);
  assert.ok(s60.irr.deltaCampur > s60.irr.deltaPatuh); // impor menutup kekurangan -> IRR lebih tinggi daripada patuh penuh
});

test('peta: n modul x n inverter skenario', () => {
  assert.equal(peta(A, KEU, [0, 20, 40], [0, 40]).length, 6);
});

test('simulasi_tkdn.json: asumsi bersumber, sertifikat konsisten, hitung jalan', () => {
  const d = JSON.parse(fs.readFileSync(new URL('../public/data/global/simulasi_tkdn.json', import.meta.url), 'utf8'));
  const ids = new Set(d.sumber.map((s) => s.id));
  const tanpaSumber = [];
  const telusur = (o, p) => { if (o && typeof o === 'object') { if ('tingkat_bukti' in o && 'nilai' in o) { if (!['hipotesis', 'celah'].includes(o.tingkat_bukti) && !o.sumber) tanpaSumber.push(p); if (o.sumber && !ids.has(o.sumber)) tanpaSumber.push(p + ' sumber hilang'); } else for (const k in o) telusur(o[k], p + '.' + k); } };
  telusur(d.asumsi, 'asumsi');
  assert.deepEqual(tanpaSumber, []);
  assert.equal(d.sertifikat.modul.jumlah, d.sertifikat.modul.tkdn_persen.length);
  assert.ok(d.sertifikat.modul.jumlah >= 10);
  const s = d.asumsi, m = s.modul, i = s.inverter;
  const a = { capexDasarRpKwp: s.capex_dasar_rp_kwp.nilai, kurs: s.kurs_rp_usd.nilai,
    modul: { usdW: m.usd_w.nilai, premiRef: m.premi_ref.nilai, tkdnRef: m.tkdn_ref.nilai, sertifikat: d.sertifikat.modul.tkdn_persen, kapasitasGw: m.kapasitas_gw_tahun.nilai, kebutuhanGw: m.kebutuhan_gw_tahun.nilai },
    inverter: { usdW: i.usd_w.nilai, premiRef: i.premi_ref.nilai, tkdnRef: i.tkdn_ref.nilai, sertifikat: d.sertifikat.inverter.tkdn_persen, kapasitasGw: i.kapasitas_gw_tahun.nilai, kebutuhanGw: i.kebutuhan_gw_tahun.nilai } };
  const r = simulasi(a, s.keuangan, 40, 0);
  assert.ok(r.irr.dasar.irrProyek > 0.03 && r.irr.dasar.irrProyek < 0.3);
  assert.ok(r.irr.deltaPatuh < 0);
  // modul 40 persen: harga impor 0,1197 USD/Wp x 18129 = Rp 2,170 juta/kWp; premi 0,375 x 40/45 = 1/3 -> +Rp 723 ribu
  near(r.capex.deltaPatuh, 0.1197 * 1000 * 18129 * 0.375 * (40 / 45), 1);
});
