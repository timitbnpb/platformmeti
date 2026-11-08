// Gerbang /topik: skema data topik mendalam (docs/perencanaan/TOPIK-SKEMA.md), dua bahasa, sumber tiap angka, larangan karakter, rujukan nav.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";

const D = "public/data/topik/";
const baca = (p) => JSON.parse(readFileSync(p, "utf8"));
const ui = baca(D + "ui.json"), indeks = baca(D + "indeks.json");
const ID_TOPIK = Object.keys(ui.topik);
const berkas = (id) => id.replace(/-/g, "_");
const TIPE = new Set(["teks", "faq", "glosarium", "rumus", "langkah", "tabel", "grafik", "linimasa", "kasus", "pola", "periksa", "jalan", "model"]);
const DILARANG = /[—·→]/;
const dua = (o, jalur) => { assert.ok(o && typeof o.id === "string" && o.id.trim() && typeof o.en === "string" && o.en.trim(), `${jalur}: teks id+en wajib`); };
const param = (s) => (String(s).match(/\{\w+\}/g) || []).sort().join();

function jalan(x, fn, jalur = "") {
  if (Array.isArray(x)) x.forEach((v, i) => jalan(v, fn, `${jalur}[${i}]`));
  else if (x && typeof x === "object") { fn(x, jalur); for (const [k, v] of Object.entries(x)) jalan(v, fn, `${jalur}.${k}`); }
}

test("ui.json: 44 bab dalam 12 kelompok, semua teks id+en dengan parameter sama", () => {
  assert.equal(Object.keys(ui.grup).length, 12);
  assert.equal(Object.keys(ui.bab).length, 44);
  for (const [n, b] of Object.entries(ui.bab)) { assert.ok(ui.grup[b.g], `bab ${n}: kelompok`); dua(b.j, `bab ${n}`); }
  for (const [k, v] of Object.entries(ui.s)) { dua(v, `s.${k}`); assert.equal(param(v.en), param(v.id), `parameter ${k}`); }
  assert.equal(ID_TOPIK.length, 16);
  for (const [id, t] of Object.entries(ui.topik)) { dua(t.nama, id); dua(t.ket, id); }
  assert.doesNotMatch(readFileSync(D + "ui.json", "utf8"), DILARANG);
});

test("indeks.json: tiap topik punya ikon, status sah, foto ada di disk", () => {
  assert.deepEqual(indeks.topik.map((t) => t.id).sort(), [...ID_TOPIK].sort());
  for (const t of indeks.topik) {
    assert.ok(["lengkap", "terisi", "disusun"].includes(t.status), t.id);
    assert.ok(t.ikon, t.id);
    if (t.foto) assert.ok(existsSync("public" + t.foto), `${t.id}: foto ${t.foto}`);
    assert.ok(existsSync(D + `dasar-${t.id}.json`), `${t.id}: dasar`);
  }
});

test("dasar-<id>.json: irisan bersumber (url atau id), tanpa karakter terlarang", () => {
  for (const id of ID_TOPIK) {
    const d = baca(D + `dasar-${id}.json`);
    assert.equal(d.id, id);
    assert.ok(d.dibangun_pada && d.hitung, id);
    for (const r of d.regulasi) assert.ok(/^https?:/.test(r.url || ""), `${id}: regulasi ${r.id} tanpa url`);
    for (const b of d.berita) assert.ok(/^https?:/.test(b.url || ""), `${id}: berita tanpa url`);
    assert.doesNotMatch(JSON.stringify(d), /[—·→]/, `${id}: karakter terlarang`);
  }
});

const NASKAH = ID_TOPIK.filter((id) => existsSync(D + `${berkas(id)}.json`));
test("ada naskah terkurasi (karbon wajib)", () => assert.ok(NASKAH.includes("karbon")));

for (const id of NASKAH) {
  test(`naskah ${id}: skema, sumber, dua bahasa`, () => {
    const n = baca(D + `${berkas(id)}.json`);
    assert.equal(n.id, id);
    assert.match(n.diperbarui, /^\d{4}-\d{2}-\d{2}$/);
    if (n.kunci) assert.equal(n.kunci.length, 5, "kunci tepat 5");
    if (n.penting) assert.equal(n.penting.length, 3, "penting tepat 3");
    for (const [k, s] of Object.entries(n.sumber || {})) { assert.ok(s.judul && s.bukti, `sumber ${k}`); if (s.url) assert.match(s.url, /^(https:\/\/|\/[^/])/, `url ${k}`); }
    const ref = (k) => assert.ok(n.sumber?.[k] || /^(ow_|t_|jetp$|dasar$)/.test(k), `rujukan sumber hilang: ${k}`);
    for (const [no, b] of Object.entries(n.bab || {})) {
      assert.ok(ui.bab[no], `bab ${no} tak dikenal`);
      assert.ok(TIPE.has(b.tipe), `bab ${no}: tipe ${b.tipe}`);
      (b.sumber || []).forEach(ref);
      if (b.tipe === "kasus") for (const k of b.butir) {
        assert.ok(k.id && /^[a-z]+$/.test(k.jenis) && (k.jenis === "berhasil" || ui.s["kasus." + k.jenis]), `kasus ${k.id}`);
        if (k.jenis !== "berhasil") assert.ok((k.sumber && k.sumber.length) || k.dari, `kasus gagal ${k.id} wajib bersumber`);
        if (k.jenis !== "berhasil" && !k.dari) assert.equal(k.hak_jawab, true, `kasus gagal ${k.id} wajib hak jawab`);
      }
      if (b.tipe === "periksa") for (const x of b.butir) { assert.ok(b.peran.some((p) => p.k === x.peran) && b.tahap.some((t) => t.k === x.tahap), "periksa: peran/tahap"); dua(x.teks, `bab ${no}`); }
      if (b.tipe === "faq") b.butir.forEach((x) => { dua(x.t, `faq t`); dua(x.j, `faq j`); });
    }
    jalan(n, (o, j) => { if ("id" in o && "en" in o && Object.keys(o).length === 2) { dua(o, j); assert.equal(param(o.en), param(o.id), `parameter ${j}`); } });
    assert.doesNotMatch(readFileSync(D + `${berkas(id)}.json`, "utf8"), DILARANG, "karakter terlarang");
  });
}

test("karbon: token {x} di naskah ada di cetakan angka topik_karbon.js", () => {
  const n = readFileSync(D + "karbon.json", "utf8"), src = readFileSync("public/topik_karbon.js", "utf8");
  const blok = src.slice(src.indexOf("const N = {"), src.indexOf("S.N = N;"));
  const dipakai = new Set([...n.matchAll(/\{(\w+)\}/g)].map((m) => m[1]));
  const ada = new Set([...blok.matchAll(/\b(\w+):/g)].map((m) => m[1]));
  for (const t of dipakai) assert.ok(ada.has(t), `token {${t}} tak dihitung`);
});

test("luar_karbon.json: 15 negara, nilai masuk akal, sumber terbuka bertanggal", () => {
  const d = baca(D + "luar_karbon.json");
  assert.equal(d.negara.length, 15);
  assert.match(d.tanggal_ambil, /^\d{4}-\d{2}-\d{2}$/);
  assert.match(d.ua, /METI-Network-research\/0\.1/);
  assert.match(d.lisensi, /CC BY/);
  for (const m of Object.values(d.sumber)) assert.match(m.url, /^https:\/\/ourworldindata\.org\/grapher\//);
  const idn = d.negara.find((n) => n.kode === "IDN");
  assert.ok(idn.cakupan.semua > 0 && idn.cakupan.semua < 100);
  for (const n of d.negara) { assert.ok(n.cakupan.semua >= 0 && n.cakupan.semua <= 100, n.kode); dua(n.nama, n.kode); }
  assert.doesNotMatch(JSON.stringify(d), DILARANG);
});

test("dasar-karbon: tanggal Excel serial diubah ke ISO, status registri dikenal", () => {
  const k = baca(D + "dasar-karbon.json").karbon;
  for (const p of k.kredit.daftar) {
    for (const t of [p.mulai, p.akhir]) if (t) assert.match(t, /^\d{4}-\d{2}-\d{2}$/, p.id);
    assert.ok(ui.s["status." + p.status], `status ${p.status} tanpa teks`);
  }
  assert.ok(k.bursa.length >= 12 && k.bursa.every((b) => b.url));
});

test("nav: /topik di grup Insight dengan kunci nav.topik di id dan en", () => {
  assert.match(readFileSync("public/inti/kepala.js", "utf8"), /href: "\/topik", kunci: "nav\.topik", ikon: "topik"/);
  for (const l of ["id", "en"]) assert.ok(baca(`public/i18n/${l}.json`)["nav.topik"]);
});

test("halaman topik: berkas CSS/JS ada dan tanpa pustaka luar", () => {
  const h = readFileSync("public/topik.html", "utf8");
  for (const f of ["/topik.css", "/topik.js"]) assert.ok(h.includes(f) && existsSync("public" + f));
  assert.doesNotMatch(h, /<(script|link)[^>]+(src|href)="https?:/i);
});
