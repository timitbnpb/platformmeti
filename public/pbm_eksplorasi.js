/* /panas-bumi, tab Eksplorasi dan pengeboran: risiko dan biaya sumur, program government drilling, pendanaan risiko (PISP, GREM), rig dan jasa (pemasok dari pemasok_lain.json). */
import { B, t, ex, num, esc, ikon, tx, buktiS, kakiSumber, tabel, kosongTab, daftarCelah, orgLogoSel, siapTautan, naikkan, bendera, namaNegara, luar, catatan, bukti } from "/pbm_umum.js";

function risiko() {
  const R = Object.fromEntries(B.pb.eksplorasi.risiko.map((x) => [x.k, x])), bb = B.bb?.komponen?.find((c) => c.id === B.pb.rujukan.biaya_bangun_id), mak = bb?.bagian?.[0]?.persen_maks;
  const kartu = (ik, k, nilai, satuan, sid, tb, ket) => `<div class="rg3-kartu"><div class="rg3-k-kep">${ikon(ik, 22)}<b>${esc(t("pbm.e.r." + k))}</b></div><p class="pbm-angka">${esc(nilai)} <small>${esc(satuan)}</small></p>${ket ? `<p class="jm-bantu">${esc(ket)}</p>` : ""}${buktiS(sid, tb)}</div>`;
  return [
    kartu("sasaran", "sukses_eksplorasi", `${R.sukses_eksplorasi.nilai} / ${R.sukses_pengembangan.nilai} / ${R.sukses_operasi.nilai}`, "%", "esmap", "kajian", t("pbm.e.r.sukses_ket")),
    kartu("kartu", "biaya_sumur", R.biaya_sumur.nilai, R.biaya_sumur.satuan, R.biaya_sumur.sumber_id, R.biaya_sumur.tingkat_bukti),
    kartu("grafik", "porsi_bor", R.porsi_bor.nilai, R.porsi_bor.satuan, R.porsi_bor.sumber_id, R.porsi_bor.tingkat_bukti, mak ? t("pbm.e.r.porsi_ket", { m: mak }) : ""),
    kartu("tag", "usd_per_mw", R.usd_per_mw.nilai, R.usd_per_mw.satuan, R.usd_per_mw.sumber_id, R.usd_per_mw.tingkat_bukti, t("pbm.e.r.lama")),
  ].join("");
}
const butir = (arr) => `<ul class="pbm-daftar">${arr.map((x) => `<li>${ikon("info", 18)}<div><p>${esc(tx(x.teks))}</p>${buktiS(x.sumber_id, x.tingkat_bukti)}</div></li>`).join("")}</ul>`;
function tabPemasok() {
  const el = document.getElementById("pbm-e-pem-tab"); if (!el) return;
  const sub = B.pb.eksplorasi.pemasok_subsegmen;
  const baris = (B.lain?.baris || []).filter((b) => (b.segmen || []).includes(B.pb.rujukan.pemasok_segmen) && (b.subsegmen || []).some((s) => sub.includes(s)));
  tabel(el, { satuan: "pbm.u.pemasok", per: 8, urutAwal: 0, menurun: false, kolom: [
    { label: t("pbm.c.pemasok"), v: (b) => b.nama, f: (b) => orgLogoSel(b.organisasi_id, b.nama) },
    { label: t("pbm.c.negara"), v: (b) => b.negara_iso2, f: (b) => `<span class="rg3-neg">${bendera(b.negara_iso2, 20)}<span>${esc(namaNegara(b.negara_iso2))}</span></span>` },
    { label: t("pbm.c.jasa"), v: (b) => (b.subsegmen || []).join(), f: (b) => (b.subsegmen || []).filter((s) => sub.includes(s)).map((s) => `<span class="jm-pil">${esc(t("pbm.sub." + s))}</span>`).join(" ") },
    { label: t("pbm.c.situs"), v: () => "", f: (b) => luar(b.situs, t("pbm.situs")) },
    { label: t("pbm.c.bukti"), v: () => "", f: () => bukti("via-pihak-ketiga", { sumber: "pemasok_lain.json", tanggal: B.lain?.dibangun_pada || "" }) },
  ], baris });
}
export function mulai(el) {
  if (!B.pb) { el.innerHTML = kosongTab("pbm.kosong"); return; }
  const E = B.pb.eksplorasi;
  el.innerHTML = [
    ex({ id: "pbm-e-risiko", ikon: "sasaran", topik: t("pbm.e.ey.risiko"), judulHtml: esc(t("pbm.e.j.risiko")), subHtml: esc(t("pbm.e.s.risiko")), isiHtml: `<div class="rg3-kisi">${risiko()}</div>${catatan("pbm.e.n.risiko")}`, kakiHtml: kakiSumber(["esmap", "lemigas", "stanford"]) }),
    ex({ id: "pbm-e-gd", ikon: "pabrik", topik: t("pbm.e.ey.gd"), judulHtml: esc(t("pbm.e.j.gd")), subHtml: esc(t("pbm.e.s.gd")), isiHtml: butir(E.program) + catatan("pbm.e.n.gd"), kakiHtml: kakiSumber(E.program.map((x) => x.sumber_id)) }),
    ex({ id: "pbm-e-dana", ikon: "kartu", topik: t("pbm.e.ey.dana"), judulHtml: esc(t("pbm.e.j.dana")), subHtml: esc(t("pbm.e.s.dana")), isiHtml: butir(E.pendanaan), kakiHtml: kakiSumber(E.pendanaan.flatMap((x) => [x.sumber_id, x.sumber_id2])) }),
    ex({ id: "pbm-e-pem", ikon: "koper", topik: t("pbm.e.ey.pem"), judulHtml: esc(t("pbm.e.j.pem")), subHtml: esc(t("pbm.e.s.pem")), isiHtml: `<div id="pbm-e-pem-tab"></div>${catatan("pbm.e.n.pem")}` }),
    ex({ id: "pbm-e-celah", ikon: "tanya", topik: t("pbm.ey.celah"), judulHtml: esc(t("pbm.j.celah")), isiHtml: daftarCelah(B.pb.celah.slice(5)) }),
  ].join("");
  tabPemasok();
  siapTautan("org").then(() => naikkan(el));
}
