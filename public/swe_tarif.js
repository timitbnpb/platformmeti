/* /sampah-energi, tab Tipping fee dan harga: tarif Perpres dari psel.json (regulasi), hitungan contoh (EST/Hipotesis) memakai ton per hari, MW, dan nilai investasi psel.json, tipping fee, nilai investasi pemberitaan. */
import { B, t, ex, num, esc, ikon, tx, buktiS, kakiSumber, tabel, batangSvg, tipHtml, kosongTab, daftarCelah, catatan, bukti, pselRows, pselById, pertama, statusDari } from "/swe_umum.js";

const CF = () => B.sw.tarif.contoh.faktor_kapasitas / 100;
const hip = () => bukti("hipotesis", { sumber: "METI", cara: t("swe.hip.cara") });
const estB = (cara) => bukti("est", { sumber: "psel.json, sampah_energi.json", cara });
/** Satu baris per tarif Perpres. */
function tarifBaris() {
  return (B.psel?.regulasi || []).flatMap((r) => (r.tarif || []).map((x) => ({ reg: r, ...x })));
}
function tabTarif() {
  const el = document.getElementById("swe-t-tab"); if (!el) return;
  tabel(el, { satuan: "swe.u.tarif", per: 8, urutAwal: 0, menurun: false, kolom: [
    { label: t("swe.c.peraturan"), v: (x) => x.reg.nomor, f: (x) => `<b>Perpres ${esc(x.reg.nomor)}</b>` },
    { label: t("swe.c.status"), v: (x) => x.reg.status, f: (x) => `<span class="rg3-teks">${esc(x.reg.status)}</span>` },
    { label: t("swe.c.syarat"), v: (x) => x.syarat, f: (x) => `<span class="rg3-teks">${esc(x.syarat)}</span>` },
    { label: t("swe.c.tarif"), num: true, v: (x) => x.usd_sen_per_kwh ?? 0, f: (x) => (x.usd_sen_per_kwh != null ? `<b>${esc(num(x.usd_sen_per_kwh, 2))}</b> <small>${esc(t("swe.u.sen_kwh"))}</small>` : `<span class="rg3-teks">${esc(x.rumus || "-")}</span>`) },
    { label: t("swe.c.pasal"), v: (x) => x.pasal || "", f: (x) => esc(x.pasal || "-") },
    { label: t("swe.c.bukti"), v: () => "", f: (x) => bukti(x.reg.tingkat_bukti || "resmi", { sumber: "BPK JDIH", tanggal: x.reg.tanggal || "" }) },
  ], baris: tarifBaris() });
}
function contoh() {
  const C = B.sw.tarif.contoh, r = pselById(C.psel_id), mw = pertama(r?.kapasitas_mw), ton = pertama(r?.kapasitas_ton_hari); if (!mw) return "";
  const gwh = mw * CF() * 8.76, juta = (gwh * 1000 * C.harga_usd_sen) / 100 / 1000; // GWh x 1e6 kWh x sen/100 = US$; /1e6 = juta
  const kartu = (ik, judul, nilai, satuan, ket, lencana) => `<div class="rg3-kartu"><div class="rg3-k-kep">${ikon(ik, 22)}<b>${esc(judul)}</b></div><p class="swe-angka">${esc(nilai)} <small>${esc(satuan)}</small></p><p class="jm-bantu">${esc(ket)}</p>${lencana}</div>`;
  return [
    kartu("kalkulator", t("swe.t.contoh_j", { mw: num(mw, 2), kota: r.kota }), num(juta, 1), t("swe.t.juta_th"), t("swe.t.contoh", { gwh: num(gwh, 0), cf: num(CF() * 100, 0), h: num(C.harga_usd_sen, 0) }) + " " + tx(C.ket), hip()),
    kartu("petir", t("swe.t.per_ton_j"), num((mw * 24 * CF()) / ton, 2), "MWh", t("swe.t.per_ton", { mw: num(mw, 2), ton: num(ton, 0) }), estB(t("swe.t.cara_ton"))),
  ].join("");
}
function perTon() {
  return pselRows().filter((r) => pertama(r.kapasitas_mw) && pertama(r.kapasitas_ton_hari)).map((r) => ({ r, v: (pertama(r.kapasitas_mw) * 24 * CF()) / pertama(r.kapasitas_ton_hari) }));
}
function grafikTon() {
  const g = document.getElementById("swe-t-gr"); if (!g) return;
  const a = perTon(); if (!a.length) { g.innerHTML = ""; return; }
  g.innerHTML = batangSvg({ el: g, d: 2, satuan: "MWh / ton", label: t("swe.t.j.gr"), seri: [{ k: "v", kelas: "swe-s-mwh" }],
    baris: a.sort((x, y) => y.v - x.v).map(({ r, v }) => ({ label: r.kota, tip: r.nama, th: tipHtml(r.nama, [["MW", num(pertama(r.kapasitas_mw), 1)], [t("swe.u.ton_hari"), num(pertama(r.kapasitas_ton_hari), 0)], ["MWh / ton (EST)", num(v, 2)]]), bagian: [{ k: "v", nilai: v }] })) });
}
function invest() {
  const a = pselRows().filter((r) => r.nilai_investasi.length && pertama(r.kapasitas_ton_hari)).map((r) => {
    const n = r.nilai_investasi[0], rp = n.satuan === "IDR" ? n.nilai : r.nilai_investasi.find((x) => x.satuan === "IDR")?.nilai, usd = n.satuan === "USD" ? n.nilai : null;
    return { r, n, rp, usd, perTd: rp ? rp / 1e9 / pertama(r.kapasitas_ton_hari) : null };
  }).filter((x) => x.perTd != null || x.usd != null);
  return a;
}
function tabInvest() {
  const el = document.getElementById("swe-t-inv"); if (!el) return;
  tabel(el, { satuan: "swe.u.proyek", per: 6, urutAwal: 2, menurun: true, kolom: [
    { label: t("swe.c.proyek_kota"), v: (x) => x.r.kota, f: (x) => `<span class="rg3-idk"><b>${esc(x.r.kota)}</b><small>${esc(x.r.provinsi)}</small></span>` },
    { label: t("swe.u.ton_hari"), num: true, v: (x) => pertama(x.r.kapasitas_ton_hari), f: (x) => esc(num(pertama(x.r.kapasitas_ton_hari), 0)) },
    { label: t("swe.t.c.nilai"), num: true, v: (x) => x.rp ?? x.usd ?? 0, f: (x) => (x.rp ? `${esc(num(x.rp / 1e12, 2))} <small>${esc(t("swe.u.triliun"))}</small>` : `${esc(num(x.usd / 1e6, 0))} <small>${esc(t("swe.u.juta_usd"))}</small>`) },
    { label: t("swe.t.c.per_td"), num: true, v: (x) => x.perTd ?? 0, f: (x) => (x.perTd != null ? `<b>${esc(num(x.perTd, 2))}</b> <small>${esc(t("swe.u.miliar_td"))}</small>` : "-") },
    { label: t("swe.c.bukti"), v: () => "", f: () => estB(t("swe.t.cara_inv")) },
  ], baris: invest() });
}
export function mulai(el) {
  if (!B.sw || !B.psel) { el.innerHTML = kosongTab("swe.kosong"); return; }
  const Tf = B.sw.tarif;
  const inv = Tf.investasi.map((x) => `<li>${ikon("tag", 18)}<div><p><b>${esc(tx(x.label))}</b>: ${esc(tx(x.nilai))}</p>${buktiS(x.sumber_id, x.tingkat_bukti)}</div></li>`).join("");
  el.innerHTML = [
    ex({ id: "swe-t-harga", ikon: "tag", topik: t("swe.t.ey.harga"), judulHtml: esc(t("swe.t.j.harga")), subHtml: esc(t("swe.t.s.harga")), isiHtml: `<div id="swe-t-tab"></div>${catatan("swe.t.n.harga")}`, kakiHtml: kakiSumber(["ashurst", "ombud"]) }),
    ex({ id: "swe-t-tip", ikon: "kartu", topik: t("swe.t.ey.tip"), judulHtml: esc(t("swe.t.j.tip")), subHtml: esc(t("swe.t.s.tip")), isiHtml: `<ul class="swe-daftar"><li>${ikon("info", 18)}<div><p>${esc(tx(Tf.tipping_fee.teks))}</p>${buktiS(Tf.tipping_fee.sumber_id, Tf.tipping_fee.tingkat_bukti)}</div></li></ul><p class="jm-bantu"><a href="/isu#psel-tipping-fee">${esc(t("swe.t.isu"))}</a></p>`, kakiHtml: kakiSumber([Tf.tipping_fee.sumber_id, Tf.tipping_fee.sumber_id2]) }),
    ex({ id: "swe-t-hitung", ikon: "kalkulator", topik: t("swe.t.ey.hitung"), judulHtml: esc(t("swe.t.j.hitung")), subHtml: esc(t("swe.t.s.hitung")), isiHtml: `<div class="rg3-kisi">${contoh()}</div><div id="swe-t-gr"></div>${catatan("swe.t.n.hitung")}`, kakiHtml: kakiSumber([Tf.contoh.sumber_id]) }),
    ex({ id: "swe-t-biaya", ikon: "grafik", topik: t("swe.t.ey.biaya"), judulHtml: esc(t("swe.t.j.biaya")), subHtml: esc(t("swe.t.s.biaya")), isiHtml: `<div id="swe-t-inv"></div><ul class="swe-daftar">${inv}</ul>${catatan("swe.t.n.biaya")}${daftarCelah([B.sw.celah[2], B.sw.celah[4]])}`, kakiHtml: kakiSumber(Tf.investasi.map((x) => x.sumber_id)) }),
  ].join("");
  tabTarif(); grafikTon(); tabInvest();
}
