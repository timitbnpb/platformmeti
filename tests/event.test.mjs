// event.test.mjs: RSVP acara lewat worker.fetch utuh, D1 lokal NYATA (trigger kuota/terbuka, jejak, hak). Hanya ASSETS (kalender.json kecil) yang ditiru.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { buatEnv } from "./_bantu.mjs";
import worker from "../src/worker.js";
import { rute, selCsv, kontakTampil } from "../src/event.js";
import * as hak from "../src/hak.js";
import { sha } from "../src/util.js";

const DEPAN = new Date(Date.now() + 40 * 864e5).toISOString().slice(0, 10);
const LALU = "2020-01-01";
const KALENDER = { baris: [
  { id: "ac_1", slug: "acara-depan", judul: "Acara depan", jenis: "seminar", tanggal: DEPAN },
  { id: "ac_2", slug: "acara-lalu", judul: "Acara lalu", jenis: "seminar", tanggal: LALU },
  { id: "reg_1", slug: "peraturan-1", judul: "Regulasi", jenis: "regulasi", tanggal: DEPAN },
] };
const PERAN = ["anggota", "pengurus", "kurator", "wilayah", "admin", "super"];
let E, tutup;
const COOKIE = {}, AKUN = {};
const q = (s, ...b) => E.DB.prepare(s).bind(...b);
const satu = (s, ...b) => q(s, ...b).first();
const cacah = async (t, w = "") => (await satu(`SELECT count(*) AS n FROM ${t} ${w}`)).n;

async function tambahAkun(kunci, peran) {
  const r = await q("INSERT INTO akun (surel, nama, peran, cakupan_prov, status, garam, sandi, iterasi) VALUES (?,?,?,?, 'aktif', ?, ?, 100000)",
    `${kunci}@uji.test`, kunci, peran, peran === "wilayah" ? "31" : null, "a".repeat(32), "a".repeat(64)).run();
  const token = (Object.keys(COOKIE).length + 20).toString(16).repeat(32);
  await hak.catatSesi(E, { idHash: await sha(token), akunId: r.meta.last_row_id, sampai: Math.floor(Date.now() / 1000) + 3600, ipHash: "h" });
  COOKIE[kunci] = `sesi=${token}`; AKUN[kunci] = r.meta.last_row_id;
}
before(async () => {
  ({ env: E, tutup } = await buatEnv());
  E.ASSETS = { fetch: async (req) => (new URL(req.url).pathname === "/data/kalender.json" ? new Response(JSON.stringify(KALENDER)) : new Response("x")) };
  for (const p of PERAN) await tambahAkun(p, p);
  await tambahAkun("anggota2", "anggota"); await tambahAkun("anggota3", "anggota");
});
after(async () => { await tutup?.(); });

async function panggil(metode, jalur, { peran = null, badan } = {}) {
  const h = { origin: "https://uji.test", "cf-connecting-ip": "203.0.113.7" };
  if (peran) h.cookie = COOKIE[peran];
  if (metode !== "GET") h["x-pb"] = "1";
  let body;
  if (badan !== undefined) { body = JSON.stringify(badan); h["content-type"] = "application/json"; }
  return worker.fetch(new Request("https://uji.test" + jalur, { method: metode, headers: h, body }), E, { waitUntil() {} });
}
const atur = (peran, id, b) => panggil("PUT", `/api/event/${id}/atur`, { peran, badan: { terbuka: true, ...b } });

test("modul mengekspor 6 rute event", () => assert.equal(Object.keys(rute).length, 6));

test("tamu 401 di semua rute event", async () => {
  for (const [m, j, b] of [["GET", "/api/event"], ["POST", "/api/event/acara-depan/daftar", {}], ["DELETE", "/api/event/acara-depan/daftar"],
    ["PUT", "/api/event/acara-depan/atur", {}], ["GET", "/api/event/acara-depan/peserta"], ["GET", "/api/event/acara-depan/peserta.csv"]]) {
    assert.equal((await panggil(m, j, { badan: b })).status, 401, `${m} ${j}`);
  }
});

test("daftar ditolak 409 selama pengaturan belum ada atau tertutup; acara tak dikenal 404; regulasi bukan acara", async () => {
  const r = await panggil("POST", "/api/event/acara-depan/daftar", { peran: "anggota", badan: { jumlah: 1 } });
  assert.equal(r.status, 409); assert.equal((await r.json()).kode, "pendaftaran_tutup");
  assert.equal((await panggil("POST", "/api/event/tidak-ada/daftar", { peran: "anggota", badan: {} })).status, 404);
  assert.equal((await panggil("POST", "/api/event/peraturan-1/daftar", { peran: "anggota", badan: {} })).status, 404);
});

test("non-admin tidak boleh mengatur (403); admin mengatur dan masuk jejak", async () => {
  for (const p of ["anggota", "pengurus", "kurator", "wilayah"]) assert.equal((await atur(p, "acara-depan", { kuota: 5 })).status, 403, p);
  const j0 = await cacah("jejak");
  const r = await atur("admin", "acara-depan", { kuota: 5, batas: DEPAN });
  assert.equal(r.status, 201);
  assert.equal(await cacah("jejak"), j0 + 1);
  const j = await satu("SELECT aksi, tabel, peran FROM jejak ORDER BY id DESC LIMIT 1");
  assert.deepEqual([j.aksi, j.tabel, j.peran], ["tambah", "event_atur", "admin"]);
  assert.equal((await atur("super", "acara-depan", { kuota: 5, batas: DEPAN })).status, 200, "atur ulang = ubah");
  for (const salah of [{ kuota: 0 }, { kuota: 1.5 }, { batas: "2026-13-45" }, { kontak_surel: "bukan surel" }, { kontak_wa: "abc" }]) {
    assert.equal((await atur("admin", "acara-depan", salah)).status, 422, JSON.stringify(salah));
  }
});

test("akun mendaftar: tersimpan, terhitung, bisa disunting, dan GET /api/event menampilkannya", async () => {
  const r = await panggil("POST", "/api/event/acara-depan/daftar", { peran: "anggota", badan: { jumlah: 2, instansi: "PT Uji", telepon: "0812 3456 789", catatan: "vegetarian" } });
  assert.equal(r.status, 201);
  const d = await satu("SELECT * FROM event_daftar WHERE akun_id = ?", AKUN.anggota);
  assert.deepEqual([d.jumlah, d.instansi, d.status, d.event_id], [2, "PT Uji", "terdaftar", "acara-depan"]);
  const sunting = await panggil("POST", "/api/event/acara-depan/daftar", { peran: "anggota", badan: { jumlah: 3 } });
  assert.equal(sunting.status, 200);
  const g = await (await panggil("GET", "/api/event", { peran: "anggota2" })).json();
  assert.equal(g.terdaftar["acara-depan"], 3);
  assert.equal(g.saya.length, 0, "anggota lain tidak melihat pendaftaran orang lain");
  assert.equal(g.atur["acara-depan"].kuota, 5);
  const sendiri = await (await panggil("GET", "/api/event", { peran: "anggota" })).json();
  assert.equal(sendiri.saya[0].jumlah, 3); assert.equal(sendiri.akun.nama, "anggota");
  assert.ok(!JSON.stringify(g).includes("anggota@uji.test"), "surel orang lain tidak bocor");
  const jej = await satu("SELECT ke FROM jejak WHERE tabel = 'event_daftar' ORDER BY id DESC LIMIT 1");
  assert.ok(!jej.ke.includes("vegetarian") && !jej.ke.includes("0812"), "jejak tanpa catatan/telepon");
});

test("kuota penuh 409; kuota sisa tepat boleh; trigger menjaga walau rute dilewati", async () => {
  const r = await panggil("POST", "/api/event/acara-depan/daftar", { peran: "anggota2", badan: { jumlah: 3 } });
  assert.equal(r.status, 409); assert.equal((await r.json()).kode, "kuota_penuh");
  assert.equal((await panggil("POST", "/api/event/acara-depan/daftar", { peran: "anggota2", badan: { jumlah: 2 } })).status, 201);
  assert.equal((await panggil("POST", "/api/event/acara-depan/daftar", { peran: "anggota3", badan: { jumlah: 1 } })).status, 409, "kuota 5 terpakai habis");
  await assert.rejects(q("INSERT INTO event_daftar (event_id, akun_id, jumlah) VALUES ('acara-depan', ?, 1)", AKUN.anggota3).run(), /kuota/);
  assert.equal(await cacah("event_daftar", "WHERE event_id = 'acara-depan' AND status = 'terdaftar'"), 2);
});

test("batal melepas kuota, bisa daftar lagi, dan tidak boleh mengubah kuota di bawah terdaftar", async () => {
  assert.equal((await panggil("DELETE", "/api/event/acara-depan/daftar", { peran: "anggota" })).status, 200);
  assert.equal((await satu("SELECT status FROM event_daftar WHERE akun_id = ?", AKUN.anggota)).status, "batal");
  assert.equal((await panggil("DELETE", "/api/event/acara-depan/daftar", { peran: "anggota" })).status, 200, "batal berulang tidak galat");
  assert.equal((await panggil("DELETE", "/api/event/acara-depan/daftar", { peran: "anggota3" })).status, 404);
  assert.equal((await panggil("POST", "/api/event/acara-depan/daftar", { peran: "anggota3", badan: { jumlah: 3 } })).status, 201, "kuota terlepas");
  assert.equal((await atur("admin", "acara-depan", { kuota: 4 })).status, 422, "kuota di bawah terdaftar (5)");
  assert.equal((await panggil("POST", "/api/event/acara-depan/daftar", { peran: "anggota", badan: { jumlah: 1 } })).status, 409, "penuh lagi");
  assert.equal((await panggil("DELETE", "/api/event/acara-depan/daftar", { peran: "anggota3" })).status, 200);
  assert.equal((await panggil("POST", "/api/event/acara-depan/daftar", { peran: "anggota", badan: { jumlah: 1 } })).status, 200, "aktif lagi setelah batal");
});

test("pendaftaran tertutup, lewat batas, atau acara lalu ditolak", async () => {
  await atur("admin", "acara-depan", { terbuka: false, kuota: 5 });
  assert.equal((await panggil("POST", "/api/event/acara-depan/daftar", { peran: "anggota3", badan: {} })).status, 409);
  await atur("admin", "acara-depan", { kuota: 5, batas: "2020-01-01" });
  assert.equal((await panggil("POST", "/api/event/acara-depan/daftar", { peran: "anggota3", badan: {} })).status, 409, "lewat batas");
  await atur("admin", "acara-lalu", { kuota: 5 });
  const r = await panggil("POST", "/api/event/acara-lalu/daftar", { peran: "anggota3", badan: {} });
  assert.equal(r.status, 409); assert.equal((await r.json()).kode, "pendaftaran_tutup");
});

test("masukan tak sah 422", async () => {
  for (const b of [{ jumlah: 0 }, { jumlah: 21 }, { jumlah: "2" }, { telepon: "abc" }, { catatan: "x".repeat(501) }, { instansi: "x".repeat(121) }]) {
    assert.equal((await panggil("POST", "/api/event/acara-depan/daftar", { peran: "anggota3", badan: b })).status, 422, JSON.stringify(b));
  }
});

test("peserta + CSV hanya admin/super; CSV aman rumus dan unduhan tercatat di jejak", async () => {
  await q("UPDATE akun SET nama = ? WHERE id = ?", "=HYPERLINK(\"x\")", AKUN.anggota2).run();
  for (const p of ["anggota", "pengurus", "kurator", "wilayah"]) {
    assert.equal((await panggil("GET", "/api/event/acara-depan/peserta", { peran: p })).status, 403, p);
    assert.equal((await panggil("GET", "/api/event/acara-depan/peserta.csv", { peran: p })).status, 403, p);
  }
  const js = await (await panggil("GET", "/api/event/acara-depan/peserta", { peran: "admin" })).json();
  assert.ok(js.peserta.length >= 2 && js.peserta[0].surel);
  const j0 = await cacah("jejak");
  const csv = await panggil("GET", "/api/event/acara-depan/peserta.csv", { peran: "super" });
  assert.equal(csv.status, 200);
  assert.match(csv.headers.get("content-type"), /text\/csv/);
  assert.match(csv.headers.get("content-disposition"), /attachment/);
  const buf = new Uint8Array(await csv.arrayBuffer());
  assert.deepEqual([...buf.slice(0, 3)], [0xef, 0xbb, 0xbf], "BOM UTF-8");
  const t = new TextDecoder().decode(buf);
  assert.ok(t.startsWith("id,nama,surel"));
  assert.ok(t.includes("'=HYPERLINK") && !/,=HYPERLINK/.test(t), "sel rumus diberi apostrof");
  assert.equal(await cacah("jejak"), j0 + 1);
  assert.equal((await satu("SELECT aksi, tabel FROM jejak ORDER BY id DESC LIMIT 1")).tabel, "event_daftar");
});

test("kontak: bawaan sekretariat; kontak pribadi hanya bila disetujui admin", async () => {
  assert.equal(kontakTampil(null).nama, "Sekretariat METI");
  const pribadi = { kontak_nama: "Budi", kontak_wa: "0812", kontak_surel: "b@x.id" };
  assert.equal(kontakTampil({ ...pribadi, kontak_setuju: 0 }).nama, "Sekretariat METI");
  assert.equal(kontakTampil({ ...pribadi, kontak_setuju: 1 }).nama, "Budi");
  await atur("admin", "acara-depan", { kuota: 5, kontak_nama: "Budi", kontak_surel: "b@x.id", kontak_setuju: false });
  assert.equal((await (await panggil("GET", "/api/event", { peran: "anggota" })).json()).atur["acara-depan"].kontak.nama, "Sekretariat METI");
  await atur("admin", "acara-depan", { kuota: 5, kontak_nama: "Budi", kontak_surel: "b@x.id", kontak_setuju: true });
  assert.equal((await (await panggil("GET", "/api/event", { peran: "anggota" })).json()).atur["acara-depan"].kontak.nama, "Budi");
});

test("selCsv: kutip, koma, awalan rumus", () => {
  assert.equal(selCsv('a"b'), '"a""b"'); assert.equal(selCsv("a,b"), '"a,b"'); assert.equal(selCsv("+1"), "'+1"); assert.equal(selCsv(null), ""); assert.equal(selCsv(5), "5");
});

test("migrasi: seed golf METI dari API publik (kuota 216, batas 17 Nov 2026, kontak sekretariat)", async () => {
  const a = await satu("SELECT terbuka, kuota, batas, kontak_nama, kontak_setuju FROM event_atur WHERE event_id = 'meti-challenge-trophy-golf-2026'");
  assert.deepEqual([a.terbuka, a.kuota, a.batas, a.kontak_nama], [1, 216, "2026-11-17", "Sekretariat METI"]);
});
