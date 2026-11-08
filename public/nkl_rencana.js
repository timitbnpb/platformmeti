/* /nuklir, tab Rencana dan target: versi angka target (RUPTL, PLN, DEN), grafik kapasitas ESDM, tabel sasaran (topik nuklir bab 30), butir energi baru nk-ruptl-pltn, kendala dan jadwal. */
import { B, t, ex, num, esc, ikon, tx, kartu, butir, kakiSumber, kakiTopik, tabel, kolomSvg, tipHtml, kosongTab, catatan, bab, enbBaris, enbKartu, tautProyek, siapTautan, naikkan } from "/nkl_umum.js";

function grafik() {
  const el = document.getElementById("nkl-r-g"); if (!el) return;
  const g = bab("target_grafik"), titik = g?.seri?.[0]?.titik || [];
  if (!titik.length) { el.innerHTML = kosongTab("nkl.kosong"); return; }
  el.innerHTML = kolomSvg({ el, satuan: "GW", label: t("nkl.r.j.g"), seri: [{ k: "gw", kelas: "nkl-s-nuklir" }],
    kategori: titik.map(([th, v]) => ({ label: String(th), nilai: { gw: v }, tip: String(th), th: tipHtml(String(th), [[t("nkl.r.kap"), `${num(v, v < 1 ? 2 : 0)} GW`]]) })) });
}
function tabelTarget() {
  const el = document.getElementById("nkl-r-tab"); if (!el) return;
  const baris = bab("target_tabel")?.baris || [];
  tabel(el, { satuan: "nkl.u.sasaran", per: 8, urutAwal: 0, menurun: false, kolom: [
    { label: t("nkl.c.sasaran"), v: (r) => tx(r.item), f: (r) => `<span class="rg3-teks">${esc(tx(r.item))}</span>` },
    { label: t("nkl.c.nilai"), v: (r) => tx(r.nilai), f: (r) => `<b>${esc(tx(r.nilai))}</b>` },
    { label: t("nkl.c.tahun"), v: (r) => tx(r.tahun), f: (r) => esc(tx(r.tahun)) },
    { label: t("nkl.c.sumber"), v: (r) => tx(r.sumber), f: (r) => esc(tx(r.sumber)) },
  ], baris });
}
export function mulai(el) {
  if (!B.nk) { el.innerHTML = kosongTab("nkl.kosong"); return; }
  const R = B.nk.rencana, pj = (B.pt?.baris || []).find((x) => x.id === B.nk.rujukan.proyek_ids[0]);
  const kartuAngka = R.angka.map((a) => kartu(a.k === "ruptl" ? "nuklir" : a.k === "pln7" ? "petir" : "sasaran", t("nkl.r.a." + a.k, { th: a.tahun }), num(a.nilai, 0), a.satuan, tx(a.ket), a.sumber_id, a.tingkat_bukti)).join("");
  el.innerHTML = [
    ex({ id: "nkl-r-angka", ikon: "sasaran", topik: t("nkl.r.ey.angka"), judulHtml: esc(t("nkl.r.j.angka")), subHtml: esc(t("nkl.r.s.angka")), isiHtml: `<div class="rg3-kisi">${kartuAngka}</div><p class="jm-bantu ih-catatan">${esc(tx(R.catatan_beda))}</p>`, kakiHtml: kakiSumber(R.angka.map((a) => a.sumber_id)) }),
    ex({ id: "nkl-r-grafik", ikon: "grafik", topik: t("nkl.r.ey.g"), judulHtml: esc(t("nkl.r.j.g")), subHtml: esc(t("nkl.r.s.g")), isiHtml: `<div id="nkl-r-g" class="ih-bagan"></div>${catatan("nkl.r.n.g")}`, kakiHtml: kakiTopik(bab("target_grafik")?.sumber) }),
    ex({ id: "nkl-r-sasaran", ikon: "tabel", topik: t("nkl.r.ey.tab"), judulHtml: esc(t("nkl.r.j.tab")), subHtml: esc(t("nkl.r.s.tab")), isiHtml: `<div id="nkl-r-tab"></div>${catatan("nkl.r.n.tab")}`, kakiHtml: kakiTopik(bab("target_tabel")?.sumber) }),
    ex({ id: "nkl-r-ruptl", ikon: "proyek", topik: t("nkl.r.ey.ruptl"), judulHtml: esc(t("nkl.r.j.ruptl")), subHtml: esc(t("nkl.r.s.ruptl")),
      isiHtml: `${enbKartu(enbBaris("nk-ruptl-pltn"))}${pj ? `<p class="jm-bantu">${esc(t("nkl.r.proyek"))}: ${tautProyek(pj.id, pj.nama)}. <a class="rg3-tautan" href="/program/${esc(B.nk.rujukan.program_kode)}">${esc(t("nkl.r.program"))}</a></p>` : ""}`, kakiHtml: kakiSumber(["ruptlp", "kontan-ruptl", "detik-7gw"]) }),
    ex({ id: "nkl-r-kendala", ikon: "peringatan", topik: t("nkl.r.ey.kendala"), judulHtml: esc(t("nkl.r.j.kendala")), subHtml: esc(t("nkl.r.s.kendala")), isiHtml: butir(R.butir, "info"), kakiHtml: kakiSumber(R.butir.map((x) => x.sumber_id)) }),
  ].join("");
  grafik(); tabelTarget();
  siapTautan("proyek").then(() => naikkan(el));
}
