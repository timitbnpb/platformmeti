/* /hidrogen, tab Pemakaian: industri pupuk dan kilang, co-firing amonia PLTU, transportasi dan SPBU hidrogen, baja. Kartu per sektor dengan pihak, angka, dan sumber. */
import { H, t, ex, num, esc, ikon, tx, bukti, buktiS, kakiSumber, kolomSvg, tipHtml, legendaHtml, siapTautan, naikkan, catatan, orgDaftar, enbBaris, luar } from "/h2_umum.js";

function alokasi() {
  const g = document.getElementById("h2-m-g"); if (!g) return;
  const total = H.h2.kunci.pln_ton_tahun, tr = 128;
  const K = [["transport", tr, "h2-s-transport", t("h2.m.transport")], ["sisa", total - tr, "h2-s-sisa", t("h2.m.sisa")]];
  document.getElementById("h2-m-g-l").innerHTML = legendaHtml(K.map(([, , c, l]) => ({ kelas: c, label: l })));
  g.innerHTML = kolomSvg({ el: g, satuan: t("h2.u.t_thn"), label: t("h2.m.j.g"), seri: K.map(([k, , c]) => ({ k, kelas: c })),
    kategori: [{ label: t("h2.m.pln22"), nilai: { transport: tr, sisa: total - tr }, tip: t("h2.m.pln22"), th: tipHtml(t("h2.m.pln22"), [[t("h2.m.transport"), `${num(tr, 0)} ${t("h2.u.t_thn")}`], [t("h2.m.sisa") + " (" + t("h2.hitung") + ")", `${num(total - tr, 0)} ${t("h2.u.t_thn")}`]]) }] });
}
export function mulai(el) {
  const P = H.h2.pemakaian, ulu = enbBaris("h2-ulubelu");
  const kartu = P.map((s) => `<div class="rg3-kartu h2-kartu"><div class="h2-kartu-kep">${ikon(s.ikon, 22)}<div><h3 class="jm-h3">${esc(t("h2.m.k." + s.k))}</h3><p class="h2-angka">${esc(tx(s.angka))}</p></div></div><p>${esc(tx(s.ket))}</p><div>${orgDaftar(s.org)}</div><p>${bukti(s.tingkat_bukti, { sumber: (H.h2.sumber.find((x) => x.id === s.sumber_ids[0]) || {}).penerbit || "", tanggal: "2026-11-08" })}</p>${kakiSumber(s.sumber_ids)}</div>`).join("");
  el.innerHTML = [
    ex({ id: "h2-m-kx", ikon: "mobil", topik: t("h2.m.ey.k"), judulHtml: esc(t("h2.m.j.k")), subHtml: esc(t("h2.m.s.k")), isiHtml: `<div class="rg3-kisi">${kartu}</div>${catatan("h2.m.n.k")}` }),
    ex({ id: "h2-m-gx", ikon: "grafik", topik: t("h2.m.ey.g"), judulHtml: esc(t("h2.m.j.g")), subHtml: esc(t("h2.m.s.g")), isiHtml: `<div id="h2-m-g-l"></div><div id="h2-m-g" class="ih-bagan"></div>${catatan("h2.m.n.g")}`, kakiHtml: kakiSumber(["hrs", "bisnis-hrs"]) }),
    ulu ? ex({ id: "h2-m-ulu", ikon: "tag", topik: t("h2.m.ey.u"), judulHtml: esc(t("h2.m.j.u")), subHtml: esc(t("h2.m.s.u")), isiHtml: `<div class="rg3-info">${ikon("info", 18)}<p>${esc(tx(ulu.ringkas))} ${bukti(ulu.tingkat_bukti, { tanggal: ulu.tanggal_periksa })}</p></div>` }) : "",
  ].join("");
  alokasi();
  siapTautan("org").then(() => naikkan(el));
}
