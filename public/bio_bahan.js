/* /bioenergi, tab Bahan baku: sawit/CPO per provinsi (BPS 2023, riset/biomassa), residu sawit (TKKS, cangkang, serat, POME), jagung, singkong, tebu, luas sawit nasional.
   Tingkat provinsi, bukan kabupaten (celah tertulis). INP: pilihan metrik seketika, grafik menyusul lewat nanti(). */
import { B, t, ex, num, esc, ikon, tx, bukti, buktiS, kakiSumber, tabel, batangSvg, tipHtml, legendaHtml, tautProvinsi, siapTautan, naikkan, juta, kosongTab, daftarCelah, catatan } from "/bio_umum.js";
import { nanti } from "/inti/umum.js";
import { pilihHtml } from "/inti/komponen.js";
import { pasangPilih } from "/inti/pilih.js";

const M = { cpo: { f: (b) => b.cpo_ton, k: "bn.bh.m.cpo", u: "bn.u.juta_t", d: 1e6, ik: "pabrik" }, luas: { f: (b) => b.luas_sawit_ha, k: "bn.bh.m.luas", u: "bn.u.juta_ha", d: 1e6, ik: "desa" }, tkks: { f: (b) => b.tkks_ton_est, k: "bn.bh.m.tkks", u: "bn.u.ribu_t", d: 1e3, ik: "tek-bio" }, cangkang: { f: (b) => b.cangkang_ton_est, k: "bn.bh.m.cangkang", u: "bn.u.ribu_t", d: 1e3, ik: "industri" }, pome: { f: (b) => b.pome_m3_est, k: "bn.bh.m.pome", u: "bn.u.juta_m3", d: 1e6, ik: "air-energi" } };
let metrik = "cpo";
const BM = () => B.biomassa?.baris || [];

function grafik() {
  const el = document.getElementById("bn-b-prov"); if (!el) return;
  const m = M[metrik], baris = [...BM()].sort((a, b) => m.f(b) - m.f(a)).slice(0, 12);
  el.innerHTML = batangSvg({ el, d: m.d >= 1e6 ? 2 : 0, satuan: t(m.u), label: t(m.k), seri: [{ k: "n", kelas: "bn-s-" + metrik }],
    baris: baris.map((b) => ({ label: b.provinsi, logo: `/img/provinsi/${b.kode_prov}.png`, tip: b.provinsi, th: tipHtml(b.provinsi, [[t("bn.bh.m.cpo"), `${num(b.cpo_ton / 1e6, 2)} ${t("bn.u.juta_t")}`], [t("bn.bh.m.luas"), `${num(b.luas_sawit_ha / 1e6, 2)} ${t("bn.u.juta_ha")}`], [t("bn.bh.m.cangkang"), `${num(b.cangkang_ton_est / 1e3, 0)} ${t("bn.u.ribu_t")}`], [t("bn.bh.m.pome"), `${num(b.pome_m3_est / 1e6, 2)} ${t("bn.u.juta_m3")}`]], { img: `/img/provinsi/${b.kode_prov}.png` }), bagian: [{ k: "n", nilai: m.f(b) / m.d }] })) });
}
function tabelProv() {
  const el = document.getElementById("bn-b-tab"); if (!el) return;
  const kol = (k, f, d) => ({ label: t(k), num: true, v: f, f: (b) => (f(b) == null ? "-" : num(f(b) / d, d > 1 ? 1 : 0)) });
  tabel(el, { satuan: "bn.u.prov", per: 8, urutAwal: 1, menurun: true, kolom: [
    { label: t("bn.c.prov"), v: (b) => b.provinsi, f: (b) => tautProvinsi(b.kode_prov, b.provinsi) },
    kol("bn.bh.m.cpo", (b) => b.cpo_ton, 1e3), kol("bn.bh.m.luas", (b) => b.luas_sawit_ha, 1e3), kol("bn.bh.m.tkks", (b) => b.tkks_ton_est, 1e3), kol("bn.bh.m.cangkang", (b) => b.cangkang_ton_est, 1e3), kol("bn.bh.m.pome", (b) => b.pome_m3_est, 1e3),
    { label: t("bn.c.bukti"), v: (b) => b.tingkat_bukti_cpo, f: (b) => bukti(b.tingkat_bukti_cpo === "Data" ? "resmi" : "est", { sumber: "BPS", tanggal: "2024" }) },
  ], baris: BM() });
  siapTautan("org").then(() => naikkan(el));
}
function komoditas() {
  const el = document.getElementById("bn-b-kom"); if (!el) return;
  const K = B.bio.bahan_baku.komoditas;
  tabel(el, { satuan: "bn.u.komoditas", per: 6, urutAwal: 0, menurun: false, kolom: [
    { label: t("bn.c.komoditas"), v: (r) => r.k, f: (r) => `<span class="bn-baris">${ikon(r.k.startsWith("sawit") ? "pabrik" : "desa", 18)}<b>${esc(t("bn.kom." + r.k))}</b></span>` },
    { label: t("bn.c.luas"), num: true, v: (r) => r.luas_ha, f: (r) => (r.luas_ha ? `${num(r.luas_ha / 1e6, 2)} ${t("bn.u.juta_ha")}` : "-") },
    { label: t("bn.c.produksi"), num: true, v: (r) => r.produksi_ton, f: (r) => (r.produksi_ton ? `${num(r.produksi_ton / 1e6, 2)} ${t("bn.u.juta_t")}${r.satuan_catatan ? `<small class="rg3-catat">${esc(r.satuan_catatan)}</small>` : ""}${r.sentra ? `<small class="rg3-catat">${esc(r.sentra)}</small>` : ""}` : "-") },
    { label: t("bn.c.tahun"), num: true, v: (r) => r.tahun, f: (r) => esc(String(r.tahun)) },
    { label: t("bn.c.peran"), v: (r) => tx(r.pakai), f: (r) => `<span class="rg3-teks">${esc(tx(r.pakai))}</span>` },
    { label: t("bn.c.bukti"), v: (r) => r.tingkat_bukti, f: (r) => (r.perlu_tinjau ? bukti("perlu-tinjau") : buktiS(r.sumber_id, r.tingkat_bukti)) },
  ], baris: K });
}
export function mulai(el) {
  if (!BM().length && !B.bio) { el.innerHTML = kosongTab("bn.kosong"); return; }
  const f = B.biomassa?.faktor || {}, n = B.biomassa?.meta?.cpo_ton_total;
  const residu = [["tkks", f.tkks_t_per_t_tbs, "tek-bio"], ["cangkang", f.cangkang_t_per_t_tbs, "industri"], ["serat", f.serat_t_per_t_tbs, "tabel"]];
  el.innerHTML = [
    BM().length ? ex({ id: "bn-b-peta", ikon: "desa", topik: t("bn.bh.ey.prov"), judulHtml: esc(t("bn.bh.j.prov", { cpo: num((n || 0) / 1e6, 1), p: num(BM().length) })), subHtml: esc(t("bn.bh.s.prov")),
      isiHtml: `<div class="jm-saring rg3-saring rg3-saring-1">${pilihHtml({ id: "bn-b-m", ikon: "tag", label: t("bn.bh.f.metrik"), opsi: Object.entries(M).map(([k, v]) => [k, t(v.k), v.ik]), nilai: metrik })}</div><div id="bn-b-prov" class="ih-bagan"></div>${catatan("bn.bh.n.prov")}`, kakiHtml: kakiSumber(["jawapos-sawit"]) }) : "",
    BM().length ? ex({ id: "bn-b-semua", ikon: "tabel", topik: t("bn.bh.ey.tabel"), judulHtml: esc(t("bn.bh.j.tabel")), subHtml: esc(t("bn.bh.s.tabel")), isiHtml: `<div id="bn-b-tab"></div>${daftarCelah(B.biomassa?.meta?.celah?.slice(0, 2))}` }) : "",
    f.tkks_t_per_t_tbs ? ex({ id: "bn-b-residu", ikon: "tek-bio", topik: t("bn.bh.ey.residu"), judulHtml: esc(t("bn.bh.j.residu")), subHtml: esc(t("bn.bh.s.residu")),
      isiHtml: `<div class="rg3-kisi">${residu.map(([k, v, ik]) => `<div class="rg3-kartu"><div class="rg3-k-kep">${ikon(ik, 22)}<b>${esc(t("bn.bh.m." + k))}</b></div><p class="bn-angka">${esc(num(v * 1000, 0))} <small>kg / t TBS</small></p><p class="jm-bantu">${esc(t("bn.bh.lhv", { v: num(f.lhv_gj_per_t?.[k] ?? 0, 1) }))}</p></div>`).join("")}<div class="rg3-kartu"><div class="rg3-k-kep">${ikon("air-energi", 22)}<b>${esc(t("bn.bh.m.pome"))}</b></div><p class="bn-angka">${esc(num(f.pome_m3_per_t_tbs, 2))} <small>m3 / t TBS</small></p><p class="jm-bantu">${esc(t("bn.bh.biogas", { v: num(f.pome_gj_per_m3_biogas, 3) }))}</p></div></div>${catatan("bn.bh.n.residu")}`, kakiHtml: kakiSumber([]) }) : "",
    B.bio ? ex({ id: "bn-b-lain", ikon: "grafik", topik: t("bn.bh.ey.lain"), judulHtml: esc(t("bn.bh.j.lain")), subHtml: esc(t("bn.bh.s.lain")), isiHtml: `<div id="bn-b-kom"></div>${daftarCelah((B.bio.celah || []).slice(0, 2).map(tx))}`, kakiHtml: kakiSumber(B.bio.bahan_baku.komoditas.map((k) => k.sumber_id)) }) : "",
  ].join("");
  pasangPilih(); grafik(); tabelProv(); komoditas();
  el.querySelector("#bn-b-m")?.addEventListener("change", (e) => { metrik = M[e.target.value] ? e.target.value : "cpo"; nanti(grafik); });
}
