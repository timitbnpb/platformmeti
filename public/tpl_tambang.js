/* /transisi-pltu, tab Tambang dan batubara: produksi lawan DMO dan ekspor (transisi_pltu.json), HBA dan harga DMO (pasar_listrik.json), pasokan ke pembangkit. */
import { B, t, ex, num, esc, ikon, tx, bukti, buktiS, kakiSumber, tabel, kolomSvg, tipHtml, legendaHtml, kosongTab, catatan, daftarCelah } from "/tpl_umum.js";

const P = () => B.tp.tambang.produksi;
function produksi() {
  const g = document.getElementById("tpl-t-g"); if (!g) return;
  document.getElementById("tpl-t-l").innerHTML = legendaHtml([{ kelas: "tpl-s-dmo", label: t("tpl.tb.dmo") }, { kelas: "tpl-s-ekspor", label: t("tpl.tb.ekspor") }, { kelas: "tpl-s-lain", label: t("tpl.tb.lain") }]);
  g.innerHTML = kolomSvg({ el: g, satuan: t("tpl.u.juta_t"), label: t("tpl.tb.j.prod"), seri: [{ k: "d", kelas: "tpl-s-dmo" }, { k: "e", kelas: "tpl-s-ekspor" }, { k: "l", kelas: "tpl-s-lain" }],
    kategori: P().map((x) => { const lain = Math.max(0, x.produksi - x.dmo - x.ekspor); return { label: String(x.tahun), nilai: { d: x.dmo, e: x.ekspor, l: lain }, tip: String(x.tahun), th: tipHtml(String(x.tahun), [[t("tpl.tb.produksi"), `${num(x.produksi, 1)} ${t("tpl.u.juta_t")}`], [t("tpl.tb.dmo"), `${num(x.dmo, 1)}`], [t("tpl.tb.ekspor"), `${num(x.ekspor, 1)}`], [t("tpl.tb.lain"), `${num(lain, 1)} (EST)`]]) }; }) });
}
function hba() {
  const g = document.getElementById("tpl-t-hba"); if (!g) return;
  const H = B.pasar?.hba?.tahunan || [];
  g.innerHTML = kolomSvg({ el: g, satuan: "USD/t", label: t("tpl.tb.j.hba"), ref: { nilai: B.pasar.dmo.harga_usd_ton, label: t("tpl.tb.ref_dmo", { n: B.pasar.dmo.harga_usd_ton }) }, seri: [{ k: "h", kelas: "tpl-s-hba" }],
    kategori: H.map((x) => ({ label: String(x.tahun), nilai: { h: x.usd_ton }, tip: String(x.tahun), th: tipHtml(String(x.tahun), [["HBA", `${num(x.usd_ton, 2)} USD/t`], [t("tpl.tb.dmo_harga"), `${B.pasar.dmo.harga_usd_ton} USD/t`]]) })) });
}
function selisih() {
  const el = document.getElementById("tpl-t-tab"); if (!el) return;
  tabel(el, { satuan: "tpl.u.tahun", per: 7, urutAwal: 0, menurun: true, kolom: [
    { label: t("tpl.c.tahun"), num: true, v: (r) => r.tahun, f: (r) => esc(String(r.tahun)) },
    { label: "HBA", num: true, v: (r) => r.hba_usd_ton, f: (r) => `${esc(num(r.hba_usd_ton, 2))} <small class="rg3-catat">USD/t</small>` },
    { label: t("tpl.tb.dmo_harga"), num: true, v: (r) => r.harga_dmo_usd_ton, f: (r) => `${esc(num(r.harga_dmo_usd_ton, 0))} <small class="rg3-catat">USD/t</small>` },
    { label: t("tpl.tb.vol_plt"), num: true, v: (r) => r.volume_pembangkit_juta_t, f: (r) => `${esc(num(r.volume_pembangkit_juta_t, 1))} <small class="rg3-catat">${esc(t("tpl.u.juta_t"))}</small>` },
    { label: t("tpl.tb.selisih"), num: true, v: (r) => r.selisih_sen_kwh, f: (r) => `${esc(num(r.selisih_sen_kwh, 2))} <small class="rg3-catat">${esc(t("tpl.u.sen"))}</small>` },
    { label: t("tpl.tb.subsidi"), num: true, v: (r) => r.subsidi_tersirat_usd_miliar, f: (r) => `<b>${esc(num(r.subsidi_tersirat_usd_miliar, 1))}</b> <small class="rg3-catat">${esc(t("tpl.u.miliar_usd"))}</small>` },
    { label: t("tpl.c.bukti"), v: () => "", f: () => bukti("est", { sumber: "METI, pasar_listrik.json", cara: B.pasar.analisis.rumus }) },
  ], baris: B.pasar.analisis.tahunan });
}
function pasokan() {
  const g = document.getElementById("tpl-t-pas"); if (!g) return;
  const V = (B.pasar?.dmo?.volume || []).filter((v) => v.ke_pembangkit_listrik_t);
  document.getElementById("tpl-t-pas-l").innerHTML = legendaHtml([{ kelas: "tpl-s-vol", label: t("tpl.tb.ke_plt") }, { kelas: "tpl-s-lain", label: t("tpl.tb.dn_lain") }]);
  g.innerHTML = kolomSvg({ el: g, satuan: t("tpl.u.juta_t"), label: t("tpl.tb.j.pas"), seri: [{ k: "p", kelas: "tpl-s-vol" }, { k: "l", kelas: "tpl-s-lain" }],
    kategori: V.map((v) => { const p = v.ke_pembangkit_listrik_t / 1e6, dn = v.penjualan_dalam_negeri_t / 1e6; return { label: String(v.tahun), nilai: { p, l: Math.max(0, dn - p) }, tip: String(v.tahun), th: tipHtml(String(v.tahun), [[t("tpl.tb.ke_plt"), `${num(p, 1)} ${t("tpl.u.juta_t")}`], [t("tpl.tb.dn"), `${num(dn, 1)}`], [t("tpl.tb.pangsa"), `${num((p / dn) * 100, 0)}%`]]) }; }) });
}
export function mulai(el) {
  if (!B.tp) { el.innerHTML = kosongTab("tpl.kosong"); return; }
  const a = P().at(-1), b = P()[0], dmo = B.pasar?.dmo;
  el.innerHTML = [
    ex({ id: "tpl-t-prod", ikon: "beliung", topik: t("tpl.tb.ey.prod"), judulHtml: esc(t("tpl.tb.j.prod_n", { a: num(a.produksi, 0), b: num(b.produksi, 0), y: b.tahun })), subHtml: esc(t("tpl.tb.s.prod")),
      isiHtml: `<div id="tpl-t-l"></div><div id="tpl-t-g" class="ih-bagan"></div>${catatan("tpl.tb.n.prod")}`, kakiHtml: kakiSumber(P().map((x) => x.sumber_id)) }),
    B.pasar ? ex({ id: "tpl-t-hbaex", ikon: "tag", topik: t("tpl.tb.ey.hba"), judulHtml: esc(t("tpl.tb.j.hba")), subHtml: esc(t("tpl.tb.s.hba", { n: dmo.harga_usd_ton, th: dmo.tidak_berubah_sejak })),
      isiHtml: `<div id="tpl-t-hba" class="ih-bagan"></div><div id="tpl-t-tab"></div>${catatan("tpl.tb.n.hba")}`, kakiHtml: kakiSumber(["hessi-2024"]) + `<span class="tpl-sumber"><a class="rg3-tautan" href="/sistem">${esc(t("tpl.tb.lihat_sistem"))}</a></span>` }) : "",
    B.pasar ? ex({ id: "tpl-t-pasex", ikon: "industri", topik: t("tpl.tb.ey.pas"), judulHtml: esc(t("tpl.tb.j.pas")), subHtml: esc(t("tpl.tb.s.pas")), isiHtml: `<div id="tpl-t-pas-l"></div><div id="tpl-t-pas" class="ih-bagan"></div>${catatan("tpl.tb.n.pas")}` }) : "",
    daftarCelah((B.tp.meta.celah_en && document.documentElement.lang === "en" ? B.tp.meta.celah_en : B.tp.meta.celah).filter((c, i) => i === 0 || i === 2)),
  ].join("");
  produksi(); hba(); selisih(); pasokan();
}
