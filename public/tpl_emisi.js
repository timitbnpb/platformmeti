/* /transisi-pltu, tab Emisi dan kesehatan: angka nasional CREA (pltu.json#dampak), emisi Climate TRACE per provinsi, kematian dan biaya dialokasikan kasar (EST), Toxic Twenty. */
import { B, t, ex, num, esc, ikon, tx, bukti, buktiS, kakiSumber, tabel, batangSvg, tipHtml, legendaHtml, siapTautan, naikkan, kosongTab, catatan, tautProvinsi, luar } from "/tpl_umum.js";

const DP = () => B.pltu.dampak.provinsi;
function kartu() {
  return B.pltu.dampak.nasional.map((n) => `<div class="rg3-kartu"><div class="rg3-k-kep">${ikon(/mati|death/i.test(tx(n.label)) ? "peringatan" : "tag", 22)}<b class="tpl-angka">${esc(num(n.nilai, n.nilai % 1 ? 1 : 0))} <small>${esc(tx(n.satuan))}</small></b></div><p>${esc(tx(n.label))}</p><p class="jm-bantu">${esc(tx(n.catatan))} (${esc(String(n.tahun_data))})</p>${buktiS(n.sumber_id)}</div>`).join("");
}
function emisiProv() {
  const g = document.getElementById("tpl-e-prov"); if (!g) return;
  const top = [...DP()].sort((a, b) => b.emisi_ct_t - a.emisi_ct_t).slice(0, 10);
  g.innerHTML = batangSvg({ el: g, d: 1, satuan: t("tpl.u.juta_t") + " CO2", label: t("tpl.em.j.prov"), seri: [{ k: "e", kelas: "tpl-s-emisi" }],
    baris: top.map((p) => ({ label: p.nama, logo: `/img/provinsi/${p.kode}.png`, tip: p.nama, th: tipHtml(p.nama, [[t("tpl.em.emisi"), `${num(p.emisi_ct_t / 1e6, 1)} Mt`], ["MW", num(p.mw_operasi, 0)], [t("tpl.em.mati"), `${num(p.kematian_est, 0)} (EST)`]], { img: `/img/provinsi/${p.kode}.png` }), bagian: [{ k: "e", nilai: p.emisi_ct_t / 1e6 }] })) });
}
function tabProv() {
  const el = document.getElementById("tpl-e-tab"); if (!el) return;
  tabel(el, { satuan: "tpl.u.prov", per: 8, urutAwal: 2, menurun: true, kolom: [
    { label: t("tpl.c.prov"), v: (p) => p.nama, f: (p) => tautProvinsi(p.kode) },
    { label: "MW", num: true, v: (p) => p.mw_operasi, f: (p) => esc(num(p.mw_operasi, 0)) },
    { label: t("tpl.em.emisi") + " (Mt)", num: true, v: (p) => p.emisi_ct_t, f: (p) => esc(num(p.emisi_ct_t / 1e6, 1)) },
    { label: t("tpl.em.mati"), num: true, v: (p) => p.kematian_est, f: (p) => esc(num(p.kematian_est, 0)) },
    { label: t("tpl.em.biaya"), num: true, v: (p) => p.biaya_est_musd, f: (p) => `${esc(num(p.biaya_est_musd, 0))} <small class="rg3-catat">${esc(t("tpl.u.juta_usd"))}</small>` },
    { label: t("tpl.c.bukti"), v: () => "", f: () => bukti("est", { sumber: "CREA 2023, alokasi menurut MW", cara: t("tpl.em.cara") }) },
  ], baris: DP() });
  siapTautan().then(() => naikkan(el));
}
export function mulai(el) {
  if (!B.pltu) { el.innerHTML = kosongTab("tpl.kosong"); return; }
  const m = B.pltu.meta, t20 = B.pltu.dampak.toxic20_nama;
  el.innerHTML = [
    ex({ id: "tpl-e-nas", ikon: "peringatan", topik: t("tpl.em.ey.nas"), judulHtml: esc(t("tpl.em.j.nas", { n: num(B.pltu.dampak.nasional[0].nilai, 0) })), subHtml: esc(t("tpl.em.s.nas")), isiHtml: `<div class="tpl-kisi">${kartu()}</div>`, kakiHtml: kakiSumber(["crea-2023", "crea-t20", "crea-captive", "crea-jetp"]) }),
    ex({ id: "tpl-e-provex", ikon: "karbon", topik: t("tpl.em.ey.prov"), judulHtml: esc(t("tpl.em.j.prov_n", { n: num(m.emisi_ct_total_t / 1e6, 0) })), subHtml: esc(t("tpl.em.s.prov")), isiHtml: `<div id="tpl-e-prov" class="ih-bagan"></div><div id="tpl-e-tab"></div>${catatan("tpl.em.n.prov")}`, kakiHtml: kakiSumber(["ct"]) + `<span class="tpl-sumber"><a class="rg3-tautan" href="/target#transisi">${esc(t("tpl.em.lihat"))}</a></span>` }),
    ex({ id: "tpl-e-t20", ikon: "peringatan", topik: t("tpl.em.ey.t20"), judulHtml: esc(t("tpl.em.j.t20", { n: B.pltu.baris.filter((b) => b.toxic20).length })), subHtml: esc(t("tpl.em.s.t20")), isiHtml: `<p>${t20.map((x) => `<span class="rg3-chip rg3-w5"><span>${esc(x)}</span></span>`).join(" ")}</p>${catatan("tpl.em.n.t20")}`, kakiHtml: kakiSumber(["crea-t20"]) }),
  ].join("");
  emisiProv(); tabProv();
}
