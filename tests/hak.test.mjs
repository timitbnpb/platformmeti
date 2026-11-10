// Uji hak.js terhadap D1 LOKAL nyata (tests/_bantu.mjs). RU 2.2: satu uji per sel MATRIKS; jumlah sel DIHITUNG dari data, bukan hardcode.
// Tiap sel: (a) tiap aksi diizinkan HANYA bila kode sel mengizinkan (izin DAN ditolak), (b) perilaku nyata di D1:
// baca mengembalikan persis baris yang berhak, tulis ditolak tanpa efek (baris dan jejak tak bertambah) atau lolos dengan jejak.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { buatEnv } from "./_bantu.mjs";
import * as hak from "../src/hak.js";

const { PERAN, MATRIKS, AKSI } = hak;

// Salinan TANGAN dari tabel KPV 1 (bukan dibangkitkan dari MATRIKS). Selisih satu sel = merah.
const KPV = {
  entitas: "B B B T B T T", fakta: "B B B T B T T", ikatan: "B B B T B T T", orang: "B B B T B T T",
  kontak: "- - T B B(prov) T T", terlarang: "- - - - - - -", potret_publik: "B B B B B B B", potret_anggota: "- B B B B B B",
  potret_pengurus: "- - B B - B B", akun: "- diri diri diri diri bukan-super T", sesi: "- diri diri diri diri cabut-bukan-super T",
  koreksi: "- kirim kirim T kirim(prov) T T", riwayat: "- - T - - T T", jejak: "- - - - - B B", daftar_tolak: "- - - - - - B",
  agenda: "- B B B B T T", konten_meti: "- konten konten konten konten T T", konten_otorisasi: "- - tinjau - - T T",
  naskah: "- sah putus sah sah T T", naskah_catatan: "- - catat - - catat catat",
  event_atur: "- B B B B T T", event_daftar: "- daftar daftar daftar daftar T T",
  pendaftaran: "- - T - - T T",
  sesi_admin: "- - - - - cabut-bukan-super cabut",
  konsultasi: "- daftar daftar daftar daftar T T", konsultasi_putus: "- - T T - T T",
  surel_minta: "- daftar daftar daftar daftar T T",
  keyakinan: "- daftar daftar daftar daftar T T",
};
const KODE_KPV = (s) => s.split(" ").map((x) => ({ "-": "-", B: "B", T: "T", "B(prov)": "B prov", diri: "T diri", "bukan-super": "T bukan-super",
  cabut: "T cabut", "cabut-bukan-super": "T cabut bukan-super", kirim: "T kirim", "kirim(prov)": "T kirim prov", daftar: "T daftar", sah: "B sah", putus: "T putus", catat: "T catat", konten: "B konten", tinjau: "T tinjau" })[x]);

// Aksi yang diizinkan per kode sel (ditulis ulang di sini dari DT 5.2, tidak diimpor).
const HARAP = (kode, jenis) => ({
  "-": [], B: ["baca"], "B prov": ["baca"],
  T: ["baca", "tambah", "ubah", ...({ koreksi: ["tinjau", "kirim"], entitas: ["hapus_keras"], orang: ["hapus_keras"], riwayat: ["hapus"], agenda: ["hapus"], konten_meti: ["hapus"], naskah: ["tinjau"], konten_otorisasi: ["tinjau"], sesi: ["cabut"] }[jenis] ?? [])],
  "T diri": jenis === "sesi" ? ["baca", "cabut"] : ["baca", "ubah"],
  "T daftar": ["baca", "tambah", "ubah"], "T bukan-super": ["baca", "tambah", "ubah"], "T cabut": ["baca", "cabut"], "T cabut bukan-super": ["baca", "cabut"], "T kirim": ["kirim", "baca"], "T kirim prov": ["kirim", "baca"],
  "B sah": ["baca"], "B konten": ["baca"], "T tinjau": ["baca", "tinjau"], "T putus": ["baca", "tinjau"], "T catat": ["baca", "tambah"],
}[kode]);

let E, tutup;
const q = (s, ...b) => E.DB.prepare(s).bind(...b);
const semua = async (s, ...b) => (await q(s, ...b).all()).results;
const satu = async (s, ...b) => q(s, ...b).first();
const cacah = async (t) => (await satu(`SELECT count(*) AS n FROM ${t}`)).n;
const HEX = (n, c = "a") => c.repeat(n);
const akunDb = {}; // kunci "peran" atau "wilayah32" -> objek akun (seperti keluaran bacaSesi)
let E1, E2, E3, O1, SUMBER;

async function buatAkun(kunci, peran, cakupan = null) {
  const r = await q("INSERT INTO akun (surel, nama, peran, cakupan_prov, status, garam, sandi, iterasi) VALUES (?,?,?,?, 'aktif', ?, ?, 100000)",
    `${kunci}@uji.test`, kunci, peran, cakupan, HEX(32), HEX(64)).run();
  akunDb[kunci] = { id: r.meta.last_row_id, peran, nama: kunci, cakupan_prov: cakupan, status: "aktif" };
}

before(async () => {
  ({ env: E, tutup } = await buatEnv());
  await buatAkun("anggota", "anggota"); await buatAkun("anggota2", "anggota");
  await buatAkun("pengurus", "pengurus"); await buatAkun("kurator", "kurator");
  await buatAkun("wilayah", "wilayah", "31"); await buatAkun("wilayah32", "wilayah", "32");
  await buatAkun("admin", "admin"); await buatAkun("admin2", "admin");
  await buatAkun("super", "super"); await buatAkun("super2", "super");
  SUMBER = (await q("INSERT INTO sumber (url, domain, jenis, diperiksa) VALUES ('https://sumber.example/a', 'sumber.example', 'dokumen-resmi', '2026-11-01')").run()).meta.last_row_id;
  const ent = async (kunci, jenis, prov, lapis, tampil = 0) => (await q(
    "INSERT INTO entitas (kunci, slug, jenis, nama, prov, lapis, tampil, sumber_id) VALUES (?,?,?,?,?,?,?,?)",
    kunci, kunci.split(":")[1], jenis, kunci, prov, lapis, tampil, SUMBER).run()).meta.last_row_id;
  E1 = await ent("lembaga:satu", "lembaga", "31", "publik");
  E2 = await ent("lembaga:dua", "lembaga", "32", "anggota");
  E3 = await ent("lembaga:tiga", "lembaga", "31", "pengurus");
  O1 = await ent("orang:budi", "orang", "31", "publik");
  const fk = (e, kunci, lapis, teks = "x") => q("INSERT INTO fakta (entitas_id, kunci, nilai_teks, per_tanggal, tingkat_bukti, lapis, sumber_id) VALUES (?,?,?, '2026-01-01', 'terkonfirmasi', ?, ?)", e, kunci, teks, lapis, SUMBER).run();
  await fk(E1, "nama_lain", "publik"); await fk(E2, "nama_lain", "anggota"); await fk(E1, "catatan", "pengurus");
  await fk(E1, "kontak_surel", "pengurus", "a@b.id"); await fk(E2, "kontak_surel", "pengurus", "c@d.id"); await fk(E3, "kontak_telepon", "pengurus", "021-1");
  const ik = (lapis, dari, ke) => q("INSERT INTO ikatan (dari, ke, jenis, per_tanggal, tingkat_bukti, lapis, sumber_id) VALUES (?,?, 'memasok', '2026-01-01', 'terkonfirmasi', ?, ?)", dari, ke, lapis, SUMBER).run();
  await ik("publik", E1, E2); await ik("anggota", E2, E1); await ik("pengurus", E1, E3);
  const kr = (e, a, kunci) => q("INSERT INTO koreksi (entitas_id, jenis, kunci, usulan, sumber_url, pengaju_akun, pengaju_kontak) VALUES (?, 'ubah', ?, 'u', 'https://x.example/k', ?, 'rahasia@kontak.id')", e, kunci, akunDb[a].id).run();
  await kr(E1, "anggota", "k1"); await kr(E2, "anggota2", "k2"); await kr(E1, "wilayah", "k3"); await kr(E2, "wilayah32", "k4");
  await q("INSERT INTO riwayat (target_id, jenis, tanggal, judul, oleh) VALUES (?, 'audiensi', '2026-02-01', 'r', ?)", E1, akunDb.admin.id).run();
  const se = (a, i) => q("INSERT INTO sesi (id_hash, akun_id, sampai) VALUES (?,?, unixepoch()+3600)", HEX(64, i), akunDb[a].id).run();
  await se("anggota", "1"); await se("anggota2", "2"); await se("admin", "3"); await se("super", "4"); await se("wilayah", "5");
});
after(async () => { await tutup?.(); });

const pelaku = (peran) => (peran === "publik" ? null : akunDb[peran]);

/* ---------- sinkron matriks dengan salinan KPV ---------- */
test("MATRIKS identik dengan salinan tangan KPV 1 dan semua baris punya 7 sel", () => {
  assert.deepEqual(Object.keys(MATRIKS).sort(), Object.keys(KPV).sort());
  for (const j of Object.keys(KPV)) {
    assert.equal(MATRIKS[j].length, PERAN.length, j);
    assert.deepEqual(MATRIKS[j], KODE_KPV(KPV[j]), `baris ${j} beda dari KPV`);
  }
  assert.ok(!("dummy" in MATRIKS), "K15: tidak ada jenis data dummy");
});

/* ---------- ekspektasi baca, ditulis independen dari hak.js ---------- */
const TABEL_JENIS = { entitas: "entitas", orang: "entitas", fakta: "fakta", kontak: "kontak", ikatan: "ikatan", akun: "akun", sesi: "sesi", koreksi: "koreksi", riwayat: "riwayat", jejak: "jejak" };
const DASAR = {
  entitas: "SELECT id, lapis, prov, NULL AS pemilik, NULL AS sup FROM entitas",
  fakta: "SELECT id, lapis, (SELECT prov FROM entitas WHERE id = entitas_id) AS prov, NULL AS pemilik, NULL AS sup FROM fakta",
  kontak: "SELECT id, lapis, (SELECT prov FROM entitas WHERE id = entitas_id) AS prov, NULL AS pemilik, NULL AS sup FROM fakta WHERE kunci LIKE 'kontak!_%' ESCAPE '!'",
  ikatan: "SELECT id, lapis, NULL AS prov, NULL AS pemilik, NULL AS sup FROM ikatan",
  akun: "SELECT id, 'publik' AS lapis, NULL AS prov, id AS pemilik, (peran = 'super') AS sup FROM akun",
  sesi: "SELECT akun_id AS id, 'publik' AS lapis, NULL AS prov, akun_id AS pemilik, NULL AS sup FROM sesi",
  koreksi: "SELECT id, 'publik' AS lapis, (SELECT prov FROM entitas WHERE id = entitas_id) AS prov, pengaju_akun AS pemilik, NULL AS sup FROM koreksi",
  riwayat: "SELECT id, 'publik' AS lapis, NULL AS prov, NULL AS pemilik, NULL AS sup FROM riwayat",
  jejak: "SELECT id, 'publik' AS lapis, NULL AS prov, NULL AS pemilik, NULL AS sup FROM jejak",
};
const LAPIS_TBL = ["entitas", "fakta", "ikatan"];
async function diharapkan(tabel, peran, kode, a) {
  const lapisOk = { publik: ["publik"], anggota: ["publik", "anggota"], wilayah: ["publik", "anggota"] }[peran] ?? ["publik", "anggota", "pengurus"];
  const baris = await semua(DASAR[tabel] + " ORDER BY id");
  return baris.filter((r) => {
    if (kode === "B") return !LAPIS_TBL.includes(tabel) || lapisOk.includes(r.lapis);
    if (kode === "B prov") return !!a.cakupan_prov && r.prov === a.cakupan_prov;
    if (kode === "T diri" || kode === "T kirim") return r.pemilik === a.id;
    if (kode === "T kirim prov") return r.pemilik === a.id && !!a.cakupan_prov && r.prov === a.cakupan_prov;
    if (kode === "T bukan-super") return !r.sup;
    return true; // T, T cabut
  }).map((r) => r.id);
}
const idDari = (tabel, r) => (tabel === "sesi" ? r.akun_id : r.id);

/* ---------- payload tambah sah per jenis ---------- */
let seq = 0;
const SMB = () => ({ url: "https://sumber.example/a", jenis: "dokumen-resmi" });
function tambahSah(jenis) {
  const n = ++seq;
  switch (jenis) {
    case "entitas": return ["entitas", "tambah", { jenis: "lembaga", nama: `Baru ${n}`, sumber: SMB() }, { kunci: `lembaga:baru-${n}`, slug: `baru-${n}` }, "entitas"];
    case "orang": return ["entitas", "tambah", { jenis: "orang", nama: `Orang ${n}`, sumber: SMB() }, { kunci: `orang:baru-${n}`, slug: `orang-${n}` }, "entitas"];
    case "fakta": return ["fakta", "tambah", { entitas_id: E1, kunci: `k${n}`, nilai_teks: "v", per_tanggal: "2026-03-01", tingkat_bukti: "terkonfirmasi", sumber: SMB() }, {}, "fakta"];
    case "kontak": return ["fakta", "tambah", { entitas_id: E1, kunci: "kontak_surel", nilai_teks: `z${n}@b.id`, per_tanggal: `2026-04-${String(10 + n % 15)}`, tingkat_bukti: "terkonfirmasi", lapis: "pengurus", sumber: SMB() }, {}, "fakta"];
    case "ikatan": return ["ikatan", "tambah", { dari: E3, ke: E2, jenis: "memasok", mulai: `2020-01-${String(1 + n % 28).padStart(2, "0")}`, per_tanggal: `2026-03-${String(1 + n % 28).padStart(2, "0")}`, tingkat_bukti: "terkonfirmasi", sumber: SMB() }, {}, "ikatan"];
    case "akun": return ["akun", "tambah", { surel: `baru${n}@uji.test`, nama: "B", peran: "anggota" }, { aktivasi_hash: HEX(64, "b"), aktivasi_sampai: Math.floor(Date.now() / 1000) + 3600 }, "akun"];
    case "koreksi": return ["koreksi", "kirim", { entitas_id: E1, jenis: "ubah", kunci: `kk${n}`, usulan: "u", sumber_url: "https://x.example/z" }, {}, "koreksi"];
    case "riwayat": return ["riwayat", "tambah", { target_id: E1, jenis: "audiensi", tanggal: "2026-05-01", judul: `j${n}` }, {}, "riwayat"];
    default: return null;
  }
}
const SEL_TULIS_YANG_DIHARAP = { // jenis -> aksi yang dicoba untuk "tulis"
  entitas: "tambah", orang: "tambah", fakta: "tambah", kontak: "tambah", ikatan: "tambah", akun: "tambah", koreksi: "kirim", riwayat: "tambah",
};
// WL hanya boleh kirim koreksi untuk entitas provinsinya sendiri (E1 prov 31 untuk wilayah; wilayah32 harus ditolak pada E1).
const tolakKode = (e) => e?.kode === "dilarang";

/* ---------- SATU UJI PER SEL ---------- */
const SEL = Object.keys(MATRIKS).flatMap((jenis) => PERAN.map((peran, i) => ({ jenis, peran, kode: MATRIKS[jenis][i] })));
for (const { jenis, peran, kode } of SEL) {
  test(`sel ${jenis} x ${peran} [${kode}]`, async () => {
    const a = pelaku(peran);
    const harap = HARAP(kode, jenis);
    // (a) izin dan ditolak, tiap aksi
    for (const aksi of AKSI) {
      const r = hak.boleh(peran, aksi, jenis, undefined, a);
      assert.equal(r.ok, harap.includes(aksi), `${peran} ${aksi} ${jenis}: harap ${harap.includes(aksi)}`);
      if (!r.ok) assert.match(r.alasan, new RegExp(`${peran}.*${aksi}.*${jenis}`), "pesan penolakan menyebut peran, aksi, jenis");
    }
    // (b) baca nyata di D1
    const tabel = Object.keys(TABEL_JENIS).find((t) => TABEL_JENIS[t] === (jenis === "orang" ? "entitas" : jenis) && (t === jenis || (jenis === "orang" && t === "entitas")));
    if (tabel && TABEL_JENIS[tabel]) {
      const nama = jenis === "orang" ? "entitas" : tabel;
      if (harap.includes("baca")) {
        const got = (await hak.baca(E, a, nama, {})).map((r) => idDari(TABEL_JENIS[nama], r)).sort((x, y) => x - y);
        const want = (await diharapkan(TABEL_JENIS[nama], peran, kode, a ?? {})).sort((x, y) => x - y);
        assert.deepEqual(got, want, `baris ${nama} untuk ${peran}`);
        if (kode === "B prov") assert.deepEqual(await hak.baca(E, { ...a, cakupan_prov: null }, nama, {}), [], "WL tanpa cakupan melihat NOL");
      } else {
        await assert.rejects(hak.baca(E, a, nama, {}), tolakKode);
      }
      // (c) tulis nyata di D1
      const aksiT = SEL_TULIS_YANG_DIHARAP[jenis];
      if (aksiT) {
        const [t, ak, data, srv, tbl] = tambahSah(jenis);
        const baris0 = await cacah(tbl), jejak0 = await cacah("jejak");
        if (harap.includes(aksiT)) {
          const { id } = await hak.tulis(E, a, t, ak, data, null, srv);
          assert.ok(id > 0);
          assert.equal(await cacah(tbl), baris0 + 1);
          const j = await satu("SELECT siapa, peran, aksi, tabel, baris_id FROM jejak ORDER BY id DESC LIMIT 1");
          assert.equal(await cacah("jejak"), jejak0 + 1, "tiap tulis = tepat satu jejak");
          assert.deepEqual([j.siapa, j.peran, j.aksi, j.tabel, j.baris_id], [a.id, peran, ak, tbl, String(id)]);
        } else {
          await assert.rejects(hak.tulis(E, a, t, ak, data, null, srv), tolakKode);
          assert.equal(await cacah(tbl), baris0, "ditolak: baris tak bertambah");
          assert.equal(await cacah("jejak"), jejak0, "ditolak: jejak tak ditulis");
        }
      }
    } else if (jenis === "sesi") {
      // sesi: cabut. T diri hanya miliknya; T cabut / T: semua.
      const target = akunDb.anggota2;
      const sebelum = await cacah("sesi");
      const bisaSemua = harap.includes("cabut") && (kode === "T" || kode === "T cabut" || kode === "T cabut bukan-super");
      if (bisaSemua) {
        await hak.tulis(E, a, "sesi", "cabut", {}, target.id);
        assert.equal(await satu("SELECT count(*) AS n FROM sesi WHERE akun_id = ?", target.id).then((r) => r.n), 0);
        assert.equal((await satu("SELECT aksi FROM jejak ORDER BY id DESC LIMIT 1")).aksi, "cabut");
      } else {
        await assert.rejects(hak.tulis(E, a, "sesi", "cabut", {}, target.id), tolakKode, "cabut sesi orang lain ditolak");
        assert.equal(await cacah("sesi"), sebelum);
      }
      if (kode === "T diri") { await hak.tulis(E, a, "sesi", "cabut", {}, a.id); assert.equal((await satu("SELECT count(*) AS n FROM sesi WHERE akun_id = ?", a.id)).n, 0); }
    }
  });
}

test("jumlah uji sel = baris x peran dari data matriks (dihitung, bukan hardcode)", () => {
  assert.equal(SEL.length, Object.keys(MATRIKS).length * PERAN.length);
  console.log(`# jumlah sel matriks: ${SEL.length}`);
});

/* ---------- uji turunan ---------- */
test("klausa: bentuk sql dan bentuk baris setara pada baris nyata", async () => {
  const kasus = [
    ["entitas", "SELECT id, lapis, prov FROM entitas"],
    ["fakta", "SELECT id, lapis, (SELECT prov FROM entitas WHERE id = entitas_id) AS prov FROM fakta"],
    ["koreksi", "SELECT id, pengaju_akun, (SELECT prov FROM entitas WHERE id = entitas_id) AS prov FROM koreksi"],
    ["akun", "SELECT id, peran FROM akun"], ["sesi", "SELECT akun_id, rowid AS id FROM sesi"],
  ];
  for (const [tabel, dasar] of kasus) {
    const baris = await semua(dasar);
    for (const k of Object.keys(hak.KLAUSA)) {
      for (const a of [null, ...Object.values(akunDb), { ...akunDb.wilayah, cakupan_prov: null }]) {
        const pel = { ...(a ?? {}), peran: hak.peranEfektif(a) };
        const c = hak.KLAUSA[k].sql(pel, tabel);
        const lewatSql = c ? (await semua(`SELECT x.id AS id FROM (${dasar}) x JOIN ${tabel} t ON t.rowid = x.id WHERE ${c.s}`.replace(/\bFROM \(/, "FROM (").replace(/WHERE (?=.)/, "WHERE "), ...c.b).catch(() => null)) : null;
        if (!c || lewatSql === null) continue; // klausa tak berlaku pada tabel itu, atau kolom klausa ada di tabel dasar (diuji via baca di atas)
        const lewatBaris = baris.filter((r) => hak.KLAUSA[k].baris(pel, r, tabel)).map((r) => r.id).sort((x, y) => x - y);
        assert.deepEqual(lewatSql.map((r) => r.id).sort((x, y) => x - y), lewatBaris, `klausa ${k} pada ${tabel} untuk ${pel.peran}`);
      }
    }
  }
});

test("peran tak dikenal, akun nonaktif, peran tak cocok akun = publik (sesi valid bukan izin)", async () => {
  assert.equal(hak.boleh("superman", "baca", "jejak", undefined, null).ok, false);
  assert.equal(hak.boleh("super", "baca", "jejak", undefined, { ...akunDb.super, status: "nonaktif" }).ok, false);
  assert.equal(hak.boleh("super", "baca", "jejak", undefined, { ...akunDb.anggota }).ok, false, "label peran palsu");
  await assert.rejects(hak.baca(E, { ...akunDb.super, status: "nonaktif" }, "jejak", {}), tolakKode);
  assert.equal(hak.boleh("anggota", "baca", "potret_anggota", undefined, akunDb.anggota).ok, true);
  assert.equal(hak.boleh("anggota", "baca", "potret_pengurus", undefined, akunDb.anggota).ok, false, "login bukan izin baca pengurus");
});

test("default-deny: tabel/jenis tak dikenal, jejak/daftar_tolak tak bisa ditulis siapa pun", async () => {
  await assert.rejects(hak.baca(E, akunDb.super, "sqlite_master", {}), tolakKode);
  await assert.rejects(hak.baca(E, akunDb.super, "label", {}), tolakKode);
  assert.equal(hak.boleh("super", "baca", "tabel_gaib", undefined, akunDb.super).ok, false);
  for (const p of PERAN) for (const aksi of ["tambah", "ubah", "hapus"]) {
    await assert.rejects(hak.tulis(E, pelaku(p), "jejak", aksi, { aksi: "ubah" }, 1), tolakKode, `jejak ${p} ${aksi}`);
  }
});

test("daftar putih: kolom di luar KOLOM_TULIS dan data terlarang ditolak untuk semua peran, SA pun", async () => {
  for (const kunci of ["id", "dummy", "dibuat", "dibuat_oleh", "kunci", "slug", "nik", "agama", "tanggal_lahir", "alamat_rumah", "status_kawin", "biometrik", "foto_wajah", "usia"]) {
    const [t, ak, data, srv] = tambahSah("entitas");
    await assert.rejects(hak.tulis(E, akunDb.super, t, ak, { ...data, [kunci]: "x" }, null, srv), (e) => e.kode === "masukan_salah", kunci);
    const [t2, ak2, d2, s2] = tambahSah("fakta");
    await assert.rejects(hak.tulis(E, akunDb.super, t2, ak2, { ...d2, [kunci]: "x" }, null, s2), (e) => e.kode === "masukan_salah", kunci);
  }
  await assert.rejects(hak.tulis(E, akunDb.super, "entitas", "tambah", { jenis: "lembaga", nama: "X", sumber: SMB(), sandi: "x" }, null, { kunci: "lembaga:zz", slug: "zz" }), (e) => e.kode === "masukan_salah");
  // kunci/slug dari klien ditolak; dari server tak dipakai pada ubah
  await assert.rejects(hak.tulis(E, akunDb.kurator, "entitas", "ubah", { slug: "baru" }, E1), (e) => e.kode === "masukan_salah");
  await assert.rejects(hak.tulis(E, akunDb.kurator, "entitas", "ubah", { kunci: "lembaga:x" }, E1), (e) => e.kode === "masukan_salah");
});

test("fakta/ikatan/entitas tanpa sumber DITOLAK untuk semua peran, termasuk SA", async () => {
  for (const p of ["kurator", "admin", "super"]) {
    const [, , data, srv] = tambahSah("fakta");
    delete data.sumber;
    const n0 = await cacah("fakta");
    await assert.rejects(hak.tulis(E, akunDb[p], "fakta", "tambah", data, null, srv), (e) => e.kode === "sumber_wajib");
    const [, , d2, s2] = tambahSah("ikatan"); delete d2.sumber;
    await assert.rejects(hak.tulis(E, akunDb[p], "ikatan", "tambah", d2, null, s2), (e) => e.kode === "sumber_wajib");
    const [, , d3, s3] = tambahSah("entitas"); delete d3.sumber;
    await assert.rejects(hak.tulis(E, akunDb[p], "entitas", "tambah", d3, null, s3), (e) => e.kode === "sumber_wajib");
    assert.equal(await cacah("fakta"), n0);
  }
  const [, , d, s] = tambahSah("fakta"); delete d.tingkat_bukti;
  await assert.rejects(hak.tulis(E, akunDb.super, "fakta", "tambah", d, null, s), (e) => e.kode === "masukan_salah", "tingkat_bukti wajib (CHECK/NOT NULL)");
});

test("kolom rahasia tak pernah terbaca lewat baca; pengaju_kontak hanya KR/AD/SA", async () => {
  const a = (await hak.baca(E, akunDb.super, "akun", {}))[0];
  for (const k of ["garam", "sandi", "iterasi", "aktivasi_hash", "aktivasi_sampai"]) assert.ok(!(k in a), k);
  await assert.rejects(hak.baca(E, akunDb.super, "akun", { kolom: ["sandi"] }), (e) => e.kode === "masukan_salah");
  await assert.rejects(hak.baca(E, akunDb.super, "akun", { where: { sandi: HEX(64) } }), (e) => e.kode === "masukan_salah");
  await assert.rejects(hak.baca(E, akunDb.super, "sesi", { kolom: ["id_hash"] }), (e) => e.kode === "masukan_salah");
  assert.ok(!("id_hash" in (await hak.baca(E, akunDb.super, "sesi", {}))[0]));
  assert.ok("pengaju_kontak" in (await hak.baca(E, akunDb.kurator, "koreksi", {}))[0]);
  assert.ok(!("pengaju_kontak" in (await hak.baca(E, akunDb.anggota, "koreksi", {}))[0]));
  await assert.rejects(hak.baca(E, akunDb.anggota, "koreksi", { kolom: ["pengaju_kontak"] }), (e) => e.kode === "masukan_salah");
});

test("injeksi: nama kolom/urut/tabel jahat dan nilai jahat tidak mengubah SQL", async () => {
  const jahat = "id; DROP TABLE akun; --";
  await assert.rejects(hak.baca(E, akunDb.super, "akun", { urut: jahat }), (e) => e.kode === "masukan_salah");
  await assert.rejects(hak.baca(E, akunDb.super, "akun", { kolom: [jahat] }), (e) => e.kode === "masukan_salah");
  await assert.rejects(hak.baca(E, akunDb.super, "akun", { where: { [jahat]: 1 } }), (e) => e.kode === "masukan_salah");
  await assert.rejects(hak.baca(E, akunDb.super, `akun; ${jahat}`, {}), tolakKode);
  assert.deepEqual(await hak.baca(E, akunDb.super, "akun", { where: { nama: "' OR 1=1 --" } }), []);
  assert.deepEqual(await hak.baca(E, akunDb.super, "akun", { cari: { kolom: ["nama"], teks: "%" } }), [], "wildcard di-escape");
  assert.ok((await cacah("akun")) > 5);
});

test("jenisData: tiap tabel D1 terpetakan; kontak_* ke kontak, orang ke orang", () => {
  assert.equal(hak.jenisData("entitas", { jenis: "orang" }), "orang");
  assert.equal(hak.jenisData("entitas", { jenis: "lembaga" }), "entitas");
  assert.equal(hak.jenisData("fakta", { kunci: "kontak_surel" }), "kontak");
  assert.equal(hak.jenisData("fakta", { kunci: "kapasitas" }), "fakta");
  for (const t of ["ikatan", "akun", "sesi", "koreksi", "riwayat", "jejak"]) assert.equal(hak.jenisData(t), t);
  assert.throws(() => hak.jenisData("tabel_baru"), (e) => e.kode === "dilarang");
});

test("jejak: dari/ke tanpa kolom rahasia; entitas orang hanya nama kolom; jejak append-only di D1", async () => {
  await hak.tulis(E, akunDb.admin, "akun", "ubah", { nama: "Admin Baru" }, akunDb.anggota2.id);
  const j = await satu("SELECT dari, ke FROM jejak WHERE tabel = 'akun' AND aksi = 'ubah' ORDER BY id DESC LIMIT 1");
  assert.deepEqual(JSON.parse(j.ke), { nama: "Admin Baru" }); assert.deepEqual(JSON.parse(j.dari), { nama: "anggota2" });
  for (const x of await semua("SELECT dari, ke FROM jejak WHERE dari IS NOT NULL OR ke IS NOT NULL")) {
    assert.doesNotMatch(`${x.dari}${x.ke}`, /garam|"sandi"|aktivasi_hash|aktivasi_sampai|iterasi|id_hash|pengaju_kontak/);
  }
  await hak.tulis(E, akunDb.kurator, "entitas", "ubah", { nama: "Budi Rahasia Nama" }, O1);
  const o = await satu("SELECT dari, ke FROM jejak WHERE tabel = 'entitas' AND baris_id = ? ORDER BY id DESC LIMIT 1", String(O1));
  assert.deepEqual(JSON.parse(o.ke), ["nama"]); assert.deepEqual(JSON.parse(o.dari), ["nama"]);
  assert.doesNotMatch(`${o.dari}${o.ke}`, /Budi/);
  const id = (await satu("SELECT min(id) AS i FROM jejak")).i;
  await assert.rejects(q("UPDATE jejak SET aksi = 'hapus' WHERE id = ?", id).run(), /tidak boleh diubah/);
  await assert.rejects(q("DELETE FROM jejak WHERE id = ?", id).run(), /tidak boleh dihapus/);
});

test("tulis atomik: batch gagal tidak meninggalkan baris maupun jejak", async () => {
  const [, , data, srv] = tambahSah("fakta");
  const n = await cacah("fakta"), j = await cacah("jejak"), s = await cacah("sumber");
  await assert.rejects(hak.tulis(E, akunDb.kurator, "fakta", "tambah", { ...data, entitas_id: 999999, sumber: { url: "https://baru.example/zz", jenis: "media" } }, null, srv), (e) => ["konflik", "masukan_salah"].includes(e.kode));
  assert.equal(await cacah("fakta"), n); assert.equal(await cacah("jejak"), j); assert.equal(await cacah("sumber"), s, "upsert sumber ikut batal");
});

test("WL: koreksi hanya untuk entitas provinsinya; WL tanpa cakupan 0 baris kontak", async () => {
  const dua = { entitas_id: E2, jenis: "ubah", kunci: "wl_x", usulan: "u", sumber_url: "https://x.example/z" };
  await assert.rejects(hak.tulis(E, akunDb.wilayah, "koreksi", "kirim", dua), tolakKode);
  await hak.tulis(E, akunDb.wilayah32, "koreksi", "kirim", dua);
  assert.deepEqual(await hak.baca(E, { ...akunDb.wilayah, cakupan_prov: null }, "kontak", {}), []);
  const k = await hak.baca(E, akunDb.wilayah, "kontak", {});
  assert.ok(k.length > 0 && k.every((r) => r.lapis === "pengurus"));
  const e1 = new Set((await semua("SELECT id FROM fakta WHERE entitas_id IN (SELECT id FROM entitas WHERE prov = '31')")).map((r) => r.id));
  assert.ok(k.every((r) => e1.has(r.id)), "hanya provinsi 31");
  assert.equal(hak.boleh("wilayah", "baca", "potret_pengurus", undefined, akunDb.wilayah).ok, false, "WL tak membaca lapis pengurus");
});

test("kontrak sesi/sandi/laju/aktivasi untuk worker-inti", async () => {
  const a = akunDb.anggota;
  const idHash = HEX(64, "9");
  await hak.catatSesi(E, { idHash, akunId: a.id, ipHash: HEX(16, "1") });
  const s = await hak.bacaSesi(E, idHash);
  assert.equal(s.id, a.id); assert.equal(s.peran, "anggota"); assert.ok(s.sampai > Date.now() / 1000);
  assert.ok(!("sandi" in s) && !("garam" in s));
  assert.equal((await satu("SELECT aksi FROM jejak ORDER BY id DESC LIMIT 1")).aksi, "masuk");
  assert.equal((await hak.cariAkunUntukMasuk(E, "ANGGOTA@uji.test")).id, a.id, "surel NOCASE");
  assert.equal(await hak.cariAkunUntukMasuk(E, "tidak@ada.test"), null);
  assert.deepEqual(await hak.hapusSesi(E, idHash), { dihapus: 1 });
  assert.equal(await hak.bacaSesi(E, idHash), null);
  assert.equal((await satu("SELECT aksi FROM jejak ORDER BY id DESC LIMIT 1")).aksi, "keluar");
  // sesi kedaluwarsa dan akun nonaktif = tidak ada
  await hak.catatSesi(E, { idHash: HEX(64, "8"), akunId: a.id, sampai: Math.floor(Date.now() / 1000) + 1 });
  assert.equal(await hak.bacaSesi(E, HEX(64, "8")).then((x) => x?.id), a.id);
  await q("UPDATE sesi SET sampai = unixepoch() - 10, dibuat = unixepoch() - 20 WHERE id_hash = ?", HEX(64, "8")).run();
  assert.equal(await hak.bacaSesi(E, HEX(64, "8")), null);
  // laju
  assert.equal(await hak.catatLaju(E, "masuk-ip:abc", 900), 1);
  assert.equal(await hak.catatLaju(E, "masuk-ip:abc", 900), 2);
  assert.equal(await hak.catatLaju(E, "masuk-ip:lain", 900), 1);
  assert.equal(await hak.catatLaju(E, "masuk-ip:abc", 900, Math.floor(Date.now() / 1000) + 3600), 1, "jendela baru");
  await assert.rejects(hak.catatLaju(E, "bukan-aksi:abc", 900), (e) => e.kode === "masukan_salah");
  // aktivasi sekali pakai
  const th = HEX(64, "c");
  await q("INSERT INTO akun (surel, nama, peran, aktivasi_hash, aktivasi_sampai) VALUES ('akt@uji.test','Akt','anggota',?, unixepoch()+3600)", th).run();
  const [r1, r2] = await Promise.all([hak.pakaiTautanAktivasi(E, th), hak.pakaiTautanAktivasi(E, th)]);
  assert.equal([r1, r2].filter(Boolean).length, 1, "tepat satu pemakaian menang");
  const akt = r1 ?? r2;
  assert.equal(akt.status, "menunggu");
  assert.equal(await hak.pakaiTautanAktivasi(E, HEX(64, "d")), null);
  await q("INSERT INTO akun (surel, nama, peran, aktivasi_hash, aktivasi_sampai) VALUES ('lewat@uji.test','L','anggota',?, unixepoch()-5)", HEX(64, "e")).run();
  assert.equal(await hak.pakaiTautanAktivasi(E, HEX(64, "e")), null, "kedaluwarsa");
  // ubahSandi: aktifkan + cabut sesi lain
  await hak.catatSesi(E, { idHash: HEX(64, "6"), akunId: akt.id }); await hak.catatSesi(E, { idHash: HEX(64, "7"), akunId: akt.id });
  assert.deepEqual(await hak.ubahSandi(E, akt.id, HEX(64, "5"), HEX(32, "5"), 210000, HEX(64, "7")), { ok: true });
  const sesAkt = (await semua("SELECT id_hash FROM sesi WHERE akun_id = ?", akt.id)).map((x) => x.id_hash);
  assert.deepEqual(sesAkt, [HEX(64, "7")]);
  const ak = await satu("SELECT status, iterasi, aktivasi_hash FROM akun WHERE id = ?", akt.id);
  assert.deepEqual([ak.status, ak.iterasi, ak.aktivasi_hash], ["aktif", 210000, null]);
  assert.equal((await satu("SELECT aksi FROM jejak WHERE tabel='akun' AND baris_id = ? ORDER BY id DESC LIMIT 1", String(akt.id))).aksi, "aktivasi");
  await hak.ubahSandi(E, akt.id, HEX(64, "4"), HEX(32, "4"), 210000);
  assert.equal((await satu("SELECT aksi FROM jejak WHERE tabel='akun' AND baris_id = ? ORDER BY id DESC LIMIT 1", String(akt.id))).aksi, "ganti-sandi");
  // dua langkah: periksa tidak menghanguskan; pakai(hash) atomik
  const t2 = HEX(64, "f");
  await q("INSERT INTO akun (surel, nama, peran, aktivasi_hash, aktivasi_sampai) VALUES ('dua@uji.test','D','anggota',?, unixepoch()+3600)", t2).run();
  assert.equal((await hak.periksaTautanAktivasi(E, t2)).surel, "dua@uji.test");
  assert.ok(await hak.periksaTautanAktivasi(E, t2), "periksa tak menghanguskan");
  const [p1, p2] = await Promise.all([hak.pakaiTautanAktivasi(E, t2, HEX(64, "3"), HEX(32, "3"), 210000), hak.pakaiTautanAktivasi(E, t2, HEX(64, "2"), HEX(32, "2"), 210000)]);
  assert.equal([p1, p2].filter(Boolean).length, 1);
  assert.equal(await hak.periksaTautanAktivasi(E, t2), null);
  assert.equal((await satu("SELECT status FROM akun WHERE surel='dua@uji.test'")).status, "aktif");
  assert.equal(await hak.sapu(E).then((r) => typeof r.sesi), "number");
});

// Ikuti + portal + METI Wilayah (0019): matriks gerbang per peran. publik/tamu ditolak di semua fungsi; hanya admin dan super menyentuh antrean dan tautan wilayah;
// peran lain (anggota..wilayah) boleh ikuti dan mengajukan klaim, tetapi ajuan lembaga/wilayah menuntut tautan yang disetujui admin.
test("0019: gerbang hak per peran untuk ikuti, portal, wilayah", async () => {
  const MASUK = ["anggota", "pengurus", "kurator", "wilayah", "admin", "super"], ADMIN = ["admin", "super"];
  const fnMasuk = [
    (a) => hak.ikutiDaftar(E, a), (a) => hak.ikutiSet(E, a, "proyek", "pj_x", true), (a) => hak.ikutiLihat(E, a), (a) => hak.ikutiPerubahan(E, a, 0),
    (a) => hak.orgSaya(E, a), (a) => hak.orgTerbit(E, a, "organisasi", "ix_x"), (a) => hak.wilayahKode(E, a), (a) => hak.wilayahSaya(E, a), (a) => hak.wilayahTerbit(E, a, "32"),
  ];
  const fnAdmin = [
    (a) => hak.orgAntrean(E, a, "ajuan", "baru"), (a) => hak.orgPutus(E, a, "ajuan", 999, "setuju", null), (a) => hak.wilayahAkunDaftar(E, a),
    (a) => hak.wilayahAkunTaut(E, a, { akunId: 999999, kode: "32" }), (a) => hak.wilayahAkunLepas(E, a, 999999),
  ];
  const ditolak = async (f, a) => { try { await f(a); return false; } catch (e) { return e.status === 403; } };
  for (const f of [...fnMasuk, ...fnAdmin]) {
    assert.ok(await ditolak(f, null), "tamu ditolak");
    assert.ok(await ditolak(f, { id: 1, peran: "publik" }), "publik ditolak");
  }
  for (const peran of MASUK) {
    const a = akunDb[peran] ?? akunDb.anggota;
    for (const f of fnMasuk) assert.ok(!(await ditolak(f, a)), `${peran} boleh fungsi masuk`);
    for (const f of fnAdmin) assert.equal(await ditolak(f, a), !ADMIN.includes(peran), `${peran} vs fungsi admin`);
  }
  // ajuan lembaga dan wilayah tanpa tautan disetujui: ditolak untuk SEMUA peran, termasuk super
  for (const peran of MASUK) {
    const a = akunDb[peran];
    assert.ok(await ditolak((x) => hak.orgAjuanBaru(E, x, { organisasiId: "ix_x", jenis: "profil", isi: { deskripsi: "d" }, bukti: "https://a.test/x" }), a), `${peran}: ajuan tanpa klaim`);
    assert.ok(await ditolak((x) => hak.wilayahAjuanBaru(E, x, { kode: "32", jenis: "bidang", isi: { bidang: ["a"] }, bukti: "https://a.test/x" }), a), `${peran}: ajuan wilayah tanpa tautan`);
  }
  // sesudah ditautkan ke 32: boleh untuk 32, ditolak untuk 31
  assert.equal((await hak.wilayahAkunTaut(E, akunDb.admin, { akunId: akunDb.anggota.id, kode: "32" })).ada, true);
  assert.ok((await hak.wilayahAjuanBaru(E, akunDb.anggota, { kode: "32", jenis: "bidang", isi: { bidang: ["a"] }, bukti: "https://a.test/x" })).id > 0);
  assert.ok(await ditolak((x) => hak.wilayahAjuanBaru(E, x, { kode: "31", jenis: "bidang", isi: { bidang: ["a"] }, bukti: "https://a.test/x" }), akunDb.anggota), "provinsi lain ditolak");
  // PERAN/MATRIKS tidak berubah: tautan wilayah bukan peran baru
  assert.equal(PERAN.length, 7);
});
