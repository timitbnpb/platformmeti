/* /transisi-pltu, tab Pensiun dini: kandidat (pltu.json#kandidat), biaya per MW bersumber (transisi_pltu.json#pensiun), Cirebon-1 batal, Pelabuhan Ratu, jadwal pensiun menurut GEM. */
import { B, t, ex, num, esc, ikon, tx, bukti, buktiS, kakiSumber, tabel, kolomSvg, tipHtml, legendaHtml, siapTautan, naikkan, kosongTab, catatan, daftarCelah, pilJenis, tautRegulasi, pltuById } from "/tpl_umum.js";

const K = () => B.pltu.kandidat;
const resmi = () => K().filter((k) => k.jalur.some((j) => j === "jetp" || j === "etm"));
function kartu() {
  return resmi().map((k) => `<div class="rg3-kartu"><div class="rg3-k-kep">${ikon(k.status === "dibatalkan" ? "peringatan" : "linimasa", 22)}<b>${esc(k.nama)}</b></div><p class="tpl-baris">${pilJenis("tpl.pn.st.", k.status)} ${k.jalur.map((j) => pilJenis("tpl.pn.jalur.", j)).join(" ")}</p><p class="tpl-angka">${esc(num(k.mw, 0))} <small>MW</small></p><p>${esc(tx(k.catatan))}</p><p class="jm-bantu">${esc(t("tpl.pn.target", { a: k.tahun_asal ?? "-", b: k.tahun_target ?? "-" }))}</p>${buktiS((k.sumber_ids || [])[0], k.tingkat_bukti)}</div>`).join("");
}
function biaya() {
  const el = document.getElementById("tpl-p-biaya"); if (!el) return;
  tabel(el, { satuan: "tpl.u.baris", per: 6, urutAwal: 2, menurun: true, kolom: [
    { label: t("tpl.c.kasus"), v: (r) => tx(r.label), f: (r) => `<b>${esc(tx(r.label))}</b>${r.catatan ? `<small class="rg3-catat">${esc(tx(r.catatan))}</small>` : ""}` },
    { label: "MW", num: true, v: (r) => r.mw, f: (r) => esc(num(r.mw, 0)) },
    { label: t("tpl.pn.total"), num: true, v: (r) => r.usd_juta ?? r.idr_triliun * 1e3, f: (r) => (r.usd_juta ? `<b>US$ ${esc(num(r.usd_juta, 0))}</b> <small class="rg3-catat">${esc(t("tpl.u.juta"))}</small>` : `<b>Rp ${esc(num(r.idr_triliun, 2))}</b> <small class="rg3-catat">${esc(t("tpl.u.triliun"))}</small>`) },
    { label: t("tpl.pn.per_mw"), num: true, v: (r) => r.per_mw_est.nilai, f: (r) => `<b>${esc(num(r.per_mw_est.nilai, 2))}</b> <small class="rg3-catat">${esc(r.usd_juta ? t("tpl.u.juta_usd_mw") : t("tpl.u.miliar_rp_mw"))}</small> ${bukti("est", { sumber: "METI", cara: t("tpl.pn.cara") })}` },
    { label: t("tpl.c.bukti"), v: (r) => r.tingkat_bukti, f: (r) => buktiS(r.sumber_id, r.tingkat_bukti) },
  ], baris: B.tp.pensiun.biaya });
}
function jadwal() {
  const g = document.getElementById("tpl-p-jad"); if (!g) return;
  const per = new Map();
  for (const k of K()) if (k.tahun_target && k.status !== "dibatalkan" && k.jalur.includes("gem")) per.set(k.tahun_target, (per.get(k.tahun_target) || 0) + k.mw);
  const th = [...per.keys()].sort((a, b) => a - b);
  g.innerHTML = kolomSvg({ el: g, satuan: "MW", label: t("tpl.pn.j.jad"), seri: [{ k: "v", kelas: "tpl-s-tahun" }], kategori: th.map((y) => ({ label: String(y), nilai: { v: per.get(y) }, tip: String(y), th: tipHtml(String(y), [["MW", num(per.get(y), 0)], [t("tpl.c.bukti"), t("tpl.pn.gem")]]) })) });
}
export function mulai(el) {
  if (!B.pltu || !B.tp) { el.innerHTML = kosongTab("tpl.kosong"); return; }
  const bt = B.tp.pensiun.biaya.filter((b) => b.usd_juta && b.pid);
  const rata = bt.reduce((a, b) => a + b.per_mw_est.nilai, 0) / bt.length;
  el.innerHTML = [
    ex({ id: "tpl-p-kan", ikon: "linimasa", topik: t("tpl.pn.ey.kan"), judulHtml: esc(t("tpl.pn.j.kan")), subHtml: esc(t("tpl.pn.s.kan")), isiHtml: `<div class="rg3-kisi">${kartu()}</div><p class="jm-bantu">${tautRegulasi("perpres-112-2022", "Perpres 112/2022")}</p>`, kakiHtml: kakiSumber(["jetp-cipp", "crea-jetp", "petromindo-cir1"]) }),
    ex({ id: "tpl-p-biayaex", ikon: "tag", topik: t("tpl.pn.ey.biaya"), judulHtml: esc(t("tpl.pn.j.biaya", { n: num(rata, 2) })), subHtml: esc(t("tpl.pn.s.biaya")), isiHtml: `<div id="tpl-p-biaya"></div>${catatan("tpl.pn.n.biaya")}` }),
    ex({ id: "tpl-p-jadex", ikon: "kalender", topik: t("tpl.pn.ey.jad"), judulHtml: esc(t("tpl.pn.j.jad")), subHtml: esc(t("tpl.pn.s.jad")), isiHtml: `<div id="tpl-p-jad" class="ih-bagan"></div>${catatan("tpl.pn.n.jad")}`, kakiHtml: kakiSumber(["gem-gcpt"]) }),
    daftarCelah([tx({ id: B.tp.meta.celah[3], en: B.tp.meta.celah_en[3] })]),
  ].join("");
  biaya(); jadwal();
  siapTautan("regulasi").then(() => naikkan(el));
}
