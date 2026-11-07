// Chat ke admin 0016: D1 lokal nyata + R2 tiruan. Tamu 401, isolasi antar akun, balasan admin, laju, lampiran, escape.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { buatEnv } from "./_bantu.mjs";
import worker from "../src/worker.js";
import { sha, acak } from "../src/util.js";
import { gelembungHtml } from "../public/inti/pesan_umum.js";

let E, tutup;
const sesi = {}, R2 = new Map();
const BERKAS = {
  put: async (k, v) => { R2.set(k, new Uint8Array(v)); },
  get: async (k) => (R2.has(k) ? { body: new Response(R2.get(k)).body } : null),
  delete: async (k) => { R2.delete(k); },
};
async function masuk(nama, peran = "anggota") {
  const r = await E.DB.prepare("INSERT INTO akun (surel, nama, peran, status, garam, sandi, iterasi) VALUES (?,?,?, 'aktif', ?, ?, 100000)").bind(`${nama}@uji.test`, "Nama " + nama, peran, "a".repeat(32), "a".repeat(64)).run();
  const token = acak(32);
  await E.DB.prepare("INSERT INTO sesi (id_hash, akun_id, sampai) VALUES (?,?,?)").bind(await sha(token), r.meta.last_row_id, Math.floor(Date.now() / 1000) + 3600).run();
  sesi[nama] = "sesi=" + token;
}
const minta = (jalur, { metode = "GET", form, json, nama, header = {} } = {}) => {
  const h = { origin: "https://uji.test", "cf-connecting-ip": "203.0.113.9", ...header };
  if (nama) h.cookie = sesi[nama];
  if (metode !== "GET") h["x-pb"] = header["x-pb"] ?? "1";
  if (json) h["content-type"] = "application/json";
  return worker.fetch(new Request("https://uji.test" + jalur, { method: metode, headers: h, body: form ?? (json ? JSON.stringify(json) : undefined) }), E, { waitUntil() {} });
};
const fd = (o) => { const f = new FormData(); for (const [k, v] of Object.entries(o)) if (v != null) f.set(k, v); return f; };
const kirim = async (nama, o, jalur = "/api/pesan") => { const r = await minta(jalur, { metode: "POST", form: fd(o), nama }); return { status: r.status, j: await r.json().catch(() => ({})) }; };
const ambil = async (jalur, nama) => { const r = await minta(jalur, { nama }); return { status: r.status, j: await r.json().catch(() => ({})) }; };
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const PDF = new TextEncoder().encode("%PDF-1.4\n%%EOF");
const berkas = (bytes, nama, tipe) => new File([bytes], nama, { type: tipe });

before(async () => {
  ({ env: E, tutup } = await buatEnv({ tambahan: { BERKAS } }));
  for (const n of ["ani", "budi", "cici", "dodi"]) await masuk(n);
  await masuk("adm", "admin");
  await masuk("kur", "kurator");
});
after(async () => { await tutup?.(); });

test("tamu: semua rute pesan 401", async () => {
  for (const [j, m] of [["/api/pesan", "GET"], ["/api/pesan", "POST"], ["/api/pesan/" + "a".repeat(16), "GET"], ["/api/admin/pesan", "GET"], ["/api/admin/pesan-belum", "GET"], ["/api/admin/pesan/" + "a".repeat(16) + "/balas", "POST"]]) {
    const r = await minta(j, { metode: m, form: m === "POST" ? fd({ isi: "x", topik: "umum" }) : undefined });
    assert.equal(r.status, 401, m + " " + j);
  }
});

test("CSRF: kirim tanpa x-pb ditolak", async () => {
  const r = await minta("/api/pesan", { metode: "POST", form: fd({ isi: "halo", topik: "umum" }), nama: "ani", header: { "x-pb": "0" } });
  assert.equal(r.status, 403);
});

let utasAni;
test("akun A membuat utas; hanya A melihatnya; isi dan topik divalidasi", async () => {
  const r = await kirim("ani", { isi: "Halo admin", topik: "koreksi" });
  assert.equal(r.status, 201); utasAni = r.j.utas_id;
  assert.match(utasAni, /^[0-9a-f]{16}$/);
  const a = await ambil("/api/pesan", "ani");
  assert.equal(a.j.utas.length, 1); assert.equal(a.j.utas[0].topik, "koreksi"); assert.equal(a.j.utas[0].status, "baru");
  assert.equal((await ambil("/api/pesan", "budi")).j.utas.length, 0);
  assert.equal((await kirim("ani", { isi: "x", topik: "bukan" })).status, 422);
  assert.equal((await kirim("ani", { isi: "   ", topik: "umum" })).status, 422);
  assert.equal((await kirim("ani", { isi: "a".repeat(2001), topik: "umum" })).status, 422);
});

test("akun B tidak bisa membaca atau menambah ke utas akun A (404)", async () => {
  assert.equal((await ambil("/api/pesan/" + utasAni, "budi")).status, 404);
  assert.equal((await kirim("budi", { isi: "nyelonong", utas: utasAni })).status, 404);
  assert.equal((await ambil(`/api/pesan/${utasAni}/berkas/${"b".repeat(16)}`, "budi")).status, 404);
  assert.equal((await ambil("/api/pesan/" + utasAni, "ani")).status, 200);
  const n = await E.DB.prepare("SELECT COUNT(*) n FROM pesan WHERE utas_id = ?").bind(utasAni).first();
  assert.equal(n.n, 1);
});

test("peran non-admin ditolak 403 di rute admin (anggota dan kurator)", async () => {
  for (const n of ["ani", "kur"]) {
    assert.equal((await ambil("/api/admin/pesan", n)).status, 403);
    assert.equal((await ambil("/api/admin/pesan/" + utasAni, n)).status, 403);
    assert.equal((await kirim(n, { isi: "balas" }, `/api/admin/pesan/${utasAni}/balas`)).status, 403);
  }
});

test("admin melihat semua, membuka (dibaca), membalas; akun melihat balasan sebagai belum dibaca lalu dibaca; jejak tercatat", async () => {
  await kirim("budi", { isi: "Pertanyaan keanggotaan", topik: "keanggotaan" });
  const d = await ambil("/api/admin/pesan", "adm");
  assert.equal(d.j.total, 2); assert.equal(d.j.belum, 2);
  assert.equal((await ambil("/api/admin/pesan-belum", "adm")).j.belum, 2);
  const buka = await ambil("/api/admin/pesan/" + utasAni, "adm");
  assert.equal(buka.status, 200); assert.equal(buka.j.pesan.length, 1);
  assert.equal((await ambil("/api/admin/pesan-belum", "adm")).j.belum, 1);
  const b = await kirim("adm", { isi: "Sudah kami tinjau" }, `/api/admin/pesan/${utasAni}/balas`);
  assert.equal(b.status, 201);
  const lihat = await ambil("/api/pesan", "ani");
  assert.equal(lihat.j.belum, 1); assert.equal(lihat.j.utas[0].status, "dibalas"); assert.equal(lihat.j.utas[0].terakhir_dari, "admin");
  const u = await ambil("/api/pesan/" + utasAni, "ani");
  assert.deepEqual(u.j.pesan.map((m) => m.dari), ["akun", "admin"]); assert.equal(u.j.utas.dibaca_admin, 1);
  assert.equal((await ambil("/api/pesan", "ani")).j.belum, 0);
  const j = await E.DB.prepare("SELECT aksi, peran, ke FROM jejak WHERE tabel = 'pesan' AND aksi = 'kirim'").first();
  assert.equal(j.peran, "admin"); assert.ok(!/tinjau/.test(j.ke), "jejak tidak memuat isi pesan");
});

test("akun membalas lagi: status kembali baru dan belum dibaca admin; admin tandai selesai (idempoten, tercatat sekali)", async () => {
  await kirim("ani", { isi: "Terima kasih", utas: utasAni });
  const d = (await ambil("/api/admin/pesan?status=baru", "adm")).j;
  assert.ok(d.baris.some((x) => x.id === utasAni && x.dibaca_admin === 0));
  for (let i = 0; i < 2; i++) assert.equal((await minta(`/api/admin/pesan/${utasAni}/status`, { metode: "POST", json: { status: "selesai" }, nama: "adm" })).status, 200);
  assert.equal((await ambil("/api/admin/pesan?status=selesai&topik=koreksi", "adm")).j.total, 1);
  const n = await E.DB.prepare("SELECT COUNT(*) n FROM jejak WHERE tabel = 'pesan_utas' AND aksi = 'ubah'").first();
  assert.equal(n.n, 1);
  assert.equal((await minta(`/api/admin/pesan/${utasAni}/status`, { metode: "POST", json: { status: "ngawur" }, nama: "adm" })).status, 422);
  await kirim("ani", { isi: "satu lagi", utas: utasAni });
  assert.equal((await ambil("/api/pesan", "ani")).j.utas[0].status, "baru");
});

test("batas laju kirim per akun (20/jam) lalu 429; akun lain tidak terpengaruh", async () => {
  const u = (await kirim("cici", { isi: "awal", topik: "umum" })).j.utas_id;
  let kode;
  for (let i = 0; i < 25; i++) { kode = (await kirim("cici", { isi: "p" + i, utas: u })).status; if (kode === 429) break; }
  assert.equal(kode, 429);
  assert.equal((await kirim("dodi", { isi: "masih bisa", topik: "umum" })).status, 201);
});

test("lampiran: PNG dan PDF sah tersimpan di R2 dan hanya pemilik/admin bisa mengunduh", async () => {
  const r = await kirim("dodi", { isi: "ini fotonya", utas: (await ambil("/api/pesan", "dodi")).j.utas[0].id, berkas: berkas(PNG, "../../foto<1>.png", "image/png") });
  assert.equal(r.status, 201);
  const kunci = `pesan/${r.j.utas_id}/${r.j.id}`;
  assert.ok(R2.has(kunci));
  const u = (await ambil("/api/pesan/" + r.j.utas_id, "dodi")).j;
  const m = u.pesan.find((x) => x.id === r.j.id);
  assert.equal(m.lampiran.tipe, "image/png"); assert.equal(m.lampiran.nama, "foto1.png"); assert.equal(m.lampiran.ukuran, PNG.length);
  const unduh = await minta(`/api/pesan/${r.j.utas_id}/berkas/${r.j.id}`, { nama: "dodi" });
  assert.equal(unduh.status, 200); assert.equal(unduh.headers.get("content-type"), "image/png");
  assert.equal((await minta(`/api/pesan/${r.j.utas_id}/berkas/${r.j.id}`, { nama: "ani" })).status, 404);
  assert.equal((await minta(`/api/admin/pesan/${r.j.utas_id}/berkas/${r.j.id}`, { nama: "adm" })).status, 200);
  const p = await kirim("adm", { isi: "ini pdf", berkas: berkas(PDF, "x.pdf", "application/pdf") }, `/api/admin/pesan/${r.j.utas_id}/balas`);
  assert.equal(p.status, 201);
  const dl = await minta(`/api/pesan/${r.j.utas_id}/berkas/${p.j.id}`, { nama: "dodi" });
  assert.match(dl.headers.get("content-disposition"), /^attachment/);
});

test("lampiran ditolak: bukan gambar/PDF (walau tipe klien dipalsukan), SVG, kosong magic, dan lebih dari 5 MB", async () => {
  const sebelum = R2.size;
  const utas = (await ambil("/api/pesan", "dodi")).j.utas[0].id;
  const exe = new Uint8Array([0x4d, 0x5a, 0x90, 0, 3, 0, 0, 0]);
  assert.equal((await kirim("dodi", { isi: "a", utas, berkas: berkas(exe, "x.png", "image/png") })).status, 415);
  assert.equal((await kirim("dodi", { isi: "a", utas, berkas: berkas(new TextEncoder().encode("<svg onload=alert(1)>"), "x.svg", "image/svg+xml") })).status, 415);
  assert.equal((await kirim("dodi", { isi: "a", utas, berkas: berkas(new TextEncoder().encode("halo teks biasa"), "x.pdf", "application/pdf") })).status, 415);
  const besar = new Uint8Array(5 * 1024 * 1024 + 1); besar.set(PNG);
  assert.equal((await kirim("dodi", { isi: "a", utas, berkas: berkas(besar, "b.png", "image/png") })).status, 413);
  assert.equal(R2.size, sebelum, "tidak ada objek yatim di R2");
});

test("isi di-escape saat tampil; disimpan apa adanya", () => {
  const jahat = '<img src=x onerror="alert(1)"><script>x</script>';
  const h = gelembungHtml({ id: "a".repeat(16), dari: "akun", isi: jahat, lampiran: { nama: '"><b>', tipe: "application/pdf" }, waktu: 1 }, { nama: "<i>", waktu: "t", url: "/api/x?a=1&b=2" });
  assert.ok(!/<img|<script|<b>|<i>/.test(h), h);
  assert.match(h, /&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt;/);
});

test("isi jahat tersimpan mentah di D1 dan keluar sebagai data JSON, bukan HTML", async () => {
  const r = await kirim("dodi", { isi: "<b>tebal</b>", topik: "teknis" });
  const u = (await ambil("/api/pesan/" + r.j.utas_id, "dodi")).j;
  assert.equal(u.pesan[0].isi, "<b>tebal</b>");
});
