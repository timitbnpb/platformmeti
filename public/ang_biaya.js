/* /angin, tab Biaya dan LCOE: LCOE empat skenario (EST/Hipotesis, rumus CRF tersimpan di angin.json) dibandingkan tarif kasus (Sidrap, Tolo, Tanah Laut) dan harga patokan Perpres 112/2022
   (peluang.json); faktor kapasitas historis PLTB Sulawesi Selatan (topik bayu bab 11). Dibaca runtime; capex Indonesia tidak ada di biaya_bangun.json (celah). */
import { B, muat, t, ex, num, esc, tx, bukti, buktiS, kakiSumber, tabel, batangSvg, kolomSvg, tipHtml, kosongTab, daftarCelah, catatan, pil } from "/ang_umum.js";
import { nanti } from "/inti/umum.js";

const patokan = () => B.pel?.harga_patokan?.teknologi?.bayu?.tingkat || [];
function grafikLcoe() {
  const el = document.getElementById("ang-b-g"); if (!el) return;
  const A = B.ang.biaya, big = patokan().at(-1);
  const baris = [
    ...A.skenario.map((s) => ({ k: "n", label: t("ang.b.s." + s.k), v: s.lcoe_sen, tip: t("ang.b.s." + s.k), th: tipHtml(t("ang.b.s." + s.k), [["capex", `${num(s.capex_usd_kw, 0)} USD/kW`], [t("ang.b.fk"), `${num(s.fk * 100, 0)}%`], ["WACC", `${num(s.wacc, 0)}%`], [t("ang.b.opex"), `${num(s.opex_persen, 1)}%`]]) })),
    ...A.tarif_kasus.map((x) => ({ k: "p", label: t("ang.b.tarif." + x.k, { th: x.tahun }), v: x.sen, tip: t("ang.b.tarif." + x.k, { th: x.tahun }) })),
    ...(big ? [{ k: "p", label: t("ang.b.patokan", { k: big.kapasitas }), v: big.koef_1_10, tip: t("ang.b.patokan", { k: big.kapasitas }) }] : []),
  ];
  el.innerHTML = batangSvg({ el, d: 2, satuan: "sen US$/kWh", label: t("ang.b.g.label"), seri: [{ k: "n", kelas: "rg3-s-id" }, { k: "p", kelas: "rg3-s-banding" }],
    baris: baris.map((b) => ({ label: b.label, ikon: "angin", tip: `${b.tip}: ${num(b.v, 2)}`, th: b.th || tipHtml(b.label, [[t("ang.b.nilai"), `${num(b.v, 2)} sen US$/kWh`]]), bagian: [{ k: b.k, nilai: b.v }] })) });
}
function tabAsumsi() {
  const el = document.getElementById("ang-b-t"); if (!el) return;
  tabel(el, { satuan: "ang.u.skenario", per: 8, urutAwal: 5, menurun: true, kolom: [
    { label: t("ang.c.skenario"), v: (s) => s.k, f: (s) => `<b>${esc(t("ang.b.s." + s.k))}</b>` },
    { label: "Capex (USD/kW)", num: true, v: (s) => s.capex_usd_kw, f: (s) => esc(num(s.capex_usd_kw, 0)) },
    { label: t("ang.b.fk"), num: true, v: (s) => s.fk, f: (s) => `${esc(num(s.fk * 100, 0))}%` },
    { label: "WACC", num: true, v: (s) => s.wacc, f: (s) => `${esc(num(s.wacc, 0))}%` },
    { label: t("ang.b.opex"), num: true, v: (s) => s.opex_persen, f: (s) => `${esc(num(s.opex_persen, 1))}%` },
    { label: "LCOE", num: true, v: (s) => s.lcoe_sen, f: (s) => `<b>${esc(num(s.lcoe_sen, 2))}</b>` },
    { label: t("ang.c.bukti"), v: (s) => s.capex_bukti, f: (s) => `<span class="rg3-ab">${buktiS(s.capex_sumber_id, s.capex_bukti)}${bukti("hipotesis", { sumber: "METI", cara: t("ang.b.cara") })}</span>` },
  ], baris: B.ang.biaya.skenario });
}
function tabPatokan() {
  const el = document.getElementById("ang-b-p"); if (!el) return;
  tabel(el, { satuan: "ang.u.kelas", per: 8, urutAwal: 1, menurun: false, kolom: [
    { label: t("ang.c.kapasitas"), v: (r) => r.kapasitas, f: (r) => `<b>${esc(r.kapasitas)}</b>` },
    { label: t("ang.b.th1_10"), num: true, v: (r) => r.koef_1_10, f: (r) => esc(num(r.koef_1_10, 2)) },
    { label: t("ang.b.th11"), num: true, v: (r) => r.tahun_11_dst, f: (r) => esc(num(r.tahun_11_dst, 2)) },
    { label: t("ang.c.bukti"), v: () => "", f: () => buktiS(B.ang.biaya.patokan_sumber_id, "resmi") },
  ], baris: patokan() });
}
function grafikFk() {
  const el = document.getElementById("ang-b-fk"); if (!el) return;
  const baris = B.tb?.bab?.["11"]?.baris || [];
  if (!baris.length) { el.innerHTML = kosongTab("ang.kosong"); return; }
  el.innerHTML = kolomSvg({ el, satuan: "%", label: t("ang.b.fk.label"), seri: [{ k: "n", kelas: "rg3-s-bayu", label: t("ang.b.fk") }],
    kategori: baris.map((r) => ({ label: r.tahun, nilai: { n: r.fk }, tip: `${r.tahun}: ${num(r.fk, 1)}% (${num(r.gwh, 0)} GWh, ${num(r.mw, 1)} MW)` })) });
}
export async function mulai(el) {
  await muat(["pel", "tb"]);
  if (!B.ang) { el.innerHTML = kosongTab("ang.kosong"); return; }
  const A = B.ang.biaya;
  el.innerHTML = [
    ex({ id: "ang-b-lcoe", ikon: "kalkulator", topik: t("ang.b.ey.lcoe"), judulHtml: esc(t("ang.b.j.lcoe")), subHtml: esc(t("ang.b.s.lcoe")), isiHtml: `<div id="ang-b-g" class="ih-bagan"></div><div id="ang-b-t"></div><p class="jm-bantu ih-catatan">${esc(tx(A.rumus))}</p>${daftarCelah([B.ang.celah[6]])}`, kakiHtml: kakiSumber(["irena_cost", "esdm_sidrap", "etp1", "tl-tarif"]) }),
    ex({ id: "ang-b-patokan", ikon: "tag", topik: t("ang.b.ey.patokan"), judulHtml: esc(t("ang.b.j.patokan")), subHtml: esc(t("ang.b.s.patokan")), isiHtml: `<div id="ang-b-p"></div>${catatan("ang.b.n.patokan")}`, kakiHtml: kakiSumber(["p112"]) }),
    ex({ id: "ang-b-fkx", ikon: "grafik", topik: t("ang.b.ey.fk"), judulHtml: esc(t("ang.b.j.fk")), subHtml: esc(t("ang.b.s.fk")), isiHtml: `<div id="ang-b-fk" class="ih-bagan"></div>${catatan("ang.b.n.fk")}<p class="jm-bantu">${bukti("est", { sumber: "Ember, IRENA", cara: t("ang.b.cara_fk") })}</p>`, kakiHtml: kakiSumber(["ember", "irena"]) }),
  ].join("");
  nanti(() => { grafikLcoe(); tabAsumsi(); tabPatokan(); grafikFk(); });
}
