/* /hidrogen, tab Proyek dunia: pembanding (NEOM, Kuqa, Fukushima, proyek Australia yang batal) dengan bendera, status, dan angka IEA tentang kesenjangan antara proyek diumumkan dan proyek berjalan. */
import { H, t, ex, num, esc, ikon, tx, buktiS, kakiSumber, tabel, kolomSvg, tipHtml, legendaHtml, siapTautan, naikkan, catatan, orgDaftar, negaraSel, chipStatus, sumberLink } from "/h2_umum.js";

const ST = ["", "beroperasi", "konstruksi", "dibatalkan"];
let st = "";
function iea() {
  const g = document.getElementById("h2-d-g"); if (!g) return;
  const i = H.h2.dunia.iea, K = [["a", i.rendah_emisi_2025_mt, "h2-s-ok", t("h2.d.a")], ["b", i.fid_2030_mt, "h2-s-warn", t("h2.d.b")], ["c", i.diumumkan_2030_mt, "h2-s-target", t("h2.d.c")], ["d", i.diumumkan_2030_mt_tahun_lalu, "h2-s-sisa", t("h2.d.d")]];
  document.getElementById("h2-d-g-l").innerHTML = legendaHtml(K.map(([, , c, l]) => ({ kelas: c, label: l })));
  g.innerHTML = kolomSvg({ el: g, satuan: t("h2.u.juta_t"), label: t("h2.d.j.g"), seri: K.map(([k, , c]) => ({ k, kelas: c })),
    kategori: K.map(([k, v, , l]) => ({ label: l, nilai: { [k]: v }, tip: l, th: tipHtml(l, [[t("h2.u.juta_t"), num(v, 1)]]) })) });
}
function tabelProyek() {
  const el = document.getElementById("h2-d-tab"); if (!el) return;
  const baris = H.h2.dunia.proyek.filter((p) => !st || p.status === st);
  tabel(el, { satuan: "h2.u.proyek", per: 6, urutAwal: 0, menurun: false, kolom: [
    { label: t("h2.c.proyek"), v: (p) => tx(p.nama), f: (p) => `<span class="rg3-idk"><b>${esc(tx(p.nama))}</b><small>${negaraSel(p.iso2, 16)}</small></span>` },
    { label: t("h2.c.status"), v: (p) => p.status, f: (p) => chipStatus(p.status) },
    { label: t("h2.c.uraian"), v: (p) => tx(p.ket), f: (p) => `<span class="rg3-teks">${esc(tx(p.ket))}</span>` },
    { label: t("h2.c.pihak"), v: (p) => p.org.length, f: (p) => orgDaftar(p.org) },
    { label: t("h2.c.bukti"), v: (p) => p.tingkat_bukti, f: (p) => `${buktiS(p.sumber_ids[0], p.tingkat_bukti)}<span class="h2-sumber">${sumberLink(p.sumber_ids[0])}</span>` },
  ], baris });
  siapTautan("org").then(() => naikkan(el));
}
export function mulai(el) {
  const D = H.h2.dunia, n = (k) => D.proyek.filter((p) => !k || p.status === k).length;
  el.innerHTML = [
    ex({ id: "h2-d-gx", ikon: "grafik", topik: t("h2.d.ey.g"), judulHtml: esc(t("h2.d.j.g")), subHtml: esc(t("h2.d.s.g")), isiHtml: `<div id="h2-d-g-l"></div><div id="h2-d-g" class="ih-bagan"></div>${catatan("h2.d.n.g")}`, kakiHtml: kakiSumber([D.iea.sumber_id]) }),
    ex({ id: "h2-d-px", ikon: "globe", topik: t("h2.d.ey.p"), judulHtml: esc(t("h2.d.j.p", { n: n("") })), subHtml: esc(t("h2.d.s.p")),
      isiHtml: `<div class="rg3-chips" role="group" aria-label="${esc(t("h2.f.status"))}">${ST.map((k, i) => `<button type="button" class="rg3-chip rg3-chipb rg3-w${i}" data-st="${esc(k)}" aria-pressed="${st === k}">${ikon(k ? ({ beroperasi: "centang", konstruksi: "pabrik", dibatalkan: "silang" })[k] : "daftar2", 14)}<span>${esc(t(k ? "h2.st." + k : "h2.semua"))}</span> <i>${n(k)}</i></button>`).join("")}</div><div id="h2-d-tab"></div>${catatan("h2.d.n.p")}` }),
  ].join("");
  iea(); tabelProyek();
  el.querySelector(".rg3-chips").addEventListener("click", (e) => {
    const b = e.target.closest("[data-st]"); if (!b) return;
    st = b.dataset.st; for (const x of el.querySelectorAll("[data-st]")) x.setAttribute("aria-pressed", String(x.dataset.st === st));
    tabelProyek();
  });
}
