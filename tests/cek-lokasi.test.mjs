// /cek-lokasi: geometri titik (public/inti/geo_titik.js), skor Hipotesis (public/cek_lokasi_hitung.js), dan keterpaduan berkas statis yang dibaca layar.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { jarakKm, jarakSegmenKm, jarakGarisKm, dalamCincin, dalamPoligon, dalamGeometri, fiturMemuat, terdekat, terdekatN, dalamKotak, titikSah } from "../public/inti/geo_titik.js";
import { BOBOT, LAHAN, MIN_KOMPONEN, hue, indeksBahaya, kelasBahaya, skorSumber, skorJaringan, skorLahan, skorBahaya, skorLokasi, kelasSkor } from "../public/cek_lokasi_hitung.js";

const baca = (f) => JSON.parse(fs.readFileSync(new URL("../public/" + f, import.meta.url), "utf8"));
const dekat = (a, b, tol) => assert.ok(Math.abs(a - b) <= tol, `${a} vs ${b} (+-${tol})`);

test("jarak: Jakarta-Bandung sekitar 116 km, nol untuk titik sama, simetris", () => {
  const jkt = { lat: -6.2088, lng: 106.8456 }, bdg = { lat: -6.9175, lng: 107.6191 };
  dekat(jarakKm(jkt, bdg), 116, 3);
  assert.equal(jarakKm(jkt, jkt), 0);
  assert.equal(jarakKm(jkt, bdg), jarakKm(bdg, jkt));
});

test("jarak ke segmen: tegak lurus, ujung, dan segmen nol panjang", () => {
  const a = { lng: 100, lat: 0 }, b = { lng: 101, lat: 0 };
  dekat(jarakSegmenKm({ lng: 100.5, lat: 0.1 }, a, b), 11.1, 0.3);              // 0,1 derajat lintang ~ 11,1 km
  dekat(jarakSegmenKm({ lng: 99, lat: 0 }, a, b), 111.2, 1);                    // di luar ujung a: jarak ke a
  dekat(jarakSegmenKm({ lng: 100, lat: 0.1 }, a, a), 11.1, 0.3);                // a == b
  assert.equal(jarakSegmenKm({ lng: 100.5, lat: 0 }, a, b), 0);
  assert.equal(jarakGarisKm({ lat: 0, lng: 100 }, [[100, 0]]), Infinity);
  dekat(jarakGarisKm({ lat: 0.1, lng: 100.5 }, [[100, 0], [101, 0], [102, 1]]), 11.1, 0.3);
});

test("titik-dalam-poligon: persegi, lubang, MultiPolygon, tepi bukan galat", () => {
  const luar = [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]], lubang = [[4, 4], [6, 4], [6, 6], [4, 6], [4, 4]];
  assert.ok(dalamCincin(5, 5, luar)); assert.ok(!dalamCincin(11, 5, luar));
  assert.ok(dalamPoligon(2, 2, [luar, lubang])); assert.ok(!dalamPoligon(5, 5, [luar, lubang]), "di dalam lubang");
  const multi = { type: "MultiPolygon", coordinates: [[luar], [[[20, 20], [30, 20], [30, 30], [20, 30], [20, 20]]]] };
  assert.ok(dalamGeometri(25, 25, multi)); assert.ok(!dalamGeometri(15, 15, multi));
  assert.ok(!dalamGeometri(1, 1, null)); assert.ok(!dalamGeometri(1, 1, { type: "Point", coordinates: [1, 1] }));
  assert.equal(fiturMemuat({ features: [{ geometry: multi, properties: { a: 1 } }] }, 25, 25).length, 1);
  assert.deepEqual(fiturMemuat(null, 1, 1), []);
  assert.doesNotThrow(() => dalamCincin(0, 0, luar));
});

test("terdekat dan terdekatN mengabaikan jarak tak hingga atau kosong", () => {
  const d = [1, 5, 3, 9];
  assert.deepEqual(terdekat(d, (x) => x), { item: 1, km: 1 });
  assert.equal(terdekat([], (x) => x), null);
  assert.equal(terdekat(d, () => Infinity), null);
  assert.deepEqual(terdekatN(d, (x) => (x === 5 ? Infinity : x), 2).map((x) => x.item), [1, 3]);
});

test("titikSah: kotak Indonesia, bulatkan 5 desimal, tolak bukan angka", () => {
  assert.deepEqual(titikSah("-6.2088123456", "106.8456"), { lat: -6.20881, lng: 106.8456 });
  for (const [a, b] of [[7, 100], [-12, 100], [0, 94], [0, 142], ["x", 100], [NaN, 1], [null, null], ["", ""]]) assert.equal(titikSah(a, b), null, `${a},${b}`);
  assert.ok(dalamKotak(-7, 110, [-11, 103, -5, 111])); assert.ok(!dalamKotak(-4, 110, [-11, 103, -5, 111]));
});

test("batas provinsi nyata: kota besar jatuh di provinsi yang benar, laut tidak", () => {
  const prov = baca("geo/provinsi.json");
  const di = (lat, lng) => prov.features.find((f) => dalamGeometri(lng, lat, f.geometry))?.properties.kode ?? null;
  assert.equal(di(-6.2088, 106.8456), "31");   // Jakarta
  assert.equal(di(-6.9175, 107.6191), "32");   // Bandung
  assert.equal(di(3.5952, 98.6722), "12");     // Medan
  assert.equal(di(-7.2575, 112.7521), "35");   // Surabaya
  assert.equal(di(-5.1477, 119.4327), "73");   // Makassar
  assert.equal(di(-3, 90), null);              // Samudra Hindia
  assert.equal(prov.features.length, 38);
});

test("jaringan nyata: dekat Jakarta ada gardu dan saluran dalam 30 km, di dalam kotak panen", () => {
  const g = baca("geo/gardu.json"), s = baca("geo/transmisi.json"), p = { lat: -6.2088, lng: 106.8456 };
  assert.ok(g.meta.cakupan_bbox.some((b) => dalamKotak(p.lat, p.lng, b)));
  const gd = terdekat(g.gardu, (x) => jarakKm(p, x)), sl = terdekat(s.garis, (x) => jarakGarisKm(p, x.koordinat));
  assert.ok(gd.km < 30, "gardu " + gd.km); assert.ok(sl.km < 30, "saluran " + sl.km);
  assert.ok(!g.meta.cakupan_bbox.some((b) => dalamKotak(-3.8, 138, b)), "Papua di luar kotak panen");
});

test("lahan nyata: lapisan dimuat dan titik di hutan lindung/konservasi bernilai kelas yang dikenal", () => {
  for (const f of ["lahan_hutan", "lahan_konsesi", "lahan_mangrove", "risiko_gambut", "risiko_adat"]) {
    const k = baca(`data/geo/${f}.geojson`);
    assert.ok(Array.isArray(k.features), f);
    for (const x of k.features.slice(0, 50)) assert.ok((x.properties.j || x.properties.k) in LAHAN, `${f}: ${x.properties.j || x.properties.k}`);
  }
  const hutan = baca("data/geo/lahan_hutan.geojson");
  const kelas = new Set(hutan.features.map((f) => f.properties.j));
  assert.deepEqual([...kelas].sort(), ["konservasi", "konversi", "lindung", "produksi"]);
});

test("bobot berjumlah 100 dan tiap bobot/pengurang bulat positif", () => {
  assert.equal(Object.values(BOBOT).reduce((a, b) => a + b, 0), 100);
  assert.equal(MIN_KOMPONEN, 3);
  for (const v of [...Object.values(BOBOT), ...Object.values(LAHAN)]) assert.ok(Number.isInteger(v) && v > 0);
});

test("skor komponen: batas dan monoton", () => {
  assert.equal(skorSumber(1200), 0); assert.equal(skorSumber(1650), 100); assert.equal(skorSumber(1000), 0); assert.equal(skorSumber(2000), 100); assert.equal(skorSumber(null), null);
  assert.ok(skorSumber(1500) > skorSumber(1400));
  assert.equal(skorJaringan(5), 100); assert.equal(skorJaringan(1), 100); assert.equal(skorJaringan(50), 0); assert.equal(skorJaringan(80), 0); assert.equal(skorJaringan(27.5), 50); assert.equal(skorJaringan(null), null); assert.equal(skorJaringan(Infinity), null);
  assert.equal(skorLahan([]), 100); assert.equal(skorLahan(["lindung"]), 0); assert.equal(skorLahan(["gambut"]), 50); assert.equal(skorLahan(["gambut", "adat", "hti"]), 0, "dibatasi 0"); assert.equal(skorLahan(["produksi"]), 75);
  assert.equal(skorBahaya(0), 100); assert.equal(skorBahaya(1), 0); assert.equal(skorBahaya(null), null);
});

test("bahaya dari warna InaRISK: hijau rendah, kuning sedang, merah tinggi, transparan tanpa data", () => {
  dekat(hue(164, 207, 34), 75, 1); dekat(hue(254, 60, 25), 9, 1);
  assert.equal(kelasBahaya(indeksBahaya(164, 207, 34, 255)), "rendah");
  assert.equal(kelasBahaya(indeksBahaya(253, 200, 32, 255)), "sedang");
  assert.equal(kelasBahaya(indeksBahaya(254, 60, 25, 255)), "tinggi");
  assert.equal(indeksBahaya(254, 60, 25, 0), null); assert.equal(indeksBahaya(0, 0, 0, 127), null);
  assert.ok(indeksBahaya(254, 60, 25, 255) > indeksBahaya(253, 200, 32, 255));
  assert.equal(hue(10, 10, 10), 0); assert.equal(kelasBahaya(null), null);
});

test("skorLokasi: rata-rata berbobot, komponen kosong dikeluarkan, minimal tiga komponen", () => {
  const penuh = { pvout: 1650, jaringanKm: 5, lahan: [], bahaya: 0, bpp: 1000, bppSemua: [1000, 900, 800] };
  const r = skorLokasi(penuh);
  assert.equal(r.dasar, 100); assert.ok(r.skor > 90 && r.skor <= 100, "skor " + r.skor);
  const tanpaJaringan = skorLokasi({ ...penuh, jaringanKm: null });
  assert.equal(tanpaJaringan.dasar, 75); assert.equal(Object.keys(tanpaJaringan.kom).length, 4);
  const manual = Object.values(tanpaJaringan.kom).reduce((a, x) => a + x.bobot * x.skor, 0) / 75;
  dekat(tanpaJaringan.skor, manual, 1e-9);
  const dua = skorLokasi({ pvout: 1500, jaringanKm: 10, lahan: null, bahaya: null, bpp: null, bppSemua: [] });
  assert.equal(dua.skor, null); assert.equal(dua.dasar, 50);
  const tiga = skorLokasi({ pvout: 1500, jaringanKm: 10, lahan: [], bahaya: null, bpp: null, bppSemua: [] });
  assert.ok(tiga.skor > 0); assert.equal(tiga.dasar, 75);
  const lindung = skorLokasi({ ...penuh, lahan: ["lindung"] });
  assert.ok(lindung.skor < r.skor - 20, "hutan lindung menurunkan skor tajam");
  const hitung = (x) => x.skor;
  const s1 = hitung(skorLokasi({ pvout: 1200, jaringanKm: 50, lahan: ["gambut"], bahaya: 1, bpp: 800, bppSemua: [800, 900, 1000] }));
  assert.ok(s1 >= 0 && s1 < 15, "skor terburuk mendekati 0: " + s1);
});

test("kelas skor: ambang 45 dan 70", () => {
  assert.equal(kelasSkor(70), "tinggi"); assert.equal(kelasSkor(69.9), "sedang"); assert.equal(kelasSkor(45), "sedang"); assert.equal(kelasSkor(44.9), "rendah"); assert.equal(kelasSkor(null), null);
});

test("berkas statis yang dibaca layar ada, dan pembaca-pembacanya memakai kunci yang benar", () => {
  const js = fs.readFileSync(new URL("../public/cek-lokasi.js", import.meta.url), "utf8");
  const jalur = [...js.matchAll(/["'](\/(?:geo|data|img)\/[\w\-/.]+\.(?:json|geojson|png))["']/g)].map((m) => m[1]);
  assert.ok(jalur.length >= 10, "jalur ditemukan: " + jalur.length);
  for (const j of jalur) assert.ok(fs.existsSync(new URL("../public" + j, import.meta.url)), j);
  const lh = baca("data/lokasi_hijau.json"), atlas = baca("data/potensi_atlas.json"), radar = baca("data/radar_kabupaten.json");
  assert.ok(lh.provinsi.every((p) => p.kode && "bpp" in p));
  assert.equal(atlas.baris.length, 38); assert.ok(atlas.baris.every((b) => b.pvout_kwh_per_kwp_tahun > 1000));
  assert.equal(radar.baris.length, 514); assert.ok(radar.baris.every((k) => k.kode && k.prov && k.nama));
  const pj = baca("data/proyek.json").baris.filter((b) => b.lokasi?.lat != null && b.lokasi.presisi && b.lokasi.presisi !== "provinsi");
  assert.ok(pj.length > 50, "proyek bertitik " + pj.length);
});
