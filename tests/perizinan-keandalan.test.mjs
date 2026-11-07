// Data indeks perizinan dan keandalan: bentuk, rentang, dan celah jujur (tidak dikarang).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const j = (f) => JSON.parse(readFileSync(new URL("../public/data/" + f, import.meta.url), "utf8"));

test("perizinan: 38 provinsi, skor 0-100 atau null, komponen kosong dikeluarkan", () => {
  const d = j("perizinan_provinsi.json");
  assert.equal(d.baris.length, 38);
  assert.equal(d.hipotesis, true);
  for (const r of d.baris) {
    assert.ok(r.skor === null || (r.skor >= 0 && r.skor <= 100), r.nama);
    assert.equal(r.komponen.oss.skor, null);
    if (r.skor === null) assert.equal(r.peringkat, undefined);
  }
});
test("keandalan: 16 sistem, RM 10 tahun, tren 2015-2024, tanpa SAIDI per UID", () => {
  const d = j("keandalan.json");
  assert.equal(d.sistem.length, 16);
  for (const s of d.sistem) { assert.equal(s.rm_persen.length, 10); assert.equal(s.beban_puncak_neto_mw.length, 10); }
  assert.deepEqual(d.tren_nasional.map((x) => x.tahun), [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024]);
  assert.equal(d.tren_nasional.at(-1).saidi_jam, 5.34);
  assert.ok(d.celah.some((c) => /UID/.test(c)));
});
