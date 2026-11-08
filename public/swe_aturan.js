/* /sampah-energi, tab Perpres 109/2025 dan aturan: Perpres 109/2025, 35/2018, 18/2016 dari regulasi.json lewat id; ketentuan kunci dan baku mutu emisi bersumber di sampah_energi.json. */
import { B, t, ex, esc, ikon, tx, buktiS, kakiSumber, tabel, kosongTab, luar, pil, tautRegulasi, siapTautan, naikkan, catatan, bukti } from "/swe_umum.js";

export function mulai(el) {
  if (!B.sw || !B.reg) { el.innerHTML = kosongTab("swe.kosong"); return; }
  const baris = B.sw.rujukan.regulasi_ids.map((id) => B.reg.baris.find((r) => r.id === id)).filter(Boolean);
  const butir = (x) => `<li>${ikon("palu", 18)}<div><p><b>${esc(t("swe.a.k." + x.k))}</b></p><p>${esc(tx(x.teks))}</p>${buktiS(x.sumber_id, x.tingkat_bukti)}${x.sumber_id2 ? buktiS(x.sumber_id2) : ""}</div></li>`;
  el.innerHTML = [
    ex({ id: "swe-a-reg", ikon: "palu", topik: t("swe.a.ey.reg"), judulHtml: esc(t("swe.a.j.reg", { n: baris.length })), subHtml: esc(t("swe.a.s.reg")), isiHtml: `<div id="swe-a-tab"></div>${catatan("swe.a.n.reg")}<p class="jm-bantu"><a href="/regulasi">${esc(t("swe.a.semua"))}</a></p>`, kakiHtml: kakiSumber(["metro109", "uu18"]) }),
    ex({ id: "swe-a-kunci", ikon: "buku", topik: t("swe.a.ey.kunci"), judulHtml: esc(t("swe.a.j.kunci")), subHtml: esc(t("swe.a.s.kunci")), isiHtml: `<ul class="swe-daftar">${B.sw.aturan.butir.map(butir).join("")}</ul>`, kakiHtml: kakiSumber(B.sw.aturan.butir.flatMap((x) => [x.sumber_id, x.sumber_id2])) }),
    ex({ id: "swe-a-lama", ikon: "linimasa", topik: t("swe.a.ey.lama"), judulHtml: esc(t("swe.a.j.lama")), subHtml: esc(t("swe.a.s.lama")), isiHtml: `<ul class="swe-daftar"><li>${ikon("info", 18)}<div><p>${esc(tx(B.sw.aturan.tarif_35))}</p>${buktiS("ombud", "media")}</div></li></ul>`, kakiHtml: kakiSumber(["ombud", "katmang", "wekdm"]) }),
  ].join("");
  tabel(el.querySelector("#swe-a-tab"), { satuan: "swe.u.reg", per: 8, urutAwal: 2, menurun: true, kolom: [
    { label: t("swe.c.peraturan"), v: (r) => `${r.jenis} ${r.nomor}/${r.tahun}`, f: (r) => `<span class="rg3-idk"><b>${tautRegulasi(r.id, `Perpres ${r.nomor}/${r.tahun}`)}</b><small>${esc(r.instansi_penerbit || "")}</small></span>` },
    { label: t("swe.c.tentang"), v: (r) => r.judul, f: (r) => `<span class="rg3-teks">${esc(r.judul)}</span>` },
    { label: t("swe.c.tahun"), num: true, v: (r) => r.tahun, f: (r) => esc(String(r.tahun)) },
    { label: t("swe.c.status"), v: (r) => r.status, f: (r) => pil("swe.rst.", r.status) },
    { label: t("swe.c.sumber"), v: () => "", f: (r) => (r.url_sumber ? luar(r.url_sumber, t("swe.a.buka")) : "-") },
    { label: t("swe.c.bukti"), v: () => "", f: (r) => bukti("resmi", { sumber: r.instansi_penerbit || "JDIH", tanggal: r.tanggal_ambil || "" }) },
  ], baris });
  siapTautan("regulasi").then(() => naikkan(el));
}
