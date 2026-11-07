import test from "node:test";
import assert from "node:assert/strict";
import { samarKontak } from "../public/inti/samar.js";

test("samarKontak: sel berisi banyak nilai tersamar semua", () => {
  assert.equal(samarKontak("ab.cd@x.co.id / nama.lengkap@y.co.id; z@q.id"), "ab****@x.co.id / na****@y.co.id; z****@q.id");
  assert.equal(samarKontak("0812/0813 9999 8888"), "****/**** **** ****");
  const o = samarKontak("a1@x.id,nama.lengkap@y.id 081212434010");
  assert.ok(!o.includes("lengkap") && !o.includes("08121243") && !o.includes("34010"), o);
});
test("samarKontak: satu nilai, kosong, nomor panjang", () => {
  assert.equal(samarKontak(""), ""); assert.equal(samarKontak(null), "");
  assert.equal(samarKontak("budi@x.id"), "bu****@x.id");
  assert.equal(samarKontak("081234567890"), "0812****90");
});
