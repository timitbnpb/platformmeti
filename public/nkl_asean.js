/* /nuklir, tab Pembanding ASEAN: Vietnam, Filipina, Thailand, Indonesia (ukuran proyek nuklir pertama menurut rencana) dari nuklir.json; pembanding dunia dari topik nuklir bab 20. Negara tanpa sumber terverifikasi ditulis sebagai celah. */
import { B, t, ex, num, esc, ikon, tx, buktiS, sumberLink, kakiSumber, kakiTopik, batangSvg, tipHtml, legendaHtml, tabel, kosongTab, catatan, daftarCelah, pil, bab, bendera, namaNegara, idSumber } from "/nkl_umum.js";

const ST = ["kontrak", "rencana", "dikaji"];
function grafik() {
  const g = document.getElementById("nkl-a-g"), l = document.getElementById("nkl-a-l"); if (!g) return;
  l.innerHTML = legendaHtml(ST.map((k) => ({ kelas: "nkl-s-" + k, label: t("nkl.st." + k) })));
  g.innerHTML = batangSvg({ el: g, d: 0, satuan: "MW", label: t("nkl.a.j.g"), seri: ST.map((k) => ({ k, kelas: "nkl-s-" + k })),
    baris: [...B.nk.asean.negara].sort((a, z) => z.ukuran_mw - a.ukuran_mw).map((n) => { const lab = namaNegara(n.iso2); return { label: lab, bendera: n.iso2.toLowerCase(), bagian: [{ k: n.status, nilai: n.ukuran_mw }], tip: lab, th: tipHtml(lab, [[t("nkl.a.ukuran"), `${num(n.ukuran_mw, 0)} MW`], [t("nkl.c.status"), t("nkl.st." + n.status)]]) }; }) });
}
function tabNegara() {
  const el = document.getElementById("nkl-a-tab"); if (!el) return;
  tabel(el, { satuan: "nkl.u.negara", per: 6, urutAwal: 1, menurun: true, kolom: [
    { label: t("nkl.c.negara"), v: (n) => namaNegara(n.iso2), f: (n) => `<span class="rg3-neg">${bendera(n.iso2, 20)}<span>${esc(namaNegara(n.iso2))}</span></span>` },
    { label: t("nkl.a.ukuran"), num: true, v: (n) => n.ukuran_mw, f: (n) => `<b>${esc(num(n.ukuran_mw, 0))}</b> <small>MW</small>` },
    { label: t("nkl.c.status"), v: (n) => n.status, f: (n) => pil("nkl.st.", n.status) },
    { label: t("nkl.c.uraian"), v: (n) => tx(n.ket), f: (n) => `<span class="rg3-teks">${esc(tx(n.ket))}</span>` },
    { label: t("nkl.c.bukti"), v: (n) => n.tingkat_bukti, f: (n) => `${buktiS(n.sumber_id, n.tingkat_bukti)}<span class="nkl-sumber">${idSumber(n).filter(Boolean).slice(0, 2).map(sumberLink).join("")}</span>` },
  ], baris: B.nk.asean.negara });
}
function tabBanding() {
  const el = document.getElementById("nkl-a-ban"); if (!el) return;
  tabel(el, { satuan: "nkl.u.negara", per: 7, urutAwal: 0, menurun: false, kolom: [
    { label: t("nkl.c.proyek"), v: (r) => tx(r.negara), f: (r) => `<span class="rg3-neg">${r.iso2 ? bendera(r.iso2, 20) : ""}<span>${esc(tx(r.negara))}</span></span>` },
    { label: t("nkl.a.ukuran"), v: (r) => tx(r.ukuran), f: (r) => esc(tx(r.ukuran)) },
    { label: t("nkl.c.status"), v: (r) => tx(r.status), f: (r) => `<span class="rg3-teks">${esc(tx(r.status))}</span>` },
    { label: t("nkl.c.catatan"), v: (r) => tx(r.catatan || ""), f: (r) => `<span class="rg3-teks">${esc(tx(r.catatan || "-"))}</span>` },
  ], baris: bab("banding")?.baris || [] });
}
export function mulai(el) {
  if (!B.nk) { el.innerHTML = kosongTab("nkl.kosong"); return; }
  const N = B.nk.asean.negara;
  el.innerHTML = [
    ex({ id: "nkl-a-grafik", ikon: "asean", topik: t("nkl.a.ey.g"), judulHtml: esc(t("nkl.a.j.g")), subHtml: esc(t("nkl.a.s.g")), isiHtml: `<div id="nkl-a-l"></div><div id="nkl-a-g" class="ih-bagan"></div>${catatan("nkl.a.n.g")}`, kakiHtml: kakiSumber(N.map((n) => n.sumber_id)) }),
    ex({ id: "nkl-a-negara", ikon: "tabel", topik: t("nkl.a.ey.tab"), judulHtml: esc(t("nkl.a.j.tab", { n: N.length })), subHtml: esc(t("nkl.a.s.tab")), isiHtml: `<div id="nkl-a-tab"></div><p class="jm-bantu"><a href="/asean">${esc(t("nkl.a.lihat"))}</a></p>`, kakiHtml: kakiSumber(N.flatMap(idSumber)) }),
    ex({ id: "nkl-a-banding", ikon: "globe", topik: t("nkl.a.ey.ban"), judulHtml: esc(t("nkl.a.j.ban")), subHtml: esc(t("nkl.a.s.ban")), isiHtml: `<div id="nkl-a-ban"></div>${catatan("nkl.a.n.ban")}`, kakiHtml: kakiTopik(bab("banding")?.sumber) }),
    ex({ id: "nkl-a-celah", ikon: "tanya", topik: t("nkl.ey.celah"), judulHtml: esc(t("nkl.j.celah")), isiHtml: daftarCelah(B.nk.celah.filter((c) => /Malaysia/.test(c))) }),
  ].join("");
  grafik(); tabNegara(); tabBanding();
}
