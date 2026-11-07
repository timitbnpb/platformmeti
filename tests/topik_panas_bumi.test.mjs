// Uji naskah topik Panas bumi: bentuk, dua bahasa, rujukan sumber, larangan karakter, kasus gagal wajib sumber + hak jawab.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { naskah, periksa } from "../scripts/pipa/topik_panas_bumi.mjs";

const berkas = JSON.parse(readFileSync(new URL("../public/data/topik/panas_bumi.json", import.meta.url), "utf8"));

test("naskah panas bumi lolos pemeriksaan skema", () => {
  assert.deepEqual(periksa(berkas), []);
});

test("berkas sama dengan hasil bangun (tidak basi)", () => {
  assert.deepEqual(berkas, JSON.parse(JSON.stringify(naskah())));
});

test("bab K: >= 3 kasus berhasil Indonesia dan luar negeri, >= 3 kasus gagal", () => {
  const ok = berkas.bab[39].butir, gagal = berkas.bab[40].butir;
  assert.ok(ok.filter((k) => k.negara === "ID").length >= 3);
  assert.ok(ok.filter((k) => k.negara !== "ID").length >= 3);
  assert.ok(gagal.length >= 3 && gagal.every((k) => k.hak_jawab === true && k.sumber.length >= 1 && k.kronologi.length >= 1));
});

test("bab 42: tiap peran inti punya butir dan tiap tahap terwakili", () => {
  const p = berkas.bab[42];
  for (const t of p.tahap) assert.ok(p.butir.some((b) => b.tahap === t.k), t.k);
  for (const r of ["pengembang", "pendana", "pemda", "pusat", "pln"]) assert.ok(p.butir.some((b) => b.peran === r), r);
});

test("periksa menolak em dash dan sumber tak dikenal", () => {
  const x = JSON.parse(JSON.stringify(berkas));
  x.bab[4].paragraf[0].id += " — tes";
  x.bab[4].sumber = ["tidak-ada"];
  const m = periksa(x).join("|");
  assert.match(m, /karakter terlarang/);
  assert.match(m, /tidak-ada/);
});
