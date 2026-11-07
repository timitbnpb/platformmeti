// /target: logika status (EST), invarian target_realisasi.json, kunci kamus tg2.*.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { nilaiStatus, lajuHistoris, tahunPecahan } from "../scripts/pipa/target_realisasi.mjs";

const J = (f) => JSON.parse(readFileSync(new URL(`../public/${f}`, import.meta.url), "utf8"));
const o = J("data/target_realisasi.json");
const S = (seri, nilai, tahun, extra = {}) => nilaiStatus({ seri: seri.map(([t, v]) => ({ t, v })), nilai, tahun, ...extra }, 2026.85);

test("laju historis: kemiringan kuadrat terkecil", () => {
  assert.equal(lajuHistoris([{ t: 2020, v: 1 }, { t: 2021, v: 3 }, { t: 2022, v: 5 }]), 2);
  assert.equal(lajuHistoris([{ t: 2020, v: 1 }]), null);
});
test("status: di jalur, tertinggal, jauh tertinggal, tercapai, tidak ada data", () => {
  assert.equal(S([[2020, 0], [2025, 10]], 20, 2030).status, "di-jalur"); // laju 2, butuh 2
  assert.equal(S([[2020, 0], [2025, 10]], 30, 2030).status, "tertinggal"); // butuh 4, rasio .5
  assert.equal(S([[2020, 0], [2025, 10]], 60, 2030).status, "jauh-tertinggal");
  assert.equal(S([[2020, 0], [2025, 10]], 10, 2030).status, "tercapai");
  assert.equal(S([[2025, 10]], 20, 2030).status, "tidak-ada-data");
  assert.equal(S([[2020, 0], [2025, 10]], 20, 2030, { sebanding: false }).status, "tidak-ada-data");
  assert.equal(S([], 20, 2030).status, "tidak-ada-data");
});
test("tenggat lewat tanpa angka baru: jauh bila proyeksi jauh dari target, selain itu tidak ada data", () => {
  assert.equal(S([[2023, 5], [2024, 6]], 23, 2025).status, "jauh-tertinggal");
  assert.equal(S([[2023, 5], [2024, 22]], 23, 2025).status, "tidak-ada-data");
});
test("tahunPecahan", () => assert.ok(Math.abs(tahunPecahan("2026-07-02") - 2026.5) < 0.01));

test("target_realisasi.json: id unik, status sah, sumber http, kategori dikenal", () => {
  const ids = new Set(), ST = new Set(["tercapai", "di-jalur", "tertinggal", "jauh-tertinggal", "tidak-ada-data"]), KAT = new Set(["bauran", "kapasitas", "emisi", "bahan-bakar", "kendaraan"]);
  assert.ok(o.target.length >= 15);
  for (const d of o.target) {
    assert.ok(!ids.has(d.id), d.id); ids.add(d.id);
    assert.ok(ST.has(d.status) && KAT.has(d.kat), d.id);
    assert.match(d.url, /^https?:\/\//, d.id);
    assert.ok(d.dokumen && d.pasal && d.nama.id && d.nama.en && d.catatan.id && d.catatan.en, d.id);
    if (d.sumberRealisasi) assert.match(d.sumberRealisasi.url, /^https?:\/\//, d.id);
    if (d.status !== "tidak-ada-data") assert.ok(d.seri.length >= 1 && d.capaianPersen != null, d.id);
    for (const p of d.pejabat) assert.match(p.url, /^https?:\/\//);
  }
  const wajib = ["ken-2030", "rukn-2030", "ruptl-ebt-2034", "ndc-2030", "jetp-ebt", "b50-campuran", "plts-100gw", "cofiring-2026", "pensiun-pltu", "plts-atap-2025", "spklu-2030"];
  for (const w of wajib) assert.ok(ids.has(w), w);
});
test("rued: jumlah sama dengan rued_capaian.json dan status sah", () => {
  assert.equal(o.rued.length, J("data/rued_capaian.json").baris.length);
  for (const r of o.rued) assert.ok(["tercapai", "di-jalur", "tertinggal", "tidak-ada-data"].includes(r.status), r.provinsi);
});
test("kunci kamus tg2.* setara id dan en, dan dipakai kode ada", () => {
  const id = J("i18n/id.json"), en = J("i18n/en.json"), js = readFileSync(new URL("../public/target.js", import.meta.url), "utf8");
  const k = Object.keys(id).filter((x) => x.startsWith("tg2."));
  assert.ok(k.length > 50);
  for (const x of k) assert.ok(x in en && en[x] !== "", x);
  for (const m of js.matchAll(/t\("(tg2\.[a-z_.-]+[a-z_])"/g)) assert.ok(m[1] in id, m[1]);
  for (const st of ["tercapai", "di-jalur", "tertinggal", "jauh-tertinggal", "tidak-ada-data"]) assert.ok("tg2.st." + st in id);
  for (const kt of ["semua", "bauran", "kapasitas", "emisi", "bahan-bakar", "kendaraan", "daerah"]) assert.ok("tg2.kat." + kt in id);
});
