import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const d = JSON.parse(readFileSync("public/data/keberlanjutan.json", "utf8"));
const org = new Set(JSON.parse(readFileSync("public/data/organisasi.json", "utf8")).baris.map((x) => x.id));
test("tiap kunci adalah org_id yang ada; tiap angka bersumber URL, tanggal, bukti; tahun 2020-2025", () => {
  assert.ok(d.jumlah === Object.keys(d.org).length && d.jumlah > 0);
  for (const [id, v] of Object.entries(d.org)) {
    assert.ok(org.has(id), id);
    for (const r of v.metrik) {
      assert.match(r.sumber, /^https:\/\//); assert.ok(r.tanggal && r.bukti && Number.isFinite(r.nilai) && r.satuan, id + r.kunci);
      assert.ok(r.tahun >= 2020 && r.tahun <= 2025, id + r.kunci);
    }
    for (const l of [...v.laporan, ...v.pasar]) { assert.match(l.url || l.sumber, /^https:\/\//); assert.ok(l.bukti && (l.tanggal_periksa || l.tanggal)); }
  }
});
test("bagian profil keberlanjutan terpasang di o.js dan tanpa style=", () => {
  assert.match(readFileSync("public/o.js", "utf8"), /bagKeberlanjutan/);
  assert.doesNotMatch(readFileSync("public/o_keberlanjutan.js", "utf8"), /style=/);
});
