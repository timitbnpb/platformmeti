/* /hidro, tab Pemasok turbin: pemasok hidro dari global/pemasok_lain.json (Voith, Andritz, GE Vernova, Toshiba, Harbin, Dongfang, Litostroj, Gilkes, Cink) dengan negara berbendera, plus kontraktor proyek bersumber. Pesanan unit per proyek belum ada (celah). */
import { B, t, ex, esc, tx, buktiS, kakiSumber, tabel, kosongTab, daftarCelah, orgLogoSel, siapTautan, naikkan, bendera, namaNegara, luar, catatan, bukti } from "/hdr_umum.js";

const pemasok = () => (B.lain?.baris || []).filter((b) => (b.segmen || []).includes(B.hd.rujukan.pemasok_segmen));
function tabPemasok() {
  const el = document.getElementById("hdr-s-tab"); if (!el) return;
  tabel(el, { satuan: "hdr.u.pemasok", per: 8, urutAwal: 0, menurun: false, kolom: [
    { label: t("hdr.c.pemasok"), v: (b) => b.nama, f: (b) => orgLogoSel(b.organisasi_id, b.nama) },
    { label: t("hdr.c.negara"), v: (b) => b.negara_iso2, f: (b) => `<span class="rg3-neg">${bendera(b.negara_iso2, 20)}<span>${esc(namaNegara(b.negara_iso2))}</span></span>` },
    { label: t("hdr.c.komponen"), v: (b) => (b.subsegmen || []).join(), f: (b) => (b.subsegmen || []).map((s) => `<span class="jm-pil">${esc(t("hdr.sub." + s))}</span>`).join(" ") },
    { label: t("hdr.c.unit"), v: () => 0, f: () => `<span class="jm-bantu">${esc(t("hdr.t.unit_belum"))}</span>` },
    { label: t("hdr.c.situs"), v: () => "", f: (b) => (b.halaman_indonesia ? luar(b.halaman_indonesia, t("hdr.t.halaman_id")) : luar(b.situs, t("hdr.situs"))) },
    { label: t("hdr.c.bukti"), v: () => "", f: () => bukti("via-pihak-ketiga", { sumber: "pemasok_lain.json", tanggal: B.lain?.dibangun_pada || "" }) },
  ], baris: pemasok() });
}
function tabKontraktor() {
  const el = document.getElementById("hdr-s-kon"); if (!el) return;
  tabel(el, { satuan: "hdr.u.kontraktor", per: 8, urutAwal: 0, menurun: false, kolom: [
    { label: t("hdr.c.kontraktor"), v: (k) => k.nama, f: (k) => orgLogoSel(k.org_id, k.nama) },
    { label: t("hdr.c.peran_proyek"), v: (k) => tx(k.proyek), f: (k) => `<span class="rg3-teks">${esc(tx(k.proyek))}</span>` },
    { label: t("hdr.c.bukti"), v: () => "", f: (k) => buktiS(k.sumber_id, k.tingkat_bukti) },
  ], baris: B.hd.pemasok.kontraktor });
}
export function mulai(el) {
  if (!B.hd) { el.innerHTML = kosongTab("hdr.kosong"); return; }
  const n = pemasok().length;
  el.innerHTML = [
    ex({ id: "hdr-s-pem", ikon: "pabrik", topik: t("hdr.t.ey.pem"), judulHtml: esc(t("hdr.t.j.pem", { n })), subHtml: esc(t("hdr.t.s.pem")), isiHtml: `<div id="hdr-s-tab"></div>${catatan("hdr.t.n.pem")}${daftarCelah([B.hd.celah[2]])}` }),
    ex({ id: "hdr-s-kontraktor", ikon: "koper", topik: t("hdr.t.ey.kon"), judulHtml: esc(t("hdr.t.j.kon")), subHtml: esc(t("hdr.t.s.kon")), isiHtml: `<div id="hdr-s-kon"></div>${catatan("hdr.t.n.kon")}`, kakiHtml: kakiSumber(B.hd.pemasok.kontraktor.map((k) => k.sumber_id)) }),
  ].join("");
  tabPemasok(); tabKontraktor();
  siapTautan("org").then(() => naikkan(el));
}
