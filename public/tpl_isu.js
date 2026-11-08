/* /transisi-pltu, tab Isu: isu terkait di isu.json (dirujuk lewat id di transisi_pltu.json#isu_ids); rincian dan linimasa di /isu#<id>. */
import { B, t, ex, esc, ikon, tx, bukti, kosongTab, catatan, pilJenis, tanggal, luar } from "/tpl_umum.js";

export function mulai(el) {
  if (!B.tp || !B.isu) { el.innerHTML = kosongTab("tpl.kosong"); return; }
  const I = B.tp.isu_ids.map((id) => B.isu.baris.find((b) => b.id === id)).filter(Boolean);
  el.innerHTML = ex({ id: "tpl-i-isu", ikon: "peringatan", topik: t("tpl.is.ey"), judulHtml: esc(t("tpl.is.j", { n: I.length })), subHtml: esc(t("tpl.is.s")),
    isiHtml: `<div class="tpl-kisi">${I.map((i) => `<div class="rg3-kartu"><div class="rg3-k-kep">${ikon("peringatan", 22)}<b>${esc(i.judul)}</b></div><p class="tpl-baris">${pilJenis("tpl.is.st.", i.status)} ${pilJenis("tpl.is.tingkat.", i.tingkat)}</p><p>${esc(i.ringkas)}</p><p class="jm-bantu">${esc(t("tpl.is.terbaru", { tgl: i.terbaru || "-" }))}</p>${bukti(i.bukti, { sumber: "isu.json", tanggal: i.terbaru })} <a class="rg3-tautan" href="/isu#${esc(i.id)}">${esc(t("tpl.is.buka"))}</a></div>`).join("")}</div>${catatan("tpl.is.n")}` });
}
