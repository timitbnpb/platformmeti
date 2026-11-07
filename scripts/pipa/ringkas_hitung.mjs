#!/usr/bin/env node
// Satu sumber angka ringkas: hitung ulang public/data/ringkas.json (hitung.* DAN kartu.*) dari berkas data yang tayang.
// Pemilik 8 Nov 2026: proyek tampil 548 / 410 / 397 di tiga tempat. Jalankan sesudah tiap perubahan data.
import fs from "node:fs";
const baca = (f) => JSON.parse(fs.readFileSync(`public/data/${f}.json`, "utf8"));
const baris = (f) => { const d = baca(f); return Array.isArray(d) ? d : d.baris || []; };
const r = baca("ringkas");
const reg = baris("regulasi"), berlaku = reg.filter((x) => x.status === "berlaku").length;
// semua kunci hitung dihitung dari berkas sumbernya (nama berkas = nama kunci); kunci tanpa berkas dibiarkan
for (const k of Object.keys(r.hitung)) if (fs.existsSync(`public/data/${k}.json`)) r.hitung[k] = baris(k).length;
const nilai = { proyek: r.hitung.proyek, organisasi: r.hitung.organisasi, orang: r.hitung.orang, regulasi: berlaku };
for (const k of r.kartu) {
  if (k.kode in nilai) k.nilai = nilai[k.kode];
  if (k.kode === "regulasi") k.catatan = `dari ${reg.length} aturan tercatat`;
}
fs.writeFileSync("public/data/ringkas.json", JSON.stringify(r));
console.log("ringkas", r.hitung, r.kartu.map((k) => `${k.kode}=${k.nilai}`).join(" "));
