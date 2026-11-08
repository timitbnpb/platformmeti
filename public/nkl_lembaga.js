/* /nuklir, tab NEPIO dan perizinan: status NEPIO, peta lembaga (ESDM, Bapeten, BRIN, PLN, DEN), tahapan izin Bapeten, dasar hukum dari regulasi.json lewat id, kerja sama regulasi. */
import { B, t, ex, num, esc, ikon, tx, buktiS, butir, kakiSumber, tabel, kosongTab, luar, pil, catatan, bukti, enbBaris, enbKartu, regBaris, tautRegulasi, orgLogoSel, orgNama, bendera, namaNegara, idSumber, siapTautan, naikkan, daftarCelah } from "/nkl_umum.js";

function peta() {
  const kartu = (p) => {
    const nama = p.nama || orgNama(p.org_id);
    return `<article class="nkl-pemain"><header class="nkl-pemain-k">${orgLogoSel(p.org_id, nama)}<p>${p.peran.map((r) => `<span class="jm-pil">${esc(t("nkl.peran." + r))}</span>`).join(" ")}</p></header>
      <ul class="nkl-daftar">${p.fakta.map((f) => `<li>${ikon("info", 16)}<div><p>${esc(tx(f.teks))}</p>${buktiS(f.sumber_id, f.tingkat_bukti)}</div></li>`).join("")}</ul></article>`;
  };
  return `<div class="nkl-pemain-kisi">${B.nk.lembaga.peta.map(kartu).join("")}</div>`;
}
const langkah = () => `<ol class="nkl-langkah">${B.nk.lembaga.tahap_izin.map((x, i) => `<li><span class="nkl-no" aria-hidden="true">${i + 1}</span><div><b>${esc(t("nkl.l.th." + x.k))}</b><p>${esc(tx(x.teks))}</p>${buktiS(x.sumber_id, x.tingkat_bukti)}</div></li>`).join("")}</ol>`;
const kerja = () => `<ul class="nkl-daftar">${B.nk.lembaga.kerja_sama.map((x) => `<li>${ikon("tautan", 18)}<div><p><span class="rg3-neg">${bendera(x.iso2, 18)}<span>${esc(namaNegara(x.iso2))}</span></span></p><p>${esc(tx(x.teks))}</p>${buktiS(x.sumber_id, x.tingkat_bukti)}</div></li>`).join("")}</ul>`;
function tabReg() {
  const el = document.getElementById("nkl-l-reg"); if (!el) return;
  tabel(el, { satuan: "nkl.u.reg", per: 8, urutAwal: 2, menurun: true, kolom: [
    { label: t("nkl.c.peraturan"), v: (r) => `${r.jenis} ${r.nomor}/${r.tahun}`, f: (r) => `<span class="rg3-idk"><b>${tautRegulasi(r.id, `${String(r.jenis).toUpperCase()} ${r.nomor}/${r.tahun}`)}</b><small>${esc(r.instansi_penerbit || "")}</small></span>` },
    { label: t("nkl.c.tentang"), v: (r) => r.judul, f: (r) => `<span class="rg3-teks">${esc(r.judul)}</span>` },
    { label: t("nkl.c.tahun"), num: true, v: (r) => r.tahun, f: (r) => esc(String(r.tahun)) },
    { label: t("nkl.c.status"), v: (r) => r.status, f: (r) => pil("nkl.rst.", r.status) },
    { label: t("nkl.c.sumber"), v: () => "", f: (r) => (r.url_sumber ? luar(r.url_sumber, t("nkl.buka")) : "-") },
    { label: t("nkl.c.bukti"), v: () => "", f: (r) => bukti("resmi", { sumber: r.instansi_penerbit || "JDIH", tanggal: r.tanggal_ambil || "" }) },
  ], baris: regBaris(B.nk.rujukan.regulasi_lembaga) });
}
export function mulai(el) {
  if (!B.nk) { el.innerHTML = kosongTab("nkl.kosong"); return; }
  const L = B.nk.lembaga, n = regBaris(B.nk.rujukan.regulasi_lembaga).length;
  el.innerHTML = [
    ex({ id: "nkl-l-nepio", ikon: "gedung", topik: t("nkl.l.ey.nepio"), judulHtml: esc(t("nkl.l.j.nepio")), subHtml: esc(t("nkl.l.s.nepio")), isiHtml: `${butir(L.nepio, "info")}${enbKartu(enbBaris("nk-nepio"))}`, kakiHtml: kakiSumber(L.nepio.flatMap(idSumber).concat(["petromindo-nepio", "kompas-nepio"])) }),
    ex({ id: "nkl-l-peta", ikon: "denah", topik: t("nkl.l.ey.peta"), judulHtml: esc(t("nkl.l.j.peta", { n: L.peta.length })), subHtml: esc(t("nkl.l.s.peta")), isiHtml: peta() + catatan("nkl.l.n.peta"), kakiHtml: kakiSumber(L.peta.flatMap((p) => p.fakta.flatMap(idSumber))) }),
    ex({ id: "nkl-l-izin", ikon: "tiket", topik: t("nkl.l.ey.izin"), judulHtml: esc(t("nkl.l.j.izin")), subHtml: esc(t("nkl.l.s.izin")), isiHtml: langkah() + catatan("nkl.l.n.izin"), kakiHtml: kakiSumber(L.tahap_izin.map((x) => x.sumber_id).concat(["bapeten-sp003", "bisnis-thorcon", "detik-bapeten-proses"])) }),
    ex({ id: "nkl-l-hukum", ikon: "palu", topik: t("nkl.l.ey.hukum"), judulHtml: esc(t("nkl.l.j.hukum", { n })), subHtml: esc(t("nkl.l.s.hukum")), isiHtml: `<div id="nkl-l-reg"></div>${catatan("nkl.l.n.hukum")}<p class="jm-bantu"><a href="/regulasi">${esc(t("nkl.l.semua"))}</a></p>`, kakiHtml: kakiSumber(["uu10", "pp2", "ken", "korea"]) }),
    ex({ id: "nkl-l-kerja", ikon: "globe", topik: t("nkl.l.ey.kerja"), judulHtml: esc(t("nkl.l.j.kerja")), subHtml: esc(t("nkl.l.s.kerja")), isiHtml: kerja(), kakiHtml: kakiSumber(L.kerja_sama.map((x) => x.sumber_id)) }),
    ex({ id: "nkl-l-celah", ikon: "tanya", topik: t("nkl.ey.celah"), judulHtml: esc(t("nkl.j.celah")), isiHtml: daftarCelah(B.nk.celah.filter((c) => /\/NEPIO\//.test(c))) }),
  ].join("");
  tabReg();
  siapTautan("org", "regulasi").then(() => naikkan(el));
}
