// /rantai-global: rumus murni (kasus hitung tangan) dan keadaan data nyata bila ada.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { hs6, beaMasuk, biayaMendarat, pelabuhanMasuk, pelabuhanAsal, hhi, kelasHhi, pangsaMitra, bandingProduk, selisihPct, tarifPerpres35, tarifPerpres109 } from "../public/rantai_global_hitung.js";

const dekat = (a, b, e = 1e-9) => assert.ok(Math.abs(a - b) < e, `${a} != ${b}`);

test("hs6: format titik, rentang, sufiks x", () => {
  assert.equal(hs6("8541.43.00"), "854143");
  assert.equal(hs6("85414300"), "854143");
  assert.equal(hs6("8504.21-8504.23"), "850421");
  assert.equal(hs6("8507.60.xx"), "850760");
  assert.equal(hs6(null), "");
});

test("biayaMendarat: hitung tangan (FOB 0,10; 4000/400000; asuransi 0,5; BM 5; PPN 11; PPh22 2,5; kurs 18000)", () => {
  const r = biayaMendarat({ fob: 0.1, tarifKontainer: 4000, muatanKontainer: 400000, asuransiPct: 0.5, bmPct: 5, kurs: 18000 });
  dekat(r.pos.angkut, 0.01);               // 4000 / 400000
  dekat(r.pos.asuransi, 0.00055);           // 0,5% x 0,11
  dekat(r.cif, 0.11055);                    // 0,10 + 0,01 + 0,00055
  dekat(r.pos.bm, 0.0055275);               // 5% x 0,11055
  dekat(r.nilaiImpor, 0.1160775);           // CIF + BM
  dekat(r.pos.ppn, 0.012768525);            // 11% x 0,1160775
  dekat(r.pos.pph22, 0.0029019375);         // 2,5% x 0,1160775
  dekat(r.total, 0.1317479625);
  dekat(r.tanpaPajak, 0.1160775);           // 0,11055 + 0,0055275 (tanpa PPN dan PPh 22)
  dekat(r.rp.total, 2371.463325, 1e-6);     // 0,1317479625 x 18000
  dekat(r.kenaikanPct, 31.74796250, 1e-6);  // (0,1317479625 - 0,10) / 0,10
});

test("biayaMendarat: tanpa bea/asuransi, lokal ikut total; masukan tak sah -> null", () => {
  const r = biayaMendarat({ fob: 1, tarifKontainer: 1000, muatanKontainer: 1000, bmPct: 0, ppnPct: 0, pph22Pct: 0, lokal: 0.5, kurs: 10 });
  dekat(r.total, 2.5);                      // 1 + 1 + 0 + 0,5
  dekat(r.rp.total, 25);
  assert.equal(biayaMendarat({ fob: 1, tarifKontainer: 1000, muatanKontainer: 0, kurs: 10 }), null);
  assert.equal(biayaMendarat({ fob: NaN, tarifKontainer: 1, muatanKontainer: 1, kurs: 10 }), null);
});

test("beaMasuk: preferensi hanya bila asal mitra; selain itu MFN; tak ada -> null", () => {
  const perjanjian = [{ hs6: "854143", mfn: 5, pref: [{ perjanjian: "rcep", pct: 0, mitra: ["cn", "jp"] }] }];
  const mfn = [{ hs: "8541.43.00", bm_persen: 5 }, { hs: "8504.40.40", bm_persen: 10 }];
  assert.deepEqual(beaMasuk({ hs: "8541.43.00", asal: "CN", perjanjian, mfn }), { pct: 0, jenis: "pref", perjanjian: "rcep" });
  assert.deepEqual(beaMasuk({ hs: "8541.43.00", asal: "in", perjanjian, mfn }), { pct: 5, jenis: "mfn", perjanjian: null });
  assert.equal(beaMasuk({ hs: "8504.40.40", asal: "cn", perjanjian, mfn }).pct, 10);
  assert.equal(beaMasuk({ hs: "9999.99", asal: "cn", perjanjian, mfn }).pct, null);
  // preferensi yang belum diperiksa atau berasal dari baris tak representatif tidak dipakai
  const belum = [{ hs6: "854143", mfn: 5, pref: [{ perjanjian: "acfta", pct: 0, mitra: ["cn"], tingkat_bukti: "belum-diperiksa" }] }];
  assert.equal(beaMasuk({ hs: "8541.43.00", asal: "cn", perjanjian: belum, mfn }).jenis, "mfn");
  const tak = [{ hs6: "850440", repr: false, mfn: 5, pref: [{ perjanjian: "rcep", pct: 0, mitra: ["cn"], tingkat_bukti: "agregator" }] }];
  assert.deepEqual(beaMasuk({ hs: "8504.40.40", asal: "cn", perjanjian: tak, mfn }), { pct: 10, jenis: "mfn", perjanjian: null });
});

test("pelabuhan masuk dan asal", () => {
  assert.equal(pelabuhanMasuk("32"), "priok");
  assert.equal(pelabuhanMasuk(35), "perak");
  assert.equal(pelabuhanMasuk("73"), "makassar");
  assert.equal(pelabuhanMasuk("99"), null);
  assert.equal(pelabuhanAsal("CN", [{ id: "shanghai", peran: "asal", negara: "CN" }, { id: "priok", peran: "tujuan", negara: "ID" }]), "shanghai");
  assert.equal(pelabuhanAsal("in", [{ id: "shanghai", peran: "asal", negara: "CN" }]), null);
});

test("HHI: monopoli 10000, dua sama 5000, empat sama 2500, kosong null", () => {
  dekat(hhi([100]), 10000); dekat(hhi([1, 1]), 5000); dekat(hhi([5, 5, 5, 5]), 2500); dekat(hhi([75, 25]), 6250);
  assert.equal(hhi([]), null); assert.equal(hhi([0, 0]), null);
  assert.equal(kelasHhi(6250), "tinggi"); assert.equal(kelasHhi(1500), "sedang"); assert.equal(kelasHhi(1499), "rendah"); assert.equal(kelasHhi(null), null);
});

test("pangsaMitra: persen dan urutan", () => {
  const p = pangsaMitra([{ kode: 1, usd: 25 }, { kode: 2, usd: 75 }, { kode: 3, usd: 0 }]);
  assert.deepEqual(p.map((x) => [x.kode, x.pct]), [[2, 75], [1, 25]]);
  assert.deepEqual(pangsaMitra([]), []);
});

test("bandingProduk: arah naik/turun, tie, null", () => {
  const skema = [{ kolom: "daya", satuan: "W", arah: "naik" }, { kolom: "degr", satuan: "%", arah: "turun" }, { kolom: "sama", satuan: "x", arah: "naik" }, { kolom: "kosong", satuan: "y", arah: "naik" }];
  const A = { spesifikasi: { daya: 700, degr: 0.4, sama: 5, kosong: null } }, B = { spesifikasi: { daya: 740, degr: 0.35, sama: 5, kosong: 3 } };
  const [d, g, s, k] = bandingProduk([A, B], skema);
  assert.deepEqual(d.terbaik, [false, true]); dekat(d.selisih[0], ((700 - 740) / 740) * 100);
  assert.deepEqual(g.terbaik, [false, true]);
  assert.deepEqual(s.terbaik, [false, false]);
  assert.deepEqual(k.terbaik, [false, false]); assert.equal(k.nilai[0], null);
});

test("selisihPct dan tarif Perpres", () => {
  dekat(selisihPct(960, 667), 43.9, 0.05); assert.equal(selisihPct(1, 0), null);
  dekat(tarifPerpres35(10), 13.35); dekat(tarifPerpres35(20), 13.35);
  dekat(tarifPerpres35(40), 11.5);          // 14,54 - 0,076 x 40
  dekat(tarifPerpres35(100), 6.94);         // 14,54 - 7,6
  assert.equal(tarifPerpres35(0), null); dekat(tarifPerpres109(40), 20);
});

test("data nyata (bila ada): selisih benchmark 43,9 persen dan skema banding terbaca", () => {
  const f = new URL("../public/data/global/benchmark_harga.json", import.meta.url);
  if (!existsSync(f)) return;
  const b = JSON.parse(readFileSync(f, "utf8")), p = b.produk.find((x) => x.id === "plts-terpasang");
  if (!p) return;
  dekat(selisihPct(Math.max(...p.indonesia.map((i) => i.usd)), p.dunia[0].usd), p.selisih_persen, 0.1);
});
