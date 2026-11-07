// Portal pembaruan data (0019): klaim organisasi, ajuan, kurasi admin, lapisan terbit, validasi data pribadi; portal METI Wilayah (tautan akun, PDF SK, foto + persetujuan).
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { buatEnv } from "./_bantu.mjs";
import worker from "../src/worker.js";
import { periksaAjuan, adaDataPribadi, susunTerbit } from "../src/portal.js";
import { periksaWilayah } from "../src/wilayah_kelola.js";
import { sha, acak } from "../src/util.js";

let E, tutup;
const sesi = {}, id = {}, R2 = new Map();
const BERKAS = { put: async (k, v) => { R2.set(k, new Uint8Array(v)); }, get: async (k) => (R2.has(k) ? { body: new Response(R2.get(k)).body } : null), delete: async (k) => { R2.delete(k); } };
async function masuk(nama, peran = "anggota") {
  const r = await E.DB.prepare("INSERT INTO akun (surel, nama, peran, status, garam, sandi, iterasi) VALUES (?,?,?, 'aktif', ?, ?, 100000)").bind(`${nama}@uji.test`, nama, peran, "a".repeat(32), "a".repeat(64)).run();
  const token = acak(32);
  await E.DB.prepare("INSERT INTO sesi (id_hash, akun_id, sampai) VALUES (?,?,?)").bind(await sha(token), r.meta.last_row_id, Math.floor(Date.now() / 1000) + 3600).run();
  sesi[nama] = "sesi=" + token; id[nama] = r.meta.last_row_id;
}
const minta = async (jalur, { metode = "GET", json, form, nama } = {}) => {
  const h = { origin: "https://uji.test", "cf-connecting-ip": "203.0.113.9" };
  if (nama) h.cookie = sesi[nama];
  if (metode !== "GET") h["x-pb"] = "1";
  if (json) h["content-type"] = "application/json";
  const r = await worker.fetch(new Request("https://uji.test" + jalur, { method: metode, headers: h, body: form ?? (json ? JSON.stringify(json) : undefined) }), E, { waitUntil() {} });
  const ct = r.headers.get("content-type") || "";
  return { status: r.status, j: ct.includes("json") ? await r.json().catch(() => ({})) : null, r };
};
const BUKTI = "https://situs.example/bukti";
before(async () => { ({ env: E, tutup } = await buatEnv({ tambahan: { BERKAS } })); for (const n of ["ani", "budi", "cici", "wil", "wil2"]) await masuk(n); await masuk("adm", "admin"); });
after(async () => { await tutup?.(); });

test("validasi murni: data pribadi ditolak, bentuk sah lolos", () => {
  for (const s of ["hubungi budi@gmail.com", "HP 0812-3456-7890", "NIK 3171234567890001", "alamat rumah saya Jl. Mawar", "wa 081234567890"]) assert.ok(adaDataPribadi(s), s);
  for (const s of ["Jl. Sudirman No. 52-53 Kav 12950, Jakarta", "PLTS 100 MW tahun 2027"]) assert.ok(!adaDataPribadi(s), s);
  const ok = periksaAjuan({ organisasi_id: "ix_arko", jenis: "profil", isi: { deskripsi: "Pengembang PLTA", situs: "https://arko.example", teknologi: ["hidro"] }, bukti_url: BUKTI });
  assert.equal(ok.isi.teknologi[0], "hidro");
  for (const b of [
    { jenis: "profil", isi: { deskripsi: "telp 081234567890" } }, { jenis: "profil", isi: { alamat_kantor: "rumah pribadi" } }, { jenis: "profil", isi: { nik: "1" } },
    { jenis: "profil", isi: {} }, { jenis: "profil", isi: { situs: "http://tidak-aman.example" } }, { jenis: "profil", isi: { situs: "https://wa.me/62812" } },
    { jenis: "proyek_status", isi: { status: "beroperasi" } }, { jenis: "proyek_baru", isi: { nama: "X", teknologi: "fusi", status: "rencana" } },
  ]) assert.throws(() => periksaAjuan({ organisasi_id: "ix_arko", proyek_id: undefined, bukti_url: BUKTI, ...b }), (e) => e.status === 422, JSON.stringify(b));
  assert.throws(() => periksaAjuan({ organisasi_id: "ix_arko", jenis: "profil", isi: { deskripsi: "ok" } }), (e) => e.status === 422, "bukti wajib");
});

test("tamu: rute portal 401; non-admin 403 di antrean", async () => {
  for (const [m, j] of [["GET", "/api/portal/saya"], ["POST", "/api/portal/klaim"], ["POST", "/api/portal/ajuan"], ["GET", "/api/pembaruan/organisasi/ix_arko"], ["GET", "/api/wilayah/kelola"], ["POST", "/api/wilayah/kelola"], ["GET", "/api/wilayah/terbit/32"], ["GET", "/api/admin/portal"], ["POST", "/api/admin/portal/ajuan/1"], ["GET", "/api/admin/wilayah-akun"], ["POST", "/api/admin/wilayah-akun"]])
    assert.equal((await minta(j, { metode: m, json: m === "POST" ? {} : undefined })).status, 401, m + j);
  for (const [m, j] of [["GET", "/api/admin/portal"], ["POST", "/api/admin/portal/ajuan/1"], ["GET", "/api/admin/wilayah-akun"], ["POST", "/api/admin/wilayah-akun"], ["DELETE", "/api/admin/wilayah-akun/1"]])
    assert.equal((await minta(j, { metode: m, json: m === "POST" ? {} : undefined, nama: "ani" })).status, 403, m + j);
});

test("ajuan tanpa klaim disetujui = 403; klaim ganda 409; alur klaim -> ajuan -> setuju -> terbit", async () => {
  const ajuan = { organisasi_id: "ix_arko", jenis: "profil", isi: { deskripsi: "Pengembang PLTA", situs: "https://arko.example" }, bukti_url: BUKTI };
  assert.equal((await minta("/api/portal/ajuan", { metode: "POST", json: ajuan, nama: "ani" })).status, 403);
  const k = await minta("/api/portal/klaim", { metode: "POST", json: { organisasi_id: "ix_arko", jabatan: "Humas" }, nama: "ani" });
  assert.equal(k.status, 201);
  assert.equal((await minta("/api/portal/klaim", { metode: "POST", json: { organisasi_id: "ix_arko" }, nama: "ani" })).status, 409);
  assert.equal((await minta("/api/portal/ajuan", { metode: "POST", json: ajuan, nama: "ani" })).status, 403, "klaim belum disetujui");
  assert.equal((await minta(`/api/admin/portal/klaim/${k.j.id}`, { metode: "POST", json: { aksi: "tolak" }, nama: "adm" })).status, 422, "tolak wajib catatan");
  assert.equal((await minta(`/api/admin/portal/klaim/${k.j.id}`, { metode: "POST", json: { aksi: "setuju" }, nama: "adm" })).status, 200);
  assert.equal((await minta(`/api/admin/portal/klaim/${k.j.id}`, { metode: "POST", json: { aksi: "setuju" }, nama: "adm" })).status, 409, "sekali putus");
  assert.equal((await minta("/api/portal/ajuan", { metode: "POST", json: { ...ajuan, organisasi_id: "ix_lain" }, nama: "ani" })).status, 403, "organisasi lain");
  assert.equal((await minta("/api/portal/ajuan", { metode: "POST", json: ajuan, nama: "budi" })).status, 403, "akun lain");
  const a = await minta("/api/portal/ajuan", { metode: "POST", json: ajuan, nama: "ani" });
  assert.equal(a.status, 201);
  const a2 = await minta("/api/portal/ajuan", { metode: "POST", json: { organisasi_id: "ix_arko", jenis: "proyek_status", proyek_id: "pj_0001", isi: { status: "beroperasi", cod_aktual: 2026 }, bukti_url: BUKTI }, nama: "ani" });
  assert.equal(a2.status, 201);
  assert.equal((await minta("/api/pembaruan/organisasi/ix_arko", { nama: "budi" })).j.profil, null, "belum disetujui: belum tampil");
  const antre = await minta("/api/admin/portal?tipe=ajuan&status=baru", { nama: "adm" });
  assert.equal(antre.j.total, 2);
  assert.equal(antre.j.baris[0].pengaju, "ani");
  for (const x of [a, a2]) assert.equal((await minta(`/api/admin/portal/ajuan/${x.j.id}`, { metode: "POST", json: { aksi: "setuju", catatan: "ok" }, nama: "adm" })).status, 200);
  const o = (await minta("/api/pembaruan/organisasi/ix_arko", { nama: "budi" })).j;
  assert.equal(o.profil.deskripsi, "Pengembang PLTA");
  assert.ok(o.profil.tanggal > 0 && o.profil.bukti_url === BUKTI);
  assert.equal(o.proyek_status[0].proyek_id, "pj_0001");
  assert.equal((await minta("/api/pembaruan/proyek/pj_0001", { nama: "budi" })).j.status.status, "beroperasi");
  const jej = (await E.DB.prepare("SELECT aksi, tabel FROM jejak WHERE tabel IN ('org_klaim','org_ajuan')").all()).results;
  assert.ok(jej.filter((x) => x.aksi === "kirim").length >= 3 && jej.filter((x) => x.aksi === "tinjau").length >= 3, "tercatat di jejak");
});

test("susunTerbit: profil gabungan (baru menang), status proyek terbaru per proyek", () => {
  const r = susunTerbit("organisasi", [
    { id: 3, jenis: "profil", isi: { situs: "https://baru.example" }, tanggal: 30, bukti_url: "u3" }, { id: 2, jenis: "proyek_status", proyek_id: "pj_1", isi: { status: "beroperasi" }, tanggal: 20, bukti_url: "u2" },
    { id: 1, jenis: "profil", isi: { situs: "https://lama.example", deskripsi: "d" }, tanggal: 10, bukti_url: "u1" }, { id: 0, jenis: "proyek_status", proyek_id: "pj_1", isi: { status: "rencana" }, tanggal: 5, bukti_url: "u0" }]);
  assert.deepEqual([r.profil.situs, r.profil.deskripsi, r.profil.tanggal], ["https://baru.example", "d", 30]);
  assert.equal(r.proyek_status.length, 1);
  assert.equal(r.proyek_status[0].status, "beroperasi");
});

test("METI Wilayah: periksaWilayah per jenis", () => {
  assert.ok(periksaWilayah("sekretariat", { alamat: "Jl. Kantor 1", surel_resmi: "sekretariat@meti-jabar.example", telepon_kantor: "021-555-1234" }).isi.surel_resmi);
  for (const [j, x] of [["sekretariat", { surel_resmi: "budi@gmail.com" }], ["sekretariat", { alamat: "rumah pribadi" }], ["pengurus", { nama: "Budi" }], ["kegiatan", { judul: "Rapat", tanggal: "2026-02-31" }],
    ["bidang", { bidang: [] }], ["keanggotaan", { jumlah_anggota: -1 }], ["keanggotaan", { organisasi_ids: ["a b"] }], ["pengurus", { nama: "Budi 081234567890", jabatan: "Ketua" }], ["sk", { nomor: "1", ekstra: 1 }], ["tidak-ada", {}]])
    assert.throws(() => periksaWilayah(j, x), (e) => e.status === 422, j + JSON.stringify(x));
});

const PDF = new TextEncoder().encode("%PDF-1.4\n%%EOF"), PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const form = (data, berkas, setuju) => { const f = new FormData(); f.set("data", JSON.stringify(data)); if (berkas) f.set("berkas", new File([berkas[0]], berkas[1])); if (setuju) f.set("setuju_foto", "1"); return f; };

test("METI Wilayah: admin menautkan akun ke provinsi; hanya provinsi sendiri; PDF SK, foto wajib persetujuan; kurasi; berkas hanya setelah disetujui", async () => {
  const kirim = (n, d, b, s) => minta("/api/wilayah/kelola", { metode: "POST", form: form(d, b, s), nama: n });
  assert.equal((await kirim("wil", { jenis: "bidang", isi: { bidang: ["Surya"] }, bukti_url: BUKTI })).status, 403, "belum ditautkan");
  assert.equal((await minta("/api/wilayah/kelola", { nama: "wil" })).j.kode, null);
  assert.equal((await minta("/api/admin/wilayah-akun", { metode: "POST", json: { surel: "wil@uji.test", kode_prov: "99" }, nama: "adm" })).status, 422, "kode asing");
  assert.equal((await minta("/api/admin/wilayah-akun", { metode: "POST", json: { surel: "tidak@ada.test", kode_prov: "32" }, nama: "adm" })).status, 404);
  assert.equal((await minta("/api/admin/wilayah-akun", { metode: "POST", json: { surel: "wil@uji.test", kode_prov: "32" }, nama: "adm" })).status, 200);
  assert.equal((await minta("/api/admin/wilayah-akun", { metode: "POST", json: { akun_id: id.wil2, kode_prov: "31" }, nama: "adm" })).status, 200);
  assert.equal((await minta("/api/wilayah/kelola", { nama: "wil" })).j.kode, "32");
  assert.equal((await minta("/api/admin/wilayah-akun", { nama: "adm" })).j.baris.length, 2);

  assert.equal((await kirim("wil", { jenis: "bidang", isi: { bidang: ["Surya"] } })).status, 422, "tanpa bukti/berkas");
  assert.equal((await kirim("wil", { jenis: "sk", isi: { nomor: "SK/1", tanggal: "2026-01-02" } })).status, 422, "SK wajib PDF");
  assert.equal((await kirim("wil", { jenis: "sk", isi: { nomor: "SK/1", tanggal: "2026-01-02" } }, [PNG, "a.pdf"])).status, 422, "PDF palsu (byte png)");
  const sk = await kirim("wil", { jenis: "sk", isi: { nomor: "SK/1", tanggal: "2026-01-02" } }, [PDF, "sk.pdf"]);
  assert.equal(sk.status, 201);
  assert.equal(R2.size, 1);
  assert.equal((await kirim("wil", { jenis: "pengurus", isi: { nama: "Siti", jabatan: "Ketua" } }, [PNG, "f.png"])).status, 422, "foto tanpa persetujuan");
  assert.equal(R2.size, 1, "tak ada yatim di R2");
  const p = await kirim("wil", { jenis: "pengurus", isi: { nama: "Siti", jabatan: "Ketua" } }, [PNG, "f.png"], true);
  assert.equal(p.status, 201);
  assert.equal((await kirim("wil", { jenis: "bidang", isi: { bidang: ["Surya", "Bayu"] }, bukti_url: BUKTI })).status, 201);
  assert.equal((await kirim("wil", { jenis: "sekretariat", isi: { alamat: "Jl. A 1", surel_resmi: "x@gmail.com" }, bukti_url: BUKTI })).status, 422);
  assert.equal((await kirim("ani", { jenis: "bidang", isi: { bidang: ["X"] }, bukti_url: BUKTI })).status, 403, "bukan pengurus");

  const lihat = (n) => minta(`/api/wilayah/berkas/${sk.j.id}`, { nama: n });
  assert.equal((await lihat("budi")).status, 404, "belum disetujui: orang lain tak bisa");
  assert.equal((await lihat("wil2")).status, 404, "pengurus provinsi lain tak bisa");
  assert.equal((await lihat("wil")).status, 200, "pengurus provinsinya bisa");
  assert.equal((await minta("/api/wilayah/terbit/32", { nama: "budi" })).j.sk.length, 0);

  const antre = await minta("/api/admin/portal?tipe=wilayah&status=baru", { nama: "adm" });
  assert.equal(antre.j.total, 3);
  assert.ok(antre.j.baris.every((x) => x.kode_prov === "32" && x.pengaju === "wil"));
  assert.equal(antre.j.baris.find((x) => x.jenis === "pengurus").persetujuan_foto, 1);
  for (const x of antre.j.baris) assert.equal((await minta(`/api/admin/portal/wilayah/${x.id}`, { metode: "POST", json: { aksi: "setuju" }, nama: "adm" })).status, 200);
  const t = (await minta("/api/wilayah/terbit/32", { nama: "budi" })).j;
  assert.equal(t.nama.length > 0, true);
  assert.equal(t.sk[0].nomor, "SK/1");
  assert.ok(t.sk[0].disetujui > 0);
  assert.equal(t.sk[0].tanggal, "2026-01-02", "tanggal isi tidak tertimpa tanggal persetujuan");
  assert.equal(t.pengurus[0].nama, "Siti");
  assert.deepEqual(t.bidang[0].bidang, ["Surya", "Bayu"]);
  assert.equal((await lihat("budi")).status, 200, "disetujui: akun masuk bisa");
  assert.equal((await minta("/api/wilayah/terbit/31", { nama: "budi" })).j.bidang.length, 0);
  assert.equal((await minta(`/api/admin/wilayah-akun/${id.wil2}`, { metode: "DELETE", nama: "adm" })).status, 200);
  assert.equal((await kirim("wil2", { jenis: "bidang", isi: { bidang: ["X"] }, bukti_url: BUKTI })).status, 403, "tautan dilepas");
});

test("DB menolak foto tanpa persetujuan dan SK tanpa berkas (jaring pengaman di luar rute)", async () => {
  const ins = (jenis, berkas, kunci, setuju) => E.DB.prepare("INSERT INTO wilayah_ajuan (akun_id, kode_prov, jenis, isi, bukti_url, berkas, berkas_kunci, persetujuan_foto) VALUES (?, '32', ?, '{}', 'https://a.test/x', ?, ?, ?)").bind(id.wil, jenis, berkas, kunci, setuju).run();
  await assert.rejects(() => ins("pengurus", '{"nama":"x"}', "wilayah/32/zz", 0));
  await assert.rejects(() => ins("sk", null, null, 0));
  await ins("pengurus", '{"nama":"x"}', "wilayah/32/zz", 1);
});
