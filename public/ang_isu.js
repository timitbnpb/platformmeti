/* /angin, tab Isu: isu EBT terkait dari isu.json (lewat id, rincian di /isu#id), isu khas bayu bersumber dari angin.json, dan kasus mundur atau mati dari topik/bayu.json (bab 40). */
import { B, muat, t, ex, esc, ikon, tx, bukti, buktiS, kakiSumber, kosongTab, pil, catatan, tanggal, siapTautan, naikkan } from "/ang_umum.js";

export async function mulai(el) {
  await muat(["isu", "tb", "pt"]);
  if (!B.ang) { el.innerHTML = kosongTab("ang.kosong"); return; }
  const A = B.ang, isu = A.rujukan.isu_ids.map((id) => (B.isu?.baris || []).find((x) => x.id === id)).filter(Boolean);
  const baru = (x) => `<li class="ang-isu"><div class="ang-isu-k"><b>${esc(t("ang.i.b." + x.k))}</b><span>${pil("ang.ist.", x.status)}</span></div><p>${esc(tx(x.teks))}</p><div class="ang-isu-b"><span>${ikon("kalender", 14)} ${esc(t("ang.i.dibaca"))}: ${esc(tanggal(A.tanggal))}</span>${x.sumber_ids.map((s) => buktiS(s, x.tingkat_bukti)).join("")}</div></li>`;
  const lama = (x) => `<li class="ang-isu"><div class="ang-isu-k"><b>${esc(x.judul)}</b><span>${pil("ang.ist.", x.status || "x")} ${x.tingkat ? pil("ang.itk.", x.tingkat) : ""}</span></div><p>${esc(x.ringkas)}</p><div class="ang-isu-b"><span>${ikon("kalender", 14)} ${esc(t("ang.i.terbaru"))}: ${esc(x.terbaru ? tanggal(x.terbaru) : "-")}</span>${bukti(x.bukti || "media", { sumber: "isu.json", tanggal: B.isu.tanggal_ambil || "" })}<a class="rg3-tautan" href="/isu#${esc(x.id)}">${esc(t("ang.i.rinci"))}</a></div></li>`;
  const gagal = A.rujukan.kasus_gagal.map((id) => (B.tb?.bab?.["40"]?.butir || []).find((k) => k.id === id)).filter(Boolean);
  const kasus = (k) => `<li class="ang-isu"><div class="ang-isu-k"><b>${esc(tx(k.nama))}</b><span>${pil("ang.ist.", k.jenis)}</span></div><p>${esc(tx((k.sebab || [])[0]))}</p><div class="ang-isu-b"><span>${ikon("lokasi", 14)} ${esc(tx(k.lokasi))}</span>${bukti("kajian", { sumber: "topik/bayu.json", tanggal: B.tb.diperbarui || "" })}<a class="rg3-tautan" href="/angin?tab=dasar#bab-40">${esc(t("ang.i.kasus"))}</a></div></li>`;
  el.innerHTML = [
    ex({ id: "ang-i-khas", ikon: "peringatan", topik: t("ang.i.ey.khas"), judulHtml: esc(t("ang.i.j.khas", { n: A.isu_baru.length })), subHtml: esc(t("ang.i.s.khas")), isiHtml: `<ul class="ang-isu-daftar">${A.isu_baru.map(baru).join("")}</ul>${catatan("ang.i.n.khas")}`, kakiHtml: kakiSumber(A.isu_baru.flatMap((x) => x.sumber_ids)) }),
    gagal.length ? ex({ id: "ang-i-kasus", ikon: "tanya", topik: t("ang.i.ey.kasus"), judulHtml: esc(t("ang.i.j.kasus", { n: gagal.length })), subHtml: esc(t("ang.i.s.kasus")), isiHtml: `<ul class="ang-isu-daftar">${gagal.map(kasus).join("")}</ul>` }) : "",
    isu.length ? ex({ id: "ang-i-isu", ikon: "peringatan", topik: t("ang.i.ey"), judulHtml: esc(t("ang.i.j", { n: isu.length })), subHtml: esc(t("ang.i.s")), isiHtml: `<ul class="ang-isu-daftar">${isu.map(lama).join("")}</ul>${catatan("ang.i.n")}` }) : "",
  ].join("");
  siapTautan("org").then(() => naikkan(el));
}
