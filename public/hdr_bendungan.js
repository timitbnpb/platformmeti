/* /hidro, tab Bendungan PUPR: potensi PLTA pada bendungan (angka agregat studi PUPR), 10 bendungan prioritas KPBU PLTA/PLTM, contoh bendungan yang sudah berpembangkit (Jatigede). Daftar per bendungan lengkap tidak ada di sumber terbuka (celah). */
import { B, t, ex, num, esc, ikon, tx, bukti, buktiS, kakiSumber, tabel, batangSvg, tipHtml, kosongTab, daftarCelah, pil, tautProvinsi, proyekById, orgLogoSel, siapTautan, naikkan, catatan } from "/hdr_umum.js";

function angka() {
  const kartu = (x) => `<div class="rg3-kartu"><div class="rg3-k-kep">${ikon(x.k === "fpv" ? "tek-surya" : "air-energi", 22)}<b>${esc(t("hdr.b.k." + x.k))}</b></div><p class="hdr-angka">${esc(num(x.nilai, x.nilai % 1 ? 1 : 0))} <small>${esc(x.satuan)}</small></p>${x.n ? `<p class="jm-bantu">${esc(t("hdr.b.n_bendungan", { n: x.n }))}</p>` : ""}<p class="jm-bantu">${esc(tx(x.teks))}</p>${buktiS(x.sumber_id, x.tingkat_bukti)}</div>`;
  return B.hd.bendungan.angka.map(kartu).join("");
}
function grafik() {
  const g = document.getElementById("hdr-d-graf"); if (!g) return;
  const A = B.hd.bendungan.angka.filter((x) => x.satuan === "MW");
  g.innerHTML = batangSvg({ el: g, d: 0, satuan: "MW", label: t("hdr.b.j.graf"), seri: [{ k: "v", kelas: "hdr-s-mw" }],
    baris: A.map((x) => ({ label: t("hdr.b.k." + x.k), tip: t("hdr.b.k." + x.k), th: tipHtml(t("hdr.b.k." + x.k), [["MW", num(x.nilai, x.nilai % 1 ? 1 : 0)], [t("hdr.b.n_label"), String(x.n)], [t("hdr.b.mw_per"), num(x.nilai / x.n, 1)]]), bagian: [{ k: "v", nilai: x.nilai }] })) });
}
function tabPrioritas() {
  const el = document.getElementById("hdr-d-tab"); if (!el) return;
  tabel(el, { satuan: "hdr.u.bendungan", per: 10, urutAwal: 0, menurun: false, kolom: [
    { label: t("hdr.c.bendungan"), v: (b) => b.nama, f: (b) => `<b>${esc(b.nama)}</b>` },
    { label: t("hdr.c.provinsi"), v: (b) => b.prov, f: (b) => tautProvinsi(b.prov_kode, b.prov) },
    { label: t("hdr.c.skema"), v: (b) => b.skema, f: (b) => `<span class="jm-pil">${esc(b.skema)}</span>` },
    { label: t("hdr.c.mw"), num: true, v: (b) => b.mw ?? -1, f: (b) => (b.mw != null ? `<b>${esc(num(b.mw, 1))}</b> <small>${esc(proyekById(b.proyek_id)?.nama || "")}</small>` : `<span class="jm-bantu">${esc(t("hdr.belum_ada"))}</span>`) },
    { label: t("hdr.c.bukti"), v: () => "", f: (b) => buktiS(b.sumber_id, b.tingkat_bukti) },
  ], baris: B.hd.bendungan.prioritas });
}
export function mulai(el) {
  if (!B.hd) { el.innerHTML = kosongTab("hdr.kosong"); return; }
  const op = B.hd.bendungan.operasi_ids.map(proyekById).filter(Boolean);
  const contoh = op.map((p) => `<li>${ikon("petir", 18)}<div><p><b>${esc(p.nama)}</b> <small>${esc(num(p.mw, 0))} MW</small></p><p>${p.pemilik?.nama ? orgLogoSel(p.pemilik.org_id, p.pemilik.nama) : ""} ${pil("hdr.st.", p.status)}</p>${bukti("via-pihak-ketiga", { sumber: "GEM, RUPTL", tanggal: p.status_sumber?.tanggal || "" })}</div></li>`).join("");
  el.innerHTML = [
    ex({ id: "hdr-d-angka", ikon: "air-energi", topik: t("hdr.b.ey.angka"), judulHtml: esc(t("hdr.b.j.angka")), subHtml: esc(t("hdr.b.s.angka")), isiHtml: `<div id="hdr-d-graf" class="hdr-grafik"></div><div class="rg3-kisi">${angka()}</div>${catatan("hdr.b.n.angka")}`, kakiHtml: kakiSumber(B.hd.bendungan.angka.map((x) => x.sumber_id)) }),
    ex({ id: "hdr-d-prioritas", ikon: "kawasan", topik: t("hdr.b.ey.prioritas"), judulHtml: esc(t("hdr.b.j.prioritas", { n: B.hd.bendungan.prioritas.length })), subHtml: esc(t("hdr.b.s.prioritas")), isiHtml: `<div id="hdr-d-tab"></div>${catatan("hdr.b.n.prioritas")}${daftarCelah([B.hd.celah[1]])}`, kakiHtml: kakiSumber(["it-10bendungan"]) }),
    ex({ id: "hdr-d-contoh", ikon: "petir", topik: t("hdr.b.ey.contoh"), judulHtml: esc(t("hdr.b.j.contoh")), subHtml: esc(t("hdr.b.s.contoh")), isiHtml: `<ul class="hdr-daftar">${contoh}</ul><p class="jm-bantu"><a href="${esc(B.hd.rujukan.air_energi_href)}">${esc(t("hdr.s.air_energi"))}</a></p>` }),
  ].join("");
  grafik(); tabPrioritas();
  siapTautan("org", "provinsi").then(() => naikkan(el));
}
