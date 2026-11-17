// keluar.test.mjs (F65-213..216): lencana verifikasi, laporan warga, pilihan pengingat surel, antrean surel keluar, draf buletin.
// Lewat worker.fetch utuh di D1 lokal NYATA (trigger, indeks unik, jejak). TIDAK ADA surel yang dikirim: yang diperiksa adalah DAFTAR yang akan dikirim,
// dan fetch global dipasangi perangkap supaya panggilan keluar apa pun menggagalkan uji.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { buatEnv, pecahSql } from "./_bantu.mjs";
import worker from "../src/worker.js";
import * as hak from "../src/hak.js";
import { sha } from "../src/util.js";
import { periksaLencana, periksaLaporan } from "../src/kiriman.js";
import { jalankanPengingat, rakitBuletin, susunBuletin, susunPengingat, mingguIso, tokenIngat, buletinTerjadwal } from "../src/surel_keluar.js";

let E, tutup;
const COOKIE = {}, AKUN = {}, L = {}, ASET = {};
const KELUAR = []; // tiap panggilan fetch global tercatat di sini; harus tetap kosong
const fetchAsli = globalThis.fetch;
const q = (s, ...b) => E.DB.prepare(s).bind(...b);
const satu = (s, ...b) => q(s, ...b).first();
const cacah = async (t, w = "", ...b) => (await satu(`SELECT count(*) AS n FROM ${t} ${w}`, ...b)).n;

async function tambahAkun(kunci, peran = "anggota") {
  const r = await q("INSERT INTO akun (surel, nama, peran, status, garam, sandi, iterasi) VALUES (?,?,?, 'aktif', ?, ?, 100000)", `${kunci}@keluar.test`, "Nama " + kunci, peran, "a".repeat(32), "a".repeat(64)).run();
  const token = (Object.keys(COOKIE).length + 120).toString(16).padStart(2, "0").repeat(32);
  await hak.catatSesi(E, { idHash: await sha(token), akunId: r.meta.last_row_id, sampai: Math.floor(Date.now() / 1000) + 3600, ipHash: "h" });
  COOKIE[kunci] = `sesi=${token}`; AKUN[kunci] = r.meta.last_row_id;
}
async function panggil(metode, jalur, { peran = null, badan } = {}) {
  const h = { origin: "https://uji.test", "cf-connecting-ip": "203.0.113.29" };
  if (peran) h.cookie = COOKIE[peran];
  if (metode !== "GET") h["x-pb"] = "1";
  let body;
  if (badan !== undefined) { body = JSON.stringify(badan); h["content-type"] = "application/json"; }
  return worker.fetch(new Request("https://uji.test" + jalur, { method: metode, headers: h, body }), E, { waitUntil() {} });
}
const st = async (...a) => (await panggil(...a)).status;
const isi = async (...a) => (await panggil(...a)).json();
const putus = (jenis, id, aksi, alasan, peran = "admin") => panggil("POST", `/api/admin/kiriman/${jenis}/${id}`, { peran, badan: alasan ? { aksi, alasan } : { aksi } });
const klaim = (kunci, org) => q("INSERT INTO org_klaim (akun_id, organisasi_id, status, diputus_pada, diputus_oleh) VALUES (?, ?, 'setuju', unixepoch(), ?)", AKUN[kunci], org, AKUN.admin).run();
const LENCANA = { jenis: "legalitas", bukti_url: "https://ahu.go.id/profil/pt-uji", uraian: "Akta pendirian dan pengesahan badan hukum tercatat di AHU." };
const LAPORAN = "Lokasi proyek sudah dua tahun tidak ada kegiatan; pagar dan papan nama proyek sudah roboh.";
const KINI = Date.parse("2026-11-16T03:00:00Z"); // Senin 10.00 WIB
const HARI = 86400000;

before(async () => {
  globalThis.fetch = async (...a) => { KELUAR.push(String(a[0]?.url ?? a[0])); throw new Error("uji: tidak boleh ada panggilan keluar"); };
  ({ env: E, tutup } = await buatEnv({ tambahan: { ASSETS: { fetch: async (req) => {
    const n = new URL(req.url).pathname.replace(/^\/data\//, "").replace(/\.json$/, "");
    return ASET[n] ? new Response(JSON.stringify({ baris: ASET[n] }), { status: 200 }) : new Response("{}", { status: 404 });
  } } } }));
  await tambahAkun("admin", "admin"); await tambahAkun("pengurus", "pengurus");
  for (const k of ["a", "b", "c", "d", "e"]) await tambahAkun(k);
  await klaim("a", "org_a");
});
after(async () => { globalThis.fetch = fetchAsli; await tutup?.(); });

test("migrasi 0041 dijalankan dua kali tanpa galat", async () => {
  for (const s of pecahSql(readFileSync(new URL("../migrations/0041_lencana_laporan_surel.sql", import.meta.url), "utf8"))) await E.DB.prepare(s).run();
});

test("hak: lencana dan laporan warga seperti kiriman lain; surel keluar hanya admin dan super", () => {
  const sel = (p, jenis) => ["baca", "tambah", "ubah", "hapus"].filter((a) => hak.boleh(p, a, jenis, undefined, { peran: p, status: "aktif" }).ok);
  for (const jenis of ["lencana", "laporan_warga"]) {
    assert.deepEqual(sel("publik", jenis), [], jenis);
    for (const p of ["anggota", "pengurus", "kurator", "wilayah", "admin", "super"]) assert.deepEqual(sel(p, jenis), ["baca", "tambah", "ubah"], jenis + " " + p);
  }
  for (const p of ["publik", "anggota", "pengurus", "kurator", "wilayah"]) assert.deepEqual(sel(p, "surel_keluar"), [], p);
  for (const p of ["admin", "super"]) assert.ok(sel(p, "surel_keluar").includes("baca"), p);
});

test("tamu 401 di semua rute baru; bukan admin 403 di surel keluar dan buletin", async () => {
  for (const [m, j, b] of [["GET", "/api/organisasi/org_a/lencana"], ["POST", "/api/organisasi/org_a/lencana", LENCANA], ["GET", "/api/proyek/pj_0001/laporan"], ["POST", "/api/proyek/pj_0001/laporan", { isi: LAPORAN }],
    ["PUT", "/api/ikuti/surel", { jenis: "regulasi", ref: "reg-1", aktif: true }], ["GET", "/api/admin/surel-keluar"], ["POST", "/api/admin/buletin/rakit", {}], ["POST", "/api/admin/buletin/1", { aksi: "setuju" }]]) assert.equal(await st(m, j, { badan: b }), 401, `${m} ${j}`);
  for (const p of ["a", "pengurus"]) {
    assert.equal(await st("GET", "/api/admin/surel-keluar", { peran: p }), 403);
    assert.equal(await st("POST", "/api/admin/buletin/rakit", { peran: p, badan: {} }), 403);
    assert.equal(await st("POST", "/api/admin/buletin/1", { peran: p, badan: { aksi: "setuju" } }), 403);
  }
});

/* ---------------- F65-213 lencana ---------------- */
test("lencana murni: jenis dikenal, bukti https, uraian cukup, tanpa data pribadi, tanpa kunci lain", () => {
  assert.equal(periksaLencana({ ...LENCANA, organisasi_id: "org_a" }).jenis, "legalitas");
  for (const b of [{ ...LENCANA, organisasi_id: "org_a", jenis: "ktp" }, { ...LENCANA, organisasi_id: "org_a", bukti_url: "http://contoh.test/x" }, { ...LENCANA, organisasi_id: "org_a", bukti_url: "" },
    { ...LENCANA, organisasi_id: "org_a", uraian: "pendek" }, { ...LENCANA, organisasi_id: "org_a", uraian: LENCANA.uraian + " hubungi 0812-3456-7890" }, { ...LENCANA, organisasi_id: "../x" }, { ...LENCANA, organisasi_id: "org_a", lain: 1 }])
    assert.throws(() => periksaLencana(b), (e) => e.status === 422, JSON.stringify(b));
});

test("lencana: hanya akun berklaim organisasi itu; satu aktif per organisasi per jenis; tampil hanya sesudah disetujui, dengan tanggal dan peninjau", async () => {
  assert.equal(await st("POST", "/api/organisasi/org_a/lencana", { peran: "b", badan: LENCANA }), 403, "tanpa klaim");
  assert.equal(await st("POST", "/api/organisasi/org_lain/lencana", { peran: "a", badan: LENCANA }), 403, "klaim organisasi lain");
  assert.equal(await st("POST", "/api/organisasi/org_a/lencana", { peran: "a", badan: { ...LENCANA, organisasi_id: "org_lain" } }), 422, "organisasi hanya dari jalur");
  const id = (await isi("POST", "/api/organisasi/org_a/lencana", { peran: "a", badan: LENCANA })).id;
  assert.ok(id > 0);
  assert.equal((await satu("SELECT akun_id FROM lencana WHERE id = ?", id)).akun_id, AKUN.a);
  assert.equal(await st("POST", "/api/organisasi/org_a/lencana", { peran: "a", badan: LENCANA }), 409, "ganda");
  assert.equal(await st("POST", "/api/organisasi/org_a/lencana", { peran: "a", badan: { ...LENCANA, jenis: "sertifikat" } }), 201, "jenis lain boleh");
  assert.deepEqual((await isi("GET", "/api/organisasi/org_a/lencana", { peran: "c" })).baris, [], "menunggu tidak tampil");
  assert.equal((await putus("lencana", id, "setuju", null, "pengurus")).status, 403);
  assert.equal((await putus("lencana", id, "setuju", null, "a")).status, 403, "pengirim tidak memutus sendiri");
  assert.equal((await putus("lencana", id, "setuju")).status, 200);
  const d = (await isi("GET", "/api/organisasi/org_a/lencana", { peran: "c" })).baris;
  assert.equal(d.length, 1);
  assert.deepEqual(Object.keys(d[0]).sort(), ["bukti_url", "diputus_pada", "id", "jenis", "peninjau", "uraian"]);
  assert.equal(d[0].peninjau, "Nama admin"); assert.ok(d[0].diputus_pada > 0);
  assert.equal(await st("DELETE", `/api/kiriman/lencana/${id}`, { peran: "c" }), 404, "IDOR tarik");
  assert.equal(await st("DELETE", `/api/kiriman/lencana/${id}`, { peran: "a" }), 200);
  assert.deepEqual((await isi("GET", "/api/organisasi/org_a/lencana", { peran: "c" })).baris, []);
  assert.equal((await satu("SELECT aksi FROM jejak WHERE tabel = 'lencana' AND aksi = 'tinjau' ORDER BY id DESC LIMIT 1")).aksi, "tinjau");
});

/* ---------------- F65-214 laporan warga ---------------- */
test("laporan murni: teks polos 20 sampai 1000, tanpa surel atau telepon, tanpa kunci lain", () => {
  assert.equal(periksaLaporan({ isi: LAPORAN }).isi, LAPORAN);
  for (const b of [{}, { isi: "pendek" }, { isi: "x".repeat(1001) }, { isi: LAPORAN + " hubungi saya di budi@contoh.test" }, { isi: LAPORAN, akun_id: 1 }]) assert.throws(() => periksaLaporan(b), (e) => e.status === 422, JSON.stringify(b));
});

test("laporan: satu aktif per akun per proyek; tidak tampil sebelum ditinjau; sesudah disetujui tampil tanpa nama pelapor; HTML tersimpan sebagai teks", async () => {
  const html = "<script>alert(1)</script> " + LAPORAN;
  const id = (await isi("POST", "/api/proyek/pj_0001/laporan", { peran: "b", badan: { isi: html } })).id;
  assert.ok(id > 0);
  assert.equal((await satu("SELECT akun_id, isi FROM laporan_warga WHERE id = ?", id)).isi, html, "disimpan apa adanya sebagai teks");
  assert.equal(await st("POST", "/api/proyek/pj_0001/laporan", { peran: "b", badan: { isi: LAPORAN } }), 409, "ganda");
  assert.equal(await st("POST", "/api/proyek/pj_0002/laporan", { peran: "b", badan: { isi: LAPORAN } }), 201, "proyek lain boleh");
  assert.equal(await st("POST", "/api/proyek/pj_0001/laporan", { peran: "b", badan: { isi: LAPORAN, akun_id: AKUN.c } }), 422, "id pemilik tidak diterima dari badan");
  assert.deepEqual((await isi("GET", "/api/proyek/pj_0001/laporan", { peran: "c" })).baris, [], "menunggu tidak tampil");
  assert.deepEqual((await isi("GET", "/api/proyek/pj_0001/laporan", { peran: "b" })).baris, [], "pelapor pun melihatnya lewat kiriman saya, bukan daftar proyek");
  assert.equal((await isi("GET", "/api/kiriman/saya", { peran: "b" })).laporan.length, 2);
  assert.equal((await putus("laporan", id, "setuju", null, "b")).status, 403);
  assert.equal((await putus("laporan", id, "tolak")).status, 422, "tolak wajib beralasan");
  assert.equal((await putus("laporan", id, "setuju")).status, 200);
  const d = await isi("GET", "/api/proyek/pj_0001/laporan", { peran: "c" });
  assert.equal(d.baris.length, 1); assert.deepEqual(Object.keys(d.baris[0]).sort(), ["dibuat", "diputus_pada", "id", "isi"]);
  assert.ok(!JSON.stringify(d).includes("Nama b") && !JSON.stringify(d).includes("akun"), "nama pelapor tidak keluar");
  assert.equal((await isi("GET", "/api/admin/kiriman?jenis=laporan&status=disetujui", { peran: "admin" })).baris[0].pengirim, "Nama b", "admin melihat pengirim");
  assert.equal(await st("DELETE", `/api/kiriman/laporan/${id}`, { peran: "c" }), 404, "IDOR tarik");
  assert.equal(await st("DELETE", `/api/kiriman/laporan/${id}`, { peran: "b" }), 200);
  assert.deepEqual((await isi("GET", "/api/proyek/pj_0001/laporan", { peran: "c" })).baris, []);
});

/* ---------------- F65-215 pilihan pengingat surel ---------------- */
test("pilihan surel: bawaan mati; hanya untuk hal yang diikuti; berhenti mengikuti ikut mematikannya", async () => {
  for (const k of ["a", "b", "c"]) assert.equal(await st("POST", "/api/ikuti", { peran: k, badan: { jenis: "regulasi", ref: "reg-1" } }), 201);
  assert.equal(await st("POST", "/api/ikuti", { peran: "a", badan: { jenis: "tender", ref: "tdw_x" } }), 201);
  assert.ok((await isi("GET", "/api/ikuti", { peran: "a" })).baris.every((x) => x.surel === false), "bawaan mati untuk semua yang sudah diikuti");
  assert.equal(await cacah("ikuti_surel"), 0);
  assert.equal(await st("PUT", "/api/ikuti/surel", { peran: "a", badan: { jenis: "regulasi", ref: "tidak-diikuti", aktif: true } }), 404);
  assert.equal(await st("PUT", "/api/ikuti/surel", { peran: "a", badan: { jenis: "regulasi", ref: "reg-1", aktif: "ya" } }), 422);
  assert.equal(await st("PUT", "/api/ikuti/surel", { peran: "a", badan: { jenis: "regulasi", ref: "reg-1", aktif: true, akun_id: AKUN.b } }), 422);
  assert.equal(await st("PUT", "/api/ikuti/surel", { peran: "a", badan: { jenis: "regulasi", ref: "reg-1", aktif: true } }), 200);
  assert.equal(await st("PUT", "/api/ikuti/surel", { peran: "a", badan: { jenis: "tender", ref: "tdw_x", aktif: true } }), 200);
  assert.equal(await st("PUT", "/api/ikuti/surel", { peran: "c", badan: { jenis: "regulasi", ref: "reg-1", aktif: true } }), 200);
  assert.deepEqual((await isi("GET", "/api/ikuti", { peran: "a" })).baris.map((x) => x.surel), [true, true]);
  assert.ok((await isi("GET", "/api/ikuti", { peran: "b" })).baris.every((x) => !x.surel), "pilihan akun lain tidak terpengaruh");
  // d: mengikuti, memilih, lalu berhenti mengikuti
  await panggil("POST", "/api/ikuti", { peran: "d", badan: { jenis: "regulasi", ref: "reg-1" } });
  await panggil("PUT", "/api/ikuti/surel", { peran: "d", badan: { jenis: "regulasi", ref: "reg-1", aktif: true } });
  assert.equal(await cacah("ikuti_surel", "WHERE akun_id = ?", AKUN.d), 1);
  assert.equal(await st("DELETE", "/api/ikuti/regulasi/reg-1", { peran: "d" }), 200);
  assert.equal(await cacah("ikuti_surel", "WHERE akun_id = ?", AKUN.d), 0);
});

test("pengingat murni: hanya hal yang dipilih dan lebih baru dari penanda; tanpa butir tidak ada surel; memuat tautan berhenti", () => {
  const item = [{ tipe: "regulasi", jenis: "regulasi", ref: "reg-1", judul: "Permen Baru", waktu: 200 }, { tipe: "berita", jenis: "proyek", ref: "pj_9", judul: "Tidak dipilih", waktu: 300 }, { tipe: "regulasi", jenis: "regulasi", ref: "reg-1", judul: "Sudah lama", waktu: 50 }];
  const s = susunPengingat({ nama: "Budi", bahasa: "id" }, item, ["regulasi|reg-1"], 100, { asal: "https://x.test", token: "p1.abc" });
  assert.equal(s.n, 1); assert.match(s.isi, /Permen Baru/); assert.ok(!s.isi.includes("Tidak dipilih") && !s.isi.includes("Sudah lama"));
  assert.match(s.isi, /https:\/\/x\.test\/berhenti\?t=p1\.abc/);
  assert.equal(susunPengingat({ nama: "Budi" }, item, ["regulasi|reg-1"], 250, { asal: "", token: "" }), null);
  assert.equal(susunPengingat({ nama: "Budi" }, item, [], 0, { asal: "", token: "" }), null);
  assert.match(susunPengingat({ nama: "B", bahasa: "en" }, item, ["regulasi|reg-1"], 100, { asal: "", token: "" }).subjek, /Updates/);
});

test("cron pengingat: hanya yang mencentang; yang berhenti langganan tidak masuk; satu per akun per hari; tidak dua kali untuk perubahan yang sama; tidak ada yang terkirim", async () => {
  // c mencentang, tetapi surelnya berhenti langganan newsletter: dihormati
  await q("INSERT INTO langganan (surel, nama, status, token_berhenti) VALUES (?, 'Nama c', 'berhenti', ?)", "c@keluar.test", "c".repeat(64)).run();
  ASET.regulasi = [{ id: "reg-1", judul: "Permen ESDM tentang PLTS Atap", tanggal_ditetapkan: "2026-11-14" }];
  ASET.tender = [{ id: "tdw_x", judul: "Lelang WKP Uji", tahap: "lelang", tanggal: "2026-11-15", tanggal_sumber: "2026-11-15" }];
  const calon = await hak.sistem.pengingatCalon(E);
  assert.deepEqual(calon.map((x) => x.id), [AKUN.a], "b tidak mencentang, c berhenti langganan, d sudah berhenti mengikuti");
  assert.deepEqual([...calon[0].pilihan].sort(), ["regulasi|reg-1", "tender|tdw_x"]);
  let h = await jalankanPengingat(E, KINI, "https://uji.test");
  assert.deepEqual(h, { calon: 1, antre: 1 });
  const baris = await satu("SELECT jenis, akun_id, kunci, subjek, isi, status FROM surel_antre");
  assert.equal(baris.akun_id, AKUN.a); assert.equal(baris.kunci, `p:${AKUN.a}:2026-11-16`); assert.equal(baris.status, "antre");
  assert.match(baris.isi, /Permen ESDM tentang PLTS Atap/); assert.match(baris.isi, /Lelang WKP Uji/);
  assert.match(baris.isi, new RegExp("https://uji\\.test/berhenti\\?t=" + (await tokenIngat(E, AKUN.a)).replace(".", "\\.")));
  assert.ok(!baris.isi.includes("@"), "alamat surel tidak disalin ke antrean");
  // jalan kedua pada hari yang sama: tidak ada baris baru
  h = await jalankanPengingat(E, KINI + 3600e3, "https://uji.test");
  assert.equal(h.antre, 0); assert.equal(await cacah("surel_antre"), 1);
  // hari berikutnya tanpa perubahan baru: tidak ada surel
  h = await jalankanPengingat(E, KINI + HARI, "https://uji.test");
  assert.equal(h.antre, 0); assert.equal(await cacah("surel_antre"), 1, "perubahan yang sama tidak diantrekan dua kali");
  // perubahan baru sesudah penanda: satu surel baru, hanya butir yang baru
  ASET.regulasi.push({ id: "reg-1", judul: "Perubahan kedua", tanggal_ditetapkan: "2026-11-18" });
  h = await jalankanPengingat(E, KINI + 2 * HARI + 3600e3, "https://uji.test");
  assert.equal(h.antre, 1);
  const baru = await satu("SELECT isi FROM surel_antre ORDER BY id DESC LIMIT 1");
  assert.match(baru.isi, /Perubahan kedua/); assert.ok(!baru.isi.includes("Permen ESDM tentang PLTS Atap"));
  assert.equal(await cacah("surel_antre", "WHERE status <> 'antre'"), 0, "tidak ada yang berstatus terkirim");
  assert.deepEqual(KELUAR, [], "tidak ada panggilan jaringan keluar");
});

test("plafon pengingat per jalan cron ditegakkan; D1 menolak pengingat untuk akun yang tidak memilih", async () => {
  assert.ok(hak.PLAFON_PENGINGAT > 0 && hak.PLAFON_PENGINGAT <= 500);
  await q("DELETE FROM langganan WHERE surel = 'c@keluar.test'").run();
  assert.equal((await hak.sistem.pengingatCalon(E)).length, 2, "a dan c kini calon");
  assert.equal((await hak.sistem.pengingatCalon(E, 1)).length, 1, "plafon 1 = satu akun");
  assert.ok((await hak.sistem.pengingatCalon(E, 99999)).length <= hak.PLAFON_PENGINGAT);
  await assert.rejects(q("INSERT INTO surel_antre (jenis, akun_id, kunci, subjek, isi) VALUES ('pengingat', ?, 'p:x:1', 'subjek uji', 'isi yang cukup panjang')", AKUN.b).run(), "b tidak memilih pengingat");
  await assert.rejects(q("INSERT INTO surel_antre (jenis, akun_id, langganan_id, kunci, subjek, isi) VALUES ('pengingat', ?, 1, 'p:x:2', 'subjek uji', 'isi yang cukup panjang')", AKUN.a).run(), "bentuk baris tidak sah");
});

test("tautan berhenti pengingat: tanpa sesi, token sah mematikan semua pilihan dan membatalkan antrean; token salah 404", async () => {
  const token = await tokenIngat(E, AKUN.a);
  assert.match(token, /^p\d+\.[0-9a-f]{32}$/);
  assert.equal(await st("POST", "/api/langganan/berhenti", { badan: { token: token.slice(0, -1) + (token.at(-1) === "0" ? "1" : "0") } }), 404);
  assert.equal(await st("POST", "/api/langganan/berhenti", { badan: { token: `p${AKUN.c}.${token.split(".")[1]}` } }), 404, "token akun lain");
  assert.equal(await cacah("ikuti_surel", "WHERE akun_id = ?", AKUN.a), 2);
  assert.equal(await st("POST", "/api/langganan/berhenti", { badan: { token } }), 200);
  assert.equal(await cacah("ikuti_surel", "WHERE akun_id = ?", AKUN.a), 0);
  assert.equal(await cacah("surel_antre", "WHERE akun_id = ? AND status = 'antre'", AKUN.a), 0);
  assert.ok(await cacah("surel_antre", "WHERE akun_id = ? AND status = 'batal'", AKUN.a) >= 1);
  assert.equal(await cacah("ikuti", "WHERE akun_id = ?", AKUN.a), 2, "tetap mengikuti; hanya surelnya yang mati");
  assert.ok(!(await hak.sistem.pengingatCalon(E)).some((x) => x.id === AKUN.a));
});

/* ---------------- F65-216 buletin ---------------- */
test("buletin murni: dirakit dari data yang ada; tanpa butir tidak ada draf; minggu ISO", () => {
  assert.equal(mingguIso(KINI), "2026-W47");
  assert.equal(mingguIso(Date.parse("2027-01-01T05:00:00Z")), "2026-W53");
  assert.equal(susunBuletin({ berita: [], regulasi: [], acara: [] }, KINI), null);
  const s = susunBuletin({ berita: [{ judul: "Berita Lama", terbit: "2026-10-01T00:00:00Z", url: "https://m.test/a" }, { judul: "PLTS Baru Beroperasi", terbit: "2026-11-15T00:00:00Z", url: "https://m.test/b", media: "Media Uji" }],
    regulasi: [{ id: "r1", judul: "Perpres Uji", tanggal_ditetapkan: "2026-11-12" }], acara: [{ judul: "Seminar Uji", tanggal: "2026-11-20" }, { judul: "Sudah lewat", tanggal: "2026-11-01" }] }, KINI);
  assert.deepEqual(s.hitung, { berita: 1, regulasi: 1, acara: 1 });
  assert.match(s.isi, /PLTS Baru Beroperasi/); assert.match(s.isi, /Perpres Uji/); assert.match(s.isi, /Seminar Uji/);
  assert.ok(!s.isi.includes("Berita Lama") && !s.isi.includes("Sudah lewat"));
});

test("buletin: cron hanya merakit draf (Senin, sekali per minggu); tidak ada antrean tanpa persetujuan admin; setuju mengantrekan hanya ke pelanggan aktif", async () => {
  ASET.berita = [{ judul: "PLTS Baru Beroperasi", terbit: "2026-11-15T00:00:00Z", url: "https://m.test/b" }];
  ASET.kalender = [{ judul: "Seminar Uji", tanggal: "2026-11-20" }];
  assert.deepEqual(await buletinTerjadwal(E, KINI + HARI), { bukanSenin: true });
  assert.deepEqual(await buletinTerjadwal(E, KINI), { minggu: "2026-W47", baru: 1 });
  assert.equal((await rakitBuletin(E, KINI + 3600e3)).baru, 0, "minggu yang sama tidak membuat draf kedua");
  const draf = await satu("SELECT id, status, penerima FROM surel_draf");
  assert.equal(draf.status, "draf"); assert.equal(draf.penerima, null);
  const sebelum = await cacah("surel_antre", "WHERE jenis = 'buletin'");
  assert.equal(sebelum, 0, "merakit draf tidak mengantrekan apa pun");
  for (const [s, st_] of [["aktif1@l.test", "aktif"], ["aktif2@l.test", "aktif"], ["henti@l.test", "berhenti"]]) await q("INSERT INTO langganan (surel, nama, status, token_berhenti) VALUES (?, 'Pelanggan', ?, ?)", s, st_, (await sha(s))).run();
  const aktif = (await satu("SELECT id FROM langganan WHERE status = 'aktif' LIMIT 1")).id;
  await assert.rejects(q("INSERT INTO surel_antre (jenis, langganan_id, draf_id, kunci, subjek, isi) VALUES ('buletin', ?, ?, 'b:x:1', 'subjek uji', 'isi yang cukup panjang')", aktif, draf.id).run(), "draf belum disetujui: D1 menolak");
  const r = await isi("GET", "/api/admin/surel-keluar", { peran: "admin" });
  assert.equal(r.kirim_aktif, false); assert.equal(r.pelanggan_aktif, 2); assert.equal(r.draf[0].status, "draf"); assert.match(r.draf[0].isi, /PLTS Baru Beroperasi/);
  assert.equal(await st("POST", `/api/admin/buletin/${draf.id}`, { peran: "admin", badan: { aksi: "kirim" } }), 422);
  const p = await isi("POST", `/api/admin/buletin/${draf.id}`, { peran: "admin", badan: { aksi: "setuju" } });
  assert.deepEqual(p, { ok: true, antre: 2 });
  assert.equal(await st("POST", `/api/admin/buletin/${draf.id}`, { peran: "admin", badan: { aksi: "setuju" } }), 409, "hanya dari draf");
  assert.equal(await cacah("surel_antre", "WHERE jenis = 'buletin'"), 2);
  assert.equal(await cacah("surel_antre", "WHERE jenis = 'buletin' AND langganan_id IN (SELECT id FROM langganan WHERE status = 'berhenti')"), 0, "yang berhenti langganan tidak masuk");
  const d2 = await satu("SELECT status, penerima, diputus_oleh FROM surel_draf WHERE id = ?", draf.id);
  assert.deepEqual(d2, { status: "disetujui", penerima: 2, diputus_oleh: AKUN.admin });
  assert.equal((await satu("SELECT aksi FROM jejak WHERE tabel = 'surel_draf' ORDER BY id DESC LIMIT 1")).aksi, "tinjau");
  // draf minggu lain dibatalkan: tidak ada antrean
  await hak.sistem.buletinDrafBuat(E, "2026-W48", "Kabar METI 2026-W48", "isi draf minggu berikutnya");
  const id2 = (await satu("SELECT id FROM surel_draf WHERE minggu = '2026-W48'")).id;
  assert.deepEqual(await isi("POST", `/api/admin/buletin/${id2}`, { peran: "admin", badan: { aksi: "batal" } }), { ok: true, antre: 0 });
  assert.equal(await cacah("surel_antre", "WHERE draf_id = ?", id2), 0);
  assert.equal(await cacah("surel_antre", "WHERE status = 'terkirim'"), 0, "tidak ada yang terkirim");
  assert.deepEqual(KELUAR, [], "tidak ada panggilan jaringan keluar");
});

test("tidak ada pengirim surel di kode: tanpa host atau kunci penyedia di src", () => {
  const dir = new URL("../src/", import.meta.url);
  for (const f of readdirSync(dir).filter((x) => x.endsWith(".js"))) {
    const s = readFileSync(new URL(f, dir), "utf8");
    assert.ok(!/resend\.com|brevo\.com|sendgrid|mailgun|amazonses|mailchannels|send_email|RESEND_|BREVO_|SENDGRID_/i.test(s), f + " memuat penyedia surel");
  }
  assert.ok(!/\bfetch\(/.test(readFileSync(new URL("surel_keluar.js", dir), "utf8").replace(/env\.ASSETS\.fetch\(/g, "")), "surel_keluar.js tidak boleh memanggil jaringan");
});

test("tinjauan keamanan: laporan menunggu paling banyak 5 per akun; akun tanpa butir baru tidak menahan giliran pengingat", async () => {
  await tambahAkun("banjir");
  const kode = [];
  for (let i = 0; i < 6; i++) kode.push(await st("POST", `/api/proyek/pj_9${i}00/laporan`, { peran: "banjir", badan: { isi: LAPORAN } }));
  assert.deepEqual(kode, [201, 201, 201, 201, 201, 409], "laporan keenam yang masih menunggu ditolak");
  assert.equal(await cacah("laporan_warga", "WHERE akun_id = ? AND status = 'menunggu'", AKUN.banjir), 5);
  const lama = 1000, baru = Math.floor(Date.now() / 1000);
  assert.equal((await hak.sistem.pengingatLewati(E, AKUN.banjir, baru)).ubah, 1);
  assert.equal((await satu("SELECT terakhir FROM surel_penanda WHERE akun_id = ?", AKUN.banjir)).terakhir, baru);
  await hak.sistem.pengingatLewati(E, AKUN.banjir, lama);
  assert.equal((await satu("SELECT terakhir FROM surel_penanda WHERE akun_id = ?", AKUN.banjir)).terakhir, baru, "penanda tidak pernah mundur");
  assert.equal(KELUAR.length, 0);
});
