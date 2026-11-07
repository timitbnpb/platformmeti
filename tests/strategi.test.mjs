// Halaman /strategi: hitungan murni di public/strategi_hitung.js (angka acuan tangan), invarian atas data nyata, dan kamus id/en untuk kunci dinamis.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as H from "../public/strategi_hitung.js";

const J = (f) => JSON.parse(readFileSync(new URL(`../public/data/${f}.json`, import.meta.url), "utf8"));
const DATA = () => ({ target: J("target"), ruptl: J("ruptl"), proyek: J("proyek"), peluang: J("peluang"), kapasitas_tren: J("kapasitas_tren"), pendanaan: J("pendanaan"), pendanaan_int: J("pendanaan_internasional"), jetp: J("jetp_cipp"), keuangan_hijau: J("keuangan_hijau"), indeks: J("indeks"), berita: J("berita"), peristiwa: J("peristiwa_ebt"), rued: J("rued"), transisi: J("transisi") });
const REF = { tahun: 2026 };

test("persentil: definisi indeks.json (lebih kecil + setengah seri lain) per n-1", () => {
  assert.equal(H.persentil(20, [10, 20, 30]), 50);
  assert.equal(H.persentil(10, [10, 20, 30]), 0);
  assert.equal(H.persentil(30, [10, 20, 30]), 100);
  assert.equal(H.persentil(1, [1, 1, 3]), 25); // (0 + (2-1)/2) / 2 x 100
  assert.equal(H.persentil(5, [5]), null);
  assert.equal(H.persentil(null, [1, 2]), null);
});

test("regresi linear: y = 1 + 2x tepat; median; hhi dan kelasnya", () => {
  const r = H.regresi([0, 1, 2, 3], [1, 3, 5, 7]);
  assert.ok(Math.abs(r.a - 1) < 1e-9 && Math.abs(r.b - 2) < 1e-9);
  assert.equal(H.regresi([1], [1]), null);
  assert.equal(H.median([3, 1, 2]), 2);
  assert.equal(H.median([1, 2, 3, 4]), 2.5);
  assert.equal(H.hhi([50, 50]), 5000);
  assert.equal(H.hhi([100]), 10000);
  assert.equal(H.hhi([25, 25, 25, 25]), 2500);
  assert.equal(H.hhi([60, 40]), 5200);
  assert.equal(H.kelasHhi(2500), "tinggi");
  assert.equal(H.kelasHhi(1500), "sedang");
  assert.equal(H.kelasHhi(1499), "rendah");
  assert.equal(H.kelasHhi(null), null);
});

test("tekPeta: hidro sampai 10 MW jadi mikrohidro, sampah dan nuklir", () => {
  assert.equal(H.tekPeta("hidro", 10), "mikrohidro");
  assert.equal(H.tekPeta("hidro", 10.1), "hidro");
  assert.equal(H.tekPeta("hidro", null), "hidro");
  assert.equal(H.tekPeta("biomassa-sampah", 5), "sampah");
  assert.equal(H.tekPeta("nuklir", 250), null);
  assert.equal(H.tekPeta("surya", 3), "surya");
});

test("tarifPatokan: tingkat menurut MW, mikrohidro merujuk hidro, daftar varian dipotong pada label berulang", () => {
  const harga = { teknologi: {
    hidro: { tingkat: [{ kapasitas: "s.d. 1 MW", koef_1_10: 11 }, { kapasitas: ">1 MW s.d. 5 MW", koef_1_10: 10 }, { kapasitas: ">5 MW", koef_1_10: 9 }, { kapasitas: "s.d. 1 MW", koef_1_10: 1 }] },
    mikrohidro: { rujuk: "hidro" }, laut: null,
  } };
  assert.equal(H.tarifPatokan(harga, "hidro", 0.5).sen_kwh, 11);
  assert.equal(H.tarifPatokan(harga, "hidro", 5).sen_kwh, 10);
  assert.equal(H.tarifPatokan(harga, "hidro", 100).sen_kwh, 9);
  assert.equal(H.tarifPatokan(harga, "mikrohidro", 3).sen_kwh, 10);
  assert.equal(H.tarifPatokan(harga, "penyimpanan", 3), null);
});

test("golongan dan nama baku pemilik", () => {
  assert.equal(H.namaBakuPemilik("PT. PLN"), "PT PLN");
  assert.equal(H.namaBakuPemilik("PT PLN (Persero)"), "PT PLN");
  assert.equal(H.namaBakuPemilik("Perusahaan Listrik Negara"), "PT PLN");
  assert.equal(H.namaBakuPemilik("PT. Geo Dipa Energi (IPP)"), "PT Geo Dipa Energi");
  assert.equal(H.golonganPemilik("PT PLN Indonesia Power"), "bumn");
  assert.equal(H.golonganPemilik("Vena Energy"), "asing");
  assert.equal(H.golonganPemilik("KS Orka Renewables Pte Ltd"), "asing");
  assert.equal(H.golonganPemilik("PT Poso Energy"), "swasta");
  const p = (n) => ({ pihak: { pemilik: n.map((nilai) => ({ nilai })) } });
  assert.deepEqual(H.pemilikNama(p(["IPP", "PT. PLN", "PT PLN (Persero)", "PT Poso Energy"])), ["PT PLN", "PT Poso Energy"]);
});

/* ---------- kesenjangan: fixture tangan ---------- */
function fixKes() {
  const real = Array.from({ length: 10 }, (_, i) => ({ tahun: 2015 + i, nilai: 10 + i, twh: 1, total_twh: 10 })); // naik tepat 1 poin per tahun, 2024 = 19
  const prim = Array.from({ length: 10 }, (_, i) => ({ tahun: 2015 + i, nilai: 5 + 0.5 * i }));
  const ken = (id, tahun, min) => ({ id, tahun_target: tahun, min });
  const irena = (t, nilai0, naik) => Array.from({ length: 11 }, (_, i) => ({ teknologi: t, tahun: 2015 + i, kapasitas_mw: nilai0 + naik * i }));
  return {
    target: { meta: { laju_historis_mw_per_tahun_2015_2024: 500, tahun_dasar: 2024, diperbarui: "2026-01-01" },
      realisasi: { pembangkitan_ebt_persen: real, energi_primer_ebt_persen_ei: prim },
      target: [{ id: "rukn-2025-pembangkitan", seri: { 2030: 25, 2040: 40, 2050: 60, 2060: 70 } }, { id: "ruptl-2034-bauran", min: 29 }, ken("ken-2030-ebt-primer", 2030, 14), ken("ken-2040-ebt-primer", 2040, 20), ken("ken-2050-ebt-primer", 2050, 30), ken("ken-2060-ebt-primer", 2060, 40),
        { id: "ruptl-2034-kapasitas", dokumen: "ruptl-2025", tahun_target: 2034 }],
      celah: [{ target_id: "ruptl-2034-kapasitas", metode: "langsung", tahun_awal: 2025, tahun_target: 2034, celah_mw: 5000, per_tahun_mw: 500 }] },
    ruptl: { baris: [{ teknologi: "surya", status: "rencana", kapasitas_mw: 1000 }, { teknologi: "surya", status: "konstruksi", kapasitas_mw: 500 }, { teknologi: "surya", status: "tidak-diketahui", kapasitas_mw: 999 }, { teknologi: "biomassa-sampah", status: "rencana", kapasitas_mw: 50 }, { teknologi: "bioenergi", status: "rencana", kapasitas_mw: 50 }] },
    kapasitas_tren: { baris: [...irena("surya", 100, 10), ...irena("air", 1000, 50), ...irena("panas_bumi", 500, 20), ...irena("bayu", 10, 1), ...irena("bioenergi_padat", 100, 10)] },
  };
}
test("kesenjangan: bauran naik 1 poin per tahun, target 29 pada 2034 -> perlu 1 poin, tahun capai 2034, tidak terlambat", () => {
  const K = H.kesenjangan(fixKes(), REF), b = K.bauran.find((x) => x.id === "ruptl-2034");
  assert.equal(b.realisasi, 19);
  assert.equal(b.gap, 10);
  assert.equal(b.perlu_poin, 1);
  assert.equal(b.tren_poin, 1);
  assert.equal(b.kali, 1);
  assert.equal(b.tahun_capai, 2034);
  assert.equal(b.terlambat, 0);
  const r30 = K.bauran.find((x) => x.id === "rukn-2030"); // (25-19)/6 = 1
  assert.equal(r30.perlu_poin, 1);
  const p30 = K.bauran.find((x) => x.id === "ken-2030-ebt-primer"); // primer naik 0.5/tahun dari 9.5 pada 2024: (14-9.5)/6 = 0.75, tren 0.5
  assert.equal(p30.perlu_poin, 0.75);
  assert.equal(p30.kali, 1.5);
  assert.equal(p30.ukuran, "primer");
});
test("kesenjangan: kapasitas per tahun / laju historis, per teknologi dari MW RUPTL bernama (rencana + konstruksi)", () => {
  const K = H.kesenjangan(fixKes(), REF), k = K.kapasitas[0];
  assert.equal(k.perlu_mw, 500);
  assert.equal(k.kali, 1);
  assert.equal(k.tahun_capai, Math.ceil(2024 + 5000 / 500));
  const s = K.per_tek.find((x) => x.tek === "surya");
  assert.equal(s.bernama_mw, 1500); // status tidak-diketahui tidak dihitung
  assert.equal(s.perlu_mw, 150);
  assert.equal(s.laju10, 10);
  assert.equal(s.kali, 15);
  assert.equal(s.tahun_capai, 2025 + 150);
  const b = K.per_tek.find((x) => x.tek === "bioenergi");
  assert.equal(b.bernama_mw, 100); // bioenergi + biomassa-sampah
  assert.equal(K.bernama_total_mw, 1600);
  assert.equal(K.tidak_terperinci_mw, 3400);
});

/* ---------- radar: fixture tangan ---------- */
function fixRadar() {
  const pr = (id, st, cod, pemilik, kap = 10) => ({ id, nama: id, teknologi: "surya", status: [{ nilai: st }], cod_target: cod ? [{ nilai: cod }] : undefined, kapasitas: [{ nilai: kap, satuan: "MW" }], lokasi: { provinsi: "Aceh" }, pihak: pemilik ? { pemilik: [{ nilai: pemilik }] } : {}, program_ids: ["ruptl"] });
  return {
    proyek: { baris: [pr("A", "rencana", 2024, null), pr("B", "rencana", 2030, "PT Maju"), pr("C", "ditunda", 2030, "PT Maju"), pr("D", "beroperasi", 2020, "PT Maju")] },
    pendanaan: { pendanaan: [{ proyek_id: "B" }, { proyek_id: "C" }] }, pendanaan_int: { baris: [] }, jetp: { baris: [] },
    peluang: { baris: [{ kode: "11", nama: "Aceh" }] }, berita: { baris: [] }, indeks: { proyek: [] },
    transisi: { sistem: [{ id: "s", nama: "Sumatera", provinsi: ["11"], beban_puncak_neto_mw: [1000], reserve_margin_persen: [20] }] },
  };
}
test("radarRisiko: lewat COD 3 + tanpa pengembang 2 + tanpa pendana 1 = 6 tinggi; ditunda berpendana = 3 sedang; bersih = 0; beroperasi dikeluarkan", () => {
  const R = H.radarRisiko(fixRadar(), REF), per = (id) => R.baris.find((b) => b.id === id);
  assert.equal(R.baris.length, 3);
  assert.equal(per("A").skor, 6);
  assert.equal(per("A").tingkat, "tinggi");
  assert.deepEqual(per("A").tanda.map((x) => x.id).sort(), ["cod", "dana", "pengembang"]);
  assert.equal(per("A").tanda.find((x) => x.id === "cod").param.lewat, 2);
  assert.equal(per("B").skor, 0);
  assert.equal(per("B").tingkat, "rendah");
  assert.equal(per("C").skor, 3);
  assert.equal(per("C").tingkat, "sedang");
  assert.equal(R.per.tinggi.n, 1);
  assert.equal(R.mw_lewat_cod, 10);
  assert.equal(R.baris[0].id, "A"); // urut skor menurun
});
test("radarRisiko: surya 150 MW pada sistem berbeban puncak 1000 MW (di atas 10 persen) menandai serap rendah", () => {
  const D = fixRadar();
  D.proyek.baris.push({ id: "E", nama: "E", teknologi: "surya", status: [{ nilai: "rencana" }], kapasitas: [{ nilai: 150, satuan: "MW" }], lokasi: { provinsi: "Aceh" }, pihak: { pemilik: [{ nilai: "PT Maju" }] } });
  D.pendanaan.pendanaan.push({ proyek_id: "E" });
  const e = H.radarRisiko(D, REF).baris.find((b) => b.id === "E");
  assert.deepEqual(e.tanda.map((x) => x.id), ["serap"]);
  assert.equal(e.tanda[0].param.rasio, 15);
});

/* ---------- konsentrasi: fixture tangan ---------- */
test("konsentrasi: HHI 5200 untuk pemilik 60 dan 40 MW; pangsa golongan kumulatif menurut tahun COD aktual", () => {
  const op = (id, mw, pemilik, cod) => ({ id, nama: id, teknologi: "hidro", status: [{ nilai: "beroperasi" }], kapasitas: [{ nilai: mw, satuan: "MW" }], pihak: { pemilik: [{ nilai: pemilik }] }, cod_aktual: [{ nilai: cod }] });
  const D = { proyek: { baris: [op("a", 60, "PT PLN", 2010), op("b", 40, "Vena Energy", 2020), { ...op("c", 20, "PT Poso Energy", 2023), status: [{ nilai: "rencana" }], cod_aktual: undefined }] } };
  const K = H.konsentrasi(D, REF), h = K.per_tek.find((x) => x.tek === "hidro");
  assert.equal(h.hhi, 5200);
  assert.equal(h.kelas, "tinggi");
  assert.equal(h.terbesar, "PT PLN");
  assert.equal(h.pangsa_terbesar, 60);
  assert.equal(h.cakupan, 100);
  const a = K.pangsa.find((x) => x.tahun === 2010), z = K.pangsa.at(-1);
  assert.equal(a.bumn, 100);
  assert.equal(z.total, 100);
  assert.equal(z.bumn, 60);
  assert.equal(z.asing, 40);
  assert.equal(K.pemain.find((x) => x.nama === "Vena Energy"), undefined); // COD 2020 bukan sejak 2022 dan tanpa pipeline: tidak tampil sebagai pemain tumbuh
  assert.equal(K.pemain.find((x) => x.nama === "PT Poso Energy").pipeline, 20);
});

/* ---------- invarian atas data nyata ---------- */
const D = DATA(), A = H.analisis(D, REF);
test("peta: tiap skor 0..100, minimal tiga komponen, bobot positif, 38 provinsi x 8 teknologi", () => {
  assert.equal(A.peta.total, 38 * H.TEK.length);
  assert.ok(A.peta.terisi > 150);
  for (const s of Object.values(A.peta.sel)) {
    if (s.skor == null) { assert.ok(s.n < 3 || s.bobot_ada === 0); continue; }
    assert.ok(s.skor >= 0 && s.skor <= 100, `${s.prov}/${s.tek}`);
    assert.ok(s.n >= 3);
    const manual = s.komponen.reduce((a, c) => a + c.skor * c.bobot, 0) / s.komponen.reduce((a, c) => a + c.bobot, 0);
    assert.ok(Math.abs(manual - s.skor) < 0.15, `${s.prov}/${s.tek}: ${manual} vs ${s.skor}`);
  }
  assert.deepEqual(A.peta.top.map((x) => x.skor), [...A.peta.top.map((x) => x.skor)].sort((a, b) => b - a));
});
test("peta: komponen surya memuat kuota atap, teknologi lain tidak", () => {
  for (const s of Object.values(A.peta.sel)) assert.equal(s.komponen.some((c) => c.id === "atap"), s.tek === "surya" && s.komponen.length > 0 && D.indeks.provinsi.some((p) => p.nama === s.prov && p.komponen.plts_atap.mentah != null));
});
test("radar: jumlah tingkat = jumlah baris, skor = jumlah poin tanda, hanya status pipeline", () => {
  const R = A.radar;
  assert.equal(R.per.tinggi.n + R.per.sedang.n + R.per.rendah.n, R.baris.length);
  for (const b of R.baris) {
    assert.equal(b.skor, b.tanda.reduce((a, t) => a + t.poin, 0));
    assert.ok(["rencana", "konstruksi", "ditunda"].includes(b.status));
    assert.equal(b.tingkat, b.skor >= 5 ? "tinggi" : b.skor >= 3 ? "sedang" : "rendah");
  }
  assert.deepEqual(R.baris.map((b) => b.skor), [...R.baris.map((b) => b.skor)].sort((a, b) => b - a));
});
test("konsentrasi: HHI dalam 0..10000, pangsa golongan berjumlah 100, kapasitas bernama <= total", () => {
  for (const h of A.kons.per_tek) { assert.ok(h.hhi > 0 && h.hhi <= 10000); assert.ok(h.mw_bernama <= h.mw_total + 1); assert.equal(h.kelas, H.kelasHhi(h.hhi)); }
  for (const p of A.kons.pangsa) assert.ok(Math.abs(p.bumn + p.swasta + p.asing - 100) < 0.31, String(p.tahun));
});
test("arus uang: celah realokasi berjumlah nol (dana dibagi ulang menurut MW), pangsa berjumlah 100", () => {
  const U = A.uang;
  assert.ok(Math.abs(U.tek.reduce((a, x) => a + x.celah_usd, 0)) < 10);
  assert.ok(Math.abs(U.tek.reduce((a, x) => a + x.pangsa_mw, 0) - 100) < 0.3);
  assert.ok(Math.abs(U.tek.reduce((a, x) => a + x.pangsa_dana, 0) - 100) < 0.3);
  assert.deepEqual(U.tek.map((x) => x.celah_usd), [...U.tek.map((x) => x.celah_usd)].sort((a, b) => b - a));
});
test("sinyal: bulan penuh sebelum bulan berita terakhir, momentum menurun menurut selisih, selisih = akhir - awal", () => {
  const S = A.sinyal;
  for (const m of S.bulan_penuh) assert.ok(m < S.terakhir.slice(0, 7));
  for (const x of S.momentum) assert.ok(Math.abs(x.akhir - x.awal - x.selisih) < 0.11);
  assert.deepEqual(S.momentum.map((x) => x.selisih), [...S.momentum.map((x) => x.selisih)].sort((a, b) => b - a));
});
test("ringkasan: sepuluh temuan, tiap bagian terhubung ke jangkar yang ada", () => {
  assert.equal(A.temuan.length, 10);
  const bagian = new Set(["kesenjangan", "peta", "radar", "konsentrasi", "uang", "sinyal"]);
  for (const f of A.temuan) assert.ok(bagian.has(f.bagian), f.id);
  assert.equal(new Set(A.temuan.map((f) => f.id)).size, 10);
});
test("deterministik: dua kali jalan menghasilkan keluaran identik", () => {
  assert.deepEqual(JSON.stringify(H.analisis(DATA(), REF)), JSON.stringify(A));
});

/* ---------- kamus: kunci dinamis ada di id dan en, dan tanpa em dash ---------- */
const id = JSON.parse(readFileSync(new URL("../public/i18n/id.json", import.meta.url), "utf8")), en = JSON.parse(readFileSync(new URL("../public/i18n/en.json", import.meta.url), "utf8"));
test("kamus st.*: kunci dinamis lengkap di id dan en, tanpa em dash, titik tengah, atau panah", () => {
  const perlu = [];
  for (const k of H.TEK) perlu.push("st.tn." + k, "st.tk." + k);
  for (const k of Object.keys(H.BOBOT_PETA)) perlu.push("st.kn." + k, "st.k." + k);
  for (const f of A.temuan) perlu.push("st.f." + f.id, "st.g." + f.bagian + "_p");
  for (const f of ["kapasitas", "bauran", "tek_kejar", "sel_unggul", "prov_unggul", "radar", "cod", "hhi", "bumn", "celah_dana", "momentum"]) perlu.push("st.f." + f);
  for (const k of ["cod", "tunda", "pengembang", "dana", "sosial", "sosial_wil", "konflik", "serap"]) perlu.push("st.tanda." + k, "st.tanda_p." + k);
  for (const k of ["jadwal", "pihak", "dana", "sosial", "jaringan"]) perlu.push("st.periksa." + k);
  for (const k of ["rencana", "konstruksi", "ditunda"]) perlu.push("st.status." + k);
  for (const k of ["bumn", "swasta", "asing"]) perlu.push("st.gol." + k);
  for (const k of ["semua", "tinggi", "sedang", "rendah"]) perlu.push("st.tingkat." + k);
  for (const k of ["rendah", "sedang", "tinggi"]) perlu.push("st.hhi." + k, "st.radar.kes." + k);
  for (const k of ["kuat", "telaah", "terbatas"]) perlu.push("st.kes." + k);
  for (const k of ["target", "perda", "tidak"]) perlu.push("st.rued." + k);
  for (let b = 1; b <= 12; b++) perlu.push("st.bln." + b);
  for (const g of ["kesenjangan", "peta", "radar", "konsentrasi", "uang", "sinyal"]) perlu.push("st.g." + g, "st.g." + g + "_sub", "st.g." + g + "_p", "st.n." + g, "st.m." + g + ".rumus", "st.m." + g + ".batas");
  for (const e of ["bauran", "kap", "tek", "peta", "radar", "hhi", "pangsa", "pemain", "alokasi", "tahunan", "provdana", "mom", "bulanan", "metode"]) perlu.push(`st.${e}.ey`, `st.${e}.sub`);
  for (const e of ["konflik", "kebutuhan", "pemilik", "berita", "mikro", "atap"]) perlu.push("st.m.celah_" + e);
  for (const k of ["naik", "turun"]) perlu.push("st.mom.arah_" + k);
  const hilang = [...new Set(perlu)].filter((k) => !(k in id) || !(k in en));
  assert.deepEqual(hilang, []);
  for (const [k, v] of Object.entries(id)) if (k.startsWith("st.")) assert.doesNotMatch(v + en[k], /[—·→]|&rarr;/, k);
});
test("kunci kamus dipakai di JS ada: semua t('st....') literal di strategi.js dan strategi_ui.js", () => {
  const kode = ["strategi.js", "strategi_ui.js"].map((f) => readFileSync(new URL(`../public/${f}`, import.meta.url), "utf8")).join("\n");
  const kunci = [...kode.matchAll(/\b(?:t|hlHtml|bantu)\(\s*"(st\.[\w.]+)"/g)].map((m) => m[1]).concat([...kode.matchAll(/\bl: "(st\.[\w.]+)"/g)].map((m) => m[1]));
  assert.ok(kunci.length > 100);
  assert.deepEqual([...new Set(kunci)].filter((k) => !/[._]$/.test(k) && (!(k in id) || !(k in en))), []); // awalan dinamis (berakhir titik atau garis bawah) diperiksa di uji sebelumnya
});
