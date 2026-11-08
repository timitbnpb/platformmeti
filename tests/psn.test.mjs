// /psn: parser lampiran Permenko 16/2025, potret public/data/psn.json, dan fungsi hitung layar.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { uraiLampiran, kodeLokasi, PROGRAM, SMELTER, SEKTOR, bangun } from "../scripts/pipa/psn_bangun.mjs";
import { saring, hitungPer, barisLinimasa, totalInvestasi, tahunDari, STATUS, SEKTOR as SEK_LAYAR } from "../public/psn_hitung.js";
import { PROV } from "../public/inti/prov_singkat.js";

const TEKS = readFileSync(new URL("../data/psn/permenko-16-2025.txt", import.meta.url), "utf8");
const D = JSON.parse(readFileSync(new URL("../public/data/psn.json", import.meta.url), "utf8"));
const rata = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const T = rata(TEKS);

test("parser: 228 nomor proyek, 2 dihapus, 226 aktif; nomor berurutan", () => {
  const { proyek } = uraiLampiran(TEKS);
  assert.equal(proyek.length, 228);
  assert.deepEqual(proyek.map((p) => p.no), Array.from({ length: 228 }, (_, i) => i + 1));
  assert.equal(proyek.filter((p) => /^dihapus$/i.test(p.nama)).length, 2);
  assert.equal(proyek.find((p) => p.no === 200).nama, "Pengembangan Lapangan Abadi Wilayah Kerja Masela");
  assert.equal(proyek.find((p) => p.no === 200).lokasi, "Provinsi Maluku");
  assert.equal(proyek.find((p) => p.no === 215).sektor, "J");
  assert.ok(proyek.every((p) => SEKTOR[p.sektor]));
});

test("kodeLokasi: provinsi tunggal, ganda, dan nasional", () => {
  assert.deepEqual(kodeLokasi("Provinsi Kalimantan Timur"), ["64"]);
  assert.deepEqual(kodeLokasi("Provinsi Aceh dan Sumatera Utara"), ["11", "12"]);
  assert.deepEqual(kodeLokasi("Provinsi Daerah Khusus Ibukota Jakarta, Provinsi Jawa Barat, dan Provinsi Banten"), ["31", "32", "36"]);
  assert.deepEqual(kodeLokasi("Nasional"), []);
});

test("program dan smelter tertulis ulang: tiap nama muncul di teks lampiran", () => {
  assert.equal(PROGRAM.length, 24);
  for (const p of PROGRAM) assert.ok(T.includes(rata(p.nama).split(" ").slice(0, 2).join(" ")), "program: " + p.nama);
  assert.equal(SMELTER.length, 19);
  for (const [nama] of SMELTER) assert.ok(T.includes(rata(nama).replace(/^pt /, "").split(" ").slice(0, 3).join(" ")), "smelter: " + nama);
});

test("psn.json: id unik, sumber resmi pada tiap baris, status dan sektor sah", () => {
  const id = D.baris.map((b) => b.id);
  assert.equal(new Set(id).size, id.length);
  assert.equal(D.meta.jumlah_proyek, 226);
  assert.equal(D.baris.filter((b) => b.tipe === "proyek").length, 226);
  for (const b of D.baris) {
    assert.ok(b.sumber.some((s) => s.id === "bpk16" && /^https:\/\/peraturan\.bpk\.go\.id\//.test(s.url)), b.id);
    assert.ok(STATUS.includes(b.status), b.id + " status " + b.status);
    assert.ok(SEK_LAYAR.includes(b.sektor), b.id + " sektor " + b.sektor);
    assert.ok(b.prov_kode.every((k) => PROV[k]), b.id + " prov");
    assert.ok(["resmi", "media"].includes(b.tingkat_bukti), b.id);
    assert.ok(b.dasar_hukum.length >= 1 && b.dasar_hukum.every((h) => D.regulasi.some((r) => r.id === h)), b.id + " hukum");
  }
});

test("psn.json: koordinat di Indonesia, presisi tercatat, tanpa em dash, URL sumber https", () => {
  for (const b of D.baris) {
    if (b.lat == null) { assert.equal(b.presisi_titik, null, b.id); continue; }
    assert.ok(b.lat > -12 && b.lat < 7 && b.lng > 94 && b.lng < 142, `${b.id} ${b.lat},${b.lng}`);
    assert.ok(["kabupaten", "provinsi", "kawasan"].includes(b.presisi_titik), b.id);
  }
  const s = JSON.stringify(D);
  assert.ok(!/[–—]/.test(s), "em/en dash");
  for (const b of D.baris) for (const x of b.sumber) assert.ok(!x.url || /^https:\/\//.test(x.url), b.id);
});

test("psn.json: angka hanya dari butir bersumber; butir lengkap punya sumber selain lampiran", () => {
  for (const b of D.baris) {
    if (b.investasi || b.kapasitas || b.progres != null || b.tonggak.length) assert.ok(b.sumber.length >= 2 && b.lengkap === 1, b.id + " angka tanpa sumber");
    if (b.progres != null) assert.ok(b.progres >= 0 && b.progres <= 100, b.id);
    for (const x of b.tonggak) assert.ok(b.sumber.some((s) => s.id === x.sumber), b.id + " tonggak " + x.sumber);
    for (const x of b.isu) assert.ok(b.sumber.some((s) => s.id === x.sumber), b.id + " isu");
  }
  const masela = D.baris.find((b) => b.id === "psn-200");
  assert.equal(masela.investasi.usd_miliar, 21);
  assert.equal(masela.status, "pra-konstruksi");
});

test("psn.json: energi inti memuat sektor energi, PIK, PLTA Mentarang, PSEL", () => {
  const inti = D.baris.filter((b) => b.energi === "inti").map((b) => b.id);
  for (const x of ["psn-200", "psn-215", "psn-p01d", "psn-p01c", "psn-p22"]) assert.ok(inti.includes(x), x);
  assert.equal(D.baris.find((b) => b.id === "psn-p22").proyek_meti.length, 11);
  assert.deepEqual(D.baris.find((b) => b.id === "psn-p01d").proyek_gem, ["gem_hydropower_L100000602132"]);
});

test("bangun() deterministik terhadap berkas masukan", () => {
  const b = bangun(D.dibangun_pada);
  assert.equal(JSON.stringify(b), JSON.stringify(D));
});

test("saring, hitungPer, linimasa, total", () => {
  assert.equal(saring(D.baris, {}).length, D.baris.length);
  assert.ok(saring(D.baris, { sektor: "energi" }).every((b) => b.sektor === "energi"));
  assert.ok(saring(D.baris, { prov: "64" }).every((b) => b.prov_kode.includes("64")));
  assert.ok(saring(D.baris, { q: "masela" }).length >= 1);
  assert.ok(saring(D.baris, { lengkap: true }).every((b) => b.lengkap === 1));
  const per = hitungPer(D.baris, (b) => b.sektor);
  assert.equal(per.reduce((a, x) => a + x.n, 0), D.baris.length);
  assert.ok(per[0].n >= per.at(-1).n);
  const l = barisLinimasa(D.baris);
  assert.ok(l.length >= 8 && l.every((r) => r.mulai <= r.selesai));
  assert.equal(tahunDari("2027-01"), 2027);
  assert.equal(tahunDari("x"), null);
  assert.ok(totalInvestasi(D.baris).usd > 40);
});
