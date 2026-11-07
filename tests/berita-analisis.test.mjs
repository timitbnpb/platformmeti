// Fungsi murni analisis berita: kluster Jaccard, kamus isu, negaraMedia, tier.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { token, jaccard, klaster, hitungIsu, negaraMedia, tierMedia, ISU, DESAK, DESAK_KATA } from "../public/berita_kamus.js";
const tabel = JSON.parse(readFileSync(new URL("../public/data/media_tier.json", import.meta.url), "utf8"));
const r = (id, judul, media, terbit, bahasa = "id") => ({ id, judul, media, terbit, bahasa, url: `https://${media}/x` });

test("jaccard: identik 1, lepas 0", () => {
  assert.equal(jaccard(token("PLTS Jatigede 100 MW dimulai"), token("PLTS Jatigede 100 MW dimulai")), 1);
  assert.equal(jaccard(token("nuklir Bangka"), token("hidrogen Papua")), 0);
});
test("klaster: judul sejenis dalam 72 jam bergabung, di luar jendela tidak", () => {
  const rows = [r(1, "PJT II: PLTS Jatigede 100 MW segera dimulai", "a.com", "2026-11-05T10:00:00Z"), r(2, "PLTS Jatigede 100 MW segera dimulai kata PJT II", "b.com", "2026-11-04T10:00:00Z"),
    r(3, "PLTS Jatigede 100 MW segera dimulai, PJT II", "c.com", "2026-10-20T10:00:00Z"), r(4, "Harga nikel turun", "d.com", "2026-11-05T09:00:00Z")];
  const k = klaster(rows);
  assert.equal(k.length, 1);
  assert.deepEqual(k[0].media.sort(), ["a.com", "b.com"]);
});
test("kamus isu: hitungan 24 jam, 7 hari, pekan lalu", () => {
  const ak = Date.parse("2026-11-07T12:00:00Z");
  const rows = [r(1, "Nuklir PLTN pertama", "a", "2026-11-07T06:00:00Z"), r(2, "SMR nuklir Bangka", "a", "2026-11-03T06:00:00Z"), r(3, "Nuklir lagi", "a", "2026-10-28T06:00:00Z"), r(4, "Target B50 2026", "a", "2026-11-06T06:00:00Z")];
  const n = hitungIsu(rows, ak).find((x) => x.id === "nuklir");
  assert.deepEqual([n.h24, n.h7, n.lalu, n.selisih], [1, 2, 1, 100]);
  assert.equal(ISU.find(([id]) => id === "biodiesel")[1].test("Target B50 2026"), true);
});
test("desakan: kata desak + kategori", () => {
  const j = "Pengusaha desak percepat izin PLTS atap";
  assert.ok(DESAK_KATA.test(j) && DESAK.find(([id]) => id === "izin")[1].test(j));
  assert.ok(!DESAK_KATA.test("Peresmian PLTS atap"));
});
test("negaraMedia: peta domain, TLD, generik, tak dikenal", () => {
  assert.equal(negaraMedia("www.thestar.com.my"), "my");
  assert.equal(negaraMedia("en.antaranews.com"), "id");
  assert.equal(negaraMedia("english.news.cn"), "cn");
  assert.equal(negaraMedia("pv-tech.org"), "us");
  assert.equal(negaraMedia("kosong"), "");
});
test("tierMedia: domain, subdomain daerah, nama, bawaan", () => {
  assert.equal(tierMedia(r(1, "x", "antaranews.com", "", "id"), tabel), "utama");
  assert.equal(tierMedia(r(1, "x", "jateng.tribunnews.com", "", "id"), tabel), "daerah");
  assert.equal(tierMedia(r(1, "x", "esdm.go.id", "", "id"), tabel), "rilis");
  assert.equal(tierMedia(r(1, "x", "foo.com", "", "en"), tabel), "internasional");
});
