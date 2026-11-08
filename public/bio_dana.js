/* /bioenergi, tab Dana dan kebijakan: pungutan ekspor (tarif, penerimaan per tahun), kebutuhan dana B40, regulasi bertaut ke /regulasi. Angka Rp triliun; 2024 = target revisi, 2026 = semester I. */
import { B, t, ex, num, esc, ikon, tx, bukti, buktiS, kakiSumber, tabel, kolomSvg, tipHtml, legendaHtml, siapTautan, naikkan, kosongTab, catatan, tautRegulasi, pilJenis, luar } from "/bio_umum.js";

function penerimaan() {
  const g = document.getElementById("bn-f-g"); if (!g) return;
  const P = B.bio.dana.penerimaan;
  document.getElementById("bn-f-l").innerHTML = legendaHtml([{ kelas: "bn-s-realisasi", label: t("bn.df.realisasi") }, { kelas: "bn-s-target", label: t("bn.df.target") }, { kelas: "bn-s-rencana", label: t("bn.df.parsial") }]);
  g.innerHTML = kolomSvg({ el: g, satuan: t("bn.u.triliun"), label: t("bn.df.j.terima"), seri: [{ k: "r", kelas: "bn-s-realisasi" }, { k: "t", kelas: "bn-s-target" }, { k: "p", kelas: "bn-s-rencana" }],
    kategori: P.map((x) => ({ label: String(x.tahun), nilai: { [x.target ? "t" : x.parsial ? "p" : "r"]: x.triliun }, tip: String(x.tahun), th: tipHtml(String(x.tahun), [[t("bn.df.terima"), `Rp${num(x.triliun, x.triliun % 1 ? 1 : 0)} ${t("bn.u.triliun_pendek")}`], [t("bn.c.status"), x.target ? t("bn.df.target") : x.parsial ? t("bn.df.parsial") : t("bn.df.realisasi")], ["", x.catatan ? tx(x.catatan) : ""]]) })) });
}
function butuh() {
  const el = document.getElementById("bn-f-tab"); if (!el) return;
  tabel(el, { satuan: "bn.u.baris", per: 5, urutAwal: 0, menurun: true, kolom: [
    { label: t("bn.c.tahun"), num: true, v: (r) => r.tahun, f: (r) => esc(String(r.tahun)) },
    { label: t("bn.c.jenis"), v: (r) => r.k, f: (r) => pilJenis("bn.dk.", r.k, r.k === "subsidi" ? "kartu" : "kalkulator") },
    { label: t("bn.df.nilai"), num: true, v: (r) => r.triliun, f: (r) => `<b>Rp${esc(num(r.triliun, r.triliun % 1 ? 2 : 0))}</b> ${esc(t("bn.u.triliun_pendek"))}` },
    { label: t("bn.c.ket"), v: (r) => tx(r.ket), f: (r) => `<span class="rg3-teks">${esc(tx(r.ket))}</span>` },
    { label: t("bn.c.bukti"), v: (r) => r.tingkat_bukti, f: (r) => buktiS(r.sumber_id, r.tingkat_bukti) },
  ], baris: B.bio.dana.kebutuhan });
}
export function mulai(el) {
  if (!B.bio) { el.innerHTML = kosongTab("bn.kosong"); return; }
  const D = B.bio.dana, tr = D.tarif[0];
  el.innerHTML = [
    ex({ id: "bn-f-tarif", ikon: "palu", topik: t("bn.df.ey.tarif"), judulHtml: esc(t("bn.df.j.tarif", { n: num(tr.cpo_persen) })), subHtml: esc(t("bn.df.s.tarif")),
      isiHtml: `<div class="rg3-kisi"><div class="rg3-kartu"><div class="rg3-k-kep">${ikon("tag", 22)}<b class="bn-angka">${esc(num(tr.sebelum_persen, 1))}% > ${esc(num(tr.cpo_persen))}%</b></div><p>${esc(t("bn.df.berlaku", { tgl: tr.berlaku, dasar: tr.dasar }))}</p><p class="jm-bantu">${esc(tx(tr.ket))}</p>${buktiS(tr.sumber_id, tr.tingkat_bukti)}</div></div>`, kakiHtml: kakiSumber([tr.sumber_id]) }),
    ex({ id: "bn-f-terima", ikon: "grafik", topik: t("bn.df.ey.terima"), judulHtml: esc(t("bn.df.j.terima")), subHtml: esc(t("bn.df.s.terima")), isiHtml: `<div id="bn-f-l"></div><div id="bn-f-g" class="ih-bagan"></div>${catatan("bn.df.n.terima")}`, kakiHtml: kakiSumber(D.penerimaan.map((x) => x.sumber_id)) }),
    ex({ id: "bn-f-butuh", ikon: "kartu", topik: t("bn.df.ey.butuh"), judulHtml: esc(t("bn.df.j.butuh")), subHtml: esc(t("bn.df.s.butuh")), isiHtml: `<div id="bn-f-tab"></div>`, kakiHtml: kakiSumber(D.kebutuhan.map((x) => x.sumber_id)) }),
    ex({ id: "bn-f-reg", ikon: "regulasi", topik: t("bn.df.ey.reg"), judulHtml: esc(t("bn.df.j.reg")), subHtml: esc(t("bn.df.s.reg")),
      isiHtml: `<ul class="bn-daftar">${D.regulasi.map((r) => `<li>${ikon("regulasi", 18)}<div>${r.id ? tautRegulasi(r.id, r.id) : `<b>${esc(r.nama)}</b>`}<p class="jm-bantu">${esc(tx(r.teks))}</p></div></li>`).join("")}</ul>` }),
  ].join("");
  penerimaan(); butuh();
  siapTautan("regulasi").then(() => naikkan(el));
}
