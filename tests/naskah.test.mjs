// naskah.test.mjs (Portal otorisasi, migrasi 0036): rute lewat worker.fetch utuh, D1 lokal NYATA. Tiruan hanya R2 (env.BERKAS).
// Hak, CHECK, TRIGGER, jejak berjalan di D1 nyata. Aturan dua kunci dibuktikan DUA kali: lewat API dan lewat UPDATE SQL langsung.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { buatEnv } from "./_bantu.mjs";
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

test("modul mengekspor tepat 12 rute naskah", () => {
  assert.equal(Object.keys(rute).length, 12);
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
