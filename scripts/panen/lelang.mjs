/* Perakit /lelang: node scripts/panen/lelang.mjs [--tulis]. Membaca seed terkurasi + tender.json + regulasi.json, memeriksa, menulis public/data/lelang.json. */
import { readFileSync, writeFileSync } from "node:fs";
import * as seed from "./lelang_seed.mjs";
import { bangun, periksa } from "./lelang_lib.mjs";

const baca = (f) => JSON.parse(readFileSync(new URL("../../public/data/" + f, import.meta.url), "utf8"));
const set = (a) => new Set(a.map((x) => x.id));
const d = bangun({ seed, tender: baca("tender.json"), regulasi: baca("regulasi.json"), proyek: baca("proyek.json"), program: baca("program.json") });
const g = periksa(d, { proyekAda: set(baca("proyek.json").baris), orgAda: set(baca("organisasi.json").baris), regAda: set(baca("regulasi.json").baris), programAda: set(baca("program.json").baris) });
if (g.length) { console.error(g.join("\n")); process.exit(1); }
if (process.argv.includes("--tulis")) { writeFileSync(new URL("../../public/data/lelang.json", import.meta.url), JSON.stringify(d, null, 1) + "\n"); console.log("lelang.json:", d.jumlah, "putaran"); }
else console.log("lolos periksa:", d.jumlah, "putaran (tambah --tulis untuk menulis)");
