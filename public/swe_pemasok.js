/* /sampah-energi, tab Teknologi pemasok global: negara asal pemasok WTE dari global/pemasok_wte.json (29 pemasok, 10 negara), proyek Indonesia yang tertaut, pendanaan pendamping; alur impor dicatat sebagai celah. */
import { B, t, ex, num, esc, ikon, tx, buktiS, kakiSumber, tabel, batangSvg, tipHtml, kosongTab, daftarCelah, catatan, luar, bendera, namaNegara, orgLogoSel, siapTautan, naikkan, tautProyek, negaraIso } from "/swe_umum.js";

const NEG = () => (B.wte?.negara || []).map((n) => ({ ...n, nama: namaNegara(n.iso2), n: n.penyedia_ids.length, proyek: (B.wte.baris || []).filter((b) => b.negara === n.iso2).reduce((s, b) => s + (b.indonesia || []).length, 0) }));
const bendNeg = (iso) => `<span class="rg3-neg">${bendera(iso, 20)}<span>${esc(namaNegara(iso))}</span></span>`;
const chipList = (a, awalan) => (a || []).map((x) => `<span class="jm-pil">${esc(t(awalan + x))}</span>`).join(" ");
function grafik() {
  const g = document.getElementById("swe-p-gr"); if (!g) return;
  const a = NEG().sort((x, y) => y.n - x.n || y.proyek - x.proyek);
  g.innerHTML = batangSvg({ el: g, d: 0, satuan: t("swe.u.pemasok"), label: t("swe.p.j.gr"), seri: [{ k: "n", kelas: "swe-s-pem" }, { k: "p", kelas: "swe-s-inv" }],
    baris: a.map((n) => ({ label: n.nama, bendera: negaraIso(n.iso2), tip: n.nama, th: tipHtml(n.nama, [[t("swe.u.pemasok"), num(n.n, 0)], [t("swe.p.proyek_id"), num(n.proyek, 0)], [t("swe.p.dana"), (n.pendanaan_pendamping || []).join(", ") || "-"]]), bagian: [{ k: "n", nilai: n.n }] })) });
}
function tabNegara() {
  const el = document.getElementById("swe-p-neg"); if (!el) return;
  tabel(el, { satuan: "swe.u.negara", per: 10, urutAwal: 1, menurun: true, kolom: [
    { label: t("swe.c.negara"), v: (n) => n.nama, f: (n) => bendNeg(n.iso2) },
    { label: t("swe.u.pemasok"), num: true, v: (n) => n.n, f: (n) => `<b>${esc(num(n.n, 0))}</b>` },
    { label: t("swe.c.proyek_id"), num: true, v: (n) => n.proyek, f: (n) => (n.proyek ? esc(num(n.proyek, 0)) : `<span class="jm-bantu">${esc(t("swe.belum_ada"))}</span>`) },
    { label: t("swe.c.teknologi"), v: (n) => (n.teknologi || []).join(), f: (n) => chipList(n.teknologi, "swe.tek.") },
    { label: t("swe.c.komponen"), v: (n) => (n.komponen || []).join(), f: (n) => chipList(n.komponen, "swe.komp.") },
    { label: t("swe.p.dana"), v: (n) => (n.pendanaan_pendamping || []).join(), f: (n) => esc((n.pendanaan_pendamping || []).join(", ") || "-") },
  ], baris: NEG() });
}
function tabPemasok() {
  const el = document.getElementById("swe-p-tab"); if (!el) return;
  tabel(el, { satuan: "swe.u.pemasok", per: 8, urutAwal: 0, menurun: false, kolom: [
    { label: t("swe.c.pemasok"), v: (b) => b.nama, f: (b) => orgLogoSel(b.organisasi_id_ada || b.id, b.nama) },
    { label: t("swe.c.negara"), v: (b) => b.negara, f: (b) => bendNeg(b.negara) },
    { label: t("swe.c.teknologi"), v: (b) => (b.teknologi || []).join(), f: (b) => chipList(b.teknologi, "swe.tek.") },
    { label: t("swe.c.komponen"), v: (b) => (b.komponen || []).join(), f: (b) => chipList(b.komponen, "swe.komp.") },
    { label: t("swe.c.proyek_id"), num: true, v: (b) => (b.indonesia || []).length, f: (b) => ((b.indonesia || []).length ? `<ul class="swe-mini">${b.indonesia.map((x) => `<li>${tautProyek(x.proyek_id, x.proyek)}</li>`).join("")}</ul>` : `<span class="jm-bantu">${esc(t("swe.belum_ada"))}</span>`) },
    { label: t("swe.c.situs"), v: () => "", f: (b) => luar(b.situs, t("swe.situs")) },
  ], baris: B.wte.baris });
  siapTautan("org", "proyek").then(() => naikkan(el));
}
export function mulai(el) {
  if (!B.sw || !B.wte) { el.innerHTML = kosongTab("swe.kosong"); return; }
  const N = NEG(), butir = B.sw.pemasok.butir.map((x) => `<li>${ikon("globe", 18)}<div><p>${esc(tx(x.teks))}</p>${buktiS(x.sumber_id, x.tingkat_bukti)}</div></li>`).join("");
  el.innerHTML = [
    ex({ id: "swe-p-negara", ikon: "globe", topik: t("swe.p.ey.negara"), judulHtml: esc(t("swe.p.j.negara", { n: B.wte.baris.length, k: N.length })), subHtml: esc(t("swe.p.s.negara")), isiHtml: `<div id="swe-p-gr"></div><div id="swe-p-neg"></div>${catatan("swe.p.n.negara")}`, kakiHtml: kakiSumber(["teknologi", "bisnis-asing", "katadata-85"]) }),
    ex({ id: "swe-p-pem", ikon: "pabrik", topik: t("swe.p.ey.pem"), judulHtml: esc(t("swe.p.j.pem", { n: B.wte.baris.length })), subHtml: esc(t("swe.p.s.pem")), isiHtml: `<div id="swe-p-tab"></div>${catatan("swe.p.n.pem")}` }),
    ex({ id: "swe-p-kait", ikon: "info", topik: t("swe.p.ey.kait"), judulHtml: esc(t("swe.p.j.kait")), subHtml: esc(t("swe.p.s.kait")), isiHtml: `<ul class="swe-daftar">${butir}</ul><p class="jm-bantu ih-catatan">${esc(B.wte.alur_impor?.catatan || "")}</p>${daftarCelah([B.sw.celah[5]])}`, kakiHtml: kakiSumber(B.sw.pemasok.butir.map((x) => x.sumber_id)) }),
  ].join("");
  grafik(); tabNegara(); tabPemasok();
  siapTautan("org").then(() => naikkan(el));
}
