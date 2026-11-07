// Skema tiga dataset publik: ruptl, plts_atap, wkp (tiap angka punya sumber_id + tahun; sumber_id ada di blok sumber).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const D = (f) => JSON.parse(readFileSync(new URL("../public/data/" + f, import.meta.url), "utf8"));
const proyekIds = new Set(D("proyek.json").baris.map((x) => x.id));
const orgIds = new Set(D("organisasi.json").baris.map((x) => x.id));
const cekSumber = (d) => {
  const ids = new Set(d.sumber.map((s) => s.id));
  assert.equal(ids.size, d.sumber.length);
  for (const s of d.sumber) for (const k of ["id", "judul", "penerbit", "tahun", "url"]) assert.ok(s[k] != null, `${s.id}.${k}`);
  assert.match(d.meta.diperbarui, /^\d{4}-\d\d-\d\d$/);
  assert.ok(Array.isArray(d.meta.celah) && d.meta.celah.length > 0);
  return ids;
};

test("ruptl.json: skema, sumber, id unik, tautan proyek ada", () => {
  const d = D("ruptl.json"); const ids = cekSumber(d);
  assert.equal(d.meta.jumlah, d.baris.length);
  assert.ok(d.baris.length > 200);
  assert.equal(new Set(d.baris.map((b) => b.id)).size, d.baris.length);
  for (const b of d.baris) {
    assert.ok(ids.has(b.sumber_id), b.id); assert.equal(b.tahun, 2025);
    assert.ok(b.kapasitas_mw > 0, b.id); assert.ok(b.cod_tahun.every((y) => y >= 2024 && y <= 2040), b.id);
    assert.ok(["konstruksi", "rencana", "tidak-diketahui"].includes(b.status), b.id);
    assert.ok(["sum", "kal", "jmb", "smpnt"].includes(b.regional), b.id);
    if (b.proyek_id) assert.ok(proyekIds.has(b.proyek_id), b.id);
  }
});

test("plts_atap.json: total tabel = jumlah regional per tahun, realisasi null + celah", () => {
  const d = D("plts_atap.json"); const ids = cekSumber(d);
  const per = {}; for (const b of d.baris) { assert.ok(ids.has(b.sumber_id)); per[b.tahun] = (per[b.tahun] || 0) + b.kuota_mw; assert.equal(b.realisasi_mw, null); }
  for (const [y, v] of Object.entries(d.total.per_tahun)) assert.equal(per[y], v, "tahun " + y);
  assert.equal(Object.values(per).reduce((a, b) => a + b, 0), d.total.jumlah_mw);
  const reg = {}; for (const b of d.baris) reg[b.regional] = (reg[b.regional] || 0) + b.kuota_mw;
  assert.deepEqual(reg, { jmb: 2425, sum: 380, kal: 139, smpnt: 93 });
});

test("wkp.json: sumber per baris, bukti media punya url+tanggal, tautan valid", () => {
  const d = D("wkp.json"); const ids = cekSumber(d); const ber = new Map(d.sumber.map((s) => [s.id, s]));
  assert.equal(new Set(d.baris.map((b) => b.id)).size, d.baris.length);
  for (const b of d.baris) {
    assert.ok(b.sumber_ids.length > 0, b.id); for (const s of b.sumber_ids) assert.ok(ids.has(s), b.id + " " + s);
    assert.ok(["lelang", "eksplorasi", "produksi", "penugasan", "pengembangan", "kajian"].includes(b.status), b.id);
    assert.ok(["WKP", "PSPE"].includes(b.jenis));
    if (b.tingkat_bukti === "media") for (const s of b.sumber_ids.filter((x) => x.startsWith("berita-"))) { assert.match(ber.get(s).tanggal, /^\d{4}-\d\d-\d\d$/); assert.match(ber.get(s).url, /^https:\/\//); }
    if (b.organisasi_id) assert.ok(orgIds.has(b.organisasi_id), b.id);
    for (const p of b.proyek_ids) assert.ok(proyekIds.has(p), b.id);
    assert.ok(b.terpasang_mw == null || b.terpasang_sumber_id); assert.equal(b.lat, null);
  }
});
