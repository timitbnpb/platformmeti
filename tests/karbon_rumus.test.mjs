// Uji acuan kalkulator emisi dihindari dan REC (F65-103): tiap rumus dihitung ulang dari contoh tertulis, termasuk tepi.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { energiTahun, emisiDihindari, nilai, hitungHindar, JAM_TAHUN } from "../public/inti/karbon_rumus.js";

test("energi tahunan = MW x 8760 x faktor kapasitas", () => {
  assert.equal(JAM_TAHUN, 8760);
  assert.equal(energiTahun(10, 20), 17520);
  assert.equal(energiTahun(1, 100), 8760);
  assert.equal(energiTahun(0, 20), 0);
});

test("masukan tak sah = null, bukan nol", () => {
  for (const v of [NaN, -1, undefined, null, "10", Infinity]) {
    assert.equal(energiTahun(v, 20), null);
    assert.equal(energiTahun(10, v), null);
    assert.equal(emisiDihindari(v, 1), null);
    assert.equal(nilai(1, v), null);
  }
  assert.equal(energiTahun(10, 101), null);
});

test("emisi dihindari dan nilai: contoh 10 MW, FK 20 persen, 0,79 t/MWh, Rp 60.000/t, Rp 35.000/REC", () => {
  const h = hitungHindar({ mw: 10, fk: 20, fe: 0.79, hargaKarbon: 60000, hargaRec: 35000 });
  assert.equal(h.mwh, 17520);
  assert.ok(Math.abs(h.tco2 - 13840.8) < 1e-6);
  assert.ok(Math.abs(h.nilaiKarbon - 830448000) < 1e-3);
  assert.equal(h.rec, 17520);
  assert.equal(h.nilaiRec, 613200000);
});

test("harga kosong: volume tetap keluar, nilai null", () => {
  const h = hitungHindar({ mw: 10, fk: 20, fe: 0.79, hargaKarbon: NaN, hargaRec: NaN });
  assert.equal(h.mwh, 17520); assert.ok(h.tco2 > 0);
  assert.equal(h.nilaiKarbon, null); assert.equal(h.nilaiRec, null);
  const kosong = hitungHindar({ mw: NaN, fk: NaN, fe: 0.79, hargaKarbon: 1, hargaRec: 1 });
  assert.deepEqual(kosong, { mwh: null, tco2: null, nilaiKarbon: null, rec: null, nilaiRec: null });
});

test("faktor emisi per sistem tersedia dan bersumber di karbon_pasar.json", () => {
  const P = JSON.parse(readFileSync(new URL("../public/data/karbon_pasar.json", import.meta.url), "utf8"));
  const g = P.faktor_emisi.grid_est;
  assert.ok(g.length >= 3);
  for (const s of g) { assert.ok(s.id && s.nama && s.tahun && s.tabel, "sistem tanpa rujukan"); assert.ok(s.intensitas_t_per_mwh > 0 && s.intensitas_t_per_mwh < 2); }
});

test("modul rumus tidak menyimpan harga atau faktor emisi", () => {
  const src = readFileSync(new URL("../public/inti/karbon_rumus.js", import.meta.url), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
  assert.deepEqual(src.match(/\b\d+(\.\d+)?\b/g).filter((x) => !["8760", "100", "0", "1"].includes(x)), []);
});
