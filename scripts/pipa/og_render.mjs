// og_render.mjs: pra-render PNG 1200x630 kartu bagikan untuk entitas teratas ke public/og/<jenis>/<id>.png.
// Alat lokal: rsvg-convert (brew install librsvg; qlmanage/sips tak bisa memotong 1200x630 dengan benar); tanpa itu skrip berhenti dengan pesan (SVG tetap dilayani Worker).
// Pakai: node scripts/pipa/og_render.mjs [jumlah=40]
import { readFileSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { svgKartu } from "../../src/og.js";

const PUB = new URL("../../public/", import.meta.url).pathname;
const j = (p) => JSON.parse(readFileSync(PUB + "data/" + p, "utf8"));
const ada = (c) => { try { execFileSync("which", [c], { stdio: "pipe" }); return true; } catch { return false; } };
const alat = ada("rsvg-convert") ? "rsvg" : null;
if (!alat) { console.error("tidak ada rsvg-convert; PNG dilewati"); process.exit(0); }
const n = Number(process.argv[2]) || 40, tmp = join(tmpdir(), "og-render");
mkdirSync(tmp, { recursive: true });
const org = j("organisasi.json"), pro = j("proyek.json");
const daftar = [["beranda", "utama", { judul: "Direktori METI", sub: "Jaringan energi terbarukan Indonesia", angka: [["rantai", org.jumlah, "Organisasi"], ["bolt", pro.jumlah, "Proyek"], ["tag", "-", "Tokoh"]], tanggal: org.dibangun_pada }]];
for (const x of org.baris.slice(0, n)) daftar.push(["organisasi", x.id, { judul: x.nama, sub: x.kategori?.label, angka: [["tag", (x.kepakaran || []).length, "Bidang"], ["rantai", (x.peran_rantai || []).length, "Peran rantai"], ["doc", (x.sumber || []).length, "Sumber"]], tanggal: x.diperiksa || org.dibangun_pada }]);
let ok = 0;
const jadi = [];
for (const [jenis, id, k] of daftar) {
  const svg = join(tmp, `${jenis}-${id}.svg`), out = join(PUB, "og", jenis, id + ".png");
  writeFileSync(svg, svgKartu(k, null));
  mkdirSync(join(PUB, "og", jenis), { recursive: true });
  try {
    execFileSync("rsvg-convert", ["-w", "1200", "-h", "630", "-o", out, svg]);
    ok++; jadi.push(`${jenis}/${id}`);
  } catch (e) { console.error("gagal", jenis, id, e.message.split("\n")[0]); }
  rmSync(svg, { force: true });
}
// Daftar PNG yang benar-benar ada, dibaca src/og.js untuk memilih og:image PNG (pratinjau WhatsApp/LinkedIn tak membaca SVG).
writeFileSync(new URL("../../src/og_png.js", import.meta.url), "// Dibangkitkan scripts/pipa/og_render.mjs; jangan sunting tangan.\nexport const OG_PNG = new Set(" + JSON.stringify(jadi.sort()) + ");\n");
console.log(`og_render: ${ok}/${daftar.length} PNG ditulis (${alat})`);
