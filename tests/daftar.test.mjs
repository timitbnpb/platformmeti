// Pendaftaran anggota mandiri + persetujuan + iuran (migrasi 0021): rute publik, token lacak, bukti transfer, setujui/tolak, webhook Midtrans. D1 lokal nyata.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { buatEnv, minta } from "./_bantu.mjs";
import worker from "../src/worker.js";
import { sha, acak } from "../src/util.js";
import { readFileSync } from "node:fs";
import { tandaMidtrans, tipeBerkas, periksaForm } from "../src/daftar.js";

const R2 = new Map();
const BERKAS = {
  put: async (k, b, o) => { R2.set(k, { b, tipe: o?.httpMetadata?.contentType }); },
  get: async (k) => (R2.has(k) ? { body: new Blob([R2.get(k).b]).stream() } : null),
  delete: async (k) => { R2.delete(k); },
};
const KUNCI = "SB-Mid-server-UJI";
let E, tutup;
const sesi = {};
const CTX = { waitUntil() {} };
async function masuk(peran) {
  const r = await E.DB.prepare("INSERT INTO akun (surel, nama, peran, status, garam, sandi, iterasi) VALUES (?,?,?, 'aktif', ?, ?, 100000)").bind(`${peran}@uji.test`, peran, peran, "a".repeat(32), "a".repeat(64)).run();
  const t = acak(32);
  await E.DB.prepare("INSERT INTO sesi (id_hash, akun_id, sampai) VALUES (?,?,?)").bind(await sha(t), r.meta.last_row_id, Math.floor(Date.now() / 1000) + 3600).run();
  sesi[peran] = "sesi=" + t;
}
const panggil = async (jalur, metode, peran, badan, opsi = {}) => {
  const res = await worker.fetch(minta(jalur, { metode, badan, cookie: peran ? sesi[peran] : undefined, ...opsi }), E, CTX);
  const t = res.headers.get("content-type")?.includes("json") ? await res.text() : "";
  return { status: res.status, res, ...(t ? JSON.parse(t) : {}) };
};
const unggah = async (jalur, token, byte, { ip = "203.0.113.50", nama = "bukti.png", tanpaCL = false } = {}) => {
  const fd = new FormData(); fd.set("token", token); fd.set("berkas", new Blob([byte]), nama);
  const mentah = new Response(fd), isi = new Uint8Array(await mentah.arrayBuffer());   // klien nyata mengirim Content-Length
  const h = { "x-pb": "1", origin: "https://uji.test", "cf-connecting-ip": ip, "content-type": mentah.headers.get("content-type") };
  if (!tanpaCL) h["content-length"] = String(isi.length);
  const res = await worker.fetch(new Request("https://uji.test" + jalur, { method: "POST", body: isi, headers: h }), E, CTX);
  return { status: res.status, ...(await res.json().catch(() => ({}))) };
};
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3, 4]);
const PDF = new TextEncoder().encode("%PDF-1.7\n%isi");
const FORM = (o = {}) => ({ jenis: "individu", nama: "Budi Santoso", gelar: "S.T.", surel: "budi@contoh.id", hp: "0812-3456-7890", jabatan: "Insinyur", organisasi: "PT Contoh", kota: "Bandung", prov: "32",
  pendidikan: "S1 Teknik", kepakaran: ["surya", "bayu"], pengalaman: "10 tahun PLTS", tautan: "https://linkedin.com/in/budi", alasan: "Ingin berkontribusi pada jaringan METI.", setuju: true, situs_web: "", ...o });
let ip = 0;
const daftar = (o, opsi = {}) => panggil("/api/daftar", "POST", null, FORM(o), { ip: `198.51.100.${++ip}`, ...opsi });

before(async () => {
  const ASSETS = { fetch: async (req) => new URL(req.url).pathname === "/data/keanggotaan.json" ? new Response(readFileSync("public/data/keanggotaan.json")) : new Response("aset", { status: 200 }) };
  ({ env: E, tutup } = await buatEnv({ tambahan: { BERKAS, ASSETS } }));
  for (const p of ["anggota", "pengurus", "admin"]) await masuk(p);
});
after(async () => { await tutup?.(); });

test("matriks: pendaftaran hanya pengurus, admin, super", async () => {
  const hak = await import("../src/hak.js");
  assert.deepEqual(hak.MATRIKS.pendaftaran, ["-", "-", "T", "-", "-", "T", "T"]);
  for (const p of ["anggota", "pengurus", "admin"]) assert.equal(hak.boleh(p, "ubah", "pendaftaran", undefined, { peran: p }).ok, p !== "anggota");
});

test("halaman /daftar dan /daftar/lacak/<token> terbuka tanpa login; API admin tetap tertutup", async () => {
  const al = await worker.fetch(minta("/daftar/lacak/" + "a".repeat(64), { origin: null }), E, CTX);
  assert.equal(al.status, 302); assert.equal(al.headers.get("location"), "/daftar/lacak#" + "a".repeat(64));
  for (const j of ["/daftar", "/daftar.js", "/daftar/lacak"]) {
    const r = await worker.fetch(minta(j, { origin: null }), E, CTX);
    assert.equal(r.status, 200, j);
  }
  assert.equal((await worker.fetch(minta("/daftar/lacak/xyz", { origin: null }), E, CTX)).status, 302, "token tak berbentuk = gerbang masuk");
  assert.equal((await panggil("/api/admin/pendaftaran", "GET", null)).status, 401);
  assert.equal((await panggil("/api/admin/pendaftaran", "GET", "anggota")).status, 403);
});

test("formulir: validasi, tanpa NIK/keuangan, honeypot, persetujuan PDP wajib, laju", async () => {
  for (const salah of [{ jenis: "dewa" }, { nama: "" }, { surel: "bukan-surel" }, { hp: "abc" }, { setuju: false }, { alasan: "pendek" }, { kepakaran: ["hantu"] }, { prov: "9" }, { tautan: "javascript:alert(1)" }, { jenis: "organisasi" }])
    assert.equal((await daftar(salah)).status, 422, JSON.stringify(salah));
  const d = periksaForm({ ...FORM(), nik: "3201010101010001", rekening: "123", ktp: "x" });
  assert.ok(d.ok); assert.ok(!JSON.stringify(d.d).includes("3201010101010001") && !("nik" in d.d.rinci));
  const bot = await daftar({ situs_web: "http://spam", surel: "bot@contoh.id" });
  assert.equal(bot.status, 201);
  assert.equal((await E.DB.prepare("SELECT COUNT(*) AS n FROM pendaftaran WHERE surel = 'bot@contoh.id'").first()).n, 0, "honeypot: tidak disimpan");
  // laju 5 per jam per koneksi
  const sama = { ip: "198.51.100.200" };
  const hasil = [];
  for (let i = 0; i < 7; i++) hasil.push((await daftar({ surel: `laju${i}@contoh.id` }, sama)).status);
  assert.deepEqual(hasil, [201, 201, 201, 201, 201, 429, 429]);
});

let token, id;
test("pendaftaran sah: token sekali tampil, hanya hash disimpan, HP/surel tak bocor ke lacak", async () => {
  const r = await daftar({ surel: "budi@contoh.id" });
  assert.equal(r.status, 201); assert.match(r.token, /^[0-9a-f]{64}$/); token = r.token;
  const baris = await E.DB.prepare("SELECT * FROM pendaftaran WHERE surel = 'budi@contoh.id'").first(); id = baris.id;
  assert.equal(baris.token_hash, await sha(token)); assert.ok(!JSON.stringify(baris).includes(token));
  assert.equal(baris.status, "menunggu"); assert.equal(baris.bayar, "belum");
  assert.equal((await daftar({ surel: "budi@contoh.id" })).status, 201, "surel menunggu ganda: balasan seragam");
  const j = await panggil("/api/daftar/lacak", "POST", null, { token });
  assert.equal(j.status, 200); assert.equal(j.pendaftaran.status, "menunggu");
  const teks = JSON.stringify(j); assert.ok(!teks.includes("0812") && !teks.includes("budi@contoh.id") && !teks.includes(await sha(token)));
  assert.equal(j.online, false, "tanpa MIDTRANS_SERVER_KEY");
  assert.equal(j.rekening.nomor, "", "pengaturan kosong: layar menampilkan teks sekretariat");
  assert.equal((await panggil("/api/daftar/lacak", "POST", null, { token: "b".repeat(64) })).status, 404);
  assert.equal((await panggil("/api/daftar/lacak", "POST", null, { token: "pendek" })).status, 404);
  const jejak = await E.DB.prepare("SELECT aksi, peran, ke FROM jejak WHERE tabel = 'pendaftaran' ORDER BY id DESC LIMIT 1").first();
  assert.equal(jejak.aksi, "tambah"); assert.ok(!jejak.ke.includes("0812"));
});

test("pengaturan iuran dan rekening: admin saja, tampil di lacak, tidak di repo", async () => {
  assert.equal((await panggil("/api/admin/pengaturan-daftar", "GET", "pengurus")).status, 403);
  const o = await panggil("/api/admin/pengaturan-daftar", "PUT", "admin", { iuran_individu: "250000", rekening_bank: "Bank Uji", rekening_nomor: "1234567890", rekening_nama: "METI" });
  assert.equal(o.status, 200);
  assert.equal((await panggil("/api/admin/pengaturan-daftar", "PUT", "admin", { iuran_individu: "lima ribu" })).status, 422);
  const j = await panggil("/api/daftar/lacak", "POST", null, { token });
  assert.equal(j.rekening.nomor, "1234567890"); assert.equal(j.pendaftaran.iuran, 450000, "iuran ditetapkan saat daftar: tarif resmi bawaan, pendaftar lama tak berubah");
  const b = await daftar({ surel: "iuran@contoh.id" });
  assert.equal((await panggil("/api/daftar/lacak", "POST", null, { token: b.token })).pendaftaran.iuran, 250000);
});

test("bukti transfer: tipe dari byte, 5 MB, maks 3 menunggu, laju per token", async () => {
  assert.equal(tipeBerkas(PNG)[0], "image/png"); assert.equal(tipeBerkas(PDF)[0], "application/pdf"); assert.equal(tipeBerkas(new TextEncoder().encode("<html>"))?.[0], undefined);
  assert.equal((await unggah("/api/daftar/bukti", token, new TextEncoder().encode("<script>x</script>"), { nama: "bukti.png" })).status, 422, "nama png tapi isi bukan");
  assert.equal((await unggah("/api/daftar/bukti", token, new Uint8Array(5 * 1024 * 1024 + 1).fill(1))).status, 422);
  assert.equal((await unggah("/api/daftar/bukti", "c".repeat(64), PNG)).status, 404);
  const sebelum = R2.size;
  assert.equal((await unggah("/api/daftar/bukti", token, PNG, { ip: "203.0.113.61" })).status, 201);
  assert.equal((await E.DB.prepare("SELECT bayar FROM pendaftaran WHERE id = ?").bind(id).first()).bayar, "menunggu");
  assert.equal((await unggah("/api/daftar/bukti", token, PDF, { ip: "203.0.113.62" })).status, 201);
  assert.equal((await unggah("/api/daftar/bukti", token, PNG, { ip: "203.0.113.63" })).status, 201);
  assert.equal((await unggah("/api/daftar/bukti", token, PNG, { ip: "203.0.113.64" })).status, 409, "bukti ke-4 menunggu ditolak");
  assert.equal(R2.size, sebelum + 3, "berkas yang ditolak dibersihkan dari R2");
  const k = [...R2.keys()].filter((x) => x.startsWith("daftar/bukti/")); assert.ok(k.every((x) => /^daftar\/bukti\/[0-9a-f]{32}\.(png|pdf)$/.test(x)));
});

test("laju bukti per token dan per IP", async () => {
  const b = await daftar({ surel: "laju-token@contoh.id" });
  const s = [];
  for (let i = 0; i < 10; i++) s.push((await unggah("/api/daftar/bukti", b.token, PNG, { ip: "203.0.113." + (100 + i) })).status);
  assert.ok(s.includes(429), JSON.stringify(s));
});

test("admin: daftar berpaginasi + filter, rincian, lihat bukti dari R2, terima/tolak bukti ubah status bayar", async () => {
  const l = await panggil("/api/admin/pendaftaran?status=menunggu&jenis=individu&prov=32", "GET", "pengurus");
  assert.equal(l.status, 200); assert.ok(l.total >= 1); assert.ok(l.baris.every((x) => x.jenis === "individu" && !("hp" in x) && !("surel" in x)));
  assert.equal((await panggil("/api/admin/pendaftaran?jenis=hantu", "GET", "admin")).status, 422);
  const d = await panggil(`/api/admin/pendaftaran/${id}`, "GET", "admin");
  assert.equal(d.surel, "budi@contoh.id"); assert.equal(d.hp, "081234567890"); assert.deepEqual(d.rinci.kepakaran, ["surya", "bayu"]); assert.equal(d.bukti.length, 3);
  const b0 = d.bukti.find((x) => x.tipe === "image/png");
  const lihat = await panggil(`/api/admin/pendaftaran/bukti/${b0.id}`, "GET", "admin");
  assert.equal(lihat.status, 200); assert.equal(lihat.res.headers.get("content-type"), "image/png"); assert.match(lihat.res.headers.get("content-security-policy"), /sandbox/);
  assert.equal((await panggil(`/api/admin/pendaftaran/bukti/${b0.id}`, "GET", "anggota")).status, 403);
  // tolak semua kecuali satu diterima
  for (const x of d.bukti.filter((y) => y.id !== b0.id)) assert.equal((await panggil(`/api/admin/pendaftaran/bukti/${x.id}`, "POST", "admin", { aksi: "tolak", catatan: "buram" })).status, 200);
  assert.equal((await E.DB.prepare("SELECT bayar FROM pendaftaran WHERE id = ?").bind(id).first()).bayar, "menunggu");
  assert.equal((await panggil(`/api/admin/pendaftaran/bukti/${b0.id}`, "POST", "pengurus", { aksi: "terima" })).status, 200);
  assert.equal((await panggil(`/api/admin/pendaftaran/bukti/${b0.id}`, "POST", "pengurus", { aksi: "terima" })).status, 409, "putus sekali");
  assert.equal((await E.DB.prepare("SELECT bayar FROM pendaftaran WHERE id = ?").bind(id).first()).bayar, "lunas");
  assert.equal((await panggil(`/api/admin/pendaftaran/bukti/${b0.id}`, "POST", "admin", { aksi: "ngawur" })).status, 422);
  assert.ok((await E.DB.prepare("SELECT COUNT(*) AS n FROM jejak WHERE tabel='pendaftaran' AND aksi='tinjau'").first()).n === 3, "tiap putusan bukti = satu jejak");
  assert.equal((await unggah("/api/daftar/bukti", token, PNG, { ip: "203.0.113.70" })).status, 409, "lunas: tak menerima bukti baru");
});

test("setujui: akun anggota menunggu + tautan aktivasi sekali pakai + jejak; lunas = tanpa tanda; kedua kali 409", async () => {
  const r = await panggil(`/api/admin/pendaftaran/${id}/setujui`, "POST", "pengurus", { catatan: "oke" });
  assert.equal(r.status, 200); assert.match(r.tautan_aktivasi, /\/aktivasi\?token=[0-9a-f]{64}$/);
  const tk = r.tautan_aktivasi.split("token=")[1];
  const a = await E.DB.prepare("SELECT * FROM akun WHERE surel = 'budi@contoh.id'").first();
  assert.equal(a.peran, "anggota"); assert.equal(a.status, "menunggu"); assert.equal(a.aktivasi_hash, await sha(tk)); assert.equal(a.sandi, null);
  const p = await E.DB.prepare("SELECT status, akun_id, tanpa_lunas FROM pendaftaran WHERE id = ?").bind(id).first();
  assert.deepEqual([p.status, p.akun_id, p.tanpa_lunas], ["disetujui", a.id, 0]);
  assert.equal((await panggil(`/api/admin/pendaftaran/${id}/setujui`, "POST", "admin", {})).status, 409);
  assert.equal((await panggil(`/api/admin/pendaftaran/${id}/tolak`, "POST", "admin", { catatan: "terlambat" })).status, 409);
  const j = await E.DB.prepare("SELECT tabel, aksi FROM jejak WHERE (tabel='akun' AND baris_id = ?) OR (tabel='pendaftaran' AND baris_id = ?) ORDER BY id DESC LIMIT 3").bind(String(a.id), String(id)).all();
  assert.ok(j.results.some((x) => x.tabel === "akun" && x.aksi === "tambah"));
  const lc = await panggil("/api/daftar/lacak", "POST", null, { token }); assert.equal(lc.pendaftaran.status, "disetujui");
  // aktivasi sekali pakai lewat alur akun yang sudah ada
  const akt = await panggil("/api/aktivasi", "POST", null, { token: tk, sandi: "SandiKuat-12345!" });
  assert.ok([200, 201].includes(akt.status), "aktivasi " + akt.status);
});

test("setujui tanpa lunas diberi tanda; surel yang sudah jadi akun = 409; tolak wajib alasan", async () => {
  const b = await daftar({ surel: "belumbayar@contoh.id" });
  const bid = (await E.DB.prepare("SELECT id FROM pendaftaran WHERE surel = 'belumbayar@contoh.id'").first()).id;
  assert.equal((await panggil(`/api/admin/pendaftaran/${bid}/setujui`, "POST", "admin", {})).status, 200);
  assert.equal((await E.DB.prepare("SELECT tanpa_lunas FROM pendaftaran WHERE id = ?").bind(bid).first()).tanpa_lunas, 1);
  assert.ok(b.token);
  const c = await daftar({ surel: "tolakini@contoh.id" });
  const cid = (await E.DB.prepare("SELECT id FROM pendaftaran WHERE surel = 'tolakini@contoh.id'").first()).id;
  assert.equal((await panggil(`/api/admin/pendaftaran/${cid}/tolak`, "POST", "admin", {})).status, 422);
  assert.equal((await panggil(`/api/admin/pendaftaran/${cid}/tolak`, "POST", "admin", { catatan: "tidak memenuhi syarat" })).status, 200);
  const lc = await panggil("/api/daftar/lacak", "POST", null, { token: c.token });
  assert.equal(lc.pendaftaran.status, "ditolak"); assert.equal(lc.pendaftaran.catatan, "tidak memenuhi syarat");
  assert.equal((await daftar({ surel: "admin@uji.test" })).status, 201, "surel akun yang ada: seragam, tanpa baris baru");
  assert.equal((await daftar({ surel: "tolakini@contoh.id" })).status, 201, "setelah ditolak boleh mendaftar lagi");
});

test("Midtrans: tanpa secret 503 (tombol tidak tampil); webhook verifikasi SHA512 dan gross dari DB", async () => {
  assert.equal((await panggil("/api/daftar/bayar-online", "POST", null, { token })).status, 503);
  assert.equal((await panggil("/api/daftar/midtrans/notifikasi", "POST", null, {}, { origin: null })).status, 503);
  E.MIDTRANS_SERVER_KEY = KUNCI;
  const b = await daftar({ surel: "online@contoh.id" });
  const pid = (await E.DB.prepare("SELECT id FROM pendaftaran WHERE surel = 'online@contoh.id'").first()).id;
  assert.equal((await panggil("/api/daftar/lacak", "POST", null, { token: b.token })).online, true);
  // pesanan dibuat server (Snap dipalsukan lewat fetch global)
  const asli = globalThis.fetch; let dikirim;
  globalThis.fetch = async (u, o) => { dikirim = { u: String(u), o }; return new Response(JSON.stringify({ token: "snap", redirect_url: "https://app.sandbox.midtrans.com/snap/v4/redirection/x" }), { status: 201 }); };
  try {
    const r = await panggil("/api/daftar/bayar-online", "POST", null, { token: b.token, gross: 1 });
    assert.equal(r.status, 200); assert.match(r.url, /^https:\/\/app\.sandbox\.midtrans\.com\//);
    const kirim = JSON.parse(dikirim.o.body);
    assert.equal(kirim.transaction_details.gross_amount, 250000, "gross dari DB, angka klien diabaikan");
    assert.equal(dikirim.o.headers.authorization, "Basic " + btoa(KUNCI + ":"));
    const order = kirim.transaction_details.order_id;
    const notif = (o) => ({ order_id: order, status_code: "200", gross_amount: "250000.00", transaction_status: "settlement", ...o });
    const kirimNotif = async (n, ttd) => panggil("/api/daftar/midtrans/notifikasi", "POST", null, { ...n, signature_key: ttd ?? (await tandaMidtrans(n, KUNCI)) }, { origin: null, ip: "203.0.113.200" });
    assert.equal((await kirimNotif(notif(), "0".repeat(128))).status, 403, "tanda tangan salah");
    assert.equal((await kirimNotif(notif({ gross_amount: "1.00" }))).status, 422, "tanda sah tapi gross beda dengan DB");
    assert.equal((await E.DB.prepare("SELECT bayar FROM pendaftaran WHERE id = ?").bind(pid).first()).bayar, "belum");
    assert.equal((await kirimNotif(notif({ order_id: "JM-tidakada" }))).status, 404);
    assert.equal((await kirimNotif(notif({ transaction_status: "pending" }))).status, 200);
    assert.equal((await E.DB.prepare("SELECT bayar FROM pendaftaran WHERE id = ?").bind(pid).first()).bayar, "belum", "pending belum lunas");
    assert.equal((await kirimNotif(notif())).status, 200);
    assert.equal((await E.DB.prepare("SELECT bayar FROM pendaftaran WHERE id = ?").bind(pid).first()).bayar, "lunas");
    assert.equal((await E.DB.prepare("SELECT status FROM pembayaran_online WHERE order_id = ?").bind(order).first()).status, "lunas");
  } finally { globalThis.fetch = asli; delete E.MIDTRANS_SERVER_KEY; }
});

test("6 kategori resmi: tarif bawaan dari keanggotaan.json, kategori lama dipetakan, badan wajib untuk kategori organisasi", async () => {
  const d = JSON.parse(readFileSync("public/data/keanggotaan.json", "utf8"));
  assert.deepEqual(d.kategori.map((k) => [k.kode, k.iuran_awal, k.perwakilan]), [["pelajar", 100000, 1], ["individu", 450000, 1], ["ngo", 1600000, 2], ["usaha_kecil", 25000000, 5], ["usaha_besar", 50000000, 5], ["utama", 175000000, 20]]);
  assert.deepEqual(d.kategori.map((k) => k.iuran_tahunan), [null, 350000, 600000, 2000000, 2500000, 5000000]);
  assert.equal(d.kategori.filter((k) => k.rekomendasi).map((k) => k.kode).join(), "ngo");
  assert.equal(d.sumber.tarif_ditetapkan, "2026-07-01"); assert.match(d.sumber.url, /^https:\/\/metiires\.or\.id\//); assert.equal(d.dokumen.length, 3);
  const badan = { badan_nama: "PT Contoh", pj_nama: "Siti", pj_kontak: "081200000009" };
  const hasil = {};
  for (const [jenis, ekstra] of [["utama", badan], ["mahasiswa", {}], ["organisasi", badan], ["usaha_kecil", badan]]) {
    const r = await daftar({ jenis, surel: `${jenis}@contoh.id`, ...ekstra });
    assert.equal(r.status, 201, jenis);
    hasil[jenis] = await E.DB.prepare("SELECT jenis, iuran FROM pendaftaran WHERE surel = ?").bind(`${jenis}@contoh.id`).first();
  }
  assert.deepEqual(hasil.utama, { jenis: "utama", iuran: 175000000 });
  assert.deepEqual(hasil.mahasiswa, { jenis: "pelajar", iuran: 100000 });
  assert.deepEqual(hasil.organisasi, { jenis: "ngo", iuran: 1600000 });
  assert.equal((await daftar({ jenis: "usaha_besar", surel: "besar@contoh.id" })).status, 422, "kategori badan tanpa data badan");
  await panggil("/api/admin/pengaturan-daftar", "PUT", "admin", { iuran_utama: "1" });
  assert.equal((await panggil("/api/admin/pengaturan-daftar", "PUT", "admin", { iuran_ngo: "500000" })).status, 200);
  await daftar({ jenis: "ngo", surel: "ngo2@contoh.id", ...badan });
  assert.equal((await E.DB.prepare("SELECT iuran FROM pendaftaran WHERE surel = 'ngo2@contoh.id'").first()).iuran, 500000, "pengaturan admin menimpa tarif resmi");
  const dok = await worker.fetch(minta("/data/keanggotaan.json", { origin: null }), E, CTX);
  assert.equal(dok.status, 200, "data tarif terbuka untuk halaman /daftar");
});

test("unggah tanpa Content-Length ditolak 411; laju IP dihitung sebelum badan diurai", async () => {
  const token = (await daftar({ surel: "cl@contoh.id" })).token;
  assert.equal((await unggah("/api/daftar/bukti", token, PNG, { ip: "203.0.113.90", tanpaCL: true })).status, 411);
  let n429 = 0;
  for (let i = 0; i < 10; i++) if ((await unggah("/api/daftar/bukti", "x", PNG, { ip: "203.0.113.91" })).status === 429) n429++;
  assert.ok(n429 > 0, "token tak sah pun menghabiskan jatah IP");
});
