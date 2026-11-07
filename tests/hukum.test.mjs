// hukum.test.mjs: Pustaka hukum EBT. Murni (kueriFts, verifikasiKutipan), rute lewat worker.fetch utuh dengan D1 lokal NYATA (0029), dan pengurai Python (--cek).
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { buatEnv } from "./_bantu.mjs";
import worker from "../src/worker.js";
import * as hak from "../src/hak.js";
import { sha } from "../src/util.js";
import { kueriFts, verifikasiKutipan, normTeks } from "../src/hukum_spek.js";

test("kueriFts: token dikutip, operator FTS5 tak lolos", () => {
  assert.equal(kueriFts('insentif "PLTS" AND (atap)*'), '"insentif" "plts" "and" "atap"');
  assert.equal(kueriFts("***"), null);
  assert.equal(kueriFts("apa yang dan insentif", { atau: true, buangStop: true }), '"insentif"');
});

const SEG = "Setiap pelaku usaha pembangkit tenaga surya atap wajib memenuhi tingkat komponen dalam negeri sebagaimana diatur dalam peraturan ini.";
test("verifikasiKutipan: hanya kutipan yang substring segmen dan didukung pernyataan", () => {
  const kirim = new Map([[7, SEG]]);
  const baik = { pernyataan: "Pembangkit tenaga surya atap wajib memenuhi tingkat komponen dalam negeri", kutipan: { segmen: 7, teks: "wajib memenuhi tingkat komponen dalam negeri sebagaimana diatur" } };
  const karang = { pernyataan: "Pembangkit surya dibebaskan dari pajak", kutipan: { segmen: 7, teks: "dibebaskan dari seluruh pajak penghasilan badan usaha tanpa batas waktu" } };
  const segmenLain = { pernyataan: baik.pernyataan, kutipan: { segmen: 9, teks: baik.kutipan.teks } };
  const pendek = { pernyataan: baik.pernyataan, kutipan: { segmen: 7, teks: "wajib memenuhi" } };
  const r = verifikasiKutipan([baik, karang, segmenLain, pendek, null], kirim);
  assert.equal(r.sah.length, 1);
  assert.equal(r.dibuang, 4);
  assert.ok(SEG.includes(r.sah[0].teks), "teks yang dikembalikan adalah potongan asli segmen");
  assert.equal(normTeks("  Tingkat  “Komponen”  "), "tingkat komponen");
});

test("pengurai Python lulus --cek (kunci kanonik, segmen, relasi, definisi)", { skip: spawnSync("python3", ["--version"]).error ? "python3 tidak ada" : false }, () => {
  const r = spawnSync("python3", ["-I", "scripts/hukum/hukum.py", "--cek"], { encoding: "utf8" });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /hijau/);
});

let E, tutup, cookie;
const q = (s, ...b) => E.DB.prepare(s).bind(...b);
async function panggil(metode, jalur, { masuk = true, badan } = {}) {
  const h = { origin: "https://uji.test", "cf-connecting-ip": "203.0.113.7" };
  if (masuk) h.cookie = cookie;
  if (metode !== "GET") h["x-pb"] = "1";
  let body;
  if (badan !== undefined) { body = JSON.stringify(badan); h["content-type"] = "application/json"; }
  return worker.fetch(new Request("https://uji.test" + jalur, { method: metode, headers: h, body }), E, { waitUntil() {} });
}

before(async () => {
  ({ env: E, tutup } = await buatEnv());
  const r = await q("INSERT INTO akun (surel, nama, peran, status, garam, sandi, iterasi) VALUES (?,?,?, 'aktif', ?, ?, 100000)", "h@uji.test", "Uji", "anggota", "a".repeat(32), "a".repeat(64)).run();
  const token = "c".repeat(64);
  await hak.catatSesi(E, { idHash: await sha(token), akunId: r.meta.last_row_id, peran: "anggota", sampai: Math.floor(Date.now() / 1000) + 3600, ipHash: "h" });
  cookie = `sesi=${token}`;
  const dok = [["permen-esdm-2-2024", "reg-a", "PERMEN", "2", 2024, "Pembangkit Listrik Tenaga Surya Atap", "berlaku"], ["permen-esdm-26-2021", null, "PERMEN", "26", 2021, "PLTS Atap lama", "dicabut"], ["uu-30-2009", null, "UU", "30", 2009, "Ketenagalistrikan", "berlaku"]];
  const stm = [];
  for (const [id, rid, s, n, th, j, st] of dok) stm.push(q("INSERT INTO hukum_dok (id, regulasi_id, singkatan, jenis, nomor, tahun, judul, status, pdf, halaman, ocr, resmi, sumber) VALUES (?,?,?,?,?,?,?,?,?,3,0,1,'peraturan.bpk.go.id')", id, rid, s, s, n, th, j, st, '["https://peraturan.bpk.go.id/Download/1/a.pdf"]'));
  const segs = [[1, "permen-esdm-2-2024", 0, "judul", "Judul", null, "Pembangkit Listrik Tenaga Surya Atap"], [2, "permen-esdm-2-2024", 1, "pasal", "Pasal 1", "BAB I KETENTUAN UMUM", SEG],
    [3, "permen-esdm-2-2024", 2, "pasal", "Pasal 2", "BAB I KETENTUAN UMUM", "Konsumen dapat memasang PLTS atap dengan insentif sesuai ketentuan perundang-undangan."], [4, "uu-30-2009", 0, "pasal", "Pasal 1", null, "Ketenagalistrikan adalah segala sesuatu yang berkaitan dengan penyediaan tenaga listrik."]];
  for (const [id, d, u, j, l, b, t] of segs) {
    stm.push(q("INSERT INTO hukum_segmen (id, dok, urut, jenis, label, bab, teks) VALUES (?,?,?,?,?,?,?)", id, d, u, j, l, b, t));
    stm.push(q("INSERT INTO hukum_fts (rowid, teks, label, judul) VALUES (?,?,?,?)", id, t, l, "judul uji"));
  }
  stm.push(q("INSERT INTO hukum_relasi (dari, ke, jenis, terdaftar, ke_judul) VALUES ('permen-esdm-2-2024','permen-esdm-26-2021','mengganti',1,'PLTS Atap lama'), ('permen-esdm-2-2024','uu-30-2009','mengingat',1,'Ketenagalistrikan'), ('permen-esdm-2-2024','pp-1-2000','merujuk',0,'PP luar')"));
  await E.DB.batch(stm);
});
after(async () => { await tutup?.(); });

test("tamu 401 di semua rute hukum", async () => {
  for (const [m, j, b] of [["GET", "/api/hukum/cari?q=surya"], ["GET", "/api/hukum/dok?id=uu-30-2009"], ["GET", "/api/hukum/ringkas"], ["POST", "/api/hukum/tanya", { pertanyaan: "apa itu listrik" }]]) {
    assert.equal((await panggil(m, j, { masuk: false, badan: b })).status, 401, `${m} ${j}`);
  }
});

test("cari: hasil per pasal dengan cuplikan bertanda, saringan jenis/tahun/status, masukan buruk 422", async () => {
  const r = await panggil("GET", "/api/hukum/cari?q=komponen%20dalam%20negeri");
  assert.equal(r.status, 200);
  const d = await r.json();
  assert.equal(d.total, 1);
  assert.equal(d.hasil[0].dok, "permen-esdm-2-2024");
  assert.equal(d.hasil[0].label, "Pasal 1");
  assert.match(d.hasil[0].cuplikan, /\[\[/);
  assert.deepEqual(d.per_jenis, { PERMEN: 1 });
  assert.equal((await (await panggil("GET", "/api/hukum/cari?q=listrik&jenis=UU")).json()).total, 1);
  assert.equal((await (await panggil("GET", "/api/hukum/cari?q=listrik&tahun=2009")).json()).total, 1);
  assert.equal((await (await panggil("GET", "/api/hukum/cari?q=atap&status=dicabut")).json()).total, 0);
  for (const j of ["/api/hukum/cari?q=", "/api/hukum/cari?q=***", "/api/hukum/cari?q=a&tahun=abc", "/api/hukum/cari?q=a&jenis=x%27y", "/api/hukum/cari?q=" + "k".repeat(201)]) assert.equal((await panggil("GET", j)).status, 422, j);
});

test("dok: segmen urut, relasi keluar dan masuk, 404 dan id tak sah", async () => {
  const d = await (await panggil("GET", "/api/hukum/dok?id=permen-esdm-2-2024")).json();
  assert.equal(d.dok.regulasi_id, "reg-a");
  assert.deepEqual(d.dok.pdf, ["https://peraturan.bpk.go.id/Download/1/a.pdf"]);
  assert.deepEqual(d.segmen.map((s) => s.label), ["Judul", "Pasal 1", "Pasal 2"]);
  assert.deepEqual(d.keluar.map((r) => [r.id, r.jenis, r.terdaftar]).sort(), [["permen-esdm-26-2021", "mengganti", 1], ["pp-1-2000", "merujuk", 0], ["uu-30-2009", "mengingat", 1]]);
  const lama = await (await panggil("GET", "/api/hukum/dok?id=permen-esdm-26-2021")).json();
  assert.deepEqual(lama.masuk.map((r) => [r.id, r.jenis]), [["permen-esdm-2-2024", "mengganti"]]);
  assert.equal((await panggil("GET", "/api/hukum/dok?id=tidak-ada-1-2000")).status, 404);
  assert.equal((await panggil("GET", "/api/hukum/dok?id=A_B")).status, 422);
  const rk = await (await panggil("GET", "/api/hukum/ringkas")).json();
  assert.deepEqual([rk.dok, rk.segmen, rk.relasi], [3, 4, 3]);
  assert.equal(rk.dirujuk[0].n >= 1, true);
  assert.equal(rk.dicabut[0].jenis, "mengganti");
});

test("tanya tanpa binding AI: segmen teratas saja, tanpa jawaban karangan", async () => {
  const r = await panggil("POST", "/api/hukum/tanya", { badan: { pertanyaan: "Apa kewajiban komponen dalam negeri untuk surya atap" } });
  assert.equal(r.status, 200);
  const d = await r.json();
  assert.equal(d.jawaban, null);
  assert.equal(d.model, null);
  assert.ok(d.segmen_dipakai.some((s) => s.segmen === 2));
  assert.equal((await panggil("POST", "/api/hukum/tanya", { badan: { pertanyaan: "ab" } })).status, 422);
});

test("tanya dengan AI: kutipan karangan dibuang dan dihitung, kutipan sah dikembalikan dari naskah asli", async () => {
  E.AI = { run: async () => ({ response: { klaim: [
    { pernyataan: "Pembangkit surya atap wajib memenuhi tingkat komponen dalam negeri", kutipan: { segmen: 2, teks: "wajib memenuhi tingkat komponen dalam negeri sebagaimana diatur" } },
    { pernyataan: "Semua pajak dihapus untuk pembangkit surya", kutipan: { segmen: 2, teks: "seluruh pajak penghasilan dibebaskan tanpa batas waktu apa pun juga" } }] } }) };
  const d = await (await panggil("POST", "/api/hukum/tanya", { badan: { pertanyaan: "Apa kewajiban komponen dalam negeri untuk surya atap" } })).json();
  delete E.AI;
  assert.equal(d.kutipan.length, 1);
  assert.equal(d.dibuang, 1);
  assert.equal(d.kutipan[0].dok, "permen-esdm-2-2024");
  assert.ok(SEG.includes(d.kutipan[0].teks));
  assert.ok(d.jawaban.includes("komponen dalam negeri") && !d.jawaban.includes("pajak dihapus"));
});

test("tabel belum dimigrasi: 503, bukan 500", async () => {
  await E.DB.batch([q("DROP TABLE hukum_fts"), q("DROP TABLE hukum_relasi"), q("DROP TABLE hukum_segmen"), q("DROP TABLE hukum_dok")]);
  for (const j of ["/api/hukum/cari?q=surya", "/api/hukum/dok?id=uu-30-2009", "/api/hukum/ringkas"]) assert.equal((await panggil("GET", j)).status, 503, j);
});
