/* /panas-bumi, tab Kebijakan: UU 21/2014, PP 7/2017, PP 28/2016, Perpres 112/2022, Permen ESDM, Permen LHK; dibaca dari regulasi.json lewat id. */
import { B, t, ex, esc, tabel, kosongTab, luar, pil, tautRegulasi, siapTautan, naikkan, catatan, kakiSumber, bukti } from "/pbm_umum.js";

export function mulai(el) {
  if (!B.pb || !B.reg) { el.innerHTML = kosongTab("pbm.kosong"); return; }
  const baris = B.pb.rujukan.regulasi_ids.map((id) => B.reg.baris.find((r) => r.id === id)).filter(Boolean);
  el.innerHTML = ex({ id: "pbm-k-reg", ikon: "palu", topik: t("pbm.k.ey"), judulHtml: esc(t("pbm.k.j", { n: baris.length })), subHtml: esc(t("pbm.k.s")), isiHtml: `<div id="pbm-k-tab"></div>${catatan("pbm.k.n")}<p class="jm-bantu"><a href="/regulasi">${esc(t("pbm.k.semua"))}</a></p>`, kakiHtml: kakiSumber(["uu21", "pp7", "perpres112", "pp49"]) });
  tabel(el.querySelector("#pbm-k-tab"), { satuan: "pbm.u.reg", per: 8, urutAwal: 2, menurun: true, kolom: [
    { label: t("pbm.c.peraturan"), v: (r) => `${r.jenis} ${r.nomor}/${r.tahun}`, f: (r) => `<span class="rg3-idk"><b>${tautRegulasi(r.id, `${String(r.jenis).toUpperCase()} ${r.nomor}/${r.tahun}`)}</b><small>${esc(r.instansi_penerbit || "")}</small></span>` },
    { label: t("pbm.c.tentang"), v: (r) => r.judul, f: (r) => `<span class="rg3-teks">${esc(r.judul)}</span>` },
    { label: t("pbm.c.tahun"), num: true, v: (r) => r.tahun, f: (r) => esc(String(r.tahun)) },
    { label: t("pbm.c.status"), v: (r) => r.status, f: (r) => pil("pbm.rst.", r.status) },
    { label: t("pbm.c.sumber"), v: () => "", f: (r) => (r.url_sumber ? luar(r.url_sumber, t("pbm.k.buka")) : "-") },
    { label: t("pbm.c.bukti"), v: () => "", f: (r) => bukti("resmi", { sumber: r.instansi_penerbit || "JDIH", tanggal: r.tanggal_ambil || "" }) },
  ], baris });
  siapTautan("regulasi").then(() => naikkan(el));
}
