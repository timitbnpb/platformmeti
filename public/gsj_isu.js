/* /gas, tab Isu: isu gas bersumber (keterkungkungan, defisit, Jawa-1, HGBT, mini-LNG) dari gas.json, ditambah isu.json lewat id (take-or-pay, subsidi, JETP, pajak karbon); rincian di /isu#id. */
import { B, t, ex, esc, ikon, tx, buktiS, bukti, kosongTab, pil, catatan, tanggal, kakiSumber } from "/gsj_umum.js";

export function mulai(el) {
  if (!B.gs) { el.innerHTML = kosongTab("gsj.kosong"); return; }
  const baru = B.gs.isu.baru, lama = B.gs.isu.isu_ids.map((id) => (B.isu?.baris || []).find((x) => x.id === id)).filter(Boolean);
  const kartuBaru = (x) => `<li class="gsj-isu"><div class="gsj-isu-k"><b>${esc(tx(x.judul))}</b><span>${pil("gsj.ist.", x.status)} ${pil("gsj.itk.", x.tingkat)}</span></div><p>${esc(tx(x.ringkas))}</p><div class="gsj-isu-b">${buktiS(x.sumber_id, x.tingkat_bukti)}</div></li>`;
  const kartuLama = (x) => `<li class="gsj-isu"><div class="gsj-isu-k"><b>${esc(x.judul)}</b><span>${pil("gsj.ist.", x.status || "x")} ${x.tingkat ? pil("gsj.itk.", x.tingkat) : ""}</span></div><p>${esc(x.ringkas)}</p><div class="gsj-isu-b"><span>${ikon("kalender", 14)} ${esc(t("gsj.i.terbaru"))}: ${esc(x.terbaru ? tanggal(x.terbaru) : "-")}</span>${bukti(x.bukti || "media", { sumber: "isu.json", tanggal: B.isu?.tanggal_ambil || "" })}<a class="rg3-tautan" href="/isu#${esc(x.id)}">${esc(t("gsj.i.rinci"))}</a></div></li>`;
  el.innerHTML = [
    ex({ id: "gsj-i-gas", ikon: "peringatan", topik: t("gsj.i.ey"), judulHtml: esc(t("gsj.i.j", { n: baru.length })), subHtml: esc(t("gsj.i.s")), isiHtml: `<ul class="gsj-isu-daftar">${baru.map(kartuBaru).join("")}</ul>${catatan("gsj.i.n")}`, kakiHtml: kakiSumber(baru.flatMap((x) => [x.sumber_id, x.sumber_id2])) }),
    ex({ id: "gsj-i-isu", ikon: "peringatan", topik: t("gsj.i.ey2"), judulHtml: esc(t("gsj.i.j2", { n: lama.length })), subHtml: esc(t("gsj.i.s2")), isiHtml: `<ul class="gsj-isu-daftar">${lama.map(kartuLama).join("")}</ul>` }),
  ].join("");
}
