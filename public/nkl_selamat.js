/* /nuklir, tab Keselamatan dan limbah: kerangka hukum keselamatan dan kewajiban internasional dari regulasi.json lewat id, butir keselamatan, pengelolaan limbah radioaktif dan bahan bakar bekas, tautan isu. */
import { B, t, ex, esc, tx, butir, kakiSumber, tabel, kosongTab, luar, pil, catatan, daftarCelah, bukti, regBaris, tautRegulasi, siapTautan, naikkan } from "/nkl_umum.js";

function tabReg() {
  const el = document.getElementById("nkl-k-reg"); if (!el) return;
  tabel(el, { satuan: "nkl.u.reg", per: 8, urutAwal: 2, menurun: true, kolom: [
    { label: t("nkl.c.peraturan"), v: (r) => `${r.jenis} ${r.nomor}/${r.tahun}`, f: (r) => `<span class="rg3-idk"><b>${tautRegulasi(r.id, `${String(r.jenis).toUpperCase()} ${r.nomor}/${r.tahun}`)}</b><small>${esc(r.instansi_penerbit || "")}</small></span>` },
    { label: t("nkl.c.tentang"), v: (r) => r.judul, f: (r) => `<span class="rg3-teks">${esc(r.judul)}</span>` },
    { label: t("nkl.c.tahun"), num: true, v: (r) => r.tahun, f: (r) => esc(String(r.tahun)) },
    { label: t("nkl.c.status"), v: (r) => r.status, f: (r) => pil("nkl.rst.", r.status) },
    { label: t("nkl.c.sumber"), v: () => "", f: (r) => (r.url_sumber ? luar(r.url_sumber, t("nkl.buka")) : "-") },
    { label: t("nkl.c.bukti"), v: () => "", f: (r) => bukti("resmi", { sumber: r.instansi_penerbit || "JDIH", tanggal: r.tanggal_ambil || "" }) },
  ], baris: regBaris(B.nk.rujukan.regulasi_selamat) });
}
export function mulai(el) {
  if (!B.nk) { el.innerHTML = kosongTab("nkl.kosong"); return; }
  const S = B.nk.selamat, n = regBaris(B.nk.rujukan.regulasi_selamat).length;
  el.innerHTML = [
    ex({ id: "nkl-k-aman", ikon: "perisai", topik: t("nkl.k.ey.aman"), judulHtml: esc(t("nkl.k.j.aman")), subHtml: esc(t("nkl.k.s.aman")), isiHtml: butir(S.keselamatan, "perisai"), kakiHtml: kakiSumber(S.keselamatan.map((x) => x.sumber_id)) }),
    ex({ id: "nkl-k-reg", ikon: "palu", topik: t("nkl.k.ey.reg"), judulHtml: esc(t("nkl.k.j.reg", { n })), subHtml: esc(t("nkl.k.s.reg")), isiHtml: `<div id="nkl-k-reg"></div>${catatan("nkl.k.n.reg")}`, kakiHtml: kakiSumber(["pp54", "pp46", "pbp", "uu8"]) }),
    ex({ id: "nkl-k-limbah", ikon: "daur", topik: t("nkl.k.ey.limbah"), judulHtml: esc(t("nkl.k.j.limbah")), subHtml: esc(t("nkl.k.s.limbah")), isiHtml: butir(S.limbah, "daur") + catatan("nkl.k.n.limbah"), kakiHtml: kakiSumber(S.limbah.map((x) => x.sumber_id)) }),
    ex({ id: "nkl-k-isu", ikon: "peringatan", topik: t("nkl.k.ey.isu"), judulHtml: esc(t("nkl.k.j.isu")), subHtml: esc(t("nkl.k.s.isu")), isiHtml: `<p><a class="rg3-tautan" href="/isu#${esc(B.nk.rujukan.isu_ids[0])}">${esc(t("nkl.k.isu_taut"))}</a></p><p><a class="rg3-tautan" href="/nuklir?tab=opini">${esc(t("nkl.k.opini_taut"))}</a></p>${daftarCelah(B.nk.celah.filter((c) => /limbah/.test(c)))}`, kakiHtml: kakiSumber(["mongabay_gelasa"]) }),
  ].join("");
  tabReg();
  siapTautan("regulasi").then(() => naikkan(el));
}
