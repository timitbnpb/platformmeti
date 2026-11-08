/* /panas-bumi, tab Isu sosial-lingkungan: Poco Leok, Dieng, Gunung Talang, Wae Sano, Sorik Marapi dan lain-lain; dibaca dari isu.json lewat id, rincian di /isu#id. Klaim pihak tetap berlabel di /isu. */
import { B, t, ex, esc, ikon, bukti, kosongTab, pil, catatan, tanggal } from "/pbm_umum.js";

export function mulai(el) {
  if (!B.pb || !B.isu) { el.innerHTML = kosongTab("pbm.kosong"); return; }
  const isu = B.pb.rujukan.isu_ids.map((id) => B.isu.baris.find((x) => x.id === id)).filter(Boolean);
  const kartu = (x) => `<li class="pbm-isu"><div class="pbm-isu-k"><b>${esc(x.judul)}</b><span>${pil("pbm.ist.", x.status || "x")} ${x.tingkat ? pil("pbm.itk.", x.tingkat) : ""}</span></div><p>${esc(x.ringkas)}</p><div class="pbm-isu-b"><span>${ikon("kalender", 14)} ${esc(t("pbm.i.terbaru"))}: ${esc(x.terbaru ? tanggal(x.terbaru) : "-")}</span>${bukti(x.bukti || "media", { sumber: "isu.json", tanggal: B.isu.tanggal_ambil || "" })}<a class="rg3-tautan" href="/isu#${esc(x.id)}">${esc(t("pbm.i.rinci"))}</a></div></li>`;
  el.innerHTML = ex({ id: "pbm-i-isu", ikon: "peringatan", topik: t("pbm.i.ey"), judulHtml: esc(t("pbm.i.j", { n: isu.length })), subHtml: esc(t("pbm.i.s")), isiHtml: `<ul class="pbm-isu-daftar">${isu.map(kartu).join("")}</ul>${catatan("pbm.i.n")}` });
}
