// Indeks cari gabungan (G2): pembangun scripts/pipa/indeks_cari.mjs + peringkat public/inti/cari_rumus.js.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { bangunIndeks } from "../scripts/pipa/indeks_cari.mjs";
import { cari, norm, jerami, mirip1 } from "../public/inti/cari_rumus.js";

const PUB = new URL("../public/", import.meta.url).pathname;
const ix = bangunIndeks();
// meniru inti/cari_indeks.js ratakan() tanpa i18n
const butir = Object.entries(ix).flatMap(([g, a]) => a.map((e) => ({ g, judul: e.j, href: e.u, j: norm(e.j), h: jerami(e.j, e.s, e.x), bukti: e.b })));
const teratas = (q, g) => (cari(butir, q, 5).get(g) || []).map((x) => x.judul);

test("indeks: semua jenis inti ada, judul dan tautan terisi, tautan luar hanya http(s)", () => {
  for (const g of ["org", "orang", "proyek", "reg", "topik", "berita", "pakar", "inovasi", "pendanaan", "program", "wilayah", "halaman", "istilah"]) assert.ok(ix[g]?.length, `jenis ${g} kosong`);
  for (const [g, a] of Object.entries(ix)) for (const e of a) {
    assert.ok(e.j && e.u, `${g}: butir tanpa judul/tautan`);
    assert.ok(e.e ? /^https?:\/\//.test(e.u) : e.u.startsWith("/"), `${g}: tautan tak aman ${e.u}`);
  }
  assert.ok(ix.topik.length > 500, "bab/FAQ/glosarium 16 topik harus masuk indeks");
});
test("orang: hanya tokoh publik berorganisasi (privasi)", () => {
  const publik = new Set(JSON.parse(readFileSync(PUB + "data/orang.json", "utf8")).baris.filter((p) => p.kelompok?.kode === "tokoh-publik").map((p) => p.nama));
  for (const e of ix.orang) assert.ok([...publik].some((n) => e.j.includes(n)), `bukan tokoh publik: ${e.j}`);
});
test("berkas public/data/cari dipecah per jenis dan masing-masing di bawah 400 KB", () => {
  const dir = PUB + "data/cari/";
  if (!existsSync(dir)) return;   // dibangun lewat: node scripts/pipa/indeks_cari.mjs
  for (const f of readdirSync(dir)) { const s = readFileSync(dir + f, "utf8"); JSON.parse(s); assert.ok(s.length < 400_000, `${f} terlalu besar: ${s.length}`); }
});
test("peringkat: nama, singkatan, awalan, salah ketik ringan", () => {
  assert.ok(teratas("cirata", "proyek").some((j) => /cirata/i.test(j)));
  assert.ok(teratas("pertamina geothermal", "org").length);
  assert.ok(teratas("pertmina", "org").length, "salah ketik satu huruf harus tetap menemukan");
  assert.equal(teratas("xqzvw", "org").length, 0);
});
test("singkatan dua arah lintas jenis: ESDM menemukan lembaga", () => assert.ok(teratas("esdm", "org").length));
test("jenis bukti: regulasi resmi, berita media", () => {
  assert.ok(ix.reg.every((e) => e.b === "resmi"));
  assert.ok(ix.berita.every((e) => e.b === "media"));
});
test("hukum: katalog + pasal diindeks bila berkas ada (bentuk longgar)", () => {
  const sim = bangunIndeks({ data: (n) => (n === "hukum/katalog" ? { baris: [{ id: "uu-30-2007", judul: "Undang-Undang Energi", nomor: "30", tahun: 2007, pasal: [{ nomor: 20, isi: "Pemanfaatan energi baru dan energi terbarukan" }] }] } : null) });
  assert.equal(sim.hukum.length, 2);
  const h = sim.hukum.map((e) => ({ g: "hukum", judul: e.j, j: norm(e.j), h: jerami(e.j, e.s, e.x) }));
  assert.equal(cari(h, "pasal 20", 3).get("hukum")[0].judul, "Undang-Undang Energi, Pasal 20");
});
test("mirip1: sisip, hapus, ganti, tukar", () => {
  for (const [a, b] of [["pertamina", "pertmina"], ["cirata", "cirats"], ["surya", "suyra"], ["bayu", "bayuu"]]) assert.ok(mirip1(a, b), a + b);
  assert.ok(!mirip1("surya", "bayu"));
});
