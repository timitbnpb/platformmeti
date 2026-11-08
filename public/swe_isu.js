/* /sampah-energi, tab Isu penolakan warga: butir penolakan bersumber (sampah_energi.json) dan isu PSEL dari isu.json lewat id (rincian di /isu#id). Klaim pihak diberi label sebagai klaim. */
import { B, t, ex, esc, ikon, tx, buktiS, kakiSumber, kosongTab, pil, catatan, tanggal, bukti, daftarCelah } from "/swe_umum.js";

export function mulai(el) {
  if (!B.sw) { el.innerHTML = kosongTab("swe.kosong"); return; }
  const tolak = B.sw.penolakan.butir, isu = B.sw.rujukan.isu_ids.map((id) => (B.isu?.baris || []).find((x) => x.id === id)).filter(Boolean);
  const k1 = (x) => `<li class="swe-isu"><div class="swe-isu-k"><b>${esc(t("swe.i.k." + x.k))}</b><span>${pil("swe.ist.", x.status)}</span></div><p><em>${esc(t("swe.i.pihak"))}</em>: ${esc(tx(x.pihak))}</p><p><em>${esc(t("swe.i.klaim"))}</em>: ${esc(tx(x.klaim))}</p><div class="swe-isu-b"><span>${ikon("lokasi", 14)} ${esc(x.lokasi)}</span><span>${ikon("kalender", 14)} ${esc(tanggal(x.tanggal))}</span>${buktiS(x.sumber_id, x.tingkat_bukti)}${x.sumber_id2 ? buktiS(x.sumber_id2) : ""}</div></li>`;
  const k2 = (x) => `<li class="swe-isu"><div class="swe-isu-k"><b>${esc(x.judul)}</b><span>${pil("swe.ist.", x.status || "x")} ${x.tingkat ? pil("swe.itk.", x.tingkat) : ""}</span></div><p>${esc(x.ringkas)}</p><div class="swe-isu-b"><span>${ikon("kalender", 14)} ${esc(t("swe.i.terbaru"))}: ${esc(x.terbaru ? tanggal(x.terbaru) : "-")}</span>${bukti(x.bukti || "media", { sumber: "isu.json", tanggal: B.isu?.tanggal_ambil || "" })}<a class="rg3-tautan" href="/isu#${esc(x.id)}">${esc(t("swe.i.rinci"))}</a></div></li>`;
  el.innerHTML = [
    ex({ id: "swe-i-tolak", ikon: "peringatan", topik: t("swe.i.ey.tolak"), judulHtml: esc(t("swe.i.j.tolak", { n: tolak.length })), subHtml: esc(t("swe.i.s.tolak")), isiHtml: `<ul class="swe-isu-daftar">${tolak.map(k1).join("")}</ul>${catatan("swe.i.n.tolak")}`, kakiHtml: kakiSumber(tolak.flatMap((x) => [x.sumber_id, x.sumber_id2])) }),
    ex({ id: "swe-i-isu", ikon: "peringatan", topik: t("swe.i.ey.isu"), judulHtml: esc(t("swe.i.j.isu", { n: isu.length })), subHtml: esc(t("swe.i.s.isu")), isiHtml: isu.length ? `<ul class="swe-isu-daftar">${isu.map(k2).join("")}</ul>${catatan("swe.i.n.isu")}` : "" }),
    ex({ id: "swe-i-celah", ikon: "tanya", topik: t("swe.ey.celah"), judulHtml: esc(t("swe.j.celah")), isiHtml: daftarCelah([B.sw.celah[8]]) }),
  ].join("");
}
