// roadmap.test.mjs (migrasi 0035): suka + komentar program peta jalan. Rute lewat worker.fetch utuh, D1 lokal NYATA, tanpa mock.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { buatEnv } from "./_bantu.mjs";
import worker from "../src/worker.js";
import { rute } from "../src/roadmap.js";
import * as hak from "../src/hak.js";
import { sha } from "../src/util.js";

const PERAN = ["anggota", "anggota2", "pengurus", "kurator", "wilayah", "admin", "super"];
let E, tutup;
const COOKIE = {}, ID = {};
const q = (s, ...b) => E.DB.prepare(s).bind(...b);
const satu = (s, ...b) => q(s, ...b).first();

before(async () => {
  ({ env: E, tutup } = await buatEnv());
  for (const [i, nama] of PERAN.entries()) {
    const peran = nama.replace("2", "");
    const r = await q("INSERT INTO akun (surel, nama, peran, cakupan_prov, status, garam, sandi, iterasi) VALUES (?,?,?,?, 'aktif', ?, ?, 100000)", `${nama}@example.org`, `Orang ${nama}`, peran, peran === "wilayah" ? "31" : null, "a".repeat(32), "a".repeat(64)).run();
    const token = (i + 16).toString(16).repeat(32);
    await hak.catatSesi(E, { idHash: await sha(token), akunId: r.meta.last_row_id, peran, sampai: Math.floor(Date.now() / 1000) + 3600, ipHash: "h" });
    COOKIE[nama] = `sesi=${token}`; ID[nama] = r.meta.last_row_id;
  }
});
after(async () => { await tutup?.(); });

async function panggil(metode, jalur, { peran = null, badan } = {}) {
  const h = { origin: "https://uji.test", "cf-connecting-ip": "203.0.113.7", "x-pb": "1" };
  if (peran) h.cookie = COOKIE[peran];
  let body;
  if (badan !== undefined) { body = JSON.stringify(badan); h["content-type"] = "application/json"; }
  return worker.fetch(new Request("https://uji.test" + jalur, { method: metode, headers: h, body }), E, { waitUntil() {} });
}
const kom = (peran, program, isi) => panggil("POST", "/api/roadmap/komentar", { peran, badan: { program, isi } });
const suka = (peran, program) => panggil("POST", "/api/roadmap/suka", { peran, badan: { program } });

test("penjaga: modul mengekspor 5 rute dan tamu DITOLAK 401 di tiap rute", async () => {
  const kunci = Object.keys(rute);
  assert.equal(kunci.length, 5, "jumlah rute roadmap");
  for (const k of kunci) {
    const [m, j] = k.split(" ");
    const res = await panggil(m, j.replace(":id", "1") + (m === "GET" ? "?program=P1" : ""), { badan: m === "GET" ? undefined : {} });
    assert.equal(res.status, 401, k);
  }
});

test("suka: toggle naik lalu turun, satu akun satu suka per program, akun lain menambah", async () => {
  let r = await suka("anggota", "P1");
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), { suka: true, jumlah: 1 });
  r = await suka("anggota2", "P1");
  assert.deepEqual(await r.json(), { suka: true, jumlah: 2 });
  assert.equal((await satu("SELECT count(*) AS n FROM roadmap_suka WHERE program='P1' AND akun_id=?", ID.anggota)).n, 1);
  const ring = await (await panggil("GET", "/api/roadmap/ringkas", { peran: "anggota" })).json();
  assert.equal(ring.suka.P1, 2); assert.deepEqual(ring.saya, ["P1"]);
  r = await suka("anggota", "P1");
  assert.deepEqual(await r.json(), { suka: false, jumlah: 1 });
  assert.equal((await satu("SELECT count(*) AS n FROM roadmap_suka WHERE program='P1' AND akun_id=?", ID.anggota)).n, 0);
  const j = await satu("SELECT count(*) AS n FROM jejak WHERE tabel='roadmap_suka' AND siapa=?", ID.anggota);
  assert.equal(j.n, 2, "jejak tambah + hapus");
  await suka("anggota2", "P1");
});

test("PK D1: suka ganda untuk (program, akun) DITOLAK", async () => {
  await q("INSERT INTO roadmap_suka (program, akun_id) VALUES ('B2', ?)", ID.anggota).run();
  await assert.rejects(q("INSERT INTO roadmap_suka (program, akun_id) VALUES ('B2', ?)", ID.anggota).run(), /UNIQUE|PRIMARY/i);
});

test("suka ditolak: program tidak sah 4xx, peran publik (tanpa hak konsultasi) ditolak", async () => {
  for (const p of ["", "X1", "p1", "P123", "P1; DROP", null]) {
    const s = (await suka("anggota", p)).status;
    assert.ok(s >= 400 && s < 500, `program ${p} -> ${s}`);
  }
  await assert.rejects(hak.roadmapSuka(E, { id: 1, peran: "publik" }, "P1"), (e) => e.status === 403 || /ditolak|hak|izin/i.test(e.message));
  await assert.rejects(hak.roadmapKomentarBaru(E, { id: 1, peran: "publik" }, "P1", "x"), (e) => e.status === 403 || /ditolak|hak|izin/i.test(e.message));
  await assert.rejects(hak.roadmapRingkas(E, { id: 1, peran: "publik" }), (e) => e.status === 403 || /ditolak|hak|izin/i.test(e.message));
});

test("komentar: anggota menulis, tampil di daftar, tanpa surel atau kontak", async () => {
  const r = await kom("anggota", "P1", "  Setuju, <b>penting</b> sekali.  ");
  assert.equal(r.status, 201);
  assert.ok((await r.json()).id > 0);
  const res = await panggil("GET", "/api/roadmap/komentar?program=P1", { peran: "anggota2" });
  assert.equal(res.status, 200);
  const teks = await res.text(), d = JSON.parse(teks);
  assert.equal(d.baris.length, 1);
  assert.equal(d.baris[0].isi, "Setuju, penting sekali.");
  assert.equal(d.baris[0].nama, "Orang anggota");
  assert.equal(d.baris[0].milik, false);
  assert.equal(d.staf, false);
  assert.ok(!/@|surel|kontak|telepon|sandi/i.test(teks), "daftar bocor surel/kontak: " + teks);
  assert.equal((await (await panggil("GET", "/api/roadmap/komentar?program=P1", { peran: "anggota" })).json()).baris[0].milik, true);
  assert.equal((await (await panggil("GET", "/api/roadmap/komentar?program=P1", { peran: "pengurus" })).json()).staf, true);
  const ring = await (await panggil("GET", "/api/roadmap/ringkas", { peran: "anggota" })).json();
  assert.equal(ring.komentar.P1, 1);
  assert.ok(!/@/.test(JSON.stringify(ring)));
});

test("komentar ditolak: isi kosong/spasi, 1001 karakter, program tidak sah; 1000 karakter diterima", async () => {
  for (const isi of ["", "   ", undefined]) {
    const s = (await kom("anggota", "P1", isi)).status;
    assert.ok(s >= 400 && s < 500, `isi ${JSON.stringify(isi)} -> ${s}`);
  }
  const s = (await kom("anggota", "P1", "x".repeat(1001))).status;
  assert.ok(s >= 400 && s < 500, "1001 karakter -> " + s);
  for (const p of ["", "Z9", undefined]) { const t = (await kom("anggota", p, "halo")).status; assert.ok(t >= 400 && t < 500, `program ${p} -> ${t}`); }
  assert.equal((await kom("anggota", "P1", "y".repeat(1000))).status, 201);
  assert.equal((await satu("SELECT count(*) AS n FROM roadmap_komentar WHERE program='P1'")).n, 2);
});

test("CHECK D1: isi kosong, >1000 karakter, program kosong/>80, status liar DITOLAK; batas sah diterima", async () => {
  const ins = (program, isi, status = "tayang") => q("INSERT INTO roadmap_komentar (program, akun_id, isi, status) VALUES (?,?,?,?)", program, ID.anggota, isi, status).run();
  await assert.rejects(ins("P1", ""), /CHECK/i);
  await assert.rejects(ins("P1", "x".repeat(1001)), /CHECK/i);
  await assert.rejects(ins("", "ok"), /CHECK/i);
  await assert.rejects(ins("p".repeat(81), "ok"), /CHECK/i);
  await assert.rejects(ins("P1", "ok", "hapus"), /CHECK/i);
  await ins("P1", "x".repeat(1000)); await ins("p".repeat(80), "a");
  await assert.rejects(q("INSERT INTO roadmap_suka (program, akun_id) VALUES ('', ?)", ID.anggota).run(), /CHECK/i);
  await assert.rejects(q("INSERT INTO roadmap_komentar (program, akun_id, isi) VALUES ('P1', 999999, 'a')").run(), /FOREIGN/i);
});

test("DELETE: pemilik boleh; orang lain ditolak/tidak_ditemukan; staf boleh; baris tetap, status disembunyikan, hilang dari daftar dan hitungan", async () => {
  const id1 = (await (await kom("anggota", "A1", "milik anggota")).json()).id;
  const id2 = (await (await kom("anggota", "A1", "milik anggota lagi")).json()).id;
  const del = (peran, id) => panggil("DELETE", `/api/roadmap/komentar/${id}`, { peran });
  const lihat = async () => (await (await panggil("GET", "/api/roadmap/komentar?program=A1", { peran: "anggota2" })).json()).baris.map((b) => b.id);
  assert.deepEqual((await lihat()).sort(), [id1, id2].sort());
  // bukan pemilik, bukan staf
  const r0 = await del("anggota2", id1);
  assert.ok([403, 404].includes(r0.status), "orang lain -> " + r0.status);
  assert.equal((await satu("SELECT status FROM roadmap_komentar WHERE id=?", id1)).status, "tayang");
  // tamu
  assert.equal((await panggil("DELETE", `/api/roadmap/komentar/${id1}`)).status, 401);
  // id tidak sah / tidak ada
  const rx = await del("anggota", 99999999); assert.ok([404, 422].includes(rx.status), "id tak ada -> " + rx.status);
  assert.equal((await del("anggota", "abc")).status >= 400, true);
  // pemilik
  assert.equal((await del("anggota", id1)).status, 200);
  assert.equal((await satu("SELECT status FROM roadmap_komentar WHERE id=?", id1)).status, "disembunyikan");
  assert.deepEqual(await lihat(), [id2]);
  assert.equal((await (await panggil("GET", "/api/roadmap/ringkas", { peran: "anggota" })).json()).komentar.A1, 1);
  // ulang pada yang sudah tersembunyi: tidak_ditemukan
  assert.equal((await del("anggota", id1)).status, 404);
  // staf konsultasi_putus
  assert.equal((await del("pengurus", id2)).status, 200);
  assert.equal((await satu("SELECT status FROM roadmap_komentar WHERE id=?", id2)).status, "disembunyikan");
  assert.equal((await satu("SELECT count(*) AS n FROM roadmap_komentar WHERE program='A1'")).n, 2, "baris tetap ada");
  assert.deepEqual(await lihat(), []);
  const ring = await (await panggil("GET", "/api/roadmap/ringkas", { peran: "anggota" })).json();
  assert.equal(ring.komentar.A1, undefined);
  assert.equal((await satu("SELECT count(*) AS n FROM jejak WHERE tabel='roadmap_komentar' AND aksi='ubah'")).n, 2);
});

test("staf tanpa konsultasi_putus (wilayah) tidak bisa menyembunyikan milik orang lain", async () => {
  const id = (await (await kom("anggota", "A2", "tetap tayang")).json()).id;
  const r = await panggil("DELETE", `/api/roadmap/komentar/${id}`, { peran: "wilayah" });
  assert.ok([403, 404].includes(r.status), "wilayah -> " + r.status);
  assert.equal((await satu("SELECT status FROM roadmap_komentar WHERE id=?", id)).status, "tayang");
});
