import test from "node:test";
import assert from "node:assert/strict";
import { pilihUtama, jaccard, inti } from "../scripts/pipa/data_pengembang.mjs";

test("pilihUtama: terbesar, imbang <=2, persen sebagian = ambigu", () => {
  assert.deepEqual(pilihUtama([{ nama: "A", persen: 89 }, { nama: "B", persen: 11 }]), ["A"]);
  assert.deepEqual(pilihUtama([{ nama: "A", persen: null }, { nama: "B", persen: null }]), ["A", "B"]);
  assert.equal(pilihUtama([{ nama: "A", persen: 19 }, { nama: "B", persen: null }]), null);
  assert.equal(pilihUtama([{ nama: "A" }, { nama: "B" }, { nama: "C" }]), null);
});
test("nama inti membuang kata generik; Merangin cocok, Batang Toru 3 tidak cocok Batang Toru penuh", () => {
  assert.ok(jaccard(inti("PLTA Merangin"), inti("PLTA Merangin")) === 1);
  assert.ok(jaccard(inti("PLTM Batang Toru 3"), inti("Batang Toru hydroelectric plant")) >= 0.5); // lolos nama; ditolak kapasitas (10 vs 510)
});
