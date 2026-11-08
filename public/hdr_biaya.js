/* /hidro, tab Biaya dan LCOE: capex, faktor kapasitas, dan opex dari biaya_bangun.json (IRENA 2024, rendah/tengah/tinggi); LCOE dihitung METI (EST) = (capex x CRF + opex) / energi, WACC dan umur adalah asumsi (Hipotesis). Rincian sipil/mekanis/listrik dari komponen biaya. */
import { B, t, ex, num, esc, ikon, tx, bukti, kakiSumber, tabel, batangSvg, kolomSvg, tipHtml, kosongTab, daftarCelah, luar, catatan, lcoe } from "/hdr_umum.js";

const skala = (id) => (B.bb?.skala || []).find((s) => s.id === id);
const A = () => B.hd.biaya.asumsi;
function kasus(s, cfSumber) {
  const c = s.capex_usd_kw, f = (cfSumber || s).cf_persen, o = A().opex_persen, w = A().wacc_persen[1], u = A().umur_tahun;
  const hit = (capex, cf, opexPct) => lcoe({ capex, cf, opexPct, wacc: w, umur: u });
  return { rendah: hit(c.rendah, f.tinggi, o[0]), tengah: hit(c.tengah, f.tengah, o[0]), tinggi: hit(c.tinggi, f.rendah, o[1]) };
}
function baris() {
  return B.hd.rujukan.biaya_skala_ids.map(skala).filter(Boolean).map((s) => ({ s, k: kasus(s, skala("plta-dunia")) }));
}
function tabelBiaya() {
  const el = document.getElementById("hdr-c-tab"); if (!el) return;
  tabel(el, { satuan: "hdr.u.skenario", per: 8, urutAwal: 0, menurun: false, kolom: [
    { label: t("hdr.c.skenario"), v: (r) => r.s.nama, f: (r) => `<span class="rg3-idk"><b>${esc(r.s.nama)}</b><small>${esc(t("hdr.c.mw_contoh", { mw: r.s.mw_contoh }))}</small></span>` },
    { label: t("hdr.c.capex"), num: true, v: (r) => r.s.capex_usd_kw.tengah, f: (r) => `<span class="rg3-idk"><b>${esc(num(r.s.capex_usd_kw.tengah, 0))}</b><small>${esc(num(r.s.capex_usd_kw.rendah, 0))} - ${esc(num(r.s.capex_usd_kw.tinggi, 0))}</small></span>` },
    { label: t("hdr.c.lcoe_rendah"), num: true, v: (r) => r.k.rendah, f: (r) => esc(num(r.k.rendah, 0)) },
    { label: t("hdr.c.lcoe_tengah"), num: true, v: (r) => r.k.tengah, f: (r) => `<b>${esc(num(r.k.tengah, 0))}</b>` },
    { label: t("hdr.c.lcoe_tinggi"), num: true, v: (r) => r.k.tinggi, f: (r) => esc(num(r.k.tinggi, 0)) },
    { label: t("hdr.c.bukti"), v: () => "", f: (r) => bukti(r.s.capex_usd_kw.tingkat_bukti || "resmi", { sumber: "IRENA", tanggal: r.s.capex_usd_kw.tanggal || "" }) },
  ], baris: baris() });
}
function grafikWacc() {
  const g = document.getElementById("hdr-c-g1"); if (!g) return;
  const s = skala("plta-dunia"), o = A().opex_persen[0];
  g.innerHTML = kolomSvg({ el: g, satuan: "US$/MWh", label: t("hdr.c.j.wacc"), seri: [{ k: "v", kelas: "hdr-s-lcoe" }],
    kategori: A().wacc_persen.map((w) => { const v = lcoe({ capex: s.capex_usd_kw.tengah, cf: s.cf_persen.tengah, opexPct: o, wacc: w, umur: A().umur_tahun }); return { label: `${w}%`, nilai: { v }, tip: `WACC ${w}%`, th: tipHtml(`WACC ${w}%`, [["US$/MWh", num(v, 1)], [t("hdr.c.est"), t("hdr.est")]]) }; }) });
}
function grafikRincian() {
  const g = document.getElementById("hdr-c-g2"); if (!g) return;
  const k = (B.bb?.komponen || []).find((c) => c.id === B.hd.rujukan.biaya_komponen_id); if (!k) return;
  g.innerHTML = batangSvg({ el: g, d: 0, satuan: "%", label: t("hdr.c.j.rincian"), seri: [{ k: "sipil", kelas: "hdr-s-sipil" }, { k: "mekanis", kelas: "hdr-s-mekanis" }, { k: "listrik", kelas: "hdr-s-listrik" }],
    baris: k.bagian.map((b) => ({ label: b.k, tip: b.k, th: tipHtml(b.k, [[t("hdr.c.sipil"), num(b.sipil, 0) + "%"], [t("hdr.c.mekanis"), num(b.mekanis, 0) + "%"], [t("hdr.c.listrik"), num(b.listrik, 0) + "%"]]), bagian: [{ k: "sipil", nilai: b.sipil }, { k: "mekanis", nilai: b.mekanis }, { k: "listrik", nilai: b.listrik }] })) });
}
export function mulai(el) {
  if (!B.hd || !B.bb || !skala("plta-dunia")) { el.innerHTML = kosongTab("hdr.kosong"); return; }
  const s = skala("plta-dunia"), k = kasus(s), irena = s.lcoe_usd_mwh?.tengah, kurs = B.bb.kurs_rp_usd?.nilai;
  const kartu = (ik, judul, nilai, satuan, ket) => `<div class="rg3-kartu"><div class="rg3-k-kep">${ikon(ik, 22)}<b>${esc(judul)}</b></div><p class="hdr-angka">${esc(nilai)} <small>${esc(satuan)}</small></p><p class="jm-bantu">${esc(ket)}</p>${bukti("est", { sumber: "METI", tanggal: B.hd.tanggal })}</div>`;
  const ubin = [
    kartu("kalkulator", t("hdr.c.k.tengah"), num(k.tengah, 0), "US$/MWh", t("hdr.c.k.tengah_ket", { w: A().wacc_persen[1], u: A().umur_tahun, irena: irena != null ? num(irena, 0) : "-" })),
    kartu("grafik", t("hdr.c.k.rentang"), `${num(k.rendah, 0)} - ${num(k.tinggi, 0)}`, "US$/MWh", t("hdr.c.k.rentang_ket")),
    kurs ? kartu("tag", t("hdr.c.k.rp"), num((k.tengah * kurs) / 1000, 0), "Rp/kWh", t("hdr.c.k.rp_ket", { kurs: num(kurs, 0) })) : "",
  ].join("");
  el.innerHTML = [
    ex({ id: "hdr-c-hitung", ikon: "kalkulator", topik: t("hdr.c.ey.hitung"), judulHtml: esc(t("hdr.c.j.hitung")), subHtml: esc(t("hdr.c.s.hitung")), isiHtml: `<div class="rg3-kisi">${ubin}</div><p class="jm-bantu ih-catatan">${esc(tx(A().ket))}</p>${catatan("hdr.c.n.rumus")}` }),
    ex({ id: "hdr-c-skenario", ikon: "tabel", topik: t("hdr.c.ey.skenario"), judulHtml: esc(t("hdr.c.j.skenario")), subHtml: esc(t("hdr.c.s.skenario")), isiHtml: `<div id="hdr-c-tab"></div>${catatan("hdr.c.n.skenario")}` }),
    ex({ id: "hdr-c-sens", ikon: "grafik", topik: t("hdr.c.ey.sens"), judulHtml: esc(t("hdr.c.j.sens")), subHtml: esc(t("hdr.c.s.sens")), isiHtml: `<div id="hdr-c-g1" class="hdr-grafik"></div><div id="hdr-c-g2" class="hdr-grafik"></div>${catatan("hdr.c.n.sens")}${daftarCelah(B.hd.celah.slice(4, 6))}` }),
  ].join("");
  tabelBiaya(); grafikWacc(); grafikRincian();
}
