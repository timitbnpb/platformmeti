/* /gas, tab Neraca dan DMO: pemanfaatan gas Jan-Sep 2025 (domestik, ekspor, listrik), pangsa sektor domestik, proyeksi defisit PGN 2025-2035, kebijakan alokasi dan DMO. Dari gas.json. */
import { B, t, ex, num, esc, tx, buktiS, kakiSumber, batangSvg, tipHtml, kosongTab, daftarCelah, daftarButir, kartuAngka, catatan } from "/gsj_umum.js";

function grafikGuna() {
  const g = document.getElementById("gsj-n-g1"); if (!g) return;
  const N = B.gs.neraca.pemanfaatan, tot = N.total;
  g.innerHTML = batangSvg({ el: g, d: 0, satuan: "BBTUD", label: t("gsj.n.g1.label"), seri: [{ k: "n", kelas: "gsj-s-gas" }],
    baris: N.baris.map((x) => ({ label: t("gsj.n.p." + x.k), tip: t("gsj.n.p." + x.k), th: tipHtml(t("gsj.n.p." + x.k), [["BBTUD", num(x.nilai, 0)], [t("gsj.n.pangsa"), `${num((x.nilai / tot) * 100, 1)}%`], [t("gsj.c.bukti"), t("gsj.b." + N.tingkat_bukti)]]), bagian: [{ k: "n", nilai: x.nilai }] })) });
}
function grafikSektor() {
  const g = document.getElementById("gsj-n-g2"); if (!g) return;
  const Sd = B.gs.neraca.sektor_domestik;
  g.innerHTML = batangSvg({ el: g, d: 1, satuan: "%", label: t("gsj.n.g2.label"), seri: [{ k: "n", kelas: "gsj-s-a" }],
    baris: Sd.baris.map((x) => ({ label: t("gsj.n.s." + x.k), tip: t("gsj.n.s." + x.k), th: tipHtml(t("gsj.n.s." + x.k), [["%", num(x.nilai, 2)], [t("gsj.c.bukti"), t("gsj.b." + Sd.tingkat_bukti)]]), bagian: [{ k: "n", nilai: x.nilai }] })) });
}
function grafikDefisit() {
  const g = document.getElementById("gsj-n-g3"); if (!g) return;
  const D = B.gs.neraca.defisit;
  g.innerHTML = batangSvg({ el: g, d: 0, satuan: "MMSCFD", label: t("gsj.n.g3.label"), seri: [{ k: "n", kelas: "gsj-s-d" }],
    baris: D.baris.map((x) => ({ label: String(x.tahun), tip: String(x.tahun), th: tipHtml(String(x.tahun), [["MMSCFD", num(x.nilai, 0)], [t("gsj.c.bukti"), t("gsj.b." + D.tingkat_bukti)]]), bagian: [{ k: "n", nilai: x.nilai }] })) });
}
export function mulai(el) {
  if (!B.gs) { el.innerHTML = kosongTab("gsj.kosong"); return; }
  const Nr = B.gs.neraca, N = Nr.pemanfaatan, dom = N.baris[0].nilai, listrik = N.baris[3];
  const ringkas = [
    kartuAngka("gas", t("gsj.n.k.total"), num(N.total, 0), "BBTUD", tx(N.periode), N.sumber_id, N.tingkat_bukti),
    kartuAngka("gas", t("gsj.n.k.domestik"), num(dom, 0), "BBTUD", t("gsj.n.k.domestik_ket", { p: num((dom / N.total) * 100, 1), r: num(Nr.sektor_domestik.domestik_total, 0) }), N.sumber_id, N.tingkat_bukti),
    kartuAngka("petir", t("gsj.n.k.listrik"), num(listrik.nilai, 1), "BBTUD", t("gsj.n.k.listrik_ket", { p: num((listrik.nilai / N.total) * 100, 1) }), N.sumber_id, N.tingkat_bukti),
    kartuAngka("grafik", t("gsj.n.k.produksi"), num(Nr.produksi.nilai, 0), Nr.produksi.satuan, tx(Nr.produksi.ket), Nr.produksi.sumber_id, Nr.produksi.tingkat_bukti),
  ].join("");
  el.innerHTML = [
    ex({ id: "gsj-n-guna", ikon: "grafik", topik: t("gsj.n.ey.guna"), judulHtml: esc(t("gsj.n.j.guna", { n: num(N.total, 0) })), subHtml: esc(t("gsj.n.s.guna")),
      isiHtml: `<div id="gsj-n-g1" class="ih-bagan gsj-grafik"></div><div class="gsj-kisi">${ringkas}</div><div id="gsj-n-g2" class="ih-bagan gsj-grafik"></div>${catatan("gsj.n.n.guna")}`, kakiHtml: kakiSumber(["fortune-ekspor", "migas-jembatan", "katadata-pgn"]) }),
    ex({ id: "gsj-n-defisit", ikon: "peringatan", topik: t("gsj.n.ey.defisit"), judulHtml: esc(t("gsj.n.j.defisit", { a: num(Nr.defisit.baris[0].nilai, 0), b: num(Math.max(...Nr.defisit.baris.map((x) => x.nilai)), 0) })), subHtml: esc(t("gsj.n.s.defisit")),
      isiHtml: `<div id="gsj-n-g3" class="ih-bagan gsj-grafik"></div><p class="jm-bantu ih-catatan">${esc(tx(Nr.defisit.ket))}</p>${daftarCelah(B.gs.celah.slice(5, 6))}`, kakiHtml: kakiSumber(["detik-defisit", "katadata-pgn"]) }),
    ex({ id: "gsj-n-dmo", ikon: "palu", topik: t("gsj.n.ey.dmo"), judulHtml: esc(t("gsj.n.j.dmo")), subHtml: esc(t("gsj.n.s.dmo")), isiHtml: daftarButir(Nr.alokasi, "palu") + daftarCelah(B.gs.celah.slice(6, 7)), kakiHtml: kakiSumber(Nr.alokasi.map((x) => x.sumber_id)) }),
  ].join("");
  grafikGuna(); grafikSektor(); grafikDefisit();
}
