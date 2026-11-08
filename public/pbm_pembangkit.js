/* /panas-bumi, tab Pembangkit: PLTP beroperasi dan rencana dari proyek_terpadu.json (gabungan GEM, RUPTL, proyek.json): kapasitas, pemilik berlogo, COD. Saringan status. */
import { B, t, ex, num, esc, ikon, tx, bukti, kakiSumber, tabel, kosongTab, pil, orgLogoSel, proyekPB, jumlahMw, tautProvinsi, siapTautan, naikkan, luar, catatan } from "/pbm_umum.js";
import { nanti } from "/inti/umum.js";

let st = "";
const urut = () => B.pb.rujukan.pembangkit_status_urut;
function tabProyek() {
  const el = document.getElementById("pbm-p-tab"); if (!el) return;
  const baris = proyekPB().filter((p) => !st || p.status === st);
  tabel(el, { satuan: "pbm.u.proyek", per: 10, urutAwal: 2, menurun: true, kolom: [
    { label: t("pbm.c.pltp"), v: (p) => p.nama, f: (p) => `<span class="rg3-idk"><b>${p.url ? luar(p.url, p.nama) : esc(p.nama)}</b><small>${esc(p.prov || "")}</small></span>` },
    { label: t("pbm.c.status"), v: (p) => p.status, f: (p) => pil("pbm.st.", p.status) },
    { label: t("pbm.c.mw"), num: true, v: (p) => p.mw ?? -1, f: (p) => (p.mw != null ? `<b>${esc(num(p.mw, 0))}</b>` : "-") },
    { label: t("pbm.c.pemilik"), v: (p) => p.pemilik?.nama || "", f: (p) => (p.pemilik?.nama ? orgLogoSel(p.pemilik.org_id, p.pemilik.nama) : "-") },
    { label: t("pbm.c.cod"), num: true, v: (p) => p.cod_terbaru ?? p.cod_rencana ?? 0, f: (p) => (p.cod_terbaru || p.cod_rencana ? `<span class="rg3-idk"><b>${esc(String(p.cod_terbaru ?? p.cod_rencana))}</b><small>${esc(p.cod_jenis === "aktual" ? t("pbm.cod.aktual") : t("pbm.cod.rencana"))}</small></span>` : "-") },
    { label: t("pbm.c.bukti"), v: (p) => p.status_sumber?.jenis || "", f: (p) => bukti(p.status_sumber?.jenis === "gem" || p.status_sumber?.jenis === "ruptl" ? "resmi" : "media", { sumber: t("pbm.sj." + (p.status_sumber?.jenis || "x")), tanggal: p.status_sumber?.tanggal || "" }) },
  ], baris });
}
export function mulai(el) {
  if (!B.pb || !B.pt) { el.innerHTML = kosongTab("pbm.kosong"); return; }
  const P = proyekPB(), per = urut().map((s) => [s, P.filter((p) => p.status === s)]).filter(([, a]) => a.length);
  const ubin = per.map(([s, a]) => `<div class="rg3-kartu"><div class="rg3-k-kep">${ikon("tek-panas", 22)}<b>${esc(t("pbm.st." + s))}</b></div><p class="pbm-angka">${esc(num(jumlahMw(a), 0))} <small>MW</small></p><p class="jm-bantu">${esc(t("pbm.p.n", { n: a.length }))}</p></div>`).join("");
  const opsi = [["", t("pbm.semua"), P.length], ...per.map(([s, a]) => [s, t("pbm.st." + s), a.length])];
  el.innerHTML = [
    ex({ id: "pbm-p-ringkas", ikon: "petir", topik: t("pbm.p.ey.ringkas"), judulHtml: esc(t("pbm.p.j.ringkas", { n: P.length, mw: num(jumlahMw(P), 0) })), subHtml: esc(t("pbm.p.s.ringkas")), isiHtml: `<div class="rg3-kisi">${ubin}</div>`, kakiHtml: kakiSumber(["ruptl"]) }),
    ex({ id: "pbm-p-daftar", ikon: "tabel", topik: t("pbm.p.ey.daftar"), judulHtml: esc(t("pbm.p.j.daftar")), subHtml: esc(t("pbm.p.s.daftar")),
      isiHtml: `<div class="rg3-chips" role="group" aria-label="${esc(t("pbm.p.f"))}">${opsi.map(([k, l, n]) => `<button type="button" class="rg3-chip rg3-chipb" data-st="${esc(k)}" aria-pressed="${st === k}"><span>${esc(l)}</span> <i>${n}</i></button>`).join("")}</div><div id="pbm-p-tab"></div>${catatan("pbm.p.n.daftar")}` }),
  ].join("");
  tabProyek();
  el.querySelector(".rg3-chips").addEventListener("click", (e) => {
    const b = e.target.closest("[data-st]"); if (!b) return;
    st = b.dataset.st; for (const x of el.querySelectorAll("[data-st]")) x.setAttribute("aria-pressed", String(x.dataset.st === st));
    nanti(tabProyek);
  });
  siapTautan("org", "proyek").then(() => naikkan(el));
}
