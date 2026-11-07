/* Uji rumus /model-keuangan dengan kasus acuan yang dihitung tangan (lihat komentar tiap kasus). */
import { test } from "node:test";
import assert from "node:assert/strict";
import { npv, irr, anuitas, jadwalUtang, pajakTahunan, balikModal, hitungModel, tornado, skenario } from "../public/inti/model_keuangan_rumus.js";

const dekat = (a, b, tol = 1e-6) => assert.ok(Math.abs(a - b) <= tol, `${a} != ${b}`);

test("NPV: -100, 60, 60 pada 10 persen = -100 + 54,5454 + 49,5868 = 4,1322", () => {
  dekat(npv(0.1, [-100, 60, 60]), 4.132231, 1e-5);
});
test("IRR: -100 lalu 110 = tepat 10 persen; -100, 0, 121 = tepat 10 persen", () => {
  dekat(irr([-100, 110]), 0.1, 1e-9);
  dekat(irr([-100, 0, 121]), 0.1, 1e-9);
});
test("IRR null bila arus tak berganti tanda", () => {
  assert.equal(irr([-1, -2, -3]), null);
  assert.equal(irr([1, 2]), null);
});
test("anuitas 1000, 10 persen, 2 tahun = 100 / (1 - 1,1^-2) = 576,1905; bunga 0 = D/n", () => {
  dekat(anuitas(1000, 0.1, 2), 576.190476, 1e-5);
  assert.equal(anuitas(900, 0, 3), 300);
});
test("jadwal utang: bunga 100 lalu 52,381; saldo akhir 0", () => {
  const j = jadwalUtang(1000, 0.1, 2, 4);
  dekat(j[0].bunga, 100); dekat(j[0].pokok, 476.190476, 1e-5); dekat(j[1].bunga, 52.380952, 1e-5);
  dekat(j[1].saldo, 0, 1e-9); assert.equal(j[2].cicilan, 0);
});
test("pajak: rugi dibawa maju (-50 lalu 100 pada 22 persen = 11), libur menghapus tahun 1", () => {
  assert.deepEqual(pajakTahunan([-50, 100], 0.22).map((x) => +x.toFixed(6)), [0, 11]);
  assert.deepEqual(pajakTahunan([100, 100], 0.22, 1), [0, 22]);
});
test("balik modal: -100, 60, 60 = 1 + 40/60 = 1,6667 tahun", () => {
  dekat(balikModal([-100, 60, 60]), 1 + 40 / 60, 1e-9);
  assert.equal(balikModal([-100, 10]), null);
});

/* Kasus acuan: 1 MW, FK 0,1 -> 876.000 kWh/tahun; tarif Rp500 -> pendapatan Rp438 juta; opex USD10/kW x kurs 1000 x 1000 kW = Rp10 juta;
   EBITDA Rp428 juta; capex USD1000/kW x kurs 1000 = Rp1 miliar; umur 5, tanpa pajak/degradasi/eskalasi. Utang 50 persen (Rp500 juta), 10 persen, tenor 2:
   cicilan = 500e6 x 0,1 / (1 - 1,1^-2) = 288.095.238; DSCR = 428e6 / 288.095.238 = 1,48562. */
const acuan = { mw: 1, capexUsdKw: 1000, opexUsdKwThn: 10, kurs: 1000, fk: 0.1, degr: 0, umur: 5, tarif: 500, tarifTahun2: null, eskTarif: 0, eskOpex: 0,
  porsiBayar: 1, utang: 0.5, bunga: 0.1, tenor: 2, pajak: 0, libur: 0, susut: 5, diskonto: 0.1 };
test("model acuan: pendapatan, EBITDA, cicilan, DSCR", () => {
  const { baris, ringkas } = hitungModel(acuan);
  dekat(baris[1].energi, 876000, 1e-6); dekat(baris[1].pendapatan, 438e6, 1e-3); dekat(baris[1].ebitda, 428e6, 1e-3);
  dekat(baris[1].cicilan, 288095238.095, 1);
  dekat(ringkas.dscrMin, 1.48562, 1e-4);
  assert.equal(baris[3].dscr, null); // tenor selesai
  dekat(ringkas.capex, 1e9, 1e-3); dekat(ringkas.utang, 5e8, 1e-3);
});
test("model acuan: IRR proyek membuat NPV nol; balik modal 1e9/428e6 = 2,3364", () => {
  const { baris, ringkas } = hitungModel(acuan);
  dekat(npv(ringkas.irrProyek, baris.map((b) => b.arusProyek)), 0, 1); // galat < Rp1 dari Rp1 miliar
  dekat(ringkas.balikProyek, 1e9 / 428e6, 1e-9);
  assert.ok(ringkas.irrProyek > 0.3 && ringkas.irrProyek < 0.36); // 1e9 = 428e6 x a(5,r) -> a = 2,3364 -> r sekitar 33 persen
});
test("model acuan: LCOE = (capex + PV opex) / PV energi pada 10 persen, sekitar 312,6", () => {
  const a = (1 - 1.1 ** -5) / 0.1; // 3,790787
  dekat(hitungModel(acuan).ringkas.lcoe, (1e9 + 10e6 * a) / (876000 * a), 1e-6);
  dekat(hitungModel(acuan).ringkas.lcoe, 312.6, 0.2);
});
test("pajak penuh 22 persen dengan penyusutan: laba kena pajak = 428e6 - 200e6 = 228e6, pajak 50,16 juta", () => {
  const { baris } = hitungModel({ ...acuan, utang: 0, pajak: 0.22 });
  dekat(baris[1].susut, 200e6, 1e-3); dekat(baris[1].pajak, 228e6 * 0.22, 1e-3);
});
test("PPN terkapitalisasi 11 persen menambah capex; PPN DTP menghapusnya", () => {
  dekat(hitungModel({ ...acuan, ppn: 0.11, ppnPorsi: 1 }).ringkas.capex, 1.11e9, 1e-3);
  dekat(hitungModel({ ...acuan, ppn: 0.11, ppnPorsi: 1, ppnDtp: true }).ringkas.capex, 1e9, 1e-3);
});
test("tornado terurut menurut ayunan; skenario rendah < tengah < tinggi", () => {
  const tr = tornado({ ...acuan, pajak: 0.22 }, ["capexUsdKw", "tarif", "fk", "opexUsdKwThn", "bunga"], 0.2);
  for (let i = 1; i < tr.baris.length; i++) assert.ok(tr.baris[i - 1].ayun >= tr.baris[i].ayun);
  const b = tr.baris.find((x) => x.kunci === "capexUsdKw"); assert.ok(b.rendah > tr.dasar && b.tinggi < tr.dasar); // capex turun -> IRR naik
  const s = skenario(acuan, 0.1); assert.ok(s.rendah.irrProyek < s.tengah.irrProyek && s.tengah.irrProyek < s.tinggi.irrProyek);
});
