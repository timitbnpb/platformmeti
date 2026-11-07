// Halaman /transisi: parser neraca daya RUPTL, invarian data transisi.json, hitungan turunan (identitas dekomposisi), dan kunci kamus.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { angkaRuptl, uraiBlok, bebanNasional } from "../scripts/pipa/transisi.mjs";
import * as H from "../public/transisi_hitung.js";

const J = (f) => JSON.parse(readFileSync(new URL(`../public/data/${f}.json`, import.meta.url), "utf8"));
const tr = J("transisi"), target = J("target"), ember = J("ember_bulanan");

test("angkaRuptl: titik ribuan, koma desimal, persen, kurung negatif, strip", () => {
  assert.equal(angkaRuptl("8.459"), 8459);
  assert.equal(angkaRuptl("5,4"), 5.4);
  assert.equal(angkaRuptl("28%"), 28);
  assert.equal(angkaRuptl("(309)"), -309);
  assert.equal(angkaRuptl("-39"), -39);
  assert.equal(angkaRuptl("59.5"), 59.5);
  assert.equal(angkaRuptl("-"), 0);
  assert.equal(angkaRuptl("1,20**"), 1.2);
});

test("uraiBlok: baris kebutuhan, rekap, bauran, dan emisi (jumlah sub-baris, ribu ton jadi juta)", () => {
  const b = [
    " 1. KEBUTUHAN",
    "     e. Beban Puncak Bruto                         MW         100      110      120     130     140     150     160     170     180     190",
    "     f. Beban Puncak Neto                          MW          90      100      110     120     130     140     150     160     170     180",
    "4. REKAPITULASI",
    "     c. Total DMN Sistem                          MW         130      140      150     160     170     180     190     200     210     220",
    "     e. Reserve Margin                             MW          40       40       40      40      40      40      40      40      40      40",
    "     f. Reserve Margin                              %          44,4     40,0     36,4    33,3    30,8    28,6    26,7    25,0    23,5    22,2",
    "5. BAURAN ENERGI",
    "     a. EBT                                         %          10%      10%     20%    20%    30%    30%    40%    40%    50%    50%",
    "6. EMISI GRK                                    Ribu Ton",
    "     d. BBM                                         Ribu Ton        500    500    500    500    500    500    500    500    500    500",
    "     b. Gas                                         Ribu Ton        500    500    500    500    500    500    500    500    500    500",
  ];
  const o = uraiBlok(b);
  assert.deepEqual(o.beban_puncak_neto_mw.slice(0, 2), [90, 100]);
  assert.equal(o.dmn_sistem_mw[9], 220);
  assert.equal(o.reserve_margin_persen[0], 44.4);
  assert.equal(o.bauran_ebt_persen[9], 50);
  assert.equal(o.emisi_juta_ton[0], 1);
});

test("transisi.json: 16 sistem lengkap, 10 tahun, reserve margin cocok dengan hitungan (toleransi pembulatan)", () => {
  assert.equal(tr.sistem.length, 16);
  assert.equal(tr.beban_puncak_nasional.baris.length, 10);
  assert.equal(tr.beban_puncak_nasional.baris[0].beban_puncak_mw, 32959);
  assert.equal(tr.beban_puncak_nasional.baris[9].beban_puncak_mw, 48219);
  const kodeProv = new Set();
  for (const s of tr.sistem) {
    for (const k of ["beban_puncak_neto_mw", "dmn_sistem_mw", "reserve_margin_persen", "bauran_ebt_persen", "bauran_batubara_persen", "produksi_gwh", "emisi_juta_ton"]) {
      assert.equal(s[k]?.length, 10, `${s.id}.${k}`);
    }
    for (const p of s.provinsi) { assert.ok(!kodeProv.has(p), `provinsi ganda ${p}`); kodeProv.add(p); }
    for (const i of [0, 9]) {
      const hitung = ((s.dmn_sistem_mw[i] - s.beban_puncak_neto_mw[i]) / s.beban_puncak_neto_mw[i]) * 100;
      // sistem kecil: pembulatan MW mengubah persen hingga beberapa poin
      assert.ok(Math.abs(hitung - s.reserve_margin_persen[i]) < (s.beban_puncak_neto_mw[i] < 100 ? 6 : 1.5), `${s.id} RM ${i}: ${hitung} vs ${s.reserve_margin_persen[i]}`);
    }
  }
  assert.equal(kodeProv.size, 37, "37 provinsi terpetakan (Kepulauan Riau dilayani sistem Batam)");
  assert.ok(!kodeProv.has("21"));
});

test("transisi.json: tiap sumber punya url https, tiap pembanding IESR bertingkat kajian, tanpa em dash", () => {
  for (const s of tr.sumber) assert.match(s.url, /^https:\/\//);
  for (const a of tr.pembanding_iesr) assert.equal(a.tingkat_bukti, "kajian");
  assert.doesNotMatch(readFileSync(new URL("../public/data/transisi.json", import.meta.url), "utf8"), /[—·]/);
});

test("dekomposisi bauran: efek EBT + efek permintaan = selisih bauran (identitas eksak)", () => {
  const d = H.dekomposisiBauran(target.realisasi.pembangkitan_ebt_persen);
  assert.equal(d.length, 9);
  for (const r of d) assert.ok(Math.abs(r.efek_ebt + r.efek_permintaan - r.selisih) < 1e-9, String(r.tahun));
  const a = target.realisasi.pembangkitan_ebt_persen;
  assert.ok(Math.abs(d.reduce((s, r) => s + r.selisih, 0) - (a.at(-1).nilai - a[0].nilai)) < 0.01);
});

test("tambahan tahunan: jumlah selisih = kapasitas akhir - awal; laju rata-rata cocok target.json", () => {
  const a = H.tambahanTahunan(target.kapasitas_ebt);
  const tot = a.reduce((s, r) => s + r.total, 0);
  assert.ok(Math.abs(tot - (target.kapasitas_ebt.at(-1).total_ebt_mw - target.kapasitas_ebt[0].total_ebt_mw)) < 0.5);
  assert.ok(Math.abs(H.lajuRata(target.kapasitas_ebt) - target.meta.laju_historis_mw_per_tahun_2015_2024) < 0.1);
  assert.ok(a.find((r) => r.tahun === 2020).beda_seri, "2020 membandingkan dua terbitan Statistik");
});

test("faktor kapasitas dan intensitas emisi", () => {
  assert.equal(Math.round(H.faktorKapasitas(8.76, 1)), 100);
  assert.equal(H.faktorKapasitasProv(876, 100), 100);
  assert.equal(H.faktorKapasitasProv(5, 0), null);
  const jb = tr.sistem.find((s) => s.id === "jawa-bali");
  assert.ok(Math.abs(H.intensitasEmisi(jb, 0) - 1.0) < 0.05);
  const batu = H.deretFaktorKapasitas(ember.baris, "Coal");
  assert.ok(batu.length >= 8 && batu.every((x) => x.nilai > 40 && x.nilai < 100));
});

test("kelasKuantil: lima kelas, null = -1", () => {
  const k = H.kelasKuantil([1, 2, 3, 4, 5, null, 6, 7, 8, 9]);
  assert.equal(k[5], -1);
  assert.equal(Math.min(...k.filter((x) => x >= 0)), 0);
  assert.equal(Math.max(...k), 4);
});

test("kunci kamus transisi: id dan en setara dan tak kosong", () => {
  const id = JSON.parse(readFileSync(new URL("../public/i18n/id.json", import.meta.url), "utf8")), en = JSON.parse(readFileSync(new URL("../public/i18n/en.json", import.meta.url), "utf8"));
  const kunci = Object.keys(id).filter((k) => k.startsWith("tr."));
  assert.ok(kunci.length > 200);
  for (const k of kunci) assert.ok(en[k], k);
  const kode = readFileSync(new URL("../public/transisi.js", import.meta.url), "utf8");
  for (const m of kode.matchAll(/\bt\("(tr\.[\w.]+)"/g)) assert.ok(m[1] in id, m[1]);
});
