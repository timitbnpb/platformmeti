/* /nuklir, tab Bahan bakar: sumber daya uranium (U3O8) dan thorium menurut RUKN/BRIN dan Atlas Geologi, grafik per wilayah, daur bahan bakar (monasit, regulasi pengolahan, fasilitas BRIN). Semua versi angka ditampilkan, tidak dijumlahkan lintas kategori. */
import { B, t, ex, num, esc, ikon, tx, buktiS, kartu, butir, kakiSumber, batangSvg, tipHtml, legendaHtml, kosongTab, catatan, daftarCelah } from "/nkl_umum.js";

function grafik() {
  const g = document.getElementById("nkl-b-g"), l = document.getElementById("nkl-b-l"); if (!g) return;
  const Ba = B.nk.bahan, baris = [...Ba.uranium.filter((x) => x.k === "babel" || x.k === "kalbar").map((x) => ({ w: x.wilayah, k: "u", v: x.nilai, sat: x.satuan })), ...Ba.thorium.map((x) => ({ w: x.wilayah, k: "th", v: x.nilai, sat: x.satuan }))];
  l.innerHTML = legendaHtml([{ kelas: "nkl-s-uranium", label: t("nkl.b.u") }, { kelas: "nkl-s-thorium", label: t("nkl.b.th") }]);
  g.innerHTML = batangSvg({ el: g, d: 0, satuan: t("nkl.u.ton"), label: t("nkl.b.j.g"), seri: [{ k: "u", kelas: "nkl-s-uranium" }, { k: "th", kelas: "nkl-s-thorium" }],
    baris: baris.map((r) => { const lab = `${r.w}, ${t(r.k === "u" ? "nkl.b.u" : "nkl.b.th")}`; return { label: lab, bagian: [{ k: r.k, nilai: r.v }], tip: lab, th: tipHtml(lab, [[t("nkl.b.jumlah"), `${num(r.v, 0)} ${r.sat}`]]) }; }) });
}
export function mulai(el) {
  if (!B.nk) { el.innerHTML = kosongTab("nkl.kosong"); return; }
  const Ba = B.nk.bahan, semua = [...Ba.uranium.map((x) => ["beliung", "u", x]), ...Ba.thorium.map((x) => ["beliung", "th", x])];
  const kartuAngka = semua.map(([ik, jenis, x]) => kartu(ik, t(`nkl.b.k.${jenis}.${x.k}`), num(x.nilai, 0), x.satuan, tx(x.ket), x.sumber_id, x.tingkat_bukti)).join("");
  el.innerHTML = [
    ex({ id: "nkl-b-angka", ikon: "beliung", topik: t("nkl.b.ey.angka"), judulHtml: esc(t("nkl.b.j.angka")), subHtml: esc(t("nkl.b.s.angka")), isiHtml: `<div class="rg3-kisi">${kartuAngka}</div><p class="jm-bantu ih-catatan">${esc(tx(Ba.catatan_beda))}</p>`, kakiHtml: kakiSumber(["kumparan-uranium", "cnbc-melawi"]) }),
    ex({ id: "nkl-b-grafik", ikon: "grafik", topik: t("nkl.b.ey.g"), judulHtml: esc(t("nkl.b.j.g")), subHtml: esc(t("nkl.b.s.g")), isiHtml: `<div id="nkl-b-l"></div><div id="nkl-b-g" class="ih-bagan"></div>${catatan("nkl.b.n.g")}`, kakiHtml: kakiSumber(["kumparan-uranium"]) }),
    ex({ id: "nkl-b-daur", ikon: "daur", topik: t("nkl.b.ey.daur"), judulHtml: esc(t("nkl.b.j.daur")), subHtml: esc(t("nkl.b.s.daur")), isiHtml: butir(Ba.daur, "info") + catatan("nkl.b.n.daur"), kakiHtml: kakiSumber(Ba.daur.map((x) => x.sumber_id).concat(["brin_bbn"])) }),
    ex({ id: "nkl-b-celah", ikon: "tanya", topik: t("nkl.ey.celah"), judulHtml: esc(t("nkl.j.celah")), isiHtml: daftarCelah(B.nk.celah.filter((c) => /pengayaan/.test(c))) }),
  ].join("");
  grafik();
}
