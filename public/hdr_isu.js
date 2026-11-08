/* /hidro, tab Isu sosial-lingkungan: Batang Toru, Kayan, Mentarang, Jatigede, Upper Cisokan, PLTMH desa yang mati. Sumber: isu.json (id), kasus topik hidro (bab 40), dan butir baru bersumber. Klaim pihak tetap berlabel; hak jawab terbuka. */
import { B, t, ex, esc, ikon, tx, bukti, buktiS, kakiSumber, kosongTab, pil, catatan, tanggal, orgLogoSel, proyekById, siapTautan, naikkan } from "/hdr_umum.js";

const isuJson = () => B.hd.rujukan.isu_ids.map((id) => (B.isu?.baris || []).find((x) => x.id === id)).filter(Boolean);
const kasus = () => B.hd.rujukan.kasus_topik_ids.map((id) => (B.tp?.bab?.["40"]?.butir || []).find((x) => x.id === id)).filter(Boolean);
const kartuIsu = (x) => `<li class="hdr-isu"><div class="hdr-isu-k"><b>${esc(x.judul)}</b><span>${pil("hdr.ist.", x.status || "x")} ${x.tingkat ? pil("hdr.itk.", x.tingkat) : ""}</span></div><p>${esc(x.ringkas)}</p><div class="hdr-isu-b"><span>${ikon("kalender", 14)} ${esc(t("hdr.i.terbaru"))}: ${esc(x.terbaru ? tanggal(x.terbaru) : "-")}</span>${bukti(x.bukti || "media", { sumber: "isu.json", tanggal: B.isu?.tanggal_ambil || "" })}<a class="rg3-tautan" href="/isu#${esc(x.id)}">${esc(t("hdr.i.rinci"))}</a></div></li>`;
const kartuKasus = (x) => `<li class="hdr-isu"><div class="hdr-isu-k"><b>${esc(x.nama)}</b><span>${pil("hdr.jn.", x.jenis)}</span></div><p class="hdr-lokasi">${ikon("lokasi", 14)}<span>${esc(tx(x.lokasi))}</span></p><ul class="hdr-mini">${(x.sebab || []).slice(0, 3).map((s) => `<li>${esc(tx(s))}</li>`).join("")}</ul>${x.terdampak ? `<p class="jm-bantu">${esc(t("hdr.i.terdampak"))}: ${esc(tx(x.terdampak))}</p>` : ""}<div class="hdr-isu-b">${bukti("media", { sumber: t("hdr.i.topik"), tanggal: B.tp?.diperbarui || "" })}<a class="rg3-tautan" href="/hidro?tab=dasar">${esc(t("hdr.i.rinci_topik"))}</a></div></li>`;
const kartuBaru = (x) => { const p = x.proyek_id ? proyekById(x.proyek_id) : null; return `<li class="hdr-isu"><div class="hdr-isu-k"><b>${esc(x.nama)}</b><span>${pil("hdr.jn.", x.jenis)}</span></div><p class="hdr-lokasi">${ikon("lokasi", 14)}<span>${esc(tx(x.lokasi))}</span></p><p>${esc(tx(x.teks))}</p>${p ? `<p class="jm-bantu">${esc(t("hdr.m.proyek"))}: ${esc(p.nama)}</p>` : ""}<div class="hdr-isu-b">${x.org_id ? orgLogoSel(x.org_id) : ""}${buktiS(x.sumber_id, x.tingkat_bukti)}</div></li>`; };
export function mulai(el) {
  if (!B.hd) { el.innerHTML = kosongTab("hdr.kosong"); return; }
  const k = kasus(), i = isuJson(), b = B.hd.isu.baru;
  el.innerHTML = [
    ex({ id: "hdr-i-baru", ikon: "peringatan", topik: t("hdr.i.ey.baru"), judulHtml: esc(t("hdr.i.j.baru", { n: b.length })), subHtml: esc(t("hdr.i.s.baru")), isiHtml: `<ul class="hdr-isu-daftar">${b.map(kartuBaru).join("")}</ul>${catatan("hdr.i.n.baru")}`, kakiHtml: kakiSumber(b.flatMap((x) => [x.sumber_id, x.sumber_id2])) }),
    ex({ id: "hdr-i-kasus", ikon: "tanya", topik: t("hdr.i.ey.kasus"), judulHtml: esc(t("hdr.i.j.kasus", { n: k.length })), subHtml: esc(t("hdr.i.s.kasus")), isiHtml: `<ul class="hdr-isu-daftar">${k.map(kartuKasus).join("")}</ul>${catatan("hdr.i.n.kasus")}` }),
    ex({ id: "hdr-i-isu", ikon: "peringatan", topik: t("hdr.i.ey"), judulHtml: esc(t("hdr.i.j", { n: i.length })), subHtml: esc(t("hdr.i.s")), isiHtml: `<ul class="hdr-isu-daftar">${i.map(kartuIsu).join("")}</ul>${catatan("hdr.i.n")}` }),
  ].join("");
  siapTautan("org", "proyek").then(() => naikkan(el));
}
