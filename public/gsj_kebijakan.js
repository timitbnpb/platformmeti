/* /gas, tab Kebijakan: HGBT (Perpres 121/2020, Kepmen 91.K, 76.K, 77.K), RUPTL 2025-2034, alokasi gas, operator Cisem II; ditambah peraturan umum dari regulasi.json lewat id. */
import { B, t, ex, esc, tx, tabel, kosongTab, luar, pil, tautRegulasi, siapTautan, naikkan, catatan, kakiSumber, bukti, buktiS, src } from "/gsj_umum.js";

export function mulai(el) {
  if (!B.gs) { el.innerHTML = kosongTab("gsj.kosong"); return; }
  const K = B.gs.kebijakan, reg = K.regulasi_ids.map((id) => (B.reg?.baris || []).find((r) => r.id === id)).filter(Boolean);
  el.innerHTML = [
    ex({ id: "gsj-k-baru", ikon: "palu", topik: t("gsj.k.ey.baru"), judulHtml: esc(t("gsj.k.j.baru", { n: K.baru.length })), subHtml: esc(t("gsj.k.s.baru")), isiHtml: `<div id="gsj-k-tab-baru"></div>${catatan("gsj.k.n.baru")}`, kakiHtml: kakiSumber(K.baru.map((x) => x.sumber_id)) }),
    ex({ id: "gsj-k-reg", ikon: "regulasi", topik: t("gsj.k.ey.reg"), judulHtml: esc(t("gsj.k.j.reg", { n: reg.length })), subHtml: esc(t("gsj.k.s.reg")), isiHtml: `<div id="gsj-k-tab-reg"></div>${catatan("gsj.k.n.reg")}<p class="jm-bantu"><a href="/regulasi">${esc(t("gsj.k.semua"))}</a></p>` }),
  ].join("");
  tabel(el.querySelector("#gsj-k-tab-baru"), { satuan: "gsj.u.reg", per: 8, urutAwal: 2, menurun: true, kolom: [
    { label: t("gsj.c.peraturan"), v: (r) => r.nomor, f: (r) => `<b>${esc(r.nomor)}</b>` },
    { label: t("gsj.c.tentang"), v: (r) => tx(r.teks), f: (r) => `<span class="rg3-teks">${esc(tx(r.teks))}</span>` },
    { label: t("gsj.c.tahun"), num: true, v: (r) => r.tahun, f: (r) => esc(String(r.tahun)) },
    { label: t("gsj.c.sumber"), v: () => "", f: (r) => luar(src(r.sumber_id)?.url, t("gsj.k.buka")) },
    { label: t("gsj.c.bukti"), v: (r) => r.tingkat_bukti, f: (r) => buktiS(r.sumber_id, r.tingkat_bukti) },
  ], baris: K.baru });
  tabel(el.querySelector("#gsj-k-tab-reg"), { satuan: "gsj.u.reg", per: 8, urutAwal: 2, menurun: true, kolom: [
    { label: t("gsj.c.peraturan"), v: (r) => `${r.jenis} ${r.nomor}/${r.tahun}`, f: (r) => `<span class="rg3-idk"><b>${tautRegulasi(r.id, `${String(r.jenis).toUpperCase()} ${r.nomor}/${r.tahun}`)}</b><small>${esc(r.instansi_penerbit || "")}</small></span>` },
    { label: t("gsj.c.tentang"), v: (r) => r.judul, f: (r) => `<span class="rg3-teks">${esc(r.judul)}</span>` },
    { label: t("gsj.c.tahun"), num: true, v: (r) => r.tahun, f: (r) => esc(String(r.tahun)) },
    { label: t("gsj.c.status"), v: (r) => r.status, f: (r) => pil("gsj.rst.", r.status) },
    { label: t("gsj.c.sumber"), v: () => "", f: (r) => (r.url_sumber ? luar(r.url_sumber, t("gsj.k.buka")) : "-") },
    { label: t("gsj.c.bukti"), v: () => "", f: (r) => bukti("resmi", { sumber: r.instansi_penerbit || "JDIH", tanggal: r.tanggal_ambil || "" }) },
  ], baris: reg });
  siapTautan("regulasi").then(() => naikkan(el));
}
