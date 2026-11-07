// Ikuti + ringkasan mingguan (0019): D1 lokal nyata lewat worker.fetch. Tamu 401, isolasi antar akun, batas, ringkasan dari D1 + data statis.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { buatEnv } from "./_bantu.mjs";
import worker from "../src/worker.js";
import { ringkasanMingguan } from "../src/ikuti.js";
import { sha, acak } from "../src/util.js";

let E, tutup;
const sesi = {}, akunId = {};
const SEKARANG = Date.now();
const iso = (hari) => new Date(SEKARANG - hari * 86400000).toISOString();
const BERITA = [
  { id: "b1", judul: "Berita org", url: "https://x.test/1", media: "x.test", terbit: iso(2), organisasi_ids: ["ix_arko"] },
  { id: "b2", judul: "Berita lama", url: "https://x.test/2", media: "x.test", terbit: iso(20), organisasi_ids: ["ix_arko"] },
  { id: "b3", judul: "Berita proyek", url: "https://x.test/3", media: "x.test", terbit: iso(1), proyek_ids: ["pj_0001"] },
  { id: "b4", judul: "Tak diikuti", url: "https://x.test/4", media: "x.test", terbit: iso(1), organisasi_ids: ["ix_lain"] },
];
const REGULASI = [{ id: "uu-1-2026", judul: "UU baru", tanggal_ditetapkan: iso(3).slice(0, 10) }, { id: "uu-2-2020", judul: "UU lama", tanggal_ditetapkan: "2020-01-01" }];
const ASSETS = { fetch: async (req) => {
  const n = new URL(req.url).pathname;
  const baris = n === "/data/berita.json" ? BERITA : n === "/data/regulasi.json" ? REGULASI : null;
  return baris ? new Response(JSON.stringify({ baris })) : new Response("x", { status: 404 });
} };
async function masuk(nama, peran = "anggota") {
  const r = await E.DB.prepare("INSERT INTO akun (surel, nama, peran, status, garam, sandi, iterasi) VALUES (?,?,?, 'aktif', ?, ?, 100000)").bind(`${nama}@uji.test`, nama, peran, "a".repeat(32), "a".repeat(64)).run();
  const token = acak(32);
  await E.DB.prepare("INSERT INTO sesi (id_hash, akun_id, sampai) VALUES (?,?,?)").bind(await sha(token), r.meta.last_row_id, Math.floor(Date.now() / 1000) + 3600).run();
  sesi[nama] = "sesi=" + token; akunId[nama] = r.meta.last_row_id;
}
const minta = async (jalur, { metode = "GET", json, nama } = {}) => {
  const h = { origin: "https://uji.test", "cf-connecting-ip": "203.0.113.9" };
  if (nama) h.cookie = sesi[nama];
  if (metode !== "GET") h["x-pb"] = "1";
  if (json) h["content-type"] = "application/json";
  const r = await worker.fetch(new Request("https://uji.test" + jalur, { method: metode, headers: h, body: json ? JSON.stringify(json) : undefined }), E, { waitUntil() {} });
  return { status: r.status, j: await r.json().catch(() => ({})) };
};
before(async () => { ({ env: E, tutup } = await buatEnv({ tambahan: { ASSETS } })); await masuk("ani"); await masuk("budi"); await masuk("adm", "admin"); });
after(async () => { await tutup?.(); });

test("tamu: semua rute ikuti 401", async () => {
  for (const [m, j] of [["GET", "/api/ikuti"], ["POST", "/api/ikuti"], ["DELETE", "/api/ikuti/proyek/pj_0001"], ["GET", "/api/ikuti/ringkasan"], ["POST", "/api/ikuti/lihat"]])
    assert.equal((await minta(j, { metode: m, json: m === "POST" ? { jenis: "proyek", ref: "pj_1" } : undefined })).status, 401, m + j);
});

test("ikuti, idempoten, daftar terisolasi per akun, lepas", async () => {
  assert.equal((await minta("/api/ikuti", { metode: "POST", json: { jenis: "proyek", ref: "pj_0001" }, nama: "ani" })).status, 201);
  assert.equal((await minta("/api/ikuti", { metode: "POST", json: { jenis: "proyek", ref: "pj_0001" }, nama: "ani" })).status, 201, "ulang tak galat");
  await minta("/api/ikuti", { metode: "POST", json: { jenis: "organisasi", ref: "ix_arko" }, nama: "ani" });
  const a = await minta("/api/ikuti", { nama: "ani" });
  assert.equal(a.j.baris.length, 2);
  assert.equal((await minta("/api/ikuti", { nama: "budi" })).j.baris.length, 0);
  assert.equal((await minta("/api/ikuti/proyek/pj_0001", { metode: "DELETE", nama: "budi" })).status, 200);
  assert.equal((await minta("/api/ikuti", { nama: "ani" })).j.baris.length, 2, "hapus oleh akun lain tak berefek");
  await minta("/api/ikuti/proyek/pj_0001", { metode: "DELETE", nama: "ani" });
  assert.equal((await minta("/api/ikuti", { nama: "ani" })).j.baris.length, 1);
});

test("validasi: jenis, ref, provinsi 2 digit", async () => {
  for (const b of [{ jenis: "orang", ref: "x1" }, { jenis: "proyek", ref: "a b" }, { jenis: "proyek", ref: "" }, { jenis: "provinsi", ref: "abc" }, { jenis: "proyek" }])
    assert.equal((await minta("/api/ikuti", { metode: "POST", json: b, nama: "ani" })).status, 422, JSON.stringify(b));
  assert.equal((await minta("/api/ikuti", { metode: "POST", json: { jenis: "provinsi", ref: "32" }, nama: "ani" })).status, 201);
});

test("batas 200 per akun (trigger)", async () => {
  await masuk("cici");
  for (let i = 0; i < 200; i++) await E.DB.prepare("INSERT INTO ikuti (akun_id, jenis, ref) VALUES (?, 'proyek', ?)").bind(akunId.cici, "p" + i).run();
  assert.equal((await minta("/api/ikuti", { metode: "POST", json: { jenis: "proyek", ref: "lebih" }, nama: "cici" })).status, 409);
});

test("ringkasanMingguan: berita 7 hari, regulasi, portal dan koreksi disetujui; yang lama dan tak diikuti tidak masuk", async () => {
  await masuk("dodi");
  const akun = { id: akunId.dodi, peran: "anggota" };
  for (const [j, r] of [["organisasi", "ix_arko"], ["proyek", "pj_0001"], ["regulasi", "uu-1-2026"], ["regulasi", "uu-2-2020"]]) await minta("/api/ikuti", { metode: "POST", json: { jenis: j, ref: r }, nama: "dodi" });
  const now = Math.floor(Date.now() / 1000);
  await E.DB.prepare("INSERT INTO org_ajuan (akun_id, organisasi_id, jenis, isi, bukti_url, status, diputus_pada, diputus_oleh) VALUES (?, 'ix_arko', 'profil', '{\"situs\":\"https://a.test\"}', 'https://b.test/x', 'setuju', ?, ?)").bind(akunId.adm, now - 3600, akunId.adm).run();
  await E.DB.prepare("INSERT INTO org_ajuan (akun_id, organisasi_id, jenis, isi, bukti_url, status, diputus_pada, diputus_oleh) VALUES (?, 'ix_arko', 'profil', '{}', 'https://b.test/x', 'setuju', ?, ?)").bind(akunId.adm, now - 20 * 86400, akunId.adm).run();
  await E.DB.prepare("INSERT INTO koreksi_usul (entitas, entitas_id, kolom, nilai_usulan, alasan, status, diputus_pada, diputus_oleh) VALUES ('proyek','pj_0001','status','x','y','setuju',?,?)").bind(now - 7200, akunId.adm).run();
  await E.DB.prepare("INSERT INTO koreksi_usul (entitas, entitas_id, kolom, nilai_usulan, alasan, status, diputus_pada, diputus_oleh) VALUES ('proyek','pj_9999','status','x','y','setuju',?,?)").bind(now - 7200, akunId.adm).run();
  const r = await ringkasanMingguan(E, akun);
  const tipe = (t) => r.item.filter((x) => x.tipe === t);
  assert.deepEqual(tipe("berita").map((x) => x.judul).sort(), ["Berita org", "Berita proyek"]);
  assert.deepEqual(tipe("regulasi").map((x) => x.ref), ["uu-1-2026"]);
  assert.equal(tipe("portal").length, 1);
  assert.deepEqual(tipe("koreksi").map((x) => x.ref), ["pj_0001"]);
  assert.equal(r.baru, r.item.length, "belum pernah dilihat: semua baru");
  assert.equal((await minta("/api/ikuti", { nama: "dodi" })).j.baru, 2, "lonceng: hanya yang dari D1");
  assert.equal((await minta("/api/ikuti/ringkasan", { nama: "dodi" })).j.item.length, r.item.length);
  assert.equal((await minta("/api/ikuti/lihat", { metode: "POST", nama: "dodi" })).status, 200);
  assert.equal((await minta("/api/ikuti", { nama: "dodi" })).j.baru, 0, "sesudah dilihat lonceng nol");
  assert.equal((await ringkasanMingguan(E, { id: akunId.ani, peran: "anggota" })).item.filter((x) => x.tipe === "portal").length, 1, "ani mengikuti ix_arko");
});

test("tabel belum ada: 503 fitur_belum_aktif", async () => {
  const { env, tutup: t2 } = await buatEnv({ migrasi: false });
  try {
    const { terapkanMigrasi } = await import("./_bantu.mjs");
    void terapkanMigrasi;
    await env.DB.prepare("CREATE TABLE akun (id INTEGER PRIMARY KEY, surel TEXT, nama TEXT, peran TEXT, status TEXT, bahasa TEXT, wajib_ganti INTEGER, cakupan_prov TEXT)").run();
    await env.DB.prepare("CREATE TABLE sesi (id_hash TEXT PRIMARY KEY, akun_id INTEGER, dibuat INTEGER DEFAULT 0, sampai INTEGER, ip_hash TEXT)").run();
    await env.DB.prepare("INSERT INTO akun VALUES (1,'a@b.test','A','anggota','aktif','id',0,NULL)").run();
    const token = acak(32);
    await env.DB.prepare("INSERT INTO sesi (id_hash, akun_id, sampai) VALUES (?,1,?)").bind(await sha(token), Math.floor(Date.now() / 1000) + 600).run();
    const r = await worker.fetch(new Request("https://uji.test/api/ikuti", { headers: { cookie: "sesi=" + token } }), env, { waitUntil() {} });
    assert.equal(r.status, 503);
    assert.equal((await r.json()).kode, "fitur_belum_aktif");
  } finally { await t2(); }
});
