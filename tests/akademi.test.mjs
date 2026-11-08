// /akademi: fungsi murni (public/akademi_hitung.js) dan keterpaduan public/data/akademi.json dengan konten wiki yang dirujuknya:
// tiap langkah/sumber menunjuk topik, istilah, tanya jawab perizinan, metode, atau halaman yang ADA, dan fakta tiap soal benar-benar tertulis di sumbernya.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { KUNCI, hrefSumber, nilaiKuis, statusModul, berikutnya, lencana, bersihkanProgres } from "../public/akademi_hitung.js";

const baca = (f) => JSON.parse(fs.readFileSync(new URL("../public/" + f, import.meta.url), "utf8"));
const D = baca("data/akademi.json");
const ISTILAH = new Map(baca("data/istilah.json").istilah.map((x) => [x.id, x]));
const IZIN = new Map(baca("data/izin_kontrak.json").tanya.map((x) => [x.id, x]));
const metodeSrc = fs.readFileSync(new URL("../public/metode_halaman.js", import.meta.url), "utf8");
const kosong = () => bersihkanProgres(null, D);
const semuaSumber = D.modul.flatMap((m) => [...m.langkah, ...m.kuis.map((s) => s.sumber)]);

test("struktur: enam modul, tiap modul 4 soal pilihan ganda berempat opsi, id unik, dwibahasa lengkap", () => {
  assert.equal(D.modul.length, 6);
  assert.deepEqual(D.modul.map((m) => m.id), ["dasar-ebt", "plts-atap", "perizinan", "pembiayaan", "karbon", "keselamatan"]);
  assert.ok(D.lulus_persen >= 50 && D.lulus_persen <= 100);
  const idSoal = new Set();
  for (const m of D.modul) {
    assert.ok(m.langkah.length >= 4, m.id); assert.ok(m.kuis.length >= 4, m.id);
    for (const x of [m.judul, m.ringkas, ...m.langkah.map((l) => l.judul)]) assert.ok(x.id && x.en, m.id);
    for (const s of m.kuis) {
      assert.ok(!idSoal.has(s.id), "id ganda " + s.id); idSoal.add(s.id);
      assert.equal(s.o.length, 4, s.id); assert.ok(Number.isInteger(s.a) && s.a >= 0 && s.a < 4, s.id);
      assert.ok(s.q.id && s.q.en && s.o.every((o) => o.id && o.en), s.id);
      assert.equal(new Set(s.o.map((o) => o.id)).size, 4, "opsi kembar " + s.id);
      assert.ok(s.cek && s.sumber, "soal tanpa sumber " + s.id);
    }
  }
  const dist = D.modul.flatMap((m) => m.kuis.map((s) => s.a));
  for (const i of [0, 1, 2, 3]) assert.ok(dist.filter((x) => x === i).length >= 3, "jawaban benar tidak boleh condong ke satu huruf: " + i);
});

test("tiap langkah dan sumber menunjuk konten yang ada", () => {
  for (const s of semuaSumber) {
    if (s.jenis === "topik") assert.ok(fs.existsSync(new URL(`../public/data/topik/${s.ref}.json`, import.meta.url)) || fs.existsSync(new URL(`../public/data/topik/${s.ref.replace(/-/g, "_")}.json`, import.meta.url)), "topik " + s.ref);
    else if (s.jenis === "istilah") assert.ok(ISTILAH.has(s.ref), "istilah " + s.ref);
    else if (s.jenis === "izin") assert.ok(IZIN.has(s.ref), "izin " + s.ref);
    else if (s.jenis === "metode") assert.ok(metodeSrc.includes(`id: "${s.ref}"`), "metode " + s.ref);
    else if (s.jenis === "halaman") assert.ok(fs.existsSync(new URL(`../public${s.ref.split(/[?#]/)[0]}.html`, import.meta.url)) || s.ref === "/", "halaman " + s.ref);
    else assert.fail("jenis tak dikenal " + s.jenis);
  }
});

test("fakta tiap soal tertulis di sumbernya (soal dari konten bersumber)", () => {
  const teksSumber = ({ jenis, ref }) => {
    if (jenis === "istilah") return ISTILAH.get(ref).arti.id;
    if (jenis === "izin") return IZIN.get(ref).a.id;
    const f = ["../public/data/topik/" + ref + ".json", "../public/data/topik/" + ref.replace(/-/g, "_") + ".json"].find((p) => fs.existsSync(new URL(p, import.meta.url)));
    return fs.readFileSync(new URL(f, import.meta.url), "utf8");
  };
  for (const m of D.modul) for (const s of m.kuis) assert.ok(teksSumber(s.sumber).toLowerCase().includes(s.cek.toLowerCase()), `${s.id}: "${s.cek}" tidak ada di sumber ${s.sumber.jenis}/${s.sumber.ref}`);
});

test("hrefSumber: tiap jenis dan penolakan jalur tak aman", () => {
  assert.equal(hrefSumber({ jenis: "topik", ref: "panas-bumi" }), "/panas-bumi?tab=dasar");
  assert.equal(hrefSumber({ jenis: "istilah", ref: "ppa" }), "/panduan#istilah-ppa");
  assert.equal(hrefSumber({ jenis: "metode", ref: "plts-atap" }), "/metode#plts-atap");
  assert.equal(hrefSumber({ jenis: "izin", ref: "iuptlu" }), "/perizinan");
  assert.equal(hrefSumber({ jenis: "halaman", ref: "/biaya-listrik" }), "/biaya-listrik");
  assert.equal(hrefSumber({ jenis: "halaman", ref: "//evil.example" }), "/", "dua garis miring dilarang");
  assert.equal(hrefSumber({ jenis: "halaman", ref: "javascript:alert(1)" }), "/");
  assert.equal(hrefSumber({ jenis: "x", ref: "y" }), "/");
  for (const s of semuaSumber) assert.match(hrefSumber(s), /^\/[\w\-/?=&#.%]*$/, JSON.stringify(s));
});

test("nilaiKuis: semua benar, sebagian, kosong, jawaban asing", () => {
  const m = D.modul[0], benar = Object.fromEntries(m.kuis.map((s) => [s.id, s.a]));
  assert.deepEqual(nilaiKuis(m, benar, 75), { benar: 4, total: 4, persen: 100, lulus: true });
  const tiga = { ...benar, [m.kuis[0].id]: (m.kuis[0].a + 1) % 4 };
  assert.deepEqual(nilaiKuis(m, tiga, 75), { benar: 3, total: 4, persen: 75, lulus: true });
  assert.equal(nilaiKuis(m, tiga, 80).lulus, false);
  assert.deepEqual(nilaiKuis(m, {}, 75), { benar: 0, total: 4, persen: 0, lulus: false });
  assert.equal(nilaiKuis(m, null, 75).benar, 0);
  assert.equal(nilaiKuis(m, { zzz: 1, [m.kuis[0].id]: String(m.kuis[0].a) }, 75).benar, 0, "string bukan indeks");
  assert.equal(nilaiKuis({ kuis: [] }, {}, 75).persen, 0);
});

test("status modul, urutan saran, dan lencana", () => {
  const P = kosong(), m0 = D.modul[0];
  assert.equal(statusModul(m0, P, D.lulus_persen).tahap, "baru");
  assert.equal(berikutnya(D, P), m0.id);
  P.langkah[m0.id + "/0"] = 1;
  assert.equal(statusModul(m0, P, D.lulus_persen).tahap, "jalan");
  m0.langkah.forEach((_, i) => { P.langkah[m0.id + "/" + i] = 1; });
  assert.deepEqual(statusModul(m0, P, D.lulus_persen), { selesai: m0.langkah.length, total: m0.langkah.length, terbaik: null, tahap: "siap" });
  P.kuis[m0.id] = { terbaik: 50, waktu: 1 };
  assert.equal(statusModul(m0, P, D.lulus_persen).tahap, "siap", "nilai di bawah batas belum lulus");
  P.kuis[m0.id] = { terbaik: 75, waktu: 1 };
  assert.equal(statusModul(m0, P, D.lulus_persen).tahap, "lulus");
  assert.equal(berikutnya(D, P), D.modul[1].id);
  assert.deepEqual(lencana(D, P), { modul: [m0.id], semua: false });
  for (const m of D.modul) P.kuis[m.id] = { terbaik: 100, waktu: 1 };
  assert.equal(berikutnya(D, P), null);
  assert.deepEqual(lencana(D, P), { modul: D.modul.map((m) => m.id), semua: true });
});

test("bersihkanProgres: buang isi localStorage tak sah, simpan yang sah", () => {
  const m = D.modul[1], baik = { langkah: { [m.id + "/0"]: 1, [m.id + "/1"]: 1 }, kuis: { [m.id]: { terbaik: 80.4, waktu: 5 } } };
  const h = bersihkanProgres(baik, D);
  assert.deepEqual(h.langkah, baik.langkah); assert.deepEqual(h.kuis[m.id], { terbaik: 80, waktu: 5 });
  const jahat = { langkah: { "tak-ada/0": 1, [m.id + "/99"]: 1, [m.id + "/0"]: "ya", __proto__: { x: 1 } }, kuis: { [m.id]: { terbaik: 900 }, zzz: { terbaik: 50 } } };
  assert.deepEqual(bersihkanProgres(jahat, D), { langkah: {}, kuis: {} });
  for (const x of [null, undefined, "teks", 5, [], { langkah: null, kuis: 7 }]) assert.deepEqual(bersihkanProgres(x, D), { langkah: {}, kuis: {} });
  assert.match(KUNCI, /^meti-akademi-v\d+$/);
});
