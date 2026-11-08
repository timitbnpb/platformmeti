// /jaringan: penguraian tabel RUPTL (kasus hitung tangan), konsistensi jaringan_modul.json, keutuhan rujukan id ke berkas lain, dan hitungan murni.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { uraiTabel, periksaRencana } from "../scripts/panen/jaringan_modul.mjs";
import * as H from "../public/jaringan_hitung.js";

const baca = (f) => JSON.parse(readFileSync(new URL("../public/data/" + f, import.meta.url), "utf8"));
const M = baca("jaringan_modul.json");

test("uraiTabel: angka Indonesia (titik ribuan, koma desimal) dan sel kosong", () => {
  const baris = Array(20001).fill("");
  baris.push(
    "Tabel 5.199 Rekapitulasi Rencana Pembangunan Jaringan Kalimantan",
    "1       150       1.565   1.420   1.174,6   1.095,9   11   748   406   1.313   650   93,8   8.477,3",
    "3       500       0 0 0 0 0 0 1.387 0 0 0 1.387",
    "Total   1.565 1.420 1.174,6 1.095,9 11 748 1.793 1.313 650 93,8 9.864,3",
  );
  const x = uraiTabel(baris, "5.199");
  assert.equal(x.tegangan["150"].tahun[2], 1174.6);
  assert.equal(x.tegangan["150"].jumlah, 8477.3);
  assert.equal(x.tegangan["500"].tahun[6], 1387);
  assert.equal(x.total.jumlah, 9864.3);
});

test("uraiTabel: baris dengan satu sel tahun kosong dilengkapi dari baris total", () => {
  const baris = Array(20001).fill("");
  baris.push(
    "Tabel 5.209 Rekapitulasi Rencana Pembangunan Gardu Induk X",
    "1     150/20    150   30   330   90   70   110   60   30   180   -   1.050",
    "3     70/20     30    60   50    120  30        120  60   60   120   650",
    "Total  180  90  380  210  100  110  180  90  240  120  1.700",
  );
  const x = uraiTabel(baris, "5.209", "mva");
  assert.deepEqual(x.tegangan["70/20"].tahun, [30, 60, 50, 120, 30, 0, 120, 60, 60, 120]);
});

test("uraiTabel: tabel tak ada dilaporkan, bukan diam", () => assert.throws(() => uraiTabel(Array(20001).fill(""), "9.999"), /tak ditemukan/));

test("rencana RUPTL: konsisten (tahun, tegangan, wilayah ke nasional)", () => {
  assert.deepEqual(periksaRencana(M.rencana), []);
  const n = H.nasional(M);
  assert.equal(n.kms.total.jumlah, 47800);
  assert.equal(n.mva.total.jumlah, 107950);
  assert.equal(H.wilayahRencana(M).length, 5);
  assert.equal(M.rencana.sistem.find((s) => s.id === "mpnt").mva.tegangan["70/20"].jumlah, 650);
});

test("hitungan murni: puncak, kumulatif, pangsa, tumpuk", () => {
  assert.deepEqual(H.puncak([1, 5, 3], [2025, 2026, 2027]), { tahun: 2026, nilai: 5 });
  assert.deepEqual(H.kumulatif([1, 2, 3]), [1, 3, 6]);
  const p = H.pangsaWilayah(M, "kms");
  assert.ok(Math.abs(p.reduce((a, x) => a + x.persen, 0) - 100) < 0.1);
  assert.equal(p[0].id, "jawabali");
  const t = H.tumpukTegangan(H.nasional(M), "kms", M.rencana.tahun);
  assert.equal(t.kategori.length, 10);
  assert.ok(t.kunci.includes("500 DC"));
});

test("antar-pulau dan lintas negara: bentuk data, status dikenal, sumber ada", () => {
  const sid = new Set(M.sumber.map((s) => s.id)), st = Object.keys(H.KELAS_STATUS);
  for (const x of [...M.antar_pulau, ...M.lintas_negara.negara]) {
    assert.ok(st.includes(x.status), `${x.id}: status ${x.status}`);
    assert.ok(sid.has(x.sumber_id), `${x.id}: sumber ${x.sumber_id}`);
    assert.ok(x.nama.id && x.nama.en && x.ket.id && x.ket.en, `${x.id}: teks dua bahasa`);
    if (x.garis) for (const [lng, lat] of x.garis) assert.ok(lng > 90 && lng < 145 && lat > -12 && lat < 8, `${x.id}: koordinat`);
  }
  assert.equal(M.lintas_negara.negara.find((x) => x.id === "kalbar-sarawak").status, "beroperasi");
  assert.equal(H.fiturSkematik(M).features.length, M.antar_pulau.filter((x) => x.garis).length + M.lintas_negara.negara.length);
});

test("ekspor Singapura: lisensi + persetujuan = total; enam lisensi bersyarat menurut EMA", () => {
  const e = H.ringkasEkspor(M);
  assert.equal(e.n, 7);
  assert.ok(Math.abs(e.lisensi - 3) < 1e-9, "5 lisensi 2 GW + Singa 1 GW");
  assert.ok(Math.abs(e.persetujuan - 0.4) < 1e-9);
  assert.ok(Math.abs(e.total - 3.4) < 1e-9);
  assert.equal(M.lintas_negara.ekspor_singapura.proyek.filter((p) => p.izin === "conditional-licence").length, 6);
});

test("rujukan id: sistem, proyek, pendanaan, organisasi benar-benar ada di berkas asal", () => {
  const riset = baca("riset/jaringan.json"), ps = baca("riset/pumped_storage_offshore.json"), ke = baca("keandalan.json"), pi = baca("pendanaan_internasional.json"), org = baca("organisasi.json");
  const idPi = new Set(pi.baris.map((b) => b.id));
  for (const i of M.pendanaan.ids_iati) assert.ok(idPi.has(i), `IATI ${i}`);
  const idOrg = new Set(org.baris.map((o) => o.id));
  for (const i of [...M.pemain.pln, ...M.pemain.epc, ...M.pemain.kabel, ...M.pendanaan.donor_rujukan, ...Object.values(M.pendanaan.pemberi_org), ...M.lintas_negara.ekspor_singapura.proyek.flatMap((p) => p.org_id)]) assert.ok(idOrg.has(i), `org ${i}`);
  assert.ok(H.simpanPerSistem(riset).length > 0);
  assert.ok(H.pumpedStorage(ps).length >= 3);
  const rm = new Set(ke.sistem.map((s) => s.id));
  for (const b of riset.baris) assert.ok(rm.has(b.keandalan_id), `keandalan ${b.keandalan_id}`);
  const d = H.pendanaanJaringan(pi, M.pendanaan.ids_iati);
  assert.equal(d.baris.length, M.pendanaan.ids_iati.length);
  assert.ok(d.perPemberi.some((p) => p.pemberi === "Asian Development Bank"));
  for (const p of Object.keys(M.pendanaan.pemberi_org)) assert.ok(d.perPemberi.some((x) => x.pemberi === p), p);
  assert.equal(H.butuhPenyimpanan(ke).length, ke.sistem.length);
});

test("penyimpanan: PS RUPTL menjumlah ke total", () => {
  const p = M.penyimpanan.ps_ruptl_mw;
  assert.equal(Object.values(p.tahun).reduce((a, b) => a + b, 0), p.total);
});

test("tanpa em dash, tanpa data pribadi, sumber bertingkat bukti dikenal", () => {
  const teks = readFileSync(new URL("../public/data/jaringan_modul.json", import.meta.url), "utf8");
  assert.doesNotMatch(teks, /—/);
  for (const s of M.sumber) assert.ok(["resmi", "media"].includes(s.tingkat_bukti), s.id);
  assert.match(teks, /"tema": "jaringan_modul"/);
});

test("halaman /jaringan: berkas ada, tab sesuai modul, ikon baru ada di sprite", () => {
  const js = readFileSync(new URL("../public/jaringan.js", import.meta.url), "utf8");
  for (const m of js.matchAll(/mod: "\/([\w]+\.js)"/g)) assert.ok(existsSync(new URL("../public/" + m[1], import.meta.url)), m[1]);
  const svg = readFileSync(new URL("../public/img/ikon.svg", import.meta.url), "utf8");
  for (const i of ["menara", "baterai", "sambung"]) assert.ok(svg.includes(`id="i-${i}"`), i);
  const kepala = readFileSync(new URL("../public/inti/kepala.js", import.meta.url), "utf8");
  assert.match(kepala, /href: "\/jaringan"/);
});
