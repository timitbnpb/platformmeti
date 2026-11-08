// Indeks keyakinan bisnis EBT (0031): fungsi murni, matriks hak, alur D1 lokal nyata (jawab -> ubah -> agregat), satu jawaban per akun per periode, privasi n >= 5.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { buatEnv } from "./_bantu.mjs";
import worker from "../src/worker.js";
import * as hak from "../src/hak.js";
import { sha, acak } from "../src/util.js";

let E, tutup;
const sesi = {};
async function masuk(nama, peran = "anggota") {
  const r = await E.DB.prepare("INSERT INTO akun (surel, nama, peran, status, garam, sandi, iterasi) VALUES (?,?,?, 'aktif', ?, ?, 100000)").bind(`${nama}@uji.test`, nama, peran, "a".repeat(32), "a".repeat(64)).run();
  const token = acak(32);
  await E.DB.prepare("INSERT INTO sesi (id_hash, akun_id, sampai) VALUES (?,?,?)").bind(await sha(token), r.meta.last_row_id, Math.floor(Date.now() / 1000) + 3600).run();
  sesi[nama] = "sesi=" + token;
  return r.meta.last_row_id;
}
const minta = async (jalur, { metode = "GET", json, nama } = {}) => {
  const h = { origin: "https://uji.test", "cf-connecting-ip": "203.0.113.9" };
  if (nama) h.cookie = sesi[nama];
  if (metode !== "GET") h["x-pb"] = "1";
  if (json) h["content-type"] = "application/json";
  const r = await worker.fetch(new Request("https://uji.test" + jalur, { method: metode, headers: h, body: json ? JSON.stringify(json) : undefined }), E, { waitUntil() {} });
  return { status: r.status, j: (r.headers.get("content-type") || "").includes("json") ? await r.json().catch(() => ({})) : null };
};
const J = (v) => Object.fromEntries(hak.BUTIR_KEYAKINAN.map((k) => [k, v]));
before(async () => { ({ env: E, tutup } = await buatEnv()); for (const n of ["u1", "u2", "u3", "u4", "u5", "u6"]) await masuk(n); await masuk("adm", "admin"); });
after(async () => { await tutup?.(); });

test("periode murni: kuartal menurut WIB", () => {
  assert.equal(hak.periodeKeyakinan(Date.UTC(2026, 10, 8, 3)), "2026-Q4");
  assert.equal(hak.periodeKeyakinan(Date.UTC(2026, 0, 1, 0)), "2026-Q1");
  assert.equal(hak.periodeKeyakinan(Date.UTC(2026, 2, 31, 17, 0)), "2026-Q2", "31 Mar 17:00 UTC = 1 Apr 00:00 WIB");
  assert.equal(hak.periodeKeyakinan(Date.UTC(2026, 11, 31, 16, 59)), "2026-Q4");
});

test("indeks murni: rata 1-5 -> 0-100, 3 = 50, n < 5 disembunyikan", () => {
  const rata = (v) => Object.fromEntries(hak.BUTIR_KEYAKINAN.map((k) => [k, v]));
  const [a, b, c] = hak.indeksKeyakinan([{ periode: "2026-Q4", n: 5, rata: rata(3) }, { periode: "2026-Q3", n: 4, rata: rata(5) }, { periode: "2026-Q2", n: 9, rata: { ...rata(1), kondisi: 5 } }]);
  assert.equal(a.indeks, 50); assert.equal(a.butir.kondisi, 50); assert.equal(a.tersembunyi, false);
  assert.deepEqual(b, { periode: "2026-Q3", n: 4, tersembunyi: true });
  assert.equal(c.butir.kondisi, 100); assert.equal(c.butir.harga, 0); assert.equal(c.indeks, 12.5);
});

test("jawaban murni: delapan butir bulat 1-5, tanpa kunci lain", () => {
  assert.deepEqual(hak.periksaJawabanKeyakinan(J(3)), J(3));
  const salah = [null, [], "x", {}, { ...J(3), ekstra: 1 }, { ...J(3), kondisi: 0 }, { ...J(3), kondisi: 6 }, { ...J(3), harga: 2.5 }, { ...J(3), tenaga: "3" }, (({ tenaga, ...s }) => s)(J(3))];
  for (const d of salah) assert.throws(() => hak.periksaJawabanKeyakinan(d), (e) => e.status === 422, JSON.stringify(d));
});

test("hak: sel keyakinan per peran", () => {
  const sel = (p) => ["baca", "tambah", "ubah", "hapus"].filter((a) => hak.boleh(p, a, "keyakinan", undefined, { peran: p, status: "aktif" }).ok);
  assert.deepEqual(sel("publik"), []);
  for (const p of ["anggota", "pengurus", "kurator", "wilayah", "admin", "super"]) assert.deepEqual(sel(p), ["baca", "tambah", "ubah"], p);
});

test("tamu 401 di baca dan tulis", async () => {
  assert.equal((await minta("/api/keyakinan")).status, 401);
  assert.equal((await minta("/api/keyakinan", { metode: "POST", json: J(3) })).status, 401);
});

test("masukan salah ditolak 422 tanpa menulis", async () => {
  for (const d of [{ ...J(3), kondisi: 9 }, { ...J(3), x: 1 }, {}]) assert.equal((await minta("/api/keyakinan", { metode: "POST", json: d, nama: "u1" })).status, 422);
  assert.equal((await E.DB.prepare("SELECT count(*) n FROM keyakinan_jawab").first()).n, 0);
});

test("alur: jawab, ubah (tetap satu baris), agregat tersembunyi sampai n >= 5, lalu terbuka", async () => {
  const P = hak.periodeKeyakinan();
  assert.equal((await minta("/api/keyakinan", { nama: "u1" })).j.jawaban, null);
  assert.equal((await minta("/api/keyakinan", { metode: "POST", json: J(2), nama: "u1" })).status, 200);
  assert.equal((await minta("/api/keyakinan", { metode: "POST", json: J(4), nama: "u1" })).status, 200, "mengubah jawaban sendiri");
  assert.equal((await E.DB.prepare("SELECT count(*) n FROM keyakinan_jawab WHERE akun_id = (SELECT id FROM akun WHERE nama='u1')").first()).n, 1, "satu jawaban per akun per periode");
  let r = (await minta("/api/keyakinan", { nama: "u1" })).j;
  assert.equal(r.periode, P); assert.equal(r.jawaban.kondisi, 4); assert.equal(r.n_min, 5);
  assert.deepEqual(r.agregat[0], { periode: P, n: 1, tersembunyi: true }, "n=1: nilai tidak keluar");
  assert.doesNotMatch(JSON.stringify(r.agregat), /butir|indeks/);
  for (const n of ["u2", "u3", "u4"]) await minta("/api/keyakinan", { metode: "POST", json: J(4), nama: n });
  r = (await minta("/api/keyakinan", { nama: "u2" })).j;
  assert.equal(r.agregat[0].tersembunyi, true, "n=4 masih tersembunyi");
  await minta("/api/keyakinan", { metode: "POST", json: { ...J(4), kondisi: 5 }, nama: "u5" });
  r = (await minta("/api/keyakinan", { nama: "adm" })).j;
  const a = r.agregat[0];
  assert.equal(a.n, 5); assert.equal(a.tersembunyi, false);
  assert.equal(a.butir.kondisi, 80); // rata (4+4+4+4+5)/5 = 4,2 -> (4,2-1)*25
  assert.equal(a.butir.harga, 75); assert.equal(a.indeks, 75.6);
  assert.equal(r.jawaban, null, "admin belum menjawab");
});

test("agregat tak membocorkan jawaban per akun", async () => {
  const r = (await minta("/api/keyakinan", { nama: "u6" })).j;
  assert.doesNotMatch(JSON.stringify(r), /u1|akun_id|surel|nama/);
});

test("periode lalu tidak tersentuh oleh jawab baru", async () => {
  const id = (await E.DB.prepare("SELECT id FROM akun WHERE nama='u6'").first()).id;
  await E.DB.prepare("INSERT INTO keyakinan_jawab (akun_id, periode, k_kondisi,k_pipeline,k_pembiayaan,k_perizinan,k_harga,k_regulasi,k_investasi,k_tenaga) VALUES (?, '2020-Q1', 1,1,1,1,1,1,1,1)").bind(id).run();
  await minta("/api/keyakinan", { metode: "POST", json: J(5), nama: "u6" });
  const lama = await E.DB.prepare("SELECT k_kondisi FROM keyakinan_jawab WHERE akun_id = ? AND periode = '2020-Q1'").bind(id).first();
  assert.equal(lama.k_kondisi, 1);
  assert.equal((await E.DB.prepare("SELECT count(*) n FROM keyakinan_jawab WHERE akun_id = ?").bind(id).first()).n, 2);
});

test("jejak mencatat periode, bukan nilai jawaban", async () => {
  const j = (await E.DB.prepare("SELECT aksi, tabel, baris_id, ke FROM jejak WHERE tabel = 'keyakinan_jawab' ORDER BY id DESC LIMIT 1").first());
  assert.equal(j.aksi, "kirim"); assert.equal(j.baris_id, hak.periodeKeyakinan());
  assert.doesNotMatch(j.ke, /kondisi|"[1-5]"/);
});

test("kendala D1: skala 1-5, format periode, satu baris per (akun, periode), kaskade hapus akun", async () => {
  const id = (await E.DB.prepare("SELECT id FROM akun WHERE nama='adm'").first()).id;
  const sisip = (periode, v) => E.DB.prepare("INSERT INTO keyakinan_jawab (akun_id, periode, k_kondisi,k_pipeline,k_pembiayaan,k_perizinan,k_harga,k_regulasi,k_investasi,k_tenaga) VALUES (?,?,?,3,3,3,3,3,3,3)").bind(id, periode, v).run();
  await assert.rejects(sisip("2026-Q4", 0)); await assert.rejects(sisip("2026-Q4", 6));
  await assert.rejects(sisip("2026-Q5", 3)); await assert.rejects(sisip("2026Q4", 3)); await assert.rejects(sisip("abcd-Q1", 3));
  await sisip("2026-Q4", 3);
  await assert.rejects(sisip("2026-Q4", 4), "duplikat (akun, periode)");
  await E.DB.exec("PRAGMA foreign_keys = ON");
  await E.DB.prepare("DELETE FROM akun WHERE id = ?").bind(id).run();
  assert.equal((await E.DB.prepare("SELECT count(*) n FROM keyakinan_jawab WHERE akun_id = ?").bind(id).first()).n, 0);
});
