// profil-saya.test.mjs: Profil saya lewat worker.fetch utuh, D1 lokal NYATA (migrasi 0018, trigger, jejak, hak). R2 BERKAS ditiru Map kecil (uji tidak menyentuh R2 sungguhan).
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { buatEnv } from "./_bantu.mjs";
import worker from "../src/worker.js";
import * as hak from "../src/hak.js";
import { sha } from "../src/util.js";

let E, tutup;
const COOKIE = {}, AKUN = {}, TOKEN = {};
const R2 = new Map();
const q = (s, ...b) => E.DB.prepare(s).bind(...b);
const satu = (s, ...b) => q(s, ...b).first();

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);

async function tambahAkun(kunci, peran) {
  const r = await q("INSERT INTO akun (surel, nama, peran, status, garam, sandi, iterasi) VALUES (?,?,?, 'aktif', ?, ?, 100000)",
    `${kunci}@uji.test`, kunci, peran, "a".repeat(32), "a".repeat(64)).run();
  const token = (Object.keys(COOKIE).length + 30).toString(16).repeat(32);
  await hak.catatSesi(E, { idHash: await sha(token), akunId: r.meta.last_row_id, sampai: Math.floor(Date.now() / 1000) + 3600, ipHash: "h" });
  COOKIE[kunci] = `sesi=${token}`; AKUN[kunci] = r.meta.last_row_id; TOKEN[kunci] = token;
}
before(async () => {
  ({ env: E, tutup } = await buatEnv());
  E.BERKAS = {
    put: async (k, v, o) => { R2.set(k, { v, tipe: o?.httpMetadata?.contentType }); },
    get: async (k) => { const x = R2.get(k); return x ? { body: x.v, httpMetadata: { contentType: x.tipe } } : null; },
    delete: async (k) => { R2.delete(k); },
  };
  for (const [k, p] of [["ani", "anggota"], ["budi", "anggota"], ["adm", "admin"]]) await tambahAkun(k, p);
});
after(async () => { await tutup?.(); });

async function panggil(metode, jalur, { siapa = null, badan, mentah, tipe, header = {} } = {}) {
  const h = { origin: "https://uji.test", "cf-connecting-ip": "203.0.113.7", ...header };
  if (siapa) h.cookie = COOKIE[siapa];
  if (metode !== "GET") h["x-pb"] = "1";
  let body;
  if (badan !== undefined) { body = JSON.stringify(badan); h["content-type"] = "application/json"; }
  if (mentah !== undefined) { body = mentah; h["content-type"] = tipe ?? "application/octet-stream"; }
  return worker.fetch(new Request("https://uji.test" + jalur, { method: metode, headers: h, body }), E, { waitUntil() {} });
}
const ubah = (siapa, badan) => panggil("PUT", "/api/profil/saya", { siapa, badan });
const lihat = async (siapa, id) => (await panggil("GET", "/api/profil/" + id, { siapa })).json();

test("tamu: halaman 302 ke masuk, API 401 di semua rute profil", async () => {
  for (const j of ["/profil-saya", "/anggota/1"]) {
    const r = await panggil("GET", j);
    assert.equal(r.status, 302); assert.match(r.headers.get("location"), /^\/masuk\?ke=/);
  }
  for (const [m, j, b] of [["GET", "/api/profil/saya"], ["PUT", "/api/profil/saya", {}], ["POST", "/api/profil/saya/foto"], ["DELETE", "/api/profil/saya/foto"],
    ["POST", "/api/profil/saya/riwayat", {}], ["PUT", "/api/profil/saya/riwayat/1", {}], ["DELETE", "/api/profil/saya/riwayat/1"],
    ["GET", "/api/profil/saya/sesi"], ["POST", "/api/profil/saya/sesi/keluar-lain", {}], ["GET", "/api/profil/1"], ["GET", "/api/profil/1/foto"]]) {
    assert.equal((await panggil(m, j, { badan: b })).status, 401, `${m} ${j}`);
  }
});

test("akun menyimpan profil sendiri; id akun dari badan ditolak; profil orang lain tak berubah", async () => {
  const r = await ubah("ani", { gelar: "Ir.", jabatan: "Analis", instansi: "PT Contoh", kota: "Bandung", kode_prov: "32", bio: "Tentang <b>saya</b>", keahlian: ["surya", "Surya", "bayu"], tautan: { linkedin: "linkedin.com/in/ani", situs: "https://ani.example" }, telepon: "+62 812 3456" });
  assert.equal(r.status, 200);
  assert.equal((await ubah("ani", { akun_id: AKUN.budi, jabatan: "x" })).status, 422);
  assert.equal((await ubah("budi", { jabatan: "Peneliti" })).status, 200);
  const a = await (await panggil("GET", "/api/profil/saya", { siapa: "ani" })).json();
  assert.equal(a.jabatan, "Analis"); assert.equal(a.gelar, "Ir."); assert.deepEqual(a.keahlian, ["surya", "bayu"]);
  assert.equal(a.tautan.linkedin, "https://linkedin.com/in/ani");
  assert.equal(a.kontak.telepon, "+62 812 3456");
  assert.equal((await satu("SELECT jabatan FROM profil WHERE akun_id = ?", AKUN.budi)).jabatan, "Peneliti");
});

test("validasi: skema tautan, host LinkedIn, telepon, panjang bio, kunci tak dikenal", async () => {
  for (const b of [{ tautan: { situs: "javascript:alert(1)" } }, { tautan: { linkedin: "https://evil.example/in/x" } }, { tautan: { situs: "ftp://a.b" } },
    { telepon: "abc123" }, { bio: "x".repeat(601) }, { kode_prov: "ABC" }, { keahlian: "bukan-array" }, { privasi: { kontak: "publik" } }, { privasi: { rahasia: "semua" } }, { organisasi_id: "../x" }, {}]) {
    assert.equal((await ubah("ani", b)).status, 422, JSON.stringify(b));
  }
});

test("privasi: kontak bawaan hanya admin; bagian yang disetel admin-saja tersembunyi dari anggota lain; admin dan pemilik melihat semua", async () => {
  const dariBudi = await lihat("budi", AKUN.ani);
  assert.equal(dariBudi.nama, "ani"); assert.equal(dariBudi.jabatan, "Analis");
  assert.equal("kontak" in dariBudi, false, "kontak bocor ke anggota lain");
  assert.equal("privasi" in dariBudi, false);
  assert.equal(JSON.stringify(dariBudi).includes("ani@uji.test"), false);
  assert.equal((await ubah("ani", { privasi: { pekerjaan: "admin", bio: "admin" } })).status, 200);
  const sembunyi = await lihat("budi", AKUN.ani);
  for (const k of ["jabatan", "instansi", "gelar", "bio"]) assert.equal(k in sembunyi, false, k);
  assert.equal(sembunyi.kota, "Bandung");
  const dariAdm = await lihat("adm", AKUN.ani);
  assert.equal(dariAdm.jabatan, "Analis"); assert.equal(dariAdm.kontak.surel, "ani@uji.test"); assert.equal(dariAdm.privasi.kontak, "admin");
  const diri = await lihat("ani", "saya");
  assert.equal(diri.bio, "Tentang <b>saya</b>"); assert.equal(diri.diri, true);
  assert.equal((await ubah("ani", { privasi: { kontak: "semua" } })).status, 200);
  assert.equal((await lihat("budi", AKUN.ani)).kontak.telepon, "+62 812 3456");
  assert.equal((await ubah("ani", { privasi: { kontak: "admin", pekerjaan: "semua", bio: "semua" } })).status, 200);
});

test("akun tak ada atau id tak sah = 404", async () => {
  assert.equal((await panggil("GET", "/api/profil/999999", { siapa: "ani" })).status, 404);
  assert.equal((await panggil("GET", "/api/profil/abc", { siapa: "ani" })).status, 404);
});

test("riwayat: tambah, ubah, hapus; milik orang lain 404; isi divalidasi; batas per jenis", async () => {
  const t = await panggil("POST", "/api/profil/saya/riwayat", { siapa: "ani", badan: { jenis: "pendidikan", isi: { jenjang: "s1", kampus: "ITB", jurusan: "Teknik Elektro", tahun: 2012 } } });
  assert.equal(t.status, 201); const { id } = await t.json();
  assert.equal((await panggil("PUT", `/api/profil/saya/riwayat/${id}`, { siapa: "budi", badan: { jenis: "pendidikan", isi: { jenjang: "s1", kampus: "UI" } } })).status, 404);
  assert.equal((await panggil("DELETE", `/api/profil/saya/riwayat/${id}`, { siapa: "budi" })).status, 404);
  assert.equal((await panggil("PUT", `/api/profil/saya/riwayat/${id}`, { siapa: "ani", badan: { jenis: "pendidikan", isi: { jenjang: "s2", kampus: "UGM", tahun: 2016 } } })).status, 200);
  assert.equal((await panggil("PUT", `/api/profil/saya/riwayat/${id}`, { siapa: "ani", badan: { jenis: "pengalaman", isi: { jabatan: "a", organisasi: "b", mulai: 2000 } } })).status, 404, "jenis harus cocok");
  for (const [jenis, isi] of [["pendidikan", { jenjang: "pakar", kampus: "x" }], ["pengalaman", { jabatan: "a", organisasi: "b", mulai: 2020, selesai: 2010 }], ["publikasi", { judul: "j", proyek_id: "a b" }], ["sertifikasi", {}], ["lain", {}]]) {
    assert.equal((await panggil("POST", "/api/profil/saya/riwayat", { siapa: "ani", badan: { jenis, isi } })).status, 422, jenis);
  }
  const p = await panggil("POST", "/api/profil/saya/riwayat", { siapa: "ani", badan: { jenis: "publikasi", isi: { judul: "Kajian PLTS", tahun: 2024, proyek_id: "pj_0001" } } });
  assert.equal(p.status, 201);
  const pro = await lihat("budi", AKUN.ani);
  assert.equal(pro.riwayat.pendidikan[0].kampus, "UGM"); assert.equal(pro.riwayat.publikasi[0].proyek_id, "pj_0001");
  assert.equal((await panggil("DELETE", `/api/profil/saya/riwayat/${id}`, { siapa: "ani" })).status, 200);
  for (let i = 0; i < 15; i++) await panggil("POST", "/api/profil/saya/riwayat", { siapa: "budi", badan: { jenis: "sertifikasi", isi: { nama: "S" + i } } });
  assert.equal((await panggil("POST", "/api/profil/saya/riwayat", { siapa: "budi", badan: { jenis: "sertifikasi", isi: { nama: "lebih" } } })).status, 409);
  await ubah("ani", { privasi: { riwayat: "admin" } });
  assert.equal("riwayat" in (await lihat("budi", AKUN.ani)), false);
  assert.ok((await lihat("adm", AKUN.ani)).riwayat);
  await ubah("ani", { privasi: { riwayat: "semua" } });
});

test("foto: bukan gambar ditolak, terlalu besar 413, gambar sah disimpan di profil/<id>.webp dan dilayani menurut privasi", async () => {
  assert.equal((await panggil("POST", "/api/profil/saya/foto", { siapa: "ani", mentah: new TextEncoder().encode("<svg onload=alert(1)></svg>"), tipe: "image/png" })).status, 415);
  assert.equal((await panggil("POST", "/api/profil/saya/foto", { siapa: "ani", mentah: new TextEncoder().encode("%PDF-1.4 hai"), tipe: "image/png" })).status, 415);
  assert.equal((await panggil("POST", "/api/profil/saya/foto", { siapa: "ani", mentah: new Uint8Array(0) })).status, 422);
  const besar = new Uint8Array(2 * 1024 * 1024 + 1); besar.set(PNG);
  assert.equal((await panggil("POST", "/api/profil/saya/foto", { siapa: "ani", mentah: besar, tipe: "image/png" })).status, 413);
  assert.equal(R2.size, 0, "berkas ditolak tak boleh masuk R2");
  assert.equal((await panggil("POST", "/api/profil/saya/foto", { siapa: "ani", mentah: PNG, tipe: "image/png" })).status, 201);
  assert.ok(R2.has(`profil/${AKUN.ani}.webp`));
  const diri = await panggil("GET", "/api/profil/saya/foto", { siapa: "ani" });
  assert.equal(diri.status, 200); assert.equal(diri.headers.get("content-type"), "image/png"); assert.equal(diri.headers.get("x-content-type-options"), "nosniff");
  assert.equal((await panggil("GET", `/api/profil/${AKUN.ani}/foto`, { siapa: "budi" })).status, 200);
  await ubah("ani", { privasi: { foto: "admin" } });
  assert.equal((await panggil("GET", `/api/profil/${AKUN.ani}/foto`, { siapa: "budi" })).status, 404);
  assert.equal((await panggil("GET", `/api/profil/${AKUN.ani}/foto`, { siapa: "adm" })).status, 200);
  assert.equal((await lihat("budi", AKUN.ani)).foto, undefined);
  assert.equal((await panggil("DELETE", "/api/profil/saya/foto", { siapa: "ani" })).status, 200);
  assert.equal(R2.size, 0);
  assert.equal((await panggil("GET", "/api/profil/saya/foto", { siapa: "ani" })).status, 404);
  await ubah("ani", { privasi: { foto: "semua" } });
});

test("jejak: perubahan tercatat tanpa isi pribadi", async () => {
  const baris = (await q("SELECT aksi, tabel, ke FROM jejak WHERE tabel LIKE 'profil%' AND siapa = ?", AKUN.ani).all()).results;
  assert.ok(baris.length >= 3);
  const semua = JSON.stringify(baris);
  assert.ok(/ubah profil: gelar,jabatan/.test(semua));
  for (const rahasia of ["Tentang <b>saya</b>", "+62 812 3456", "ani@uji.test", "Analis"]) assert.equal(semua.includes(rahasia), false, rahasia);
});

test("instansi dan telepon disalin ke akun_profil (Pustaka) dan profil lama dari Pustaka terbaca", async () => {
  const s = await satu("SELECT instansi, telepon FROM akun_profil WHERE akun_id = ?", AKUN.ani);
  assert.equal(s.instansi, "PT Contoh"); assert.equal(s.telepon, "+62 812 3456");
  await q("INSERT INTO akun_profil (akun_id, instansi, telepon) VALUES (?, 'Dari Pustaka', '021 555 0100')", AKUN.adm).run();
  const adm = await lihat("adm", "saya");
  assert.equal(adm.instansi, "Dari Pustaka"); assert.equal(adm.kontak.telepon, "021 555 0100");
  assert.equal((await ubah("adm", { privasi: { foto: "semua" } })).status, 200);
  assert.equal((await satu("SELECT instansi FROM akun_profil WHERE akun_id = ?", AKUN.adm)).instansi, "Dari Pustaka", "simpan privasi tak boleh menghapus instansi Pustaka");
});

test("lencana KTA muncul bila akun terkait KTA aktif; nomor hanya untuk pemilik dan admin", async () => {
  await q("INSERT INTO kta (akun_id, anggota_id, nomor_kta, tahun_masuk, jenis, nama_cetak, status, nonce) VALUES (?, 'a1', 'METI-2024-ABC-00001', 2024, 'individu', 'ani', 'aktif', ?)", AKUN.ani, "f".repeat(16)).run();
  assert.equal((await lihat("budi", AKUN.ani)).kta.nomor, undefined);
  assert.equal((await lihat("budi", AKUN.ani)).kta.jenis, "individu");
  assert.equal((await lihat("ani", "saya")).kta.nomor, "METI-2024-ABC-00001");
  assert.equal((await lihat("adm", AKUN.ani)).kta.nomor, "METI-2024-ABC-00001");
  assert.equal((await lihat("budi", AKUN.adm)).kta, null);
});

test("sesi aktif: daftar menandai perangkat ini; keluar dari perangkat lain mencabut sisanya", async () => {
  const token2 = "cd".repeat(32);
  await hak.catatSesi(E, { idHash: await sha(token2), akunId: AKUN.ani, sampai: Math.floor(Date.now() / 1000) + 3600, ipHash: "h" });
  const d = (await (await panggil("GET", "/api/profil/saya/sesi", { siapa: "ani" })).json()).sesi;
  assert.equal(d.length, 2); assert.equal(d.filter((s) => s.ini).length, 1);
  assert.equal(JSON.stringify(d).includes(token2), false);
  const r = await (await panggil("POST", "/api/profil/saya/sesi/keluar-lain", { siapa: "ani", badan: {} })).json();
  assert.equal(r.dicabut, 1);
  assert.equal((await panggil("GET", "/api/profil/saya", { siapa: "ani" })).status, 200, "sesi ini tetap hidup");
  assert.equal((await satu("SELECT count(*) AS n FROM sesi WHERE akun_id = ?", AKUN.budi)).n, 1, "sesi akun lain utuh");
});

test("CSRF: tulis tanpa x-pb ditolak; nonaktif tak bisa dilihat", async () => {
  const r = await worker.fetch(new Request("https://uji.test/api/profil/saya", { method: "PUT", headers: { cookie: COOKIE.ani, origin: "https://uji.test", "content-type": "application/json" }, body: "{}" }), E, { waitUntil() {} });
  assert.equal(r.status, 403);
  await q("UPDATE akun SET status = 'nonaktif' WHERE id = ?", AKUN.budi).run();
  assert.equal((await panggil("GET", `/api/profil/${AKUN.budi}`, { siapa: "adm" })).status, 404);
});

test("0019: bahasa, sampul (daftar putih), tautan akademik (https saja, host sesuai) disimpan di API profil", async () => {
  assert.equal((await ubah("ani", { bahasa: [{ nama: "Indonesia", tingkat: "ibu" }, { nama: "Inggris", tingkat: "mahir" }], sampul: "bayu-sidrap" })).status, 200);
  const a = await (await panggil("GET", "/api/profil/saya", { siapa: "ani" })).json();
  assert.deepEqual(a.bahasa, [{ nama: "Indonesia", tingkat: "ibu" }, { nama: "Inggris", tingkat: "mahir" }]);
  assert.equal(a.sampul, "bayu-sidrap");
  // mengubah bidang lain tidak menghapus bahasa/sampul; mengirim satu saja tidak menimpa yang lain
  assert.equal((await ubah("ani", { jabatan: "Analis 2" })).status, 200);
  assert.equal((await ubah("ani", { sampul: "surya-cirata" })).status, 200);
  const b = await (await panggil("GET", "/api/profil/saya", { siapa: "ani" })).json();
  assert.deepEqual([b.bahasa.length, b.sampul], [2, "surya-cirata"]);
  assert.equal((await ubah("ani", { sampul: null })).status, 200);
  assert.equal((await (await panggil("GET", "/api/profil/saya", { siapa: "ani" })).json()).sampul, null);
  for (const badan of [{ sampul: "../x" }, { sampul: "tak-ada" }, { bahasa: [{ nama: "X", tingkat: "dewa" }] }, { bahasa: [{ nama: "A", tingkat: "ibu" }, { nama: "a", tingkat: "ibu" }] },
    { bahasa: Array(9).fill({ nama: "B", tingkat: "ibu" }) }, { tautan: { orcid: "http://orcid.org/0000" } }, { tautan: { orcid: "https://evil.example/0000" } }, { tautan: { scholar: "https://orcid.org/x" } }, { tautan: { facebook: "https://facebook.com/x" } }])
    assert.equal((await ubah("ani", badan)).status, 422, JSON.stringify(badan));
  const t = await ubah("ani", { tautan: { linkedin: "https://linkedin.com/in/a", orcid: "https://orcid.org/0000-0001-2345-6789", scholar: "https://scholar.google.com/citations?user=abc", researchgate: "https://www.researchgate.net/profile/Ani" } });
  assert.equal(t.status, 200);
  assert.equal((await (await panggil("GET", "/api/profil/saya", { siapa: "ani" })).json()).tautan.orcid, "https://orcid.org/0000-0001-2345-6789");
});
