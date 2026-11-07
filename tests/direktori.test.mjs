// direktori.test.mjs (JM-C02 sampai C05): konstanta domain, data contoh bersumber, rute menolak tamu, fungsi murni layar.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { rute, DATA_DIREKTORI, SEKTOR_SAH } from "../src/direktori.js";

const baca = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
const JS = baca("public/direktori.js"), HTML = baca("public/direktori.html"), CSS = baca("public/direktori.css");

test("konstanta tak lagi memuat istilah kebencanaan atau merek asal", () => {
  for (const [nama, teks] of [["direktori.js", JS], ["direktori.html", HTML], ["direktori.css", CSS], ["src/direktori.js", baca("src/direktori.js")], ["fungsi_direktori.js", baca("public/fungsi_direktori.js")]]) {
    const kena = teks.match(/BNPB|BPBD|karhutla|DIBI|Centurisk|bencana|kebencanaan|bnpb|rumpun|RUMPUN/gi);
    assert.equal(kena, null, `${nama}: ${kena && [...new Set(kena)].join(",")}`);
  }
});

test("sepuluh tab (Proyek dan Regulasi baru), tanpa Donasi; Jejak isu jadi sub-tab Riset", () => {
  const tabs = JS.match(/const TABS = \[([^\]]*)\]/)[1].split(",").map((s) => s.trim().replace(/"/g, ""));
  assert.deepEqual(tabs, ["pakar", "lembaga", "proyek", "regulasi", "wilayah", "inovasi", "riset", "sistem_data", "pendanaan", "pustaka"]);
  assert.match(JS, /\["jejak-isu", "Jejak isu", "kejadian"\]/);
});

test("SEKTOR di layar = 19 kode K16 (13 teknologi + 6 lintas bidang) = SEKTOR_SAH Worker", () => {
  const blok = JS.slice(JS.indexOf("const SEKTOR = {"), JS.indexOf("const SEKTOR_GRUP"));
  const kunci = [...blok.matchAll(/^\s+"?([a-z-]+)"?: \[/gm)].map((m) => m[1]);
  assert.equal(kunci.length, 19);
  assert.deepEqual(new Set(kunci), SEKTOR_SAH);
});

test("layar tanpa style=, onclick=, skrip inline, hex liar, toLocaleString", () => {
  assert.doesNotMatch(HTML, /\sstyle=|\sonclick=|<script(?![^>]*\ssrc=)/);
  assert.doesNotMatch(JS, /[ ("'`]style="/);
  assert.doesNotMatch(JS + CSS, /#[0-9a-fA-F]{6}\b|—/);
  assert.doesNotMatch(JS, /toLocale(Date)?String/);
});

const URL_SAH = /^https?:\/\/[^\s"'<>]{4,590}$/, TGL = /^\d{4}-\d{2}-\d{2}$/;
function periksaSumber(nama, o, jalur = nama) {
  const gagal = (m) => assert.fail(`${jalur}: ${m}`);
  const s = o.sumber_url ? [{ url: o.sumber_url }] : Array.isArray(o.sumber) ? o.sumber : o.sumber && o.sumber.url ? [o.sumber] : [];
  if (!s.length) gagal("tanpa sumber");
  for (const x of s) {
    if (!URL_SAH.test(String(x.url))) gagal("url sumber tak sah " + x.url);
    if (/^(javascript|data|blob):/i.test(x.url)) gagal("skema terlarang");
    if (x.diperiksa !== undefined && !TGL.test(x.diperiksa)) gagal("tanggal diperiksa tak sah");
  }
}
test("data contoh fiktif lulus skema sumber wajib (url, tanggal), tanpa kontak pribadi nyata", () => {
  const dir = new URL("../data/contoh/", import.meta.url);
  const berkas = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
  assert.ok(berkas.length >= 14);
  for (const f of berkas) {
    const d = JSON.parse(fs.readFileSync(new URL(f, dir), "utf8")), nama = f.replace(".json", "");
    if (nama === "sinta") { for (const [id, x] of Object.entries(d)) { assert.match(id, /^\d{1,9}$/); periksaSumber(nama, x, "sinta:" + id); assert.ok(x.tabel["H-Index"] && x.artikel.length); } continue; }
    if (nama === "kampus") { assert.ok(Object.keys(d).length); continue; }
    if (nama === "kontak") { for (const [id, v] of Object.entries(d)) for (const e of v.email) assert.match(e, /@contoh-kampus\.example\.org$/, id); continue; }
    if (nama === "induk") { periksaSumber(nama, d); assert.equal(d.sektor.length, 14); for (const r of d.orang) { assert.match(r[0], /^A\d{4,12}$/); assert.match(r[1], /\(contoh\)$/); for (const s of r[3]) assert.ok(SEKTOR_SAH.has(s)); } continue; }
    const arr = Array.isArray(d) ? d : Array.isArray(d.kejadian) ? d.kejadian : Array.isArray(d.temuan) ? d.temuan : [d];
    if (!Array.isArray(d) && !Array.isArray(d.kejadian) && !Array.isArray(d.temuan)) periksaSumber(nama, d);
    for (const x of arr) periksaSumber(nama, x, `${nama}:${x.id}`);
    const teks = JSON.stringify(d);
    assert.doesNotMatch(teks, /"dummy"/, nama + ": kolom dummy dibatalkan (K15)");
    assert.doesNotMatch(teks, /https?:\/\/(?!(?:[a-z0-9-]+\.)*example\.org|doi\.org)/, nama + ": hanya example.org");
  }
});

const p = (akun) => ({ params: { nama: "lembaga", id: "A1234" }, sesi: akun ? {} : null, akun });
const req = (u = "http://x/api/direktori", init) => new Request(u, init);
const ctx = { waitUntil() {} };
test("rute direktori menolak tamu (401 belum_masuk), kecuali logo publik", async () => {
  for (const [k, fn] of Object.entries(rute)) {
    if (k.includes("/gambar/logo/")) continue;
    await assert.rejects(() => fn(req(), {}, ctx, p(null)), (e) => e.kode === "belum_masuk" && e.status === 401, k);
  }
});

test("anggota membaca data contoh bila potret belum ada; kontak hanya pengurus ke atas", async () => {
  const anggota = { id: 1, peran: "anggota", status: "aktif" }, pengurus = { id: 2, peran: "pengurus", status: "aktif" };
  const r = await rute["GET /api/direktori"](req(), {}, ctx, p(anggota));
  assert.equal(r.status, 200); assert.equal(r.headers.get("x-contoh"), "1"); assert.match(r.headers.get("cache-control"), /no-store/);
  const d = await r.json(); assert.ok(d.orang.length >= 10);
  await assert.rejects(() => rute["GET /api/direktori/kontak"](req(), {}, ctx, p(anggota)), (e) => e.kode === "dilarang");
  assert.equal((await rute["GET /api/direktori/kontak"](req(), {}, ctx, p(pengurus))).status, 200);
  for (const n of DATA_DIREKTORI.filter((x) => ["lembaga", "inovasi", "riset"].includes(x))) {
    const x = await rute["GET /api/direktori/data/:nama"](req(), {}, ctx, { ...p(anggota), params: { nama: n } }); assert.equal(x.status, 200, n);
  }
  await assert.rejects(() => rute["GET /api/direktori/data/:nama"](req(), {}, ctx, { ...p(anggota), params: { nama: "sensor" } }), (e) => e.kode === "tidak_ditemukan");
});

test("terdekat: sektor dan koordinat divalidasi; email hanya untuk pengurus", async () => {
  const q = (s) => req("http://x/api/direktori/terdekat?" + s);
  const anggota = { id: 1, peran: "anggota" }, pengurus = { id: 2, peran: "pengurus" };
  await assert.rejects(() => rute["GET /api/direktori/terdekat"](q("sektor=gempa&lat=-6.9&lon=107.6"), {}, ctx, p(anggota)), (e) => e.kode === "masukan_salah");
  await assert.rejects(() => rute["GET /api/direktori/terdekat"](q("sektor=surya&lat=50&lon=107.6"), {}, ctx, p(anggota)), (e) => e.kode === "masukan_salah");
  const a = await (await rute["GET /api/direktori/terdekat"](q("sektor=surya&lat=-6.9&lon=107.6&n=3"), {}, ctx, p(anggota))).json();
  assert.ok(a.pakar.length && a.pakar.every((x) => x.email.length === 0));
  assert.ok(a.pakar.every((x, i, arr) => i === 0 || arr[i - 1].km <= x.km));
  const b = await (await rute["GET /api/direktori/terdekat"](q("sektor=surya&lat=-6.9&lon=107.6&n=10"), {}, ctx, p(pengurus))).json();
  assert.ok(b.pakar.some((x) => x.email.length));
});

test("fungsi_direktori: sektor multi-pilih dan analisa keahlian energi", () => {
  const win = {}; vm.runInNewContext(baca("public/fungsi_direktori.js"), { window: win, globalThis: win });
  assert.equal(win.cocokSektor(new Set(), ["surya"]), true);
  assert.equal(win.cocokSektor(new Set(["bayu"]), ["surya"]), false);
  assert.equal(win.cocokSektor(new Set(["bayu", "surya"]), ["surya"]), true);
  assert.equal(JSON.stringify(win.bacaSektor("surya,gempa,surya", ["surya", "bayu"])), '["surya"]');
  assert.equal(win.tulisSektor(["a", "b"]), "a,b");
  assert.equal(win.togglePilihan(new Set(["a"]), "a").size, 0);
  const h = win.analisaKeahlian([{ id: "W1", judul: "Solar photovoltaic rooftop in Semarang", tahun: 2024, topik: [], kunci: [] }, { id: "W2", judul: "Photovoltaic battery storage", tahun: 2023, topik: [], kunci: [] }]);
  assert.equal(h.jenis[0].kunci, "surya"); assert.equal(h.jenis[0].n, 2);
  assert.equal(win.tingkatPenerima("PT Contoh Energi"), "nonpem");
});

test("orang di tokoh.json: riwayat, pendidikan, kiprah, tautan bersumber; pakar_id menunjuk baris induk", () => {
  const T = JSON.parse(baca("data/contoh/tokoh.json")), induk = JSON.parse(baca("data/contoh/induk.json")).orang.map((r) => r[0]);
  assert.ok(T.length >= 4);
  for (const x of T) {
    assert.ok(Number.isInteger(x.eid), x.id); assert.ok(x.riwayat.length && x.pendidikan.length && Array.isArray(x.kiprah) && x.tautan.length, x.id);
    for (const r of x.riwayat) { assert.ok(r.jabatan && r.mulai); assert.match(r.sumber_url, URL_SAH); }
    for (const r of x.pendidikan) { assert.match(r.jenjang, /^S[123]$/); assert.ok(r.institusi && r.bidang); assert.match(r.sumber_url, URL_SAH); }
    for (const r of x.tautan) assert.match(r.url, /^https:\/\/[^\s]+example\.org/);
    if (x.pakar_id) assert.ok(induk.includes(x.pakar_id), x.id);
  }
  assert.ok(T.some((x) => x.riwayat.some((r) => !r.selesai)), "ada jabatan Kini");
});

test("sinta: rincian dilayani untuk anggota, 404 bila tak ada, 401 tamu", async () => {
  const a = { id: 1, peran: "anggota" };
  const r = await rute["GET /api/direktori/sinta/:id"](req(), {}, ctx, { params: { id: "6000101" }, sesi: {}, akun: a });
  assert.equal(r.status, 200); assert.ok((await r.json()).artikel.length);
  await assert.rejects(() => rute["GET /api/direktori/sinta/:id"](req(), {}, ctx, { params: { id: "1" }, sesi: {}, akun: a }), (e) => e.kode === "tidak_ditemukan");
  await assert.rejects(() => rute["GET /api/direktori/sinta/:id"](req(), {}, ctx, { params: { id: "6000101" }, sesi: null, akun: null }), (e) => e.status === 401);
});

test("lembar orang memuat semua bagian: riwayat jabatan, pendidikan, kiprah, tautan, riwayat METI, SINTA", () => {
  for (const k of ["riwayatTk(", "pendidikanTk(", "tautanTk(", "Kiprah EBET", "rinciSinta(o)", "dir.riwayat.judulBagian", "Tokoh sejenis", "Berita terkait", "Pakar sejenis", "Sering menulis bersama", "Metrik publikasi menurut SINTA", "Artikel Scopus terbaru"]) assert.ok(JS.includes(k), k);
});

test("GET /api/admin/anggota-meti: anggota 403, pengurus 200 dari R2 tanpa cache, R2 kosong 404", async () => {
  const f = "GET /api/admin/anggota-meti", isi = JSON.stringify({ lapis: "pengurus", jumlah: 1, baris: [{ no_anggota: "X1", nama: "Fiktif" }] });
  const env = { BERKAS: { get: async (k) => (k === "potret/pengurus/anggota_meti.json" ? { body: isi } : null) } };
  await assert.rejects(() => rute[f](req(), env, ctx, p({ id: 1, peran: "anggota" })), (e) => e.kode === "dilarang" && e.status === 403);
  await assert.rejects(() => rute[f](req(), env, ctx, p(null)), (e) => e.status === 401);
  const r = await rute[f](req(), env, ctx, p({ id: 2, peran: "pengurus" }));
  assert.equal(r.status, 200); assert.match(r.headers.get("cache-control"), /private, no-store/);
  assert.equal((await r.json()).baris[0].no_anggota, "X1");
  await assert.rejects(() => rute[f](req(), {}, ctx, p({ id: 2, peran: "admin" })), (e) => e.kode === "tidak_ditemukan");
});
