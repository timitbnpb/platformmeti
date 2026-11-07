import test from "node:test";
import assert from "node:assert/strict";
import * as K from "../public/inti/kelayakan_rumus.js";

const dekat = (a, b, tol) => assert.ok(Math.abs(a - b) <= tol, `${a} vs ${b}`);

test("produksi PLTS: PSH 5 x 365 x 0,8 = 1460 MWh/MW, FK 1/6", () => {
  assert.equal(K.produksiPlts(5), 1460);
  dekat(K.fk(1460), 1 / 6, 1e-9);
  assert.equal(K.produksiPlts(5, 0.8, 10), 14600);
});
test("bulanan PLTS: Januari 31 hari", () => {
  assert.equal(K.bulananPlts(Array(12).fill(5))[0], 5 * 31 * 0.8);
});
test("CRF 8% 25 tahun = 0,093679", () => dekat(K.crf(0.08, 25), 0.093679, 1e-6));
test("LCOE hitung tangan: (900 x 0,093679 + 15) / 1460 = 6,8021 sen USD/kWh", () => {
  dekat(K.lcoe({ capex: 900, opex: 15, umur: 25, wacc: 0.08, kwhPerKw: 1460 }), 6.8021, 0.002);
});
test("LCOE WACC 0: capex/umur + opex", () => {
  dekat(K.lcoe({ capex: 1000, opex: 10, umur: 20, wacc: 0, kwhPerKw: 1000 }), 6, 1e-9);
});
test("Weibull k=2: kurva rata 1 memberi FK 1 (tanpa rugi)", () => {
  dekat(K.fkBayu(7, { rugi: 0, kurva: { vIn: 0, vNominal: 0, vOut: 1e9 } }), 1, 1e-3);
});
test("FK PLTB naik dengan kecepatan angin dan nol tanpa angin", () => {
  assert.equal(K.fkBayu(0), 0);
  assert.ok(K.fkBayu(5) < K.fkBayu(7) && K.fkBayu(7) < K.fkBayu(9));
  const f = K.fkBayu(K.anginHub(6.5));
  assert.ok(f > 0.2 && f < 0.5, String(f));
});
test("gamma(1,5) = akar pi / 2", () => dekat(K.gamma(1.5), Math.sqrt(Math.PI) / 2, 1e-9));
test("patokan menurut tingkat dan tabel dari data", () => {
  assert.equal(K.patokan("surya", 0.5), 11.47);
  assert.equal(K.patokan("surya", 10), 8.26);
  assert.equal(K.patokan("bayu", 30), 9.54);
  const t = K.tabelDariData([{ kapasitas: "s.d. 5 MW", koef_1_10: 11.22 }, { kapasitas: ">5 MW s.d. 20 MW", koef_1_10: 10.26 }, { kapasitas: ">20 MW", koef_1_10: 9.54 }]);
  assert.equal(K.patokan("bayu", 12, t), 10.26);
  assert.equal(K.tabelDariData([{ kapasitas: "x" }]), null);
});
test("jarak, titik dalam poligon, BPP toleran, daya mikrohidro", () => {
  dekat(K.jarakKm(0, 0, 0, 1), 111.19, 0.1);
  const kotak = { type: "Polygon", coordinates: [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]] };
  assert.ok(K.didalam(5, 5, kotak) && !K.didalam(11, 5, kotak));
  assert.equal(K.bppDari({ bpp: null }), null);
  assert.equal(K.bppDari({ bpp: { rp_per_kwh: 1500 } }), 1500);
  assert.equal(K.bppDari({ bpp: 1300 }), 1300);
  dekat(K.dayaMikrohidro(0.5, 20), 68.67, 0.01);
});
