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
  assert.equal(tierMedia(r(1, "x", "antaranews.com", "", "id"), tabel), "nasional");   // K21: Antara ditolak, tidak ada di tabel tier; jatuh ke bawaan "nasional" (domain .com berbahasa id)
  assert.equal(tierMedia(r(1, "x", "jateng.tribunnews.com", "", "id"), tabel), "daerah");
  assert.equal(tierMedia(r(1, "x", "esdm.go.id", "", "id"), tabel), "rilis");
  assert.equal(tierMedia(r(1, "x", "foo.com", "", "en"), tabel), "internasional");
});

test("rekap judul harian (F65-305): hari terbaru yang cukup judul, satu judul satu kelompok, 'lain' terakhir, tanpa AI dan tanpa kalimat buatan", async () => {
  const { rekapHarian, tglWib } = await import("../public/berita_kamus.js");
  assert.equal(tglWib("2026-11-06T18:30:00Z"), "2026-11-07", "tanggal WIB, bukan UTC");
  const rows = [r(1, "RUPTL baru menambah PLTS", "a.com", "2026-11-07T02:00:00Z"), r(2, "PLN bahas RUPTL dengan DPR", "b.com", "2026-11-07T03:00:00Z"),
    r(3, "Harga nikel turun", "a.com", "2026-11-07T04:00:00Z"), r(4, "Proyek hidrogen hijau dimulai", "c.com", "2026-11-07T05:00:00Z"),
    r(5, "Satu judul saja hari ini", "d.com", "2026-11-08T05:00:00Z"), r(6, "", "d.com", "2026-11-08T06:00:00Z"), r(7, "Tanggal rusak", "d.com", "bukan-tanggal")];
  const k = rekapHarian(rows);
  assert.equal(k.tanggal, "2026-11-07", "8 Nov hanya punya satu judul, jadi dilewati"); assert.equal(k.n, 4); assert.equal(k.media, 3);
  assert.deepEqual(k.kelompok.map((x) => [x.id, x.n]), [["ruptl", 2], ["hidrogen", 1], ["lain", 1]]);
  assert.equal(k.kelompok.reduce((n, x) => n + x.n, 0), k.n, "tiap judul tepat satu kelompok");
  assert.equal(rekapHarian(rows.slice(4)), null, "tanpa hari yang cukup judul tidak ada rekap");
  const banyak = Array.from({ length: 8 }, (_, i) => r(i, "RUPTL nomor " + i, "a.com", "2026-11-07T0" + i + ":00:00Z"));
  const b = rekapHarian(banyak); assert.equal(b.kelompok[0].judul.length, 5); assert.equal(b.kelompok[0].lagi, 3);
  const nyata = rekapHarian(JSON.parse(readFileSync(new URL("../public/data/berita.json", import.meta.url), "utf8")).baris);
  assert.ok(nyata && nyata.n >= 3 && nyata.kelompok.every((x) => x.judul.every((j) => j.judul && j.url)));
  const src = readFileSync(new URL("../public/berita.js", import.meta.url), "utf8"), f = src.slice(src.indexOf("function gambarRekap"), src.indexOf("function gambarAngka"));
  assert.ok(!/api\(|fetch\(|\/api\//.test(f), "rekap dihitung di peramban dari data yang sudah dimuat; tidak memanggil server atau AI");
  assert.match(f, /esc\(x\.judul\)/); assert.match(f, /rel="noopener noreferrer"/);
});
