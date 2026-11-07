#!/usr/bin/env node
// Satu sumber angka ringkas: hitung ulang public/data/ringkas.json (hitung.* DAN kartu.*) dari berkas data yang tayang.
// Pemilik 8 Nov 2026: proyek tampil 548 / 410 / 397 di tiga tempat. Jalankan sesudah tiap perubahan data.
import fs from "node:fs";
const baca = (f) => JSON.parse(fs.readFileSync(`public/data/${f}.json`, "utf8"));
const baris = (f) => { const d = baca(f); return Array.isArray(d) ? d : d.baris || []; };
const r = baca("ringkas");
const reg = baris("regulasi"), berlaku = reg.filter((x) => x.status === "berlaku").length;
r.hitung = { ...r.hitung, proyek: baris("proyek").length, organisasi: baris("organisasi").length, orang: baris("orang").length, regulasi: reg.length, berita: baris("berita").length };
const nilai = { proyek: r.hitung.proyek, organisasi: r.hitung.organisasi, orang: r.hitung.orang, regulasi: berlaku };
for (const k of r.kartu) {
  if (k.kode in nilai) k.nilai = nilai[k.kode];
  if (k.kode === "regulasi") k.catatan = `dari ${reg.length} aturan tercatat`;
}
fs.writeFileSync("public/data/ringkas.json", JSON.stringify(r));
console.log("ringkas", r.hitung, r.kartu.map((k) => `${k.kode}=${k.nilai}`).join(" "));
