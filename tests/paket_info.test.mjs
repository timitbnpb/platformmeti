// Uji paket informasi (pemda, kebijakan, desa energi, izin dan kontrak): fungsi murni, bentuk data, kamus id/en, kunci teks.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { persentil, skor, tingkat, BOBOT, MIN_KOMPONEN } from "../scripts/pipa/paket_pemda.mjs";
import { leadTime, ringkas, TANYA, KLAUSUL, DOK } from "../scripts/pipa/izin_kontrak.mjs";
import { UMUM, HALAMAN } from "../scripts/pipa/teks_info.mjs";

const J = (f) => JSON.parse(readFileSync(new URL("../public/data/" + f, import.meta.url), "utf8"));
const S = (f) => readFileSync(new URL("../public/" + f, import.meta.url), "utf8");

test("persentil: peringkat 0..1, null dilewati, satu nilai = 0,5", () => {
  assert.deepEqual(persentil([10, 30, 20]), [0, 1, 0.5]);
  assert.deepEqual(persentil([5, null, 9]), [0, null, 1]);
  assert.deepEqual(persentil([7]), [0.5]);
  assert.deepEqual(persentil([4, 4, 8]), [0.25, 0.25, 1]);
});
test("skor: bobot dinormalkan ulang, minimal komponen, ambang tingkat", () => {
  const penuh = Object.keys(BOBOT).map((k) => ({ k, norm: 1 }));
  assert.equal(skor(penuh).skor, 1);
  assert.equal(skor(penuh).lengkap, true);
  const lima = Object.keys(BOBOT).map((k, i) => ({ k, norm: i === 1 ? null : 0.5 }));
  assert.deepEqual(skor(lima), { skor: 0.5, lengkap: false, n: 4 });
  assert.equal(skor(lima.map((c, i) => (i < 2 ? { ...c, norm: null } : c))).skor, null);
  assert.ok(MIN_KOMPONEN >= 3);
  assert.equal(tingkat(0.9), "siap");
  assert.equal(tingkat(0.6), "berkembang");
  assert.equal(tingkat(0.1), "awal");
  assert.equal(tingkat(null), null);
});
test("leadTime: hanya pasangan tertaut dengan COD bilangan bulat dan selisih positif", () => {
  const amdal = { baris: [{ id: "a1", proyek_id: "p1", tanggal_mulai: "2026-02-21", teknologi: "surya", sumber_url: "https://x" }, { id: "a2", proyek_id: null, tanggal_mulai: "2026-01-01" }, { id: "a3", proyek_id: "p2", tanggal_mulai: "2026-01-01" }] };
  const proyek = { baris: [{ id: "p1", nama: "A", cod_target: [{ nilai: 2029 }], status: [{ nilai: "rencana" }] }, { id: "p2", nama: "B", cod_target: [{ nilai: 2026 }], status: [{ nilai: "dibatalkan" }] }] };
  const d = leadTime(amdal, proyek);
  assert.equal(d.length, 1);
  assert.equal(d[0].bulan, 2029 * 12 + 7 - (2026 * 12 + 2));
  assert.deepEqual(ringkas([]), { n: 0, median: null, min: null, maks: null, rata: null });
  assert.deepEqual(ringkas([{ bulan: 10 }, { bulan: 20 }]), { n: 2, median: 15, min: 10, maks: 20, rata: 15 });
});
test("izin: tiap tanya dan klausul punya id/en, pasal bersumber dokumen dikenal, tingkat risiko sah", () => {
  const sah = (o) => assert.ok(o.id && o.en, "dua bahasa");
  for (const x of TANYA) { sah(x.q); sah(x.a); assert.ok(x.pasal.length); for (const p of x.pasal) assert.ok(DOK[p.dok] && p.pasal, x.id); }
  for (const k of KLAUSUL) { sah(k.nama); sah(k.arti); sah(k.risiko); assert.ok(["tinggi", "sedang", "rendah"].includes(k.risiko_tingkat)); for (const p of k.pasal) assert.ok(DOK[p.dok] && /Pasal/.test(p.pasal), k.id); }
  for (const d of Object.values(DOK)) { assert.match(d.url, /^https:\/\/peraturan\.bpk\.go\.id\//); assert.match(d.pdf, /^https:\/\/peraturan\.bpk\.go\.id\/Download\//); }
});
test("paket_pemda.json: 38 provinsi, skor 0..1, peringkat berurutan, tiap kontak berurl https", () => {
  const d = J("paket_pemda.json");
  assert.equal(d.provinsi.length, 38);
  const urut = d.provinsi.filter((p) => p.indeks.skor != null).sort((a, z) => a.indeks.peringkat - z.indeks.peringkat);
  urut.forEach((p, i) => { assert.equal(p.indeks.peringkat, i + 1); assert.ok(p.indeks.skor >= 0 && p.indeks.skor <= 1); assert.ok(p.indeks.n >= MIN_KOMPONEN); });
  for (let i = 1; i < urut.length; i++) assert.ok(urut[i - 1].indeks.skor >= urut[i].indeks.skor);
  for (const p of d.provinsi) for (const c of p.kontak) assert.match(c.situs, /^https:\/\//);
  assert.ok(d.butuh_unduhan.apbd && d.butuh_unduhan.grk && d.butuh_unduhan.bps_kab, "yang tak terjangkau ditandai butuh unduhan, bukan diisi");
  assert.equal(new Set(d.provinsi.map((p) => p.kode)).size, 38);
});
test("kebijakan_info.json: sumber bertautan https dan tanda DPR belum terverifikasi", () => {
  const d = J("kebijakan_info.json");
  assert.ok(d.pelacak.length && d.pelacak.every((r) => r.dpr_terverifikasi === false));
  for (const r of d.regulasi_terbaru) { assert.equal(r.status === undefined, true); assert.match(r.url, /^https:\/\//); }
  assert.ok(d.target.every((x) => x.id && x.dokumen) && d.butuh_unduhan.prolegnas);
});
test("desa_akses.json: skor 0..1, hidro kecil tidak melebihi ambang, langkah koperasi bersumber pasal", () => {
  const d = J("desa_akses.json");
  assert.ok(d.hidro_kecil.every((h) => h.mw > 0 && h.mw <= d.batas_hidro_kecil_mw));
  assert.ok(d.provinsi.filter((p) => p.kerentanan != null).every((p) => p.kerentanan >= 0 && p.kerentanan <= 1));
  for (const l of d.langkah) { assert.ok(l.judul.id && l.judul.en && l.isi.id && l.isi.en); assert.ok(l.pasal.length && l.pasal.every((p) => d.dok[p.dok] && /Pasal/.test(p.pasal))); }
  assert.ok(d.butuh_unduhan.sekolah_puskesmas && d.butuh_unduhan.desa_mandiri && d.butuh_unduhan.podes);
});
test("izin_kontrak.json: ringkasan lead time cocok dengan daftarnya", () => {
  const d = J("izin_kontrak.json");
  assert.deepEqual(d.lead_time.ringkas, ringkas(d.lead_time.daftar));
  assert.deepEqual(d.batas_waktu.map((b) => b.hari), [90, 180]);
});
test("kamus: id dan en sekunci, parameter {x} sama, tanpa em dash, titik tengah, atau panah", () => {
  for (const nama of ["pemda", "kebijakan", "desa", "izin"]) {
    const k = J(`teks_${nama}.json`);
    assert.deepEqual(Object.keys(k.id).sort(), Object.keys(k.en).sort(), nama);
    const par = (s) => (s.match(/\{\w+\}/g) || []).sort().join();
    for (const [kunci, v] of Object.entries(k.id)) {
      assert.ok(v && k.en[kunci], `${nama}.${kunci} kosong`);
      assert.equal(par(k.en[kunci]), par(v), `${nama}.${kunci} parameter beda`);
      assert.doesNotMatch(v + k.en[kunci], /[\u2014\u00b7\u2192]/, `${nama}.${kunci} karakter terlarang`);
    }
    for (const u of Object.keys(UMUM)) assert.ok(u in k.id, `${nama} tanpa ${u}`);
    assert.ok(HALAMAN[nama]);
  }
});
test("kunci tt('...') di JS halaman ada di kamus; kunci dinamis berprefiks tersedia", () => {
  const peta = { pemda: "pemda.js", kebijakan: "kebijakan.js", desa: "desa-energi.js", izin: "izin-kontrak.js" };
  const kerangka = S("info_kerangka.js");
  for (const [nama, js] of Object.entries(peta)) {
    const k = J(`teks_${nama}.json`).id, src = S(js) + kerangka;
    for (const m of src.matchAll(/\btt\(\s*"([\w.\-]+)"\s*[,)]/g)) assert.ok(m[1] in k, `${js}: tt("${m[1]}") tak ada di teks_${nama}.json`);
    for (const m of src.matchAll(/\btt\(\s*"([\w.\-]+\.)"\s*\+/g)) assert.ok(Object.keys(k).some((x) => x.startsWith(m[1])), `${js}: prefiks ${m[1]} tanpa kunci`);
    const html = S(js.replace(/\.js$/, ".html"));
    for (const m of html.matchAll(/data-k="([\w.]+)"/g)) assert.ok(m[1] in k, `${js}: data-k ${m[1]}`);
  }
});
test("data dinamis: tiap nilai berprefiks punya kunci kamus", () => {
  const p = J("teks_pemda.json").id, kb = J("teks_kebijakan.json").id, ds = J("teks_desa.json").id, iz = J("teks_izin.json").id;
  const d = J("kebijakan_info.json"), pm = J("paket_pemda.json"), dd = J("desa_akses.json"), ik = J("izin_kontrak.json");
  for (const t of ["siap", "berkembang", "awal"]) assert.ok("tk." + t in p);
  for (const t of ["tercapai", "di-jalur", "tertinggal"]) assert.ok("st." + t in p);
  for (const c of Object.keys(pm.metode.bobot)) assert.ok(`komp.${c}` in p && `kd.${c}` in p);
  for (const r of d.regulasi_terbaru) { assert.ok("jr." + r.jenis in kb, r.jenis); for (const t of r.topik) assert.ok("bd." + t in kb, t); }
  for (const x of d.target) assert.ok("uk." + x.ukuran in kb, x.ukuran);
  for (const pr of d.program) assert.ok("th." + pr.tahap in kb, pr.tahap);
  for (const r of d.pelacak) { assert.ok("th." + r.tahap in kb || "lk." + r.tahap in kb); for (const l of r.langkah) assert.ok("lk." + l in kb); }
  for (const h of dd.hidro_kecil) assert.ok("sp." + (h.status || "tidak") in ds, String(h.status));
  for (const k of ["mandiri", "maju", "berkembang", "tertinggal", "sangat_tertinggal"]) assert.ok("idm." + k in ds);
  for (const k of Object.keys(pm.butuh_unduhan)) assert.ok("b." + k in p, k);
  for (const k of Object.keys(d.butuh_unduhan)) assert.ok("b." + k in kb, k);
  for (const k of Object.keys(dd.butuh_unduhan)) assert.ok("b." + k in ds, k);
  for (const k of Object.keys(ik.butuh_unduhan)) assert.ok("b." + k in iz, k);
  for (const x of ik.klausul || []) assert.ok(x);
  for (const x of ["umum", "surya", "hidro", "panas-bumi", "bioenergi"]) assert.ok("jn." + x in iz);
});
test("HTML halaman: tanpa style= dan skrip sebaris, kepala .jm-kh berikon dengan ubin kanan", () => {
  for (const f of ["pemda.html", "kebijakan.html", "desa-energi.html", "izin-kontrak.html"]) {
    const h = S(f);
    assert.doesNotMatch(h, /\sstyle\s*=/i, f);
    assert.doesNotMatch(h, /\son[a-z]+\s*=/i, f);
    assert.match(h, /class="jm-kh-ey"[^>]*><svg/, f);
    assert.match(h, /jm-kh-ubin/, f);
    assert.match(h, /<html lang="id"/, f);
  }
});
