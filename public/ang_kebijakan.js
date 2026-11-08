/* /angin, tab Kebijakan: UU 30/2009, PP 40/2025, RUEN, Perpres 112/2022, Permen ESDM; dibaca dari regulasi.json lewat id, ditambah poin kebijakan bersumber. */
import { nanti } from "/inti/umum.js";
import { B, muat, t, ex, esc, ikon, tx, buktiS, kakiSumber, tabel, kosongTab, luar, pil, tautRegulasi, siapTautan, naikkan, catatan, bukti } from "/ang_umum.js";

function tabReg() {
  const el = document.getElementById("ang-k-tab"); if (!el) return;
  const baris = B.ang.rujukan.regulasi_ids.map((id) => B.reg.baris.find((r) => r.id === id)).filter(Boolean);
  tabel(el, { satuan: "ang.u.reg", per: 8, urutAwal: 2, menurun: true, kolom: [
    { label: t("ang.c.peraturan"), v: (r) => `${r.jenis} ${r.nomor}/${r.tahun}`, f: (r) => `<span class="rg3-idk"><b>${tautRegulasi(r.id, `${String(r.jenis).toUpperCase()} ${r.nomor}/${r.tahun}`)}</b><small>${esc(r.instansi_penerbit || "")}</small></span>` },
    { label: t("ang.c.tentang"), v: (r) => r.judul, f: (r) => `<span class="rg3-teks">${esc(r.judul)}</span>` },
    { label: t("ang.c.tahun"), num: true, v: (r) => r.tahun, f: (r) => esc(String(r.tahun)) },
    { label: t("ang.c.status"), v: (r) => r.status, f: (r) => pil("ang.rst.", r.status) },
    { label: t("ang.c.sumber"), v: () => "", f: (r) => (r.url_sumber ? luar(r.url_sumber, t("ang.k.buka")) : "-") },
    { label: t("ang.c.bukti"), v: () => "", f: (r) => bukti("resmi", { sumber: r.instansi_penerbit || "JDIH", tanggal: r.tanggal_ambil || "" }) },
  ], baris });
}
export async function mulai(el) {
  await muat(["reg"]);
  if (!B.ang || !B.reg) { el.innerHTML = kosongTab("ang.kosong"); return; }
  const A = B.ang, n = A.rujukan.regulasi_ids.length, kartu = (x) => `<div class="rg3-kartu"><div class="rg3-k-kep">${ikon("palu", 22)}<b>${esc(t("ang.k.p." + x.k))}</b></div><p class="jm-bantu">${esc(tx(x.teks))}</p>${buktiS(x.sumber_id, x.tingkat_bukti)}</div>`;
  el.innerHTML = [
    ex({ id: "ang-k-poin", ikon: "bendera", topik: t("ang.k.ey.poin"), judulHtml: esc(t("ang.k.j.poin")), subHtml: esc(t("ang.k.s.poin")), isiHtml: `<div class="rg3-kisi">${A.kebijakan.poin.map(kartu).join("")}</div>${catatan("ang.k.n.poin")}`, kakiHtml: kakiSumber(["ruptl-faq", "chambers-2026", "etp-izin", "konsul"]) }),
    ex({ id: "ang-k-reg", ikon: "palu", topik: t("ang.k.ey"), judulHtml: esc(t("ang.k.j", { n })), subHtml: esc(t("ang.k.s")), isiHtml: `<div id="ang-k-tab"></div>${catatan("ang.k.n")}<p class="jm-bantu"><a class="rg3-tautan" href="/regulasi">${esc(t("ang.k.semua"))}</a> <a class="rg3-tautan" href="/angin?tab=biaya" data-pindah="biaya">${esc(t("ang.k.ke_patokan"))}</a></p>`, kakiHtml: kakiSumber(["ruen", "p112", "perm30", "jm_izin"]) }),
  ].join("");
  nanti(tabReg);
  siapTautan("regulasi").then(() => naikkan(el));
}
