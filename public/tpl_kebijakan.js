/* /transisi-pltu, tab Kebijakan: Perpres 112/2022 Pasal 3, aturan DMO (pasar_listrik.json), regulasi bertaut (regulasi.json, unduhan PDF), RUPTL (ruptl.json: hanya EBT). */
import { B, t, ex, num, esc, ikon, tx, bukti, buktiS, kakiSumber, tabel, kosongTab, catatan, daftarCelah, tautRegulasi, siapTautan, naikkan, reg, luar } from "/tpl_umum.js";
import { unduhRegHtml } from "/inti/komponen.js";

function dmo() {
  const el = document.getElementById("tpl-b-dmo"); if (!el) return;
  tabel(el, { satuan: "tpl.u.baris", per: 5, urutAwal: 0, menurun: true, kolom: [
    { label: t("tpl.kb.berlaku"), v: (r) => r.berlaku, f: (r) => esc(r.berlaku) },
    { label: t("tpl.kb.keputusan"), v: (r) => r.keputusan, f: (r) => `<span class="rg3-teks">${esc(r.keputusan)}</span>` },
    { label: t("tpl.kb.harga"), num: true, v: (r) => r.harga_usd_ton, f: (r) => `<b>${esc(num(r.harga_usd_ton, 0))}</b> <small class="rg3-catat">USD/t</small>` },
    { label: t("tpl.kb.persen"), num: true, v: (r) => r.persen_dmo ?? -1, f: (r) => (r.persen_dmo != null ? `${esc(String(r.persen_dmo))}%` : "-") },
    { label: t("tpl.c.bukti"), v: (r) => r.tingkat_bukti, f: (r) => bukti(r.tingkat_bukti, { sumber: "ESDM / media", tanggal: r.tanggal }) },
  ], baris: B.pasar.dmo.aturan });
}
export function mulai(el) {
  if (!B.tp) { el.innerHTML = kosongTab("tpl.kosong"); return; }
  const K = B.tp.kebijakan, ru = B.ruptl;
  const rg = K.regulasi_ids.map(reg).filter(Boolean);
  el.innerHTML = [
    ex({ id: "tpl-b-p3", ikon: "regulasi", topik: t("tpl.kb.ey.p3"), judulHtml: esc(t("tpl.kb.j.p3")), subHtml: esc(t("tpl.kb.s.p3")),
      isiHtml: `<ul class="tpl-daftar">${K.pasal3.map((p) => `<li>${ikon("regulasi", 18)}<div><b>${esc(t("tpl.kb.p3." + p.k))}</b><p>${esc(tx(p.teks))}</p></div></li>`).join("")}</ul><p class="jm-bantu">${tautRegulasi("perpres-112-2022", "Perpres 112/2022")} ${buktiS(K.sumber_id, K.tingkat_bukti)}</p>${catatan("tpl.kb.n.p3")}`, kakiHtml: kakiSumber([K.sumber_id]) }),
    B.pasar ? ex({ id: "tpl-b-dmoex", ikon: "tag", topik: t("tpl.kb.ey.dmo"), judulHtml: esc(t("tpl.kb.j.dmo", { n: B.pasar.dmo.harga_usd_ton, th: B.pasar.dmo.tidak_berubah_sejak })), subHtml: esc(t("tpl.kb.s.dmo")), isiHtml: `<div id="tpl-b-dmo"></div>` }) : "",
    ex({ id: "tpl-b-reg", ikon: "palu", topik: t("tpl.kb.ey.reg"), judulHtml: esc(t("tpl.kb.j.reg", { n: rg.length })), subHtml: esc(t("tpl.kb.s.reg")),
      isiHtml: `<ul class="tpl-daftar">${rg.map((r) => `<li>${ikon("regulasi", 18)}<div>${tautRegulasi(r.id, r.judul)}<p class="jm-bantu">${esc(r.ringkasan || "")}</p></div>${unduhRegHtml(r)}</li>`).join("")}</ul>` }),
    ru ? ex({ id: "tpl-b-ruptl", ikon: "bendera", topik: t("tpl.kb.ey.ruptl"), judulHtml: esc(t("tpl.kb.j.ruptl", { p: ru.meta.periode })), subHtml: esc(t("tpl.kb.s.ruptl", { n: ru.meta.jumlah })),
      isiHtml: `<p>${esc(t("tpl.kb.ruptl", { mw: num((ru.ringkasan.mw_per_status.rencana || 0) + (ru.ringkasan.mw_per_status.konstruksi || 0), 0) }))} <a class="rg3-tautan" href="/ruptl">${esc(t("tpl.kb.lihat_ruptl"))}</a></p>${daftarCelah([ru.meta.celah.at(-1)])}` }) : "",
  ].join("");
  dmo();
  siapTautan("regulasi").then(() => naikkan(el));
}
