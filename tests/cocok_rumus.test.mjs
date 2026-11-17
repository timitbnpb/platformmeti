// Uji acuan skor pencocokan bisnis (F65-209): tiap komponen dihitung ulang dari contoh tertulis, termasuk data kosong.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { peranOrg, indeksProyek, ciriOrg, skorCocok, cocokUntuk, PERAN_COCOK, KOMPONEN_COCOK } from "../public/inti/cocok_rumus.js";

const baca = (f) => JSON.parse(readFileSync(new URL("../public/data/" + f, import.meta.url), "utf8"));
const S = (...x) => new Set(x);

test("peran hanya dari kolom yang ada: peran_rantai, kategori, pabrikan TKDN", () => {
  assert.deepEqual(peranOrg({ id: "a", peran_rantai: ["pengembang", "IPP"] }), ["pengembang"]);
  assert.deepEqual(peranOrg({ id: "b", peran_rantai: ["EPC", "manufaktur"] }), ["epc", "pemasok"]);
  assert.deepEqual(peranOrg({ id: "c", kategori: { kode: "keuangan" } }), ["pembiaya"]);
  assert.deepEqual(peranOrg({ id: "d", peran_rantai: ["pendana"] }), ["pembiaya"]);
  assert.deepEqual(peranOrg({ id: "e" }, S("e")), ["pemasok"], "pabrikan bersertifikat TKDN");
  assert.deepEqual(peranOrg({ id: "f", kategori: { kode: "pemda" } }), [], "tanpa data peran = tanpa peran, bukan tebakan");
  assert.deepEqual(peranOrg(undefined), []);
});

test("skor: rata-rata komponen yang ada; contoh hitung tangan", () => {
  const a = { tek: ["surya", "hidro"], prov: S("Bali", "Riau"), mw: 50, tahap: S("konstruksi") };
  const b = { tek: ["surya"], prov: S("Riau"), mw: 100, tahap: S("rencana", "konstruksi") };
  const r = skorCocok(a, b);
  assert.deepEqual(r.komponen, { teknologi: 0.5, wilayah: 1, ukuran: 0.5, tahap: 1 });
  assert.equal(r.skor, 75); assert.equal(r.terhitung, 4);
  assert.deepEqual(r.sama, { tek: ["surya"], prov: ["Riau"] });
});

test("komponen tanpa data dikeluarkan, bukan dinolkan; tanpa teknologi sama = tidak tampil", () => {
  const a = { tek: ["surya"], prov: null, mw: null, tahap: null }, b = { tek: ["surya", "bayu"], prov: S("Bali"), mw: 10, tahap: S("rencana") };
  const r = skorCocok(a, b);
  assert.deepEqual(r.komponen, { teknologi: 1, wilayah: null, ukuran: null, tahap: null });
  assert.equal(r.skor, 100); assert.equal(r.terhitung, 1);
  assert.equal(skorCocok({ tek: ["hidro"], prov: S("Bali"), mw: 1, tahap: S("rencana") }, b), null);
  assert.equal(skorCocok({ tek: [], prov: null, mw: null, tahap: null }, b), null);
  const beda = skorCocok({ tek: ["surya"], prov: S("Aceh"), mw: 10, tahap: S("beroperasi") }, b);
  assert.deepEqual(beda.komponen, { teknologi: 1, wilayah: 0, ukuran: 1, tahap: 0 }); assert.equal(beda.skor, 50);
});

test("indeks proyek: provinsi, median MW, dan tahap dari pihak proyek dan proyek_ids", () => {
  const proyek = [
    { id: "p1", lokasi: { provinsi: "Bali" }, kapasitas: [{ nilai: 10, satuan: "MW" }], status: [{ nilai: "rencana" }], pihak: { pemilik: [{ nilai: "X", organisasi_id: "o1" }] } },
    { id: "p2", lokasi: { provinsi: "Riau" }, kapasitas: [{ nilai: 30, satuan: "MWp" }], status: [{ nilai: "konstruksi" }], pihak: {} },
    { id: "p3", kapasitas: [{ nilai: 9, satuan: "ton/hari" }], pihak: { pelaksana: [{ nilai: "Y", organisasi_id: "o1" }] } },
  ];
  const ix = indeksProyek(proyek, [{ id: "o1", proyek_ids: ["p2"] }]);
  const c = ciriOrg({ id: "o1", kepakaran: ["surya", "kebijakan"], lokasi: { provinsi: "Jawa Barat" } }, ix);
  assert.deepEqual(c.tek, ["surya"], "hanya slug teknologi");
  assert.deepEqual([...c.prov].sort(), ["Bali", "Jawa Barat", "Riau"]);
  assert.equal(c.mw, 20); assert.deepEqual([...c.tahap].sort(), ["konstruksi", "rencana"]);
  const kosong = ciriOrg({ id: "o9" }, ix);
  assert.deepEqual(kosong, { id: "o9", tek: [], prov: null, mw: null, tahap: null });
});

test("urutan seri: skor, lalu jumlah komponen terhitung, lalu nama; diri sendiri dan peran lain tidak ikut", () => {
  const org = { id: "saya", nama: "Saya", kepakaran: ["surya"], lokasi: { provinsi: "Bali" }, peran_rantai: ["pengembang"] };
  const semua = [org,
    { id: "z", nama: "Zeta EPC", kepakaran: ["surya"], peran_rantai: ["EPC"] },
    { id: "a", nama: "Alfa EPC", kepakaran: ["surya"], peran_rantai: ["EPC"] },
    { id: "l", nama: "Lengkap EPC", kepakaran: ["surya"], lokasi: { provinsi: "Bali" }, peran_rantai: ["EPC"] },
    { id: "h", nama: "Hidro EPC", kepakaran: ["hidro"], peran_rantai: ["EPC"] },
    { id: "b", nama: "Bank", kepakaran: ["surya"], kategori: { kode: "keuangan" } }];
  assert.deepEqual(cocokUntuk(org, semua, "epc").map((r) => r.o.id), ["l", "a", "z"]);
  assert.deepEqual(cocokUntuk(org, semua, "pembiaya").map((r) => r.o.id), ["b"]);
  assert.deepEqual(cocokUntuk(org, semua, "sihir"), []); assert.deepEqual(cocokUntuk(null, semua, "epc"), []);
  assert.deepEqual(PERAN_COCOK, ["pembiaya", "epc", "pemasok", "pengembang"]); assert.equal(KOMPONEN_COCOK.length, 4);
});

test("data nyata: tiap peran punya organisasi, skor selalu 0 sampai 100, tanpa NaN", () => {
  const org = baca("organisasi.json").baris, proyek = baca("proyek.json").baris;
  const pabrikan = new Set(baca("tkdn_produk.json").baris.map((x) => x.pabrikan_org_id).filter(Boolean));
  const ix = indeksProyek(proyek, org);
  for (const p of PERAN_COCOK) assert.ok(org.some((o) => peranOrg(o, pabrikan).includes(p)), "tidak ada organisasi berperan " + p);
  const contoh = org.find((o) => peranOrg(o, pabrikan).includes("pengembang") && (o.kepakaran || []).includes("surya"));
  for (const p of PERAN_COCOK) for (const r of cocokUntuk(contoh, org, p, { ix, pabrikan })) { assert.ok(Number.isInteger(r.skor) && r.skor >= 0 && r.skor <= 100, r.o.id); assert.ok(r.sama.tek.length > 0); assert.notEqual(r.o.id, contoh.id); }
});
