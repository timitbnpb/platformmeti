/* /nuklir, tab Opini publik: survei penerimaan PLTN (BATAN 2015, DEN 2024, Bangka Belitung 2023 dan 2025) dengan populasi, persepsi manfaat dan risiko, alasan menolak, dan isu dari isu.json lewat id. Survei berpendana pengembang diberi label. */
import { B, t, ex, num, esc, ikon, tx, buktiS, sumberLink, butir, kakiSumber, batangSvg, tipHtml, legendaHtml, tabel, kosongTab, catatan, daftarCelah, pil, bukti, tglTeks } from "/nkl_umum.js";

const SERI = { batan2015: "nasional", den2024: "nasional", babel2023: "lokal", babel2025: "pengembang" };
function grafikSurvei() {
  const g = document.getElementById("nkl-o-g"), l = document.getElementById("nkl-o-l"); if (!g) return;
  l.innerHTML = legendaHtml(["nasional", "lokal", "pengembang"].map((k) => ({ kelas: "nkl-s-" + k, label: t("nkl.o.s." + k) })));
  g.innerHTML = batangSvg({ el: g, d: 1, satuan: "%", label: t("nkl.o.j.g"), seri: ["nasional", "lokal", "pengembang"].map((k) => ({ k, kelas: "nkl-s-" + k })),
    baris: [...B.nk.opini.survei].sort((a, z) => z.nilai - a.nilai).map((s) => { const lab = t("nkl.o.k." + s.k); return { label: lab, bagian: [{ k: SERI[s.k], nilai: s.nilai }], tip: lab, th: tipHtml(lab, [[t("nkl.o.setuju"), `${num(s.nilai, 2)}%`], [t("nkl.c.tahun"), String(s.tahun)]], { extra: `<span class="ih-tr">${esc(tx(s.ket))}</span>` }) }; }) });
}
function grafikPersepsi() {
  const g = document.getElementById("nkl-o-pg"); if (!g) return;
  g.innerHTML = batangSvg({ el: g, d: 1, satuan: "%", label: t("nkl.o.j.p"), seri: [{ k: "p", kelas: "nkl-s-lokal" }],
    baris: B.nk.opini.persepsi.map((p) => { const lab = t("nkl.o.p." + p.k); return { label: lab, bagian: [{ k: "p", nilai: p.nilai }], tip: lab, th: tipHtml(lab, [[t("nkl.o.setuju"), `${num(p.nilai, 2)}%`]]) }; }) });
}
function tabSurvei() {
  const el = document.getElementById("nkl-o-tab"); if (!el) return;
  tabel(el, { satuan: "nkl.u.survei", per: 6, urutAwal: 1, menurun: true, kolom: [
    { label: t("nkl.c.populasi"), v: (s) => tx(s.populasi), f: (s) => `<b>${esc(tx(s.populasi))}</b>` },
    { label: t("nkl.c.tahun"), num: true, v: (s) => s.tahun, f: (s) => esc(String(s.tahun)) },
    { label: t("nkl.o.setuju"), num: true, v: (s) => s.nilai, f: (s) => `<b>${esc(num(s.nilai, 2))}%</b>` },
    { label: t("nkl.c.jenis"), v: (s) => SERI[s.k], f: (s) => pil("nkl.o.s.", SERI[s.k]) },
    { label: t("nkl.c.uraian"), v: (s) => tx(s.ket), f: (s) => `<span class="rg3-teks">${esc(tx(s.ket))}</span>` },
    { label: t("nkl.c.bukti"), v: (s) => s.tingkat_bukti, f: (s) => `${buktiS(s.sumber_id, s.tingkat_bukti)}<span class="nkl-sumber">${sumberLink(s.sumber_id)}</span>` },
  ], baris: B.nk.opini.survei });
}
function isuKartu() {
  const isu = B.nk.rujukan.isu_ids.map((id) => (B.isu?.baris || []).find((x) => x.id === id)).filter(Boolean);
  return `<ul class="nkl-isu-daftar">${isu.map((x) => `<li class="nkl-isu"><div class="nkl-isu-k"><b>${esc(x.judul)}</b><span>${pil("nkl.ist.", x.status || "aktif")}</span></div><p>${esc(x.ringkas)}</p><div class="nkl-isu-b"><span>${ikon("kalender", 14)} ${esc(t("nkl.o.terbaru"))}: ${esc(x.terbaru ? tglTeks(x.terbaru) : "-")}</span>${bukti(x.bukti || "media", { sumber: "isu.json", tanggal: B.isu?.tanggal_ambil || "" })}<a class="rg3-tautan" href="/isu#${esc(x.id)}">${esc(t("nkl.o.rinci"))}</a></div></li>`).join("")}</ul>`;
}
export function mulai(el) {
  if (!B.nk) { el.innerHTML = kosongTab("nkl.kosong"); return; }
  const O = B.nk.opini;
  el.innerHTML = [
    ex({ id: "nkl-o-survei", ikon: "survei", topik: t("nkl.o.ey.survei"), judulHtml: esc(t("nkl.o.j.survei")), subHtml: esc(t("nkl.o.s.survei")), isiHtml: `<div id="nkl-o-l"></div><div id="nkl-o-g" class="ih-bagan"></div>${catatan("nkl.o.n.survei")}`, kakiHtml: kakiSumber(O.survei.map((s) => s.sumber_id)) }),
    ex({ id: "nkl-o-tabel", ikon: "tabel", topik: t("nkl.o.ey.tab"), judulHtml: esc(t("nkl.o.j.tab")), subHtml: esc(t("nkl.o.s.tab")), isiHtml: `<div id="nkl-o-tab"></div>` }),
    ex({ id: "nkl-o-persepsi", ikon: "grafik", topik: t("nkl.o.ey.p"), judulHtml: esc(t("nkl.o.j.p")), subHtml: esc(t("nkl.o.s.p")), isiHtml: `<div id="nkl-o-pg" class="ih-bagan"></div>${catatan("nkl.o.n.p")}`, kakiHtml: kakiSumber(["dpr-babel"]) }),
    ex({ id: "nkl-o-tolak", ikon: "peringatan", topik: t("nkl.o.ey.tolak"), judulHtml: esc(t("nkl.o.j.tolak")), subHtml: esc(t("nkl.o.s.tolak")), isiHtml: butir(O.alasan_tolak, "peringatan") + isuKartu(), kakiHtml: kakiSumber(O.alasan_tolak.map((x) => x.sumber_id)) }),
    ex({ id: "nkl-o-celah", ikon: "tanya", topik: t("nkl.ey.celah"), judulHtml: esc(t("nkl.j.celah")), isiHtml: daftarCelah(B.nk.celah.filter((c) => /opini/.test(c))) }),
  ].join("");
  grafikSurvei(); grafikPersepsi(); tabSurvei();
}
