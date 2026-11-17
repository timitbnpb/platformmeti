// kiriman.test.mjs (F65-205..208): nilai akademi, sertifikat, kuis rekaman, foto tonggak, minat listrik hijau, kebutuhan dana, antrean admin.
// Lewat worker.fetch utuh di D1 lokal NYATA (CHECK, indeks unik parsial, jejak). Hanya penyimpanan objek R2 yang ditiru (Map di memori).
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buatEnv, pecahSql } from "./_bantu.mjs";
import worker from "../src/worker.js";
import * as hak from "../src/hak.js";
import { sha } from "../src/util.js";
import { periksaJawabanAkademi } from "../src/akademi.js";
import { periksaHijau, periksaDana } from "../src/kiriman.js";

import { KUNCI_AKADEMI } from "../src/akademi_kunci.js";
const BANK_PUBLIK = JSON.parse(readFileSync(new URL("../public/data/akademi.json", import.meta.url), "utf8"));
// berkas publik tanpa jawaban; kunci digabung dari modul server hanya untuk menyusun jawaban uji
const BANK = { ...BANK_PUBLIK, modul: BANK_PUBLIK.modul.map((m) => ({ ...m, kuis: m.kuis.map((x) => ({ ...x, a: KUNCI_AKADEMI[x.id].a })) })) };
let E, tutup;
const COOKIE = {}, AKUN = {}, R2 = new Map();
const q = (s, ...b) => E.DB.prepare(s).bind(...b);
const satu = (s, ...b) => q(s, ...b).first();
const cacah = async (t, w = "") => (await satu(`SELECT count(*) AS n FROM ${t} ${w}`)).n;

async function tambahAkun(kunci, peran = "anggota") {
  const r = await q("INSERT INTO akun (surel, nama, peran, status, garam, sandi, iterasi) VALUES (?,?,?, 'aktif', ?, ?, 100000)", `${kunci}@uji.test`, "Nama " + kunci, peran, "a".repeat(32), "a".repeat(64)).run();
  const token = (Object.keys(COOKIE).length + 40).toString(16).padStart(2, "0").repeat(32);
  await hak.catatSesi(E, { idHash: await sha(token), akunId: r.meta.last_row_id, sampai: Math.floor(Date.now() / 1000) + 3600, ipHash: "h" });
  COOKIE[kunci] = `sesi=${token}`; AKUN[kunci] = r.meta.last_row_id;
}
async function panggil(metode, jalur, { peran = null, badan, biner } = {}) {
  const h = { origin: "https://uji.test", "cf-connecting-ip": "203.0.113.9" };
  if (peran) h.cookie = COOKIE[peran];
  if (metode !== "GET") h["x-pb"] = "1";
  let body;
  if (badan !== undefined) { body = JSON.stringify(badan); h["content-type"] = "application/json"; }
  if (biner) { body = biner; h["content-type"] = "application/octet-stream"; h["content-length"] = String(biner.length); }
  return worker.fetch(new Request("https://uji.test" + jalur, { method: metode, headers: h, body }), E, { waitUntil() {} });
}
const klaim = (kunci, org, status = "setuju") => q(`INSERT INTO org_klaim (akun_id, organisasi_id, status${status === "baru" ? "" : ", diputus_pada, diputus_oleh"}) VALUES (?, ?, ?${status === "baru" ? "" : ", unixepoch(), ?"})`, ...(status === "baru" ? [AKUN[kunci], org, status] : [AKUN[kunci], org, status, AKUN.admin])).run();
// PNG sah terkecil (1x1), JPEG ber-EXIF, dan berkas bukan gambar.
const PNG = Uint8Array.from(atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="), (c) => c.charCodeAt(0));
const JPG_EXIF = Uint8Array.from([0xff, 0xd8, 0xff, 0xe1, 0x00, 0x10, 0x45, 0x78, 0x69, 0x66, 0x00, 0x00, 1, 2, 3, 4, 5, 6, 7, 8, 0xff, 0xd9]);
const benar = (m) => Object.fromEntries(m.kuis.map((s) => [s.id, s.a]));
const salahSemua = (m) => Object.fromEntries(m.kuis.map((s) => [s.id, (s.a + 1) % s.o.length]));
const FOTO = (id = "pj_0001", org = "org_a", ket = "Pondasi turbin selesai") => `/api/proyek/${id}/foto?organisasi=${org}&keterangan=${encodeURIComponent(ket)}`;
const HIJAU = { perusahaan: "PT Uji Hijau", prov: "32", mwh_tahun: 1200, tahun_mulai: 2027 };
const DANA = { organisasi_id: "org_a", jumlah: 25000000, mata_uang: "USD", jenis: "ekuitas", uraian: "Ekuitas tahap konstruksi untuk 20 MW" };
const putus = (jenis, id, aksi, alasan, peran = "admin") => panggil("POST", `/api/admin/kiriman/${jenis}/${id}`, { peran, badan: alasan ? { aksi, alasan } : { aksi } });

before(async () => {
  ({ env: E, tutup } = await buatEnv({ tambahan: { BERKAS: {
    put: async (k, v, o) => { R2.set(k, { v, o }); },
    get: async (k) => (R2.has(k) ? { body: R2.get(k).v, httpMetadata: R2.get(k).o?.httpMetadata } : null),
    delete: async (k) => { R2.delete(k); },
  } } }));
  await tambahAkun("admin", "admin"); await tambahAkun("pengurus", "pengurus");
  for (const k of ["a", "b", "c", "d", "e"]) await tambahAkun(k);
  await klaim("a", "org_a"); await klaim("b", "org_b", "baru");
});
after(async () => { await tutup?.(); });

test("migrasi 0039 dijalankan dua kali tanpa galat", async () => {
  for (const s of pecahSql(readFileSync(new URL("../migrations/0039_kiriman.sql", import.meta.url), "utf8"))) await E.DB.prepare(s).run();
  assert.equal(await cacah("proyek_foto"), 0);
});

test("hak: empat sel baru per peran", () => {
  for (const jenis of ["akademi_nilai", "proyek_foto", "permintaan_hijau", "proyek_dana"]) {
    const sel = (p) => ["baca", "tambah", "ubah", "hapus"].filter((a) => hak.boleh(p, a, jenis, undefined, { peran: p, status: "aktif" }).ok);
    assert.deepEqual(sel("publik"), [], jenis);
    for (const p of ["anggota", "pengurus", "kurator", "wilayah", "admin", "super"]) assert.deepEqual(sel(p), ["baca", "tambah", "ubah"], jenis + " " + p);
  }
});

test("tamu 401 di semua rute bersesi; bukan admin 403 di antrean, putusan, dan bank soal", async () => {
  for (const [m, j, b] of [["GET", "/api/akademi/nilai"], ["POST", "/api/akademi/kuis", {}], ["GET", "/api/kuis/abc"], ["POST", "/api/kuis/abc", { jawaban: [0] }], ["GET", "/api/kiriman/saya"],
    ["DELETE", "/api/kiriman/foto/1"], ["GET", "/api/proyek/pj_0001/foto"], ["GET", "/api/proyek-foto/1"], ["GET", "/api/permintaan-hijau"], ["POST", "/api/permintaan-hijau", HIJAU],
    ["GET", "/api/proyek-dana"], ["POST", "/api/proyek/pj_0001/dana", DANA], ["GET", "/api/admin/kiriman"], ["POST", "/api/admin/kiriman/foto/1", { aksi: "setuju" }],
    ["GET", "/api/admin/kuis/abc"], ["PUT", "/api/admin/kuis/abc", { soal: [] }]]) assert.equal((await panggil(m, j, { badan: b })).status, 401, `${m} ${j}`);
  for (const p of ["a", "pengurus"]) {
    assert.equal((await panggil("GET", "/api/admin/kiriman", { peran: p })).status, 403);
    assert.equal((await putus("foto", 1, "setuju", null, p)).status, 403);
    assert.equal((await panggil("GET", "/api/admin/kuis/abc", { peran: p })).status, 403);
    assert.equal((await panggil("PUT", "/api/admin/kuis/abc", { peran: p, badan: { soal: [] } })).status, 403);
  }
});

/* ---------------- F65-205 akademi ---------------- */
test("jawaban akademi murni: modul dikenal, semua soal terjawab, indeks dalam rentang, tanpa kunci lain", () => {
  const m = BANK.modul[0];
  assert.equal(periksaJawabanAkademi({ modul: m.id, jawaban: benar(m) }).m.id, m.id);
  const j = benar(m), [k0] = Object.keys(j);
  for (const b of [null, {}, { modul: "tak-ada", jawaban: j }, { modul: m.id }, { modul: m.id, jawaban: [] }, { modul: m.id, jawaban: { ...j, lain: 0 } }, { modul: m.id, jawaban: { ...j, [k0]: 9 } },
    { modul: m.id, jawaban: { ...j, [k0]: "0" } }, { modul: m.id, jawaban: (({ [k0]: _, ...s }) => s)(j) }, { modul: m.id, jawaban: j, persen: 100 }]) assert.throws(() => periksaJawabanAkademi(b), (e) => e.status === 422, JSON.stringify(b));
});

test("nilai dihitung server; angka nilai dari klien ditolak; nilai terbaik tidak turun", async () => {
  const m = BANK.modul[0];
  assert.equal((await panggil("POST", "/api/akademi/kuis", { peran: "a", badan: { modul: m.id, jawaban: benar(m), persen: 100 } })).status, 422);
  let r = await (await panggil("POST", "/api/akademi/kuis", { peran: "a", badan: { modul: m.id, jawaban: salahSemua(m) } })).json();
  assert.equal(r.persen, 0); assert.equal(r.lulus, false);
  assert.equal(r.kunci, null, "kunci jawaban tidak keluar sebelum lulus"); assert.ok(Object.values(r.hasil).every((x) => x === false));
  r = await (await panggil("POST", "/api/akademi/kuis", { peran: "a", badan: { modul: m.id, jawaban: benar(m) } })).json();
  assert.equal(r.persen, 100); assert.equal(r.lulus, true);
  assert.deepEqual(r.kunci, benar(m)); assert.ok(Object.values(r.hasil).every((x) => x === true));
  await panggil("POST", "/api/akademi/kuis", { peran: "a", badan: { modul: m.id, jawaban: salahSemua(m) } });
  const s = await satu("SELECT persen, lulus FROM akademi_nilai WHERE akun_id = ? AND modul = ?", AKUN.a, m.id);
  assert.deepEqual(s, { persen: 100, lulus: 1 });
  assert.equal(await cacah("akademi_nilai", `WHERE akun_id = ${AKUN.a}`), 1);
  assert.ok(await cacah("jejak", "WHERE tabel = 'akademi_nilai'") >= 3);
});

test("sertifikat akademi: tidak ada sebelum semua kuis lulus; sesudahnya token sah, publik hanya nama, jumlah modul, tanggal", async () => {
  let n = await (await panggil("GET", "/api/akademi/nilai", { peran: "a" })).json();
  assert.equal(n.sertifikat, null); assert.equal(n.lulus, 1); assert.equal(n.wajib, BANK.modul.length);
  for (const m of BANK.modul.slice(1, -1)) await panggil("POST", "/api/akademi/kuis", { peran: "a", badan: { modul: m.id, jawaban: benar(m) } });
  assert.equal((await (await panggil("GET", "/api/akademi/nilai", { peran: "a" })).json()).sertifikat, null, "satu modul belum lulus");
  const akhir = BANK.modul.at(-1);
  await panggil("POST", "/api/akademi/kuis", { peran: "a", badan: { modul: akhir.id, jawaban: benar(akhir) } });
  n = await (await panggil("GET", "/api/akademi/nilai", { peran: "a" })).json();
  assert.match(n.sertifikat, /^\/sertifikat\/a\/\d+\.[0-9a-f]{32}$/);
  const token = n.sertifikat.split("/").pop();
  const r = await panggil("GET", "/api/akademi/sertifikat/" + token);
  assert.equal(r.status, 200);
  assert.deepEqual(Object.keys(await r.json()).sort(), ["jenis", "modul", "nama", "tanggal"]);
  // token dirusak, token milik akun yang belum lulus (HMAC benar pun tidak dibuat), bentuk salah: 404 seragam
  assert.equal((await panggil("GET", "/api/akademi/sertifikat/" + token.slice(0, -1) + (token.at(-1) === "0" ? "1" : "0"))).status, 404);
  assert.equal((await panggil("GET", `/api/akademi/sertifikat/${AKUN.b}.${token.split(".")[1]}`)).status, 404);
  assert.equal((await panggil("GET", "/api/akademi/sertifikat/abc")).status, 404);
  // nilai kuis rekaman tidak ikut menentukan sertifikat
  await q("INSERT INTO akademi_nilai (akun_id, modul, persen, lulus) VALUES (?, 'rekaman:xyz', 100, 1)", AKUN.b).run();
  assert.equal((await (await panggil("GET", "/api/akademi/nilai", { peran: "b" })).json()).sertifikat, null);
});

test("kuis rekaman: tanpa bank soal tidak ada kuis; admin mengisi; peserta tidak pernah menerima kunci sebelum menjawab", async () => {
  assert.deepEqual((await (await panggil("GET", "/api/kuis/vid-1", { peran: "b" })).json()).soal, []);
  assert.equal((await panggil("POST", "/api/kuis/vid-1", { peran: "b", badan: { jawaban: [0] } })).status, 404);
  const soal = [{ q: "Soal satu?", o: ["ya", "tidak"], a: 1 }, { q: "Soal dua?", o: ["a", "b", "c"], a: 0 }];
  for (const s of [[{ q: "", o: ["a", "b"], a: 0 }], [{ q: "x", o: ["a"], a: 0 }], [{ q: "x", o: ["a", "b"], a: 2 }], [{ q: "x", o: ["a", "b"], a: 0, lain: 1 }], "bukan daftar", Array(11).fill(soal[0])])
    assert.equal((await panggil("PUT", "/api/admin/kuis/vid-1", { peran: "admin", badan: { soal: s } })).status, 422, JSON.stringify(s).slice(0, 60));
  assert.equal((await panggil("PUT", "/api/admin/kuis/vid-1", { peran: "admin", badan: { soal } })).status, 200);
  const lihat = await (await panggil("GET", "/api/kuis/vid-1", { peran: "b" })).json();
  assert.equal(lihat.soal.length, 2); assert.ok(lihat.soal.every((s) => !("a" in s)), "kunci jawaban bocor");
  assert.equal((await (await panggil("GET", "/api/admin/kuis/vid-1", { peran: "admin" })).json()).soal[0].a, 1);
  assert.equal((await panggil("POST", "/api/kuis/vid-1", { peran: "b", badan: { jawaban: [1] } })).status, 422, "jumlah jawaban beda");
  const r = await (await panggil("POST", "/api/kuis/vid-1", { peran: "b", badan: { jawaban: [1, 2] } })).json();
  assert.equal(r.benar, 1); assert.equal(r.persen, 50); assert.equal(r.lulus, false);
  assert.equal(r.kunci, null, "kunci jawaban tidak keluar sebelum lulus"); assert.deepEqual(r.hasil, [true, false]);
  const l = await (await panggil("POST", "/api/kuis/vid-1", { peran: "b", badan: { jawaban: [1, 0] } })).json();
  assert.equal(l.lulus, true); assert.deepEqual(l.kunci, [1, 0]);
  assert.equal((await satu("SELECT persen FROM akademi_nilai WHERE akun_id = ? AND modul = 'rekaman:vid-1'", AKUN.b)).persen, 100);
  assert.equal((await panggil("PUT", "/api/admin/kuis/vid-1", { peran: "admin", badan: { soal: [] } })).status, 200);
  assert.equal(await cacah("kuis_rekaman"), 0);
});

/* ---------------- F65-206 foto tonggak ---------------- */
let fotoId;
test("foto: hanya akun berklaim organisasi yang disetujui; tipe palsu, EXIF, ukuran lebih, dan keterangan berdata pribadi ditolak", async () => {
  assert.equal((await panggil("POST", FOTO("pj_0001", "org_b"), { peran: "b", biner: PNG })).status, 403, "klaim belum disetujui");
  assert.equal((await panggil("POST", FOTO("pj_0001", "org_a"), { peran: "c", biner: PNG })).status, 403, "klaim milik akun lain");
  assert.equal((await panggil("POST", FOTO(), { peran: "a", biner: new TextEncoder().encode("<svg onload=alert(1)>") })).status, 415);
  assert.equal((await panggil("POST", FOTO(), { peran: "a", biner: JPG_EXIF })).status, 422);
  assert.equal((await panggil("POST", FOTO(), { peran: "a", biner: new Uint8Array(5 * 1024 * 1024 + 1) })).status, 413);
  assert.equal((await panggil("POST", FOTO("pj_0001", "org_a", "hubungi budi@contoh.id"), { peran: "a", biner: PNG })).status, 422);
  assert.equal((await panggil("POST", FOTO("pj_0001", "org_a", "x"), { peran: "a", biner: PNG })).status, 422);
  assert.equal(await cacah("proyek_foto"), 0); assert.equal(R2.size, 0, "berkas yang ditolak tidak boleh tertinggal di R2");
  const r = await panggil("POST", FOTO(), { peran: "a", biner: PNG });
  assert.equal(r.status, 201); fotoId = (await r.json()).id;
  const b = await satu("SELECT kunci, status, organisasi_id FROM proyek_foto WHERE id = ?", fotoId);
  assert.match(b.kunci, /^proyek-foto\/[0-9a-f]{32}\.png$/); assert.equal(b.status, "menunggu"); assert.equal(R2.size, 1);
});

test("foto menunggu: hanya pengirim dan admin yang bisa membuka; tidak tampil di daftar proyek", async () => {
  assert.equal((await panggil("GET", `/api/proyek-foto/${fotoId}`, { peran: "a" })).status, 200);
  assert.equal((await panggil("GET", `/api/proyek-foto/${fotoId}`, { peran: "admin" })).status, 200);
  assert.equal((await panggil("GET", `/api/proyek-foto/${fotoId}`, { peran: "c" })).status, 404, "IDOR foto menunggu");
  assert.equal((await panggil("GET", "/api/proyek-foto/999999", { peran: "a" })).status, 404);
  assert.deepEqual((await (await panggil("GET", "/api/proyek/pj_0001/foto", { peran: "c" })).json()).baris, []);
});

test("putusan admin: tolak wajib beralasan, setuju sekali, sesudah disetujui tampil ke semua; jejak tercatat", async () => {
  assert.equal((await putus("foto", fotoId, "tolak")).status, 422);
  assert.equal((await putus("foto", fotoId, "hapus")).status, 422);
  assert.equal((await putus("lain", fotoId, "setuju")).status, 404);
  assert.equal((await putus("foto", fotoId, "setuju")).status, 200);
  assert.equal((await putus("foto", fotoId, "tolak", "sudah diputus")).status, 409, "hanya dari menunggu");
  const r = await panggil("GET", `/api/proyek-foto/${fotoId}`, { peran: "c" });
  assert.equal(r.status, 200); assert.equal(r.headers.get("content-type"), "image/png");
  assert.equal(r.headers.get("content-security-policy"), "default-src 'none'; sandbox"); assert.equal(r.headers.get("x-content-type-options"), "nosniff");
  const d = (await (await panggil("GET", "/api/proyek/pj_0001/foto", { peran: "c" })).json()).baris;
  assert.equal(d.length, 1); assert.deepEqual(Object.keys(d[0]).sort(), ["dibuat", "id", "keterangan", "organisasi_id"]);
  assert.equal((await satu("SELECT aksi FROM jejak WHERE tabel = 'proyek_foto' ORDER BY id DESC LIMIT 1")).aksi, "tinjau");
});

test("tarik: milik orang lain 404; milik sendiri menghapus berkas R2 dan foto hilang untuk semua", async () => {
  assert.equal((await panggil("DELETE", `/api/kiriman/foto/${fotoId}`, { peran: "c" })).status, 404, "IDOR tarik");
  assert.equal((await panggil("DELETE", `/api/kiriman/lain/${fotoId}`, { peran: "a" })).status, 404);
  assert.equal((await satu("SELECT status FROM proyek_foto WHERE id = ?", fotoId)).status, "disetujui");
  assert.equal((await panggil("DELETE", `/api/kiriman/foto/${fotoId}`, { peran: "a" })).status, 200);
  assert.equal(R2.size, 0);
  assert.equal((await panggil("GET", `/api/proyek-foto/${fotoId}`, { peran: "a" })).status, 404);
  assert.equal((await panggil("DELETE", `/api/kiriman/foto/${fotoId}`, { peran: "a" })).status, 404, "tarik kedua");
});

test("foto ditolak: alasan tetap terlihat pengirim, berkasnya dihapus dari R2 dan tidak dilayani siapa pun", async () => {
  const id = (await (await panggil("POST", FOTO(), { peran: "a", biner: PNG })).json()).id;
  assert.equal(R2.size, 1);
  assert.equal((await putus("foto", id, "tolak", "Foto bukan lokasi proyek")).status, 200);
  assert.equal(R2.size, 0, "berkas foto yang ditolak tidak boleh tertinggal di R2");
  for (const k of ["a", "c", "admin"]) assert.equal((await panggil("GET", `/api/proyek-foto/${id}`, { peran: k })).status, 404, k);
  const s = (await (await panggil("GET", "/api/kiriman/saya", { peran: "a" })).json());
  assert.equal(s.foto.find((x) => x.id === id).alasan, "Foto bukan lokasi proyek"); assert.deepEqual(s.klaim, ["org_a"]);
  assert.ok(!("kunci" in s.foto[0]), "kunci R2 tidak keluar ke klien");
});

test("foto menunggu dibatasi per akun: yang keenam ditolak 409 dan tidak meninggalkan berkas di R2", async () => {
  const awal = R2.size, ids = [];
  for (let i = 0; i < hak.MAKS_FOTO_MENUNGGU; i++) { const r = await panggil("POST", FOTO("pj_0001", "org_a", "Tonggak ke " + (i + 1)), { peran: "a", biner: PNG }); assert.equal(r.status, 201, "foto ke " + (i + 1)); ids.push((await r.json()).id); }
  assert.equal((await panggil("POST", FOTO("pj_0001", "org_a", "Tonggak berlebih"), { peran: "a", biner: PNG })).status, 409);
  assert.equal(R2.size, awal + hak.MAKS_FOTO_MENUNGGU, "berkas kiriman yang ditolak batas tidak tersimpan");
  assert.equal(await cacah("proyek_foto", `WHERE akun_id = ${AKUN.a} AND status = 'menunggu'`), hak.MAKS_FOTO_MENUNGGU);
  // satu diputus: jatah terbuka lagi
  assert.equal((await putus("foto", ids[0], "tolak", "Bukan foto proyek")).status, 200);
  assert.equal((await panggil("POST", FOTO("pj_0001", "org_a", "Tonggak pengganti"), { peran: "a", biner: PNG })).status, 201);
  for (const id of ids.slice(1)) await panggil("DELETE", `/api/kiriman/foto/${id}`, { peran: "a" });
  // uji ini sengaja mengirim banyak; jatah laju akun a dikembalikan supaya uji berikutnya menguji hal lain, bukan batas laju
  await q("DELETE FROM laju WHERE aksi = 'koreksi' AND kunci = ?", "kr" + AKUN.a).run();
});

/* ---------------- F65-207 minat listrik hijau ---------------- */
test("hijau murni: provinsi dikenal, angka bulat dalam rentang, tanpa data pribadi, tanpa kunci lain", () => {
  assert.deepEqual(periksaHijau(HIJAU), { ...HIJAU, catatan: null });
  for (const b of [{ ...HIJAU, prov: "99" }, { ...HIJAU, prov: 32.5 }, { ...HIJAU, mwh_tahun: 0 }, { ...HIJAU, mwh_tahun: 1.5 }, { ...HIJAU, mwh_tahun: "1200" }, { ...HIJAU, tahun_mulai: 1990 },
    { ...HIJAU, perusahaan: "" }, { ...HIJAU, perusahaan: "x".repeat(121) }, { ...HIJAU, catatan: "wa 081234567890" }, { ...HIJAU, status: "disetujui" }, { ...HIJAU, akun_id: 1 }])
    assert.throws(() => periksaHijau(b), (e) => e.status === 422, JSON.stringify(b));
});

test("hijau: satu kiriman aktif per akun; agregat tidak keluar di bawah ambang dan tidak pernah memuat nama perusahaan", async () => {
  assert.equal((await panggil("POST", "/api/permintaan-hijau", { peran: "a", badan: { ...HIJAU, akun_id: AKUN.b } })).status, 422, "id pemilik tidak diterima dari badan");
  const id = {};
  for (const k of ["a", "b"]) { const r = await panggil("POST", "/api/permintaan-hijau", { peran: k, badan: { ...HIJAU, perusahaan: "PT " + k } }); assert.equal(r.status, 201); id[k] = (await r.json()).id; }
  assert.equal((await satu("SELECT akun_id FROM permintaan_hijau WHERE id = ?", id.a)).akun_id, AKUN.a);
  assert.equal((await panggil("POST", "/api/permintaan-hijau", { peran: "a", badan: HIJAU })).status, 409, "kiriman ganda");
  for (const k of ["a", "b"]) assert.equal((await putus("hijau", id[k], "setuju")).status, 200);
  let ag = await (await panggil("GET", "/api/permintaan-hijau", { peran: "e" })).json();
  assert.equal(ag.ambang, hak.N_MIN_HIJAU); assert.deepEqual(ag.baris, [], "dua pengirim: di bawah ambang");
  const r = await panggil("POST", "/api/permintaan-hijau", { peran: "c", badan: { ...HIJAU, perusahaan: "PT c", mwh_tahun: 600 } });
  await putus("hijau", (await r.json()).id, "setuju");
  await panggil("POST", "/api/permintaan-hijau", { peran: "d", badan: { ...HIJAU, perusahaan: "PT d", prov: "11" } }); // menunggu, provinsi lain: tidak dihitung
  ag = await (await panggil("GET", "/api/permintaan-hijau", { peran: "e" })).json();
  // jumlah tepat (3.000 MWh) tidak pernah keluar: hanya rentang kasar, supaya selisih antar-laporan tidak membuka angka satu perusahaan
  assert.deepEqual(ag.baris, [{ prov: "32", n: 3, mwh_min: 1000, mwh_maks: 10000 }]);
  assert.ok(!JSON.stringify(ag).includes("3000"));
  assert.deepEqual(hak.rentangMwh(999), { mwh_min: 0, mwh_maks: 1000 }); assert.deepEqual(hak.rentangMwh(1000), { mwh_min: 1000, mwh_maks: 10000 });
  assert.deepEqual(hak.rentangMwh(99999999), { mwh_min: 10000000, mwh_maks: null });
  assert.ok(!JSON.stringify(ag).includes("PT "), "nama perusahaan bocor");
  // tarik lalu boleh kirim lagi; agregat turun di bawah ambang dan hilang
  assert.equal((await panggil("DELETE", `/api/kiriman/hijau/${id.b}`, { peran: "a" })).status, 404, "IDOR tarik");
  assert.equal((await panggil("DELETE", `/api/kiriman/hijau/${id.a}`, { peran: "a" })).status, 200);
  assert.deepEqual((await (await panggil("GET", "/api/permintaan-hijau", { peran: "e" })).json()).baris, []);
  assert.equal((await panggil("POST", "/api/permintaan-hijau", { peran: "a", badan: HIJAU })).status, 201);
});

/* ---------------- F65-208 kebutuhan dana ---------------- */
test("dana murni: enum, rentang, uraian tanpa data pribadi", () => {
  assert.deepEqual(periksaDana(DANA), DANA);
  for (const b of [{ ...DANA, mata_uang: "EUR" }, { ...DANA, jenis: "pinjaman" }, { ...DANA, jumlah: 0 }, { ...DANA, jumlah: 1.5 }, { ...DANA, uraian: "pendek" }, { ...DANA, uraian: "Hubungi direktur di 0812-3456-7890 segera" },
    { ...DANA, organisasi_id: "org a" }, { ...DANA, status: "disetujui" }, (({ jenis, ...s }) => s)(DANA)]) assert.throws(() => periksaDana(b), (e) => e.status === 422, JSON.stringify(b));
});

test("dana: hanya akun berklaim; ganda per proyek ditolak; hanya yang disetujui tampil, tanpa data akun", async () => {
  assert.equal((await panggil("POST", "/api/proyek/pj_0001/dana", { peran: "c", badan: DANA })).status, 403, "tanpa klaim");
  assert.equal((await panggil("POST", "/api/proyek/pj_0001/dana", { peran: "b", badan: { ...DANA, organisasi_id: "org_b" } })).status, 403, "klaim belum disetujui");
  const r = await panggil("POST", "/api/proyek/pj_0001/dana", { peran: "a", badan: DANA });
  assert.equal(r.status, 201); const id = (await r.json()).id;
  assert.equal((await panggil("POST", "/api/proyek/pj_0001/dana", { peran: "a", badan: DANA })).status, 409, "ganda di proyek yang sama");
  assert.equal((await panggil("POST", "/api/proyek/pj_0002/dana", { peran: "a", badan: DANA })).status, 201, "proyek lain boleh");
  assert.deepEqual((await (await panggil("GET", "/api/proyek-dana", { peran: "c" })).json()).baris, [], "menunggu tidak tampil");
  assert.equal((await putus("dana", id, "setuju")).status, 200);
  const d = (await (await panggil("GET", "/api/proyek-dana", { peran: "c" })).json()).baris;
  assert.equal(d.length, 1); assert.deepEqual(Object.keys(d[0]).sort(), ["dibuat", "id", "jenis", "jumlah", "mata_uang", "organisasi_id", "proyek_id", "uraian"]);
});

test("antrean admin: per jenis dan status, memuat nama pengirim tetapi tidak surel; jenis atau status tak dikenal 422", async () => {
  const r = await (await panggil("GET", "/api/admin/kiriman?jenis=dana&status=menunggu", { peran: "admin" })).json();
  assert.equal(r.total, 1); assert.equal(r.baris[0].pengirim, "Nama a"); assert.ok(!JSON.stringify(r).includes("@uji.test"));
  assert.equal((await (await panggil("GET", "/api/admin/kiriman?jenis=hijau&status=disetujui", { peran: "admin" })).json()).total, 2);
  assert.equal((await panggil("GET", "/api/admin/kiriman?jenis=lain", { peran: "admin" })).status, 422);
  assert.equal((await panggil("GET", "/api/admin/kiriman?status=lain", { peran: "admin" })).status, 422);
});

test("D1 menolak status tanpa pemutus dan tolak tanpa alasan (jaring di bawah rute)", async () => {
  await assert.rejects(q("UPDATE proyek_dana SET status = 'disetujui' WHERE status = 'menunggu'").run());
  await assert.rejects(q("INSERT INTO permintaan_hijau (akun_id, perusahaan, prov, mwh_tahun, tahun_mulai, status, diputus_pada, diputus_oleh) VALUES (?, 'PT z', '32', 1, 2027, 'ditolak', 1, ?)", AKUN.e, AKUN.admin).run());
  await assert.rejects(q("INSERT INTO akademi_nilai (akun_id, modul, persen, lulus) VALUES (?, 'x', 101, 1)", AKUN.e).run());
});
