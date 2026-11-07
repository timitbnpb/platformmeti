// Skema dataset strategis: target.json, kelistrikan.json, kawasan.json, geo/transmisi.json + gardu.json (bila sudah dipanen).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { sederhanakan, tegMax, bangun as bangunOsm } from "../scripts/pipa/data_transmisi.mjs";
import { luasHa, uraiAnggota } from "../scripts/pipa/data_kawasan.mjs";
const J = (f) => JSON.parse(readFileSync(new URL("../" + f, import.meta.url), "utf8"));
const cek = (d) => {
  const ids = new Set(d.sumber.map((s) => s.id)); assert.equal(ids.size, d.sumber.length);
  for (const s of d.sumber) for (const k of ["id", "judul", "penerbit", "tahun", "url"]) assert.ok(s[k] != null, s.id + "." + k);
  assert.match(d.meta.diperbarui, /^\d{4}-\d\d-\d\d$/); assert.ok(d.meta.celah.length > 0);
  return ids;
};

test("target.json: sumber, target, seri realisasi, kapasitas, celah EST konsisten", () => {
  const d = J("public/data/target.json"); const ids = cek(d);
  for (const t of d.target) { assert.ok(ids.has(t.dokumen), t.id); assert.ok(t.halaman, t.id); assert.ok(t.seri || t.min != null, t.id); }
  const rukn = d.target.find((t) => t.id === "rukn-2025-pembangkitan").seri;
  assert.equal(Object.keys(rukn).length, 36); assert.equal(rukn["2060"], 73.6);
  for (const k of Object.keys(rukn)) assert.ok(rukn[k] >= rukn[String(k - 1)] || k === "2025", k); // tidak turun
  for (const [nama, seri] of Object.entries(d.realisasi)) for (const r of seri) { assert.ok(ids.has(r.sumber_id), nama); assert.ok(r.tahun >= 2015 && r.nilai > 0 && r.nilai < 100, nama + r.tahun); }
  assert.equal(d.realisasi.pembangkitan_ebt_persen.length, 10);
  assert.deepEqual(d.kapasitas_ebt.map((k) => k.tahun), [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024]);
  for (const k of d.kapasitas_ebt) {
    assert.ok(ids.has(k.sumber_id)); const j = k.hidro_mw + k.panas_bumi_mw + k.surya_mw + k.bayu_mw + k.bioenergi_mw;
    assert.ok(Math.abs(j - k.total_ebt_mw) < 0.02, "jumlah " + k.tahun);
  }
  assert.ok(Math.abs(d.kapasitas_ebt[5].total_ebt_mw / 1000 - d.kapasitas_ebt_gw_esdm["2020"]) < 0.05); // cocok Lakin 10,46 GW
  for (const c of d.celah) { assert.equal(c.label, "EST"); if (c.metode === "proksi") assert.ok(c.celah_mw.rendah > c.celah_mw.dasar && c.celah_mw.dasar > c.celah_mw.tinggi); }
  const r = d.celah.find((c) => c.target_id === "ruptl-2034-kapasitas"); assert.equal(r.celah_mw, 42569); assert.equal(r.per_tahun_mw, 4256.9);
});

test("kelistrikan.json: 38 provinsi, sumber per angka, wilayah PLN jumlah cocok total", () => {
  const d = J("public/data/kelistrikan.json"); const ids = cek(d);
  assert.equal(d.baris.length, 38); assert.equal(new Set(d.baris.map((b) => b.provinsi)).size, 38);
  for (const b of d.baris) {
    assert.ok(b.rasio_elektrifikasi_persen >= 90 && b.rasio_elektrifikasi_persen <= 100, b.provinsi);
    assert.ok(b.rumah_tangga_berlistrik_jumlah > 0 && b.penduduk > 0 && b.pdrb_triliun_rp > 0, b.provinsi);
    for (const s of Object.values(b.sumber)) assert.ok(ids.has(s.sumber_id) && s.tahun, b.provinsi);
    if (b.penjualan_pln_gwh != null) assert.equal(b.wilayah_pln_gabungan, false, b.provinsi);
    if (b.konsumsi_per_kapita_kwh_est != null) assert.ok(Math.abs(b.konsumsi_per_kapita_kwh_est - (b.penjualan_pln_gwh * 1e6) / b.penduduk) < 1);
  }
  const g = d.meta.wilayah_pln;
  assert.ok(Math.abs(g.reduce((s, x) => s + x.penjualan_gwh, 0) - d.meta.nasional.penjualan_pln_gwh) < 0.1);
  assert.equal(g.reduce((s, x) => s + (x.pelanggan || 0), 0), d.meta.nasional.pelanggan_pln);
});

test("kawasan.json: KEK 25 bertitik di Indonesia, kawasan industri ber-sumber", () => {
  const d = J("public/data/kawasan.json"); const ids = cek(d);
  assert.equal(new Set(d.baris.map((b) => b.id)).size, d.baris.length); assert.equal(d.meta.jumlah, d.baris.length);
  const kek = d.baris.filter((b) => b.jenis === "kek"); assert.equal(kek.length, 25);
  for (const b of d.baris) {
    assert.ok(ids.has(b.sumber_id) && b.tahun && b.url && b.provinsi && b.tingkat_bukti, b.id);
    if (b.lat != null) assert.ok(b.lat > -11.5 && b.lat < 6.5 && b.lng > 94 && b.lng < 141.5, b.id);
  }
  for (const b of kek) assert.ok(b.lat != null && b.dasar_hukum, b.id);
});
test("data_kawasan: luas Indonesia vs desimal titik, satuan m2 ditolak", () => {
  assert.equal(luasHa("2.886,7 ha"), 2886.7); assert.equal(luasHa("120.3 Ha"), 120.3); assert.equal(luasHa("1.040 ha"), 1040); assert.equal(luasHa("2333,6 ha"), 2333.6); assert.equal(luasHa("66.400 m2"), null);
  assert.equal(uraiAnggota("<p>tanpa anggota</p>"), null);
});

test("data_transmisi: tegangan tertinggi, penyederhanaan, bangun menyaring < 150 kV", () => {
  assert.equal(tegMax("500000;275000"), 500000); assert.equal(tegMax(undefined), 0);
  const garis = Array.from({ length: 50 }, (_, i) => [100 + i * 0.01, 1 + (i % 2 ? 0.0001 : 0)]);
  const s = sederhanakan(garis, 0.0015); assert.equal(s.length, 2); assert.deepEqual(s[0], garis[0]);
  const el = [
    { type: "way", id: 1, tags: { power: "line", voltage: "150000" }, geometry: [{ lat: 1, lon: 100 }, { lat: 1.1, lon: 100.1 }] },
    { type: "way", id: 2, tags: { power: "line", voltage: "70000" }, geometry: [{ lat: 1, lon: 100 }, { lat: 1.1, lon: 100.1 }] },
    { type: "node", id: 3, lat: 2, lon: 101, tags: { power: "substation", voltage: "500000", name: "GI X" } },
  ];
  const o = bangunOsm(el, "2026-11-08");
  assert.equal(o.transmisi.garis.length, 1); assert.equal(o.gardu.gardu.length, 1); assert.match(o.transmisi.meta.lisensi, /ODbL/);
});

test("geo/transmisi.json + gardu.json: ODbL, ukuran < 3 MB, koordinat Indonesia (bila sudah dipanen)", { skip: !existsSync(new URL("../public/geo/transmisi.json", import.meta.url)) }, () => {
  const t = J("public/geo/transmisi.json"), g = J("public/geo/gardu.json");
  for (const d of [t, g]) { assert.match(d.meta.lisensi, /ODbL/); assert.match(d.meta.atribusi, /OpenStreetMap/); assert.ok(d.meta.celah.length > 0); }
  const ukuran = readFileSync(new URL("../public/geo/transmisi.json", import.meta.url)).length + readFileSync(new URL("../public/geo/gardu.json", import.meta.url)).length;
  assert.ok(ukuran < 3 * 1024 * 1024, "ukuran " + ukuran);
  assert.equal(t.meta.jumlah, t.garis.length); assert.equal(g.meta.jumlah, g.gardu.length);
  for (const l of t.garis) { assert.ok(l.teg_kv >= 150); for (const [x, y] of l.koordinat) assert.ok(x > 94 && x < 142 && y > -12 && y < 7, String(l.id)); }
  for (const p of g.gardu) { assert.ok(p.teg_kv >= 150 && p.lng > 94 && p.lng < 142 && p.lat > -12 && p.lat < 7, p.id); }
});

test("potensi_atlas.json: 38 provinsi, CC BY, celah angin tercatat", () => {
  const d = J("public/data/potensi_atlas.json"); cek(d);
  assert.equal(d.baris.length, 38); assert.match(d.meta.lisensi, /CC BY 4\.0/); assert.ok(d.meta.celah.some((c) => /Wind Atlas/.test(c)));
  for (const b of d.baris) { assert.ok(b.pvout_kwh_per_kwp_tahun > 1000 && b.pvout_kwh_per_kwp_tahun < 2000, b.provinsi); assert.equal(b.sumber_id, "global-solar-atlas"); }
});
