// Permintaan surel @metiires.or.id (0030): validasi nama murni, matriks hak, alur D1 lokal nyata (ajukan -> setuju -> dibuat), satu aktif per akun, ketersediaan, peran salah.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { buatEnv } from "./_bantu.mjs";
import worker from "../src/worker.js";
import * as hak from "../src/hak.js";
import { periksaPermintaan } from "../src/surel.js";
import { sha, acak } from "../src/util.js";

let E, tutup;
const sesi = {};
async function masuk(nama, peran = "anggota") {
  const r = await E.DB.prepare("INSERT INTO akun (surel, nama, peran, status, garam, sandi, iterasi) VALUES (?,?,?, 'aktif', ?, ?, 100000)").bind(`${nama}@uji.test`, nama, peran, "a".repeat(32), "a".repeat(64)).run();
  const token = acak(32);
  await E.DB.prepare("INSERT INTO sesi (id_hash, akun_id, sampai) VALUES (?,?,?)").bind(await sha(token), r.meta.last_row_id, Math.floor(Date.now() / 1000) + 3600).run();
  sesi[nama] = "sesi=" + token;
}
const minta = async (jalur, { metode = "GET", json, nama } = {}) => {
  const h = { origin: "https://uji.test", "cf-connecting-ip": "203.0.113.9" };
  if (nama) h.cookie = sesi[nama];
  if (metode !== "GET") h["x-pb"] = "1";
  if (json) h["content-type"] = "application/json";
  const r = await worker.fetch(new Request("https://uji.test" + jalur, { method: metode, headers: h, body: json ? JSON.stringify(json) : undefined }), E, { waitUntil() {} });
  return { status: r.status, j: (r.headers.get("content-type") || "").includes("json") ? await r.json().catch(() => ({})) : null };
};
before(async () => { ({ env: E, tutup } = await buatEnv()); for (const n of ["ani", "budi", "cici", "dedi"]) await masuk(n); await masuk("peng", "pengurus"); await masuk("adm", "admin"); });
after(async () => { await tutup?.(); });

const B = { nama: "ani.sutrisno", alt1: "ani-s", alt2: "asutrisno", alasan: "Bendahara METI Wilayah Riau", organisasi: "METI Riau" };

test("nama murni: format dan kata cadangan", () => {
  for (const n of ["ani.sutrisno", "budi-01", "abc", "a".repeat(32), "1a2"]) assert.equal(hak.periksaNamaSurel(n), "ok", n);
  for (const n of ["ab", "a".repeat(33), "Ani", ".ani", "ani.", "-ani", "ani..s", "ani.-s", "an i", "ani_s", "ani@x", "123456", "", null, 7, "andré"]) assert.equal(hak.periksaNamaSurel(n), "format", String(n));
  for (const n of ["admin", "info", "sekretariat", "ketua", "noreply", "no-reply", "postmaster", "no.reply", "info"]) assert.equal(hak.periksaNamaSurel(n), "cadangan", n);
});

test("permintaan murni: kecilkan, tolak ekstra/duplikat/data pribadi", () => {
  assert.equal(periksaPermintaan({ ...B, nama: "  Ani.Sutrisno " }).nama, "ani.sutrisno");
  for (const b of [{ ...B, nama: "admin" }, { ...B, alt1: "info" }, { ...B, alt1: B.nama }, { ...B, alasan: "" }, { ...B, organisasi: undefined },
    { ...B, alasan: "hubungi ani@gmail.com" }, { ...B, alasan: "WA 081234567890" }, { ...B, ekstra: 1 }, { ...B, nama: 5 }])
    assert.throws(() => periksaPermintaan(b), (e) => e.status === 422, JSON.stringify(b));
});

test("hak: sel surel_minta per peran", () => {
  const sel = (p) => ["baca", "tambah", "ubah", "hapus"].filter((a) => hak.boleh(p, a, "surel_minta", undefined, { peran: p, status: "aktif" }).ok);
  assert.deepEqual(sel("publik"), []);
  for (const p of ["anggota", "pengurus", "kurator", "wilayah"]) assert.deepEqual(sel(p), ["baca", "tambah", "ubah"], p);
  for (const p of ["admin", "super"]) assert.deepEqual(sel(p), ["baca", "tambah", "ubah"], p);
});

test("tamu 401; non-admin 403 di antrean dan putusan", async () => {
  for (const [m, j] of [["GET", "/api/surel/saya"], ["GET", "/api/surel/cek?nama=abc"], ["POST", "/api/surel"], ["GET", "/api/admin/surel"], ["POST", "/api/admin/surel/1"]])
    assert.equal((await minta(j, { metode: m, json: m === "POST" ? {} : undefined })).status, 401, m + j);
  for (const n of ["ani", "peng"]) for (const [m, j] of [["GET", "/api/admin/surel"], ["POST", "/api/admin/surel/1"]]) assert.equal((await minta(j, { metode: m, json: m === "POST" ? {} : undefined, nama: n })).status, 403, m + j);
});

test("alur: ajukan -> satu aktif -> setuju -> terpakai -> dibuat; ditolak boleh ajukan lagi; jejak tercatat", async () => {
  assert.equal((await minta("/api/surel/cek?nama=admin", { nama: "ani" })).j.hasil, "cadangan");
  assert.equal((await minta("/api/surel/cek?nama=ani.sutrisno", { nama: "ani" })).j.hasil, "ok");
  assert.equal((await minta("/api/surel", { metode: "POST", json: { ...B, nama: "admin" }, nama: "ani" })).status, 422);
  const a = await minta("/api/surel", { metode: "POST", json: B, nama: "ani" });
  assert.equal(a.status, 201);
  assert.equal((await minta("/api/surel", { metode: "POST", json: { ...B, nama: "ani.dua" }, nama: "ani" })).status, 409, "satu aktif per akun");
  const saya = await minta("/api/surel/saya", { nama: "ani" });
  assert.equal(saya.j.baris[0].status, "diajukan"); assert.equal(saya.j.domain, "metiires.or.id");
  assert.equal((await minta("/api/surel/saya", { nama: "budi" })).j.baris.length, 0, "milik sendiri saja");
  assert.equal((await minta("/api/admin/surel?status=diajukan", { nama: "adm" })).j.baris[0].pengaju, "ani");
  // dibuat sebelum disetujui ditolak; setuju tanpa alamat 422; catatan wajib saat tolak
  assert.equal((await minta(`/api/admin/surel/${a.j.id}`, { metode: "POST", json: { aksi: "dibuat" }, nama: "adm" })).status, 409);
  assert.equal((await minta(`/api/admin/surel/${a.j.id}`, { metode: "POST", json: { aksi: "setuju" }, nama: "adm" })).status, 422);
  assert.equal((await minta(`/api/admin/surel/${a.j.id}`, { metode: "POST", json: { aksi: "tolak" }, nama: "adm" })).status, 422);
  assert.equal((await minta(`/api/admin/surel/${a.j.id}`, { metode: "POST", json: { aksi: "setuju", alamat: "admin" }, nama: "adm" })).status, 422);
  assert.equal((await minta(`/api/admin/surel/${a.j.id}`, { metode: "POST", json: { aksi: "setuju", alamat: "ani-s", catatan: "pakai alternatif" }, nama: "adm" })).status, 200);
  assert.equal((await minta(`/api/admin/surel/${a.j.id}`, { metode: "POST", json: { aksi: "setuju", alamat: "ani-s" }, nama: "adm" })).status, 409, "putus sekali");
  assert.equal((await minta("/api/surel/cek?nama=ani-s", { nama: "budi" })).j.hasil, "terpakai");
  assert.equal((await minta("/api/surel", { metode: "POST", json: { ...B, nama: "ani-s", alt1: undefined, alt2: undefined }, nama: "budi" })).status, 409, "alamat sudah disetujui");
  assert.equal((await minta(`/api/admin/surel/${a.j.id}`, { metode: "POST", json: { aksi: "dibuat", catatan: "kotak aktif" }, nama: "adm" })).status, 200);
  const s2 = (await minta("/api/surel/saya", { nama: "ani" })).j.baris[0];
  assert.equal(s2.status, "dibuat"); assert.equal(s2.alamat_final, "ani-s");
  const ad = (await minta("/api/admin/surel?status=dibuat", { nama: "adm" })).j.baris[0];
  assert.equal(ad.pemutus, "adm"); assert.equal(ad.pembuat, "adm"); assert.ok(ad.dibuat_pada && ad.diputus_pada);
  // ditolak: catatan wajib, lalu boleh ajukan lagi
  const c = await minta("/api/surel", { metode: "POST", json: { ...B, nama: "cici.x", alt1: undefined, alt2: undefined }, nama: "cici" });
  assert.equal((await minta(`/api/admin/surel/${c.j.id}`, { metode: "POST", json: { aksi: "tolak", catatan: "nama kurang jelas" }, nama: "adm" })).status, 200);
  assert.equal((await minta("/api/surel/saya", { nama: "cici" })).j.baris[0].catatan_admin, "nama kurang jelas");
  assert.equal((await minta("/api/surel", { metode: "POST", json: { ...B, nama: "cici.baru", alt1: undefined, alt2: undefined }, nama: "cici" })).status, 201);
  const jej = await E.DB.prepare("SELECT aksi FROM jejak WHERE tabel = 'surel_minta' ORDER BY id").all();
  assert.deepEqual(jej.results.map((r) => r.aksi), ["kirim", "tinjau", "tinjau", "kirim", "tinjau", "kirim"]);
});

test("D1: indeks unik menahan dua alamat final sama dan CHECK menahan status liar", async () => {
  const id = (await E.DB.prepare("SELECT id FROM akun WHERE nama = 'dedi'").first()).id;
  await assert.rejects(E.DB.prepare("INSERT INTO surel_minta (akun_id, nama_lokal, alasan, organisasi, status) VALUES (?, 'dedi.x', 'abc', 'METI', 'selesai')").bind(id).run());
  await assert.rejects(E.DB.prepare("INSERT INTO surel_minta (akun_id, nama_lokal, alasan, organisasi) VALUES (?, 'Dedi', 'abc', 'METI')").bind(id).run());
  await assert.rejects(E.DB.prepare("INSERT INTO surel_minta (akun_id, nama_lokal, alasan, organisasi, status, alamat_final, diputus_pada) VALUES (?, 'dedi.x', 'abc', 'METI', 'disetujui', 'ani-s', 1)").bind(id).run(), /UNIQUE/);
});

test("laju: lebih dari 10 pengajuan per jam ditolak", async () => {
  let s;
  for (let i = 0; i < 11; i++) s = (await minta("/api/surel", { metode: "POST", json: { ...B, nama: "dedi" + i + "x", alt1: undefined, alt2: undefined }, nama: "dedi" })).status;
  assert.equal(s, 429);
});
