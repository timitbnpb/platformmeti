// Perbaikan audit: cron memanggil sapu, batas badan nyata, penjaga pemutus/pencabut. D1 LOKAL nyata (tests/_bantu.mjs), bukan mock.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buatEnv } from "./_bantu.mjs";
import * as hak from "../src/hak.js";
import worker from "../src/worker.js";
import { bacaBiner, formTerbatas } from "../src/util.js";

let E, tutup;
const q = (s, ...b) => E.DB.prepare(s).bind(...b);
const akun = {};
const buat = async (k, peran) => {
  const r = await q("INSERT INTO akun (surel, nama, peran, status, garam, sandi, iterasi) VALUES (?,?,?, 'aktif', ?, ?, 100000)", `${k}@uji.test`, k, peran, "a".repeat(32), "a".repeat(64)).run();
  akun[k] = { id: r.meta.last_row_id, peran, nama: k, status: "aktif" };
};
before(async () => {
  ({ env: E, tutup } = await buatEnv());
  for (const [k, p] of [["adm", "admin"], ["adm2", "admin"], ["sup", "super"]]) await buat(k, p);
});
after(async () => { await tutup(); });

test("cron scheduled membersihkan sesi kedaluwarsa dan laju, laju berjendela harian tetap", async () => {
  const lalu = Math.floor(Date.now() / 1000) - 5 * 86400;
  await q("INSERT INTO sesi (id_hash, akun_id, dibuat, sampai) VALUES (?, ?, ?, ?)", "e".repeat(64), akun.adm.id, lalu - 100, lalu).run();
  await q("INSERT INTO sesi (id_hash, akun_id, sampai) VALUES (?, ?, ?)", "f".repeat(64), akun.adm.id, lalu + 99 * 86400).run();
  await q("INSERT INTO laju (kunci, aksi, jendela) VALUES ('lama', 'koreksi', ?)", Math.floor(lalu / 3600)).run();
  await hak.catatLaju(E, "koreksi:harian", 86400);
  const tunggu = [];
  const orig = globalThis.fetch;
  globalThis.fetch = async () => new Response("{}", { status: 503 });
  try { await worker.scheduled({}, E, { waitUntil: (p) => tunggu.push(p) }); await Promise.all(tunggu); } finally { globalThis.fetch = orig; }
  const n = async (s) => (await E.DB.prepare(s).first()).n;
  assert.equal(await n("SELECT count(*) n FROM sesi WHERE id_hash = '" + "e".repeat(64) + "'"), 0);
  assert.equal(await n("SELECT count(*) n FROM sesi WHERE id_hash = '" + "f".repeat(64) + "'"), 1);
  assert.equal(await n("SELECT count(*) n FROM laju WHERE kunci = 'lama'"), 0);
  assert.equal(await n("SELECT count(*) n FROM laju WHERE kunci = 'harian'"), 1);
});

function chunked(total, ct = "application/octet-stream") {
  let kirim = 0;
  const body = new ReadableStream({ pull(c) { if (kirim >= total) return c.close(); kirim += 1024; c.enqueue(new Uint8Array(1024)); } });
  return { kirim: () => kirim, req: new Request("https://uji.test/x", { method: "POST", body, duplex: "half", headers: { "content-type": ct } }) };
}
test("badan chunked tanpa Content-Length ditolak terlalu_besar dan dihentikan dini", async () => {
  const c = chunked(10 * 1024 * 1024);
  assert.equal(c.req.headers.get("content-length"), null);
  await assert.rejects(bacaBiner(c.req, 4096), (e) => e.kode === "terlalu_besar" || e.message === "terlalu_besar");
  assert.ok(c.kirim() < 1024 * 1024);
  const f = chunked(10 * 1024 * 1024, "multipart/form-data; boundary=x");
  await assert.rejects(formTerbatas(f.req, 4096), (e) => e.kode === "terlalu_besar" || e.message === "terlalu_besar");
  const rusak = new Request("https://uji.test/x", { method: "POST", body: "bukan multipart", headers: { "content-type": "multipart/form-data; boundary=x" } });
  await assert.rejects(formTerbatas(rusak, 4096), (e) => e.kode === "masukan_salah" && e.status === 422);
  const fd = new FormData(); fd.set("a", "b");
  const ok = new Request("https://uji.test/x", { method: "POST", body: fd });
  assert.equal((await formTerbatas(ok, 4096)).get("a"), "b");
});
test("lima rute unggah memakai pembaca terbatas, bukan formData/arrayBuffer langsung", () => {
  for (const b of ["pesan", "konsultasi", "wilayah_kelola", "meti_wilayah", "profil_akun"]) {
    const s = readFileSync(new URL(`../src/${b}.js`, import.meta.url), "utf8");
    assert.doesNotMatch(s, /req\.(formData|arrayBuffer)\(/, b);
  }
});

const TIPE_ORG = {
  klaim: (a) => hak.orgKlaimBaru(E, a, { organisasiId: "org-" + a.nama + Math.random().toString(36).slice(2, 6) }).then((r) => r.id),
  ajuan: async (a) => (await E.DB.prepare("INSERT INTO org_ajuan (akun_id, organisasi_id, jenis, isi, bukti_url) VALUES (?, 'org-zz', 'profil', '{}', 'https://x.example/b')").bind(a.id).run()).meta.last_row_id,
  wilayah: async (a) => (await E.DB.prepare("INSERT INTO wilayah_ajuan (akun_id, kode_prov, jenis, isi, bukti_url) VALUES (?, '31', 'sekretariat', '{}', 'https://x.example/b')").bind(a.id).run()).meta.last_row_id,
};
for (const tipe of Object.keys(TIPE_ORG)) {
  for (const pemilik of ["adm", "sup"]) {
    test(`org ${tipe}: ${pemilik} tidak menyetujui milik sendiri, pemutus lain boleh, tolak oleh pemilik boleh`, async () => {
      const a = akun[pemilik], lain = pemilik === "adm" ? akun.sup : akun.adm;
      const id = await TIPE_ORG[tipe](a);
      await assert.rejects(hak.orgPutus(E, a, tipe, id, "setuju", null), (e) => e.status === 403);
      assert.equal((await E.DB.prepare(`SELECT status FROM ${{ klaim: "org_klaim", ajuan: "org_ajuan", wilayah: "wilayah_ajuan" }[tipe]} WHERE id = ?`).bind(id).first()).status, "baru");
      assert.equal((await hak.orgPutus(E, lain, tipe, id, "setuju", null)).ubah, 1);
      const id2 = await TIPE_ORG[tipe](a);
      assert.equal((await hak.orgPutus(E, a, tipe, id2, "tolak", null)).ubah, 1);
    });
  }
}

test("matriks: sesi dan sesi_admin sel admin menolak sasaran super, super menerima", () => {
  for (const jenis of ["sesi", "sesi_admin"]) {
    assert.equal(hak.boleh("admin", "cabut", jenis, { peran: "super" }, akun.adm).ok, false, jenis);
    assert.equal(hak.boleh("admin", "cabut", jenis, { peran: "anggota" }, akun.adm).ok, true, jenis);
    assert.equal(hak.boleh("super", "cabut", jenis, { peran: "super" }, akun.sup).ok, true, jenis);
  }
  assert.equal(hak.selMatriks("admin", "sesi"), "T cabut bukan-super");
});

test("admin tidak bisa mencabut sesi akun super lewat hak.tulis; sesi admin lain boleh", async () => {
  await q("INSERT INTO sesi (id_hash, akun_id, sampai) VALUES (?, ?, ?)", "1".repeat(64), akun.sup.id, 9999999999).run();
  await q("INSERT INTO sesi (id_hash, akun_id, sampai) VALUES (?, ?, ?)", "2".repeat(64), akun.adm2.id, 9999999999).run();
  await assert.rejects(hak.tulis(E, akun.adm, "sesi", "cabut", {}, String(akun.sup.id)), (e) => e.status === 403);
  assert.equal((await E.DB.prepare("SELECT count(*) n FROM sesi WHERE akun_id = ?").bind(akun.sup.id).first()).n, 1);
  await hak.tulis(E, akun.adm, "sesi", "cabut", {}, String(akun.adm2.id));
  assert.equal((await E.DB.prepare("SELECT count(*) n FROM sesi WHERE akun_id = ?").bind(akun.adm2.id).first()).n, 0);
});

test("sesiAdminCabut: admin ditolak pada sesi super (lewat matriks), boleh pada sesi lain", async () => {
  await q("INSERT INTO sesi (id_hash, akun_id, sampai) VALUES (?, ?, ?)", "3".repeat(64), akun.sup.id, 9999999999).run();
  await assert.rejects(hak.sesiAdminCabut(E, akun.adm, "z".repeat(64), "3".repeat(16)), (e) => e.status === 403);
  assert.equal((await hak.sesiAdminCabut(E, akun.sup, "z".repeat(64), "3".repeat(16))).dicabut, 1);
});
