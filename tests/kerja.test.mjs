// Green jobs (0028): validasi murni, alur D1 lokal nyata (klaim -> pasang -> moderasi -> terbit), peran salah ditolak, data pribadi ditolak.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { buatEnv } from "./_bantu.mjs";
import worker from "../src/worker.js";
import { periksaLowongan } from "../src/kerja.js";
import { sha, acak } from "../src/util.js";

let E, tutup;
const sesi = {};
const ORG = { baris: [{ id: "ix_arko", nama: "PT Arko Hidro" }, { id: "ix_lain", nama: "PT Lain" }] };
const ASSETS = { fetch: async (req) => (new URL(req.url).pathname === "/data/organisasi.json" ? Response.json(ORG) : new Response("aset", { status: 200 })) };
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
before(async () => { ({ env: E, tutup } = await buatEnv({ tambahan: { ASSETS } })); for (const n of ["ani", "budi"]) await masuk(n); await masuk("adm", "admin"); });
after(async () => { await tutup?.(); });

const LOW = { organisasi_id: "ix_arko", judul: "Insinyur PLTA", kode_prov: "11", lokasi: "Banda Aceh", teknologi: "hidro", jenjang: "menengah", deskripsi: "Mengawasi operasi PLTA 87 MW.", tautan: "https://arko.example/karir/1" };

test("validasi murni", () => {
  const ok = periksaLowongan(LOW);
  assert.equal(ok.teknologi, "hidro"); assert.equal(ok.kodeProv, "11");
  for (const b of [
    { ...LOW, teknologi: "fusi" }, { ...LOW, jenjang: "dewa" }, { ...LOW, tautan: "http://tidak-aman.example" }, { ...LOW, tautan: "https://wa.me/62812" },
    { ...LOW, deskripsi: "hubungi budi@gmail.com" }, { ...LOW, deskripsi: "WA 081234567890" }, { ...LOW, kode_prov: "ab" }, { ...LOW, batas: "2020-01-01" }, { ...LOW, judul: "" }, { ...LOW, ekstra: 1 },
  ]) assert.throws(() => periksaLowongan(b), (e) => e.status === 422, JSON.stringify(b));
});

test("tamu 401; non-admin 403 di antrean", async () => {
  for (const [m, j] of [["GET", "/api/kerja"], ["GET", "/api/kerja/saya"], ["POST", "/api/kerja"], ["GET", "/api/admin/kerja"], ["POST", "/api/admin/kerja/1"]])
    assert.equal((await minta(j, { metode: m, json: m === "POST" ? {} : undefined })).status, 401, m + j);
  for (const [m, j] of [["GET", "/api/admin/kerja"], ["POST", "/api/admin/kerja/1"]]) assert.equal((await minta(j, { metode: m, json: m === "POST" ? {} : undefined, nama: "ani" })).status, 403, m + j);
});

test("alur: tanpa klaim 403 -> klaim disetujui -> pasang menunggu -> tak tampil -> terbit -> tampil; putus sekali; organisasi lain 403", async () => {
  assert.equal((await minta("/api/kerja", { metode: "POST", json: LOW, nama: "ani" })).status, 403, "belum terhubung");
  const k = await minta("/api/portal/klaim", { metode: "POST", json: { organisasi_id: "ix_arko" }, nama: "ani" });
  assert.equal((await minta("/api/kerja", { metode: "POST", json: LOW, nama: "ani" })).status, 403, "klaim belum disetujui");
  assert.equal((await minta(`/api/admin/portal/klaim/${k.j.id}`, { metode: "POST", json: { aksi: "setuju" }, nama: "adm" })).status, 200);
  assert.equal((await minta("/api/kerja", { metode: "POST", json: { ...LOW, organisasi_id: "ix_lain" }, nama: "ani" })).status, 403, "organisasi lain");
  assert.equal((await minta("/api/kerja", { metode: "POST", json: LOW, nama: "budi" })).status, 403, "akun lain");
  assert.equal((await minta("/api/kerja", { metode: "POST", json: { ...LOW, organisasi_id: "ix_tak_ada" }, nama: "ani" })).status, 403);
  const a = await minta("/api/kerja", { metode: "POST", json: LOW, nama: "ani" });
  assert.equal(a.status, 201);
  assert.equal((await minta("/api/kerja", { nama: "budi" })).j.baris.length, 0, "menunggu: belum tampil");
  const saya = await minta("/api/kerja/saya", { nama: "ani" });
  assert.equal(saya.j.baris[0].status, "menunggu");
  assert.equal((await minta("/api/kerja/saya", { nama: "budi" })).j.baris.length, 0);
  const antre = await minta("/api/admin/kerja", { nama: "adm" });
  assert.equal(antre.j.total, 1); assert.equal(antre.j.baris[0].organisasi_nama, "PT Arko Hidro");
  assert.equal((await minta(`/api/admin/kerja/${a.j.id}`, { metode: "POST", json: { aksi: "tolak" }, nama: "adm" })).status, 422, "tolak wajib catatan");
  assert.equal((await minta(`/api/admin/kerja/${a.j.id}`, { metode: "POST", json: { aksi: "terbit" }, nama: "adm" })).status, 200);
  assert.equal((await minta(`/api/admin/kerja/${a.j.id}`, { metode: "POST", json: { aksi: "tolak", catatan: "x" }, nama: "adm" })).status, 409, "sekali putus");
  const tampil = await minta("/api/kerja", { nama: "budi" });
  assert.equal(tampil.j.baris.length, 1); assert.equal(tampil.j.baris[0].judul, "Insinyur PLTA");
  assert.equal("akun_id" in tampil.j.baris[0], false, "akun pemasang tidak bocor");
  const b = await minta("/api/kerja", { metode: "POST", json: { ...LOW, judul: "Ditolak" }, nama: "ani" });
  assert.equal((await minta(`/api/admin/kerja/${b.j.id}`, { metode: "POST", json: { aksi: "tolak", catatan: "kurang jelas" }, nama: "adm" })).status, 200);
  assert.equal((await minta("/api/kerja", { nama: "budi" })).j.baris.length, 1, "yang ditolak tak tampil");
  const jejak = await E.DB.prepare("SELECT aksi FROM jejak WHERE tabel = 'lowongan' ORDER BY id").all();
  assert.deepEqual(jejak.results.map((x) => x.aksi), ["kirim", "tinjau", "kirim", "tinjau"]);
});

test("lowongan kedaluwarsa tak tampil; batas 10 menunggu per akun", async () => {
  await E.DB.prepare("UPDATE lowongan SET batas = '2020-01-01' WHERE judul = 'Insinyur PLTA'").run();
  assert.equal((await minta("/api/kerja", { nama: "budi" })).j.baris.length, 0);
  const id = (await E.DB.prepare("SELECT id FROM akun WHERE nama = 'ani'").first()).id;
  const sisa = 10 - (await E.DB.prepare("SELECT count(*) n FROM lowongan WHERE akun_id = ? AND status = 'menunggu'").bind(id).first()).n;
  for (let i = 0; i < sisa; i++) await E.DB.prepare("INSERT INTO lowongan (akun_id, organisasi_id, organisasi_nama, judul, teknologi, jenjang, tautan) VALUES (?, 'ix_arko', 'X', 'Isi', 'surya', 'pemula', 'https://x.example/a')").bind(id).run();
  assert.equal((await minta("/api/kerja", { metode: "POST", json: LOW, nama: "ani" })).status, 409);
});
