// konsultasi.test.mjs (migrasi 0024): forum diskusi naskah. Rute lewat worker.fetch utuh, D1 lokal NYATA; tiruan hanya R2 dan ASSETS.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import zlib from "node:zlib";
import { buatEnv, pecahSql } from "./_bantu.mjs";
import worker from "../src/worker.js";
import { rute, sniffNaskah } from "../src/konsultasi.js";
import * as hak from "../src/hak.js";
import { sha } from "../src/util.js";
import { buatDocx, crc32 } from "../src/docx.js";
import { bersihTeks, pecahNaskah, cariJangkar, segmen, terapkanUsulan, susunRekap } from "../public/inti/naskah.js";

const BERKAS = new Map();
const R2 = { put: async (k, v) => { BERKAS.set(k, new Uint8Array(await new Response(v).arrayBuffer())); }, get: async (k) => (BERKAS.has(k) ? { body: BERKAS.get(k) } : null), delete: async (k) => { BERKAS.delete(k); } };
const PERAN = ["anggota", "anggota2", "pengurus", "kurator", "wilayah", "admin", "super"];
let E, tutup;
const COOKIE = {}, ID = {};
const q = (s, ...b) => E.DB.prepare(s).bind(...b);
const satu = (s, ...b) => q(s, ...b).first();
const cacah = async (t, w = "") => (await satu(`SELECT count(*) AS n FROM ${t} ${w}`)).n;

before(async () => {
  ({ env: E, tutup } = await buatEnv());
  E.BERKAS = R2;
  for (const [i, nama] of PERAN.entries()) {
    const peran = nama.replace("2", "");
    const r = await q("INSERT INTO akun (surel, nama, peran, cakupan_prov, status, garam, sandi, iterasi) VALUES (?,?,?,?, 'aktif', ?, ?, 100000)", `${nama}@uji.test`, `Orang ${nama}`, peran, peran === "wilayah" ? "31" : null, "a".repeat(32), "a".repeat(64)).run();
    const token = (i + 16).toString(16).repeat(32);
    await hak.catatSesi(E, { idHash: await sha(token), akunId: r.meta.last_row_id, peran, sampai: Math.floor(Date.now() / 1000) + 3600, ipHash: "h" });
    COOKIE[nama] = `sesi=${token}`; ID[nama] = r.meta.last_row_id;
  }
  await q("INSERT INTO akun (surel, nama, peran, status, garam, sandi, iterasi) VALUES ('mati@uji.test','Orang nonaktif','anggota','nonaktif',?,?,100000)", "a".repeat(32), "a".repeat(64)).run();
  ID.mati = (await satu("SELECT id FROM akun WHERE surel = 'mati@uji.test'")).id;
});
after(async () => { await tutup?.(); });

async function panggil(metode, jalur, { peran = null, badan, header = {} } = {}) {
  const h = { origin: "https://uji.test", "cf-connecting-ip": "203.0.113.7", "x-pb": "1", ...header };
  if (peran) h.cookie = COOKIE[peran];
  let body = badan;
  if (badan !== undefined && !(badan instanceof Uint8Array) && !(badan instanceof FormData)) { body = JSON.stringify(badan); h["content-type"] = "application/json"; }
  return worker.fetch(new Request("https://uji.test" + jalur, { method: metode, headers: h, body }), E, { waitUntil() {} });
}

/* ---------------------------------------------- murni ---------------------------------------------- */
test("bersihTeks: tanpa HTML, kontrol, dan terpotong", () => {
  assert.equal(bersihTeks("halo <script>alert(1)</script> dunia<b>"), "halo alert(1) dunia");
  assert.equal(bersihTeks("a\u0000b\r\nc"), "ab\nc");
  assert.equal(bersihTeks("x".repeat(50), 10).length, 10);
  assert.ok(!/[<>]/.test(bersihTeks("1 < 2 > 0")));
});
const NASKAH = `RANCANGAN UNDANG-UNDANG\nMenimbang: bahwa...\nBAB I\nKETENTUAN UMUM\nPasal 1\nDalam Undang-Undang ini yang dimaksud dengan:\n1. Energi Baru adalah energi.\n2. Energi Terbarukan adalah energi lain.\nPasal 2\n(1) Pengelolaan energi berdasarkan asas manfaat\ndan keadilan.\n(2) Pengelolaan dilakukan oleh Pemerintah.\nBAB II\nPERENCANAAN\nPasal 3\nRencana disusun setiap lima tahun.`;
test("pecahNaskah: bab, pasal, ayat; konsiderans diabaikan; baris patah disambung", () => {
  const h = pecahNaskah(NASKAH);
  assert.deepEqual(h.map((x) => [x.tingkat, x.nomor]), [["bab", "I"], ["pasal", "1"], ["pasal", "2"], ["ayat", "(1)"], ["ayat", "(2)"], ["bab", "II"], ["pasal", "3"]]);
  assert.equal(h[0].judul, "KETENTUAN UMUM");
  assert.match(h[1].teks, /yang dimaksud dengan:\n1\. Energi Baru/);
  assert.equal(h[3].teks, "Pengelolaan energi berdasarkan asas manfaat dan keadilan.");
  assert.ok(!h.some((x) => /Menimbang/.test(x.teks)));
});
test("jangkar tahan perubahan teks; segmen track changes; terapkanUsulan", () => {
  const teks = "Pemerintah wajib membeli listrik dari pembangkit EBT.";
  const k = { kutipan: "wajib membeli", mulai: 11, akhir: 24 };
  assert.deepEqual(cariJangkar(teks, k), [11, 24]);
  assert.deepEqual(cariJangkar("Bahwa Pemerintah wajib membeli listrik.", k), [17, 30]); // geser: cari ulang
  assert.equal(cariJangkar("kalimat lain", k), null);
  const uc = { id: 1, jenis: "coret", status: "terbuka", ...k }, ub = { id: 2, jenis: "ubah", status: "terbuka", kutipan: "EBT", mulai: 49, akhir: 52, teks_ganti: "energi terbarukan" };
  const seg = segmen(teks, [uc, ub]);
  assert.equal(seg.map((s) => s.t).join(""), teks);
  assert.deepEqual(seg.filter((s) => s.kelas).map((s) => [s.kelas, s.utas]), [["coret", 1], ["coret", 2]]);
  assert.equal(seg.find((s) => s.utas === 2).baru, "energi terbarukan");
  assert.equal(segmen(teks, [{ ...uc, status: "ditolak" }]).length, 1);
  const hasil = terapkanUsulan(teks, [{ ...uc, status: "diterima" }, { ...ub }]);
  assert.equal(hasil.teks, "Pemerintah listrik dari pembangkit energi terbarukan.");
  const tambah = terapkanUsulan("A dan B.", [{ id: 3, jenis: "tambah", kutipan: "A", mulai: 0, akhir: 1, teks_ganti: "serta C", sisip: "sesudah" }]);
  assert.equal(tambah.teks, "A serta C dan B.");
});
test("susunRekap: butir semua muncul, butir baru di akhir; naskah hanya yang berubah", () => {
  const bagian = [{ id: 1, tingkat: "butir", nomor: "1", judul: "T1", teks: "Posisi satu.", rujukan: "Ps 1", status_asal: "Prioritas" }, { id: 2, tingkat: "butir", nomor: "2", judul: "T2", teks: "Posisi dua.", rujukan: "Ps 2" }];
  const diterima = [{ id: 9, bagian_id: 1, jenis: "ubah", kutipan: "satu", mulai: 8, akhir: 12, teks_ganti: "pertama", isi: "lebih jelas", putusan: "setuju" }, { id: 10, bagian_id: null, jenis: "butir_baru", kutipan: "Baru", teks_ganti: "Isi baru", isi: "perlu" }];
  const r = susunRekap({ dokumen: { bentuk: "butir" }, bagian, diterima });
  assert.equal(r.length, 3);
  assert.equal(r[0].usulan, "Posisi pertama."); assert.match(r[0].alasan, /lebih jelas \(catatan pengurus: setuju\)/);
  assert.equal(r[1].berubah, false); assert.equal(r[2].baru, true);
  assert.equal(susunRekap({ dokumen: { bentuk: "naskah" }, bagian: [{ id: 1, tingkat: "pasal", nomor: "1", teks: "x" }], diterima: [] }).length, 0);
});
test("docx: zip utuh (CRC cocok, bisa dibaca zlib), XML lolos escape", () => {
  const b = buatDocx({ judul: "A & B <x>", kolom: [{ judul: "K", lebar: 3000 }], baris: [["isi <script>"]] });
  assert.deepEqual([...b.subarray(0, 4)], [0x50, 0x4b, 3, 4]);
  let p = 0, n = 0;
  while (b[p] === 0x50 && b[p + 1] === 0x4b && b[p + 2] === 3) {
    const dv = new DataView(b.buffer, b.byteOffset + p), uk = dv.getUint32(22, true), pn = dv.getUint16(26, true), crc = dv.getUint32(14, true);
    const isi = b.subarray(p + 30 + pn, p + 30 + pn + uk);
    assert.equal(crc32(isi), crc); assert.equal(zlib.crc32(isi), crc);
    if (new TextDecoder().decode(b.subarray(p + 30, p + 30 + pn)) === "word/document.xml") assert.ok(!/<script>/.test(new TextDecoder().decode(isi)) && /isi &lt;script&gt;/.test(new TextDecoder().decode(isi)));
    p += 30 + pn + uk; n++;
  }
  assert.equal(n, 3);
});
test("sniffNaskah: PDF, DOCX, teks; biner lain ditolak", () => {
  assert.equal(sniffNaskah(new TextEncoder().encode("%PDF-1.7 ...")), "application/pdf");
  assert.equal(sniffNaskah(new TextEncoder().encode("Pasal 1 teks biasa")), "text/plain");
  assert.equal(sniffNaskah(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0, 0])), null);
  assert.equal(sniffNaskah(buatDocx({ judul: "x", kolom: [{ judul: "k", lebar: 100 }], baris: [] })), "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
});

/* ---------------------------------------------- migrasi + hak ---------------------------------------------- */
test("migrasi 0024 idempoten dan memuat dua dokumen awal tanpa isi; RUU EBET tanpa naskah", async () => {
  for (const s of pecahSql(readFileSync("migrations/0024_konsultasi.sql", "utf8"))) await E.DB.prepare(s).run();
  const d = (await q("SELECT id, status, bentuk FROM kons_dokumen ORDER BY id").all()).results;
  assert.deepEqual(d.map((x) => [x.id, x.status, x.bentuk]), [["masukan-meti-ruu-ebet", "draf", "butir"], ["ruu-ebet", "terbit", "naskah"]]);
  assert.equal(await cacah("kons_bagian"), 0);
});
test("matriks: tamu tidak boleh apa pun; anggota aktif boleh; putus hanya pengurus ke atas", () => {
  for (const a of ["baca", "tambah", "ubah"]) assert.equal(hak.boleh("publik", a, "konsultasi").ok, false);
  for (const p of ["anggota", "pengurus", "kurator", "wilayah", "admin", "super"]) assert.equal(hak.boleh(p, "tambah", "konsultasi", undefined, { peran: p, status: "aktif" }).ok, true, p);
  assert.equal(hak.boleh("anggota", "tambah", "konsultasi", undefined, { peran: "anggota", status: "nonaktif" }).ok, false);
  for (const [p, ok] of [["anggota", false], ["wilayah", false], ["pengurus", true], ["kurator", true], ["admin", true], ["super", true]]) assert.equal(hak.boleh(p, "ubah", "konsultasi_putus", undefined, { peran: p }).ok, ok, p);
});
test("seed Masukan METI: 22 butir, tanpa butir 23+, hanya di D1 (bukan public/data)", async () => {
  const sql = readFileSync("data/konsultasi/seed_masukan_meti.sql", "utf8");
  for (const s of pecahSql(sql)) await E.DB.prepare(s).run();
  for (const s of pecahSql(sql)) await E.DB.prepare(s).run(); // idempoten
  assert.equal(await cacah("kons_bagian", "WHERE dokumen_id = 'masukan-meti-ruu-ebet'"), 22);
  assert.equal((await satu("SELECT status FROM kons_dokumen WHERE id = 'masukan-meti-ruu-ebet'")).status, "terbit");
  assert.equal(await cacah("kons_bagian", "WHERE CAST(nomor AS INTEGER) > 22"), 0);
  assert.ok(!JSON.stringify(JSON.parse(readFileSync("public/data/konsultasi.json", "utf8"))).includes("Mandatory offtake"), "butir tidak boleh di public/data");
});

const SEMUA = [["GET", "/api/konsultasi"], ["GET", "/api/konsultasi/anggota?q=ab"], ["POST", "/api/konsultasi", {}], ["GET", "/api/konsultasi/ruu-ebet"], ["PUT", "/api/konsultasi/ruu-ebet", {}],
  ["POST", "/api/konsultasi/ruu-ebet/status", {}], ["POST", "/api/konsultasi/ruu-ebet/utas", {}], ["POST", "/api/konsultasi/ruu-ebet/ikuti", {}], ["PATCH", "/api/konsultasi/utas/1", {}], ["DELETE", "/api/konsultasi/utas/1"],
  ["POST", "/api/konsultasi/utas/1/balasan", {}], ["POST", "/api/konsultasi/utas/1/dukung", {}], ["POST", "/api/konsultasi/utas/1/selesai", {}], ["POST", "/api/konsultasi/utas/1/putus", {}], ["POST", "/api/konsultasi/utas/1/sembunyi", {}],
  ["PATCH", "/api/konsultasi/balasan/1", {}], ["DELETE", "/api/konsultasi/balasan/1"], ["POST", "/api/konsultasi/balasan/1/sembunyi", {}], ["GET", "/api/konsultasi/ruu-ebet/rekap"], ["GET", "/api/konsultasi/ruu-ebet/rekap.docx"],
  ["POST", "/api/konsultasi/ruu-ebet/berkas", new FormData()], ["GET", "/api/konsultasi/ruu-ebet/berkas"]];
test("modul mengekspor semua rute dan tamu DITOLAK 401 di tiap rute", async () => {
  assert.equal(Object.keys(rute).length, SEMUA.length);
  for (const [m, j, b] of SEMUA) assert.equal((await panggil(m, j, { badan: b })).status, 401, `${m} ${j}`);
});
test("akun nonaktif diperlakukan sebagai tamu", async () => {
  await assert.rejects(hak.konsDaftar(E, { id: ID.mati, peran: "anggota", status: "nonaktif" }), (e) => e.kode === "dilarang");
});

/* ---------------------------------------------- alur anggota ---------------------------------------------- */
let B1; // bagian butir 1
test("daftar: kartu RUU EBET (tanpa naskah) dan Masukan METI; anggota tidak melihat draf", async () => {
  const j = await (await panggil("GET", "/api/konsultasi", { peran: "anggota" })).json();
  assert.deepEqual(j.baris.map((x) => x.id).sort(), ["masukan-meti-ruu-ebet", "ruu-ebet"]);
  const m = j.baris.find((x) => x.id === "masukan-meti-ruu-ebet");
  assert.equal(m.n_bagian, 22); assert.equal(j.baris.find((x) => x.id === "ruu-ebet").n_bagian, 0); assert.equal(j.kelola, false);
  const d = await (await panggil("GET", "/api/konsultasi/masukan-meti-ruu-ebet", { peran: "anggota" })).json();
  B1 = d.bagian[0]; assert.equal(B1.nomor, "1"); assert.equal(d.saya.putus, false);
  assert.equal((await panggil("GET", "/api/konsultasi/tidak-ada", { peran: "anggota" })).status, 404);
});
const utas = (peran, badan, id = "masukan-meti-ruu-ebet") => panggil("POST", `/api/konsultasi/${id}/utas`, { peran, badan });
let UBAH, KOM;
test("anggota: komentar, usul ubah, coret, tambah; HTML dibuang; kutipan wajib ada; alasan wajib", async () => {
  const teks = B1.teks, k = "mengikat";
  const i = teks.indexOf(k);
  let r = await utas("anggota", { jenis: "komentar", bagian_id: B1.id, kutipan: k, mulai: i, akhir: i + k.length, isi: "Setuju <b>sekali</b> <script>x</script>" });
  assert.equal(r.status, 201); KOM = (await r.json()).id;
  assert.equal((await satu("SELECT isi FROM kons_utas WHERE id = ?", KOM)).isi, "Setuju sekali x");
  r = await utas("anggota", { jenis: "ubah", bagian_id: B1.id, kutipan: k, mulai: i, akhir: i + k.length, teks_ganti: "bersifat mengikat", isi: "Lebih tegas." });
  assert.equal(r.status, 201); UBAH = (await r.json()).id;
  assert.equal((await utas("anggota", { jenis: "coret", bagian_id: B1.id, kutipan: "NZE 2060", isi: "Tidak perlu tahun." })).status, 201);
  assert.equal((await utas("anggota", { jenis: "tambah", bagian_id: B1.id, kutipan: "E20", sisip: "sesudah", teks_ganti: "dan E30", isi: "Tambah target." })).status, 201);
  assert.equal((await utas("anggota", { jenis: "tambah", bagian_id: B1.id, kutipan: "E20", teks_ganti: "x", isi: "tanpa sisip" })).status, 422);
  assert.equal((await utas("anggota", { jenis: "ubah", bagian_id: B1.id, kutipan: "tidak ada di teks", teks_ganti: "x", isi: "alasan lengkap" })).status, 422);
  assert.equal((await utas("anggota", { jenis: "coret", bagian_id: B1.id, kutipan: k, isi: "x" })).status, 422, "alasan usulan wajib (min 5)");
  assert.equal((await utas("anggota", { jenis: "ubah", bagian_id: B1.id, kutipan: k, isi: "alasan lengkap" })).status, 422, "teks pengganti wajib");
  assert.equal((await utas("anggota", { jenis: "ngawur", isi: "x" })).status, 422);
  assert.equal((await utas("anggota", { jenis: "umum", isi: "Diskusi umum dokumen." })).status, 201);
  assert.equal((await utas("anggota", { jenis: "umum", bagian_id: B1.id, isi: "Diskusi pasal ini." })).status, 201);
  assert.equal((await utas("anggota", { jenis: "umum", bagian_id: 999999, isi: "bagian lain" })).status, 422);
  assert.equal((await utas("anggota", { jenis: "butir_baru", kutipan: "Butir tambahan", teks_ganti: "Isi usulan butir baru.", isi: "Belum tercakup." })).status, 201);
  assert.equal((await utas("anggota", { jenis: "umum", isi: "x".repeat(4001) })).status, 422);
  assert.equal((await utas("anggota", { jenis: "umum", isi: "x" }, "ruu-ebet")).status, 201, "dokumen terbit tanpa naskah tetap bisa didiskusikan");
});
test("mention hanya ke anggota terdaftar dan aktif; dedup; bukan ke diri sendiri", async () => {
  const r = await utas("anggota", { jenis: "umum", isi: "Mohon @Orang pengurus tinjau", sebut: [ID.pengurus, ID.mati, 99999, ID.anggota, ID.pengurus] });
  const id = (await r.json()).id;
  assert.deepEqual((await q("SELECT akun_id FROM kons_sebut WHERE utas_id = ?", id).all()).results.map((x) => x.akun_id), [ID.pengurus]);
  const c = await (await panggil("GET", "/api/konsultasi/anggota?q=Orang%20peng", { peran: "anggota" })).json();
  assert.ok(c.baris.some((x) => x.id === ID.pengurus) && !c.baris.some((x) => x.id === ID.mati) && Object.keys(c.baris[0]).sort().join() === "id,nama");
  assert.deepEqual((await (await panggil("GET", "/api/konsultasi/anggota?q=a", { peran: "anggota" })).json()).baris, []);
});
test("sunting/tarik hanya milik sendiri dalam 15 menit; staf tidak menyunting isi orang lain", async () => {
  assert.equal((await panggil("PATCH", `/api/konsultasi/utas/${UBAH}`, { peran: "anggota2", badan: { isi: "bajak" } })).status, 409);
  assert.equal((await panggil("PATCH", `/api/konsultasi/utas/${UBAH}`, { peran: "pengurus", badan: { isi: "bajak" } })).status, 409);
  assert.equal((await panggil("PATCH", `/api/konsultasi/utas/${UBAH}`, { peran: "anggota", badan: { isi: "Lebih tegas lagi.", teks_ganti: "wajib mengikat" } })).status, 200);
  const s = await satu("SELECT isi, teks_ganti, diubah FROM kons_utas WHERE id = ?", UBAH);
  assert.equal(s.isi, "Lebih tegas lagi."); assert.equal(s.teks_ganti, "wajib mengikat"); assert.ok(s.diubah);
  await q("UPDATE kons_utas SET dibuat = unixepoch() - 901 WHERE id = ?", KOM).run();
  assert.equal((await panggil("PATCH", `/api/konsultasi/utas/${KOM}`, { peran: "anggota", badan: { isi: "terlambat" } })).status, 409);
  assert.equal((await panggil("DELETE", `/api/konsultasi/utas/${KOM}`, { peran: "anggota" })).status, 409);
  const r = await utas("anggota2", { jenis: "umum", isi: "akan ditarik" });
  const id = (await r.json()).id;
  assert.equal((await panggil("DELETE", `/api/konsultasi/utas/${id}`, { peran: "anggota" })).status, 409, "bukan pemilik");
  assert.equal((await panggil("DELETE", `/api/konsultasi/utas/${id}`, { peran: "anggota2" })).status, 200);
  const d = await (await panggil("GET", "/api/konsultasi/masukan-meti-ruu-ebet", { peran: "anggota" })).json();
  assert.ok(!d.utas.some((u) => u.id === id), "utas ditarik tak tampil");
  assert.equal((await satu("SELECT status FROM kons_utas WHERE id = ?", id)).status, "ditarik", "baris tetap ada (jejak)");
});
test("balasan, dukungan (satu suara per akun), selesai", async () => {
  assert.equal((await panggil("POST", `/api/konsultasi/utas/${UBAH}/balasan`, { peran: "anggota2", badan: { isi: "Saya setuju <i>ya</i>", sebut: [ID.anggota] } })).status, 201);
  assert.equal((await panggil("POST", `/api/konsultasi/utas/${UBAH}/balasan`, { peran: "anggota2", badan: { isi: "" } })).status, 422);
  let r = await (await panggil("POST", `/api/konsultasi/utas/${UBAH}/dukung`, { peran: "anggota2", badan: {} })).json();
  assert.deepEqual([r.dukung, r.saya_dukung], [1, true]);
  r = await (await panggil("POST", `/api/konsultasi/utas/${UBAH}/dukung`, { peran: "anggota2", badan: {} })).json();
  assert.equal(r.dukung, 1, "dua kali tetap satu suara");
  await panggil("POST", `/api/konsultasi/utas/${UBAH}/dukung`, { peran: "pengurus", badan: {} });
  r = await (await panggil("POST", `/api/konsultasi/utas/${UBAH}/dukung`, { peran: "pengurus", badan: { ya: false } })).json();
  assert.equal(r.dukung, 1);
  assert.equal((await panggil("POST", `/api/konsultasi/utas/${KOM}/dukung`, { peran: "anggota2", badan: {} })).status, 404, "komentar bukan usulan");
  const d = await (await panggil("GET", "/api/konsultasi/masukan-meti-ruu-ebet", { peran: "anggota2" })).json();
  const u = d.utas.find((x) => x.id === UBAH);
  assert.equal(u.balasan.length, 1); assert.equal(u.balasan[0].isi, "Saya setuju ya"); assert.equal(u.dukung, 1); assert.equal(u.saya_dukung, true);
  assert.equal((await panggil("POST", `/api/konsultasi/utas/${UBAH}/selesai`, { peran: "anggota2", badan: {} })).status, 404, "bukan pembuka dan bukan staf");
  assert.equal((await panggil("POST", `/api/konsultasi/utas/${KOM}/selesai`, { peran: "anggota", badan: {} })).status, 200);
});

/* ---------------------------------------------- moderasi + keputusan ---------------------------------------------- */
test("keputusan: anggota/wilayah 403; pengurus menerima; menolak/menggabung butuh catatan; gabung hanya ke yang diterima", async () => {
  const url = (id) => `/api/konsultasi/utas/${id}/putus`;
  for (const p of ["anggota", "wilayah"]) assert.equal((await panggil("POST", url(UBAH), { peran: p, badan: { aksi: "diterima" } })).status, 403, p);
  assert.equal((await panggil("POST", url(KOM), { peran: "pengurus", badan: { aksi: "diterima" } })).status, 404, "komentar tak bisa diputus");
  assert.equal((await panggil("POST", url(UBAH), { peran: "pengurus", badan: { aksi: "ditolak" } })).status, 422);
  assert.equal((await panggil("POST", url(UBAH), { peran: "pengurus", badan: { aksi: "diterima", catatan: "Sesuai arahan." } })).status, 200);
  const s = await satu("SELECT status, putusan, diputus_oleh FROM kons_utas WHERE id = ?", UBAH);
  assert.deepEqual([s.status, s.putusan, s.diputus_oleh], ["diterima", "Sesuai arahan.", ID.pengurus]);
  const lain = (await q("SELECT id FROM kons_utas WHERE jenis = 'coret'").first()).id, tambah = (await q("SELECT id FROM kons_utas WHERE jenis = 'tambah'").first()).id;
  assert.equal((await panggil("POST", url(lain), { peran: "kurator", badan: { aksi: "digabung", catatan: "serupa", gabung_ke: tambah } })).status, 422, "tujuan belum diterima");
  assert.equal((await panggil("POST", url(lain), { peran: "kurator", badan: { aksi: "digabung", catatan: "serupa", gabung_ke: UBAH } })).status, 200);
  assert.equal((await panggil("POST", url(tambah), { peran: "admin", badan: { aksi: "ditolak", catatan: "Di luar lingkup." } })).status, 200);
  const baru = (await q("SELECT id FROM kons_utas WHERE jenis = 'butir_baru'").first()).id;
  assert.equal((await panggil("POST", url(baru), { peran: "super", badan: { aksi: "diterima" } })).status, 200);
  assert.equal((await panggil("POST", url(tambah), { peran: "admin", badan: { aksi: "buka" } })).status, 200, "keputusan bisa dibuka kembali");
  assert.equal((await satu("SELECT status FROM kons_utas WHERE id = ?", tambah)).status, "terbuka");
});
test("sembunyikan (hapus lunak): anggota tak lagi membaca isi, staf tetap; anggota 403", async () => {
  const id = (await (await utas("anggota2", { jenis: "umum", isi: "kata kasar yang melanggar" })).json()).id;
  assert.equal((await panggil("POST", `/api/konsultasi/utas/${id}/sembunyi`, { peran: "anggota", badan: {} })).status, 403);
  assert.equal((await panggil("POST", `/api/konsultasi/utas/${id}/sembunyi`, { peran: "kurator", badan: {} })).status, 200);
  const lihat = async (peran) => (await (await panggil("GET", "/api/konsultasi/masukan-meti-ruu-ebet", { peran })).json()).utas.find((u) => u.id === id);
  assert.equal((await lihat("anggota")).isi, null); assert.equal((await lihat("anggota")).tersembunyi, true);
  assert.equal((await lihat("pengurus")).isi, "kata kasar yang melanggar");
  assert.equal((await panggil("POST", `/api/konsultasi/utas/${id}/balasan`, { peran: "anggota", badan: { isi: "balas" } })).status, 404);
  const bid = (await (await panggil("POST", `/api/konsultasi/utas/${UBAH}/balasan`, { peran: "anggota2", badan: { isi: "balasan melanggar" } })).json()).id;
  assert.equal((await panggil("POST", `/api/konsultasi/balasan/${bid}/sembunyi`, { peran: "pengurus", badan: {} })).status, 200);
  const u = (await (await panggil("GET", "/api/konsultasi/masukan-meti-ruu-ebet", { peran: "anggota" })).json()).utas.find((x) => x.id === UBAH);
  assert.equal(u.balasan.find((b) => b.id === bid).isi, null);
});
test("rekap: usulan diterima masuk per butir; anggota membaca, hanya staf mengunduh DOCX", async () => {
  const r = await (await panggil("GET", "/api/konsultasi/masukan-meti-ruu-ebet/rekap", { peran: "anggota" })).json();
  assert.equal(r.baris.length, 23); assert.equal(r.bisa_ekspor, false);
  assert.match(r.baris[0].usulan, /wajib mengikat/); assert.equal(r.baris[0].berubah, true); assert.match(r.baris[0].alasan, /Lebih tegas lagi/);
  assert.equal(r.baris[22].baru, true); assert.equal(r.baris[1].berubah, false);
  assert.equal((await panggil("GET", "/api/konsultasi/masukan-meti-ruu-ebet/rekap.docx", { peran: "anggota" })).status, 403);
  const d = await panggil("GET", "/api/konsultasi/masukan-meti-ruu-ebet/rekap.docx", { peran: "pengurus" });
  assert.equal(d.status, 200); assert.match(d.headers.get("content-type"), /wordprocessingml/);
  const b = new Uint8Array(await d.arrayBuffer()); assert.deepEqual([...b.subarray(0, 2)], [0x50, 0x4b]); assert.ok(new TextDecoder("latin1").decode(b).includes("Usulan METI"));
});
test("jejak audit ada untuk setiap aksi (tulis, putus, sembunyi, dukung)", async () => {
  const t = (await q("SELECT DISTINCT tabel, aksi FROM jejak WHERE tabel LIKE 'kons_%'").all()).results.map((x) => `${x.tabel}:${x.aksi}`);
  for (const w of ["kons_utas:tambah", "kons_utas:ubah", "kons_utas:hapus", "kons_utas:tinjau", "kons_balasan:tambah", "kons_balasan:ubah"]) assert.ok(t.includes(w), w);
  assert.ok((await cacah("jejak", "WHERE tabel LIKE 'kons_%' AND peran IS NOT NULL")) >= 20);
});

/* ---------------------------------------------- laju ---------------------------------------------- */
test("batas laju: tulis ke-41 dalam sejam ditolak 429; anggota lain tak terpengaruh", async () => {
  const kunci = "ks" + ID.wilayah;
  await q("INSERT INTO laju (kunci, aksi, jendela, jumlah) VALUES (?, 'koreksi', ?, 40) ON CONFLICT (kunci, aksi, jendela) DO UPDATE SET jumlah = 40", kunci, Math.floor(Date.now() / 1000 / 3600)).run();
  assert.equal((await utas("wilayah", { jenis: "umum", isi: "terlalu sering" })).status, 429);
  assert.equal((await utas("anggota2", { jenis: "umum", isi: "masih boleh" })).status, 201);
});

/* ---------------------------------------------- kelola naskah ---------------------------------------------- */
let DOKID;
test("kelola: anggota 403; pengurus membuat draf, mengganti bagian, unggah berkas asli, menerbitkan", async () => {
  const meta = { judul: "RPP Uji Coba Konsultasi", jenis: "rpp", instansi: "Kementerian ESDM", tahap: "konsultasi", tenggat: "2026-12-31", sumber_url: "https://contoh.go.id/rpp", bentuk: "naskah" };
  assert.equal((await panggil("POST", "/api/konsultasi", { peran: "anggota", badan: meta })).status, 403);
  assert.equal((await panggil("POST", "/api/konsultasi", { peran: "pengurus", badan: { ...meta, sumber_url: "http://x.id" } })).status, 422);
  const r = await panggil("POST", "/api/konsultasi", { peran: "pengurus", badan: { ...meta, bagian: pecahNaskah(NASKAH).map((b) => ({ ...b })) } });
  assert.equal(r.status, 201); DOKID = (await r.json()).id; assert.equal(DOKID, "rpp-uji-coba-konsultasi");
  assert.equal(await cacah("kons_bagian", `WHERE dokumen_id = '${DOKID}'`), 7);
  assert.equal((await panggil("GET", `/api/konsultasi/${DOKID}`, { peran: "anggota" })).status, 404, "draf tak terlihat anggota");
  assert.equal((await panggil("GET", `/api/konsultasi/${DOKID}`, { peran: "pengurus" })).status, 200);
  assert.equal((await utas("anggota", { jenis: "umum", isi: "terlalu dini" }, DOKID)).status, 404, "draf belum bisa didiskusikan");
  const sunting = pecahNaskah(NASKAH); sunting[1].teks += " Disunting admin.";
  assert.equal((await panggil("PUT", `/api/konsultasi/${DOKID}`, { peran: "admin", badan: { ...meta, bagian: sunting } })).status, 200);
  assert.match((await satu("SELECT teks FROM kons_bagian WHERE dokumen_id = ? AND urutan = 1", DOKID)).teks, /Disunting admin/);
  const fd = new FormData(); fd.set("berkas", new Blob(["%PDF-1.7 isi"], { type: "application/pdf" }), "naskah.pdf");
  assert.equal((await panggil("POST", `/api/konsultasi/${DOKID}/berkas`, { peran: "anggota", badan: fd })).status, 403);
  assert.equal((await panggil("POST", `/api/konsultasi/${DOKID}/berkas`, { peran: "pengurus", badan: fd })).status, 201);
  const kunci = (await satu("SELECT berkas_kunci FROM kons_dokumen WHERE id = ?", DOKID)).berkas_kunci;
  assert.match(kunci, /^konsultasi\/[0-9a-f]{32}\.pdf$/); assert.ok(BERKAS.has(kunci));
  const png = new FormData(); png.set("berkas", new Blob([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0])], { type: "text/plain" }), "x.txt");
  assert.equal((await panggil("POST", `/api/konsultasi/${DOKID}/berkas`, { peran: "pengurus", badan: png })).status, 415, "jenis dari byte, bukan dari klien");
  const g = await panggil("GET", `/api/konsultasi/${DOKID}/berkas`, { peran: "kurator" });
  assert.equal(g.status, 200); assert.equal((await panggil("GET", `/api/konsultasi/${DOKID}/berkas`, { peran: "anggota" })).status, 403);
  assert.equal((await panggil("POST", `/api/konsultasi/${DOKID}/status`, { peran: "anggota", badan: { status: "terbit" } })).status, 403);
  assert.equal((await panggil("POST", `/api/konsultasi/${DOKID}/status`, { peran: "pengurus", badan: { status: "terbit" } })).status, 200);
  assert.equal((await panggil("GET", `/api/konsultasi/${DOKID}`, { peran: "anggota" })).status, 200);
});
test("bagian yang sudah punya diskusi tidak boleh diganti (jangkar tetap sah)", async () => {
  const d = await (await panggil("GET", `/api/konsultasi/${DOKID}`, { peran: "anggota" })).json();
  const p2 = d.bagian.find((b) => b.tingkat === "ayat"), k = "asas manfaat";
  const r = await utas("anggota", { jenis: "ubah", bagian_id: p2.id, kutipan: k, teks_ganti: "asas kemanfaatan", isi: "Istilah baku." }, DOKID);
  assert.equal(r.status, 201);
  const meta = { judul: "RPP Uji Coba Konsultasi", jenis: "rpp" };
  assert.equal((await panggil("PUT", `/api/konsultasi/${DOKID}`, { peran: "admin", badan: { ...meta, bagian: [{ tingkat: "pasal", nomor: "1", teks: "baru" }] } })).status, 409);
  assert.equal((await panggil("PUT", `/api/konsultasi/${DOKID}`, { peran: "admin", badan: { ...meta, tahap: "disahkan" } })).status, 200, "metadata tetap bisa diubah");
});

/* ---------------------------------------------- lonceng (Ikuti) ---------------------------------------------- */
test("pengikut dokumen mendapat kabar usulan, balasan, keputusan, dan sebutan di lonceng", async () => {
  assert.equal((await panggil("POST", "/api/konsultasi/masukan-meti-ruu-ebet/ikuti", { peran: "kurator", badan: { ya: true } })).status, 200);
  const sejak = Math.floor(Date.now() / 1000) - 60;
  await utas("anggota2", { jenis: "umum", isi: "Kabar untuk pengikut" });
  await utas("anggota2", { jenis: "umum", isi: "Tolong @Orang kurator", sebut: [ID.kurator] });
  const k = await (await panggil("GET", "/api/ikuti/ringkasan", { peran: "kurator" })).json();
  const subs = k.item.filter((x) => x.tipe === "konsultasi").map((x) => x.sub);
  for (const w of ["komentar", "usulan", "sebut", "diterima"]) assert.ok(subs.includes(w), w + " :: " + subs);
  assert.ok(k.item.every((x) => x.tipe !== "konsultasi" || x.ref.startsWith("kons:")) && k.baru > 0 && sejak > 0);
  const tanpa = await (await panggil("GET", "/api/ikuti/ringkasan", { peran: "wilayah" })).json();
  assert.ok(!tanpa.item.some((x) => x.tipe === "konsultasi" && x.sub !== "sebut"), "bukan pengikut: tak ada kabar");
  const daftar = await (await panggil("GET", "/api/konsultasi", { peran: "kurator" })).json();
  assert.equal(daftar.baris.find((x) => x.id === "masukan-meti-ruu-ebet").diikuti, true);
  assert.ok(daftar.baris.find((x) => x.id === "masukan-meti-ruu-ebet").peserta.length >= 2);
});

test("ekstrakDocx: teks paragraf dari DOCX (zip tanpa kompresi) lalu dipecah ke pasal", async () => {
  const { ekstrakDocx } = await import("../public/inti/naskah.js");
  const { zip } = await import("../src/docx.js");
  const par = (s) => `<w:p><w:r><w:t>${s}</w:t></w:r></w:p>`;
  const xml = `<?xml version="1.0"?><w:document><w:body>${["BAB I", "KETENTUAN UMUM", "Pasal 1", "Setiap orang &amp; badan usaha wajib patuh."].map(par).join("")}</w:body></w:document>`;
  const teks = await ekstrakDocx(zip([["word/document.xml", xml]]));
  const h = pecahNaskah(teks);
  assert.deepEqual(h.map((x) => [x.tingkat, x.nomor]), [["bab", "I"], ["pasal", "1"]]);
  assert.equal(h[1].teks, "Setiap orang & badan usaha wajib patuh.");
  await assert.rejects(ekstrakDocx(new Uint8Array(40)));
});

test("dukung dan ikuti dokumen non-terbit: anggota 404/diam, staf boleh", async () => {
  await q("UPDATE kons_dokumen SET status = 'draf' WHERE id = 'masukan-meti-ruu-ebet'").run();
  try {
    assert.equal((await panggil("POST", `/api/konsultasi/utas/${UBAH}/dukung`, { peran: "anggota2", badan: {} })).status, 404, "draf: anggota tak bisa mendukung");
    assert.equal((await panggil("POST", `/api/konsultasi/utas/${UBAH}/dukung`, { peran: "pengurus", badan: {} })).status, 200, "staf boleh");
    await q("DELETE FROM ikuti WHERE ref = 'kons:masukan-meti-ruu-ebet'").run();
    await panggil("POST", "/api/ikuti", { peran: "anggota2", badan: { jenis: "regulasi", ref: "kons:masukan-meti-ruu-ebet" } });
    assert.equal(await satu("SELECT 1 AS x FROM ikuti WHERE ref = 'kons:masukan-meti-ruu-ebet'"), null, "draf tidak bisa diikuti anggota");
  } finally { await q("UPDATE kons_dokumen SET status = 'terbit' WHERE id = 'masukan-meti-ruu-ebet'").run(); }
});
