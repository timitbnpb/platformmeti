// /energi-baru: data energi baru (scripts/panen/energi_baru.mjs) dan inventaris PLTU (scripts/panen/pltu.mjs): tautan dua arah hidup, sumber ada, label EST, kunci i18n lengkap.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { bangun as bangunE, BAGIAN, STATUS } from "../scripts/panen/energi_baru.mjs";
import { bangun as bangunP, kelasUmur, tingkatUmur, provDari } from "../scripts/panen/pltu.mjs";

const j = (f) => JSON.parse(readFileSync(f, "utf8"));
const E = j("public/data/energi_baru.json"), P = j("public/data/pltu.json");

test("berkas terbit sama dengan keluaran skrip", () => {
  assert.deepEqual(E, JSON.parse(JSON.stringify(bangunE())));
  assert.deepEqual(P, JSON.parse(JSON.stringify(bangunP())));
});

test("energi baru: tiap butir punya sumber, status sah, dan tautan hidup", () => {
  const org = new Set(j("public/data/organisasi.json").baris.map((o) => o.id));
  const reg = new Set(j("public/data/regulasi.json").baris.map((r) => r.id));
  const pj = new Set(j("public/data/proyek.json").baris.map((r) => r.id));
  const sum = new Set(E.sumber.map((s) => s.id)), plt = new Set(P.baris.map((p) => p.id));
  assert.equal(E.jumlah, E.baris.length);
  for (const b of E.baris) {
    assert.ok(BAGIAN.includes(b.bagian) && STATUS.includes(b.status), b.id);
    assert.ok(b.sumber_ids.length && b.sumber_ids.every((s) => sum.has(s)), `${b.id}: sumber`);
    assert.ok(b.linimasa.every((l) => sum.has(l.sumber)), `${b.id}: sumber linimasa`);
    assert.ok(b.nama.id && b.nama.en && b.ringkas.id && b.ringkas.en, `${b.id}: dwibahasa`);
    for (const p of b.pihak) assert.ok(!p.org_id || org.has(p.org_id), `${b.id}: org ${p.org_id}`);
    for (const r of b.regulasi) assert.ok(!r.id || reg.has(r.id), `${b.id}: regulasi ${r.id}`);
    for (const p of b.proyek_ids) assert.ok(pj.has(p), `${b.id}: proyek ${p}`);
    for (const p of b.pltu_ids || []) assert.ok(plt.has(p), `${b.id}: pltu ${p}`);
    assert.ok(b.tanggal_periksa && b.tingkat_bukti);
  }
  for (const k of BAGIAN) assert.ok(E.baris.some((b) => b.bagian === k), `bagian kosong: ${k}`);
  for (const n of E.meta.negara) assert.match(n, /^[A-Z]{2}$/);
});

test("PLTU: unit lengkap, bukan batal, provinsi terisi, umur konsisten", () => {
  assert.ok(P.unit.length > 300 && P.baris.length > 100);
  const prov = new Set(j("public/data/wilayah.json").baris.map((w) => w.kode));
  for (const u of P.unit) {
    assert.ok(u.prov && prov.has(u.prov), `${u.id}: provinsi`);
    assert.ok(u.lat >= -11.5 && u.lat <= 6.5 && u.lng >= 94 && u.lng <= 141.5, `${u.id}: koordinat`);
    assert.notEqual(u.st, "batal");
    if (u.st === "operasi" && u.th) assert.equal(u.umur, 2026 - u.th, u.id);
    if (u.st !== "operasi") assert.equal(u.umur, undefined);
  }
  const ids = new Set(P.baris.map((p) => p.id));
  assert.ok(P.unit.every((u) => ids.has(u.pid)));
  assert.equal(P.meta.mw_operasi, P.unit.filter((u) => u.st === "operasi").reduce((s, u) => s + u.mw, 0));
  assert.ok(P.meta.mw_captive_operasi > 10000);
});

test("PLTU: kandidat menaut ke pembangkit, jalur dan bukti jelas, Cirebon-1 dibatalkan", () => {
  const ids = new Set(P.baris.map((p) => p.id)), uid = new Set(P.unit.map((u) => u.id)), sum = new Set(P.sumber.map((s) => s.id));
  const reg = new Set(j("public/data/regulasi.json").baris.map((r) => r.id));
  for (const k of P.kandidat) {
    assert.ok(ids.has(k.pid), k.id); assert.ok(k.unit_ids.every((u) => uid.has(u)), k.id);
    assert.ok(k.sumber_ids.every((s) => sum.has(s)), k.id); assert.ok(k.regulasi.every((r) => reg.has(r)), k.id);
    assert.ok(k.catatan.id && k.catatan.en);
  }
  const c = P.kandidat.find((k) => k.id === "k-cirebon1");
  assert.equal(c.status, "dibatalkan"); assert.equal(c.mw, 660); assert.deepEqual(c.jalur, ["jetp", "etm"]);
  assert.equal(P.kandidat.find((k) => k.id === "k-pelabuhanratu").tahun_target, 2037);
  for (const k of P.kandidat.filter((x) => x.jalur[0] === "usia")) assert.equal(k.tingkat_bukti, "est");
});

test("dampak: kutipan CREA bersumber, alokasi provinsi berlabel EST dan jumlahnya cocok nasional", () => {
  const sum = new Set(P.sumber.map((s) => s.id));
  for (const n of P.dampak.nasional) assert.ok(sum.has(n.sumber_id) && n.tahun_data, n.id);
  const tot = P.dampak.provinsi.reduce((s, p) => s + p.kematian_est, 0);
  assert.ok(Math.abs(tot - 10500) <= P.dampak.provinsi.length, `jumlah ${tot}`);
  assert.match(P.meta.catatan, /EST/);
  assert.ok(P.baris.some((p) => p.toxic20));
  assert.ok(P.baris.every((p) => p.prov_kode));
});

test("fungsi murni: kelas umur, tingkat, provinsi dari koordinat", () => {
  assert.equal(kelasUmur(0), "u0"); assert.equal(kelasUmur(10), "u10"); assert.equal(kelasUmur(29), "u20"); assert.equal(kelasUmur(null), "tak-diketahui");
  assert.equal(tingkatUmur(14), "rendah"); assert.equal(tingkatUmur(15), "sedang"); assert.equal(tingkatUmur(25), "tinggi");
  const geo = j("public/geo/provinsi.json");
  assert.equal(provDari(106.0, -6.0, geo), "36"); // Banten (Suralaya)
});

test("layar: kunci i18n id dan en lengkap, menu ada, lapisan peta terdaftar, tanpa gaya inline", () => {
  const id = j("public/i18n/id.json"), en = j("public/i18n/en.json");
  const js = readFileSync("public/energi-baru.js", "utf8");
  const pakai = new Set([...js.matchAll(/\bt\("(enb\.[\w.-]+)"/g)].map((m) => m[1]).filter((k) => !k.endsWith(".")));
  for (const m of js.matchAll(/hlHtml\("(enb\.[\w.-]+)"/g)) pakai.add(m[1]);
  for (const k of ["enb.title", "enb.eyebrow", "enb.judul", "enb.lead", "enb.nav", "pn2.l.pltu", "pn2.l.pltu.d"]) pakai.add(k);
  const dinamis = { "enb.bag.": BAGIAN, "enb.st.": STATUS, "enb.ku.": ["u0", "u10", "u20", "u30", "tak-diketahui"], "enb.jl.": ["jetp", "etm", "gem", "usia"], "enb.neg.": E.meta.negara, "enb.pst.": ["operasi", "konstruksi", "pra-konstruksi", "rencana", "ditunda", "pensiun"], "enb.ks.": ["dibatalkan", "calon", "tercatat", "pengamatan"] };
  for (const [p, l] of Object.entries(dinamis)) for (const x of l) pakai.add(p + x);
  for (const k of [...pakai]) assert.ok(id[k] && en[k], `kamus: ${k}`);
  assert.match(readFileSync("public/inti/kepala.js", "utf8"), /href: "\/energi-baru", kunci: "enb\.nav"/);
  assert.ok(j("public/data/peta_lapisan.json").lapisan.some((l) => l.id === "pltu" && l.berkas === "/data/pltu.json"));
  const html = readFileSync("public/energi-baru.html", "utf8");
  assert.doesNotMatch(html + js, /\sstyle\s*=|\sonclick\s*=/);
  assert.doesNotMatch(readFileSync("public/energi-baru.css", "utf8"), /#[0-9a-fA-F]{3,8}\b/);
});
