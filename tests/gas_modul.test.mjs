// Modul /gas: data benih lolos periksa(), berkas terbit = keluaran skrip, sumber https tanpa Antara, sembilan tab ada modulnya,
// tautan dua arah terpasang, CSS tanpa hex, kamus id+en lengkap, hitungan konsisten dengan angka sumber.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { bangun, periksa, BUKTI_SAH } from "../scripts/panen/gas_modul.mjs";

const baca = (f) => readFileSync(new URL("../" + f, import.meta.url), "utf8");
const json = (f) => JSON.parse(baca(f));
const TAB = ["pembangkit", "lng", "pipa", "harga", "neraca", "transisi", "pemain", "kebijakan", "isu"];
const BERKAS = [...TAB.map((k) => `public/gsj_${k}.js`), "public/gsj_umum.js", "public/gas.js", "public/gas.html"];

test("benih lolos periksa (id rujukan hidup di berkas asli)", () => assert.ok(periksa(bangun()).sumber > 30));
test("berkas terbit sama dengan keluaran skrip", () => assert.deepEqual(json("public/data/gas.json"), JSON.parse(JSON.stringify(bangun()))));
test("tiap sumber https, bukti dikenal, tanpa Antara, id unik", () => {
  const s = json("public/data/gas.json").sumber;
  assert.equal(new Set(s.map((x) => x.id)).size, s.length);
  for (const x of s) { assert.match(x.url, /^https:\/\//); assert.ok(BUKTI_SAH.includes(x.tingkat_bukti), x.id); assert.doesNotMatch(x.url, /antaranews/, x.id); }
});
test("celah ditulis (tidak ada yang dikarang): daftar tidak kosong dan tiap butir bertingkat bukti", () => {
  const d = json("public/data/gas.json");
  assert.ok(d.celah.length >= 5);
  for (const x of [...d.pembangkit.proyek, ...d.lng.terminal, ...d.pipa.ruas, ...d.harga.kebijakan]) assert.ok(x.tingkat_bukti && x.sumber_id, x.id || x.k);
});
test("angka RUPTL: semua versi ditampilkan, PLTG+PLTMG lebih kecil dari total gas, lima tahun tidak melebihi total", () => {
  const a = Object.fromEntries(json("public/data/gas.json").pembangkit.angka.map((x) => [x.k, x.nilai]));
  assert.ok(a.pltg_pltmg < a.ieefa); assert.ok(a.lima_tahun <= a.ieefa); assert.ok(Math.abs(a.tanahair - a.ieefa) < 1);
});
test("pemanfaatan gas: domestik + ekspor LNG + ekspor pipa = total rata-rata (selisih pembulatan <= 1)", () => {
  const N = json("public/data/gas.json").neraca.pemanfaatan, b = Object.fromEntries(N.baris.map((x) => [x.k, x.nilai]));
  assert.ok(Math.abs(b.domestik + b.ekspor_lng + b.ekspor_pipa - N.total) <= 1);
  assert.ok(b.kelistrikan < b.domestik);
});
test("proyeksi defisit PGN: 11 tahun berurutan 2025-2035, semua positif", () => {
  const d = json("public/data/gas.json").neraca.defisit.baris;
  assert.deepEqual(d.map((x) => x.tahun), [2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035]);
  for (const x of d) assert.ok(x.nilai > 0);
});
test("hitungan biaya bahan bakar: laju kalor x harga, HGBT = 7 US$/MMBTU", () => {
  const H = json("public/data/gas.json").harga.hitung;
  assert.equal(H.skenario[0].harga, 7); assert.equal(H.heat_rate_mmbtu_mwh * H.skenario[0].harga, 49);
  assert.ok(H.skenario.slice(1).every((s) => s.tingkat_bukti === "hipotesis"));
});
test("sembilan tab punya modul dengan mulai(), halaman, CSS, dan ikon gas unik", () => {
  for (const k of TAB) { assert.match(baca(`public/gsj_${k}.js`), /export (async )?function mulai\(/, k); assert.match(baca("public/gas.js"), new RegExp(`k: "${k}"`)); }
  for (const f of ["gas.html", "gas.css", "gas.js", "gsj_umum.js"]) assert.ok(existsSync(new URL("../public/" + f, import.meta.url)), f);
  assert.equal((baca("public/img/ikon.svg").match(/id="i-gas"/g) || []).length, 1);
  assert.match(baca("public/gas.js"), /rg3-tab|gsjTab/); assert.match(baca("public/gas.html"), /class="rg3-tab"/);
});
test("CSS dan modul gas: tanpa hex, tanpa px pada font, tanpa style=, tanpa em dash, tanpa titik tengah, tanpa toLocaleString", () => {
  const c = baca("public/gas.css");
  assert.doesNotMatch(c, /#[0-9a-f]{3,8}\b/i); assert.doesNotMatch(c, /font[^;{}]*\d+px/);
  for (const f of [...BERKAS, "public/gas.css", "scripts/panen/gas_modul.mjs"]) { const s = baca(f); assert.doesNotMatch(s, /\sstyle=/, f); assert.doesNotMatch(s, /—/, f); assert.doesNotMatch(s, /·/, f); assert.doesNotMatch(s, /toLocaleString/, f); }
});
test("tautan dua arah: indeks cari, metode, profil org, teknologi, isu, transisi PLTU", () => {
  assert.match(baca("scripts/pipa/indeks_cari.mjs"), /\["\/gas", "gsj\.nav"\]/);
  assert.match(baca("public/metode_halaman.js"), /id: "gas"/);
  assert.match(baca("public/tertaut.js"), /\/gas\?tab=/);
  assert.match(baca("public/teknologi.js"), /kode: "gas"/);
  assert.match(baca("public/isu_detail.js"), /\/gas\?tab=isu/);
  assert.match(baca("public/tpl_cofiring.js"), /\/gas\?tab=transisi/);
  assert.match(baca("public/inti/rumah_tek.js"), /gas: "\/gas"/);
});
test("kamus id dan en memuat semua kunci t('gsj.*') statis dan dinamis, id+en setara", () => {
  const id = json("public/i18n/id.json"), en = json("public/i18n/en.json"), hilang = [];
  for (const f of BERKAS) for (const m of baca(f).matchAll(/["`(](gsj\.[a-z0-9_.\-]+)["`)]/g)) if (!m[1].endsWith(".") && !(m[1] in id && m[1] in en)) hilang.push(m[1]);
  const d = json("public/data/gas.json"), P = d.pembangkit, N = d.neraca;
  const dinamis = [...Object.keys({ resmi: 1, media: 1, kajian: 1, "via-pihak-ketiga": 1, hipotesis: 1, est: 1 }).map((k) => "gsj.b." + k),
    ...["beroperasi", "konstruksi", "rencana", "tender", "ditetapkan", "belum", "tidak-diketahui"].map((k) => "gsj.st." + k),
    ...P.angka.map((x) => "gsj.p.a." + x.k), ...P.ringkas_plnt.map((x) => "gsj.p.r." + x.k), ...P.gasifikasi.angka.map((x) => "gsj.p.gf." + x.k), ...P.gasifikasi.klaster.map((x) => "gsj.p.k." + x.k),
    ...d.lng.terminal.map((x) => "gsj.l.j." + x.jenis), ...d.lng.mini.map((x) => "gsj.l.m." + x.k.toLowerCase()), ...d.lng.terminal.map((x) => "gsj.st." + x.status),
    ...d.pipa.ruas.map((x) => "gsj.st." + x.status), ...d.pembangkit.proyek.map((x) => "gsj.cod." + (x.cod_jenis || "rencana")),
    ...d.harga.hitung.skenario.map((x) => "gsj.h.sk." + x.k), ...N.pemanfaatan.baris.map((x) => "gsj.n.p." + x.k), ...N.sektor_domestik.baris.map((x) => "gsj.n.s." + x.k),
    ...d.transisi.hitung.fk.map((x) => "gsj.t.fk." + x.k), ...d.pemain.flatMap((p) => p.peran.map((r) => "gsj.peran." + r)), ...d.isu.baru.flatMap((x) => ["gsj.ist." + x.status, "gsj.itk." + x.tingkat]),
    ...TAB.map((k) => "gsj.tab." + k), ...["berlaku", "diubah", "dicabut"].map((k) => "gsj.rst." + k)];
  for (const k of dinamis) if (!(k in id && k in en)) hilang.push(k);
  assert.deepEqual([...new Set(hilang)], []);
  const gs = (o) => Object.keys(o).filter((k) => k.startsWith("gsj.")).sort();
  assert.deepEqual(gs(id), gs(en));
});
