/* /nuklir, tab Kandidat tapak: sorotan lokasi bernama (Muria, Bangka, Kelasa, Kalimantan Barat, Kepulauan Riau, Halmahera) dari nuklir.json; 29 calon lokasi di 13 wilayah dari topik nuklir bab 8; kartu 28 tapak ESDM dari energi_baru.json. */
import { B, t, ex, num, esc, ikon, tx, buktiS, sumberLink, kakiSumber, kakiTopik, tabel, kosongTab, catatan, pil, bab, enbBaris, enbKartu, idSumber, tautProvinsi, siapTautan, naikkan, daftarCelah } from "/nkl_umum.js";
import { nanti } from "/inti/umum.js";

let st = "";
function tabSorot() {
  const el = document.getElementById("nkl-p-tab"); if (!el) return;
  const baris = B.nk.tapak.sorotan.filter((x) => !st || x.status === st);
  tabel(el, { satuan: "nkl.u.lokasi", per: 7, urutAwal: 0, menurun: false, kolom: [
    { label: t("nkl.c.lokasi"), v: (x) => x.nama, f: (x) => `<b>${esc(x.nama)}</b>` },
    { label: t("nkl.c.provinsi"), v: (x) => x.prov_kode, f: (x) => tautProvinsi(x.prov_kode) },
    { label: t("nkl.c.status"), v: (x) => x.status, f: (x) => pil("nkl.st.", x.status) },
    { label: t("nkl.c.pihak"), v: (x) => x.pihak.join(), f: (x) => (x.pihak.length ? x.pihak.map((p) => `<span class="jm-pil">${esc(p)}</span>`).join(" ") : "-") },
    { label: t("nkl.c.uraian"), v: (x) => tx(x.ket), f: (x) => `<span class="rg3-teks">${esc(tx(x.ket))}</span>` },
    { label: t("nkl.c.bukti"), v: (x) => x.tingkat_bukti, f: (x) => `${buktiS(x.sumber_id, x.tingkat_bukti)}<span class="nkl-sumber">${idSumber(x).filter(Boolean).slice(0, 2).map(sumberLink).join("")}</span>` },
  ], baris });
  siapTautan("provinsi").then(() => naikkan(el));
}
function tabWilayah() {
  const el = document.getElementById("nkl-p-wil"); if (!el) return;
  const baris = bab("tapak")?.baris || [];
  tabel(el, { satuan: "nkl.u.wilayah", per: 13, urutAwal: 0, menurun: false, kolom: [
    { label: t("nkl.c.wilayah"), v: (r) => tx(r.wilayah), f: (r) => tautProvinsi(r.kode, tx(r.wilayah)) },
    { label: t("nkl.c.kode"), num: true, v: (r) => Number(r.kode), f: (r) => esc(r.kode) },
    { label: t("nkl.c.catatan"), v: (r) => tx(r.catatan), f: (r) => `<span class="rg3-teks">${esc(tx(r.catatan))}</span>` },
  ], baris });
  siapTautan("provinsi").then(() => naikkan(el));
}
export function mulai(el) {
  if (!B.nk) { el.innerHTML = kosongTab("nkl.kosong"); return; }
  const S = B.nk.tapak.sorotan, ur = [...new Set(S.map((x) => x.status))], n = (k) => S.filter((x) => !k || x.status === k).length, W = bab("tapak")?.baris || [];
  const chips = ["", ...ur].map((k, i) => `<button type="button" class="rg3-chip rg3-chipb rg3-w${i}" data-st="${esc(k)}" aria-pressed="${st === k}">${ikon(k ? "peta" : "daftar2", 14)}<span>${esc(k ? t("nkl.st." + k) : t("nkl.semua"))}</span> <i>${n(k)}</i></button>`).join("");
  el.innerHTML = [
    ex({ id: "nkl-p-sorot", ikon: "peta", topik: t("nkl.p.ey.sorot"), judulHtml: esc(t("nkl.p.j.sorot", { n: S.length })), subHtml: esc(t("nkl.p.s.sorot")), isiHtml: `<div class="rg3-chips" role="group" aria-label="${esc(t("nkl.p.f"))}">${chips}</div><div id="nkl-p-tab"></div>${catatan("nkl.p.n.sorot")}`, kakiHtml: kakiSumber(S.flatMap(idSumber)) }),
    ex({ id: "nkl-p-wilayah", ikon: "wilayah", topik: t("nkl.p.ey.wilayah"), judulHtml: esc(t("nkl.p.j.wilayah", { n: W.length })), subHtml: esc(t("nkl.p.s.wilayah")), isiHtml: `<div id="nkl-p-wil"></div>${catatan("nkl.p.n.wilayah")}`, kakiHtml: kakiTopik(bab("tapak")?.sumber) }),
    ex({ id: "nkl-p-28", ikon: "kawasan", topik: t("nkl.p.ey.m28"), judulHtml: esc(t("nkl.p.j.m28")), subHtml: esc(t("nkl.p.s.m28")), isiHtml: `${enbKartu(enbBaris("nk-tapak-28"))}<p class="jm-bantu ih-catatan">${esc(tx(B.nk.tapak.selisih))}</p>`, kakiHtml: kakiSumber(["cnbc-28tapak", "katadata-tender"]) }),
    ex({ id: "nkl-p-celah", ikon: "tanya", topik: t("nkl.ey.celah"), judulHtml: esc(t("nkl.j.celah")), isiHtml: daftarCelah(B.nk.celah.filter((c) => /\/Kriteria evaluasi tapak\//.test(c))) }),
  ].join("");
  tabSorot(); tabWilayah();
  el.querySelector(".rg3-chips").addEventListener("click", (e) => {
    const b = e.target.closest("[data-st]"); if (!b) return;
    st = b.dataset.st; for (const x of el.querySelectorAll("[data-st]")) x.setAttribute("aria-pressed", String(x.dataset.st === st));
    nanti(tabSorot);
  });
}
