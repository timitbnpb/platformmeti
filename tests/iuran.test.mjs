// iuran.test.mjs (F65-301): perpanjangan iuran mandiri. Lewat worker.fetch di D1 lokal NYATA (batch lunas, indeks unik, jejak); hanya R2 dan fetch yang ditiru.
// Midtrans TIDAK PERNAH dipanggil: fetch global ditiru, mencatat tiap permintaan yang AKAN dikirim, dan hanya menjawab untuk URL Snap sandbox.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buatEnv } from "./_bantu.mjs";
import worker from "../src/worker.js";
import * as hak from "../src/hak.js";
import { sha } from "../src/util.js";
import { tandaMidtrans } from "../src/daftar.js";

let E, EK, tutup;
const COOKIE = {}, AKUN = {}, KTA = {}, R2 = new Map(), KELUAR = [];
const fetchAsli = globalThis.fetch;
const KUNCI = "kunci-server-uji";
const TARIF = JSON.parse(readFileSync(new URL("../public/data/keanggotaan.json", import.meta.url), "utf8"));
const IURAN = Object.fromEntries(TARIF.kategori.map((k) => [k.kode, k.iuran_tahunan]));
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3, 4]);
const q = (s, ...b) => E.DB.prepare(s).bind(...b);
const satu = (s, ...b) => q(s, ...b).first();
const hari = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
const tambahTahun = (tgl) => { const d = new Date(tgl + "T00:00:00Z"); d.setUTCFullYear(d.getUTCFullYear() + 1); return d.toISOString().slice(0, 10); };

async function tambahAkun(kunci, peran = "anggota", kta = null) {
  const r = await q("INSERT INTO akun (surel, nama, peran, status, garam, sandi, iterasi) VALUES (?,?,?, 'aktif', ?, ?, 100000)", `${kunci}@iuran.test`, "Nama " + kunci, peran, "a".repeat(32), "a".repeat(64)).run();
  const token = (Object.keys(COOKIE).length + 30).toString(16).padStart(2, "0").repeat(32);
  await hak.catatSesi(E, { idHash: await sha(token), akunId: r.meta.last_row_id, sampai: Math.floor(Date.now() / 1000) + 3600, ipHash: "h" });
  COOKIE[kunci] = `sesi=${token}`; AKUN[kunci] = r.meta.last_row_id;
  if (kta) {
    const n = Object.keys(KTA).length + 1;
    const k = await q("INSERT INTO kta (akun_id, anggota_id, nomor_kta, jenis, nama_cetak, berlaku_sampai, status, nonce) VALUES (?, ?, ?, ?, ?, ?, 'aktif', 'aaaaaaaaaaaaaaaa')",
      AKUN[kunci], "ang_" + kunci, `METI-2026-IND-${String(n).padStart(5, "0")}`, kta.jenis, "Nama " + kunci, kta.sampai).run();
    KTA[kunci] = k.meta.last_row_id;
  }
}
async function panggil(metode, jalur, { peran = null, badan, mentah, env = E, csrf = true } = {}) {
  const h = { "cf-connecting-ip": "203.0.113.57" };
  if (csrf) { h.origin = "https://uji.test"; if (metode !== "GET") h["x-pb"] = "1"; }
  if (peran) h.cookie = COOKIE[peran];
  let body;
  if (mentah) { body = mentah; h["content-type"] = "application/octet-stream"; } else if (badan !== undefined) { body = JSON.stringify(badan); h["content-type"] = "application/json"; }
  return worker.fetch(new Request("https://uji.test" + jalur, { method: metode, headers: h, body }), env, { waitUntil() {} });
}
const st = async (...a) => (await panggil(...a)).status;
const isi = async (...a) => (await panggil(...a)).json();
const sampai = async (kunci) => (await satu("SELECT berlaku_sampai FROM kta WHERE id = ?", KTA[kunci])).berlaku_sampai;

before(async () => {
  globalThis.fetch = async (url, opsi) => {
    const u = String(url?.url ?? url); KELUAR.push({ u, opsi });
    if (u === "https://app.sandbox.midtrans.com/snap/v1/transactions") return new Response(JSON.stringify({ redirect_url: "https://app.sandbox.midtrans.com/snap/v4/redirection/uji" }), { status: 201 });
    throw new Error("uji: panggilan keluar tak dikenal " + u);
  };
  ({ env: E, tutup } = await buatEnv({ tambahan: {
    ASSETS: { fetch: async (req) => (new URL(req.url).pathname === "/data/keanggotaan.json" ? new Response(JSON.stringify(TARIF), { status: 200 }) : new Response("{}", { status: 404 })) },
    BERKAS: { put: async (k, v, o) => { R2.set(k, { v, tipe: o?.httpMetadata?.contentType }); }, get: async (k) => (R2.has(k) ? { body: R2.get(k).v } : null), delete: async (k) => { R2.delete(k); } },
  } }));
  EK = { ...E, MIDTRANS_SERVER_KEY: KUNCI };
  await tambahAkun("admin", "admin"); await tambahAkun("tanpa");
  await tambahAkun("ind", "anggota", { jenis: "individu", sampai: hari(40) });     // masih berlaku 40 hari
  await tambahAkun("lewat", "anggota", { jenis: "individu", sampai: hari(-30) });  // sudah lewat 30 hari
  await tambahAkun("biasa", "anggota", { jenis: "biasa", sampai: hari(10) });       // tanpa padanan tarif tunggal
  await tambahAkun("utama", "anggota", { jenis: "utama", sampai: hari(5) });
  await tambahAkun("online", "anggota", { jenis: "individu", sampai: hari(20) });
  await q("INSERT INTO pengaturan_daftar (kunci, nilai) VALUES ('rekening_bank', 'Bank Uji'), ('rekening_nomor', '000111222'), ('rekening_nama', 'METI Uji')").run();
});
after(async () => { globalThis.fetch = fetchAsli; await tutup?.(); });

test("tarif tahunan bersumber: individu dan utama punya angka di keanggotaan.json; jenis KTA lain tidak dipetakan", () => {
  assert.deepEqual(hak.JENIS_IURAN, { individu: "individu", utama: "utama" });
  assert.ok(Number.isInteger(IURAN.individu) && IURAN.individu > 0 && Number.isInteger(IURAN.utama) && IURAN.utama > 0);
});

test("peran dan keadaan awal: tamu 401; tanpa KTA atau jenis tanpa tarif = tidak bisa (tombol tidak tampil); tanpa kunci Midtrans rute membalas fitur belum aktif", async () => {
  assert.equal(await st("GET", "/api/iuran"), 401);
  assert.deepEqual(await isi("GET", "/api/iuran", { peran: "tanpa" }), { kta: null, tarif: null, boleh: false, online: false, bukti: false, rekening: null, riwayat: [] });
  const b = await isi("GET", "/api/iuran", { peran: "biasa" });
  assert.equal(b.boleh, false); assert.equal(b.tarif, null); assert.equal(b.rekening, null);
  const i = await isi("GET", "/api/iuran", { peran: "ind" });
  assert.equal(i.boleh, true); assert.equal(i.tarif, IURAN.individu); assert.equal(i.online, false, "tanpa kunci: bayar online disembunyikan"); assert.equal(i.bukti, true);
  assert.equal(i.rekening.nomor, "000111222");
  const r = await panggil("POST", "/api/iuran/bayar-online", { peran: "ind", badan: {} });
  assert.equal(r.status, 503); assert.equal((await r.json()).kode, "fitur_belum_aktif");
  assert.equal(await st("POST", "/api/iuran/bukti", { peran: "tanpa", mentah: PNG }), 404);
  assert.equal(await st("POST", "/api/iuran/bukti", { peran: "biasa", mentah: PNG }), 404);
  assert.equal(R2.size, 0, "tidak ada yang ditulis ke R2 untuk akun yang tidak bisa memperpanjang");
  assert.equal(KELUAR.length, 0);
});

test("bukti transfer: tipe dari magic byte, satu bukti menunggu per akun, jumlah dari tarif server, berkas hanya untuk pemilik dan admin", async () => {
  assert.equal(await st("POST", "/api/iuran/bukti", { peran: "ind", mentah: new TextEncoder().encode("<html>bukan gambar</html>") }), 415);
  assert.equal(R2.size, 0);
  const r = await panggil("POST", "/api/iuran/bukti", { peran: "ind", mentah: PNG });
  assert.equal(r.status, 201);
  const id = (await r.json()).id, baris = await satu("SELECT * FROM iuran_bayar WHERE id = ?", id);
  assert.equal(baris.gross, IURAN.individu); assert.equal(baris.jalur, "bukti"); assert.equal(baris.status, "menunggu"); assert.match(baris.bukti_kunci, /^iuran\/bukti\/[0-9a-f]{32}\.png$/);
  assert.equal(R2.size, 1);
  assert.equal(await st("POST", "/api/iuran/bukti", { peran: "ind", mentah: PNG }), 409, "bukti kedua yang masih menunggu ditolak");
  assert.equal(R2.size, 1, "berkas kiriman yang ditolak dihapus dari R2");
  assert.equal(await st("GET", `/api/iuran/${id}/bukti`, { peran: "ind" }), 200);
  assert.equal(await st("GET", `/api/iuran/${id}/bukti`, { peran: "utama" }), 404, "akun lain tidak bisa membaca bukti");
  const f = await panggil("GET", `/api/iuran/${id}/bukti`, { peran: "admin" });
  assert.equal(f.status, 200); assert.match(f.headers.get("content-security-policy"), /sandbox/); assert.equal(f.headers.get("x-content-type-options"), "nosniff");
  assert.equal(await st("GET", `/api/iuran/${id}/bukti-bayar`, { peran: "ind" }), 404, "belum lunas: belum ada bukti pembayaran");
});

test("tinjau admin: bukan admin 403; tolak wajib beralasan; setuju memperpanjang setahun dari masa berlaku lama, sekali saja", async () => {
  const id = (await satu("SELECT id FROM iuran_bayar WHERE akun_id = ?", AKUN.ind)).id, lama = await sampai("ind");
  assert.equal(await st("GET", "/api/admin/iuran", { peran: "ind" }), 403);
  assert.equal(await st("POST", `/api/admin/iuran/${id}`, { peran: "ind", badan: { aksi: "setuju" } }), 403);
  assert.equal(await st("POST", `/api/admin/iuran/${id}`, { peran: "admin", badan: { aksi: "tolak" } }), 422);
  assert.equal(await st("POST", `/api/admin/iuran/${id}`, { peran: "admin", badan: { aksi: "hapus" } }), 422);
  assert.equal(await sampai("ind"), lama);
  const antre = (await isi("GET", "/api/admin/iuran", { peran: "admin" })).baris;
  assert.equal(antre[0].id, id); assert.ok(!JSON.stringify(antre).includes("@iuran.test"), "antrean tidak membawa surel");
  assert.equal(await st("POST", `/api/admin/iuran/${id}`, { peran: "admin", badan: { aksi: "setuju" } }), 200);
  assert.equal(await sampai("ind"), tambahTahun(lama), "masih berlaku: setahun dari tanggal habis yang lama");
  assert.equal(await st("POST", `/api/admin/iuran/${id}`, { peran: "admin", badan: { aksi: "setuju" } }), 409, "tidak bisa diputus dua kali");
  assert.equal(await sampai("ind"), tambahTahun(lama), "tidak diperpanjang dua kali");
  const b = await satu("SELECT status, berlaku_sampai, diputus_oleh FROM iuran_bayar WHERE id = ?", id);
  assert.deepEqual(b, { status: "lunas", berlaku_sampai: tambahTahun(lama), diputus_oleh: AKUN.admin });
  assert.equal((await satu("SELECT count(*) AS n FROM jejak WHERE tabel = 'iuran_bayar' AND baris_id = ?", String(id))).n, 2, "jejak kirim dan tinjau");
  const k = await isi("GET", `/api/iuran/${id}/bukti-bayar`, { peran: "ind" });
  assert.match(k.nomor, /^IUR-\d{4}-000001$/); assert.equal(k.gross, IURAN.individu); assert.equal(k.status, "lunas"); assert.equal(k.berlaku_sampai, tambahTahun(lama)); assert.equal(k.nama, "Nama ind");
  assert.equal(await st("GET", `/api/iuran/${id}/bukti-bayar`, { peran: "utama" }), 404, "bukti pembayaran hanya untuk pemiliknya");
});

test("KTA yang sudah lewat diperpanjang setahun dari hari ini; penolakan tidak mengubah KTA", async () => {
  const id = (await isi("POST", "/api/iuran/bukti", { peran: "lewat", mentah: PNG })).id, lama = await sampai("lewat");
  assert.equal(await st("POST", `/api/admin/iuran/${id}`, { peran: "admin", badan: { aksi: "tolak", alasan: "Nominal transfer tidak sesuai tarif." } }), 200);
  assert.equal(await sampai("lewat"), lama);
  assert.equal((await isi("GET", "/api/iuran", { peran: "lewat" })).riwayat[0].status, "ditolak");
  const id2 = (await isi("POST", "/api/iuran/bukti", { peran: "lewat", mentah: PNG })).id;
  assert.equal(await st("POST", `/api/admin/iuran/${id2}`, { peran: "admin", badan: { aksi: "setuju" } }), 200);
  assert.equal(await sampai("lewat"), tambahTahun(hari(0)), "sudah lewat: setahun dari hari ini, bukan dari tanggal habis lama");
});

test("Midtrans (ditiru): permintaan yang AKAN dikirim memakai jumlah dari server; tanda tangan salah ditolak; jumlah beda ditolak; lunas sekali; pesanan orang lain tidak memperpanjang KTA ini", async () => {
  const sebelum = KELUAR.length;
  const r = await panggil("POST", "/api/iuran/bayar-online", { peran: "online", badan: { gross: 1, jumlah: 1, order_id: "IU-palsu" }, env: EK });
  assert.equal(r.status, 200); assert.match((await r.json()).url, /^https:\/\/app\.sandbox\.midtrans\.com\//);
  assert.equal(KELUAR.length, sebelum + 1);
  const kirim = KELUAR.at(-1), badan = JSON.parse(kirim.opsi.body);
  assert.equal(kirim.u, "https://app.sandbox.midtrans.com/snap/v1/transactions");
  assert.equal(badan.transaction_details.gross_amount, IURAN.individu, "jumlah dari tarif server, bukan dari badan permintaan");
  assert.match(badan.transaction_details.order_id, /^IU-[0-9a-f]{20}$/); assert.notEqual(badan.transaction_details.order_id, "IU-palsu");
  const order = badan.transaction_details.order_id, lama = await sampai("online"), lamaUtama = await sampai("utama");
  const notif = async (n, ttd) => panggil("POST", "/api/daftar/midtrans/notifikasi", { badan: { ...n, signature_key: ttd ?? (await tandaMidtrans(n, KUNCI)) }, env: EK, csrf: false });
  const dasar = { order_id: order, status_code: "200", gross_amount: String(IURAN.individu) + ".00", transaction_status: "settlement" };
  assert.equal((await notif(dasar, "0".repeat(128))).status, 403, "tanda tangan salah");
  assert.equal((await notif({ ...dasar, gross_amount: "1.00" })).status, 422, "jumlah dibayar tidak sama dengan tarif server");
  assert.equal((await notif({ ...dasar, order_id: "IU-" + "0".repeat(20) })).status, 404, "pesanan tak dikenal");
  assert.equal(await sampai("online"), lama);
  assert.equal((await notif({ ...dasar, transaction_status: "pending", status_code: "201" })).status, 200);
  assert.equal(await sampai("online"), lama, "pending tidak memperpanjang");
  assert.equal((await notif(dasar)).status, 200);
  assert.equal(await sampai("online"), tambahTahun(lama));
  assert.equal((await notif(dasar)).status, 200);
  assert.equal(await sampai("online"), tambahTahun(lama), "notifikasi berulang tidak memperpanjang dua kali");
  assert.equal(await sampai("utama"), lamaUtama, "pesanan akun lain tidak menyentuh KTA ini");
  const b = await satu("SELECT status, jalur, gross, berlaku_sampai FROM iuran_bayar WHERE order_id = ?", order);
  assert.deepEqual(b, { status: "lunas", jalur: "midtrans", gross: IURAN.individu, berlaku_sampai: tambahTahun(lama) });
  // pesanan gagal ditandai gagal dan tidak memperpanjang
  await panggil("POST", "/api/iuran/bayar-online", { peran: "utama", badan: {}, env: EK });
  const order2 = JSON.parse(KELUAR.at(-1).opsi.body).transaction_details.order_id;
  assert.equal(JSON.parse(KELUAR.at(-1).opsi.body).transaction_details.gross_amount, IURAN.utama);
  assert.equal((await notif({ order_id: order2, status_code: "202", gross_amount: String(IURAN.utama) + ".00", transaction_status: "expire" })).status, 200);
  assert.equal((await satu("SELECT status FROM iuran_bayar WHERE order_id = ?", order2)).status, "gagal"); assert.equal(await sampai("utama"), lamaUtama);
  assert.ok(KELUAR.every((x) => x.u === "https://app.sandbox.midtrans.com/snap/v1/transactions"), "hanya URL Snap sandbox yang pernah dituju, dan itu pun tiruan");
});

test("penjaga statis: rute iuran tidak pernah membaca jumlah dari badan permintaan; notifikasi pendaftaran lama tetap jalan untuk pesanan non-IU", () => {
  const src = readFileSync(new URL("../src/iuran.js", import.meta.url), "utf8");
  assert.ok(!/\bb\.(gross|jumlah|nominal|harga|tarif)\b/.test(src), "tidak ada angka uang dari badan permintaan");
  assert.match(src, /if \(!env\.MIDTRANS_SERVER_KEY\) return NONAKTIF\(\)/);
  const d = readFileSync(new URL("../src/daftar.js", import.meta.url), "utf8");
  const iTtd = d.indexOf("tandaMidtrans({ order_id: f("), iCabang = d.indexOf('startsWith("IU-")');
  assert.ok(iTtd > 0 && iCabang > iTtd, "cabang iuran berada SESUDAH verifikasi tanda tangan");
});

test("tinjauan keamanan: admin tidak bisa menyetujui bukti iuran miliknya sendiri; lunas tanpa perpanjangan tercatat sekali di jejak", async () => {
  await tambahAkun("admkta", "admin", { jenis: "individu", sampai: hari(30) });
  const lama = await sampai("admkta");
  const id = (await isi("POST", "/api/iuran/bukti", { peran: "admkta", mentah: PNG })).id;
  assert.equal(await st("POST", `/api/admin/iuran/${id}`, { peran: "admkta", badan: { aksi: "setuju" } }), 409, "bukti sendiri tidak bisa disetujui sendiri");
  assert.equal(await sampai("admkta"), lama, "KTA admin tidak berubah");
  assert.equal((await satu("SELECT status FROM iuran_bayar WHERE id = ?", id)).status, "menunggu");
  // KTA dicabut sesudah bukti dikirim: admin lain menyetujui, pembayaran lunas, KTA tidak diperpanjang, dan itu tercatat sekali.
  await q("UPDATE kta SET status = 'dicabut' WHERE id = ?", KTA.admkta).run();
  assert.equal(await st("POST", `/api/admin/iuran/${id}`, { peran: "admin", badan: { aksi: "setuju" } }), 200);
  const b = await satu("SELECT status, berlaku_sampai FROM iuran_bayar WHERE id = ?", id);
  assert.equal(b.status, "lunas"); assert.equal(b.berlaku_sampai, null);
  assert.equal(await sampai("admkta"), lama);
  const n = async () => (await satu("SELECT count(*) AS n FROM jejak WHERE tabel = 'iuran_bayar' AND baris_id = ? AND ke LIKE '%KTA TIDAK diperpanjang%'", String(id))).n;
  assert.equal(await n(), 1);
  assert.equal(await st("POST", `/api/admin/iuran/${id}`, { peran: "admin", badan: { aksi: "setuju" } }), 409);
  assert.equal(await n(), 1, "tidak dicatat dua kali");
});
