// Uji beda teks pasal (F65-111): fungsi murni, plus satu pasangan peraturan nyata dari korpus hukum/.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { bedaKata, bedaTeks, ringkasBeda, kunciPasal, pasangPasal, buangPerintah, AMBANG } from "../public/inti/beda_teks.js";

const gabung = (ops, j) => ops.filter((o) => o.j === "sama" || o.j === j).map((o) => o.s).join(" ").replace(/\s+/g, " ").trim();
const rapi = (s) => s.split(/\s+/).filter(Boolean).join(" ");

test("sama persis: satu blok sama; dua teks kosong: tanpa blok", () => {
  assert.deepEqual(bedaTeks("izin usaha  penyediaan\ntenaga listrik", "izin usaha penyediaan tenaga listrik"), [{ j: "sama", s: "izin usaha penyediaan tenaga listrik" }]);
  assert.deepEqual(bedaTeks("", ""), []);
  assert.deepEqual(bedaTeks(null, undefined), []);
});

test("sisip, hapus, ganti: hapusan ditulis sebelum tambahan", () => {
  assert.deepEqual(bedaTeks("a b d", "a b c d"), [{ j: "sama", s: "a b" }, { j: "tambah", s: "c" }, { j: "sama", s: "d" }]);
  assert.deepEqual(bedaTeks("a b c d", "a d"), [{ j: "sama", s: "a" }, { j: "hapus", s: "b c" }, { j: "sama", s: "d" }]);
  assert.deepEqual(bedaTeks("izin dari Menteri", "izin dari Pemerintah Pusat"), [{ j: "sama", s: "izin dari" }, { j: "hapus", s: "Menteri" }, { j: "tambah", s: "Pemerintah Pusat" }]);
  assert.deepEqual(ringkasBeda(bedaTeks("izin dari Menteri", "izin dari Pemerintah Pusat")), { tambah: 2, hapus: 1 });
});

test("satu sisi kosong: seluruhnya tambah atau seluruhnya hapus", () => {
  assert.deepEqual(bedaTeks("", "pasal baru"), [{ j: "tambah", s: "pasal baru" }]);
  assert.deepEqual(bedaTeks("pasal lama", ""), [{ j: "hapus", s: "pasal lama" }]);
});

test("sifat dasar: blok sama+hapus menyusun teks lama, sama+tambah menyusun teks baru", () => {
  const a = "(1) Kewenangan Pemerintah di bidang ketenagalistrikan meliputi: a. penetapan kebijakan; b. penetapan izin usaha; c. pembinaan.";
  const b = "(1) Kewenangan Pemerintah Pusat di bidang Ketenagalistrikan meliputi: a. penetapan kebijakan; b. penetapan Perizinan Berusaha; c. pembinaan dan pengawasan.";
  const ops = bedaTeks(a, b);
  assert.equal(gabung(ops, "hapus"), rapi(a)); assert.equal(gabung(ops, "tambah"), rapi(b));
  assert.ok(ops.some((o) => o.j === "tambah" && o.s === "Pusat"));
});

test("teks panjang: di atas ambang turun ke per baris, tetap benar dan selesai cepat", () => {
  const ayat = (i, ekor = "") => `(${i}) Badan usaha wajib menyampaikan laporan berkala nomor ${i} kepada Menteri paling lambat tiga puluh hari${ekor}.`;
  const lama = Array.from({ length: 400 }, (_, i) => ayat(i)).join("\n");
  const baru = Array.from({ length: 400 }, (_, i) => (i === 200 ? ayat(i, " kerja") : i === 300 ? "" : ayat(i))).filter(Boolean).join("\n");
  assert.equal(bedaKata(lama, baru), null, "contoh harus melewati ambang per kata");
  assert.ok(lama.split(/\s+/).length ** 2 > AMBANG);
  const t0 = Date.now(), ops = bedaTeks(lama, baru);
  assert.ok(Date.now() - t0 < 1500, "beda teks panjang terlalu lambat");
  assert.equal(gabung(ops, "hapus"), rapi(lama)); assert.equal(gabung(ops, "tambah"), rapi(baru));
  // "hari." menjadi "hari kerja.": kata berakhiran titik itu diganti, dan ayat ke-300 hilang seutuhnya
  assert.deepEqual(ops.filter((o) => o.j === "tambah").map((o) => o.s), ["hari kerja."]);
  assert.deepEqual(ops.filter((o) => o.j === "hapus").map((o) => o.s.split(" ").length), [1, 16]);
});

test("terlalu besar di dua tingkat: hapus seutuhnya lalu tambah seutuhnya, tanpa macet", () => {
  assert.deepEqual(bedaTeks("a b c", "x y z", 4), [{ j: "hapus", s: "a b c" }, { j: "tambah", s: "x y z" }]);
});

test("kunci pasal: angka Arab dan sisipan huruf cocok, angka Romawi dan judul lain tidak", () => {
  assert.equal(kunciPasal("Pasal 5"), "5"); assert.equal(kunciPasal("Pasal5"), "5"); assert.equal(kunciPasal(" Pasal 12 A "), "12A"); assert.equal(kunciPasal("Pasal 7B"), "7B");
  for (const x of ["Pasal I", "Pasal II", "Menimbang", "BAB I", "", null, "Pasal 5 ayat (1)"]) assert.equal(kunciPasal(x), null);
});

test("pasang pasal: berubah, sisipan, pasal lama yang tidak disebut, label ganda", () => {
  const lama = [{ label: "Menimbang", teks: "x" }, { label: "Pasal 1", teks: "satu" }, { label: "Pasal 2", teks: "dua" }, { label: "Pasal 3", teks: "tiga" }];
  const baru = [{ label: "Pasal I", teks: "Beberapa ketentuan diubah" }, { label: "Pasal 2", teks: "dua baru" }, { label: "Pasal 2A", teks: "sisipan" }, { label: "Pasal 2", teks: "kutipan ulang" }, { label: "Pasal II", teks: "berlaku" }];
  assert.deepEqual(pasangPasal(lama, baru), { pasangan: [{ pasal: "2", lama: "dua", baru: "dua baru" }, { pasal: "2A", lama: null, baru: "sisipan" }], tetap: 2 });
  assert.deepEqual(pasangPasal([], []), { pasangan: [], tetap: 0 });
  assert.deepEqual(pasangPasal(null, undefined), { pasangan: [], tetap: 0 });
});

test("pasangan nyata di korpus: Permen ESDM 5/2018 mengubah 33/2017, pasal yang sama ditemukan dan berbeda", () => {
  const seg = (f) => { const bag = readFileSync(new URL("../hukum/permen/" + f, import.meta.url), "utf8").split(/^### (Pasal [^\n]+)\n/m); const out = []; for (let i = 1; i < bag.length; i += 2) out.push({ label: bag[i].trim(), teks: bag[i + 1].split(/^## /m)[0] }); return out; };
  const { pasangan, tetap } = pasangPasal(seg("2017/permen-esdm-33-2017.md"), seg("2018/permen-esdm-5-2018.md"));
  assert.deepEqual(pasangan.map((p) => p.pasal), ["3", "4", "5", "6", "9", "11", "13", "15"]);
  assert.equal(tetap, 8);
  for (const p of pasangan) assert.ok(!/Ketentuan[^\n]*Pasal \d+ diubah/.test(p.baru), "Pasal " + p.pasal + " masih membawa perintah perubahan berikutnya");
  for (const p of pasangan) { assert.ok(p.lama, "Pasal " + p.pasal + " tanpa versi lama"); const r = ringkasBeda(bedaTeks(p.lama, p.baru)); assert.ok(r.tambah + r.hapus > 0, "Pasal " + p.pasal + " seharusnya berubah"); }
});

// F65-110: tiap butir kewenangan harus benar-benar ada di teks korpus (tanpa spasi dan tanda baca, karena teks hasil baca PDF); sel kosong wajib punya alasan.
test("kewenangan.json: tiap butir ada di teks korpus, sel kosong beralasan, dasar menaut regulasi yang ada", () => {
  const d = JSON.parse(readFileSync(new URL("../public/data/kewenangan.json", import.meta.url), "utf8"));
  const rata = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const korpus = rata(readFileSync(new URL("../hukum/uu/2023/uu-6-2023.md", import.meta.url), "utf8"));
  const reg = new Set(JSON.parse(readFileSync(new URL("../public/data/regulasi.json", import.meta.url), "utf8")).baris.map((r) => r.id));
  let butir = 0;
  for (const u of d.urusan) {
    assert.deepEqual(Object.keys(u.tingkat), ["pusat", "provinsi", "kabkota"], u.id);
    for (const x of [u.dasar, u.diubah].filter(Boolean)) assert.ok(reg.has(x.regulasi_id) && x.pasal && x.dok, u.id + " dasar tak menaut");
    if (!u.dasar) assert.ok(u.belum, u.id + " tanpa dasar harus menulis alasannya");
    for (const [k, x] of Object.entries(u.tingkat)) {
      if (!x.butir.length) { assert.ok(["tanpa-ayat", "belum-teks"].includes(x.kosong), `${u.id}/${k} kosong tanpa alasan`); continue; }
      assert.ok(u.dasar && x.rujukan, `${u.id}/${k} berbutir tanpa pasal`);
      for (const b of x.butir) { butir++; assert.ok(korpus.includes(rata(typeof b === "string" ? b : b.korpus)), `${u.id}/${k}: "${(typeof b === "string" ? b : b.teks).slice(0, 60)}" tidak ada di korpus`); }
    }
  }
  assert.equal(butir, 42);
  for (const s of d.sumber) assert.ok(readFileSync(new URL("../" + s.berkas, import.meta.url), "utf8").includes(s.url), s.id + ": url sumber tidak sama dengan korpus");
});

test("buang perintah: ekor perintah perubahan dibuang, isi pasal biasa tidak disentuh", () => {
  assert.equal(buangPerintah("(1) Bunyi baru.\n(2) Ayat dua.\n4. Ketentuan ayat (1) Pasal 6 diubah dan ayat\n(2) dihapus, sehingga Pasal 6 berbunyi sebagai berikut:\n"), "(1) Bunyi baru.\n(2) Ayat dua.");
  assert.equal(buangPerintah("Bunyi.\n7 Ketentuan Pasal 13 diubah sehingga berbunyi sebagai berikut:"), "Bunyi.");
  const biasa = "(1) Menteri menetapkan:\n1. Ketentuan teknis;\n2. Pedoman.";
  assert.equal(buangPerintah(biasa), biasa);
  assert.equal(buangPerintah("4. Ketentuan Pasal 6 diubah sehingga berbunyi sebagai berikut:"), "4. Ketentuan Pasal 6 diubah sehingga berbunyi sebagai berikut:");
  assert.equal(buangPerintah(null), "");
});
