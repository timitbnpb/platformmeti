// Skema data/strategis/ieto2025.json dan iseo2025.json (angka kajian IESR, bukan dokumen resmi).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const J = (f) => JSON.parse(readFileSync(new URL("../" + f, import.meta.url), "utf8"));
for (const [f, sid, hlmMax] of [["data/strategis/ieto2025.json", "iesr-ieto-2025", 114], ["data/strategis/iseo2025.json", "iesr-iseo-2025", 61]]) {
  test(f + ": sumber, halaman, tingkat_bukti kajian, id unik, celah", () => {
    const d = J(f);
    assert.deepEqual(d.sumber.map((s) => s.id), [sid]);
    for (const k of ["id", "judul", "penerbit", "tahun", "url"]) assert.ok(d.sumber[0][k] != null, k);
    assert.equal(d.sumber[0].penerbit.startsWith("IESR"), true);
    assert.match(d.meta.diperbarui, /^\d{4}-\d\d-\d\d$/);
    assert.equal(d.meta.tingkat_bukti, "kajian");
    assert.ok(d.meta.celah.length > 0);
    assert.ok(d.angka.length > 40);
    const ids = new Set();
    for (const a of d.angka) {
      assert.ok(!ids.has(a.id), "id ganda " + a.id); ids.add(a.id);
      assert.equal(a.sumber_id, sid, a.id);
      assert.equal(a.tingkat_bukti, "kajian", a.id);
      assert.ok(Number.isInteger(a.halaman) && a.halaman >= 1 && a.halaman <= hlmMax, a.id + " halaman");
      assert.ok(a.nilai != null && a.nilai !== "" && a.satuan && a.label && a.kelompok && a.rujukan, a.id + " kolom");
      assert.ok(Number.isInteger(a.tahun_data) || /^\d{4}-\d{4}$/.test(a.tahun_data), a.id + " tahun_data");
      assert.ok(a.label.length < 200 && (a.catatan || "").length < 400, a.id + " bukan salinan paragraf");
    }
  });
}
test("ieto2025.json: 10 variabel TRF dengan peringkat sah", () => {
  const d = J("data/strategis/ieto2025.json");
  assert.equal(d.tabel_trf.length, 10);
  for (const t of d.tabel_trf) assert.ok(["Rendah", "Sedang", "Tinggi"].includes(t.peringkat), t.variabel);
  assert.equal(d.angka.filter((a) => a.kelompok === "kesiapan").length, 10);
});
test("iseo2025.json: segmen berjumlah total, pembanding rantai merujuk id nyata", () => {
  const d = J("data/strategis/iseo2025.json");
  const v = (re) => d.angka.find((a) => re.test(a.label)).nilai;
  const jumlah = 285 + 245 + 56 + 131;
  assert.ok(Math.abs(jumlah - v(/total$/)) < 1, "segmen tidak menjumlah ke total");
  const rantai = J("public/data/rantai_plts.json");
  const idRantai = new Set([...rantai.pabrikan.map((p) => p.id), ...rantai.fasilitas_lain.map((f) => f.id)]);
  for (const p of d.pembanding_rantai) { if (p.rantai_plts_id) assert.ok(idRantai.has(p.rantai_plts_id), p.pabrikan_iesr); assert.ok(p.selisih && p.halaman); }
});
