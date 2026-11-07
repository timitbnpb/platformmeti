#!/usr/bin/env node
// Satu sumber angka ringkas: hitung ulang public/data/ringkas.json (hitung.*) dari berkas data yang tayang,
// lalu samakan angka cadangan di halaman masuk (masuk.js, dibaca tamu yang belum bisa membuka /data).
// Pemilik 8 Nov 2026: proyek tampil 548 / 410 / 397 di tiga tempat. Jalankan sesudah tiap perubahan data.
import fs from "node:fs";
const baca = (f) => JSON.parse(fs.readFileSync(`public/data/${f}.json`, "utf8"));
const n = (f) => { const d = baca(f); return (Array.isArray(d) ? d : d.baris || []).length; };
const r = baca("ringkas");
r.hitung = { ...r.hitung, proyek: n("proyek"), organisasi: n("organisasi"), orang: n("orang"), regulasi: n("regulasi"), berita: n("berita") };
fs.writeFileSync("public/data/ringkas.json", JSON.stringify(r));
const p = "public/masuk.js", m = fs.readFileSync(p, "utf8");
fs.writeFileSync(p, m.replace(/const POTRET = \{[^}]*\}/, `const POTRET = { tgl: "${r.dibangun_pada || ""}", proyek: ${r.hitung.proyek}, organisasi: ${r.hitung.organisasi}, orang: ${r.hitung.orang} }`));
console.log("ringkas", r.hitung);
