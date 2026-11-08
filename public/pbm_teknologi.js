/* /panas-bumi, tab Teknologi dan pemasok: jenis siklus (uap kering, flash, binari) dan pemasok turbin/ORC dari pemasok_lain.json (Fuji, Toshiba, MHI, Ansaldo, Ormat), unit yang tertaut siaran. */
import { B, t, ex, esc, ikon, tx, buktiS, kakiSumber, tabel, kosongTab, daftarCelah, orgLogoSel, siapTautan, naikkan, bendera, namaNegara, luar, catatan, bukti, orgNama } from "/pbm_umum.js";

const IK = { "uap-kering": "tek-panas", flash: "air-energi", binary: "tek-listrik" };
function tabPemasok() {
  const el = document.getElementById("pbm-t-tab"); if (!el) return;
  const T = B.pb.teknologi, sub = T.pemasok_subsegmen;
  const baris = (B.lain?.baris || []).filter((b) => (b.segmen || []).includes(B.pb.rujukan.pemasok_segmen) && (b.subsegmen || []).some((s) => sub.includes(s)));
  tabel(el, { satuan: "pbm.u.pemasok", per: 8, urutAwal: 0, menurun: false, kolom: [
    { label: t("pbm.c.pemasok"), v: (b) => b.nama, f: (b) => orgLogoSel(b.organisasi_id, b.nama) },
    { label: t("pbm.c.negara"), v: (b) => b.negara_iso2, f: (b) => `<span class="rg3-neg">${bendera(b.negara_iso2, 20)}<span>${esc(namaNegara(b.negara_iso2))}</span></span>` },
    { label: t("pbm.c.teknologi"), v: (b) => (b.subsegmen || []).join(), f: (b) => (b.subsegmen || []).filter((s) => sub.includes(s)).map((s) => `<span class="jm-pil">${esc(t("pbm.sub." + s))}</span>`).join(" ") },
    { label: t("pbm.c.unit"), v: (b) => (T.unit_pemasok.some((u) => u.org_pemasok === b.organisasi_id) ? 1 : 0), f: (b) => { const u = T.unit_pemasok.filter((x) => x.org_pemasok === b.organisasi_id); return u.length ? `<ul class="pbm-mini">${u.map((x) => `<li>${esc(tx(x.unit))} ${buktiS(x.sumber_id, x.tingkat_bukti)}</li>`).join("")}</ul>` : `<span class="jm-bantu">${esc(t("pbm.t.unit_belum"))}</span>`; } },
    { label: t("pbm.c.situs"), v: () => "", f: (b) => (b.halaman_indonesia ? luar(b.halaman_indonesia, t("pbm.t.halaman_id")) : luar(b.situs, t("pbm.situs"))) },
  ], baris });
}
export function mulai(el) {
  if (!B.pb) { el.innerHTML = kosongTab("pbm.kosong"); return; }
  const T = B.pb.teknologi;
  const kartu = (x) => `<div class="rg3-kartu"><div class="rg3-k-kep">${ikon(IK[x.k] || "info", 22)}<b>${esc(t("pbm.t.k." + x.k))}</b></div><p class="jm-bantu">${esc(tx(x.teks))}</p>${x.sumber_id ? buktiS(x.sumber_id, x.tingkat_bukti) : bukti("editorial", { sumber: "METI" })}</div>`;
  el.innerHTML = [
    ex({ id: "pbm-t-jenis", ikon: "tek-panas", topik: t("pbm.t.ey.jenis"), judulHtml: esc(t("pbm.t.j.jenis")), subHtml: esc(t("pbm.t.s.jenis")), isiHtml: `<div class="rg3-kisi">${T.jenis.map(kartu).join("")}</div>`, kakiHtml: kakiSumber(["pge_kmj"]) }),
    ex({ id: "pbm-t-pem", ikon: "pabrik", topik: t("pbm.t.ey.pem"), judulHtml: esc(t("pbm.t.j.pem", { n: (T.kata_kunci || []).length })), subHtml: esc(t("pbm.t.s.pem")), isiHtml: `<div id="pbm-t-tab"></div>${catatan("pbm.t.n.pem")}`, kakiHtml: kakiSumber(["toshiba-patuha", "tge-dieng-toshiba"]) }),
    ex({ id: "pbm-t-celah", ikon: "tanya", topik: t("pbm.ey.celah"), judulHtml: esc(t("pbm.j.celah")), isiHtml: daftarCelah([B.pb.celah[4]]) }),
  ].join("");
  tabPemasok();
  siapTautan("org").then(() => naikkan(el));
}
