// Visi dan misi di /tentang (kamus id tn.vm.*) harus sama dengan data/meti_profil.json; en memuat delapan butir.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const baca = (p) => JSON.parse(readFileSync(new URL("../" + p, import.meta.url), "utf8"));
const profil = baca("data/meti_profil.json"), id = baca("public/i18n/id.json"), en = baca("public/i18n/en.json");

test("visi dan misi id sama dengan meti_profil.json", () => {
  assert.equal(id["tn.vm.visi"], profil.visi);
  assert.equal(profil.misi.length, 8);
  profil.misi.forEach((m, i) => { assert.equal(id["tn.vm.m" + (i + 1)], m); assert.ok(en["tn.vm.m" + (i + 1)]); });
});
