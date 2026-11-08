/* /gas, tab Jaringan pipa: ruas transmisi (Cisem II, Dumai-Sei Mangkei) dan pipa FSRU Jawa-1; panjang, biaya, status, operator, pembeli. Dari gas.json. */
import { B, t, ex, num, esc, tx, buktiS, kakiSumber, tabel, batangSvg, tipHtml, kosongTab, daftarCelah, orgLogoSel, pil, catatan, siapTautan, naikkan } from "/gsj_umum.js";

function grafik() {
  const g = document.getElementById("gsj-pp-g"); if (!g) return;
  g.innerHTML = batangSvg({ el: g, d: 0, satuan: "km", label: t("gsj.pp.g.label"), seri: [{ k: "n", kelas: "gsj-s-gas" }],
    baris: [...B.gs.pipa.ruas].sort((a, b) => b.km - a.km).map((r) => ({ label: r.nama, tip: r.nama, th: tipHtml(r.nama, [["km", num(r.km, 0)], [t("gsj.c.status"), t("gsj.st." + r.status)], [t("gsj.c.biaya"), r.biaya_rp_t != null ? `Rp ${num(r.biaya_rp_t, 1)} ${t("gsj.u.triliun")}` : "-"]]), bagian: [{ k: "n", nilai: r.km }] })) });
}
function tab() {
  const el = document.getElementById("gsj-pp-tab"); if (!el) return;
  tabel(el, { satuan: "gsj.u.ruas", per: 8, urutAwal: 1, menurun: true, kolom: [
    { label: t("gsj.c.ruas"), v: (r) => r.nama, f: (r) => `<span class="rg3-idk"><b>${esc(r.nama)}</b><small>${esc(r.lokasi)}</small></span>` },
    { label: t("gsj.c.km"), num: true, v: (r) => r.km, f: (r) => `<b>${esc(num(r.km, 0))}</b>${r.km_alt ? ` <small>(${esc(num(r.km_alt, 0))})</small>` : ""}` },
    { label: t("gsj.c.biaya"), num: true, v: (r) => r.biaya_rp_t ?? -1, f: (r) => (r.biaya_rp_t != null ? `Rp ${esc(num(r.biaya_rp_t, 1))} <small>${esc(t("gsj.u.triliun"))}</small>` : `<span class="jm-bantu">${esc(t("gsj.belum_ada"))}</span>`) },
    { label: t("gsj.c.status"), v: (r) => r.status, f: (r) => pil("gsj.st.", r.status) },
    { label: t("gsj.c.operator"), v: (r) => r.operator.nama, f: (r) => (r.operator.nama ? orgLogoSel(r.operator.org_id, r.operator.nama) : `<span class="jm-bantu">${esc(t("gsj.belum_ada"))}</span>`) },
    { label: t("gsj.c.catatan"), v: () => "", f: (r) => `<span class="rg3-teks">${esc(tx(r.ket))}</span>` },
    { label: t("gsj.c.bukti"), v: (r) => r.tingkat_bukti, f: (r) => buktiS(r.sumber_id, r.tingkat_bukti) },
  ], baris: B.gs.pipa.ruas });
}
export function mulai(el) {
  if (!B.gs) { el.innerHTML = kosongTab("gsj.kosong"); return; }
  const R = B.gs.pipa.ruas;
  el.innerHTML = [
    ex({ id: "gsj-pp-ruas", ikon: "sambung", topik: t("gsj.pp.ey.ruas"), judulHtml: esc(t("gsj.pp.j.ruas", { n: R.length })), subHtml: esc(t("gsj.pp.s.ruas")),
      isiHtml: `<div id="gsj-pp-g" class="ih-bagan gsj-grafik"></div><div id="gsj-pp-tab"></div>${catatan("gsj.pp.n.ruas")}`, kakiHtml: kakiSumber(["cnbc-cisem", "katadata-cisem-ops", "katadata-cisem-86", "migas-jembatan", "tenggara-jawa1"]) }),
    ex({ id: "gsj-pp-celah", ikon: "tanya", topik: t("gsj.ey.celah"), judulHtml: esc(t("gsj.j.celah")), isiHtml: daftarCelah(B.gs.celah.slice(4, 5)) }),
  ].join("");
  grafik(); tab();
  siapTautan("org").then(() => naikkan(el));
}
