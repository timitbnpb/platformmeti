/* /hidrogen, tab Turunan: amonia (Pupuk Indonesia, Pupuk Kaltim, Pusri, PIM), metanol dan e-fuel; kapasitas pabrik amonia dan rencana hijau dan biru. */
import { H, t, ex, num, esc, ikon, tx, buktiS, kakiSumber, tabel, batangSvg, tipHtml, siapTautan, naikkan, daftarCelah, catatan, orgDaftar, orgSel, chipStatus, pilJenis, tautProvinsi } from "/h2_umum.js";

const JENIS = [["", "daftar2"], ["amonia", "industri"], ["efuel", "labu"], ["metanol", "tag"]];
let jenis = "";
const T = () => H.h2.turunan;
function kapasitas() {
  const g = document.getElementById("h2-t-g"); if (!g) return;
  const baris = [...T().pabrik_amonia].sort((a, b) => b.kt_tahun - a.kt_tahun);
  g.innerHTML = batangSvg({ el: g, d: 0, satuan: t("h2.u.kt_thn"), label: t("h2.t.j.g"), seri: [{ k: "n", kelas: "h2-s-pabrik" }],
    baris: baris.map((p) => ({ label: p.nama, logo: `/img/provinsi/${p.prov}.png`, tip: p.nama, th: tipHtml(p.nama, [[t("h2.p.kap"), `${num(p.kt_tahun, 0)} ${t("h2.u.kt_thn")}`], ...(p.rincian ? [[t("h2.t.rinci"), p.rincian]] : [])], { img: `/img/provinsi/${p.prov}.png` }), bagian: [{ k: "n", nilai: p.kt_tahun }] })) });
}
function tabelRencana() {
  const el = document.getElementById("h2-t-tab"); if (!el) return;
  const baris = T().rencana.filter((r) => !jenis || r.jenis === jenis);
  tabel(el, { satuan: "h2.u.rencana", per: 5, urutAwal: 3, menurun: false, kolom: [
    { label: t("h2.c.rencana"), v: (r) => tx(r.nama), f: (r) => `<span class="rg3-idk"><b>${esc(tx(r.nama))}</b><small>${pilJenis("h2.jenis.", r.jenis, JENIS.find((x) => x[0] === r.jenis)?.[1])}</small></span>` },
    { label: t("h2.c.pihak"), v: (r) => r.org.length, f: (r) => orgDaftar(r.org) },
    { label: t("h2.c.status"), v: (r) => r.status, f: (r) => chipStatus(r.status) },
    { label: t("h2.c.tahun"), num: true, v: (r) => r.tahun || 0, f: (r) => esc(String(r.tahun || "-")) },
    { label: t("h2.t.mt"), num: true, v: (r) => r.mt || 0, f: (r) => (r.mt ? `<b>${esc(num(r.mt, r.mt < 1 ? 2 : 1))}</b> <small>${esc(t("h2.u.juta_t"))}</small>${r.usd_miliar ? `<small class="rg3-catat">USD ${esc(num(r.usd_miliar))} ${esc(t("h2.u.miliar"))}</small>` : ""}` : "-") },
    { label: t("h2.c.uraian"), v: (r) => tx(r.ket), f: (r) => `<span class="rg3-teks">${esc(tx(r.ket))}</span>` },
    { label: t("h2.c.bukti"), v: (r) => r.tingkat_bukti, f: (r) => buktiS(r.sumber_id, r.tingkat_bukti) },
  ], baris });
  siapTautan("org").then(() => naikkan(el));
}
export function mulai(el) {
  const d = T(), n = (k) => d.rencana.filter((r) => !k || r.jenis === k).length;
  el.innerHTML = [
    ex({ id: "h2-t-gx", ikon: "industri", topik: t("h2.t.ey.g"), judulHtml: esc(t("h2.t.j.g", { n: d.grup.mt_tahun })), subHtml: esc(t("h2.t.s.g")),
      isiHtml: `<div class="rg3-info">${ikon("info", 18)}<p>${esc(t("h2.t.i", { n: d.grup.mt_tahun }))} ${buktiS(d.grup.sumber_id, d.grup.tingkat_bukti)}</p></div><div id="h2-t-g" class="ih-bagan"></div>${catatan("h2.t.n.g")}${daftarCelah([t("h2.t.celah.nh3")])}`, kakiHtml: kakiSumber(["fortune-nh3-7jt", "cnbc-pupuk", "katadata-kaltim2"]) }),
    ex({ id: "h2-t-rx", ikon: "labu", topik: t("h2.t.ey.r"), judulHtml: esc(t("h2.t.j.r", { n: n("") })), subHtml: esc(t("h2.t.s.r")),
      isiHtml: `<div class="rg3-chips" role="group" aria-label="${esc(t("h2.f.jenis"))}">${JENIS.map(([k, i], idx) => `<button type="button" class="rg3-chip rg3-chipb rg3-w${idx}" data-jenis="${esc(k)}" aria-pressed="${jenis === k}">${ikon(i, 14)}<span>${esc(t(k ? "h2.jenis." + k : "h2.semua"))}</span> <i>${n(k)}</i></button>`).join("")}</div><div id="h2-t-tab"></div>${daftarCelah([t("h2.t.celah.metanol")])}`, kakiHtml: kakiSumber(d.rencana.map((r) => r.sumber_id)) }),
  ].join("");
  kapasitas(); tabelRencana();
  el.querySelector("[data-jenis]").parentElement.addEventListener("click", (e) => {
    const b = e.target.closest("[data-jenis]"); if (!b) return;
    jenis = b.dataset.jenis; for (const x of el.querySelectorAll("[data-jenis]")) x.setAttribute("aria-pressed", String(x.dataset.jenis === jenis));
    tabelRencana();
  });
}
