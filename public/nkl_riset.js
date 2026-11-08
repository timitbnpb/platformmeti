/* /nuklir, tab Reaktor riset BRIN: RSG-GAS Serpong, TRIGA Bandung, TRIGA Kartini Yogyakarta; fungsi, daya, program revitalisasi, kartu butir rsg dari energi_baru.json. */
import { B, t, ex, num, esc, ikon, tx, buktiS, butir, kakiSumber, tabel, kosongTab, pil, catatan, enbBaris, enbKartu, orgLogoSel, tautProvinsi, idSumber, kartu, siapTautan, naikkan, daftarCelah } from "/nkl_umum.js";

function tabReaktor() {
  const el = document.getElementById("nkl-s-tab"); if (!el) return;
  tabel(el, { satuan: "nkl.u.reaktor", per: 5, urutAwal: 3, menurun: false, kolom: [
    { label: t("nkl.c.reaktor"), v: (r) => r.nama, f: (r) => `<span class="rg3-idk"><b>${esc(r.nama)}</b><small>${esc(r.lokasi)}</small></span>` },
    { label: t("nkl.c.provinsi"), v: (r) => r.prov_kode, f: (r) => tautProvinsi(r.prov_kode) },
    { label: t("nkl.c.daya"), num: true, v: (r) => r.daya?.nilai ?? -1, f: (r) => (r.daya ? `<b>${esc(num(r.daya.nilai, 0))}</b> <small>${esc(r.daya.satuan)}</small>` : `<span class="jm-bantu">${esc(t("nkl.s.daya_beda"))}</span>`) },
    { label: t("nkl.c.tahun"), num: true, v: (r) => r.tahun, f: (r) => esc(String(r.tahun)) },
    { label: t("nkl.c.fungsi"), v: (r) => r.fungsi.join(), f: (r) => r.fungsi.map((k) => `<span class="jm-pil">${esc(t("nkl.fn." + k))}</span>`).join(" ") },
    { label: t("nkl.c.status"), v: (r) => r.status, f: (r) => pil("nkl.st.", r.status) },
    { label: t("nkl.c.bukti"), v: (r) => r.tingkat_bukti, f: (r) => buktiS(r.sumber_id, r.tingkat_bukti) },
  ], baris: B.nk.riset.reaktor });
}
const keterangan = () => `<ul class="nkl-daftar">${B.nk.riset.reaktor.map((r) => `<li>${ikon("labu", 18)}<div><p><b>${esc(r.nama)}</b>: ${esc(tx(r.ket))}</p>${buktiS(r.sumber_id, r.tingkat_bukti)}</div></li>`).join("")}</ul>`;
export function mulai(el) {
  if (!B.nk) { el.innerHTML = kosongTab("nkl.kosong"); return; }
  const R = B.nk.riset, rsg = R.reaktor[0];
  const ubin = [kartu("labu", t("nkl.s.k.jumlah"), num(R.reaktor.length, 0), t("nkl.u.reaktor_k"), t("nkl.s.k.jumlah_ket"), rsg.sumber_id, rsg.tingkat_bukti), kartu("petir", t("nkl.s.k.rsg"), num(rsg.daya.nilai, 0), rsg.daya.satuan, tx(rsg.ket), rsg.sumber_tahun_id, "via-pihak-ketiga")].join("");
  el.innerHTML = [
    ex({ id: "nkl-s-ringkas", ikon: "labu", topik: t("nkl.s.ey.ringkas"), judulHtml: esc(t("nkl.s.j.ringkas")), subHtml: esc(t("nkl.s.s.ringkas")), isiHtml: `<div class="rg3-kisi">${ubin}</div>`, kakiHtml: kakiSumber(["rri-reaktor", "rsg"]) }),
    ex({ id: "nkl-s-daftar", ikon: "tabel", topik: t("nkl.s.ey.daftar"), judulHtml: esc(t("nkl.s.j.daftar", { n: R.reaktor.length })), subHtml: esc(t("nkl.s.s.daftar")), isiHtml: `<div id="nkl-s-tab"></div>${keterangan()}${catatan("nkl.s.n.daftar")}`, kakiHtml: kakiSumber(R.reaktor.flatMap(idSumber)) }),
    ex({ id: "nkl-s-revit", ikon: "ubah", topik: t("nkl.s.ey.revit"), judulHtml: esc(t("nkl.s.j.revit")), subHtml: esc(t("nkl.s.s.revit")), isiHtml: butir(R.revitalisasi, "info"), kakiHtml: kakiSumber(R.revitalisasi.map((x) => x.sumber_id).concat(["jawapos-brin"])) }),
    ex({ id: "nkl-s-celah", ikon: "tanya", topik: t("nkl.ey.celah"), judulHtml: esc(t("nkl.j.celah")), isiHtml: daftarCelah(B.nk.celah.filter((c) => /\/Daya reaktor\//.test(c))) }),
    ex({ id: "nkl-s-brin", ikon: "gedung", topik: t("nkl.s.ey.brin"), judulHtml: esc(t("nkl.s.j.brin")), subHtml: esc(t("nkl.s.s.brin")), isiHtml: `<div class="nkl-org-baris">${R.org_ids.map((id) => orgLogoSel(id)).join("")}</div>${enbKartu(enbBaris("nk-rsg-gas"))}` }),
  ].join("");
  tabReaktor();
  siapTautan("org", "provinsi").then(() => naikkan(el));
}
