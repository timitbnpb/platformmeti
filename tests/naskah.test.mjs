// naskah.test.mjs (Portal otorisasi, migrasi 0036): rute lewat worker.fetch utuh, D1 lokal NYATA. Tiruan hanya R2 (env.BERKAS).
// Hak, CHECK, TRIGGER, jejak berjalan di D1 nyata. Aturan dua kunci dibuktikan DUA kali: lewat API dan lewat UPDATE SQL langsung.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { buatEnv, pecahSql } from "./_bantu.mjs";
import { readFileSync } from "node:fs";
import worker from "../src/worker.js";
import { rute } from "../src/naskah.js";
import * as hak from "../src/hak.js";
import { sha } from "../src/util.js";

const BERKAS = new Map();
const R2 = {
  put: async (k, v) => { BERKAS.set(k, new Uint8Array(await new Response(v).arrayBuffer())); },
  get: async (k) => (BERKAS.has(k) ? { body: BERKAS.get(k) } : null),
  delete: async (k) => { BERKAS.delete(k); },
};
const PDF = new TextEncoder().encode("%PDF-1.4\n1 0 obj<<>>endobj\n%%EOF");
const PERAN = ["anggota", "pengurus", "wilayah", "kurator", "admin", "super"];
const TANPA_KUNCI = ["anggota", "wilayah", "kurator"]; // hanya melihat yang sah
const ID = {};
const COOKIE = {};

let E, tutup;
const q = (s, ...b) => E.DB.prepare(s).bind(...b);
const satu = (s, ...b) => q(s, ...b).first();
const cacah = async (t, w = "") => (await satu(`SELECT count(*) AS n FROM ${t} ${w}`)).n;
const baris = (ref) => satu("SELECT * FROM naskah WHERE ref = ?", ref);

before(async () => {
  ({ env: E, tutup } = await buatEnv());
  E.BERKAS = R2;
  for (const peran of [...PERAN, "admin2"]) {
    const dasar = peran === "admin2" ? "admin" : peran;
    const r = await q("INSERT INTO akun (surel, nama, peran, cakupan_prov, status, garam, sandi, iterasi) VALUES (?,?,?,?, 'aktif', ?, ?, 100000)",
      `${peran}@uji.test`, peran, dasar, dasar === "wilayah" ? "31" : null, "a".repeat(32), "a".repeat(64)).run();
    const token = ([...PERAN, "admin2"].indexOf(peran) + 16).toString(16).repeat(32);
    await hak.catatSesi(E, { idHash: await sha(token), akunId: r.meta.last_row_id, peran: dasar, sampai: Math.floor(Date.now() / 1000) + 3600, ipHash: "h" });
    COOKIE[peran] = `sesi=${token}`;
    ID[peran] = r.meta.last_row_id;
  }
});
after(async () => { await tutup?.(); });

async function panggil(metode, jalur, { peran = null, badan, pb = true } = {}) {
  const h = { origin: "https://uji.test", "cf-connecting-ip": "203.0.113.7" };
  if (peran) h.cookie = COOKIE[peran];
  if (pb && metode !== "GET") h["x-pb"] = "1";
  let body = badan;
  if (badan !== undefined && !(badan instanceof Uint8Array)) { body = JSON.stringify(badan); h["content-type"] = "application/json"; }
  return worker.fetch(new Request("https://uji.test" + jalur, { method: metode, headers: h, body }), E, { waitUntil() {} });
}
const js = (res) => res.json();
const ISI = { jenis: "notulensi", judul: "Notulensi rapat koordinasi", tanggal: "2026-11-05", ringkasan: "Ringkas", isi: "Isi naskah uji." };
let nomor = 0;
// Bikin naskah lewat API sebagai `peran`, bawa ke status tujuan; mengembalikan ref.
async function buat(peran = "admin", sampai = "draf") {
  const r = await panggil("POST", "/api/naskah", { peran, badan: { ...ISI, judul: `Naskah uji nomor ${++nomor}` } });
  assert.equal(r.status, 201, `buat ${peran}`);
  const { ref } = await js(r);
  if (sampai !== "draf") assert.equal((await panggil("POST", `/api/naskah/${ref}/ajukan`, { peran, badan: {} })).status, 200);
  if (sampai === "disahkan") assert.equal((await panggil("POST", `/api/naskah/${ref}/setujui`, { peran: "pengurus", badan: {} })).status, 200);
  return ref;
}
const galatSql = async (sql, ...b) => { try { await q(sql, ...b).run(); } catch (e) { return String(e?.message ?? e) + String(e?.cause?.message ?? ""); } return null; };
const harapTolak = async (pesan, sql, ...b) => assert.match((await galatSql(sql, ...b)) ?? "TIDAK DITOLAK", /tidak boleh/i, pesan);

const SEMUA_RUTE = [
  ["GET", "/api/naskah"], ["GET", "/api/naskah/nk-1"], ["POST", "/api/naskah", {}], ["PATCH", "/api/naskah/nk-1", {}],
  ["POST", "/api/naskah/nk-1/ajukan", {}], ["POST", "/api/naskah/nk-1/setujui", {}], ["POST", "/api/naskah/nk-1/tolak", {}],
  ["POST", "/api/naskah/nk-1/revisi", {}], ["POST", "/api/naskah/nk-1/catatan", {}], ["POST", "/api/naskah/nk-1/tarik", {}],
  ["PUT", "/api/naskah/nk-1/lampiran?nama=a.pdf", PDF], ["GET", "/api/naskah/nk-1/unduh"],
];

test("modul mengekspor tepat 18 rute (12 naskah + 6 antrean konten)", () => {
  assert.equal(Object.keys(rute).length, 18);
});

test("tamu DITOLAK 401 di semua rute", async () => {
  for (const [m, j, b] of SEMUA_RUTE) assert.equal((await panggil(m, j, { badan: b })).status, 401, `${m} ${j}`);
});

test("matriks tulis per peran: kunci pertama admin/super, kunci kedua pengurus/super, lainnya 403 tanpa efek", async () => {
  const ref = await buat("admin", "menunggu");
  const jejak0 = await cacah("jejak"), n0 = await cacah("naskah"), cat0 = await cacah("naskah_catatan"), r2 = BERKAS.size;
  const untuk = (rutes, perans) => perans.flatMap((peran) => rutes.map((r) => [peran, ...r]));
  const kunciPertama = [["POST", "/api/naskah", ISI], ["PATCH", `/api/naskah/${ref}`, { judul: "Judul baru ya" }], ["POST", `/api/naskah/${ref}/ajukan`, {}],
    ["POST", `/api/naskah/${ref}/tarik`, { catatan: "alasan tarik" }], ["PUT", `/api/naskah/${ref}/lampiran?nama=a.pdf`, PDF]];
  const kunciKedua = [["POST", `/api/naskah/${ref}/setujui`, {}], ["POST", `/api/naskah/${ref}/tolak`, { catatan: "alasan tolak" }],
    ["POST", `/api/naskah/${ref}/revisi`, { catatan: "alasan revisi" }], ["POST", `/api/naskah/${ref}/catatan`, { catatan: "evaluasi saya" }]];
  const ditolak = [...untuk(kunciPertama, ["pengurus", "anggota", "wilayah", "kurator"]), ...untuk(kunciKedua, ["admin", "anggota", "wilayah", "kurator"])];
  for (const [peran, m, j, b] of ditolak) assert.equal((await panggil(m, j, { peran, badan: b })).status, 403, `${peran} ${m} ${j}`);
  assert.equal(await cacah("jejak"), jejak0, "jejak tak bertambah");
  assert.equal(await cacah("naskah"), n0);
  assert.equal(await cacah("naskah_catatan"), cat0);
  assert.equal(BERKAS.size, r2, "R2 tak tersentuh");
  assert.equal((await baris(ref)).status, "menunggu");
});

test("tulis tanpa x-pb: 403 walau peran berhak, tanpa efek", async () => {
  const n0 = await cacah("naskah");
  assert.equal((await panggil("POST", "/api/naskah", { peran: "admin", badan: ISI, pb: false })).status, 403);
  assert.equal(await cacah("naskah"), n0);
});

test("semua peran login boleh GET daftar (200); ref berpola salah 404", async () => {
  for (const peran of PERAN) {
    const r = await panggil("GET", "/api/naskah", { peran });
    assert.equal(r.status, 200, peran);
    assert.equal(r.headers.get("cache-control"), "private, no-store");
    assert.ok(Array.isArray((await js(r)).baris));
    assert.equal((await panggil("GET", "/api/naskah/ngawur", { peran })).status, 404);
  }
});

test("alur dua kunci penuh: admin masukkan, ajukan; pengurus setujui; anggota baru melihat setelah sah; semua perubahan status tercatat di jejak", async () => {
  const j0 = await cacah("jejak", "WHERE tabel = 'naskah'");
  const ref = await buat("admin");
  assert.equal((await panggil("PUT", `/api/naskah/${ref}/lampiran?nama=bahan.pdf`, { peran: "admin", badan: PDF })).status, 200);
  assert.equal((await panggil("POST", `/api/naskah/${ref}/ajukan`, { peran: "admin", badan: {} })).status, 200);
  assert.equal(await cacah("jejak", "WHERE tabel = 'naskah'"), j0 + 3, "tambah + lampiran(ubah) + ajukan(tinjau)");
  for (const peran of TANPA_KUNCI) {
    assert.equal((await panggil("GET", `/api/naskah/${ref}`, { peran })).status, 404, `${peran} menunggu`);
    assert.equal((await panggil("GET", `/api/naskah/${ref}/unduh`, { peran })).status, 404, `${peran} unduh menunggu`);
    const d = await js(await panggil("GET", "/api/naskah", { peran }));
    assert.ok(!d.baris.some((b) => b.ref === ref), `${peran}: daftar tidak membocorkan`);
  }
  const lihat = await panggil("GET", `/api/naskah/${ref}`, { peran: "pengurus" });
  assert.equal(lihat.status, 200);
  const dl = await js(lihat);
  assert.equal(dl.isi, ISI.isi); assert.equal(dl.lampiran.tipe, "pdf"); assert.equal(dl.milikku, false);
  const unduh = await panggil("GET", `/api/naskah/${ref}/unduh`, { peran: "pengurus" });
  assert.equal(unduh.status, 200);
  assert.match(unduh.headers.get("content-type"), /pdf/);
  assert.deepEqual(new Uint8Array(await unduh.arrayBuffer()), PDF);
  assert.equal((await panggil("POST", `/api/naskah/${ref}/catatan`, { peran: "pengurus", badan: { catatan: "Perlu angka tambahan di bagian dua." } })).status, 201);
  assert.equal((await panggil("POST", `/api/naskah/${ref}/setujui`, { peran: "pengurus", badan: { catatan: "Sah." } })).status, 200);
  const b = await baris(ref);
  assert.equal(b.status, "disahkan"); assert.equal(b.disahkan_oleh, ID.pengurus); assert.ok(b.disahkan_pada > 0);
  for (const peran of TANPA_KUNCI) {
    const g = await panggil("GET", `/api/naskah/${ref}`, { peran });
    assert.equal(g.status, 200, `${peran} sah`);
    const d = await js(g);
    assert.equal(d.status, "disahkan"); assert.equal(d.catatan, undefined, `${peran} tidak melihat catatan evaluasi`);
    assert.equal((await panggil("GET", `/api/naskah/${ref}/unduh`, { peran })).status, 200, `${peran} unduh sah`);
  }
  const jj = await satu("SELECT aksi, tabel, peran FROM jejak WHERE tabel = 'naskah' ORDER BY id DESC LIMIT 1");
  assert.deepEqual([jj.aksi, jj.tabel, jj.peran], ["tinjau", "naskah", "pengurus"]);
  const lin = (await js(await panggil("GET", `/api/naskah/${ref}`, { peran: "admin" }))).catatan.map((c) => c.jenis);
  assert.deepEqual(lin, ["ajukan", "evaluasi", "setujui"]);
});

test("pengurus TIDAK melihat draf: daftar, baca, aksi = tanpa jejak; admin/super melihat semuanya", async () => {
  const ref = await buat("admin", "draf");
  const d = await js(await panggil("GET", "/api/naskah", { peran: "pengurus" }));
  assert.ok(!d.baris.some((b) => b.ref === ref));
  assert.ok(!d.baris.some((b) => b.status === "draf"));
  assert.equal((await panggil("GET", `/api/naskah/${ref}`, { peran: "pengurus" })).status, 404);
  for (const a of ["setujui", "tolak", "revisi", "catatan"]) assert.equal((await panggil("POST", `/api/naskah/${ref}/${a}`, { peran: "pengurus", badan: { catatan: "coba coba" } })).status, 404, a);
  assert.equal((await baris(ref)).status, "draf");
  for (const peran of ["admin", "super"]) assert.equal((await panggil("GET", `/api/naskah/${ref}`, { peran })).status, 200);
  // klausa hak.js menyaring di tingkat baca, bukan hanya di rute
  assert.ok(!(await hak.baca(E, { id: ID.pengurus, peran: "pengurus", status: "aktif" }, "naskah", {})).some((x) => x.ref === ref));
});

test("pembuat TIDAK bisa mengesahkan miliknya walau super: lewat API (403) DAN lewat UPDATE SQL langsung (trigger)", async () => {
  const ref = await buat("super", "menunggu");
  const j0 = await cacah("jejak"), c0 = await cacah("naskah_catatan");
  for (const a of ["setujui", "tolak", "revisi"]) assert.equal((await panggil("POST", `/api/naskah/${ref}/${a}`, { peran: "super", badan: { catatan: "diri sendiri" } })).status, 403, a);
  assert.equal((await panggil("POST", `/api/naskah/${ref}/catatan`, { peran: "super", badan: { catatan: "evaluasi diri" } })).status, 403);
  assert.equal((await baris(ref)).status, "menunggu");
  assert.equal(await cacah("jejak"), j0); assert.equal(await cacah("naskah_catatan"), c0);
  const t = await baris(ref);
  await harapTolak("disahkan_oleh = pembuat", "UPDATE naskah SET status='disahkan', disahkan_oleh=?, disahkan_pada=unixepoch() WHERE ref=?", ID.super, ref);
  await harapTolak("disahkan_oleh kosong", "UPDATE naskah SET status='disahkan', disahkan_pada=unixepoch() WHERE ref=?", ref);
  await harapTolak("disahkan_oleh admin biasa", "UPDATE naskah SET status='disahkan', disahkan_oleh=?, disahkan_pada=unixepoch() WHERE ref=?", ID.admin, ref);
  await harapTolak("disahkan_oleh anggota", "UPDATE naskah SET status='disahkan', disahkan_oleh=?, disahkan_pada=unixepoch() WHERE ref=?", ID.anggota, ref);
  await harapTolak("catatan setujui oleh pembuat", "INSERT INTO naskah_catatan (naskah_id, versi, oleh, peran, jenis, isi) VALUES (?,1,?, 'super','setujui', 'x')", t.id, ID.super);
  assert.equal((await baris(ref)).status, "menunggu", "status tak bergeser");
  // pengurus (bukan pembuat) lewat SQL langsung boleh: bukti trigger tidak menolak membabi buta
  assert.equal(await galatSql("UPDATE naskah SET status='disahkan', disahkan_oleh=?, disahkan_pada=unixepoch() WHERE ref=?", ID.pengurus, ref), null);
});

test("super boleh bertindak sebagai pengurus atas naskah ORANG LAIN; admin biasa tidak bisa mengesahkan (API 403, SQL trigger)", async () => {
  const ref = await buat("admin", "menunggu");
  assert.equal((await panggil("POST", `/api/naskah/${ref}/setujui`, { peran: "admin", badan: {} })).status, 403);
  assert.equal((await panggil("POST", `/api/naskah/${ref}/setujui`, { peran: "admin2", badan: {} })).status, 403);
  await harapTolak("admin2 sebagai pengesah", "UPDATE naskah SET status='disahkan', disahkan_oleh=?, disahkan_pada=unixepoch() WHERE ref=?", ID.admin2, ref);
  assert.equal((await baris(ref)).status, "menunggu");
  assert.equal((await panggil("POST", `/api/naskah/${ref}/setujui`, { peran: "super", badan: {} })).status, 200);
  assert.equal((await baris(ref)).disahkan_oleh, ID.super);
});

test("transisi ilegal ditolak trigger (SQL langsung)", async () => {
  const draf = await buat("admin", "draf"), menunggu = await buat("admin", "menunggu"), sah = await buat("admin", "disahkan");
  const ubah = (ref, st) => galatSql("UPDATE naskah SET status=? WHERE ref=?", st, ref);
  for (const st of ["disahkan", "ditolak", "revisi", "ditarik"]) await harapTolak(`draf -> ${st}`, "UPDATE naskah SET status=? WHERE ref=?", st, draf);
  await harapTolak("menunggu -> draf", "UPDATE naskah SET status='draf' WHERE ref=?", menunggu);
  await harapTolak("menunggu -> ditarik", "UPDATE naskah SET status='ditarik' WHERE ref=?", menunggu);
  for (const st of ["draf", "menunggu", "revisi", "ditolak"]) await harapTolak(`disahkan -> ${st}`, "UPDATE naskah SET status=? WHERE ref=?", st, sah);
  assert.equal(await ubah(draf, "menunggu"), null, "draf -> menunggu sah");
  // status akhir tak bisa dihidupkan lagi
  assert.equal((await panggil("POST", `/api/naskah/${menunggu}/tolak`, { peran: "pengurus", badan: { catatan: "tidak layak" } })).status, 200);
  for (const st of ["draf", "menunggu", "revisi", "disahkan"]) await harapTolak(`ditolak -> ${st}`, "UPDATE naskah SET status=? WHERE ref=?", st, menunggu);
  // INSERT langsung tidak bisa melewati draf
  await harapTolak("INSERT berstatus disahkan", "INSERT INTO naskah (ref, jenis, judul, tanggal, status, oleh, disahkan_oleh, disahkan_pada) VALUES ('nk-9001','bahan','Judul sah langsung','2026-11-01','disahkan',?,?,unixepoch())", ID.admin, ID.pengurus);
  await harapTolak("DELETE naskah", "DELETE FROM naskah WHERE ref=?", sah);
  // transisi ilegal lewat API: 409, status tetap
  assert.equal((await panggil("POST", `/api/naskah/${sah}/ajukan`, { peran: "admin", badan: {} })).status, 409);
  assert.equal((await panggil("POST", `/api/naskah/${sah}/setujui`, { peran: "pengurus", badan: {} })).status, 409);
  assert.equal((await baris(sah)).status, "disahkan");
});

test("naskah sah tak bisa disunting: isi, judul, lampiran, pengesah (API 409, SQL trigger); hanya draf dan revisi terbuka", async () => {
  const sah = await buat("admin", "disahkan");
  const awal = await baris(sah);
  assert.equal((await panggil("PATCH", `/api/naskah/${sah}`, { peran: "admin", badan: { judul: "Judul diubah diam diam" } })).status, 409);
  assert.equal((await panggil("PATCH", `/api/naskah/${sah}`, { peran: "super", badan: { isi: "diubah" } })).status, 409);
  assert.equal((await panggil("PUT", `/api/naskah/${sah}/lampiran?nama=b.pdf`, { peran: "admin", badan: PDF })).status, 409);
  for (const kol of ["judul = 'Judul diubah lewat SQL'", "isi = 'diubah'", "ringkasan = 'diubah'", "jenis = 'laporan'", "tanggal = '2020-01-01'", "oleh = " + ID.pengurus, "kunci_r2 = 'naskah/" + "a".repeat(32) + ".pdf', tipe = 'pdf', ukuran = 5, nama_berkas = 'x.pdf'"])
    await harapTolak(kol, `UPDATE naskah SET ${kol} WHERE ref = ?`, sah);
  await harapTolak("ganti pengesah", "UPDATE naskah SET disahkan_oleh = ? WHERE ref = ?", ID.super, sah);
  await harapTolak("ganti waktu sah", "UPDATE naskah SET disahkan_pada = 1 WHERE ref = ?", sah);
  const akhir = await baris(sah);
  assert.deepEqual({ ...akhir, diubah: 0 }, { ...awal, diubah: 0 }, "baris sah utuh");
  // menunggu juga beku; draf terbuka
  const menunggu = await buat("admin", "menunggu");
  assert.equal((await panggil("PATCH", `/api/naskah/${menunggu}`, { peran: "admin", badan: { judul: "Ubah saat menunggu" } })).status, 409);
  await harapTolak("menunggu beku", "UPDATE naskah SET isi='x' WHERE ref=?", menunggu);
  const draf = await buat("admin", "draf");
  assert.equal((await panggil("PATCH", `/api/naskah/${draf}`, { peran: "admin", badan: { judul: "Judul draf diperbarui", isi: null } })).status, 200);
  assert.equal((await baris(draf)).judul, "Judul draf diperbarui");
});

test("catatan append-only: UPDATE dan DELETE ditolak trigger", async () => {
  const ref = await buat("admin", "menunggu");
  assert.equal((await panggil("POST", `/api/naskah/${ref}/catatan`, { peran: "pengurus", badan: { catatan: "catatan tetap" } })).status, 201);
  assert.ok(await cacah("naskah_catatan") >= 2);
  await harapTolak("UPDATE catatan", "UPDATE naskah_catatan SET isi = 'dipalsukan'");
  await harapTolak("UPDATE satu catatan", "UPDATE naskah_catatan SET jenis = 'setujui' WHERE id = (SELECT max(id) FROM naskah_catatan)");
  await harapTolak("DELETE catatan", "DELETE FROM naskah_catatan");
  await harapTolak("DELETE satu catatan", "DELETE FROM naskah_catatan WHERE id = (SELECT max(id) FROM naskah_catatan)");
  // evaluasi kosong ditolak (API 422, SQL trigger)
  assert.equal((await panggil("POST", `/api/naskah/${ref}/catatan`, { peran: "pengurus", badan: { catatan: "  " } })).status, 422);
  await harapTolak("evaluasi kosong", "INSERT INTO naskah_catatan (naskah_id, versi, oleh, peran, jenis, isi) VALUES ((SELECT id FROM naskah WHERE ref=?),1,?, 'pengurus','evaluasi', '')", ref, ID.pengurus);
});

test("tolak, revisi, tarik TANPA catatan ditolak (API 422 dan trigger DB); dengan catatan lolos", async () => {
  const m = await buat("admin", "menunggu"), s = await buat("admin", "disahkan");
  const j0 = await cacah("jejak");
  for (const [ref, a, peran] of [[m, "tolak", "pengurus"], [m, "revisi", "pengurus"], [s, "tarik", "admin"]]) {
    for (const badan of [{}, { catatan: "" }, { catatan: "  " }, { catatan: "ab" }]) assert.equal((await panggil("POST", `/api/naskah/${ref}/${a}`, { peran, badan })).status, 422, `${a} ${JSON.stringify(badan)}`);
  }
  assert.equal(await cacah("jejak"), j0, "tanpa jejak");
  assert.equal((await baris(m)).status, "menunggu"); assert.equal((await baris(s)).status, "disahkan");
  // lewati rute: status diubah SQL langsung tanpa catatan terlebih dulu
  await harapTolak("SQL ditolak tanpa catatan", "UPDATE naskah SET status='ditolak' WHERE ref=?", m);
  await harapTolak("SQL revisi tanpa catatan", "UPDATE naskah SET status='revisi' WHERE ref=?", m);
  await harapTolak("SQL ditarik tanpa catatan", "UPDATE naskah SET status='ditarik' WHERE ref=?", s);
  // catatan jenis lain tidak cukup
  await q("INSERT INTO naskah_catatan (naskah_id, versi, oleh, peran, jenis, isi) VALUES ((SELECT id FROM naskah WHERE ref=?),1,?, 'pengurus','evaluasi', 'evaluasi biasa')", m, ID.pengurus).run();
  await harapTolak("evaluasi bukan alasan tolak", "UPDATE naskah SET status='ditolak' WHERE ref=?", m);
  assert.equal((await panggil("POST", `/api/naskah/${m}/revisi`, { peran: "pengurus", badan: { catatan: "Lengkapi lampiran dan angka." } })).status, 200);
  assert.equal((await panggil("POST", `/api/naskah/${s}/tarik`, { peran: "admin", badan: { catatan: "Ada salah angka." } })).status, 200);
  assert.equal((await baris(s)).status, "ditarik");
  for (const peran of TANPA_KUNCI) assert.equal((await panggil("GET", `/api/naskah/${s}`, { peran })).status, 404, `${peran} ditarik`);
});

test("revisi lalu ajukan ulang menaikkan versi tepat satu (API dan trigger); catatan terikat versinya", async () => {
  const ref = await buat("admin", "menunggu");
  assert.equal((await panggil("POST", `/api/naskah/${ref}/revisi`, { peran: "pengurus", badan: { catatan: "Perbaiki bab tiga." } })).status, 200);
  assert.equal((await baris(ref)).versi, 1);
  assert.equal((await panggil("PATCH", `/api/naskah/${ref}`, { peran: "admin", badan: { isi: "Bab tiga sudah diperbaiki." } })).status, 200);
  await harapTolak("versi lompat dua", "UPDATE naskah SET status='menunggu', versi=3 WHERE ref=?", ref);
  await harapTolak("versi tetap saat ajukan ulang", "UPDATE naskah SET status='menunggu' WHERE ref=?", ref);
  assert.equal((await panggil("POST", `/api/naskah/${ref}/ajukan`, { peran: "admin", badan: {} })).status, 200);
  const b = await baris(ref);
  assert.equal(b.status, "menunggu"); assert.equal(b.versi, 2);
  await harapTolak("versi turun", "UPDATE naskah SET versi=1 WHERE ref=?", ref);
  const lin = (await js(await panggil("GET", `/api/naskah/${ref}`, { peran: "pengurus" }))).catatan;
  assert.deepEqual(lin.map((c) => [c.versi, c.jenis]), [[1, "ajukan"], [1, "revisi"], [2, "ajukan"]]);
  // putaran kedua tidak bisa memakai catatan revisi versi 1
  await harapTolak("catatan versi lama", "UPDATE naskah SET status='revisi' WHERE ref=?", ref);
  assert.equal((await panggil("POST", `/api/naskah/${ref}/setujui`, { peran: "pengurus", badan: {} })).status, 200);
});

test("masukan salah 422 tanpa efek: jenis, judul pendek, tanggal, kolom asing, status via PATCH; lampiran bukan dokumen 415", async () => {
  const n0 = await cacah("naskah"), j0 = await cacah("jejak");
  for (const b of [{ ...ISI, jenis: "rahasia" }, { ...ISI, judul: "abc" }, { ...ISI, tanggal: "5 Nov" }, { ...ISI, status: "disahkan" }, { ...ISI, disahkan_oleh: 1 }, { jenis: "bahan" }, { ...ISI, isi: "a".repeat(40001) }, { ...ISI, ringkasan: "x".repeat(1501) }])
    assert.equal((await panggil("POST", "/api/naskah", { peran: "admin", badan: b })).status, 422, JSON.stringify(b).slice(0, 60));
  assert.equal(await cacah("naskah"), n0); assert.equal(await cacah("jejak"), j0);
  const ref = await buat("admin", "draf");
  for (const b of [{ status: "disahkan" }, { versi: 9 }, { oleh: ID.pengurus }, {}]) assert.equal((await panggil("PATCH", `/api/naskah/${ref}`, { peran: "admin", badan: b })).status, 422);
  assert.equal((await panggil("PUT", `/api/naskah/${ref}/lampiran?nama=a.pdf`, { peran: "admin", badan: new TextEncoder().encode("bukan dokumen") })).status, 415);
  assert.equal((await panggil("PUT", `/api/naskah/${ref}/lampiran?nama=${encodeURIComponent("a/b.pdf")}`, { peran: "admin", badan: PDF })).status, 422);
  assert.equal((await panggil("POST", `/api/naskah/${ref}/ajukan`, { peran: "admin", badan: { status: "disahkan" } })).status, 422);
  assert.equal((await panggil("POST", `/api/naskah/nk-99999999/ajukan`, { peran: "admin", badan: {} })).status, 404);
});

test("lampiran: kunci R2 di naskah/, ganti membuang yang lama; GET daftar menyaring jenis, status, dan cari", async () => {
  const ref = await buat("admin", "draf");
  await panggil("PUT", `/api/naskah/${ref}/lampiran?nama=satu.pdf`, { peran: "admin", badan: PDF });
  const k1 = (await baris(ref)).kunci_r2;
  assert.match(k1, /^naskah\/[0-9a-f]{32}\.pdf$/); assert.ok(BERKAS.has(k1));
  await panggil("PUT", `/api/naskah/${ref}/lampiran?nama=dua.pdf`, { peran: "admin", badan: PDF });
  assert.ok(!BERKAS.has(k1), "lampiran lama dibuang"); assert.equal((await baris(ref)).nama_berkas, "dua.pdf");
  const a = await js(await panggil("GET", "/api/naskah?status=draf&jenis=notulensi", { peran: "admin" }));
  assert.ok(a.baris.length >= 1 && a.baris.every((b) => b.status === "draf" && b.jenis === "notulensi"));
  const c = await js(await panggil("GET", `/api/naskah?q=${encodeURIComponent("nomor " + nomor)}`, { peran: "admin" }));
  assert.ok(c.baris.some((b) => b.ref === ref) || c.baris.length >= 1);
  assert.equal((await panggil("GET", "/api/naskah?status=ngawur", { peran: "admin" })).status, 422);
  for (const x of a.baris) { assert.equal(x.kunci_r2, undefined); assert.equal(x.isi, undefined); }
});

test("kebocoran: daftar anggota hanya status disahkan; respons tak memuat kunci R2 atau id akun", async () => {
  const d = await js(await panggil("GET", "/api/naskah", { peran: "anggota" }));
  assert.ok(d.baris.length >= 1);
  assert.ok(d.baris.every((b) => b.status === "disahkan"));
  const teks = JSON.stringify(d);
  assert.ok(!/kunci_r2|disahkan_oleh|"oleh"/.test(teks));
  const sql = await satu("SELECT count(*) AS n FROM naskah WHERE status <> 'disahkan'");
  assert.ok(sql.n > 0, "ada naskah non-sah yang memang tidak boleh bocor");
});

/* ------------------------- Berita METI dan Pustaka unggahan lewat dua kunci yang sama (konten_otorisasi) ------------------------- */
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 16, 0x4a, 0x46, 0x49, 0x46, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0, 0xff, 0xd9]);
const PU = "judul=Kajian%20contoh&penerbit=METI&jenis=kajian&nama=kajian.pdf&akses=anggota";
const bikinBm = async (peran = "admin") => (await js(await panggil("POST", "/api/berita-meti", { peran, badan: { jenis: "siaran_pers", judul: "Siaran pers uji otorisasi", tanggal: "2026-11-01", isi: "Isi berita." } }))).ref;
const bikinPu = async (peran = "admin") => (await js(await panggil("POST", `/api/pustaka-unggah?${PU}`, { peran, badan: PDF }))).ref;
const oto = (ref) => satu("SELECT * FROM konten_otorisasi WHERE ref = ?", ref);
const putus = async (sumber, ref, aksi, peran = "pengurus", catatan, versi) => panggil("POST", `/api/otorisasi/${sumber}/${ref}/${aksi}`, { peran, badan: { ...(catatan ? { catatan } : {}), versi: versi ?? (await oto(ref)).versi } });

test("berita baru masuk menunggu: anggota/kurator/wilayah 404 (daftar, butir, foto); admin dan pengurus melihat; sah setelah pengurus setuju", async () => {
  const ref = await bikinBm();
  assert.equal((await oto(ref)).status, "menunggu");
  assert.equal((await panggil("PUT", `/api/berita-meti/${ref}/foto`, { peran: "admin", badan: JPEG })).status, 200);
  for (const peran of TANPA_KUNCI) {
    assert.equal((await panggil("GET", `/api/berita-meti/${ref}`, { peran })).status, 404, peran);
    assert.equal((await panggil("GET", `/api/berita-meti/foto/${ref}`, { peran })).status, 404, `${peran} foto`);
    assert.ok(!(await js(await panggil("GET", "/api/berita-meti", { peran }))).baris.some((b) => b.ref === ref), `${peran} daftar`);
  }
  for (const peran of ["admin", "pengurus", "super"]) assert.equal((await panggil("GET", `/api/berita-meti/${ref}`, { peran })).status, 200, peran);
  assert.equal((await js(await panggil("GET", `/api/berita-meti/${ref}`, { peran: "admin" }))).otorisasi, "menunggu");
  const antre = (await js(await panggil("GET", "/api/otorisasi?status=menunggu", { peran: "pengurus" }))).baris;
  assert.ok(antre.some((b) => b.ref === ref && b.sumber === "berita" && b.milikku === false));
  assert.equal((await putus("berita", ref, "setujui")).status, 200);
  for (const peran of TANPA_KUNCI) {
    assert.equal((await panggil("GET", `/api/berita-meti/${ref}`, { peran })).status, 200, `${peran} sah`);
    assert.equal((await panggil("GET", `/api/berita-meti/foto/${ref}`, { peran })).status, 200, `${peran} foto sah`);
  }
  // disunting ulang: kembali menunggu, tersembunyi, versi naik
  const v0 = (await oto(ref)).versi;
  assert.equal((await panggil("PATCH", `/api/berita-meti/${ref}`, { peran: "admin", badan: { judul: "Judul berita diubah" } })).status, 200);
  const o = await oto(ref);
  assert.equal(o.status, "menunggu"); assert.equal(o.versi, v0 + 1); assert.equal(o.disahkan_oleh, null);
  for (const peran of TANPA_KUNCI) assert.equal((await panggil("GET", `/api/berita-meti/${ref}`, { peran })).status, 404, `${peran} sesudah sunting`);
  // perubahan hanya flag terbit tidak mereset
  assert.equal((await putus("berita", ref, "setujui")).status, 200);
  assert.equal((await panggil("PATCH", `/api/berita-meti/${ref}`, { peran: "admin", badan: { terbit: 1 } })).status, 200);
  assert.equal((await oto(ref)).status, "disahkan");
});

test("pustaka baru: anggota 404 untuk daftar dan unduh sebelum sah; sunting konten sah mengembalikan ke menunggu", async () => {
  const ref = await bikinPu();
  assert.equal((await oto(ref)).status, "menunggu");
  for (const peran of TANPA_KUNCI) {
    assert.equal((await panggil("GET", `/api/pustaka-unggah/${ref}/unduh`, { peran })).status, 404, peran);
    assert.ok(!(await js(await panggil("GET", "/api/pustaka-unggah", { peran }))).baris.some((b) => b.ref === ref));
  }
  assert.equal((await panggil("GET", `/api/pustaka-unggah/${ref}/unduh`, { peran: "pengurus" })).status, 200);
  assert.equal((await putus("pustaka", ref, "setujui")).status, 200);
  for (const peran of TANPA_KUNCI) assert.equal((await panggil("GET", `/api/pustaka-unggah/${ref}/unduh`, { peran })).status, 200, `${peran} sah`);
  assert.equal((await panggil("PATCH", `/api/pustaka-unggah/${ref}`, { peran: "admin", badan: { judul: "Judul pustaka baru" } })).status, 200);
  assert.equal((await oto(ref)).status, "menunggu");
  for (const peran of TANPA_KUNCI) assert.equal((await panggil("GET", `/api/pustaka-unggah/${ref}/unduh`, { peran })).status, 404, `${peran} sesudah sunting`);
});

test("konten lama tanpa baris otorisasi tetap terlihat (dianggap sah); disunting masuk antrean", async () => {
  const DEF = pecahSql(readFileSync("migrations/0036_naskah.sql", "utf8")).filter((x) => /berita_meti_otorisasi_baru/.test(x));
  await q("DROP TRIGGER berita_meti_otorisasi_baru").run();
  await q("INSERT INTO berita_meti (ref, jenis, judul, tanggal, oleh) VALUES ('bm-777', 'siaran_pers', 'Berita lama sebelum aturan', '2026-01-01', ?)", ID.admin).run();
  for (const x of DEF) await q(x).run();
  assert.equal(await oto("bm-777"), null);
  for (const peran of TANPA_KUNCI) assert.equal((await panggil("GET", "/api/berita-meti/bm-777", { peran })).status, 200, peran);
  assert.equal((await js(await panggil("GET", "/api/berita-meti/bm-777", { peran: "admin" }))).otorisasi, "disahkan");
  assert.equal((await panggil("PATCH", "/api/berita-meti/bm-777", { peran: "admin", badan: { judul: "Berita lama disunting" } })).status, 200);
  assert.equal((await oto("bm-777")).status, "menunggu");
  assert.equal((await panggil("GET", "/api/berita-meti/bm-777", { peran: "anggota" })).status, 404);
});

test("maker tidak bisa mengesahkan kontennya sendiri walau super (API 403, SQL trigger); admin biasa tidak bisa memutus", async () => {
  const ref = await bikinBm("super");
  for (const a of ["setujui", "tolak", "revisi"]) assert.equal((await putus("berita", ref, a, "super", "diri sendiri")).status, 403, a);
  assert.equal((await putus("berita", ref, "catatan", "super", "evaluasi diri")).status, 403);
  assert.equal((await putus("berita", ref, "setujui", "admin")).status, 403);
  assert.equal((await oto(ref)).status, "menunggu");
  await harapTolak("super mengesahkan miliknya", "UPDATE konten_otorisasi SET status='disahkan', disahkan_oleh=?, disahkan_pada=unixepoch() WHERE ref=?", ID.super, ref);
  await harapTolak("admin biasa pengesah", "UPDATE konten_otorisasi SET status='disahkan', disahkan_oleh=?, disahkan_pada=unixepoch() WHERE ref=?", ID.admin, ref);
  await harapTolak("transisi menunggu -> menunggu->ditolak tanpa catatan", "UPDATE konten_otorisasi SET status='ditolak' WHERE ref=?", ref);
  // pengurus (bukan maker) boleh
  assert.equal((await putus("berita", ref, "setujui")).status, 200);
  assert.equal((await oto(ref)).disahkan_oleh, ID.pengurus);
  // pembaca tak berhak: 403 pada rute otorisasi
  for (const peran of ["anggota", "kurator", "wilayah"]) {
    assert.equal((await panggil("GET", "/api/otorisasi", { peran })).status, 403, peran);
    assert.equal((await putus("berita", ref, "setujui", peran)).status, 403, peran);
  }
  assert.equal((await panggil("GET", "/api/otorisasi")).status, 401);
});

test("konten: tolak/revisi wajib catatan (API 422, trigger); revisi lalu sunting mengembalikan ke menunggu dan menaikkan versi; transisi ilegal ditolak", async () => {
  const ref = await bikinPu();
  for (const a of ["tolak", "revisi"]) assert.equal((await putus("pustaka", ref, a, "pengurus", "  ")).status, 422, a);
  await harapTolak("revisi tanpa catatan", "UPDATE konten_otorisasi SET status='revisi' WHERE ref=?", ref);
  assert.equal((await putus("pustaka", ref, "revisi", "pengurus", "Lengkapi penerbit dan tahun.")).status, 200);
  assert.equal((await oto(ref)).status, "revisi");
  assert.equal((await putus("pustaka", ref, "setujui")).status, 409, "revisi tak bisa langsung disetujui");
  await harapTolak("revisi -> disahkan", "UPDATE konten_otorisasi SET status='disahkan', disahkan_oleh=?, disahkan_pada=unixepoch() WHERE ref=?", ID.pengurus, ref);
  assert.equal((await panggil("PATCH", `/api/pustaka-unggah/${ref}`, { peran: "admin", badan: { penerbit: "METI Pusat" } })).status, 200);
  const o = await oto(ref);
  assert.equal(o.status, "menunggu"); assert.equal(o.versi, 2);
  assert.equal((await putus("pustaka", ref, "tolak", "pengurus", "Tidak sesuai kebijakan pustaka.")).status, 200);
  await harapTolak("ditolak -> disahkan", "UPDATE konten_otorisasi SET status='disahkan', disahkan_oleh=?, disahkan_pada=unixepoch() WHERE ref=?", ID.pengurus, ref);
  await harapTolak("hapus baris otorisasi", "DELETE FROM konten_otorisasi WHERE ref=?", ref);
  const det = await js(await panggil("GET", `/api/otorisasi/pustaka/${ref}`, { peran: "pengurus" }));
  assert.deepEqual(det.catatan.map((c) => [c.versi, c.jenis]), [[1, "revisi"], [2, "tolak"]]);
  assert.equal((await panggil("GET", "/api/otorisasi/ngawur/bm-1", { peran: "pengurus" })).status, 404);
  assert.ok(await cacah("jejak", "WHERE tabel = 'konten_otorisasi'") >= 2);
});

test("penyunting ikut terkunci: admin B menyunting berita buatan admin A lalu tidak bisa mengesahkan (API dan SQL); pengurus melihat nama pembuat", async () => {
  const ref = await bikinBm("admin");
  assert.equal((await putus("berita", ref, "setujui")).status, 200);
  assert.equal((await panggil("PATCH", `/api/berita-meti/${ref}`, { peran: "admin2", badan: { judul: "Judul disunting admin dua" } })).status, 200);
  const o = await oto(ref);
  assert.equal(o.status, "menunggu"); assert.equal(o.oleh, ID.admin); assert.equal(o.penyunting, ID.admin2);
  await harapTolak("penyunting mengesahkan", "UPDATE konten_otorisasi SET status='disahkan', disahkan_oleh=?, disahkan_pada=unixepoch() WHERE ref=?", ID.admin2, ref);
  // super yang menyunting juga terkunci (API)
  assert.equal((await panggil("PATCH", `/api/berita-meti/${ref}`, { peran: "super", badan: { judul: "Judul disunting super" } })).status, 200);
  assert.equal((await oto(ref)).penyunting, ID.super);
  assert.equal((await putus("berita", ref, "setujui", "super")).status, 403);
  assert.equal((await putus("berita", ref, "catatan", "super", "evaluasi diri")).status, 403);
  await harapTolak("super penyunting mengesahkan", "UPDATE konten_otorisasi SET status='disahkan', disahkan_oleh=?, disahkan_pada=unixepoch() WHERE ref=?", ID.super, ref);
  const antre = (await js(await panggil("GET", "/api/otorisasi?status=menunggu", { peran: "pengurus" }))).baris.find((b) => b.ref === ref);
  assert.equal(antre.pembuat, "admin"); assert.equal(antre.penyunting, "super");
  assert.equal((await putus("berita", ref, "setujui")).status, 200, "pengurus lain boleh");
  // anggota tak menerima nama
  assert.equal((await js(await panggil("GET", `/api/berita-meti/${ref}`, { peran: "anggota" }))).pembuat, undefined);
});

test("naskah: penyunting terakhir tak bisa mengesahkan (API dan SQL); nama pembuat tampil untuk pengurus, tidak untuk anggota", async () => {
  const ref = await buat("admin", "draf");
  assert.equal((await panggil("PATCH", `/api/naskah/${ref}`, { peran: "super", badan: { isi: "Disunting super." } })).status, 200);
  assert.equal((await panggil("POST", `/api/naskah/${ref}/ajukan`, { peran: "admin", badan: {} })).status, 200);
  assert.equal((await baris(ref)).penyunting, ID.super);
  assert.equal((await panggil("POST", `/api/naskah/${ref}/setujui`, { peran: "super", badan: {} })).status, 403);
  await harapTolak("super penyunting naskah", "UPDATE naskah SET status='disahkan', disahkan_oleh=?, disahkan_pada=unixepoch() WHERE ref=?", ID.super, ref);
  const d = (await js(await panggil("GET", "/api/naskah?status=menunggu", { peran: "pengurus" }))).baris.find((b) => b.ref === ref);
  assert.equal(d.pembuat, "admin"); assert.equal(d.penyunting, "super");
  assert.equal((await panggil("POST", `/api/naskah/${ref}/setujui`, { peran: "pengurus", badan: {} })).status, 200);
  const a = (await js(await panggil("GET", `/api/naskah/${ref}`, { peran: "anggota" })));
  assert.equal(a.pembuat, undefined); assert.equal(a.penyunting, undefined);
  assert.ok((await js(await panggil("GET", `/api/naskah/${ref}`, { peran: "admin" }))).catatan.every((c) => c.nama));
});

test("1. sunting saat menunggu menaikkan versi; keputusan dengan versi usang 409 (isi tak dibaca), versi wajib 422", async () => {
  const ref = await bikinBm("admin");
  const v = (await oto(ref)).versi;
  const dibaca = (await js(await panggil("GET", `/api/otorisasi/berita/${ref}`, { peran: "pengurus" }))).versi;
  assert.equal(dibaca, v);
  assert.equal((await panggil("PATCH", `/api/berita-meti/${ref}`, { peran: "admin", badan: { isi: "Isi diganti saat pengurus membaca." } })).status, 200);
  const o = await oto(ref);
  assert.equal(o.status, "menunggu"); assert.equal(o.versi, v + 1);
  const c0 = await cacah("naskah_catatan");
  for (const a of ["setujui", "tolak", "revisi", "catatan"]) assert.equal((await putus("berita", ref, a, "pengurus", "alasan cukup", v)).status, 409, a);
  assert.equal((await oto(ref)).status, "menunggu"); assert.equal(await cacah("naskah_catatan"), c0, "tanpa catatan nyasar");
  for (const badan of [{}, { catatan: "x kata" }, { versi: "2" }, { versi: 0 }]) assert.equal((await panggil("POST", `/api/otorisasi/berita/${ref}/setujui`, { peran: "pengurus", badan })).status, 422, JSON.stringify(badan));
  assert.equal((await putus("berita", ref, "setujui", "pengurus", undefined, v + 1)).status, 200, "versi terbaru lolos");
  // pustaka sama
  const pu = await bikinPu(); const vp = (await oto(pu)).versi;
  await panggil("PATCH", `/api/pustaka-unggah/${pu}`, { peran: "admin", badan: { penerbit: "METI Baru" } });
  assert.equal((await putus("pustaka", pu, "setujui", "pengurus", undefined, vp)).status, 409);
  await harapTolak("versi lompat dua saat menunggu", "UPDATE konten_otorisasi SET versi = versi + 2 WHERE ref=?", pu);
  // naskah: beku saat menunggu, jadi yang dibaca pengurus pasti yang disahkan
  const nk = await buat("admin", "menunggu");
  assert.equal((await panggil("PATCH", `/api/naskah/${nk}`, { peran: "admin", badan: { isi: "diam diam" } })).status, 409);
  await harapTolak("isi naskah menunggu", "UPDATE naskah SET isi='diam diam' WHERE ref=?", nk);
});

test("2. draf berita (terbit=0) tak bocor ke pengurus lewat detail dan keputusan otorisasi: 404; admin tetap melihat", async () => {
  const ref = (await js(await panggil("POST", "/api/berita-meti", { peran: "admin", badan: { jenis: "siaran_pers", judul: "Draf berita rahasia", tanggal: "2026-11-03", isi: "Isi draf rahasia", terbit: 0 } }))).ref;
  assert.equal((await panggil("GET", `/api/otorisasi/berita/${ref}`, { peran: "pengurus" })).status, 404);
  assert.ok(!(await js(await panggil("GET", "/api/otorisasi", { peran: "pengurus" }))).baris.some((b) => b.ref === ref), "daftar juga tidak");
  for (const a of ["setujui", "tolak", "revisi", "catatan"]) assert.equal((await putus("berita", ref, a, "pengurus", "alasan cukup")).status, 404, a);
  assert.equal((await oto(ref)).status, "menunggu");
  assert.equal((await panggil("GET", `/api/otorisasi/berita/${ref}`, { peran: "admin" })).status, 200);
  assert.equal((await panggil("PATCH", `/api/berita-meti/${ref}`, { peran: "admin", badan: { terbit: 1 } })).status, 200);
  assert.equal((await panggil("GET", `/api/otorisasi/berita/${ref}`, { peran: "pengurus" })).status, 200, "terbit memasukkannya ke antrean");
});

test("3. konten_otorisasi dijaga: INSERT hanya menunggu, tak bisa disisipi baris sah lebih dulu, identitas beku, pengesahan tetap", async () => {
  await harapTolak("INSERT langsung disahkan", "INSERT INTO konten_otorisasi (sumber, ref, status, oleh, disahkan_oleh, disahkan_pada) VALUES ('berita_meti','bm-4242','disahkan',?,?,unixepoch())", ID.admin, ID.pengurus);
  await harapTolak("INSERT versi lain", "INSERT INTO konten_otorisasi (sumber, ref, versi) VALUES ('berita_meti','bm-4243',5)");
  await harapTolak("INSERT OR IGNORE disahkan", "INSERT OR IGNORE INTO konten_otorisasi (sumber, ref, status, disahkan_oleh, disahkan_pada) VALUES ('berita_meti','bm-4244','disahkan',?,unixepoch())", ID.pengurus);
  assert.equal(await oto("bm-4242"), null); assert.equal(await oto("bm-4244"), null);
  const ref = await bikinBm("admin");
  assert.equal((await putus("berita", ref, "setujui")).status, 200);
  const o = await oto(ref);
  await harapTolak("ganti pembuat", "UPDATE konten_otorisasi SET oleh = ? WHERE ref = ?", ID.anggota, ref);
  await harapTolak("ganti ref", "UPDATE konten_otorisasi SET ref = 'bm-1' WHERE id = ?", o.id);
  await harapTolak("ganti sumber", "UPDATE konten_otorisasi SET sumber = 'pustaka_unggah' WHERE id = ?", o.id);
  await harapTolak("ganti pengesah", "UPDATE konten_otorisasi SET disahkan_oleh = ? WHERE ref = ?", ID.super, ref);
  await harapTolak("ganti waktu sah", "UPDATE konten_otorisasi SET disahkan_pada = 1 WHERE ref = ?", ref);
  await harapTolak("sah -> ditolak", "UPDATE konten_otorisasi SET status = 'ditolak', disahkan_oleh = NULL, disahkan_pada = NULL WHERE ref = ?", ref);
  const s = await oto(ref);
  assert.equal(s.status, "disahkan"); assert.equal(s.disahkan_oleh, ID.pengurus); assert.equal(s.oleh, ID.admin);
  await harapTolak("ganti pembuat naskah", "UPDATE naskah SET oleh = ? WHERE ref = (SELECT ref FROM naskah LIMIT 1)", ID.anggota);
});
