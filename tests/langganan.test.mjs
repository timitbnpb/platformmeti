// Newsletter 0014: tamu boleh daftar/berhenti dan membuka /langganan; halaman lain tetap 302; D1 lokal nyata.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { buatEnv, minta } from "./_bantu.mjs";
import worker from "../src/worker.js";
import { sha, acak } from "../src/util.js";
import { csvLangganan } from "../src/langganan.js";

let E, tutup;
const sesi = {};
async function masuk(peran, surel = `${peran}@uji.test`) {
  const r = await E.DB.prepare("INSERT INTO akun (surel, nama, peran, status, garam, sandi, iterasi) VALUES (?,?,?, 'aktif', ?, ?, 100000)").bind(surel, "Nama " + peran, peran, "a".repeat(32), "a".repeat(64)).run();
  const token = acak(32);
  await E.DB.prepare("INSERT INTO sesi (id_hash, akun_id, sampai) VALUES (?,?,?)").bind(await sha(token), r.meta.last_row_id, Math.floor(Date.now() / 1000) + 3600).run();
  sesi[peran] = "sesi=" + token;
}
const res = (jalur, metode, peran, badan, opsi = {}) => worker.fetch(minta(jalur, { metode, badan, cookie: peran ? sesi[peran] : undefined, ...opsi }), E, { waitUntil() {} });
const panggil = async (...a) => {
  const r = await res(...a), t = await r.text();
  let j = {}; try { j = t ? JSON.parse(t) : {}; } catch { /* bukan json */ }
  return { status: r.status, ...j, teks: t };
};
const B = { depan: "Budi", belakang: "Santoso", surel: "Budi@Contoh.ID", instansi: "PT Contoh", minat: ["kebijakan", "proyek"], setuju: true };
const baris = async (surel) => (await E.DB.prepare("SELECT * FROM langganan WHERE surel = ?").bind(surel).first());

before(async () => {
  ({ env: E, tutup } = await buatEnv());
  for (const p of ["anggota", "pengurus", "admin"]) await masuk(p);
});
after(async () => { await tutup?.(); });

test("tamu boleh membuka /langganan, asetnya, dan /berhenti; halaman lain tetap 302 ke masuk", async () => {
  for (const j of ["/langganan", "/langganan.js", "/langganan.css", "/berhenti?t=" + "a".repeat(64), "/i18n.js"]) {
    const r = await res(j, "GET", null);
    assert.equal(r.status, 200, j);
  }
  for (const j of ["/", "/direktori", "/proyek", "/berita", "/admin", "/tentang"]) {
    const r = await res(j, "GET", null);
    assert.equal(r.status, 302, j);
    assert.match(r.headers.get("location"), /^\/masuk\?ke=/);
  }
});

test("tamu boleh POST /api/langganan: 201, surel dinormalisasi, tanpa IP, tanpa surel di respons", async () => {
  const r = await panggil("/api/langganan", "POST", null, B, { ip: "198.51.100.10" });
  assert.equal(r.status, 201);
  assert.deepEqual(JSON.parse(r.teks), { ok: true });
  assert.ok(!/contoh\.id/i.test(r.teks));
  const b = await baris("budi@contoh.id");
  assert.equal(b.nama, "Budi Santoso"); assert.equal(b.status, "aktif"); assert.equal(b.akun_id, null);
  assert.deepEqual(JSON.parse(b.minat), ["kebijakan", "proyek"]); assert.equal(b.token_berhenti.length, 64); assert.ok(b.setuju_pada > 0);
  const kolom = (await E.DB.prepare("PRAGMA table_info(langganan)").all()).results.map((c) => c.name);
  assert.ok(!kolom.some((c) => /^ip|agent/.test(c)));
  const j = await E.DB.prepare("SELECT peran, aksi, ke FROM jejak WHERE tabel = 'langganan' AND baris_id = ?").bind(String(b.id)).first();
  assert.equal(j.aksi, "gabung"); assert.equal(j.peran, "publik"); assert.ok(!/contoh/i.test(j.ke));
});

test("surel sudah terdaftar: respons identik (tidak membocorkan), data lama tidak ditimpa", async () => {
  const a = await panggil("/api/langganan", "POST", null, { ...B, depan: "Orang Lain", minat: [] }, { ip: "198.51.100.11" });
  assert.equal(a.status, 201); assert.equal(a.teks, JSON.stringify({ ok: true }));
  assert.equal((await baris("budi@contoh.id")).nama, "Budi Santoso");
  assert.equal((await E.DB.prepare("SELECT COUNT(*) n FROM langganan").first()).n, 1);
});

test("validasi: surel, persetujuan wajib, minat, nama, instansi, karakter kontrol, badan bukan JSON", async () => {
  let n = 0; // laju menghitung semua percobaan, jadi tiap permintaan dari koneksi berbeda
  const ip = { get ip() { return "198.51.101." + ++n; } };
  for (const salah of [{ ...B, surel: "bukan-surel" }, { ...B, surel: "" }, { ...B, setuju: false }, { ...B, setuju: "true" }, { ...B, setuju: undefined },
    { ...B, minat: ["gosip"] }, { ...B, minat: "proyek" }, { ...B, depan: "" }, { ...B, depan: "x".repeat(61) }, { ...B, instansi: "x".repeat(161) }, { ...B, depan: "A\u0000B" }, { ...B, surel: "a b@x.id" }])
    assert.equal((await panggil("/api/langganan", "POST", null, salah, { ip: ip.ip })).status, 422, JSON.stringify(salah).slice(0, 80));
  assert.equal((await panggil("/api/langganan", "POST", null, "bukan json", { ip: ip.ip })).status, 422);
  assert.equal((await panggil("/api/langganan", "POST", null, { ...B, surel: "ok@x.id", belakang: "", instansi: "", minat: [] }, { ip: ip.ip })).status, 201);
});

test("CSRF: POST tanpa x-pb atau lintas asal ditolak", async () => {
  assert.equal((await panggil("/api/langganan", "POST", null, B, { header: { "x-pb": "0" } })).status, 403);
  assert.equal((await panggil("/api/langganan", "POST", null, B, { origin: "https://jahat.test" })).status, 403);
});

test("honeypot terisi: sukses palsu, tidak ada yang disimpan", async () => {
  const r = await panggil("/api/langganan", "POST", null, { ...B, surel: "bot@spam.id", situs_web: "http://spam" }, { ip: "198.51.100.13" });
  assert.equal(r.status, 201); assert.equal(r.teks, JSON.stringify({ ok: true }));
  assert.equal(await baris("bot@spam.id"), null);
});

test("batas laju per koneksi: lewat 6 per jam = 429; koneksi lain tidak terdampak", async () => {
  const ip = { ip: "198.51.100.20" };
  for (let i = 0; i < 6; i++) assert.equal((await panggil("/api/langganan", "POST", null, { ...B, surel: `l${i}@x.id` }, ip)).status, 201);
  assert.equal((await panggil("/api/langganan", "POST", null, { ...B, surel: "l7@x.id" }, ip)).status, 429);
  assert.equal(await baris("l7@x.id"), null);
  assert.equal((await panggil("/api/langganan", "POST", null, { ...B, surel: "l8@x.id" }, { ip: "198.51.100.21" })).status, 201);
});

test("akun masuk: surel dari akun (bukan dari badan), akun_id terisi, status saya", async () => {
  assert.deepEqual((await panggil("/api/langganan/saya", "GET", null)).status, 401);
  assert.equal((await panggil("/api/langganan/saya", "GET", "anggota")).terdaftar, false);
  const r = await panggil("/api/langganan", "POST", "anggota", { minat: ["acara"], setuju: true, surel: "palsu@x.id" }, { ip: "198.51.100.30" });
  assert.equal(r.status, 201);
  assert.equal(await baris("palsu@x.id"), null);
  const b = await baris("anggota@uji.test");
  assert.equal(b.nama, "Nama anggota"); assert.ok(b.akun_id > 0);
  const s = await panggil("/api/langganan/saya", "GET", "anggota");
  assert.equal(s.aktif, true); assert.deepEqual(s.minat, ["acara"]);
  assert.equal((await panggil("/api/langganan", "POST", "anggota", { setuju: false }, { ip: "198.51.100.30" })).status, 422);
});

test("berhenti: token salah 422/404, token benar 200 idempoten, GET /berhenti tidak berhenti sendiri, jejak tercatat", async () => {
  const b = await baris("budi@contoh.id");
  const ip = { ip: "198.51.100.40" };
  assert.equal((await panggil("/api/langganan/berhenti", "POST", null, { token: "xyz" }, ip)).status, 422);
  assert.equal((await panggil("/api/langganan/berhenti", "POST", null, {}, ip)).status, 422);
  assert.equal((await panggil("/api/langganan/berhenti", "POST", null, { token: "0".repeat(64) }, ip)).status, 404);
  await res("/berhenti?t=" + b.token_berhenti, "GET", null);
  assert.equal((await baris("budi@contoh.id")).status, "aktif");
  const r = await panggil("/api/langganan/berhenti", "POST", null, { token: b.token_berhenti }, ip);
  assert.equal(r.status, 200); assert.equal(r.teks, JSON.stringify({ ok: true }));
  assert.equal((await baris("budi@contoh.id")).status, "berhenti");
  assert.equal((await panggil("/api/langganan/berhenti", "POST", null, { token: b.token_berhenti }, ip)).status, 200);
  const j = (await E.DB.prepare("SELECT aksi FROM jejak WHERE tabel = 'langganan' AND baris_id = ? ORDER BY id").bind(String(b.id)).all()).results.map((x) => x.aksi);
  assert.deepEqual(j, ["gabung", "cabut"]);
});

test("daftar ulang setelah berhenti mengaktifkan lagi dengan token baru; akun masuk berhenti lewat akun", async () => {
  const lama = (await baris("budi@contoh.id")).token_berhenti;
  assert.equal((await panggil("/api/langganan", "POST", null, B, { ip: "198.51.100.50" })).status, 201);
  const b = await baris("budi@contoh.id");
  assert.equal(b.status, "aktif"); assert.notEqual(b.token_berhenti, lama);
  assert.equal((await panggil("/api/langganan/berhenti", "POST", "anggota", {}, { ip: "198.51.100.51" })).status, 200);
  assert.equal((await baris("anggota@uji.test")).status, "berhenti");
  assert.equal((await panggil("/api/langganan/saya", "GET", "anggota")).aktif, false);
});

test("admin: tamu 401, non-admin 403, admin lihat daftar + per minat; CSV aman dan tercatat di jejak", async () => {
  for (const [j] of [["/api/admin/langganan"], ["/api/admin/langganan?format=csv"]]) {
    assert.equal((await panggil(j, "GET", null)).status, 401);
    for (const p of ["anggota", "pengurus"]) assert.equal((await panggil(j, "GET", p)).status, 403, p);
  }
  const l = await panggil("/api/admin/langganan", "GET", "admin");
  assert.equal(l.status, 200); assert.ok(l.total >= 8); assert.equal(l.aktif + l.berhenti, l.total);
  assert.ok(l.per_minat.kebijakan >= 1); assert.deepEqual(Object.keys(l.per_minat), ["kebijakan", "proyek", "acara", "kajian", "lowongan"]);
  assert.ok(Array.isArray(l.baris[0].minat)); assert.ok(!("token_berhenti" in l.baris[0]));
  assert.equal((await panggil("/api/admin/langganan?status=x", "GET", "admin")).status, 422);
  const sebelum = (await E.DB.prepare("SELECT COUNT(*) n FROM jejak WHERE baris_id = 'csv'").first()).n;
  const c = await res("/api/admin/langganan?format=csv", "GET", "admin");
  assert.equal(c.status, 200); assert.match(c.headers.get("content-type"), /text\/csv/); assert.match(c.headers.get("content-disposition"), /attachment/);
  const t = await c.text();
  assert.ok(t.includes("budi@contoh.id") && !t.includes("token"));
  assert.equal((await E.DB.prepare("SELECT COUNT(*) n FROM jejak WHERE baris_id = 'csv'").first()).n, sebelum + 1);
});

test("csvLangganan menetralkan rumus spreadsheet dan kutip ganda", () => {
  const t = csvLangganan([{ surel: "a@x.id", nama: '=HYPERLINK("x")', instansi: "+cmd", minat: ["acara"], status: "aktif", setuju_pada: 0, dibuat: 0 }]);
  assert.ok(t.includes(`"'=HYPERLINK(""x"")"`) && t.includes(`"'+cmd"`));
});
