// minat.test.mjs (F65-303, 302, 306, 307 bagian B): papan minat REC dan karbon, minat stan pameran, antrean cek fakta, sertifikasi isian sendiri.
// Lewat worker.fetch utuh di D1 lokal NYATA (CHECK, trigger, indeks unik, jejak). Tidak ada mock D1.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buatEnv, pecahSql } from "./_bantu.mjs";
import worker from "../src/worker.js";
import * as hak from "../src/hak.js";
import { sha } from "../src/util.js";
import { periksaUnit, periksaStan, periksaKlaim, periksaPutusan } from "../src/kiriman.js";
import { REC_TEK, REG_KARBON, REG_KELAS, PUTUSAN } from "../public/inti/minat_enum.js";

let E, tutup;
const COOKIE = {}, AKUN = {};
const q = (s, ...b) => E.DB.prepare(s).bind(...b);
const satu = (s, ...b) => q(s, ...b).first();
const cacah = async (t, w = "", ...b) => (await satu(`SELECT count(*) AS n FROM ${t} ${w}`, ...b)).n;
const baca = (f) => JSON.parse(readFileSync(new URL("../public/data/" + f, import.meta.url), "utf8"));

async function tambahAkun(kunci, peran = "anggota") {
  const r = await q("INSERT INTO akun (surel, nama, peran, status, garam, sandi, iterasi) VALUES (?,?,?, 'aktif', ?, ?, 100000)", `${kunci}@minat.test`, "Nama " + kunci, peran, "a".repeat(32), "a".repeat(64)).run();
  const token = (Object.keys(COOKIE).length + 60).toString(16).padStart(2, "0").repeat(32);
  await hak.catatSesi(E, { idHash: await sha(token), akunId: r.meta.last_row_id, sampai: Math.floor(Date.now() / 1000) + 3600, ipHash: "h" });
  COOKIE[kunci] = `sesi=${token}`; AKUN[kunci] = r.meta.last_row_id;
}
async function panggil(metode, jalur, { peran = null, badan } = {}) {
  const h = { origin: "https://uji.test", "cf-connecting-ip": "203.0.113.31" };
  if (peran) h.cookie = COOKIE[peran];
  if (metode !== "GET") h["x-pb"] = "1";
  let body;
  if (badan !== undefined) { body = JSON.stringify(badan); h["content-type"] = "application/json"; }
  return worker.fetch(new Request("https://uji.test" + jalur, { method: metode, headers: h, body }), E, { waitUntil() {} });
}
const st = async (...a) => (await panggil(...a)).status;
const isi = async (...a) => (await panggil(...a)).json();
const putus = (jenis, id, aksi, alasan, peran = "admin") => st("POST", `/api/admin/kiriman/${jenis}/${id}`, { peran, badan: alasan ? { aksi, alasan } : { aksi } });

const UNIT = { jenis: "rec", arah: "beli", volume: 12000, rujukan: "surya", prov: "32", uraian: "Mencari REC surya untuk kebutuhan pabrik mulai tahun depan." };
const STAN = { organisasi: "PT Uji Surya", kebutuhan: "Memamerkan inverter dan struktur pemasangan atap." };
const KLAIM = { kutipan: "Bauran energi terbarukan kita sudah melampaui target tahun ini.", penutur: "Pejabat Uji", sumber_url: "https://contoh-media.example/berita/1", tanggal: "2026-10-01" };
const VONIS = { putusan: "keliru", penjelasan: "Angka resmi terakhir masih di bawah target yang ditetapkan dokumen kebijakan.", sumber: ["https://sumber-resmi.example/laporan"] };

before(async () => {
  ({ env: E, tutup } = await buatEnv());
  await tambahAkun("admin", "admin"); await tambahAkun("pengurus", "pengurus");
  for (const k of ["a", "b", "c"]) await tambahAkun(k);
  await q("INSERT INTO org_klaim (akun_id, organisasi_id, status, diputus_pada, diputus_oleh) VALUES (?, 'org_a', 'setuju', unixepoch(), ?)", AKUN.a, AKUN.admin).run();
  await q("INSERT INTO event_atur (event_id, terbuka) VALUES ('acara-uji', 1)").run();
});
after(async () => { await tutup?.(); });

test("migrasi 0042 dijalankan dua kali tanpa galat", async () => {
  for (const s of pecahSql(readFileSync(new URL("../migrations/0042_minat_fakta.sql", import.meta.url), "utf8"))) await E.DB.prepare(s).run();
});

test("enum papan minat cocok dengan data: teknologi dari proyek.json, registri dari karbon_registri.json", () => {
  const tek = new Set(baca("proyek.json").baris.map((p) => p.teknologi).filter(Boolean));
  for (const k of REC_TEK) assert.ok(tek.has(k), "teknologi tak dikenal: " + k);
  const kelas = new Set(baca("karbon_registri.json").baris.flatMap((r) => r.registri.map((g) => REG_KELAS(g.nama))));
  assert.deepEqual([...kelas].sort(), [...REG_KARBON].sort());
  assert.deepEqual(hak.PUTUSAN_FAKTA, PUTUSAN);
});

test("hak: tiga sumber daya baru seperti kiriman lain; tamu 401; tinjau dan putusan hanya admin dan super", async () => {
  const sel = (p, jenis) => ["baca", "tambah", "ubah", "hapus"].filter((x) => hak.boleh(p, x, jenis, undefined, { peran: p, status: "aktif" }).ok);
  for (const jenis of ["minat_unit", "event_stan", "cek_fakta"]) {
    assert.deepEqual(sel("publik", jenis), [], jenis);
    for (const p of ["anggota", "pengurus", "kurator", "wilayah", "admin", "super"]) assert.deepEqual(sel(p, jenis), ["baca", "tambah", "ubah"], jenis + " " + p);
  }
  for (const [m, j, b] of [["GET", "/api/minat-unit"], ["POST", "/api/minat-unit", UNIT], ["POST", "/api/event/acara-uji/stan", STAN], ["GET", "/api/cek-fakta"], ["POST", "/api/cek-fakta", KLAIM], ["POST", "/api/admin/cek-fakta/1", VONIS]]) assert.equal(await st(m, j, { badan: b }), 401, j);
  for (const p of ["a", "pengurus"]) assert.equal(await st("POST", "/api/admin/cek-fakta/1", { peran: p, badan: VONIS }), 403, p);
});

test("validasi murni: enum, rentang, tautan https, tanggal nyata, tanpa surel atau telepon", () => {
  const tolak = (f, b) => assert.throws(() => f(b), undefined, JSON.stringify(b));
  assert.deepEqual(periksaUnit(UNIT), { ...UNIT, organisasi_id: null });
  for (const b of [{ ...UNIT, jenis: "emas" }, { ...UNIT, arah: "tukar" }, { ...UNIT, volume: 0 }, { ...UNIT, volume: 1.5 }, { ...UNIT, volume: 2e9 }, { ...UNIT, rujukan: "verra" }, { ...UNIT, jenis: "karbon", rujukan: "surya" },
    { ...UNIT, prov: "99" }, { ...UNIT, uraian: "pendek" }, { ...UNIT, uraian: "Hubungi saya di orang@contoh.id segera ya." }, { ...UNIT, harga: 1 }, { ...UNIT, organisasi_id: "a b" }]) tolak(periksaUnit, b);
  assert.equal(periksaUnit({ ...UNIT, jenis: "karbon", rujukan: "verra" }).rujukan, "verra");
  for (const b of [{ ...STAN, organisasi: "x" }, { ...STAN, kebutuhan: "pendek" }, { ...STAN, harga: 1 }, { ...STAN, kebutuhan: "Telepon 0812 3456 7890 untuk rincian stan kami." }]) tolak(periksaStan, b);
  const kini = Date.parse("2026-11-15T00:00:00Z");
  assert.equal(periksaKlaim(KLAIM, kini).tanggal, "2026-10-01");
  for (const b of [{ ...KLAIM, sumber_url: "http://tidak-aman.example/x" }, { ...KLAIM, sumber_url: "javascript:alert(1)" }, { ...KLAIM, sumber_url: "https://u:p@jahat.example/" }, { ...KLAIM, tanggal: "2026-02-30" },
    { ...KLAIM, tanggal: "2027-01-01" }, { ...KLAIM, tanggal: "1999-12-31" }, { ...KLAIM, kutipan: "pendek" }, { ...KLAIM, penutur: "" }, { ...KLAIM, putusan: "benar" }]) assert.throws(() => periksaKlaim(b, kini), undefined, JSON.stringify(b));
  for (const b of [{ ...VONIS, sumber: [] }, { ...VONIS, sumber: ["http://x.example"] }, { ...VONIS, sumber: "https://x.example" }, { ...VONIS, putusan: "mungkin" }, { ...VONIS, penjelasan: "pendek" },
    { ...VONIS, sumber: Array.from({ length: 6 }, (_, i) => `https://s${i}.example/`) }]) tolak(periksaPutusan, b);
});

/* ---------------- F65-303 papan minat ---------------- */
test("papan minat: tidak tampil sebelum disetujui; tanpa nama dan tanpa akun pengirim; nama organisasi hanya bila dicentang DAN berklaim", async () => {
  const id = (await isi("POST", "/api/minat-unit", { peran: "b", badan: UNIT })).id;
  assert.ok(id);
  assert.equal(await st("POST", "/api/minat-unit", { peran: "b", badan: UNIT }), 409, "satu aktif per jenis dan arah");
  assert.equal(await st("POST", "/api/minat-unit", { peran: "b", badan: { ...UNIT, arah: "jual" } }), 201, "arah lain boleh");
  assert.equal((await isi("GET", "/api/minat-unit", { peran: "c" })).baris.length, 0, "menunggu tidak tampil");
  assert.equal(await putus("unit", id, "setuju", null, "a"), 403, "tinjau oleh bukan admin");
  assert.equal(await putus("unit", id, "setuju"), 200);
  const b = (await isi("GET", "/api/minat-unit", { peran: "c" })).baris;
  assert.equal(b.length, 1);
  assert.deepEqual(Object.keys(b[0]).sort(), ["arah", "dibuat", "id", "jenis", "organisasi_id", "prov", "rujukan", "uraian", "volume"]);
  assert.equal(b[0].organisasi_id, null);
  assert.ok(!JSON.stringify(b).includes("Nama b"), "nama pengirim tidak keluar");
  // organisasi: bukan klaimnya = 403; klaimnya = tersimpan dan tampil
  assert.equal(await st("POST", "/api/minat-unit", { peran: "c", badan: { ...UNIT, organisasi_id: "org_a" } }), 403);
  const ida = (await isi("POST", "/api/minat-unit", { peran: "a", badan: { ...UNIT, jenis: "karbon", rujukan: "verra", organisasi_id: "org_a" } })).id;
  assert.equal(await putus("unit", ida, "setuju"), 200);
  assert.equal((await isi("GET", "/api/minat-unit", { peran: "c" })).baris.find((r) => r.id === ida).organisasi_id, "org_a");
  // tarik milik orang lain = 404; milik sendiri = hilang dari papan
  assert.equal(await st("DELETE", `/api/kiriman/unit/${id}`, { peran: "c" }), 404);
  assert.equal(await st("DELETE", `/api/kiriman/unit/${id}`, { peran: "b" }), 200);
  assert.ok(!(await isi("GET", "/api/minat-unit", { peran: "c" })).baris.some((r) => r.id === id));
  assert.ok((await cacah("jejak", "WHERE tabel = 'minat_unit'")) >= 5, "kirim, tinjau, dan tarik dijejak");
});

/* ---------------- F65-302 minat stan ---------------- */
test("minat stan: hanya acara berpengaturan; satu aktif per akun per acara; batas menunggu per akun; HTML tersimpan sebagai teks", async () => {
  assert.equal(await st("POST", "/api/event/acara-tak-ada/stan", { peran: "b", badan: STAN }), 404);
  assert.equal(await st("POST", "/api/event/Acara_Aneh/stan", { peran: "b", badan: STAN }), 404);
  const html = { organisasi: "PT <b>Tebal</b>", kebutuhan: "<script>alert(1)</script> stan sudut dekat panggung utama." };
  const id = (await isi("POST", "/api/event/acara-uji/stan", { peran: "b", badan: html })).id;
  assert.equal((await satu("SELECT organisasi FROM event_stan WHERE id = ?", id)).organisasi, "PT <b>Tebal</b>", "disimpan apa adanya sebagai teks");
  assert.equal(await st("POST", "/api/event/acara-uji/stan", { peran: "b", badan: STAN }), 409);
  await assert.rejects(q("INSERT INTO event_stan (akun_id, event_id, organisasi, kebutuhan) VALUES (?, 'tanpa-atur', 'PT Uji', 'kebutuhan yang cukup panjang')", AKUN.c).run(), /tidak boleh/, "trigger menolak acara tanpa pengaturan");
  for (let i = 0; i < 6; i++) await q("INSERT INTO event_atur (event_id, terbuka) VALUES (?, 1)", "acara-" + i).run();
  const kode = [];
  for (let i = 0; i < 6; i++) kode.push(await st("POST", `/api/event/acara-${i}/stan`, { peran: "c", badan: STAN }));
  assert.deepEqual(kode, [201, 201, 201, 201, 201, 409], "minat keenam yang masih menunggu ditolak");
  const antre = await isi("GET", "/api/admin/kiriman?jenis=stan&status=menunggu", { peran: "admin" });
  assert.equal(antre.total, 6);
  assert.equal(await st("GET", "/api/admin/kiriman?jenis=stan&status=menunggu", { peran: "b" }), 403);
  assert.equal(await putus("stan", id, "tolak", "Stan sudah penuh menurut penyelenggara."), 200);
  assert.equal((await isi("GET", "/api/kiriman/saya", { peran: "b" })).stan[0].status, "ditolak");
});

/* ---------------- F65-306 cek fakta ---------------- */
test("cek fakta: klaim belum diputus tidak tampil; putusan wajib sumber https; setuju biasa ditolak; putusan tampil tanpa pengaju; yang diputus tidak bisa ditarik", async () => {
  const id = (await isi("POST", "/api/cek-fakta", { peran: "b", badan: { ...KLAIM, kutipan: "<img src=x onerror=alert(1)> bauran sudah melampaui target tahun ini." } })).id;
  assert.ok(id);
  assert.equal((await isi("GET", "/api/cek-fakta", { peran: "c" })).total, 0, "menunggu tidak tampil");
  assert.equal(await putus("fakta", id, "setuju"), 422, "klaim tidak bisa sekadar disetujui tanpa putusan");
  for (const b of [{ ...VONIS, sumber: [] }, { ...VONIS, sumber: ["http://tidak-aman.example"] }, { putusan: "keliru", penjelasan: VONIS.penjelasan }]) assert.equal(await st("POST", `/api/admin/cek-fakta/${id}`, { peran: "admin", badan: b }), 422, JSON.stringify(b));
  assert.equal((await satu("SELECT status FROM cek_fakta WHERE id = ?", id)).status, "menunggu");
  await assert.rejects(q("UPDATE cek_fakta SET status = 'disetujui', diputus_pada = unixepoch() WHERE id = ?", id).run(), /CHECK/i, "D1 menolak 'disetujui' tanpa putusan, penjelasan, dan sumber");
  assert.equal(await st("POST", `/api/admin/cek-fakta/${id}`, { peran: "admin", badan: VONIS }), 200);
  assert.equal(await st("POST", `/api/admin/cek-fakta/${id}`, { peran: "admin", badan: VONIS }), 409, "hanya dari menunggu");
  const d = await isi("GET", "/api/cek-fakta", { peran: "c" });
  assert.equal(d.total, 1);
  assert.deepEqual(Object.keys(d.baris[0]).sort(), ["diputus_pada", "id", "kutipan", "penjelasan", "penutur", "putusan", "sumber", "sumber_url", "tanggal"]);
  assert.deepEqual(d.baris[0].sumber, VONIS.sumber);
  assert.ok(d.baris[0].kutipan.startsWith("<img"), "teks polos apa adanya; layar yang meng-escape");
  assert.ok(!JSON.stringify(d).includes("Nama b"), "pengaju tidak keluar");
  assert.equal(await st("DELETE", `/api/kiriman/fakta/${id}`, { peran: "b" }), 404, "yang sudah diputus tidak bisa ditarik pengaju");
  // klaim lain: ditolak dengan alasan, tidak tampil; milik sendiri yang menunggu bisa ditarik
  const id2 = (await isi("POST", "/api/cek-fakta", { peran: "c", badan: KLAIM })).id;
  assert.equal(await putus("fakta", id2, "tolak", "Bukan klaim yang bisa diperiksa."), 200);
  const id3 = (await isi("POST", "/api/cek-fakta", { peran: "c", badan: KLAIM })).id;
  assert.equal(await st("DELETE", `/api/kiriman/fakta/${id3}`, { peran: "b" }), 404);
  assert.equal(await st("DELETE", `/api/kiriman/fakta/${id3}`, { peran: "c" }), 200);
  assert.equal((await isi("GET", "/api/cek-fakta", { peran: "a" })).total, 1);
  assert.equal(await cacah("jejak", "WHERE tabel = 'cek_fakta' AND aksi = 'tinjau'"), 2, "putusan dan penolakan dijejak");
});

test("layar meng-escape data luar: tidak ada penyisipan mentah di papan minat, stan, cek fakta, dan antrean admin", () => {
  const kr = readFileSync(new URL("../public/kiriman.js", import.meta.url), "utf8");
  const awal = kr.indexOf("export async function pasangUnit");
  assert.ok(awal > 0);
  const baru = kr.slice(awal) + readFileSync(new URL("../public/admin_kiriman.js", import.meta.url), "utf8");
  for (const kolom of ["r.uraian", "r.kutipan", "r.penjelasan", "r.penutur", "r.organisasi", "r.kebutuhan"]) {
    const mentah = [...baru.matchAll(/\$\{([^{}]*)\}/g)].map((m) => m[1].trim()).filter((x) => x === kolom);
    assert.deepEqual(mentah, [], kolom + " disisipkan tanpa esc");
  }
  assert.match(baru, /rel="noopener noreferrer"/);
  assert.doesNotMatch(baru, /innerHTML\s*=\s*r\./);
});

/* ---------------- F65-307 bagian B: sertifikasi isian sendiri ---------------- */
test("sertifikasi isian sendiri: nomor dan tautan bukti https opsional; tautan tak aman dan isian terlalu panjang ditolak; layar selalu melabeli belum diverifikasi", async () => {
  const kirim = (isiRw, peran = "a") => panggil("POST", "/api/profil/saya/riwayat", { peran, badan: { jenis: "sertifikasi", isi: isiRw } });
  const r = await kirim({ nama: "Ahli K3 Listrik", penerbit: "Lembaga Uji", nomor: "K3-2025-0042", tahun: 2025, bukti_url: "https://lembaga-uji.example/sertifikat/42" });
  assert.equal(r.status, 201);
  assert.equal((await kirim({ nama: "Tanpa bukti" })).status, 201);
  for (const b of [{ nama: "x", bukti_url: "javascript:alert(1)" }, { nama: "x", bukti_url: "https://u:p@jahat.example/" }, { nama: "x", nomor: "n".repeat(61) }, { nama: "n".repeat(121) }, { penerbit: "tanpa nama" }])
    assert.equal((await kirim(b)).status, 422, JSON.stringify(b));
  const p = await isi("GET", "/api/profil/" + AKUN.a, { peran: "b" });
  const s = p.riwayat.sertifikasi.find((x) => x.nomor);
  assert.equal(s.nomor, "K3-2025-0042"); assert.equal(s.bukti_url, "https://lembaga-uji.example/sertifikat/42");
  for (const f of ["profil_tampil.js", "profil-saya.js"]) assert.match(readFileSync(new URL("../public/" + f, import.meta.url), "utf8"), /sertLabelHtml\(x\)/, f + " menampilkan label");
  const id = JSON.parse(readFileSync(new URL("../public/i18n/id.json", import.meta.url), "utf8")), en = JSON.parse(readFileSync(new URL("../public/i18n/en.json", import.meta.url), "utf8"));
  assert.match(id["pf.sert.belum"], /belum diverifikasi/); assert.match(en["pf.sert.belum"], /not verified/);
});
