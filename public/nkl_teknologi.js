/* /nuklir, tab Teknologi dan vendor: ThorCon (garam cair thorium), SMR NuScale, Holtec, KHNP, PLTN terapung Rosatom; saringan jenis; pelajaran dari proyek SMR luar negeri; kartu butir energi baru. */
import { B, t, ex, esc, ikon, tx, buktiS, sumberLink, kakiSumber, tabel, kosongTab, catatan, pil, bendera, namaNegara, orgLogoSel, enbBaris, enbKartu, butir, idSumber, siapTautan, naikkan } from "/nkl_umum.js";
import { nanti } from "/inti/umum.js";

let jn = "";
const JENIS = ["", "smr", "msr", "terapung"];
function tabVendor() {
  const el = document.getElementById("nkl-t-tab"); if (!el) return;
  const baris = B.nk.teknologi.vendor.filter((v) => !jn || v.jenis === jn);
  tabel(el, { satuan: "nkl.u.vendor", per: 6, urutAwal: 0, menurun: false, kolom: [
    { label: t("nkl.c.teknologi"), v: (v) => v.nama, f: (v) => `<span class="rg3-idk"><b>${esc(v.nama)}</b><small>${esc(v.lokasi || t("nkl.t.lokasi_belum"))}</small></span>` },
    { label: t("nkl.c.negara"), v: (v) => v.iso2, f: (v) => `<span class="rg3-neg">${bendera(v.iso2, 20)}<span>${esc(namaNegara(v.iso2))}</span></span>` },
    { label: t("nkl.c.jenis"), v: (v) => v.jenis, f: (v) => pil("nkl.jn.", v.jenis, "nuklir") },
    { label: t("nkl.c.skala"), v: (v) => tx(v.skala), f: (v) => esc(tx(v.skala)) },
    { label: t("nkl.c.status"), v: (v) => v.status, f: (v) => pil("nkl.st.", v.status) },
    { label: t("nkl.c.pihak"), v: (v) => (v.org_tambahan || []).length, f: (v) => ((v.org_tambahan || []).length ? v.org_tambahan.map((id) => orgLogoSel(id)).join("") : "-") },
    { label: t("nkl.c.uraian"), v: (v) => tx(v.ket), f: (v) => `<span class="rg3-teks">${esc(tx(v.ket))}</span>` },
    { label: t("nkl.c.bukti"), v: (v) => v.tingkat_bukti, f: (v) => `${buktiS(v.sumber_id, v.tingkat_bukti)}<span class="nkl-sumber">${idSumber(v).filter(Boolean).slice(0, 2).map(sumberLink).join("")}</span>` },
  ], baris });
  siapTautan("org").then(() => naikkan(el));
}
export function mulai(el) {
  if (!B.nk) { el.innerHTML = kosongTab("nkl.kosong"); return; }
  const V = B.nk.teknologi.vendor, n = (k) => V.filter((v) => !k || v.jenis === k).length;
  const chips = JENIS.map((k, i) => `<button type="button" class="rg3-chip rg3-chipb rg3-w${i}" data-jn="${esc(k)}" aria-pressed="${jn === k}">${ikon(k ? "nuklir" : "daftar2", 14)}<span>${esc(k ? t("nkl.jn." + k) : t("nkl.semua"))}</span> <i>${n(k)}</i></button>`).join("");
  const enb = ["nk-thorcon", "nk-smr-as-kr", "nk-rosatom"].map((id) => enbKartu(enbBaris(id))).join("");
  el.innerHTML = [
    ex({ id: "nkl-t-vendor", ikon: "pabrik", topik: t("nkl.t.ey.vendor"), judulHtml: esc(t("nkl.t.j.vendor", { n: V.length })), subHtml: esc(t("nkl.t.s.vendor")), isiHtml: `<div class="rg3-chips" role="group" aria-label="${esc(t("nkl.t.f"))}">${chips}</div><div id="nkl-t-tab"></div>${catatan("nkl.t.n.vendor")}`, kakiHtml: kakiSumber(V.flatMap(idSumber)) }),
    ex({ id: "nkl-t-pelajaran", ikon: "peringatan", topik: t("nkl.t.ey.pel"), judulHtml: esc(t("nkl.t.j.pel")), subHtml: esc(t("nkl.t.s.pel")), isiHtml: butir([B.nk.teknologi.pelajaran], "peringatan"), kakiHtml: kakiSumber(["nuscale", "nuscale2"]) }),
    ex({ id: "nkl-t-enb", ikon: "energi-baru", topik: t("nkl.t.ey.enb"), judulHtml: esc(t("nkl.t.j.enb")), subHtml: esc(t("nkl.t.s.enb")), isiHtml: `<div class="nkl-enb-kisi">${enb}</div>` }),
  ].join("");
  tabVendor();
  el.querySelector(".rg3-chips").addEventListener("click", (e) => {
    const b = e.target.closest("[data-jn]"); if (!b) return;
    jn = b.dataset.jn; for (const x of el.querySelectorAll("[data-jn]")) x.setAttribute("aria-pressed", String(x.dataset.jn === jn));
    nanti(tabVendor);
  });
}
