// Gerbang: tidak ada KAPITAL PENUH di tampilan. CSS tanpa text-transform:uppercase/small-caps; nama di data publik berhuruf biasa.
import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { namaBaku } from "../public/inti/nama_baku.js";

const akar = new URL("../public/", import.meta.url).pathname;
const css = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return f === "vendor" ? [] : statSync(p).isDirectory() ? css(p) : p.endsWith(".css") ? [p] : []; });

test("CSS publik tanpa uppercase dan small-caps", () => {
  const salah = css(akar).filter((p) => /text-transform:\s*uppercase|font-variant:\s*(all-)?small-caps/.test(readFileSync(p, "utf8")));
  assert.deepEqual(salah, []);
});

const PUTIH = new Set(("PT CV UD TBK PLN ESDM METI BUMN BUMD PGE PLTP PLTS PLTA PLTU PLTB KDP WCS CARE OPWAL ID TF UGM BEM KM UI ITB IPB BRIN RI DPR").split(" "));
test("nama di data publik tidak kapital penuh (>= 3 kata)", () => {
  const salah = [];
  for (const f of ["organisasi", "orang", "proyek", "program"]) {
    for (const b of JSON.parse(readFileSync(join(akar, "data", f + ".json"), "utf8")).baris) {
      const kata = String(b.nama || "").match(/[A-Za-z]+/g) || [];
      if (kata.length >= 3 && b.nama === b.nama.toUpperCase() && !kata.every((k) => PUTIH.has(k))) salah.push(f + ": " + b.nama);
    }
  }
  assert.deepEqual(salah, []);
});

test("namaBaku", () => {
  assert.deepEqual(namaBaku("ANGGOTA UTAMA: PT. INDIKA ENERGY"), { nama: "PT. Indika Energy", jenis: "utama" });
  assert.deepEqual(namaBaku("ANGGOTA LUAR BIASA: PT ADYAWINSA ELECTRICAL AND POWER TBK"), { nama: "PT Adyawinsa Electrical and Power Tbk", jenis: "luar-biasa" });
  assert.equal(namaBaku("CHEVRON GEOTHERMAL INDONESIA, LTD akuisisi menjadi STAR ENERGY GEOTHERMAL").nama, "Chevron Geothermal Indonesia, Ltd akuisisi menjadi Star Energy Geothermal");
  assert.equal(namaBaku("PT PLN (Persero)").nama, "PT PLN (Persero)");
  assert.equal(namaBaku("BEM KM UGM").nama, "BEM KM UGM");
  assert.equal(namaBaku(null).nama, "");
});
